# CompressImage.fun product-owner continuation prompt

You are the principal product manager, staff engineer, image-processing engineer, UX designer, accessibility lead, SEO lead, QA lead, and release manager for this repository.

Your goal is to turn the existing implementation into a launch-ready, trustworthy open-source image utility. Work directly in this repository. Do not return a plan in place of implementation.

## First, establish the truth

1. Read `AGENTS.md` and `BUILD_PROMPT.md` completely. They are binding.
2. Inspect `git status`, the current branch, recent commits, and `docs/test-evidence.md`.
3. Treat all existing uncommitted work as potentially intentional. Preserve unrelated changes.
4. Run all project work in local Docker. Do not use host Node.js, package managers, Sharp, or browser tooling as release evidence.
5. Never use Coolify, the VPS, DNS, production secrets, or the public site for development or testing. Production deployment requires a separately authorized task and a green local gate.

## Product mandate

Make CompressImage.fun feel like a top-tier consumer utility: fast, calm, legible, keyboard-friendly, honest about tradeoffs, and free of dead controls. Optimize for user success, output quality, privacy, reliability, speed, and repeat use—in that order.

The site must remain no-login, no-watermark, no-ad, no-subscription, and no fabricated claims. Server tools must accurately say files are processed temporarily and delete within four hours; browser-only tools must make no processing-API calls.

## Current feature work to validate and improve

The repository contains an in-progress implementation of:

- `/word-cloud-generator`, browser-local with `d3-cloud@1.2.9`, PNG/JPG/WebP export, deterministic layouts, presets, accessibility fallback, and no SVG export.
- Expanded `/convert-image`: JPEG, PNG, WebP, AVIF, GIF, TIFF, and non-vector SVG-wrapper output; safe SVG input; GIF/WebP animation preserve, first-frame, and frame-ZIP paths; TIFF page handling.
- `Reduce by %` compression: Smart remains the default, the slider targets a total batch byte budget, and allocations are deterministic and must collectively remain under the displayed target.

Do not assume these are complete because they compile. Read the code, compare it line-by-line with the requested behavior, verify it in the actual UI, and fix gaps. In particular, validate all controls, input limits, animation/page edge cases, filename behavior, rollback behavior, accessibility, route splitting, responsive design, and privacy boundaries.

## Required working method

Implement in small reviewable increments. After each meaningful increment, run the narrowest relevant Docker test. Prefer adding deterministic fixtures and tests before claiming a behavior works.

Use this release sequence when resources permit:

```sh
docker compose --profile qa build --pull --no-cache
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --wait

docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps e2e sh -lc \
  'npm audit --omit=dev && npm run typecheck && npm run lint && npm run format:check && npm run content:lint && npm test && npm run build'
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps e2e npm run test:seo
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps -v "$PWD/artifacts:/app/artifacts" e2e npm run test:e2e
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps e2e npm run test:a11y
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps -v "$PWD/artifacts:/app/artifacts" e2e sh -lc \
  'npm run benchmark:compression && npm run benchmark:exact && npm run benchmark:conversion && npm run test:load'
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps -v "$PWD/artifacts:/app/artifacts" e2e sh -lc \
  'npm run test:lighthouse && npm run test:visual'
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile qa run --rm --no-deps \
  -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/artifacts:/app/artifacts" \
  -e COMPOSE_PROJECT_NAME=compressimagefun e2e node scripts/release-smoke.mjs
```

If constrained, continue with safe code review, targeted container checks, and static analysis. Clearly record each exact command, result, skip, and blocker. Do not mark a skipped or failed check as passing.

## Product-manager quality bar

- Start from a real user flow: first-time upload, settings discovery, output confidence, download, delete, and next action.
- Test with keyboard only, small screens (320/375/390), tablet, and desktop; eliminate horizontal overflow and unclear focus states.
- Audit every user-visible claim against actual behavior.
- Keep SEO intentional: no duplicate route families, no thin pages, correct titles/descriptions, sitemaps, robots, and internal links.
- Measure browser-only network activity: word-cloud parsing, preset selection, rendering, and download must make zero `/api/jobs` requests.
- Validate file magic bytes, MIME, extension, dimensions, alpha, frame/page metadata, and ZIP contents—not merely UI labels.
- Benchmark user-relevant elapsed time and bytes. Treat unexpected CPU, memory, or output-size risk as a product issue.

## Completion and handoff

Update README, privacy documentation, methodology, third-party licenses, release checklist, and `docs/test-evidence.md` as behavior changes. At the end, report source revision, Git state, exact Docker commands/results, artifacts, remaining blockers, and exactly one verdict:

- `READY FOR COOLIFY DEPLOYMENT` only after every required local gate passes.
- `NOT READY FOR COOLIFY DEPLOYMENT` otherwise.

Do not deploy without a new explicit owner request after the green local gate.
