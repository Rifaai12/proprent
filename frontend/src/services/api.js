const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  logout: async () => {
    localStorage.removeItem('property_rent_token');
    localStorage.removeItem('property_rent_owner');
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {}
  },

  // Dashboard Metrics
  getDashboardMetrics: async () => {
    const res = await fetch(`${API_BASE}/dashboard-metrics`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Properties
  getProperties: async () => {
    const res = await fetch(`${API_BASE}/properties`, { headers: getAuthHeaders() });
    return res.json();
  },
  createProperty: async (data) => {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteProperty: async (id) => {
    const res = await fetch(`${API_BASE}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Tenants
  getTenants: async () => {
    const res = await fetch(`${API_BASE}/tenants`, { headers: getAuthHeaders() });
    return res.json();
  },
  createTenant: async (data) => {
    const res = await fetch(`${API_BASE}/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateTenant: async (id, data) => {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteTenant: async (id) => {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  markAsPaid: async (tenantId, paymentDetails = {}) => {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/mark-paid`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentDetails),
    });
    return res.json();
  },
  updateTenantStatus: async (tenantId, status) => {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Phone Number Pool
  getPhonePool: async () => {
    const res = await fetch(`${API_BASE}/phone-pool`, { headers: getAuthHeaders() });
    return res.json();
  },
  addPhoneNumber: async (data) => {
    const res = await fetch(`${API_BASE}/phone-pool`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  togglePhoneNumber: async (id, is_active) => {
    const res = await fetch(`${API_BASE}/phone-pool/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active }),
    });
    return res.json();
  },
  deletePhoneNumber: async (id) => {
    const res = await fetch(`${API_BASE}/phone-pool/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Rules & Automations
  getRules: async () => {
    const res = await fetch(`${API_BASE}/rules`, { headers: getAuthHeaders() });
    return res.json();
  },
  updateRule: async (id, data) => {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  runAutomationCycle: async () => {
    const res = await fetch(`${API_BASE}/automations/run-now`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Logs
  getLogs: async () => {
    const res = await fetch(`${API_BASE}/logs`, { headers: getAuthHeaders() });
    return res.json();
  },
  clearLogs: async () => {
    const res = await fetch(`${API_BASE}/logs/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Payments
  getPayments: async () => {
    const res = await fetch(`${API_BASE}/payments`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
    return res.json();
  },
  updateSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Simulator
  triggerSimulatorCall: async ({ tenant_id, channel, custom_script }) => {
    const res = await fetch(`${API_BASE}/simulator/trigger-call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tenant_id, channel, custom_script }),
    });
    return res.json();
  },
};
