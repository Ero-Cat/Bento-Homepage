# Blog Editorial List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unexplained card counters and rebuild Blog as a compact Apple News-style editorial list without changing shared glass rendering or data fetching.

**Architecture:** Keep `GlassCard` as the optical shell and make every visual change inside the four content components. Extend the existing config-driven title contract for Blog, enforce the layout through source-contract tests, and preserve Halo/GitHub runtime behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12, lucide-react, Node built-in test runner.

---

## File Map

| File | Responsibility |
| --- | --- |
| `src/app/globals.test.ts` | Counter-removal, Blog layout, motion, token, and accessibility contracts. |
| `src/config/site.ts` | Config-driven Blog title and header-link copy. |
| `src/components/skills-card.tsx` | Remove the Interests total. |
| `src/components/hardware-card.tsx` | Remove header and category totals. |
| `src/components/projects-card.tsx` | Remove the Projects total while preserving Stars/Forks. |
| `src/components/blog-card.tsx` | Apple News-style editorial list, spring material feedback, semantic metadata, and accessible links. |
| `README.md`, `AGENTS.md` | Remove obsolete counter rules and document Blog interaction boundaries. |

### Task 1: Capture The Overlapping Worktree Baseline

**Files:**

- Inspect: `src/app/globals.test.ts`
- Inspect: `src/config/site.ts`
- Inspect: `src/components/skills-card.tsx`
- Inspect: `src/components/hardware-card.tsx`
- Inspect: `src/components/projects-card.tsx`
- Inspect: `src/components/blog-card.tsx`
- Inspect: `README.md`
- Inspect: `AGENTS.md`

- [ ] **Step 1: Record the pre-edit state.**

Run `git status --short --branch` and focused `git diff --` commands for all eight target files. Treat every existing hunk as user-owned and patch files in place; never replace whole files or revert unrelated hunks.

- [ ] **Step 2: Confirm protected boundaries.**

Verify the baseline contains no intended changes to `NowPlayingCard`, shaders, `GlassCard`, or Bento grid dimensions. Keep those paths untouched.

### Task 2: Remove Redundant Counters With A Focused RED/GREEN Cycle

**Files:**

- Modify: `src/app/globals.test.ts`
- Modify: `src/components/skills-card.tsx`
- Modify: `src/components/hardware-card.tsx`
- Modify: `src/components/projects-card.tsx`

- [ ] **Step 1: Write one failing counter contract test.**

Add the exact test:

```ts
test("content headers omit unexplained length counters", () => {
  const interestsSource = readFileSync(new URL("src/components/skills-card.tsx", projectRoot), "utf8");
  const hardwareSource = readFileSync(new URL("src/components/hardware-card.tsx", projectRoot), "utf8");
  const projectsSource = readFileSync(new URL("src/components/projects-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(interestsSource, /\binterests\.length\b/);
  assert.doesNotMatch(hardwareSource, /\bhardware\.length\b|\bgroup\.items\.length\b/);
  assert.doesNotMatch(projectsSource, /\bprojects\.length\b/);
  assert.match(projectsSource, /repoStats\.stars/);
  assert.match(projectsSource, /repoStats\.forks/);
});
```

- [ ] **Step 2: Run the focused test and verify RED.**

Run: `node --experimental-strip-types --test --test-name-pattern="content headers omit unexplained length counters" src/app/globals.test.ts`

Expected: FAIL on the four current length expressions.

- [ ] **Step 3: Remove only the four redundant totals.**

Remove the right-side header spans from Interests, Hardware, and Projects and the Hardware category item span. Simplify the surrounding header/category wrappers without changing card padding, grid tracks, configured content, or project stats.

- [ ] **Step 4: Run the focused test and verify GREEN.**

Run: `node --experimental-strip-types --test --test-name-pattern="content headers omit unexplained length counters" src/app/globals.test.ts`

Expected: PASS.

### Task 3: Lock Blog Data And Design Contracts With A Focused RED

**Files:**

- Modify: `src/app/globals.test.ts`

- [ ] **Step 1: Preserve Halo behavior before visual refactoring.**

Add the exact test:

```ts
test("blog editorial refactor preserves Halo data behavior", () => {
  const source = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");
  const successBlock = source.match(/\.then\(\(d: HaloResponse\) => \{[\s\S]*?\n\s*\}\)/)?.[0] ?? "";
  assert.match(source, /size=\$\{size\}&sort=spec\.publishTime%2Cdesc/);
  assert.match(successBlock, /setPosts\(d\.items \?\? \[\]\)/);
  assert.match(successBlock, /setLoading\(false\)/);
  assert.match(source, /\.catch\(\(\) => setLoading\(false\)\)/);
  assert.match(source, /href=\{`\$\{blogConfig\.url\}\$\{post\.status\.permalink\}`\}/);
});
```

- [ ] **Step 2: Add the Blog visual/accessibility contract.**

Add the exact test below. Keep the category extraction scoped so unrelated card padding or rounded skeleton lines cannot satisfy or fail the category contract.

```ts
test("blog uses an accessible Apple editorial list", () => {
  const source = readFileSync(new URL("src/components/blog-card.tsx", projectRoot), "utf8");
  const categoryBlock = source.match(/\{post\.categories\?\.\[0\][\s\S]*?displayName[\s\S]*?\n\s*\)\}/)?.[0] ?? "";
  const timeTag = source.match(/<span[^>]*>[\s\S]*?\{timeAgo\(post\.spec\.publishTime\)\}[\s\S]*?<\/span>/)?.[0] ?? "";
  const viewsTag = source.match(/<span[^>]*aria-label=\{`\$\{post\.stats\?\.visit \?\? 0\} views`\}[^>]*>/)?.[0] ?? "";
  const arrowTag = source.match(/<ArrowUpRight[^>]*\/>/)?.[0] ?? "";
  const eyeTag = source.match(/<Eye[^>]*\/>/)?.[0] ?? "";
  const motionLinkClasses = [...source.matchAll(/<motion\.a[\s\S]*?className="([^"]+)"/g)].map((match) => match[1]);
  const postLinkClass = motionLinkClasses.find((className) => className.includes("flex-1")) ?? "";

  assert.match(source, /\{cardTitles\.blog\}/);
  assert.match(source, /\{cardTitles\.blogLink\}/);
  assert.match(source, /text-\[22px\][^"\n]*font-\[650\][^"\n]*leading-none/);
  assert.match(source, /min-h-11[^"\n]*min-w-11[^"\n]*text-\[12px\][^"\n]*font-semibold[^"\n]*text-text-tertiary/);
  assert.match(source, /line-clamp-1[^"\n]*text-\[15px\][^"\n]*font-\[640\][^"\n]*leading-\[1\.3\]/);
  assert.match(source, /mt-2[^"\n]*text-\[12px\][^"\n]*font-medium[^"\n]*leading-\[1\.25\]/);
  assert.match(source, /h-px[^"\n]*var\(--glass-divider\)/);
  assert.match(categoryBlock, /min-w-0[^"\n]*truncate/);
  assert.match(categoryBlock, /color:\s*"var\(--tint-color\)"/);
  assert.doesNotMatch(categoryBlock, /\b(?:bg-|border|rounded-|p[xy]-)|background:/);
  assert.match(timeTag, /className="[^"]*shrink-0[^"]*text-text-tertiary/);
  assert.match(viewsTag, /className="[^"]*shrink-0[^"]*text-text-tertiary/);
  assert.match(arrowTag, /aria-hidden="true"/);
  assert.match(eyeTag, /aria-hidden="true"/);
  assert.doesNotMatch(postLinkClass, /\bborder(?:-|\b)/);
  assert.ok((source.match(/whileHover="hover"/g) ?? []).length >= 2);
  assert.ok((source.match(/whileFocus="hover"/g) ?? []).length >= 2);
  assert.ok((source.match(/focus-visible:outline-2/g) ?? []).length >= 2);
  assert.ok((source.match(/min-h-11/g) ?? []).length >= 2);
  assert.match(source, /type:\s*"spring"/);
  assert.match(source, /var\(--glass-inner-bg\)/);
  assert.match(source, /h-\[15px\][\s\S]*h-3/);
  assert.doesNotMatch(source, /hover:border|group-hover:text-tint|transition-|duration-|animate-pulse/);
  assert.doesNotMatch(source, /whileHover=\{\{[\s\S]*?(?:x|scale):/);
});
```

- [ ] **Step 3: Run both focused Blog tests.**

Run: `node --experimental-strip-types --test --test-name-pattern="blog (editorial refactor preserves Halo data behavior|uses an accessible Apple editorial list)" src/app/globals.test.ts`

Expected: Halo behavior test PASS; editorial-list test FAIL on the current old header, pills, borders, typography, and CSS transitions.

### Task 4: Rebuild Blog And Verify GREEN Incrementally

**Files:**

- Modify: `src/config/site.ts`
- Modify: `src/components/blog-card.tsx`

- [ ] **Step 1: Extend the config contract and replace the old header.**

Add `blog` and `blogLink` strings to `cardTitles`. Remove the icon tile; render the config-driven `22px / 650 / 1.0` title and `12px / 600` link resting in `text-text-tertiary`. Give the link `min-h-11 min-w-11`, a visible focus outline, spring-driven tint/icon opacity variants, `whileHover`, and `whileFocus`; hide the Arrow icon from assistive technology.

- [ ] **Step 2: Run the Blog editorial test and confirm it still fails only on rows.**

Run: `node --experimental-strip-types --test --test-name-pattern="blog uses an accessible Apple editorial list" src/app/globals.test.ts`

Expected: FAIL on row typography/material/category/loading assertions, not header assertions.

- [ ] **Step 3: Replace framed rows with divided editorial rows.**

Render one-pixel `--glass-divider` separators. Use single-line-clamped `15px / 640 / 1.3` titles and `mt-2 text-[12px] font-medium leading-[1.25]` metadata. Make category `min-w-0 truncate` with inline `color: var(--tint-color)`; keep time/views shrink-resistant and in `text-text-tertiary`. Give the views group an `N views` label and hide the Eye icon.

- [ ] **Step 4: Run the Blog editorial test and confirm it still fails only on motion/loading.**

Run the same focused command.

Expected: FAIL on material-motion and static-skeleton assertions only.

- [ ] **Step 5: Add spring-only material feedback.**

Fade a `--glass-inner-bg` layer through Framer Motion `rest`/`hover` variants for pointer hover and keyboard focus. Keep row links at least 44px high with focus outlines. Remove every CSS transition/duration utility and avoid movement, scale, borders, or whole-row recoloring.

- [ ] **Step 6: Run the Blog editorial test and isolate the final RED.**

Run the same focused command.

Expected: FAIL only on static skeleton geometry or `animate-pulse` removal.

- [ ] **Step 7: Align loading and empty states.**

Use static `h-[15px]` title and `h-3` metadata skeleton lines with the same row padding/gap as final content; remove `animate-pulse`. Preserve the plain empty state and all locked Halo behavior.

- [ ] **Step 8: Run both focused Blog tests and verify GREEN.**

Run: `node --experimental-strip-types --test --test-name-pattern="blog (editorial refactor preserves Halo data behavior|uses an accessible Apple editorial list)" src/app/globals.test.ts`

Expected: both PASS.

### Task 5: Documentation And Full Verification

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Synchronize documentation.**

Remove the obsolete numeric-counter requirement and document the Blog editorial-list typography, plain category treatment, spring material feedback, and accessibility boundary.

- [ ] **Step 2: Run automated verification.**

Run: `pnpm test:unit`, `pnpm lint`, `pnpm build`, and `git diff --check`.

Expected: 0 test failures, 0 lint errors, successful static export, and no whitespace errors. Existing unrelated image warnings may remain.

- [ ] **Step 3: Run browser verification.**

Use the existing local server at `http://localhost:3000/` (start it if unavailable). Capture screenshots in light and dark `color-scheme` at 1440px, 768px, and 390px. For all six combinations, check `scrollWidth <= clientWidth`, Blog element bounds stay inside the card, category text truncates before time/views overlap, and the shared Liquid Glass dataset reaches `ready`. Use keyboard Tab to verify both the header link and a post link show focus outlines and focus-equivalent material/icon emphasis. Measure link bounding rectangles and require at least 44px height; the compact header link must also be at least 44px wide.

- [ ] **Step 4: Preserve the worktree.**

Run the same focused `git diff --` inspection as Task 1 and compare every final hunk against the recorded baseline. Confirm pre-existing overlapping hunks remain intact and no unrelated paths changed. Leave all work uncommitted on local `main`; do not stage, merge, or push without explicit user instruction.
