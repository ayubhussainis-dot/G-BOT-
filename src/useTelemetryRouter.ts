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
           
           // Dynamically find actual column indexes from headers instead of hardcoding
           const velIdx = activeHeaders.findIndex((h: string) => h.toLowerCase().includes('velocity') || h.toLowerCase().includes('speed'));
           const brakeIdx = activeHeaders.findIndex((h: string) => h.toLowerCase().includes('brake'));

           setStreams({
             'ALI3N_VELOCITY': { data: payload.rawRows.map((r: any) => velIdx !== -1 ? Number(r[velIdx]) || 0 : 0) },
             'ALI3N_BRAKE': { data: payload.rawRows.map((r: any) => brakeIdx !== -1 ? Number(r[brakeIdx]) || 0 : 0) }
           });
           setIsReady(true);
        }

        completedCalculators++;
        worker.terminate();

        if (completedCalculators === NUM_CALCULATORS) {
           const allRows = chunkMap.flat();
           setLiveRows(allRows);
           const velIdx = headers.findIndex((h: string) => h.toLowerCase().includes('velocity') || h.toLowerCase().includes('speed'));
           const brakeIdx = headers.findIndex((h: string) => h.toLowerCase().includes('brake'));

           setStreams({
             'ALI3N_VELOCITY': { data: allRows.map((r: any) => velIdx !== -1 ? Number(r[velIdx]) || 0 : 0) },
             'ALI3N_BRAKE': { data: allRows.map((r: any) => brakeIdx !== -1 ? Number(r[brakeIdx]) || 0 : 0) }
           });
        }
      };
    }
  }, []);

  return { ingestFileParallel, isReady, ingestTimeMs, streams, headers, liveRows };
}
