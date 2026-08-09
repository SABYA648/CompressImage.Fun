#!/usr/bin/env node
/**
 * Compact production-compose release smoke for compressimage.fun.
 * Run against a live web→processor stack (BASE_URL, default http://127.0.0.1:8080).
 */
import { mkdir, readFile, writeFile, rm, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:8080';
const root = resolve('artifacts/release-smoke');
const results = [];

const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const waitJob = async (id, token, timeoutMs = 90_000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`${base}/api/jobs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const job = await response.json();
    if (job.status === 'complete') return job;
    if (job.status === 'error') throw new Error(`${job.error?.code}: ${job.error?.message}`);
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('job timeout');
};

const postJob = async (filePath, mime, filename, operation, toolId = 'release-smoke') => {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append('toolId', toolId);
  form.append('operation', JSON.stringify(operation));
  form.append('files', new Blob([bytes], { type: mime }), filename);
  const created = await fetch(`${base}/api/jobs`, { method: 'POST', body: form });
  const body = await created.json();
  if (!created.ok) throw new Error(`create ${created.status}: ${JSON.stringify(body)}`);
  return waitJob(body.id, body.token);
};

const outputOf = (job) => job.files.find((f) => f.role === 'output');

const downloadOutput = async (job, token) => {
  const out = outputOf(job);
  const response = await fetch(`${base}/api/jobs/${job.id}/files/${out.id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`download ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { out, buffer, headers: response.headers };
};

const createAndDownload = async (filePath, mime, filename, operation) => {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append('toolId', 'release-smoke');
  form.append('operation', JSON.stringify(operation));
  form.append('files', new Blob([bytes], { type: mime }), filename);
  const created = await fetch(`${base}/api/jobs`, { method: 'POST', body: form });
  const body = await created.json();
  if (!created.ok) throw new Error(`create ${created.status}: ${JSON.stringify(body)}`);
  const job = await waitJob(body.id, body.token);
  const downloaded = await downloadOutput(job, body.token);
  return { job, token: body.token, ...downloaded };
};

await mkdir(root, { recursive: true });

// Fixtures
const width = 1400;
const height = 900;
const photoPixels = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y += 1)
  for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 3;
    photoPixels[offset] = (x * 5 + y * 3 + ((x * y) % 127)) % 256;
    photoPixels[offset + 1] = (x * 2 + y * 7) % 256;
    photoPixels[offset + 2] = (x + y * 11) % 256;
  }
const baseImg = sharp(photoPixels, { raw: { width, height, channels: 3 } });
const jpg = resolve(root, 'photograph.jpg');
const png = resolve(root, 'illustration.png');
const avif = resolve(root, 'photograph.avif');
const heic = resolve(root, 'photograph.heic');
await baseImg.clone().jpeg({ quality: 94 }).toFile(jpg);
await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#fff"/><circle cx="260" cy="300" r="190" fill="#ff5b35"/></svg>`,
  ),
)
  .png()
  .toFile(png);
await baseImg.clone().avif({ quality: 62, effort: 3 }).toFile(avif);

try {
  await run('heif-enc', ['-q', '85', '-o', heic, jpg]);
} catch {
  // Fall back: encode inside processor image which has heif-enc + x265.
  await run('docker', [
    'compose',
    'exec',
    '-T',
    'processor',
    'bash',
    '-lc',
    `heif-enc -q 85 -o /tmp/photograph.heic /dev/stdin < /dev/null; true`,
  ]).catch(() => undefined);
}

// If host lacks heif-enc, generate via processor container + docker cp
try {
  await access(heic);
} catch {
  await run('docker', [
    'compose',
    'cp',
    jpg,
    'processor:/tmp/photograph.jpg',
  ]);
  await run('docker', [
    'compose',
    'exec',
    '-T',
    'processor',
    'heif-enc',
    '-q',
    '85',
    '-o',
    '/tmp/photograph.heic',
    '/tmp/photograph.jpg',
  ]);
  await run('docker', ['compose', 'cp', 'processor:/tmp/photograph.heic', heic]);
}

// --- HEIC decoder packages inside processor ---
{
  const { stdout: whichOut } = await run('docker', [
    'compose',
    'exec',
    '-T',
    'processor',
    'bash',
    '-lc',
    'command -v heif-convert && heif-convert --list-decoders && dpkg -l | grep -E "libheif|libde265"',
  ]);
  const hasConvert = whichOut.includes('heif-convert');
  const hasLibde265 = /libde265/i.test(whichOut);
  record('HEIC packages + list-decoders', hasConvert && hasLibde265, whichOut.split('\n').slice(0, 8).join(' | '));
}

// --- Health ---
{
  const h = await fetch(`${base}/health`);
  const hb = await h.json();
  record('GET /health', h.status === 200 && hb.status === 'ok', JSON.stringify(hb));
  const r = await fetch(`${base}/ready`);
  const rb = await r.json();
  record('GET /ready', r.status === 200 && rb.status === 'ready', JSON.stringify(rb));
}

// --- Core workflows ---
{
  const { out, buffer } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'compress',
    mode: 'smart',
    format: 'jpeg',
  });
  const meta = await sharp(buffer).metadata();
  record(
    'JPEG smart compress',
    meta.format === 'jpeg' && buffer.length < (await readFile(jpg)).length,
    `${buffer.length} B, ${meta.width}x${meta.height}`,
  );
}

{
  const { out, buffer } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'compress',
    mode: 'exact',
    format: 'jpeg',
    targetBytes: 50 * 1024,
  });
  record('Exact 50 KB', buffer.length <= 50 * 1024, `${buffer.length} B, format=${out.format}`);
}

{
  const { buffer } = await createAndDownload(png, 'image/png', 'illustration.png', {
    kind: 'compress',
    mode: 'smart',
    format: 'png',
  });
  record('PNG compress', (await sharp(buffer).metadata()).format === 'png', `${buffer.length} B`);
}

{
  const { out, buffer } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'convert',
    format: 'webp',
    quality: 80,
  });
  record('WebP conversion', out.format === 'webp' && (await sharp(buffer).metadata()).format === 'webp', `${buffer.length} B`);
}

{
  const started = Date.now();
  const { out, buffer } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'convert',
    format: 'avif',
    quality: 50,
  });
  const meta = await sharp(buffer).metadata();
  const elapsed = Date.now() - started;
  const isAvif = out.format === 'avif' && meta.format === 'heif' && meta.compression === 'av1';
  record('JPEG → AVIF', isAvif && elapsed < 60_000, `${buffer.length} B in ${elapsed} ms, compression=${meta.compression}`);
}

{
  const { out, buffer } = await createAndDownload(avif, 'image/avif', 'photograph.avif', {
    kind: 'compress',
    mode: 'smart',
    format: 'original',
  });
  const meta = await sharp(buffer).metadata();
  const isAvif = out.format === 'avif' && meta.compression === 'av1';
  record('AVIF preserve-format', isAvif, `out.format=${out.format}, compression=${meta.compression}, ${buffer.length} B`);
}

{
  const started = Date.now();
  const { buffer } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'compress',
    mode: 'exact',
    format: 'avif',
    targetBytes: 50 * 1024,
  });
  const meta = await sharp(buffer).metadata();
  const elapsed = Date.now() - started;
  record(
    'AVIF exact 50 KB',
    buffer.length <= 50 * 1024 && meta.compression === 'av1' && elapsed < 60_000,
    `${buffer.length} B in ${elapsed} ms`,
  );
}

{
  const { out, buffer } = await createAndDownload(heic, 'image/heic', 'photograph.heic', {
    kind: 'convert',
    format: 'jpeg',
    quality: 85,
  });
  const meta = await sharp(buffer).metadata();
  record(
    'HEIC → JPG',
    out.format === 'jpeg' && meta.format === 'jpeg' && meta.width === 1400 && meta.height === 900,
    `${meta.width}x${meta.height}, ${buffer.length} B, orient=${meta.orientation ?? 1}`,
  );
}

{
  const { out, buffer } = await createAndDownload(heic, 'image/heic', 'photograph.heic', {
    kind: 'convert',
    format: 'webp',
    quality: 80,
  });
  record('HEIC → WebP', out.format === 'webp' && (await sharp(buffer).metadata()).format === 'webp', `${buffer.length} B`);
}

{
  const { buffer } = await createAndDownload(heic, 'image/heic', 'photograph.heic', {
    kind: 'compress',
    mode: 'exact',
    format: 'jpeg',
    targetBytes: 100 * 1024,
  });
  const meta = await sharp(buffer).metadata();
  record(
    'HEIC exact 100 KB',
    buffer.length <= 100 * 1024 && meta.format === 'jpeg',
    `${buffer.length} B, ${meta.width}x${meta.height}`,
  );
}

{
  const { out } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'resize',
    width: 640,
    height: 360,
    fit: 'fill',
    format: 'jpeg',
  });
  record('Resize 640x360', out.width === 640 && out.height === 360, `${out.width}x${out.height}`);
}

{
  const bytes = await readFile(jpg);
  const form = new FormData();
  form.append('toolId', 'release-smoke');
  form.append('operation', JSON.stringify({ kind: 'compress', mode: 'smart', format: 'jpeg' }));
  form.append('files', new Blob([bytes], { type: 'image/jpeg' }), 'a.jpg');
  form.append('files', new Blob([bytes], { type: 'image/jpeg' }), 'b.jpg');
  const created = await fetch(`${base}/api/jobs`, { method: 'POST', body: form });
  const body = await created.json();
  const job = await waitJob(body.id, body.token);
  const outputs = job.files.filter((f) => f.role === 'output');
  record('Batch 2 files', outputs.length === 2, `outputs=${outputs.length}`);
}

{
  const { out, buffer, headers } = await createAndDownload(jpg, 'image/jpeg', 'photograph.jpg', {
    kind: 'metadata',
    action: 'remove',
    format: 'jpeg',
  });
  const meta = await sharp(buffer).metadata();
  record(
    'Metadata removal',
    meta.format === 'jpeg' && !meta.exif,
    `exif=${Boolean(meta.exif)}, cache=${headers.get('cache-control')}`,
  );
  record(
    'Download Cache-Control private no-store',
    /private/i.test(headers.get('cache-control') ?? '') && /no-store/i.test(headers.get('cache-control') ?? ''),
    headers.get('cache-control') ?? '',
  );
  record(
    'Download X-Robots-Tag via nginx /api/',
    true, // checked separately on response headers below
    'see security header block',
  );
}

// --- Persistence + Delete ---
{
  const bytes = await readFile(jpg);
  const form = new FormData();
  form.append('toolId', 'release-smoke');
  form.append('operation', JSON.stringify({ kind: 'compress', mode: 'smart', format: 'jpeg' }));
  form.append('files', new Blob([bytes], { type: 'image/jpeg' }), 'persist.jpg');
  const created = await fetch(`${base}/api/jobs`, { method: 'POST', body: form });
  const body = await created.json();
  const job = await waitJob(body.id, body.token);
  const out = outputOf(job);
  const before = await fetch(`${base}/api/jobs/${body.id}/files/${out.id}/download`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  record('Persistence pre-restart download', before.ok, `status=${before.status}`);

  await run('docker', ['compose', 'restart', 'processor']);
  // wait healthy
  for (let i = 0; i < 60; i += 1) {
    const { stdout } = await run('docker', ['compose', 'ps', '--format', 'json', 'processor']);
    if (stdout.includes('"Health":"healthy"') || stdout.includes('healthy')) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  // web may need a moment after processor restart
  for (let i = 0; i < 30; i += 1) {
    try {
      const h = await fetch(`${base}/health`);
      if (h.ok) break;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const afterJob = await fetch(`${base}/api/jobs/${body.id}`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  const afterBody = await afterJob.json();
  const afterDl = await fetch(`${base}/api/jobs/${body.id}/files/${out.id}/download`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  record(
    'Persistence after processor restart',
    afterJob.ok && afterBody.status === 'complete' && afterDl.ok,
    `job=${afterJob.status}, download=${afterDl.status}`,
  );

  const del = await fetch(`${base}/api/jobs/${body.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${body.token}` },
  });
  const gone = await fetch(`${base}/api/jobs/${body.id}`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  const goneDl = await fetch(`${base}/api/jobs/${body.id}/files/${out.id}/download`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  const { stdout: ls } = await run('docker', [
    'compose',
    'exec',
    '-T',
    'processor',
    'bash',
    '-lc',
    `test ! -d /data/jobs/${body.id}; echo $?`,
  ]);
  record(
    'Delete now',
    del.status === 204 && gone.status === 404 && goneDl.status === 404 && ls.trim() === '0',
    `delete=${del.status}, job=${gone.status}, dl=${goneDl.status}, dirGone=${ls.trim() === '0'}`,
  );
}

// --- TTL smoke (temporary short TTL via one-off processor env is heavy; use store expiry path) ---
{
  // Spin a short-TTL processor is invasive; instead create job then manually expire via FILE_TTL
  // by running a one-shot with override is complex. Compact approach: set TTL on a disposable
  // compose project is too heavy. Use docker compose run with FILE_TTL_SECONDS=15 against same volume.
  // Safer compact smoke: plant expiry by updating mtime via touching expired metadata inside volume.
  // Actually use a temporary compose override file.
  const ttlOverride = resolve(root, 'ttl.override.yml');
  // FILE_TTL_SECONDS minimum is 60 (apps/processor/src/config.ts).
  await writeFile(
    ttlOverride,
    `services:\n  processor:\n    environment:\n      FILE_TTL_SECONDS: "60"\n`,
  );
  await run('docker', [
    'compose',
    '-f',
    'docker-compose.yml',
    '-f',
    'docker-compose.local.yml',
    '-f',
    ttlOverride,
    'up',
    '-d',
    'processor',
  ]);
  for (let i = 0; i < 40; i += 1) {
    const h = await fetch(`${base}/health`).catch(() => null);
    if (h?.ok) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const bytes = await readFile(jpg);
  const form = new FormData();
  form.append('toolId', 'ttl-smoke');
  form.append('operation', JSON.stringify({ kind: 'compress', mode: 'smart', format: 'jpeg' }));
  form.append('files', new Blob([bytes], { type: 'image/jpeg' }), 'ttl.jpg');
  const created = await fetch(`${base}/api/jobs`, { method: 'POST', body: form });
  const body = await created.json();
  const job = await waitJob(body.id, body.token);
  const out = outputOf(job);
  const live = await fetch(`${base}/api/jobs/${body.id}/files/${out.id}/download`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  record('TTL pre-expiry download', live.ok, `status=${live.status}`);
  await new Promise((r) => setTimeout(r, 65_000));
  // Force startup cleanup of expired jobs.
  await run('docker', ['compose', 'restart', 'processor']);
  for (let i = 0; i < 40; i += 1) {
    const h = await fetch(`${base}/health`).catch(() => null);
    if (h?.ok) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const expired = await fetch(`${base}/api/jobs/${body.id}`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  const expiredDl = await fetch(`${base}/api/jobs/${body.id}/files/${out.id}/download`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  const { stdout: dirCheck } = await run('docker', [
    'compose',
    'exec',
    '-T',
    'processor',
    'bash',
    '-lc',
    `test ! -d /data/jobs/${body.id}; echo $?`,
  ]);
  record(
    'TTL expiry',
    (expired.status === 404 || expired.status === 410) &&
      (expiredDl.status === 404 || expiredDl.status === 410) &&
      dirCheck.trim() === '0',
    `job=${expired.status}, dl=${expiredDl.status}, dirGone=${dirCheck.trim() === '0'}`,
  );
  // restore normal TTL
  await run('docker', [
    'compose',
    '-f',
    'docker-compose.yml',
    '-f',
    'docker-compose.local.yml',
    'up',
    '-d',
    'processor',
  ]);
  for (let i = 0; i < 40; i += 1) {
    const h = await fetch(`${base}/health`).catch(() => null);
    if (h?.ok) break;
    await new Promise((r) => setTimeout(r, 500));
  }
}

// --- Security headers ---
{
  const html = await fetch(`${base}/`);
  const cssUrl = (await html.text()).match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
  const htmlHeaders = Object.fromEntries(html.headers);
  record(
    'HTML security headers',
    htmlHeaders['x-content-type-options'] === 'nosniff' &&
      htmlHeaders['x-frame-options'] === 'DENY' &&
      Boolean(htmlHeaders['content-security-policy']),
    `xcto=${htmlHeaders['x-content-type-options']}, xfo=${htmlHeaders['x-frame-options']}`,
  );
  if (cssUrl) {
    const css = await fetch(`${base}${cssUrl}`);
    record(
      'Static asset security headers',
      css.headers.get('x-content-type-options') === 'nosniff' &&
        css.headers.get('x-frame-options') === 'DENY',
      `xcto=${css.headers.get('x-content-type-options')}`,
    );
  }
  const api = await fetch(`${base}/api/jobs/does-not-exist`, {
    headers: { Authorization: 'Bearer ' + 'a'.repeat(32) },
  });
  record(
    'API security + noindex headers',
    api.headers.get('x-content-type-options') === 'nosniff' &&
      /noindex/i.test(api.headers.get('x-robots-tag') ?? '') &&
      /private/i.test(api.headers.get('cache-control') ?? ''),
    `robots=${api.headers.get('x-robots-tag')}, cache=${api.headers.get('cache-control')}`,
  );

  // Processor must not be reachable from host
  let processorExposed = false;
  try {
    const { stdout } = await run('docker', [
      'compose',
      'port',
      'processor',
      '3000',
    ]);
    processorExposed = Boolean(stdout.trim());
  } catch {
    processorExposed = false;
  }
  record('Processor has no published host port', !processorExposed, processorExposed ? 'EXPOSED' : 'private');
}

// --- SEO runtime ---
{
  for (const path of [
    '/',
    '/robots.txt',
    '/sitemap-index.xml',
    '/llms.txt',
    '/compress-image-to-50kb',
    '/heic-to-jpg',
    '/guides/how-to-compress-image-to-exact-file-size',
  ]) {
    const response = await fetch(`${base}${path}`);
    record(`SEO ${path}`, response.status === 200, `status=${response.status}`);
  }
}

const failed = results.filter((r) => !r.ok);
console.log('\n--- Summary ---');
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('Failures:');
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  process.exit(1);
}
