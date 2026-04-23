#version 300 es
precision highp float;

#define PI 3.14159265359

const float N_R = 1.0 - 0.02;
const float N_G = 1.0;
const float N_B = 1.0 + 0.02;

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
out vec4 fragColor;

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  return pow(pow(p.x, n) + pow(p.y, n), 1.0 / n) - r;
}

float roundedRectSDF(vec2 p, vec2 halfSize, float cr, float n) {
  vec2 d = abs(p) - halfSize;
  if (d.x > -cr && d.y > -cr) {
    vec2 cornerCenter = sign(p) * (halfSize - vec2(cr));
    vec2 cornerP = p - cornerCenter;
    return superellipseCornerSDF(cornerP, cr, n);
  }
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec2 getNormal(vec2 p, vec2 halfSize, float cr, float n) {
  float eps = max(abs(dFdx(p.x)), 0.0001);
  float dx = roundedRectSDF(p + vec2(eps, 0.0), halfSize, cr, n)
           - roundedRectSDF(p - vec2(eps, 0.0), halfSize, cr, n);
  float dy = roundedRectSDF(p + vec2(0.0, eps), halfSize, cr, n)
           - roundedRectSDF(p - vec2(0.0, eps), halfSize, cr, n);
  return vec2(dx, dy) / (2.0 * eps);
}

float vec2ToAngle(vec2 v) {
  float a = atan(v.y, v.x);
  if (a < 0.0) a += 2.0 * PI;
  return a;
}

vec4 getTextureDispersion(
  sampler2D tex1, sampler2D tex2,
  float mixRate, vec2 offset, float factor
) {
  float bgR  = texture(tex1, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
  float bgG  = texture(tex1, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
  float bgB  = texture(tex1, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;
  float blR  = texture(tex2, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
  float blG  = texture(tex2, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
  float blB  = texture(tex2, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;
  return vec4(mix(bgR, blR, mixRate), mix(bgG, blG, mixRate), mix(bgB, blB, mixRate), 1.0);
}

void main() {
  vec2 uv = v_uv;
  vec2 cardMin = u_cardRect.xy;
  vec2 cardMax = u_cardRect.xy + u_cardRect.zw;
  vec2 cardCenter = cardMin + u_cardRect.zw * 0.5;

  float margin = 2.0 / u_resolution.y;
  if (uv.x < cardMin.x - margin || uv.x > cardMax.x + margin ||
      uv.y < cardMin.y - margin || uv.y > cardMax.y + margin) {
    discard;
  }

  vec2 cardSizePx = u_cardRect.zw * u_resolution;
  vec2 cardCenterPx = (cardCenter * u_resolution) - u_resolution * 0.5;
  vec2 fragPx = gl_FragCoord.xy - u_resolution * 0.5;

  vec2 localPx = fragPx - cardCenterPx;
  vec2 halfSizePx = cardSizePx * 0.5;
  float crPx = min(u_radius, min(halfSizePx.x, halfSizePx.y));
  float d = roundedRectSDF(localPx, halfSizePx, crPx, u_shapeRoundness);

  /* Wider AA band for a softer glass-to-air edge */
  float shapeAlpha = 1.0 - smoothstep(-1.8, 1.8, d);
  if (shapeAlpha < 0.001) discard;

  float merged = d / u_resolution.y;
  float nmerged = -1.0 * merged * (u_resolution.y / u_dpr);

  vec4 outColor;

  if (merged < 0.005) {
    float x_R_ratio = 1.0 - nmerged / u_refThickness;
    float thetaI = asin(clamp(pow(max(x_R_ratio, 0.0), 2.0), 0.0, 1.0));
    float thetaT = asin(clamp(1.0 / u_refFactor * sin(thetaI), -1.0, 1.0));
    float edgeFactor = -1.0 * tan(thetaT - thetaI);
    if (nmerged >= u_refThickness) {
      edgeFactor = 0.0;
    }

    if (edgeFactor <= 0.0) {
      /* Interior fill: strong frosted glass */
      vec4 sharpBase = texture(u_bg, v_uv);
      vec4 softBase = texture(u_blurredBg, v_uv);
      outColor = mix(sharpBase, softBase, 0.68);
      /* Boost saturation slightly for Apple-style vibrancy */
      float lum = dot(outColor.rgb, vec3(0.299, 0.587, 0.114));
      outColor.rgb = mix(vec3(lum), outColor.rgb, 1.12);
      outColor = mix(outColor, vec4(u_tint, 1.0), u_tintAlpha * 0.6);
    } else {
      /* Edge refraction zone */
      float edgeH = nmerged / u_refThickness;
      float rim = 1.0 - smoothstep(0.06, 0.82, edgeH);
      vec2 normal = getNormal(localPx, halfSizePx, crPx, u_shapeRoundness);
      float normalLen = length(normal);
      vec2 normalDir = normalLen > 0.001 ? normalize(normal) : vec2(0.0);

      /* Stronger refraction offset for visible light bending */
      vec2 refractOffset = -normalDir * edgeFactor * 0.08 * u_dpr *
        vec2(u_resolution.y / (u_resolution.x / u_dpr), 1.0);

      vec4 blurredPixel = getTextureDispersion(
        u_bg, u_blurredBg,
        clamp(0.32 + edgeH * 0.36, 0.0, 0.78),
        refractOffset,
        u_refDispersion
      );

      outColor = mix(blurredPixel, vec4(u_tint, 1.0), u_tintAlpha * 0.5);

      /* Fresnel edge highlight */
      float fresnelFactor = clamp(
        pow(
          1.0 + merged * (u_resolution.y / u_dpr) / 1500.0 *
            pow(500.0 / u_fresnelRange, 2.0) + u_fresnelHardness,
          5.0
        ), 0.0, 1.0
      );
      outColor = mix(
        outColor,
        vec4(1.0),
        fresnelFactor * u_fresnelFactor * 0.32 * rim * (0.4 + 0.5 * normalLen)
      );

      /* Glare — directional stripe highlight */
      float glareGeoFactor = clamp(
        pow(
          1.0 + merged * (u_resolution.y / u_dpr) / 1500.0 *
            pow(500.0 / u_glareRange, 2.0) + u_glareHardness,
          5.0
        ), 0.0, 1.0
      );

      float glareAngle2 = (vec2ToAngle(normalDir) - PI / 4.0 + u_glareAngle) * 2.0;
      int glareFarside = 0;
      if ((glareAngle2 > PI * 1.5 && glareAngle2 < PI * 3.5) ||
          glareAngle2 < PI * -0.5) {
        glareFarside = 1;
      }
      float glareAngleFactor = (0.5 + sin(glareAngle2) * 0.5) *
        (glareFarside == 1 ? 1.2 * u_glareOppositeFactor : 1.2) *
        u_glareFactor;
      glareAngleFactor = clamp(
        pow(glareAngleFactor, 0.1 + u_glareConvergence * 2.0),
        0.0, 1.0
      );

      outColor = mix(
        outColor,
        vec4(1.0),
        glareAngleFactor * glareGeoFactor * rim * (0.15 + 0.45 * normalLen)
      );

      /* Blend edge refraction into frosted center via rim */
      vec4 centerBase = mix(texture(u_bg, v_uv), texture(u_blurredBg, v_uv), 0.62);
      float lum2 = dot(centerBase.rgb, vec3(0.299, 0.587, 0.114));
      centerBase.rgb = mix(vec3(lum2), centerBase.rgb, 1.12);
      outColor = mix(centerBase, outColor, 0.28 + rim * 0.72);
    }
  } else {
    outColor = texture(u_bg, v_uv);
  }

  /* shapeAlpha handles the soft edge fade — no extra smoothstep needed */
  outColor.a *= shapeAlpha;

  fragColor = vec4(outColor.rgb * outColor.a, outColor.a);
}
