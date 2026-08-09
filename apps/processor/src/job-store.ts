import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sanitize from 'sanitize-filename';
import { config } from './config.js';
import { AppError } from './errors.js';
import { hashToken, randomId, tokenMatches } from './security.js';
import type { JobFile, JobRecord, Operation, PublicJob } from './types.js';

export class JobStore {
  constructor(private readonly root = config.TEMP_STORAGE_DIR) {}

  async init(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    await this.cleanupExpired();
  }

  directory(id: string): string {
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(id))
      throw new AppError('JOB_NOT_FOUND', 'This job does not exist.', 404);
    return join(this.root, id);
  }

  filePath(jobId: string, internalName: string): string {
    if (!/^[A-Za-z0-9_.-]{8,96}$/.test(internalName))
      throw new AppError('FILE_NOT_FOUND', 'This file does not exist.', 404);
    return join(this.directory(jobId), internalName);
  }

  async create(toolId: string, operation: Operation): Promise<{ job: JobRecord; token: string }> {
    const id = randomId();
    const token = randomId(32);
    const now = new Date();
    const job: JobRecord = {
      id,
      tokenHash: hashToken(token),
      toolId,
      operation,
      status: 'uploading',
      stage: 'uploading',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + config.FILE_TTL_SECONDS * 1000).toISOString(),
      files: [],
    };
    await mkdir(this.directory(id), { recursive: false, mode: 0o700 });
    await this.save(job);
    return { job, token };
  }

  async read(id: string): Promise<JobRecord> {
    try {
      return JSON.parse(await readFile(join(this.directory(id), 'job.json'), 'utf8')) as JobRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new AppError('JOB_NOT_FOUND', 'This job has expired or was deleted.', 404);
      throw error;
    }
  }

  async save(job: JobRecord): Promise<void> {
    const dir = this.directory(job.id);
    const temp = join(dir, `job-${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(job), { mode: 0o600 });
    await rename(temp, join(dir, 'job.json'));
  }

  async update(id: string, mutate: (job: JobRecord) => void): Promise<JobRecord> {
    const job = await this.read(id);
    mutate(job);
    await this.save(job);
    return job;
  }

  authorize(job: JobRecord, token: string): void {
    if (!tokenMatches(token, job.tokenHash))
      throw new AppError('AUTH_INVALID', 'Invalid job token.', 403);
    if (Date.parse(job.expiresAt) <= Date.now())
      throw new AppError('JOB_EXPIRED', 'This job has expired and its files were deleted.', 410);
  }

  public(job: JobRecord, queuePosition?: number): PublicJob {
    const { tokenHash: _tokenHash, files: storedFiles, ...safeJob } = job;
    const files = storedFiles.map(
      ({ internalName: _internal, previewName: _preview, ...file }) => file,
    );
    return { ...safeJob, files, ...(queuePosition ? { queuePosition } : {}) };
  }

  async addFile(id: string, file: JobFile): Promise<void> {
    await this.update(id, (job) => job.files.push(file));
  }

  safeDownloadName(name: string, fallback: string): string {
    const cleaned = sanitize(name, { replacement: '-' }).replace(/^\.+/, '').slice(0, 180);
    return cleaned || fallback;
  }

  async delete(id: string): Promise<void> {
    await rm(this.directory(id), { recursive: true, force: true });
  }

  async cleanupExpired(now = Date.now()): Promise<number> {
    let removed = 0;
    const entries = await readdir(this.root, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^[A-Za-z0-9_-]{20,64}$/.test(entry.name)) continue;
      try {
        const job = await this.read(entry.name);
        if (Date.parse(job.expiresAt) <= now) {
          await this.delete(entry.name);
          removed += 1;
        }
      } catch {
        const info = await stat(join(this.root, entry.name));
        if (info.mtimeMs + config.FILE_TTL_SECONDS * 1000 <= now) {
          await this.delete(entry.name);
          removed += 1;
        }
      }
    }
    return removed;
  }
}
