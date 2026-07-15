const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:5173/#/list');
  await page.waitForSelector('text=Sonnet 1');
  await page.waitForTimeout(200);
  await page.screenshot({ path: process.argv[2] + '/bg-list.png', fullPage: false });

  await page.goto('http://localhost:5173/#/sonnet/18');
  await page.waitForSelector('text=Sonnet 18');
  await page.waitForTimeout(200);
  await page.screenshot({ path: process.argv[2] + '/bg-detail.png', fullPage: false });

  await browser.close();
})();
