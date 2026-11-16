import {buildings,validateConfig} from '../server/engine.mjs';
export function checkpoint(engine){
 const out={};
 for(const key of ['building','built','round','roundTarget','phase','countdown','paused','queue','placements','logs','metrics','lastEvent','lastGift','builder','gold','boostUntil','quakeAt'])if(engine[key]!==undefined)out[key]=engine[key];
 for(const key of ['people','contributors','seen','likes','votes'])out[key]=[...engine[key]];
 return out;
}
export function recover(engine,data){
 if(!data)return false;
 try{
  if(!buildings.includes(data.building)||!Number.isInteger(data.built)||data.built<0||data.built>2000||!Number.isInteger(data.round)||data.round<1||!['building','celebrating'].includes(data.phase))throw Error('Invalid round');
  if(!Array.isArray(data.queue)||data.queue.length>5000||data.queue.some(j=>!j||typeof j.user!=='string'||j.user.length>64||!Number.isInteger(j.remaining)||j.remaining<1)||data.queue.reduce((sum,j)=>sum+j.remaining,0)>5000)throw Error('Invalid queue');
  if(!Array.isArray(data.placements)||data.placements.length>2000||data.placements.some(p=>!p||typeof p.user!=='string'||p.user.length>64||typeof p.gold!=='boolean'))throw Error('Invalid placements');
  if(!Array.isArray(data.logs)||data.logs.length>100||!data.metrics||!['accepted','duplicates','rejected','dropped'].every(k=>Number.isFinite(data.metrics[k])&&data.metrics[k]>=0)||!Number.isFinite(data.countdown))throw Error('Invalid counters');
  const maps={};for(const k of ['people','contributors','seen','likes','votes']){if(!Array.isArray(data[k])||data[k].length>(k==='seen'?10000:5000)||data[k].some(pair=>!Array.isArray(pair)||pair.length!==2))throw Error('Invalid map');maps[k]=new Map(data[k]);}
  const target=data.roundTarget??engine.config.target;validateConfig({target});if(data.built>target)throw Error('Invalid progress');
  for(const k of ['building','built','round','phase','countdown','queue','placements','logs','metrics'])engine[k]=data[k];
  Object.assign(engine,maps);engine.roundTarget=target;engine.paused=data.paused===true;
  for(const k of ['lastEvent','boostUntil','quakeAt'])engine[k]=Number.isFinite(data[k])?data[k]:0;
  engine.builder=String(data.builder||'').slice(0,64);engine.gold=data.gold===true;
  if(data.lastGift&&typeof data.lastGift.user==='string')engine.lastGift=data.lastGift;
  engine.log('Recovered local checkpoint');return true;
 }catch{engine.log('Checkpoint was invalid; starting a clean round');return false;}
}
