// G-BOT — Session Import Panel
// Step 2: transparent telemetry ingestion interface.
// The UI must never imply that unsupported or missing telemetry is real.

import React, { useRef, useState } from "react";
import { parseTelemetryFile } from "../lib/parsers";
import { TelemetryFrame } from "../lib/engine";

interface UploadPanelProps {
  onLoad: (frames: TelemetryFrame[], name: string) => void;
}

const SUPPORTED_EXTENSIONS = [".csv", ".tsv", ".json", ".txt"];

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

export function UploadPanel({ onLoad }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Awaiting telemetry session..."
  );
  const [isReading, setIsReading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    const extension = getExtension(file.name);

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      setStatusMessage(
        `Unsupported file type: ${extension || "unknown"}. Supported test formats: CSV, TSV, JSON and TXT.`
      );
      return;
    }

    setSelectedFile(file.name);
    setIsReading(true);
    setStatusMessage(`Reading ${file.name}...`);

    const reader = new FileReader();

    reader.onerror = () => {
      setIsReading(false);
      setStatusMessage(
        `Unable to read ${file.name}. The browser could not access the selected file.`
      );
    };

    reader.onload = (event) => {
      const content = event.target?.result;

      if (typeof content !== "string" || content.length === 0) {
        setIsReading(false);
        setStatusMessage(
          `No readable telemetry content was found in ${file.name}.`
        );
        return;
      }

      try {
        const parsedFrames = parseTelemetryFile(content, file.name);

        if (parsedFrames.length === 0) {
          setIsReading(false);
          setStatusMessage(
            `No valid telemetry frames were detected in ${file.name}. Check the file structure and required telemetry channels.`
          );
          return;
        }

        setIsReading(false);

        setStatusMessage(
          `Loaded ${parsedFrames.length.toLocaleString()} telemetry frames from ${file.name}.`
        );

        onLoad(parsedFrames, file.name);
      } catch (error) {
        console.error("G-BOT telemetry ingestion error:", error);

        setIsReading(false);
        setStatusMessage(
          `Telemetry ingestion failed for ${file.name}. No analysis was generated.`
        );
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    event.target.value = "";
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <div className="p-6 rounded-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-xs tracking-widest text-cyan-400 font-bold uppercase">
            Stage I // Session Import
          </h3>

          <p className="text-[10px] text-white/40 font-mono mt-1 uppercase">
            Local client-side telemetry ingestion
          </p>
        </div>

        <span className="text-[10px] font-mono text-white/40">
          G-BOT DATA GATE
        </span>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
          isDragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-white/10 hover:border-cyan-500/50 bg-white/[0.01]"
        }`}
      >

        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl">
          📁
        </div>

        <div className="space-y-1">
          <p className="text-sm font-mono font-bold text-white">
            Drop telemetry session here
          </p>

          <p className="text-xs text-white/50 font-mono">
            CSV · TSV · JSON · TXT
          </p>

          <p className="text-[10px] text-white/30 font-mono mt-2">
            G-BOT will only analyse channels actually present in the supplied data.
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openFilePicker();
          }}
          disabled={isReading}
          className="mt-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs cursor-pointer hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isReading ? "READING SESSION..." : "SELECT FILE"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.json,.txt"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-white/40 font-mono uppercase">
            Selected
          </span>

          <span className="text-[10px] text-cyan-300 font-mono truncate">
            {selectedFile}
          </span>
        </div>
      )}

      <div className="text-xs font-mono text-cyan-300/80 bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/20">

        <div className="flex items-start gap-2">
          <span className="text-cyan-400 font-bold">
            STATUS:
          </span>

          <span>
            {statusMessage}
          </span>
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <p className="text-[9px] text-white/30 uppercase">
            CSV
          </p>
          <p className="text-[10px] text-emerald-300 mt-1">
            AVAILABLE
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <p className="text-[9px] text-white/30 uppercase">
            TSV
          </p>
          <p className="text-[10px] text-emerald-300 mt-1">
            AVAILABLE
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <p className="text-[9px] text-white/30 uppercase">
            JSON
          </p>
          <p className="text-[10px] text-emerald-300 mt-1">
            AVAILABLE
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <p className="text-[9px] text-white/30 uppercase">
            TXT
          </p>
          <p className="text-[10px] text-emerald-300 mt-1">
            AVAILABLE
          </p>
        </div>

      </div>

      <div className="text-[9px] leading-relaxed text-white/30 font-mono border-t border-white/5 pt-4">
        DATA INTEGRITY: This interface does not manufacture missing telemetry.
        Unsupported native/proprietary formats will require dedicated adapters
        before G-BOT can claim native compatibility.
      </div>

    </div>
  );
}
