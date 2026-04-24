export interface LiquidGlassQualityInput {
  cardCount: number;
  devicePixelRatio: number;
  hasCoarsePointer: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  prefersReducedMotion?: boolean;
  saveData?: boolean;
}

export interface LiquidGlassQualityProfile {
  blurBufferScale: number;
  dprCap: number;
  preferHalfFloat: boolean;
}

export interface VisualViewportLike {
  width: number;
  height: number;
  offsetLeft?: number;
  offsetTop?: number;
}

export interface LiquidGlassViewportInput {
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  dprCap: number;
  visualViewport?: VisualViewportLike;
}

export interface LiquidGlassViewportState {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
}

export interface SpringSettleInput {
  pos: readonly [number, number];
  prev: readonly [number, number];
  target: readonly [number, number];
  epsilon?: number;
}

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ScissorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScrollFollowMotionState {
  offset: number;
  velocity: number;
}

export interface ScrollGeometryTrackingState {
  lastScrollY: number;
  lastViewportOffsetTop: number;
  lastViewportOffsetLeft: number;
  framesRemaining: number;
  idleFrames: number;
}

export interface ScrollGeometrySnapshot {
  scrollY: number;
  viewportOffsetTop: number;
  viewportOffsetLeft: number;
}

export interface ScrollGeometryTrackingOptions {
  idleFrameLimit?: number;
}

export function resolveLiquidGlassQuality({
  cardCount,
  devicePixelRatio,
  hasCoarsePointer,
  deviceMemory,
  hardwareConcurrency,
  saveData,
}: LiquidGlassQualityInput): LiquidGlassQualityProfile {
  const lowMemory = typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4;
  const veryLowMemory = typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 2;
  const lowCoreCount =
    typeof hardwareConcurrency === "number" && hardwareConcurrency > 0 && hardwareConcurrency <= 4;

  if (saveData || veryLowMemory || (hasCoarsePointer && lowCoreCount && devicePixelRatio >= 2)) {
    return {
      blurBufferScale: 0.38,
      dprCap: 1.1,
      preferHalfFloat: false,
    };
  }

  if (hasCoarsePointer || lowMemory || cardCount >= 10 || devicePixelRatio >= 3) {
    return {
      blurBufferScale: 0.5,
      dprCap: 1.35,
      preferHalfFloat: false,
    };
  }

  if (cardCount >= 8 || devicePixelRatio > 2) {
    return {
      blurBufferScale: 0.67,
      dprCap: 1.6,
      preferHalfFloat: false,
    };
  }

  return {
    blurBufferScale: 1,
    dprCap: 2,
    preferHalfFloat: true,
  };
}

export function resolveLiquidGlassViewport({
  innerWidth,
  innerHeight,
  devicePixelRatio,
  dprCap,
  visualViewport,
}: LiquidGlassViewportInput): LiquidGlassViewportState {
  const cssWidth = Math.max(1, visualViewport?.width ?? innerWidth);
  const cssHeight = Math.max(1, visualViewport?.height ?? innerHeight);
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), dprCap);

  return {
    cssWidth,
    cssHeight,
    dpr,
    width: Math.max(1, Math.round(cssWidth * dpr)),
    height: Math.max(1, Math.round(cssHeight * dpr)),
    offsetLeft: visualViewport?.offsetLeft ?? 0,
    offsetTop: visualViewport?.offsetTop ?? 0,
  };
}

export function beginScrollGeometryTracking(
  state: ScrollGeometryTrackingState,
  frameBudget: number,
): ScrollGeometryTrackingState {
  return {
    ...state,
    framesRemaining: Math.max(state.framesRemaining, Math.max(0, frameBudget)),
    idleFrames: 0,
  };
}

export function stepScrollGeometryTracking(
  state: ScrollGeometryTrackingState,
  snapshot: ScrollGeometrySnapshot,
  { idleFrameLimit = 10 }: ScrollGeometryTrackingOptions = {},
): {
  state: ScrollGeometryTrackingState;
  geometryChanged: boolean;
  shouldContinue: boolean;
} {
  const geometryChanged =
    snapshot.scrollY !== state.lastScrollY ||
    snapshot.viewportOffsetTop !== state.lastViewportOffsetTop ||
    snapshot.viewportOffsetLeft !== state.lastViewportOffsetLeft;
  const idleFrames = geometryChanged ? 0 : state.idleFrames + 1;
  const framesRemaining = Math.max(state.framesRemaining - 1, 0);

  return {
    state: {
      lastScrollY: snapshot.scrollY,
      lastViewportOffsetTop: snapshot.viewportOffsetTop,
      lastViewportOffsetLeft: snapshot.viewportOffsetLeft,
      framesRemaining,
      idleFrames,
    },
    geometryChanged,
    shouldContinue: framesRemaining > 0 && idleFrames < idleFrameLimit,
  };
}

export function springIsSettled({
  pos,
  prev,
  target,
  epsilon = 0.002,
}: SpringSettleInput): boolean {
  for (let axis = 0; axis < 2; axis++) {
    if (Math.abs(pos[axis] - target[axis]) > epsilon) {
      return false;
    }

    if (Math.abs(pos[axis] - prev[axis]) > epsilon) {
      return false;
    }
  }

  return true;
}

export function addScrollFollowImpulse(
  state: ScrollFollowMotionState,
  deltaY: number,
  impulseFactor = 0.04,
  maxVelocity = 4.5,
): ScrollFollowMotionState {
  const nextVelocity = state.velocity + deltaY * impulseFactor;

  return {
    offset: state.offset,
    velocity: Math.max(-maxVelocity, Math.min(maxVelocity, nextVelocity)),
  };
}

export function stepScrollFollowMotion(
  state: ScrollFollowMotionState,
  deltaMs: number,
  stiffness = 220,
  damping = 26,
): ScrollFollowMotionState {
  const dt = Math.max(deltaMs, 1) / 1000;
  const acceleration = -stiffness * state.offset - damping * state.velocity;
  const velocity = state.velocity + acceleration * dt;
  const offset = state.offset + velocity * dt;

  if (Math.abs(offset) < 0.001 && Math.abs(velocity) < 0.001) {
    return { offset: 0, velocity: 0 };
  }

  return { offset, velocity };
}

export function expandScissorRect(
  rect: RectLike,
  viewport: ViewportSize,
  padding: number,
): ScissorRect | null {
  const left = Math.max(0, Math.floor(rect.left - padding));
  const top = Math.max(0, Math.floor(rect.top - padding));
  const right = Math.min(viewport.width, Math.ceil(rect.left + rect.width + padding));
  const bottom = Math.min(viewport.height, Math.ceil(rect.top + rect.height + padding));

  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    x: left,
    y: viewport.height - bottom,
    width,
    height,
  };
}
