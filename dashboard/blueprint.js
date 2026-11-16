const cache = new Map();
export function cellsFor(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const cells = [];
  for (let y=0;y<15;y++) for (let z=-6;z<=6;z++) for (let x=-6;x<=6;x++) {
    let use = false;
    switch (kind) {
      case 'pyramid': use=y<7&&Math.abs(x)<=6-y&&Math.abs(z)<=6-y;break;
      case 'ziggurat': use=y<8&&Math.abs(x)<=6-Math.floor(y/2)*2&&Math.abs(z)<=6-Math.floor(y/2)*2;break;
      case 'obelisk': use=(y===0&&Math.abs(x)<=3&&Math.abs(z)<=3)||(y<13&&Math.abs(x)<=1&&Math.abs(z)<=1)||(y===13&&x===0&&z===0);break;
      case 'temple': use=(y===0&&Math.abs(x)<=5&&Math.abs(z)<=4)||(y>0&&y<6&&Math.abs(x)<=4&&Math.abs(z)===3&&x%2===0)||(y>=6&&y<9&&Math.abs(x)<=5&&Math.abs(z)<=8-y);break;
      case 'castle': use=(y<4&&(Math.abs(x)===5||Math.abs(z)===5)&&!(z===5&&Math.abs(x)<2&&y<2))||(y<7&&Math.abs(x)>=4&&Math.abs(x)<=5&&Math.abs(z)>=4&&Math.abs(z)<=5)||(y<8&&Math.abs(x)<=2&&Math.abs(z)<=2)||(y===4&&(Math.abs(x)===5||Math.abs(z)===5)&&(x+z)%2===0);break;
      case 'lighthouse': use=(y===0&&x*x+z*z<=16)||(y>0&&y<12&&x*x+z*z<=9&&x*x+z*z>=3)||(y===12&&x*x+z*z<=16)||(y>12&&Math.abs(x)<=1&&Math.abs(z)<=1);break;
    }
    if(use)cells.push({x,y,z,index:cells.length});
  }
  cache.set(kind,cells);
  return cells;
}
export function drawBlueprint(canvas,kind,progress) {
  const key=kind+':'+progress.toFixed(4);
  if(canvas.dataset.frame===key)return;
  canvas.dataset.frame=key;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const {width:w,height:h}=canvas;
  ctx.clearRect(0,0,w,h);
  const project=(x,y,z)=>[w/2+(x-z)*15,h*.72+(x+z)*7-y*17];
  function polygon(points,fill,stroke='#d8be8d') {
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=stroke;ctx.lineWidth=.55;ctx.stroke();
  }
  ctx.globalAlpha=.12;
  for(let n=-9;n<=9;n+=2){const a=project(n,0,-9),b=project(n,0,9),c=project(-9,0,n),d=project(9,0,n);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.moveTo(...c);ctx.lineTo(...d);ctx.strokeStyle='#9eb5c4';ctx.stroke();}
  const cells=cellsFor(kind),visible=Math.floor(progress*cells.length);
  const ordered=[...cells].sort((a,b)=>a.y-b.y||(a.x+a.z)-(b.x+b.z));
  for(const {x,y,z,index}of ordered){
    const solid=index<visible;ctx.globalAlpha=solid?.96:.27;
    const top=[project(x,y+1,z),project(x+1,y+1,z),project(x+1,y+1,z+1),project(x,y+1,z+1)];
    const left=[project(x,y,z+1),project(x+1,y,z+1),project(x+1,y+1,z+1),project(x,y+1,z+1)];
    const right=[project(x+1,y,z),project(x+1,y,z+1),project(x+1,y+1,z+1),project(x+1,y+1,z)];
    polygon(left,solid?'#ad8854':'#324251');polygon(right,solid?'#796344':'#263643');polygon(top,solid?'#e7c98c':'#5b615c');
  }
  ctx.globalAlpha=1;
}
