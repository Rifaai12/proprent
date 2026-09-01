import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Phone, MessageSquare, Bot, X, Check } from 'lucide-react';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">System Settings & Telecom API Integrations</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Mode Switcher */}
          <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-sm block">Simulation & Sandbox Mode</span>
              <p className="text-slate-400 text-xs mt-0.5">
                {formData.simulation_mode 
                  ? 'Active: Synthesizes real voice speech in your browser & previews WhatsApp chats without carrier telecom costs.'
                  : 'Live Mode: Dispatches real phone calls and real WhatsApp SMS via your configured API keys.'}
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
            <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1">Owner & Payment Details</h4>
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
                <label className="block text-slate-400 font-medium mb-1">Owner Phone / Alert Mobile</label>
                <input
                  type="text"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">UPI ID for Rent Collection</label>
                <input
                  type="text"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Bank Account Info (for Receipts & SMS)</label>
              <input
                type="text"
                value={formData.bank_account_info}
                onChange={(e) => setFormData({ ...formData, bank_account_info: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          {/* Production Telecom API Keys */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1">Live Telecom API Connectors (Optional for Live Mode)</h4>
            
            {/* Twilio */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Twilio / Exotel Voice API</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Twilio Account SID (AC...)"
                  value={formData.telecom_providers.twilio.account_sid}
                  onChange={(e) => setFormData({
                    ...formData,
                    telecom_providers: {
                      ...formData.telecom_providers,
                      twilio: { ...formData.telecom_providers.twilio, account_sid: e.target.value }
                    }
                  })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
                <input
                  type="password"
                  placeholder="Twilio Auth Token"
                  value={formData.telecom_providers.twilio.auth_token}
                  onChange={(e) => setFormData({
                    ...formData,
                    telecom_providers: {
                      ...formData.telecom_providers,
                      twilio: { ...formData.telecom_providers.twilio, auth_token: e.target.value }
                    }
                  })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            {/* Meta WhatsApp Cloud API */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Meta WhatsApp Cloud API</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="WhatsApp Phone Number ID"
                  value={formData.telecom_providers.whatsapp_cloud.phone_number_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    telecom_providers: {
                      ...formData.telecom_providers,
                      whatsapp_cloud: { ...formData.telecom_providers.whatsapp_cloud, phone_number_id: e.target.value }
                    }
                  })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
                <input
                  type="password"
                  placeholder="Meta Access Token (EAAG...)"
                  value={formData.telecom_providers.whatsapp_cloud.access_token}
                  onChange={(e) => setFormData({
                    ...formData,
                    telecom_providers: {
                      ...formData.telecom_providers,
                      whatsapp_cloud: { ...formData.telecom_providers.whatsapp_cloud, access_token: e.target.value }
                    }
                  })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
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
