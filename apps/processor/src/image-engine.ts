import { createWriteStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';
import { ZipFile } from 'yazl';
import { config } from './config.js';
import {
  encode,
  formatInfo,
  inputSharp,
  resolveOutputFormat,
  type EncodableFormat,
} from './codecs.js';
import { AppError, friendlyError } from './errors.js';
import { optimizeExactSize } from './exact-size.js';
import { JobStore } from './job-store.js';
import { randomId } from './security.js';
import type { JobFile, JobRecord, Operation, SafeMetadata, SupportedFormat } from './types.js';

const safeExifKeys = [
  'Make',
  'Model',
  'DateTimeOriginal',
  'ExposureTime',
  'FNumber',
  'ISO',
  'FocalLength',
  'GPSLatitude',
  'GPSLongitude',
] as const;

const xmlEscape = (value: string): string =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ??
      character,
  );

export class ImageEngine {
  constructor(private readonly store: JobStore) {
    sharp.concurrency(config.SHARP_CONCURRENCY);
    sharp.cache({ memory: 256, files: 20, items: 100 });
  }

  async inspect(path: string): Promise<SafeMetadata> {
    const metadata = await inputSharp(path, config.MAX_IMAGE_PIXELS).metadata();
    if (!metadata.format || !metadata.width || !metadata.height) {
      throw new AppError('INVALID_IMAGE', 'This file does not contain a decodable image.');
    }
    const pixels = metadata.width * metadata.height * (metadata.pages ?? 1);
    if (pixels > config.MAX_IMAGE_PIXELS) {
      throw new AppError(
        'TOO_MANY_PIXELS',
        `This image exceeds the ${Math.round(config.MAX_IMAGE_PIXELS / 1_000_000)} megapixel safety limit.`,
      );
    }
    if ((metadata.pages ?? 1) > config.MAX_ANIMATION_FRAMES) {
      throw new AppError(
        'TOO_MANY_FRAMES',
        `This animation exceeds the ${config.MAX_ANIMATION_FRAMES} frame safety limit.`,
      );
    }

    let exif: Record<string, string | number | boolean> | undefined;
    try {
      const parsed = (await exifr.parse(path, { gps: true, tiff: true, exif: true })) as Record<
        string,
        unknown
      > | null;
      if (parsed) {
        const selected = Object.fromEntries(
          safeExifKeys
            .filter((key) => ['string', 'number', 'boolean'].includes(typeof parsed[key]))
            .map((key) => [key, parsed[key] as string | number | boolean]),
        );
        if (Object.keys(selected).length) exif = selected;
      }
    } catch {
      // Malformed optional EXIF should not prevent safe image processing.
    }

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      ...(metadata.space ? { space: metadata.space } : {}),
      ...(metadata.channels ? { channels: metadata.channels } : {}),
      ...(metadata.depth ? { depth: metadata.depth } : {}),
      ...(metadata.density ? { density: metadata.density } : {}),
      ...(metadata.hasAlpha !== undefined ? { hasAlpha: metadata.hasAlpha } : {}),
      ...(metadata.isProgressive !== undefined ? { isProgressive: metadata.isProgressive } : {}),
      ...(metadata.pages ? { pages: metadata.pages } : {}),
      ...(metadata.orientation ? { orientation: metadata.orientation } : {}),
      ...(exif ? { exif } : {}),
    };
  }

  async processJob(jobId: string): Promise<void> {
    try {
      await this.store.update(jobId, (job) => {
        job.status = 'processing';
        job.stage = 'reading';
      });
      const job = await this.store.read(jobId);
      const sources = job.files.filter((file) => file.role === 'source');
      for (const source of sources) {
        const latest = await this.store.read(jobId);
        await this.withTimeout(this.processSource(latest, source, latest.operation));
      }
      await this.store.update(jobId, (record) => {
        record.status = 'complete';
        record.stage = 'complete';
      });
    } catch (error) {
      const friendly = friendlyError(error);
      await this.store
        .update(jobId, (job) => {
          job.status = 'error';
          job.stage = 'error';
          job.error = { code: friendly.code, message: friendly.message };
        })
        .catch(() => undefined);
    }
  }

  private async withTimeout<T>(task: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        task,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new AppError(
                  'PROCESSING_TIMEOUT',
                  'Processing took too long. Try a smaller image or a faster format.',
                  408,
                ),
              ),
            config.PROCESS_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async processSource(job: JobRecord, source: JobFile, operation: Operation): Promise<void> {
    const sourcePath = this.store.filePath(job.id, source.internalName);
    const metadata = source.metadata ?? (await this.inspect(sourcePath));
    if ((metadata.pages ?? 1) > 1) {
      throw new AppError(
        'ANIMATION_UNSUPPORTED',
        'This animation will not be flattened. Animation processing is not enabled yet.',
      );
    }
    if (operation.kind === 'metadata' && operation.action === 'inspect') return;

    await this.store.update(job.id, (record) => {
      record.stage =
        operation.kind === 'compress' && operation.mode === 'exact' ? 'optimizing' : 'encoding';
    });

    if (operation.kind === 'favicon') {
      await this.generateFavicons(job, source, sourcePath);
      return;
    }

    const result = await this.render(sourcePath, source, metadata, operation);
    await this.store.update(job.id, (record) => {
      record.stage = 'finalizing';
    });
    const id = randomId(12);
    const details = formatInfo[result.format];
    const internalName = `${id}.${details.extension}`;
    const outputPath = this.store.filePath(job.id, internalName);
    await writeFile(outputPath, result.buffer, { mode: 0o600 });
    const validated = await this.inspect(outputPath);
    if (validated.format !== result.format || validated.width < 1 || validated.height < 1) {
      throw new AppError(
        'OUTPUT_INVALID',
        'The encoded result did not pass output validation.',
        500,
      );
    }
    if (
      operation.kind === 'compress' &&
      operation.mode === 'exact' &&
      operation.targetBytes &&
      result.buffer.length > operation.targetBytes
    ) {
      throw new AppError(
        'OUTPUT_OVER_TARGET',
        'The exact-size output exceeded the requested limit.',
        500,
      );
    }
    if (
      operation.kind === 'prepare' &&
      operation.targetBytes &&
      result.buffer.length > operation.targetBytes
    ) {
      throw new AppError(
        'OUTPUT_OVER_TARGET',
        'The prepared output exceeded the requested limit.',
        500,
      );
    }
    const previewName = `${id}-preview.webp`;
    await sharp(result.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 3 })
      .toFile(this.store.filePath(job.id, previewName));
    const stem = basename(source.originalName, extname(source.originalName));
    const output: JobFile = {
      id,
      role: 'output',
      internalName,
      previewName,
      originalName: source.originalName,
      downloadName: this.store.safeDownloadName(
        `${stem}-${this.suffix(operation)}.${details.extension}`,
        `result.${details.extension}`,
      ),
      mime: details.mime,
      format: result.format,
      bytes: result.buffer.length,
      width: validated.width,
      height: validated.height,
      sourceId: source.id,
      metadata: validated,
      savingsPercent: Number(
        Math.max(0, ((source.bytes - result.buffer.length) / source.bytes) * 100).toFixed(1),
      ),
      ...(result.iterations ? { iterations: result.iterations } : {}),
      ...(result.note ? { note: result.note } : {}),
    };
    await this.store.addFile(job.id, output);
  }

  private suffix(operation: Operation): string {
    if (operation.kind === 'compress') return 'compressed';
    if (operation.kind === 'metadata') return 'clean';
    if (operation.kind === 'watermark') return 'watermarked';
    return operation.kind;
  }

  private async render(
    path: string,
    source: JobFile,
    metadata: SafeMetadata,
    operation: Exclude<Operation, { kind: 'favicon' }>,
  ): Promise<{ buffer: Buffer; format: EncodableFormat; iterations?: number; note?: string }> {
    const inputFormat = metadata.format as SupportedFormat;
    const requested =
      operation.kind === 'metadata' ? (operation.format ?? 'original') : operation.format;
    const format = resolveOutputFormat(requested, inputFormat);
    const quality =
      operation.kind === 'metadata'
        ? format === 'png'
          ? 100
          : 95
        : 'quality' in operation && operation.quality
          ? operation.quality
          : this.smartQuality(format);
    const preserve = 'preserveMetadata' in operation ? Boolean(operation.preserveMetadata) : false;

    if (operation.kind === 'compress' && operation.mode === 'exact') {
      if (!operation.targetBytes)
        throw new AppError('TARGET_REQUIRED', 'Enter a target file size.');
      if (
        source.bytes <= operation.targetBytes &&
        requested === 'original' &&
        source.format === format
      ) {
        const original = await readFile(path);
        return {
          buffer: original,
          format,
          note: `Already under ${operation.targetBytes} bytes. Original kept unchanged.`,
        };
      }
      const exact = await optimizeExactSize({
        inputPath: path,
        format,
        targetBytes: operation.targetBytes,
        width: metadata.width,
        height: metadata.height,
        minQuality: operation.aggressive ? 8 : (operation.minQuality ?? 35),
        preserveMetadata: preserve,
        limitInputPixels: config.MAX_IMAGE_PIXELS,
        hasAlpha: Boolean(metadata.hasAlpha),
        ...(operation.maxWidth ? { maxWidth: operation.maxWidth } : {}),
        ...(operation.maxHeight ? { maxHeight: operation.maxHeight } : {}),
      });
      if (!exact) {
        throw new AppError(
          'TARGET_IMPOSSIBLE',
          `This ${inputFormat.toUpperCase()} cannot reasonably reach the requested size. Try WebP, fewer pixels, or aggressive compression.`,
          422,
        );
      }
      return {
        buffer: exact.buffer,
        format,
        iterations: exact.iterations,
        ...(exact.resized
          ? { note: `Dimensions reduced to ${exact.width} × ${exact.height} to meet the limit.` }
          : {}),
      };
    }

    if (operation.kind === 'prepare') {
      let prepared = inputSharp(path, config.MAX_IMAGE_PIXELS).rotate();
      if (operation.trim) prepared = prepared.trim({ background: operation.background });
      prepared = prepared.resize(operation.width, operation.height, {
        fit: operation.fit,
        position: operation.position ?? 'centre',
        background: operation.background,
        kernel: 'lanczos3',
      });
      if (operation.format === 'jpeg')
        prepared = prepared.flatten({ background: operation.background });
      // Preparing a small lossless intermediate removes source metadata before adding only requested density.
      const intermediate = await prepared.png({ compressionLevel: 6 }).toBuffer();
      const renderAtQuality = async (candidateQuality: number): Promise<Buffer> => {
        const fresh = sharp(intermediate);
        const withDensity = operation.density
          ? fresh.withMetadata({ density: operation.density })
          : fresh;
        return operation.format === 'jpeg'
          ? withDensity
              .jpeg({ quality: candidateQuality, progressive: true, optimizeCoding: true })
              .toBuffer()
          : withDensity
              .png({
                compressionLevel: 9,
                palette: candidateQuality < 100,
                quality: candidateQuality,
                effort: 8,
              })
              .toBuffer();
      };
      if (!operation.targetBytes)
        return {
          buffer: await renderAtQuality(
            operation.quality ?? (operation.format === 'jpeg' ? 90 : 100),
          ),
          format: operation.format,
        };
      let low = operation.format === 'jpeg' ? 20 : 30;
      let high = 100;
      let best: { buffer: Buffer; quality: number } | undefined;
      let iterations = 0;
      while (low <= high && iterations < 8) {
        const candidateQuality = Math.floor((low + high) / 2);
        const buffer = await renderAtQuality(candidateQuality);
        iterations += 1;
        if (buffer.length <= operation.targetBytes) {
          best = { buffer, quality: candidateQuality };
          low = candidateQuality + 1;
        } else high = candidateQuality - 1;
      }
      if (!best)
        throw new AppError(
          'TARGET_IMPOSSIBLE',
          'These exact dimensions cannot fit under the selected byte limit at a useful quality. Try smaller dimensions or a larger limit.',
        );
      if (operation.minBytes && best.buffer.length < operation.minBytes)
        throw new AppError(
          'BELOW_MINIMUM',
          'The best result is below the selected minimum size. Try PNG, larger dimensions, or remove the minimum requirement.',
        );
      return { buffer: best.buffer, format: operation.format, iterations };
    }

    let pipeline = inputSharp(path, config.MAX_IMAGE_PIXELS).rotate();
    if (operation.kind === 'resize') {
      let width = operation.width;
      let height = operation.height;
      if (operation.percentage) {
        width = Math.max(1, Math.round((metadata.width * operation.percentage) / 100));
        height = Math.max(1, Math.round((metadata.height * operation.percentage) / 100));
      }
      if (!width && !height)
        throw new AppError('DIMENSIONS_REQUIRED', 'Enter a width, height, or percentage.');
      pipeline = pipeline.resize(width, height, {
        fit: operation.fit ?? 'inside',
        withoutEnlargement: false,
        kernel: 'lanczos3',
        background: operation.background ?? '#ffffff',
      });
    } else if (operation.kind === 'crop') {
      if (
        operation.left + operation.width > metadata.width ||
        operation.top + operation.height > metadata.height
      ) {
        throw new AppError('CROP_OUT_OF_BOUNDS', 'The crop area extends beyond this image.');
      }
      pipeline = pipeline.extract({
        left: operation.left,
        top: operation.top,
        width: operation.width,
        height: operation.height,
      });
    } else if (operation.kind === 'rotate') {
      pipeline = pipeline.rotate(operation.degrees);
    } else if (operation.kind === 'watermark') {
      const fontSize = Math.max(14, Math.round(metadata.width * operation.scale));
      const horizontal = operation.position.endsWith('west')
        ? 'start'
        : operation.position.endsWith('east')
          ? 'end'
          : 'middle';
      const x =
        horizontal === 'start'
          ? operation.padding
          : horizontal === 'end'
            ? metadata.width - operation.padding
            : metadata.width / 2;
      const vertical = operation.position.startsWith('north')
        ? 'north'
        : operation.position.startsWith('south')
          ? 'south'
          : 'center';
      const y =
        vertical === 'north'
          ? operation.padding + fontSize
          : vertical === 'south'
            ? metadata.height - operation.padding
            : metadata.height / 2;
      const overlay = Buffer.from(
        `<svg width="${metadata.width}" height="${metadata.height}" xmlns="http://www.w3.org/2000/svg"><style>.w{font:700 ${fontSize}px system-ui,sans-serif;fill:white;stroke:rgba(0,0,0,.45);stroke-width:${Math.max(1, Math.round(fontSize / 22))}px;paint-order:stroke;}</style><text class="w" x="${x}" y="${y}" text-anchor="${horizontal}" dominant-baseline="middle" opacity="${operation.opacity}">${xmlEscape(operation.text)}</text></svg>`,
      );
      pipeline = pipeline.composite([{ input: overlay }]);
    }

    if (format === 'jpeg' && metadata.hasAlpha) {
      const background =
        operation.kind === 'convert' ? (operation.background ?? '#ffffff') : '#ffffff';
      pipeline = pipeline.flatten({ background });
    }
    const finalQuality =
      operation.kind === 'compress' && operation.mode === 'lossless' && format === 'png'
        ? 100
        : quality;
    return { buffer: await encode(pipeline, format, finalQuality, preserve).toBuffer(), format };
  }

  private smartQuality(format: EncodableFormat): number {
    return format === 'jpeg' ? 82 : format === 'webp' ? 80 : format === 'avif' ? 50 : 100;
  }

  private async generateFavicons(job: JobRecord, source: JobFile, path: string): Promise<void> {
    const sizes = [16, 32, 48, 180, 192, 512];
    const operation =
      job.operation.kind === 'favicon' ? job.operation : { kind: 'favicon' as const };
    const iconBuffers: Array<{ size: number; buffer: Buffer }> = [];
    for (const size of sizes) {
      const id = randomId(12);
      const internalName = `${id}.png`;
      const outputPath = this.store.filePath(job.id, internalName);
      const buffer = await inputSharp(path, config.MAX_IMAGE_PIXELS)
        .rotate()
        .resize(size, size, {
          fit: operation.fit ?? 'contain',
          background: operation.background ?? '#00000000',
          kernel: 'lanczos3',
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
      await writeFile(outputPath, buffer, { mode: 0o600 });
      if (size <= 48) iconBuffers.push({ size, buffer });
      const info = await stat(outputPath);
      const previewName = `${id}-preview.webp`;
      await sharp(buffer)
        .resize(256, 256, { fit: 'contain', kernel: 'nearest' })
        .webp({ quality: 90 })
        .toFile(this.store.filePath(job.id, previewName));
      await this.store.addFile(job.id, {
        id,
        role: 'output',
        internalName,
        previewName,
        originalName: source.originalName,
        downloadName: size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`,
        mime: 'image/png',
        format: 'png',
        bytes: info.size,
        width: size,
        height: size,
        sourceId: source.id,
      });
    }
    const icoId = randomId(12);
    const icoName = `${icoId}.ico`;
    const ico = this.createIco(iconBuffers);
    await writeFile(this.store.filePath(job.id, icoName), ico, { mode: 0o600 });
    await this.store.addFile(job.id, {
      id: icoId,
      role: 'output',
      internalName: icoName,
      originalName: source.originalName,
      downloadName: 'favicon.ico',
      mime: 'image/x-icon',
      format: 'ico',
      bytes: ico.length,
      width: 48,
      height: 48,
      sourceId: source.id,
    });
    const snippet =
      '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">\n';
    const snippetId = randomId(12);
    const snippetName = `${snippetId}.txt`;
    await writeFile(this.store.filePath(job.id, snippetName), snippet, { mode: 0o600 });
    await this.store.addFile(job.id, {
      id: snippetId,
      role: 'output',
      internalName: snippetName,
      originalName: source.originalName,
      downloadName: 'favicon-html-snippet.txt',
      mime: 'text/plain; charset=utf-8',
      format: 'text',
      bytes: Buffer.byteLength(snippet),
      width: 0,
      height: 0,
      sourceId: source.id,
    });
  }

  private createIco(images: Array<{ size: number; buffer: Buffer }>): Buffer {
    const header = Buffer.alloc(6 + images.length * 16);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);
    let offset = header.length;
    images.forEach(({ size, buffer }, index) => {
      const entry = 6 + index * 16;
      header.writeUInt8(size === 256 ? 0 : size, entry);
      header.writeUInt8(size === 256 ? 0 : size, entry + 1);
      header.writeUInt8(0, entry + 2);
      header.writeUInt8(0, entry + 3);
      header.writeUInt16LE(1, entry + 4);
      header.writeUInt16LE(32, entry + 6);
      header.writeUInt32LE(buffer.length, entry + 8);
      header.writeUInt32LE(offset, entry + 12);
      offset += buffer.length;
    });
    return Buffer.concat([header, ...images.map((image) => image.buffer)]);
  }

  async createZip(job: JobRecord): Promise<string> {
    const outputs = job.files.filter((file) => file.role === 'output');
    if (!outputs.length)
      throw new AppError('NO_OUTPUTS', 'There are no finished files to download.', 404);
    const zipName = `${randomId(12)}.zip`;
    const zipPath = this.store.filePath(job.id, zipName);
    await mkdir(this.store.directory(job.id), { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const zip = new ZipFile();
      const destination = createWriteStream(zipPath, { mode: 0o600 });
      destination.on('close', resolve);
      destination.on('error', reject);
      zip.outputStream.on('error', reject).pipe(destination);
      outputs.forEach((file) =>
        zip.addFile(this.store.filePath(job.id, file.internalName), file.downloadName),
      );
      zip.end();
    });
    return zipPath;
  }
}
