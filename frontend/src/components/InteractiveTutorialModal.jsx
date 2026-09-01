import React, { useState } from 'react';
import { 
  Building2, UserPlus, PhoneForwarded, Zap, CheckCircle2, ShieldCheck, 
  ArrowRight, ArrowLeft, X, Sparkles, PhoneCall, MessageSquare, Award
} from 'lucide-react';

export const InteractiveTutorialModal = ({ isOpen, onClose, onStartAction }) => {
  if (!isOpen) return null;

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      stepNumber: '1',
      title: 'Add Your Properties & Units',
      subtitle: 'Organize your apartments, commercial spaces, or villas',
      icon: Building2,
      accentColor: 'from-indigo-600 to-indigo-500',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: 'First, add the properties you manage (e.g. Skyline Residency or Orchid Towers). You can specify the total number of units, location, and monthly default rent.',
      highlight: 'Tip: You can manage multiple buildings and commercial complexes in one dashboard.'
    },
    {
      stepNumber: '2',
      title: 'Register Tenants with Mobile & Due Dates',
      subtitle: 'Assign tenants to units with their rent amount',
      icon: UserPlus,
      accentColor: 'from-emerald-600 to-teal-500',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Add your tenant with their name, mobile phone number, rent amount (e.g. ₹22,000), and due day of the month (e.g. 5th of every month).',
      highlight: 'Enable or disable AI Voice calls, WhatsApp, or SMS individually per tenant anytime.'
    },
    {
      stepNumber: '3',
      title: 'Anti-Blocking Caller ID Rotation Pool',
      subtitle: 'Why rotating numbers prevents tenant spam blocking',
      icon: PhoneForwarded,
      accentColor: 'from-amber-600 to-amber-500',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'When tenants receive repeated collection calls from one number, Truecaller and phones automatically block it. Our engine rotates sequential calls across 3-5 virtual lines so every reminder reaches the tenant.',
      highlight: 'Each call attempt to the same tenant automatically uses a fresh, clean number!'
    },
    {
      stepNumber: '4',
      title: 'Automated WhatsApp & Tamil/English AI Voice Calls',
      subtitle: 'Scheduled dunning runs automatically every day',
      icon: PhoneCall,
      accentColor: 'from-violet-600 to-indigo-500',
      badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      description: 'The background cron scheduler checks due dates every morning. 3 days before due date, on due date, and when overdue, it automatically sends WhatsApp messages (English First, Tamil Next) and makes AI voice calls (Tamil First, English Next).',
      highlight: 'Tenants can respond directly to the AI voice agent or request a callback.'
    },
    {
      stepNumber: '5',
      title: 'Single-Click "Mark as Paid" Instant Kill-Switch',
      subtitle: 'Stops all reminder calls the instant payment is confirmed',
      icon: ShieldCheck,
      accentColor: 'from-emerald-600 to-emerald-500',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'The moment the tenant pays rent, click the green "Mark as Paid" button. The system immediately records the payment, sends a WhatsApp receipt, and permanently halts all ongoing and scheduled reminder calls for that billing cycle.',
      highlight: 'Zero awkward calls to tenants after they have already paid!'
    }
  ];

  const current = steps[activeStep];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-xs text-slate-300 relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-2 rounded-full transition-all ${
                activeStep === idx 
                  ? 'w-8 bg-indigo-500' 
                  : idx < activeStep 
                  ? 'w-2 bg-emerald-500' 
                  : 'w-2 bg-slate-700'
              }`}
              title={`Step ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-gradient-to-tr ${current.accentColor} text-white shadow-lg`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${current.badgeColor}`}>
                STEP {current.stepNumber} OF 5
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">{current.title}</h3>
              <p className="text-xs text-slate-400">{current.subtitle}</p>
            </div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans pt-2">
            {current.description}
          </p>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
              {current.highlight}
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-semibold rounded-xl transition text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-xs"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onStartAction) onStartAction();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Let's Get Started!</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
