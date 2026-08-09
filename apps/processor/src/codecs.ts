import sharp, { type Sharp } from 'sharp';
import type { OutputFormat, SupportedFormat } from './types.js';

export type EncodableFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export const formatInfo: Record<EncodableFormat, { extension: string; mime: string }> = {
  jpeg: { extension: 'jpg', mime: 'image/jpeg' },
  png: { extension: 'png', mime: 'image/png' },
  webp: { extension: 'webp', mime: 'image/webp' },
  avif: { extension: 'avif', mime: 'image/avif' },
};

export const resolveOutputFormat = (
  requested: OutputFormat,
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

export const inputSharp = (path: string, limitInputPixels: number): Sharp =>
  sharp(path, {
    failOn: 'warning',
    limitInputPixels,
    sequentialRead: true,
  });
