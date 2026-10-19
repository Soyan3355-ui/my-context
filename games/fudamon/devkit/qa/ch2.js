const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:820}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.goto('file://'+require('path').resolve(__dirname,'../../index.html'));await p.waitForTimeout(2500);
const st=()=>p.evaluate(()=>JSON.stringify({scene:G.scene,map:G.mapId,x:G.p.x,y:G.p.y,lock:G.lock,ui:UI.stack.length,dlg:document.querySelector('#dlg').hidden?'':document.querySelector('#dlg .dtext').textContent.slice(0,40)}));
const mash=async(n,ms=400)=>{for(let i=0;i<n;i++){await p.keyboard.press('z');await p.waitForTimeout(ms)}};
await p.evaluate(()=>{UI.stack=[];document.querySelector('#title').hidden=true;G.cam=null;S=freshState();S.flags={metSensei:true,starter:1,rivalLeft:true,badge:true};
  const a=addCard(1,14,'normal');addCard(1,5,'normal');addCard(1,6,'holo');addCard(8,30,'normal');addCard(5,30,'normal');S.party=[S.cards[0].uid,S.cards[3].uid,S.cards[4].uid];
  S.items={white:9,silver:3,gold:3,potion:5};S.map='field';S.x=26;S.y=5;S.dir='right';startWorld()});
await p.waitForTimeout(800);
// walk east into valley
await p.keyboard.down('ArrowRight');await p.waitForTimeout(500);await p.keyboard.up('ArrowRight');await p.waitForTimeout(1500);
console.log('valley?',await st());await p.screenshot({path:require('path').join(__dirname,'out','c-valley.png')});
// rival trigger at 16,6
await p.evaluate(()=>{G.p.x=15;G.p.y=6;G.p.dir='right'});await p.keyboard.down('ArrowRight');await p.waitForTimeout(300);await p.keyboard.up('ArrowRight');
await p.waitForTimeout(2500);console.log('rival?',await st());
for(let i=0;i<60;i++){await p.keyboard.press('z');await p.waitForTimeout(350);const s=JSON.parse(await st());if(s.scene==='world'&&s.lock===0&&i>10)break}
console.log('after rival',await st());
// evolution: open card detail for first card
await p.evaluate(()=>{partyScreen(()=>closePanel());});await p.waitForTimeout(400);
await p.evaluate(()=>cardDetail(S.party[0],()=>closePanel()));await p.waitForTimeout(500);await p.screenshot({path:require('path').join(__dirname,'out','c-evoreq.png')});
await p.evaluate(()=>document.querySelector('#panel [data-a="evo"]').click());await p.waitForTimeout(700);await p.keyboard.press('z');
await p.waitForTimeout(2500);await p.screenshot({path:require('path').join(__dirname,'out','c-evo.png')});await p.waitForTimeout(3500);await mash(3,700);
console.log('evolved',await p.evaluate(()=>JSON.stringify(S.cards.map(c=>MON[c.id].name+c.lv))));
await p.evaluate(()=>{UI.stack=[];closePanel();document.querySelector('#modal').hidden=true;G.lock=0});
// warp to mount and forest render
for(const m of [['mount',6,2],['forest',2,4]]){await p.evaluate(m=>warp({map:m[0],x:m[1],y:m[2],dir:'down'}),m);await p.waitForTimeout(1500);await p.screenshot({path:`/tmp/claude-0/qa/c-${m[0]}.png`})}
// guardian yoi
await p.evaluate(()=>{G.p.x=14;G.p.y=18;G.p.dir='up'});await p.keyboard.press('z');await mash(4,600);console.log('yoi talk',await st());
await p.keyboard.press('ArrowDown');await p.waitForTimeout(300);await p.keyboard.press('z');await p.waitForTimeout(800);
// whale: set badges and examine tree
await p.evaluate(()=>{UI.stack=[];document.querySelector('#dlg').hidden=true;document.querySelector('#choice').hidden=true;G.lock=0;S.flags.b2=S.flags.b3=S.flags.b4=true;warp({map:'field',x:9,y:4,dir:'up'})});await p.waitForTimeout(1500);
await p.evaluate(()=>{G.p.x=8;G.p.y=4;G.p.dir='up'});await p.keyboard.press('z');await p.waitForTimeout(6000);await mash(3,600);await p.waitForTimeout(6000);
await p.screenshot({path:require('path').join(__dirname,'out','c-whale.png')});console.log('whale',await st());
console.log(errs.join('\n')||'no page errors');await b.close()})();
