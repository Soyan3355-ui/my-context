/* 封札モンスターズ — core engine: state, input, rendering, world movement, particles, transitions */
'use strict';
const VW=256,VH=176,TS=16;
const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const fmt=n=>n.toLocaleString('ja-JP');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const OPP={up:'down',down:'up',left:'right',right:'left'};

/* ---------------- save state ---------------- */
const SAVE_KEY='fudamon-slice-v1';
function freshState(){return{v:3,name:'ソーヤ',map:'home',x:6,y:3,dir:'down',coins:300,items:{white:0,silver:0,gold:0,potion:0},cards:[],party:[],dex:{},seen:{},uid:1,flags:{},picked:{},time:0,muted:false}}
let S=freshState();
function hasSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return !!(s&&s.v===3)}catch(e){return false}}
function loadGame(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.v===3){S=s;return true}}catch(e){}return false}
function saveGame(){S.map=G.mapId;S.x=G.p.x;S.y=G.p.y;S.dir=G.p.dir;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}

/* ---------------- monster/card helpers ---------------- */
function mstats(id,lv){const b=MON[id].b;return{hp:Math.floor(b.hp*2*lv/100+lv+10),atk:Math.floor(b.atk*2*lv/100+5),def:Math.floor(b.def*2*lv/100+5),spd:Math.floor(b.spd*2*lv/100+5)}}
const need=lv=>10+lv*6;
function movesOf(id,lv){const m=MON[id];const L=[{...MV.normal,t:'normal'},{...MV[m.t][0],t:m.t}];if(lv>=12||m.r>=3)L.push({...MV[m.t][1],t:m.t,p:m.r===4?100:85});return L}
const card=uid=>S.cards.find(c=>c.uid===uid);
const partyCards=()=>S.party.map(card).filter(Boolean);
const maxHP=c=>mstats(c.id,c.lv).hp;
const sealedCount=()=>Object.keys(S.dex).length;
function hpColor(r){return r>.5?'var(--good)':r>.2?'var(--warn)':'var(--bad)'}
function sellPrice(c){return RAR[MON[c.id].r].sell*(c.v==='gold'?10:c.v==='holo'?3:1)}
function addCard(id,lv,v){const c={uid:S.uid++,id,lv,exp:0,v,hp:0};c.hp=maxHP(c);S.cards.push(c);
  const d=S.dex[id]||(S.dex[id]={n:0,holo:false,gold:false});const isNew=d.n===0;d.n++;if(v==='holo')d.holo=true;if(v==='gold')d.gold=true;S.seen[id]=true;
  if(S.party.length<3)S.party.push(c.uid);return{c,isNew}}
function pickWeighted(ids){const tot=ids.reduce((s,i)=>s+RAR[MON[i].r].w,0);let x=Math.random()*tot;for(const i of ids){x-=RAR[MON[i].r].w;if(x<=0)return i}return ids[ids.length-1]}
function rollVariant(h,g){const x=Math.random();return x<g?'gold':x<g+h?'holo':'normal'}
function healAll(){S.cards.forEach(c=>c.hp=maxHP(c))}

/* ---------------- audio shim ---------------- */
const snd=n=>{try{window.AUDIO&&AUDIO.sfx(n)}catch(e){}};
const bgm=n=>{try{window.AUDIO&&AUDIO.music(n)}catch(e){}};

/* ---------------- input ---------------- */
const Input={held:[],runHeld:false,tap:null,
  press(d){if(!this.held.includes(d))this.held.push(d);this.tap=d},
  release(d){this.held=this.held.filter(x=>x!==d)},
  dir(){return this.held[this.held.length-1]||null}};
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
const UI={stack:[],push(h){this.stack.push(h)},pop(h){this.stack=this.stack.filter(x=>x!==h)},top(){return this.stack[this.stack.length-1]}};
function sendKey(k){
  unlockAudio();
  const h=UI.top();if(h){h(k);return}
  if(G.scene==='world'&&!G.lock){if(k==='a')worldInteract();else if(k==='menu'||k==='b')openMainMenu()}
}
function unlockAudio(){try{window.AUDIO&&AUDIO.unlock()}catch(e){}}
addEventListener('keydown',e=>{
  if(e.target.matches&&e.target.matches('input,textarea'))return;
  const d=KEYMAP[e.key];
  if(e.key==='Shift')Input.runHeld=true;
  if(d){e.preventDefault();if(!e.repeat){Input.press(d);if(UI.top())sendKey(d)}else if(UI.top())sendKey(d);return}
  if(e.repeat)return;
  if(['z','Z','Enter',' '].includes(e.key)){e.preventDefault();sendKey('a')}
  else if(['x','X','Escape','Backspace'].includes(e.key)){e.preventDefault();sendKey('b')}
});
addEventListener('keyup',e=>{const d=KEYMAP[e.key];if(d)Input.release(d);if(e.key==='Shift')Input.runHeld=false});
addEventListener('blur',()=>{Input.held=[];Input.runHeld=false});

/* generic keyboard/touch navigation for HTML button panels */
function navPanel(root,{onBack,onMove}={}){
  let idx=0;
  const items=()=>[...root.querySelectorAll('[data-nav]')].filter(b=>!b.closest('[hidden]'));
  const mark=(i,silent)=>{const L=items();if(!L.length)return;idx=clamp(i,0,L.length-1);L.forEach((b,j)=>b.classList.toggle('sel',j===idx));const el=L[idx];el.scrollIntoView&&el.scrollIntoView({block:'nearest'});if(!silent)snd('cursor');onMove&&onMove(el)};
  const move=dir=>{const L=items();if(!L.length)return;const cur=L[idx]||L[0];const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let best=-1,bd=1e9;L.forEach((b,j)=>{if(j===idx)return;const q=b.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2,dx=x-cx,dy=y-cy;
      const ok=dir==='up'?dy<-4:dir==='down'?dy>4:dir==='left'?dx<-4:dx>4;if(!ok)return;
      const d=(dir==='up'||dir==='down')?Math.abs(dy)+Math.abs(dx)*2.2:Math.abs(dx)+Math.abs(dy)*2.2;if(d<bd){bd=d;best=j}});
    if(best>=0)mark(best)};
  const h=k=>{if(k==='a'){const b=items()[idx];if(b&&!b.disabled){b.click()}else snd('bump')}else if(k==='b'){if(onBack){snd('cancel');onBack()}}else if(DIRS[k])move(k)};
  root.addEventListener('pointerover',e=>{const b=e.target.closest('[data-nav]');if(!b)return;const j=items().indexOf(b);if(j>=0&&j!==idx)mark(j,true)});
  UI.push(h);
  const api={h,refresh(keep){const L=items();const i=keep?Math.min(idx,L.length-1):0;const first=L.findIndex(b=>!b.disabled);mark(keep?i:(first<0?0:first),true)},close(){UI.pop(h)},get idx(){return idx},set(i){mark(i,true)}};
  api.refresh();return api;
}

/* ---------------- runtime ---------------- */
const G={scene:'boot',mapId:'home',map:null,t:0,lock:0,p:{x:6,y:3,dir:'down',moving:false,fx:0,fy:0,tx:0,ty:0,prog:0,step:0,frame:0,run:false,turnT:0,hidden:false},
  npcs:[],fade:0,flash:0,flashCol:'#fff',shake:0,parts:[],amb:[],clouds:[],banner:null,encGrace:0,camX:0,camY:0,title:false};
let base,bctx,view,vctx;
function initCanvas(){
  base=document.createElement('canvas');base.width=VW;base.height=VH;bctx=base.getContext('2d');bctx.imageSmoothingEnabled=false;
  view=$('#view');vctx=view.getContext('2d');
  const fit=()=>{const r=view.getBoundingClientRect();const dpr=Math.min(3,devicePixelRatio||1);const k=Math.max(1,Math.ceil(r.width*dpr/VW));
    if(view.width!==VW*k){view.width=VW*k;view.height=VH*k}vctx.imageSmoothingEnabled=false};
  new ResizeObserver(fit).observe(view);fit();
}
function loadMap(id){
  G.mapId=id;const m=MAPS[id];G.map={id,w:m.rows[0].length,h:m.rows.length,rows:m.rows,name:m.name};
  G.npcs=buildNPCs(id);
  G.amb=[];G.parts=[];
  if(id==='field'){for(let i=0;i<5;i++)G.amb.push(newButterfly());G.clouds=[0,1,2].map(i=>({x:Math.random()*G.map.w*TS,y:Math.random()*G.map.h*TS,r:60+Math.random()*50,v:6+Math.random()*5}))}
  else G.clouds=[];
}
function tileAt(x,y){const m=G.map;if(x<0||y<0||x>=m.w||y>=m.h)return '';return m.rows[y][x]}
function npcAt(x,y){return G.npcs.find(n=>n.vis()&&((n.x===x&&n.y===y)||(n.moving&&n.tx===x&&n.ty===y)))}
function blocked(x,y){const c=tileAt(x,y);if(!c||SOLID.has(c))return true;if(npcAt(x,y))return true;return false}

/* ---------------- world update ---------------- */
function tryMove(dir){
  const p=G.p;
  if(p.dir!==dir&&!p.moving&&p.turnT<=0&&!p.wasMoving){p.dir=dir;p.turnT=.09;return}
  p.dir=dir;
  const [dx,dy]=DIRS[dir],nx=p.x+dx,ny=p.y+dy,c=tileAt(nx,ny);
  if(c==='d'){enterDoor(nx,ny);return}
  if(blocked(nx,ny)){if(!p.bumpT||p.bumpT<=0){snd('bump');p.bumpT=.35}return}
  p.moving=true;p.tx=nx;p.ty=ny;p.prog=0;p.step++;p.run=Input.runHeld||TouchPad.run;
}
function updatePlayer(dt){
  const p=G.p;p.turnT-=dt;p.bumpT=(p.bumpT||0)-dt;
  if(p.moving){
    const sp=p.run?8.5:4.6;p.prog+=dt*sp;
    p.frame=p.prog<.5?(p.step%2?1:2):0;
    if(p.run&&Math.random()<dt*14)dust(p.x*TS+8+(p.tx-p.x)*TS*p.prog,p.y*TS+15+(p.ty-p.y)*TS*p.prog);
    if(p.prog>=1){p.x=p.tx;p.y=p.ty;p.moving=false;p.prog=0;p.frame=0;p.wasMoving=true;onStep();}
  }
  if(!p.moving&&!G.lock&&!UI.top()&&G.scene==='world'){const d=Input.dir()||Input.tap;Input.tap=null;if(d)tryMove(d);else p.wasMoving=false}else if(UI.top()||G.lock)Input.tap=null
}
function onStep(){
  const p=G.p,c=tileAt(p.x,p.y);
  if(c==='z'){const w=WARPS[G.mapId+':'+p.x+','+p.y];if(w){warp(w);return}}
  if(c==='"'){snd('grass');for(let i=0;i<5;i++)G.parts.push({x:p.x*TS+8,y:p.y*TS+10,vx:(Math.random()-.5)*40,vy:-20-Math.random()*30,ay:90,life:.5,max:.5,size:2,color:Math.random()<.5?'#3f8f45':'#7ccf64',shape:'leaf',rot:Math.random()*6,vr:(Math.random()-.5)*10})}
  else if(!p.run)snd('step');
  const nm=areaAt(G.mapId,p.y);if(nm!==G.areaName){G.areaName=nm;showBanner(nm);updateBGM()}
  if(checkTrainers())return;
  if(checkTriggers())return;
  G.encGrace--;
  if(c==='"'&&S.flags.starter&&G.encGrace<=0&&Math.random()<1/8){const e=encAt(G.mapId,p.y);if(e){G.encGrace=3;wildEncounter(e)}}
}
function updateBGM(){
  if(G.scene!=='world')return;
  if(G.mapId!=='field'){bgm('village');return}
  const y=G.p.y;bgm(y<=11?'shrine':y<=44?'route':'village');
}
async function enterDoor(x,y){
  const w=WARPS[G.mapId+':'+x+','+y];
  if(!w){G.lock++;await say('カギが かかっている。<br>中から いびきが 聞こえる…。');G.lock--;return}
  G.p.dir='up';warp(w);
}
async function warp(w){
  G.lock++;snd('door');await fadeTo(1,.22);
  loadMap(w.map);G.p.x=w.x;G.p.y=w.y;G.p.dir=w.dir;G.p.moving=false;G.areaName=areaAt(w.map,w.y);updateBGM();
  showBanner(G.areaName);saveGame();
  await fadeTo(0,.25);G.lock--;
  checkTriggers();
}
function fadeTo(v,dur){return new Promise(r=>{const s=G.fade,t0=performance.now();const f=()=>{const k=Math.min(1,(performance.now()-t0)/(dur*1000));G.fade=lerp(s,v,k);if(k<1)requestAnimationFrame(f);else r()};f()})}
function showBanner(n){const b=$('#banner');if(!b)return;b.textContent=n;b.classList.remove('show');void b.offsetWidth;b.classList.add('show')}
function facingTile(){const [dx,dy]=DIRS[G.p.dir];return[G.p.x+dx,G.p.y+dy]}
function worldInteract(){
  if(G.p.moving)return;
  const [x,y]=facingTile();const n=npcAt(x,y);
  if(n&&n.talk){G.lock++;snd('confirm');n.dir=OPP[G.p.dir];Promise.resolve(n.talk(n)).finally(()=>{G.lock--});return}
  const c=tileAt(x,y);const ex=examine(c,x,y);
  if(ex){G.lock++;Promise.resolve(ex()).finally(()=>{G.lock--})}
}

/* NPC movement for cutscenes */
function moveNPC(n,dir,steps=1,speed=4.2){return new Promise(async res=>{for(let i=0;i<steps;i++){const [dx,dy]=DIRS[dir];n.dir=dir;n.tx=n.x+dx;n.ty=n.y+dy;n.moving=true;n.prog=0;n.step=(n.step||0)+1;n.speed=speed;await new Promise(r=>n.done=r)}res()})}
function movePlayer(dir,steps=1){return new Promise(async res=>{for(let i=0;i<steps;i++){const p=G.p,[dx,dy]=DIRS[dir];p.dir=dir;p.tx=p.x+dx;p.ty=p.y+dy;p.moving=true;p.prog=0;p.step++;p.run=false;
  await new Promise(r=>{const chk=()=>{if(!p.moving)r();else requestAnimationFrame(chk)};requestAnimationFrame(chk)})}res()})}
function updateNPCs(dt){for(const n of G.npcs){if(!n.moving){if(n.idle&&!G.lock&&G.scene==='world'){n.idleT=(n.idleT||2+Math.random()*3)-dt;if(n.idleT<=0){n.idleT=2+Math.random()*4;const d=['up','down','left','right'][rnd(0,3)];n.dir=d}}continue}
  n.prog+=dt*(n.speed||4.2);n.frame=n.prog<.5?(n.step%2?1:2):0;if(n.prog>=1){n.x=n.tx;n.y=n.ty;n.moving=false;n.frame=0;const d=n.done;n.done=null;d&&d()}}}

/* ---------------- particles & ambience ---------------- */
function dust(x,y){G.parts.push({x,y,vx:(Math.random()-.5)*16,vy:-6-Math.random()*8,ay:0,life:.4,max:.4,size:2+Math.random()*2,color:'rgba(235,220,190,.8)',shape:'circle',grow:6})}
function newButterfly(){const m=G.map;let x,y,tries=0;do{x=rnd(3,m.w-4);y=rnd(10,m.h-3);tries++}while(tileAt(x,y)!==','&&tileAt(x,y)!=='.'&&tries<60);
  return{x:x*TS+8,y:y*TS+8,hx:x*TS+8,hy:y*TS+8,ph:Math.random()*9,c:['#fff6d8','#ffd0e6','#cfe8ff','#ffe38a'][rnd(0,3)]}}
function updateParts(list,dt){for(let i=list.length-1;i>=0;i--){const q=list[i];q.life-=dt;if(q.life<=0){list.splice(i,1);continue}q.vx+=(q.ax||0)*dt;q.vy+=(q.ay||0)*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.vr)q.rot+=q.vr*dt;if(q.drag){q.vx*=1-q.drag*dt;q.vy*=1-q.drag*dt}}}
function drawParts(ctx,list,ox=0,oy=0){for(const q of list){const a=q.fade===false?1:clamp(q.life/q.max,0,1);ctx.globalAlpha=a;ctx.fillStyle=q.color;const x=q.x-ox,y=q.y-oy,s=q.size+(q.grow||0)*(1-q.life/q.max);
  if(q.shape==='circle'){ctx.beginPath();ctx.arc(x,y,s/2,0,7);ctx.fill()}
  else if(q.shape==='ring'){ctx.strokeStyle=q.color;ctx.lineWidth=q.lw||2;ctx.beginPath();ctx.arc(x,y,s,0,7);ctx.stroke()}
  else if(q.shape==='leaf'||q.shape==='rect'){ctx.save();ctx.translate(x,y);ctx.rotate(q.rot||0);ctx.fillRect(-s,-s/2,s*2,s);ctx.restore()}
  else if(q.shape==='star'){ctx.save();ctx.translate(x,y);ctx.rotate(q.rot||0);ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.4:s;const an=i*Math.PI/4;ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r)}ctx.fill();ctx.restore()}
  else ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(s),Math.ceil(s))}ctx.globalAlpha=1}

/* ---------------- render ---------------- */
function nbFn(x,y){return(dx,dy)=>tileAt(x+dx,y+dy)}
function renderWorld(t){
  const ctx=bctx,m=G.map,p=G.p;
  const ppx=(p.moving?lerp(p.x,p.tx,p.prog):p.x)*TS,ppy=(p.moving?lerp(p.y,p.ty,p.prog):p.y)*TS;
  let cx,cy;
  if(G.cam){cx=G.cam.x;cy=G.cam.y}else{
    cx=m.w*TS<=VW?(m.w*TS-VW)/2:clamp(ppx+8-VW/2,0,m.w*TS-VW);
    cy=m.h*TS<=VH?(m.h*TS-VH)/2:clamp(ppy+8-VH/2,0,m.h*TS-VH)}
  cx=Math.round(cx);cy=Math.round(cy);G.camX=cx;G.camY=cy;
  ctx.fillStyle=G.mapId==='field'?'#2d4a2a':'#120f1c';ctx.fillRect(0,0,VW,VH);
  const x0=Math.max(0,Math.floor(cx/TS)),y0=Math.max(0,Math.floor(cy/TS)),x1=Math.min(m.w-1,Math.floor((cx+VW)/TS)),y1=Math.min(m.h-1,Math.floor((cy+VH)/TS)+1);
  const P=window.PIX;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let c=m.rows[y][x];const px=x*TS-cx,py=y*TS-cy;
    if(P){if(c==='J'){P.drawTile(ctx,':',px,py,t,nbFn(x,y),x,y)}else P.drawTile(ctx,c,px,py,t,nbFn(x,y),x,y)}
    else{ctx.fillStyle=SOLID.has(c)?'#3d6b3a':'#8fcf7a';ctx.fillRect(px,py,TS,TS)}}
  // items
  for(const it of ITEMSPOTS[G.mapId]||[]){if(S.picked[it.id])continue;const px=it.x*TS-cx,py=it.y*TS-cy;if(px<-16||py<-16||px>VW||py>VH)continue;P&&P.drawItem(ctx,px,py,t)}
  // characters sorted by y
  const ents=G.npcs.filter(n=>n.vis()).map(n=>({id:n.sprite,dir:n.dir,frame:n.frame||0,x:(n.moving?lerp(n.x,n.tx,n.prog):n.x)*TS,y:(n.moving?lerp(n.y,n.ty,n.prog):n.y)*TS,n}));
  if(!p.hidden)ents.push({id:'hero',dir:p.dir,frame:p.frame,x:ppx,y:ppy});
  ents.sort((a,b)=>a.y-b.y);
  for(const e of ents){const px=Math.round(e.x-cx),py=Math.round(e.y-cy);if(px<-20||py<-24||px>VW+4||py>VH+4)continue;
    if(P)P.drawChar(ctx,e.id,e.dir,e.frame,px,py);else{ctx.fillStyle=e.id==='hero'?'#d33':'#36c';ctx.fillRect(px+3,py-2,10,16)}
    if(e.n&&e.n.alert&&P)P.drawAlert(ctx,px,py)}
  if(P)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=m.rows[y][x];P.drawOverlay(ctx,c,x*TS-cx,y*TS-cy,t,nbFn(x,y),x,y)}
  drawParts(ctx,G.parts,cx,cy);
  // ambience
  if(G.mapId==='field'){
    for(const b of G.amb){const x=b.x-cx,y=b.y-cy;if(x<-4||y<-4||x>VW+4||y>VH+4)continue;const open=Math.sin(t*14+b.ph)>0;ctx.fillStyle=b.c;
      if(open){ctx.fillRect(Math.round(x)-2,Math.round(y),2,2);ctx.fillRect(Math.round(x)+1,Math.round(y),2,2)}else ctx.fillRect(Math.round(x)-1,Math.round(y),3,1);
      ctx.fillStyle='#3a2b2b';ctx.fillRect(Math.round(x),Math.round(y),1,2)}
    ctx.fillStyle='rgba(20,30,60,.10)';for(const c of G.clouds){const x=((c.x+t*c.v)%(m.w*TS+240))-120-cx,y=c.y-cy;ctx.beginPath();ctx.ellipse(x,y,c.r,c.r*.55,0,0,7);ctx.ellipse(x+c.r*.6,y+8,c.r*.7,c.r*.4,0,0,7);ctx.fill()}
    if(p.y<=17){// shrine motes
      for(let i=0;i<14;i++){const sx=((i*53.7+t*6*(1+i%3))%(VW+20))-10,sy=VH-((i*37.1+t*(8+i%5*3))%(VH+20));const a=.35+.35*Math.sin(t*2+i);ctx.fillStyle=`rgba(255,244,200,${a})`;ctx.fillRect(Math.round(sx),Math.round(sy),1+(i%3===0),1+(i%3===0))}}
  }else{for(let i=0;i<10;i++){const sx=((i*41.3+t*3)%VW),sy=((i*29.7+Math.sin(t*.5+i)*10+t*2)%VH);ctx.fillStyle='rgba(255,240,210,.35)';ctx.fillRect(Math.round(sx),Math.round(sy),1,1)}}
  // light grading
  const bgc=G.mapId==='field'?(p.y<=11?'rgba(120,80,170,.10)':p.y<=17?'rgba(90,90,170,.07)':null):'rgba(255,170,90,.06)';
  if(bgc){ctx.fillStyle=bgc;ctx.fillRect(0,0,VW,VH)}
  const g=ctx.createRadialGradient(VW/2,VH/2,VH*.45,VW/2,VH/2,VW*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(10,8,30,.35)');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
}
function present(){
  const k=view.width/VW;let sx=0,sy=0;
  if(G.shake>0){sx=(Math.random()-.5)*G.shake*2;sy=(Math.random()-.5)*G.shake*2}
  vctx.imageSmoothingEnabled=false;vctx.drawImage(base,Math.round(sx*k),Math.round(sy*k),view.width,view.height);
  if(G.flash>0){vctx.globalAlpha=G.flash;vctx.fillStyle=G.flashCol;vctx.fillRect(0,0,view.width,view.height);vctx.globalAlpha=1}
  if(G.fade>0){vctx.globalAlpha=G.fade;vctx.fillStyle='#0b0a18';vctx.fillRect(0,0,view.width,view.height);vctx.globalAlpha=1}
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;G.t+=dt;
  if(G.scene==='title'&&G.cam&&G.map){G.cam.y=clamp(46*TS-(G.t*5)%(40*TS),0,G.map.h*TS-VH);G.cam.x=(G.map.w*TS-VW)/2+Math.sin(G.t*.2)*40}
  if(G.scene==='world'||G.scene==='title'){if(G.scene==='world'){S.time+=dt;updatePlayer(dt)}updateNPCs(dt);updateParts(G.parts,dt);
    for(const b of G.amb){b.ph+=dt;b.x=b.hx+Math.sin(G.t*.7+b.ph)*18;b.y=b.hy+Math.sin(G.t*1.3+b.ph*2)*8}
    if(G.map)renderWorld(G.t)}
  G.shake=Math.max(0,G.shake-dt*30);G.flash=Math.max(0,G.flash-dt*3);
  if(G.map)present();
  requestAnimationFrame(frame);
}

/* ---------------- battle transition (card shutter) ---------------- */
function cardShutter(cover=true){
  const cv=$('#trans'),ctx=cv.getContext('2d');const r=cv.getBoundingClientRect();cv.width=Math.round(r.width);cv.height=Math.round(r.height);cv.hidden=false;
  const cols=8,rows=5,cw=cv.width/cols,ch=cv.height/rows,dur=RM?.05:.55;const t0=performance.now();
  return new Promise(res=>{const f=()=>{const k=(performance.now()-t0)/1000/dur;ctx.clearRect(0,0,cv.width,cv.height);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const d=(Math.abs(i-cols/2+.5)+Math.abs(j-rows/2+.5))/(cols/2+rows/2);let s=clamp((k*1.6-d*.6),0,1);if(!cover)s=1-clamp((k*1.6-(1-d)*.6),0,1);
      if(s<=0)continue;const x=i*cw+cw/2,y=j*ch+ch/2;ctx.save();ctx.translate(x,y);ctx.rotate((1-s)*1.2);ctx.scale(s,s);
      ctx.fillStyle='#232760';ctx.fillRect(-cw/2-1,-ch/2-1,cw+2,ch+2);ctx.strokeStyle='#e6b34f';ctx.lineWidth=2;ctx.strokeRect(-cw/2+4,-ch/2+4,cw-8,ch-8);
      ctx.fillStyle='#e6b34f';ctx.font=`${Math.round(ch*.36)}px "Dela Gothic One",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('封',0,1);ctx.restore()}
    if(k<1)requestAnimationFrame(f);else{if(!cover){ctx.clearRect(0,0,cv.width,cv.height);cv.hidden=true}res()}};f()});
}
