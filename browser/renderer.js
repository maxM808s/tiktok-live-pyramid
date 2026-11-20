import * as THREE from '../vendor/three/three.module.min.js';
import {cellsFor} from '/blueprint.js';
const colors=['#e1bd83','#e9dfc5','#344456','#d8b463'];
const zero=new THREE.Matrix4().makeScale(0,0,0),matrix=new THREE.Matrix4(),point=new THREE.Vector3();
export class DesertView {
 constructor(canvas){
  this.canvas=canvas;this.healthy=true;this.time=0;this.round=-1;this.scheduled=0;this.landed=0;this.workers=[];this.materials=new Map();
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.healthy=false;});canvas.addEventListener('webglcontextrestored',()=>this.healthy=true);
  this.daySky=new THREE.Color('#b8c3bc');this.nightSky=new THREE.Color('#182b43');
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#a6b7b5');this.scene.fog=new THREE.Fog('#a6b7b5',38,120);
  this.camera=new THREE.PerspectiveCamera(48,9/16,.1,180);this.camera.position.set(25,20,31);this.camera.lookAt(0,3,0);
  this.ambient=new THREE.HemisphereLight('#dcebed','#9b7955',2);this.scene.add(this.ambient);
  this.sun=new THREE.DirectionalLight('#ffe4b2',3);this.sun.position.set(-20,35,20);this.sun.castShadow=true;
  Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:100});this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.bias=-.0005;this.scene.add(this.sun);
  this.unit=new THREE.BoxGeometry(1,1,1);this.world();this.particles();this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);
 }
 material(color,metalness=0){const key=color+':'+metalness;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metalness?.35:.86,metalness}));return this.materials.get(key);}
 box(parent,x,y,z,sx,sy,sz,color){const mesh=new THREE.Mesh(this.unit,this.material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 world(){
  const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=128;const ctx=textureCanvas.getContext('2d');ctx.fillStyle='#bd9a6b';ctx.fillRect(0,0,128,128);
  for(let i=0;i<2800;i++){const light=i%3===0;ctx.fillStyle=light?'#d5b585':'#ae8e62';ctx.fillRect((i*47)%128,(i*71+Math.floor(i/128)*13)%128,1,1);}
  const texture=new THREE.CanvasTexture(textureCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(45,45);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshStandardMaterial({map:texture,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;this.scene.add(ground);
  this.box(this.scene,0,-.04,0,16,.12,16,'#9b805f');
  const duneGeometry=new THREE.SphereGeometry(1,18,8);
  for(let i=0;i<32;i++){const dune=new THREE.Mesh(duneGeometry,this.material('#b99b73'));dune.position.set(Math.sin(i*2.39)*60,-1,-20-(i*13)%55);dune.scale.set(5+i%7,1.1+(i%4)*.3,5+i%5);this.scene.add(dune);}
  for(const[x,z,size]of[[-22,-32,11],[18,-43,14]]){const landmark=new THREE.Mesh(new THREE.ConeGeometry(size,size*1.15,4),this.material('#ab8b5e'));landmark.position.set(x,size*.575,z);landmark.rotation.y=Math.PI/4;this.scene.add(landmark);}
  for(const x of [-8.7,8.7])for(const z of [-6,0,6]){this.box(this.scene,x,2.7,z,.16,5.4,.16,'#65503b');for(const y of [2.4,4.7])this.box(this.scene,x,y,z,.2,.15,6,'#71553b');}
  for(let i=0;i<12;i++)this.box(this.scene,-7+i%3,.4+Math.floor(i/3)*.7,10,.9,.65,.85,'#d7b680');
  this.box(this.scene,9,4,-9,.35,8,.35,'#665039');this.box(this.scene,6,8,-9,7,.25,.25,'#665039');this.box(this.scene,3,5.8,-9,.045,4.4,.045,'#394044');this.box(this.scene,3,3.4,-9,1.1,.8,1.1,'#c6a873');
  for(const[x,z]of[[-14,-14],[14,-19],[-17,1]]){this.box(this.scene,x,2.2,z,.4,4.4,.4,'#84613d');for(let i=0;i<6;i++){const a=i*Math.PI/3;const leaf=this.box(this.scene,x+Math.cos(a)*1.2,4.5,z+Math.sin(a)*1.2,3,.1,.55,'#5e7755');leaf.rotation.y=-a;leaf.rotation.z=.15;}}
  const stars=new Float32Array(120*3);for(let i=0;i<120;i++){stars[i*3]=Math.sin(i*47)*90;stars[i*3+1]=30+(i*13)%55;stars[i*3+2]=-45-(i*17)%55;}
  const sky=new THREE.BufferGeometry();sky.setAttribute('position',new THREE.BufferAttribute(stars,3));this.stars=new THREE.Points(sky,new THREE.PointsMaterial({color:'#fff2cc',size:.2}));this.scene.add(this.stars);
 }
 particles(){
  this.sparks=Array.from({length:180},()=>({life:0,x:0,y:-1000,z:0,vx:0,vy:0,vz:0}));this.sparkPositions=new Float32Array(540);this.sparkColors=new Float32Array(540);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.sparkPositions,3));geo.setAttribute('color',new THREE.BufferAttribute(this.sparkColors,3));
  this.sparkMesh=new THREE.Points(geo,new THREE.PointsMaterial({size:.15,vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));this.sparkMesh.frustumCulled=false;this.scene.add(this.sparkMesh);this.sparkCursor=0;this.lastFirework=0;
 }
 burst(at,count=12,power=2){for(let i=0;i<count;i++){const p=this.sparks[this.sparkCursor++%this.sparks.length],a=Math.random()*Math.PI*2,r=Math.random()*power;Object.assign(p,{life:power>4?2.3:.7,x:at.x,y:at.y,z:at.z,vx:Math.cos(a)*r,vy:Math.random()*power+1,vz:Math.sin(a)*r});}}
 rebuild(state){
  if(this.stones){this.scene.remove(this.stones,this.goldStones);this.stones.dispose();this.goldStones.dispose();}
  if(this.crown){this.scene.remove(this.crown);this.crown.traverse(mesh=>{if(mesh.geometry&&mesh.geometry!==this.unit)mesh.geometry.dispose();});}
  this.cells=cellsFor(state.building);this.round=state.round;this.scheduled=this.landed=0;this.placed=new Uint8Array(this.cells.length);this.goldFlags=new Uint8Array(this.cells.length);
  this.stones=new THREE.InstancedMesh(this.unit,this.material('#ffffff'),this.cells.length);this.goldStones=new THREE.InstancedMesh(this.unit,this.material('#edc574',.58),this.cells.length);
  for(const mesh of [this.stones,this.goldStones]){mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);}
  for(let i=0;i<this.cells.length;i++){this.stones.setMatrixAt(i,zero);this.goldStones.setMatrixAt(i,zero);const cell=this.cells[i];let color='#dfbd85';if(state.building==='castle')color='#a2afb2';if(state.building==='lighthouse')color=Math.floor(cell.y/3)%2?'#b96851':'#f1e4c8';if(state.building==='temple'&&cell.y>=6)color='#b7684a';if(state.building==='ziggurat'&&cell.y>=6)color='#3f8596';this.stones.setColorAt(i,new THREE.Color(color));}
  this.stones.instanceColor.needsUpdate=true;this.stones.instanceMatrix.needsUpdate=this.goldStones.instanceMatrix.needsUpdate=true;
  for(const worker of this.workers){worker.job=null;worker.flight.visible=false;worker.carry.visible=false;}
  const highest=this.cells.reduce((a,b)=>b.y>a.y?b:a,this.cells[0]);this.height=highest.y+1;
  this.crown=new THREE.Group();this.crown.position.set(highest.x,highest.y+1.3,highest.z);this.scene.add(this.crown);
  if(['pyramid','obelisk'].includes(state.building)){const cap=new THREE.Mesh(new THREE.ConeGeometry(.8,1.1,4),this.material('#edc574',.58));cap.rotation.y=Math.PI/4;this.crown.add(cap);}
  else if(state.building==='castle'){this.box(this.crown,0,.3,0,.1,2,.1,'#514b42');this.box(this.crown,.5,.9,0,1,.6,.08,'#b65346');}
  else{this.box(this.crown,0,0,0,1.7,.5,1.7,'#e1b75b');if(state.building==='lighthouse'){const light=new THREE.PointLight('#ffe7b4',8,20);this.crown.add(light);}}
  this.crown.visible=false;
 }
 makeWorker(index,skin){
  const group=new THREE.Group();const type=skin==='mixed'?index%4:['worker','mummy','ninja','pharaoh'].indexOf(skin);const color=colors[Math.max(0,type)];
  this.box(group,0,1.05,0,.48,.65,.3,color);this.box(group,0,1.59,0,.36,.36,.35,'#be8b66');this.box(group,0,1.82,0,.45,.13,.4,color);
  for(const x of [-.09,.09])this.box(group,x,1.64,.184,.045,.045,.02,'#29303a');
  if(type===1)for(let n=0;n<5;n++)this.box(group,0,.81+n*.12,.16,.49,.03,.02,'#a99b84');
  if(type===2)this.box(group,0,1.56,.19,.38,.12,.04,'#1b293b');
  if(type===3)for(const x of [-.23,.23])this.box(group,x,1.51,0,.12,.53,.37,'#2d6484');
  const legs=[];for(const x of [-.14,.14]){const pivot=new THREE.Group();pivot.position.set(x,.72,0);this.box(pivot,0,-.3,0,.18,.6,.21,'#4b4d48');group.add(pivot);legs.push(pivot);}
  const arms=[];for(const x of [-.34,.34]){const pivot=new THREE.Group();pivot.position.set(x,1.3,0);this.box(pivot,0,-.2,0,.17,.48,.18,'#be8b66');group.add(pivot);arms.push(pivot);}
  const carry=this.box(group,0,1.12,.47,.68,.5,.55,'#e1bf87');carry.visible=false;
  if(index<3){const ring=new THREE.Mesh(new THREE.TorusGeometry(.54,.035,5,20),this.material('#deb867',.4));ring.rotation.x=Math.PI/2;ring.position.y=.08;group.add(ring);}
  const flight=new THREE.Mesh(this.unit,this.material('#e1bf87'));flight.scale.set(.96,.91,.96);flight.visible=false;flight.castShadow=true;this.scene.add(group,flight);
  const tag=document.createElement('div');tag.className='name-tag';tag.hidden=true;document.querySelector('#names').append(tag);
  return {group,legs,arms,carry,flight,tag,job:null,index,source:new THREE.Vector3(-6+(index%4)*1.5,0,9+Math.floor(index/4)*.55)};
 }
 configure(state){
  const signature=state.config.skin+':'+state.config.workers;
  if(signature!==this.workerSignature){
   for(const worker of this.workers){this.scene.remove(worker.group,worker.flight);worker.tag.remove();worker.group.traverse(mesh=>{if(mesh.geometry&&mesh.geometry!==this.unit)mesh.geometry.dispose();});}
   this.workers=[];this.workerSignature=signature;
   if(this.cells){for(let i=0;i<this.scheduled;i++)if(!this.placed[i])this.place(i,this.goldFlags[i]);this.landed=this.scheduled;}
   for(let i=0;i<state.config.workers;i++)this.workers.push(this.makeWorker(i,state.config.skin));
  }
  const pixelRatio=Math.min(devicePixelRatio,state.config.quality==='high'?1.5:1),qualityKey=state.config.quality+':'+pixelRatio;
  if(this.qualityKey!==qualityKey){this.qualityKey=qualityKey;this.renderer.shadowMap.enabled=state.config.quality==='high';this.renderer.setPixelRatio(pixelRatio);}
 }
 place(index,gold){const cell=this.cells[index];matrix.compose(new THREE.Vector3(cell.x,cell.y+.5,cell.z),new THREE.Quaternion(),new THREE.Vector3(.96,.91,.96));this.stones.setMatrixAt(index,gold?zero:matrix);this.goldStones.setMatrixAt(index,gold?matrix:zero);this.placed[index]=1;this.goldFlags[index]=gold?1:0;this.stones.instanceMatrix.needsUpdate=this.goldStones.instanceMatrix.needsUpdate=true;}
 startJob(index,worker,state){
  const cell=this.cells[index],unit=Math.min(state.placements.length-1,Math.floor(index/this.cells.length*state.target)),owner=state.placements[unit]||{user:state.builder,gold:false};
  worker.job={index,elapsed:0,from:worker.source.clone(),to:new THREE.Vector3(cell.x,0,cell.z+1.3),target:new THREE.Vector3(cell.x,cell.y+.5,cell.z),gold:owner.gold,user:owner.user,landed:false};
  this.goldFlags[index]=owner.gold?1:0;worker.group.position.copy(worker.source);worker.carry.visible=true;worker.flight.material=owner.gold?this.material('#edc574',.58):this.material('#e1bf87');
  worker.tag.textContent=String(owner.user||'').slice(0,20);worker.tag.hidden=worker.index>=4;
 }
 update(delta,state){
  this.time+=delta;
  if(state.round!==this.round)this.rebuild(state);this.configure(state);
  const wanted=Math.max(0,Math.min(this.cells.length,Math.floor(state.built/state.target*this.cells.length)));
  if(wanted<this.scheduled){for(const worker of this.workers){worker.job=null;worker.flight.visible=false;worker.carry.visible=false;}for(let i=0;i<this.cells.length;i++){if(i<wanted)this.place(i,this.goldFlags[i]);else{this.stones.setMatrixAt(i,zero);this.goldStones.setMatrixAt(i,zero);this.placed[i]=0;}}this.stones.instanceMatrix.needsUpdate=this.goldStones.instanceMatrix.needsUpdate=true;this.scheduled=this.landed=wanted;this.burst(new THREE.Vector3(0,3,0),60,5);}
  if(!state.paused&&this.healthy){for(let n=0;n<4&&this.scheduled<wanted;n++){const worker=this.workers.find(w=>!w.job);if(!worker)break;this.startJob(this.scheduled++,worker,state);}}
  for(const worker of this.workers){
   const job=worker.job;
   if(job){
    if(!state.paused)job.elapsed+=delta;const t=job.elapsed;
    if(t<.6){worker.group.position.lerpVectors(job.from,job.to,t/.6);worker.group.rotation.y=Math.atan2(job.to.x-job.from.x,job.to.z-job.from.z);worker.legs[0].rotation.x=Math.sin(t*18)*.6;worker.legs[1].rotation.x=-worker.legs[0].rotation.x;for(const arm of worker.arms)arm.rotation.x=-.9;}
    else if(t<1.1){worker.group.position.copy(job.to);worker.carry.visible=false;worker.flight.visible=true;const u=(t-.6)/.5;worker.flight.position.lerpVectors(job.to.clone().add(new THREE.Vector3(0,1.6,0)),job.target,u);worker.flight.position.y+=Math.sin(u*Math.PI)*(1.4+job.target.y*.12);for(const arm of worker.arms)arm.rotation.x=-1.6*(1-u);}
    else{
     if(!job.landed){this.place(job.index,job.gold);this.landed++;job.landed=true;worker.flight.visible=false;if(state.config.quality==='high')this.burst(job.target,8,1.2);}
     worker.group.position.lerpVectors(job.to,job.from,Math.min(1,(t-1.1)/.45));worker.group.rotation.y+=0;worker.legs[0].rotation.x=Math.sin(t*18)*.5;worker.legs[1].rotation.x=-worker.legs[0].rotation.x;
     if(t>=1.55)worker.job=null;
    }
   }else{worker.group.position.copy(worker.source);worker.group.position.y=state.phase==='celebrating'?Math.abs(Math.sin(this.time*4+worker.index))*.4:Math.sin(this.time*2+worker.index)*.025;worker.carry.visible=false;for(const leg of worker.legs)leg.rotation.x=0;for(const arm of worker.arms)arm.rotation.x=0;worker.tag.hidden=true;}
   if(!worker.tag.hidden){point.copy(worker.group.position).y+=2.2;point.project(this.camera);worker.tag.style.left=((point.x*.5+.5)*100)+'%';worker.tag.style.top=((-point.y*.5+.5)*100)+'%';}
  }
  const complete=state.phase==='celebrating'&&this.landed===this.cells.length;this.crown.visible=complete;
  if(complete&&this.time-this.lastFirework>1.2){this.lastFirework=this.time;this.burst(new THREE.Vector3(Math.sin(this.time)*5,9+Math.random()*3,0),65,7);}
  this.sparks.forEach((p,i)=>{p.life-=delta;if(p.life>0){p.x+=p.vx*delta;p.y+=p.vy*delta;p.z+=p.vz*delta;p.vy-=4*delta;this.sparkPositions.set([p.x,p.y,p.z],i*3);const fade=Math.min(1,p.life);this.sparkColors.set([fade,.6*fade,.16*fade],i*3);}else this.sparkPositions.set([0,-1000,0],i*3);});this.sparkMesh.geometry.attributes.position.needsUpdate=this.sparkMesh.geometry.attributes.color.needsUpdate=true;
  const angle=.33+(state.config.camera?Math.sin(this.time*(complete?.3:.045))*(complete?.18:.08):0),radius=Math.max(42,30+this.height*1.6);
  this.camera.position.set(Math.sin(angle)*radius,Math.max(17,this.height+8),Math.cos(angle)*radius);this.camera.lookAt(0,Math.max(2,this.height*.25),2.5);
  const quakeAge=(Date.now()-(state.quakeAt||0))/1000;if(quakeAge>=0&&quakeAge<.65){const shake=(1-quakeAge/.65)*.22;this.camera.position.x+=Math.sin(quakeAge*63)*shake;this.camera.position.y+=Math.cos(quakeAge*51)*shake*.5;}
  this.sun.color.set(state.boostRemaining>0?'#ffce76':'#ffe4b2');
  const day=state.config.night?.55+.45*Math.sin(this.time*.01+.5):.9;this.sun.intensity=1+day*2.2;this.ambient.intensity=.65+day*1.3;this.stars.visible=day<.35;
  this.scene.background.copy(this.nightSky).lerp(this.daySky,day);this.scene.fog.color.copy(this.scene.background);
  this.renderer.render(this.scene,this.camera);
  return {visualComplete:this.landed===this.cells.length,landed:this.landed,scheduled:this.scheduled,workers:this.workers.length,renderHealthy:this.healthy};
 }
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(w&&h){this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}}
}
