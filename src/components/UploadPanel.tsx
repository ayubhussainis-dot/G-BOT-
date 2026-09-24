// G-BOT Telemetry Upload & Ingestion Panel
// Written by Gemini for Ayub Abdul Hussain / AYUBHUSSAIN-NO-ID

import React, { useState } from "react";
import { parseTelemetryFile } from "../lib/parsers";
import { TelemetryFrame } from "../lib/engine";

interface UploadPanelProps {
  onLoad: (frames: TelemetryFrame[], name: string) => void;
}

export function UploadPanel({ onLoad }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Awaiting telemetry session log...");

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsedFrames = parseTelemetryFile(content, file.name);
        if (parsedFrames.length > 0) {
          onLoad(parsedFrames, file.name);
          setStatusMessage(`Successfully ingested ${parsedFrames.length} frames from ${file.name}`);
        } else {
          setStatusMessage("Error: Ingestion failed. Check column headers (speed, throttle, brake, steeringAngle).");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs tracking-widest text-cyan-400 font-bold uppercase">Stage I // Telemetry Ingestion</h3>
        <span className="text-[10px] font-mono text-white/40">LOCAL CLIENT-SIDE PARSING</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
          isDragging ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 hover:border-cyan-500/50 bg-white/[0.01]"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          📁
        </div>
        <div className="space-y-1">
          <p className="text-sm font-mono font-bold text-white">Drop telemetry trace logs here</p>
          <p className="text-xs text-white/50 font-mono">Supports .csv, .json, .txt (Speed, Throttle, Brake, Steering)</p>
        </div>

        <label className="mt-2 px-4 py-2 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs cursor-pointer hover:bg-cyan-400 transition-colors">
          SELECT FILE
          <input type="file" accept=".csv,.json,.txt" onChange={handleChange} className="hidden" />
        </label>
      </div>

      <div className="text-xs font-mono text-cyan-300/80 bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/20">
        <strong>STATUS:</strong> {statusMessage}
      </div>
    </div>
  );
}
