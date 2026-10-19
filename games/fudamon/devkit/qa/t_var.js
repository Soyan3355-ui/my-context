require('./lib.js')(async({p,setup})=>{await setup();
 console.log(await p.evaluate(()=>JSON.stringify({n:mstats(3,20,'normal'),h:mstats(3,20,'holo'),g:mstats(3,20,'gold')})));
 await p.evaluate(()=>cardDetail(S.cards[2].uid,()=>closePanel()));await p.waitForTimeout(600);await p.screenshot({path:require('path').join(__dirname,'out','v-holo.png')});});
