import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { track } from '../lib/analytics';
import type { ToolDefinition } from '../data/tools';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_CHARS = 36 * 1024 * 1024;

const bytesLabel = (bytes: number): string =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 ** 2
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

const detectMime = (bytes: Uint8Array, declared?: string): string => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'GIF8') return 'image/gif';
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp';
  if (String.fromCharCode(...bytes.slice(4, 12)).includes('ftypavif')) return 'image/avif';
  const prefix = new TextDecoder().decode(bytes.slice(0, 256)).trim();
  if (prefix.startsWith('<svg') || prefix.startsWith('<?xml')) return 'image/svg+xml';
  return declared?.startsWith('image/') ? declared : 'application/octet-stream';
};

const normalizeBase64 = (input: string): { raw: string; declared?: string } => {
  let value = input.trim();
  if (value.length > MAX_TEXT_CHARS)
    throw new Error('This Base64 value is too large for safe in-browser decoding.');
  if (value.startsWith('{') || value.startsWith('[') || value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === 'string') value = parsed;
      else if (parsed && typeof parsed === 'object') {
        const candidates = Object.values(parsed as Record<string, unknown>).filter(
          (entry): entry is string => typeof entry === 'string',
        );
        if (candidates.length === 1 && candidates[0]) value = candidates[0];
      }
    } catch {
      // Continue with the literal text and show the normal validation error.
    }
  }
  const match = value.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.*)$/is);
  const raw = (match?.[2] ?? value).replace(/\s+/g, '');
  if (!raw || raw.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(raw))
    throw new Error('This is not valid Base64 image data.');
  return { raw, ...(match?.[1] ? { declared: match[1] } : {}) };
};

const decodeBytes = (raw: string): Uint8Array => {
  const binary = atob(raw);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return output;
};

export default function Base64Workspace({ tool }: { tool: ToolDefinition }) {
  const encodeMode = tool.kind === 'base64-encode';
  const [file, setFile] = useState<File>();
  const [dataUri, setDataUri] = useState('');
  const [wrapper, setWrapper] = useState(tool.id === 'image-to-data-uri' ? 'data-uri' : 'raw');
  const [text, setText] = useState('');
  const [decoded, setDecoded] = useState<{
    url: string;
    mime: string;
    bytes: number;
    width?: number;
    height?: number;
  }>();
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => decoded?.url && URL.revokeObjectURL(decoded.url), [decoded?.url]);
  useEffect(() => {
    if (!encodeMode) return;
    const paste = (event: ClipboardEvent): void =>
      readImage(
        Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/')),
      );
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [encodeMode]);

  const output = useMemo(() => {
    if (!dataUri || !file) return '';
    const raw = dataUri.slice(dataUri.indexOf(',') + 1);
    const escapedName = file.name.replace(/["<>]/g, '');
    if (wrapper === 'raw') return raw;
    if (wrapper === 'data-uri') return dataUri;
    if (wrapper === 'html') return `<img src="${dataUri}" alt="${escapedName}">`;
    if (wrapper === 'css') return `url("${dataUri}")`;
    if (wrapper === 'markdown') return `![${escapedName}](${dataUri})`;
    return JSON.stringify(dataUri);
  }, [dataUri, file, wrapper]);

  const readImage = (selected?: File): void => {
    if (!selected) return;
    setError('');
    if (selected.size > MAX_FILE_BYTES) {
      setError(
        'This image is larger than the 25 MB browser safety limit. Use a file workflow instead.',
      );
      return;
    }
    if (!selected.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile(selected);
      setDataUri(String(reader.result));
      track('base64_encode', {
        tool_id: tool.id,
        input_size_bucket:
          selected.size < 1024 * 100 ? 'small' : selected.size < 1024 * 1024 ? 'medium' : 'large',
      });
    };
    reader.onerror = () => setError('The browser could not read this image.');
    reader.readAsDataURL(selected);
  };

  const decode = (): void => {
    setError('');
    if (decoded?.url) URL.revokeObjectURL(decoded.url);
    try {
      const normalized = normalizeBase64(text);
      const bytes = decodeBytes(normalized.raw);
      const mime = detectMime(bytes, normalized.declared);
      if (!mime.startsWith('image/'))
        throw new Error('The decoded bytes are not a recognized image.');
      const blob = new Blob(
        [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
        { type: mime },
      );
      const url = URL.createObjectURL(blob);
      if (mime === 'image/svg+xml') {
        setDecoded({ url, mime, bytes: bytes.length });
      } else {
        const image = new Image();
        image.onload = () =>
          setDecoded({
            url,
            mime,
            bytes: bytes.length,
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        image.onerror = () => {
          URL.revokeObjectURL(url);
          setError('The Base64 decoded, but the image is damaged or unsupported.');
        };
        image.src = url;
      }
      track('base64_decode', { tool_id: tool.id, input_format: mime });
    } catch (problem) {
      setDecoded(undefined);
      setError(problem instanceof Error ? problem.message : 'Could not decode this value.');
    }
  };

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(output);
  };

  const downloadText = (): void => {
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${file?.name ?? 'image'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = (): void => {
    if (!decoded) return;
    const extension = decoded.mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin';
    const anchor = document.createElement('a');
    anchor.href = decoded.url;
    anchor.download = `decoded-image.${extension}`;
    anchor.click();
  };

  return (
    <div class="workspace-wrap shell">
      <div class="workspace base64-workspace">
        {encodeMode ? (
          <>
            {!file ? (
              <div
                class="dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  readImage(event.dataTransfer?.files[0]);
                }}
              >
                <div>
                  <div class="dropzone-icon" aria-hidden="true">
                    64
                  </div>
                  <h2>Choose an image</h2>
                  <p>Converted locally in this browser</p>
                  <button
                    class="primary-button"
                    type="button"
                    onClick={() => fileInput.current?.click()}
                  >
                    Browse image
                  </button>
                  <input
                    ref={fileInput}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(event) => readImage(event.currentTarget.files?.[0])}
                  />
                </div>
              </div>
            ) : (
              <div class="base64-grid">
                <section>
                  <img class="base64-preview" src={dataUri} alt="Selected image preview" />
                  <dl class="inline-data">
                    <div>
                      <dt>File</dt>
                      <dd>{file.name}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{file.type || 'Detected image'}</dd>
                    </div>
                    <div>
                      <dt>Original</dt>
                      <dd>{bytesLabel(file.size)}</dd>
                    </div>
                    <div>
                      <dt>Base64</dt>
                      <dd>{dataUri.length.toLocaleString()} characters</dd>
                    </div>
                    <div>
                      <dt>Overhead</dt>
                      <dd>about {Math.round(((dataUri.length - file.size) / file.size) * 100)}%</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <div class="field">
                    <label for="wrapper">Output format</label>
                    <select
                      id="wrapper"
                      value={wrapper}
                      onChange={(event) => setWrapper(event.currentTarget.value)}
                    >
                      <option value="raw">Raw Base64</option>
                      <option value="data-uri">Data URI</option>
                      <option value="html">HTML image</option>
                      <option value="css">CSS url()</option>
                      <option value="markdown">Markdown</option>
                      <option value="json">JSON string</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="base64-output">Encoded text</label>
                    <textarea id="base64-output" rows={12} readOnly value={output} />
                  </div>
                  <div class="result-actions">
                    <button class="primary-button" type="button" onClick={copy}>
                      Copy
                    </button>
                    <button class="secondary-button" type="button" onClick={downloadText}>
                      Download .txt
                    </button>
                    <button
                      class="secondary-button"
                      type="button"
                      onClick={() => {
                        setFile(undefined);
                        setDataUri('');
                      }}
                    >
                      Choose another
                    </button>
                  </div>
                </section>
              </div>
            )}
          </>
        ) : (
          <div class="base64-grid decode-grid">
            <section>
              <div class="field">
                <label for="base64-input">Base64, Data URI, or JSON string</label>
                <textarea
                  id="base64-input"
                  rows={16}
                  value={text}
                  onInput={(event) => setText(event.currentTarget.value)}
                  placeholder="data:image/png;base64,iVBORw0KGgo..."
                />
              </div>
              <button class="primary-button" type="button" disabled={!text.trim()} onClick={decode}>
                Decode image
              </button>
              <p class="muted small-copy">
                Runs here in your browser. Very large values are blocked before decoding to protect
                the tab.
              </p>
            </section>
            <section class="decoded-panel" aria-live="polite">
              {decoded ? (
                <>
                  {decoded.mime === 'image/svg+xml' ? (
                    <div class="svg-safe-note">
                      SVG decoded successfully. Preview is withheld because SVG can contain active
                      content.
                    </div>
                  ) : (
                    <img class="base64-preview" src={decoded.url} alt="Decoded Base64 image" />
                  )}
                  <dl class="inline-data">
                    <div>
                      <dt>Detected type</dt>
                      <dd>{decoded.mime}</dd>
                    </div>
                    <div>
                      <dt>Decoded size</dt>
                      <dd>{bytesLabel(decoded.bytes)}</dd>
                    </div>
                    {decoded.width && (
                      <div>
                        <dt>Dimensions</dt>
                        <dd>
                          {decoded.width} × {decoded.height}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <button class="primary-button" type="button" onClick={downloadImage}>
                    Download image
                  </button>
                </>
              ) : (
                <div class="empty-preview">
                  <span aria-hidden="true">⌁</span>
                  <p>Your decoded image appears here.</p>
                </div>
              )}
            </section>
          </div>
        )}
        {error && (
          <div class="error-box" role="alert">
            {error}
          </div>
        )}
        <div class="privacy-note">
          Browser-only tool. The image or Base64 value is not uploaded.
        </div>
      </div>
    </div>
  );
}
