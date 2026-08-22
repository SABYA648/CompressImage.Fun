# Privacy model

## Server tools

```text
user image → same-origin upload → native processor → private temporary volume
           → validated result → download or Delete now → automatic TTL deletion
```

Compression, exact-size presets, batch, resize, crop, rotate, conversion, metadata, form-photo, watermark, and favicon tools use this path. A random bearer capability protects the job. Files are automatically deleted within `FILE_TTL_SECONDS`, four hours by default. Startup and periodic cleanup make the promise technical, not editorial.

Logs deliberately exclude image contents, Base64, EXIF values, GPS, secrets, result URLs, and full filenames. Safe operational fields include request ID, tool ID, format, coarse byte bucket, duration, status, and controlled error category.

## Browser tools

```text
image or Base64 → browser memory → preview/text/download
```

The Base64 suite, Image to PDF, and the color picker have no processing API call for the file. Blob URLs are revoked and very large strings are rejected before decoding. Decoded SVG is not rendered as active markup.

## Analytics boundary

Google Analytics 4 loads only when `PUBLIC_GA_MEASUREMENT_ID` is present at static build time. Umami loads only when `PUBLIC_UMAMI_WEBSITE_ID` is present. Production HTML inspected on 22 August 2026 included GA4 `G-W530RG17S3`. Local Docker without those variables injects neither script.

The typed event wrapper accepts controlled dimensions such as tool ID, format, count bucket, byte bucket, and result category. It does not accept filenames, image data, Base64, EXIF, job IDs, access tokens, file URLs, or free-form errors.

Page-view analytics, when enabled, is still telemetry. It is not file storage. Public copy must not say analytics is off while a measurement ID is baked into the image.
