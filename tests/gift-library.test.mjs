import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Engine,validateConfig} from '../server/engine.mjs';
import {normalize} from '../server/tikfinity.mjs';
import {filterGifts,configuredGift,findGift} from '../dashboard/gift-library.js';
const root=new URL('../',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root))),manifest=JSON.parse(fs.readFileSync(new URL('assets/gift-library-source.json',root)));
const packet=(data)=>({event:'gift',data:{uniqueId:'Library Tester',...data}});
test('complete shared library has 314 verified local WebP copies with matching import hashes',()=>{
 assert.equal(catalog.length,314);assert.equal(manifest.giftCount,catalog.length);assert.equal(new Set(catalog.map(g=>g.id)).size,314);
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('catalog.json',root))).digest('hex'),manifest.catalogSHA256);
 const hashes=new Map(manifest.files.map(f=>[f.path,f.sha256]));
 for(const gift of catalog){assert.match(gift.id,/^[1-9][0-9]{0,19}$/);assert.equal(gift.image,'assets/gifts/'+gift.id+'.webp');assert.ok(Number.isInteger(gift.coins)&&gift.coins>=0);const bytes=fs.readFileSync(new URL(gift.image,root));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(createHash('sha256').update(bytes).digest('hex'),hashes.get(gift.image));}
});
test('gift IDs separate same-name gifts and match renamed/nested payloads correctly',()=>{
 const gifts={gift_9101:{giftId:'9101',name:'TikTok Universe',action:'blocks',value:50},gift_9072:{giftId:'9072',name:'TikTok Universe',action:'blocks',value:100}};
 const e=new Engine({mode:'live',gifts});e.ingest(packet({giftId:9101,giftName:'Regional name',repeatCount:2}));e.ingest(packet({gift:{id:9072,name:'TikTok Universe'}}));assert.equal(e.state().queue,200);
 assert.equal(e.ingest(packet({giftName:'TikTok Universe'})),false);assert.equal(e.ingest(packet({giftId:99999,giftName:'TikTok Universe'})),false);assert.equal(e.state().queue,200);
 assert.equal(normalize(packet({gift:{id:5655,name:'Rose'}})).data.giftId,'5655');
});
test('legacy saved name rules still work and ID rules take priority without double credit',()=>{
 const legacy=new Engine({mode:'live'});legacy.ingest(packet({giftId:5655,giftName:'Rose',repeatCount:3}));assert.equal(legacy.state().queue,30);
 const e=new Engine({mode:'live',gifts:{rose:{action:'blocks',value:10},gift_5655:{giftId:'5655',name:'Rose',action:'blocks',value:7}}});e.ingest(packet({giftId:5655,giftName:'Rose',repeatCount:2}));assert.equal(e.state().queue,14);
 const only=new Engine({mode:'live',gifts:{gift_5655:{giftId:'5655',name:'Rose',action:'blocks',value:7}}});only.ingest(packet({giftName:'Rose',repeatCount:3}));assert.equal(only.state().queue,21);assert.equal(only.state().lastGift.giftId,'5655');
});
test('ID rule metadata persists through validation; mismatched or unsafe IDs are rejected',()=>{
 const rule={giftId:'7985',name:'Lion’s Mane',action:'boost',value:30};assert.deepEqual(validateConfig({gifts:{gift_7985:rule}}).gifts.gift_7985,rule);
 assert.throws(()=>validateConfig({gifts:{gift_5655:{...rule,giftId:'6064'}}}));assert.throws(()=>validateConfig({gifts:{gift_5655:{...rule,giftId:'../x'}}}));assert.throws(()=>validateConfig({gifts:{gift_7985:{...rule,name:'bad\nname'}}}));
});
test('library supports case/ID search, coin filters, sorting, and mapped filters',()=>{
 assert.ok(filterGifts(catalog,{query:'rOsE'}).some(g=>g.id==='5655'));assert.ok(filterGifts(catalog,{query:'5655'}).some(g=>g.id==='5655'));assert.ok(filterGifts(catalog,{query:"LION'S MANE"}).some(g=>g.id==='7985'));
 assert.ok(filterGifts(catalog,{price:'large'}).every(g=>g.coins>=1000));assert.ok(filterGifts(catalog,{price:'small'}).every(g=>g.coins<100));const sorted=filterGifts(catalog,{sort:'coins-desc'});assert.ok(sorted[0].coins>=sorted.at(-1).coins);
 const rules={rose:{action:'blocks',value:10}};assert.deepEqual(filterGifts(catalog,{mapped:'yes'},rules).map(g=>g.id),['5655']);assert.equal(configuredGift(findGift(catalog,'5655'),rules).key,'rose');assert.equal(findGift(catalog,'99999999','Rose'),undefined);
});
