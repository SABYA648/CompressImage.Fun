import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { ImageEngine } from './image-engine.js';
import { JobStore } from './job-store.js';
import type { JobFile, Operation } from './types.js';

const directories: string[] = [];
afterEach(async () =>
  Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  ),
);

const makeJob = async (operation: Operation) => {
  const directory = await mkdtemp(join(tmpdir(), 'compress-engine-'));
  directories.push(directory);
  const store = new JobStore(directory);
  await store.init();
  const created = await store.create('test', operation);
  const internalName = 'safe-source.upload';
  const sourcePath = store.filePath(created.job.id, internalName);
  await sharp({ create: { width: 900, height: 700, channels: 4, background: '#ff5b35' } })
    .composite([
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><circle cx="450" cy="350" r="230" fill="#12364b"/></svg>',
        ),
      },
    ])
    .png()
    .toFile(sourcePath);
  const engine = new ImageEngine(store);
  const metadata = await engine.inspect(sourcePath);
  const details = await stat(sourcePath);
  const source: JobFile = {
    id: 'safe-source-id',
    role: 'source',
    internalName,
    originalName: 'owner-photo.png',
    downloadName: 'owner-photo.png',
    mime: 'image/png',
    format: 'png',
    bytes: details.size,
    width: metadata.width,
    height: metadata.height,
    metadata,
  };
  await store.addFile(created.job.id, source);
  await store.update(created.job.id, (job) => {
    job.status = 'queued';
    job.stage = 'queued';
  });
  return { store, engine, jobId: created.job.id };
};

describe('image engine operations', () => {
  it('prepares exact form-photo pixels under the maximum byte limit', async () => {
    const targetBytes = 40 * 1024;
    const context = await makeJob({
      kind: 'prepare',
      width: 300,
      height: 100,
      targetBytes,
      format: 'jpeg',
      background: '#ffffff',
      density: 96,
      trim: true,
      fit: 'contain',
    });
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    const output = job.files.find((file) => file.role === 'output');
    expect(job.status).toBe('complete');
    expect(output?.width).toBe(300);
    expect(output?.height).toBe(100);
    expect(output?.bytes).toBeLessThanOrEqual(targetBytes);
  });

  it('generates ICO, PNG sizes, and a safe HTML snippet for favicons', async () => {
    const context = await makeJob({ kind: 'favicon', fit: 'contain', background: '#ffffff' });
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    expect(job.status).toBe('complete');
    expect(
      job.files.some((file) => file.downloadName === 'favicon.ico' && file.mime === 'image/x-icon'),
    ).toBe(true);
    expect(job.files.some((file) => file.downloadName === 'apple-touch-icon.png')).toBe(true);
    expect(job.files.some((file) => file.downloadName === 'favicon-html-snippet.txt')).toBe(true);
  });
});
