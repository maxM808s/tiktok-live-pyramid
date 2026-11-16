param([int]$Port = 3210)
# Original localhost-only host. Windows PowerShell 5.1 / .NET Framework, no installed runtime.
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$Local = Join-Path $Root '.local'
New-Item -ItemType Directory -Path $Local -Force | Out-Null
$Base = "http://127.0.0.1:$Port"
$Utf8 = New-Object Text.UTF8Encoding($false)
$StrictUtf8 = New-Object Text.UTF8Encoding($false, $true)
$script:Version = (Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $Root 'package.json') | ConvertFrom-Json).version
function New-Key {
    $bytes = New-Object byte[] 32
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}
function Same-Key([string]$A, [string]$B) {
    if ($A.Length -ne 64 -or $B.Length -ne 64) { return $false }
    $difference = 0
    for ($i = 0; $i -lt 64; $i++) { $difference = $difference -bor ([int][char]$A[$i] -bxor [int][char]$B[$i]) }
    return $difference -eq 0
}
function Validate-Settings($Value) {
    if ($null -eq $Value -or $Value -is [array] -or $Value -is [string]) { throw 'Invalid settings' }
    $result = @{}
    foreach ($name in @('automatic','camera','night')) {
        if ($null -ne $Value.PSObject.Properties[$name]) {
            if ($Value.$name -isnot [bool]) { throw "Invalid $name" }
            $result[$name] = $Value.$name
        }
    }
    $ranges = @{ target=@(20,2000); workers=@(1,32); celebration=@(5,120); likesPerWorker=@(1,1000); commentBlocks=@(1,100); followBlocks=@(1,1000); shareBlocks=@(1,100) }
    foreach ($name in $ranges.Keys) {
        if ($null -ne $Value.PSObject.Properties[$name]) {
            $n = $Value.$name
            if (($n -isnot [int] -and $n -isnot [long] -and $n -isnot [double] -and $n -isnot [decimal]) -or [double]::IsNaN([double]$n) -or $n % 1 -ne 0 -or $n -lt $ranges[$name][0] -or $n -gt $ranges[$name][1]) { throw "Invalid $name" }
            $result[$name] = [int]$n
        }
    }
    $choices = @{ language=@('en','he'); building=@('pyramid','temple','castle','lighthouse','obelisk','ziggurat'); quality=@('low','high'); mode=@('simulator','live'); skin=@('mixed','worker','mummy','ninja','pharaoh'); overlay=@('full','minimal') }
    foreach ($name in $choices.Keys) {
        if ($null -ne $Value.PSObject.Properties[$name]) {
            if ($Value.$name -isnot [string] -or $Value.$name -cnotin $choices[$name]) { throw "Invalid $name" }
            $result[$name] = $Value.$name
        }
    }
    if ($null -ne $Value.PSObject.Properties['gifts']) {
        if ($null -eq $Value.gifts -or $Value.gifts -is [array] -or $Value.gifts -is [string]) { throw 'Invalid gift rules' }
        $rules = @($Value.gifts.PSObject.Properties)
        if ($rules.Count -gt 100) { throw 'Too many gift rules' }
        $gifts = @{}
        foreach ($rule in $rules) {
            $name = $rule.Name; $r = $rule.Value
            if ($name -cnotmatch '^[\p{L}\p{N} _-]{1,64}$' -or $r.action -cnotin @('blocks','boost','quake') -or ($r.value -isnot [int] -and $r.value -isnot [long] -and $r.value -isnot [double]) -or $r.value % 1 -ne 0 -or $r.value -lt 1 -or $r.value -gt 1000) { throw 'Invalid gift rule' }
            $gifts[$name.ToLowerInvariant()] = @{ action=$r.action; value=[int]$r.value }
        }
        $result['gifts'] = $gifts
    }
    return $result
}
function Atomic-Json([string]$Name, $Value) {
    $file = Join-Path $Local $Name
    $temp = "$file.tmp"
    [IO.File]::WriteAllText($temp, (ConvertTo-Json -InputObject $Value -Depth 64 -Compress), $Utf8)
    if ([IO.File]::Exists($file)) { [IO.File]::Replace($temp, $file, [NullString]::Value) } else { [IO.File]::Move($temp, $file) }
}
$script:Config = Validate-Settings (Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $Root 'config/defaults.json') | ConvertFrom-Json)
$script:Warning = ''
$settingsFile = Join-Path $Local 'settings.json'
if (Test-Path -LiteralPath $settingsFile) {
    try { $saved = Validate-Settings (Get-Content -Raw -Encoding UTF8 -LiteralPath $settingsFile | ConvertFrom-Json); foreach ($key in $saved.Keys) { $script:Config[$key] = $saved[$key] } }
    catch {
        $script:Warning = 'Settings could not be read. Restore a backup before saving.'
        try { $saved = Validate-Settings (Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $Local 'settings.previous.json') | ConvertFrom-Json); foreach ($key in $saved.Keys) { $script:Config[$key] = $saved[$key] }; $script:Warning='Recovered previous valid settings.' } catch {}
    }
}
$script:Checkpoint = $null
try { $file=Join-Path $Local 'checkpoint.json'; if ((Get-Item $file).Length -le 6291456) { $script:Checkpoint=Get-Content -Raw -Encoding UTF8 -LiteralPath $file | ConvertFrom-Json } } catch {}
$script:Token = New-Key
$script:Owner = ''; $script:OwnerKey = ''; $script:OwnerAt = [datetime]::MinValue
$script:Ack=0; $script:Sequence = 0; $script:Commands = New-Object 'Collections.Generic.List[object]'
$script:Stopping = $false; $script:StopAt = [datetime]::MaxValue
$script:State = [pscustomobject]@{ building=$script:Config.building; built=0; target=$script:Config.target; round=1; phase='building'; countdown=0; paused=$false; queue=0; builder=''; gold=$false; placements=@(); leaderboard=@(); roundLeaders=@(); logs=@(); idle=$true; metrics=@{accepted=0;duplicates=0;rejected=0;dropped=0}; perf=@{}; connection=@{socket=$false;lastEvent=0;error='Waiting for game window';attempts=0} }
function Current-State {
    $result = [ordered]@{}
    foreach ($property in $script:State.PSObject.Properties) { $result[$property.Name] = $property.Value }
    $result['config']=$script:Config; $result['appId']='tiktok-live-pyramid'; $result['runtime']='browser'; $result['version']=$script:Version
    $result['memoryMB']=[math]::Round([Diagnostics.Process]::GetCurrentProcess().WorkingSet64 / 1MB)
    $result['gameOnline']=($script:Owner -ne '' -and ([datetime]::UtcNow-$script:OwnerAt).TotalSeconds -lt 6 -and !$script:Stopping -and $script:State.perf.renderHealthy -ne $false)
    $result['commandAck']=$script:Ack; $result['settingsWarning']=$script:Warning; $result['stopping']=$script:Stopping
    return $result
}
function Reply($Stream, [int]$Status, [string]$Type, [byte[]]$Bytes) {
    $labels=@{200='OK';204='No Content';400='Bad Request';403='Forbidden';404='Not Found';405='Method Not Allowed';409='Conflict';413='Payload Too Large';429='Too Many Requests'}
    $csp="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' ws://127.0.0.1:21213 ws://localhost:21213; img-src 'self' data:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'"
    $head="HTTP/1.1 $Status $($labels[$Status])`r`nContent-Type: $Type`r`nContent-Length: $($Bytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nReferrer-Policy: no-referrer`r`nContent-Security-Policy: $csp`r`n`r`n"
    $header=[Text.Encoding]::ASCII.GetBytes($head);$Stream.Write($header,0,$header.Length)
    if($Bytes.Length){$Stream.Write($Bytes,0,$Bytes.Length)};$Stream.Flush()
}
function Json-Reply($Stream,[int]$Status,$Value) { Reply $Stream $Status 'application/json; charset=utf-8' $Utf8.GetBytes((ConvertTo-Json -InputObject $Value -Depth 64 -Compress)) }
function Add-Command([string]$Kind,$Data) { $script:Sequence++;$script:Commands.Add(@{id=$script:Sequence;kind=$Kind;data=$Data}) }
function Handle($Stream) {
    $header=New-Object 'Collections.Generic.List[byte]'
    while($true){$b=$Stream.ReadByte();if($b -lt 0){return};$header.Add([byte]$b);$n=$header.Count;if($n -gt 16384){Json-Reply $Stream 413 @{error='Header too large'};return};if($n -ge 4 -and $header[$n-4] -eq 13 -and $header[$n-3] -eq 10 -and $header[$n-2] -eq 13 -and $header[$n-1] -eq 10){break}}
    $lines=[Text.Encoding]::ASCII.GetString($header.ToArray()).Split(@("`r`n"),[StringSplitOptions]::None);$request=$lines[0].Split(' ')
    if($request.Length -ne 3 -or $request[2] -cne 'HTTP/1.1' -or !$request[1].StartsWith('/') -or $request[1].Length -gt 2048){Json-Reply $Stream 400 @{error='Invalid request'};return}
    $headers=@{}
    foreach($line in $lines[1..($lines.Length-1)]){if(!$line){continue};$colon=$line.IndexOf(':');if($colon -lt 1){throw 'Invalid header'};$name=$line.Substring(0,$colon).Trim();if($headers.ContainsKey($name)){throw 'Duplicate header'};$headers[$name]=$line.Substring($colon+1).Trim()}
    if($headers['Host'] -cnotin @("127.0.0.1:$Port","localhost:$Port")){Json-Reply $Stream 403 @{error='Invalid host'};return}
    if($headers.ContainsKey('Origin') -and $headers['Origin'] -cnotin @($Base,"http://localhost:$Port")){Json-Reply $Stream 403 @{error='Invalid origin'};return}
    if($headers['Sec-Fetch-Site'] -eq 'cross-site' -and $request[1].StartsWith('/api/')){Json-Reply $Stream 403 @{error='Cross-site request'};return}
    if($headers.ContainsKey('Transfer-Encoding')){throw 'Chunked bodies are unsupported'}
    [int]$length=0
    if($headers.ContainsKey('Content-Length') -and (![int]::TryParse($headers['Content-Length'],[ref]$length) -or $length -lt 0)){throw 'Invalid content length'}
    if($length -gt 6291456){Json-Reply $Stream 413 @{error='Body too large'};return}
    $path=[uri]::UnescapeDataString($request[1].Split('?')[0]);$method=$request[0]
    if($method -eq 'GET'){
        if($length -ne 0){throw 'Unexpected body'}
        if($path -eq '/favicon.ico'){Reply $Stream 204 'image/x-icon' ([byte[]]@());return}
        if($path -eq '/api/state'){Json-Reply $Stream 200 (Current-State);return}
        if($path -eq '/api/session'){Json-Reply $Stream 200 @{token=$script:Token;appId='tiktok-live-pyramid';projectRoot=$Root;version=$script:Version;runtime='browser'};return}
        $files=@{'/'='dashboard/index.html';'/app.js'='dashboard/app.js';'/style.css'='dashboard/style.css';'/blueprint.js'='dashboard/blueprint.js';'/browser/game.html'='browser/game.html';'/browser/game.js'='browser/game.js';'/browser/renderer.js'='browser/renderer.js';'/browser/checkpoint.js'='browser/checkpoint.js';'/browser/game.css'='browser/game.css';'/server/engine.mjs'='server/engine.mjs';'/server/tikfinity.mjs'='server/tikfinity.mjs';'/vendor/three/three.module.min.js'='vendor/three/three.module.min.js';'/vendor/three/three.core.min.js'='vendor/three/three.core.min.js'}
        if(!$files.ContainsKey($path)){Json-Reply $Stream 404 @{error='Not found'};return}
        $file=Join-Path $Root $files[$path];$ext=[IO.Path]::GetExtension($file);$types=@{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.mjs'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8'}
        Reply $Stream 200 $types[$ext] ([IO.File]::ReadAllBytes($file));return
    }
    if($method -ne 'POST'){Json-Reply $Stream 405 @{error='Method not allowed'};return}
    if(!(Same-Key ([string]$headers['X-Session']) $script:Token)){Json-Reply $Stream 403 @{error='Invalid session'};return}
    if($headers['Content-Type'] -notmatch '^application/json(?:;|$)'){throw 'JSON required'}
    $bytes=New-Object byte[] $length;$received=0
    while($received -lt $length){$read=$Stream.Read($bytes,$received,$length-$received);if(!$read){throw 'Incomplete body'};$received+=$read}
    $body=ConvertFrom-Json -InputObject ($StrictUtf8.GetString($bytes)) -ErrorAction Stop
    if($path -eq '/api/claim'){
        if($body.clientId -isnot [string] -or $body.clientId -notmatch '^[a-zA-Z0-9-]{16,80}$'){throw 'Invalid client'}
        if($script:Owner -ne '' -and $script:Owner -ne $body.clientId -and ([datetime]::UtcNow-$script:OwnerAt).TotalSeconds -lt 6){Json-Reply $Stream 409 @{error='Another game window owns the session'};return}
        $script:Owner=$body.clientId;$script:OwnerKey=New-Key;$script:OwnerAt=[datetime]::UtcNow
        Json-Reply $Stream 200 @{ownerToken=$script:OwnerKey;config=$script:Config;checkpoint=$script:Checkpoint;sequence=$script:Sequence};return
    }
    if($path -eq '/api/poll'){
        if($body.clientId -cne $script:Owner -or !(Same-Key ([string]$body.ownerToken) $script:OwnerKey)){Json-Reply $Stream 403 @{error='Game ownership expired'};return}
        if($null -eq $body.state -or $body.state.building -cnotin @('pyramid','temple','castle','lighthouse','obelisk','ziggurat') -or $body.state.built -lt 0 -or $body.state.built -gt 2000 -or @($body.state.logs).Count -gt 100 -or @($body.state.placements).Count -gt 2000){throw 'Invalid game state'}
        $script:State=$body.state;$script:OwnerAt=[datetime]::UtcNow
        if($null -ne $body.checkpoint){
            if(@($body.checkpoint.seen).Count -gt 10000 -or @($body.checkpoint.queue).Count -gt 5000 -or @($body.checkpoint.people).Count -gt 5000){throw 'Checkpoint too large'}
            Atomic-Json 'checkpoint.json' $body.checkpoint;$script:Checkpoint=$body.checkpoint
        }
        $ack=[long]$body.ack
        if($ack -lt 0 -or $ack -gt $script:Sequence){throw 'Invalid command acknowledgement'}
        $script:Ack=[math]::Max($script:Ack,$ack)
        while($script:Commands.Count -and $script:Commands[0].id -le $ack){$script:Commands.RemoveAt(0)}
        Json-Reply $Stream 200 @{commands=@($script:Commands.ToArray());stopping=$script:Stopping};
        if($script:Stopping -and $null -ne $body.checkpoint){$script:StopAt=[datetime]::UtcNow};return
    }
    if($path -eq '/api/shutdown'){$script:Stopping=$true;$script:StopAt=[datetime]::UtcNow.AddSeconds(2);Json-Reply $Stream 200 @{ok=$true};return}
    if($script:Commands.Count -ge 200){Json-Reply $Stream 429 @{error='Game command queue full. Open the game window.'};return}
    if($path -eq '/api/config'){
        $change=Validate-Settings $body;$next=@{};foreach($key in $script:Config.Keys){$next[$key]=$script:Config[$key]};foreach($key in $change.Keys){$next[$key]=$change[$key]}
        if(Test-Path -LiteralPath $settingsFile){$valid=$false;try{Validate-Settings (Get-Content -Raw -Encoding UTF8 -LiteralPath $settingsFile | ConvertFrom-Json) | Out-Null;$valid=$true}catch{};if($valid){[IO.File]::Copy($settingsFile,(Join-Path $Local 'settings.previous.json'),$true)}}
        Atomic-Json 'settings.json' $next;$script:Config=$next;$script:Warning='';Add-Command 'config' $next
    }elseif($path -eq '/api/control'){
        if($body.action -cnotin @('pause','restart')){throw 'Unknown control'};Add-Command 'control' $body
    }elseif($path -eq '/api/sim'){
        if($script:Config.mode -cne 'simulator'){throw 'Simulator disabled in live mode'}
        if($body.event -cnotin @('like','chat','follow','share','gift') -or $null -eq $body.data){throw 'Invalid event'};Add-Command 'sim' $body
    }else{Json-Reply $Stream 404 @{error='Not found'};return}
    Json-Reply $Stream 200 @{ok=$true;commandId=$script:Sequence}
}
$listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$Port)
try{
    $listener.Start();Atomic-Json 'session.json' @{token=$script:Token;pid=$PID;runtime='browser'}
    Write-Host "Pyramid Live browser host: $Base (Windows built-ins only)"
    while([datetime]::UtcNow -lt $script:StopAt){
        if(!$listener.Pending()){Start-Sleep -Milliseconds 10;continue}
        $client=$listener.AcceptTcpClient()
        try{$client.ReceiveTimeout=3000;$client.SendTimeout=3000;$stream=$client.GetStream();try{Handle $stream}catch{try{Json-Reply $stream 400 @{error=$_.Exception.Message}}catch{}}}finally{$client.Dispose()}
    }
}finally{$listener.Stop();$script:OwnerKey='';$script:Token=''}
