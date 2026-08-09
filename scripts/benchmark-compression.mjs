import { mkdir, stat, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { generateFixtures } from './generate-fixtures.mjs';

const fixtureRoot = await generateFixtures();
await mkdir('artifacts/benchmarks', { recursive: true });
const inputs = ['photograph.jpg', 'illustration.png'];
const formats = ['jpeg', 'png', 'webp', 'avif'];
const results = [];
for (const input of inputs) {
  const path = resolve(fixtureRoot, input);
  const original = await stat(path);
  const metadata = await sharp(path).metadata();
  for (const format of formats) {
    const started = performance.now();
    let pipeline = sharp(path).rotate();
    pipeline =
      format === 'jpeg'
        ? pipeline.flatten({ background: '#fff' }).jpeg({ quality: 82, progressive: true })
        : format === 'png'
          ? pipeline.png({ compressionLevel: 9, palette: input.includes('illustration') })
          : format === 'webp'
            ? pipeline.webp({ quality: 80, effort: 5 })
            : pipeline.avif({ quality: 50, effort: 4 });
    const buffer = await pipeline.toBuffer();
    results.push({
      fixture: input,
      format,
      inputBytes: original.size,
      outputBytes: buffer.length,
      elapsedMs: Number((performance.now() - started).toFixed(1)),
      width: metadata.width,
      height: metadata.height,
      quality: format === 'png' ? 100 : format === 'avif' ? 50 : format === 'webp' ? 80 : 82,
    });
  }
}
await writeFile('artifacts/benchmarks/compression.json', JSON.stringify(results, null, 2));
await writeFile(
  'artifacts/benchmarks/compression.md',
  [
    '# Compression benchmark',
    '',
    '| Fixture | Format | Input bytes | Output bytes | Elapsed ms |',
    '|---|---:|---:|---:|---:|',
    ...results.map(
      (r) => `| ${r.fixture} | ${r.format} | ${r.inputBytes} | ${r.outputBytes} | ${r.elapsedMs} |`,
    ),
    '',
  ].join('\n'),
);
console.table(results);
