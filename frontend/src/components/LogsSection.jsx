import React from 'react';
import { 
  PhoneCall, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, 
  Trash2, Sparkles, Filter, PhoneForwarded
} from 'lucide-react';

export const LogsSection = ({ logs, onClearLogs }) => {
  const logsList = Array.isArray(logs) ? logs : [];

  return (
    <div className="space-y-6">
      
      {/* Logs Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Automated Activity & Call Audit Trail</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {logsList.length} Entries
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time record of all dispatched AI voice calls (with rotated caller IDs), WhatsApp messages, and Kill-Switch events
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {logsList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No activity logs recorded yet. Trigger a daily cycle or simulate a call to view logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 font-semibold">Tenant</th>
                  <th className="px-6 py-3 font-semibold">Channel</th>
                  <th className="px-6 py-3 font-semibold">Rotated Caller ID Used</th>
                  <th className="px-6 py-3 font-semibold">Status / Intent</th>
                  <th className="px-6 py-3 font-semibold">Action Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logsList.map(log => {
                  const isCall = log.channel === 'ai_call';
                  const isWA = log.channel === 'whatsapp';
                  const isKill = log.channel === 'system' || log.status === 'cancelled_paid';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Timestamp */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Tenant */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-white block">{log.tenant_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.tenant_phone}</span>
                      </td>

                      {/* Channel Badge */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {isCall && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <PhoneCall className="w-3 h-3" />
                            <span>AI Voice Call</span>
                          </span>
                        )}
                        {isWA && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </span>
                        )}
                        {isKill && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Kill-Switch</span>
                          </span>
                        )}
                        {!isCall && !isWA && !isKill && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <span>SMS</span>
                          </span>
                        )}
                      </td>

                      {/* Rotated Caller ID Used */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PhoneForwarded className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <div>
                            <span className="font-mono text-emerald-300 font-semibold">{log.caller_id_used}</span>
                            {log.caller_id_label && (
                              <span className="block text-[9px] text-slate-400">{log.caller_id_label}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status / Intent */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {log.status === 'cancelled_paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Halted (Paid)</span>
                          </span>
                        ) : log.status === 'answered' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800">
                              Answered ({log.call_duration_sec}s)
                            </span>
                            {log.tenant_response_intent && (
                              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">{log.tenant_response_intent}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            Delivered
                          </span>
                        )}
                      </td>

                      {/* Content Preview */}
                      <td className="px-6 py-3.5 max-w-md">
                        <p className="text-xs text-slate-300 line-clamp-2 italic leading-relaxed">
                          "{log.content}"
                        </p>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
