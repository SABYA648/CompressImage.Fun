# SEO launch checklist

## Local gate

- Build static pages and crawl every sitemap URL through local production Docker.
- Confirm unique title, description, canonical, H1, JSON-LD, and crawlable internal links.
- Confirm robots.txt, sitemap index, page sitemap, llms.txt, and real 404 behavior.
- Confirm user job and API responses are private, no-store, and noindex.
- Run content lint for public em dashes, placeholders, duplicate metadata, and localhost leaks.
- Run Lighthouse on the six required route classes.

## Post-local-gate owner tasks

- Explicitly authorize the final Coolify deployment.
- Verify HTTPS, the canonical apex domain, and a deliberate www redirect.
- Add optional Google and Bing verification tokens through environment configuration.
- Register Search Console and Bing Webmaster Tools, then submit `sitemap-index.xml`.
- Fetch robots.txt, sitemap, and llms.txt from the public domain.
- Add GA only when desired and verify private values stay absent from events.
- Monitor indexing, queries, crawl errors, and Core Web Vitals.
