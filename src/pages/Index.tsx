// G-BOT Autonomous Intelligence Platform - Master Dashboard
// Written by GemInEye

import React, { useState } from 'react';
import { computeStintIntelligence, TelemetryFrame, StintPrediction, variableIdentifierCheck } from '../lib/engine';
import { UploadPanel } from '../components/UploadPanel';
import { GBotConsole } from '../components/GBotConsole';

export default function GBotIndex() {
  const [sessionActive, setSessionActive] = useState(false);
  const [driverName] = useState('AYUB HUSSAIN');
  const [frames, setFrames] = useState<TelemetryFrame[]>([]);
  const [prediction, setPrediction] = useState<StintPrediction | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('No session file loaded');

  const handleTelemetryLoaded = (loadedFrames: TelemetryFrame[], filename: string) => {
    setFrames(loadedFrames);
    setActiveFilename(filename);
    const result = computeStintIntelligence(loadedFrames);
    setPrediction(result);
    setSessionActive(true);
  };

  const handleReset = () => {
    setSessionActive(false);
    setFrames([]);
    setPrediction(null);
    setActiveFilename('No session file loaded');
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-white font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 px-8 py-4 flex justify-between items-center bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-sm tracking-widest text-cyan-400 font-bold">G-BOT // DIOSCURI CORE ({variableIdentifierCheck})</span>
        </div>
        <div className="flex items-center space-x-6 font-mono text-xs text-white/70">
          <span>CALL SIGN: <strong className="text-white">{driverName}</strong></span>
          <span>ENTITY: <strong className="text-cyan-400">AYUBHUSSAIN-NO-ID</strong></span>
          <span className="px-3 py-1 rounded bg-white/5 border border-white/10 text-cyan-300">SECURE LINK ACTIVE</span>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        {!sessionActive ? (
          <div className="space-y-10">
            <div className="flex flex-col items-center justify-center pt-8 text-center space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-500 bg-clip-text text-transparent">
                PREDICTIVE MOTORSPORT INTELLIGENCE
              </h1>
              <p className="text-white/60 max-w-xl mx-auto text-sm font-mono">
                Ingest telemetry traces, compute the Predictive Performance Gap ($PPG$), and command your pitwall via deterministic logic.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <UploadPanel onLoad={handleTelemetryLoaded} />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Session Header Status */}
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/10 p-4 rounded-xl">
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="text-white/40">ACTIVE TRACE:</span>
                <span className="text-cyan-400 font-bold">{activeFilename}</span>
                <span className="text-white/30">({frames.length} frames evaluated)</span>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-xs text-white/80 transition-colors"
              >
                UNLOAD / NEW SESSION
              </button>
            </div>

            {/* Live Telemetry Hero Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <p className="text-xs font-mono text-white/50 uppercase">Stint Integrity Index</p>
                <p className="text-4xl font-extrabold font-mono mt-2 text-cyan-400">
                  {prediction?.stintIntegrityScore}%
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-500" 
                    style={{ width: `${prediction?.stintIntegrityScore || 0}%` }} 
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <p className="text-xs font-mono text-white/50 uppercase">Predictive Performance Gap (PPG)</p>
                <p className="text-4xl font-extrabold font-mono mt-2 text-white">
                  +{prediction?.predictivePerformanceGap}s
                </p>
                <p className="text-xs text-white/50 mt-4 font-mono">Estimated time delta per lap vs optimal baseline</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <p className="text-xs font-mono text-white/50 uppercase">Chassis Governance Status</p>
                <p className="text-xl font-bold font-mono mt-3 text-emerald-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block animate-ping" />
                  V_CORE GOVERNED
                </p>
                <p className="text-xs text-white/50 mt-3 font-mono">Apex Warning: {prediction?.warningApex}</p>
              </div>
            </div>

            {/* GBot Pitwall Console */}
            <GBotConsole frames={frames} prediction={prediction} />
          </div>
        )}
      </main>
    </div>
  );
}
