import { db } from '../config/db.js';

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';

export class WhatsAppService {
  /**
   * Normalize destination phone number to E.164 without leading '+' as required by Meta WhatsApp Cloud API.
   * e.g. "+91 98450 12345" -> "919845012345"
   * e.g. "09876543210" -> "919876543210"
   * e.g. "9876543210" -> "919876543210"
   */
  static normalizePhoneNumber(phone, defaultCountryCode = '91') {
    if (!phone) return '';
    // Strip all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0 (national prefix), strip it
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = defaultCountryCode + cleaned.slice(1);
    }

    // If exactly 10 digits (e.g. Indian standard mobile), prepend default country code
    if (cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    }

    return cleaned;
  }

  /**
   * Get active Meta WhatsApp Cloud API credentials
   * Priority: process.env > Owner Settings
   */
  static getCredentials(ownerId) {
    const envToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const envWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (envToken && envPhoneId) {
      return {
        accessToken: envToken,
        phoneNumberId: envPhoneId,
        wabaId: envWabaId || '',
        source: 'ENVIRONMENT_VARIABLES'
      };
    }

    if (ownerId) {
      const settings = db.getSettingsForOwner(ownerId);
      const ownerWa = settings?.telecom_providers?.whatsapp_cloud;
      if (ownerWa?.access_token && ownerWa?.phone_number_id) {
        return {
          accessToken: ownerWa.access_token,
          phoneNumberId: ownerWa.phone_number_id,
          wabaId: ownerWa.business_account_id || '',
          source: 'OWNER_SETTINGS'
        };
      }
    }

    return {
      accessToken: envToken || '',
      phoneNumberId: envPhoneId || '',
      wabaId: envWabaId || '',
      source: 'NOT_CONFIGURED'
    };
  }

  /**
   * Safe status summary for frontend (Never exposes the actual access token!)
   */
  static getStatus(ownerId) {
    const creds = this.getCredentials(ownerId);
    const isConfigured = Boolean(creds.accessToken && creds.phoneNumberId);

    return {
      isConfigured,
      source: creds.source,
      phoneNumberId: creds.phoneNumberId ? `${creds.phoneNumberId.slice(0, 4)}...${creds.phoneNumberId.slice(-4)}` : '',
      apiVersion: GRAPH_API_VERSION,
      channel: 'whatsapp_cloud_api'
    };
  }

  /**
   * Send WhatsApp Direct Text Message via Meta Graph Cloud API
   */
  static async sendWhatsAppMessage({ to, message, ownerId, tenantId, ruleName, triggerEvent }) {
    if (!to) {
      throw new Error('Destination phone number is required');
    }
    if (!message) {
      throw new Error('Message body content is required');
    }

    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo || normalizedTo.length < 10) {
      throw new Error(`Invalid recipient phone number format: "${to}". Please provide a valid phone number with country code.`);
    }

    const creds = this.getCredentials(ownerId);
    if (!creds.accessToken || !creds.phoneNumberId) {
      const err = new Error(
        'Meta WhatsApp Cloud API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend environment or settings.'
      );
      err.code = 'WHATSAPP_NOT_CONFIGURED';

      // Log failure in database if ownerId exists
      if (ownerId) {
        const failedLog = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          owner_id: ownerId,
          tenant_id: tenantId || null,
          recipient_phone: normalizedTo,
          caller_id_used: 'WHATSAPP-CLOUD-API',
          caller_id_label: 'Meta Cloud API',
          channel: 'whatsapp',
          trigger_event: triggerEvent || ruleName || 'Direct WhatsApp Send',
          status: 'failed',
          content: message,
          provider_message_id: null,
          error_message: err.message,
          timestamp: new Date().toISOString()
        };
        db.insertForOwner('automation_logs', ownerId, failedLog);
      }
      throw err;
    }

    const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${creds.phoneNumberId}/messages`;

    const requestPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'text',
      text: {
        body: message
      }
    };

    const startTime = Date.now();
    let metaResponseData;
    let httpStatus = 500;

    try {
      console.log(`[WHATSAPP CLOUD API] Dispatching message to ${normalizedTo} via Meta Graph ${GRAPH_API_VERSION}...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      httpStatus = response.status;
      metaResponseData = await response.json();

      if (!response.ok) {
        const metaError = metaResponseData.error || {};
        const errorMessage = metaError.message || `Meta API HTTP error ${httpStatus}`;
        const errorCode = metaError.code;
        const errorSubcode = metaError.error_subcode;

        console.error(`[WHATSAPP CLOUD API ERROR] Status ${httpStatus}:`, {
          code: errorCode,
          subcode: errorSubcode,
          message: errorMessage,
          type: metaError.type
        });

        // Record failure in database
        if (ownerId) {
          const failedLog = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            owner_id: ownerId,
            tenant_id: tenantId || null,
            recipient_phone: normalizedTo,
            caller_id_used: creds.phoneNumberId,
            caller_id_label: 'Meta WhatsApp Cloud API',
            channel: 'whatsapp',
            trigger_event: triggerEvent || ruleName || 'Direct WhatsApp Send',
            status: 'failed',
            content: message,
            provider_message_id: null,
            error_message: `Meta API Error (${errorCode || httpStatus}): ${errorMessage}`,
            timestamp: new Date().toISOString()
          };
          db.insertForOwner('automation_logs', ownerId, failedLog);
        }

        const customError = new Error(`Meta WhatsApp API rejected: ${errorMessage}`);
        customError.code = errorCode || httpStatus;
        customError.metaDetails = metaError;
        throw customError;
      }

      // Successful send response from Meta
      const providerMessageId = metaResponseData.messages?.[0]?.id || `wamid.${Date.now()}`;
      console.log(`[WHATSAPP CLOUD API SUCCESS] Message accepted by Meta. WAMID: ${providerMessageId}`);

      let logEntry = null;
      if (ownerId) {
        logEntry = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          owner_id: ownerId,
          tenant_id: tenantId || null,
          recipient_phone: normalizedTo,
          caller_id_used: creds.phoneNumberId,
          caller_id_label: 'Meta WhatsApp Cloud API',
          channel: 'whatsapp',
          trigger_event: triggerEvent || ruleName || 'Direct WhatsApp Send',
          status: 'sent',
          content: message,
          provider_message_id: providerMessageId,
          error_message: null,
          timestamp: new Date().toISOString()
        };
        db.insertForOwner('automation_logs', ownerId, logEntry);
      }

      return {
        success: true,
        messageId: providerMessageId,
        recipient: normalizedTo,
        status: 'sent',
        responseTimeMs: Date.now() - startTime,
        log: logEntry
      };

    } catch (networkOrMetaErr) {
      // Re-throw if already handled
      if (networkOrMetaErr.code) throw networkOrMetaErr;

      console.error('[WHATSAPP CLOUD API NETWORK ERROR]:', networkOrMetaErr);
      const networkError = new Error(`Failed to connect to Meta WhatsApp Cloud API: ${networkOrMetaErr.message}`);
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
  }
}
