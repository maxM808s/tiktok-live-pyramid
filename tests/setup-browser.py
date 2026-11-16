"""Local mock + setup UI verification; never run during a livestream."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,urllib.request,subprocess
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
 context=browser.new_context(permissions=['clipboard-read','clipboard-write']);game=context.new_page();page=context.new_page();errors=[]
 for tab in [game,page]:tab.on('pageerror',lambda e:errors.append(str(e)))
 try:
  # A display-only source must not become an engine owner, even if no game is open.
  game.goto(base+'/browser/game.html?view=1');time.sleep(2);assert not get()['gameOnline']
  game.goto(base+'/browser/game.html');wait(lambda s:s['gameOnline'])
  post('/api/config',{'mode':'simulator','liveEnabled':True,'quality':'low','language':'en'})
  page.goto(base);page.locator('#openGameSetup').click();page.locator('#gameSetupDialog[open]').wait_for()
  assert page.locator('#captureLink').input_value()==base+'/browser/game.html?view=1'
  page.locator('#copyCaptureLink').click();page.locator('#popupFeedback').filter(has_text='copied').wait_for()
  assert page.evaluate('navigator.clipboard.readText()')==base+'/browser/game.html?view=1'
  with page.expect_popup() as info:page.locator('#openGamePopup').click()
  popup=info.value;popup.wait_for_load_state();popup.wait_for_function("()=>document.body.classList.contains('spectator')")
  assert popup.title()=='Pyramid Live — Game Capture';popup.close()
  page.screenshot(path=str(root/'.local/window-setup-en.png'),full_page=True)
  page.locator('#closeGameSetup').click();page.locator('[data-page=controls]').click()
  page.locator('#connectLive').click();wait(lambda s:s['config']['mode']=='live' and s['config']['liveEnabled'])
  page.locator('#disconnectLive').click();wait(lambda s:not s['config']['liveEnabled'] and not s['connection']['socket'])
  time.sleep(2);assert get()['connection']['state']=='disconnected'
  page.reload();page.locator('[data-page=controls]').click();assert get()['config']['liveEnabled']==False
  page.locator('#reconnectLive').click();wait(lambda s:s['config']['liveEnabled'])
  subprocess.run(['node','tests/adapter-integration.mjs'],cwd=root,check=True)
  page.locator('#language').select_option('he');wait(lambda s:s['config']['language']=='he');page.locator('html[dir=rtl]').wait_for()
  page.locator('#openGameSetup').click();assert page.locator('#windowSetupTitle').text_content()=='חלון המשחק וקישור'
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(root/'.local/window-setup-he.png'),full_page=True)
  page.locator('#closeGameSetup').click();assert page.locator('#connectLive').text_content()=='חיבור'
  assert not errors,errors
  print(json.dumps({'display_only_never_claims':True,'popup':True,'link_copy':True,'connect_disconnect_reconnect':True,'persisted_disconnect':True,'mock_five_events_and_reconnect':True,'hebrew_setup':True,'mobile':True,'page_errors':errors}))
 finally:
  post('/api/config',original);browser.close()
