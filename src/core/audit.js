const { chromium, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TARGET_URL = 'http://localhost:8000';
const RESULTS_FILE = './results_matrix.json';

// Experimental extension variations
async function runBrowserAudit(browserType, launchOptions, profileName, isExtension = false) {
    console.log(`\n[+] Launching Profile: ${profileName}...`);
    
    let browserContext;
    let browser;
    let page;

    try {
        if (isExtension) {
            // For extensions we require a persistent context
            const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-'));
            browserContext = await chromium.launchPersistentContext(userDataDir, launchOptions);
            page = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();
        } else {
            browser = await browserType.launch(launchOptions);
            browserContext = await browser.newContext();
            page = await browserContext.newPage();
        }

        await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
        
        // Poll the window object
        await page.waitForFunction(() => window.fpPayload !== undefined, { timeout: 15000 });
        
        const rawPayload = await page.evaluate(() => window.fpPayload);
        console.log(`[SUCCESS] ${profileName} Audit Complete.`);
        
	// Return our payload and reset the var for next audit 
        return { profile: profileName, data: rawPayload || null };

    } catch (error) {
        console.error(`[!] Error auditing ${profileName}:`, error.message);
        // maintain matrix struct on failure
        return { profile: profileName, data: null, error: error.message };
    } finally {
        // close open contexts depending on how they were launched
        if (isExtension && browserContext) {
            await browserContext.close();
        } else if (browser) {
            await browser.close();
        }
    }
}

async function executeMatrix() {
    console.log('[*] Starting FP-Auditor Automation Matrix...');
    const results = [];

    results.push(await runBrowserAudit(chromium, { headless: true }, 'Chromium_Vanilla'));
    results.push(await runBrowserAudit(firefox, { headless: true }, 'Firefox_Vanilla'));
    
    results.push(await runBrowserAudit(firefox, { 
        headless: true,
        firefoxUserPrefs: { 'privacy.resistFingerprinting': true, 'webgl.disabled': true }
    }, 'Firefox_Hardened'));

    results.push(await runBrowserAudit(chromium, { 
        headless: true,
        args: ['--disable-reading-from-canvas', '--disable-webaudio'] 
    }, 'Chromium_Simulated_Brave'));

    const pathToExtension = path.join(__dirname, '../../uBlock0.chromium'); 
    if (fs.existsSync(pathToExtension)) {
        results.push(await runBrowserAudit(chromium, {
            headless: false, // Extensions often require headful mode
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`
            ]
        }, 'Chromium_uBlock', true));
    } else {
        console.log('\n[!] Skipping uBlock test: Extension folder not found.');
    }

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    console.log(`\n[*] Audit Matrix saved to ${RESULTS_FILE}`);
}

executeMatrix().catch(console.error);
