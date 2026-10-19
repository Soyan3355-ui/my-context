require('./lib.js')(async({p,st,until,setup})=>{await setup({map:'field',x:13,y:5,flags:{badge:false}});
 await p.evaluate(()=>{S.flags.badge=false;G.npcs=buildNPCs('field');G.p.dir='up'});
 await p.keyboard.press('z');await p.waitForTimeout(3500);
 for(let i=0;i<5;i++){await p.keyboard.press('z');await p.waitForTimeout(700)}
 await p.screenshot({path:require('path').join(__dirname,'out','iwao-cut.png')});
 const s=await until(s=>s.scene==='world'&&s.lock===0&&s.flags.rvIwao,250);console.log('cutscene done',JSON.stringify({rv:s.flags.rvIwao,lock:s.lock,npcs:await p.evaluate(()=>G.npcs.filter(n=>n.key==='rv_iwao').length)}));
 await p.keyboard.press('z');await p.waitForTimeout(2500);console.log('next talk:',JSON.stringify((await st()).dlg));});
