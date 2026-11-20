"""Simplified streaming dashboard and gameplay HUD regression, using test events only."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,urllib.request
root=Path(__file__).resolve().parents[1];base='http://127.0.0.1:3210'
def get():
 with urllib.request.urlopen(base+'/api/state') as r:return json.load(r)
def wait(fn,timeout=20):
 end=time.time()+timeout
 while time.time()<end:
  s=get()
  if fn(s):return s
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
 game=browser.new_page(viewport={'width':540,'height':960});page=browser.new_page(viewport={'width':1440,'height':1050});errors=[]
 for tab in [game,page]:tab.on('pageerror',lambda e:errors.append(str(e)))
 try:
  game.goto(base+'/browser/game.html');wait(lambda s:s['gameOnline'])
  post('/api/config',{'mode':'simulator','quality':'low','language':'en','overlay':'full'})
  page.goto(base);page.locator('.start-steps').wait_for()
  page.locator('#gameReady').filter(has_text='Running').wait_for();assert page.locator('.start-steps button').count()==3
  page.screenshot(path=str(root/'.local/studio-home-en.png'),full_page=True)
  page.locator('[data-go=gifts]').click();assert page.locator('#pageTitle').text_content()=='Gift actions'
  assert not page.locator('#giftEditorDialog').is_visible();assert page.locator('#giftRules').is_visible()
  page.wait_for_function("()=>[...document.querySelectorAll('#giftRules img')].every(i=>i.naturalWidth>0)")
  page.screenshot(path=str(root/'.local/studio-gifts-en.png'),full_page=True)
  page.locator('#addGift').click();page.locator('#giftSearch').fill('Rose')
  page.locator('[data-gift-id="5655"]').click();page.locator('#giftForm [name=value]').fill('23');page.locator('#giftForm button.primary').click()
  page.locator('#giftEditorDialog').wait_for(state='hidden');wait(lambda s:s['config']['gifts'].get('gift_5655',{}).get('value')==23)
  rule=page.locator('.gift-rule').filter(has_text='Rose');rule.get_by_role('button',name='Edit',exact=True).click();assert page.locator('#giftForm [name=value]').input_value()=='23';page.locator('#selectedGift strong').filter(has_text='Rose').wait_for()
  page.screenshot(path=str(root/'.local/studio-gift-editor-en.png'),full_page=True)
  page.locator('#closeGiftEditor').click()
  page.locator('[data-page=game]').click();assert page.locator('.building-card').count()==6
  assert not page.locator('#gameForm [name=likesPerWorker]').is_visible()
  page.locator('summary[data-i=advancedActions]').click();page.locator('#gameForm [name=likesPerWorker]').fill('8');page.wait_for_timeout(1200);assert page.locator('#gameForm [name=likesPerWorker]').input_value()=='8'
  page.locator('[data-page=controls]').click();assert not page.locator('#health').is_visible()
  page.locator('summary[data-i=diagnostics]').click();assert page.locator('#health').is_visible()
  assert not page.locator('#logSearch').is_visible();page.locator('summary[data-i=eventHistory]').click();page.locator('#logSearch').fill('test')
  post('/api/config',{'gifts':{'gift_5655':{'giftId':'5655','name':'Rose','action':'blocks','value':23},'galaxy':{'action':'boost','value':50}}});post('/api/control',{'action':'restart'});post('/api/sim',{'event':'gift','data':{'uniqueId':'Studio Boost Test','giftName':'Galaxy','repeatCount':1,'msgId':str(time.time())}});game.locator('#roundObjective').filter(has_text='4× BUILD BOOST').wait_for();assert game.locator('#roundObjective').get_attribute('class').find('boost-active')>=0
  post('/api/control',{'action':'restart'});game.locator('#roundObjective span').wait_for();game.screenshot(path=str(root/'.local/studio-game-en.png'))
  post('/api/config',{'language':'he'});page.locator('html[dir=rtl]').wait_for();page.locator('[data-page=overview]').click();page.screenshot(path=str(root/'.local/studio-home-he.png'),full_page=True)
  assert page.locator('#pageDescription').text_content().startswith('כל מה')
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(root/'.local/studio-home-mobile-he.png'),full_page=True)
  page.locator('[data-page=gifts]').click();page.locator('#addGift').click();page.locator('#giftSearch').fill('Galaxy');page.locator('[data-gift-id="11046"]').click()
  assert page.evaluate('document.querySelector("#giftEditorDialog").scrollWidth<=document.querySelector("#giftEditorDialog").clientWidth')
  page.screenshot(path=str(root/'.local/studio-gifts-mobile-he.png'),full_page=True)
  page.locator('#closeGiftEditor').click();game.locator('html[dir=rtl]').wait_for();assert any(word in game.locator('#roundObjective').text_content() for word in ['אבנים','האצה'])
  assert not errors,errors
  print(json.dumps({'three_step_home':True,'active_gifts_first':True,'focused_gift_popup':True,'save_edit':True,'advanced_round_settings':True,'collapsed_diagnostics_and_logs':True,'unsaved_edits_preserved':True,'english_hebrew':True,'mobile_no_overflow':True,'objective_hud':True,'real_boost_hud':True,'page_errors':errors}))
 finally:
  post('/api/config',original);browser.close()
