import express from 'express';
import { db } from '../config/db.js';
import { NumberPoolService } from '../services/numberPoolService.js';
import { AutomationService } from '../services/automationService.js';
import { TelecomService } from '../services/telecomService.js';

const router = express.Router();

// ================= PROPERTIES ================= //
router.get('/properties', (req, res) => {
  const properties = db.get('properties');
  const tenants = db.get('tenants');

  // Enrich with unit counts and active collection metrics
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
  const { name, type, address, city, state, units_count, default_rent } = req.body;
  if (!name) return res.status(400).json({ error: 'Property name is required' });

  const newProperty = {
    id: `prop-${Date.now()}`,
    name,
    type: type || 'Apartment',
    address: address || '',
    city: city || '',
    state: state || '',
    units_count: Number(units_count) || 1,
    default_rent: Number(default_rent) || 0,
    created_at: new Date().toISOString()
  };

  db.insert('properties', newProperty);
  res.status(201).json(newProperty);
});

router.put('/properties/:id', (req, res) => {
  const updated = db.update('properties', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Property not found' });
  res.json(updated);
});

router.delete('/properties/:id', (req, res) => {
  const deleted = db.delete('properties', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Property not found' });
  res.json({ success: true, message: 'Property deleted' });
});

// ================= TENANTS ================= //
router.get('/tenants', (req, res) => {
  const tenants = db.get('tenants');
  const properties = db.get('properties');

  const enriched = tenants.map(tenant => {
    const prop = properties.find(p => p.id === tenant.property_id);
    return {
      ...tenant,
      property_name: prop ? prop.name : (tenant.property_name || 'Unassigned')
    };
  });

  res.json(enriched);
});

router.post('/tenants', (req, res) => {
  const { property_id, unit_number, name, phone, email, rent_amount, due_day, grace_days, auto_call_enabled, auto_sms_enabled, auto_wa_enabled } = req.body;
  if (!name || !phone || !rent_amount) {
    return res.status(400).json({ error: 'Name, phone number, and rent amount are required' });
  }

  const prop = db.find('properties', p => p.id === property_id);

  const newTenant = {
    id: `ten-${Date.now()}`,
    property_id: property_id || '',
    property_name: prop ? prop.name : 'Primary Property',
    unit_number: unit_number || '101',
    name,
    phone,
    email: email || '',
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

  db.insert('tenants', newTenant);
  res.status(201).json(newTenant);
});

router.put('/tenants/:id', (req, res) => {
  const updated = db.update('tenants', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Tenant not found' });
  res.json(updated);
});

router.delete('/tenants/:id', (req, res) => {
  const deleted = db.delete('tenants', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Tenant not found' });
  res.json({ success: true, message: 'Tenant deleted' });
});

// ================= MARK AS PAID (KILL SWITCH) ================= //
router.post('/tenants/:id/mark-paid', async (req, res) => {
  try {
    const result = await AutomationService.markAsPaid(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tenant status directly (for testing/simulations)
router.post('/tenants/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  const updated = db.update('tenants', req.params.id, { status });
  res.json(updated);
});

// ================= ANTI-BLOCKING PHONE NUMBER POOL ================= //
router.get('/phone-pool', (req, res) => {
  const pool = NumberPoolService.getPool();
  res.json(pool);
});

router.post('/phone-pool', (req, res) => {
  const { phone_number, label, provider } = req.body;
  if (!phone_number) return res.status(400).json({ error: 'Phone number is required' });
  const created = NumberPoolService.addNumber({ phone_number, label, provider });
  res.status(201).json(created);
});

router.put('/phone-pool/:id', (req, res) => {
  const updated = NumberPoolService.updateNumber(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Number not found' });
  res.json(updated);
});

router.delete('/phone-pool/:id', (req, res) => {
  const deleted = NumberPoolService.deleteNumber(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Number not found' });
  res.json({ success: true });
});

// ================= AUTOMATION RULES & ENGINE ================= //
router.get('/rules', (req, res) => {
  res.json(db.get('rules'));
});

router.post('/rules', (req, res) => {
  const newRule = {
    id: `rule-${Date.now()}`,
    ...req.body,
    is_active: req.body.is_active !== false
  };
  db.insert('rules', newRule);
  res.status(201).json(newRule);
});

router.put('/rules/:id', (req, res) => {
  const updated = db.update('rules', req.params.id, req.body);
  res.json(updated);
});

router.delete('/rules/:id', (req, res) => {
  db.delete('rules', req.params.id);
  res.json({ success: true });
});

// Trigger a manual run of the automated due checker
router.post('/automations/run-now', async (req, res) => {
  try {
    const results = await AutomationService.runAutomationCycle();
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

// Trigger a single simulated or live test call/message directly
router.post('/simulator/trigger-call', async (req, res) => {
  const { tenant_id, custom_script, channel } = req.body;
  const tenant = db.find('tenants', t => t.id === tenant_id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  try {
    let logResult;
    if (channel === 'whatsapp') {
      const defaultWhatsAppScript = `Hello {tenant_name}! This is a reminder regarding your rent of {currency}{rent_amount} for {property_name} ({unit_number}) due on {due_date}. Please pay via UPI or Bank transfer. Thank you! - {owner_name}

---
அன்புள்ள {tenant_name}, {property_name} ({unit_number})-க்கான உங்கள் வாடகைத் தொகை {currency}{rent_amount}, வரும் {due_date} அன்று செலுத்தப்பட வேண்டும். தயவுசெய்து UPI அல்லது வங்கி மூலம் செலுத்தவும். நன்றி! - {owner_name}`;

      logResult = await TelecomService.dispatchWhatsAppMessage({
        tenant,
        messageText: custom_script || defaultWhatsAppScript,
        ruleName: 'Manual Simulator Test'
      });
    } else if (channel === 'sms') {
      logResult = await TelecomService.dispatchSMS({
        tenant,
        messageText: custom_script || 'Rent notice: {currency}{rent_amount} due for {property_name}. தயவுசெய்து வாடகையை செலுத்தவும்.',
        ruleName: 'Manual Simulator Test'
      });
    } else {
      // AI Voice call with anti-blocking caller ID rotation (Tamil First, English Next)
      const defaultVoiceScript = `வணக்கம் {tenant_name}. இது {owner_name} இடமிருந்து வரும் தானியங்கி வாடகை நினைவூட்டல் அழைப்பு. {property_name} {unit_number} வீட்டின் வாடகைத் தொகை {currency}{rent_amount} செலுத்துவதற்கு நிலுவையில் உள்ளது. தயவுசெய்து உங்கள் வாடகையை உடனடியாக செலுத்தவும். நன்றி.

Hello {tenant_name}. This is an automated call from {owner_name} regarding your rent of {currency}{rent_amount} for {property_name} ({unit_number}). Please make payment as soon as possible. Thank you.`;

      logResult = await TelecomService.dispatchVoiceCall({
        tenant,
        scriptText: custom_script || defaultVoiceScript,
        ruleName: 'Manual Simulator Test'
      });
    }

    res.json({ success: true, log: logResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LOGS & AUDIT TRAIL ================= //
router.get('/logs', (req, res) => {
  const logs = db.get('automation_logs');
  res.json(logs);
});

router.delete('/logs/clear', (req, res) => {
  db.set('automation_logs', []);
  res.json({ success: true, message: 'Logs cleared' });
});

// ================= PAYMENTS HISTORY ================= //
router.get('/payments', (req, res) => {
  res.json(db.get('payment_history'));
});

// ================= SETTINGS ================= //
router.get('/settings', (req, res) => {
  res.json(db.getSettings());
});

router.put('/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// ================= DASHBOARD SUMMARY METRICS ================= //
router.get('/dashboard-metrics', (req, res) => {
  const tenants = db.get('tenants');
  const properties = db.get('properties');
  const phoneNumbers = db.get('phone_numbers');
  const logs = db.get('automation_logs');
  const settings = db.getSettings();

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
// ================= DEMO DATA CONTROL (CLEAR / RESET) ================= //
router.post('/account/clear-demo', (req, res) => {
  db.set('properties', []);
  db.set('tenants', []);
  db.set('payment_history', []);
  db.set('automation_logs', []);
  res.json({
    success: true,
    message: 'Demo data cleared successfully. Account is now ready for your own properties and tenants!'
  });
});

router.post('/account/load-demo', (req, res) => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString('default', { month: 'short' });
  const currentYear = today.getFullYear();

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

  db.set('properties', demoProperties);
  db.set('tenants', demoTenants);

  res.json({
    success: true,
    message: 'Sample demo data loaded successfully'
  });
});

export default router;
