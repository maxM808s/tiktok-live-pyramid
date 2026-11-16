# Shared Windows lifecycle helpers. No downloads, shell interpolation or port-owner kills.
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$Local = Join-Path $Root '.local'
New-Item -ItemType Directory -Force -Path $Local | Out-Null
Set-Location -LiteralPath $Root
$hashAlgorithm = [Security.Cryptography.SHA256]::Create()
try { $rootHash = ([BitConverter]::ToString($hashAlgorithm.ComputeHash([Text.Encoding]::UTF8.GetBytes($Root.ToLowerInvariant())))).Replace('-', '').Substring(0, 24) }
finally { $hashAlgorithm.Dispose() }
$LifecycleMutex = [Threading.Mutex]::new($false, "Local\PyramidLive-$rootHash")

function Read-Record([string]$Name) {
    $file = Join-Path $Local "$Name.json"
    if (!(Test-Path -LiteralPath $file)) { return $null }
    try { return Get-Content -Raw -LiteralPath $file | ConvertFrom-Json }
    catch { return $null }
}
function Write-Record([string]$Name, $Value) {
    $file = Join-Path $Local "$Name.json"
    $temp = "$file.tmp"
    $Value | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $temp -Encoding UTF8
    Move-Item -LiteralPath $temp -Destination $file -Force
}
function Save-OwnedProcess($Process, [string]$Name) {
    Write-Record "$Name-process" @{ id = $Process.Id; started = $Process.StartTime.ToUniversalTime().Ticks.ToString() }
}
function Get-OwnedProcess([string]$Name) {
    $saved = Read-Record "$Name-process"
    if (!$saved) { return $null }
    try {
        $process = Get-Process -Id $saved.id -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started) { return $process }
    } catch {}
    return $null
}
function Get-ProjectSession {
    try {
        $session = Invoke-RestMethod 'http://127.0.0.1:3210/api/session' -TimeoutSec 2
        if ($session.projectRoot -eq $Root -and (!$session.appId -or $session.appId -eq 'tiktok-live-pyramid')) { return $session }
    } catch {}
    return $null
}
function Stop-Project {
    Remove-Item -LiteralPath (Join-Path $Local 'running.txt') -ErrorAction SilentlyContinue
    $service = Get-OwnedProcess 'service'
    $session = Get-ProjectSession
    if ($session) {
        try { Invoke-RestMethod 'http://127.0.0.1:3210/api/shutdown' -Method Post -Headers @{ 'X-Session' = $session.token } -ContentType 'application/json' -Body '{}' -TimeoutSec 3 | Out-Null } catch {}
    }
    if ($service -and !$service.WaitForExit(3000)) { $service.Kill(); $service.WaitForExit(2000) | Out-Null }
    foreach ($name in @('game', 'monitor')) {
        $process = Get-OwnedProcess $name
        if ($process) {
            if ($name -eq 'game') { $process.CloseMainWindow() | Out-Null }
            if (!$process.WaitForExit(1500)) { $process.Kill(); $process.WaitForExit(2000) | Out-Null }
        }
    }
    foreach ($name in @('service', 'game', 'monitor')) {
        Remove-Item -LiteralPath (Join-Path $Local "$name-process.json") -ErrorAction SilentlyContinue
    }
}
function Start-ServiceProcess {
    $process = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'server/server.mjs' -WorkingDirectory $Root -RedirectStandardOutput (Join-Path $Local 'service.log') -RedirectStandardError (Join-Path $Local 'service-error.log') -WindowStyle Hidden -PassThru
    Save-OwnedProcess $process 'service'
    return $process
}
function Start-GameProcess([string]$Godot) {
    $gamePath = Join-Path $Root 'game'
    $arguments = @('--path', ('"' + $gamePath + '"'), '--log-file', ('"' + (Join-Path $Local 'game.log') + '"'))
    # Used only by automated Windows smoke tests; normal double-click launches a window.
    if ($env:PYRAMID_HEADLESS_TEST -eq '1') { $arguments += '--headless' }
    $process = Start-Process -FilePath $Godot -ArgumentList $arguments -WorkingDirectory $Root -PassThru
    Save-OwnedProcess $process 'game'
    return $process
}
function Find-Git {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) { return $git.Source }
    # GitHub Desktop bundles Git even when Git is not on PATH.
    $desktop = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
    if (Test-Path -LiteralPath $desktop) {
        $git = Get-ChildItem "$desktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($git) { return $git.FullName }
    }
    return $null
}
function Backup-Settings {
    $folder = Join-Path $Local ('backups\' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    foreach ($name in @('settings.json', 'settings.previous.json', 'checkpoint.json')) {
        $source = Join-Path $Local $name
        if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination $folder }
    }
    Get-ChildItem (Join-Path $Local 'backups') -Directory | Sort-Object Name -Descending | Select-Object -Skip 5 | Remove-Item -Recurse -Force
    return $folder
}

function Get-SourceFingerprint {
    $git = Find-Git
    if ($git) {
        $revision = & $git rev-parse HEAD 2>$null
        if ($LASTEXITCODE -eq 0) { return $revision.Trim() }
    }
    $files = @('package.json', 'server/server.mjs', 'server/engine.mjs', 'server/tikfinity.mjs', 'game/main.gd', 'game/blueprints.gd', 'game/project.godot', 'scripts/common.ps1', 'scripts/launcher.ps1', 'scripts/supervise.ps1')
    $hashes = foreach ($file in $files) { (Get-FileHash -LiteralPath (Join-Path $Root $file) -Algorithm SHA256).Hash }
    return ($hashes -join '-')
}
