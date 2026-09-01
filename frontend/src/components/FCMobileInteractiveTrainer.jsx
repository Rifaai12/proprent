import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Zap, ArrowRight, X, Sparkles, CheckCircle2, 
  PhoneCall, ShieldCheck, UserPlus, Building2, Play, MousePointerClick
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FCMobileInteractiveTrainer = ({ 
  isActive, 
  onClose, 
  onSwitchTab,
  onOpenAddProperty,
  onOpenAddTenant,
  onSimulateCall,
  onMarkAsPaid,
  tenants = []
}) => {
  const [currentDrill, setCurrentDrill] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [drillCompleted, setDrillCompleted] = useState(false);

  // FC Mobile style Drills
  const drills = [
    {
      id: 'drill-1',
      title: 'DRILL 1: Add Your First Property 🏢',
      instruction: 'Tap the "+ Add Property" button to create your first apartment or building.',
      tab: 'properties',
      targetSelector: '[data-tour="add-property-btn"]',
      badge: 'TRAINING MISSION 1/4',
      tip: 'Just like signing your first squad manager in FC Mobile, set up your property first!'
    },
    {
      id: 'drill-2',
      title: 'DRILL 2: Register Tenant & Due Date 👥',
      instruction: 'Tap "+ Add Tenant" to assign a tenant with their mobile number and monthly rent dues.',
      tab: 'tenants',
      targetSelector: '[data-tour="add-tenant-btn"]',
      badge: 'TRAINING MISSION 2/4',
      tip: 'The AI will automatically monitor this tenant\'s due date every month.'
    },
    {
      id: 'drill-3',
      title: 'DRILL 3: Test Tamil & English AI Voice Call 📞',
      instruction: 'Tap "Simulate AI Call" to hear the voice engine speak Tamil first, then English!',
      tab: 'tenants',
      targetSelector: '[data-tour="simulate-call-btn"]',
      badge: 'TRAINING MISSION 3/4',
      tip: 'Notice how it automatically uses a rotated caller ID so tenants can\'t block you!'
    },
    {
      id: 'drill-4',
      title: 'DRILL 4: Activate Instant Kill-Switch 🛑',
      instruction: 'Tap "Mark as Paid" to stop all reminder calls immediately and issue a receipt!',
      tab: 'tenants',
      targetSelector: '[data-tour="mark-paid-btn"]',
      badge: 'FINAL DRILL 4/4',
      tip: 'The moment payment arrives, one click halts all calling queues permanently!'
    }
  ];

  const current = drills[currentDrill];

  // Target Element Finder
  const updateTargetPosition = () => {
    if (!current) return;

    if (current.tab && onSwitchTab) {
      onSwitchTab(current.tab);
    }

    setTimeout(() => {
      try {
        const el = document.querySelector(current.targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const rect = el.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        } else {
          setTargetRect(null);
        }
      } catch (e) {
        setTargetRect(null);
      }
    }, 250);
  };

  useEffect(() => {
    if (isActive) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition);
    }
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [isActive, currentDrill]);

  if (!isActive) return null;

  // Handle drill completion & advance
  const handleDrillAction = () => {
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (e) {}

    if (currentDrill < drills.length - 1) {
      setCurrentDrill(prev => prev + 1);
    } else {
      setDrillCompleted(true);
      try {
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  const handleFinishTraining = () => {
    localStorage.setItem('property_rent_fcmobile_trained', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden select-none pointer-events-auto">
      
      {/* Dark Dimmed FC Mobile Training Ground Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Top FC Mobile HUD Bar (Game Quest Bar) */}
      <header className="fixed top-0 inset-x-0 z-[160] bg-slate-950/90 border-b-2 border-amber-500/40 px-4 sm:px-8 py-3 backdrop-blur-xl shadow-2xl flex items-center justify-between">
        
        {/* Game Badge & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-sm border border-amber-400">
            FC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 tracking-wider uppercase font-mono">
                ⚽ OWNER TRAINING CAMP (NEWBIE MODE)
              </span>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Level 1 Rookie
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Complete all 4 drills by tapping the glowing buttons on your screen
            </p>
          </div>
        </div>

        {/* Quest Progress Tracker */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5">
            {drills.map((d, idx) => (
              <div
                key={d.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentDrill 
                    ? 'w-10 bg-gradient-to-r from-amber-400 to-emerald-400' 
                    : idx < currentDrill 
                    ? 'w-4 bg-emerald-500' 
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleFinishTraining}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Skip Training
          </button>
        </div>

      </header>

      {/* Target Element Glowing Cutout & Interactive Tap Pass-through */}
      {targetRect && !drillCompleted && (
        <div
          onClick={handleDrillAction}
          className="fixed cursor-pointer z-[170] rounded-2xl ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.9)] animate-pulse transition-all duration-300"
          style={{
            top: Math.max(10, targetRect.top - 6),
            left: Math.max(10, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* Animated 3D Pointing Hand / Finger (FC Mobile Style) */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none">
            <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,1)]">
              👆
            </span>
            <span className="text-[10px] font-black text-amber-300 bg-black/90 px-2.5 py-0.5 rounded-full border border-amber-400 whitespace-nowrap shadow-xl">
              TAP HERE!
            </span>
          </div>
        </div>
      )}

      {/* Bottom Floating Game Mission Dialog Box */}
      {!drillCompleted ? (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-[180] bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl text-xs space-y-4 animate-slide-up">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {current.badge}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Drill {currentDrill + 1} of 4
              </span>
            </div>

            <button
              onClick={handleDrillAction}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow-md transition active:scale-95"
            >
              <span>Auto-Pass Drill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>{current.title}</span>
            </h3>
            <p className="text-xs text-amber-200 mt-1 font-semibold leading-relaxed">
              👉 {current.instruction}
            </p>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-[11px] text-slate-400">
              {current.tip}
            </p>
          </div>

        </div>
      ) : (
        /* Training Camp Graduation Trophy Screen */
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-500 rounded-3xl p-7 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-500 mx-auto flex items-center justify-center text-slate-950 shadow-2xl shadow-emerald-500/30">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-black uppercase text-amber-400 font-mono tracking-widest">
                🏆 TRAINING CAMP COMPLETED!
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                You Are Ready to Collect Rent!
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                You have mastered adding properties, setting tenant dues, rotating anti-blocking AI calls, and the instant Mark-as-Paid Kill Switch!
              </p>
            </div>

            <button
              onClick={handleFinishTraining}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-900/40 transition active:scale-95"
            >
              Enter Dashboard & Start Managing →
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
