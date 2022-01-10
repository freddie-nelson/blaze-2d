#version 300 es

precision mediump float;

in vec2 texCoord;
in vec2 uv;
in float opacity;

uniform sampler2D u_Texture;

out vec4 outColor;

void main() {
  // convert uv from 0 -> 1 to -1 -> 1
  vec2 UV = uv * 2.0 - 1.0;

  // no sqrt needed cause -1 to 1
  float dist = UV.x * UV.x + UV.y * UV.y;

  // discard pixels outside circle
  if (dist > 1.0) {
    discard;
  }

  // sample texture
  outColor = texture(u_Texture, texCoord);
  outColor.a *= opacity;

  // anti-aliasing
  // outColor.a = smoothstep(0.0, 0.008, dist);
}