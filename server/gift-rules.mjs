// ID mappings take priority. Legacy name mappings remain supported for saved settings.
export function normalizedGiftId(value){
 if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<1))return '';
 const id=typeof value==='string'||typeof value==='number'?String(value):'';
 return /^[1-9][0-9]{0,19}$/.test(id)?id:'';
}
export function resolveGiftRule(gifts,data){
 const id=normalizedGiftId(data.giftId),name=String(data.giftName||'').trim().toLowerCase();
 if(id&&Object.hasOwn(gifts,'gift_'+id))return {key:'gift_'+id,rule:gifts['gift_'+id],id};
 if(name&&Object.hasOwn(gifts,name))return {key:name,rule:gifts[name],id};
 // Name-only events can use an ID rule only when that name is unambiguous.
 if(!id&&name){const matches=Object.entries(gifts).filter(([,r])=>r.giftId&&String(r.name||'').toLowerCase()===name);if(matches.length===1)return {key:matches[0][0],rule:matches[0][1],id:matches[0][1].giftId};}
 return null;
}
