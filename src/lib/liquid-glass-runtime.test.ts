import test from "node:test";
import assert from "node:assert/strict";

import {
  addScrollFollowImpulse,
  beginScrollGeometryTracking,
  createSpringValue,
  expandScissorRect,
  resolvePointerCardHit,
  resolveDocumentCardRect,
  resolveCardRenderGeometry,
  resolveLiquidGlassQuality,
  resolveLiquidGlassViewport,
  springValueIsSettled,
  stepScrollGeometryTracking,
  stepScrollFollowMotion,
  stepSpringValue,
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

test("resolvePointerCardHit returns normalized local coordinates for the topmost matching card", () => {
  const hit = resolvePointerCardHit(
    [120, 160],
    [
      {
        id: "panel",
        rect: { left: 40, top: 80, width: 240, height: 180 },
        interactive: false,
      },
      {
        id: "hero",
        rect: { left: 100, top: 140, width: 80, height: 80 },
        interactive: true,
      },
    ],
  );

  assert.deepEqual(hit, {
    id: "hero",
    normalized: [0.25, 0.25],
    interactive: true,
  });
});

test("resolvePointerCardHit returns null outside cached card geometry", () => {
  assert.equal(
    resolvePointerCardHit(
      [8, 12],
      [{ id: "panel", rect: { left: 40, top: 80, width: 240, height: 180 }, interactive: false }],
    ),
    null,
  );
});

test("stepSpringValue follows a new target and settles without mutating the input", () => {
  const initial = createSpringValue(0, 1);
  const next = stepSpringValue(initial, 16, 220, 26);

  assert.equal(initial.value, 0);
  assert.equal(next.target, 1);
  assert.ok(next.value > 0, "Expected the spring to move toward its target");
  assert.equal(springValueIsSettled(next), false);

  let settled = next;
  for (let frame = 0; frame < 180; frame++) {
    settled = stepSpringValue(settled, 16, 220, 26);
  }

  assert.equal(springValueIsSettled(settled), true);
  assert.ok(Math.abs(settled.value - 1) < 0.002);
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

test("resolveCardRenderGeometry keeps shader rects in DOM top-left coordinates and scissor in WebGL bottom-left coordinates", () => {
  const geometry = resolveCardRenderGeometry({
    rect: { left: 80, top: 120, width: 320, height: 180 },
    viewport: { cssWidth: 1000, cssHeight: 700, width: 2000, height: 1400 },
    dpr: 2,
    viewportOffsetLeft: 0,
    viewportOffsetTop: 0,
    scissorPaddingPx: 10,
  });

  assert.deepEqual(geometry.shaderRectPx, [160, 240, 640, 360]);
  assert.deepEqual(geometry.uvRect, [0.08, 0.5714285714285714, 0.32, 0.2571428571428571]);
  assert.deepEqual(geometry.scissorRect, { x: 140, y: 780, width: 680, height: 400 });
  assert.equal(geometry.visible, true);
});

test("resolveCardRenderGeometry follows scrolled DOM rects without adding scroll twice", () => {
  const before = resolveCardRenderGeometry({
    rect: { left: 80, top: 420, width: 320, height: 180 },
    viewport: { cssWidth: 1000, cssHeight: 700, width: 2000, height: 1400 },
    dpr: 2,
    viewportOffsetLeft: 0,
    viewportOffsetTop: 0,
    scissorPaddingPx: 10,
  });
  const afterWheelScroll = resolveCardRenderGeometry({
    rect: { left: 80, top: 120, width: 320, height: 180 },
    viewport: { cssWidth: 1000, cssHeight: 700, width: 2000, height: 1400 },
    dpr: 2,
    viewportOffsetLeft: 0,
    viewportOffsetTop: 0,
    scissorPaddingPx: 10,
  });

  assert.equal(before.shaderRectPx[1], 840);
  assert.equal(afterWheelScroll.shaderRectPx[1], 240);
  assert.equal(before.scissorRect?.y, 180);
  assert.equal(afterWheelScroll.scissorRect?.y, 780);
});

test("resolveDocumentCardRect stores card geometry in the scrolling document coordinate space", () => {
  assert.deepEqual(
    resolveDocumentCardRect({
      rect: { left: 80, top: 120, width: 320, height: 180 },
      scrollX: 0,
      scrollY: 600,
      canvasDocumentLeft: 0,
      canvasDocumentTop: 0,
    }),
    { left: 80, top: 720, width: 320, height: 180 },
  );
});

test("resolveDocumentCardRect is stable when viewport scroll changes but the element document position is unchanged", () => {
  const before = resolveDocumentCardRect({
    rect: { left: 80, top: 420, width: 320, height: 180 },
    scrollX: 0,
    scrollY: 300,
    canvasDocumentLeft: 0,
    canvasDocumentTop: 0,
  });
  const after = resolveDocumentCardRect({
    rect: { left: 80, top: 120, width: 320, height: 180 },
    scrollX: 0,
    scrollY: 600,
    canvasDocumentLeft: 0,
    canvasDocumentTop: 0,
  });

  assert.deepEqual(before, after);
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
