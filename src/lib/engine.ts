// G-BOT — Deterministic Telemetry Intelligence Engine
//
// ARCHITECTURAL RULE:
// Raw telemetry → deterministic measurements → evidence
//
// This engine does NOT invent telemetry.
// It does NOT manufacture a PPG.
// It does NOT diagnose tyre/thermal/vehicle states without the required data.
// It does NOT turn an observation into a prediction.
//
// A predictive result requires a valid reference, model, or historical baseline.
// Until that exists, G-BOT explicitly reports that the prediction is unavailable.

export interface TelemetryFrame {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  steeringAngle: number;
  lateralG: number;
  longitudinalG: number;
  rpm: number;
  gear: number;
}

export type EvidenceState =
  | "MEASURED"
  | "DERIVED"
  | "PREDICTED"
  | "INSUFFICIENT_DATA";

export interface DataQuality {
  frameCount: number;
  usableFrames: number;
  coveragePercent: number;
  missingChannels: string[];
  state: EvidenceState;
}

export interface SessionMeasurements {
  steeringVariation: number | null;
  brakeThrottleOverlapPercent: number | null;
  averageSpeed: number | null;
  maximumSpeed: number | null;
  averageThrottle: number | null;
  maximumBrake: number | null;
  maximumLateralG: number | null;
  maximumLongitudinalG: number | null;
  averageRpm: number | null;
  dataQuality: DataQuality;
}

export interface StintPrediction {
  // Kept for compatibility with the current UI.
  // A real PPG cannot be calculated without a reference/baseline.
  predictivePerformanceGap: number | null;

  // These legacy fields are retained so the current application compiles.
  // They are now explicitly derived from observed telemetry rather than
  // being presented as predictive intelligence.
  nmveIndex: number | null;
  chaosFactor: number | null;

  // This is now DATA INTEGRITY, not vehicle/driver health.
  stintIntegrityScore: number;

  warningApex: string;
  recommendedAction: string;

  evidenceState: EvidenceState;
  measurements: SessionMeasurements;
}

export const variableIdentifierCheck = "G-BOT";

const CHANNELS: Array<keyof TelemetryFrame> = [
  "timestamp",
  "speed",
  "throttle",
  "brake",
  "steeringAngle",
  "lateralG",
  "longitudinalG",
  "rpm",
  "gear",
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maximum(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function percentage(
  numerator: number,
  denominator: number,
): number | null {
  if (denominator <= 0) {
    return null;
  }

  return (numerator / denominator) * 100;
}

function round(
  value: number | null,
  decimals = 3,
): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function calculateDataQuality(
  frames: TelemetryFrame[],
): DataQuality {
  const frameCount = frames.length;

  if (frameCount === 0) {
    return {
      frameCount: 0,
      usableFrames: 0,
      coveragePercent: 0,
      missingChannels: [...CHANNELS],
      state: "INSUFFICIENT_DATA",
    };
  }

  const missingChannels = CHANNELS.filter((channel) => {
    return !frames.some((frame) =>
      isFiniteNumber(frame[channel]),
    );
  });

  let usableFrames = 0;

  for (const frame of frames) {
    const availableChannels = CHANNELS.filter((channel) =>
      isFiniteNumber(frame[channel]),
    ).length;

    if (availableChannels >= 3) {
      usableFrames++;
    }
  }

  const coveragePercent =
    (usableFrames / frameCount) * 100;

  return {
    frameCount,
    usableFrames,
    coveragePercent: Math.round(coveragePercent * 10) / 10,
    missingChannels,
    state:
      usableFrames > 0
        ? "MEASURED"
        : "INSUFFICIENT_DATA",
  };
}

function calculateSteeringVariation(
  frames: TelemetryFrame[],
): number | null {
  const deltas: number[] = [];

  for (let i = 1; i < frames.length; i++) {
    const previous = frames[i - 1].steeringAngle;
    const current = frames[i].steeringAngle;

    if (
      isFiniteNumber(previous) &&
      isFiniteNumber(current)
    ) {
      deltas.push(Math.abs(current - previous));
    }
  }

  return round(mean(deltas));
}

function calculateBrakeThrottleOverlap(
  frames: TelemetryFrame[],
): number | null {
  let evaluatedFrames = 0;
  let overlapFrames = 0;

  for (const frame of frames) {
    if (
      !isFiniteNumber(frame.brake) ||
      !isFiniteNumber(frame.throttle)
    ) {
      continue;
    }

    evaluatedFrames++;

    if (frame.brake > 0 && frame.throttle > 0) {
      overlapFrames++;
    }
  }

  return round(
    percentage(overlapFrames, evaluatedFrames),
    2,
  );
}

function calculateMeasurements(
  frames: TelemetryFrame[],
  dataQuality: DataQuality,
): SessionMeasurements {
  const speeds = frames
    .map((frame) => frame.speed)
    .filter(isFiniteNumber);

  const throttles = frames
    .map((frame) => frame.throttle)
    .filter(isFiniteNumber);

  const brakes = frames
    .map((frame) => frame.brake)
    .filter(isFiniteNumber);

  const lateralGs = frames
    .map((frame) => frame.lateralG)
    .filter(isFiniteNumber);

  const longitudinalGs = frames
    .map((frame) => frame.longitudinalG)
    .filter(isFiniteNumber);

  const rpms = frames
    .map((frame) => frame.rpm)
    .filter(isFiniteNumber);

  return {
    steeringVariation:
      calculateSteeringVariation(frames),

    brakeThrottleOverlapPercent:
      calculateBrakeThrottleOverlap(frames),

    averageSpeed:
      round(mean(speeds), 2),

    maximumSpeed:
      round(maximum(speeds), 2),

    averageThrottle:
      round(mean(throttles), 2),

    maximumBrake:
      round(maximum(brakes), 2),

    maximumLateralG:
      round(maximum(lateralGs), 3),

    maximumLongitudinalG:
      round(maximum(longitudinalGs), 3),

    averageRpm:
      round(mean(rpms), 0),

    dataQuality,
  };
}

function calculateIntegrityScore(
  quality: DataQuality,
): number {
  if (quality.frameCount === 0) {
    return 0;
  }

  /*
   * This is deliberately a DATA INTEGRITY score.
   *
   * It is NOT:
   * - driver skill
   * - vehicle health
   * - performance
   * - prediction
   */

  return Math.round(
    Math.max(
      0,
      Math.min(100, quality.coveragePercent),
    ),
  );
}

function buildObservation(
  measurements: SessionMeasurements,
): {
  warningApex: string;
  recommendedAction: string;
} {
  const overlap =
    measurements.brakeThrottleOverlapPercent;

  if (overlap === null) {
    return {
      warningApex: "INSUFFICIENT DATA",
      recommendedAction:
        "Brake and throttle channels are insufficient for an overlap observation.",
    };
  }

  if (overlap >= 25) {
    return {
      warningApex: "INPUT OVERLAP OBSERVED",
      recommendedAction:
        "Review brake/throttle overlap against the track position and corner phases before drawing a driving conclusion.",
    };
  }

  return {
    warningApex: "NO HIGH OVERLAP OBSERVED",
    recommendedAction:
      "No high brake/throttle overlap was detected in the supplied frames.",
  };
}

export function computeStintIntelligence(
  frames: TelemetryFrame[],
): StintPrediction {
  if (!frames || frames.length === 0) {
    const emptyQuality: DataQuality = {
      frameCount: 0,
      usableFrames: 0,
      coveragePercent: 0,
      missingChannels: [...CHANNELS],
      state: "INSUFFICIENT_DATA",
    };

    const emptyMeasurements: SessionMeasurements = {
      steeringVariation: null,
      brakeThrottleOverlapPercent: null,
      averageSpeed: null,
      maximumSpeed: null,
      averageThrottle: null,
      maximumBrake: null,
      maximumLateralG: null,
      maximumLongitudinalG: null,
      averageRpm: null,
      dataQuality: emptyQuality,
    };

    return {
      predictivePerformanceGap: null,
      nmveIndex: null,
      chaosFactor: null,
      stintIntegrityScore: 0,
      warningApex: "STANDBY",
      recommendedAction:
        "Awaiting a telemetry session. No prediction has been generated.",
      evidenceState: "INSUFFICIENT_DATA",
      measurements: emptyMeasurements,
    };
  }

  const dataQuality = calculateDataQuality(frames);

  const measurements = calculateMeasurements(
    frames,
    dataQuality,
  );

  const observation = buildObservation(
    measurements,
  );

  /*
   * LEGACY COMPATIBILITY
   *
   * nmveIndex:
   * The current architecture does not yet contain the formal
   * NMVE methodology required to claim an NMVE score.
   *
   * Therefore we expose the measured steering variation here
   * only for compatibility with the existing UI.
   *
   * chaosFactor:
   * The old implementation called brake/throttle overlap
   * "chaos". That was an unsupported interpretation.
   *
   * We now expose the observed overlap fraction instead.
   */

  const nmveIndex =
    measurements.steeringVariation;

  const chaosFactor =
    measurements.brakeThrottleOverlapPercent === null
      ? null
      : round(
          measurements.brakeThrottleOverlapPercent / 100,
          3,
        );

  /*
   * PPG REQUIREMENT
   *
   * A predictive performance gap requires at minimum:
   *
   * current lap
   * reference lap / baseline
   * valid lap segmentation
   * comparable distance/time basis
   *
   * The present input does not establish those conditions.
   *
   * Therefore:
   *
   * predictivePerformanceGap = null
   *
   * This is intentional.
   */

  const predictivePerformanceGap = null;

  return {
    predictivePerformanceGap,

    nmveIndex,

    chaosFactor,

    stintIntegrityScore:
      calculateIntegrityScore(dataQuality),

    warningApex:
      observation.warningApex,

    recommendedAction:
      observation.recommendedAction,

    evidenceState:
      dataQuality.state,

    measurements,
  };
}
