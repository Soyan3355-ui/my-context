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
def('ヒダルマ','fire',1,55,46,50,38,{shape:'round',eye:'sharp'},'七転び八起きの 炎の だるま。転ぶたびに 火力が 増していく。');
def('カエンジシ','fire',2,66,76,56,60,{shape:'wide',mane:true,ears:'round',tail:'flame',eye:'sharp',col:'#e98a3c',col2:'#ffe0a0'},'たてがみの炎で強さがわかる。本気になると色が白く変わる。');
def('ヤケガニ','fire',2,64,74,72,40,{shape:'wide',eye:'sharp'},'火山の 温泉に すむ カニ。甲らは 熱した 鉄のように 赤く 光る。');
def('ホムラドラ','fire',3,80,96,70,76,{shape:'tall',top:['horns'],wings:'bat',tail:'flame',eye:'sharp',wingCol:'#b8452a',col:'#e0512f'},'火山の奥で千年眠っていた竜の子。くしゃみひとつで岩がとける。');
def('シズクン','water',1,50,40,52,45,{shape:'drop',eye:'round'},'朝露から生まれる。晴れの日は少し小さくなり、雨の日はごきげん。');
def('カッパチ','water',1,48,48,46,58,{shape:'round',eye:'round'},'頭の お皿が 自慢の 水の 子。きゅうりを あげると 仲良く なれる。');
def('ナミウルフ','water',2,66,72,56,72,{shape:'wide',ears:'pointy',fins:true,tail:'fish',eye:'sharp',col:'#2f78c9'},'波の上を走る狼。満月の夜、川辺でいっせいに遠吠えする。');
def('ユキオニ','water',2,84,76,70,36,{shape:'round',eye:'sharp'},'雪山に すむ 白い 大鬼。見た目は こわいが 迷子を 麓まで 送ってくれる。');
def('ミズチ','water',3,86,86,76,70,{shape:'tall',top:['horns'],fins:true,tail:'long',mark:'scales',eye:'sharp',col:'#2a6fc0',col2:'#9fe3ff'},'古い川を守る水の竜。ミズチが住む川は、どんな日照りでも枯れない。');
def('メブキン','grass',1,50,45,52,45,{shape:'round',top:['leaf'],eye:'round',col:'#58b86a'},'頭の芽は機嫌がいいとぴょこぴょこ動く。日なたぼっこが大好き。');
def('キノコボウ','grass',1,52,42,54,40,{shape:'round',eye:'round'},'雨上がりに ひょっこり 生える キノコの 子。胞子で ねむりを さそう。');
def('コケモチ','grass',1,66,40,62,28,{shape:'wide',mark:'spots',eye:'happy',col:'#7cae5e',col2:'#d7efae'},'百年動かないこともある。背中のコケには小さな花が咲く。');
def('ハナカマキリ','grass',2,58,78,54,78,{shape:'tall',eye:'sharp'},'花に 化けて 待ちぶせる カマキリ。鎌の 一撃は 風より 速い。');
def('モリノヌシ','grass',3,96,80,92,44,{shape:'wide',top:['antlers','leaf'],eye:'happy',mark:'spots',col:'#4c8f53',col2:'#d5f0a6'},'森の一番古い木に宿る主。モリノヌシが歩いたあとには新しい芽が出る。');
def('ビリタマ','thunder',1,42,50,40,70,{shape:'round',top:['antenna'],mark:'zigzag',eye:'round',col:'#f2c21e'},'ころころ転がって静電気をためる。冬のセーターが大好物。');
def('イナビー','thunder',1,40,52,36,76,{shape:'round',top:['antenna'],wings:'bee',mark:'stripes',eye:'round',col:'#f0b51c'},'雷雲の花から蜜を集める蜂。はちみつを食べると舌がピリッとする。');
def('カミナリコゾウ','thunder',1,44,52,42,66,{shape:'round',eye:'sharp'},'雷雲から 落ちてきた いたずら 小僧。背中の 太鼓を 鳴らすと 雷が 落ちる。');
def('ライジュウマル','thunder',2,60,76,50,86,{shape:'wide',ears:'pointy',tail:'zigzag',eye:'sharp',col:'#e8b21a',col2:'#fff3b8'},'雷と一緒に落ちてくる獣。落ちた場所には金色のしっぽの跡が残る。');
def('ナルカミ','thunder',3,78,96,64,96,{shape:'tall',top:['horn'],wings:'feather',tail:'zigzag',eye:'sharp',col:'#d99a10',col2:'#fff6c0'},'雷雲の上に住む神鳴り。ナルカミが羽ばたくと、夏の夕立がやってくる。');
def('カゲボウ','dark',1,40,50,40,62,{shape:'ghost',eye:'glow',col:'#5a4a9e'},'夕方、人の影にまぎれてついてくる。振り向くとさっと隠れる。');
def('バケチョウチン','dark',1,42,50,40,60,{shape:'drop',eye:'glow'},'古い ちょうちんに 宿った おばけ。夜道を 照らしてくれる ことも ある。');
def('クロネコマタ','dark',2,60,70,52,84,{shape:'round',eye:'sharp'},'しっぽが ふたつに 分かれた 黒ネコ。百年 生きると 人の 言葉を 話す。');
def('ドクロキシ','dark',2,66,76,66,52,{shape:'tall',eye:'glow'},'古戦場を さまよう 骨の 騎士。いまも 主君の 帰りを 待っている。');
def('クロガネオロチ','dark',4,102,112,92,86,{shape:'tall',top:['horns'],wings:'bat',tail:'long',mark:'scales',eye:'glow',col:'#3e4466',col2:'#b9a6ff',wingCol:'#1f2240'},'鉄の鱗をもつ伝説の大蛇。封じられるたびに、より強くなって目覚めるという。');
def('ホシウサ','light',1,45,46,42,72,{shape:'round',ears:'long',mark:'star',eye:'round',col:'#f4c2da',col2:'#ffffff'},'流れ星と一緒に落ちてきたうさぎ。耳の先に星のかけらがついている。');
def('ヒカリホタル','light',1,40,48,38,70,{shape:'round',eye:'round'},'夏の 夜に 光る ホタルの 精。光の 強さで 気持ちが わかる。');
def('ルミナシカ','light',2,68,66,64,66,{shape:'tall',top:['antlers','halo'],eye:'round',col:'#eea2c4',col2:'#fff4fa'},'光る角をもつ鹿。ルミナシカの通った道は、しばらくきらきら光る。');
def('シロガネグリフ','light',3,86,92,80,76,{shape:'wide',eye:'sharp'},'白銀の 翼を もつ グリフォン。聖なる 山の 宝を 守っている。');
def('オーロラクジラ','light',4,112,100,96,70,{shape:'wide',top:['crown'],fins:true,tail:'fish',mark:'star',eye:'happy',col:'#8fd3e8',col2:'#f6ccff'},'空を泳ぐ伝説のクジラ。オーロラは、このクジラが通ったあとの光だと言われている。');

/* ---- 進化形（31〜60） ---- */
const EVO={};
function evo(from,name,flavor){const b=MON[from];const st=k=>Math.round(b.b[k]*1.35);const id=MON.length;
  MON.push({id,name,t:b.t,r:Math.min(4,b.r+1),b:{hp:st('hp'),atk:st('atk'),def:st('def'),spd:st('spd')},art:b.art,flavor,evoFrom:from,ult:b.r===4});
  EVO[from]={to:id,lv:[0,14,20,26,40][b.r],dup:[0,2,1,1,0][b.r]}}
evo(1,'ホムラギツネ','三本の 燃える尾を もつ 炎狐。尾が 一本 増えるたびに 百年 生きると いう。');
evo(2,'オオダルマ','両目が 入った 福の だるま。そばに いるだけで 家じゅうが ぽかぽか あたたまる。');
evo(3,'シシオウエン','炎の たてがみを もつ 獅子の王。祠の 門を 千年 守り続けてきた。');
evo(4,'カザンガニ','背中に 温泉を 背負った 大ガニ。つかると 肩こりが 一発で 治ると 評判。');
evo(5,'エンリュウオウ','溶岩の 心臓を もつ 竜の王。羽ばたき ひとつで 火山が 目を覚ます。');
evo(6,'シズクヒメ','雨の 日に 蓮の 上で 歌う 水の 姫。歌声を 聞くと 心が すっと 軽くなる。');
evo(7,'カッパオヤブン','川の 相撲大会 百連勝の 親分。きゅうりの 刀で 子分を 守る。');
evo(8,'ツナミロウ','大波を したがえる 狼の 長。遠吠え ひとつで 海が 割れると いう。');
evo(9,'ユキダイオウ','雪山の 大王。頭の 上には 小鳥たちが 巣を つくって 暮らしている。');
evo(10,'リュウジン','川と 海を 治める 水の 竜神。まわる 宝珠は 雨を 呼ぶ 力を もつ。');
evo(11,'ワカバオウジ','森の 王子を 名のる いたずらっ子。どんぐりの 杖で 木々を 育てる。');
evo(12,'オオキノコ','森の 子どもたちを 見守る キノコの おじいさん。灯りの 下で 昔話を 語る。');
evo(13,'コケヤマ','甲らの 上に 小さな 森と 祠を のせた 大ガメ。眠るたびに 森が ひと回り 育つ。');
evo(14,'オウカマキリ','桜の 鎧を まとう カマキリの 剣士。二刀の 鎌は 花びらすら 斬り分ける。');
evo(15,'ダイジュノヌシ','ご神木を 角に いただく 森の 主。枝には 森の 精霊たちが 灯りを ともす。');
evo(16,'ライデンダマ','雷の 車輪で 野山を 駆ける 甲虫。転がった あとには 小さな 虹が かかる。');
evo(17,'イナズマジョオウ','嵐を 統べる 蜂の 女王。二本の 針から 雷鳴が ほとばしる。');
evo(18,'ゴロゴロオニ','太鼓を 背負った 雷の 大鬼。夏祭りの 太鼓の 音が 大好き。');
evo(19,'ライジュウオウ','雷雲の たてがみを もつ 獣の 王。走った 大地には 稲妻の 跡が 残る。');
evo(20,'ハタタガミ','嵐を 呼ぶ 雷の 神鳥。瞳に 宿る 稲光は 百里 先まで 届く。');
evo(21,'ヤミボウズ','無数の 札に 覆われた 巨大な 影坊主。札を はがすと 何かが 目を 覚ますらしい。');
evo(22,'ヒャクメチョウチン','百の 目を もつ 化けちょうちん。夜道の 悪さを すべて 見ている。');
evo(23,'カシャ','青い 炎の 車輪を まとう 猫の 大妖怪。雷雨の 夜に 空を 駆ける。');
evo(24,'ガシャドクロ','野に 散った 骨が 集まって できた 巨大な がいこつ。ガシャガシャと 夜を 歩く。');
evo(25,'クロガネヤマタ','無数の 首を もつ 鋼の 大蛇。その 目覚めは 世界の 終わりの はじまりと いう。');
evo(26,'ツキウサギ','月から 来た うさぎ。杵で ついた お餅は 食べると 星の 味が する。');
evo(27,'ホタルヒメ','夏の 夜を 照らす ホタルの 姫。迷子の 手を 引いて 家まで 送ってくれる。');
evo(28,'セイリンジカ','水晶の 角を もつ 聖なる 鹿。歩いた あとには 花が 咲き みだれる。');
evo(29,'テンクウグリフ','黄金の 鎧を まとう 天空の グリフォン。四枚の 翼で 雲の 上を 翔ける。');
evo(30,'アマノオーロラ','天の川を 泳ぐ 極光の 大鯨。その 体の 中には 銀河が 流れている。');
const TOTAL=MON.length-1;
const BASE_TOTAL=30;

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
const SOLID=new Set('T~FRhSvpfcWrgwnIlaAOktymqxLYM'.split(''));
const MAPS={
  field:{name:'ツムギ村',rows:[
'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',//0
'TTTTTTTTTTaaaaaaaaTTTTTTTTTT',
'TTTTTTTT,.aaaaaaaa.,TTTTTTTT',
'TTTTTTT.O.AAAAAAAA...TTTTTTT',
'TTTTTT,...l.::::.l...,TTTTTT',
'TTTTT.,.....::::.....,.PPPPP',
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
'TTTT...,.....PP........cTTTT',
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
,
  valley:{name:'霧の渓谷',rows:[
'TTTTTTTTTTTTT~~~TTTTTTTTTTTTTT',
'TTTTTTTTTTTTT~~~TTTTTTTTTTTTTT',
'T.rrr......R.~~~.........""""T',
'T.rrr..,W.,..~~~....R....""""T',
'T,wdw..,.....~~~.........""""T',
'T........,...~~~.........""""T',
'PPPPPPPPPPPPPbbbPPPPPPPPP....T',
'T............~~~........P.,..T',
'T............~~~........P,...T',
'T.""""""""...~~~..""""".P....T',
'T.""""""""...~~~..""""".P....T',
'T.""""""""R..~~~..""""".P....T',
'T.""""""""...~~~..""""".P...,T',
'T.""""""""...~~~..""""",P....T',
'T.""""""""...~~~..""""".P..R.T',
'T.""""...,...~~~..""""".P....T',
'T.""""...S...~~~..""""".P....T',
'T."""".......~~~........P....T',
'T,...........~~~........P....T',
'T.....PPPPPPPbbbPPPPPPPPP.hh.T',
'Taaaa.P...,..~~~.,.....,.....T',
'TAAAA.P......~~~.............T',
'T::::lPh...,.~~~.R.......,...T',
'T:::::Ph.....~~~.......,.....T',
'TTTTTTPTTTTTT~~~TTTTTTTTTTTTTT',
'TTTTTTPTTTTTT~~~TTTTTTTTTTTTTT']},
  mount:{name:'ほむら岳',rows:[
'RRRRRRPRRRRRRRRRRRRRRRRRRRRRRR',
'RGGGGGPGGGGGGGGGGGGGGGGGGGGGGR',
'RRGGGGPGGccG"""""""""GGGGGGGGR',
'RGYYYYRGGGGG""""""R""GGGGGGGGR',
'RGYYYYPGGGGG"""""""""GGGGccGGR',
'RGYYYYPGGGGG"""""""""GGGGGGGGR',
'RGYYYYRGGGGG"""""""""GGGGGRGGR',
'RGGGGGPGGGGGGGGGGGGGGGGGGGGGGR',
'RGGGGGPGGGLLLLLLLLLLLLLLLLLLLR',
'RGGGGGPGGGLLLLLLLLLLLLLLLLLLLR',
'RGGGGGPGGGLLLLLLLLLLLLLLLLLLLR',
'RGGRGGPGGGGGGGGGRGGGGGGGGGGGGR',
'RGGGGGPPPPPPPPPPPPPPPPPGGGGGGR',
'RGGGGGGGSGGGG"""""""GGPGGGGRGR',
'RGGGGGGGGGGGG"""""""GGPGGGGGGR',
'RGGGGGGGGGGGGGGGGGGGGGPGRGGGGR',
'RLLLLLLLLLLLLLLLLLLGGGPGGGGGGR',
'RLLLLLLLLLLLLLLLLLLGGGPGaaaaaR',
'RGGGGGGGGGGGGGGGGGGGGGPGAAAAAR',
'RG""""""""GGGGGGGGGGGGPlGGGGGR',
'RG""""""""RGGGRGGGGGGGPGGGGRlR',
'RG""""""""GGGGGRGGGGGGPPPPPPPP',
'RG""""""""GGGGGGGGGGGGGGGGGRRR',
'RG""""""""GGGGGGGGGGGGGGGGGGGR',
'RGGGGGGGGGGGGGGGGGGGGGGGGGGGGR',
'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR']},
  forest:{name:'月影の森',rows:[
'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
'TDDDDD"""""DTTTTDDDDDDDDTTTTDT',
'TDWDDD"""""DTTTTDDDDMDDDTTTTDT',
'TDDDDD"""""DTTTTDDDDDDDDTTTTDT',
'DDDDDD"""""DTTTTDDDDDDDDTTTTDT',
'TDDDDDDDDDDDTTTTDDTTTTTDDDDDDT',
'TDDDTTTTTDDDDDDDDDTTTTTD"""""T',
'TDDDTTTTTDDDDDDDDDTTTTTD"""""T',
'TDDDTTTTTDDDDDDDDDTTTTTD"""""T',
'TDDDTTTTTDDDDDDD""""""DD"""""T',
'TDDDDDDDDDDDDDDD""""""DDDDDDDT',
'TTTTTTDDDDDDD"""""""DDTTTTTTDT',
'TTTTTTDDTTTTD"""""""DDTTTTTTDT',
'TTTTTTDDTTTTD"""""""DDTTTTTTDT',
'TTTTTTDDTTTTDDDDDDDDDDTTTTTTDT',
'TDDDDDDDTTTTaaaaaaDDDDDDDDDDDT',
'TDDMDDDDDDDDAAAAAADDDDDDDTTTTT',
'TDDDDDDDDSD::::::::DDDDDDTTTTT',
'TTTTTTTDDDDl::::::lDDTTTTTTTTT',
'TTTTTTTDDDD::::::::DDTTTTTTTTT',
'TTTTTTTDDDD::::::::DDTTTTDDDDT',
'TTTTTTTDDDD::::::::DDTTTTDDDDT',
'TD""""""DDDl::::::lDDTTTMDDDMT',
'TD""""""DDD::::::::DDTTTDDDDDT',
'TD""""""TTTTTDDDD"""""DDDD:DDT',
'TD""""""TTTTTDDDD"""""DDDDDDDT',
'TDDDDDDDTTTTTDDDD"""""DDMDDDMT',
'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT']}
};
/* doors: key "map:x,y" -> destination */
const WARPS={
  'field:6,58':{map:'home',x:4,y:6,dir:'up'},
  'field:20,49':{map:'shop',x:5,y:7,dir:'up'},
  'home:4,7':{map:'field',x:6,y:59,dir:'down'},'home:5,7':{map:'field',x:6,y:59,dir:'down'},
  'shop:5,8':{map:'field',x:20,y:50,dir:'down'},'shop:6,8':{map:'field',x:20,y:50,dir:'down'},
  'field:27,5':{map:'valley',x:1,y:6,dir:'right'},'valley:0,6':{map:'field',x:26,y:5,dir:'left'},
  'valley:6,25':{map:'mount',x:6,y:1,dir:'down'},'mount:6,0':{map:'valley',x:6,y:24,dir:'up'},
  'mount:29,21':{map:'forest',x:1,y:4,dir:'right'},'forest:0,4':{map:'mount',x:28,y:21,dir:'left'}
};
/* area names + encounter tables by field row */
function areaAt(map,y){
  if(map!=='field')return MAPS[map].name;
  if(y<=8&&G&&G.p&&G.p.x>=23)return '祠の東道';
  if(y<=11)return '古札の祠';
  if(y<=17)return 'ささやきの野原';
  if(y<=44)return 'そよ風の小道';
  return 'ツムギ村';
}
const ENC={
  route:{lv:[2,6],pool:[1,2,6,7,11,12,13,16,17,18,21,22,26,27],bg:['#9ed49a','#e8f6cf'],floor:'#6fae5f'},
  meadow:{lv:[8,12],pool:[3,4,8,9,14,19,23,24,28,2,7,12,17,22,27],bg:['#8f9ad8','#e6e2fb'],floor:'#6f7fb8'},
  village:{bg:['#a5dc9c','#eef7d6'],floor:'#79b566'},
  shrine:{bg:['#c7b6e8','#fff1e2'],floor:'#b0a0cf'},
  indoor:{bg:['#d9b98f','#f6e8cf'],floor:'#b28b5d'},
  valley:{lv:[12,16],pool:[6,7,8,9,16,17,21,22,10],bg:['#9fc3d8','#eaf3f5'],floor:'#6e9a86'},
  mount:{lv:[16,20],pool:[1,2,3,4,16,18,19,20,5],bg:['#d9876a','#ffe0c4'],floor:'#8a6a5a'},
  forest:{lv:[20,25],pool:[21,22,23,24,26,27,28,29,15,14,11,12],bg:['#2e2a5e','#8c86c9'],floor:'#3d4a6e'},
  legend:{bg:['#3b2d7a','#f2c8ff'],floor:'#8f7bd8'}
};
function encAt(map,y){if(ENC[map]&&ENC[map].pool)return ENC[map];if(map!=='field')return null;if(y<=17)return ENC.meadow;if(y<=44)return ENC.route;return null}
function bgAt(map,y){if(ENC[map])return ENC[map];if(map!=='field')return ENC.indoor;if(y<=11)return ENC.shrine;if(y<=17)return ENC.meadow;if(y<=44)return ENC.route;return ENC.village}
