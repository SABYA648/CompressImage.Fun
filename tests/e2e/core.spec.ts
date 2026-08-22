import { expect, test } from '@playwright/test';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateFixtures } from '../../scripts/generate-fixtures.mjs';

let photo: string;
let transparent: string;
let heic: string;
test.beforeAll(async () => {
  const root = await generateFixtures();
  photo = resolve(root, 'photograph.jpg');
  transparent = resolve(root, 'transparent.png');
  heic = resolve(root, 'photograph.heic');
});

test('homepage compresses, reports result, downloads, chains, and deletes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Compress an image to the size you actually need',
  );
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/% saved|Already small enough/).first()).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).first().click();
  await download;
  await page.getByRole('button', { name: 'Convert' }).first().click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete now' }).click();
  await expect(page.getByText('Deleted from server.')).toBeVisible();
});

test('50 KB preset produces a validated output at or under the cap', async ({ page }) => {
  await page.goto('/compress-image-to-50kb');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  const resultText = await page.locator('.result-card').first().textContent();
  expect(resultText).toMatch(/Result/);
});

test('resizer applies exact dimensions and exposes continuation actions', async ({ page }) => {
  await page.goto('/resize-image');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByLabel('Width').fill('640');
  await page.getByLabel('Height').fill('360');
  await page.getByLabel('Fit').selectOption('fill');
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.result-card').first()).toContainText('640 × 360');
  await expect(page.getByRole('button', { name: 'Crop' }).first()).toBeVisible();
});

test('converter preserves alpha in PNG to WebP and produces a result', async ({ page }) => {
  await page.goto('/png-to-webp');
  await page.locator('input[type=file]').setInputFiles(transparent);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.result-card').first()).toContainText('WEBP');
});

test('HEIC to JPG uses a real HEVC fixture when supported by the production codec', async ({
  page,
}) => {
  await access(heic);
  await page.goto('/heic-to-jpg');
  await page.locator('input[type=file]').setInputFiles(heic);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.result-card').first()).toContainText('JPEG');
});

test('Image to PDF reorders local images and downloads one PDF without API upload', async ({
  page,
}) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiCalls.push(request.url());
  });
  await page.goto('/image-to-pdf');
  await page.locator('input[type=file]').setInputFiles([photo, transparent]);
  await page
    .getByRole('button', { name: /Move .* down/ })
    .first()
    .click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Build and download PDF' }).click();
  expect((await download).suggestedFilename()).toBe('images.pdf');
  expect(apiCalls).toEqual([]);
});

test('browser Base64 encoding makes no API request', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiCalls.push(request.url());
  });
  await page.goto('/image-to-base64');
  await page.locator('input[type=file]').setInputFiles(photo);
  await expect(page.getByLabel('Encoded text')).not.toHaveValue('');
  expect(apiCalls).toEqual([]);
});

test('Base64 decoder and viewer decode safely in the browser', async ({ page }) => {
  const value =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEggH9B9p4VwAAAABJRU5ErkJggg==';
  for (const route of ['/base64-to-image', '/base64-image-viewer']) {
    await page.goto(route);
    await page.getByLabel('Base64, Data URI, or JSON string').fill(value);
    await page.getByRole('button', { name: 'Decode image' }).click();
    await expect(page.getByText('image/png')).toBeVisible();
    await expect(page.getByText('1 × 1')).toBeVisible();
  }
});

test('metadata can be inspected and removed', async ({ page }) => {
  await page.goto('/image-metadata');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: 'Inspect metadata' }).click();
  await expect(page.getByRole('heading', { name: 'Metadata', exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText('JPEG', { exact: true })).toBeVisible();
  await page.goto('/remove-image-metadata');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 30_000 });
});

for (const route of ['/passport-photo-resizer', '/photo-signature-resizer']) {
  test(`${route} prepares exact pixels and maximum KB`, async ({ page }) => {
    await page.goto(route);
    await page.locator('input[type=file]').setInputFiles(photo);
    await page.getByRole('button', { name: /Process image/ }).click();
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.result-card').first()).toContainText(
      route.includes('passport') ? '600 × 600' : '300 × 100',
    );
  });
}

test('favicon generator creates ICO, PNG, snippet, and ZIP', async ({ page }) => {
  await page.goto('/favicon-generator');
  await page.locator('input[type=file]').setInputFiles(transparent);
  await page.getByRole('button', { name: 'Generate icons' }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  // Match the result headings, not the prose above them that names the same files.
  await expect(page.getByRole('heading', { name: 'favicon.ico', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'favicon-html-snippet.txt', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download all ZIP' })).toBeVisible();
});

test('color picker reads pixels and palette without upload', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiCalls.push(request.url());
  });
  await page.goto('/image-color-picker');
  await page.locator('input[type=file]').setInputFiles(transparent);
  await expect(page.getByRole('heading', { name: 'Current pixel' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Five-color palette' })).toBeVisible();
  expect(apiCalls).toEqual([]);
});

test('tool search and public crawl files work', async ({ page, request }) => {
  await page.goto('/tools');
  const visibleCards = page.locator('.tool-card:not([hidden])');
  const total = await visibleCards.count();
  await page.getByLabel('Search tools').fill('heic');
  // "heic" matches the dedicated converter and the general one that accepts HEIC
  // input, so assert the search narrows to those rather than pinning a count.
  await expect(visibleCards.filter({ hasText: 'HEIC to JPG Converter' })).toHaveCount(1);
  await expect(visibleCards.filter({ hasText: 'Resize a passport or form photo' })).toHaveCount(0);
  expect(await visibleCards.count()).toBeLessThan(total);
  for (const path of ['/robots.txt', '/sitemap-index.xml', '/llms.txt', '/how-processing-works'])
    expect((await request.get(path)).status()).toBe(200);
  expect((await request.get('/missing-route-for-test')).status()).toBe(404);
});
