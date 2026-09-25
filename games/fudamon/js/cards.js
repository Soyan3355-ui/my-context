/* 封札モンスターズ — monster art (SVG) and card rendering */
'use strict';
const pad3=n=>String(n).padStart(3,'0');
/* ============ art ============ */
const SHAPES={
  round:{top:36,fy:57,w:28,body:'<ellipse cx="50" cy="63" rx="28" ry="26"/>',belly:1},
  tall:{top:24,fy:45,w:22,body:'<rect x="28" y="24" width="44" height="64" rx="22"/>',belly:1},
  wide:{top:44,fy:61,w:35,body:'<ellipse cx="50" cy="67" rx="35" ry="22"/>',belly:1},
  drop:{top:20,fy:66,w:26,body:'<path d="M50 20 C40 36 24 50 24 66 A26 22 0 0 0 76 66 C76 50 60 36 50 20Z"/>',shine:[40,50]},
  ghost:{top:32,fy:56,w:26,body:'<path d="M24 58 A26 26 0 0 1 76 58 L76 86 L67 80 L58 88 L50 80 L42 88 L33 80 L24 86Z"/>',shine:[36,46]}
};
function starPath(cx,cy,R,r,n=5){let d='';for(let i=0;i<n*2;i++){const a=Math.PI/n*i-Math.PI/2,rr=i%2?r:R;d+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)}return d+'Z'}
function flamePath(x,y,s){return `M${x} ${y-14*s} C${x+7*s} ${y-6*s} ${x+8*s} ${y} ${x+4*s} ${y+4*s} L${x-4*s} ${y+4*s} C${x-8*s} ${y} ${x-7*s} ${y-6*s} ${x} ${y-14*s}Z`}
function art(m){
  if(window.MONART&&MONART[m.id]){try{return MONART[m.id]()}catch(e){}}
  return artSimple(m);
}
function artSimple(m){
  const a=m.art,T=TYPES[m.t],c1=a.col||T.c,c2=a.col2||T.c2,O='#2b2440';
  const s=SHAPES[a.shape],t=s.top,fy=s.fy,w=s.w,back=[],front=[],tops=a.top||[];
  const dbl=(d,col,wd=5)=>`<path d="${d}" fill="none" stroke="${O}" stroke-width="${wd+4}"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}"/>`;
  if(a.mane){let d='';for(let i=0;i<32;i++){const an=Math.PI*2/32*i,rr=i%2?29:38;d+=(i?'L':'M')+(50+Math.cos(an)*rr).toFixed(1)+' '+(fy+4+Math.sin(an)*rr*.82).toFixed(1)}back.push(`<path d="${d}Z" fill="#ffb347"/>`)}
  // tail
  const tx=50+w-4,ty=fy+20;
  if(a.tail==='flame'){back.push(dbl(`M${tx} ${ty} Q${tx+14} ${ty} ${tx+14} ${ty-12}`,c1)+`<path d="${flamePath(tx+14,ty-16,1)}" fill="#ff9a3c"/><path d="${flamePath(tx+14,ty-14,.5)}" fill="#ffe066" stroke="none"/>`)}
  if(a.tail==='long')back.push(dbl(`M${tx} ${ty} Q${tx+22} ${ty+4} ${tx+15} ${ty-22}`,c1,6));
  if(a.tail==='zigzag')back.push(`<polyline points="${tx},${ty} ${tx+11},${ty-4} ${tx+6},${ty-12} ${tx+18},${ty-19}" fill="none" stroke="${O}" stroke-width="9"/><polyline points="${tx},${ty} ${tx+11},${ty-4} ${tx+6},${ty-12} ${tx+18},${ty-19}" fill="none" stroke="#ffd84a" stroke-width="5"/>`);
  if(a.tail==='fish')back.push(`<path d="M${tx-2} ${ty} L${tx+14} ${ty-11} L${tx+11} ${ty} L${tx+14} ${ty+10}Z" fill="${c2}"/>`);
  if(a.tail==='leaf')back.push(dbl(`M${tx} ${ty} Q${tx+12} ${ty} ${tx+13} ${ty-10}`,c1,4)+`<path d="M${tx+13} ${ty-10} C${tx+6} ${ty-16} ${tx+10} ${ty-26} ${tx+18} ${ty-28} C${tx+22} ${ty-20} ${tx+20} ${ty-12} ${tx+13} ${ty-10}Z" fill="#7fd36e"/>`);
  for(const d of[-1,1]){
    // wings
    if(a.wings==='bat'){const x=50+d*(w-3),wc=a.wingCol||'#5b4a8f';back.push(`<path d="M${x} ${fy} L${x+d*19} ${fy-16} L${x+d*15} ${fy-3} L${x+d*22} ${fy+3} L${x+d*11} ${fy+8} L${x+d*13} ${fy+16} L${x} ${fy+14}Z" fill="${wc}"/>`)}
    if(a.wings==='feather'){const x=50+d*(w+4);back.push(`<ellipse cx="${x}" cy="${fy+2}" rx="13" ry="7" transform="rotate(${-d*30} ${x} ${fy+2})" fill="${c2}"/><ellipse cx="${x+d*2}" cy="${fy+10}" rx="10" ry="5" transform="rotate(${-d*10} ${x+d*2} ${fy+10})" fill="${c2}"/>`)}
    if(a.wings==='bee'){const x=50+d*(w-2);back.push(`<ellipse cx="${x}" cy="${fy-14}" rx="11" ry="6.5" transform="rotate(${-d*35} ${x} ${fy-14})" fill="#eaf8ff" fill-opacity=".9"/>`)}
    if(a.fins)back.push(`<path d="M${50+d*(w-4)} ${fy+6} L${50+d*(w+10)} ${fy+1} L${50+d*(w-1)} ${fy+18}Z" fill="${c2}"/>`);
    // ears
    if(a.ears==='pointy'){const x=50+d*15;back.push(`<path d="M${x-8*d} ${t+12} L${x+4*d} ${t-12} L${x+9*d} ${t+10}Z" fill="${c1}"/><path d="M${x-3*d} ${t+8} L${x+3*d} ${t-4} L${x+5*d} ${t+8}Z" fill="${c2}" stroke="none"/>`)}
    if(a.ears==='round'){const x=50+d*19;back.push(`<circle cx="${x}" cy="${t+4}" r="9" fill="${c1}"/><circle cx="${x}" cy="${t+4}" r="4.5" fill="${c2}" stroke="none"/>`)}
    if(a.ears==='long'){const x=50+d*11,y=t-12;back.push(`<ellipse cx="${x}" cy="${y}" rx="6" ry="17" transform="rotate(${d*14} ${x} ${y})" fill="${c1}"/><ellipse cx="${x}" cy="${y+2}" rx="2.8" ry="11" transform="rotate(${d*14} ${x} ${y})" fill="${c2}" stroke="none"/>`)}
    if(tops.includes('horns'))back.push(`<path d="M${50+d*8} ${t+8} Q${50+d*20} ${t} ${50+d*20} ${t-14} Q${50+d*14} ${t-4} ${50+d*2} ${t+6}Z" fill="#fff3d6"/>`);
    if(tops.includes('antlers'))back.push(`<path d="M${50+d*8} ${t+6} L${50+d*14} ${t-10} L${50+d*22} ${t-16} M${50+d*14} ${t-10} L${50+d*12} ${t-20} M${50+d*11} ${t-1} L${50+d*20} ${t-4}" stroke="${O}" stroke-width="6.5" fill="none"/><path d="M${50+d*8} ${t+6} L${50+d*14} ${t-10} L${50+d*22} ${t-16} M${50+d*14} ${t-10} L${50+d*12} ${t-20} M${50+d*11} ${t-1} L${50+d*20} ${t-4}" stroke="#c89464" stroke-width="3" fill="none"/>`);
    if(tops.includes('antenna'))back.push(`<path d="M${50+d*6} ${t+6} Q${50+d*8} ${t-6} ${50+d*14} ${t-12}" fill="none"/><circle cx="${50+d*14}" cy="${t-13}" r="3.6" fill="${c2}"/>`);
  }
  if(tops.includes('flame'))back.push(`<path d="${flamePath(50,t-4,1.4)}" fill="#ff9a3c"/><path d="${flamePath(50,t+1,.7)}" fill="#ffe066" stroke="none"/>`);
  if(tops.includes('leaf'))back.push(`<path d="M50 ${t+6} L50 ${t-6}" fill="none"/><path d="M50 ${t-6} C42 ${t-6} 36 ${t-12} 34 ${t-18} C42 ${t-18} 48 ${t-14} 50 ${t-6}Z" fill="#7fd36e"/><path d="M50 ${t-6} C58 ${t-6} 64 ${t-12} 66 ${t-18} C58 ${t-18} 52 ${t-14} 50 ${t-6}Z" fill="#7fd36e"/>`);
  if(tops.includes('tuft'))back.push(`<path d="M44 ${t+6} Q41 ${t-8} 47 ${t-11} Q47 ${t-2} 50 ${t+2} Q52 ${t-13} 59 ${t-9} Q54 ${t-2} 56 ${t+6}Z" fill="${c2}"/>`);
  if(tops.includes('horn'))back.push(`<path d="M45 ${t+6} L50 ${t-17} L55 ${t+6}Z" fill="#fff3d6"/>`);
  // belly / shine / marks
  if(s.belly)front.push(`<ellipse cx="50" cy="${fy+17}" rx="${(w*.55).toFixed(1)}" ry="${a.shape==='wide'?9:11}" fill="${c2}" stroke="none" opacity=".92"/>`);
  if(s.shine)front.push(`<ellipse cx="${s.shine[0]}" cy="${s.shine[1]}" rx="3.5" ry="6.5" transform="rotate(25 ${s.shine[0]} ${s.shine[1]})" fill="#fff" opacity=".6" stroke="none"/>`);
  if(a.mark==='spots')front.push(`<circle cx="${50-w*.62}" cy="${fy+6}" r="3.4" fill="${c2}" stroke="none"/><circle cx="${50+w*.66}" cy="${fy+4}" r="2.6" fill="${c2}" stroke="none"/><circle cx="${50+w*.5}" cy="${t+7}" r="2.4" fill="${c2}" stroke="none"/>`);
  if(a.mark==='stripes')front.push(`<path d="M${39} ${t+6} Q50 ${t+10} ${61} ${t+6} M${33} ${t+13} Q50 ${t+18} ${67} ${t+13}" fill="none" stroke="${O}" stroke-width="3"/>`);
  if(a.mark==='zigzag')front.push(`<polyline points="${50-w*.45},${fy+17} ${50-w*.2},${fy+12} 50,${fy+18} ${50+w*.2},${fy+12} ${50+w*.45},${fy+17}" fill="none" stroke="#b37a00" stroke-width="3"/>`);
  if(a.mark==='star')front.push(`<path d="${starPath(50+w*.5,fy+15,5.5,2.4)}" fill="#fff6a8" stroke-width="1.5"/>`);
  if(a.mark==='scales')front.push(`<path d="M44 ${fy+14} q3 3 6 0 q3 3 6 0 M41 ${fy+20} q3 3 6 0 q3 3 6 0 q3 3 6 0" fill="none" stroke="${c1}" stroke-width="1.8"/>`);
  // face
  const ex=a.shape==='wide'?13:10,ey=fy;
  for(const d of[-1,1]){const X=50+d*ex;
    if(a.eye==='round'||a.eye==='sharp')front.push(`<ellipse cx="${X}" cy="${ey}" rx="4.6" ry="${a.eye==='sharp'?5:5.8}" fill="${O}" stroke="none"/><circle cx="${X+1.4}" cy="${ey-2}" r="1.8" fill="#fff" stroke="none"/>`);
    if(a.eye==='sharp')front.push(`<path d="M${X+d*6} ${ey-10} L${X-d*5} ${ey-6.5}" fill="none" stroke-width="2.6"/>`);
    if(a.eye==='happy')front.push(`<path d="M${X-5} ${ey+1.5} Q${X} ${ey-5} ${X+5} ${ey+1.5}" fill="none" stroke-width="2.8"/>`);
    if(a.eye==='glow')front.push(`<ellipse cx="${X}" cy="${ey}" rx="5" ry="5.6" fill="#ffe96b" stroke-width="1.6"/><ellipse cx="${X}" cy="${ey}" rx="1.4" ry="4" fill="${O}" stroke="none"/>`);
    if(a.eye!=='glow')front.push(`<ellipse cx="${50+d*(ex+8)}" cy="${ey+6}" rx="3.6" ry="2.2" fill="#ff6f93" opacity=".5" stroke="none"/>`);
  }
  front.push(a.eye==='sharp'?`<path d="M45 ${ey+8} Q50 ${ey+11} 55 ${ey+8}" fill="none" stroke-width="2"/><path d="M52 ${ey+9} L53.5 ${ey+12.5} L55 ${ey+8.5}Z" fill="#fff" stroke-width="1.2"/>`
    :a.eye==='glow'?`<path d="M45 ${ey+9} L47.5 ${ey+7} L50 ${ey+9} L52.5 ${ey+7} L55 ${ey+9}" fill="none" stroke="#ffe96b" stroke-width="1.8"/>`
    :`<path d="M46 ${ey+7} Q48 ${ey+10} 50 ${ey+7} Q52 ${ey+10} 54 ${ey+7}" fill="none" stroke-width="2"/>`);
  if(tops.includes('flower')){for(let i=0;i<5;i++){const an=Math.PI*2/5*i-Math.PI/2;front.push(`<circle cx="${(62+Math.cos(an)*5).toFixed(1)}" cy="${(t+4+Math.sin(an)*5).toFixed(1)}" r="4" fill="#ff9ec7" stroke-width="1.6"/>`)}front.push(`<circle cx="62" cy="${t+4}" r="2.8" fill="#ffe066" stroke-width="1.4"/>`)}
  if(tops.includes('crown'))front.push(`<path d="M39 ${t+3} L39 ${t-8} L44.5 ${t-2} L50 ${t-12} L55.5 ${t-2} L61 ${t-8} L61 ${t+3}Z" fill="#ffd34d"/>`);
  if(tops.includes('halo'))front.push(`<ellipse cx="50" cy="${t-(tops.includes('crown')?18:10)}" rx="14" ry="4" fill="none" stroke="#ffe27a" stroke-width="3.2"/>`);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="${O}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${back.join('')}<g fill="${c1}">${s.body}</g>${front.join('')}</g></svg>`;
}

/* ============ card html ============ */
function cardHTML(c,o={}){
  const m=MON[c.id],T=TYPES[m.t],v=c.v||'normal';
  return `<div class="card r${m.r} v-${v}${o.cls?' '+o.cls:''}" style="--tc:${T.c};--tc2:${T.c2}">
  <div class="ci"><div class="c-head"><span class="c-no">No.${pad3(m.id)}</span><span class="c-type">${T.n}</span></div>
  <div class="c-art">${art(m)}<span class="c-seal">封</span></div>
  <div class="c-name">${m.name}</div>
  <div class="c-meta"><span class="c-stars">${'★'.repeat(m.r)}</span><span>${c.lv?'Lv'+c.lv:RAR[m.r].n}</span></div></div>
  ${v!=='normal'?`<span class="c-badge">${v==='gold'?'GOLD':'キラ'}</span>`:''}<div class="c-foil"></div></div>`;
}
