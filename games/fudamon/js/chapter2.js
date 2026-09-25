/* 封札モンスターズ — Chapter 2「オーロラクジラを追って」: new areas, trainers, guardians, rival, legends, evolution */
'use strict';
Object.assign(NM,{minamo:'祠守りミナモ',goen:'祠守りゴウエン',yoi:'祠守りヨイ',attendant:'祠の番人'});
ITEMSPOTS.valley=[{id:'v1',x:27,y:22,give:'silver',n:2},{id:'v2',x:2,y:17,give:'potion',n:2},{id:'v3',x:20,y:4,give:'coins',n:300}];
ITEMSPOTS.mount=[{id:'m1',x:28,y:2,give:'gold',n:1},{id:'m2',x:3,y:23,give:'potion',n:3},{id:'m3',x:18,y:23,give:'silver',n:2}];
ITEMSPOTS.forest=[{id:'f1',x:28,y:1,give:'gold',n:2},{id:'f2',x:2,y:26,give:'potion',n:3},{id:'f3',x:21,y:2,give:'coins',n:800}];

/* ---------------- trainers ---------------- */
const TRAINERS={
  yoshio:{map:'field',x:16,y:36,dir:'left',sight:3,sprite:'villager',name:'農家のヨシオ',team:[{id:21,lv:4},{id:26,lv:4}],reward:150,smart:.3,
    pre:'おう、見かけない 札さばきだな！<br>田んぼ仕事の 合間の 一勝負だ！',win:'まいった！ 若いのに やるなぁ！',after:'ふう、田んぼ仕事より くたびれたわい。<br>カッパチは 田んぼの 水路に よく おるぞ。',flag:'yoshio'},
  v_hiker:{map:'valley',x:9,y:5,dir:'down',sight:2,sprite:'hiker',name:'山男のトオル',team:[{id:16,lv:10},{id:7,lv:11}],reward:300,smart:.4,
    pre:'霧の 中から こんにちは！<br>足腰と 札は 鍛えるほど 強くなるんだ！',win:'ぐはっ… 鍛え直しだ！',after:'この 谷は 霧が 深い。<br>水の 魔物が 多いから 雷か 草の 札が 役に立つぞ。'},
  v_girl:{map:'valley',x:22,y:12,dir:'right',sight:2,sprite:'girl',name:'虫とりのハナ',team:[{id:17,lv:11},{id:12,lv:11},{id:27,lv:12}],reward:320,smart:.4,
    pre:'あっ！ めずらしい 札の 気配！<br>わたしの 虫札と 勝負よ！',win:'わたしの 虫札たちが〜！',after:'同じ 魔物の 札を 何枚か 集めて 育てると 進化するんだって！<br>キノコボウの 進化、見てみたいなぁ。'},
  m_hiker:{map:'mount',x:8,y:9,dir:'left',sight:2,sprite:'hiker',name:'登山家のケンジ',team:[{id:3,lv:15},{id:16,lv:15}],reward:450,smart:.5,
    pre:'この 山を 登るなら、まずは おれを 越えていけ！',win:'山頂は まだ 遠いな…。',after:'溶岩の そばでは 炎の 魔物が 元気だ。<br>水の 札を 持っていくと いい。'},
  m_monk:{map:'mount',x:17,y:11,dir:'down',sight:1,sprite:'monk',name:'修行僧のテツ',team:[{id:2,lv:15},{id:18,lv:16},{id:4,lv:16}],reward:480,smart:.5,
    pre:'喝ッ！ 修行の 成果、見せてもらおう！',win:'…まだまだ 修行が 足りぬ。',after:'温泉に つかると 心も 札も ととのうぞ。<br>西の 湯だまりを 調べてみなされ。'},
  f_girl:{map:'forest',x:6,y:10,dir:'right',sight:3,sprite:'girl',name:'ほたるがりのミヨ',team:[{id:27,lv:19},{id:26,lv:20},{id:12,lv:19}],reward:600,smart:.5,
    pre:'しーっ… ホタルが 逃げちゃう。<br>…と 思ったら 封札師さん！ 勝負しよ！',win:'あなたの 札、ホタルより まぶしい…！',after:'森の 奥には 光る 石に かこまれた 場所が あるの。<br>近づくと 背すじが ぞくっと するんだ…。'},
  f_monk:{map:'forest',x:22,y:17,dir:'left',sight:3,sprite:'monk',name:'夜回りのジン',team:[{id:22,lv:20},{id:21,lv:21},{id:24,lv:22}],reward:650,smart:.55,
    pre:'夜の 森を うろつく 者よ… 札で 語れ！',win:'見事な 札だ。 ヨイさまも きっと 認めよう。',after:'月の 祠守り ヨイさまは 闇と 光の 札の 使い手だ。'}
};
const trDone=id=>!!S.flags['tr_'+id]||(id==='yoshio'&&S.flags.yoshio);
async function trainerBattle(n){
  const T=TRAINERS[n.trainer];
  await say(T.pre,T.name);
  const r=await runBattle({trainer:{name:T.name,sprite:T.sprite,team:T.team,reward:T.reward,smart:T.smart,intro:`${T.name}が 勝負を しかけてきた！`,winLine:T.win}});
  if(r==='win'){S.flags['tr_'+n.trainer]=true;if(n.trainer==='yoshio')S.flags.yoshio=true;n.sight=0}
  return r;
}
async function talkTrainer(n){const T=TRAINERS[n.trainer];if(trDone(n.trainer)){await say(T.after,T.name);return}await trainerBattle(n)}
checkTrainers=function(){
  for(const n of G.npcs){if(!n.sight||!n.vis()||!n.trainer||trDone(n.trainer))continue;
    const [dx,dy]=DIRS[n.dir];for(let i=1;i<=n.sight;i++){const x=n.x+dx*i,y=n.y+dy*i;if(SOLID.has(tileAt(x,y)))break;
      if(G.p.x===x&&G.p.y===y){spotted(n,i);return true}}}
  return false;
};
spotted=async function(n,dist){
  G.lock++;n.alert=true;snd('exclaim');await sleep(700);n.alert=false;
  if(!partyCards().some(c=>c.hp>0)){G.lock--;return}
  const back=n.dir,mid=G.mapId;if(dist>1)await moveNPC(n,n.dir,dist-1,5);
  G.p.dir=OPP[n.dir];
  await trainerBattle(n);
  if(dist>1&&G.mapId===mid){await moveNPC(n,OPP[back],dist-1,5);n.dir=back}
  G.lock--;
};

/* ---------------- guardians ---------------- */
const GUARD={
  minamo:{flag:'b2',badge:'水鏡の印',name:'祠守りミナモ',sprite:'ama',team:[{id:9,lv:13},{id:8,lv:14},{id:10,lv:15}],reward:1000,smart:.5,
    hello:['霧の 渓谷へ ようこそ。 わたしは この 谷の 祠守り、ミナモ。','イワオさんの 印を もってるのね。<br>なら 水鏡の 試練、受けてもらうわ！'],
    win:'あなたの 札、澄んだ 水みたいに まっすぐね。',after:'南の 道の 先は ほむら岳。<br>炎の 祠守り ゴウエンが 待っているわ。',next:'南の ほむら岳で、祠守りゴウエンの 試練を 受けよう'},
  goen:{flag:'b3',badge:'焔の印',name:'祠守りゴウエン',sprite:'yamabushi',team:[{id:4,lv:18},{id:3,lv:19},{id:5,lv:21}],reward:1500,smart:.55,
    hello:['おぬしが ツムギ村の 封札師か！<br>わしは ほむら岳の 祠守り、ゴウエン！','炎の 試練は 甘くないぞ。 燃えつきる 覚悟は あるか！'],
    win:'がっはっは！ 見事に 焼かれたわ！',after:'東の 道を 抜ければ 月影の森。<br>夜の 森は 足もとに 気をつけよ。',next:'東の 月影の森で、祠守りヨイの 試練を 受けよう'},
  yoi:{flag:'b4',badge:'月の印',name:'祠守りヨイ',sprite:'miko',team:[{id:23,lv:23},{id:28,lv:23},{id:24,lv:24},{id:29,lv:26}],reward:2000,smart:.6,
    hello:['…月が 教えてくれました。 あなたが 来ることを。','わたしは 月影の森の 祠守り、ヨイ。<br>最後の 印、闇と 光の 札で 見極めます。'],
    win:'…あなたなら、あの 空の 鯨にも 届くでしょう。',after:'四つの 印が そろいました。<br>古札の祠の ご神木へ… 空の 鯨が 待っています。',next:'古札の祠の ご神木で、印の 力を 示そう'}
};
function badgeCount(){return (S.flags.badge?1:0)+['b2','b3','b4'].filter(k=>S.flags[k]).length}
async function talkGuard(n){
  const D=GUARD[n.guard];
  if(S.flags[D.flag]){await say(D.after,D.name);return}
  if(!S.flags['met_'+n.guard]){S.flags['met_'+n.guard]=true;for(const l of D.hello)await say(l,D.name)}
  const i=await ask('試練を 受ける？',D.name,['受ける','まだ準備が…']);
  if(i!==0){await say('準備が できたら また おいで。',D.name);return}
  const r=await runBattle({trainer:{name:D.name,sprite:D.sprite,team:D.team,reward:D.reward,smart:D.smart,intro:`${D.name}が 試練の 勝負を 挑んできた！`,winLine:D.win},music:'boss'});
  if(r!=='win')return;
  S.flags[D.flag]=true;snd('item');await say(`${D.name}から <b>${D.badge}</b>を うけとった！`);
  await say(D.after,D.name);
  if(n.guard==='minamo')await say('そうそう、ツムギ村の 封札堂で <b>金の封札</b>も 売ってもらえるように 伝えておくわね。',D.name);
  G.npcs=buildNPCs(G.mapId);saveGame();showObjective(D.next);
}

/* ---------------- rival rematches ---------------- */
function rivalStarter(){return RIVAL_OF[S.flags.starter]||6}
const RIVAL={
  rv2:{map:'valley',at:(x,y)=>x===16&&y===6,team:()=>[{id:rivalStarter(),lv:13},{id:16,lv:11}],pre:['よう ソーヤ！ やっと 追いついたな！','霧の 谷で 腕試しだ！ いくぜ！'],win:'くっ… 谷の 霧で 前が 見えなかった だけだ！',lose:'へへっ、おれの 勝ち！<br>先に 行ってるぜ！',post:'おれの 相棒も もうすぐ 進化しそうなんだ。<br>同じ 札を 集めて レベルを 上げると 進化するんだぜ！'},
  rv3:{map:'mount',at:(x,y)=>x===22&&y===15,team:()=>[{id:EVO[rivalStarter()].to,lv:18},{id:17,lv:16},{id:14,lv:17}],pre:['ソーヤ！ 見ろよ、おれの 相棒！<br>ついに 進化したんだぜ！','熱い 山には 熱い 勝負が お似合いだ！'],win:'進化しても 勝てないなんて… おまえ、どこまで 強くなるんだ。',lose:'進化の 力、思い知ったか！',post:'月影の森の 先に… あのクジラの 手がかりが あるらしいぜ。'},
  rv4:{map:'forest',at:(x,y)=>x>=11&&x<=18&&y===23,team:()=>[{id:EVO[rivalStarter()].to,lv:23},{id:19,lv:22},{id:20,lv:24}],pre:['来たな ソーヤ。','ここで 決着 つけようぜ。 どっちが クジラに ふさわしいか！'],win:'…負けだ。 完全に な。<br>クジラは おまえに ゆずるよ。 行ってこい！',lose:'はぁ、はぁ… 勝った…！<br>でも おまえも 強くなったな。',post:'おれは もっと 強くなって、いつか あのオロチも 封印してやる。'}
};
async function rivalEvent(key){
  const R=RIVAL[key];G.lock++;S.flags[key]=true;
  bgm('title');G.p.dir='right';
  const rv={key:'rv_ev',sprite:'rival',x:G.p.x+3,y:G.p.y,dir:'left',frame:0,moving:false,prog:0,vis:()=>true};
  if(blocked(rv.x,rv.y)){rv.x=G.p.x;rv.y=G.p.y+2;rv.dir='up';G.p.dir='down'}
  G.npcs.push(rv);rv.alert=true;snd('exclaim');await sleep(600);rv.alert=false;
  const d=rv.dir;const dist=Math.abs(rv.x-G.p.x)+Math.abs(rv.y-G.p.y)-1;if(dist>0)await moveNPC(rv,d,dist,6);
  for(const l of R.pre)await say(l,NM.rival);
  const r=await runBattle({trainer:{name:'レン',sprite:'rival',team:R.team(),reward:600,smart:.5,intro:'ライバルの レンが 勝負を しかけてきた！',winLine:R.win,loseLine:R.lose},canLose:true});
  await say(R.post,NM.rival);
  await moveNPC(rv,OPP[d],dist+2,7);G.npcs=G.npcs.filter(n=>n!==rv);
  updateBGM();saveGame();G.lock--;
}

/* ---------------- legends ---------------- */
async function whaleEvent(){
  G.lock++;
  await say('四つの 印が 光りだした…！<br>ご神木が 空に 向かって 輝いている！');
  bgm('legend');for(let i=0;i<3;i++){G.flash=.8;G.flashCol='#ffe9ff';G.shake=4;snd('charge');await sleep(450)}
  const sky=$('#skyevent');sky.innerHTML=`<div class="whale">${art(MON[30])}</div><div class="aurora"></div>`;sky.hidden=false;snd('rare');
  await sky.querySelector('.whale').animate([{transform:'translate(115cqw,-4cqh) scale(.6)',opacity:0},{transform:'translate(40cqw,6cqh) scale(1.3)',opacity:1}],{duration:RM?500:2600,easing:'ease-out',fill:'forwards'}).finished;
  await say('オオオォォ………ン');
  sky.hidden=true;sky.innerHTML='';
  const r=await runBattle({wild:{id:30,lv:30},bg:ENC.legend,music:'legend'});
  if(r==='sealed'||r==='win'){S.flags.whaleDone=true;saveGame();
    await say(r==='sealed'?'伝説の 魔物… オーロラクジラを 封印した！':'オーロラクジラは 満足そうに 空へ 帰っていった…。');
    await finalEnding();}
  else{await say('オーロラクジラは 雲の 向こうへ 消えていった…。<br>準備を ととのえて、また ご神木に 祈ろう。')}
  G.lock--;
}
async function orochiEvent(){
  G.lock++;
  await say('光る 石の 輪の 中心に 立つと…<br>地の 底から うなり声が 響いてきた！');
  G.shake=6;snd('charge');await sleep(600);G.shake=8;G.flash=.6;G.flashCol='#6b2dbb';await sleep(500);
  const r=await runBattle({wild:{id:25,lv:35},bg:{bg:['#1a0f2e','#6b4bb8'],floor:'#3a2a5e'},music:'legend'});
  if(r==='sealed'){S.flags.orochiDone=true;await say('クロガネオロチを 封印した！<br>ツムギ村の 伝説に、新しい 一ページが 刻まれた。')}
  else if(r==='win'){S.flags.orochiDone=true;await say('クロガネオロチは 地の 底へ 沈んでいった…。')}
  else await say('オロチの 気配が 地の 底へ 消えた…。<br>また 石の 輪に 立てば 現れるだろう。');
  saveGame();G.lock--;
}
async function finalEnding(){
  await say('空に 大きな オーロラが かかった。<br>ツムギ村の みんなも きっと 見上げているだろう。');
  await fadeTo(1,1.2);showEnding(true);
}

/* ---------------- sensei rewards ---------------- */
const DEX_REWARDS=[[10,'gold',2],[20,'gold',3],[30,'coins',3000],[45,'gold',5],[60,'coins',10000]];
async function senseiRewards(){
  const n=sealedCount();let any=false;
  for(const [need,k,cnt] of DEX_REWARDS){if(n>=need&&!S.flags['dex'+need]){S.flags['dex'+need]=true;any=true;
    await say(`図鑑が ${need}種類 に なったのかい！<br>がんばった ごほうびだよ。`,NM.sensei);await getItem(k,cnt)}}
  const nx=DEX_REWARDS.find(r=>n<r[0]);
  if(!any)await say(nx?`図鑑は いま ${n}種類。 ${nx[0]}種類 に なったら ごほうびを あげよう。<br>進化した 姿も 図鑑に 載るからね。`:'図鑑 完成、おめでとう！ おまえは 立派な 封札師だ。',NM.sensei);
}

/* ---------------- wrap story hooks ---------------- */
const _buildNPCs=buildNPCs;
buildNPCs=function(map){
  const L=_buildNPCs(map),F=S.flags;
  const add=o=>L.push(Object.assign({dir:'down',frame:0,moving:false,prog:0,vis:()=>true},o));
  // replace old yoshio with generic trainer
  const y=L.findIndex(n=>n.key==='yoshio');if(y>=0)L.splice(y,1);
  for(const [id,T] of Object.entries(TRAINERS))if(T.map===map&&!(id==='yoshio'&&!F.starter&&false))add({key:id,sprite:T.sprite,x:T.x,y:T.y,dir:T.dir,sight:trDone(id)?0:T.sight,trainer:id,talk:talkTrainer});
  if(map==='field'){
    add({key:'attendant',sprite:'monk',x:23,y:5,dir:'left',vis:()=>!F.badge,talk:async()=>{await say('この 先は 霧の 渓谷へ つづく 道。<br>祠守りの 印を もつ 者しか 通せぬ 決まりじゃ。',NM.attendant)}});
  }
  if(map==='valley'){
    add({key:'minamo',sprite:'ama',x:F.b2?7:6,y:22,dir:F.b2?'down':'up',guard:'minamo',talk:talkGuard});
    add({key:'vfisher',sprite:'fisher',x:12,y:15,dir:'right',talk:async()=>{await say('この 谷の 川の 主は ミズチの 仲間じゃと いう。<br>霧の 濃い 日は 草むらの 奥から 鳴き声が するぞ。','釣り人')}});
  }
  if(map==='mount'){
    add({key:'goen',sprite:'yamabushi',x:27,y:F.b3?20:21,dir:F.b3?'down':'left',guard:'goen',talk:talkGuard});
    add({key:'onsen',sprite:'granny',x:6,y:5,dir:'left',talk:async()=>{await say('ここの 湯だまりは よう 効くよ。<br>調べて ゆっくり つかって いきな。','湯守りのばあさん')}});
  }
  if(map==='forest'){
    add({key:'yoi',sprite:'miko',x:14,y:17,dir:'down',guard:'yoi',talk:talkGuard});
  }
  return L;
};
const _checkTriggers=checkTriggers;
checkTriggers=function(){
  if(_checkTriggers())return true;
  for(const [k,R] of Object.entries(RIVAL)){if(G.mapId===R.map&&!S.flags[k]&&R.at(G.p.x,G.p.y)){rivalEvent(k);return true}}
  if(G.mapId==='forest'&&G.p.x===26&&G.p.y===24&&S.flags.whaleDone&&!S.flags.orochiDone){orochiEvent();return true}
  return false;
};
const _examine=examine;
examine=function(c,x,y){
  if(G.mapId==='field'&&c==='O'&&S.flags.badge){
    if(badgeCount()>=4&&!S.flags.whaleDone)return whaleEvent;
    if(S.flags.whaleDone)return()=>say('ご神木の 上に、ときどき オーロラが ゆらめいている。');
    return()=>say(`ご神木が ほのかに 光っている…。<br>印が あと ${4-badgeCount()}つ そろえば、何かが 起こりそうだ。`);}
  if(G.mapId==='mount'&&c==='Y')return async()=>{await say('あったかい 温泉だ。 ちょっと つかっていこう…。');await restFade();S.flags.healAt='mount';await say('ぽかぽか… カードたちも すっかり 元気に なった！')};
  if(G.mapId!=='field'&&c==='W')return async()=>{await say('冷たい わき水が あふれている。');await restFade();S.flags.healAt=G.mapId;await say('カードたちが 元気を とりもどした！')};
  if(c==='L')return()=>say('どろどろの 溶岩だ。 近づくだけで 顔が あつい…！');
  if(c==='M')return()=>say(G.mapId==='forest'&&S.flags.whaleDone&&!S.flags.orochiDone&&x>=24?'石が 紫色に 脈打っている…。<br>輪の まんなかに 何かが 眠っているようだ。':'月の 文字が 刻まれた 苔むした 石。 ほのかに 光っている。');
  if(c==='S'&&G.mapId!=='field'){const T={valley:'『霧の渓谷』<br>南へ ほむら岳 ・ 西へ 古札の祠',mount:'『ほむら岳』<br>溶岩に 注意！ 東へ 月影の森',forest:'『月影の森』<br>月の祠は 森の 奥'};return()=>say(T[G.mapId])}
  if(G.mapId!=='field'&&(c==='A'||c==='a'))return()=>say({valley:'水鏡の 祠。 澄んだ 水が 祀られている。',mount:'焔の 祠。 消えない 火が 灯っている。',forest:'月の 祠。 丸い 鏡に 月が うつっている。'}[G.mapId]);
  return _examine(c,x,y);
};
talkSensei=async function(){
  if(!S.flags.starter){await say('ケースの中の 3枚から 好きな札を えらびなさい。<br>ケースの前で 調べてごらん。',NM.sensei);return}
  const ci=await ask('いらっしゃい。 封札堂へ ようこそ。',NM.sensei,['お札を買う','図鑑を見せる','話を聞く','やめる']);
  if(ci===0){G.bought=false;await new Promise(res=>shopScreen(()=>{closePanel();res()},'コハル封札堂'));await say(G.bought?'まいど。 良い 札と 出会えますように。':'また いつでも おいで。',NM.sensei);return}
  if(ci===1){await senseiRewards();return}
  if(ci!==2)return;
  const b=badgeCount();
  const L=b===0?['北の 祠には 祠守りの イワオが いる。<br>あの人に 認められたら 一人前の 封札師だよ。','魔物は 弱らせてから 札を 投げると 封じやすい。<br>HPが 赤くなったら 投げどきさ。','炎は草に、草は水と雷に、水は炎に、雷は水に 強い。<br>光と闇は おたがいに 強いんだ。']
    :b<4?['祠の 東の 道から、各地の 祠守りを 訪ねなさい。<br>四つの 印が そろえば、空の 鯨に 届くはずだよ。','同じ 魔物の 札を 重ねて、十分に 育てると 進化する。<br>なかま画面の 札を 調べてごらん。','進化した 姿は 野生では 見つからない。<br>重ね封じ でしか 出会えない 姿なんだよ。']
    :S.flags.whaleDone?['伝説を 封じた 封札師… わたしの 自慢の 弟子だよ。','月影の森の 奥に 光る 石の 輪が あるそうだ。<br>何かが 眠っているとか…。']:['四つの 印が そろったね。<br>古札の祠の ご神木へ 行きなさい。'];
  await say(L[(S.flags.tipI=(S.flags.tipI??-1)+1)%L.length],NM.sensei);
};
endingSequence=async function(){
  G.lock++;
  S.flags.badge=true;snd('item');
  await say('イワオから <b>封札師の印</b>を うけとった！');
  await say('これで おまえも 一人前の 封札師だ。<br>…む？ ご神木の 様子が…。',NM.guardian);
  bgm('shrine');
  for(let i=0;i<3;i++){G.flash=.7;G.flashCol='#fff4d0';G.shake=3;snd('charge');await sleep(500)}
  const sky=$('#skyevent');sky.innerHTML=`<div class="whale">${art(MON[30])}</div><div class="aurora"></div>`;sky.hidden=false;snd('rare');
  await sky.querySelector('.whale').animate([{transform:'translate(-10cqw,10cqh) rotate(-6deg) scale(.7)',opacity:0},{transform:'translate(35cqw,3cqh) rotate(2deg) scale(1)',opacity:.85,offset:.45},{transform:'translate(115cqw,-4cqh) rotate(-4deg) scale(.8)',opacity:0}],{duration:RM?600:4200,easing:'ease-in-out',fill:'forwards'}).finished;
  sky.hidden=true;sky.innerHTML='';
  await say('い、今のは…！？<br>空を 泳ぐ… クジラ…？',S.name);
  G.npcs=buildNPCs('field');const rv=npc('rival');rv.x=14;rv.y=11;rv.dir='up';
  await moveNPC(rv,'up',5,6);rv.dir='left';
  await say('はぁ、はぁ… 見たか ソーヤ！<br>空に でっかい 魔物が…！',NM.rival);
  await say('伝説の 魔物… オーロラクジラ。<br>ご神木が 目をさまし、古い 札の 封印が ゆるんだようだ。',NM.guardian);
  await say('鯨に 近づきたければ、各地の 祠守りから 印を 集めるのだ。<br>祠の 東の 道を 開けておこう。',NM.guardian);
  await say('…おもしろく なってきたじゃん！<br>ソーヤ、どっちが 先に あいつを 封印するか 競争だ！',NM.rival);
  saveGame();
  await chapterCard('第一章 完','第二章「オーロラクジラを追って」');
  showObjective('祠の 東の 道から 霧の渓谷へ。祠守りミナモの 試練を 受けよう');
  G.lock--;
};
function chapterCard(a,b){return new Promise(res=>{const md=$('#modal');md.innerHTML=`<div class="chapter"><small>${a}</small><b>${b}</b></div>`;md.hidden=false;snd('rare');
  const el=md.firstChild;el.animate([{opacity:0,letterSpacing:'.6em'},{opacity:1,letterSpacing:'.15em'}],{duration:RM?1:900,fill:'forwards'});
  setTimeout(()=>{md.hidden=true;md.innerHTML='';res()},RM?1200:3200)})}
const _showEnding=showEnding;
showEnding=function(final){
  if(!final)return _showEnding();
  _showEnding();const el=$('#ending');
  el.querySelector('.eyebrow').textContent='全章 クリア';
  el.querySelector('.end-lead').textContent='空に かかった オーロラの 下、ソーヤの 新しい 旅が はじまる。';
  const nx=el.querySelector('.end-next');nx.innerHTML=`<b>クリア後の おたのしみ</b><span>月影の森の 奥… 光る石の 輪に 眠る 伝説</span><span>図鑑 ${TOTAL}種類の 完成と コハル先生の ごほうび</span><span>すべての 魔物の 進化と、キラ・ゴールド集め</span>`;
};
const _startWorld=startWorld;
startWorld=function(){_startWorld();const b=badgeCount();
  if(S.flags.badge&&!S.flags.whaleDone){const t=b<2?GUARD.minamo.next.replace('南の ほむら岳で、祠守りゴウエンの','祠の 東の 道から 霧の渓谷へ。祠守りミナモの'):b<3?GUARD.minamo.next:b<4?GUARD.goen.next:GUARD.yoi.next;
    showObjective(b<2?'祠の 東の 道から 霧の渓谷へ。祠守りミナモの 試練を 受けよう':t)}};
