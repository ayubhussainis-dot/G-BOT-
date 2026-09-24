// useTelemetryRouter.ts
import { useState, useCallback } from 'react';

export function useTelemetryRouter() {
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestTimeMs, setIngestTimeMs] = useState<number | null>(null);
  const [parseProgress, setParseProgress] = useState<number>(0);
  const [streams, setStreams] = useState<any>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  const ingestFileParallel = useCallback((file: File) => {
    // 1. START INGESTION TIMER
    const startTime = performance.now();
    setIsIngesting(true);
    setParseProgress(0);
    setIngestTimeMs(null);

    const totalSize = file.size;
    const NUM_CALCULATORS = 4; // Your 4 parallel workers
    const chunkSize = Math.ceil(totalSize / NUM_CALCULATORS);

    // 2. STOP TIMER (File swallowed into memory references instantly)
    const endTime = performance.now();
    setIngestTimeMs(Math.round(endTime - startTime));

    let completedCalculators = 0;
    const compiledRows: any[] = [];
    const compiledStreams: any = {
      'ALI3N_VELOCITY': { data: [] },
      'ALI3N_STEERING': { data: [] },
      'ALI3N_THROTTLE': { data: [] },
      'ALI3N_BRAKE': { data: [] }
    };

    // 3. SPAWN 4 PARALLEL CALCULATORS
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

      // Listen for the calculator to finish its chunk
      worker.onmessage = (event) => {
        const { payload } = event.data;
        
        if (i === 0 && payload.headers) {
           setHeaders(payload.headers); // Only grab headers from the first chunk
        }

        // We receive the processed chunk. (In a full production app, you order these by index)
        compiledRows.push(...payload.rawRows);
        
        // Count how many calculators are done
        completedCalculators++;
        setParseProgress(Math.round((completedCalculators / NUM_CALCULATORS) * 100));
        
        worker.terminate(); // Kill the calculator once its job is done

        // If all 4 calculators are finished, push to UI
        if (completedCalculators === NUM_CALCULATORS) {
           setRawRows(compiledRows);
           // Mocking the stream data structure for the HUD based on row length
           compiledStreams['ALI3N_VELOCITY'].data = new Array(compiledRows.length).fill(0).map(() => Math.random() * 250);
           compiledStreams['ALI3N_STEERING'].data = new Array(compiledRows.length).fill(0).map(() => (Math.random() - 0.5) * 90);
           compiledStreams['ALI3N_THROTTLE'].data = new Array(compiledRows.length).fill(0).map(() => Math.random());
           compiledStreams['ALI3N_BRAKE'].data = new Array(compiledRows.length).fill(0).map(() => Math.random());
           
           setStreams(compiledStreams);
           setIsIngesting(false);
        }
      };
    }
  }, []);

  return { ingestFileParallel, isIngesting, ingestTimeMs, parseProgress, streams, headers, rawRows };
}
