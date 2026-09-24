export interface LiquidGlassQualityInput {
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

export interface SpringValue {
  value: number;
  velocity: number;
  target: number;
}

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PointerCardHitCandidate {
  id: string;
  rect: RectLike;
  interactive: boolean;
}

export interface PointerCardHit {
  id: string;
  normalized: readonly [number, number];
  interactive: boolean;
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

export interface CardRenderGeometryInput {
  rect: RectLike;
  viewport: LiquidGlassViewportState;
  dpr: number;
  viewportOffsetLeft: number;
  viewportOffsetTop: number;
  scissorPaddingPx: number;
}

export interface CardRenderGeometry {
  visible: boolean;
  uvRect: readonly [number, number, number, number];
  shaderRectPx: readonly [number, number, number, number];
  scissorRect: ScissorRect | null;
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

export interface DocumentCardRectInput {
  rect: RectLike;
  scrollX: number;
  scrollY: number;
  canvasDocumentLeft?: number;
  canvasDocumentTop?: number;
}

export interface CoverUvTransformInput {
  sourceWidth: number;
  sourceHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface CoverUvTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

function cubicBezierCoordinate(t: number, control1: number, control2: number): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * control1 +
    3 * inverse * t * t * control2 +
    t * t * t
  );
}

function cubicBezierDerivative(t: number, control1: number, control2: number): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * control1 +
    6 * inverse * t * (control2 - control1) +
    3 * t * t * (1 - control2)
  );
}

function solveCubicBezierProgress(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const target = Math.min(1, Math.max(0, progress));
  let parameter = target;

  for (let iteration = 0; iteration < 6; iteration++) {
    const error = cubicBezierCoordinate(parameter, x1, x2) - target;
    const derivative = cubicBezierDerivative(parameter, x1, x2);
    if (Math.abs(error) < 0.000001 || Math.abs(derivative) < 0.000001) break;
    parameter = Math.min(1, Math.max(0, parameter - error / derivative));
  }

  return cubicBezierCoordinate(parameter, y1, y2);
}

export function resolveBackgroundCrossfadeProgress(
  timestamp: number,
  startedAt: number,
  duration: number,
): number {
  const linearProgress = (timestamp - startedAt) / Math.max(duration, 1);
  return solveCubicBezierProgress(linearProgress, 0.22, 1, 0.36, 1);
}

export function resolveLiquidGlassQuality({
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

  // Card passes are scissored to card bounds, so their cost scales with
  // viewport area rather than registry size — card count must not downgrade
  // DPR. Only capability signals gate quality here.
  if (saveData || veryLowMemory || (hasCoarsePointer && lowCoreCount && devicePixelRatio >= 2)) {
    return {
      blurBufferScale: 0.22,
      dprCap: 1.1,
    };
  }

  if (hasCoarsePointer || lowMemory || devicePixelRatio >= 3) {
    return {
      blurBufferScale: 0.3,
      dprCap: 1.35,
    };
  }

  if (lowCoreCount) {
    return {
      blurBufferScale: 0.3,
      dprCap: 1.5,
    };
  }

  return {
    blurBufferScale: 0.4,
    dprCap: 2,
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

export function resolveCoverUvTransform({
  sourceWidth,
  sourceHeight,
  viewportWidth,
  viewportHeight,
}: CoverUvTransformInput): CoverUvTransform {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return {
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const coverScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const drawnWidth = sourceWidth * coverScale;
  const drawnHeight = sourceHeight * coverScale;
  const scaleX = Math.min(1, viewportWidth / drawnWidth);
  const scaleY = Math.min(1, viewportHeight / drawnHeight);

  return {
    scaleX,
    scaleY,
    offsetX: (1 - scaleX) * 0.5,
    offsetY: (1 - scaleY) * 0.5,
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

export function createSpringValue(value = 0, target = value): SpringValue {
  return { value, velocity: 0, target };
}

export function stepSpringValue(
  state: SpringValue,
  deltaMs: number,
  stiffness = 220,
  damping = 26,
): SpringValue {
  const dt = Math.min(Math.max(deltaMs, 1), 64) / 1000;
  const acceleration = stiffness * (state.target - state.value) - damping * state.velocity;
  const velocity = state.velocity + acceleration * dt;
  const value = state.value + velocity * dt;

  if (Math.abs(state.target - value) < 0.0001 && Math.abs(velocity) < 0.0001) {
    return { value: state.target, velocity: 0, target: state.target };
  }

  return { value, velocity, target: state.target };
}

export function springValueIsSettled(state: SpringValue, epsilon = 0.002): boolean {
  return Math.abs(state.target - state.value) <= epsilon && Math.abs(state.velocity) <= epsilon;
}

export function resolvePointerCardHit(
  pointer: readonly [number, number],
  candidates: readonly PointerCardHitCandidate[],
): PointerCardHit | null {
  for (let index = candidates.length - 1; index >= 0; index--) {
    const candidate = candidates[index];
    const { left, top, width, height } = candidate.rect;
    if (
      width <= 0 ||
      height <= 0 ||
      pointer[0] < left ||
      pointer[0] > left + width ||
      pointer[1] < top ||
      pointer[1] > top + height
    ) {
      continue;
    }

    return {
      id: candidate.id,
      normalized: [
        Math.min(1, Math.max(0, (pointer[0] - left) / width)),
        Math.min(1, Math.max(0, (pointer[1] - top) / height)),
      ],
      interactive: candidate.interactive,
    };
  }

  return null;
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

export function resolveDocumentCardRect({
  rect,
  scrollX,
  scrollY,
  canvasDocumentLeft = 0,
  canvasDocumentTop = 0,
}: DocumentCardRectInput): RectLike {
  return {
    left: rect.left + scrollX - canvasDocumentLeft,
    top: rect.top + scrollY - canvasDocumentTop,
    width: rect.width,
    height: rect.height,
  };
}

export function resolveCardRenderGeometry({
  rect,
  viewport,
  dpr,
  viewportOffsetLeft,
  viewportOffsetTop,
  scissorPaddingPx,
}: CardRenderGeometryInput): CardRenderGeometry {
  const leftCss = rect.left - viewportOffsetLeft;
  const topCss = rect.top - viewportOffsetTop;
  const rightCss = leftCss + rect.width;
  const bottomCss = topCss + rect.height;

  const visible =
    bottomCss > -scissorPaddingPx &&
    topCss < viewport.cssHeight + scissorPaddingPx &&
    rightCss > -scissorPaddingPx &&
    leftCss < viewport.cssWidth + scissorPaddingPx;

  // Snap to device pixels so the shell edge lands on the same subpixel as
  // the composited DOM border every frame — fractional scroll offsets must
  // not make the edge coverage shimmer.
  const shaderRectPx = [
    Math.round(leftCss * dpr),
    Math.round(topCss * dpr),
    Math.round(rect.width * dpr),
    Math.round(rect.height * dpr),
  ] as const;

  const scissorRect = expandScissorRect(
    {
      left: shaderRectPx[0],
      top: shaderRectPx[1],
      width: shaderRectPx[2],
      height: shaderRectPx[3],
    },
    { width: viewport.width, height: viewport.height },
    scissorPaddingPx * dpr,
  );

  return {
    visible,
    uvRect: [
      shaderRectPx[0] / viewport.width,
      1 - (shaderRectPx[1] + shaderRectPx[3]) / viewport.height,
      shaderRectPx[2] / viewport.width,
      shaderRectPx[3] / viewport.height,
    ],
    shaderRectPx,
    scissorRect,
  };
}
