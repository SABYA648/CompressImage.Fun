import type { Sharp } from 'sharp';
import { encode, inputSharp, type EncodableFormat } from './codecs.js';

export interface ExactResult {
  buffer: Buffer;
  width: number;
  height: number;
  quality: number;
  iterations: number;
  resized: boolean;
}

interface ExactOptions {
  inputPath: string;
  format: EncodableFormat;
  targetBytes: number;
  width: number;
  height: number;
  minQuality: number;
  preserveMetadata: boolean;
  limitInputPixels: number;
  hasAlpha: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

const qualityBounds = (format: EncodableFormat, minimum: number): [number, number] => {
  const high = format === 'avif' ? 82 : format === 'png' ? 100 : 95;
  return [Math.min(minimum, high), high];
};

const makePipeline = (options: ExactOptions, width: number, height: number): Sharp => {
  let pipeline = inputSharp(options.inputPath, options.limitInputPixels).rotate();
  if (width !== options.width || height !== options.height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    });
  }
  if (options.format === 'jpeg' && options.hasAlpha) {
    pipeline = pipeline.flatten({ background: '#ffffff' });
  }
  return pipeline;
};

export const optimizeExactSize = async (options: ExactOptions): Promise<ExactResult | null> => {
  const scales = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36, 0.3, 0.24, 0.18, 0.13, 0.1];
  let iterations = 0;
  const constraintScale = Math.min(
    1,
    options.maxWidth ? options.maxWidth / options.width : 1,
    options.maxHeight ? options.maxHeight / options.height : 1,
  );
  const baseWidth = Math.max(1, Math.round(options.width * constraintScale));
  const baseHeight = Math.max(1, Math.round(options.height * constraintScale));

  for (const scale of scales) {
    const width = Math.max(1, Math.round(baseWidth * scale));
    const height = Math.max(1, Math.round(baseHeight * scale));
    let [low, high] = qualityBounds(options.format, options.minQuality);
    let best: { buffer: Buffer; quality: number } | null = null;

    // Eight encodes are enough to resolve an integer quality range while keeping CPU bounded.
    for (let search = 0; search < 8 && low <= high; search += 1) {
      const quality = Math.floor((low + high) / 2);
      const pipeline = makePipeline(options, width, height);
      const buffer = await encode(
        pipeline,
        options.format,
        quality,
        options.preserveMetadata,
      ).toBuffer();
      iterations += 1;
      if (buffer.length <= options.targetBytes) {
        best = { buffer, quality };
        low = quality + 1;
      } else {
        high = quality - 1;
      }
    }

    if (best) {
      return {
        buffer: best.buffer,
        width,
        height,
        quality: best.quality,
        iterations,
        resized: scale !== 1,
      };
    }
  }
  return null;
};
