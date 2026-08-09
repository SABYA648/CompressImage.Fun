# Test evidence

Evidence below was produced on 2026-08-09 in the release-hardening environment, on
the commit recorded at the bottom of this page. Every row states what was actually
run and where. A row marked BLOCKED is not evidence of success.

A second pass ran later the same day (2026-08-09) specifically to attempt the
Docker verification this document lists as blocked. Its result and evidence are in
"Docker verification pass" below; it did not change any row in the original
"Gates" table above it, because it did not obtain registry access either. Only the
three rows already marked BLOCKED for Docker reasons gained more precise detail.

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
| Nginx runtime headers         | Response headers from the real Nginx                                                                           | BLOCKED: same cause. `docker/nginx.conf` was reviewed and corrected by inspection. No change needed in the Docker verification pass.                                                            |
| HEIC decoder packaging        | `apt-cache depends` on the `libheif-examples` dependency chain, no registry needed                             | Gap found and fixed, **not** verified by an actual build. Detail below.                                                                                                                           |

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
- General package-metadata hosts (`packages.debian.org`, `sources.debian.org`,
  `deb.debian.org`) were also tried, in case Dockerfile package names could be
  confirmed without a registry, and were blocked the same way (`403` on the
  `CONNECT` tunnel). No outbound host outside the pre-approved allowlist
  (`no_proxy`: npm, PyPI, crates, Go proxy, jsr, and a few infra domains) is
  reachable from this session.
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

### HEIC decoder packaging — gap found, fixed, unverified by build

Section 3 of this pass's brief specifically warns that `heif-convert` can exist
while its HEVC decoder plugin is absent, and asks for that to be checked rather
than assumed. The actual production image could not be built to check it
directly, so the same question was checked one layer down, against package
metadata for the same `libheif` source package (same upstream, same Debian
Multimedia Team maintainer, on a same-family Linux distribution available in this
sandbox):

```
$ apt-cache depends libheif-examples
libheif-examples
  Depends: libheif1
  Depends: libc6
  Depends: libgcc-s1
  Depends: libjpeg8
  Depends: libpng16-16t64
  Depends: libstdc++6
```

No HEVC or AV1 decoder plugin is pulled in by `libheif-examples`. Since libheif
1.15, Debian and Ubuntu ship each libheif codec backend as its own plugin
package (`libheif-plugin-libde265` for HEVC decode, `libheif-plugin-aomdec` for
AV1 decode, `libheif-plugin-x265` for HEVC encode, and so on); `libheif-examples`
only provides the `heif-convert`/`heif-enc`/`heif-info` binaries, not any codec.
The processor Dockerfile installed only `libheif-examples`, so `heif-convert
--version` (the processor's own availability probe in
`apps/processor/src/image-engine.ts`) would very likely succeed while the actual
`heif-convert <heic-file> out.png` decode call fails for lack of a usable decoder
— exactly the failure mode this pass's brief called out by name.

Fix applied to `Dockerfile`: added `libheif-plugin-libde265` next to
`libheif-examples` in the `processor` stage. Decode-only, matching the brief's
instruction not to add HEVC encoding support (`libheif-plugin-x265`) since the
application never encodes HEIC. AVIF is unaffected: AV1 is decoded by libvips
directly, not through `heif-convert`, so no AV1 plugin package was added.

This fix is a same-family package-metadata inference, not a container-verified
fact, because no image could be built in this environment. It must be the first
thing confirmed on a registry-connected host: build the processor image, exec
into the running container, and confirm `heif-convert` actually decodes a real
HEIC fixture (see "Owner action" in the handoff report). If the package name
differs on `node:24-bookworm-slim` specifically, `apt-get install` will fail
loudly at build time rather than shipping a silently non-functional decoder,
which was judged the safer failure mode.

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
- Behaviour of the HEIC path inside the built image. The mechanism is verified
  natively with the same processor code and the same `heif-convert` tool. The
  Docker verification pass found, from package metadata rather than a build,
  that the processor image's package list was very likely missing the HEVC
  decoder plugin and added `libheif-plugin-libde265`; this fix itself is also
  unverified, since it still requires a build this environment cannot perform.
- Firefox and WebKit E2E. Only Chromium was available.
- Real device testing. Mobile evidence is Chromium emulation at real widths.

## Commits

- `aa6e386` — AVIF/HEIC pipeline fixes, header hardening, native verification
  (`claude/compressimage-final-hardening-7i1ooe`), described throughout this
  document except the "Docker verification pass" section.
- Docker verification pass — HEIC decoder packaging fix and this document's
  Docker-related updates, on `claude/compressimage-docker-release-ycp1xz`
  (fast-forwarded from `aa6e386`).
