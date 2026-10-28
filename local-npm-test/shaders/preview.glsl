#ifdef GL_ES
precision mediump float;
#endif

void main() {
    // Uses screen coordinates to create a bright, shifting neon gradient 
    // so you can instantly verify color rendering is working!
    vec2 st = gl_FragCoord.xy / vec2(800.0, 600.0);
    
    // Vibrant neon pink, cyan, and electric blue mix
    vec3 color = vec3(st.x, st.y, 0.9);
    
    gl_FragColor = vec4(color, 1.0);
}