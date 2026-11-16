# Phase 05 — Production readiness and portfolio preparation

Audit completed on 16 November 2026. MONO remains an original concept project, with its React / Vite architecture, procedural keyboard, seven-layer construction, signature key, lighting wave, and final CTA preserved. No new dependency, renderer, product feature, Git commit, remote, push, release, or deployment is introduced.

## Audit decisions and changes

| Area | Finding and action |
| --- | --- |
| GPU scheduling | Scroll sampling and R3F resize measurement could still render the canvas while fully offscreen. `ProductScene` gates invalidation by visibility / context, switches the offscreen frame loop to `never`, and restores demand rendering with the current deterministic pose on re-entry. |
| Shared resources | Original instancing, material reuse, legend atlas, generated textures, and explicit owner cleanup are retained. Temporary stem geometry parts are disposed after merging. No visual fidelity reduction. |
| Scroll bridge | Cache the finale cue DOM reference rather than querying for it on every scroll sample. Existing ResizeObserver / RAF coalescing and ScrollTrigger cleanup remain. |
| Accessibility | Give the signature diagram an explicit named group role; add an informative no-JavaScript description. Existing native links, focus indicators, reduced-motion policy, and SVG fallbacks remain. |
| Touch compatibility | Drei attaches OrbitControls to R3F's wrapper div and sets inline `touch-action: none`. The earlier override covered only the canvas. Extend the scoped `pan-y` override to the wrapper and verify a native touch gesture directly on the interactive hero canvas. |
| Browser automation | Move proven Phase 3 / 4 assertions from machine-local scripts into `scripts/browser/`, sharing one CDP launcher / transport. Discover executable paths, isolate temporary profiles, use random ports, own server lifetime, and ignore generated reports. |
| Additional QA | Add structural accessibility, fragment validity, focus, measured-canvas touch input, offscreen scheduling, and forward / reverse editorial-gap checks. Add an optional Firefox BiDi smoke runner. |
| CI | `.github/workflows/ci.yml` installs the lockfile, runs both linters / unit tests / verified build, then Chrome suites on Ubuntu. Reports upload with seven-day retention. Read-only repository permission; no deploy step. |
| Static output | Verify relative asset references, metadata, the shipped font notice, and the dynamic scene import after every build. Preserve the relative Vite base and native fragment navigation. |
| Licensing | Include the original Space Grotesk SIL OFL notice in `public/licenses/`, copied to `dist/licenses/`. Document original assets and dependency licensing. The owner's application-license choice remains outstanding. |
| Presentation | Developer-focused README, actual browser screenshots, deployment procedure, attribution, and these notes. Historical engineering notes remain available. |

The repository began this phase with no initial commit and all source files untracked. That state was preserved. The lockfile and dependency versions were not upgraded. `npm audit` reported zero vulnerabilities across all severities at audit time. A scoped search of publication-candidate files found no common private-key, AWS access-key, or GitHub token signatures; this is not a comprehensive security certification. Local reference material, reports, profiles, dependencies, and build output remain ignored.

Modified application files are `ProductScene.jsx`, `keyboard/resources.js`, `storytelling/useSceneScroll.js`, `storytelling/Finale.jsx`, `experience.css`, and `index.html`. Tooling changes are `scripts/browser/*`, `scripts/verify-build.mjs`, `.github/workflows/ci.yml`, `package.json`, `.gitignore`, `eslint.config.js`, and `vite.config.js`. Presentation / release preparation lives in README, `docs/phase-5.md`, `docs/deployment.md`, `docs/attribution.md`, `docs/images/`, and `public/licenses/`. Existing unit tests and historical notes are retained.

## Performance and bundle audit

Chrome measurements use a 1440 × 1000 viewport, DPR 1, headless software WebGL, and a completed main frame sampled through R3F's after-frame callback. This avoids counting an environment-map subpass as the product render.

| View | Draw calls | Triangles | Phase 04 comparison |
| --- | ---: | ---: | --- |
| Hero | 38 | 72,490 | Unchanged |
| Exploded | 56 | 119,754 | Unchanged |
| Escape detail | 29 | 105,234 | Unchanged |
| Final | 38 | 72,490 | Unchanged |

The held final and exploded views produce zero additional idle frames. The new visibility test also measures zero frames for two scroll movements within the offscreen design-notes section, followed by successful scene re-entry. Counts are view-dependent; they are not whole-model polygon counts, GPU timings, or a measurement of every shadow / auxiliary pass.

DPR remains capped at 1.5, with one 1024px shadow map, one-frame 128px studio environment, no postprocessing, and no per-key lights. GPU resources remain allocated for reverse travel after first inspection; hidden allocation is deliberate reuse, not a claim of zero memory. Shader startup, high-DPR screens, font / atlas preparation, and software-renderer initialization remain costs. No CPU / GPU heap stress certification or physical-device FPS measurement was performed.

Vite's output is approximately 338 kB for the eager page module, 282 kB for the scene, 350 kB for renderer / helpers, 369 kB for Three.js core, and 31 kB CSS (uncompressed decimal units). Approximate Vite-reported gzip sizes are 116, 92, 86, 99, and 8 kB respectively. Exact Node gzip measurements and filenames are generated in `test-results/build-report.json`; compression settings can produce slightly different totals. The scene is dynamically imported, but it mounts in the hero, so the full 3D code still downloads during the initial experience. Lazy loading isolates the shell rather than eliminating that transfer.

## Accessibility audit

The code review and browser checks cover a single main landmark / h1, unique IDs, working fragment targets, named buttons, image alternatives where present, visible skip-link focus, native keyboard CTA / callout activation, target dimensions, and native vertical touch scrolling through the measured canvas. Emulated touch scrolling moved the document by 135px in both development and production checks. This is automation, not a physical touch-device result.

Calculated foreground / ink contrast ratios from the design tokens are paper **16.71:1**, muted **7.13:1**, ember **7.22:1**, and callout index **4.77:1**. These calculations cover the listed solid color pairs, not every composited, animated, disabled, or 3D surface. Decorative grids, stage indices, and leader lines are not treated as reading text. Small engineering captions and close-up legends still merit real-display review.

Reduced motion removes long chapter spacers and presents completed information without forced camera / mechanical / lighting animation. Live mode changes preserve the active construction or finale chapter. Manual orbit, component descriptions, and real anchors remain available. WebGL unavailable / lost-context states retain semantic controls and original SVG views; the failed renderer is removed. Recovery intentionally requires a reload rather than an automatic context reconstruction loop.

No screen reader, switch device, browser zoom matrix, or formal WCAG certification was performed. The structural checks complement manual assistive-technology testing; they do not replace it.

## Reproducible checks

```bash
npm ci
npm run check
npm run test:browser
```

The portable runner starts and closes its own Vite servers, runs Phase 3, 4, and 5 checks sequentially in development and production, and saves JSON / screenshots in ignored `test-results/`. It discovers common Chrome paths on Windows, macOS, and Linux; use `CHROME_PATH` for another installation. A missing browser fails explicitly. CI uses hosted Ubuntu's Chrome and software WebGL; `--no-sandbox` is restricted to the isolated CI environment. Do not use these temporary automation profiles for personal browsing.

For a focused rerun:

```bash
npm run test:browser -- --development --phase=5
npm run test:browser -- --production --phase=4
FIREFOX_PATH='/path/to/firefox' node scripts/browser/firefox.mjs
```

The original browser assertions are retained, including reverse camera / layer sampling and camera-ownership tolerances. Canvas dimensions and completed render frames are synchronized before camera measurement. Actual compact chapter layout is awaited before reduced-motion assertions. Browser fault-injection diagnostics are separated from normal operation. Generated profiles are removed after tests; no personal filesystem paths, credentials, fixed debugging ports, or private browser service are required.

## Executed validation

All final checks below ran after the visibility and touch-wrapper corrections and a clean lockfile installation.

| Check | Status and scope |
| --- | --- |
| `npm ci` | Pass; unchanged lockfile, zero reported vulnerabilities |
| Oxlint and ESLint | Pass, warnings rejected |
| Node tests | Pass, 13 / 13 |
| Vite build and output verification | Pass; relative assets, metadata, original font notice, lazy scene import |
| Phase 3 Chrome regressions | Pass, development and production; forward / reverse poses, camera handoff, callouts, navigation, reduced motion, context loss, unavailable WebGL |
| Phase 4 Chrome regressions | Pass, development and production; eleven forward states, reversal, nine viewports, both CTAs, cold links, mobile navigation, motion preferences, both fallback paths |
| Phase 5 Chrome audit | Pass, development and production; DOM semantics, fragment validity, focus, measured-canvas native touch input, and forward / reverse traversal across every chapter |
| Offscreen scheduling | Pass; zero scroll-driven frames while hidden, with successful scene re-entry (development instrumentation) |
| Firefox production smoke | Pass, Firefox 127.0; WebGL2 rendering, cold construction fragment, completed finale at 1440 × 1000, 390 × 844, 568 × 320, and primary CTA; shader warnings retained |
| Chrome binary executed | 157.0.8103.52, headless with explicit software WebGL |
| Safari / WebKit | Unavailable in the configured environment; not tested |
| Edge | Installed, not executed separately; no Edge support claim |
| Real mobile / GPU / assistive technology | Not performed |
| GitHub-hosted CI | Prepared and reviewed, not executed remotely |

The nine-size Chrome matrix is 320 × 568, 568 × 320, 320 × 740, 390 × 844, 768 × 1024, 844 × 390, 1024 × 800, 1440 × 1000, and 1920 × 1080. These are emulated viewports, not nine physical devices. Reports are `test-results/phase3-{development,production}-report.json`, `phase4-{development,production}-report.json`, `phase5-{development,production}-report.json`, `firefox-report.json`, and `build-report.json`. Phase 3 writes its complete report only after all assertions pass; the CLI exit status is authoritative.

Actual screenshot samples are included in [the README](../README.md) and [construction preview](images/mono-construction.png). Raw screenshots remain ignored. The CI action versions follow the maintainers' published examples for [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), and [artifact upload](https://github.com/actions/upload-artifact). Firefox automation uses its [native BiDi endpoint](https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection); no Selenium / Playwright dependency is installed.

Chrome normal-operation checks produced no uncaught errors, warnings, or failed responses. Deliberately disabling WebGL produces expected renderer / React-boundary diagnostics; those are not normal-operation failures. Firefox's installed 127.0 build rendered a real WebGL2 context and passed smoke checks, but its ANGLE shader compiler emitted floating-point precision / division warnings. Screenshots show a coherent product render; the warning is retained as a limitation rather than suppressed or represented as a clean console.

The GitHub-hosted workflow is prepared but was not executed remotely because no repository was published. Linux / macOS portability is implemented through platform discovery and Node APIs, not independently validated on those operating systems in this Windows session. No fake CI badge or deployed URL is included.

## Manual validation before publication

- Exercise current Firefox, Safari / WebKit, and physical iOS / Android touch devices; Firefox 127 smoke coverage is not broad current-Firefox certification.
- Profile shader startup, DPR, thermals, battery, and memory across repeated context loss / page visibility / orientation changes on real GPUs.
- Use NVDA / VoiceOver and zoom / text-size settings to validate reading order, menu behavior, controls, and small captions.
- Check both CTA destinations and cold fragments on the eventual host, including its trailing-slash subdirectory behavior and caching policy.
- Review the chosen project license, dependency notices, and any future sharing artwork before granting reuse rights.

See [deployment procedure](deployment.md) for Vercel / Netlify preparation and [attribution](attribution.md) for assets. Neither document authorizes publication.
