require('./lib.js')(async({p,st,until,setup})=>{await setup();
 await p.evaluate(()=>cardDetail(S.party[0],()=>closePanel()));await p.waitForTimeout(500);await p.screenshot({path:require('path').join(__dirname,'out','c-evoreq.png')});
 await p.evaluate(()=>document.querySelector('#panel [data-a="evo"]').click());await p.waitForTimeout(700);await p.keyboard.press('z');
 await p.waitForTimeout(2600);await p.screenshot({path:require('path').join(__dirname,'out','c-evo.png')});
 await until(s=>s.lock===0&&s.ui<=1,40);
 console.log('evolved',await p.evaluate(()=>JSON.stringify({cards:S.cards.map(c=>MON[c.id].name+c.lv),party:S.party.length,dex31:!!S.dex[31]})));});
