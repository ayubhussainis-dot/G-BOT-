// telemetry.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { chunkText, calculatorIndex } = e.data;
  
  const rows = chunkText.trim().split('\n');
  if (rows.length === 0) return;

  // Only the first calculator (Index 0) has the actual header row from the CSV
  let headers = [];
  let dataGrid = [];

  if (calculatorIndex === 0) {
    headers = rows[0].split(',').map((h: string) => h.trim());
    dataGrid = rows.slice(1).map((row: string) => row.split(','));
  } else {
    dataGrid = rows.map((row: string) => row.split(','));
  }

  self.postMessage({
    type: 'CHUNK_PROCESSED',
    payload: {
      calculatorIndex,
      headers: calculatorIndex === 0 ? headers : null,
      rawRows: dataGrid
    }
  });
};
