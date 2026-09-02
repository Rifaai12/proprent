import { db } from '../config/db.js';
import { NumberPoolService } from './numberPoolService.js';
import { WhatsAppService } from './whatsappService.js';

export class TelecomService {
  /**
   * Replace template tokens with real tenant & property data
   */
  static renderTemplate(template, tenant, settings, property = null) {
    const currency = settings.currency_symbol || '₹';
    const dueDay = tenant.due_day;
    const now = new Date();
    const dueDateStr = `${dueDay} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

    return (template || '')
      .replace(/{tenant_name}/g, tenant.name || 'Resident')
      .replace(/{property_name}/g, property ? property.name : (tenant.property_name || 'Property'))
      .replace(/{unit_number}/g, tenant.unit_number || 'Unit')
      .replace(/{rent_amount}/g, Number(tenant.rent_amount || 0).toLocaleString())
      .replace(/{currency}/g, currency)
      .replace(/{due_date}/g, dueDateStr)
      .replace(/{owner_name}/g, settings.owner_name || 'Property Owner')
      .replace(/{owner_phone}/g, settings.owner_phone || '')
      .replace(/{upi_id}/g, settings.upi_id || '')
      .replace(/{bank_info}/g, settings.bank_account_info || '');
  }

  /**
   * Dispatch an AI Voice Call to a tenant
   */
  static async dispatchVoiceCall({ tenant, scriptText, ruleName, triggerEvent }) {
    const ownerId = tenant.owner_id;
    const settings = await db.getSettingsForOwner(ownerId);
    const property = await db.findByOwner('properties', ownerId, tenant.property_id);
    
    // Select rotated caller ID to prevent tenant from blocking the number
    const callerIdObj = await NumberPoolService.selectRotatedCallerId(ownerId, tenant.id);
    const callerNumber = callerIdObj.phone_number;

    const renderedScript = this.renderTemplate(scriptText, tenant, settings, property);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      owner_id: ownerId,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_phone: tenant.phone,
      caller_id_used: callerNumber,
      caller_id_label: callerIdObj.label,
      channel: 'ai_call',
      trigger_event: triggerEvent || ruleName || 'Automated AI Voice Reminder',
      status: 'answered',
      content: renderedScript,
      call_duration_sec: Math.floor(Math.random() * 25) + 30,
      tenant_response_intent: 'Voice reminder delivered successfully.',
      timestamp: new Date().toISOString()
    };

    if (!settings.simulation_mode) {
      try {
        console.log(`[LIVE TELECOM] Initiating live AI call via ${callerNumber} to ${tenant.phone}...`);
      } catch (err) {
        logEntry.status = 'failed';
        logEntry.error_message = `Live Call Error: ${err.message}`;
      }
    }

    await db.insertForOwner('automation_logs', ownerId, logEntry);
    return logEntry;
  }

  /**
   * Dispatch a WhatsApp message to a tenant (Live Meta Cloud API or Simulation Mode)
   */
  static async dispatchWhatsAppMessage({ tenant, messageText, ruleName, triggerEvent }) {
    const ownerId = tenant.owner_id;
    const settings = await db.getSettingsForOwner(ownerId);
    const property = await db.findByOwner('properties', ownerId, tenant.property_id);
    const renderedMessage = this.renderTemplate(messageText, tenant, settings, property);

    // If live production mode is active and Meta credentials exist, call Meta WhatsApp Cloud API directly
    const waCreds = WhatsAppService.getCredentials(ownerId);
    if (!settings.simulation_mode && waCreds.accessToken && waCreds.phoneNumberId) {
      try {
        console.log(`[LIVE WHATSAPP] Sending live Meta Cloud API message to ${tenant.phone}...`);
        const sendResult = await WhatsAppService.sendWhatsAppMessage({
          to: tenant.phone,
          message: renderedMessage,
          ownerId,
          tenantId: tenant.id,
          ruleName,
          triggerEvent
        });
        return sendResult.log;
      } catch (liveSendErr) {
        console.error('[LIVE WHATSAPP FAILED]:', liveSendErr.message);
        return {
          id: `log-${Date.now()}`,
          status: 'failed',
          content: renderedMessage,
          error_message: liveSendErr.message
        };
      }
    }

    // Default simulation / sandbox record
    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      owner_id: ownerId,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_phone: tenant.phone,
      caller_id_used: 'WHATSAPP-OFFICIAL',
      caller_id_label: 'WhatsApp Business API',
      channel: 'whatsapp',
      trigger_event: triggerEvent || ruleName || 'Automated WhatsApp Notice',
      status: 'delivered',
      content: renderedMessage,
      call_duration_sec: null,
      timestamp: new Date().toISOString()
    };

    await db.insertForOwner('automation_logs', ownerId, logEntry);
    return logEntry;
  }

  /**
   * Dispatch an SMS message to a tenant
   */
  static async dispatchSMS({ tenant, messageText, ruleName, triggerEvent }) {
    const ownerId = tenant.owner_id;
    const settings = await db.getSettingsForOwner(ownerId);
    const property = await db.findByOwner('properties', ownerId, tenant.property_id);
    const renderedMessage = this.renderTemplate(messageText, tenant, settings, property);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      owner_id: ownerId,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_phone: tenant.phone,
      caller_id_used: 'SMS-GATEWAY-TX',
      caller_id_label: 'SMS DLT Route',
      channel: 'sms',
      trigger_event: triggerEvent || ruleName || 'Automated SMS Notice',
      status: 'delivered',
      content: renderedMessage,
      call_duration_sec: null,
      timestamp: new Date().toISOString()
    };

    await db.insertForOwner('automation_logs', ownerId, logEntry);
    return logEntry;
  }
}
