## 📋 `glslh` Changelog

### **v1.2.0** (Latest)

- **Topological Sorting for Derived Uniforms**: Upgraded `buildDerived` in `derived.js` to implement Kahn's algorithm for dependency graphs, ensuring derived uniform expressions evaluate in the correct order regardless of JSON declaration placement and throwing immediate errors on circular dependencies.
- **Enhanced Expression Engine & Math Utilities**: Fixed operator precedence for exponentiation (`**`) with correct right-associativity, and introduced software implementations of essential GLSL math functions (`mix`, `smoothstep`, `clamp`, `fract`, `step`, `mod`, `length`, `distance`, `dot`) for CPU-side derived uniform evaluations. Secured variable resolution using `Object.hasOwn()`.
- **Overload-Aware Static Collision Detection**: Refactored `detectFunctionCollisions` in `parser.js` to support valid GLSL function overloading (distinguishing functions by parameter signatures) and filter out forward declaration prototypes ending in semicolons (`;`).
- **DOM Canvas Lifecycle & Mouse Tracking**: Enhanced `GLSLHDomCanvas` with real-time normalized/pixel mouse coordinate tracking (`mouseX`, `mouseY`), fixed Three.js clock delta calculation order, and added resource cleanup (`dispose()`) for geometries, materials, and WebGL contexts.
- **Native Version Pipeline Integration**: Streamlined `#version` handling by removing forced string injections and delegating version management natively to Three.js via `glslVersion: THREE.GLSL3`, completely eliminating WebGL driver compilation clashes.

---

### **v1.1.2**

- **AI-Native Error Context Mapping**: Upgraded `translateShaderError` inside `parser.js` to automatically extract and embed surrounding 5-line code snippets (`--- Code Context ---`) directly alongside modular file and line indicators, allowing developers and AI assistants to diagnose and patch WebGL compilation errors instantly without manual file lookups.

---

### **v1.1.1**

- **Documentation & README Refinement**: Updated documentation, architecture diagrams, and release logs to reflect complete structural guides for modular struct-based composition, CPU/GPU division of labor, and extension workflows.

---

### **v1.1.0**

- **Duplicate Function Collision Detection & Overloading Support**: Added automated static analysis to scan included modules and warn developers if conflicting function signatures clash, while fully supporting valid GLSL function overloading distinguished by parameter signatures.
- **Strict `#version` Directive Pinning**: Upgraded the preprocessor parsing pipeline to extract and pin `#version` directives to the absolute top of the generated string, ensuring full compliance with strict WebGL driver standards regardless of auto-injected uniform declarations or math constants.
- **Enhanced Error Line Mapping**: Improved error translation utilities to map monolithic WebGL compilation error line numbers back to their exact source file and line number (`[shape_utils.glsl:14]`).

---

### **v1.0.1**

- **Strict File Extension Whitelisting**: Added validation checks inside `GLSLHParser` to restrict `#include` directives exclusively to valid shader extensions (`.glsl`, `.glslh`, `.frag`, `.vert`, `.frag.glsl`, `.vert.glsl`), preventing security risks and unauthorized inclusions of non-shader files (e.g., `.py`, `.cpp`, `.txt`).
- **Compound Header Support**: Enhanced path checking to natively support complex shader extension combinations like `.frag.glslh` and `.vert.glslh`.
- **Robust Error Messaging**: Improved failure handling and descriptive console warnings/errors when file resolution or extension validation fails.

---

### **v1.0.0**

- **Recursive C-Style `#include` Preprocessor**: Introduced core parsing logic enabling `.glslh` and `.glsl` files to modularly include other shader headers recursively with built-in circular dependency protection.
- **Dynamic JavaScript Math Constant Injection**: Added automatic replacement of JS math expressions (such as `Math.PI` and `Math.TAU`) directly into clean GLSL numeric floats.
- **Metadata Uniforms Block (`@uniforms`)**: Implemented support for JSON-parsed `@uniforms` comment blocks to automatically generate and format Three.js uniform maps.
- **Zero-Config DOM Canvas Integration (`GLSLHDomCanvas`)**: Released `autoInitGlslCanvases()` to instantly bind canvas elements to Three.js WebGL renderers with automatic shader loading and animation loops.
