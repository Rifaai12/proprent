import React from 'react';
import { X, CheckCheck, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

export const WhatsAppPreviewModal = ({ isOpen, onClose, data, onSendDirect }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* WhatsApp Header */}
        <div className="bg-[#128C7E] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-sm">
              {data.tenantName ? data.tenantName[0] : 'T'}
            </div>
            <div>
              <h4 className="font-semibold text-sm leading-tight flex items-center gap-1">
                {data.tenantName}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 inline" />
              </h4>
              <p className="text-[11px] text-emerald-100">{data.tenantPhone || '+91 98450 12345'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body (WhatsApp styled dark chat background) */}
        <div className="bg-[#0b141a] p-4 flex-1 min-h-[320px] max-h-[420px] overflow-y-auto space-y-3">
          <div className="flex justify-center">
            <span className="text-[10px] bg-[#182229] text-slate-400 px-3 py-1 rounded-md shadow-sm">
              TODAY • ENCRYPTED END-TO-END
            </span>
          </div>

          {/* Outbound Message Bubble */}
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-[#005c4b] text-slate-100 rounded-lg p-3 text-xs leading-relaxed shadow-md relative">
              <div className="whitespace-pre-wrap">{data.messageContent}</div>
              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>

          {/* Optional Tenant Reply if Paid */}
          {data.isPaidReply && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-[#202c33] text-slate-200 rounded-lg p-3 text-xs leading-relaxed shadow-md">
                <p>Payment completed! Here is the UTR reference: TXN-884920. Thanks.</p>
                <span className="block text-right text-[10px] text-slate-400 mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#202c33] border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Meta WhatsApp Cloud API Ready
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded-lg transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
