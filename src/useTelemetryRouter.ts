// useTelemetryRouter.ts (Updated stream extraction)
        if (payload.calculatorIndex === 0) {
           setLiveRows(payload.rawRows);
           
           // Find exact column indices safely
           const vxIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'velocity_x');
           const vyIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'velocity_y');
           const vzIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'velocity_z');
           const brakeIdx = activeHeaders.findIndex((h: string) => h.toLowerCase() === 'brake');

           const velocities = payload.rawRows.map((r: any) => {
             const x = vxIdx !== -1 ? Number(r[vxIdx]) || 0 : 0;
             const y = vyIdx !== -1 ? Number(r[vyIdx]) || 0 : 0;
             const z = vzIdx !== -1 ? Number(r[vzIdx]) || 0 : 0;
             // Calculate true 3D speed magnitude converted to KM/H (if vector) or single value
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
