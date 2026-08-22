import { useEffect, useRef, useState } from 'preact/hooks';
import type { ToolDefinition } from '../data/tools';
import { track } from '../lib/analytics';

type RGB = { r: number; g: number; b: number };
const hex = ({ r, g, b }: RGB): string =>
  `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const hsl = ({ r, g, b }: RGB): string => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta) {
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue /= 6;
  }
  return `hsl(${Math.round(hue * 360)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;
};

export default function ColorPickerWorkspace({ tool }: { tool: ToolDefinition }) {
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<RGB>({ r: 255, g: 91, b: 53 });
  const [locked, setLocked] = useState<RGB[]>([]);
  const [palette, setPalette] = useState<RGB[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const paste = (event: ClipboardEvent) => load(event.clipboardData?.files[0]);
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, []);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const load = (selected?: File): void => {
    if (!selected?.type.startsWith('image/')) {
      setError('Choose an image this browser can decode.');
      return;
    }
    if (url) URL.revokeObjectURL(url);
    const nextUrl = URL.createObjectURL(selected);
    setFile(selected);
    setUrl(nextUrl);
    setError('');
    const image = new Image();
    image.onload = () => {
      const target = canvas.current;
      if (!target) return;
      target.width = image.naturalWidth;
      target.height = image.naturalHeight;
      target.getContext('2d', { willReadFrequently: true })?.drawImage(image, 0, 0);
      setCursor({ x: Math.floor(image.naturalWidth / 2), y: Math.floor(image.naturalHeight / 2) });
      extractPalette(target);
    };
    image.onerror = () => {
      setError('This browser could not decode the image.');
      track('error_encountered', { tool_id: tool.id, error_message: 'Image decode failed' });
    };
    image.src = nextUrl;
    track('file_selected', { tool_id: tool.id, file_count_bucket: '1' });
  };
  const colorAt = (x: number, y: number): RGB => {
    const data = canvas.current
      ?.getContext('2d', { willReadFrequently: true })
      ?.getImageData(x, y, 1, 1).data;
    return data ? { r: data[0] ?? 0, g: data[1] ?? 0, b: data[2] ?? 0 } : hover;
  };
  const point = (event: MouseEvent): { x: number; y: number } => {
    const target = canvas.current!;
    const rect = target.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          target.width - 1,
          Math.floor(((event.clientX - rect.left) * target.width) / rect.width),
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          target.height - 1,
          Math.floor(((event.clientY - rect.top) * target.height) / rect.height),
        ),
      ),
    };
  };
  const extractPalette = (target: HTMLCanvasElement): void => {
    const sample = document.createElement('canvas');
    sample.width = 80;
    sample.height = 80;
    const context = sample.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.drawImage(target, 0, 0, 80, 80);
    const data = context.getImageData(0, 0, 80, 80).data;
    const buckets = new Map<string, number>();
    for (let index = 0; index < data.length; index += 16) {
      if ((data[index + 3] ?? 0) < 128) continue;
      const rgb = {
        r: Math.round((data[index] ?? 0) / 32) * 32,
        g: Math.round((data[index + 1] ?? 0) / 32) * 32,
        b: Math.round((data[index + 2] ?? 0) / 32) * 32,
      };
      const key = `${Math.min(255, rgb.r)},${Math.min(255, rgb.g)},${Math.min(255, rgb.b)}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    setPalette(
      [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => {
          const [r = 0, g = 0, b = 0] = key.split(',').map(Number);
          return { r, g, b };
        }),
    );
  };
  const lock = (color = hover): void => {
    track('color_locked', {
      tool_id: tool.id,
      hex: hex(color),
      rgb: `${color.r},${color.g},${color.b}`,
      hsl: hsl(color),
    });
    setLocked((current) =>
      [color, ...current.filter((item) => hex(item) !== hex(color))].slice(0, 8),
    );
  };
  const keyboard = (event: KeyboardEvent): void => {
    const delta = event.shiftKey ? 10 : 1;
    const target = canvas.current;
    if (!target) return;
    let { x, y } = cursor;
    if (event.key === 'ArrowLeft') x -= delta;
    else if (event.key === 'ArrowRight') x += delta;
    else if (event.key === 'ArrowUp') y -= delta;
    else if (event.key === 'ArrowDown') y += delta;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      lock(colorAt(x, y));
      return;
    } else return;
    event.preventDefault();
    x = Math.max(0, Math.min(target.width - 1, x));
    y = Math.max(0, Math.min(target.height - 1, y));
    setCursor({ x, y });
    setHover(colorAt(x, y));
  };
  const copy = (value: string): void => {
    track('color_copied', { tool_id: tool.id, value });
    void navigator.clipboard.writeText(value);
  };

  return (
    <div class="workspace-wrap shell">
      <div class="workspace color-workspace">
        {!file ? (
          <>
            <div
              class="dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                load(event.dataTransfer?.files[0]);
              }}
            >
              <div>
                <div class="dropzone-icon color-icon" aria-hidden="true"></div>
                <h2>Choose an image</h2>
                <p>Drop, browse, or paste</p>
                <button class="primary-button" type="button" onClick={() => input.current?.click()}>
                  Choose image
                </button>
                <input
                  ref={input}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => load(event.currentTarget.files?.[0])}
                />
              </div>
            </div>
            <div class="privacy-note">Browser-only tool. The image is not uploaded.</div>
          </>
        ) : (
          <div class="color-grid">
            <section>
              <div class="color-toolbar">
                <label for="zoom">Zoom {zoom.toFixed(1)}×</label>
                <input
                  id="zoom"
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={zoom}
                  onInput={(event) => {
                    const nextZoom = Number(event.currentTarget.value);
                    setZoom(nextZoom);
                    track('color_zoom_changed', { tool_id: tool.id, zoom: nextZoom });
                  }}
                />
                <button
                  class="secondary-button"
                  type="button"
                  onClick={() => {
                    setFile(undefined);
                    setUrl('');
                  }}
                >
                  Choose another
                </button>
              </div>
              <div class="canvas-scroll">
                <canvas
                  ref={canvas}
                  style={{ width: `${(canvas.current?.width ?? 600) * zoom}px` }}
                  tabindex={0}
                  aria-label="Image color sampling canvas. Use arrow keys to move and Enter to lock the current pixel."
                  onMouseMove={(event) => {
                    const next = point(event);
                    setCursor(next);
                    setHover(colorAt(next.x, next.y));
                  }}
                  onClick={() => lock()}
                  onKeyDown={keyboard}
                />
              </div>
              <p class="muted">
                Pixel {cursor.x}, {cursor.y}. Click or press Enter to keep this color.
              </p>
            </section>
            <aside class="settings-panel">
              <h2>Current pixel</h2>
              <div class="color-swatch" style={{ background: hex(hover) }}></div>
              <ColorValues color={hover} copy={copy} />
              <h3>Recent colors</h3>
              <div class="palette-row">
                {locked.length ? (
                  locked.map((color) => (
                    <button
                      type="button"
                      aria-label={`Copy ${hex(color)}`}
                      style={{ background: hex(color) }}
                      onClick={() => copy(hex(color))}
                    ></button>
                  ))
                ) : (
                  <span class="muted">Click a pixel to keep it.</span>
                )}
              </div>
              <h3>Five-color palette</h3>
              <div class="palette-list">
                {palette.map((color) => (
                  <button type="button" onClick={() => copy(hex(color))}>
                    <span style={{ background: hex(color) }}></span>
                    {hex(color)}
                  </button>
                ))}
              </div>
            </aside>
          </div>
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

function ColorValues({ color, copy }: { color: RGB; copy: (value: string) => void }) {
  const values = [hex(color), `rgb(${color.r}, ${color.g}, ${color.b})`, hsl(color)];
  return (
    <div class="color-values">
      {values.map((value) => (
        <button type="button" onClick={() => copy(value)}>
          <span>{value}</span>
          <b>Copy</b>
        </button>
      ))}
    </div>
  );
}
