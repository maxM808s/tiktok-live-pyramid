. (Join-Path $PSScriptRoot 'common.ps1')
function Find-Browser {
    if ($env:PYRAMID_BROWSER_EXE -and (Test-Path -LiteralPath $env:PYRAMID_BROWSER_EXE -PathType Leaf)) { return $env:PYRAMID_BROWSER_EXE }
    foreach ($folder in @(${env:ProgramFiles(x86)}, $env:ProgramFiles, $env:LOCALAPPDATA)) {
        if (!$folder) { continue }
        foreach ($relative in @('Microsoft\Edge\Application\msedge.exe','Google\Chrome\Application\chrome.exe')) {
            $file=Join-Path $folder $relative
            if (Test-Path -LiteralPath $file -PathType Leaf) { return $file }
        }
    }
    foreach ($name in @('msedge.exe','chrome.exe')) { $found=Get-Command $name -ErrorAction SilentlyContinue;if($found){return $found.Source} }
    return $null
}
function Start-BrowserHost {
    $powershell=Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $hostScript=Join-Path $PSScriptRoot 'browser-host.ps1'
    $arguments=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',('"'+$hostScript+'"'))
    $process=Start-Process -FilePath $powershell -ArgumentList $arguments -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Local 'service.log') -RedirectStandardError (Join-Path $Local 'service-error.log') -PassThru
    Save-OwnedProcess $process 'service'
    return $process
}
function Start-BrowserGame([string]$Browser) {
    $profile=Join-Path $Local 'browser-profile'
    $arguments=@('--app=http://127.0.0.1:3210/browser/game.html',('--user-data-dir="'+$profile+'"'),'--window-size=540,960','--no-first-run','--no-default-browser-check','--disable-background-mode','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding')
    if($env:PYRAMID_HEADLESS_TEST -eq '1'){$arguments+=@('--headless=new','--use-angle=swiftshader','--enable-unsafe-swiftshader')}
    $process=Start-Process -FilePath $Browser -ArgumentList $arguments -WorkingDirectory $Root -PassThru
    Save-OwnedProcess $process 'game'
    return $process
}
