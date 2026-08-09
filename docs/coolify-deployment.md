# Coolify deployment

Everything below is taken from `docker-compose.yml`, `Dockerfile`, and
`apps/processor/src/config.ts`. Deploy the revision recorded in
`docs/test-evidence.md`.

## Deployment mode

Docker Compose. Point Coolify at this repository and use `docker-compose.yml` as
the compose file. Do not deploy the two images as separate applications, because
the web service resolves the processor by its Compose service name over the
internal network.

The `e2e` service sits behind the `qa` profile and never starts in a normal
deploy. Do not enable that profile in production.

## Public service and port

| Item           | Value                       |
| -------------- | --------------------------- |
| Public service | `web`                       |
| Container port | `8080`                      |
| Host mapping   | `${PUBLIC_PORT:-8080}:8080` |
| Domain         | `https://compressimage.fun` |

`web` is the only service with a published port. `processor` has no `ports` entry
and is attached to a network declared `internal: true`, so it is not reachable
from the host or the internet. Keep it that way: the processor must only be
reached through `web`, which proxies `/api/`, `/health`, and `/ready` to it.

## TLS

Coolify's proxy terminates TLS and forwards plain HTTP to port 8080. The
application does not terminate TLS and must not be configured to.

## Persistent storage

| Item           | Value            |
| -------------- | ---------------- |
| Service        | `processor` only |
| Container path | `/data/jobs`     |
| Compose volume | `jobs`           |

The volume is required. Jobs are stored on disk with a four hour lifetime, so a
container restart during that window would otherwise drop files the site promises
to keep until they expire. The directory is created in the image owned by the
`node` user, which the processor runs as. Do not mount it into `web`.

The processor's root filesystem is read only, with a small tmpfs at `/tmp`. That
is intentional. Only `/data/jobs` needs to be writable.

## Health

| Item          | Value             |
| ------------- | ----------------- |
| Health path   | `/health`         |
| Expected body | `{"status":"ok"}` |

Configure Coolify's health check against `/health` on the `web` service. It is a
liveness probe: constant response, no dependencies, no authentication.

`/ready` additionally confirms the temporary storage directory is reachable and
reports queue depth. It is useful for debugging and for orchestrators that
distinguish readiness from liveness, but Coolify only needs `/health`. Both
Compose services already define their own `HEALTHCHECK`, and `web` waits for
`processor` to report healthy before it starts.

## Environment variables

All processing variables are optional and fall back to the defaults below, which
are the values the release was tested with. Set them only to change behaviour.

| Variable                          | Default      | Meaning                                           |
| --------------------------------- | ------------ | ------------------------------------------------- |
| `PUBLIC_PORT`                     | `8080`       | Host port mapped to the web container             |
| `FILE_TTL_SECONDS`                | `14400`      | Temporary file lifetime, four hours. Minimum 60   |
| `TEMP_STORAGE_DIR`                | `/data/jobs` | Must match the volume mount                       |
| `PROCESS_CONCURRENCY`             | `2`          | Jobs processed at once. Maximum 8                 |
| `SHARP_CONCURRENCY`               | `2`          | libvips threads per job. Maximum 8                |
| `MAX_UPLOAD_BYTES`                | `104857600`  | Per file limit, 100 MB                            |
| `MAX_BATCH_BYTES`                 | `524288000`  | Total batch limit, 500 MB                         |
| `MAX_BATCH_FILES`                 | `50`         | Files per batch. Maximum 200                      |
| `MAX_IMAGE_PIXELS`                | `100000000`  | Pixel safety limit, 100 MP                        |
| `MAX_ANIMATION_FRAMES`            | `500`        | Frame safety limit                                |
| `PROCESS_TIMEOUT_MS`              | `60000`      | Per file timeout. Minimum 1000                    |
| `MIN_FREE_DISK_BYTES`             | `1073741824` | Uploads are refused with 503 below 1 GB free      |
| `PUBLIC_GA_MEASUREMENT_ID`        | empty        | Build time. Leave empty until analytics is wanted |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | empty        | Build time, optional                              |
| `PUBLIC_BING_SITE_VERIFICATION`   | empty        | Build time, optional                              |

The three `PUBLIC_` values are read when the static site is built, so changing
them requires a rebuild, not just a restart. Leaving `PUBLIC_GA_MEASUREMENT_ID`
empty is supported: no analytics request is made and no console error appears.

On the intended 4 vCPU and 16 GB host, keep `PROCESS_CONCURRENCY` and
`SHARP_CONCURRENCY` at 2. Two jobs times two libvips threads matches the core
count and leaves the queue responsive. Raising both to 4 oversubscribes the CPU
during AVIF work, which is by far the most expensive operation.

## After deploying

Run these once against the live domain:

1. `GET /health` returns `{"status":"ok"}`.
2. The homepage loads and the uploader is visible.
3. Compress one real photograph and download the result.
4. Upload one iPhone HEIC and confirm it converts.
5. Use Delete now and confirm the result link stops working.
6. Confirm `https://compressimage.fun/robots.txt` and `/sitemap-index.xml` are reachable.

## Rollback

Keep the previous image reference. If startup, health, storage permissions,
processing, download, or deletion fails, preserve the logs, restore the previous
revision, and leave the `jobs` volume untouched. Fix application logic in the
repository, never inside the running container.
