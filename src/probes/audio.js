import { sha256 } from '../utils/hash.js';

export async function getAudioFingerprint() {
    try {
        // Use OfflineAudioContext to render audio in memory without playing it
        const BaseAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!BaseAudioContext) {
            return { status: 'unsupported', hash: null };
        }

        const context = new BaseAudioContext(1, 44100, 44100);
        
        // Create an oscillator (generate a tone)
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);

        // Create a dynamics compressor (for controlled variance)
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, context.currentTime);
        compressor.knee.setValueAtTime(40, context.currentTime);
        compressor.ratio.setValueAtTime(12, context.currentTime);
        compressor.attack.setValueAtTime(0, context.currentTime);
        compressor.release.setValueAtTime(0.25, context.currentTime);

        // Connect Oscillator -> Compressor -> Destination nodes
        oscillator.connect(compressor);
        compressor.connect(context.destination);

        oscillator.start(0);
        
        // Render the audio
        const buffer = await context.startRendering();
        
        // Extract the channel data (Float32Array) and convert it to a string for hashing
        const channelData = buffer.getChannelData(0);
        const dataString = channelData.slice(0, 5000).join(','); // Take a sample of the array
        
        const hash = await sha256(dataString);
        
        return { 
            status: 'success', 
            hash: hash 
        };
    } catch (error) {
        // If the browser strictly blocks this audio fingerprinting pattern, we catch it here
        return { status: 'blocked', error: error.message };
    }
}
