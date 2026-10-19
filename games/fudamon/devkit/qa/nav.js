globalThis.K={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
globalThis.EV=globalThis.EV||[];
const PZ=async page=>{if(globalThis.TOUCH)await TOUCH.a();else await page.keyboard.press('z')};
const PK=async (page,k)=>{if(globalThis.TOUCH){const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[k];await TOUCH.tap('.dpad [data-dir='+d+']')}else await page.keyboard.press(k)};
globalThis.handleInterrupts=async function(page,opts={}){
  // returns true if something handled
  const s=await page.evaluate(()=>({sc:G.scene,dlg:!document.querySelector('#dlg').hidden,done:!document.querySelector('#dlg .caret').hidden||!document.querySelector('#choice').hidden,ch:!document.querySelector('#choice').hidden&&document.querySelector('#choice').innerText,txt:document.querySelector('#dlg .dtext').innerText,modal:!document.querySelector('#modal').hidden,panel:!document.querySelector('#panel').hidden}));
  if(s.sc==='battle'){const lg=await autoBattle(page,{seal:opts.seal,potion:opts.potion});EV.push({t:Date.now(),battle:lg.slice(-3).join(' '),party:await page.evaluate(()=>partyCards().map(c=>MON[c.id].name+c.lv+' '+c.hp+'/'+maxHP(c)).join(','))});return true}
  if(s.modal){if(globalThis.TOUCH)await page.tap('#rvOk',{force:true,timeout:5000}).catch(()=>{});else await page.evaluate(()=>document.querySelector('#rvOk')&&document.querySelector('#rvOk').click());await new Promise(r=>setTimeout(r,500));return true}
  if(s.ch){EV.push({t:Date.now(),choice:s.txt+' ['+s.ch.replace(/\n/g,'/')+']'});const c=(opts.choose||(()=>0))(s.txt,s.ch);for(let i=0;i<c;i++){await PK(page,'ArrowDown');await new Promise(r=>setTimeout(r,120))}await PZ(page);await new Promise(r=>setTimeout(r,300));return true}
  if(s.dlg){if(s.done){if(EV.length===0||EV[EV.length-1].say!==s.txt)EV.push({t:Date.now(),say:s.txt});await new Promise(r=>setTimeout(r,opts.readMs||150));await PZ(page);await new Promise(r=>setTimeout(r,120))}else await new Promise(r=>setTimeout(r,100));return true}
  return false;
};
globalThis.goto=async function(page,map,tx,ty,opts={}){
  const t0=Date.now();let stuck=0;
  while(Date.now()-t0<(opts.max||240000)){
    if(await handleInterrupts(page,opts))continue;
    const st=await page.evaluate(()=>({map:G.mapId,x:G.p.x,y:G.p.y,m:G.p.moving,l:G.lock,u:UI.stack.length,sc:G.scene}));
    if(st.sc!=='world'||st.l||st.u||st.m){await new Promise(r=>setTimeout(r,80));continue}
    if(st.map===map&&st.x===tx&&st.y===ty)return {ok:true,ms:Date.now()-t0};
    if(st.map!==map){return {ok:false,why:'wrong map '+st.map}}
    const d=await page.evaluate(([tx,ty,avoidGrass])=>{const q=[[G.p.x,G.p.y]],prev={};prev[G.p.x+','+G.p.y]=null;
      const cost=(x,y)=>0;
      while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty)break;for(const [dir,[dx,dy]] of Object.entries(DIRS)){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(k in prev)continue;const c=tileAt(nx,ny);if(!(nx===tx&&ny===ty&&c==='d')&&blocked(nx,ny))continue;if(avoidGrass&&c==='"'&&!(nx===tx&&ny===ty))continue;prev[k]=[x,y,dir];q.push([nx,ny])}}
      let k=tx+','+ty;if(!(k in prev))return null;let dir=null;while(prev[k]){dir=prev[k][2];k=prev[k][0]+','+prev[k][1]}return dir},[tx,ty,!!opts.avoidGrass]);
    if(!d){stuck++;if(stuck>30)return {ok:false,why:'no path'};await new Promise(r=>setTimeout(r,200));continue}
    const k=K[d];if(globalThis.TOUCH)await TOUCH.down('.dpad [data-dir='+d+']');else await page.keyboard.down(k);
    const tt=Date.now();while(Date.now()-tt<500){await new Promise(r=>setTimeout(r,30));const s2=await page.evaluate(()=>({x:G.p.x,y:G.p.y,m:G.p.moving,map:G.mapId,l:G.lock}));if(s2.m||s2.x!==st.x||s2.y!==st.y||s2.map!==st.map||s2.l)break}
    if(globalThis.TOUCH)await TOUCH.up();else await page.keyboard.up(k);
  }
  return {ok:false,why:'timeout'};
};
globalThis.face=async function(page,dir){const cur=await page.evaluate(()=>G.p.dir);if(cur!==dir){await PK(page,K[dir]);await new Promise(r=>setTimeout(r,200))}};
globalThis.talk=async function(page,dir,opts={}){await face(page,dir);await PZ(page);await new Promise(r=>setTimeout(r,300));
  const t0=Date.now();while(Date.now()-t0<(opts.max||200000)){if(await handleInterrupts(page,opts))continue;const s=await page.evaluate(()=>({l:G.lock,u:UI.stack.length,sc:G.scene}));if(!s.l&&!s.u&&s.sc==='world')return true;if(s.sc==='ending')return 'ending';await new Promise(r=>setTimeout(r,100))}return false};
globalThis.drain=async function(page,opts={}){const t0=Date.now();while(Date.now()-t0<(opts.max||200000)){if(await handleInterrupts(page,opts))continue;const s=await page.evaluate(()=>({l:G.lock,u:UI.stack.length,sc:G.scene}));if(!s.l&&!s.u&&s.sc==='world')return true;if(s.sc==='ending'||s.sc==='title')return s.sc;await new Promise(r=>setTimeout(r,100))}return false};
globalThis.lead=async page=>page.evaluate(()=>{const c=partyCards()[0];return {lv:c.lv,hp:c.hp,mx:maxHP(c),map:G.mapId,x:G.p.x,y:G.p.y,pot:S.items.potion,alive:partyCards().filter(c=>c.hp>0).length}});
globalThis.healHome=async function(page){EV.push({t:Date.now(),mark:'heal trip home'});await goto(page,'field',6,58);await new Promise(r=>setTimeout(r,1300));
  await goto(page,'home',6,4);await talk(page,'right');await goto(page,'home',5,7);await new Promise(r=>setTimeout(r,1200));};
globalThis.grindUntil=async function(page,lv,a,b,opts={}){const t0=Date.now();let n=0;
  while(Date.now()-t0<(opts.max||500000)){let L=await lead(page);if(L.lv>=lv)break;
    if(L.map!=='field'){ // lost -> at home
      EV.push({t:Date.now(),mark:'respawned at '+L.map});await drain(page);if(L.map==='home'){await goto(page,'home',6,4);await talk(page,'right');await goto(page,'home',5,7);await new Promise(r=>setTimeout(r,1200))}continue}
    if(L.hp/L.mx<.4&&L.pot===0){await healHome(page);continue}
    const tgt=n++%2?a:b;await goto(page,'field',tgt[0],tgt[1],{max:60000});}
  return Math.round((Date.now()-t0)/1000)};
