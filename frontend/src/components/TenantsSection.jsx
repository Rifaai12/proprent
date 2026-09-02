import React, { useState } from 'react';
import { 
  UserPlus, Search, PhoneCall, MessageSquare, CheckCircle, AlertCircle, Clock, 
  Trash2, Edit3, ShieldCheck, Check, Sparkles, AlertTriangle, ArrowRight, X, Send, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export const TenantsSection = ({ 
  tenants, 
  properties, 
  currency = '₹', 
  onMarkAsPaid, 
  onSimulateCall, 
  onCreateTenant, 
  onDeleteTenant,
  onStatusChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OVERDUE, DUE_TODAY, UPCOMING, PAID
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Payment modal state
  const [selectedTenantForPay, setSelectedTenantForPay] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI / Instant Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  // WhatsApp Send Modal State
  const [whatsAppTenant, setWhatsAppTenant] = useState(null);
  const [whatsAppMessageText, setWhatsAppMessageText] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppResult, setWhatsAppResult] = useState(null); // { success: true/false, messageId, error }

  const tenantList = Array.isArray(tenants) ? tenants : [];
  const propertyList = Array.isArray(properties) ? properties : [];

  // New Tenant Form State
  const [formData, setFormData] = useState({
    property_id: propertyList[0]?.id || '',
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

  const filteredTenants = tenantList.filter(t => {
    if (!t) return false;
    const matchesSearch = 
      (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.phone || '').includes(searchTerm) ||
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

  const handleOpenWhatsAppModal = (tenant) => {
    setWhatsAppTenant(tenant);
    setWhatsAppResult(null);
    const defaultMsg = `Hello ${tenant.name}! This is a reminder regarding your rent of ${currency}${Number(tenant.rent_amount).toLocaleString()} for ${tenant.property_name} (${tenant.unit_number}) due on ${tenant.due_day}th of this month. Please make payment via UPI or Bank transfer. Thank you!

---
வணக்கம் ${tenant.name}! ${tenant.property_name} (${tenant.unit_number})-க்கான உங்கள் வாடகைத் தொகை ${currency}${Number(tenant.rent_amount).toLocaleString()} செலுத்த வேண்டியுள்ளது. தயவுசெய்து உங்கள் வாடகையை உடனடியாக செலுத்தவும். நன்றி!`;
    setWhatsAppMessageText(defaultMsg);
  };

  const handleSendWhatsApp = async () => {
    if (!whatsAppTenant || !whatsAppMessageText) return;
    setIsSendingWhatsApp(true);
    setWhatsAppResult(null);

    try {
      const res = await api.sendWhatsAppMessage({
        tenantId: whatsAppTenant.id,
        message: whatsAppMessageText
      });

      if (res.success) {
        setWhatsAppResult({
          success: true,
          messageId: res.messageId,
          recipient: res.recipient
        });
      } else {
        setWhatsAppResult({
          success: false,
          error: res.error || 'Meta API rejected request'
        });
      }
    } catch (err) {
      setWhatsAppResult({
        success: false,
        error: err.message || 'Connection error'
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.rent_amount) return;
    await onCreateTenant(formData);
    setIsAddModalOpen(false);
    setFormData({
      property_id: propertyList[0]?.id || '',
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
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'ALL', label: 'All Tenants' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'DUE_TODAY', label: 'Due Today' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'PAID', label: 'Paid' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                statusFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Add Tenant Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Tenants Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <UserPlus className="w-10 h-10 text-indigo-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Tenants Found</h4>
            <p className="text-xs text-slate-400">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'No tenants match your search/filter criteria.'
                : 'Click "Add Tenant" above to register your first resident and rent schedule.'}
            </p>
          </div>
        ) : filteredTenants.map((tenant) => {
          const isOverdue = tenant.status === 'OVERDUE';
          const isDueToday = tenant.status === 'DUE_TODAY';
          const isPaid = tenant.status === 'PAID';

          return (
            <div 
              key={tenant.id}
              className={`bg-slate-800/60 rounded-2xl p-5 border transition flex flex-col justify-between hover:border-slate-600 ${
                isOverdue 
                  ? 'border-rose-500/40 shadow-lg shadow-rose-950/20' 
                  : isDueToday 
                  ? 'border-amber-500/40 shadow-lg shadow-amber-950/20' 
                  : isPaid 
                  ? 'border-emerald-500/30' 
                  : 'border-slate-700/60'
              }`}
            >
              <div>
                {/* Card Header: Name & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{tenant.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {tenant.property_name} • Unit <span className="font-semibold text-slate-300">{tenant.unit_number}</span>
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wide uppercase ${
                    isOverdue 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                      : isDueToday 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : isPaid 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {tenant.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Tenant Phone & Rent Info */}
                <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Monthly Rent:</span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      {currency}{Number(tenant.rent_amount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Due Date:</span>
                    <span className="text-slate-300 font-semibold">{tenant.due_day}th of every month</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Phone:</span>
                    <span className="font-mono text-slate-300">{tenant.phone}</span>
                  </div>

                  {isPaid ? (
                    <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Reminders Stopped (Paid for cycle)</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Rotated automated calling active</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                {/* Mark as Paid Trigger */}
                {!isPaid ? (
                  <button
                    onClick={() => handleOpenMarkPaid(tenant)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Paid (Stop Reminders)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onStatusChange(tenant.id, 'OVERDUE')}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-slate-700 transition"
                      title="Reset status to Overdue to re-test reminders"
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

                {/* Direct Action Triggers: Real WhatsApp & Voice Simulator */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenWhatsAppModal(tenant)}
                    className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                    title="Send real WhatsApp Cloud notice to tenant"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Notice</span>
                  </button>

                  <button
                    onClick={() => onSimulateCall(tenant)}
                    className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 flex items-center justify-center gap-1.5 transition"
                    title="Test bilingual AI voice notice call"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Voice Notice</span>
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

      {/* Real Meta WhatsApp Direct Send Modal */}
      {whatsAppTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-emerald-500/40 max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <MessageSquare className="w-5 h-5" />
                <span>Send WhatsApp Notice (Meta Cloud API)</span>
              </div>
              <button
                onClick={() => setWhatsAppTenant(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Tenant:</span>
                <span className="font-bold text-white">{whatsAppTenant.name} ({whatsAppTenant.unit_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination Mobile:</span>
                <span className="font-mono text-emerald-300 font-semibold">{whatsAppTenant.phone}</span>
              </div>
            </div>

            {/* Message Body Input */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-300 font-medium">WhatsApp Message Content (Bilingual):</label>
              <textarea
                rows={6}
                value={whatsAppMessageText}
                onChange={(e) => setWhatsAppMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed text-xs"
              />
            </div>

            {/* Real Meta Result Feedback */}
            {whatsAppResult && (
              <div className={`p-3 rounded-xl border text-xs animate-fade-in ${
                whatsAppResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}>
                {whatsAppResult.success ? (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Message accepted by Meta</span>
                    </p>
                    <p className="text-[11px] font-mono text-emerald-300">
                      WAMID: {whatsAppResult.messageId}
                    </p>
                    <p className="text-[10px] text-emerald-400/90 pt-0.5">
                      Meta has queued this notice for delivery to {whatsAppTenant.phone}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Meta WhatsApp API Rejected Message</span>
                    </p>
                    <p className="text-[11px] text-rose-200 leading-relaxed">
                      {whatsAppResult.error}
                    </p>

                    {whatsAppResult.meta?.code && (
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-0.5">
                        <p>Meta Code: {whatsAppResult.meta.code}</p>
                        {whatsAppResult.meta.subcode && <p>Meta Subcode: {whatsAppResult.meta.subcode}</p>}
                        {whatsAppResult.meta.fbtrace_id && <p>fbtrace_id: {whatsAppResult.meta.fbtrace_id}</p>}
                      </div>
                    )}

                    {/* Helpful Meta policy hints */}
                    {whatsAppResult.meta?.code === 131047 && (
                      <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded text-[10px] text-amber-300 space-y-1">
                        <p>⚠️ <strong>24-hour service window expired:</strong> Meta requires an approved message template for business-initiated notifications outside 24h.</p>
                        <button
                          type="button"
                          onClick={async () => {
                            setIsSendingWhatsApp(true);
                            const tRes = await api.testWhatsAppTemplate({ testPhone: whatsAppTenant.phone });
                            setIsSendingWhatsApp(false);
                            setWhatsAppResult(tRes);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[10px] transition"
                        >
                          Send 'hello_world' Template Instead
                        </button>
                      </div>
                    )}

                    {whatsAppResult.meta?.code === 131030 && (
                      <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded text-[10px] text-amber-300">
                        ⚠️ <strong>Recipient not verified in Meta Sandbox:</strong> If using Meta's free test number, add <strong>{whatsAppTenant.phone}</strong> under WhatsApp &gt; API Setup in developers.facebook.com.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWhatsAppTenant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
              
              <button
                type="button"
                disabled={isSendingWhatsApp}
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 text-xs transition active:scale-95 disabled:opacity-50"
              >
                {isSendingWhatsApp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending to Meta...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send via Meta WhatsApp</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

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
                ⚡ <strong>Instant Kill-Switch:</strong> All automated calling queues and WhatsApp reminder notices will halt immediately.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI / Instant Bank Transfer">UPI / Instant Bank Transfer</option>
                  <option value="Direct NEFT / IMPS">Direct NEFT / IMPS Bank Transfer</option>
                  <option value="Cash with Receipt">Cash (Received in person)</option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Receipt Notes / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via PhonePe / Ref #987654"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTenantForPay(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/30 text-xs transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Payment Received</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Add New Tenant & Rent Schedule</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign Property</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  {propertyList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tenant Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-302 / Villa 4"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile Phone (WhatsApp Active)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98450 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="tenant@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly Rent ({currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="22000"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formData.due_day}
                    onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Grace Days</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.grace_days}
                    onChange={(e) => setFormData({ ...formData, grace_days: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <span className="font-semibold text-slate-300 block">Automated Collection Channels</span>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_wa_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_wa_enabled: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                    />
                    <span className="text-slate-300">WhatsApp Cloud</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_call_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_call_enabled: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                    />
                    <span className="text-slate-300">Rotated AI Calling</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_sms_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_sms_enabled: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                    />
                    <span className="text-slate-300">SMS Notices</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
