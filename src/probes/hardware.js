export async function getHardwareFingerprint() {
    const hwData = {};

    try {
        // 1. Core Hardware APIs
        hwData.cores = navigator.hardwareConcurrency || 'unknown';
        hwData.memory = navigator.deviceMemory || 'unknown'; // Note: Firefox often spoof/caps this
        hwData.platform = navigator.platform || 'unknown';
        
        // 2. Screen & Display metrics
        hwData.screenResolution = `${window.screen.width}x${window.screen.height}`;
        hwData.colorDepth = window.screen.colorDepth;
        
        // 3. Permissions Probing (inspired on "Functionality fingerprinting" paper's claim)
        // We check the status without actually requesting the prompt
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const geo = await navigator.permissions.query({ name: 'geolocation' });
                const notif = await navigator.permissions.query({ name: 'notifications' });
                hwData.permissions = {
                    geolocation: geo.state,
                    notifications: notif.state
                };
            } catch (e) {
                hwData.permissions = 'query_failed';
            }
        } else {
            hwData.permissions = 'unsupported';
        }

        return {
            status: 'success',
            data: hwData
        };
    } catch (error) {
        return { status: 'blocked', error: error.message };
    }
}
