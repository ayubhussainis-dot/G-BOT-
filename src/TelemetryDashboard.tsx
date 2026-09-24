// TelemetryDashboard.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { useTelemetryRouter } from './useTelemetryRouter';

export const TelemetryDashboard: React.FC = () => {
  const { ingestFileParallel, isReady, ingestTimeMs, streams, headers, liveRows } = useTelemetryRouter();
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  const maxFrames = liveRows?.length || 0;

  // Cycle through the first chunk frames smoothly for live review
  useEffect(() => {
    if (isReady && maxFrames > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % maxFrames);
      }, 100); 
      return () => clearInterval(interval);
    }
  }, [isReady, maxFrames]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      ingestFileParallel(file);
      setCurrentFrameIndex(0);
    }
  }, [ingestFileParallel]);

  const liveBrake = streams['ALI3N_BRAKE']?.data[currentFrameIndex] ?? 0;
  const liveVelocity = streams['ALI3N_VELOCITY']?.data[currentFrameIndex] ?? 0;

  return (
    <div className="relative min-h-screen bg-black text-gray-100 p-6 font-sans overflow-hidden">
      
      {/* BACKGROUND: Blurs out once ready */}
      <div className={`transition-all duration-300 ${isReady ? 'filter blur-sm opacity-20 pointer-events-none' : ''}`}>
        <header className="flex justify-between items-center pb-6 border-b border-gray-800 mb-8">
          <div>
            <h1 className="text-xl font-bold font-mono text-white">GBOT CORE // MULTI-THREADED ROUTER</h1>
            <p className="text-xs text-gray-500 font-mono mt-1">Zero-Lag T-IX Matrix Stream Parser</p>
          </div>
          <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-mono text-xs px-4 py-2 rounded-lg border border-gray-700 shadow-lg">
            UPLOAD TELEMETRY CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </header>

        {/* STATUS CARD */}
        <div className="p-8 border border-gray-800 rounded-lg bg-gray-950 font-mono text-xs text-center">
          {ingestTimeMs !== null ? (
            <div className="text-emerald-400 mb-2 font-bold text-lg">
              FILE INGESTED IN: {ingestTimeMs} ms
            </div>
          ) : (
            <div className="text-gray-500">Standby for CSV drop...</div>
          )}
          <div className="text-gray-400 mt-2">
            {isReady ? 'First chunk processed. HUD Active.' : 'Upload a CSV to initialize 4-way parallel calculators.'}
          </div>
        </div>
      </div>

      {/* FOREGROUND: The semi-transparent HUD showing the first chunk instantly */}
      {isReady && maxFrames > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-gray-950/95 border border-emerald-500/50 rounded-2xl p-6 text-white font-mono shadow-[0_0_60px_rgba(16,185,129,0.2)]">
            
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <div className="text-emerald-400 font-bold">
                LIVE FRAME INSPECTOR // FRAME #{currentFrameIndex + 1} OF {maxFrames} (CHUNK 1 ACTIVE)
              </div>
              <span className="text-xs px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                PARALLEL SYNC
              </span>
            </div>

            {/* RAW DATA VIEW */}
            <div className="mb-4 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase mb-2 font-bold">1. Raw CSV Source Data (First Chunk)</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] max-h-32 overflow-y-auto">
                {headers && headers.length > 0 ? (
                  headers.map((head, idx) => (
                    <div key={idx} className="bg-black/50 p-1.5 rounded border border-gray-800/80">
                      <span className="text-gray-500 block text-[9px] truncate">{head}</span>
                      <span className="text-emerald-300 font-bold truncate block">
                        {liveRows[currentFrameIndex]?.[idx] ?? 'N/A'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Loading headers...</div>
                )}
              </div>
            </div>

            {/* RESULT VIEW */}
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 text-center grid grid-cols-2 gap-4">
               <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase">Velocity</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{liveVelocity.toFixed(1)} <span className="text-xs text-gray-500">KM/H</span></div>
               </div>
               <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase">Brake Pressure</div>
                  <div className="text-2xl font-extrabold text-red-500 mt-1">{(liveBrake * 100).toFixed(1)}%</div>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
