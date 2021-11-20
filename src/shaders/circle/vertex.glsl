#version 300 es

in vec2 a_Vertex;
in vec2 a_TexCoord;

uniform float u_ZIndex;

out vec2 texCoord;

void main() {
  texCoord = a_TexCoord;
  gl_Position = vec4(a_Vertex.x, a_Vertex.y, u_ZIndex, 1.0);
}