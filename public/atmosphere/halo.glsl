varying vec2 vertexUV;
varying vec3 vNormal;
varying vec4 apparent_pos;

uniform vec3 lightPosition;
uniform float ambientLightIntensity;
uniform float radiusEarth;
uniform float radiusAtmosphere;

void main(){
    gl_FragColor = vec4(1.-distance(apparent_pos.xy,vec2(0.)));
}
