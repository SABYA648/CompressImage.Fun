import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSafeSvg } from './security.js';

const directories: string[] = [];
afterEach(async () =>
  Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  ),
);

describe('SVG boundary', () => {
  it('accepts inert geometry and rejects scripts or external references', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'compress-svg-'));
    directories.push(directory);
    const safe = join(directory, 'safe.svg');
    const script = join(directory, 'script.svg');
    const remote = join(directory, 'remote.svg');
    await writeFile(
      safe,
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
    );
    await writeFile(
      script,
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    await writeFile(
      remote,
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/a.png"/></svg>',
    );
    await expect(assertSafeSvg(safe)).resolves.toBeUndefined();
    await expect(assertSafeSvg(script)).rejects.toMatchObject({ code: 'UNSAFE_SVG' });
    await expect(assertSafeSvg(remote)).rejects.toMatchObject({ code: 'UNSAFE_SVG' });
  });
});
