// Smoke tests for GEII Visual Toolbox
// Requires: npm i puppeteer
const puppeteer = require('puppeteer');

(async () => {
    console.log("Starting smoke tests...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Test 1: Home page loads
    console.log("Testing Home Galaxy...");
    await page.goto('http://127.0.0.1:8000/Maths/index.html');
    await page.waitForSelector('.home-hero h1');
    const title = await page.$eval('.home-hero h1', el => el.textContent);
    if (!title.includes("Constellation")) throw new Error("Home page failed to load");
    console.log("✓ Home page loaded");

    // Test 2: Signal Observatory loads
    console.log("Testing Signal Observatory...");
    await page.goto('http://127.0.0.1:8000/Maths/apps/signal-observatory/index.html');
    await page.waitForSelector('#plot-raw-time .js-plotly-plot');
    console.log("✓ Observatory Plotly instances initialized");

    // Test 3: Apps boot correctly
    const apps = ['circuits', 'automatique', 'numerique', 'maths'];
    for (const app of apps) {
        console.log(`Testing ${app}...`);
        await page.goto(`http://127.0.0.1:8000/Maths/apps/${app}/index.html`);
        await page.waitForSelector('.hud-scanlines');
        console.log(`✓ ${app} booted successfully`);
    }

    console.log("All smoke tests passed!");
    await browser.close();
})();
