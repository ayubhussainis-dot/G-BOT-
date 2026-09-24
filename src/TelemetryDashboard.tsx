// TelemetryDashboard.tsx (Updated with Raw-to-Result Live Feed Overlay)
import React, { useCallback, useState, useEffect } from 'react';
import { useTelemetryRouter } from './useTelemetryRouter';

export const TelemetryDashboard: React.FC = () => {
  const { ingestCSV, streams, isIngesting, rawRows, headers } = useTelemetryRouter();
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  // Extract streams safely
  const brakeData = streams['ALI3N_BRAKE']?.data || [];
  const throttleData = streams['ALI3N_THROTTLE']?.data || [];
  const steeringData = streams['ALI3N_STEERING']?.data || [];
  const velocityData = streams['ALI3N_VELOCITY']?.data || [];

  const maxFrames = Math.max(
    brakeData.length,
    throttleData.length,
    steeringData.length,
    velocityData.length,
    rawRows?.length || 0
  );

  // Live playback ticker simulating real-time frame progression
  useEffect(() => {
    if (!isIngesting && maxFrames > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % maxFrames);
      }, 100); // 100ms per frame for a readable live inspection flow
      return () => clearInterval(interval);
    }
  }, [isIngesting, maxFrames]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          ingestCSV(text);
          setCurrentFrameIndex(0);
        }
      };
      reader.readAsText(file);
    },
    [ingestCSV]
  );

  // Current row raw values and corresponding analyzed results
  const currentRowData = rawRows && rawRows[currentFrameIndex] ? rawRows[currentFrameIndex] : [];
  const liveBrake = brakeData[currentFrameIndex] ?? 0;
  const liveThrottle = throttleData[currentFrameIndex] ?? 0;
  const liveSteering = steeringData[currentFrameIndex] ?? 0;
  const liveVelocity = velocityData[currentFrameIndex] ?? 0;

  return (
    <div className="relative min-h-screen bg-black text-gray-100 p-6 font-sans overflow-hidden">
      {/* BACKGROUND: The raw data table blurred out */}
      <div className={`transition-all duration-300 ${maxFrames > 0 ? 'filter blur-sm opacity-20 pointer-events-none' : ''}`}>
        <header className="flex justify-between items-center pb-6 border-b border-gray-800 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight font-mono text-white">
              GBOT CORE // DETERMINISTIC TELEMETRY ROUTER
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Zero-Lag T-IX Matrix Stream Parser (Standalone Worker Active)
            </p>
          </div>

          <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-mono text-xs px-4 py-2 rounded-lg border border-gray-700 transition-colors shadow-lg">
            {isIngesting ? 'PROCESSING STREAM...' : 'UPLOAD TELEMETRY CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isIngesting}
              className="hidden"
            />
          </label>
        </header>

        <div className="p-8 border border-gray-800 rounded-lg bg-gray-950 font-mono text-xs text-center text-gray-500">
          {isIngesting ? 'Ingesting telemetry through background Web Worker...' : 'Upload a CSV file to initialize live telemetry feed.'}
        </div>
      </div>

      {/* FOREGROUND: The semi-transparent structured HUD overlay */}
      {maxFrames > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-gray-950/95 border border-emerald-500/50 rounded-2xl p-6 shadow-[0_0_60px_rgba(16,185,129,0.2)] text-white font-mono">
            
            {/* HUD Header */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-sm font-bold tracking-widest text-emerald-400">
                  LIVE FRAME INSPECTOR // FRAME #{currentFrameIndex + 1} OF {maxFrames}
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                LIVE SYNC ACTIVE
              </span>
            </div>

            {/* SECTION 1: THE ORIGINAL RAW CSV DATA */}
            <div className="mb-4 bg-gray-900/60 border border-gray-800 p-4 rounded-xl">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">
                1. Raw CSV Source Data (Direct from File)
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-28 overflow-y-auto text-[11px] pr-2">
                {headers && headers.length > 0 ? (
                  headers.map((head, idx) => (
                    <div key={idx} className="bg-black/50 p-1.5 rounded border border-gray-800/80">
                      <span className="text-gray-500 block text-[9px] truncate">{head}</span>
                      <span className="text-emerald-300 font-bold truncate block">
                        {currentRowData[idx] !== undefined ? currentRowData[idx] : 'N/A'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Loading raw stream headers...</div>
                )}
              </div>
            </div>

            {/* SECTION 2: THE GBOT CORE ANALYTICAL RESULT */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl mb-4">
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-3 font-bold">
                2. Gbot Core Deterministic Analysis Result
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">Velocity</div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {isNaN(liveVelocity) ? '0.0' : liveVelocity.toFixed(1)} <span className="text-[10px] text-gray-500">KM/H</span>
                  </div>
                </div>

                <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">Steering</div>
                  <div className="text-xl font-extrabold text-blue-400 mt-1">
                    {liveSteering.toFixed(2)}°
                  </div>
                </div>

                <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">Throttle</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">
                    {(liveThrottle * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">Brake</div>
                  <div className="text-xl font-extrabold text-red-500 mt-1">
                    {(liveBrake * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Progress / Timeline Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>PROGRESSION FEED</span>
                <span>{Math.round(((currentFrameIndex + 1) / maxFrames) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                <div
                  className="bg-emerald-500 h-full transition-all duration-75"
                  style={{ width: `${((currentFrameIndex + 1) / maxFrames) * 100}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
