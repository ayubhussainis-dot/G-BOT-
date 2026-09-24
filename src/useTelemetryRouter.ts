// useTelemetryRouter.ts
import { useState, useCallback } from 'react';

export function useTelemetryRouter() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [ingestTimeMs, setIngestTimeMs] = useState<number | null>(null);
  const [liveRows, setLiveRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [streams, setStreams] = useState<any>({});

  const ingestFileParallel = useCallback((file: File) => {
    const startTime = performance.now();
    setLiveRows([]);
    setIsReady(false);

    const totalSize = file.size;
    const NUM_CALCULATORS = 4;
    const chunkSize = Math.ceil(totalSize / NUM_CALCULATORS);

    const endTime = performance.now();
    setIngestTimeMs(Math.round(endTime - startTime));

    let completedCalculators = 0;
    const chunkMap: any[] = [];

    for (let i = 0; i < NUM_CALCULATORS; i++) {
      const worker = new Worker(new URL('./telemetry.worker.ts', import.meta.url), { type: 'module' });
      
      const startByte = i * chunkSize;
      const endByte = Math.min(startByte + chunkSize, totalSize);
      const slice = file.slice(startByte, endByte);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        worker.postMessage({ chunkText: text, calculatorIndex: i });
      };
      reader.readAsText(slice);

      worker.onmessage = (event) => {
        const { payload } = event.data;
        chunkMap[payload.calculatorIndex] = payload.rawRows;

        let activeHeaders = headers;
        if (payload.calculatorIndex === 0 && payload.headers) {
           // Strip surrounding quotes and whitespace from headers
           activeHeaders = payload.headers.map((h: string) => h.replace(/^["']|["']$/g, '').trim());
           setHeaders(activeHeaders);
        }

        if (payload.calculatorIndex === 0) {
           setLiveRows(payload.rawRows);
           
           // Robust search handling quotes, case, and variations
           const cleanHeader = (h: string) => h.replace(/^["']|["']$/g, '').trim().toLowerCase();
           
           const vxIdx = activeHeaders.findIndex((h: string) => cleanHeader(h).includes('velocity_x') || cleanHeader(h) === 'speed');
           const vyIdx = activeHeaders.findIndex((h: string) => cleanHeader(h).includes('velocity_y'));
           const vzIdx = activeHeaders.findIndex((h: string) => cleanHeader(h).includes('velocity_z'));
           const brakeIdx = activeHeaders.findIndex((h: string) => cleanHeader(h).includes('brake'));

           const parseVal = (val: any) => {
             if (val === undefined || val === null) return 0;
             const cleaned = String(val).replace(/^["']|["']$/g, '').trim();
             return Number(cleaned) || 0;
           };

           const velocities = payload.rawRows.map((r: any) => {
             const x = vxIdx !== -1 ? parseVal(r[vxIdx]) : 0;
             const y = vyIdx !== -1 ? parseVal(r[vyIdx]) : 0;
             const z = vzIdx !== -1 ? parseVal(r[vzIdx]) : 0;
             const mag = Math.sqrt(x * x + y * y + z * z);
             return mag > 0 ? mag * 3.6 : x;
           });

           const brakes = payload.rawRows.map((r: any) => {
             return brakeIdx !== -1 ? parseVal(r[brakeIdx]) : 0;
           });

           setStreams({
             'ALI3N_VELOCITY': { data: velocities },
             'ALI3N_BRAKE': { data: brakes }
           });
           setIsReady(true);
        }

        completedCalculators++;
        worker.terminate();

        if (completedCalculators === NUM_CALCULATORS) {
           const allRows = chunkMap.flat();
           setLiveRows(allRows);
           
           const cleanHeader = (h: string) => h.replace(/^["']|["']$/g, '').trim().toLowerCase();
           const vxIdx = headers.findIndex((h: string) => cleanHeader(h).includes('velocity_x') || cleanHeader(h) === 'speed');
           const vyIdx = headers.findIndex((h: string) => cleanHeader(h).includes('velocity_y'));
           const vzIdx = headers.findIndex((h: string) => cleanHeader(h).includes('velocity_z'));
           const brakeIdx = headers.findIndex((h: string) => cleanHeader(h).includes('brake'));

           const parseVal = (val: any) => {
             if (val === undefined || val === null) return 0;
             const cleaned = String(val).replace(/^["']|["']$/g, '').trim();
             return Number(cleaned) || 0;
           };

           const velocities = allRows.map((r: any) => {
             const x = vxIdx !== -1 ? parseVal(r[vxIdx]) : 0;
             const y = vyIdx !== -1 ? parseVal(r[vyIdx]) : 0;
             const z = vzIdx !== -1 ? parseVal(r[vzIdx]) : 0;
             const mag = Math.sqrt(x * x + y * y + z * z);
             return mag > 0 ? mag * 3.6 : x;
           });

           const brakes = allRows.map((r: any) => {
             return brakeIdx !== -1 ? parseVal(r[brakeIdx]) : 0;
           });

           setStreams({
             'ALI3N_VELOCITY': { data: velocities },
             'ALI3N_BRAKE': { data: brakes }
           });
        }
      };
    }
  }, []);

  return { ingestFileParallel, isReady, ingestTimeMs, streams, headers, liveRows };
}
