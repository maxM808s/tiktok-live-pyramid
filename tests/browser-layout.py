from playwright.sync_api import sync_playwright
from pathlib import Path
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':540,'height':960});errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto('http://127.0.0.1:3210/browser/game.html')
 for width,height in [(540,960),(390,844),(1200,800)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(500)
  ratio=page.locator('#frame').evaluate('(el)=>el.clientWidth/el.clientHeight');assert abs(ratio-9/16)<.002,(width,height,ratio)
 page.set_viewport_size({'width':540,'height':960});page.wait_for_timeout(1000);page.screenshot(path=str(Path(__file__).resolve().parents[1]/'.local/browser-final.png'))
 assert not errors,errors
 print('PASS: game keeps 9:16 at desktop, narrow and landscape window sizes')
 browser.close()
