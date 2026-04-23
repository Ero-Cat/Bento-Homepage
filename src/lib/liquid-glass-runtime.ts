export interface LiquidGlassQualityInput {
  cardCount: number;
  devicePixelRatio: number;
  hasCoarsePointer: boolean;
  deviceMemory?: number;
}

export interface LiquidGlassQualityProfile {
  blurBufferScale: number;
  dprCap: number;
  preferHalfFloat: boolean;
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

export function resolveLiquidGlassQuality({
  cardCount,
  devicePixelRatio,
  hasCoarsePointer,
  deviceMemory,
}: LiquidGlassQualityInput): LiquidGlassQualityProfile {
  const lowMemory = typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4;

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
