// TelemetryDashboard.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { useTelemetryRouter } from './useTelemetryRouter';

export const TelemetryDashboard: React.FC = () => {
  const { ingestFileParallel, isIngesting, ingestTimeMs, parseProgress, streams, headers, rawRows } = useTelemetryRouter();
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  const maxFrames = rawRows?.length || 0;

  useEffect(() => {
    if (!isIngesting && maxFrames > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % maxFrames);
      }, 100); 
      return () => clearInterval(interval);
    }
  }, [isIngesting, maxFrames]);

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
      
      {/* BACKGROUND */}
      <div className={`transition-all duration-300 ${maxFrames > 0 ? 'filter blur-sm opacity-20 pointer-events-none' : ''}`}>
        <header className="flex justify-between items-center pb-6 border-b border-gray-800 mb-8">
          <div>
            <h1 className="text-xl font-bold font-mono text-white">GBOT CORE // MULTI-THREADED ROUTER</h1>
          </div>
          <label className="cursor-pointer bg-gray-900 text-white font-mono text-xs px-4 py-2 rounded-lg border border-gray-700">
            UPLOAD TELEMETRY CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </header>

        {/* STATUS CARD */}
        <div className="p-8 border border-gray-800 rounded-lg bg-gray-950 font-mono text-xs text-center">
          {ingestTimeMs !== null && (
            <div className="text-emerald-400 mb-2 font-bold text-lg">
              FILE INGESTED IN: {ingestTimeMs} ms
            </div>
          )}
          {isIngesting ? (
            <div className="text-blue-400">
              <p>4 PARALLEL CALCULATORS ACTIVE...</p>
              <p className="mt-2">Processing Progress: {parseProgress}%</p>
            </div>
          ) : (
            <div className="text-gray-500">Upload a CSV to initialize 4-way parallel telemetry feed.</div>
          )}
        </div>
      </div>

      {/* FOREGROUND HUD */}
      {maxFrames > 0 && !isIngesting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-gray-950/95 border border-emerald-500/50 rounded-2xl p-6 text-white font-mono">
            
            <div className="text-emerald-400 font-bold mb-4">
              LIVE FRAME INSPECTOR // FRAME #{currentFrameIndex + 1} OF {maxFrames}
            </div>

            {/* RAW DATA VIEW */}
            <div className="mb-4 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase mb-2 font-bold">1. Raw CSV Source Data</div>
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                {headers.slice(0, 8).map((head, idx) => (
                  <div key={idx} className="bg-black/50 p-1.5 rounded border border-gray-800/80">
                    <span className="text-gray-500 block text-[9px] truncate">{head}</span>
                    <span className="text-emerald-300 font-bold truncate block">
                      {rawRows[currentFrameIndex]?.[idx] ?? 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RESULT VIEW */}
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 text-center grid grid-cols-2 gap-4">
               <div>
                  <div className="text-[10px] text-gray-400 uppercase">Velocity</div>
                  <div className="text-2xl font-extrabold text-white">{liveVelocity.toFixed(1)} KM/H</div>
               </div>
               <div>
                  <div className="text-[10px] text-gray-400 uppercase">Brake</div>
                  <div className="text-2xl font-extrabold text-red-500">{(liveBrake * 100).toFixed(1)}%</div>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
