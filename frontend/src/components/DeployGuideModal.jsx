import React from 'react';
import { BookOpen, Server, PhoneForwarded, MessageSquare, Bot, CheckCircle2, ArrowRight, X, ExternalLink } from 'lucide-react';

export const DeployGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-xs text-slate-300">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Complete Production Deployment & Telecom Setup Guide
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Step-by-step instructions to deploy your Property Rent app and connect real phone calling lines
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Carousel / Cards */}
        <div className="space-y-4">
          
          {/* Step 1: Web Hosting */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Server className="w-4 h-4" />
              <span>Step 1: Deploy Full-Stack App (Backend & Frontend)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              You can deploy this entire application on any modern cloud hosting service in less than 5 minutes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <strong className="text-white block">Option A: Render.com / Railway (Recommended)</strong>
                <p className="text-slate-400 mt-0.5">
                  Push this folder to GitHub. Create a "Web Service" pointing to `backend/` (`npm start`) and a "Static Site" pointing to `frontend/` (`npm run build`).
                </p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <strong className="text-white block">Option B: Single VPS (Ubuntu / Hostinger)</strong>
                <p className="text-slate-400 mt-0.5">
                  Install Node.js 20+, clone repo, run backend using `pm2 start src/server.js`, and serve frontend build using Nginx.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Anti-Blocking Numbers */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <PhoneForwarded className="w-4 h-4" />
              <span>Step 2: Get 3-5 Anti-Blocking Outbound Numbers (DID Pool)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              To prevent tenants and spam apps (like Truecaller) from blocking your calls, acquire a pool of 3 to 5 virtual outbound numbers:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li><strong>Twilio / Exotel / Tata Tele:</strong> Buy 3-5 virtual phone numbers in your region (costs approx $1 / ₹80 per number per month).</li>
              <li>Add these numbers directly into the <strong>"Caller ID Pool"</strong> tab in this app.</li>
              <li>The built-in rotation engine will automatically switch numbers for each successive call to the same tenant.</li>
            </ul>
          </div>

          {/* Step 3: Meta WhatsApp Cloud API */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>Step 3: Setup Meta WhatsApp Cloud API (Free 1,000 Messages/Month)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>Visit <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">developers.facebook.com</a> and create a WhatsApp Business App.</li>
              <li>Copy your <strong>Phone Number ID</strong> and <strong>Permanent System Access Token</strong>.</li>
              <li>Paste them into the <strong>Settings</strong> dialog in this app.</li>
              <li>Your automated WhatsApp payment reminders and receipts are now live!</li>
            </ol>
          </div>

          {/* Step 4: AI Voice Calling Agent */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
              <Bot className="w-4 h-4" />
              <span>Step 4: Connect AI Voice Calling Engine (Twilio / Vapi.ai)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              For ultra-realistic conversational calls (where the AI speaks to the tenant and listens to their payment promises):
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li><strong>Vapi.ai / Retell AI / Bland.ai:</strong> Create a free account, generate an API key, and select a natural human voice.</li>
              <li>Enter your API key into this app's <strong>Settings</strong> panel and switch off "Simulation Mode".</li>
              <li>When the scheduler runs, it will initiate real outbound AI phone calls directly to tenants' mobiles!</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            During local development, you can test everything freely in <strong>Simulation Mode</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
          >
            Got it, Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
