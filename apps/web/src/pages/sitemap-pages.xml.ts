import { tools, toolPath } from '../data/tools';
import { guides } from '../data/guides';
export const prerender = true;
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function GET() {
  const routes = [
    '/',
    '/tools',
    '/guides',
    '/privacy',
    '/how-processing-works',
    '/compression-tests',
    ...tools.filter((tool) => tool.slug).map(toolPath),
    ...guides.map((guide) => `/guides/${guide.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(routes)].map((path) => `<url><loc>${escape(`https://compressimage.fun${path}`)}</loc></url>`).join('')}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
