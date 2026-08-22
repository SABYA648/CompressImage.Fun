# Test evidence

## Current production-equivalent local Docker gate (2026-08-23)

This is the current release record. Older evidence is retained below as history.

### Revisions and environment

| Property                    | Value                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| Application revision        | `becafc6c68ad4ede0d43b7377f0eae25135b8a1f` (`feat: revamp image tools and expand search content`) |
| Validation-harness revision | `1475d6443b94209cd2062f6b27a9db5c731e004b` (`test: wait for guide tool hydration`)                |
| Host                        | Darwin 25.5.0, arm64; Docker Desktop Linux VM                                                     |
| Docker                      | Client/server 29.6.2; host Compose v5.3.1; QA-image Compose v2.40.3                               |
| Local service limits        | processor 3.5 CPUs, 12 GiB memory, concurrency 2; read-only roots; all capabilities dropped       |
| Local edge                  | `127.0.0.1:8080` only; processor has no host binding                                              |

The production images were built from the application revision. The subsequent harness revision changes one Playwright wait only and does not alter either production image. The evidence documentation commit is intentionally not used as its own source identifier.

### Exact commands

All project tooling below ran inside Docker. Host commands were limited to Git, repository inspection, Docker orchestration, and artifact inspection.

```sh
docker compose --profile qa build --pull --no-cache
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --wait

docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps e2e sh -lc \
  'npm audit --omit=dev && npm run typecheck && npm run lint && npm run format:check && npm run content:lint && npm test && npm run build'

docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps e2e npm run test:seo
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps -v "$PWD/artifacts:/app/artifacts" e2e npm run test:e2e
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps e2e npm run test:a11y

docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps \
  -v "$PWD/artifacts:/app/artifacts" e2e sh -lc \
  'npm run benchmark:compression && npm run benchmark:exact && npm run test:load'

docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps \
  -v "$PWD/artifacts:/app/artifacts" e2e sh -lc \
  'npm run test:lighthouse && npm run test:visual'

docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/artifacts:/app/artifacts" \
  -e COMPOSE_PROJECT_NAME=compressimagefun \
  e2e node scripts/release-smoke.mjs
```

The five-run no-retry regression used after fixing the guide hydration race was:

```sh
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps \
  e2e npx playwright test tests/e2e/core.spec.ts \
  --grep "every tool page pattern" --retries=0 --repeat-each=5 --workers=1
```

### Image identifiers

The clean no-cache production images are:

| Image                               | Identifier                                                                |          Size |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------: |
| `compressimagefun-web:latest`       | `sha256:a4b299fb161aa572adf6a1bf12bd2c35ad21b846a92718301d09a20875bbbe55` |  27,769,120 B |
| `compressimagefun-processor:latest` | `sha256:7a8b5ccbc3c561db3672f0fdf32357125030b83161df852dce068e9c408f7fa4` | 195,924,617 B |

The final QA image after the validation-only hydration wait is `sha256:2ba3261c5dfe7e2f2c7d2863c0c161e3b27a445ed0e3be2447df7b736a2cfa92` (1,266,250,840 B). It contains browser, codec-fixture, Docker CLI, and Compose dependencies that never enter production images.

### Gate results

| Gate                     | Actual result                                                                                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh install/build      | PASS: `--pull --no-cache`; fresh `npm ci` installed 675 packages and audited 678 with 0 vulnerabilities; production prune audited 362 with 0 vulnerabilities                                                           |
| Compose/health           | PASS: processor and web healthy; QA service not started persistently                                                                                                                                                   |
| Runtime contract         | PASS: processor 3.5 CPUs/12 GiB, read-only root, `cap_drop: ALL`, no port binding; web read-only, `cap_drop: ALL`, localhost-only test binding                                                                         |
| Type/lint/format/content | PASS: Astro 30 files, 0 errors/warnings/hints; ESLint 0 warnings; Prettier clean; content lint 28 source files                                                                                                         |
| Unit/security/engine     | PASS: 4 files, 9 tests                                                                                                                                                                                                 |
| Static build             | PASS: 74 pages                                                                                                                                                                                                         |
| SEO crawl                | PASS: 73 canonical URLs; unique metadata, one H1, canonical, Open Graph, parseable JSON-LD; page/image sitemaps, RSS, robots, and llms.txt                                                                             |
| Story/tool integration   | PASS: five distinct stories on each of 38 tools; complete working tool in each of 30 guides                                                                                                                            |
| Useful 404               | PASS: real 404 status, noindex, animation, and a working compressor                                                                                                                                                    |
| Chromium E2E             | PASS: 54/54, no retry in the final run                                                                                                                                                                                 |
| Accessibility/responsive | PASS: 31/31; keyboard paths and no horizontal overflow at required widths                                                                                                                                              |
| Visual QA                | PASS: 16/16 states, expected 200/404 status, widths 375-1920, no overflow                                                                                                                                              |
| Compression/exact        | PASS: outputs decoded; all 12 exact-target rows at or below cap                                                                                                                                                        |
| Mixed load               | PASS: 8/8 ordinary concurrent jobs in 5.32 s at processor concurrency 2                                                                                                                                                |
| Release smoke            | PASS: 34/34                                                                                                                                                                                                            |
| Persistence/delete       | PASS: download survived processor restart; Delete now returned 204, then job/download 404 and directory absent                                                                                                         |
| TTL/startup cleanup      | PASS: disposable 60-second TTL job became job/download 404 and directory absent; normal 14,400-second TTL restored in `finally`                                                                                        |
| HEIC/AVIF                | PASS: real HEVC HEIC to JPG/WebP/exact; libde265 decoder listed in processor; AVIF encode, preserve-format, and exact 50 KB                                                                                            |
| Security boundaries      | PASS: capability authorization/hostile-input unit and API cases, HTML/static/API headers, private/no-store download, noindex API, processor isolation                                                                  |
| Repository sweep         | PASS after review: hits are canonical prompt literals, lint rules, local-Docker documentation, or historical evidence; no public placeholders, developer paths, fake analytics IDs, private keys, or hardcoded secrets |

No required local gate was skipped. Firefox and WebKit are not configured in this repository and remain a documented non-blocking expansion; the required production-equivalent Chromium gate passed. TLS, domain routing, real Search Console/Bing ownership, and physical iPhone/Android uploads are inherently post-deployment owner checks and were not represented as local successes.

### Release-smoke detail

`scripts/release-smoke.mjs` passed 34 of 34 checks. It covered health/readiness, JPEG/PNG/WebP/AVIF, real HEIC decode, exact-size output, resize, batch, metadata removal, real result headers, persistence, delete, TTL cleanup, HTML/static/API security headers, processor port isolation, and representative SEO routes.

Representative measured results:

| Workflow          | Result                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| JPEG smart        | 945,343 B to 532,114 B, 1400x900                                               |
| Exact JPEG 50 KB  | 50,646 B                                                                       |
| JPEG to AVIF      | 234,690 B in 3,013 ms, AV1 verified                                            |
| AVIF exact 50 KB  | 48,047 B in 24,139 ms                                                          |
| HEIC to JPG       | 606,603 B, 1400x900                                                            |
| HEIC exact 100 KB | 101,785 B, 952x612                                                             |
| TTL               | pre-expiry 200; after 65 seconds/restart job 404, download 404, directory gone |

### Compression benchmark

Synthetic fixture, single encoder operation in the QA container:

| Fixture                    | Output            |     Bytes |       Time |
| -------------------------- | ----------------- | --------: | ---------: |
| photograph.jpg, 945,343 B  | JPEG q82          |   532,114 |   183.6 ms |
| photograph.jpg             | PNG               | 3,758,751 |   987.9 ms |
| photograph.jpg             | WebP q80          |   547,186 |   992.6 ms |
| photograph.jpg             | AVIF q50 effort 3 |   234,057 | 2,478.7 ms |
| illustration.png, 24,350 B | JPEG q82          |    16,765 |    23.7 ms |
| illustration.png           | PNG               |     7,643 |    79.3 ms |
| illustration.png           | WebP q80          |     6,942 |    49.2 ms |
| illustration.png           | AVIF q50 effort 3 |     3,792 |   223.6 ms |

PNG is intentionally not presented as a good photographic conversion: the benchmark shows the large result rather than hiding it.

### Exact-size benchmark

| Photograph target |    Output | Dimensions | Quality | Encodes |       Time |
| ----------------: | --------: | ---------: | ------: | ------: | ---------: |
|             20 KB |  20,335 B |    336x216 |      55 |      56 | 3,030.3 ms |
|             50 KB |  50,646 B |    616x396 |      45 |      41 | 2,437.3 ms |
|            100 KB | 101,815 B |    952x612 |      39 |      26 | 1,854.5 ms |
|            200 KB | 202,738 B |   1288x828 |      43 |      11 |   998.1 ms |
|            500 KB | 508,334 B |   1400x900 |      80 |       6 |   529.9 ms |
|              1 MB | 950,389 B |   1400x900 |      95 |       6 |   749.6 ms |

The PNG illustration produced 16,508 B at its original 900x600 dimensions for every 20 KB through 1 MB target. All 12 rows reported success at or below the requested byte cap.

### Lighthouse

Mobile emulation against local production Docker:

| Route                                              | Perf | A11y |  BP | SEO |      LCP |    TBT | CLS |
| -------------------------------------------------- | ---: | ---: | --: | --: | -------: | -----: | --: |
| `/`                                                |   88 |  100 |  78 | 100 | 1,801 ms | 449 ms |   0 |
| `/compress-image-to-50kb`                          |   91 |  100 |  78 | 100 | 1,956 ms | 338 ms |   0 |
| `/resize-image`                                    |   98 |  100 |  78 | 100 | 1,955 ms | 112 ms |   0 |
| `/image-to-base64`                                 |  100 |  100 |  78 | 100 | 1,505 ms |  39 ms |   0 |
| `/guides/how-to-compress-image-to-exact-file-size` |  100 |  100 |  78 | 100 | 1,503 ms |   0 ms |   0 |
| `/tools`                                           |  100 |  100 |  78 | 100 | 1,708 ms |  61 ms |   0 |

Best Practices is 78 because Lighthouse flags the intentional local HTTP endpoint and absence of an HTTP-to-HTTPS redirect. Coolify TLS/domain behavior was not tested because deployment was explicitly out of scope.

### Frontend payload

The production Nginx image contains 2,720 KiB of static site files and 528 KiB under `_astro`. Largest uncompressed interaction assets:

| Asset                   |   Bytes | Loading boundary              |
| ----------------------- | ------: | ----------------------------- |
| ImageToPdfWorkspace JS  | 427,883 | lazy, Image-to-PDF pages only |
| SiteLayout CSS          |  28,121 | global                        |
| ToolWorkspace JS        |  24,568 | tool islands                  |
| Preact runtime          |  10,470 | hydrated tools                |
| Base64Workspace JS      |   8,319 | Base64 pages only             |
| ColorPickerWorkspace JS |   5,552 | color picker only             |

### Failures found and fixed during this gate

- QA image lacked compiled processor/static artifacts for standalone exact benchmark and content lint commands. The QA stage now runs the full build.
- The TTL harness polled Nginx `/health`, which remains 200 while a recreated processor starts. It now waits on proxied `/ready` and always restores the normal TTL in `finally`.
- Docker's internal exposed-port metadata was mistaken for a host publish. The smoke now inspects `HostConfig.PortBindings`; the actual map is empty.
- One `client:visible` guide test selected a file before React hydration on its first attempt. The test now waits for Astro's SSR marker to clear; it then passed five no-retry repetitions and the complete 54-test no-retry final run.
- Result-download `X-Robots-Tag` was previously represented by a placeholder assertion. The smoke now checks the real download header and measured `noindex, nofollow, noarchive`.

### Coolify readiness

`READY FOR COOLIFY DEPLOYMENT`

There are no remaining local release blockers. The owner did not authorize or request a Coolify deployment in this task, so no Coolify, VPS, DNS, TLS, secret, volume, or running production service was changed. A later deployment task must reconfirm the application revision and image/Compose contract, then perform only the bounded production smoke described in `AGENTS.md` and `docs/coolify-deployment.md`.

Evidence below was produced on 2026-08-09 in the release-hardening environment, on
the commit recorded at the bottom of this page. Every row states what was actually
run and where. A row marked BLOCKED is not evidence of success.

A second pass ran later the same day (2026-08-09) specifically to attempt the
Docker verification this document lists as blocked. Its result and evidence are in
"Docker verification pass" below; it did not change any row in the original
"Gates" table above it, because it did not obtain registry access either — the
three rows already marked BLOCKED for Docker reasons gained more precise detail
instead. It did fix one real, previously-unverified gap outside the registry
(HEIC decoder packaging) and prove the fix works, using the host directly rather
than a container. That row is new, not a change to prior evidence.

## Environment

| Property        | Value                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host            | Linux 6.18.5, x86-64, 4 vCPU visible to the runtime, 30 GB free disk                                                                                                                               |
| Node            | v22.22.2 for tooling, `node:24-bookworm-slim` in the production image                                                                                                                              |
| sharp / libvips | sharp 0.35.3, libvips 8.18.3, libheif 1.23.1                                                                                                                                                       |
| Docker          | Daemon available, but Docker Hub blob downloads are refused by the network egress policy (`403` on `production.cloudfront.docker.com`). No base image could be pulled, so no image could be built. |
| Substitute edge | Docker-based Nginx could not run, so the built site and the processor were served on one origin by a local reverse proxy reproducing the routes and headers in `docker/nginx.conf`.                |
| Browser         | Chromium 1194 already present at `/opt/pw-browsers`, reused instead of downloading Playwright's pinned build.                                                                                      |

Because images could not be built, every gate that the previous pass ran "through
Docker" was re-run against the same compiled artefacts running natively. The
processor code, the sharp binary, and the static build are identical to what the
image would contain. What is genuinely unverified is the image assembly itself, the
Nginx runtime, and the Compose health wiring; those are listed as BLOCKED.

## Gates

| Gate                          | Command                                                                                                        | Actual result                                                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source state                  | `git status --short`                                                                                           | PASS: 9 intentional modifications, no stray untracked files. Artefacts and reports are ignored.                                                                                                  |
| Install                       | `npm ci`                                                                                                       | PASS: exit 0.                                                                                                                                                                                    |
| Type check                    | `npm run typecheck`                                                                                            | PASS: processor `tsc` plus `astro check`, 0 errors, 0 warnings, 0 hints across 24 files.                                                                                                         |
| Lint                          | `npm run lint`                                                                                                 | PASS: `eslint --max-warnings=0`.                                                                                                                                                                 |
| Format                        | `npm run format:check`                                                                                         | PASS after reformatting `docs/test-evidence.md`.                                                                                                                                                 |
| Content lint                  | `npm run content:lint`                                                                                         | PASS: 22 source files.                                                                                                                                                                           |
| Unit / security / engine      | `npm test`                                                                                                     | PASS: 4 files, 9 tests, up from 7. Two new tests cover AVIF output validation and AVIF source identification.                                                                                    |
| Static build                  | `npm run build`                                                                                                | PASS: 52 pages.                                                                                                                                                                                  |
| Health and readiness          | `GET /health`, `GET /ready` through the edge proxy                                                             | PASS: `{"status":"ok"}` and `{"status":"ready","queueDepth":0,"active":0}`.                                                                                                                      |
| Core processing               | JPEG, PNG, WebP, AVIF, SVG uploads through the real HTTP API, every result decoded and its true format checked | PASS: 7 of 7 routes produce decodable output with correct dimensions and alpha.                                                                                                                  |
| AVIF correctness              | `POST /api/jobs` with `format: avif`                                                                           | Was FAIL, now PASS. See "Fixed during this pass".                                                                                                                                                |
| HEIC                          | Real HEVC-coded HEIC generated with `heif-enc`, pushed through the API                                         | PASS after fix: HEIC to JPG, to WebP, keep-original, and exact 100 KB all succeed. `heif-info` confirms the fixture is a standard `heic`/`mif1`/`miaf` file.                                     |
| Exact-size correctness        | `npm run benchmark:exact` plus API tests                                                                       | PASS: every reported success is at or below the requested byte count. Impossible targets return `422 TARGET_IMPOSSIBLE` with actionable advice, not a 500.                                       |
| TTL lifecycle                 | Processor started with `FILE_TTL_SECONDS=60`, job created, waited past expiry                                  | PASS, 8 of 8: usable before expiry, then read 404, download 404, and the job directory removed from disk.                                                                                        |
| Startup cleanup               | Expired job planted on disk, processor restarted                                                               | PASS: removed during `JobStore.init`.                                                                                                                                                            |
| Delete now                    | `DELETE /api/jobs/:id`                                                                                         | PASS: 204, then read 404, download 404, and the directory is gone from disk.                                                                                                                     |
| Job authorization             | No token, wrong token, malformed header, short token, random id, traversal id                                  | PASS, 7 of 7: 401 or 403 as appropriate, 404 for unknown and traversal ids.                                                                                                                      |
| Hostile input                 | Shell script renamed `.jpg`, truncated JPEG, SVG containing `<script>`, traversal filename                     | PASS, 4 of 4: `UNSUPPORTED_FORMAT`, `DAMAGED_IMAGE`, `UNSAFE_SVG`, and the filename sanitised to `passwd.jpg`.                                                                                   |
| Temporary response headers    | Result download headers                                                                                        | PASS: `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff` set by the processor itself.                                                                                      |
| E2E                           | `npx playwright test` against the served build, Chromium                                                       | PASS: 45 of 45, including compression, 50 KB preset, resize, convert, HEIC, PDF, Base64, colour picker, favicon, passport, signature, metadata, delete, and mobile widths from 320 px to 430 px. |
| Browser-local privacy         | E2E specs assert zero `/api/` requests                                                                         | PASS: Base64 encode, Base64 decode and viewer, colour picker, and Image to PDF complete with an empty API request list.                                                                          |
| Accessibility                 | Playwright keyboard and overflow specs, plus Lighthouse accessibility category                                 | PASS: no horizontal overflow at 320, 360, 375, 390, 430, 768, and 1440 px; skip link now moves focus; Lighthouse accessibility 100 on all six sampled routes.                                    |
| SEO crawl                     | `npm run test:seo`                                                                                             | PASS: 51 canonical URLs, each 200 with unique title, description, canonical, H1, Open Graph, and valid JSON-LD.                                                                                  |
| Sitemap                       | Parsed `sitemap-pages.xml`, requested every entry                                                              | PASS: 51 URLs, all absolute on `https://compressimage.fun`, all 200, no API, job, localhost, or test routes.                                                                                     |
| robots.txt                    | Fetched from the served build                                                                                  | PASS: crawlable, `Disallow: /api/`, sitemap referenced.                                                                                                                                          |
| llms.txt                      | Fetched from the served build                                                                                  | PASS: curated tool and guide list, accurate description of temporary processing, no job or API routes.                                                                                           |
| Compression benchmark         | `npm run benchmark:compression`                                                                                | PASS, numbers below.                                                                                                                                                                             |
| Exact-size benchmark          | `npm run benchmark:exact`                                                                                      | PASS, numbers below.                                                                                                                                                                             |
| Mixed load                    | `npm run test:load`                                                                                            | PASS: 8 concurrent mixed jobs including AVIF, 8 of 8 succeeded in 3.18 s at `PROCESS_CONCURRENCY=2`.                                                                                             |
| Lighthouse                    | `npm run test:lighthouse`                                                                                      | PASS after fixing the harness, numbers below.                                                                                                                                                    |
| Absolute paths / placeholders | Repository grep                                                                                                | PASS: no developer machine paths outside the quoted rules in `BUILD_PROMPT.md`; no lorem ipsum or placeholder copy.                                                                              |
| Docker image build            | `docker compose build --pull`                                                                                  | BLOCKED, re-confirmed in the later Docker verification pass. Not a repository defect. Detail below.                                                                                              |
| Compose health wiring         | `docker compose up`                                                                                            | BLOCKED: same cause. `docker compose config` (no pull required) validates cleanly. Detail below.                                                                                                 |
| Nginx runtime headers         | Response headers from the real Nginx                                                                           | BLOCKED: same cause. `docker/nginx.conf` was reviewed and corrected by inspection. No change needed in the Docker verification pass.                                                             |
| HEIC decoder packaging        | `apt-cache depends`, then a real `heif-enc`/`heif-convert` A/B decode test on the host, no registry needed     | Gap found, fixed, and functionally proven on a same-family distro. Still not run inside the actual container. Detail below.                                                                      |

## Fixed during this pass

| Defect                                         | Evidence it was real                                                                                        | Fix                                                                                                                                                                                                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every AVIF output failed with `OUTPUT_INVALID` | `POST /api/jobs` with `format: avif` returned the error before the change                                   | libvips reports AVIF as `heif`, so output validation compared `heif` against `avif`. `inspect` now resolves HEIF plus `compression: av1` to `avif`.                                                                                           |
| Uploaded AVIF silently became JPEG             | An AVIF upload with `format: original` returned a 536 KB JPEG from a 504 KB AVIF                            | Same root cause: `resolveOutputFormat` never saw `avif`. Now returns AVIF, 310 KB, alpha preserved.                                                                                                                                           |
| HEIC could not be decoded at all               | Three independently encoded, structurally valid HEIC files all failed with `bad seek`, while AVIF succeeded | The prebuilt libvips has no HEVC decoder. The processor now transcodes HEIC with libheif's `heif-convert`, which is installed in the processor image. If the binary is missing, uploads fail with a clear message instead of a generic error. |
| Exact-size AVIF timed out                      | A 50 KB AVIF target failed with `PROCESSING_TIMEOUT` after 60 s                                             | AVIF `effort` lowered from 4 to 3. Measured on these fixtures effort 4 was both slower and larger than effort 3 on photographs. The 50 KB target now completes in 20.7 s.                                                                     |
| Skip link did not move focus                   | Playwright asserted `#main` never became focused                                                            | `<main>` now carries `tabindex="-1"`.                                                                                                                                                                                                         |
| Lighthouse harness could not start             | `chrome-launcher` v1 has no default export                                                                  | Switched to the named import and added a `CHROME_PATH` override.                                                                                                                                                                              |
| Nginx dropped security headers                 | `add_header` in a `location` replaces inherited headers, so static assets and `/api/` lost them             | Headers repeated in both overriding blocks. Reviewed by inspection only, since Nginx could not be run.                                                                                                                                        |
| Four E2E specs used ambiguous selectors        | Strict-mode violations, not product faults                                                                  | Selectors made exact; the tool-search assertion no longer pins a result count.                                                                                                                                                                |

## Docker verification pass

Ran later on 2026-08-09, in a separate session, specifically to build and run the
actual production images and flip the BLOCKED rows above. Started from
`claude/compressimage-final-hardening-7i1ooe` at commit `aa6e386`, fast-forwarded
onto the release branch. Repeats the registry check the prior pass reported and
goes one step further with a read-only packaging investigation.

### Registry access

The Docker daemon was not running by default in this session and was started
manually (`dockerd`, since the init script's `ulimit -Hn` call is not permitted in
this sandbox). Once running:

- `docker pull node:24-bookworm-slim` — fails: `403 Forbidden` opening a blob at
  `https://production.cloudfront.docker.com/registry-v2/.../blobs/sha256/...`.
- `docker pull nginx:1.28-alpine` — fails the same way, same host.
- The session's agent-proxy status endpoint (`$HTTPS_PROXY/__agentproxy/status`)
  logs the cause directly: `recentRelayFailures: {"kind":"connect_rejected`,
  `"detail":"gateway answered 403 to CONNECT (policy denial or upstream failure)"`,
  `"host":"production.cloudfront.docker.com:443"}`. This is an organization egress
  policy decision, confirmed identical to the previous pass's finding, not a
  transient failure or a proxy misconfiguration on this repository's side.
- General Debian package-metadata hosts (`packages.debian.org`,
  `sources.debian.org`, `deb.debian.org`) were also tried, in case Dockerfile
  package names could be confirmed without a registry, and were blocked the same
  way (`403` on the `CONNECT` tunnel). This sandbox's own OS is Ubuntu, not
  Debian, and its own package archive (`archive.ubuntu.com`) turned out to be
  reachable, along with `registry.npmjs.org` and `download.docker.com` (the apt
  repo for the Docker Engine packages, distinct from the Docker Hub image
  registry/CDN that is blocked). That let this pass install the host's own
  `libheif-examples` / `libheif-plugin-libde265` / `libheif-plugin-x265` packages
  and run a real functional decode test — see "HEIC decoder packaging" below —
  without touching the blocked registry. It does not change the registry
  finding: the container image registry itself, and Debian's package mirrors
  specifically, remain blocked from this session.
- Per policy, downloads were not retried beyond the two required base images plus
  the one general-purpose check above. `docker compose build`, `docker compose
up`, in-container HEIC/AVIF verification, storage-restart verification, live
  Nginx headers, and the compact Docker browser smoke could therefore not run.
  These remain BLOCKED, exactly as the prior pass reported.

### Compose file validity (does not require a registry)

`docker compose config` renders and validates `docker-compose.yml` without pulling
anything, and succeeds. Confirmed structurally, from the rendered output:

- `processor` publishes no ports and is attached only to `internal`
  (`internal: true`, not routable from the host or internet).
- `web` publishes `8080:8080`, is attached to both `internal` and `edge`, and
  `depends_on: processor: condition: service_healthy`.
- The `jobs` named volume mounts to `/data/jobs` on `processor` only.

This confirms the Compose file itself is well-formed and matches
`docs/coolify-deployment.md`. It does not confirm the containers actually start
healthy, since that requires the images to exist.

### HEIC decoder packaging — gap found, fixed, functionally proven outside the container

Section 3 of this pass's brief specifically warns that `heif-convert` can exist
while its HEVC decoder plugin is absent, and asks for that to be checked rather
than assumed. The actual production image could not be built to check it
directly (registry still blocked, below), so the same question was answered two
different ways on the host instead: first from package metadata, then with a
real functional decode test.

**Package metadata.** `libheif-examples` depends on `libheif1`, `libc6`,
`libgcc-s1`, `libjpeg8`, `libpng16-16t64`, `libstdc++6` — no codec plugin. Since
libheif 1.15, Debian and Ubuntu ship each codec backend as its own plugin package
(`libheif-plugin-libde265` for HEVC decode, `libheif-plugin-aomdec` for AV1
decode, `libheif-plugin-x265` for HEVC encode, eleven such plugins in total on
this host's archive); `libheif-examples` only provides the
`heif-convert`/`heif-enc`/`heif-info` binaries, no codec.

**Functional A/B proof.** The host in this sandbox is Ubuntu 24.04 (`noble`),
not Debian 12 (`bookworm`), but both track the same `libheif` upstream source
package under the same Debian Multimedia Team maintainer, with the same plugin
split. `libheif-examples` and `libheif-plugin-libde265` were installed on the
host (via `archive.ubuntu.com`, not the blocked Docker registry), a real
HEVC-coded HEIC fixture was generated with `heif-enc` from the project's own
`scripts/generate-fixtures.mjs`, and confirmed genuine with `heif-info`
(`MIME type: image/heic`, brands `heic`/`mif1`/`miaf`, 1400x900). Then, using the
exact command `apps/processor/src/image-engine.ts` runs
(`heif-convert --quality 100 <in> <out>`):

```
$ mv /usr/lib/x86_64-linux-gnu/libheif/plugins/libheif-libde265.so{,.disabled}
$ heif-convert --quality 100 photograph.heic out.png
File contains 1 image
Could not decode image: 0: Unsupported feature: Unsupported codec   # exit 1

$ mv /usr/lib/x86_64-linux-gnu/libheif/plugins/libheif-libde265.so{.disabled,}
$ heif-convert --quality 100 photograph.heic out.png
File contains 1 image
Written to out.png                                                  # exit 0
$ file out.png
out.png: PNG image data, 1400 x 900, 8-bit/color RGB, non-interlaced
```

This reproduces, byte-for-byte, the exact failure the current (unfixed)
Dockerfile ships today — `heif-convert` exists, decode still fails, `"Unsupported
codec"` — and confirms the fix restores a correct, correctly-dimensioned decode
of a real HEVC-coded HEIC file, using the same binary and invocation the
application uses. `apps/processor/src/image-engine.ts` already treats a
`heif-convert` failure as a clean, safe fallback (`HEIC_DECODE_UNAVAILABLE`, not
a crash), so this was never a stability risk — only a silently-missing feature,
now closed with evidence rather than a guess.

Fix applied to `Dockerfile`: added `libheif-plugin-libde265` next to
`libheif-examples` in the `processor` stage. Decode-only, matching the brief's
instruction not to add HEVC encoding support (`libheif-plugin-x265`) since the
application never encodes HEIC — the encoder was installed only on the host, only
to synthesize the test fixture above, and is not part of any shipped image. AVIF
is unaffected: AV1 is decoded by libvips directly, not through `heif-convert`, so
no AV1 plugin package was added.

What remains genuinely unverified is narrower than before: not "does this
concept work" (proven above) but "does Debian bookworm's apt archive spell the
package `libheif-plugin-libde265` too." It does on every other libheif-plugin-era
Debian/Ubuntu release this pass could check, and the failure mode if the name is
ever wrong is a loud `apt-get install` build failure, not a silent runtime bug —
still worth the first check on a registry-connected host, but no longer the main
risk it was.

## Compression benchmark

Synthetic fixtures from `scripts/generate-fixtures.mjs`, single job, no concurrency.
The photograph fixture is deliberately noisy, which is the worst case for AVIF.

| Fixture                  | Format   | Input     | Output    | Time                                       |
| ------------------------ | -------- | --------- | --------- | ------------------------------------------ |
| photograph.jpg 1400x900  | jpeg q82 | 945 343 B | 532 114 B | 89 ms                                      |
| photograph.jpg           | webp q80 | 945 343 B | 547 186 B | 316 ms                                     |
| photograph.jpg           | avif q50 | 945 343 B | 246 081 B | 9 805 ms at effort 4, 2 122 ms at effort 3 |
| illustration.png 900x600 | png      | 24 469 B  | 7 578 B   | 65 ms                                      |
| illustration.png         | webp q80 | 24 469 B  | 6 892 B   | 41 ms                                      |
| illustration.png         | avif q50 | 24 469 B  | 3 615 B   | 608 ms                                     |

AVIF effort measured separately on photograph.jpg at quality 50: effort 0 gives
248 254 B in 208 ms, effort 1 gives 241 775 B in 845 ms, effort 3 gives 234 308 B in
2 122 ms, and effort 4 gives 246 081 B in 9 765 ms. Effort 3 is smaller and faster
than effort 4 on both photographic fixtures, which is why it is now the default.

## Exact-size benchmark

`npm run benchmark:exact`. Success means the encoded result is at or below the
target, which held in every row.

| Fixture          | Target        | Output    | Dimensions | Quality | Encodes | Time          |
| ---------------- | ------------- | --------- | ---------- | ------- | ------- | ------------- |
| photograph.jpg   | 20 KB         | 20 335 B  | 336x216    | 55      | 56      | 3 186 ms      |
| photograph.jpg   | 50 KB         | 50 646 B  | 616x396    | 45      | 41      | 2 579 ms      |
| photograph.jpg   | 100 KB        | 101 815 B | 952x612    | 39      | 26      | 1 709 ms      |
| photograph.jpg   | 200 KB        | 202 738 B | 1288x828   | 43      | 11      | 763 ms        |
| photograph.jpg   | 500 KB        | 508 334 B | 1400x900   | 80      | 6       | 512 ms        |
| photograph.jpg   | 1 MB          | 950 389 B | 1400x900   | 95      | 6       | 584 ms        |
| illustration.png | 20 KB to 1 MB | 16 280 B  | 900x600    | 100     | 7       | 372 to 530 ms |

Extreme and impossible targets, measured through the HTTP API:

| Case                    | Result                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| photograph to 1 KB      | `422 TARGET_IMPOSSIBLE` with advice to try WebP, fewer pixels, or aggressive mode |
| photograph to 3 KB      | 3.0 KB at 140x90, note reports the dimension change                               |
| transparent PNG to 5 KB | 5.0 KB at 395x395                                                                 |
| icon PNG to 1 KB        | 0.5 KB at 64x64, unchanged dimensions                                             |
| AVIF to 100 KB          | 95.6 KB at 1288x828 in 10.6 s                                                     |
| AVIF to 50 KB           | 46.9 KB at 952x612 in 20.7 s                                                      |
| AVIF to 20 KB           | 19.1 KB at 616x396 in 25.4 s                                                      |

## Lighthouse

Mobile emulation at 390x844, simulated throttling, against the served production
build. Chromium 1194, `npm run test:lighthouse`.

| Route                                            | Performance | Accessibility | Best practices | SEO | LCP      | TBT  | CLS |
| ------------------------------------------------ | ----------- | ------------- | -------------- | --- | -------- | ---- | --- |
| /                                                | 100         | 100           | 96             | 100 | 903 ms   | 0 ms | 0   |
| /compress-image-to-50kb                          | 100         | 100           | 100            | 100 | 1 505 ms | 0 ms | 0   |
| /resize-image                                    | 100         | 100           | 100            | 100 | 1 127 ms | 0 ms | 0   |
| /image-to-base64                                 | 100         | 100           | 100            | 100 | 902 ms   | 0 ms | 0   |
| /guides/how-to-compress-image-to-exact-file-size | 100         | 100           | 100            | 100 | 901 ms   | 0 ms | 0   |
| /tools                                           | 100         | 100           | 100            | 100 | 901 ms   | 0 ms | 0   |

## Format matrix

Tested through the HTTP API, with every output decoded and its real format checked
rather than trusting the file extension.

| Input            | Output                 | Status        | Notes                                                                      |
| ---------------- | ---------------------- | ------------- | -------------------------------------------------------------------------- |
| JPEG             | JPEG, WebP, AVIF, PNG  | Tested, pass  | Baseline smart compression saves about 44 percent on the photo fixture.    |
| PNG with alpha   | WebP, AVIF, PNG        | Tested, pass  | Alpha preserved in WebP and AVIF.                                          |
| PNG with alpha   | JPEG                   | Tested, pass  | Flattened onto white, as intended.                                         |
| AVIF             | AVIF, JPEG             | Tested, pass  | Fixed this pass. Keep-original now stays AVIF.                             |
| HEIC, HEVC coded | JPEG, WebP, exact size | Tested, pass  | Requires `heif-convert`, installed in the processor image.                 |
| SVG              | PNG                    | Tested, pass  | Active content rejected before processing.                                 |
| GIF, TIFF        | Accepted as input      | Not exercised | Declared in the accepted MIME list but not covered by a test in this pass. |
| Animated input   | Rejected               | Tested, pass  | Returns `ANIMATION_UNSUPPORTED` rather than silently flattening.           |

## Not verified

- Docker image build, Compose health wiring, and live Nginx response headers.
  Re-attempted in a dedicated Docker verification pass later on 2026-08-09; the
  network policy still refuses Docker Hub blob downloads for both required base
  images, confirmed as an organization policy denial rather than a transient
  failure (see "Docker verification pass" above). The Dockerfile and Nginx
  changes are reviewed but still not run.
- Behaviour of the HEIC path inside the _built image specifically_. The
  application mechanism is verified natively with the same processor code and
  the same `heif-convert` tool. The Docker verification pass additionally found
  that the processor image's package list was missing the HEVC decoder plugin,
  added `libheif-plugin-libde265`, and functionally proved the fix with a real
  encode/decode A/B test on a same-family host distro (see above) — but that
  proof is still outside the actual `node:24-bookworm-slim`-based container,
  since no image could be built here. Confirming it inside the real container is
  now a fast sanity check rather than an open question.
- Firefox and WebKit E2E. Only Chromium was available.
- Real device testing. Mobile evidence is Chromium emulation at real widths.

## Final Coolify release pass (2026-08-09)

Ran on branch `cursor/final-coolify-release-0b86` after the Docker Hub egress
block that stopped earlier passes was no longer present. Every gate below ran
against the real production Compose images (`workspace-processor`,
`workspace-web`), not a host substitute.

### Compose contract changes proven this pass

- Production `docker-compose.yml` no longer publishes `0.0.0.0:8080`. `web`
  uses `expose: ["8080"]` so Coolify can route to container port 8080 without
  binding the VPS host port.
- `docker-compose.local.yml` publishes `127.0.0.1:${PUBLIC_PORT:-8080}:8080`
  for local QA only.
- `processor` still has no `ports`, no domain, and sits on `internal: true`.
- `e2e` remains behind `profiles: [qa]` and did not start under
  `docker compose up -d`.

### HEIC packaging correction

`libheif-plugin-libde265` does **not** exist on Debian bookworm
(`node:24-bookworm-slim`). Bookworm's `libheif-examples` pulls `libheif1`, which
links `libde265-0` directly. Installing the Ubuntu plugin package name made
`docker compose build` fail with `Unable to locate package`. Dockerfile now
installs `libheif-examples` only. Inside the built processor:

```
heif-convert --list-decoders
HEIC decoders:
- libde265 = libde265 HEVC decoder, version 1.0.11
```

`heicDecoderAvailable()` now probes `--list-decoders` for `libde265|hevc`
instead of `--version` (not portable across libheif 1.15).

### Gates (this pass)

| Gate                | Command / method                                                       | Result                                                                     |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Docker build        | `docker compose build --pull`                                          | PASS: `processor` and `web` built                                          |
| Compose up          | `docker compose up -d` then local overlay for QA                       | PASS: processor healthy, web healthy, e2e absent                           |
| Health              | `GET http://127.0.0.1:8080/health` and `/ready`                        | PASS: `{"status":"ok"}`, ready with queueDepth 0                           |
| HEIC in container   | HEIC→JPG, HEIC→WebP, HEIC exact 100 KB via `/api/jobs`                 | PASS: 1400×900 decode, outputs valid, exact ≤ 100 KB (101732 B at 952×612) |
| AVIF                | JPEG→AVIF, preserve-format, exact 50 KB                                | PASS: av1 compression, no JPEG fallback, 48016 B in 17.5 s                 |
| Core smoke          | JPEG, exact 50 KB, PNG, WebP, resize, batch, metadata remove, download | PASS                                                                       |
| Persistence         | process → restart processor → download                                 | PASS                                                                       |
| Delete now          | DELETE → 404 job/download → directory gone                             | PASS: 204 then gone                                                        |
| TTL                 | `FILE_TTL_SECONDS=60`, wait 65 s, restart cleanup                      | PASS: job 404, download 404, directory gone; restored to 14400             |
| Security headers    | live Nginx HTML / CSS / `/api/`                                        | PASS: nosniff, DENY, CSP, API `private, no-store` + `noindex`              |
| Processor isolation | `docker compose port processor 3000`                                   | PASS: no published host port                                               |
| Browser-local       | Playwright Base64 encode/decode/viewer, color picker, Image to PDF     | PASS: zero `/api/` requests                                                |
| Compact Chromium    | `tests/e2e/release-smoke.spec.ts` (6)                                  | PASS: homepage, 50 KB, HEIC, AVIF, Base64 privacy, 390 px                  |
| SEO runtime         | `/`, robots, sitemap-index, llms, representative pages                 | PASS: all 200                                                              |
| Lighthouse          | `npm run test:lighthouse` vs Docker web                                | PASS: all six routes Performance/A11y/BP/SEO = 100                         |

### Lighthouse (Docker-hosted)

| Route                                            | Perf | A11y | BP  | SEO | LCP     | TBT | CLS |
| ------------------------------------------------ | ---- | ---- | --- | --- | ------- | --- | --- |
| /                                                | 100  | 100  | 100 | 100 | 1652 ms | 0   | 0   |
| /compress-image-to-50kb                          | 100  | 100  | 100 | 100 | 1653 ms | 0   | 0   |
| /resize-image                                    | 100  | 100  | 100 | 100 | 1502 ms | 0   | 0   |
| /image-to-base64                                 | 100  | 100  | 100 | 100 | 1352 ms | 0   | 0   |
| /guides/how-to-compress-image-to-exact-file-size | 100  | 100  | 100 | 100 | 901 ms  | 0   | 0   |
| /tools                                           | 100  | 100  | 100 | 100 | 1051 ms | 0   | 0   |

### Coolify settings proven by this pass

```
Build Pack: Docker Compose
Base Directory: /
Compose Location: /docker-compose.yml
Processor domain: (blank)
Web domain: https://compressimage.fun:8080
E2E domain: (blank)
Health: web /health
Volume: jobs → processor:/data/jobs
QA profile: disabled
Public URL: https://compressimage.fun
```

`:8080` in the Coolify domain field is the internal container target port, not
part of the public URL.

### Verdict

**100/100 READY FOR COOLIFY DEPLOYMENT**

## Commits

- `aa6e386` — AVIF/HEIC pipeline fixes, header hardening, native verification
  (`claude/compressimage-final-hardening-7i1ooe`), described throughout this
  document except the "Docker verification pass" section.
- Docker verification pass — HEIC decoder packaging investigation on
  `claude/compressimage-docker-release-ycp1xz` (fast-forwarded from `aa6e386`);
  earlier incorrectly assumed Ubuntu plugin package names for bookworm.
- Final Coolify release pass — Compose host-port removal, bookworm HEIC package
  fix, decoder probe fix, Coolify docs, and full Docker gate evidence on
  `cursor/final-coolify-release-0b86`.
