import { useState } from "react";
import type { StintPrediction } from "../lib/engine";

interface GBotConsoleProps {
  prediction: StintPrediction | null;
}

interface ConsoleMessage {
  role: "user" | "gbot";
  text: string;
  evidence?: string;
}

function answerQuestion(
  question: string,
  prediction: StintPrediction | null
): { text: string; evidence: string } {
  const q = question.toLowerCase().trim();

  if (!prediction) {
    return {
      text: "No session intelligence is available yet. Import a telemetry session first.",
      evidence: "INSUFFICIENT_DATA",
    };
  }

  const { measurements, dataQuality } = prediction;

  if (
    q.includes("ppg") ||
    q.includes("performance gap") ||
    q.includes("how much time")
  ) {
    return {
      text:
        prediction.predictivePerformanceGap === null
          ? "PPG cannot be calculated from this session alone. G-BOT requires a valid comparable reference or baseline lap."
          : `Measured reference comparison indicates a performance gap of ${prediction.predictivePerformanceGap.toFixed(
              3
            )} s.`,
      evidence:
        prediction.predictivePerformanceGap === null
          ? "INSUFFICIENT_DATA"
          : "DERIVED",
    };
  }

  if (q.includes("brake") || q.includes("braking")) {
    if (measurements.maxBrake === null) {
      return {
        text: "Brake-channel data is not present in the imported session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text: `Maximum recorded brake input is ${measurements.maxBrake.toFixed(
        1
      )}%. G-BOT can measure brake usage from the imported channel, but this session does not provide enough information to claim an optimal braking point.`,
      evidence: "MEASURED",
    };
  }

  if (q.includes("steering") || q.includes("steer")) {
    if (measurements.steeringVariation === null) {
      return {
        text: "Steering data is not available in the imported session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text: `Measured steering variation is ${measurements.steeringVariation.toFixed(
        3
      )}. This describes the imported steering signal; it does not by itself establish whether the driver is faster or slower.`,
      evidence: "DERIVED",
    };
  }

  if (q.includes("speed") || q.includes("velocity")) {
    if (
      measurements.averageSpeed === null &&
      measurements.maxSpeed === null
    ) {
      return {
        text: "Speed data is not available in the imported session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    const average =
      measurements.averageSpeed !== null
        ? measurements.averageSpeed.toFixed(1)
        : "—";

    const maximum =
      measurements.maxSpeed !== null
        ? measurements.maxSpeed.toFixed(1)
        : "—";

    return {
      text: `Measured speed statistics: average ${average}, maximum ${maximum}. These are session measurements, not a claim about optimal speed.`,
      evidence: "MEASURED",
    };
  }

  if (q.includes("throttle") || q.includes("accelerator")) {
    if (measurements.averageThrottle === null) {
      return {
        text: "Throttle data is not available in the imported session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    return {
      text: `Average recorded throttle input is ${measurements.averageThrottle.toFixed(
        1
      )}%. G-BOT can describe the signal but cannot infer an optimal throttle trace without a valid reference.`,
      evidence: "MEASURED",
    };
  }

  if (
    q.includes("tyre") ||
    q.includes("tire") ||
    q.includes("thermal")
  ) {
    return {
      text: "The current imported telemetry does not contain sufficient tyre-temperature, tyre-pressure, or tyre-degradation evidence for a tyre diagnosis.",
      evidence: "INSUFFICIENT_DATA",
    };
  }

  if (
    q.includes("rpm") ||
    q.includes("engine") ||
    q.includes("gear")
  ) {
    if (
      measurements.averageRpm === null &&
      measurements.gearDataAvailable === false
    ) {
      return {
        text: "Engine RPM and gear data are not available in the imported session.",
        evidence: "INSUFFICIENT_DATA",
      };
    }

    const rpm =
      measurements.averageRpm !== null
        ? `Average RPM: ${measurements.averageRpm.toFixed(0)}.`
        : "Average RPM: unavailable.";

    const gear = measurements.gearDataAvailable
      ? "Gear-channel data is present."
      : "Gear-channel data is unavailable.";

    return {
      text: `${rpm} ${gear}`,
      evidence: "MEASURED",
    };
  }

  if (
    q.includes("data") ||
    q.includes("quality") ||
    q.includes("session") ||
    q.includes("status")
  ) {
    return {
      text: `Session status: ${dataQuality.status}. Data coverage is ${dataQuality.coverage.toFixed(
        1
      )}%. ${dataQuality.message}`,
      evidence:
        dataQuality.status === "INSUFFICIENT_DATA"
          ? "INSUFFICIENT_DATA"
          : "DERIVED",
    };
  }

  return {
    text:
      "I can currently answer questions about the imported session's measured speed, throttle, brake, steering, RPM, gear, data quality, and PPG availability. For unsupported conclusions, G-BOT will report insufficient data rather than invent an answer.",
    evidence: "INSUFFICIENT_DATA",
  };
}

export function GBotConsole({
  prediction,
}: GBotConsoleProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);

  function ask() {
    const q = question.trim();

    if (!q) {
      return;
    }

    const response = answerQuestion(q, prediction);

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: q,
      },
      {
        role: "gbot",
        text: response.text,
        evidence: response.evidence,
      },
    ]);

    setQuestion("");
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      ask();
    }
  }

  const status = prediction
    ? prediction.dataQuality.status
    : "NO SESSION";

  return (
    <section className="gbot-panel-cyan rounded-2xl p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="gbot-label">G-BOT COACH</div>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Session Intelligence Console
          </h2>
        </div>

        <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-cyan-300">
          {status}
        </div>
      </div>

      <div className="mb-4 min-h-[180px] space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
        {messages.length === 0 ? (
          <div className="flex min-h-[140px] items-center justify-center text-center text-sm text-slate-500">
            Ask G-BOT about the imported session.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-8 rounded-xl border border-white/10 bg-white/5 p-3"
                  : "mr-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3"
              }
            >
              <div className="mb-1 text-[9px] font-semibold tracking-[0.2em] text-slate-500">
                {message.role === "user" ? "YOU" : "G-BOT"}
              </div>

              <div className="text-sm leading-6 text-slate-200">
                {message.text}
              </div>

              {message.evidence && (
                <div className="mt-2 text-[9px] font-semibold tracking-widest text-cyan-400/70">
                  EVIDENCE: {message.evidence}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask G-BOT about this session..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
        />

        <button
          type="button"
          onClick={ask}
          className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-xs font-semibold tracking-widest text-cyan-300 transition hover:bg-cyan-400/20"
        >
          ASK
        </button>
      </div>
    </section>
  );
}

export default GBotConsole;
