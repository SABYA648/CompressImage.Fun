const base = process.env.BASE_URL ?? 'http://web:8080';
const sitemap = await fetch(`${base}/sitemap-pages.xml`);
if (!sitemap.ok) throw new Error(`Sitemap returned ${sitemap.status}`);
const xml = await sitemap.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  match[1].replace('https://compressimage.fun', base),
);
const titles = new Set();
const descriptions = new Set();
const failures = [];
const anchors = [
  '/',
  '/about',
  '/methodology/compression',
  '/compress-image-to-size',
  '/resize-image',
  '/convert-image',
  '/heic-to-jpg',
  '/image-to-pdf',
  '/image-to-base64',
  '/image-to-data-uri',
  '/base64-to-image',
  '/base64-image-viewer',
  '/passport-photo-resizer',
  '/photo-signature-resizer',
  '/image-metadata',
  '/remove-image-metadata',
  '/favicon-generator',
  '/image-color-picker',
];
const sitemapPaths = urls.map((url) => new URL(url).pathname);
for (const anchor of anchors)
  if (!sitemapPaths.includes(anchor)) failures.push(`${anchor}: missing from sitemap`);
for (const url of urls) {
  const response = await fetch(url);
  const html = await response.text();
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  const internalLinks = (html.match(/<a [^>]*href="\//g) ?? []).length;
  if (
    response.status !== 200 ||
    !title ||
    !description ||
    h1Count !== 1 ||
    !/<link rel="canonical"/.test(html) ||
    /noindex/i.test(html) ||
    internalLinks < 3
  )
    failures.push(`${url}: incomplete (${response.status}, h1=${h1Count}, links=${internalLinks})`);
  if (title && titles.has(title)) failures.push(`${url}: duplicate title`);
  if (description && descriptions.has(description)) failures.push(`${url}: duplicate description`);
  titles.add(title);
  descriptions.add(description);
  for (const script of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)) {
    try {
      JSON.parse(script[1]);
    } catch {
      failures.push(`${url}: invalid JSON-LD`);
    }
  }
}
for (const path of ['/robots.txt', '/sitemap-index.xml', '/llms.txt']) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) failures.push(`${path}: ${response.status}`);
}
const missing = await fetch(`${base}/definitely-not-a-route`);
if (missing.status !== 404) failures.push(`404 route returned ${missing.status}`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`SEO crawl passed for ${urls.length} canonical URLs.`);
