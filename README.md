
## 🎯 Motivation

In the paper "Fingerprinting the Fingerprinters", the authors establish that fingerprinting is an invasive, stateless tracking technique. They highlight a fundamental tension in browser security: "Existing browser fingerprinting countermeasures can be classified into two categories: content blocking and API restriction". Content blocking is prone to breakage when multi-purpose scripts are used, while API restriction provides reliable protection but can break legitimate website functionality.

While the original paper focused on measuring how often websites *deploy* fingerprinting scripts (finding it on 10.18% of the top 100K websites), this analysis flips the perspective. In this study, we measure how modern browser engines in 2026 (Chromium, Gecko/Firefox, and WebKit/Safari) *defend* against common collection techniques utilized for fingerprinting users. Utilizing a local honeypot, we stress-test whether browsers rely on content blocking, API restriction, or hardware spoofing, and evaluate the effectiveness of these defenses.

<br/>

## 📏 Methodology

To ensure a highly controlled environment, we built a local automated data collection honeypot (`FP-Auditor`).

### 1. Honeypot Engineering (The Attack Surface)
A local JavaScript environment was built to deploy the exact fingerprinting heuristics defined in the paper:
* **Rendering Vectors:** Utilizing the `Canvas` and `AudioContext` APIs to extract mathematical rendering variances.
* **Functionality & Hardware Probing:** Querying `navigator.hardwareConcurrency` and memory APIs to profile the host machine.
* **Algorithmic Timing:** Using the `Performance` API to measure execution latency, enabling CPU tier profiling.

### 2. Browser Automation Matrix
We utilized **Microsoft Playwright** to orchestrate an automated testing matrix across six distinct browser profiles, capturing the exact payload leaked to the tracker:
1.  `Chromium_Vanilla` (Baseline)
2.  `Firefox_Vanilla` (Baseline)
3.  `WebKit_Safari` (Testing Apple's claim to enhanced browsing privacy)
4.  `Firefox_Hardened` (Strict API restriction via `privacy.resistFingerprinting`)
5.  `Chromium_Incognito` (Testing isolated sessions)
6.  `Chromium_uBlock` (Testing extension-based content blocking)

<br/>

## 📊 Summary of Results

Our findings successfully validate the paper's claims regarding the friction between API restriction and content blocking.

### Hardware Spoofing (Functionality Probing)

![Hardware Spoofing: Reported CPU Cores](./docs/plot_cores.png)

Probing for hardware functionality shows some notable leakage variation. Our host machine utilizes a 20-core CPU. 
* **Vanilla & Incognito** profiles leaked the true 20-core architecture. 
* **WebKit (Safari)** actively spoofed the response, capping the reported hardware at 8 cores to blend the user into a generic Mac/PC pool.
* **Firefox Hardened** most agressive spoofing, capping the reported hardware at 4 cores.

### Rendering Vectors & Content Blocking Failures

![Rendering Vectors: Canvas Payload Size](./docs/plot_canvas.png)

This metric exposes the flaw in content blocking mentioned in the paper, specifically because our honeypot runs on `localhost` (an unknown domain, not on an ad-blocker list) 
* **uBlock Origin** completely failed to block the Canvas API, leaking a full ~17KB payload due to the domain not being included in any domain lists. 
* **Incognito mode** offered zero protection against stateless API access as it's simply a session without saving any data.
* **Firefox Hardened** is the only profile that successfully mitigated the attack via total **API Restriction**, blocking the data extraction and reducing the payload to a ~2KB blank footprint.

### Algorithmic Defense (Timing Variation)

![Algorithmic Defense: Execution Latency Variation](./docs/plot_timing.png)

Algorithmic fingerprinting measures execution differences to profile users.
* Vanilla browsers allowed highly precise execution times (e.g 7.60ms to 13.90ms), allowing the website to confidently profile the CPU speed.
* **Firefox Hardened** defended against this by introducing some latency variation, artificially rounding the clock to **16.67ms** (matching a 60Hz VSync). While this effectively destroys timing attacks, it perfectly illustrates the paper's thesis that this countermeasure breaks legitimate performance debugging for web developers, as execution performance data is totally obfuscated.

<br/>

## 📁 Project

### Project Structure
```text
fp-auditor/
├── index.html              # The honeypot dashboard
├── src/
│   ├── probes/             # Canvas, Audio, Hardware, and Timing payloads
│   └── core/
│       └── audit.js        # Playwright automation matrix script
├── visualize.py            # Matplotlib data visualization plotting script
├── results_matrix.json     # Raw data output from the audit
└── docs/                   # Generated PNG plots

### Usage
1. Initalize the Node envrionment and install PlayWright:
```bash
npm install playwright
npx playwright install webkit
```

2. Start the local honeypot server:
```bash
python3 -m http.server 8000
```

3. Execute the auditing script to generate our results matrix (in a seperate terminal):
```bash
node src/core/audit.js
```

4. Generate the analysis plots:
```bash
python3 visualize.py
```
<br/>

## 📚 References

**[1]** Umar Iqbal, Steven Englehardt, and Zubair Shafiq. 2020. Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors. CoRR abs/2008.04480, (2020). Retrieved from https://arxiv.org/abs/2008.04480

