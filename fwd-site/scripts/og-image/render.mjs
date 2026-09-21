/**
 * Renders the social share image (public/og-image.png) from template.html.
 *
 * Run with:  node scripts/og-image/render.mjs
 *
 * Renders at 2x in headless Chromium then downscales to 1200x630 so the
 * text stays crisp. Edit template.html to change the design.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const template = resolve(here, 'template.html');
const output = resolve(here, '../../public/og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
});

await page.goto(`file://${template}`);
await page.waitForLoadState('networkidle');

const buffer = await page.screenshot({ type: 'png' });
await browser.close();

// Downscale the 2x capture back to the 1200x630 Open Graph size.
await page.close?.();
const sharpish = await chromium.launch();
const scaler = await sharpish.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await scaler.setContent(
  `<style>html,body{margin:0;padding:0}img{display:block;width:${WIDTH}px;height:${HEIGHT}px}</style>` +
  `<img src="data:image/png;base64,${buffer.toString('base64')}">`
);
await scaler.waitForLoadState('load');
await scaler.locator('img').screenshot({ path: output });
await sharpish.close();

console.log(`Wrote ${output} (${WIDTH}x${HEIGHT})`);
