# TikTok Pyramid Live

An original Godot 4 construction game with a local browser control room, designed for a vertical TikTok LIVE. Viewers send events through **TikFinity Desktop's local Event API**. No S2E, direct TikTok connector, paid action rules, passwords, npm packages, or automatic software downloads.

**Version 0.2 — improved startup and broadcast controls.** Six monuments, visible worker delivery, golden stones, destruction, boosts, votes, automatic rounds, English / Hebrew, a 1080 × 1920 layout, and Windows launchers are implemented. This is stylized procedural art, not a reproduction of the reference project's concept illustration. Read [test status](docs/TEST-STATUS.md) before relying on unattended streaming. Windows headless startup/recovery checks passed in CI. Interactive Windows 11 capture and real TikFinity Free account access still require testing on your PC.

## Your GitHub Desktop workflow

This repository is the source of truth. The separate `tiktok-live-battle` repository is never used or modified.

### First installation — once

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in.
2. Select **File → Clone repository → URL**. Enter `https://github.com/maxM808s/tiktok-live-pyramid` and click **Clone**. Choose a normal local folder, preferably outside OneDrive.
3. Select **Repository → Show in Explorer**.
4. Install **Node.js 22 or newer LTS** from [nodejs.org](https://nodejs.org/). Accept the option to add it to PATH. Close and reopen Explorer if it cannot be found.
5. Download **Godot 4.3 or newer Standard for Windows 64-bit** from [godotengine.org](https://godotengine.org/download/windows/). Extract its ZIP once. Put `Godot_v4…_win64.exe` in this repository's `tools` folder. Keep any companion files from the official archive together. You do not need the .NET edition. Alternatively, an existing Godot installation on PATH or in the standard WinGet package folder is detected. Advanced users can set `GODOT_EXE` to their executable's complete path.
6. Double-click **Setup-Game.cmd**. Missing dependencies produce a readable error and official installation link. The script never downloads or installs software.
7. Double-click **Start-Game.cmd**. The game window and your browser dashboard open automatically. Keep the game window running; the browser may be minimized.
8. The dashboard initially says **SIMULATOR — TEST MODE**. Open **Live controls**, send a test gift, and watch workers build.
9. Install [TikFinity Desktop](https://tikfinity.zerody.one/) separately, using its official site. Follow the connection steps below.

You only clone once. Do not download the project ZIP for updates. Do not commit the Godot executable.

### Every launch

Double-click **Start-Game.cmd**. Repeated launches reuse the running service and game. It opens `http://127.0.0.1:3210` automatically. No terminal is required. **Stop-Game.cmd** stops this project's service and game and disables its process monitor; it leaves your browser and TikFinity alone.

The `.cmd` files run the repository's own PowerShell scripts using a process-local execution policy. They do not change your system execution policy. Review scripts in `scripts/` before your first launch.

### Future updates — the same Desktop workflow

1. Open GitHub Desktop and select **tiktok-live-pyramid**.
2. Click **Fetch origin → Pull origin**.
3. Double-click **Start-Game.cmd**.

Start detects a changed source revision, saves current progress, stops only this project's processes, backs up settings and launches the new code. If the same version is already running, Start reuses it instead of spawning duplicate windows. Stopping before pulling is still a good option during a quiet moment in the stream.

**Update-Game.cmd** is an alternative one-click update: it checks for local edits and the correct repository, stops the game, saves up to five local recovery backups, pulls with fast-forward only, then starts the newly pulled launcher. If the pull fails, it preserves your files and tells you to review the error in Desktop. It detects Git on PATH or bundled inside GitHub Desktop. No reset, clean, forced overwrite or dependency download occurs.

Settings, gift rules, checkpoints, logs, and process records live in the ignored **`.local`** folder, so pulling code preserves them. Portable Godot stays in `tools`. Back up `.local` before changing PCs. Never upload that folder: it can include viewer names and a local session token.

Recovery copies from updates are in `.local/backups` (latest five). The previous valid settings file is also kept as `.local/settings.previous.json`. GitHub Desktop remains the recommended update method. Windows headless startup/recovery smoke tests passed; interactive launching and the authenticated Update helper still need checking on your PC.

If creating a replacement repository: use GitHub's **New repository** page, name it, then clone it through Desktop and select it in Codex. Do not select the battle repository for pyramid development.

## Connect TikFinity Free

1. Open the **TikFinity Desktop app on the same PC** as the game. The browser-only site does not provide the local desktop socket.
2. Complete TikFinity's official setup using your TikTok handle and its supported connection flow. The game itself never asks for credentials.
3. Start your TikTok LIVE and connect TikFinity to it. Check that TikFinity itself receives events.
4. In the game's dashboard, choose **Live controls → Event source → LIVE — TikFinity Free**.
5. The service connects to `ws://127.0.0.1:21213/`, the loopback equivalent of the documented `ws://localhost:21213/`. No Actions & Events rules need to be purchased or configured.
6. Check **Connection health**. “Socket connected” confirms only the local API connection. An increasing last-event timestamp and a real viewer event confirm data delivery.
7. Ask a viewer to comment, then verify their name, the event log, and construction. Test a small gift streak separately before going unattended.

Official documentation lists `chat`, `gift`, `like`, `follow`, and `share` events. The adapter implements these five. It ignores other event types. It does not send chat or control TikTok. See [integration research and limitations](docs/TIKFINITY.md). The public documentation describes the API without a Pro requirement, but a real Free-account entitlement and live event test was not available in development. If your installed Free account cannot expose the API, do not buy Pro for this project or try a bypass: stay in the local simulator and check TikFinity's current official support. There is no claim of a verified live Free connection until you complete that check.

### Default actions

| Incoming event | Default result |
| --- | --- |
| 5 likes from one viewer | One stone job with a named worker |
| Comment | One stone; a building name also casts a vote |
| Follow | Five stones |
| Share | One stone |
| Rose | Ten golden stones per gift |
| Galaxy | Fifty golden stones per gift and a 15-second construction boost |
| `earthquake` | Remove ten stone units per gift (a placeholder mapping; assign a real reported gift name) |

Configure like/comment/follow/share values in **Game settings**. Configure each gift's exact name, action, and per-gift value in **Gift manager**. Larger gifts only award what you explicitly map. Unknown gifts are logged without an invented value. “Preview in game” deliberately sends a simulator event and is disabled in LIVE mode.

Streak gifts are credited once, when `repeatEnd` is the boolean `true`; the final `repeatCount` multiplies your value. Event IDs suppress duplicate deliveries within the bounded cache. Missing IDs cannot provide guaranteed duplicate detection. The queue holds at most 5,000 stone units and drops excess, with a counter in Connection health. A single gift is capped at 5,000 units. This is an explicit overload limit, not a guarantee that arbitrarily large gifts will be fully queued.

## Play and run automatically

Each round builds one recognizable monument: **Egyptian Pyramid, Ancient Temple, Medieval Castle, Lighthouse, Obelisk, Ziggurat**. Difficulty edits apply at the next round or after Restart round, preserving the current round's progress. Difficulty controls required contribution units, while the blueprint determines the number of visible blocks. For example, 200 contribution units progressively reveal all 455 pyramid blocks through worker deliveries; one contribution can correspond to several visual stones.

Workers use a fixed pool of 1–32 characters. They carry stones from the quarry, walk to the site, and throw/place them into the structure. Outfits include worker, mummy, ninja, and pharaoh. A few floating names and contributor rings keep the scene readable. Workers are reused rather than allocating a permanent expensive character to every viewer. The leaderboard ranks accepted contribution units across the session; the completion board shows the round's contributors.

For unattended use:

1. Turn on **Game settings → Automatically start the next round**.
2. Set your required stones and celebration countdown, then save.
3. Choose LIVE mode and verify a real event before leaving.
4. Keep the game and TikFinity running. Minimize the dashboard if desired.
5. Set Windows power/sleep settings appropriately for a broadcast.

Completion waits for the game to schedule the full visible geometry, plays the crown / celebration effects, shows the top builders, counts down, and rotates. A viewer can vote by commenting one of `pyramid`, `temple`, `castle`, `lighthouse`, `obelisk`, or `ziggurat`. The latest vote per viewer counts; highest vote total wins, otherwise buildings rotate in that order. No artificial viewer activity or free idle construction is generated. With no events, the desert, camera, and day/night scene remain active.

The service retries a lost TikFinity socket with a capped backoff. Godot retries its local polling connection. The Windows monitor restarts a crashed owned game/service process and attempts to recover an unresponsive owned service. Checkpoints save approximately every five seconds and on normal shutdown; a hard crash may lose the last five seconds. Construction pauses when renderer telemetry goes stale. The Windows monitor waits 90 seconds before restarting its own unresponsive game process, allowing normal startup and transient stalls. This watchdog is implemented but still requires Windows acceptance testing. TikTok LIVE Studio and TikFinity are never automatically restarted.

**Restart round** deliberately clears that round's progress and queue. Contributions beyond a completed round carry to the next automatic round. Stream leaderboard totals persist across normal restarts; to clear all progress, stop the game and rename `.local/checkpoint.json` as a backup.

## TikTok LIVE Studio

1. Launch the game and verify the overlay.
2. In LIVE Studio create a **1080 × 1920 vertical scene**.
3. Add a **Window Capture** source and choose **Pyramid Live**, then fit it to the scene. The Godot content uses a 1080 × 1920 logical viewport; its desktop preview window is 540 × 960.
4. Capture the client area without window borders, if that option is available. The dashboard is a controller, not the stream source.
5. Check progress, contributor names, instructions, and countdown in LIVE Studio's mobile preview. Add your own camera/chat sources around the game as desired. Minimal overlay mode hides instructions and the leaderboard.
6. Keep the game window unminimized. Dashboard minimization is supported; capture behavior when the game is covered/minimized varies with Windows, GPU, and capture method and must be checked on your PC.

The game's progress and status remain visible even if the browser controller is closed. English and Hebrew can be switched from the sidebar; Hebrew uses RTL browser layout and Godot's Unicode text rendering, with installed Windows UI fonts. No remote font downloads occur.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Node or Godot not found | Run Setup-Game.cmd. Install from the official links above; put the Standard Godot executable in tools. Reopen the launcher. |
| Script blocked by managed Windows policy | Ask your PC administrator to allow these reviewed local scripts. The launcher cannot override organization policy. |
| Port 3210 in use | Stop the existing pyramid instance. Review `.local/service-error.log`. Do not kill an unrelated application just because it occupies the port. |
| Dashboard says game offline | Keep Godot running. Check the Godot console. Use Stop-Game.cmd, then Start-Game.cmd. |
| TikFinity disconnected | Open Desktop, connect it to your LIVE, and wait up to 30 seconds for retry. Browser-only TikFinity will not suffice. |
| Connected socket but no construction | Select LIVE mode; verify events inside TikFinity; inspect last-event age and logs; add the reported gift name to Gift manager. |
| Repeated tests rejected | Simulator events are intentionally blocked in LIVE. Switch to SIMULATOR for tests and back to LIVE before broadcasting. |
| Round waits at 100% | Workers may still be placing the remaining visual stones. Completion countdown waits for rendering. Check game telemetry and pause status. |
| Low FPS | Choose Low graphics, reduce visible workers, close other GPU-heavy apps. A software renderer is not suitable for a 60 FPS broadcast. |
| Update refused | Use GitHub Desktop to review and commit/stash your code changes. Never delete .local to fix an update. |
| Settings damaged | Stop the game, back up .local, rename settings.json, then launch with defaults. Checkpoints are separate. |
| Need help diagnosing | Share code version and sanitized service logs. Do not post session.json, tokens, personal settings, or raw viewer data. |

## Development and verification

There is no `npm install`: the service uses Node's HTTP, filesystem, crypto, and native WebSocket APIs. Game geometry, outfits, animation, and particles are generated locally.

```text
Start-Game.cmd / Stop-Game.cmd / Setup-Game.cmd / Update-Game.cmd
scripts/             Windows detection, launch and process supervision
server/engine.mjs    Event validation, queue, contribution ledger, voting, rounds
server/tikfinity.mjs TikFinity Event API normalization
server/server.mjs    Local HTTP dashboard/API, socket adapter, checkpoints
game/                Godot scene, procedural blueprints and animated workers
dashboard/           Local responsive English / Hebrew controller
tests/               Unit, browser, adapter and running-game checks
docs/                Research, license audit and actual verification status
.local/              Ignored settings, state, logs and process records
```

Developers can run `npm test`, `node server/server.mjs`, and `godot --path game`. Blueprint check: `godot --headless --path game --script res://test_blueprints.gd`. Start service and Godot before `node tests/integration.mjs` or `node tests/six-buildings.mjs`. The latter changes settings temporarily and sends clearly labeled simulator events. Do not run these on a real broadcast. Browser checks require Python Playwright and Chromium in the development environment only; Windows end users do not need Python. `tests/windows-smoke.ps1` exercises installation, launch, shutdown, telemetry and settings on Windows; it passed on the Windows CI runner; repeat it on your PC only outside a real broadcast.

[Reference audit](docs/REFERENCE-AUDIT.md) · [TikFinity research](docs/TIKFINITY.md) · [Test status](docs/TEST-STATUS.md)

GitHub Actions source checks run Node tests on Linux and Windows, parse the PowerShell scripts, and check blueprints using an official pinned Godot 4.6.3 download with SHA-256 verification **inside the disposable GitHub runner only**. These checks do not install software on your PC and do not verify LIVE Studio capture or the interactive Windows launch flow. Check the repository Actions tab for the latest workflow status.


## Control room improvements in 0.2

- Broadcast readiness strip distinguishes the game window, local TikFinity socket, simulator and automatic round state.
- Blueprint illustrations match each of the six buildings; these are labeled previews, not a claim of live game capture.
- Quick pause/resume, guided connection status, six building cards and difficulty presets.
- Gift rules can be created, edited, previewed in simulator mode and removed. Removed default rules stay removed after restarting.
- **Back up settings** downloads a JSON file containing settings only, without session tokens. In **Live controls → Restore settings**, choose that backup and confirm the import. Backend validation and a previous-settings recovery copy protect the change.
- Event logs can be filtered and downloaded. Logs may contain viewer names; review them before sharing.
- English/Hebrew dropdowns, RTL, keyboard focus, confirmation dialogs and responsive mobile layout.
- Placed stones are batched with MultiMesh and shared primitive meshes. Workers and flying stones remain animated. Countdown now waits for stones to land; minimum overlay mode removes its background panel as well as its text.

The improved Windows launcher uses a per-project mutex to serialize Start/Stop/Update and the process monitor. Error exit codes are retained, game logs go to `.local/game.log`, and repeated startup failures back off instead of opening an endless rapid sequence of game windows. Windows CI now includes headless launcher smoke tests from a folder with spaces; check the repository Actions tab for their results.

Windows headless CI passed: [view the verified startup and recovery run](https://github.com/maxM808s/tiktok-live-pyramid/actions/runs/43860190013).
