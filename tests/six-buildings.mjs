import assert from 'node:assert/strict';
const base='http://127.0.0.1:3210',token=(await(await fetch(base+'/api/session')).json()).token;
const post=async(p,b)=>{const r=await fetch(base+p,{method:'POST',headers:{'X-Session':token,'Content-Type':'application/json'},body:JSON.stringify(b)});assert.equal(r.status,200,await r.text());};
const get=async()=>await(await fetch(base+'/api/state')).json();
const original=(await get()).config;
assert.equal(original.mode,'simulator','Only run in simulator mode');
const start=Date.now();let minFPS=1000,maxMemory=0;
try{
 for(const building of ['pyramid','temple','castle','lighthouse','obelisk','ziggurat']){
  await post('/api/config',{building,target:20,workers:32,quality:'low',automatic:false});await post('/api/control',{action:'restart'});
  await post('/api/sim',{event:'gift',data:{uniqueId:'Six Building Test',giftName:'Rose',giftType:1,repeatEnd:true,repeatCount:2,msgId:crypto.randomUUID()}});
  const end=Date.now()+90000;let complete=false;
  while(Date.now()<end){const s=await get();assert.ok(s.gameOnline,'Game connection');maxMemory=Math.max(maxMemory,s.memoryMB+s.perf.memoryMB);minFPS=Math.min(minFPS,s.perf.fps);if(s.phase==='celebrating'&&s.perf.round===s.round&&s.perf.visualComplete){complete=true;break;}await new Promise(r=>setTimeout(r,500));}
  assert.ok(complete,building+' completed visually');console.log('PASS visible worker delivery and complete geometry:',building);
 }
 console.log(JSON.stringify({durationSeconds:Math.round((Date.now()-start)/1000),minFPS,maxCombinedMemoryMB:Math.round(maxMemory),renderer:'virtual display / software OpenGL; not representative of Windows GPU'}));
}finally{await post('/api/config',original);await post('/api/control',{action:'restart'});}
