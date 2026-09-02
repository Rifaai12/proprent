import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runDatabaseMigrations } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../data/property_rent_db.json');

const DATABASE_URL = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Generate standard default bilingual automation rules for an owner
export const createDefaultRulesForOwner = (ownerId, ownerName = 'Property Owner') => {
  return [
    {
      id: `rule-${Date.now()}-1`,
      owner_id: ownerId,
      name: 'T-3 Days: Friendly WhatsApp & SMS Reminder (English First, Tamil Next)',
      trigger_type: 'before_due',
      days_offset: 3,
      channels: ['whatsapp', 'sms'],
      script_template: `Hello {tenant_name}! This is a friendly reminder from {owner_name} that your rent payment of {currency}{rent_amount} for unit {unit_number} at {property_name} is due on {due_date}. Thank you!

---
வணக்கம் {tenant_name}! {property_name} {unit_number} வீட்டின் வாடகைத் தொகை {currency}{rent_amount}, வரும் {due_date} அன்று செலுத்தப்பட வேண்டும். நன்றி! - {owner_name}`,
      is_active: true,
      call_pool_enabled: false
    },
    {
      id: `rule-${Date.now()}-2`,
      owner_id: ownerId,
      name: 'T-0 Due Today: Action Notice via WhatsApp + SMS',
      trigger_type: 'on_due',
      days_offset: 0,
      channels: ['whatsapp', 'sms'],
      script_template: `Rent Due Today: Dear {tenant_name}, your rent payment of {currency}{rent_amount} for {property_name} ({unit_number}) is due today ({due_date}). Please transfer to UPI {upi_id} or bank account.

---
இன்றே வாடகை செலுத்தும் நாள்: {tenant_name}, {property_name} ({unit_number})-க்கான உங்கள் வாடகைத் தொகை {currency}{rent_amount} இன்றே செலுத்த வேண்டும். நன்றி.`,
      is_active: true,
      call_pool_enabled: false
    },
    {
      id: `rule-${Date.now()}-3`,
      owner_id: ownerId,
      name: 'T+1 Overdue: First AI Voice Call (Tamil First, English Next) + WhatsApp',
      trigger_type: 'after_due',
      days_offset: 1,
      channels: ['ai_call', 'whatsapp'],
      script_template: `வணக்கம் {tenant_name}. இது {owner_name} இடமிருந்து வரும் தானியங்கி வாடகை நினைவூட்டல் அழைப்பு. {property_name} {unit_number} வீட்டின் வாடகைத் தொகை {currency}{rent_amount} செலுத்த வேண்டிய தேதி நேற்று முடிந்துவிட்டது. தயவுசெய்து உங்கள் வாடகையை இன்றே செலுத்தவும். நன்றி.

Hello {tenant_name}, this is an automated reminder from {owner_name}. Your rent payment of {currency}{rent_amount} for unit {unit_number} at {property_name} was due yesterday. Please confirm your payment today. Thank you.`,
      is_active: true,
      call_pool_enabled: true
    },
    {
      id: `rule-${Date.now()}-4`,
      owner_id: ownerId,
      name: 'T+3 Overdue: Escalated AI Call (Tamil First, English Next) + SMS',
      trigger_type: 'after_due',
      days_offset: 3,
      channels: ['ai_call', 'sms'],
      script_template: `முக்கிய அறிவிப்பு: வணக்கம் {tenant_name}. {property_name}-க்கான உங்கள் வாடகைத் தொகை {currency}{rent_amount} செலுத்துவதற்கு 3 நாட்கள் தாமதமாகிவிட்டது. அபராத கட்டணங்களை தவிர்க்க தயவுசெய்து இன்றே பணத்தை செலுத்தவும் அல்லது {owner_name}-ஐ உடனடியாக தொடர்பு கொள்ளவும்.

Urgent Notice: Hello {tenant_name}. Your rent payment of {currency}{rent_amount} for {property_name} is now 3 days overdue. To avoid late fees or lease penalties, please transfer the dues today or contact {owner_name} immediately.`,
      is_active: true,
      call_pool_enabled: true
    },
    {
      id: `rule-${Date.now()}-5`,
      owner_id: ownerId,
      name: 'T+5 Overdue: Critical AI Call Notice (Tamil First, English Next) + WhatsApp',
      trigger_type: 'after_due',
      days_offset: 5,
      channels: ['ai_call', 'whatsapp', 'sms'],
      script_template: `இறுதி எச்சரிக்கை: வணக்கம் {tenant_name}. {property_name} {unit_number} வீட்டின் வாடகைத் தொகை {currency}{rent_amount} செலுத்துவதற்கு 5 நாட்கள் தாமதமாகிவிட்டது. சட்ட ரீதியான நடவடிக்கைகளை தவிர்க்க உடனடியாக வாடகையை செலுத்தவும்.

Final Notice for {tenant_name}: Your rent for {property_name} ({unit_number}) is overdue by 5 days. Continued delay may result in legal default actions. Please remit {currency}{rent_amount} immediately.`,
      is_active: true,
      call_pool_enabled: true
    }
  ];
};

export const createDefaultSettingsForOwner = (ownerId, ownerName = 'Property Owner', ownerEmail = '', ownerPhone = '') => {
  return {
    owner_id: ownerId,
    currency_symbol: '₹',
    currency_code: 'INR',
    country_code: '+91',
    business_name: `${ownerName} Properties`,
    owner_name: ownerName,
    owner_phone: ownerPhone || '+91 98000 11223',
    owner_email: ownerEmail || '',
    upi_id: `${ownerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
    bank_account_info: 'HDFC Bank - A/C 50200012345678 - IFSC HDFC0001234',
    simulation_mode: true,
    rotation_strategy: 'anti_blocking_round_robin',
    telecom_providers: {
      twilio: { account_sid: '', auth_token: '', default_from_number: '' },
      whatsapp_cloud: { phone_number_id: '', access_token: '', business_account_id: '' },
      vapi_ai: { api_key: '', assistant_id: '' }
    }
  };
};

/**
 * PostgreSQL Production Database Layer
 */
class DatabaseManager {
  constructor() {
    this.isPostgres = false;
    this.pool = null;
    this.localData = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    if (DATABASE_URL) {
      console.log('[DATABASE] Connecting to PostgreSQL via DATABASE_URL...');
      const requiresSsl = DATABASE_URL.includes('render.com') ||
                          DATABASE_URL.includes('supabase.co') ||
                          DATABASE_URL.includes('neon.tech') ||
                          DATABASE_URL.includes('sslmode=require') ||
                          isProduction;

      this.pool = new pg.Pool({
        connectionString: DATABASE_URL,
        ssl: requiresSsl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      try {
        const client = await this.pool.connect();
        console.log('✅ [DATABASE] Successfully connected to PostgreSQL database!');
        client.release();

        // Run migrations
        await runDatabaseMigrations(this.pool);
        this.isPostgres = true;
        this.initialized = true;
        return;
      } catch (err) {
        console.error('❌ [DATABASE] Failed to connect to PostgreSQL:', err.message);
        if (isProduction) {
          throw new Error(`FATAL: PostgreSQL connection failed in production: ${err.message}`);
        }
        console.warn('⚠️ [DATABASE] Falling back to local storage for local development.');
      }
    } else if (isProduction) {
      throw new Error('FATAL: DATABASE_URL environment variable is required in production! Ephemeral JSON storage is disabled.');
    } else {
      console.warn('⚠️ [DATABASE] DATABASE_URL not set. Running in local fallback mode.');
    }

    // Local file fallback
    this.initLocalFallback();
    this.initialized = true;
  }

  initLocalFallback() {
    if (!fs.existsSync(DB_FILE)) {
      this.localData = {
        owners: [],
        properties: [],
        tenants: [],
        phone_numbers: [],
        rules: [],
        payment_history: [],
        automation_logs: [],
        settings_list: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.localData = JSON.parse(raw);
      } catch (e) {
        this.localData = { owners: [], properties: [], tenants: [], phone_numbers: [], rules: [], payment_history: [], automation_logs: [], settings_list: [] };
      }
    }
  }

  saveLocal() {
    if (this.localData && !this.isPostgres) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
      } catch (e) {
        console.error('Error saving local db:', e);
      }
    }
  }

  /**
   * Health Check helper
   */
  async checkHealth() {
    if (this.isPostgres && this.pool) {
      const start = Date.now();
      const res = await this.pool.query('SELECT NOW()');
      const tableCounts = await this.pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM owners) as owners,
          (SELECT COUNT(*) FROM properties) as properties,
          (SELECT COUNT(*) FROM tenants) as tenants,
          (SELECT COUNT(*) FROM rules) as rules
      `);
      return {
        status: 'connected',
        engine: 'PostgreSQL',
        latencyMs: Date.now() - start,
        timestamp: res.rows[0].now,
        tables: tableCounts.rows[0]
      };
    }

    return {
      status: 'connected',
      engine: 'Local Memory Fallback',
      warning: 'DATABASE_URL is not configured. Data is not stored in PostgreSQL.',
      propertiesCount: this.localData?.properties?.length || 0
    };
  }

  /**
   * Direct SQL query
   */
  async query(sql, params = []) {
    await this.init();
    if (this.isPostgres) {
      return this.pool.query(sql, params);
    }
    throw new Error('Direct SQL queries are only supported when PostgreSQL is connected');
  }

  // ================= GENERAL GET / FILTER ================= //

  async get(collection) {
    await this.init();
    if (this.isPostgres) {
      const tableName = collection === 'settings_list' ? 'settings' : collection;
      const res = await this.pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      return res.rows;
    }
    return this.localData[collection] || [];
  }

  async find(collection, predicate) {
    await this.init();
    if (this.isPostgres) {
      const items = await this.get(collection);
      return items.find(predicate);
    }
    return (this.localData[collection] || []).find(predicate);
  }

  // ================= OWNER-SCOPED CRUD OPERATIONS ================= //

  async getByOwner(collection, ownerId) {
    await this.init();
    if (!ownerId) return [];

    if (this.isPostgres) {
      const tableName = collection === 'settings_list' ? 'settings' : collection;
      const res = await this.pool.query(
        `SELECT * FROM ${tableName} WHERE owner_id = $1 ORDER BY created_at DESC`,
        [ownerId]
      );
      return res.rows;
    }

    return (this.localData[collection] || []).filter(item => item.owner_id === ownerId);
  }

  async findByOwner(collection, ownerId, predicateOrId) {
    await this.init();
    if (!ownerId) return null;

    if (this.isPostgres) {
      const tableName = collection === 'settings_list' ? 'settings' : collection;
      if (typeof predicateOrId === 'string') {
        const res = await this.pool.query(
          `SELECT * FROM ${tableName} WHERE owner_id = $1 AND id = $2 LIMIT 1`,
          [ownerId, predicateOrId]
        );
        return res.rows[0] || null;
      }
      const list = await this.getByOwner(collection, ownerId);
      return list.find(predicateOrId) || null;
    }

    const list = this.localData[collection] || [];
    if (typeof predicateOrId === 'string') {
      return list.find(item => item.owner_id === ownerId && item.id === predicateOrId) || null;
    }
    return list.find(item => item.owner_id === ownerId && predicateOrId(item)) || null;
  }

  async insertForOwner(collection, ownerId, item) {
    await this.init();
    if (!ownerId) throw new Error('Owner ID is required to insert scoped record');

    const scopedItem = {
      ...item,
      owner_id: ownerId,
      created_at: item.created_at || new Date().toISOString()
    };

    if (this.isPostgres) {
      const tableName = collection === 'settings_list' ? 'settings' : collection;
      const keys = Object.keys(scopedItem);
      const values = Object.values(scopedItem).map(v => 
        (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v
      );
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const res = await this.pool.query(sql, values);
      return res.rows[0];
    }

    if (!this.localData[collection]) this.localData[collection] = [];
    this.localData[collection].unshift(scopedItem);
    this.saveLocal();
    return scopedItem;
  }

  async updateForOwner(collection, ownerId, id, updates) {
    await this.init();
    if (!ownerId || !id) return null;

    const { owner_id, id: updateId, created_at, ...safeUpdates } = updates;
    safeUpdates.updated_at = new Date().toISOString();

    if (this.isPostgres) {
      const tableName = collection === 'settings_list' ? 'settings' : collection;
      const keys = Object.keys(safeUpdates);
      if (keys.length === 0) return this.findByOwner(collection, ownerId, id);

      const setClauses = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
      const values = keys.map(k => {
        const v = safeUpdates[k];
        return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
      });

      const sql = `UPDATE ${tableName} SET ${setClauses} WHERE id = $1 AND owner_id = $2 RETURNING *`;
      const res = await this.pool.query(sql, [id, ownerId, ...values]);
      return res.rows[0] || null;
    }

    const list = this.localData[collection] || [];
    const index = list.findIndex(i => i.id === id && i.owner_id === ownerId);
    if (index !== -1) {
      list[index] = { ...list[index], ...safeUpdates };
      this.saveLocal();
      return list[index];
    }
    return null;
  }

  async deleteForOwner(collection, ownerId, id) {
    await this.init();
    if (!ownerId || !id) return false;

    if (this.isPostgres) {
      const tableName = collection === 'settings_list' ? 'settings' : collection;
      const res = await this.pool.query(
        `DELETE FROM ${tableName} WHERE id = $1 AND owner_id = $2 RETURNING id`,
        [id, ownerId]
      );
      return res.rowCount > 0;
    }

    const list = this.localData[collection] || [];
    const initLen = list.length;
    this.localData[collection] = list.filter(i => !(i.id === id && i.owner_id === ownerId));
    if (this.localData[collection].length !== initLen) {
      this.saveLocal();
      return true;
    }
    return false;
  }

  // ================= OWNER SETTINGS ================= //

  async getSettingsForOwner(ownerId) {
    await this.init();
    if (!ownerId) return createDefaultSettingsForOwner('default', 'Property Owner');

    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM settings WHERE owner_id = $1', [ownerId]);
      if (res.rows.length > 0) {
        return res.rows[0];
      }

      // Initialize default settings in PostgreSQL for this owner
      const ownerRes = await this.pool.query('SELECT * FROM owners WHERE id = $1', [ownerId]);
      const owner = ownerRes.rows[0];
      const defaults = createDefaultSettingsForOwner(
        ownerId,
        owner ? owner.name : 'Property Owner',
        owner ? owner.email : '',
        owner ? owner.phone : ''
      );

      await this.pool.query(
        `INSERT INTO settings (owner_id, business_name, owner_name, owner_phone, owner_email, currency_symbol, currency_code, country_code, upi_id, bank_account_info, simulation_mode, rotation_strategy, telecom_providers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (owner_id) DO NOTHING`,
        [
          defaults.owner_id,
          defaults.business_name,
          defaults.owner_name,
          defaults.owner_phone,
          defaults.owner_email,
          defaults.currency_symbol,
          defaults.currency_code,
          defaults.country_code,
          defaults.upi_id,
          defaults.bank_account_info,
          defaults.simulation_mode,
          defaults.rotation_strategy,
          JSON.stringify(defaults.telecom_providers)
        ]
      );
      return defaults;
    }

    if (!this.localData.settings_list) this.localData.settings_list = [];
    let settings = this.localData.settings_list.find(s => s.owner_id === ownerId);
    if (!settings) {
      settings = createDefaultSettingsForOwner(ownerId, 'Property Owner');
      this.localData.settings_list.push(settings);
      this.saveLocal();
    }
    return settings;
  }

  async updateSettingsForOwner(ownerId, updates) {
    await this.init();
    if (!ownerId) return null;

    const { owner_id, ...safeUpdates } = updates;
    safeUpdates.updated_at = new Date().toISOString();

    if (this.isPostgres) {
      // Fetch current or defaults
      const current = await this.getSettingsForOwner(ownerId);
      const merged = { ...current, ...safeUpdates };

      await this.pool.query(
        `INSERT INTO settings (owner_id, business_name, owner_name, owner_phone, owner_email, currency_symbol, currency_code, country_code, upi_id, bank_account_info, simulation_mode, rotation_strategy, telecom_providers, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (owner_id) DO UPDATE SET
           business_name = EXCLUDED.business_name,
           owner_name = EXCLUDED.owner_name,
           owner_phone = EXCLUDED.owner_phone,
           owner_email = EXCLUDED.owner_email,
           currency_symbol = EXCLUDED.currency_symbol,
           currency_code = EXCLUDED.currency_code,
           country_code = EXCLUDED.country_code,
           upi_id = EXCLUDED.upi_id,
           bank_account_info = EXCLUDED.bank_account_info,
           simulation_mode = EXCLUDED.simulation_mode,
           rotation_strategy = EXCLUDED.rotation_strategy,
           telecom_providers = EXCLUDED.telecom_providers,
           updated_at = EXCLUDED.updated_at`,
        [
          ownerId,
          merged.business_name || '',
          merged.owner_name || '',
          merged.owner_phone || '',
          merged.owner_email || '',
          merged.currency_symbol || '₹',
          merged.currency_code || 'INR',
          merged.country_code || '+91',
          merged.upi_id || '',
          merged.bank_account_info || '',
          merged.simulation_mode !== false,
          merged.rotation_strategy || 'anti_blocking_round_robin',
          JSON.stringify(merged.telecom_providers || {}),
          merged.updated_at
        ]
      );
      return merged;
    }

    if (!this.localData.settings_list) this.localData.settings_list = [];
    const index = this.localData.settings_list.findIndex(s => s.owner_id === ownerId);
    if (index !== -1) {
      this.localData.settings_list[index] = { ...this.localData.settings_list[index], ...safeUpdates };
      this.saveLocal();
      return this.localData.settings_list[index];
    } else {
      const newSettings = { ...createDefaultSettingsForOwner(ownerId), ...safeUpdates, owner_id: ownerId };
      this.localData.settings_list.push(newSettings);
      this.saveLocal();
      return newSettings;
    }
  }

  /**
   * Initialize settings, 5 default bilingual rules, and 2 phone lines for newly registered owner
   */
  async initializeOwnerDefaults(ownerId, ownerName, ownerEmail, ownerPhone) {
    await this.init();

    // 1. Settings
    await this.updateSettingsForOwner(ownerId, {
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      business_name: `${ownerName} Properties`
    });

    // 2. Rules
    const existingRules = await this.getByOwner('rules', ownerId);
    if (existingRules.length === 0) {
      const defaultRules = createDefaultRulesForOwner(ownerId, ownerName);
      for (const rule of defaultRules) {
        await this.insertForOwner('rules', ownerId, rule);
      }
    }

    // 3. Virtual caller lines
    const existingNumbers = await this.getByOwner('phone_numbers', ownerId);
    if (existingNumbers.length === 0) {
      await this.insertForOwner('phone_numbers', ownerId, {
        id: `num-${Date.now()}-1`,
        phone_number: '+91 80474 81001',
        label: 'Line Alpha (Primary Calling Line)',
        provider: 'Twilio Virtual DID Pool',
        is_active: true,
        calls_count: 0,
        reputation: 'Clean (100% Delivery)'
      });
      await this.insertForOwner('phone_numbers', ownerId, {
        id: `num-${Date.now()}-2`,
        phone_number: '+91 80474 81002',
        label: 'Line Beta (Rotated Backup Line)',
        provider: 'Twilio Virtual DID Pool',
        is_active: true,
        calls_count: 0,
        reputation: 'Clean (100% Delivery)'
      });
    }
  }
}

export const db = new DatabaseManager();
