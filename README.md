# glslh ⚡

> A modular C-style `#include` preprocessor and metadata-driven uniform binder for GLSL shaders, built for zero-boilerplate integration across Vanilla WebGL, Three.js, and React Three Fiber—with out-of-the-box Shadertoy entry-point compatibility.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebGL / Three.js](https://img.shields.io/badge/graphics-WebGL%20%2F%20Three.js-blue.svg)](https://threejs.org/)
[![npm version](https://img.shields.io/badge/npm-v1.3.0-blue.svg)](https://www.npmjs.com/package/glslh)

---

## 🎨 Architecture & CPU/GPU Division of Labor

`glslh` establishes a clean pipeline separating CPU-side orchestration from GPU-side parallel rendering:

```text
.glslh / Shadertoy Snippet
┌──────────────────────────────┐
│   /* @uniforms { ... } */     │ ──► [CPU] Auto-linked JS-to-GLSL Uniforms
│   #include "utils/noise.glsl" │ ──► [CPU] Recursive File & Dependency Resolution
│   Math.PI / mainImage bridge │ ──► [CPU] JIT Constants, Derived Exprs & Compat Shim
└──────────────┬───────────────┘
               ▼
      [ glslh Preprocessor ]
               ▼
┌──────────────────────────────┐
│   Final Pure GLSL3 String    │ ──► [GPU] Compiled & Executed via WebGL
└──────────────────────────────┘
```

- **CPU-Side (JavaScript):** File fetching, `#include` stitching, uniform metadata parsing, Shadertoy `mainImage` / `i*` compatibility bridging, constant macro evaluation (`Math.PI`, `Math.TAU`), topological sorting for derived uniform expressions, function collision checking, error line mapping, and real-time animation loops (`requestAnimationFrame`).
- **GPU-Side (WebGL / GLSL):** Pure parallel rasterization, vertex positioning, and fragment color blending executing simultaneously across graphics hardware cores.

---

## ✨ Features & Benefits

- **Shadertoy Compatibility Out of the Box:** Paste shaders using `mainImage(out vec4 fragColor, in vec2 fragCoord)`, `iTime`, `iResolution`, and `iMouse` alongside native `glslh` shaders (`main()`, `u_*`, `#include`, `@uniforms`) without manual entry-point rewrites.
- **Standalone `.glsl` & Mixed `.glslh` Projects:** Render standalone `.glsl` shaders side-by-side with multi-file `.glslh` modules or hybrid `.glsl` + `.glslh` include trees across multiple `<canvas class="glsl-canvas">` elements.
- **Clear CPU/GPU Separation:** All orchestration, math constant calculations (`Math.PI`), and uniform state updates run efficiently on the **CPU**, while heavy rasterization and pixel shading run natively in parallel on the **GPU**.
- **Zero Runtime Performance Cost:** Because modular files are stitched and compiled once during initialization, your shaders execute at full native GPU speed with zero runtime overhead.
- **C-Style `#include` Directives:** Split massive shaders into modular files with full circular dependency protection and strict extension validation.
- **Topological Derived Uniforms:** Chain derived expressions together in `@uniforms` (e.g., variable `u_b` depending on `u_a`) with automated Kahn's algorithm sorting and circular dependency detection.
- **Overload-Aware Static Collision Detection:** Automatically scans included modules and warns you if conflicting function signatures clash, while fully supporting valid GLSL function overloading distinguished by parameter signatures.
- **AI-Friendly Error Context Mapping:** Automatically captures and embeds 5-line surrounding code context snippets alongside modular file and line numbers when WebGL compilation fails.
- **Self-Contained Metadata Blocks:** Define uniform data types, default values, and derived per-frame formulas right at the top of your shader file (`@uniforms`).
- **Direct JavaScript Math Injection:** Use native JS constants like `Math.PI` or `Math.TAU` directly in your GLSL code; the preprocessor evaluates them before GPU compilation.
- **Framework Agnostic:** Seamlessly output standard Three.js `ShaderMaterial` objects ready for Vanilla JS, Three.js, or React Three Fiber.
- **HTML Declarative Support & Cleanup:** Spin up shaders instantly using HTML data attributes (`data-fragment-url="..."`) with full canvas disposal, `u_resolution` sync, and mouse tracking (`mouseX`, `mouseY`).

---

## 🔍 Understanding the `/* @uniforms */` Block

The metadata block is an optional JSON declaration placed at the very top of your `.glslh` header file:

```glsl
/* @uniforms
  {
    "u_intensity": { "type": "f", "value": 1.0 },
    "u_color": { "type": "c", "value": [1.0, 0.4, 0.0] },
    "u_speed": { "type": "f", "expr": "u_time * 2.0" },
    "u_wave": { "type": "f", "expr": "sin(u_speed) * 0.5" }
  }
*/

```

### Why use it?

In standard WebGL and Three.js, wiring JavaScript variables to shader uniforms requires tedious boilerplate. The `@uniforms` block decentralizes this configuration, letting your shader file declare its own parameters and derived per-frame expressions (with automatic topological dependency sorting) so `glslh` can auto-bind and update them instantly.

### What if you forget it?

**Nothing breaks.** The parser is completely fault-tolerant. If the comment block is missing, the parser simply returns an empty uniform object (`{}`), and your shader compiles and renders successfully using built-in uniforms (`u_time`, `u_delta`, `u_resolution`, `u_aspect`, `u_mouse`) when referenced.

---

## 📂 Project Structure

```text
npm-pkg/
├── package.json
├── README.md
└── src/
    ├── parser.js         # C-style #include preprocessor, path resolution & Shadertoy compat bridge
    ├── validator.js      # Static function collision checker & modular error line/context mapper
    ├── loader.js         # Metadata JSON parser & Three.js uniform binder
    ├── dom-canvas.js     # HTML data-attribute and canvas auto-loader with mouse tracking & dispose()
    ├── expr.js           # Safe, CSP-compliant AST-based JIT expression evaluator with custom math helpers
    └── derived.js        # Topological sort & per-frame derived uniform state manager

```

---

## 🚀 Installation & Quick Start

```bash
npm install glslh@1.3.0
```

### 1. Create a `.glslh` Shader File (`./shaders/scene.glslh`)

You can write native `glslh` shaders with `#include` and `@uniforms`:

```glsl
/* @uniforms
  {
    "u_tint": { "type": "c", "value": [0.2, 0.7, 1.0] }
  }
*/

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / max(u_resolution, vec2(1.0));
    float wave = 0.5 + 0.5 * sin(uv.x * Math.TAU * 2.0 + u_time * 2.0);
    fragColor = vec4(u_tint * wave, 1.0);
}

```

Or drop in a Shadertoy-style `mainImage` snippet directly:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / max(iResolution.y, 1.0);
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0.0, 2.0, 4.0));
    fragColor = vec4(col, 1.0);
}

```

### 2. Run Declaratively in HTML (`index.html`)

Serve over a local HTTP server (such as `npx serve` or VS Code Live Server) so `fetch()` can load `.glslh` modules:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>glslh Live Preview</title>
    <script type="importmap">
      {
        "imports": {
          "glslh": "./node_modules/glslh/src/dom-canvas.js",
          "three": "./node_modules/three/build/three.module.js"
        }
      }
    </script>
  </head>
  <body>
    <canvas
      class="glsl-canvas"
      data-fragment-url="./shaders/scene.glslh"
      width="600"
      height="400"
    ></canvas>

    <script type="module">
      import { autoInitGlslCanvases } from "glslh";
      autoInitGlslCanvases();
    </script>
  </body>
</html>
```

---

## ⚡ VS Code Extension (Live Preview)

Want instant syntax highlighting, color pickers, and a live WebGL preview pane right inside your editor? Install the official **[GLSLH Previewer](https://marketplace.visualstudio.com/items?itemName=SudhanshuAmbastha.glslh-previewer)** extension from the marketplace:

- **Focus-Free Live WebGL Preview:** Inspect shaders side-by-side on both **VS Code Desktop** and **VS Code Web**, updating live as you type, switch shader tabs, or save files.
- **Native Color Pickers:** Click color definitions or uniform arrays in `@uniforms` or `vec3()` blocks to adjust values visually.
- **Multi-File Resolution:** Seamlessly traces `#include` dependencies across your project directory, including unsaved buffers and `../` relative paths.

---

## 📜 License

Distributed under the [**MIT License**](./LICENSE). See for more information.
