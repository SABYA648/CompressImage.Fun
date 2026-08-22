export interface ToolFaq {
  question: string;
  answer: string;
}

const serverRetention =
  'Yes. This tool uploads the file to compressimage.fun. Jobs use a private token. Files auto-delete within four hours, and Delete now removes the job immediately.';

export const toolFaqs: Record<string, ToolFaq[]> = {
  'image-compressor': [
    {
      question: 'Does the homepage compressor upload my image?',
      answer: serverRetention,
    },
    {
      question: 'Can I set an exact KB or MB size here?',
      answer:
        'Yes. Choose Exact Size and type any cap, or open the dedicated exact-size tool. The engine searches quality first and reduces dimensions only when that search cannot meet the cap.',
    },
    {
      question: 'Is the result lossless?',
      answer:
        'Only Lossless mode aims to keep decoded pixels. Smart, Quality, and Exact Size may discard detail. Animated GIF and animated WebP are rejected rather than flattened.',
    },
  ],
  'compress-image-to-size': [
    {
      question: 'Will the file be exactly 50 KB, or at or below 50 KB?',
      answer:
        'At or below the cap. The optimizer never pads bytes to land on a round number. If the source is already small enough, it is returned unchanged.',
    },
    {
      question: 'Why did the width and height change?',
      answer:
        'Quality search runs at the original dimensions first. Pixels shrink only when even a low useful quality still exceeds the cap. Extreme caps such as 20 KB often need fewer pixels.',
    },
    {
      question: 'Does this upload the image?',
      answer: serverRetention,
    },
  ],
  'batch-compress-images': [
    {
      question: 'Is there a signup or product watermark?',
      answer:
        'No. Batch jobs use the same compressor, with individual downloads and one ZIP. There is no account wall and compressimage.fun does not stamp the result.',
    },
    {
      question: 'What is the batch limit?',
      answer:
        'Up to 50 files and 500 MB combined by default, with a 100 MB per-file ceiling. Limits are enforced by the processor, not by a marketing quota.',
    },
  ],
  'passport-photo-resizer': [
    {
      question: 'Will this photo be accepted for a passport or visa?',
      answer:
        'This tool cannot promise that. It prepares the pixels, format, DPI metadata, and byte cap you enter. Pose, background, recency, and legal rules belong to the receiving authority.',
    },
    {
      question: 'Does the image upload?',
      answer: serverRetention,
    },
  ],
  'photo-signature-resizer': [
    {
      question: 'Are exam or government sizes built in?',
      answer:
        'No. Requirements change and third-party lists go stale. Enter the current width, height, format, and KB from the form you are actually submitting.',
    },
  ],
  'image-to-base64': [
    {
      question: 'Does this upload my image?',
      answer:
        'No. Encoding runs in this browser. Network tests on this route assert that the processing API is not called.',
    },
  ],
  'image-to-pdf': [
    {
      question: 'Does Image to PDF upload files?',
      answer:
        'No. Page assembly and encoding run in this browser. It is not a general PDF editor or merger.',
    },
  ],
  'image-color-picker': [
    {
      question: 'Does the color picker upload the image?',
      answer: 'No. Pixel sampling uses a local canvas. Nothing is sent to the processing API.',
    },
  ],
  'compress-png': [
    {
      question: 'Is PNG compression always lossless?',
      answer:
        'Lossless mode keeps decoded pixels and relies on PNG filtering. Quality mode may use a palette, which can change colors. Exact Size may reduce quality or dimensions to meet a cap.',
    },
  ],
};
