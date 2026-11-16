"""Explicit simulator-only regression against the PowerShell host. Dev tooling, not a player dependency."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,urllib.request,uuid
root=Path(__file__).resolve().parents[1];base='http://127.0.0.1:3210'
def get():
 with urllib.request.urlopen(base+'/api/state',timeout=10) as r:return json.load(r)
def post(route,data,wait=True):
 with urllib.request.urlopen(base+'/api/session',timeout=10) as r:token=json.load(r)['token']
 req=urllib.request.Request(base+route,json.dumps(data).encode(),{'Content-Type':'application/json','X-Session':token},method='POST')
 with urllib.request.urlopen(req,timeout=10) as r:result=json.load(r)
 if wait and result.get('commandId'):
  end=time.time()+12
  while time.time()<end:
   s=get()
   if s.get('commandAck',0)>=result['commandId']:break
   time.sleep(.15)
  else:raise AssertionError('Game did not acknowledge '+route)
 return result
original=get()['config'];post('/api/config',{'mode':'simulator','language':'en','workers':32,'quality':'low','target':20,'automatic':False},False)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding'])
 page=browser.new_page(viewport={'width':270,'height':480});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(base+'/browser/game.html');end=time.time()+20
  while time.time()<end and not get()['gameOnline']:time.sleep(.3)
  assert get()['gameOnline'],'Browser did not connect'
  assert get()['runtime']=='browser'
  # A second window must not own another game/event connection.
  observer=browser.new_page(viewport={'width':270,'height':480});observer.goto(base+'/browser/game.html');observer.wait_for_timeout(1500)
  assert observer.locator('body').get_attribute('class')=='spectator';observer.close()
  post('/api/control',{'action':'restart'})
  gift_id=str(uuid.uuid4());packet={'event':'gift','data':{'uniqueId':'Browser Runtime Test','giftName':'Rose','giftType':1,'repeatCount':3,'repeatEnd':True,'msgId':gift_id}}
  before=get()['metrics']['accepted'];post('/api/sim',packet);post('/api/sim',packet)
  assert get()['metrics']['accepted']==before+1;assert get()['metrics']['duplicates']>=1
  print('PASS browser owner lease, simulator gift quantity, duplicate ID',flush=True)
  for building in ['pyramid','temple','castle','lighthouse','obelisk','ziggurat']:
   post('/api/config',{'building':building,'target':20,'automatic':False})
   post('/api/control',{'action':'restart'})
   post('/api/sim',{'event':'gift','data':{'uniqueId':'Browser Runtime Test','giftName':'Rose','giftType':1,'repeatCount':2,'repeatEnd':True,'msgId':str(uuid.uuid4())}})
   end=time.time()+110
   while time.time()<end:
    s=get()
    if s['phase']=='celebrating' and s['perf'].get('visualComplete') and s['perf'].get('round')==s['round']:break
    if not page.locator('#error').is_hidden():raise AssertionError(page.locator('#error').inner_text())
    time.sleep(.4)
   else:raise AssertionError('Did not finish '+building)
   print('PASS browser rendered complete:',building,flush=True)
   if building=='pyramid':page.screenshot(path=str(root/'.local/browser-pyramid-complete.png'))
  old_round=get()['round'];post('/api/config',{'automatic':True,'celebration':5});end=time.time()+20
  while time.time()<end and get()['round']==old_round:time.sleep(.3)
  assert get()['round']>old_round,'Automatic rotation'
  post('/api/config',{'language':'he'});page.wait_for_timeout(600);assert page.locator('html').get_attribute('dir')=='rtl'
  page.screenshot(path=str(root/'.local/browser-game-he.png'))
  assert not errors,errors
  print('PASS browser automatic rotation, Hebrew HUD, no page errors',flush=True)
 finally:
  post('/api/config',original,False);browser.close()
