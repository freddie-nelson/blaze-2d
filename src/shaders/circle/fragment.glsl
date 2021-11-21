#version 300 es

precision mediump float;

in vec2 texCoord;
in vec2 uv;

uniform sampler2D u_Texture;

out vec4 outColor;

void main() {
  // convert uv from 0 -> 1 to -1 -> 1
  vec2 UV = uv * 2.0 - 1.0;

  // no sqrt needed cause -1 to 1
  float dist = 1.0 - (UV.x * UV.x + UV.y * UV.y);

  // discard pixels outside circle
  if (dist < 0.0) {
    discard;
  }

  // sample texture
  outColor = texture(u_Texture, texCoord);

  // anti-aliasing
  outColor.a = smoothstep(0.0, 0.005, dist);
}