# SEO, AEO, and GEO execution report

Updated 2026-08-23. This report describes the current repository implementation and measured local-Docker evidence. It does not claim rankings, traffic, citation inclusion, or search volume that has not been observed in first-party search data.

## Outcome

The site is organized around useful, indexable task pages instead of generated keyword doors:

- 38 working image tools, including the homepage compressor
- 30 substantive problem-solving guides
- exactly five contextually selected guide stories on every tool page
- the relevant complete tool embedded inside every guide
- a useful, animated, noindex 404 that includes the complete compressor
- 73 canonical URLs in the page sitemap
- an image sitemap, guide RSS feed, robots policy, and curated `llms.txt`
- visible-content-matched WebApplication, Article, Organization, WebSite, and breadcrumb structured data
- privacy-filtered analytics that never sends filenames, image content, Base64, colors, job tokens, URLs, dimensions, or raw errors

## Intent ownership

The homepage owns generic image-compression intent. `/compress-image-to-size` owns arbitrary KB or MB targets. Six preset pages own only their named caps. Each remaining tool route owns one concrete outcome, such as resizing pixels, converting HEIC to JPEG, removing metadata, preparing a form photo, creating a favicon, or encoding Base64 locally.

The 30 guides cover recognizable user jobs across these clusters:

| Cluster                | Example questions answered                                                  | Working outcome on the same page         |
| ---------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| Compression quality    | reduce JPG size, preserve PNG transparency, compress for email, batch files | compressor or exact-size workspace       |
| Exact limits and forms | hit a KB cap, resize a passport/form photo, prepare a signature             | exact-size or form preparation workspace |
| Format decisions       | JPEG vs PNG vs WebP vs AVIF, open HEIC/WebP, convert SVG safely             | matching converter                       |
| Geometry               | resize without stretching, rotate and crop a phone photo                    | resize, crop, or rotate workspace        |
| Developer images       | encode, embed, inspect, or decode Base64/Data URIs                          | browser-only Base64 workspace            |
| Privacy                | inspect location metadata and remove EXIF                                   | metadata workspace                       |
| Web performance        | image choices for Core Web Vitals                                           | resize, compress, or convert workspace   |
| Creation               | images to PDF, watermark, favicon, color sampling                           | matching creation workspace              |

The source-of-truth mapping and cannibalization boundaries are in `docs/seo-intent-map.md`. Story selection first uses direct tool relationships, then a controlled category cluster. The SEO crawl fails if any tool has fewer than five distinct stories or any guide lacks a contextual tool.

## People-first page design

Every guide starts with a direct answer summary, then offers the working tool before the longer explanation. This lets a visitor act immediately without turning the article into an intrusive modal or a thin preamble.

Each tool page includes:

- a unique title, description, canonical, H1, and task-specific lead
- the functional workspace above the explanatory sections
- accurate constraints, privacy behavior, and format notes
- five related problem stories
- a small, deliberate related-tool set for the next likely task

The six exact-size presets remain useful because each opens a real preconfigured cap and explains the tradeoff at that cap. They do not promise pixel-perfect quality or manufacture arbitrary numeric variants.

## Search and answer-engine surfaces

`SiteLayout.astro` emits:

- canonical URL
- index/follow directives with unrestricted image previews and snippets on public pages
- noindex/follow/noarchive on the useful 404
- Open Graph and Twitter metadata
- WebSite and Organization JSON-LD
- WebApplication JSON-LD for tools
- Article and breadcrumb JSON-LD for guides
- RSS and `llms.txt` discovery links

The crawlable support files are:

- `/sitemap-index.xml`
- `/sitemap-pages.xml`
- `/sitemap-images.xml`
- `/robots.txt`
- `/guides/feed.xml`
- `/llms.txt`

Temporary API jobs, downloads, previews, tokens, and test paths are absent from every discovery surface. `/api/` responses receive private no-store caching and noindex headers at Nginx.

`llms.txt` is a convenience catalog, not a ranking mechanism. No special AI schema, fake author identity, fabricated quotation, or guaranteed answer-engine inclusion is claimed.

## Visual and performance implementation

The interface uses one coherent system across home, tools, guides, support pages, and 404: a restrained blue/red palette, editorial typography, soft spatial depth, measured motion, strong focus states, and a generated image-orbit illustration. Motion respects `prefers-reduced-motion`.

The final local-Docker visual suite captures 16 states from 375 to 1920 pixels, including selected files, processed results, errors, tool filtering, an embedded guide tool, and the useful 404. All returned the expected status with no horizontal overflow.

Measured mobile Lighthouse results against local production Docker:

| Route                                              | Performance | Accessibility | Best Practices | SEO |      LCP |    TBT | CLS |
| -------------------------------------------------- | ----------: | ------------: | -------------: | --: | -------: | -----: | --: |
| `/`                                                |         100 |           100 |             78 | 100 | 1,502 ms |   0 ms |   0 |
| `/compress-image-to-50kb`                          |          99 |           100 |             78 | 100 | 1,826 ms |  84 ms |   0 |
| `/resize-image`                                    |         100 |           100 |             78 | 100 | 1,353 ms |  85 ms |   0 |
| `/image-to-base64`                                 |          87 |           100 |             78 | 100 | 2,124 ms | 486 ms |   0 |
| `/guides/how-to-compress-image-to-exact-file-size` |          99 |           100 |             78 | 100 | 1,806 ms |  23 ms |   0 |
| `/tools`                                           |         100 |           100 |             78 | 100 |   901 ms |  24 ms |   0 |

Best Practices is limited by the production-equivalent local endpoint using HTTP and not redirecting HTTP to HTTPS. TLS and HTTP-to-HTTPS redirection belong to the separately authorized Coolify/domain phase. The score is not presented as 100.

The browser-local Base64 workspace remains the largest measured interaction bundle and is the clearest future performance target. It still meets the product privacy boundary by making no processing API upload.

## Analytics and measurement boundary

GA loads only when a syntactically valid `PUBLIC_GA_MEASUREMENT_ID` is supplied. Umami remains the optional first-party-style event surface already configured by the product.

Programmatic events pass through an allowlist and bucketing layer. Safe examples include tool id, input/output format, operation mode, count bucket, byte-size bucket, savings bucket, quality bucket, and broad error category. Raw filenames, MIME strings supplied by users, image dimensions, colors, metadata, Base64 values, job identifiers, capability tokens, arbitrary search text, and error messages are discarded.

The following first-party measurements should determine the next editorial expansion after launch:

- Search Console and Bing impressions, clicks, position, and query-to-page fit
- tool start, completion, and failure category by tool id
- guide-to-tool starts and successful completions
- exact-target bucket and success rate
- page-level Core Web Vitals field data
- crawl, index, and canonical coverage

## Local verification snapshot

The production-equivalent local Docker gate currently records:

- zero production dependency vulnerabilities
- 74 static build routes and 73 canonical crawl URLs
- unique metadata, one H1, canonical, Open Graph, and valid JSON-LD on every sitemap page
- 54 of 54 Chromium end-to-end scenarios
- 31 of 31 dedicated accessibility/responsive scenarios
- 16 of 16 visual states with expected status and no overflow
- five stories on all 38 tools and an embedded working tool on all 30 guides

Exact commands, final clean-build image identifiers, benchmarks, security/TTL evidence, and the Coolify-readiness verdict are recorded in `docs/test-evidence.md`.

## Post-launch owner actions

These are not performed during local release validation:

1. Verify the production domain and TLS after an explicitly authorized deployment.
2. Add the site in Google Search Console and Bing Webmaster Tools.
3. Submit `https://compressimage.fun/sitemap-index.xml` to both systems.
4. Inspect indexing, canonical selection, crawl errors, and structured-data reports.
5. Review first-party queries before adding or consolidating guide topics.
6. Monitor field Core Web Vitals, especially interaction cost on browser-local tools.
7. Earn references with genuinely useful measured guides; do not automate link placement or manufacture endorsements.

## Primary guidance reviewed

- [Google: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: Optimizing your website for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [Bing: robots.txt](https://www.bing.com/webmasters/help/how-to-create-a-robots-txt-file-cb7c31ec)
- [Bing: sitemaps](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed)
