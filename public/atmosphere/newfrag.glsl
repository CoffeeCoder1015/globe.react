varying vec2 vertexUV;
varying vec3 vNormal;

uniform vec3 lightPosition;
uniform float ambientLightIntensity;
uniform float radiusEarth;
uniform float radiusAtmosphere;

float blackbody(float lam, float T){
    return pow(lam,3.)/(exp(lam/T)-1.);
}

float sun(float lam){
    return blackbody(10.*lam+1.,1.) / 1.5;
}

float rayleigh_sim(float x, float lam){
    float component1 = x*x*lam + 1.;
    float component2 = x + 1.;
    return 1./(pow(component1,4.)*pow(component2,2.));
}

float spd(float x, float lam){
    return (1.-sun(lam))*rayleigh_sim(x,lam);
}

float g_comp(float x, float meu, float tau){
    float tSqr = pow(tau,2.);
    float ndistExp = pow(x-meu,2.)/2.;
    return exp(-tSqr*ndistExp);
}

float g(float x, float meu, float tau1, float tau2){
    if (x < meu){
        return g_comp(x,meu,tau1);
    }
    // x >= meu
    return g_comp(x,meu,tau2);
}


vec3 colorMatch(float lam){
    lam = 400.*lam + 380.;
    
    vec3 XYZ = vec3(0.);
    XYZ.x = (1.056 * g(lam,599.8,0.0264,0.0323) + 0.362*g(lam,442.0,0.0624,0.0374) -0.065*g(lam,501.1,0.0490,0.0382));
    XYZ.y = (0.821*g(lam,568.8,0.0213,0.0247) + 0.286*g(lam,530.9,0.0613,0.0322));
    XYZ.z = (1.217*g(lam,437.0,0.0845,0.0278) + 0.681*g(lam,459.0,0.0385,0.0725));
    
    return XYZ;
}

#define N 50.

vec3 RayToXYZ(float x){
    vec3 XYZ = vec3(0.);
    for (float i = 0.; i < N; i+=1.){
        float power = spd(x,i/N);        
        vec3 rawXYZ = colorMatch(i/N);
        XYZ += power*rawXYZ;
    }
    XYZ /= N;
    return XYZ;
}

// mat3 XYZtoRGBMat = mat3(
//     2.3646, -0.8965, -0.4681,
//    -0.5152,  1.4264,  0.0888,
//     0.0052, -0.0144,  1.0092
// );
mat3 XYZtoRGBMat = mat3(
    3.2406, -1.5372, -0.4986,
   -0.9689,  1.8758,  0.0415,
    0.0557, -0.2040,  1.0570
);

vec3 XYZtoRGB(vec3 XYZ){
    float s = XYZ.x+XYZ.y+XYZ.z;
    vec3 RGB = XYZ* XYZtoRGBMat ;
    RGB /= s;

    float s2 = RGB.x+RGB.y+RGB.z;
    RGB /= s2;

    return vec3(RGB.x,RGB.y,RGB.z);
}


void main(){
    vec3 con = normalize( cameraPosition );
    // reverse halo effect
    float intensity = dot(vNormal,con);
    float sun_on_lignt = dot(normalize(lightPosition),con);
    intensity = pow(intensity,4.);
    
    // general lighting
    vec3 lightDirection = lightPosition-vNormal*radiusAtmosphere;
    float lightingIntensity = dot(normalize(lightDirection), vNormal);

    vec3 XYZ = RayToXYZ(lightingIntensity*7.);
    vec3 RGB = XYZtoRGB(XYZ);

    gl_FragColor = vec4(RGB,0.7*clamp(intensity, 0., 1. ));
}