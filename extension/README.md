# glslh-previewer ⚡

> Instant live WebGL shader previewer, interactive color pickers, and C-style `#include` preprocessor for [`glslh`](https://www.npmjs.com/package/glslh) inside Visual Studio Code—with Shadertoy entry-point compatibility.

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/Sudhanshu-Ambastha/glsl-header)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Web Ready](https://img.shields.io/badge/VS%20Code-Web%20%2F%20Desktop-green.svg)](https://code.visualstudio.com/)

---

## 🎨 Features

- **Instant Side-by-Side Live Preview:** Open a live, interactive WebGL preview panel right inside VS Code without stealing editor focus, updating smoothly as you type, switch shader tabs, or save files.
- **Shadertoy Entry-Point Compatibility:** Preview Shadertoy-style snippets (`mainImage`, `iTime`, `iResolution`, `iMouse`) right alongside native `.glslh` and `.glsl` shaders without manual boilerplate edits.
- **Interactive Color Pickers:** Seamless inline color decorations and native color picker widgets for `vec3()`, `vec4()`, and JSON array color definitions (`[r, g, b, a]`), letting you adjust shader colors visually on the fly.
- **Robust C-Style `#include` Resolution:** Powered by `glslh`, featuring recursive relative and `../` parent-path resolution, live unsaved buffer lookup, circular dependency protection, per-file include rules, and `#include` directive/path syntax highlighting in `.glslh` files.
- **Error-Safe Hot-Swaps & Recovery:** Keeps the last valid frame visible during mid-edit syntax issues, supports automatic `webglcontextrestored` recovery, and includes a **Reload Shader** action button inside the error banner.
- **Topological Derived Uniforms & Expression Engine:** Supports chained `@uniforms` expressions sorted via Kahn's algorithm, right-associative exponentiation (`**`), and built-in software GLSL math functions (`mix`, `smoothstep`, `clamp`, etc.).
- **Overload-Aware Static Collision Detection:** Automatically scans included modules for conflicting function signatures while fully supporting valid GLSL function overloading.
- **AI-Friendly Error Context Mapping:** Captures WebGL compilation failures and embeds surrounding code context snippets alongside modular file and line numbers.
- **Universal Cross-Platform Support:** Fully bundled via Webpack to run out-of-the-box on both **VS Code Desktop** and **VS Code Web** (such as vscode.dev or browser environments).

---

## 🚀 Quick Start & Usage

1. Open any `.glslh` or `.glsl` file in your workspace.
2. Click the **Play** icon button in the top-right editor title bar, or open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and execute:
   > `GLSLH: Open Live Shader Preview`
3. A side-by-side Webview panel will open and start rendering immediately. Edits to your shader or included files update the preview live as you type or save, and switching between shader tabs keeps the preview in sync.

---

## 📂 Multi-File Project Layout Example

`glslh-previewer` works naturally with modular project layouts:

```text
workspace/
├── shaders/
│   ├── header.glslh      # Main entry point with #include "./math_utils.glsl"
│   ├── math_utils.glsl   # Reusable math functions & helper utilities
│   └── shape_utils.glsl  # Signed distance fields / geometry math

```

---

## 📦 Requirements & Dependencies

- Requires an active VS Code workspace containing GLSL or `.glslh` files.
- Bundles and utilizes the core [`glslh`](https://www.npmjs.com/package/glslh) npm preprocessor package (`v1.3.0`).
- Three.js is loaded dynamically via secure CDN inside the sandboxed Webview to keep the extension package lightweight and performant.

---

## 🛠️ Known Limitations & Roadmap

- Optimized for single-pass fragment shader evaluation and procedural raymarching/canvas rendering in this release.

---

## 🌐 Links & Resources

- **GitHub Repository:** [glsl-header](https://github.com/Sudhanshu-Ambastha/glsl-header)
- **Core npm Package:** [glslh](https://www.npmjs.com/package/glslh)

**Enjoy building modular, lightweight shaders! ⚡**
