const API_BASE = '/api';

export const api = {
  // Metrics
  getDashboardMetrics: async () => {
    const res = await fetch(`${API_BASE}/dashboard-metrics`);
    return res.json();
  },

  // Properties
  getProperties: async () => {
    const res = await fetch(`${API_BASE}/properties`);
    return res.json();
  },
  createProperty: async (data) => {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteProperty: async (id) => {
    const res = await fetch(`${API_BASE}/properties/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Tenants
  getTenants: async () => {
    const res = await fetch(`${API_BASE}/tenants`);
    return res.json();
  },
  createTenant: async (data) => {
    const res = await fetch(`${API_BASE}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateTenant: async (id, data) => {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteTenant: async (id) => {
    const res = await fetch(`${API_BASE}/tenants/${id}`, { method: 'DELETE' });
    return res.json();
  },
  markAsPaid: async (tenantId, paymentDetails = {}) => {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentDetails),
    });
    return res.json();
  },
  updateTenantStatus: async (tenantId, status) => {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Phone Number Pool
  getPhonePool: async () => {
    const res = await fetch(`${API_BASE}/phone-pool`);
    return res.json();
  },
  addPhoneNumber: async (data) => {
    const res = await fetch(`${API_BASE}/phone-pool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  togglePhoneNumber: async (id, is_active) => {
    const res = await fetch(`${API_BASE}/phone-pool/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    });
    return res.json();
  },
  deletePhoneNumber: async (id) => {
    const res = await fetch(`${API_BASE}/phone-pool/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Rules & Automations
  getRules: async () => {
    const res = await fetch(`${API_BASE}/rules`);
    return res.json();
  },
  updateRule: async (id, data) => {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  runAutomationCycle: async () => {
    const res = await fetch(`${API_BASE}/automations/run-now`, { method: 'POST' });
    return res.json();
  },

  // Logs
  getLogs: async () => {
    const res = await fetch(`${API_BASE}/logs`);
    return res.json();
  },
  clearLogs: async () => {
    const res = await fetch(`${API_BASE}/logs/clear`, { method: 'DELETE' });
    return res.json();
  },

  // Payments
  getPayments: async () => {
    const res = await fetch(`${API_BASE}/payments`);
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  updateSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Simulator
  triggerSimulatorCall: async ({ tenant_id, channel, custom_script }) => {
    const res = await fetch(`${API_BASE}/simulator/trigger-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id, channel, custom_script }),
    });
    return res.json();
  },
};
