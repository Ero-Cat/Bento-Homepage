#version 300 es
precision highp float;

#define PI 3.14159265359

const float N_R = 1.0 - 0.018;
const float N_G = 1.0;
const float N_B = 1.0 + 0.018;

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
uniform float u_fresnelRange;
uniform float u_fresnelFactor;
uniform float u_fresnelHardness;
uniform float u_glareFactor;
uniform float u_glareAngle;
uniform float u_glareConvergence;
uniform float u_glareRange;
uniform float u_glareHardness;
uniform float u_glareOppositeFactor;
uniform vec3 u_tint;
uniform float u_tintAlpha;
uniform vec2 u_pointer;
uniform float u_pointerHover;
uniform float u_pointerPress;
uniform float u_bevelWidth;
uniform float u_magnification;
uniform float u_surfaceRefraction;
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

vec2 referenceEdgeDisplacement(
  vec2 localCssPx,
  vec2 halfSizeCssPx,
  vec2 normalDir,
  float edgeField,
  float bevelBody,
  float pressCompression
) {
  vec2 safeHalfSize = max(halfSizeCssPx, vec2(1.0));
  vec2 normalizedLocal = clamp(localCssPx / safeHalfSize, vec2(-1.0), vec2(1.0));
  float centerDistance = clamp(length(normalizedLocal), 0.0, 1.0);
  float maxPullPx = u_refThickness * (0.42 + bevelBody * 0.08);
  vec2 centerPull = -localCssPx * edgeField * (0.045 + u_refFactor * 0.015);
  centerPull *= min(1.0, maxPullPx * 0.55 / max(length(centerPull), 0.0001));

  vec2 lensNormal = -normalDir * edgeField * maxPullPx * (0.28 + centerDistance * 0.10);
  return (centerPull + lensNormal) * pressCompression;
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
  return max(vec3(0.0), mix(vec3(luma), color, u_saturation) * u_exposure);
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
  float silhouetteBand = 1.0 - smoothstep(0.0, 1.5, edgeDistanceCssPx);
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

  float edgeField = pow(max(outerRim * 0.72, bevelBody * 0.52), 1.22);
  float opticalDepth = clamp(edgeField * 0.82 + silhouetteBand * 0.05, 0.0, 0.48);
  float pressCompression = 1.0 - u_pointerPress * 0.30;
  vec2 refractPixels = referenceEdgeDisplacement(
    localCssPx,
    halfSizeCssPx,
    normalDir,
    edgeField,
    bevelBody,
    pressCompression
  ) * u_dpr;
  refractPixels += pointerDirection * pointerField * u_pointerRefraction * (10.0 + u_magnification * 52.0) * u_dpr;
  refractPixels *= outerEdgeContinuity;
  vec2 magnifyPixels = ((localCssPx - pointerLocal / max(u_dpr, 0.001)) * u_magnification * pointerField * (0.30 + edgeField * 0.46)) * u_dpr;
  magnifyPixels *= outerEdgeContinuity;
  vec2 refractOffset = (refractPixels * (0.82 + edgeEnergy * 0.18) + magnifyPixels) / u_resolution;
  vec2 dispersionAxis = normalize(normalDir + pointerDirection * pointerField * 0.35 + vec2(0.0001));
  float chroma = u_refDispersion * edgeField * (0.54 + bevelBody * 0.14) * outerEdgeContinuity;
  vec2 chromaOffset = dispersionAxis * chroma * u_dpr / u_resolution;
  vec2 redOffset = refractOffset * (1.0 + (1.0 - N_R) * chroma) + chromaOffset;
  vec2 greenOffset = refractOffset * (1.0 + (1.0 - N_G) * chroma);
  vec2 blueOffset = refractOffset * (1.0 + (1.0 - N_B) * chroma) - chromaOffset;

  vec2 normalizedLocal = clamp(
    localCssPx / max(halfSizeCssPx, vec2(1.0)),
    vec2(-1.0),
    vec2(1.0)
  );
  vec2 surfaceLensOffset = -normalizedLocal
    * u_surfaceRefraction
    * (0.55 + cleanCenter * 0.45)
    * u_dpr
    / u_resolution;
  vec3 sharpBase = adjustMaterialScene(texture(u_bg, safeUv(surfaceLensOffset)).rgb);
  vec3 softBase = adjustMaterialScene(texture(u_blurredBg, safeUv(surfaceLensOffset)).rgb);
  float centerDiffusion = clamp(u_surfaceBlurMix * (0.72 + cleanCenter * 0.48), 0.0, 0.52);
  vec3 cleanGlass = mix(sharpBase, softBase, centerDiffusion);
  vec3 bevelGlass = adjustMaterialScene(sampleDispersedGlass(
    redOffset,
    greenOffset,
    blueOffset,
    clamp(0.12 + bevelBody * 0.24 + outerRim * 0.06, 0.0, 0.42)
  ));
  vec3 outRgb = mix(cleanGlass, bevelGlass, opticalDepth);
  outRgb = mix(outRgb, u_tint, u_tintAlpha * (0.34 + cleanCenter * 0.22 + opticalDepth * 0.40));

  float fresnel = pow(
    clamp(silhouetteBand * 0.42 + outerRim * 0.68 + bevelBody * 0.08, 0.0, 1.0),
    2.0 + u_fresnelHardness
  );
  vec2 glareDirection = normalize(vec2(cos(u_glareAngle * PI), sin(u_glareAngle * PI)));
  float glareSweep = dot(localPx, glareDirection) / max(u_glareRange * u_dpr, 1.0);
  float glareBand = smoothstep(-1.0, u_glareConvergence, glareSweep)
    * (1.0 - smoothstep(u_glareConvergence, 1.0 + u_glareHardness, glareSweep));
  float fixedLight = clamp(dot(normalDir, glareDirection), 0.0, 1.0) * (0.58 + glareBand * 0.42);
  float pointerLight = clamp(dot(normalDir, pointerDirection), 0.0, 1.0) * pointerField;
  float oppositeLight = clamp(dot(normalDir, -glareDirection), 0.0, 1.0) * u_glareOppositeFactor;
  float shellHighlight = fresnel * (
    u_fresnelFactor * (0.40 + fixedLight * 0.74) +
    u_glareFactor * glareBand * (0.48 + fixedLight * 0.78) +
    oppositeLight * 0.052 +
    pointerLight * u_pointerGlare * 0.30
  ) * u_edgeHighlightGain;
  float counterRimBand = smoothstep(1.5, 2.5, edgeDistanceCssPx)
    * (1.0 - smoothstep(3.5, 5.0, edgeDistanceCssPx));
  float innerShadow = counterRimBand
    * (0.010 + edgeEnergy * u_counterRimFactor * 0.20)
    * u_edgeShadowGain;
  float farRim = clamp(-dot(normalDir, pointerDirection), 0.0, 1.0) * pointerField * u_counterRimFactor;
  float luminance = dot(outRgb, vec3(0.299, 0.587, 0.114));
  float brightBackground = smoothstep(0.56, 0.82, luminance);
  float darkBackground = 1.0 - smoothstep(0.24, 0.52, luminance);
  vec3 highlightTint = mix(outRgb, vec3(1.0), 0.34 + darkBackground * 0.22);
  outRgb = mix(outRgb, highlightTint, clamp(shellHighlight * (0.42 + darkBackground * 0.58), 0.0, 0.72));
  outRgb = mix(outRgb, vec3(0.0), clamp((innerShadow + farRim * 0.06) * (0.46 + brightBackground * 0.46), 0.0, 0.32));

  float readySceneCoverage = mix(0.075, u_sceneCoverage, clamp(u_bgReady, 0.0, 1.0));
  float centerSceneCoverage = mix(readySceneCoverage * 0.72, readySceneCoverage, cleanCenter);
  float edgeAlpha = silhouetteBand * 0.045 + bevelBody * 0.04 + outerRim * 0.09 + shellHighlight * 0.045 + edgeEnergy * 0.02;
  float alpha = clamp(centerSceneCoverage + edgeAlpha, 0.0, 0.995) * shapeAlpha;
  vec4 outColor = vec4(outRgb, alpha);
  fragColor = vec4(outColor.rgb * outColor.a, outColor.a);
}
