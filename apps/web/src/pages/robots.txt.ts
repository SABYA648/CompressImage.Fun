export const prerender = true;
export function GET() {
  return new Response(
    'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://compressimage.fun/sitemap-index.xml\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
