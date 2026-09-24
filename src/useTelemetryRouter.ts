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
           activeHeaders = payload.headers;
           setHeaders(activeHeaders);
        }

        if (payload.calculatorIndex === 0) {
           setLiveRows(payload.rawRows);
           
           const vxIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'velocity_x');
           const vyIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'velocity_y');
           const vzIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'velocity_z');
           const brakeIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'brake');

           const velocities = payload.rawRows.map((r: any) => {
             const x = vxIdx !== -1 ? Number(r[vxIdx]) || 0 : 0;
             const y = vyIdx !== -1 ? Number(r[vyIdx]) || 0 : 0;
             const z = vzIdx !== -1 ? Number(r[vzIdx]) || 0 : 0;
             const mag = Math.sqrt(x * x + y * y + z * z);
             return mag > 0 ? mag * 3.6 : (vxIdx !== -1 ? Number(r[vxIdx]) || 0 : 0);
           });

           const brakes = payload.rawRows.map((r: any) => {
             return brakeIdx !== -1 ? Number(r[brakeIdx]) || 0 : 0;
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
           const vxIdx = headers.findIndex((h: string) => h.toLowerCase() === 'velocity_x');
           const vyIdx = headers.findIndex((h: string) => h.toLowerCase() === 'velocity_y');
           const vzIdx = headers.findIndex((h: string) => h.toLowerCase() === 'velocity_z');
           const brakeIdx = headers.findIndex((h: string) => h.toLowerCase() === 'brake');

           const velocities = allRows.map((r: any) => {
             const x = vxIdx !== -1 ? Number(r[vxIdx]) || 0 : 0;
             const y = vyIdx !== -1 ? Number(r[vyIdx]) || 0 : 0;
             const z = vzIdx !== -1 ? Number(r[vzIdx]) || 0 : 0;
             const mag = Math.sqrt(x * x + y * y + z * z);
             return mag > 0 ? mag * 3.6 : (vxIdx !== -1 ? Number(r[vxIdx]) || 0 : 0);
           });

           const brakes = allRows.map((r: any) => {
             return brakeIdx !== -1 ? Number(r[brakeIdx]) || 0 : 0;
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
