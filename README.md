# compressimage.fun

Drop an image. Get exactly what you need.

## Live site

The production domain is intended to be [compressimage.fun](https://compressimage.fun). The application is not described as deployed until the final Coolify release is separately authorized and verified.

## What it is

compressimage.fun is a no-login image utility built around an excellent compressor. It handles ordinary quality compression, exact KB/MB limits, batch jobs, resize, crop, rotation, format conversion, metadata inspection/removal, text watermarks, favicons, and browser-only Base64 workflows.

## Why it exists

Image chores are usually split across unrelated sites with unclear limits. This project keeps one predictable workspace, honest privacy language, useful quality controls, and an easy next-tool loop. There are no ads, payments, artificial daily quotas, or product watermarks.

## Features

- Smart, Quality, Lossless, and Exact Size compression
- Highest practical quality at or below a requested byte cap
- Batch processing with individual downloads and ZIP export
- JPG, PNG, WebP, AVIF, HEIC/HEIF, TIFF, GIF, and safe SVG input detection
- Resize, crop, rotate, convert, passport/form photo, photo/signature, metadata, watermark, and favicon operations
- Browser-local Image to PDF and image color picker workflows
- Browser-only Base64 encode, decode, viewer, and Data URI tools
- Private capability-token jobs, Delete now, and automatic four-hour cleanup
- Static Astro pages, controlled SEO routes, sitemap, robots.txt, and llms.txt

## Exact-size compression

The optimizer never treats a codec quality number as a byte target. It normalizes orientation, performs a bounded quality search at the original dimensions, validates candidate bytes, and only then walks through a controlled dimension sequence. It returns the best result under the cap or an honest impossible-target response. See [Image engine](docs/image-engine.md).

## Processing architecture

Nginx serves the static Astro build and proxies same-origin `/api` requests to a private Fastify service. Sharp/libvips performs native image work. Jobs use random directories and internal filenames on an isolated Docker volume. See [Architecture](docs/architecture.md).

## Supported formats

| Input             |                            Inspect |             Compress/transform | Output                |
| ----------------- | ---------------------------------: | -----------------------------: | --------------------- |
| JPEG/JPG          |                                Yes |                            Yes | JPEG, PNG, WebP, AVIF |
| PNG               |                                Yes |           Yes, including alpha | JPEG, PNG, WebP, AVIF |
| WebP              |                                Yes |                    Yes, static | JPEG, PNG, WebP, AVIF |
| AVIF              |                                Yes |                    Yes, static | JPEG, PNG, WebP, AVIF |
| HEIC/HEIF         | When production libvips decodes it |              Convert/transform | JPEG, PNG, WebP, AVIF |
| TIFF              |                                Yes |        Yes, first static image | JPEG, PNG, WebP, AVIF |
| SVG               |              Safe inert input only |                      Rasterize | PNG, JPEG, WebP, AVIF |
| Animated GIF/WebP |                           Detected | Rejected rather than flattened | Deferred              |

Actual production-format evidence is recorded in [test evidence](docs/test-evidence.md).

## File retention and privacy

Server tools upload to the same origin and store files temporarily. Files delete automatically within `FILE_TTL_SECONDS`, four hours by default, and Delete now removes the job immediately. Base64 tools do not upload file or text contents. See [Privacy model](docs/privacy-model.md).

## Development

Local Docker is authoritative. Do not use host Node.js or native codecs as release evidence.

```sh
docker build --target build -t compressimage-build:local .
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build -d
```

Production Compose does not publish a host port; Coolify routes to container
`8080`. The local overlay binds `http://127.0.0.1:8080` only. Dependencies,
checks, and builds run in containers:

```sh
docker compose run --rm processor node --version
docker build --target build -t compressimage-build:local .
docker compose --profile qa run --rm e2e npm run test:e2e
```

## Environment variables

Copy `.env.example` and adjust only when needed. The important limits are:

- `FILE_TTL_SECONDS`: maximum job lifetime
- `PROCESS_CONCURRENCY`: concurrently active jobs
- `SHARP_CONCURRENCY`: libvips threads per image operation
- `MAX_UPLOAD_BYTES`, `MAX_BATCH_BYTES`, `MAX_BATCH_FILES`: upload boundaries
- `MAX_IMAGE_PIXELS`, `MAX_ANIMATION_FRAMES`: decoder boundaries
- `PROCESS_TIMEOUT_MS`: bounded processing duration
- `MIN_FREE_DISK_BYTES`: upload rejection threshold under disk pressure

Public analytics and verification variables are optional and empty by default.

## Tests

The local gate includes type checks, lint, formatting, content lint, unit/security tests, static build, Docker health, API flows, Playwright, SEO crawl, benchmarks, concurrency, TTL, and Lighthouse. Commands and actual outcomes belong in [test evidence](docs/test-evidence.md); an unrun check is never described as passed.

## Docker and Coolify

The production reference uses the same `web` and `processor` Docker targets and service contract locally. Coolify is the final release phase only. See [Coolify deployment](docs/coolify-deployment.md) and [release checklist](docs/release-checklist.md).

## Security model

Uploads stream to random files, are checked by magic bytes and decoder metadata, and are bounded by byte, pixel, frame, concurrency, and disk limits. Result APIs require a separate high-entropy bearer token. SVG with scripts, event handlers, foreign objects, entities, or remote references is rejected. Containers run non-root with dropped capabilities and read-only roots where practical.

## SEO architecture

The homepage owns generic image-compressor intent. Six controlled exact-size routes and a deliberate set of real tool pages use one data registry for links and sitemap generation. See [SEO intent map](docs/seo-intent-map.md).

## Contributing

Please open a focused issue or pull request. Add deterministic fixtures for processing changes, keep public claims measurable, and run the Docker gate before requesting review.

## License

Application code is MIT licensed. Native libraries and npm packages retain their own licenses. See [third-party licenses](THIRD_PARTY_LICENSES.md).
