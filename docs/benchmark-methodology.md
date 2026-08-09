# Benchmark methodology

Fixtures are generated deterministically in the test container and contain no third-party copyrighted images. The corpus includes pseudo-photographic texture, flat vector-like artwork, alpha PNG, icon, safe SVG, malicious SVG, and corrupt input.

`npm run benchmark:compression` encodes the photographic and flat fixtures to JPEG, PNG, WebP, and AVIF. It records input bytes, output bytes, dimensions, codec quality, and wall-clock encode time.

`npm run benchmark:exact` runs 20 KB, 50 KB, 100 KB, 200 KB, 500 KB, and 1 MB caps against photographic and illustration classes. It records success, bytes, iterations, elapsed time, final dimensions, and quality.

Run benchmarks inside the build/processor Docker environment with the same Sharp/libvips binary and concurrency settings as release. Local machine contention can change elapsed time. Results describe this fixture set and revision only; they are not universal codec claims.
