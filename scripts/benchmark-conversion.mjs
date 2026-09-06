import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { generateFixtures } from './generate-fixtures.mjs';

const root = await generateFixtures();
const input = resolve(root, 'photograph.jpg');
const formats = ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'];
const results = [];
await mkdir('artifacts/benchmarks', { recursive: true });
for (const format of formats) {
  const started = performance.now();
  const pipeline = sharp(input).rotate();
  const buffer = await (
    format === 'jpeg'
      ? pipeline.jpeg({ quality: 82 })
      : format === 'png'
        ? pipeline.png()
        : format === 'webp'
          ? pipeline.webp({ quality: 82 })
          : format === 'avif'
            ? pipeline.avif({ quality: 50, effort: 3 })
            : format === 'gif'
              ? pipeline.gif({ colours: 256 })
              : pipeline.tiff({ compression: 'lzw' })
  ).toBuffer();
  const info = await sharp(buffer, { animated: true }).metadata();
  results.push({
    format,
    outputBytes: buffer.length,
    elapsedMs: Number((performance.now() - started).toFixed(1)),
    width: info.width,
    height: info.height,
    frames: info.pages ?? 1,
    peakRisk: 'in-memory encode buffer; bounded by processor pixel and frame limits',
  });
}
await writeFile('artifacts/benchmarks/conversion.json', JSON.stringify(results, null, 2));
console.table(results);
