const { chromium, firefox } = require('playwright');
const fs = require('fs');

const TARGET_URL = 'http://localhost:8000';

// Run our FP scripts on a browser set-up and collect outputs
// Return a JS Object payload with our honeypot reuslts to write into JSON
async function runBrowserAudit(browserType, launchOptions, profileName) {
    console.log(`\n[+] Launching Profile: ${profileName}...`);
    
    const browser = await browserType.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();

    // navigate to our honeypot
    await page.goto(TARGET_URL);
    
    // wait for the audit to finish rendering
    await page.waitForSelector('.status-success', { timeout: 10000 });
    
    // extract the payload from window object
    const rawPayload = await page.evaluate(() => window.fpPayload);
    
    await browser.close();
    
    // return payload
    console.log(`[SUCCESS] ${profileName} Audit Complete.`);
    return { profile: profileName, data: rawPayload };
}

// Execute PlayWright instance on all of our browser set-ups
// TODO : Add extension variants
async function executeMatrix() {
    const results = [];

    // 1. Vanilla Chromium
    results.push(await runBrowserAudit(chromium, { headless: true }, 'Chromium_Vanilla'));

    // 2. Vanilla Firefox
    results.push(await runBrowserAudit(firefox, { headless: true }, 'Firefox_Vanilla'));

    // 3. Firefox with extensions / strict mode variations
    // a) Resist Fingerpriting Baseline
    results.push(await runBrowserAudit(firefox, { 
        headless: true,
        firefoxUserPrefs: {
            'privacy.resistFingerprinting': true,
            'webgl.disabled': true
        }
    }, 'Firefox_Hardened'));
    // b) TODO

    // Save the matrix to JSON file - covert NODE.js results payloads and write as JSON
    fs.writeFileSync('./results_matrix.json', JSON.stringify(results, null, 2));
    console.log('\n[!] Audit Matrix saved to results_matrix.json');
}

executeMatrix().catch(console.error);
