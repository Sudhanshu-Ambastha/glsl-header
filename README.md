# glslh ⚡

> A modular C-style `#include` preprocessor and metadata-driven uniform binder for GLSL shaders, built for zero-boilerplate integration across Vanilla WebGL, Three.js, and React Three Fiber.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebGL / Three.js](https://img.shields.io/badge/graphics-WebGL%20%2F%20Three.js-blue.svg)](https://threejs.org/)

---

## 🎨 Architecture & CPU/GPU Division of Labor

`glslh` establishes a clean pipeline separating CPU-side orchestration from GPU-side parallel rendering:

```
  .glslh (Self-Contained Header)
 ┌─────────────────────────────┐
 │  /* @uniforms { ... } */    │ ──► [CPU] Auto-linked JS-to-GLSL Uniforms
 │  #include "utils/noise.glsl"│ ──► [CPU] Recursive File & Dependency Resolution
 │  Math.PI macro injection    │ ──► [CPU] JIT Constant Evaluator
 └──────────────┬──────────────┘
                ▼
      [ glslh Preprocessor ]
                ▼
 ┌─────────────────────────────┐
 │  Final Pure GLSL String     │ ──► [GPU] Compiled & Executed via WebGL
 └─────────────────────────────┘

```

- **CPU-Side (JavaScript):** File fetching, `#include` stitching, uniform metadata parsing, constant macro evaluation (`Math.PI`, `Math.TAU`), and real-time animation loops (`requestAnimationFrame`).
- **GPU-Side (WebGL / GLSL):** Pure parallel rasterization, vertex positioning, and fragment color blending executing simultaneously across graphics hardware cores.

---

## ✨ Features & Benefits

- **Clear CPU/GPU Separation:** All orchestration, math constant calculations (`Math.PI`), and uniform state updates run efficiently on the **CPU**, while heavy rasterization and pixel shading run natively in parallel on the **GPU**.
- **Zero Runtime Performance Cost:** Because modular files are stitched and compiled once during initialization, your shaders execute at full native GPU speed with zero runtime overhead.
- **C-Style `#include` Directives:** Split massive shaders into modular files with full circular dependency protection.
- **Self-Contained Metadata Blocks:** Define uniform data types and default values right at the top of your shader file (`@uniforms`).
- **Direct JavaScript Math Injection:** Use native JS constants like `Math.PI` or `Math.TAU` directly in your GLSL code; the preprocessor evaluates them before GPU compilation.
- **Framework Agnostic:** Seamlessly output standard Three.js `ShaderMaterial` objects ready for Vanilla JS, Three.js, or React Three Fiber.
- **HTML Declarative Support:** Spin up shaders instantly using HTML data attributes (`data-fragment-url="..."`).

---

## 🔍 Understanding the `/* @uniforms */` Block

The metadata block is an optional JSON declaration placed at the very top of your `.glslh` header file:

```glsl
/* @uniforms
  {
    "u_intensity": { "type": "f", "value": 1.0 },
    "u_color": { "type": "c", "value": [1.0, 0.4, 0.0] }
  }
*/

```

### Why use it?

In standard WebGL and Three.js, wiring JavaScript variables to shader uniforms requires tedious boilerplate. The `@uniforms` block decentralizes this configuration, letting your shader file declare its own parameters so `glslh` can auto-bind them into Three.js uniform structures instantly.

### What if you forget it?

**Nothing breaks.** The parser is completely fault-tolerant. If the comment block is missing, the parser simply returns an empty uniform object (`{}`), and your shader compiles and renders successfully using standard built-in uniforms (like `u_time` and `u_resolution`).

- **When to Use:** Use it when your shader needs custom adjustable parameters, colors, or default numerical inputs managed from JavaScript.
- **When to Omit:** Omit it when your shader is purely procedural, self-contained, or relies solely on built-in time and coordinate attributes.

---

## 🚀 Installation & Quick Start

```bash
npm install glslh
```

### 1. Create a `.glslh` Shader File (`./shaders/header.glslh`)

Refer to the complete working example setup here: [GLSLH](./test/shaders/header.glslh)

### 2. Run Declaratively in HTML (`index.html`)

Refer to the complete working example setup here: [index.html](./test/index.html)

---

## 📂 Project Structure

```text
package/
├── package.json
├── README.md
└── src/
    ├── parser.js       # The C-style #include preprocessor & Math.PI injector
    ├── loader.js       # Metadata JSON parser & Three.js uniform binder
    └── dom-canvas.js   # HTML data-attribute and canvas auto-loader wrapper

```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
