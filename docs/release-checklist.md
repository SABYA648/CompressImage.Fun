# Release checklist

## Local Docker automated gate

- [x] Fresh dependency install and clean multi-target Docker build
- [x] Type check, lint, format check, content lint, and unit/security tests
- [x] Static build with expected route and bundle output
- [x] Compose web and processor health checks
- [ ] Smart, exact target, resize, crop, converter, metadata, Base64, ZIP, chaining, download, and Delete now flows
- [ ] Invalid token, fake MIME, corrupt file, unsafe SVG, traversal filename, oversize, and unsupported format boundaries
- [ ] TTL startup and periodic deletion
- [ ] SEO crawl and real 404
- [ ] Playwright desktop/mobile/keyboard and no-overflow checks
- [ ] Compression and exact-size benchmarks
- [ ] Eight-job queue/concurrency probe under representative limits
- [ ] Lighthouse for homepage, exact-size, resize, Base64, guide, and tools index
- [x] Final repository sweep and Git status

## Final Coolify deployment gate

- [ ] Every required local check passed with recorded evidence
- [ ] No unresolved release blocker
- [ ] Immutable source revision recorded
- [ ] Environment variables enumerated without secret values
- [ ] `/data/jobs` persistent volume and node-user permissions documented
- [ ] `/health` and `/ready` health behavior documented
- [ ] Rollback procedure documented
- [ ] Handoff says `READY FOR COOLIFY DEPLOYMENT`
- [ ] Owner explicitly authorized deployment

## Post-deployment manual owner steps

- Verify domain, TLS, apex/www behavior, and mobile upload on real iPhone and Android devices.
- Process a real iPhone HEIC and Android JPEG, then verify Delete now and volume permissions.
- Add optional analytics and webmaster verification IDs.
- Register search tools, submit sitemap, and monitor initial jobs, disk, failures, and Core Web Vitals.
