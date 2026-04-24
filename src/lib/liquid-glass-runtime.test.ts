import test from "node:test";
import assert from "node:assert/strict";

import {
  addScrollFollowImpulse,
  beginScrollGeometryTracking,
  expandScissorRect,
  resolveLiquidGlassQuality,
  resolveLiquidGlassViewport,
  stepScrollGeometryTracking,
  stepScrollFollowMotion,
  springIsSettled,
} from "./liquid-glass-runtime.ts";
import { GLASS_VARIANTS } from "./liquid-glass.ts";

test("resolveLiquidGlassQuality lowers quality for coarse pointer devices with many cards", () => {
  const profile = resolveLiquidGlassQuality({
    cardCount: 12,
    devicePixelRatio: 3,
    hasCoarsePointer: true,
    deviceMemory: 4,
  });

  assert.deepEqual(profile, {
    blurBufferScale: 0.5,
    dprCap: 1.35,
    preferHalfFloat: false,
  });
});

test("resolveLiquidGlassQuality keeps high quality on capable desktop devices", () => {
  const profile = resolveLiquidGlassQuality({
    cardCount: 6,
    devicePixelRatio: 2,
    hasCoarsePointer: false,
    deviceMemory: 8,
  });

  assert.deepEqual(profile, {
    blurBufferScale: 1,
    dprCap: 2,
    preferHalfFloat: true,
  });
});

test("resolveLiquidGlassQuality keeps liquid glass enabled with an ultra-low profile on constrained hardware", () => {
  const profile = resolveLiquidGlassQuality({
    cardCount: 14,
    devicePixelRatio: 3,
    hasCoarsePointer: true,
    deviceMemory: 2,
    hardwareConcurrency: 4,
  });

  assert.deepEqual(profile, {
    blurBufferScale: 0.38,
    dprCap: 1.1,
    preferHalfFloat: false,
  });
});

test("resolveLiquidGlassViewport follows the visual viewport on mobile browser chrome changes", () => {
  assert.deepEqual(
    resolveLiquidGlassViewport({
      innerWidth: 390,
      innerHeight: 844,
      devicePixelRatio: 3,
      dprCap: 1.35,
      visualViewport: {
        width: 390,
        height: 724,
        offsetLeft: 0,
        offsetTop: 72,
      },
    }),
    {
      cssWidth: 390,
      cssHeight: 724,
      dpr: 1.35,
      width: 527,
      height: 977,
      offsetLeft: 0,
      offsetTop: 72,
    },
  );
});

test("scroll geometry tracking stays active through long momentum scrolls and settles after idle frames", () => {
  const state = beginScrollGeometryTracking(
    {
      lastScrollY: 0,
      lastViewportOffsetTop: 0,
      lastViewportOffsetLeft: 0,
      framesRemaining: 0,
      idleFrames: 0,
    },
    48,
  );

  let result = stepScrollGeometryTracking(
    state,
    { scrollY: 1, viewportOffsetTop: 0, viewportOffsetLeft: 0 },
    { idleFrameLimit: 4 },
  );

  for (let frame = 2; frame <= 20; frame++) {
    result = stepScrollGeometryTracking(
      result.state,
      { scrollY: frame, viewportOffsetTop: 0, viewportOffsetLeft: 0 },
      { idleFrameLimit: 4 },
    );
  }

  assert.equal(result.shouldContinue, true);
  assert.equal(result.geometryChanged, true);

  for (let frame = 0; frame < 4; frame++) {
    result = stepScrollGeometryTracking(
      result.state,
      { scrollY: 20, viewportOffsetTop: 0, viewportOffsetLeft: 0 },
      { idleFrameLimit: 4 },
    );
  }

  assert.equal(result.shouldContinue, false);
  assert.equal(result.geometryChanged, false);
});

test("springIsSettled returns false while the pointer spring is still moving", () => {
  assert.equal(
    springIsSettled({
      pos: [0.5, 0.5],
      prev: [0.46, 0.48],
      target: [0.56, 0.54],
      epsilon: 0.002,
    }),
    false,
  );
});

test("springIsSettled returns true once position, target, and velocity converge", () => {
  assert.equal(
    springIsSettled({
      pos: [0.5004, 0.4996],
      prev: [0.5002, 0.4998],
      target: [0.5, 0.5],
      epsilon: 0.002,
    }),
    true,
  );
});

test("expandScissorRect pads and clamps the draw bounds to the viewport", () => {
  assert.deepEqual(
    expandScissorRect(
      { left: -8.2, top: -4.4, width: 110.6, height: 84.1 },
      { width: 100, height: 80 },
      6,
    ),
    { x: 0, y: 0, width: 100, height: 80 },
  );
});

test("expandScissorRect returns null when the clipped area disappears", () => {
  assert.equal(
    expandScissorRect(
      { left: 120, top: 40, width: 20, height: 20 },
      { width: 100, height: 80 },
      4,
    ),
    null,
  );
});

test("addScrollFollowImpulse clamps large scroll deltas into a bounded velocity", () => {
  assert.equal(
    addScrollFollowImpulse(
      { offset: 0, velocity: 0 },
      240,
    ).velocity,
    4.5,
  );

  assert.equal(
    addScrollFollowImpulse(
      { offset: 0, velocity: 0 },
      -240,
    ).velocity,
    -4.5,
  );
});

test("stepScrollFollowMotion eases the scroll-follow offset back toward rest", () => {
  let state = {
    offset: 8,
    velocity: 0,
  };

  for (let index = 0; index < 120; index++) {
    state = stepScrollFollowMotion(state, 16);
  }

  assert.ok(Math.abs(state.offset) < 0.05, `Expected offset to settle near 0, got ${state.offset}`);
  assert.ok(Math.abs(state.velocity) < 0.05, `Expected velocity to settle near 0, got ${state.velocity}`);
});

test("shared liquid glass variants have non-zero Fresnel and glare factors", () => {
  for (const [name, variant] of Object.entries(GLASS_VARIANTS)) {
    assert.ok(variant.fresnelFactor > 0, `Expected ${name} to have a positive fresnelFactor`);
    assert.ok(variant.glareFactor > 0, `Expected ${name} to have a positive glareFactor`);
  }
});
