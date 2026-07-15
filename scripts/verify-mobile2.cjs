const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const outDir = process.argv[2];
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('http://localhost:5173/#/list');
  await page.waitForSelector('text=Sonnet 1');
  await page.waitForTimeout(300);

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log('scrollWidth:', scrollWidth, 'clientWidth:', clientWidth);

  await page.screenshot({ path: outDir + '/mobile-list-header.png', fullPage: false });

  // Simulate touch on a row to trigger the animation
  await page.tap('[data-sonnet-number="18"]').catch(() => {});
  await page.waitForTimeout(300);
  // go back since tap navigates
  await page.goto('http://localhost:5173/#/list');
  await page.waitForSelector('text=Sonnet 1');

  // Trigger via dispatching touchstart directly without navigating (avoids the click-through)
  await page.evaluate(() => {
    const rowEl = document.querySelector('[data-sonnet-number="18"]');
    const touch = new Touch({ identifier: 1, target: rowEl, clientX: 100, clientY: 100 });
    const ev = new TouchEvent('touchstart', { touches: [touch], bubbles: true, cancelable: true });
    rowEl.dispatchEvent(ev);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outDir + '/mobile-animation.png', fullPage: false });

  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
