require('./lib.js')(async({p,setup})=>{await setup();
 const spare=await p.evaluate(()=>S.cards.find(c=>!S.party.includes(c.uid)).uid);
 await p.evaluate(u=>cardDetail(u,()=>partyScreen(()=>closePanel())),spare);await p.waitForTimeout(500);await p.screenshot({path:require('path').join(__dirname,'out','swap1.png')});
 console.log('focused:',await p.evaluate(()=>document.querySelector('#panel .sel').textContent));
 // press z -> swap picker, pick 1st party card
 await p.keyboard.press('z');await p.waitForTimeout(500);await p.screenshot({path:require('path').join(__dirname,'out','swap2.png')});
 await p.keyboard.press('z');await p.waitForTimeout(600);
 console.log('party now',await p.evaluate(u=>JSON.stringify({inParty:S.party.includes(u),party:S.party.map(x=>MON[card(x).id].name),cards:S.cards.length}),spare));
 // sell flow: open another spare, go to sell button, press z twice quickly (default should be やめる)
 const sp2=await p.evaluate(()=>S.cards.find(c=>!S.party.includes(c.uid)).uid);
 await p.evaluate(u=>cardDetail(u,()=>closePanel()),sp2);await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('#panel [data-a="sell"]').click());await p.waitForTimeout(700);await p.screenshot({path:require('path').join(__dirname,'out','sell1.png')});
 await p.keyboard.press('z');await p.waitForTimeout(600);
 console.log('after z on sell dialog, cards:',await p.evaluate(()=>S.cards.length));
});
