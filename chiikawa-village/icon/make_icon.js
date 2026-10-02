const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs');const OUT='/home/user/my-context/chiikawa-village/icon/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.addInitScript({path:__dirname+'/mock12.js'});await p.goto('file:///home/user/my-context/chiikawa-village/village-live.html');await p.waitForTimeout(1500);
const res=await p.evaluate(()=>{

 const G=56;const c=document.createElement('canvas');c.width=G;c.height=G;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
 const sky=['#8fd3f0','#9bd8f1','#a7ddf2','#b3e2f3','#bfe7f5','#cbebf6','#d6eff7','#e0f3f8'];
 for(let y=0;y<42;y++)px(0,y,G,1,sky[Math.min(7,Math.floor(y/5.2))]);
 // sun (top right)
 px(45,4,6,6,'#ffd84a');px(44,5,8,4,'#ffd84a');px(46,3,4,8,'#ffd84a');px(46,5,2,2,'#fff1a8');
 const cloud=(x,y)=>{px(x+1,y,5,1,'#fff');px(x,y+1,8,2,'#fff');px(x+2,y-1,2,1,'#fff');px(x,y+3,8,1,'#e8f1f6')};cloud(4,7);cloud(32,13);
 // command tower (center back)
 px(22,12,12,18,'#b9bfca');px(23,13,10,16,'#cfd5de');px(22,11,12,1,'#8a91a0');px(21,11,1,2,'#8a91a0');px(34,11,1,2,'#8a91a0');
 px(24,14,2,2,'#ffd84a');px(28,14,2,2,'#6d8fd6');px(32,14,1,2,'#ffd84a');
 px(28,3,1,8,'#3b3533');px(29,3,5,3,'#e36d72');px(29,5,4,1,'#c9544b');px(27,10,3,1,'#3b3533');
 px(19,16,3,1,'#8a91a0');px(20,15,1,1,'#8a91a0');px(20,17,1,2,'#8a91a0');
 // hills
 for(let x=0;x<G;x++){const h=Math.round(3+2*Math.sin(x/7+1));px(x,38-h,1,h+3,'#a8d88a')}
 // grass + ground
 px(0,41,G,2,'#6fbf5e');for(let x=1;x<G;x+=3)px(x,40,1,1,'#4f9e45');
 px(0,43,G,13,'#a0703f');px(0,43,G,1,'#7a5230');
 for(const [x,y] of [[3,47],[9,53],[15,49],[44,52],[50,47],[52,54],[6,54],[47,45],[13,45]])px(x,y,1,1,'#7a5230');
 // underground base window (center bottom)
 px(19,46,18,8,'#5a3d24');px(20,47,16,6,'#ffe9a8');px(27,47,2,6,'#5a3d24');px(20,49,16,1,'#f6d77a');
 px(22,51,2,2,'#e9829b');px(31,50,2,3,'#6d8fd6');
 for(const x of [10,46]){px(x,37,1,4,'#3f8a3a');px(x-1,37,1,1,'#6fbf5e');px(x+1,36,1,1,'#6fbf5e')}
 const put=(img,x,y)=>g.drawImage(img,x,y);
 put(IMG.hachiware.happy,2,21);put(IMG.usagi.happy,34,20);put(IMG.chiikawa.happy,18,23);
 // export at sizes
 const out={};for(const S of [1024,512,192,180,32]){const o=document.createElement('canvas');o.width=S;o.height=S;const og=o.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(c,0,0,S,S);out[S]=o.toDataURL('image/png')}
 // rounded preview
 const r=document.createElement('canvas');r.width=1024;r.height=1024;const rg=r.getContext('2d');rg.imageSmoothingEnabled=false;rg.beginPath();rg.roundRect(0,0,1024,1024,230);rg.clip();rg.drawImage(c,0,0,1024,1024);out.round=r.toDataURL('image/png');
 return out});
for(const k in res)fs.writeFileSync(OUT+(k==='round'?'icon-rounded-1024.png':`icon-${k}.png`),Buffer.from(res[k].split(',')[1],'base64'));
console.log('ok');await b.close()})();
