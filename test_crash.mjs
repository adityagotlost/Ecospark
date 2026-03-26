import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('BROWSER_ERROR:', msg.text());
  });
  page.on('pageerror', err => {
    console.error('FATAL_PAGE_ERROR:', err.message, err.stack);
  });
  
  console.log('Navigating to leaderboard...');
  // Note: Localhost:4173 requires authentication, which redirects to Auth.
  // We need to capture the exact error so we will inject an error event hook.
  
  await page.goto('http://localhost:4173/leaderboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Done mapping log.');
  await browser.close();
})();
