#version 300 es
precision highp float;

#define PI 3.14159265359

const float N_R = 1.0 - 0.026;
const float N_G = 1.0;
const float N_B = 1.0 + 0.026;

// Single key light from the top-left, in card-local space (y is up).
// Drives the soft directional edge light only; the crisp hairline stroke
// and the contact shadow are compositor-synced CSS on .glass-card so they
// never desync from DOM content during scrolling.
const vec2 KEY_LIGHT = vec2(-0.62, 0.78);

in vec2 v_uv;
uniform sampler2D u_bg;
uniform sampler2D u_blurredBg;
uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec4 u_cardRect;
uniform float u_radius;
uniform float u_shapeRoundness;
uniform float u_refThickness;
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_fresnelFactor;
uniform float u_glareFactor;
uniform float u_glareOppositeFactor;
uniform float u_edgeLensRange;
uniform float u_lensMagnification;
uniform float u_rimMirror;
uniform vec3 u_tint;
uniform float u_tintAlpha;
uniform vec2 u_pointer;
uniform float u_pointerHover;
uniform float u_pointerPress;
uniform float u_bevelWidth;
uniform float u_magnification;
uniform float u_surfaceBlurMix;
uniform float u_counterRimFactor;
uniform float u_pointerRefraction;
uniform float u_pointerGlare;
uniform float u_sceneCoverage;
uniform float u_saturation;
uniform float u_exposure;
uniform float u_edgeHighlightGain;
uniform float u_edgeShadowGain;
uniform float u_bgReady;
out vec4 fragColor;

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  return pow(pow(p.x, n) + pow(p.y, n), 1.0 / n) - r;
}

float roundedRectSDF(vec2 p, vec2 halfSize, float cr, float n) {
  vec2 d = abs(p) - halfSize;
  if (d.x > -cr && d.y > -cr) {
    vec2 cornerCenter = sign(p) * (halfSize - vec2(cr));
    return superellipseCornerSDF(p - cornerCenter, cr, n);
  }
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec2 getNormal(vec2 p, vec2 halfSize, float cr, float n) {
  float eps = max(abs(dFdx(p.x)), 0.0001);
  float dx = roundedRectSDF(p + vec2(eps, 0.0), halfSize, cr, n)
    - roundedRectSDF(p - vec2(eps, 0.0), halfSize, cr, n);
  float dy = roundedRectSDF(p + vec2(0.0, eps), halfSize, cr, n)
    - roundedRectSDF(p - vec2(0.0, eps), halfSize, cr, n);
  return vec2(dx, dy) / max(2.0 * eps, 0.0001);
}

vec2 safeUv(vec2 offset) {
  return clamp(v_uv + offset, vec2(0.001), vec2(0.999));
}

// Apple-style edge lens: a long-range falloff field that keeps bending the
// background well past the bevel band (falloff over u_edgeLensRange CSS px),
// plus a mirrored pull right at the silhouette so the outermost pixels show
// flipped content like a thick slab edge.
vec2 referenceEdgeDisplacement(
  vec2 localCssPx,
  vec2 halfSizeCssPx,
  vec2 normalDir,
  float wideField,
  float edgeField,
  float bevelBody,
  float mirrorBand,
  float pressCompression
) {
  vec2 safeHalfSize = max(halfSizeCssPx, vec2(1.0));
  vec2 normalizedLocal = clamp(localCssPx / safeHalfSize, vec2(-1.0), vec2(1.0));
  float centerDistance = clamp(length(normalizedLocal), 0.0, 1.0);
  // Pull budget scales with card size (like a real lens) but stays bounded.
  float maxPullPx = min(
    u_refThickness * (0.55 + bevelBody * 0.10),
    min(safeHalfSize.x, safeHalfSize.y) * 0.17
  );
  vec2 centerPull = -localCssPx * max(wideField, edgeField) * (0.045 + u_refFactor * 0.015);
  centerPull *= min(1.0, maxPullPx * 0.55 / max(length(centerPull), 0.0001));
  // Center magnification only owns the clean interior — near the edge it
  // must fade out so it can never cancel the outward refraction pull.
  centerPull *= 0.15 + 0.85 * (1.0 - wideField);

  // Outward refraction: near the edge the lens samples the scene BEYOND the
  // card boundary, so the rim band shows the outside world bent/squeezed
  // inward — the signature thick-glass edge (displacement-map behavior).
  vec2 lensNormal = normalDir * wideField * maxPullPx * (0.55 + centerDistance * 0.16);
  // Mirrored rim: the outermost pixels flip to content from progressively
  // further outside, like light bouncing inside a slab edge.
  vec2 mirrorPull = normalDir * mirrorBand * u_rimMirror * 10.0;
  return (centerPull + lensNormal + mirrorPull) * pressCompression;
}

vec3 sampleDispersedGlass(vec2 redOffset, vec2 greenOffset, vec2 blueOffset, float blurMix) {
  vec2 redUv = safeUv(redOffset);
  vec2 greenUv = safeUv(greenOffset);
  vec2 blueUv = safeUv(blueOffset);
  vec3 sharp = vec3(texture(u_bg, redUv).r, texture(u_bg, greenUv).g, texture(u_bg, blueUv).b);
  vec3 soft = vec3(texture(u_blurredBg, redUv).r, texture(u_blurredBg, greenUv).g, texture(u_blurredBg, blueUv).b);
  return mix(sharp, soft, blurMix);
}

vec3 adjustMaterialScene(vec3 color) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 saturated = mix(vec3(luma), color, u_saturation) * u_exposure;
  return max(vec3(0.0), saturated);
}

void main() {
  vec2 cardMin = u_cardRect.xy;
  vec2 cardMax = u_cardRect.xy + u_cardRect.zw;
  float margin = 2.0 / u_resolution.y;
  if (
    v_uv.x < cardMin.x - margin || v_uv.x > cardMax.x + margin ||
    v_uv.y < cardMin.y - margin || v_uv.y > cardMax.y + margin
  ) discard;

  vec2 cardSizePx = u_cardRect.zw * u_resolution;
  vec2 cardCenterPx = (cardMin + u_cardRect.zw * 0.5) * u_resolution - u_resolution * 0.5;
  vec2 localPx = gl_FragCoord.xy - u_resolution * 0.5 - cardCenterPx;
  vec2 halfSizePx = cardSizePx * 0.5;
  vec2 localCssPx = localPx / max(u_dpr, 0.001);
  vec2 halfSizeCssPx = halfSizePx / max(u_dpr, 0.001);
  float cornerRadius = min(u_radius * u_dpr, min(halfSizePx.x, halfSizePx.y));
  float d = roundedRectSDF(localPx, halfSizePx, cornerRadius, u_shapeRoundness);
  float shapeAlpha = 1.0 - smoothstep(-1.8, 1.8, d);
  if (shapeAlpha < 0.001) discard;

  float edgeDistancePx = max(-d, 0.0);
  float edgeDistanceCssPx = edgeDistancePx / max(u_dpr, 0.001);
  float outerEdgeContinuity = smoothstep(0.0, 2.0, edgeDistanceCssPx);
  float silhouetteBand = 1.0 - smoothstep(0.0, 1.2, edgeDistanceCssPx);
  float cornerSafeBevelWidthPx = min(u_bevelWidth * u_dpr, max(cornerRadius * 0.875, 1.0));
  float bevelDepth = clamp(edgeDistancePx / cornerSafeBevelWidthPx, 0.0, 1.0);
  float outerRim = (1.0 - smoothstep(0.02, 0.24, bevelDepth)) * outerEdgeContinuity;
  float bevelBody = smoothstep(0.02, 0.28, bevelDepth)
    * (1.0 - smoothstep(0.22, 1.0, bevelDepth));
  float cleanCenter = smoothstep(0.68, 1.0, bevelDepth);
  float edgeEnergy = (outerRim + bevelBody * 0.58) * shapeAlpha;

  vec2 normal = getNormal(localPx, halfSizePx, cornerRadius, u_shapeRoundness);
  float normalLength = length(normal);
  vec2 normalDir = normalLength > 0.001 ? normal / normalLength : vec2(0.0, 1.0);
  vec2 pointerLocal = vec2(
    (u_pointer.x - 0.5) * cardSizePx.x,
    (0.5 - u_pointer.y) * cardSizePx.y
  );
  vec2 pointerVector = pointerLocal - localPx;
  float pointerDistance = length(pointerVector) / max(length(cardSizePx), 1.0);
  vec2 pointerDirection = pointerDistance > 0.0001 ? pointerVector / max(length(pointerVector), 0.0001) : vec2(0.0);
  float pointerField = u_pointerHover * (1.0 - smoothstep(0.0, 0.82, pointerDistance));

  // Short-range band field drives dispersion and edge alpha; the wide lens
  // field drives the long-range Apple-style refraction falloff.
  float edgeField = pow(max(outerRim * 0.72, bevelBody * 0.52), 1.22);
  float lensFalloff = 1.0 - smoothstep(0.0, u_edgeLensRange, edgeDistanceCssPx);
  float wideField = pow(max(lensFalloff, edgeField * 0.9), 1.3);
  float mirrorBand = (1.0 - smoothstep(1.2, 4.0, edgeDistanceCssPx)) * outerEdgeContinuity;

  // The refracted rim band replaces the clean center almost completely at
  // the silhouette, so the bent surroundings read as solid glass thickness.
  float opticalDepth = clamp(wideField * 1.1 + silhouetteBand * 0.1, 0.0, 0.95);
  float pressCompression = 1.0 - u_pointerPress * 0.30;
  vec2 refractPixels = referenceEdgeDisplacement(
    localCssPx,
    halfSizeCssPx,
    normalDir,
    wideField,
    edgeField,
    bevelBody,
    mirrorBand,
    pressCompression
  ) * u_dpr;
  refractPixels += pointerDirection * pointerField * u_pointerRefraction * (10.0 + u_magnification * 52.0) * u_dpr;
  refractPixels *= outerEdgeContinuity;
  vec2 magnifyPixels = ((localCssPx - pointerLocal / max(u_dpr, 0.001)) * u_magnification * pointerField * (0.30 + edgeField * 0.46)) * u_dpr;
  magnifyPixels *= outerEdgeContinuity;
  vec2 refractOffset = (refractPixels * (0.82 + edgeEnergy * 0.18) + magnifyPixels) / u_resolution;
  vec2 dispersionAxis = normalize(normalDir + pointerDirection * pointerField * 0.35 + vec2(0.0001));
  // Chromatic aberration concentrates on the INNER shoulder of the refraction
  // band, not the silhouette itself.
  float chroma = u_refDispersion * wideField * (1.0 - silhouetteBand * 0.6) * (0.85 + bevelBody * 0.22) * outerEdgeContinuity;
  vec2 chromaOffset = dispersionAxis * chroma * u_dpr / u_resolution;
  vec2 redOffset = refractOffset * (1.0 + (1.0 - N_R) * chroma) + chromaOffset;
  vec2 greenOffset = refractOffset * (1.0 + (1.0 - N_G) * chroma);
  vec2 blueOffset = refractOffset * (1.0 + (1.0 - N_B) * chroma) - chromaOffset;

  // Center magnification: uniform "under glass" zoom toward the card center.
  vec2 normalizedLocal = clamp(
    localCssPx / max(halfSizeCssPx, vec2(1.0)),
    vec2(-1.0),
    vec2(1.0)
  );
  vec2 surfaceLensOffset = -localPx * (u_lensMagnification - 1.0) * (0.55 + cleanCenter * 0.45) / u_resolution;
  vec3 sharpBase = adjustMaterialScene(texture(u_bg, safeUv(surfaceLensOffset)).rgb);
  vec3 softBase = adjustMaterialScene(texture(u_blurredBg, safeUv(surfaceLensOffset)).rgb);
  float centerDiffusion = clamp(u_surfaceBlurMix * (0.72 + cleanCenter * 0.48), 0.0, 0.52);
  vec3 cleanGlass = mix(sharpBase, softBase, centerDiffusion);
  vec3 bevelGlass = adjustMaterialScene(sampleDispersedGlass(
    redOffset,
    greenOffset,
    blueOffset,
    clamp(0.04 + bevelBody * 0.16 + outerRim * 0.04, 0.0, 0.24)
  ));
  vec3 outRgb = mix(cleanGlass, bevelGlass, opticalDepth);
  outRgb = mix(outRgb, u_tint, u_tintAlpha * (0.34 + cleanCenter * 0.22 + opticalDepth * 0.40));
  // ---- Edge-lit slab lighting -------------------------------------------
  // One key light from the top-left drives a SOFT directional edge light;
  // the crisp hairline stroke lives in compositor-synced CSS on the card,
  // so the GL rim stays a gentle luminance gradient instead of a thick border.
  float rimFacing = clamp(dot(normalDir, KEY_LIGHT), 0.0, 1.0);
  float rimAway = clamp(dot(normalDir, -KEY_LIGHT), 0.0, 1.0);
  float rimLine = silhouetteBand;
  float rimLineLight = 0.22 + 0.78 * pow(rimFacing, 1.25);
  float rimSoft = outerRim * pow(rimFacing, 2.0);
  float pointerLight = clamp(dot(normalDir, pointerDirection), 0.0, 1.0) * pointerField;
  float shellHighlight = (
    rimLine * rimLineLight * 2.2 +
    rimSoft * 0.55 +
    rimLine * pow(rimAway, 1.5) * u_glareFactor * 0.9 +
    rimLine * pointerLight * u_pointerGlare * 0.6
  ) * u_fresnelFactor * u_edgeHighlightGain;

  // Glass thickness shading just inside the silhouette: a wide, gentle
  // gradient (no hard band) so the edge reads as depth, not a border.
  float counterRimBand = smoothstep(1.5, 3.0, edgeDistanceCssPx)
    * (1.0 - smoothstep(4.0, 8.0, edgeDistanceCssPx));
  float innerShadow = counterRimBand
    * (0.03 + edgeEnergy * u_counterRimFactor * 0.22) * (0.55 + 0.45 * rimAway)
    * u_edgeShadowGain;
  float farRim = clamp(-dot(normalDir, pointerDirection), 0.0, 1.0) * pointerField * u_counterRimFactor;

  // Soft interior glow near the top-lit corner (internal reflection).
  vec2 tlCorner = vec2(-halfSizeCssPx.x, halfSizeCssPx.y);
  float tlDist = length(localCssPx - tlCorner) / length(halfSizeCssPx);
  float interiorGlow = cleanCenter * (1.0 - smoothstep(0.25, 0.95, tlDist)) * u_glareOppositeFactor;

  float luminance = dot(outRgb, vec3(0.299, 0.587, 0.114));
  float brightBackground = smoothstep(0.56, 0.82, luminance);
  float darkBackground = 1.0 - smoothstep(0.24, 0.52, luminance);
  outRgb = mix(outRgb, vec3(1.0), clamp(interiorGlow * (0.08 + darkBackground * 0.06), 0.0, 0.3));
  vec3 highlightTint = mix(outRgb, vec3(1.0), 0.58 + darkBackground * 0.20);
  outRgb = mix(outRgb, highlightTint, clamp(shellHighlight * (0.85 + darkBackground * 0.15), 0.0, 0.94));
  outRgb = mix(outRgb, vec3(0.0), clamp((innerShadow + farRim * 0.06) * (0.46 + brightBackground * 0.46), 0.0, 0.34));

  float readySceneCoverage = mix(0.075, u_sceneCoverage, clamp(u_bgReady, 0.0, 1.0));
  float centerSceneCoverage = mix(readySceneCoverage * 0.72, readySceneCoverage, cleanCenter);
  float edgeAlpha = silhouetteBand * 0.02 + bevelBody * 0.03 + outerRim * 0.06
    + shellHighlight * 0.04 + edgeEnergy * 0.02;
  float alpha = clamp(centerSceneCoverage + edgeAlpha, 0.0, 0.995) * shapeAlpha;
  vec4 outColor = vec4(outRgb, alpha);
  fragColor = vec4(outColor.rgb * outColor.a, outColor.a);
}
