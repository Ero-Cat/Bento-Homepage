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
uniform float u_surfaceBlurMix;
uniform float u_counterRimFactor;
uniform float u_pointerRefraction;
uniform float u_pointerGlare;
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

vec3 sampleDispersedGlass(vec2 offset, float blurMix, float dispersion) {
  vec2 redUv = safeUv(offset * (1.0 - (N_R - 1.0) * dispersion));
  vec2 greenUv = safeUv(offset * (1.0 - (N_G - 1.0) * dispersion));
  vec2 blueUv = safeUv(offset * (1.0 - (N_B - 1.0) * dispersion));
  vec3 sharp = vec3(texture(u_bg, redUv).r, texture(u_bg, greenUv).g, texture(u_bg, blueUv).b);
  vec3 soft = vec3(texture(u_blurredBg, redUv).r, texture(u_blurredBg, greenUv).g, texture(u_blurredBg, blueUv).b);
  return mix(sharp, soft, blurMix);
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
  float cornerRadius = min(u_radius, min(halfSizePx.x, halfSizePx.y));
  float d = roundedRectSDF(localPx, halfSizePx, cornerRadius, u_shapeRoundness);
  float shapeAlpha = 1.0 - smoothstep(-1.8, 1.8, d);
  if (shapeAlpha < 0.001) discard;

  float edgeDistancePx = max(-d, 0.0);
  float bevelDepth = clamp(edgeDistancePx / max(u_bevelWidth * u_dpr, 1.0), 0.0, 1.0);
  float outerRim = 1.0 - smoothstep(0.02, 0.24, bevelDepth);
  float bevelBody = smoothstep(0.04, 0.28, bevelDepth) * (1.0 - smoothstep(0.68, 1.0, bevelDepth));
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

  float opticalDepth = outerRim * 0.94 + bevelBody * 0.64;
  float pressCompression = 1.0 - u_pointerPress * 0.30;
  vec2 refractPixels = -normalDir * opticalDepth * u_refThickness * 0.16 * pressCompression;
  refractPixels += pointerDirection * pointerField * u_pointerRefraction * (8.0 + u_magnification * 38.0);
  vec2 magnifyPixels = (localPx - pointerLocal) * u_magnification * pointerField * (0.26 + bevelBody * 0.74);
  vec2 refractOffset = (refractPixels + magnifyPixels) / u_resolution;

  vec3 sharpBase = texture(u_bg, v_uv).rgb;
  vec3 softBase = texture(u_blurredBg, v_uv).rgb;
  vec3 cleanGlass = mix(sharpBase, softBase, u_surfaceBlurMix * (0.34 + cleanCenter * 0.26));
  vec3 bevelGlass = sampleDispersedGlass(
    refractOffset,
    clamp(0.22 + bevelBody * 0.44 + outerRim * 0.16, 0.0, 0.78),
    u_refDispersion * (outerRim + bevelBody * 0.34)
  );
  vec3 outRgb = mix(cleanGlass, bevelGlass, opticalDepth);
  outRgb = mix(outRgb, u_tint, u_tintAlpha * (0.20 + opticalDepth * 0.48));

  float fresnel = pow(clamp(outerRim + bevelBody * 0.38, 0.0, 1.0), 1.7 + u_fresnelHardness);
  float fixedLight = clamp(dot(normalDir, normalize(vec2(-0.42, 0.91))), 0.0, 1.0);
  float pointerLight = clamp(dot(normalDir, pointerDirection), 0.0, 1.0) * pointerField;
  float shellHighlight = fresnel * (u_fresnelFactor * (0.42 + fixedLight * 0.58) + pointerLight * u_pointerGlare * 0.24);
  float innerShadow = (1.0 - smoothstep(0.08, 0.88, bevelDepth)) * (0.042 + edgeEnergy * u_counterRimFactor);
  float farRim = clamp(-dot(normalDir, pointerDirection), 0.0, 1.0) * pointerField * u_counterRimFactor;
  float luminance = dot(outRgb, vec3(0.299, 0.587, 0.114));
  vec3 highlightTint = mix(outRgb, vec3(luminance), 0.18) * 1.055;
  outRgb = mix(outRgb, highlightTint, shellHighlight);
  outRgb = mix(outRgb, vec3(0.0), innerShadow + farRim * 0.07);

  float interiorAlpha = 0.006 + cleanCenter * 0.010 + bevelBody * 0.085 + outerRim * 0.14;
  float alpha = (interiorAlpha + shellHighlight * 0.050 + edgeEnergy * 0.026) * shapeAlpha;
  vec4 outColor = vec4(outRgb, alpha);
  fragColor = vec4(outColor.rgb * outColor.a, outColor.a);
}
