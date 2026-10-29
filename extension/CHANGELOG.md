# Change Log

All notable changes to the "glslh-previewer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.1] - 2026-10-29

### Added

- Added official extension logo and branding assets for the Visual Studio Marketplace.

## [1.0.0] - 2026-10-24

### Added

- Initial official release of `glslh-previewer`.
- Instant side-by-side live Three.js WebGL shader preview panel with real-time error reporting.
- Robust C-style `#include` preprocessor with intelligent multi-candidate workspace path resolution (supporting both Desktop and Web environments) and circular dependency protection.
- Custom TextMate grammar syntax highlighting and C-style keyword coloring for `.glslh` files.
- Dynamic constant macro injection (`Math.PI`, `Math.TAU`) and automatic uniform binding (`u_time`, `u_resolution`, `u_intensity`).
