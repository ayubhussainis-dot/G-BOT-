// G-BOT — Canonical Application Entry
// Step 1: establish G-BOT identity and truthful session language.

import React, { useEffect, useState } from 'react';
import {
  computeStintIntelligence,
  TelemetryFrame,
  StintPrediction,
  variableIdentifierCheck,
} from '../lib/engine';
import { UploadPanel } from '../components/UploadPanel';
import { GBotConsole } from '../components/GBotConsole';

interface Account {
  name: string;
  code: string;
}

export default function GBotIndex() {
  const [authStep, setAuthStep] = useState<'welcome' | 'register' | 'login'>('welcome');
  const [racerCode, setRacerCode] = useState('');
  const [racerName, setRacerName] = useState('');

  const [registeredAccounts, setRegisteredAccounts] = useState<Record<string, Account>>(() => {
    try {
      const saved = localStorage.getItem('gbot_accounts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [frames, setFrames] = useState<TelemetryFrame[]>([]);
  const [prediction, setPrediction] = useState<StintPrediction | null>(null);
  const [activeFilename, setActiveFilename] = useState('No session file loaded');
  const [activeView, setActiveView] = useState<'inspector' | 'cockpit'>('inspector');

  const [inputName, setInputName] = useState('');
  const [inputCode, setInputCode] = useState('');

  const [loginName, setLoginName] = useState('');
  const [loginCode, setLoginCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('gbot_accounts', JSON.stringify(registeredAccounts));
    } catch (error) {
      console.error('Failed to save G-BOT accounts', error);
    }
  }, [registeredAccounts]);

  const handleRegisterSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!inputName.trim() || !inputCode.trim()) {
      setAuthError('Please fill in both Racer Name and Racer Code.');
      return;
    }

    const name = inputName.trim().toUpperCase();
    const code = inputCode.trim().toUpperCase();

    const updatedAccounts = {
      ...registeredAccounts,
      [name]: { name, code },
    };

    setRegisteredAccounts(updatedAccounts);
    setRacerName(name);
    setRacerCode(code);
    setAuthError('');
  };

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!loginName.trim() || !loginCode.trim()) {
      setAuthError('Please provide both Racer Name and Racer Code.');
      return;
    }

    const name = loginName.trim().toUpperCase();
    const code = loginCode.trim().toUpperCase();

    const account = registeredAccounts[name];

    if (account && account.code === code) {
      setRacerName(account.name);
      setRacerCode(account.code);
      setAuthError('');
    } else {
      setAuthError('Invalid Racer Name or Racer Code.');
    }
  };

  const handleTelemetryLoaded = (
    loadedFrames: TelemetryFrame[],
    filename: string,
  ) => {
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
        <div className="max-w-md w-full p-8 rounded-2xl bg-black/90 border border-cyan-500/40 backdrop-blur-2xl space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-fadeIn">

          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
              G-BOT // AUTHENTICATION GATE
            </span>
          </div>

          {authStep === 'welcome' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  SECURE RACER ACCESS
                </h1>

                <p className="text-xs text-white/50">
                  Initialize your G-BOT driver profile to access session intelligence.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAuthStep('register');
                    setAuthError('');
                  }}
                  className="w-full py-3.5 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  CREATE NEW ACCOUNT
                </button>

                <button
                  onClick={() => {
                    setAuthStep('login');
                    setAuthError('');
                  }}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  SIGN IN WITH CREDENTIALS
                </button>
              </div>
            </div>
          )}

          {authStep === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">
                  Create Account
                </h2>

                <p className="text-xs text-white/50">
                  Set up your G-BOT racer profile.
                </p>
              </div>

              {authError && (
                <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/30">
                  {authError}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Racer Name / Call Sign
                </label>

                <input
                  type="text"
                  value={inputName}
                  onChange={(event) => setInputName(event.target.value)}
                  placeholder="e.g. Driver 01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Racer Code / Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputCode}
                    onChange={(event) => setInputCode(event.target.value)}
                    placeholder="Enter secure code..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-16 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase px-2 py-1 bg-white/5 rounded border border-white/10"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
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
                <h2 className="text-lg font-bold text-white">
                  Racer Sign In
                </h2>

                <p className="text-xs text-white/50">
                  Enter your G-BOT racer credentials.
                </p>
              </div>

              {authError && (
                <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/30">
                  {authError}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Racer Name / Call Sign
                </label>

                <input
                  type="text"
                  value={loginName}
                  onChange={(event) => setLoginName(event.target.value)}
                  placeholder="Enter racer name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Racer Code / Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginCode}
                    onChange={(event) => setLoginCode(event.target.value)}
                    placeholder="Enter code..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-16 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase px-2 py-1 bg-white/5 rounded border border-white/10"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
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
                  ENTER G-BOT
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

      <header className="border-b border-white/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />

          <span className="text-xs tracking-widest text-cyan-400 font-bold">
            G-BOT // INTELLIGENCE CORE ({variableIdentifierCheck})
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs text-white/70">
          <span>
            RACER:{' '}
            <strong className="text-cyan-300">
              {racerName} ({racerCode})
            </strong>
          </span>

          <button
            onClick={() => {
              setRacerName('');
              setRacerCode('');
              handleReset();
            }}
            className="text-[10px] text-white/50 hover:text-cyan-400 underline transition-colors"
          >
            LOGOUT
          </button>

          <span className="hidden md:inline text-white/20">|</span>

          <span className="px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px]">
            SESSION LINK ACTIVE
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {!sessionActive ? (
          <div className="space-y-10 animate-fadeIn">

            <div className="flex flex-col items-center justify-center pt-8 text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-500 bg-clip-text text-transparent">
                G-BOT MOTORSPORT INTELLIGENCE
              </h1>

              <p className="text-white/60 max-w-xl mx-auto text-xs md:text-sm">
                Import a telemetry session and begin evidence-based driver and vehicle analysis.
              </p>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className="px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-[10px]">
                  MEASURED DATA
                </span>

                <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-[10px]">
                  DERIVED ANALYSIS
                </span>

                <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-[10px]">
                  EVIDENCE-BASED COACHING
                </span>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <UploadPanel onLoad={handleTelemetryLoaded} />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">

            <div className="flex flex-wrap justify-between items-center gap-3 bg-white/[0.02] border border-white/10 p-4 rounded-xl text-xs">

              <div className="flex items-center space-x-2 truncate">
                <span className="text-white/40">
                  ACTIVE SESSION:
                </span>

                <span className="text-cyan-400 font-bold truncate max-w-[180px] md:max-w-md">
                  {activeFilename}
                </span>

                <span className="text-white/30 hidden sm:inline">
                  ({frames.length} frames)
                </span>
              </div>

              <div className="flex items-center space-x-3">

                <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">

                  <button
                    onClick={() => setActiveView('inspector')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      activeView === 'inspector'
                        ? 'bg-cyan-500 text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    1. SESSION TELEMETRY
                  </button>

                  <button
                    onClick={() => setActiveView('cockpit')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      activeView === 'cockpit'
                        ? 'bg-cyan-500 text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    2. G-BOT COACH
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

            {activeView === 'inspector' && (
              <div className="space-y-6 animate-fadeIn">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                      G-BOT // SESSION IMPORT
                    </p>

                    <h2 className="text-lg font-extrabold text-white tracking-wider uppercase">
                      Telemetry Session Inspector
                    </h2>

                    <p className="text-xs text-white/40 mt-1">
                      Values shown below originate from the loaded telemetry frames.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveView('cockpit')}
                    className="px-5 py-2.5 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center space-x-2"
                  >
                    <span>OPEN G-BOT COACH</span>
                    <span>→</span>
                  </button>

                </div>

                <div className="border border-cyan-500/30 rounded-2xl bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl">

                  <div className="overflow-x-auto max-h-[550px] scrollbar-thin scrollbar-thumb-cyan-500/20">

                    <table className="w-full text-left border-collapse text-xs">

                      <thead className="bg-black text-cyan-400 font-mono sticky top-0 border-b border-cyan-500/40 z-10">
                        <tr>
                          <th className="p-4">FRAME ID</th>
                          <th className="p-4">SPEED (KM/H)</th>
                          <th className="p-4">THROTTLE (%)</th>
                          <th className="p-4">BRAKE (%)</th>
                          <th className="p-4">STEERING ANGLE</th>
                          <th className="p-4">DATA STATE</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-black/40 font-mono">

                        {frames.map((frame, index) => {

                          const neonRowColors = [
                            'bg-[#1a1a00] text-yellow-300 border-l-4 border-yellow-400',
                            'bg-[#261100] text-orange-300 border-l-4 border-orange-500',
                            'bg-[#001a26] text-cyan-300 border-l-4 border-cyan-400',
                            'bg-[#260000] text-red-300 border-l-4 border-red-500',
                          ];

                          const activeNeonStyle =
                            neonRowColors[index % neonRowColors.length];

                          return (
                            <tr
                              key={index}
                              className={`${activeNeonStyle} hover:brightness-125 transition-all`}
                            >
                              <td className="p-4 font-bold opacity-90">
                                #{index + 1}
                              </td>

                              <td className="p-4 font-extrabold">
                                {frame.speed.toFixed(1)} km/h
                              </td>

                              <td className="p-4 font-semibold">
                                {frame.throttle.toFixed(1)}%
                              </td>

                              <td className="p-4 font-semibold">
                                {frame.brake.toFixed(1)}%
                              </td>

                              <td className="p-4 font-semibold">
                                {frame.steeringAngle.toFixed(2)}°
                              </td>

                              <td className="p-4">
                                <span className="text-[10px] px-2.5 py-1 rounded bg-black/80 border border-white/20 uppercase tracking-widest font-bold text-white shadow">
                                  TELEMETRY
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

            {activeView === 'cockpit' && (
              <div className="space-y-8 animate-fadeIn">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">
                    <p className="text-xs text-white/50 uppercase">
                      Session Integrity
                    </p>

                    <p className="text-4xl font-extrabold mt-2 text-cyan-400">
                      {prediction?.stintIntegrityScore}%
                    </p>

                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-500"
                        style={{
                          width: `${prediction?.stintIntegrityScore || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">

                    <p className="text-xs text-white/50 uppercase">
                      PPG
                    </p>

                    <p className="text-4xl font-extrabold mt-2 text-white">
                      {prediction?.predictivePerformanceGap !== undefined
                        ? `+${prediction.predictivePerformanceGap}s`
                        : '—'}
                    </p>

                    <p className="text-xs text-white/50 mt-4">
                      Current engine output. Methodology will be hardened in the intelligence-engine stage.
                    </p>

                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">

                    <p className="text-xs text-white/50 uppercase">
                      Data Authority
                    </p>

                    <p className="text-xl font-bold mt-3 text-emerald-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block" />
                      LOADED TELEMETRY
                    </p>

                    <p className="text-xs text-white/50 mt-3">
                      {frames.length} telemetry frames available to the current analysis path.
                    </p>

                  </div>

                </div>

                <GBotConsole
                  frames={frames}
                  prediction={prediction}
                  driverName={racerName}
                />

              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
