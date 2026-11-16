param([ValidateSet('Start','Stop','Setup','Update')][string]$Action='Start')
$ErrorActionPreference='Stop'
$Root=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $Root
$Local=Join-Path $Root '.local'
New-Item -ItemType Directory -Force -Path $Local | Out-Null
function Find-Godot {
 if ($env:GODOT_EXE -and (Test-Path -LiteralPath $env:GODOT_EXE)) { return $env:GODOT_EXE }
 foreach($name in @('godot','godot4')) { $g=Get-Command $name -ErrorAction SilentlyContinue; if($g){return $g.Source} }
 $portable=Join-Path $Root 'tools'
 if(Test-Path $portable){$g=Get-ChildItem $portable -Filter 'Godot_v4*_win64.exe' | Select-Object -First 1;if($g){return $g.FullName}}
 $winget=Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
 if(Test-Path $winget){$g=Get-ChildItem "$winget\GodotEngine.GodotEngine_*\Godot_v4*_win64.exe" -ErrorAction SilentlyContinue | Select-Object -First 1;if($g){return $g.FullName}}
 return $null
}
function Session { $f=Join-Path $Local 'session.json'; if(Test-Path $f){return Get-Content -Raw -LiteralPath $f | ConvertFrom-Json};return $null }
function Stop-Owned {
 $s=Session
 if($s){try{Invoke-RestMethod 'http://127.0.0.1:3210/api/shutdown' -Method Post -Headers @{'X-Session'=$s.token} -ContentType 'application/json' -Body '{}' | Out-Null}catch{Write-Host 'Service already stopped or session changed.'}}
 $f=Join-Path $Local 'game-process.json'
 if(Test-Path $f){$saved=Get-Content -Raw $f | ConvertFrom-Json;$p=Get-Process -Id $saved.id -ErrorAction SilentlyContinue;if($p -and $p.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started){$p.CloseMainWindow() | Out-Null;Start-Sleep -Milliseconds 700;if(!$p.HasExited){$p.Kill()}};Remove-Item $f}
}
try {
 if($Action -eq 'Stop'){Stop-Owned;exit 0}
 if($Action -eq 'Update'){
  if(!(Get-Command git -ErrorAction SilentlyContinue)){throw 'Use GitHub Desktop: Fetch origin, then Pull origin.'}
  $changes=& git status --porcelain
  if($LASTEXITCODE -ne 0){throw 'Not a Git checkout. Clone this repository through GitHub Desktop first.'}
  if($changes){throw 'Tracked/untracked changes exist. Save them with GitHub Desktop before updating. Settings in .local are ignored and preserved.'}
  & git pull --ff-only
  if($LASTEXITCODE -ne 0){throw 'Update failed. Resolve it in GitHub Desktop; no reset was performed.'}
  Write-Host 'Updated. Local settings preserved.';exit 0
 }
 if(!(Get-Command node -ErrorAction SilentlyContinue)){throw 'Install Node.js 22 or newer LTS once from https://nodejs.org then reopen this launcher. No software was downloaded.'}
 $v=& node -p 'Number(process.versions.node.split(".")[0])'
 if([int]$v -lt 22){throw 'Node.js 22 or newer is required: https://nodejs.org'}
 $Godot=Find-Godot
 if(!$Godot){throw 'Install Godot 4.3+ Standard from https://godotengine.org/download/windows/ . Put the extracted Godot_v4*_win64.exe in this repository tools folder, add Godot to PATH, or set GODOT_EXE. No software was downloaded.'}
 $gv=& $Godot --version
 if($gv -notmatch '^4\.(\d+)' -or [int]$Matches[1] -lt 3){throw 'Godot 4.3 or newer Standard is required.'}
 if($Action -eq 'Setup'){Write-Host "Ready: Node $v, Godot $gv. Double-click Start-Game.cmd.";exit 0}
 try{$existing=Invoke-RestMethod 'http://127.0.0.1:3210/api/state' -TimeoutSec 1}catch{$existing=$null}
 if(!$existing){Start-Process -FilePath (Get-Command node).Source -ArgumentList 'server/server.mjs' -WorkingDirectory $Root -RedirectStandardOutput (Join-Path $Local 'service.log') -RedirectStandardError (Join-Path $Local 'service-error.log') -WindowStyle Hidden | Out-Null}
 $ready=$false
 for($i=0;$i -lt 30;$i++){try{Invoke-RestMethod 'http://127.0.0.1:3210/api/state' -TimeoutSec 1 | Out-Null;$ready=$true;break}catch{Start-Sleep -Milliseconds 300}}
 if(!$ready){throw 'Local service failed. See .local/service-error.log. Port 3210 may already be occupied.'}
 $f=Join-Path $Local 'game-process.json';$running=$false
 if(Test-Path $f){$saved=Get-Content -Raw $f | ConvertFrom-Json;$p=Get-Process -Id $saved.id -ErrorAction SilentlyContinue;if($p -and $p.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started){$running=$true}}
 if(!$running){$gamePath=Join-Path $Root 'game';$p=Start-Process -FilePath $Godot -ArgumentList @('--path',('"'+$gamePath+'"')) -PassThru;@{id=$p.Id;started=$p.StartTime.ToUniversalTime().Ticks.ToString()} | ConvertTo-Json | Set-Content $f}
 Start-Process 'http://127.0.0.1:3210'
 Write-Host 'Pyramid Live started. Use Stop-Game.cmd to stop it.'
}catch{Write-Host $_ -ForegroundColor Red;exit 1}
