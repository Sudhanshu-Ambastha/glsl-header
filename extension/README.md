# glslh-previewer ⚡

> Instant live WebGL shader previewer and C-style `#include` preprocessor for `glslh` inside Visual Studio Code.

---

## 🎨 Features

- **One-Click Live Preview:** Instantly open a live, interactive 3D WebGL preview panel right inside VS Code with a single click or editor command.
- **Native `glslh` Integration:** Leverages the core `glslh` preprocessor to recursively resolve `#include` dependencies and evaluate JavaScript math constants (`Math.PI`, `Math.TAU`) on the fly.
- **Zero-Boilerplate Execution:** No need to manually scaffold HTML, CSS, or JS wrapper files to test your shaders—the extension handles the runner environment automatically.
- **Universal VS Code Support:** Fully optimized with Webpack to run seamlessly on both **Desktop VS Code** and **VS Code Web** (such as GitHub.dev).

---

## 🚀 Usage

1. Open any `.glslh` or `.glsl` file in your workspace.
2. Click the **Play / Preview** button in the top right editor title bar, or open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
   > `GLSLH: Open Live Shader Preview`
3. A side-by-side Webview panel will open, rendering your live interactive shader animation in real time.

---

## 📦 Requirements

This extension requires an active workspace or file containing valid GLSL / `glslh` shader code. It automatically bundles and utilizes the `glslh` npm package for dependency resolution.

---

## ⚙️ Extension Settings

This extension currently operates out of the box with zero required configuration settings.

---

## 🛠️ Known Issues

- Complex multi-pass buffer rendering chains (such as multi-buffer Shadertoy setups) are optimized for single-pass fragment evaluation in this initial release.

---

## 📜 Release Notes

### 1.0.0

- Initial release of `glslh-previewer`.
- Added support for live WebGL shader rendering inside VS Code Webviews.
- Integrated C-style `#include` preprocessor parsing and dynamic time/resolution uniform binding.

---

## 🌐 For More Information

- **GitHub Repository:** [glsl-header](https://github.com/Sudhanshu-Ambastha/glsl-header)
- **Core npm Package:** [`glslh`](https://www.npmjs.com/package/glslh)

**Enjoy building modular shaders! ⚡**
