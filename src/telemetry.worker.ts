// telemetry.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { chunkText, chunkIndex, totalChunks } = e.data;
  
  const rows = chunkText.trim().split('\n');
  if (rows.length === 0) return;

  // Process this specific MB chunk
  const headers = rows[0].split(',').map((h: string) => h.trim());
  const dataGrid = rows.slice(1).map((row: string) => row.split(',').map(Number));

  // Perform deterministic analysis for this chunk...
  self.postMessage({
    type: 'CHUNK_PROCESSED',
    payload: {
      chunkIndex,
      totalChunks,
      headers,
      rows: dataGrid
    }
  });

  if (chunkIndex + 1 >= totalChunks) {
    self.postMessage({ type: 'INGESTION_COMPLETE' });
  }
};
