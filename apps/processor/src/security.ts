import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { AppError } from './errors.js';

export const randomId = (bytes = 18): string => randomBytes(bytes).toString('base64url');
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const tokenMatches = (token: string, expected: string): boolean => {
  const actual = Buffer.from(hashToken(token));
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
};

export const assertSafeSvg = async (path: string): Promise<void> => {
  const source = await readFile(path, 'utf8');
  const blocked = [
    /<script[\s>]/i,
    /<foreignObject[\s>]/i,
    /\son\w+\s*=/i,
    /(?:href|src)\s*=\s*["']\s*(?:https?:|file:|ftp:|\/\/)/i,
    /@import/i,
    /<!ENTITY/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
  ];
  if (!/<svg[\s>]/i.test(source) || blocked.some((pattern) => pattern.test(source))) {
    throw new AppError(
      'UNSAFE_SVG',
      'This SVG contains active or external content and was rejected.',
    );
  }
};

export const bearerToken = (authorization?: string): string => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('AUTH_REQUIRED', 'This temporary job needs its private access token.', 401);
  }
  const token = authorization.slice(7);
  if (token.length < 32 || token.length > 256)
    throw new AppError('AUTH_INVALID', 'Invalid job token.', 401);
  return token;
};
