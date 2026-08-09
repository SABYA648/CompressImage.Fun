import { mkdir, stat, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { optimizeExactSize } from '../apps/processor/dist/exact-size.js';
import { generateFixtures } from './generate-fixtures.mjs';

const root = await generateFixtures();
await mkdir('artifacts/benchmarks', { recursive: true });
const targets = [20, 50, 100, 200, 500, 1024];
const fixtures = ['photograph.jpg', 'illustration.png'];
const results = [];
for (const fixture of fixtures) {
  const path = resolve(root, fixture);
  const info = await sharp(path).metadata();
  const input = await stat(path);
  for (const targetKB of targets) {
    const started = performance.now();
    const result = await optimizeExactSize({
      inputPath: path,
      format: fixture.endsWith('.png') ? 'png' : 'jpeg',
      targetBytes: targetKB * 1024,
      width: info.width,
      height: info.height,
      minQuality: 35,
      preserveMetadata: false,
      limitInputPixels: 100_000_000,
      hasAlpha: Boolean(info.hasAlpha),
    });
    results.push({
      fixture,
      inputBytes: input.size,
      targetKB,
      success: Boolean(result),
      outputBytes: result?.buffer.length,
      elapsedMs: Number((performance.now() - started).toFixed(1)),
      iterations: result?.iterations,
      width: result?.width,
      height: result?.height,
      quality: result?.quality,
    });
  }
}
await writeFile('artifacts/benchmarks/exact-size.json', JSON.stringify(results, null, 2));
console.table(results);
