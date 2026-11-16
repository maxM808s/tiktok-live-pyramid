# Run after installing Node and Godot. CI uses PYRAMID_HEADLESS_TEST=1.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
function Run-Launcher([string]$Action) {
    & (Join-Path $root "$Action-Game.cmd")
    if ($LASTEXITCODE) { throw "$Action launcher failed with exit code $LASTEXITCODE" }
}
function Wait-Game {
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        try { $state = Invoke-RestMethod http://127.0.0.1:3210/api/state -TimeoutSec 2; if ($state.gameOnline) { return $state } } catch {}
        Start-Sleep -Milliseconds 500
    }
    throw 'Game did not report telemetry'
}
try {
    Run-Launcher 'Setup'
    Run-Launcher 'Start'
    $state = Wait-Game
    $gameBefore = Get-Content -Raw (Join-Path $root '.local/game-process.json') | ConvertFrom-Json
    Run-Launcher 'Start'
    $gameAfter = Get-Content -Raw (Join-Path $root '.local/game-process.json') | ConvertFrom-Json
    if ($gameBefore.id -ne $gameAfter.id -or $gameBefore.started -ne $gameAfter.started) { throw 'Repeated Start created another game process' }
    # Explicit crash simulation; never run this smoke test during a real broadcast.
    Stop-Process -Id $gameAfter.id -Force
    Start-Sleep -Seconds 5
    $state = Wait-Game
    $recoveredGame = Get-Content -Raw (Join-Path $root '.local/game-process.json') | ConvertFrom-Json
    if ($recoveredGame.id -eq $gameAfter.id -and $recoveredGame.started -eq $gameAfter.started) { throw 'Monitor did not recover a crashed game' }
    $session = Invoke-RestMethod http://127.0.0.1:3210/api/session
    Invoke-RestMethod http://127.0.0.1:3210/api/config -Method Post -Headers @{ 'X-Session' = $session.token } -ContentType application/json -Body '{"language":"he"}' | Out-Null
    # Simulate a newly pulled source revision without touching code or remote branches.
    @{ fingerprint = 'previous-version-for-smoke-test' } | ConvertTo-Json | Set-Content (Join-Path $root '.local/launch-version.json') -Encoding UTF8
    Run-Launcher 'Start'
    $state = Wait-Game
    $updatedGame = Get-Content -Raw (Join-Path $root '.local/game-process.json') | ConvertFrom-Json
    if ($updatedGame.id -eq $recoveredGame.id -and $updatedGame.started -eq $recoveredGame.started) { throw 'New-source detection did not restart the game' }
    if ($state.config.language -ne 'he') { throw 'Automatic version restart lost settings' }
    if (!(Test-Path (Join-Path $root '.local/backups'))) { throw 'Update restart did not back up settings' }
    Run-Launcher 'Stop'
    Start-Sleep -Seconds 2
    try { Invoke-RestMethod http://127.0.0.1:3210/api/state -TimeoutSec 1 | Out-Null; throw 'Service still responding after Stop' } catch { if ($_.Exception.Message -eq 'Service still responding after Stop') { throw } }
    Run-Launcher 'Start'
    $state = Wait-Game
    if ($state.config.language -ne 'he') { throw 'Settings did not persist' }
    Write-Host 'PASS: setup, repeated start without duplicates, crash recovery, engine connection, new-version restart, backups, clean stop and persistent settings.'
} finally { Run-Launcher 'Stop' }
