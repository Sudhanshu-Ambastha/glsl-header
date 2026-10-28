## 📋 `glslh` Changelog

### **v1.0.1** (Latest)

- **Strict File Extension Whitelisting**: Added validation checks inside `GLSLHParser` to restrict `#include` directives exclusively to valid shader extensions (`.glsl`, `.glslh`, `.frag`, `.vert`, `.frag.glsl`, `.vert.glsl`), preventing security risks and unauthorized inclusions of non-shader files (e.g., `.py`, `.cpp`, `.txt`).
- **Compound Header Support**: Enhanced path checking to natively support complex shader extension combinations like `.frag.glslh` and `.vert.glslh`.
- **Robust Error Messaging**: Improved failure handling and descriptive console warnings/errors when file resolution or extension validation fails.

---

### **v1.0.0**

- **Recursive C-Style `#include` Preprocessor**: Introduced core parsing logic enabling `.glslh` and `.glsl` files to modularly include other shader headers recursively with built-in circular dependency protection.
- **Dynamic JavaScript Math Constant Injection**: Added automatic replacement of JS math expressions (such as `Math.PI` and `Math.TAU`) directly into clean GLSL numeric floats.
- **Metadata Uniforms Block (`@uniforms`)**: Implemented support for JSON-parsed `@uniforms` comment blocks to automatically generate and format Three.js uniform maps.
- **Zero-Config DOM Canvas Integration (`GLSLHDomCanvas`)**: Released `autoInitGlslCanvases()` to instantly bind canvas elements to Three.js WebGL renderers with automatic shader loading and animation loops.
