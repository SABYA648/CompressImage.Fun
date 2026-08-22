import { access, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import sharp from 'sharp';

const run = promisify(execFile);

export async function generateFixtures(root = resolve('artifacts/fixtures')) {
  await mkdir(root, { recursive: true });
  const required = [
    'photograph.jpg',
    'photograph.webp',
    'photograph.avif',
    'photograph.heic',
    'illustration.svg',
    'illustration.png',
    'transparent.png',
    'icon.png',
    'malicious.svg',
    'corrupt.jpg',
  ];
  if (
    await Promise.all(
      required.map((name) =>
        access(resolve(root, name)).then(
          () => true,
          () => false,
        ),
      ),
    ).then((found) => found.every(Boolean))
  ) {
    return root;
  }
  const width = 1400;
  const height = 900;
  const photoPixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      photoPixels[offset] = (x * 5 + y * 3 + ((x * y) % 127)) % 256;
      photoPixels[offset + 1] = (x * 2 + y * 7) % 256;
      photoPixels[offset + 2] = (x + y * 11) % 256;
    }
  const base = sharp(photoPixels, { raw: { width, height, channels: 3 } });
  await base
    .clone()
    .jpeg({ quality: 94, progressive: true })
    .toFile(resolve(root, 'photograph.jpg'));
  await base.clone().webp({ quality: 88 }).toFile(resolve(root, 'photograph.webp'));
  await base.clone().avif({ quality: 62, effort: 3 }).toFile(resolve(root, 'photograph.avif'));
  const illustration = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#fffdf8"/><circle cx="260" cy="300" r="190" fill="#ff5b35"/><rect x="430" y="110" width="350" height="380" rx="32" fill="#12364b"/><text x="450" y="320" font-family="sans-serif" font-size="68" fill="white">SAFE TEST</text></svg>`,
  );
  await writeFile(resolve(root, 'illustration.svg'), illustration);
  await sharp(illustration).png().toFile(resolve(root, 'illustration.png'));
  await sharp({ create: { width: 520, height: 520, channels: 4, background: '#00000000' } })
    .composite([
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520"><circle cx="260" cy="260" r="220" fill="#ff5b35"/><circle cx="220" cy="220" r="80" fill="#ffffff88"/></svg>',
        ),
      },
    ])
    .png()
    .toFile(resolve(root, 'transparent.png'));
  await sharp({ create: { width: 64, height: 64, channels: 4, background: '#12364b' } })
    .png()
    .toFile(resolve(root, 'icon.png'));
  await writeFile(
    resolve(root, 'malicious.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  );
  await writeFile(resolve(root, 'corrupt.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]));
  try {
    await run('heif-enc', [
      '-q',
      '85',
      '-p',
      'x265:preset=ultrafast',
      '-o',
      resolve(root, 'photograph.heic'),
      resolve(root, 'photograph.jpg'),
    ]);
  } catch {
    /* Optional outside the QA image; Docker E2E installs the encoder. */
  }
  return root;
}

if (process.argv[1]?.endsWith('generate-fixtures.mjs')) await generateFixtures();
