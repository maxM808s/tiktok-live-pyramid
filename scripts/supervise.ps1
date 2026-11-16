param([string]$Godot,[string]$Generation)
$ErrorActionPreference='Stop'
$Root=Split-Path $PSScriptRoot -Parent
$Local=Join-Path $Root '.local'
Set-Location -LiteralPath $Root
function Save-Process($Process,$Name){@{id=$Process.Id;started=$Process.StartTime.ToUniversalTime().Ticks.ToString()}|ConvertTo-Json|Set-Content (Join-Path $Local "$Name-process.json")}
function Owned-Process($Name){
 $file=Join-Path $Local "$Name-process.json"
 if(!(Test-Path $file)){return $null}
 try{$s=Get-Content -Raw $file|ConvertFrom-Json;$p=Get-Process -Id $s.id -ErrorAction SilentlyContinue;if($p -and $p.StartTime.ToUniversalTime().Ticks.ToString() -eq $s.started){return $p}}catch{}
 return $null
}
$misses=0
while(Test-Path (Join-Path $Local 'running.txt')){
 try{
  if((Get-Content -Raw (Join-Path $Local 'running.txt')).Trim() -ne $Generation){break}
  try{Invoke-RestMethod 'http://127.0.0.1:3210/api/state' -TimeoutSec 2|Out-Null;$misses=0}catch{$misses++}
  $node=Owned-Process 'service'
  if(!$node -or $misses -ge 5){
   if($node){$node.Kill();$node.WaitForExit(2000)|Out-Null}
   # Refuse to replace an unrelated listener on our port.
   try{$occupied=Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue}catch{$occupied=$null}
   if(!$occupied){$node=Start-Process -FilePath (Get-Command node).Source -ArgumentList 'server/server.mjs' -WorkingDirectory $Root -RedirectStandardOutput (Join-Path $Local 'service.log') -RedirectStandardError (Join-Path $Local 'service-error.log') -WindowStyle Hidden -PassThru;Save-Process $node 'service';$misses=0}
  }
  $game=Owned-Process 'game'
  if(!$game){$gamePath=Join-Path $Root 'game';$game=Start-Process -FilePath $Godot -ArgumentList @('--path',('"'+$gamePath+'"')) -PassThru;Save-Process $game 'game'}
 }catch{Add-Content (Join-Path $Local 'supervisor.log') ((Get-Date -Format o)+' '+$_.Exception.Message)}
 Start-Sleep -Seconds 3
}
