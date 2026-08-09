export const prerender = true;
export function GET() {
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://compressimage.fun/sitemap-pages.xml</loc></sitemap></sitemapindex>';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
