import React from 'react';
import { TrendingUp, AlertTriangle, Clock, CheckCircle2, PhoneForwarded, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';

export const DashboardMetrics = ({ metrics, onSwitchTab, onRunAutomation }) => {
  const data = metrics || {};
  const currency = data.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Top Banner: Automation & Kill-Switch Explainer Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-emerald-950/30 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Automated Rent Reminders & Smart Rotation Active
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              When rent is due, automated bilingual AI voice calls and WhatsApp notices trigger using rotated caller numbers to ensure delivery. The moment you mark a tenant as <span className="text-emerald-400 font-semibold">"Paid"</span>, all automated reminder queues immediately stop.
            </p>
          </div>
        </div>
        <button
          onClick={() => onSwitchTab('tenants')}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition whitespace-nowrap flex items-center gap-1 self-end md:self-auto"
        >
          <span>View Tenant Dues</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Rent & Collection Rate */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Monthly Rent</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {currency}{Number(data.totalRentExpected || 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>Collected: {currency}{Number(data.totalRentCollected || 0).toLocaleString()}</span>
              <span className="font-semibold text-emerald-400">{data.collectionRate || 0}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data.collectionRate || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Overdue Rent Escalation */}
        <div className="bg-slate-800/60 border border-rose-500/30 rounded-xl p-4 hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300">Overdue Tenants</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-400 tracking-tight">
              {data.overdueCount || 0} <span className="text-xs font-normal text-slate-400">Tenants</span>
            </div>
            <p className="text-xs text-rose-300/80 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Follow-Up Calling & SMS Active
            </p>
          </div>
        </div>

        {/* Card 3: Due Today & Upcoming */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Due Today & Upcoming</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
              <span className="text-amber-400">{data.dueTodayCount || 0}</span>
              <span className="text-xs font-normal text-slate-400">due today</span>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400 text-lg">{data.upcomingCount || 0}</span>
              <span className="text-xs font-normal text-slate-400">upcoming</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {data.paidCount || 0} Tenants Marked Paid
            </p>
          </div>
        </div>

        {/* Card 4: Rotated Caller Numbers */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rotated Caller Lines</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <PhoneForwarded className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
              <span>{data.activeNumbersCount || 0}</span>
              <span className="text-xs font-normal text-slate-400">Active Lines</span>
            </div>
            <p className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Spam-Protection Enabled
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
