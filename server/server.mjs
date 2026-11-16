import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Engine,validateConfig} from './engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),local=path.join(root,'.local');fs.mkdirSync(local,{recursive:true});
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
let saved={},settingsWarning='';
try{saved=validateConfig(JSON.parse(fs.readFileSync(path.join(local,'settings.json'),'utf8')));}
catch(error){if(error.code!=='ENOENT'){
 settingsWarning='Settings file could not be read; loaded defaults. Restore a backup before saving changes.';
 try{saved=validateConfig(JSON.parse(fs.readFileSync(path.join(local,'settings.previous.json'),'utf8')));settingsWarning='Recovered previous settings after an unreadable settings file.';}catch{}
}}
const game=new Engine(saved),token=crypto.randomBytes(24).toString('hex');
if(settingsWarning)game.log(settingsWarning);

let connection={socket:false,lastEvent:0,error:'TikFinity not connected',attempts:0};let socket,retry;
function connect(){connection.attempts++;socket=new WebSocket('ws://127.0.0.1:21213/');const timeout=setTimeout(()=>socket.close(),5000);
 socket.onopen=()=>{clearTimeout(timeout);connection.attempts=0;connection.socket=true;connection.error='';};
 socket.onmessage=e=>{if(typeof e.data!=='string'||e.data.length>65536)return;try{const p=JSON.parse(e.data);connection.lastEvent=Date.now();game.ingest(p);}catch{game.log('Malformed TikFinity JSON');}};
 socket.onerror=()=>{connection.error='Open TikFinity Desktop and connect to your LIVE';};
 socket.onclose=()=>{clearTimeout(timeout);connection.socket=false;retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(connection.attempts,5)));};}
connect();
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 const host=req.headers.host;if(host!=='127.0.0.1:3210'&&host!=='localhost:3210')return json(res,403,{error:'Invalid host'});
 const u=new URL(req.url,'http://127.0.0.1:3210');
 if(req.method==='GET'&&u.pathname==='/api/state')return json(res,200,{...game.state(),appId:'tiktok-live-pyramid',version,uptimeSeconds:Math.floor(process.uptime()),settingsWarning,connection,memoryMB:Math.round(process.memoryUsage().rss/1048576),gameOnline:Date.now()-(game.perf?.at||0)<3000});
 if(req.method==='GET'&&u.pathname==='/api/session')return json(res,200,{token,projectRoot:root,appId:'tiktok-live-pyramid',version});
 if(req.method==='POST'){
 if(req.headers['x-session']!==token)return json(res,403,{error:'Invalid session'});
 if(req.headers.origin&&!['http://127.0.0.1:3210','http://localhost:3210'].includes(req.headers.origin))return json(res,403,{error:'Invalid origin'});
 let raw='';try{for await(const chunk of req){raw+=chunk;if(raw.length>65536)throw Error('Body too large');}const b=JSON.parse(raw||'{}');
 if(u.pathname==='/api/config'){
  const c=validateConfig(b),next={...game.config,...c};
  // Persist before changing the active configuration. Preserve the last validated settings.
  fs.writeFileSync(path.join(local,'settings.tmp'),JSON.stringify(next,null,2));
  if(fs.existsSync(path.join(local,'settings.json'))){
   try{validateConfig(JSON.parse(fs.readFileSync(path.join(local,'settings.json'),'utf8')));fs.copyFileSync(path.join(local,'settings.json'),path.join(local,'settings.previous.json'));}catch(error){if(error.code)throw error;}
  }
  fs.renameSync(path.join(local,'settings.tmp'),path.join(local,'settings.json'));game.config=next;
 }
 else if(u.pathname==='/api/sim'){if(!game.ingest(b,'simulator'))return json(res,400,{error:game.logs[0]?.message||'Ignored'});}
 else if(u.pathname==='/api/control'){if(b.action==='pause')game.paused=!game.paused;else if(b.action==='restart')game.reset(game.config.building);else throw Error('Unknown control');}
 else if(u.pathname==='/api/perf'){game.perf={fps:Math.max(0,Math.min(1000,Number(b.fps)||0)),round:Number(b.round)||0,visualComplete:b.visualComplete===true,workers:Math.max(0,Math.min(32,Number(b.workers)||0)),memoryMB:Number(b.memoryMB)||0,at:Date.now()};}
 else if(u.pathname==='/api/shutdown'){json(res,200,{ok:true});shutdown();return;}
 else return json(res,404,{error:'Not found'});json(res,200,{ok:true});
 }catch(e){json(res,400,{error:e.message});}return;}
 const files={'/':'index.html','/app.js':'app.js','/blueprint.js':'blueprint.js','/style.css':'style.css'};const file=files[u.pathname];if(!file)return json(res,404,{error:'Not found'});
 res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'});fs.createReadStream(path.join(root,'dashboard',file)).pipe(res);
});
// Checkpoints contain only local game state; never committed.
function checkpoint(){
 const data={paused:game.paused,roundTarget:game.roundTarget,building:game.building,built:game.built,round:game.round,phase:game.phase,countdown:game.countdown,queue:game.queue,placements:game.placements,people:[...game.people],contributors:[...game.contributors],seen:[...game.seen],likes:[...game.likes],votes:[...game.votes],logs:game.logs,metrics:game.metrics};
 fs.writeFileSync(path.join(local,'checkpoint.tmp'),JSON.stringify(data));
 fs.renameSync(path.join(local,'checkpoint.tmp'),path.join(local,'checkpoint.json'));
}
try{const c=JSON.parse(fs.readFileSync(path.join(local,'checkpoint.json')));if(!['pyramid','temple','castle','lighthouse','obelisk','ziggurat'].includes(c.building)||!Number.isInteger(c.built)||c.built<0||c.built>2000||!Array.isArray(c.queue)||c.queue.length>5000||!Array.isArray(c.placements)||c.placements.length>2000)throw Error('Bad checkpoint');
 for(const k of ['people','contributors','seen','likes','votes'])if(!Array.isArray(c[k])||c[k].length>(k==='seen'?10000:5000))throw Error('Bad map');
 if(!['building','celebrating'].includes(c.phase)||!Number.isInteger(c.round)||c.round<1||!Number.isFinite(c.countdown)||!Array.isArray(c.logs)||c.logs.length>100||!c.metrics||!['accepted','duplicates','rejected','dropped'].every(k=>Number.isFinite(c.metrics[k])))throw Error('Bad checkpoint state');
 if(c.queue.some(j=>!j||typeof j.user!=='string'||!Number.isInteger(j.remaining)||j.remaining<1)||c.queue.reduce((a,j)=>a+j.remaining,0)>5000)throw Error('Bad queue');
 for(const k of ['building','built','round','phase','countdown','queue','placements','logs','metrics'])game[k]=c[k];game.paused=c.paused===true;game.roundTarget=Number.isInteger(c.roundTarget)&&c.roundTarget>=20&&c.roundTarget<=2000?c.roundTarget:game.config.target;
 for(const k of ['people','contributors','seen','likes','votes'])game[k]=new Map(c[k]);
 game.log('Recovered local checkpoint');
}catch{}
const persistence=setInterval(()=>{try{checkpoint();}catch(e){console.error('Checkpoint failed:',e.message);}},5000);
let lastTick=performance.now();
const tick=setInterval(()=>{const now=performance.now();game.tick(Math.min(.25,(now-lastTick)/1000));lastTick=now;},100);
function shutdown(){try{checkpoint();}catch{}clearInterval(persistence);clearInterval(tick);clearTimeout(retry);socket.onclose=null;socket.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
server.on('error',e=>{console.error(e.message);process.exit(1);});server.listen(3210,'127.0.0.1',()=>{fs.writeFileSync(path.join(local,'session.json'),JSON.stringify({token,pid:process.pid}));console.log('Pyramid Live dashboard: http://127.0.0.1:3210');});
