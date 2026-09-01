import React, { useState } from 'react';
import { 
  UserPlus, Search, PhoneCall, MessageSquare, CheckCircle, AlertCircle, Clock, 
  Trash2, Edit3, ShieldCheck, Check, Sparkles, AlertTriangle, ArrowRight, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TenantsSection = ({ 
  tenants, 
  properties, 
  currency = '₹', 
  onMarkAsPaid, 
  onSimulateCall, 
  onSimulateWhatsApp, 
  onCreateTenant, 
  onDeleteTenant,
  onStatusChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OVERDUE, DUE_TODAY, UPCOMING, PAID
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTenantForPay, setSelectedTenantForPay] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI / Instant Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  // New Tenant Form State
  const [formData, setFormData] = useState({
    property_id: properties[0]?.id || '',
    unit_number: '',
    name: '',
    phone: '',
    email: '',
    rent_amount: '',
    due_day: '5',
    grace_days: '3',
    auto_call_enabled: true,
    auto_sms_enabled: true,
    auto_wa_enabled: true
  });

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.includes(searchTerm) ||
      (t.unit_number && t.unit_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.property_name && t.property_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleOpenMarkPaid = (tenant) => {
    setSelectedTenantForPay(tenant);
  };

  const handleConfirmMarkPaid = async () => {
    if (!selectedTenantForPay) return;
    
    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    await onMarkAsPaid(selectedTenantForPay.id, {
      amount: selectedTenantForPay.rent_amount,
      payment_mode: paymentMode,
      notes: paymentNotes
    });

    setSelectedTenantForPay(null);
    setPaymentNotes('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.rent_amount) return;
    await onCreateTenant(formData);
    setIsAddModalOpen(false);
    setFormData({
      property_id: properties[0]?.id || '',
      unit_number: '',
      name: '',
      phone: '',
      email: '',
      rent_amount: '',
      due_day: '5',
      grace_days: '3',
      auto_call_enabled: true,
      auto_sms_enabled: true,
      auto_wa_enabled: true
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tenant name, unit, phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Tenants' },
            { id: 'OVERDUE', label: '🔴 Overdue' },
            { id: 'DUE_TODAY', label: '🟡 Due Today' },
            { id: 'UPCOMING', label: '🔵 Upcoming' },
            { id: 'PAID', label: '🟢 Paid' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                statusFilter === filter.id
                  ? 'bg-slate-700 text-white font-semibold shadow-sm border border-slate-600'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Add Tenant Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Tenants Roster Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map(tenant => {
          const isPaid = tenant.status === 'PAID';
          const isOverdue = tenant.status === 'OVERDUE';
          const isDueToday = tenant.status === 'DUE_TODAY';

          return (
            <div
              key={tenant.id}
              className={`relative bg-slate-800/80 rounded-2xl p-5 border transition duration-200 flex flex-col justify-between ${
                isPaid
                  ? 'border-emerald-500/30 bg-gradient-to-b from-slate-800/90 to-emerald-950/20'
                  : isOverdue
                  ? 'border-rose-500/40 bg-gradient-to-b from-slate-800/90 to-rose-950/20 shadow-lg shadow-rose-950/30'
                  : isDueToday
                  ? 'border-amber-500/40 bg-gradient-to-b from-slate-800/90 to-amber-950/20'
                  : 'border-slate-700/70 hover:border-slate-600'
              }`}
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                      {tenant.unit_number || 'Unit'} • {tenant.property_name || 'Property'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">
                      {tenant.name}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>PAID</span>
                      </span>
                    )}
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>OVERDUE</span>
                      </span>
                    )}
                    {isDueToday && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span>DUE TODAY</span>
                      </span>
                    )}
                    {!isPaid && !isOverdue && !isDueToday && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        <span>UPCOMING</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tenant Contact Details */}
                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Mobile Number:</span>
                    <span className="font-mono font-medium text-slate-200">{tenant.phone}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Monthly Rent:</span>
                    <span className="text-sm font-bold text-white font-mono">{currency}{Number(tenant.rent_amount).toLocaleString()}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Due Day:</span>
                    <span className="font-medium text-slate-200">Day {tenant.due_day} of every month</span>
                  </p>
                </div>

                {/* Automation Channels Status */}
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Automation Channels:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tenant.auto_call_enabled ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700' : 'bg-slate-800 text-slate-500'}`}>
                        AI Call
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tenant.auto_wa_enabled ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-500'}`}>
                        WhatsApp
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tenant.auto_sms_enabled ? 'bg-blue-900/60 text-blue-300 border border-blue-700' : 'bg-slate-800 text-slate-500'}`}>
                        SMS
                      </span>
                    </div>
                  </div>

                  {/* Kill-switch indicator */}
                  {isPaid ? (
                    <p className="mt-2 text-[11px] text-emerald-400/90 flex items-center gap-1 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-900">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Calls & Messages Stopped for this cycle</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Anti-blocking rotated calls active</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                {/* One-Click Mark as Paid (Kill Switch) */}
                {!isPaid ? (
                  <button
                    onClick={() => handleOpenMarkPaid(tenant)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Paid (Stop All Reminders)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onStatusChange(tenant.id, 'OVERDUE')}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-slate-700 transition"
                      title="Reset status to Overdue to re-test automation triggers"
                    >
                      Reset to Overdue
                    </button>
                    <button
                      onClick={() => onStatusChange(tenant.id, 'DUE_TODAY')}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-slate-700 transition"
                    >
                      Reset to Due Today
                    </button>
                  </div>
                )}

                {/* Simulator Trigger Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSimulateCall(tenant)}
                    className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 flex items-center justify-center gap-1 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Simulate AI Call</span>
                  </button>

                  <button
                    onClick={() => onSimulateWhatsApp(tenant)}
                    className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center justify-center gap-1 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onDeleteTenant(tenant.id)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition"
                    title="Delete Tenant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mark As Paid Confirmation Modal */}
      {selectedTenantForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-emerald-500/40 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle className="w-5 h-5" />
                <span>Mark Rent as Paid</span>
              </div>
              <button
                onClick={() => setSelectedTenantForPay(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1.5">
              <p className="text-slate-300">
                <span className="text-slate-400">Tenant:</span> <strong className="text-white">{selectedTenantForPay.name}</strong> ({selectedTenantForPay.unit_number})
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Rent Amount:</span> <strong className="text-emerald-400">{currency}{Number(selectedTenantForPay.rent_amount).toLocaleString()}</strong>
              </p>
              <p className="text-emerald-300 text-[11px] pt-1">
                ⚡ <strong>Instant Kill-Switch:</strong> All pending and future automated AI voice calls, WhatsApp reminders, and SMS alerts will be halted immediately.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI / Instant Transfer">UPI / Instant Transfer (GPay, PhonePe, Paytm)</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="Cash Payment">Cash Payment</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transaction Ref / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-89201 or Handed cash at office"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTenantForPay(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                Confirm Payment & Stop Automation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Tenant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>Add New Tenant</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {/* Property & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Property *</label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit / Flat / Room #</label>
                  <input
                    type="text"
                    placeholder="e.g. A-302, Flat 10B"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tenant Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile Number (with country code) *</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Rent Amount & Due Day */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Rent Amount ({currency}) *</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    value={formData.due_day}
                    onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Grace Days</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    placeholder="3"
                    value={formData.grace_days}
                    onChange={(e) => setFormData({ ...formData, grace_days: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Automation Channels Checkboxes */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <span className="block font-semibold text-slate-300">Automated Reminder Channels Enabled:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_call_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_call_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-200">AI Voice Calls (Rotated Lines)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_wa_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_wa_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-slate-200">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_sms_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_sms_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-200">SMS</span>
                  </label>
                </div>
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
                  Save Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
