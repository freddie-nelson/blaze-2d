#version 300 es

precision mediump float;

uniform vec2 u_Metaballs[1000];
uniform int u_MetaballsCount;

uniform float u_Radius;
uniform float u_Threshold;
uniform vec4 u_Color;

uniform vec2 u_Resolution;

in float sqrRadius;

out vec4 outColor;

void main() {
	float infl = 0.0;	// total influence

	for(int i = 0; i < u_MetaballsCount; i++) {
		vec2 pos = u_Metaballs[i];

		float currInfl = sqrRadius;
		currInfl /= (pow(gl_FragCoord.x - pos.x, 2.0) + pow(u_Resolution.y - gl_FragCoord.y - pos.y, 2.0));

		infl += currInfl;
	}

	// don't draw if influence < threshold
	if(infl < u_Threshold)
    discard;
		
  outColor = u_Color;

	// outColor.r = infl;
	// outColor.a = 1.0; 
}