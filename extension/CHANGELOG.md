# Change Log

All notable changes to the "glslh-previewer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
