import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`homepage has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

const mobileAnchors = [
  '/compress-image-to-50kb',
  '/passport-photo-resizer',
  '/photo-signature-resizer',
  '/heic-to-jpg',
  '/image-to-pdf',
];
for (const width of [320, 360, 375, 390, 430]) {
  for (const route of mobileAnchors) {
    test(`${route} is usable without horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('button').first()).toBeVisible();
    });
  }
}

test('primary navigation remains visible on a 390 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Exact size' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'How it works' })).toBeVisible();
});

test('primary navigation and uploader are keyboard reachable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByText('Skip to main content')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Choose images' })).toBeVisible();
});

test('color picker provides a keyboard pixel-sampling alternative', async ({ page }) => {
  await page.goto('/image-color-picker');
  const fixture = await import('../../scripts/generate-fixtures.mjs').then((module) =>
    module.generateFixtures(),
  );
  await page.locator('input[type=file]').setInputFiles(`${fixture}/transparent.png`);
  const canvas = page.getByLabel(/Image color sampling canvas/);
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('.palette-row button')).toHaveCount(1);
});
