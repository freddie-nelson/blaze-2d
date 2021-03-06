#version 300 es

precision mediump float;

in vec2 texCoord;
in vec2 uv;
in float opacity;

uniform sampler2D u_Texture;

out vec4 outColor;

void main() {
  outColor = texture(u_Texture, texCoord);
  outColor.a *= opacity;
}