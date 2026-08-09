export const prerender = true;

const disallowed = ['Disallow: /api/'];
const allowedAgents = [
  '*',
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-News',
  'Googlebot-Video',
  'Google-Extended',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Applebot',
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'CCBot',
  'facebookexternalhit',
  'Twitterbot',
  'Bytespider',
  'cohere-ai',
  'Amazonbot',
  'ia_archiver',
];

export function GET() {
  const body = [
    '# Public HTML is open to search engines, answer engines, and training crawlers.',
    '# Temporary job API routes stay non-indexable.',
    '',
    ...allowedAgents.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', ...disallowed, '']),
    'Sitemap: https://compressimage.fun/sitemap-index.xml',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
