const { chromium, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'http://localhost:8000';

// Experimental extension variatons
async function runBrowserAudit(browserType, launchOptions, profileName, isExtension = false) {
    console.log(`\n[+] Launching Profile: ${profileName}...`);
    
    let browserContext;
    let page;

    if (isExtension) {
        // For extensions we require a persistent context
        const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'playwright-'));
        browserContext = await chromium.launchPersistentContext(userDataDir, launchOptions);
        page = browserContext.pages()[0] || await browserContext.newPage();
    } else {
        const browser = await browserType.launch(launchOptions);
        browserContext = await browser.newContext();
        page = await browserContext.newPage();
    }

    await page.goto(TARGET_URL);
    await page.waitForSelector('.status-success', { timeout: 10000 });
    const rawPayload = await page.evaluate(() => window.fpPayload);
    
    if (isExtension) {
        await browserContext.close();
    } else {
        await browserContext.browser().close();
    }
    
    console.log(`[SUCCESS] ${profileName} Audit Complete.`);
    return { profile: profileName, data: rawPayload };
}

async function executeMatrix() {
    const results = [];

    // 1. Vanilla Chromium
    results.push(await runBrowserAudit(chromium, { headless: true }, 'Chromium_Vanilla'));

    // 2. Vanilla Firefox
    results.push(await runBrowserAudit(firefox, { headless: true }, 'Firefox_Vanilla'));

    // 3. Hardened Firefox
    results.push(await runBrowserAudit(firefox, { 
        headless: true,
        firefoxUserPrefs: { 'privacy.resistFingerprinting': true, 'webgl.disabled': true }
    }, 'Firefox_Hardened'));

    // 4. Simulated Brave (Strict Tracking Protection via flags)
    results.push(await runBrowserAudit(chromium, { 
        headless: true,
        args: ['--disable-reading-from-canvas', '--disable-webaudio'] 
    }, 'Chromium_Simulated_Brave'));

    // 5. Chromium + uBlock Origin (requires path to unzipped extension)
    const pathToExtension = require('path').join(__dirname, '../../uBlock0.chromium'); 
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

    fs.writeFileSync('./results_matrix.json', JSON.stringify(results, null, 2));
    console.log('\n[!] Audit Matrix saved to results_matrix.json');
}

executeMatrix().catch(console.error);
