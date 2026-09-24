export type GlassVariant = "hero" | "panel" | "media" | "dense" | "immersive";
export type GlassColorScheme = "light" | "dark";

export interface GlassMaterialProfile {
  tint: readonly [number, number, number];
  tintAlpha: number;
  sceneCoverage: number;
  saturation: number;
  exposure: number;
  edgeHighlightGain: number;
  edgeShadowGain: number;
}

export interface GlassVariantConfig {
  cssRadius: string;
  shaderRadius: number;
  shapeRoundness: number;
  refThickness: number;
  refFactor: number;
  refDispersion: number;
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
  surfaceRefraction: number;
  surfaceBlurMix: number;
  counterRimFactor: number;
  pointerRefraction: number;
  pointerGlare: number;
  pressDepth: number;
  tint: readonly [number, number, number];
  tintAlpha: number;
  light: GlassMaterialProfile;
  dark: GlassMaterialProfile;
  fallbackBlurPx: number;
}

export const DEFAULT_GLASS_VARIANT: GlassVariant = "panel";
export const SHARED_GLASS_RADIUS_PX = 32;
export const SHARED_GLASS_RADIUS_CSS = `${SHARED_GLASS_RADIUS_PX}px`;
export const STANDARD_ROUNDED_RECT_SHAPE = 2;

export const LIQUID_GLASS_CANVAS = {
  /** Target softening of the blurred scene layer, anchored in CSS px so every
   *  quality tier renders the same visual blur regardless of buffer scale. */
  sceneBlurRadiusCss: 9,
  /** Scene buffer renders at min(dpr, this) × CSS size to bound fill cost on
   *  high-DPR screens; refraction rims still shade at full canvas resolution. */
  sceneBufferMaxScale: 1.5,
  /** Ease-out duration for revealing scene coverage once the first real
   *  background texture is ready, in ms. */
  bgReadyRampMs: 450,
  maxDpr: 2,
  scissorPaddingPx: 10,
  measureWarmupFrames: 8,
  rootDatasetKey: "liquidGlass",
  activeBackgroundDatasetKey: "liquidGlassBg",
  nextBackgroundDatasetKey: "liquidGlassBgNext",
  previousBackgroundDatasetKey: "liquidGlassBgPrev",
  backgroundTransitionStartedAtDatasetKey: "liquidGlassBgTransitionStartedAt",
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
    refThickness: 70,
    refFactor: 2.18,
    refDispersion: 2.16,
    fresnelFactor: 0.18,
    fresnelHardness: -0.08,
    glareFactor: 0.145,
    glareAngle: -0.16,
    glareConvergence: 0.66,
    glareRange: 90,
    glareHardness: -0.40,
    glareOppositeFactor: 0.92,
    bevelWidth: 16,
    magnification: 0.12,
    surfaceRefraction: 4.2,
    surfaceBlurMix: 0.24,
    counterRimFactor: 0.15,
    pointerRefraction: 0.86,
    pointerGlare: 0.78,
    pressDepth: 0.10,
    tint: [1, 1, 1],
    tintAlpha: 0.036,
    light: {
      tint: [1.0, 1.0, 1.0],
      tintAlpha: 0.02,
      sceneCoverage: 0.93,
      saturation: 1.22,
      exposure: 1.04,
      edgeHighlightGain: 1.5,
      edgeShadowGain: 1.08,
    },
    dark: {
      tint: [0.82, 0.9, 1.0],
      tintAlpha: 0.056,
      sceneCoverage: 0.93,
      saturation: 1.26,
      exposure: 1.08,
      edgeHighlightGain: 1.66,
      edgeShadowGain: 1.18,
    },
    fallbackBlurPx: 12,
  },
  panel: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 70,
    refFactor: 2.06,
    refDispersion: 1.82,
    fresnelFactor: 0.155,
    fresnelHardness: -0.09,
    glareFactor: 0.122,
    glareAngle: -0.10,
    glareConvergence: 0.60,
    glareRange: 92,
    glareHardness: -0.36,
    glareOppositeFactor: 0.88,
    bevelWidth: 15,
    magnification: 0.09,
    surfaceRefraction: 3.6,
    surfaceBlurMix: 0.30,
    counterRimFactor: 0.13,
    pointerRefraction: 0.66,
    pointerGlare: 0.62,
    pressDepth: 0.075,
    tint: [1, 1, 1],
    tintAlpha: 0.03,
    light: {
      tint: [1.0, 1.0, 1.0],
      tintAlpha: 0.018,
      sceneCoverage: 0.92,
      saturation: 1.2,
      exposure: 1.03,
      edgeHighlightGain: 1.42,
      edgeShadowGain: 1.0,
    },
    dark: {
      tint: [0.82, 0.9, 1.0],
      tintAlpha: 0.052,
      sceneCoverage: 0.92,
      saturation: 1.24,
      exposure: 1.07,
      edgeHighlightGain: 1.56,
      edgeShadowGain: 1.12,
    },
    fallbackBlurPx: 10,
  },
  media: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 54,
    refFactor: 1.94,
    refDispersion: 1.54,
    fresnelFactor: 0.125,
    fresnelHardness: -0.10,
    glareFactor: 0.095,
    glareAngle: 0.06,
    glareConvergence: 0.52,
    glareRange: 88,
    glareHardness: -0.34,
    glareOppositeFactor: 0.82,
    bevelWidth: 14,
    magnification: 0.05,
    surfaceRefraction: 2.8,
    surfaceBlurMix: 0.18,
    counterRimFactor: 0.09,
    pointerRefraction: 0.34,
    pointerGlare: 0.34,
    pressDepth: 0,
    tint: [1, 1, 1],
    tintAlpha: 0.028,
    light: {
      tint: [1.0, 1.0, 1.0],
      tintAlpha: 0.016,
      sceneCoverage: 0.9,
      saturation: 1.17,
      exposure: 1.03,
      edgeHighlightGain: 1.36,
      edgeShadowGain: 0.96,
    },
    dark: {
      tint: [0.84, 0.91, 1.0],
      tintAlpha: 0.048,
      sceneCoverage: 0.9,
      saturation: 1.21,
      exposure: 1.06,
      edgeHighlightGain: 1.48,
      edgeShadowGain: 1.06,
    },
    fallbackBlurPx: 10,
  },
  dense: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 44,
    refFactor: 1.84,
    refDispersion: 1.30,
    fresnelFactor: 0.11,
    fresnelHardness: -0.11,
    glareFactor: 0.085,
    glareAngle: 0.0,
    glareConvergence: 0.48,
    glareRange: 86,
    glareHardness: -0.32,
    glareOppositeFactor: 0.78,
    bevelWidth: 12,
    magnification: 0.035,
    surfaceRefraction: 2.2,
    surfaceBlurMix: 0.25,
    counterRimFactor: 0.07,
    pointerRefraction: 0.22,
    pointerGlare: 0.24,
    pressDepth: 0,
    tint: [1, 1, 1],
    tintAlpha: 0.024,
    light: {
      tint: [1.0, 1.0, 1.0],
      tintAlpha: 0.014,
      sceneCoverage: 0.88,
      saturation: 1.16,
      exposure: 1.03,
      edgeHighlightGain: 1.32,
      edgeShadowGain: 0.94,
    },
    dark: {
      tint: [0.86, 0.92, 1.0],
      tintAlpha: 0.044,
      sceneCoverage: 0.89,
      saturation: 1.2,
      exposure: 1.05,
      edgeHighlightGain: 1.42,
      edgeShadowGain: 1.04,
    },
    fallbackBlurPx: 8,
  },
  immersive: {
    cssRadius: SHARED_GLASS_RADIUS_CSS,
    shaderRadius: SHARED_GLASS_RADIUS_PX,
    shapeRoundness: STANDARD_ROUNDED_RECT_SHAPE,
    refThickness: 84,
    refFactor: 2.34,
    refDispersion: 2.34,
    fresnelFactor: 0.22,
    fresnelHardness: -0.05,
    glareFactor: 0.17,
    glareAngle: -0.22,
    glareConvergence: 0.68,
    glareRange: 92,
    glareHardness: -0.44,
    glareOppositeFactor: 0.96,
    bevelWidth: 17,
    magnification: 0.14,
    surfaceRefraction: 4.8,
    surfaceBlurMix: 0.26,
    counterRimFactor: 0.17,
    pointerRefraction: 0.98,
    pointerGlare: 0.94,
    pressDepth: 0.12,
    tint: [1, 1, 1],
    tintAlpha: 0.04,
    light: {
      tint: [1.0, 1.0, 1.0],
      tintAlpha: 0.022,
      sceneCoverage: 0.94,
      saturation: 1.24,
      exposure: 1.05,
      edgeHighlightGain: 1.55,
      edgeShadowGain: 1.15,
    },
    dark: {
      tint: [0.8, 0.89, 1.0],
      tintAlpha: 0.06,
      sceneCoverage: 0.94,
      saturation: 1.28,
      exposure: 1.09,
      edgeHighlightGain: 1.7,
      edgeShadowGain: 1.22,
    },
    fallbackBlurPx: 14,
  },
};

export function resolveGlassMaterial(
  variant: GlassVariantConfig,
  colorScheme: GlassColorScheme,
): GlassMaterialProfile {
  return variant[colorScheme];
}

export function resolveGlassVariant(value?: string): GlassVariant {
  if (!value) {
    return DEFAULT_GLASS_VARIANT;
  }

  return value in GLASS_VARIANTS
    ? (value as GlassVariant)
    : DEFAULT_GLASS_VARIANT;
}

/**
 * Convert the CSS-anchored scene blur target into a per-pass texel radius for
 * the downscaled blur buffer. Two separable passes compose to ~sqrt(2)× the
 * per-pass softening, so each pass carries ~0.707 of the target; the radius
 * scales with dpr × blurBufferScale so every quality tier renders the same
 * visual blur in CSS pixels.
 */
export function resolveSceneBlurTexelRadius(
  sceneBlurRadiusCss: number,
  dpr: number,
  blurBufferScale: number,
): number {
  return Math.max(1, Math.round(sceneBlurRadiusCss * Math.SQRT1_2 * dpr * blurBufferScale));
}
