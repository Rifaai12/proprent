import { db } from '../config/db.js';
import { TelecomService } from './telecomService.js';

export class AutomationService {
  /**
   * Evaluate a single tenant's due status based on today's calendar day
   */
  static evaluateTenantStatus(tenant) {
    if (tenant.status === 'PAID') {
      return 'PAID';
    }

    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = tenant.due_day;

    if (currentDay === dueDay) {
      return 'DUE_TODAY';
    } else if (currentDay > dueDay) {
      return 'OVERDUE';
    } else {
      return 'UPCOMING';
    }
  }

  /**
   * Run automation cycle for a specific owner
   */
  static async runAutomationCycleForOwner(ownerId) {
    if (!ownerId) return [];

    const tenants = await db.getByOwner('tenants', ownerId);
    const allRules = await db.getByOwner('rules', ownerId);
    const rules = allRules.filter(r => r.is_active);

    const today = new Date();
    const currentDay = today.getDate();
    const executionResults = [];

    for (const tenant of tenants) {
      // KILL SWITCH: If tenant has already paid, strictly skip all automated reminders
      if (tenant.status === 'PAID') {
        executionResults.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          action: 'SKIPPED_PAID',
          reason: 'Rent is already marked as PAID for current cycle. All calls & messages aborted.'
        });
        continue;
      }

      const dueDay = tenant.due_day;
      const dayDiff = currentDay - dueDay;

      // Find matching rules based on offset
      for (const rule of rules) {
        let isMatch = false;

        if (rule.trigger_type === 'before_due' && dayDiff === -rule.days_offset) {
          isMatch = true;
        } else if (rule.trigger_type === 'on_due' && dayDiff === 0) {
          isMatch = true;
        } else if (rule.trigger_type === 'after_due' && dayDiff === rule.days_offset) {
          isMatch = true;
        }

        if (isMatch) {
          const dispatched = [];
          const channels = Array.isArray(rule.channels) ? rule.channels : (typeof rule.channels === 'string' ? JSON.parse(rule.channels) : ['whatsapp']);

          // WhatsApp Channel
          if (channels.includes('whatsapp') && tenant.auto_wa_enabled) {
            const waLog = await TelecomService.dispatchWhatsAppMessage({
              tenant,
              messageText: rule.script_template,
              ruleName: rule.name,
              triggerEvent: rule.name
            });
            dispatched.push({ channel: 'whatsapp', log_id: waLog.id });
          }

          // SMS Channel
          if (channels.includes('sms') && tenant.auto_sms_enabled) {
            const smsLog = await TelecomService.dispatchSMS({
              tenant,
              messageText: rule.script_template,
              ruleName: rule.name,
              triggerEvent: rule.name
            });
            dispatched.push({ channel: 'sms', log_id: smsLog.id });
          }

          // AI Voice Call Channel (with Anti-Blocking Number Rotation Pool)
          if (channels.includes('ai_call') && tenant.auto_call_enabled) {
            const callLog = await TelecomService.dispatchVoiceCall({
              tenant,
              scriptText: rule.script_template,
              ruleName: rule.name,
              triggerEvent: rule.name
            });
            dispatched.push({ 
              channel: 'ai_call', 
              log_id: callLog.id, 
              rotated_caller_id: callLog.caller_id_used 
            });
          }

          executionResults.push({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            rule_name: rule.name,
            action: 'DISPATCHED',
            dispatched
          });
        }
      }
    }

    return executionResults;
  }

  /**
   * Run the global daily background cron scheduler across all registered owners
   */
  static async runAutomationCycle() {
    const owners = await db.get('owners');
    let totalExecuted = [];

    for (const owner of owners) {
      try {
        const results = await this.runAutomationCycleForOwner(owner.id);
        totalExecuted = totalExecuted.concat(results);
      } catch (err) {
        console.error(`[CRON ERROR] Failed automation cycle for owner ${owner.id}:`, err);
      }
    }

    return totalExecuted;
  }

  /**
   * Mark Rent as Paid (Immediate Stop-Trigger & Receipt Dispatch for Owner)
   */
  static async markAsPaid(ownerId, tenantId, { amount, payment_mode, reference_id, notes }) {
    const tenant = await db.findByOwner('tenants', ownerId, tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found in your account`);
    }

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'short' });
    const currentYear = today.getFullYear();
    const paidAmount = amount || tenant.rent_amount;

    // 1. Update Tenant Status to PAID
    const updatedTenant = await db.updateForOwner('tenants', ownerId, tenantId, {
      status: 'PAID',
      last_paid_date: today.toISOString().split('T')[0]
    });

    // 2. Insert Scoped Payment Record
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      owner_id: ownerId,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      property_name: tenant.property_name || 'Property',
      unit_number: tenant.unit_number || '',
      amount: Number(paidAmount),
      payment_date: today.toISOString(),
      payment_mode: payment_mode || 'UPI / Instant Bank Transfer',
      notes: notes || `Ref: ${reference_id || `TXN-${Date.now().toString().slice(-6)}`}`,
      status: 'PAID',
      created_at: today.toISOString()
    };
    await db.insertForOwner('payment_history', ownerId, paymentRecord);

    // 3. Log Immediate Kill-Switch Event
    const killSwitchLog = {
      id: `log-${Date.now()}`,
      owner_id: ownerId,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_phone: tenant.phone,
      caller_id_used: 'SYSTEM-KILL-SWITCH',
      caller_id_label: 'Automation Controller',
      channel: 'system',
      trigger_event: 'Rent Marked as PAID - Reminders Halted',
      status: 'cancelled_paid',
      content: `Rent payment of ${paidAmount} received. All pending AI voice calls, WhatsApp reminders, and SMS triggers are IMMEDIATELY CANCELLED for this billing cycle.`,
      call_duration_sec: null,
      timestamp: today.toISOString()
    };
    await db.insertForOwner('automation_logs', ownerId, killSwitchLog);

    // 4. Send Instant Payment Confirmation WhatsApp Receipt
    const settings = await db.getSettingsForOwner(ownerId);
    const receiptMessage = `*Payment Confirmation & Receipt* 🧾
Hello ${tenant.name},
We have successfully received your rent payment of ${settings.currency_symbol || '₹'}${Number(paidAmount).toLocaleString()} for ${tenant.property_name || 'Property'} (${tenant.unit_number || 'Unit'}) for ${currentMonth} ${currentYear}.

*Transaction Date:* ${today.toLocaleDateString()}

Thank you for paying on time! All automated reminder alerts have now been stopped.

----------------------------------
*வாடகை ரசீது & உறுதிப்படுத்தல்* 🧾
வணக்கம் ${tenant.name},
உங்கள் வாடகைத் தொகை ${settings.currency_symbol || '₹'}${Number(paidAmount).toLocaleString()} (${currentMonth} ${currentYear}) வெற்றிகரமாக பெறப்பட்டது.
நன்றி! அனைத்து தானியங்கி நினைவூட்டல்களும் நிறுத்தப்பட்டுவிட்டன.`;
    
    try {
      await TelecomService.dispatchWhatsAppMessage({
        tenant,
        messageText: receiptMessage,
        ruleName: 'Payment Received Confirmation',
        triggerEvent: 'Receipt Dispatch'
      });
    } catch (err) {
      console.warn('[TELECOM RECEIPT] Could not dispatch receipt message:', err.message);
    }

    return {
      success: true,
      tenant: updatedTenant,
      payment: paymentRecord,
      message: 'Rent marked as PAID. All automated calling & messaging queues immediately stopped.'
    };
  }

  /**
   * Reset / Toggle tenant status for owner
   */
  static async updateTenantStatus(ownerId, tenantId, newStatus) {
    return await db.updateForOwner('tenants', ownerId, tenantId, { status: newStatus });
  }
}
