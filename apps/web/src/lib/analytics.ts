export type AnalyticsEvent =
  | 'tool_open'
  | 'file_selected'
  | 'file_removed'
  | 'processing_start'
  | 'processing_complete'
  | 'download_result'
  | 'download_batch'
  | 'delete_job'
  | 'continue_with_tool'
  | 'target_size_selected'
  | 'mode_changed'
  | 'format_changed'
  | 'crop_preset_selected'
  | 'base64_encode'
  | 'base64_decode'
  | 'base64_copy'
  | 'base64_download_text'
  | 'base64_download_image'
  | 'base64_format_changed'
  | 'pdf_reorder'
  | 'pdf_image_removed'
  | 'pdf_settings_changed'
  | 'color_locked'
  | 'color_copied'
  | 'color_zoom_changed'
  | 'tool_search'
  | 'error_encountered';

const safeDirectKeys = new Set([
  'tool_id',
  'input_format',
  'output_format',
  'file_count_bucket',
  'input_size_bucket',
  'output_size_bucket',
  'savings_bucket',
  'target_size_bucket',
  'processing_result',
  'mode',
  'format',
  'preset',
  'next_operation',
  'direction',
  'paper_size',
  'orientation',
  'setting',
]);

const countBucket = (value: number): string =>
  value <= 0 ? '0' : value === 1 ? '1' : value <= 10 ? '2-10' : value <= 50 ? '11-50' : '51+';
const sizeBucket = (value: number): string =>
  value < 100 * 1024
    ? 'under_100kb'
    : value < 1024 * 1024
      ? '100kb_1mb'
      : value < 10 * 1024 * 1024
        ? '1mb_10mb'
        : value < 100 * 1024 * 1024
          ? '10mb_100mb'
          : '100mb_plus';
const qualityBucket = (value: number): string =>
  value < 60 ? 'low' : value < 85 ? 'balanced' : 'high';
const errorCategory = (value: string): string => {
  const normalized = value.toLowerCase();
  if (normalized.includes('size') || normalized.includes('large')) return 'size_limit';
  if (normalized.includes('format') || normalized.includes('mime')) return 'unsupported_format';
  if (normalized.includes('decode') || normalized.includes('damage')) return 'decode_failed';
  if (normalized.includes('network') || normalized.includes('upload')) return 'network';
  if (normalized.includes('expired') || normalized.includes('available')) return 'expired';
  if (normalized.includes('target')) return 'target';
  return 'processing';
};

export const sanitizeAnalyticsPayload = (
  values: Record<string, string | number | boolean | undefined | null>,
): Record<string, string | number | boolean> => {
  const payload: Record<string, string | number | boolean> = {};
  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null) continue;
    if (safeDirectKeys.has(key)) {
      if (typeof val === 'string' && /^[a-z0-9_+./-]{1,64}$/i.test(val)) payload[key] = val;
      else if (typeof val === 'boolean') payload[key] = val;
      continue;
    }
    if (key === 'quality' && typeof val === 'number') payload.quality_bucket = qualityBucket(val);
    if (
      /^(?:file|page|output|remaining|total)_count$|^total_images$/.test(key) &&
      typeof val === 'number'
    )
      payload.count_bucket = countBucket(val);
    if (/bytes$|^char_count$/.test(key) && typeof val === 'number')
      payload.size_bucket = sizeBucket(val);
    if (key === 'savings_percent' && typeof val === 'number')
      payload.savings_bucket =
        val < 10 ? 'under_10' : val < 30 ? '10_29' : val < 60 ? '30_59' : '60_plus';
    if ((key === 'error_message' || key === 'error_code') && typeof val === 'string')
      payload.error_category = errorCategory(val);
    if (key === 'zoom' && typeof val === 'number')
      payload.zoom_bucket = val <= 1 ? '1x' : val <= 3 ? '2x_3x' : '4x_plus';
    if (key === 'value' && typeof val === 'string' && /^[a-z]{2,16}$/i.test(val))
      payload.setting_value = val.toLowerCase();
  }
  return payload;
};

export const track = (
  event: AnalyticsEvent | string,
  values: Record<string, string | number | boolean | undefined | null> = {},
): void => {
  if (typeof window === 'undefined') return;
  if (!/^[a-z][a-z0-9_]{1,48}$/.test(event)) return;
  const payload = sanitizeAnalyticsPayload(values);

  // 1. Umami Analytics
  try {
    const umami = (
      window as typeof window & {
        umami?: { track: (name: string, data?: Record<string, any>) => void };
      }
    ).umami;
    if (typeof umami?.track === 'function') {
      umami.track(event, payload);
    }
  } catch {
    // Ignore tracking failures
  }

  // 2. Google Analytics (gtag)
  try {
    const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', event, payload);
    }
  } catch {
    // Ignore tracking failures
  }
};
