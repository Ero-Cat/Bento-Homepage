# Blog Editorial List Refinement

## Scope

Refine the Blog Bento content layer and remove unexplained numeric counters from Interests, Hardware, and Projects. Keep the shared Liquid Glass renderer, `GlassCard` API, Bento dimensions, and `NowPlayingCard` unchanged.

## Counter Cleanup

- Remove the `interests.length`, `hardware.length`, and `projects.length` totals from the three card headers.
- Remove the `group.items.length` total from every Hardware category, including values such as `05`.
- Do not replace the counters with badges, labels, or explanatory copy.
- Preserve meaningful project Stars/Forks, years, model numbers, and numerals inside configured content labels.

The list contents already communicate their size, so the counters add noise without helping scanning or navigation.

## Blog Direction

Use a compact Apple News-style editorial list rather than nested rounded cards.

- Add `blog` to the existing config-driven card-title contract and add a config-driven Blog header-link label; use them for all visible header copy.
- Use a plain `22px / 650 / 1.0` title and an external link with `12px / 600` text.
- Remove the decorative title icon tile.
- Separate posts with one-pixel `--glass-divider` dividers instead of borders around each row.
- Use `15px / 640 / 1.3` post titles with a single-line clamp.
- Use `12px / 500 / 1.25` metadata with an `8px` title-to-metadata gap.
- Render the category as plain `--tint-color` text without a border, background, or pill radius. It must truncate before the time or views overlap at narrow widths.
- Keep time and views in semantic tertiary text; use tint only for the category and link feedback.
- Give the views group an accessible label such as `N views`; mark the visual Eye and Arrow icons `aria-hidden`.
- Post-row hover/focus may only fade in `--glass-inner-bg` through a Framer Motion spring. It must not translate, scale, add a border, or recolor the whole row.
- The header link rests in `text-text-tertiary` and uses spring-driven tint/icon opacity feedback on hover and keyboard focus.
- Every Blog link must expose a visible `focus-visible` outline and a touch target of at least `44px` in both dimensions. Keyboard focus must receive the same material/icon emphasis as hover.
- Do not use CSS `transition-*`, `duration-*`, or `animate-pulse` in Blog. All feedback and loading motion must be spring-driven; skeletons remain static.

## Loading And Empty States

- Loading rows follow the final title/meta geometry and use restrained rounded skeleton lines only.
- The empty state remains plain semantic text with no framed placeholder.
- Existing Halo fetching, sorting, link construction, and failure behavior remain unchanged.

## Verification

- Source tests reject bare counters in the three redesigned cards.
- Counter tests target the three header length expressions and Hardware `group.items.length`, without rejecting Stars/Forks or numerals inside content.
- Source tests reject Blog pills, hover borders, hover translation, and hover scale.
- Source tests reject Blog `transition-*`, `duration-*`, and `animate-pulse` utilities.
- Source tests require config-driven Blog header copy, a `22px` title, plain-text `--tint-color` category treatment, semantic metadata colors, `--glass-divider` dividers, 44px link targets, and spring material/focus feedback.
- Source tests require an accessible views label and decorative icons hidden from assistive technology.
- Run unit tests, lint, static build, and `git diff --check`.
- Visually inspect light and dark modes at `1440px`, `768px`, and `390px`; titles, categories, metadata, and view counts must not overlap or escape the Blog Bento.
- Update `README.md` and `AGENTS.md` to remove the obsolete counter requirement and document the Blog editorial-list interaction boundary.
