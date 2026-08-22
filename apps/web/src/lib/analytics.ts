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

export const track = (
  event: AnalyticsEvent | string,
  values: Record<string, string | number | boolean | undefined | null> = {},
): void => {
  if (typeof window === 'undefined') return;

  const payload: Record<string, string | number | boolean> = {};
  for (const [key, val] of Object.entries(values)) {
    if (val !== undefined && val !== null) {
      payload[key] = val;
    }
  }

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

