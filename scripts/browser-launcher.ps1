param([ValidateSet('Start','Stop','Setup','Update')][string]$Action='Start')
. (Join-Path $PSScriptRoot 'browser-common.ps1')
$locked=$false;$relaunch=$false;$exitCode=0
try{
    try{$locked=$LifecycleMutex.WaitOne(10000)}catch [Threading.AbandonedMutexException]{$locked=$true}
    if(!$locked){throw 'Another pyramid launcher is busy. Try again in a few seconds.'}
    if($Action -eq 'Stop'){
        Stop-Project
        Write-Host 'Pyramid Live stopped. Settings and progress are saved.'
    }elseif($Action -eq 'Update'){
        $git=Find-Git;if(!$git){throw 'Open GitHub Desktop, select this repository, then Fetch origin and Pull origin.'}
        $changes=& $git status --porcelain
        if($LASTEXITCODE -ne 0){throw 'Clone this repository with GitHub Desktop first.'}
        if($changes){throw 'Local code changes exist. Review them in GitHub Desktop before updating. Nothing was overwritten.'}
        $origin=& $git remote get-url origin
        if($LASTEXITCODE -ne 0 -or $origin -notmatch '(?i)github\.com[:/]maxM808s/tiktok-live-pyramid(?:\.git)?/?$'){throw 'This is not the selected pyramid repository.'}
        Stop-Project;$backup=Backup-Settings;Write-Host "Settings backup: $backup"
        & $git pull --ff-only
        if($LASTEXITCODE -ne 0){throw 'Update failed. Settings are safe. Use GitHub Desktop, or Start-Game.cmd to run your existing version.'}
        $relaunch=$true
    }else{
        $browser=Find-Browser
        if(!$browser){throw 'Microsoft Edge was not found. Windows 11 normally includes it. You can select an existing Chrome/Edge executable with PYRAMID_BROWSER_EXE. This game downloads nothing.'}
        if($PSVersionTable.PSVersion.Major -lt 5){throw 'Windows PowerShell 5.1 or newer is required; Windows 11 includes it.'}
        Write-Host 'Ready: Windows PowerShell and your existing browser. No Node or Godot installation needed.'
        if($Action -eq 'Setup'){Write-Host 'Double-click Start-Game.cmd.'}
        else{
            $fingerprint=Get-SourceFingerprint;$launch=Read-Record 'launch-version';$session=Get-ProjectSession
            if($session -and ($session.runtime -ne 'browser' -or !$launch -or $launch.fingerprint -ne $fingerprint)){
                Write-Host 'Saving progress and launching the updated browser version...'
                Stop-Project;Backup-Settings | Out-Null;$session=$null
            }
            if(!$session){
                try{$occupied=Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue}catch{$occupied=$null}
                if($occupied){throw 'Port 3210 is in use by another instance or application. No unrelated process was stopped.'}
                Start-BrowserHost | Out-Null
                for($i=0;$i -lt 40 -and !$session;$i++){Start-Sleep -Milliseconds 250;$session=Get-ProjectSession}
            }
            if(!$session){throw 'The local host did not start. Check .local/service-error.log.'}
            if(!(Get-OwnedProcess 'game')){Start-BrowserGame $browser | Out-Null}
            if(!(Get-OwnedProcess 'monitor') -or !(Test-Path (Join-Path $Local 'running.txt'))){
                $generation=[guid]::NewGuid().ToString();Set-Content -LiteralPath (Join-Path $Local 'running.txt') -Value $generation
                $monitorScript=Join-Path $PSScriptRoot 'browser-monitor.ps1';$powershell=Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
                $arguments=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',('"'+$monitorScript+'"'),'-Browser',('"'+$browser+'"'),'-Generation',$generation)
                $monitor=Start-Process -FilePath $powershell -ArgumentList $arguments -WindowStyle Hidden -PassThru;Save-OwnedProcess $monitor 'monitor'
            }
            Write-Record 'launch-version' @{fingerprint=$fingerprint;runtime='browser';started=(Get-Date -Format o)}
            if($env:PYRAMID_HEADLESS_TEST -ne '1'){Start-Process 'http://127.0.0.1:3210'}
            Write-Host 'Game and dashboard started. Use Stop-Game.cmd when finished.'
        }
    }
}catch{Write-Host $_.Exception.Message -ForegroundColor Red;$exitCode=1}
finally{if($locked){$LifecycleMutex.ReleaseMutex()};$LifecycleMutex.Dispose()}
if($relaunch){& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'browser-launcher.ps1') -Action Start;$exitCode=$LASTEXITCODE}
exit $exitCode
