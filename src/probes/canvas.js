import { sha256 } from '../utils/hash.js';

export async function getCanvasFingerprint() {
    try {
        // 1. Create a canvas element (not added to the DOM, so it's invisible)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 2. Draw a standard background rectangle
        ctx.fillStyle = "rgb(255,0,255)";
        ctx.beginPath();
        ctx.rect(20, 20, 150, 100);
        ctx.fill();
        
        // 3. Draw text with varied styling to force anti-aliasing differences
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        
        ctx.fillStyle = "#069";
        // See how the OS handles missing fonts and emoji rendering
        ctx.font = "11pt no-real-font-123"; 
        ctx.fillText("Cwm fjordbank glyphs vext quiz, 😃", 2, 15);
        
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "18pt Arial";
        ctx.fillText("Cwm fjordbank glyphs vext quiz, 😃", 4, 45);

        // 4. Extract the raw image data as a Base64 URI
        const dataURI = canvas.toDataURL();
        
        // 5. Hash the output for logging
        const hash = await sha256(dataURI);
        return { 
            status: 'success', 
            hash: hash, 
            rawLength: dataURI.length 
        };
    } catch (error) {
        // If the browser strictly blocks the API we catch here
        return { status: 'blocked', error: error.message };
    }
}
