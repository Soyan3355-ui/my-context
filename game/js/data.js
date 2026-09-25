/* ハマカゼFC — characters, teams, formations */
(function () {
  'use strict';
  const HOME_KIT = { shirt: '#4fb4e8', shirtD: '#2f86c4', shirtL: '#9fdcff', collar: '#ffffff', shorts: '#ffffff', shortsD: '#c9d6e6', socks: '#2f86c4', num: true };
  const HOME_GK = { shirt: '#8fd14f', shirtD: '#5a9e2e', shirtL: '#c8f08a', collar: '#2a1a24', shorts: '#2a3a2a', shortsD: '#1a2a1a', socks: '#8fd14f' };
  const AWAY_KIT = { shirt: '#b8323a', shirtD: '#7c1e2c', shirtL: '#e86a6a', collar: '#3a3340', shorts: '#3a3340', shortsD: '#26222c', socks: '#b8323a', num: true };
  const AWAY_GK = { shirt: '#f0a030', shirtD: '#b8701e', shirtL: '#ffd080', collar: '#2a1a24', shorts: '#2a1a24', shortsD: '#1a1018', socks: '#f0a030' };

  const SKIN = { light: ['#f7c9a0', '#dca27a'], mid: ['#e8b088', '#c48860'], tan: ['#c98c62', '#9e6a44'], pale: ['#f8d8b8', '#e0b090'] };

  function look(kit, skin, hair, hairD, style, extra, body) {
    return Object.assign({}, kit, { skin: SKIN[skin][0], skinD: SKIN[skin][1], hair, hairD, style, extra, body });
  }

  // stats: spd 足の速さ, sht シュート, pas パス, def 守備/セーブ, sta スタミナ
  const HOME = [
    { id: 'gen', nick: '朝獲れの守護神', name: 'ゲン', full: '浜野 ゲン', pos: 'GK', age: 54, job: '漁師', stats: { spd: 34, sht: 30, pas: 40, def: 56, sta: 48 },
      trait: '網さばき', traitDesc: '低いシュートに強い。漁で鍛えた反射神経。', growth: 0.8,
      bio: '夜明け前に漁へ出て、昼からはゴールを守る。口ぐせは「網にかかったら逃がさん」。',
      look: look(HOME_GK, 'tan', '#8a8a92', '#5a5a62', 'short', 'towel') },
    { id: 'tsubame', nick: '朝刊配達の韋駄天', name: 'ツバメ', full: '燕川 ツバメ', pos: 'DF', age: 19, job: '新聞配達', stats: { spd: 66, sht: 32, pas: 42, def: 46, sta: 62 },
      trait: '朝刊ダッシュ', traitDesc: 'DFなのにサイドを駆け上がって攻撃に参加する。', growth: 1.2,
      bio: '毎朝300軒に新聞を配る韋駄天。鼻のばんそうこうは勲章らしい。',
      look: look(HOME_KIT, 'mid', '#2a1a24', '#140c12', 'bob') },
    { id: 'morio', nick: '歩く絹ごし豆腐', name: 'モリオ', full: '森田 モリオ', pos: 'DF', age: 22, job: '豆腐屋の息子', stats: { spd: 30, sht: 28, pas: 36, def: 62, sta: 56 },
      trait: 'きぬごし', traitDesc: '当たりが柔らかく、ファウルを取られにくい。', growth: 1.0,
      bio: '身長190cm。いつも眠そうだが、足元に来たボールは絶対に離さない。',
      look: look(HOME_KIT, 'light', '#3a2a24', '#241814', 'bob', null, 'big') },
    { id: 'mask', nick: '正体不明の魚屋', name: 'マスク', full: 'マスク・ド・ハマ', pos: 'DF', age: '??', job: '覆面レスラー（たぶん魚屋）', stats: { spd: 36, sht: 44, pas: 30, def: 60, sta: 62 },
      trait: '空中戦の鬼', traitDesc: 'ヘディングの競り合いにめっぽう強い。セットプレーの切り札。', growth: 0.9,
      bio: '試合の日だけ現れる謎の男。魚屋の大将と同じ声をしているが、誰も口にしない。',
      look: look(HOME_KIT, 'light', '#2a1a24', '#140c12', 'mask', null, 'big') },
    { id: 'kawataro', nick: 'カッパじゃない男', name: 'カワタロウ', full: '川田 カワタロウ', pos: 'DF', age: 31, job: '川漁協の職員', stats: { spd: 46, sht: 30, pas: 40, def: 58, sta: 60 },
      trait: 'すべりこみ', traitDesc: '離れた位置からスライディングで奪う。たまに滑りすぎる。', growth: 1.0,
      bio: 'いつもカッパの着ぐるみ姿。「カッパじゃない、川田だ」と言い張る。キュウリが好き。',
      look: Object.assign(look(HOME_KIT, 'light', '#2f6a3a', '#1f4a2a', 'kappa'), { skin: '#6cc35a', skinD: '#3f8a3e', noBlush: true }) },
    { id: 'shizuku', nick: '未来が視える巫女', name: 'シズク', full: '水無月 シズク', pos: 'MF', age: 18, job: '神社の娘', stats: { spd: 50, sht: 36, pas: 52, def: 50, sta: 50 },
      trait: '神託', traitDesc: '相手のパスコースが「視える」。パスカットが得意。', growth: 1.1,
      bio: '港の小さな神社の娘。「次、右から来ます」と言うと、本当に右から来る。',
      look: look(HOME_KIT, 'pale', '#1a1a2a', '#0a0a14', 'hime') },
    { id: 'kazuha', nick: '古本屋の司令塔', name: 'カズハ', full: '潮見 カズハ', pos: 'MF', age: 27, job: '本屋の店員', stats: { spd: 42, sht: 38, pas: 66, def: 40, sta: 48 },
      trait: '行間を読む', traitDesc: '走り込む味方へのスルーパスがうまい。', growth: 1.0,
      bio: '口数は少ないが、ピッチ全体を一冊の本のように読む司令塔。',
      look: look(HOME_KIT, 'pale', '#2a2440', '#18142a', 'short', 'glasses') },
    { id: 'mame', nick: '昭和の魔術師（82）', name: '豆じい', full: '豆蔵 じい', pos: 'MF', age: 82, job: '盆栽職人', stats: { spd: 18, sht: 40, pas: 78, def: 34, sta: 26 },
      trait: '枯れた技', traitDesc: 'ロングパスが寸分の狂いもなく届く。ただし、ほぼ歩いている。', growth: 0.6,
      bio: '昭和の実業団で「港の魔術師」と呼ばれた男。今は盆栽と昼寝が生きがい。',
      look: look(HOME_KIT, 'pale', '#f4f4f4', '#d0d0d8', 'bald', 'beard', 'small') },
    { id: 'ponta', nick: 'はらぺこ重戦車', name: 'ポン太', full: '丸山 ポン太', pos: 'MF', age: 24, job: 'たこ焼き修行中', stats: { spd: 38, sht: 52, pas: 46, def: 40, sta: 40 },
      trait: 'はらぺこ', traitDesc: '後半はスタミナが減りやすい…が、終盤に同点以下だと覚醒する。', growth: 1.1,
      bio: 'おタキ婆の弟子。練習後のたこ焼きのために生きている。',
      look: look(HOME_KIT, 'light', '#6a4020', '#4a2a14', 'spiky', null, 'big') },
    { id: 'leo', nick: '前髪40分のエース', name: 'レオ', full: '獅子堂 レオ', pos: 'FW', age: 21, job: '美容師見習い', stats: { spd: 56, sht: 64, pas: 34, def: 22, sta: 50 },
      trait: '目立ちたがり', traitDesc: 'チャンスで燃える。シュートのJUST判定が広い。パスは出したがらない。', growth: 1.0,
      bio: '自称・浜風のエース。前髪のセットに毎朝40分かける。',
      look: look(HOME_KIT, 'light', '#f0c040', '#c09020', 'pomp') },
    { id: 'haruki', nick: '走る高校一年生', name: 'ハルキ', full: '日向 ハルキ', pos: 'FW', age: 16, job: '高校一年生', stats: { spd: 60, sht: 42, pas: 40, def: 30, sta: 70 },
      trait: '伸び盛り', traitDesc: '試合で得た経験がぐんぐん身につく。', growth: 1.6,
      bio: 'サッカー部がない高校から飛び込んできた新人。とにかく走る。ゲンさんの甥っ子。',
      look: look(HOME_KIT, 'mid', '#6a4020', '#4a2a14', 'spiky', 'band', 'small') },
    // bench
    { id: 'daifuku', nick: '粉まみれの壁', name: 'ダイフク', full: '白玉 ダイフク', pos: 'GK', age: 26, job: '和菓子屋の若旦那', stats: { spd: 24, sht: 24, pas: 34, def: 62, sta: 40 },
      trait: 'ぬりかべ', traitDesc: '体が大きく、手が届く範囲が広い。飛び出しは苦手。', growth: 1.0, bench: true,
      bio: '大福のように丸くて白い。セーブするたびに粉が舞う。',
      look: Object.assign(look({ shirt: '#ffd24a', shirtD: '#d48a1e', shirtL: '#fff1a0', collar: '#2a1a24', shorts: '#2a1a24', shortsD: '#1a1018', socks: '#ffd24a' }, 'pale', '#2a1a24', '#140c12', 'bald', 'chef', 'big'), { skin: '#fbeee0', skinD: '#e0ccb8' }) },
    { id: 'hikaru', nick: '登録者312人', name: 'ヒカル', full: '星野 ヒカル', pos: 'FW', age: 23, job: '配信者', stats: { spd: 58, sht: 58, pas: 30, def: 18, sta: 44 },
      trait: '映え', traitDesc: '観客が盛り上がるほど強くなる。派手なドリブルが好き。', growth: 1.2, bench: true,
      bio: '「ハマカゼFCを世界に配信する」が口ぐせ。登録者は312人。',
      look: Object.assign(look(HOME_KIT, 'light', '#ff5aa8', '#c83a80', 'spiky', 'shades'), { streak: '#4fb4e8' }) },
    { id: 'ume', nick: '商店街の薙刀番長', name: 'ウメ', full: '梅田 ウメ', pos: 'DF', age: 55, job: '主婦（元なぎなた日本一）', stats: { spd: 40, sht: 26, pas: 42, def: 68, sta: 46 },
      trait: 'なぎなた', traitDesc: '間合いが広く、タックルが鋭い。ポン太には厳しい。', growth: 0.8, bench: true,
      bio: '商店街の肝っ玉母さん。ポン太の親戚で、つまみ食いを絶対に見逃さない。',
      look: look(HOME_KIT, 'mid', '#8a7a9a', '#6a5a7a', 'perm', 'bandana') },
  ];

  const AWAY = [
    { id: 'iwai', nick: '岩の門番', name: '岩井', pos: 'GK', stats: { spd: 38, sht: 30, pas: 40, def: 60, sta: 60 }, look: look(AWAY_GK, 'mid', '#2a1a24', '#140c12', 'short') },
    { id: 'fuigo', nick: 'ふいご係', name: 'フイゴ', pos: 'DF', stats: { spd: 50, sht: 32, pas: 42, def: 52, sta: 62 }, look: look(AWAY_KIT, 'light', '#6a4020', '#4a2a14', 'short') },
    { id: 'tetsuyama', nick: '鉄工団の溶接番長', name: '鉄山', pos: 'DF', stats: { spd: 50, sht: 52, pas: 48, def: 70, sta: 72 }, look: look(AWAY_KIT, 'tan', '#2a1a24', '#140c12', 'short', 'goggles', 'big'),
      full: '鉄山 剛', trait: '鋼の壁', traitDesc: 'タックルの成功率が高い。', bio: 'ヤマオロシ鉄工団の主将。溶接の腕も一流。', age: 29, job: '溶接工' },
    { id: 'kotaro', nick: '素顔を知らぬ鋼鉄', name: '鋼太郎', pos: 'DF', stats: { spd: 34, sht: 36, pas: 36, def: 66, sta: 70 }, look: look(AWAY_KIT, 'mid', '#2a1a24', '#140c12', 'helmet', null, 'big'),
      full: '鉄尾 鋼太郎', trait: '鋼鉄ボディ', traitDesc: '当たり負けしない。溶接マスクは絶対に外さない。', bio: '素顔を見た者はいない。工場ではロボットだと思われている。', age: '??', job: '溶接工' },
    { id: 'hagane', nick: '定時退社の壁', name: 'ハガネ', pos: 'DF', stats: { spd: 44, sht: 30, pas: 40, def: 58, sta: 60 }, look: look(AWAY_KIT, 'light', '#4a3020', '#2a1a14', 'bald') },
    { id: 'rinko', nick: '火花散る看板娘', name: '燐子', pos: 'MF', stats: { spd: 56, sht: 44, pas: 54, def: 44, sta: 58 }, look: look(AWAY_KIT, 'light', '#ff8a3a', '#c05a1a', 'ponytail') },
    { id: 'yukimaru', nick: '汗をかかない男', name: '雪丸', pos: 'MF', stats: { spd: 72, sht: 56, pas: 60, def: 34, sta: 56 }, look: look(AWAY_KIT, 'pale', '#e8ecf4', '#b0b8c8', 'long'),
      full: '雪丸 透', trait: '粉雪ドリブル', traitDesc: '軽やかにタックルをかわす。', bio: '製鉄所の事務員。なぜか汗をかかない。', age: 23, job: '事務員' },
    { id: 'ootsuchi', nick: '大槌ぶん回し', name: '大槌', pos: 'MF', stats: { spd: 40, sht: 50, pas: 50, def: 56, sta: 66 }, look: look(AWAY_KIT, 'tan', '#2a1a24', '#140c12', 'spiky', null, 'big') },
    { id: 'robata', nick: '社員食堂の番人', name: '炉端', pos: 'MF', stats: { spd: 48, sht: 46, pas: 48, def: 46, sta: 60 }, look: look(AWAY_KIT, 'mid', '#3a2a24', '#241814', 'short', 'band') },
    { id: 'hino', nick: '燃える新入社員', name: '火野', pos: 'FW', stats: { spd: 58, sht: 60, pas: 40, def: 26, sta: 58 }, look: look(AWAY_KIT, 'light', '#c03020', '#801a10', 'spiky') },
    { id: 'ida', nick: '鋳物の鉄砲玉', name: '鋳田', pos: 'FW', stats: { spd: 54, sht: 54, pas: 46, def: 30, sta: 58 }, look: look(AWAY_KIT, 'mid', '#3a2a24', '#241814', 'short') },
  ];
  HOME.forEach((p, i) => (p.look.key = 'h_' + p.id));
  AWAY.forEach((p, i) => (p.look.key = 'a_' + p.id));

  // normalized slots for 10 outfield players (x: 0 own goal → 1 opp goal), listed DF → MF → FW
  const FORMATIONS = {
    balance: { name: 'バランス 4-4-2', short: 'バランス', desc: '攻守のバランスがいい基本形。', roles: ['DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      slots: [[0.2, 0.12], [0.17, 0.37], [0.17, 0.63], [0.2, 0.88], [0.43, 0.14], [0.4, 0.38], [0.4, 0.62], [0.43, 0.86], [0.66, 0.37], [0.66, 0.63]] },
    defense: { name: 'カウンター 5-3-2', short: 'カウンター', desc: '5バックで固めて、速攻で一刺し。', roles: ['DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      slots: [[0.22, 0.1], [0.16, 0.3], [0.15, 0.5], [0.16, 0.7], [0.22, 0.9], [0.38, 0.28], [0.36, 0.5], [0.38, 0.72], [0.62, 0.38], [0.62, 0.62]] },
    attack: { name: '全員攻撃 4-3-3', short: '全員攻撃', desc: '3トップで押し込む。点を取られたら取り返せ。', roles: ['DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
      slots: [[0.22, 0.12], [0.19, 0.37], [0.19, 0.63], [0.22, 0.88], [0.42, 0.3], [0.38, 0.5], [0.42, 0.7], [0.68, 0.16], [0.72, 0.5], [0.68, 0.84]] },
  };

  // pairs that change how the team plays when both are on the pitch
  const COMBOS = [
    { id: 'bunkei', ids: ['kazuha', 'leo'], name: '文系×体育会', kind: 'good', desc: 'カズハ→レオのパスが通りやすく、レオのJUST判定がさらに広がる。' },
    { id: 'tofu', ids: ['morio', 'ponta'], name: '豆腐とたこ焼き', kind: 'good', desc: '食べ物屋コンビ。2人のスタミナが減りにくい。' },
    { id: 'shitei', ids: ['gen', 'haruki'], name: '港の師弟', kind: 'good', desc: 'ゲンがキャッチすると、すぐハルキへロングスロー。ハルキのスピード+5。' },
    { id: 'ayashii', ids: ['kawataro', 'mask'], name: 'あやしい2人組', kind: 'good', desc: '見た目で相手がひるむ。2人の守備+6。' },
    { id: 'kaze', ids: ['tsubame', 'shizuku'], name: '風と巫女', kind: 'good', desc: 'サイドで息の合ったワンツー。2人のスピード+5、パス+5。' },
    { id: 'bonsai', ids: ['mame', 'kazuha'], name: '盆栽と古書', kind: 'good', desc: '渋い2人。お互いのパス精度がさらに上がる。' },
    { id: 'kabe', ids: ['daifuku', 'morio'], name: '白い巨壁', kind: 'good', desc: 'ゴール前がふさがる。至近距離のシュートを止めやすい。' },
    { id: 'ace', ids: ['leo', 'hikaru'], name: 'エース争い', kind: 'bad', desc: 'お互いに絶対パスを出さない！ ただしシュート力+8。' },
    { id: 'okan', ids: ['ume', 'ponta'], name: 'おかんの監視', kind: 'mixed', desc: 'ポン太がサボれない。ポン太の守備+10、でもスタミナの減りが早い。' },
  ];
  // team-wide game plans: how the side presses, where its block sits and how it moves the ball
  const TACTICS = {
    counter: { name: '堅守速攻', short: '速攻', desc: '深く引いて守り、奪ったら前線へ一気にカウンター。', color: '#6cc35a' },
    press: { name: 'ハイプレス', short: 'プレス', desc: '高い位置から複数人で囲んで奪う。スタミナ消費が大きい。', color: '#e0474c' },
    long: { name: 'ロングボール', short: 'ロング', desc: '中盤を飛ばしてFWへ放り込む。こぼれ球を拾って押し込む。', color: '#f08a3a' },
    possession: { name: 'ポゼッション', short: 'つなぐ', desc: '短いパスをつないで相手を動かし、崩してから仕留める。', color: '#4fb4e8' },
  };
  const DEFAULT_LINEUP = ['gen', 'tsubame', 'morio', 'mask', 'kawataro', 'shizuku', 'kazuha', 'mame', 'ponta', 'leo', 'haruki'];

  const ORDERS = [
    { id: 'attack', key: '1', label: '攻めろ！', sub: '押し上げる', shout: '前に出ろぉ！', cost: 35, dur: 14 },
    { id: 'defend', key: '2', label: '守れ！', sub: '引いて守る', shout: 'しっかり守れ！', cost: 35, dur: 14 },
    { id: 'pass', key: '3', label: 'つなげ！', sub: 'パス重視', shout: 'パスつなげー！', cost: 30, dur: 14 },
    { id: 'shoot', key: '4', label: '打て！', sub: 'ミドル解禁', shout: 'どんどん打てぇ！', cost: 30, dur: 12 },
  ];

  window.Data = { HOME, AWAY, FORMATIONS, ORDERS, HOME_KIT, AWAY_KIT, COMBOS, DEFAULT_LINEUP, TACTICS };
})();
