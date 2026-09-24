// G-BOT — Evidence-Based Coach Console
//
// G-BOT coaching rule:
// measured data → derived evidence → explanation
//
// This component must never invent telemetry, predictions,
// tyre states, vehicle states, lap deltas, or driving instructions.

import React, { useEffect, useRef, useState } from "react";
import {
  TelemetryFrame,
  StintPrediction,
} from "../lib/engine";

interface GBotConsoleProps {
  frames: TelemetryFrame[];
  prediction: StintPrediction | null;
  driverName: string;
}

interface Message {
  sender: "racer" | "coach";
  text: string;
  timestamp: string;
  evidence?: "MEASURED" | "DERIVED" | "PREDICTED" | "INSUFFICIENT_DATA";
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(
  value: number | null,
  decimals = 2,
): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(decimals);
}

function buildCoachResponse(
  question: string,
  frames: TelemetryFrame[],
  prediction: StintPrediction | null,
): {
  text: string;
  evidence: Message["evidence"];
} {
  if (!prediction || frames.length === 0) {
    return {
      text:
        "No telemetry session is currently available. I will not generate a driving conclusion without evidence.",
      evidence: "INSUFFICIENT_DATA",
    };
  }

  const q = question.toLowerCase();

  const measurements = prediction.measurements;

  if (
    q.includes("ppg") ||
    q.includes("gap") ||
    q.includes("potential")
  ) {
    if (prediction.predictivePerformanceGap === null) {
      return {
        text:
          "PPG is not available from this session yet. A defensible predictive performance gap requires a comparable reference or baseline lap. The current dataset does not establish that reference, so I will not invent a PPG value.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text: `The current calculated PPG is ${formatNumber(
        prediction.predictivePerformanceGap,
      )} s. This value is derived from the available comparison model.`,
      evidence: "PREDICTED",
    };
  }

  if (
    q.includes("brake") ||
    q.includes("braking")
  ) {
    if (
      measurements.brakeThrottleOverlapPercent === null
    ) {
      return {
        text:
          "The supplied session does not contain enough valid brake and throttle samples to evaluate their relationship.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text:
        `Brake/throttle overlap was observed in ` +
        `${formatNumber(
          measurements.brakeThrottleOverlapPercent,
        )}% of evaluated frames. ` +
        `That is an observed input relationship, not proof that the braking technique is incorrect. ` +
        `To make a corner-specific coaching recommendation, G-BOT needs track position and lap/corner segmentation.`,
      evidence: "DERIVED",
    };
  }

  if (
    q.includes("steering") ||
    q.includes("steer") ||
    q.includes("entropy") ||
    q.includes("nmv")
  ) {
    if (measurements.steeringVariation === null) {
      return {
        text:
          "Steering variation cannot be calculated from the supplied frames because usable steering samples are unavailable.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text:
        `Observed frame-to-frame steering variation is approximately ` +
        `${formatNumber(
          measurements.steeringVariation,
        )}°. ` +
        `This is a derived telemetry statistic. It is not being labelled as entropy, NMVE, or a driver-quality score because those methodologies require their own defined calculations.`,
      evidence: "DERIVED",
    };
  }

  if (
    q.includes("speed") ||
    q.includes("velocity")
  ) {
    if (measurements.averageSpeed === null) {
      return {
        text:
          "No valid speed samples are available for this session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text:
        `The supplied telemetry has an average observed speed of ` +
        `${formatNumber(
          measurements.averageSpeed,
          1,
        )} km/h and a maximum observed speed of ` +
        `${formatNumber(
          measurements.maximumSpeed,
          1,
        )} km/h.`,
      evidence: "MEASURED",
    };
  }

  if (
    q.includes("throttle") ||
    q.includes("accelerator")
  ) {
    if (measurements.averageThrottle === null) {
      return {
        text:
          "No valid throttle samples are available for this session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text:
        `The supplied telemetry shows an average throttle position of ` +
        `${formatNumber(
          measurements.averageThrottle,
          1,
        )}%. ` +
        `This describes the recorded input only; it does not by itself establish whether the throttle application was optimal.`,
      evidence: "MEASURED",
    };
  }

  if (
    q.includes("tyre") ||
    q.includes("tire") ||
    q.includes("thermal")
  ) {
    return {
      text:
        "Tyre thermal behaviour cannot be assessed from the current normalized telemetry interface because tyre-temperature channels are not part of the current TelemetryFrame. G-BOT will not fabricate tyre temperatures or degradation.",
      evidence: "INSUFFICIENT_DATA",
    };
  }

  if (
    q.includes("engine") ||
    q.includes("rpm") ||
    q.includes("gear")
  ) {
    if (measurements.averageRpm === null) {
      return {
        text:
          "No valid RPM samples are available. Engine or shift conclusions therefore cannot be established.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text:
        `The supplied telemetry has an average recorded engine speed of ` +
        `${formatNumber(
          measurements.averageRpm,
          0,
        )} RPM. ` +
        `Gear-selection quality cannot be judged from RPM alone without track position, speed targets, and a defined reference.`,
      evidence: "MEASURED",
    };
  }

  if (
    q.includes("data") ||
    q.includes("session") ||
    q.includes("status") ||
    q.includes("quality")
  ) {
    return {
      text:
        `Session integrity is ${prediction.stintIntegrityScore}%. ` +
        `${prediction.measurements.dataQuality.usableFrames.toLocaleString()} of ` +
        `${prediction.measurements.dataQuality.frameCount.toLocaleString()} frames contain enough telemetry channels for basic analysis. ` +
        (
          prediction.measurements.dataQuality.missingChannels.length > 0
            ? `Missing channels include: ${prediction.measurements.dataQuality.missingChannels.join(
                ", ",
              )}.`
            : "The core telemetry channels are represented."
        ),
      evidence: "DERIVED",
    };
  }

  return {
    text:
      "I can analyse the evidence currently present in this session. Ask about speed, throttle, braking, steering, RPM, gear, PPG, telemetry quality, or tyre data. If the supplied data cannot support a conclusion, I will say so rather than invent one.",
    evidence: "INSUFFICIENT_DATA",
  };
}

export function GBotConsole({
  frames,
  prediction,
  driverName,
}: GBotConsoleProps) {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "coach",
      text:
        `G-BOT Coach online for ${driverName}. ` +
        `The current session contains ${frames.length.toLocaleString()} telemetry frames. ` +
        `Ask me about the supplied evidence. I will distinguish measured data from derived analysis and will identify insufficient data when a conclusion cannot be supported.`,
      timestamp: timeNow(),
      evidence:
        frames.length > 0
          ? "MEASURED"
          : "INSUFFICIENT_DATA",
    },
  ]);

  const scrollContainerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        sender: "coach",
        text:
          `G-BOT Coach online for ${driverName}. ` +
          `Current session: ${frames.length.toLocaleString()} telemetry frames. ` +
          `Ask a question about the available evidence.`,
        timestamp: timeNow(),
        evidence:
          frames.length > 0
            ? "MEASURED"
            : "INSUFFICIENT_DATA",
      },
    ]);
  }, [driverName, frames.length]);

  const handleSend = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    const question = input.trim();

    if (!question) {
      return;
    }

    const response =
      buildCoachResponse(
        question,
        frames,
        prediction,
      );

    const racerMessage: Message = {
      sender: "racer",
      text: question,
      timestamp: timeNow(),
    };

    const coachMessage: Message = {
      sender: "coach",
      text: response.text,
      timestamp: timeNow(),
      evidence: response.evidence,
    };

    setMessages((previous) => [
      ...previous,
      racerMessage,
      coachMessage,
    ]);

    setInput("");
  };

  return (
    <div className="p-6 rounded-2xl bg-black/50 border border-cyan-500/30 backdrop-blur-2xl flex flex-col h-[520px] shadow-2xl font-mono">

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4">

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />

          <h3 className="text-xs tracking-widest text-cyan-300 font-bold uppercase">
            G-BOT COACH // EVIDENCE CONSOLE
          </h3>
        </div>

        <div className="flex items-center gap-2">

          <span className="text-[9px] text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded">
            DETERMINISTIC PATH
          </span>

          <span className="text-[9px] text-white/40">
            G-BOT
          </span>

        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-cyan-500/20"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={`flex flex-col ${
              message.sender === "racer"
                ? "items-end"
                : "items-start"
            }`}
          >

            <div className="flex items-center space-x-2 mb-1">

              <span className="text-[9px] text-white/40 uppercase">
                {message.sender === "racer"
                  ? `${driverName} // RACER`
                  : "G-BOT // COACH"}
              </span>

              <span className="text-[9px] text-white/30">
                {message.timestamp}
              </span>

            </div>

            <div
              className={`p-3 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                message.sender === "racer"
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-200"
                  : "bg-white/[0.03] border border-white/10 text-white/90"
              }`}
            >
              {message.text}
            </div>

            {message.sender === "coach" &&
              message.evidence && (
                <span
                  className={`mt-1 text-[8px] uppercase tracking-widest px-2 py-1 rounded border ${
                    message.evidence === "MEASURED"
                      ? "text-emerald-300 border-emerald-500/20 bg-emerald-500/5"
                      : message.evidence === "DERIVED"
                        ? "text-cyan-300 border-cyan-500/20 bg-cyan-500/5"
                        : message.evidence === "PREDICTED"
                          ? "text-amber-300 border-amber-500/20 bg-amber-500/5"
                          : "text-white/50 border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {message.evidence}
                </span>
              )}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSend}
        className="mt-4 flex gap-2 pt-3 border-t border-white/10"
      >

        <input
          type="text"
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          placeholder="Ask G-BOT about the supplied telemetry..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />

        <button
          type="submit"
          className="px-6 py-2.5 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          ASK G-BOT
        </button>

      </form>
    </div>
  );
}
