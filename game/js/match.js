/* ハマカゼFC — match scene: 7v7 simulation, manager orders, chance/pinch timing events */
(function () {
  'use strict';
  const { Game, Input, Ease, Particles, clamp, lerp, rand, randi, pick, dist, text, panel, W, H } = E;
  const P = Art.PITCH;
  const CX = P.x + P.w / 2, CY = P.y + P.h / 2;
  const GW = Art.GOAL_W;
  const TOP_H = 20, BOT_H = 50, VIEW_H = H - TOP_H - BOT_H;
  const HALF_LEN = 70; // real seconds per half

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
      const home = opts.home || Data.HOME, away = opts.away || Data.AWAY;
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
        rec: { pass: 0, passOk: 0, shot: 0, goal: 0, tackle: 0, tackleOk: 0, save: 0, dist: 0, touch: 0, assist: 0, dribble: 0 },
      };
    }

    // ---------------- helpers ----------------
    team(t) { return this.players.filter((p) => p.team === t); }
    gk(t) { return this.players.find((p) => p.team === t && p.gk); }
    stat(p, k) {
      let v = p.st[k];
      if (p.team === 0) v *= this.moraleMul[0];
      if (p.team === 0 && this.boost[k]) v += this.boost[k];
      return v;
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
      const b = this.ball;
      Object.assign(b, { x: CX, y: CY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, pass: null, shot: null, inNet: false });
    }
    startPlay() {
      this.state = 'play'; this.stateT = 0;
      Sound.play('whistle');
      const t = this.kickTaker;
      this.ball.owner = t; this.ball.last = t;
      t.decT = 0.3;
      // first action: pass back
      const mates = this.team(t.team).filter((p) => p !== t && !p.gk);
      const m = mates.sort((a, b) => dist(a.x, a.y, t.x, t.y) - dist(b.x, b.y, t.x, t.y))[0];
      setTimeout(() => { if (this.ball.owner === t && this.state === 'play') this.doPass(t, m); }, 350);
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

      if (this.meter) { this.updateMeter(raw); }
      if (this.halftimeUI) { this.updateHalftime(raw); return; }

      // manager input
      if (this.state === 'play' && !this.meter) this.handleOrders();

      switch (this.state) {
        case 'intro':
          if (this.stateT > 0.6 && !this.introBanner) { this.introBanner = true; this.banner('KICK OFF!', 'big', 1.8); }
          if (this.stateT > 2.3) this.startPlay();
          break;
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
      const ords = Data.ORDERS;
      for (let i = 0; i < 4; i++) {
        const r = this.orderRect(i);
        const hit = Input.hit('c' + (i + 1)) || E.clickedIn(r);
        if (hit) this.issueOrder(0, ords[i]);
      }
      if (this.auto && Math.random() < 0.006) { const o = pick(ords); if (this.kiai[0] >= o.cost + 20) this.issueOrder(0, o); }
    }
    orderRect(i) { return { x: 4 + i * 88, y: H - 34, w: 84, h: 30 }; }
    issueOrder(team, o) {
      if (this.kiai[team] < o.cost) { if (team === 0) { Sound.play('miss_timing', { vol: 0.5 }); this.tick('ナギサ「監督、声が枯れてますよ！少し待って！」', '#ffb0a0'); } return; }
      this.kiai[team] -= o.cost;
      this.order[team] = { id: o.id, t: o.dur, dur: o.dur };
      this.benchBubble[team] = { text: team === 0 ? o.shout : pick(['押し込めぇ！', '鉄の意地を見せろ！', '踏ん張れぇ！']), t: 2.2 };
      if (team === 0) {
        Sound.play('command');
        Game.addShake(1.5, 0.15);
        const replies = ['おう！', 'はい！', '了解！', 'まかせろ！', 'うっす！'];
        this.team(0).forEach((p, i) => setTimeout(() => this.say(p, pick(replies), 1.0), 120 + i * 70));
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
        const ct = this.carrierTeam(); if (ct >= 0) this.poss[ct] += dt;
        for (let t = 0; t < 2; t++) {
          this.kiai[t] = Math.min(100, this.kiai[t] + dt * 5.5);
          if (this.order[t]) { this.order[t].t -= dt; if (this.order[t].t <= 0) this.order[t] = null; }
        }
        this.chanceCD -= dt; this.pinchCD -= dt;
        // AI coach
        this.aiCoachT -= dt;
        if (this.aiCoachT <= 0 && !this.order[1]) {
          this.aiCoachT = rand(16, 26);
          const diff = this.score[1] - this.score[0];
          const o = diff < 0 || (this.half === 2 && diff === 0) ? Data.ORDERS[0] : diff > 0 && this.half === 2 ? Data.ORDERS[1] : pick([Data.ORDERS[0], Data.ORDERS[2], Data.ORDERS[3]]);
          this.kiai[1] = 100; this.issueOrder(1, o);
        }
        if (this.clock >= HALF_LEN && !b.shot) { this.endHalf(); return; }
        if (this.half === 2) {
          this.evening = clamp(this.clock / HALF_LEN * 1.3, 0, 1);
          if (this.clock > HALF_LEN * 0.72 && !this.lateMusic) { this.lateMusic = true; Sound.bgm('match_late'); this.tick('試合は終盤！', '#ffd24a'); }
        }
      }
      b.kickImm -= dt;
      this.aiTargets(dt);
      this.moveAll(dt, false);
      this.updateBall(dt);
    }

    aiTargets(dt) {
      const b = this.ball;
      const ct = this.carrierTeam();
      const loose = !b.owner;
      // who chases a loose ball (per team)
      const chaser = [null, null];
      if (loose && !b.inNet && this.state === 'play') {
        const px = b.x + b.vx * 0.35, py = b.y + b.vy * 0.35;
        for (let t = 0; t < 2; t++) {
          let best = null, bt = 1e9;
          for (const p of this.team(t)) {
            if (p.state === 'down' || p.state === 'dive') continue;
            if (p.gk && !(Math.abs(px - ownGoalX(t)) < 70 && Math.abs(py - CY) < 70)) continue;
            if (b.pass && b.pass.to === p) { best = p; bt = -1; break; }
            if (b.lastKick === p && b.kickImm > 0) continue;
            const tt = dist(p.x, p.y, px, py) / this.speedOf(p);
            if (tt < bt) { bt = tt; best = p; }
          }
          chaser[t] = best;
        }
      }
      // presser (defending team nearest to carrier)
      let presser = null, cover = null;
      if (b.owner) {
        const dt2 = 1 - b.owner.team;
        const ds = this.team(dt2).filter((p) => !p.gk && p.state !== 'down').sort((a, c) => dist(a.x, a.y, b.x, b.y) - dist(c.x, c.y, b.x, b.y));
        presser = ds[0]; cover = ds[1];
      }
      for (const p of this.players) {
        if (p.state === 'down' || p.state === 'dive') continue;
        const t = p.team, dx = dirX(t);
        const ord = this.order[t] ? this.order[t].id : null;
        if (p.gk) { this.gkTarget(p, chaser); continue; }
        if (b.owner === p) { this.carrierAI(p, dt); continue; }
        if (loose && chaser[t] === p) {
          p.tx = b.x + b.vx * 0.3; p.ty = b.y + b.vy * 0.3; p.run = true; continue;
        }
        // base shape
        let [hx, hy] = this.slotPos(p);
        const attacking = ct === t;
        let shift = (b.x - CX) * 0.45;
        shift += attacking ? dx * 40 : -dx * 25;
        if (ord === 'attack') shift += dx * 50;
        if (ord === 'defend') shift -= dx * 55;
        hx += shift;
        hy = lerp(hy, b.y, 0.22);
        // forwards run into the box when attacking in the final third
        const fwd = (this.form[t].slots[p.slot] || [0.5])[0] > 0.6;
        const ballAdv = (b.x - CX) * dx;
        if (attacking && fwd && ballAdv > 40) {
          const gx = goalX(t) - dx * rand(40, 70);
          hx = lerp(hx, gx, 0.55); hy = lerp(hy, CY + (p.slot % 2 ? 36 : -36), 0.5);
        }
        if (!attacking && presser === p) { hx = b.x - dx * 4; hy = b.y; p.run = true; }
        else if (!attacking && cover === p && ord !== 'attack') { hx = lerp(b.x, ownGoalX(t), 0.3); hy = lerp(b.y, CY, 0.3); p.run = true; }
        else p.run = attacking && fwd;
        // keep in bounds & offside-ish (not beyond last defender + 20)
        hx = clamp(hx, P.x + 10, P.x + P.w - 10); hy = clamp(hy, P.y + 8, P.y + P.h - 8);
        // pass receiver waits
        if (b.pass && b.pass.to === p) { hx = b.pass.tx; hy = b.pass.ty; p.run = true; }
        p.tx = hx; p.ty = hy;
      }
      // tackles
      if (b.owner && presser && this.state === 'play' && !this.meter) {
        const c = b.owner;
        const d = dist(presser.x, presser.y, c.x, c.y);
        if (d < 10 && presser.tackCD <= 0) this.tryTackle(presser, c);
      }
      // separation
      for (const p of this.players) {
        if (p.gk) continue;
        for (const q of this.players) {
          if (q === p || q.team !== p.team) continue;
          const d = dist(p.tx, p.ty, q.x, q.y);
          if (d < 26 && d > 0.01) { p.tx += ((p.tx - q.x) / d) * (26 - d) * 0.5; p.ty += ((p.ty - q.y) / d) * (26 - d) * 0.5; }
        }
      }
    }

    gkTarget(p, chaser) {
      const b = this.ball, t = p.team, gx = ownGoalX(t), dx = dirX(t);
      if (b.owner === p) { this.carrierAI(p); return; }
      if (b.shot && b.shot.team !== t) {
        // dive logic
        const eta = (gx - b.x) / (b.vx || 0.001);
        if (eta > 0 && eta < 0.32 && p.state !== 'dive') {
          const targetY = b.shot.save ? b.y + b.vy * eta : b.shot.ty + (b.shot.ty > p.y ? -18 : 18) * rand(0.6, 1.2);
          p.state = 'dive'; p.stT = 0.9; p.diveFrom = [p.x, p.y]; p.diveTo = [gx + dx * 8, clamp(targetY, CY - GW / 2 - 6, CY + GW / 2 + 6)]; p.diveT = 0;
          p.diveLeft = p.diveTo[1] < p.y ? (t === 0) : (t === 1);
          p.diveUp = p.diveTo[1] < p.y;
        }
        p.tx = gx + dx * 10; p.ty = clamp(b.shot.ty, CY - GW / 2, CY + GW / 2);
        return;
      }
      if (chaser[t] === p) { p.tx = b.x; p.ty = b.y; p.run = true; return; }
      if (b.owner && b.owner.team !== t && Math.abs(b.x - gx) < 60 && Math.abs(b.y - CY) < 50) {
        // rush out and smother
        p.tx = b.x; p.ty = b.y; p.run = true;
        if (dist(p.x, p.y, b.x, b.y) < 11 && p.tackCD <= 0 && this.state === 'play' && !this.meter) this.gkSmother(p, b.owner);
        return;
      }
      const k = clamp(Math.abs(b.x - gx) / P.w, 0, 1);
      p.tx = gx + dx * (10 + (1 - k) * 8);
      p.ty = clamp(lerp(b.y, CY, 0.55), CY - GW / 2 + 4, CY + GW / 2 - 4);
      p.run = false;
    }

    carrierAI(p, dt) {
      const b = this.ball, t = p.team, dx = dirX(t);
      p.decT -= dt || 0;
      const [opp, pressure] = this.nearestOpp(p);
      if (p.gk) {
        p.tx = p.x; p.ty = p.y;
        if (p.decT <= 0) {
          const mates = this.team(t).filter((m) => !m.gk);
          const best = mates.map((m) => [m, this.laneBlock(p.x, p.y, m.x, m.y, t) + rand(0, 20)]).sort((a, c) => c[1] - a[1])[0][0];
          this.doPass(p, best, true);
        }
        return;
      }
      if (p.decT > 0 && pressure > 14) {
        // keep dribbling toward target
        this.dribbleDir(p, dx);
        return;
      }
      p.decT = rand(0.28, 0.55);
      const gxT = goalX(t);
      const dGoal = dist(p.x, p.y, gxT, CY);
      const ord = this.order[t] ? this.order[t].id : null;
      let best = { k: 'drib', s: 30 + this.stat(p, 'spd') * 0.25 - (pressure < 18 ? 22 : 0) + rand(0, 14) };
      // shoot
      let range = 70 + this.stat(p, 'sht') * 0.58 + (ord === 'shoot' ? 55 : 0) + (p.id === 'leo' ? 16 : 0);
      if (dGoal < range && Math.abs(p.y - CY) < 120) {
        let s = 22 + (range - dGoal) * 0.55 + (pressure < 20 ? 10 : 0) + (dGoal < 110 ? 90 : 0) + rand(0, 20);
        if (ord === 'shoot') s += 25;
        if (s > best.s) best = { k: 'shoot', s };
      }
      // passes
      for (const m of this.team(t)) {
        if (m === p || m.gk || m.state === 'down') continue;
        const prog = (m.x - p.x) * dx;
        const d = dist(p.x, p.y, m.x, m.y);
        if (d < 24 || d > 260) continue;
        const [, open] = this.nearestOpp(m);
        const lane = this.laneBlock(p.x, p.y, m.x, m.y, t);
        let s = 22 + prog * 0.32 + Math.min(open, 60) * 0.55 - (lane < 10 ? 60 : lane < 18 ? 22 : 0) - Math.max(0, d - 170) * 0.2;
        if (pressure < 18) s += 18;
        if (ord === 'pass') s += 18;
        if (p.id === 'leo') s -= 14;
        if (p.id === 'kazuha') s += 8;
        s += rand(0, 16);
        if (s > best.s) best = { k: 'pass', s, m };
      }
      if (best.k === 'shoot') this.wantShoot(p);
      else if (best.k === 'pass') this.doPass(p, best.m);
      else this.dribbleDir(p, dx);
    }

    dribbleDir(p, dx) {
      // steer toward goal, avoid nearby opponents
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

    doPass(p, m, lofted) {
      const b = this.ball;
      if (!m) return;
      const lead = 0.35;
      let tx = m.x + (m.tx - m.x) * 0.4 + m.vx * lead, ty = m.y + (m.ty - m.y) * 0.4 + m.vy * lead;
      const acc = this.stat(p, 'pas') + (this.order[p.team] && this.order[p.team].id === 'pass' ? 10 : 0);
      const err = ((100 - acc) / 100) * 0.28 * rand(-1, 1);
      const d = dist(p.x, p.y, tx, ty);
      const ang = Math.atan2(ty - p.y, tx - p.x) + err;
      const sp = clamp(d * 1.5 + 70, 120, 300);
      this.releaseBall(p);
      b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp;
      b.vz = lofted || d > 170 ? 110 : 0;
      b.pass = { from: p, to: m, tx, ty, t: 0 };
      b.tried = new Set();
      p.rec.pass++;
      p.kickAnim = 0.2;
      Sound.play('pass', { vol: 0.55, pan: this.pan(p.x) });
    }
    releaseBall(p) {
      const b = this.ball;
      b.owner = null; b.last = p; b.lastKick = p; b.kickImm = 0.25;
    }
    pan(x) { return clamp((x - (this.cam.x + W / 2)) / (W / 2), -1, 1) * 0.6; }

    wantShoot(p) {
      const t = p.team;
      const dGoal = dist(p.x, p.y, goalX(t), CY);
      if (t === 0 && this.chanceCD <= 0 && dGoal < 230) { this.openMeter('chance', p); return; }
      if (t === 1 && this.pinchCD <= 0 && dGoal < 220) { this.openMeter('pinch', p); return; }
      this.doShoot(p, null);
    }

    doShoot(p, q) {
      // q: meter result for the relevant side: 'just'|'good'|'bad'|null
      const b = this.ball, t = p.team;
      const gx = goalX(t);
      const dGoal = dist(p.x, p.y, gx, CY);
      const sht = this.stat(p, 'sht') + (this.order[t] && this.order[t].id === 'shoot' ? 6 : 0);
      let sigma = (100 - sht) * 0.42 + dGoal * 0.1;
      const attackerQ = t === 0 ? q : null, defenderQ = t === 1 ? q : null;
      if (attackerQ === 'just') sigma *= 0.3; else if (attackerQ === 'good') sigma *= 0.7; else if (attackerQ === 'bad') sigma *= 1.35;
      const aimY = CY + rand(-1, 1) * (GW / 2 - 4);
      const ty = aimY + (rand(-1, 1) + rand(-1, 1) + rand(-1, 1)) * 0.75 * sigma;
      let power = 240 + sht * 1.6 + (attackerQ === 'just' ? 90 : 0);
      const onTarget = Math.abs(ty - CY) < GW / 2 - 1;
      const gk = this.gk(1 - t);
      let pSave = 0.6 + this.stat(gk, 'def') / 170 - (power - 300) / 600 + dGoal / 1400 - (Math.abs(ty - CY) / (GW / 2)) * 0.22;
      if (gk.id === 'gen' && Math.random() < 0.5) pSave += 0.06; // 網さばき
      if (attackerQ === 'just') pSave -= 0.34; else if (attackerQ === 'good') pSave -= 0.12; else if (attackerQ === 'bad') pSave += 0.12;
      if (defenderQ === 'just') pSave += 0.5; else if (defenderQ === 'good') pSave += 0.2; else if (defenderQ === 'bad') pSave -= 0.08;
      pSave = clamp(pSave, 0.05, 0.95);
      const save = onTarget && Math.random() < pSave;
      const ang = Math.atan2(ty - p.y, gx - p.x);
      this.releaseBall(p);
      b.vx = Math.cos(ang) * power; b.vy = Math.sin(ang) * power;
      b.vz = dGoal > 150 ? rand(40, 90) : rand(10, 50);
      b.pass = null;
      b.shot = { team: t, shooter: p, save, ty, power: attackerQ === 'just', t: 0 };
      p.rec.shot++; this.shots[t]++; if (onTarget) this.onTarget[t]++;
      p.kickAnim = 0.3;
      if (attackerQ === 'just') {
        Sound.play('power_shot'); Game.addShake(4, 0.3); Game.doHitstop(0.08);
        this.fx.burst(b.x, b.y, 18, { color: ['#9fdcff', '#ffffff', '#ffd24a'], speedMin: 40, speedMax: 140, lifeMin: 0.2, lifeMax: 0.5, size: 2, kind: 'star', drag: 0.05 });
      } else Sound.play('shoot', { pan: this.pan(p.x) });
      if (t === 0) this.tick(p.name + '、シュート！', '#9fdcff'); else this.tick(p.name + 'のシュート！', '#ff9a8a');
      this.crowdHype = 0.8;
    }

    gkSmother(gk, c) {
      gk.tackCD = 1.0;
      const pr = clamp(0.35 + (this.stat(gk, 'def') - this.stat(c, 'spd')) / 120, 0.2, 0.75);
      Sound.play('tackle', { pan: this.pan(gk.x) });
      this.fx.burst(c.x, c.y, 10, { color: ['#d6ba8c', '#ffffff'], speedMin: 20, speedMax: 70, lifeMax: 0.4, size: 2, flatY: 0.5, up: 10 });
      if (Math.random() < pr) {
        this.gainBall(gk); gk.decT = 1.0; gk.rec.save++;
        c.state = 'down'; c.stT = 0.6;
        Game.addShake(2, 0.15);
        this.popup(gk.x, gk.y - 26, gk.team === 0 ? '飛び出した！' : 'キャッチ！', gk.team === 0 ? '#ffd24a' : '#ffb0a0', 9);
        if (gk.team === 0) this.tick('ゲンさん、果敢に飛び出してボールを押さえた！', '#9fdcff');
      } else { gk.state = 'down'; gk.stT = 0.6; }
    }
    tryTackle(d, c) {
      d.tackCD = 1.1;
      d.rec.tackle++;
      const cs = this.stat(c, 'spd') * 0.5 + this.stat(c, 'pas') * 0.2 + (c.id === 'yukimaru' ? 14 : 0);
      let pr = 0.3 + (this.stat(d, 'def') - cs) / 110;
      if (this.order[d.team] && this.order[d.team].id === 'defend') pr += 0.1;
      if (d.id === 'tetsuyama') pr += 0.08;
      pr = clamp(pr, 0.1, 0.72);
      const b = this.ball;
      Sound.play('tackle', { pan: this.pan(d.x) });
      this.fx.burst((d.x + c.x) / 2, (d.y + c.y) / 2, 8, { color: ['#d6ba8c', '#b6966a', '#ffffff'], speedMin: 20, speedMax: 60, lifeMin: 0.2, lifeMax: 0.45, size: 2, flatY: 0.5, up: 10 });
      if (Math.random() < pr) {
        d.rec.tackleOk++;
        Game.addShake(2, 0.15);
        if (Math.random() < 0.55) {
          b.owner = d; b.last = d; b.pass = null; d.decT = 0.25; d.rec.touch++;
          c.state = 'down'; c.stT = 0.7;
          if (Math.random() < 0.5) this.say(d, d.team === 0 ? pick(['もらった！', 'いただき！', 'よっしゃ！']) : pick(['甘いッ！', 'フン！']), 1);
        } else {
          this.releaseBall(c); b.lastKick = null;
          const a = Math.atan2(c.y - d.y, c.x - d.x) + rand(-0.8, 0.8);
          b.vx = Math.cos(a) * 90; b.vy = Math.sin(a) * 90; b.vz = 40; b.last = d;
        }
        if (d.team === 0) this.tick(d.name + '、ボールを奪った！', '#9fdcff');
      } else {
        d.state = 'down'; d.stT = 0.5;
        c.rec.dribble++;
        if (c.team === 0 && Math.random() < 0.4) this.say(c, pick(['ほいっと！', 'かわした！']), 0.9);
      }
    }

    moveAll(dt, toHome) {
      for (const p of this.players) {
        if (p.tackCD > 0) p.tackCD -= dt;
        if (p.kickAnim > 0) p.kickAnim -= dt;
        if (p.bubble) { p.bubble.t -= dt; if (p.bubble.t <= 0) p.bubble = null; }
        if (p.cheer > 0) p.cheer -= dt;
        if (p.state === 'down') { p.stT -= dt; p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx * dt; p.y += p.vy * dt; if (p.stT <= 0) p.state = ''; continue; }
        if (p.state === 'dive') {
          p.diveT += dt;
          const k = clamp(p.diveT / 0.22, 0, 1);
          p.x = lerp(p.diveFrom[0], p.diveTo[0], Ease.outQuad(k)); p.y = lerp(p.diveFrom[1], p.diveTo[1], Ease.outQuad(k));
          p.stT -= dt; if (p.stT <= 0) p.state = '';
          continue;
        }
        let tx = p.tx, ty = p.ty;
        if (toHome) { tx = p.homeX; ty = p.homeY; }
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
        let sp = this.speedOf(p) * (p.run || toHome ? 1 : 0.62);
        if (this.ball.owner === p) sp *= 0.86;
        if (this.state === 'fulltime' || this.state === 'halfend') sp *= 0.5;
        let vx = 0, vy = 0;
        if (d > 2) { const s = Math.min(sp, d * 5); vx = (dx / d) * s; vy = (dy / d) * s; }
        p.vx = lerp(p.vx, vx, clamp(dt * 9, 0, 1)); p.vy = lerp(p.vy, vy, clamp(dt * 9, 0, 1));
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.x = clamp(p.x, P.x - 20, P.x + P.w + 20); p.y = clamp(p.y, P.y - 12, P.y + P.h + 12);
        const v = Math.hypot(p.vx, p.vy);
        p.rec.dist += v * dt;
        if (this.state === 'play') {
          let drain = (0.12 + (v / 100) * 0.55) * (1.45 - p.st.sta / 100) * dt;
          if (p.id === 'ponta' && this.half === 2) drain *= 1.35;
          if (p.gk) drain *= 0.3;
          p.sta = Math.max(0, p.sta - drain * 2.2);
        }
        p.animT += dt * (v / 9);
        // facing
        if (v > 6) {
          if (Math.abs(p.vx) > Math.abs(p.vy) * 0.8) p.face = p.vx > 0 ? 'right' : 'left';
          else p.face = p.vy < 0 ? 'up' : 'down';
        } else if (this.state === 'play') {
          const bx = this.ball.x - p.x, by = this.ball.y - p.y;
          if (Math.abs(bx) > Math.abs(by) * 0.8) p.face = bx > 0 ? 'right' : 'left'; else p.face = by < 0 ? 'up' : 'down';
        }
        p.moving = v > 6;
      }
    }

    updateBall(dt) {
      const b = this.ball;
      if (b.owner) {
        const o = b.owner;
        const fx = o.face === 'right' ? 1 : o.face === 'left' ? -1 : 0, fy = o.face === 'down' ? 1 : o.face === 'up' ? -1 : 0;
        const tx = o.x + fx * 6, ty = o.y + fy * 4 + 1;
        const bounce = o.moving ? Math.abs(Math.sin(o.animT * 1.6)) * 2 : 0;
        b.x = lerp(b.x, tx, clamp(dt * 20, 0, 1)); b.y = lerp(b.y, ty, clamp(dt * 20, 0, 1)); b.z = bounce;
        b.vx = o.vx; b.vy = o.vy; b.vz = 0;
        if (o.moving) b.roll += dt * 12;
        if (o.state === 'down') { this.releaseBall(o); }
        return;
      }
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
      if (b.pass) { b.pass.t += dt; if (b.pass.t > 2.2) b.pass = null; }
      if (b.shot) b.shot.t += dt;
      if (b.inNet) {
        const gxl = b.x < CX ? P.x - Art.GOAL_D + 3 : P.x + P.w + Art.GOAL_D - 3;
        if ((b.x < CX && b.x < gxl) || (b.x > CX && b.x > gxl)) { b.x = gxl; b.vx *= -0.2; b.vy *= 0.5; }
        return;
      }

      // GK save contact
      if (b.shot) {
        const gk = this.gk(1 - b.shot.team);
        if (b.shot.save && dist(gk.x, gk.y - 4, b.x, b.y - b.z * 0.5) < 13) { this.onSave(gk); return; }
      }
      // goal line
      const lineL = P.x, lineR = P.x + P.w;
      if (b.x <= lineL || b.x >= lineR) {
        const side = b.x >= lineR ? 1 : 0; // side 1 = right goal (team0 attacks)
        const inMouth = Math.abs(b.y - CY) < GW / 2;
        const nearPost = Math.abs(Math.abs(b.y - CY) - GW / 2) < 3;
        if (nearPost && b.z < 16) { this.onPost(side); return; }
        if (inMouth && b.z < 14 && !(b.shot && b.shot.save)) { this.onGoal(side === 1 ? 0 : 1); return; }
        this.onOut('goalline', side);
        return;
      }
      if (b.y < P.y || b.y > P.y + P.h) { this.onOut('touch'); return; }
      // possession pickup
      if (this.state !== 'play' || this.meter) return;
      let best = null, bd = 99;
      const hard = sp > 280;
      for (const p of this.players) {
        if (p.state === 'down' || p.state === 'dive') continue;
        if (b.lastKick === p && b.kickImm > 0) continue;
        if (b.z > 10) continue;
        const d = dist(p.x, p.y, b.x, b.y);
        const r = p.gk ? 11 : 8;
        if (d > r) continue;
        if (hard && !p.gk) continue;
        // interception roll
        if (b.pass && b.pass.to !== p && p.team !== b.pass.from.team) {
          if (b.tried.has(p)) continue;
          b.tried.add(p);
          const ic = 0.28 + this.stat(p, 'def') / 220 - sp / 900;
          if (Math.random() > ic) continue;
        }
        if (d < bd) { bd = d; best = p; }
      }
      if (best) this.gainBall(best);
    }

    gainBall(p) {
      const b = this.ball;
      const pass = b.pass;
      if (pass && pass.from.team === p.team && pass.from !== p) {
        pass.from.rec.passOk++;
        this.lastPasser = pass.from;
      } else if (pass && pass.from.team !== p.team) {
        if (p.team === 0) this.tick(p.name + '、パスカット！', '#9fdcff');
        this.lastPasser = null;
      } else if (!pass) this.lastPasser = b.last && b.last.team === p.team ? this.lastPasser : null;
      b.owner = p; b.last = p; b.pass = null; b.shot = null; b.vz = 0; b.z = 0;
      p.rec.touch++;
      p.decT = p.gk ? 0.9 : rand(0.1, 0.35);
      Sound.play('kick', { vol: 0.3, pan: this.pan(p.x) });
    }

    onSave(gk) {
      const b = this.ball;
      const sh = b.shot;
      gk.rec.save++;
      Sound.play('save'); Game.addShake(3, 0.2); Game.doHitstop(0.06);
      this.fx.burst(b.x, b.y - b.z, 12, { color: ['#ffffff', '#ffd24a'], speedMin: 30, speedMax: 110, lifeMin: 0.2, lifeMax: 0.5, size: 2, kind: 'star' });
      this.popup(gk.x, gk.y - 50, gk.team === 0 ? 'ナイスセーブ！' : 'セーブ！', gk.team === 0 ? '#ffd24a' : '#ffb0a0', 10);
      Sound.play('ooh');
      this.crowdHype = 0.9;
      if (gk.team === 0) { this.tick('ゲンさん、がっちり止めたー！', '#9fdcff'); this.say(gk, pick(['網にかかったな！', 'ふんっ！', 'まだまだ！']), 1.3); }
      else this.tick('岩井、ファインセーブ！ 惜しい！', '#ff9a8a');
      b.shot = null;
      if (Math.random() < 0.6) {
        this.gainBall(gk); gk.state = ''; gk.decT = 1.1;
      } else {
        b.vx = -b.vx * rand(0.15, 0.3); b.vy = (b.y < CY ? -1 : 1) * rand(110, 170); b.vz = 70; b.last = gk; b.lastKick = gk; b.kickImm = 0.3; b.pass = null;
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
        if (team === 0) this.cutin = { id: scorer.id, expr: 'happy', t: 0, dur: 2.4, text: scorer.name + ' のゴール！', color: '#4fb4e8' };
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
      b.shot = null; b.pass = null; b.vz = 0; b.z = 0;
      const recv = 1 - last.team;
      if (kind === 'touch') {
        const y = b.y < P.y ? P.y + 3 : P.y + P.h - 3;
        const x = clamp(b.x, P.x + 8, P.x + P.w - 8);
        const p = this.team(recv).filter((q) => !q.gk).sort((a, c) => dist(a.x, a.y, x, y) - dist(c.x, c.y, x, y))[0];
        p.x = x; p.y = y; b.x = x; b.y = y; b.vx = b.vy = 0;
        this.gainBall(p); p.decT = 0.35;
        this.popup(x, y - 18, 'スローイン', '#ffffff', 8);
      } else {
        const defTeam = side === 1 ? 1 : 0; // team defending that goal
        if (last.team === defTeam && Math.random() < 0.8) {
          // corner kick for attackers
          const att = 1 - defTeam;
          const cx = side ? P.x + P.w - 3 : P.x + 3, cy = b.y < CY ? P.y + 3 : P.y + P.h - 3;
          const p = this.team(att).filter((q) => !q.gk).sort((a, c) => dist(a.x, a.y, cx, cy) - dist(c.x, c.y, cx, cy))[0];
          p.x = cx; p.y = cy; b.x = cx; b.y = cy; b.vx = b.vy = 0;
          this.gainBall(p);
          this.popup(cx, cy - 18, 'コーナーキック', '#ffffff', 8);
          const targets = this.team(att).filter((q) => !q.gk && q !== p).sort((a, c) => Math.abs(a.x - goalX(att)) - Math.abs(c.x - goalX(att)));
          setTimeout(() => { if (b.owner === p) this.doPass(p, targets[0], true); }, 500);
        } else {
          const gk = this.gk(defTeam);
          b.x = gk.x + dirX(defTeam) * 6; b.y = gk.y; b.vx = b.vy = 0;
          this.gainBall(gk); gk.decT = 1.0;
          if (last.team !== defTeam && Math.random() < 0.7) { Sound.play('ooh', { vol: 0.5 }); this.tick(pick(['シュートは枠の外！', '惜しくも外れた！', 'ゴールキックで再開です。']), '#c9d6e6'); }
        }
      }
    }

    endHalf() {
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
        { id: 'tactic', label: '作戦を切り替える', desc: this.form[0] === Data.FORMATIONS.attack ? 'フォーメーションを「バランス」に。' : 'フォーメーションを「全員攻撃」に。' },
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
        this.form[0] = this.form[0] === Data.FORMATIONS.attack ? Data.FORMATIONS.balance : Data.FORMATIONS.attack;
        for (const p of this.team(0)) p.sta = Math.min(100, p.sta + 35);
        h.reply = { who: 'kazuha', expr: 'normal', text: '了解です。' + this.form[0].short + 'なら、ここのスペースが使えますね。' };
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
      this.chanceCD = 6; this.pinchCD = 10;
    }
    minute() { return Math.min(45, Math.floor((this.clock / HALF_LEN) * 45)) + (this.half === 2 ? 45 : 0); }

    finish() {
      const recs = this.players.map((p) => ({ id: p.id, name: p.name, team: p.team, rec: p.rec, sta: p.sta }));
      const tot = this.poss[0] + this.poss[1] || 1;
      this.result = { score: this.score.slice(), recs, poss: [this.poss[0] / tot, this.poss[1] / tot], shots: this.shots, onTarget: this.onTarget, goals: this.goalLog || [] };
      if (this.opts.onEnd) this.opts.onEnd(this.result);
    }

    // ---------------- chance / pinch timing meter ----------------
    openMeter(kind, p) {
      const b = this.ball;
      this.meter = { kind, p, t: 0, pos: 0, dir: 1, speed: kind === 'chance' ? 1.9 : 2.2, result: null, rt: 0, autoAim: clamp(0.5 + (rand(-1, 1) + rand(-1, 1)) * 0.12, 0.05, 0.95) };
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
      if (d < 0.05) {
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
        const people = t === 0 ? ['nagisa', 'otaki'] : ['onigawara'];
        people.forEach((id, i) => {
          const L = benchLook(id);
          const img = Art.sprite(L, 'down', Math.sin(Game.time * 3 + i) > 0.9 && this.state === 'goal' ? 'cheer' : 'walk1');
          g.drawImage(img, bx + 10 + i * 18, by + 2);
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
      if (p.state === 'dive') { img = Art.diveSprite(L, p.diveUp !== (p.team === 1) ? false : true); g.drawImage(img, x - 12, y - 10); return; }
      if (p.state === 'down') {
        // lying: use dive sprite rotated feel
        img = Art.diveSprite(L, p.face === 'left');
        g.drawImage(img, x - 12, y - 8);
        return;
      }
      let frame = 'walk1', dir = p.face === 'right' ? 'side' : p.face;
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

    drawOverlay(g) {
      this.drawHUD(g);
      this.fxTop.draw(g);
      for (const bn of this.banners) this.drawBanner(g, bn);
      if (this.cutin) this.drawCutin(g, this.cutin);
      if (this.meter) this.drawMeter(g);
      if (this.halftimeUI) this.drawHalftime(g);
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
      const sub = chance ? m.p.name + '、シュートチャンス！' : m.p.name + 'のシュート！ 止めろ、ゲンさん！';
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
        g.fillStyle = '#ffd24a'; g.fillRect(Math.round(x + bw * 0.45), y + 1, Math.round(bw * 0.1), bh - 2);
        g.fillStyle = '#fff1a0'; g.fillRect(Math.round(x + bw * 0.45), y + 1, Math.round(bw * 0.1), 2);
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
        const y = 128 + i * 12;
        text(g, p.name, 36, y, { size: 8, color: '#2a1a24' });
        g.fillStyle = '#2a1a24'; g.fillRect(84, y + 2, 102, 6);
        g.fillStyle = p.sta > 50 ? '#6cc35a' : p.sta > 25 ? '#ffd24a' : '#e0474c';
        g.fillRect(85, y + 3, Math.round(p.sta), 4);
      });
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
