varying vec2 vertexUV;
varying vec3 vNormal;
varying vec4 apparent_pos;

void main(){
    vertexUV = uv;
    vNormal = ( vec4( normalize(normalMatrix * normal),1. )*modelViewMatrix ).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    apparent_pos = modelViewMatrix * vec4(vNormal,1.);
}