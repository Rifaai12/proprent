import React from 'react';
import { 
  Building2, UserPlus, PhoneForwarded, Zap, CheckCircle2, ArrowRight, 
  Sparkles, Trash2, HelpCircle, ShieldCheck, Check
} from 'lucide-react';

export const OnboardingWizard = ({ 
  ownerName, 
  propertiesCount = 0, 
  tenantsCount = 0, 
  numbersCount = 0, 
  onOpenAddProperty, 
  onOpenAddTenant, 
  onSwitchTab, 
  onClearDemoData, 
  onOpenTutorial,
  isDemoDataActive 
}) => {
  const step1Complete = propertiesCount > 0;
  const step2Complete = tenantsCount > 0;
  const step3Complete = numbersCount > 0;
  const allComplete = step1Complete && step2Complete && step3Complete;

  return (
    <div 
      data-tour="welcome-banner"
      className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden"
    >
      
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Step-by-Step Owner Setup Roadmap</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Welcome, {ownerName || 'Property Owner'}! Follow these 4 simple steps to automate your rent:
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            From adding your first building to automatic WhatsApp notices and anti-blocking AI voice calls (Tamil & English).
          </p>
        </div>

        {/* Action Controls: Tutorial & Clear Demo */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <button
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>Interactive Tutorial</span>
          </button>

          {isDemoDataActive && (
            <button
              onClick={onClearDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold rounded-xl transition"
              title="Clear sample properties and tenants to enter your own real data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sample Data (Start Fresh)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Interactive Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
        
        {/* Step 1: Add Property */}
        <div className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
          step1Complete 
            ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm' 
            : 'bg-slate-900/60 border-slate-700/80 hover:border-indigo-500'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400">STEP 1</span>
              {step1Complete ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                  <Check className="w-3 h-3" /> {propertiesCount} Added
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-xs">Add Your Property</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Create your apartment, villa, or commercial building with total unit counts.
            </p>
          </div>
          <button
            onClick={() => onSwitchTab('properties')}
            className="mt-3.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition"
          >
            <span>{step1Complete ? 'View Properties' : '+ Add Property'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>

        {/* Step 2: Add Tenants & Due Dates */}
        <div className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
          step2Complete 
            ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm' 
            : 'bg-slate-900/60 border-slate-700/80 hover:border-indigo-500'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400">STEP 2</span>
              {step2Complete ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                  <Check className="w-3 h-3" /> {tenantsCount} Added
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-xs">Add Tenants & Rent</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Enter tenant mobile number, monthly rent amount, and due date of month.
            </p>
          </div>
          <button
            onClick={() => onSwitchTab('tenants')}
            className="mt-3.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition"
          >
            <span>{step2Complete ? 'View Tenants' : '+ Add Tenant'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Step 3: Anti-Blocking DID Pool */}
        <div className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
          step3Complete 
            ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm' 
            : 'bg-slate-900/60 border-slate-700/80 hover:border-indigo-500'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400">STEP 3</span>
              {step3Complete ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                  <Check className="w-3 h-3" /> {numbersCount} Numbers
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <PhoneForwarded className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-xs">Anti-Blocking Pool</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Add 3-5 virtual caller IDs so calls rotate and tenants cannot spam-block you.
            </p>
          </div>
          <button
            onClick={() => onSwitchTab('pool')}
            className="mt-3.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition"
          >
            <span>Manage Caller IDs</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Step 4: Automatic Reminders & Kill Switch */}
        <div className="p-4 rounded-2xl border bg-slate-900/90 border-indigo-500/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400">STEP 4</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800 animate-pulse">
                <ShieldCheck className="w-3 h-3" /> Auto Active
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-xs">Automation & Kill Switch</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              System calls/messages on due dates. When marked <strong>"Paid"</strong>, all calls immediately halt!
            </p>
          </div>
          <button
            onClick={() => onSwitchTab('automations')}
            className="mt-3.5 w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 flex items-center justify-center gap-1 transition"
          >
            <span>View Schedule Rules</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>

      </div>

    </div>
  );
};
