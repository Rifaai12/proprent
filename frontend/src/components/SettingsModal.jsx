import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, ShieldCheck, Phone, MessageSquare, Bot, X, Check, Send, 
  AlertCircle, CheckCircle, RefreshCw, Globe, HelpCircle, Activity 
} from 'lucide-react';
import { api, getApiBaseUrl } from '../services/api';

export const SettingsModal = ({ isOpen, onClose, settings, onSaveSettings }) => {
  if (!isOpen || !settings) return null;

  const [formData, setFormData] = useState({
    business_name: settings.business_name || 'Apex Property Holdings',
    owner_name: settings.owner_name || 'Vikram Adani',
    owner_phone: settings.owner_phone || '+91 98000 11223',
    owner_email: settings.owner_email || 'owner@apexproperties.com',
    currency_symbol: settings.currency_symbol || '₹',
    upi_id: settings.upi_id || 'apexproperties@okaxis',
    bank_account_info: settings.bank_account_info || 'HDFC Bank - A/C 50200012345678 - IFSC HDFC0001234',
    simulation_mode: settings.simulation_mode !== false,
    telecom_providers: {
      twilio: {
        account_sid: settings.telecom_providers?.twilio?.account_sid || '',
        auth_token: settings.telecom_providers?.twilio?.auth_token || '',
      },
      whatsapp_cloud: {
        phone_number_id: settings.telecom_providers?.whatsapp_cloud?.phone_number_id || '',
        access_token: settings.telecom_providers?.whatsapp_cloud?.access_token || '',
      },
      vapi_ai: {
        api_key: settings.telecom_providers?.vapi_ai?.api_key || '',
        assistant_id: settings.telecom_providers?.vapi_ai?.assistant_id || '',
      }
    }
  });

  const [isSaved, setIsSaved] = useState(false);
  const [waStatus, setWaStatus] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test utility message from PropertyRent.AI via Meta WhatsApp Business Cloud API.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);

  const apiBaseUrl = getApiBaseUrl();

  const fetchWaStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus();
      if (res.success) {
        setWaStatus(res);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    }
  };

  const fetchDbHealth = async () => {
    try {
      const res = await api.getDbHealth();
      if (res.success) {
        setDbHealth(res);
      }
    } catch (err) {
      console.error('Failed to fetch DB health:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWaStatus();
      fetchDbHealth();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(formData);
    setIsSaved(true);
    await fetchWaStatus();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  // Live Meta Phone Number & Token Verification
  const handleVerifySetup = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyWhatsAppSetup();
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({
        verified: false,
        error: err.message || 'Verification network error'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // TEST 1: Send Meta Standard hello_world Template
  const handleTestTemplate = async () => {
    if (!testPhone) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await api.testWhatsAppTemplate({
        testPhone,
        templateName: 'hello_world',
        languageCode: 'en_US'
      });

      setTestResult({
        testType: 'Meta hello_world Template',
        success: res.success,
        message: res.message || 'Message accepted by Meta',
        messageId: res.messageId,
        recipient: res.recipient,
        metaHttpStatus: res.metaHttpStatus,
        error: res.error,
        meta: res.meta
      });
    } catch (err) {
      setTestResult({
        testType: 'Meta hello_world Template',
        success: false,
        error: err.message || 'Connection error'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // TEST 2: Send Direct Utility Text
  const handleTestUtility = async () => {
    if (!testPhone) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await api.testWhatsAppUtility({
        testPhone,
        message: testMessage
      });

      setTestResult({
        testType: 'Direct Utility Text',
        success: res.success,
        message: res.message || 'Message accepted by Meta',
        messageId: res.messageId,
        recipient: res.recipient,
        metaHttpStatus: res.metaHttpStatus,
        error: res.error,
        meta: res.meta
      });
    } catch (err) {
      setTestResult({
        testType: 'Direct Utility Text',
        success: false,
        error: err.message || 'Connection error'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">System Settings & Meta WhatsApp API</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostics Banners: API Base URL & Database Persistence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backend URL:</span>
            </div>
            <span className="font-mono text-indigo-300 font-semibold truncate max-w-[140px]">{apiBaseUrl}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database Storage:</span>
            </div>
            {dbHealth?.engine === 'PostgreSQL' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-medium">
                PostgreSQL (Persistent)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 font-medium" title="Set DATABASE_URL in Render environment to enable permanent PostgreSQL persistence">
                Local File (Ephemeral)
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Mode Switcher */}
          <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-sm block">Simulation & Sandbox Mode</span>
              <p className="text-slate-400 text-xs mt-0.5 max-w-md">
                {formData.simulation_mode 
                  ? 'Simulation Mode: Simulates voice notice speech in your browser without carrier telecom billing.'
                  : 'Live Production Mode: Dispatches real automated calls and live Meta WhatsApp messages.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.simulation_mode}
                onChange={(e) => setFormData({ ...formData, simulation_mode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Owner Profile & Payment Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1">Owner Profile & Bank Info</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currency_symbol}
                  onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Owner Mobile</label>
                <input
                  type="text"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">UPI ID for Rent</label>
                <input
                  type="text"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Bank Account Info (for Notices & Receipts)</label>
              <input
                type="text"
                value={formData.bank_account_info}
                onChange={(e) => setFormData({ ...formData, bank_account_info: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          {/* Meta WhatsApp Cloud API Configuration & Diagnostics */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>Meta WhatsApp Business Cloud API</span>
              {waStatus && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  waStatus.isConfigured
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {waStatus.isConfigured ? '✓ Configured' : 'Not Configured'}
                </span>
              )}
            </h4>
            
            {/* Live Status Diagnostic Card */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2 text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Credential Source:</span>
                  <span className="font-semibold text-slate-200">
                    {waStatus?.source === 'ENVIRONMENT_VARIABLES' 
                      ? 'Environment Variables (Server)' 
                      : waStatus?.source === 'OWNER_SETTINGS'
                      ? 'Owner Configuration (In-App)'
                      : 'None detected'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Graph API Version:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{waStatus?.apiVersion || 'v22.0'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number ID:</span>
                  <span className="font-mono text-slate-300">{waStatus?.phoneNumberId || 'Not set'}</span>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={isVerifying || !waStatus?.isConfigured}
                    onClick={handleVerifySetup}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1 font-semibold text-[10px]"
                  >
                    {isVerifying ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                    <span>Verify with Meta</span>
                  </button>
                </div>
              </div>

              {/* Live Verification Result from Meta */}
              {verifyResult && (
                <div className={`p-2.5 rounded-lg border text-[11px] animate-fade-in ${
                  verifyResult.verified
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}>
                  {verifyResult.verified ? (
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Meta API Verified (HTTP {verifyResult.httpStatus})</span>
                      </p>
                      <p>Display Number: <strong className="text-white">{verifyResult.displayPhoneNumber}</strong></p>
                      <p>Verified Business Name: <strong className="text-white">{verifyResult.verifiedName}</strong></p>
                      <p>Quality Rating: <span className="font-semibold text-emerald-400">{verifyResult.qualityRating}</span></p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="font-bold text-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Meta Verification Failed {verifyResult.httpStatus ? `(HTTP ${verifyResult.httpStatus})` : ''}</span>
                      </p>
                      <p className="text-rose-300/90">{verifyResult.error}</p>
                      {verifyResult.code && <p className="text-[10px] font-mono text-rose-400">Meta Code: {verifyResult.code}</p>}
                      {verifyResult.fbtrace_id && <p className="text-[10px] font-mono text-slate-400">fbtrace_id: {verifyResult.fbtrace_id}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* In-App Credential Input Fields */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 109876543210987"
                    value={formData.telecom_providers.whatsapp_cloud.phone_number_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      telecom_providers: {
                        ...formData.telecom_providers,
                        whatsapp_cloud: { ...formData.telecom_providers.whatsapp_cloud, phone_number_id: e.target.value }
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">From Meta Developers &gt; WhatsApp &gt; API Setup</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Meta Access Token</label>
                  <input
                    type="password"
                    placeholder="EAAG... (Saved securely on backend)"
                    value={formData.telecom_providers.whatsapp_cloud.access_token}
                    onChange={(e) => setFormData({
                      ...formData,
                      telecom_providers: {
                        ...formData.telecom_providers,
                        whatsapp_cloud: { ...formData.telecom_providers.whatsapp_cloud, access_token: e.target.value }
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Token is never exposed to browser</span>
                </div>
              </div>
            </div>

            {/* Live Dual Test Section */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5 text-xs">
                <Send className="w-3.5 h-3.5" />
                <span>Test Live WhatsApp Dispatch</span>
              </span>
              
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Recipient Mobile with Country Code (Must be verified in Meta Test List):
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98403 92047"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1 flex-wrap">
                {/* TEST 1: Template test */}
                <button
                  type="button"
                  disabled={isSendingTest || !testPhone}
                  onClick={handleTestTemplate}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 text-xs shadow-md shadow-indigo-600/20"
                >
                  {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  <span>1. Test 'hello_world' Template</span>
                </button>

                {/* TEST 2: Utility text test */}
                <button
                  type="button"
                  disabled={isSendingTest || !testPhone}
                  onClick={handleTestUtility}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 text-xs shadow-md shadow-emerald-600/20"
                >
                  {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>2. Test Direct Utility Message</span>
                </button>
              </div>

              {/* Detailed Real Meta Response Diagnostics Box */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 animate-fade-in ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>{testResult.testType}: {testResult.success ? 'Message accepted by Meta' : 'Meta Rejected Request'}</span>
                    </span>
                    {testResult.metaHttpStatus && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700">
                        HTTP {testResult.metaHttpStatus}
                      </span>
                    )}
                  </div>

                  {testResult.success ? (
                    <div className="font-mono text-[10px] text-emerald-300 space-y-0.5 pt-1">
                      <p>Recipient: {testResult.recipient}</p>
                      <p>WAMID: {testResult.messageId}</p>
                      <p className="text-emerald-400 font-sans text-[11px] pt-1">
                        ✓ Meta accepted the message for delivery to the verified recipient.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs pt-1">
                      <p className="font-medium text-rose-200">{testResult.error}</p>
                      {testResult.meta && (
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-0.5">
                          {testResult.meta.code && <p>Meta Code: {testResult.meta.code}</p>}
                          {testResult.meta.subcode && <p>Meta Subcode: {testResult.meta.subcode}</p>}
                          {testResult.meta.fbtrace_id && <p>fbtrace_id: {testResult.meta.fbtrace_id}</p>}
                          {testResult.meta.type && <p>Type: {testResult.meta.type}</p>}
                        </div>
                      )}
                      {testResult.meta?.code === 131030 && (
                        <p className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                          ⚠️ <strong>Sandbox recipient not verified:</strong> For Meta test phone numbers, add this recipient number under WhatsApp &gt; API Setup &gt; "To" list in developers.facebook.com.
                        </p>
                      )}
                      {testResult.meta?.code === 131047 && (
                        <p className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                          ⚠️ <strong>24-hour window expired:</strong> Meta requires an approved template when sending to a user outside the 24-hour window. Use the 'hello_world' template test above.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Saved Successfully!' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
