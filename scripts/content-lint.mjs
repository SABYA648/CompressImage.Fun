import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const failures = [];
const walk = async (directory) =>
  (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map(async (entry) =>
        entry.isDirectory()
          ? walk(resolve(directory, entry.name))
          : [resolve(directory, entry.name)],
      ),
    )
  ).flat();
const sourceFiles = (await walk(resolve('apps/web/src'))).filter((file) =>
  /\.(astro|tsx|ts)$/.test(file),
);
for (const file of sourceFiles) {
  const value = await readFile(file, 'utf8');
  for (const [label, pattern] of [
    ['public em dash', /—/],
    ['placeholder copy', /Lorem ipsum|xxxxxxxx/i],
    ['unfinished copy', /\b(?:TODO|FIXME)\b/],
  ])
    if (pattern.test(value)) failures.push(`${relative('.', file)}: ${label}`);
}
const dist = resolve('apps/web/dist');
try {
  const htmlFiles = (await walk(dist)).filter(
    (file) => file.endsWith('.html') && !file.endsWith('404.html'),
  );
  const titles = new Map();
  const descriptions = new Map();
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    if (!title || !description || !/<h1[\s>]/.test(html) || !/<link rel="canonical"/.test(html))
      failures.push(`${relative(dist, file)}: missing required SEO element`);
    if (title) {
      if (titles.has(title))
        failures.push(`${relative(dist, file)}: duplicate title with ${titles.get(title)}`);
      else titles.set(title, relative(dist, file));
    }
    if (description) {
      if (descriptions.has(description))
        failures.push(
          `${relative(dist, file)}: duplicate description with ${descriptions.get(description)}`,
        );
      else descriptions.set(description, relative(dist, file));
    }
    if (/localhost/.test(html) || /noindex/i.test(html))
      failures.push(`${relative(dist, file)}: production metadata leak`);
  }
} catch {
  failures.push('apps/web/dist is missing; run the build before content lint');
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Content lint passed for ${sourceFiles.length} source files.`);
