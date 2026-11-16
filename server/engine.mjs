import {normalize} from './tikfinity.mjs';
export const buildings=['pyramid','temple','castle','lighthouse','obelisk','ziggurat'];
export const defaults={language:'en',building:'pyramid',target:200,automatic:true,celebration:12,workers:16,quality:'high',camera:true,night:true,mode:'simulator',gifts:{rose:{action:'blocks',value:10},galaxy:{action:'boost',value:50},earthquake:{action:'quake',value:10}}};
export class Engine{
 constructor(config={}){this.config={...defaults,...config,gifts:{...defaults.gifts,...config.gifts}};this.round=0;this.logs=[];this.seen=new Map();this.likes=new Map();this.people=new Map();this.votes=new Map();this.queue=[];this.paused=false;this.lastEvent=0;this.metrics={accepted:0,duplicates:0,rejected:0,dropped:0};this.reset(this.config.building);}
 reset(building,carry=false){this.building=building;this.built=0;this.placements=[];this.queue=carry?this.queue:[];this.contributors=new Map();this.phase='building';this.countdown=0;this.round++;}
 log(message,source='system'){this.logs.unshift({at:Date.now(),message,source});this.logs.length=Math.min(this.logs.length,100);}
 ingest(packet,source='live'){
 try{
 if(!packet||typeof packet!=='object'||!packet.data||typeof packet.data!=='object')throw Error('Invalid envelope');
 const {event,data:d}=normalize(packet);if(!['like','chat','follow','share','gift'].includes(event))throw Error('Unsupported event');
 if(source==='simulator'&&this.config.mode!=='simulator')throw Error('Simulator disabled in live mode');
 if(source==='live'&&this.config.mode!=='live')return false;
 const id=String(d.msgId||d.eventId||'').slice(0,160),key=event+':'+id;
 if(id&&this.seen.has(key)){this.metrics.duplicates++;return false;}
 if(event==='gift'&&Number(d.giftType??d.gift?.type)===1&&!d.repeatEnd)return false;
 const positive=(v,max=10000)=>{const n=Number(v);if(!Number.isInteger(n)||n<1||n>max)throw Error('Invalid quantity');return n;};
 const user=String(d.uniqueId||d.user?.uniqueId||d.user?.displayId||d.userId||'Anonymous').slice(0,64);
 let amount=0,action='blocks';
 if(event==='like'){const sum=(this.likes.get(user)||0)+positive(d.likeCount??d.count??1);amount=Math.floor(sum/5);this.likes.set(user,sum%5);}
 if(event==='chat'){amount=1;const v=String(d.comment||'').trim().toLowerCase();if(buildings.includes(v))this.votes.set(user,v);}
 if(event==='follow')amount=5;if(event==='share')amount=1;
 if(event==='gift'){const name=String(d.giftName||d.gift?.name||'').toLowerCase(),rule=this.config.gifts[name];if(!rule){this.log('Unmapped gift: '+name,source);return false;}amount=positive(d.repeatCount??1,1000)*rule.value;action=rule.action;}
 if(id)this.seen.set(key,Date.now());while(this.seen.size>10000)this.seen.delete(this.seen.keys().next().value);
 while(this.likes.size>5000)this.likes.delete(this.likes.keys().next().value);while(this.votes.size>5000)this.votes.delete(this.votes.keys().next().value);
 if(action==='quake'){if(this.phase==='building'){this.built=Math.max(0,this.built-Math.min(100,amount));this.placements.length=this.built;this.quakeAt=Date.now();}}else{
 amount=Math.min(amount,5000);const space=5000-this.queue.reduce((s,j)=>s+j.remaining,0),accepted=Math.min(space,amount);this.metrics.dropped+=amount-accepted;
 if(accepted>0){this.queue.push({user,remaining:accepted,gold:event==='gift'});this.people.set(user,(this.people.get(user)||0)+accepted);this.contributors.set(user,(this.contributors.get(user)||0)+accepted);}
 if(action==='boost')this.boostUntil=Date.now()+15000;
 }
 while(this.people.size>5000)this.people.delete(this.people.keys().next().value);
 this.lastEvent=Date.now();this.metrics.accepted++;this.log(`${user} · ${event} · ${amount}`,source);return true;
 }catch(e){this.metrics.rejected++;this.log(e.message,source);return false;}
 }
 tick(dt){if(this.paused)return;if(this.phase==='celebrating'){if(this.config.automatic){this.countdown-=dt;if(this.countdown<=0){const tally={};for(const b of this.votes.values())tally[b]=(tally[b]||0)+1;const winner=Object.keys(tally).sort((a,b)=>tally[b]-tally[a])[0];this.votes.clear();this.reset(winner||buildings[(buildings.indexOf(this.building)+1)%6],true);}}return;}
 this.credit=(this.credit||0)+dt*(Date.now()<this.boostUntil?16:4);
 if(Date.now()-(this.perf?.at||0)>3000){this.credit=0;return;}
 while(this.credit>=1&&this.queue.length&&this.built<this.config.target){this.credit--;const job=this.queue[0];this.builder=job.user;this.gold=job.gold;this.built++;this.placements.push({user:job.user,gold:job.gold});if(--job.remaining<=0)this.queue.shift();}
 this.credit=Math.min(this.credit,1);
 if(this.built>=this.config.target){this.phase='celebrating';this.countdown=this.config.celebration;this.log('Round complete');}
 }
 state(){return {placements:this.placements,quakeAt:this.quakeAt||0,building:this.building,built:this.built,target:this.config.target,round:this.round,phase:this.phase,countdown:this.countdown,paused:this.paused,queue:this.queue.reduce((s,j)=>s+j.remaining,0),builder:this.builder||'',gold:this.gold||false,leaderboard:[...this.people].sort((a,b)=>b[1]-a[1]).slice(0,8),roundLeaders:[...this.contributors].sort((a,b)=>b[1]-a[1]).slice(0,5),logs:this.logs,metrics:this.metrics,config:this.config,perf:this.perf||{},idle:Date.now()-this.lastEvent>30000};}
}
export function validateConfig(c){
 if(!c||typeof c!=='object')throw Error('Invalid settings');const out={};
 for(const k of ['automatic','camera','night'])if(k in c){if(typeof c[k]!=='boolean')throw Error(k);out[k]=c[k];}
 for(const [k,lo,hi]of [['target',20,2000],['workers',1,32],['celebration',5,120]])if(k in c){if(!Number.isInteger(c[k])||c[k]<lo||c[k]>hi)throw Error(k);out[k]=c[k];}
 for(const [k,options]of [['language',['en','he']],['building',buildings],['quality',['low','high']],['mode',['simulator','live']]])if(k in c){if(!options.includes(c[k]))throw Error(k);out[k]=c[k];}
 if('gifts'in c){out.gifts={};if(Object.keys(c.gifts).length>100)throw Error('Too many gifts');for(const[n,r]of Object.entries(c.gifts)){if(!/^[\p{L}\p{N} _-]{1,64}$/u.test(n)||!['blocks','boost','quake'].includes(r.action)||!Number.isInteger(r.value)||r.value<1||r.value>1000)throw Error('Invalid gift rule');out.gifts[n.toLowerCase()]=r;}}
 return out;
}
