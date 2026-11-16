// An explicit local mock, NOT a real TikFinity connection. Do not run with TikFinity open.
import http from 'node:http';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base='http://127.0.0.1:3210',token=(await(await fetch(base+'/api/session')).json()).token;
const post=async(p,b)=>{const r=await fetch(base+p,{method:'POST',headers:{'X-Session':token,'Content-Type':'application/json'},body:JSON.stringify(b)});assert.equal(r.status,200);};
const get=async()=>await(await fetch(base+'/api/state')).json();
await post('/api/config',{mode:'live'});const before=(await get()).metrics.accepted;
let connections=0;const sockets=new Set();
function frame(data){const b=Buffer.from(JSON.stringify(data));return Buffer.concat([b.length<126?Buffer.from([0x81,b.length]):Buffer.from([0x81,126,b.length>>8,b.length&255]),b]);}
const mock=http.createServer();mock.on('upgrade',(req,socket)=>{
 sockets.add(socket);socket.on('close',()=>sockets.delete(socket));connections++;
 const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
 if(connections===1){const packets=['like','chat','follow','share','gift'].map((event,i)=>({event,data:{uniqueId:'Mock API Viewer',likeCount:5,comment:'temple',giftName:'Rose',giftType:1,repeatCount:3,repeatEnd:true,msgId:'mock-'+crypto.randomUUID()}}));for(const p of packets)socket.write(frame(p));socket.write(frame(packets[4]));setTimeout(()=>socket.destroy(),500);}
});
await new Promise((resolve,reject)=>{mock.once('error',reject);mock.listen(21213,'127.0.0.1',resolve);});
try{const end=Date.now()+45000;while(Date.now()<end&&connections<2)await new Promise(r=>setTimeout(r,200));const s=await get();assert.equal(s.metrics.accepted-before,5);assert.ok(s.metrics.duplicates>=1);assert.ok(connections>=2,'Reconnected after mock socket loss');console.log('PASS mock Event API: all five events, duplicate rejection, socket reconnection');}finally{for(const s of sockets)s.destroy();await new Promise(r=>mock.close(r));await post('/api/config',{mode:'simulator'});}
