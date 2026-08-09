import { createReadStream, createWriteStream } from 'node:fs';
import { access, open, stat, statfs } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { fileTypeFromFile } from 'file-type';
import { z } from 'zod';
import { config } from './config.js';
import { AppError, friendlyError } from './errors.js';
import { ImageEngine } from './image-engine.js';
import { JobStore } from './job-store.js';
import { ProcessingQueue } from './queue.js';
import { operationSchema } from './schemas.js';
import { assertSafeSvg, bearerToken, randomId } from './security.js';
import type { JobFile, Operation, SupportedFormat } from './types.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie', 'body.token'],
  },
  bodyLimit: config.MAX_BATCH_BYTES,
  requestIdHeader: 'x-request-id',
  disableRequestLogging: true,
});

await app.register(sensible);
await app.register(multipart, {
  limits: {
    fileSize: config.MAX_UPLOAD_BYTES,
    files: config.MAX_BATCH_FILES,
    fields: 8,
    parts: config.MAX_BATCH_FILES + 8,
  },
});

const store = new JobStore();
const engine = new ImageEngine(store);
const queue = new ProcessingQueue(config.PROCESS_CONCURRENCY);
await store.init();

const defaultOperation: Operation = { kind: 'compress', mode: 'smart', format: 'original' };
const supportedMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/svg+xml',
]);

const requireJob = async (id: string, authorization?: string) => {
  const job = await store.read(id);
  store.authorize(job, bearerToken(authorization));
  return job;
};

const freeBytes = async (): Promise<number> => {
  const info = await statfs(config.TEMP_STORAGE_DIR);
  return info.bavail * info.bsize;
};

const parseOperation = (value: string): Operation => {
  try {
    return operationSchema.parse(JSON.parse(value)) as Operation;
  } catch {
    throw new AppError('INVALID_SETTINGS', 'The selected image settings are invalid.');
  }
};

app.get('/health', async () => ({ status: 'ok' }));
app.get('/ready', async (_request, reply) => {
  await access(config.TEMP_STORAGE_DIR);
  return reply.send({ status: 'ready', queueDepth: queue.depth, active: queue.activeCount });
});

app.post('/api/jobs', async (request, reply) => {
  if ((await freeBytes()) < config.MIN_FREE_DISK_BYTES) {
    throw new AppError('DISK_PRESSURE', 'Temporary storage is low. Please try again later.', 503);
  }

  const created = await store.create('image-compressor', defaultOperation);
  let operation: Operation = defaultOperation;
  let toolId = 'image-compressor';
  let totalBytes = 0;
  let fileCount = 0;

  try {
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'operation' && typeof part.value === 'string')
          operation = parseOperation(part.value);
        if (part.fieldname === 'toolId' && typeof part.value === 'string') {
          toolId = z
            .string()
            .regex(/^[a-z0-9-]{2,80}$/)
            .parse(part.value);
        }
        continue;
      }

      fileCount += 1;
      const id = randomId(12);
      const internalName = `${id}.upload`;
      const path = store.filePath(created.job.id, internalName);
      await pipeline(part.file, createWriteStream(path, { mode: 0o600, flags: 'wx' }));
      if (part.file.truncated)
        throw new AppError(
          'FILE_TOO_LARGE',
          `A file is larger than the ${Math.round(config.MAX_UPLOAD_BYTES / 1024 / 1024)} MB safety limit.`,
          413,
        );
      const fileStats = await stat(path);
      totalBytes += fileStats.size;
      if (totalBytes > config.MAX_BATCH_BYTES)
        throw new AppError(
          'BATCH_TOO_LARGE',
          'This batch exceeds the total upload safety limit.',
          413,
        );

      let detected = await fileTypeFromFile(path);
      if (!detected) {
        const handle = await open(path, 'r');
        const prefixBuffer = Buffer.alloc(4096);
        const { bytesRead } = await handle.read(prefixBuffer, 0, prefixBuffer.length, 0);
        await handle.close();
        const prefix = prefixBuffer.subarray(0, bytesRead).toString('utf8');
        if (/<svg[\s>]/i.test(prefix)) detected = { ext: 'svg', mime: 'image/svg+xml' };
      }
      if (!detected || !supportedMime.has(detected.mime)) {
        throw new AppError('UNSUPPORTED_FORMAT', 'This file is not a supported image format.');
      }
      if (detected.mime === 'image/svg+xml') await assertSafeSvg(path);

      const metadata = await engine.inspect(path);
      const originalName = store.safeDownloadName(
        part.filename || `image.${detected.ext}`,
        `image.${detected.ext}`,
      );
      const source: JobFile = {
        id,
        role: 'source',
        internalName,
        originalName,
        downloadName: originalName,
        mime: detected.mime,
        format: metadata.format as SupportedFormat,
        bytes: fileStats.size,
        width: metadata.width,
        height: metadata.height,
        metadata,
      };
      await store.addFile(created.job.id, source);
    }

    if (!fileCount) throw new AppError('FILE_REQUIRED', 'Choose at least one image.');
    await store.update(created.job.id, (job) => {
      job.operation = operation;
      job.toolId = toolId;
      job.status = 'queued';
      job.stage = 'queued';
    });
    queue.add(() => engine.processJob(created.job.id));
    return reply.code(202).send({ id: created.job.id, token: created.token, status: 'queued' });
  } catch (error) {
    await store.delete(created.job.id);
    throw error;
  }
});

app.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
  const job = await requireJob(request.params.id, request.headers.authorization);
  return reply
    .header('Cache-Control', 'private, no-store')
    .send(store.public(job, job.status === 'queued' ? queue.position() : undefined));
});

app.get<{ Params: { id: string; fileId: string } }>(
  '/api/jobs/:id/files/:fileId',
  async (request, reply) => {
    const job = await requireJob(request.params.id, request.headers.authorization);
    const file = job.files.find((candidate) => candidate.id === request.params.fileId);
    if (!file) throw new AppError('FILE_NOT_FOUND', 'This file does not exist.', 404);
    const { internalName: _internal, previewName: _preview, ...safe } = file;
    return reply.header('Cache-Control', 'private, no-store').send(safe);
  },
);

app.get<{ Params: { id: string; fileId: string } }>(
  '/api/jobs/:id/files/:fileId/preview',
  async (request, reply) => {
    const job = await requireJob(request.params.id, request.headers.authorization);
    const file = job.files.find(
      (candidate) => candidate.id === request.params.fileId && candidate.role === 'output',
    );
    if (!file?.previewName)
      throw new AppError('PREVIEW_NOT_FOUND', 'A preview is not available for this file.', 404);
    return reply
      .header('Content-Type', 'image/webp')
      .header('Cache-Control', 'private, no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .send(createReadStream(store.filePath(job.id, file.previewName)));
  },
);

app.get<{ Params: { id: string; fileId: string } }>(
  '/api/jobs/:id/files/:fileId/download',
  async (request, reply) => {
    const job = await requireJob(request.params.id, request.headers.authorization);
    const file = job.files.find(
      (candidate) => candidate.id === request.params.fileId && candidate.role === 'output',
    );
    if (!file) throw new AppError('FILE_NOT_FOUND', 'This result does not exist.', 404);
    return reply
      .header('Content-Type', file.mime)
      .header(
        'Content-Disposition',
        `attachment; filename="${file.downloadName.replace(/["\\]/g, '_')}"`,
      )
      .header('Cache-Control', 'private, no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .send(createReadStream(store.filePath(job.id, file.internalName)));
  },
);

app.get<{ Params: { id: string } }>('/api/jobs/:id/download-all', async (request, reply) => {
  const job = await requireJob(request.params.id, request.headers.authorization);
  const zipPath = await engine.createZip(job);
  return reply
    .header('Content-Type', 'application/zip')
    .header('Content-Disposition', 'attachment; filename="compressimage-results.zip"')
    .header('Cache-Control', 'private, no-store')
    .send(createReadStream(zipPath));
});

const chainSchema = z.object({
  sourceFileId: z.string().min(8).max(64),
  operation: operationSchema,
});
app.post<{ Params: { id: string } }>('/api/jobs/:id/operations', async (request, reply) => {
  const job = await requireJob(request.params.id, request.headers.authorization);
  const parsed = chainSchema.parse(request.body);
  const body = { ...parsed, operation: parsed.operation as Operation };
  const source = job.files.find((file) => file.id === body.sourceFileId);
  if (!source)
    throw new AppError('FILE_NOT_FOUND', 'The selected source is no longer available.', 404);
  await store.update(job.id, (record) => {
    record.operation = body.operation;
    record.status = 'queued';
    record.stage = 'queued';
    delete record.error;
  });
  queue.add(async () => {
    try {
      const latest = await store.update(job.id, (record) => {
        record.status = 'processing';
        record.stage = 'reading';
      });
      await engine.processSource(latest, source, body.operation);
      await store.update(job.id, (record) => {
        record.status = 'complete';
        record.stage = 'complete';
      });
    } catch (error) {
      const friendly = friendlyError(error);
      await store
        .update(job.id, (record) => {
          record.status = 'error';
          record.stage = 'error';
          record.error = { code: friendly.code, message: friendly.message };
        })
        .catch(() => undefined);
    }
  });
  return reply.code(202).send({ id: job.id, status: 'queued' });
});

app.delete<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
  const job = await requireJob(request.params.id, request.headers.authorization);
  await store.delete(job.id);
  return reply.code(204).send();
});

app.setErrorHandler((error, request, reply) => {
  const friendly =
    error instanceof z.ZodError
      ? new AppError('INVALID_REQUEST', 'The request contains invalid settings.')
      : friendlyError(error);
  request.log.warn({ code: friendly.code, statusCode: friendly.statusCode }, 'request failed');
  return reply
    .code(friendly.statusCode)
    .send({ error: { code: friendly.code, message: friendly.message } });
});

const cleanupTimer = setInterval(
  () => {
    void store.cleanupExpired().then((removed) => {
      if (removed) app.log.info({ removed }, 'expired jobs deleted');
    });
  },
  Math.min(config.FILE_TTL_SECONDS * 500, 15 * 60 * 1000),
);
cleanupTimer.unref();

const close = async (): Promise<void> => {
  clearInterval(cleanupTimer);
  await app.close();
};
process.on('SIGTERM', () => void close());
process.on('SIGINT', () => void close());

await app.listen({ port: config.PORT, host: '0.0.0.0' });
