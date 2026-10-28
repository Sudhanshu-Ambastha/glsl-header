float getPulse(float time, float speed) {
    return sin(time * speed * Math.PI) * 0.5 + 0.5;
}