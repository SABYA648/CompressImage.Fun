# Coolify deployment

Everything below is taken from `docker-compose.yml`, `Dockerfile`, and
`apps/processor/src/config.ts`. Deploy the revision recorded in
`docs/test-evidence.md`.

## Coolify project settings (exact)

| Field                   | Value                 |
| ----------------------- | --------------------- |
| Build Pack              | Docker Compose        |
| Base Directory          | `/`                   |
| Docker Compose Location | `/docker-compose.yml` |

Do not deploy the two images as separate applications. The web service resolves
the processor by its Compose service name on the default Compose network.
Do not add repository-defined custom Docker networks; Coolify manages
deployment and proxy networking.

## Domains (Coolify UI)

| Service     | Domains                         |
| ----------- | ------------------------------- |
| `processor` | blank (no domain)               |
| `web`       | `https://compressimage.fun:8080` |
| `e2e`       | blank (no domain)               |

The `:8080` in Coolify's domain field is the **internal container target port**.
It tells Coolify's reverse proxy to forward to port 8080 inside the `web`
container. It is **not** part of the public URL.

Public canonical URL remains:

`https://compressimage.fun`

Coolify must route:

Internet → Coolify proxy → `web:8080` → `processor` on the Compose network

Do not publish host port 8080 on the VPS. Production `docker-compose.yml` does
not map `0.0.0.0:8080`; `web` only exposes container port 8080 on the Compose
network. Local developers who want `http://127.0.0.1:8080` should use
`docker-compose.local.yml` (localhost-only publish).

## QA profile

The `e2e` service sits behind `profiles: [qa]` and never starts in a normal
deploy. Leave the QA profile disabled in Coolify. Do not treat `e2e` as a
required health component.

Normal `docker compose up -d` starts only `processor` and `web`.

## Persistent storage

| Item           | Value            |
| -------------- | ---------------- |
| Service        | `processor` only |
| Container path | `/data/jobs`     |
| Compose volume | `jobs`           |

Defined by Compose: `jobs` → `processor:/data/jobs`. The volume is required.
Jobs are stored on disk with a four hour lifetime, so a container restart during
that window would otherwise drop files the site promises to keep until they
expire. The directory is created in the image owned by the `node` user, which
the processor runs as. Do not mount it into `web`.

The processor's root filesystem is read only, with a small tmpfs at `/tmp`. That
is intentional. Only `/data/jobs` needs to be writable.

## Health

| Item          | Value             |
| ------------- | ----------------- |
| Health path   | `/health` on `web` |
| Expected body | `{"status":"ok"}` |

Configure Coolify's health check against `/health` on the `web` service only.
`/health` is answered locally by Nginx and does not call the processor.

`/ready` proxies to the processor and confirms the temporary storage directory
is reachable and reports queue depth. Use it for dependency diagnostics, not
for Coolify public routing health. Both Compose services define their own
`HEALTHCHECK`; `web` starts after the `processor` container exists but does not
wait for processor health.

## Network isolation

`processor` has no domain and no host port mapping. There is no separate public
processor and no `api.compressimage.fun`. Reach it only through `web`, which
proxies `/api/` and `/ready`.

## TLS

Coolify's proxy terminates TLS and forwards plain HTTP to container port 8080.
The application does not terminate TLS and must not be configured to.

## Environment variables

All processing variables are optional and fall back to the defaults below, which
are the values the release was tested with. Set them only to change behaviour.
No secrets are required.

| Variable                          | Default      | Meaning                                           |
| --------------------------------- | ------------ | ------------------------------------------------- |
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

`PUBLIC_GA_MEASUREMENT_ID` is optional and must not be required for deployment.
Leaving it empty is supported: no analytics request is made and no console error
appears.

The three `PUBLIC_` values are read when the static site is built, so changing
them requires a rebuild, not just a restart.

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
