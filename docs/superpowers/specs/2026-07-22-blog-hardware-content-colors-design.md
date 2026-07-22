# Blog and Hardware Content Color Refinement

**Date:** 2026-07-22  
**Status:** Approved for implementation planning  
**Selected direction:** B - Soft category tinting

## Goal

Refine the content colors inside `BlogCard` and `HardwareCard` so both cards feel closer to Apple system interfaces in light and dark mode. Preserve the existing Bento layout, card density, Liquid Glass shell, content, data flow, and interactions.

## Visual Direction

Use a quiet semantic hierarchy rather than broad saturated color:

- Primary content uses the existing theme-aware primary foreground.
- Supporting metadata uses the existing tertiary foreground at full token strength instead of stacking additional opacity.
- Accent colors identify meaning through small icon surfaces, category labels, and lightly tinted chip materials.
- Colored surfaces remain translucent so the Liquid Glass background continues to show through.
- Blog keeps the site rose tint as its single accent.
- Hardware keeps category-specific Apple system colors, but reduces their area and saturation.

## Token Model

Add theme-aware Apple system-color RGB tokens to `src/app/globals.css` for blue, green, orange, purple, red, and mint. Define both light and dark values following Apple system color roles. Map the `Watch` category to system red so every configured hardware category has an explicit accent.

`HardwareCard` maps configuration icon names to those centralized RGB tokens. It may derive translucent backgrounds, borders, and softly mixed foregrounds from the RGB tokens, but must not contain hardcoded HEX colors.

Blog continues to use the existing `--tint-color`, `--tint-rgb`, and text tokens. No blog-specific global color system is required.

## Blog Card

- Keep the header title and post titles on `--text-primary`.
- Keep the book icon and category badge on the site tint.
- Use `--text-tertiary` directly for publish time, separators, view count, empty state, and the "全部" action.
- Remove nested opacity values that currently make metadata muddy on image backgrounds.
- Preserve the current hover behavior, focus ring, loading skeleton, API request, and list motion.

## Hardware Card

- Keep one Apple system accent per category.
- Use the category accent at full semantic strength on the category icon and at a restrained strength on the category label.
- Use a low-alpha category tint for chip backgrounds and borders.
- Mix chip text primarily from the theme foreground with only a small amount of the category accent so labels remain readable.
- Add the missing `Watch` icon/color mapping already referenced by `siteConfig.hardware`.
- Preserve item order, wrapping, divider spacing, and static informational behavior. Chips must not gain hover scale, glow, or button affordances.

## Accessibility And Modes

- Light and dark mode receive separate system-color values.
- Primary labels must remain readable over busy backgrounds.
- Metadata must not rely on opacity below the semantic text token.
- Information chips remain non-interactive.
- No color is the sole carrier of essential information; category text remains visible.

## Scope Exclusions

- No changes to `GlassCard`, shaders, shared Liquid Glass variants, Bento sizing, or `NowPlayingCard`.
- No changes to Blog or Hardware configuration data.
- No new animation or interaction system.
- No new shared chip or pill component.

## Verification

- Add regression tests for centralized Apple system-color tokens and removal of hardcoded Hardware HEX colors.
- Add source-level checks that Blog metadata no longer stacks inline opacity over `--text-tertiary`.
- Update `README.md` and `AGENTS.md` so the documented content-color contract matches the implementation.
- Run unit tests, lint, and production static build.
- Visually inspect both cards on the running page in light and dark mode at desktop and mobile widths.
