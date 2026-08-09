export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export const friendlyError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : 'Unknown processing error';
  if (/Input buffer contains unsupported image format|unsupported image/i.test(message)) {
    return new AppError('UNSUPPORTED_FORMAT', 'This file is not a supported image format.');
  }
  if (/corrupt|premature end|invalid/i.test(message)) {
    return new AppError('DAMAGED_IMAGE', 'This image appears damaged and could not be processed.');
  }
  if (/timeout/i.test(message)) {
    return new AppError(
      'PROCESSING_TIMEOUT',
      'Processing took too long. Try a smaller image or a faster format.',
      408,
    );
  }
  return new AppError('PROCESSING_FAILED', 'We could not process this image safely.', 422);
};
