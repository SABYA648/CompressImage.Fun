import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { optimizeExactSize } from './exact-size.js';

const directories: string[] = [];
afterEach(async () =>
  Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  ),
);

const noisyFixture = async (
  width = 900,
  height = 700,
): Promise<{ path: string; bytes: number }> => {
  const directory = await mkdtemp(join(tmpdir(), 'compress-exact-'));
  directories.push(directory);
  const pixels = Buffer.alloc(width * height * 3);
  for (let index = 0; index < pixels.length; index += 1)
    pixels[index] = (index * 31 + Math.floor(index / 17) * 13) % 256;
  const buffer = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 96 })
    .toBuffer();
  const path = join(directory, 'photo.jpg');
  await writeFile(path, buffer);
  return { path, bytes: buffer.length };
};

describe('exact-size optimizer', () => {
  it('keeps the output at or below the requested byte limit', async () => {
    const fixture = await noisyFixture();
    const result = await optimizeExactSize({
      inputPath: fixture.path,
      format: 'jpeg',
      targetBytes: 50 * 1024,
      width: 900,
      height: 700,
      minQuality: 35,
      preserveMetadata: false,
      limitInputPixels: 100_000_000,
      hasAlpha: false,
    });
    expect(result).not.toBeNull();
    expect(result!.buffer.length).toBeLessThanOrEqual(50 * 1024);
    expect(result!.iterations).toBeLessThanOrEqual(112);
    expect((await sharp(result!.buffer).metadata()).format).toBe('jpeg');
  });

  it('uses dimension fallback for an extreme target without an unbounded loop', async () => {
    const fixture = await noisyFixture(1200, 900);
    const result = await optimizeExactSize({
      inputPath: fixture.path,
      format: 'jpeg',
      targetBytes: 20 * 1024,
      width: 1200,
      height: 900,
      minQuality: 55,
      preserveMetadata: false,
      limitInputPixels: 100_000_000,
      hasAlpha: false,
    });
    expect(result).not.toBeNull();
    expect(result!.buffer.length).toBeLessThanOrEqual(20 * 1024);
    expect(result!.width).toBeLessThan(1200);
    expect(result!.iterations).toBeLessThanOrEqual(112);
  }, 15_000);
});
