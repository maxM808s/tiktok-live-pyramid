let pending;
export function loadGiftCatalog(){
 if(!pending)pending=fetch('/catalog.json').then(async response=>{
  if(!response.ok)throw Error('Gift library could not be loaded');const data=await response.json();
  if(!Array.isArray(data)||data.length>2000)throw Error('Invalid gift library');
  const ids=new Set();
  for(const gift of data){if(!/^[1-9][0-9]{0,19}$/.test(gift.id)||ids.has(gift.id)||typeof gift.name!=='string'||!gift.name||gift.name.length>64||!Number.isInteger(gift.coins)||gift.coins<0||gift.image!=='assets/gifts/'+gift.id+'.webp')throw Error('Invalid gift entry');ids.add(gift.id);}
  return data;
 });return pending;
}
const normalize=value=>String(value).normalize('NFKD').toLowerCase().replace(/[’‘]/g,"'").trim();
export function findGift(catalog,id,name){return id?catalog.find(g=>g.id===String(id)):catalog.find(g=>normalize(g.name)===normalize(name||''));}
export function configuredGift(gift,rules){
 const key='gift_'+gift.id;if(Object.hasOwn(rules,key))return {key,rule:rules[key]};
 const name=gift.name.toLowerCase();return Object.hasOwn(rules,name)?{key:name,rule:rules[name]}:null;
}
export function filterGifts(catalog,{query='',price='all',mapped='all',sort='coins-asc'}={},rules={}){
 const q=normalize(query);
 return catalog.filter(g=>(!q||normalize(g.name).includes(q)||g.id.includes(q))&&(price==='all'||price==='small'&&g.coins<100||price==='medium'&&g.coins>=100&&g.coins<1000||price==='large'&&g.coins>=1000)&&(mapped==='all'||mapped==='yes'&&configuredGift(g,rules)||mapped==='no'&&!configuredGift(g,rules))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='coins-desc'?b.coins-a.coins||a.name.localeCompare(b.name):a.coins-b.coins||a.name.localeCompare(b.name));
}
export function giftImage(gift,className='gift-image'){
 const image=document.createElement('img');image.src='/'+gift.image;image.alt=gift.name;image.loading='lazy';image.decoding='async';image.width=64;image.height=64;image.className=className;image.onerror=()=>{image.hidden=true;};return image;
}
