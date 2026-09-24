#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_bg;
uniform sampler2D u_bgPrev;
uniform vec4 u_bgCover;
uniform vec4 u_bgPrevCover;
uniform vec4 u_veilTop;
uniform vec4 u_veilMid;
uniform vec4 u_veilBottom;
uniform float u_veilStrength;
uniform float u_crossfadeMix;

out vec4 fragColor;

vec2 coverUv(vec2 uv, vec4 transform) {
  return clamp(uv * transform.xy + transform.zw, vec2(0.001), vec2(0.999));
}

// Triangle-congruent dither: the veil gradients over smooth photo regions
// band visibly in 8-bit buffers without it.
float ditherNoise(vec2 p) {
  float a = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(p + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b) * 0.5 - 0.5;
}

void main() {
  vec4 prevBase = texture(u_bgPrev, coverUv(v_uv, u_bgPrevCover));
  vec4 nextBase = texture(u_bg, coverUv(v_uv, u_bgCover));
  vec4 base = mix(prevBase, nextBase, clamp(u_crossfadeMix, 0.0, 1.0));
  float pageY = 1.0 - v_uv.y;
  float topMix = smoothstep(0.0, 0.45, pageY);
  float bottomMix = smoothstep(0.52, 1.0, pageY);
  vec4 veil = mix(u_veilTop, u_veilMid, topMix);
  veil = mix(veil, u_veilBottom, bottomMix);
  float veilAlpha = clamp(veil.a * u_veilStrength, 0.0, 1.0);
  vec3 scene = mix(base.rgb, veil.rgb, veilAlpha);
  scene += ditherNoise(gl_FragCoord.xy) * (1.2 / 255.0);
  fragColor = vec4(scene, 1.0);
}
