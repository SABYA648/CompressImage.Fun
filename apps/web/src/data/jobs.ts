export interface UserJob {
  id: string;
  label: string;
  href: string;
  text: string;
}

export const userJobs: UserJob[] = [
  {
    id: 'exact-size',
    label: 'Hit a form byte cap',
    href: '/compress-image-to-size',
    text: 'Type any KB or MB limit. Quality is searched at the original pixels first.',
  },
  {
    id: 'batch',
    label: 'Compress a whole folder',
    href: '/batch-compress-images',
    text: 'Apply one setting to many images and download a ZIP. No signup or watermark.',
  },
  {
    id: 'convert',
    label: 'Change the format',
    href: '/convert-image',
    text: 'Move between JPG, PNG, WebP, and AVIF. HEIC, TIFF, and safe SVG can be inputs.',
  },
  {
    id: 'heic',
    label: 'Open an iPhone HEIC',
    href: '/heic-to-jpg',
    text: 'Make a JPG copy when a form or app still expects JPEG.',
  },
  {
    id: 'form-photo',
    label: 'Prepare a form photo',
    href: '/passport-photo-resizer',
    text: 'Enter the authority’s pixels, format, and KB. This is preparation, not compliance.',
  },
  {
    id: 'metadata',
    label: 'Strip location data',
    href: '/remove-image-metadata',
    text: 'Remove EXIF and GPS from a copy. Visible pixels are unchanged.',
  },
  {
    id: 'base64',
    label: 'Encode in the browser',
    href: '/image-to-base64',
    text: 'Base64, Data URI, and PDF assembly stay in this tab. They do not upload the file.',
  },
  {
    id: 'favicon',
    label: 'Build a favicon set',
    href: '/favicon-generator',
    text: 'Produce ICO, PNG sizes, and an HTML snippet from one source image.',
  },
];

export const isBrowserToolKind = (kind: string): boolean =>
  ['base64-encode', 'base64-decode', 'base64-viewer', 'image-pdf', 'color-picker'].includes(kind);
