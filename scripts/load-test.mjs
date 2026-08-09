import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateFixtures } from './generate-fixtures.mjs';
const base = process.env.BASE_URL ?? 'http://web:8080';
const root = await generateFixtures();
const bytes = await readFile(resolve(root, 'photograph.jpg'));
const operations = [
  { kind: 'compress', mode: 'smart', format: 'jpeg' },
  { kind: 'compress', mode: 'exact', format: 'jpeg', targetBytes: 100 * 1024 },
  { kind: 'resize', width: 800, fit: 'inside', format: 'jpeg', quality: 82 },
  { kind: 'convert', format: 'webp', quality: 80 },
  { kind: 'convert', format: 'avif', quality: 50 },
  {
    kind: 'prepare',
    width: 600,
    height: 600,
    targetBytes: 200 * 1024,
    format: 'jpeg',
    background: '#ffffff',
    fit: 'cover',
  },
  { kind: 'compress', mode: 'smart', format: 'webp' },
  { kind: 'compress', mode: 'quality', format: 'jpeg', quality: 70 },
];
const started = performance.now();
const results = await Promise.all(
  operations.map(async (operation, index) => {
    const form = new FormData();
    form.append('toolId', 'load-test');
    form.append('operation', JSON.stringify(operation));
    form.append('files', new Blob([bytes], { type: 'image/jpeg' }), `load-${index}.jpg`);
    const created = await fetch(`${base}/api/jobs`, { method: 'POST', body: form });
    const body = await created.json();
    if (!created.ok) return { ok: false, status: created.status };
    for (let poll = 0; poll < 180; poll += 1) {
      const response = await fetch(`${base}/api/jobs/${body.id}`, {
        headers: { Authorization: `Bearer ${body.token}` },
      });
      const job = await response.json();
      if (job.status === 'complete')
        return {
          ok: true,
          status: 200,
          bytes: job.files.find((file) => file.role === 'output')?.bytes,
        };
      if (job.status === 'error') return { ok: false, status: 422, error: job.error?.code };
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
    return { ok: false, status: 408 };
  }),
);
console.table(results);
console.log(`Elapsed: ${((performance.now() - started) / 1000).toFixed(2)} s`);
if (results.some((result) => !result.ok)) process.exit(1);
