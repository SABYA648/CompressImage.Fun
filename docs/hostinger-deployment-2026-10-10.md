# Hostinger KVM2 deployment — 10 October 2026

## Owner-directed execution changes

The owner explicitly directed: “Dont use docker in this mac. You have ssh access to vps, install docker there and do whatever you gotta do therr” and “I will setup dns later, I can do that. Just deploy those”. This deployment therefore uses VPS Docker validation and prioritizes deployment with build, quality, health, and bounded processing checks. The historical full local release gate is not claimed as passed. The extended browser run was stopped after seven passing layout checks to prioritize the requested deployment.

## Source and changes

Deployment branch: `deploy/hostinger-kvm2`.

- `c59703f`: fix the existing prefer-const lint failure and set processor limits to 1.5 CPUs / 3 GiB for the 2 CPU / 8 GiB VPS.
- `fe1c4cf`: update production dependencies within their declared compatible ranges; Sharp override updated to 0.35.5. Astro 7.3.8 and Fastify 5.12.5 are locked.

No source development is performed on public endpoints. VPS validation uses the independent `compressimage-validation` Compose project with web bound only to `127.0.0.1:18080`, and a separate jobs volume.

## Actual verification

All following commands ran on VPS `179.197.240.133` under `/opt/sabya/compressimage`:

```sh
docker build --target build -t compressimage-release-check .
docker run --rm compressimage-release-check sh -c 'npm run typecheck && npm run lint && npm run format:check && npm run content:lint && npm test'
docker compose -p compressimage-validation build
docker compose -p compressimage-validation -f docker-compose.yml -f /opt/sabya/validation-ports.yml up -d --wait
```

Production build passed. Type checks, lint, formatting, content checks, and all 21 unit tests passed on both the original deployment patch and security-patched dependencies. Production dependency lockfile audit reports zero vulnerabilities. Development-only advisories remain and are not represented as resolved.

Original baseline staging health and readiness passed. SEO crawl passed for 74 canonical URLs. Seven layout browser checks passed before the longer 54-test suite was stopped; the complete browser, benchmark, Lighthouse, visual, load, and TTL suites were not completed in this deployment pass.

VPS logs: `/opt/sabya/compressimage-*.log`. Audit report: `/opt/sabya/compressimage-production-audit.json`.

## Coolify contract

Application UUID: `6ywfe7iuuphyr81tbbvwqtpt`.
Project UUID: `umhwp10hn5naaldtr3dnfyml`.
Build pack: Docker Compose; repository `/docker-compose.yml`.
Only the web service is public, routing to container port 8080. Processor has no host ports. Persistent jobs volume belongs only to processor, mounted at `/data/jobs`. Default four-hour TTL is preserved.

No application secrets are required. Optional analytics and verification values remain at repository defaults. Coolify MCP is authenticated through SSH; credentials are not in this repository.

Rollback: stop the new application in Coolify if bounded production checks fail; preserve the jobs volume and logs. The former VPS is not modified. A prior successful Coolify deployment can be selected for future rollbacks.

## Status

**DEPLOYED AND HEALTHY** under the owner-directed expedited VPS deployment. Deployed application revision: `fe1c4cfb5cd8d4d9ed5dd68bd1590b5f41c5c737`. Coolify deployment UUID: `lcyqiilgiz2hmautozqsrzxk`, status `finished`. Both production containers are healthy. The health endpoint returned HTTP 200 through the public-host reverse-proxy route with an explicit origin override (public DNS/TLS remains pending). The patched staging stack and actual production containers both passed bounded upload, processing, JPEG metadata/dimensions, authenticated download, unauthorized-access rejection, and deletion checks. Temporary validation services and their test-only volume were removed after verification. Production storage is preserved.

DNS is explicitly owner-managed and deferred. No claim is made that the historical full local gate passed. Full-gate readiness remains unverified; the owner requested expedited deployment instead.
