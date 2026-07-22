export type GlassVariant = "hero" | "panel" | "media" | "dense" | "immersive";

export interface GlassVariantConfig {
  cssRadius: string;
  shaderRadius: number;
  shapeRoundness: number;
  refThickness: number;
  refFactor: number;
  refDispersion: number;
  fresnelRange: number;
  fresnelFactor: number;
  fresnelHardness: number;
  glareFactor: number;
  glareAngle: number;
  glareConvergence: number;
  glareRange: number;
  glareHardness: number;
  glareOppositeFactor: number;
  bevelWidth: number;
  magnification: number;
  surfaceBlurMix: number;
  counterRimFactor: number;
  pointerRefraction: number;
  pointerGlare: number;
  pressDepth: number;
  tint: readonly [number, number, number];
  tintAlpha: number;
  fallbackBlurPx: number;
}

export const DEFAULT_GLASS_VARIANT: GlassVariant = "panel";
export const SHARED_GLASS_RADIUS_PX = 32;
export const SHARED_GLASS_RADIUS_CSS = `${SHARED_GLASS_RADIUS_PX}px`;
export const STANDARD_ROUNDED_RECT_SHAPE = 2;

export const LIQUID_GLASS_CANVAS = {
  sceneBlurRadius: 18,
  maxDpr: 2,
  scissorPaddingPx: 10,
  measureWarmupFrames: 8,
  rootDatasetKey: "liquidGlass",
  activeBackgroundDatasetKey: "liquidGlassBg",
  nextBackgroundDatasetKey: "liquidGlassBgNext",
  previousBackgroundDatasetKey: "liquidGlassBgPrev",
  backgroundTransitionStartedAtDatasetKey: "liquidGlassBgTransitionStartedAt", // kept for backward compat; not consumed by canvas
  backgroundTransitionDurationDatasetKey: "liquidGlassBgTransitionDuration",
  registryChangeEventName: "liquid-glass:registry-change",
  backgroundTransitionMs: 2000,
  spring: {
    stiffness: 220,
    damping: 26,
  },
} as const;

export function toDataAttributeName(datasetKey: string): string {
  return `data-${datasetKey.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`;
}

export const GLASS_VARIANTS: Record<GlassVariant, GlassVariantConfig> = {
  hero: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 38,
    refFactor: 1.84,
    refDispersion: 1.88,
    fresnelRange: 158,
    fresnelFactor: 0.18,
    fresnelHardness: -0.08,
    glareFactor: 0.145,
    glareAngle: -0.16,
    glareConvergence: 0.66,
    glareRange: 90,
    glareHardness: -0.40,
    glareOppositeFactor: 0.92,
    bevelWidth: 54,
    magnification: 0.12,
    surfaceBlurMix: 0.11,
    counterRimFactor: 0.15,
    pointerRefraction: 0.72,
    pointerGlare: 0.70,
    pressDepth: 0.10,
    tint: [1, 1, 1],
    tintAlpha: 0.036,
    fallbackBlurPx: 12,
  },
  panel: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 30,
    refFactor: 1.76,
    refDispersion: 1.46,
    fresnelRange: 152,
    fresnelFactor: 0.155,
    fresnelHardness: -0.09,
    glareFactor: 0.122,
    glareAngle: -0.10,
    glareConvergence: 0.60,
    glareRange: 92,
    glareHardness: -0.36,
    glareOppositeFactor: 0.88,
    bevelWidth: 46,
    magnification: 0.09,
    surfaceBlurMix: 0.09,
    counterRimFactor: 0.13,
    pointerRefraction: 0.52,
    pointerGlare: 0.55,
    pressDepth: 0.075,
    tint: [1, 1, 1],
    tintAlpha: 0.03,
    fallbackBlurPx: 10,
  },
  media: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 26,
    refFactor: 1.70,
    refDispersion: 1.28,
    fresnelRange: 146,
    fresnelFactor: 0.125,
    fresnelHardness: -0.10,
    glareFactor: 0.095,
    glareAngle: 0.06,
    glareConvergence: 0.52,
    glareRange: 88,
    glareHardness: -0.34,
    glareOppositeFactor: 0.82,
    bevelWidth: 38,
    magnification: 0.05,
    surfaceBlurMix: 0.055,
    counterRimFactor: 0.09,
    pointerRefraction: 0.25,
    pointerGlare: 0.28,
    pressDepth: 0,
    tint: [1, 1, 1],
    tintAlpha: 0.028,
    fallbackBlurPx: 10,
  },
  dense: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 24,
    refFactor: 1.64,
    refDispersion: 1.08,
    fresnelRange: 144,
    fresnelFactor: 0.11,
    fresnelHardness: -0.11,
    glareFactor: 0.085,
    glareAngle: 0.0,
    glareConvergence: 0.48,
    glareRange: 86,
    glareHardness: -0.32,
    glareOppositeFactor: 0.78,
    bevelWidth: 32,
    magnification: 0.035,
    surfaceBlurMix: 0.045,
    counterRimFactor: 0.07,
    pointerRefraction: 0.16,
    pointerGlare: 0.18,
    pressDepth: 0,
    tint: [1, 1, 1],
    tintAlpha: 0.024,
    fallbackBlurPx: 8,
  },
  immersive: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 42,
    refFactor: 1.88,
    refDispersion: 2.0,
    fresnelRange: 162,
    fresnelFactor: 0.22,
    fresnelHardness: -0.05,
    glareFactor: 0.17,
    glareAngle: -0.22,
    glareConvergence: 0.68,
    glareRange: 92,
    glareHardness: -0.44,
    glareOppositeFactor: 0.96,
    bevelWidth: 62,
    magnification: 0.14,
    surfaceBlurMix: 0.13,
    counterRimFactor: 0.17,
    pointerRefraction: 0.84,
    pointerGlare: 0.86,
    pressDepth: 0.12,
    tint: [1, 1, 1],
    tintAlpha: 0.04,
    fallbackBlurPx: 14,
  },
};

export function resolveGlassVariant(value?: string): GlassVariant {
  if (!value) {
    return DEFAULT_GLASS_VARIANT;
  }

  return value in GLASS_VARIANTS
    ? (value as GlassVariant)
    : DEFAULT_GLASS_VARIANT;
}
