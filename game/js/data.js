/* ハマカゼFC — characters, teams, formations */
(function () {
  'use strict';
  const HOME_KIT = { shirt: '#4fb4e8', shirtD: '#2f86c4', shirtL: '#9fdcff', collar: '#ffffff', shorts: '#ffffff', shortsD: '#c9d6e6', socks: '#2f86c4', num: true };
  const HOME_GK = { shirt: '#8fd14f', shirtD: '#5a9e2e', shirtL: '#c8f08a', collar: '#2a1a24', shorts: '#2a3a2a', shortsD: '#1a2a1a', socks: '#8fd14f' };
  const AWAY_KIT = { shirt: '#b8323a', shirtD: '#7c1e2c', shirtL: '#e86a6a', collar: '#3a3340', shorts: '#3a3340', shortsD: '#26222c', socks: '#b8323a', num: true };
  const AWAY_GK = { shirt: '#f0a030', shirtD: '#b8701e', shirtL: '#ffd080', collar: '#2a1a24', shorts: '#2a1a24', shortsD: '#1a1018', socks: '#f0a030' };

  const SKIN = { light: ['#f7c9a0', '#dca27a'], mid: ['#e8b088', '#c48860'], tan: ['#c98c62', '#9e6a44'], pale: ['#f8d8b8', '#e0b090'] };

  function look(kit, skin, hair, hairD, style, extra) {
    return Object.assign({}, kit, { skin: SKIN[skin][0], skinD: SKIN[skin][1], hair, hairD, style, extra });
  }

  // stats: spd 足の速さ, sht シュート, pas パス, def 守備/セーブ, sta スタミナ
  const HOME = [
    { id: 'gen', name: 'ゲン', full: '浜野 ゲン', pos: 'GK', age: 54, job: '漁師', stats: { spd: 34, sht: 30, pas: 40, def: 56, sta: 48 },
      trait: '網さばき', traitDesc: '低いシュートに強い。漁で鍛えた反射神経。', growth: 0.8,
      bio: '夜明け前に漁へ出て、昼からはゴールを守る。口ぐせは「網にかかったら逃がさん」。',
      look: look(HOME_GK, 'tan', '#8a8a92', '#5a5a62', 'short', 'towel') },
    { id: 'morio', name: 'モリオ', full: '森田 モリオ', pos: 'DF', age: 22, job: '豆腐屋の息子', stats: { spd: 30, sht: 28, pas: 36, def: 62, sta: 56 },
      trait: 'きぬごし', traitDesc: '当たりが柔らかく、ファウルを取られにくい。', growth: 1.0,
      bio: '身長190cm。いつも眠そうだが、足元に来たボールは絶対に離さない。',
      look: look(HOME_KIT, 'light', '#3a2a24', '#241814', 'bob') },
    { id: 'tsubame', name: 'ツバメ', full: '燕川 ツバメ', pos: 'DF', age: 19, job: '新聞配達', stats: { spd: 66, sht: 32, pas: 42, def: 46, sta: 62 },
      trait: '朝刊ダッシュ', traitDesc: '走り出しが速い。サイドを駆け上がる。', growth: 1.2,
      bio: '毎朝300軒に新聞を配る韋駄天。鼻のばんそうこうは勲章らしい。',
      look: look(HOME_KIT, 'mid', '#2a1a24', '#140c12', 'bob') },
    { id: 'kazuha', name: 'カズハ', full: '潮見 カズハ', pos: 'MF', age: 27, job: '本屋の店員', stats: { spd: 42, sht: 38, pas: 66, def: 40, sta: 48 },
      trait: '行間を読む', traitDesc: 'パスコースを見つけるのがうまい。', growth: 1.0,
      bio: '口数は少ないが、ピッチ全体を一冊の本のように読む司令塔。',
      look: look(HOME_KIT, 'pale', '#2a2440', '#18142a', 'short') },
    { id: 'ponta', name: 'ポン太', full: '丸山 ポン太', pos: 'MF', age: 24, job: 'たこ焼き修行中', stats: { spd: 38, sht: 52, pas: 46, def: 40, sta: 40 },
      trait: 'はらぺこ', traitDesc: '後半になるとスタミナが減りやすい…が、たまに覚醒する。', growth: 1.1,
      bio: 'おタキ婆の弟子。練習後のたこ焼きのために生きている。',
      look: look(HOME_KIT, 'light', '#6a4020', '#4a2a14', 'spiky') },
    { id: 'leo', name: 'レオ', full: '獅子堂 レオ', pos: 'FW', age: 21, job: '美容師見習い', stats: { spd: 56, sht: 64, pas: 34, def: 22, sta: 50 },
      trait: '目立ちたがり', traitDesc: 'チャンスの場面で燃える。パスは出したがらない。', growth: 1.0,
      bio: '自称・浜風のエース。前髪のセットに毎朝40分かける。',
      look: look(HOME_KIT, 'light', '#f0c040', '#c09020', 'pomp') },
    { id: 'haruki', name: 'ハルキ', full: '日向 ハルキ', pos: 'FW', age: 16, job: '高校一年生', stats: { spd: 60, sht: 42, pas: 40, def: 30, sta: 70 },
      trait: '伸び盛り', traitDesc: '試合で得た経験がぐんぐん身につく。', growth: 1.6,
      bio: 'サッカー部がない高校から飛び込んできた新人。とにかく走る。',
      look: look(HOME_KIT, 'mid', '#6a4020', '#4a2a14', 'spiky', 'band') },
  ];

  const AWAY = [
    { id: 'iwai', name: '岩井', pos: 'GK', stats: { spd: 38, sht: 30, pas: 40, def: 60, sta: 60 }, look: look(AWAY_GK, 'mid', '#2a1a24', '#140c12', 'short') },
    { id: 'tetsuyama', name: '鉄山', pos: 'DF', stats: { spd: 50, sht: 52, pas: 48, def: 70, sta: 72 }, look: look(AWAY_KIT, 'tan', '#2a1a24', '#140c12', 'short', 'goggles'),
      full: '鉄山 剛', trait: '鋼の壁', traitDesc: 'タックルの成功率が高い。', bio: 'ヤマオロシ鉄工団の主将。溶接の腕も一流。', age: 29, job: '溶接工' },
    { id: 'hagane', name: 'ハガネ', pos: 'DF', stats: { spd: 44, sht: 30, pas: 40, def: 58, sta: 60 }, look: look(AWAY_KIT, 'light', '#4a3020', '#2a1a14', 'bald') },
    { id: 'yukimaru', name: '雪丸', pos: 'MF', stats: { spd: 72, sht: 56, pas: 60, def: 34, sta: 56 }, look: look(AWAY_KIT, 'pale', '#e8ecf4', '#b0b8c8', 'long'),
      full: '雪丸 透', trait: '粉雪ドリブル', traitDesc: '軽やかにタックルをかわす。', bio: '製鉄所の事務員。なぜか汗をかかない。', age: 23, job: '事務員' },
    { id: 'ootsuchi', name: '大槌', pos: 'MF', stats: { spd: 40, sht: 50, pas: 50, def: 56, sta: 66 }, look: look(AWAY_KIT, 'tan', '#2a1a24', '#140c12', 'spiky') },
    { id: 'hino', name: '火野', pos: 'FW', stats: { spd: 58, sht: 60, pas: 40, def: 26, sta: 58 }, look: look(AWAY_KIT, 'light', '#c03020', '#801a10', 'spiky') },
    { id: 'ida', name: '鋳田', pos: 'FW', stats: { spd: 54, sht: 54, pas: 46, def: 30, sta: 58 }, look: look(AWAY_KIT, 'mid', '#3a2a24', '#241814', 'short') },
  ];
  HOME.forEach((p, i) => (p.look.key = 'h' + i));
  AWAY.forEach((p, i) => (p.look.key = 'a' + i));

  // normalized slots for 6 field players (x: 0 own goal → 1 opp goal)
  const FORMATIONS = {
    balance: { name: 'バランス 2-2-2', short: 'バランス', desc: '攻守のバランスがいい基本形。', slots: [[0.2, 0.3], [0.2, 0.7], [0.44, 0.34], [0.44, 0.66], [0.66, 0.3], [0.66, 0.7]] },
    defense: { name: 'カウンター 3-2-1', short: 'カウンター', desc: '守備を固めて、速攻で一刺し。', slots: [[0.18, 0.24], [0.16, 0.5], [0.18, 0.76], [0.4, 0.36], [0.4, 0.64], [0.62, 0.5]] },
    attack: { name: '全員攻撃 2-1-3', short: '全員攻撃', desc: '前線に3人。点を取られたら取り返せ。', slots: [[0.24, 0.34], [0.24, 0.66], [0.46, 0.5], [0.68, 0.2], [0.72, 0.5], [0.68, 0.8]] },
  };

  const ORDERS = [
    { id: 'attack', key: '1', label: '攻めろ！', sub: '全体を押し上げる', shout: '前に出ろぉ！', cost: 35, dur: 14 },
    { id: 'defend', key: '2', label: '守れ！', sub: '引いて固める', shout: 'しっかり守れ！', cost: 35, dur: 14 },
    { id: 'pass', key: '3', label: 'つなげ！', sub: 'パスを回す', shout: 'パスつなげー！', cost: 30, dur: 14 },
    { id: 'shoot', key: '4', label: '打て！', sub: '遠くからでも狙う', shout: 'どんどん打てぇ！', cost: 30, dur: 12 },
  ];

  window.Data = { HOME, AWAY, FORMATIONS, ORDERS, HOME_KIT, AWAY_KIT };
})();
