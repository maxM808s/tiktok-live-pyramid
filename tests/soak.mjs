// Explicit simulator traffic only. Run separately from other integration tests.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3210',token=(await(await fetch(base+'/api/session')).json()).token;
const get=async()=>await(await fetch(base+'/api/state')).json();const initial=await get();assert.equal(initial.config.mode,'simulator');
const end=Date.now()+60000;let events=0,maxMemory=0,maxQueue=0;
while(Date.now()<end){for(let i=0;i<5;i++){const r=await fetch(base+'/api/sim',{method:'POST',headers:{'Content-Type':'application/json','X-Session':token},body:JSON.stringify({event:['like','chat','follow','share'][events%4],data:{uniqueId:'Soak Tester '+events%100,likeCount:5,comment:'building together',msgId:crypto.randomUUID()}})});assert.equal(r.status,200);events++;}const s=await get();assert.ok(s.gameOnline);assert.ok(s.queue<=5000);assert.ok(s.logs.length<=100);maxQueue=Math.max(maxQueue,s.queue);maxMemory=Math.max(maxMemory,s.memoryMB+s.perf.memoryMB);await new Promise(r=>setTimeout(r,100));}
console.log(JSON.stringify({test:'60-second running-service/rendered-game soak',events,maxQueue,maxCombinedMemoryMB:Math.round(maxMemory),gameOnline:(await get()).gameOnline}));
