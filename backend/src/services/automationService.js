import { db } from '../config/db.js';
import { TelecomService } from './telecomService.js';

export class AutomationService {
  /**
   * Evaluate a single tenant's due status based on today's calendar day
   */
  static evaluateTenantStatus(tenant) {
    // If tenant has already paid for current billing cycle, status is PAID
    if (tenant.status === 'PAID') {
      return 'PAID';
    }

    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = tenant.due_day;
    const graceDays = tenant.grace_days || 0;

    if (currentDay === dueDay) {
      return 'DUE_TODAY';
    } else if (currentDay > dueDay) {
      return 'OVERDUE';
    } else {
      return 'UPCOMING';
    }
  }

  /**
   * Run the daily automation cycle across all active properties and tenants
   */
  static async runAutomationCycle() {
    const tenants = db.get('tenants');
    const rules = db.filter('rules', r => r.is_active);
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
      const dayDiff = currentDay - dueDay; // Negative = days before due, 0 = due today, Positive = days overdue

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

          // WhatsApp Channel
          if (rule.channels.includes('whatsapp') && tenant.auto_wa_enabled) {
            const waLog = await TelecomService.dispatchWhatsAppMessage({
              tenant,
              messageText: rule.script_template,
              ruleName: rule.name,
              triggerEvent: rule.name
            });
            dispatched.push({ channel: 'whatsapp', log_id: waLog.id });
          }

          // SMS Channel
          if (rule.channels.includes('sms') && tenant.auto_sms_enabled) {
            const smsLog = await TelecomService.dispatchSMS({
              tenant,
              messageText: rule.script_template,
              ruleName: rule.name,
              triggerEvent: rule.name
            });
            dispatched.push({ channel: 'sms', log_id: smsLog.id });
          }

          // AI Voice Call Channel (with Anti-Blocking Number Rotation Pool!)
          if (rule.channels.includes('ai_call') && tenant.auto_call_enabled) {
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
   * Mark Rent as Paid (Immediate Stop-Trigger & Receipt Dispatch)
   */
  static async markAsPaid(tenantId, { amount, payment_mode, reference_id, notes }) {
    const tenant = db.find('tenants', t => t.id === tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'short' });
    const currentYear = today.getFullYear();
    const paidAmount = amount || tenant.rent_amount;

    // 1. Update Tenant Status to PAID
    const updatedTenant = db.update('tenants', tenantId, {
      status: 'PAID',
      last_paid_date: today.toISOString().split('T')[0]
    });

    // 2. Insert Payment Record
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      property_name: tenant.property_name,
      unit_number: tenant.unit_number,
      amount: Number(paidAmount),
      paid_on: today.toISOString(),
      cycle_month: currentMonth,
      cycle_year: currentYear,
      payment_mode: payment_mode || 'UPI / Instant Bank Transfer',
      reference_id: reference_id || `TXN-${Date.now().toString().slice(-6)}`,
      notes: notes || 'Marked as paid by property owner',
      created_at: today.toISOString()
    };
    db.insert('payment_history', paymentRecord);

    // 3. Log Immediate Kill-Switch Event
    const killSwitchLog = {
      id: `log-${Date.now()}`,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_phone: tenant.phone,
      caller_id_used: 'SYSTEM-KILL-SWITCH',
      caller_id_label: 'Automation Controller',
      channel: 'system',
      trigger_event: 'Rent Marked as PAID - Automation Halted',
      status: 'cancelled_paid',
      content: `Rent payment of ${paidAmount} received. All pending AI voice calls, WhatsApp reminders, and SMS triggers are IMMEDIATELY CANCELLED for this billing cycle.`,
      call_duration_sec: null,
      timestamp: today.toISOString()
    };
    db.insert('automation_logs', killSwitchLog);

    // 4. Send Instant Payment Confirmation WhatsApp Receipt (English First, Tamil Next)
    const settings = db.getSettings();
    const receiptMessage = `*Payment Confirmation & Receipt* 🧾
Hello ${tenant.name},
We have successfully received your rent payment of ${settings.currency_symbol || '₹'}${Number(paidAmount).toLocaleString()} for ${tenant.property_name} (${tenant.unit_number}) for ${currentMonth} ${currentYear}.

*Transaction ID:* ${paymentRecord.reference_id}
*Date:* ${today.toLocaleDateString()}

Thank you for paying on time! All automated reminder alerts have now been stopped.

----------------------------------
*வாடகை ரசீது & உறுதிப்படுத்தல்* 🧾
வணக்கம் ${tenant.name},
${tenant.property_name} (${tenant.unit_number})-க்கான உங்கள் வாடகைத் தொகை ${settings.currency_symbol || '₹'}${Number(paidAmount).toLocaleString()} (${currentMonth} ${currentYear}) வெற்றிகரமாக பெறப்பட்டது.

*பரிவர்த்தனை எண்:* ${paymentRecord.reference_id}
*தேதி:* ${today.toLocaleDateString()}

சரியான நேரத்தில் செலுத்தியமைக்கு நன்றி! அனைத்து தானியங்கி அழைப்புகளும் நினைவூட்டல்களும் நிறுத்தப்பட்டுவிட்டன.`;
    
    await TelecomService.dispatchWhatsAppMessage({
      tenant,
      messageText: receiptMessage,
      ruleName: 'Payment Received Confirmation',
      triggerEvent: 'Receipt Dispatch'
    });

    return {
      success: true,
      tenant: updatedTenant,
      payment: paymentRecord,
      message: 'Rent marked as PAID. All automated calling & messaging queues immediately stopped.'
    };
  }

  /**
   * Reset / Toggle tenant status (for testing or new billing cycle)
   */
  static updateTenantStatus(tenantId, newStatus) {
    return db.update('tenants', tenantId, { status: newStatus });
  }
}
