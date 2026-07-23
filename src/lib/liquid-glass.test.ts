import test from "node:test";
import assert from "node:assert/strict";

import {
  GLASS_VARIANTS,
  LIQUID_GLASS_CANVAS,
  resolveGlassMaterial,
  toDataAttributeName,
} from "./liquid-glass.ts";

test("all shared liquid glass variants use circular corners that match the NetEase card", () => {
  for (const [name, variant] of Object.entries(GLASS_VARIANTS)) {
    assert.equal(
      variant.shapeRoundness,
      2,
      `Expected ${name} to use standard rounded-rect corners`,
    );
  }
});

test("liquid glass background transition start is exposed as a data attribute", () => {
  assert.equal(
    toDataAttributeName(LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey),
    "data-liquid-glass-bg-transition-started-at",
  );
});

test("shared liquid glass variants keep enough edge energy on light backgrounds", () => {
  for (const [name, variant] of Object.entries(GLASS_VARIANTS)) {
    assert.ok(variant.refThickness >= 24, `Expected ${name} to reserve a visible refraction rim`);
    assert.ok(variant.refFactor >= 1.64, `Expected ${name} to bend the background enough to read as liquid`);
    assert.ok(variant.fresnelFactor >= 0.11, `Expected ${name} to keep a visible Fresnel edge`);
    assert.ok(variant.glareFactor >= 0.085, `Expected ${name} to keep a visible directional glare`);
    assert.ok(variant.tintAlpha <= 0.04, `Expected ${name} not to reintroduce a milky white card tint`);
  }
});

test("shared liquid glass variants centralize layered optics and interaction tokens", () => {
  for (const [name, variant] of Object.entries(GLASS_VARIANTS)) {
    assert.ok(variant.bevelWidth > 0, `Expected ${name} to define a positive bevel width`);
    assert.ok(
      variant.bevelWidth <= variant.shaderRadius * 0.55,
      `Expected ${name} bevel to preserve a broad inner corner instead of collapsing into a tight U-shaped rim`,
    );
    assert.ok(variant.magnification >= 0, `Expected ${name} to define magnification`);
    assert.ok(
      variant.surfaceRefraction > 0,
      `Expected ${name} to refract the scene across the full glass surface`,
    );
    assert.ok(
      variant.surfaceBlurMix >= 0.16,
      `Expected ${name} center diffusion to remain visible after alpha compositing`,
    );
    assert.ok(variant.counterRimFactor >= 0, `Expected ${name} to define a counter rim`);
    assert.ok(variant.pointerRefraction >= 0, `Expected ${name} to define pointer refraction`);
    assert.ok(variant.pointerGlare >= 0, `Expected ${name} to define pointer glare`);
    assert.ok(variant.pressDepth >= 0, `Expected ${name} to define press depth`);
  }
});

test("layered liquid glass variants reserve the strongest response for hero content", () => {
  assert.ok(GLASS_VARIANTS.immersive.bevelWidth >= GLASS_VARIANTS.hero.bevelWidth);
  assert.ok(GLASS_VARIANTS.hero.pointerRefraction > GLASS_VARIANTS.panel.pointerRefraction);
  assert.ok(GLASS_VARIANTS.panel.pointerRefraction > GLASS_VARIANTS.dense.pointerRefraction);
  assert.ok(GLASS_VARIANTS.media.surfaceBlurMix <= GLASS_VARIANTS.panel.surfaceBlurMix);
  assert.equal(GLASS_VARIANTS.dense.pressDepth, 0);
  assert.equal(GLASS_VARIANTS.media.pressDepth, 0);
});

test("text-heavy glass variants keep a restrained readability diffusion floor", () => {
  assert.ok(
    GLASS_VARIANTS.panel.surfaceBlurMix >= 0.3,
    "Expected panel glass to reach the approved minimum full-surface softening",
  );
  assert.ok(
    GLASS_VARIANTS.dense.surfaceBlurMix >= 0.25,
    "Expected dense glass to soften busy backgrounds behind compact text",
  );
  assert.ok(GLASS_VARIANTS.panel.surfaceBlurMix <= 0.34);
  assert.ok(GLASS_VARIANTS.dense.surfaceBlurMix <= 0.3);
  assert.ok(GLASS_VARIANTS.panel.surfaceBlurMix > GLASS_VARIANTS.dense.surfaceBlurMix);
});

test("shared liquid glass variants expose light and dark material profiles", () => {
  for (const [name, variant] of Object.entries(GLASS_VARIANTS)) {
    for (const scheme of ["light", "dark"] as const) {
      const material = resolveGlassMaterial(variant, scheme);

      assert.ok(
        material.sceneCoverage >= 0.88,
        `Expected ${name}/${scheme} to reconstruct the page scene instead of leaving a transparent card center`,
      );
      assert.ok(material.tintAlpha <= 0.09, `Expected ${name}/${scheme} to avoid a milky opaque fill`);
      assert.ok(material.saturation >= 1, `Expected ${name}/${scheme} to keep refracted imagery vivid`);
      assert.ok(material.edgeHighlightGain > 0, `Expected ${name}/${scheme} to expose a bright rim gain`);
      assert.ok(material.edgeShadowGain > 0, `Expected ${name}/${scheme} to expose a dark counter-rim gain`);
    }
  }
});

test("dark liquid glass material stays transparent but more luminous than light material", () => {
  const panelLight = resolveGlassMaterial(GLASS_VARIANTS.panel, "light");
  const panelDark = resolveGlassMaterial(GLASS_VARIANTS.panel, "dark");

  assert.ok(panelDark.sceneCoverage >= panelLight.sceneCoverage);
  assert.ok(panelDark.edgeHighlightGain > panelLight.edgeHighlightGain);
  assert.ok(panelDark.edgeShadowGain >= panelLight.edgeShadowGain);
  assert.ok(panelDark.tintAlpha <= 0.09);
});
