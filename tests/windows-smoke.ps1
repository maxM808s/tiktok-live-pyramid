# Run locally after installing Node and Godot: right-click Run with PowerShell.
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
& "$root\Setup-Game.cmd"
if($LASTEXITCODE){throw 'Setup failed'}
& "$root\Start-Game.cmd"
if($LASTEXITCODE){throw 'Start failed'}
Start-Sleep -Seconds 10
$s=Invoke-RestMethod http://127.0.0.1:3210/api/state
if(!$s.gameOnline){throw 'Game did not report telemetry'}
$session=Invoke-RestMethod http://127.0.0.1:3210/api/session
Invoke-RestMethod http://127.0.0.1:3210/api/config -Method Post -Headers @{'X-Session'=$session.token} -ContentType application/json -Body '{"language":"he"}'|Out-Null
& "$root\Stop-Game.cmd"
Start-Sleep -Seconds 4
& "$root\Start-Game.cmd"
Start-Sleep -Seconds 10
$s=Invoke-RestMethod http://127.0.0.1:3210/api/state
if($s.config.language -ne 'he'){throw 'Settings did not persist'}
& "$root\Stop-Game.cmd"
Write-Host 'PASS: setup, launch, game heartbeat, stop, persistent settings.'
