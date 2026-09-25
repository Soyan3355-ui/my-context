/* 封札モンスターズ — battle system with game-feel effects */
'use strict';
let B=null;
const BFX={parts:[],cv:null,ctx:null,raf:0};

function bfxStart(){BFX.cv=$('#bfx');BFX.ctx=BFX.cv.getContext('2d');const r=BFX.cv.getBoundingClientRect();BFX.cv.width=Math.round(r.width);BFX.cv.height=Math.round(r.height);BFX.parts=[];
  let lt=performance.now();const f=now=>{const dt=Math.min(.05,(now-lt)/1000);lt=now;if(!B)return;if(!B.freeze)updateParts(BFX.parts,dt);const c=BFX.ctx;c.clearRect(0,0,BFX.cv.width,BFX.cv.height);drawParts(c,BFX.parts);BFX.raf=requestAnimationFrame(f)};BFX.raf=requestAnimationFrame(f)}
function bfxStop(){cancelAnimationFrame(BFX.raf);BFX.parts=[]}
function center(el){const r=el.getBoundingClientRect(),b=BFX.cv.getBoundingClientRect();return{x:r.left-b.left+r.width/2,y:r.top-b.top+r.height/2,w:r.width,h:r.height}}
function U(side){
  if(side==='foe'){const e=B.foe;return{m:MON[e.id],lv:e.lv,st:e.st,hp:e.hp,set:v=>{e.hp=v}}}
  const c=card(B.active);return{m:MON[c.id],lv:c.lv,st:mstats(c.id,c.lv),hp:c.hp,set:v=>{c.hp=v}}
}
const bmon=side=>$(side==='foe'?'#bF':'#bM');

/* ---------- messages ---------- */
function bsay(text,ms){const el=$('#bmsg');const toks=tokenize(text);let acc='',i=0,shown=0;const t0=performance.now();
  return new Promise(res=>{let done=false,tm=0;const end=()=>{if(done)return;done=true;UI.pop(h);clearTimeout(tm);res()};
    const tick=()=>{if(done)return;const want=Math.floor((performance.now()-t0)/1000*60);while(shown<want&&i<toks.length){const t=toks[i++];acc+=t;if(t[0]!=='<'){shown++;if(shown%3===0)snd('blip')}}el.innerHTML=acc;
      if(i>=toks.length){el.innerHTML=acc+'<i class="caret"></i>';tm=setTimeout(end,ms!=null?ms:Math.max(700,380+text.length*30));return}requestAnimationFrame(tick)};
    const h=k=>{if(k!=='a'&&k!=='b')return;if(i<toks.length){acc=toks.join('');i=toks.length;el.innerHTML=acc+'<i class="caret"></i>';clearTimeout(tm);tm=setTimeout(end,ms!=null?Math.min(ms,500):500);return}end()};
    UI.push(h);tick()})}

/* ---------- HUD ---------- */
function plateHTML(side){const u=U(side),r=u.hp/u.st.hp,sealed=side==='foe'&&S.dex[u.m.id];
  return `<div class="nm"><span>${u.m.name}${sealed?'<i class="sealmark" title="封印済み">封</i>':''}</span><span class="lv">Lv${u.lv}</span></div>
  <div class="hpl"><b>HP</b><span class="bar"><i style="width:${r*100}%;background:${hpColor(r)}"></i></span></div>
  ${side==='me'?`<div class="hpn"><span class="tchip" style="--c:${TYPES[u.m.t].c}">${TYPES[u.m.t].n}</span><span>${u.hp}/${u.st.hp}</span></div><span class="bar exp"><i style="width:${card(B.active).exp/need(u.lv)*100}%"></i></span>`:`<div class="hpn"><span class="tchip" style="--c:${TYPES[u.m.t].c}">${TYPES[u.m.t].n}</span>${B.trainer?`<span class="balls">${B.team.map((t,i)=>`<i class="${i<B.teamIdx?'down':''}"></i>`).join('')}</span>`:''}</div>`}`}
function hud(full){if(!B)return;for(const side of['foe','me']){const el=$(side==='foe'?'#pF':'#pM');const u=U(side);
  if(full||!el.firstChild){el.innerHTML=plateHTML(side);continue}
  const r=u.hp/u.st.hp,bi=el.querySelector('.hpl .bar>i');bi.style.width=r*100+'%';bi.style.background=hpColor(r);
  if(side==='me'){const n=el.querySelector('.hpn span:last-child');countTo(n,u.hp,u.st.hp);el.querySelector('.bar.exp>i').style.width=card(B.active).exp/need(u.lv)*100+'%'}}}
function countTo(el,v,mx){const from=parseInt(el.textContent)||0;const t0=performance.now();const f=()=>{const k=Math.min(1,(performance.now()-t0)/550);el.textContent=`${Math.round(lerp(from,v,k))}/${mx}`;if(k<1)requestAnimationFrame(f)};f()}

/* ---------- effects ---------- */
function shake(px,ms=260){const el=$('#battle .bt');if(RM||!el)return;el.animate([{transform:'translate(0,0)'},{transform:`translate(${px}px,${-px*.6}px)`},{transform:`translate(${-px}px,${px*.5}px)`},{transform:`translate(${px*.6}px,${px*.4}px)`},{transform:'translate(0,0)'}],{duration:ms})}
function flashScreen(col='#fff',a=.8,ms=180){const f=$('#bflash');f.style.background=col;f.animate([{opacity:a},{opacity:0}],{duration:RM?1:ms})}
const TFX={
  fire:{cols:['#ff9a3c','#ffd23f','#ff5d2a'],shape:'circle',grav:-80},
  water:{cols:['#4fb3ff','#bfe6ff','#2f7fe0'],shape:'circle',grav:260},
  grass:{cols:['#7fd36e','#3f9f58','#c3ea8e'],shape:'leaf',grav:60},
  thunder:{cols:['#fff27a','#ffd23f','#ffffff'],shape:'rect',grav:0},
  dark:{cols:['#7a5ad6','#2b2160','#b9a6ff'],shape:'circle',grav:-40,grow:14},
  light:{cols:['#ffffff','#ffc6e0','#fff3b0'],shape:'star',grav:-30},
  normal:{cols:['#ffffff','#e8e6f2'],shape:'ring',grav:0}
};
function burst(x,y,t,n,power=1){const T=TFX[t]||TFX.normal;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(60+Math.random()*200)*power;
  BFX.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ay:T.grav,drag:3,life:.35+Math.random()*.45,max:.8,size:(T.shape==='ring'?6:3)+Math.random()*5*power,grow:T.grow||(T.shape==='ring'?22:0),lw:3,color:T.cols[i%T.cols.length],shape:T.shape,rot:a,vr:(Math.random()-.5)*14})}}
async function projectile(from,to,t){const T=TFX[t]||TFX.normal;const dur=RM?1:300;const t0=performance.now();
  await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/dur);const x=lerp(from.x,to.x,k),y=lerp(from.y,to.y,k)-Math.sin(k*Math.PI)*24;
    for(let i=0;i<3;i++)BFX.parts.push({x:x+(Math.random()-.5)*10,y:y+(Math.random()-.5)*10,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,ay:0,life:.28,max:.28,size:4+Math.random()*5,color:T.cols[i%T.cols.length],shape:T.shape==='ring'?'circle':T.shape,rot:Math.random()*6});
    if(k<1)requestAnimationFrame(f);else res()};f()})}
function popup(side,txt,cls=''){const el=bmon(side),bt=$('#battle .bt');const r=el.getBoundingClientRect(),br=bt.getBoundingClientRect();
  const p=document.createElement('div');p.className='dmg '+cls;p.textContent=txt;p.style.left=(r.left-br.left+r.width*.5)+'px';p.style.top=(r.top-br.top+r.height*.25)+'px';bt.appendChild(p);
  p.animate([{transform:'translate(-50%,0) scale(.6)',opacity:0},{transform:'translate(-50%,-14px) scale(1.25)',opacity:1,offset:.2},{transform:'translate(-50%,-26px) scale(1)',opacity:1,offset:.7},{transform:'translate(-50%,-40px) scale(1)',opacity:0}],{duration:RM?300:1000,easing:'ease-out'}).onfinish=()=>p.remove()}

/* ---------- scene build ---------- */
function trainerCanvas(sprite){const c=document.createElement('canvas');c.width=16;c.height=20;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(window.PIX)PIX.drawChar(x,sprite,'down',0,0,4);c.className='trn';return c}
function buildScene(bg){
  const el=$('#battle');
  el.innerHTML=`<div class="bt" style="--g1:${bg.bg[0]};--g2:${bg.bg[1]};--fl:${bg.floor}">
  <div class="bt-sky"><i class="cl a"></i><i class="cl b"></i><i class="hill"></i></div>
  <div class="bt-plat f"></div><div class="bt-plat m"></div>
  <div class="bt-mon f" id="bF"><div class="inner"></div></div>
  <div class="bt-mon m" id="bM"><div class="inner"></div></div>
  <div class="bt-trn" id="bT"></div>
  <div class="plate f" id="pF"></div><div class="plate m" id="pM"></div>
  <canvas class="bt-fx" id="bfx"></canvas><div class="bflash" id="bflash"></div>
  <div class="bt-bottom"><div class="bt-msg" id="bmsg"></div><div class="bt-cmd" id="bcmd" hidden></div></div></div>`;
  el.hidden=false;
}
function setMon(side,id){const inner=bmon(side).querySelector('.inner');inner.innerHTML=art(MON[id]);inner.className='inner bob'}

/* ---------- commands ---------- */
let cmdNav=null;
function showCmd(){
  return new Promise(res=>{
    const el=$('#bcmd');el.hidden=false;
    const render=menu=>{let h='';const me=U('me');
      if(menu==='main'){const fc=S.items.white+S.items.silver+S.items.gold;
        h=`<button class="cb" data-nav data-c="fight"><b>たたかう</b><small>技で弱らせる</small></button>
        <button class="cb shu" data-nav data-c="bag"><b>封札・どうぐ</b><small>${B.trainer?'回復の香':`封札 ${fc}枚`}</small></button>
        <button class="cb" data-nav data-c="party"><b>なかま</b><small>カードを交代</small></button>
        <button class="cb" data-nav data-c="run" ${B.trainer?'disabled':''}><b>にげる</b><small>${B.trainer?'逃げられない':'戦いをやめる'}</small></button>`}
      else if(menu==='fight'){h=movesOf(me.m.id,me.lv).map((x,i)=>{const e=eff(x.t,MON[B.foe.id].t);return `<button class="cb" data-nav data-m="${i}"><b>${x.n}</b><small><span class="tchip" style="--c:${TYPES[x.t].c}">${TYPES[x.t].n}</span> 威力${x.p}${e>1?'<em class="good">ばつぐん</em>':e<1?'<em class="bad">いまひとつ</em>':''}</small></button>`}).join('')}
      else if(menu==='bag'){h=['white','silver','gold'].map(k=>`<button class="cb" data-nav data-s="${k}" ${S.items[k]&&!B.trainer?'':'disabled'}><b><span class="fchip" style="--fc:${ITEMS[k].fc}"></span>${ITEMS[k].n.replace('の封札','')}<span class="rate">${B.trainer?'—':Math.round(sealRate(k)*100)+'%'}</span></b><small>のこり ${S.items[k]}枚</small></button>`).join('')+
        `<button class="cb" data-nav data-p ${S.items.potion&&me.hp<me.st.hp?'':'disabled'}><b>回復の香</b><small>HP半分回復・${S.items.potion}個</small></button>`}
      else if(menu==='party'){const L=partyCards().filter(c=>c.uid!==B.active);h=L.map(c=>`<button class="cb" data-nav data-u="${c.uid}" ${c.hp>0?'':'disabled'}><b>${MON[c.id].name}</b><small>Lv${c.lv}・HP ${c.hp}/${maxHP(c)}</small></button>`).join('')||'<p class="cb-empty">交代できるカードがいない</p>'}
      const canBack=menu!=='main'&&!(menu==='party'&&B.forced);
      el.innerHTML=`${canBack?'<button class="cb-back" data-nav data-back>もどる</button>':''}<div class="cb-grid">${h}</div>`;
      if(cmdNav)cmdNav.close();cmdNav=navPanel(el,{onBack:canBack?()=>render('main'):null});
      const fin=v=>{cmdNav.close();cmdNav=null;el.hidden=true;res(v)};
      el.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');const c=b.dataset.c;if(c==='run')fin({k:'run'});else render(c)}));
      el.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');fin({k:'move',i:+b.dataset.m})}));
      el.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');fin({k:'seal',s:b.dataset.s})}));
      el.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');fin({k:'potion'})}));
      el.querySelectorAll('[data-u]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');fin({k:'switch',u:+b.dataset.u})}));
      const bk=el.querySelector('[data-back]');bk&&bk.addEventListener('click',()=>{snd('cancel');render('main')});
      if(menu==='main'&&B.lastMain!=null)cmdNav.set(B.lastMain);
      else if(menu!=='main'){const L=[...el.querySelectorAll('[data-nav]')];const f=L.findIndex(b=>!b.hasAttribute('data-back')&&!b.disabled);cmdNav.set(f<0?0:f)}
      el.querySelectorAll('[data-c]').forEach((b,i)=>b.addEventListener('click',()=>{B.lastMain=i}));
    };
    render(B.forced?'party':'main');
  });
}
function sealRate(k){const e=B.foe;const r=e.hp/e.st.hp;return clamp((1-.72*r)*ITEMS[k].mul*RAR[MON[e.id].r].seal,.03,.97)}

/* ---------- actions ---------- */
function pickFoeMove(){const L=movesOf(B.foe.id,B.foe.lv);
  if(B.trainer&&Math.random()<(B.trainer.smart||.6)){const me=U('me');let best=L[0],bv=0;for(const m of L){const v=m.p*eff(m.t,me.m.t)*(m.t===MON[B.foe.id].t?1.2:1);if(v>bv){bv=v;best=m}}return best}
  if(B.trainer&&B.trainer.gentle&&Math.random()<.6)return L[0];
  if(L.length>2&&Math.random()<.35)return L[2];return L[rnd(0,L.length-1)]}
async function attack(side,mv){
  const other=side==='me'?'foe':'me',A=U(side),D=U(other);
  await bsay(`${side==='foe'?(B.trainer?'あいての ':'野生の '):''}${A.m.name}の ${mv.n}！`,420);
  const ae=bmon(side),de=bmon(other),dx=side==='me'?1:-1;
  ae.animate([{transform:'translate(0,0)'},{transform:`translate(${-dx*6}px,${dx*3}px)`,offset:.3},{transform:`translate(${dx*22}px,${-dx*12}px)`,offset:.6},{transform:'translate(0,0)'}],{duration:RM?1:360,easing:'ease-in-out'});
  await sleep(RM?0:180);
  if(mv.t!=='normal')await projectile(center(ae),center(de),mv.t);
  if(Math.random()>mv.acc){await bsay('しかし こうげきは はずれた！',600);return}
  const e=eff(mv.t,D.m.t),stab=mv.t===A.m.t?1.2:1,crit=Math.random()<.0625?1.5:1;
  const base=((2*A.lv/5+2)*mv.p*A.st.atk/Math.max(1,D.st.def))/50+2;
  const dmg=Math.max(1,Math.floor(base*stab*e*crit*(.85+Math.random()*.15)));
  // impact: hit-stop + flash + shake + particles
  const inner=de.querySelector('.inner');const c=center(de);
  B.freeze=true;inner.classList.add('hitflash');inner.style.animationPlayState='paused';
  burst(c.x,c.y,mv.t,e>1?34:20,e>1?1.4:1);
  snd(crit>1?'crit':e>1?'hitSuper':e<1?'hitWeak':'hit');
  if(e>1||crit>1){flashScreen(e>1?'#fff':'#ffe9a0',.55);shake(9,340)}else shake(4,220);
  await sleep(RM?0:(e>1||crit>1?140:85));
  B.freeze=false;inner.classList.remove('hitflash');inner.style.animationPlayState='';
  de.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${dx*10}px)`,opacity:.35},{transform:`translateX(${-dx*6}px)`,opacity:1},{transform:`translateX(${dx*4}px)`,opacity:.35},{transform:'translateX(0)',opacity:1}],{duration:RM?1:380});
  D.set(Math.max(0,D.hp-dmg));popup(other,dmg,(e>1?'super ':'')+(crit>1?'crit':''));hud();await sleep(RM?0:520);
  if(crit>1)await bsay('きゅうしょに あたった！',600);
  if(e>1)await bsay('こうかは ばつぐんだ！',650);else if(e<1)await bsay('こうかは いまひとつのようだ…',650);
}
async function faintAnim(side){const el=bmon(side);snd('faint');const c=center(el);burst(c.x,c.y+c.h*.2,'normal',10,.6);
  await el.animate([{transform:'translateY(0)',opacity:1,filter:'none'},{transform:'translateY(10px)',opacity:1,filter:'brightness(.4) saturate(0)',offset:.3},{transform:'translateY(60px)',opacity:0,filter:'brightness(.4) saturate(0)'}],{duration:RM?1:600,fill:'forwards'}).finished}
async function sendOut(side,id,byTrainer){
  const el=bmon(side);el.getAnimations().forEach(a=>a.cancel());setMon(side,id);
  const c=center(el);snd('flip');
  // card that bursts into the monster
  const cd=document.createElement('div');cd.className='sendcard';cd.innerHTML=backHTML();$('#battle .bt').appendChild(cd);
  const bt=$('#battle .bt').getBoundingClientRect(),er=el.getBoundingClientRect();
  const x=er.left-bt.left+er.width/2,y=er.top-bt.top+er.height*.55;
  const sx=side==='me'?-40:bt.width+40,sy=side==='me'?bt.height:-20;
  await cd.animate([{transform:`translate(${sx}px,${sy}px) translate(-50%,-50%) rotate(-200deg) scale(.6)`},{transform:`translate(${x}px,${y}px) translate(-50%,-50%) rotate(0) scale(1)`}],{duration:RM?1:420,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'}).finished;
  cd.animate([{transform:`translate(${x}px,${y}px) translate(-50%,-50%) scale(1)`,opacity:1},{transform:`translate(${x}px,${y}px) translate(-50%,-50%) scale(1.8)`,opacity:0}],{duration:RM?1:260,fill:'forwards'}).onfinish=()=>cd.remove();
  flashScreen('#fff',.6,200);snd('whoosh');burst(c.x,c.y,MON[id].t,22,1.1);
  await el.animate([{transform:'scale(.1)',opacity:0,filter:'brightness(5)'},{transform:'scale(1.12)',opacity:1,filter:'brightness(1.6)',offset:.6},{transform:'scale(1)',opacity:1,filter:'none'}],{duration:RM?1:420,easing:'ease-out'}).finished;
  hud(true);
}

/* ---------- sealing ---------- */
async function doSeal(k){
  S.items[k]--;const I=ITEMS[k],e=B.foe,m=MON[e.id],p=sealRate(k);
  await bsay(`${S.name}は ${I.n}を 投げた！`,380);
  const bt=$('#battle .bt'),btr=bt.getBoundingClientRect(),fe=bmon('foe'),fr=fe.getBoundingClientRect();
  const fly=document.createElement('div');fly.className='flycard';fly.innerHTML=`<div class="fc" style="--fc:${I.fc}"><span>封</span></div>`;bt.appendChild(fly);
  const x0=btr.width*.12,y0=btr.height*.85,x1=fr.left-btr.left+fr.width/2,y1=fr.top-btr.top+fr.height*.55;
  const at=(x,y,extra='')=>`translate(${x}px,${y}px) translate(-50%,-50%) ${extra}`;
  snd('throw');
  await fly.animate([{transform:at(x0,y0,'rotate(0) scale(.7)')},{transform:at((x0+x1)/2,Math.min(y0,y1)-btr.height*.28,'rotate(400deg) scale(1)')},{transform:at(x1,y1,'rotate(720deg) scale(1)')}],{duration:RM?1:620,easing:'cubic-bezier(.25,.6,.4,1)',fill:'forwards'}).finished;
  // swirl in
  snd('swirl');const c=center(fe);
  for(let i=0;i<36;i++){const a=Math.random()*Math.PI*2,r=40+Math.random()*50;BFX.parts.push({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,vx:-Math.cos(a)*r*3,vy:-Math.sin(a)*r*3,ay:0,life:.33,max:.33,size:2+Math.random()*3,color:TFX[m.t].cols[i%3],shape:'circle'})}
  const inner=fe.querySelector('.inner');
  const suck=fe.animate([{transform:'scale(1) rotate(0)',filter:'brightness(1)',opacity:1},{transform:'scale(.05) rotate(40deg)',filter:'brightness(6)',opacity:0}],{duration:RM?1:480,easing:'ease-in',fill:'forwards'});
  await suck.finished;flashScreen('#fff',.5,160);
  await fly.animate([{transform:at(x1,y1,'scale(1)')},{transform:at(x1,y1+btr.height*.1,'scale(1)')}],{duration:RM?1:240,easing:'cubic-bezier(.5,0,.8,1.4)',fill:'forwards'}).finished;
  const y2=y1+btr.height*.1;
  let ok=true,stage=0;const each=Math.pow(p,1/3);
  for(stage=0;stage<3;stage++){await sleep(RM?0:520);snd('wobble');
    await fly.animate([{transform:at(x1,y2,'rotate(0)')},{transform:at(x1,y2,'rotate(-22deg)')},{transform:at(x1,y2,'rotate(16deg)')},{transform:at(x1,y2,'rotate(-6deg)')},{transform:at(x1,y2,'rotate(0)')}],{duration:RM?1:460,easing:'ease-in-out'}).finished;
    if(Math.random()>each){ok=false;break}}
  if(!ok){snd('sealFail');const fc=center(fly);
    for(let i=0;i<22;i++){const a=Math.random()*Math.PI*2,s=90+Math.random()*180;BFX.parts.push({x:fc.x,y:fc.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,ay:340,drag:1.5,life:.9,max:.9,size:3+Math.random()*3,color:i%2?I.fc:'#fffaf0',shape:'rect',rot:a,vr:(Math.random()-.5)*16})}
    fly.remove();suck.cancel();shake(6);
    fe.animate([{transform:'scale(.2)',filter:'brightness(4)'},{transform:'scale(1.15)',filter:'brightness(1.4)'},{transform:'scale(1)',filter:'none'}],{duration:RM?1:380});
    await bsay(['ああっ！ 札を やぶって 飛び出してきた！','おしい！ あと少しで 封じられたのに！','ぐぬぬ… あとちょっとだった！'][stage],900);return false}
  // success: stamp slam
  await sleep(RM?0:380);
  const st=document.createElement('div');st.className='stamp';st.textContent='封';fly.appendChild(st);
  snd('stamp');await st.animate([{transform:'translate(-50%,-50%) scale(3) rotate(-30deg)',opacity:0},{transform:'translate(-50%,-50%) scale(.9) rotate(-10deg)',opacity:1,offset:.7},{transform:'translate(-50%,-50%) scale(1) rotate(-10deg)',opacity:1}],{duration:RM?1:260,easing:'ease-in',fill:'forwards'}).finished;
  shake(7,300);const fc=center(fly);BFX.parts.push({x:fc.x,y:fc.y,vx:0,vy:0,life:.5,max:.5,size:8,grow:70,shape:'ring',lw:4,color:'#fff4c8'});
  for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,s=100+Math.random()*200;BFX.parts.push({x:fc.x,y:fc.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ay:200,drag:2,life:1,max:1,size:3+Math.random()*4,color:['#ff9ee6','#8fe8ff','#fff1b0','#ffffff','#d8432c'][i%5],shape:i%2?'star':'rect',rot:a,vr:8})}
  snd('sealOk');
  await bsay(`やった！<br>${m.name}を 封印した！`,1100);
  const v=rollVariant(I.holo,I.gold),res=addCard(e.id,e.lv,v);S.dex[e.id].wild=true;res.c.hp=Math.max(1,Math.floor(maxHP(res.c)*e.hp/e.st.hp));
  await reveal([res],v==='gold'?'ゴールドカードだ！！':v==='holo'?'キラカードだ！':'封印成功！');
  if(!S.party.includes(res.c.uid))await bsay(`${m.name}のカードは 札入れに しまわれた。`,900);
  await giveExp(Math.floor(e.lv*RAR[m.r].exp*.45));
  return true;
}

/* ---------- exp ---------- */
async function giveExp(x){
  for(const c of partyCards()){if(c.hp<=0)continue;const g=c.uid===B.active?x:Math.floor(x*.4);if(!g)continue;const m=MON[c.id];c.exp+=g;
    if(c.uid===B.active){await bsay(`${m.name}は ${g} けいけんちを もらった！`,650);hud()}
    while(c.lv<50&&c.exp>=need(c.lv)){const old=maxHP(c);c.exp-=need(c.lv);c.lv++;c.hp=Math.min(maxHP(c),c.hp+maxHP(c)-old);
      if(c.uid===B.active){snd('levelup');const el=bmon('me'),cc=center(el);for(let i=0;i<26;i++)BFX.parts.push({x:cc.x+(Math.random()-.5)*cc.w*.8,y:cc.y+cc.h*.4,vx:0,vy:-60-Math.random()*90,ay:-40,life:1,max:1,size:3+Math.random()*3,color:['#fff1b0','#ffffff','#8fe8ff'][i%3],shape:'star',rot:0,vr:6});
        el.animate([{filter:'brightness(1)'},{filter:'brightness(1.8) drop-shadow(0 0 10px #fff4c8)'},{filter:'brightness(1)'}],{duration:RM?1:700});hud(true)}else snd('levelup');
      await bsay(`${m.name}は レベル${c.lv}に あがった！`,900);
      if(c.lv===9&&m.r<3)await bsay(`${m.name}は 大技「${MV[m.t][1].n}」を おぼえた！`,1100)}}
}

/* ---------- main flow ---------- */
async function checkFaint(){
  if(B.foe.hp<=0){await faintAnim('foe');await bsay(`${B.trainer?'あいての ':'野生の '}${MON[B.foe.id].name}は たおれた！`,700);
    await giveExp(Math.floor(B.foe.lv*RAR[MON[B.foe.id].r].exp*(B.trainer?.95:.7)));
    if(B.trainer&&B.teamIdx<B.team.length-1){B.teamIdx++;const t=B.team[B.teamIdx];const st=mstats(t.id,t.lv);B.foe={id:t.id,lv:t.lv,st,hp:st.hp};S.seen[t.id]=true;
      await bsay(`${B.trainer.name}は ${MON[t.id].name}を くりだした！`,500);await sendOut('foe',t.id,true);return 'cont'}
    return 'win'}
  const c=card(B.active);
  if(c.hp<=0){await faintAnim('me');await bsay(`${MON[c.id].name}は たおれてしまった…`,800);
    if(partyCards().some(x=>x.hp>0)){B.forced=true;await bsay('次に出すカードを えらんでね',300);return 'forced'}
    return 'lose'}
  return null;
}
async function turn(a){
  if(a.k==='move'){const me=U('me'),foe=U('foe'),mv=movesOf(me.m.id,me.lv)[a.i],fm=pickFoeMove();
    const first=me.st.spd>foe.st.spd||(me.st.spd===foe.st.spd&&Math.random()<.5);
    const order=first?[['me',mv],['foe',fm]]:[['foe',fm],['me',mv]];
    for(const [s,m] of order){await attack(s,m);const r=await checkFaint();if(r)return r}
    return null}
  if(a.k==='seal'){if(B.trainer){await bsay('人のカードに 封札は 効かない！',800);return null}
    if(await doSeal(a.s))return 'sealed';await attack('foe',pickFoeMove());return await checkFaint()}
  if(a.k==='potion'){const c=card(B.active),mx=maxHP(c),h=Math.min(mx-c.hp,Math.ceil(mx/2));S.items.potion--;c.hp+=h;snd('heal');
    const cc=center(bmon('me'));for(let i=0;i<18;i++)BFX.parts.push({x:cc.x+(Math.random()-.5)*cc.w*.6,y:cc.y+cc.h*.3,vx:0,vy:-50-Math.random()*60,life:.9,max:.9,size:3+Math.random()*3,color:['#9be7c4','#ffffff'][i%2],shape:'circle'});
    hud();await bsay(`回復の香で ${MON[c.id].name}の HPが ${h} 回復した！`,700);await attack('foe',pickFoeMove());return await checkFaint()}
  if(a.k==='switch'){const was=B.forced;B.forced=false;const prev=card(B.active);
    if(!was){await bsay(`もどれ、${MON[prev.id].name}！`,300);await bmon('me').animate([{transform:'scale(1)',opacity:1,filter:'none'},{transform:'scale(.1)',opacity:0,filter:'brightness(5)'}],{duration:RM?1:300,fill:'forwards'}).finished}
    B.active=a.u;await bsay(`いけっ！ ${MON[card(B.active).id].name}！`,200);await sendOut('me',card(B.active).id);
    if(!was){await attack('foe',pickFoeMove());return await checkFaint()}return null}
  if(a.k==='run'){const me=U('me'),foe=U('foe');
    if(Math.random()<clamp(.6+(me.st.spd-foe.st.spd)/60,.35,.95)){snd('run');await bsay('うまく にげきれた！',600);return 'run'}
    await bsay('にげられなかった！',600);await attack('foe',pickFoeMove());return await checkFaint()}
}
/* opts: {wild:{id,lv}} | {trainer:{name,sprite,team:[{id,lv}],intro,smart,gentle}, canLose} */
async function runBattle(opts){
  const bg=opts.bg||bgAt(G.mapId,G.p.y);
  const alive=partyCards().filter(c=>c.hp>0);
  if(!alive.length){await say('元気な カードが いない！<br>家や 祠の 井戸、行商人マツの ところで 休ませて あげよう。');return 'none'}
  B={trainer:opts.trainer||null,team:opts.trainer?opts.trainer.team:[opts.wild],teamIdx:0,active:alive[0].uid,forced:false,freeze:false};
  const f0=B.team[0],st=mstats(f0.id,f0.lv);B.foe={id:f0.id,lv:f0.lv,st,hp:st.hp};S.seen[f0.id]=true;
  G.scene='battle';snd('encounter');bgm(opts.music||(B.trainer?'boss':'battle'));
  G.flash=1;await sleep(90);G.flash=1;await sleep(90);
  await cardShutter(true);
  buildScene(bg);bfxStart();hud(true);$('#pF').style.opacity=0;$('#pM').style.opacity=0;
  const bt=$('#battle .bt');
  await cardShutter(false);
  const pf=$('#battle .bt-plat.f'),pm=$('#battle .bt-plat.m');
  pf.animate([{transform:'translateX(-120%)'},{transform:'none'}],{duration:RM?1:500,easing:'cubic-bezier(.2,.8,.3,1)'});pm.animate([{transform:'translateX(120%)'},{transform:'none'}],{duration:RM?1:500,easing:'cubic-bezier(.2,.8,.3,1)'});
  if(B.trainer){const tc=trainerCanvas(B.trainer.sprite);$('#bT').appendChild(tc);
    await $('#bT').animate([{transform:'translateX(-160%)'},{transform:'none'}],{duration:RM?1:500,easing:'ease-out'}).finished;
    await bsay(B.trainer.intro||`${B.trainer.name}が 勝負を しかけてきた！`,700);
    await $('#bT').animate([{transform:'none'},{transform:'translateX(140%)',opacity:0}],{duration:RM?1:350,fill:'forwards'}).finished;
    await bsay(`${B.trainer.name}は ${MON[f0.id].name}を くりだした！`,300);await sendOut('foe',f0.id,true);
  }else{setMon('foe',f0.id);const fe=bmon('foe');fe.style.filter='brightness(0)';
    await fe.animate([{transform:'translateX(-140%)'},{transform:'none'}],{duration:RM?1:520,easing:'cubic-bezier(.2,.8,.3,1)'}).finished;
    fe.animate([{filter:'brightness(0)'},{filter:'brightness(2)'},{filter:'none'}],{duration:RM?1:420,fill:'forwards'}).onfinish=()=>{fe.style.filter=''};snd('exclaim');
    await bsay(`あっ！ 野生の ${MON[f0.id].name}が 飛び出してきた！`,600)}
  $('#pF').animate([{transform:'translateX(-30px)',opacity:0},{transform:'none',opacity:1}],{duration:RM?1:300,fill:'forwards'});
  await bsay(`いけっ！ ${MON[card(B.active).id].name}！`,150);
  await sendOut('me',card(B.active).id);
  $('#pM').animate([{transform:'translateX(30px)',opacity:0},{transform:'none',opacity:1}],{duration:RM?1:300,fill:'forwards'});
  let result=null;
  while(!result){
    $('#bmsg').innerHTML=B.forced?'次のカードを えらんでね':`${MON[card(B.active).id].name}は どうする？`;
    const a=await showCmd();const r=await turn(a);
    if(r==='forced'||r==='cont'||r===null)continue;result=r;
  }
  if(result==='win'&&B.trainer){bgm('victory');await bsay(`${B.trainer.name}との 勝負に 勝った！`,900);
    if(B.trainer.winLine){const tc=trainerCanvas(B.trainer.sprite);const tb=$('#bT');tb.innerHTML='';tb.appendChild(tc);tb.style.opacity=1;await tb.animate([{transform:'translateX(140%)',opacity:0},{transform:'none',opacity:1}],{duration:RM?1:400,fill:'forwards'}).finished;await bsay(B.trainer.winLine,1400)}
    if(B.trainer.reward){S.coins+=B.trainer.reward;snd('coin');await bsay(`${S.name}は 賞金として ${B.trainer.reward}両 もらった！`,900)}}
  else if(result==='win'){const coins=B.foe.lv*6+rnd(0,B.foe.lv*3);S.coins+=coins;snd('coin');await bsay(`${coins}両 を 拾った！`,650)}
  else if(result==='lose'){if(opts.canLose){await bsay(B.trainer&&B.trainer.loseLine||'負けてしまった…',1300)}else{await bsay(`${S.name}の 手持ちの カードは みんな たおれてしまった…`,1100);await bsay('目の前が まっくらに なった！',1200)}}
  await cardShutter(true);
  bfxStop();$('#battle').hidden=true;$('#battle').innerHTML='';B=null;G.scene='world';
  let lost=0;if(result==='lose'&&!opts.canLose){lost=Math.floor(S.coins*.1);S.coins-=lost;healAll();const h=S.flags.healAt==='shrine'?{map:'field',x:7,y:7,dir:'up'}:{map:'home',x:6,y:5,dir:'up'};
    loadMap(h.map);G.p.x=h.x;G.p.y=h.y;G.p.dir=h.dir;G.p.moving=false;G.areaName=areaAt(h.map,h.y);}
  if(opts.canLose&&result==='lose')healAll();
  updateBGM();
  await cardShutter(false);saveGame();
  if(result==='lose'&&!opts.canLose){await say(`${lost}両を 落としてしまった…。<br>でも カードたちは すっかり 元気に なった！`)}
  return result;
}
async function wildEncounter(e){
  G.lock++;const id=pickWeighted(e.pool),lv=rnd(e.lv[0],e.lv[1]);
  await runBattle({wild:{id,lv},bg:e});G.lock--;
}
