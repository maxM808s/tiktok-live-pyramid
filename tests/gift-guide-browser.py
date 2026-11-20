"""Live overlay guide verification with simulator settings; no real TikFinity traffic."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,urllib.request
root=Path(__file__).resolve().parents[1];base='http://127.0.0.1:3210'
def get():
 with urllib.request.urlopen(base+'/api/state') as r:return json.load(r)
def wait(predicate,timeout=20):
 end=time.time()+timeout
 while time.time()<end:
  s=get()
  if predicate(s):return s
  time.sleep(.1)
 raise AssertionError('State timeout')
def post(route,data):
 with urllib.request.urlopen(base+'/api/session') as r:token=json.load(r)['token']
 req=urllib.request.Request(base+route,json.dumps(data).encode(),{'Content-Type':'application/json','X-Session':token},method='POST')
 with urllib.request.urlopen(req) as r:d=json.load(r)
 if d.get('commandId'):wait(lambda s:s.get('commandAck',0)>=d['commandId'])
original=get()['config']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling'])
 game=browser.new_page(viewport={'width':540,'height':960});errors=[];game.on('pageerror',lambda e:errors.append(str(e)))
 try:
  game.goto(base+'/browser/game.html');wait(lambda s:s['gameOnline'])
  gifts={'gift_5655':{'giftId':'5655','name':'Rose','action':'blocks','value':10},'gift_11046':{'giftId':'11046','name':'Galaxy','action':'boost','value':50},'gift_6369':{'giftId':'6369','name':'Lion','action':'quake','value':100},'my custom gift':{'action':'blocks','value':30}}
  post('/api/config',{'mode':'simulator','language':'en','quality':'low','overlay':'full','gifts':dict(list(gifts.items())[:2])})
  game.locator('[data-rule=gift_5655]').filter(has_text='10 stones').wait_for();game.locator('[data-rule=gift_11046]').filter(has_text='15s boost + 50 stones').wait_for();game.locator('.gift-guide-card').nth(1).wait_for();assert game.locator('.gift-guide-card').count()==2
  game.wait_for_function("()=>[...document.querySelectorAll('#giftGuide img')].length===2&&[...document.querySelectorAll('#giftGuide img')].every(i=>i.naturalWidth>0)")
  assert '10 stones' in game.locator('[data-rule=gift_5655]').text_content();assert '15s boost + 50 stones' in game.locator('[data-rule=gift_11046]').text_content()
  layout=game.evaluate("()=>({hud:document.querySelector('.hud').getBoundingClientRect().bottom,lower:document.querySelector('#lower').getBoundingClientRect().top,frame:document.querySelector('#frame').getBoundingClientRect().bottom,bottom:document.querySelector('#lower').getBoundingClientRect().bottom})")
  game.screenshot(path=str(root/'.local/live-gift-guide-en.png'))
  assert layout['lower']>layout['hud']+200,layout;assert layout['bottom']<layout['frame'],layout
  post('/api/config',{'language':'he'});game.locator('html[dir=rtl]').wait_for();game.locator('.gift-guide-heading').filter(has_text='המתנות שלכם').wait_for()
  assert 'האצה' in game.locator('[data-rule=gift_11046]').text_content()
  game.screenshot(path=str(root/'.local/live-gift-guide-he.png'))
  capture=browser.new_page(viewport={'width':540,'height':960});capture.goto(base+'/browser/game.html?view=1');capture.locator('#giftGuide').wait_for();assert 'המתנות שלכם' in capture.locator('#giftGuide').text_content();capture.close()
  # Test pages, same-name IDs, long/custom names and exact unsaved/default exclusion.
  result=game.evaluate("""async()=>{const{giftGuidePage,renderGiftGuide}=await import('/browser/gift-guide.js');const catalog=await(await fetch('/catalog.json')).json();const rules=Object.fromEntries(['9101','9072','5655','11046','6369'].map((id,i)=>['gift_'+id,{giftId:id,name:catalog.find(g=>g.id===id).name,action:'blocks',value:i+1}]));const first=giftGuidePage(rules,catalog,'en',0),second=giftGuidePage(rules,catalog,'en',6000);const node=document.createElement('section');renderGiftGuide(node,{'<img src=x onerror=alert(1)>':{action:'blocks',value:9}},catalog,'en',0);return{quake:giftGuidePage({'custom':{action:'quake',value:100}},catalog,'he',0).items[0].action,first:first.items.length,second:second.items.length,pages:first.pages,ids:first.items.slice(0,2).map(i=>i.id),names:first.items.slice(0,2).map(i=>i.name),safe:node.querySelectorAll('img').length===0&&node.textContent.includes('<img'),empty:giftGuidePage({},catalog,'en',0).items.length};}""")
  assert result=={'quake':'רעידה · הסרת 100 אבנים','first':2,'second':2,'pages':3,'ids':['9101','9072'],'names':['TikTok Universe','TikTok Universe'],'safe':True,'empty':0},result
  post('/api/config',{'gifts':{}});game.locator('#giftGuide').wait_for(state='hidden')
  post('/api/config',{'gifts':gifts,'overlay':'minimal'});game.locator('#lower').wait_for(state='hidden')
  assert not errors,errors
  print(json.dumps({'visible_actions_and_images':True,'english_hebrew':True,'capture_link':True,'two_card_rotation':True,'same_name_ids':True,'safe_custom_names':True,'empty_and_minimal_hidden':True,'scene_space_preserved':True,'page_errors':errors}))
 finally:
  post('/api/config',original);browser.close()
