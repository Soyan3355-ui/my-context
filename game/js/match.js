/* ハマカゼFC — match scene: 7v7 simulation, manager orders, chance/pinch timing events */
(function () {
  'use strict';
  const { Game, Input, Ease, Particles, clamp, lerp, rand, randi, pick, dist, text, panel, W, H } = E;
  const P = Art.PITCH;
  const CX = P.x + P.w / 2, CY = P.y + P.h / 2;
  const GW = Art.GOAL_W;
  const TOP_H = 20, BOT_H = 50, VIEW_H = H - TOP_H - BOT_H;
  const HALF_LEN = 80; // real seconds per half
  // tactic tuning knobs (calibrated against docs/tactics_research.md by simulation)
  const TUNE = window.TACTIC_TUNE = Object.assign({ pressErr: 1.2, pressLine: 80, pressMark: 0, presser2: 1, longMF: 70, counterLine: 75, counterGoalSide: 5, possShort: 18 }, window.TACTIC_TUNE || {});

  const goalX = (t) => (t === 0 ? P.x + P.w : P.x);
  const ownGoalX = (t) => (t === 0 ? P.x : P.x + P.w);
  const dirX = (t) => (t === 0 ? 1 : -1);

  function portrait(id, expr) { return window.Portraits && Portraits.ids && Portraits.ids.includes(id) ? Portraits.get(id, expr) : null; }

  class Match {
    constructor(opts) {
      this.opts = opts;
      this.form = [Data.FORMATIONS[opts.formation || 'balance'], Data.FORMATIONS.balance];
      this.auto = !!opts.auto;
      this.fx = new Particles();
      this.fxTop = new Particles();
      this.players = [];
      const byId = (id) => Data.HOME.find((d) => d.id === id);
      const home = opts.home || Data.DEFAULT_LINEUP.map(byId), away = opts.away || Data.AWAY;
      const homeIds = home.map((d) => d.id);
      this.combos = Data.COMBOS.filter((c) => c.ids.every((id) => homeIds.includes(id)));
      this.comboCD = {}; this.traitCD = {}; this.comboShow = null;
      this.tac = [opts.tactic || 'possession', opts.awayTactic || 'long'];
      this.counterT = [0, 0]; this.chain = [0, 0]; this.tacToast = null;
      this.tstats = [{ counter: 0, pressWin: 0, long: 0, chainMax: 0 }, { counter: 0, pressWin: 0, long: 0, chainMax: 0 }];
      this.bench = (opts.bench || Data.HOME.filter((d) => d.bench)).slice();
      this.subsLeft = 3; this.subQueue = []; this.subbedOut = []; this.panel = null;
      this.tacTime = {}; this.noShotT = [0, 0]; this.pressOn = [true, true]; this.pressRollT = 0;
      this.ana = { behind: [0, 0, 0], shotLane: [0, 0, 0] }; this.memos = []; this.memoKeys = {}; this.memoT = 3;
      home.forEach((d, i) => this.players.push(this.mk(d, 0, i)));
      away.forEach((d, i) => this.players.push(this.mk(d, 1, i)));
      this.ball = { x: CX, y: CY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, lastKick: null, kickImm: 0, pass: null, shot: null, roll: 0, tried: new Set(), inNet: false };
      this.score = [0, 0];
      this.half = 1; this.clock = 0; this.state = 'intro'; this.stateT = 0;
      this.order = [null, null]; this.kiai = [60, 60];
      this.cam = { x: CX - W / 2, y: CY - VIEW_H / 2 - 30 };
      this.banners = []; this.popups = []; this.ticker = { lines: [], shown: 0 };
      this.meter = null; this.chanceCD = 8; this.pinchCD = 10;
      this.netShake = [0, 0];
      this.evening = 0; // 0 day .. 1 evening
      this.pitch = Art.buildPitch();
      this.boards = Art.buildBoards();
      this.poss = [0, 0];
      this.shots = [0, 0]; this.onTarget = [0, 0];
      this.crowdHype = 0.3;
      this.benchBubble = [null, null];
      this.kickoffTeam = 0;
      this.log = [];
      this.aiCoachT = 18;
      this.cutin = null;
      this.hover = -1;
      this.halftimeUI = null;
      this.moraleMul = [opts.morale || 1, 1];
      this.boost = opts.boost || {};
      this.slowmo = 1;
      this.result = null;
      this.endT = 0;
      window.__match = this;
    }

    mk(def, team, idx) {
      const st = Object.assign({}, def.stats);
      return {
        def, id: def.id, name: def.name, team, gk: def.pos === 'GK', slot: def.pos === 'GK' ? -1 : idx - 1,
        st, x: CX, y: CY, vx: 0, vy: 0, tx: CX, ty: CY, face: team === 0 ? 'right' : 'left', animT: Math.random() * 4,
        sta: 100, state: '', stT: 0, decT: 0, tackCD: 0, bubble: null, cheer: 0, runTarget: null,
        rec: { pass: 0, passOk: 0, shot: 0, goal: 0, tackle: 0, tackleOk: 0, save: 0, dist: 0, touch: 0, assist: 0, dribble: 0,
          longAtt: 0, longOk: 0, prAtt: 0, prOk: 0, thrAtt: 0, thrOk: 0, airW: 0, airL: 0, lost: 0, beaten: 0, onT: 0, faced: 0, distEarly: 0, distLate: 0, shotNear: 0 },
      };
    }

    // ---------------- helpers ----------------
    team(t) { return this.players.filter((p) => p.team === t); }
    gk(t) { return this.players.find((p) => p.team === t && p.gk); }
    stat(p, k) {
      let v = p.st[k];
      if (p.team === 0) {
        v *= this.moraleMul[0];
        if (this.boost[k]) v += this.boost[k];
        const id = p.id;
        if (this.combo('ayashii') && (id === 'kawataro' || id === 'mask') && k === 'def') v += 6;
        if (this.combo('kaze') && (id === 'tsubame' || id === 'shizuku') && (k === 'spd' || k === 'pas')) v += 5;
        if (this.combo('shitei') && id === 'haruki' && k === 'spd') v += 5;
        if (this.combo('okan') && id === 'ponta' && k === 'def') v += 10;
        if (this.combo('ace') && (id === 'leo' || id === 'hikaru') && k === 'sht') v += 8;
        if (this.combo('bonsai') && (id === 'kazuha' || id === 'mame') && k === 'pas') v += 8;
        if (id === 'ponta' && this.pontaAwake) v += 10;
        if (id === 'hikaru' && (k === 'sht' || k === 'spd')) v += Math.round(this.crowdHype * 10);
      }
      return v;
    }
    tacOf(t) { return this.tac[t]; }
    // team realization of its current tactic: how well the eleven understand the plan (0.5..1)
    realize(t, tac) {
      tac = tac || this.tac[t];
      const ps = this.team(t);
      const avg = ps.reduce((a, p) => a + ((p.def.tacU && p.def.tacU[tac]) || 50), 0) / ps.length;
      return 0.5 + 0.5 * (avg / 100);
    }
    understands(p) { return ((p.def.tacU && p.def.tacU[this.tac[p.team]]) || 50) / 100; }
    bodyScore(p) { return p.def.look.body === 'big' ? 80 : p.def.look.body === 'small' ? 25 : 50; }
    scoreDiff(t) { return this.score[t] - this.score[1 - t]; }
    toast(textStr, color) { this.tacToast = { text: textStr, color: color || '#ffd24a', t: 0 }; }
    has(id) { return this.players.some((p) => p.team === 0 && p.id === id); }
    combo(id) { return this.combos.some((c) => c.id === id); }
    role(p) { return p.gk ? 'GK' : (this.form[p.team].roles || [])[p.slot] || 'MF'; }
    traitPop(p, name) {
      if (p.team !== 0) return;
      const now = Game.time;
      if (this.traitCD[p.id] && now - this.traitCD[p.id] < 6) return;
      this.traitCD[p.id] = now;
      this.popups.push({ x: p.x, y: p.y - 40, text: '★' + name, color: '#ffd24a', t: 0, size: 8, tag: true });
      Sound.play('coin', { vol: 0.35, pitch: 1.4 });
    }
    comboFx(id) {
      const c = this.combos.find((x) => x.id === id);
      if (!c) return;
      const now = Game.time;
      if (this.comboCD[id] && now - this.comboCD[id] < 18) return;
      this.comboCD[id] = now;
      this.comboShow = { c, t: 0 };
      Sound.play('levelup', { vol: 0.35 });
      this.tick('コンビ発動！「' + c.name + '」', c.kind === 'bad' ? '#ffb0a0' : '#ffd24a');
    }
    slotPos(p, kickoff) {
      if (p.gk) return [ownGoalX(p.team) + dirX(p.team) * 10, CY];
      const f = this.form[p.team].slots[p.slot] || [0.4, 0.5];
      let nx = f[0], ny = f[1];
      if (kickoff) nx = Math.min(nx, 0.44);
      const x = p.team === 0 ? P.x + nx * P.w : P.x + (1 - nx) * P.w;
      return [x, P.y + ny * P.h];
    }
    speedOf(p) {
      let s = 48 + this.stat(p, 'spd') * 0.62;
      s *= 0.72 + 0.28 * (p.sta / 100);
      if (p.team === 0 && this.order[0] && this.order[0].id === 'attack') s *= 1.05;
      return s;
    }
    say(p, txt, t = 1.3) { p.bubble = { text: txt, t, max: t }; }
    tick(line, color) { this.ticker.lines.push({ text: line, color: color || '#fff6e0', t: 0 }); if (this.ticker.lines.length > 4) this.ticker.lines.shift(); }
    banner(textStr, style = 'normal', dur = 1.6) { this.banners.push({ text: textStr, style, t: 0, dur }); }
    popup(x, y, str, color = '#fff', size = 10) { this.popups.push({ x, y, text: str, color, t: 0, size }); }
    carrierTeam() { return this.ball.owner ? this.ball.owner.team : this.ball.last ? this.ball.last.team : -1; }
    nearestOpp(p, maxD = 999) {
      let best = null, bd = maxD;
      for (const o of this.players) if (o.team !== p.team) { const d = dist(p.x, p.y, o.x, o.y); if (d < bd) { bd = d; best = o; } }
      return [best, bd];
    }
    laneBlock(ax, ay, bx, by, team) {
      let m = 999;
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      for (const o of this.players) {
        if (o.team === team) continue;
        const t = clamp(((o.x - ax) * dx + (o.y - ay) * dy) / L2, 0, 1);
        const d = dist(o.x, o.y, ax + dx * t, ay + dy * t);
        if (d < m) m = d;
      }
      return m;
    }

    // ---------------- flow ----------------
    enter() {
      this.placeKickoff(0, true);
      Sound.bgm('match');
      Sound.crowd(0.35);
      this.state = 'intro'; this.stateT = 0;
      this.cam.y = P.y + P.h - 40;
      this.tick('港FM実況：さあ、浜風グラウンドから練習試合をお届けします！', '#9fdcff');
    }
    placeKickoff(team, snap) {
      this.kickoffTeam = team;
      for (const p of this.players) {
        const [x, y] = this.slotPos(p, true);
        p.homeX = x; p.homeY = y;
        if (snap) { p.x = x; p.y = y; }
        p.tx = x; p.ty = y; p.state = ''; p.vx = p.vy = 0;
      }
      const taker = this.team(team).filter((p) => !p.gk).sort((a, b) => dist(a.homeX, a.homeY, CX, CY) - dist(b.homeX, b.homeY, CX, CY))[0];
      taker.homeX = CX - dirX(team) * 6; taker.homeY = CY;
      if (snap) { taker.x = taker.homeX; taker.y = taker.homeY; }
      this.kickTaker = taker;
      this.sp = null;
      const b = this.ball;
      Object.assign(b, { x: CX, y: CY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, pass: null, shot: null, inNet: false });
    }
    startPlay() {
      this.state = 'play'; this.stateT = 0;
      Sound.play('whistle');
      this.startSetPiece('kick', this.kickoffTeam, CX, CY);
      this.sp.taker = this.kickTaker;
    }

    update(dt, raw) {
      this.stateT += raw;
      this.fx.update(dt); this.fxTop.update(raw);
      for (const b of this.banners) b.t += raw;
      this.banners = this.banners.filter((b) => b.t < b.dur);
      for (const p of this.popups) p.t += raw;
      this.popups = this.popups.filter((p) => p.t < 1.2);
      for (const l of this.ticker.lines) l.t += raw;
      this.netShake[0] *= Math.pow(0.02, raw); this.netShake[1] *= Math.pow(0.02, raw);
      for (let i = 0; i < 2; i++) if (this.benchBubble[i]) { this.benchBubble[i].t -= raw; if (this.benchBubble[i].t <= 0) this.benchBubble[i] = null; }
      if (this.cutin) { this.cutin.t += raw; if (this.cutin.t > this.cutin.dur) this.cutin = null; }
      if (this.comboShow) { this.comboShow.t += raw; if (this.comboShow.t > 2.8) this.comboShow = null; }
      if (this.tacToast) { this.tacToast.t += raw; if (this.tacToast.t > 2.2) this.tacToast = null; }

      if (this.panel) { this.updatePanel(raw); return; }
      if (this.meter) { this.updateMeter(raw); }
      if (this.halftimeUI) { this.updateHalftime(raw); return; }

      // manager input
      if (this.state === 'play' && !this.meter) this.handleOrders();

      switch (this.state) {
        case 'intro': {
          const lineupT = this.half === 1 ? 5.2 : 0;
          if (this.half === 1 && this.stateT < lineupT && this.stateT > 0.5 && (Input.hit('ok') || Input.mouse.clicked)) this.stateT = lineupT;
          if (this.stateT > lineupT + 0.4 && !this.introBanner) { this.introBanner = true; this.banner('KICK OFF!', 'big', 1.8); }
          if (this.stateT > lineupT + 2.1) this.startPlay();
          break;
        }
        case 'play': this.simulate(dt); break;
        case 'goal':
          this.simulate(dt, true);
          if (this.stateT > 3.4) { this.state = 'reset'; this.stateT = 0; this.placeKickoff(this.kickoffTeam, false); }
          break;
        case 'reset':
          this.moveAll(dt, true);
          if (this.stateT > 1.6) this.startPlay();
          break;
        case 'halfend':
          this.moveAll(dt * 0.4, false);
          if (this.stateT > 2.6) this.openHalftime();
          break;
        case 'fulltime':
          this.moveAll(dt * 0.3, false);
          if (this.stateT > 2.4 && (Input.hit('ok') || Input.mouse.clicked || this.auto && this.stateT > 5)) this.finish();
          break;
      }
      this.updateCamera(raw);
      // crowd ambience
      this.crowdHype = lerp(this.crowdHype, this.targetHype(), raw * 1.5);
      Sound.crowd(clamp(this.crowdHype, 0, 1));
    }
    targetHype() {
      const b = this.ball;
      if (this.state === 'goal') return 1;
      const dg = Math.min(Math.abs(b.x - P.x), Math.abs(b.x - P.x - P.w));
      return 0.3 + clamp(1 - dg / 250, 0, 1) * 0.35 + (this.meter ? 0.2 : 0);
    }

    handleOrders() {
      if (Input.hit('c5') || E.clickedIn(this.benchRect())) { this.openPanel(); return; }
      const ords = Data.ORDERS;
      for (let i = 0; i < 4; i++) {
        const r = this.orderRect(i);
        const hit = Input.hit('c' + (i + 1)) || E.clickedIn(r);
        if (hit) this.issueOrder(0, ords[i]);
      }
      if (this.auto && Math.random() < 0.006) { const o = pick(ords); if (this.kiai[0] >= o.cost + 20) this.issueOrder(0, o); }
    }
    orderRect(i) { return { x: 4 + i * 74, y: H - 34, w: 71, h: 30 }; }
    benchRect() { return { x: 300, y: H - 34, w: 54, h: 30 }; }
    issueOrder(team, o) {
      if (this.kiai[team] < o.cost) { if (team === 0) { Sound.play('miss_timing', { vol: 0.5 }); this.tick('ナギサ「監督、声が枯れてますよ！少し待って！」', '#ffb0a0'); } return; }
      this.kiai[team] -= o.cost;
      this.order[team] = { id: o.id, t: o.dur, dur: o.dur };
      this.benchBubble[team] = { text: team === 0 ? o.shout : pick(['押し込めぇ！', '鉄の意地を見せろ！', '踏ん張れぇ！']), t: 2.2 };
      if (team === 0) {
        Sound.play('command');
        Game.addShake(1.5, 0.15);
        const replies = ['おう！', 'はい！', '了解！', 'まかせろ！', 'うっす！'];
        this.team(0).filter((p) => !p.gk).sort(() => Math.random() - 0.5).slice(0, 3).forEach((p, i) => setTimeout(() => this.say(p, pick(replies), 1.0), 120 + i * 90));
        this.tick('監督の指示！「' + o.shout + '」', '#ffd24a');
      } else {
        Sound.play('command', { pitch: 0.8, vol: 0.6 });
        this.tick('ヤマオロシ 鬼瓦監督がゲキを飛ばす！', '#ff9a8a');
      }
    }

    // ---------------- simulation ----------------
    simulate(dt, frozenClock) {
      if (dt <= 0) return;
      const b = this.ball;
      if (!frozenClock && !this.meter) {
        this.clock += dt;
        const ct = this.sp ? this.sp.team : this.carrierTeam(); if (ct >= 0) this.poss[ct] += dt;
        this.tacTime[this.tac[0]] = (this.tacTime[this.tac[0]] || 0) + dt;
        for (let t = 0; t < 2; t++) if (ct !== t) this.noShotT[t] = (this.noShotT[t] || 0); this.noShotT[ct >= 0 ? ct : 0] += dt;
        for (let t = 0; t < 2; t++) {
          this.kiai[t] = Math.min(100, this.kiai[t] + dt * 5.5);
          if (this.order[t]) { this.order[t].t -= dt; if (this.order[t].t <= 0) this.order[t] = null; }
        }
        this.chanceCD -= dt; this.pinchCD -= dt;
        for (let t = 0; t < 2; t++) if (this.counterT[t] > 0) this.counterT[t] -= dt;
        // pressing needs everyone to understand the triggers: re-roll who joins every second
        this.pressRollT -= dt; if (this.pressRollT <= 0) { this.pressRollT = 1; for (let t = 0; t < 2; t++) this.pressOn[t] = Math.random() < this.realize(t, 'press') + 0.05; }
        this.memoT -= dt; if (this.memoT <= 0) { this.memoT = 2; this.liveMemo(); }
        // a queued substitution goes on at a quiet moment if play has not stopped for a while
        if (this.subQueue.length && this.clock + (this.half - 1) * 1000 - this.subQueue[0].at > 8 && !b.shot && !this.sp && Math.abs(b.x - CX) < 200) this.applySubs();
        if (!this.opts.fixedTac && this.half === 2 && this.tac[1] === 'long' && this.score[1] < this.score[0] && this.clock > HALF_LEN * 0.3) {
          this.tac[1] = 'press';
          this.benchBubble[1] = { text: 'ハイプレスじゃあ！ 前から潰せぇ！', t: 2.6 };
          this.tick('ヤマオロシ、戦術を「ハイプレス」に切り替えた！', '#ff9a8a');
          this.toast('ヤマオロシ：ハイプレスに切り替え', '#ff9a8a');
        }
        this.aiCoachT -= dt;
        if (this.aiCoachT <= 0 && !this.order[1]) {
          this.aiCoachT = rand(16, 26);
          const diff = this.score[1] - this.score[0];
          const o = diff < 0 || (this.half === 2 && diff === 0) ? Data.ORDERS[0] : diff > 0 && this.half === 2 ? Data.ORDERS[1] : pick([Data.ORDERS[0], Data.ORDERS[2], Data.ORDERS[3]]);
          this.kiai[1] = 100; this.issueOrder(1, o);
        }
        if (this.clock >= HALF_LEN && !b.shot && !this.sp && !(b.pass && b.z > 4)) { this.endHalf(); return; }
        if (this.half === 2) {
          this.evening = clamp(this.clock / HALF_LEN * 1.3, 0, 1);
          if (this.clock > HALF_LEN * 0.7 && !this.pontaAwake && this.score[0] <= this.score[1] && this.has('ponta')) {
            this.pontaAwake = true;
            const pt = this.players.find((q) => q.team === 0 && q.id === 'ponta');
            pt.sta = 100; this.traitCD.ponta = -99; this.traitPop(pt, 'はらぺこ覚醒！');
            this.cutin = { id: 'ponta', expr: 'determined', t: 0, dur: 2.4, text: 'ポン太、腹ペコ覚醒！', color: '#f08a3a' };
            this.say(pt, '試合のあとの、たこ焼きのためにッ！', 2.2);
            this.tick('ポン太の目の色が変わった…！ はらぺこ覚醒だ！', '#ffd24a');
          }
          if (this.clock > HALF_LEN * 0.72 && !this.lateMusic) { this.lateMusic = true; Sound.bgm('match_late'); this.tick('試合は終盤！', '#ffd24a'); }
        }
      }
      b.kickImm -= dt;
      if (b.headCD > 0) b.headCD -= dt;
      if (this.sp) this.updateSetPiece(dt);
      this.aiTargets(dt);
      this.moveAll(dt, false);
      this.collide();
      this.updateBall(dt);
    }

    // projected x along team t's attacking direction
    proj(t, x) { return x * dirX(t); }
    // the furthest point attackers of team t may stand (offside line), as a world x
    offsideX(t) {
      const opp = this.team(1 - t).map((o) => this.proj(t, o.x)).sort((a, c) => c - a);
      const second = opp[1] !== undefined ? opp[1] : this.proj(t, CX);
      const line = Math.max(second, this.proj(t, this.ball.x), this.proj(t, CX));
      return line * dirX(t);
    }
    inOwnBox(t, x, y) {
      const gx = ownGoalX(t);
      return Math.abs(x - gx) < Art.BOX_W && Math.abs(y - CY) < Art.BOX_H / 2;
    }

    aiTargets(dt) {
      const b = this.ball, sp = this.sp;
      const possT = sp ? sp.team : this.carrierTeam();
      const loose = !b.owner && !sp;
      // loose ball chasers: one per team, whoever arrives first
      const chaser = [null, null];
      if (loose && !b.inNet && this.state === 'play') {
        const lead = b.z > 6 ? 0.55 : 0.35;
        const px = b.x + b.vx * lead, py = b.y + b.vy * lead;
        for (let t = 0; t < 2; t++) {
          let best = null, bt = 1e9;
          for (const p of this.team(t)) {
            if (p.state) continue;
            if (p.gk && !this.inOwnBox(t, px, py)) continue;
            if (b.pass && b.pass.to === p) { best = p; bt = -1; break; }
            if (b.lastKick === p && b.kickImm > 0) continue;
            const tt = dist(p.x, p.y, px, py) / this.speedOf(p);
            if (tt < bt) { bt = tt; best = p; }
          }
          chaser[t] = best;
        }
        this.chaser = chaser;
        this.chaseAt = [px, py];
      }
      // defensive roles
      let presser = null, cover = null;
      if (b.owner && !sp && !b.owner.gk) {
        const dT = 1 - b.owner.team;
        const ds = this.team(dT).filter((p) => !p.gk && !p.state).sort((a, c) => dist(a.x, a.y, b.x, b.y) - dist(c.x, c.y, b.x, b.y));
        const tac = this.tacOf(dT);
        const ballDeep = this.proj(dT, b.x) < this.proj(dT, CX) + 40; // ball in the defending team's half
        presser = ds[0]; cover = ds[1];
        if (tac === 'counter' && !ballDeep) { this.screen = ds[0]; presser = null; }
        else this.screen = null;
        const avgSta = this.team(dT).reduce((a, q) => a + q.sta, 0) / 11;
        const intensity = Math.min(1, avgSta / 60);
        const managingLead = this.scoreDiff(dT) > 0 && this.half === 2 && this.clock > HALF_LEN * 0.6;
        if (tac === 'press' && this.pressOn[dT] && intensity > 0.55 && !managingLead) {
          // the second presser only jumps when the ball is in the opponent's half (the pressing trap)
          const high = !ballDeep;
          this.presser2 = TUNE.presser2 && high ? ds[1] : null; cover = ds[this.presser2 ? 2 : 1]; this.pressMark = TUNE.pressMark && high ? ds[3] : null;
        }
        else { this.presser2 = null; this.pressMark = null; }
      } else { this.presser2 = null; this.pressMark = null; this.screen = null; }
      // attacking support (two nearest teammates offer passing angles)
      let supporters = [];
      if (b.owner && !b.owner.gk && !sp) {
        supporters = this.team(b.owner.team).filter((p) => p !== b.owner && !p.gk && !p.state).sort((a, c) => dist(a.x, a.y, b.x, b.y) - dist(c.x, c.y, b.x, b.y)).slice(0, this.tacOf(b.owner.team) === 'possession' ? 4 : this.tacOf(b.owner.team) === 'long' ? 2 : 3);
      }
      for (const p of this.players) {
        if (p.state) continue;
        const t = p.team;
        if (sp && sp.taker === p) { p.hurry = true; p.tx = sp.x - dirX(t) * (sp.type === 'throw' ? 0 : 5); p.ty = sp.y + (sp.type === 'throw' ? (sp.y < CY ? -3 : 3) : 0); p.run = true; continue; }
        if (p.gk) { this.gkTarget(p, chaser); continue; }
        if (b.owner === p) { this.carrierAI(p, dt); continue; }
        if (loose && chaser[t] === p) { p.tx = this.chaseAt[0]; p.ty = this.chaseAt[1]; p.run = true; continue; }
        if (b.pass && b.pass.to === p && !sp) { p.tx = lerp(b.pass.tx, b.x, 0.25); p.ty = lerp(b.pass.ty, b.y, 0.25); p.run = true; continue; }
        if (possT === t) this.attackPos(p, supporters.indexOf(p), dt);
        else if (b.owner && (p === this.presser2)) { const c = b.owner; const a = Math.atan2(c.y - CY, 0) || 1; p.tx = c.x - dirX(t) * 2; p.ty = c.y + (c.y < CY ? 8 : -8); p.run = true; }
        else if (b.owner && p === this.pressMark) {
          // press the nearest passing option
          const opt = this.team(b.owner.team).filter((q) => q !== b.owner && !q.gk).sort((a2, c) => dist(a2.x, a2.y, b.x, b.y) - dist(c.x, c.y, b.x, b.y))[0];
          if (opt) { p.tx = lerp(opt.x, b.x, 0.15); p.ty = lerp(opt.y, b.y, 0.15); p.run = true; } else this.defendPos(p, false, false);
        }
        else if (b.owner && p === this.screen) {
          // hold shape: stand between ball and goal at a distance, don't dive in
          const gx = ownGoalX(t), a = Math.atan2(CY - b.y, gx - b.x);
          p.tx = b.x + Math.cos(a) * 34; p.ty = b.y + Math.sin(a) * 34; p.run = false;
        }
        else this.defendPos(p, p === presser, p === cover);
        // set-piece etiquette: keep distance, and stay out of the box while the keeper holds the ball
        if (sp && t !== sp.team) {
          const d = dist(p.tx, p.ty, sp.x, sp.y);
          if (d < 44) { const a = Math.atan2(p.ty - sp.y, p.tx - sp.x); p.tx = sp.x + Math.cos(a) * 44; p.ty = sp.y + Math.sin(a) * 44; p.run = true; }
          if (sp.type === 'gk' || sp.type === 'goalkick') {
            const edge = ownGoalX(sp.team) + dirX(sp.team) * (Art.BOX_W + 14);
            if (this.proj(sp.team, p.tx) < this.proj(sp.team, edge)) p.tx = edge;
          }
        }
        p.tx = clamp(p.tx, P.x + 6, P.x + P.w - 6); p.ty = clamp(p.ty, P.y + 6, P.y + P.h - 6);
      }
      // presser tackles
      if (b.owner && this.state === 'play' && !this.meter && !sp) {
        for (const pr of [presser, this.presser2]) {
          if (!pr || pr.state || b.owner === null || b.owner.team === pr.team) continue;
          const c = b.owner;
          const d = dist(pr.x, pr.y, c.x, c.y);
          if (d < this.reach(pr) && pr.tackCD <= 0) this.tryTackle(pr, c, d);
        }
      }
    }

    attackPos(p, supIdx, dt) {
      const b = this.ball, t = p.team, dx = dirX(t);
      const f = this.form[t].slots[p.slot] || [0.4, 0.5];
      const ord = this.order[t] ? this.order[t].id : null;
      const ballP = this.proj(t, b.x) - this.proj(t, CX); // -300..300
      // team block steps up with the ball
      let hx = ownGoalX(t) + dx * (f[0] * P.w * 0.78 + 40) + dx * Math.max(-40, ballP * 0.55) + dx * 30;
      if (ord === 'attack') hx += dx * 45;
      if (ord === 'defend') hx -= dx * 40;
      const tac = this.tacOf(t), countering = this.counterT[t] > 0;
      if (tac === 'counter' && !countering) hx -= dx * 30;
      if (tac === 'press') hx += dx * 20;
      if (countering) hx += dx * 50;
      // width: spread out when in possession
      let hy = CY + (P.y + f[1] * P.h - CY) * (tac === 'possession' ? 1.3 : 1.2);
      hy = lerp(hy, b.y, 0.12);
      const wideMF = this.role(p) === 'MF' && Math.abs(f[1] - 0.5) > 0.3;
      const fwd = this.role(p) === 'FW' || (countering && wideMF) || (p.id === 'tsubame' && ballP > 20 && this.proj(t, b.x) > this.proj(t, p.x) - 40);
      if (tac === 'long' && this.role(p) === 'MF') { hx = lerp(hx, this.offsideX(t) - dx * TUNE.longMF, 0.5); }
      if (p.id === 'tsubame' && fwd && Math.random() < 0.002) this.traitPop(p, '朝刊ダッシュ');
      const ballAdv = ballP;
      if (fwd && ballAdv > -60) {
        // forwards alternate between dropping to receive and running in behind
        p.runPh = (p.runPh || Math.random() * 6) + dt;
        const inBehind = countering || tac === 'long' ? true : Math.sin(p.runPh * 0.9 + p.slot) > (tac === 'possession' ? 0.2 : -0.1);
        const line = this.offsideX(t);
        if (inBehind) { hx = line - dx * 6; hy = lerp(hy, CY + (f[1] - 0.5) * 120, 0.6); p.run = true; }
        else { hx = lerp(hx, b.x + dx * 30, 0.4); p.run = false; }
      } else p.run = false;
      // supporting angles for the two nearest teammates
      if (supIdx >= 0 && b.owner) {
        p.supT = (p.supT || 0) - dt;
        if (p.supT <= 0 || !p.sup) {
          p.supT = rand(0.5, 0.9);
          let best = null, bs = -1e9;
          const angs = supIdx === 0 ? [-0.7, 0.7, -1.4, 1.4] : supIdx === 1 ? [-2.2, 2.2, -0.35, 0.35] : [-1.1, 1.1, -2.6, 2.6];
          for (const a0 of angs) {
            const a = (dx > 0 ? 0 : Math.PI) + a0;
            const r = 58 + supIdx * 12;
            const sx = clamp(b.x + Math.cos(a) * r, P.x + 10, P.x + P.w - 10), sy = clamp(b.y + Math.sin(a) * r, P.y + 10, P.y + P.h - 10);
            let open = 99;
            for (const o of this.players) if (o.team !== t) open = Math.min(open, dist(o.x, o.y, sx, sy));
            const lane = this.laneBlock(b.x, b.y, sx, sy, t);
            const s = Math.min(open, 50) + Math.min(lane, 20) * 1.5 + this.proj(t, sx) * 0.05 - dist(p.x, p.y, sx, sy) * 0.15;
            if (s > bs) { bs = s; best = [sx, sy]; }
          }
          p.sup = best;
        }
        hx = lerp(hx, p.sup[0], 0.75); hy = lerp(hy, p.sup[1], 0.75);
        p.run = true;
      }
      // never offside while waiting for the ball
      const off = this.offsideX(t);
      if (this.proj(t, hx) > this.proj(t, off) - 3) hx = off - dx * 3;
      p.tx = hx; p.ty = hy;
    }

    defendPos(p, isPresser, isCover) {
      const b = this.ball, t = p.team, dx = dirX(t);
      const f = this.form[t].slots[p.slot] || [0.4, 0.5];
      const ord = this.order[t] ? this.order[t].id : null;
      const gx = ownGoalX(t);
      if (isPresser && b.owner) {
        // approach goal-side of the carrier, then jockey
        const c = b.owner;
        const a = Math.atan2(CY - c.y, gx - c.x);
        p.tx = c.x + Math.cos(a) * 6; p.ty = c.y + Math.sin(a) * 6; p.run = true;
        return;
      }
      if (isCover && b.owner) { p.tx = lerp(b.x, gx, 0.35); p.ty = lerp(b.y, CY, 0.35); p.run = true; return; }
      const ballP = this.proj(t, b.x) - this.proj(t, CX);
      // compact block that slides with the ball and drops when the ball is deep
      let hx = gx + dx * (f[0] * P.w * 0.62 + 34) + dx * clamp(ballP * 0.5, -60, 120) - dx * 12;
      const tac = this.tacOf(t), Rz = 0.6 + 0.4 * this.realize(t), sd = this.scoreDiff(t);
      if (tac === 'counter') hx -= dx * TUNE.counterLine * Rz * (sd < 0 ? 0.35 : 1);
      if (tac === 'press') hx += dx * TUNE.pressLine * Rz * (sd > 0 && this.half === 2 ? 0.6 : 1);
      if (sd > 0 && this.half === 2) hx -= dx * 18;
      if (tac === 'possession') hx += dx * 15;
      if (ord === 'attack') hx += dx * 35;
      if (ord === 'defend') hx -= dx * 45;
      // never let the defensive line stand behind the ball too far
      hx = dirX(t) > 0 ? Math.min(hx, Math.max(b.x - 14, gx + 30)) : Math.max(hx, Math.min(b.x + 14, gx - 30));
      let hy = lerp(P.y + f[1] * P.h, b.y, 0.3);
      hy = lerp(hy, CY, tac === 'counter' ? 0.32 : 0.15);
      // zonal marking: pick up the most dangerous attacker near my zone, stand goal-side
      let mark = null, md = 70;
      for (const o of this.players) {
        if (o.team === t || o.gk || o === b.owner) continue;
        const d = dist(o.x, o.y, hx, hy);
        if (d < md) { md = d; mark = o; }
      }
      if (mark) {
        const a = Math.atan2(CY - mark.y, gx - mark.x);
        const mx = mark.x + Math.cos(a) * 14, my = mark.y + Math.sin(a) * 14;
        hx = lerp(hx, mx, 0.7); hy = lerp(hy, my, 0.7);
        p.run = md < 50;
      } else p.run = false;
      p.tx = hx; p.ty = hy;
    }

    gkTarget(p, chaser) {
      const b = this.ball, t = p.team, gx = ownGoalX(t), dx = dirX(t);
      const sp = this.sp;
      if (b.owner === p) {
        if (sp && sp.taker === p) { p.tx = p.x; p.ty = p.y; return; }
        this.carrierAI(p, 1 / 60); return;
      }
      if (b.shot && b.shot.team !== t) {
        const eta = (gx - b.x) / (b.vx || 0.001);
        if (eta > 0 && eta < 0.32 && p.state !== 'dive') {
          const targetY = b.shot.save ? b.y + b.vy * eta : b.shot.ty + (b.shot.ty > p.y ? -18 : 18) * rand(0.6, 1.2);
          p.state = 'dive'; p.stT = 0.9; p.diveFrom = [p.x, p.y]; p.diveTo = [gx + dx * 8, clamp(targetY, CY - GW / 2 - 6, CY + GW / 2 + 6)]; p.diveT = 0;
          p.diveUp = p.diveTo[1] < p.y;
        }
        p.tx = gx + dx * 10; p.ty = clamp(b.shot.ty, CY - GW / 2, CY + GW / 2);
        return;
      }
      if (sp && sp.team !== t) { p.tx = gx + dx * 12; p.ty = clamp(lerp(sp.y, CY, 0.6), CY - GW / 2 + 4, CY + GW / 2 - 4); p.run = false; return; }
      if (!sp && chaser[t] === p) { p.tx = this.chaseAt[0]; p.ty = this.chaseAt[1]; p.run = true; return; }
      if (b.owner && b.owner.team !== t && !sp && Math.abs(b.x - gx) < 60 && Math.abs(b.y - CY) < 50) {
        p.tx = b.x; p.ty = b.y; p.run = true;
        if (dist(p.x, p.y, b.x, b.y) < 11 && p.tackCD <= 0 && this.state === 'play' && !this.meter) this.gkSmother(p, b.owner);
        return;
      }
      // narrow the angle
      const k = clamp(Math.abs(b.x - gx) / P.w, 0, 1);
      p.tx = gx + dx * (10 + (1 - k) * 10);
      p.ty = clamp(lerp(b.y, CY, 0.55), CY - GW / 2 + 4, CY + GW / 2 - 4);
      p.run = false;
    }

    carrierAI(p, dt) {
      const b = this.ball, t = p.team, dx = dirX(t);
      p.decT -= dt || 0;
      const [, pressure] = this.nearestOpp(p);
      if (p.gk) {
        // keeper with the ball at feet (back-pass etc): play it out quickly
        p.tx = p.x; p.ty = p.y;
        if (p.decT <= 0) this.gkDistribute(p, false);
        return;
      }
      const tac = this.tacOf(t), countering = this.counterT[t] > 0;
      const oppPress = this.tacOf(1 - t) === 'press' && pressure < 16;
      // long-ball sides hit it first time when someone closes them down
      if (tac === 'long' && pressure < 22 && p.decT > 0.12) p.decT = 0.12;
      if (p.decT > 0 && pressure > (oppPress ? 20 : 14)) { this.dribbleDir(p, dx); return; }
      p.decT = countering ? rand(0.15, 0.3) : tac === 'possession' ? rand(0.3, 0.55) : rand(0.28, 0.55);
      if (oppPress) p.decT *= 0.5;
      const gxT = goalX(t);
      const dGoal = dist(p.x, p.y, gxT, CY);
      const ord = this.order[t] ? this.order[t].id : null;
      let best = { k: 'drib', s: 30 + this.stat(p, 'spd') * 0.25 - (pressure < 18 ? 22 : 0) + rand(0, 14) + (countering && pressure > 30 ? 20 : 0) - (tac === 'possession' && this.proj(t, p.x) < this.proj(t, CX) + 130 ? 10 : 0) };
      // shoot
      const range = 100 + this.stat(p, 'sht') * 0.8 + (ord === 'shoot' ? 55 : 0) + (p.id === 'leo' ? 16 : 0);
      const patient = tac === 'possession' && this.noShotT[t] < 20;
      if (dGoal < range * (patient ? 0.85 : 1) && Math.abs(p.y - CY) < 110) {
        let s = 22 + (range - dGoal) * 0.55 + (pressure < 20 ? 10 : 0) + (dGoal < 110 ? 90 : 0) + rand(0, 20);
        if (ord === 'shoot') s += 25;
        if (s > best.s) best = { k: 'shoot', s };
      }
      // breakaway: nobody left between the carrier and the keeper → go for goal
      if (dGoal < 280 && !this.players.some((o) => o.team !== t && !o.gk && this.proj(t, o.x) > this.proj(t, p.x) - 6 && Math.abs(o.y - p.y) < 70)) {
        if (dGoal < 150) { const s1 = 150 + rand(0, 20); if (s1 > best.s) best = { k: 'shoot', s: s1 }; }
        else best = { k: 'drib', s: 999 };
      }
      // cross from wide areas near the byline
      const toLine = Math.abs(gxT - p.x);
      if (Math.abs(p.y - CY) > 70 && toLine < 130) {
        const inBox = this.team(t).filter((m) => m !== p && !m.gk && Math.abs(m.x - gxT) < Art.BOX_W + 10 && Math.abs(m.y - CY) < 70);
        if (inBox.length) {
          const m = inBox.sort((a, c) => this.proj(t, c.x) - this.proj(t, a.x))[0];
          const s = 45 + (130 - toLine) * 0.5 + inBox.length * 10 + rand(0, 20) + (tac === 'possession' && this.noShotT[t] > 20 ? 15 : 0);
          if (s > best.s) best = { k: 'cross', s, m };
        }
      }
      // passes (to feet, or into space ahead of a runner)
      const off = this.offsideX(t);
      for (const m of this.team(t)) {
        if (m === p || m.gk || m.state) continue;
        const d = dist(p.x, p.y, m.x, m.y);
        if (d < 24 || d > 300) continue;
        if (this.combo('ace') && ((p.id === 'leo' && m.id === 'hikaru') || (p.id === 'hikaru' && m.id === 'leo'))) continue;
        const [, open] = this.nearestOpp(m);
        const lane = this.laneBlock(p.x, p.y, m.x, m.y, t);
        const prog = (m.x - p.x) * dx;
        let s = 20 + prog * 0.3 + Math.min(open, 60) * 0.55 - (lane < 10 ? 60 : lane < 18 ? 22 : 0) - Math.max(0, d - 170) * 0.2;
        if (pressure < 18) s += 18;
        // line-breaking passes: opponents taken out of the game by the pass
        if (lane >= 14 && prog > 15) {
          let broken = 0;
          for (const o of this.players) if (o.team !== t && !o.gk && this.proj(t, o.x) > this.proj(t, p.x) + 4 && this.proj(t, o.x) < this.proj(t, m.x) - 4) broken++;
          s += Math.min(3, broken) * (tac === 'possession' ? 8 * this.realize(t) : 4);
        }
        if (tac === 'possession') { const Rz = this.realize(t); if (d < 130) s += TUNE.possShort * Rz; if (d > 200) s -= 25 * Rz; if (prog < 0 && pressure < 16) s += (10 - prog * 0.1) * Rz; }
        if (tac === 'long') s -= 8;
        if (countering) { if (prog > 20) s += 30; if (prog < 0) s -= 40; }
        if (ord === 'pass') s += 18;
        if (p.id === 'leo') s -= 14;
        if (p.id === 'kazuha') s += 8;
        s += rand(0, 16);
        if (s > best.s) best = { k: 'pass', s, m };
        // through ball
        if (m.run && prog > 10) {
          const tx = clamp(m.x + dx * 45, P.x + 10, P.x + P.w - 10), ty = m.y;
          if (this.proj(t, m.x) <= this.proj(t, off) + 1) {
            const tl = this.laneBlock(p.x, p.y, tx, ty, t);
            let open2 = 99; for (const o of this.players) if (o.team !== t && !o.gk) open2 = Math.min(open2, dist(o.x, o.y, tx, ty));
            let s2 = 18 + (tx - p.x) * dx * 0.35 + Math.min(open2, 50) * 0.6 - (tl < 10 ? 70 : tl < 16 ? 25 : 0) + (this.stat(p, 'pas') - 45) * 0.4 + rand(0, 16);
            if (p.id === 'kazuha') s2 += 12;
            if (countering) s2 += 35;
            if (tac === 'possession') s2 -= 6;
            if (s2 > best.s) best = { k: 'through', s: s2, m, tx, ty };
          }
        }
      }
      // long ball: skip midfield and hit the most advanced forward
      if (tac === 'long' && this.proj(t, p.x) < this.proj(t, CX) + 80 && best.k !== 'shoot') {
        const tgt = this.team(t).filter((m) => m !== p && !m.gk && this.role(m) === 'FW').sort((a, c) => this.proj(t, c.x) - this.proj(t, a.x))[0];
        if (tgt && dist(p.x, p.y, tgt.x, tgt.y) > 110) {
          const s = 44 + 18 * this.realize(t) + (this.role(p) === 'DF' ? 18 : 0) + rand(0, 16) + (pressure < 22 ? 30 : 0);
          if (s > best.s) best = { k: 'long', s, m: tgt };
        }
      }
      if (best.k === 'shoot') this.wantShoot(p);
      else if (best.k === 'long') {
        const fw = best.m, oppDefs = this.team(1 - t).filter((o) => !o.gk);
        // space between the opponent's last line and their penalty box decides whether a ball in behind is on
        const boxEdge = goalX(t) - dx * (Art.BOX_W + 6);
        const space = (this.proj(t, boxEdge) - this.proj(t, this.offsideX(t)));
        const slowest = oppDefs.filter((o) => this.role(o) === 'DF').sort((a2, c) => this.stat(a2, 'spd') - this.stat(c, 'spd'))[0];
        const behind = space > 90 && slowest && this.stat(fw, 'spd') > this.stat(slowest, 'spd') - 4;
        const ltx = behind ? this.offsideX(t) + dx * Math.min(60, space - 40) : fw.x - dx * 10;
        if (behind) { fw.burst = 1.6; }
        this.doPass(p, fw, true, ltx, fw.y);
        if (this.ball.pass) this.ball.pass.behind = behind; this.ball.vz = 150; this.tstats[t].long++; if (Math.random() < 0.35) this.tick((t === 0 ? 'ハマカゼ' : 'ヤマオロシ') + '、前線へロングボール！', t === 0 ? '#9fdcff' : '#ff9a8a'); }
      else if (best.k === 'pass') this.doPass(p, best.m);
      else if (best.k === 'through') { this.doPass(p, best.m, false, best.tx, best.ty); this.ball.pass.through = true; p.rec.thrAtt++; }
      else if (best.k === 'cross') this.doCross(p, best.m);
      else this.dribbleDir(p, dx);
    }

    dribbleDir(p, dx) {
      let ax = dx, ay = (CY - p.y) / 260;
      for (const o of this.players) {
        if (o.team === p.team) continue;
        const d = dist(p.x, p.y, o.x, o.y);
        if (d < 40 && d > 0.1) { const w = (40 - d) / 40; ax += ((p.x - o.x) / d) * w * 0.9; ay += ((p.y - o.y) / d) * w * 1.6; }
      }
      if (p.y < P.y + 24) ay += 0.8; if (p.y > P.y + P.h - 24) ay -= 0.8;
      if (ax * dx < 0.2) ax = dx * 0.2;
      const L = Math.hypot(ax, ay) || 1;
      p.tx = p.x + (ax / L) * 30; p.ty = p.y + (ay / L) * 30;
      p.run = true;
    }

    doPass(p, m, lofted, fx, fy) {
      const b = this.ball;
      if (!m) return;
      let tx, ty;
      if (fx !== undefined) { tx = fx; ty = fy; }
      else { tx = m.x + m.vx * 0.3; ty = m.y + m.vy * 0.3; }
      const acc = this.stat(p, 'pas') + (this.order[p.team] && this.order[p.team].id === 'pass' ? 10 : 0);
      let err = ((100 - acc) / 100) * 0.26 * rand(-1, 1) * (this.tacOf(p.team) === 'possession' && dist(p.x, p.y, m.x, m.y) < 130 ? 0.75 : 1);
      // pressure from nearby opponents vs the carrier's press resistance (StatsBomb-style)
      let pressure = 0, pSk = 0, pn = 0;
      for (const o of this.players) {
        if (o.team === p.team || o.gk) continue;
        const od = dist(o.x, o.y, p.x, p.y);
        if (od < 24) { pressure += 1 - od / 24; pSk += (this.stat(o, 'def') + this.stat(o, 'spd') + o.sta) / 3; pn++; }
      }
      pressure = Math.min(1, pressure);
      let beatPress = false;
      if (pn) {
        pSk /= pn;
        // possession sides rehearse playing out under pressure
        const resist = this.stat(p, 'pas') * 0.7 + this.stat(p, 'spd') * 0.1 + p.sta * 0.2 + (this.tacOf(p.team) === 'possession' ? 12 * this.realize(p.team) : 0);
        // hoofing it long is barely affected by pressure; short combinations are
        err *= 1 + TUNE.pressErr * pressure * (lofted || dist(p.x, p.y, tx, ty) > 190 ? 0.25 : 1) * (1 / (1 + Math.exp(-(pSk - resist) / 12)));
        beatPress = pressure > 0.35 && resist - pSk >= 15;
      }
      // a packed low block makes passes through the middle risky
      const oppT = 1 - p.team;
      const midY = (p.y + ty) / 2;
      let central = false;
      if (this.tacOf(oppT) === 'counter' && Math.abs(midY - CY) < 70) {
        const deep = this.team(oppT).filter((o) => !o.gk && this.proj(oppT, o.x) < this.proj(oppT, P.x + P.w / 3 * (oppT === 0 ? 1 : 2))).length;
        if (deep >= 7) { err *= 1 + 0.4 * this.realize(oppT); central = true; }
      }
      const d = dist(p.x, p.y, tx, ty);
      if (p.team === 0) {
        if (p.id === 'mame' && d > 140) { err = 0; this.traitPop(p, '枯れた技'); }
        if (this.combo('bunkei') && p.id === 'kazuha' && m.id === 'leo') { err *= 0.3; this.comboFx('bunkei'); this.bunkeiT = Game.time; }
        if (this.combo('bonsai') && ((p.id === 'mame' && m.id === 'kazuha') || (p.id === 'kazuha' && m.id === 'mame'))) { err *= 0.5; this.comboFx('bonsai'); }
        if (this.combo('kaze') && ((p.id === 'tsubame' && m.id === 'shizuku') || (p.id === 'shizuku' && m.id === 'tsubame'))) { err *= 0.5; this.comboFx('kaze'); }
        if (p.id === 'kazuha' && fx !== undefined) this.traitPop(p, '行間を読む');
      }
      const ang = Math.atan2(ty - p.y, tx - p.x) + err;
      const air = lofted || d > 190;
      const sp = air ? clamp(d * 1.05 + 60, 110, 240) : clamp(d * 1.5 + 70, 120, 300);
      this.releaseBall(p);
      b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp;
      b.vz = air ? clamp(d * 0.55, 70, 150) : 0;
      const pressured = this.nearestOpp(p)[1] < 16;
      b.pass = { from: p, to: m, tx, ty, t: 0, air, long: d > 170 || !!air, pressured, central, beatPress };
      // a ball played in behind makes the defenders it bypasses turn around before they can chase
      for (const o of this.players) {
        if (o.team === p.team || o.gk || o.state) continue;
        if (this.proj(p.team, tx) > this.proj(p.team, o.x) + 10 && this.proj(p.team, o.x) > this.proj(p.team, p.x) && dist(o.x, o.y, tx, ty) < 160) o.react = 0.32;
      }
      if (b.pass.long) p.rec.longAtt++;
      if (pressured) p.rec.prAtt++;
      b.tried = new Set();
      p.rec.pass++;
      p.kickAnim = 0.2;
      Sound.play(air ? 'kick' : 'pass', { vol: 0.55, pan: this.pan(p.x) });
    }
    doCross(p, m) {
      const t = p.team;
      const gxT = goalX(t);
      if (this.tacOf(t) === 'possession' && Math.random() < 0.3 + 0.5 * this.realize(t)) {
        // cut-back: a low ball pulled back to the penalty spot for a first-time finish
        const tx = gxT - dirX(t) * rand(55, 75), ty = CY + rand(-20, 20);
        m.tx = tx; m.ty = ty;
        this.doPass(p, m, false, tx, ty);
        this.ball.pass.cutback = true;
        if (t === 0) this.tick(p.name + '、マイナスの折り返し！', '#9fdcff');
        return;
      }
      const tx = gxT - dirX(t) * rand(28, 60), ty = CY + rand(-22, 22);
      m.tx = tx; m.ty = ty;
      this.doPass(p, m, true, tx, ty);
      this.ball.vz = 150;
      this.ball.pass.cross = true;
      if (t === 0) this.tick(p.name + '、ゴール前へクロス！', '#9fdcff');
    }
    releaseBall(p) {
      const b = this.ball;
      b.owner = null; b.last = p; b.lastKick = p; b.kickImm = 0.25; b.held = false;
    }
    pan(x) { return clamp((x - (this.cam.x + W / 2)) / (W / 2), -1, 1) * 0.6; }

    wantShoot(p) {
      const t = p.team;
      const dGoal = dist(p.x, p.y, goalX(t), CY);
      if (t === 0 && this.chanceCD <= 0 && dGoal < 230) { this.openMeter('chance', p); return; }
      if (t === 1 && this.pinchCD <= 0 && dGoal < 220) { this.openMeter('pinch', p); return; }
      this.doShoot(p, null);
    }

    doShoot(p, q, header) {
      const b = this.ball, t = p.team;
      const gx = goalX(t);
      const dGoal = dist(p.x, p.y, gx, CY);
      const sht = this.stat(p, 'sht') + (this.order[t] && this.order[t].id === 'shoot' ? 6 : 0);
      let sigma = (100 - sht) * 0.42 + dGoal * 0.1 + (header ? 8 : 0);
      const attackerQ = t === 0 ? q : null, defenderQ = t === 1 ? q : null;
      if (attackerQ === 'just') sigma *= 0.3; else if (attackerQ === 'good') sigma *= 0.7; else if (attackerQ === 'bad') sigma *= 1.35;
      const aimY = CY + rand(-1, 1) * (GW / 2 - 4);
      const ty = aimY + (rand(-1, 1) + rand(-1, 1) + rand(-1, 1)) * 0.75 * sigma;
      const power = (header ? 170 + sht * 0.8 + (p.id === 'mask' ? 50 : 0) : 240 + sht * 1.6) + (attackerQ === 'just' ? 90 : 0);
      const onTarget = Math.abs(ty - CY) < GW / 2 - 1;
      const gk = this.gk(1 - t);
      let pSave = 0.45 + this.stat(gk, 'def') / 170 - (power - 300) / 600 + dGoal / 700 - (Math.abs(ty - CY) / (GW / 2)) * 0.22;
      if (header) pSave -= 0.08;
      if (gk.id === 'gen' && b.z < 10 && Math.random() < 0.5) { pSave += 0.06; gk.netTrait = true; } // 網さばき
      if (gk.id === 'daifuku') pSave += 0.06;
      if (gk.team === 0 && this.combo('kabe') && dGoal < 110) { pSave += 0.12; this.comboFx('kabe'); }
      if (header && p.id === 'mask') pSave -= 0.1;
      if (attackerQ === 'just') pSave -= 0.34; else if (attackerQ === 'good') pSave -= 0.12; else if (attackerQ === 'bad') pSave += 0.12;
      if (defenderQ === 'just') pSave += 0.5; else if (defenderQ === 'good') pSave += 0.2; else if (defenderQ === 'bad') pSave -= 0.08;
      pSave = clamp(pSave, 0.05, 0.95);
      const save = onTarget && Math.random() < pSave;
      const ang = Math.atan2(ty - (header ? b.y : p.y), gx - (header ? b.x : p.x));
      this.releaseBall(p);
      b.vx = Math.cos(ang) * power; b.vy = Math.sin(ang) * power;
      b.vz = header ? -30 : dGoal > 150 ? rand(40, 90) : rand(10, 50);
      b.pass = null;
      b.shot = { team: t, shooter: p, save, ty, power: attackerQ === 'just', t: 0 };
      if (t === 0 && this.combo('ace') && (p.id === 'leo' || p.id === 'hikaru')) this.comboFx('ace');
      this.noShotT[t] = 0;
      p.rec.shot++; this.shots[t]++; if (onTarget) { this.onTarget[t]++; p.rec.onT++; gk.rec.faced++; }
      if (t === 1) {
        this.ana.shotLane[this.lane(p.y)]++;
        const nd = this.team(0).filter((q) => !q.gk).sort((a, c) => dist(a.x, a.y, p.x, p.y) - dist(c.x, c.y, p.x, p.y))[0];
        if (nd && dist(nd.x, nd.y, p.x, p.y) < 40) nd.rec.shotNear++;
      }
      p.kickAnim = 0.3;
      if (attackerQ === 'just') {
        Sound.play('power_shot'); Game.addShake(4, 0.3); Game.doHitstop(0.08);
        this.fx.burst(b.x, b.y, 18, { color: ['#9fdcff', '#ffffff', '#ffd24a'], speedMin: 40, speedMax: 140, lifeMin: 0.2, lifeMax: 0.5, size: 2, kind: 'star', drag: 0.05 });
      } else Sound.play(header ? 'kick' : 'shoot', { pan: this.pan(p.x) });
      if (header) this.tick((t === 0 ? '' : '') + p.name + '、ヘディングシュート！', t === 0 ? '#9fdcff' : '#ff9a8a');
      else if (t === 0) this.tick(p.name + '、シュート！', '#9fdcff'); else this.tick(p.name + 'のシュート！', '#ff9a8a');
      this.crowdHype = 0.8;
    }

    gkSmother(gk, c) {
      gk.tackCD = 1.0;
      const pr = clamp(0.35 + (this.stat(gk, 'def') - this.stat(c, 'spd')) / 120 - (gk.id === 'daifuku' ? 0.1 : 0), 0.2, 0.75);
      Sound.play('tackle', { pan: this.pan(gk.x) });
      this.fx.burst(c.x, c.y, 10, { color: ['#d6ba8c', '#ffffff'], speedMin: 20, speedMax: 70, lifeMax: 0.4, size: 2, flatY: 0.5, up: 10 });
      if (Math.random() < pr) {
        gk.rec.save++;
        Game.addShake(2, 0.15);
        this.popup(gk.x, gk.y - 50, gk.team === 0 ? '飛び出した！' : 'キャッチ！', gk.team === 0 ? '#ffd24a' : '#ffb0a0', 9);
        if (gk.team === 0) this.tick(gk.name + '、飛び出してボールを押さえた！', '#9fdcff');
        this.gkCatch(gk);
      } else { gk.state = 'down'; gk.stT = 0.6; }
    }

    reach(p) { return p.id === 'kawataro' ? 16 : p.id === 'ume' ? 13 : 9; }
    tryTackle(d, c, range) {
      d.tackCD = rand(0.7, 1.3);
      d.rec.tackle++;
      const cs = this.stat(c, 'spd') * 0.5 + this.stat(c, 'pas') * 0.2 + (c.id === 'yukimaru' ? 14 : 0);
      let pr = 0.3 + (this.stat(d, 'def') - cs) / 110;
      if (this.order[d.team] && this.order[d.team].id === 'defend') pr += 0.1;
      if (d.id === 'tetsuyama' || d.id === 'kotaro') pr += 0.08;
      if (d.id === 'ume') pr += 0.08;
      const slide = range > 10;
      if (slide) { d.x = lerp(d.x, c.x, 0.6); d.y = lerp(d.y, c.y, 0.6); }
      if (d.id === 'kawataro' && slide && Math.random() < 0.12) {
        d.state = 'down'; d.stT = 0.8; d.vx = (c.x - d.x) * 8; d.vy = (c.y - d.y) * 8; d.tackCD = 1.2;
        this.popup(d.x, d.y - 40, 'すべりすぎ！', '#9fdcff', 8); Sound.play('tackle', { vol: 0.5 });
        return;
      }
      pr = clamp(pr, 0.1, 0.72);
      const b = this.ball;
      // tackling from behind risks a foul
      const fx = c.face === 'right' ? 1 : c.face === 'left' ? -1 : 0, fy = c.face === 'down' ? 1 : c.face === 'up' ? -1 : 0;
      const behind = ((d.x - c.x) * fx + (d.y - c.y) * fy) < -3;
      Sound.play('tackle', { pan: this.pan(d.x) });
      this.fx.burst((d.x + c.x) / 2, (d.y + c.y) / 2, 8, { color: ['#d6ba8c', '#b6966a', '#ffffff'], speedMin: 20, speedMax: 60, lifeMin: 0.2, lifeMax: 0.45, size: 2, flatY: 0.5, up: 10 });
      if (Math.random() < (behind ? 0.35 : 0.06) * (d.id === 'morio' ? 0.4 : 1)) { this.foul(d, c); return; }
      if (Math.random() < pr) {
        d.rec.tackleOk++;
        if (d.id === 'kawataro' && slide) this.traitPop(d, 'すべりこみ');
        if (d.id === 'ume') this.traitPop(d, 'なぎなた');
        if (d.id === 'ponta' && this.combo('okan')) this.comboFx('okan');
        if (this.combo('ayashii') && (d.id === 'kawataro' || d.id === 'mask')) this.comboFx('ayashii');
        Game.addShake(2, 0.15);
        if (Math.random() < 0.55) {
          b.owner = d; b.last = d; b.pass = null; d.decT = 0.25; d.rec.touch++; c.rec.lost++;
          this.onPossession(d, c.team, false);
          c.state = 'down'; c.stT = 0.7; c.vx = (c.x - d.x) * 3; c.vy = (c.y - d.y) * 3;
          if (Math.random() < 0.5) this.say(d, d.team === 0 ? pick(['もらった！', 'いただき！', 'よっしゃ！']) : pick(['甘いッ！', 'フン！']), 1);
        } else {
          this.releaseBall(c); b.lastKick = null;
          const a = Math.atan2(c.y - d.y, c.x - d.x) + rand(-0.8, 0.8);
          b.vx = Math.cos(a) * 90; b.vy = Math.sin(a) * 90; b.vz = 40; b.last = d;
        }
        if (d.team === 0) this.tick(d.name + '、ボールを奪った！', '#9fdcff');
      } else {
        d.state = 'down'; d.stT = 0.45; d.vx = (c.x - d.x) * 4; d.vy = (c.y - d.y) * 4;
        d.rec.beaten++;
        c.rec.dribble++;
        if (c.team === 0 && Math.random() < 0.4) this.say(c, pick(['ほいっと！', 'かわした！']), 0.9);
      }
    }
    foul(d, c) {
      c.state = 'down'; c.stT = 0.9;
      Sound.play('whistle');
      Game.addShake(2, 0.15);
      this.popup(c.x, c.y - 58, 'ファウル！', '#ffd24a', 10);
      this.tick(d.name + 'のファウル。' + (c.team === 0 ? 'ハマカゼ' : 'ヤマオロシ') + 'のフリーキック。', '#fff6e0');
      if (d.team === 0) this.say(d, pick(['あっ、ごめん！', 'しまった…']), 1.2);
      let x = c.x, y = c.y;
      // keep free kicks outside the penalty area for this demo's rules
      const gx = goalX(c.team);
      if (Math.abs(x - gx) < Art.BOX_W + 6 && Math.abs(y - CY) < Art.BOX_H / 2 + 6) x = gx - dirX(c.team) * (Art.BOX_W + 8);
      this.startSetPiece('free', c.team, x, y, c);
      // the offender backs off the ball
      const a = Math.atan2(d.y - c.y, d.x - c.x) || Math.PI;
      d.x = c.x + Math.cos(a) * 18; d.y = c.y + Math.sin(a) * 18; d.vx = d.vy = 0;
    }

    // ---------------- set pieces ----------------
    startSetPiece(type, team, x, y, forced) {
      if (type !== 'gk') this.applySubs();
      const b = this.ball;
      b.owner = null; b.pass = null; b.shot = null; b.vx = b.vy = b.vz = 0; b.z = 0; b.held = false;
      b.x = x; b.y = y;
      let taker;
      if (type === 'gk' || type === 'goalkick') taker = this.gk(team);
      else if (forced) taker = forced;
      else taker = this.team(team).filter((q) => !q.gk && q.state !== 'down').sort((a, c) => dist(a.x, a.y, x, y) - dist(c.x, c.y, x, y))[0] || this.team(team).find((q) => !q.gk);
      const dur = { kick: 0.35, throw: 1.2, corner: 1.5, goalkick: 1.4, free: 1.8, gk: rand(1.0, 1.6) }[type];
      this.sp = { type, team, x, y, t: 0, dur, taker };
      if (type === 'gk') { b.owner = taker; b.held = true; b.last = taker; }
      const label = { throw: 'スローイン', corner: 'コーナーキック', goalkick: 'ゴールキック', free: 'フリーキック' }[type];
      if (label) this.popup(x, y - 22, label, '#ffffff', 8);
    }
    updateSetPiece(dt) {
      const sp = this.sp, b = this.ball, tk = sp.taker;
      sp.t += dt;
      if (sp.type === 'gk') { if (tk.state === 'dive') { b.x = tk.x + (tk.diveLeftward ? -6 : 6); b.y = tk.y - 2; b.z = 0; } else { b.x = tk.x + dirX(sp.team) * 3; b.y = tk.y - 8; b.z = 6; } }
      const ready = sp.type === 'gk' || dist(tk.x, tk.y, sp.x, sp.y) < 8;
      if (sp.type === 'throw' && ready) { b.x = tk.x; b.y = tk.y + 1; b.z = 19; }
      if (!ready && sp.t > sp.dur + 1.2) { tk.x = sp.x; tk.y = sp.y; }
      if (!ready || sp.t < sp.dur || this.meter) return;
      this.sp = null;
      b.owner = tk; b.held = false; b.z = 0;
      const t = sp.team, dx = dirX(t);
      const mates = this.team(t).filter((m) => m !== tk && !m.gk && !m.state);
      const openness = (m) => { let o = 99; for (const q of this.players) if (q.team !== t) o = Math.min(o, dist(q.x, q.y, m.x, m.y)); return o; };
      if (sp.type === 'kick') {
        const near = mates.sort((a, c) => dist(a.x, a.y, tk.x, tk.y) - dist(c.x, c.y, tk.x, tk.y))[0];
        this.doPass(tk, near, false);
      } else if (sp.type === 'throw') {
        const near = mates.filter((m) => dist(m.x, m.y, tk.x, tk.y) < 130).sort((a, c) => openness(c) - openness(a))[0] || mates[0];
        tk.cheer = 0.35;
        this.doPass(tk, near, false);
        b.vz = 50; b.z = 10; b.vx *= 0.8; b.vy *= 0.8;
        // release from just inside the touchline and never back out of play
        b.y = sp.y < CY ? P.y + 4 : P.y + P.h - 4;
        if ((sp.y < CY && b.vy < 25) || (sp.y > CY && b.vy > -25)) b.vy = (sp.y < CY ? 1 : -1) * Math.max(25, Math.abs(b.vy));
        Sound.play('kick', { vol: 0.3 });
      } else if (sp.type === 'corner') {
        const inBox = mates.filter((m) => Math.abs(m.x - goalX(t)) < Art.BOX_W + 20);
        this.doCross(tk, inBox.length ? pick(inBox) : mates[0]);
      } else if (sp.type === 'gk' && sp.target) {
        this.doPass(tk, sp.target, true); this.ball.vz = 150; tk.cheer = 0.3;
        this.comboFx('shitei'); this.say(tk, 'ハルキ、走れぇ！', 1.2);
      } else if (sp.type === 'goalkick' || sp.type === 'gk') {
        this.gkDistribute(tk, sp.type === 'gk');
      } else if (sp.type === 'free') {
        const dGoal = dist(tk.x, tk.y, goalX(t), CY);
        if (dGoal < 170) this.wantShoot(tk);
        else {
          const fwd = mates.sort((a, c) => (this.proj(t, c.x) + openness(c)) - (this.proj(t, a.x) + openness(a)))[0];
          this.doPass(tk, fwd, dist(tk.x, tk.y, fwd.x, fwd.y) > 140);
        }
      }
    }
    gkCatch(gk) {
      const b = this.ball;
      b.shot = null; b.pass = null;
      if (gk.state === 'down') gk.state = '';
      this.startSetPiece('gk', gk.team, gk.x, gk.y);
      if (gk.team === 0 && gk.id === 'gen' && this.combo('shitei')) {
        const h = this.players.find((q) => q.team === 0 && q.id === 'haruki');
        if (h && !h.state && this.proj(0, h.x) > this.proj(0, CX) - 60) { this.sp.dur = 0.55; this.sp.target = h; }
      }
    }
    gkDistribute(gk, fromHands) {
      const t = gk.team;
      const mates = this.team(t).filter((m) => m !== gk && !m.gk && !m.state);
      const openness = (m) => { let o = 99; for (const q of this.players) if (q.team !== t) o = Math.min(o, dist(q.x, q.y, m.x, m.y)); return o; };
      const short = mates.filter((m) => dist(m.x, m.y, gk.x, gk.y) < 170 && openness(m) > 34).sort((a, c) => openness(c) - openness(a))[0];
      const gtac = this.tacOf(t);
      const pShort = gtac === 'long' ? 0.1 : gtac === 'possession' ? 0.9 : gtac === 'counter' ? 0.4 : 0.65;
      if (short && Math.random() < pShort) {
        if (fromHands) { gk.cheer = 0.3; this.doPass(gk, short, false); this.ball.vz = 40; this.ball.z = 8; }
        else this.doPass(gk, short, false);
      } else {
        // long kick / punt toward the most advanced open teammate
        const far = mates.sort((a, c) => (this.proj(t, c.x) + openness(c) * 0.8) - (this.proj(t, a.x) + openness(a) * 0.8))[0];
        this.doPass(gk, far, true);
        this.ball.vz = 170;
        Sound.play('shoot', { vol: 0.4 });
      }
    }

    moveAll(dt, toHome) {
      for (const p of this.players) {
        if (p.tackCD > 0) p.tackCD -= dt;
        if (p.kickAnim > 0) p.kickAnim -= dt;
        if (p.bubble) { p.bubble.t -= dt; if (p.bubble.t <= 0) p.bubble = null; }
        if (p.cheer > 0) p.cheer -= dt;
        if (p.state === 'down') { p.stT -= dt; p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx * dt; p.y += p.vy * dt; if (p.stT <= 0) p.state = ''; continue; }
        if (p.state === 'header') { p.stT -= dt; p.jump = Math.sin(clamp(1 - p.stT / 0.45, 0, 1) * Math.PI) * 8; p.x += p.vx * dt * 0.5; p.y += p.vy * dt * 0.5; if (p.stT <= 0) { p.state = ''; p.jump = 0; } continue; }
        if (p.state === 'dive') {
          p.diveT += dt;
          const k = clamp(p.diveT / 0.22, 0, 1);
          p.x = lerp(p.diveFrom[0], p.diveTo[0], Ease.outQuad(k)); p.y = lerp(p.diveFrom[1], p.diveTo[1], Ease.outQuad(k));
          p.stT -= dt; if (p.stT <= 0) p.state = '';
          continue;
        }
        if (p.react > 0) { p.react -= dt; p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx * dt; p.y += p.vy * dt; p.animT += dt; continue; }
        let tx = p.tx, ty = p.ty;
        if (toHome) { tx = p.homeX; ty = p.homeY; }
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
        let sp = this.speedOf(p) * (p.run || toHome ? 1 : 0.6) * (p.hurry && this.sp && this.sp.taker === p ? 1.5 : 1) * (p.burst > 0 ? 1.15 : 1);
        if (p.burst > 0) p.burst -= dt;
        if (!this.sp) p.hurry = false;
        if (this.ball.owner === p) sp *= 0.86;
        if (this.state === 'fulltime' || this.state === 'halfend') sp *= 0.5;
        let vx = 0, vy = 0;
        if (d > 2) { const s = Math.min(sp, d * 4); vx = (dx / d) * s; vy = (dy / d) * s; }
        // momentum: acceleration is limited, turning at speed is slower
        const acc = (p.gk ? 9 : 6) * dt;
        p.vx = lerp(p.vx, vx, clamp(acc, 0, 1)); p.vy = lerp(p.vy, vy, clamp(acc, 0, 1));
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.x = clamp(p.x, P.x - 20, P.x + P.w + 20); p.y = clamp(p.y, P.y - 12, P.y + P.h + 12);
        const v = Math.hypot(p.vx, p.vy);
        p.rec.dist += v * dt;
        if (this.state === 'play') {
          if (this.half === 1 && this.clock < HALF_LEN * 0.3) p.rec.distEarly += v * dt;
          if (this.half === 2 && this.clock > HALF_LEN * 0.7) p.rec.distLate += v * dt;
        }
        if (this.state === 'play') {
          let drain = (0.12 + (v / 100) * 0.55) * (1.45 - p.st.sta / 100) * dt;
          if (p.id === 'ponta' && this.half === 2 && !this.pontaAwake) drain *= 1.35;
          if (this.combo('tofu') && p.team === 0 && (p.id === 'ponta' || p.id === 'morio')) drain *= 0.75;
          if (this.combo('okan') && p.id === 'ponta') drain *= 1.25;
          if (p.gk) drain *= 0.3;
          else if (p === this.presser2 || p === this.pressMark || (this.tacOf(p.team) === 'press' && p.run && this.carrierTeam() !== p.team)) drain *= 2.2;
          else if (this.tacOf(p.team) === 'press') drain *= 1.4;
          p.sta = Math.max(0, p.sta - drain * 1.15);
        }
        p.animT += dt * (v / 9);
        if (v > 8) {
          if (Math.abs(p.vx) > Math.abs(p.vy) * 0.8) p.face = p.vx > 0 ? 'right' : 'left';
          else p.face = p.vy < 0 ? 'up' : 'down';
        } else if (this.state === 'play' || this.state === 'reset') {
          const bx = this.ball.x - p.x, by = this.ball.y - p.y;
          if (Math.abs(bx) > Math.abs(by) * 0.8) p.face = bx > 0 ? 'right' : 'left'; else p.face = by < 0 ? 'up' : 'down';
        }
        p.moving = v > 8;
      }
    }
    // soft body collisions so players never overlap
    collide() {
      const ps = this.players;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], c = ps[j];
        if (a.state === 'dive' || c.state === 'dive') continue;
        const dx = c.x - a.x, dy = (c.y - a.y) * 1.6, d = Math.hypot(dx, dy);
        const R = 9;
        if (d < R && d > 0.01) {
          const push = (R - d) * 0.5;
          const nx = dx / d, ny = dy / d / 1.6;
          const wa = this.ball.owner === a ? 0.3 : 1, wc = this.ball.owner === c ? 0.3 : 1;
          a.x -= nx * push * wa; a.y -= ny * push * wa; c.x += nx * push * wc; c.y += ny * push * wc;
        }
      }
    }

    updateBall(dt) {
      const b = this.ball;
      if (b.owner) {
        const o = b.owner;
        if (b.held) return; // in the keeper's hands (positioned by the set piece)
        const fx = o.face === 'right' ? 1 : o.face === 'left' ? -1 : 0, fy = o.face === 'down' ? 1 : o.face === 'up' ? -1 : 0;
        // dribble touches: the ball is pushed a little ahead, then collected again
        o.touchT = (o.touchT || 0) + dt * (o.moving ? 2.4 : 0);
        const reach = o.moving ? 5 + (o.touchT % 1) * 6 : 5;
        const tx = o.x + fx * reach, ty = o.y + fy * reach * 0.6 + 1;
        b.x = lerp(b.x, tx, clamp(dt * 16, 0, 1)); b.y = lerp(b.y, ty, clamp(dt * 16, 0, 1)); b.z = 0;
        b.vx = o.vx; b.vy = o.vy; b.vz = 0;
        if (o.moving) b.roll += dt * 12;
        if (o.state === 'down') this.releaseBall(o);
        return;
      }
      if (this.sp) { b.vx = b.vy = 0; return; }
      const sp = Math.hypot(b.vx, b.vy);
      b.roll += dt * sp * 0.15;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      b.vz -= 420 * dt;
      if (b.z <= 0) {
        b.z = 0;
        if (b.vz < -60) { b.vz = -b.vz * 0.42; Sound.play('bounce', { vol: clamp(-b.vz / 200, 0.1, 0.5) }); } else b.vz = 0;
      }
      const fr = Math.exp((b.z > 0 ? -0.25 : -1.25) * dt);
      b.vx *= fr; b.vy *= fr;
      if (sp > 230 && Math.random() < 0.8) {
        this.fx.add({ x: b.x, y: b.y - b.z, vx: rand(-8, 8), vy: rand(-8, 8), life: 0.25, size: b.shot && b.shot.power ? 3 : 2, color: b.shot && b.shot.power ? pick(['#ffd24a', '#9fdcff', '#ffffff']) : 'rgba(255,255,255,0.7)' });
      }
      if (b.pass) { b.pass.t += dt; if (b.pass.t > 2.4) b.pass = null; }
      if (b.shot) b.shot.t += dt;
      if (b.inNet) {
        const gxl = b.x < CX ? P.x - Art.GOAL_D + 3 : P.x + P.w + Art.GOAL_D - 3;
        if ((b.x < CX && b.x < gxl) || (b.x > CX && b.x > gxl)) { b.x = gxl; b.vx *= -0.2; b.vy *= 0.5; }
        return;
      }
      if (b.shot) {
        const gk = this.gk(1 - b.shot.team);
        if (b.shot.save && dist(gk.x, gk.y - 4, b.x, b.y - b.z * 0.5) < (gk.id === 'daifuku' ? 18 : 13)) { this.onSave(gk); return; }
      }
      const lineL = P.x, lineR = P.x + P.w;
      if (b.x <= lineL || b.x >= lineR) {
        const side = b.x >= lineR ? 1 : 0;
        const inMouth = Math.abs(b.y - CY) < GW / 2;
        const nearPost = Math.abs(Math.abs(b.y - CY) - GW / 2) < 3;
        if (nearPost && b.z < 16) { this.onPost(side); return; }
        if (inMouth && b.z < 14 && !(b.shot && b.shot.save)) { this.onGoal(side === 1 ? 0 : 1); return; }
        this.onOut('goalline', side);
        return;
      }
      if (b.y < P.y || b.y > P.y + P.h) { this.onOut('touch'); return; }
      if (this.state !== 'play' || this.meter) return;
      // long ball coming down: the target and the nearest defender contest it (~50/50 when evenly matched)
      if (b.pass && b.pass.long && b.pass.air && !b.pass.duel && b.vz < 0 && b.z < 22) {
        const at = b.pass.from.team;
        const near = (t, r) => this.players.filter((q) => q.team === t && !q.state && !q.gk && dist(q.x, q.y, b.x, b.y) < r).sort((a2, c) => dist(a2.x, a2.y, b.x, b.y) - dist(c.x, c.y, b.x, b.y))[0];
        const att = near(at, 18), df = near(1 - at, 18);
        if (att || df) {
          b.pass.duel = true;
          if (att && df) {
            const sc = (q) => this.stat(q, 'def') * 0.5 + this.bodyScore(q) * 0.3 + this.stat(q, 'spd') * 0.1 + (q.id === 'mask' ? 25 : 0);
            // a forward running onto a ball in behind beats a defender who has to turn
            const pw = 1 / (1 + Math.exp(-(sc(att) - sc(df) + (b.pass.behind ? 12 : 0)) / 8));
            const winner = Math.random() < pw ? att : df, loser = winner === att ? df : att;
            winner.rec.airW++; loser.rec.airL++;
            if (winner.id === 'mask') this.traitPop(winner, '空中戦の鬼');
            loser.state = 'header'; loser.stT = 0.4;
            if (winner === att && this.tacOf(1 - at) === 'press') this.bypassPress(at);
            if (winner === att) this.knockOn(att, at); else this.header(df);
            return;
          }
          if (att && !df) { if (this.tacOf(1 - at) === 'press') this.bypassPress(at); this.gainBall(att); return; }
        }
      }
      // headers: a dropping ball at head height
      if (b.z > 7 && b.z < 24 && !b.shot && !(b.headCD > 0)) {
        const cands = this.players.filter((p) => !p.state && !p.gk && !(b.lastKick === p && b.kickImm > 0) && dist(p.x, p.y, b.x, b.y) < (p.id === 'mask' ? 13 : 9));
        if (cands.length) {
          // aerial duel: jump + strength decides, the masked man almost always wins
          // aerial: defence + body size + a little pace + timing; a crowded box favours the defenders
          const boxT = this.inOwnBox(0, b.x, b.y) ? 0 : this.inOwnBox(1, b.x, b.y) ? 1 : -1;
          let crowd = false;
          if (boxT >= 0) {
            const nd = this.team(boxT).filter((q) => this.inOwnBox(boxT, q.x, q.y)).length, na = this.team(1 - boxT).filter((q) => this.inOwnBox(boxT, q.x, q.y)).length;
            crowd = nd > na + 2;
          }
          const power = (p) => this.stat(p, 'def') * 0.5 + this.bodyScore(p) * 0.3 + this.stat(p, 'spd') * 0.1 + rand(0, 16) + (p.id === 'mask' ? 25 : 0) - (crowd && p.team !== boxT ? 12 : 0);
          cands.sort((a, c) => power(c) - power(a));
          const w = cands[0];
          if (w.id === 'mask' && cands.some((q) => q.team !== w.team)) this.traitPop(w, '空中戦の鬼');
          else if (w.id === 'mask' && Math.random() < 0.3) this.traitPop(w, '空中戦の鬼');
          w.rec.airW++;
          for (const q of cands.slice(1)) if (q.team !== w.team) { q.state = 'header'; q.stT = 0.4; q.rec.airL++; }
          this.header(w);
          return;
        }
      }
      // keeper claims high balls in his box
      if (b.z > 4 && b.z < 30 && !b.shot) {
        for (let t = 0; t < 2; t++) {
          const gk = this.gk(t);
          if (!gk.state && this.inOwnBox(t, b.x, b.y) && dist(gk.x, gk.y, b.x, b.y) < 12 && b.lastKick && b.lastKick.team !== t) {
            gk.rec.save++; this.popup(gk.x, gk.y - 44, 'キャッチ！', t === 0 ? '#ffd24a' : '#ffb0a0', 9); Sound.play('save', { vol: 0.6 });
            this.gkCatch(gk); return;
          }
        }
      }
      let best = null, bd = 99;
      const hard = sp > 280;
      for (const p of this.players) {
        if (p.state === 'down' || p.state === 'dive' || p.state === 'header') continue;
        if (b.lastKick === p && b.kickImm > 0) continue;
        if (b.z > 10) continue;
        const d = dist(p.x, p.y, b.x, b.y);
        const r = p.gk ? 11 : 8;
        if (d > r) continue;
        if (hard && !p.gk) continue;
        if (b.pass && b.pass.to !== p && p.team !== b.pass.from.team) {
          if (b.tried.has(p)) continue;
          b.tried.add(p);
          const ic = 0.28 + this.stat(p, 'def') / 220 - sp / 900 + (p.id === 'shizuku' ? 0.25 : 0) + (b.pass.central ? 0.12 : 0);
          // a slow ball arriving at a defender's feet is almost always cut out
          const icf = sp < 140 ? Math.max(ic, 0.85) : ic;
          if (Math.random() > icf) continue;
          if (p.id === 'shizuku') this.traitPop(p, '神託');
        }
        if (d < bd) { bd = d; best = p; }
      }
      if (best) this.gainBall(best);
    }

    // a long ball that beats the press leaves the pressers stranded upfield
    bypassPress(t) {
      this.counterT[t] = Math.max(this.counterT[t], 3.0);
      this.toast((t === 0 ? 'ハマカゼ' : 'ヤマオロシ') + '、ロングボールでプレスを回避！', t === 0 ? '#9fdcff' : '#ff9a8a');
    }
    // target man wins the long ball: flick it on for a runner, or knock it down for an onrushing midfielder
    knockOn(att, t) {
      const b = this.ball, dx = dirX(t);
      const mates = this.team(t).filter((q) => q !== att && !q.gk && !q.state);
      const runner = mates.filter((q) => this.proj(t, q.x) > this.proj(t, att.x) - 10 && dist(q.x, q.y, att.x, att.y) < 110).sort((a2, c) => this.proj(t, c.x) - this.proj(t, a2.x))[0];
      const support = mates.filter((q) => dist(q.x, q.y, att.x, att.y) < 80).sort((a2, c) => dist(a2.x, a2.y, att.x, att.y) - dist(c.x, c.y, att.x, att.y))[0];
      const pick2 = runner && Math.random() < 0.55 ? runner : support;
      if (!pick2) { this.gainBall(att); att.state = ''; return; }
      att.state = 'header'; att.stT = 0.4; att.rec.touch++;
      this.releaseBall(att);
      const tx = pick2 === runner ? pick2.x + dx * 30 : pick2.x, ty = pick2.y;
      const a = Math.atan2(ty - b.y, tx - b.x), d = dist(b.x, b.y, tx, ty);
      b.vx = Math.cos(a) * clamp(d * 1.6 + 40, 80, 190); b.vy = Math.sin(a) * clamp(d * 1.6 + 40, 80, 190); b.vz = 50;
      b.pass = { from: att, to: pick2, tx, ty, t: 0, air: false, long: false };
      b.tried = new Set(); b.headCD = 0.4;
      Sound.play('kick', { vol: 0.4, pitch: 1.3 });
      if (pick2 === runner && this.counterT[t] <= 0) this.counterT[t] = 2.0;
      if (Math.random() < 0.3) this.tick(att.name + '、' + (pick2 === runner ? '頭でそらした！ ' : '胸で落とした！ ') + pick2.name + 'へ！', t === 0 ? '#9fdcff' : '#ff9a8a');
    }
    header(p) {
      const b = this.ball, t = p.team;
      p.state = 'header'; p.stT = 0.45; p.vx = b.vx * 0.1; p.vy = b.vy * 0.1;
      b.headCD = 0.35; b.pass = null;
      p.rec.touch++;
      this.fx.burst(b.x, b.y - b.z, 6, { color: '#ffffff', speedMin: 20, speedMax: 50, lifeMax: 0.3, size: 2, kind: 'star' });
      const dGoal = dist(p.x, p.y, goalX(t), CY);
      const attackingBox = dGoal < 130 && Math.abs(p.y - CY) < 80;
      const defendingBox = this.inOwnBox(t, p.x, p.y);
      if (attackingBox) {
        this.say(p, t === 0 ? pick(['頭で！', 'どりゃあ！']) : pick(['ぬんっ！']), 0.9);
        this.doShoot(p, null, true);
        b.lastKick = p; b.kickImm = 0.3;
        return;
      }
      Sound.play('kick', { vol: 0.4, pitch: 1.3 });
      this.releaseBall(p);
      if (defendingBox) {
        // clearance: away from goal and toward the wings
        const a = (t === 0 ? 0 : Math.PI) + (b.y < CY ? -0.6 : 0.6) + rand(-0.3, 0.3);
        b.vx = Math.cos(a) * 170; b.vy = Math.sin(a) * 170; b.vz = 110;
        if (t === 0) this.tick(p.name + '、ヘディングでクリア！', '#9fdcff');
      } else {
        // flick on toward the nearest teammate ahead
        const m = this.team(t).filter((q) => q !== p && !q.gk).sort((a2, c) => dist(a2.x, a2.y, p.x, p.y) - dist(c.x, c.y, p.x, p.y))[0];
        const a = Math.atan2(m.y - b.y, m.x - b.x);
        b.vx = Math.cos(a) * 110; b.vy = Math.sin(a) * 110; b.vz = 60;
      }
    }

    onPossession(p, prevTeam, viaPass) {
      const t = p.team, tac = this.tacOf(t), b = this.ball;
      const name = t === 0 ? 'ハマカゼ' : 'ヤマオロシ', col = t === 0 ? '#9fdcff' : '#ff9a8a';
      if (prevTeam !== t && prevTeam >= 0 && !p.gk) {
        this.chain[0] = this.chain[1] = 0;
        this.chain[t] = 1;
        const goalSide = this.team(1 - t).filter((o) => !o.gk && this.proj(t, o.x) > this.proj(t, b.x)).length;
        if (tac !== 'counter' && goalSide <= 3 && this.counterT[t] <= 0) { this.counterT[t] = 2.0; }
        if (tac === 'counter' && goalSide <= TUNE.counterGoalSide && this.proj(t, b.x) < this.proj(t, CX) + 60 && this.counterT[t] <= 0) {
          this.counterT[t] = 1.5 + 3 * this.realize(t); this.tstats[t].counter++;
          this.toast(name + '、カウンター発動！', col);
          this.tick(pick(['奪った！ ' + name + '、一気にカウンターだ！', name + '、縦に速い！ 前線が走る！']), col);
          if (t === 0) Sound.play('command', { pitch: 1.3, vol: 0.5 });
        }
        if (tac === 'press' && this.proj(t, b.x) > this.proj(t, CX) + 20) {
          this.tstats[t].pressWin++;
          this.toast(name + '、ハイプレスで奪った！', col);
          this.tick(pick(['前線からの守備がハマった！', '高い位置で奪った！ ショートカウンター！']), col);
          this.counterT[t] = 2.5;
        }
      } else if (viaPass) {
        this.chain[t]++;
        this.tstats[t].chainMax = Math.max(this.tstats[t].chainMax, this.chain[t]);
        if ([6, 10, 15, 20].includes(this.chain[t])) {
          this.toast(name + '、パス' + this.chain[t] + '本連続！', col);
          if (this.chain[t] >= 10) Sound.play('cheer', { vol: 0.3 });
          this.tick(pick(['パスが小気味よくつながる！', 'まるで糸を引くようなパス回し！', '相手が振り回されている！']), col);
        }
      }
    }
    gainBall(p) {
      const b = this.ball;
      const pass = b.pass;
      const prevTeam = b.last ? b.last.team : -1;
      if (pass && pass.from.team === p.team && pass.from !== p) {
        pass.from.rec.passOk++;
        if (pass.beatPress && this.tacOf(1 - p.team) === 'press') {
          this.counterT[p.team] = Math.max(this.counterT[p.team], 2.5);
          this.toast((p.team === 0 ? 'ハマカゼ' : 'ヤマオロシ') + '、プレスを剥がした！', p.team === 0 ? '#9fdcff' : '#ff9a8a');
          if (p.team === 0) this.traitPop(pass.from, 'プレス回避');
        }
        if (pass.long) pass.from.rec.longOk++;
        if (pass.pressured) pass.from.rec.prOk++;
        if (pass.through) { pass.from.rec.thrOk++; if (p.team === 1) this.ana.behind[this.lane(p.y)]++; }
        this.lastPasser = pass.from;
      } else if (pass && pass.from.team !== p.team) {
        if (p.team === 0 && !p.gk) this.tick(p.name + '、パスカット！', '#9fdcff');
        this.lastPasser = null;
      } else if (!pass) this.lastPasser = b.last && b.last.team === p.team ? this.lastPasser : null;
      b.owner = p; b.last = p; b.pass = null; b.shot = null; b.vz = 0; b.z = 0;
      p.rec.touch++;
      this.onPossession(p, prevTeam, !!(pass && pass.from.team === p.team && pass.from !== p));
      p.decT = p.gk ? 0.8 : rand(0.1, 0.35);
      Sound.play('kick', { vol: 0.3, pan: this.pan(p.x) });
      if (pass && pass.cutback && pass.from.team === p.team) p.decT = 0;
      // keeper picks up a loose ball in his own box with his hands (not from a teammate's pass)
      if (p.gk && this.inOwnBox(p.team, b.x, b.y) && !(pass && pass.from.team === p.team)) this.gkCatch(p);
    }

    onSave(gk) {
      const b = this.ball;
      gk.rec.save++;
      Sound.play('save'); Game.addShake(3, 0.2); Game.doHitstop(0.06);
      this.fx.burst(b.x, b.y - b.z, 12, { color: ['#ffffff', '#ffd24a'], speedMin: 30, speedMax: 110, lifeMin: 0.2, lifeMax: 0.5, size: 2, kind: 'star' });
      this.popup(gk.x, gk.y - 50, gk.team === 0 ? 'ナイスセーブ！' : 'セーブ！', gk.team === 0 ? '#ffd24a' : '#ffb0a0', 10);
      Sound.play('ooh');
      this.crowdHype = 0.9;
      if (gk.team === 0) { this.tick(gk.name + '、がっちり止めた！', '#9fdcff'); if (Math.random() < 0.3) this.say(gk, gk.id === 'gen' ? pick(['網にかかったな', 'ふんっ']) : pick(['もちっと止めた！', 'ふぅ…']), 1.1); if (gk.id === 'daifuku') this.fx.burst(gk.x, gk.y - 10, 14, { color: '#ffffff', speedMin: 10, speedMax: 40, lifeMax: 0.8, size: 2 }); }
      else this.tick(gk.name + '、ファインセーブ！ 惜しい！', '#ff9a8a');
      b.shot = null;
      if (Math.random() < 0.6) {
        this.gkCatch(gk);
      } else {
        // parry wide, toward the corner, never back into the middle
        b.vx = -b.vx * rand(0.15, 0.3); b.vy = (b.y < CY ? -1 : 1) * rand(120, 180); b.vz = 70; b.last = gk; b.lastKick = gk; b.kickImm = 0.3; b.pass = null;
      }
    }

    onPost(side) {
      const b = this.ball;
      Sound.play('post'); Sound.play('ooh', { vol: 0.8 });
      Game.addShake(3, 0.25); Game.doHitstop(0.07);
      this.popup(b.x, b.y - 20, 'ポスト！', '#ffffff', 11);
      this.tick('ポストに当たった！ 惜しいっ！', '#ffd24a');
      b.vx = -b.vx * 0.5; b.vy = b.vy + rand(-80, 80); b.x = side ? P.x + P.w - 2 : P.x + 2;
      b.shot = null; b.pass = null;
      this.fx.burst(b.x, b.y, 8, { color: '#ffffff', speedMin: 30, speedMax: 90, lifeMax: 0.3, size: 2, kind: 'star' });
    }
    onGoal(team) {
      const b = this.ball;
      const scorer = b.shot ? b.shot.shooter : b.last;
      this.score[team]++;
      this.sp = null;
      b.inNet = true; b.shot = null; b.pass = null; b.owner = null;
      this.netShake[team === 0 ? 1 : 0] = 4;
      this.state = 'goal'; this.stateT = 0;
      this.kickoffTeam = 1 - team;
      if (scorer && scorer.team === team) {
        scorer.rec.goal++;
        if (this.lastPasser && this.lastPasser.team === team && this.lastPasser !== scorer) this.lastPasser.rec.assist++;
      }
      Game.doHitstop(0.18); Game.addShake(6, 0.5); Game.doFlash(0.7, team === 0 ? '#ffffff' : '#ffb0a0');
      Sound.play('net'); Sound.duck(0.6, 2.5);
      setTimeout(() => Sound.play(team === 0 ? 'goal' : 'concede'), 120);
      if (team === 0) { Sound.play('cheer'); this.banner('GOAL!!', 'goal', 3.0); }
      else { Sound.play('cheer', { vol: 0.45 }); this.banner('失点…', 'concede', 2.4); }
      // confetti from the stands
      if (team === 0) {
        for (let i = 0; i < 90; i++) this.fxTop.add({ x: rand(0, W), y: rand(-40, -5), vx: rand(-20, 20), vy: rand(40, 90), g: 30, drag: 0.02, life: rand(2, 3.4), size: rand(2, 4), color: pick(['#4fb4e8', '#ffffff', '#ffd24a', '#e0474c', '#9fdcff']), kind: 'confetti', spin: rand(4, 10), shrink: false });
      }
      this.fx.burst(b.x, b.y, 24, { color: ['#ffffff', '#ffd24a', '#9fdcff'], speedMin: 40, speedMax: 150, lifeMin: 0.3, lifeMax: 0.7, size: 2, kind: 'star', drag: 0.04 });
      for (const p of this.team(team)) { p.cheer = 3.2; }
      for (const p of this.team(1 - team)) if (!p.gk && Math.random() < 0.5) { p.state = 'down'; p.stT = 1.2; }
      const gk = this.gk(1 - team); if (gk.state !== 'dive') { gk.state = 'down'; gk.stT = 1.5; }
      if (scorer) {
        const line = team === 0
          ? pick(['決めたーーッ！ ' + scorer.name + 'のゴール！ 浜風が沸いています！', scorer.name + '！ ネットを揺らしたーッ！'])
          : pick([scorer.name + 'に決められた…！ ヤマオロシ、1点を奪う！', 'ああっと、' + scorer.name + 'のシュートが突き刺さる！']);
        this.tick(line, team === 0 ? '#ffd24a' : '#ff9a8a');
        if (team === 0) this.say(scorer, pick(['よっしゃあああ！', '見たか！', 'やったぁ！']), 2.4);
        if (team === 0) this.cutin = { id: scorer.id, expr: 'happy', t: 0, dur: 2.4, text: scorer.name + ' のゴール！', nick: scorer.def.nick, color: '#4fb4e8' };
        if (team === 1 && scorer.id === 'tetsuyama' || scorer && scorer.id === 'yukimaru' && team === 1) this.cutin = { id: scorer.id, expr: 'determined', t: 0, dur: 2.0, text: scorer.name, color: '#b8323a' };
        this.goalLog = this.goalLog || [];
        this.goalLog.push({ team, name: scorer.name, min: this.minute() });
      }
      // scorer runs toward corner
      if (scorer && scorer.team === team) { scorer.tx = team === 0 ? P.x + P.w - 30 : P.x + 30; scorer.ty = P.y + 20; scorer.run = true; }
    }
    onOut(kind, side) {
      const b = this.ball;
      const last = b.last || this.kickTaker;
      b.shot = null; b.pass = null;
      if (kind === 'touch') {
        const y = b.y < P.y ? P.y + 1 : P.y + P.h - 1;
        const x = clamp(b.x, P.x + 8, P.x + P.w - 8);
        this.startSetPiece('throw', 1 - last.team, x, y);
        return;
      }
      const defTeam = side === 1 ? 1 : 0; // team defending that goal line
      if (last.team === defTeam) {
        const att = 1 - defTeam;
        const cx = side ? P.x + P.w - 3 : P.x + 3, cy = b.y < CY ? P.y + 3 : P.y + P.h - 3;
        this.startSetPiece('corner', att, cx, cy);
        if (att === 0) this.tick('コーナーキックのチャンス！', '#9fdcff');
      } else {
        if (Math.random() < 0.7) { Sound.play('ooh', { vol: 0.5 }); this.tick(pick(['シュートは枠の外！', '惜しくも外れた！', 'ゴールキックで再開です。']), '#c9d6e6'); }
        const gx = ownGoalX(defTeam) + dirX(defTeam) * 22;
        this.startSetPiece('goalkick', defTeam, gx, CY + (b.y < CY ? -20 : 20));
      }
    }

    endHalf() {
      this.sp = null;
      const b = this.ball;
      b.owner = null; b.pass = null; b.shot = null; b.vx *= 0.3; b.vy *= 0.3;
      if (this.half === 1) {
        this.state = 'halfend'; this.stateT = 0;
        Sound.play('whistle'); setTimeout(() => Sound.play('whistle'), 350);
        this.banner('前半終了', 'mid', 2.4);
        this.tick('ここで前半終了のホイッスル！', '#fff6e0');
        for (const p of this.players) { p.tx = p.x + rand(-10, 10); p.ty = p.y; }
      } else {
        this.state = 'fulltime'; this.stateT = 0;
        Sound.play('whistle_long');
        Sound.stopBgm(1.2);
        const win = this.score[0] > this.score[1], lose = this.score[0] < this.score[1];
        this.banner('試合終了', 'mid', 99);
        this.tick(win ? '試合終了！ ハマカゼFC、見事な勝利です！' : lose ? '試合終了。ヤマオロシの壁は厚かったか…！' : '試合終了！ 両者一歩も譲らず引き分け！', '#ffd24a');
        for (const p of this.players) {
          const won = (p.team === 0 && win) || (p.team === 1 && lose);
          const lost = (p.team === 0 && lose) || (p.team === 1 && win);
          if (won) p.cheer = 99; else if (lost && !p.gk && Math.random() < 0.6) { p.state = 'down'; p.stT = 99; }
          p.tx = p.x; p.ty = p.y;
        }
        if (win) Sound.play('cheer');
      }
    }
    openHalftime() {
      Sound.bgm('halftime');
      this.halftimeUI = { t: 0, sel: 0, phase: 'talk', chosen: null };
    }
    updateHalftime(raw) {
      const h = this.halftimeUI;
      h.t += raw;
      if (h.phase === 'talk') {
        const opts = this.halftimeOptions();
        if (Input.hit('up')) { h.sel = (h.sel + opts.length - 1) % opts.length; Sound.play('cursor'); }
        if (Input.hit('down')) { h.sel = (h.sel + 1) % opts.length; Sound.play('cursor'); }
        for (let i = 0; i < opts.length; i++) {
          const r = this.htRect(i);
          if (E.hoverIn(r) && Input.mouse.moved && h.sel !== i) { h.sel = i; Sound.play('cursor'); }
          if (E.clickedIn(r)) { h.sel = i; this.chooseHalftime(opts[i]); return; }
        }
        if (h.t > 0.5 && Input.hit('ok')) this.chooseHalftime(opts[h.sel]);
        if (this.auto && h.t > 1.5) this.chooseHalftime(opts[0]);
      } else if (h.phase === 'reply') {
        if (h.t > 0.6 && (Input.hit('ok') || Input.mouse.clicked || (this.auto && h.t > 2))) this.startSecondHalf();
      }
    }
    halftimeOptions() {
      return [
        { id: 'praise', label: 'ほめてのばす', desc: '全員のスタミナが回復し、少し調子が上がる。' },
        { id: 'scold', label: '喝を入れる', desc: '気合ゲージが満タンに。ただしスタミナ回復は少なめ。' },
        { id: 'bench', label: 'ベンチ指示', desc: '戦術の変更・選手交代（残り' + this.subsLeft + '）' },
      ];
    }
    htRect(i) { return { x: 244, y: 118 + i * 34, w: 220, h: 30 }; }
    chooseHalftime(o) {
      const h = this.halftimeUI;
      Sound.play('select');
      h.chosen = o; h.phase = 'reply'; h.t = 0;
      if (o.id === 'praise') {
        for (const p of this.team(0)) p.sta = Math.min(100, p.sta + 45);
        this.moraleMul[0] = Math.min(1.12, this.moraleMul[0] + 0.05);
        h.reply = { who: 'ponta', expr: 'happy', text: '監督にほめられたら、腹八分目でも走れるっス！' };
      } else if (o.id === 'scold') {
        for (const p of this.team(0)) p.sta = Math.min(100, p.sta + 25);
        this.kiai[0] = 100;
        h.reply = { who: 'leo', expr: 'determined', text: '……ッス。後半、オレが決めてやるよ。見てな。' };
      } else {
        for (const p of this.team(0)) p.sta = Math.min(100, p.sta + 35);
        h.phase = 'talk';
        this.openPanel(true);
      }
      for (const p of this.team(1)) p.sta = Math.min(100, p.sta + 35);
    }
    startSecondHalf() {
      this.halftimeUI = null;
      this.half = 2; this.clock = 0;
      this.placeKickoff(1, true);
      this.state = 'intro'; this.stateT = 0.6; this.introBanner = true;
      this.banner('後半開始！', 'big', 1.6);
      Sound.bgm('match');
      this.tick('日も傾いてきました。後半キックオフ！', '#ffd24a');
      if (this.combo('tofu')) setTimeout(() => this.comboFx('tofu'), 2500);
      this.chanceCD = 6; this.pinchCD = 10;
    }
    minute() { return Math.min(45, Math.floor((this.clock / HALF_LEN) * 45)) + (this.half === 2 ? 45 : 0); }

    finish() {
      const recs = this.players.concat(this.subbedOut).map((p) => ({ id: p.id, name: p.name, team: p.team, rec: p.rec, sta: p.sta }));
      const tot = this.poss[0] + this.poss[1] || 1;
      this.result = { tacTime: Object.assign({}, this.tacTime), analysis: this.analyze(), tstats: this.tstats, tactic: this.tac.slice(), score: this.score.slice(), recs, poss: [this.poss[0] / tot, this.poss[1] / tot], shots: this.shots, onTarget: this.onTarget, goals: this.goalLog || [] };
      if (this.opts.onEnd) this.opts.onEnd(this.result);
    }

    // ---------------- chance / pinch timing meter ----------------
    openMeter(kind, p) {
      const b = this.ball;
      const just = kind === 'chance' ? (p.id === 'leo' ? (this.combo('bunkei') && Game.time - (this.bunkeiT || -99) < 4 ? 0.09 : 0.07) : p.id === 'hikaru' && this.crowdHype > 0.55 ? 0.08 : 0.05) : 0.05;
      if (kind === 'chance' && just > 0.05) this.traitPop(p, p.id === 'leo' ? '目立ちたがり' : '映え');
      this.meter = { just, kind, p, t: 0, pos: 0, dir: 1, speed: kind === 'chance' ? 1.9 : 2.2, result: null, rt: 0, autoAim: clamp(0.5 + (rand(-1, 1) + rand(-1, 1)) * 0.12, 0.05, 0.95) };
      if (kind === 'chance') this.chanceCD = rand(9, 13); else this.pinchCD = rand(10, 15);
      Game.timeScale = 0.05;
      Sound.play('chance');
      Sound.setBgmRate(0.6);
      Sound.duck(0.5, 2.5);
      this.cutin = null;
      const gk = this.gk(0);
      this.meter.face = kind === 'chance' ? p.id : gk.id;
      p.vx *= 0.2; p.vy *= 0.2;
    }
    updateMeter(raw) {
      const m = this.meter;
      m.t += raw;
      if (m.result) {
        m.rt += raw;
        if (m.rt > 0.55) {
          Game.timeScale = 1; Sound.setBgmRate(1);
          const p = m.p;
          this.meter = null;
          if (this.ball.owner === p) this.doShoot(p, m.result);
        }
        return;
      }
      if (m.t < 0.35) return; // intro
      m.pos += m.dir * m.speed * raw;
      if (m.pos > 1) { m.pos = 2 - m.pos; m.dir = -1; }
      if (m.pos < 0) { m.pos = -m.pos; m.dir = 1; }
      let press = Input.hit('ok') || Input.mouse.clicked;
      if (this.auto && Math.abs(m.pos - m.autoAim) < 0.03) press = true;
      if (press) this.resolveMeter();
      else if (m.t > 3.2) { m.result = 'bad'; Sound.play('miss_timing'); this.popupMeter('タイミングを逃した…', '#c9d6e6'); }
    }
    resolveMeter() {
      const m = this.meter;
      const d = Math.abs(m.pos - 0.5);
      if (d < m.just) {
        m.result = 'just'; Sound.play('just'); Game.doFlash(0.55, '#ffffff'); Game.addShake(3, 0.2);
        this.popupMeter('JUST!!', '#ffd24a');
        this.fxTop.burst(W / 2, H / 2 + 36, 26, { color: ['#ffd24a', '#ffffff', '#9fdcff'], speedMin: 60, speedMax: 180, lifeMin: 0.3, lifeMax: 0.6, size: 3, kind: 'star', drag: 0.05 });
      } else if (d < 0.17) { m.result = 'good'; Sound.play('select'); this.popupMeter('GOOD!', '#9fdcff'); }
      else { m.result = 'bad'; Sound.play('miss_timing'); this.popupMeter('あっ…！', '#c9d6e6'); }
    }
    popupMeter(t, c) { this.meter.msg = { text: t, color: c }; }

    // ---------------- camera ----------------
    updateCamera(raw) {
      const b = this.ball;
      let tx = b.x + b.vx * 0.25 - W / 2, ty = b.y + b.vy * 0.2 - VIEW_H / 2;
      if (this.meter) { tx = this.meter.p.x - W / 2 + dirX(this.meter.p.team) * 60; ty = this.meter.p.y - VIEW_H / 2; }
      if (this.state === 'intro' && this.stateT < 1.2 && this.half === 1) ty = P.y + P.h - VIEW_H + 60;
      tx = clamp(tx, 0, Art.WORLD.w - W); ty = clamp(ty, -6, Art.WORLD.h - VIEW_H);
      const k = clamp(raw * (this.meter ? 6 : 3.2), 0, 1);
      this.cam.x = lerp(this.cam.x, tx, k); this.cam.y = lerp(this.cam.y, ty, k);
    }

    // ---------------- drawing ----------------
    draw(g) {
      const ox = Math.round(this.cam.x), oy = Math.round(this.cam.y) - TOP_H;
      g.save();
      g.beginPath(); g.rect(0, TOP_H, W, VIEW_H); g.clip();
      this.drawStands(g, ox, oy);
      g.drawImage(this.pitch, -ox, -oy);
      this.drawBenches(g, ox, oy);
      Art.drawGoal(g, 0, ox, oy, this.netShake[0] * Math.sin(Game.time * 40));
      Art.drawGoal(g, 1, ox, oy, this.netShake[1] * Math.sin(Game.time * 40));
      // shadows
      const shadowDX = this.evening > 0.3 ? -Math.round(this.evening * 3) : 1;
      g.fillStyle = 'rgba(20,40,20,0.35)';
      for (const p of this.players) {
        if (p.state === 'dive') { g.fillRect(Math.round(p.x - 10 - ox), Math.round(p.y - 1 - oy), 20, 3); continue; }
        g.fillRect(Math.round(p.x - 4 - ox + shadowDX), Math.round(p.y - 1 - oy), 9, 2);
        g.fillRect(Math.round(p.x - 3 - ox + shadowDX), Math.round(p.y - 2 - oy), 7, 4);
      }
      const b = this.ball;
      g.fillRect(Math.round(b.x - 2 - ox + b.z * 0.3), Math.round(b.y - oy), 5, 2);
      // highlight ring under carrier
      if (b.owner && this.state === 'play') {
        const o = b.owner;
        g.strokeStyle = o.team === 0 ? 'rgba(159,220,255,0.9)' : 'rgba(255,140,140,0.8)';
        g.lineWidth = 1;
        g.beginPath(); g.ellipse(Math.round(o.x - ox) + 0.5, Math.round(o.y - oy) + 0.5, 8, 3.5, 0, 0, Math.PI * 2); g.stroke();
      }
      // entities sorted by y
      const ents = this.players.slice().sort((a, c) => a.y - c.y);
      let ballDrawn = false;
      for (const p of ents) {
        if (!ballDrawn && b.y < p.y) { this.drawBall(g, ox, oy); ballDrawn = true; }
        this.drawPlayer(g, p, ox, oy);
      }
      if (!ballDrawn) this.drawBall(g, ox, oy);
      this.fx.draw(g, ox, oy);
      // goal front posts again (depth)
      this.drawFloodlights(g, ox, oy);
      // evening grade
      if (this.evening > 0) {
        g.globalCompositeOperation = 'multiply';
        g.fillStyle = `rgba(255,${Math.round(190 - 40 * this.evening)},${Math.round(150 - 50 * this.evening)},${0.55 * this.evening})`;
        g.fillRect(0, TOP_H, W, VIEW_H);
        g.globalCompositeOperation = 'source-over';
        this.drawLightGlow(g, ox, oy);
      }
      // bubbles & names
      for (const p of this.players) this.drawBubble(g, p, ox, oy);
      if (b.owner && this.state === 'play' && !this.meter && !b.owner.bubble) {
        const o = b.owner;
        text(g, o.name, Math.round(o.x - ox), Math.round(o.y - oy) - 32, { size: 8, align: 'center', color: o.team === 0 ? '#ffffff' : '#ffd0d0', outline: o.team === 0 ? '#10304f' : '#4a1018' });
      }
      for (const pp of this.popups) {
        const k = pp.t / 1.2;
        if (pp.tag) {
          const yy = Math.round(pp.y - oy - Ease.outCubic(Math.min(1, k * 2)) * 8);
          E.setFont(g, 8);
          const tw = Math.ceil(g.measureText(pp.text).width) + 8;
          g.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
          panel(g, Math.round(pp.x - ox - tw / 2), yy - 2, tw, 13, 'gold');
          text(g, pp.text, Math.round(pp.x - ox), yy, { size: 8, align: 'center', color: '#4a2a10' });
          g.globalAlpha = 1;
          continue;
        }
        text(g, pp.text, Math.round(pp.x - ox), Math.round(pp.y - oy - Ease.outCubic(Math.min(1, k * 2)) * 10), { size: pp.size, align: 'center', color: pp.color, outline: '#2a1a24', alpha: k > 0.8 ? (1 - k) * 5 : 1 });
      }
      for (let i = 0; i < 2; i++) if (this.benchBubble[i]) this.drawBenchBubble(g, i, ox, oy);
      g.restore();
    }

    drawStands(g, ox, oy) {
      // sky strip + town behind the stand (parallax)
      const standBottom = P.y - 14; // world y where apron starts
      const sy = standBottom - 50 - oy;
      if (sy > TOP_H - 60) {
        const tw = Art.town(this.evening > 0.5 ? 'dusk' : 'day');
        g.drawImage(tw.sky, 0, 0, 480, 270, 0, sy - 70, W, 120);
        const px = -((ox * 0.3) % 480);
        g.drawImage(tw.town, px, sy - 90); g.drawImage(tw.town, px + 480, sy - 90);
      }
      // grass bank
      g.fillStyle = '#4e8a3e'; g.fillRect(0, sy + 4, W, 50);
      g.fillStyle = '#5a9a48'; for (let r = 0; r < 3; r++) g.fillRect(0, sy + 14 + r * 11, W, 2);
      // fans
      const hype = this.crowdHype;
      const t = Game.time;
      for (let row = 0; row < 3; row++) {
        const y = sy + 8 + row * 11;
        const x0 = Math.floor(ox / 10) - 1;
        for (let i = x0; i < x0 + W / 10 + 3; i++) {
          const f = Art.fans[((i * 7 + row * 13) % Art.fans.length + Art.fans.length) % Art.fans.length];
          if (((i * 31 + row * 17) % 9) === 0) continue; // gaps
          const jump = hype > 0.6 ? Math.max(0, Math.sin(t * 9 + f.phase)) * (hype - 0.5) * 6 : Math.max(0, Math.sin(t * 2 + f.phase)) * 0.8;
          const up = this.state === 'goal' && this.score[0] + this.score[1] > 0 && f.kind < 0.7 || (hype > 0.75 && f.kind < 0.3);
          const img = up ? f.up : f.idle;
          g.drawImage(img, i * 10 - ox + (row % 2) * 5 - (up ? 1 : 0), Math.round(y - jump) - (up ? 2 : 0));
        }
      }
      // boards
      g.drawImage(this.boards, -ox, standBottom - 16 - oy);
      // flags on bank (team banner)
      const bx = CX - 40 - ox, byy = sy + 1;
      g.fillStyle = '#2a1a24'; g.fillRect(bx - 1, byy - 1, 82, 12);
      g.fillStyle = '#4fb4e8'; g.fillRect(bx, byy, 80, 10);
      g.fillStyle = '#ffffff'; for (let i = 0; i < 80; i += 8) g.fillRect(bx + i, byy, 4, 10);
      text(g, 'がんばれ浜風！', bx + 40, byy + 1, { size: 8, align: 'center', color: '#10304f', outline: '#ffffff' });
    }

    drawBenches(g, ox, oy) {
      const by = P.y + P.h + 18 - oy;
      if (by > TOP_H + VIEW_H + 10) return;
      for (let t = 0; t < 2; t++) {
        const bx = (t === 0 ? CX - 170 : CX + 90) - ox;
        // dugout
        g.fillStyle = '#2a1a24'; g.fillRect(bx - 1, by - 1, 82, 30);
        g.fillStyle = t === 0 ? '#2f86c4' : '#7c1e2c'; g.fillRect(bx, by, 80, 6);
        g.fillStyle = t === 0 ? '#4fb4e8' : '#b8323a'; g.fillRect(bx, by, 80, 3);
        g.fillStyle = '#8a7a6a'; g.fillRect(bx, by + 6, 80, 22);
        g.fillStyle = '#6a5a4a'; g.fillRect(bx, by + 20, 80, 8);
        g.fillStyle = '#c7a878'; g.fillRect(bx + 4, by + 16, 72, 3);
        // people on bench
        const people = (t === 0 ? ['nagisa', 'otaki'] : ['onigawara']).map((id) => benchLook(id));
        if (t === 0) for (const d of this.bench.concat(this.subbedOut.map((q) => q.def))) people.push(d.look);
        people.slice(0, 6).forEach((L, i) => {
          const img = Art.sprite(L, 'down', Math.sin(Game.time * 3 + i) > 0.9 && this.state === 'goal' ? 'cheer' : 'walk1');
          g.drawImage(img, bx + 2 + i * 13, by + 2);
        });
        text(g, t === 0 ? 'HAMAKAZE' : 'YAMAOROSHI', bx + 60, by + 9, { size: 8, align: 'center', color: '#fff6e0', alpha: 0.7 });
      }
    }

    drawFloodlights(g, ox, oy) {
      const poles = [[P.x - 26, P.y - 20], [P.x + P.w + 26, P.y - 20], [P.x - 26, P.y + P.h + 24], [P.x + P.w + 26, P.y + P.h + 24]];
      for (const [x, y] of poles) {
        const sx = Math.round(x - ox), sy = Math.round(y - oy);
        g.fillStyle = '#2a1a24'; g.fillRect(sx - 1, sy - 50, 4, 52);
        g.fillStyle = '#9aa0b0'; g.fillRect(sx, sy - 50, 2, 51);
        g.fillStyle = '#2a1a24'; g.fillRect(sx - 7, sy - 60, 16, 11);
        g.fillStyle = this.evening > 0.25 ? '#fff8d0' : '#c9cbd6';
        g.fillRect(sx - 6, sy - 59, 14, 9);
        g.fillStyle = this.evening > 0.25 ? '#ffe08a' : '#a0a4b4';
        for (let i = 0; i < 3; i++) g.fillRect(sx - 5 + i * 5, sy - 58, 3, 3), g.fillRect(sx - 5 + i * 5, sy - 54, 3, 3);
      }
    }
    drawLightGlow(g, ox, oy) {
      const e = clamp((this.evening - 0.25) / 0.5, 0, 1);
      if (e <= 0) return;
      const poles = [[P.x - 26, P.y - 80], [P.x + P.w + 26, P.y - 80], [P.x - 26, P.y + P.h - 36], [P.x + P.w + 26, P.y + P.h - 36]];
      g.globalCompositeOperation = 'lighter';
      for (const [x, y] of poles) {
        const sx = x - ox, sy = y - oy;
        const gr = g.createRadialGradient(sx, sy, 2, sx, sy, 120);
        gr.addColorStop(0, `rgba(255,240,190,${0.5 * e})`);
        gr.addColorStop(0.2, `rgba(255,220,150,${0.14 * e})`);
        gr.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = gr; g.fillRect(sx - 120, sy - 120, 240, 240);
      }
      g.globalCompositeOperation = 'source-over';
    }

    drawPlayer(g, p, ox, oy) {
      const L = p.def.look;
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy);
      let img;
      if (p.state === 'dive') { p.diveLeftward = p.diveUp !== (p.team === 1) ? false : true; img = Art.diveSprite(L, p.diveLeftward); g.drawImage(img, x - 12, y - 10); return; }
      if (p.state === 'down') {
        // lying: use dive sprite rotated feel
        img = Art.diveSprite(L, p.face === 'left');
        g.drawImage(img, x - 12, y - 8);
        return;
      }
      let frame = 'walk1', dir = p.face === 'right' ? 'side' : p.face;
      if (p.state === 'header') { g.drawImage(Art.sprite(L, dir, 'cheer'), x - 8, y - 21 - Math.round(p.jump || 0)); return; }
      if (this.sp && (this.sp.type === 'gk' || this.sp.type === 'throw' && dist(p.x, p.y, this.sp.x, this.sp.y) < 8) && this.sp.taker === p) { g.drawImage(Art.sprite(L, 'down', 'cheer'), x - 8, y - 21); return; }
      if (p.cheer > 0) { frame = Math.sin(Game.time * 12 + p.x) > 0 ? 'cheer' : 'walk1'; dir = 'down'; }
      else if (p.kickAnim > 0 && (dir === 'side' || dir === 'left')) frame = 'kick';
      else if (p.moving) frame = ['walk0', 'walk1', 'walk2', 'walk3'][Math.floor(p.animT) % 4];
      else frame = 'walk1';
      if (frame === 'walk1' && !p.moving && p.cheer <= 0) frame = 'stand';
      if (frame === 'stand') frame = 'walk1';
      img = Art.sprite(L, dir, frame);
      const jump = p.cheer > 0 ? Math.round(Math.abs(Math.sin(Game.time * 10 + p.x)) * 4) : 0;
      g.drawImage(img, x - 8, y - 21 - jump);
      // stamina warning
      if (p.team === 0 && p.sta < 25 && this.state === 'play' && Math.floor(Game.time * 3) % 2) {
        g.fillStyle = '#9fdcff'; g.fillRect(x + 5, y - 22, 1, 2); g.fillRect(x + 5, y - 19, 1, 1);
      }
    }
    drawBall(g, ox, oy) {
      const b = this.ball;
      const f = Art.ballFrames[Math.floor(b.roll) & 3];
      g.drawImage(f, Math.round(b.x - 3.5 - ox), Math.round(b.y - 5 - b.z - oy));
    }
    drawBubble(g, p, ox, oy) {
      if (!p.bubble) return;
      const k = p.bubble.t / p.bubble.max;
      const pop = k > 0.85 ? Ease.outBack((1 - k) / 0.15) : 1;
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy) - 36;
      E.setFont(g, 8);
      const w = Math.ceil(g.measureText(p.bubble.text).width) + 8;
      const bw = Math.round(w * pop), bh = Math.round(13 * pop);
      if (bw < 4) return;
      g.fillStyle = '#2a1a24'; g.fillRect(x - bw / 2 - 1, y - 1, bw + 2, bh + 2);
      g.fillStyle = p.team === 0 ? '#fff6e0' : '#ffe0e0'; g.fillRect(x - bw / 2, y, bw, bh);
      g.fillStyle = '#2a1a24'; g.fillRect(x - 1, y + bh + 1, 3, 1); g.fillRect(x, y + bh + 2, 1, 2);
      g.fillStyle = p.team === 0 ? '#fff6e0' : '#ffe0e0'; g.fillRect(x - 1, y + bh, 3, 1); g.fillRect(x, y + bh + 1, 1, 1);
      if (pop > 0.9) text(g, p.bubble.text, x, y + 2, { size: 8, align: 'center', color: '#2a1a24' });
    }
    drawBenchBubble(g, t, ox, oy) {
      const bb = this.benchBubble[t];
      const k = Ease.outBack(clamp((2.2 - bb.t) / 0.25, 0, 1));
      const fade = clamp(bb.t / 0.3, 0, 1);
      E.setFont(g, 10);
      const w = Math.ceil(g.measureText(bb.text).width) + 14;
      const who = t === 0 ? '監督' : '鬼瓦監督';
      const y = TOP_H + VIEW_H - 26 + Math.round((1 - k) * 20);
      const x = t === 0 ? 8 : W - w - 8;
      g.globalAlpha = fade;
      panel(g, x, y, w, 18, t === 0 ? 'paper' : ['#2a0e14', '#ffe0e0', '#e0b0b0', '#ffffff']);
      const tagW = t === 0 ? 26 : 44;
      panel(g, x + 4, y - 9, tagW, 11, t === 0 ? 'sky' : 'crimson');
      text(g, who, x + 4 + tagW / 2, y - 8, { size: 8, align: 'center', color: '#ffffff', outline: t === 0 ? '#10304f' : '#4a1018' });
      text(g, bb.text, x + w / 2, y + 4, { size: 10, align: 'center', color: t === 0 ? '#10304f' : '#7c1e2c' });
      g.globalAlpha = 1;
    }

    // ---------------- analysis: what the match says about where to train ----------------
    lane(y) { return y < CY - 60 ? 0 : y > CY + 60 ? 2 : 1; }
    memo(key, textStr) {
      if (this.memoKeys[key]) return;
      this.memoKeys[key] = true;
      this.memos.push({ key, text: textStr, min: this.minute() });
      this.tick('ナギサのメモ：' + textStr, '#c8f08a');
      Sound.play('page', { vol: 0.4 });
    }
    homeRecs() { return this.team(0).concat(this.subbedOut).map((p) => p.rec); }
    sumRec(k) { return this.homeRecs().reduce((a, r) => a + (r[k] || 0), 0); }
    liveMemo() {
      const S = (k) => this.sumRec(k);
      const LANE = ['上サイド', '中央', '下サイド'];
      if (S('airL') >= 4 && S('airL') > S('airW') * 1.5) this.memo('air', '空中戦で競り負けてます（' + S('airW') + '勝' + S('airL') + '敗）');
      if (S('longAtt') >= 5 && S('longOk') / S('longAtt') < 0.4) this.memo('long', '長いパスがつながりません（' + S('longOk') + '/' + S('longAtt') + '）');
      if (S('prAtt') >= 6 && S('prOk') / S('prAtt') < 0.55) this.memo('press', '寄せられるとパスミスが出ます（' + S('prOk') + '/' + S('prAtt') + '）');
      const bh = this.ana.behind, bi = bh.indexOf(Math.max(...bh));
      if (bh[bi] >= 2) this.memo('behind', LANE[bi] + 'で裏を取られてます（' + bh[bi] + '回）');
      if (S('beaten') >= 5) this.memo('beaten', '1対1で何度もかわされてます（' + S('beaten') + '回）');
      if (S('shot') >= 5 && S('onT') / S('shot') < 0.4) this.memo('shot', 'シュートが枠に飛びません（枠内' + S('onT') + '/' + S('shot') + '）');
      const tired = this.team(0).filter((p) => !p.gk && p.sta < 25);
      if (tired.length >= 3) this.memo('tired', tired.map((p) => p.name).slice(0, 3).join('・') + 'がバテてきてます');
      if (S('lost') >= 5) this.memo('lost', 'ボールを持ったところを狙われてます（奪われ' + S('lost') + '回）');
    }
    analyze() {
      const out = [];
      const all = this.team(0).concat(this.subbedOut);
      const S = (k) => this.sumRec(k);
      const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
      const worst = (fAtt, fOk, min = 2) => all.filter((p) => p.rec[fAtt] >= min).sort((a, c) => (a.rec[fOk] / a.rec[fAtt]) - (c.rec[fOk] / c.rec[fAtt]))[0];
      const add = (o) => out.push(o);
      if (S('longAtt') >= 4) {
        const r = pct(S('longOk'), S('longAtt')), w = worst('longAtt', 'longOk');
        if (r < 50) add({ sev: 60 - r, cat: 'pas', title: 'ロングパスの精度', value: '成功率 ' + r + '%（' + S('longOk') + '/' + S('longAtt') + '）', who: w && w.name, tip: '長い距離のパス精度（パス）が足りていません。' });
      }
      if (S('prAtt') >= 5) {
        const r = pct(S('prOk'), S('prAtt')), w = worst('prAtt', 'prOk');
        if (r < 65) add({ sev: 70 - r, cat: 'pas', title: 'プレッシャー下のパス', value: '成功率 ' + r + '%（' + S('prOk') + '/' + S('prAtt') + '）', who: w && w.name, tip: '寄せられた時に慌ててしまう。技術（パス）を上げるか、プレスを回避する戦術を。' });
      }
      const aw = S('airW'), al = S('airL');
      if (aw + al >= 4 && al > aw) add({ sev: (al - aw) * 8 + 10, cat: 'def', title: '空中戦', value: aw + '勝 ' + al + '敗', who: (all.filter((p) => p.rec.airL > 0).sort((a, c) => c.rec.airL - a.rec.airL)[0] || {}).name, tip: 'ハイボールの競り合いに負けている。守備力と体の強さが必要。' });
      if (S('tackle') >= 5) {
        const r = pct(S('tackleOk'), S('tackle'));
        if (r < 40) add({ sev: 45 - r, cat: 'def', title: 'ボール奪取', value: '成功率 ' + r + '%（' + S('tackleOk') + '/' + S('tackle') + '）', who: (worst('tackle', 'tackleOk', 3) || {}).name, tip: '奪いに行っても取り切れていない。守備力（ディフェンス）の強化を。' });
      }
      const bh = this.ana.behind, bsum = bh[0] + bh[1] + bh[2];
      if (bsum >= 2) {
        const LANE = ['上サイド', '中央', '下サイド'], bi = bh.indexOf(Math.max(...bh));
        const slow = all.filter((p) => this.role(p) === 'DF' || p.def.pos === 'DF').sort((a, c) => a.st.spd - c.st.spd)[0];
        add({ sev: bsum * 12, cat: 'spd', title: '裏への対応', value: '裏を取られた ' + bsum + '回（' + LANE[bi] + 'が多い）', who: slow && slow.name, tip: 'DFラインの背後を突かれている。DFのスピードか、ラインを下げる戦術を。' });
      }
      if (S('shot') >= 4) {
        const r = pct(S('onT'), S('shot'));
        if (r < 50) add({ sev: 55 - r, cat: 'sht', title: 'シュート精度', value: '枠内 ' + r + '%（' + S('onT') + '/' + S('shot') + '）', who: (worst('shot', 'onT', 2) || {}).name, tip: 'チャンスは作れているが枠に飛んでいない。シュート練習を。' });
      } else if (S('shot') <= 2) add({ sev: 20, cat: 'sht', title: 'シュート数', value: 'わずか ' + S('shot') + '本', who: null, tip: 'ゴール前まで運べていない。攻撃の形（パスやスピード）を見直そう。' });
      const early = all.reduce((a, p) => a + p.rec.distEarly, 0), late = all.reduce((a, p) => a + p.rec.distLate, 0);
      if (early > 0 && late > 0) {
        const drop = Math.round((1 - late / early) * 100);
        const tired = all.filter((p) => !p.gk && p.rec.distEarly > 0).sort((a, c) => (a.rec.distLate / a.rec.distEarly) - (c.rec.distLate / c.rec.distEarly))[0];
        if (drop > 12) add({ sev: drop, cat: 'sta', title: '終盤の運動量', value: '走行量が ' + drop + '% ダウン', who: tired && tired.name, tip: '後半の終盤に足が止まっている。スタミナの強化か、早めの交代を。' });
      }
      if (S('lost') >= 4) add({ sev: S('lost') * 5, cat: 'spd', title: 'ボールロスト', value: 'タックルで奪われた ' + S('lost') + '回', who: (all.slice().sort((a, c) => c.rec.lost - a.rec.lost)[0] || {}).name, tip: '持ちすぎて奪われている。スピードかパスの判断を上げよう。' });
      out.sort((a, c) => c.sev - a.sev);
      // one bright spot
      const good = [];
      const thr = all.slice().sort((a, c) => c.rec.thrOk - a.rec.thrOk)[0];
      if (thr && thr.rec.thrOk >= 2) good.push({ cat: 'pas', title: 'スルーパス', value: thr.name + 'が ' + thr.rec.thrOk + '本成功', who: thr.name, tip: '裏へのパスは武器になっている。' });
      const air = all.slice().sort((a, c) => c.rec.airW - a.rec.airW)[0];
      if (air && air.rec.airW >= 3) good.push({ cat: 'def', title: '空中戦の強さ', value: air.name + 'が ' + air.rec.airW + '勝', who: air.name, tip: 'セットプレーやロングボールで生かせる。' });
      const tk = all.slice().sort((a, c) => c.rec.tackleOk - a.rec.tackleOk)[0];
      if (tk && tk.rec.tackleOk >= 3) good.push({ cat: 'def', title: 'ボール奪取', value: tk.name + 'が ' + tk.rec.tackleOk + '回奪取', who: tk.name, tip: '守備の要になっている。' });
      if (this.tstats[0].chainMax >= 8) good.push({ cat: 'pas', title: 'パスワーク', value: '最長 ' + this.tstats[0].chainMax + '本連続', who: null, tip: 'つなぐ力はある。' });
      return { issues: out.slice(0, 3), good: good[0] || null, memos: this.memos.slice() };
    }

    // ---------------- bench panel: team tactic + substitutions ----------------
    openPanel(fromHalftime) {
      if (this.meter || this.panel) return;
      Sound.play('select');
      this.panel = { t: 0, out: -1, inn: -1, cursor: 0, fromHalftime: !!fromHalftime, msg: null };
      Sound.setBgmRate(0.85);
    }
    closePanel() {
      Sound.play('cancel'); Sound.setBgmRate(1);
      const ht = this.panel.fromHalftime;
      this.panel = null;
      if (ht && this.halftimeUI) { this.halftimeUI.phase = 'reply'; this.halftimeUI.t = 0; this.halftimeUI.reply = { who: 'kazuha', expr: 'normal', text: '了解です。後半は「' + Data.TACTICS[this.tac[0]].name + '」でいきましょう。' }; }
    }
    panelField() { return this.team(0).slice().sort((a, c) => (a.gk ? -1 : c.gk ? 1 : a.slot - c.slot)); }
    panelRects() {
      const r = { tacs: [], field: [], bench: [] };
      Object.keys(Data.TACTICS).forEach((k, i) => r.tacs.push({ x: 26 + i * 108, y: 42, w: 104, h: 26, k }));
      this.panelField().forEach((p, i) => r.field.push({ x: 24, y: 100 + i * 12, w: 206, h: 12, p }));
      this.bench.forEach((d, i) => r.bench.push({ x: 244, y: 100 + i * 26, w: 212, h: 24, d }));
      r.confirm = { x: 344, y: 204, w: 112, h: 20 };
      r.close = { x: 244, y: 204, w: 94, h: 20 };
      return r;
    }
    updatePanel(raw) {
      const pn = this.panel; pn.t += raw;
      if (pn.msg) { pn.msg.t += raw; if (pn.msg.t > 2) pn.msg = null; }
      const r = this.panelRects();
      const keys = Object.keys(Data.TACTICS);
      for (let i = 0; i < 4; i++) if (Input.hit('c' + (i + 1))) this.setTactic(keys[i]);
      r.tacs.forEach((b) => { if (E.clickedIn(b)) this.setTactic(b.k); });
      r.field.forEach((b, i) => { if (E.clickedIn(b)) { if (this.subQueue.some((q) => q.outId === b.p.id)) return; pn.out = pn.out === i ? -1 : i; Sound.play('cursor'); } });
      r.bench.forEach((b, i) => { if (E.clickedIn(b)) { pn.inn = pn.inn === i ? -1 : i; Sound.play('cursor'); } });
      // keyboard: up/down moves through field then bench, ok toggles
      const n = r.field.length + r.bench.length;
      if (Input.hit('down')) { pn.cursor = (pn.cursor + 1) % n; Sound.play('cursor'); }
      if (Input.hit('up')) { pn.cursor = (pn.cursor + n - 1) % n; Sound.play('cursor'); }
      if (Input.hit('ok')) {
        if (pn.out >= 0 && pn.inn >= 0) this.confirmSub();
        else if (pn.cursor < r.field.length) { if (!this.subQueue.some((q) => q.outId === r.field[pn.cursor].p.id)) pn.out = pn.cursor; Sound.play('cursor'); }
        else { pn.inn = pn.cursor - r.field.length; Sound.play('cursor'); }
      }
      if (E.clickedIn(r.confirm)) this.confirmSub();
      if (Input.hit('back') || Input.hit('c5') || E.clickedIn(r.close)) this.closePanel();
    }
    setTactic(k) {
      if (this.tac[0] === k) return;
      this.tac[0] = k; Sound.play('stamp', { vol: 0.6 });
      const T = Data.TACTICS[k];
      this.benchBubble[0] = { text: { counter: '引いて守って速攻だ！', press: '前から奪いに行けぇ！', long: '前線に放り込め！', possession: 'つないで崩せ！' }[k], t: 2.4 };
      this.tick('ハマカゼ、戦術を「' + T.name + '」に変更。', '#ffd24a');
    }
    confirmSub() {
      const pn = this.panel, r = this.panelRects();
      if (pn.out < 0 || pn.inn < 0) { pn.msg = { text: '交代する2人を選んでください', t: 0 }; Sound.play('cancel'); return; }
      if (this.subsLeft <= 0) { pn.msg = { text: '交代枠はもう残っていません', t: 0 }; Sound.play('cancel'); return; }
      const outP = r.field[pn.out].p, inD = r.bench[pn.inn].d;
      if (outP.gk !== (inD.pos === 'GK')) { pn.msg = { text: 'GKはGK同士でしか交代できません', t: 0 }; Sound.play('cancel'); return; }
      this.subsLeft--;
      this.subQueue.push({ outId: outP.id, inDef: inD, at: this.clock + (this.half - 1) * 1000 });
      this.bench.splice(pn.inn, 1);
      pn.out = pn.inn = -1;
      Sound.play('stamp');
      if (this.state !== 'play') this.applySubs();
      else { pn.msg = { text: '次にプレーが止まったら交代します', t: 0 }; this.tick('ハマカゼ、選手交代の準備。', '#c9d6e6'); }
    }
    applySubs() {
      if (!this.subQueue.length) return;
      for (const q of this.subQueue) {
        const idx = this.players.findIndex((p) => p.team === 0 && p.id === q.outId);
        if (idx < 0) continue;
        const old = this.players[idx];
        const np = this.mk(q.inDef, 0, old.gk ? 0 : old.slot + 1);
        np.x = old.gk ? old.x : clamp(old.x, CX - 200, CX + 200); np.y = old.gk ? old.y : P.y + P.h + 6;
        np.face = 'up';
        this.players[idx] = np;
        if (this.ball.owner === old) this.ball.owner = null;
        this.subbedOut.push(old);
        this.toast('交代　' + old.name + ' → ' + np.name, '#9fdcff');
        this.cutin = { id: np.id, expr: 'determined', t: 0, dur: 2.2, text: '「' + (q.inDef.nick || '') + '」' + np.name, color: '#2f86c4' };
        this.tick('選手交代。' + old.name + 'に代わって、「' + (q.inDef.nick || '') + '」' + np.name + '！', '#9fdcff');
        this.say(np, pick(['いってきます！', 'まかせて！', '出番だ！']), 1.4);
      }
      Sound.play('whistle', { vol: 0.6 });
      this.subQueue = [];
      const ids = this.team(0).map((p) => p.id);
      const before = this.combos.map((c) => c.id);
      this.combos = Data.COMBOS.filter((c) => c.ids.every((id) => ids.includes(id)));
      const born = this.combos.find((c) => !before.includes(c.id));
      if (born) setTimeout(() => this.comboFx(born.id), 1200);
    }
    drawPanel(g) {
      const pn = this.panel, r = this.panelRects();
      const k = Ease.outCubic(clamp(pn.t / 0.25, 0, 1));
      g.globalAlpha = 0.75 * k; g.fillStyle = '#0a0e1c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      const oy = Math.round((1 - k) * 20);
      g.save(); g.translate(0, oy);
      panel(g, 16, 20, W - 32, 234, 'paper');
      text(g, 'ベンチ指示', 26, 25, { size: 12, color: '#10304f' });
      text(g, '試合は一時停止中', 110, 28, { size: 8, color: '#9a8e7a' });
      text(g, '交代枠 残り ' + this.subsLeft, W - 28, 27, { size: 9, align: 'right', color: this.subsLeft ? '#2f86c4' : '#e0474c' });
      const keys = Object.keys(Data.TACTICS);
      r.tacs.forEach((b, i) => {
        const T = Data.TACTICS[b.k], cur = this.tac[0] === b.k, hv = E.hoverIn({ x: b.x, y: b.y + oy, w: b.w, h: b.h });
        panel(g, b.x, b.y, b.w, b.h, cur ? 'gold' : hv ? 'sky' : ['#2a1a24', '#f2e3c2', '#d9c39a', '#fff6e0']);
        g.fillStyle = T.color; g.fillRect(b.x + 5, b.y + 5, 4, b.h - 10);
        text(g, (i + 1) + ' ' + T.name, b.x + 13, b.y + 4, { size: 10, color: '#2a1a24' });
        const mu = Data.MATCHUP[b.k][this.tac[1]];
        text(g, '実現' + Math.round((this.realize(0, b.k) - 0.5) * 200) + '%', b.x + 13, b.y + 15, { size: 8, color: cur ? '#e0474c' : '#6d4f3a' });
        text(g, mu[0], b.x + b.w - 6, b.y + 9, { size: 10, align: 'right', color: mu[0].startsWith('○') ? '#2f86c4' : mu[0].startsWith('△−') ? '#e0474c' : '#6d4f3a' });
      });
      const mu0 = Data.MATCHUP[this.tac[0]][this.tac[1]];
      text(g, Data.TACTICS[this.tac[0]].desc + '　対' + Data.TACTICS[this.tac[1]].name + '：' + mu0[1], 26, 73, { size: 8, color: '#4a2a10' });
      g.fillStyle = '#d9c39a'; g.fillRect(24, 84, W - 48, 1);
      text(g, 'ピッチ上（交代する選手）', 24, 88, { size: 8, color: '#6d4f3a' });
      text(g, 'ベンチ（入る選手）', 244, 88, { size: 8, color: '#6d4f3a' });
      r.field.forEach((b, i) => {
        const p = b.p, sel = pn.out === i, cur = pn.cursor === i, queued = this.subQueue.some((q) => q.outId === p.id);
        if (sel || cur || E.hoverIn({ x: b.x, y: b.y + oy, w: b.w, h: b.h })) { g.fillStyle = sel ? '#ffd24a' : 'rgba(79,180,232,0.25)'; g.fillRect(b.x, b.y, b.w, b.h); }
        text(g, this.role(p), b.x + 2, b.y + 2, { size: 8, color: '#2f86c4' });
        text(g, p.name + (queued ? '（交代待ち）' : ''), b.x + 22, b.y + 1, { size: 9, color: queued ? '#9a8e7a' : '#2a1a24' });
        g.fillStyle = '#2a1a24'; g.fillRect(b.x + 150, b.y + 3, 52, 6);
        g.fillStyle = p.sta > 50 ? '#6cc35a' : p.sta > 25 ? '#ffd24a' : '#e0474c';
        g.fillRect(b.x + 151, b.y + 4, Math.round(p.sta * 0.5), 4);
      });
      if (!r.bench.length) text(g, 'ベンチに選手がいません', 250, 104, { size: 9, color: '#9a8e7a' });
      r.bench.forEach((b, i) => {
        const d = b.d, sel = pn.inn === i, cur = pn.cursor === r.field.length + i;
        panel(g, b.x, b.y, b.w, b.h, sel ? 'gold' : cur || E.hoverIn({ x: b.x, y: b.y + oy, w: b.w, h: b.h }) ? 'sky' : ['#2a1a24', '#fff6e0', '#e8d6ae', '#ffffff']);
        g.drawImage(Art.sprite(d.look, 'down', 'walk1'), b.x + 3, b.y + 1);
        text(g, d.name + '　' + d.pos, b.x + 22, b.y + 2, { size: 9, color: '#2a1a24' });
        text(g, '「' + d.nick + '」' + d.trait, b.x + 22, b.y + 13, { size: 8, color: '#6d4f3a' });
      });
      // preview combos gained/lost
      if (pn.out >= 0 && pn.inn >= 0) {
        const outId = r.field[pn.out].p.id, inId = r.bench[pn.inn].d.id;
        const ids = this.team(0).map((p) => (p.id === outId ? inId : p.id));
        const after = Data.COMBOS.filter((c) => c.ids.every((id) => ids.includes(id)));
        const gained = after.filter((c) => !this.combos.some((x) => x.id === c.id)), lost = this.combos.filter((c) => !after.some((x) => x.id === c.id));
        let y = 100 + r.bench.length * 26 + 2;
        gained.forEach((c) => { text(g, (c.kind === 'bad' ? '＋ケンカ「' : '＋コンビ「') + c.name + '」', 246, y, { size: 8, color: c.kind === 'bad' ? '#e0474c' : '#2f86c4' }); y += 11; });
        lost.forEach((c) => { text(g, '－「' + c.name + '」解消', 246, y, { size: 8, color: '#9a8e7a' }); y += 11; });
      }
      const can = pn.out >= 0 && pn.inn >= 0 && this.subsLeft > 0;
      panel(g, r.confirm.x, r.confirm.y, r.confirm.w, r.confirm.h, can ? 'gold' : ['#2a1a24', '#c9bda8', '#a89c86', '#e0d6c4']);
      text(g, '交代する', r.confirm.x + r.confirm.w / 2, r.confirm.y + 5, { size: 10, align: 'center', color: can ? '#2a1a24' : '#7a6e5a' });
      panel(g, r.close.x, r.close.y, r.close.w, r.close.h, E.hoverIn({ x: r.close.x, y: r.close.y + oy, w: r.close.w, h: r.close.h }) ? 'sky' : 'dark');
      text(g, '閉じる（X）', r.close.x + r.close.w / 2, r.close.y + 5, { size: 9, align: 'center', color: '#ffffff' });
      if (pn.msg) text(g, pn.msg.text, 244, 230, { size: 9, color: '#e0474c' });
      else text(g, '1〜4：戦術　クリック/Z：選手を選ぶ', 244, 231, { size: 8, color: '#9a8e7a' });
      g.restore();
    }
    drawLineups(g) {
      // starting line-ups with nicknames, TV-style
      const t = this.stateT;
      const out = clamp((t - 4.8) / 0.4, 0, 1);
      g.globalAlpha = 0.7 * (1 - out); g.fillStyle = '#0a0e1c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      for (let side = 0; side < 2; side++) {
        const k = Ease.outCubic(clamp((t - 0.2 - side * 0.25) / 0.45, 0, 1));
        const x0 = side === 0 ? -240 + k * 250 - out * 260 : W + 10 - k * 250 + out * 260;
        const x = Math.round(x0), y = 26;
        panel(g, x, y, 226, 212, side === 0 ? 'sky' : 'crimson');
        MatchCrest(g, x + 8, y + 7, side);
        text(g, side === 0 ? 'ハマカゼFC' : 'ヤマオロシ鉄工団', x + 26, y + 7, { size: 11, color: '#ffffff', outline: side === 0 ? '#10304f' : '#4a1018' });
        text(g, Data.TACTICS[this.tac[side]].name + '・' + this.form[side].name.split(' ')[1], x + 218, y + 9, { size: 8, align: 'right', color: '#ffffff' });
        const list = this.team(side).slice().sort((a, c) => (a.gk ? -1 : c.gk ? 1 : a.slot - c.slot));
        list.forEach((p, i) => {
          const rk = clamp((t - 0.5 - side * 0.25 - i * 0.07) / 0.2, 0, 1);
          if (rk <= 0) return;
          const yy = y + 26 + i * 16;
          g.globalAlpha = rk;
          g.fillStyle = side === 0 ? '#10304f' : '#4a1018'; g.fillRect(x + 6, yy, 214, 14);
          text(g, this.role(p), x + 10, yy + 3, { size: 8, color: '#ffd24a' });
          text(g, p.name, x + 30, yy + 2, { size: 9, color: '#ffffff' });
          if (p.def.nick) text(g, '「' + p.def.nick + '」', x + 216, yy + 3, { size: 8, align: 'right', color: side === 0 ? '#9fdcff' : '#ffb0a0' });
          g.globalAlpha = 1;
        });
      }
      if (t > 1.2) text(g, 'Z / クリックでスキップ', W / 2, H - 16, { size: 8, align: 'center', color: '#ffffff', alpha: (0.5 + 0.5 * Math.sin(Game.time * 5)) * (1 - out) });
    }
    drawOverlay(g) {
      this.drawHUD(g);
      this.fxTop.draw(g);
      for (const bn of this.banners) this.drawBanner(g, bn);
      if (this.comboShow) this.drawCombo(g);
      if (this.cutin) this.drawCutin(g, this.cutin);
      if (this.meter) this.drawMeter(g);
      if (this.halftimeUI) this.drawHalftime(g);
      if (this.state === 'intro' && this.half === 1 && this.stateT < 5.4) this.drawLineups(g);
      if (this.tacToast) this.drawToast(g);
      if (this.panel) this.drawPanel(g);
      if (this.state === 'fulltime' && this.stateT > 2.4) {
        const a = 0.6 + 0.4 * Math.sin(Game.time * 5);
        text(g, 'クリック / Zキー で結果へ', W / 2, H / 2 + 26, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f', alpha: a });
      }
    }

    drawHUD(g) {
      // top bar
      g.fillStyle = '#10182e'; g.fillRect(0, 0, W, TOP_H);
      g.fillStyle = '#2a3a6a'; g.fillRect(0, TOP_H - 2, W, 1);
      g.fillStyle = '#0a0e1c'; g.fillRect(0, TOP_H - 1, W, 1);
      // team plates
      panel(g, 4, 2, 150, 16, 'sky');
      crest(g, 8, 4, 0);
      text(g, 'ハマカゼFC', 24, 5, { size: 10, color: '#ffffff', outline: '#10304f' });
      panel(g, W - 154, 2, 150, 16, 'crimson');
      crest(g, W - 20, 4, 1);
      text(g, 'ヤマオロシ鉄工団', W - 24, 5, { size: 10, align: 'right', color: '#ffffff', outline: '#4a1018' });
      for (let t = 0; t < 2; t++) {
        const T = Data.TACTICS[this.tac[t]];
        const cx0 = t === 0 ? 104 : W - 150, cw = 44;
        g.fillStyle = '#10182e'; g.fillRect(cx0, 5, cw, 11);
        g.fillStyle = T.color; g.fillRect(cx0 + 1, 6, 3, 9);
        text(g, T.short + (this.counterT[t] > 0 ? '!' : ''), cx0 + 26, 6, { size: 8, align: 'center', color: this.counterT[t] > 0 && Math.floor(Game.time * 6) % 2 ? '#ffd24a' : '#ffffff' });
        const rz = (this.realize(t) - 0.5) * 2;
        g.fillStyle = '#3a4466'; g.fillRect(cx0 + 5, 15, cw - 6, 1);
        g.fillStyle = T.color; g.fillRect(cx0 + 5, 15, Math.round((cw - 6) * rz), 1);
      }
      // score
      panel(g, W / 2 - 50, 1, 100, 18, 'dark');
      const sc = this.score;
      text(g, String(sc[0]), W / 2 - 36, 3, { size: 14, align: 'center', color: '#9fdcff', outline: '#0a0e1c' });
      text(g, String(sc[1]), W / 2 + 36, 3, { size: 14, align: 'center', color: '#ffb0a0', outline: '#0a0e1c' });
      const hl = this.half === 1 ? '前半' : '後半';
      text(g, hl, W / 2, 2, { size: 8, align: 'center', color: '#c9d6e6' });
      text(g, this.minute() + "'", W / 2, 10, { size: 8, align: 'center', color: '#ffd24a' });
      // possession bar under
      const tot = this.poss[0] + this.poss[1] || 1;
      const pw = Math.round(64 * this.poss[0] / tot);
      g.fillStyle = '#4fb4e8'; g.fillRect(W / 2 - 32, 18, pw, 1); g.fillStyle = '#b8323a'; g.fillRect(W / 2 - 32 + pw, 18, 64 - pw, 1);

      // bottom panel
      const by = H - BOT_H;
      g.fillStyle = '#10182e'; g.fillRect(0, by, W, BOT_H);
      g.fillStyle = '#2a3a6a'; g.fillRect(0, by, W, 1);
      // ticker
      const ln = this.ticker.lines[this.ticker.lines.length - 1];
      if (ln) {
        const n = Math.min(ln.text.length, Math.floor(ln.t * 40));
        text(g, ln.text.slice(0, n), 6, by + 3, { size: 9, color: ln.color });
      }
      // order buttons
      const ords = Data.ORDERS;
      this.hover = -1;
      for (let i = 0; i < 4; i++) {
        const r = this.orderRect(i), o = ords[i];
        const active = this.order[0] && this.order[0].id === o.id;
        const can = this.kiai[0] >= o.cost && this.state === 'play';
        const hov = E.hoverIn(r) && can;
        const style = active ? 'gold' : !can ? ['#0a0e1c', '#3a4466', '#2a3252', '#4a5480'] : hov ? ['#10304f', '#ffffff', '#c9e8ff', '#ffffff'] : 'sky';
        const push = hov && Input.mouse.down ? 1 : 0;
        panel(g, r.x, r.y + push, r.w, r.h, style);
        // key badge
        g.fillStyle = '#10182e'; g.fillRect(r.x + 4, r.y + 4 + push, 11, 11);
        text(g, o.key, r.x + 9.5, r.y + 5 + push, { size: 9, align: 'center', color: '#ffd24a' });
        text(g, o.label, r.x + 18, r.y + 3 + push, { size: 10, color: can || active ? '#10182e' : '#8a94b8' });
        text(g, o.sub, r.x + 18, r.y + 16 + push, { size: 8, color: can || active ? '#20406a' : '#6a7498' });
        if (active) {
          const k = this.order[0].t / this.order[0].dur;
          g.fillStyle = '#4a2a10'; g.fillRect(r.x + 3, r.y + r.h - 4, r.w - 6, 2);
          g.fillStyle = '#ffffff'; g.fillRect(r.x + 3, r.y + r.h - 4, Math.round((r.w - 6) * k), 2);
        }
      }
      // bench button
      {
        const r = this.benchRect(), hov = E.hoverIn(r);
        const push = hov && Input.mouse.down ? 1 : 0;
        panel(g, r.x, r.y + push, r.w, r.h, this.subQueue.length ? 'gold' : hov ? ['#10304f', '#ffffff', '#c9e8ff', '#ffffff'] : ['#2a0e14', '#e8d6ae', '#c9a070', '#fff6e0']);
        g.fillStyle = '#10182e'; g.fillRect(r.x + 4, r.y + 4 + push, 11, 11);
        text(g, '5', r.x + 9.5, r.y + 5 + push, { size: 9, align: 'center', color: '#ffd24a' });
        text(g, 'ベンチ', r.x + 18, r.y + 3 + push, { size: 10, color: '#10182e' });
        text(g, this.subQueue.length ? '交代待ち' : '交代 ' + this.subsLeft, r.x + 18, r.y + 16 + push, { size: 8, color: '#4a2a10' });
      }
      // kiai gauge
      const gx = 358, gy = by + 18;
      text(g, '気合', gx, gy - 2, { size: 8, color: '#ffd24a' });
      g.fillStyle = '#0a0e1c'; g.fillRect(gx, gy + 8, 40, 20);
      const kv = this.kiai[0] / 100;
      const fillH = Math.round(18 * kv);
      g.fillStyle = kv >= 0.35 ? '#ffd24a' : '#d48a1e';
      g.fillRect(gx + 1, gy + 27 - fillH, 38, fillH);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(gx + 1, gy + 27 - fillH, 38, 1);
      for (let i = 1; i < 4; i++) { g.fillStyle = '#10182e'; g.fillRect(gx + 1, gy + 9 + i * 4.5, 38, 1); }
      text(g, Math.floor(this.kiai[0]) + '', gx + 20, gy + 13, { size: 8, align: 'center', color: '#ffffff', outline: '#0a0e1c' });
      // minimap
      const mx = 404, my = by + 6, mw = 72, mh = 40;
      g.fillStyle = '#2a1a24'; g.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
      g.fillStyle = '#3f8a3e'; g.fillRect(mx, my, mw, mh);
      g.fillStyle = '#4fa84a'; for (let i = 0; i < 6; i++) g.fillRect(mx + i * 12, my, 6, mh);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(mx + mw / 2, my, 1, mh);
      g.fillRect(mx, my + mh / 2 - 6, 1, 12); g.fillRect(mx + mw - 1, my + mh / 2 - 6, 1, 12);
      const sx = mw / P.w, sy2 = mh / P.h;
      // each side's defensive line (second-last defender) shows how high the block sits
      for (let t = 0; t < 2; t++) {
        const xs = this.team(t).filter((q) => !q.gk).map((q) => q.x).sort((a, c) => (t === 0 ? a - c : c - a));
        g.fillStyle = t === 0 ? 'rgba(159,220,255,0.7)' : 'rgba(255,120,120,0.7)';
        g.fillRect(Math.round(mx + (xs[1] - P.x) * sx), my, 1, mh);
      }
      for (const p of this.players) {
        g.fillStyle = p.team === 0 ? '#9fdcff' : '#ff6a6a';
        g.fillRect(Math.round(mx + (p.x - P.x) * sx) - 1, Math.round(my + (p.y - P.y) * sy2) - 1, 2, 2);
      }
      g.fillStyle = '#ffffff';
      g.fillRect(Math.round(mx + (this.ball.x - P.x) * sx) - 1, Math.round(my + (this.ball.y - P.y) * sy2) - 1, 3, 3);
      // camera rect
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.strokeRect(Math.round(mx + (this.cam.x - P.x) * sx) + 0.5, Math.round(my + (this.cam.y - P.y) * sy2) + 0.5, Math.round(W * sx), Math.round(VIEW_H * sy2));
    }

    drawBanner(g, bn) {
      const t = bn.t, d = bn.dur;
      const out = Math.max(0, (t - (d - 0.35)) / 0.35);
      if (bn.style === 'goal') {
        const letters = bn.text.split('');
        const size = 44;
        E.setFont(g, size);
        const total = g.measureText(bn.text).width;
        let x = W / 2 - total / 2;
        // band
        const bandA = Math.min(1, t * 5) * (1 - out);
        g.globalAlpha = bandA * 0.85;
        g.fillStyle = '#10304f'; g.fillRect(0, H / 2 - 42, W, 64);
        g.fillStyle = '#4fb4e8'; g.fillRect(0, H / 2 - 44, W, 2); g.fillRect(0, H / 2 + 22, W, 2);
        // speed lines
        g.fillStyle = 'rgba(159,220,255,0.35)';
        for (let i = 0; i < 14; i++) { const ly = H / 2 - 40 + ((i * 37) % 60); const lx = ((Game.time * 600 + i * 97) % (W + 100)) - 100; g.fillRect(W - lx, ly, 60, 1); }
        g.globalAlpha = 1;
        letters.forEach((ch, i) => {
          const lt = clamp((t - i * 0.06) / 0.4, 0, 1);
          const w = g.measureText(ch).width;
          const yy = H / 2 - 34 - (1 - Ease.outBack(lt)) * 40 + Math.sin(Game.time * 8 + i) * 2;
          if (lt > 0) text(g, ch, x + w / 2, yy - out * 30, { size, align: 'center', color: i % 2 ? '#ffd24a' : '#ffffff', outline: '#10304f', outlineW: 2, alpha: (1 - out) });
          x += w;
        });
        return;
      }
      if (bn.style === 'concede') {
        const a = Math.min(1, t * 4) * (1 - out);
        g.globalAlpha = a * 0.7; g.fillStyle = '#2a0e14'; g.fillRect(0, H / 2 - 24, W, 40); g.globalAlpha = 1;
        text(g, bn.text, W / 2, H / 2 - 18, { size: 24, align: 'center', color: '#ffb0a0', outline: '#2a0e14', outlineW: 2, alpha: a });
        return;
      }
      const inK = Ease.outBack(clamp(t / 0.35, 0, 1));
      const a = 1 - out;
      const size = bn.style === 'big' ? 30 : 22;
      const bw = W * inK;
      g.globalAlpha = a * 0.85; g.fillStyle = '#10182e'; g.fillRect(W / 2 - bw / 2, H / 2 - 28, bw, 44);
      g.fillStyle = '#ffd24a'; g.fillRect(W / 2 - bw / 2, H / 2 - 28, bw, 2); g.fillRect(W / 2 - bw / 2, H / 2 + 14, bw, 2);
      g.globalAlpha = 1;
      text(g, bn.text, W / 2 + (1 - inK) * 80, H / 2 - 6 - size / 2, { size, align: 'center', color: '#ffffff', outline: '#10304f', outlineW: 2, alpha: a });
    }

    drawToast(g) {
      const ts = this.tacToast, k = Ease.outBack(clamp(ts.t / 0.25, 0, 1)), a = 1 - clamp((ts.t - 1.8) / 0.4, 0, 1);
      E.setFont(g, 10);
      const w = Math.ceil(g.measureText(ts.text).width) + 20;
      g.globalAlpha = a;
      panel(g, Math.round(W / 2 - w / 2), TOP_H + 4 - Math.round((1 - k) * 16), w, 17, 'dark');
      text(g, ts.text, W / 2, TOP_H + 7 - Math.round((1 - k) * 16), { size: 10, align: 'center', color: ts.color });
      g.globalAlpha = 1;
    }
    drawCombo(g) {
      const cs = this.comboShow, c = cs.c, t = cs.t;
      const inK = Ease.outBack(clamp(t / 0.35, 0, 1)), out = clamp((t - 2.4) / 0.3, 0, 1);
      const w = 196, x = Math.round(W - w - 6 + (1 - inK) * 220 + out * 220), y = TOP_H + 6;
      const style = c.kind === 'bad' ? 'crimson' : c.kind === 'mixed' ? ['#2a1a24', '#b06ad8', '#7a4aa0', '#d8a8f0'] : 'gold';
      panel(g, x, y, w, 34, style);
      c.ids.forEach((id, i) => {
        const img = portrait(id, c.kind === 'bad' ? 'determined' : 'happy');
        g.fillStyle = '#10182e'; g.fillRect(x + 4 + i * 27, y + 4, 26, 26);
        if (img) g.drawImage(img, 11, 6, 24, 24, x + 5 + i * 27, y + 5, 24, 24);
      });
      text(g, c.kind === 'bad' ? 'ケンカ発動！' : 'コンビ発動！', x + 62, y + 4, { size: 8, color: c.kind === 'bad' ? '#ffe0e0' : '#4a2a10' });
      text(g, c.name, x + 62, y + 16, { size: 11, color: c.kind === 'bad' || c.kind === 'mixed' ? '#ffffff' : '#2a1a24', outline: c.kind === 'bad' || c.kind === 'mixed' ? '#2a0e14' : undefined });
    }
    drawCutin(g, c) {
      const t = c.t, d = c.dur;
      const inK = Ease.outCubic(clamp(t / 0.3, 0, 1));
      const out = clamp((t - (d - 0.3)) / 0.3, 0, 1);
      const x = -150 + inK * 150 - out * 180;
      const y = TOP_H + 26;
      g.save();
      g.globalAlpha = 1 - out;
      g.fillStyle = c.color; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 170, y); g.lineTo(x + 150, y + 60); g.lineTo(x, y + 60); g.fill();
      g.fillStyle = '#10182e'; g.fillRect(x, y + 60, 150, 3);
      const img = portrait(c.id, c.expr);
      if (img) g.drawImage(img, Math.round(x + 6), y + 6, 48, 48);
      if (c.nick) text(g, '「' + c.nick + '」', Math.round(x + 60), y + 12, { size: 8, color: '#fff6e0', outline: '#10182e' });
      text(g, c.text, Math.round(x + 60), y + 24, { size: 10, color: '#ffffff', outline: '#10182e' });
      g.restore();
    }

    drawMeter(g) {
      const m = this.meter;
      const t = m.t;
      const inK = Ease.outCubic(clamp(t / 0.3, 0, 1));
      const outK = m.result ? clamp((m.rt - 0.3) / 0.25, 0, 1) : 0;
      const chance = m.kind === 'chance';
      // dim + vignette
      g.globalAlpha = 0.45 * inK * (1 - outK); g.fillStyle = '#0a0e1c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      // speed lines
      g.save(); g.globalAlpha = (1 - outK) * 0.6;
      g.fillStyle = chance ? '#9fdcff' : '#ffb0a0';
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2 + Game.time * 0.3;
        const r0 = 150 + ((Game.time * 300 + i * 53) % 90);
        const x0 = W / 2 + Math.cos(a) * r0, y0 = H / 2 + Math.sin(a) * r0 * 0.7;
        g.fillRect(Math.round(x0), Math.round(y0), 3, 3);
        g.fillRect(Math.round(x0 + Math.cos(a) * 12), Math.round(y0 + Math.sin(a) * 8), 2, 2);
      }
      g.restore();
      // cut-in band
      const bandY = 40;
      const bx = -W + inK * W + outK * W;
      g.save(); g.globalAlpha = 1 - outK;
      g.fillStyle = chance ? '#2f86c4' : '#9e2a3a';
      g.beginPath(); g.moveTo(bx, bandY + 10); g.lineTo(bx + W, bandY); g.lineTo(bx + W, bandY + 70); g.lineTo(bx, bandY + 80); g.fill();
      g.fillStyle = chance ? '#9fdcff' : '#ffb0a0';
      g.fillRect(bx, bandY + 80, W, 2);
      // stripes
      g.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 10; i++) g.fillRect(bx + ((i * 61 + Game.time * 200) % (W + 40)) - 40, bandY + 4, 18, 76);
      const img = portrait(m.face, chance ? 'determined' : 'surprised');
      if (img) {
        const px = Math.round(bx + 40), py = bandY + 4;
        g.fillStyle = '#10182e'; g.fillRect(px - 2, py - 2, 76, 76);
        g.fillStyle = chance ? '#9fdcff' : '#ffb0a0'; g.fillRect(px, py, 72, 72);
        g.drawImage(img, px, py, 72, 72);
      }
      const title = chance ? 'CHANCE!!' : 'PINCH!!';
      const gkName = this.gk(0).name;
      const sub = chance ? '「' + (m.p.def.nick || '') + '」' + m.p.name + '、シュートチャンス！' : m.p.name + 'のシュート！ 止めろ、' + gkName + '！';
      text(g, title, Math.round(bx + 130), bandY + 14, { size: 30, color: '#ffffff', outline: chance ? '#10304f' : '#4a1018', outlineW: 2 });
      text(g, sub, Math.round(bx + 132), bandY + 52, { size: 10, color: '#fff6e0', outline: chance ? '#10304f' : '#4a1018' });
      g.restore();
      // timing bar
      if (t > 0.3) {
        const bw = 200, bh = 16, x = W / 2 - bw / 2, y = 150;
        g.globalAlpha = 1 - outK;
        panel(g, x - 8, y - 18, bw + 16, bh + 44, 'dark');
        text(g, chance ? 'タイミングよく Z / クリック でシュート！' : 'タイミングよく Z / クリック で飛びつけ！', W / 2, y - 13, { size: 8, align: 'center', color: '#fff6e0' });
        g.fillStyle = '#0a0e1c'; g.fillRect(x, y, bw, bh);
        g.fillStyle = '#3a4466'; g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
        g.fillStyle = '#4fb4e8'; g.fillRect(x + bw * 0.33, y + 1, bw * 0.34, bh - 2);
        g.fillStyle = '#ffd24a'; g.fillRect(Math.round(x + bw * (0.5 - m.just)), y + 1, Math.round(bw * m.just * 2), bh - 2);
        g.fillStyle = '#fff1a0'; g.fillRect(Math.round(x + bw * (0.5 - m.just)), y + 1, Math.round(bw * m.just * 2), 2);
        text(g, 'JUST', W / 2, y + 4, { size: 8, align: 'center', color: '#4a2a10' });
        const cx2 = Math.round(x + m.pos * bw);
        g.fillStyle = '#ffffff'; g.fillRect(cx2 - 1, y - 4, 3, bh + 8);
        g.fillStyle = '#10182e'; g.fillRect(cx2 - 3, y - 6, 7, 2); g.fillRect(cx2 - 3, y + bh + 4, 7, 2);
        if (m.msg) {
          const k = Ease.outBack(clamp(m.rt / 0.2, 0, 1));
          text(g, m.msg.text, W / 2, y + 22 - k * 4, { size: m.result === 'just' ? 16 : 12, align: 'center', color: m.msg.color, outline: '#10182e', outlineW: 1 });
        }
        g.globalAlpha = 1;
      }
    }

    drawHalftime(g) {
      const h = this.halftimeUI;
      const k = Ease.outCubic(clamp(h.t / 0.4, 0, 1));
      g.globalAlpha = 0.8 * (h.phase === 'talk' ? k : 1); g.fillStyle = '#0a0e1c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      // locker room panel
      panel(g, 16, 30 - (1 - k) * 20, W - 32, H - 48, 'paper');
      text(g, 'ハーフタイム', 32, 40, { size: 16, color: '#10304f' });
      text(g, `ハマカゼFC ${this.score[0]} - ${this.score[1]} ヤマオロシ鉄工団`, W - 32, 44, { size: 10, align: 'right', color: '#2a1a24' });
      g.fillStyle = '#d9c39a'; g.fillRect(28, 60, W - 56, 1);
      // stats
      const tot = this.poss[0] + this.poss[1] || 1;
      const rows = [['支配率', Math.round(this.poss[0] / tot * 100) + '%', Math.round(this.poss[1] / tot * 100) + '%'], ['シュート', this.shots[0], this.shots[1]], ['枠内', this.onTarget[0], this.onTarget[1]]];
      rows.forEach((r, i) => {
        const y = 70 + i * 14;
        text(g, String(r[1]), 60, y, { size: 10, align: 'center', color: '#2f86c4' });
        text(g, r[0], 120, y, { size: 9, align: 'center', color: '#6d4f3a' });
        text(g, String(r[2]), 180, y, { size: 10, align: 'center', color: '#b8323a' });
      });
      // stamina list
      text(g, 'スタミナ', 36, 116, { size: 9, color: '#6d4f3a' });
      this.team(0).forEach((p, i) => {
        const col = i < 6 ? 0 : 1, y = 128 + (i % 6) * 12, x0 = 36 + col * 104;
        text(g, p.name, x0, y, { size: 8, color: '#2a1a24' });
        g.fillStyle = '#2a1a24'; g.fillRect(x0 + 48, y + 2, 46, 6);
        g.fillStyle = p.sta > 50 ? '#6cc35a' : p.sta > 25 ? '#ffd24a' : '#e0474c';
        g.fillRect(x0 + 49, y + 3, Math.round(p.sta * 0.44), 4);
      });
      // Nagisa's notes so far
      g.fillStyle = '#e8d6ae'; g.fillRect(30, 204, 196, 34);
      text(g, 'ナギサのメモ', 34, 206, { size: 8, color: '#2f86c4' });
      const ms = this.memos.slice(-2);
      if (!ms.length) text(g, '今のところ大きな問題はなし！', 34, 218, { size: 8, color: '#6d4f3a' });
      ms.forEach((m, i) => E.wrap(g, '・' + m.text, 188, 8).slice(0, 1).forEach((l) => text(g, l, 34, 217 + i * 10, { size: 8, color: '#2a1a24' })));
      // manager talk
      const img = portrait('nagisa', 'normal');
      if (h.phase === 'talk') {
        if (img) g.drawImage(img, 244, 64, 48, 48);
        panel(g, 296, 66, 168, 44, 'sky');
        const lines = E.wrap(g, '監督、後半に向けてみんなに一言お願いします！', 156, 9);
        lines.forEach((l, i) => text(g, l, 302, 72 + i * 12, { size: 9, color: '#10182e' }));
        const opts = this.halftimeOptions();
        opts.forEach((o, i) => {
          const r = this.htRect(i);
          const sel = h.sel === i;
          panel(g, r.x + (sel ? 4 : 0), r.y, r.w, r.h, sel ? 'gold' : 'paper');
          text(g, (sel ? '▶ ' : '') + o.label, r.x + 8 + (sel ? 4 : 0), r.y + 4, { size: 10, color: '#2a1a24' });
          text(g, o.desc, r.x + 8 + (sel ? 4 : 0), r.y + 17, { size: 8, color: '#6d4f3a' });
        });
      } else if (h.reply) {
        const rimg = portrait(h.reply.who, h.reply.expr);
        if (rimg) g.drawImage(rimg, 244, 90, 64, 64);
        panel(g, 312, 96, 152, 60, 'paper');
        const lines = E.wrap(g, h.reply.text, 140, 10);
        lines.forEach((l, i) => text(g, l, 318, 102 + i * 13, { size: 10, color: '#2a1a24' }));
        if (h.t > 0.6) text(g, '▼ 後半へ', 452, 196, { size: 10, align: 'right', color: '#2f86c4', alpha: 0.6 + 0.4 * Math.sin(Game.time * 6) });
      }
    }
  }

  function crest(g, x, y, t) {
    g.fillStyle = '#2a1a24'; g.fillRect(x, y, 12, 12);
    g.fillStyle = t === 0 ? '#ffffff' : '#3a3340'; g.fillRect(x + 1, y + 1, 10, 10);
    if (t === 0) {
      g.fillStyle = '#4fb4e8'; g.fillRect(x + 1, y + 6, 10, 5);
      g.fillStyle = '#ffffff'; g.fillRect(x + 2, y + 7, 3, 1); g.fillRect(x + 6, y + 8, 3, 1);
      g.fillStyle = '#e0474c'; g.fillRect(x + 4, y + 2, 4, 3);
    } else {
      g.fillStyle = '#b8323a'; g.fillRect(x + 2, y + 5, 8, 5);
      g.fillStyle = '#ff8a5a'; g.fillRect(x + 5, y + 2, 2, 4);
    }
  }

  const benchLooks = {};
  function benchLook(id) {
    if (benchLooks[id]) return benchLooks[id];
    const base = { key: 'bench_' + id, shorts: '#3a3340', shortsD: '#26222c', socks: '#3a3340', skin: '#f7c9a0', skinD: '#dca27a' };
    const L = {
      nagisa: Object.assign({}, base, { shirt: '#2f86c4', shirtD: '#1f5a94', collar: '#ffffff', hair: '#4a2a20', hairD: '#2a1a14', style: 'ponytail', extra: 'cap' }),
      otaki: Object.assign({}, base, { shirt: '#8a5ab0', shirtD: '#5e3a80', collar: '#fff6e0', hair: '#c0c0c8', hairD: '#9090a0', style: 'short', extra: 'scarf', skin: '#f2d2b0', skinD: '#d8b090' }),
      onigawara: Object.assign({}, base, { shirt: '#2a2a38', shirtD: '#1a1a24', collar: '#b8323a', hair: '#1a1a1a', hairD: '#101010', style: 'bald', extra: 'mustache', skin: '#e8b088', skinD: '#c48860' }),
    }[id];
    benchLooks[id] = L;
    return L;
  }

  window.Match = Match;
  window.MatchCrest = crest;
  window.benchLook = benchLook;
})();
