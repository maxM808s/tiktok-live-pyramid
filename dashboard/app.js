import {drawBlueprint} from './blueprint.js';
import {loadGiftCatalog,findGift,configuredGift,filterGifts,giftImage} from './gift-library.js';
const $ = selector => document.querySelector(selector);
let token='', state, page='overview', editGift='', toastTimer;
const dirty=new Set();
let giftCatalog=[],catalogReady=false,catalogError='',giftPage=0,selectedGift=null,giftSaving=false;
const giftsPerPage=12;
const he={likesPerWorker:'לייקים לכל פועל / אבן',commentBlocks:'אבנים לכל תגובה',followBlocks:'אבנים לכל עוקב',shareBlocks:'אבנים לכל שיתוף',skin:'מראה הפועלים',overlay:'פריסת שכבת השידור',workspace:'סביבת עבודה',overview:'סקירה',game:'הגדרות משחק',gifts:'ניהול מתנות',visual:'הגדרות תצוגה',controls:'שליטה בשידור',language:'שפה',broadcast:'השידור שלך, בשליטה מלאה',hero:'קהילה אחת. אלפי אבנים.\nבונים יחד משהו שיישאר.',progress:'התקדמות הבנייה',workers:'פועלים פעילים',performance:'ביצועי המשחק',activity:'פעילות אחרונה',leaders:'התורמים המובילים',roundSettings:'מכינים את הסיבוב הבא',building:'מבנה',blocks:'מספר האבנים הנדרש (רמת קושי)',timing:'ספירה לאחור לחגיגה (שניות)',automatic:'התחלה אוטומטית של הסיבוב הבא',save:'שמירת הגדרות',apply:'בחירת המבנה ורמת הקושי יחולו בסיבוב הבא. להתחלה מיידית השתמשו בהתחלה מחדש. ההצבעות קובעות את המבנה הבא; ללא הצבעות המבנים מתחלפים לפי הסדר.',giftRules:'כל מתנה בונה',giftNote:'בחרו מהספרייה לשיוך לפי מזהה המתנה, או הגדירו שם מותאם. מתנות ללא כלל יירשמו בלבד.',giftName:'שם המתנה',action:'פעולה',value:'אבנים לכל מתנה',saveRule:'שמירת כלל',visualTitle:'יוצרים אווירה',quality:'איכות גרפית',maxWorkers:'מספר פועלים מרבי',camera:'מצלמה קולנועית',night:'מעברי יום ולילה',mode:'מקור אירועים',modeNote:'במצב שידור חי כל אירועי הבדיקה חסומים. חיבור מקומי תקין אינו מאשר שהשידור ב-TikTok פעיל.',pause:'השהיה / המשך',restart:'התחלת סיבוב מחדש',health:'תקינות החיבור',simulator:'סימולטור אירועים מקומי',username:'שם הצופה',event:'אירוע',quantity:'כמות מתנות',comment:'תגובה / הצבעה למבנה',test:'שליחת אירוע בדיקה',logs:'יומן אירועים'};
Object.assign(he,{
  sessionControls:'שליטה בסיבוב',connectionSetup:'הגדרת חיבור',backupSettings:'גיבוי הגדרות',gameWindow:'חלון המשחק',eventSource:'מקור אירועים',roundFlow:'רצף סיבובים',connectTitle:'ממתינים ל-TikFinity Desktop',connectHelp:'פתחו את TikFinity במחשב הזה וחברו אותו לשידור. המשחק מתחבר מחדש באופן אוטומטי. בדקו אירוע אמיתי לפני השארת המשחק ללא השגחה.',nextWonder:'הפלא הבא מתחיל כאן',blueprintPreview:'תצוגת תוכנית בנייה · אינה צילום של המשחק',difficulty:'רמת קושי',quickRound:'מהיר · 100',standardRound:'רגיל · 200',epicRound:'גדול · 500',manage:'ניהול',downloadLogs:'הורדת יומן',filterLogs:'סינון אירועים',restoreSettings:'שחזור הגדרות',restoreNote:'ייבוא קובץ הגדרות של המשחק. ההגדרות הנוכחיות נשמרות כעותק שחזור לפני שינוי.',chooseBackup:'בחירת גיבוי JSON',footer:'שליטה מקומית. יצירה משותפת.',cancel:'ביטול'
});
Object.assign(he,{giftLibrary:'ספריית מתנות',giftLibraryNote:'בחרו מתנה מהספרייה המשותפת, הגדירו פעולה ושמרו. התמונות כלולות מקומית.',searchGifts:'חיפוש מתנות לפי שם או מזהה',coinRange:'טווח מטבעות',allCoins:'כל ערכי המטבעות',giftStatus:'מצב',allGifts:'כל המתנות',assignedGifts:'משויכות',unassignedGifts:'ללא שיוך',sortGifts:'מיון',coinsLow:'מטבעות: מהנמוך לגבוה',coinsHigh:'מטבעות: מהגבוה לנמוך',giftNameSort:'שם',previous:'הקודם',next:'הבא',priceSnapshot:'ערכי המטבעות מיובאים מהספרייה ועשויים להשתנות ב-TikTok. רק כללים שנשמרו מפעילים פעולות.',configuredGifts:'פעולות מתנות שהוגדרו',customGift:'שימוש בשם מתנה מותאם',giftId:'מזהה מתנה',giftIdOptional:'מזהה מתנה (רשות)'});
Object.assign(he,{windowSetup:'חלון המשחק וקישור',desktopApi:'אותו חיבור מקומי כמו במשחקים האחרים שלכם',desktopTitle:'TikFinity Desktop',desktopSteps:'פתחו את TikFinity Desktop וחברו שם את שידור ה-TikTok LIVE. לאחר מכן לחצו כאן על חיבור. אשרו גישה לרשת המקומית אם הדפדפן מבקש. אין צורך להזין סיסמת TikTok במשחק.',connectLive:'חיבור',reconnectLive:'חיבור מחדש',disconnectLive:'ניתוק',socketNote:'חיבור תקין מאשר רק שה-API המקומי זמין. בדקו אירוע אמיתי מצופה לפני השארת השידור ללא השגחה.',closeSetup:'סגירה',windowIntro:'פתחו חלון משחק אנכי נפרד לצילום ב-LIVE Studio. השאירו את חלון המשחק הראשי פועל בזמן השימוש בלוח הבקרה.',popupSize:'גודל חלון המשחק',openGamePopup:'פתיחת חלון משחק',directGameLink:'פתיחת המשחק בלשונית',studioLink:'מקור קישור ב-LIVE Studio',captureLink:'קישור מקומי לתצוגה בלבד',copyCaptureLink:'העתקת קישור',openCaptureLink:'תצוגה מקדימה של הקישור',captureStep1:'לצילום חלון בחרו ב-LIVE Studio את “⁦Pyramid Live — Game Capture⁩”.',captureStep2:'למקור קישור הדביקו את הקישור והגדירו גודל של ⁦1080 × 1920⁩ כאשר האפשרות זמינה.',captureStep3:'הקישור פועל במחשב הזה כל עוד ⁦Start-Game.cmd⁩ פועל. הוא אינו יוצר חיבור ניקוד נוסף. אם LIVE Studio אינו טוען קישור מקומי, השתמשו בצילום חלון.'});
Object.assign(he,{exitGame:'יציאה מהמשחק'});
Object.assign(he,{overview:'בית השידור',game:'סיבובים',gifts:'פעולות מתנות',visual:'מראה המשחק',controls:'חיבור ובדיקות',moreActions:'עוד',startHere:'מתחילים כאן',readyInThree:'השידור שלכם בשלושה צעדים',localOnly:'במחשב הזה',stepWindow:'פתיחת המשחק',stepWindowHelp:'פתחו חלון משחק או העתיקו קישור ל-LIVE Studio.',stepConnect:'חיבור TikFinity',stepConnectHelp:'חברו את השידור ב-TikFinity ולחצו כאן על חיבור.',stepGifts:'בחירת פעולות מתנות',stepGiftsHelp:'קבעו מה כל מתנה עושה. הפעולות מופיעות גם במשחק.',nextWonder:'הסיבוב הנוכחי',giftRules:'מה המתנות עושות במשחק שלכם',giftNote:'אלה פעולות המתנות הפעילות שלכם. הן מוצגות גם בשידור. אפשר להוסיף מתנה או לערוך פעולה.',addGift:'+ הוספת פעולת מתנה',giftEditorEyebrow:'פעולת מתנה',giftEditorTitle:'בוחרים מתנה. קובעים מה יקרה.',setAction:'הגדרת הפעולה',setActionHelp:'בחרו מתנה מהספרייה, הגדירו מספר אבנים ושמרו. השינוי יופיע במשחק.',advancedActions:'מתקדם: לייקים, תגובות ומעקבים',diagnostics:'אבחון החיבור',eventHistory:'היסטוריית אירועים',technicalDetails:'פרטי החיבור הטכניים',broadcast:'PYRAMID LIVE · לוח הבקרה',workspace:'השידור שלכם',roundSettings:'בחירת הסיבוב הבא',visualTitle:'איך המשחק נראה',giftLibrary:'בחירת מתנה',giftLibraryNote:'1. חפשו או בחרו מתנה מהספרייה.',desktopSteps:'1. פתחו את TikFinity Desktop וחברו את שידור ה-TikTok LIVE. 2. לחצו על חיבור. 3. בדקו שאירוע מצופה אמיתי מגיע למשחק.',modeNote:'מצב תרגול משתמש באירועי בדיקה. מצב שידור חי משתמש בצופים אמיתיים וחוסם בדיקות. לכל מצב נשמרת התקדמות נפרדת.',simulator:'בדיקת אירוע',saveRule:'שמירת פעולה'});
const descriptions={en:{overview:'Everything you need to prepare and watch your stream.',gifts:'Choose which gifts add stones, boost construction, or cause an earthquake.',game:'Pick a building and how much work completes a round.',visual:'Adjust graphics, workers and what viewers see on screen.',controls:'Connect real viewer events or practice safely with test events.'},he:{overview:'כל מה שצריך להכנת השידור ולמעקב אחר המשחק.',gifts:'בחרו אילו מתנות מוסיפות אבנים, מאיצות בנייה או יוצרות רעידת אדמה.',game:'בחרו מבנה ואת כמות העבודה הדרושה להשלמת סיבוב.',visual:'הגדירו גרפיקה, פועלים ומה הצופים רואים בשידור.',controls:'חברו אירועי צופים אמיתיים או תרגלו עם אירועי בדיקה.'}};
function pageDescription(){$('#pageDescription').textContent=descriptions[document.documentElement.lang==='he'?'he':'en'][page];}
const english=new Map([...document.querySelectorAll('[data-i]')].map(el=>[el,el.textContent]));
for(const form of document.querySelectorAll('form'))for(const field of form.elements){
  if(!field.name)continue;if(!field.id)field.id=(form.id||'dialog')+'-'+field.name;
  const label=field.previousElementSibling;if(label?.tagName==='LABEL')label.htmlFor=field.id;
}
const englishOptions=new Map([...document.querySelectorAll('select:not(#language):not(#giftPrice):not(#giftAssigned):not(#giftSort) option')].map(option=>{option.setAttribute('value',option.value);return [option,option.textContent];}));
const optionHebrew={high:'גבוהה · צללים ואבק',low:'נמוכה · ללא צללים ואבק',mixed:'תלבושות מעורבות',worker:'פועל',mummy:'מומיה',ninja:'נינג׳ה',pharaoh:'פרעה',full:'מלאה · הוראות, מתנות ומובילים',minimal:'מצומצמת · סצנה והתקדמות',simulator:'סימולטור — בדיקות בלבד',live:'שידור חי — TikFinity Free',blocks:'הוספת אבנים',boost:'האצת בנייה + אבנים',quake:'רעידת אדמה: הסרת אבנים',like:'לייקים',chat:'תגובה / הצבעה',follow:'מעקב',share:'שיתוף',gift:'מתנה'};
const titles={en:{pyramid:'Egyptian Pyramid',temple:'Ancient Temple',castle:'Medieval Castle',lighthouse:'Lighthouse',obelisk:'Obelisk',ziggurat:'Ziggurat'},he:{pyramid:'הפירמידה המצרית',temple:'המקדש העתיק',castle:'טירת ימי הביניים',lighthouse:'המגדלור',obelisk:'האובליסק',ziggurat:'הזיגוראת'}};
const icons={pyramid:'△',temple:'Π',castle:'♜',lighthouse:'♟',obelisk:'▴',ziggurat:'▰'};
const text=(en,heb)=>document.documentElement.lang==='he'?heb:en;
function language(lang){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';
  for(const[el,value]of english)el.textContent=lang==='he'?(he[el.dataset.i]||value):value;
  for(const[option,value]of englishOptions)option.textContent=lang==='he'?(titles.he[option.value]||optionHebrew[option.value]||value):(titles.en[option.value]||value);
  $('#giftForm [name=giftId]').placeholder=text('Choose from the library','בחירה מהספרייה');
  $('#pageTitle').textContent=$(`[data-page="${page}"]`).textContent;pageDescription();
}
function navigate(next){
  page=next;
  for(const section of document.querySelectorAll('.page'))section.hidden=section.id!==next;
  for(const button of document.querySelectorAll('[data-page]')){button.classList.toggle('active',button.dataset.page===next);button.setAttribute('aria-current',button.dataset.page===next?'page':'false');}
  $('#pageTitle').textContent=$(`[data-page="${next}"]`).textContent;pageDescription();
}
async function api(route,data){
  if(!token)token=(await(await fetch('/api/session')).json()).token;
  const send=()=>fetch(route,{method:'POST',headers:{'Content-Type':'application/json','X-Session':token},body:JSON.stringify(data),signal:AbortSignal.timeout(5000)});
  let response=await send();
  if(response.status===403){token=(await(await fetch('/api/session')).json()).token;response=await send();}
  const result=await response.json();if(!response.ok)throw Error(result.error);
  if(result.commandId){
    const end=Date.now()+5000;
    while(Date.now()<end){const current=await(await fetch('/api/state',{signal:AbortSignal.timeout(4000)})).json();if(current.commandAck>=result.commandId||!current.gameOnline)break;await new Promise(resolve=>setTimeout(resolve,100));}
  }
  return result;
}
function feedback(message,error=false){
  clearTimeout(toastTimer);$('#feedback').textContent=message;$('#feedback').classList.toggle('error',error);
  toastTimer=setTimeout(()=>$('#feedback').textContent='',6500);
}
function guarded(fn,message){return async event=>{
  event?.preventDefault();const button=event?.submitter||(event?.currentTarget?.tagName==='BUTTON'?event.currentTarget:null);
  if(button)button.disabled=true;
  try{await fn(event);await refresh();if(message!==false)feedback(message||text('Saved successfully','נשמר בהצלחה'));}
  catch(error){feedback(error.message,true);}finally{if(button)button.disabled=false;}
};}
function confirmAction(title,body,action){
  return new Promise(resolve=>{const dialog=$('#confirmDialog');$('#confirmTitle').textContent=title;$('#confirmBody').textContent=body;$('#confirmButton').textContent=action;dialog.returnValue='cancel';dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});dialog.showModal();});
}
function download(name,value){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function element(tag,content,className){const el=document.createElement(tag);if(content!==undefined)el.textContent=content;if(className)el.className=className;return el;}
for(const button of document.querySelectorAll('[data-page]'))button.onclick=()=>navigate(button.dataset.page);
for(const button of document.querySelectorAll('[data-go]'))button.onclick=()=>{if(button.dataset.go==='window')$('#openGameSetup').click();else navigate(button.dataset.go);};
$('#addGift').onclick=()=>{editGift='';selectedGift=null;$('#giftForm').reset();$('#selectedGift').dataset.key='';renderSelectedGift();$('#giftEditorDialog').showModal();$('#giftSearch').focus();};
$('#closeGiftEditor').onclick=()=>$('#giftEditorDialog').close();
let sessionEnded=false;
$('#exitGame').onclick=guarded(async()=>{if(!await confirmAction(text('Exit the game?','לצאת מהמשחק?'),text('Save progress and close the local game. Double-click Start-Game.cmd to play again.','שמירת ההתקדמות וסגירת המשחק המקומי. להפעלה מחדש לחצו פעמיים על Start-Game.cmd.'),text('Exit game','יציאה מהמשחק')))return;await api('/api/exit',{});sessionEnded=true;$('#connection').textContent=text('Session ended','המשחק הסתיים');feedback(text('Game stopped. Close this dashboard when ready.','המשחק נעצר. אפשר לסגור את לוח הבקרה.'));},false);
$('#connectLive').onclick=guarded(()=>api('/api/config',{mode:'live',liveEnabled:true}),false);
$('#disconnectLive').onclick=guarded(()=>api('/api/config',{liveEnabled:false}),false);
$('#reconnectLive').onclick=guarded(async()=>{await api('/api/config',{mode:'live',liveEnabled:true});await api('/api/control',{action:'reconnect'});},false);
const captureURL=new URL('/browser/game.html?view=1',location.origin).href;
$('#captureLink').value=captureURL;$('#openCaptureLink').href=captureURL;
$('#openGameSetup').onclick=()=>{$('#popupFeedback').textContent='';$('#gameSetupDialog').showModal();};
$('#closeGameSetup').onclick=()=>$('#gameSetupDialog').close();
let gamePopup;
$('#openGamePopup').onclick=()=>{
 const [w,h]=$('#popupSize').value.split(',').map(Number),height=Math.min(h,Math.max(360,screen.availHeight-80)),width=Math.min(w,Math.round(height*9/16));
 gamePopup=window.open('/browser/game.html','pyramid-game-capture','popup=yes,width='+width+',height='+height+',menubar=no,toolbar=no');
 $('#popupFeedback').textContent=gamePopup?text('Game window opened. Select Pyramid Live — Game Capture in LIVE Studio Window Capture.','חלון המשחק נפתח. בחרו Pyramid Live — Game Capture במקור צילום חלון ב-LIVE Studio.'):text('Popup blocked. Allow popups for this local site, or use Open game in a tab.','החלון נחסם. אשרו חלונות קופצים לאתר המקומי או פתחו את המשחק בלשונית.');
 if(gamePopup)gamePopup.focus();
};
$('#copyCaptureLink').onclick=async()=>{try{await navigator.clipboard.writeText(captureURL);$('#popupFeedback').textContent=text('Link copied. Paste it into LIVE Studio on this PC.','הקישור הועתק. הדביקו אותו ב-LIVE Studio במחשב הזה.');}catch{$('#captureLink').focus();$('#captureLink').select();$('#popupFeedback').textContent=text('Press Ctrl+C to copy the selected link.','לחצו Ctrl+C להעתקת הקישור המסומן.');}};
for(const id of ['openControls','helpControls'])$('#'+id).onclick=()=>navigate('controls');
for(const form of document.querySelectorAll('form:not([method=dialog])'))form.addEventListener('input',()=>dirty.add(form.id));
for(const id of ['gameForm','visualForm'])$('#'+id).onsubmit=guarded(async()=>{
  const data={};for(const field of $('#'+id).elements){if(field.name)data[field.name]=field.type==='checkbox'?field.checked:field.type==='number'?Number(field.value):field.value;}
  await api('/api/config',data);dirty.delete(id);
});
$('#language').onchange=guarded(()=>api('/api/config',{language:$('#language').value}));
$('#mode').onchange=guarded(()=>api('/api/config',{mode:$('#mode').value}));
for(const id of ['pause','quickPause'])$('#'+id).onclick=guarded(()=>api('/api/control',{action:'pause'}),false);
$('#restart').onclick=guarded(async()=>{
  if(await confirmAction(text('Restart this round?','להתחיל את הסיבוב מחדש?'),text('Current construction and queued stones will be cleared. Your settings and session leaderboard will stay saved.','התקדמות הבנייה והאבנים שבתור יימחקו. ההגדרות וטבלת המובילים נשמרות.'),text('Restart round','התחלת סיבוב מחדש')))await api('/api/control',{action:'restart'});
},false);
function updateActionHelp(){const action=$('#giftForm [name=action]').value;$('#giftActionHelp').textContent=action==='boost'?text('Builds 4× faster for 15 seconds and adds these stones.','בנייה מהירה פי 4 למשך 15 שניות והוספת האבנים שהוגדרו.'):action==='quake'?text('Removes built stones, up to 100 per event. Does not delete queued work.','מסיר אבנים שכבר נבנו, עד 100 לאירוע. העבודה שבתור אינה נמחקת.'):text('Adds this many stones for every gift in the completed quantity.','מוסיף את מספר האבנים שהוגדר לכל מתנה בכמות שהושלמה.');}
$('#giftForm [name=action]').addEventListener('change',updateActionHelp);
$('#giftForm').onsubmit=guarded(async()=>{
  const values=Object.fromEntries(new FormData($('#giftForm'))),gifts={...state.config.gifts};
  if(editGift)delete gifts[editGift];
  const id=values.giftId.trim(),key=id?'gift_'+id:values.name.trim().toLowerCase();
  gifts[key]={action:values.action,value:Number(values.value),...(id?{giftId:id,name:values.name.trim()}:{})};
  giftSaving=true;renderGiftLibrary();$('#customGift').disabled=true;
  try{await api('/api/config',{gifts});editGift='';selectedGift=null;dirty.delete('giftForm');$('#giftForm').reset();renderSelectedGift();$('#giftEditorDialog').close();await refresh();}
  finally{giftSaving=false;$('#customGift').disabled=false;renderGiftLibrary();}
});
$('#simForm').onsubmit=guarded(async()=>{
  const values=Object.fromEntries(new FormData($('#simForm')));
  const candidates=giftCatalog.filter(g=>g.name.toLowerCase()===values.giftName.toLowerCase());
  const giftId=values.giftId||(candidates.length===1?candidates[0].id:'');
  await api('/api/sim',{event:values.event,data:{...values,giftId,likeCount:state.config.likesPerWorker,repeatCount:Number(values.repeatCount),giftType:1,repeatEnd:true,msgId:crypto.randomUUID()}});
},text('Test event sent to the game','אירוע בדיקה נשלח למשחק'));
$('#exportSettings').onclick=()=>{if(state)download('pyramid-live-settings.json',{format:'pyramid-live-settings',version:1,settings:state.config});};
$('#exportLogs').onclick=()=>{if(state)download('pyramid-live-event-log.json',state.logs);};
$('#importSettings').onchange=guarded(async()=>{
  const file=$('#importSettings').files[0];if(!file)return;if(file.size>65536)throw Error(text('Backup must be smaller than 64 KB','גודל הגיבוי חייב להיות קטן מ-64 KB'));
  try{const data=JSON.parse(await file.text());if(data.format!=='pyramid-live-settings'||data.version!==1||!data.settings)throw Error(text('Choose a Pyramid Live settings backup','יש לבחור קובץ גיבוי של Pyramid Live'));
    if(await confirmAction(text('Restore these settings?','לשחזר הגדרות?'),text('This replaces current game and gift settings. A local recovery copy is kept.','הגדרות המשחק והמתנות יוחלפו. עותק שחזור מקומי יישמר.'),text('Restore settings','שחזור הגדרות'))){await api('/api/config',data.settings);dirty.clear();}
  }finally{$('#importSettings').value='';}
});
for(const button of document.querySelectorAll('[data-target]'))button.onclick=()=>{$('#gameForm [name=target]').value=button.dataset.target;dirty.add('gameForm');renderSelection();};
function renderSelection(){
  for(const button of document.querySelectorAll('.building-card')){const selected=button.dataset.building===$('#gameForm [name=building]').value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
  for(const button of document.querySelectorAll('[data-target]'))button.classList.toggle('selected',Number(button.dataset.target)===Number($('#gameForm [name=target]').value));
}
$('#gameForm [name=building]').addEventListener('change',renderSelection);
$('#gameForm [name=target]').addEventListener('input',renderSelection);
function renderPicker(){
  const lang=document.documentElement.lang,key=lang;
  if($('#buildingPicker').dataset.lang===key){renderSelection();return;}
  $('#buildingPicker').dataset.lang=key;
  $('#buildingPicker').replaceChildren(...Object.keys(titles.en).map(kind=>{
    const button=element('button',undefined,'building-card');button.type='button';button.dataset.building=kind;button.append(element('span',icons[kind],'building-icon'),element('span',titles[lang][kind]));
    button.onclick=()=>{$('#gameForm [name=building]').value=kind;dirty.add('gameForm');renderSelection();};return button;
  }));renderSelection();
}
function renderGiftRules(s){
  const signature=JSON.stringify([s.config.gifts,s.config.mode,s.config.language,giftCatalog.length]);
  if($('#giftRules').dataset.signature===signature)return;$('#giftRules').dataset.signature=signature;
  $('#giftRules').replaceChildren(...Object.entries(s.config.gifts).map(([name,rule])=>{
    const gift=findGift(giftCatalog,rule.giftId,rule.name||name);
    const displayName=rule.name||gift?.name||name;
    const row=element('div',undefined,'gift-rule'),title=element('div',undefined,'gift-name');title.append(gift?giftImage(gift):element('span','◇','avatar-initial'),element('bdi',displayName));if(rule.giftId)title.append(element('small','ID '+rule.giftId,'gift-rule-id'));
    const amount=rule.action==='quake'?Math.min(100,rule.value):rule.value;
    const value=element('div',(rule.action==='quake'?'−':'+')+amount+' '+text('stones / gift','אבנים / מתנה'),'gift-action-value');
    value.append(element('small',({blocks:text('Golden construction','בנייה מוזהבת'),boost:text('15 second boost','האצה ל-15 שניות'),quake:text('Earthquake','רעידת אדמה')})[rule.action]));
    const actions=element('div',undefined,'gift-actions');
    const preview=element('button',text('Test','בדיקה'));preview.disabled=s.config.mode==='live';preview.title=text('Sends a practice gift. Available in simulator mode only.','שולח מתנת בדיקה. זמין במצב סימולטור בלבד.');preview.onclick=guarded(()=>api('/api/sim',{event:'gift',data:{uniqueId:'Gift Preview',giftName:displayName,giftId:rule.giftId||gift?.id||'',repeatCount:1,giftType:1,repeatEnd:true,msgId:crypto.randomUUID()}}),false);
    const edit=element('button',text('Edit','עריכה'));edit.onclick=()=>{$('#giftEditorDialog').showModal();editGift=name;selectedGift=gift||null;renderSelectedGift();for(const[k,v]of Object.entries({name:displayName,giftId:rule.giftId||'',action:rule.action,value:rule.value}))$('#giftForm [name='+k+']').value=v;dirty.add('giftForm');$('#giftForm [name=value]').focus();};
    const remove=element('button',text('Remove','הסרה'),'remove-rule');remove.onclick=guarded(async()=>{if(await confirmAction(text('Remove gift rule?','להסיר כלל מתנה?'),displayName,text('Remove','הסרה'))){const gifts={...state.config.gifts};delete gifts[name];await api('/api/config',{gifts});}},false);
    actions.append(preview,edit,remove);row.append(title,value,actions);return row;
  }));
  if(!Object.keys(s.config.gifts).length)$('#giftRules').append(element('div',text('No gift rules yet. Create your first one below.','עדיין אין כללי מתנות. הוסיפו כלל ראשון למטה.'),'empty-state'));
}
function renderLogs(){if(state){const query=$('#logSearch').value.toLowerCase();$('#logs').textContent=state.logs.filter(log=>(log.message+' '+log.source).toLowerCase().includes(query)).map(log=>new Date(log.at).toLocaleTimeString()+` [${log.source}] ${log.message}`).join('\n')||text('No matching events.','לא נמצאו אירועים.');}}
$('#logSearch').oninput=renderLogs;
let refreshing=false;
async function refresh(){
  if(refreshing||sessionEnded)return;refreshing=true;
  try{
    const response=await fetch('/api/state',{signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Local service unavailable');state=await response.json();
    const s=state,percent=Math.min(100,Math.round(s.built/s.target*100)),lang=s.config.language;
    language(lang);updateActionHelp();$('#language').value=lang;
    const enabled=s.config.liveEnabled!==false,live=s.config.mode==='live',connected=s.connection.socket;
    $('#desktopStatus').textContent=!live?text('Simulator — press Connect to switch to LIVE.','סימולטור — לחצו על חיבור למעבר לשידור חי.'):!enabled?text('Disconnected by you. Automatic reconnection is stopped.','מנותק לפי בחירתכם. החיבור האוטומטי הופסק.'):connected?text('Local API connected · waiting for viewer events','ה-API המקומי מחובר · ממתינים לאירועי צופים'):text('Connecting to TikFinity Desktop · automatic retries enabled','מתחברים ל-TikFinity Desktop · ניסיונות חוזרים אוטומטיים');
    $('#disconnectLive').disabled=!enabled;$('#connectLive').disabled=live&&enabled;$('#reconnectLive').disabled=!s.gameOnline;

    $('#connection').textContent=s.config.mode==='simulator'?text('SIMULATOR · TEST MODE','סימולטור · מצב בדיקה'):!enabled?text('TikFinity disconnected by you','TikFinity מנותק לפי בחירתכם'):s.connection.socket?text('TikFinity API connected','API של TikFinity מחובר'):text('TikFinity disconnected','TikFinity מנותק');
    $('#connection').classList.toggle('connected',s.config.mode==='live'&&s.connection.socket);
    $('#gameReady').textContent=s.gameOnline?text('Running','פועל'):text('Offline','מנותק');$('#gameDot').className='status-dot '+(s.gameOnline?'good':'off');
    $('#sourceReady').textContent=s.config.mode==='simulator'?text('Simulator','סימולטור'):s.connection.socket?text('API connected','API מחובר'):text('Disconnected','מנותק');$('#sourceDot').className='status-dot '+(s.config.mode==='live'?(s.connection.socket?'good':'off'):'');
    $('#autoReady').textContent=s.paused?text('Paused','מושהה'):s.config.automatic?text('Automatic','אוטומטי'):text('Manual restart','התחלה ידנית');$('#autoDot').className='status-dot '+(s.config.automatic&&!s.paused?'good':'');
    $('#serviceWarning').hidden=!s.settingsWarning;$('#serviceWarning').textContent=s.settingsWarning||'';
    $('#connectionHelp').hidden=s.config.mode!=='live'||s.connection.socket;
    $('#buildingTitle').textContent=titles[lang][s.building];$('#round').textContent=text('ROUND ','סיבוב ')+s.round;
    $('#phaseNote').textContent=s.paused?text('Construction paused. Your queue is safe.','הבנייה מושהית. האבנים שבתור נשמרות.'):s.phase==='celebrating'?text(`Celebrating · next round in ${Math.max(0,Math.ceil(s.countdown))}s`,`חוגגים · הסיבוב הבא בעוד ${Math.max(0,Math.ceil(s.countdown))} שניות`):text('Current objective: raise the next community monument.','המשימה: להקים יחד את הפלא הבא.');
    drawBlueprint($('#blueprint'),s.building,s.built/s.target);
    $('#progress').textContent=percent+'%';$('#progressBar').value=percent;$('#stones').textContent=`\u2066${s.built} / ${s.target}\u2069 `+text('stones','אבנים');
    $('#workers').textContent=s.gameOnline?s.perf.workers:'—';$('#queue').textContent=s.queue+' '+text('stones queued','אבנים בתור');$('#fps').textContent=s.gameOnline?s.perf.fps+' FPS':text('Game offline','המשחק מנותק');
    $('#memory').textContent=text(`Service ${s.memoryMB} MB · Game ${Math.round(s.perf.memoryMB||0)} MB`,`שירות ${s.memoryMB} MB · משחק ${Math.round(s.perf.memoryMB||0)} MB`);
    const recent=s.logs.filter(log=>log.source==='live'||log.source==='simulator').slice(0,4);
    $('#events').replaceChildren(...recent.map(log=>{const row=element('div',undefined,'events-row');row.append(element('span',log.message),element('strong',log.source));return row;}));
    if(!recent.length)$('#events').append(element('div',text('Your audience writes the story. Events will appear here as viewers join in.','הקהל כותב את הסיפור. אירועים יופיעו כאן כשהצופים יצטרפו.'),'empty-state'));
    $('#leaders').replaceChildren(...s.leaderboard.slice(0,4).map(([name,score],i)=>{const row=element('div',undefined,'rank'),label=element('span',undefined,'rank-name'),meter=element('div',undefined,'rank-meter'),fill=element('span');fill.style.width=Math.max(4,score/s.leaderboard[0][1]*100)+'%';meter.append(fill);label.append(element('span',String(i+1).padStart(2,'0'),'avatar-initial'),element('bdi',name));row.append(label,meter,element('strong',score));return row;}));
    if(!s.leaderboard.length)$('#leaders').append(element('div',text('A place for your first builder. Contributions stay saved across restarts.','מקום לבונה הראשון. התרומות נשמרות גם לאחר הפעלה מחדש.'),'empty-state'));
    $('#idle').textContent=s.idle?text('A quiet desert. No artificial viewer events are generated.','מדבר שקט. אין יצירת אירועי צופים מלאכותיים.'):text('Your community is building right now.','הקהילה בונה עכשיו.');
    $('#health').textContent=JSON.stringify({socket:s.connection.socket,lastEvent:s.connection.lastEvent?new Date(s.connection.lastEvent).toLocaleTimeString():text('None','אין'),attempts:s.connection.attempts,gameOnline:s.gameOnline,...s.metrics},null,2);
    $('#mode').value=s.config.mode;$('#simForm button').disabled=s.config.mode==='live';
    for(const id of ['pause','quickPause']){$('#'+id).textContent=s.paused?text('Resume construction','המשך בנייה'):text('Pause construction','השהיית בנייה');$('#'+id).setAttribute('aria-pressed',String(s.paused));}
    for(const id of ['gameForm','visualForm'])if(!dirty.has(id))for(const field of $('#'+id).elements){if(!field.name)continue;if(field.type==='checkbox')field.checked=s.config[field.name];else field.value=s.config[field.name];}
    renderPicker();renderGiftRules(s);renderGiftLibrary();renderSelectedGift();renderLogs();
  }catch(error){$('#connection').textContent=text('LOCAL SERVICE OFFLINE','השירות המקומי מנותק');$('#connection').classList.remove('connected');$('#gameReady').textContent=text('Waiting for service','ממתינים לשירות');$('#gameDot').className='status-dot off';}
  finally{refreshing=false;}
}
function renderSelectedGift(){
  const box=$('#selectedGift');box.hidden=!selectedGift;
  if(!selectedGift){box.replaceChildren();delete box.dataset.key;return;}
  const key=selectedGift.id+':'+document.documentElement.lang;if(box.dataset.key===key)return;box.dataset.key=key;
  const info=element('div');info.append(element('strong',selectedGift.name),element('p',selectedGift.coins.toLocaleString()+' '+text('coins','מטבעות')+' · ID '+selectedGift.id));box.replaceChildren(giftImage(selectedGift),info);
}
function chooseGift(gift){
  if(giftSaving)return;selectedGift=gift;const existing=configuredGift(gift,state.config.gifts);editGift=existing?.key||'';
  for(const[k,v]of Object.entries({name:gift.name,giftId:gift.id,action:existing?.rule.action||'blocks',value:existing?.rule.value||10}))$('#giftForm [name='+k+']').value=v;
  dirty.add('giftForm');updateActionHelp();$('#selectedGift').dataset.key='';renderSelectedGift();renderGiftLibrary();
  $('#giftForm').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
}
$('#customGift').onclick=()=>{selectedGift=null;editGift='';$('#giftForm').reset();$('#selectedGift').dataset.key='';renderSelectedGift();renderGiftLibrary();$('#giftForm [name=name]').focus();};
for(const id of ['giftSearch','giftPrice','giftAssigned','giftSort'])$('#'+id).addEventListener(id==='giftSearch'?'input':'change',()=>{giftPage=0;renderGiftLibrary();});
$('#giftPrevious').onclick=()=>{giftPage=Math.max(0,giftPage-1);renderGiftLibrary();};
$('#giftNext').onclick=()=>{giftPage++;renderGiftLibrary();};
function renderGiftLibrary(){
  if(!state)return;
  const options={query:$('#giftSearch').value,price:$('#giftPrice').value,mapped:$('#giftAssigned').value,sort:$('#giftSort').value};
  const matches=filterGifts(giftCatalog,options,state.config.gifts),pages=Math.max(1,Math.ceil(matches.length/giftsPerPage));giftPage=Math.min(giftPage,pages-1);
  const key=JSON.stringify([options,giftPage,selectedGift?.id,giftSaving,state.config.gifts,state.config.language,catalogReady,catalogError]);
  if($('#giftCatalogGrid').dataset.key===key)return;$('#giftCatalogGrid').dataset.key=key;
  $('#giftCatalogCount').textContent=giftCatalog.length+' '+text('gifts','מתנות');
  $('#giftPrevious').disabled=giftPage===0;$('#giftNext').disabled=giftPage>=pages-1;
  $('#giftPageInfo').textContent=matches.length?`${giftPage*giftsPerPage+1}–${Math.min(matches.length,(giftPage+1)*giftsPerPage)} / ${matches.length}`:'0 / 0';
  const cards=matches.slice(giftPage*giftsPerPage,(giftPage+1)*giftsPerPage).map(gift=>{
    const button=element('button',undefined,'gift-card');button.type='button';button.disabled=giftSaving;button.dataset.giftId=gift.id;button.classList.toggle('selected',selectedGift?.id===gift.id);button.setAttribute('aria-label',gift.name+', '+gift.coins+' '+text('coins','מטבעות')+', ID '+gift.id);button.setAttribute('aria-pressed',String(selectedGift?.id===gift.id));
    const assigned=!!configuredGift(gift,state.config.gifts);button.append(giftImage(gift),element('bdi',gift.name,'gift-card-name'),element('span',gift.coins.toLocaleString()+' '+text('coins','מטבעות'),'gift-card-price'),element('small','ID '+gift.id),element('span',assigned?text('Assigned','משויך'):text('Choose gift','בחירת מתנה'),'gift-card-status'+(assigned?' assigned':'')));button.onclick=()=>chooseGift(gift);return button;
  });
  $('#giftCatalogGrid').replaceChildren(...cards);
  if(!cards.length)$('#giftCatalogGrid').append(element('div',catalogError?text('Library unavailable. Custom gift rules still work.','הספרייה לא זמינה. ניתן להגדיר מתנה ידנית.'):!catalogReady?text('Loading gift library…','טוענים את ספריית המתנות…'):text('No gifts match your search.','לא נמצאו מתנות מתאימות.'),'empty-state'));
}
loadGiftCatalog().then(data=>{
  giftCatalog=data;catalogReady=true;
  $('#giftNames').replaceChildren(...data.map(g=>{const option=document.createElement('option');option.value=g.name;option.label=`${g.coins} · ID ${g.id}`;return option;}));
  renderGiftLibrary();if(state)renderGiftRules(state);
}).catch(error=>{catalogError=error.message;catalogReady=true;renderGiftLibrary();});
refresh();setInterval(refresh,1000);
