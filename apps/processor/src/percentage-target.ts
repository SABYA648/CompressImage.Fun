import { AppError } from './errors.js';

const MIN_ALLOCATION_BYTES = 1024;

/**
 * Allocate a single visible batch target deterministically. Every member receives
 * a minimum viable encoder budget; the remaining bytes are proportional to source
 * size and any integer remainder goes to the largest source (stable source order).
 */
export const allocatePercentageTargets = (
  sourceBytes: number[],
  reductionPercent: number,
): { targetBytes: number; allocations: number[] } => {
  if (!Number.isInteger(reductionPercent) || reductionPercent < 5 || reductionPercent > 90) {
    throw new AppError('INVALID_REDUCTION_PERCENT', 'Choose a reduction between 5% and 90%.');
  }
  if (!sourceBytes.length || sourceBytes.some((bytes) => !Number.isFinite(bytes) || bytes < 1)) {
    throw new AppError('INVALID_BATCH', 'Choose one or more valid image files.');
  }
  const totalBytes = sourceBytes.reduce((sum, bytes) => sum + bytes, 0);
  const targetBytes = Math.floor(totalBytes * (1 - reductionPercent / 100));
  if (targetBytes < sourceBytes.length * MIN_ALLOCATION_BYTES) {
    throw new AppError(
      'TARGET_IMPOSSIBLE',
      'This reduction leaves less than 1 KB per image. Use a lower percentage or fewer images.',
      422,
    );
  }
  const remaining = targetBytes - sourceBytes.length * MIN_ALLOCATION_BYTES;
  const base = sourceBytes.map(
    (bytes) => MIN_ALLOCATION_BYTES + Math.floor((remaining * bytes) / totalBytes),
  );
  let remainder = targetBytes - base.reduce((sum, bytes) => sum + bytes, 0);
  const priority = sourceBytes
    .map((bytes, index) => ({ bytes, index }))
    .sort((left, right) => right.bytes - left.bytes || left.index - right.index);
  for (let index = 0; remainder > 0; index = (index + 1) % priority.length) {
    const targetIndex = priority[index]!.index;
    base[targetIndex] = base[targetIndex]! + 1;
    remainder -= 1;
  }
  return { targetBytes, allocations: base };
};

export { MIN_ALLOCATION_BYTES };
