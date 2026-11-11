# glslh-previewer ⚡

> Instant live WebGL shader previewer, interactive color pickers, and C-style `#include` preprocessor for [`glslh`](https://www.npmjs.com/package/glslh) inside Visual Studio Code.

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/Sudhanshu-Ambastha/glsl-header)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Web Ready](https://img.shields.io/badge/VS%20Code-Web%20%2F%20Desktop-green.svg)](https://code.visualstudio.com/)

---

## 🎨 Features

- **Instant Side-by-Side Live Preview:** Open a live, interactive 3D WebGL preview panel right inside VS Code with a single click or editor title bar command.
- **Interactive Color Pickers:** Seamless inline color decorations and native color picker widgets for `vec3()`, `vec4()`, and JSON array color definitions (`[r, g, b, a]`), letting you adjust shader colors visually on the fly.
- **Robust C-Style `#include` Resolution:** Powered by `glslh`, featuring an intelligent multi-candidate path resolver that handles relative paths (`./`), absolute paths, and nested includes seamlessly.
- **Topological Derived Uniforms & Expression Engine:** Supports chained `@uniforms` expressions sorted via Kahn's algorithm, correct right-associative exponentiation (`**`), and built-in software GLSL math functions (`mix`, `smoothstep`, `clamp`, etc.).
- **Overload-Aware Static Collision Detection:** Automatically scans included modules for conflicting function signatures while fully supporting valid GLSL function overloading.
- **AI-Friendly Error Context Mapping:** Captures WebGL compilation failures and embeds surrounding code context snippets alongside modular file and line numbers.
- **Universal Cross-Platform Support:** Fully optimized via Webpack to run out-of-the-box on both **VS Code Desktop** and **VS Code Web** (such as GitHub.dev or browser environments).

---

## 🚀 Quick Start & Usage

1. Open any `.glslh` or `.glsl` file in your workspace.
2. Click the **Play** icon button in the top-right editor title bar, or open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and execute:
   > `GLSLH: Open Live Shader Preview`
3. A side-by-side Webview panel will open, rendering your live, animated shader in real time. Any changes you save to your main file or included header files will instantly recompile and update the preview.

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
- Bundles and utilizes the core [`glslh`](https://www.npmjs.com/package/glslh) npm preprocessor package.
- Three.js is loaded dynamically via secure CDN inside the sandboxed Webview to keep the extension package lightweight and performant.

---

## 🛠️ Known Limitations & Roadmap

- Optimized for single-pass fragment shader evaluation and procedural raymarching/canvas rendering in this release.

---

## 🌐 Links & Resources

- **GitHub Repository:** [glsl-header](https://github.com/Sudhanshu-Ambastha/glsl-header)
- **Core npm Package:** [glslh](https://www.npmjs.com/package/glslh)

**Enjoy building modular, lightweight shaders! ⚡**
