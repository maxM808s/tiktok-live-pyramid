import {findGift,giftImage} from '/gift-library.js';
export function giftGuidePage(rules,catalog,language,now=Date.now()){
 const he=language==='he',all=Object.entries(rules||{}),pages=Math.ceil(all.length/2),page=pages?Math.floor(now/6000)%pages:0;
 return {page,pages,title:he?'המתנות שלכם בונות כאן':'YOUR GIFTS BUILD THIS',items:all.slice(page*2,page*2+2).map(([key,rule])=>{
  const gift=findGift(catalog,rule.giftId,rule.name||key),name=rule.name||gift?.name||key;
  const stones=rule.value.toLocaleString(language==='he'?'he-IL':'en-US');
  const action=rule.action==='boost'?(he?`האצה 15 שנ׳ + ${stones} אבנים`:`15s boost + ${stones} stones`):rule.action==='quake'?(he?`רעידה · הסרת ${stones} אבנים`:`Quake · remove ${stones} stones`):(he?`${stones} אבנים`:`${stones} stones`);
  return {key,gift,name,action,id:rule.giftId||gift?.id||''};
 })};
}
export function renderGiftGuide(root,rules,catalog,language,now=Date.now()){
 const guide=giftGuidePage(rules,catalog,language,now);root.hidden=guide.items.length===0;if(root.hidden)return;
 const signature=JSON.stringify([language,guide.page,guide.pages,guide.items.map(i=>[i.key,i.name,i.action,i.gift?.image,i.id])]);
 if(root.dataset.signature===signature)return;root.dataset.signature=signature;
 const heading=document.createElement('div');heading.className='gift-guide-heading';
 const title=document.createElement('strong');title.textContent=guide.title;heading.append(title);
 if(guide.pages>1){const count=document.createElement('bdi');count.textContent=(guide.page+1)+' / '+guide.pages;heading.append(count);}
 const grid=document.createElement('div');grid.className='gift-guide-grid';
 for(const item of guide.items){
  const card=document.createElement('div');card.className='gift-guide-card';card.dataset.rule=item.key;
  if(item.gift)card.append(giftImage(item.gift));else{const icon=document.createElement('span');icon.className='gift-guide-custom';icon.textContent='◇';card.append(icon);}
  const info=document.createElement('div'),name=document.createElement('bdi'),action=document.createElement('strong');name.className='gift-guide-name';name.textContent=item.name;action.className='gift-guide-action';action.textContent=item.action;info.append(name,action);
  if(item.id){const id=document.createElement('small');id.dir='ltr';id.textContent='ID '+item.id;info.append(id);}
  card.append(info);grid.append(card);
 }
 root.replaceChildren(heading,grid);
}
