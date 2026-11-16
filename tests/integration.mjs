import assert from 'node:assert/strict';
const base='http://127.0.0.1:3210';
const token=(await(await fetch(base+'/api/session')).json()).token;
const post=async(path,b)=>{const r=await fetch(base+path,{method:'POST',headers:{'X-Session':token,'Content-Type':'application/json'},body:JSON.stringify(b)});assert.equal(r.status,200,await r.text());};
const state=async()=>await(await fetch(base+'/api/state')).json();
assert.equal((await fetch(base+'/api/control',{method:'POST',body:'{}'})).status,403);
await post('/api/config',{mode:'simulator',target:20,celebration:5});
await post('/api/control',{action:'restart'});
await post('/api/sim',{event:'gift',data:{uniqueId:'Integration Builder',giftName:'Rose',repeatCount:2,giftType:1,repeatEnd:true,msgId:crypto.randomUUID()}});
const deadline=Date.now()+60000;let complete=false;
while(Date.now()<deadline){const s=await state();assert.ok(s.gameOnline,'Start Godot before integration test');if(s.phase==='celebrating'){complete=true;break;}await new Promise(r=>setTimeout(r,300));}
assert.ok(complete,'Round completed from simulator through service and Godot');
const first=(await state()).round;
while(Date.now()<deadline){if((await state()).round>first)break;await new Promise(r=>setTimeout(r,300));}
assert.ok((await state()).round>first,'Automatic next round');
await post('/api/config',{target:200,celebration:12});
console.log('PASS auth, simulator → service → Godot, completion, automatic rotation');
