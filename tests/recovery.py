from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,time,json,urllib.request
root=Path(__file__).resolve().parents[1]
base='http://127.0.0.1:3210'
def get(path):
 with urllib.request.urlopen(base+path) as r:return json.load(r)
def post(path,body):
 token=get('/api/session')['token'];req=urllib.request.Request(base+path,json.dumps(body).encode(),{'Content-Type':'application/json','X-Session':token},method='POST')
 with urllib.request.urlopen(req) as r:return json.load(r)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page();page.goto(base);page.wait_for_timeout(1200)
 page.locator('#language').select_option('he');page.wait_for_timeout(1200)
 if not get('/api/state')['paused']:post('/api/control',{'action':'pause'})
 before=get('/api/state');post('/api/shutdown',{});time.sleep(1)
 log=open(root/'.local/recovery-service.log','a')
 child=subprocess.Popen(['node','server/server.mjs'],cwd=root,stdout=log,stderr=log,start_new_session=True)
 deadline=time.time()+15
 while time.time()<deadline:
  try:
   after=get('/api/state')
   if after['gameOnline']:break
  except Exception:pass
  time.sleep(.3)
 assert after['gameOnline'],'Godot did not reacquire session token'
 assert after['config']['language']=='he'
 assert after['built']+after['queue']==before['built']+before['queue'],'Pending work was lost during recovery'
 # The same open page retains its old token; changing language must recover it.
 page.wait_for_timeout(1200);page.locator('#language').select_option('en');page.wait_for_timeout(1500)
 assert get('/api/state')['config']['language']=='en','Dashboard did not reacquire token'
 if get('/api/state')['paused']:post('/api/control',{'action':'pause'})
 assert 'Recovered local checkpoint' in str(get('/api/state')['logs'])
 print('PASS: checkpoint, settings, renderer token refresh, open-dashboard token refresh')
 b.close()
