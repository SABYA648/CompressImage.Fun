# Privacy model

## Server tools

```text
user image → same-origin upload → native processor → private temporary volume
           → validated result → download or Delete now → automatic TTL deletion
```

Compression, exact-size, resize, crop, conversion, metadata, prepare, watermark, and favicon tools use this path. A random bearer capability protects the job. Files are automatically deleted within `FILE_TTL_SECONDS`, four hours by default. Startup and periodic cleanup make the promise technical, not editorial. Immediate deletion is provided via `DELETE /api/jobs/:id`.

Logs deliberately exclude image contents, Base64, EXIF values, GPS, secrets, result URLs, and full filenames. Safe operational fields include request ID, tool ID, format, coarse byte bucket, duration, status, and controlled error category.

## Browser tools

```text
image or Base64 → browser memory → preview/text/download
```

The Base64 suite, Image to PDF, and Color Picker tools have zero processing API calls. Blob URLs are revoked and very large strings are rejected before decoding. Decoded SVG is not rendered as active markup.

## Analytics boundary

Site analytics is powered by Google Analytics 4 (with IP anonymization enforced and Google Signals disabled) and an independent privacy-focused Umami instance. The typed event wrapper accepts only controlled, high-level operational dimensions such as tool ID, format, count bucket, byte bucket, and result category. It never accepts or transmits filenames, image pixel data, Base64 strings, EXIF metadata, GPS coordinates, job IDs, access tokens, file URLs, or free-form errors.
