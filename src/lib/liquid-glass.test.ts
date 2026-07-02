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
