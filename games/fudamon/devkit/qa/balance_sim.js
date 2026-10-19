global.window=global;global.G=null;eval(require('fs').readFileSync('js/data.js','utf8').replace("'use strict';",'')+';global.MON=MON;global.MV=MV;global.eff=eff;global.EVO=EVO');
function mstats(id,lv){const b=MON[id].b;return{hp:Math.floor(b.hp*2*lv/100+lv+10),atk:Math.floor(b.atk*2*lv/100+5),def:Math.floor(b.def*2*lv/100+5),spd:Math.floor(b.spd*2*lv/100+5)}}
function movesOf(id,lv){const m=MON[id];const L=[{...MV.normal,t:'normal'},{...MV[m.t][0],t:m.t}];if(lv>=9||m.r>=3)L.push({...MV[m.t][1],t:m.t,p:m.r===4?100:85});return L}
const dmg=(a,d,mv)=>{if(Math.random()>(mv.acc||1))return 0;const e=eff(mv.t,MON[d.id].t),st=mv.t===MON[a.id].t?1.2:1,cr=Math.random()<.0625?1.5:1;return Math.max(1,Math.floor((((2*a.lv/5+2)*mv.p*a.st.atk/Math.max(1,d.st.def))/50+2)*st*e*cr*(.85+Math.random()*.15)))};
const mk=(id,lv)=>{const u={id,lv,st:mstats(id,lv)};u.hp=u.st.hp;return u};
function best(a,d){const L=movesOf(a.id,a.lv);let b=L[0],bv=0;for(const m of L){const v=m.p*(m.acc||1)*eff(m.t,MON[d.id].t)*(m.t===MON[a.id].t?1.2:1);if(v>bv){bv=v;b=m}}return b}
function fight(party,team,smart,pots){party=party.map(([i,l])=>mk(i,l));let p=pots,ai=0,turns=0;
 for(const [tid,tl] of team){const f=mk(tid,tl);
  while(f.hp>0){if(++turns>400)return 0;const me=party[ai];
   const FL=movesOf(f.id,f.lv);const fm=Math.random()<smart?best(f,me):FL[Math.random()*FL.length|0];
   if(me.hp<me.st.hp*.3&&p>0){p--;me.hp=Math.min(me.st.hp,me.hp+Math.ceil(me.st.hp/2));me.hp-=dmg(f,me,fm)}
   else{const mm=best(me,f);if(me.st.spd>=f.st.spd){f.hp-=dmg(me,f,mm);if(f.hp>0)me.hp-=dmg(f,me,fm)}else{me.hp-=dmg(f,me,fm);if(me.hp>0)f.hp-=dmg(me,f,mm)}}
   if(me.hp<=0){ai++;if(ai>=party.length)return 0}}}
 return 1}
const rate=(party,team,sm,pots)=>{let w=0;for(let i=0;i<600;i++)w+=fight(party,team,sm,pots);return Math.round(w/6)};
const T=eval(process.argv[2]),sm=+process.argv[3];
for(const s of [1,6,11]){const row=[];for(const lv of [11,13,15,17]){const ev=(process.argv[4]==="noevo"||lv<14)?s:EVO[s].to;row.push(lv+':'+rate([[ev,lv],[16,lv-2],[26,lv-2]],T,sm,2))}console.log(MON[s].name,row.join('  '))}
