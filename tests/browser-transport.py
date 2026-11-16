"""Explicit mock/soak tests only, never during a real livestream."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,time,json,urllib.request
root=Path(__file__).resolve().parents[1]
base='http://127.0.0.1:3210'
def get():
 with urllib.request.urlopen(base+'/api/state') as r:return json.load(r)
def post(route,data):
 with urllib.request.urlopen(base+'/api/session') as r:token=json.load(r)['token']
 req=urllib.request.Request(base+route,json.dumps(data).encode(),{'Content-Type':'application/json','X-Session':token},method='POST')
 with urllib.request.urlopen(req) as r:result=json.load(r)
 if result.get('commandId'):
  end=time.time()+10
  while time.time()<end:
   if get().get('commandAck',0)>=result['commandId']:break
   time.sleep(.1)
 return result
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling'])
 page=browser.new_page(viewport={'width':270,'height':480});page.goto('http://127.0.0.1:3210/browser/game.html')
 end=time.time()+25
 while time.time()<end:
  with urllib.request.urlopen('http://127.0.0.1:3210/api/state') as r:s=json.load(r)
  if s['gameOnline']:break
  time.sleep(.3)
 original=get()['config']
 try:
  post('/api/config',{'mode':'simulator','quality':'low','workers':32,'target':200,'automatic':True})
  if get()['paused']:post('/api/control',{'action':'pause'})
  post('/api/control',{'action':'restart'})
  start=get()['built']
  subprocess.run(['node','tests/adapter-integration.mjs'],cwd=root,check=True)
  time.sleep(1)
  subprocess.run(['node','tests/soak.mjs'],cwd=root,check=True)
  final=get();assert not final['paused'];assert final['built']>start or final['phase']=='celebrating'
  print(json.dumps({'active_construction':True,'built':final['built'],'phase':final['phase'],'fps':final['perf']['fps']}),flush=True)
 finally:
  post('/api/config',original)
  browser.close()
