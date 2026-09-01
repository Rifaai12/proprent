import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, PhoneCall, 
  ShieldCheck, Building2, UserPlus, Key, MousePointerClick, Zap
} from 'lucide-react';

export const GuidedTour = ({ isOpen, onClose, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      targetSelector: '[data-tour="welcome-banner"]',
      fallbackTab: 'dashboard',
      title: 'Welcome to PropertyRent.AI! 🏢',
      description: 'This is your automated rent collection command center. Let us show you step-by-step how to automate calls, WhatsApp reminders, and payment tracking.',
      actionText: 'Start Guided Tour',
      icon: Sparkles,
      accentColor: 'from-indigo-600 to-violet-600',
      badge: 'Step 1 of 6'
    },
    {
      targetSelector: '[data-tour="add-tenant-btn"]',
      fallbackTab: 'tenants',
      title: 'Step 1: Add Your Tenants & Due Dates 👥',
      description: 'Click here to register a tenant. Enter their Mobile Number, Monthly Rent Amount, and Due Day (e.g. 5th of every month). The system automatically tracks their dues!',
      actionText: 'Next: Test AI Calling',
      icon: UserPlus,
      accentColor: 'from-emerald-600 to-teal-600',
      badge: 'Step 2 of 6'
    },
    {
      targetSelector: '[data-tour="simulate-call-btn"]',
      fallbackTab: 'dashboard',
      title: 'Step 2: AI Voice Calling (Tamil First, English Next) 📞',
      description: 'When rent is due or overdue, our AI voice agent calls the tenant. Click "Simulate AI Call" to hear the AI speak in Tamil first, then English directly on your screen!',
      actionText: 'Next: Mark as Paid Kill-Switch',
      icon: PhoneCall,
      accentColor: 'from-violet-600 to-indigo-600',
      badge: 'Step 3 of 6'
    },
    {
      targetSelector: '[data-tour="mark-paid-btn"]',
      fallbackTab: 'dashboard',
      title: 'Step 3: Instant "Mark as Paid" Kill-Switch 🛑',
      description: 'The moment your tenant transfers rent, click this green button! It instantly stops all automated calls and messages, logs payment history, and dispatches a WhatsApp receipt.',
      actionText: 'Next: Anti-Blocking Pool',
      icon: ShieldCheck,
      accentColor: 'from-emerald-600 to-emerald-500',
      badge: 'Step 4 of 6'
    },
    {
      targetSelector: '[data-tour="pool-tab"]',
      fallbackTab: 'pool',
      title: 'Step 4: Anti-Blocking Number Pool (Anti-Spam) 🛡️',
      description: 'To prevent Truecaller and tenants from blocking your number, our engine rotates each call across 3-5 different virtual numbers. Click here to manage your numbers!',
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

  // Update target bounding box on step change or resize
  const updatePosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    // If step requires navigating to a specific tab
    if (step.fallbackTab && onNavigateTab) {
      onNavigateTab(step.fallbackTab);
    }

    setTimeout(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          clientTop: rect.top,
          clientLeft: rect.left,
        });
      } else {
        // Fallback to center screen
        setTargetRect(null);
      }
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
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
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      
      {/* Dark Black Overlay with Cutout Spotlight */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" />

      {/* Target Element Spotlight Cutout (Glow ring) */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-50 rounded-2xl ring-4 ring-emerald-400 ring-offset-4 ring-offset-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.5)]"
          style={{
            top: targetRect.clientTop - 6,
            left: targetRect.clientLeft - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* Pulsing Click Indicator Finger */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-emerald-300 text-xs font-bold bg-slate-950/90 px-3 py-1 rounded-full border border-emerald-500/50 animate-bounce whitespace-nowrap shadow-xl">
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
            <span>CLICK HERE</span>
          </div>
        </div>
      )}

      {/* Floating Interactive Tooltip Dialog Box */}
      <div 
        className="fixed z-50 max-w-md w-[92%] sm:w-full bg-slate-900/95 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300"
        style={{
          top: targetRect && targetRect.clientTop > 320 
            ? Math.max(20, targetRect.clientTop - 280) 
            : targetRect && targetRect.clientTop <= 320 
            ? Math.min(window.innerHeight - 300, targetRect.clientTop + (targetRect.height || 60) + 40)
            : '50%',
          left: '50%',
          transform: targetRect ? 'translateX(-50%)' : 'translate(-50%, -50%)',
        }}
      >
        {/* Step Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {current.badge}
            </span>
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep ? 'w-5 bg-indigo-400' : 'w-1.5 bg-slate-700'
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
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Icon */}
        <div className="mt-3.5 flex items-start gap-3">
          <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${current.accentColor} text-white shadow-lg flex-shrink-0`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              {current.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.setItem('property_rent_tour_completed', 'true');
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-2"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
