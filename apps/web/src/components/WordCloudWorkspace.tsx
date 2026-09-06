import cloud from 'd3-cloud';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

type Word = {
  text: string;
  weight: number;
  color?: string;
  included: boolean;
  x?: number;
  y?: number;
  size?: number;
  rotate?: number;
};
type Settings = {
  width: number;
  height: number;
  font: string;
  weight: number;
  minSize: number;
  maxSize: number;
  padding: number;
  spiral: 'archimedean' | 'rectangular';
  rotation: string;
  rotationChance: number;
  colors: string[];
  background: 'solid' | 'gradient' | 'transparent';
  backgroundA: string;
  backgroundB: string;
  seed: number;
};
const stopWords = new Set(
  'a an and are as at be by for from has he in is it its of on or that the to was were will with you your this these those i we they them their our not can have had do does did but if than then'.split(
    ' ',
  ),
);
const fonts: Record<string, string> = {
  'Modern Sans': 'Inter,Arial,sans-serif',
  'Editorial Serif': 'Georgia,serif',
  'Rounded Sans': 'ui-rounded,Arial,sans-serif',
  'Classic Serif': 'Times New Roman,serif',
  Mono: 'ui-monospace,monospace',
  'Heavy Display': 'Impact,Arial Black,sans-serif',
};
const base: Settings = {
  width: 1600,
  height: 1600,
  font: 'Heavy Display',
  weight: 800,
  minSize: 24,
  maxSize: 176,
  padding: 3,
  spiral: 'archimedean',
  rotation: 'gentle',
  rotationChance: 0.65,
  colors: ['#162b68', '#315df4', '#ff6658', '#ffd37a'],
  background: 'solid',
  backgroundA: '#fffaf2',
  backgroundB: '#dfe9ff',
  seed: 1,
};
const presets: Record<string, Partial<Settings>> = {
  'Electric Pop': { ...base },
  'Editorial Ink': {
    width: 1920,
    height: 1080,
    font: 'Editorial Serif',
    weight: 700,
    rotation: 'horizontal',
    rotationChance: 0,
    spiral: 'rectangular',
    colors: ['#152b68', '#ff6658', '#fff3d3'],
    background: 'solid',
    backgroundA: '#fffaf2',
  },
  'Sunset Poster': {
    width: 1080,
    height: 1350,
    font: 'Heavy Display',
    rotation: 'right',
    rotationChance: 0.7,
    colors: ['#ff6658', '#ff9b3d', '#ffd37a', '#5a285d'],
    background: 'solid',
    backgroundA: '#2b1134',
  },
  'Calm Ocean': {
    width: 1920,
    height: 1080,
    font: 'Modern Sans',
    weight: 700,
    rotation: 'gentle',
    colors: ['#007f87', '#315df4', '#74d9c3'],
    background: 'solid',
    backgroundA: '#e7f5ff',
  },
  'Mono Print': {
    width: 1600,
    height: 1600,
    font: 'Mono',
    weight: 700,
    rotation: 'right',
    rotationChance: 0.35,
    colors: ['#111111', '#666666'],
    background: 'solid',
    backgroundA: '#ffffff',
  },
  'Transparent Sticker': {
    ...base,
    background: 'transparent',
    colors: ['#315df4', '#ff6658', '#00a68a', '#ffb100'],
  },
};
const mulberry32 = (seed: number) => () => {
  let value = (seed += 0x6d2b79f5);
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};
const rotations: Record<string, number[]> = {
  horizontal: [0],
  gentle: [-30, 0, 30],
  right: [0, 90],
  mixed: [-90, -45, 0, 45, 90],
};

function parseText(
  input: string,
  lower: boolean,
  removeStops: boolean,
  excluded: string,
  minLength: number,
  maxWords: number,
): Word[] {
  const normalized = input.normalize('NFC').slice(0, 20_000);
  const parts =
    typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter(undefined, { granularity: 'word' }).segment(normalized))
          .filter((item) => item.isWordLike)
          .map((item) => item.segment)
      : (normalized.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []);
  const blocked = new Set(
    excluded
      .split(',')
      .map((value) => (lower ? value.trim().toLocaleLowerCase() : value.trim()))
      .filter(Boolean),
  );
  const counts = new Map<string, number>();
  parts.forEach((part) => {
    const word = lower ? part.toLocaleLowerCase() : part;
    if (
      word.length >= minLength &&
      !blocked.has(word) &&
      !(removeStops && stopWords.has(word.toLocaleLowerCase()))
    )
      counts.set(word, (counts.get(word) ?? 0) + 1);
  });
  return Array.from(counts, ([text, weight]) => ({ text, weight, included: true }))
    .sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text))
    .slice(0, maxWords);
}
function parseWeighted(input: string): { words: Word[]; errors: string[] } {
  const values = new Map<string, number>();
  const errors: string[] = [];
  input
    .split('\n')
    .slice(0, 300)
    .forEach((line, index) => {
      if (!line.trim()) return;
      const match = line.match(/^\s*(.+?)\s*:\s*([\d.]+)\s*$/);
      const weight = match ? Number(match[2]!) : NaN;
      if (!match || !Number.isFinite(weight) || weight < 0.1 || weight > 1_000_000) {
        errors.push(`Line ${index + 1}: use word or phrase: weight (0.1–1,000,000).`);
        return;
      }
      const text = match[1]!.normalize('NFC').trim();
      values.set(text, (values.get(text) ?? 0) + weight);
    });
  return {
    words: Array.from(values, ([text, weight]) => ({ text, weight, included: true })).sort(
      (a, b) => b.weight - a.weight || a.text.localeCompare(b.text),
    ),
    errors,
  };
}

export default function WordCloudWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<ReturnType<typeof cloud<Word>> | null>(null);
  const [mode, setMode] = useState<'text' | 'weighted'>('text');
  const [text, setText] = useState(
    'Make your ideas visible. Words that repeat become larger. Make your next presentation memorable.',
  );
  const [weighted, setWeighted] = useState(
    'Creativity: 16\nIdeas: 13\nDesign: 10\nColor: 8\nClarity: 7',
  );
  const [lower, setLower] = useState(true);
  const [removeStops, setRemoveStops] = useState(true);
  const [excluded, setExcluded] = useState('');
  const [minLength, setMinLength] = useState(3);
  const [maxWords, setMaxWords] = useState(100);
  const [settings, setSettings] = useState<Settings>(base);
  const [preset, setPreset] = useState('Electric Pop');
  const [placed, setPlaced] = useState<Word[]>([]);
  const [status, setStatus] = useState('Ready');
  const parsed = useMemo(
    () =>
      mode === 'text'
        ? { words: parseText(text, lower, removeStops, excluded, minLength, maxWords), errors: [] }
        : parseWeighted(weighted),
    [mode, text, weighted, lower, removeStops, excluded, minLength, maxWords],
  );
  const words = parsed.words;
  const customize = (next: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...next }));
    setPreset('Custom');
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const usable = words.filter((word) => word.included);
    if (usable.length < 2) {
      setPlaced([]);
      setStatus('Add at least two valid words to render.');
      return;
    }
    const timer = window.setTimeout(() => {
      layoutRef.current?.stop();
      setStatus('Rendering');
      const random = mulberry32(settings.seed);
      const maxWeight = Math.max(...usable.map((word) => word.weight));
      const minWeight = Math.min(...usable.map((word) => word.weight));
      const rotationSet = rotations[settings.rotation]!;
      const layout = cloud<Word>()
        .size([settings.width, settings.height])
        .words(usable.map((word) => ({ ...word })))
        .padding(settings.padding)
        .spiral(settings.spiral)
        .font(fonts[settings.font]!)
        .fontWeight(settings.weight)
        .fontSize((word) =>
          minWeight === maxWeight
            ? settings.maxSize
            : settings.minSize +
              ((word.weight - minWeight) / (maxWeight - minWeight)) *
                (settings.maxSize - settings.minSize),
        )
        .rotate(() =>
          random() <= settings.rotationChance
            ? rotationSet[Math.floor(random() * rotationSet.length)]!
            : 0,
        )
        .random(random)
        .timeInterval(16)
        .on('end', (tags) => {
          canvas.width = settings.width;
          canvas.height = settings.height;
          const context = canvas.getContext('2d');
          if (!context) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          if (settings.background !== 'transparent') {
            context.fillStyle =
              settings.background === 'gradient'
                ? (() => {
                    const gradient = context.createLinearGradient(
                      0,
                      0,
                      canvas.width,
                      canvas.height,
                    );
                    gradient.addColorStop(0, settings.backgroundA);
                    gradient.addColorStop(1, settings.backgroundB);
                    return gradient;
                  })()
                : settings.backgroundA;
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          tags.forEach((word, index) => {
            context.save();
            context.translate((word.x ?? 0) + canvas.width / 2, (word.y ?? 0) + canvas.height / 2);
            context.rotate(((word.rotate ?? 0) * Math.PI) / 180);
            context.font = `${settings.weight} ${word.size}px ${fonts[settings.font]!}`;
            context.fillStyle =
              word.color || settings.colors[index % settings.colors.length] || '#152b68';
            context.fillText(word.text ?? '', 0, 0);
            context.restore();
          });
          setPlaced(tags);
          setStatus(
            tags.length === usable.length
              ? 'Ready'
              : `Ready. ${usable.length - tags.length} words could not be placed; reduce words, size, or padding.`,
          );
        });
      layoutRef.current = layout;
      layout.start();
      window.setTimeout(() => {
        if (layoutRef.current === layout) {
          layout.stop();
          setStatus('Layout took too long. Reduce words, size, or padding.');
        }
      }, 2000);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      layoutRef.current?.stop();
    };
  }, [words, settings]);
  const download = (type: 'png' | 'jpeg' | 'webp') => {
    const source = canvasRef.current;
    if (!source || status !== 'Ready') return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = source.width;
    exportCanvas.height = source.height;
    const context = exportCanvas.getContext('2d');
    if (!context) return;
    if (type === 'jpeg') {
      context.fillStyle =
        settings.background === 'transparent' ? settings.backgroundA : settings.backgroundA;
      context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    context.drawImage(source, 0, 0);
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `word-cloud.${type === 'jpeg' ? 'jpg' : type}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      },
      `image/${type}`,
      type === 'png' ? undefined : 0.92,
    );
  };
  return (
    <div class="workspace-wrap shell">
      <div class="workspace word-cloud-workspace">
        <div class="word-cloud-controls">
          <fieldset class="setting-group">
            <legend>Words</legend>
            <div class="mode-tabs">
              <button class={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>
                Paste text
              </button>
              <button
                class={mode === 'weighted' ? 'active' : ''}
                onClick={() => setMode('weighted')}
              >
                Word + weight
              </button>
            </div>
          </fieldset>
          {mode === 'text' ? (
            <>
              <textarea
                aria-label="Paste text"
                maxLength={20000}
                value={text}
                onInput={(e) => setText(e.currentTarget.value)}
              />
              <label class="check">
                <input
                  type="checkbox"
                  checked={lower}
                  onChange={(e) => setLower(e.currentTarget.checked)}
                />{' '}
                Lowercase
              </label>
              <label class="check">
                <input
                  type="checkbox"
                  checked={removeStops}
                  onChange={(e) => setRemoveStops(e.currentTarget.checked)}
                />{' '}
                Remove English stop words
              </label>
              <input
                aria-label="Excluded words"
                placeholder="Excluded words, comma separated"
                value={excluded}
                onInput={(e) => setExcluded(e.currentTarget.value)}
              />
              <div class="field-row">
                <label>
                  Min length{' '}
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={minLength}
                    onInput={(e) => setMinLength(Number(e.currentTarget.value))}
                  />
                </label>
                <label>
                  Max words{' '}
                  <input
                    type="number"
                    min="10"
                    max="250"
                    value={maxWords}
                    onInput={(e) => setMaxWords(Number(e.currentTarget.value))}
                  />
                </label>
              </div>
            </>
          ) : (
            <textarea
              aria-label="Weighted words"
              value={weighted}
              onInput={(e) => setWeighted(e.currentTarget.value)}
            />
          )}
          {parsed.errors.map((error) => (
            <p class="error-inline">{error}</p>
          ))}
          <fieldset class="setting-group">
            <legend>Tested presets</legend>
            <select
              value={preset}
              onChange={(e) => {
                const name = e.currentTarget.value;
                setPreset(name);
                if (name !== 'Custom') setSettings((current) => ({ ...current, ...presets[name] }));
              }}
            >
              {Object.keys(presets).map((name) => (
                <option>{name}</option>
              ))}
              <option>Custom</option>
            </select>
          </fieldset>
          <div class="field-row">
            <label>
              Canvas{' '}
              <select
                value={`${settings.width}x${settings.height}`}
                onChange={(e) => {
                  const [width = settings.width, height = settings.height] = e.currentTarget.value
                    .split('x')
                    .map(Number);
                  customize({ width, height });
                }}
              >
                <option value="1600x1600">Square</option>
                <option value="1920x1080">Landscape</option>
                <option value="1600x900">Presentation</option>
                <option value="1080x1350">Portrait</option>
              </select>
            </label>
            <label>
              Font{' '}
              <select
                value={settings.font}
                onChange={(e) => customize({ font: e.currentTarget.value })}
              >
                {Object.keys(fonts).map((font) => (
                  <option>{font}</option>
                ))}
              </select>
            </label>
          </div>
          <div class="field-row">
            <label>
              Min size{' '}
              <input
                type="number"
                min="8"
                max="600"
                value={settings.minSize}
                onInput={(e) => customize({ minSize: Number(e.currentTarget.value) })}
              />
            </label>
            <label>
              Max size{' '}
              <input
                type="number"
                min="8"
                max="800"
                value={settings.maxSize}
                onInput={(e) => customize({ maxSize: Number(e.currentTarget.value) })}
              />
            </label>
          </div>
          <label>
            Padding{' '}
            <input
              type="range"
              min="0"
              max="20"
              value={settings.padding}
              onInput={(e) => customize({ padding: Number(e.currentTarget.value) })}
            />
          </label>
          <label>
            Rotation{' '}
            <select
              value={settings.rotation}
              onChange={(e) => customize({ rotation: e.currentTarget.value })}
            >
              <option value="horizontal">Horizontal</option>
              <option value="gentle">Gentle −30° / 0° / 30°</option>
              <option value="right">Right angles</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
          <label>
            Palette{' '}
            <input
              value={settings.colors.join(', ')}
              onInput={(e) =>
                customize({
                  colors: e.currentTarget.value
                    .split(',')
                    .map((color) => color.trim())
                    .filter(Boolean)
                    .slice(0, 8),
                })
              }
            />
          </label>
          <label>
            Background{' '}
            <select
              value={settings.background}
              onChange={(e) =>
                customize({ background: e.currentTarget.value as Settings['background'] })
              }
            >
              <option value="solid">Solid</option>
              <option value="gradient">Two-color gradient</option>
              <option value="transparent">Transparent</option>
            </select>
          </label>
          <button class="secondary-button" onClick={() => customize({ seed: settings.seed + 1 })}>
            Regenerate arrangement
          </button>
        </div>
        <div class="word-cloud-preview">
          <p role="status" aria-live="polite">
            {status}
          </p>
          <canvas ref={canvasRef} aria-label="Word cloud preview" />
          <div class="result-actions">
            <button
              class="primary-button"
              disabled={status !== 'Ready' || placed.length < 2}
              onClick={() => download('png')}
            >
              Download PNG
            </button>
            <button
              class="secondary-button"
              disabled={status !== 'Ready' || placed.length < 2}
              onClick={() => download('jpeg')}
            >
              Download JPG
            </button>
            <button
              class="secondary-button"
              disabled={status !== 'Ready' || placed.length < 2}
              onClick={() => download('webp')}
            >
              Download WebP
            </button>
          </div>
          <table>
            <caption class="visually-hidden">Accessible word frequencies</caption>
            <thead>
              <tr>
                <th>Word</th>
                <th>Weight</th>
                <th>Include</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word, index) => (
                <tr key={`${word.text}-${index}`}>
                  <td>{word.text}</td>
                  <td>
                    <input
                      type="number"
                      value={word.weight}
                      onInput={(e) => {
                        const next = [...words];
                        next[index] = { ...word, weight: Number(e.currentTarget.value) };
                        setWeighted(next.map((item) => `${item.text}: ${item.weight}`).join('\n'));
                        setMode('weighted');
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={word.included}
                      onChange={(e) => {
                        const next = [...words];
                        next[index] = { ...word, included: e.currentTarget.checked };
                        setWeighted(next.map((item) => `${item.text}: ${item.weight}`).join('\n'));
                        setMode('weighted');
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
