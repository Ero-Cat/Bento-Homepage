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
  tint: readonly [number, number, number];
  tintAlpha: number;
  fallbackBlurPx: number;
}

export const DEFAULT_GLASS_VARIANT: GlassVariant = "panel";
export const SHARED_GLASS_RADIUS_PX = 32;
export const SHARED_GLASS_RADIUS_CSS = `${SHARED_GLASS_RADIUS_PX}px`;
export const STANDARD_ROUNDED_RECT_SHAPE = 2;

export const LIQUID_GLASS_CANVAS = {
  sceneBlurRadius: 16,
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

export const GLASS_VARIANTS: Record<GlassVariant, GlassVariantConfig> = {
  hero: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 34,
    refFactor: 1.68,
    refDispersion: 1.72,
    fresnelRange: 158,
    fresnelFactor: 0.26,
    fresnelHardness: -0.08,
    glareFactor: 0.22,
    glareAngle: -0.16,
    glareConvergence: 0.66,
    glareRange: 90,
    glareHardness: -0.40,
    glareOppositeFactor: 0.92,
    tint: [1, 1, 1],
    tintAlpha: 0.036,
    fallbackBlurPx: 10,
  },
  panel: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 26,
    refFactor: 1.62,
    refDispersion: 1.28,
    fresnelRange: 152,
    fresnelFactor: 0.22,
    fresnelHardness: -0.09,
    glareFactor: 0.17,
    glareAngle: -0.10,
    glareConvergence: 0.60,
    glareRange: 92,
    glareHardness: -0.36,
    glareOppositeFactor: 0.88,
    tint: [1, 1, 1],
    tintAlpha: 0.028,
    fallbackBlurPx: 8,
  },
  media: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 22,
    refFactor: 1.56,
    refDispersion: 1.12,
    fresnelRange: 146,
    fresnelFactor: 0.17,
    fresnelHardness: -0.10,
    glareFactor: 0.14,
    glareAngle: 0.06,
    glareConvergence: 0.52,
    glareRange: 88,
    glareHardness: -0.34,
    glareOppositeFactor: 0.82,
    tint: [1, 1, 1],
    tintAlpha: 0.024,
    fallbackBlurPx: 8,
  },
  dense: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 20,
    refFactor: 1.52,
    refDispersion: 0.94,
    fresnelRange: 144,
    fresnelFactor: 0.14,
    fresnelHardness: -0.11,
    glareFactor: 0.11,
    glareAngle: 0.0,
    glareConvergence: 0.48,
    glareRange: 86,
    glareHardness: -0.32,
    glareOppositeFactor: 0.78,
    tint: [1, 1, 1],
    tintAlpha: 0.020,
    fallbackBlurPx: 6,
  },
  immersive: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 38,
    refFactor: 1.72,
    refDispersion: 1.82,
    fresnelRange: 162,
    fresnelFactor: 0.34,
    fresnelHardness: -0.05,
    glareFactor: 0.28,
    glareAngle: -0.22,
    glareConvergence: 0.68,
    glareRange: 92,
    glareHardness: -0.44,
    glareOppositeFactor: 0.96,
    tint: [1, 1, 1],
    tintAlpha: 0.044,
    fallbackBlurPx: 12,
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
