require('./lib.js')(async({p,st,until,setup})=>{await setup({map:'valley',x:15,y:6});
 await p.keyboard.down('ArrowRight');await p.waitForTimeout(300);await p.keyboard.up('ArrowRight');await p.waitForTimeout(1500);
 const s=await until(s=>s.scene==='world'&&s.lock===0&&s.flags.rv2,200);console.log('rival done',JSON.stringify({scene:s.scene,lock:s.lock,rv2:s.flags.rv2,x:s.x}));
 await p.evaluate(()=>{G.p.x=6;G.p.y=21;G.p.dir='down'});await p.keyboard.press('z');
 const s2=await until(s=>s.scene==='world'&&s.lock===0&&s.flags.b2,300);console.log('minamo',JSON.stringify({b2:s2.flags.b2,lock:s2.lock}));
 await p.screenshot({path:require('path').join(__dirname,'out','c-after-minamo.png')});});
