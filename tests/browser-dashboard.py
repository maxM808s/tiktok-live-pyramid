"""Run dashboard regression while a real browser game owns the PowerShell host."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,sys,time,urllib.request,json
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling'])
 page=browser.new_page(viewport={'width':270,'height':480});page.goto('http://127.0.0.1:3210/browser/game.html')
 end=time.time()+20
 while time.time()<end:
  with urllib.request.urlopen('http://127.0.0.1:3210/api/state') as r:s=json.load(r)
  if s['gameOnline']:break
  time.sleep(.3)
 try:subprocess.run([sys.executable,str(root/'tests/browser.py')],cwd=root,check=True)
 finally:browser.close()
