#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_blurRadius;

out vec4 fragColor;

const float W[5] = float[5](0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);

void main() {
  vec2 t = 1.0 / u_resolution;
  vec4 c = texture(u_tex, v_uv) * W[0];
  for (int i = 1; i < 5; i++) {
    float o = float(i) * u_blurRadius * t.x;
    c += texture(u_tex, v_uv + vec2(o, 0.0)) * W[i];
    c += texture(u_tex, v_uv - vec2(o, 0.0)) * W[i];
  }
  fragColor = c;
}
