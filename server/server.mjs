import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Engine,validateConfig} from './engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),local=path.join(root,'.local');fs.mkdirSync(local,{recursive:true});
let saved={};try{saved=validateConfig(JSON.parse(fs.readFileSync(path.join(local,'settings.json'))));}catch{}
const game=new Engine(saved),token=crypto.randomBytes(24).toString('hex');
fs.writeFileSync(path.join(local,'session.json'),JSON.stringify({token,pid:process.pid}));
let connection={socket:false,lastEvent:0,error:'TikFinity not connected',attempts:0};let socket,retry;
function connect(){connection.attempts++;socket=new WebSocket('ws://127.0.0.1:21213/');const timeout=setTimeout(()=>socket.close(),5000);
 socket.onopen=()=>{clearTimeout(timeout);connection.socket=true;connection.error='';};
 socket.onmessage=e=>{if(typeof e.data!=='string'||e.data.length>65536)return;try{const p=JSON.parse(e.data);connection.lastEvent=Date.now();game.ingest(p);}catch{game.log('Malformed TikFinity JSON');}};
 socket.onerror=()=>{connection.error='Open TikFinity Desktop and connect to your LIVE';};
 socket.onclose=()=>{clearTimeout(timeout);connection.socket=false;retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(connection.attempts,5)));};}
connect();
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 const host=req.headers.host;if(host!=='127.0.0.1:3210'&&host!=='localhost:3210')return json(res,403,{error:'Invalid host'});
 const u=new URL(req.url,'http://127.0.0.1:3210');
 if(req.method==='GET'&&u.pathname==='/api/state')return json(res,200,{...game.state(),connection,memoryMB:Math.round(process.memoryUsage().rss/1048576),gameOnline:Date.now()-(game.perf?.at||0)<3000});
 if(req.method==='GET'&&u.pathname==='/api/session')return json(res,200,{token});
 if(req.method==='POST'){
 if(req.headers['x-session']!==token)return json(res,403,{error:'Invalid session'});
 if(req.headers.origin&&!['http://127.0.0.1:3210','http://localhost:3210'].includes(req.headers.origin))return json(res,403,{error:'Invalid origin'});
 let raw='';try{for await(const chunk of req){raw+=chunk;if(raw.length>65536)throw Error('Body too large');}const b=JSON.parse(raw||'{}');
 if(u.pathname==='/api/config'){const c=validateConfig(b);game.config={...game.config,...c};fs.writeFileSync(path.join(local,'settings.tmp'),JSON.stringify(game.config,null,2));fs.renameSync(path.join(local,'settings.tmp'),path.join(local,'settings.json'));}
 else if(u.pathname==='/api/sim'){if(!game.ingest(b,'simulator'))return json(res,400,{error:game.logs[0]?.message||'Ignored'});}
 else if(u.pathname==='/api/control'){if(b.action==='pause')game.paused=!game.paused;else if(b.action==='restart')game.reset(game.config.building);else throw Error('Unknown control');}
 else if(u.pathname==='/api/perf'){game.perf={fps:Math.max(0,Math.min(1000,Number(b.fps)||0)),workers:Math.max(0,Math.min(32,Number(b.workers)||0)),memoryMB:Number(b.memoryMB)||0,at:Date.now()};}
 else if(u.pathname==='/api/shutdown'){json(res,200,{ok:true});shutdown();return;}
 else return json(res,404,{error:'Not found'});json(res,200,{ok:true});
 }catch(e){json(res,400,{error:e.message});}return;}
 const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};const file=files[u.pathname];if(!file)return json(res,404,{error:'Not found'});
 res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'});fs.createReadStream(path.join(root,'dashboard',file)).pipe(res);
});
const tick=setInterval(()=>game.tick(.1),100);
function shutdown(){clearInterval(tick);clearTimeout(retry);socket.onclose=null;socket.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
server.on('error',e=>{console.error(e.message);process.exit(1);});server.listen(3210,'127.0.0.1',()=>console.log('Pyramid Live dashboard: http://127.0.0.1:3210'));
