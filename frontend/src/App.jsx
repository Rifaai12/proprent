import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { SaaSOnboardingGuide } from './components/SaaSOnboardingGuide';
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
import { 
  CheckCircle2, AlertTriangle, Building2, UserPlus, RefreshCw, AlertCircle
} from 'lucide-react';

export default function App() {
  // Auth & Session State
  const [token, setToken] = useState(localStorage.getItem('property_rent_token') || null);
  const [owner, setOwner] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('property_rent_owner') || 'null');
    } catch (e) {
      return null;
    }
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState(Boolean(token));

  // Application Data State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Modals state
  const [simulatorCallData, setSimulatorCallData] = useState(null);
  const [whatsAppData, setWhatsAppData] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  
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

  const defaultMetrics = {
    totalProperties: 0,
    totalTenants: 0,
    totalRentExpected: 0,
    totalRentCollected: 0,
    collectionRate: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    paidCount: 0,
    upcomingCount: 0,
    totalCallsMade: 0,
    totalWhatsAppSent: 0,
    activeNumbersCount: 0,
    currencySymbol: '₹'
  };

  // 1. Session Verification on App Mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('property_rent_token');
      if (!storedToken) {
        setIsVerifyingSession(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.owner) {
          setOwner(res.owner);
          localStorage.setItem('property_rent_owner', JSON.stringify(res.owner));
          // Load dismissed state for this owner
          const dismissed = localStorage.getItem(`property_rent_onboarding_dismissed_${res.owner.id}`) === 'true';
          setIsOnboardingDismissed(dismissed);
        } else {
          // Token invalid or expired
          localStorage.removeItem('property_rent_token');
          localStorage.removeItem('property_rent_owner');
          setToken(null);
          setOwner(null);
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        setIsVerifyingSession(false);
      }
    };

    verifySession();
  }, []);

  // 2. Load all owner-scoped data
  const loadAllData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setLoadError(null);
      const [m, t, p, pool, r, l, pay, s] = await Promise.all([
        api.getDashboardMetrics(),
        api.getTenants(),
        api.getProperties(),
        api.getPhonePool(),
        api.getRules(),
        api.getLogs(),
        api.getPayments(),
        api.getSettings(),
      ]);

      if (m?.error || t?.error || p?.error) {
        const errMsg = m?.error || t?.error || p?.error;
        if (!errMsg.includes('401')) {
          setLoadError(errMsg);
        }
      }

      setMetrics(m && !m.error ? m : defaultMetrics);
      setTenants(Array.isArray(t) ? t : []);
      setProperties(Array.isArray(p) ? p : []);
      setPhoneNumbers(Array.isArray(pool) ? pool : []);
      setRules(Array.isArray(r) ? r : []);
      setLogs(Array.isArray(l) ? l : []);
      setPayments(Array.isArray(pay) ? pay : []);
      setSettings(s && !s.error ? s : { currency_symbol: '₹' });
    } catch (err) {
      console.error('Failed to load application data:', err);
      setLoadError('Unable to connect to server. Please check your network and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setOwner(null);
      showToast('Your session has expired. Please sign in again.', 'info');
    };
    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // Auth Handlers
  const handleLoginSuccess = (ownerData, jwtToken) => {
    setOwner(ownerData);
    setToken(jwtToken);
    const dismissed = localStorage.getItem(`property_rent_onboarding_dismissed_${ownerData.id}`) === 'true';
    setIsOnboardingDismissed(dismissed);
    showToast(`Welcome, ${ownerData?.name || 'Owner'}!`);
  };

  const handleLogout = async () => {
    await api.logout();
    setToken(null);
    setOwner(null);
    setTenants([]);
    setProperties([]);
    setPhoneNumbers([]);
    setRules([]);
    setLogs([]);
    setPayments([]);
    setMetrics(null);
    showToast('Signed out successfully.');
  };

  // Handler: Dismiss Onboarding
  const handleDismissOnboarding = () => {
    setIsOnboardingDismissed(true);
    if (owner?.id) {
      localStorage.setItem(`property_rent_onboarding_dismissed_${owner.id}`, 'true');
    }
  };

  // Handler: Re-open Onboarding
  const handleOpenOnboarding = () => {
    setIsOnboardingDismissed(false);
    if (owner?.id) {
      localStorage.removeItem(`property_rent_onboarding_dismissed_${owner.id}`);
    }
  };

  // Handler: Load Demo Data into Owner Account
  const handleLoadDemoData = async () => {
    try {
      await api.loadDemoData();
      await loadAllData();
      showToast('Sample properties & tenants loaded into your account.');
    } catch (err) {
      showToast('Failed to load sample data: ' + err.message, 'error');
    }
  };

  // Handler: Run Automation Cycle
  const handleRunAutomation = async () => {
    try {
      setIsRunningAutomation(true);
      const res = await api.runAutomationCycle();
      setLastCycleResults(res);
      await loadAllData();
      showToast(`Automation cycle completed! Processed ${res.executed_count || 0} reminder actions.`);
    } catch (err) {
      showToast('Failed to run automation cycle: ' + err.message, 'error');
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // Handler: Mark As Paid (Instant Kill-Switch)
  const handleMarkAsPaid = async (tenantId, paymentDetails) => {
    try {
      const res = await api.markAsPaid(tenantId, paymentDetails);
      await loadAllData();
      showToast('Rent marked as PAID! All reminders halted and receipt dispatched.');
    } catch (err) {
      showToast('Failed to mark as paid: ' + err.message, 'error');
    }
  };

  // Handler: Update Tenant Status
  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await api.updateTenantStatus(tenantId, newStatus);
      await loadAllData();
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Handler: Trigger Live / Simulator AI Call
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
      showToast('Failed to trigger call notice: ' + err.message, 'error');
    }
  };

  // Handler: Trigger WhatsApp Notice Preview
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
      showToast('Failed to generate WhatsApp notice: ' + err.message, 'error');
    }
  };

  // Property CRUD
  const handleCreateProperty = async (data) => {
    try {
      await api.createProperty(data);
      await loadAllData();
      showToast('Property created successfully!');
    } catch (err) {
      showToast('Failed to create property: ' + err.message, 'error');
    }
  };

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

  // Tenant CRUD
  const handleCreateTenant = async (data) => {
    try {
      await api.createTenant(data);
      await loadAllData();
      showToast('Tenant added successfully!');
    } catch (err) {
      showToast('Failed to add tenant: ' + err.message, 'error');
    }
  };

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

  // Phone Pool CRUD
  const handleAddPhoneNumber = async (data) => {
    try {
      await api.addPhoneNumber(data);
      await loadAllData();
      showToast('Caller line added to pool!');
    } catch (err) {
      showToast('Failed to add phone number', 'error');
    }
  };

  const handleTogglePhoneNumber = async (id, is_active) => {
    try {
      await api.togglePhoneNumber(id, is_active);
      await loadAllData();
    } catch (err) {
      showToast('Failed to update line status', 'error');
    }
  };

  const handleDeletePhoneNumber = async (id) => {
    if (!window.confirm('Remove this number from your pool?')) return;
    try {
      await api.deletePhoneNumber(id);
      await loadAllData();
      showToast('Number removed from pool');
    } catch (err) {
      showToast('Failed to remove number', 'error');
    }
  };

  // Rules CRUD
  const handleUpdateRule = async (id, data) => {
    try {
      await api.updateRule(id, data);
      await loadAllData();
      showToast('Automation rule updated');
    } catch (err) {
      showToast('Failed to update rule', 'error');
    }
  };

  // Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Clear all activity logs for your account?')) return;
    try {
      await api.clearLogs();
      await loadAllData();
      showToast('Activity logs cleared');
    } catch (err) {
      showToast('Failed to clear logs', 'error');
    }
  };

  // Settings
  const handleSaveSettings = async (newSettings) => {
    try {
      await api.updateSettings(newSettings);
      await loadAllData();
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  // Loading Screen while validating session
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Validating secure session...</p>
      </div>
    );
  }

  // If not logged in, show Owner Login / Register Screen
  if (!token) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const propList = Array.isArray(properties) ? properties : [];
  const tenantList = Array.isArray(tenants) ? tenants : [];
  const poolList = Array.isArray(phoneNumbers) ? phoneNumbers : [];
  const rulesList = Array.isArray(rules) ? rules : [];
  const logsList = Array.isArray(logs) ? logs : [];
  const paymentsList = Array.isArray(payments) ? payments : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSetupGuide={handleOpenOnboarding}
        onRunAutomation={handleRunAutomation}
        onOpenSimulator={() => {
          if (tenantList.length > 0) {
            handleSimulateCall(tenantList[0]);
          } else {
            showToast('Please add a tenant first to test simulated notices', 'info');
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        onLogout={handleLogout}
        owner={owner}
        isRunningAutomation={isRunningAutomation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
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

        {/* Error Alert Banner if Data Fetch Failed */}
        {loadError && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={loadAllData}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data-Aware SaaS Onboarding Guide */}
        <SaaSOnboardingGuide
          ownerName={owner?.name}
          propertiesCount={propList.length}
          tenantsCount={tenantList.length}
          numbersCount={poolList.filter(n => n?.is_active).length}
          rulesCount={rulesList.length}
          logsCount={logsList.length}
          paymentsCount={paymentsList.length}
          onNavigateTab={setActiveTab}
          onOpenAddProperty={() => setActiveTab('properties')}
          onOpenAddTenant={() => setActiveTab('tenants')}
          onLoadDemoData={handleLoadDemoData}
          onDismiss={handleDismissOnboarding}
          isDismissed={isOnboardingDismissed}
        />

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
                    Immediate Follow-Up
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab('tenants')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  View All Tenants →
                </button>
              </div>

              {tenantList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">No Tenants Added Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Add your first tenant to track monthly rent schedules, or load sample data to explore automated calling workflows.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('tenants')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                      + Add Tenant
                    </button>
                    <button
                      onClick={handleLoadDemoData}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                    >
                      Load Sample Demo Data
                    </button>
                  </div>
                </div>
              ) : (
                <TenantsSection
                  tenants={tenantList.filter(t => t && (t.status === 'OVERDUE' || t.status === 'DUE_TODAY'))}
                  properties={propList}
                  currency={settings?.currency_symbol || '₹'}
                  onMarkAsPaid={handleMarkAsPaid}
                  onSimulateCall={handleSimulateCall}
                  onSimulateWhatsApp={handleSimulateWhatsApp}
                  onCreateTenant={handleCreateTenant}
                  onDeleteTenant={handleDeleteTenant}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Tenants & Rent Tracker */}
        {activeTab === 'tenants' && (
          <TenantsSection
            tenants={tenantList}
            properties={propList}
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
            properties={propList}
            currency={settings?.currency_symbol || '₹'}
            onCreateProperty={handleCreateProperty}
            onDeleteProperty={handleDeleteProperty}
          />
        )}

        {/* Tab 4: Anti-Blocking Caller Numbers Pool */}
        {activeTab === 'pool' && (
          <AntiBlockingPool
            phoneNumbers={poolList}
            onAddPhoneNumber={handleAddPhoneNumber}
            onToggleActive={handleTogglePhoneNumber}
            onDeletePhoneNumber={handleDeletePhoneNumber}
          />
        )}

        {/* Tab 5: Automation Rules */}
        {activeTab === 'automations' && (
          <AutomationEngine
            rules={rulesList}
            onUpdateRule={handleUpdateRule}
            onRunAutomationCycle={handleRunAutomation}
            isRunningCycle={isRunningAutomation}
            lastRunResults={lastCycleResults}
          />
        )}

        {/* Tab 6: Activity Logs */}
        {activeTab === 'logs' && (
          <LogsSection
            logs={logsList}
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
        PropertyRent.AI • Multi-Tenant Property Operations Platform • End-to-End Encrypted Session
      </footer>

    </div>
  );
}
