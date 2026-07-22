# iOS Liquid Glass Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shared Bento `GlassCard` renderer read as layered iOS-style liquid glass with thick edge refraction, controlled desktop pointer response, and a visually aligned CSS fallback.

**Architecture:** Preserve the existing shared WebGL2 pipeline and background contract. Extend the central variant configuration and pure runtime helpers first, then feed a single active-card pointer spring into the existing main pass; card DOM and business components remain unchanged. The shader owns all lens optics, while CSS remains a readable fallback only.

**Tech Stack:** Next.js 16 static export, React 19 client boundary, TypeScript 5, WebGL2/GLSL, Tailwind CSS 4, Node built-in test runner.

---

## File Map

| File | Responsibility |
| --- | --- |
| `src/lib/liquid-glass.ts` | Shared variant optical and interaction SSoT. |
| `src/lib/liquid-glass-runtime.ts` | Pure pointer hit-test, normalization, and spring helpers. |
| `src/lib/liquid-glass.test.ts` | Contract tests for variant parameters. |
| `src/lib/liquid-glass-runtime.test.ts` | Deterministic tests for pointer interaction helpers and existing geometry. |
| `src/components/liquid-glass-canvas.tsx` | One active-card interaction lifecycle, event listeners, rAF scheduling, and uniform upload. |
| `src/shaders/glass-main.glsl` | Thick edge/bevel, refractive body, controlled color dispersion, pointer-driven glare. |
| `src/app/globals.css` | CSS-only fallback material and reduced-motion behavior. |
| `src/app/globals.test.ts` | Fallback contract assertions. |
| `README.md`, `AGENTS.md` | User-facing architecture and maintenance constraints. |

### Task 1: Add Pure Pointer Interaction Primitives

**Files:**

- Modify: `src/lib/liquid-glass-runtime.ts`
- Modify: `src/lib/liquid-glass-runtime.test.ts`

- [ ] **Step 1: Write failing tests for pointer geometry and spring behavior.**

Add tests that prove the following contract without DOM access:

```ts
const hit = resolvePointerCardHit(
  [120, 160],
  [
    { id: "panel", rect: { left: 40, top: 80, width: 240, height: 180 }, interactive: false },
  ],
);

assert.deepEqual(hit, {
  id: "panel",
  normalized: [1 / 3, 4 / 9],
  interactive: false,
});
```

Also cover: outside returns `null`; the last entry wins for an overlap; normalized values clamp to `[0, 1]`; `stepPointerSpring` moves toward a new target and settles; `resetPointerInteraction` clears hover and press state.

- [ ] **Step 2: Run the focused test file and verify the new tests fail.**

Run: `pnpm exec node --experimental-strip-types --test src/lib/liquid-glass-runtime.test.ts`

Expected: FAIL because the new helpers are not exported.

- [ ] **Step 3: Implement the minimal pure helpers.**

Add explicit interfaces for cached hit-test entries and pointer spring state. Implement:

```ts
resolvePointerCardHit(pointerClient, entries): PointerCardHit | null
stepPointerSpring(state, deltaMs, stiffness, damping): PointerSpringState
pointerSpringIsSettled(state, epsilon?): boolean
resetPointerInteraction(state): PointerInteractionState
```

Use cached client-space rects supplied by the caller. `stepPointerSpring` must use the same semi-implicit spring integration style as `stepScrollFollowMotion`, clamp `deltaMs` to avoid tab-resume explosions, and never mutate input objects.

- [ ] **Step 4: Run the focused test file and verify it passes.**

Run: `pnpm exec node --experimental-strip-types --test src/lib/liquid-glass-runtime.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the pure runtime change.**

```bash
git add src/lib/liquid-glass-runtime.ts src/lib/liquid-glass-runtime.test.ts
git commit -m "feat: add liquid glass pointer runtime helpers"
```

### Task 2: Define Layered Variant Tokens

**Files:**

- Modify: `src/lib/liquid-glass.ts`
- Modify: `src/lib/liquid-glass.test.ts`

- [ ] **Step 1: Write failing variant contract tests.**

Assert every variant exposes these centralized concepts: `bevelWidth`, `magnification`, `surfaceBlurMix`, `counterRimFactor`, `pointerRefraction`, `pointerGlare`, and `pressDepth`.

Assert the agreed intensity hierarchy rather than exact magic numbers:

```ts
assert.ok(GLASS_VARIANTS.immersive.bevelWidth >= GLASS_VARIANTS.hero.bevelWidth);
assert.ok(GLASS_VARIANTS.hero.pointerRefraction > GLASS_VARIANTS.panel.pointerRefraction);
assert.ok(GLASS_VARIANTS.panel.pointerRefraction > GLASS_VARIANTS.dense.pointerRefraction);
assert.ok(GLASS_VARIANTS.media.surfaceBlurMix <= GLASS_VARIANTS.panel.surfaceBlurMix);
assert.equal(GLASS_VARIANTS.dense.pressDepth, 0);
```

- [ ] **Step 2: Run the focused test file and verify it fails.**

Run: `pnpm exec node --experimental-strip-types --test src/lib/liquid-glass.test.ts`

Expected: FAIL because the new config fields are absent.

- [ ] **Step 3: Extend `GlassVariantConfig` and `GLASS_VARIANTS`.**

Keep old names only when they still describe a meaningful shader input; otherwise replace a single-purpose legacy field with the new semantic field and update its only consumer in the next task. Use the following intended ranges:

| Variant | Bevel / pointer | Center diffusion | Press |
| --- | --- | --- | --- |
| `immersive` | strongest | medium | strongest conditional branch |
| `hero` | strong | low-medium | strong conditional branch |
| `panel` | balanced | low | modest conditional branch |
| `media` | restrained | lowest | none |
| `dense` | lowest | lowest | none |

`pressDepth` is a dormant shared-card API until an existing caller opts into `interactive`; do not modify business cards.

- [ ] **Step 4: Run the focused tests and confirm they pass.**

Run: `pnpm exec node --experimental-strip-types --test src/lib/liquid-glass.test.ts src/lib/liquid-glass-runtime.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the config change.**

```bash
git add src/lib/liquid-glass.ts src/lib/liquid-glass.test.ts
git commit -m "feat: define layered liquid glass variants"
```

### Task 3: Wire Event-Driven Pointer State into the Shared Renderer

**Files:**

- Modify: `src/components/liquid-glass-canvas.tsx`
- Modify: `src/app/entrance-animations.test.ts`
- Modify: `src/lib/liquid-glass-runtime.test.ts` (only if a discovered integration invariant can remain pure)

- [ ] **Step 1: Add failing source-contract tests for lifecycle safeguards.**

Add assertions that the canvas source:

- creates a reduced-motion media query;
- registers `pointermove`, `pointerdown`, `pointerup`, `pointercancel`, `blur`, and `pointerleave`/document-leave cleanup;
- never calls `getBoundingClientRect()` inside the pointer event handlers;
- uploads `u_pointer`, `u_pointerHover`, and `u_pointerPress` uniforms;
- removes each added listener during cleanup.

- [ ] **Step 2: Run the affected source-contract tests and verify they fail.**

Run: `pnpm exec node --experimental-strip-types --test src/app/entrance-animations.test.ts src/lib/liquid-glass-runtime.test.ts`

Expected: FAIL on missing pointer lifecycle expectations.

- [ ] **Step 3: Extend renderer state and uniform registration.**

Add the following uniforms to `mainProg`: `u_pointer`, `u_pointerHover`, `u_pointerPress`, `u_bevelWidth`, `u_magnification`, `u_surfaceBlurMix`, `u_counterRimFactor`, `u_pointerRefraction`, and `u_pointerGlare`.

Store only one active interaction state for the visible topmost card. On pointer input:

1. Project cached document rects into client space using `window.scrollX/Y` and the visual viewport offsets.
2. Call `resolvePointerCardHit`; never read layout in the event handler.
3. Update target pointer/hover/press values and request a frame.

During `render(timestamp)`, integrate the active pointer spring with `LIQUID_GLASS_CANVAS.spring`, upload the active card state only for its draw call, and use neutral values for all other cards. Continue rAF only while background transition, geometry warmup, or pointer spring is unsettled.

- [ ] **Step 4: Implement lifecycle and accessibility guards.**

- Disable pointer response when `(pointer: coarse)` or `(prefers-reduced-motion: reduce)` matches; static WebGL remains enabled.
- Re-hit-test using the last pointer location after scroll, visual viewport scroll, resize, and card geometry projection.
- Clear hover/press target on `pointercancel`, window `blur`, document hidden, unregister, and pointer leaving the document.
- Preserve the existing fallback behavior if WebGL/shader setup fails.

- [ ] **Step 5: Run focused tests and lint.**

Run: `pnpm test:unit && pnpm lint`

Expected: PASS.

- [ ] **Step 6: Commit renderer interaction wiring.**

```bash
git add src/components/liquid-glass-canvas.tsx src/app/entrance-animations.test.ts src/lib/liquid-glass-runtime.test.ts
git commit -m "feat: add shared liquid glass pointer response"
```

### Task 4: Replace the Main-Pass Optics with a Thick Glass Bevel

**Files:**

- Modify: `src/shaders/glass-main.glsl`
- Modify: `src/components/liquid-glass-canvas.tsx`
- Modify: `src/lib/liquid-glass.test.ts`

- [ ] **Step 1: Add failing source-contract tests for the upgraded shader interface.**

Verify `glass-main.glsl` declares each new uniform, preserves premultiplied-alpha output, and maintains a bounded UV sample helper. Verify the canvas registers and uploads each matching uniform.

- [ ] **Step 2: Run the focused tests and verify they fail.**

Run: `pnpm exec node --experimental-strip-types --test src/app/entrance-animations.test.ts src/lib/liquid-glass.test.ts`

Expected: FAIL on the missing shader/uniform contract.

- [ ] **Step 3: Rewrite the `main()` optical composition around three regions.**

Keep the existing rounded-rectangle SDF and derivative-based normal helpers. Replace the old narrow rim flow with:

```glsl
float edgeDepth = clamp(-d / max(u_bevelWidth * u_dpr, 1.0), 0.0, 1.0);
float outerRim = 1.0 - smoothstep(0.0, 0.28, edgeDepth);
float bevelBody = smoothstep(0.04, 0.92, edgeDepth) * (1.0 - outerRim);
```

Use `bevelBody` to build a clamped normal-based refractive offset and local magnification. Blend sharp and blurred background in the clean center with `u_surfaceBlurMix`, then apply color-channel offset only to `outerRim` and the outer bevel. Combine fixed glare, pointer-directed glare, outer Fresnel, and a subtle counter-rim darkening. Keep tint alpha low and preserve `fragColor = vec4(outColor.rgb * outColor.a, outColor.a)`.

- [ ] **Step 4: Keep shader cost bounded.**

Reuse the existing sharp and blurred textures; do not add a pass or sample a new texture. Guard RGB-separated sampling behind rim/bevel factors so the center takes the ordinary sharp/blur path. Clamp UV before all texture reads.

- [ ] **Step 5: Run automated verification.**

Run: `pnpm test:unit && pnpm lint && pnpm build`

Expected: all commands exit 0 and Next.js static export completes.

- [ ] **Step 6: Commit the optical renderer change.**

```bash
git add src/shaders/glass-main.glsl src/components/liquid-glass-canvas.tsx src/lib/liquid-glass.test.ts src/app/entrance-animations.test.ts
git commit -m "feat: render layered liquid glass optics"
```

### Task 5: Align CSS Fallback and Documentation, Then Perform Visual QA

**Files:**

- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add failing fallback tests.**

Assert fallback mode keeps a subtle translucent body, an inset directional highlight, a restrained border/shadow, and does not add hover-only DOM transforms or new shared inner-control classes. Preserve the test proving `.ios-media-card` remains untouched.

- [ ] **Step 2: Run the fallback tests and verify they fail.**

Run: `pnpm exec node --experimental-strip-types --test src/app/globals.test.ts`

Expected: FAIL on missing fallback material clauses.

- [ ] **Step 3: Tune fallback CSS without affecting ready-mode shell silence.**

Only adjust the `data-liquid-glass="fallback"` rules and existing fallback tokens. Use a low-opacity body, one inset directional highlight, border, and shadow. Do not add an extra shared component class or alter `.ios-media-card`.

- [ ] **Step 4: Update documentation.**

Document the three-zone main-pass model, centralized interaction tokens, one-active-card pointer lifecycle, coarse/reduced-motion behavior, no-React-state rule, and that `NowPlayingCard` stays a separate material. Keep both README and AGENTS consistent.

- [ ] **Step 5: Run all automated checks.**

Run: `pnpm test:unit && pnpm lint && pnpm build`

Expected: PASS.

- [ ] **Step 6: Perform browser visual QA.**

Start `pnpm dev`, then verify screenshots at 1440x900, 768x1024, and 390x844 in light and dark modes. On desktop, test slow hover, fast cross-card movement, press behavior by temporarily setting one card's `data-glass-interactive` attribute, scroll under a stationary pointer, background change, resize, and visibility restore. Confirm canvas pixels are non-transparent over a card and the canvas silhouette matches card bounds. On mobile and reduced-motion, confirm static glass stays visible and content remains readable.

- [ ] **Step 7: Commit documentation and fallback alignment.**

```bash
git add src/app/globals.css src/app/globals.test.ts README.md AGENTS.md
git commit -m "docs: describe liquid glass interaction model"
```

## Completion Gate

- All five tasks are completed in order.
- `git status --short` contains no tracked-product changes outside the task scope.
- `.superpowers/` visual companion artifacts remain untracked and are not staged.
- No business card or `NowPlayingCard` source is modified.
- Final visual QA demonstrates a thick refractive shell rather than generic blur glass.
