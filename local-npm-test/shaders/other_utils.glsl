// Forward declaration for the overloaded signature
float getNoise(vec2 p, float scale);

float getNoise(vec2 p, float scale) {
    return dot(p, p) * scale;
}