global.window=global;global.G=null;eval(require('fs').readFileSync('js/data.js','utf8').replace("'use strict';",'')+';global.MAPS=MAPS;global.SOLID=SOLID;global.MON=MON;global.RAR=RAR;global.ENC=ENC');
function reach(map,sx,sy,block){const R=MAPS[map].rows,seen=new Set([sx+','+sy]),q=[[sx,sy]];while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(ny<0||ny>=R.length||nx<0||nx>=R[0].length)continue;const c=R[ny][nx],k=nx+','+ny;if(seen.has(k)||SOLID.has(c)||k===block)continue;seen.add(k);q.push([nx,ny])}}return seen}
console.log('valley exit reachable w/ minamo blocking:',reach('valley',0,6,'6,22').has('6,25'));
console.log('mount exit reachable w/ goen blocking:',reach('mount',6,0,'27,21').has('29,21'));
console.log('minamo post spot 5,23 reachable after:',reach('valley',0,6,null).has('5,23'),' goen talk spot 26,21:',reach('mount',6,0,'27,21').has('26,21'));
// exp sim: level after N wild fights at area range
const need=lv=>Math.floor(12+lv*lv*.8);
function run(lv,fights,range,r=1){let exp=0;for(let i=0;i<fights;i++){const fl=range[0]+Math.floor(Math.random()*(range[1]-range[0]+1));const x=Math.floor(fl*RAR[r].exp*.7);const g=Math.floor(x*Math.max(.4,Math.min(1.3,fl/lv)));exp+=g;while(exp>=need(lv)){exp-=need(lv);lv++}}return lv}
let avg=(f)=>{let s=0;for(let i=0;i<500;i++)s+=f();return (s/500).toFixed(1)};
console.log('ch1: Lv5 +12 fights route(2-5):',avg(()=>run(5,12,[2,5])),' +6 meadow(6-9):',avg(()=>run(run(5,12,[2,5]),6,[6,9])));
console.log('valley: Lv11 +10 fights(9-14):',avg(()=>run(11,10,[9,14])));
console.log('mount: Lv15 +10 (13-18):',avg(()=>run(15,10,[13,18])));
console.log('forest: Lv19 +10 (17-23):',avg(()=>run(19,10,[17,23])));
console.log('ch1 grind: Lv9 +10 meadow(8-12):',avg(()=>run(9,10,[8,12])),' +20:',avg(()=>run(9,20,[8,12])));
console.log('after iwao Lv15 +10 valley(12-16):',avg(()=>run(15,10,[12,16])),' mount Lv18 +10(16-20):',avg(()=>run(18,10,[16,20])),' forest Lv21 +10(20-25):',avg(()=>run(21,10,[20,25])));
