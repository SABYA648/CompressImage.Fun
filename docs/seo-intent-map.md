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
