#version 300 es

in vec2 a_Vertex;

uniform float u_ZIndex;

void main() {
  gl_Position = vec4(a_Vertex.x, a_Vertex.y, u_ZIndex, 1.0);
}