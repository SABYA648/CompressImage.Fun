# Third-party licenses

This inventory records major runtime components. `package-lock.json` is the exact dependency graph and should be audited before every release.

| Component  | Purpose              | License family    | Notes                                                                                                                     |
| ---------- | -------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Astro      | Static web build     | MIT               | Editorial pages and tool shells                                                                                           |
| Preact     | Interactive islands  | MIT               | Workspace and Base64 UI                                                                                                   |
| Fastify    | Processing API       | MIT               | HTTP and multipart boundary                                                                                               |
| Sharp      | Node image API       | Apache-2.0        | Uses libvips                                                                                                              |
| libvips    | Native processing    | LGPL-2.1-or-later | Dynamically used through Sharp's distribution; preserve notices and source offer obligations that apply to redistribution |
| file-type  | Magic-byte detection | MIT               | Does not replace decoder validation                                                                                       |
| exifr      | Safe EXIF parsing    | MIT               | Selected fields only are surfaced                                                                                         |
| zod        | Runtime schemas      | MIT               | Typed request boundary                                                                                                    |
| yazl       | ZIP generation       | MIT               | Streams batch results                                                                                                     |
| Nginx      | Static server/proxy  | BSD-2-Clause      | Alpine container distribution retains package notices                                                                     |
| Playwright | Browser tests        | Apache-2.0        | Development/test only                                                                                                     |
| Vitest     | Unit tests           | MIT               | Development/test only                                                                                                     |

No GPL image CLI, Oxipng, Jpegli build, or proprietary codec service is bundled in this pass. HEIC/AVIF availability depends on the codec support shipped by the pinned Sharp/libvips binary for the target platform.
