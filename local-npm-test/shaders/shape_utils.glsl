// A helper function that generates an animated pulsing ring shape
float getRing(vec2 uv, float radius, float width) {
    float dist = length(uv);
    // Using Math.TAU injected by our glslh preprocessor!
    float ring = smoothstep(radius, radius + 0.01, dist) - smoothstep(radius + width, radius + width + 0.01, dist);
    return ring;
}