# Blog and Hardware Content Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved soft category tinting direction to Blog and Hardware Bento content in light and dark mode without changing layout or glass rendering.

**Architecture:** Keep typography semantics on the existing text tokens, add centralized light/dark Apple system RGB tokens for Hardware category accents, and derive low-alpha surfaces locally inside `HardwareCard`. `BlogCard` continues to use the site tint and removes opacity stacking from semantic metadata.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, lucide-react, Node built-in test runner.

---

## File Map

| File | Responsibility |
| --- | --- |
| `src/app/globals.css` | Theme-aware Apple system RGB tokens. |
| `src/app/globals.test.ts` | Color-token and component source contracts. |
| `src/components/blog-card.tsx` | Blog title, metadata, category, and empty-state colors. |
| `src/components/hardware-card.tsx` | Category accent mapping and softly tinted chips. |
| `README.md`, `AGENTS.md` | User-facing and maintainer-facing color rules. |

### Task 1: Establish The Theme Color Contract

**Files:**

- Modify: `src/app/globals.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing tests for Apple system RGB tokens.**

Add a test that requires `system-blue-rgb`, `system-green-rgb`, `system-orange-rgb`, `system-purple-rgb`, `system-red-rgb`, and `system-mint-rgb` in both light and dark `:root` blocks. Assert representative light/dark values differ so the tokens cannot regress to a single-mode palette.

- [ ] **Step 2: Run the focused test and verify failure.**

Run: `node --experimental-strip-types --test src/app/globals.test.ts`

Expected: FAIL because the system-color tokens do not exist.

- [ ] **Step 3: Add the minimal centralized tokens.**

Define RGB channel tokens in `src/app/globals.css`:

```css
--system-blue-rgb: 0, 122, 255;
--system-green-rgb: 52, 199, 89;
--system-orange-rgb: 255, 149, 0;
--system-purple-rgb: 175, 82, 222;
--system-red-rgb: 255, 59, 48;
--system-mint-rgb: 0, 199, 190;
```

Override them inside dark mode with Apple's dark appearances.

- [ ] **Step 4: Run the focused test and verify pass.**

Run: `node --experimental-strip-types --test src/app/globals.test.ts`

Expected: PASS.

### Task 2: Apply The Approved B Direction

**Files:**

- Modify: `src/app/globals.test.ts`
- Modify: `src/components/blog-card.tsx`
- Modify: `src/components/hardware-card.tsx`

- [ ] **Step 1: Write failing component contract tests.**

Require `HardwareCard` to use only centralized `--system-*-rgb` accents, contain explicit `Watch` icon and system-red mappings, and contain no hardcoded HEX colors. Require Blog metadata and empty states to use text utility classes without inline `opacity` declarations.

- [ ] **Step 2: Run the focused test and verify failure.**

Run: `node --experimental-strip-types --test src/app/globals.test.ts`

Expected: FAIL on the current HEX category palette and Blog opacity stacking.

- [ ] **Step 3: Implement minimal Blog color cleanup.**

Keep title and tint roles unchanged. Replace opacity-stacked separator, view count, and empty-state styles with `text-text-tertiary`; keep hover/focus behavior and data flow unchanged.

- [ ] **Step 4: Implement minimal Hardware soft tinting.**

Import `Watch`, map every configured icon name to a centralized RGB token, and derive styles with:

```ts
background: `rgba(${accentRgb}, 0.09)`;
borderColor: `rgba(${accentRgb}, 0.18)`;
color: `color-mix(in srgb, var(--text-primary) 82%, rgb(${accentRgb}) 18%)`;
```

Use a slightly stronger translucent background for the icon. Keep chips static and preserve layout.

- [ ] **Step 5: Run the focused test and verify pass.**

Run: `node --experimental-strip-types --test src/app/globals.test.ts`

Expected: PASS.

### Task 3: Document And Verify

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Document the content-color contract.**

Record that Blog metadata uses semantic text tokens without opacity stacking and Hardware category colors come from theme-aware Apple system tokens with low-alpha local surfaces.

- [ ] **Step 2: Run automated verification.**

Run:

```bash
pnpm test:unit
pnpm lint
pnpm build
git diff --check
```

Expected: tests and build pass; lint has no new errors or warnings from modified files.

- [ ] **Step 3: Run browser verification.**

Inspect Blog and Hardware at desktop and mobile widths in light and dark mode. Confirm text contrast, restrained category color, wrapping, non-interactive chips, and unchanged Bento geometry. Check console errors.

- [ ] **Step 4: Commit only files belonging to this feature when the working tree allows isolated staging.**

```bash
git add src/app/globals.css src/app/globals.test.ts src/components/blog-card.tsx src/components/hardware-card.tsx README.md AGENTS.md docs/superpowers/plans/2026-07-22-blog-hardware-content-colors.md
git commit -m "style: refine blog and hardware content colors"
```

If pre-existing edits overlap `README.md` or `AGENTS.md`, leave the implementation uncommitted rather than staging unrelated hunks.
