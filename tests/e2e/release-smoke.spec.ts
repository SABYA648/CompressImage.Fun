import { expect, test } from '@playwright/test';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateFixtures } from '../../scripts/generate-fixtures.mjs';

let photo: string;
let heic: string;
test.beforeAll(async () => {
  const root = await generateFixtures();
  photo = resolve(root, 'photograph.jpg');
  heic = resolve(root, 'photograph.heic');
});

test('homepage compresses, downloads, and deletes without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Compress images');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).first().click();
  await download;
  await page.getByRole('button', { name: 'Delete now' }).click();
  await expect(page.getByText('Deleted from server.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('exact-size 50 KB page works', async ({ page }) => {
  await page.goto('/compress-image-to-50kb');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
});

test('HEIC to JPG through Docker stack', async ({ page }) => {
  await access(heic);
  await page.goto('/heic-to-jpg');
  await page.locator('input[type=file]').setInputFiles(heic);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.result-card').first()).toContainText('JPEG');
});

test('AVIF conversion through Docker stack', async ({ page }) => {
  await page.goto('/compress-avif');
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.getByRole('button', { name: /Process image/ }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('.result-card').first()).toContainText('AVIF');
});

test('browser Base64 tool makes zero API uploads', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiCalls.push(request.url());
  });
  await page.goto('/image-to-base64');
  await page.locator('input[type=file]').setInputFiles(photo);
  await expect(page.getByLabel('Encoded text')).not.toHaveValue('');
  expect(apiCalls).toEqual([]);
});

test('390 px viewport homepage has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
});
