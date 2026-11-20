# Uses Windows built-ins and Edge. CI uses PYRAMID_HEADLESS_TEST=1.
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
    # Exiting the primary process now ends the session; it must never reopen itself.
    Stop-Process -Id $gameAfter.id -Force
    Start-Sleep -Seconds 12
    if(Test-Path (Join-Path $root '.local/running.txt')){throw 'Closing the game left the supervisor running'}
    try{Invoke-RestMethod http://127.0.0.1:3210/api/state -TimeoutSec 1 | Out-Null;throw 'Closing the game left the service running'}catch{if($_.Exception.Message -eq 'Closing the game left the service running'){throw}}
    Run-Launcher 'Start'
    $state=Wait-Game
    $recoveredGame=Get-Content -Raw (Join-Path $root '.local/game-process.json') | ConvertFrom-Json
    $session = Invoke-RestMethod http://127.0.0.1:3210/api/session
    Invoke-RestMethod http://127.0.0.1:3210/api/config -Method Post -Headers @{ 'X-Session' = $session.token } -ContentType application/json -Body '{"language":"he","liveEnabled":false,"gifts":{"gift_5655":{"action":"blocks","value":17,"giftId":"5655","name":"Rose"}}}' | Out-Null
    $catalog = Invoke-RestMethod http://127.0.0.1:3210/catalog.json
    if ($catalog.Count -ne 314) { throw 'Gift catalog is incomplete' }
    $icon = Invoke-WebRequest http://127.0.0.1:3210/assets/gifts/5655.webp -UseBasicParsing
    if ($icon.Headers['Content-Type'] -notmatch 'image/webp') { throw 'Gift image was not served' }
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
    if ($state.config.liveEnabled -ne $false) { throw 'Explicit disconnect setting did not persist' }
    if ($state.config.gifts.gift_5655.giftId -ne '5655' -or $state.config.gifts.gift_5655.value -ne 17) { throw 'Gift ID mapping did not persist' }
    $session=Invoke-RestMethod http://127.0.0.1:3210/api/session
    Invoke-RestMethod http://127.0.0.1:3210/api/exit -Method Post -Headers @{'X-Session'=$session.token} -ContentType application/json -Body '{}' | Out-Null
    Start-Sleep -Seconds 12
    if(Test-Path (Join-Path $root '.local/running.txt')){throw 'Exit game left the supervisor running'}
    try{Invoke-RestMethod http://127.0.0.1:3210/api/state -TimeoutSec 1 | Out-Null;throw 'Exit game left the service running'}catch{if($_.Exception.Message -eq 'Exit game left the service running'){throw}}
    Write-Host 'PASS: setup, repeated start without duplicates, close-to-stop, restart, dashboard exit, engine connection, new-version restart, backups, clean stop and persistent settings.'
} finally { Run-Launcher 'Stop' }
