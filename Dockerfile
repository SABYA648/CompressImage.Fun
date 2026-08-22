# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/processor/package.json apps/processor/package.json
RUN npm ci

FROM dependencies AS build
ARG PUBLIC_GA_MEASUREMENT_ID=
ARG PUBLIC_GOOGLE_SITE_VERIFICATION=
ARG PUBLIC_BING_SITE_VERIFICATION=
ENV PUBLIC_GA_MEASUREMENT_ID=$PUBLIC_GA_MEASUREMENT_ID \
    PUBLIC_GOOGLE_SITE_VERIFICATION=$PUBLIC_GOOGLE_SITE_VERIFICATION \
    PUBLIC_BING_SITE_VERIFICATION=$PUBLIC_BING_SITE_VERIFICATION
COPY tsconfig.base.json eslint.config.mjs .prettierrc.json .prettierignore ./
COPY apps ./apps
COPY scripts ./scripts
COPY tests ./tests
COPY docs ./docs
COPY README.md LICENSE THIRD_PARTY_LICENSES.md playwright.config.ts ./
COPY .github ./.github
RUN npm run build

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev

FROM nginx:1.28-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN mkdir -p /var/cache/nginx /var/run && chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:8080/health || exit 1

FROM node:24-bookworm-slim AS processor
ENV NODE_ENV=production \
    VIPS_BLOCK_UNTRUSTED=true \
    MALLOC_ARENA_MAX=2
# The bundled libvips decodes AV1 but not HEVC, so HEIC needs libheif's
# heif-convert. On Debian bookworm (libheif 1.15), libheif-examples pulls
# libheif1 which links libde265 directly — there is no separate
# libheif-plugin-libde265 package in bookworm. Newer Ubuntu splits codecs into
# plugins; if this base image ever moves past bookworm, re-check package names
# with apt-cache and confirm `heif-convert --list-decoders` lists libde265.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libheif-examples \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/processor/dist ./apps/processor/dist
COPY apps/processor/package.json ./apps/processor/package.json
RUN mkdir -p /data/jobs && chown -R node:node /data/jobs /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/processor/dist/server.js"]

FROM mcr.microsoft.com/playwright:v1.62.1-noble AS e2e
WORKDIR /app
# The QA image owns the complete local release gate. Docker CLI + Compose let
# the smoke harness verify restarts, persisted jobs, port isolation, and a
# disposable short-TTL configuration through the host Docker socket. These
# packages never enter either production image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libheif-examples libheif-plugin-x265 docker.io docker-compose-v2 \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/processor/package.json apps/processor/package.json
RUN npm ci
COPY . .
# Exact-size benchmarks and content lint inspect the same compiled processor
# module and static site shipped in production. Keep both artifacts in the QA
# image so every release command is independently reproducible.
RUN npm run build
CMD ["npm", "run", "test:e2e"]
