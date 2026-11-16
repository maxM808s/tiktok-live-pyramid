# Bundled Three.js

Three.js release r180 (0.180.0), official upstream: https://github.com/mrdoob/three.js/tree/r180 . MIT license is included in LICENSE. Copyright Three.js authors.

Only the WebGL renderer/core modules are bundled. No CDN, package manager, remote script or installer is used at game startup. This is application source distributed with the Git repository, not a separately installed essential.

SHA-256 integrity checks in tests/engine.test.mjs pin these official files:

- three.module.min.js: e2b5ee6bccd38fd6d8a2428546b83c5f2426d84b152ef82be8055556e3b40eb6
- three.core.min.js: 61ba0df005b05991361d040d8ff670e1aadfd0ce7aeebd1fdb0725957a8957de
- LICENSE: bfe119ea4fd413f5f7ca3fcd63adb0c4a073ed39daa2fe7d3e6b769e21272601
