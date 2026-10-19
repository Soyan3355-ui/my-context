const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:820}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+require('path').resolve(__dirname,'../../index.html'));await p.waitForTimeout(3500);
 await p.screenshot({path:require('path').join(__dirname,'out','01-title.png')});
 await p.keyboard.press('z');await p.waitForTimeout(800);
 for(let i=0;i<6;i++){await p.keyboard.press('z');await p.waitForTimeout(900)}
 await p.waitForTimeout(1500);await p.screenshot({path:require('path').join(__dirname,'out','02-home.png')});
 const st=await p.evaluate(()=>({scene:G.scene,map:G.mapId,x:G.p.x,y:G.p.y,lock:G.lock,ui:UI.stack.length}));console.log(JSON.stringify(st));
 console.log(errs.join('\n')||'no errors');await b.close();
})();
