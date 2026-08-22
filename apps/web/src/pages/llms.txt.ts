import { tools, toolPath } from '../data/tools';
import { guides } from '../data/guides';

export const prerender = true;

export function GET() {
  const selectedTools = tools.filter(
    (tool) =>
      tool.popular ||
      [
        'compress-image-to-size',
        'compress-50kb',
        'compress-100kb',
        'compress-jpeg',
        'compress-png',
        'compress-webp',
        'compress-avif',
        'heic-to-jpg',
        'image-to-pdf',
        'image-to-base64',
        'base64-to-image',
        'image-metadata',
        'remove-image-metadata',
        'passport-photo-resizer',
        'photo-signature-resizer',
      ].includes(tool.id),
  );

  const body = [
    `# compressimage.fun`,
    '',
    '> Compress an image to the size you actually need, with the quality tradeoffs visible.',
    '',
    '## Product Overview',
    'compressimage.fun is a free, fast, privacy-respecting image utility suite. No account signup, no watermarks, and no artificial daily limits.',
    '',
    '## Processing and Privacy Boundaries',
    '- Server-processed tools: Compression, exact-size targeting, format conversion, resizing, cropping, rotation, metadata stripping, and favicon generation upload files to a same-origin Fastify service powered by Sharp/libvips. Files are isolated under random directory IDs with 256-bit bearer tokens and are automatically deleted within 4 hours (or immediately with Delete now).',
    '- Browser-only tools: Image to Base64, Base64 to Image, Base64 Viewer, Image to Data URI, Image to PDF, and Color Picker process 100% locally in browser memory with zero network uploads.',
    '',
    '## Core Capabilities',
    '1. Exact-size compression: Bounded binary search over quality levels and controlled resolution scaling to hit exact KB/MB targets.',
    '2. Multi-format support: Native encoding for JPEG, PNG, WebP, AVIF, and decoding for HEIC, TIFF, GIF, and SVG.',
    '3. Batch processing: Compress and convert up to 50 files simultaneously with one-click ZIP download.',
    '4. Form photo preparation: Custom pixel, DPI, background, and byte limits without false government compliance claims.',
    '',
    '## Main Tools',
    ...selectedTools.map((tool) => `- [${tool.h1}](https://compressimage.fun${toolPath(tool)}): ${tool.description}`),
    '',
    '## Educational Guides',
    ...guides.map((guide) => `- [${guide.title}](https://compressimage.fun/guides/${guide.slug}): ${guide.summary}`),
    '',
    '## Transparency, Methodology & Policies',
    '- [About Us](https://compressimage.fun/about)',
    '- [Compression Methodology](https://compressimage.fun/methodology/compression)',
    '- [Privacy Policy](https://compressimage.fun/privacy)',
    '- [Complete Tool Directory](https://compressimage.fun/tools)',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
