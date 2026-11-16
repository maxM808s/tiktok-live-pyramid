# Executed verification and remaining acceptance checks

**Latest default: version 0.3, Windows PowerShell + existing browser, with no Node or Godot install. The earlier Godot/0.2 sections below are historical; the latest browser results are recorded at the end.**

Date: 2026-11-16. Development environment: Linux, Node 24.22.1, Godot 4.6.3, Chromium, Xorg dummy display, Mesa llvmpipe software OpenGL. The local development machine is not a Windows 11 gaming PC. Windows headless CI subsequently passed as recorded below. No real TikFinity installation or TikTok LIVE account was attached.

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

- Interactive double-click behavior on your **Windows 11** PC, actual graphics/capture and dependency installation. Setup/Start/Stop and source-change restart passed in Windows headless CI; the actual Update helper Git pull still needs Windows acceptance.
- The 90-second hung-renderer watchdog and stale-PID protection edge cases need further Windows acceptance. Normal PowerShell lifecycle, exited-game recovery and backup/settings retention passed Windows headless CI.
- Actual Godot GPU performance, 60 FPS, game-window minimization/coverage behavior and TikTok LIVE Studio capture.
- Real TikFinity **Free-account** Event API availability, field variants, gift streak behavior and duplicate/reconnect behavior during a real livestream.
- Real TikTok gifts/likes/comments/follows/shares and viewer votes.
- Native Windows font fallback and visual inspection of Hebrew inside the captured Godot window. Browser Hebrew was executed and inspected; Windows game typography is not claimed verified.
- Multi-hour unattended session, Windows sleep/power behavior and recovery from a hung renderer. The monitor restarts exited game processes; it does not automatically force-kill a renderer solely for missing telemetry.
- Actual GitHub Desktop pull and interactive Windows update helper remain acceptance checks. GitHub Actions passed; no packaged Windows Release was produced.

## Visual / product scope

This is a functioning original procedural edition: block-built monuments, primitive stylized character meshes, outfit variations, carried stone animation, names, top-contributor rings, scaffolding, a crane, palms, dunes, camera motion, day/night, crowns, dust, golden celebration bursts and an overlay. It does not contain custom rigged art, licensed cinematic models, voiceovers or a commercial asset pack. It should not be represented as final art matching the reference concept image.

The dashboard supports quality, worker cap/outfits, camera and day/night toggles, overlay layout, configurable basic actions, gifts, languages, pause/restart and test previews. An idle scene creates no fake contributions. Inactivity currently retains the scene and camera; it has no configurable offline construction or automatic fake-viewer behavior.

## Publication status

Published to `https://github.com/maxM808s/tiktok-live-pyramid` on `main`. Repository access was refreshed and the push succeeded, including the original five stages and version 0.2 improvements. Windows CI results are separate from the executed Linux/local checks above. The existing battle repository was not modified.

## Version 0.2 improvements — additional executed checks

- Twelve engine cases pass, including deletion of default gift rules across settings reloads and keeping current-round difficulty fixed while next-round settings change.
- Expanded Chromium checks passed: readiness display, all six building picker/preview entries, quick pause/resume, unsaved form retention during polling, gift creation/edit/removal, settings export/import, log filter, simulator blocking in LIVE, English/Hebrew RTL and a 390px layout with no horizontal overflow. No browser JavaScript errors were recorded. English and mobile screenshots were visually inspected.
- Optimized rendered-game test completed all six projects in 90 seconds, minimum reported FPS 10, combined memory peak approximately 99 MB on software OpenGL. Countdown now waits for landing callbacks. This does not establish a hardware FPS improvement or a Windows 60 FPS result.
- API security checks and the local Git fast-forward/settings-preservation test passed again.
- The translated building selector test initially caught implicit option values changing with translated labels. Explicit values fixed the issue, and the expanded browser test passed.

The Windows common lifecycle helpers, mutex, source-revision restart detection, backups and retained .cmd exit codes were subsequently exercised by the successful Windows CI run below. The 90-second hung-renderer watchdog and Desktop-bundled Git fallback still require dedicated acceptance checks. The CI workflow now includes the actual headless launchers, repeated Start, simulated game crash, simulated source-version change, backups and settings retention from a folder with spaces. Check GitHub Actions for current CI results; publication has succeeded. This supersedes the earlier note that the monitor does not restart an unresponsive renderer.

Earlier publishing attempts failed with HTTP 403 because this new repository was missing from the app connection. Access was refreshed and publication succeeded. No other repository was modified.

- Version 0.2 timed soak: 2,790 simulator events in 60 seconds; maximum queue 5,000; peak combined memory approximately 108 MB; game remained online. No Windows performance conclusion follows from these software-rendered results.
- Final 0.2 automatic-round integration, blueprint assertions, expanded browser regression and service/session recovery checks passed after the updates.


## Windows CI passed after publication

[Successful Source checks run](https://github.com/maxM808s/tiktok-live-pyramid/actions/runs/43860190013), source commit `f3a1f10d77d138c8abee4ec178cbf6b327ceb481`:

- Engine tests and JS syntax checks passed on Ubuntu and Windows.
- Windows PowerShell parsed all project/test scripts successfully.
- The official pinned Godot 4.6.3 archive was downloaded inside the CI runner and its SHA-256 was verified.
- All six Godot blueprint checks passed on Windows.
- Setup, Start, a repeated Start without duplicate game processes, simulated exited-game recovery, simulated newly pulled source-version detection/restart, backup creation, Hebrew-setting persistence, Stop and subsequent Start all passed from a Windows folder containing spaces.

These are actual executed Windows headless checks. They do not certify interactive Windows 11 rendering, LIVE Studio capture, real Free-account TikFinity access, GPU 60 FPS, or the optional Update helper's authenticated Git pull on your PC. Documentation-only commits after this source revision do not change the tested application code.


## Version 0.3 — no-install browser default

The game now uses Windows built-ins and an existing Edge/Chrome browser. The temporary portable PowerShell used for Linux development validation is not distributed, installed, or required on the player's PC.

### Executed and passed

- [Windows no-install CI](https://github.com/maxM808s/tiktok-live-pyramid/actions/runs/43864664903): the normal launchers passed with Node removed from PATH, no Godot setup, and the runner's existing browser. Setup, repeated Start without duplicates, actual browser heartbeat, exited-game recovery, simulated source-update restart, settings backups/persistence, Stop and subsequent Start passed from a folder with spaces. Engine tests and PowerShell parsing passed on Windows; engine tests also passed on Linux.
- Sixteen engine/source tests passed, including browser checkpoint recovery, retained event dedup IDs, six browser blueprint geometries and checksums of the bundled official Three.js source/license.
- The actual PowerShell HTTP host and WebGL browser game completed all six buildings, with visible delivery scheduling, final landing, automatic rotation, exclusive owner/view-only duplicate-window behavior, simulated gift quantities/duplicate IDs and Hebrew HUD. No browser page errors were recorded.
- The full dashboard regression passed against the PowerShell host with a real browser game owner: readiness, six previews, quick controls, preserved unsaved edits, gift editing/removal, settings backup/import, log filter, languages, LIVE test blocking and mobile overflow.
- The browser's direct WebSocket adapter passed an explicit local mock test for all five documented event types, duplicate gift IDs and reconnection. This was not a real TikFinity/TikTok connection.
- A 60-second active construction soak accepted 1,315 simulator events, kept its queue within bounds (maximum observed 2,439 units), stayed online and reached 200 units / celebration. The test explicitly resumed construction first. The approximately 249 MB reported host-process-plus-browser-JS-heap figure is not total browser/GPU memory. The software renderer reported 8 FPS at the end; this is not a 60 FPS hardware claim.
- Origin, Host, session, JSON/configuration and file-allowlist security checks passed against the PowerShell host.

An earlier Windows integrity test caught Git converting the bundled license's line endings. Vendor files now enforce LF and all Windows tests passed. An early dashboard test used fixed 500 ms timing for the asynchronous bridge; tests now wait for acknowledged state, and the regression passed. Control changes trigger a durable checkpoint before their acknowledgement is reported.

### Still requires your PC / livestream

Actual Windows 11 graphical capture in LIVE Studio, native GPU performance, real TikFinity Free availability/events, browser local-network permission prompts, multi-hour unattended use, the 90-second hung-window watchdog and the optional Update helper's authenticated Git pull remain acceptance checks. Do not treat mock events or headless CI as proof of a real livestream.

- Final browser dashboard regression explicitly placed a uniquely named simulator contributor at the top, confirmed it was absent in LIVE, and confirmed the simulator leaderboard returned when switching back. Simulator and LIVE checkpoint banks are separate in both editions. Primitive/array settings rejection was also executed against the PowerShell host.

Final no-install source validation: [all jobs passed for 38f3bd4](https://github.com/maxM808s/tiktok-live-pyramid/actions/runs/43866834332), including sixteen engine tests on Windows/Linux and the Windows browser startup/recovery smoke test with Node removed from PATH. The separate-mode checkpoint browser regression also passed.

## Version 0.4 — shared gift library

Executed locally against the PowerShell host and real headless Chromium game:

- All 314 catalog entries and bundled WebP files passed checksum/integrity tests against the recorded source manifest. Engine/source and gift-library test files passed (21 individual cases).
- Browser integration passed search, coin/status filters, sorting, local image loading, legacy Rose rule migration, ID rule saving, three-item quantity awarding 51 stones, separate same-name Universe IDs awarding 25 + 75 stones, the recent-gift HUD image, retained settings after dashboard reload, Hebrew RTL/mobile layout without horizontal overflow, and no browser page errors.
- Existing dashboard regression passed readiness, six previews, quick controls, unsaved edits, custom gift creation/edit/removal, settings export/import, log filters, English/Hebrew, LIVE test blocking, separate mode checkpoints, and mobile layout, with no browser page errors.

Testing caught a rapid-save race: choosing a second gift before the first save finished could lose the selection. Library choices are now disabled while saving. Browser tests passed after the fix. This validates simulated payloads, not real TikFinity Free events or current TikTok coin prices. Windows CI results for this revision are reported separately below after execution.

[Windows/Linux CI passed for 71fe7c3](https://github.com/maxM808s/tiktok-live-pyramid/actions/runs/43870257662): both engine/library test jobs and PowerShell parsing succeeded. The Windows startup test succeeded with Node removed from PATH, no Godot installation, bundled catalog/image HTTP checks, and ID-mapping persistence across update/restart. Final browser rerun also passed; its language assertion now waits for the rendered RTL state rather than assuming a fixed 500 ms refresh.
