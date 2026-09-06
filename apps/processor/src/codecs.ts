import sharp, { type Sharp } from 'sharp';
import type { ConvertOperation, TransformOutputFormat, SupportedFormat } from './types.js';

export type EncodableFormat = 'jpeg' | 'png' | 'webp' | 'avif';
export type ConverterRasterFormat = EncodableFormat | 'gif' | 'tiff';

export const formatInfo: Record<
  ConverterRasterFormat | 'svg',
  { extension: string; mime: string }
> = {
  jpeg: { extension: 'jpg', mime: 'image/jpeg' },
  png: { extension: 'png', mime: 'image/png' },
  webp: { extension: 'webp', mime: 'image/webp' },
  avif: { extension: 'avif', mime: 'image/avif' },
  gif: { extension: 'gif', mime: 'image/gif' },
  tiff: { extension: 'tiff', mime: 'image/tiff' },
  svg: { extension: 'svg', mime: 'image/svg+xml' },
};

export const resolveOutputFormat = (
  requested: TransformOutputFormat,
  input: SupportedFormat,
): EncodableFormat => {
  if (requested !== 'original') return requested;
  if (input === 'jpeg' || input === 'png' || input === 'webp' || input === 'avif') return input;
  if (input === 'svg') return 'png';
  return 'jpeg';
};

export const encode = (
  pipeline: Sharp,
  format: EncodableFormat,
  quality: number,
  preserveMetadata = false,
): Sharp => {
  const prepared = preserveMetadata ? pipeline.withMetadata() : pipeline;
  switch (format) {
    case 'jpeg':
      return prepared.jpeg({
        quality,
        progressive: true,
        optimizeCoding: true,
        chromaSubsampling: '4:2:0',
      });
    case 'png':
      return prepared.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: quality < 100,
        quality,
        effort: 8,
      });
    case 'webp':
      return prepared.webp({
        quality,
        effort: 5,
        smartSubsample: true,
        nearLossless: quality >= 95,
      });
    case 'avif':
      // Measured on the benchmark fixtures: effort 4 is pathological on noisy photos,
      // producing a larger file than effort 3 while taking roughly 4.5x as long. Effort
      // 3 is the practical sweet spot and keeps exact-size AVIF inside the job timeout.
      return prepared.avif({ quality, effort: 3, chromaSubsampling: '4:4:4' });
  }
};

export const encodeConversion = (
  pipeline: Sharp,
  format: ConverterRasterFormat,
  operation: ConvertOperation,
  animation?: { delay?: number[]; loop?: number },
): Sharp => {
  const quality = operation.quality ?? (format === 'avif' ? 50 : 82);
  switch (format) {
    case 'gif':
      return pipeline.gif({
        colours: operation.gifColours ?? 256,
        dither: operation.gifDither ?? 1,
        effort: 7,
        ...(animation?.delay ? { delay: animation.delay } : {}),
        ...(animation?.loop !== undefined ? { loop: animation.loop } : {}),
      });
    case 'tiff':
      return pipeline.tiff({
        compression: operation.tiffCompression ?? 'lzw',
        ...(operation.tiffCompression === 'jpeg' ? { quality } : {}),
        predictor: 'horizontal',
      });
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'avif':
      if (format === 'webp' && animation) {
        return pipeline.webp({
          quality,
          effort: 5,
          ...(animation.delay ? { delay: animation.delay } : {}),
          ...(animation.loop !== undefined ? { loop: animation.loop } : {}),
        });
      }
      return encode(pipeline, format, format === 'png' ? 100 : quality);
  }
};

export const inputSharp = (path: string, limitInputPixels: number): Sharp =>
  sharp(path, {
    failOn: 'warning',
    limitInputPixels,
    sequentialRead: true,
  });
