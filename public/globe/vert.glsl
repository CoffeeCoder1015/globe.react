varying vec2 vertexUV;
varying vec3 vNormal;

void main(){
    vertexUV = uv;
    vNormal = ( vec4( normalize(normalMatrix * normal),1. )*modelViewMatrix ).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}