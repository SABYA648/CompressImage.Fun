import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const base = process.env.BASE_URL ?? 'http://web:8080';
const routes = [
  '/',
  '/compress-image-to-50kb',
  '/resize-image',
  '/image-to-base64',
  '/guides/how-to-compress-image-to-exact-file-size',
  '/tools',
];
await mkdir('artifacts/lighthouse', { recursive: true });
const chrome = await launch({
  // CHROME_PATH lets a runner reuse a Chromium it already has instead of the
  // browser Playwright would download for its own pinned version.
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
});
const summaries = [];
try {
  for (const route of routes) {
    const result = await lighthouse(`${base}${route}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        disabled: false,
      },
      throttlingMethod: 'simulate',
    });
    if (!result?.lhr) throw new Error(`Lighthouse produced no report for ${route}`);
    const lhr = result.lhr;
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-');
    await writeFile(resolve('artifacts/lighthouse', `${slug}.json`), JSON.stringify(lhr));
    summaries.push({
      route,
      performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
      lcpMs: Math.round(lhr.audits['largest-contentful-paint']?.numericValue ?? 0),
      tbtMs: Math.round(lhr.audits['total-blocking-time']?.numericValue ?? 0),
      cls: Number((lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
    });
  }
} finally {
  await chrome.kill();
}
await writeFile('artifacts/lighthouse/summary.json', JSON.stringify(summaries, null, 2));
console.table(summaries);
