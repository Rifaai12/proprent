import { db } from '../config/db.js';

const DEFAULT_GRAPH_API_VERSION = 'v22.0';

export class WhatsAppService {
  /**
   * Get active Meta Graph API version from environment or default to current v22.0
   */
  static getApiVersion() {
    return process.env.WHATSAPP_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
  }

  /**
   * Normalize destination phone number to E.164 without leading '+' as required by Meta WhatsApp Cloud API.
   * e.g. "+91 98450 12345" -> "919845012345"
   * e.g. "09876543210" -> "919876543210"
   * e.g. "9876543210" -> "919876543210"
   */
  static normalizePhoneNumber(phone, defaultCountryCode = '91') {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0 (national prefix), strip it
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = defaultCountryCode + cleaned.slice(1);
    }

    // If exactly 10 digits (e.g. standard Indian mobile), prepend default country code
    if (cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    }

    return cleaned;
  }

  /**
   * Get active Meta WhatsApp Cloud API credentials.
   * Explicit precedence:
   * 1. Environment Variables (WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID)
   * 2. Owner Settings (if environment variables are not set or if explicitly configured)
   */
  static getCredentials(ownerId) {
    const envToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const envWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    // Check environment variables first
    const hasEnvCreds = Boolean(envToken && envToken.trim().length > 10 && envPhoneId && envPhoneId.trim().length > 5);

    let ownerCreds = null;
    if (ownerId) {
      const settings = db.getSettingsForOwner(ownerId);
      const ownerWa = settings?.telecom_providers?.whatsapp_cloud;
      if (ownerWa?.access_token && ownerWa.access_token.trim().length > 10 && ownerWa?.phone_number_id) {
        ownerCreds = {
          accessToken: ownerWa.access_token.trim(),
          phoneNumberId: ownerWa.phone_number_id.trim(),
          wabaId: (ownerWa.business_account_id || '').trim(),
          source: 'OWNER_SETTINGS'
        };
      }
    }

    if (hasEnvCreds) {
      return {
        accessToken: envToken.trim(),
        phoneNumberId: envPhoneId.trim(),
        wabaId: (envWabaId || '').trim(),
        source: 'ENVIRONMENT_VARIABLES',
        hasOwnerOverride: Boolean(ownerCreds)
      };
    }

    if (ownerCreds) {
      return {
        ...ownerCreds,
        hasOwnerOverride: false
      };
    }

    return {
      accessToken: '',
      phoneNumberId: '',
      wabaId: '',
      source: 'NOT_CONFIGURED',
      hasOwnerOverride: false
    };
  }

  /**
   * Safe status summary for frontend. NEVER exposes the access token.
   */
  static getStatus(ownerId) {
    const creds = this.getCredentials(ownerId);
    const isConfigured = Boolean(creds.accessToken && creds.phoneNumberId);
    const version = this.getApiVersion();

    // Mask phone number ID to show only last 4 digits (e.g. ****2047)
    let maskedPhoneId = '';
    if (creds.phoneNumberId) {
      const p = creds.phoneNumberId;
      maskedPhoneId = p.length > 4 ? `****${p.slice(-4)}` : p;
    }

    return {
      isConfigured,
      source: creds.source,
      hasOwnerOverride: creds.hasOwnerOverride || false,
      phoneNumberId: maskedPhoneId,
      apiVersion: version,
      channel: 'whatsapp_cloud_api'
    };
  }

  /**
   * Verify credentials live with Meta by querying the Phone Number ID metadata.
   * Endpoint: GET https://graph.facebook.com/<VERSION>/<PHONE_NUMBER_ID>
   */
  static async verifyWithMeta(ownerId) {
    const creds = this.getCredentials(ownerId);
    if (!creds.accessToken || !creds.phoneNumberId) {
      return {
        verified: false,
        source: creds.source,
        error: 'Credentials not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.'
      };
    }

    const version = this.getApiVersion();
    const endpoint = `https://graph.facebook.com/${version}/${creds.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`;

    try {
      console.log(`[WHATSAPP DIAGNOSTIC] Verifying Phone Number ID with Meta (${version})...`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${creds.accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const err = data.error || {};
        console.error(`[WHATSAPP VERIFY FAILED] HTTP ${response.status}:`, err);
        return {
          verified: false,
          source: creds.source,
          httpStatus: response.status,
          error: err.message || `Meta API error ${response.status}`,
          code: err.code,
          subcode: err.error_subcode,
          type: err.type,
          fbtrace_id: err.fbtrace_id
        };
      }

      return {
        verified: true,
        source: creds.source,
        httpStatus: response.status,
        phoneId: data.id,
        displayPhoneNumber: data.display_phone_number || 'N/A',
        verifiedName: data.verified_name || 'N/A',
        qualityRating: data.quality_rating || 'UNKNOWN',
        codeVerificationStatus: data.code_verification_status || 'UNKNOWN'
      };
    } catch (networkErr) {
      return {
        verified: false,
        source: creds.source,
        error: `Network error connecting to Meta: ${networkErr.message}`
      };
    }
  }

  /**
   * Internal helper: Dispatches a raw payload to Meta's messages endpoint
   * Captures full diagnostics: HTTP status, WAMID, error code, subcode, message, type, fbtrace_id.
   */
  static async _dispatchToMeta({ payload, ownerId, tenantId, channelType, ruleName, triggerEvent }) {
    const creds = this.getCredentials(ownerId);
    const version = this.getApiVersion();

    if (!creds.accessToken || !creds.phoneNumberId) {
      const notConfiguredErr = new Error(
        'Meta WhatsApp Cloud API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment or Settings.'
      );
      notConfiguredErr.code = 'WHATSAPP_NOT_CONFIGURED';
      notConfiguredErr.meta = {
        httpStatus: 400,
        code: 'NOT_CONFIGURED',
        message: notConfiguredErr.message
      };

      if (ownerId) {
        db.insertForOwner('automation_logs', ownerId, {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          owner_id: ownerId,
          tenant_id: tenantId || null,
          recipient_phone: payload.to,
          caller_id_used: 'WHATSAPP-CLOUD-API',
          caller_id_label: 'Meta Cloud API',
          channel: 'whatsapp',
          trigger_event: triggerEvent || ruleName || channelType,
          status: 'failed',
          content: JSON.stringify(payload),
          provider_message_id: null,
          error_message: notConfiguredErr.message,
          timestamp: new Date().toISOString()
        });
      }
      throw notConfiguredErr;
    }

    const endpoint = `https://graph.facebook.com/${version}/${creds.phoneNumberId}/messages`;
    const startTime = Date.now();

    console.log(`[WHATSAPP DISPATCH] Sending to ${payload.to} via Meta ${version} (${channelType})...`);

    let response;
    let metaData;
    let httpStatus = 500;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      httpStatus = response.status;
      metaData = await response.json();
    } catch (netErr) {
      console.error('[WHATSAPP NETWORK ERROR]:', netErr.message);
      const networkError = new Error(`Failed to reach Meta Graph API: ${netErr.message}`);
      networkError.code = 'NETWORK_ERROR';
      networkError.meta = {
        httpStatus: 0,
        code: 'NETWORK_TIMEOUT_OR_DNS',
        message: netErr.message
      };
      throw networkError;
    }

    // Handle Meta Errors
    if (!response.ok) {
      const metaError = metaData.error || {};
      const errorMessage = metaError.message || `Meta API HTTP error ${httpStatus}`;
      const errorCode = metaError.code;
      const errorSubcode = metaError.error_subcode;
      const fbtraceId = metaError.fbtrace_id;

      console.error(`[WHATSAPP META REJECTED] HTTP ${httpStatus}:`, {
        code: errorCode,
        subcode: errorSubcode,
        message: errorMessage,
        fbtrace_id: fbtraceId
      });

      if (ownerId) {
        db.insertForOwner('automation_logs', ownerId, {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          owner_id: ownerId,
          tenant_id: tenantId || null,
          recipient_phone: payload.to,
          caller_id_used: creds.phoneNumberId,
          caller_id_label: 'Meta WhatsApp Cloud API',
          channel: 'whatsapp',
          trigger_event: triggerEvent || ruleName || channelType,
          status: 'failed',
          content: JSON.stringify(payload),
          provider_message_id: null,
          error_message: `Meta Error (${errorCode}): ${errorMessage}`,
          timestamp: new Date().toISOString()
        });
      }

      const customError = new Error(`Meta WhatsApp API rejected request: ${errorMessage}`);
      customError.code = errorCode || httpStatus;
      customError.meta = {
        httpStatus,
        code: errorCode,
        subcode: errorSubcode,
        type: metaError.type,
        message: errorMessage,
        fbtrace_id: fbtraceId
      };
      throw customError;
    }

    // Success response: Meta returns { messaging_product: "whatsapp", contacts: [...], messages: [{ id: "wamid..." }] }
    const messageId = metaData.messages?.[0]?.id || `wamid.${Date.now()}`;
    console.log(`[WHATSAPP SUCCESS] Message accepted by Meta. WAMID: ${messageId}`);

    let logEntry = null;
    if (ownerId) {
      logEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        owner_id: ownerId,
        tenant_id: tenantId || null,
        recipient_phone: payload.to,
        caller_id_used: creds.phoneNumberId,
        caller_id_label: 'Meta WhatsApp Cloud API',
        channel: 'whatsapp',
        trigger_event: triggerEvent || ruleName || channelType,
        status: 'accepted_by_meta',
        content: payload.text?.body || `Template: ${payload.template?.name}`,
        provider_message_id: messageId,
        error_message: null,
        timestamp: new Date().toISOString()
      };
      db.insertForOwner('automation_logs', ownerId, logEntry);
    }

    return {
      success: true,
      status: 'Message accepted by Meta',
      messageId,
      recipient: payload.to,
      metaHttpStatus: httpStatus,
      durationMs: Date.now() - startTime,
      log: logEntry
    };
  }

  /**
   * TEST 1: Meta Standard Pre-approved 'hello_world' Template Send
   * Use this to diagnose connectivity/credentials/recipient verification without template approval hurdles.
   */
  static async sendTemplateMessage({ to, templateName = 'hello_world', languageCode = 'en_US', ownerId, tenantId }) {
    if (!to) throw new Error('Recipient phone number is required');
    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo || normalizedTo.length < 10) {
      throw new Error(`Invalid recipient phone: "${to}". Provide number with country code.`);
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: normalizedTo,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };

    return this._dispatchToMeta({
      payload,
      ownerId,
      tenantId,
      channelType: 'Template Test',
      ruleName: `Meta Template (${templateName})`,
      triggerEvent: 'Template Diagnostic'
    });
  }

  /**
   * TEST 2: Direct Send Utility / Freeform Text Message
   * Note: As per Meta policy, freeform text can be delivered within 24-hour service windows or test setups.
   */
  static async sendUtilityMessage({ to, body, ownerId, tenantId, ruleName, triggerEvent }) {
    if (!to) throw new Error('Recipient phone number is required');
    if (!body) throw new Error('Message body is required');

    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo || normalizedTo.length < 10) {
      throw new Error(`Invalid recipient phone: "${to}". Provide number with country code.`);
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'text',
      text: {
        body
      }
    };

    return this._dispatchToMeta({
      payload,
      ownerId,
      tenantId,
      channelType: 'Utility Text Send',
      ruleName: ruleName || 'Direct Utility Message',
      triggerEvent: triggerEvent || 'Direct Send'
    });
  }

  /**
   * Main send wrapper for backward compatibility
   */
  static async sendWhatsAppMessage({ to, message, ownerId, tenantId, ruleName, triggerEvent }) {
    return this.sendUtilityMessage({
      to,
      body: message,
      ownerId,
      tenantId,
      ruleName,
      triggerEvent
    });
  }
}
