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
router.get('/properties', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const properties = await db.getByOwner('properties', ownerId);
    const tenants = await db.getByOwner('tenants', ownerId);

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
  } catch (err) {
    console.error('[API GET /properties ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch properties from database' });
  }
});

router.post('/properties', async (req, res) => {
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

  try {
    // 1. Insert into database
    await db.insertForOwner('properties', ownerId, newProperty);

    // 2. Immediately verify existence in persistent database
    const verifiedProperty = await db.findByOwner('properties', ownerId, newProperty.id);
    if (!verifiedProperty) {
      throw new Error('Property creation verification failed: Record not found in database immediately after insert');
    }

    res.status(201).json(verifiedProperty);
  } catch (err) {
    console.error('[API POST /properties ERROR]:', err);
    res.status(500).json({ error: `Failed to save property to database: ${err.message}` });
  }
});

router.put('/properties/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const updated = await db.updateForOwner('properties', ownerId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Property not found or access denied' });
    res.json(updated);
  } catch (err) {
    console.error('[API PUT /properties ERROR]:', err);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

router.delete('/properties/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const deleted = await db.deleteForOwner('properties', ownerId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Property not found or access denied' });
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    console.error('[API DELETE /properties ERROR]:', err);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// ================= TENANTS (OWNER-SCOPED) ================= //
router.get('/tenants', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const tenants = await db.getByOwner('tenants', ownerId);
    const properties = await db.getByOwner('properties', ownerId);

    const enriched = tenants.map(tenant => {
      const prop = properties.find(p => p.id === tenant.property_id);
      return {
        ...tenant,
        property_name: prop ? prop.name : (tenant.property_name || 'Unassigned Property')
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('[API GET /tenants ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.post('/tenants', async (req, res) => {
  const ownerId = req.owner.id;
  const { property_id, unit_number, name, phone, email, rent_amount, due_day, grace_days, auto_call_enabled, auto_sms_enabled, auto_wa_enabled } = req.body;
  if (!name || !phone || !rent_amount) {
    return res.status(400).json({ error: 'Name, phone number, and rent amount are required' });
  }

  try {
    const prop = property_id ? await db.findByOwner('properties', ownerId, property_id) : null;

    const newTenant = {
      id: `ten-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      property_id: property_id || null,
      unit_number: unit_number || '101',
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      rent_amount: Number(rent_amount),
      due_day: Number(due_day) || 1,
      grace_days: Number(grace_days) || 3,
      status: 'UPCOMING',
      auto_call_enabled: auto_call_enabled !== false,
      auto_sms_enabled: auto_sms_enabled !== false,
      auto_wa_enabled: auto_wa_enabled !== false,
      created_at: new Date().toISOString()
    };

    const inserted = await db.insertForOwner('tenants', ownerId, newTenant);
    res.status(201).json({
      ...inserted,
      property_name: prop ? prop.name : 'Primary Property'
    });
  } catch (err) {
    console.error('[API POST /tenants ERROR]:', err);
    res.status(500).json({ error: 'Failed to save tenant' });
  }
});

router.put('/tenants/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const updated = await db.updateForOwner('tenants', ownerId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Tenant not found or access denied' });
    res.json(updated);
  } catch (err) {
    console.error('[API PUT /tenants ERROR]:', err);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

router.delete('/tenants/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const deleted = await db.deleteForOwner('tenants', ownerId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Tenant not found or access denied' });
    res.json({ success: true, message: 'Tenant deleted' });
  } catch (err) {
    console.error('[API DELETE /tenants ERROR]:', err);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
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

// Update tenant status directly (for testing & manual management)
router.post('/tenants/:id/status', async (req, res) => {
  const ownerId = req.owner.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const updated = await db.updateForOwner('tenants', ownerId, req.params.id, { status });
    if (!updated) return res.status(404).json({ error: 'Tenant not found or access denied' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SMART CALLER ID POOL ================= //
router.get('/phone-pool', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const pool = await NumberPoolService.getPool(ownerId);
    res.json(pool);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/phone-pool', async (req, res) => {
  const ownerId = req.owner.id;
  const { phone_number, label, provider } = req.body;
  if (!phone_number) return res.status(400).json({ error: 'Phone number is required' });
  try {
    const created = await NumberPoolService.addNumber(ownerId, { phone_number, label, provider });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/phone-pool/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const updated = await NumberPoolService.updateNumber(ownerId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Number not found or access denied' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/phone-pool/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const deleted = await NumberPoolService.deleteNumber(ownerId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Number not found or access denied' });
    res.json({ success: true, message: 'Caller line removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= AUTOMATION RULES ================= //
router.get('/rules', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const rules = await db.getByOwner('rules', ownerId);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules', async (req, res) => {
  const ownerId = req.owner.id;
  const newRule = {
    id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...req.body,
    is_active: req.body.is_active !== false
  };
  try {
    const inserted = await db.insertForOwner('rules', ownerId, newRule);
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rules/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const updated = await db.updateForOwner('rules', ownerId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Rule not found or access denied' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rules/:id', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const deleted = await db.deleteForOwner('rules', ownerId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Rule not found or access denied' });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  try {
    const tenant = await db.findByOwner('tenants', ownerId, tenant_id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found in your account' });

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
router.get('/whatsapp/status', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const status = await WhatsAppService.getStatus(ownerId);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live verification with Meta Graph API for Phone Number ID & Token validity
router.get('/whatsapp/verify', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const result = await WhatsAppService.verifyWithMeta(ownerId);
    if (!result.verified) {
      return res.status(400).json({ success: false, ...result });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TEST 1: Send Meta standard 'hello_world' pre-approved template message
router.post('/whatsapp/test-template', async (req, res) => {
  const ownerId = req.owner.id;
  const { testPhone, templateName, languageCode } = req.body;

  if (!testPhone) {
    return res.status(400).json({ success: false, error: 'Test destination phone number is required' });
  }

  try {
    const result = await WhatsAppService.sendTemplateMessage({
      to: testPhone,
      templateName: templateName || 'hello_world',
      languageCode: languageCode || 'en_US',
      ownerId
    });

    res.json({
      success: true,
      message: 'Message accepted by Meta',
      messageId: result.messageId,
      recipient: result.recipient,
      metaHttpStatus: result.metaHttpStatus,
      durationMs: result.durationMs
    });
  } catch (err) {
    console.error(`[API /whatsapp/test-template ERROR]:`, err.message);
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'TEMPLATE_TEST_FAILED',
      meta: err.meta || null
    });
  }
});

// TEST 2: Send Direct utility text message
router.post('/whatsapp/test-utility', async (req, res) => {
  const ownerId = req.owner.id;
  const { testPhone, message } = req.body;

  if (!testPhone) {
    return res.status(400).json({ success: false, error: 'Test destination phone number is required' });
  }

  const textBody = message || 'Hello! This is a test utility message from PropertyRent.AI via Meta WhatsApp Business Cloud API.';

  try {
    const result = await WhatsAppService.sendUtilityMessage({
      to: testPhone,
      body: textBody,
      ownerId,
      ruleName: 'Manual Utility Test',
      triggerEvent: 'Admin Utility Test'
    });

    res.json({
      success: true,
      message: 'Message accepted by Meta',
      messageId: result.messageId,
      recipient: result.recipient,
      metaHttpStatus: result.metaHttpStatus,
      durationMs: result.durationMs
    });
  } catch (err) {
    console.error(`[API /whatsapp/test-utility ERROR]:`, err.message);
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'UTILITY_TEST_FAILED',
      meta: err.meta || null
    });
  }
});

// Legacy / General test endpoint (defaults to utility test)
router.post('/whatsapp/test', async (req, res) => {
  const ownerId = req.owner.id;
  const { testPhone, message, useTemplate } = req.body;

  if (!testPhone) {
    return res.status(400).json({ success: false, error: 'Test destination phone number is required' });
  }

  try {
    let result;
    if (useTemplate) {
      result = await WhatsAppService.sendTemplateMessage({ to: testPhone, ownerId });
    } else {
      result = await WhatsAppService.sendUtilityMessage({
        to: testPhone,
        body: message || 'Hello! Test message from PropertyRent.AI.',
        ownerId
      });
    }

    res.json({
      success: true,
      message: 'Message accepted by Meta',
      messageId: result.messageId,
      recipient: result.recipient,
      metaHttpStatus: result.metaHttpStatus,
      durationMs: result.durationMs
    });
  } catch (err) {
    console.error(`[API /whatsapp/test ERROR]:`, err.message);
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'TEST_SEND_FAILED',
      meta: err.meta || null
    });
  }
});

// Send Direct WhatsApp Notice to an authenticated Owner's Tenant
router.post('/whatsapp/send', async (req, res) => {
  const ownerId = req.owner.id;
  const { tenantId, message, customMessage } = req.body;

  if (!tenantId) {
    return res.status(400).json({ success: false, error: 'Tenant ID is required' });
  }

  try {
    // Strictly verify that the tenant belongs to the authenticated owner
    const tenant = await db.findByOwner('tenants', ownerId, tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found in your account or access denied' });
    }

    const settings = await db.getSettingsForOwner(ownerId);
    const property = await db.findByOwner('properties', ownerId, tenant.property_id);
    const rawMessage = message || customMessage || `Hello {tenant_name}! This is a reminder regarding your rent of {currency}{rent_amount} for {property_name} ({unit_number}) due on {due_date}. Thank you! - {owner_name}`;
    const renderedMessage = TelecomService.renderTemplate(rawMessage, tenant, settings, property);

    const result = await WhatsAppService.sendUtilityMessage({
      to: tenant.phone,
      body: renderedMessage,
      ownerId,
      tenantId: tenant.id,
      ruleName: 'Manual Rent Notice',
      triggerEvent: 'Direct Owner Send'
    });

    res.json({
      success: true,
      message: 'Message accepted by Meta',
      messageId: result.messageId,
      recipient: result.recipient,
      metaHttpStatus: result.metaHttpStatus,
      log: result.log
    });
  } catch (err) {
    console.error(`[API /whatsapp/send ERROR]: ${err.message}`);
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'WHATSAPP_SEND_FAILED',
      meta: err.meta || null
    });
  }
});

// ================= LOGS & AUDIT TRAIL ================= //
router.get('/logs', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const logs = await db.getByOwner('automation_logs', ownerId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/logs/clear', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    if (db.isPostgres) {
      await db.query('DELETE FROM automation_logs WHERE owner_id = $1', [ownerId]);
    } else {
      const logs = await db.get('automation_logs');
      const remaining = logs.filter(l => l.owner_id !== ownerId);
      db.localData.automation_logs = remaining;
      db.saveLocal();
    }
    res.json({ success: true, message: 'Activity logs cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PAYMENTS HISTORY ================= //
router.get('/payments', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const payments = await db.getByOwner('payment_history', ownerId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SETTINGS ================= //
router.get('/settings', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const settings = await db.getSettingsForOwner(ownerId);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const updated = await db.updateSettingsForOwner(ownerId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DASHBOARD SUMMARY METRICS ================= //
router.get('/dashboard-metrics', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const tenants = await db.getByOwner('tenants', ownerId);
    const properties = await db.getByOwner('properties', ownerId);
    const phoneNumbers = await db.getByOwner('phone_numbers', ownerId);
    const logs = await db.getByOwner('automation_logs', ownerId);
    const settings = await db.getSettingsForOwner(ownerId);

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
  } catch (err) {
    console.error('[API /dashboard-metrics ERROR]:', err);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// ================= OPTIONAL DEMO DATA CONTROLS (PER-OWNER SCOPED) ================= //
router.post('/account/clear-demo', async (req, res) => {
  const ownerId = req.owner.id;
  try {
    if (db.isPostgres) {
      await db.query('DELETE FROM properties WHERE owner_id = $1', [ownerId]);
      await db.query('DELETE FROM tenants WHERE owner_id = $1', [ownerId]);
      await db.query('DELETE FROM payment_history WHERE owner_id = $1', [ownerId]);
      await db.query('DELETE FROM automation_logs WHERE owner_id = $1', [ownerId]);
    } else {
      const filterOutOwner = (collection) => {
        db.localData[collection] = (db.localData[collection] || []).filter(item => item.owner_id !== ownerId);
      };
      filterOutOwner('properties');
      filterOutOwner('tenants');
      filterOutOwner('payment_history');
      filterOutOwner('automation_logs');
      db.saveLocal();
    }

    res.json({
      success: true,
      message: 'All properties and tenants cleared for your account.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/account/load-demo', async (req, res) => {
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

  try {
    for (const prop of demoProperties) {
      await db.insertForOwner('properties', ownerId, prop);
    }

    const demoTenants = [
      {
        id: `ten-${Date.now()}-1`,
        property_id: demoProperties[0].id,
        unit_number: 'A-204',
        name: 'Rahul Sharma',
        phone: '+91 98450 12345',
        email: 'rahul.sharma@example.com',
        rent_amount: 22000,
        due_day: Math.max(1, currentDay - 3),
        grace_days: 2,
        status: 'OVERDUE',
        auto_call_enabled: true,
        auto_sms_enabled: true,
        auto_wa_enabled: true,
        created_at: new Date().toISOString()
      },
      {
        id: `ten-${Date.now()}-2`,
        property_id: demoProperties[0].id,
        unit_number: 'B-301',
        name: 'Priya Sundaram',
        phone: '+91 98765 43210',
        email: 'priya.sundaram@example.com',
        rent_amount: 24000,
        due_day: currentDay,
        grace_days: 3,
        status: 'DUE_TODAY',
        auto_call_enabled: true,
        auto_sms_enabled: true,
        auto_wa_enabled: true,
        created_at: new Date().toISOString()
      }
    ];

    for (const tenant of demoTenants) {
      await db.insertForOwner('tenants', ownerId, tenant);
    }

    res.json({
      success: true,
      message: 'Sample demo properties and tenants loaded into your account.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
