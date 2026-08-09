# Product case study

## Problem

Online image workflows are fragmented across compression, resizing, format conversion, privacy inspection, and developer utilities.

## Thesis

One excellent no-login tool suite can make common image tasks immediate.

## Core product decisions

- The compressor is the homepage because the highest-value task should not sit behind navigation.
- Exact Size accepts the user's real constraint and measures encoded outputs.
- One shared workspace prevents behavior drift between dozens of tools.
- Temporary server processing supports native codecs and controlled batch work.
- Base64 stays in the browser because native processing adds no value to that workflow.
- Tool chaining makes a completed image the start of the next operation.
- A route registry assigns search intent and prevents arbitrary page generation.

## Infrastructure constraint

The target is one four-core, 16 GB VPS. Two active jobs and two Sharp threads avoid obvious oversubscription. Queueing absorbs bursts. Native image work stays outside browser bundles, and local volume storage avoids premature distributed systems.

## Tradeoffs

Server processing requires honest upload language and cleanup engineering. AVIF is useful but CPU-heavy. Exact-size compression costs multiple bounded encodes. Animation is rejected instead of flattened until a complete frame-preserving path exists. AI editing is deferred because ordinary codecs solve the core job more reliably per CPU.

## Quality system

Deterministic fixtures, unit/security tests, Docker API flows, exact-target benchmarks, a concurrent-job probe, SEO crawl, responsive browser tests, accessibility checks, and Lighthouse create evidence the next hardening pass can extend.
