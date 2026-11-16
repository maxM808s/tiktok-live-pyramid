param([ValidateSet('Start', 'Stop', 'Setup', 'Update')][string]$Action = 'Start')
. (Join-Path $PSScriptRoot 'common.ps1')
$locked = $false
$relaunch = $false
$exitCode = 0
function Find-Godot {
    if ($env:GODOT_EXE -and (Test-Path -LiteralPath $env:GODOT_EXE -PathType Leaf)) { return $env:GODOT_EXE }
    foreach ($name in @('godot', 'godot4')) {
        $candidate = Get-Command $name -ErrorAction SilentlyContinue
        if ($candidate) { return $candidate.Source }
    }
    $folders = @((Join-Path $Root 'tools'), (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\GodotEngine.GodotEngine_*'))
    foreach ($folder in $folders) {
        $candidate = Get-ChildItem "$folder\Godot_v4*_win64.exe" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($candidate) { return $candidate.FullName }
    }
    return $null
}
try {
    try { $locked = $LifecycleMutex.WaitOne(10000) } catch [Threading.AbandonedMutexException] { $locked = $true }
    if (!$locked) { throw 'Another pyramid launcher is busy. Wait a few seconds, then try again.' }
    if ($Action -eq 'Stop') {
        Stop-Project
        Write-Host 'Pyramid Live stopped. Your settings and progress are saved.'
    } elseif ($Action -eq 'Update') {
        $git = Find-Git
        if (!$git) { throw 'Git not found. Open GitHub Desktop, select this repository, then Fetch origin and Pull origin.' }
        $changes = & $git status --porcelain
        if ($LASTEXITCODE -ne 0) { throw 'Clone the repository through GitHub Desktop first.' }
        if ($changes) { throw 'You have local code changes. Review them in GitHub Desktop before updating. Nothing was stopped or overwritten.' }
        $origin = & $git remote get-url origin
        if ($LASTEXITCODE -ne 0 -or $origin -notmatch '(?i)github\.com[:/]maxM808s/tiktok-live-pyramid(?:\.git)?/?$') { throw 'This is not the selected pyramid repository. Use GitHub Desktop to check origin.' }
        Write-Host '[1/4] Saving progress and stopping the game...'
        Stop-Project
        $backup = Backup-Settings
        Write-Host "[2/4] Local settings backup: $backup"
        Write-Host '[3/4] Updating from GitHub (fast-forward only)...'
        & $git pull --ff-only
        if ($LASTEXITCODE -ne 0) { throw 'GitHub update failed. Settings are backed up. Review the error in GitHub Desktop; Start-Game.cmd can launch your existing version.' }
        Write-Host '[4/4] Launching the updated version...'
        $relaunch = $true
    } else {
        Write-Host 'Pyramid Live - checking your setup...'
        if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22+ LTS once from https://nodejs.org then reopen Start-Game.cmd. Nothing was downloaded.' }
        $nodeVersion = & node -p 'process.versions.node'
        if ($LASTEXITCODE -ne 0 -or [int]($nodeVersion.Split('.')[0]) -lt 22) { throw 'Node.js 22+ is required: https://nodejs.org' }
        $godot = Find-Godot
        if (!$godot) { throw 'Godot was not found. Download Godot 4.3+ Standard from https://godotengine.org/download/windows/ and extract its Windows executable into the tools folder. Or set GODOT_EXE. Nothing was downloaded.' }
        $godotVersion = (& $godot --version | Out-String).Trim()
        if ($godotVersion -notmatch '^4\.(\d+)' -or [int]$Matches[1] -lt 3) { throw 'Godot 4.3+ Standard is required.' }
        Write-Host "Ready: Node $nodeVersion, Godot $godotVersion"
        if ($Action -eq 'Setup') {
            Write-Host 'Setup complete. Double-click Start-Game.cmd.'
        } else {
            $fingerprint = Get-SourceFingerprint
            $launch = Read-Record 'launch-version'
            $session = Get-ProjectSession
            if ($session -and ($session.runtime -eq 'browser' -or !$launch -or $launch.fingerprint -ne $fingerprint)) {
                Write-Host 'New source version detected. Saving progress and restarting this game...'
                Stop-Project
                Backup-Settings | Out-Null
                $session = $null
            }
            if (!$session) {
                try { $occupied = Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue } catch { $occupied = $null }
                if ($occupied) { throw 'Port 3210 belongs to another instance or application. Stop that instance first. No unrelated process was stopped.' }
                Start-ServiceProcess | Out-Null
                for ($attempt = 0; $attempt -lt 40 -and !$session; $attempt++) { Start-Sleep -Milliseconds 250; $session = Get-ProjectSession }
            }
            if (!$session) { throw 'Local service did not start. See .local/service-error.log.' }
            if (!(Get-OwnedProcess 'game')) { Start-GameProcess $godot | Out-Null }
            if (!(Get-OwnedProcess 'monitor') -or !(Test-Path (Join-Path $Local 'running.txt'))) {
                $generation = [guid]::NewGuid().ToString()
                Set-Content -LiteralPath (Join-Path $Local 'running.txt') -Value $generation
                $monitorScript = Join-Path $PSScriptRoot 'supervise.ps1'
                $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $monitorScript + '"'), '-Godot', ('"' + $godot + '"'), '-Generation', $generation)
                $monitor = Start-Process powershell.exe -ArgumentList $arguments -WindowStyle Hidden -PassThru
                Save-OwnedProcess $monitor 'monitor'
            }
            Write-Record 'launch-version' @{ fingerprint = $fingerprint; started = (Get-Date -Format o) }
            if ($env:PYRAMID_HEADLESS_TEST -ne '1') { Start-Process 'http://127.0.0.1:3210' }
            Write-Host 'Game and dashboard started. Use Stop-Game.cmd when finished.'
        }
    }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    $exitCode = 1
} finally {
    if ($locked) { $LifecycleMutex.ReleaseMutex() }
    $LifecycleMutex.Dispose()
}
# Invoke the newly pulled script after releasing the lock; never continue with old loaded functions.
if ($relaunch) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'scripts\launcher.ps1') -Action Start
    $exitCode = $LASTEXITCODE
}
exit $exitCode
