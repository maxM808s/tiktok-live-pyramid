# Reference inspection and asset provenance

Inspection date: 2026-11-16. Reference: https://github.com/landsbetween/tiktok-pyramid-live at tree/commit `a43c3f8c0c0d03c073480edf90e5f17379cdeb02`.

The GitHub connector enumerated the complete recursive tree (not truncated) and retrieved the text source/configuration files: README, .gitignore, start.bat, game project and scene, buildings.gd, main.gd, worker.gd, world.gd, fx.gd, net.gd, ui.gd, and server package.json, package-lock.json, server.js. Source sections, function lists, network calls, launch behavior, building progression, workers and animation were examined. The concept PNG and MP3 binary contents were not retrieved, decoded, or auditioned. UID/import metadata was enumerated rather than treated as reusable assets. This is not a complete forensic audit of those binary assets or every transitive dependency.

## Findings

- `game/project.godot` declares Godot **4.7 / Forward Plus**. The README also states 4.7. This is the reference's declared version, not a claim that 4.7 was installed or tested here. The new implementation was executed with Godot **4.6.3 / GL Compatibility**.
- The main scene loads a procedural Node3D script. Main manages construction slots, workers, levels, votes, contribution boards, completion, block flight, earthquakes, and demo/reel controls.
- Buildings are colored block-slot blueprints for pyramid, ziggurat, obelisk, castle, temple and lighthouse. Main uses instanced blocks, reservations and placement callbacks; large backlogs can rain blocks.
- Workers have idle/wander, carry-to-site, throw, return and removal states, block outfits, names, levels and auras. World generates desert props and themes. FX generates particles and thud audio, and loads externally sourced MP3 clips.
- The original uses a direct `tiktok-live-connector` bridge, not TikFinity. Package dependencies declare express ^5.2.1, tiktok-live-connector ^2.5.0 and ws ^8.21.3. Server binds 127.0.0.1:3001, receives direct TikTok events and exposes simulation endpoints.
- The original has automatic free idle stones and demo events. These behaviors do not satisfy the requested absence of fake progression during a real stream; the new implementation has no such automatic event generation.
- `start.bat` detects Godot from WinGet, reads a username file, pulls Git, installs npm packages if absent, and kills the PID listening on its bridge port. Automatic dependency execution and killing a potentially unrelated port owner were not copied.
- Original UI can fetch viewer avatar URLs. New UI uses text names and does not fetch viewer-supplied external resources.

## License decision

No LICENSE, COPYING, third-party notice or asset-license file appeared in the complete tree. Publicly accessible GitHub code is not automatically licensed for reuse. The sounds include meme-style filenames without provenance visible in the tree. Permission to reuse code, the illustration or sound clips was not established.

**No reference code, image, audio or model is included in this project.** The new implementation uses independently written code, generated primitive geometry, locally generated particles and installed system fonts. The shared gameplay idea and building subjects are the inspiration. No third-party asset pack was installed. Godot and Node are separately installed software, governed by their upstream licenses, not bundled here.

The new service has no third-party npm dependencies, so no npm install hooks or downloaded runtime packages execute. This reduces the dependency surface; it does not constitute an audit of Godot, Node, Windows, GitHub Desktop, TikFinity or LIVE Studio themselves.

## 0.3 browser edition

The battle game's launcher was read to confirm its Windows PowerShell/browser workflow; its repository was not modified. The new browser host is independently written. No battle-game source was copied into it. The browser renderer uses the official Three.js r180 modules under their MIT license, included in `vendor/three/LICENSE` with pinned integrity hashes. This supersedes the earlier no-third-party-library description for the browser edition; the optional Node bridge still has no npm dependencies. Startup does not fetch those modules or install anything.
