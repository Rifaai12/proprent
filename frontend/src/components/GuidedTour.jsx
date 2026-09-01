import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, ArrowLeft, X, PhoneCall, 
  ShieldCheck, UserPlus, Key, MousePointerClick, Zap, CheckCircle2
} from 'lucide-react';

export const GuidedTour = ({ isOpen, onClose, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      targetSelector: '[data-tour="welcome-banner"]',
      fallbackTab: 'dashboard',
      title: 'Welcome to PropertyRent.AI! 🏢',
      description: 'This is your automated rent collection command center. Let us teach you step-by-step how to add properties, tenants, and automate calls.',
      actionText: 'Start Walkthrough',
      icon: Sparkles,
      accentColor: 'from-indigo-600 to-violet-600',
      badge: 'Step 1 of 6'
    },
    {
      targetSelector: '[data-tour="add-tenant-btn"]',
      fallbackTab: 'tenants',
      title: 'Step 1: Add Your Tenants & Due Dates 👥',
      description: 'Click here to register a tenant. Enter their Mobile Number, Monthly Rent Amount, and Due Day (e.g. 5th of every month). The system automatically monitors due dates!',
      actionText: 'Next: Test AI Voice Calls',
      icon: UserPlus,
      accentColor: 'from-emerald-600 to-teal-600',
      badge: 'Step 2 of 6'
    },
    {
      targetSelector: '[data-tour="simulate-call-btn"]',
      fallbackTab: 'dashboard',
      title: 'Step 2: AI Voice Calling (Tamil First, English Next) 📞',
      description: 'When rent is due or overdue, our AI voice agent calls the tenant. Click "Simulate AI Call" to hear the AI speak in Tamil first, then English directly on your phone/PC!',
      actionText: 'Next: Mark as Paid Kill-Switch',
      icon: PhoneCall,
      accentColor: 'from-violet-600 to-indigo-600',
      badge: 'Step 3 of 6'
    },
    {
      targetSelector: '[data-tour="mark-paid-btn"]',
      fallbackTab: 'dashboard',
      title: 'Step 3: Instant "Mark as Paid" Kill-Switch 🛑',
      description: 'The moment your tenant pays rent, click this green button! It immediately aborts all automated calling queues, records payment, and dispatches a WhatsApp receipt.',
      actionText: 'Next: Anti-Blocking Pool',
      icon: ShieldCheck,
      accentColor: 'from-emerald-600 to-emerald-500',
      badge: 'Step 4 of 6'
    },
    {
      targetSelector: '[data-tour="pool-tab"]',
      fallbackTab: 'pool',
      title: 'Step 4: Anti-Blocking Number Pool (Anti-Spam) 🛡️',
      description: 'To prevent Truecaller and tenants from blocking your number, our engine rotates each call across 3-5 different virtual numbers. Click here to manage your pool!',
      actionText: 'Next: Bearer Token & API',
      icon: Zap,
      accentColor: 'from-amber-600 to-amber-500',
      badge: 'Step 5 of 6'
    },
    {
      targetSelector: '[data-tour="bearer-token-btn"]',
      fallbackTab: 'dashboard',
      title: 'Step 5: JWT Bearer Token Security 🔑',
      description: 'Your account is secured with JWT Bearer tokens. Click here anytime to inspect or copy your Bearer token for Postman, external webhooks, or API integrations.',
      actionText: 'Finish & Start Using App',
      icon: Key,
      accentColor: 'from-indigo-600 to-emerald-600',
      badge: 'Step 6 of 6'
    }
  ];

  const updatePosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    if (step.fallbackTab && onNavigateTab) {
      onNavigateTab(step.fallbackTab);
    }

    setTimeout(() => {
      try {
        const el = document.querySelector(step.targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const rect = el.getBoundingClientRect();
          setTargetRect({
            clientTop: rect.top,
            clientLeft: rect.left,
            width: rect.width,
            height: rect.height,
          });
        } else {
          setTargetRect(null);
        }
      } catch (err) {
        setTargetRect(null);
      }
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        window.removeEventListener('keydown', handleKey);
      };
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const current = steps[currentStep];
  const IconComponent = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('property_rent_tour_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      
      {/* Dark Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
      />

      {/* Target Element Spotlight Cutout (Glow ring) */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-[105] rounded-2xl ring-4 ring-emerald-400 ring-offset-4 ring-offset-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.7)]"
          style={{
            top: Math.max(10, targetRect.clientTop - 6),
            left: Math.max(10, targetRect.clientLeft - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* Pulsing Pointer Finger */}
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1 text-emerald-300 text-xs font-bold bg-slate-950 px-3 py-1 rounded-full border border-emerald-500/60 animate-bounce whitespace-nowrap shadow-2xl">
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
            <span>CLICK THIS STEP</span>
          </div>
        </div>
      )}

      {/* Centered Interactive Tour Dialog Box */}
      <div className="relative z-[110] max-w-md w-full bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-950/80 space-y-5 text-xs text-slate-300">
        
        {/* Step Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {current.badge}
            </span>
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-6 bg-emerald-400' : idx < currentStep ? 'w-2 bg-indigo-500' : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem('property_rent_tour_completed', 'true');
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Title & Icon */}
        <div className="flex items-start gap-3.5 pt-1">
          <div className={`p-3 rounded-2xl bg-gradient-to-tr ${current.accentColor} text-white shadow-lg shadow-indigo-600/30 flex-shrink-0`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              {current.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
              {current.description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.setItem('property_rent_tour_completed', 'true');
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-2"
            >
              Skip Tour
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
