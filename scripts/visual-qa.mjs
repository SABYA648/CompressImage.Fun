import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { generateFixtures } from './generate-fixtures.mjs';

/* global document */

const base = process.env.BASE_URL ?? 'http://web:8080';
const outputRoot = resolve('artifacts/visual-qa');
const fixtureRoot = await generateFixtures();
const photo = resolve(fixtureRoot, 'photograph.jpg');
const transparent = resolve(fixtureRoot, 'transparent.png');
const captures = [];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: 'no-preference' });
const page = await context.newPage();

const capture = async (name, route, { width = 1440, height = 1000, ready } = {}) => {
  await page.setViewportSize({ width, height });
  const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  if (ready) await ready(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error(`${route} overflows horizontally at ${width}px`);
  const path = resolve(outputRoot, `${name}.png`);
  await page.screenshot({ path, animations: 'allow' });
  captures.push({ name, route, status: response?.status(), width, height, overflow });
};

try {
  for (const width of [375, 390, 768, 1440, 1920]) {
    await capture(`home-${width}`, '/', { width, height: width < 700 ? 844 : 1000 });
  }

  await capture('home-selected', '/', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(photo);
      await currentPage.getByRole('button', { name: /Process image/ }).scrollIntoViewIfNeeded();
    },
  });

  await capture('home-result', '/', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(photo);
      await currentPage.getByRole('button', { name: /Process image/ }).click();
      await currentPage.getByRole('heading', { name: 'Results' }).waitFor({ timeout: 45_000 });
      await currentPage.getByRole('heading', { name: 'Results' }).scrollIntoViewIfNeeded();
    },
  });

  await capture('exact-size-result', '/compress-image-to-50kb', {
    width: 390,
    height: 844,
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(photo);
      await currentPage.getByRole('button', { name: /Process image/ }).click();
      await currentPage.getByRole('heading', { name: 'Results' }).waitFor({ timeout: 45_000 });
      await currentPage.getByRole('heading', { name: 'Results' }).scrollIntoViewIfNeeded();
    },
  });

  await capture('resize-result', '/resize-image', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(photo);
      await currentPage.getByLabel('Width').fill('640');
      await currentPage.getByLabel('Height').fill('360');
      await currentPage.getByLabel('Fit').selectOption('fill');
      await currentPage.getByRole('button', { name: /Process image/ }).click();
      await currentPage.getByRole('heading', { name: 'Results' }).waitFor({ timeout: 45_000 });
      await currentPage.getByRole('heading', { name: 'Results' }).scrollIntoViewIfNeeded();
    },
  });

  await capture('convert-result', '/png-to-webp', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(transparent);
      await currentPage.getByRole('button', { name: /Process image/ }).click();
      await currentPage.getByRole('heading', { name: 'Results' }).waitFor({ timeout: 45_000 });
      await currentPage.getByRole('heading', { name: 'Results' }).scrollIntoViewIfNeeded();
    },
  });

  await capture('base64-local', '/image-to-base64', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(transparent);
      await currentPage.getByLabel('Encoded text').scrollIntoViewIfNeeded();
    },
  });

  await capture('metadata-result', '/image-metadata', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles(photo);
      await currentPage.getByRole('button', { name: 'Inspect metadata' }).click();
      await currentPage
        .getByRole('heading', { name: 'Metadata', exact: true })
        .waitFor({ timeout: 30_000 });
      await currentPage
        .getByRole('heading', { name: 'Metadata', exact: true })
        .scrollIntoViewIfNeeded();
    },
  });

  await capture('tools-search', '/tools', {
    ready: async (currentPage) => {
      await currentPage.getByLabel('Search tools').fill('passport');
      await currentPage.getByLabel('Search tools').scrollIntoViewIfNeeded();
    },
  });

  await capture('guide-tool', '/guides/how-to-resize-a-passport-or-form-photo', {
    ready: async (currentPage) => {
      await currentPage.locator('.guide-tool').scrollIntoViewIfNeeded();
    },
  });

  await capture('useful-404', '/visual-qa-missing-route', {
    width: 390,
    height: 844,
    ready: async (currentPage) => {
      await currentPage.locator('.error-scene').waitFor();
    },
  });

  await capture('validation-error', '/', {
    ready: async (currentPage) => {
      await currentPage.locator('input[type=file]').setInputFiles({
        name: 'not-an-image.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not an image'),
      });
      await currentPage.getByText('Choose a supported image file.').waitFor();
      await currentPage.getByText('Choose a supported image file.').scrollIntoViewIfNeeded();
    },
  });
} finally {
  await context.close();
  await browser.close();
}

await writeFile(resolve(outputRoot, 'summary.json'), JSON.stringify(captures, null, 2));
console.table(captures);
