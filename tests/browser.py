from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time
out=Path(__file__).resolve().parents[1]/'.local';out.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3210');page.wait_for_function("document.querySelector('#connection').textContent.includes('SIMULATOR')")
 page.screenshot(path=str(out/'dashboard-en.png'),full_page=True)
 page.get_by_role('button',name='Live controls',exact=True).click()
 page.locator('#simForm select[name=event]').select_option('gift')
 page.locator('#simForm button').click();page.wait_for_timeout(1200)
 assert 'Test Builder' in page.locator('#logs').inner_text()
 page.locator('#mode').select_option('live');page.wait_for_timeout(1300)
 assert page.locator('#simForm button').is_disabled()
 page.locator('#mode').select_option('simulator');page.wait_for_timeout(1200)
 page.locator('#language').select_option('he');page.wait_for_timeout(1400)
 assert page.locator('html').get_attribute('dir')=='rtl'
 page.locator('[data-page=overview]').click();page.screenshot(path=str(out/'dashboard-he.png'),full_page=True)
 page.reload();page.wait_for_timeout(1500);assert page.locator('html').get_attribute('dir')=='rtl'
 page.locator('#language').select_option('en');page.wait_for_timeout(1300)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/'dashboard-mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
 assert not errors,errors
 print(json.dumps({'english':True,'hebrew_rtl':True,'simulator':True,'live_blocks_tests':True,'language_persistence':True,'mobile_overflow':False,'browser_errors':errors}))
 browser.close()
