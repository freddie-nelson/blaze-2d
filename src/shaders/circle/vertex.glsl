#version 300 es

in vec2 a_Vertex;
in vec2 a_TexCoord;
in vec2 a_Uv;
in float a_Opacity;

uniform float u_ZIndex;

out vec2 texCoord;
out vec2 uv;
out float opacity;

void main() {
  texCoord = a_TexCoord;
  uv = a_Uv;
  opacity = a_Opacity;

  gl_Position = vec4(a_Vertex.x, a_Vertex.y, u_ZIndex, 1.0);
}