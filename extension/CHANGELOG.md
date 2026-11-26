# Change Log

All notable changes to the "glslh-previewer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.3.0] - 2026-11-26

### Added

- **Real-Time Side-by-Side Live Editing**: Added instant live shader recompilation on keystrokes (`onDidChangeTextDocument`) alongside automatic preview switching when navigating between shader tabs (`onDidChangeActiveTextEditor`), without stealing editor focus.
- **Strict Per-File Include Policy (`strictIncludePolicy`)**: Enforced file-type include rules across `.glslh` and standard shader files so `.glslh` modules can import `.glslh`, `.glsl`, `.vert`, and `.frag` files while preventing invalid reverse or circular cross-imports.
- **Unsaved Buffer & Parent-Path `#include` Resolution**: Added live in-memory buffer lookup (`vscode.workspace.textDocuments`) and `../` parent-directory resolution via workspace-relative URIs so edits to included files preview immediately before saving across both Desktop and VS Code Web.
- **Manual Reload Recovery Action**: Added a **Reload Shader** action button inside the preview error banner along with automatic `webglcontextrestored` recovery.

### Changed

- **Instant Focus-Free Preview Startup**: Implemented a `ready` handshake between the Webview and extension host with buffered initial payloads and visibility-driven `requestAnimationFrame` scheduling so previews start rendering immediately on open without requiring tab clicks or focus switches.
- **Smooth Hot-Swap Compilation**: Pre-compiles updated shader materials before swapping onto the active mesh so temporary syntax errors during live typing display non-blocking error banners instead of flashing a blank screen.
- **Modularized Webview Template (`previewHtml.ts`)**: Extracted the Webview HTML, Content Security Policy, and Three.js WebGL runner into a dedicated `previewHtml.ts` module and streamlined preprocessing directly through `GLSLHParser`.

### Fixed

- Fixed initial blank-canvas race conditions on first open in both VS Code Desktop and VS Code Web (`vscode-test-web`).
- Fixed `#include` path resolution failures for nested includes, `../` relative paths, and virtual/web workspace roots (`/`).

---

## [1.2.0] - 2026-11-11

### Added

- **Interactive Color Picker Provider**: Integrated VS Code color decoration and native color pickers for `vec3()`, `vec4()`, and JSON array color definitions (`[r, g, b, a]`), allowing instant visual color adjustments directly inside shader files.
- **Overload-Aware Static Collision Detection**: Integrated static analysis to warn developers of conflicting function signatures across included files while fully supporting valid GLSL function overloading and ignoring forward declaration prototypes.
- **Topological Derived Uniforms & Expression Engine**: Upgraded expression parsing with Kahn's algorithm sorting for chained `@uniforms` expressions, correct right-associative exponentiation (`**`), and built-in software GLSL math functions (`mix`, `smoothstep`, `clamp`, etc.).

### Changed

- **Native WebGL Version Pipeline**: Removed forced string injections for version directives, delegating version control natively via Three.js to eliminate driver compilation clashes.
- **Modularized Validation Layer**: Split error mapping and validation logic into dedicated modules to ensure clean separation of concerns and robust AI-friendly error context mapping (`--- Code Context ---`).

---

## [1.0.1] - 2026-10-29

### Added

- Added official extension logo and branding assets for the Visual Studio Marketplace.

---

## [1.0.0] - 2026-10-24

### Added

- Initial official release of `glslh-previewer`.
- Instant side-by-side live Three.js WebGL shader preview panel with real-time error reporting.
- Robust C-style `#include` preprocessor with intelligent multi-candidate workspace path resolution (supporting both Desktop and Web environments) and circular dependency protection.
- Custom TextMate grammar syntax highlighting and C-style keyword coloring for `.glslh` files.
- Dynamic constant macro injection (`Math.PI`, `Math.TAU`) and automatic uniform binding (`u_time`, `u_resolution`, `u_intensity`).
