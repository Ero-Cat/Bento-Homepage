import test from "node:test";
import assert from "node:assert/strict";

import { GLASS_VARIANTS, LIQUID_GLASS_CANVAS, toDataAttributeName } from "./liquid-glass.ts";

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
    assert.ok(variant.magnification >= 0, `Expected ${name} to define magnification`);
    assert.ok(variant.surfaceBlurMix >= 0, `Expected ${name} to define center diffusion`);
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
