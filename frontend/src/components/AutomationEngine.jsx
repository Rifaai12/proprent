import React, { useState } from 'react';
import { 
  Zap, Clock, PhoneCall, MessageSquare, Mail, Play, CheckCircle2, 
  Settings2, Sparkles, Edit2, ShieldAlert, ArrowDown, Check, X
} from 'lucide-react';

export const AutomationEngine = ({ 
  rules, 
  onUpdateRule, 
  onRunAutomationCycle, 
  isRunningCycle, 
  lastRunResults 
}) => {
  const [editingRule, setEditingRule] = useState(null);
  const [templateText, setTemplateText] = useState('');

  const handleEditClick = (rule) => {
    setEditingRule(rule);
    setTemplateText(rule.script_template);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    await onUpdateRule(editingRule.id, {
      ...editingRule,
      script_template: templateText
    });
    setEditingRule(null);
  };

  const rulesList = Array.isArray(rules) ? rules : [];

  return (
    <div className="space-y-6">
      
      {/* Automation Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Automated Escalation Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Cron Active (Daily 09:00 AM)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Customizable schedule rules that automatically message & call tenants based on their due date offset. The system automatically stops when rent is marked as paid.
          </p>
        </div>

        <button
          onClick={onRunAutomationCycle}
          disabled={isRunningCycle}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition active:scale-95 disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isRunningCycle ? 'animate-spin' : ''}`} />
          <span>{isRunningCycle ? 'Evaluating Triggers...' : 'Trigger Full Cycle Now'}</span>
        </button>
      </div>

      {/* Last Cycle Result Toast / Banner if available */}
      {lastRunResults && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between font-bold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Automation Engine Execution Report ({lastRunResults.executed_count} actions evaluated)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">{new Date(lastRunResults.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="space-y-1 text-slate-300 font-mono text-[11px]">
            {lastRunResults.results?.map((res, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-emerald-900/50">
                <span>{res.tenant_name}: {res.action === 'SKIPPED_PAID' ? '🟢 Skipped (Already Paid)' : `⚡ ${res.rule_name}`}</span>
                <span className="text-slate-400">{res.reason || `${res.dispatched?.length || 0} channels dispatched`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Accordion List */}
      <div className="space-y-3">
        {rulesList.map((rule, index) => {
          const hasAiCall = rule.channels.includes('ai_call');
          const hasWhatsApp = rule.channels.includes('whatsapp');
          const hasSMS = rule.channels.includes('sms');

          return (
            <div 
              key={rule.id}
              className={`relative bg-slate-900/80 rounded-2xl border transition p-5 ${
                rule.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                {/* Left: Offset & Title */}
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center ${
                    rule.trigger_type === 'before_due'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : rule.trigger_type === 'on_due'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {rule.trigger_type === 'before_due' ? `T-${rule.days_offset}d` : rule.trigger_type === 'on_due' ? 'T-0' : `T+${rule.days_offset}d`}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {rule.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">
                      "{rule.script_template}"
                    </p>
                  </div>
                </div>

                {/* Right: Active Channel Badges & Controls */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <div className="flex items-center gap-1.5">
                    {hasAiCall && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        <PhoneCall className="w-3 h-3" />
                        <span>AI Call (Rotated DID)</span>
                      </span>
                    )}
                    {hasWhatsApp && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </span>
                    )}
                    {hasSMS && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        <span>SMS</span>
                      </span>
                    )}
                  </div>

                  {/* Edit Script Button */}
                  <button
                    onClick={() => handleEditClick(rule)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Edit AI Voice / Message Script"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => onUpdateRule(rule.id, { ...rule, is_active: !rule.is_active })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      rule.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Script Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Edit Script for {editingRule.name}</span>
              </h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  AI Call / WhatsApp Spoken Script Template
                </label>
                <textarea
                  rows={5}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Dynamic Variables helper */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300">Supported Dynamic Variables:</span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {['{tenant_name}', '{property_name}', '{unit_number}', '{rent_amount}', '{currency}', '{due_date}', '{owner_name}', '{upi_id}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTemplateText(prev => prev + ' ' + tag)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 transition"
                      title="Click to insert tag"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                Save Script
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
