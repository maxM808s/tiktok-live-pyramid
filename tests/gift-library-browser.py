"""Gift catalog integration test. Run only with the local simulator, never a live broadcast."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,urllib.request,uuid
root=Path(__file__).resolve().parents[1];base='http://127.0.0.1:3210'
def get():
 with urllib.request.urlopen(base+'/api/state') as r:return json.load(r)
def wait(predicate,timeout=15):
 end=time.time()+timeout
 while time.time()<end:
  s=get()
  if predicate(s):return s
  time.sleep(.1)
 raise AssertionError('Game state did not update')
def post(route,data):
 with urllib.request.urlopen(base+'/api/session') as r:token=json.load(r)['token']
 req=urllib.request.Request(base+route,json.dumps(data).encode(),{'Content-Type':'application/json','X-Session':token},method='POST')
 with urllib.request.urlopen(req) as r:result=json.load(r)
 if result.get('commandId'):wait(lambda s:s.get('commandAck',0)>=result['commandId'])
 return result
original=get()['config']
# Persist before opening the owner; commands are applied once it starts.
with urllib.request.urlopen(base+'/api/session') as r:token=json.load(r)['token']
req=urllib.request.Request(base+'/api/config',json.dumps({'mode':'simulator','language':'en','quality':'low'}).encode(),{'Content-Type':'application/json','X-Session':token},method='POST');urllib.request.urlopen(req).close()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling'])
 game=browser.new_page(viewport={'width':270,'height':480});page=browser.new_page(viewport={'width':1440,'height':1100});errors=[]
 for tab in [game,page]:tab.on('pageerror',lambda error:errors.append(str(error)))
 try:
  game.goto(base+'/browser/game.html');wait(lambda s:s['gameOnline'],25)
  page.goto(base);page.locator('[data-page=gifts]').click();page.wait_for_function("document.querySelector('#giftCatalogCount').textContent.includes('314')")
  assert page.locator('.gift-card').count()==24
  page.locator('#giftSearch').fill('Rose');rose=page.locator('.gift-card[data-gift-id="5655"]');rose.wait_for();rose.locator('img').wait_for()
  page.wait_for_function("document.querySelector('[data-gift-id=\"5655\"] img').naturalWidth>0")
  rose.click();assert page.locator('#giftForm [name=giftId]').input_value()=='5655'
  page.locator('#giftForm [name=value]').fill('17');page.locator('#giftForm button.primary').click()
  wait(lambda s:s['config']['gifts'].get('gift_5655',{}).get('value')==17)
  assert get()['config']['gifts']['gift_5655']['name']=='Rose';assert 'rose' not in get()['config']['gifts']
  post('/api/control',{'action':'restart'})
  if get()['paused']:post('/api/control',{'action':'pause'})
  post('/api/sim',{'event':'gift','data':{'uniqueId':'Catalog Quantity Test','giftId':5655,'giftName':'Regional Rose Name','repeatCount':3,'giftType':1,'repeatEnd':True,'msgId':str(uuid.uuid4())}})
  wait(lambda s:(s.get('lastGift') or {}).get('giftId')=='5655')
  assert get()['built']+get()['queue']==51
  game.wait_for_function("()=>document.querySelector('#gift img')?.naturalWidth>0")
  assert '/assets/gifts/5655.webp' in game.locator('#gift img').get_attribute('src')
  # Same gift names stay separately configurable by ID.
  page.locator('#giftSearch').fill('TikTok Universe');assert page.locator('.gift-card').count()==2
  for gift_id,value in [('9101',25),('9072',75)]:
   page.locator('.gift-card[data-gift-id="'+gift_id+'"]').click();page.locator('#giftForm [name=value]').fill(str(value));page.locator('#giftForm button.primary').click();wait(lambda s:s['config']['gifts'].get('gift_'+gift_id,{}).get('value')==value)
  post('/api/control',{'action':'restart'})
  for gift_id in ['9101','9072']:post('/api/sim',{'event':'gift','data':{'uniqueId':'Same Name Gift Test','giftId':gift_id,'giftName':'TikTok Universe','repeatCount':1,'msgId':str(uuid.uuid4())}})
  assert get()['built']+get()['queue']==100
  # Filtering, image cards, and Hebrew/mobile layouts.
  page.locator('#giftSearch').fill('');page.locator('#giftPrice').select_option('large');page.locator('#giftSort').select_option('coins-desc')
  coins={g['id']:g['coins'] for g in json.loads((root/'catalog.json').read_text())}
  visible=page.locator('.gift-card').evaluate_all('(els)=>els.map(el=>el.dataset.giftId)');assert all(coins[i]>=1000 for i in visible)
  page.locator('#giftPrice').select_option('all');page.locator('#giftAssigned').select_option('yes');assert page.locator('.gift-card[data-gift-id="5655"]').count()==1
  page.screenshot(path=str(root/'.local/gift-library-en.png'),full_page=True)
  page.locator('#language').select_option('he');wait(lambda s:s['config']['language']=='he');page.wait_for_timeout(500);assert page.locator('html').get_attribute('dir')=='rtl'
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(root/'.local/gift-library-he-mobile.png'),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
  page.reload();page.wait_for_timeout(800);assert get()['config']['gifts']['gift_5655']['value']==17
  assert not errors,errors
  print(json.dumps({'catalog_count':314,'local_images':True,'search_filter_sort':True,'gift_id_save':True,'legacy_rule_migration':True,'quantity_blocks':51,'same_name_ids_separate':True,'game_overlay_image':True,'saved_mapping_retained':True,'hebrew_mobile':True,'page_errors':errors}))
 finally:
  post('/api/config',original);browser.close()
