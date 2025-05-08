#pragma glslify: snoise3 = require(glsl-noise/simplex/3d) 
#pragma glslify: cnoise3 = require(glsl-noise/classic/3d) 
#pragma glslify: pnoise3 = require(glsl-noise/periodic/3d) 

uniform float uSize;
uniform float uTime;
uniform float uAudioFrequency;
uniform float uTest;

varying vec2 vUv;

void main(){

    vec3 newPosition = position;

    float displacement = uAudioFrequency / 255.0;

    float noise = snoise3(vec3(position.x, position.y, uTime * 0.1));

    newPosition.z += noise * displacement * 2.0;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = uSize + uSize * noise;

    vUv = uv;
}