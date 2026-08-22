import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ToolDefinition } from '../data/tools';
import { track } from '../lib/analytics';

interface LocalFile {
  file: File;
  url: string;
  width?: number;
  height?: number;
}
interface JobFile {
  id: string;
  role: 'source' | 'output';
  originalName: string;
  downloadName: string;
  mime: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  sourceId?: string;
  savingsPercent?: number;
  iterations?: number;
  note?: string;
  metadata?: Record<string, any>;
}
interface PublicJob {
  id: string;
  status: 'uploading' | 'queued' | 'processing' | 'complete' | 'error';
  stage: string;
  expiresAt: string;
  files: JobFile[];
  queuePosition?: number;
  error?: { code: string; message: string };
}

const bytesLabel = (bytes: number): string =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 ** 2
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 ** 2).toFixed(2)} MB`;
const stageLabel: Record<string, string> = {
  uploading: 'Uploading securely',
  queued: 'Your image is queued',
  reading: 'Reading image',
  optimizing: 'Searching for the best result',
  encoding: 'Encoding image',
  finalizing: 'Validating result',
  complete: 'Complete',
};
const formats = ['original', 'jpeg', 'png', 'webp', 'avif'];

export default function ToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>(() => ({
    ...(tool.operation ?? {}),
  }));
  const [targetValue, setTargetValue] = useState(() =>
    Math.round(Number(tool.operation?.targetBytes ?? 102400) / 1024),
  );
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [job, setJob] = useState<PublicJob>();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    track('tool_open', { tool_id: tool.id });
    if (
      tool.kind === 'crop' &&
      files[0]?.width &&
      files[0]?.height &&
      settings.width === 100 &&
      settings.height === 100
    ) {
      setSettings((current) => ({ ...current, width: files[0]?.width, height: files[0]?.height }));
    }
  }, [files.length]);

  useEffect(() => {
    const paste = (event: ClipboardEvent): void => {
      const images = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith('image/'),
      );
      if (images.length) addFiles(images);
    };
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [files]);

  useEffect(
    () => () => {
      files.forEach((file) => URL.revokeObjectURL(file.url));
      Object.values(previewUrls).forEach(URL.revokeObjectURL);
    },
    [],
  );

  const addFiles = (incoming: File[]): void => {
    const allowed = incoming.filter(
      (file) => file.type.startsWith('image/') || /\.(heic|heif|avif|svg|tiff?)$/i.test(file.name),
    );
    const selected = tool.multiple ? allowed : allowed.slice(0, 1);
    const next = selected.map((file) => ({ file, url: URL.createObjectURL(file) }));
    next.forEach((item) => {
      const image = new Image();
      image.onload = () =>
        setFiles((current) =>
          current.map((entry) =>
            entry.url === item.url
              ? { ...entry, width: image.naturalWidth, height: image.naturalHeight }
              : entry,
          ),
        );
      image.src = item.url;
    });
    setFiles((current) => (tool.multiple ? [...current, ...next].slice(0, 50) : next));
    setDeleted(false);
    setJob(undefined);
    setError('');
    track('file_selected', {
      tool_id: tool.id,
      file_count: selected.length,
      file_count_bucket: selected.length === 1 ? '1' : selected.length <= 10 ? '2-10' : '11+',
      total_bytes: selected.reduce((sum, f) => sum + f.size, 0),
    });
  };

  const removeFile = (url: string): void => {
    URL.revokeObjectURL(url);
    setFiles((current) => {
      const remaining = current.filter((item) => item.url !== url);
      track('file_removed', { tool_id: tool.id, remaining_files: remaining.length });
      return remaining;
    });
  };

  const operation = useMemo(() => {
    const next = { ...settings };
    if (next.kind === 'compress' && next.mode === 'exact')
      next.targetBytes = Math.round(targetValue * (targetUnit === 'MB' ? 1024 * 1024 : 1024));
    return next;
  }, [settings, targetValue, targetUnit]);

  const poll = async (id: string, secret: string): Promise<void> => {
    for (let count = 0; count < 300; count += 1) {
      const response = await fetch(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${secret}` },
        cache: 'no-store',
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error?.message ?? 'Could not read the temporary job.',
        );
      const next = (await response.json()) as PublicJob;
      setJob(next);
      if (next.status === 'complete') {
        await loadPreviews(next, secret);
        setBusy(false);
        const outFiles = next.files.filter((file) => file.role === 'output');
        const totalOutBytes = outFiles.reduce((acc, f) => acc + f.bytes, 0);
        track('processing_complete', {
          tool_id: tool.id,
          processing_result: 'success',
          output_count: outFiles.length,
          output_bytes: totalOutBytes,
        });
        return;
      }
      if (next.status === 'error') {
        setBusy(false);
        setError(next.error?.message ?? 'Processing failed.');
        track('processing_complete', {
          tool_id: tool.id,
          processing_result: next.error?.code ?? 'error',
        });
        track('error_encountered', {
          tool_id: tool.id,
          error_code: next.error?.code,
          error_message: next.error?.message ?? 'Processing failed.',
        });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    throw new Error(
      'Processing is taking longer than expected. The temporary job will still expire automatically.',
    );
  };

  const loadPreviews = async (next: PublicJob, secret: string): Promise<void> => {
    const outputFiles = next.files.filter((file) => file.role === 'output');
    const loaded: Record<string, string> = {};
    await Promise.all(
      outputFiles.map(async (file) => {
        if (previewUrls[file.id]) return;
        const response = await fetch(`/api/jobs/${next.id}/files/${file.id}/preview`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        if (response.ok) loaded[file.id] = URL.createObjectURL(await response.blob());
      }),
    );
    setPreviewUrls((current) => ({ ...current, ...loaded }));
  };

  const process = async (): Promise<void> => {
    if (!files.length) return;
    if (
      operation.kind === 'compress' &&
      operation.mode === 'exact' &&
      (!targetValue || targetValue <= 0)
    ) {
      setError('Enter a target greater than zero.');
      return;
    }
    setBusy(true);
    setError('');
    setJob(undefined);
    const body = new FormData();
    body.append('toolId', tool.id);
    body.append('operation', JSON.stringify(operation));
    files.forEach(({ file }) => body.append('files', file, file.name));
    track('processing_start', {
      tool_id: tool.id,
      file_count: files.length,
      output_format: operation.format ?? 'original',
      mode: operation.mode ?? 'default',
    });
    try {
      const response = await fetch('/api/jobs', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? 'Upload failed.');
      setToken(result.token);
      await poll(result.id, result.token);
    } catch (problem) {
      setBusy(false);
      const msg = problem instanceof Error ? problem.message : 'The network interrupted this job.';
      setError(msg);
      track('error_encountered', { tool_id: tool.id, error_message: msg });
    }
  };

  const download = async (file: JobFile): Promise<void> => {
    if (!job) return;
    const response = await fetch(`/api/jobs/${job.id}/files/${file.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setError('This result is no longer available.');
      track('error_encountered', {
        tool_id: tool.id,
        error_message: 'Result no longer available',
      });
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.downloadName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track('download_result', {
      tool_id: tool.id,
      output_format: file.format,
      bytes: file.bytes,
      savings_percent: file.savingsPercent,
    });
  };

  const downloadAll = async (): Promise<void> => {
    if (!job) return;
    const response = await fetch(`/api/jobs/${job.id}/download-all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setError('The ZIP could not be generated. Individual downloads still work.');
      track('error_encountered', { tool_id: tool.id, error_message: 'ZIP generation failed' });
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'compressimage-results.zip';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track('download_batch', { tool_id: tool.id, file_count: outputs.length });
  };

  const deleteNow = async (): Promise<void> => {
    if (!job) return;
    const response = await fetch(`/api/jobs/${job.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setDeleted(true);
      setJob(undefined);
      setFiles([]);
      Object.values(previewUrls).forEach(URL.revokeObjectURL);
      setPreviewUrls({});
      track('delete_job', { tool_id: tool.id });
    }
  };

  const chain = async (sourceFileId: string, nextOperation: Record<string, any>): Promise<void> => {
    if (!job) return;
    setBusy(true);
    setError('');
    const response = await fetch(`/api/jobs/${job.id}/operations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceFileId, operation: nextOperation }),
    });
    if (!response.ok) {
      setBusy(false);
      const msg = (await response.json()).error?.message ?? 'Could not continue this job.';
      setError(msg);
      track('error_encountered', { tool_id: tool.id, error_message: msg });
      return;
    }
    track('continue_with_tool', { tool_id: tool.id, next_operation: nextOperation.kind });
    await poll(job.id, token);
  };

  const outputs = job?.files.filter((file) => file.role === 'output') ?? [];
  const sources = job?.files.filter((file) => file.role === 'source') ?? [];
  const inspectOnly = tool.kind === 'metadata' && settings.action === 'inspect';

  if (deleted)
    return (
      <div class="workspace-wrap shell">
        <div class="workspace deleted-box" role="status">
          <h2>Deleted from server.</h2>
          <p>The temporary job and all of its files are gone.</p>
          <button class="primary-button" type="button" onClick={() => setDeleted(false)}>
            Start another image
          </button>
        </div>
      </div>
    );

  return (
    <div class="workspace-wrap shell">
      <div class="workspace">
        {!files.length ? (
          <>
            <div
              class={`dropzone ${dragging ? 'dragging' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(Array.from(event.dataTransfer?.files ?? []));
              }}
            >
              <div>
                <div class="dropzone-icon" aria-hidden="true">
                  ↓
                </div>
                <h2>Drop {tool.multiple ? 'images' : 'an image'} here</h2>
                <p>or paste from your clipboard</p>
                <button
                  class="primary-button"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose {tool.multiple ? 'images' : 'an image'}
                </button>
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept={tool.accept ?? 'image/*,.heic,.heif,.avif,.svg,.tif,.tiff'}
                  multiple={tool.multiple}
                  onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
                />
              </div>
            </div>
            <div class="privacy-note">
              Processed on compressimage.fun servers. Files auto-delete within four hours. This is
              not a no-upload tool.
            </div>
          </>
        ) : (
          <>
            <div class="workspace-grid">
              <section class="queue-panel" aria-labelledby="selected-title">
                <div class="panel-title">
                  <h2 id="selected-title">
                    {files.length} {files.length === 1 ? 'image' : 'images'}
                  </h2>
                  <button
                    class="secondary-button"
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    Add
                  </button>
                </div>
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept={tool.accept ?? 'image/*,.heic,.heif,.avif,.svg,.tif,.tiff'}
                  multiple={tool.multiple}
                  onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
                />
                <ul class="file-list">
                  {files.map((item) => (
                    <li class="file-card" key={item.url}>
                      <img class="file-thumb" src={item.url} alt="" />
                      <div>
                        <strong title={item.file.name}>{item.file.name}</strong>
                        <small>
                          {item.file.type?.replace('image/', '').toUpperCase() || 'IMAGE'} ·{' '}
                          {bytesLabel(item.file.size)}
                          {item.width ? ` · ${item.width} × ${item.height}` : ''}
                        </small>
                      </div>
                      <button
                        class="icon-button"
                        type="button"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => removeFile(item.url)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <aside class="settings-panel" aria-labelledby="settings-title">
                <h2 id="settings-title">Settings</h2>
                <Settings
                  tool={tool}
                  settings={settings}
                  setSettings={setSettings}
                  targetValue={targetValue}
                  setTargetValue={setTargetValue}
                  targetUnit={targetUnit}
                  setTargetUnit={setTargetUnit}
                  sourceRatio={
                    files[0]?.width && files[0]?.height
                      ? files[0].width / files[0].height
                      : undefined
                  }
                />
                <button
                  class="primary-button process-button"
                  type="button"
                  disabled={busy}
                  onClick={process}
                >
                  {busy
                    ? 'Working…'
                    : inspectOnly
                      ? 'Inspect metadata'
                      : tool.kind === 'favicon'
                        ? 'Generate icons'
                        : `Process ${files.length === 1 ? 'image' : `${files.length} images`}`}
                </button>
              </aside>
            </div>
            <div class="status-bar" hidden={!busy} role="status" aria-live="polite">
              <div class="status-stage">
                <span class="spinner" aria-hidden="true"></span>
                <strong>{stageLabel[job?.stage ?? 'uploading'] ?? 'Processing image'}</strong>
              </div>
              {job?.queuePosition && <span>Queue position {job.queuePosition}</span>}
            </div>
            {error && (
              <div class="error-box" role="alert">
                <strong>That did not work.</strong>
                <br />
                {error}
              </div>
            )}
            {job?.status === 'complete' && (
              <section class="results" aria-labelledby="results-title">
                <div class="panel-title">
                  <h2 id="results-title">{inspectOnly ? 'Metadata' : 'Results'}</h2>
                  <div class="result-actions">
                    {outputs.length > 1 && (
                      <button class="secondary-button" type="button" onClick={downloadAll}>
                        Download all ZIP
                      </button>
                    )}
                    <button class="danger-button" type="button" onClick={deleteNow}>
                      Delete now
                    </button>
                  </div>
                </div>
                {inspectOnly ? (
                  <MetadataView files={sources} />
                ) : (
                  outputs.map((file) => {
                    const source = sources.find((item) => item.id === file.sourceId);
                    const originalUrl = files.find(
                      (item) => item.file.name === source?.originalName,
                    )?.url;
                    const resultUrl = previewUrls[file.id];
                    return (
                      <div class="result-card" key={file.id}>
                        <div>
                          {resultUrl && (
                            <ComparePreview
                              originalUrl={originalUrl}
                              resultUrl={resultUrl}
                              name={file.originalName}
                            />
                          )}
                        </div>
                        <div>
                          <span class="success-pill">
                            {file.note?.startsWith('Already')
                              ? 'Already small enough'
                              : `${file.savingsPercent ?? 0}% saved`}
                          </span>
                          <h3>{file.downloadName}</h3>
                          {file.note && <p>{file.note}</p>}
                          <div class="result-metrics">
                            <div class="metric">
                              <span>Original</span>
                              <strong>{bytesLabel(source?.bytes ?? 0)}</strong>
                            </div>
                            <div class="metric">
                              <span>Result</span>
                              <strong>{bytesLabel(file.bytes)}</strong>
                            </div>
                            <div class="metric">
                              <span>Dimensions</span>
                              <strong>
                                {file.width > 0
                                  ? `${file.width} × ${file.height}`
                                  : 'Not applicable'}
                              </strong>
                            </div>
                            <div class="metric">
                              <span>Format</span>
                              <strong>{file.format.toUpperCase()}</strong>
                            </div>
                          </div>
                          <div class="result-actions">
                            <button
                              class="primary-button"
                              type="button"
                              onClick={() => download(file)}
                            >
                              Download
                            </button>
                            <button
                              class="secondary-button"
                              type="button"
                              onClick={() =>
                                chain(file.id, {
                                  kind: 'compress',
                                  mode: 'smart',
                                  format: 'original',
                                })
                              }
                            >
                              Compress again
                            </button>
                            <button
                              class="secondary-button"
                              type="button"
                              onClick={() =>
                                chain(file.id, {
                                  kind: 'resize',
                                  width: Math.min(file.width, 1200),
                                  fit: 'inside',
                                  format: 'original',
                                  quality: 82,
                                })
                              }
                            >
                              Resize
                            </button>
                            <button
                              class="secondary-button"
                              type="button"
                              onClick={() =>
                                chain(file.id, {
                                  kind: 'crop',
                                  left: Math.round(file.width * 0.05),
                                  top: Math.round(file.height * 0.05),
                                  width: Math.round(file.width * 0.9),
                                  height: Math.round(file.height * 0.9),
                                  format: 'original',
                                })
                              }
                            >
                              Crop
                            </button>
                            <button
                              class="secondary-button"
                              type="button"
                              onClick={() =>
                                chain(file.id, {
                                  kind: 'convert',
                                  format: file.format === 'webp' ? 'jpeg' : 'webp',
                                  quality: 82,
                                })
                              }
                            >
                              Convert
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <p class="muted">
                  Files delete automatically by{' '}
                  {new Date(job.expiresAt ?? Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  . Delete now removes them immediately.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Settings({
  tool,
  settings,
  setSettings,
  targetValue,
  setTargetValue,
  targetUnit,
  setTargetUnit,
  sourceRatio,
}: any) {
  const update = (key: string, value: any) =>
    setSettings((current: Record<string, any>) => ({ ...current, [key]: value }));
  if (tool.kind === 'compress')
    return (
      <>
        <fieldset class="setting-group">
          <legend>Mode</legend>
          <div class="mode-tabs">
            {['smart', 'exact', 'quality', 'lossless'].map((mode) => (
              <button
                type="button"
                class={settings.mode === mode ? 'active' : ''}
                onClick={() => {
                  update('mode', mode);
                  track('mode_changed', { tool_id: tool.id, mode });
                }}
              >
                {mode === 'exact' ? 'Exact Size' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </fieldset>
        {settings.mode === 'exact' && (
          <div class="field">
            <label for="target-size">Maximum file size</label>
            <div class="field-row">
              <input
                id="target-size"
                type="number"
                min="1"
                max="102400"
                value={targetValue}
                onInput={(event) => setTargetValue(Number(event.currentTarget.value))}
              />
              <select
                aria-label="Target size unit"
                value={targetUnit}
                onChange={(event) => setTargetUnit(event.currentTarget.value)}
              >
                <option>KB</option>
                <option>MB</option>
              </select>
            </div>
            <div class="target-presets">
              {[20, 50, 100, 200, 500, 1024].map((kb) => (
                <button
                  type="button"
                  onClick={() => {
                    setTargetValue(kb === 1024 ? 1 : kb);
                    setTargetUnit(kb === 1024 ? 'MB' : 'KB');
                    track('target_size_selected', {
                      tool_id: tool.id,
                      target_size_bucket: kb === 1024 ? '1mb' : `${kb}kb`,
                    });
                  }}
                >
                  {kb === 1024 ? '1 MB' : `${kb} KB`}
                </button>
              ))}
            </div>
          </div>
        )}
        {settings.mode === 'quality' && (
          <div class="field">
            <label for="quality">Quality</label>
            <div class="range-row">
              <input
                id="quality"
                type="range"
                min="1"
                max="100"
                value={settings.quality ?? 82}
                onInput={(event) => update('quality', Number(event.currentTarget.value))}
              />
              <output>{settings.quality ?? 82}</output>
            </div>
          </div>
        )}
        <FormatField value={settings.format} update={update} />
        <details>
          <summary>Advanced</summary>
          <label class="check">
            <input
              type="checkbox"
              checked={Boolean(settings.preserveMetadata)}
              onChange={(event) => update('preserveMetadata', event.currentTarget.checked)}
            />{' '}
            Preserve metadata
          </label>
          {settings.mode === 'exact' && (
            <>
              <div class="field-row">
                <NumberField
                  label="Maximum width"
                  value={settings.maxWidth}
                  onValue={(value) => update('maxWidth', value)}
                />
                <NumberField
                  label="Maximum height"
                  value={settings.maxHeight}
                  onValue={(value) => update('maxHeight', value)}
                />
              </div>
              <label class="check">
                <input
                  type="checkbox"
                  checked={Boolean(settings.aggressive)}
                  onChange={(event) => update('aggressive', event.currentTarget.checked)}
                />{' '}
                Allow aggressive quality
              </label>
            </>
          )}
        </details>
      </>
    );
  if (tool.kind === 'resize')
    return (
      <>
        <div class="field-row">
          <NumberField
            label="Width"
            value={settings.width}
            onValue={(value) => {
              update('width', value);
              if (settings.lockAspect && sourceRatio && value)
                update('height', Math.round(value / sourceRatio));
            }}
          />
          <NumberField
            label="Height"
            value={settings.height}
            onValue={(value) => {
              update('height', value);
              if (settings.lockAspect && sourceRatio && value)
                update('width', Math.round(value * sourceRatio));
            }}
          />
        </div>
        <label class="check">
          <input
            type="checkbox"
            checked={Boolean(settings.lockAspect)}
            onChange={(event) => update('lockAspect', event.currentTarget.checked)}
          />{' '}
          Lock source aspect ratio
        </label>
        <NumberField
          label="Percentage (optional)"
          value={settings.percentage}
          onValue={(value) => update('percentage', value)}
        />
        <div class="field">
          <label for="fit">Fit</label>
          <select
            id="fit"
            value={settings.fit ?? 'inside'}
            onChange={(event) => update('fit', event.currentTarget.value)}
          >
            <option value="inside">Fit inside</option>
            <option value="cover">Fill and crop</option>
            <option value="contain">Contain with background</option>
            <option value="fill">Stretch to exact size</option>
            <option value="outside">Cover outside</option>
          </select>
        </div>
        <FormatField value={settings.format} update={update} />
        <div class="field">
          <label for="resize-quality">Quality</label>
          <div class="range-row">
            <input
              id="resize-quality"
              type="range"
              min="1"
              max="100"
              value={settings.quality ?? 82}
              onInput={(event) => update('quality', Number(event.currentTarget.value))}
            />
            <output>{settings.quality ?? 82}</output>
          </div>
        </div>
      </>
    );
  if (tool.kind === 'crop')
    return (
      <>
        <div class="field-row">
          <NumberField
            label="Left"
            value={settings.left}
            onValue={(value) => update('left', value)}
          />
          <NumberField label="Top" value={settings.top} onValue={(value) => update('top', value)} />
          <NumberField
            label="Width"
            value={settings.width}
            onValue={(value) => update('width', value)}
          />
          <NumberField
            label="Height"
            value={settings.height}
            onValue={(value) => update('height', value)}
          />
        </div>
        <div class="target-presets">
          {[
            ['1:1', 1],
            ['4:3', 4 / 3],
            ['3:2', 1.5],
            ['16:9', 16 / 9],
          ].map(([label, ratio]) => (
            <button
              type="button"
              onClick={() => {
                update('height', Math.max(1, Math.round(Number(settings.width) / Number(ratio))));
                track('crop_preset_selected', { tool_id: tool.id, preset: label });
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <FormatField value={settings.format} update={update} />
      </>
    );
  if (tool.kind === 'rotate')
    return (
      <>
        <div class="field">
          <label for="degrees">Clockwise rotation</label>
          <select
            id="degrees"
            value={settings.degrees}
            onChange={(event) => update('degrees', Number(event.currentTarget.value))}
          >
            <option value="90">90°</option>
            <option value="180">180°</option>
            <option value="270">270°</option>
          </select>
        </div>
        <FormatField value={settings.format} update={update} />
      </>
    );
  if (tool.kind === 'convert')
    return (
      <>
        <FormatField value={settings.format} update={update} noOriginal />
        <div class="field">
          <label for="quality">Quality</label>
          <div class="range-row">
            <input
              id="quality"
              type="range"
              min="1"
              max="100"
              value={settings.quality ?? 82}
              onInput={(event) => update('quality', Number(event.currentTarget.value))}
            />
            <output>{settings.quality ?? 82}</output>
          </div>
        </div>
        {settings.format === 'jpeg' && (
          <div class="field">
            <label for="background">Transparency background</label>
            <input
              id="background"
              type="color"
              value={settings.background ?? '#ffffff'}
              onInput={(event) => update('background', event.currentTarget.value)}
            />
          </div>
        )}
      </>
    );
  if (tool.kind === 'watermark')
    return (
      <>
        <div class="field">
          <label for="watermark">Watermark text</label>
          <input
            id="watermark"
            value={settings.text}
            onInput={(event) => update('text', event.currentTarget.value)}
          />
        </div>
        <div class="field">
          <label for="position">Position</label>
          <select
            id="position"
            value={settings.position}
            onChange={(event) => update('position', event.currentTarget.value)}
          >
            {[
              'northwest',
              'north',
              'northeast',
              'west',
              'center',
              'east',
              'southwest',
              'south',
              'southeast',
            ].map((position) => (
              <option value={position}>
                {position.replace(/^(.)/, (letter) => letter.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <div class="field">
          <label for="opacity">Opacity</label>
          <input
            id="opacity"
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={settings.opacity}
            onInput={(event) => update('opacity', Number(event.currentTarget.value))}
          />
        </div>
        <FormatField value={settings.format} update={update} />
      </>
    );
  if (tool.kind === 'metadata')
    return (
      <p class="muted">
        {settings.action === 'inspect'
          ? 'Format, dimensions, color, camera, and GPS fields will be reported when present.'
          : 'A new copy will be encoded without EXIF, GPS, or other optional metadata.'}
      </p>
    );
  if (tool.kind === 'prepare')
    return (
      <>
        <div class="field-row">
          <NumberField
            label="Width"
            value={settings.width}
            onValue={(value) => update('width', value)}
          />
          <NumberField
            label="Height"
            value={settings.height}
            onValue={(value) => update('height', value)}
          />
        </div>
        <div class="field-row">
          <div class="field">
            <label for="minimum-kb">Minimum KB (optional)</label>
            <input
              id="minimum-kb"
              type="number"
              min="0"
              value={settings.minBytes ? Math.round(settings.minBytes / 1024) : ''}
              onInput={(event) =>
                update(
                  'minBytes',
                  event.currentTarget.value ? Number(event.currentTarget.value) * 1024 : undefined,
                )
              }
            />
          </div>
          <div class="field">
            <label for="maximum-kb">Maximum KB</label>
            <input
              id="maximum-kb"
              type="number"
              min="1"
              value={settings.targetBytes ? Math.round(settings.targetBytes / 1024) : ''}
              onInput={(event) =>
                update(
                  'targetBytes',
                  event.currentTarget.value ? Number(event.currentTarget.value) * 1024 : undefined,
                )
              }
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="prepare-format">Format</label>
            <select
              id="prepare-format"
              value={settings.format}
              onChange={(event) => update('format', event.currentTarget.value)}
            >
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </div>
          <NumberField
            label="DPI"
            value={settings.density}
            onValue={(value) => update('density', value)}
          />
        </div>
        <div class="field">
          <label for="prepare-fit">Image fit</label>
          <select
            id="prepare-fit"
            value={settings.fit}
            onChange={(event) => update('fit', event.currentTarget.value)}
          >
            <option value="cover">Fill and crop</option>
            <option value="contain">Contain with background</option>
          </select>
        </div>
        <div class="field">
          <label for="prepare-position">Crop position</label>
          <select
            id="prepare-position"
            value={settings.position ?? 'centre'}
            onChange={(event) => update('position', event.currentTarget.value)}
          >
            <option value="centre">Center</option>
            <option value="north">Top</option>
            <option value="south">Bottom</option>
            <option value="west">Left</option>
            <option value="east">Right</option>
          </select>
        </div>
        <div class="field">
          <label for="prepare-background">Background</label>
          <input
            id="prepare-background"
            type="color"
            disabled={settings.background === '#00000000'}
            value={
              settings.background === '#00000000' ? '#ffffff' : (settings.background ?? '#ffffff')
            }
            onInput={(event) => update('background', event.currentTarget.value)}
          />
        </div>
        {settings.format === 'png' && (
          <label class="check">
            <input
              type="checkbox"
              checked={settings.background === '#00000000'}
              onChange={(event) =>
                update('background', event.currentTarget.checked ? '#00000000' : '#ffffff')
              }
            />{' '}
            Transparent background
          </label>
        )}
        <label class="check">
          <input
            type="checkbox"
            checked={Boolean(settings.trim)}
            onChange={(event) => update('trim', event.currentTarget.checked)}
          />{' '}
          Trim border-like whitespace
        </label>
      </>
    );
  if (tool.kind === 'favicon')
    return (
      <>
        <div class="field">
          <label for="favicon-fit">Icon fit</label>
          <select
            id="favicon-fit"
            value={settings.fit ?? 'contain'}
            onChange={(event) => update('fit', event.currentTarget.value)}
          >
            <option value="contain">Fit whole image</option>
            <option value="cover">Fill square and crop</option>
          </select>
        </div>
        <div class="field">
          <label for="favicon-background">Background</label>
          <input
            id="favicon-background"
            type="color"
            disabled={settings.background === '#00000000'}
            value={
              settings.background === '#00000000' ? '#ffffff' : (settings.background ?? '#ffffff')
            }
            onInput={(event) => update('background', event.currentTarget.value)}
          />
        </div>
        <label class="check">
          <input
            type="checkbox"
            checked={settings.background === '#00000000'}
            onChange={(event) =>
              update('background', event.currentTarget.checked ? '#00000000' : '#ffffff')
            }
          />{' '}
          Transparent background
        </label>
        <p class="muted">
          Creates favicon.ico, six PNG sizes, an HTML snippet, and a ZIP-ready result set.
        </p>
      </>
    );
  return null;
}

function NumberField({
  label,
  value,
  onValue,
}: {
  label: string;
  value?: number;
  onValue: (value?: number) => void;
}) {
  const id = label.toLowerCase().replace(/\W+/g, '-');
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input
        id={id}
        type="number"
        min="0"
        value={value ?? ''}
        onInput={(event) =>
          onValue(event.currentTarget.value ? Number(event.currentTarget.value) : undefined)
        }
      />
    </div>
  );
}
function FormatField({
  value,
  update,
  noOriginal = false,
}: {
  value?: string;
  update: (key: string, value: any) => void;
  noOriginal?: boolean;
}) {
  return (
    <div class="field">
      <label for="output-format">Output format</label>
      <select
        id="output-format"
        value={value ?? 'original'}
        onChange={(event) => {
          const next = event.currentTarget.value;
          update('format', next);
          track('format_changed', { format: next });
        }}
      >
        {formats
          .filter((format) => !noOriginal || format !== 'original')
          .map((format) => (
            <option value={format}>
              {format === 'original' ? 'Keep original format' : format.toUpperCase()}
            </option>
          ))}
      </select>
    </div>
  );
}
function MetadataView({ files }: { files: JobFile[] }) {
  return (
    <div>
      {files.map((file) => (
        <div class="metadata-card">
          <h3>{file.originalName}</h3>
          <dl class="inline-data">
            <div>
              <dt>Format</dt>
              <dd>{file.format.toUpperCase()}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>
                {file.width} × {file.height}
              </dd>
            </div>
            <div>
              <dt>File size</dt>
              <dd>{bytesLabel(file.bytes)}</dd>
            </div>
            {Object.entries(file.metadata ?? {})
              .filter(([key]) => !['exif', 'format', 'width', 'height'].includes(key))
              .map(([key, value]) => (
                <div>
                  <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
          </dl>
          {file.metadata?.exif && (
            <>
              <h4>EXIF fields</h4>
              <dl class="inline-data">
                {Object.entries(file.metadata.exif).map(([key, value]) => (
                  <div class={key.startsWith('GPS') ? 'gps-field' : ''}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
function ComparePreview({
  originalUrl,
  resultUrl,
  name,
}: {
  originalUrl: string | undefined;
  resultUrl: string;
  name: string;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  return (
    <div>
      <img
        class="result-preview"
        src={showOriginal && originalUrl ? originalUrl : resultUrl}
        alt={`${showOriginal ? 'Original' : 'Processed'} ${name}`}
      />
      <div class="compare-toggle" role="group" aria-label="Compare image">
        <button
          type="button"
          class={showOriginal ? 'active' : ''}
          onClick={() => setShowOriginal(true)}
          disabled={!originalUrl}
        >
          Original
        </button>
        <button
          type="button"
          class={!showOriginal ? 'active' : ''}
          onClick={() => setShowOriginal(false)}
        >
          Processed
        </button>
      </div>
    </div>
  );
}
