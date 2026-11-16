import test from 'node:test';
import assert from 'node:assert/strict';
import {DesktopConnection,TIKFINITY_URL} from '../server/connection.mjs';
import {validateConfig} from '../server/engine.mjs';
class FakeSocket{
 static instances=[];
 constructor(url){this.url=url;FakeSocket.instances.push(this);}
 close(){this.closed=true;}
}
test('Desktop endpoint, disconnect cancellation, stale callbacks and malformed packets',()=>{
 const received=[],warnings=[],c=new DesktopConnection({Socket:FakeSocket,onMessage:p=>received.push(p),onWarning:m=>warnings.push(m)});
 c.connect();const socket=c.socket,oldOpen=socket.onopen;assert.equal(socket.url,'ws://localhost:21213/');assert.equal(TIKFINITY_URL,socket.url);
 socket.onopen();assert.equal(c.status.socket,true);
 socket.onmessage({data:'broken'});socket.onmessage({data:'[]'});socket.onmessage({data:'x'.repeat(65537)});assert.equal(warnings.length,3);assert.equal(c.status.socket,true);
 socket.onmessage({data:JSON.stringify({event:'follow',data:{uniqueId:'Tester'}})});assert.equal(received.length,1);
 socket.onerror();assert.equal(c.status.state,'reconnecting');assert.equal(c.status.attempts,1);assert.ok(c.retry);assert.equal(socket.closed,true);
 c.disconnect();oldOpen();assert.equal(c.status.socket,false);assert.equal(c.retry,null);assert.equal(c.active,false);assert.equal(c.status.state,'disconnected');
 c.connect();assert.notEqual(c.socket,socket);c.socket.onopen();assert.equal(c.status.socket,true);c.disconnect();
});
test('explicit disconnect is a validated, persistent boolean setting',()=>{
 assert.deepEqual(validateConfig({liveEnabled:false}),{liveEnabled:false});assert.throws(()=>validateConfig({liveEnabled:'false'}));
});
