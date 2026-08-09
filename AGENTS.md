# CompressImage.Fun Agent Operating Rules

These rules apply to the entire repository and to every local coding agent working in it.

## Canonical brief

`BUILD_PROMPT.md` is the canonical product and implementation brief. Preserve its product scope and quality bar. When a task-level instruction conflicts with this file, follow the newer explicit owner instruction and document the decision in the handoff.

## Recorded owner decision

On 2026-08-09, the owner set the following durable execution policy: use local Docker for implementation and all pre-release validation; deploy the validated Docker application through Coolify only at the very end, after the product is built, hardened and tested locally. This is a release boundary, not a preference. Do not weaken or bypass it without a newer explicit owner instruction.

## Local Docker is authoritative

- Build, run, test, benchmark and inspect the product through local Docker.
- Use the production Dockerfile and Docker Compose service topology locally.
- Run project dependency installation, type checks, linting, unit/integration tests, E2E, compression benchmarks, security checks, SEO crawl, accessibility checks, Lighthouse, visual QA, load tests and TTL checks in containers.
- Host-side work is limited to repository inspection/editing, Git and Docker orchestration. Do not use host-installed Node.js, package managers or native codecs as release evidence.
- Development overrides are allowed only when they do not hide production behavior. The unmodified production-equivalent path must also pass locally.
- Use representative local CPU, memory, filesystem and concurrency limits where the target VPS behavior matters.
- Keep reproducible commands and report actual results. Never mark an unrun or failing check as passed.

## Required execution order

1. Inspect the repository and current Git state; preserve unrelated owner changes.
2. Implement in small, reviewable increments.
3. Build and test each increment in local Docker.
4. Run the complete production-equivalent local Docker gate from `BUILD_PROMPT.md`.
5. Fix every in-scope failure and repeat affected checks.
6. Produce the required handoff with a truthful Coolify-readiness verdict.
7. Only after the local gate is green may a separately authorized Coolify deployment begin.

Do not skip forward to remote deployment because local setup or tests are inconvenient.

## Coolify is the final release phase

- Never use Coolify, the VPS or the public site for ordinary development, debugging, benchmarking, load testing or pre-release QA.
- Do not change Coolify configuration, production secrets, DNS, TLS, persistent volumes or running services unless the owner explicitly authorizes the final deployment task.
- `production Docker`, `production-like Docker` and `actual production Docker composition` in project documentation mean the production-equivalent composition running locally unless deployment is explicitly in progress.
- The deployable artifact must use the same reviewed Docker build and service/environment/volume contracts that passed locally.
- Do not maintain a second production-only code path.

A deployment is eligible only when all required local Docker checks pass, the source revision is recorded, release configuration and secrets are documented without committing secret values, volume/permission behavior is verified, health checks are defined, rollback is documented, and the handoff says `READY FOR COOLIFY DEPLOYMENT`.

If a required local check cannot be run, state the exact reason and mark the release `NOT READY FOR COOLIFY DEPLOYMENT` unless the check is inherently post-deployment.

## Deployment conduct

When the owner later authorizes deployment:

1. Reconfirm the recorded source revision and local evidence.
2. Deploy the already validated Docker artifact/contract through Coolify.
3. Run only safe production smoke checks: health, homepage/static assets, one bounded processing path, download/delete, headers, robots, sitemap and TLS/domain behavior.
4. Do not run destructive, broad load or stress tests against production.
5. If deployment verification fails, stop, preserve logs, roll back when needed and return to local Docker for the fix.

## Durable handoff

Every substantial implementation pass must leave future agents the exact local Docker commands run, their results, relevant benchmark/Lighthouse evidence, failures or justified skips, Git state, source revision, remaining blockers and one explicit Coolify-readiness verdict. Production claims require separate deployment evidence.
