# Changes

## 0.2.0

- Start reuses an existing matching version and saves/restarts an older owned instance after a GitHub Desktop pull.
- Update checks local code changes and origin, saves progress, retains five recovery backups, pulls fast-forward only and invokes the newly pulled launcher.
- Shared process records and a per-project mutex serialize launcher/monitor operations. Startup errors preserve their exit codes; repeated crashes back off. Only owned processes can be stopped.
- Windows scripts locate Git bundled with GitHub Desktop, write a Godot log and use enforced Windows line endings on checkout.
- Dashboard adds broadcast readiness, connection guidance, six isometric blueprint previews, building cards, difficulty presets, quick controls, confirmation dialogs and empty states.
- Gift manager supports editing/removal; deleted defaults remain deleted after restart.
- Settings can be exported/imported without session tokens. Writes retain previous valid settings and update running configuration only after disk persistence succeeds.
- Logs support filtering/download; forms retain unsaved edits during polling. English/Hebrew options and mobile/keyboard behavior are improved.
- Placed stones use MultiMesh batching, primitive meshes are shared, distant dunes have fewer polygons, and the scene has distant pyramid landmarks and worker faces.
- Round difficulty remains stable until a round reset. Celebration waits for stones to land. Minimal overlay also hides its panel background. Both languages reflect configured viewer-action values.
- Expanded engine/browser tests and Windows CI smoke coverage. Actual Windows/live integration acceptance remains pending.
