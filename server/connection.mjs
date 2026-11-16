// Original adapter for the same official local Desktop API used by the other games.
export const TIKFINITY_URL='ws://localhost:21213/';
export class DesktopConnection{
 constructor({onMessage=()=>{},onWarning=()=>{},Socket=globalThis.WebSocket}={}){this.onMessage=onMessage;this.onWarning=onWarning;this.Socket=Socket;this.socket=null;this.retry=null;this.active=false;this.generation=0;this.status={socket:false,lastEvent:0,error:'',attempts:0,state:'disconnected',endpoint:TIKFINITY_URL};}
 connect(){this.disconnect();this.active=true;this.status.attempts=0;this.open();}
 disconnect(){this.active=false;this.generation++;clearTimeout(this.retry);clearTimeout(this.timeout);clearTimeout(this.stable);this.retry=null;const old=this.socket;this.socket=null;if(old){old.onopen=old.onmessage=old.onerror=old.onclose=null;try{old.close();}catch{}}Object.assign(this.status,{socket:false,state:'disconnected',error:''});}
 open(){
  if(!this.active)return;const generation=++this.generation;this.status.state='connecting';let socket;
  try{socket=new this.Socket(TIKFINITY_URL);this.socket=socket;}catch{this.schedule(generation,'Could not open TikFinity Desktop socket');return;}
  this.timeout=setTimeout(()=>this.schedule(generation,'TikFinity Desktop connection timed out'),8000);
  socket.onopen=()=>{if(generation!==this.generation)return;clearTimeout(this.timeout);Object.assign(this.status,{socket:true,state:'connected',error:''});this.stable=setTimeout(()=>{if(generation===this.generation)this.status.attempts=0;},30000);};
  socket.onmessage=event=>{if(generation!==this.generation||!this.active)return;try{if(typeof event.data!=='string'||event.data.length>65536)throw Error('Oversized or unsupported TikFinity event');const packet=JSON.parse(event.data);if(!packet||typeof packet!=='object'||Array.isArray(packet))throw Error('Invalid TikFinity event');this.status.lastEvent=Date.now();this.onMessage(packet);}catch{this.onWarning('Malformed or unsupported TikFinity event ignored');}};
  socket.onerror=()=>this.schedule(generation,'Check TikFinity Desktop and local-network permission');
  socket.onclose=()=>this.schedule(generation,'TikFinity Desktop disconnected');
 }
 schedule(generation,reason){
  if(!this.active||generation!==this.generation)return;const attempts=this.status.attempts+1;this.disconnect();this.active=true;Object.assign(this.status,{state:'reconnecting',error:reason,attempts});const next=this.generation;this.retry=setTimeout(()=>{this.retry=null;if(this.active&&next===this.generation)this.open();},Math.min(30000,1000*2**Math.min(attempts-1,5)));
 }
}
