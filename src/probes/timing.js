export async function getTimingFingerprint() {
    try {
        const perfData = {};

        // 1. Time verification through performance
        // Privacy browsers artificially round this to 1ms or 100ms to prevent CPU profiling
        const t0 = performance.now();
        let mathResult = 0;
        // Run a dummy loop to force CPU execution
        for (let i = 0; i < 1000000; i++) {
            mathResult += Math.sqrt(i) * Math.sin(i);
        }
        const t1 = performance.now();
        
        perfData.executionLatency = (t1 - t0).toFixed(2) + "ms";

        // 2. Navigation Timing (how long it took the page to process)
        if (performance.getEntriesByType) {
            const navEntries = performance.getEntriesByType("navigation");
            if (navEntries.length > 0) {
                const nav = navEntries[0];
                perfData.domInteractive = nav.domInteractive.toFixed(2) + "ms";
            }
        }

        return {
            status: 'success',
            data: perfData
        };
    } catch (error) {
        return { status: 'blocked', error: error.message };
    }
}
