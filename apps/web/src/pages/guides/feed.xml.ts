import { guides } from '../../data/guides';

export const prerender = true;
const origin = 'https://compressimage.fun';
const updated = new Date('2026-08-23T00:00:00Z').toUTCString();
const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const items = guides
    .map((guide) => {
      const url = `${origin}/guides/${guide.slug}`;
      return `<item><title>${escape(guide.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${escape(guide.summary)}</description><pubDate>${updated}</pubDate></item>`;
    })
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>compressimage.fun image guides</title><link>${origin}/guides</link><description>Practical image compression, resize, format, privacy, and developer guides with working tools.</description><language>en-US</language><lastBuildDate>${updated}</lastBuildDate>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
