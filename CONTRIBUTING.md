# Contributing to glslh

First off, thank you for taking the time to contribute! `glslh` is built to make modular shader development and live previewing seamless for WebGL and Three.js developers.

Whether it's bug fixes, parser improvements, standard library additions, or documentation enhancements, contributions are deeply appreciated.

---

## Getting Started

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/Sudhanshu-Ambastha/glsl-header.git
   ```
   ```bash
   cd glsl-header/extension
   ```
2. **Install Dependencies**
   Make sure you have Node.js installed, then install the project dependencies:

   ```bash
   npm install
   ```

3. **Build the Extension**
   To compile the TypeScript code and bundle it using Webpack:
   ```bash
   npm run compile
   ```

Or run the watch mode during active development:

```bash
npm run watch
```

---

## Development Workflow

- **Parser & Core Logic:** Located in `src/`. The core preprocessing, path resolution, and `#include` parsing logic reside here.
- **VS Code Extension & Webview:** `src/extension.ts` and `src/previewPanel.ts` manage the editor integration and the live Three.js WebGL previewer panel.
- **Testing the Extension Locally:**

1. Open the `extension` folder in VS Code.
2. Press `F5` to open a new **Extension Development Host** window with `glslh-previewer` loaded.
3. Open any `.glslh` or `.glsl` file and run the command `GLSLH: Open Live Shader Preview`.

---

## Submitting a Pull Request

1. **Create a Branch:** Name your branch descriptively (e.g., `fix/path-resolution` or `feat/uniform-sliders`).
2. **Commit Changes:** Write clear, concise commit messages following conventional commit standards where possible (e.g., `fix: normalize relative include paths correctly`).
3. **Open a Pull Request:** Submit your PR against the `main` branch with a clear description of the problem solved or feature added.

---

## Code of Conduct

Please be respectful, constructive, and collaborative in all discussions, issues, and pull requests. Happy shader crafting!
