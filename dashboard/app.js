import {drawBlueprint} from './blueprint.js';
const $ = selector => document.querySelector(selector);
let token='', state, page='overview', editGift='', toastTimer;
const dirty=new Set();
const he={likesPerWorker:'לייקים לכל פועל / אבן',commentBlocks:'אבנים לכל תגובה',followBlocks:'אבנים לכל עוקב',shareBlocks:'אבנים לכל שיתוף',skin:'מראה הפועלים',overlay:'פריסת שכבת השידור',workspace:'סביבת עבודה',overview:'סקירה',game:'הגדרות משחק',gifts:'ניהול מתנות',visual:'הגדרות תצוגה',controls:'שליטה בשידור',language:'שפה',broadcast:'השידור שלך, בשליטה מלאה',hero:'קהילה אחת. אלפי אבנים.\nבונים יחד משהו שיישאר.',progress:'התקדמות הבנייה',workers:'פועלים פעילים',performance:'ביצועי המשחק',activity:'פעילות אחרונה',leaders:'התורמים המובילים',roundSettings:'מכינים את הסיבוב הבא',building:'מבנה',blocks:'מספר האבנים הנדרש (רמת קושי)',timing:'ספירה לאחור לחגיגה (שניות)',automatic:'התחלה אוטומטית של הסיבוב הבא',save:'שמירת הגדרות',apply:'בחירת המבנה ורמת הקושי יחולו בסיבוב הבא. להתחלה מיידית השתמשו בהתחלה מחדש. ההצבעות קובעות את המבנה הבא; ללא הצבעות המבנים מתחלפים לפי הסדר.',giftRules:'כל מתנה בונה',giftNote:'יש להתאים לשם המתנה שמתקבל ב-TikFinity. מתנות ללא כלל יירשמו בלבד.',giftName:'שם המתנה',action:'פעולה',value:'אבנים לכל מתנה',saveRule:'שמירת כלל',visualTitle:'יוצרים אווירה',quality:'איכות גרפית',maxWorkers:'מספר פועלים מרבי',camera:'מצלמה קולנועית',night:'מעברי יום ולילה',mode:'מקור אירועים',modeNote:'במצב שידור חי כל אירועי הבדיקה חסומים. חיבור מקומי תקין אינו מאשר שהשידור ב-TikTok פעיל.',pause:'השהיה / המשך',restart:'התחלת סיבוב מחדש',health:'תקינות החיבור',simulator:'סימולטור אירועים מקומי',username:'שם הצופה',event:'אירוע',quantity:'כמות מתנות',comment:'תגובה / הצבעה למבנה',test:'שליחת אירוע בדיקה',logs:'יומן אירועים'};
Object.assign(he,{
  sessionControls:'שליטה בסיבוב',connectionSetup:'הגדרת חיבור',backupSettings:'גיבוי הגדרות',gameWindow:'חלון המשחק',eventSource:'מקור אירועים',roundFlow:'רצף סיבובים',connectTitle:'ממתינים ל-TikFinity Desktop',connectHelp:'פתחו את TikFinity במחשב הזה וחברו אותו לשידור. המשחק מתחבר מחדש באופן אוטומטי. בדקו אירוע אמיתי לפני השארת המשחק ללא השגחה.',nextWonder:'הפלא הבא מתחיל כאן',blueprintPreview:'תצוגת תוכנית בנייה · אינה צילום של המשחק',difficulty:'רמת קושי',quickRound:'מהיר · 100',standardRound:'רגיל · 200',epicRound:'גדול · 500',manage:'ניהול',downloadLogs:'הורדת יומן',filterLogs:'סינון אירועים',restoreSettings:'שחזור הגדרות',restoreNote:'ייבוא קובץ הגדרות של המשחק. ההגדרות הנוכחיות נשמרות כעותק שחזור לפני שינוי.',chooseBackup:'בחירת גיבוי JSON',footer:'שליטה מקומית. יצירה משותפת.',cancel:'ביטול'
});
const english=new Map([...document.querySelectorAll('[data-i]')].map(el=>[el,el.textContent]));
for(const form of document.querySelectorAll('form'))for(const field of form.elements){
  if(!field.name)continue;if(!field.id)field.id=(form.id||'dialog')+'-'+field.name;
  const label=field.previousElementSibling;if(label?.tagName==='LABEL')label.htmlFor=field.id;
}
const englishOptions=new Map([...document.querySelectorAll('select:not(#language) option')].map(option=>{option.setAttribute('value',option.value);return [option,option.textContent];}));
const optionHebrew={high:'גבוהה · צללים ואבק',low:'נמוכה · ללא צללים ואבק',mixed:'תלבושות מעורבות',worker:'פועל',mummy:'מומיה',ninja:'נינג׳ה',pharaoh:'פרעה',full:'מלאה · הוראות ומובילים',minimal:'מצומצמת · סצנה והתקדמות',simulator:'סימולטור — בדיקות בלבד',live:'שידור חי — TikFinity Free',blocks:'אבנים מוזהבות',boost:'האצה ל-15 שניות ואבנים',quake:'רעידת אדמה — הסרת אבנים',like:'לייקים',chat:'תגובה / הצבעה',follow:'מעקב',share:'שיתוף',gift:'מתנה'};
const titles={en:{pyramid:'Egyptian Pyramid',temple:'Ancient Temple',castle:'Medieval Castle',lighthouse:'Lighthouse',obelisk:'Obelisk',ziggurat:'Ziggurat'},he:{pyramid:'הפירמידה המצרית',temple:'המקדש העתיק',castle:'טירת ימי הביניים',lighthouse:'המגדלור',obelisk:'האובליסק',ziggurat:'הזיגוראת'}};
const icons={pyramid:'△',temple:'Π',castle:'♜',lighthouse:'♟',obelisk:'▴',ziggurat:'▰'};
const text=(en,heb)=>document.documentElement.lang==='he'?heb:en;
function language(lang){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';
  for(const[el,value]of english)el.textContent=lang==='he'?(he[el.dataset.i]||value):value;
  for(const[option,value]of englishOptions)option.textContent=lang==='he'?(titles.he[option.value]||optionHebrew[option.value]||value):(titles.en[option.value]||value);
  $('#pageTitle').textContent=$(`[data-page="${page}"]`).textContent;
}
function navigate(next){
  page=next;
  for(const section of document.querySelectorAll('.page'))section.hidden=section.id!==next;
  for(const button of document.querySelectorAll('[data-page]')){button.classList.toggle('active',button.dataset.page===next);button.setAttribute('aria-current',button.dataset.page===next?'page':'false');}
  $('#pageTitle').textContent=$(`[data-page="${next}"]`).textContent;
}
async function api(route,data){
  if(!token)token=(await(await fetch('/api/session')).json()).token;
  const send=()=>fetch(route,{method:'POST',headers:{'Content-Type':'application/json','X-Session':token},body:JSON.stringify(data),signal:AbortSignal.timeout(5000)});
  let response=await send();
  if(response.status===403){token=(await(await fetch('/api/session')).json()).token;response=await send();}
  const result=await response.json();if(!response.ok)throw Error(result.error);return result;
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
$('#giftForm').onsubmit=guarded(async()=>{
  const values=Object.fromEntries(new FormData($('#giftForm'))),gifts={...state.config.gifts};
  if(editGift)delete gifts[editGift];gifts[values.name.trim().toLowerCase()]={action:values.action,value:Number(values.value)};
  await api('/api/config',{gifts});editGift='';dirty.delete('giftForm');$('#giftForm').reset();
});
$('#simForm').onsubmit=guarded(async()=>{
  const values=Object.fromEntries(new FormData($('#simForm')));
  await api('/api/sim',{event:values.event,data:{...values,likeCount:state.config.likesPerWorker,repeatCount:Number(values.repeatCount),giftType:1,repeatEnd:true,msgId:crypto.randomUUID()}});
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
  const signature=JSON.stringify([s.config.gifts,s.config.mode,s.config.language]);
  if($('#giftRules').dataset.signature===signature)return;$('#giftRules').dataset.signature=signature;
  $('#giftRules').replaceChildren(...Object.entries(s.config.gifts).map(([name,rule])=>{
    const row=element('div',undefined,'gift-rule'),title=element('div',undefined,'gift-name');title.append(element('span','◇','avatar-initial'),element('bdi',name));
    const value=element('div',rule.value+' '+text('stones / gift','אבנים / מתנה'),'gift-action-value');
    value.append(element('small',({blocks:text('Golden construction','בנייה מוזהבת'),boost:text('15 second boost','האצה ל-15 שניות'),quake:text('Earthquake','רעידת אדמה')})[rule.action]));
    const actions=element('div',undefined,'gift-actions');
    const preview=element('button',text('Preview','תצוגה'));preview.disabled=s.config.mode==='live';preview.onclick=guarded(()=>api('/api/sim',{event:'gift',data:{uniqueId:'Gift Preview',giftName:name,repeatCount:1,giftType:1,repeatEnd:true,msgId:crypto.randomUUID()}}),false);
    const edit=element('button',text('Edit','עריכה'));edit.onclick=()=>{editGift=name;for(const[k,v]of Object.entries({name,action:rule.action,value:rule.value}))$('#giftForm [name='+k+']').value=v;dirty.add('giftForm');$('#giftForm input').focus();};
    const remove=element('button',text('Remove','הסרה'),'remove-rule');remove.onclick=guarded(async()=>{if(await confirmAction(text('Remove gift rule?','להסיר כלל מתנה?'),name,text('Remove','הסרה'))){const gifts={...state.config.gifts};delete gifts[name];await api('/api/config',{gifts});}},false);
    actions.append(preview,edit,remove);row.append(title,value,actions);return row;
  }));
  if(!Object.keys(s.config.gifts).length)$('#giftRules').append(element('div',text('No gift rules yet. Create your first one below.','עדיין אין כללי מתנות. הוסיפו כלל ראשון למטה.'),'empty-state'));
}
function renderLogs(){if(state){const query=$('#logSearch').value.toLowerCase();$('#logs').textContent=state.logs.filter(log=>(log.message+' '+log.source).toLowerCase().includes(query)).map(log=>new Date(log.at).toLocaleTimeString()+` [${log.source}] ${log.message}`).join('\n')||text('No matching events.','לא נמצאו אירועים.');}}
$('#logSearch').oninput=renderLogs;
let refreshing=false;
async function refresh(){
  if(refreshing)return;refreshing=true;
  try{
    const response=await fetch('/api/state',{signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Local service unavailable');state=await response.json();
    const s=state,percent=Math.min(100,Math.round(s.built/s.target*100)),lang=s.config.language;
    language(lang);$('#language').value=lang;
    $('#connection').textContent=s.config.mode==='simulator'?text('SIMULATOR · TEST MODE','סימולטור · מצב בדיקה'):s.connection.socket?text('TikFinity API connected','API של TikFinity מחובר'):text('TikFinity disconnected','TikFinity מנותק');
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
    $('#events').replaceChildren(...s.logs.slice(0,6).map(log=>{const row=element('div',undefined,'events-row');row.append(element('span',log.message),element('strong',log.source));return row;}));
    if(!s.logs.length)$('#events').append(element('div',text('Your audience writes the story. Events will appear here as viewers join in.','הקהל כותב את הסיפור. אירועים יופיעו כאן כשהצופים יצטרפו.'),'empty-state'));
    $('#leaders').replaceChildren(...s.leaderboard.slice(0,6).map(([name,score],i)=>{const row=element('div',undefined,'rank'),label=element('span',undefined,'rank-name'),meter=element('div',undefined,'rank-meter'),fill=element('span');fill.style.width=Math.max(4,score/s.leaderboard[0][1]*100)+'%';meter.append(fill);label.append(element('span',String(i+1).padStart(2,'0'),'avatar-initial'),element('bdi',name));row.append(label,meter,element('strong',score));return row;}));
    if(!s.leaderboard.length)$('#leaders').append(element('div',text('A place for your first builder. Contributions stay saved across restarts.','מקום לבונה הראשון. התרומות נשמרות גם לאחר הפעלה מחדש.'),'empty-state'));
    $('#idle').textContent=s.idle?text('A quiet desert. No artificial viewer events are generated.','מדבר שקט. אין יצירת אירועי צופים מלאכותיים.'):text('Your community is building right now.','הקהילה בונה עכשיו.');
    $('#health').textContent=JSON.stringify({socket:s.connection.socket,lastEvent:s.connection.lastEvent?new Date(s.connection.lastEvent).toLocaleTimeString():text('None','אין'),attempts:s.connection.attempts,gameOnline:s.gameOnline,...s.metrics},null,2);
    $('#mode').value=s.config.mode;$('#simForm button').disabled=s.config.mode==='live';
    for(const id of ['pause','quickPause']){$('#'+id).textContent=s.paused?text('Resume construction','המשך בנייה'):text('Pause construction','השהיית בנייה');$('#'+id).setAttribute('aria-pressed',String(s.paused));}
    for(const id of ['gameForm','visualForm'])if(!dirty.has(id))for(const field of $('#'+id).elements){if(!field.name)continue;if(field.type==='checkbox')field.checked=s.config[field.name];else field.value=s.config[field.name];}
    renderPicker();renderGiftRules(s);renderLogs();
  }catch(error){$('#connection').textContent=text('LOCAL SERVICE OFFLINE','השירות המקומי מנותק');$('#connection').classList.remove('connected');$('#gameReady').textContent=text('Waiting for service','ממתינים לשירות');$('#gameDot').className='status-dot off';}
  finally{refreshing=false;}
}
refresh();setInterval(refresh,1000);
