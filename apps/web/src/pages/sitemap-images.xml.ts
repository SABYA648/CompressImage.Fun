export const prerender = true;

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>https://compressimage.fun/</loc><image:image><image:loc>https://compressimage.fun/illustrations/image-orbit-hero.webp</image:loc><image:title>Image compression portal illustration</image:title><image:caption>Colorful image cards become smaller while passing through a compression portal.</image:caption></image:image></url></urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
