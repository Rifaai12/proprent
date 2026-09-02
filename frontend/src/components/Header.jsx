import React from 'react';
import { 
  Building2, PhoneCall, Settings, BookOpen, LogOut, RefreshCw, 
  UserCheck, HelpCircle, Layers, CheckCircle2 
} from 'lucide-react';

export const Header = ({ 
  onOpenSetupGuide,
  onRunAutomation, 
  onOpenSimulator, 
  onOpenSettings, 
  onOpenDeployGuide, 
  onLogout,
  owner,
  isRunningAutomation, 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">PropertyRent<span className="text-emerald-400">.AI</span></h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Owner Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated Rent Reminders • Rotated Caller Lines • Instant Kill-Switch
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'tenants', label: 'Tenants & Rent' },
              { id: 'properties', label: 'Properties' },
              { id: 'pool', label: 'Caller Numbers' },
              { id: 'automations', label: 'Automation Rules' },
              { id: 'logs', label: 'Activity Logs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Buttons & Owner Profile */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Setup Guide Launcher */}
            <button
              onClick={onOpenSetupGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg border border-slate-700 transition active:scale-95"
              title="Open step-by-step setup checklist"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Setup Guide</span>
            </button>

            {/* Run Daily Automation Engine */}
            <button
              onClick={onRunAutomation}
              disabled={isRunningAutomation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Runs daily scan of due dates and dispatches matching calls and messages"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningAutomation ? 'animate-spin' : ''}`} />
              <span>{isRunningAutomation ? 'Running...' : 'Run Daily Reminders'}</span>
            </button>

            {/* Quick Test Phone Simulator */}
            <button
              onClick={onOpenSimulator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium rounded-lg transition"
              title="Test a simulated automated reminder notice"
            >
              <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Call</span>
            </button>

            {/* Deployment Guide */}
            <button
              onClick={onOpenDeployGuide}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
              title="Telecom API connection guide (Twilio, WhatsApp Cloud, Vapi)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>API Guide</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition"
              title="Account settings & payment details"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Owner Chip & Logout Button */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{owner?.name?.split(' ')[0] || 'Owner'}</span>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 rounded-lg border border-rose-500/30 text-xs font-medium transition"
                title="Log out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
