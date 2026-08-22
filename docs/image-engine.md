# Image engine

## Input validation

Uploads stream to disk and pass through byte limits, magic-byte detection, Sharp/libvips metadata decoding, a 100-megapixel default ceiling, a 500-frame ceiling, and SVG active-content checks. Sharp uses `failOn: 'warning'`, bounded pixels, sequential reads, a controlled cache, and configured concurrency. `VIPS_BLOCK_UNTRUSTED=true` is set in the runtime container.

## Output adapters

- JPEG: progressive, optimized coding, 4:2:0 chroma, default quality 82
- PNG: compression level 9, adaptive filtering, palette only when requested by quality mode
- WebP: effort 5, smart subsampling, default quality 80
- AVIF: effort 3, 4:4:4 chroma, default quality 50

Metadata is stripped unless the operation explicitly requests preservation. Alpha is kept in PNG, WebP, and AVIF. JPEG conversion flattens alpha onto a selected background, white by default.

## Exact target algorithm

1. Normalize orientation logically.
2. If the original already satisfies the target and the format is unchanged, return it unchanged.
3. At the original dimensions, perform at most eight candidate encodes using binary search over a format-aware quality range.
4. Keep the highest quality candidate whose measured bytes are at or below the target.
5. If no useful-quality candidate fits, try a fixed sequence of 13 smaller scales and repeat the bounded search.
6. Decode the selected output, confirm format and dimensions, and confirm bytes again.

The maximum search is 112 candidate encodes. Preference is explicit: dimensions first, then the highest viable quality at those dimensions, then controlled dimension reduction. Aggressive mode lowers the minimum quality; ordinary mode defaults to 35.

## Impossible targets

If no candidate fits, the API returns `TARGET_IMPOSSIBLE` with suggestions to use WebP, reduce dimensions, or enable aggressive quality. Detailed transparent PNG files are the most likely case. The engine never pads an output to the target and never reports an oversized candidate as successful.

## Transform behavior

Resize uses Lanczos sampling and supports inside, cover, contain, fill, and outside fits. Crop validates the rectangle. Rotation follows orientation normalization. Watermark text is XML-escaped before becoming a local SVG overlay. Favicon generation produces six PNG sizes.

## Animation

Frame counts are detected. Animated sources are rejected by this pass rather than silently flattened. A future adapter must preserve timing, loop count, alpha, and every frame before animation output can be enabled.

## Known limitations and future codec work

HEIC decode depends on the production libvips build and needs broader device fixture coverage. PNG exact targeting uses libvips palette controls, not a specialist lossless optimizer. Jpegli, Oxipng, advanced animated WebP/GIF, perceptual scoring, and specialist AVIF tuning are benchmark opportunities, not hidden claims.
