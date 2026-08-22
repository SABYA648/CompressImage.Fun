# SEO / GEO research log

Checked 22 August 2026. No keyword volumes, ranks, or traffic figures are claimed. Search Console, Bing Webmaster Tools, and production server logs were not available in this environment.

## Live compressimage.fun

- `https://compressimage.fun/` HTTP 200, canonical apex, GA4 `G-W530RG17S3` with `anonymize_ip` and `allow_google_signals: false`. Last-Modified `Sun, 09 Aug 2026 15:58:41 GMT`.
- `https://www.compressimage.fun/` HTTP 200, same ETag as apex (duplicate host). Canonical already pointed at apex. No 301.
- `/privacy` described analytics as off unless configured, which did not match the live GA snippet.
- Production CSP (that build) allowed Google Analytics, not Umami. Repository main had later hardcoded Umami.

## Google Search Central (22 Aug 2026)

- [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): unique titles, unique descriptions, one URL per content, canonicalize duplicates.
- [Title links](https://developers.google.com/search/docs/appearance/title-link): descriptive titles; Google may rewrite.
- [Structured data intro](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data): mark up visible content only.
- [FAQ rich results](https://developers.google.com/search/docs/appearance/structured-data/faqpage) and [What's new](https://developers.google.com/search/updates): FAQ rich results limited to well-known government and health sites. This site uses visible Q&A HTML without FAQPage schema.
- [QAPage](https://developers.google.com/search/docs/appearance/structured-data/qapage): not used (no user-submitted answers).

## Format primary docs (22 Aug 2026)

- [MDN image types](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types): JPEG lossy photos; PNG lossless pixels + alpha; WebP/AVIF still + animation; GIF animation; SVG vector.
- Product still rejects animated GIF/WebP rather than flattening (engine behavior, not an MDN claim).

## Competitors (official pages, 22 Aug 2026)

Statements below are from the cited pages only. Limits and prices change; do not copy them into marketing as ours.

| Product | Official page checked | Observed positioning |
| --- | --- | --- |
| TinyPNG | https://tinypng.com/ | Smart WebP/PNG/JPEG compression; web dropzone “Up to 20 images, max 5 MB each”; API page “500 Free compressions each month.” Uploads. |
| Squoosh | https://squoosh.app/ | Local processing: “Images never leave your device.” Single-image lab, not a batch form-photo suite. |
| iLoveIMG | https://www.iloveimg.com/compress-image | Broad compress UI; Drive/Dropbox; server processing implied by upload progress. Free-tier limits not fully captured (page was interaction-heavy). |
| Adobe Express | https://www.adobe.com/express/feature/image/compress | Fetch timed out this run; not used as a source for limits. |
| CloudConvert | https://cloudconvert.com/image-converter | Broad conversion including PNG, JPG, GIF, WEBP, HEIC; options for resolution, quality, file size. |
| FreeConvert | https://freeconvert.com/image-compressor | Upload compressor; “Max file size 1GB. Upgrade for more”; claims “up to 80%”; files deleted after a few hours; signup upsell. |
| ShortPixel | https://shortpixel.com/online-image-compression | Lossy/Glossy/Lossless; “maximum 10Mb” without login; WebP/AVIF generation. |
| ShrinkTo (live SERP) | https://shrinkto.com/ | Browser WASM, exact KB, “no upload.” Category competitor for exact-size language. |
| UtiloKit | https://utilokit.com/tools/image-compressor | In-browser bulk + target size; contrasts TinyPNG/iLoveIMG as uploaders. |
| CompressTo20KB | https://www.compressto20kb.com/vs/iloveimg | Exact KB + government presets; claims iLoveIMG cannot target exact KB. Presets are a trust risk we refuse to copy. |
| ImageConverterTool / compress-to-size | https://github.com/coderaviverma/compress-to-size | Documents quality binary search then downscale; in-browser. |

TinyPNG, iLoveIMG, CloudConvert, FreeConvert, and ShortPixel pages describe or imply **upload**. Squoosh, ShrinkTo, and several 2026 SERP tools describe **local codecs**. compressimage.fun is the hybrid: native server quality search for hard jobs, labeled browser tools for Base64/PDF/color.

Official pages for Compressor.io, Image2KB, ImgKilo, ImgTweak, and Scalir were not loaded successfully in this pass. They remain named watchlist entries, not evidence.

## User language in live results (qualitative)

Queries and snippets emphasize: “exact KB,” “20 KB / 50 KB / 100 KB,” “no upload,” “form / government / exam photo,” “batch,” “no signup.” We will compete on exact-size methodology and honesty, not on fake compliance presets or no-upload claims for server jobs.
