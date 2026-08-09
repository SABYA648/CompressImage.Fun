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
      ].includes(tool.id),
  );
  const body = [
    `# compressimage.fun`,
    '',
    '> Free image compression and utility tools. No signup, no watermark, and no artificial daily quota.',
    '',
    'Server tools process files temporarily on compressimage.fun infrastructure. Files auto-delete within four hours and can be deleted immediately. Base64 tools run entirely in the browser.',
    '',
    '## Main tools',
    ...selectedTools.map((tool) => `- [${tool.h1}](https://compressimage.fun${toolPath(tool)})`),
    '',
    '## Guides',
    ...guides.map((guide) => `- [${guide.title}](https://compressimage.fun/guides/${guide.slug})`),
    '',
    '## Policies',
    '- [Privacy](https://compressimage.fun/privacy)',
    '- [All tools](https://compressimage.fun/tools)',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
