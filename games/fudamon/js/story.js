/* 封札モンスターズ — story, NPCs, events, title, intro, ending, boot */
'use strict';
const ITEMSPOTS={
  field:[
    {id:'i1',x:22,y:34,give:'potion',n:1},
    {id:'i2',x:4,y:40,give:'silver',n:1},
    {id:'i3',x:20,y:5,give:'gold',n:1},
    {id:'i4',x:24,y:62,give:'coins',n:120},
    {id:'i5',x:6,y:16,give:'white',n:3}
  ]
};
const itemAt=(x,y)=>(ITEMSPOTS[G.mapId]||[]).find(i=>!S.picked[i.id]&&i.x===x&&i.y===y);
const _blocked=blocked;blocked=function(x,y){return _blocked(x,y)||!!itemAt(x,y)};
const RIVAL_OF={1:6,6:11,11:1};
const NM={mom:'お母さん',sensei:'コハル先生',rival:'レン',kid:'タイチ',cat:'ミケ',granny:'ウメばあちゃん',villager:'農家のヨシオ',fisher:'ゲンじい',trader:'行商人マツ',guardian:'祠守りイワオ'};

/* ---------------- NPC definitions ---------------- */
function buildNPCs(map){
  const F=S.flags,L=[];
  const add=o=>{L.push(Object.assign({dir:'down',frame:0,moving:false,prog:0,vis:()=>true},o))};
  if(map==='home'){
    add({key:'mom',sprite:'mom',x:7,y:4,dir:'left',idle:true,talk:talkMom});
  }
  if(map==='shop'){
    add({key:'sensei',sprite:'sensei',x:3,y:3,dir:'down',talk:talkSensei});
    add({key:'rival',sprite:'rival',x:8,y:4,dir:'left',vis:()=>!S.flags.rivalLeft,talk:async()=>{await say('どの札にするか 迷ってるのか？<br>おれは もう決めてるけどな！',NM.rival)}});
  }
  if(map==='field'){
    add({key:'kid',sprite:'kid',x:F.starter?11:13,y:F.starter?46:45,dir:F.starter?'right':'down',talk:talkKid});
    add({key:'cat',sprite:'cat',x:F.starter?17:14,y:F.starter?46:45,dir:'down',idle:!!F.starter,talk:talkCat});
    add({key:'granny',sprite:'granny',x:22,y:53,dir:'left',idle:true,talk:talkGranny});
    add({key:'farmer2',sprite:'villager',x:8,y:53,dir:'left',talk:talkFarmer});
    add({key:'yoshio',sprite:'villager',x:16,y:36,dir:'left',sight:3,trainer:'yoshio',talk:talkYoshio});
    add({key:'trader',sprite:'trader',x:21,y:24,dir:'left',talk:talkTrader});
    add({key:'fisher',sprite:'fisher',x:9,y:28,dir:'up',talk:talkFisher});
    add({key:'guardian',sprite:'guardian',x:13,y:4,dir:'down',talk:talkGuardian});
    add({key:'rival',sprite:'rival',x:14,y:6,dir:'left',vis:()=>!!S.flags.badge,talk:async()=>{await say('祠のご神木が 光ったの、見たか？<br>…おれ、もっと強くなる。次は 負けないからな！',NM.rival)}});
  }
  return L;
}
const npc=k=>G.npcs.find(n=>n.key===k);

/* ---------------- talks ---------------- */
async function talkMom(){
  if(!S.flags.starter){await say('ソーヤ、やっと起きた？<br>コハル先生が 朝から 呼んでたわよ。',NM.mom);await say('今日は 見習い封札師として はじめて 自分の札を もらう日でしょ？<br>先生の お店は 村の 右上。青い屋根の おうちよ。',NM.mom);return}
  await say('おかえり！ ちょっと 休んでいきなさい。',NM.mom);
  await restFade();S.flags.healAt='home';
  await say('カードたちも すっかり 元気に なったわね。<br>いってらっしゃい、気をつけてね！',NM.mom);
}
async function restFade(){snd('heal');await fadeTo(1,.35);healAll();await sleep(500);await fadeTo(0,.35);toast('カードたちが 元気に なった！')}
async function talkSensei(){
  if(!S.flags.starter){await say('ケースの中の 3枚から 好きな札を えらびなさい。<br>ケースの前で 調べてごらん。',NM.sensei);return}
  const ci=await ask('いらっしゃい。 封札堂へ ようこそ。',NM.sensei,['お札を買う','話を聞く','やめる']);
  if(ci===0){G.bought=false;await new Promise(res=>shopScreen(()=>{closePanel();res()},'コハル封札堂'));await say(G.bought?'まいど。 良い 札と 出会えますように。':'また いつでも おいで。',NM.sensei);return}
  if(ci!==1)return;
  if(!S.flags.badge){
    const tips=['北の 祠には 祠守りの イワオが いる。<br>あの人に 認められたら 一人前の 封札師だよ。','魔物は 弱らせてから 札を 投げると 封じやすい。<br>HPが 赤くなったら 投げどきさ。','炎は草に、草は水と雷に、水は炎に、雷は水に 強い。<br>光と闇は おたがいに 強いんだ。','同じ魔物でも キラや ゴールドの札が あるんだよ。<br>わたしも 集めるのに 夢中になった ものさ。'];
    await say(tips[(S.flags.tipI=(S.flags.tipI??-1)+1)%tips.length],NM.sensei);return}
  await say('イワオに 認められたんだって？<br>ふふ、わたしの 見立てどおりだ。<br>これからも いろんな 札と 出会いなさい。',NM.sensei);
}
async function talkKid(n){
  if(!S.flags.starter){await say('ここから 先は 草むらだよ！<br>自分の カードを 持ってないと 野生の魔物に おそわれちゃうぞ！',NM.kid);await say('ミケも 通せんぼ してるし！',NM.kid);return}
  const L=['イナビーって 知ってる？ おしりが ピリピリ するんだ。<br>ぼく、いつか キラの イナビーを 封印するんだ！','草むらを 歩くと 魔物が 飛び出してくるよ。<br>Shiftキーか Bボタンで 走れるって 知ってた？','封札パックって 知ってる？<br>行商人の マツさんが 売ってるんだって！'];
  await say(L[(n.t=(n.t??-1)+1)%L.length],NM.kid);
}
async function talkCat(n){
  if(!S.flags.starter){await say('ミケは 道の まんなかで 気持ちよさそうに 寝ている…。');await say('ぐぅ… ぐぅ…');return}
  const L=['ニャーン。','ミケは おなかを 見せて ごろんと した。','ミケは しっぽで ソーヤの 足を なでた。<br>…なんだか 誇らしげだ。','ミケは じっと 草むらを 見つめている。<br>何かが いるのかも しれない。'];
  snd('blip');await say(L[(n.t=(n.t??-1)+1)%L.length],NM.cat);
}
async function talkGranny(){await say('夕方になるとね、わたしの 影が ひとつ 多い 日が あるのよ。<br>カゲボウって 子の しわざらしいねぇ。',NM.granny);await say('悪さは しないよ。 ちょっと さみしがりな だけさね。',NM.granny)}
async function talkFarmer(){await say('おれの 畑は 草タイプの 魔物に 大人気でなぁ。<br>野菜が 食われないように 炎タイプの 札を 持ち歩いとるんだ。',NM.villager.replace('ヨシオ','ハルオ'));await say('相性さえ 覚えりゃ、格上の 魔物とも 渡りあえるぞ！','農家のハルオ')}
async function talkFisher(){
  await say('この川にはな、ミズチという 水の竜が 住んどると 言われとる。<br>わしは 50年 釣っとるが… まだ 会えとらん。',NM.fisher);
  if(!S.flags.fisherGift){S.flags.fisherGift=true;await say('ほれ、若いの。 これを 持っていけ。',NM.fisher);await getItem('potion',2)}
}
async function talkTrader(){
  if(!S.flags.traderMet){S.flags.traderMet=true;await say('おや、見習いさんかい？ わたしは 札と 香を 売り歩く マツと いう者。<br>旅の 支度なら まかせておくれ。',NM.trader);await say('そうだ、ひとつ 頼みが あるんだ。<br>野生の 魔物を 3種類 封印して 見せてくれたら、お礼を はずむよ。',NM.trader)}
  const i=await ask('なにか 用かい？',NM.trader,['買い物をする','頼みごと','休ませてもらう','またね']);
  if(i===2){await say('旅の 疲れには この お香が いちばんさ。',NM.trader);await restFade();await say('カードたちも すっかり 元気に なったね。',NM.trader);return}
  if(i===0){G.bought=false;await new Promise(res=>shopScreen(()=>{closePanel();res()}));await say(G.bought?'毎度あり！ 良い 札と 出会えますように。':'また いつでも 寄っておくれ。',NM.trader)}
  if(i===1){
    if(S.flags.traderGift){await say('キラの 札を 集めるなら 銀や 金の 封札が おすすめさ。<br>札の 気品が 魔物を 引きよせるのさ。',NM.trader);return}
    const n=Object.values(S.dex).filter(d=>d.wild).length;
    if(n<3){await say(`野生の 魔物を 3種類 封印して 見せておくれ。<br>いまは ${n}種類だね。 お礼は はずむよ！`,NM.trader);return}
    await say('おお、3種類も！ 見事な 札さばきだ。<br>約束の お礼だよ。',NM.trader);S.flags.traderGift=true;await getItem('silver',2);
  }
}
async function talkYoshio(n){
  if(S.flags.yoshio){await say('ふう、田んぼ仕事より くたびれたわい。<br>カッパチは 田んぼの 水路に よく おるぞ。',NM.villager);return}
  await yoshioBattle(n);
}
async function yoshioBattle(n){
  await say('おう、見かけない 札さばきだな！<br>田んぼ仕事の 合間の 一勝負だ！',NM.villager);
  const r=await runBattle({trainer:{name:'農家のヨシオ',sprite:'villager',team:[{id:21,lv:4},{id:26,lv:4}],reward:150,smart:.3,intro:'農家のヨシオが 勝負を しかけてきた！',winLine:'まいった！ 若いのに やるなぁ！'}});
  if(r==='win'){S.flags.yoshio=true;n.sight=0}
}
async function talkGuardian(n){
  if(S.flags.badge){await say('札は 魔物を しばる 鎖では ない。<br>心を かよわせる 約束なのだ。 忘れるなよ。',NM.guardian);return}
  if(!S.flags.guardianMet){S.flags.guardianMet=true;await say('ほう… コハルの ところの 見習いか。<br>わしは この 古札の祠を 守る イワオ。',NM.guardian);
    await say('封札師の 印が ほしいなら、わしに 札の 力を 示してみよ。',NM.guardian)}
  const i=await ask('試練を 受けるか？',NM.guardian,['受ける','まだ準備が…']);
  if(i!==0){await say('うむ。 そこの 井戸の 水を 飲めば 疲れも とれよう。',NM.guardian);return}
  const r=await runBattle({trainer:{name:'祠守りイワオ',sprite:'guardian',team:[{id:27,lv:12},{id:26,lv:13},{id:28,lv:15}],reward:800,smart:.5,intro:'祠守りイワオが 試練の 勝負を 挑んできた！',winLine:'見事…！ その 札さばき、しかと 見届けた。'},music:'boss',bg:ENC.shrine});
  if(r==='win')await endingSequence();
}
async function getItem(k,n){
  snd('item');
  if(k==='coins'){S.coins+=n;await say(`<b>${n}両</b>を 手に入れた！`);return}
  S.items[k]+=n;await say(`<b>${ITEMS[k].n}</b>を ${n}${k==='potion'?'個':'枚'} 手に入れた！`);
}

/* ---------------- examine tiles ---------------- */
function examine(c,x,y){
  const it=itemAt(x,y);
  if(it)return async()=>{S.picked[it.id]=true;await getItem(it.give,it.n)};
  const key=G.mapId+':'+x+','+y;
  if(c==='S'){if(y===50)return()=>say('『ツムギ村』<br>↑ そよ風の小道 ・ 古札の祠');return()=>say('『この先 古札の祠』<br>祠守りの 試練を 受ける者は 心して 進め。')}
  if(c==='m')return starterCase;
  if(c==='k')return()=>say(G.mapId==='home'?'本だなには『はじめての封札』が ならんでいる。<br>「札は 魔物との 約束のしるし」…と 書いてある。':'古い 巻物が ぎっしり。<br>『封札 秘伝の書 第二十三巻』… 読むのは また 今度にしよう。');
  if(c==='t')return()=>say(G.mapId==='home'?'お母さんの つくった おにぎりが 置いてある。<br>…あとで 食べよう。':'すずりと 筆。 書きかけの 封札が 乾かしてある。');
  if(c==='y')return()=>say('よく 手入れされた 観葉植物。<br>葉っぱが つやつや している。');
  if(c==='W'){if(y<12)return async()=>{await say('祠の 井戸だ。 すんだ 水が わいている。');await restFade();S.flags.healAt='shrine';await say('清らかな 水で カードたちは 元気に なった！')};
    return()=>say('つめたい 井戸水。<br>のぞきこむと 自分の 顔が うつった。')}
  if(c==='O')return()=>say(S.flags.badge?'ご神木は まだ ほのかに 光っている…。':'しめ縄の かかった ご神木。<br>耳を あてると、とくん、とくん と 音が する。');
  if(c==='A')return()=>say('古札の祠。 おさい銭箱の 奥に、古い 札が まつられている。');
  if(c==='v')return()=>say('トマトや なすが 実っている。<br>ツムギ村の 夏野菜は おいしいと 評判だ。');
  if(c==='p')return()=>say('青々とした 田んぼ。 水面に 空が うつっている。<br>小さな 泡が ぷくぷく… カッパチかも。');
  if(c==='~')return()=>say('水が きらきら 光っている。');
  if(c==='f')return()=>say('ひまわりの プランター。 お日さまの 方を 向いている。');
  if(c==='c')return()=>say('わらの 束が 積んである。 ほんのり 夏の におい。');
  if(c==='r'||c==='g'||c==='w'||c==='n')return null;
  return null;
}

/* ---------------- trainer sight + triggers ---------------- */
function checkTrainers(){
  for(const n of G.npcs){if(!n.sight||!n.vis())continue;if(n.trainer==='yoshio'&&S.flags.yoshio)continue;
    const [dx,dy]=DIRS[n.dir];for(let i=1;i<=n.sight;i++){const x=n.x+dx*i,y=n.y+dy*i;if(SOLID.has(tileAt(x,y)))break;
      if(G.p.x===x&&G.p.y===y){spotted(n,i);return true}}}
  return false;
}
async function spotted(n,dist){
  G.lock++;n.alert=true;snd('exclaim');await sleep(700);n.alert=false;
  if(!partyCards().some(c=>c.hp>0)){G.lock--;return}
  const back=n.dir;if(dist>1)await moveNPC(n,n.dir,dist-1,5);
  G.p.dir=OPP[n.dir];
  await yoshioBattle(n);
  if(dist>1&&G.mapId==='field'){await moveNPC(n,OPP[back],dist-1,5);n.dir=back}
  G.lock--;
}
function checkTriggers(){
  if(G.mapId==='shop'&&!S.flags.metSensei){S.flags.metSensei=true;G.lock++;senseiIntro().finally(()=>G.lock--);return true}
  return false;
}
async function senseiIntro(){
  await sleep(300);
  await say('おお、来たね ソーヤ。<br>待っていたよ。',NM.sensei);
  await say('今日から おまえも 見習い封札師だ。<br>最初の 相棒となる 札を さずけよう。',NM.sensei);
  await say('へへっ、おそいぞ ソーヤ！<br>おれは 先に 来て 待ってたんだぜ。',NM.rival);
  await say('レン、おまえは ソーヤが えらんだ あとだよ。<br>…さ、ケースの 前で 札を えらびなさい。',NM.sensei);
}

/* ---------------- starter selection ---------------- */
async function starterCase(){
  if(S.flags.starter){await say('ガラスケースの中で 封札が ほのかに 光っている。');return}
  if(!S.flags.metSensei)return;
  const opts=[[1,'炎タイプ','すばやく 攻める いたずらっ子'],[6,'水タイプ','打たれ強い のんびり屋'],[11,'草タイプ','バランスの いい がんばり屋']];
  while(true){
    const pick=await new Promise(res=>{const md=$('#modal');
      md.innerHTML=`<div class="rvbox"><h2 class="m-title">最初の相棒をえらぼう</h2><div class="rv-row n3">${opts.map(([id,t,d],i)=>`<button class="pick" data-nav data-i="${i}">${cardHTML({id,lv:5})}<span class="pdesc"><b>${t}</b>${d}</span></button>`).join('')}</div><p class="m-hint">カードを えらんで 決定（タップでもOK）</p></div>`;
      md.hidden=false;let nav;md.querySelectorAll('.pick').forEach(b=>b.addEventListener('click',()=>{snd('confirm');nav.close();md.hidden=true;res(+b.dataset.i)}));
      nav=navPanel(md,{onBack:()=>{nav.close();md.hidden=true;md.innerHTML='';res(-1)}});nav.set(1);});
    if(pick<0)return;
    const [id]=opts[pick];
    const ok=await ask(`${TYPES[MON[id].t].n}タイプの ${MON[id].name}に する？`,null,['この子にする','やめる']);
    $('#modal').hidden=true;$('#modal').innerHTML='';
    if(ok===0){await starterChosen(id);return}
  }
}
async function starterChosen(id){
  S.flags.starter=id;const r=addCard(id,5,'normal');
  await reveal([r],`${MON[id].name}の 札を 手に入れた！`);
  await say(`${MON[id].name}…いい 札を えらんだね。<br>その子は きっと おまえを 助けてくれる。`,NM.sensei);
  const rv=npc('rival');const rid=RIVAL_OF[id];
  await say(`じゃあ おれは こいつだ！<br>${TYPES[MON[rid].t].n}タイプの ${MON[rid].name}！`,NM.rival);
  await say('ソーヤ！ せっかく 札を もらったんだ。<br>さっそく 勝負 しようぜ！',NM.rival);
  rv.dir=G.p.x<rv.x?'left':'right';
  const res=await runBattle({trainer:{name:'レン',sprite:'rival',team:[{id:rid,lv:4}],gentle:true,smart:0,intro:'ライバルの レンが 勝負を しかけてきた！',winLine:'くっそー！ 最初の 勝負は 負けか…！',loseLine:'へへっ、おれの 勝ちだな！<br>でも いい 勝負だったぜ！'},canLose:true,bg:ENC.indoor});
  healAll();
  if(res!=='win'){const c=S.cards[0];c.exp+=30;while(c.exp>=need(c.lv)){c.exp-=need(c.lv);c.lv++}c.hp=maxHP(c)}
  await say(res==='win'?'ちぇっ… 今日は ゆずってやるよ。<br>でも 次は ぜったい 負けないからな！':'おまえの 札、けっこう やるじゃん。<br>次は もっと 強くなって こいよな！',NM.rival);
  await say('ふたりとも 見事な 勝負だった。<br>カードの 傷は わたしが 手当てしておいたよ。',NM.sensei);
  await say('ソーヤ、これを 持って いきなさい。',NM.sensei);
  S.items.white+=5;snd('item');await say('<b>白の封札</b>を 5枚 もらった！');
  S.items.potion+=2;snd('item');await say('<b>回復の香</b>を 2個 もらった！');
  await say('野生の 魔物は 弱らせてから 封札を 投げると 封じやすい。<br>村の 北、草むらの 先の 古札の祠へ 行きなさい。',NM.sensei);
  await say('祠守りの イワオに 認められたら、<br>おまえも 一人前の 封札師だ。',NM.sensei);
  await say('封札が 足りなくなったら、うちの 店で 買っていきなさい。<br>わたしに 話しかければ いつでも 売ってあげるよ。',NM.sensei);
  await say('道の わきの 草むらで 魔物と 戦えば 札は 強くなる。<br>Lv9になれば 大技も 覚えるよ。 急がず 仲間を 増やしなさい。',NM.sensei);
  await say('イワオは 手ごわいよ。 Lv15くらいまで 鍛えて、<br>できれば 札を 進化させてから 挑みなさい。',NM.sensei);
  await say('へへっ、祠には おれが 先に 着いてやる！<br>じゃあな！',NM.rival);
  await moveNPC(rv,'down',3,6);await moveNPC(rv,'left',2,6);await moveNPC(rv,'down',1,6);
  S.flags.rivalLeft=true;snd('door');
  G.npcs=buildNPCs(G.mapId);
  saveGame();
  showObjective('北の 古札の祠で、祠守りイワオの 試練を 受けよう');
}
function showObjective(t){const o=$('#objective');o.innerHTML=`<small>もくてき</small>${t}`;o.hidden=false;o.classList.remove('show');void o.offsetWidth;o.classList.add('show')}

/* ---------------- ending ---------------- */
async function endingSequence(){
  G.lock++;
  S.flags.badge=true;snd('item');
  await say('イワオから <b>封札師の印</b>を うけとった！');
  await say('これで おまえも 一人前の 封札師だ。<br>…む？ ご神木の 様子が…。',NM.guardian);
  bgm('shrine');
  // sacred tree glows, sky phenomenon
  for(let i=0;i<3;i++){G.flash=.7;G.flashCol='#fff4d0';G.shake=3;snd('charge');await sleep(500)}
  const sky=$('#skyevent');sky.innerHTML=`<div class="whale">${art(MON[30])}</div><div class="aurora"></div>`;sky.hidden=false;snd('rare');
  await sky.querySelector('.whale').animate([{transform:'translate(-10cqw,10cqh) rotate(-6deg) scale(.7)',opacity:0},{transform:'translate(35cqw,3cqh) rotate(2deg) scale(1)',opacity:.85,offset:.45},{transform:'translate(115cqw,-4cqh) rotate(-4deg) scale(.8)',opacity:0}],{duration:RM?600:4200,easing:'ease-in-out',fill:'forwards'}).finished;
  sky.hidden=true;sky.innerHTML='';
  await say('い、今のは…！？<br>空を 泳ぐ… クジラ…？',S.name);
  G.npcs=buildNPCs('field');const rv=npc('rival');rv.x=14;rv.y=11;rv.dir='up';
  await moveNPC(rv,'up',5,6);rv.dir='left';
  await say('はぁ、はぁ… 見たか ソーヤ！<br>空に でっかい 魔物が…！',NM.rival);
  await say('伝説の 魔物… オーロラクジラ。<br>ご神木が 目をさまし、古い 札の 封印が ゆるんだようだ。',NM.guardian);
  await say('この 世界には まだ 見ぬ 札が 眠っている。<br>若き 封札師たちよ… 旅立つ ときが 来たようだな。',NM.guardian);
  await say('…おもしろく なってきたじゃん！<br>ソーヤ、どっちが 先に あいつを 封印するか 競争だ！',NM.rival);
  saveGame();
  await fadeTo(1,1.2);
  showEnding();
  G.lock--;
}
function showEnding(){
  G.scene='ending';bgm('ending');
  const n=sealedCount(),h=Object.values(S.dex).filter(d=>d.holo).length,g=Object.values(S.dex).filter(d=>d.gold).length;
  const best=[...S.cards].sort((a,b)=>(b.v==='gold')-(a.v==='gold')||(b.v==='holo')-(a.v==='holo')||MON[b.id].r-MON[a.id].r||b.lv-a.lv).slice(0,3);
  const el=$('#ending');
  el.innerHTML=`<div class="end-in"><p class="eyebrow">体験版 クリア</p><h2 class="logo sm"><em>封札</em><span>モンスターズ</span></h2>
  <p class="end-lead">見習い封札師ソーヤの 旅は、ここから 始まる。</p>
  <div class="end-cards">${best.map(c=>cardHTML(c)).join('')}</div>
  <div class="end-stats"><div><small>プレイ時間</small><b>${fmtTime(S.time)}</b></div><div><small>封印した種類</small><b>${n}/${TOTAL}</b></div><div><small>キラ</small><b>${h}</b></div><div><small>ゴールド</small><b>${g}</b></div></div>
  <div class="end-next"><b>この先の 旅で 待っているもの</b><span>空を泳ぐ 伝説の魔物 オーロラクジラ</span><span>まだ見ぬ ${TOTAL-n}種類の 札と 各地の 祠守り</span><span>レンとの 本当の 決着</span></div>
  <div class="end-act"><button class="pbtn shu" data-nav data-e="cont">探索をつづける</button><button class="pbtn" data-nav data-e="title">タイトルへ</button></div>
  <p class="credit">企画・ゲームデザイン・プログラム・ドット絵・サウンド・QA ─ Claude チーム</p></div>`;
  el.hidden=false;
  let nav;el.querySelectorAll('[data-e]').forEach(b=>b.addEventListener('click',()=>{snd('confirm');nav.close();el.hidden=true;el.innerHTML='';
    if(b.dataset.e==='cont'){G.scene='world';fadeTo(0,.5);updateBGM()}else showTitle()}));
  nav=navPanel(el,{});el.scrollTop=0;
}

/* ---------------- title & intro ---------------- */
function showTitle(){
  G.scene='title';closePanel();$('#dlg').hidden=true;$('#ending').hidden=true;$('#objective').hidden=true;
  loadMap('field');G.p.hidden=true;G.cam={x:0,y:46*TS};G.fade=0;
  const cont=hasSave();
  const el=$('#title');
  const fl=[1,6,11,26,21,5];
  el.innerHTML=`<div class="tt-cards">${fl.map((id,i)=>`<div class="tt-c c${i}">${cardHTML({id,v:i===3?'holo':i===1?'gold':'normal'})}</div>`).join('')}</div>
  <div class="tt-in"><p class="eyebrow">見習い封札師の旅 ─ 体験版</p><h1 class="logo"><em>封札</em><span>モンスターズ</span></h1>
  <div class="tt-menu">${cont?'<button class="pbtn shu" data-nav data-t="cont">つづきから</button>':''}<button class="pbtn ${cont?'':'shu'}" data-nav data-t="new">はじめから</button></div>
  <p class="tt-hint">矢印キー + Z で決定 ・ スマホは画面のボタンで操作</p></div>`;
  el.hidden=false;
  bgm('title');
  let nav;const go=async t=>{nav.close();unlockAudio();snd('confirm');
    const slot=await pickSlot(t==='cont'?'load':'new');
    if(!slot){nav=navPanel(el,{});return}
    el.classList.add('out');await sleep(RM?0:450);el.hidden=true;el.classList.remove('out');G.cam=null;G.p.hidden=false;
    if(t==='cont'){loadGame(slot);startWorld()}else{SLOT=slot;clearSlot(slot);S=freshState();await intro()}};
  el.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.t)));
  nav=navPanel(el,{});
}
function startWorld(){
  Input.tap=null;Input.held=[];
  if(S.flags.starter&&!S.flags.rivalLeft){S.flags.rivalLeft=true;S.items.white+=5;S.items.potion+=2;S.map='shop';S.x=5;S.y=4;S.dir='down'}
  window.AUDIO&&AUDIO.setMuted(!!S.muted);
  loadMap(S.map);G.p.x=S.x;G.p.y=S.y;G.p.dir=S.dir;G.p.moving=false;G.p.hidden=false;G.scene='world';G.fade=0;G.lock=0;
  G.areaName=areaAt(S.map,S.y);showBanner(G.areaName);updateBGM();
  if(S.flags.starter&&!S.flags.badge)showObjective('北の 古札の祠で、祠守りイワオの 試練を 受けよう');
  else if(!S.flags.starter)showObjective('コハル先生の お店（青い屋根）へ 行こう');
}
async function intro(){
  G.scene='intro';const el=$('#intro');el.hidden=false;bgm('village');
  const lines=['この世界には、ふしぎな いきもの<br>「魔物」が すんでいる。','人は 白紙の札に 魔物を 封じ、<br>ともに 暮らしてきた。','その札を あやつる者を<br>人は「封札師」と 呼ぶ。','そして 今日──<br>ひとりの 少年が 最初の札を 手にする。'];
  for(const l of lines){el.innerHTML=`<p>${l}</p>`;const p=el.firstChild;await p.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:RM?1:700,fill:'forwards'}).finished;
    await waitKey(2600);await p.animate([{opacity:1},{opacity:0}],{duration:RM?1:400,fill:'forwards'}).finished}
  el.hidden=true;el.innerHTML='';
  S.map='home';S.x=4;S.y=3;S.dir='down';G.fade=1;startWorld();G.fade=1;G.lock++;
  await fadeTo(0,.8);
  await say('…ソーヤ！ ソーヤ〜！ 起きてる〜？',NM.mom);
  G.lock--;
}
function waitKey(ms){return new Promise(res=>{let tm;const h=k=>{if(k==='a'||k==='b'){done()}};const done=()=>{clearTimeout(tm);UI.pop(h);$('#intro').removeEventListener('click',done);res()};UI.push(h);$('#intro').addEventListener('click',done);tm=setTimeout(done,ms)})}

/* ---------------- boot ---------------- */
function boot(){
  initCanvas();fxInit();initPad();
  const last=SLOTS.find(n=>readSlot(n));if(last&&loadGame(last)){window.AUDIO&&AUDIO.setMuted(!!S.muted)}else S=freshState();
  showTitle();requestAnimationFrame(frame);
  // warm the sprite cache a few at a time so the album never hitches
  let wid=1;const warm=()=>{if(!window.PIXKIT||wid>TOTAL)return;for(let k=0;k<3&&wid<=TOTAL;k++,wid++){try{PIXKIT.render(wid)}catch(e){}}setTimeout(warm,60)};setTimeout(warm,800);
}
{let booted=false;const go=()=>{if(booted)return;booted=true;boot()};(document.fonts&&document.fonts.ready||Promise.resolve()).then(go);setTimeout(go,1500)}

/* ---------------- save slots ---------------- */
function slotSummary(n){const s=readSlot(n);if(!s)return null;
  const b=(s.flags.badge?1:0)+['b2','b3','b4'].filter(k=>s.flags[k]).length;const lead=s.cards.find(c=>c.uid===s.party[0]);
  const where=s.map==='field'?(s.y<=11?'古札の祠':s.y<=17?'ささやきの野原':s.y<=44?'そよ風の小道':'ツムギ村'):(MAPS[s.map]?MAPS[s.map].name:'');
  return{time:fmtTime(s.time||0),badges:b,dex:Object.keys(s.dex).length,where,lead:lead?MON[lead.id].name+' Lv'+lead.lv:'―',done:!!s.flags.whaleDone,lid:lead?lead.id:0}}
function pickSlot(mode){
  return new Promise(res=>{const md=$('#modal');
    const rows=SLOTS.map(n=>{const x=slotSummary(n);const dis=(mode==='load'&&!x)?'disabled':'';
      return `<button class="slotrow${n===SLOT&&mode==='save'?' cur':''}" data-nav data-n="${n}" ${dis}><span class="sn">${n}</span>${x?`<span class="sart">${x.lid?art(MON[x.lid]):''}</span><span class="sinfo"><b>${x.where}${x.done?' <i class="clr">全章クリア</i>':''}</b><small>相棒 ${x.lead}　印 ${x.badges}/4　図鑑 ${x.dex}/${TOTAL}</small><small>プレイ時間 ${x.time}</small></span>`:'<span class="sinfo"><b class="empty">空きスロット</b><small>ここから 新しい 冒険を はじめられる</small></span>'}</button>`}).join('');
    md.innerHTML=`<div class="slotbox"><h2 class="m-title">${mode==='load'?'どの 記録で あそぶ？':mode==='new'?'どこに 記録する？':'どこに レポートを 書く？'}</h2><div class="slots3">${rows}</div><button class="pbtn" data-nav data-back>もどる</button></div>`;
    md.hidden=false;let nav;
    const done=v=>{nav.close();md.hidden=true;md.innerHTML='';res(v)};
    md.querySelector('[data-back]').addEventListener('click',()=>{snd('cancel');done(0)});
    md.querySelectorAll('[data-n]').forEach(b=>b.addEventListener('click',async()=>{const n=+b.dataset.n;snd('confirm');
      if((mode==='new'||(mode==='save'&&n!==SLOT))&&readSlot(n)){md.hidden=true;nav.close();const i=await ask(`スロット${n}の 記録に 上書きするよ。 いい？`,null,['上書きする','やめる']);
        if(i!==0){md.hidden=false;nav=navPanel(md,{onBack:()=>done(0)});return}md.innerHTML='';res(n);return}
      done(n)}));
    nav=navPanel(md,{onBack:()=>done(0)});
    const cur=[...md.querySelectorAll('[data-n]')].findIndex(b=>+b.dataset.n===SLOT&&!b.disabled);if(cur>=0)nav.set(cur);
  });
}
