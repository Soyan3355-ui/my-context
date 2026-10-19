// 使い方: node devkit/preview/shot.js <page.html> "<query>" <out.png>
//   例: node devkit/preview/shot.js sheet.html "sheet=1" all.png
//       node devkit/preview/shot.js compare.html "s=4&id=1,4" cmp4x.png
const path=require('path'),fs=require('fs');
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const [page='sheet.html',q='sheet=1',out='sheet.png']=process.argv.slice(2);
const b=await chromium.launch({args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1400,height:900}});const errs=[];
p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('file://'+path.join(__dirname,page)+'?'+q);await p.waitForFunction(()=>document.title==='done');
const dir=path.join(__dirname,'out');fs.mkdirSync(dir,{recursive:true});
await p.screenshot({path:path.join(dir,out),fullPage:true});
console.log('saved',path.join(dir,out),'errors:',JSON.stringify(errs));await b.close();})();
