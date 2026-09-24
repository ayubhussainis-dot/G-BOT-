// TelemetryDashboard.tsx
import React, { useCallback } from 'react';
import { useTelemetryRouter } from './useTelemetryRouter';
import { BrakeWidget } from './BrakeWidget';

export const TelemetryDashboard: React.FC = () => {
  const { ingestCSV, streams, isIngesting } = useTelemetryRouter();

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          ingestCSV(text);
        }
      };
      reader.readAsText(file);
    },
    [ingestCSV]
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 font-sans">
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

      {/* Main Grid for Decoupled Telemetry Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Brake Widget listens exclusively to ALI3N_BRAKE stream */}
        <BrakeWidget brakeStream={streams['ALI3N_BRAKE']} />

        {/* Status Card for Ingestion Feed */}
        <div className="p-4 border border-gray-800 rounded-lg bg-gray-950 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="text-gray-400 font-bold mb-2">ACTIVE CHANNELS ROUTED:</div>
            <div className="text-emerald-400 text-lg font-bold">
              {Object.keys(streams).length} Streams Connected
            </div>
          </div>
          <div className="text-[10px] text-gray-500 mt-4">
            Status: {isIngesting ? 'Parsing background worker payload...' : 'Standby for CSV drop'}
          </div>
        </div>
      </div>
    </div>
  );
};
