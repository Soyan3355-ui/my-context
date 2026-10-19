require('./lib.js')(async({p,st,until,setup})=>{await setup({map:'field',x:8,y:4,flags:{b2:true,b3:true,b4:true}});
 await p.evaluate(()=>{G.p.dir='up'});await p.keyboard.press('z');await p.waitForTimeout(5000);await p.screenshot({path:require('path').join(__dirname,'out','c-whale.png')});
 const s=await until(s=>s.scene==='ending'||(s.scene==='world'&&s.lock===0),300);console.log('whale end',JSON.stringify({scene:s.scene,whale:s.flags.whaleDone}));
 await p.screenshot({path:require('path').join(__dirname,'out','c-final.png')});});
