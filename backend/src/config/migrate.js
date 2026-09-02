import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../data/property_rent_db.json');

const SCHEMA_SQL = `
-- 1. Owners / Users
CREATE TABLE IF NOT EXISTS owners (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  role VARCHAR(50) DEFAULT 'SUPER_OWNER',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Properties
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) DEFAULT 'Apartment',
  address TEXT DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  state VARCHAR(100) DEFAULT '',
  units_count INTEGER DEFAULT 1,
  default_rent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- 3. Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  property_id VARCHAR(255) REFERENCES properties(id) ON DELETE SET NULL,
  unit_number VARCHAR(100) DEFAULT '',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  rent_amount NUMERIC DEFAULT 0,
  due_day INTEGER DEFAULT 5,
  grace_days INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'UPCOMING',
  auto_call_enabled BOOLEAN DEFAULT true,
  auto_sms_enabled BOOLEAN DEFAULT true,
  auto_wa_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);

-- 4. Rotated Phone Numbers Pool
CREATE TABLE IF NOT EXISTS phone_numbers (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  phone_number VARCHAR(50) NOT NULL,
  label VARCHAR(255) DEFAULT '',
  provider VARCHAR(100) DEFAULT 'Virtual Pool',
  is_active BOOLEAN DEFAULT true,
  rotation_order INTEGER DEFAULT 0,
  calls_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  reputation VARCHAR(100) DEFAULT 'Clean',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_owner_id ON phone_numbers(owner_id);

-- 5. Automation Dunning Rules
CREATE TABLE IF NOT EXISTS rules (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) DEFAULT 'after_due',
  days_offset INTEGER DEFAULT 1,
  channels JSONB DEFAULT '["whatsapp","sms"]'::jsonb,
  script_template TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  call_pool_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rules_owner_id ON rules(owner_id);

-- 6. Payment History
CREATE TABLE IF NOT EXISTS payment_history (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255),
  tenant_name VARCHAR(255),
  property_id VARCHAR(255),
  property_name VARCHAR(255),
  unit_number VARCHAR(100),
  amount NUMERIC DEFAULT 0,
  payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  payment_mode VARCHAR(100) DEFAULT 'UPI',
  notes TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'PAID',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_history_owner_id ON payment_history(owner_id);

-- 7. Automation Logs & Message Audit Trail
CREATE TABLE IF NOT EXISTS automation_logs (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255),
  tenant_name VARCHAR(255),
  tenant_phone VARCHAR(50),
  caller_id_used VARCHAR(100),
  caller_id_label VARCHAR(255),
  channel VARCHAR(50) DEFAULT 'whatsapp',
  trigger_event VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent',
  content TEXT,
  call_duration_sec INTEGER,
  provider_message_id VARCHAR(255),
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_automation_logs_owner_id ON automation_logs(owner_id);

-- 8. Owner Settings & Telecom Integrations
CREATE TABLE IF NOT EXISTS settings (
  owner_id VARCHAR(255) PRIMARY KEY REFERENCES owners(id) ON DELETE CASCADE,
  business_name VARCHAR(255) DEFAULT 'Apex Property Holdings',
  owner_name VARCHAR(255) DEFAULT 'Property Owner',
  owner_phone VARCHAR(50) DEFAULT '',
  owner_email VARCHAR(255) DEFAULT '',
  currency_symbol VARCHAR(10) DEFAULT '₹',
  currency_code VARCHAR(10) DEFAULT 'INR',
  country_code VARCHAR(10) DEFAULT '+91',
  upi_id VARCHAR(255) DEFAULT '',
  bank_account_info TEXT DEFAULT '',
  simulation_mode BOOLEAN DEFAULT true,
  rotation_strategy VARCHAR(100) DEFAULT 'anti_blocking_round_robin',
  telecom_providers JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Execute schema creation and data migration from local JSON file into PostgreSQL
 */
export async function runDatabaseMigrations(pool) {
  console.log('[MIGRATE] Running PostgreSQL schema migrations...');
  
  // 1. Create tables and indexes
  await pool.query(SCHEMA_SQL);
  console.log('[MIGRATE] All relational tables and indexes verified/created.');

  // 2. Check if owners exist in PostgreSQL
  const ownerCheck = await pool.query('SELECT COUNT(*) FROM owners');
  const count = parseInt(ownerCheck.rows[0].count, 10);

  if (count === 0 && fs.existsSync(DB_FILE)) {
    console.log('[MIGRATE] Database is empty. Importing existing data from property_rent_db.json...');
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);

      // Import Owners
      if (Array.isArray(data.owners)) {
        for (const o of data.owners) {
          await pool.query(
            `INSERT INTO owners (id, name, email, password, phone, role, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            [o.id, o.name, o.email, o.password, o.phone || '', o.role || 'SUPER_OWNER', o.created_at || new Date().toISOString()]
          );
        }
        console.log(`[MIGRATE] Imported ${data.owners.length} owners.`);
      }

      // Import Properties
      if (Array.isArray(data.properties)) {
        for (const p of data.properties) {
          if (!p.owner_id) continue;
          await pool.query(
            `INSERT INTO properties (id, owner_id, name, type, address, city, state, units_count, default_rent, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.owner_id, p.name, p.type || 'Apartment', p.address || '', p.city || '', p.state || '', p.units_count || 1, p.default_rent || 0, p.created_at || new Date().toISOString()]
          );
        }
        console.log(`[MIGRATE] Imported ${data.properties.length} properties.`);
      }

      // Import Tenants
      if (Array.isArray(data.tenants)) {
        for (const t of data.tenants) {
          if (!t.owner_id) continue;
          await pool.query(
            `INSERT INTO tenants (id, owner_id, property_id, unit_number, name, phone, email, rent_amount, due_day, grace_days, status, auto_call_enabled, auto_sms_enabled, auto_wa_enabled, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [t.id, t.owner_id, t.property_id || null, t.unit_number || '', t.name, t.phone, t.email || '', t.rent_amount || 0, t.due_day || 5, t.grace_days || 3, t.status || 'UPCOMING', t.auto_call_enabled !== false, t.auto_sms_enabled !== false, t.auto_wa_enabled !== false, t.created_at || new Date().toISOString()]
          );
        }
        console.log(`[MIGRATE] Imported ${data.tenants.length} tenants.`);
      }

      // Import Phone Numbers
      if (Array.isArray(data.phone_numbers)) {
        for (const n of data.phone_numbers) {
          if (!n.owner_id) continue;
          await pool.query(
            `INSERT INTO phone_numbers (id, owner_id, phone_number, label, provider, is_active, rotation_order, calls_count, reputation, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [n.id, n.owner_id, n.phone_number, n.label || '', n.provider || 'Virtual Pool', n.is_active !== false, n.rotation_order || 0, n.calls_count || 0, n.reputation || 'Clean', n.created_at || new Date().toISOString()]
          );
        }
        console.log(`[MIGRATE] Imported ${data.phone_numbers.length} phone lines.`);
      }

      // Import Rules
      if (Array.isArray(data.rules)) {
        for (const r of data.rules) {
          if (!r.owner_id) continue;
          await pool.query(
            `INSERT INTO rules (id, owner_id, name, trigger_type, days_offset, channels, script_template, is_active, call_pool_enabled, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [r.id, r.owner_id, r.name, r.trigger_type || 'after_due', r.days_offset || 1, JSON.stringify(r.channels || ['whatsapp']), r.script_template || '', r.is_active !== false, r.call_pool_enabled === true, r.created_at || new Date().toISOString()]
          );
        }
        console.log(`[MIGRATE] Imported ${data.rules.length} automation rules.`);
      }

      // Import Settings
      if (Array.isArray(data.settings_list)) {
        for (const s of data.settings_list) {
          if (!s.owner_id) continue;
          await pool.query(
            `INSERT INTO settings (owner_id, business_name, owner_name, owner_phone, owner_email, currency_symbol, currency_code, country_code, upi_id, bank_account_info, simulation_mode, rotation_strategy, telecom_providers)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (owner_id) DO NOTHING`,
            [s.owner_id, s.business_name || '', s.owner_name || '', s.owner_phone || '', s.owner_email || '', s.currency_symbol || '₹', s.currency_code || 'INR', s.country_code || '+91', s.upi_id || '', s.bank_account_info || '', s.simulation_mode !== false, s.rotation_strategy || 'anti_blocking_round_robin', JSON.stringify(s.telecom_providers || {})]
          );
        }
        console.log(`[MIGRATE] Imported ${data.settings_list.length} owner settings.`);
      }

      // Import Payment History
      if (Array.isArray(data.payment_history)) {
        for (const pay of data.payment_history) {
          if (!pay.owner_id) continue;
          await pool.query(
            `INSERT INTO payment_history (id, owner_id, tenant_id, tenant_name, property_id, property_name, unit_number, amount, payment_date, payment_mode, notes, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO NOTHING`,
            [pay.id, pay.owner_id, pay.tenant_id, pay.tenant_name, pay.property_id, pay.property_name, pay.unit_number, pay.amount, pay.payment_date || new Date().toISOString(), pay.payment_mode, pay.notes, pay.status || 'PAID', pay.created_at || new Date().toISOString()]
          );
        }
        console.log(`[MIGRATE] Imported ${data.payment_history.length} payment records.`);
      }

      console.log('[MIGRATE] Data migration completed successfully! All records now stored in PostgreSQL.');
    } catch (err) {
      console.error('[MIGRATE] Error during JSON data migration:', err);
    }
  } else {
    console.log(`[MIGRATE] PostgreSQL already has ${count} owners. Skipping initial JSON import.`);
  }
}
