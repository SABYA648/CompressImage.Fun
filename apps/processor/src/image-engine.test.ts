import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { ImageEngine } from './image-engine.js';
import { JobStore } from './job-store.js';
import { allocatePercentageTargets } from './percentage-target.js';
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

const makeJobFromBuffer = async (operation: Operation, buffer: Buffer, originalName: string) => {
  const directory = await mkdtemp(join(tmpdir(), 'compress-engine-'));
  directories.push(directory);
  const store = new JobStore(directory);
  await store.init();
  const created = await store.create('test', operation);
  const internalName = 'custom-source.upload';
  const sourcePath = store.filePath(created.job.id, internalName);
  await writeFile(sourcePath, buffer);
  const engine = new ImageEngine(store);
  const metadata = await engine.inspect(sourcePath);
  const source: JobFile = {
    id: 'custom-source-id',
    role: 'source',
    internalName,
    originalName,
    downloadName: originalName,
    mime: `image/${metadata.format}`,
    format: metadata.format,
    bytes: buffer.length,
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

const animatedGif = async (frames = 2): Promise<Buffer> => {
  const width = 32;
  const pageHeight = 24;
  const channels = 4;
  const pixels = Buffer.alloc(width * pageHeight * frames * channels);
  for (let frame = 0; frame < frames; frame += 1) {
    for (
      let offset = frame * width * pageHeight * channels;
      offset < (frame + 1) * width * pageHeight * channels;
      offset += channels
    ) {
      pixels[offset] = frame % 2 ? 18 : 245;
      pixels[offset + 1] = frame % 2 ? 151 : 78;
      pixels[offset + 2] = frame % 2 ? 185 : 51;
      pixels[offset + 3] = 255;
    }
  }
  return sharp(pixels, { raw: { width, height: pageHeight * frames, channels, pageHeight } })
    .gif({ delay: Array.from({ length: frames }, (_value, index) => 80 + index * 20), loop: 0 })
    .toBuffer();
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

  it('encodes AVIF output that survives its own validation step', async () => {
    const context = await makeJob({ kind: 'compress', mode: 'smart', format: 'avif' });
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    const output = job.files.find((file) => file.role === 'output');
    expect(job.error).toBeUndefined();
    expect(job.status).toBe('complete');
    expect(output?.format).toBe('avif');
    expect(output?.mime).toBe('image/avif');
  });

  it('reports an AVIF source as AVIF rather than the raw HEIF container name', async () => {
    const context = await makeJob({ kind: 'compress', mode: 'smart', format: 'avif' });
    const avifPath = context.store.filePath(context.jobId, 'probe-source.avif');
    await sharp({ create: { width: 120, height: 90, channels: 3, background: '#12364b' } })
      .avif({ quality: 50 })
      .toFile(avifPath);
    expect((await context.engine.inspect(avifPath)).format).toBe('avif');
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

  it.each([
    ['jpeg', 'image/jpeg', 'jpg'],
    ['png', 'image/png', 'png'],
    ['webp', 'image/webp', 'webp'],
    ['avif', 'image/avif', 'avif'],
    ['gif', 'image/gif', 'gif'],
    ['tiff', 'image/tiff', 'tiff'],
  ] as const)(
    'converts a static input to %s with matching metadata',
    async (format, mime, extension) => {
      const context = await makeJob({ kind: 'convert', format });
      await context.engine.processJob(context.jobId);
      const job = await context.store.read(context.jobId);
      const output = job.files.find((file) => file.role === 'output');
      expect(job.status).toBe('complete');
      expect(output?.format).toBe(format);
      expect(output?.mime).toBe(mime);
      expect(output?.downloadName.endsWith(`.${extension}`)).toBe(true);
      expect(output?.width).toBe(900);
      expect(output?.height).toBe(700);
    },
  );

  it('creates a fixed raster-in-SVG wrapper with no active or external content', async () => {
    const context = await makeJob({ kind: 'convert', format: 'svg' });
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    const output = job.files.find((file) => file.role === 'output');
    expect(output?.format).toBe('svg');
    expect(output?.note).toContain('not vector artwork');
    const contents = await readFile(
      context.store.filePath(context.jobId, output?.internalName ?? ''),
      'utf8',
    );
    expect((contents.match(/data:image\//g) ?? []).length).toBe(1);
    expect(contents).not.toMatch(/<script|foreignObject|href=["']https?:|on\w+\s*=|<!ENTITY/i);
  });

  it('preserves GIF frames, delays, and loop count when converting to WebP', async () => {
    const context = await makeJobFromBuffer(
      { kind: 'convert', format: 'webp', animationMode: 'preserve' },
      await animatedGif(),
      'animation.gif',
    );
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    const output = job.files.find((file) => file.role === 'output');
    expect(job.status).toBe('complete');
    expect(output?.metadata?.pages).toBe(2);
    expect(output?.metadata?.delay).toEqual([80, 100]);
    expect(output?.metadata?.loop).toBe(0);
    expect(output?.frameCount).toBe(2);
  });

  it('requires an explicit choice before flattening an animation', async () => {
    const context = await makeJobFromBuffer(
      { kind: 'convert', format: 'png' },
      await animatedGif(),
      'animation.gif',
    );
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    expect(job.status).toBe('error');
    expect(job.error?.code).toBe('ANIMATION_CHOICE_REQUIRED');
    expect(job.files.filter((file) => file.role === 'output')).toHaveLength(0);
  });

  it('extracts decoded frames once into deterministically numbered static files', async () => {
    const context = await makeJobFromBuffer(
      { kind: 'convert', format: 'png', animationMode: 'extract-frames' },
      await animatedGif(3),
      'animation.gif',
    );
    await context.engine.processJob(context.jobId);
    const job = await context.store.read(context.jobId);
    const outputs = job.files.filter((file) => file.role === 'output');
    expect(job.status).toBe('complete');
    expect(outputs.map((output) => output.downloadName)).toEqual([
      'animation-frame-001.png',
      'animation-frame-002.png',
      'animation-frame-003.png',
    ]);
    expect(new Set(outputs.map((output) => output.outputGroup)).size).toBe(1);
    expect(outputs.every((output) => output.frameCount === 3)).toBe(true);
  });

  it('allocates percentage batch targets deterministically and never exceeds the total', () => {
    const plan = allocatePercentageTargets([10_000, 10_000, 5_000], 40);
    expect(plan.targetBytes).toBe(15_000);
    expect(plan.allocations).toEqual([5_796, 5_795, 3_409]);
    expect(plan.allocations.reduce((sum, bytes) => sum + bytes, 0)).toBe(plan.targetBytes);
  });

  it('rejects an invalid percentage before encoding', () => {
    expect(() => allocatePercentageTargets([10_000], 4)).toThrow('between 5% and 90%');
  });
});
