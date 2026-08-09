import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { JobStore } from './job-store.js';

const directories: string[] = [];
afterEach(async () =>
  Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  ),
);

describe('temporary job store', () => {
  it('uses independent random job and capability secrets', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'compress-jobs-'));
    directories.push(directory);
    const store = new JobStore(directory);
    await store.init();
    const created = await store.create('test-tool', {
      kind: 'compress',
      mode: 'smart',
      format: 'original',
    });
    expect(created.job.id).not.toContain(created.token);
    expect(created.token.length).toBeGreaterThan(40);
    expect(() => store.authorize(created.job, created.token)).not.toThrow();
    expect(() => store.authorize(created.job, `${created.token}x`)).toThrow();
  });

  it('deletes jobs whose expiry has passed', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'compress-ttl-'));
    directories.push(directory);
    const store = new JobStore(directory);
    await store.init();
    const created = await store.create('test-tool', {
      kind: 'compress',
      mode: 'smart',
      format: 'original',
    });
    const removed = await store.cleanupExpired(Date.parse(created.job.expiresAt) + 1);
    expect(removed).toBe(1);
    await expect(store.read(created.job.id)).rejects.toMatchObject({ code: 'JOB_NOT_FOUND' });
  });
});
