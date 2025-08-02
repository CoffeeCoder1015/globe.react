varying vec2 vertexUV;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform vec3 lightPosition;
uniform float ambientLightIntensity;

void main(){
    float intensity = dot(normalize(lightPosition),vNormal);
    float blendFactor = smoothstep(-0.1, 0.1, intensity);
    gl_FragColor = mix( texture2D(nightTexture,vertexUV),texture2D(dayTexture,vertexUV),blendFactor)+intensity/5.+ambientLightIntensity;
}