/* ハマカゼFC — scenes: title, dialog, clubhouse hub, roster, training, tactics, VS, result/growth, scout, ending */
(function () {
  'use strict';
  const { Game, Input, Ease, Particles, clamp, lerp, rand, randi, pick, text, panel, wrap, W, H } = E;
  const OUT = Art.OUT;
  const STAT_KEYS = ['spd', 'sht', 'pas', 'def', 'sta'];
  const STAT_NAMES = { spd: 'スピード', sht: 'シュート', pas: 'パス', def: 'ディフェンス', sta: 'スタミナ' };
  const STAT_COLORS = { spd: '#6cc35a', sht: '#e0474c', pas: '#4fb4e8', def: '#ffd24a', sta: '#b06ad8' };
  const NAMES = { otaki: 'おタキ婆', nagisa: 'ナギサ', gen: 'ゲン', morio: 'モリオ', tsubame: 'ツバメ', kazuha: 'カズハ', ponta: 'ポン太', leo: 'レオ', haruki: 'ハルキ', tetsuyama: '鉄山', yukimaru: '雪丸', onigawara: '鬼瓦監督',
    mask: 'マスク', kawataro: 'カワタロウ', shizuku: 'シズク', mame: '豆じい', daifuku: 'ダイフク', hikaru: 'ヒカル', ume: 'ウメ', kaoru: 'カオル', tatsumi: 'タツミ', oyuki: 'オユキ', gonzo: 'ゴンゾウ', minato: 'ミナト', sora: 'ソラ', kenji: 'ケンジ', pochi: 'ポチ田',
    reon: 'レオン', daigo: 'ダイゴ', shirou: 'シロウ', kurou: 'クロウ', kai: 'カイ' };
  const VOICE = { otaki: 1.25, nagisa: 1.35, gen: 0.7, morio: 0.65, tsubame: 1.45, kazuha: 1.0, ponta: 0.85, leo: 1.05, haruki: 1.3, tetsuyama: 0.72, yukimaru: 1.15, onigawara: 0.6,
    reon: 1.1, daigo: 0.68, shirou: 0.85, kurou: 0.75, kai: 1.0 };
  const RIVAL_IDS = ['tetsuyama', 'yukimaru', 'onigawara', 'reon', 'daigo', 'shirou', 'kurou', 'kai'];

  // ---------------- game state ----------------
  const State = {
    roster: [], formation: 'balance', trained: null, recruit: null, result: null, growth: null, auto: false, talked: {},
    reset() {
      this.roster = Data.HOME.map((p) => Object.assign({}, p, { stats: Object.assign({}, p.stats), base: Object.assign({}, p.stats) }));
      this.lineup = Data.DEFAULT_LINEUP.slice();
      this.tactic = 'counter';
      this.formation = 'balance'; this.trained = null; this.recruit = null; this.result = null; this.growth = null; this.talked = {};
      this.tier = 'district';
      // league season
      const table = {};
      for (const id of League.teamsForTier(this.tier)) table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
      this.season = { week: 0, rounds: League.fixtures(League.teamsForTier(this.tier)), table, results: [], log: [] };
      this.budget = 60; this.income = 0;
      this.morale = {}; this.benchWeeks = {}; this.bonds = {};
      for (const p of this.roster) { this.morale[p.id] = 62; this.benchWeeks[p.id] = 0; }
      for (const a of this.roster) for (const b of this.roster) if (a.id < b.id) this.bonds[a.id + '|' + b.id] = 50;
      this.freeAgents = Data.FREE_AGENTS.map((d) => d.id);
      this.joined = []; this.departed = []; this.applicantWeek = 2; this.staff = [];
      this.setplay = { unlocked: [], ck: 'std', fk: 'std', lv: 0, prog: 0 };
      this.seasonNo = 1; this.history = []; this.clubMods = {}; this.extraFA = []; this.listed = null; this.bought = [];
      this.h2h = {}; this.lastSeasonRanks = {}; this.promo = null;
      if (typeof applyClubs === 'function') applyClubs();
    },
    nextSetplay() { return Data.SETPLAY_UNLOCK.find((k) => !this.setplay.unlocked.includes(k)); },
    setplayName(key) { const [kind, id] = key.split('_'); const r = Data.SETPLAYS[kind].find((q) => q.id === id); return r ? r.name : ''; },
    bond(a, b) { return this.bonds[a < b ? a + '|' + b : b + '|' + a] || 0; },
    addBond(a, b, v) { const k = a < b ? a + '|' + b : b + '|' + a; this.bonds[k] = Math.min(100, (this.bonds[k] || 0) + v); },
    comboReady(c) { return this.bond(c.ids[0], c.ids[1]) >= 30; },
    fixture() {
      const pair = this.season.rounds[this.season.week].find((pr) => pr.includes('hamakaze'));
      const home = pair[0] === 'hamakaze';
      return { home, opp: League.clubById(home ? pair[1] : pair[0]), pair };
    },
    standings() {
      return League.teamsForTier(this.tier).map((id) => Object.assign({ id }, this.season.table[id])).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
    },
    rank() { return this.standings().findIndex((r) => r.id === 'hamakaze') + 1; },
    record(a, b, ga, gb) {
      const T = this.season.table, A = T[a], B = T[b];
      A.p++; B.p++; A.gf += ga; A.ga += gb; B.gf += gb; B.ga += ga;
      if (ga > gb) { A.w++; B.l++; A.pts += 3; } else if (ga < gb) { B.w++; A.l++; B.pts += 3; } else { A.d++; B.d++; A.pts++; B.pts++; }
    },
    strength(id) {
      if (id !== 'hamakaze') return League.clubById(id).rating;
      const xi = this.lineup.map((pid) => this.roster.find((q) => q.id === pid));
      return xi.reduce((a, p) => a + (p.stats.spd + p.stats.sht + p.stats.pas + p.stats.def + p.stats.sta) / 5, 0) / xi.length;
    },
    avgMorale() { return this.lineup.reduce((a, id) => a + (this.morale[id] || 60), 0) / this.lineup.length; },
    localRatio() { return this.lineup.filter((id) => (this.roster.find((q) => q.id === id) || {}).local).length / this.lineup.length; },
  };
  State.reset();
  // オートJUST: a standing preference (not tied to a save slot) that auto-resolves the chance/pinch timing meter near its sweet spot
  State.autoJust = (() => { try { return localStorage.getItem('hamakaze_fc_autojust') === '1'; } catch (e) { return false; } })();
  State.toggleAutoJust = () => {
    State.autoJust = !State.autoJust;
    try { localStorage.setItem('hamakaze_fc_autojust', State.autoJust ? '1' : '0'); } catch (e) { /* ignore */ }
  };

  // ---------------- save data (this browser only, up to 3 slots) ----------------
  const SAVE_SLOTS = 3;
  const OLD_SAVE_KEY = 'hamakaze_fc_save_v1'; // pre-multi-slot save, migrated into slot 0 on first read
  const slotKey = (i) => 'hamakaze_fc_save_v1_slot' + i;
  const SAVE_FIELDS = ['roster', 'lineup', 'tactic', 'formation', 'trained', 'talked', 'season', 'budget', 'income', 'morale', 'benchWeeks', 'bonds',
    'freeAgents', 'joined', 'departed', 'applicantWeek', 'staff', 'setplay', 'goals', 'pendingTalk', 'seasonNo', 'history', 'clubMods', 'extraFA', 'listed', 'bought', 'tier', 'h2h', 'lastSeasonRanks', 'promo'];
  const Save = {
    _migrated: false,
    migrateOld() {
      if (Save._migrated) return;
      Save._migrated = true;
      try {
        const raw = localStorage.getItem(OLD_SAVE_KEY);
        if (raw && !localStorage.getItem(slotKey(0))) { localStorage.setItem(slotKey(0), raw); localStorage.removeItem(OLD_SAVE_KEY); }
      } catch (e) { /* ignore */ }
    },
    // where: the checkpoint to resume from ('hub' | 'seasonend' | 'market' | 'done')
    write(where) {
      if (State.auto || State.saveSlot == null) return false;
      try {
        const d = { v: 1, where, at: Date.now() };
        for (const k of SAVE_FIELDS) d[k] = State[k];
        localStorage.setItem(slotKey(State.saveSlot), JSON.stringify(d));
        Save.lastT = Game.time;
        return true;
      } catch (e) { return false; }
    },
    read(slot) {
      Save.migrateOld();
      try {
        const raw = localStorage.getItem(slotKey(slot));
        if (!raw) return null;
        const d = JSON.parse(raw);
        return d && d.v === 1 && Array.isArray(d.roster) && d.season ? d : null;
      } catch (e) { return null; }
    },
    readAll() { return Array.from({ length: SAVE_SLOTS }, (_, i) => Save.read(i)); },
    load(slot) {
      const d = Save.read(slot);
      if (!d) return null;
      State.reset();
      for (const k of SAVE_FIELDS) if (d[k] !== undefined) State[k] = d[k];
      applyClubs();
      State.saveSlot = slot;
      return d.where;
    },
    delete(slot) {
      try { localStorage.removeItem(slotKey(slot)); } catch (e) { /* ignore */ }
    },
    describe(d) {
      const dt = new Date(d.at), pad = (n) => String(n).padStart(2, '0');
      const when = (dt.getMonth() + 1) + '/' + dt.getDate() + ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
      const T = d.season.table.hamakaze;
      const sn = 'S' + (d.seasonNo || 1) + ' ';
      const where = sn + (d.where === 'hub' ? '第' + (d.season.week + 1) + '節の前' : d.where === 'newseason' ? '開幕前' : 'シーズン終了後');
      return where + '　' + T.w + '勝' + T.d + '分' + T.l + '敗　' + when;
    },
  };
  function resumeScene(where) {
    if (where === 'seasonend') return SeasonEnd();
    if (where === 'market') return TransferMarket();
    if (where === 'done' || where === 'recap') return Credits();
    if (where === 'newseason') return NewSeason();
    return Hub();
  }

  // ---------------- multi-season: ageing, rival clubs, new faces ----------------
  // rival strength drifts season to season (stored as offsets so saves stay small)
  function applyClubs() {
    for (const c of League.ALL_CLUBS) {
      if (c.baseRating === undefined) { c.baseRating = c.rating; c.baseBoost = c.boost; }
      const m = (State.clubMods || {})[c.id] || { r: 0, b: 0 };
      c.rating = c.baseRating + m.r; c.boost = c.baseBoost + m.b;
    }
  }
  function faDef(id) { return Data.FREE_AGENTS.find((d) => d.id === id) || (State.extraFA || []).find((d) => d.id === id); }
  function lookFor(id) {
    const d = State.roster.find((q) => q.id === id) || faDef(id) || (State.departed || []).map((x) => x.p).find((q) => q && q.id === id)
      || League.ALL_CLUBS.map((c) => c.roster().find((q) => q.id === id)).find(Boolean);
    return d ? d.look : null;
  }
  const FAKE_PORTRAITS = {};
  // generated players have no painted portrait: frame their sprite instead
  function spritePortrait(id) {
    if (FAKE_PORTRAITS[id]) return FAKE_PORTRAITS[id];
    const look = lookFor(id);
    if (!look) return null;
    const [c, g] = E.makeCanvas(48, 48);
    g.fillStyle = '#9fdcff'; g.fillRect(0, 0, 48, 48);
    g.fillStyle = '#bfe8ff'; for (let y = 0; y < 48; y += 6) g.fillRect(0, y, 48, 3);
    g.drawImage(Art.sprite(look, 'down', 'walk1'), 0, 0, 16, 16, 0, 2, 48, 48);
    FAKE_PORTRAITS[id] = c;
    return c;
  }
  const GEN_SURNAMES = ['岬', '汐田', '磯部', '浜口', '波多野', '網元', '潮崎', '船橋', '灯台守', '入江', '小浜', '渚沢'];
  const GEN_GIVEN = ['カイト', 'リク', 'ナミ', 'ユウ', 'ショウ', 'ミオ', 'タクミ', 'アオイ', 'ケイ', 'ハヤテ', 'ツムギ', 'ゴロウ'];
  const GEN_KIND = [
    { kind: 'young', age: [16, 19], base: 38, growth: 1.45, sal: 6, trait: '伸びしろ', traitDesc: '若い。試合と練習でぐんぐん伸びる。', jobs: ['高校生', '専門学校生', '見習い漁師'],
      nick: ['港の原石', '浜辺の新星', '期待のルーキー'], pitch: '監督！ ぼく、まだ下手だけど…絶対うまくなります！ 入れてください！' },
    { kind: 'prime', age: [23, 28], base: 50, growth: 1.0, sal: 12, trait: '堅実', traitDesc: 'むらのない、安定した実力。', jobs: ['会社員', '郵便配達', '市役所職員'],
      nick: ['仕事帰りの職人', '昼休みの名手', '週末の本気'], pitch: '平日は仕事ですが、週末は全部サッカーに使います。戦力になれるはずです。' },
    { kind: 'veteran', age: [31, 36], base: 58, growth: 0.7, sal: 18, trait: '経験豊富', traitDesc: '今の能力は高いが、伸びしろは少ない。', jobs: ['元実業団', '整体師', 'ジムのトレーナー'],
      nick: ['実業団帰り', '最後のひと花', '港に戻った男'], pitch: 'もうひと花、咲かせたい。…この港町で。' },
  ];
  const HAIRS = [['#2a1a24', '#140c12'], ['#4a3020', '#2a1a14'], ['#6a4020', '#4a2a14'], ['#c0a060', '#907040'], ['#8a8a92', '#5a5a62']];
  function genFreeAgent(n, i) {
    const K = GEN_KIND[i % 3], pos = pick(['DF', 'MF', 'FW', 'DF', 'MF']);
    const age = randi(K.age[0], K.age[1]), sur = pick(GEN_SURNAMES), given = pick(GEN_GIVEN);
    const v = () => Math.round(K.base + rand(-8, 8) + (n - 2) * 1.5);
    const st = { spd: v(), sht: v(), pas: v(), def: v(), sta: v() };
    if (pos === 'DF') { st.def += 8; st.sht -= 8; } if (pos === 'FW') { st.sht += 8; st.def -= 10; }
    for (const k in st) st[k] = clamp(st[k], 18, 85);
    const hair = pick(HAIRS), skin = pick([['#f7c9a0', '#dca27a'], ['#e8b088', '#c48860'], ['#c98c62', '#9e6a44']]);
    const shirt = pick([['#e0e0e8', '#b0b0c0'], ['#f0a868', '#c07838'], ['#8ac86a', '#5a9a3a'], ['#d88ab0', '#a85a80']]);
    const id = 'gen_s' + n + '_' + i;
    return {
      id, name: given, full: sur + ' ' + given, nick: pick(K.nick), pos, age, job: pick(K.jobs), local: Math.random() < 0.6,
      bio: K.kind === 'young' ? '町の学校のサッカー部。ハマカゼの試合を見て、入団を決めた。' : K.kind === 'veteran' ? '若いころは上のリーグでプレーしていた。体力は落ちたが、技術は健在。' : '仕事と両立しながら、ずっとボールを蹴ってきた。',
      trait: K.trait, traitDesc: K.traitDesc, pitch: K.pitch, growth: K.growth, sal: K.sal + randi(-2, 3), stats: st,
      tacU: { counter: 45, press: 45, long: 45, possession: 45 },
      look: { shirt: shirt[0], shirtD: shirt[1], shirtL: '#ffffff', collar: '#2a1a24', shorts: '#3a3340', shortsD: '#26222c', socks: '#e0e0e8', skin: skin[0], skinD: skin[1], hair: hair[0], hairD: hair[1], style: pick(['short', 'spiky', 'bob', 'pomp', 'ponytail', 'perm']), key: id },
    };
  }
  // players the rival clubs are willing to sell this winter
  function genListed(n) {
    return League.clubsForTier(State.tier).slice().sort(() => Math.random() - 0.5).slice(0, 2).map((c) => {
      const cap = c.captain;
      const q = c.roster().filter((p) => p.pos !== 'GK' && p.id !== cap && !State.roster.some((r) => r.id === p.id) && !(State.bought || []).includes(p.id))
        .sort((a, b) => avgStat(b) - avgStat(a))[randi(0, 2)];
      if (!q) return null;
      const a = avgStat(q);
      return { from: c.id, id: q.id, fee: Math.round(a * 0.6), sal: Math.round(a * 0.3), reason: pick(['出場機会を求めている', 'クラブの財政難で放出', '本人が港町に引っ越してきた']) };
    }).filter(Boolean);
  }
  function avgStat(p) { return (p.stats.spd + p.stats.sht + p.stats.pas + p.stats.def + p.stats.sta) / 5; }
  const SPECIAL_UNLOCK_AVG = 55;
  // a player's finisher unlocks once they've grown into it, or (much more rarely) as a flash of insight during focused training
  function checkSpecialUnlock(p, luckChance = 0) {
    if (p.specialUnlocked || !Data.SPECIALS[p.id]) return false;
    if (avgStat(p) >= SPECIAL_UNLOCK_AVG || (luckChance > 0 && Math.random() < luckChance)) { p.specialUnlocked = true; return true; }
    return false;
  }
  // an opponent's eleven for this season: signed players are replaced, and ex-Hamakaze players turn up in the rival's kit
  function oppRoster(club) {
    const taken = new Set(State.roster.map((p) => p.id).concat(State.bought || []));
    const base = club.roster().map((p, i) => {
      if (!taken.has(p.id)) return p;
      return Object.assign({}, p, { id: p.id + '_rep', name: pick(GEN_GIVEN), trait: '', stats: Object.fromEntries(Object.entries(p.stats).map(([k, v]) => [k, v - 4])), look: Object.assign({}, p.look, { hair: pick(HAIRS)[0], key: p.look.key + '_rep' }) });
    });
    const reunion = [];
    for (const d of State.departed || []) {
      if (d.dest !== 'rival' || d.club !== club.id || !d.p || d.season >= State.seasonNo) continue;
      const slot = base.map((p, i) => [p, i]).filter(([p]) => p.pos === d.p.pos && p.id !== club.captain).sort((a, b) => avgStat(a[0]) - avgStat(b[0]))[0];
      if (!slot) continue;
      const look = Object.assign({}, d.p.look, club.kit, { skin: d.p.look.skin, skinD: d.p.look.skinD, hair: d.p.look.hair, hairD: d.p.look.hairD, style: d.p.look.style, extra: d.p.look.extra, body: d.p.look.body, key: 'rival_' + d.p.id });
      base[slot[1]] = Object.assign({}, d.p, { look, tacU: Object.assign({}, slot[0].tacU) });
      reunion.push(d.p.name);
    }
    return { roster: base, reunion };
  }

  // age curve applied once per winter: youngsters grow, veterans lose pace and legs
  function ageSquad() {
    const out = [];
    for (const p of State.roster) {
      if (typeof p.age !== 'number' || !isFinite(p.age)) continue;
      p.age++;
      const ch = {}, add = (k, v) => { if (!v) return; ch[k] = (ch[k] || 0) + v; };
      const gr = p.growth || 1, rk = () => pick(STAT_KEYS);
      if (p.age <= 20) { add(rk(), Math.round(2 * gr)); add(rk(), Math.round(2 * gr)); add(rk(), 1); }
      else if (p.age <= 25) { add(rk(), Math.round(1 * gr) || 1); add(rk(), 1); }
      else if (p.age <= 30) { if (Math.random() < 0.5) add(rk(), 1); }
      else if (p.age <= 35) { add('spd', -1); add('sta', -1); }
      else if (p.age <= 50) { add('spd', -2); add('sta', -2); add('pas', 1); }
      else { add('spd', -2); add('sta', -2); }
      for (const k in ch) p.stats[k] = clamp(p.stats[k] + ch[k], 10, 99);
      p.base = Object.assign({}, p.stats);
      out.push({ p, ch });
    }
    return out;
  }
  function NewSeason() {
    const s = { t: 0, page: 0, aged: [], news: [] };
    s.enter = () => {
      Sound.bgm('hub'); Sound.crowd(0);
      if (s.done) return;
      s.done = true;
      const n = State.seasonNo + 1;
      State.seasonNo = n;
      s.aged = ageSquad();
      // the league: last season's order sets the tone, everyone strengthens a little
      const order = State.standings().map((r) => r.id);
      State.lastSeasonRanks = State.lastSeasonRanks || {};
      order.forEach((id, i) => { State.lastSeasonRanks[id] = { rank: i + 1, tier: State.tier }; });
      State.clubMods = State.clubMods || {};
      for (const c of League.ALL_CLUBS) {
        const m = State.clubMods[c.id] || (State.clubMods[c.id] = { r: 0, b: 0 });
        const pos = order.indexOf(c.id);
        const dr = randi(0, 3) + (pos === -1 || pos >= 4 ? 1 : 0), db = Math.random() < 0.55 ? 1 : 0;
        m.r += dr; m.b = Math.min(m.b + db, 6);
        if (c.tier !== State.tier) continue; // only report on clubs we'll actually face this season
        if (dr + db >= 3) s.news.push(c.name + 'が大型補強！ 戦力アップ');
        else if (dr + db >= 1) s.news.push(c.name + 'も着実に戦力を上げてきた');
      }
      applyClubs();
      const table = {};
      for (const id of League.teamsForTier(State.tier)) table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
      const rounds = League.fixtures(League.teamsForTier(State.tier)).map((r) => r.map((pr) => (n % 2 === 0 ? [pr[1], pr[0]] : pr)));
      State.season = { week: 0, rounds, table, results: [], log: [] };
      State.goals = {}; State.trained = null; State.joined = []; State.applicantWeek = randi(1, 3);
      for (const p of State.roster) { State.morale[p.id] = Math.round(62 + ((State.morale[p.id] ?? 60) - 62) * 0.5); State.benchWeeks[p.id] = 0; }
      // new faces: fresh free agents, and players who left town may come home
      const fresh = [];
      for (let i = 0, tries = 0; fresh.length < 3 && tries < 30; tries++) { const d = genFreeAgent(n, i); if (fresh.some((f) => f.name === d.name) || State.roster.some((q) => q.name === d.name)) continue; fresh.push(d); i++; }
      State.extraFA = (State.extraFA || []).filter((d) => State.freeAgents.includes(d.id)).concat(fresh);
      State.freeAgents = State.freeAgents.concat(fresh.map((d) => d.id));
      for (const d of State.departed) {
        if (d.dest !== 'away' || d.returned || !d.p || d.season >= n - 1 || Math.random() < 0.4) continue;
        d.returned = true;
        const back = Object.assign({}, d.p, { stats: Object.fromEntries(Object.entries(d.p.stats).map(([k, v]) => [k, Math.min(99, v + randi(2, 5))])), pitch: 'ただいま、監督。外で揉まれて、少しはうまくなったよ。…もう一度、ここで蹴らせてくれないかな。', sal: d.p.sal || 10, growth: d.p.growth || 1 });
        State.extraFA.push(back); State.freeAgents.push(back.id);
        s.news.push(d.name + 'が町に戻ってきた！ 入団を希望している');
      }
      const keep = new Set(State.freeAgents.slice(-5));
      State.freeAgents = State.freeAgents.filter((id) => keep.has(id));
      State.listed = genListed(n);
      for (const d of State.departed) if (d.dest === 'rival' && d.p && d.season === n - 1 && League.clubById(d.club) && League.clubById(d.club).tier === State.tier) s.news.push('元ハマカゼの' + d.name + 'が、' + League.clubById(d.club).short + 'の一員として立ちはだかる');
      if (State.staff.length) s.news.push('コーチ陣（' + State.staff.map((id) => (State.departed.find((d) => d.id === id) || { name: id }).name).join('・') + '）のおかげで練習効果 +' + Math.min(3, State.staff.length) * 10 + '%');
      if (!s.news.length) s.news.push('どのクラブも静かなオフだった');
      Save.write('newseason');
    };
    s.update = (dt) => {
      s.t += dt;
      if (s.t > 0.8 && (okPressed() || (State.auto && s.t > 2.5))) {
        Sound.play('page'); s.page++; s.t = 0;
        if (s.page >= 2) {
          const n = State.seasonNo, fx = State.fixture();
          State.pendingTalk = [['nagisa', 'determined', 'シーズン' + n + 'の開幕です！ 初戦の相手は「' + fx.opp.name + '」。'], ['nagisa', 'normal', 'ライバルたちも強くなっています。練習と作戦で、今年も一緒に戦いましょう！']];
          Game.goto(Hub(), 'iris');
        }
      }
    };
    s.draw = (g) => {
      drawHarbor(g, s.t + 10, 'day');
      g.fillStyle = 'rgba(16,24,46,0.45)'; g.fillRect(0, 0, W, H);
      const k = Ease.outBack(clamp(s.t / 0.4, 0, 1));
      panel(g, 30, 14, 420, 30, 'dark');
      text(g, 'シーズン' + State.seasonNo + '　開幕前　（' + (State.tier === 'prefecture' ? '県リーグ' : '地区リーグ') + '）', W / 2, 20, { size: 14, align: 'center', color: '#ffd24a' });
      panel(g, 30, 52 + (1 - k) * 10, 420, 196, 'paper');
      if (s.page === 0) {
        text(g, 'ひと冬が過ぎて…　選手たちがひとつ歳をとった', 44, 60, { size: 10, color: '#10304f' });
        s.aged.slice(0, 16).forEach((a, i) => {
          const x = 44 + (i % 2) * 200, y = 80 + Math.floor(i / 2) * 20;
          g.drawImage(Art.sprite(a.p.look, 'down', 'walk1'), x, y - 4);
          text(g, a.p.name + '（' + a.p.age + '）', x + 18, y, { size: 8, color: '#2a1a24' });
          const keys = Object.keys(a.ch);
          const line = keys.length ? keys.map((kk) => STAT_NAMES[kk].slice(0, 2) + (a.ch[kk] > 0 ? '+' : '') + a.ch[kk]).join(' ') : '変化なし';
          text(g, line, x + 18, y + 9, { size: 7, color: keys.some((kk) => a.ch[kk] < 0) ? '#e0474c' : keys.length ? '#2f86c4' : '#9a8e7a' });
        });
      } else {
        text(g, 'リーグの動き', 44, 60, { size: 10, color: '#10304f' });
        s.news.slice(0, 8).forEach((l, i) => wrap(g, '・' + l, 390, 9).slice(0, 2).forEach((ll, j) => text(g, ll, 44, 80 + i * 20 + j * 11, { size: 9, color: '#2a1a24' })));
        text(g, '移籍の候補は、シーズン中の来客とシーズン後の移籍市場で', 44, 232, { size: 8, color: '#6d4f3a' });
      }
      if (s.t > 0.8) text(g, 'Z / クリック', 440, 236, { size: 8, align: 'right', color: '#6d4f3a', alpha: blink() });
    };
    return s;
  }

  function portrait(id, expr) { if (window.Portraits && Portraits.ids.includes(id)) return Portraits.get(id, expr || 'normal'); return spritePortrait(id); }
  function drawPortrait(g, id, expr, x, y, scale, flip) {
    const img = portrait(id, expr);
    if (!img) return;
    const s = 48 * scale;
    if (flip) { g.save(); g.translate(Math.round(x) + s, Math.round(y)); g.scale(-1, 1); g.drawImage(img, 0, 0, s, s); g.restore(); }
    else g.drawImage(img, Math.round(x), Math.round(y), s, s);
  }
  function statBar(g, x, y, w, v, color, prev) {
    g.fillStyle = OUT; g.fillRect(x, y, w + 2, 7);
    g.fillStyle = '#3a3050'; g.fillRect(x + 1, y + 1, w, 5);
    const pv = prev !== undefined ? prev : v;
    g.fillStyle = color; g.fillRect(x + 1, y + 1, Math.round((w * pv) / 100), 5);
    if (v > pv) { g.fillStyle = '#ffffff'; g.fillRect(x + 1 + Math.round((w * pv) / 100), y + 1, Math.max(1, Math.round((w * (v - pv)) / 100)), 5); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 1, y + 1, Math.round((w * Math.min(v, pv)) / 100), 1);
  }
  // ability ranks: S 80+ / A 70+ / B 60+ / C 50+ / D 40+ / E 30+ / F below
  const GRADES = [[80, 'S'], [70, 'A'], [60, 'B'], [50, 'C'], [40, 'D'], [30, 'E'], [0, 'F']];
  function grade(v) { return GRADES.find((gr) => v >= gr[0])[1]; }
  function nextGradeAt(v) { const i = GRADES.findIndex((gr) => v >= gr[0]); return i > 0 ? GRADES[i - 1][0] : null; }
  const GRADE_COL = { S: '#ffd24a', A: '#e0474c', B: '#f08a3a', C: '#e8c83a', D: '#6cc35a', E: '#4fb4e8', F: '#8a8496' };
  // a rank badge: coloured tile with the letter, sized for lists (10) or detail views (13)
  function drawGrade(g, x, y, v, size = 13) {
    const gr = grade(v), c = GRADE_COL[gr];
    g.fillStyle = OUT; g.fillRect(x, y, size, size);
    g.fillStyle = c; g.fillRect(x + 1, y + 1, size - 2, size - 2);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x + 1, y + 1, size - 2, 1);
    if (gr === 'S') { g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + 1, 2, 2); g.fillRect(x + size - 3, y + size - 3, 2, 2); }
    text(g, gr, x + size / 2, y + (size >= 13 ? 0 : 0), { size: size >= 13 ? 11 : 8, align: 'center', color: '#ffffff', outline: OUT });
  }
  function blink(sp = 5) { return 0.55 + 0.45 * Math.sin(Game.time * sp); }
  function okPressed() { return Input.hit('ok') || Input.mouse.clicked; }

  // ---------------- generic vertical menu ----------------
  class Menu {
    constructor(items, x, y, w, h, gap = 4) { this.items = items; this.x = x; this.y = y; this.w = w; this.h = h; this.gap = gap; this.sel = 0; this.lock = 0; }
    rect(i) { return { x: this.x, y: this.y + i * (this.h + this.gap), w: this.w, h: this.h }; }
    update(dt) {
      if (this.lock > 0) { this.lock -= dt; return null; }
      const n = this.items.length;
      if (Input.hit('up')) { this.sel = (this.sel + n - 1) % n; Sound.play('cursor'); }
      if (Input.hit('down')) { this.sel = (this.sel + 1) % n; Sound.play('cursor'); }
      for (let i = 0; i < n; i++) {
        const r = this.rect(i);
        if (E.hoverIn(r) && Input.mouse.moved && this.sel !== i) { this.sel = i; Sound.play('cursor'); }
        if (E.clickedIn(r)) { this.sel = i; return this.choose(); }
      }
      if (Input.hit('ok')) return this.choose();
      return null;
    }
    choose() {
      const it = this.items[this.sel];
      if (it.disabled) { Sound.play('cancel'); return null; }
      Sound.play('select');
      this.lock = 0.15;
      return it;
    }
    draw(g) {
      this.items.forEach((it, i) => {
        const r = this.rect(i);
        const sel = this.sel === i;
        const ox = sel ? 4 : 0;
        panel(g, r.x + ox, r.y, r.w, r.h, it.disabled ? ['#2a1a24', '#c9bda8', '#a89c86', '#e0d6c4'] : sel ? 'gold' : 'paper');
        if (it.icon) it.icon(g, r.x + ox + 8, r.y + r.h / 2 - 8);
        const tx = r.x + ox + (it.icon ? 30 : 10);
        text(g, it.label, tx, r.y + (it.sub ? 5 : r.h / 2 - 6), { size: 12, color: it.disabled ? '#7a6e5a' : '#2a1a24' });
        if (it.sub) text(g, it.sub, tx, r.y + 20, { size: 8, color: it.disabled ? '#8a7e6a' : '#6d4f3a' });
        if (sel && !it.disabled) {
          const ax = r.x + ox - 8 + Math.round(Math.sin(Game.time * 8) * 2);
          g.fillStyle = OUT; g.fillRect(ax - 1, r.y + r.h / 2 - 5, 5, 11);
          g.fillStyle = '#ffd24a'; g.fillRect(ax, r.y + r.h / 2 - 4, 1, 9); g.fillRect(ax + 1, r.y + r.h / 2 - 3, 1, 7); g.fillRect(ax + 2, r.y + r.h / 2 - 2, 1, 5); g.fillRect(ax + 3, r.y + r.h / 2 - 1, 1, 3);
        }
      });
    }
  }

  // ---------------- pixel icons ----------------
  const Icons = {
    book(g, x, y) { const p = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); }; p(OUT, 1, 1, 14, 14); p('#e0474c', 2, 2, 12, 12); p('#9e2a3a', 2, 12, 12, 2); p('#fff6e0', 4, 4, 8, 3); p('#fff6e0', 12, 3, 1, 10); },
    shoe(g, x, y) { const p = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); }; p(OUT, 2, 5, 9, 7); p(OUT, 2, 9, 14, 5); p('#4fb4e8', 3, 6, 7, 6); p('#4fb4e8', 3, 10, 12, 3); p('#ffffff', 3, 12, 12, 1); p('#ffffff', 5, 7, 1, 1); p('#ffffff', 7, 8, 1, 1); p('#2a1a24', 4, 14, 2, 1); p('#2a1a24', 9, 14, 2, 1); p('#2a1a24', 13, 14, 2, 1); },
    board(g, x, y) { const p = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); }; p(OUT, 0, 2, 16, 12); p('#6cc35a', 1, 3, 14, 10); p('#ffffff', 8, 3, 1, 10); p('#e0474c', 4, 6, 2, 2); p('#e0474c', 4, 10, 2, 2); p('#2f86c4', 11, 7, 2, 2); p('#ffffff', 3, 5, 1, 1); },
    ball(g, x, y) { const p = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); }; p(OUT, 3, 1, 10, 14); p(OUT, 1, 3, 14, 10); p('#ffffff', 4, 2, 8, 12); p('#ffffff', 2, 4, 12, 8); p('#2a2a38', 7, 6, 3, 3); p('#2a2a38', 3, 4, 2, 2); p('#2a2a38', 11, 10, 2, 2); p('#2a2a38', 4, 11, 2, 2); p('#c9cbd6', 10, 3, 2, 2); },
  };

  // ---------------- background painters ----------------
  function drawHarbor(g, t, variant) {
    const tw = Art.town(variant);
    g.drawImage(tw.sky, 0, 0);
    // sun / moon
    if (variant === 'dusk') {
      g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(360, 120, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(360, 120, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = '#fff8d0'; g.fillRect(392, 26, 20, 20); g.fillRect(388, 30, 28, 12); g.fillRect(396, 22, 12, 28);
      g.fillStyle = 'rgba(255,248,208,0.3)'; g.fillRect(384, 18, 36, 36);
    }
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 140 + t * (6 + i * 2)) % 620) - 80;
      Art.drawCloud(g, cx, 22 + i * 16, i % 2 ? 2 : 1, variant === 'dusk' ? '#ffb0a0' : '#ffffff', variant === 'dusk' ? '#d07a8a' : '#d8ecf8');
    }
    const mx = -((t * 3) % 480);
    g.drawImage(tw.mountains, mx, 70); g.drawImage(tw.mountains, mx + 960, 70);
    g.drawImage(tw.sea, 0, 150);
    // sea sparkle
    g.fillStyle = variant === 'dusk' ? '#ffd0a0' : '#ffffff';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 73 + Math.floor(t * 20) * (i % 3)) % 480, sy = 155 + ((i * 37) % 50);
      if ((Math.floor(t * 3) + i) % 4 === 0) g.fillRect(sx, sy, 3, 1);
    }
    // boats
    for (let i = 0; i < 3; i++) {
      const bx = 40 + i * 150 + Math.sin(t * 0.3 + i) * 10, by = 170 + i * 6 + Math.sin(t * 2 + i) * 1.5;
      g.fillStyle = OUT; g.fillRect(bx - 1, by - 1, 30, 7);
      g.fillStyle = i % 2 ? '#e0474c' : '#ffffff'; g.fillRect(bx, by, 28, 5);
      g.fillStyle = '#2f86c4'; g.fillRect(bx + 2, by + 3, 24, 2);
      g.fillStyle = OUT; g.fillRect(bx + 12, by - 16, 2, 16);
      g.fillStyle = '#fff6e0'; g.fillRect(bx + 14, by - 15, 8, 10);
    }
    g.drawImage(tw.town, 0, 110 - 40);
    // seagulls
    for (let i = 0; i < 4; i++) {
      const sx = ((t * (18 + i * 5) + i * 130) % 560) - 40, sy = 50 + i * 14 + Math.sin(t * 1.5 + i) * 6;
      Art.drawSeagull(g, sx, sy, t + i * 0.3, variant === 'dusk' ? '#3a2040' : '#ffffff');
    }
  }

  function drawStall(g, t, x, y, lit) {
    // takoyaki stall
    const p = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
    p(OUT, -2, 0, 124, 96);
    p('#8a5a3a', 0, 30, 120, 66); p('#6a4028', 0, 60, 120, 4); p('#a86a44', 0, 30, 120, 3);
    for (let i = 0; i < 120; i += 10) p('#7a4a30', i, 34, 1, 26);
    // roof
    p(OUT, -8, -6, 136, 14); p('#e0474c', -6, -4, 132, 10); p('#9e2a3a', -6, 4, 132, 2);
    for (let i = 0; i < 132; i += 12) p('#ffffff', -6 + i, -4, 6, 10);
    // noren
    for (let i = 0; i < 5; i++) {
      const sw = Math.round(Math.sin(t * 2 + i) * 1);
      p(OUT, 6 + i * 22 + sw, 8, 20, 22); p('#1f3a6a', 7 + i * 22 + sw, 8, 18, 21);
    }
    text(g, 'たこ焼', x + 60, y + 11, { size: 12, align: 'center', color: '#fff6e0' });
    // counter & griddle
    p(OUT, -2, 58, 124, 8); p('#c9a070', 0, 59, 120, 6);
    p('#3a3340', 20, 52, 50, 7);
    for (let i = 0; i < 6; i++) { p('#d48a1e', 23 + i * 8, 53, 6, 4); p('#8a4a1a', 24 + i * 8, 54, 3, 1); }
    // lanterns
    for (const lx of [-4, 116]) {
      const bob = Math.sin(t * 2 + lx) * 1;
      p(OUT, lx - 5, 8 + bob, 12, 18);
      p(lit ? '#ff6a4a' : '#e0474c', lx - 4, 9 + bob, 10, 16);
      p(lit ? '#ffd0a0' : '#ff8a6a', lx - 2, 12 + bob, 6, 8);
      if (lit) { g.fillStyle = 'rgba(255,160,100,0.18)'; g.beginPath(); g.arc(x + lx + 1, y + 17, 22, 0, Math.PI * 2); g.fill(); }
    }
    // sign board
    p(OUT, 84, 66, 30, 24); p('#fff6e0', 85, 67, 28, 22);
    text(g, '8個', x + 99, y + 68, { size: 8, align: 'center', color: '#2a1a24' });
    text(g, '300円', x + 99, y + 78, { size: 8, align: 'center', color: '#e0474c' });
  }

  function drawClubhouse(g, t, ox = 0) {
    const p = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(ox + a, b, w, h); };
    // wall
    p('#c98a5a', 0, 0, 300, 200);
    for (let x = 0; x < 300; x += 14) { p('#b87a4c', x, 0, 1, 200); p('#d89a6a', x + 1, 0, 1, 200); }
    p('#8a5a3a', 0, 0, 300, 8); p('#6a4028', 0, 8, 300, 2);
    // window
    p(OUT, 16, 26, 100, 70);
    const sky = g.createLinearGradient(0, 28, 0, 94); sky.addColorStop(0, '#6ec6f5'); sky.addColorStop(1, '#dff4ff');
    g.fillStyle = sky; g.fillRect(ox + 18, 28, 96, 66);
    p('#3a9ad8', 18, 72, 96, 22); p('#2f7ab8', 18, 78, 96, 1); p('#2f7ab8', 18, 86, 96, 1);
    Art.drawCloud(g, ox + 18 + ((t * 5) % 120) - 30, 36, 1, '#ffffff', '#d8ecf8');
    Art.drawSeagull(g, ox + 20 + ((t * 14) % 100), 50 + Math.sin(t) * 4, t);
    // lighthouse
    p('#ffffff', 92, 52, 6, 20); p('#e0474c', 92, 58, 6, 3); p('#e0474c', 92, 66, 6, 3); p('#2a1a24', 91, 49, 8, 3);
    p('#8a5a3a', 16, 58, 100, 3); p('#8a5a3a', 64, 26, 3, 70);
    // curtains
    p('#e0474c', 10, 22, 10, 78); p('#9e2a3a', 18, 22, 2, 78); p('#e0474c', 112, 22, 10, 78); p('#9e2a3a', 112, 22, 2, 78);
    p('#6a4028', 6, 20, 120, 3);
    // whiteboard
    p(OUT, 136, 30, 96, 62); p('#f4f6f8', 137, 31, 94, 58); p('#c9cbd6', 137, 86, 94, 3);
    p('#6cc35a', 142, 36, 84, 46); p('#ffffff', 184, 36, 1, 46); p('#ffffff', 142, 36, 84, 1); p('#ffffff', 142, 81, 84, 1);
    const form = Data.FORMATIONS[State.formation];
    form.slots.forEach(([nx, ny]) => { p('#2f86c4', 142 + Math.round(nx * 84) - 2, 36 + Math.round(ny * 46) - 2, 4, 4); p('#9fdcff', 142 + Math.round(nx * 84) - 1, 36 + Math.round(ny * 46) - 1, 1, 1); });
    p('#2f86c4', 143, 57, 4, 4);
    for (let i = 0; i < 3; i++) p('#e0474c', 200 + i * 7, 44 + i * 12, 3, 3);
    g.strokeStyle = '#e0474c'; g.lineWidth = 1; g.beginPath(); g.moveTo(ox + 170, 50); g.quadraticCurveTo(ox + 190, 40, ox + 205, 52); g.stroke();
    p('#e0474c', 132, 89, 10, 3); p('#2f86c4', 144, 89, 10, 3);
    // pennant
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#4fb4e8' : '#ffffff'; g.beginPath(); g.moveTo(ox + 124 + i * 16, 12); g.lineTo(ox + 138 + i * 16, 12); g.lineTo(ox + 131 + i * 16, 22); g.fill(); }
    p('#6a4028', 120, 11, 160, 1);
    // shelf
    p(OUT, 244, 56, 50, 4); p('#8a5a3a', 245, 57, 48, 2);
    p(OUT, 250, 40, 12, 16); p('#ffd24a', 251, 41, 10, 7); p('#d48a1e', 255, 48, 2, 4); p('#d48a1e', 252, 52, 8, 3); p('#fff1a0', 252, 42, 2, 3);
    p(OUT, 268, 45, 11, 11); p('#ffffff', 269, 46, 9, 9); p('#2a2a38', 272, 49, 3, 3);
    p(OUT, 282, 42, 9, 14); p('#e8d6ae', 283, 43, 7, 12); p('#e0474c', 283, 46, 7, 3);
    // poster
    p(OUT, 244, 70, 46, 60); p('#fff6e0', 245, 71, 44, 58); p('#4fb4e8', 245, 71, 44, 16);
    text(g, '目指せ', ox + 267, 73, { size: 8, align: 'center', color: '#ffffff' });
    text(g, '地区', ox + 267, 92, { size: 10, align: 'center', color: '#2a1a24' });
    text(g, 'リーグ', ox + 267, 106, { size: 10, align: 'center', color: '#e0474c' });
    // clock
    p(OUT, 20, 108, 20, 20); p('#fff6e0', 21, 109, 18, 18);
    const ang = t * 0.5;
    g.fillStyle = OUT; g.fillRect(ox + 29, 117, 1, 1);
    for (let i = 1; i < 7; i++) g.fillRect(ox + 29 + Math.round(Math.cos(ang) * i), 117 + Math.round(Math.sin(ang) * i), 1, 1);
    for (let i = 1; i < 5; i++) g.fillRect(ox + 29 + Math.round(Math.cos(ang / 12) * i), 117 + Math.round(Math.sin(ang / 12) * i), 1, 1);
    // lockers
    for (let i = 0; i < 4; i++) {
      p(OUT, 150 + i * 22, 100, 22, 100); p('#5a8ab8', 151 + i * 22, 101, 20, 99); p('#4a7aa8', 151 + i * 22, 101, 2, 99);
      p('#2a4a6a', 157 + i * 22, 108, 8, 1); p('#2a4a6a', 157 + i * 22, 111, 8, 1); p('#ffd24a', 167 + i * 22, 140, 2, 6);
    }
    // floor
    p('#8a5a3a', 0, 196, 300, 74);
    for (let y = 200; y < 270; y += 10) p('#7a4a30', 0, y, 300, 1);
    for (let y = 0; y < 7; y++) for (let x = (y % 2) * 30; x < 300; x += 60) p('#7a4a30', x, 200 + y * 10, 1, 10);
    p('#6a4028', 0, 196, 300, 4);
    // bench
    p(OUT, 20, 180, 110, 10); p('#c98a5a', 21, 181, 108, 6); p('#a86a44', 21, 186, 108, 2);
    p(OUT, 26, 188, 4, 18); p(OUT, 120, 188, 4, 18);
    // cat on bench (sleeping, tail swish)
    const cx = 34, cy = 172;
    p(OUT, cx - 1, cy + 1, 22, 9); p('#f0a030', cx, cy + 2, 20, 7); p('#ffffff', cx + 2, cy + 6, 8, 3);
    p(OUT, cx + 14, cy - 2, 10, 9); p('#f0a030', cx + 15, cy - 1, 8, 7); p(OUT, cx + 15, cy - 4, 2, 3); p(OUT, cx + 21, cy - 4, 2, 3);
    p('#f0a030', cx + 16, cy - 3, 1, 2); p('#f0a030', cx + 21, cy - 3, 1, 2);
    p(OUT, cx + 17, cy + 2, 2, 1); p(OUT, cx + 20, cy + 2, 2, 1);
    p('#d48a1e', cx + 4, cy + 2, 2, 5); p('#d48a1e', cx + 9, cy + 2, 2, 5);
    const tw2 = Math.round(Math.sin(t * 2) * 2);
    p(OUT, cx - 6, cy + 3 + tw2, 7, 3); p('#f0a030', cx - 5, cy + 4 + tw2, 5, 1);
    // zzz
    const zt = (t * 0.8) % 1;
    text(g, 'z', ox + cx + 24 + zt * 6, cy - 8 - zt * 10, { size: 8, color: '#fff6e0', alpha: 1 - zt });
    // ball basket
    p(OUT, 200, 214, 40, 26); p('#6a4028', 201, 215, 38, 24);
    for (let i = 0; i < 4; i++) { p(OUT, 203 + i * 9, 208, 9, 9); p('#ffffff', 204 + i * 9, 209, 7, 7); p('#2a2a38', 206 + i * 9, 211, 2, 2); }
    for (let i = 0; i < 5; i++) p('#8a5a3a', 203 + i * 8, 218, 1, 20);
    // cone
    p(OUT, 260, 222, 14, 16); p('#f08a3a', 261, 223, 12, 14); p('#ffffff', 262, 229, 10, 2); p(OUT, 256, 236, 22, 3);
    // window light patch on floor
    g.fillStyle = 'rgba(255,248,208,0.12)'; g.beginPath(); g.moveTo(ox + 20, 200); g.lineTo(ox + 120, 200); g.lineTo(ox + 150, 260); g.lineTo(ox + 40, 260); g.fill();
  }

  function drawBeach(g, t, dusk) {
    const tw = Art.town(dusk ? 'dusk' : 'day');
    g.drawImage(tw.sky, 0, 0);
    for (let i = 0; i < 3; i++) Art.drawCloud(g, ((i * 170 + t * 8) % 620) - 80, 20 + i * 18, 2, dusk ? '#ffb0a0' : '#ffffff', dusk ? '#d07a8a' : '#d8ecf8');
    g.drawImage(tw.mountains, -((t * 4) % 480), 60); g.drawImage(tw.mountains, 960 - ((t * 4) % 480), 60);
    g.drawImage(tw.sea, 0, 130); g.drawImage(tw.sea, 0, 160, 480, 30);
    // waves
    const wy = 186;
    for (let x = 0; x < 480; x += 2) {
      const h = Math.sin(x * 0.05 + t * 2) * 2 + Math.sin(x * 0.13 - t * 1.3) * 1.5;
      g.fillStyle = '#ffffff'; g.fillRect(x, Math.round(wy + h), 2, 2);
      g.fillStyle = dusk ? '#e8a080' : '#9fdcff'; g.fillRect(x, Math.round(wy + h) + 2, 2, 3);
    }
    g.fillStyle = dusk ? '#e8b888' : '#f2d8a0'; g.fillRect(0, 194, 480, 76);
    const R = Art.rng(5);
    for (let i = 0; i < 400; i++) { g.fillStyle = R() < 0.5 ? (dusk ? '#d8a878' : '#e6c890') : (dusk ? '#f0c898' : '#fae4b4'); g.fillRect((R() * 480) | 0, 196 + ((R() * 74) | 0), 2, 1); }
    // shells
    for (let i = 0; i < 6; i++) { g.fillStyle = '#ffffff'; g.fillRect(30 + i * 80, 250 - (i % 3) * 12, 3, 2); g.fillStyle = '#f0a0a0'; g.fillRect(31 + i * 80, 250 - (i % 3) * 12, 1, 1); }
  }

  // ---------------- TITLE ----------------
  function Title() {
    const s = { t: 0, phase: 0, logoY: -80, menu: null, fx: new Particles(), ballX: -20, started: false };
    s.enter = () => { Sound.bgm('title'); Sound.crowd(0); Game.tweens.to(s, { logoY: 36 }, 1.1, Ease.outBounce, 0.3); };
    s.update = (dt) => {
      s.t += dt;
      s.fx.update(dt);
      if (Math.random() < 0.3) s.fx.add({ x: rand(0, W), y: rand(120, 200), vx: rand(-4, 4), vy: rand(-8, -2), life: rand(1, 2.5), size: 1, color: 'rgba(255,255,255,0.8)' });
      if (State.auto && s.t > 1.5 && !s.autoGone) { s.autoGone = true; State.reset(); State.saveSlot = 0; Game.goto(Intro(), 'iris'); return; }
      if (s.autoGone) return;
      if (!s.menu && s.t > 1.2 && (Input.anyPressed || Input.mouse.clicked)) {
        Sound.init(); Sound.bgm('title'); Sound.play('stamp');
        s.slots = Save.readAll();
        const items = s.slots.map((sv, i) => ({ id: 'slot' + i, label: 'スロット' + (i + 1), sub: sv ? Save.describe(sv) : '（からっぽ）新しく始める' }));
        items.push({ id: 'howto', label: 'あそびかた', sub: '操作と遊びのコツ' });
        s.menu = new Menu(items, W / 2 - 120, 114, 240, 28, 4);
        s.menu.lock = 0.25;
        Game.addShake(2, 0.2);
        return;
      }
      if (s.howto) { if (okPressed() || Input.hit('back')) { s.howto = false; Sound.play('cancel'); } return; }
      if (s.confirmMenu) {
        if (Input.hit('back')) { s.confirmMenu = null; Sound.play('cancel'); return; }
        const r = s.confirmMenu.update(dt);
        if (!r) return;
        if (r.id === 'cont') { const where = Save.load(s.pendingSlot); if (where) { Sound.stopBgm(0.8); Game.goto(resumeScene(where), 'iris'); } }
        else if (r.id === 'restart') { Save.delete(s.pendingSlot); State.reset(); State.saveSlot = s.pendingSlot; Sound.stopBgm(0.8); Game.goto(Intro(), 'iris'); }
        else { s.confirmMenu = null; }
        return;
      }
      if (s.menu) {
        const r = s.menu.update(dt);
        if (!r) return;
        if (r.id === 'howto') { s.howto = true; return; }
        const i = Number(r.id.slice(4));
        if (s.slots[i]) {
          s.pendingSlot = i;
          s.confirmMenu = new Menu([
            { id: 'cont', label: 'つづきから', sub: Save.describe(s.slots[i]) },
            { id: 'restart', label: 'このデータを消して、新しく始める', sub: '※元に戻せません' },
            { id: 'back', label: 'もどる（X）', sub: '' },
          ], W / 2 - 120, 114, 240, 28, 4);
          s.confirmMenu.lock = 0.2;
        } else {
          State.reset(); State.saveSlot = i; Sound.stopBgm(0.8); Game.goto(Intro(), 'iris');
        }
      }
    };
    s.draw = (g) => {
      drawHarbor(g, s.t, 'day');
      // pitch strip foreground
      g.fillStyle = '#4fa84a'; g.fillRect(0, 214, W, 56);
      for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#469a42' : '#5bb655'; g.fillRect(i * 40, 216, 40, 54); }
      g.fillStyle = '#ffffff'; g.fillRect(0, 216, W, 2);
      g.fillStyle = '#c7a878'; g.fillRect(0, 208, W, 8);
      // goal on the right
      g.fillStyle = OUT; g.fillRect(420, 176, 3, 44); g.fillRect(470, 176, 3, 44); g.fillRect(420, 174, 53, 4);
      g.fillStyle = '#ffffff'; g.fillRect(421, 177, 1, 42); g.fillRect(471, 177, 1, 42); g.fillRect(421, 175, 51, 2);
      g.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 8; i++) g.fillRect(423, 180 + i * 5, 47, 1); for (let i = 0; i < 9; i++) g.fillRect(424 + i * 5, 178, 1, 42);
      // running players
      const ppl = ['haruki', 'leo', 'tsubame'];
      ppl.forEach((id, i) => {
        const def = Data.HOME.find((d) => d.id === id);
        const x = ((s.t * (46 + i * 6) + i * 110) % 620) - 70;
        const fr = ['walk0', 'walk1', 'walk2', 'walk3'][Math.floor(s.t * 8 + i) % 4];
        g.drawImage(Art.sprite(def.look, 'side', fr), Math.round(x), 222 + i * 10, 32, 44);
      });
      s.fx.draw(g);
      // logo
      const ly = Math.round(s.logoY);
      g.save();
      const wob = Math.sin(s.t * 2) * 1.5;
      panel(g, W / 2 - 130, ly - 6 + wob, 260, 86, 'dark');
      g.fillStyle = '#4fb4e8'; g.fillRect(W / 2 - 124, ly + 68 + wob, 248, 2);
      text(g, 'ハマカゼFC', W / 2, ly + 2 + wob, { size: 40, align: 'center', color: '#ffffff', outline: '#10304f', outlineW: 3 });
      g.save(); g.beginPath(); g.rect(0, ly + 24 + wob, W, 24); g.clip();
      text(g, 'ハマカゼFC', W / 2, ly + 2 + wob, { size: 40, align: 'center', color: '#9fdcff' });
      g.restore();
      text(g, '〜 港町蹴球監督記 〜', W / 2, ly + 50 + wob, { size: 12, align: 'center', color: '#ffd24a', outline: '#10304f' });
      Icons.ball(g, W / 2 + 112, ly - 12 + wob);
      g.restore();
      if (!s.menu && s.t > 1.2) {
        panel(g, W / 2 - 80, 184, 160, 22, 'paper');
        text(g, 'PRESS ANY KEY / CLICK', W / 2, 190, { size: 10, align: 'center', color: '#2a1a24', alpha: blink(6) });
      }
      if (s.confirmMenu) s.confirmMenu.draw(g);
      else if (s.menu) s.menu.draw(g);
      text(g, '体験版 ver 0.9', 6, H - 12, { size: 8, color: '#ffffff', outline: '#10304f' });
      text(g, 'M: 音のON/OFF', W - 6, H - 12, { size: 8, align: 'right', color: '#ffffff', outline: '#10304f' });
      if (s.howto) drawHowto(g);
    };
    return s;
  }
  function drawHowto(g) {
    g.globalAlpha = 0.85; g.fillStyle = '#0a0e1c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    panel(g, 30, 20, W - 60, H - 40, 'paper');
    text(g, 'あそびかた', W / 2, 30, { size: 16, align: 'center', color: '#10304f' });
    const rows = [
      ['あなたは', '港町の弱小クラブ「ハマカゼFC」の新米監督。'],
      ['試合前', '練習で選手をきたえ、作戦ボードで陣形を決めよう。'],
      ['試合中', '選手は自分で考えて動く。監督は 1〜4キー / ボタン で指示を出す。'],
      ['気合', '指示には気合ゲージを使う。ここぞという場面で声を出そう。'],
      ['CHANCE!!', 'シュートの瞬間、JUST のタイミングで Z / クリック！'],
      ['PINCH!!', '相手のシュートは、GKゲンさんに合わせてタイミングよく！'],
      ['リーグ', '6チーム総当たりの全5節。試合後は分析と成長、他会場の結果と順位表。'],
      ['移籍市場', 'シーズン後に開く。予算・選手枠・出番・地元・絆を考えて補強しよう。'],
      ['操作', '矢印キー / マウスで選択、Z・Enter で決定、X で戻る、M で消音'],
    ];
    rows.forEach((r, i) => {
      const y = 52 + i * 20;
      panel(g, 44, y, 80, 17, 'sky');
      text(g, r[0], 84, y + 3, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f' });
      text(g, r[1], 132, y + 4, { size: 9, color: '#2a1a24' });
    });
    text(g, 'Z / クリック で閉じる', W / 2, H - 34, { size: 9, align: 'center', color: '#6d4f3a', alpha: blink() });
  }

  // ---------------- DIALOG ----------------
  function Dialog(opts) {
    // opts: { bg(g,t), lines:[{who,expr,text,side,fx}], next: () => scene, bgm, title }
    const s = { t: 0, i: 0, n: 0, lines: opts.lines, fx: new Particles(), shakeT: 0, enterK: 0, done: false };
    let prevWho = null;
    s.enter = () => { if (opts.bgm) Sound.bgm(opts.bgm); if (opts.crowd !== undefined) Sound.crowd(opts.crowd); s.start(0); };
    s.start = (i) => {
      s.i = i; s.n = 0; s.lt = 0;
      const L = s.lines[i];
      if (L.who !== prevWho) { s.enterK = 0; Game.tweens.to(s, { enterK: 1 }, 0.25, Ease.outBack); }
      prevWho = L.who;
      if (L.fx === 'shake') { Game.addShake(4, 0.35); Sound.play('stamp'); }
      if (L.fx === 'flash') Game.doFlash(0.5);
      if (L.sfx) Sound.play(L.sfx);
    };
    s.update = (dt) => {
      s.t += dt; s.lt += dt;
      s.fx.update(dt);
      if (opts.tick) opts.tick(s, dt);
      const L = s.lines[s.i];
      const prevN = Math.floor(s.n);
      const fast = Input.isDown('back') ? 4 : 1;
      s.n = Math.min(L.text.length, s.n + dt * 38 * fast);
      if (Math.floor(s.n) > prevN && L.who) {
        const ch = L.text[Math.floor(s.n) - 1];
        if (ch && !'、。！？…「」 '.includes(ch)) Sound.play('blip', { pitch: (VOICE[L.who] || 1) * rand(0.95, 1.05) });
      }
      const adv = okPressed() || (State.auto && s.lt > 1.4) || (Input.isDown('back') && s.n >= L.text.length && s.lt > 0.12);
      if (adv && !s.done) {
        if (s.n < L.text.length) s.n = L.text.length;
        else if (s.i + 1 < s.lines.length) { Sound.play('page', { vol: 0.5 }); s.start(s.i + 1); }
        else { s.done = true; Sound.play('select'); Game.goto(opts.next(), opts.trans || 'iris'); }
      }
    };
    s.draw = (g) => {
      opts.bg(g, s.t, s);
      s.fx.draw(g);
      const L = s.lines[s.i];
      // portrait
      if (L.who) {
        const left = L.side !== 'right';
        const k = s.enterK;
        const px = left ? 14 - (1 - k) * 40 : W - 14 - 144 + (1 - k) * 40;
        const bob = Math.round(Math.sin(s.t * 2) * 1);
        g.globalAlpha = clamp(k, 0, 1);
        drawPortrait(g, L.who, L.expr, px, 186 - 144 + 8 + bob, 3, !left);
        g.globalAlpha = 1;
      }
      // box
      panel(g, 8, 186, W - 16, 78, 'paper');
      if (L.who) {
        const nm = NAMES[L.who] || L.who;
        const left = L.side !== 'right';
        E.setFont(g, 10);
        const nw = Math.ceil(g.measureText(nm).width) + 20;
        const nx = left ? 20 : W - 20 - nw;
        panel(g, nx, 177, nw, 18, RIVAL_IDS.includes(L.who) ? 'crimson' : 'sky');
        text(g, nm, nx + nw / 2, 181, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f' });
      }
      const lines = wrap(g, L.text.slice(0, Math.floor(s.n)), W - 50, 12);
      lines.forEach((l, i) => text(g, l, 24, 202 + i * 17, { size: 12, color: L.who ? '#2a1a24' : '#10304f' }));
      if (s.n >= L.text.length) {
        const by = 250 + Math.round(Math.abs(Math.sin(s.t * 5)) * 2);
        g.fillStyle = OUT; g.fillRect(W - 30, by - 1, 9, 6);
        g.fillStyle = '#e0474c'; g.fillRect(W - 29, by, 7, 1); g.fillRect(W - 28, by + 1, 5, 1); g.fillRect(W - 27, by + 2, 3, 1); g.fillRect(W - 26, by + 3, 1, 1);
      }
      text(g, 'X長押し: 早送り', W - 16, 190, { size: 8, align: 'right', color: '#9a8e7a' });
      if (opts.title && s.t < 3) {
        const a = s.t < 2.4 ? 1 : 1 - (s.t - 2.4) / 0.6;
        panel(g, 10, 10, 200, 22, 'dark');
        text(g, opts.title, 20, 15, { size: 10, color: '#ffd24a', alpha: a });
      }
    };
    return s;
  }

  // ---------------- story scenes ----------------
  function Intro() {
    const steam = new Particles();
    return Dialog({
      bgm: 'hub', crowd: 0, title: '第1話　港町の監督さん',
      bg: (g, t) => {
        drawHarbor(g, t, 'day');
        // pier
        g.fillStyle = '#8a6a4a'; g.fillRect(0, 170, W, 100);
        g.fillStyle = '#7a5a3a'; for (let x = 0; x < W; x += 16) g.fillRect(x, 170, 1, 100);
        g.fillStyle = '#6a4a2a'; g.fillRect(0, 170, W, 3);
        drawStall(g, t, 250, 76, false);
        steam.update(1 / 60);
        if (Math.random() < 0.3) steam.add({ x: 285 + rand(0, 40), y: 126, vx: rand(-3, 3), vy: rand(-18, -10), life: rand(0.8, 1.4), size: rand(2, 4), color: 'rgba(255,255,255,0.6)' });
        steam.draw(g);
        // otaki behind counter (sprite)
        g.drawImage(Art.sprite(benchLook('otaki'), 'down', Math.sin(t * 4) > 0.6 ? 'cheer' : 'walk1'), 300, 104, 32, 44);
        g.drawImage(Art.sprite(benchLook('nagisa'), 'left', 'walk1'), 390, 128, 32, 44);
        // crates
        g.fillStyle = OUT; g.fillRect(40, 150, 34, 24); g.fillStyle = '#c98a5a'; g.fillRect(41, 151, 32, 22); g.fillStyle = '#a86a44'; g.fillRect(41, 161, 32, 2);
        text(g, '浜風漁協', 57, 153, { size: 8, align: 'center', color: '#6a4028' });
      },
      lines: [
        { who: 'otaki', expr: 'happy', text: 'おや！ あんたが新しい監督さんかい！ よう来たねぇ、遠いとこから！' },
        { who: 'otaki', expr: 'normal', text: 'うちは「ハマカゼFC」。この港町の、ちっちゃいちっちゃいサッカークラブさ。' },
        { who: 'otaki', expr: 'happy', text: 'あたしがオーナーのおタキ。本業はこの屋台のたこ焼き屋だよ。ほれ、一個お食べ。' },
        { who: 'nagisa', expr: 'normal', side: 'right', text: 'マネージャーのナギサです！ 監督、さっそくですが…大事なお知らせがあります。' },
        { who: 'nagisa', expr: 'determined', side: 'right', text: '今週末から「港湾地区リーグ」が開幕します。6チームの総当たり、全5節です。' },
        { who: 'nagisa', expr: 'normal', side: 'right', text: '開幕戦の相手は、隣町の「ヤマオロシ鉄工団」。去年2位の強豪です。' },
        { who: 'otaki', expr: 'surprised', text: '鉄工団だって！？ いきなり大変な相手じゃないか！', fx: 'shake' },
        { who: 'nagisa', expr: 'sad', side: 'right', text: '正直に言うと……うちは、去年もその前も、ずっとリーグ最下位なんです。' },
        { who: 'otaki', expr: 'normal', text: '他所のチームからは「港のお遊びクラブ」なんて呼ばれてるくらいさ。悔しいけどね。' },
        { who: 'nagisa', expr: 'determined', side: 'right', text: 'でも……だからこそです。監督となら、見返してやれる気がするんです！' },
        { who: 'nagisa', expr: 'normal', side: 'right', text: 'シーズンが終わったら移籍市場も開きます。順位がいいほど、商店街からの応援資金も増えるそうです。' },
        { who: 'otaki', expr: 'determined', text: 'ようし…！ 監督、選手たちのこと、頼んだよ。舐めてた連中を、一泡吹かせてやろうじゃないか！' },
        { who: 'nagisa', expr: 'happy', side: 'right', text: 'まずはクラブハウスへ行きましょう。みんなを紹介しますね！' },
      ],
      next: () => Hub(true),
    });
  }

  // ---------------- HUB ----------------
  const HOTSPOTS = [
    { id: 'cat', r: { x: 26, y: 164, w: 36, h: 22 }, lines: [['nagisa', 'happy', 'その子は「ハンペン」。クラブハウスの主です。試合の日は必ず寝てます。']] },
    { id: 'board', r: { x: 136, y: 30, w: 96, h: 62 }, lines: [['nagisa', 'normal', '作戦ボードです。今の陣形は「{form}」。変えるなら「作戦ボード」から！']] },
    { id: 'trophy', r: { x: 248, y: 38, w: 16, h: 20 }, lines: [['nagisa', 'sad', 'クラブ唯一のトロフィー…町内会ボウリング大会の3位です。']] },
    { id: 'window', r: { x: 18, y: 28, w: 96, h: 66 }, lines: [['nagisa', 'normal', '今日も海がきれい。灯台の向こうが、ヤマオロシの製鉄所がある町です。']] },
    { id: 'poster', r: { x: 244, y: 70, w: 46, h: 60 }, lines: [['nagisa', 'determined', '目標は地区リーグ昇格！ …ずっと貼ってあるので、色あせてますけど。']] },
  ];
  const HUB_PEOPLE = [
    { id: 'ponta', x: 64, y: 150, face: 'down', lines: [['ponta', 'happy', '監督〜、練習の後のたこ焼きって、なんであんなにうまいんスかね？'], ['ponta', 'normal', '腹が減っては戦ができぬ、ってことわざ、オレのためにあると思うんスよ。']] },
    { id: 'leo', x: 108, y: 206, face: 'left', lines: [['leo', 'normal', 'アンタが新しい監督？ ふーん。ま、オレにボール集めときゃ勝てるから。'], ['leo', 'determined', '鉄工団の鉄山ってのは、ちょっとは骨があるらしいじゃん。']] },
    { id: 'haruki', x: 200, y: 170, face: 'down', juggle: true, lines: [['haruki', 'happy', 'よろしくお願いします、監督！ リフティング、今日は32回いけました！'], ['haruki', 'determined', 'オレ、試合に出たらとにかく走ります！ 走るのだけは負けません！']] },
    { id: 'gen', x: 40, y: 210, face: 'right', lines: [['gen', 'normal', '朝の漁の帰りだ。…網にかかった魚とボールは、逃がさねぇよ。']] },
    { id: 'kazuha', x: 238, y: 218, face: 'left', lines: [['kazuha', 'normal', '相手の試合記録、読んでおきました。7番の雪丸…あのドリブルは要注意です。']] },
  ];

  function Hub(first) {
    const s = { t: 0, talk: null, menu: null, fx: new Particles(), hover: null };
    const fx = State.fixture();
    const aceP = oppRoster(fx.opp).roster.find((p) => p.id === fx.opp.captain);
    const items = () => [
      { id: 'roster', label: '選手名鑑', sub: 'やる気・能力・人となり', icon: Icons.book },
      { id: 'train', label: '練習する', sub: State.trained ? '今週の練習は終わりました' : '週1回。能力や戦術理解がアップ', icon: Icons.shoe, disabled: !!State.trained },
      { id: 'tactics', label: '作戦ボード', sub: Data.FORMATIONS[State.formation].short + '・' + Data.TACTICS[State.tactic].name, icon: Icons.board },
      { id: 'table', label: '順位表', sub: '現在 ' + State.rank() + '位　' + State.season.table.hamakaze.pts + '点', icon: Icons.book },
      { id: 'match', label: '試合へ！', sub: 'vs ' + fx.opp.name, icon: Icons.ball },
    ];
    s.enter = () => {
      Sound.bgm('hub'); Sound.crowd(0);
      s.saved = Save.write('hub');
      s.menu = new Menu(items(), 316, 54, 154, 30, 4);
      if (first) s.say([['nagisa', 'happy', 'ここがクラブハウスです！ 選手のみんなに声をかけたり、右のメニューから準備を進めてください。'], ['nagisa', 'normal', '試合までに「練習」は1回できます。何をきたえるか、よーく考えてくださいね！']]);
      else if (State.pendingTalk) { s.say(State.pendingTalk); State.pendingTalk = null; }
      else if (State.trained && !State.talked.afterTrain) { State.talked.afterTrain = true; s.say([['nagisa', 'happy', 'おつかれさまでした！ 準備ができたら「試合へ！」を選んでください。']]); }
    };
    s.say = (lines) => { s.talk = { lines, i: 0, n: 0 }; };
    s.update = (dt) => {
      s.t += dt; s.fx.update(dt);
      if (s.talk) {
        const tk = s.talk, L = tk.lines[tk.i];
        const txt = L[2].replace('{form}', Data.FORMATIONS[State.formation].short);
        const pn = Math.floor(tk.n);
        tk.n = Math.min(txt.length, tk.n + dt * 40);
        if (Math.floor(tk.n) > pn) { const ch = txt[pn]; if (ch && !'、。！？… '.includes(ch)) Sound.play('blip', { pitch: VOICE[L[0]] || 1 }); }
        if (okPressed() || (State.auto && tk.n >= txt.length)) {
          if (tk.n < txt.length) tk.n = txt.length;
          else if (tk.i + 1 < tk.lines.length) { tk.i++; tk.n = 0; Sound.play('page', { vol: 0.5 }); }
          else { s.talk = null; if (s.menu) s.menu.lock = 0.15; }
        }
        return;
      }
      // hotspots & people
      s.hover = null;
      for (const hs of HOTSPOTS) if (E.hoverIn(hs.r)) s.hover = hs;
      for (const pp of HUB_PEOPLE) { const r = { x: pp.x - 2, y: pp.y - 44, w: 36, h: 46 }; if (E.hoverIn(r)) s.hover = pp; }
      if (s.hover && Input.mouse.clicked && Input.mouse.x < 300) {
        const h = s.hover;
        const idx = (State.talked[h.id] || 0) % h.lines.length;
        State.talked[h.id] = (State.talked[h.id] || 0) + 1;
        Sound.play('select');
        if (h.id === 'cat') Sound.play('coin', { pitch: 1.6, vol: 0.4 });
        s.say([h.lines[idx]]);
        return;
      }
      if (State.auto) { s.menu.sel = State.trained ? 4 : 1; Input.pressed.ok = s.t > 1; }
      const r = s.menu.update(dt);
      if (!r) return;
      if (r.id === 'roster') Game.goto(Roster(), 'stripe');
      if (r.id === 'train') Game.goto(Training(), 'stripe');
      if (r.id === 'tactics') Game.goto(Tactics(), 'stripe');
      if (r.id === 'table') Game.goto(LeagueTable(() => Hub()), 'stripe');
      if (r.id === 'match') {
        if (!State.trained && !s.warned) { s.warned = true; s.say([['nagisa', 'surprised', '監督、まだ今日の練習をしてませんよ！ …本当にこのまま試合に行きます？'], ['nagisa', 'normal', 'もう一度「試合へ！」を選ぶと出発します。']]); return; }
        Sound.stopBgm(0.6);
        Game.goto(Versus(), 'blocks');
      }
    };
    s.draw = (g) => {
      drawClubhouse(g, s.t);
      // people
      const ppl = HUB_PEOPLE.slice().sort((a, b) => a.y - b.y);
      for (const pp of ppl) {
        const def = Data.HOME.find((d) => d.id === pp.id);
        let fr = 'walk1';
        if (pp.id === 'ponta') fr = Math.floor(s.t * 2) % 2 ? 'walk1' : 'walk3';
        if (pp.juggle) fr = Math.floor(s.t * 3) % 2 ? 'walk0' : 'walk2';
        const dir = pp.face === 'right' ? 'side' : pp.face;
        const bob = pp.id === 'ponta' ? Math.round(Math.sin(s.t * 3)) : 0;
        g.fillStyle = 'rgba(40,20,10,0.3)'; g.fillRect(pp.x + 6, pp.y - 3, 20, 4);
        g.drawImage(Art.sprite(def.look, dir, fr), pp.x, pp.y - 44 + bob, 32, 44);
        if (pp.juggle) {
          const by = pp.y - 10 - Math.abs(Math.sin(s.t * 3 * Math.PI / 2)) * 26;
          g.drawImage(Art.ballFrames[Math.floor(s.t * 8) & 3], pp.x + 14, Math.round(by), 10, 10);
        }
        if (pp.id === 'ponta') { // takoyaki boat
          g.fillStyle = OUT; g.fillRect(pp.x + 20, pp.y - 22, 12, 6); g.fillStyle = '#e8d6ae'; g.fillRect(pp.x + 21, pp.y - 21, 10, 4);
          g.fillStyle = '#d48a1e'; g.fillRect(pp.x + 22, pp.y - 23, 3, 3); g.fillRect(pp.x + 27, pp.y - 23, 3, 3);
        }
        if (s.hover === pp) {
          const nm = NAMES[pp.id];
          text(g, nm, pp.x + 16, pp.y - 56, { size: 8, align: 'center', color: '#ffffff', outline: OUT });
        }
      }
      // nagisa standing by the board
      g.drawImage(Art.sprite(benchLook('nagisa'), 'down', Math.floor(s.t * 1.5) % 4 === 0 ? 'cheer' : 'walk1'), 232, 150, 32, 44);
      if (s.hover && s.hover.r) {
        const r = s.hover.r;
        g.strokeStyle = '#ffd24a'; g.lineWidth = 1;
        g.setLineDash([2, 2]); g.lineDashOffset = -Game.time * 8; g.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h); g.setLineDash([]);
      }
      // right panel
      g.fillStyle = '#1c2340'; g.fillRect(300, 0, 180, H);
      g.fillStyle = '#28325a'; for (let y = 0; y < H; y += 4) g.fillRect(300, y, 180, 1);
      g.fillStyle = OUT; g.fillRect(300, 0, 2, H);
      panel(g, 308, 6, 166, 42, 'dark');
      text(g, 'シーズン' + State.seasonNo + '　第' + (State.season.week + 1) + '節', 316, 11, { size: 10, color: '#9fdcff' });
      text(g, (fx.home ? 'ホーム' : 'アウェイ') + '　' + State.budget + '万円', 316, 25, { size: 9, color: '#ffffff' });
      text(g, 'vs ' + fx.opp.name + (aceP ? '　エース：' + aceP.name : ''), 316, 37, { size: 8, color: fx.opp.light });
      s.menu.items = items();
      s.menu.draw(g);
      if (s.saved && s.t < 2.6) {
        const al = clamp((2.6 - s.t) / 0.5, 0, 1);
        g.globalAlpha = al; panel(g, 6, H - 22, 104, 16, 'dark'); Icons.ball(g, 8, H - 22); g.globalAlpha = 1;
        text(g, 'オートセーブしました', 26, H - 19, { size: 8, color: '#9fdcff', alpha: al });
      }
      // mini team form strip
      panel(g, 308, 226, 166, 38, 'dark');
      text(g, 'チーム状態　やる気 ' + Math.round(State.avgMorale()), 316, 230, { size: 8, color: '#9fdcff' });
      const avg = (k) => Math.round(State.roster.reduce((a, p) => a + p.stats[k], 0) / State.roster.length);
      STAT_KEYS.forEach((k, i) => {
        const x = 316 + i * 31;
        text(g, STAT_NAMES[k].slice(0, 2), x, 242, { size: 8, color: '#c9d6e6' });
        const gr = grade(avg(k));
        text(g, gr, x + 20, 241, { size: 10, color: GRADE_COL[gr], outline: OUT });
      });
      if (!s.talk && Input.mouse.active && s.hover) {
        const lbl = s.hover.r ? 'しらべる' : 'はなす';
        const mx = clamp(Input.mouse.x + 8, 0, 250), my = clamp(Input.mouse.y + 8, 0, 250);
        panel(g, mx, my, 42, 14, 'gold');
        text(g, lbl, mx + 21, my + 2, { size: 8, align: 'center', color: '#2a1a24' });
      }
      if (!s.talk && s.t < 6 && !first) {}
      if (s.talk) drawTalkBox(g, s.talk, s.t);
      else {
        panel(g, 6, 244, 288, 20, 'dark');
        text(g, 'クリックで選手と話せるよ ／ 右のメニューで準備', 150, 249, { size: 8, align: 'center', color: '#c9d6e6' });
      }
    };
    return s;
  }
  function drawTalkBox(g, tk, t) {
    const L = tk.lines[tk.i];
    const txt = L[2].replace('{form}', Data.FORMATIONS[State.formation].short);
    panel(g, 6, 196, 468, 68, 'paper');
    g.fillStyle = '#e8d6ae'; g.fillRect(10, 200, 60, 60);
    drawPortrait(g, L[0], L[1], 12, 202, 1.1667);
    panel(g, 76, 188, 70, 16, 'sky');
    text(g, NAMES[L[0]], 111, 191, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f' });
    const lines = wrap(g, txt.slice(0, Math.floor(tk.n)), 380, 11);
    lines.forEach((l, i) => text(g, l, 80, 210 + i * 15, { size: 11, color: '#2a1a24' }));
    if (tk.n >= txt.length) text(g, '▼', 462, 250 + Math.round(Math.abs(Math.sin(t * 5)) * 2), { size: 8, color: '#e0474c' });
  }

  // ---------------- ROSTER ----------------
  function Roster() {
    const s = { t: 0, sel: 0, anim: 0 };
    const list = () => State.roster;
    const backRect = () => ({ x: 400, y: 6, w: 74, h: 20 });
    s.enter = () => { Sound.bgm('hub'); s.anim = 0; Game.tweens.to(s, { anim: 1 }, 0.5, Ease.outCubic); };
    const setSel = (i) => { if (i !== s.sel) { s.sel = i; Sound.play('cursor'); s.anim = 0; Game.tweens.to(s, { anim: 1 }, 0.4, Ease.outCubic); } };
    s.update = (dt) => {
      s.t += dt;
      const L = list();
      if (Input.hit('up')) setSel((s.sel + L.length - 1) % L.length);
      if (Input.hit('down')) setSel((s.sel + 1) % L.length);
      L.forEach((p, i) => { const r = { x: 8, y: 32 + i * 14, w: 120, h: 13 }; if (E.hoverIn(r) && Input.mouse.moved) setSel(i); if (E.clickedIn(r)) setSel(i); });
      if (Input.hit('back') || E.clickedIn(backRect())) { Sound.play('cancel'); Game.goto(Hub(), 'stripe'); }
      if (State.auto && s.t > 1.5) Game.goto(Hub(), 'stripe');
    };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 6, 4, 140, 24, 'dark');
      text(g, '選手名鑑', 16, 9, { size: 14, color: '#ffd24a' });
      const L = list();
      L.forEach((p, i) => {
        const y = 32 + i * 14, sel = s.sel === i, ox = sel ? 4 : 0;
        panel(g, 8 + ox, y, 124, 13, sel ? 'gold' : State.lineup.includes(p.id) ? 'paper' : ['#2a1a24', '#d9cfbb', '#b9ad98', '#ece4d4']);
        text(g, p.pos, 12 + ox, y + 2, { size: 8, color: '#2f86c4' });
        text(g, p.name + (State.joined.includes(p.id) ? ' NEW' : ''), 30 + ox, y + 1, { size: 9, color: State.joined.includes(p.id) ? '#e0474c' : '#2a1a24' });
        const mo = State.morale[p.id] ?? 60;
        g.fillStyle = mo >= 60 ? '#6cc35a' : mo >= 40 ? '#ffd24a' : '#e0474c'; g.fillRect(122 + ox, y + 4, 5, 5);
        if (!State.lineup.includes(p.id)) text(g, '控', 116 + ox, y + 2, { size: 8, align: 'right', color: '#9a8e7a' });
      });
      // detail
      const p = L[s.sel];
      const k = s.anim;
      const dx = Math.round((1 - k) * 30);
      g.globalAlpha = k;
      panel(g, 138 + dx, 8, 334, 256, 'paper');
      g.fillStyle = p.id === 'tetsuyama' || p.id === 'yukimaru' ? '#ffd8d8' : '#cfeeff'; g.fillRect(146 + dx, 16, 100, 100);
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 100; i += 10) g.fillRect(146 + dx + i, 16, 5, 100);
      drawPortrait(g, p.id, s.t % 6 < 0.15 ? 'happy' : 'normal', 148 + dx, 16, 2);
      panel(g, 146 + dx, 118, 100, 18, 'sky');
      text(g, p.pos, 196 + dx, 122, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f' });
      if (p.nick) text(g, '「' + p.nick + '」', 254 + dx, 12, { size: 9, color: '#e0474c' });
      text(g, p.full || p.name, 254 + dx, 22, { size: 16, color: '#2a1a24' });
      text(g, (p.age ? p.age + '歳　' : '') + (p.job || '') + '　' + (p.local ? '地元' : 'よそ者') + '　やる気' + (State.morale[p.id] ?? 60) + '　給料' + (p.sal || 0) + '万', 256 + dx, 42, { size: 9, color: '#6d4f3a' });
      const bio = wrap(g, p.bio || '', 204, 9);
      bio.forEach((l, i) => text(g, l, 256 + dx, 56 + i * 13, { size: 9, color: '#2a1a24' }));
      // trait
      panel(g, 254 + dx, 100, 210, 36, 'gold');
      text(g, '特性：' + (p.trait || '―'), 262 + dx, 104, { size: 10, color: '#4a2a10' });
      text(g, p.traitDesc || '', 262 + dx, 120, { size: 8, color: '#6d4f3a' });
      // tactic understanding
      if (p.tacU) Object.keys(Data.TACTICS).forEach((k, i) => {
        const x = 254 + dx + i * 54, T = Data.TACTICS[k];
        text(g, T.short, x, 139, { size: 8, color: '#6d4f3a' });
        g.fillStyle = '#3a3050'; g.fillRect(x + 28, 142, 22, 3); g.fillStyle = T.color; g.fillRect(x + 28, 142, Math.round(22 * p.tacU[k] / 100), 3);
      });
      // stats
      STAT_KEYS.forEach((key, i) => {
        const y = 152 + i * 21;
        const v = p.stats[key];
        const b = p.base ? p.base[key] : v;
        text(g, STAT_NAMES[key], 150 + dx, y, { size: 10, color: '#2a1a24' });
        drawGrade(g, 234 + dx, y - 1, v);
        statBar(g, 254 + dx, y + 2, 170, v * Math.min(1, k * 1.3 + 0.1), STAT_COLORS[key]);
        text(g, String(v), 456 + dx, y, { size: 10, align: 'right', color: '#2a1a24' });
        if (v > b) text(g, '+' + (v - b), 466 + dx, y + 1, { size: 8, color: '#e0474c' });
      });
      g.globalAlpha = 1;
      // drawn last so it stays on top of (and clickable over) the detail panel
      const back = backRect();
      panel(g, back.x, back.y, back.w, back.h, E.hoverIn(back) ? 'gold' : 'dark');
      text(g, 'X：もどる', back.x + back.w / 2, back.y + 5, { size: 8, align: 'center', color: E.hoverIn(back) ? '#2a1a24' : '#c9d6e6' });
    };
    return s;
  }

  // ---------------- TRAINING ----------------
  const TRAININGS = [
    { id: 'shoot', label: 'シュート練習', sub: 'シュート↑ パス↑少し', desc: 'ゲンさんを相手にPK特訓。前線の選手がよく伸びる。', gains: { sht: 3, pas: 1 }, focus: ['leo', 'haruki', 'ponta'] },
    { id: 'pass', label: '鳥かごパス回し', sub: 'パス↑ ディフェンス↑少し', desc: '輪になってパスを回す。中盤と守備がよく伸びる。', gains: { pas: 3, def: 1 }, focus: ['kazuha', 'morio', 'ponta'] },
    { id: 'run', label: '砂浜ダッシュ', sub: 'スピード↑ スタミナ↑', desc: '夕暮れの砂浜を走り込む。全員の足腰がきたえられる。', gains: { spd: 2, sta: 2 }, focus: ['tsubame', 'haruki', 'gen'] },
    { id: 'tactics', label: '戦術練習', sub: '採用中の戦術の理解度↑', desc: '作戦ボードで選んだ戦術を、紅白戦で体に覚えさせる。能力は上がらないが、戦術の実現度が上がる。', gains: {}, focus: [] },
    { id: 'setplay', label: 'セットプレー練習', sub: '', desc: 'コーナーキックとフリーキックのサインプレーを練習する。成功すると新しいサインを覚え、試合で選べるようになる。', gains: {}, focus: [] },
  ];
  function setplaySub() {
    const nx = State.nextSetplay();
    return nx ? '新サイン「' + State.setplayName(nx) + '」を習得' : 'セットプレーの精度↑（Lv' + State.setplay.lv + '）';
  }
  function Training() {
    const s = { t: 0, phase: 'pick', menu: null, tries: [], meter: null, fx: new Particles(), results: [], rt: 0, pick: null, reveal: 0, statAnim: 0 };
    s.enter = () => {
      Sound.bgm('hub');
      s.menu = new Menu(TRAININGS.map((tr) => ({ id: tr.id, label: tr.label, sub: tr.id === 'tactics' ? '「' + Data.TACTICS[State.tactic].name + '」の理解度↑' : tr.id === 'setplay' ? setplaySub() : tr.sub, tr })), 250, 54, 214, 30, 3);
    };
    const startMeter = () => { s.meter = { pos: 0, dir: 1, speed: 1.5 + s.tries.length * 0.35, t: 0, res: null, rt: 0, aim: clamp(0.5 + rand(-0.15, 0.15), 0, 1) }; };
    s.update = (dt) => {
      s.t += dt; s.fx.update(dt);
      if (s.phase === 'pick') {
        if (Input.hit('back') || E.clickedIn({ x: 8, y: 232, w: 90, h: 16 })) { Sound.play('cancel'); Game.goto(Hub(), 'stripe'); return; }
        if (State.auto) { s.menu.sel = [4, 0, 4, 3, 1][State.season.week % 5]; Input.pressed.ok = s.t > 1; }
        const r = s.menu.update(dt);
        if (r) { s.pick = r.tr; s.phase = 'intro'; s.rt = 0; Sound.bgm('match'); }
      } else if (s.phase === 'intro') {
        s.rt += dt;
        if (s.rt > 1.6 || (s.rt > 0.4 && okPressed())) { s.phase = 'play'; startMeter(); }
      } else if (s.phase === 'play') {
        const m = s.meter;
        m.t += dt;
        if (m.res) {
          m.rt += dt;
          if (m.rt > 1.0) { if (s.tries.length >= 3) { s.phase = 'result'; s.rt = 0; s.applyGains(); } else startMeter(); }
          return;
        }
        m.pos += m.dir * m.speed * dt;
        if (m.pos > 1) { m.pos = 2 - m.pos; m.dir = -1; } if (m.pos < 0) { m.pos = -m.pos; m.dir = 1; }
        let press = m.t > 0.3 && okPressed();
        if (State.auto && Math.abs(m.pos - m.aim) < 0.03) press = true;
        if (press) {
          const d = Math.abs(m.pos - 0.5);
          m.res = d < 0.05 ? 'just' : d < 0.17 ? 'good' : 'bad';
          s.tries.push(m.res);
          if (m.res === 'just') { Sound.play('just'); Game.doFlash(0.4); Game.addShake(3, 0.2); s.fx.burst(W / 2, 150, 24, { color: ['#ffd24a', '#ffffff', '#9fdcff'], speedMin: 60, speedMax: 160, lifeMax: 0.6, size: 3, kind: 'star', drag: 0.05 }); }
          else if (m.res === 'good') Sound.play('select');
          else Sound.play('miss_timing');
          s.kick = 0;
          if (s.pick.id === 'shoot') Sound.play(m.res === 'just' ? 'power_shot' : 'shoot');
          if (s.pick.id === 'pass') Sound.play('pass');
          if (s.pick.id === 'setplay') Sound.play('kick');
          if (s.pick.id === 'run') Sound.play('command', { pitch: 1.2 });
        }
      } else if (s.phase === 'result') {
        s.rt += dt;
        const nStats = s.results.length;
        const shown = Math.floor((s.rt - 0.4) / 0.14);
        if (shown >= 0 && shown < nStats && shown !== s.lastShown) { s.lastShown = shown; Sound.play('statup', { pitch: 1 + shown * 0.04 }); }
        if (s.rt > 1.2 && (okPressed() || (State.auto && s.rt > 3))) {
          State.trained = s.pick.id;
          Sound.play('select');
          Game.goto(Hub(), 'stripe');
        }
      }
    };
    s.applyGains = () => {
      const score = s.tries.reduce((a, r) => a + (r === 'just' ? 2 : r === 'good' ? 1 : 0), 0); // 0..6
      const mult = (score >= 5 ? 2 : score >= 2 ? 1 : 0.5) * (1 + 0.1 * Math.min(3, (State.staff || []).length));
      s.rank = score >= 5 ? '大成功！' : score >= 2 ? '成功' : 'いまいち…';
      Sound.play(score >= 5 ? 'levelup' : 'coin');
      s.results = [];
      if (s.pick.id === 'setplay') {
        const sp = State.setplay, nx = State.nextSetplay();
        sp.prog = (sp.prog || 0) + (score >= 2 ? 2 : 1);
        s.learned = null; s.lvUp = false;
        if (nx && sp.prog >= 2) { sp.unlocked.push(nx); sp.prog = 0; s.learned = nx; const [kind, id] = nx.split('_'); sp[kind] = id; }
        if ((score >= 5 || !nx) && sp.lv < 3) { sp.lv++; s.lvUp = true; }
        return;
      }
      for (const p of State.roster) {
        const ups = {};
        if (s.pick.id === 'tactics' && p.tacU) {
          const inXI = State.lineup.includes(p.id);
          const v = Math.max(1, Math.round((inXI ? 5 : 3) * mult * (p.age && p.age < 25 ? 1.2 : 1)));
          p.tacU[State.tactic] = Math.min(100, p.tacU[State.tactic] + v);
          ups.tac = v;
        }
        for (const k in s.pick.gains) {
          let v = s.pick.gains[k] * mult * (s.pick.focus.includes(p.id) ? 1.5 : 1) * (p.growth || 1) * 0.5;
          v = Math.max(1, Math.round(v + rand(-0.3, 0.3)));
          if (mult < 1 && Math.random() < 0.5) v = 0;
          if (v > 0) { p.stats[k] = Math.min(99, p.stats[k] + v); ups[k] = v; }
        }
        // focused, hands-on training gives a small extra shot at a breakthrough, on top of natural growth below
        const special = checkSpecialUnlock(p, s.pick.focus.includes(p.id) ? 0.12 : 0);
        s.results.push({ p, ups, special });
      }
    };
    s.draw = (g) => {
      const tr = s.pick;
      const dusk = tr && tr.id === 'run';
      drawBeach(g, s.t, dusk);
      if (s.phase === 'pick') {
        // idle team on the beach
        State.roster.forEach((p, i) => {
          const x = 30 + i * 30, y = 238;
          g.drawImage(Art.sprite(p.look, 'down', Math.floor(s.t * 2 + i) % 5 === 0 ? 'cheer' : 'walk1'), x, y - 44, 32, 44);
        });
        panel(g, 8, 8, 220, 50, 'dark');
        text(g, '練習メニューを選ぼう', 18, 14, { size: 12, color: '#ffd24a' });
        text(g, '結果はタイミング勝負！ 3回チャレンジ', 18, 34, { size: 9, color: '#c9d6e6' });
        s.menu.draw(g);
        const sel = TRAININGS[s.menu.sel];
        panel(g, 250, 222, 214, 44, 'paper');
        wrap(g, sel.desc, 200, 8).slice(0, 3).forEach((l, i) => text(g, l, 258, 227 + i * 12, { size: 8, color: '#2a1a24' }));
        panel(g, 8, 232, 90, 16, E.hoverIn({ x: 8, y: 232, w: 90, h: 16 }) ? 'sky' : 'dark');
        text(g, 'X：もどる', 18, 236, { size: 8, color: '#ffffff', outline: OUT });
        return;
      }
      // play scene per training
      const m = s.meter;
      const kickT = m && m.res ? m.rt : 0;
      if (tr.id === 'shoot') {
        // goal & gen
        const gx = 330, gy = 150;
        g.fillStyle = OUT; g.fillRect(gx, gy, 3, 56); g.fillRect(gx + 100, gy, 3, 56); g.fillRect(gx, gy - 2, 103, 4);
        g.fillStyle = '#ffffff'; g.fillRect(gx + 1, gy, 1, 55); g.fillRect(gx + 101, gy, 1, 55); g.fillRect(gx + 1, gy - 1, 101, 2);
        g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 10; i++) g.fillRect(gx + 3, gy + 4 + i * 5, 97, 1); for (let i = 0; i < 20; i++) g.fillRect(gx + 4 + i * 5, gy + 2, 1, 52);
        const gen = State.roster[0];
        const res = m && m.res;
        let genX = gx + 34;
        if (res && kickT > 0.2) genX += (res === 'bad' ? 0 : res === 'good' ? -30 : 40) * Ease.outQuad(clamp((kickT - 0.2) / 0.3, 0, 1));
        g.drawImage(Art.sprite(gen.look, 'down', res && kickT > 0.2 && res !== 'bad' ? 'cheer' : 'walk1'), genX, gy + 4, 32, 44);
        const shooter = State.roster.find((q) => q.id === (s.tries.length % 2 ? 'haruki' : 'leo'));
        g.drawImage(Art.sprite(shooter.look, 'side', res && kickT < 0.25 ? 'kick' : 'walk1'), 150, 180, 32, 44);
        // ball
        let bx = 184, by = 214;
        if (res) {
          const k = clamp(kickT / 0.3, 0, 1);
          const tx = res === 'bad' ? gx + 50 : res === 'good' ? gx + 14 : gx + 88, ty = res === 'bad' ? gy + 30 : gy + 16;
          bx = lerp(184, tx, k); by = lerp(214, ty, k) - Math.sin(k * Math.PI) * 20;
          if (k >= 1 && res !== 'bad' && !m.netFx) { m.netFx = true; s.fx.burst(tx, ty, 10, { color: '#ffffff', speedMin: 20, speedMax: 60, lifeMax: 0.4, size: 2, kind: 'star' }); Sound.play('net'); if (res === 'just') Sound.play('cheer', { vol: 0.4 }); }
          if (k >= 1 && res === 'bad' && !m.netFx) { m.netFx = true; Sound.play('save'); }
        }
        g.drawImage(Art.ballFrames[Math.floor(s.t * 10) & 3], Math.round(bx), Math.round(by), 10, 10);
      } else if (tr.id === 'setplay') {
        // corner drill: delivery from the flag, a runner attacks it at the far post
        const gx = 360, gy = 150;
        g.fillStyle = OUT; g.fillRect(gx, gy, 3, 56); g.fillRect(gx + 100, gy, 3, 56); g.fillRect(gx, gy - 2, 103, 4);
        g.fillStyle = '#ffffff'; g.fillRect(gx + 1, gy, 1, 55); g.fillRect(gx + 101, gy, 1, 55); g.fillRect(gx + 1, gy - 1, 101, 2);
        g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 10; i++) g.fillRect(gx + 3, gy + 4 + i * 5, 97, 1); for (let i = 0; i < 20; i++) g.fillRect(gx + 4 + i * 5, gy + 2, 1, 52);
        const res = m && m.res, k = res ? clamp(kickT / 0.5, 0, 1) : 0;
        const kicker = State.roster.find((q) => q.id === 'kazuha') || State.roster[1];
        const air = (q) => q.stats.def + (q.look.body === 'big' ? 30 : 0) + (q.id === 'mask' ? 40 : 0);
        const header = State.roster.slice().sort((a, c) => air(c) - air(a)).find((q) => q.pos !== 'GK');
        const gen = State.roster[0];
        g.drawImage(Art.sprite(gen.look, 'down', res && kickT > 0.45 && res === 'bad' ? 'cheer' : 'walk1'), gx + 40, gy + 6, 32, 44);
        g.drawImage(Art.sprite(kicker.look, 'side', res && kickT < 0.25 ? 'kick' : 'walk1'), 40, 196, 32, 44);
        const hx = lerp(250, 300, k), jump = res && res !== 'bad' ? Math.sin(clamp((kickT - 0.3) / 0.35, 0, 1) * Math.PI) * 10 : 0;
        g.drawImage(Art.sprite(header.look, 'side', jump > 1 ? 'cheer' : ['walk0', 'walk1', 'walk2', 'walk3'][Math.floor(s.t * 8) % 4]), Math.round(hx), Math.round(170 - jump), 32, 44);
        let bx = 72, by = 222;
        if (res) {
          const k1 = clamp(kickT / 0.45, 0, 1), k2 = clamp((kickT - 0.45) / 0.25, 0, 1);
          const px = res === 'bad' ? 330 : hx + 14, py = res === 'bad' ? 140 : 168 - jump;
          bx = lerp(72, px, k1); by = lerp(222, py, k1) - Math.sin(k1 * Math.PI) * 70;
          if (k1 >= 1 && res !== 'bad') { const tx = res === 'just' ? gx + 80 : gx + 30, ty = gy + 22; bx = lerp(px, tx, k2); by = lerp(py, ty, k2); if (k2 >= 1 && !m.netFx) { m.netFx = true; s.fx.burst(tx, ty, 10, { color: '#ffffff', speedMin: 20, speedMax: 60, lifeMax: 0.4, size: 2, kind: 'star' }); Sound.play('net'); if (res === 'just') Sound.play('cheer', { vol: 0.4 }); } }
          if (k1 >= 1 && res === 'bad') { bx = px + (kickT - 0.45) * 120; by = py - (kickT - 0.45) * 20; if (!m.netFx) { m.netFx = true; Sound.play('miss_timing', { vol: 0.5 }); } }
        }
        g.drawImage(Art.ballFrames[Math.floor(s.t * 10) & 3], Math.round(bx), Math.round(by), 10, 10);
      } else if (tr.id === 'pass') {
        const cx = 240, cy = 214, R = 56;
        const ring = State.roster.slice(1);
        const passer = s.tries.length % ring.length;
        ring.forEach((p, i) => {
          const a = (i / ring.length) * Math.PI * 2;
          const x = cx + Math.cos(a) * R * 1.4, y = cy + Math.sin(a) * R * 0.45;
          g.drawImage(Art.sprite(p.look, Math.cos(a) > 0.3 ? 'left' : Math.cos(a) < -0.3 ? 'side' : 'down', 'walk1'), Math.round(x - 16), Math.round(y - 40), 32, 44);
        });
        // ball travels between players
        const from = passer, to = (passer + (m && m.res === 'bad' ? 0 : 2)) % ring.length;
        const k = m && m.res ? clamp(kickT / 0.35, 0, 1) : 0;
        const a1 = (from / ring.length) * Math.PI * 2, a2 = (to / ring.length) * Math.PI * 2;
        let bx = lerp(cx + Math.cos(a1) * R * 1.4, cx + Math.cos(a2) * R * 1.4, k), by = lerp(cy + Math.sin(a1) * R * 0.45, cy + Math.sin(a2) * R * 0.45, k);
        if (m && m.res === 'bad') { bx = cx + Math.cos(a1) * R * 1.4 + kickT * 60; by = cy + Math.sin(a1) * R * 0.45 + kickT * 30; }
        g.drawImage(Art.ballFrames[Math.floor(s.t * 10) & 3], Math.round(bx - 5), Math.round(by - 6), 10, 10);
      } else {
        // run on the beach
        State.roster.forEach((p, i) => {
          const speed = 1 + (m && m.res === 'just' ? 0.6 : 0);
          const x = ((s.t * 60 * speed + i * 60) % 560) - 50, y = 206 + (i % 3) * 18;
          g.fillStyle = 'rgba(120,70,40,0.25)'; g.fillRect(Math.round(x) + 8, y + 42, 16, 3);
          g.drawImage(Art.sprite(p.look, 'side', ['walk0', 'walk1', 'walk2', 'walk3'][Math.floor(s.t * 10 + i) % 4]), Math.round(x), y, 32, 44);
          if (Math.random() < 0.1) s.fx.add({ x: x + 10, y: y + 42, vx: rand(-20, -5), vy: rand(-10, -2), life: 0.4, size: 2, color: '#d8b888' });
        });
      }
      s.fx.draw(g);
      // header
      panel(g, 8, 8, 200, 26, 'dark');
      text(g, tr.label, 18, 14, { size: 12, color: '#ffd24a' });
      for (let i = 0; i < 3; i++) {
        const r = s.tries[i];
        const x = 214 + i * 22;
        panel(g, x, 10, 20, 20, r === 'just' ? 'gold' : r === 'good' ? 'sky' : r === 'bad' ? ['#2a1a24', '#8a7e6a', '#6a5e4a', '#a89c86'] : 'dark');
        text(g, r === 'just' ? '◎' : r === 'good' ? '○' : r === 'bad' ? '×' : String(i + 1), x + 10, 14, { size: 10, align: 'center', color: r ? '#2a1a24' : '#6a7498' });
      }
      if (s.phase === 'intro') {
        const k = Ease.outBack(clamp(s.rt / 0.4, 0, 1));
        panel(g, W / 2 - 150 * k, 90, 300 * k, 60, 'paper');
        if (k > 0.9) {
          text(g, tr.label + '、はじめ！', W / 2, 98, { size: 16, align: 'center', color: '#10304f' });
          text(g, 'バーが真ん中の JUST に来たら Z / クリック！', W / 2, 124, { size: 9, align: 'center', color: '#6d4f3a' });
        }
      }
      if (s.phase === 'play' && m) {
        const bw = 200, x = W / 2 - bw / 2, y = 60;
        panel(g, x - 8, y - 14, bw + 16, 44, 'dark');
        text(g, 'Z / クリック', W / 2, y - 10, { size: 8, align: 'center', color: '#c9d6e6' });
        g.fillStyle = '#0a0e1c'; g.fillRect(x, y, bw, 14);
        g.fillStyle = '#3a4466'; g.fillRect(x + 1, y + 1, bw - 2, 12);
        g.fillStyle = '#4fb4e8'; g.fillRect(x + bw * 0.33, y + 1, bw * 0.34, 12);
        g.fillStyle = '#ffd24a'; g.fillRect(Math.round(x + bw * 0.45), y + 1, Math.round(bw * 0.1), 12);
        const cx2 = Math.round(x + m.pos * bw);
        g.fillStyle = '#ffffff'; g.fillRect(cx2 - 1, y - 3, 3, 20);
        if (m.res) {
          const lbl = { just: 'JUST!!', good: 'GOOD!', bad: 'あちゃー…' }[m.res];
          const k = Ease.outBack(clamp(m.rt / 0.25, 0, 1));
          text(g, lbl, W / 2, y + 18 + (1 - k) * 8, { size: m.res === 'just' ? 16 : 12, align: 'center', color: m.res === 'just' ? '#ffd24a' : m.res === 'good' ? '#9fdcff' : '#c9d6e6', outline: '#10182e' });
        }
      }
      if (s.phase === 'result') {
        g.globalAlpha = 0.7; g.fillStyle = '#0a0e1c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        panel(g, 40, 18, 400, 234, 'paper');
        text(g, tr.label + '　' + s.rank, W / 2, 26, { size: 16, align: 'center', color: s.rank === '大成功！' ? '#e0474c' : '#10304f' });
        if (tr.id === 'setplay') {
          const vis = s.rt > 0.5;
          if (vis && s.learned) {
            const [kind, id] = s.learned.split('_'), r = Data.SETPLAYS[kind].find((q) => q.id === id);
            const k = Ease.outBack(clamp((s.rt - 0.5) / 0.4, 0, 1));
            panel(g, W / 2 - 150 * k, 62, 300 * k, 86, 'gold');
            if (k > 0.9) {
              text(g, '新しいサインを覚えた！', W / 2, 70, { size: 10, align: 'center', color: '#6d4f3a' });
              text(g, (kind === 'ck' ? 'コーナーキック：' : 'フリーキック：') + r.name, W / 2, 86, { size: 14, align: 'center', color: '#2a1a24' });
              wrap(g, r.desc, 270, 9).forEach((l, i) => text(g, l, W / 2, 108 + i * 13, { size: 9, align: 'center', color: '#2a1a24' }));
            }
          } else if (vis) {
            panel(g, W / 2 - 150, 62, 300, 60, 'sky');
            text(g, State.nextSetplay() ? 'あと少しで「' + State.setplayName(State.nextSetplay()) + '」を覚えそう！' : 'サインプレーは全部覚えた！', W / 2, 78, { size: 10, align: 'center', color: '#10182e' });
            text(g, '次の練習で習得できる', W / 2, 96, { size: 9, align: 'center', color: '#1f5a94' });
          }
          if (vis && s.lvUp) text(g, 'セットプレーの精度が上がった！（Lv' + State.setplay.lv + '）', W / 2, 160, { size: 10, align: 'center', color: '#e0474c' });
          if (vis) text(g, '試合でコーナー／フリーキックのときにサインを選べます。作戦ボードで最初のサインも決められます。', W / 2, 184, { size: 8, align: 'center', color: '#6d4f3a' });
        }
        s.results.forEach((r, i) => {
          const col = i < 7 ? 0 : 1, y = 52 + (i % 7) * 25, x0 = 50 + col * 196;
          const vis = s.rt - 0.4 > i * 0.14;
          if (!vis) return;
          g.drawImage(Art.sprite(r.p.look, 'down', 'walk1'), x0, y);
          text(g, r.p.name, x0 + 20, y + 2, { size: 9, color: '#2a1a24' });
          const keys = Object.keys(r.ups);
          const line = keys.length ? keys.map((k) => (k === 'tac' ? '理解' : STAT_NAMES[k].slice(0, 3)) + '+' + r.ups[k]).join(' ') : '（身につかず）';
          text(g, line, x0 + 20, y + 12, { size: 8, color: keys.length ? '#2f86c4' : '#9a8e7a' });
          if (r.special) text(g, '必殺技「' + Data.SPECIALS[r.p.id].name + '」を習得！', x0, y + 21, { size: 8, color: '#e0474c' });
        });
        if (s.rt > 1.2) text(g, 'Z / クリック：クラブハウスへ', W / 2, 236, { size: 9, align: 'center', color: '#6d4f3a', alpha: blink() });
      }
    };
    return s;
  }

  // ---------------- TACTICS (formation + lineup + combos) ----------------
  function teamRealize(tac) {
    const ps = State.lineup.map((id) => State.roster.find((p) => p.id === id));
    return Math.round(ps.reduce((a, p) => a + ((p.tacU && p.tacU[tac]) || 50), 0) / ps.length);
  }
  function activeCombos(ids) { return Data.COMBOS.filter((c) => c.ids.every((id) => ids.includes(id))); }
  // stat-based (not trained) fit: how well the squad's raw abilities suit a tactic or formation, regardless of experience
  function roleFit(p, role) {
    const st = p.stats;
    return role === 'DF' ? st.def * 1.3 + st.spd * 0.6 + st.pas * 0.3
      : role === 'MF' ? st.pas * 1.1 + st.spd * 0.6 + st.def * 0.5 + st.sht * 0.3
      : st.sht * 1.3 + st.spd * 0.7 + st.pas * 0.3;
  }
  function formationFit(key) {
    const F = Data.FORMATIONS[key];
    const ps = State.lineup.slice(1).map((id) => State.roster.find((p) => p.id === id)).filter(Boolean);
    if (!ps.length) return 0;
    const avg = ps.reduce((a, p, i) => a + roleFit(p, F.roles[i] || 'MF'), 0) / ps.length;
    return Math.round(clamp(avg / 1.3, 0, 100));
  }
  function tacScore(tac, p) {
    const st = p.stats;
    if (tac === 'counter') return st.spd * 0.5 + st.def * 0.3 + st.sta * 0.2;
    if (tac === 'press') return st.spd * 0.4 + st.def * 0.4 + st.sta * 0.2;
    if (tac === 'long') return st.sht * 0.5 + st.def * 0.3 + st.spd * 0.2;
    return st.pas * 0.6 + st.spd * 0.2 + st.sta * 0.2; // possession
  }
  function tacticFit(tac) {
    const ps = State.lineup.map((id) => State.roster.find((p) => p.id === id)).filter(Boolean);
    if (!ps.length) return 0;
    return Math.round(clamp(ps.reduce((a, p) => a + tacScore(tac, p), 0) / ps.length, 0, 100));
  }
  function tacticBestPlayers(tac, n) {
    return State.lineup.map((id) => State.roster.find((p) => p.id === id)).filter(Boolean)
      .sort((a, c) => tacScore(tac, c) - tacScore(tac, a)).slice(0, n);
  }
  function Tactics() {
    const s = { t: 0, keys: Object.keys(Data.FORMATIONS), pos: null, pick: null, cursor: 0, hover: null, flash: {} };
    const BX = 10, BY = 34, BW = 280, BH = 196;
    const byId = (id) => State.roster.find((p) => p.id === id);
    const bench = () => State.roster.filter((p) => !State.lineup.includes(p.id));
    s.enter = () => { Sound.bgm('hub'); s.pos = Data.FORMATIONS[State.formation].slots.map((a) => a.slice()); s.startLineup = State.lineup.slice(); };
    const boardXY = (i) => {
      if (i === 0) return [BX + 4 + 0.04 * (BW - 8), BY + 4 + 0.5 * (BH - 8)];
      const [nx, ny] = s.pos[i - 1];
      return [BX + 4 + nx * (BW - 8), BY + 4 + ny * (BH - 8)];
    };
    const benchRect = (i) => ({ x: 298, y: 92 + i * 19, w: 174, h: 18 });
    const autoRect = () => ({ x: 344, y: 77, w: 62, h: 12 });
    const revertRect = () => ({ x: 410, y: 77, w: 64, h: 12 });
    const tacRect = (i) => ({ x: 298 + i * 44, y: 58, w: 42, h: 16 });
    const formRect = (i) => ({ x: 298 + i * 59, y: 34, w: 56, h: 20 });
    // default set-play signals (cycle through the ones learned in training)
    const spRect = (i) => ({ x: 162 + i * 117, y: 6, w: 114, h: 22 });
    const SPK = ['ck', 'fk'];
    const spOpts = (kind) => Data.SETPLAYS[kind].filter((r) => r.id === 'std' || State.setplay.unlocked.includes(kind + '_' + r.id));
    // selectable targets: 0..10 = lineup slots, 11.. = bench
    const targets = () => State.lineup.map((id, i) => ({ kind: 'slot', i, id })).concat(bench().map((p, i) => ({ kind: 'bench', i, id: p.id })));
    const targetRect = (tg) => {
      if (tg.kind === 'bench') return benchRect(tg.i);
      const [x, y] = boardXY(tg.i);
      return { x: x - 15, y: y - 14, w: 30, h: 32 };
    };
    const swap = (a, b) => {
      const pa = byId(a.id), pb = byId(b.id);
      if (a.kind === 'bench' && b.kind === 'bench') return false;
      if ((pa.pos === 'GK') !== (pb.pos === 'GK') && (a.kind === 'slot' && a.i === 0 || b.kind === 'slot' && b.i === 0 || pa.pos === 'GK' || pb.pos === 'GK')) {
        s.msg = { text: 'GKはGK同士でしか入れ替えられません', t: 0 }; Sound.play('cancel'); return false;
      }
      const before0 = activeCombos(State.lineup).map((c) => c.id);
      if (a.kind === 'slot' && b.kind === 'slot') { const tmp = State.lineup[a.i]; State.lineup[a.i] = State.lineup[b.i]; State.lineup[b.i] = tmp; }
      else { const slot = a.kind === 'slot' ? a : b, bn = a.kind === 'slot' ? b : a; State.lineup[slot.i] = bn.id; }
      Sound.play('stamp', { vol: 0.6 }); Game.addShake(1.5, 0.12);
      const after0 = activeCombos(State.lineup);
      const born0 = after0.filter((c) => !before0.includes(c.id));
      if (born0.length) { s.newCombo = { c: born0[0], t: 0 }; Sound.play('levelup', { vol: 0.5 }); }
      return true;
    };
    // pick a reasonable starting XI automatically, by role fit + current form
    const autoFill = () => {
      const before = activeCombos(State.lineup).map((c) => c.id);
      const roles = Data.FORMATIONS[State.formation].roles;
      const fit = (p, role) => {
        const st = p.stats;
        const base = role === 'DF' ? st.def * 1.3 + st.spd * 0.6 + st.pas * 0.3
          : role === 'MF' ? st.pas * 1.1 + st.spd * 0.6 + st.def * 0.5 + st.sht * 0.3
          : st.sht * 1.3 + st.spd * 0.7 + st.pas * 0.3;
        return base + (State.morale[p.id] ?? 60) * 0.15;
      };
      const used = new Set();
      const gk = State.roster.filter((p) => p.pos === 'GK').sort((a, c) => (c.stats.def + c.stats.sta) - (a.stats.def + a.stats.sta))[0];
      const lineup = [gk ? gk.id : State.lineup[0]];
      if (gk) used.add(gk.id);
      for (const role of roles) {
        const pool = State.roster.filter((p) => !used.has(p.id) && p.pos !== 'GK');
        const same = pool.filter((p) => p.pos === role).sort((a, c) => fit(c, role) - fit(a, role));
        const next = same[0] || pool.sort((a, c) => fit(c, role) - fit(a, role))[0];
        if (next) { used.add(next.id); lineup.push(next.id); }
      }
      State.lineup = lineup;
      Sound.play('stamp', { vol: 0.6 }); Game.addShake(1.5, 0.12);
      const after = activeCombos(State.lineup);
      const born = after.filter((c) => !before.includes(c.id));
      if (born.length) { s.newCombo = { c: born[0], t: 0 }; Sound.play('levelup', { vol: 0.5 }); }
      s.msg = { text: 'おまかせでスタメンを組みました', t: 0 };
    };
    const revertLineup = () => {
      State.lineup = s.startLineup.slice();
      Sound.play('cancel');
      s.msg = { text: 'この画面を開く前の並びに戻しました', t: 0 };
    };
    const click = (tg) => {
      if (!s.pick) { s.pick = tg; Sound.play('select'); return; }
      if (s.pick.kind === tg.kind && s.pick.i === tg.i) { s.pick = null; Sound.play('cancel'); return; }
      swap(s.pick, tg); s.pick = null;
    };
    s.update = (dt) => {
      s.t += dt;
      if (s.msg) { s.msg.t += dt; if (s.msg.t > 2) s.msg = null; }
      if (s.newCombo) { s.newCombo.t += dt; if (s.newCombo.t > 2.6) s.newCombo = null; }
      const tgs = targets();
      const tgt = Data.FORMATIONS[State.formation].slots;
      s.pos.forEach((p, i) => { p[0] = lerp(p[0], tgt[i][0], clamp(dt * 10, 0, 1)); p[1] = lerp(p[1], tgt[i][1], clamp(dt * 10, 0, 1)); });
      // formation tabs
      s.keys.forEach((k, i) => { if (E.clickedIn(formRect(i)) && State.formation !== k) { State.formation = k; Sound.play('select'); } });
      Object.keys(Data.TACTICS).forEach((k, i) => { if (E.clickedIn(tacRect(i)) && State.tactic !== k) { State.tactic = k; Sound.play('stamp', { vol: 0.5 }); } });
      if (E.clickedIn(autoRect())) autoFill();
      if (E.clickedIn(revertRect())) revertLineup();
      SPK.forEach((kind, i) => {
        if (!E.clickedIn(spRect(i))) return;
        const os = spOpts(kind);
        if (os.length < 2) { s.msg = { text: 'セットプレー練習で新しいサインを覚えると選べるようになります', t: 0 }; Sound.play('cancel'); return; }
        const j = os.findIndex((r) => r.id === State.setplay[kind]);
        State.setplay[kind] = os[(j + 1) % os.length].id; Sound.play('select');
      });
      // mouse
      s.hover = null;
      tgs.forEach((tg) => { if (E.hoverIn(targetRect(tg))) s.hover = tg; });
      if (s.hover && Input.mouse.clicked) click(s.hover);
      // keyboard
      if (Input.hit('down') || Input.hit('right')) { s.cursor = (s.cursor + 1) % tgs.length; Sound.play('cursor'); s.kb = true; }
      if (Input.hit('up') || Input.hit('left')) { s.cursor = (s.cursor + tgs.length - 1) % tgs.length; Sound.play('cursor'); s.kb = true; }
      if (Input.mouse.moved) s.kb = false;
      if (Input.hit('ok')) click(tgs[s.cursor]);
      if (Input.hit('c1') || Input.hit('c2') || Input.hit('c3')) { const i = Input.hit('c1') ? 0 : Input.hit('c2') ? 1 : 2; State.formation = s.keys[i]; Sound.play('select'); }
      const done = { x: 398, y: 6, w: 76, h: 20 };
      if (Input.hit('back') || E.clickedIn(done)) {
        if (s.pick && Input.hit('back')) { s.pick = null; Sound.play('cancel'); return; }
        Sound.play('select'); Game.goto(Hub(), 'stripe');
      }
      if (State.auto && s.t > 1) Game.goto(Hub(), 'stripe');
    };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 6, 4, 150, 24, 'dark');
      text(g, '作戦ボード', 16, 9, { size: 14, color: '#ffd24a' });
      SPK.forEach((kind, i) => {
        const r = spRect(i), os = spOpts(kind), hv = E.hoverIn(r);
        const cur = Data.SETPLAYS[kind].find((q) => q.id === State.setplay[kind]) || Data.SETPLAYS[kind][0];
        panel(g, r.x, r.y, r.w, r.h, hv ? 'sky' : 'paper');
        text(g, (kind === 'ck' ? 'CK' : 'FK') + ' ' + os.length + '/4', r.x + 5, r.y + 2, { size: 7, color: '#6d4f3a' });
        text(g, cur.name, r.x + 5, r.y + 11, { size: 8, color: '#2a1a24' });
        if (os.length > 1) text(g, '▶', r.x + r.w - 9, r.y + 7, { size: 8, color: '#2f86c4' });
        if (hv) s.spHover = { kind, cur, n: os.length };
      });
      // board
      panel(g, BX - 4, BY - 4, BW + 8, BH + 8, ['#2a1a24', '#8a5a3a', '#6a4028', '#a86a44']);
      g.fillStyle = '#4fa84a'; g.fillRect(BX, BY, BW, BH);
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#469a42' : '#5bb655'; g.fillRect(BX + i * 35, BY, 35, BH); }
      g.fillStyle = '#ffffff';
      g.fillRect(BX + 4, BY + 4, BW - 8, 1); g.fillRect(BX + 4, BY + BH - 5, BW - 8, 1); g.fillRect(BX + 4, BY + 4, 1, BH - 8); g.fillRect(BX + BW - 5, BY + 4, 1, BH - 8); g.fillRect(BX + BW / 2, BY + 4, 1, BH - 8);
      g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.arc(BX + BW / 2 + 0.5, BY + BH / 2, 20, 0, Math.PI * 2); g.stroke();
      g.strokeRect(BX + 4.5, BY + BH / 2 - 44, 36, 88); g.strokeRect(BX + BW - 40.5, BY + BH / 2 - 44, 36, 88);
      // combo links on the board
      const combos = activeCombos(State.lineup);
      combos.forEach((c) => {
        const [a, b] = c.ids.map((id) => State.lineup.indexOf(id));
        const [ax, ay] = boardXY(a), [bx, by] = boardXY(b);
        g.strokeStyle = !State.comboReady(c) ? '#8a94b8' : c.kind === 'bad' ? '#ff6a6a' : c.kind === 'mixed' ? '#d8a8f0' : '#ffd24a';
        g.setLineDash([3, 2]); g.lineDashOffset = -s.t * 10; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ax, ay - 4); g.lineTo(bx, by - 4); g.stroke(); g.setLineDash([]); g.lineWidth = 1;
      });
      const tgs = targets();
      State.lineup.forEach((id, i) => {
        const p = byId(id), [x, y] = boardXY(i);
        const tg = tgs[i];
        const hl = (s.pick && s.pick.kind === 'slot' && s.pick.i === i), hv = (s.hover === tg) || (s.kb && s.cursor === i);
        if (hl || hv) { g.fillStyle = hl ? 'rgba(255,210,74,0.6)' : 'rgba(255,255,255,0.35)'; g.fillRect(Math.round(x) - 10, Math.round(y) - 10, 20, 24); }
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.round(x) - 6, Math.round(y) + 10, 12, 3);
        g.drawImage(Art.sprite(p.look, 'side', hl ? 'cheer' : 'walk1'), Math.round(x) - 8, Math.round(y) - 10 - (hl ? Math.round(Math.abs(Math.sin(s.t * 8)) * 2) : 0));
        text(g, p.name, Math.round(x), Math.round(y) + 12, { size: 8, align: 'center', color: '#ffffff', outline: OUT });
      });
      text(g, '攻める方向 ▶', BX + BW - 4, BY + BH + 6, { size: 8, align: 'right', color: '#9fdcff' });
      // formation tabs
      s.keys.forEach((k, i) => {
        const r = formRect(i), f = Data.FORMATIONS[k], cur = State.formation === k;
        const hv = E.hoverIn(r);
        panel(g, r.x, r.y, r.w, r.h, cur ? 'gold' : hv ? 'sky' : 'paper');
        text(g, f.name.split(' ')[1], r.x + r.w / 2, r.y + 1, { size: 8, align: 'center', color: '#2a1a24' });
        text(g, f.short, r.x + r.w / 2, r.y + 10, { size: 8, align: 'center', color: '#6d4f3a' });
        const ff = formationFit(k);
        g.fillStyle = '#3a3050'; g.fillRect(r.x + 6, r.y + r.h - 4, r.w - 12, 2);
        g.fillStyle = ff >= 70 ? '#6cc35a' : ff >= 45 ? '#ffd24a' : '#e0474c';
        g.fillRect(r.x + 6, r.y + r.h - 4, Math.round((r.w - 12) * ff / 100), 2);
        if (hv) s.formHover = k;
      });
      // team tactic
      Object.keys(Data.TACTICS).forEach((k, i) => {
        const r = tacRect(i), T = Data.TACTICS[k], cur = State.tactic === k, hv = E.hoverIn(r);
        panel(g, r.x, r.y, r.w, r.h, cur ? 'gold' : hv ? 'sky' : 'paper');
        g.fillStyle = T.color; g.fillRect(r.x + 3, r.y + 4, 3, 8);
        text(g, T.short, r.x + 24, r.y + 3, { size: 8, align: 'center', color: '#2a1a24' });
        g.fillStyle = '#3a3050'; g.fillRect(r.x + 8, r.y + 12, r.w - 12, 2); g.fillStyle = T.color; g.fillRect(r.x + 8, r.y + 12, Math.round((r.w - 12) * teamRealize(k) / 100), 2);
        const pot = tacticFit(k), px = r.x + 8 + Math.round((r.w - 12) * pot / 100);
        g.fillStyle = '#ffffff'; g.fillRect(clamp(px, r.x + 8, r.x + r.w - 5), r.y + 11, 1, 4);
        if (hv) s.tacHover = k;
      });
      // bench
      text(g, 'ベンチ', 300, 79, { size: 9, color: '#9fdcff' });
      { const ar = autoRect(), rr = revertRect();
        panel(g, ar.x, ar.y, ar.w, ar.h, E.hoverIn(ar) ? 'gold' : 'sky');
        text(g, 'おまかせ', ar.x + ar.w / 2, ar.y + 2, { size: 7, align: 'center', color: '#10182e' });
        panel(g, rr.x, rr.y, rr.w, rr.h, E.hoverIn(rr) ? 'gold' : 'dark');
        text(g, '元に戻す', rr.x + rr.w / 2, rr.y + 2, { size: 7, align: 'center', color: '#ffffff' });
      }
      bench().forEach((p, i) => {
        const r = benchRect(i), tg = tgs[11 + i];
        const hl = s.pick && s.pick.kind === 'bench' && s.pick.i === i, hv = s.hover === tg || (s.kb && s.cursor === 11 + i);
        panel(g, r.x + (hl ? 4 : 0), r.y, r.w, r.h, hl ? 'gold' : hv ? 'sky' : 'paper');
        g.drawImage(Art.sprite(p.look, 'down', 'walk1'), r.x + 3 + (hl ? 4 : 0), r.y - 3);
        text(g, p.name + '　' + p.pos + '　「' + p.nick + '」', r.x + 22 + (hl ? 4 : 0), r.y + 3, { size: 8, color: '#2a1a24' });
      });
      // combos
      const cy0 = 92 + bench().length * 19 + 4;
      text(g, 'コンビ（' + combos.length + '）', 300, cy0, { size: 9, color: '#ffd24a' });
      combos.slice(0, 8).forEach((c, i) => {
        const x = 300 + (i % 2) * 88, y = cy0 + 12 + Math.floor(i / 2) * 11;
        g.fillStyle = c.kind === 'bad' ? '#ff6a6a' : c.kind === 'mixed' ? '#d8a8f0' : '#ffd24a'; g.fillRect(x, y + 3, 4, 4);
        text(g, c.name + (State.comboReady(c) ? '' : '（絆不足）'), x + 7, y, { size: 8, color: State.comboReady(c) ? '#ffffff' : '#8a94b8' });
      });
      const done = { x: 398, y: 6, w: 76, h: 20 };
      panel(g, done.x, done.y, done.w, done.h, E.hoverIn(done) ? 'gold' : 'dark');
      text(g, 'X：もどる', done.x + done.w / 2, done.y + 5, { size: 8, align: 'center', color: E.hoverIn(done) ? '#2a1a24' : '#c9d6e6' });
      // info strip
      const focus = s.hover || (s.kb ? tgs[s.cursor] : null) || s.pick;
      panel(g, 6, 236, 468, 30, 'paper');
      if (s.msg) text(g, s.msg.text, 16, 245, { size: 10, color: '#e0474c' });
      else if (focus) {
        const p = byId(focus.id);
        drawPortrait(g, p.id, 'normal', 8, 237, 0.5);
        text(g, '「' + p.nick + '」' + p.name + '　' + p.pos + '　特性：' + p.trait, 38, 239, { size: 9, color: '#2a1a24' });
        STAT_KEYS.forEach((k, i) => { const x = 330 + i * 28; text(g, STAT_NAMES[k].slice(0, 2), x, 240, { size: 7, color: '#6d4f3a' }); drawGrade(g, x + 15, 239, p.stats[k], 10); });
        const rel = Data.COMBOS.filter((c) => c.ids.includes(p.id)).map((c) => (c.kind === 'bad' ? '✕' : '♪') + byId(c.ids.find((x) => x !== p.id)).name + '「' + c.name + '」');
        text(g, rel.length ? '相性：' + rel.join('　') : p.traitDesc, 38, 252, { size: 8, color: '#6d4f3a' });
      } else if (s.tacHover) {
        const T = Data.TACTICS[s.tacHover];
        const cur = teamRealize(s.tacHover), pot = tacticFit(s.tacHover);
        const best = tacticBestPlayers(s.tacHover, 2).map((p) => p.name).join('・');
        text(g, '戦術「' + T.name + '」　理解度 ' + cur + '%（白線＝選手の潜在適性 ' + pot + '%）　' + T.desc, 16, 239, { size: 8, color: '#2a1a24' });
        text(g, (pot > cur + 10 ? 'まだ慣れていませんが、伸びしろがあります。' : pot < cur - 10 ? '経験は積んでいますが、選手の適性はやや低めです。' : '経験と適性のバランスが取れています。') + '　活かせそうな選手：' + best, 16, 252, { size: 8, color: '#6d4f3a' });
      }
      else if (s.formHover) {
        const F = Data.FORMATIONS[s.formHover], ff = formationFit(s.formHover);
        text(g, 'フォーメーション「' + F.name + '」　今の選手層との適性 ' + ff + '%　' + F.desc, 16, 239, { size: 8, color: '#2a1a24' });
        text(g, (ff >= 70 ? 'このフォーメーションは選手の特徴によく合っていそうです。' : ff >= 45 ? 'まずまず合っていますが、ハマる選手を選びたいところです。' : '今のメンバーにはやや合わないかもしれません。'), 16, 252, { size: 8, color: '#6d4f3a' });
      }
      else if (s.spHover) {
        const h = s.spHover;
        text(g, (h.kind === 'ck' ? 'コーナーキック' : 'フリーキック') + 'の最初のサイン：' + h.cur.name + '　' + h.cur.desc, 16, 239, { size: 8, color: '#2a1a24' });
        text(g, h.n > 1 ? 'クリックで切り替え。試合中もキックの前にサインを選べます。' : 'セットプレー練習で新しいサインを覚えると選べるようになります。', 16, 252, { size: 8, color: '#6d4f3a' });
      }
      else text(g, 'クリックで2人を選ぶと入れ替え。カーソルで特性と相性を確認。1〜3キーで陣形切り替え。', 16, 245, { size: 9, color: '#6d4f3a' });
      s.tacHover = null; s.spHover = null; s.formHover = null;
      if (s.newCombo) {
        const k = Ease.outBack(clamp(s.newCombo.t / 0.3, 0, 1)), c = s.newCombo.c;
        const a = 1 - clamp((s.newCombo.t - 2.2) / 0.4, 0, 1);
        g.globalAlpha = a;
        panel(g, W / 2 - 130, 100 - (1 - k) * 30, 260, 58, c.kind === 'bad' ? 'crimson' : 'gold');
        c.ids.forEach((id, i) => { const img = portrait(id, c.kind === 'bad' ? 'determined' : 'happy'); if (img) g.drawImage(img, 11, 6, 24, 24, W / 2 - 124 + i * 26, 113 - (1 - k) * 30, 24, 24); });
        text(g, c.kind === 'bad' ? 'ケンカ成立…！' : 'コンビ成立！', W / 2 - 68, 106 - (1 - k) * 30, { size: 8, color: c.kind === 'bad' ? '#ffe0e0' : '#4a2a10' });
        text(g, c.name, W / 2 - 68, 118 - (1 - k) * 30, { size: 12, color: c.kind === 'bad' ? '#ffffff' : '#2a1a24' });
        wrap(g, c.desc, 190, 8).slice(0, 2).forEach((l, j) => text(g, l, W / 2 - 68, 134 + j * 10 - (1 - k) * 30, { size: 8, color: c.kind === 'bad' ? '#ffe0e0' : '#6d4f3a' }));
        g.globalAlpha = 1;
      }
    };
    return s;
  }

  // ---------------- VERSUS ----------------
  function Versus() {
    const s = { t: 0, lines: 0 }, fx = State.fixture(), opp = fx.opp;
    s.enter = () => { Sound.play('chance'); setTimeout(() => { Sound.play('stamp'); Game.addShake(6, 0.4); Game.doFlash(0.6); }, 650); Sound.crowd(0.25); };
    s.update = (dt) => {
      s.t += dt;
      if (s.t > 2.2 && (okPressed() || (State.auto && s.t > 3))) { Sound.play('select'); Game.goto(PreMatch(), 'iris'); }
    };
    s.draw = (g) => {
      const k = Ease.outCubic(clamp(s.t / 0.6, 0, 1));
      g.fillStyle = '#10304f'; g.fillRect(0, 0, W, H);
      // split
      g.fillStyle = '#2f86c4'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.62 * k, 0); g.lineTo(W * 0.38 * k, H); g.lineTo(0, H); g.fill();
      g.fillStyle = opp.dark; g.beginPath(); g.moveTo(W, 0); g.lineTo(W - W * 0.38 * k, 0); g.lineTo(W - W * 0.62 * k, H); g.lineTo(W, H); g.fill();
      // stripes
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 20; i++) { const x = ((i * 50 + s.t * 120) % (W + 100)) - 50; g.fillRect(x, 0, 12, H); }
      const pk = Ease.outBack(clamp((s.t - 0.2) / 0.5, 0, 1));
      drawPortrait(g, 'leo', 'determined', -150 + pk * 170, 50, 3);
      drawPortrait(g, opp.captain, 'determined', W + 6 - pk * 170, 50, 3, true);
      text(g, 'ハマカゼFC', 20 + (1 - pk) * -100, 196, { size: 16, color: '#ffffff', outline: '#10304f', outlineW: 2 });
      text(g, opp.name, W - 20 + (1 - pk) * 100, 196, { size: 16, align: 'right', color: '#ffffff', outline: opp.ink, outlineW: 2 });
      if (s.t > 0.65) {
        const vk = Ease.outElastic(clamp((s.t - 0.65) / 0.8, 0, 1));
        const size = Math.round(20 + 28 * vk);
        text(g, 'VS', W / 2, H / 2 - size / 2 - 20, { size, align: 'center', color: '#ffd24a', outline: '#2a1a24', outlineW: 3 });
      }
      if (s.t > 1.1) {
        const h = (State.h2h || {})[opp.id];
        const a2 = clamp((s.t - 1.1) / 0.4, 0, 1);
        const note = h ? '通算対戦成績　' + h.w + '勝' + h.d + '分' + h.l + '敗' + (h.streak >= 2 ? '（' + h.streak + '連勝中）' : h.streak <= -2 ? '（' + -h.streak + '連敗中）' : '') : '初対決';
        text(g, note, W / 2, H / 2 + 6, { size: 9, align: 'center', color: '#ffd24a', outline: '#2a1a24', alpha: a2 });
      }
      panel(g, W / 2 - 110, 224, 220, 38, 'dark');
      text(g, leagueName() + ' S' + State.seasonNo + ' 第' + (State.season.week + 1) + '節', W / 2, 229, { size: 10, align: 'center', color: '#ffffff' });
      text(g, (fx.home ? '浜風グラウンド（ホーム）' : opp.ground + '（アウェイ）'), W / 2, 245, { size: 8, align: 'center', color: '#9fdcff' });
      if (s.t > 2.2) text(g, 'Z / クリック', W - 12, H - 14, { size: 8, align: 'right', color: '#ffffff', alpha: blink() });
    };
    return s;
  }

  const CAPTAIN_LINES = {
    yamaoroshi: [{ who: 'onigawara', expr: 'normal', side: 'right', text: 'ガッハッハ！ 港のお遊びクラブが相手とはな。鉄工団の練習にもならんわ！' }, { who: 'tetsuyama', expr: 'determined', side: 'right', text: '監督、油断は禁物です。…だが、手加減はしない。' }],
    shiomi: [{ who: 'kaoru', expr: 'happy', side: 'right', text: 'あら、万年最下位さんじゃないですか。今日もうちの「品ぞろえ」、たっぷり見ていってくださいな。' }],
    chikurin: [{ who: 'tatsumi', expr: 'determined', side: 'right', text: '押忍！ 最下位のチームと聞いて、正直軽く見てました！ でも90分、前から追いかけ回しますんで！ 覚悟してください！' }],
    yukemuri: [{ who: 'oyuki', expr: 'normal', side: 'right', text: 'ようこそお越しくださいました、最下位のクラブさん。…ゴール前では、手加減いたしませんよ。' }],
    minori: [{ who: 'gonzo', expr: 'happy', side: 'right', text: 'ガハハ！ 今年も最下位のとこが相手かい。今年は豊作だべ、ボールも米俵みてぇに運んでやる！' }],
    kaiyou: [{ who: 'reon', expr: 'normal', side: 'right', text: '失礼ながら、格下だとは伺っています。海陽学園の伝統、丁寧なパスワークで崩させてもらいます。' }],
    tekkyo: [{ who: 'daigo', expr: 'determined', side: 'right', text: '毎年最下位のチームだろう？ こっちは就業後もフルパワーだ。県リーグの厳しさ、思い知れ。' }],
    shirasagi: [{ who: 'shirou', expr: 'normal', side: 'right', text: '…あなた方の噂は聞いている。負け続けているクラブだと。だが白鷺は静かに、確実に勝つ。' }],
    kurogane: [{ who: 'kurou', expr: 'normal', side: 'right', text: '最下位相手に手加減する気はない。始発から終電まで走り続ける。逃げ場はないと思ってくれ。' }],
    minatomirai: [{ who: 'kai', expr: 'happy', side: 'right', text: 'へえ、あの万年最下位が地区リーグ上がりか。……退屈させないでくれよ？' }],
  };
  function leagueName() { return State.tier === 'prefecture' ? '県リーグ' : '港湾地区リーグ'; }
  function tierLabel(t) { return t === 'prefecture' ? '県リーグ' : '地区リーグ'; }
  // rivalry/history flavor lines shown before kickoff: last season's placing, head-to-head record, table tension
  function rivalryLines(fx, reunion) {
    const opp = fx.opp;
    const L = [];
    const lr = (State.lastSeasonRanks || {})[opp.id];
    if (lr) L.push({ who: 'kazuha', expr: 'normal', text: opp.short + 'は昨シーズン、' + tierLabel(lr.tier) + lr.rank + '位でした。' });
    const h = (State.h2h || {})[opp.id];
    if (!h) {
      L.push({ who: 'nagisa', expr: 'normal', text: opp.short + 'との対戦はこれが初めてです。手の内はまだ分かりません。' });
    } else {
      const rec = h.w + '勝' + h.d + '分' + h.l + '敗';
      if (h.last.gf < h.last.ga) L.push({ who: 'leo', expr: 'determined', text: '前回は' + h.last.ga + '-' + h.last.gf + 'で負けてる相手だ。…今日はやり返す。' });
      else if (h.streak >= 2) L.push({ who: 'kazuha', expr: 'happy', text: opp.short + 'には' + h.streak + '連勝中です。この調子でいきましょう。' });
      else if (h.last.gf > h.last.ga) L.push({ who: 'nagisa', expr: 'happy', text: '前回対戦は' + h.last.gf + '-' + h.last.ga + 'で勝っています！' });
      L.push({ who: 'kazuha', expr: 'normal', text: '通算成績は' + rec + 'です。' });
    }
    const tbl = State.season.table, meRow = tbl.hamakaze, oppRow = tbl[opp.id];
    if (meRow && oppRow && meRow.p > 0 && oppRow.p > 0) {
      const diff = meRow.pts - oppRow.pts;
      if (Math.abs(diff) <= 3) L.push({ who: 'nagisa', expr: 'determined', text: '勝ち点差はわずか' + Math.abs(diff) + '。この一戦で順位が動きます。' });
    }
    if (reunion && reunion.length) L.push({ who: 'nagisa', expr: 'sad', text: '相手には、かつての仲間、' + reunion.join('・') + 'がいます。' });
    if (State.rank() === League.teamsForTier(State.tier).length) {
      L.push({ who: 'leo', expr: 'determined', text: pick(['万年最下位……上等じゃん。今日、その呼び方終わらせてやるよ。', '誰も期待してねぇみたいだけど、だからこそ気持ちいいんだよな。見返してやろうぜ。', '舐められっぱなしなのも、今日で終わりにする。']) });
    }
    return L;
  }
  function PreMatch() {
    const fx = State.fixture(), opp = fx.opp;
    const mu = Data.MATCHUP[State.tactic][opp.tactic];
    const oppData = oppRoster(opp);
    const aceP = oppData.roster.find((p) => p.id === opp.captain);
    const aceStat = aceP ? STAT_KEYS.slice().sort((a, c) => aceP.stats[c] - aceP.stats[a])[0] : null;
    const lines = CAPTAIN_LINES[opp.id].concat(rivalryLines(fx, oppData.reunion)).concat([
      { who: 'leo', expr: 'determined', text: pick(['へぇ、言ってくれるじゃん。その鼻、へし折ってやるよ。', 'ま、今日もオレが決めるから。見てなって。', '誰が相手でも関係ねぇ。勝つのはウチだ。']) },
      { who: 'kazuha', expr: 'normal', text: opp.short + 'は「' + Data.TACTICS[opp.tactic].name + '」のチームです。' + opp.blurb },
    ].concat(aceP ? [{ who: 'kazuha', expr: 'determined', text: '相手のエースは「' + aceP.nick + '」' + aceP.name + '。' + STAT_NAMES[aceStat] + 'が持ち味なので、要注意です。' }] : []).concat([
      { who: 'kazuha', expr: 'normal', text: 'うちの「' + Data.TACTICS[State.tactic].name + '」との相性は ' + mu[0] + '。' + mu[1] + '。' },
    ]));
    if (State.season.week === 0) lines.push(
      { who: 'nagisa', expr: 'normal', text: '監督、試合中は画面下のボタンか 1〜4キーで指示、5キーでベンチ指示（戦術の変更・交代）ができます！' },
      { who: 'nagisa', expr: 'determined', text: 'シュートチャンスでは「CHANCE!!」、相手のシュートは「PINCH!!」。練習と同じ、JUST を狙ってください！' });
    lines.push({ who: 'nagisa', expr: 'happy', text: fx.home ? 'ホームの浜風グラウンド、商店街のみんなも来てます！ キックオフです！' : 'アウェイの' + opp.ground + '。雰囲気に飲まれないように！ キックオフです！' });
    return Dialog({
      bgm: 'halftime', crowd: 0.3,
      bg: (g, t) => {
        // locker room / pitch-side
        const tw = Art.town('day');
        g.drawImage(tw.sky, 0, 0);
        g.drawImage(tw.town, 0, 30);
        g.fillStyle = '#4e8a3e'; g.fillRect(0, 130, W, 140);
        g.fillStyle = '#c7a878'; g.fillRect(0, 150, W, 12);
        g.drawImage(Art.buildBoards ? boardsCache() : null, 0, 134);
        g.fillStyle = '#5bb655'; g.fillRect(0, 162, W, 110);
        for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#4fa84a' : '#5bb655'; g.fillRect(i * 40, 162, 40, 110); }
        g.fillStyle = '#ffffff'; g.fillRect(0, 164, W, 2);
        // teams lining up
        State.lineup.forEach((id, i) => { const p = State.roster.find((q) => q.id === id); g.drawImage(Art.sprite(p.look, 'down', 'walk1'), 12 + i * 20, 164 + (i % 2) * 6, 32, 44); });
        oppData.roster.forEach((p, i) => g.drawImage(Art.sprite(p.look, 'down', 'walk1'), 244 + i * 20, 164 + (i % 2) * 6, 32, 44));
        g.drawImage(Art.sprite(benchLook(opp.coachLook || 'coach_' + opp.id, opp), 'down', 'walk1'), 440, 150, 32, 44);
      },
      lines,
      trans: 'blocks',
      next: () => startMatch(),
    });
  }
  let _boards = null;
  function boardsCache() { return _boards || (_boards = Art.buildBoards()); }

  function startMatch() {
    const fx = State.fixture();
    const opp = oppRoster(fx.opp);
    const morale = 0.94 + 0.12 * (State.avgMorale() / 100) + (fx.home ? 0.03 * State.localRatio() : 0);
    return new Match({
      opp: fx.opp, away: opp.roster, reunion: opp.reunion, morale, comboOk: (c) => State.comboReady(c), setplay: State.setplay,
      formation: State.formation, tactic: State.tactic, auto: State.auto, autoJust: State.autoJust, home: State.lineup.map((id) => State.roster.find((p) => p.id === id)),
      bench: State.roster.filter((p) => !State.lineup.includes(p.id)),
      onEnd: (r) => { State.result = r; Game.goto(Result(r), 'iris'); },
    });
  }

  // ---------------- RESULT & GROWTH ----------------
  function computeGrowth(r) {
    const out = [];
    for (const p of State.roster) {
      const found = r.recs.find((x) => x.id === p.id && x.team === 0);
      if (!found) continue;
      const rec = found.rec;
      const exp = {
        sht: (rec.shot || 0) * 5 + (rec.goal || 0) * 16,
        pas: (rec.pass || 0) * 1.0 + (rec.passOk || 0) * 1.6 + (rec.assist || 0) * 10,
        spd: (rec.dist || 0) / 110 + (rec.dribble || 0) * 3,
        def: (rec.tackleOk || 0) * 6 + (rec.tackle || 0) * 1.5 + (rec.save || 0) * 7,
        sta: 4 + (rec.dist || 0) / 180,
      };
      const ups = {};
      let total = 0;
      for (const k of STAT_KEYS) {
        let v = Math.floor((exp[k] / 26) * (p.growth || 1) + Math.random() * 0.5);
        v = Math.min(v, 3);
        if (v > 0) { ups[k] = v; total += v; }
      }
      if (r.score[0] > r.score[1]) { const k = pick(STAT_KEYS); ups[k] = (ups[k] || 0) + 1; total++; }
      if (total === 0) { ups.sta = 1; total = 1; }
      const before = Object.assign({}, p.stats);
      for (const k in ups) p.stats[k] = Math.min(99, p.stats[k] + ups[k]);
      // playing a plan in a real match teaches it: understanding grows for the tactic(s) used
      const tacUps = {};
      if (p.tacU && r.tacTime) {
        const played = (rec.dist || 0) > 0 ? 1 : 0;
        for (const k in r.tacTime) {
          const share = r.tacTime[k] / Math.max(1, Object.values(r.tacTime).reduce((a, v) => a + v, 0));
          const v = Math.round((2 + 4 * share) * played * (p.age && p.age < 25 ? 1.25 : p.age > 50 ? 0.7 : 1));
          if (v > 0 && share > 0.15) { p.tacU[k] = Math.min(100, p.tacU[k] + v); tacUps[k] = v; }
        }
      }
      const rating = clamp(5.5 + (rec.goal || 0) * 1.2 + (rec.assist || 0) * 0.7 + (rec.tackleOk || 0) * 0.25 + (rec.save || 0) * 0.35 + (rec.passOk || 0) * 0.06 + (rec.shot || 0) * 0.1 + (r.score[0] > r.score[1] ? 0.4 : r.score[0] < r.score[1] ? -0.3 : 0), 4.5, 9.8);
      const special = checkSpecialUnlock(p);
      out.push({ p, rec, ups, before, total, tacUps, rating: Math.round(rating * 10) / 10, special });
    }
    return out;
  }

  function Result(r) {
    const s = { t: 0, phase: 'score', gi: -1, gt: 0, fx: new Particles() };
    const win = r.score[0] > r.score[1], lose = r.score[0] < r.score[1];
    const rOpp = State.fixture().opp;
    s.growth = State.growth = computeGrowth(r);
    s.mvp = s.growth.slice().sort((a, b) => b.rating - a.rating)[0];
    s.enter = () => {
      Sound.crowd(win ? 0.4 : 0.15);
      Sound.bgm(win ? 'victory' : lose ? 'defeat' : 'hub');
      if (win) for (let i = 0; i < 80; i++) s.fx.add({ x: rand(0, W), y: rand(-60, 0), vx: rand(-15, 15), vy: rand(30, 70), g: 20, drag: 0.02, life: rand(2.5, 4), size: rand(2, 4), color: pick(['#4fb4e8', '#ffffff', '#ffd24a', '#e0474c']), kind: 'confetti', spin: rand(4, 10), shrink: false });
    };
    s.update = (dt) => {
      s.t += dt; s.fx.update(dt);
      if (s.phase === 'score') {
        if (s.t > 1.5 && (okPressed() || (State.auto && s.t > 3))) { s.phase = r.analysis ? 'analysis' : 'growth'; s.at = 0; s.gi = 0; s.gt = 0; Sound.play('swoosh'); }
      } else if (s.phase === 'analysis') {
        s.at += dt;
        const n = r.analysis.issues.length + (r.analysis.good ? 1 : 0);
        const shown = Math.floor((s.at - 0.3) / 0.25);
        if (shown >= 0 && shown < n && shown !== s.lastCard) { s.lastCard = shown; Sound.play('stamp', { vol: 0.4 }); }
        if (s.at > 1.2 && (okPressed() || (State.auto && s.at > 3))) { s.phase = 'growth'; s.gi = 0; s.gt = 0; Sound.play('swoosh'); }
      } else if (s.phase === 'growth') {
        s.gt += dt;
        const cur = s.growth[s.gi];
        const n = Object.keys(cur.ups).length;
        const step = Math.floor((s.gt - 0.5) / 0.28);
        if (step >= 0 && step < n && step !== s.lastStep) {
          s.lastStep = step; Sound.play('statup', { pitch: 1 + step * 0.08 });
          s.fx.burst(300, 104 + STAT_KEYS.indexOf(Object.keys(cur.ups)[step]) * 24, 8, { color: ['#ffd24a', '#ffffff'], speedMin: 20, speedMax: 70, lifeMax: 0.5, size: 2, kind: 'star' });
          if (step === n - 1 && cur.total >= 5) { setTimeout(() => Sound.play('levelup'), 200); }
        }
        const doneAnim = s.gt > 0.5 + n * 0.28 + 0.3;
        if (Input.hit('back')) { Sound.play('select'); Game.goto(WeekEnd(r), 'iris'); return; }
        if (okPressed() || (State.auto && doneAnim)) {
          if (!doneAnim) { s.gt = 0.5 + n * 0.28 + 0.3; s.lastStep = n - 1; }
          else if (s.gi + 1 < s.growth.length) { s.gi++; s.gt = 0; s.lastStep = -1; Sound.play('page'); }
          else { Sound.play('select'); Game.goto(WeekEnd(r), 'iris'); }
        }
      }
    };
    s.draw = (g) => {
      g.fillStyle = win ? '#10304f' : '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = win ? '#16406a' : '#222b4e';
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + s.t * 0.1; g.beginPath(); g.moveTo(W / 2, H / 2); g.arc(W / 2, H / 2, 400, a, a + 0.12); g.fill(); }
      if (s.phase === 'score') {
        const k = Ease.outBack(clamp(s.t / 0.6, 0, 1));
        panel(g, W / 2 - 180, 20, 360, 110, 'paper');
        text(g, win ? '勝利！' : lose ? '敗戦…' : '引き分け', W / 2, 28, { size: 18, align: 'center', color: win ? '#e0474c' : '#10304f' });
        MatchCrest(g, W / 2 - 150, 64, 0); MatchCrest(g, W / 2 + 138, 64, 1, rOpp);
        text(g, 'ハマカゼFC', W / 2 - 110, 90, { size: 10, align: 'center', color: '#2f86c4' });
        text(g, rOpp.name, W / 2 + 110, 90, { size: 10, align: 'center', color: rOpp.color });
        const sz = Math.round(32 * k);
        text(g, r.score[0] + '  -  ' + r.score[1], W / 2, 70 - sz / 2 + 12, { size: sz || 1, align: 'center', color: '#2a1a24' });
        // goals list
        panel(g, 20, 138, 210, 118, 'dark');
        text(g, '得点', 30, 144, { size: 10, color: '#ffd24a' });
        (r.goals.length ? r.goals : [{ none: true }]).slice(0, 6).forEach((gl, i) => {
          if (gl.none) { text(g, '得点なし', 30, 162, { size: 9, color: '#c9d6e6' }); return; }
          text(g, gl.min + "'", 30, 160 + i * 15, { size: 9, color: '#c9d6e6' });
          text(g, gl.name, 60, 160 + i * 15, { size: 10, color: gl.team === 0 ? '#9fdcff' : '#ffb0a0' });
        });
        // stats
        panel(g, 240, 138, 220, 60, 'dark');
        const rows = [['支配率', Math.round(r.poss[0] * 100) + '%', Math.round(r.poss[1] * 100) + '%'], ['シュート', r.shots[0], r.shots[1]], ['枠内', r.onTarget[0], r.onTarget[1]]];
        rows.forEach((row, i) => {
          text(g, String(row[1]), 280, 146 + i * 16, { size: 10, align: 'center', color: '#9fdcff' });
          text(g, row[0], 350, 147 + i * 16, { size: 9, align: 'center', color: '#c9d6e6' });
          text(g, String(row[2]), 420, 146 + i * 16, { size: 10, align: 'center', color: '#ffb0a0' });
        });
        // MVP
        panel(g, 240, 202, 220, 54, 'gold');
        drawPortrait(g, s.mvp.p.id, 'happy', 244, 205, 1);
        text(g, 'チームMVP', 298, 208, { size: 9, color: '#6d4f3a' });
        text(g, s.mvp.p.name + '　評価 ' + s.mvp.rating.toFixed(1), 298, 222, { size: 11, color: '#2a1a24' });
        const mr = s.mvp.rec;
        text(g, `G${mr.goal} A${mr.assist} パス${mr.passOk}/${mr.pass} 奪取${mr.tackleOk}${mr.save ? ' セーブ' + mr.save : ''}`, 298, 238, { size: 8, color: '#4a2a10' });
        if (s.t > 1.5) text(g, 'Z / クリック：試合分析へ', W / 2, H - 11, { size: 8, align: 'center', color: '#ffffff', alpha: blink() });
      } else if (s.phase === 'analysis') {
        const A = r.analysis;
        panel(g, 12, 8, 456, 254, 'paper');
        drawPortrait(g, 'nagisa', A.issues.length ? 'determined' : 'happy', 20, 12, 1);
        text(g, '試合分析レポート', 74, 16, { size: 14, color: '#10304f' });
        text(g, A.issues.length ? '監督、試合を見ていて気になったところをまとめました。' : '監督、今日はチーム全体がよく機能していました！', 74, 36, { size: 9, color: '#6d4f3a' });
        const CAT = { pas: ['パス', '#4fb4e8'], sht: ['シュート', '#e0474c'], spd: ['スピード', '#6cc35a'], def: ['ディフェンス', '#d48a1e'], sta: ['スタミナ', '#b06ad8'] };
        const cards = A.issues.map((c) => Object.assign({ good: false }, c)).concat(A.good ? [Object.assign({ good: true }, A.good)] : []);
        cards.forEach((c, i) => {
          if (s.at - 0.3 < i * 0.25) return;
          const y = 62 + i * 46, k = Ease.outBack(clamp((s.at - 0.3 - i * 0.25) / 0.25, 0, 1));
          const x = 22 + Math.round((1 - k) * 30);
          panel(g, x, y, 436, 42, c.good ? ['#2a1a24', '#e8f8d8', '#c8e0b0', '#ffffff'] : ['#2a1a24', '#fff6e0', '#e8d6ae', '#ffffff']);
          const [cn, cc] = CAT[c.cat] || ['', '#888'];
          g.fillStyle = cc; g.fillRect(x + 4, y + 4, 4, 34);
          text(g, (c.good ? '◎ ' : '▲ ') + c.title, x + 14, y + 4, { size: 10, color: c.good ? '#3f8a3e' : '#2a1a24' });
          text(g, c.value, x + 426, y + 5, { size: 10, align: 'right', color: c.good ? '#3f8a3e' : '#e0474c' });
          text(g, c.tip, x + 14, y + 18, { size: 8, color: '#6d4f3a' });
          const tag = (c.good ? '強み：' : '伸ばしたい：') + cn + (c.who ? '　注目：' + c.who : '');
          text(g, tag, x + 14, y + 29, { size: 8, color: cc });
        });
        // tie this week's training and any halftime tactical call back to a concrete result, so decisions feel like they mattered
        if (s.at > 0.4) {
          const homeRecs = r.recs.filter((x) => x.team === 0);
          const S2 = (k) => homeRecs.reduce((a, x) => a + (x.rec[k] || 0), 0);
          const tieIn = State.trained === 'shoot' ? 'シュート練習の成果か、今日はシュート' + S2('shot') + '本（枠内' + S2('onT') + '）でした。'
            : State.trained === 'pass' ? 'パス練習の成果か、今日はパス成功' + S2('passOk') + '/' + S2('pass') + '本でした。'
            : State.trained === 'run' ? '走り込みの成果か、総走行距離は' + (S2('dist') / 1000).toFixed(1) + 'kmでした。'
            : State.trained === 'tactics' && r.tactic && r.tactic[0] ? '戦術練習の成果です。今日の「' + Data.TACTICS[r.tactic[0]].name + '」、活かせましたか？' : null;
          if (tieIn) text(g, tieIn, 22, 240, { size: 8, color: '#2f86c4' });
        }
        const tacMemo = (A.memos || []).find((m) => m.key === 'htgood' || m.key === 'htbad' || m.key === 'oppswitch-ok' || m.key === 'oppswitch-bad');
        if (tacMemo) text(g, '采配メモ：' + tacMemo.text, 22, 250, { size: 8, color: tacMemo.key.includes('bad') ? '#e0474c' : '#3f8a3e' });
        else if (A.memos && A.memos.length) text(g, '試合中のメモ ' + A.memos.length + '件　（最初：' + A.memos[0].min + "'「" + A.memos[0].text + '」）', 22, 250, { size: 8, color: '#6d4f3a' });
        if (s.at > 1.2) text(g, 'Z / クリック：つぎへ', 456, 250, { size: 8, align: 'right', color: '#2f86c4', alpha: blink() });
      } else {
        const cur = s.growth[s.gi];
        const p = cur.p;
        panel(g, 12, 10, 456, 250, 'paper');
        text(g, '試合で得た経験', 24, 18, { size: 12, color: '#10304f' });
        text(g, (s.gi + 1) + ' / ' + s.growth.length, 456, 20, { size: 10, align: 'right', color: '#6d4f3a' });
        g.fillStyle = '#cfeeff'; g.fillRect(24, 38, 112, 112);
        g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 112; i += 10) g.fillRect(24 + i, 38, 5, 112);
        const n = Object.keys(cur.ups).length;
        const finished = s.gt > 0.5 + n * 0.28;
        drawPortrait(g, p.id, finished ? (cur.total >= 4 ? 'happy' : 'normal') : 'determined', 32, 46, 2);
        text(g, p.full, 24, 156, { size: 12, color: '#2a1a24' });
        text(g, p.pos + '　評価 ' + cur.rating.toFixed(1), 24, 172, { size: 10, color: '#6d4f3a' });
        const rc = cur.rec;
        const recLines = [`ゴール ${rc.goal}　アシスト ${rc.assist}`, `パス成功 ${rc.passOk}/${rc.pass}`, `ボール奪取 ${rc.tackleOk}　${p.pos === 'GK' ? 'セーブ ' + rc.save : 'シュート ' + rc.shot}`, `走行距離 ${(rc.dist / 60).toFixed(1)}km`];
        recLines.forEach((l, i) => text(g, l, 24, 190 + i * 14, { size: 9, color: '#2a1a24' }));
        // stat bars
        STAT_KEYS.forEach((k, i) => {
          const y = 100 + i * 24;
          const up = cur.ups[k] || 0;
          const order = Object.keys(cur.ups).indexOf(k);
          const tStart = 0.5 + order * 0.28;
          const pk = up ? clamp((s.gt - tStart) / 0.25, 0, 1) : 0;
          const v = cur.before[k] + up * pk;
          text(g, STAT_NAMES[k], 150, y - 2, { size: 10, color: '#2a1a24' });
          drawGrade(g, 216, y - 3, Math.round(v));
          if (grade(Math.round(v)) !== grade(cur.before[k])) {
            const rk = Ease.outBack(clamp((s.gt - tStart - 0.25) / 0.3, 0, 1));
            text(g, 'ランクアップ ' + grade(cur.before[k]) + '→' + grade(Math.round(v)) + '！', 324, y - 11 - (1 - rk) * 4, { size: 8, align: 'center', color: '#e0474c', outline: '#fff6e0', alpha: rk });
          }
          statBar(g, 234, y, 180, Math.round(v), STAT_COLORS[k], cur.before[k]);
          text(g, String(Math.round(v)), 434, y - 2, { size: 10, align: 'right', color: '#2a1a24' });
          if (up && pk > 0) {
            const bounce = Ease.outBack(clamp(pk * 1.5, 0, 1));
            panel(g, 438, y - 4, 26, 14, 'crimson');
            text(g, '+' + up, 451, y - 3 - (1 - bounce) * 4, { size: 9, align: 'center', color: '#ffffff' });
          }
        });
        text(g, '能力アップ！', 150, 60, { size: 16, color: '#e0474c', alpha: s.gt > 0.4 ? 1 : 0 });
        const tu = Object.keys(cur.tacUps || {});
        if (tu.length && finished) text(g, '戦術理解度 ' + tu.map((k) => Data.TACTICS[k].name + ' +' + cur.tacUps[k]).join('　'), 150, 226, { size: 9, color: '#2f86c4' });
        if (cur.special && finished) {
          const k2 = Ease.outBack(clamp((s.gt - 0.5) / 0.3, 0, 1));
          panel(g, 150 - 4 * k2, 202, 290 * k2, 14, 'gold');
          if (k2 > 0.8) text(g, '必殺技「' + Data.SPECIALS[p.id].name + '」を習得！', 152, 204, { size: 9, color: '#4a2a10' });
        }
        if (p.id === 'haruki' && finished) text(g, '伸び盛り！ 経験がぐんぐん身についた！', 150, 80, { size: 9, color: '#2f86c4' });
        else if (cur.total >= 5 && finished) text(g, 'すばらしい成長だ！', 150, 80, { size: 9, color: '#2f86c4' });
        if (finished) text(g, 'Z / クリック：つぎへ　X：まとめてスキップ', 456, 244, { size: 8, align: 'right', color: '#6d4f3a', alpha: blink() });
      }
      s.fx.draw(g);
    };
    return s;
  }

  // ---------------- LEAGUE: table, week results ----------------
  const teamColor = (id) => (id === 'hamakaze' ? '#4fb4e8' : League.clubById(id).color);
  function drawTable(g, x, y, w, reveal, hl) {
    const rows = State.standings();
    panel(g, x, y, w, 20 + rows.length * 17 + 6, 'dark');
    const cols = [['チーム', 30, 'left'], ['試', w - 150, 'center'], ['勝', w - 124, 'center'], ['分', w - 104, 'center'], ['負', w - 84, 'center'], ['得失', w - 58, 'center'], ['勝点', w - 24, 'center']];
    cols.forEach(([t, cx, al]) => text(g, t, x + cx, y + 6, { size: 8, align: al, color: '#9fdcff' }));
    rows.forEach((r, i) => {
      const k = reveal === undefined ? 1 : Ease.outCubic(clamp(reveal - i * 0.08, 0, 1));
      const yy = y + 20 + i * 17, me = r.id === 'hamakaze';
      g.globalAlpha = k;
      if (me || r.id === hl) { g.fillStyle = me ? 'rgba(79,180,232,0.22)' : 'rgba(255,255,255,0.08)'; g.fillRect(x + 4, yy - 1, w - 8, 16); }
      text(g, String(i + 1), x + 14, yy + 2, { size: 10, align: 'center', color: i === 0 ? '#ffd24a' : '#c9d6e6' });
      g.fillStyle = OUT; g.fillRect(x + 24, yy + 3, 8, 8); g.fillStyle = teamColor(r.id); g.fillRect(x + 25, yy + 4, 6, 6);
      text(g, w < 300 ? League.TEAM_SHORT(r.id) : League.TEAM_NAME(r.id), x + 36, yy + 2, { size: 9, color: me ? '#ffffff' : '#e0e6f0' });
      const gd = r.gf - r.ga;
      [[r.p, w - 150], [r.w, w - 124], [r.d, w - 104], [r.l, w - 84], [(gd > 0 ? '+' : '') + gd, w - 58], [r.pts, w - 24]].forEach(([v, cx], j) =>
        text(g, String(v), x + cx, yy + 2, { size: j === 5 ? 10 : 9, align: 'center', color: j === 5 ? '#ffd24a' : '#ffffff' }));
      g.globalAlpha = 1;
    });
  }
  function LeagueTable(next) {
    const s = { t: 0 };
    s.update = (dt) => { s.t += dt; if (s.t > 0.4 && (okPressed() || Input.hit('back') || (State.auto && s.t > 1.5))) { Sound.play('cancel'); Game.goto(next(), 'stripe'); } };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 6, 4, 220, 24, 'dark');
      text(g, leagueName() + '　順位表', 16, 9, { size: 12, color: '#ffd24a' });
      drawTable(g, 40, 38, 400, s.t * 3);
      // fixtures still to play
      const wk = State.season.week, rounds = State.season.rounds;
      panel(g, 40, 170, 400, 76, 'paper');
      text(g, wk < rounds.length ? '今後の日程' : '全日程終了', 50, 175, { size: 9, color: '#10304f' });
      for (let i = wk; i < Math.min(rounds.length, wk + 4); i++) {
        const pr = rounds[i].find((p) => p.includes('hamakaze')), home = pr[0] === 'hamakaze';
        text(g, '第' + (i + 1) + '節　' + (home ? 'ホーム' : 'アウェイ') + '　vs ' + League.TEAM_NAME(home ? pr[1] : pr[0]), 60, 190 + (i - wk) * 13, { size: 9, color: i === wk ? '#e0474c' : '#2a1a24' });
      }
      text(g, 'Z / X / クリック：もどる', W / 2, 252, { size: 8, align: 'center', color: '#c9d6e6', alpha: blink() });
    };
    return s;
  }

  function WeekEnd(r) {
    const s = { t: 0, notes: [], games: [], wk: State.season.week };
    let games = s.games, wk = s.wk;
    // all bookkeeping happens once, when the scene actually starts
    s.process = () => {
    const fx = State.fixture();
    wk = s.wk = State.season.week; games = s.games = [];
    // our result, then the other grounds
    const ours = fx.home ? ['hamakaze', fx.opp.id, r.score[0], r.score[1]] : [fx.opp.id, 'hamakaze', r.score[1], r.score[0]];
    games.push(ours);
    for (const pr of State.season.rounds[wk]) {
      if (pr.includes('hamakaze')) continue;
      const [ga, gb] = League.simulate(pr[0], pr[1], (id) => State.strength(id));
      games.push([pr[0], pr[1], ga, gb]);
    }
    for (const gm of games) State.record(gm[0], gm[1], gm[2], gm[3]);
    State.season.results.push(games);
    const win = r.score[0] > r.score[1], lose = r.score[0] < r.score[1];
    // head-to-head history vs this opponent, for pre-match drama next time we meet
    State.h2h = State.h2h || {};
    const hh = State.h2h[fx.opp.id] || (State.h2h[fx.opp.id] = { w: 0, d: 0, l: 0, streak: 0 });
    const hGf = fx.home ? r.score[0] : r.score[1], hGa = fx.home ? r.score[1] : r.score[0];
    if (hGf > hGa) { hh.w++; hh.streak = hh.streak > 0 ? hh.streak + 1 : 1; }
    else if (hGf < hGa) { hh.l++; hh.streak = hh.streak < 0 ? hh.streak - 1 : -1; }
    else { hh.d++; hh.streak = 0; }
    hh.last = { gf: hGf, ga: hGa, home: fx.home, season: State.seasonNo };
    // who played: morale, bonds, goals
    const played = r.recs.filter((x) => x.team === 0 && x.rec.dist > 0).map((x) => x.id);
    State.goals = State.goals || {};
    for (const x of r.recs) if (x.team === 0 && x.rec.goal) State.goals[x.id] = (State.goals[x.id] || 0) + x.rec.goal;
    const readyBefore = Data.COMBOS.filter((c) => State.comboReady(c)).map((c) => c.id);
    for (const p of State.roster) {
      let m = State.morale[p.id] ?? 60;
      if (played.includes(p.id)) { m += 6 + (win ? 4 : lose ? -2 : 0); State.benchWeeks[p.id] = 0; }
      else {
        State.benchWeeks[p.id] = (State.benchWeeks[p.id] || 0) + 1;
        m -= (p.pos === 'GK' ? 3 : 5) + 3 * State.benchWeeks[p.id];
        if (m < 40) s.notes.push(p.name + 'のやる気が下がっています（' + State.benchWeeks[p.id] + '試合出番なし）');
      }
      State.morale[p.id] = clamp(Math.round(m), 0, 100);
    }
    for (const a of played) for (const b of played) if (a < b) State.addBond(a, b, 8);
    for (const c of Data.COMBOS) if (State.comboReady(c) && !readyBefore.includes(c.id) && c.ids.every((id) => State.roster.some((q) => q.id === id)))
      s.notes.push(NAMES[c.ids[0]] + 'と' + NAMES[c.ids[1]] + 'の息が合ってきた！ コンビ「' + c.name + '」が使えます');
    // gate receipts at home: locals bring the town out
    if (fx.home) {
      const att = Math.round(180 + 260 * State.localRatio() + State.season.table.hamakaze.w * 40 + (win ? 60 : 0));
      const inc = Math.round(att / 20);
      State.budget += inc;
      s.notes.unshift('ホーム観客 ' + att + '人（地元選手 ' + Math.round(State.localRatio() * 11) + '人）　入場料 +' + inc + '万円');
    } else { State.budget += 3; s.notes.unshift('アウェイ遠征　分配金 +3万円'); }
    State.trained = null;
    State.season.week++;
    };
    s.enter = () => { s.process(); Sound.bgm('hub'); Sound.crowd(0); };
    s.update = (dt) => {
      s.t += dt;
      if (s.t > 1.5 && (okPressed() || (State.auto && s.t > 3))) {
        Sound.play('select');
        const nextWeek = () => {
          if (State.season.week >= State.season.rounds.length) { Save.write('seasonend'); return SeasonEnd(); }
          State.pendingTalk = s.notes.filter((n) => !n.startsWith('ホーム') && !n.startsWith('アウェイ')).slice(0, 2).map((n) => ['nagisa', n.includes('やる気') ? 'sad' : 'happy', n]);
          if (!State.pendingTalk.length) State.pendingTalk = null;
          return Hub();
        };
        if (State.season.week === State.applicantWeek && State.freeAgents.length) Game.goto(Applicant(nextWeek), 'iris');
        else Game.goto(nextWeek(), 'iris');
      }
    };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 6, 4, 230, 24, 'dark');
      text(g, '第' + (wk + 1) + '節　全会場の結果', 16, 9, { size: 12, color: '#ffd24a' });
      games.forEach((gm, i) => {
        const k = Ease.outBack(clamp((s.t - 0.2 - i * 0.25) / 0.3, 0, 1));
        if (k <= 0) return;
        const y = 36 + i * 30, x = 10 + Math.round((1 - k) * -40);
        const me = gm[0] === 'hamakaze' || gm[1] === 'hamakaze';
        panel(g, x, y, 214, 26, me ? 'sky' : 'paper');
        g.fillStyle = teamColor(gm[0]); g.fillRect(x + 5, y + 5, 3, 16); g.fillStyle = teamColor(gm[1]); g.fillRect(x + 206, y + 5, 3, 16);
        text(g, League.TEAM_SHORT(gm[0]), x + 12, y + 7, { size: 9, color: '#2a1a24' });
        text(g, gm[2] + ' - ' + gm[3], x + 107, y + 5, { size: 12, align: 'center', color: '#2a1a24' });
        text(g, League.TEAM_SHORT(gm[1]), x + 202, y + 7, { size: 9, align: 'right', color: '#2a1a24' });
      });
      drawTable(g, 232, 36, 242, (s.t - 0.9) * 3);
      panel(g, 10, 170, 464, 94, 'paper');
      text(g, 'ナギサのメモ　（予算 ' + State.budget + '万円）', 18, 175, { size: 9, color: '#2f86c4' });
      s.notes.slice(0, 5).forEach((n, i) => text(g, '・' + n, 18, 189 + i * 13, { size: 9, color: n.includes('やる気') ? '#e0474c' : '#2a1a24' }));
      if (s.t > 1.5) text(g, 'Z / クリック：つぎへ', 466, 252, { size: 8, align: 'right', color: '#6d4f3a', alpha: blink() });
    };
    return s;
  }

  // ---------------- choices (applicants, transfers) ----------------
  function signPlayer(def, from) {
    const kitLook = Object.assign({}, Data.HOME_KIT, { skin: def.look.skin, skinD: def.look.skinD, hair: def.look.hair, hairD: def.look.hairD, style: def.look.style, extra: def.look.extra, body: def.look.body, key: 'signed_' + def.id });
    const p = Object.assign({}, def, { stats: Object.assign({}, def.stats), base: Object.assign({}, def.stats), tacU: Object.assign({}, def.tacU || { counter: 45, press: 45, long: 45, possession: 45 }), look: def.pos === 'GK' ? Object.assign({}, Data.HOME[0].look, kitLook, { shirt: '#8fd14f', shirtD: '#5a9e2e', shirtL: '#c8f08a', key: 'signed_' + def.id }) : kitLook, bench: true, joined: from || 'free' });
    p.local = !!def.local; p.growth = def.growth || 1; p.sal = def.sal || 15;
    State.roster.push(p);
    State.morale[p.id] = 70; State.benchWeeks[p.id] = 0;
    for (const q of State.roster) if (q.id !== p.id) State.addBond(p.id, q.id, 0);
    State.joined.push(p.id);
    if (from) State.bought.push(def.id);
    State.freeAgents = State.freeAgents.filter((id) => id !== def.id);
    return p;
  }
  // after someone leaves, the best available player of the same position steps into the eleven
  function fillLineup() {
    for (let i = 0; i < State.lineup.length; i++) {
      const id = State.lineup[i];
      if (id && State.roster.some((q) => q.id === id)) continue;
      const bench = State.roster.filter((q) => !State.lineup.includes(q.id) && (i === 0 ? q.pos === 'GK' : q.pos !== 'GK'));
      const best = bench.sort((a, b) => (b.stats.def + b.stats.pas + b.stats.spd) - (a.stats.def + a.stats.pas + a.stats.spd))[0] || State.roster.find((q) => !State.lineup.includes(q.id));
      State.lineup[i] = best ? best.id : null;
    }
  }
  function rivalsFor(def) { return State.roster.filter((q) => q.pos === def.pos && State.lineup.includes(q.id)).map((q) => q.name); }
  const SQUAD_MAX = 16;

  function Applicant(next) {
    const faId = pick(State.freeAgents);
    const def = faDef(faId);
    const s = { t: 0, phase: 'talk', menu: null, done: false };
    const talk = Dialog({
      bgm: 'hub', crowd: 0, title: '練習後のクラブハウスに、来客が…',
      bg: (g, t) => { drawClubhouse(g, t); g.fillStyle = 'rgba(16,24,46,0.25)'; g.fillRect(0, 0, W, H); },
      lines: [
        { who: 'nagisa', expr: 'surprised', text: '監督、お客さんです。……入団したい、って。' },
        { who: def.id, expr: 'normal', side: 'right', text: def.pitch },
        { who: 'nagisa', expr: 'normal', text: '「' + def.nick + '」' + def.name + 'さん、' + def.pos + '。' + def.bio },
      ],
      next: () => s,
    });
    const cost = def.sal;
    s.enter = () => {
      Sound.bgm('hub');
      const full = State.roster.length >= SQUAD_MAX, poor = State.budget < cost;
      s.menu = new Menu([
        { id: 'yes', label: '入団してもらう', sub: full ? '選手枠がいっぱい（' + SQUAD_MAX + '人）' : poor ? '予算が足りない' : '給料 ' + cost + '万円を支払う', disabled: full || poor },
        { id: 'no', label: '今回は断る', sub: 'シーズン後の移籍市場で、また会えるかも' },
      ], 250, 150, 214, 34, 6);
    };
    s.update = (dt) => {
      s.t += dt;
      if (s.done) { if (s.t > 1.4 && (okPressed() || (State.auto && s.t > 2.4))) Game.goto(next(), 'iris'); return; }
      if (State.auto && s.t > 1) { s.menu.sel = s.menu.items[0].disabled ? 1 : 0; Input.pressed.ok = true; }
      const it = s.menu.update(dt);
      if (!it) return;
      s.done = true; s.t = 0;
      if (it.id === 'yes') { State.budget -= cost; signPlayer(def); s.msg = def.name + 'が入団した！（ベンチから出場機会をうかがう）'; Sound.play('levelup'); Game.doFlash(0.4); }
      else { s.msg = def.name + '「……そうですか。また、いつか」'; Sound.play('cancel'); }
    };
    s.draw = (g) => {
      drawClubhouse(g, s.t); g.fillStyle = 'rgba(16,24,46,0.55)'; g.fillRect(0, 0, W, H);
      panel(g, 12, 12, 226, 246, 'paper');
      g.fillStyle = '#e8d6ae'; g.fillRect(20, 20, 96, 96);
      drawPortrait(g, def.id, s.done && s.msg && !s.msg.includes('いつか') ? 'happy' : 'normal', 20, 20, 2);
      text(g, '「' + def.nick + '」', 122, 22, { size: 8, color: '#e0474c' });
      text(g, def.full, 122, 34, { size: 12, color: '#2a1a24' });
      text(g, def.age + '歳　' + def.pos + '　' + (def.local ? '地元出身' : 'よそ者'), 122, 52, { size: 8, color: '#6d4f3a' });
      text(g, '特性：' + def.trait, 122, 66, { size: 8, color: '#4a2a10' });
      wrap(g, def.traitDesc, 108, 8).slice(0, 3).forEach((l, i) => text(g, l, 122, 78 + i * 10, { size: 8, color: '#6d4f3a' }));
      STAT_KEYS.forEach((k, i) => {
        const y = 124 + i * 14;
        text(g, STAT_NAMES[k], 22, y, { size: 8, color: '#2a1a24' });
        drawGrade(g, 75, y - 1, def.stats[k], 11);
        statBar(g, 88, y + 1, 110, def.stats[k], STAT_COLORS[k]);
        text(g, String(def.stats[k]), 226, y, { size: 8, align: 'right', color: '#2a1a24' });
      });
      // the dilemma, spelled out
      const rv = rivalsFor(def);
      const lines = ['給料 ' + cost + '万円／予算 ' + State.budget + '万円', '選手枠 ' + State.roster.length + '／' + SQUAD_MAX + '人',
        rv.length ? '同じ' + def.pos + '：' + rv.join('・') + '（出番が減るとやる気↓）' : '同じポジションの先発はいない',
        def.local ? '地元出身：ホームの観客が増える' : 'よそ者：地元選手が減ると観客も減る', '加入直後は絆ゼロ：コンビはすぐには使えない'];
      lines.forEach((l, i) => text(g, '・' + l, 20, 196 + i * 12, { size: 8, color: i === 2 && rv.length ? '#e0474c' : '#2a1a24' }));
      if (!s.done) { panel(g, 250, 96, 214, 44, 'dark'); text(g, '入団を認めますか？', 262, 104, { size: 11, color: '#ffd24a' }); text(g, '加入すると、ベンチから出場機会をうかがう。', 262, 122, { size: 8, color: '#c9d6e6' }); s.menu.draw(g); }
      else { panel(g, 250, 150, 214, 50, 'gold'); wrap(g, s.msg, 196, 10).forEach((l, i) => text(g, l, 260, 158 + i * 13, { size: 10, color: '#2a1a24' })); }
    };
    return talk;
  }

  // ---------------- SEASON END ----------------
  const RANK_MONEY = [120, 80, 60, 45, 35, 25];
  function SeasonEnd() {
    const s = { t: 0 };
    const rank = State.rank(), money = Math.round(RANK_MONEY[rank - 1] * (State.tier === 'prefecture' ? 1.6 : 1));
    const wasTier = State.tier;
    const numTeams = League.teamsForTier(wasTier).length;
    s.enter = () => {
      if (!State.season.awarded) {
        State.budget += money; State.season.awarded = true;
        // remember how everyone finished, for next time we meet them
        State.lastSeasonRanks = State.lastSeasonRanks || {};
        State.standings().forEach((row, i) => { State.lastSeasonRanks[row.id] = { rank: i + 1, tier: wasTier }; });
      }
      Sound.bgm(rank <= 2 ? 'victory' : 'hub'); if (rank === 1) { Sound.play('cheer'); Game.doFlash(0.5); }
    };
    s.update = (dt) => {
      s.t += dt;
      if (s.t > 2 && (okPressed() || (State.auto && s.t > 3))) {
        Sound.play('select');
        if (rank === 1 && wasTier === 'district') Game.goto(PromotionIntro(), 'iris');
        else if (wasTier === 'prefecture' && rank === numTeams) Game.goto(RelegationNotice(rank), 'iris');
        else Game.goto(Celebration(rank), 'iris');
      }
    };
    s.draw = (g) => {
      g.fillStyle = rank === 1 ? '#10304f' : '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = rank === 1 ? '#16406a' : '#222b4e';
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + s.t * 0.1; g.beginPath(); g.moveTo(W / 2, 60); g.arc(W / 2, 60, 500, a, a + 0.12); g.fill(); }
      const k = Ease.outBack(clamp(s.t / 0.6, 0, 1));
      text(g, 'シーズン終了', W / 2, 10, { size: 12, align: 'center', color: '#9fdcff' });
      text(g, rank === 1 ? '優勝！' : rank + '位', W / 2, 26, { size: Math.round(30 * k) || 1, align: 'center', color: rank === 1 ? '#ffd24a' : '#ffffff', outline: '#10304f', outlineW: 2 });
      drawTable(g, 40, 70, 400, (s.t - 0.6) * 3, 'hamakaze');
      panel(g, 40, 206, 400, 50, 'paper');
      const T = State.season.table.hamakaze;
      text(g, T.w + '勝 ' + T.d + '分 ' + T.l + '敗　得点 ' + T.gf + '　失点 ' + T.ga, 52, 212, { size: 10, color: '#2a1a24' });
      text(g, '商店街からの応援資金 +' + money + '万円（予算 ' + State.budget + '万円）', 52, 230, { size: 9, color: '#2f86c4' });
      if (s.t > 2) text(g, 'Z / クリック', 430, 244, { size: 8, align: 'right', color: '#6d4f3a', alpha: blink() });
    };
    return s;
  }


  // ---------------- promotion playoff & relegation ----------------
  function promoScoreBg(g, t, leg, r, gk) {
    g.fillStyle = '#10304f'; g.fillRect(0, 0, W, 186);
    text(g, '昇格決定戦　第' + leg + '戦', W / 2, 10, { size: 12, align: 'center', color: '#ffd24a' });
    MatchCrest(g, W / 2 - 150, 44, 0); MatchCrest(g, W / 2 + 138, 44, 1, gk);
    text(g, 'ハマカゼFC', W / 2 - 110, 70, { size: 10, align: 'center', color: '#2f86c4' });
    text(g, gk.name, W / 2 + 110, 70, { size: 10, align: 'center', color: gk.light });
    const k = Ease.outBack(clamp(t / 0.6, 0, 1)), sz = Math.round(28 * k);
    text(g, r.score[0] + '  -  ' + r.score[1], W / 2, 50 - sz / 2 + 12, { size: sz || 1, align: 'center', color: '#ffffff' });
    if (State.promo && State.promo.legs.length === 2) {
      const agg = State.promo.legs[0].gf + State.promo.legs[1].gf, aggA = State.promo.legs[0].ga + State.promo.legs[1].ga;
      text(g, '2試合合計　' + agg + ' - ' + aggA, W / 2, 96, { size: 12, align: 'center', color: '#ffd24a' });
    }
  }
  // a promotion-leg match: no weekly bookkeeping, but growth and morale still apply quietly
  function promoMatch(gk, home, onEnd) {
    const oppData = oppRoster(gk);
    const morale = 0.96 + 0.1 * (State.avgMorale() / 100) + (home ? 0.03 * State.localRatio() : 0);
    return new Match({
      opp: gk, away: oppData.roster, reunion: oppData.reunion, morale, comboOk: (c) => State.comboReady(c), setplay: State.setplay,
      formation: State.formation, tactic: State.tactic, auto: State.auto, autoJust: State.autoJust,
      home: State.lineup.map((id) => State.roster.find((p) => p.id === id)),
      bench: State.roster.filter((p) => !State.lineup.includes(p.id)),
      onEnd,
    });
  }
  function PromotionIntro() {
    const gk = League.gatekeeper();
    return Dialog({
      bgm: 'halftime', crowd: 0.3, title: '昇格決定戦',
      bg: (g, t) => drawHarbor(g, t, 'dusk'),
      lines: [
        { who: 'nagisa', expr: 'determined', text: '監督！ ' + tierLabel('district') + '優勝、おめでとうございます！' },
        { who: 'nagisa', expr: 'surprised', text: 'ですが、まだ終わりではありません。県リーグへの「昇格決定戦」が組まれました。' },
        { who: 'nagisa', expr: 'determined', text: '相手は県リーグの覇者、「' + gk.name + '」。2試合合計のスコアで昇格が決まります。' },
        { who: 'kazuha', expr: 'sad', text: gk.blurb },
        { who: 'leo', expr: 'determined', text: '格上上等だ。…吠え面かかせてやるよ。' },
        { who: 'nagisa', expr: 'normal', text: '第1戦はホーム、浜風グラウンドです。行きましょう！' },
      ],
      next: () => { State.promo = { legs: [] }; return PromotionLeg(1, gk); },
    });
  }
  function PromotionLeg(leg, gk) {
    return promoMatch(gk, leg === 1, (r) => {
      computeGrowth(r);
      const played = r.recs.filter((x) => x.team === 0 && x.rec.dist > 0).map((x) => x.id);
      const win = r.score[0] > r.score[1], lose = r.score[0] < r.score[1];
      for (const p of State.roster) { let m = State.morale[p.id] ?? 60; if (played.includes(p.id)) m += 5 + (win ? 3 : lose ? -2 : 0); State.morale[p.id] = clamp(Math.round(m), 0, 100); }
      for (const a of played) for (const b of played) if (a < b) State.addBond(a, b, 6);
      State.promo.legs.push({ leg, gf: r.score[0], ga: r.score[1] });
      Game.goto(PromotionLegResult(leg, r, gk), 'iris');
    });
  }
  function PromotionLegResult(leg, r, gk) {
    if (leg === 1) {
      const win = r.score[0] > r.score[1], lose = r.score[0] < r.score[1];
      return Dialog({
        bgm: 'halftime', crowd: 0.2, bg: (g, t) => promoScoreBg(g, t, leg, r, gk),
        lines: [
          { who: 'nagisa', expr: win ? 'happy' : lose ? 'sad' : 'normal', text: '第1戦、' + r.score[0] + '-' + r.score[1] + 'で終了しました。' },
          { who: 'kazuha', expr: 'normal', text: win ? 'いい流れです。ですが油断は禁物、敵地での第2戦が本番ですよ。' : lose ? '厳しい入り方になりましたが、まだ終わっていません。' : '五分の状態。第2戦がすべてを決めます。' },
          { who: 'nagisa', expr: 'determined', text: '第2戦は敵地、' + gk.ground + '。2試合合計のスコアで昇格が決まります。' },
        ],
        next: () => PromotionLeg(2, gk),
      });
    }
    const l1 = State.promo.legs[0], l2 = State.promo.legs[1];
    const aggFor = l1.gf + l2.gf, aggAgainst = l1.ga + l2.ga;
    if (aggFor === aggAgainst) {
      return Dialog({
        bgm: 'halftime', crowd: 0.3, bg: (g, t) => promoScoreBg(g, t, leg, r, gk),
        lines: [
          { who: 'nagisa', expr: 'surprised', text: '第2戦も' + r.score[0] + '-' + r.score[1] + '。2試合合計は' + aggFor + '-' + aggAgainst + 'で並びました！' },
          { who: 'kazuha', expr: 'determined', text: 'PK戦で決着をつけます。' },
        ],
        next: () => PromotionShootout(gk),
      });
    }
    const promoted = aggFor > aggAgainst;
    return Dialog({
      bgm: promoted ? 'victory' : 'halftime', crowd: promoted ? 0.6 : 0.2, bg: (g, t) => promoScoreBg(g, t, leg, r, gk),
      lines: [{ who: 'nagisa', expr: promoted ? 'happy' : 'sad', text: '第2戦、' + r.score[0] + '-' + r.score[1] + '。2試合合計 ' + aggFor + '-' + aggAgainst + '。' }],
      next: () => PromotionResult(promoted, gk),
    });
  }
  function PromotionShootout(gk) {
    const home = State.lineup.map((id) => State.roster.find((q) => q.id === id)).filter((p) => p.pos !== 'GK').sort((a, b) => b.stats.sht - a.stats.sht).slice(0, 5);
    const away = gk.roster().filter((p) => p.pos !== 'GK').sort((a, b) => b.stats.sht - a.stats.sht).slice(0, 5);
    const homeGK = State.roster.find((p) => p.pos === 'GK');
    const awayGK = gk.roster().find((p) => p.pos === 'GK');
    const pOf = (kicker, keeper) => clamp(0.62 + ((kicker.stats.sht || 50) - (keeper ? keeper.stats.def : 50)) / 300, 0.35, 0.92);
    const seq = []; let hs = 0, as = 0, i = 0;
    const takeKick = (side, kicker, keeper) => { const made = Math.random() < pOf(kicker, keeper); seq.push({ side, kicker, made }); return made; };
    while (true) {
      const kh = home[i % home.length], ka = away[i % away.length];
      if (takeKick(0, kh, awayGK)) hs++;
      if (takeKick(1, ka, homeGK)) as++;
      i++;
      if (i >= 5 && hs !== as) break;
      if (i >= 5 && i > 25) break;
    }
    const promoted = hs > as;
    const s = { t: 0, shown: 0, revealT: 0, hs: 0, as: 0, phase: 'go', endT: 0 };
    s.enter = () => { Sound.bgm('halftime'); Sound.crowd(0.3); };
    s.update = (dt) => {
      s.t += dt;
      if (s.phase === 'go') {
        s.revealT += dt;
        const step = State.auto ? 0.12 : 0.85;
        const showN = Math.min(seq.length, Math.floor(s.revealT / step) + 1);
        if (showN > s.shown) {
          for (let k = s.shown; k < showN; k++) { const e = seq[k]; if (e.made) { if (e.side === 0) s.hs++; else s.as++; } Sound.play(e.made ? 'net' : 'miss_timing', { vol: 0.6 }); if (e.made) Game.addShake(2, 0.15); }
          s.shown = showN;
        }
        if (s.shown >= seq.length) { s.phase = 'end'; s.endT = 0; }
      } else {
        s.endT += dt;
        if (s.endT > 1.2 && (okPressed() || (State.auto && s.endT > 2))) { Sound.play('select'); Game.goto(PromotionResult(promoted, gk), 'iris'); }
      }
    };
    s.draw = (g) => {
      g.fillStyle = '#10304f'; g.fillRect(0, 0, W, H);
      text(g, 'PK戦', W / 2, 10, { size: 14, align: 'center', color: '#ffd24a' });
      text(g, 'ハマカゼFC', 90, 32, { size: 11, align: 'center', color: '#9fdcff' });
      text(g, gk.short, W - 90, 32, { size: 11, align: 'center', color: gk.light });
      text(g, String(s.hs), 90, 46, { size: 22, align: 'center', color: '#ffffff' });
      text(g, String(s.as), W - 90, 46, { size: 22, align: 'center', color: '#ffffff' });
      const homeKicks = seq.filter((e) => e.side === 0), awayKicks = seq.filter((e) => e.side === 1);
      const shownIdx = (arr) => seq.slice(0, s.shown).filter((e) => arr.includes(e)).length;
      const homeShown = seq.slice(0, s.shown).filter((e) => e.side === 0).length;
      const awayShown = seq.slice(0, s.shown).filter((e) => e.side === 1).length;
      homeKicks.forEach((e, idx) => { const x = 30 + idx * 18, y = 68; g.fillStyle = idx >= homeShown ? '#3a3050' : e.made ? '#6cc35a' : '#e0474c'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); });
      awayKicks.forEach((e, idx) => { const x = W - 30 - idx * 18, y = 68; g.fillStyle = idx >= awayShown ? '#3a3050' : e.made ? '#6cc35a' : '#e0474c'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); });
      panel(g, W / 2 - 160, 96, 320, 60, 'paper');
      if (s.shown > 0 && s.shown <= seq.length) {
        const last = seq[s.shown - 1];
        drawPortrait(g, last.kicker.id, last.made ? 'happy' : 'sad', W / 2 - 150, 98, 1);
        text(g, last.kicker.name + (last.made ? '……決めた！' : '……外れたーっ！'), W / 2 + 10, 124, { size: 12, align: 'center', color: last.made ? '#2f86c4' : '#e0474c' });
      } else text(g, '間もなくキックオフ…', W / 2, 124, { size: 12, align: 'center', color: '#2a1a24' });
      if (s.phase === 'end') {
        panel(g, W / 2 - 140, 164, 280, 40, promoted ? 'gold' : 'dark');
        text(g, promoted ? 'ハマカゼFC、突破！' : gk.short + '、突破！', W / 2, 176, { size: 14, align: 'center', color: promoted ? '#2a1a24' : '#ffffff' });
        if (s.endT > 1.2) text(g, 'Z / クリック', W - 12, H - 14, { size: 8, align: 'right', color: '#ffffff', alpha: blink() });
      }
    };
    return s;
  }
  function PromotionResult(promoted, gk) {
    const rank = State.rank();
    if (promoted) {
      State.tier = 'prefecture';
      return Dialog({
        bgm: 'victory', crowd: 0.7, title: '昇格決定！',
        bg: (g, t) => drawHarbor(g, t, 'dusk'),
        lines: [
          { who: 'nagisa', expr: 'happy', text: 'やりました…！ 県リーグ昇格です！！', fx: 'flash', sfx: 'cheer' },
          { who: 'otaki', expr: 'happy', text: 'うちの、この小っちゃいクラブがねぇ…！ たまげたよ！' },
          { who: gk.captain, expr: 'sad', side: 'right', text: pick(['…見事だ。来年、県リーグで待っている。', '…次に会うときは、もう格上とは呼ばせない。']) },
          { who: 'leo', expr: 'happy', text: '当然だろ。オレたちはもう、港町のちっちゃいクラブじゃねぇ。' },
          { who: 'kazuha', expr: 'normal', text: '来シーズンから県リーグ。相手はもっと強くなります。気を引き締めましょう。' },
        ],
        next: () => Celebration(rank, 'promoted'),
      });
    }
    return Dialog({
      bgm: 'hub', crowd: 0.2, title: '昇格ならず',
      bg: (g, t) => drawHarbor(g, t, 'dusk'),
      lines: [
        { who: 'nagisa', expr: 'sad', text: '…昇格はなりませんでした。' },
        { who: gk.captain, expr: 'normal', side: 'right', text: '悪くはなかった。だが、まだこちら側に来る資格はない。' },
        { who: 'kazuha', expr: 'determined', text: '来シーズン、また地区リーグ優勝から。今度こそ突破しましょう。' },
        { who: 'leo', expr: 'determined', text: 'くそっ…。次は絶対に決めてやる。' },
      ],
      next: () => Celebration(rank, 'stayed'),
    });
  }
  function RelegationNotice(rank) {
    return Dialog({
      bgm: 'hub', crowd: 0, title: '降格',
      bg: (g, t) => drawHarbor(g, t, 'dusk'),
      lines: [
        { who: 'nagisa', expr: 'sad', text: '監督…。今シーズンは県リーグ最下位でした。' },
        { who: 'nagisa', expr: 'normal', text: '来シーズンは、地区リーグに降格します。' },
        { who: 'kazuha', expr: 'determined', text: '悔しいですが、地区でもう一度力をつけて、必ず戻ってきましょう。' },
        { who: 'leo', expr: 'determined', text: 'くそ…！ 絶対すぐ戻ってやる。' },
      ],
      next: () => { State.tier = 'district'; return Celebration(rank, 'relegated'); },
    });
  }
  function Celebration(rank, note) {
    const steam = new Particles();
    const top = Object.entries(State.goals || {}).sort((a, b) => b[1] - a[1])[0];
    const topName = top ? (State.roster.find((q) => q.id === top[0]) || { name: '?' }).name : null;
    const tierLbl = note === 'relegated' ? '県' : note === 'promoted' || note === 'stayed' ? '地区' : (State.tier === 'prefecture' ? '県' : '地区');
    return Dialog({
      bgm: 'ending', crowd: 0, title: 'シーズン最終節の夜　おタキの屋台',
      bg: (g, t) => {
        drawHarbor(g, t, 'dusk');
        g.fillStyle = '#5a4a3a'; g.fillRect(0, 170, W, 100);
        for (let x = 0; x < W; x += 16) { g.fillStyle = '#4a3a2a'; g.fillRect(x, 170, 1, 100); }
        drawStall(g, t, 180, 76, true);
        steam.update(1 / 60);
        if (Math.random() < 0.35) steam.add({ x: 215 + rand(0, 40), y: 126, vx: rand(-3, 3), vy: rand(-18, -10), life: rand(0.8, 1.4), size: rand(2, 4), color: 'rgba(255,240,220,0.55)' });
        steam.draw(g);
        g.drawImage(Art.sprite(benchLook('otaki'), 'down', Math.sin(t * 5) > 0.3 ? 'cheer' : 'walk1'), 230, 104, 32, 44);
        const crew = State.lineup.slice(1, 9).map((id) => State.roster.find((q) => q.id === id));
        crew.forEach((p, i) => {
          const x = i < 4 ? 40 + i * 34 : 316 + (i - 4) * 34;
          g.drawImage(Art.sprite(p.look, i < 4 ? 'side' : 'left', Math.floor(t * 2 + i) % 7 === 0 ? 'cheer' : 'walk1'), x, 136 + (i % 2) * 4, 32, 44);
        });
        for (let i = 0; i < 16; i++) {
          const x = i * 32 + 8, y = 14 + Math.sin(i * 0.9) * 4;
          g.fillStyle = '#2a1a24'; g.fillRect(x, y - 1, 32, 1);
          g.fillStyle = (Math.floor(t * 3) + i) % 3 !== 0 ? ['#ffd24a', '#ff8a6a', '#9fdcff'][i % 3] : '#6a5a4a';
          g.fillRect(x + 14, y, 4, 5);
        }
      },
      lines: [
        { who: 'otaki', expr: 'happy', text: rank === 1 ? '優勝だよ、優勝！ 港町のちっちゃいクラブが、' + tierLbl + 'の一番さ！ たこ焼き、好きなだけお食べ！' : rank <= 3 ? rank + '位！ 上出来じゃないか！ 今夜はたこ焼き、おかわり自由だよ！' : rank + '位か…。でも、みんなよく走ったよ。腹が減っちゃ、来年も勝てないからね！' },
        note === 'promoted' ? { who: 'otaki', expr: 'happy', text: '来シーズンから県リーグかい…！ 大したもんだよ、ほんとに。' }
          : note === 'stayed' ? { who: 'otaki', expr: 'normal', text: '昇格は持ち越しだ。だが、来シーズンまた挑めばいい。' }
          : note === 'relegated' ? { who: 'otaki', expr: 'sad', text: '県リーグは厳しかったねぇ…。でも、まだ腐っちゃいない。地区でやり直しさ。' } : null,
        { who: 'ponta', expr: 'happy', side: 'right', text: 'うおおお！ 監督、オレ、この日のために生きてたっス！' },
        topName ? { who: 'kazuha', expr: 'normal', side: 'right', text: 'チーム得点王は' + topName + '、' + top[1] + '点でした。…記録、ちゃんとつけてますから。' } : { who: 'kazuha', expr: 'sad', side: 'right', text: '今季は得点が少なかったですね。…攻め方、一緒に考えましょう。' },
        { who: 'leo', expr: 'normal', side: 'right', text: rank === 1 ? '…ま、監督のおかげもちょっとはあるんじゃね？' : '来季は、絶対オレが得点王になる。' },
        { who: 'nagisa', expr: 'determined', text: '監督。明日から移籍市場が開きます。入る人、出ていく人……。大事な決断になりますよ。' },
        { who: 'otaki', expr: 'happy', text: 'さあさ、冷めないうちに！ ハマカゼFCに、かんぱーい！', fx: 'flash', sfx: 'cheer' },
      ].filter(Boolean),
      next: () => TransferMarket(),
    });
  }

  // ---------------- TRANSFER MARKET ----------------
  const LISTED = [
    { from: 'yamaoroshi', id: 'yukimaru', fee: 40, sal: 20, reason: '契約満了。「もっとボールに触れるチームへ」' },
    { from: 'shiomi', id: 'kaoru', fee: 30, sal: 15, reason: '店を息子に任せ、上を目指したい' },
  ];
  function TransferMarket() {
    const s = { t: 0, phase: 'leave', idx: 0, sel: 0, log: [] };
    // players asking to leave: benched too long, or ready to hang up the boots
    const reqs = State.roster.filter((p) => (State.morale[p.id] ?? 60) < 40 || (p.age && p.age >= 80)).map((p) => ({ p, why: p.age >= 80 ? '「そろそろ、引退を考えとる」' : '「もっと試合に出たい。移籍させてほしい」' }));
    const cands = () => State.freeAgents.filter((id) => faDef(id)).map((id) => ({ def: faDef(id), fee: 0, sal: faDef(id).sal, from: null, reason: (State.departed.some((d) => d.id === id) ? '古巣に戻りたがっている' : 'フリー。入団を希望している') }))
      .concat((State.seasonNo > 1 ? State.listed || [] : LISTED).filter((l) => !State.roster.some((q) => q.id === l.id) && !(State.bought || []).includes(l.id)).map((l) => ({ def: Object.assign({ local: false, growth: 0.9 }, League.clubById(l.from).roster().find((q) => q.id === l.id)), fee: l.fee, sal: l.sal, from: l.from, reason: l.reason })));
    const destinationFor = (p) => {
      const avg = (p.stats.spd + p.stats.sht + p.stats.pas + p.stats.def + p.stats.sta) / 5;
      if ((p.age && p.age >= 55)) return { kind: 'staff', text: p.name + 'はクラブに残り、ジュニアチームのコーチになった。「ときどき、トップの練習も見に来るぞ」' };
      if (avg >= 44) { const c = pick(League.clubsForTier(State.tier)); return { kind: 'rival', club: c.id, text: p.name + 'は' + c.name + 'へ移籍した。来季、敵として再会する…。' }; }
      return { kind: 'away', text: p.name + 'は町を出た。「いつか、もっとうまくなって戻ってくるよ」' };
    };
    s.enter = () => { Sound.bgm('hub'); Save.write('market'); if (!reqs.length) s.phase = 'sign'; };
    const cardRect = (i) => ({ x: 10, y: 60 + (i - s.off) * 30, w: 200, h: 28 });
    s.off = 0;
    const VIS = 6;
    const scroll = (n) => { s.off = clamp(s.sel - (VIS - 2), 0, Math.max(0, n - VIS)); };
    s.update = (dt) => {
      s.t += dt;
      if (s.flash) { s.flash.t += dt; if (s.flash.t > 2) s.flash = null; }
      if (s.phase === 'leave') {
        const rq = reqs[s.idx];
        const keepCost = 10;
        const act = (keep) => {
          if (keep) { if (State.budget < keepCost) { Sound.play('cancel'); s.flash = { text: '予算が足りない', t: 0 }; return; } State.budget -= keepCost; State.morale[rq.p.id] = 60; s.log.push(rq.p.name + 'を引き止めた（-' + keepCost + '万円）'); Sound.play('select'); }
          else {
            const gks = State.roster.filter((q) => q.pos === 'GK').length;
            if (State.roster.length <= 11 || (rq.p.pos === 'GK' && gks <= 1)) { State.morale[rq.p.id] = 45; s.log.push(rq.p.name + 'は「' + (rq.p.pos === 'GK' && gks <= 1 ? 'GKがいなくなる' : '人数が足りない') + 'なら、もう1年だけ」と残ってくれた'); Sound.play('page'); s.idx++; if (s.idx >= reqs.length) s.phase = 'sign'; return; }
            const d = destinationFor(rq.p);
            State.roster = State.roster.filter((q) => q !== rq.p); State.lineup = State.lineup.map((id) => (id === rq.p.id ? null : id));
            State.departed.push({ id: rq.p.id, name: rq.p.name, dest: d.kind, club: d.club, season: State.seasonNo, p: JSON.parse(JSON.stringify(rq.p)) });
            fillLineup();
            if (d.kind === 'staff') State.staff.push(rq.p.id);
            s.log.push(d.text); Sound.play('page');
          }
          s.idx++;
          if (s.idx >= reqs.length) s.phase = 'sign';
        };
        if (State.auto && s.t > 1) { act(false); return; }
        if (Input.hit('left') || Input.hit('c1') || E.clickedIn({ x: 250, y: 200, w: 106, h: 24 })) act(true);
        else if (Input.hit('right') || Input.hit('c2') || E.clickedIn({ x: 360, y: 200, w: 106, h: 24 })) act(false);
        return;
      }
      if (s.phase === 'sign') {
        const list = cands();
        if (Input.hit('up')) { s.sel = (s.sel + list.length) % (list.length + 1); Sound.play('cursor'); }
        if (Input.hit('down')) { s.sel = (s.sel + 1) % (list.length + 1); Sound.play('cursor'); }
        scroll(list.length);
        list.forEach((c, i) => { if (i >= s.off && i < s.off + VIS && E.clickedIn(cardRect(i))) { s.sel = i; Sound.play('cursor'); } });
        const doneR = { x: 10, y: 60 + Math.min(VIS, list.length) * 30 + 4, w: 200, h: 22 };
        if (E.clickedIn(doneR)) s.sel = list.length;
        const c = list[s.sel];
        const buy = () => {
          const cost = c.fee + c.sal;
          if (State.roster.length >= SQUAD_MAX) { s.flash = { text: '選手枠がいっぱい（' + SQUAD_MAX + '人）', t: 0 }; Sound.play('cancel'); return; }
          if (State.budget < cost) { s.flash = { text: '予算が足りない', t: 0 }; Sound.play('cancel'); return; }
          State.budget -= cost; signPlayer(c.def, c.from); s.log.push(c.def.name + 'を獲得（-' + cost + '万円）'); Sound.play('levelup'); Game.doFlash(0.3);
          s.sel = 0;
        };
        if (State.auto && s.t > 1) { s.phase = 'summary'; s.t = 0; return; }
        if (c && (Input.hit('ok') || E.clickedIn({ x: 250, y: 226, w: 214, h: 24 }))) buy();
        else if (!c && (Input.hit('ok') || E.clickedIn(doneR))) { s.phase = 'summary'; s.t = 0; Sound.play('select'); }
        return;
      }
      if (s.phase === 'summary' && s.t > 1 && (okPressed() || (State.auto && s.t > 2))) Game.goto(Credits(), 'iris');
    };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 6, 4, 150, 24, 'crimson');
      text(g, '移籍市場', 16, 9, { size: 14, color: '#ffffff' });
      panel(g, 160, 4, 314, 24, 'dark');
      text(g, '予算 ' + State.budget + '万円　選手 ' + State.roster.length + '／' + SQUAD_MAX + '人', 170, 10, { size: 10, color: '#ffd24a' });
      if (s.phase === 'leave') {
        const rq = reqs[s.idx];
        text(g, '退団の申し出（' + (s.idx + 1) + '／' + reqs.length + '）', 12, 40, { size: 10, color: '#ffb0a0' });
        panel(g, 10, 56, 460, 200, 'paper');
        g.fillStyle = '#e8d6ae'; g.fillRect(20, 66, 96, 96);
        drawPortrait(g, rq.p.id, 'sad', 20, 66, 2);
        text(g, rq.p.full || rq.p.name, 126, 68, { size: 14, color: '#2a1a24' });
        text(g, rq.p.pos + '　やる気 ' + (State.morale[rq.p.id] ?? 60) + '　' + (State.benchWeeks[rq.p.id] || 0) + '試合連続で出番なし', 126, 88, { size: 9, color: '#6d4f3a' });
        wrap(g, rq.why, 330, 11).forEach((l, i) => text(g, l, 126, 108 + i * 14, { size: 11, color: '#2a1a24' }));
        const d = destinationFor(rq.p);
        text(g, '送り出すと：' + (d.kind === 'staff' ? 'クラブにコーチとして残る' : d.kind === 'rival' ? 'ライバルクラブへ移籍する' : '町を出る（いつか戻るかも）'), 20, 172, { size: 9, color: '#2f86c4' });
        text(g, rq.p.age >= 80 ? '引き止めると：予算 -10万円、もう1年だけ現役を続けてくれる' : '引き止めると：予算 -10万円、やる気が戻る。ただし出番の問題は残る', 20, 186, { size: 9, color: '#6d4f3a' });
        panel(g, 250, 200, 106, 24, E.hoverIn({ x: 250, y: 200, w: 106, h: 24 }) ? 'gold' : 'sky'); text(g, '← 引き止める', 303, 206, { size: 9, align: 'center', color: '#10304f' });
        panel(g, 360, 200, 106, 24, E.hoverIn({ x: 360, y: 200, w: 106, h: 24 }) ? 'gold' : 'crimson'); text(g, '送り出す →', 413, 206, { size: 9, align: 'center', color: '#ffffff' });
        if (s.flash) text(g, s.flash.text, 250, 232, { size: 9, color: '#e0474c' });
      } else if (s.phase === 'sign') {
        const list = cands();
        text(g, '獲得候補', 12, 40, { size: 10, color: '#9fdcff' });
        if (s.off > 0) text(g, '▲', 204, 48, { size: 8, color: '#9fdcff' });
        if (s.off + VIS < list.length) text(g, '▼ ほか' + (list.length - s.off - VIS) + '人', 206, 40, { size: 8, align: 'right', color: '#9fdcff' });
        list.forEach((c, i) => {
          if (i < s.off || i >= s.off + VIS) return;
          const r = cardRect(i), sel = s.sel === i;
          panel(g, r.x + (sel ? 4 : 0), r.y, r.w, r.h, sel ? 'gold' : 'paper');
          g.drawImage(Art.sprite(c.def.look, 'down', 'walk1'), r.x + 4 + (sel ? 4 : 0), r.y + 3);
          text(g, c.def.name + '　' + c.def.pos, r.x + 24 + (sel ? 4 : 0), r.y + 3, { size: 9, color: '#2a1a24' });
          text(g, (c.from ? League.clubById(c.from).short + 'から' : 'フリー') + '　' + (c.fee + c.sal) + '万円', r.x + 24 + (sel ? 4 : 0), r.y + 15, { size: 8, color: '#6d4f3a' });
        });
        const doneR = { x: 10, y: 60 + Math.min(VIS, list.length) * 30 + 4, w: 200, h: 22 };
        panel(g, doneR.x + (s.sel === list.length ? 4 : 0), doneR.y, doneR.w, doneR.h, s.sel === list.length ? 'gold' : 'dark');
        text(g, '移籍市場を閉じる', doneR.x + 100, doneR.y + 5, { size: 9, align: 'center', color: s.sel === list.length ? '#2a1a24' : '#ffffff' });
        const c = list[s.sel];
        panel(g, 218, 36, 256, 222, 'paper');
        if (c) {
          const d = c.def;
          g.fillStyle = '#e8d6ae'; g.fillRect(226, 44, 72, 72);
          drawPortrait(g, d.id, 'normal', 226, 44, 1.5);
          if (d.nick) text(g, '「' + d.nick + '」', 304, 44, { size: 8, color: '#e0474c' });
          text(g, d.full || d.name, 304, 56, { size: 11, color: '#2a1a24' });
          text(g, (d.age ? d.age + '歳 ' : '') + d.pos + '　' + (d.local ? '地元出身' : 'よそ者'), 304, 72, { size: 8, color: '#6d4f3a' });
          wrap(g, c.reason, 164, 8).slice(0, 2).forEach((l, i) => text(g, l, 304, 86 + i * 10, { size: 8, color: '#2f86c4' }));
          STAT_KEYS.forEach((k, i) => {
            const y = 122 + i * 12;
            text(g, STAT_NAMES[k], 228, y, { size: 8, color: '#2a1a24' });
            drawGrade(g, 280, y, d.stats[k], 11);
            statBar(g, 294, y + 1, 140, d.stats[k], STAT_COLORS[k]);
            text(g, String(d.stats[k]), 466, y, { size: 8, align: 'right', color: '#2a1a24' });
          });
          const rv = rivalsFor(d);
          const notes = ['移籍金 ' + c.fee + '＋給料 ' + c.sal + '＝' + (c.fee + c.sal) + '万円',
            rv.length ? '先発の' + rv.slice(0, 2).join('・') + (rv.length > 2 ? 'ら' : '') + 'と競争（出番が減るとやる気↓）' : 'このポジションは層が薄い',
            d.local ? '地元出身：ホームの観客が増える' : 'よそ者：地元比率が下がると観客が減る'];
          notes.forEach((l, i) => text(g, '・' + l, 228, 186 + i * 12, { size: 8, color: i === 1 && rv.length ? '#e0474c' : '#2a1a24' }));
          panel(g, 250, 226, 214, 24, E.hoverIn({ x: 250, y: 226, w: 214, h: 24 }) ? 'gold' : 'sky');
          text(g, 'Z / クリック：獲得する', 357, 232, { size: 9, align: 'center', color: '#10304f' });
        } else {
          text(g, 'ここまでの動き', 228, 46, { size: 10, color: '#10304f' });
          s.log.slice(-10).forEach((l, i) => wrap(g, '・' + l, 236, 8).slice(0, 1).forEach((ll) => text(g, ll, 228, 64 + i * 13, { size: 8, color: '#2a1a24' })));
        }
        if (s.flash) text(g, s.flash.text, 250, 214, { size: 9, color: '#e0474c' });
      } else {
        panel(g, 40, 40, 400, 210, 'paper');
        text(g, '移籍市場の結果', W / 2, 48, { size: 14, align: 'center', color: '#10304f' });
        (s.log.length ? s.log : ['今回は大きな動きはなかった']).slice(0, 12).forEach((l, i) => wrap(g, '・' + l, 370, 9).slice(0, 1).forEach((ll) => text(g, ll, 56, 72 + i * 14, { size: 9, color: '#2a1a24' })));
        if (s.t > 1) text(g, 'Z / クリック', 430, 238, { size: 8, align: 'right', color: '#6d4f3a', alpha: blink() });
      }
    };
    return s;
  }

  function Credits() {
    const s = { t: 0, fx: new Particles() };
    const T = State.season.table.hamakaze, rank = State.rank();
    const top = Object.entries(State.goals || {}).sort((a, b) => b[1] - a[1])[0];
    const nm = (id) => (State.roster.find((q) => q.id === id) || Data.HOME.concat(Data.FREE_AGENTS).find((q) => q.id === id) || faDef(id) || { name: id }).name;
    s.enter = () => {
      Sound.bgm('ending');
      State.history = State.history || [];
      if (!State.history.some((h) => h.no === State.seasonNo)) State.history.push({ no: State.seasonNo, rank, w: T.w, d: T.d, l: T.l, gf: T.gf, ga: T.ga });
      Save.write('recap');
    };
    s.update = (dt) => {
      s.t += dt; s.fx.update(dt);
      if (Math.random() < 0.2) s.fx.add({ x: rand(0, W), y: H + 4, vx: rand(-5, 5), vy: rand(-25, -12), life: rand(4, 8), size: rand(1, 2), color: pick(['#ffd24a', '#ffffff', '#9fdcff']), kind: 'star', shrink: false });
      if (s.t > 4 && (okPressed() || (State.auto && s.t > 6))) { Sound.play('select'); Game.goto(NewSeason(), 'iris'); }
      else if (s.t > 4 && Input.hit('back')) { Sound.stopBgm(1); Game.goto(Title(), 'iris'); }
    };
    s.draw = (g) => {
      const tw = Art.town('dusk');
      g.drawImage(tw.sky, 0, 0);
      g.fillStyle = 'rgba(16,24,46,0.55)'; g.fillRect(0, 0, W, H);
      s.fx.draw(g);
      const a = clamp(s.t / 1.2, 0, 1);
      text(g, 'ハマカゼFC', W / 2, 22, { size: 30, align: 'center', color: '#ffffff', outline: '#10304f', outlineW: 2, alpha: a });
      text(g, 'シーズン' + State.seasonNo + '　おつかれさま', W / 2, 58, { size: 12, align: 'center', color: '#ffd24a', alpha: a });
      const k = clamp((s.t - 1) / 1, 0, 1);
      panel(g, 50, 80, 380, 120, 'dark');
      g.globalAlpha = k;
      text(g, 'あなたのシーズン' + State.seasonNo, W / 2, 86, { size: 10, align: 'center', color: '#9fdcff' });
      text(g, leagueName() + ' ' + rank + '位　' + T.w + '勝' + T.d + '分' + T.l + '敗　得点' + T.gf + '・失点' + T.ga, W / 2, 104, { size: 10, align: 'center', color: '#ffffff' });
      text(g, 'チーム得点王：' + (top ? nm(top[0]) + '（' + top[1] + '点）' : 'なし'), W / 2, 122, { size: 10, align: 'center', color: '#ffffff' });
      text(g, '加入：' + (State.joined.length ? State.joined.map(nm).join('・') : 'なし'), W / 2, 140, { size: 9, align: 'center', color: '#9fdcff' });
      text(g, '退団：' + (State.departed.length ? State.departed.map((d) => d.name).join('・') : 'なし'), W / 2, 156, { size: 9, align: 'center', color: '#ffb0a0' });
      text(g, '陣形：' + Data.FORMATIONS[State.formation].short + '　戦術：' + Data.TACTICS[State.tactic].name + '　予算残り ' + State.budget + '万円', W / 2, 176, { size: 9, align: 'center', color: '#c9d6e6' });
      g.globalAlpha = 1;
      const k2 = clamp((s.t - 2) / 1, 0, 1);
      g.globalAlpha = k2;
      const hist = (State.history || []).slice(-6).map((h) => 'S' + h.no + ' ' + (h.rank === 1 ? '優勝' : h.rank + '位')).join('　');
      text(g, 'これまでの歩み：' + hist, W / 2, 210, { size: 9, align: 'center', color: '#ffffff', outline: '#10304f' });
      text(g, '次はシーズン' + (State.seasonNo + 1) + '。ライバルも強くなってくる！', W / 2, 228, { size: 10, align: 'center', color: '#ffd24a', outline: '#10304f' });
      g.globalAlpha = 1;
      if (s.t > 4) text(g, 'Z / クリック：次のシーズンへ　X：タイトルへ（セーブ済み）', W / 2, H - 12, { size: 8, align: 'center', color: '#ffffff', alpha: blink() });
    };
    return s;
  }

  // ---------------- entry ----------------
  window.Scenes = {
    State,
    start(name, o) {
      State.auto = !!(o && o.auto);
      const map = { title: Title, intro: Intro, hub: () => Hub(true), roster: Roster, train: Training, tactics: Tactics, vs: Versus, pre: PreMatch,
        result: () => Result(fakeResult()), table: () => LeagueTable(() => Hub()), market: TransferMarket, seasonend: SeasonEnd, credits: Credits };
      return (map[name] || Title)();
    },
    result(r) { State.result = r; return Result(r); },
  };
  function fakeResult() {
    const recs = State.roster.map((p, i) => ({ id: p.id, name: p.name, team: 0, rec: { pass: 12, passOk: 9, shot: i > 4 ? 3 : 0, goal: i === 5 ? 1 : i === 6 ? 1 : 0, tackle: 4, tackleOk: 2, save: i === 0 ? 5 : 0, dist: 900 + i * 60, touch: 20, assist: i === 3 ? 1 : 0, dribble: 2 } }));
    return { score: [2, 1], recs, poss: [0.52, 0.48], shots: [9, 7], onTarget: [5, 4], goals: [{ team: 0, name: 'レオ', min: 23 }, { team: 1, name: '火野', min: 51 }, { team: 0, name: 'ハルキ', min: 84 }] };
  }
})();
