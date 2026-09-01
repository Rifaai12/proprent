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

// Initial default database state with bilingual Tamil & English templates
export const getDefaultState = () => {
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'short' });
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  return {
    properties: [
      {
        id: 'prop-1',
        name: 'Skyline Palms Residency',
        type: 'Apartment',
        address: '42 Orchid Boulevard, Block C',
        city: 'Chennai',
        state: 'Tamil Nadu',
        units_count: 8,
        default_rent: 22000,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'prop-2',
        name: 'Emerald Heights Villas',
        type: 'Villa',
        address: '104 Hill View Greens, Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        units_count: 4,
        default_rent: 45000,
        created_at: new Date(Date.now() - 60 * 86400000).toISOString()
      },
      {
        id: 'prop-3',
        name: 'TechPark Commercial Complex',
        type: 'Commercial',
        address: 'Plot 18, OMR IT Corridor',
        city: 'Chennai',
        state: 'Tamil Nadu',
        units_count: 6,
        default_rent: 65000,
        created_at: new Date(Date.now() - 90 * 86400000).toISOString()
      }
    ],
    tenants: [
      {
        id: 'ten-1',
        property_id: 'prop-1',
        property_name: 'Skyline Palms Residency',
        unit_number: 'A-204',
        name: 'Rahul Sharma',
        phone: '+91 98450 12345',
        email: 'rahul.sharma@example.com',
        rent_amount: 22000,
        due_day: Math.max(1, currentDay - 3), // 3 days overdue
        grace_days: 2,
        status: 'OVERDUE',
        last_paid_date: `${currentYear}-${String(today.getMonth()).padStart(2, '0')}-05`,
        auto_call_enabled: true,
        auto_sms_enabled: true,
        auto_wa_enabled: true,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString()
      },
      {
        id: 'ten-2',
        property_id: 'prop-1',
        property_name: 'Skyline Palms Residency',
        unit_number: 'B-301',
        name: 'Priya Sundaram',
        phone: '+91 98765 43210',
        email: 'priya.sundaram@example.com',
        rent_amount: 24000,
        due_day: currentDay, // Due today
        grace_days: 3,
        status: 'DUE_TODAY',
        last_paid_date: `${currentYear}-${String(today.getMonth()).padStart(2, '0')}-01`,
        auto_call_enabled: true,
        auto_sms_enabled: true,
        auto_wa_enabled: true,
        created_at: new Date(Date.now() - 90 * 86400000).toISOString()
      },
      {
        id: 'ten-3',
        property_id: 'prop-2',
        property_name: 'Emerald Heights Villas',
        unit_number: 'Villa-12',
        name: 'Vikram Malhotra',
        phone: '+91 99887 76655',
        email: 'vikram.m@example.com',
        rent_amount: 45000,
        due_day: Math.min(28, currentDay + 4), // Upcoming in 4 days
        grace_days: 5,
        status: 'UPCOMING',
        last_paid_date: `${currentYear}-${String(today.getMonth()).padStart(2, '0')}-10`,
        auto_call_enabled: true,
        auto_sms_enabled: true,
        auto_wa_enabled: true,
        created_at: new Date(Date.now() - 120 * 86400000).toISOString()
      },
      {
        id: 'ten-4',
        property_id: 'prop-3',
        property_name: 'TechPark Commercial Complex',
        unit_number: 'Suite-4B',
        name: 'NexGen Digital Solutions (Ananya Roy)',
        phone: '+91 91234 56789',
        email: 'accounts@nexgendigital.io',
        rent_amount: 65000,
        due_day: 1,
        grace_days: 5,
        status: 'PAID',
        last_paid_date: `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}-02`,
        auto_call_enabled: true,
        auto_sms_enabled: true,
        auto_wa_enabled: true,
        created_at: new Date(Date.now() - 180 * 86400000).toISOString()
      }
    ],
    phone_numbers: [
      {
        id: 'num-1',
        phone_number: '+91 80474 81001',
        label: 'Caller Line Alpha (Primary Line)',
        provider: 'Exotel / Twilio Voice Pool',
        is_active: true,
        calls_count: 14,
        last_used_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        reputation: 'Clean (100% Delivery)'
      },
      {
        id: 'num-2',
        phone_number: '+91 80474 81002',
        label: 'Caller Line Beta (Secondary Line)',
        provider: 'Twilio Cloud Voice',
        is_active: true,
        calls_count: 11,
        last_used_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        reputation: 'Clean (100% Delivery)'
      },
      {
        id: 'num-3',
        phone_number: '+91 80474 81003',
        label: 'Caller Line Gamma (Priority DID)',
        provider: 'Vapi / Bland AI Pool',
        is_active: true,
        calls_count: 8,
        last_used_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        reputation: 'Clean (100% Delivery)'
      },
      {
        id: 'num-4',
        phone_number: '+91 80474 81004',
        label: 'Caller Line Delta (Escalation Line)',
        provider: 'Twilio Virtual DID',
        is_active: true,
        calls_count: 5,
        last_used_at: new Date(Date.now() - 3600000 * 30).toISOString(),
        reputation: 'Clean (100% Delivery)'
      }
    ],
    rules: [
      {
        id: 'rule-1',
        name: 'T-3 Days: Friendly Reminder (WhatsApp: English First, Tamil Next)',
        trigger_type: 'before_due',
        days_offset: 3,
        channels: ['whatsapp'],
        script_template: `Hello {tenant_name}! Friendly reminder that your rent of {currency}{rent_amount} for {property_name} ({unit_number}) is due on {due_date}. You can pay via UPI or Bank Transfer. Thank you! - {owner_name}

---
அன்புள்ள {tenant_name}, {property_name} ({unit_number})-க்கான உங்கள் வாடகைத் தொகை {currency}{rent_amount}, வரும் {due_date} அன்று செலுத்தப்பட வேண்டும். தயவுசெய்து UPI அல்லது வங்கி மூலம் செலுத்தவும். நன்றி! - {owner_name}`,
        is_active: true,
        call_pool_enabled: false
      },
      {
        id: 'rule-2',
        name: 'T-0 (Due Day): Official Due Notice (WhatsApp: English First, Tamil Next)',
        trigger_type: 'on_due',
        days_offset: 0,
        channels: ['whatsapp', 'sms'],
        script_template: `Dear {tenant_name}, your rent payment of {currency}{rent_amount} for {property_name} is due today ({due_date}). Please process payment at your earliest convenience. If already paid, kindly ignore. Regards, {owner_name}.

---
அன்புள்ள {tenant_name}, {property_name}-க்கான உங்கள் மாத வாடகை {currency}{rent_amount} இன்று ({due_date}) செலுத்த வேண்டிய நாள். தயவுசெய்து உங்கள் வாடகையை உடனடியாக செலுத்தவும். ஏற்கனவே செலுத்தியிருந்தால் இதை புறக்கணிக்கவும். இப்படிக்கு, {owner_name}.`,
        is_active: true,
        call_pool_enabled: false
      },
      {
        id: 'rule-3',
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
        id: 'rule-4',
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
        id: 'rule-5',
        name: 'T+5 Overdue: Critical AI Call Notice (Tamil First, English Next) + WhatsApp',
        trigger_type: 'after_due',
        days_offset: 5,
        channels: ['ai_call', 'whatsapp', 'sms'],
        script_template: `இறுதி எச்சரிக்கை: வணக்கம் {tenant_name}. {property_name} {unit_number} வீட்டின் வாடகைத் தொகை {currency}{rent_amount} செலுத்துவதற்கு 5 நாட்கள் தாமதமாகிவிட்டது. சட்ட ரீதியான நடவடிக்கைகளை தவிர்க்க உடனடியாக வாடகையை செலுத்தவும்.

Final Notice for {tenant_name}: Your rent for {property_name} ({unit_number}) is overdue by 5 days. Continued delay may result in legal default actions. Please remit {currency}{rent_amount} immediately.`,
        is_active: true,
        call_pool_enabled: true
      }
    ],
    payment_history: [
      {
        id: 'pay-1',
        tenant_id: 'ten-4',
        tenant_name: 'NexGen Digital Solutions',
        property_name: 'TechPark Commercial Complex',
        amount: 65000,
        paid_on: new Date(Date.now() - 86400000 * 2).toISOString(),
        cycle_month: currentMonth,
        cycle_year: currentYear,
        payment_mode: 'NEFT / Bank Transfer',
        reference_id: 'HDFC-TXN-998822',
        notes: 'Paid on time for current cycle',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    automation_logs: [
      {
        id: 'log-1',
        tenant_id: 'ten-1',
        tenant_name: 'Rahul Sharma',
        tenant_phone: '+91 98450 12345',
        caller_id_used: '+91 80474 81001',
        channel: 'ai_call',
        trigger_event: 'T+1 Overdue Call',
        status: 'answered',
        content: 'வணக்கம் Rahul Sharma... Hello Rahul Sharma, reminder for 22,000 INR...',
        call_duration_sec: 42,
        tenant_response_intent: 'Tenant stated: Will pay by Friday evening',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    settings: {
      currency_symbol: '₹',
      currency_code: 'INR',
      country_code: '+91',
      business_name: 'Apex Property Holdings',
      owner_name: 'Mohamed Rifaai',
      owner_phone: '+91 98450 99887',
      owner_email: 'mohamedrifaai151@gmail.com',
      upi_id: 'apexproperties@okaxis',
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
    },
    owners: [
      {
        id: 'owner-1',
        name: 'Vikram (Property Owner)',
        email: 'owner@apexproperties.com',
        password: '$2b$10$XnHjHnxxy0kBXREcd.66aeS7s6WCO/Mz1pWT7ujG73Xz4QnZc4FNS',
        phone: '+91 98000 11223',
        role: 'SUPER_OWNER',
        created_at: new Date(Date.now() - 90 * 86400000).toISOString()
      },
      {
        id: 'owner-2',
        name: 'Mohamed Rifaai',
        email: 'mohamedrifaai151@gmail.com',
        password: '$2b$10$2CUFVR4.Qh0T7LqC/w75But2QSWBpp3KWsuWkqM3TbI6Fj4Pnekz.',
        phone: '+91 98450 99887',
        role: 'SUPER_OWNER',
        created_at: new Date(Date.now() - 90 * 86400000).toISOString()
      }
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
      } catch (err) {
        console.error('Error reading database file, reinitializing with default:', err);
        this.data = getDefaultState();
        this.save();
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

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

  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }
}

export const db = new JSONDatabase();
