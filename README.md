# TikTok Pyramid Live

**Double-click Start-Game.cmd. No Node.js, Godot, Python, npm install, or separate game engine is needed for normal use.**

Version 0.3 runs the 3D game in your existing Edge or Chrome browser. The local host uses Windows PowerShell and .NET, already included with Windows 11, like your battle game's launcher. The 3D library and all game files are included in this repository. Startup does not download or install game dependencies and uses no CDN.

## Start it like your other games

1. In **GitHub Desktop**, clone `https://github.com/maxM808s/tiktok-live-pyramid` once. If already cloned, click **Fetch origin → Pull origin**.
2. Select **Repository → Show in Explorer**.
3. Double-click **Start-Game.cmd**.
4. A dedicated **Pyramid Live — Game** browser window and your separate dashboard open automatically.
5. Test an event in **Live controls**, then connect TikFinity Free when you are ready.

**Setup-Game.cmd** is optional: it checks the Windows/browser requirements without installing anything. Windows 11 normally includes Edge. If you prefer an already installed Chrome browser, advanced users can point `PYRAMID_BROWSER_EXE` to its executable.

If you installed Node or Godot for an earlier version, you can leave them installed; normal Start no longer uses them. You do not need to install or uninstall anything to switch to this version.

## Future updates

1. Open GitHub Desktop and select **tiktok-live-pyramid**.
2. Click **Fetch origin → Pull origin**.
3. Double-click **Start-Game.cmd** again.

Start detects a different source revision, saves progress, backs up settings and restarts only this project's processes. Starting the same version twice reuses its game window. A second manually opened game tab becomes a view-only window; it cannot count a second copy of viewer events.

**Update-Game.cmd** is an optional helper: it checks that you are in the pyramid repository and have no code edits, stops the game, backs up settings, pulls fast-forward only, then starts the updated launcher. Git is detected from PATH or GitHub Desktop's bundled Git. If authentication fails, use Desktop's normal Pull button. No reset, clean or forced overwrite is performed.

**Stop-Game.cmd** stops this game's browser window, localhost host and monitor. It does not close your dashboard, other personal browser windows, TikFinity or LIVE Studio.

No repeated ZIP downloads or manual replacement of files. The separate battle and boxing repositories are not modified.

## Your dashboard

The dashboard opens at **http://127.0.0.1:3210** and has:

- Overview with construction progress, worker count, recent events, contributors, performance and connection readiness.
- Six building previews/cards and difficulty presets. Building/difficulty edits apply to the next round or **Restart round**.
- Shared 314-gift library from your battle game, with bundled images, search, coin filters, configurable actions and simulator-only previews.
- Camera, day/night, particle quality, worker outfits and overlay layout.
- Pause/resume, restart, filtered/downloadable logs, settings backup/import, and simulator/live selection.
- English and Hebrew with RTL layout and translated controls.

The game runs in a **separate browser window**. Minimize or close the dashboard if desired; keep the game window visible for rendering and capture. The game window uses a separate local browser profile, keeping it separate from your personal browsing.

## TikFinity Free — no S2E

1. Open your **TikFinity Desktop app on the same PC**. Browser-only TikFinity does not provide its local socket.
2. Complete TikFinity's official setup and connect it to your livestream. The game itself never asks for your TikTok password.
3. In the dashboard choose **Live controls → Event source → LIVE — TikFinity Free**.
4. The game connects to the documented local Event API at `ws://localhost:21213/`.
5. Check the last-event time and ask a real viewer to comment. Test a small real gift streak before leaving the game unattended.

A connected socket only proves the local API is reachable; it does not prove your TikTok stream is live. The browser may ask permission to reach a local device/service; allow the localhost connection for this local game if prompted. In SIMULATOR mode there are no TikFinity connection attempts and no invented live viewer activity.

The official API documents gifts, likes, comments (`chat`), follows and shares. The game implements those events with a modular adapter, quantity handling, bounded ID deduplication, logs and reconnection. It does not use S2E, paid action rules or a direct TikTok connector. Real Free-account availability and live event delivery still need checking with your installed TikFinity version. If your Free account cannot expose the official API, stay in simulator mode and check TikFinity support; there is no paid fallback or bypass.

[Official Event API](https://tikfinity.zerody.one/tiktok/dapi) · [Integration research](docs/TIKFINITY.md)

### Default viewer actions

| Event | Action |
| --- | --- |
| 5 likes from a viewer | One construction job with their named worker |
| Comment | One stone unit; a building name also casts a vote |
| Follow | Five units |
| Share | One unit |
| Rose | Ten golden units per gift |
| Galaxy | Fifty golden units and a 15-second boost |
| `earthquake` | Remove ten units; replace this placeholder with a real gift name |

Configure basic values in **Game settings**. In **Gift manager**, search the shared library, choose a gift, set its action/value, and save. Library rules match the gift ID, so same-name gifts can have different actions. Existing custom-name rules remain supported. Only saved rules award stones; importing the library does not enable every gift. Images are bundled locally, with no new runtime dependencies. Coin values are imported snapshots, not current live prices. See [library source and artwork notes](assets/gifts/README.md). Unknown gifts are logged without guessing their price. GiftType 1 streaks count once when the final boolean `repeatEnd` is true; `repeatCount` multiplies the configured value. Duplicate event IDs in the latest 10,000 IDs are suppressed. Missing IDs cannot guarantee duplicate protection.

The contribution queue caps at 5,000 units and records excess as dropped; a single gift also caps at 5,000 units. A separate bounded dashboard-command queue prevents unlimited pending controls when no game window is running.

## Six monuments and continuous play

Build an **Egyptian Pyramid, Ancient Temple, Medieval Castle, Lighthouse, Obelisk or Ziggurat**. Workers visibly carry and place blocks, with worker/mummy/ninja/pharaoh outfits, usernames, golden stones and contributor recognition. Instanced blocks and a worker pool of at most 32 keep contributions from creating unlimited characters.

Difficulty controls contribution units, while the blueprint defines the visual stones. For example, 200 units progressively build all 455 pyramid blocks. Completion waits until the last visual stone lands, then shows the crown, celebration effects, top builders and a countdown.

Turn on **Automatically start the next round** for continuous play. Viewers vote by commenting `pyramid`, `temple`, `castle`, `lighthouse`, `obelisk` or `ziggurat`; the latest vote per viewer counts. The highest total wins; otherwise buildings rotate. Excess queued work carries into the next automatic round. **Restart round** deliberately clears that round's current progress and queue.

No artificial contributions or automatic free idle stones are generated. Without interaction, the desert, distant landmarks, camera and lighting remain visible.

The Windows monitor restarts exited owned processes, retries failed starts with a cap, and can restart its own unresponsive game after 90 seconds. It never restarts LIVE Studio or TikFinity. Before going unattended, verify a real event, the capture preview, your power/sleep settings and stable performance on your PC.

## TikTok LIVE Studio

1. Start the game.
2. Create a **1080 × 1920 vertical scene** in LIVE Studio.
3. Add **Window Capture** and select **Pyramid Live — Game** (the dedicated browser app window).
4. Capture the client area without borders if available and fit it to the vertical scene.
5. Check progress, names and instructions on the mobile preview. The lower area leaves space for platform overlays. Choose Minimal overlay if you want to add your own information.
6. Keep the game window unminimized. Dashboard minimization does not stop it.

The game content keeps a 9:16 aspect ratio. GPU/WebGL acceleration in your existing browser is required for the 3D scene. No browser extension is required. FPS and browser JavaScript memory are reported; the memory indicator does not include every GPU/process allocation. A software renderer is not evidence of 60 FPS on your gaming PC.

## Settings, privacy and recovery

All personal files stay in ignored **`.local`**: settings, previous valid settings, checkpoint, recent update backups, process records, logs and the dedicated browser profile. Git pulls preserve this folder. **Back up settings** downloads a settings-only JSON file; import it through **Live controls → Restore settings**. Updates retain the last five backup folders.

Do not post `.local`, browser profiles, session tokens or raw viewer data publicly. Logs can include usernames. Checkpoints save approximately every four seconds and during a clean stop; abrupt crashes can lose the most recent interval. The browser owner can reconnect to a restarted host. Invalid checkpoints start a clean round instead of executing arbitrary data.

Services bind to loopback only. Incoming requests have Host/origin/session validation, a static file allowlist, bounded bodies and queues, and an exclusive game-owner lease. Simulator and LIVE progress use separate checkpoints, so test contributions cannot appear in a real viewer session. Switching back restores that mode's own progress. The game loads only bundled scripts; TikFinity is its only live-event WebSocket destination. No passwords, secrets or large executable binaries are committed.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Old version asks for Node/Godot | Pull the latest repository and double-click **Start-Game.cmd**, not Start-Godot.cmd. |
| Edge not detected | Windows 11 normally includes it. Use an existing Chrome/Edge installation with PYRAMID_BROWSER_EXE if needed. No engine download is required. |
| Windows blocks PowerShell | Review the local scripts; managed PC policy may require your administrator. The launcher changes execution policy only for its own process. |
| Port 3210 occupied | Stop the existing pyramid instance. The launcher will not kill an unrelated port owner. |
| Blank/failed 3D window | Check Edge graphics acceleration/WebGL, close the game and launch again. Keep it unminimized. |
| Dashboard says offline | Start the game window; check `.local/service-error.log` and `.local/supervisor.log`. |
| Second game says view window | Another window already owns the game. Only one window receives live events. |
| TikFinity disconnected | Open Desktop, connect it to your LIVE, select LIVE mode and allow up to 30 seconds for retry. |
| Tests rejected during LIVE | Intentional: simulator events are blocked in LIVE. Switch to SIMULATOR for testing. |
| 100% while workers still build | Contributions are complete; countdown waits for physical visual placement to finish. |
| Low FPS | Select Low graphics, fewer workers and close other GPU-heavy apps. |
| Update helper fails | Use GitHub Desktop Fetch/Pull. Local edits or authentication can block a safe fast-forward. Settings remain backed up. |
| Need to clear all progress | Stop the game and rename `.local/checkpoint.json`, `.local/checkpoint-live.json` and `.local/checkpoint-simulator.json` as backups. Settings remain separate. |

## Optional Godot edition and development

The original Godot source remains in `game/`. **Start-Godot.cmd** explicitly selects the optional Godot edition and requires Node 22+ and Godot 4.3+ Standard. It is not used by normal Start, Setup, Stop or Update. Only one edition can own port 3210 at a time; launchers stop the other owned edition when switching.

Developers can run `node --test tests/engine.test.mjs tests/gift-library.test.mjs tests/connection.test.mjs`; Node is a development/optional-edition tool, not a player dependency. The default host is `scripts/browser-host.ps1`. The browser game imports the same event/round engine as the optional Godot bridge. Python/Playwright scripts are development tests only.

The Windows CI no-install smoke test removes Node from PATH and launches the normal scripts with the runner's existing Edge browser. See [executed test status](docs/TEST-STATUS.md) for what actually passed, rather than treating a workflow definition as a completed test.

[Reference audit](docs/REFERENCE-AUDIT.md) · [Changes](docs/CHANGELOG.md) · [Bundled library license](vendor/three/LICENSE)

## Connection controls, game popup and LIVE Studio link

Open **Live controls** and use **Connect**, **Reconnect** or **Disconnect**. This uses the same official TikFinity Desktop local WebSocket as your battle game: `ws://localhost:21213/`. Connect your TikTok LIVE inside TikFinity Desktop first, then press **Connect** here. A browser request for local-network access must be allowed for this connection. No TikTok password is entered here. Disconnect stops retries and remains saved after a restart; reconnect enables them again. Connect switches from the isolated simulator checkpoint to LIVE.

Choose **עברית** in the Language selector for Hebrew controls, right-to-left layout, game HUD and setup instructions.

Press **Game window & link** at the top of the dashboard. Choose a popup size and press **Open game popup**. Allow popups for the local site if blocked, or use **Open game in a tab**. In LIVE Studio, add a Window Capture source and select **Pyramid Live — Game Capture**. The normal Windows launcher still opens the dedicated game window automatically.

Alternatively press **Copy link** and paste it into LIVE Studio's Link source. Set the source size to **1080 × 1920** where supported. The link is `http://127.0.0.1:3210/browser/game.html?view=1`. It works only on the same PC while the local game service is running; it is not a public hosted URL. Keep the primary game window running: the link only displays its state and never becomes a second scoring connection, even when the primary game closes. If your LIVE Studio version cannot load a localhost Link source, use Window Capture. No new installations are required.
