# Test evidence

Evidence below was produced on 2026-08-09 through local Docker only. A skipped or
failed row is not evidence of success. The owner stopped further resource-intensive
testing after Docker Desktop exhausted the host filesystem while unpacking the
pinned Playwright image.

| Gate | Command | Actual result |
| --- | --- | --- |
| Source state | `git rev-parse HEAD`; `git status --short` | Base revision `71ff7de54e7706947e4d67624aa88e508314fbbb`; implementation is uncommitted and untracked, so no immutable release revision exists. |
| Dependency install | `docker build --target build -t compressimage-build:local .` | PASS: clean `npm ci`, 678 packages audited, 0 vulnerabilities. npm printed a non-failing allow-scripts review notice for esbuild. |
| Audit | `docker run --rm compressimage-build:local npm audit --omit=dev` | PASS: 0 vulnerabilities. |
| Type check | `docker run --rm compressimage-build:local npm run typecheck` | PASS: processor TypeScript and Astro check; 0 errors, warnings, or hints. |
| Lint | `docker run --rm compressimage-build:local npm run lint` | PASS. |
| Format | `docker run --rm compressimage-build:local npm run format:check` | PASS. |
| Content | `docker run --rm compressimage-build:local npm run content:lint` | PASS: 22 source files plus generated metadata checks. |
| Unit/security | `docker run --rm compressimage-build:local npm test` | PASS: 4 files, 7 tests, including token auth, TTL store cleanup, exact-size bounds, form-photo preparation, and favicon outputs. |
| Static build | Same build command | PASS: 52 static pages. Build image manifest list `sha256:71f95a424dc9af9bb95564902319c561b27551db6e498614a9bcb3e78665e5f3`. |
| Production images | `docker compose build` | PASS: Nginx web and Node processor images built; manifests `sha256:5c528daf...` and `sha256:e772d8c0...`. |
| Compose health/routes | `PUBLIC_PORT=18080 docker compose up -d`; curl `/health`, `/ready`, `/`, `/passport-photo-resizer`, missing route | PASS after fixing tmpfs permissions: services healthy, queue ready, public pages 200, missing page 404. Port 18080 was used because owner container `teleprompter-e2e` already owns 8080. |
| E2E/accessibility | `PUBLIC_PORT=18080 docker compose --profile qa build e2e` | NOT RUN. The pinned Playwright image downloaded and built, but Docker Desktop failed unpacking the final layer with an overlayfs I/O error after the host filesystem reached 100%. Owner requested stopping resource-intensive testing. |
| SEO crawl | QA container | NOT RUN after owner stop. |
| Benchmarks/load | Processor/QA container | NOT RUN after owner stop. |
| TTL integration | Local volume lifecycle test | NOT RUN after owner stop; store-level TTL unit coverage passed. |
| Lighthouse | Local production Compose | NOT RUN after owner stop. |
| Final post-fix gate | Docker static gate | NOT RERUN after the final Compose-only tmpfs mode edit because the owner stopped further testing. |

Resource recovery: only the ignored, regenerable repository `node_modules`
directory was removed. No source file, owner Docker image, or Docker-wide cache was
deleted. Host free space recovered from 117 MB to 4.6 GB.

Coolify verdict: `NOT READY FOR COOLIFY DEPLOYMENT`. The browser, SEO, performance,
load, and TTL integration gates remain unrun, and the source state is not an
immutable revision.
