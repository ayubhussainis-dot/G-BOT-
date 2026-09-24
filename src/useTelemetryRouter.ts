import { useState, useRef, useCallback } from 'react';

export function useTelemetryRouter() {
  const [streams, setStreams] = useState<any>({});
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [progressMB, setProgressMB] = useState<number>(0);
  const [totalMB, setTotalMB] = useState<number>(0);
  const [currentChunkRows, setCurrentChunkRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const workerRef = useRef<Worker | null>(null);

  const ingestFileInChunks = useCallback((file: File) => {
    setIsIngesting(true);
    setStreams({});
    
    const CHUNK_SIZE = 1 * 1024 * 1024; // Exactly 1 MB chunks
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    setTotalMB(totalChunks);

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./telemetry.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'CHUNK_PROCESSED') {
        setHeaders(payload.headers);
        setCurrentChunkRows(payload.rows);
        setProgressMB(payload.chunkIndex + 1);
      } else if (type === 'INGESTION_COMPLETE') {
        setIsIngesting(false);
      }
    };

    // Read and feed 1MB at a time asynchronously
    let offset = 0;
    let chunkIndex = 0;

    const readNextChunk = () => {
      if (offset >= totalSize) return;
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const chunkText = e.target?.result as string;
        if (chunkText && workerRef.current) {
          workerRef.current.postMessage({ chunkText, chunkIndex, totalChunks });
        }
        offset += CHUNK_SIZE;
        chunkIndex++;
        // Small delay to let UI breathe between MB feeds
        setTimeout(readNextChunk, 50); 
      };
      reader.readAsText(slice);
    };

    readNextChunk();
  }, []);

  return { ingestFileInChunks, streams, isIngesting, progressMB, totalMB, currentChunkRows, headers };
}
