require('./lib.js')(async({p,setup})=>{await setup();
 console.log(await p.evaluate(()=>JSON.stringify({c:EVO[1].lv,r:EVO[3].lv,sr:EVO[5].lv,ur:EVO[25].lv,can14:canEvolve(S.cards[0])})));
 await p.evaluate(()=>{S.cards[0].lv=19});console.log('can at 19:',await p.evaluate(()=>canEvolve(S.cards[0])));});
