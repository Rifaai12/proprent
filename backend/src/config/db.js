import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'property_rent_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate standard default bilingual automation rules for a specific owner
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

// Generate default owner settings
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
      twilio: {
        account_sid: '',
        auth_token: '',
        default_from_number: ''
      },
      whatsapp_cloud: {
        phone_number_id: '',
        access_token: '',
        business_account_id: ''
      },
      vapi_ai: {
        api_key: '',
        assistant_id: ''
      }
    }
  };
};

// Generate initial demo database state (with records strictly tagged to demo owner-1)
export const getDefaultState = () => {
  const demoOwnerId = 'owner-1';
  const mohamedOwnerId = 'owner-2';

  return {
    owners: [
      {
        id: demoOwnerId,
        name: 'Vikram (Property Owner)',
        email: 'owner@apexproperties.com',
        password: '$2b$10$XnHjHnxxy0kBXREcd.66aeS7s6WCO/Mz1pWT7ujG73Xz4QnZc4FNS', // password123
        phone: '+91 98000 11223',
        role: 'SUPER_OWNER',
        created_at: new Date().toISOString()
      },
      {
        id: mohamedOwnerId,
        name: 'Mohamed Rifaai',
        email: 'mohamedrifaai151@gmail.com',
        password: '$2b$10$2CUFVR4.Qh0T7LqC/w75But2QSWBpp3KWsuWkqM3TbI6Fj4Pnekz.', // Nazeer21
        phone: '+91 98450 99887',
        role: 'SUPER_OWNER',
        created_at: new Date().toISOString()
      }
    ],
    properties: [],
    tenants: [],
    phone_numbers: [],
    rules: [
      ...createDefaultRulesForOwner(demoOwnerId, 'Vikram'),
      ...createDefaultRulesForOwner(mohamedOwnerId, 'Mohamed Rifaai')
    ],
    payment_history: [],
    automation_logs: [],
    settings_list: [
      createDefaultSettingsForOwner(demoOwnerId, 'Vikram', 'owner@apexproperties.com', '+91 98000 11223'),
      createDefaultSettingsForOwner(mohamedOwnerId, 'Mohamed Rifaai', 'mohamedrifaai151@gmail.com', '+91 98450 99887')
    ]
  };
};

class JSONDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = getDefaultState();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      this.data = defaultData;
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all required collections exist
        if (!this.data.owners) this.data.owners = [];
        if (!this.data.properties) this.data.properties = [];
        if (!this.data.tenants) this.data.tenants = [];
        if (!this.data.phone_numbers) this.data.phone_numbers = [];
        if (!this.data.rules) this.data.rules = [];
        if (!this.data.payment_history) this.data.payment_history = [];
        if (!this.data.automation_logs) this.data.automation_logs = [];
        if (!this.data.settings_list) this.data.settings_list = [];
      } catch (err) {
        console.error('[DB] Error reading database file, reinitializing with clean state:', err);
        this.data = getDefaultState();
        this.save();
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error saving database to file:', err);
    }
  }

  // ================= GENERAL COLLECTION ACCESS ================= //
  get(collection) {
    return this.data[collection] || [];
  }

  set(collection, items) {
    this.data[collection] = items;
    this.save();
  }

  find(collection, predicate) {
    const list = this.get(collection);
    return list.find(predicate);
  }

  filter(collection, predicate) {
    const list = this.get(collection);
    return list.filter(predicate);
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].unshift(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex(i => i.id === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, id) {
    if (!this.data[collection]) return false;
    const initialLen = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(i => i.id !== id);
    if (this.data[collection].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ================= OWNER-SCOPED ISOLATION METHODS ================= //
  
  getByOwner(collection, ownerId) {
    if (!ownerId) return [];
    const list = this.get(collection);
    return list.filter(item => item.owner_id === ownerId);
  }

  findByOwner(collection, ownerId, predicate) {
    if (!ownerId) return null;
    const list = this.get(collection);
    return list.find(item => item.owner_id === ownerId && predicate(item));
  }

  filterByOwner(collection, ownerId, predicate) {
    if (!ownerId) return [];
    const list = this.get(collection);
    return list.filter(item => item.owner_id === ownerId && predicate(item));
  }

  insertForOwner(collection, ownerId, item) {
    if (!ownerId) throw new Error('Owner ID is required to insert scoped record');
    const scopedItem = {
      ...item,
      owner_id: ownerId
    };
    return this.insert(collection, scopedItem);
  }

  updateForOwner(collection, ownerId, id, updates) {
    if (!ownerId || !id) return null;
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex(i => i.id === id && i.owner_id === ownerId);
    if (index !== -1) {
      // Prevent mutating owner_id
      const { owner_id, ...safeUpdates } = updates;
      this.data[collection][index] = { ...this.data[collection][index], ...safeUpdates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  deleteForOwner(collection, ownerId, id) {
    if (!ownerId || !id) return false;
    if (!this.data[collection]) return false;
    const initialLen = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(i => !(i.id === id && i.owner_id === ownerId));
    if (this.data[collection].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ================= OWNER SETTINGS ================= //
  
  getSettingsForOwner(ownerId) {
    if (!ownerId) return createDefaultSettingsForOwner('default', 'Property Owner');
    if (!this.data.settings_list) this.data.settings_list = [];
    
    let settings = this.data.settings_list.find(s => s.owner_id === ownerId);
    if (!settings) {
      // Find owner details to initialize customized settings
      const owner = this.find('owners', o => o.id === ownerId);
      settings = createDefaultSettingsForOwner(
        ownerId, 
        owner ? owner.name : 'Property Owner',
        owner ? owner.email : '',
        owner ? owner.phone : ''
      );
      this.data.settings_list.push(settings);
      this.save();
    }
    return settings;
  }

  updateSettingsForOwner(ownerId, updates) {
    if (!ownerId) return null;
    if (!this.data.settings_list) this.data.settings_list = [];
    
    const index = this.data.settings_list.findIndex(s => s.owner_id === ownerId);
    const { owner_id, ...safeUpdates } = updates;

    if (index !== -1) {
      this.data.settings_list[index] = { ...this.data.settings_list[index], ...safeUpdates };
      this.save();
      return this.data.settings_list[index];
    } else {
      const newSettings = {
        ...createDefaultSettingsForOwner(ownerId),
        ...safeUpdates,
        owner_id: ownerId
      };
      this.data.settings_list.push(newSettings);
      this.save();
      return newSettings;
    }
  }

  // Initialize new owner defaults (settings + rules + 1 default number)
  initializeOwnerDefaults(ownerId, ownerName, ownerEmail, ownerPhone) {
    // 1. Initialize settings
    this.updateSettingsForOwner(ownerId, {
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      business_name: `${ownerName} Properties`
    });

    // 2. Initialize default rules if none exist for owner
    const existingRules = this.getByOwner('rules', ownerId);
    if (existingRules.length === 0) {
      const defaultRules = createDefaultRulesForOwner(ownerId, ownerName);
      for (const rule of defaultRules) {
        this.insert('rules', rule);
      }
    }

    // 3. Initialize default virtual caller line if none exist
    const existingNumbers = this.getByOwner('phone_numbers', ownerId);
    if (existingNumbers.length === 0) {
      this.insert('phone_numbers', {
        id: `num-${Date.now()}-1`,
        owner_id: ownerId,
        phone_number: '+91 80474 81001',
        label: 'Line Alpha (Primary Calling Line)',
        provider: 'Twilio Virtual DID Pool',
        is_active: true,
        calls_count: 0,
        last_used_at: null,
        reputation: 'Clean (100% Delivery)'
      });
      this.insert('phone_numbers', {
        id: `num-${Date.now()}-2`,
        owner_id: ownerId,
        phone_number: '+91 80474 81002',
        label: 'Line Beta (Rotated Backup Line)',
        provider: 'Twilio Virtual DID Pool',
        is_active: true,
        calls_count: 0,
        last_used_at: null,
        reputation: 'Clean (100% Delivery)'
      });
    }
  }
}

export const db = new JSONDatabase();
