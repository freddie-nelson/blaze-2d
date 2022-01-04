#version 300 es

in vec2 a_Vertex;

uniform float u_ZIndex;
uniform mediump float u_Radius;

out mediump float sqrRadius;

void main() {
  sqrRadius = u_Radius * u_Radius;

  gl_Position = vec4(a_Vertex.x, a_Vertex.y, u_ZIndex, 1.0);
}