"""Close-time checkpoint and dashboard exit. Windows CI covers supervisor cleanup."""
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
 game=browser.new_page();page=browser.new_page();errors=[]
 for tab in [game,page]:tab.on('pageerror',lambda e:errors.append(str(e)))
 try:
  game.goto(base+'/browser/game.html');wait(lambda s:s['gameOnline'])
  post('/api/config',{'mode':'simulator','quality':'low','language':'he'})
  post('/api/control',{'action':'restart'})
  post('/api/sim',{'event':'follow','data':{'uniqueId':'Close Checkpoint Test','msgId':str(time.time())}})
  before=get()['built']+get()['queue'];assert before>0
  capture=browser.new_page();capture.goto(base+'/browser/game.html?view=1');capture.close();assert get()['gameOnline']
  game.close();time.sleep(1)
  saved=json.loads((root/'.local/checkpoint-simulator.json').read_text(encoding='utf-8-sig'))
  assert saved['built']+sum(j['remaining'] for j in saved['queue'])==before
  game=browser.new_page();game.goto(base+'/browser/game.html');wait(lambda s:s['gameOnline'],25)
  page.goto(base);page.locator('html[dir=rtl]').wait_for();assert page.locator('#exitGame').text_content()=='יציאה מהמשחק'
  post('/api/config',original)
  page.locator('.session-menu summary').click();page.locator('#exitGame').click();page.locator('#confirmDialog[open]').wait_for();page.locator('#confirmButton').click()
  page.locator('#connection').filter(has_text='ended').wait_for() if original['language']=='en' else page.locator('#connection').filter(has_text='הסתיים').wait_for()
  end=time.time()+10;stopped=False
  while time.time()<end:
   try:get()
   except Exception:stopped=True;break
   time.sleep(.2)
  assert stopped;assert not errors,errors
  print(json.dumps({'capture_close_keeps_game':True,'final_checkpoint_saved':True,'reload_can_reclaim':True,'hebrew_exit':True,'dashboard_exit_stops_service':True,'page_errors':errors}))
 finally:browser.close()
