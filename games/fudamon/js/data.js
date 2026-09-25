/* 封札モンスターズ — game data (monsters, moves, items, maps, NPCs) */
'use strict';
const TYPES={
  fire:{n:'炎',c:'#ea6436',c2:'#ffc15a'},
  water:{n:'水',c:'#3a88de',c2:'#a6dcff'},
  grass:{n:'草',c:'#3f9f58',c2:'#c3ea8e'},
  thunder:{n:'雷',c:'#e0ac14',c2:'#fff1a0'},
  dark:{n:'闇',c:'#6e4fcf',c2:'#cbbaff'},
  light:{n:'光',c:'#e57aaa',c2:'#fff0f6'},
  normal:{n:'無',c:'#6a6784',c2:'#eeeeee'}
};
const EFF={fire:{grass:2,water:.5,fire:.5},water:{fire:2,grass:.5,water:.5},grass:{water:2,thunder:1.5,fire:.5,grass:.5},thunder:{water:2,grass:.5,thunder:.5},dark:{light:2,dark:.5},light:{dark:2,light:.5}};
const eff=(a,d)=>(EFF[a]&&EFF[a][d])||1;
const RAR=[null,
  {n:'C',w:60,seal:1,exp:12,sell:20},
  {n:'R',w:26,seal:.75,exp:18,sell:60},
  {n:'SR',w:10,seal:.5,exp:28,sell:160},
  {n:'UR',w:3,seal:.3,exp:45,sell:500}];
const MV={
  normal:{n:'たいあたり',p:40,acc:1},
  fire:[{n:'ぽっぽ火',p:55,acc:.95},{n:'ほむら砲',p:85,acc:.85}],
  water:[{n:'しずく弾',p:55,acc:.95},{n:'おおなみ',p:85,acc:.85}],
  grass:[{n:'はっぱ手裏剣',p:55,acc:.95},{n:'森のいぶき',p:85,acc:.85}],
  thunder:[{n:'ぴりぴり',p:55,acc:.95},{n:'雷鳴一閃',p:85,acc:.85}],
  dark:[{n:'かげぬい',p:55,acc:.95},{n:'夜のとばり',p:85,acc:.85}],
  light:[{n:'きらめき',p:55,acc:.95},{n:'天の光',p:85,acc:.85}]
};
const MON=[null];
function def(name,t,r,hp,atk,dfn,spd,art,flavor){MON.push({id:MON.length,name,t,r,b:{hp,atk,def:dfn,spd},art,flavor})}
def('ヒノコロ','fire',1,45,52,40,55,{shape:'round',ears:'pointy',top:['flame'],tail:'flame',eye:'round'},'しっぽの火でおやつを焼くのが得意。寒い夜は群れで丸くなって眠る。');
def('ボッポン','fire',1,40,50,38,66,{shape:'round',top:['tuft'],wings:'feather',eye:'round',col:'#f0824a',col2:'#ffd98a'},'ポンッと火の粉を吐く小鳥。冬になると人の家の暖炉のそばに集まってくる。');
def('カエンジシ','fire',2,66,76,56,60,{shape:'wide',mane:true,ears:'round',tail:'flame',eye:'sharp',col:'#e98a3c',col2:'#ffe0a0'},'たてがみの炎で強さがわかる。本気になると色が白く変わる。');
def('ホムラドラ','fire',3,80,96,70,76,{shape:'tall',top:['horns'],wings:'bat',tail:'flame',eye:'sharp',wingCol:'#b8452a',col:'#e0512f'},'火山の奥で千年眠っていた竜の子。くしゃみひとつで岩がとける。');
def('シズクン','water',1,50,40,52,45,{shape:'drop',eye:'round'},'朝露から生まれる。晴れの日は少し小さくなり、雨の日はごきげん。');
def('アワフグ','water',1,62,42,56,34,{shape:'round',fins:true,mark:'spots',eye:'happy',col:'#5aa8e8'},'おどろくとぷくっとふくらむ。田んぼの用水路でよく昼寝している。');
def('ナミウルフ','water',2,66,72,56,72,{shape:'wide',ears:'pointy',fins:true,tail:'fish',eye:'sharp',col:'#2f78c9'},'波の上を走る狼。満月の夜、川辺でいっせいに遠吠えする。');
def('ミズチ','water',3,86,86,76,70,{shape:'tall',top:['horns'],fins:true,tail:'long',mark:'scales',eye:'sharp',col:'#2a6fc0',col2:'#9fe3ff'},'古い川を守る水の竜。ミズチが住む川は、どんな日照りでも枯れない。');
def('メブキン','grass',1,50,45,52,45,{shape:'round',top:['leaf'],eye:'round',col:'#58b86a'},'頭の芽は機嫌がいいとぴょこぴょこ動く。日なたぼっこが大好き。');
def('コケモチ','grass',1,66,40,62,28,{shape:'wide',mark:'spots',eye:'happy',col:'#7cae5e',col2:'#d7efae'},'百年動かないこともある。背中のコケには小さな花が咲く。');
def('ハナトカゲ','grass',2,62,68,60,62,{shape:'tall',top:['flower'],tail:'leaf',eye:'round',col:'#46a86a'},'咲かせる花の色で気持ちが伝わる。ピンクはうれしいとき。');
def('モリノヌシ','grass',3,96,80,92,44,{shape:'wide',top:['antlers','leaf'],eye:'happy',mark:'spots',col:'#4c8f53',col2:'#d5f0a6'},'森の一番古い木に宿る主。モリノヌシが歩いたあとには新しい芽が出る。');
def('ビリタマ','thunder',1,42,50,40,70,{shape:'round',top:['antenna'],mark:'zigzag',eye:'round',col:'#f2c21e'},'ころころ転がって静電気をためる。冬のセーターが大好物。');
def('イナビー','thunder',1,40,52,36,76,{shape:'round',top:['antenna'],wings:'bee',mark:'stripes',eye:'round',col:'#f0b51c'},'雷雲の花から蜜を集める蜂。はちみつを食べると舌がピリッとする。');
def('ライジュウマル','thunder',2,60,76,50,86,{shape:'wide',ears:'pointy',tail:'zigzag',eye:'sharp',col:'#e8b21a',col2:'#fff3b8'},'雷と一緒に落ちてくる獣。落ちた場所には金色のしっぽの跡が残る。');
def('ナルカミ','thunder',3,78,96,64,96,{shape:'tall',top:['horn'],wings:'feather',tail:'zigzag',eye:'sharp',col:'#d99a10',col2:'#fff6c0'},'雷雲の上に住む神鳴り。ナルカミが羽ばたくと、夏の夕立がやってくる。');
def('カゲボウ','dark',1,40,50,40,62,{shape:'ghost',eye:'glow',col:'#5a4a9e'},'夕方、人の影にまぎれてついてくる。振り向くとさっと隠れる。');
def('ヨルコウモ','dark',1,45,48,42,68,{shape:'round',ears:'pointy',wings:'bat',eye:'happy',col:'#6c55b8',wingCol:'#43357f'},'夜の森の見張り番。逆さまにぶら下がって眠るのが一番落ち着く。');
def('ユメクイ','dark',2,70,60,64,55,{shape:'round',ears:'long',mark:'star',eye:'happy',col:'#8f78d8',col2:'#ffd6f0'},'こわい夢だけを食べてくれる。ユメクイのいる家の子はよく眠る。');
def('ヤミノツカイ','dark',3,80,92,68,82,{shape:'tall',top:['horns'],wings:'bat',tail:'long',eye:'glow',col:'#4b3b8f',wingCol:'#2b2160',col2:'#b9a6ff'},'月のない夜にだけ現れる使者。その正体を見た者はいない。');
def('ヒカリン','light',1,48,44,48,56,{shape:'round',top:['halo'],eye:'round',col:'#f7b3d0'},'ほんのり光る綿毛の精。迷子の前に現れて、帰り道を照らしてくれる。');
def('ホシウサ','light',1,45,46,42,72,{shape:'round',ears:'long',mark:'star',eye:'round',col:'#f4c2da',col2:'#ffffff'},'流れ星と一緒に落ちてきたうさぎ。耳の先に星のかけらがついている。');
def('ルミナシカ','light',2,68,66,64,66,{shape:'tall',top:['antlers','halo'],eye:'round',col:'#eea2c4',col2:'#fff4fa'},'光る角をもつ鹿。ルミナシカの通った道は、しばらくきらきら光る。');
def('ミカガミ','light',3,82,88,80,72,{shape:'tall',top:['crown','halo'],wings:'feather',eye:'sharp',col:'#d8c6f5',col2:'#ffffff'},'鏡の中の世界から来た光の女王。うそをつく者の前には姿を見せない。');
def('オーロラクジラ','light',4,112,100,96,70,{shape:'wide',top:['crown'],fins:true,tail:'fish',mark:'star',eye:'happy',col:'#8fd3e8',col2:'#f6ccff'},'空を泳ぐ伝説のクジラ。オーロラは、このクジラが通ったあとの光だと言われている。');
def('クロガネオロチ','dark',4,102,112,92,86,{shape:'tall',top:['horns'],wings:'bat',tail:'long',mark:'scales',eye:'glow',col:'#3e4466',col2:'#b9a6ff',wingCol:'#1f2240'},'鉄の鱗をもつ伝説の大蛇。封じられるたびに、より強くなって目覚めるという。');
/* ---- 追加の28種 ---- */
def('ヒダルマ','fire',1,55,46,50,38,{shape:'round',eye:'sharp'},'七転び八起きの 炎の だるま。転ぶたびに 火力が 増していく。');
def('ホノオコマ','fire',1,44,54,40,68,{shape:'wide',eye:'round'},'たてがみが 炎の 子馬。走った あとには 焦げた ひづめの 跡が 残る。');
def('ヤケガニ','fire',2,64,74,72,40,{shape:'wide',eye:'sharp'},'火山の 温泉に すむ カニ。甲らは 熱した 鉄のように 赤く 光る。');
def('エンオウ','fire',3,92,98,74,58,{shape:'tall',eye:'sharp'},'炎の 金棒を ふるう 鬼の王。怒ると 山ひとつ 燃やすと いう。');
def('カッパチ','water',1,48,48,46,58,{shape:'round',eye:'round'},'頭の お皿が 自慢の 水の 子。きゅうりを あげると 仲良く なれる。');
def('クラゲヒメ','water',1,46,44,44,56,{shape:'drop',eye:'round'},'夜の 海を ただよう クラゲ。触手に ふれると ぴりっと しびれる。');
def('シオガメ','water',2,78,62,82,34,{shape:'wide',eye:'sharp'},'潮の 流れを 読む 大ガメ。こうらには 古い 航海図が 刻まれている。');
def('シンカイリュウ','water',3,88,94,72,64,{shape:'tall',eye:'glow'},'深海の 闇に 住む 竜。頭の ちょうちんで 獲物を おびき寄せる。');
def('キノコボウ','grass',1,52,42,54,40,{shape:'round',eye:'round'},'雨上がりに ひょっこり 生える キノコの 子。胞子で ねむりを さそう。');
def('タケノコマル','grass',1,46,52,48,62,{shape:'tall',eye:'sharp'},'竹やぶで 修行する 忍びの タケノコ。一晩で 背が 倍に なる。');
def('ハナカマキリ','grass',2,58,78,54,78,{shape:'tall',eye:'sharp'},'花に 化けて 待ちぶせる カマキリ。鎌の 一撃は 風より 速い。');
def('キノカミ','grass',3,104,86,98,30,{shape:'wide',eye:'glow'},'千年 生きた 大木に 宿った 巨人。一歩 歩くと 森が 目を覚ます。');
def('カミナリコゾウ','thunder',1,44,52,42,66,{shape:'round',eye:'sharp'},'雷雲から 落ちてきた いたずら 小僧。背中の 太鼓を 鳴らすと 雷が 落ちる。');
def('ビリウナ','thunder',1,50,50,40,62,{shape:'tall',eye:'round'},'田んぼの 水路に すむ ウナギ。雷の 日は 体じゅうが 光りだす。');
def('ライメイトラ','thunder',2,64,80,54,82,{shape:'wide',eye:'sharp'},'稲妻の しまもようを もつ トラ。ほえ声は 遠雷のように 響く。');
def('フウジンライ','thunder',3,84,98,66,90,{shape:'tall',eye:'sharp'},'風の 袋と 雷の 太鼓を もつ 鬼神。嵐の 夜に 空を 駆ける。');
def('バケチョウチン','dark',1,42,50,40,60,{shape:'drop',eye:'glow'},'古い ちょうちんに 宿った おばけ。夜道を 照らしてくれる ことも ある。');
def('クロネコマタ','dark',1,46,54,40,72,{shape:'round',eye:'sharp'},'しっぽが ふたつに 分かれた 黒ネコ。百年 生きると 人の 言葉を 話す。');
def('ドクロキシ','dark',2,66,76,66,52,{shape:'tall',eye:'glow'},'古戦場を さまよう 骨の 騎士。いまも 主君の 帰りを 待っている。');
def('ヨミガラス','dark',3,80,94,64,88,{shape:'round',eye:'glow'},'黄泉と この世を 行き来する 三本足の カラス。魂の 道しるべ。');
def('ハネウサギ','light',1,44,44,42,74,{shape:'round',eye:'round'},'白い 羽で 空を 跳ねる ウサギ。満月の 夜は 月まで 跳んでいく。');
def('ヒカリホタル','light',1,40,48,38,70,{shape:'round',eye:'round'},'夏の 夜に 光る ホタルの 精。光の 強さで 気持ちが わかる。');
def('ハクバ','light',2,66,70,60,80,{shape:'wide',eye:'sharp'},'雲の 上を 駆ける 白い 天馬。翼の ひと振りで 虹が かかる。');
def('シロガネグリフ','light',3,86,92,80,76,{shape:'wide',eye:'sharp'},'白銀の 翼を もつ グリフォン。聖なる 山の 宝を 守っている。');
def('ツチノコ','grass',2,60,64,62,58,{shape:'wide',eye:'round'},'幻と 呼ばれる 太った ヘビ。見つけた 者には 幸運が 訪れると いう。');
def('ユキオニ','water',2,84,76,70,36,{shape:'round',eye:'sharp'},'雪山に すむ 白い 大鬼。見た目は こわいが 迷子を 麓まで 送ってくれる。');
def('ヒノトリ','fire',4,104,108,88,92,{shape:'tall',eye:'sharp'},'太陽から 生まれた 不死の 鳥。燃えつきても 灰の 中から よみがえる。');
def('ヤミヨノオオカミ','dark',4,106,110,86,96,{shape:'wide',eye:'glow'},'月の ない 夜を 統べる 伝説の 狼。遠吠えは 星を 震わせる。');
const TOTAL=MON.length-1;

const ITEMS={
  white:{n:'白の封札',d:'ふつうの封札。よく弱らせてから投げよう。',price:40,mul:.55,holo:.10,gold:.02,fc:'#f3ecdc'},
  silver:{n:'銀の封札',d:'封印しやすい上質な札。キラ率も少しアップ。',price:120,mul:.9,holo:.14,gold:.03,fc:'#c9d2e3'},
  gold:{n:'金の封札',d:'とても封印しやすい。キラ・ゴールドが出やすい。',price:350,mul:1.4,holo:.25,gold:.08,fc:'#f0c75a'},
  potion:{n:'回復の香',d:'カード1枚のHPを半分回復する。',price:60}
};
const PACK_PRICE=300;

/* ---------- maps ----------
 Solid: T ~ F R h S v p f c W r g w n I l a A O k t y m q x
 Walk : . , " P b : s o u z J   Warp: d (doors), z (exit mats)
*/
const SOLID=new Set('T~FRhSvpfcWrgwnIlaAOktymqx'.split(''));
const MAPS={
  field:{name:'ツムギ村',rows:[
'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',//0
'TTTTTTTTTTaaaaaaaaTTTTTTTTTT',
'TTTTTTTT,.aaaaaaaa.,TTTTTTTT',
'TTTTTTT.O.AAAAAAAA...TTTTTTT',
'TTTTTT,...l.::::.l...,TTTTTT',
'TTTTT.,.....::::.....,.TTTTT',
'TTTTT..W....::::.......TTTTT',
'TTTTTl.....JJJJJJ.....lTTTTT',
'TTTTT......I::::I......TTTTT',
'TTTTTT......::::......TTTTTT',
'TTTTTTTTRR..ssss..RRTTTTTTTT',//10
'TTTTTTTTT...ssss...TTTTTTTTT',
'TTTTTT"".....PP.....""TTTTTT',
'TTTTT"""",...PP...,""""TTTTT',
'TTTTT""""""..PP..""""""TTTTT',
'TTTTT"""""...PP...""R""TTTTT',
'TTTTTT.,.....PP....,..TTTTTT',
'TTTTTTTT.....PP.....TTTTTTTT',
'TTTTTTTT.....PP.....TTTTTTTT',
'TTTTTTTh.....PP.....hTTTTTTT',
'TTTTT,.....S.PP........TTTTT',//20
'TTTT""""""...PP...""""""TTTT',
'TTTT""""""...PP...""""""TTTT',
'TTTT""""",...PP...,"""""TTTT',
'TTTT...,.....PP.......cTTTT',
'TTT~~~~~~~~~~bb~~~~~~~~~~TTT',
'TT~~~~~~~~~~~bb~~~~~~~~~~~TT',
'TTT..~~~~~~~~bb~~~~~~~...TTT',
'TTT,R........PP..........TTT',
'TTTpppppp....PP."""""""".TTT',
'TTTpppppp....PP""""""""""TTT',//30
'TTTpppppp.,..PP""""""""""TTT',
'TTTvvvvv.....PP"""""R""""TTT',
'TTTvvvvv..,..PP."""""""".TTT',
'TTT..........PP..........TTT',
'TTTh.........PP.........hTTT',
'TTT""""".....PP..........TTT',
'TTT""""""....PP..,.......TTT',
'TTT"""""".,..PP....""""""TTT',
'TTT."""".....PP....""""""TTT',
'TTT..........PP.,..""""""TTT',//40
'TTTTT....,...PP........TTTTT',
'TTTTTTT......PP......TTTTTTT',
'TTTTTTT.,....PP....,.TTTTTTT',
'TTTTTTTh.....PP.....hTTTTTTT',
'TTTTTTTTFFFFFPPFFFFFTTTTTTTT',
'TT.,.........PP...........TT',
'TT.rrrrr.....PP..ggggggg..TT',
'TT.rrrrr..,..PP..ggggggg.hTT',
'TT.wndnw.....PP..wnwdwnw..TT',
'TT.f.P.f....SPP.....P.....TT',//50
'TT...PPPPPPPPPPPPPPPP.....TT',
'TT....,......PP..,......W.TT',
'TTvvvv.......PP...........TT',
'TTvvvv...,...PP.....~~~~..TT',
'TT...........PP....~~~~~..TT',
'TT..rrrrr....PP....~~~~...TT',
'TT..rrrrr....PP...,.......TT',
'TT..wndnw....PP...........TT',
'TT..f.P.f....PP....c......TT',
'TT....PPPPPPPPP..,........TT',//60
'TT...........PP.......,...TT',
'TT..,........PP...........TT',
'TThhhhhhh....PP....hhhhhhhTT',
'TT...........PP...........TT',
'TTTTTTTTTTTTTTTTTTTTTTTTTTTT'
  ]},
  home:{name:'ソーヤの家',rows:[
'qqqqqqqqqq',
'qqqqqqqqqq',
'kkooooooyo',
'oooouuoooo',
'ooootuoooo',
'oooouuoooo',
'yooooooooy',
'xxxxzzxxxx']},
  shop:{name:'コハル封札堂',rows:[
'qqqqqqqqqqqq',
'qqqqqqqqqqqq',
'kkyommmmoykk',
'oooooooooooo',
'oouuuuuuuuoo',
'ootuuuuuutoo',
'oouuuuuuuuoo',
'yooooooooooy',
'xxxxxzzxxxxx']}
};
/* doors: key "map:x,y" -> destination */
const WARPS={
  'field:6,58':{map:'home',x:4,y:6,dir:'up'},
  'field:20,49':{map:'shop',x:5,y:7,dir:'up'},
  'home:4,7':{map:'field',x:6,y:59,dir:'down'},'home:5,7':{map:'field',x:6,y:59,dir:'down'},
  'shop:5,8':{map:'field',x:20,y:50,dir:'down'},'shop:6,8':{map:'field',x:20,y:50,dir:'down'}
};
/* area names + encounter tables by field row */
function areaAt(map,y){
  if(map!=='field')return MAPS[map].name;
  if(y<=11)return '古札の祠';
  if(y<=17)return 'ささやきの野原';
  if(y<=44)return 'そよ風の小道';
  return 'ツムギ村';
}
const ENC={
  route:{lv:[3,6],pool:[1,2,5,6,9,10,13,14,17,21,22,27,31,35,39,40,43,47,48],bg:['#9ed49a','#e8f6cf'],floor:'#6fae5f'},
  meadow:{lv:[6,9],pool:[3,7,11,15,18,19,23,17,21,22,10,28,32,36,44,29,33,37,41,45,49,51],bg:['#8f9ad8','#e6e2fb'],floor:'#6f7fb8'},
  village:{bg:['#a5dc9c','#eef7d6'],floor:'#79b566'},
  shrine:{bg:['#c7b6e8','#fff1e2'],floor:'#b0a0cf'},
  indoor:{bg:['#d9b98f','#f6e8cf'],floor:'#b28b5d'}
};
function encAt(map,y){if(map!=='field')return null;if(y<=17)return ENC.meadow;if(y<=44)return ENC.route;return null}
function bgAt(map,y){if(map!=='field')return ENC.indoor;if(y<=11)return ENC.shrine;if(y<=17)return ENC.meadow;if(y<=44)return ENC.route;return ENC.village}
