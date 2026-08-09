# Coolify deployment and rollback

Coolify is a final release phase. Do not use it for development, debugging, benchmarks, load tests, or incomplete QA.

## Release inputs

- The immutable Git revision recorded in `docs/test-evidence.md`
- Dockerfile targets `web` and `processor`
- The Compose service, network, health, environment, and `/data/jobs` volume contract
- Environment values based on `.env.example`; secrets or verification tokens remain outside Git

## Volume

Mount persistent storage at `/data/jobs` only in the processor. The directory must be writable by the image's `node` user and not browsable from the web service. Confirm create, download, Delete now, restart persistence, and TTL cleanup before accepting traffic.

## Health

`/health` is liveness. `/ready` checks storage access and reports safe queue counters. Route health through the public web service so the processor remains private.

## Deployment

1. Reconfirm the revision and the complete local evidence.
2. Obtain explicit owner authorization.
3. Deploy the already validated Docker/Compose contract.
4. Run bounded smoke checks only: health, homepage/assets, one compression, download/delete, headers, robots, sitemap, llms.txt, domain, and TLS.

## Rollback

Keep the previous successful image/revision reference. If startup, health, storage permissions, processing, download, or deletion fails, preserve logs, stop new traffic, restore the previous image/revision and its unchanged volume contract, then return the fix to local Docker. Never repair application logic directly in the production container.
