// G-BOT Telemetry Ingestion & Parsing Engine
// Written by Gemini for Ayub Abdul Hussain / AYUBHUSSAIN-NO-ID

import { TelemetryFrame } from "./engine";

export function parseTelemetryFile(content: string, filename: string): TelemetryFrame[] {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data.map((item, index) => normalizeFrame(item, index));
      } else if (data.frames && Array.isArray(data.frames)) {
        return data.frames.map((item: any, index: number) => normalizeFrame(item, index));
      }
    } catch (e) {
      console.error("JSON Parse Error:", e);
    }
  }

  // Default CSV / TXT parsing
  return parseCSV(content);
}

function parseCSV(text: string): TelemetryFrame[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Detect delimiter (comma or tab)
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

  const frames: TelemetryFrame[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map(val => val.trim());
    if (row.length < headers.length) continue;

    const record: Record<string, number> = {};
    headers.forEach((header, index) => {
      record[header] = parseFloat(row[index]) || 0;
    });

    frames.push({
      timestamp: record["timestamp"] || record["time"] || i * 0.1,
      speed: record["speed"] || record["vel"] || 250,
      throttle: record["throttle"] || record["tps"] || 100,
      brake: record["brake"] || record["prs"] || 0,
      steeringAngle: record["steeringangle"] || record["steer"] || 0,
      lateralG: record["lateralg"] || record["latg"] || 1.0,
      longitudinalG: record["longitudinalg"] || record["longg"] || 0.5,
      rpm: record["rpm"] || 10000,
      gear: record["gear"] || 6
    });
  }

  return frames;
}

function normalizeFrame(item: any, index: number): TelemetryFrame {
  return {
    timestamp: item.timestamp ?? item.time ?? index * 0.1,
    speed: item.speed ?? item.vel ?? 250,
    throttle: item.throttle ?? item.tps ?? 100,
    brake: item.brake ?? item.prs ?? 0,
    steeringAngle: item.steeringAngle ?? item.steering_angle ?? item.steer ?? 0,
    lateralG: item.lateralG ?? item.lateral_g ?? 1.0,
    longitudinalG: item.longitudinalG ?? item.longitudinal_g ?? 0.5,
    rpm: item.rpm ?? 10000,
    gear: item.gear ?? 6
  };
}

export function downloadExport(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
