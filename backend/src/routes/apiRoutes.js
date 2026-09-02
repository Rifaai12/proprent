import express from 'express';
import { db } from '../config/db.js';
import { NumberPoolService } from '../services/numberPoolService.js';
import { AutomationService } from '../services/automationService.js';
import { TelecomService } from '../services/telecomService.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Enforce authentication on all business routes
router.use(requireAuth);

// ================= PROPERTIES (OWNER-SCOPED) ================= //
router.get('/properties', (req, res) => {
  const ownerId = req.owner.id;
  const properties = db.getByOwner('properties', ownerId);
  const tenants = db.getByOwner('tenants', ownerId);

  // Enrich with unit counts and collection metrics for this owner
  const enriched = properties.map(prop => {
    const propTenants = tenants.filter(t => t.property_id === prop.id);
    const totalRent = propTenants.reduce((sum, t) => sum + Number(t.rent_amount || 0), 0);
    const paidRent = propTenants.filter(t => t.status === 'PAID').reduce((sum, t) => sum + Number(t.rent_amount || 0), 0);
    return {
      ...prop,
      occupied_units: propTenants.length,
      total_rent: totalRent,
      collected_rent: paidRent,
      tenants: propTenants
    };
  });

  res.json(enriched);
});

router.post('/properties', (req, res) => {
  const ownerId = req.owner.id;
  const { name, type, address, city, state, units_count, default_rent } = req.body;
  if (!name) return res.status(400).json({ error: 'Property name is required' });

  const newProperty = {
    id: `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    type: type || 'Apartment',
    address: address || '',
    city: city || '',
    state: state || '',
    units_count: Number(units_count) || 1,
    default_rent: Number(default_rent) || 0,
    created_at: new Date().toISOString()
  };

  db.insertForOwner('properties', ownerId, newProperty);
  res.status(201).json(newProperty);
});

router.put('/properties/:id', (req, res) => {
  const ownerId = req.owner.id;
  const updated = db.updateForOwner('properties', ownerId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Property not found or access denied' });
  res.json(updated);
});

router.delete('/properties/:id', (req, res) => {
  const ownerId = req.owner.id;
  const deleted = db.deleteForOwner('properties', ownerId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Property not found or access denied' });
  res.json({ success: true, message: 'Property deleted' });
});

// ================= TENANTS (OWNER-SCOPED) ================= //
router.get('/tenants', (req, res) => {
  const ownerId = req.owner.id;
  const tenants = db.getByOwner('tenants', ownerId);
  const properties = db.getByOwner('properties', ownerId);

  const enriched = tenants.map(tenant => {
    const prop = properties.find(p => p.id === tenant.property_id);
    return {
      ...tenant,
      property_name: prop ? prop.name : (tenant.property_name || 'Unassigned Property')
    };
  });

  res.json(enriched);
});

router.post('/tenants', (req, res) => {
  const ownerId = req.owner.id;
  const { property_id, unit_number, name, phone, email, rent_amount, due_day, grace_days, auto_call_enabled, auto_sms_enabled, auto_wa_enabled } = req.body;
  if (!name || !phone || !rent_amount) {
    return res.status(400).json({ error: 'Name, phone number, and rent amount are required' });
  }

  const prop = property_id ? db.findByOwner('properties', ownerId, p => p.id === property_id) : null;

  const newTenant = {
    id: `ten-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    property_id: property_id || '',
    property_name: prop ? prop.name : 'Primary Property',
    unit_number: unit_number || '101',
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    rent_amount: Number(rent_amount),
    due_day: Number(due_day) || 1,
    grace_days: Number(grace_days) || 3,
    status: 'UPCOMING',
    last_paid_date: null,
    auto_call_enabled: auto_call_enabled !== false,
    auto_sms_enabled: auto_sms_enabled !== false,
    auto_wa_enabled: auto_wa_enabled !== false,
    created_at: new Date().toISOString()
  };

  db.insertForOwner('tenants', ownerId, newTenant);
  res.status(201).json(newTenant);
});

router.put('/tenants/:id', (req, res) => {
  const ownerId = req.owner.id;
  const updated = db.updateForOwner('tenants', ownerId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Tenant not found or access denied' });
  res.json(updated);
});

router.delete('/tenants/:id', (req, res) => {
  const ownerId = req.owner.id;
  const deleted = db.deleteForOwner('tenants', ownerId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Tenant not found or access denied' });
  res.json({ success: true, message: 'Tenant deleted' });
});

// ================= MARK AS PAID (INSTANT REMINDER STOP TRIGGER) ================= //
router.post('/tenants/:id/mark-paid', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const result = await AutomationService.markAsPaid(ownerId, req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tenant status directly (for simulation & manual management)
router.post('/tenants/:id/status', (req, res) => {
  const ownerId = req.owner.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  const updated = db.updateForOwner('tenants', ownerId, req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Tenant not found or access denied' });
  res.json(updated);
});

// ================= SMART CALLER ID POOL ================= //
router.get('/phone-pool', (req, res) => {
  const ownerId = req.owner.id;
  const pool = NumberPoolService.getPool(ownerId);
  res.json(pool);
});

router.post('/phone-pool', (req, res) => {
  const ownerId = req.owner.id;
  const { phone_number, label, provider } = req.body;
  if (!phone_number) return res.status(400).json({ error: 'Phone number is required' });
  const created = NumberPoolService.addNumber(ownerId, { phone_number, label, provider });
  res.status(201).json(created);
});

router.put('/phone-pool/:id', (req, res) => {
  const ownerId = req.owner.id;
  const updated = NumberPoolService.updateNumber(ownerId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Number not found or access denied' });
  res.json(updated);
});

router.delete('/phone-pool/:id', (req, res) => {
  const ownerId = req.owner.id;
  const deleted = NumberPoolService.deleteNumber(ownerId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Number not found or access denied' });
  res.json({ success: true, message: 'Caller line removed' });
});

// ================= AUTOMATION RULES ================= //
router.get('/rules', (req, res) => {
  const ownerId = req.owner.id;
  res.json(db.getByOwner('rules', ownerId));
});

router.post('/rules', (req, res) => {
  const ownerId = req.owner.id;
  const newRule = {
    id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...req.body,
    is_active: req.body.is_active !== false
  };
  db.insertForOwner('rules', ownerId, newRule);
  res.status(201).json(newRule);
});

router.put('/rules/:id', (req, res) => {
  const ownerId = req.owner.id;
  const updated = db.updateForOwner('rules', ownerId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Rule not found or access denied' });
  res.json(updated);
});

router.delete('/rules/:id', (req, res) => {
  const ownerId = req.owner.id;
  const deleted = db.deleteForOwner('rules', ownerId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Rule not found or access denied' });
  res.json({ success: true, message: 'Rule deleted' });
});

// Manual Run of Automated Due Reminder Cycle for Authenticated Owner
router.post('/automations/run-now', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const results = await AutomationService.runAutomationCycleForOwner(ownerId);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      executed_count: results.length,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test Voice Call or Message Simulator for Authenticated Owner
router.post('/simulator/trigger-call', async (req, res) => {
  const ownerId = req.owner.id;
  const { tenant_id, custom_script, channel } = req.body;
  const tenant = db.findByOwner('tenants', ownerId, t => t.id === tenant_id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found in your account' });

  try {
    let logResult;
    if (channel === 'whatsapp') {
      const defaultWhatsAppScript = `Hello {tenant_name}! This is a reminder regarding your rent of {currency}{rent_amount} for {property_name} ({unit_number}) due on {due_date}. Please pay via UPI or Bank transfer. Thank you! - {owner_name}

---
அன்புள்ள {tenant_name}, {property_name} ({unit_number})-க்கான உங்கள் வாடகைத் தொகை {currency}{rent_amount}, வரும் {due_date} அன்று செலுத்தப்பட வேண்டும். தயவுசெய்து UPI அல்லது வங்கி மூலம் செலுத்தவும். நன்றி! - {owner_name}`;

      logResult = await TelecomService.dispatchWhatsAppMessage({
        tenant,
        messageText: custom_script || defaultWhatsAppScript,
        ruleName: 'Manual Reminder Test'
      });
    } else if (channel === 'sms') {
      logResult = await TelecomService.dispatchSMS({
        tenant,
        messageText: custom_script || 'Rent notice: {currency}{rent_amount} due for {property_name}. தயவுசெய்து வாடகையை செலுத்தவும்.',
        ruleName: 'Manual Reminder Test'
      });
    } else {
      // AI Voice call with anti-blocking caller ID rotation (Tamil First, English Next)
      const defaultVoiceScript = `வணக்கம் {tenant_name}. இது {owner_name} இடமிருந்து வரும் தானியங்கி வாடகை நினைவூட்டல் அழைப்பு. {property_name} {unit_number} வீட்டின் வாடகைத் தொகை {currency}{rent_amount} செலுத்துவதற்கு நிலுவையில் உள்ளது. தயவுசெய்து உங்கள் வாடகையை உடனடியாக செலுத்தவும். நன்றி.

Hello {tenant_name}. This is an automated call from {owner_name} regarding your rent of {currency}{rent_amount} for {property_name} ({unit_number}). Please make payment as soon as possible. Thank you.`;

      logResult = await TelecomService.dispatchVoiceCall({
        tenant,
        scriptText: custom_script || defaultVoiceScript,
        ruleName: 'Manual Reminder Test'
      });
    }

    res.json({ success: true, log: logResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= META WHATSAPP BUSINESS CLOUD API ================= //

// Get connection and configuration status (Safe: Never exposes the access token)
router.get('/whatsapp/status', (req, res) => {
  const ownerId = req.owner.id;
  const status = WhatsAppService.getStatus(ownerId);
  res.json({ success: true, ...status });
});

// Send Direct WhatsApp Message to an authenticated Owner's Tenant
router.post('/whatsapp/send', async (req, res) => {
  const ownerId = req.owner.id;
  const { tenantId, message, customMessage } = req.body;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  // Strictly verify that the tenant belongs to the authenticated owner
  const tenant = db.findByOwner('tenants', ownerId, t => t.id === tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found in your account or access denied' });
  }

  const settings = db.getSettingsForOwner(ownerId);
  const rawMessage = message || customMessage || `Hello {tenant_name}! This is a reminder regarding your rent of {currency}{rent_amount} for {property_name} ({unit_number}) due on {due_date}. Thank you! - {owner_name}`;
  const renderedMessage = TelecomService.renderTemplate(rawMessage, tenant, settings);

  try {
    const result = await WhatsAppService.sendWhatsAppMessage({
      to: tenant.phone,
      message: renderedMessage,
      ownerId,
      tenantId: tenant.id,
      ruleName: 'Manual WhatsApp Notice',
      triggerEvent: 'Direct Owner Send'
    });

    res.json({
      success: true,
      message: 'WhatsApp message accepted by Meta Cloud API and sent to tenant',
      messageId: result.messageId,
      recipient: result.recipient,
      log: result.log
    });
  } catch (err) {
    console.error(`[API /whatsapp/send ERROR]: ${err.message}`);
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'WHATSAPP_SEND_FAILED',
      metaDetails: err.metaDetails || null
    });
  }
});

// Test WhatsApp Cloud API direct send to an arbitrary test phone
router.post('/whatsapp/test', async (req, res) => {
  const ownerId = req.owner.id;
  const { testPhone, message } = req.body;

  if (!testPhone) {
    return res.status(400).json({ error: 'Test destination phone number is required' });
  }

  const testMessage = message || 'Hello! This is a test utility message from PropertyRent.AI via Meta WhatsApp Business Cloud API.';

  try {
    const result = await WhatsAppService.sendWhatsAppMessage({
      to: testPhone,
      message: testMessage,
      ownerId,
      ruleName: 'Meta API Test Check',
      triggerEvent: 'Admin Test Send'
    });

    res.json({
      success: true,
      message: 'Test message accepted by Meta Cloud API and delivered',
      messageId: result.messageId,
      recipient: result.recipient,
      responseTimeMs: result.responseTimeMs
    });
  } catch (err) {
    console.error(`[API /whatsapp/test ERROR]: ${err.message}`);
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'TEST_SEND_FAILED',
      metaDetails: err.metaDetails || null
    });
  }
});

// ================= LOGS & AUDIT TRAIL ================= //
router.get('/logs', (req, res) => {
  const ownerId = req.owner.id;
  const logs = db.getByOwner('automation_logs', ownerId);
  res.json(logs);
});

router.delete('/logs/clear', (req, res) => {
  const ownerId = req.owner.id;
  const logs = db.get('automation_logs');
  const remaining = logs.filter(l => l.owner_id !== ownerId);
  db.set('automation_logs', remaining);
  res.json({ success: true, message: 'Activity logs cleared' });
});

// ================= PAYMENTS HISTORY ================= //
router.get('/payments', (req, res) => {
  const ownerId = req.owner.id;
  res.json(db.getByOwner('payment_history', ownerId));
});

// ================= SETTINGS ================= //
router.get('/settings', (req, res) => {
  const ownerId = req.owner.id;
  res.json(db.getSettingsForOwner(ownerId));
});

router.put('/settings', (req, res) => {
  const ownerId = req.owner.id;
  const updated = db.updateSettingsForOwner(ownerId, req.body);
  res.json(updated);
});

// ================= DASHBOARD SUMMARY METRICS ================= //
router.get('/dashboard-metrics', (req, res) => {
  const ownerId = req.owner.id;
  const tenants = db.getByOwner('tenants', ownerId);
  const properties = db.getByOwner('properties', ownerId);
  const phoneNumbers = db.getByOwner('phone_numbers', ownerId);
  const logs = db.getByOwner('automation_logs', ownerId);
  const settings = db.getSettingsForOwner(ownerId);

  const totalRentExpected = tenants.reduce((acc, t) => acc + Number(t.rent_amount || 0), 0);
  const totalRentCollected = tenants.filter(t => t.status === 'PAID').reduce((acc, t) => acc + Number(t.rent_amount || 0), 0);
  const overdueCount = tenants.filter(t => t.status === 'OVERDUE').length;
  const dueTodayCount = tenants.filter(t => t.status === 'DUE_TODAY').length;
  const paidCount = tenants.filter(t => t.status === 'PAID').length;
  const upcomingCount = tenants.filter(t => t.status === 'UPCOMING').length;

  const totalCallsMade = logs.filter(l => l.channel === 'ai_call').length;
  const totalWhatsAppSent = logs.filter(l => l.channel === 'whatsapp').length;
  const activeNumbersCount = phoneNumbers.filter(n => n.is_active).length;

  res.json({
    totalProperties: properties.length,
    totalTenants: tenants.length,
    totalRentExpected,
    totalRentCollected,
    collectionRate: totalRentExpected > 0 ? Math.round((totalRentCollected / totalRentExpected) * 100) : 0,
    overdueCount,
    dueTodayCount,
    paidCount,
    upcomingCount,
    totalCallsMade,
    totalWhatsAppSent,
    activeNumbersCount,
    currencySymbol: settings?.currency_symbol || '₹'
  });
});

// ================= OPTIONAL DEMO DATA CONTROLS (PER-OWNER SCOPED) ================= //
router.post('/account/clear-demo', (req, res) => {
  const ownerId = req.owner.id;
  
  // Clear only this owner's properties, tenants, payments, and logs
  const filterOutOwner = (collection) => db.set(collection, db.get(collection).filter(item => item.owner_id !== ownerId));
  
  filterOutOwner('properties');
  filterOutOwner('tenants');
  filterOutOwner('payment_history');
  filterOutOwner('automation_logs');

  res.json({
    success: true,
    message: 'All properties and tenants cleared for your account.'
  });
});

router.post('/account/load-demo', (req, res) => {
  const ownerId = req.owner.id;
  const today = new Date();
  const currentDay = today.getDate();

  const demoProperties = [
    {
      id: `prop-${Date.now()}-1`,
      name: 'Skyline Palms Residency',
      type: 'Apartment',
      address: '42 Orchid Boulevard, Block C',
      city: 'Chennai',
      state: 'Tamil Nadu',
      units_count: 8,
      default_rent: 22000,
      created_at: new Date().toISOString()
    },
    {
      id: `prop-${Date.now()}-2`,
      name: 'Emerald Heights Villas',
      type: 'Villa',
      address: '104 Hill View Greens, Anna Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      units_count: 4,
      default_rent: 45000,
      created_at: new Date().toISOString()
    }
  ];

  for (const prop of demoProperties) {
    db.insertForOwner('properties', ownerId, prop);
  }

  const demoTenants = [
    {
      id: `ten-${Date.now()}-1`,
      property_id: demoProperties[0].id,
      property_name: demoProperties[0].name,
      unit_number: 'A-204',
      name: 'Rahul Sharma',
      phone: '+91 98450 12345',
      email: 'rahul.sharma@example.com',
      rent_amount: 22000,
      due_day: Math.max(1, currentDay - 3),
      grace_days: 2,
      status: 'OVERDUE',
      last_paid_date: null,
      auto_call_enabled: true,
      auto_sms_enabled: true,
      auto_wa_enabled: true,
      created_at: new Date().toISOString()
    },
    {
      id: `ten-${Date.now()}-2`,
      property_id: demoProperties[0].id,
      property_name: demoProperties[0].name,
      unit_number: 'B-301',
      name: 'Priya Sundaram',
      phone: '+91 98765 43210',
      email: 'priya.sundaram@example.com',
      rent_amount: 24000,
      due_day: currentDay,
      grace_days: 3,
      status: 'DUE_TODAY',
      last_paid_date: null,
      auto_call_enabled: true,
      auto_sms_enabled: true,
      auto_wa_enabled: true,
      created_at: new Date().toISOString()
    }
  ];

  for (const tenant of demoTenants) {
    db.insertForOwner('tenants', ownerId, tenant);
  }

  res.json({
    success: true,
    message: 'Sample demo properties and tenants loaded into your account.'
  });
});

export default router;
