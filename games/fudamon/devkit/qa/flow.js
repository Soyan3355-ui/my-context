const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:820}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+require('path').resolve(__dirname,'../../index.html'));await p.waitForTimeout(2500);
const st=()=>p.evaluate(()=>({scene:G.scene,map:G.mapId,x:G.p.x,y:G.p.y,lock:G.lock,ui:UI.stack.length,dlg:document.querySelector('#dlg').hidden?'':document.querySelector('#dlg .dtext').textContent.slice(0,30),flags:S.flags,cards:S.cards.length}));
const mash=async(n,ms=350)=>{for(let i=0;i<n;i++){await p.keyboard.press('z');await p.waitForTimeout(ms)}};
await p.keyboard.press('z');await mash(12,700);
console.log('after intro',JSON.stringify(await st()));
await mash(4);
await p.screenshot({path:require('path').join(__dirname,'out','f1-home.png')});
// teleport to shop door and step in
await p.evaluate(()=>{warp({map:'shop',x:5,y:7,dir:'up'})});await p.waitForTimeout(1500);
await mash(6,600);console.log('shop',JSON.stringify(await st()));
// face case: move to (5,3) facing up
await p.evaluate(()=>{G.p.x=5;G.p.y=3;G.p.dir='up'});await p.keyboard.press('z');await p.waitForTimeout(800);
await p.screenshot({path:require('path').join(__dirname,'out','f2-starter.png')});
await p.keyboard.press('z');await p.waitForTimeout(600);await p.keyboard.press('z');await p.waitForTimeout(1500);
await p.screenshot({path:require('path').join(__dirname,'out','f3-reveal.png')});
for(let i=0;i<40;i++){await p.keyboard.press('z');await p.waitForTimeout(500);if(i===14)await p.screenshot({path:require('path').join(__dirname,'out','f4-battle.png')})}
console.log('post rival',JSON.stringify(await st()));
for(let i=0;i<30;i++){await p.keyboard.press('z');await p.waitForTimeout(400)}
console.log('end',JSON.stringify(await st()));
await p.screenshot({path:require('path').join(__dirname,'out','f5.png')});
console.log(errs.join('\n')||'no page errors');await b.close()})();
