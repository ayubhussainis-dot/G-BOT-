// G-BOT Autonomous Intelligence Platform - Master Dashboard
// Written by GemInEye

import React, { useState } from 'react';
import { computeStintIntelligence, TelemetryFrame, StintPrediction, variableIdentifierCheck } from '../lib/engine';
import { UploadPanel } from '../components/UploadPanel';
import { GBotConsole } from '../components/GBotConsole';

export default function GBotIndex() {
  const [authStep, setAuthStep] = useState<'welcome' | 'register' | 'login'>('welcome');
  const [racerCode, setRacerCode] = useState<string>('');
  const [racerName, setRacerName] = useState<string>('');
  const [registeredAccounts, setRegisteredAccounts] = useState<Record<string, { name: string; code: string }>>({});
  
  const [sessionActive, setSessionActive] = useState(false);
  const [frames, setFrames] = useState<TelemetryFrame[]>([]);
  const [prediction, setPrediction] = useState<StintPrediction | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('No session file loaded');
  const [activeView, setActiveView] = useState<'inspector' | 'cockpit'>('inspector');

  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [authError, setAuthError] = useState('');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !inputName.trim()) {
      setAuthError('Please fill in both Racer Code and Racer Name.');
      return;
    }
    const code = inputCode.trim().toUpperCase();
    const name = inputName.trim().toUpperCase();
    setRegisteredAccounts(prev => ({ ...prev, [code]: { code, name } }));
    setRacerCode(code);
    setRacerName(name);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = loginCode.trim().toUpperCase();
    const account = registeredAccounts[code];
    if (account) {
      setRacerCode(account.code);
      setRacerName(account.name);
    } else {
      setAuthError('Racer Code not found. Please create an account.');
    }
  };

  const handleTelemetryLoaded = (loadedFrames: TelemetryFrame[], filename: string) => {
    setFrames(loadedFrames);
    setActiveFilename(filename);
    const result = computeStintIntelligence(loadedFrames);
    setPrediction(result);
    setSessionActive(true);
    setActiveView('inspector');
  };

  const handleReset = () => {
    setSessionActive(false);
    setFrames([]);
    setPrediction(null);
    setActiveFilename('No session file loaded');
    setActiveView('inspector');
  };

  if (!racerName) {
    return (
      <div className="min-h-screen bg-[#06070B] text-white flex items-center justify-center font-mono px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-black/80 border border-cyan-500/40 backdrop-blur-2xl space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">G-BOT // AUTHENTICATION GATE</span>
          </div>

          {authStep === 'welcome' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">SECURE RACER ACCESS</h1>
                <p className="text-xs text-white/50">Initialize your telemetry profile to access the Dioscuri analytics grid.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { setAuthStep('register'); setAuthError(''); }}
                  className="w-full py-3.5 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  CREATE NEW ACCOUNT
                </button>
                <button
                  onClick={() => { setAuthStep('login'); setAuthError(''); }}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  SIGN IN WITH RACER CODE
                </button>
              </div>
            </div>
          )}

          {authStep === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Create Account</h2>
                <p className="text-xs text-white/50">Set up your unique racer credentials.</p>
              </div>
              {authError && <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/30">{authError}</p>}
              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Racer Code (e.g. MAXV, LEWIS)</label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. MAXV"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Racer Name / Username (e.g. Max Verstappen)</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Max Verstappen"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthStep('welcome')}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 text-xs rounded-xl transition-colors"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  COMPLETE REGISTRATION
                </button>
              </div>
            </form>
          )}

          {authStep === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Racer Sign In</h2>
                <p className="text-xs text-white/50">Enter your assigned racer code.</p>
              </div>
              {authError && <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/30">{authError}</p>}
              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Racer Code</label>
                <input
                  type="text"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="e.g. MAXV"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthStep('welcome')}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 text-xs rounded-xl transition-colors"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  ENTER COCKPIT
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070B] text-white font-sans antialiased selection:bg-cyan-500 selection:text-black font-mono">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs tracking-widest text-cyan-400 font-bold">G-BOT // DIOSCURI CORE ({variableIdentifierCheck})</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-white/70">
          <span>RACER: <strong className="text-cyan-300">{racerName} ({racerCode})</strong></span>
          <button 
            onClick={() => { setRacerName(''); setRacerCode(''); }} 
            className="text-[10px] text-white/50 hover:text-cyan-400 underline transition-colors"
          >
            LOGOUT
          </button>
          <span className="hidden md:inline text-white/20">|</span>
          <span className="hidden md:inline">ENTITY: <strong className="text-white/80">AYUBHUSSAIN-NO-ID</strong></span>
          <span className="px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px]">SECURE LINK ACTIVE</span>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {!sessionActive ? (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col items-center justify-center pt-8 text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-500 bg-clip-text text-transparent">
                PREDICTIVE MOTORSPORT INTELLIGENCE
              </h1>
              <p className="text-white/60 max-w-xl mx-auto text-xs md:text-sm">
                Ingest telemetry traces, inspect color-coded CSV telemetry sequences, and command your pitwall.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <UploadPanel onLoad={handleTelemetryLoaded} />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Session Header Status & View Switcher Tabs */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white/[0.02] border border-white/10 p-4 rounded-xl text-xs">
              <div className="flex items-center space-x-2 truncate">
                <span className="text-white/40">ACTIVE TRACE:</span>
                <span className="text-cyan-400 font-bold truncate max-w-[180px] md:max-w-md">{activeFilename}</span>
                <span className="text-white/30 hidden sm:inline">({frames.length} frames)</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setActiveView('inspector')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      activeView === 'inspector' ? 'bg-cyan-500 text-black shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    1. CSV TELEMETRY INSPECTOR
                  </button>
                  <button
                    onClick={() => setActiveView('cockpit')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      activeView === 'cockpit' ? 'bg-cyan-500 text-black shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    2. PITWALL COCKPIT & COACH
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors text-[10px]"
                >
                  NEW SESSION
                </button>
              </div>
            </div>

            {/* FULL-SCREEN VIEW 1: COLOR-CODED CSV TELEMETRY INSPECTOR */}
            {activeView === 'inspector' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-white tracking-wider uppercase">Stage II // Raw Telemetry Sequence Inspector</h2>
                    <p className="text-xs text-white/50">Full-screen color-coded trace breakdown parsed from the uploaded CSV stream.</p>
                  </div>
                  <button
                    onClick={() => setActiveView('cockpit')}
                    className="px-5 py-2.5 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center space-x-2"
                  >
                    <span>PROCEED TO PITWALL COCKPIT</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Color-Coded Data Grid */}
                <div className="border border-cyan-500/30 rounded-2xl bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto max-h-[550px] scrollbar-thin scrollbar-thumb-cyan-500/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-cyan-950/40 text-cyan-300 font-mono sticky top-0 border-b border-cyan-500/30">
                        <tr>
                          <th className="p-4">FRAME ID</th>
                          <th className="p-4">SPEED (KM/H)</th>
                          <th className="p-4">THROTTLE (%)</th>
                          <th className="p-4">BRAKE (%)</th>
                          <th className="p-4">STEERING ANGLE</th>
                          <th className="p-4">DIAGNOSTIC STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {frames.map((frame, i) => {
                          const isHighSpeed = frame.speed > 250;
                          const isHardBraking = frame.brake > 50;
                          const isFullThrottle = frame.throttle > 90;

                          return (
                            <tr key={i} className="hover:bg-cyan-500/[0.04] transition-colors">
                              <td className="p-4 text-white/40">#{i + 1}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded font-bold ${
                                  isHighSpeed ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/80'
                                }`}>
                                  {frame.speed.toFixed(1)} km/h
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded font-bold ${
                                  isFullThrottle ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/60'
                                }`}>
                                  {frame.throttle.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded font-bold ${
                                  isHardBraking ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-white/60'
                                }`}>
                                  {frame.brake.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-4 text-cyan-200">
                                {frame.steeringAngle.toFixed(2)}°
                              </td>
                              <td className="p-4">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                                  {isHardBraking ? 'HEAVY BRAKING ZONE' : isFullThrottle ? 'FULL THROTTLE STINT' : 'STABLE TRANSITION'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* FULL-SCREEN VIEW 2: PITWALL COCKPIT & COACH */}
            {activeView === 'cockpit' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">
                    <p className="text-xs text-white/50 uppercase">Stint Integrity Index</p>
                    <p className="text-4xl font-extrabold mt-2 text-cyan-400">
                      {prediction?.stintIntegrityScore}%
                    </p>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="bg-cyan-400 h-full transition-all duration-500" 
                        style={{ width: `${prediction?.stintIntegrityScore || 0}%` }} 
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">
                    <p className="text-xs text-white/50 uppercase">Predictive Performance Gap (PPG)</p>
                    <p className="text-4xl font-extrabold mt-2 text-white">
                      +{prediction?.predictivePerformanceGap}s
                    </p>
                    <p className="text-xs text-white/50 mt-4">Estimated time delta per lap vs optimal baseline</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">
                    <p className="text-xs text-white/50 uppercase">Chassis Governance Status</p>
                    <p className="text-xl font-bold mt-3 text-emerald-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block animate-ping" />
                      V_CORE GOVERNED
                    </p>
                    <p className="text-xs text-white/50 mt-3">Apex Warning: {prediction?.warningApex}</p>
                  </div>
                </div>

                <GBotConsole frames={frames} prediction={prediction} driverName={racerName} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
