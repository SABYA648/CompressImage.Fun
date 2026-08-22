import { PDFDocument } from 'pdf-lib';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ToolDefinition } from '../data/tools';
import { track } from '../lib/analytics';

interface PdfImage {
  file: File;
  url: string;
  id: string;
}
const paperSizes = { A4: [595.28, 841.89], Letter: [612, 792] } as const;
const createLocalId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const readImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode ${file.name}.`));
    };
    image.src = url;
  });

const toJpeg = async (
  file: File,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }> => {
  const image = await readImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Could not prepare a PDF page.'))),
      'image/jpeg',
      quality / 100,
    ),
  );
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
  };
};

export default function ImageToPdfWorkspace({ tool }: { tool: ToolDefinition }) {
  const input = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PdfImage[]>([]);
  const [paper, setPaper] = useState<'A4' | 'Letter' | 'Image'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(24);
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragged, setDragged] = useState<string>();

  useEffect(() => {
    const paste = (event: ClipboardEvent) => add(Array.from(event.clipboardData?.files ?? []));
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [images.length]);
  useEffect(() => () => images.forEach((image) => URL.revokeObjectURL(image.url)), []);

  const add = (files: File[]): void => {
    const accepted = files
      .filter(
        (file) =>
          file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp',
      )
      .slice(0, Math.max(0, 50 - images.length));
    setImages((current) => [
      ...current,
      ...accepted.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        // This key only manages local page order; it is not a security token.
        // Keep the tool functional on production-like HTTP service hostnames
        // where randomUUID may be unavailable outside a secure context.
        id: createLocalId(),
      })),
    ]);
    setError(
      accepted.length ? '' : 'Choose JPG, PNG, or WebP images that this browser can decode.',
    );
    if (accepted.length)
      track('file_selected', {
        tool_id: tool.id,
        file_count_bucket: accepted.length === 1 ? '1' : accepted.length <= 10 ? '2-10' : '11+',
      });
  };

  const move = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    track('pdf_reorder', {
      tool_id: tool.id,
      direction: direction > 0 ? 'down' : 'up',
      total_images: images.length,
    });
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) next.splice(target, 0, item);
      return next;
    });
  };

  const dropAt = (targetId: string): void => {
    if (!dragged || dragged === targetId) return;
    track('pdf_reorder', {
      tool_id: tool.id,
      direction: 'drag_drop',
      total_images: images.length,
    });
    setImages((current) => {
      const next = [...current];
      const from = next.findIndex((image) => image.id === dragged);
      const to = next.findIndex((image) => image.id === targetId);
      const [item] = next.splice(from, 1);
      if (item) next.splice(to, 0, item);
      return next;
    });
    setDragged(undefined);
  };

  const build = async (): Promise<void> => {
    setBusy(true);
    setError('');
    track('processing_start', {
      tool_id: tool.id,
      output_format: 'pdf',
      page_count: images.length,
      paper_size: paper,
      orientation,
      quality,
    });
    try {
      const pdf = await PDFDocument.create();
      for (const item of images) {
        const prepared = await toJpeg(item.file, quality);
        const embedded = await pdf.embedJpg(prepared.bytes);
        let pageWidth: number;
        let pageHeight: number;
        if (paper === 'Image') {
          pageWidth = (prepared.width * 72) / 96 + margin * 2;
          pageHeight = (prepared.height * 72) / 96 + margin * 2;
        } else {
          [pageWidth, pageHeight] = paperSizes[paper];
          if (orientation === 'landscape') [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
        const page = pdf.addPage([pageWidth, pageHeight]);
        const availableWidth = Math.max(1, pageWidth - margin * 2);
        const availableHeight = Math.max(1, pageHeight - margin * 2);
        const scale =
          fit === 'contain'
            ? Math.min(availableWidth / prepared.width, availableHeight / prepared.height)
            : Math.max(availableWidth / prepared.width, availableHeight / prepared.height);
        const width = prepared.width * scale;
        const height = prepared.height * scale;
        page.drawImage(embedded, {
          x: (pageWidth - width) / 2,
          y: (pageHeight - height) / 2,
          width,
          height,
        });
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      const url = URL.createObjectURL(
        new Blob(
          [
            bytes.buffer.slice(
              bytes.byteOffset,
              bytes.byteOffset + bytes.byteLength,
            ) as ArrayBuffer,
          ],
          { type: 'application/pdf' },
        ),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'images.pdf';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      track('processing_complete', {
        tool_id: tool.id,
        processing_result: 'success',
        page_count: images.length,
        output_bytes: bytes.length,
      });
      track('download_result', {
        tool_id: tool.id,
        output_format: 'pdf',
        page_count: images.length,
        output_bytes: bytes.length,
      });
    } catch (problem) {
      const msg = problem instanceof Error ? problem.message : 'Could not build the PDF.';
      setError(msg);
      track('processing_complete', { tool_id: tool.id, processing_result: 'error' });
      track('error_encountered', { tool_id: tool.id, error_message: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="workspace-wrap shell">
      <div class="workspace">
        {!images.length ? (
          <>
            <div
              class="dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                add(Array.from(event.dataTransfer?.files ?? []));
              }}
            >
              <div>
                <div class="dropzone-icon" aria-hidden="true">
                  PDF
                </div>
                <h2>Drop images in page order</h2>
                <p>JPG, PNG, or WebP · up to 50 images</p>
                <button class="primary-button" type="button" onClick={() => input.current?.click()}>
                  Choose images
                </button>
                <input
                  ref={input}
                  hidden
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => add(Array.from(event.currentTarget.files ?? []))}
                />
              </div>
            </div>
            <div class="privacy-note">Browser-only tool. Images are not uploaded.</div>
          </>
        ) : (
          <>
            <div class="workspace-grid">
              <section class="queue-panel">
                <div class="panel-title">
                  <h2>
                    {images.length} PDF {images.length === 1 ? 'page' : 'pages'}
                  </h2>
                  <button
                    class="secondary-button"
                    type="button"
                    onClick={() => input.current?.click()}
                  >
                    Add images
                  </button>
                </div>
                <input
                  ref={input}
                  hidden
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => add(Array.from(event.currentTarget.files ?? []))}
                />
                <ol class="pdf-image-list">
                  {images.map((item, index) => (
                    <li
                      draggable
                      onDragStart={() => setDragged(item.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropAt(item.id)}
                    >
                      <span class="page-number">{index + 1}</span>
                      <img src={item.url} alt="" />
                      <div>
                        <strong>{item.file.name}</strong>
                        <small>{(item.file.size / 1024).toFixed(1)} KB</small>
                      </div>
                      <div class="reorder-buttons">
                        <button
                          type="button"
                          aria-label={`Move ${item.file.name} up`}
                          onClick={() => move(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${item.file.name} down`}
                          onClick={() => move(index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${item.file.name}`}
                          onClick={() => {
                            URL.revokeObjectURL(item.url);
                            setImages((current) => current.filter((image) => image.id !== item.id));
                            track('pdf_image_removed', {
                              tool_id: tool.id,
                              remaining_images: images.length - 1,
                            });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              <aside class="settings-panel">
                <h2>PDF settings</h2>
                <div class="field">
                  <label for="paper">Page size</label>
                  <select
                    id="paper"
                    value={paper}
                    onChange={(event) => {
                      const next = event.currentTarget.value as typeof paper;
                      setPaper(next);
                      track('pdf_settings_changed', {
                        tool_id: tool.id,
                        setting: 'paper',
                        value: next,
                      });
                    }}
                  >
                    <option>A4</option>
                    <option>Letter</option>
                    <option value="Image">Fit to image</option>
                  </select>
                </div>
                {paper !== 'Image' && (
                  <div class="field">
                    <label for="orientation">Orientation</label>
                    <select
                      id="orientation"
                      value={orientation}
                      onChange={(event) => {
                        const next = event.currentTarget.value as typeof orientation;
                        setOrientation(next);
                        track('pdf_settings_changed', {
                          tool_id: tool.id,
                          setting: 'orientation',
                          value: next,
                        });
                      }}
                    >
                      <option>portrait</option>
                      <option>landscape</option>
                    </select>
                  </div>
                )}
                <div class="field">
                  <label for="margin">Margins: {margin} pt</label>
                  <input
                    id="margin"
                    type="range"
                    min="0"
                    max="72"
                    value={margin}
                    onInput={(event) => setMargin(Number(event.currentTarget.value))}
                  />
                </div>
                <div class="field">
                  <label for="pdf-fit">Image fit</label>
                  <select
                    id="pdf-fit"
                    value={fit}
                    onChange={(event) => {
                      const next = event.currentTarget.value as typeof fit;
                      setFit(next);
                      track('pdf_settings_changed', {
                        tool_id: tool.id,
                        setting: 'fit',
                        value: next,
                      });
                    }}
                  >
                    <option value="contain">Fit whole image</option>
                    <option value="cover">Fill page and crop edges</option>
                  </select>
                </div>
                <div class="field">
                  <label for="pdf-quality">Image quality: {quality}</label>
                  <input
                    id="pdf-quality"
                    type="range"
                    min="40"
                    max="100"
                    value={quality}
                    onInput={(event) => setQuality(Number(event.currentTarget.value))}
                  />
                </div>
                <button
                  class="primary-button process-button"
                  type="button"
                  disabled={busy}
                  onClick={build}
                >
                  {busy ? 'Building PDF…' : 'Build and download PDF'}
                </button>
              </aside>
            </div>
            <div class="privacy-note">PDF assembly and image encoding happen in this browser.</div>
          </>
        )}
        {error && (
          <div class="error-box" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
