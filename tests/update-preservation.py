"""Verify the Git mechanism used by Desktop/Update-Game; not a Windows UI test."""
from pathlib import Path
import tempfile,subprocess
with tempfile.TemporaryDirectory(prefix='pyramid-update-') as d:
 p=Path(d);remote=p/'origin.git';author=p/'author';install=p/'installed game'
 def git(cwd,*args):return subprocess.check_output(['git',*args],cwd=cwd,stderr=subprocess.STDOUT,text=True)
 git(p,'init','--bare',str(remote));git(p,'clone',str(remote),str(author));git(author,'config','user.name','Test');git(author,'config','user.email','test@example.invalid')
 (author/'.gitignore').write_text('.local/\n');(author/'version.txt').write_text('one');git(author,'add','.');git(author,'commit','-m','initial');git(author,'push','origin','HEAD');git(p,'clone',str(remote),str(install))
 (install/'.local').mkdir();settings=install/'.local/settings.json';settings.write_text('{"language":"he","gifts":{"rose":42}}')
 (author/'version.txt').write_text('two');git(author,'commit','-am','update');git(author,'push');git(install,'pull','--ff-only')
 assert settings.read_text()=='{"language":"he","gifts":{"rose":42}}';assert (install/'version.txt').read_text()=='two';assert git(install,'status','--porcelain')==''
 print('PASS: fast-forward Git pull preserves ignored local settings, including clone path with spaces')
