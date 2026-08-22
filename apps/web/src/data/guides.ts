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
  {
    slug: 'how-to-reduce-jpg-file-size',
    title: 'How to reduce JPG file size without a blurry result',
    description:
      'Shrink a JPG by choosing the right dimensions, progressive encoding, and measured quality instead of guessing.',
    readMinutes: 7,
    summary:
      'Resize oversized camera photos first, then lower JPEG quality gradually while checking faces, fine texture, text, and gradients at the final display size.',
    sections: [
      {
        heading: 'Remove pixels the destination cannot show',
        paragraphs: [
          'A phone photo may be more than 4000 pixels wide while an email, profile, or article displays it near 1200 pixels. Downscaling that unused grid usually saves more bytes cleanly than forcing the JPEG quality to an extreme value.',
        ],
      },
      {
        heading: 'Treat quality as a visual control',
        paragraphs: [
          'JPEG quality is not a percentage of detail kept and does not predict a file size. Start in the useful upper-middle range, encode once, and inspect high-contrast edges, skin texture, foliage, and small lettering before moving lower.',
        ],
      },
      {
        heading: 'Use an exact cap only when one exists',
        paragraphs: [
          'If a form requires a maximum KB value, use Exact Size so the encoder can search and verify the output. For ordinary sharing, Smart mode avoids spending extra encodes on a byte target nobody asked for.',
        ],
      },
    ],
    relatedTools: ['compress-jpeg', 'image-compressor', 'resize-image', 'compress-image-to-size'],
  },
  {
    slug: 'how-to-compress-png-with-transparency',
    title: 'How to compress a PNG without losing transparency',
    description:
      'Reduce transparent PNG files with lossless optimization, sensible palettes, and the right modern alternatives.',
    readMinutes: 7,
    summary:
      'Keep alpha in PNG, WebP, or AVIF. Start lossless, then consider a smaller color palette or transparent WebP when the destination supports it.',
    sections: [
      {
        heading: 'Why transparent PNG files can be large',
        paragraphs: [
          'PNG stores decoded pixels exactly. Soft shadows, noise, gradients, and partially transparent edges create more distinct data than a flat icon, so two images with the same dimensions can compress very differently.',
        ],
      },
      {
        heading: 'Start with reversible savings',
        paragraphs: [
          'Lossless optimization can improve filtering and entropy coding without changing a pixel. Metadata removal may help too. If that is not enough, palette reduction works well for artwork with a limited set of colors but should be inspected around gradients.',
        ],
      },
      {
        heading: 'Never flatten alpha by accident',
        paragraphs: [
          'JPEG has no alpha channel. Converting a transparent PNG to JPG requires a background color. Use WebP or AVIF when you need modern lossy compression and transparency together, and keep PNG when exact decoded pixels matter.',
        ],
      },
    ],
    relatedTools: ['compress-png', 'png-to-webp', 'webp-to-png', 'convert-image'],
  },
  {
    slug: 'how-to-compress-images-for-email',
    title: 'How to compress photos for email attachments',
    description:
      'Make email photos faster to send while keeping a readable, useful result for the recipient.',
    readMinutes: 6,
    summary:
      'For ordinary viewing, resize large phone photos to a practical display width and use JPEG or WebP quality compression. Keep originals when the recipient needs printing or editing.',
    sections: [
      {
        heading: 'Decide what the recipient needs',
        paragraphs: [
          'A quick reference photo, a document scan, and a print-ready photograph are different jobs. Compress a copy for convenient delivery and keep the full-resolution original when cropping, printing, or archival detail matters.',
        ],
      },
      {
        heading: 'Resize before extreme compression',
        paragraphs: [
          'Email clients usually display images far below modern camera resolution. A moderate width reduction often preserves a cleaner result than keeping every pixel and pushing JPEG quality very low.',
        ],
      },
      {
        heading: 'Batch the whole message',
        paragraphs: [
          'Apply one setting to a group, compare the total bytes, and download a ZIP when you need to attach several results elsewhere. Do not convert screenshots or transparent graphics to JPEG without checking their edges and background.',
        ],
      },
    ],
    relatedTools: ['image-compressor', 'batch-compress-images', 'compress-jpeg', 'resize-image'],
  },
  {
    slug: 'how-to-batch-compress-multiple-images',
    title: 'How to batch compress multiple images at once',
    description:
      'Choose one safe compression policy for a mixed folder, review each result, and download everything together.',
    readMinutes: 6,
    summary:
      'Group images with the same destination, preserve their formats by default, and inspect outliers instead of assuming one quality value affects every file equally.',
    sections: [
      {
        heading: 'Batch by destination, not just folder',
        paragraphs: [
          'Website thumbnails, email photos, and archival originals need different treatment. A useful batch contains files headed to the same place so one resize, format, and quality policy makes sense.',
        ],
      },
      {
        heading: 'Expect different savings',
        paragraphs: [
          'A flat graphic, a noisy photograph, and an already optimized WebP will not shrink by the same percentage. Review the result list for files that saved little or crossed a format boundary.',
        ],
      },
      {
        heading: 'Keep the originals until review is complete',
        paragraphs: [
          'Download the result ZIP to a new folder, spot-check important images, and only then replace workflow copies. The tool never needs to overwrite the files on your device.',
        ],
      },
    ],
    relatedTools: ['batch-compress-images', 'image-compressor', 'convert-image', 'resize-image'],
  },
  {
    slug: 'why-is-my-image-file-still-too-large',
    title: 'Why is my image file still too large?',
    description:
      'Troubleshoot stubborn image files by checking dimensions, noise, transparency, format, metadata, and animation.',
    readMinutes: 8,
    summary:
      'Large dimensions, photographic noise, alpha, many animation frames, and a mismatched codec can resist ordinary quality changes. Identify the cause before compressing harder.',
    sections: [
      {
        heading: 'Count pixels and frames first',
        paragraphs: [
          'Width multiplied by height gives the pixels in one frame. Animation multiplies that workload across frames. A modest-looking file can still contain a very large decoded image that needs careful resizing.',
        ],
      },
      {
        heading: 'Match content to a codec',
        paragraphs: [
          'Detailed photos usually fit JPEG, WebP, or AVIF. Sharp text and flat graphics often suit PNG or lossless WebP. Saving a camera photo as PNG can turn a reasonable JPEG into a much larger file.',
        ],
      },
      {
        heading: 'Know when the target is unrealistic',
        paragraphs: [
          'A detailed transparent image cannot always reach a tiny KB cap at useful dimensions. Try a modern alpha-capable format, crop unused space, or relax the target rather than accepting a visibly broken result.',
        ],
      },
    ],
    relatedTools: ['compress-image-to-size', 'image-metadata', 'resize-image', 'convert-image'],
  },
  {
    slug: 'how-to-resize-an-image-without-stretching',
    title: 'How to resize an image without stretching it',
    description:
      'Use aspect ratio, fit, fill, contain, and crop controls to reach new dimensions without distortion.',
    readMinutes: 7,
    summary:
      'Lock the source aspect ratio for proportional resizing. Use crop when the destination ratio differs, or contain when every source pixel must remain visible.',
    sections: [
      {
        heading: 'Protect the aspect ratio',
        paragraphs: [
          'Aspect ratio is width divided by height. Changing only one dimension while calculating the other keeps circles round and faces natural. Stretching to two unrelated dimensions changes the shape of every object.',
        ],
      },
      {
        heading: 'Choose between cover and contain',
        paragraphs: [
          'Cover fills the destination and crops overflow. Contain keeps the complete image and adds empty background when the ratios differ. Fit inside resizes to stay within both limits without enlarging unnecessarily.',
        ],
      },
      {
        heading: 'Check the final crop at full size',
        paragraphs: [
          'Automatic center crops can cut off a face, signature, or label near an edge. Preview the result and use explicit crop coordinates when composition matters.',
        ],
      },
    ],
    relatedTools: [
      'resize-image',
      'crop-image',
      'passport-photo-resizer',
      'photo-signature-resizer',
    ],
  },
  {
    slug: 'how-to-resize-a-signature-for-an-online-form',
    title: 'How to resize a signature for an online form',
    description:
      'Prepare a scanned signature to custom pixels and KB while keeping strokes clear and margins controlled.',
    readMinutes: 7,
    summary:
      'Read the form requirements, trim unnecessary white border, preserve the signature aspect ratio, and use PNG or a high-quality JPG before applying the byte cap.',
    sections: [
      {
        heading: 'Start with a clean capture',
        paragraphs: [
          'Use even light, strong contrast, and enough resolution to preserve thin strokes. Avoid shadows from the phone and check that the complete signature sits inside the image.',
        ],
      },
      {
        heading: 'Trim, fit, and choose a background',
        paragraphs: [
          'Trimming border-like whitespace gives the strokes more room in a small output. Contain preserves the signature shape. PNG can keep transparency; JPEG needs a solid background, usually matching the form.',
        ],
      },
      {
        heading: 'Verify pixels and bytes separately',
        paragraphs: [
          'A signature can have the correct width and height but still exceed the KB cap. Confirm both values in the result card and open the downloaded copy to check that thin lines remain continuous.',
        ],
      },
    ],
    relatedTools: [
      'photo-signature-resizer',
      'resize-image',
      'compress-image-to-size',
      'compress-png',
    ],
  },
  {
    slug: 'how-to-convert-png-to-jpg',
    title: 'How to convert PNG to JPG without a surprise background',
    description:
      'Convert PNG graphics or photos to JPEG while handling transparency, sharp edges, and quality deliberately.',
    readMinutes: 6,
    summary:
      'Choose a background before converting transparent pixels because JPEG has no alpha. Inspect text and line art, which may be better left as PNG or changed to WebP.',
    sections: [
      {
        heading: 'Transparency must become a color',
        paragraphs: [
          'A transparent PNG does not contain a visible checkerboard. That pattern belongs to the editor. JPEG needs a real color behind every pixel, so choose white or another destination-appropriate background.',
        ],
      },
      {
        heading: 'Know which PNGs benefit',
        paragraphs: [
          'Photographic PNG files can become much smaller as JPEG. Logos, screenshots, and diagrams may develop ringing around edges, so compare them carefully or choose lossless WebP instead.',
        ],
      },
      {
        heading: 'Keep one clean source',
        paragraphs: [
          'JPEG re-encoding is lossy. Keep the original PNG for later editing and make a JPEG copy for the app or form that requires it.',
        ],
      },
    ],
    relatedTools: ['png-to-jpg', 'convert-image', 'compress-jpeg', 'png-to-webp'],
  },
  {
    slug: 'how-to-convert-jpg-to-webp-for-the-web',
    title: 'How to convert JPG to WebP for a website',
    description:
      'Create practical WebP assets, keep fallbacks where needed, and avoid serving oversized source dimensions.',
    readMinutes: 7,
    summary:
      'Resize to the rendered dimensions, convert at a measured quality, keep width and height attributes in HTML, and test the real page rather than judging bytes alone.',
    sections: [
      {
        heading: 'Resize before format conversion',
        paragraphs: [
          'A modern codec cannot fix an image that ships four times more pixels than the layout needs. Produce responsive dimensions first, then compare the WebP result with the original JPEG at the displayed size.',
        ],
      },
      {
        heading: 'Use the right HTML delivery',
        paragraphs: [
          'A picture element can offer modern and fallback sources. Explicit width and height reserve layout space, while srcset helps the browser choose a suitable pixel width for the screen.',
        ],
      },
      {
        heading: 'Measure the whole experience',
        paragraphs: [
          'File bytes matter, but so do cache headers, loading priority, lazy loading below the fold, and server response time. Check the deployed page with field data and a lab audit.',
        ],
      },
    ],
    relatedTools: ['jpg-to-webp', 'compress-webp', 'resize-image', 'image-compressor'],
  },
  {
    slug: 'how-to-open-and-convert-a-webp-image',
    title: 'How to open and convert a WebP image',
    description:
      'Choose JPG or PNG output based on transparency, editing needs, and the software receiving the file.',
    readMinutes: 6,
    summary:
      'Convert opaque photographs to JPG for broad compatibility. Convert transparent graphics to PNG when the receiving editor needs alpha or exact decoded pixels.',
    sections: [
      {
        heading: 'WebP may already be the useful source',
        paragraphs: [
          'Modern browsers and many editors understand WebP. Convert only when a specific app rejects it or a workflow needs a different container.',
        ],
      },
      {
        heading: 'Pick JPG or PNG by content',
        paragraphs: [
          'JPG is compact for opaque photos but cannot store transparency. PNG keeps alpha and exact decoded pixels, though a photographic result can be much larger.',
        ],
      },
      {
        heading: 'Animation needs special care',
        paragraphs: [
          'WebP can be animated. A static conversion must not silently keep only one frame. This tool rejects unsupported animation instead of presenting a flattened result as complete.',
        ],
      },
    ],
    relatedTools: ['webp-to-jpg', 'webp-to-png', 'convert-image', 'compress-webp'],
  },
  {
    slug: 'how-to-convert-svg-to-png-safely',
    title: 'How to convert SVG to PNG safely',
    description:
      'Rasterize a trusted vector at useful dimensions while understanding scripts, external resources, and scaling.',
    readMinutes: 7,
    summary:
      'Choose the pixel dimensions needed by the destination and rasterize the SVG in a restricted pipeline. Never inject an unknown SVG directly into a page.',
    sections: [
      {
        heading: 'SVG is code-like content',
        paragraphs: [
          'SVG can include scripts, foreign objects, external references, and expensive filters. An upload tool should validate the markup and prevent network fetches before asking a rasterizer to decode it.',
        ],
      },
      {
        heading: 'Decide the output grid',
        paragraphs: [
          'Vector artwork has no single natural pixel resolution. Select the width and height required by the destination, and use a larger export only when high-density display or later downscaling needs it.',
        ],
      },
      {
        heading: 'Keep the vector original',
        paragraphs: [
          'PNG is easier to place in many apps but loses infinite scaling and editability. Keep the trusted SVG source and create PNG copies for destinations that require raster images.',
        ],
      },
    ],
    relatedTools: ['svg-to-png', 'resize-image', 'compress-png', 'favicon-generator'],
  },
  {
    slug: 'how-to-turn-images-into-one-pdf',
    title: 'How to turn multiple images into one PDF',
    description:
      'Order scans or photos, choose the page size and margins, and build one downloadable PDF in the browser.',
    readMinutes: 6,
    summary:
      'Put pages in reading order, choose image-sized pages when exact pixels matter or a standard paper size for printing, then inspect the downloaded PDF.',
    sections: [
      {
        heading: 'Prepare the pages first',
        paragraphs: [
          'Rotate sideways captures, crop distracting borders, and keep enough resolution for small text. Compressing too early can make scans hard to read after they are fitted to a page.',
        ],
      },
      {
        heading: 'Choose paper and fit',
        paragraphs: [
          'A4 and Letter suit printing and sharing. Image-sized pages preserve each source aspect ratio. Contain keeps every pixel; cover fills the page but can crop the edges.',
        ],
      },
      {
        heading: 'Privacy and final checks',
        paragraphs: [
          'The PDF builder assembles ordinary JPG, PNG, and WebP files in the browser. Open the result and verify order, rotation, margins, and legibility before sending it.',
        ],
      },
    ],
    relatedTools: ['image-to-pdf', 'rotate-image', 'crop-image', 'compress-image-to-size'],
  },
  {
    slug: 'how-to-add-a-text-watermark-to-a-photo',
    title: 'How to add a text watermark to a photo',
    description:
      'Place a readable mark with sensible scale, opacity, padding, and contrast without damaging the source.',
    readMinutes: 6,
    summary:
      'Work on a copy, choose a corner that does not cover the subject, keep the watermark readable at final display size, and remember that a visible mark is not access control.',
    sections: [
      {
        heading: 'Choose purpose before placement',
        paragraphs: [
          'A credit line, draft label, and deterrent mark need different prominence. A small corner credit protects composition, while a proof mark may need stronger central placement.',
        ],
      },
      {
        heading: 'Balance contrast and opacity',
        paragraphs: [
          'A watermark that disappears over half the image is not useful. Test it over the actual background and at the size where people will view the result, not only while zoomed in.',
        ],
      },
      {
        heading: 'Keep the unmarked original',
        paragraphs: [
          'Watermarking changes visible pixels. Save the result as a new file and keep the original for future crops, prints, and alternate placements.',
        ],
      },
    ],
    relatedTools: ['watermark-image', 'resize-image', 'image-compressor', 'image-metadata'],
  },
  {
    slug: 'how-to-make-a-favicon-from-an-image',
    title: 'How to make a favicon from an image',
    description:
      'Prepare a simple square source and generate ICO, PNG, Apple touch icon, and HTML link files.',
    readMinutes: 7,
    summary:
      'Use a bold square design with generous edges, test it at 16 and 32 pixels, and include both modern PNG links and a multi-size favicon.ico.',
    sections: [
      {
        heading: 'Simplify before shrinking',
        paragraphs: [
          'Fine text and thin lines disappear at favicon scale. A strong silhouette, limited colors, and breathing room around the edges survive better across browser tabs and bookmarks.',
        ],
      },
      {
        heading: 'Generate more than one size',
        paragraphs: [
          'A multi-layer ICO covers traditional browser requests. PNG files serve crisp modern sizes, and an Apple touch icon supports home-screen bookmarks. The generated HTML snippet links the common outputs.',
        ],
      },
      {
        heading: 'Test light and dark browser chrome',
        paragraphs: [
          'Transparent icons can disappear against some themes. Check the favicon in actual tabs at small size and consider a controlled background when the mark relies on one light or dark color.',
        ],
      },
    ],
    relatedTools: ['favicon-generator', 'crop-image', 'image-color-picker', 'compress-png'],
  },
  {
    slug: 'how-to-pick-a-color-from-an-image',
    title: 'How to pick an exact color from an image',
    description:
      'Sample pixels, understand HEX, RGB, HSL, and alpha, and build a useful palette in the browser.',
    readMinutes: 6,
    summary:
      'Zoom into the source, sample a representative pixel, and compare nearby values because antialiasing, shadows, compression, and color profiles can shift what you see.',
    sections: [
      {
        heading: 'One object contains many pixel colors',
        paragraphs: [
          'A flat-looking button may include antialiased edges, gradients, shadows, and JPEG artifacts. Sample near the center for a base color and inspect nearby pixels before treating one value as canonical.',
        ],
      },
      {
        heading: 'Choose the notation for the job',
        paragraphs: [
          'HEX and RGB directly describe display channels. HSL can be easier for adjusting hue, saturation, and lightness in a design system. Alpha is separate and controls transparency.',
        ],
      },
      {
        heading: 'Expect color-management differences',
        paragraphs: [
          'Embedded profiles, wide-gamut displays, and browser color management affect rendered appearance. A browser canvas provides practical decoded pixel values, but critical print matching needs a managed workflow.',
        ],
      },
    ],
    relatedTools: ['image-color-picker', 'image-metadata', 'favicon-generator', 'compress-png'],
  },
  {
    slug: 'how-to-check-if-a-photo-has-location-data',
    title: 'How to check if a photo has location data',
    description:
      'Inspect EXIF GPS fields, understand what removal changes, and share a cleaned copy when needed.',
    readMinutes: 6,
    summary:
      'Inspect the exact file you plan to share for GPS latitude and longitude, then remove metadata and verify the downloaded copy. Visible clues still remain in the pixels.',
    sections: [
      {
        heading: 'Location can travel in EXIF',
        paragraphs: [
          'Camera and phone photos may store GPS coordinates with timestamps, camera settings, and orientation. Apps can preserve, rewrite, or remove those fields, so assumptions about the original are not enough.',
        ],
      },
      {
        heading: 'Inspect, remove, inspect again',
        paragraphs: [
          'Use a metadata viewer on the outbound file, create a clean copy, and recheck that copy when the privacy consequence matters. Keep the untouched original privately if location is useful to your archive.',
        ],
      },
      {
        heading: 'Pixels can reveal a place too',
        paragraphs: [
          'Street signs, reflections, landmarks, documents, and house numbers remain visible after EXIF removal. Metadata cleaning addresses hidden fields, not the content of the photograph.',
        ],
      },
    ],
    relatedTools: ['image-metadata', 'remove-image-metadata', 'image-compressor', 'convert-image'],
  },
  {
    slug: 'how-to-embed-a-base64-image-in-html-and-css',
    title: 'How to embed a Base64 image in HTML or CSS',
    description:
      'Create a Data URI, place it in HTML or CSS, and know when a normal image URL is the better choice.',
    readMinutes: 7,
    summary:
      'A Data URI combines the MIME type and Base64 payload in one string. It can help with tiny self-contained assets, but large images inflate source and lose independent caching.',
    sections: [
      {
        heading: 'Build the correct wrapper',
        paragraphs: [
          'HTML img elements and CSS url values both accept a Data URI. The MIME type must match the decoded bytes, and the Base64 flag tells the browser how the payload is represented.',
        ],
      },
      {
        heading: 'Keep accessibility in HTML',
        paragraphs: [
          'Embedding changes the source location, not the meaning of the image. Informative HTML images still need useful alt text, while decorative images should be marked so assistive technology can skip them.',
        ],
      },
      {
        heading: 'Use normal files for substantial images',
        paragraphs: [
          'Base64 adds representation overhead and the embedded bytes cannot be cached separately from the document or stylesheet. Product photos, article images, and responsive assets usually belong at ordinary URLs.',
        ],
      },
    ],
    relatedTools: [
      'image-to-data-uri',
      'image-to-base64',
      'base64-image-viewer',
      'compress-image-to-size',
    ],
  },
  {
    slug: 'how-to-decode-base64-to-an-image',
    title: 'How to decode Base64 to an image safely',
    description:
      'Normalize a Base64 value, detect the real image type from bytes, preview it safely, and download the result.',
    readMinutes: 7,
    summary:
      'Remove obvious wrappers and whitespace, decode with a size limit, and check magic bytes instead of trusting a filename or Data URI label.',
    sections: [
      {
        heading: 'Identify the payload',
        paragraphs: [
          'A value may be raw Base64, a Data URI, or a quoted JSON string. Extract only the obvious wrapper and reject malformed alphabet or padding rather than guessing at arbitrary text.',
        ],
      },
      {
        heading: 'Trust decoded bytes over labels',
        paragraphs: [
          'A Data URI can claim one MIME type while containing another. JPEG, PNG, GIF, WebP, and other formats carry recognizable signatures that provide a stronger type check.',
        ],
      },
      {
        heading: 'Treat decoded SVG as active content',
        paragraphs: [
          'SVG can contain script-like features and external references. Do not inject unknown decoded markup with innerHTML. A safe viewer can reject it or keep it isolated as non-executing text.',
        ],
      },
    ],
    relatedTools: [
      'base64-to-image',
      'base64-image-viewer',
      'image-to-base64',
      'image-to-data-uri',
    ],
  },
  {
    slug: 'image-optimization-for-core-web-vitals',
    title: 'Image optimization for Core Web Vitals',
    description:
      'Improve image loading with responsive dimensions, stable layout space, compression, priority, and measured page testing.',
    readMinutes: 9,
    summary:
      'Serve the right pixels in an efficient format, reserve width and height to prevent shifts, prioritize the likely LCP image, and lazy-load only images below the first view.',
    sections: [
      {
        heading: 'Start with the rendered dimensions',
        paragraphs: [
          'A compressed 4000-pixel image is still wasteful in a 700-pixel slot. Generate responsive candidates and let the browser select one using srcset and sizes. Keep a practical fallback for the audience you support.',
        ],
      },
      {
        heading: 'Protect layout and loading priority',
        paragraphs: [
          'Width and height attributes reserve aspect-ratio space before bytes arrive. The likely hero or LCP image should be discoverable in initial HTML and must not be lazy-loaded, while images farther down the page can wait.',
        ],
      },
      {
        heading: 'Measure the page, not just the file',
        paragraphs: [
          'Lab tools expose opportunities, while field data shows real devices and networks. Review LCP, interaction responsiveness, layout shifts, caching, server latency, and visual quality together.',
        ],
      },
    ],
    relatedTools: ['image-compressor', 'resize-image', 'jpg-to-webp', 'compress-avif'],
  },
  {
    slug: 'how-to-rotate-and-crop-a-phone-photo',
    title: 'How to rotate and crop a phone photo cleanly',
    description:
      'Normalize camera orientation, choose a useful crop ratio, and export without needless repeated encoding.',
    readMinutes: 6,
    summary:
      'Rotate first so coordinates match what you see, crop once around the subject, then resize or compress the final composition instead of re-encoding at every step.',
    sections: [
      {
        heading: 'Orientation can be metadata',
        paragraphs: [
          'Some phone files store sensor pixels one way and an orientation instruction separately. A processing tool should normalize that orientation before applying your selected rotation or crop coordinates.',
        ],
      },
      {
        heading: 'Choose ratio by destination',
        paragraphs: [
          'Use freeform when the composition decides the shape. Use 1:1, 4:3, 3:2, or 16:9 when a destination has a known slot. Keep important faces, labels, and edges inside the crop.',
        ],
      },
      {
        heading: 'Encode after the geometry is final',
        paragraphs: [
          'Preview crop movement locally, then send the final rectangle for one high-quality render. Apply file-size compression after the dimensions and composition are settled.',
        ],
      },
    ],
    relatedTools: ['rotate-image', 'crop-image', 'resize-image', 'image-compressor'],
  },
];

const clusterStories: Record<string, string[]> = {
  compress: [
    'how-to-compress-images-without-losing-quality',
    'how-to-compress-image-to-exact-file-size',
    'how-to-reduce-jpg-file-size',
    'how-to-compress-images-for-email',
    'why-is-my-image-file-still-too-large',
    'how-to-batch-compress-multiple-images',
  ],
  resize: [
    'how-to-resize-an-image-without-stretching',
    'image-size-vs-dimensions',
    'how-to-resize-a-passport-or-form-photo',
    'how-to-resize-a-signature-for-an-online-form',
    'how-to-rotate-and-crop-a-phone-photo',
    'how-to-compress-image-to-exact-file-size',
  ],
  convert: [
    'jpeg-vs-png-vs-webp-vs-avif',
    'best-image-format-for-web',
    'how-to-convert-png-to-jpg',
    'how-to-convert-jpg-to-webp-for-the-web',
    'how-to-open-and-convert-a-webp-image',
    'heic-explained-and-when-to-convert',
    'how-to-convert-svg-to-png-safely',
  ],
  developer: [
    'base64-images-explained',
    'how-to-embed-a-base64-image-in-html-and-css',
    'how-to-decode-base64-to-an-image',
    'best-image-format-for-web',
    'image-optimization-for-core-web-vitals',
    'image-size-vs-dimensions',
  ],
  privacy: [
    'how-to-remove-exif-metadata',
    'how-to-check-if-a-photo-has-location-data',
    'image-size-vs-dimensions',
    'how-to-compress-images-without-losing-quality',
    'how-to-rotate-and-crop-a-phone-photo',
    'best-image-format-for-web',
  ],
  create: [
    'how-to-make-a-favicon-from-an-image',
    'how-to-add-a-text-watermark-to-a-photo',
    'how-to-pick-a-color-from-an-image',
    'how-to-convert-svg-to-png-safely',
    'how-to-resize-an-image-without-stretching',
    'how-to-compress-png-with-transparency',
  ],
};

export const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));

export const guidesForTool = (
  tool: { id: string; kind: string; category: string },
  limit = 5,
): Guide[] => {
  const cluster =
    tool.kind === 'compress'
      ? 'compress'
      : ['resize', 'crop', 'rotate', 'prepare'].includes(tool.kind)
        ? 'resize'
        : ['convert', 'image-pdf'].includes(tool.kind)
          ? 'convert'
          : ['base64-encode', 'base64-decode', 'base64-viewer'].includes(tool.kind)
            ? 'developer'
            : ['metadata', 'color-picker'].includes(tool.kind)
              ? tool.kind === 'metadata'
                ? 'privacy'
                : 'create'
              : 'create';
  const selected = [
    ...guides.filter((guide) => guide.relatedTools.includes(tool.id)),
    ...(clusterStories[cluster] ?? []).map((slug) => guideBySlug.get(slug)),
    ...guides,
  ].filter((guide): guide is Guide => Boolean(guide));
  return [...new Map(selected.map((guide) => [guide.slug, guide])).values()].slice(0, limit);
};
