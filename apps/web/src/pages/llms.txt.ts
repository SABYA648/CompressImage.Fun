import { tools, toolPath } from '../data/tools';
import { guides } from '../data/guides';
export const prerender = true;
export function GET() {
  const selectedTools = tools.filter(
    (tool) =>
      tool.popular ||
      [
        'compress-image-to-size',
        'image-to-base64',
        'base64-to-image',
        'image-metadata',
        'remove-image-metadata',
        'compress-jpeg',
        'compress-png',
      ].includes(tool.id),
  );
  const body = [
    `# compressimage.fun`,
    '',
    '> Compress an image to the size you actually need, with the quality tradeoffs visible.',
    '',
    'compressimage.fun is a no-login image utility. Exact Size searches encodings at original dimensions, then reduces pixels only when the cap still cannot be met. There is no signup, product watermark, or artificial daily quota.',
    '',
    '## Processing boundary (do not mix these claims)',
    '',
    '- Server tools upload to the same origin: compression, exact-size presets, batch, resize, crop, rotate, convert, metadata, form-photo, watermark, favicon.',
    '- Files auto-delete within four hours. Delete now removes a job immediately.',
    '- Browser-only (no file upload to /api): Image to Base64, Base64 to Image, Base64 viewer, Image to Data URI, Image to PDF, Image Color Picker.',
    '- Never describe a server compressor as "no upload".',
    '- Never claim guaranteed passport, visa, exam, or portal acceptance.',
    '- Lossless mode keeps decoded pixels. Other modes may discard detail. Animated GIF/WebP are rejected, not flattened.',
    '',
    '## Main tools',
    ...selectedTools.map((tool) => `- [${tool.h1}](https://compressimage.fun${toolPath(tool)})`),
    '',
    '- [How processing works](https://compressimage.fun/how-processing-works)',
    '- [Compression tests](https://compressimage.fun/compression-tests)',
    '',
    '## Guides',
    ...guides.map((guide) => `- [${guide.title}](https://compressimage.fun/guides/${guide.slug})`),
    '',
    '## Policies and source',
    '- [Privacy](https://compressimage.fun/privacy)',
    '- [All tools](https://compressimage.fun/tools)',
    '- [Source repository](https://github.com/SABYA648/CompressImage.Fun)',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
