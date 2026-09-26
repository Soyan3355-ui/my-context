/* ハマカゼFC — district league: clubs, fixtures, table, results for the other grounds */
(function () {
  'use strict';
  const SKIN = { light: ['#f7c9a0', '#dca27a'], mid: ['#e8b088', '#c48860'], tan: ['#c98c62', '#9e6a44'], pale: ['#f8d8b8', '#e0b090'] };
  function kit(main, dark, light, trim, shorts) {
    return { shirt: main, shirtD: dark, shirtL: light, collar: trim, shorts: shorts || trim, shortsD: shorts ? shorts : trim, socks: main, num: true };
  }
  const GK_KITS = [{ shirt: '#f0a030', shirtD: '#b8701e', shirtL: '#ffd080', collar: '#2a1a24', shorts: '#2a1a24', shortsD: '#1a1018', socks: '#f0a030' },
    { shirt: '#6a6ad8', shirtD: '#4a4aa8', shirtL: '#a8a8ff', collar: '#2a1a24', shorts: '#2a1a24', shortsD: '#1a1018', socks: '#6a6ad8' }];
  let seed = 11;
  const R = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const pickR = (a) => a[Math.floor(R() * a.length)];
  const HAIRS = [['#2a1a24', '#140c12'], ['#4a3020', '#2a1a14'], ['#6a4020', '#4a2a14'], ['#c0a060', '#907040'], ['#8a8a92', '#5a5a62'], ['#1a1a2a', '#0a0a14']];
  const STYLES = ['short', 'short', 'spiky', 'bob', 'bald', 'ponytail', 'pomp', 'long', 'perm'];

  // generic squad around a strength rating; the captain is a named character
  function squad(club, names, rating, tacU, captain) {
    const pos = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'];
    return pos.map((ps, i) => {
      const v = () => Math.round(rating + (R() - 0.5) * 18);
      const st = { spd: v(), sht: v(), pas: v(), def: v(), sta: v() };
      if (ps === 'GK') { st.def += 6; st.sht -= 12; }
      if (ps === 'DF') { st.def += 6; st.sht -= 8; }
      if (ps === 'FW') { st.sht += 8; st.def -= 12; }
      for (const k in st) st[k] = Math.max(18, Math.min(88, st[k]));
      const hair = pickR(HAIRS), sk = SKIN[pickR(Object.keys(SKIN))];
      const body = R() < 0.18 ? 'big' : R() < 0.1 ? 'small' : undefined;
      const look = Object.assign({}, ps === 'GK' ? pickR(GK_KITS) : club.kit, { skin: sk[0], skinD: sk[1], hair: hair[0], hairD: hair[1], style: pickR(STYLES), body, key: club.id + '_' + i });
      const d = { id: club.id + '_' + i, name: names[i], pos: ps, stats: st, look, tacU: Object.assign({}, tacU) };
      if (captain && captain.slot === i) Object.assign(d, captain.def, { look: Object.assign(look, captain.look || {}), stats: Object.assign(st, captain.stats || {}) });
      return d;
    });
  }

  const CLUBS = []; const CLUBS2 = [];
  function club(c) { CLUBS.push(c); c.tier = 'district'; return c; }
  function club2(c) { CLUBS2.push(c); c.tier = 'prefecture'; return c; }

  club({ id: 'yamaoroshi', boost: 5, name: 'ヤマオロシ鉄工団', short: 'ヤマオロシ', en: 'YAMAOROSHI', color: '#b8323a', dark: '#7c1e2c', light: '#e86a6a', ink: '#4a1018',
    tactic: 'long', planB: 'press', coach: '鬼瓦監督', coachLook: 'onigawara', captain: 'tetsuyama', rating: 52, ground: '山颪スタジアム',
    blurb: '去年2位の強豪。前線の大きい選手へ放り込み、こぼれ球を拾って押し込む。', shouts: ['押し込めぇ！', '鉄の意地を見せろ！', '踏ん張れぇ！'],
    roster: () => Data.AWAY });
  club({ id: 'shiomi', boost: 4, name: '潮見商店街FC', short: '商店街FC', en: 'SHIOMI', color: '#e8b83a', dark: '#b08420', light: '#ffe08a', ink: '#27305a',
    tactic: 'possession', planB: 'long', coach: '会長', captain: 'kaoru', rating: 50, ground: '潮見アーケード裏グラウンド',
    blurb: '商店街の店主たち。ボールを大事につなぐ、渋いパスワークが持ち味。', shouts: ['いらっしゃい、いらっしゃい！', 'つないで崩しなさい！', '商売は信用第一！'] });
  club({ id: 'chikurin', boost: 3, name: '竹林大学OB', short: '竹林OB', en: 'CHIKURIN', color: '#5aa84a', dark: '#3a7a30', light: '#a8e08a', ink: '#1a3a14',
    tactic: 'press', planB: 'press', coach: '竹中監督', captain: 'tatsumi', rating: 48, ground: '竹林大学グラウンド',
    blurb: '体育会の卒業生たち。90分走り続ける前線からのハイプレス。', shouts: ['走れ走れぇ！', '竹のようにしなれ！', '前から行けぇ！'] });
  club({ id: 'yukemuri', boost: 3, name: '湯けむり旅館組合', short: '旅館組合', en: 'YUKEMURI', color: '#8a3a6a', dark: '#5e2448', light: '#c87aa8', ink: '#2a0e20',
    tactic: 'counter', planB: 'possession', coach: '大女将', captain: 'oyuki', rating: 46, ground: '湯けむり温泉グラウンド',
    blurb: '温泉街の旅館の人たち。しっかり引いて守り、若女将の一撃で仕留める。', shouts: ['おもてなしの守備を！', '慌てず、じっくりと。', '湯冷めしますよ！'] });
  club({ id: 'minori', boost: 4, name: '実り農協', short: '農協', en: 'MINORI', color: '#c8702a', dark: '#8a4a18', light: '#f0a868', ink: '#3a1a08',
    tactic: 'long', planB: 'counter', coach: '組合長', captain: 'gonzo', rating: 47, ground: 'あぜ道グラウンド',
    blurb: '畑仕事で鍛えた大男ぞろい。空中戦とセカンドボールにめっぽう強い。', shouts: ['耕せぇ！', '米俵を運ぶ気持ちで！', '豊作じゃあ！'] });

  const NAMES = {
    shiomi: ['乾物屋の鳥居', '八百屋の竹', '魚屋の源', '酒屋の辰', '本田（文具）', 'カオル', '仕立屋の針生', '喫茶の珈', '床屋の剃', '花屋の桜井', '電器屋の光'],
    chikurin: ['大竹', '笹川', '節田', '若竹', '根岸', '竹内', 'タツミ', '篠田', '筍井', '竹下', '青竹'],
    yukemuri: ['番頭の湯本', '板前の包丁', '仲居の梅', '下足番の草履', '湯守の熱海', '若旦那の宿', '女中の菊', '庭師の松', 'オユキ', '送迎の車', '料理長の鍋島'],
    minori: ['案山子', 'ゴンゾウ', '田畑', '稲本', '大根', '牛島', '畔上', '籾井', '麦田', '芋川', '苗代'],
  };
  const CAPTAINS = {
    shiomi: { slot: 5, def: { id: 'kaoru', nick: 'アーケードの司令塔', full: '潮見 カオル', trait: '商人の目', traitDesc: 'パスの精度が高い。', age: 35, job: '洋品店店主', bio: '商店街の若手のまとめ役。値札とパスコースは一瞬で読む。' }, stats: { pas: 72, spd: 50, sht: 50, def: 48, sta: 58 }, look: { style: 'pomp', hair: '#2a1a24', hairD: '#140c12' } },
    chikurin: { slot: 6, def: { id: 'tatsumi', nick: '竹やり特攻隊長', full: '竹宮 タツミ', trait: '無尽蔵', traitDesc: 'スタミナが尽きない。', age: 22, job: '大学院生', bio: '竹林大学OBチームの主将。試合中ずっと叫んでいる。' }, stats: { sta: 80, spd: 64, def: 58, pas: 44, sht: 48 }, look: { style: 'spiky', hair: '#2a1a24', hairD: '#140c12', extra: 'band' } },
    yukemuri: { slot: 8, def: { id: 'oyuki', nick: '若女将ストライカー', full: '白湯 オユキ', trait: 'おもてなしの一撃', traitDesc: 'カウンターの決定力が高い。', age: 28, job: '旅館の若女将', bio: '老舗旅館の若女将。普段は穏やかだが、ゴール前では容赦がない。' }, stats: { sht: 72, spd: 62, pas: 52, def: 30, sta: 54 }, look: { style: 'ponytail', hair: '#1a1a2a', hairD: '#0a0a14' } },
    minori: { slot: 1, def: { id: 'gonzo', nick: '歩く米俵', full: '田吾作 ゴンゾウ', trait: '米俵', traitDesc: '空中戦で絶対に負けない。', age: 45, job: '米農家', bio: '村いちばんの力持ち。米俵を両肩に担いで走れる。' }, stats: { def: 72, sht: 50, spd: 34, pas: 38, sta: 66 }, look: { style: 'bald', body: 'big' } },
  };
  for (const c of CLUBS) {
    c.kit = kit(c.color, c.dark, c.light, c.ink, c.ink);
    if (!c.roster) {
      const tacU = { counter: 45, press: 45, long: 45, possession: 45 }; tacU[c.tactic] = 78;
      const sq = squad(c, NAMES[c.id], c.rating, tacU, CAPTAINS[c.id]);
      c.roster = () => sq;
    }
  }

  // ---------------- prefecture league: what awaits after promotion ----------------
  club2({ id: 'kaiyou', boost: 6, name: '海陽学園FC', short: '海陽学園', en: 'KAIYOU', color: '#2f86c4', dark: '#1c5a8e', light: '#9fdcff', ink: '#0e2a44',
    tactic: 'possession', planB: 'press', coach: '白石監督', captain: 'reon', rating: 58, ground: '海陽学園グラウンド',
    blurb: 'サッカー強豪校のOBチーム。基礎からのパスワークで格上を苦しめてきた古豪。', shouts: ['丁寧に、崩せ！', '海陽の誇りを見せろ！', '慌てるな、繋げ！'] });
  club2({ id: 'tekkyo', boost: 6, name: '鉄橋重工業FC', short: '鉄橋重工', en: 'TEKKYO', color: '#5a5a68', dark: '#33333c', light: '#f0a030', ink: '#1a1a20',
    tactic: 'press', planB: 'long', coach: '現場監督', captain: 'daigo', rating: 59, ground: '鉄橋グラウンド',
    blurb: '大手工場の実業団チーム。就業後も休まず走り込む、県内屈指のプレス集団。', shouts: ['稼働率を上げろ！', '止めるな、圧をかけろ！', '定時までに決めるぞ！'] });
  club2({ id: 'shirasagi', boost: 8, name: '白鷺実業団', short: '白鷺', en: 'SHIRASAGI', color: '#eef0f4', dark: '#b8c0cc', light: '#ffffff', ink: '#1c2a44',
    tactic: 'counter', planB: 'possession', coach: '鷺沼監督', captain: 'shirou', rating: 63, ground: '白鷺スタジアム', gatekeeper: true,
    blurb: '県リーグを長年支配してきた名門。無駄のない堅守速攻で、格下を寄せ付けない。', shouts: ['乱れるな、白鷺は静かに勝つ。', '一撃で仕留めろ。', '格の違いを見せてやれ。'] });
  club2({ id: 'kurogane', boost: 5, name: '黒鉄機関区FC', short: '黒鉄', en: 'KUROGANE', color: '#2a2a30', dark: '#161618', light: '#e8c020', ink: '#0a0a0c',
    tactic: 'long', planB: 'counter', coach: '区長', captain: 'kurou', rating: 55, ground: '機関区グラウンド',
    blurb: '鉄道の保線区チーム。線路のように長く速いボールで、一気に前線まで運ぶ。', shouts: ['レールを敷け！', '一直線に行くぞ！', '脱線するな！'] });
  club2({ id: 'minatomirai', boost: 6, name: 'みなと未来FC', short: 'みなと未来', en: 'MINATOMIRAI', color: '#d8367a', dark: '#a01c58', light: '#ff8ab8', ink: '#3a0e28',
    tactic: 'press', planB: 'possession', coach: 'GM', captain: 'kai', rating: 57, ground: 'みなと未来アリーナ',
    blurb: '元プロ選手も在籍する新興クラブ。派手な個人技と前線からの守備が武器。', shouts: ['魅せてやれ！', '取りに行くぞ！', 'ここが勝負どころだ！'] });
  const NAMES2 = {
    kaiyou: ['経理部の鷺沼', '広報の一ノ瀬', '海江田', '波多', '沖見', 'レオン', '汀', '磯谷', '渚本', '湊', '灯台'],
    tekkyo: ['溶接工の錆山', '検査係の炉端', '資材の火尻', '大悟', '現場の重田', '鋲打ちの鉄矢', '塗装の彩', '搬入の力', '試運転の速水', '整備の直', '安全帯の護'],
    shirasagi: ['士郎', '経営企画の鷺坂', '営業一課の白井', '総務の鶴見', '広報の羽鳥', '秘書室の翔', '監査の静', '法務の礼', '渉外の澄', '人事の潔', '新人の翼'],
    kurogane: ['保線の黒崎', '信号の鉄郎', '車掌の鋼', '駅長代理の轍', '踏切の重', '車両の錆', '運転士の疾風', '整備の轟', '連結の剛', '検修の陰', 'クロウ'],
    minatomirai: ['元プロの界', '広報大使の煌', 'スカウトの燦', '新加入の閃', '契約選手の耀', '育成の煌翔', 'マーケの汐里', 'サポーターの陽', '移籍組の蓮', '若手の颯', 'カイ'],
  };
  const CAPTAINS2 = {
    kaiyou: { slot: 5, def: { id: 'reon', nick: '海陽の頭脳', full: '海江田 レオン', trait: '展開力', traitDesc: 'サイドチェンジの精度が高い。', age: 24, job: '学習塾講師', bio: '海陽学園OBの司令塔。試合の展開を俯瞰で読む。' }, stats: { pas: 78, spd: 54, sht: 52, def: 46, sta: 56 }, look: { style: 'perm', hair: '#2a1a24', hairD: '#140c12' } },
    tekkyo: { slot: 9, def: { id: 'daigo', nick: '鉄橋のクレーン', full: '重田 ダイゴ', trait: '規格外の一撃', traitDesc: 'シュートの威力が桁違い。', age: 29, job: '重機オペレーター', bio: '工場のエース。溶接と同じ集中力でゴールを狙う。' }, stats: { sht: 78, spd: 52, pas: 44, def: 34, sta: 60 }, look: { style: 'bald', body: 'big' } },
    shirasagi: { slot: 6, def: { id: 'shirou', nick: '無敗の白', full: '鷺坂 シロウ', trait: '完璧主義', traitDesc: 'あらゆる能力が高水準でまとまっている。', age: 27, job: '実業団専属選手', bio: '県リーグ屈指の万能型キャプテン。弱点がほとんどない。' }, stats: { pas: 68, spd: 64, sht: 62, def: 60, sta: 66 }, look: { style: 'pomp', hair: '#e8e8ee', hairD: '#c0c0ca' } },
    kurogane: { slot: 1, def: { id: 'kurou', nick: '始発から終電まで', full: '黒崎 クロウ', trait: '不屈の脚', traitDesc: 'スタミナと粘り強さで最後まで走り切る。', age: 34, job: '保線区員', bio: '線路を守り続けてきた男。守備の要にして精神的支柱。' }, stats: { def: 74, spd: 46, sta: 78, pas: 40, sht: 36 }, look: { style: 'short', hair: '#1a1a1a', hairD: '#0a0a0a', extra: 'band' } },
    minatomirai: { slot: 10, def: { id: 'kai', nick: '元プロの意地', full: '汐見 カイ', trait: '一瞬の輝き', traitDesc: '一対一の突破力が抜群。', age: 26, job: 'クラブ専属', bio: 'かつて上のリーグにいた男。今はこの街で輝き直そうとしている。' }, stats: { spd: 72, sht: 70, pas: 50, def: 24, sta: 52 }, look: { style: 'spiky', hair: '#c0a060', hairD: '#907040' } },
  };
  for (const c of CLUBS2) {
    c.kit = kit(c.color, c.dark, c.light, c.ink, c.ink);
    if (!c.roster) {
      const tacU = { counter: 45, press: 45, long: 45, possession: 45 }; tacU[c.tactic] = 80;
      const sq = squad(c, NAMES2[c.id], c.rating, tacU, CAPTAINS2[c.id]);
      c.roster = () => sq;
    }
  }
  const gatekeeper = () => CLUBS2.find((c) => c.gatekeeper) || CLUBS2[0];

  // single round robin: 5 rounds for 6 teams (circle method), Hamakaze meets Yamaoroshi in round 1
  const TEAMS = ['hamakaze', 'shiomi', 'chikurin', 'yukemuri', 'minori', 'yamaoroshi'];
  const TEAMS2 = ['hamakaze', 'kaiyou', 'tekkyo', 'kurogane', 'minatomirai', 'shirasagi'];
  const teamsForTier = (tier) => (tier === 'prefecture' ? TEAMS2 : TEAMS);
  const clubsForTier = (tier) => (tier === 'prefecture' ? CLUBS2 : CLUBS);
  function fixtures(teamList) {
    const t = (teamList || TEAMS).slice(), rounds = [];
    for (let r = 0; r < t.length - 1; r++) {
      const pairs = [];
      for (let i = 0; i < t.length / 2; i++) pairs.push(r % 2 ? [t[t.length - 1 - i], t[i]] : [t[i], t[t.length - 1 - i]]);
      rounds.push(pairs);
      t.splice(1, 0, t.pop());
    }
    return rounds;
  }
  const clubById = (id) => CLUBS.find((c) => c.id === id) || CLUBS2.find((c) => c.id === id);
  const TEAM_NAME = (id) => (id === 'hamakaze' ? 'ハマカゼFC' : clubById(id).name);
  const TEAM_SHORT = (id) => (id === 'hamakaze' ? 'ハマカゼ' : clubById(id).short);

  // results at the other grounds: Poisson goals from team strength and the research-based tactic matchup
  const EDGE = { '○': 0.12, '△': 0, '△−': -0.1, '×': -0.2, '◎': 0.2 };
  function poisson(l) { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= Math.random(); } while (p > L); return k - 1; }
  function simulate(a, b, strength) {
    const sa = strength(a), sb = strength(b);
    const ta = a === 'hamakaze' ? 'possession' : clubById(a).tactic, tb = b === 'hamakaze' ? 'possession' : clubById(b).tactic;
    const ea = EDGE[Data.MATCHUP[ta][tb][0]] || 0, eb = EDGE[Data.MATCHUP[tb][ta][0]] || 0;
    const la = Math.max(0.2, 1.15 + (sa - sb) * 0.045 + ea + 0.12), lb = Math.max(0.2, 1.15 + (sb - sa) * 0.045 + eb);
    return [poisson(la), poisson(lb)];
  }

  window.League = { CLUBS, CLUBS2, ALL_CLUBS: CLUBS.concat(CLUBS2), TEAMS, TEAMS2, teamsForTier, clubsForTier, gatekeeper, fixtures, clubById, TEAM_NAME, TEAM_SHORT, simulate };
})();
