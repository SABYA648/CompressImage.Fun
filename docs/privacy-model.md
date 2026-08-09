# Privacy model

## Server tools

```text
user image → same-origin upload → native processor → private temporary volume
           → validated result → download or Delete now → automatic TTL deletion
```

Compression, resize, crop, conversion, metadata, watermark, and favicon tools use this path. A random bearer capability protects the job. Files are automatically deleted within `FILE_TTL_SECONDS`, four hours by default. Startup and periodic cleanup make the promise technical, not editorial.

Logs deliberately exclude image contents, Base64, EXIF values, GPS, secrets, result URLs, and full filenames. Safe operational fields include request ID, tool ID, format, coarse byte bucket, duration, status, and controlled error category.

## Browser tools

```text
image or Base64 → browser memory → preview/text/download
```

The Base64 suite has no processing API call. Blob URLs are revoked and very large strings are rejected before decoding. Decoded SVG is not rendered as active markup.

## Analytics boundary

Analytics is absent when no public measurement ID is configured. The typed event wrapper accepts controlled dimensions such as tool ID, format, count bucket, byte bucket, and result category. It does not accept filenames, image data, Base64, EXIF, job IDs, access tokens, file URLs, or free-form errors.
