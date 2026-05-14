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
