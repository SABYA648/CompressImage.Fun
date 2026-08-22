# 30 / 60 / 90 day measurement plan

No baseline ranks or traffic numbers are invented. Search Console, Bing Webmaster Tools, and GA were not accessible from this implementation environment. Production HTML on 22 August 2026 already loads GA4 `G-W530RG17S3`.

## Day 0 (after Coolify deploy of this revision)

- Submit `https://compressimage.fun/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools.
- Confirm apex vs `www` 301, HTTPS, robots, llms.txt, and `/privacy` vs live GA/Umami IDs.
- Capture Inspection results for `/`, `/compress-image-to-size`, `/compress-image-to-50kb`, `/heic-to-jpg`, `/how-processing-works`.
- In GA4 (if still enabled): mark conversions for `processing_complete`, `download_result`, `delete_job` only if those events appear. Do not log filenames.

## Days 1–30

- Coverage: indexed vs excluded (duplicate without user-selected canonical, crawled currently not indexed).
- Queries: `compress image`, `compress image to 50kb`, `compress image to size`, `heic to jpg`, `image to base64`. Record impressions and clicks when GSC exists. Do not forecast.
- Page groups: homepage, exact-size custom, six presets, converters, browser tools, guides, architecture/evidence.
- Watch preset cannibalization: if `/compress-image-to-size` and `/compress-image-to-100kb` swap queries weekly, keep both but tighten first paragraphs.
- Product: exact-size success vs `TARGET_IMPOSSIBLE` from processor logs (coarse categories only).

## Days 31–60

- Compare preset pages that attract impressions but near-zero processing events. Improve the unique use-case block or consolidate later only with a 301 and a written decision.
- Answer-engine sampling: run the prompt list in `docs/aeo-evaluation-prompts.md` twice. Score citation of the processing boundary and “at or below, not padded.”
- Core Web Vitals from CrUX/GSC when available. Local Lighthouse is not a substitute for field data.

## Days 61–90

- Decide whether any preset still lacks distinct demand. Do not add 10 KB / 30 KB / 2 MB pages without GSC query evidence.
- Re-run Docker exact-size evidence on the same fixtures; publish only if settings or engine changed.
- Privacy: re-fetch production HTML. If GA or Umami IDs changed, update `/privacy` in the same release.

## What not to do

- Do not buy links, fake reviews, or directory blasts.
- Do not treat `llms.txt` as a Google ranking lever.
- Do not load-test the public VPS.
