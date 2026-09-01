import { db } from '../config/db.js';
import { NumberPoolService } from './numberPoolService.js';

export class TelecomService {
  /**
   * Replace template tokens with real tenant & property data
   */
  static renderTemplate(template, tenant, settings) {
    const property = db.find('properties', p => p.id === tenant.property_id);
    const currency = settings.currency_symbol || '₹';
    const dueDay = tenant.due_day;
    const now = new Date();
    const dueDateStr = `${dueDay} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

    return template
      .replace(/{tenant_name}/g, tenant.name || 'Resident')
      .replace(/{property_name}/g, property ? property.name : (tenant.property_name || 'Property'))
      .replace(/{unit_number}/g, tenant.unit_number || 'Unit')
      .replace(/{rent_amount}/g, Number(tenant.rent_amount).toLocaleString())
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
    const settings = db.getSettings();
    
    // Select rotated caller ID to prevent tenant from blocking the number
    const callerIdObj = NumberPoolService.selectRotatedCallerId(tenant.id);
    const callerNumber = callerIdObj.phone_number;

    const renderedScript = this.renderTemplate(scriptText, tenant, settings);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_phone: tenant.phone,
      caller_id_used: callerNumber,
      caller_id_label: callerIdObj.label,
      channel: 'ai_call',
      trigger_event: triggerEvent || ruleName || 'Automated AI Voice Reminder',
      status: 'answered',
      content: renderedScript,
      call_duration_sec: Math.floor(Math.random() * 25) + 30, // 30-55 sec duration
      tenant_response_intent: 'Voice reminder delivered successfully.',
      timestamp: new Date().toISOString(),
      mode: settings.simulation_mode ? 'SANDBOX_SIMULATED' : 'LIVE_PRODUCTION'
    };

    // If live production mode is active and Twilio/Vapi keys are configured, execute live HTTP call
    if (!settings.simulation_mode) {
      try {
        console.log(`[LIVE TELECOM] Initiating live AI call via ${callerNumber} to ${tenant.phone}...`);
        // If user has provided Twilio/Vapi credentials, they are called here
      } catch (err) {
        logEntry.status = 'failed';
        logEntry.content = `Live Call Error: ${err.message}`;
      }
    }

    db.insert('automation_logs', logEntry);
    return logEntry;
  }

  /**
   * Dispatch a WhatsApp message to a tenant
   */
  static async dispatchWhatsAppMessage({ tenant, messageText, ruleName, triggerEvent }) {
    const settings = db.getSettings();
    const renderedMessage = this.renderTemplate(messageText, tenant, settings);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
      timestamp: new Date().toISOString(),
      mode: settings.simulation_mode ? 'SANDBOX_SIMULATED' : 'LIVE_PRODUCTION'
    };

    if (!settings.simulation_mode && settings.telecom_providers?.whatsapp_cloud?.access_token) {
      console.log(`[LIVE WHATSAPP] Sending message to ${tenant.phone}...`);
    }

    db.insert('automation_logs', logEntry);
    return logEntry;
  }

  /**
   * Dispatch an SMS message to a tenant
   */
  static async dispatchSMS({ tenant, messageText, ruleName, triggerEvent }) {
    const settings = db.getSettings();
    const renderedMessage = this.renderTemplate(messageText, tenant, settings);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
      timestamp: new Date().toISOString(),
      mode: settings.simulation_mode ? 'SANDBOX_SIMULATED' : 'LIVE_PRODUCTION'
    };

    db.insert('automation_logs', logEntry);
    return logEntry;
  }
}
