// Normalize base API URL from environment variable (with fallback to relative /api)
const rawBase = import.meta.env.VITE_API_URL || '/api';
const API_BASE = rawBase.endsWith('/api') ? rawBase.replace(/\/$/, '') : `${rawBase.replace(/\/$/, '')}/api`;

export const getApiBaseUrl = () => API_BASE;

// Helper to get auth headers with Bearer token
const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('property_rent_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Safe fetch wrapper that captures full error diagnostics and handles 401
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      localStorage.removeItem('property_rent_token');
      localStorage.removeItem('property_rent_owner');
      window.dispatchEvent(new Event('auth_expired'));
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, error: err.message, networkError: true };
  }
};

export const api = {
  // Authentication
  login: async (email, password) => {
    return safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data) => {
    return safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  getMe: async () => {
    return safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
  },

  logout: async () => {
    localStorage.removeItem('property_rent_token');
    localStorage.removeItem('property_rent_owner');
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {}
  },

  // Demo Data Reset
  clearDemoData: async () => {
    return safeFetch(`${API_BASE}/account/clear-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  loadDemoData: async () => {
    return safeFetch(`${API_BASE}/account/load-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  // Dashboard Metrics
  getDashboardMetrics: async () => {
    return safeFetch(`${API_BASE}/dashboard-metrics`, { headers: getAuthHeaders() });
  },

  // Properties
  getProperties: async () => {
    return safeFetch(`${API_BASE}/properties`, { headers: getAuthHeaders() });
  },
  createProperty: async (data) => {
    return safeFetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteProperty: async (id) => {
    return safeFetch(`${API_BASE}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // Tenants
  getTenants: async () => {
    return safeFetch(`${API_BASE}/tenants`, { headers: getAuthHeaders() });
  },
  createTenant: async (data) => {
    return safeFetch(`${API_BASE}/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },
  updateTenant: async (id, data) => {
    return safeFetch(`${API_BASE}/tenants/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteTenant: async (id) => {
    return safeFetch(`${API_BASE}/tenants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
  markAsPaid: async (tenantId, paymentDetails = {}) => {
    return safeFetch(`${API_BASE}/tenants/${tenantId}/mark-paid`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentDetails),
    });
  },
  updateTenantStatus: async (tenantId, status) => {
    return safeFetch(`${API_BASE}/tenants/${tenantId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  // Phone Number Pool
  getPhonePool: async () => {
    return safeFetch(`${API_BASE}/phone-pool`, { headers: getAuthHeaders() });
  },
  addPhoneNumber: async (data) => {
    return safeFetch(`${API_BASE}/phone-pool`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },
  togglePhoneNumber: async (id, is_active) => {
    return safeFetch(`${API_BASE}/phone-pool/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active }),
    });
  },
  deletePhoneNumber: async (id) => {
    return safeFetch(`${API_BASE}/phone-pool/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // Rules & Automations
  getRules: async () => {
    return safeFetch(`${API_BASE}/rules`, { headers: getAuthHeaders() });
  },
  updateRule: async (id, data) => {
    return safeFetch(`${API_BASE}/rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },
  runAutomationCycle: async () => {
    return safeFetch(`${API_BASE}/automations/run-now`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  // Logs
  getLogs: async () => {
    return safeFetch(`${API_BASE}/logs`, { headers: getAuthHeaders() });
  },
  clearLogs: async () => {
    return safeFetch(`${API_BASE}/logs/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // Payments
  getPayments: async () => {
    return safeFetch(`${API_BASE}/payments`, { headers: getAuthHeaders() });
  },

  // Settings
  getSettings: async () => {
    return safeFetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
  },
  updateSettings: async (data) => {
    return safeFetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Meta WhatsApp Business Cloud API
  getWhatsAppStatus: async () => {
    return safeFetch(`${API_BASE}/whatsapp/status`, { headers: getAuthHeaders() });
  },
  verifyWhatsAppSetup: async () => {
    return safeFetch(`${API_BASE}/whatsapp/verify`, { headers: getAuthHeaders() });
  },
  testWhatsAppTemplate: async ({ testPhone, templateName, languageCode }) => {
    return safeFetch(`${API_BASE}/whatsapp/test-template`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ testPhone, templateName, languageCode }),
    });
  },
  testWhatsAppUtility: async ({ testPhone, message }) => {
    return safeFetch(`${API_BASE}/whatsapp/test-utility`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ testPhone, message }),
    });
  },
  sendWhatsAppMessage: async ({ tenantId, message }) => {
    return safeFetch(`${API_BASE}/whatsapp/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tenantId, message }),
    });
  },
  sendWhatsAppTest: async ({ testPhone, message, useTemplate }) => {
    return safeFetch(`${API_BASE}/whatsapp/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ testPhone, message, useTemplate }),
    });
  },

  // Voice Call Simulator
  triggerSimulatorCall: async ({ tenant_id, channel, custom_script }) => {
    return safeFetch(`${API_BASE}/simulator/trigger-call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tenant_id, channel, custom_script }),
    });
  },
};
