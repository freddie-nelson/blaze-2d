#version 300 es

precision mediump float;

in vec2 texCoord;

uniform sampler2D u_Texture;

out vec4 outColor;

void main() {
  vec2 uv = texCoord * 2.0 - 1.0;

  // no sqrt needed cause -1 to 1
  float dist = 1.0 - (uv.x * uv.x + uv.y * uv.y);

  // discard pixels outside circle
  if (dist < 0.0) {
    discard;
  }

  // sample texture
  outColor = texture(u_Texture, texCoord);

  // anti-aliasing
  outColor.a = smoothstep(0.0, 0.005, dist);
}