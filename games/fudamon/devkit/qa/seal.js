const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:820}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.goto('file://'+require('path').resolve(__dirname,'../../index.html'));await p.waitForTimeout(2500);
await p.evaluate(()=>{UI.stack=[];document.querySelector('#title').hidden=true;G.cam=null;S=freshState();S.flags={metSensei:true,starter:1,rivalLeft:true};addCard(1,7,'normal');S.items={white:5,silver:1,gold:3,potion:2};S.map='field';S.x=13;S.y=40;S.dir='up';startWorld();
  G.lock++;window.__r=runBattle({wild:{id:26,lv:3},bg:ENC.route}).then(r=>{window.__res=r;G.lock--})});
await p.waitForTimeout(5500);
const click=async sel=>{await p.evaluate(s=>{const e=document.querySelector(s);e&&e.click()},sel);await p.waitForTimeout(300)};
await click('#bcmd [data-c="bag"]');await p.screenshot({path:require('path').join(__dirname,'out','s1-bag.png')});
await p.evaluate(()=>{B.foe.hp=1});
await click('#bcmd [data-s="gold"]');
for(const t of [900,1400,2200,3000,4200]){await p.waitForTimeout(t===900?900:t-[900,1400,2200,3000,4200][[900,1400,2200,3000,4200].indexOf(t)-1]);await p.screenshot({path:`/tmp/claude-0/qa/s2-${t}.png`})}
await p.waitForTimeout(2500);await p.screenshot({path:require('path').join(__dirname,'out','s3-reveal.png')});
for(let i=0;i<14;i++){await p.keyboard.press('z');await p.waitForTimeout(500)}
console.log(await p.evaluate(()=>JSON.stringify({res:window.__res,cards:S.cards.map(c=>MON[c.id].name+c.v),scene:G.scene})));
console.log(errs.join('\n')||'no page errors');await b.close()})();
