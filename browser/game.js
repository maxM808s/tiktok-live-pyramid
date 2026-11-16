import {DesktopConnection} from '../server/connection.mjs';
import {Engine,validateConfig} from '../server/engine.mjs';
import {checkpoint,recover} from './checkpoint.js';
import {DesertView} from './renderer.js';
import {loadGiftCatalog,findGift,giftImage} from '/gift-library.js';
let giftCatalog=[];loadGiftCatalog().then(data=>giftCatalog=data).catch(()=>{});
const $=selector=>document.querySelector(selector);
const clientId=crypto.randomUUID();
let session='',ownerToken='',engine=null,view=null,snapshot=null,ack=0,owned=false,online=false,stopping=false,polling=false,lastSave=0,lastPoll=0,lastFrame=0,lastHUD=0;
const displayOnly=new URLSearchParams(location.search).get('view')==='1';
const transport=new DesktopConnection({onMessage:packet=>{if(['like','chat','follow','share','gift'].includes(packet.event))engine?.ingest(packet,'live');},onWarning:message=>engine?.log(message)});
const connection=transport.status;
const titles={en:{pyramid:'EGYPTIAN PYRAMID',temple:'ANCIENT TEMPLE',castle:'MEDIEVAL CASTLE',lighthouse:'LIGHTHOUSE',obelisk:'OBELISK',ziggurat:'ZIGGURAT'},he:{pyramid:'הפירמידה המצרית',temple:'המקדש העתיק',castle:'טירת ימי הביניים',lighthouse:'המגדלור',obelisk:'האובליסק',ziggurat:'הזיגוראת'}};
let dirtyCheckpoint=true;
let fps=0,frames=0,fpsAt=performance.now(),renderInfo={visualComplete:false,workers:0,renderHealthy:true};
function message(text){$('#error').textContent=text;$('#error').hidden=!text;}
async function post(path,body){
 const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Session':session},body:JSON.stringify(body),signal:AbortSignal.timeout(4500)});
 const data=await response.json();if(!response.ok){const error=Error(data.error||'Local service unavailable');error.status=response.status;throw error;}return data;
}
function disconnect(){transport.disconnect();}
function connect(){if(owned&&online&&!stopping&&engine?.config.mode==='live'&&engine.config.liveEnabled!==false&&!transport.active)transport.connect();}
async function claim(){
 if(displayOnly){owned=false;online=true;$('#loading').hidden=true;return;}
 const current=await(await fetch('/api/session',{signal:AbortSignal.timeout(4500)})).json();session=current.token;
 if(current.runtime!=='browser')throw Error('Close the optional Godot runtime before opening the browser game.');
 try{
  const result=await post('/api/claim',{clientId});ownerToken=result.ownerToken;
  engine=new Engine(validateConfig(result.config));recover(engine,result.checkpoint);ack=0;
  owned=true;online=true;stopping=false;lastPoll=performance.now();lastSave=0;disconnect();connect();
  document.body.classList.remove('spectator');$('#loading').hidden=true;message('');
 }catch(error){if(error.status!==409)throw error;owned=false;engine=null;disconnect();document.body.classList.add('spectator');$('#loading').hidden=true;}
}
async function apply(commands){
 for(const command of commands){if(command.id<=ack)continue;
  if(command.kind==='config'){
   const next={...engine.config,...validateConfig(command.data)};
   if(next.mode!==engine.config.mode){
    const prior=engine,bank=await post('/api/archive',{clientId,ownerToken,checkpoint:checkpoint(prior),nextMode:next.mode});
    engine=new Engine(next);recover(engine,bank.checkpoint);engine.round=Math.max(prior.round,engine.round)+1;disconnect();
   }else engine.config=next;
  }
  else if(command.kind==='sim')engine.ingest(command.data,'simulator');
  else if(command.kind==='control'){if(command.data.action==='pause')engine.paused=!engine.paused;if(command.data.action==='restart')engine.reset(engine.config.building);if(command.data.action==='reconnect'){disconnect();connect();}}
  ack=command.id;dirtyCheckpoint=true;
 }
}
async function poll(){
 if(polling)return;polling=true;
 try{
  if(!owned){
   const response=await fetch('/api/state',{signal:AbortSignal.timeout(4500)});if(!response.ok)throw Error('Local service unavailable');snapshot=await response.json();online=true;
   if(!displayOnly&&!snapshot.gameOnline&&!snapshot.stopping)await claim();return;
  }
  const now=performance.now(),save=dirtyCheckpoint||stopping||now-lastSave>4000;
  const publicState={...engine.state(),connection,perf:{...engine.perf,renderHealthy:view.healthy&&now-lastFrame<3000}};
  const payload={clientId,ownerToken,ack,state:publicState};if(save)payload.checkpoint=checkpoint(engine);
  const response=await post('/api/poll',payload);if(save){lastSave=now;dirtyCheckpoint=false;}
  online=true;lastPoll=now;message('');
  await apply(response.commands||[]);
  if(engine.config.mode!=='live'||engine.config.liveEnabled===false)disconnect();
  if(response.stopping){stopping=true;disconnect();$('#status').textContent='GAME STOPPED';await post('/api/poll',{clientId,ownerToken,ack,state:{...engine.state(),connection,perf:engine.perf},checkpoint:checkpoint(engine)});owned=false;online=false;message('Game stopped. You can close this window.');return;}
  connect();
 }catch(error){
  online=false;disconnect();
  if(!stopping){try{await claim();}catch{message('Local service reconnecting. Keep Start-Game.cmd running.');}}
 }finally{polling=false;}
}
function hud(state){
 const he=state.config.language==='he';document.documentElement.lang=he?'he':'en';document.documentElement.dir=he?'rtl':'ltr';
 $('#building').textContent=titles[he?'he':'en'][state.building];$('#round').textContent=(he?'סיבוב ':'ROUND ')+state.round;
 $('#progressText').textContent=`\u2066${state.built} / ${state.target}\u2069`;$('#progressFill').style.width=Math.min(100,state.built/state.target*100)+'%';
 $('#status').textContent=!online?(he?'מתחברים מחדש לשירות':'LOCAL SERVICE RECONNECTING'):!owned?(state.gameOnline===false?(he?'תצוגה בלבד · פתחו את המשחק הראשי':'DISPLAY ONLY · OPEN THE PRIMARY GAME'):(he?'חלון תצוגה — המשחק פועל בחלון אחר':'VIEW WINDOW · GAME RUNNING IN ANOTHER WINDOW')):state.paused?(he?'הבנייה מושהית':'CONSTRUCTION PAUSED'):state.config.mode==='simulator'?(he?'סימולטור · אירועי בדיקה בלבד':'SIMULATOR · TEST EVENTS ONLY'):state.config.liveEnabled===false?(he?'TikFinity מנותק לפי בחירתכם':'TIKFINITY DISCONNECTED BY YOU'):connection.socket?(he?'TikFinity מחובר':'TIKFINITY API CONNECTED'):(he?'TikFinity מנותק — מנסים שוב':'TIKFINITY DISCONNECTED · RETRYING');
 const complete=state.phase==='celebrating'&&renderInfo.visualComplete;$('#celebration').hidden=!complete;
 $('#completeTitle').textContent=he?'הבנייה הושלמה!':'MONUMENT COMPLETE';$('#countdown').textContent=state.config.automatic?((he?'הסיבוב הבא בעוד ':'Next round in ')+Math.max(0,Math.ceil(state.countdown))+(he?' שניות':'s')):(he?'התחילו סיבוב חדש בלוח הבקרה':'Start the next round from the dashboard');
 $('#lower').hidden=state.config.overlay==='minimal';$('#objective').textContent=he?'בונים יחד משהו שיישאר':'BUILD SOMETHING THAT LASTS';
 const board=state.phase==='celebrating'?state.roundLeaders:state.leaderboard;
 $('#leaderboard').replaceChildren(...board.slice(0,3).map(([name,value],index)=>{const row=document.createElement('div');row.className='leader';const rank=document.createElement('span'),who=document.createElement('bdi'),score=document.createElement('strong');rank.className='rank';rank.textContent=String(index+1).padStart(2,'0');who.textContent=name;score.textContent=value;row.append(rank,who,score);return row;}));
 if(!board.length){const empty=document.createElement('div');empty.className='instructions';empty.textContent=he?'המדבר מחכה לבונים הראשונים':'The desert awaits its first builders.';$('#leaderboard').append(empty);}
 $('#instructions').textContent=he?`${state.config.likesPerWorker} לייקים ← פועל • תגובה ← ${state.config.commentBlocks} אבנים\nמעקב ← ${state.config.followBlocks} אבנים • שיתוף ← ${state.config.shareBlocks} אבנים`:`${state.config.likesPerWorker} likes → worker · Comment → ${state.config.commentBlocks} stones\nFollow → ${state.config.followBlocks} stones · Share → ${state.config.shareBlocks} stones`;
 $('#gift').hidden=!state.lastGift||Date.now()-state.lastGift.at>20000;
 if(!$('#gift').hidden){
  const gift=state.lastGift,item=findGift(giftCatalog,gift.giftId,gift.name),key=gift.at+':'+(item?.id||'');
  if($('#gift').dataset.key!==key){const label=document.createElement('span');label.textContent=`${gift.user} · ${gift.name} × ${gift.count}`;$('#gift').replaceChildren(...(item?[giftImage(item)]:[]),label);$('#gift').dataset.key=key;}
 }
}
function frame(now){
 const delta=Math.min(.1,(now-(lastFrame||now))/1000);lastFrame=now;frames++;if(now-fpsAt>=1000){fps=Math.round(frames*1000/(now-fpsAt));frames=0;fpsAt=now;}
 try{
  if(engine&&owned){
   engine.perf={...renderInfo,at:Date.now(),round:engine.round,fps,memoryMB:performance.memory?performance.memory.usedJSHeapSize/1048576:0};
   if(online&&!stopping&&view.healthy&&now-lastPoll<3500)engine.tick(delta);
   snapshot={...engine.state(),connection};
  }
  if(snapshot){renderInfo=view.update(delta,snapshot);if(now-lastHUD>250){hud(snapshot);lastHUD=now;}}
 }catch(error){view.healthy=false;message('Graphics recovery needed: '+error.message+'. Close this game window and double-click Start-Game.cmd.');}
 requestAnimationFrame(frame);
}
try{view=new DesertView($('#scene'));await claim();requestAnimationFrame(frame);setInterval(poll,350);}
catch(error){$('#loadingText').textContent='Could not start: '+error.message+' Open the control room or restart Start-Game.cmd.';message('The game requires WebGL in your existing browser. Check Edge graphics acceleration; no Godot or Node installation is needed.');}
