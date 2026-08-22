# SEO intent map

The homepage owns `image compressor` and `compress image`. There is intentionally no competing `/image-compressor` route.

| Route group                                                          | Primary intent                  | Page type        | Canonical | Outcome                                                 |
| -------------------------------------------------------------------- | ------------------------------- | ---------------- | --------- | ------------------------------------------------------- |
| `/`                                                                  | image compressor                | Tool             | `/`       | Compress one or many images                             |
| `/compress-image-to-size`                                            | compress image to specific size | Tool             | Self      | Set any KB or MB cap                                    |
| `/compress-image-to-{20,50,100,200,500}kb`, `/compress-image-to-1mb` | selected exact-size target      | Preset tool      | Self      | Open exact engine prefilled with that cap               |
| `/compress-{jpeg,png,webp,avif}`                                     | compress named format           | Format tool      | Self      | Use format-aware compression                            |
| `/batch-compress-images`                                             | batch image compressor          | Tool             | Self      | Process a group and download ZIP                        |
| `/resize-image`                                                      | resize image                    | Tool             | Self      | Change pixel dimensions                                 |
| `/crop-image`                                                        | crop image                      | Tool             | Self      | Keep a selected rectangle                               |
| `/rotate-image`                                                      | rotate image                    | Tool             | Self      | Apply 90, 180, or 270 degrees                           |
| `/convert-image`                                                     | image converter                 | Tool             | Self      | Choose an output format                                 |
| Named converter routes                                               | source-to-target conversion     | Format tool      | Self      | Open the converter preconfigured                        |
| `/image-to-pdf`                                                      | image to PDF                    | Browser tool     | Self      | Reorder images and download one PDF                     |
| `/image-to-base64`                                                   | image to Base64                 | Browser tool     | Self      | Encode locally                                          |
| `/base64-to-image`                                                   | Base64 to image                 | Browser tool     | Self      | Decode and download locally                             |
| `/base64-image-viewer`                                               | view Base64 image               | Browser tool     | Self      | Debug pasted data locally                               |
| `/image-to-data-uri`                                                 | image to Data URI               | Browser tool     | Self      | Produce paste-ready wrappers                            |
| `/image-metadata`                                                    | image metadata viewer           | Tool             | Self      | Inspect file and EXIF fields                            |
| `/remove-image-metadata`                                             | remove EXIF metadata            | Tool             | Self      | Download a cleaned copy                                 |
| `/passport-photo-resizer`                                            | passport and form photo resizer | Preparation tool | Self      | Enter custom official pixels, DPI, format, and byte cap |
| `/photo-signature-resizer`                                           | photo and signature resizer     | Preparation tool | Self      | Prepare custom photo/signature dimensions and KB        |
| `/image-color-picker`                                                | image color picker              | Browser tool     | Self      | Pick HEX/RGB/HSL and extract a local palette            |
| `/favicon-generator`                                                 | favicon generator               | Tool             | Self      | Produce common PNG icon sizes                           |
| `/watermark-image`                                                   | watermark image                 | Tool             | Self      | Add the user's text mark                                |
| `/tools`                                                             | image tools                     | Index            | Self      | Search the registry                                     |
| `/guides/*`                                                          | named educational question      | Article          | Self      | Understand a workflow and open a related tool           |
| `/about`                                                             | about compressimage.fun         | Static Page      | Self      | Understand ownership, mission, and architecture         |
| `/methodology/compression`                                           | compression methodology         | Static Page      | Self      | Understand exact-size search, codecs, and benchmarks    |
| `/privacy`                                                           | compressimage.fun privacy       | Policy           | Self      | Understand upload and retention boundaries              |

Each tool page owns one primary outcome and links only to a short related set. User jobs, API routes, previews, downloads, test routes, and internal docs are excluded from the sitemap and receive noindex response headers at the proxy.

Cannibalization boundaries: `/resize-image` owns generic pixel resizing; `/passport-photo-resizer` owns form-photo preparation using user-supplied official requirements; `/photo-signature-resizer` owns the dual photo/signature workflow. `/compress-image-to-size` owns arbitrary byte limits while the six preset routes own only their named transactional target.

## Editorial problem clusters

The guide library contains 30 distinct, indexable problem stories. Selection is based on recognizable user tasks and the product's verified capabilities. No numeric search-volume claim is published without first-party query data. Search Console and Bing Webmaster Tools should decide which cluster expands next.

| Cluster              | Representative guide owners                                                                                                                                                             | Tool outcome                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Compression quality  | `/guides/how-to-compress-images-without-losing-quality`, `/guides/how-to-reduce-jpg-file-size`, `/guides/why-is-my-image-file-still-too-large`                                          | Smart, format, resize, and exact-size compression                  |
| Exact KB and forms   | `/guides/how-to-compress-image-to-exact-file-size`, `/guides/how-to-resize-a-passport-or-form-photo`, `/guides/how-to-resize-a-signature-for-an-online-form`                            | Exact target, passport/form preparation, and signature preparation |
| Batch and sharing    | `/guides/how-to-batch-compress-multiple-images`, `/guides/how-to-compress-images-for-email`                                                                                             | Batch compression and ZIP download                                 |
| Format decisions     | `/guides/jpeg-vs-png-vs-webp-vs-avif`, `/guides/best-image-format-for-web`, `/guides/heic-explained-and-when-to-convert`                                                                | Format-aware conversion and compression                            |
| Specific conversion  | `/guides/how-to-convert-png-to-jpg`, `/guides/how-to-convert-jpg-to-webp-for-the-web`, `/guides/how-to-open-and-convert-a-webp-image`, `/guides/how-to-convert-svg-to-png-safely`       | Preconfigured working converters                                   |
| Resize and geometry  | `/guides/how-to-resize-an-image-without-stretching`, `/guides/how-to-rotate-and-crop-a-phone-photo`, `/guides/image-size-vs-dimensions`                                                 | Resize, crop, and rotate workspaces                                |
| Developer images     | `/guides/base64-images-explained`, `/guides/how-to-embed-a-base64-image-in-html-and-css`, `/guides/how-to-decode-base64-to-an-image`                                                    | Browser-only Base64 and Data URI tools                             |
| Privacy and metadata | `/guides/how-to-remove-exif-metadata`, `/guides/how-to-check-if-a-photo-has-location-data`                                                                                              | Metadata inspection and removal                                    |
| Web performance      | `/guides/image-optimization-for-core-web-vitals`, `/guides/how-to-compress-png-with-transparency`                                                                                       | Responsive resize and web-format workflows                         |
| Creation workflows   | `/guides/how-to-turn-images-into-one-pdf`, `/guides/how-to-add-a-text-watermark-to-a-photo`, `/guides/how-to-make-a-favicon-from-an-image`, `/guides/how-to-pick-a-color-from-an-image` | PDF, watermark, favicon, and color tools                           |

Every guide renders the most relevant full working tool immediately after its answer summary. Every tool page resolves five distinct stories, preferring direct tool matches and then a controlled category cluster. `scripts/seo-crawl.mjs` fails the release gate if a tool exposes fewer than five stories, if a guide lacks its embedded tool, or if the 404 lacks its noindex recovery workspace.
