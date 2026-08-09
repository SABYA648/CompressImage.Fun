import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://compressimage.fun',
  output: 'static',
  trailingSlash: 'never',
  integrations: [preact()],
  build: { format: 'file' },
  vite: { build: { cssCodeSplit: true } },
});
