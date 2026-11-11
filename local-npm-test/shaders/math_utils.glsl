// Forward declarations
float getNoise(vec2 p);
float getPulse(float time, float speed);

float getNoise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float getPulse(float time, float speed) {
    // Using Math.PI injected by your glslh preprocessor!
    return sin(time * speed * Math.PI) * 0.5 + 0.5;
}