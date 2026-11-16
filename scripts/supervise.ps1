param([string]$Godot, [string]$Generation)
. (Join-Path $PSScriptRoot 'common.ps1')
$misses = 0
$failures = 0
$nextRetry = Get-Date
$lastGameHealthy = Get-Date
try {
    while (Test-Path -LiteralPath (Join-Path $Local 'running.txt')) {
        $locked = $false
        try {
            try { $locked = $LifecycleMutex.WaitOne(500) } catch [Threading.AbandonedMutexException] { $locked = $true }
            if (!$locked) { continue }
            $flag = Join-Path $Local 'running.txt'
            if (!(Test-Path -LiteralPath $flag) -or (Get-Content -Raw -LiteralPath $flag).Trim() -ne $Generation) { break }
            if ((Get-Date) -lt $nextRetry) { continue }
            $session = Get-ProjectSession
            if ($session) { $misses = 0 } else { $misses++ }
            $service = Get-OwnedProcess 'service'
            if (!$session -and (!$service -or $misses -ge 5)) {
                if ($service) { $service.Kill(); $service.WaitForExit(2000) | Out-Null }
                try { $occupied = Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue } catch { $occupied = $null }
                if ($occupied) { throw 'Port 3210 is occupied. Waiting; no unrelated process will be stopped.' }
                Start-ServiceProcess | Out-Null
                $misses = 0
            }
            $game = Get-OwnedProcess 'game'
            if ($session -and $game) {
                try {
                    $health = Invoke-RestMethod 'http://127.0.0.1:3210/api/state' -TimeoutSec 2
                    if ($health.gameOnline) { $lastGameHealthy = Get-Date }
                    elseif (((Get-Date) - $lastGameHealthy).TotalSeconds -gt 90) {
                        Add-Content -LiteralPath (Join-Path $Local 'supervisor.log') -Value ((Get-Date -Format o) + ' Restarting owned game after 90 seconds without telemetry.')
                        $game.Kill(); $game.WaitForExit(2000) | Out-Null
                        $game = $null
                    }
                } catch {}
            }
            if (!$game) {
                $game = Start-GameProcess $Godot
                $lastGameHealthy = Get-Date
                if ($game.WaitForExit(700)) { throw 'Game exited during startup; see .local/game.log.' }
            }
            $failures = 0
        } catch {
            $failures++
            $nextRetry = (Get-Date).AddSeconds([Math]::Min(60, [Math]::Pow(2, [Math]::Min($failures, 6))))
            $log = Join-Path $Local 'supervisor.log'
            if ((Test-Path $log) -and (Get-Item $log).Length -gt 1048576) { Move-Item $log "$log.previous" -Force }
            Add-Content -LiteralPath $log -Value ((Get-Date -Format o) + ' ' + $_.Exception.Message)
        } finally {
            if ($locked) { $LifecycleMutex.ReleaseMutex() }
            Start-Sleep -Seconds 3
        }
    }
} finally { $LifecycleMutex.Dispose() }
