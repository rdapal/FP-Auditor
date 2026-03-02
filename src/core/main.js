import { getCanvasFingerprint } from '../probes/canvas.js';
import { getAudioFingerprint } from '../probes/audio.js';
import { getHardwareFingerprint } from '../probes/hardware.js';

async function runAudit() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p>Initializing 2026 Audit Sequence...</p>';

    // Run probes concurrently for speed
    const [canvasResult, audioResult, hardwareResult] = await Promise.all([
        getCanvasFingerprint(),
        getAudioFingerprint(),
        getHardwareFingerprint()
    ]);

    // Format the output
    resultsContainer.innerHTML = `
        <h3>Module A: Baseline Vectors</h3>
        <ul>
            <li><strong>Canvas Hash:</strong> ${canvasResult.status === 'success' ? canvasResult.hash : `[BLOCKED] ${canvasResult.error}`}</li>
            <li><strong>AudioContext Hash:</strong> ${audioResult.status === 'success' ? audioResult.hash : `[BLOCKED] ${audioResult.error}`}</li>
        </ul>

        <h3>Module B & C: Hardware & Functionality</h3>
        <ul>
            <li><strong>Status:</strong> ${hardwareResult.status}</li>
            <li><strong>CPU Cores:</strong> ${hardwareResult.data?.cores}</li>
            <li><strong>Device Memory (GB):</strong> ${hardwareResult.data?.memory}</li>
            <li><strong>Screen Resolution:</strong> ${hardwareResult.data?.screenResolution} (Color Depth: ${hardwareResult.data?.colorDepth})</li>
            <li><strong>Permissions Leakage:</strong> Geolocation [${hardwareResult.data?.permissions?.geolocation}], Notifications [${hardwareResult.data?.permissions?.notifications}]</li>
        </ul>
    `;
    
    // Log full payload to console for debugging
    console.log("--- FP-AUDITOR RAW PAYLOAD ---");
    console.log({ canvasResult, audioResult, hardwareResult });
}

window.addEventListener('DOMContentLoaded', runAudit);
