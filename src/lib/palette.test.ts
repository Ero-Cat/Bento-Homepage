import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKGROUND_TONE_THRESHOLDS,
  classifyBackgroundAppearance,
} from "./palette.ts";

test("background tone classification flips on clearly crossed backdrops", () => {
  assert.equal(classifyBackgroundAppearance(0.12, "light"), "on-dark");
  assert.equal(classifyBackgroundAppearance(0.85, "light"), "on-light");
});

test("mid backdrops return to the scheme default text set", () => {
  // Light-scheme glass brightens mid photos via its veil, so the default
  // (dark) text wins over the light set — no "gray on gray".
  assert.equal(classifyBackgroundAppearance(0.46, "light"), "auto");
  // The dark-scheme bias dims mid photos below the dark threshold, keeping
  // the (default) light set.
  assert.equal(classifyBackgroundAppearance(0.46, "dark"), "on-dark");
});

test("dark scheme glass biases the effective backdrop luminance downward", () => {
  // A raw 0.75 photo behind dark-scheme material reads ~0.53 — still mid,
  // so the default light set stays.
  const biased = 0.75 * BACKGROUND_TONE_THRESHOLDS.darkSchemeBias;
  assert.ok(biased < BACKGROUND_TONE_THRESHOLDS.light);
  assert.equal(classifyBackgroundAppearance(0.75, "dark"), "auto");

  // Only truly bright photos flip dark-scheme text to the dark set.
  assert.equal(classifyBackgroundAppearance(0.95, "dark"), "on-light");
});

test("background tone thresholds stay ordered", () => {
  assert.ok(BACKGROUND_TONE_THRESHOLDS.dark < BACKGROUND_TONE_THRESHOLDS.light);
  assert.ok(
    BACKGROUND_TONE_THRESHOLDS.darkSchemeBias > 0 &&
      BACKGROUND_TONE_THRESHOLDS.darkSchemeBias < 1,
  );
});
