varying vec2 vertexUV;
varying vec3 vNormal;
varying vec4 apparent_pos;

uniform vec3 lightPosition;
uniform float ambientLightIntensity;
uniform float radiusEarth;
uniform float radiusAtmosphere;

#define rAtmSqr radiusAtmosphere*radiusAtmosphere

#define PI 3.1415926535897932384626433832795

#define orangBandThickness 1.5

void main() {
    float d = radiusAtmosphere*distance(apparent_pos.xy, vec2(0.));
    if (d > radiusEarth){
        gl_FragColor = vec4(apparent_pos);
    }
}