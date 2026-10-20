#!/usr/bin/env node
// 領収書・請求書を A4 の PDF（1ページ）にする。使い方は README.md。
// node make_docs.js --settings settings.json --items items.json --out ./out
const fs=require('fs'),path=require('path'),cp=require('child_process');
const arg=k=>{const i=process.argv.indexOf('--'+k);return i>=0?process.argv[i+1]:null};
const S=JSON.parse(fs.readFileSync(arg('settings'),'utf8')),items=JSON.parse(fs.readFileSync(arg('items'),'utf8')),out=arg('out')||'./out';
fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>'¥'+Math.round(n||0).toLocaleString('ja-JP');
const num=v=>{const n=parseInt(String(v||'').replace(/[^\d-]/g,''),10);return isNaN(n)?0:n};
const pad=(n,w)=>String(n).padStart(w,'0');
const jdate=s=>{if(!s)return '';const [y,m,d]=s.split('-');return y+'年'+(+m)+'月'+(+d)+'日'};
const taxIn=(t,r)=>r>0?Math.floor(t*r/(100+r)):0;
function issuer(){const z=S.zip?('〒'+S.zip+'\n'):'';return `<div class="iss"><b>${esc(S.name)}</b>${esc(z+(S.addr||'')).replace(/\n/g,'<br>')}${S.person?'<br>'+esc(S.person):''}${S.reg?'<br>登録番号 '+esc(S.reg):''}</div>`}
function receiptHTML(d){const total=num(d.amount),rate=d.rate==null?10:+d.rate,tax=taxIn(total,rate);
  const stamp=total>=50000?'<div class="stamp" style="right:auto;left:60px">収入印紙<br>（5万円以上）</div>':(S.stamp==='1'?'<div class="stamp">印</div>':'');
  return `<div class="paper"><div class="meta"><span>No. ${esc(d.no)}</span><span>${esc(jdate(d.date))}</span></div><h3>領収書</h3>
  <div class="to"><span>${esc(d.to)}</span><small>${esc(d.hon==null?'様':d.hon)}</small></div>
  <div class="amt"><span>金　額</span><b>${yen(total)}　-</b><i>（税込）</i></div>
  <div class="for">但し　${esc(d.forText||'')}</div>
  <div class="for" style="font-size:13px">上記、正に領収いたしました。${d.pay?'（'+esc(d.pay)+'）':''}</div>
  <div class="row2" style="margin-top:26px"><div style="font-size:12.5px;line-height:1.8">${rate>0?`<div>内訳　税抜金額　${yen(total-tax)}</div><div>　　　消費税（${rate}%）　${yen(tax)}</div>`:'<div>内訳　非課税</div>'}${d.note?`<div class="note" style="margin-top:12px;border:0;padding:0">${esc(d.note)}</div>`:''}</div>${issuer()}</div>${stamp}</div>`}
function invCalc(d){let sub=0;(d.lines||[]).forEach(l=>{sub+=Math.round((+l.q||0)*num(l.p))});const tax=Math.floor(sub*0.1);return {sub,tax,total:sub+tax}}
function invoiceHTML(d){const c=invCalc(d),rows=(d.lines||[]).map(l=>`<tr><td>${esc(l.d)}</td><td class="r">${esc(l.q)}</td><td class="c">${esc(l.u||'')}</td><td class="r">${yen(num(l.p))}</td><td class="r">${yen(Math.round((+l.q||0)*num(l.p)))}</td></tr>`).join('');
  return `<div class="paper"><div class="meta"><span>請求書番号 ${esc(d.no)}</span><span>請求日 ${esc(jdate(d.date))}</span></div><h3>請求書</h3>
  <div class="row2"><div style="flex:1;min-width:0"><div class="to" style="width:100%"><span>${esc(d.to)}</span><small>${esc(d.hon==null?'御中':d.hon)}</small></div>${d.subject?`<div style="margin-top:8px;font-size:13px">件名：${esc(d.subject)}</div>`:''}<div style="margin-top:10px;font-size:12.5px">${esc(d.msg||S.invmsg||'')}</div></div>${issuer()}</div>
  <div class="amt" style="width:62%"><span>ご請求金額</span><b>${yen(c.total)}</b><i>（税込）</i></div>${d.due?`<div style="font-size:13px;margin-bottom:6px">お支払期限　${esc(jdate(d.due))}</div>`:''}
  <table><thead><tr><th style="width:44%">品名</th><th>数量</th><th>単位</th><th>単価</th><th>金額（税抜）</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tot"><div><span>小計</span><span>${yen(c.sub)}</span></div><div><span>消費税（10%）</span><span>${yen(c.tax)}</span></div><div class="g"><span>合計</span><span>${yen(c.total)}</span></div></div>
  ${S.bank?`<div class="bank"><b>お振込先</b>\n${esc(S.bank)}</div>`:''}${(d.note||S.invnote)?`<div class="note">${esc(d.note==null?S.invnote:d.note)}</div>`:''}</div>`}
const safe=s=>String(s||'').replace(/[\\/:*?"<>|\s]+/g,'_');
(async()=>{
  const {chromium}=require(cp.execSync('npm root -g').toString().trim()+'/playwright');
  const css=fs.readFileSync(path.join(__dirname,'paper.css'),'utf8');
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const hist=[];let nrec=num(S.nrec)||1,ninv=num(S.ninv)||1;const files=[];
  for(const d of items){
    if(!d.no){d.no=d.kind==='invoice'?'INV-'+pad(ninv++,10):'R-'+pad(nrec++,4)}
    const html=d.kind==='invoice'?invoiceHTML(d):receiptHTML(d);
    const q=await b.newPage();await q.setContent('<meta charset=utf8><style>'+css+'</style>'+html);await q.waitForTimeout(300);
    const f=path.join(out,(d.kind==='invoice'?'請求書_':'領収書_')+safe(d.to)+'_'+String(d.date).replace(/-/g,'')+'_'+d.no+'.pdf');
    await q.pdf({path:f,width:'210mm',height:'297mm',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});await q.close();
    const raw=fs.readFileSync(f),pages=(raw.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g)||[]).length;
    if(pages!==1)console.error('WARNING: ページ数が1ではありません',f,pages);
    files.push(f);
    const total=d.kind==='invoice'?invCalc(d).total:num(d.amount);
    hist.push(Object.assign({},d,{hon:d.hon==null?(d.kind==='invoice'?'御中':'様'):d.hon,total,createdAt:Date.now(),updatedAt:Date.now()}));
  }
  await b.close();
  fs.writeFileSync(path.join(out,'history.json'),JSON.stringify(hist,null,1));
  fs.writeFileSync(path.join(out,'settings.next.json'),JSON.stringify(Object.assign({},S,{nrec,ninv}),null,1));
  console.log(files.join('\n'));
})();
