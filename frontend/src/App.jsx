import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { TenantsSection } from './components/TenantsSection';
import { PropertiesSection } from './components/PropertiesSection';
import { AntiBlockingPool } from './components/AntiBlockingPool';
import { AutomationEngine } from './components/AutomationEngine';
import { LogsSection } from './components/LogsSection';
import { LivePhoneSimulatorModal } from './components/LivePhoneSimulatorModal';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { DeployGuideModal } from './components/DeployGuideModal';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [simulatorCallData, setSimulatorCallData] = useState(null);
  const [whatsAppData, setWhatsAppData] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  
  // Automation execution state
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [lastCycleResults, setLastCycleResults] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial load
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [m, t, p, pool, r, l, s] = await Promise.all([
        api.getDashboardMetrics(),
        api.getTenants(),
        api.getProperties(),
        api.getPhonePool(),
        api.getRules(),
        api.getLogs(),
        api.getSettings(),
      ]);

      setMetrics(m);
      setTenants(t);
      setProperties(p);
      setPhoneNumbers(pool);
      setRules(r);
      setLogs(l);
      setSettings(s);
    } catch (err) {
      console.error('Failed to load application data:', err);
      showToast('Error connecting to backend server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handler: Run Automation Cycle (Evaluates due dates & dispatches reminders)
  const handleRunAutomation = async () => {
    try {
      setIsRunningAutomation(true);
      const res = await api.runAutomationCycle();
      setLastCycleResults(res);
      await loadAllData();
      showToast(`Automation cycle completed! Processed ${res.executed_count} actions.`);
    } catch (err) {
      showToast('Failed to run automation cycle: ' + err.message, 'error');
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // Handler: Mark As Paid (The Core Kill-Switch)
  const handleMarkAsPaid = async (tenantId, paymentDetails) => {
    try {
      const res = await api.markAsPaid(tenantId, paymentDetails);
      await loadAllData();
      showToast('Rent marked as PAID! All calls & messages immediately stopped for this tenant.');
    } catch (err) {
      showToast('Failed to mark as paid: ' + err.message, 'error');
    }
  };

  // Handler: Toggle tenant status for testing
  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await api.updateTenantStatus(tenantId, newStatus);
      await loadAllData();
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Handler: Trigger Live Simulator AI Call (Rotates Caller ID)
  const handleSimulateCall = async (tenant) => {
    try {
      const res = await api.triggerSimulatorCall({
        tenant_id: tenant.id,
        channel: 'ai_call',
      });

      if (res.success && res.log) {
        setSimulatorCallData({
          tenantName: tenant.name,
          propertyName: tenant.property_name,
          unitNumber: tenant.unit_number,
          amount: tenant.rent_amount,
          currency: settings?.currency_symbol || '₹',
          callerNumber: res.log.caller_id_used,
          callerLabel: res.log.caller_id_label,
          script: res.log.content,
          logId: res.log.id,
        });
        await loadAllData();
      }
    } catch (err) {
      showToast('Failed to trigger simulator call: ' + err.message, 'error');
    }
  };

  // Handler: Trigger WhatsApp Preview
  const handleSimulateWhatsApp = async (tenant) => {
    try {
      const res = await api.triggerSimulatorCall({
        tenant_id: tenant.id,
        channel: 'whatsapp',
      });

      if (res.success && res.log) {
        setWhatsAppData({
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          messageContent: res.log.content,
          isPaidReply: tenant.status === 'PAID',
        });
        await loadAllData();
      }
    } catch (err) {
      showToast('Failed to generate WhatsApp preview: ' + err.message, 'error');
    }
  };

  // Handler: Create Property
  const handleCreateProperty = async (data) => {
    try {
      await api.createProperty(data);
      await loadAllData();
      showToast('Property created successfully!');
    } catch (err) {
      showToast('Failed to create property', 'error');
    }
  };

  // Handler: Delete Property
  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.deleteProperty(id);
      await loadAllData();
      showToast('Property deleted');
    } catch (err) {
      showToast('Failed to delete property', 'error');
    }
  };

  // Handler: Create Tenant
  const handleCreateTenant = async (data) => {
    try {
      await api.createTenant(data);
      await loadAllData();
      showToast('Tenant added successfully!');
    } catch (err) {
      showToast('Failed to add tenant', 'error');
    }
  };

  // Handler: Delete Tenant
  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await api.deleteTenant(id);
      await loadAllData();
      showToast('Tenant deleted');
    } catch (err) {
      showToast('Failed to delete tenant', 'error');
    }
  };

  // Handler: Add Phone Number to Pool
  const handleAddPhoneNumber = async (data) => {
    try {
      await api.addPhoneNumber(data);
      await loadAllData();
      showToast('New caller ID line added to pool!');
    } catch (err) {
      showToast('Failed to add phone number', 'error');
    }
  };

  // Handler: Toggle Phone Number Active
  const handleTogglePhoneNumber = async (id, is_active) => {
    try {
      await api.togglePhoneNumber(id, is_active);
      await loadAllData();
    } catch (err) {
      showToast('Failed to toggle line status', 'error');
    }
  };

  // Handler: Delete Phone Number
  const handleDeletePhoneNumber = async (id) => {
    if (!window.confirm('Delete this number from the pool?')) return;
    try {
      await api.deletePhoneNumber(id);
      await loadAllData();
      showToast('Number removed from pool');
    } catch (err) {
      showToast('Failed to remove number', 'error');
    }
  };

  // Handler: Update Rule
  const handleUpdateRule = async (id, data) => {
    try {
      await api.updateRule(id, data);
      await loadAllData();
      showToast('Automation rule updated');
    } catch (err) {
      showToast('Failed to update rule', 'error');
    }
  };

  // Handler: Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Clear all activity logs?')) return;
    try {
      await api.clearLogs();
      await loadAllData();
      showToast('Activity logs cleared');
    } catch (err) {
      showToast('Failed to clear logs', 'error');
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (newSettings) => {
    try {
      await api.updateSettings(newSettings);
      await loadAllData();
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunAutomation={handleRunAutomation}
        onOpenSimulator={() => {
          if (tenants.length > 0) {
            handleSimulateCall(tenants[0]);
          } else {
            showToast('Please add a tenant first to test simulator', 'info');
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        isRunningAutomation={isRunningAutomation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 border-rose-500 text-rose-200'
                : 'bg-emerald-950 border-emerald-500 text-emerald-200'
            }`}>
              {toastMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{toastMessage.message}</span>
            </div>
          </div>
        )}

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <DashboardMetrics
              metrics={metrics}
              onSwitchTab={setActiveTab}
              onRunAutomation={handleRunAutomation}
            />

            {/* Quick Preview of Overdue & Due Tenants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Priority Collection Actions</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Immediate Action
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab('tenants')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  View All Tenants →
                </button>
              </div>

              <TenantsSection
                tenants={tenants.filter(t => t.status === 'OVERDUE' || t.status === 'DUE_TODAY')}
                properties={properties}
                currency={settings?.currency_symbol || '₹'}
                onMarkAsPaid={handleMarkAsPaid}
                onSimulateCall={handleSimulateCall}
                onSimulateWhatsApp={handleSimulateWhatsApp}
                onCreateTenant={handleCreateTenant}
                onDeleteTenant={handleDeleteTenant}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Tenants & Rent Tracker */}
        {activeTab === 'tenants' && (
          <TenantsSection
            tenants={tenants}
            properties={properties}
            currency={settings?.currency_symbol || '₹'}
            onMarkAsPaid={handleMarkAsPaid}
            onSimulateCall={handleSimulateCall}
            onSimulateWhatsApp={handleSimulateWhatsApp}
            onCreateTenant={handleCreateTenant}
            onDeleteTenant={handleDeleteTenant}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Tab 3: Properties */}
        {activeTab === 'properties' && (
          <PropertiesSection
            properties={properties}
            currency={settings?.currency_symbol || '₹'}
            onCreateProperty={handleCreateProperty}
            onDeleteProperty={handleDeleteProperty}
          />
        )}

        {/* Tab 4: Anti-Blocking Caller ID Pool */}
        {activeTab === 'pool' && (
          <AntiBlockingPool
            phoneNumbers={phoneNumbers}
            onAddPhoneNumber={handleAddPhoneNumber}
            onToggleActive={handleTogglePhoneNumber}
            onDeletePhoneNumber={handleDeletePhoneNumber}
          />
        )}

        {/* Tab 5: Automation Rules */}
        {activeTab === 'automations' && (
          <AutomationEngine
            rules={rules}
            onUpdateRule={handleUpdateRule}
            onRunAutomationCycle={handleRunAutomation}
            isRunningCycle={isRunningAutomation}
            lastRunResults={lastCycleResults}
          />
        )}

        {/* Tab 6: Activity Logs */}
        {activeTab === 'logs' && (
          <LogsSection
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        )}

      </main>

      {/* Interactive Phone Simulator Modal */}
      <LivePhoneSimulatorModal
        isOpen={Boolean(simulatorCallData)}
        onClose={() => setSimulatorCallData(null)}
        callData={simulatorCallData}
        onCallEnded={async () => {
          await loadAllData();
        }}
      />

      {/* WhatsApp Message Preview Modal */}
      <WhatsAppPreviewModal
        isOpen={Boolean(whatsAppData)}
        onClose={() => setWhatsAppData(null)}
        data={whatsAppData}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Deployment & Production Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Property Rent Automated Collection Engine • Anti-Blocking Caller ID Rotation Pool • Built with Node.js & React
      </footer>

    </div>
  );
}
