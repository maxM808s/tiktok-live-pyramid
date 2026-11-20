param([string]$Browser,[string]$Generation)
. (Join-Path $PSScriptRoot 'browser-common.ps1')
$misses=0;$failures=0;$nextRetry=Get-Date;$lastHealthy=Get-Date
try{
    while(Test-Path -LiteralPath (Join-Path $Local 'running.txt')){
        $locked=$false
        try{
            try{$locked=$LifecycleMutex.WaitOne(500)}catch [Threading.AbandonedMutexException]{$locked=$true}
            if(!$locked){continue}
            $flag=Join-Path $Local 'running.txt'
            if(!(Test-Path -LiteralPath $flag) -or (Get-Content -Raw -LiteralPath $flag).Trim() -ne $Generation){break}
            if((Get-Date) -lt $nextRetry){continue}
            if(Test-Path -LiteralPath (Join-Path $Local 'exit-requested.txt')){Stop-Project;break}
            $session=Get-ProjectSession
            if($session){$misses=0}else{$misses++}
            $service=Get-OwnedProcess 'service'
            if(!$session -and (!$service -or $misses -ge 5)){
                if($service){$service.Kill();$service.WaitForExit(2000) | Out-Null}
                try{$occupied=Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue}catch{$occupied=$null}
                if($occupied){throw 'Port occupied; waiting without stopping unrelated processes.'}
                Start-BrowserHost | Out-Null;$misses=0
            }
            $game=Get-OwnedProcess 'game'
            if(!$game){Stop-Project;break}
            $recoverHung=$false
            if($game -and $session){
                try{$state=Invoke-RestMethod 'http://127.0.0.1:3210/api/state' -TimeoutSec 2;if($state.gameOnline){$lastHealthy=Get-Date}elseif(((Get-Date)-$lastHealthy).TotalSeconds -gt 90){$game.CloseMainWindow() | Out-Null;if(!$game.WaitForExit(1500)){$game.Kill();$game.WaitForExit(2000)|Out-Null};$game=$null;$recoverHung=$true}}catch{}
            }
            if($recoverHung){Start-BrowserGame $Browser | Out-Null;$lastHealthy=Get-Date}
            $failures=0
        }catch{
            $failures++;$nextRetry=(Get-Date).AddSeconds([math]::Min(60,[math]::Pow(2,[math]::Min($failures,6))))
            $log=Join-Path $Local 'supervisor.log';if((Test-Path $log) -and (Get-Item $log).Length -gt 1048576){Move-Item $log "$log.previous" -Force}
            Add-Content -LiteralPath $log -Value ((Get-Date -Format o)+' '+$_.Exception.Message)
        }finally{if($locked){$LifecycleMutex.ReleaseMutex()};Start-Sleep -Seconds 3}
    }
}finally{$LifecycleMutex.Dispose()}
