import { test } from '@playwright/test';

test('take screenshots', async ({ page }) => {
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Let animations settle
  
  // Desktop screenshot
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'desktop-view.png', fullPage: false });
  
  // Mobile screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'mobile-view.png', fullPage: false });
  
  // Full page screenshot
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'full-page.png', fullPage: true });
  
  console.log('Screenshots saved to project directory');
});