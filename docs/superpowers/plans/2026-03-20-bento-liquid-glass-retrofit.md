# Bento Liquid Glass Retrofit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the homepage from a partial card-shell liquid-glass experiment into a coherent liquid-glass Bento system, with the grid, card shell, inner surfaces, and responsive behavior all following one visual model.

**Architecture:** Keep the existing shared `LiquidGlassCanvas` approach instead of replacing it. Extend it so the shader layer, `GlassCard` API, background source, and card internals all share the same token system and variant model. Use WebGL for outer shell optics and CSS for inner content surfaces, chips, dividers, and media masks.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion 12, WebGL2, GLSL

---

## Current State Summary

- `src/components/glass-card.tsx` already registers cards with `LiquidGlassCanvas` and renders a transparent shell.
- `src/components/liquid-glass-canvas.tsx` already renders a 4-pass glass pipeline, but shader source is duplicated inline and config is global-only.
- `src/components/background-layer.tsx` drives the background slideshow, but the canvas currently discovers the active background through DOM querying instead of a stable API.
- Many cards still use old internal styling patterns: hardcoded dark fills, hover fills, gradient blocks, opaque chip backgrounds, and `overflow-hidden` on the outer shell.
- The worktree is already dirty around liquid-glass files. Implementation must build on those changes, not reset them.

## File Structure and Responsibilities

- Create: `src/lib/liquid-glass.ts`
  - Source of truth for glass variants, shared optical tokens, and helper types.
- Modify: `src/components/glass-card.tsx`
  - Expose per-card variant and DOM metadata for the canvas.
- Modify: `src/components/liquid-glass-canvas.tsx`
  - Consume shared config, read stable background source, and support per-card tuning.
- Modify: `src/components/liquid-glass-provider.tsx`
  - Pass shared glass/background context if needed.
- Modify: `src/components/background-layer.tsx`
  - Publish the active background image in a robust way.
- Modify: `src/shaders/glass-bg.glsl`
- Modify: `src/shaders/glass-vblur.glsl`
- Modify: `src/shaders/glass-hblur.glsl`
- Modify: `src/shaders/glass-main.glsl`
  - Make shader files the single source of truth and remove drift with inline strings.
- Modify: `src/app/globals.css`
  - Add liquid-glass tokens and shared inner-surface utilities.
- Modify: `src/components/bento-grid.tsx`
  - Tune grid spacing, row rhythm, and container framing for the new glass system.
- Modify: `src/app/page.tsx`
  - Rebalance card ordering/sizing only if the visual hierarchy still feels uneven after card conversion.
- Modify: `src/components/profile-card.tsx`
- Modify: `src/components/social-card.tsx`
- Modify: `src/components/skills-card.tsx`
- Modify: `src/components/projects-card.tsx`
- Modify: `src/components/friends-card.tsx`
- Modify: `src/components/weather-card.tsx`
- Modify: `src/components/now-playing-card.tsx`
- Modify: `src/components/software-card.tsx`
- Modify: `src/components/photo-stack-card.tsx`
- Modify: `src/components/map-card.tsx`
- Modify: `src/components/github-heatmap-card.tsx`
- Modify: `src/components/vrchat-status-card.tsx`
- Modify: `src/components/blog-card.tsx`
- Modify: `src/components/hardware-card.tsx`
  - Migrate each card’s internals from legacy glassmorphism fragments to liquid-glass-compatible inner surfaces.
- Modify: `AGENTS.md`
- Modify: `README.md`
  - Sync docs after implementation is complete.

## Task 1: Stabilize the Liquid Glass Core API

**Files:**
- Create: `src/lib/liquid-glass.ts`
- Modify: `src/components/glass-card.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Audit all current `GlassCard` call sites**

Run: `rg -n "GlassCard className|<GlassCard" src/components`

Expected: list of every card using the shared shell.

- [ ] **Step 2: Create a shared variant model in `src/lib/liquid-glass.ts`**

Define:
- `GlassVariant = "hero" | "panel" | "media" | "dense" | "immersive"`
- per-variant radius, tint alpha, blur radius, glare, and inner-surface defaults
- helper for mapping card props to DOM dataset/CSS variables

- [ ] **Step 3: Extend `GlassCard` to accept explicit visual variants**

Add props such as:
- `variant`
- `contentClassName`
- `innerClip`
- `interactive`

Expected result: cards stop encoding glass behavior only through raw `className`.

- [ ] **Step 4: Add shared CSS utilities for inner liquid surfaces**

Add utilities in `src/app/globals.css` for:
- inner content plates
- glass chips/tags
- glass dividers
- media masks
- icon buttons

Expected result: cards can reuse the same micro-surface language instead of inline background styles.

- [ ] **Step 5: Run lint after the API refactor**

Run: `pnpm lint`

Expected: no new lint failures from the new shared API surface.

## Task 2: Make the Shared Canvas Production-Ready

**Files:**
- Modify: `src/components/liquid-glass-canvas.tsx`
- Modify: `src/components/liquid-glass-provider.tsx`
- Modify: `src/components/background-layer.tsx`
- Modify: `src/shaders/glass-bg.glsl`
- Modify: `src/shaders/glass-vblur.glsl`
- Modify: `src/shaders/glass-hblur.glsl`
- Modify: `src/shaders/glass-main.glsl`

- [ ] **Step 1: Replace DOM-query background detection with a stable background source**

Current problem:
- `LiquidGlassCanvas` reads the active background via `document.querySelector(...)` and computed style lookup.

Plan:
- have `BackgroundLayer` publish the active image URL through context, a data attribute, or a CSS custom property
- have the canvas read that stable source instead of querying layout structure

- [ ] **Step 2: Move shader source of truth out of inline template strings**

Plan:
- import the existing `src/shaders/glass-*.glsl` files into `liquid-glass-canvas.tsx`
- delete duplicated inline shader bodies after parity is confirmed

Expected result: future shader tuning happens in one place.

- [ ] **Step 3: Support per-card optical tuning**

Plan:
- read per-card dataset/CSS variables from `GlassCard`
- allow radius/tint/blur/glare differences between `hero`, `panel`, `media`, and `dense`

Expected result: the profile hero card and tiny utility cards stop feeling like the same glass slab.

- [ ] **Step 4: Add graceful fallback for WebGL2-unavailable paths**

Plan:
- keep content readable even when the canvas does not initialize
- fall back to CSS-based glass shell tokens rather than a transparent card

- [ ] **Step 5: Verify render loop performance and resize correctness**

Run:
- `pnpm dev`
- resize desktop window
- inspect mobile responsive mode

Expected: no lag spikes from resize, no stale card rects, no broken background texture after slideshow transitions.

## Task 3: Convert Simple Cards to the New Inner-Surface Language

**Files:**
- Modify: `src/components/profile-card.tsx`
- Modify: `src/components/social-card.tsx`
- Modify: `src/components/skills-card.tsx`
- Modify: `src/components/projects-card.tsx`
- Modify: `src/components/friends-card.tsx`
- Modify: `src/components/hardware-card.tsx`

- [ ] **Step 1: Assign each card a `GlassCard` variant**

Recommended first pass:
- `ProfileCard`: `hero`
- `SocialCard`: `dense`
- `SkillsCard`: `dense`
- `ProjectsCard`: `panel`
- `FriendsCard`: `panel`
- `HardwareCard`: `panel`

- [ ] **Step 2: Replace ad hoc chip/button backgrounds with shared utilities**

Current examples:
- `pill-tag`
- social icon inline `background`/`borderColor`
- project tag badges

Expected result: chips and icon buttons feel like one family.

- [ ] **Step 3: Remove hover fills that fight the glass read**

Current example:
- `ProjectsCard` uses `hover:bg-[rgba(var(--tint-rgb),0.06)]`

Plan:
- replace flat fill hover with scale, border-energy, or highlight-motion cues

- [ ] **Step 4: Tighten internal spacing for liquid-glass density**

Apply the AGENTS compactness rule consistently:
- `gap-3 md:gap-4`
- avoid dead space in vertically centered cards

- [ ] **Step 5: Verify that the top section already looks coherent before moving on**

Run: `pnpm dev`

Expected: `Profile`, `VRChat`, `NowPlaying`, `Skills`, `Social`, and `Friends` read as one liquid-glass cluster instead of mixed styles.

## Task 4: Refactor Media-Heavy Cards Without Breaking Clipping

**Files:**
- Modify: `src/components/now-playing-card.tsx`
- Modify: `src/components/software-card.tsx`
- Modify: `src/components/photo-stack-card.tsx`
- Modify: `src/components/map-card.tsx`

- [ ] **Step 1: Move outer-shell clipping concerns into inner wrappers**

Current problem:
- some cards still place `overflow-hidden` on the outer `GlassCard`

Plan:
- keep the outer shell responsible for registration and geometry
- move clipping to child wrappers using `borderRadius: inherit`

- [ ] **Step 2: Convert hardcoded fills into liquid-compatible inner surfaces**

Current examples:
- `NowPlayingCard` hardcodes `rgb(30,30,30)`
- `SoftwareCard` still reads as a flat macOS window shell instead of a glass window

Plan:
- keep the content concept
- re-skin the internal paneling with liquid-glass utilities

- [ ] **Step 3: Preserve media readability**

For:
- album art
- photos
- map tiles
- app icon grid

Plan:
- use glass overlays and content backplates where text/icons sit on top of media
- do not let the outer shell effect compete with the media content

- [ ] **Step 4: Validate interaction and motion after refactor**

Check:
- music controls remain clickable
- map gestures still work
- photo stack expand/collapse still feels smooth

- [ ] **Step 5: Run lint**

Run: `pnpm lint`

Expected: no regressions introduced by wrapper and clip refactors.

## Task 5: Rework Atmosphere-Driven Cards to Fit the New System

**Files:**
- Modify: `src/components/weather-card.tsx`
- Modify: `src/components/github-heatmap-card.tsx`
- Modify: `src/components/vrchat-status-card.tsx`
- Modify: `src/components/blog-card.tsx`

- [ ] **Step 1: Decide which backgrounds remain atmospheric and which must become glass-backed**

Guidance:
- `WeatherCard` can keep a rich atmospheric interior, but the outer shell should still read as liquid glass
- `GitHubHeatmapCard` and `BlogCard` should move toward calmer inner panels for content legibility

- [ ] **Step 2: Replace raw Tailwind color backgrounds where they bypass the shared token system**

Current example:
- `WeatherCard` uses multiple hardcoded gradient classes

Plan:
- map those visual states into shared CSS variables or utility layers
- keep the weather mood, but make it coexist with the global liquid-glass palette

- [ ] **Step 3: Simplify legacy overlay styles**

Current examples:
- tooltip and badge backgrounds in heatmap
- old border/background combinations in status or blog rows

Expected result: denser, cleaner inner surfaces.

- [ ] **Step 4: Manually verify text contrast on both light and dark backgrounds**

Run: `pnpm dev`

Expected: all content remains readable over moving weather effects and the site background slideshow.

## Task 6: Tune Grid-Level Composition

**Files:**
- Modify: `src/components/bento-grid.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Re-evaluate whether the current row-span map still suits the upgraded liquid-glass hierarchy**

Focus:
- top fold balance
- whether hero cards get enough breathing room
- whether dense utility cards cluster too tightly

- [ ] **Step 2: Adjust container framing and spacing only if needed**

Rules:
- keep card-to-card breathing room comfortable
- keep internal padding compact
- do not increase empty space just because the effect is more decorative

- [ ] **Step 3: Re-check mobile order**

Run:
- `pnpm dev`
- responsive viewport around 390px wide

Expected: the stack order still tells a clear story and no card becomes visually noisy on small screens.

## Task 7: Final Verification and Documentation Sync

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 1: Run the full verification pass**

Run:
- `pnpm lint`
- `pnpm build`

Expected: both commands pass.

- [ ] **Step 2: Perform manual browser checks**

Check:
- desktop layout
- tablet layout
- mobile layout
- background slideshow transitions
- WebGL2-unavailable fallback path if possible

- [ ] **Step 3: Update project docs**

Document:
- the new liquid-glass architecture
- which files own the shader pipeline
- how cards opt into variants
- any new constraints for inner clipping or micro-surfaces

- [ ] **Step 4: Create a focused commit sequence**

Recommended commits:
- `feat: stabilize liquid glass core api`
- `feat: migrate simple cards to liquid glass surfaces`
- `feat: refactor media cards for liquid glass`
- `docs: sync liquid glass architecture docs`

## Notes for Execution

- Do not reset or overwrite the existing uncommitted liquid-glass foundation.
- Prefer CSS for inner surfaces and WebGL for shell optics; do not push every micro-element into the shader.
- Use the existing Bento layout as the baseline. Only change card ordering or spans if the upgraded surfaces expose a real hierarchy problem.
- Keep `GlassCard` content accessible and DOM-based; the shader layer is visual infrastructure, not the content host.
