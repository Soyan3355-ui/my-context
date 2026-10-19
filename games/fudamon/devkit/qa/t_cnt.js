require('./lib.js')(async({p,setup})=>{await setup();
 await p.evaluate(()=>{G.lock++;runBattle({wild:{id:1,lv:8},bg:ENC.route}).then(()=>G.lock--)});await p.waitForTimeout(5500);
 console.log(await p.evaluate(()=>document.querySelector('#pF .nm').textContent));await p.screenshot({path:require('path').join(__dirname,'out','cnt.png'),clip:{x:0,y:0,width:600,height:200}});});
