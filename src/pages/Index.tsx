import React, { useState } from 'react';
import { computeStintIntelligence, TelemetryFrame } from '../lib/engine';

export default function GBotIndex() {
  const [sessionActive, setSessionActive] = useState(false);
  const [driverName, setDriverName] = useState('AYUB HUSSAIN');
  const [integrityScore, setIntegrityScore] = useState(96);
  const [ppg, setPpg] = useState(0.042);
  const [advice, setAdvice] = useState('System armed. Ready for telemetry stream ingestion.');

  const handleLaunchSession = () => {
    setSessionActive(true);
    // Simulate live deterministic packet check
    const mockSample: TelemetryFrame[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: i * 0.1,
      speed: 280 + Math.sin(i) * 20,
      throttle: 100,
      brake: i % 15 === 0 ? 20 : 0,
      steeringAngle: Math.cos(i * 0.2) * 5,
      lateralG: 2.5,
      longitudinalG: 1.2,
      rpm: 11500,
      gear: 7
    }));

    const result = computeStintIntelligence(mockSample);
    setIntegrityScore(result.stintIntegrityScore);
    setPpg(result.predictivePerformanceGap);
    setAdvice(result.recommendedAction);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-white font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 px-8 py-4 flex justify-between items-center bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-sm tracking-widest text-cyan-400 font-bold">G-BOT // DIOSCURI CORE</span>
        </div>
        <div className="flex items-center space-x-6 font-mono text-xs text-white/70">
          <span>CALL SIGN: <strong className="text-white">{driverName}</strong></span>
          <span>ENTITY: <strong className="text-cyan-400">AYUBHUSSAIN-NO-ID</strong></span>
          <span className="px-3 py-1 rounded bg-white/5 border border-white/10 text-cyan-300">SECURE LINK ACTIVE</span>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {!sessionActive ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
            <div className="space-y-3">
              <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-500 bg-clip-text text-transparent">
                PREDICTIVE MOTORSPORT INTELLIGENCE
              </h1>
              <p className="text-white/60 max-w-xl mx-auto text-sm">
                Bypass reactive logging. Compute the Predictive Performance Gap, govern neuro-motor variance, and let Gbot Coach command your pitwall.
              </p>
            </div>

            <button
              onClick={handleLaunchSession}
              className="relative group px-10 py-5 bg-cyan-500 text-black font-mono font-bold tracking-widest text-sm rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all duration-300"
            >
              <span className="relative z-10">START / INGEST SESSION</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Live Telemetry Hero Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <p className="text-xs font-mono text-white/50 uppercase">Stint Integrity Index</p>
                <p className="text-4xl font-extrabold font-mono mt-2 text-cyan-400">{integrityScore}%</p>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${integrityScore}%` }} />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <p className="text-xs font-mono text-white/50 uppercase">Predictive Performance Gap (PPG)</p>
                <p className="text-4xl font-extrabold font-mono mt-2 text-white">+{ppg}s</p>
                <p className="text-xs text-white/50 mt-4 font-mono">Estimated delta per lap vs optimal baseline</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <p className="text-xs font-mono text-white/50 uppercase">Chassis Governance Status</p>
                <p className="text-2xl font-bold font-mono mt-3 text-emerald-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block animate-ping" />
                  V_CORE OPTIMAL
                </p>
                <p className="text-xs text-white/50 mt-3 font-mono">Chaos vector within allowable thresholds.</p>
              </div>
            </div>

            {/* Gbot Coach Pitwall Console */}
            <div className="p-8 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h2 className="font-mono text-sm tracking-wider font-bold text-cyan-300">GBOT COACH // ACTIVE PITWALL GUIDANCE</h2>
                </div>
                <span className="text-xs font-mono text-white/40">ANALYTICS ENGINE: LOCKED</span>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 font-mono text-sm text-cyan-100 leading-relaxed">
                <span className="text-cyan-400 font-bold">ENGINEER DIRECTIVE:</span> {advice}
              </div>

              <div className="flex space-x-4 pt-2">
                <button 
                  onClick={() => setSessionActive(false)}
                  className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-xs text-white/80 transition-colors"
                >
                  RESET SESSION
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
