import React, { useState } from 'react';
import { Key, Copy, Check, X, ShieldCheck, User, Clock, Terminal } from 'lucide-react';

export const TokenInspectorModal = ({ isOpen, onClose, token, owner }) => {
  if (!isOpen || !token) return null;

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Decode JWT payload without external library
  let payload = {};
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    payload = JSON.parse(jsonPayload);
  } catch (e) {
    payload = owner || {};
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs text-slate-300">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3>Active JWT Bearer Token</h3>
              <p className="text-xs text-slate-400 font-normal">Owner Authentication & API Authorization Token</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token String Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Raw Bearer Token:</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Token'}</span>
            </button>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 break-all leading-relaxed select-all">
            {token}
          </div>
        </div>

        {/* Decoded Claims */}
        <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
          <span className="font-bold text-white text-xs block flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Decoded Token Payload:</span>
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Owner Name:</span>
              <p className="font-semibold text-white">{payload.name || owner?.name}</p>
            </div>
            <div>
              <span className="text-slate-400">Email:</span>
              <p className="font-semibold text-white">{payload.email || owner?.email}</p>
            </div>
            <div>
              <span className="text-slate-400">Role:</span>
              <p className="font-semibold text-indigo-300">{payload.role || 'SUPER_OWNER'}</p>
            </div>
            <div>
              <span className="text-slate-400">Expires In:</span>
              <p className="font-semibold text-slate-200">30 Days</p>
            </div>
          </div>
        </div>

        {/* API / Postman Usage Example */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>How to use in Postman / External APIs:</span>
          </div>
          <pre className="p-2 bg-slate-900 rounded-lg text-slate-300 font-mono text-[10px] overflow-x-auto">
{`// Add this HTTP Header to your API requests:
Authorization: Bearer ${token.slice(0, 32)}...`}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
