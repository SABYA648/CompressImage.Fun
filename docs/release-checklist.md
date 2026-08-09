# Release checklist

Measurements and commands behind every checked line are in `docs/test-evidence.md`.

## Automated and verified

- [x] Fresh `npm ci`, type check, lint, format check, and content lint
- [x] Unit, security, and engine tests: 9 passing
- [x] Static build: 52 pages
- [x] Health and readiness endpoints respond correctly
- [x] Smart, exact target, resize, convert, metadata, favicon, passport, signature, Base64, PDF, colour picker, chaining, download, and Delete now flows
- [x] Every processed result decoded and checked against its declared format
- [x] AVIF encode and decode, including keep-original and alpha
- [x] Real HEVC-coded HEIC converted to JPEG, WebP, and an exact size
- [x] Exact-size never reports success above target, and impossible targets return a friendly 422
- [x] Invalid token, missing token, malformed header, random job id, traversal job id
- [x] Fake MIME, corrupt file, unsafe SVG, and traversal filename rejected
- [x] TTL expiry, periodic sweep, and startup cleanup of an already expired job
- [x] Jobs survive a processor restart on the same storage directory
- [x] Delete now removes the job directory from disk, not just from the UI
- [x] Temporary results carry `private, no-store` and `nosniff`
- [x] SEO crawl over 51 canonical URLs, sitemap, robots, and llms.txt
- [x] Playwright Chromium: 45 specs including keyboard, mobile widths, and browser-local privacy
- [x] Browser-local tools confirmed to make zero API requests
- [x] Compression and exact-size benchmarks recorded
- [x] Eight-job mixed concurrency probe
- [x] Lighthouse on six routes: performance, accessibility, and SEO all 100
- [x] Repository sweep for developer paths, placeholders, and stray files
- [x] Production Docker image build (`docker compose build --pull`)
- [x] Compose startup: `processor` and `web` healthy; `e2e` not started
- [x] Live Nginx security headers on HTML, static assets, and `/api/`
- [x] HEIC decoder verified inside the real processor container
- [x] Production Compose publishes no host port; local overlay is localhost-only

## Remaining non-blockers

- [ ] Firefox and WebKit E2E. Only Chromium was exercised in this environment.

## Owner actions after deploy

- [ ] Create the Coolify application from `docker-compose.yml` (Build Pack: Docker Compose, Base Directory `/`, Compose Location `/docker-compose.yml`)
- [ ] Leave `processor` and `e2e` domains blank; set `web` domain to `https://compressimage.fun:8080` (internal target port)
- [ ] Confirm the public URL remains `https://compressimage.fun` (no `:8080` in the browser)
- [ ] Confirm Compose volume `jobs` → `processor:/data/jobs`
- [ ] Set the health check path to `/health` on `web`
- [ ] Leave the QA profile disabled
- [ ] Deploy and confirm both services report healthy
- [ ] Open the homepage and compress one real phone photo
- [ ] Upload one real iPhone HEIC and confirm it converts
- [ ] Use Delete now and confirm the result link stops working
- [ ] Add `PUBLIC_GA_MEASUREMENT_ID` later if analytics is wanted, then rebuild
- [ ] Verify the domain in Google Search Console and Bing Webmaster Tools
- [ ] Submit `https://compressimage.fun/sitemap-index.xml` to both
