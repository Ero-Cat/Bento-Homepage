#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_bg;
uniform sampler2D u_bgPrev;
uniform vec2 u_resolution;
uniform vec4 u_veilTop;
uniform vec4 u_veilMid;
uniform vec4 u_veilBottom;
uniform float u_veilStrength;
uniform float u_crossfadeMix;

out vec4 fragColor;

void main() {
  vec4 prevBase = texture(u_bgPrev, v_uv);
  vec4 nextBase = texture(u_bg, v_uv);
  vec4 base = mix(prevBase, nextBase, clamp(u_crossfadeMix, 0.0, 1.0));
  float pageY = 1.0 - v_uv.y;
  float topMix = smoothstep(0.0, 0.45, pageY);
  float bottomMix = smoothstep(0.52, 1.0, pageY);
  vec4 veil = mix(u_veilTop, u_veilMid, topMix);
  veil = mix(veil, u_veilBottom, bottomMix);
  float veilAlpha = clamp(veil.a * u_veilStrength, 0.0, 1.0);
  fragColor = vec4(mix(base.rgb, veil.rgb, veilAlpha), 1.0);
}
