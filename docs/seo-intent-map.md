# SEO intent map

Canonical host: `https://compressimage.fun` (apex). `www` must 301 there.

The homepage owns generic `image compressor` / `compress image` plus the product idea “compress to the size you actually need.” There is no `/image-compressor` route.

| Route | Primary intent | Page type | Canonical | Decision | Outcome |
| --- | --- | --- | --- | --- | --- |
| `/` | image compressor; compress to needed size | Tool | `/` | Keep, reposition | Compress one or many; Exact Size available in the workspace |
| `/compress-image-to-size` | any custom KB/MB cap | Tool | Self | Keep | Type any cap; owner of non-preset sizes |
| `/compress-image-to-{20,50,100,200,500}kb`, `/compress-image-to-1mb` | named transactional cap | Preset tool | Self | Keep, do not add more | Prefill only that cap; unique use-case copy; link to custom tool |
| `/compress-{jpeg,png,webp,avif}` | compress named format | Format tool | Self | Keep | Format-aware modes |
| `/batch-compress-images` | batch compressor, no signup | Tool | Self | Keep | Group + ZIP |
| `/resize-image` | pixel resize | Tool | Self | Keep | Width/height/fit |
| `/crop-image` | crop | Tool | Self | Keep | Rectangle crop |
| `/rotate-image` | rotate | Tool | Self | Keep | 90/180/270 |
| `/convert-image` | generic converter | Tool | Self | Keep | Choose output format |
| Named converter routes | source-to-target | Format tool | Self | Keep current pairs only | No new programmatic pairs |
| `/image-to-pdf` | images to one PDF | Browser tool | Self | Keep | Local assembly |
| `/image-to-base64` | image to Base64 | Browser tool | Self | Keep | Local encode |
| `/base64-to-image` | Base64 to image | Browser tool | Self | Keep | Local decode |
| `/base64-image-viewer` | view Base64 | Browser tool | Self | Keep | Debug paste |
| `/image-to-data-uri` | Data URI | Browser tool | Self | Keep | Wrappers |
| `/image-metadata` | inspect EXIF | Tool | Self | Keep | Server inspect |
| `/remove-image-metadata` | strip EXIF | Tool | Self | Keep | Clean copy |
| `/passport-photo-resizer` | form-photo pixels/KB | Preparation | Self | Keep | No compliance claim |
| `/photo-signature-resizer` | photo + signature KB | Preparation | Self | Keep | Custom numbers only |
| `/image-color-picker` | pick HEX from image | Browser tool | Self | Keep | Local canvas |
| `/favicon-generator` | favicon package | Tool | Self | Keep | ICO/PNG/snippet |
| `/watermark-image` | user text watermark | Tool | Self | Keep | No product mark |
| `/tools` | directory | Index | Self | Keep | Search registry |
| `/guides` | guide hub | Index | Self | Keep | Editorial list |
| `/guides/*` | named question | Article | Self | Keep; two added | Workflow answers |
| `/how-processing-works` | browser vs server | Article | Self | New | Data-flow diagram |
| `/compression-tests` | measured exact-size evidence | Article | Self | New | Fixture table |
| `/privacy` | uploads, TTL, analytics | Policy | Self | Keep, truth-fixed | Matches implementation |

Cannibalization rules:

- `/` does not rank-chase “compress to 50 KB”; those six URLs do.
- `/compress-image-to-size` owns arbitrary numbers (`73 KB`, `1.4 MB`).
- Preset pages must not clone each other’s first paragraph.
- `/resize-image` owns pixels; form-photo tools own “enter the authority’s numbers.”
- `/how-processing-works` owns the architecture explanation; `/privacy` owns the legal/retention wording.
- `/compression-tests` owns published measurements; guides explain the method without inventing extra numbers.

User jobs, API routes, previews, downloads, and test routes stay out of the sitemap and keep noindex at the proxy.
