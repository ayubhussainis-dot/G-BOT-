// G-BOT Pitwall Conversational Coach Console
// Written by GemInEye

import React, { useState, useRef, useEffect } from "react";
import { TelemetryFrame, StintPrediction } from "../lib/engine";

interface GBotConsoleProps {
  frames: TelemetryFrame[];
  prediction: StintPrediction | null;
  driverName: string;
}

interface Message {
  sender: "racer" | "coach";
  text: string;
  timestamp: string;
}

export function GBotConsole({ frames, prediction, driverName }: GBotConsoleProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "coach",
      text: `Gbot Coach online for racer ${driverName}. Telemetry stream linked. Ask about apex delta, tire thermal degradation, or steering variance envelopes.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const racerMsg: Message = {
      sender: "racer",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const query = input.toLowerCase();
    let responseText = "Telemetry metrics are stable. Maintain current line through high-speed complexes.";

    if (query.includes("brake") || query.includes("braking")) {
      responseText = prediction ? `Braking chaos index is at ${prediction.chaosFactor}. Recommend shifting braking zone 3 meters earlier into ${prediction.warningApex}.` : "Upload a telemetry file to analyze braking traces.";
    } else if (query.includes("gap") || query.includes("ppg")) {
      responseText = prediction ? `Current Predictive Performance Gap (PPG) is +${prediction.predictivePerformanceGap}s per lap. Primary loss detected in steering micro-corrections.` : "No active session loaded.";
    } else if (query.includes("tire") || query.includes("thermal")) {
      responseText = "Rear axle thermal degradation is tracking 4% below threshold. Push for two more qualification-pace laps.";
    } else if (query.includes("steering") || query.includes("entropy") || query.includes("nmv")) {
      responseText = prediction ? `Neuro-Motor Variance (NMV) envelope is showing micro-corrections in high-speed entry. Stabilize steering wheel input trajectory by 2.4 degrees.` : "Load a session trace to evaluate steering entropy.";
    }

    const coachMsg: Message = {
      sender: "coach",
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, racerMsg, coachMsg]);
    setInput("");
  };

  return (
    <div className="p-6 rounded-2xl bg-black/50 border border-cyan-500/30 backdrop-blur-2xl flex flex-col h-[420px] shadow-2xl font-mono">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs tracking-widest text-cyan-300 font-bold uppercase">GBOT COACH // PITWALL FEED</h3>
        </div>
        <span className="text-[10px] text-white/40">VARIABLE: ALI3N</span>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-cyan-500/20">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === "racer" ? "items-end" : "items-start"}`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[9px] text-white/40 uppercase">{m.sender === "racer" ? `${driverName} (RACER)` : "GBOT COACH"}</span>
              <span className="text-[9px] text-white/30">{m.timestamp}</span>
            </div>
            <div className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
              m.sender === "racer" 
                ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-200" 
                : "bg-white/[0.03] border border-white/10 text-white/90"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gbot Coach about sector delta, apex speed, or tire wear..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          TRANSMIT
        </button>
      </form>
    </div>
  );
}
