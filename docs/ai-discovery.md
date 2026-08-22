# AI and answer-engine discovery

Normal technical SEO is the foundation: useful pages, static HTML, stable URLs, concise direct answers, accurate structured data, crawlable internal links, strong page experience, and original measured information.

Google's current generative-search guidance says ordinary Search eligibility and people-first SEO remain the requirements. It does not require special AI schema. Bing similarly emphasizes crawlable canonical URLs, clear single-topic pages, semantic headings, independently verifiable facts, and structured data that matches visible content.

The implementation follows those principles:

- Each guide answers the task near the top and then provides the relevant working tool on the same URL.
- Each tool page links to five distinct guides that explain common problems around that operation.
- Article and WebApplication JSON-LD describes visible content only. Guide schema includes the visible update date and breadcrumb path.
- Public content allows search and answer-engine crawlers. Temporary `/api/` jobs remain disallowed and return noindex response headers.
- `llms.txt` curates the product, privacy boundary, tools, and all guides. It is maintained as a convenience, not treated as a Google ranking mechanism.
- Uploaded user files, previews, job tokens, and result URLs never enter sitemaps, social metadata, structured data, or analytics.

There are no special AI keyword doors, fabricated citations, fake author credentials, automatic comparison pages, or claims that an answer engine will include the site. The site is designed to be quotable because each URL has one clear purpose and the underlying tool actually completes that purpose.

Primary references reviewed on 2026-08-23:

- [Google: Optimizing your website for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
