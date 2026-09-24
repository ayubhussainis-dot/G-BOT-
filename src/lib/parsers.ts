// G-BOT — Telemetry Ingestion & Parsing
//
// Truth rule:
// - Never invent a telemetry value.
// - A real zero must remain zero.
// - A missing channel is represented as NaN until the intelligence
//   layer explicitly decides how that missing channel should be handled.
// - Parser responsibility = ingest + normalize.
// - Parser does NOT predict, repair, or manufacture telemetry.

import { TelemetryFrame } from "./engine";

const MISSING = Number.NaN;

type RawRecord = Record<string, unknown>;

const FIELD_ALIASES: Record<string, string[]> = {
  timestamp: [
    "timestamp",
    "time",
    "elapsedtime",
    "elapsed_time",
    "sessiontime",
    "session_time",
  ],

  speed: [
    "speed",
    "speedkmh",
    "speed_kmh",
    "velocity",
    "vel",
    "vehicle_speed",
    "vehiclespeed",
  ],

  throttle: [
    "throttle",
    "tps",
    "accelerator",
    "accel",
    "throttleposition",
    "throttle_position",
  ],

  brake: [
    "brake",
    "brakepressure",
    "brake_pressure",
    "brakeposition",
    "brake_position",
    "prs",
  ],

  steeringAngle: [
    "steeringangle",
    "steering_angle",
    "steering",
    "steer",
    "steeringinput",
    "steering_input",
  ],

  lateralG: [
    "lateralg",
    "lateral_g",
    "lateralacceleration",
    "lateral_acceleration",
    "latg",
  ],

  longitudinalG: [
    "longitudinalg",
    "longitudinal_g",
    "longitudinalacceleration",
    "longitudinal_acceleration",
    "longg",
  ],

  rpm: [
    "rpm",
    "engine_rpm",
    "enginerpm",
    "engine_speed",
    "enginespeed",
  ],

  gear: [
    "gear",
    "gearposition",
    "gear_position",
    "currentgear",
    "current_gear",
  ],
};

function cleanKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/["']/g, "")
    .replace(/[\s\-./()[\]]+/g, "_")
    .replace(/_+/g, "_");
}

function normalizeKey(value: string): string {
  return cleanKey(value).replace(/_/g, "");
}

function findValue(
  record: RawRecord,
  aliases: string[],
): unknown {
  const entries = Object.entries(record);

  for (const alias of aliases) {
    const target = normalizeKey(alias);

    const match = entries.find(([key]) => {
      return normalizeKey(key) === target;
    });

    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : MISSING;
  }

  if (typeof value === "string") {
    const cleaned = value
      .trim()
      .replace(/,/g, "")
      .replace(/%$/, "");

    if (cleaned === "") {
      return MISSING;
    }

    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : MISSING;
  }

  return MISSING;
}

function normalizeFrame(
  item: RawRecord,
  index: number,
): TelemetryFrame {
  const timestamp = toNumber(
    findValue(item, FIELD_ALIASES.timestamp),
  );

  const speed = toNumber(
    findValue(item, FIELD_ALIASES.speed),
  );

  const throttle = toNumber(
    findValue(item, FIELD_ALIASES.throttle),
  );

  const brake = toNumber(
    findValue(item, FIELD_ALIASES.brake),
  );

  const steeringAngle = toNumber(
    findValue(item, FIELD_ALIASES.steeringAngle),
  );

  const lateralG = toNumber(
    findValue(item, FIELD_ALIASES.lateralG),
  );

  const longitudinalG = toNumber(
    findValue(item, FIELD_ALIASES.longitudinalG),
  );

  const rpm = toNumber(
    findValue(item, FIELD_ALIASES.rpm),
  );

  const gear = toNumber(
    findValue(item, FIELD_ALIASES.gear),
  );

  return {
    timestamp,
    speed,
    throttle,
    brake,
    steeringAngle,
    lateralG,
    longitudinalG,
    rpm,
    gear,
  };
}

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();

  if (
    trimmed.length >= 2 &&
    trimmed.startsWith('"') &&
    trimmed.endsWith('"')
  ) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }

  return trimmed;
}

function splitDelimitedLine(
  line: string,
  delimiter: string,
): string[] {
  const values: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === delimiter && !insideQuotes) {
      values.push(stripOuterQuotes(current));
      current = "";
      continue;
    }

    current += character;
  }

  values.push(stripOuterQuotes(current));

  return values;
}

function detectDelimiter(headerLine: string): string {
  const tabCount = (headerLine.match(/\t/g) ?? []).length;
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;

  if (tabCount > commaCount && tabCount >= semicolonCount) {
    return "\t";
  }

  if (semicolonCount > commaCount) {
    return ";";
  }

  return ",";
}

function parseDelimitedText(
  text: string,
): RawRecord[] {
  const normalizedText = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalizedText) {
    return [];
  }

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);

  const headers = splitDelimitedLine(
    lines[0],
    delimiter,
  ).map(cleanKey);

  if (
    headers.length === 0 ||
    headers.every((header) => header === "")
  ) {
    return [];
  }

  const records: RawRecord[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const values = splitDelimitedLine(
      lines[lineIndex],
      delimiter,
    );

    if (
      values.length === 1 &&
      values[0].trim() === ""
    ) {
      continue;
    }

    const record: RawRecord = {};

    headers.forEach((header, columnIndex) => {
      record[header] =
        values[columnIndex] !== undefined
          ? values[columnIndex]
          : "";
    });

    records.push(record);
  }

  return records;
}

function parseJson(content: string): RawRecord[] {
  const parsed: unknown = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is RawRecord =>
        typeof item === "object" &&
        item !== null &&
        !Array.isArray(item),
    );
  }

  if (
    typeof parsed === "object" &&
    parsed !== null
  ) {
    const object = parsed as Record<string, unknown>;

    const possibleArrays = [
      object.frames,
      object.data,
      object.telemetry,
      object.samples,
      object.records,
    ];

    for (const candidate of possibleArrays) {
      if (Array.isArray(candidate)) {
        return candidate.filter(
          (item): item is RawRecord =>
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item),
        );
      }
    }
  }

  return [];
}

function validateFrames(
  frames: TelemetryFrame[],
): TelemetryFrame[] {
  return frames.filter((frame) => {
    return Object.values(frame).some(
      (value) => Number.isFinite(value),
    );
  });
}

export function parseTelemetryFile(
  content: string,
  filename: string,
): TelemetryFrame[] {
  const extension =
    filename.split(".").pop()?.toLowerCase() ?? "";

  if (!content || content.trim().length === 0) {
    return [];
  }

  try {
    if (extension === "json") {
      const records = parseJson(content);

      return validateFrames(
        records.map((record, index) =>
          normalizeFrame(record, index),
        ),
      );
    }

    const records = parseDelimitedText(content);

    return validateFrames(
      records.map((record, index) =>
        normalizeFrame(record, index),
      ),
    );
  } catch (error) {
    console.error(
      `G-BOT telemetry parse error for ${filename}:`,
      error,
    );

    return [];
  }
}

export function downloadExport(
  filename: string,
  content: string,
  mimeType: string,
) {
  const blob = new Blob([content], {
    type: mimeType,
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}
