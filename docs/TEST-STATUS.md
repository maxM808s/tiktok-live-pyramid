# Executed verification and remaining acceptance checks

Date: 2026-11-16. Development environment: Linux, Node 24.22.1, Godot 4.6.3, Chromium, Xorg dummy display, Mesa llvmpipe software OpenGL. This is not a Windows 11 gaming PC. No real TikFinity installation or TikTok LIVE account was attached.

## Executed and passed

| Check | Evidence and limits |
| --- | --- |
| Godot parses and launches | Headless launch and real rendered game window on a virtual display. No GDScript/runtime errors in the successful test runs. Virtual-display V-Sync support warning is expected. |
| Six distinct blueprints | Executed Godot blueprint assertions: pyramid 455 cells, temple 248, castle 466, lighthouse 336, obelisk 158, ziggurat 552. Unique cells, bottom-to-top build order, distinct geometry. |
| All six projects complete in running game | `tests/six-buildings.mjs` exercised service + rendered Godot: simulator gift, worker delivery scheduling, completed geometry, completion state for each project. First run: 82 seconds / minimum FPS 10 / approximately 95 MB combined memory. Repeat with crowns/outfit/overlay changes: 84 seconds / minimum FPS 9 / approximately 105 MB combined memory. This does not establish 60 FPS on hardware. |
| Gift → construction → automatic next round | `tests/integration.mjs` passed through HTTP simulation, Godot heartbeat, completion and automatic round rotation. Unauthorized control rejected. |
| Event engine | Ten unit test cases executed directly with `node tests/engine.test.mjs`: likes accumulation, gift streaks and IDs, live/simulator separation, malformed/extreme events, all-six completion/rotation, pause/heartbeat handling, votes, settings validation, nested payloads, queue carryover and inherited-property safety. |
| Burst traffic | 100,000 synthetic incoming events in the engine test. Queue ≤5,000 units, event-ID cache ≤10,000, participants ≤5,000, logs ≤100. Excess queue work recorded as dropped. An accelerated burst is not an hours-long soak. |
| Timed running-game soak | Isolated 60-second test, 2,785 simulator events, maximum queue 5,000 units, peak combined memory approximately 102 MB; game remained online. |
| Mock TikFinity WebSocket | Explicit local mock emitted like/chat/follow/share/gift, repeated a gift ID, disconnected, and accepted a reconnection. All five event types and deduplication passed. **This was not TikFinity or TikTok.** |
| English / Hebrew browser layout | Chromium Playwright: controls, RTL document direction, saved language after reload, simulator trigger, simulator disabled in LIVE, 390px mobile viewport without horizontal overflow; no browser JS errors. Screenshots visually inspected for English and Hebrew. |
| Hebrew in Godot on Linux | Rendered screenshot inspected after correcting system-font resolution; Hebrew and Latin glyphs readable. Windows font behavior remains pending. |
| Dashboard/game connection | Real Godot FPS/worker/memory telemetry received by local service; dashboard reads it through local API. |
| Persistent settings and checkpoint | Service stopped/restarted while Godot and a browser remained open. Settings/progress/queued work restored; Godot and the already-open dashboard reacquired their session tokens. |
| Git update preserves settings | Temporary local Git remote/clone fast-forward test retained ignored Hebrew/gift settings, including a clone path with spaces. This verifies Git behavior, not the Windows helper or GitHub Desktop UI. |
| API security | Executed origin, Host, session token, malformed JSON, settings bounds and file allowlist checks; service remained responsive. |
| Source hygiene | `git diff --check`, JS syntax checks; settings/checkpoints/executables confirmed ignored. No npm dependency installation needed. |

The first timed soak attempt overlapped a browser test that intentionally switched to LIVE and was rejected as designed. It is not counted as a pass. The isolated rerun above passed. The initial Host-header test used Node fetch, which normalized the test's custom Host; the corrected test uses Node HTTP and passed.

## Implemented, pending Windows / live acceptance

- Double-click Setup / Start / Stop / Update `.cmd` behavior on **Windows 11**, with your actual Node/Godot installation and paths.
- PowerShell process monitor, crash recovery, stopped-process ownership protection and actual Windows permissions. Scripts were reviewed but no PowerShell runtime was installed in this Linux environment. `tests/windows-smoke.ps1` is provided for the Windows acceptance test.
- Actual Godot GPU performance, 60 FPS, game-window minimization/coverage behavior and TikTok LIVE Studio capture.
- Real TikFinity **Free-account** Event API availability, field variants, gift streak behavior and duplicate/reconnect behavior during a real livestream.
- Real TikTok gifts/likes/comments/follows/shares and viewer votes.
- Native Windows font fallback and visual inspection of Hebrew inside the captured Godot window. Browser Hebrew was executed and inspected; Windows game typography is not claimed verified.
- Multi-hour unattended session, Windows sleep/power behavior and recovery from a hung renderer. The monitor restarts exited game processes; it does not automatically force-kill a renderer solely for missing telemetry.
- GitHub Actions workflow execution and actual GitHub Desktop pull. Publishing must succeed before CI can run. No packaged Windows Release was produced.

## Visual / product scope

This is a functioning original procedural edition: block-built monuments, primitive stylized character meshes, outfit variations, carried stone animation, names, top-contributor rings, scaffolding, a crane, palms, dunes, camera motion, day/night, crowns, dust, golden celebration bursts and an overlay. It does not contain custom rigged art, licensed cinematic models, voiceovers or a commercial asset pack. It should not be represented as final art matching the reference concept image.

The dashboard supports quality, worker cap/outfits, camera and day/night toggles, overlay layout, configurable basic actions, gifts, languages, pause/restart and test previews. An idle scene creates no fake contributions. Inactivity currently retains the scene and camera; it has no configurable offline construction or automatic fake-viewer behavior.

## Publication status

The selected remote is `https://github.com/maxM808s/tiktok-live-pyramid`. Local stage commits are present. Initial Git push returned HTTP 403; the connected GitHub API's create-tree request also returned “Resource not accessible by integration.” The repository connection must receive write access before these commits can be published. This is an access failure, not an automatic safety-review rejection. The existing battle repository was not modified.

## Version 0.2 improvements — additional executed checks

- Twelve engine cases pass, including deletion of default gift rules across settings reloads and keeping current-round difficulty fixed while next-round settings change.
- Expanded Chromium checks passed: readiness display, all six building picker/preview entries, quick pause/resume, unsaved form retention during polling, gift creation/edit/removal, settings export/import, log filter, simulator blocking in LIVE, English/Hebrew RTL and a 390px layout with no horizontal overflow. No browser JavaScript errors were recorded. English and mobile screenshots were visually inspected.
- Optimized rendered-game test completed all six projects in 90 seconds, minimum reported FPS 10, combined memory peak approximately 99 MB on software OpenGL. Countdown now waits for landing callbacks. This does not establish a hardware FPS improvement or a Windows 60 FPS result.
- API security checks and the local Git fast-forward/settings-preservation test passed again.
- The translated building selector test initially caught implicit option values changing with translated labels. Explicit values fixed the issue, and the expanded browser test passed.

The new Windows common lifecycle helpers, mutex, source-revision restart detection, backups, retained .cmd exit codes, GitHub Desktop Git detection, retry backoff and 90-second renderer watchdog are **implemented but not executed on Windows here**. The CI workflow now includes the actual headless launchers, repeated Start, simulated game crash, simulated source-version change, backups and settings retention from a folder with spaces. CI remains pending publication. This supersedes the earlier note that the monitor does not restart an unresponsive renderer.

GitHub access diagnosis: the connected installation uses selected repositories, and `tiktok-live-pyramid` is absent from that selection. Repository owner permission is separate from the app's selected-repository access. Add the pyramid repository at https://github.com/settings/installations/180978996 before retrying publication. No other repository was modified.

- Version 0.2 timed soak: 2,790 simulator events in 60 seconds; maximum queue 5,000; peak combined memory approximately 108 MB; game remained online. No Windows performance conclusion follows from these software-rendered results.
- Final 0.2 automatic-round integration, blueprint assertions, expanded browser regression and service/session recovery checks passed after the updates.
