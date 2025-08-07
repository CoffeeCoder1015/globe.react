varying vec2 vertexUV;
varying vec3 vNormal;
varying vec4 apparent_pos;

uniform vec3 lightPosition;
uniform float ambientLightIntensity;
uniform float radiusEarth;
uniform float radiusAtmosphere;

void main(){
    vec3 con = normalize( cameraPosition );
    float dist = distance(apparent_pos.xy,vec2(0.));
    // reverse halo effect
    float bloomintensity = dot(vNormal,con);
    float sun_on_lignt = dot(normalize(lightPosition),con);
    float intensity = bloomintensity*pow(0.8,dist*radiusAtmosphere);
    
    // general lighting
    vec3 lightDirection = lightPosition-vNormal*radiusAtmosphere;
    float lightingIntensity = dot(normalize(lightDirection), vNormal);
    
    // camera
    float t = dot(con,radiusAtmosphere/2.*vNormal); // ig its not really the radius?!
    vec4 blueHue = vec4(0.5,0.6,1.,1.);
    blueHue.xyz *= lightingIntensity+gl_FragColor.xyz;
    blueHue.xyz = clamp(blueHue.xyz,0.2,7.);
    blueHue.w = clamp(lightingIntensity,0.3,0.7);
    gl_FragColor = blueHue;
    // gl_FragColor = blueHue*gl_FragColor+lightingIntensity/4.;
    gl_FragColor.xyz*=intensity*t/2.*(1.-sun_on_lignt*0.5);
}
