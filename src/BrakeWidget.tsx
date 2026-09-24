import React from 'react';
import { TelemetryState } from './useTelemetryRouter';

interface BrakeWidgetProps {
  brakeStream?: TelemetryState[string];
}

export const BrakeWidget: React.FC<BrakeWidgetProps> = React.memo(({ brakeStream }) => {
  if (!brakeStream || !brakeStream.data.length) {
    return (
      <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 text-gray-500 font-mono text-sm">
        AWAITING BRAKE STREAM...
      </div>
    );
  }

  const { tag, data } = brakeStream;
  const latestValue = data[data.length - 1];
  const peakBrake = Math.max(...data);
  const avgBrake = data.reduce((a, b) => a + b, 0) / data.length;

  return (
    <div className="p-4 border border-red-500/30 rounded-lg bg-gray-950 text-white shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-sm font-bold tracking-wider text-red-400 font-mono">
            BRAKE TELEMETRY (ALI3N_BRAKE)
          </h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-red-950/80 text-red-300 border border-red-800/50 rounded">
          T-IX: {tag}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-4 font-mono">
        <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
          <div className="text-[10px] text-gray-400 uppercase">Current</div>
          <div className="text-lg font-bold text-red-400 font-mono">
            {(latestValue * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
          <div className="text-[10px] text-gray-400 uppercase">Peak Pressure</div>
          <div className="text-lg font-bold text-white font-mono">
            {(peakBrake * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
          <div className="text-[10px] text-gray-400 uppercase">Lap Duty Cycle</div>
          <div className="text-lg font-bold text-gray-300 font-mono">
            {(avgBrake * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Pressure Gauge */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden border border-gray-800">
          <div
            className="bg-red-500 h-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            style={{ width: `${Math.min(100, Math.max(0, latestValue * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
});
