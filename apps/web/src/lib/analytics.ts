export type AnalyticsEvent =
  | 'tool_open'
  | 'file_selected'
  | 'processing_start'
  | 'processing_complete'
  | 'download_result'
  | 'download_batch'
  | 'delete_job'
  | 'continue_with_tool'
  | 'target_size_selected'
  | 'base64_encode'
  | 'base64_decode';

const allowedKeys = new Set([
  'tool_id',
  'input_format',
  'output_format',
  'file_count_bucket',
  'input_size_bucket',
  'output_size_bucket',
  'savings_bucket',
  'target_size_bucket',
  'processing_result',
]);

export const track = (
  event: AnalyticsEvent,
  values: Record<string, string | number> = {},
): void => {
  if (typeof window === 'undefined') return;
  const safe = Object.fromEntries(Object.entries(values).filter(([key]) => allowedKeys.has(key)));
  const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', event, safe);
};
