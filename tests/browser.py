from playwright.sync_api import sync_playwright
from pathlib import Path
import json,urllib.request,time
root=Path(__file__).resolve().parents[1];out=root/'.local';out.mkdir(exist_ok=True)
base='http://127.0.0.1:3210'
def get():
 with urllib.request.urlopen(base+'/api/state') as r:return json.load(r)
def post(route,data):
 with urllib.request.urlopen(base+'/api/session') as r:token=json.load(r)['token']
 req=urllib.request.Request(base+route,json.dumps(data).encode(),{'Content-Type':'application/json','X-Session':token},method='POST')
 with urllib.request.urlopen(req) as r:return json.load(r)
def wait_state(predicate):
 end=time.time()+12
 while time.time()<end:
  state=get()
  if predicate(state):return state
  time.sleep(.1)
 raise AssertionError('Game state did not update')
original=get()['config'];post('/api/config',{'language':'en','mode':'simulator'})
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':1200});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base);page.wait_for_function("document.querySelector('#connection').textContent.includes('SIMULATOR')")
  page.screenshot(path=str(out/'dashboard-en-v02.png'),full_page=True)
  assert page.locator('#blueprint').get_attribute('data-frame')
  paused=get()['paused'];page.locator('#quickPause').click();wait_state(lambda s:s['paused']!=paused)
  page.locator('#quickPause').click();wait_state(lambda s:s['paused']==paused)
  page.locator('[data-page=game]').click();assert page.locator('.building-card').count()==6
  page.locator('.building-card[data-building=castle]').click();assert page.locator('#gameForm [name=building]').input_value()=='castle'
  page.locator('[data-target="500"]').click();assert page.locator('#gameForm [name=target]').input_value()=='500'
  # Unsaved form edits must survive a state refresh.
  page.wait_for_timeout(1400);assert page.locator('#gameForm [name=target]').input_value()=='500'
  page.locator('[data-page=gifts]').click()
  page.locator('#giftForm [name=name]').fill('Browser Test Gift');page.locator('#giftForm [name=value]').fill('17');page.locator('#giftForm button').click()
  page.wait_for_timeout(1300);rule=page.locator('.gift-rule').filter(has_text='browser test gift');assert rule.count()==1
  rule.get_by_role('button',name='Edit',exact=True).click();assert page.locator('#giftForm [name=value]').input_value()=='17'
  rule.get_by_role('button',name='Remove',exact=True).click();page.locator('#confirmButton').click();page.wait_for_timeout(1300)
  assert 'browser test gift' not in get()['config']['gifts']
  with page.expect_download() as d:page.locator('#exportSettings').click()
  backup=out/'browser-settings-backup.json';d.value.save_as(backup);data=json.loads(backup.read_text());assert data['format']=='pyramid-live-settings';assert 'token' not in data
  page.locator('[data-page=controls]').click();page.locator('#importSettings').set_input_files(backup);page.locator('#confirmButton').click();page.wait_for_timeout(1300)
  page.locator('#simForm select[name=event]').select_option('gift');page.locator('#simForm button').click();page.wait_for_timeout(1300)
  assert 'Test Builder' in page.locator('#logs').inner_text()
  page.locator('#logSearch').fill('unlikely-no-match-123');assert page.locator('#logs').inner_text()=='No matching events.';page.locator('#logSearch').fill('')
  page.locator('#mode').select_option('live');page.wait_for_timeout(1300);assert page.locator('#simForm button').is_disabled()
  assert not page.locator('#connectionHelp').is_hidden()
  page.locator('#mode').select_option('simulator');page.wait_for_timeout(1300)
  page.locator('#language').select_option('he');page.wait_for_timeout(1300);assert page.locator('html').get_attribute('dir')=='rtl'
  page.locator('[data-page=overview]').click();page.screenshot(path=str(out/'dashboard-he-v02.png'),full_page=True)
  page.reload();page.wait_for_timeout(1300);assert page.locator('html').get_attribute('dir')=='rtl'
  page.locator('#language').select_option('en');page.wait_for_timeout(1300)
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/'dashboard-mobile-v02.png'),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
  assert not errors,errors
  print(json.dumps({'readiness':True,'six_previews':True,'quick_pause':True,'unsaved_edits_retained':True,'gift_create_edit_delete':True,'settings_export_import':True,'log_filter':True,'english_hebrew_rtl':True,'simulator_live_separation':True,'mobile_no_overflow':True,'browser_errors':errors}))
  browser.close()
finally:post('/api/config',original)
