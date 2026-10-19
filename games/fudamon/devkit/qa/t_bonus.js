require('./lib.js')(async({p,setup})=>{await setup();
 await p.evaluate(()=>{G.lock++;runBattle({wild:{id:3,lv:20},bg:ENC.route}).then(()=>G.lock--)});await p.waitForTimeout(5500);
 const r0=await p.evaluate(()=>sealRate('white'));
 await p.evaluate(()=>{const _r=Math.random;Math.random=()=>.99;window.__r=_r;document.querySelector('#bcmd [data-c="bag"]').click()});await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('#bcmd [data-s="white"]').click());await p.waitForTimeout(6500);
 await p.evaluate(()=>{Math.random=window.__r});
 console.log('rate before',r0.toFixed(3),'after fail',await p.evaluate(()=>sealRate('white').toFixed(3)+' bonus '+B.sealBonus));
 for(let i=0;i<12;i++){await p.keyboard.press('z');await p.waitForTimeout(400)}
 await p.evaluate(()=>{const b=document.querySelector('#bcmd [data-c="bag"]');b&&b.click()});await p.waitForTimeout(400);await p.screenshot({path:require('path').join(__dirname,'out','bonus.png')});});
