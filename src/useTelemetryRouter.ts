import { useState, useEffect, useRef, useCallback } from 'react';

export interface TelemetryStreamPayload {
  variableId: string; // e.g., 'ALI3N_BRAKE', 'ALI3N_THROTTLE'
  tag: 'RED' | 'RED+BLUE' | 'GREEN' | string;
  data: number[];
}

export interface TelemetryState {
  [variableId: string]: {
    tag: string;
    data: number[];
  };
}

export function useTelemetryRouter() {
  const [streams, setStreams] = useState<TelemetryState>({});
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(
      new URL('./telemetry.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Listen for isolated stream payloads from worker
    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;

      if (type === 'TELEMETRY_STREAM') {
        const { variableId, tag, data }: TelemetryStreamPayload = payload;

        // Functional update isolates updates by variableId
        setStreams((prev) => ({
          ...prev,
          [variableId]: { tag, data },
        }));
      } else if (type === 'INGESTION_COMPLETE') {
        setIsIngesting(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const ingestCSV = useCallback((csvText: string) => {
    if (!workerRef.current) return;
    setIsIngesting(true);
    setStreams({}); // Clear previous lap data
    workerRef.current.postMessage({ csvText });
  }, []);

  return { ingestCSV, streams, isIngesting };
}
