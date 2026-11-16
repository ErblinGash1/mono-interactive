# Phase 04 — Cinematic finale and premium polish

MONO retains the original React / Vite architecture, 82-key model, seven-layer construction, graphite / ember identity, and existing overview and design notes. This phase adds a signature Escape-key study, an instanced lighting wave, and a final product composition with working native CTAs. No deployment, release, commit, commercial availability, checkout, or preorder behavior is introduced.

## Integration and camera ownership

`Experience.jsx` now contains the existing `Story` component and the new `Finale` after construction. The order and content of the completed sections are unchanged. This extends the lifetime of the existing sticky visual track rather than mounting another renderer. The stage exits above the viewport as construction releases, stays outside the reading area during the overview / design notes, then enters with the finale. Intersection and document visibility continue to gate scene work.

The existing ScrollTrigger measures both chapters. It still samples the original seven-layer sequence and uses the same mutable pose buffer. `scene/finale.js` is a pure extension: it starts from the construction endpoint and writes signature-key, camera, and light channels. Construction progress remains at its assembled endpoint during the finale. There are no independently running tweens for the signature parts or light wave.

`CameraRig.jsx` remains the only camera owner. The finale supplies the same shot / bounds interface, so no second rig or competing camera animation is needed. `shots.js` adds off-center target and bound centers for the Escape-key study; the original hero and construction shots use zero centers. Smoothstep ramps and exact buffer resets make progress sampling deterministic and reversible, including jumps between distant native anchors.

## Choreography

The existing exploded chapter holds for inspection, reassembles its seven layers at progress 0.83–1, and releases toward the original overview. The finale follows those existing editorial sections.

| Finale progress | Product behavior |
| --- | --- |
| 0–0.18 | Continuous move from the assembled construction endpoint to the ember Escape key |
| 0.16–0.30 | Cap, stem, upper housing, and return spring separate |
| 0.30–0.43 | Mechanical detail hold |
| 0.43–0.57 | Signature parts reassemble |
| 0.60–0.71 | Bounded 0.13-unit key travel, spring compression, return, and restrained warm response |
| 0.69–0.92 | A narrow ember wave travels across the keyboard and fades completely |
| 0.64–0.90 | Camera widens into the final product composition |
| 0.86–0.94 | Signature copy yields to the final MONO headline |
| 0.94–1 | Final composition hold with product exploration and return links |

All seven main layers stay assembled during this close-up. The Escape key is selected from the original layout by ID and retains its original cap geometry, accent color, and legend atlas rectangle. Its cap and legend matrices move together. The stem, housing, and spring update the corresponding existing instance only. A shared spring mesh ref allows its selected instance to stretch and compress; frustum culling is disabled for that moving instance batch to prevent stale static bounds. This is an illustrative mechanism study, not a claim of a manufactured switch specification.

The original spring / housing details become visible while the signature cap is lifted. No second keyboard, duplicated detail model, new geometry factory, or extra draw call is required for the sequence. Native scrolling remains available through the canvas.

## Light and render scheduling

`keyWave` samples a compact travelling band from key position and the pure finale state. Existing instance colors receive a restrained warm mix, while the existing additive under-key pools receive per-instance intensity. Pool opacity and the existing warm fill respond slightly to the signal. The wave has exact zero strength at both boundaries; moving backward restores the original colors and materials. No per-key lights, bloom, transmission, environment recapture, or fullscreen postprocessing are added.

Signature transforms and instance colors update only when their channels change. Buffers, colors, geometry, textures, and materials are reused. `frameloop="demand"` remains in place, and neither the light wave nor keypress schedules an independent time-based render loop. The DPR cap stays at 1.5, with the original 128px baked environment and single 1024px shadow map.

## DOM, navigation, and fallbacks

`Finale.jsx` contains the signature explanation, final headline, CTA links, skip link, and concept disclosure. CSS variables coordinate text opacity with scroll without per-frame React state updates. Interactive links remain native, keyboard accessible, and visibly focused. The primary CTA returns to `#construction-inspect`; the secondary returns to `#experience`. There is no transaction or fictional availability flow.

| Fragment | Destination |
| --- | --- |
| `#finale` | Start of the signature chapter |
| `#signature-key` | Separated-key inspection hold |
| `#finale-composition` | Completed product composition |
| `#construction-inspect` | Original seven-layer inspection hold |

Anchor positions are measured against the same scroll coordinates as the scene. Initial fragments are realigned after explicit font readiness, page load, and two layout frames unless the visitor has interacted. Initial finale destinations use the sampler's measured coordinates: the cold reduced-motion test exposed a first-layout anchor offset that could otherwise land at the page bottom. Ordinary links retain native anchor history and scrolling.

Reduced motion skips camera travel, part separation, keypress, wave, and long scroll space. Both construction and finale become one viewport each, with their static product views and semantic content. A live change while inspecting the finale preserves the chapter and shows the final information; restoring motion returns to its completed hold. The signature and composition fragments converge on that accessible final view in static mode.

The scene boundary and context-loss fallback receive a separate construction-exploded flag, so the finale correctly uses the assembled original SVG rather than the seven-layer schematic. Native navigation and CTAs survive renderer failure. Context recovery requires reload, as in Phase 03.

Portrait screens stack copy, model, and actions. Short portrait framing reserves room for both text and 44px controls; short landscape uses a compact copy / actions column with the model on the right. The completed sections retain their existing responsive rules.

## Validation and measurements

`npm run check` runs Oxlint with warnings rejected, ESLint with `--max-warnings 0`, all thirteen Node tests, and the Vite production build. ESLint 10 is a development-only addition specifically for the requested ESLint validation; the existing Oxlint React / Hooks checks remain. The declared Node 22 minimum is now 22.13 to match ESLint's engine requirement; `.nvmrc` remains 22.21.0. There are no new runtime dependencies.

Five new tests cover the construction-to-finale endpoint, main layer stability, signature component clearances and pre-press reassembly, continuous boundaries and exact reverse sampling, buffer identity, complete wave coverage / darkness at endpoints, and off-center camera fitting across portrait and landscape aspects. The original eight tests remain unchanged and pass.

The machine-specific native Chrome CDP harness is `.local/qa-phase4.mjs`. It uses software WebGL at DPR 1, and samples renderer counters after a requested main frame using R3F's after-frame callback. Reports and screenshots stay in ignored `.local/`. These scripts are local QA, not portable CI or real-device performance certification.

The full Phase 04 development and production browser suites passed. They cover eleven forward states and reverse travel, persistent canvas identity, responsive framing, keyboard activation of the primary CTA, the secondary CTA, mobile navigation and active-section state, cold signature / composition fragments, live and initial reduced motion, unavailable WebGL, and context loss with functioning fallback navigation. Development checks additionally compare actual camera and instance transforms; production checks exercise the built application without exposing R3F internals.

The responsive matrix is 320 × 568, 568 × 320, 320 × 740, 390 × 844, 768 × 1024, 844 × 390, 1024 × 800, 1440 × 1000, and 1920 × 1080. All retain reachable CTA controls and no horizontal page overflow. Portrait checks also verify clearance between copy, scene, and actions.

The original Phase 03 construction browser regression also passed against the completed Phase 04 application: seven forward states and reverse poses, canvas identity, camera ownership at the hero boundary, projected callouts and keyboard selection, seven responsive sizes, inspection anchors / active navigation, live and initial reduced motion, cold links, mobile menu navigation, context loss with chapter release, and unavailable-WebGL controls. The local harness now waits for committed canvas dimensions plus a completed frame before camera sampling, and for the actual compact chapter height before reduced-motion assertions. Continuity tolerances remain unchanged. No application source fixes were needed in this final continuation.

| Final validation | Result |
| --- | --- |
| Oxlint and ESLint, warnings rejected | Pass |
| All 13 automated tests | Pass |
| Fresh Vite production build | Pass, no bundle warnings |
| Complete Phase 04 development browser suite | Pass |
| Complete Phase 04 production browser suite | Pass |
| Phase 03 construction browser regression | Pass |
| Normal browser diagnostics | No uncaught errors, warnings, or failed requests |

| State, 1440 × 1000 / DPR 1 | Draw calls | Triangles |
| --- | ---: | ---: |
| Hero | 38 | 72,490 |
| Seven-layer exploded view | 56 | 119,754 |
| Separated Escape-key hold | 29 | 105,234 |
| Keypress close-up | 24 | 70,554 |
| Travelling wave, progress 0.78 | 35 | 72,350 |
| Final composition | 38 | 72,490 |

Hero and exploded counts match the Phase 03 baseline. The close-up enables existing switch details, while camera frustum culling changes which other parts are drawn; these figures are view-dependent rather than whole-model polygon counts. The held final composition produced **zero additional idle frames** during the one-second sample. Geometry / textures remain owned for reuse after inspection. There are no added runtime dependencies, lights, shadow maps, postprocessing passes, or changes to the DPR cap.

Normal operation in both Phase 04 suites produced no uncaught errors, console warnings, or failed responses. The deliberate unavailable-WebGL test emits an expected `WEBGL_lose_context` teardown warning, recorded separately from normal diagnostics. Context loss removes the failed renderer and preserves the assembled SVG finale and working construction CTA.

These are renderer counters from headless Chrome software WebGL, not real-device FPS, GPU timing, thermal, battery, or all-pass measurements. Startup shader compilation remains a cost. Production intentionally omits internal instrumentation; detailed frame and transform measurements come from the development build. Raw reports are `.local/phase4-development-report.json` and `.local/phase4-production-report.json`; screenshots use the matching `phase4-` prefix.

The refreshed construction regression report is `.local/phase3-development-report.json`. Validation was completed locally without creating commits, pushing, deploying, or adding dependencies in this continuation.

## Source map

| Area | Files |
| --- | --- |
| Chapter composition and navigation | `app/App.jsx`, `experience/Experience.jsx`, `content/navigation.js` |
| Pure finale state and off-center fitting | `scene/finale.js`, `sequence.js`, `shots.js` |
| Original instanced mechanism and light response | `keyboard/KeyboardModel.jsx`, `InternalLayers.jsx`, `scene/StudioLighting.jsx` |
| Scroll, text, anchors, responsive finale | `storytelling/useSceneScroll.js`, `Finale.jsx`, `finale.css` |
| Correct assembled / exploded fallback selection | `SceneStage.jsx`, `ProductScene.jsx` |
| Verification and project notes | `tests/finale.test.js`, `eslint.config.js`, `package.json`, `package-lock.json`, README, these notes, Phase 03 cross-reference |

## Remaining work

Before publication, profile physical mobile / desktop GPUs, high-DPR screens, touch input, background tabs, thermals, Safari, and Firefox. Convert the machine-specific browser harness into portable CI coverage. Review the low-resolution close-up legends and procedural material detail on real displays before increasing texture or geometry budgets. Keep any future quality tiers behind measured budgets rather than adding unconditional effects. Deployment automation, sharing artwork, and the owner's license decision remain separate work.
