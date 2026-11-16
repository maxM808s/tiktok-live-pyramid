import assert from 'node:assert/strict';import http from 'node:http';
const base='http://127.0.0.1:3210',token=(await(await fetch(base+'/api/session')).json()).token;
for(const [headers,body,status]of [[{'X-Session':token,Origin:'https://example.com'},'{}',403],[{},'{}',403],[{'X-Session':token},'{broken',400],[{'X-Session':token},JSON.stringify({target:-1}),400]]){
 const r=await fetch(base+'/api/config',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});assert.equal(r.status,status);
}
assert.equal((await fetch(base+'/../server/server.mjs')).status,404);
const badHost=await new Promise((resolve,reject)=>{http.get(base+'/api/state',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});assert.equal(badHost,403);
for(const value of [42,true,[],{gifts:true}]){
 const r=await fetch(base+'/api/config',{method:'POST',headers:{'X-Session':token,'Content-Type':'application/json'},body:JSON.stringify(value)});assert.equal(r.status,400);
}
assert.equal((await fetch(base+'/api/state')).status,200);
console.log('PASS origin, host, token, JSON, config bounds and file allowlist');
