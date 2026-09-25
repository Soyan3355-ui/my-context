/* 封札モンスターズ — UI: dialogue, choices, menus, card screens, reveal, shop, touch pad */
'use strict';
const TouchPad={run:false};

/* ---------------- dialogue ---------------- */
function tokenize(html){const out=[];const re=/(<[^>]+>)|([\s\S])/g;let m;while((m=re.exec(html)))out.push(m[1]||m[2]);return out}
function say(text,name,opt={}){
  const box=$('#dlg'),nm=box.querySelector('.dname'),tx=box.querySelector('.dtext'),car=box.querySelector('.caret');
  box.hidden=false;nm.textContent=name||'';nm.hidden=!name;car.hidden=true;box.classList.toggle('sys',!name);
  const toks=tokenize(text);let i=0,done=false,acc='';
  return new Promise(res=>{
    const speed=opt.speed||42;let t0=performance.now(),shown=0;
    const tick=()=>{if(done)return;const want=Math.floor((performance.now()-t0)/1000*speed);
      while(shown<want&&i<toks.length){const tk=toks[i++];acc+=tk;if(tk[0]!=='<'){shown++;if(shown%2===0&&tk.trim())snd('blip')}}
      tx.innerHTML=acc;if(i>=toks.length){finish();return}requestAnimationFrame(tick)};
    const finish=()=>{acc=toks.join('');tx.innerHTML=acc;i=toks.length;done=true;car.hidden=!!opt.noWait;if(opt.noWait){UI.pop(h);box.removeEventListener('click',clk);res()}};
    const h=k=>{if(k!=='a'&&k!=='b')return;if(!done){finish();return}UI.pop(h);box.removeEventListener('click',clk);snd('cursor');if(!opt.keep)box.hidden=true;res()};
    const clk=()=>sendKey('a');box.addEventListener('click',clk);
    UI.push(h);tick();
  });
}
function hideDlg(){$('#dlg').hidden=true}
function choose(opts,{cancel=opts.length-1}={}){
  const box=$('#choice');box.innerHTML=opts.map((o,i)=>`<button data-nav data-i="${i}">${o}</button>`).join('');box.hidden=false;
  return new Promise(res=>{let nav;const end=i=>{nav.close();box.hidden=true;box.innerHTML='';res(i)};
    box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{snd('confirm');end(+b.dataset.i)}));
    nav=navPanel(box,{onBack:cancel==null?null:()=>end(cancel)})});
}
async function ask(text,name,opts=['はい','いいえ']){await say(text,name,{keep:true,noWait:true});const i=await choose(opts);hideDlg();return i}
function toast(t){const el=$('#toast');el.innerHTML=t;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}

/* ---------------- panels (menu screens) ---------------- */
let panelNav=null;
function openPanel(html,{onBack,cls=''}={}){
  const p=$('#panel');p.className=cls;p.innerHTML=html;p.hidden=false;if(panelNav)panelNav.close();
  panelNav=navPanel(p,{onBack:onBack||closePanel});return panelNav;
}
function closePanel(){const p=$('#panel');p.hidden=true;p.innerHTML='';if(panelNav){panelNav.close();panelNav=null}}
let menuResolve=null;
function openMainMenu(){
  if(G.p.moving)return;snd('menuOpen');G.lock++;
  const done=()=>{closePanel();G.lock--};
  const items=[['party','なかま','手持ちのカードとパーティ'],['dex','ずかん',`${sealedCount()} / ${TOTAL} 種類`],['bag','どうぐ','封札と回復の香'],['save','レポート','ここまでを記録する'],['opt','せってい',''],['close','とじる','']];
  const pc=partyCards();
  openPanel(`<div class="mm"><div class="mm-side"><div class="mm-head"><b>${S.name}</b><span>${fmt(S.coins)} 両</span></div>
    ${items.map(([k,l,d])=>`<button class="mm-it" data-nav data-k="${k}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>
    <div class="mm-party">${pc.map(c=>{const r=c.hp/maxHP(c);return `<div class="mm-card">${cardHTML(c)}<span class="bar"><i style="width:${r*100}%;background:${hpColor(r)}"></i></span></div>`}).join('')||'<p class="muted">まだカードを持っていない</p>'}
    <p class="mm-time">プレイ時間 ${fmtTime(S.time)}</p></div></div>`,{onBack:done,cls:'menu'});
  if(G.menuIdx)panelNav.set(G.menuIdx);
  $('#panel').querySelectorAll('.mm-it').forEach((b,bi)=>b.addEventListener('click',async()=>{const k=b.dataset.k;snd('confirm');G.menuIdx=bi;
    if(k==='close'){done();return}
    if(k==='party')partyScreen(()=>{closePanel();G.lock--;openMainMenu()});
    if(k==='dex')dexScreen(()=>{closePanel();G.lock--;openMainMenu()});
    if(k==='bag')bagScreen(()=>{closePanel();G.lock--;openMainMenu()});
    if(k==='opt')optScreen(()=>{closePanel();G.lock--;openMainMenu()});
    if(k==='save'){saveGame();snd('save');closePanel();await say(`${S.name}は レポートに しっかり 書きのこした！`);G.lock--}
  }));
}
function fmtTime(s){s=Math.floor(s);return `${Math.floor(s/60)}分${String(s%60).padStart(2,'0')}秒`}
function head(title,sub){return `<div class="ph"><button class="pback" data-nav data-back aria-label="もどる">もどる</button><h2>${title}</h2><span>${sub||''}</span></div>`}
function wireBack(fn){const b=$('#panel [data-back]');b&&b.addEventListener('click',()=>{snd('cancel');fn()})}

function partyScreen(back,{inBattle}={}){
  const pc=partyCards();
  const slots=[0,1,2].map(i=>{const c=pc[i];if(!c)return `<div class="slotempty">空き</div>`;const r=c.hp/maxHP(c);
    return `<button class="gcell" data-nav data-uid="${c.uid}">${cardHTML(c)}<span class="sub">${i===0?'<span class="lead-tag">先頭</span>':''}<span class="bar"><i style="width:${r*100}%;background:${hpColor(r)}"></i></span></span></button>`}).join('');
  const list=[...S.cards].filter(c=>!S.party.includes(c.uid)).sort((a,b)=>a.id-b.id||b.lv-a.lv).map(c=>{const r=c.hp/maxHP(c);
    return `<button class="gcell${S.party.includes(c.uid)?' inparty':''}" data-nav data-uid="${c.uid}">${cardHTML(c)}<span class="sub"><span class="bar"><i style="width:${r*100}%;background:${hpColor(r)}"></i></span></span></button>`}).join('');
  const nav=openPanel(`${head('なかま',`パーティ ${pc.length}/3・札入れ ${S.cards.length}枚`)}<div class="pbody"><p class="lbl">パーティ（先頭のカードがバトルに出る）</p><div class="slots">${slots}</div><p class="lbl">札入れ（パーティ以外のカード）</p>${list?`<div class="grid">${list}</div>`:'<p class="muted">まだ ありません。魔物を 封印すると ここに 入ります。</p>'}</div>`,{onBack:back});
  wireBack(back);
  $('#panel').querySelectorAll('[data-uid]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');cardDetail(+b.dataset.uid,()=>partyScreen(back))}));
}
function cardDetail(uid,back){
  const c=card(uid);if(!c){back();return}const m=MON[c.id],st=mstats(c.id,c.lv),inP=S.party.includes(uid),idx=S.party.indexOf(uid);
  const mv=movesOf(c.id,c.lv).map(x=>`<div><span>${x.n}<span class="tchip" style="--c:${TYPES[x.t].c}">${TYPES[x.t].n}</span></span><span>威力${x.p}</span></div>`).join('');
  const nb=(c.lv<9&&m.r<3)?`<div class="muted"><span>Lv9で「${MV[m.t][1].n}」を覚える</span></div>`:'';
  const acts=[];
  if(inP){if(idx>0)acts.push(`<button class="pbtn" data-nav data-a="lead">先頭にする</button>`);const lastOk=c.hp>0&&partyCards().filter(x=>x.hp>0&&x.uid!==uid).length===0;acts.push(`<button class="pbtn" data-nav data-a="out" ${S.party.length<=1||lastOk?'disabled':''}>${lastOk&&S.party.length>1?'元気なカードが いなくなる':'パーティから外す'}</button>`)}
  else acts.push(`<button class="pbtn shu" data-nav data-a="in" ${S.party.length>=3?'disabled':''}>${S.party.length>=3?'パーティが満員':'パーティに入れる'}</button>`);
  acts.push(`<button class="pbtn" data-nav data-a="sell" ${inP?'disabled':''}>手放す +${sellPrice(c)}両</button>`);
  openPanel(`${head(m.name,`No.${pad3(m.id)} ・ ${TYPES[m.t].n}タイプ ・ ${RAR[m.r].n}`)}<div class="pbody detailwrap"><div class="detail">${cardHTML(c)}</div>
  <div class="dinfo"><div class="stats"><div><small>HP</small><b>${c.hp}/${st.hp}</b></div><div><small>こうげき</small><b>${st.atk}</b></div><div><small>ぼうぎょ</small><b>${st.def}</b></div><div><small>すばやさ</small><b>${st.spd}</b></div></div>
  <div class="expl"><span>次のLvまで ${need(c.lv)-c.exp} EXP</span><span class="bar exp"><i style="width:${c.exp/need(c.lv)*100}%"></i></span></div>
  <div class="mvl">${mv}${nb}</div><p class="flav">${m.flavor}</p><div class="acts">${acts.join('')}</div></div></div>`,{onBack:back});
  wireBack(back);tiltCard($('#panel .detail'));
  $('#panel').querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',async()=>{const a=b.dataset.a;
    if(a==='lead'){S.party=[uid,...S.party.filter(x=>x!==uid)];snd('confirm');cardDetail(uid,back)}
    if(a==='out'){S.party=S.party.filter(x=>x!==uid);snd('confirm');cardDetail(uid,back)}
    if(a==='in'){S.party.push(uid);snd('confirm');cardDetail(uid,back)}
    if(a==='sell'){const p=$('#panel');p.hidden=true;const i=await ask(`${m.name}（Lv${c.lv}）を 手放して<br>${sellPrice(c)}両に する？`,null,['手放す','やめる']);p.hidden=false;
      if(i===0){S.coins+=sellPrice(c);S.cards=S.cards.filter(x=>x.uid!==uid);snd('coin');toast(`${sellPrice(c)}両 を受け取った`);back()}else panelNav&&panelNav.refresh(true)}
  }));
}
function tiltCard(wrap){if(!wrap)return;const cd=wrap.querySelector('.card');if(!cd)return;cd.classList.add('tilted');let t=0;
  wrap.addEventListener('pointermove',e=>{const r=wrap.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;cd.style.transform=`rotateY(${(x-.5)*24}deg) rotateX(${(.5-y)*24}deg)`;cd.style.setProperty('--mx',(x*200)+'%');cd.style.setProperty('--my',(y*200)+'%')});
  wrap.addEventListener('pointerleave',()=>{cd.style.transform=''});
  const idle=()=>{if(!cd.isConnected)return;if(!wrap.matches(':hover')){t+=.016;cd.style.setProperty('--mx',(100+Math.sin(t)*90)+'%');cd.style.setProperty('--my',(100+Math.cos(t*.7)*80)+'%')}requestAnimationFrame(idle)};idle()}

function slotHTML(id){
  const m=MON[id],d=S.dex[id];
  if(d)return cardHTML({id,v:d.gold?'gold':d.holo?'holo':'normal'});
  const hd=`<div class="c-head"><span class="c-no">No.${pad3(id)}</span></div>`;
  if(S.seen[id])return `<div class="card slot seen"><div class="ci">${hd}<div class="c-art sil">${art(m)}</div><div class="c-name">${m.name}</div><div class="c-meta"><span>見かけた</span><span>${RAR[m.r].n}</span></div></div></div>`;
  return `<div class="card slot"><div class="ci">${hd}<div class="c-art q">?</div><div class="c-name">？？？</div><div class="c-meta"><span>未発見</span></div></div></div>`;
}
function dexScreen(back){
  const n=sealedCount(),h=Object.values(S.dex).filter(d=>d.holo).length,g=Object.values(S.dex).filter(d=>d.gold).length;
  let cells='';for(let id=1;id<=TOTAL;id++){const d=S.dex[id];
    cells+=`<button class="gcell" data-nav data-id="${id}">${slotHTML(id)}<span class="pips"><i class="${d?'on':''}">N</i><i class="${d&&d.holo?'on h':''}">キ</i><i class="${d&&d.gold?'on g':''}">金</i></span></button>`}
  openPanel(`${head('封札図鑑',`封印 ${n}/${TOTAL}・キラ ${h}・ゴールド ${g}`)}<div class="pbody"><div class="progress"><div class="prow"><span>封印</span><span class="bar"><i style="width:${n/TOTAL*100}%"></i></span><span>${n}/${TOTAL}</span></div><div class="prow"><span>キラ</span><span class="bar h"><i style="width:${h/TOTAL*100}%"></i></span><span>${h}/${TOTAL}</span></div><div class="prow"><span>ゴールド</span><span class="bar g"><i style="width:${g/TOTAL*100}%"></i></span><span>${g}/${TOTAL}</span></div></div><div class="grid">${cells}</div></div>`,{onBack:back});
  wireBack(back);
  $('#panel').querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>{const id=+b.dataset.id;
    if(!S.dex[id]){snd('bump');toast(S.seen[id]?'見かけたけど、まだ封印していない':'まだ出会っていない');return}snd('confirm');dexDetail(id,null,()=>dexScreen(back))}));
}
function dexDetail(id,v,back){
  const d=S.dex[id],m=MON[id];const vs=['normal',d.holo&&'holo',d.gold&&'gold'].filter(Boolean);v=v&&vs.includes(v)?v:vs[vs.length-1];
  const own=S.cards.filter(c=>c.id===id).length;
  openPanel(`${head(m.name,`No.${pad3(id)} ・ ${TYPES[m.t].n}タイプ ・ ${RAR[m.r].n}`)}<div class="pbody detailwrap"><div class="detail">${cardHTML({id,v})}</div>
  <div class="dinfo">${vs.length>1?`<div class="acts">${vs.map(x=>`<button class="pbtn ${x===v?'shu':''}" data-nav data-v="${x}">${{normal:'ノーマル',holo:'キラ',gold:'ゴールド'}[x]}</button>`).join('')}</div>`:''}
  <div class="chips"><span class="chip lv">封印 ${d.n}回</span><span class="chip lv">手持ち ${own}枚</span></div><p class="flav">${m.flavor}</p></div></div>`,{onBack:back});
  wireBack(back);tiltCard($('#panel .detail'));
  $('#panel').querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>{snd('flip');dexDetail(id,b.dataset.v,back)}));
}
function bagScreen(back){
  const row=k=>{const I=ITEMS[k];return `<div class="bagrow"><span class="ico${k==='potion'?' pot':''}" style="--fc:${I.fc||'#fff'}"></span><div><b>${I.n}</b><small>${I.d}</small></div><span class="cnt">×${S.items[k]}</span></div>`};
  openPanel(`${head('どうぐ',`${fmt(S.coins)} 両`)}<div class="pbody"><div class="bag">${row('white')}${row('silver')}${row('gold')}${row('potion')}
  ${S.flags.badge?`<div class="bagrow"><span class="ico badge"></span><div><b>封札師の印</b><small>祠守りイワオに認められた証。見習い卒業！</small></div><span class="cnt"></span></div>`:''}</div>
  ${S.items.potion?'<button class="pbtn" data-nav data-use>回復の香を使う</button>':''}</div>`,{onBack:back});
  wireBack(back);
  const u=$('#panel [data-use]');u&&u.addEventListener('click',()=>{snd('confirm');pickCard('どのカードに使う？',c=>c.hp<maxHP(c),async c=>{const mx=maxHP(c),h=Math.min(mx-c.hp,Math.ceil(mx/2));S.items.potion--;c.hp+=h;snd('heal');toast(`${MON[c.id].name}のHPが ${h} 回復した`);bagScreen(back)},()=>bagScreen(back))});
}
function pickCard(title,ok,fn,back){
  const list=partyCards().map(c=>{const r=c.hp/maxHP(c);return `<button class="gcell" data-nav data-uid="${c.uid}" ${ok(c)?'':'disabled'}>${cardHTML(c)}<span class="sub">${c.hp}/${maxHP(c)}<span class="bar"><i style="width:${r*100}%;background:${hpColor(r)}"></i></span></span></button>`}).join('');
  openPanel(`${head(title,'')}<div class="pbody"><div class="slots">${list}</div></div>`,{onBack:back});wireBack(back);
  $('#panel').querySelectorAll('[data-uid]').forEach(b=>b.addEventListener('click',()=>fn(card(+b.dataset.uid))));
}
function optScreen(back){
  const muted=window.AUDIO?AUDIO.muted:S.muted;
  openPanel(`${head('せってい','')}<div class="pbody"><div class="bag">
  <button class="pbtn wide" data-nav data-o="snd">サウンド：${muted?'オフ':'オン'}</button>
  <div class="keys"><b>そうさ</b><span>移動：矢印キー / WASD</span><span>決定・話す：Z / Enter / Space</span><span>メニュー・もどる：X / Esc</span><span>走る：Shift を押しながら移動（スマホはBを押しながら）</span></div>
  <button class="pbtn wide" data-nav data-o="title">タイトルにもどる</button></div></div>`,{onBack:back});
  wireBack(back);
  $('#panel').querySelectorAll('[data-o]').forEach(b=>b.addEventListener('click',async()=>{const o=b.dataset.o;
    if(o==='snd'){S.muted=!muted;window.AUDIO&&AUDIO.setMuted(S.muted);snd('confirm');optScreen(back)}
    if(o==='title'){const p=$('#panel');p.hidden=true;const i=await ask('レポートを書いてから タイトルに もどる？',null,['もどる','やめる']);
      if(i===0){saveGame();closePanel();G.lock=0;showTitle()}else p.hidden=false}
  }));
}

/* ---------------- shop (traveling merchant) ---------------- */
function shopScreen(back){
  const row=k=>{const I=ITEMS[k];return `<button class="shoprow" data-nav data-k="${k}" ${S.coins<I.price?'disabled':''}><span class="ico${k==='potion'?' pot':''}" style="--fc:${I.fc||'#fff'}"></span><span><b>${I.n}</b><small>${I.d}</small></span><span class="pr">${I.price}両<small>所持${S.items[k]}</small></span></button>`};
  openPanel(`${head('行商人マツの店',`所持金 ${fmt(S.coins)} 両`)}<div class="pbody"><div class="bag">${row('white')}${row('silver')}${row('potion')}
  <button class="shoprow" data-nav data-k="pack" ${S.coins<PACK_PRICE?'disabled':''}><span class="ico pack"></span><span><b>封札パック</b><small>ランダムなカードが3枚。R以上1枚確定。その場で開封！</small></span><span class="pr">${PACK_PRICE}両</span></button></div></div>`,{onBack:back});
  wireBack(back);
  $('#panel').querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',async()=>{const k=b.dataset.k;
    if(k==='pack'){if(S.coins<PACK_PRICE)return;S.coins-=PACK_PRICE;G.bought=true;snd('coin');closePanel();
      const pool=[];for(let i=1;i<=TOTAL;i++)if(MON[i].r<4)pool.push(i);const ids=[pickWeighted(pool),pickWeighted(pool),pickWeighted(pool)];
      if(ids.every(i=>MON[i].r<2))ids[2]=pickWeighted(pool.filter(i=>MON[i].r>=2));
      const got=ids.map(id=>addCard(id,rnd(4,9),rollVariant(.15,.03)));await reveal(got,'封札パック開封！');shopScreen(back);return}
    const I=ITEMS[k];if(S.coins<I.price)return;S.coins-=I.price;S.items[k]++;G.bought=true;snd('coin');toast(`${I.n}を 買った`);shopScreen(back);panelNav.set([...$('#panel').querySelectorAll('[data-nav]')].indexOf($(`#panel [data-k="${k}"]`)))}));
}

/* ---------------- card reveal ---------------- */
function backHTML(){return `<div class="card back"><div class="ci"><div class="bk-ring"><span>封</span></div><div class="bk-txt">FUDA</div></div></div>`}
function reveal(list,title){
  return new Promise(res=>{
    const md=$('#modal');
    const tag=x=>`${x.isNew?'<span class="tag new">NEW!</span>':''}${x.c.v==='holo'?'<span class="tag h">キラカード!</span>':x.c.v==='gold'?'<span class="tag g">ゴールド!!</span>':''}<span class="tag">${RAR[MON[x.c.id].r].n}</span>`;
    md.innerHTML=`<div class="rvbox"><h2 class="m-title">${title}</h2><div class="rv-row n${list.length}">${list.map((x,i)=>`<div class="rv"><div class="flip" data-i="${i}"><div class="flipper"><div class="face">${backHTML()}</div><div class="face front">${cardHTML(x.c)}</div></div></div><div class="rv-tag">${tag(x)}</div></div>`).join('')}</div>
    <div class="m-act"><button class="pbtn shu" data-nav id="rvOk">${list.length>1?'めくる':'OK'}</button></div></div>`;
    md.hidden=false;
    let open=0;const flips=[...md.querySelectorAll('.flip')];const ok=md.querySelector('#rvOk');
    const burst=(el,rare)=>{const r=el.getBoundingClientRect(),sr=$('#screen').getBoundingClientRect();sparkBurst(r.left-sr.left+r.width/2,r.top-sr.top+r.height/2,rare?40:18,rare)};
    const flip=b=>{if(b.classList.contains('open'))return;b.classList.add('open');b.parentElement.classList.add('open');open++;const x=list[+b.dataset.i];
      const rare=x.c.v!=='normal'||MON[x.c.id].r>=2;snd('flip');setTimeout(()=>{snd(rare?'rare':'item');burst(b,rare)},330);
      if(open===flips.length)ok.textContent='図鑑に登録'};
    flips.forEach(b=>b.addEventListener('click',()=>flip(b)));
    let nav;
    ok.addEventListener('click',()=>{if(open<flips.length){const nx=flips.find(b=>!b.classList.contains('open'));flip(nx);return}snd('confirm');nav.close();md.hidden=true;md.innerHTML='';res()});
    nav=navPanel(md,{});
    setTimeout(()=>flip(flips[0]),500);
  });
}
/* DOM spark burst on the fx canvas overlay */
const FX={parts:[],cv:null,ctx:null,run:false};
function fxInit(){FX.cv=$('#fx');FX.ctx=FX.cv.getContext('2d');const fit=()=>{const r=FX.cv.getBoundingClientRect();FX.cv.width=Math.round(r.width);FX.cv.height=Math.round(r.height)};new ResizeObserver(fit).observe(FX.cv);fit()}
function fxLoop(){if(FX.run)return;FX.run=true;let lt=performance.now();const f=now=>{const dt=Math.min(.05,(now-lt)/1000);lt=now;updateParts(FX.parts,dt);FX.ctx.clearRect(0,0,FX.cv.width,FX.cv.height);drawParts(FX.ctx,FX.parts);if(FX.parts.length)requestAnimationFrame(f);else{FX.run=false;FX.ctx.clearRect(0,0,FX.cv.width,FX.cv.height)}};requestAnimationFrame(f)}
function fxAdd(q){FX.parts.push(q);fxLoop()}
function sparkBurst(x,y,n,rare){const cols=rare?['#ff9ee6','#8fe8ff','#d2ff8f','#fff1b0','#ffffff']:['#fff6d8','#ffe38a','#ffffff'];
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=80+Math.random()*220;fxAdd({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ay:120,drag:2.5,life:.6+Math.random()*.6,max:1.2,size:3+Math.random()*5,color:cols[i%cols.length],shape:'star',rot:Math.random()*6,vr:(Math.random()-.5)*12})}}

/* ---------------- touch pad ---------------- */
function initPad(){
  const pad=$('#pad');if(!pad)return;
  pad.querySelectorAll('[data-dir]').forEach(b=>{const d=b.dataset.dir;
    const on=e=>{e.preventDefault();unlockAudio();b.setPointerCapture&&b.setPointerCapture(e.pointerId);Input.press(d);if(UI.top())sendKey(d);b.classList.add('on')};
    const off=e=>{Input.release(d);b.classList.remove('on')};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off)});
  const A=$('#btnA'),Bb=$('#btnB'),M=$('#btnM');
  A.addEventListener('pointerdown',e=>{e.preventDefault();A.classList.add('on');sendKey('a')});A.addEventListener('pointerup',()=>A.classList.remove('on'));
  Bb.addEventListener('pointerdown',e=>{e.preventDefault();Bb.classList.add('on');TouchPad.run=true;if(UI.top())sendKey('b')});
  const bu=()=>{Bb.classList.remove('on');TouchPad.run=false};Bb.addEventListener('pointerup',bu);Bb.addEventListener('pointercancel',bu);
  M.addEventListener('click',()=>{unlockAudio();if(!UI.top()&&G.scene==='world'&&!G.lock)openMainMenu()});
}
