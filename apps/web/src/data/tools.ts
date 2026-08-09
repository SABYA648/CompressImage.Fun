export type ToolKind =
  | 'compress'
  | 'resize'
  | 'crop'
  | 'rotate'
  | 'convert'
  | 'image-pdf'
  | 'base64-encode'
  | 'base64-decode'
  | 'base64-viewer'
  | 'metadata'
  | 'prepare'
  | 'color-picker'
  | 'watermark'
  | 'favicon';

export interface ToolDefinition {
  id: string;
  slug: string;
  category:
    'Compress' | 'Resize & Prepare' | 'Convert' | 'Developer' | 'Inspect & Privacy' | 'Create';
  kind: ToolKind;
  title: string;
  description: string;
  h1: string;
  lead: string;
  operation?: Record<string, unknown>;
  accept?: string;
  multiple?: boolean;
  steps: string[];
  notes: Array<{ title: string; text: string }>;
  related: string[];
  popular?: boolean;
  aliases?: string[];
  primaryIntent?: string;
}

const baseSteps = [
  'Choose images or drop them into the workspace.',
  'Set the result you need.',
  'Process, review, and download.',
];

const compression = (
  input: Partial<ToolDefinition> &
    Pick<ToolDefinition, 'id' | 'slug' | 'title' | 'description' | 'h1' | 'lead'>,
): ToolDefinition => ({
  category: 'Compress',
  kind: 'compress',
  operation: { kind: 'compress', mode: 'smart', format: 'original' },
  multiple: true,
  steps: baseSteps,
  notes: [
    {
      title: 'Quality first',
      text: 'Smart mode keeps the original format and uses a high-quality codec setting. Exact Size searches several encodes instead of guessing.',
    },
    {
      title: 'Private by default',
      text: 'Server-processed files use a private job token and are deleted automatically within four hours.',
    },
  ],
  related: ['compress-image-to-size', 'resize-image', 'convert-image', 'remove-image-metadata'],
  ...input,
});

const exactPages = [
  {
    kb: 20,
    detail:
      '20 KB is an extreme cap for most photos. The optimizer may need fewer pixels to keep the image readable.',
  },
  {
    kb: 50,
    detail:
      '50 KB works for strict upload forms. Faces and fine text benefit from starting with a tightly cropped image.',
  },
  {
    kb: 100,
    detail:
      '100 KB is a practical balance for profile photos, documents, and everyday form uploads.',
  },
  {
    kb: 200,
    detail:
      '200 KB leaves more room for detail while still satisfying many controlled upload workflows.',
  },
  {
    kb: 500,
    detail:
      '500 KB is useful for email and web publishing when you want strong visual quality without a heavy download.',
  },
  {
    kb: 1024,
    label: '1 MB',
    detail:
      'A 1 MB ceiling usually preserves generous detail in large photographs and portfolio images.',
  },
];

const exactTools = exactPages.map(({ kb, label = `${kb} KB`, detail }): ToolDefinition =>
  compression({
    id: `compress-${kb}kb`,
    slug: kb === 1024 ? 'compress-image-to-1mb' : `compress-image-to-${kb}kb`,
    title: `Compress Image to ${label} Free | compressimage.fun`,
    description: `Compress an image to ${label} or less with a measured quality search. No signup, watermark, or guesswork.`,
    h1: `Compress an image to ${label}`,
    lead: `${detail} Enter the cap once and the engine searches for the best result at or below it.`,
    operation: {
      kind: 'compress',
      mode: 'exact',
      format: 'original',
      targetBytes: kb * 1024,
      minQuality: 35,
    },
    notes: [
      {
        title: `What ${label} means`,
        text: `The output will be at or below ${label}, not padded to an exact byte count. If the source is already small enough, it stays unchanged.`,
      },
      { title: 'When pixels change', text: detail },
    ],
    related: ['compress-image-to-size', 'resize-image', 'jpg-to-webp', 'image-metadata'],
  }),
);

const converterPairs: Array<[string, string, string, string, string]> = [
  [
    'jpg-to-png',
    'JPG to PNG Converter',
    'jpeg',
    'png',
    'PNG will not restore detail already removed by JPEG, but it is useful when a PNG workflow is required.',
  ],
  [
    'png-to-jpg',
    'PNG to JPG Converter',
    'png',
    'jpeg',
    'Transparent pixels need a background in JPEG. White is used by default and can be changed.',
  ],
  [
    'jpg-to-webp',
    'JPG to WebP Converter',
    'jpeg',
    'webp',
    'WebP often stores photographic content in fewer bytes while keeping browser compatibility.',
  ],
  [
    'png-to-webp',
    'PNG to WebP Converter',
    'png',
    'webp',
    'WebP can preserve transparency while reducing many photographic or mixed-content PNG files.',
  ],
  [
    'webp-to-jpg',
    'WebP to JPG Converter',
    'webp',
    'jpeg',
    'JPG is useful for older apps and simple photo sharing. Transparent areas receive a background.',
  ],
  [
    'webp-to-png',
    'WebP to PNG Converter',
    'webp',
    'png',
    'PNG keeps transparency and exact decoded pixels, but the resulting file may be larger.',
  ],
  [
    'heic-to-jpg',
    'HEIC to JPG Converter',
    'heic',
    'jpeg',
    'Turn an iPhone HEIC photo into a widely compatible JPG without learning codec settings.',
  ],
  [
    'avif-to-jpg',
    'AVIF to JPG Converter',
    'avif',
    'jpeg',
    'Convert compact AVIF files for apps that still expect JPEG.',
  ],
  [
    'svg-to-png',
    'SVG to PNG Converter',
    'svg',
    'png',
    'Rasterize a safe SVG into a predictable PNG. Active and externally linked SVG content is rejected.',
  ],
];

export const tools: ToolDefinition[] = [
  compression({
    id: 'image-compressor',
    slug: '',
    popular: true,
    title: 'Free Image Compressor | Compress JPG, PNG, WebP & AVIF',
    description:
      'Compress images online with Smart, quality, lossless, batch, and exact-size modes. Free, no signup, no watermark.',
    h1: 'Compress images without the guesswork',
    lead: 'Smaller files, your size target, no nonsense. Drop in JPG, PNG, WebP, AVIF, HEIC, TIFF, GIF, or SVG files.',
  }),
  compression({
    id: 'compress-image-to-size',
    slug: 'compress-image-to-size',
    popular: true,
    title: 'Compress Image to Exact KB or MB | Free Target Size Tool',
    description:
      'Set any KB or MB limit and get the highest practical image quality at or below your target.',
    h1: 'Compress an image to a specific size',
    lead: 'Need it under 73 KB? Tell us 73 KB. The engine searches quality first, then carefully reduces dimensions only when needed.',
    operation: {
      kind: 'compress',
      mode: 'exact',
      format: 'original',
      targetBytes: 102400,
      minQuality: 35,
    },
  }),
  compression({
    id: 'compress-jpeg',
    slug: 'compress-jpeg',
    title: 'Compress JPEG Online Free | JPG Compressor',
    description:
      'Reduce JPEG and JPG file size with progressive encoding, quality control, batch support, and exact targets.',
    h1: 'Compress JPEG files',
    lead: 'Shrink photographs and scans while keeping them crisp. Progressive JPEG output and controlled quality are built in.',
    accept: 'image/jpeg,.jpg,.jpeg',
    operation: { kind: 'compress', mode: 'smart', format: 'jpeg' },
  }),
  compression({
    id: 'compress-png',
    slug: 'compress-png',
    title: 'Compress PNG Online Free | Lossless PNG Optimizer',
    description:
      'Optimize PNG images with lossless compression or controlled palette reduction while preserving transparency.',
    h1: 'Compress PNG images',
    lead: 'Keep transparency and choose lossless optimization or a smaller palette-based result.',
    accept: 'image/png,.png',
    operation: { kind: 'compress', mode: 'lossless', format: 'png' },
  }),
  compression({
    id: 'compress-webp',
    slug: 'compress-webp',
    title: 'Compress WebP Online Free | WebP Optimizer',
    description:
      'Make WebP images smaller with quality, near-lossless, batch, and exact-size controls.',
    h1: 'Compress WebP images',
    lead: 'Tune already-efficient WebP files without silently losing alpha or changing formats.',
    accept: 'image/webp,.webp',
    operation: { kind: 'compress', mode: 'smart', format: 'webp' },
  }),
  compression({
    id: 'compress-avif',
    slug: 'compress-avif',
    title: 'Compress AVIF Online Free | AVIF Optimizer',
    description:
      'Compress AVIF images with practical quality controls and bounded CPU-safe encoding.',
    h1: 'Compress AVIF images',
    lead: 'AVIF can get very small, but encoding is slower. This tool uses a balanced effort setting for practical results.',
    accept: 'image/avif,.avif',
    operation: { kind: 'compress', mode: 'smart', format: 'avif' },
  }),
  compression({
    id: 'batch-compress-images',
    slug: 'batch-compress-images',
    popular: true,
    title: 'Batch Compress Images Free | Download All as ZIP',
    description: 'Compress up to 50 images in one batch and download individual files or one ZIP.',
    h1: 'Batch compress images',
    lead: 'Apply one clear setting to a whole group, follow each file, then download everything together.',
    multiple: true,
  }),
  ...exactTools,
  {
    id: 'resize-image',
    slug: 'resize-image',
    category: 'Resize & Prepare',
    kind: 'resize',
    popular: true,
    title: 'Resize Image Online Free | Exact Pixels or Percentage',
    description:
      'Resize images by width, height, percentage, fit, fill, or contain with high-quality sampling.',
    h1: 'Resize an image precisely',
    lead: 'Change pixels, not just file size. Lock the aspect ratio or set an exact canvas and output format.',
    operation: { kind: 'resize', width: 1200, fit: 'inside', format: 'original', quality: 82 },
    steps: baseSteps,
    notes: [
      {
        title: 'Dimensions and bytes differ',
        text: 'Pixel dimensions describe the image grid. File size also depends on format, content, and quality.',
      },
      {
        title: 'High-quality resampling',
        text: 'Downscaling uses libvips Lanczos sampling and applies orientation before calculating the result.',
      },
    ],
    related: ['crop-image', 'compress-image-to-size', 'convert-image', 'watermark-image'],
  },
  {
    id: 'crop-image',
    slug: 'crop-image',
    category: 'Resize & Prepare',
    kind: 'crop',
    title: 'Crop Image Online Free | Custom and Common Ratios',
    description:
      'Crop images with numeric precision and common aspect ratios. Preview before downloading.',
    h1: 'Crop an image',
    lead: 'Keep the part that matters. Set a crop box with common ratios and exact pixel values.',
    operation: { kind: 'crop', left: 0, top: 0, width: 100, height: 100, format: 'original' },
    steps: baseSteps,
    notes: [
      {
        title: 'No repeated full encodes',
        text: 'The crop preview is calculated locally. The server receives only the final crop rectangle.',
      },
      {
        title: 'Coordinates',
        text: 'Left and top locate the crop box. Width and height define the pixels kept.',
      },
    ],
    related: ['resize-image', 'rotate-image', 'compress-image-to-size', 'watermark-image'],
  },
  {
    id: 'rotate-image',
    slug: 'rotate-image',
    category: 'Resize & Prepare',
    kind: 'rotate',
    title: 'Rotate Image Online Free',
    description: 'Rotate JPG, PNG, WebP, and AVIF images by 90, 180, or 270 degrees.',
    h1: 'Rotate an image',
    lead: 'Turn an image clockwise without wrestling with an editor.',
    operation: { kind: 'rotate', degrees: 90, format: 'original' },
    steps: baseSteps,
    notes: [
      {
        title: 'Orientation handled',
        text: 'Camera orientation is normalized before your chosen rotation is applied.',
      },
    ],
    related: ['crop-image', 'resize-image', 'convert-image'],
  },
  {
    id: 'convert-image',
    slug: 'convert-image',
    category: 'Convert',
    kind: 'convert',
    popular: true,
    title: 'Convert Images Online Free | JPG, PNG, WebP & AVIF',
    description:
      'Convert images between JPG, PNG, WebP, and AVIF. HEIC, TIFF, and SVG input supported where the production codec allows.',
    h1: 'Convert an image',
    lead: 'Choose the format that fits the job. Transparency gets a clear warning before JPEG conversion.',
    operation: { kind: 'convert', format: 'webp', quality: 82 },
    steps: baseSteps,
    notes: [
      {
        title: 'Format matters',
        text: 'JPEG is broadly compatible for photos. PNG preserves exact pixels and alpha. WebP and AVIF usually save more bytes.',
      },
    ],
    related: ['jpg-to-webp', 'png-to-jpg', 'compress-image-to-size', 'image-metadata'],
  },
  ...converterPairs.map(([slug, name, input, output, lead]): ToolDefinition => ({
    id: slug,
    slug,
    category: 'Convert' as const,
    kind: 'convert' as const,
    title: `${name} Online Free | compressimage.fun`,
    description: `${name} with quality controls, safe temporary processing, and no signup or watermark.`,
    h1: name,
    lead,
    accept: input === 'jpeg' ? 'image/jpeg,.jpg,.jpeg' : `image/${input},.${input}`,
    operation: { kind: 'convert', format: output, quality: 82 },
    steps: baseSteps,
    notes: [
      { title: `${input.toUpperCase()} to ${output.toUpperCase()}`, text: lead },
      {
        title: 'What stays',
        text: 'Visible pixels and orientation are preserved. Private metadata is removed unless a tool explicitly offers preservation.',
      },
    ],
    related: [
      'convert-image',
      `compress-${output === 'jpeg' ? 'jpeg' : output}`,
      'resize-image',
      'remove-image-metadata',
    ],
    aliases:
      slug === 'heic-to-jpg'
        ? ['iphone photo', 'apple photo', 'heif to jpg']
        : [name.toLowerCase()],
    primaryIntent: name.toLowerCase(),
  })),
  {
    id: 'image-to-pdf',
    slug: 'image-to-pdf',
    category: 'Convert',
    kind: 'image-pdf',
    popular: true,
    title: 'Image to PDF Converter | JPG, PNG & WebP to One PDF',
    description:
      'Combine and reorder images into one A4, Letter, or image-sized PDF entirely in your browser.',
    h1: 'Convert images to one PDF',
    lead: 'Arrange photos or scans, choose the page size and margins, then download one PDF. The images stay in your browser.',
    steps: [
      'Choose JPG, PNG, or WebP images.',
      'Reorder pages and set paper, orientation, margins, and fit.',
      'Build and download one PDF.',
    ],
    notes: [
      {
        title: 'Local assembly',
        text: 'Ordinary image-to-PDF work happens in this browser and does not consume a server processing slot.',
      },
      {
        title: 'One focused PDF tool',
        text: 'This creates a PDF from images. It is not a general PDF editor, merger, or form tool.',
      },
    ],
    related: [
      'image-compressor',
      'resize-image',
      'compress-image-to-size',
      'remove-image-metadata',
    ],
    aliases: ['jpg to pdf', 'png to pdf', 'photos to pdf', 'scan to pdf'],
    primaryIntent: 'image to PDF',
  },
  {
    id: 'image-to-base64',
    slug: 'image-to-base64',
    category: 'Developer',
    kind: 'base64-encode',
    popular: true,
    title: 'Image to Base64 Converter | Browser-Only & Private',
    description:
      'Convert an image to raw Base64, Data URI, HTML, CSS, Markdown, or JSON entirely in your browser.',
    h1: 'Convert an image to Base64',
    lead: 'Your image stays in this browser. Generate a raw string or paste-ready code without uploading the file.',
    steps: [
      'Choose or drop one image.',
      'Select the output wrapper.',
      'Copy or download the encoded text.',
    ],
    notes: [
      {
        title: 'Why it gets larger',
        text: 'Base64 represents binary data as text and is usually about one third larger before transport compression.',
      },
      {
        title: 'Browser-only',
        text: 'This tool does not call the processing API. Network tests enforce that boundary.',
      },
    ],
    related: ['base64-to-image', 'base64-image-viewer', 'image-to-data-uri', 'image-metadata'],
  },
  {
    id: 'base64-to-image',
    slug: 'base64-to-image',
    category: 'Developer',
    kind: 'base64-decode',
    title: 'Base64 to Image Converter | Preview and Download',
    description:
      'Decode raw Base64, Data URIs, or simple JSON string values into a safe image preview and download.',
    h1: 'Convert Base64 to an image',
    lead: 'Paste a Base64 blob and immediately see its detected type, dimensions, and decoded size.',
    steps: [
      'Paste a Base64 value or Data URI.',
      'Decode and inspect the detected image.',
      'Download the original decoded bytes.',
    ],
    notes: [
      {
        title: 'Type detection',
        text: 'The decoder checks the Data URI and decoded magic bytes instead of trusting a label alone.',
      },
      { title: 'SVG safety', text: 'Decoded SVG is never injected as active page markup.' },
    ],
    related: ['image-to-base64', 'base64-image-viewer', 'image-to-data-uri'],
  },
  {
    id: 'base64-image-viewer',
    slug: 'base64-image-viewer',
    category: 'Developer',
    kind: 'base64-viewer',
    title: 'Base64 Image Viewer | Inspect Data URIs Safely',
    description:
      'Paste Base64 from an API payload, database, CSS, or HTML and inspect the image without uploading it.',
    h1: 'View a Base64 image',
    lead: 'A quick debugging surface for API responses, data URIs, JSON values, and database blobs.',
    steps: [
      'Paste the value.',
      'Inspect the decoded preview and details.',
      'Download only if you need the bytes.',
    ],
    notes: [
      {
        title: 'Built for debugging',
        text: 'Whitespace is normalized and obvious JSON string wrappers are extracted safely.',
      },
    ],
    related: ['base64-to-image', 'image-to-base64', 'image-to-data-uri'],
  },
  {
    id: 'image-to-data-uri',
    slug: 'image-to-data-uri',
    category: 'Developer',
    kind: 'base64-encode',
    title: 'Image to Data URI Converter | Browser-Only',
    description:
      'Turn an image into a paste-ready Data URI, CSS URL, HTML image, or Markdown value without uploading.',
    h1: 'Convert an image to a Data URI',
    lead: 'Make a self-contained text representation for prototypes, small icons, or debugging. Large photos are usually better as files.',
    steps: baseSteps,
    notes: [
      {
        title: 'Use sparingly',
        text: 'Data URIs can reduce separate requests for tiny assets, but they increase source size and cannot be cached independently.',
      },
    ],
    related: ['image-to-base64', 'base64-to-image', 'base64-image-viewer'],
  },
  {
    id: 'image-metadata',
    slug: 'image-metadata',
    category: 'Inspect & Privacy',
    kind: 'metadata',
    title: 'Image Metadata Viewer | EXIF, GPS, Size & Format',
    description:
      'Inspect format, dimensions, color details, camera EXIF, and possible GPS metadata in an image.',
    h1: 'Inspect image metadata',
    lead: 'See what the file reveals, including camera fields and location coordinates when they are present.',
    operation: { kind: 'metadata', action: 'inspect' },
    steps: baseSteps,
    notes: [
      {
        title: 'GPS stands out',
        text: 'Location fields are highlighted because they can reveal where a photo was taken.',
      },
      {
        title: 'Temporary inspection',
        text: 'Parsed metadata is kept only with the private temporary job and is deleted with the image.',
      },
    ],
    related: ['remove-image-metadata', 'image-to-base64', 'compress-image-to-size'],
  },
  {
    id: 'remove-image-metadata',
    slug: 'remove-image-metadata',
    category: 'Inspect & Privacy',
    kind: 'metadata',
    popular: true,
    title: 'Remove Image Metadata & EXIF Online Free',
    description:
      'Remove EXIF, GPS, camera, and other non-visual metadata while preserving the visible image.',
    h1: 'Remove image metadata',
    lead: 'Strip location and camera fields without blurring or changing what is visible in the pixels.',
    operation: { kind: 'metadata', action: 'remove', format: 'original' },
    steps: baseSteps,
    notes: [
      {
        title: 'A precise privacy claim',
        text: 'Removing metadata does not hide information visible in the pixels themselves.',
      },
    ],
    related: ['image-metadata', 'compress-image-to-size', 'convert-image'],
  },
  {
    id: 'passport-photo-resizer',
    slug: 'passport-photo-resizer',
    category: 'Resize & Prepare',
    kind: 'prepare',
    popular: true,
    title: 'Passport & Form Photo Resizer | Pixels, DPI and KB',
    description:
      'Crop and resize a passport or form photo to custom pixels, DPI, format, and maximum KB without unverified compliance claims.',
    h1: 'Resize a passport or form photo',
    lead: 'Enter the exact dimensions and byte cap from your form. Always verify the final photo requirements with the authority receiving the image.',
    operation: {
      kind: 'prepare',
      width: 600,
      height: 600,
      targetBytes: 200 * 1024,
      format: 'jpeg',
      quality: 90,
      background: '#ffffff',
      density: 300,
      trim: false,
      fit: 'cover',
      position: 'centre',
    },
    steps: [
      'Check the receiving authority’s current dimensions, format, and byte limit.',
      'Enter those custom requirements and position the image with cover or contain.',
      'Process, inspect the exact result, and verify it again before submitting.',
    ],
    notes: [
      {
        title: 'No fake compliance badge',
        text: 'This tool prepares pixels and bytes. It does not inspect pose, expression, lighting, or jurisdiction-specific photo rules.',
      },
      {
        title: 'DPI has a limited role',
        text: 'DPI is stored as output metadata. Online forms usually care more about pixel dimensions, format, and file bytes.',
      },
    ],
    related: ['compress-image-to-size', 'resize-image', 'photo-signature-resizer', 'image-to-pdf'],
    aliases: [
      'passport photo maker',
      'form photo resize',
      'photo for application',
      'photo kb resize',
    ],
    primaryIntent: 'passport and form photo resizer',
  },
  {
    id: 'photo-signature-resizer',
    slug: 'photo-signature-resizer',
    category: 'Resize & Prepare',
    kind: 'prepare',
    popular: true,
    title: 'Photo & Signature Resizer | Custom Pixels and KB',
    description:
      'Prepare a photo or signature to custom width, height, maximum KB, background, and JPG or PNG format.',
    h1: 'Resize a photo or signature for a form',
    lead: 'Use the exact custom requirements shown by the form. No invented exam presets and no compliance claims.',
    operation: {
      kind: 'prepare',
      width: 300,
      height: 100,
      targetBytes: 50 * 1024,
      format: 'png',
      quality: 90,
      background: '#ffffff',
      density: 96,
      trim: true,
      fit: 'contain',
      position: 'centre',
    },
    steps: [
      'Choose whether you are preparing a photo or a signature.',
      'Enter the required width, height, maximum KB, and output format.',
      'Trim optional whitespace, process, and compare the result with the form requirements.',
    ],
    notes: [
      {
        title: 'Signature controls',
        text: 'Trim removes border-like whitespace before fitting. PNG can keep transparency; JPEG uses the chosen background.',
      },
      {
        title: 'Requirements change',
        text: 'The tool uses your custom numbers and does not copy unverified dimensions from exam blogs.',
      },
    ],
    related: [
      'passport-photo-resizer',
      'compress-image-to-size',
      'resize-image',
      'remove-image-metadata',
    ],
    aliases: ['signature resize', 'exam photo resize', 'signature kb', 'photo signature'],
    primaryIntent: 'photo and signature resizer',
  },
  {
    id: 'image-color-picker',
    slug: 'image-color-picker',
    category: 'Inspect & Privacy',
    kind: 'color-picker',
    popular: true,
    title: 'Image Color Picker | HEX, RGB, HSL and Palette',
    description:
      'Pick exact pixel colors and extract a five-color palette from an image entirely in your browser.',
    h1: 'Pick colors from an image',
    lead: 'Zoom in, move to a pixel, lock the color, and copy HEX, RGB, or HSL. Nothing uploads.',
    steps: [
      'Choose, paste, or drop an image.',
      'Hover or use the keyboard cursor, then click or press Enter to lock a pixel.',
      'Copy HEX, RGB, HSL, or one of the extracted palette colors.',
    ],
    notes: [
      {
        title: 'Pixel values',
        text: 'The picker reads decoded canvas pixels in the browser. Color-management differences between browsers and source profiles can affect displayed values.',
      },
      {
        title: 'Accessible alternative',
        text: 'Arrow keys move the keyboard cursor on the image; Enter locks the current color.',
      },
    ],
    related: ['favicon-generator', 'image-metadata', 'compress-png', 'resize-image'],
    aliases: ['hex picker', 'pixel color', 'rgb picker', 'palette extractor', 'dominant color'],
    primaryIntent: 'image color picker',
  },
  {
    id: 'favicon-generator',
    slug: 'favicon-generator',
    category: 'Create',
    kind: 'favicon',
    popular: true,
    title: 'Favicon Generator | ICO, PNG Icons & HTML Snippet',
    description:
      'Generate favicon.ico, common PNG app icons, an Apple touch icon, HTML snippet, and ZIP from one image.',
    h1: 'Generate a favicon package',
    lead: 'Start with one image and get favicon.ico, crisp PNG sizes, an Apple touch icon, and a ready HTML snippet.',
    operation: { kind: 'favicon', fit: 'contain', background: '#00000000' },
    steps: baseSteps,
    notes: [
      {
        title: 'Generated sizes',
        text: 'The package includes ICO with 16, 32, and 48 pixel layers, PNG icons through 512 pixels, and an HTML snippet.',
      },
    ],
    related: ['resize-image', 'crop-image', 'compress-png', 'image-color-picker'],
  },
  {
    id: 'watermark-image',
    slug: 'watermark-image',
    category: 'Create',
    kind: 'watermark',
    title: 'Watermark Image Online | Text Position & Opacity',
    description:
      'Add your own text watermark with position, scale, opacity, and padding controls. No product watermark added.',
    h1: 'Add a watermark to an image',
    lead: 'Place your own mark. compressimage.fun never adds its name or tracking pixels to the result.',
    operation: {
      kind: 'watermark',
      text: 'Your watermark',
      position: 'southeast',
      opacity: 0.7,
      scale: 0.06,
      padding: 24,
      format: 'original',
    },
    steps: baseSteps,
    notes: [
      {
        title: 'Your watermark only',
        text: 'The downloaded image contains only the mark you requested.',
      },
    ],
    related: ['resize-image', 'crop-image', 'compress-image-to-size'],
  },
];

export const toolBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
export const toolById = new Map(tools.map((tool) => [tool.id, tool]));
export const toolPath = (tool: ToolDefinition): string => (tool.slug ? `/${tool.slug}` : '/');
