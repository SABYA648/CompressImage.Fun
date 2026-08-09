export interface Guide {
  slug: string;
  title: string;
  description: string;
  summary: string;
  readMinutes: number;
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  relatedTools: string[];
}

export const guides: Guide[] = [
  {
    slug: 'how-to-compress-images-without-losing-quality',
    title: 'How to compress images without losing visible quality',
    description:
      'A practical method for reducing image bytes while protecting detail, text, transparency, and color.',
    readMinutes: 7,
    summary:
      'Start with the right format, remove invisible metadata, and lower quality in small measured steps. Resize only when the displayed dimensions are smaller than the source.',
    sections: [
      {
        heading: 'Begin with the use case',
        paragraphs: [
          'A 4000-pixel camera photo shown at 900 pixels is carrying detail the page cannot display. A small logo stored as JPEG is using the wrong compression model. The correct first move depends on the pixels, not a universal quality number.',
        ],
      },
      {
        heading: 'Choose the format before chasing settings',
        paragraphs: [
          'JPEG suits opaque photographs. PNG suits sharp graphics and transparency. WebP covers both with broad browser support. AVIF can be smaller but costs more CPU to encode.',
        ],
        bullets: [
          'Keep transparency in PNG, WebP, or AVIF.',
          'Do not convert a crisp text screenshot to low-quality JPEG.',
          'Use a compatible fallback when your destination cannot read modern formats.',
        ],
      },
      {
        heading: 'Measure the result',
        paragraphs: [
          'Compare at the size people will actually see. Look at faces, hair, small type, gradients, and hard color edges. A byte saving is not useful when it damages the important part of the image.',
        ],
        bullets: [
          'Use Smart mode as a strong starting point.',
          'Use Quality mode when you want direct codec control.',
          'Use Exact Size only when a hard upload cap is the real requirement.',
        ],
      },
    ],
    relatedTools: ['image-compressor', 'compress-image-to-size', 'convert-image'],
  },
  {
    slug: 'how-to-compress-image-to-exact-file-size',
    title: 'How to compress an image to an exact file-size limit',
    description:
      'Why exact KB compression needs quality search, validation, and sometimes careful dimension reduction.',
    readMinutes: 8,
    summary:
      'An exact-size tool should search encoded outputs and verify the final bytes. A JPEG quality value is not a file-size target.',
    sections: [
      {
        heading: 'Why quality 70 does not mean 70 KB',
        paragraphs: [
          'Codec quality controls influence detail retention, but file size also depends on dimensions, noise, texture, alpha, metadata, and format. Two photos at the same dimensions and quality can have very different byte counts.',
        ],
      },
      {
        heading: 'The bounded search used here',
        paragraphs: [
          'The optimizer begins at the original dimensions and encodes candidate quality levels. A bounded binary search keeps the highest candidate under the cap. If even the minimum useful quality is too large, it tries a controlled sequence of smaller dimensions and repeats.',
        ],
        bullets: [
          'Preserve dimensions first.',
          'Keep the highest viable quality at those dimensions.',
          'Reduce pixels only when the current grid cannot meet the cap.',
          'Decode and check the final output before reporting success.',
        ],
      },
      {
        heading: 'Impossible and already-small cases',
        paragraphs: [
          'A detailed transparent PNG may not fit under 5 KB without becoming tiny or changing format. The tool should say so instead of silently wrecking it. If the source is already under the limit, the best compression is often no compression at all.',
        ],
      },
    ],
    relatedTools: ['compress-image-to-size', 'compress-50kb', 'resize-image'],
  },
  {
    slug: 'jpeg-vs-png-vs-webp-vs-avif',
    title: 'JPEG vs PNG vs WebP vs AVIF',
    description:
      'A clear format comparison covering photos, transparency, compatibility, file size, and encode cost.',
    readMinutes: 8,
    summary:
      'Use JPEG for dependable photo compatibility, PNG for exact pixels and transparency, WebP for a practical modern default, and AVIF when smaller delivery can justify slower encoding.',
    sections: [
      {
        heading: 'JPEG',
        paragraphs: [
          'JPEG is efficient for opaque photographs and universally understood. Repeated editing and saving can compound visible loss. It has no alpha channel.',
        ],
      },
      {
        heading: 'PNG',
        paragraphs: [
          'PNG stores pixels losslessly and supports alpha. It excels for logos, interface captures, diagrams, and sharp text. Detailed photographs often produce large PNG files.',
        ],
      },
      {
        heading: 'WebP',
        paragraphs: [
          'WebP supports lossy photos, lossless graphics, alpha, and animation. It is often the easiest modern format to adopt for mixed web content.',
        ],
      },
      {
        heading: 'AVIF',
        paragraphs: [
          'AVIF can deliver excellent photographic compression and alpha. Encoding is significantly more CPU-intensive, so it is better as a deliberate output than an automatic answer to every upload.',
        ],
      },
    ],
    relatedTools: ['convert-image', 'jpg-to-webp', 'compress-avif'],
  },
  {
    slug: 'best-image-format-for-web',
    title: 'The best image format for the web',
    description:
      'Choose image formats by content, compatibility, alpha, animation, and performance rather than fashion.',
    readMinutes: 6,
    summary:
      'There is no single winner. Use a format portfolio: modern delivery for capable browsers, sensible fallbacks, and SVG for trusted vector artwork.',
    sections: [
      {
        heading: 'Match the format to the pixels',
        paragraphs: [
          'Photographs tolerate perceptual compression. Logos and UI captures punish ringing around hard edges. Transparency rules out JPEG unless you intentionally add a background.',
        ],
      },
      {
        heading: 'Delivery is more than file size',
        paragraphs: [
          'A smaller file can still be a poor choice if your audience cannot decode it or if generating it consumes too much server CPU. Responsive dimensions, caching, and lazy loading often matter as much as the codec.',
        ],
      },
      {
        heading: 'A practical default',
        paragraphs: [
          'For a new web project, WebP is a strong general default, JPEG remains a safe photo fallback, PNG remains useful for exact graphics, and AVIF is worth measuring on high-traffic photographic assets.',
        ],
      },
    ],
    relatedTools: ['convert-image', 'compress-webp', 'resize-image'],
  },
  {
    slug: 'how-image-compression-works',
    title: 'How image compression works',
    description:
      'Understand lossless coding, perceptual loss, quality settings, dimensions, and why outputs differ.',
    readMinutes: 9,
    summary:
      'Compression removes representational redundancy. Lossy codecs also remove detail they predict people are less likely to notice.',
    sections: [
      {
        heading: 'Lossless compression',
        paragraphs: [
          'Lossless methods reorganize recurring patterns so the exact decoded pixels can be recovered. PNG filtering and entropy coding are examples. Complex photographic noise is hard to shrink losslessly.',
        ],
      },
      {
        heading: 'Lossy compression',
        paragraphs: [
          'Lossy encoders transform pixels and quantize information. Lower quality generally removes more detail and leaves fewer symbols to store. The useful quality range depends on the image.',
        ],
      },
      {
        heading: 'Dimensions are a powerful control',
        paragraphs: [
          'Cutting width and height in half leaves roughly one quarter of the pixels. For extreme targets, modest resizing can preserve a cleaner-looking result than pushing codec quality to its floor.',
        ],
      },
    ],
    relatedTools: ['image-compressor', 'compress-image-to-size', 'resize-image'],
  },
  {
    slug: 'how-to-remove-exif-metadata',
    title: 'How to remove EXIF and location metadata',
    description: 'Inspect image metadata, understand GPS risk, and make a clean downloadable copy.',
    readMinutes: 5,
    summary:
      'Inspect first if you need to know what is present, then re-encode without metadata. Remember that visible pixels can still reveal private information.',
    sections: [
      {
        heading: 'What EXIF can contain',
        paragraphs: [
          'Camera model, exposure, timestamp, orientation, and GPS coordinates may travel with a photo. Messaging and social apps handle these fields differently, so inspect the file you actually plan to share.',
        ],
      },
      {
        heading: 'What removal does',
        paragraphs: [
          'The metadata remover decodes the visible image and writes a new file without optional metadata blocks. It does not blur faces, signs, reflections, or anything else visible.',
        ],
      },
      {
        heading: 'Check the result',
        paragraphs: [
          'Download the cleaned file and inspect it again when privacy matters. Keep your untouched original somewhere private if camera information is valuable to your archive.',
        ],
      },
    ],
    relatedTools: ['image-metadata', 'remove-image-metadata', 'image-compressor'],
  },
  {
    slug: 'image-size-vs-dimensions',
    title: 'Image file size vs pixel dimensions',
    description:
      'Understand KB, MB, width, height, resolution, and why changing one does not precisely set the other.',
    readMinutes: 6,
    summary:
      'Dimensions count pixels. File size counts stored bytes. Format, quality, metadata, and image complexity connect them, but not with a fixed formula.',
    sections: [
      {
        heading: 'Dimensions',
        paragraphs: [
          'A 1600 by 900 image has 1.44 million pixels. Its displayed size may be smaller or larger depending on CSS, screen density, print settings, or the app showing it.',
        ],
      },
      {
        heading: 'File size',
        paragraphs: [
          'A 1600 by 900 flat graphic can compress very differently from a noisy night photograph. File bytes include compressed pixels, metadata, color profiles, and container overhead.',
        ],
      },
      {
        heading: 'Which tool to choose',
        paragraphs: [
          'Use Resize when a platform requires exact width and height. Use Exact Size when it requires a KB or MB cap. Use both when the destination specifies both constraints.',
        ],
      },
    ],
    relatedTools: ['resize-image', 'compress-image-to-size', 'image-metadata'],
  },
  {
    slug: 'base64-images-explained',
    title: 'Base64 images explained',
    description:
      'Learn what Base64 is, why it adds overhead, when Data URIs help, and when normal image files are better.',
    readMinutes: 7,
    summary:
      'Base64 turns binary bytes into text using a 64-character alphabet. It is useful inside text-only systems, but adds roughly one third before compression.',
    sections: [
      {
        heading: 'Base64 is representation, not compression',
        paragraphs: [
          'The image codec has already compressed the pixels. Base64 then represents every three binary bytes as four text characters, plus optional wrapper text.',
        ],
      },
      {
        heading: 'Useful cases',
        paragraphs: [
          'API payloads, email formats, small prototype assets, database debugging, and copy-paste workflows sometimes require text. A Data URI adds the MIME type so a browser knows how to interpret the value.',
        ],
      },
      {
        heading: 'When to keep a normal file',
        paragraphs: [
          'Large Base64 blobs inflate HTML or JSON, consume memory during decoding, and cannot be cached independently when embedded. Normal URLs are usually better for production page images.',
        ],
      },
    ],
    relatedTools: ['image-to-base64', 'base64-to-image', 'base64-image-viewer'],
  },
  {
    slug: 'heic-explained-and-when-to-convert',
    title: 'HEIC explained and when to convert it',
    description:
      'Understand why iPhones use HEIC, what it saves, and when a JPG copy is the practical choice.',
    readMinutes: 6,
    summary:
      'HEIC can keep high-quality photographs in fewer bytes than older JPEG workflows. Convert when a form, app, or recipient does not support it, not merely because the extension looks unfamiliar.',
    sections: [
      {
        heading: 'Why iPhone photos often use HEIC',
        paragraphs: [
          'HEIC is a container commonly used with HEVC image coding. Apple devices can capture efficient photos, depth-related data, bursts, and metadata in this family while using less storage than many comparable JPEG files.',
        ],
      },
      {
        heading: 'When JPG is the useful result',
        paragraphs: [
          'Some upload forms, older desktop apps, and simple integrations accept JPEG but reject HEIC. A JPG copy trades some encoding efficiency and alpha capabilities for broad compatibility.',
        ],
        bullets: [
          'Keep the original HEIC in your photo library.',
          'Convert a copy for the destination that needs JPEG.',
          'Resize or compress the JPG only when the destination also sets dimensions or a byte cap.',
        ],
      },
      {
        heading: 'Color and metadata',
        paragraphs: [
          'Device HEIC files may carry wide-gamut color and camera metadata. A conversion should normalize orientation and be checked visually. Remove metadata separately when privacy, not compatibility, is the goal.',
        ],
      },
    ],
    relatedTools: ['heic-to-jpg', 'compress-jpeg', 'resize-image', 'image-to-pdf'],
  },
  {
    slug: 'how-to-resize-a-passport-or-form-photo',
    title: 'How to resize a passport or form photo safely',
    description:
      'Prepare a photo to custom pixels, KB, DPI, background, and format without relying on unverified presets.',
    readMinutes: 7,
    summary:
      'Use the current requirements from the authority receiving the file. Enter its pixel dimensions, format, and maximum bytes directly, then verify the downloaded result before submitting.',
    sections: [
      {
        heading: 'Copy requirements from the primary source',
        paragraphs: [
          'Passport, visa, exam, and job-form rules vary and change. A third-party page may be out of date. Check the receiving authority for dimensions, format, file-size range, pose, background, and recency rules.',
        ],
      },
      {
        heading: 'Pixels, DPI, and KB are different',
        paragraphs: [
          'Pixel width and height define the digital grid. KB limits define stored bytes. DPI is metadata that helps physical-size workflows, but many online forms primarily inspect pixels and bytes.',
        ],
      },
      {
        heading: 'Prepare, then verify',
        paragraphs: [
          'Use cover when the photo must fill an exact aspect ratio and contain when no part may be cropped. A tool can prepare dimensions and bytes, but it cannot promise legal compliance or evaluate expression, shadows, head size, or local policy.',
        ],
        bullets: [
          'Open the downloaded file and check the face and background.',
          'Confirm dimensions and bytes in the result card.',
          'Re-read the authority’s instructions before submitting.',
        ],
      },
    ],
    relatedTools: [
      'passport-photo-resizer',
      'photo-signature-resizer',
      'compress-image-to-size',
      'resize-image',
    ],
  },
];
