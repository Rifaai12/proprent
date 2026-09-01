import React, { useState } from 'react';
import { 
  ShieldCheck, PhoneForwarded, Plus, Trash2, CheckCircle2, AlertTriangle, 
  RotateCw, Sparkles, RefreshCcw, X, Info
} from 'lucide-react';

export const AntiBlockingPool = ({ 
  phoneNumbers, 
  onAddPhoneNumber, 
  onToggleActive, 
  onDeletePhoneNumber 
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    label: '',
    provider: 'Twilio Virtual DID Pool'
  });

  const [simulationHistory, setSimulationHistory] = useState([
    { attempt: 1, tenant: 'Rahul Sharma', callerUsed: '+91 80474 81001 (Line Alpha)', status: 'Success - Not Blocked' },
    { attempt: 2, tenant: 'Rahul Sharma', callerUsed: '+91 80474 81002 (Line Beta)', status: 'Success - Rotated Fresh Number' },
    { attempt: 3, tenant: 'Rahul Sharma', callerUsed: '+91 80474 81003 (Line Gamma)', status: 'Success - Rotated Fresh Number' },
  ]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone_number) return;
    await onAddPhoneNumber(formData);
    setIsAddModalOpen(false);
    setFormData({
      phone_number: '',
      label: '',
      provider: 'Twilio Virtual DID Pool'
    });
  };

  const numbersList = Array.isArray(phoneNumbers) ? phoneNumbers : [];

  return (
    <div className="space-y-6">
      
      {/* Anti-Blocking Explainer Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Spam & Anti-Blocking Rotation Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dynamic Caller ID Pool (Prevents Tenant Number Blocking)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              When tenants receive repeated collection calls from a single phone number, spam algorithms (Truecaller, Google Spam Filter, iOS Block list) flag and block the caller. Our engine automatically rotates sequential calls across this pool of clean numbers so every automated call reaches the tenant directly.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 whitespace-nowrap self-start lg:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Virtual DID / Line</span>
          </button>
        </div>

        {/* Live Rotation Logic Visualizer */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 font-medium">1. Call Attempt 1</span>
            <p className="text-slate-200 font-mono text-[11px] font-semibold">Line Alpha (+91 80474 81001)</p>
            <span className="text-[10px] text-emerald-400">First contact initiated</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-indigo-500/30 text-xs space-y-1">
            <span className="text-indigo-300 font-medium">2. Call Attempt 2 (Rotated)</span>
            <p className="text-emerald-300 font-mono text-[11px] font-semibold">Line Beta (+91 80474 81002)</p>
            <span className="text-[10px] text-emerald-400">Rotated automatically (Bypasses block)</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 font-medium">3. Call Attempt 3 (Rotated)</span>
            <p className="text-slate-200 font-mono text-[11px] font-semibold">Line Gamma (+91 80474 81003)</p>
            <span className="text-[10px] text-emerald-400">Fresh caller identity</span>
          </div>
        </div>
      </div>

      {/* Numbers Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Active Caller ID Pool ({phoneNumbers.length} Numbers)</h3>
            <p className="text-xs text-slate-400">All outbound automated voice calls rotate through these active lines</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Caller Line / DID</th>
                <th className="px-6 py-3 font-semibold">Provider / Carrier</th>
                <th className="px-6 py-3 font-semibold">Calls Dispatched</th>
                <th className="px-6 py-3 font-semibold">Last Dispatched</th>
                <th className="px-6 py-3 font-semibold">Anti-Spam Health</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
              {numbersList.map(number => (
                <tr key={number.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${number.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      <div>
                        <span className="font-mono font-bold text-slate-100 text-sm">{number.phone_number}</span>
                        <p className="text-[10px] text-slate-400">{number.label}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-300 font-medium">
                    {number.provider || 'Twilio Voice DID'}
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-indigo-300">
                    {number.calls_count || 0} calls
                  </td>
                  <td className="px-6 py-3.5 text-slate-400">
                    {number.last_used_at ? new Date(number.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Never used yet'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{number.reputation || 'Clean 100%'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => onToggleActive(number.id, !number.is_active)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        number.is_active
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {number.is_active ? 'Pause Line' : 'Activate Line'}
                    </button>
                    <button
                      onClick={() => onDeletePhoneNumber(number.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Delete number"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Number Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Add Outbound Caller Line</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number (with Country Code) *</label>
                <input
                  type="text"
                  placeholder="e.g. +91 80474 81005 or +1 415 555 0199"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Line Label</label>
                <input
                  type="text"
                  placeholder="e.g. Caller Line Epsilon (Escalation Pool)"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Telecom Provider / Carrier</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Twilio Virtual DID Pool">Twilio Virtual DID Pool</option>
                  <option value="Exotel Cloud Voice">Exotel Cloud Voice</option>
                  <option value="Vapi / Bland.ai Pool">Vapi / Bland.ai Pool</option>
                  <option value="Tata Tele / Airtel Cloud SIP">Tata Tele / Airtel Cloud SIP</option>
                  <option value="Other SIP / VoIP Gateway">Other SIP / VoIP Gateway</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  Add to Active Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
