// telemetry.worker.ts

// ==========================================
// 1. THE DICTIONARY & FUZZY MATH
// ==========================================
const TELEMETRY_DICTIONARY = [
  { id: 'ALI3N_BRAKE', tag: 'RED', aliases: ['brake', 'brakepos', 'brake_pedal', 'brk'] },
  { id: 'ALI3N_THROTTLE', tag: 'RED', aliases: ['throttle', 'throttlepos', 'accel', 'gas'] },
  { id: 'ALI3N_STEERING', tag: 'RED+BLUE', aliases: ['steering', 'steerangle', 'steer', 'swa'] },
  { id: 'ALI3N_VELOCITY', tag: 'RED+BLUE', aliases: ['speed', 'v', 'kph', 'mph', 'velocity'] },
  { id: 'ALI3N_GFORCE_LAT', tag: 'RED+BLUE', aliases: ['gforce_y', 'lat_g', 'glat', 'lateral_acc'] },
  { id: 'ALI3N_GEAR', tag: 'RED', aliases: ['gear', 'ngear', 'gearp'] },
  { id: 'ALI3N_RPM', tag: 'RED', aliases: ['rpm', 'engine_rpm'] }
  // (Assume the full 25-node dictionary we mapped earlier is populated here)
];

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function getFuzzyHeaderMatch(header: string) {
  const normalizedHeader = header.toLowerCase().trim();
  let bestMatch = { id: 'ALI3N_UNKNOWN', tag: 'UNKNOWN', score: 0 };

  for (const node of TELEMETRY_DICTIONARY) {
    for (const alias of node.aliases) {
      if (normalizedHeader.includes(alias)) return { id: node.id, tag: node.tag, score: 1.0 }; // Fast substring catch
      
      const distance = levenshteinDistance(normalizedHeader, alias);
      const maxLength = Math.max(normalizedHeader.length, alias.length);
      const score = 1.0 - distance / maxLength;
      
      if (score > bestMatch.score) {
        bestMatch = { id: node.id, tag: node.tag as string, score };
      }
    }
  }
  return bestMatch;
}

// ==========================================
// 2. THE STATISTICAL PHYSICS FALLBACK
// ==========================================
function getStatisticalFingerprint(dataColumn: number[]) {
  if (dataColumn.length === 0) return { id: 'ALI3N_UNKNOWN', tag: 'UNKNOWN' };

  let min = dataColumn[0], max = dataColumn[0], sum = 0, zeroCount = 0;
  for (const val of dataColumn) {
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
    if (Math.abs(val) < 0.001) zeroCount++;
  }
  const mean = sum / dataColumn.length;
  const zeroDensity = zeroCount / dataColumn.length;

  // Brake Physics: Bounded [0,1], mostly untouched on straights
  if (min >= -0.01 && max <= 1.01 && zeroDensity > 0.60) return { id: 'ALI3N_BRAKE', tag: 'RED' };
  
  // Throttle Physics: Bounded [0,1], rarely at zero
  if (min >= -0.01 && max <= 1.01 && zeroDensity < 0.30) return { id: 'ALI3N_THROTTLE', tag: 'RED' };
  
  // Steering Physics: Bipolar, oscillates around zero
  if (min < -0.05 && max > 0.05 && Math.abs(mean) < 0.2) return { id: 'ALI3N_STEERING', tag: 'RED+BLUE' };

  return { id: 'ALI3N_UNKNOWN', tag: 'UNKNOWN' };
}

// ==========================================
// 3. THE MASTER INGESTION ROUTER
// ==========================================
self.onmessage = (e: MessageEvent) => {
  const { csvText } = e.data;
  const rows = csvText.trim().split('\n');
  if (rows.length < 2) return;

  const headers = rows[0].split(',').map((h: string) => h.trim());
  const dataGrid = rows.slice(1).map((row: string) => row.split(',').map(Number));

  // Process each column seamlessly
  headers.forEach((header: string, colIndex: number) => {
    const colData = dataGrid.map((row: number[]) => row[colIndex]).filter((n: number) => !isNaN(n));
    if (colData.length === 0) return;

    // STAGE 1: Check the Dictionary
    let routingMatch = getFuzzyHeaderMatch(header);

    // STAGE 2: If Dictionary fails (score < 0.80), fall back to Physics
    if (routingMatch.score < 0.80) {
      const physicsMatch = getStatisticalFingerprint(colData);
      if (physicsMatch.id !== 'ALI3N_UNKNOWN') {
        routingMatch = { id: physicsMatch.id, tag: physicsMatch.tag, score: 1.0 };
      }
    }

    // BROADCAST: Route successfully identified streams to the UI
    if (routingMatch.id !== 'ALI3N_UNKNOWN') {
      self.postMessage({
        type: 'TELEMETRY_STREAM',
        payload: {
          variableId: routingMatch.id,
          tag: routingMatch.tag,
          data: colData
        }
      });
    }
  });

  self.postMessage({ type: 'INGESTION_COMPLETE' });
};
