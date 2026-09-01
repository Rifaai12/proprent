import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, Volume2, CheckCircle2, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

export const LivePhoneSimulatorModal = ({ isOpen, onClose, callData, onCallEnded }) => {
  const [callState, setCallState] = useState('ringing'); // 'ringing', 'connected', 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiScript, setAiScript] = useState('');
  const [transcript, setTranscript] = useState('');
  const [tenantResponse, setTenantResponse] = useState(null);
  const timerRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const audioCtxRef = useRef(null);
  const ringToneOscRef = useRef([]);

  useEffect(() => {
    if (isOpen && callData) {
      setCallState('ringing');
      setCallDuration(0);
      setTenantResponse(null);
      setAiScript(callData.script || 'Hello, this is an automated reminder regarding your property rent dues.');
      setTranscript('');
      startRingtone();
    } else {
      stopRingtone();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      stopRingtone();
      if (synthRef.current) synthRef.current.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, callData]);

  // Generate realistic telephone ringtone using Web Audio API
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // Standard telephone dual-tone
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      // Ring cadence: 1.5s on, 2s off
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.6);
      gain.gain.setValueAtTime(0, ctx.currentTime + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      ringToneOscRef.current = [osc1, osc2];
    } catch (e) {
      console.log('AudioContext not allowed without user interaction yet');
    }
  };

  const stopRingtone = () => {
    ringToneOscRef.current.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    ringToneOscRef.current = [];
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const handleAnswerCall = () => {
    stopRingtone();
    setCallState('connected');

    // Start timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Speak AI voice script (Tamil First, English Next)
    if (synthRef.current && aiScript) {
      setIsSpeaking(true);
      const voices = synthRef.current.getVoices ? synthRef.current.getVoices() : [];
      const tamilVoice = voices.find(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
      const englishVoice = voices.find(v => v.lang.startsWith('en'));

      // If script has multiple paragraphs or lines (Tamil first, English next), speak them
      const parts = aiScript.split('\n\n').filter(p => p.trim());

      if (parts.length > 1) {
        // First part (Tamil)
        const ut1 = new SpeechSynthesisUtterance(parts[0]);
        if (tamilVoice) ut1.voice = tamilVoice;
        ut1.rate = 0.95;
        ut1.pitch = 1.0;

        // Second part (English)
        const ut2 = new SpeechSynthesisUtterance(parts.slice(1).join(' '));
        if (englishVoice) ut2.voice = englishVoice;
        ut2.rate = 1.0;
        ut2.pitch = 1.0;

        ut1.onend = () => {
          synthRef.current.speak(ut2);
        };
        ut2.onend = () => {
          setIsSpeaking(false);
        };
        ut1.onerror = () => setIsSpeaking(false);
        ut2.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(ut1);
      } else {
        const utterance = new SpeechSynthesisUtterance(aiScript);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
      }
    }
  };

  const handleHangup = (customResponse = null) => {
    stopRingtone();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');

    setTimeout(() => {
      onClose();
      if (onCallEnded) {
        onCallEnded({
          duration: callDuration,
          response: customResponse || tenantResponse || 'Call completed normally'
        });
      }
    }, 1500);
  };

  const handleTenantAction = (actionText) => {
    setTenantResponse(actionText);
    if (synthRef.current) synthRef.current.cancel();
    
    // AI acknowledges response
    const ack = new SpeechSynthesisUtterance(`Thank you. We have recorded: ${actionText}. Good day.`);
    ack.onend = () => {
      handleHangup(actionText);
    };
    synthRef.current.speak(ack);
  };

  if (!isOpen || !callData) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      {/* Smartphone Outer Shell */}
      <div className="relative w-full max-w-sm bg-slate-950 rounded-[44px] p-3.5 border-4 border-slate-700 shadow-2xl shadow-indigo-500/20 overflow-hidden">
        
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full flex items-center justify-center z-20 border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
          <div className="w-10 h-1.5 rounded-full bg-slate-800" />
        </div>

        {/* Screen Content */}
        <div className="relative w-full h-[620px] bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 rounded-[36px] pt-12 pb-6 px-5 flex flex-col justify-between overflow-y-auto">
          
          {/* Top Anti-Blocking Badge */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anti-Blocking Caller ID Rotation</span>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-slate-400 font-mono">
                Calling From Rotated DID:
              </p>
              <p className="text-sm font-semibold text-emerald-300 font-mono">
                {callData.callerNumber || '+91 80474 81002'}
              </p>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {callData.callerLabel || 'Line Alpha (Clean Reputation)'}
              </span>
            </div>
          </div>

          {/* Center Call Info */}
          <div className="flex flex-col items-center text-center my-auto">
            {/* Avatar / Pulse circle */}
            <div className="relative my-4">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl ${callState === 'ringing' ? 'animate-ring-pulse' : ''}`}>
                {callData.tenantName ? callData.tenantName[0] : 'T'}
              </div>
              {callState === 'connected' && isSpeaking && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {callData.tenantName || 'Rahul Sharma'}
            </h3>
            <p className="text-sm text-indigo-300">
              {callData.propertyName} • {callData.unitNumber}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Due: {callData.currency || '₹'}{Number(callData.amount || 0).toLocaleString()}
            </p>

            {/* Status & Timer */}
            <div className="mt-4">
              {callState === 'ringing' && (
                <span className="text-amber-400 text-sm font-medium animate-pulse">
                  🔔 Incoming AI Voice Call ringing...
                </span>
              )}
              {callState === 'connected' && (
                <div className="space-y-1">
                  <span className="text-emerald-400 text-xs font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    CALL IN PROGRESS • {formatTime(callDuration)}
                  </span>
                </div>
              )}
              {callState === 'ended' && (
                <span className="text-rose-400 text-sm font-semibold">
                  Call Disconnected
                </span>
              )}
            </div>

            {/* Live Spoken Transcript Preview */}
            {callState === 'connected' && (
              <div className="w-full mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-1">
                  <Mic className="w-3.5 h-3.5" />
                  <span>AI Voice Script (Spoken via Browser Audio):</span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed italic">
                  "{aiScript}"
                </p>
              </div>
            )}

            {/* Tenant Interactive Response Buttons */}
            {callState === 'connected' && (
              <div className="w-full mt-3 space-y-1.5">
                <p className="text-[11px] text-slate-400 font-medium">Tenant Response / Keypad intent:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleTenantAction('I will pay the rent today')}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] text-emerald-300 rounded-lg border border-slate-700 transition"
                  >
                    1. Paying Today
                  </button>
                  <button
                    onClick={() => handleTenantAction('Requested callback from owner')}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] text-amber-300 rounded-lg border border-slate-700 transition"
                  >
                    2. Request Callback
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-2">
            {callState === 'ringing' ? (
              <div className="flex items-center justify-around px-4">
                {/* Decline Button */}
                <button
                  onClick={() => handleHangup('Tenant Declined Call')}
                  className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-rose-400 group"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg transition active:scale-95">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span>Decline</span>
                </button>

                {/* Answer Button */}
                <button
                  onClick={handleAnswerCall}
                  className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 group"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-bounce transition active:scale-95">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span>Answer</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={() => handleHangup('Call ended by user')}
                  className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-rose-400"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 transition active:scale-95">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span>End Call</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
