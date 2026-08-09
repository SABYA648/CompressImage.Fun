# BUILD COMPRESSIMAGE.FUN
# CORE PRODUCT, PROCESSING ENGINE, TOOL ECOSYSTEM, SEO FOUNDATION AND PRODUCTION DOCKER

You are the founding principal engineer, staff product designer, image-processing engineer, technical SEO lead, growth product manager, privacy/security engineer, accessibility lead, QA lead and release engineer for:

`https://compressimage.fun`

This repository is intended to become a public open-source project.

This is the main foundational implementation pass.

A later coding agent will perform another hardening, benchmarking and SEO refinement pass.

Your job now is to get approximately 90 percent of the durable product architecture and core user-facing functionality right.

Do not return a plan.

Inspect the repository and implement the product.

Do not stop at scaffolding.

Do not create fake functionality.

Do not leave important buttons dead.

Do not create placeholder SEO pages.

Do not create hundreds of programmatic pages.

Do not spend the majority of the implementation budget on experimental AI features.

Prioritize the core utility, architecture and search-distribution surface.

The product must be excellent enough that a later agent improves it rather than rebuilding it.

---

# 0. EXECUTION ENVIRONMENT AND DEPLOYMENT GATE

Local Docker is the authoritative implementation and validation environment for this project.

Use the production Dockerfile and Docker Compose topology locally for all project dependency installation, builds, runtime work, integration tests, E2E tests, benchmarks, security checks, visual QA, accessibility checks, Lighthouse runs, load tests and TTL validation. Host-side activity should be limited to repository inspection/editing, Git and Docker orchestration. Do not rely on host-installed Node.js or native image libraries to prove correctness.

In this document, `production Docker`, `production-like Docker` and `actual production Docker composition` mean the production-equivalent composition running on the local machine unless a step explicitly says that deployment has begun.

Do not use Coolify as a development, debugging or test environment. Do not deploy an incomplete build to discover problems that can be found locally. Do not mutate Coolify, the production VPS, DNS, TLS or the public site during implementation and local hardening.

Coolify deployment is a distinct final release phase. It may begin only after:

- every required local Docker service builds cleanly from a fresh local Docker build state
- the complete local quality gate in sections 128, 129, 134 and 136 has passed
- failures and material warnings have been fixed or explicitly documented as release blockers
- release configuration, persistent volumes, health checks, rollback steps and required secrets are documented
- the final local handoff says `READY FOR COOLIFY DEPLOYMENT`
- the owner explicitly authorizes the deployment step

Deploy to Coolify from the same reviewed Docker artifacts and Compose contract validated locally. Do not create a separate production-only application path.

If a requirement cannot be validated locally, document exactly why and treat it as a release blocker unless it is inherently a post-deployment check. Deployment is never a substitute for incomplete local verification.

---

# 1. PRODUCT MISSION

Build the best free general-purpose image utility website that can realistically be created on this infrastructure.

Domain:

`compressimage.fun`

The product starts as an exceptional image compressor and expands into a coherent suite of image utilities.

Think:

- the simplicity and utility density of iLoveIMG
- the conversion breadth philosophy of CloudConvert
- the practical power-tool philosophy of Ezgif
- the compression control philosophy of Squoosh
- but with one coherent interface
- no signup
- no watermark
- no subscription
- no artificial daily quotas
- excellent exact-file-size compression
- strong batch workflows
- first-class developer utilities
- transparent temporary server processing
- excellent SEO architecture
- open-source implementation
- self-hostable Docker deployment

Do not copy those products visually or textually.

Build an original product.

The product proposition should be conceptually:

`Drop an image. Get exactly what you need.`

The compressor-specific proposition should communicate:

`Smaller files. Your size target. No guesswork.`

Refine the public wording.

Avoid corporate marketing language.

---

# 2. BUSINESS / PRODUCT PRIORITY

The order of priority is:

1. User success
2. Output quality
3. Reliability
4. Speed
5. Ease of use
6. Privacy/security
7. Repeat use
8. SEO/discoverability
9. Operational efficiency
10. Everything else

Do not damage the user experience for SEO.

Do not damage image quality for raw speed unless the user selected a speed-oriented mode.

Do not introduce login.

Do not introduce payments.

Do not introduce advertisements.

Do not reserve visible ad spaces.

Do not build monetization UI.

Traffic and product-market usefulness are being validated first.

---

# 3. INFRASTRUCTURE ASSUMPTION

Production VPS:

- 4 CPU cores
- 16 GB RAM
- Docker available
- persistent local Docker storage available

These are production target constraints. Reproduce their relevant CPU, memory, storage and concurrency boundaries in local Docker wherever practical before deployment.

Use this machine intelligently.

Do not architect for Kubernetes.

Do not introduce distributed systems prematurely.

Do not require managed cloud services.

Do not require Redis unless genuinely necessary.

Do not require Postgres.

Do not require object storage for the first production deployment.

Default temporary file storage should use a mounted local Docker volume.

Design a clean storage interface so an S3-compatible backend such as Garage could be added later without rewriting processing logic.

Do not implement Garage unless it becomes genuinely necessary during implementation.

---

# 4. FILE RETENTION MODEL

Uploaded and generated files may exist temporarily on compressimage.fun infrastructure.

Default maximum lifetime:

4 hours.

Environment variable:

`FILE_TTL_SECONDS=14400`

The TTL must be configurable.

The public promise must be technically accurate:

`Files are processed on compressimage.fun servers and automatically deleted within 4 hours.`

If deletion normally occurs sooner, wording may say:

`Files are automatically deleted within 4 hours, and you can delete them immediately when you're done.`

Provide:

`Delete now`

Do not say images never leave the browser for server-processing tools.

That would be false.

Browser-only tools such as Base64 conversion may accurately state that they never upload the file.

Clearly distinguish the two models.

---

# 5. STORAGE DESIGN

Use something conceptually like:

`/data/jobs/<opaque-job-id>/`

Each job should use cryptographically strong random identifiers.

Do not use sequential IDs.

A job directory may contain:

- source files
- generated outputs
- safe metadata
- expiry information

Do not use user filenames as filesystem paths.

Generate internal random filenames.

Keep the original filename only as sanitized metadata when useful for the final download name.

Never allow path traversal.

Directory permissions should be restrictive.

Implement:

- periodic expiry cleanup
- cleanup on application startup
- explicit delete endpoint
- cleanup after failed processing where appropriate

Expired files must actually be deleted.

Test it.

---

# 6. NO USER DATABASE

Do not build:

- accounts
- saved projects
- cloud libraries
- permanent histories
- user profiles

Jobs are temporary.

No account is required.

A browser may retain harmless local preferences such as:

- preferred output format
- compression mode
- recently used tool IDs
- theme if one exists

Do not persist the actual uploaded image in browser storage unless a specific browser-only tool needs transient memory.

---

# 7. ARCHITECTURE

If the repository is empty or unsuitable, use a structure optimized for static SEO plus a native Node image-processing backend.

Preferred architecture:

## Web

Astro.

Responsibilities:

- static SEO pages
- tool pages
- guides
- metadata
- structured data
- sitemap
- robots
- llms.txt generation
- interactive islands for tools

Use strict TypeScript.

Use a lightweight interactive framework only where needed.

Preact is a good default.

Do not turn editorial pages into a SPA.

## API

Node.js using the current maintained LTS release.

Use a fast lightweight server such as Fastify.

Responsibilities:

- streamed multipart uploads
- job management
- processing dispatch
- metadata
- downloads
- cleanup
- health checks

## Image engine

Use Sharp as the primary processing library.

Sharp/libvips is the default engine.

Do not implement image resizing/compression algorithms manually when mature native primitives exist.

## Reverse proxy/static server

Use Nginx or an equally lightweight production static server.

Serve static Astro output directly.

Reverse proxy `/api/*` to the processing service.

Same production origin:

`https://compressimage.fun`

No unnecessary CORS complexity.

---

# 8. DOCKER ARCHITECTURE

Use Docker Compose as both the authoritative local runtime and the production reference deployment.

The same production Dockerfile targets, service graph, health checks, volume contract and environment-variable contract must be exercised locally before Coolify deployment. Development-only overrides may improve ergonomics, but they must not hide production behavior or become the only tested path.

Prefer services conceptually like:

`web`

and

`processor`

Use one repository.

A multi-target Dockerfile is acceptable.

Example architecture:

browser
→ Nginx/static web
→ `/api` reverse proxy
→ Node processing service
→ `/data/jobs`

Do not expose the processor service directly to the internet.

Expose only the public web service.

Use an internal Docker network.

Mount persistent job storage only into the service that needs it.

---

# 9. NATIVE IMAGE ENGINE

Use Sharp/libvips as the primary engine.

Configure safe defaults deliberately.

Use:

- `failOn: 'warning'` or appropriate strict untrusted-input behavior
- explicit `limitInputPixels`
- explicit input-channel limits
- no unlimited decode mode
- safe concurrency
- metadata stripping/preservation only as requested

Review Sharp's current security controls.

Use `VIPS_BLOCK_UNTRUSTED` or Sharp operation blocking where appropriate.

Do not allow arbitrary libvips operations to be triggered by user-controlled strings.

Tool definitions must map to typed internal operations.

---

# 10. CPU / MEMORY TUNING

The production default must be sane for:

4 CPU
16 GB RAM

Expose environment variables such as:

`PROCESS_CONCURRENCY`

`SHARP_CONCURRENCY`

`MAX_UPLOAD_BYTES`

`MAX_BATCH_BYTES`

`MAX_BATCH_FILES`

`MAX_IMAGE_PIXELS`

`MAX_ANIMATION_FRAMES`

`PROCESS_TIMEOUT_MS`

`FILE_TTL_SECONDS`

Provide conservative but useful defaults.

Suggested starting architecture:

- maximum two ordinary heavyweight processing jobs concurrently
- lower concurrency for expensive AVIF operations if required
- Sharp/libvips concurrency tuned to avoid oversubscribing four physical cores

Measure before finalizing.

Set Linux allocator/environment tuning appropriately where Sharp recommends it.

Do not globally disable safety limits because the VPS has 16 GB RAM.

---

# 11. UPLOAD PIPELINE

Uploads must stream to disk.

Do not buffer arbitrary 100 MB images entirely in JavaScript memory before writing them.

Validate:

- total request size
- individual file size
- file count
- magic bytes / actual format
- decoded metadata
- pixel count
- frame count for animated images

Do not trust:

- extension
- Content-Type
- filename

Use a format-detection library or decoder metadata.

Reject invalid files gracefully.

---

# 12. DO NOT SUPPORT REMOTE IMAGE URL IMPORT IN THIS PASS

Do not accept arbitrary remote URLs such as:

`https://example.com/image.jpg`

because that introduces an unnecessary SSRF surface.

Users can:

- choose files
- drag/drop
- paste an image from clipboard

URL import can be revisited later with proper outbound restrictions.

Do not implement it now.

---

# 13. PRIMARY HOMEPAGE

The homepage is the main Image Compressor.

Primary search intent:

`image compressor`

Secondary concepts:

- compress image online
- reduce image size
- reduce image file size
- compress JPG
- compress PNG
- compress WebP
- exact KB compression

Do not create a separate `/image-compressor` page that competes with the homepage unless there is a compelling technical reason.

Homepage first viewport:

- small compressimage.fun brand
- H1
- one concise sentence
- huge high-quality dropzone
- paste support
- file picker
- zero marketing obstruction

Possible H1 direction:

`Compress images without the guesswork`

But preserve enough search clarity.

Potential alternative:

`Free online image compressor`

Choose the strongest combination of usability and search clarity.

---

# 14. DROPZONE EXPERIENCE

Input methods:

- click/browse
- drag/drop
- clipboard paste

Support multiple files.

Immediately show useful metadata:

- thumbnail
- filename
- original format
- dimensions
- original bytes

Do not upload until the user has selected enough information to begin, unless the workflow is intentionally auto-processing.

Avoid unnecessary double confirmation.

A smart default may process after file selection using the default Smart mode.

Evaluate actual UX.

---

# 15. COMPRESSION MODES

The main compressor should offer progressively disclosed modes.

## Smart

Default.

Objective:

meaningfully shrink the image while maintaining excellent perceived quality.

Preserve input format by default unless the user explicitly enables automatic modern-format conversion.

## Exact Size

User provides:

- KB
- MB

Important presets:

- 20 KB
- 50 KB
- 100 KB
- 200 KB
- 500 KB
- 1 MB

Custom size must be allowed.

Target means:

`at or below this file-size limit`

Do not pretend output will always equal the target byte-for-byte.

## Quality

User controls compression quality.

Expose a simple slider.

Advanced codec parameters can remain hidden.

## Lossless / metadata optimization

Where meaningful.

For formats such as PNG, provide an explicit lossless optimization path.

---

# 16. EXACT TARGET SIZE ENGINE

This is one of the highest-priority engineering components.

Build a deterministic reusable target-size optimizer.

Input:

- source
- output format
- target bytes
- optional dimension constraints
- optional minimum quality
- metadata policy

Output objective:

**highest practical visual quality that does not exceed target bytes**

The algorithm must not merely guess a JPEG quality number.

For lossy formats:

1. Normalize orientation logically.
2. Preserve original dimensions initially.
3. Encode candidate output.
4. Binary-search or otherwise efficiently search codec quality.
5. Keep the highest-quality candidate below target.
6. If minimum useful quality still cannot hit the target, progressively reduce dimensions.
7. Repeat quality search.
8. Select the best successful candidate.
9. Stop under bounded iterations.

Do not use an unbounded loop.

Do not DOS yourself trying hundreds of encodes.

Implement format-aware search.

---

# 17. EXACT-SIZE QUALITY MODEL

When comparing viable exact-size candidates, prefer:

1. preserving dimensions
2. then preserving quality
3. then controlled dimension reduction

But this ordering may differ at extreme targets.

Implement the decision logic explicitly and test it.

If useful, measure a perceptual similarity metric on downsampled comparison images for candidate evaluation, but do not make expensive full-resolution SSIM a hard requirement for every encode unless benchmarking shows it is affordable.

The user needs high-quality output, not an impressive algorithm diagram.

---

# 18. IMPOSSIBLE TARGETS

Some targets cannot be reached sensibly while preserving a requested format or dimensions.

Example:

A transparent detailed PNG requested at 5 KB.

Do not silently destroy it.

Return a useful result state such as:

`This PNG cannot reasonably reach 5 KB at the current dimensions.`

Offer:

- reduce dimensions
- use WebP
- use JPEG if transparency is not required
- continue with aggressive compression

Do not fail with a generic server error.

---

# 19. DO NOT RECOMPRESS NEEDLESSLY

If an uploaded file is already below a requested target:

tell the user.

Example:

`Already under 100 KB`

Offer:

`Download original`

or:

`Optimize anyway`

Do not degrade an already compliant image automatically.

---

# 20. COMPRESSION RESULT UX

Every processed file should clearly show:

- original size
- result size
- percentage saved
- dimensions before
- dimensions after
- original format
- result format

Provide visual comparison.

Desktop:

before/after slider is appropriate.

Mobile:

also provide a simple toggle:

`Original`
`Compressed`

Do not make comparison depend solely on a difficult drag gesture.

---

# 21. ADVANCED COMPRESSION SETTINGS

Hide under:

`Advanced`

Potential settings:

JPEG:
- quality
- progressive
- chroma subsampling where appropriate

PNG:
- lossless optimization
- palette optimization where legally/licensing-wise safe

WebP:
- quality
- lossless
- near-lossless where supported
- effort

AVIF:
- quality
- effort
- bit depth where genuinely useful

Metadata:
- strip
- preserve

Do not overwhelm ordinary users.

---

# 22. OUTPUT FORMAT MODEL

Default:

preserve input format.

Optional:

`Auto for web`

If selected, compare suitable modern outputs and recommend the best practical result.

Never automatically convert:

transparent PNG
→ JPEG

without warning.

Respect alpha channels.

Do not discard animation silently.

Do not convert animated images into one static frame unless explicitly selected.

---

# 23. PNG

Implement:

- lossless PNG optimization
- controlled palette mode where available and licensing permits
- metadata removal

Evaluate integrating Oxipng as a secondary lossless optimizer.

If integrated:

- pin a version
- run it without shell interpolation
- set processing timeout
- document license
- test output validity

Do not let specialist CLI invocation create command-injection risk.

---

# 24. JPEG

Use Sharp's production JPEG pipeline initially.

Support:

- progressive encoding
- optimized coding
- sensible chroma behavior
- metadata strip/preserve

Architect JPEG encoding behind an internal codec adapter.

A later hardening pass should be able to benchmark Jpegli without rewriting tool code.

If Jpegli integration proves straightforward and does not jeopardize completion, it may be included behind an experimental/internal engine option.

But DO NOT let compiling or integrating Jpegli consume the entire implementation budget.

Core product completion wins.

---

# 25. WEBP

Support:

- lossy
- lossless
- near-lossless if supported
- alpha
- animated WebP where safe

Use sensible effort settings.

Do not run maximum effort automatically if a lower setting produces near-identical output much faster.

---

# 26. AVIF

Support AVIF output.

Clearly account for slower encode times.

Use sensible default effort.

Use lower process concurrency for AVIF if benchmark results show CPU saturation.

Do not make AVIF the default output merely because it is modern.

User intent and compatibility matter.

---

# 27. HEIC / HEIF

High-priority conversion use case:

HEIC / HEIF input
→ JPG

Also consider:

HEIC
→ PNG

HEIC
→ WebP

if current underlying libraries support decoding reliably.

Do not promise HEIC output unless the actual production libvips build supports it legally and reliably.

Test HEIC input using real fixtures.

---

# 28. GIF / ANIMATION

Do not attempt to recreate all of Ezgif in this pass.

Provide a reasonable first animation surface only if stable:

- GIF compressor
- GIF to WebP
- animated WebP handling
- preserve animation in transformations where supported

Animation must never be silently flattened.

If full animation editing would jeopardize P0 completion, keep the architecture ready and leave the deep animation suite for the next agent.

Static-image quality is more important for this release.

---

# 29. SVG

Support useful SVG workflows:

- SVG to PNG
- SVG to WebP if appropriate
- SVG optimizer if a safe mature library such as SVGO is used

Treat SVG as untrusted active content.

Do not inject arbitrary uploaded SVG markup into normal page DOM.

Do not execute embedded scripts.

Do not permit arbitrary external network fetches from SVG references.

Use a safe rasterization/sanitization approach.

Test malicious fixtures.

---

# 30. TOOL WORKSPACE

Create a reusable tool workspace system.

All server-backed image tools should share:

- uploader
- drag/drop
- clipboard
- queue
- thumbnail
- image metadata
- processing states
- result cards
- download
- delete
- error states
- batch behavior

Do not build twenty unrelated pages with twenty implementations of a dropzone.

One engine.

One UX system.

Multiple tool configurations.

---

# 31. CONTINUE-WITH-ANOTHER-TOOL LOOP

This is important for repeat use and iLovePDF-like utility.

When processing is complete, show contextual options such as:

`Resize`

`Convert`

`Compress again`

`Crop`

`Remove metadata`

Do not require re-upload when the temporary result still exists.

Create a server-side job chaining mechanism.

A generated output can become the source for a new operation inside the same temporary job/session.

Do not expose permanent cloud storage.

This gives users a workflow, not merely isolated pages.

---

# 32. JOB API

Design a typed API.

A reasonable conceptual shape:

`POST /api/jobs`

Upload source file(s) and tool configuration.

`GET /api/jobs/:id`

Return safe processing state.

`GET /api/jobs/:id/files/:fileId`

Return output metadata.

`GET /api/jobs/:id/files/:fileId/download`

Download authorized output.

`DELETE /api/jobs/:id`

Delete everything immediately.

Potential:

`POST /api/jobs/:id/operations`

Run another operation on an existing result.

Use a job secret/token.

Do not rely only on a short guessable ID.

Do not place secrets into analytics.

---

# 33. JOB AUTHORIZATION

No login.

Use an ephemeral high-entropy job capability token.

Store it in browser session/local state appropriately.

Prefer an Authorization header for protected job access.

Do not put the secret into:

- page title
- analytics
- canonical
- referrer
- logs where avoidable

A user should not be able to enumerate another person's temporary files.

---

# 34. PROCESSING PROGRESS

Provide useful progress.

Stages might include:

- uploading
- reading image
- optimizing
- encoding
- finalizing

Do not fake precise 63.7 percent processing if the backend cannot measure it.

Indeterminate phases are acceptable.

For batch:

show per-file state.

---

# 35. CANCELLATION

Allow the user to cancel pending work where practical.

At minimum:

- cancel queued work
- stop showing obsolete work
- delete temp files

If native encode already executing cannot safely be interrupted through Sharp, document internally and clean output when it finishes.

Do not pretend cancellation happened if CPU work is still deliberately continuing indefinitely.

Use bounded timeouts.

---

# 36. BATCH COMPRESSION

First-class feature.

Users should be able to add many images and apply:

- Smart compression
- common quality
- target size per file
- conversion
- resize

Provide:

`Download all`

as ZIP.

Generate ZIP server-side or browser-side based on output scale.

Streaming is preferable.

Do not load hundreds of result files into Node memory simultaneously.

---

# 37. BATCH UX

Desktop and mobile.

Show:

- filename
- format
- original size
- status
- output size
- savings
- download

Allow:

- remove item
- retry
- download one
- download all

Do not render hundreds of full-resolution previews at once.

Lazy-load thumbnails.

---

# 38. CORE TOOL ROUTES

Implement high-quality real tools, not shells.

P0 routes should include:

## Compression

`/`

Main Image Compressor.

`/compress-image-to-size`

Custom exact KB/MB compressor.

`/compress-jpeg`

`/compress-png`

`/compress-webp`

`/compress-avif`

`/batch-compress-images`

## Exact target intents

Create real preconfigured tool pages for a LIMITED set of proven useful target sizes:

`/compress-image-to-20kb`

`/compress-image-to-50kb`

`/compress-image-to-100kb`

`/compress-image-to-200kb`

`/compress-image-to-500kb`

`/compress-image-to-1mb`

Each must open the same exact-size engine with target prefilled.

Do not create hundreds of variants.

Each page must contain genuinely useful distinct explanation.

## Resize and transform

`/resize-image`

`/crop-image`

`/rotate-image`

## Convert

`/convert-image`

`/jpg-to-png`

`/png-to-jpg`

`/jpg-to-webp`

`/png-to-webp`

`/webp-to-jpg`

`/webp-to-png`

`/heic-to-jpg`

`/avif-to-jpg`

`/svg-to-png`

## Developer tools

`/image-to-base64`

`/base64-to-image`

`/base64-image-viewer`

`/image-to-data-uri`

## Inspect / privacy

`/image-metadata`

`/remove-image-metadata`

## Creation / workflow

`/favicon-generator`

`/watermark-image`

`/tools`

All listed tools should work.

Do not create a card linking to a tool that does not exist.

---

# 39. OPTIONAL P1 TOOLS

Only after P0 is polished and tests pass, add low-risk, high-value tools such as:

- image color picker
- palette extractor
- round image / circle crop
- add border
- grayscale
- sharpen
- blur
- image to ICO
- ICO to PNG
- JPG to AVIF
- PNG to AVIF
- WebP to AVIF
- AVIF to WebP
- images to PDF
- social media image resizer
- GIF to WebP
- GIF compressor

Do not sacrifice P0 completion for P1 count.

---

# 40. EXPLICITLY DEFER THESE IF THEY THREATEN COMPLETION

Do not spend the main Sol budget on:

- AI background removal
- AI upscaling
- object removal
- generative fill
- image generation
- OCR
- face detection
- automatic face blur
- RAW photo development
- full Photoshop-style editor
- full Ezgif-style timeline editor
- PDF processing suite
- video processing

Create:

`docs/future-opportunities.md`

with these ideas and relevant architectural considerations.

Do not implement them merely to make the homepage feature count larger.

---

# 41. BASE64 TOOLS RUN IN THE BROWSER

These do not need server processing.

Implement locally:

## Image to Base64

Accept images.

Output modes:

- Raw Base64
- Data URI
- HTML `<img>`
- CSS `url()`
- Markdown
- JSON

Show:

- detected MIME type
- original bytes
- Base64 character count
- Base64 approximate byte overhead

Copy button.

Download `.txt`.

No upload network call.

## Base64 to Image

Accept:

- raw Base64
- Data URI
- pasted JSON value when extraction is safe/obvious

Normalize whitespace.

Validate alphabet.

Detect MIME type using:

- Data URI prefix
- decoded magic bytes

Show:

- preview
- MIME
- decoded size
- dimensions
- animation information where detectable

Allow download.

No upload.

## Base64 Image Viewer

Focus on debugging.

Paste and instantly inspect.

Useful for developers looking at:

- API payloads
- database values
- JSON
- HTML data URIs

Do not execute decoded SVG/script content.

Render safely.

## Image to Data URI

Separate SEO intent but reuse the same encoding engine.

Provide paste-ready formats.

---

# 42. BASE64 SECURITY

Base64 input can be enormous.

Set a sensible browser input limit to prevent tab crashes.

Warn before processing exceptionally large strings.

Never use `innerHTML` with decoded content.

SVG output must be treated as untrusted.

Use Blob/object URL where safe.

Revoke URLs.

Do not accidentally send Base64 contents to GA.

---

# 43. IMAGE METADATA VIEWER

Provide useful metadata.

Potential fields:

- format
- dimensions
- byte size
- alpha
- orientation
- DPI/density
- color space
- channels
- progressive status
- animation/frame information

EXIF fields when safely available:

- camera make/model
- timestamp
- exposure
- focal length
- GPS where present

Make GPS privacy risk obvious.

Do not permanently store parsed metadata.

---

# 44. REMOVE METADATA

Tool should remove unnecessary metadata while preserving visible pixels.

Default:

remove EXIF/location/private metadata.

Allow result download.

Explain:

`Removing metadata does not blur or alter the visible image, but the file may still reveal information in the pixels themselves.`

Do not overpromise privacy.

---

# 45. RESIZE TOOL

Implement high-quality resizing.

Modes:

- exact width/height
- width only
- height only
- percentage
- fit
- fill/crop
- contain with background

Aspect ratio lock.

Show:

- original dimensions
- resulting dimensions

Output format.

Quality control.

Use efficient libvips thumbnail/resizing primitives where appropriate.

---

# 46. SOCIAL PRESETS

If implemented in this pass, keep them inside the image resizer rather than generating dozens of pages.

Categories may include:

- Instagram
- YouTube
- Facebook
- X
- LinkedIn
- Open Graph

Do not hardcode claims that could change without documentation.

Store presets in a versioned data structure.

A later agent can verify/update them.

---

# 47. CROP TOOL

Excellent visual crop UX.

Support:

- freeform
- 1:1
- 4:3
- 3:2
- 16:9
- custom ratio

Keyboard accessible where practical.

Touch-friendly.

Preview result.

Do not encode the full original image repeatedly on every drag frame.

Use local preview calculations and send final crop parameters to server.

---

# 48. WATERMARK

Support:

- text watermark
- image/logo watermark
- position
- opacity
- scale
- padding

Batch support if architecture makes it straightforward.

No watermark added by compressimage.fun itself.

---

# 49. FAVICON GENERATOR

Input one suitable image.

Generate a useful package.

At minimum:

- common PNG icon sizes
- favicon.ico if reliable
- basic HTML snippet

ZIP results.

Do not generate fake platform metadata.

Document generated sizes in UI.

---

# 50. TOOL INDEX

`/tools`

Must be genuinely useful.

Provide search/filter.

Categories:

- Compress
- Resize & Crop
- Convert
- Developer
- Inspect & Privacy
- Create

Surface popular tools first.

Do not show forty identical cards above the fold.

---

# 51. HOMEPAGE INFORMATION ARCHITECTURE

First viewport:

actual compressor.

Below result/tool section:

- core benefits
- exact size compression
- formats
- batch
- related tools
- practical explanation
- links into guides

Do not add 2,000 words before the user can process a file.

Product first.

SEO content second.

---

# 52. VISUAL DESIGN

The product needs strong taste.

Avoid:

- generic SaaS gradient
- Material UI
- Bootstrap appearance
- glassmorphism everywhere
- excessive cards
- huge blobs
- cartoon mascot unless exceptionally justified
- fake testimonials
- fake usage counters

The name `compressimage.fun` can have some personality.

Interface itself should remain calm and competent.

Suggested direction:

- crisp neutral background
- almost-black text
- one energetic accent
- excellent spacing
- strong upload surface
- clean technical result data
- restrained rounding
- clear state changes

Use system fonts.

Do not load Google Fonts.

---

# 53. MOBILE

Mobile must be first-class.

A huge percentage of exact-KB/form users may arrive from phones.

Test:

320
360
375
390
430
768
1024
1440
1920 px

Mobile requirements:

- obvious uploader
- easy file picker
- camera/photo-library interoperability through normal file input
- large touch targets
- no horizontal table overflow
- batch cards instead of dense desktop table if necessary
- compare UI usable by touch
- target KB field easy to edit
- download obvious
- Delete now obvious but not visually dangerous

---

# 54. ACCESSIBILITY

Target WCAG 2.2 AA quality.

Required:

- keyboard navigation
- visible focus
- semantic buttons
- labels
- progress semantics
- status announcements
- accessible dialogs
- no color-only success/error state
- sufficient contrast
- touch targets
- drag/drop also accessible through file picker
- compare slider has accessible alternative
- processing state readable by screen reader

---

# 55. ERROR UX

Errors need useful recovery.

Examples:

Bad:

`VipsJpeg: Corrupt JPEG data`

Better:

`This JPEG appears damaged and could not be processed.`

Bad:

`413`

Better:

`This file is larger than the current 100 MB safety limit.`

Handle:

- malformed file
- unsupported format
- too many pixels
- too many frames
- too large
- processing timeout
- server queue
- target impossible
- network interruption
- expired job
- result deleted
- ZIP generation failure

Do not show stack traces.

---

# 56. QUEUE UX

The system may become busy.

Do not pretend every job starts instantly.

If all worker slots are occupied:

show:

`Your image is queued`

and position if easy/reliable.

Do not estimate completion time unless you have meaningful data.

The product should degrade by queueing rather than crashing.

No user-facing daily quota.

---

# 57. SECURITY

Uploads are untrusted.

Implement:

- random paths
- filename sanitization
- no shell string interpolation
- decoder limits
- pixel limits
- frame limits
- byte limits
- timeout
- content sniffing
- strict API schemas
- request size limits
- no public temp directory listing
- output authorization
- security headers
- read-only container root where possible
- no-new-privileges where possible

Do not run processor as root.

---

# 58. SVG SECURITY

Explicit threat model.

SVG may contain:

- scripts
- foreign objects
- external URLs
- references
- huge filters
- decompression-style resource abuse

Never render arbitrary uploaded SVG directly into application DOM.

Disable external resource fetching.

Use a trusted sanitizer or rasterizer.

Create malicious SVG tests.

---

# 59. LOGGING

Do not log:

- file contents
- Base64
- metadata values such as GPS
- full original filenames where unnecessary
- user images
- result bytes

Structured logs may contain:

- request ID
- tool ID
- input format
- output format
- coarse input-size bucket
- processing duration
- success/error category
- status code

Do not create a privacy issue through logs.

---

# 60. HEALTH AND OPERATIONS

Provide:

`/health`

Simple liveness.

Potential:

`/ready`

if useful.

Health must not depend on external services.

Expose internal safe diagnostics only if protected/not publicly sensitive.

At minimum monitor through logs:

- queue depth
- active processing
- job duration
- failures
- disk usage warnings

Do not build a full admin dashboard.

---

# 61. DISK PRESSURE

The server must not fill its disk silently.

Check available space before accepting large jobs if practical.

Configure:

`MIN_FREE_DISK_BYTES`

If storage is dangerously low:

reject new processing gracefully.

Cleanup expired jobs aggressively.

Do not delete active jobs.

---

# 62. SEO STRATEGY

Organic search is a primary distribution channel.

But do not create junk pages.

Site thematic focus:

**images and image utility workflows**

Do not branch into random calculators or text tools.

Core intent clusters:

## Image compression

generic compression

format compression

exact target file size

batch compression

## Resize

dimensions

percentage

crop

social/workflow size

## Convert

modern and legacy image formats

## Developer

Base64

Data URI

image inspection

## Privacy / metadata

EXIF

location metadata

metadata stripping

## Workflow guides

image optimization

web performance

format choices

---

# 63. SEARCH INTENT OWNERSHIP

Create:

`docs/seo-intent-map.md`

For every indexable route include:

- primary intent
- secondary intent
- page type
- canonical
- related tools
- likely user outcome

Ensure two pages do not fight for the same primary query.

Homepage owns generic:

`image compressor`

`compress image`

Do not create `/image-compressor` duplicate.

---

# 64. EXACT-KB SEO PAGES

Keep this controlled.

Six pages maximum initially:

20 KB
50 KB
100 KB
200 KB
500 KB
1 MB

These are real tools with preconfigured target.

Each page needs actual unique value.

Example distinctions:

20 KB:
explain extreme compression and why dimension reduction may become necessary.

50 KB:
explain strict upload caps and face/photo quality considerations.

100 KB:
explain common document/photo balance.

200 KB:
explain larger upload caps.

500 KB:
explain web/email use.

1 MB:
explain high-quality cap.

Do not fabricate specific government requirements unless verified from primary sources.

Avoid fake claims like:

`Official UPSC setting`

unless actually verified and maintained.

---

# 65. FORMAT SEO PAGES

Each format compressor/converter page must:

- contain the actual tool
- open preconfigured correctly
- explain the output format
- explain transparency/animation caveats
- tell user when they should use the format
- link naturally to alternatives

Do not create 100 pairwise converter pages automatically.

Implement only high-intent pairs listed in P0 plus P1 additions that are genuinely useful.

---

# 66. GUIDES

Create an initial editorial hub:

`/guides`

Start with approximately 6 to 10 exceptional guides.

Potential guides:

`/guides/how-to-compress-images-without-losing-quality`

`/guides/how-to-compress-image-to-exact-file-size`

`/guides/jpeg-vs-png-vs-webp-vs-avif`

`/guides/best-image-format-for-web`

`/guides/how-image-compression-works`

`/guides/how-to-remove-exif-metadata`

`/guides/image-size-vs-dimensions`

`/guides/base64-images-explained`

`/guides/image-optimization-for-core-web-vitals`

Only create pages that you can make genuinely useful.

Do not pad them to arbitrary word counts.

---

# 67. CONTENT QUALITY

Human-written style.

No em dashes in public copy.

Avoid:

`In today's digital world`

`Whether you're a professional or beginner`

`revolutionary`

`game-changing`

`cutting-edge`

`seamless`

`unlock`

`leverage`

`take your images to the next level`

Write like someone who actually understands image files.

Use concrete examples.

Explain tradeoffs.

Give the answer early.

---

# 68. ORIGINAL TECHNICAL VALUE

Content should draw from the actual product implementation.

This is an opportunity to create non-commodity content.

Examples:

- explain why exact size sometimes requires reducing dimensions
- show measured compression examples from your own test fixtures
- compare your own JPEG/WebP/AVIF outputs
- explain metadata stripping based on implemented behavior
- publish benchmark methodology
- explain why Base64 increases representation size
- explain browser-only versus server-processing privacy

Create:

`docs/benchmark-methodology.md`

The later hardening agent can add richer benchmark results.

---

# 69. DO NOT FABRICATE TEST DATA

Never invent:

- compression percentages
- user counts
- reviews
- benchmark speeds
- competitor limits
- rankings

If you publish a comparison number:

measure it.

Store reproducible fixtures/scripts.

---

# 70. TECHNICAL SEO

Every indexable page:

- HTTP 200
- static HTML content
- unique title
- unique meta description
- canonical
- H1
- logical headings
- Open Graph
- social metadata
- crawlable links
- semantic HTML
- no accidental noindex

Canonical origin:

`https://compressimage.fun`

Use one trailing-slash policy.

Internal links must match it.

---

# 71. ROBOTS.TXT

Create:

`/robots.txt`

Default public content should be crawlable.

Allow legitimate search crawlers.

Do not block CSS/JS necessary for rendering.

Explicitly make the site friendly to search and answer engines.

At minimum ensure nothing blocks:

- Googlebot
- Bingbot
- OAI-SearchBot
- PerplexityBot

A simple wildcard allow may already accomplish this.

Do not add SEO-theater directives.

Include sitemap URL.

Do not expose job/API paths through sitemap.

Job workspace/API routes should not be indexable.

---

# 72. LLM CRAWLABILITY

Create:

`/llms.txt`

It is for external systems that may use it.

Do not claim it improves Google ranking.

Curate links.

Include:

- site description
- main compressor
- exact-size compressor
- tools index
- format tools
- Base64/developer tools
- privacy
- guides
- GitHub repository once actual repository URL is known

Explain server retention accurately.

Do not include user-generated/uploaded URLs.

Optionally create `llms-full.txt` only if it can be generated cleanly without becoming a giant duplicate dump.

---

# 73. AEO / GEO APPROACH

Do not create weird "AI SEO" hacks.

Make pages easy to answer from by:

- clear definitions
- concise summary near top
- factual tables
- explicit tradeoffs
- descriptive headings
- stable URLs
- original measurements
- references where useful
- visible update dates only when actual content changes

Do not split every sentence into its own pseudo-answer.

Write for humans first.

---

# 74. STRUCTURED DATA

Use accurate schema.

Homepage/tool pages may use:

- WebSite
- WebApplication
- SoftwareApplication where appropriate
- BreadcrumbList

Guides:

- Article

Only use schema that accurately describes visible page content.

Do not fabricate:

- ratings
- reviews
- prices
- user counts

Do not add FAQ structured data merely because FAQ text exists.

Validate JSON-LD.

---

# 75. IMAGE SEO FOR THE SITE ITSELF

Public marketing/guide images should use:

- normal `<img>`/`picture`
- descriptive filenames
- useful alt text
- responsive dimensions
- explicit width/height
- optimized output

Generate an image sitemap if the site publishes useful indexable editorial images that benefit from it.

Do NOT add user-uploaded or processed images to any sitemap.

User files are private temporary artifacts.

---

# 76. USER JOB INDEXING

All job/workspace result surfaces:

`noindex`

Use appropriate meta/X-Robots behavior.

Do not expose jobs in:

- sitemap
- internal crawlable directory
- llms.txt
- Open Graph
- structured data

Do not allow search engines to discover processed user images.

---

# 77. SITEMAP

Generate XML sitemap from actual indexable routes.

Absolute URLs.

Canonical only.

Exclude:

- API
- jobs
- result URLs
- test routes
- internal docs
- noindex pages

Do not fake `lastmod`.

Use real content update metadata where meaningful.

---

# 78. SEARCH ENGINE VERIFICATION

Support optional environment variables:

`PUBLIC_GOOGLE_SITE_VERIFICATION`

`PUBLIC_BING_SITE_VERIFICATION`

Do not require them.

Do not commit real tokens.

---

# 79. CONTENT LINT

Create:

`npm run content:lint`

Check at minimum:

- public em dash character
- placeholders
- Lorem ipsum
- unresolved xxxxxxxxx
- TODO copy
- duplicate titles
- duplicate descriptions
- missing H1
- missing canonical
- broken internal links
- accidental noindex
- localhost references in production metadata

---

# 80. SEO CRAWL TEST

Create a production crawler test.

For every sitemap URL assert:

- returns 200
- unique title
- meta description
- canonical
- H1
- valid internal links
- no accidental noindex
- valid JSON-LD JSON

Also test:

- robots
- sitemap
- llms.txt
- 404

---

# 81. GA4 PREPARATION

Google Analytics is not required for development.

Support:

`PUBLIC_GA_MEASUREMENT_ID`

If absent:

no GA.

No errors.

No third-party request.

If present:

load using a privacy-conscious implementation appropriate to the final owner's configuration.

Do not put analytics ahead of product completion.

---

# 82. GA EVENT ABSTRACTION

Create a typed analytics layer now so the owner can enable GA later.

Never pass raw arbitrary properties.

Useful events:

`tool_open`

`file_selected`

`processing_start`

`processing_complete`

`download_result`

`download_batch`

`delete_job`

`continue_with_tool`

`target_size_selected`

`base64_encode`

`base64_decode`

Parameters must be controlled.

Potential safe parameters:

- tool_id
- input_format
- output_format
- file_count_bucket
- input_size_bucket
- output_size_bucket
- savings_bucket
- target_size_bucket
- processing_result

Do not send:

- filename
- image
- Base64
- EXIF
- dimensions if they could become unnecessarily high-cardinality
- job token
- job ID
- file URL
- free-form errors

---

# 83. REPEAT USE

No login.

Repeat value comes from:

- memorable domain
- immediate tool
- broad utility suite
- consistent UX
- easy chaining
- local preferences
- recent tool shortcuts

A returning user should be faster than a first-time user.

Possible local-only personalization:

`Recent tools`

Do not send recent-tool history to server unless needed.

Do not build notification nags.

---

# 84. TOOL SEARCH

The tools index should have instant search.

Examples:

User types:

`base64`

shows Base64 tools.

`50kb`

shows exact compression.

`heic`

shows HEIC converter.

No server search needed.

Tool registry can be typed structured data used by:

- tool index
- search
- internal linking
- sitemap generation
- llms generation where useful

This reduces duplication.

---

# 85. INTERNAL LINKING

Build deliberate contextual linking.

Compression pages:
→ exact size
→ resize
→ WebP/AVIF
→ metadata

Conversion pages:
→ compressor
→ resize
→ reverse converter

Base64 pages:
→ Base64 viewer
→ reverse converter
→ metadata where relevant

Guides:
→ relevant working tools

Do not create an enormous footer link farm.

Footer can contain category-level links.

---

# 86. RELATED TOOLS

Every tool page should have a small relevant related-tools section.

Data driven from the registry.

No arbitrary SEO stuffing.

Example:

HEIC to JPG:
- Compress JPG
- Resize image
- JPG to WebP
- Remove metadata

---

# 87. NO COMPARISON PAGES YET

Do not spend this first implementation pass creating:

`compressimage.fun vs TinyPNG`

`compressimage.fun vs iLoveIMG`

Those require ongoing external verification.

Create:

`docs/competitive-landscape.md`

with research notes if web access is available.

Comparison SEO can be added during later hardening.

---

# 88. PERFORMANCE

Static pages should be extremely fast.

Do not ship the image-processing Node runtime to the browser.

Do not ship huge editor libraries.

Client-side Base64 code can be lazy-loaded.

Tool workspace JS should be code-split.

No remote fonts.

No unnecessary animation library.

Target:

LCP <= 2.5 s
INP < 200 ms
CLS < 0.1

Aim materially better.

---

# 89. PAGE EXPERIENCE DURING UPLOAD

Large uploads should not freeze the UI.

Use streaming upload.

Show state.

Allow navigation warning only if the user has an active upload/process that would genuinely be lost.

Do not trap the user.

---

# 90. RESULT PREVIEW

Never send full huge source files back merely to preview them if you can produce a lightweight preview.

Generate thumbnails.

Preview endpoint/artifact can be:

- reasonable dimensions
- reasonable quality
- private job-protected

Do not create enormous browser memory usage.

---

# 91. DOWNLOAD HEADERS

Use safe:

`Content-Disposition`

with sanitized filename.

Correct MIME.

Disable content sniffing.

Do not expose internal path.

Support range only where meaningful.

---

# 92. CACHE POLICY

Public fingerprinted static assets:

long immutable cache.

HTML:

appropriate revalidation.

robots/sitemap/llms:

short cache.

Temporary user files:

private/no-store where appropriate.

Do not allow shared proxy caches to cache user results.

---

# 93. TEMP FILE RESPONSE SECURITY

Job/result endpoints should set:

`Cache-Control: private, no-store`

and appropriate:

`X-Robots-Tag: noindex`

Do not expose result download URLs publicly through social metadata.

---

# 94. TEST FIXTURE CORPUS

Create a safe redistributable fixture corpus or generate deterministic fixtures during tests.

Cover:

- photograph
- flat illustration
- transparent PNG
- screenshot/text
- very large dimensions
- small icon
- progressive JPEG
- WebP
- AVIF
- HEIC if license permits fixture distribution
- GIF animation
- SVG
- corrupt image

Do not commit copyrighted random internet images.

Generate fixtures programmatically or use properly licensed test assets with attribution.

---

# 95. COMPRESSION UNIT TESTS

Test:

- target already satisfied
- exact 20KB-style target
- moderate target
- impossible target
- dimension fallback
- quality search termination
- output always <= target when reported successful
- transparency preserved when required
- orientation
- metadata stripped
- metadata preserved
- bad target value
- extreme target

---

# 96. FORMAT TESTS

For each supported conversion:

- output decodes
- reported MIME correct
- extension correct
- dimensions correct
- alpha behavior correct
- animation not silently lost

Test representative conversions.

---

# 97. JOB TESTS

Test:

- create
- authorization
- invalid token
- process
- chained operation
- result
- download
- delete
- expired
- startup cleanup
- failed processing cleanup

Never allow directory enumeration.

---

# 98. SECURITY TESTS

Test:

- path traversal filename
- fake MIME
- executable renamed `.jpg`
- huge pixel header
- malformed JPEG
- malformed PNG
- malicious SVG
- oversized Base64
- excessive batch
- unsupported format
- missing auth token
- expired token

Do not attempt to fuzz the entire codec stack in this pass.

But cover the obvious application boundary.

---

# 99. PLAYWRIGHT E2E

Run against the local production-equivalent Docker composition.

At minimum:

1. Homepage loads.
2. Upload JPEG.
3. Smart compression.
4. Result displayed.
5. Result smaller for appropriate fixture.
6. Download works.
7. Exact target works.
8. 50 KB preset works.
9. Batch works.
10. ZIP works.
11. Resize works.
12. Crop works.
13. JPG to PNG.
14. PNG to JPG.
15. HEIC to JPG where supported.
16. WebP conversion.
17. AVIF conversion.
18. SVG to PNG.
19. Metadata viewer.
20. Metadata remover.
21. Image to Base64 creates no upload.
22. Base64 to image creates no upload.
23. Base64 viewer.
24. Delete now removes job.
25. Expired job state.
26. Tool chaining.
27. Mobile.
28. Keyboard.
29. No horizontal overflow.
30. No unexpected console errors.

---

# 100. PRIVACY NETWORK TEST

Create a uniquely identifiable filename/string where useful.

Verify:

Browser-only Base64 tools:

no image network upload.

Server tools:

uploads only to same-origin compressimage.fun API.

No third-party image upload.

GA when disabled:

no analytics.

User result URLs never hit third parties through prefetch/metadata.

Do not put result URLs inside analytics.

---

# 101. OUTPUT VALIDATION

Never trust that successful encoder call means valid final product.

After generating output:

read metadata with Sharp or appropriate decoder.

Confirm:

- actual format
- dimensions
- byte size
- decodability

If exact target:

confirm bytes <= target.

Only then mark success.

---

# 102. VISUAL QA

Capture screenshots from the production Docker composition running locally.

At least:

375x812
390x844
768x1024
1440x900
1920x1080

States:

- homepage
- file selected
- compression settings
- processing
- result
- compare
- batch
- exact-size
- resize
- convert
- Base64
- metadata
- tools index
- guide
- error
- queue

Actually inspect them.

Fix ugly layouts.

---

# 103. README

Public GitHub quality matters.

README:

# compressimage.fun

One strong sentence.

Then:

- Live site
- What it is
- Why it exists
- Features
- Exact-size compression
- Processing architecture
- Supported formats
- File retention/privacy
- Base64 browser-only tools
- Development
- Environment variables
- Tests
- Docker
- Architecture
- Security model
- SEO architecture
- Contributing
- License
- Third-party licenses

Do not claim production URL is live if it is not yet deployed.

Use repository-relative links.

No local machine paths.

---

# 104. PRIVACY DOCUMENT

Create:

`docs/privacy-model.md`

Explain:

## Server tools

User image
→ compressimage.fun server
→ native processor
→ temporary local storage
→ result
→ automatic deletion within configured TTL

## Browser tools

Image/Base64
→ browser only
→ no file upload

Explain logs.

Explain Delete now.

Explain analytics boundary.

---

# 105. ARCHITECTURE DOCUMENT

Create:

`docs/architecture.md`

Cover:

- static frontend
- processing API
- Nginx
- job model
- job auth
- storage
- TTL cleanup
- Sharp/libvips
- codec adapters
- exact-size optimizer
- batch
- chaining
- Base64 local tools
- SEO registry

Include a simple Mermaid diagram if GitHub renders it cleanly.

---

# 106. IMAGE ENGINE DOCUMENT

Create:

`docs/image-engine.md`

Document:

- input validation
- Sharp settings
- supported formats
- per-format output options
- exact target algorithm
- dimension fallback
- metadata behavior
- animation behavior
- known limitations
- future Jpegli benchmark opportunity
- future specialist codec opportunity

---

# 107. SEO DOCUMENTS

Create:

`docs/seo-intent-map.md`

`docs/seo-launch-checklist.md`

`docs/content-guidelines.md`

If web research is available, create:

`docs/competitive-landscape.md`

Do not fabricate search volumes.

Describe evidence qualitatively unless actual reliable volume data is available.

---

# 108. LLM / AI DISCOVERY DOCUMENT

Create:

`docs/ai-discovery.md`

Explain:

- normal SEO is foundational
- robots policy
- OAI-SearchBot access
- PerplexityBot access
- llms.txt
- why llms.txt is maintained
- that it is not treated as a Google ranking mechanism

Do not oversell GEO.

---

# 109. SEO LAUNCH CHECKLIST

Include post-local-gate manual owner tasks:

- authorize and perform the final Coolify Docker deployment
- verify HTTPS
- canonical domain
- redirect www if applicable
- Search Console
- Bing Webmaster Tools
- submit sitemap
- verify robots
- verify sitemap
- verify llms
- configure GA when desired
- monitor Core Web Vitals
- monitor queries
- inspect indexing

Do not claim code can register external webmaster accounts.

---

# 110. ENVIRONMENT EXAMPLE

Create `.env.example`.

Possible variables:

`FILE_TTL_SECONDS=14400`

`TEMP_STORAGE_DIR=/data/jobs`

`PROCESS_CONCURRENCY=2`

`SHARP_CONCURRENCY=2`

`MAX_UPLOAD_BYTES=104857600`

`MAX_BATCH_BYTES=524288000`

`MAX_BATCH_FILES=50`

`MAX_IMAGE_PIXELS=100000000`

`MAX_ANIMATION_FRAMES=500`

`PROCESS_TIMEOUT_MS=60000`

`MIN_FREE_DISK_BYTES=1073741824`

`PUBLIC_GA_MEASUREMENT_ID=`

`PUBLIC_GOOGLE_SITE_VERIFICATION=`

`PUBLIC_BING_SITE_VERIFICATION=`

Do not copy these defaults blindly.

Benchmark and choose sensible values for the actual implementation.

Document each.

---

# 111. DOCKER HARDENING

Production containers:

- non-root
- read-only root filesystem where practical
- writable mounted job volume only where required
- no unnecessary capabilities
- healthcheck
- restart policy documented
- pinned base image major versions
- multi-stage build
- minimal runtime dependencies

Do not use `latest` for important native build dependencies without thought.

---

# 112. NGINX

Configure:

- static Astro output
- `/api` proxy
- upload body limits matching app
- security headers
- compression
- caching
- no directory listing
- SPA fallback only where genuinely needed
- 404 for unknown content routes

Do not accidentally cache API responses.

---

# 113. SECURITY HEADERS

Review and implement sensible:

- X-Content-Type-Options
- Referrer-Policy
- Content-Security-Policy
- Permissions-Policy
- framing policy
- HSTS documentation/production setting

Base64 tools may use Blob URLs.

Ensure CSP supports required functionality without becoming wide open.

---

# 114. GITHUB ACTIONS

CI should run:

- install
- typecheck
- lint
- format check
- content lint
- unit tests
- build
- SEO checks

Docker build if practical.

Do not make CI dependent on proprietary credentials.

---

# 115. LICENSE AUDIT

Before selecting specialist native components, verify licenses.

Create:

`THIRD_PARTY_LICENSES.md`

or equivalent.

Document:

- Sharp
- libvips
- Oxipng if included
- SVGO/resvg if included
- ZIP library
- any other codec/tool

Do not casually introduce a dependency whose distribution obligations conflict with the intended repository licensing without documenting the consequence.

If the repository has no license requirement, choose a permissive application license such as MIT only after checking dependencies do not force a different application license.

Separate-process GPL tools require careful redistribution review.

Prefer simpler permissive components in this first pass when capabilities are comparable.

---

# 116. DEPENDENCY DISCIPLINE

Avoid giant dependency trees.

No full design framework.

No heavy CMS.

No database ORM.

No image editor framework unless it clearly earns its weight.

Every major dependency must solve a meaningful problem.

Run:

`npm audit`

Do not treat all audit output equally, but resolve production-relevant vulnerabilities.

---

# 117. CONTENT GENERATION

Write real initial public content.

No Lorem Ipsum.

No placeholder paragraphs.

Do not generate forty thin pages.

Focus on approximately:

- core tool pages
- six target-size pages
- six to ten strong guides

Later agents can expand based on Search Console.

---

# 118. INDEXABLE PAGE QUALITY GATE

Before allowing any page into sitemap:

check:

`Would this page help someone even if Google did not exist?`

If not:

improve it or remove it.

A functional preset is useful.

A keyword-swapped copy page is not.

---

# 119. TOOL PAGE TEMPLATE

Every real tool page should have:

- breadcrumb where appropriate
- H1
- immediate tool
- short relevant explanation
- tool-specific options
- result experience
- concise how-to
- meaningful format/use-case notes
- related tools
- privacy/retention clarification
- relevant guide links

Do not put a 1,000-word article above the uploader.

---

# 120. PRODUCT COPY

Tone:

- concise
- knowledgeable
- helpful
- a little playful
- never childish

Good:

`Need it under 50 KB? Tell us 50 KB.`

Good:

`Already small enough. No need to recompress it.`

Good:

`This one needs fewer pixels to reach 20 KB.`

Good:

`Your file will be deleted automatically.`

Bad:

`Unlock next-generation image optimization with our cutting-edge compression ecosystem.`

Never write that.

---

# 121. FILE RETENTION UX

Make temporary storage visible but not alarming.

Near upload or result:

`Processed securely on our server. Files auto-delete within 4 hours.`

Provide an information tooltip/link.

After result:

`Delete now`

When clicked:

delete server artifacts immediately.

Show confirmation:

`Deleted from server.`

Do not retain a result after saying it was deleted.

---

# 122. PRIVACY PAGE

Create `/privacy`.

Plain language.

Explain:

- what uploads
- what does not
- maximum retention
- deletion
- logs
- analytics if enabled later
- Base64 browser tools

No legalese wall as the only explanation.

If a Terms page is useful, create a simple one.

Do not invent a corporate entity name if none exists.

---

# 123. NO DOWNLOAD WATERMARKS

Never modify users' images to advertise the product.

No watermark.

No footer.

No tracking pixel.

Output should be the requested image only.

---

# 124. NO ARTIFICIAL LIMITS

There should be safety limits.

There should NOT be arbitrary commercial limits such as:

- 3 images/day
- download after signup
- low-quality free mode
- watermark unless paid

Safety limits should be documented as infrastructure/security boundaries.

---

# 125. QUALITY BENCHMARK HARNESS

Create:

`scripts/benchmark-compression.*`

It should run a fixture corpus through:

- JPEG
- PNG
- WebP
- AVIF

Collect:

- input bytes
- output bytes
- elapsed time
- dimensions
- quality setting

Optionally SSIM/perceptual metrics if implemented.

Output JSON/CSV/Markdown.

This harness is important for the next hardening agent.

Do not publish benchmark claims from unrepresentative fixtures as universal truths.

---

# 126. EXACT-SIZE BENCHMARK

Create benchmark cases:

20 KB
50 KB
100 KB
200 KB
500 KB
1 MB

For multiple fixture classes.

Measure:

- output bytes
- iterations
- elapsed time
- final dimensions
- quality

This will reveal whether the algorithm is actually good.

---

# 127. LOAD / CONCURRENCY TEST

Create a lightweight load test.

Simulate multiple concurrent ordinary compressions.

Test:

- queue
- CPU behavior
- memory
- response correctness

Do not perform destructive stress testing against Coolify or public production.

Run load and concurrency tests in local Docker with resource limits representative of the target VPS.

A four-core server should remain responsive when the queue grows.

---

# 128. DOCKER END-TO-END

Final pre-deployment validation must use the actual production Docker composition running locally.

Do not stop at development server.

Build clean from a fresh local state without depending on host-installed project dependencies.

Start Docker.

Verify:

- homepage
- static routes
- API
- upload
- compression
- exact target
- result download
- delete
- expiry
- Base64 no-upload
- tools
- robots
- sitemap
- llms
- security headers
- health

Do not begin Coolify deployment while any required check in this section is failing, skipped without justification or unverified.

---

# 129. LIGHTHOUSE

Run Lighthouse against the local production Docker composition.

Routes:

- `/`
- `/compress-image-to-50kb`
- `/resize-image`
- `/image-to-base64`
- one guide
- `/tools`

Report actual:

- Performance
- Accessibility
- Best Practices
- SEO
- LCP
- TBT
- CLS

Do not claim 100 unless measured.

Do not worsen UX to chase 100.

---

# 130. FINAL PRIORITY ORDER IF TOKEN/TIME BUDGET BECOMES TIGHT

If implementation budget becomes constrained, DO NOT abandon the repository half-built across 50 features.

Finish in this strict order:

## P0-A

- architecture
- Docker
- storage TTL
- upload safety
- Sharp processor
- main compressor
- exact target engine
- result/download/delete

## P0-B

- batch
- resize
- crop
- core converters
- HEIC to JPG
- Base64 suite
- metadata

## P0-C

- SEO route architecture
- exact target pages
- tools index
- sitemap
- robots
- llms
- metadata/schema
- internal links

## P0-D

- tests
- security tests
- Docker E2E
- Lighthouse
- documentation
- README

## P1

- watermark
- favicon
- additional converters
- GIF optimization
- social presets
- image-to-PDF
- color/palette tools

Never sacrifice P0 tests and deployability to implement P1 features.

---

# 131. DO NOT IMPLEMENT FAKE AI

No AI labels.

No "AI Compression" unless a real learned model is used and benchmarked.

No generated marketing claims.

Traditional codecs with excellent rate-distortion behavior are enough.

The user cares about outputs.

---

# 132. PUBLIC REPOSITORY QUALITY

The repository itself should demonstrate strong product/engineering judgment.

README and docs should explain tradeoffs:

- why server processing
- why Base64 stays browser-local
- why files expire
- why exact-size compression needs iterative encoding
- why local disk was chosen before object storage
- why no accounts
- why AI editing is deferred

Do not write these as defensive excuses.

Write them as concise architecture decisions.

---

# 133. PRODUCT CASE STUDY

Create:

`docs/product-case-study.md`

Include:

## Problem

Online image workflows are fragmented across compression, resize, format conversion and developer utilities.

## Thesis

One excellent no-login tool suite can make common image tasks immediate.

## Core product decisions

- compressor as homepage
- exact-size target
- shared workspace
- temporary server processing
- browser-local Base64
- tool chaining
- SEO intent ownership

## Infrastructure constraint

4-core / 16 GB single VPS.

Explain how the architecture uses that constraint productively.

## Tradeoffs

- native server processing versus browser processing
- temporary storage
- AVIF CPU cost
- exact-size iteration
- animations
- deferred AI

## Quality system

- fixtures
- target-size benchmarks
- Docker tests
- privacy/security tests
- accessibility
- Lighthouse

No fake adoption metrics.

---

# 134. RELEASE CHECKLIST

Create:

`docs/release-checklist.md`

Local Docker automated gate:

- build
- tests
- Docker
- health
- SEO
- compression
- TTL

Final Coolify deployment gate:

- all required local checks passed with actual evidence
- no unresolved release blockers
- immutable source revision recorded
- production environment variables and secrets enumerated without committing values
- persistent volume and permissions documented
- health-check and rollback procedure documented
- owner explicitly authorized deployment

Post-deployment manual owner steps:

- verify domain
- verify TLS
- optional GA ID
- Search Console
- Bing
- submit sitemap
- inspect real mobile upload
- process iPhone HEIC
- process Android JPEG
- test deletion
- check disk volume permissions
- monitor first production jobs

---

# 135. FINAL REPOSITORY SWEEP

Before handoff search for:

`TODO`

`FIXME`

`Lorem`

`xxxxxxxx`

`localhost`

`/Users/`

`C:\`

`example.com`

fake analytics IDs

hardcoded secrets

em dash character in public content

Review every result.

Some localhost examples in development documentation may be intentional.

Do not mechanically remove valid tests.

---

# 136. FINAL COMMAND SEQUENCE

Run actual commands appropriate to the finished repository through local Docker. Apart from Docker orchestration, repository inspection and Git, do not substitute host-installed project tooling for the containerized path.

At minimum equivalent to:

`npm ci`

`npm audit --omit=dev`

`npm run typecheck`

`npm run lint`

`npm run format:check`

`npm run content:lint`

`npm run test`

`npm run build`

Docker build.

Docker Compose up.

Docker E2E.

Compression benchmark.

Exact-size benchmark.

SEO crawl.

Accessibility.

Lighthouse.

Security boundary tests.

TTL cleanup test.

Check Git status.

Do not state that a command passed if you did not run it.

Record the exact commands, image identifiers or source revision, exit results and any justified skips. This sequence ends with a local deployment-readiness verdict; Coolify is not part of this sequence.

---

# 137. FINAL HANDOFF FORMAT

When this implementation pass is complete, return:

## Build Verdict

One of:

`CORE READY FOR HARDENING`

or:

`CORE NOT READY`

## Built

Major real functionality.

## Processing Architecture

Sharp/libvips, API, queue, storage.

## Exact Size Compression

Explain the actual algorithm and limitations.

## Supported Formats

Input/output matrix actually tested.

## Tools

List fully working tools.

Separate incomplete/deferred ones.

## Base64 Utilities

Explain browser-only behavior.

## File Privacy

Exact storage and TTL implementation.

## VPS Defaults

CPU/concurrency/storage limits.

## SEO

Indexable routes, intent map, robots, sitemap, llms, structured data.

## Tests

Exact commands and results.

## Compression Benchmarks

Actual measurements.

## Docker

Exact local build/run commands, image or source revision, service health and clean-rebuild result.

## Coolify Deployment Readiness

One of:

`READY FOR COOLIFY DEPLOYMENT`

or:

`NOT READY FOR COOLIFY DEPLOYMENT`

List every remaining blocker. Do not claim a production deployment occurred unless it was separately authorized, executed and verified.

## Lighthouse

Actual results.

## Security

Implemented protections and tested attack cases.

## Bundle Sizes

Actual frontend payload.

## Git Status

Tracked/untracked status.

## Next Agent Priorities

Rank no more than ten specific improvements for the hardening agent.

Examples may include:

- benchmark Jpegli
- stronger animation optimization
- broader HEIC tests
- deeper rate-distortion tuning
- production-representative local load testing
- search-content refinement

Only list what remains true after implementation.

## Manual Owner Steps

Only items requiring the human owner.

---

# 138. FINAL STANDARD

The product is not successful because it has 30 tools.

It is successful when somebody has one annoying image problem and compressimage.fun solves it faster than searching for another website.

A user who needs 50 KB should enter 50 KB and get the best image the system can produce under that limit.

A developer who has a Base64 blob should paste it and immediately see the image.

Someone with an iPhone HEIC should get a JPG without learning what HEIC is.

Someone optimizing a website should be able to compare JPEG, WebP and AVIF without fighting the interface.

Someone with 30 images should process 30 images, not repeat one workflow 30 times.

When one task is finished, the obvious next useful image operation should be one click away.

The domain should become remembered because it consistently solves image problems without accounts, paywalls or nonsense.

Do not build the largest tool list.

Build the image utility people keep open in a tab.
