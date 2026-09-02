import React, { useState } from 'react';
import { 
  Building2, UserPlus, PhoneCall, Zap, CheckCircle2, 
  ArrowRight, Sparkles, X, ChevronDown, ChevronUp, Layers, Check
} from 'lucide-react';

export const SaaSOnboardingGuide = ({
  ownerName,
  propertiesCount = 0,
  tenantsCount = 0,
  numbersCount = 0,
  rulesCount = 0,
  logsCount = 0,
  paymentsCount = 0,
  onNavigateTab,
  onOpenAddProperty,
  onOpenAddTenant,
  onLoadDemoData,
  onDismiss,
  isDismissed
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Derive real step completion strictly from actual backend state
  const step1Done = propertiesCount > 0;
  const step2Done = tenantsCount > 0;
  const step3Done = numbersCount > 0 && rulesCount > 0;
  const step4Done = paymentsCount > 0 || logsCount > 0;

  const completedStepsCount = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const progressPercent = Math.round((completedStepsCount / 4) * 100);

  if (isDismissed) {
    return null;
  }

  // If fully completed, render a clean, subtle completion summary card
  if (completedStepsCount === 4) {
    return (
      <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Account Setup Complete</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Your properties, tenants, and automated reminders are configured. PropertyRent.AI is active.
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          Dismiss
        </button>
      </div>
    );
  }

  const steps = [
    {
      id: 1,
      title: 'Add your first property',
      description: 'Register the building, apartment, or commercial estate you manage.',
      isDone: step1Done,
      actionText: '+ Add Property',
      onAction: () => {
        onNavigateTab('properties');
        if (onOpenAddProperty) onOpenAddProperty();
      }
    },
    {
      id: 2,
      title: 'Register tenant & rent schedule',
      description: 'Assign a resident, mobile number, monthly rent amount, and monthly due date.',
      isDone: step2Done,
      actionText: '+ Add Tenant',
      onAction: () => {
        onNavigateTab('tenants');
        if (onOpenAddTenant) onOpenAddTenant();
      }
    },
    {
      id: 3,
      title: 'Verify caller lines & reminder rules',
      description: 'Check your virtual phone numbers and review automated bilingual reminder schedules.',
      isDone: step3Done,
      actionText: 'Review Rules & Lines',
      onAction: () => onNavigateTab('automations')
    },
    {
      id: 4,
      title: 'Test voice notice & instant kill-switch',
      description: 'Simulate a Tamil/English reminder call and observe how marking as Paid halts reminders.',
      isDone: step4Done,
      actionText: 'Open Tenants & Test',
      onAction: () => onNavigateTab('tenants')
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md transition-all">
      
      {/* Top Header Row */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Getting Started
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {completedStepsCount} of 4 completed ({progressPercent}%)
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Welcome to PropertyRent.AI, {ownerName || 'Property Owner'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Complete these 4 steps to automate rent collection, spam-protected phone calling, and instant receipt dispatch.
          </p>
        </div>

        {/* Progress Bar & Header Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {propertiesCount === 0 && (
            <button
              onClick={onLoadDemoData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
              title="Populate sample properties and tenants to explore the workflow"
            >
              Load Sample Data
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Dismiss setup guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1">
        <div 
          className="bg-indigo-500 h-1 transition-all duration-500" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Items (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                step.isDone 
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-85' 
                  : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                  step.isDone 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}>
                  {step.isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div>
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${
                    step.isDone ? 'text-slate-300 line-through' : 'text-white'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {step.isDone ? (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <button
                    onClick={step.onAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
