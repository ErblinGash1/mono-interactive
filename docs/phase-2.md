# Phase 02 — Premium product hero

Historical Phase 02 snapshot. The internal construction and scroll sequence described as future work here are implemented in [Phase 03](phase-3.md).

## Reference analysis

The supplied Vibetyper prompt is a technical and visual reference. MONO retains its original brand, typography, color tokens, React / Vite JavaScript architecture, Tailwind integration, document flow, and responsive shell.

| Reference element | MONO decision |
| --- | --- |
| Rounded, tapered, dished keycap construction | Adapted into a reusable geometry factory with a closed upper surface and consistent corner radii across key sizes |
| Batching caps by physical size | Reused as a technique; the original 82-key layout is grouped into shared instanced meshes |
| Per-key legend atlas | Adapted into one local CanvasTexture and one small, isolated UV shader patch |
| PBT, anodized metal, smoked switches | Adapted into shared physically based materials with deterministic micrograin |
| Black studio room and softboxes | Adapted with Drei Environment / Lightformer, baked once at low resolution |
| Camera shot parameters | Adapted into reusable azimuth, elevation, roll, FOV, and pullback values with tested frustum fitting |
| Hero pointer lean and per-key lift | Reimplemented with mutable refs, analytic local-plane picking, and capped spring substeps |
| Long board fly-through and raining keycaps | Replaced with a short hero camera arc; no page-locking preloader |
| Fixed fullscreen canvas and 1100vh scroll spacer | Deferred; existing semantic document flow is preserved |
| Seven-layer split, callouts, accept-key explosion, final light flood | Deferred to later phases |
| TypeScript rewrite, new fonts, exact dependency replacement | Omitted; the established JavaScript stack and MONO identity are preserved |
| N8AO, motion blur, depth of field, grain and fullscreen bloom | Omitted from this phase to control GPU cost |
| Postprocessing tone mapping | Adapted to the renderer's ACES filmic tone mapping, without another fullscreen pass |

The provided images are a legend atlas, PCB image, battery label, light pool, grain normal map, and smudge map. The PCB and battery label serve the later interior sequence. The reference describes CORS access but does not supply redistribution terms for those images. None are downloaded or bundled. MONO generates its own legend atlas, micrograin data, light pool, and static SVG fallback. No external HDR environment is loaded. Fontsource remains the existing self-hosted font source and retains its own license.

## Scene architecture

- **ProductScene** owns the Canvas, input refs, motion preference, visibility, controls, and expected context-loss fallback.
- **KeyboardModel** creates GPU resources inside an effect after the local font is ready. Cancellation guards prevent late allocations after unmount; cleanup disposes shared textures, materials, and geometries. React Three Fiber continues to own the renderer and instance buffers.
- **layout.js** defines the original 75% ANSI-inspired key layout, pitch, gap, encoder position, and assembled layer heights.
- **geometry.js** builds beveled rounded slabs, the case rim, and sculpted keycaps. Wider keys get their own geometry rather than stretched corners.
- **textures.js** builds a shelf-packed atlas, seeded surface grain, and a small under-key light texture.
- **resources.js** centralizes shared materials and size batches. All legends share one texture and one draw call.
- **StudioLighting** provides the baked studio environment, a shadow-casting key, cool rim, warm fill, and transparent grounding shadow.
- **CameraRig** animates a plain shot object with GSAP, fits every corner to the canvas aspect ratio, and hands camera ownership to OrbitControls after the reveal.

The named groups `Case`, `Plate`, `Switches`, `Keycaps`, and `Legends` are model extension points. The camera shot module is independent of React. Future scroll timelines should write camera shot and layer pose channels through a single owner, rather than attaching a second animation loop or renderer.

The only shader customization remaps per-instance UVs into the legend atlas. It has an explicit cache key and stays beside its material. Recheck that patch when upgrading Three.js shader chunks. The existing Three.js r182 / Fiber 9 compatibility choice remains unchanged.

## Motion policy

The intro is a 2.4-second GSAP arc from a slightly lower three-quarter angle to the hero shot. It pauses when the document or scene is not visible. Shader compilation or software rendering can increase perceived startup duration; scrolling is never locked.

Mouse input is normalized against the canvas, rather than the whole window. The product leans by only a few degrees. An analytic ray is transformed into the keyboard frame and intersected with the keytop plane; caps and their neighbors rise subtly on damped springs. The implementation reuses scratch math objects and instance buffers. Capped substeps keep integration stable on slow frames, and an idle interval is not integrated as one large physics step.

There is no perpetual idle float. Once the intro and springs settle, demand rendering stops. Automatic rotation remains opt-in and pauses offscreen / in background tabs.

Reduced-motion changes skip or cancel the camera flight, reset pointer motion, disable automatic rotation and damping, and preserve manual inspection. Touch interaction retains vertical native scrolling through the canvas.

## Rendering budget and limitations

- Device pixel ratio capped at **1.5**.
- **128px** environment capture, **one frame** per scene mount.
- **One 1024 × 1024** shadow map.
- Shared geometry / materials, instanced caps, switch housings, stems, pools, and dial knurling.
- One **2048 × 1024** legend atlas, one **256 × 256** surface map, and one **64 × 64** light-pool texture.
- No per-key point lights, transmission passes, live environment recapture, fullscreen effects, external texture requests, or new dependencies.

A development Chrome WebGL snapshot reported **37 draw calls, 68,594 triangles, 45 geometries, and 9 renderer textures**. These are renderer-reported scene statistics, not a real-device FPS guarantee. Shader startup, antialiasing, the single shadow pass, and high-DPR screens remain the main costs. Low-end mobile GPUs may benefit from reducing the DPR cap to 1 or the shadow map to 512 after physical-device measurements.

This is an assembled hero model. Hidden PCB traces, batteries, switch springs, contact pins, and full stabilizers are intentionally not modeled yet. Material micrograin is procedural rather than scanned; advanced AO, DOF, and bloom remain optional future quality tiers.

## Verification

`npm run check` runs Oxlint with warnings rejected, the built-in Node test runner, and the production build.

The geometry suite verifies:

1. All 82 keys are unique, remain inside the case, and have physical clearance from every neighbor.
2. Standard, function, modifier, and spacebar geometries have finite normals, an upward-facing closed top, and a genuinely dished center.
3. Both camera shots keep every keyboard corner inside portrait, tablet, and landscape frustums.

Local browser QA inspects the actual render, camera flight, cursor lift / lean, settling and demand-render idle behavior, reset / rotate controls, mobile navigation, responsive widths, live and initial reduced-motion settings, unavailable WebGL, and interrupted contexts. Development checks confirmed a real camera displacement, key lift / lean, spring settling, and zero additional frames during an idle sampling interval. Normal application operation produced no uncaught errors, console warnings, or failed requests; deliberately disabling WebGL can produce a Three.js context-extension warning during renderer teardown. Its scripts and screenshots stay in the ignored `.local/` directory. Safari, Firefox, physical touch devices, thermal behavior, and real-GPU FPS still need broader validation.

## Next phase

Build the actual hidden internal layers before animating an exploded assembly. Add explicit layer pose channels, reversible ScrollTrigger choreography, anchored callouts, and dedicated camera detail shots. Keep a single camera owner and the existing fallback / motion policy. The final CTA light sequence belongs to that later storytelling pass.
