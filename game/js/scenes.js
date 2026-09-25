/* ハマカゼFC — scenes: title, dialog, clubhouse hub, roster, training, tactics, VS, result/growth, scout, ending */
(function () {
  'use strict';
  const { Game, Input, Ease, Particles, clamp, lerp, rand, randi, pick, text, panel, wrap, W, H } = E;
  const OUT = Art.OUT;
  const STAT_KEYS = ['spd', 'sht', 'pas', 'def', 'sta'];
  const STAT_NAMES = { spd: 'スピード', sht: 'シュート', pas: 'パス', def: 'ディフェンス', sta: 'スタミナ' };
  const STAT_COLORS = { spd: '#6cc35a', sht: '#e0474c', pas: '#4fb4e8', def: '#ffd24a', sta: '#b06ad8' };
  const NAMES = { otaki: 'おタキ婆', nagisa: 'ナギサ', gen: 'ゲン', morio: 'モリオ', tsubame: 'ツバメ', kazuha: 'カズハ', ponta: 'ポン太', leo: 'レオ', haruki: 'ハルキ', tetsuyama: '鉄山', yukimaru: '雪丸', onigawara: '鬼瓦監督' };
  const VOICE = { otaki: 1.25, nagisa: 1.35, gen: 0.7, morio: 0.65, tsubame: 1.45, kazuha: 1.0, ponta: 0.85, leo: 1.05, haruki: 1.3, tetsuyama: 0.72, yukimaru: 1.15, onigawara: 0.6 };

  // ---------------- game state ----------------
  const State = {
    roster: [], formation: 'balance', trained: null, recruit: null, result: null, growth: null, auto: false, talked: {},
    reset() {
      this.roster = Data.HOME.map((p) => Object.assign({}, p, { stats: Object.assign({}, p.stats), base: Object.assign({}, p.stats) }));
      this.lineup = Data.DEFAULT_LINEUP.slice();
      this.tactic = 'counter';
      this.formation = 'balance'; this.trained = null; this.recruit = null; this.result = null; this.growth = null; this.talked = {};
    },
  };
  State.reset();

  function portrait(id, expr) { return window.Portraits ? Portraits.get(id, expr || 'normal') : null; }
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
  function grade(v) { return v >= 80 ? 'S' : v >= 68 ? 'A' : v >= 56 ? 'B' : v >= 44 ? 'C' : v >= 32 ? 'D' : 'E'; }
  const GRADE_COL = { S: '#ffd24a', A: '#e0474c', B: '#f08a3a', C: '#4fb4e8', D: '#6cc35a', E: '#9a8e7a' };
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
      if (!s.menu && s.t > 1.2 && (Input.anyPressed || Input.mouse.clicked)) {
        Sound.init(); Sound.bgm('title'); Sound.play('stamp');
        s.menu = new Menu([
          { id: 'new', label: 'はじめる', sub: '体験版 第1話「港町の監督さん」' },
          { id: 'howto', label: 'あそびかた', sub: '操作と遊びのコツ' },
        ], W / 2 - 90, 176, 180, 32);
        s.menu.lock = 0.25;
        Game.addShake(2, 0.2);
        return;
      }
      if (s.howto) { if (okPressed() || Input.hit('back')) { s.howto = false; Sound.play('cancel'); } return; }
      if (s.menu) {
        const r = s.menu.update(dt);
        if (r && r.id === 'new') { State.reset(); Sound.stopBgm(0.8); Game.goto(Intro(), 'iris'); }
        if (r && r.id === 'howto') s.howto = true;
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
      if (s.menu) s.menu.draw(g);
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
      ['試合後', '試合での活躍に応じて選手が成長。相手チームからスカウトも。'],
      ['操作', '矢印キー / マウスで選択、Z・Enter で決定、X で戻る、M で消音'],
    ];
    rows.forEach((r, i) => {
      const y = 56 + i * 22;
      panel(g, 44, y, 80, 18, 'sky');
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
        panel(g, nx, 177, nw, 18, ['tetsuyama', 'yukimaru', 'onigawara'].includes(L.who) ? 'crimson' : 'sky');
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
        { who: 'nagisa', expr: 'determined', side: 'right', text: '今週末、隣町の「ヤマオロシ鉄工団」と練習試合が決まりました。' },
        { who: 'otaki', expr: 'surprised', text: '鉄工団だって！？ あそこは去年、地区リーグで2位のチームじゃないか！', fx: 'shake' },
        { who: 'nagisa', expr: 'normal', side: 'right', text: 'しかも勝ったら、商店街がグラウンドの芝生代を出してくれるそうです。' },
        { who: 'otaki', expr: 'determined', text: 'ようし…！ 監督、選手たちのこと、頼んだよ。勝ったらたこ焼き食べ放題だ！' },
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
    const items = () => [
      { id: 'roster', label: '選手名鑑', sub: 'メンバーの能力と人となり', icon: Icons.book },
      { id: 'train', label: '練習する', sub: State.trained ? '今日の練習は終わりました' : '1日1回。能力がアップ！', icon: Icons.shoe, disabled: !!State.trained },
      { id: 'tactics', label: '作戦ボード', sub: '陣形：' + Data.FORMATIONS[State.formation].short, icon: Icons.board },
      { id: 'match', label: '試合へ！', sub: 'vs ヤマオロシ鉄工団', icon: Icons.ball },
    ];
    s.enter = () => {
      Sound.bgm('hub'); Sound.crowd(0);
      s.menu = new Menu(items(), 316, 58, 154, 36, 6);
      if (first) s.say([['nagisa', 'happy', 'ここがクラブハウスです！ 選手のみんなに声をかけたり、右のメニューから準備を進めてください。'], ['nagisa', 'normal', '試合までに「練習」は1回できます。何をきたえるか、よーく考えてくださいね！']]);
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
      if (State.auto) { s.menu.sel = State.trained ? 3 : 1; Input.pressed.ok = s.t > 1; }
      const r = s.menu.update(dt);
      if (!r) return;
      if (r.id === 'roster') Game.goto(Roster(), 'stripe');
      if (r.id === 'train') Game.goto(Training(), 'stripe');
      if (r.id === 'tactics') Game.goto(Tactics(), 'stripe');
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
      text(g, '4月 第1週・金曜日', 316, 11, { size: 10, color: '#9fdcff' });
      text(g, '明日：練習試合', 316, 26, { size: 10, color: '#ffffff' });
      text(g, 'vs ヤマオロシ鉄工団', 316, 37, { size: 8, color: '#ffb0a0' });
      s.menu.items = items();
      s.menu.draw(g);
      // mini team form strip
      panel(g, 308, 226, 166, 38, 'dark');
      text(g, 'チーム状態', 316, 230, { size: 8, color: '#9fdcff' });
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
    const list = () => State.roster.concat(State.recruit ? [State.recruit] : []);
    s.enter = () => { Sound.bgm('hub'); s.anim = 0; Game.tweens.to(s, { anim: 1 }, 0.5, Ease.outCubic); };
    const setSel = (i) => { if (i !== s.sel) { s.sel = i; Sound.play('cursor'); s.anim = 0; Game.tweens.to(s, { anim: 1 }, 0.4, Ease.outCubic); } };
    s.update = (dt) => {
      s.t += dt;
      const L = list();
      if (Input.hit('up')) setSel((s.sel + L.length - 1) % L.length);
      if (Input.hit('down')) setSel((s.sel + 1) % L.length);
      L.forEach((p, i) => { const r = { x: 8, y: 32 + i * 16, w: 120, h: 15 }; if (E.hoverIn(r) && Input.mouse.moved) setSel(i); if (E.clickedIn(r)) setSel(i); });
      const back = { x: 150, y: 6, w: 56, h: 20 };
      if (Input.hit('back') || E.clickedIn(back)) { Sound.play('cancel'); Game.goto(Hub(), 'stripe'); }
      if (State.auto && s.t > 1.5) Game.goto(Hub(), 'stripe');
    };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 6, 4, 140, 24, 'dark');
      text(g, '選手名鑑', 16, 9, { size: 14, color: '#ffd24a' });
      const L = list();
      L.forEach((p, i) => {
        const y = 32 + i * 16, sel = s.sel === i, ox = sel ? 4 : 0;
        panel(g, 8 + ox, y, 124, 15, sel ? 'gold' : State.lineup.includes(p.id) ? 'paper' : ['#2a1a24', '#d9cfbb', '#b9ad98', '#ece4d4']);
        text(g, p.pos, 12 + ox, y + 3, { size: 8, color: '#2f86c4' });
        text(g, p.name + (p === State.recruit ? ' NEW' : ''), 30 + ox, y + 2, { size: 9, color: '#2a1a24' });
        if (!State.lineup.includes(p.id)) text(g, '控え', 126 + ox, y + 3, { size: 8, align: 'right', color: '#9a8e7a' });
      });
      const back = { x: 150, y: 6, w: 56, h: 20 };
      panel(g, back.x, back.y, back.w, back.h, E.hoverIn(back) ? 'gold' : 'dark');
      text(g, 'X：もどる', back.x + 28, back.y + 5, { size: 8, align: 'center', color: E.hoverIn(back) ? '#2a1a24' : '#c9d6e6' });
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
      text(g, (p.age ? p.age + '歳　' : '') + (p.job || ''), 256 + dx, 42, { size: 9, color: '#6d4f3a' });
      const bio = wrap(g, p.bio || '', 204, 9);
      bio.forEach((l, i) => text(g, l, 256 + dx, 56 + i * 13, { size: 9, color: '#2a1a24' }));
      // trait
      panel(g, 254 + dx, 100, 210, 36, 'gold');
      text(g, '特性：' + (p.trait || '―'), 262 + dx, 104, { size: 10, color: '#4a2a10' });
      text(g, p.traitDesc || '', 262 + dx, 120, { size: 8, color: '#6d4f3a' });
      // stats
      STAT_KEYS.forEach((key, i) => {
        const y = 146 + i * 22;
        const v = p.stats[key];
        const b = p.base ? p.base[key] : v;
        text(g, STAT_NAMES[key], 150 + dx, y, { size: 10, color: '#2a1a24' });
        const gr = grade(v);
        text(g, gr, 236 + dx, y - 1, { size: 12, color: GRADE_COL[gr], outline: OUT });
        statBar(g, 254 + dx, y + 2, 170, v * Math.min(1, k * 1.3 + 0.1), STAT_COLORS[key]);
        text(g, String(v), 456 + dx, y, { size: 10, align: 'right', color: '#2a1a24' });
        if (v > b) text(g, '+' + (v - b), 466 + dx, y + 1, { size: 8, color: '#e0474c' });
      });
      g.globalAlpha = 1;
    };
    return s;
  }

  // ---------------- TRAINING ----------------
  const TRAININGS = [
    { id: 'shoot', label: 'シュート練習', sub: 'シュート↑ パス↑少し', desc: 'ゲンさんを相手にPK特訓。前線の選手がよく伸びる。', gains: { sht: 3, pas: 1 }, focus: ['leo', 'haruki', 'ponta'] },
    { id: 'pass', label: '鳥かごパス回し', sub: 'パス↑ ディフェンス↑少し', desc: '輪になってパスを回す。中盤と守備がよく伸びる。', gains: { pas: 3, def: 1 }, focus: ['kazuha', 'morio', 'ponta'] },
    { id: 'run', label: '砂浜ダッシュ', sub: 'スピード↑ スタミナ↑', desc: '夕暮れの砂浜を走り込む。全員の足腰がきたえられる。', gains: { spd: 2, sta: 2 }, focus: ['tsubame', 'haruki', 'gen'] },
  ];
  function Training() {
    const s = { t: 0, phase: 'pick', menu: null, tries: [], meter: null, fx: new Particles(), results: [], rt: 0, pick: null, reveal: 0, statAnim: 0 };
    s.enter = () => {
      Sound.bgm('hub');
      s.menu = new Menu(TRAININGS.map((tr) => ({ id: tr.id, label: tr.label, sub: tr.sub, tr })), 250, 70, 214, 38, 8);
    };
    const startMeter = () => { s.meter = { pos: 0, dir: 1, speed: 1.5 + s.tries.length * 0.35, t: 0, res: null, rt: 0, aim: clamp(0.5 + rand(-0.15, 0.15), 0, 1) }; };
    s.update = (dt) => {
      s.t += dt; s.fx.update(dt);
      if (s.phase === 'pick') {
        if (Input.hit('back')) { Sound.play('cancel'); Game.goto(Hub(), 'stripe'); return; }
        if (State.auto) { s.menu.sel = 0; Input.pressed.ok = s.t > 1; }
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
      const mult = score >= 5 ? 2 : score >= 2 ? 1 : 0.5;
      s.rank = score >= 5 ? '大成功！' : score >= 2 ? '成功' : 'いまいち…';
      Sound.play(score >= 5 ? 'levelup' : 'coin');
      s.results = [];
      for (const p of State.roster) {
        const ups = {};
        for (const k in s.pick.gains) {
          let v = s.pick.gains[k] * mult * (s.pick.focus.includes(p.id) ? 1.5 : 1) * (p.growth || 1) * 0.5;
          v = Math.max(1, Math.round(v + rand(-0.3, 0.3)));
          if (mult < 1 && Math.random() < 0.5) v = 0;
          if (v > 0) { p.stats[k] = Math.min(99, p.stats[k] + v); ups[k] = v; }
        }
        s.results.push({ p, ups });
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
        panel(g, 250, 204, 214, 48, 'paper');
        wrap(g, sel.desc, 200, 9).forEach((l, i) => text(g, l, 258, 210 + i * 13, { size: 9, color: '#2a1a24' }));
        text(g, 'X：もどる', 18, 240, { size: 8, color: '#ffffff', outline: OUT });
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
        const shooter = State.roster[5 + (s.tries.length % 2)];
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
        s.results.forEach((r, i) => {
          const y = 52 + i * 26;
          const vis = s.rt - 0.4 > i * 0.14;
          if (!vis) return;
          g.drawImage(Art.sprite(r.p.look, 'down', 'walk1'), 54, y);
          text(g, r.p.name, 76, y + 5, { size: 10, color: '#2a1a24' });
          let x = 150;
          const keys = Object.keys(r.ups);
          if (!keys.length) text(g, '……（あまり身につかなかった）', x, y + 5, { size: 9, color: '#9a8e7a' });
          keys.forEach((k) => {
            panel(g, x, y + 2, 118, 18, 'sky');
            text(g, STAT_NAMES[k] + ' +' + r.ups[k], x + 59, y + 5, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f' });
            x += 124;
          });
        });
        if (s.rt > 1.2) text(g, 'Z / クリック：クラブハウスへ', W / 2, 236, { size: 9, align: 'center', color: '#6d4f3a', alpha: blink() });
      }
    };
    return s;
  }

  // ---------------- TACTICS (formation + lineup + combos) ----------------
  function activeCombos(ids) { return Data.COMBOS.filter((c) => c.ids.every((id) => ids.includes(id))); }
  function Tactics() {
    const s = { t: 0, keys: Object.keys(Data.FORMATIONS), pos: null, pick: null, cursor: 0, hover: null, flash: {} };
    const BX = 10, BY = 34, BW = 280, BH = 196;
    const byId = (id) => State.roster.find((p) => p.id === id);
    const bench = () => State.roster.filter((p) => !State.lineup.includes(p.id));
    s.enter = () => { Sound.bgm('hub'); s.pos = Data.FORMATIONS[State.formation].slots.map((a) => a.slice()); };
    const boardXY = (i) => {
      if (i === 0) return [BX + 4 + 0.04 * (BW - 8), BY + 4 + 0.5 * (BH - 8)];
      const [nx, ny] = s.pos[i - 1];
      return [BX + 4 + nx * (BW - 8), BY + 4 + ny * (BH - 8)];
    };
    const benchRect = (i) => ({ x: 298, y: 92 + i * 22, w: 174, h: 21 });
    const tacRect = (i) => ({ x: 298 + i * 44, y: 58, w: 42, h: 16 });
    const formRect = (i) => ({ x: 298 + i * 59, y: 34, w: 56, h: 20 });
    // selectable targets: 0..10 = lineup slots, 11.. = bench
    const targets = () => State.lineup.map((id, i) => ({ kind: 'slot', i, id })).concat(bench().map((p, i) => ({ kind: 'bench', i, id: p.id })));
    const targetRect = (tg) => {
      if (tg.kind === 'bench') return benchRect(tg.i);
      const [x, y] = boardXY(tg.i);
      return { x: x - 12, y: y - 12, w: 24, h: 26 };
    };
    const swap = (a, b) => {
      const pa = byId(a.id), pb = byId(b.id);
      if (a.kind === 'bench' && b.kind === 'bench') return false;
      if ((pa.pos === 'GK') !== (pb.pos === 'GK') && (a.kind === 'slot' && a.i === 0 || b.kind === 'slot' && b.i === 0 || pa.pos === 'GK' || pb.pos === 'GK')) {
        s.msg = { text: 'GKはGK同士でしか入れ替えられません', t: 0 }; Sound.play('cancel'); return false;
      }
      const before = activeCombos(State.lineup).map((c) => c.id);
      if (a.kind === 'slot' && b.kind === 'slot') { const tmp = State.lineup[a.i]; State.lineup[a.i] = State.lineup[b.i]; State.lineup[b.i] = tmp; }
      else { const slot = a.kind === 'slot' ? a : b, bn = a.kind === 'slot' ? b : a; State.lineup[slot.i] = bn.id; }
      Sound.play('stamp', { vol: 0.6 }); Game.addShake(1.5, 0.12);
      const after = activeCombos(State.lineup);
      const born = after.filter((c) => !before.includes(c.id));
      if (born.length) { s.newCombo = { c: born[0], t: 0 }; Sound.play('levelup', { vol: 0.5 }); }
      return true;
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
      const done = { x: 298, y: 219, w: 174, h: 15 };
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
      text(g, 'クリックで2人を選ぶと入れ替え', 164, 12, { size: 8, color: '#c9d6e6' });
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
        g.strokeStyle = c.kind === 'bad' ? '#ff6a6a' : c.kind === 'mixed' ? '#d8a8f0' : '#ffd24a';
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
      });
      // team tactic
      Object.keys(Data.TACTICS).forEach((k, i) => {
        const r = tacRect(i), T = Data.TACTICS[k], cur = State.tactic === k, hv = E.hoverIn(r);
        panel(g, r.x, r.y, r.w, r.h, cur ? 'gold' : hv ? 'sky' : 'paper');
        g.fillStyle = T.color; g.fillRect(r.x + 3, r.y + 4, 3, 8);
        text(g, T.short, r.x + 24, r.y + 3, { size: 8, align: 'center', color: '#2a1a24' });
        if (hv) s.tacHover = k;
      });
      // bench
      text(g, 'ベンチ', 300, 79, { size: 9, color: '#9fdcff' });
      bench().forEach((p, i) => {
        const r = benchRect(i), tg = tgs[11 + i];
        const hl = s.pick && s.pick.kind === 'bench' && s.pick.i === i, hv = s.hover === tg || (s.kb && s.cursor === 11 + i);
        panel(g, r.x + (hl ? 4 : 0), r.y, r.w, r.h, hl ? 'gold' : hv ? 'sky' : 'paper');
        g.drawImage(Art.sprite(p.look, 'down', 'walk1'), r.x + 3 + (hl ? 4 : 0), r.y);
        text(g, p.name + '　' + p.pos, r.x + 22 + (hl ? 4 : 0), r.y + 1, { size: 9, color: '#2a1a24' });
        text(g, '「' + p.nick + '」', r.x + 22 + (hl ? 4 : 0), r.y + 11, { size: 8, color: '#6d4f3a' });
      });
      // combos
      const cy0 = 92 + bench().length * 22 + 4;
      text(g, 'コンビ（' + combos.length + '）', 300, cy0, { size: 9, color: '#ffd24a' });
      combos.slice(0, 8).forEach((c, i) => {
        const x = 300 + (i % 2) * 88, y = cy0 + 12 + Math.floor(i / 2) * 11;
        g.fillStyle = c.kind === 'bad' ? '#ff6a6a' : c.kind === 'mixed' ? '#d8a8f0' : '#ffd24a'; g.fillRect(x, y + 3, 4, 4);
        text(g, c.name, x + 7, y, { size: 8, color: '#ffffff' });
      });
      const done = { x: 298, y: 219, w: 174, h: 15 };
      panel(g, done.x, done.y, done.w, done.h, E.hoverIn(done) ? 'gold' : 'dark');
      text(g, 'X / クリック：決定してもどる', done.x + done.w / 2, done.y + 3, { size: 8, align: 'center', color: E.hoverIn(done) ? '#2a1a24' : '#c9d6e6' });
      // info strip
      const focus = s.hover || (s.kb ? tgs[s.cursor] : null) || s.pick;
      panel(g, 6, 236, 468, 30, 'paper');
      if (s.msg) text(g, s.msg.text, 16, 245, { size: 10, color: '#e0474c' });
      else if (focus) {
        const p = byId(focus.id);
        drawPortrait(g, p.id, 'normal', 8, 237, 0.5);
        text(g, '「' + p.nick + '」' + p.name + '　' + p.pos + '　特性：' + p.trait, 38, 239, { size: 9, color: '#2a1a24' });
        const rel = Data.COMBOS.filter((c) => c.ids.includes(p.id)).map((c) => (c.kind === 'bad' ? '✕' : '♪') + byId(c.ids.find((x) => x !== p.id)).name + '「' + c.name + '」');
        text(g, rel.length ? '相性：' + rel.join('　') : p.traitDesc, 38, 252, { size: 8, color: '#6d4f3a' });
      } else if (s.tacHover) { const T = Data.TACTICS[s.tacHover]; text(g, '戦術「' + T.name + '」', 16, 239, { size: 9, color: '#2a1a24' }); text(g, T.desc, 16, 252, { size: 8, color: '#6d4f3a' }); }
      else text(g, '選手にカーソルを合わせると特性と相性が見られます。1〜3キーで陣形切り替え。', 16, 245, { size: 9, color: '#6d4f3a' });
      s.tacHover = null;
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
    const s = { t: 0, lines: 0 };
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
      g.fillStyle = '#7c1e2c'; g.beginPath(); g.moveTo(W, 0); g.lineTo(W - W * 0.38 * k, 0); g.lineTo(W - W * 0.62 * k, H); g.lineTo(W, H); g.fill();
      // stripes
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 20; i++) { const x = ((i * 50 + s.t * 120) % (W + 100)) - 50; g.fillRect(x, 0, 12, H); }
      const pk = Ease.outBack(clamp((s.t - 0.2) / 0.5, 0, 1));
      drawPortrait(g, 'leo', 'determined', -150 + pk * 170, 50, 3);
      drawPortrait(g, 'tetsuyama', 'determined', W + 6 - pk * 170, 50, 3, true);
      text(g, 'ハマカゼFC', 20 + (1 - pk) * -100, 196, { size: 16, color: '#ffffff', outline: '#10304f', outlineW: 2 });
      text(g, 'ヤマオロシ鉄工団', W - 20 + (1 - pk) * 100, 196, { size: 16, align: 'right', color: '#ffffff', outline: '#4a1018', outlineW: 2 });
      if (s.t > 0.65) {
        const vk = Ease.outElastic(clamp((s.t - 0.65) / 0.8, 0, 1));
        const size = Math.round(20 + 28 * vk);
        text(g, 'VS', W / 2, H / 2 - size / 2 - 20, { size, align: 'center', color: '#ffd24a', outline: '#2a1a24', outlineW: 3 });
      }
      panel(g, W / 2 - 110, 224, 220, 38, 'dark');
      text(g, '練習試合　浜風グラウンド', W / 2, 229, { size: 10, align: 'center', color: '#ffffff' });
      text(g, '天候：晴れ　風：海から弱く', W / 2, 245, { size: 8, align: 'center', color: '#9fdcff' });
      if (s.t > 2.2) text(g, 'Z / クリック', W - 12, H - 14, { size: 8, align: 'right', color: '#ffffff', alpha: blink() });
    };
    return s;
  }

  function PreMatch() {
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
        State.roster.forEach((p, i) => g.drawImage(Art.sprite(p.look, 'down', 'walk1'), 40 + i * 24, 160, 32, 44));
        Data.AWAY.forEach((p, i) => g.drawImage(Art.sprite(p.look, 'down', 'walk1'), 270 + i * 24, 160, 32, 44));
        g.drawImage(Art.sprite(benchLook('onigawara'), 'down', 'walk1'), 440, 150, 32, 44);
      },
      lines: [
        { who: 'onigawara', expr: 'normal', side: 'right', text: 'ガッハッハ！ 港のお遊びクラブが相手とはな。鉄工団の練習にもならんわ！' },
        { who: 'tetsuyama', expr: 'determined', side: 'right', text: '監督、油断は禁物です。…だが、手加減はしない。' },
        { who: 'leo', expr: 'determined', text: 'へぇ、言ってくれるじゃん。その鼻、へし折ってやるよ。' },
        { who: 'nagisa', expr: 'normal', text: '監督、試合中は画面下のボタンか 1〜4キーで指示が出せます。気合ゲージを使うので、ここぞという時に！' },
        { who: 'nagisa', expr: 'determined', text: 'シュートチャンスでは「CHANCE!!」、相手のシュートは「PINCH!!」。練習と同じ、JUST を狙ってください！' },
        { who: 'nagisa', expr: 'happy', text: 'それでは…ハマカゼFC、キックオフです！' },
      ],
      trans: 'blocks',
      next: () => startMatch(),
    });
  }
  let _boards = null;
  function boardsCache() { return _boards || (_boards = Art.buildBoards()); }

  function startMatch() {
    return new Match({
      formation: State.formation, tactic: State.tactic, auto: State.auto, home: State.lineup.map((id) => State.roster.find((p) => p.id === id)),
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
        let v = Math.floor((exp[k] / 11) * (p.growth || 1));
        v = Math.min(v, 6);
        if (v > 0) { ups[k] = v; total += v; }
      }
      if (r.score[0] > r.score[1]) { const k = pick(STAT_KEYS); ups[k] = (ups[k] || 0) + 1; total++; }
      if (total === 0) { ups.sta = 1; total = 1; }
      const before = Object.assign({}, p.stats);
      for (const k in ups) p.stats[k] = Math.min(99, p.stats[k] + ups[k]);
      const rating = clamp(5.5 + (rec.goal || 0) * 1.2 + (rec.assist || 0) * 0.7 + (rec.tackleOk || 0) * 0.25 + (rec.save || 0) * 0.35 + (rec.passOk || 0) * 0.06 + (rec.shot || 0) * 0.1 + (r.score[0] > r.score[1] ? 0.4 : r.score[0] < r.score[1] ? -0.3 : 0), 4.5, 9.8);
      out.push({ p, rec, ups, before, total, rating: Math.round(rating * 10) / 10 });
    }
    return out;
  }

  function Result(r) {
    const s = { t: 0, phase: 'score', gi: -1, gt: 0, fx: new Particles() };
    const win = r.score[0] > r.score[1], lose = r.score[0] < r.score[1];
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
        if (okPressed() || (State.auto && doneAnim)) {
          if (!doneAnim) { s.gt = 0.5 + n * 0.28 + 0.3; s.lastStep = n - 1; }
          else if (s.gi + 1 < s.growth.length) { s.gi++; s.gt = 0; s.lastStep = -1; Sound.play('page'); }
          else { Sound.play('select'); Game.goto(Scout(r), 'iris'); }
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
        MatchCrest(g, W / 2 - 150, 64, 0); MatchCrest(g, W / 2 + 138, 64, 1);
        text(g, 'ハマカゼFC', W / 2 - 110, 90, { size: 10, align: 'center', color: '#2f86c4' });
        text(g, 'ヤマオロシ鉄工団', W / 2 + 110, 90, { size: 10, align: 'center', color: '#b8323a' });
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
        if (A.memos && A.memos.length) text(g, '試合中のメモ ' + A.memos.length + '件　（最初：' + A.memos[0].min + "'「" + A.memos[0].text + '」）', 22, 248, { size: 8, color: '#6d4f3a' });
        if (s.at > 1.2) text(g, 'Z / クリック：つぎへ', 456, 248, { size: 8, align: 'right', color: '#2f86c4', alpha: blink() });
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
          statBar(g, 234, y, 180, Math.round(v), STAT_COLORS[k], cur.before[k]);
          text(g, String(Math.round(v)), 434, y - 2, { size: 10, align: 'right', color: '#2a1a24' });
          if (up && pk > 0) {
            const bounce = Ease.outBack(clamp(pk * 1.5, 0, 1));
            panel(g, 438, y - 4, 26, 14, 'crimson');
            text(g, '+' + up, 451, y - 3 - (1 - bounce) * 4, { size: 9, align: 'center', color: '#ffffff' });
          }
        });
        text(g, '能力アップ！', 150, 60, { size: 16, color: '#e0474c', alpha: s.gt > 0.4 ? 1 : 0 });
        if (p.id === 'haruki' && finished) text(g, '伸び盛り！ 経験がぐんぐん身についた！', 150, 80, { size: 9, color: '#2f86c4' });
        else if (cur.total >= 5 && finished) text(g, 'すばらしい成長だ！', 150, 80, { size: 9, color: '#2f86c4' });
        if (finished) text(g, 'Z / クリック：つぎへ', 456, 244, { size: 8, align: 'right', color: '#6d4f3a', alpha: blink() });
      }
      s.fx.draw(g);
    };
    return s;
  }

  // ---------------- SCOUT ----------------
  function Scout(r) {
    const win = r.score[0] > r.score[1];
    const s = { t: 0, phase: 'talk', menu: null, choice: null, stamp: 0 };
    const cands = ['tetsuyama', 'yukimaru'].map((id) => Data.AWAY.find((p) => p.id === id));
    const talk = Dialog({
      bgm: 'hub', crowd: 0.1,
      bg: (g, t) => { drawHarbor(g, t, 'dusk'); g.fillStyle = '#5a4a3a'; g.fillRect(0, 170, W, 100); for (let x = 0; x < W; x += 16) { g.fillStyle = '#4a3a2a'; g.fillRect(x, 170, 1, 100); } },
      lines: (win ? [
        { who: 'nagisa', expr: 'happy', text: '監督っ！ 勝ちましたね！ 商店街のみなさんも大喜びです！' },
        { who: 'onigawara', expr: 'sad', side: 'right', text: 'ぐぬぬ……港のクラブがここまでやるとは……。' },
      ] : [
        { who: 'nagisa', expr: 'sad', text: '監督……。でも、みんな最後まで走りきりましたよ。' },
        { who: 'onigawara', expr: 'happy', side: 'right', text: 'ガッハッハ！ まあ、港のクラブにしては悪くなかったぞ！' },
      ]).concat([
        { who: 'nagisa', expr: 'surprised', text: 'あっ、監督……！ 鉄工団の選手が、こっちを見てますよ？' },
        { who: 'tetsuyama', expr: 'normal', side: 'right', text: '……あんたのチームのサッカー、面白かった。練習にも、呼んでもらえるか。' },
        { who: 'yukimaru', expr: 'normal', side: 'right', text: 'ボクも。あの監督の声、ピッチの上でもよく聞こえたよ。退屈しなさそうだ。' },
        { who: 'nagisa', expr: 'determined', text: 'これって…スカウトのチャンスです！ でも今のうちの予算だと、声をかけられるのは一人だけ…！' },
      ]),
      next: () => s,
      trans: 'stripe',
    });
    s.enter = () => {
      Sound.bgm('hub');
      s.menu = new Menu(cands.map((c) => ({ id: c.id, label: c.full, sub: c.pos + '・' + c.trait })), 20, 150, 150, 36, 8);
    };
    s.update = (dt) => {
      s.t += dt;
      if (s.phase === 'talk') {
        if (State.auto) { s.menu.sel = 1; Input.pressed.ok = s.t > 1; }
        const it = s.menu.update(dt);
        if (it) {
          s.choice = cands.find((c) => c.id === it.id); s.phase = 'stamp'; s.stamp = 0;
          setTimeout(() => { Sound.play('stamp'); Game.addShake(5, 0.3); Game.doFlash(0.5); }, 350);
          setTimeout(() => Sound.play('levelup'), 700);
        }
      } else if (s.phase === 'stamp') {
        s.stamp += dt;
        if (s.stamp > 1.4 && (okPressed() || (State.auto && s.stamp > 2.5))) {
          const c = s.choice;
          State.recruit = Object.assign({}, c, { stats: Object.assign({}, c.stats), base: Object.assign({}, c.stats), growth: 1.0, look: Object.assign({}, Data.HOME[c.pos === 'DF' ? 1 : 3].look, { skin: c.look.skin, skinD: c.look.skinD, hair: c.look.hair, hairD: c.look.hairD, style: c.look.style, extra: c.look.extra, key: 'recruit_' + c.id }) });
          Sound.play('select');
          Game.goto(Ending(r), 'iris');
        }
      }
    };
    s.draw = (g) => {
      g.fillStyle = '#1c2340'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#222b4e'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 8, 8);
      panel(g, 8, 6, 220, 26, 'crimson');
      text(g, 'スカウト　― 1人だけ声をかけよう ―', 16, 12, { size: 10, color: '#ffffff' });
      const sel = s.phase === 'talk' ? cands[s.menu.sel] : s.choice;
      // card
      panel(g, 180, 40, 290, 222, 'paper');
      g.fillStyle = '#ffd8d8'; g.fillRect(188, 48, 100, 100);
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 100; i += 10) g.fillRect(188 + i, 48, 5, 100);
      drawPortrait(g, sel.id, s.phase === 'stamp' ? 'happy' : 'normal', 190, 48, 2);
      text(g, sel.full, 296, 50, { size: 14, color: '#2a1a24' });
      text(g, sel.age + '歳　' + sel.job + '　' + sel.pos, 296, 70, { size: 9, color: '#6d4f3a' });
      wrap(g, sel.bio, 164, 9).forEach((l, i) => text(g, l, 296, 86 + i * 13, { size: 9, color: '#2a1a24' }));
      panel(g, 296, 118, 166, 30, 'gold');
      text(g, '特性：' + sel.trait, 302, 121, { size: 9, color: '#4a2a10' });
      text(g, sel.traitDesc, 302, 134, { size: 8, color: '#6d4f3a' });
      STAT_KEYS.forEach((k, i) => {
        const y = 158 + i * 19;
        text(g, STAT_NAMES[k], 192, y, { size: 9, color: '#2a1a24' });
        const gr = grade(sel.stats[k]);
        text(g, gr, 262, y - 1, { size: 11, color: GRADE_COL[gr], outline: OUT });
        statBar(g, 280, y + 2, 150, sel.stats[k], STAT_COLORS[k]);
        text(g, String(sel.stats[k]), 458, y, { size: 9, align: 'right', color: '#2a1a24' });
      });
      // choices
      drawPortrait(g, 'nagisa', 'determined', 20, 44, 2);
      if (s.phase === 'talk') s.menu.draw(g);
      else {
        const k = Ease.outBack(clamp((s.stamp - 0.3) / 0.3, 0, 1));
        if (s.stamp > 0.3) {
          g.save(); g.translate(360, 110); g.rotate(-0.2); g.scale(2 - k, 2 - k);
          g.globalAlpha = clamp(k, 0, 1);
          g.strokeStyle = '#e0474c'; g.lineWidth = 3; g.strokeRect(-56, -20, 112, 40);
          text(g, '入団決定！', 0, -12, { size: 18, align: 'center', color: '#e0474c' });
          g.restore();
        }
        panel(g, 20, 150, 150, 70, 'paper');
        wrap(g, sel.id === 'tetsuyama' ? '「鉄山だ。守りは任せてくれ。溶接と同じで、隙間は作らない」' : '「雪丸だよ。…ボールと一緒に走るのが好きなんだ。よろしく」', 136, 9).forEach((l, i) => text(g, l, 28, 158 + i * 13, { size: 9, color: '#2a1a24' }));
        if (s.stamp > 1.4) text(g, 'Z / クリック', 95, 228, { size: 8, align: 'center', color: '#ffffff', alpha: blink() });
      }
    };
    return talk;
  }

  // ---------------- ENDING ----------------
  function Ending(r) {
    const win = r.score[0] > r.score[1];
    const rc = State.recruit;
    const steam = new Particles();
    const lanterns = new Particles();
    const dialog = Dialog({
      bgm: 'ending', crowd: 0,
      title: 'その夜　おタキの屋台',
      bg: (g, t) => {
        drawHarbor(g, t, 'dusk');
        g.fillStyle = '#5a4a3a'; g.fillRect(0, 170, W, 100);
        for (let x = 0; x < W; x += 16) { g.fillStyle = '#4a3a2a'; g.fillRect(x, 170, 1, 100); }
        drawStall(g, t, 180, 76, true);
        steam.update(1 / 60);
        if (Math.random() < 0.35) steam.add({ x: 215 + rand(0, 40), y: 126, vx: rand(-3, 3), vy: rand(-18, -10), life: rand(0.8, 1.4), size: rand(2, 4), color: 'rgba(255,240,220,0.55)' });
        steam.draw(g);
        g.drawImage(Art.sprite(benchLook('otaki'), 'down', Math.sin(t * 5) > 0.3 ? 'cheer' : 'walk1'), 230, 104, 32, 44);
        const crew = State.roster.slice(1).concat(rc ? [rc] : []);
        crew.forEach((p, i) => {
          const x = i < 4 ? 40 + i * 34 : 316 + (i - 4) * 34;
          const fr = Math.floor(t * 2 + i) % 7 === 0 ? 'cheer' : 'walk1';
          g.drawImage(Art.sprite(p.look, i < 4 ? 'side' : 'left', fr), x, 136 + (i % 2) * 4, 32, 44);
        });
        g.drawImage(Art.sprite(State.roster[0].look, 'down', 'walk1'), 146, 150, 32, 44);
        // string lights
        for (let i = 0; i < 16; i++) {
          const x = i * 32 + 8, y = 14 + Math.sin(i * 0.9) * 4;
          g.fillStyle = '#2a1a24'; g.fillRect(x, y - 1, 32, 1);
          const on = (Math.floor(t * 3) + i) % 3 !== 0;
          g.fillStyle = on ? ['#ffd24a', '#ff8a6a', '#9fdcff'][i % 3] : '#6a5a4a';
          g.fillRect(x + 14, y, 4, 5);
        }
      },
      lines: [
        { who: 'otaki', expr: 'happy', text: win ? 'はいよ、祝勝会だよ！ 今日はたこ焼き、好きなだけお食べ！' : 'はいよ、残念会…いや、反省会だ！ 腹が減っちゃ、次も勝てないよ！' },
        { who: 'ponta', expr: 'happy', side: 'right', text: 'うおおお！ 監督、オレ、この日のために生きてたっス！' },
        { who: 'leo', expr: 'normal', side: 'right', text: win ? '…ま、今日は監督の指示も悪くなかったんじゃね？' : '…次は、絶対オレが決める。監督、オレにもっとボール集めさせろよ。' },
        { who: rc ? rc.id : 'kazuha', expr: 'happy', side: 'right', text: rc && rc.id === 'tetsuyama' ? '鉄山だ。今日から世話になる。…このたこ焼き、焼き加減が完璧だな。' : rc ? '雪丸です。…ここのたこ焼き、あったかいね。' : 'いいチームになりそうですね。' },
        { who: 'haruki', expr: 'happy', side: 'right', text: '監督！ オレ、今日だけでめっちゃうまくなった気がします！ 明日も練習しましょう！' },
        { who: 'nagisa', expr: 'happy', text: '監督。来月から、いよいよ地区リーグが始まります。' },
        { who: 'nagisa', expr: 'determined', text: 'ハマカゼFCの挑戦は、ここからです。…これからも、よろしくお願いしますね！' },
        { who: 'otaki', expr: 'happy', text: 'さあさ、冷めないうちに！ ハマカゼFCに、かんぱーい！', fx: 'flash', sfx: 'cheer' },
      ],
      next: () => Credits(r),
    });
    return dialog;
  }

  function Credits(r) {
    const s = { t: 0, fx: new Particles() };
    s.enter = () => { Sound.bgm('ending'); };
    s.update = (dt) => {
      s.t += dt; s.fx.update(dt);
      if (Math.random() < 0.2) s.fx.add({ x: rand(0, W), y: H + 4, vx: rand(-5, 5), vy: rand(-25, -12), life: rand(4, 8), size: rand(1, 2), color: pick(['#ffd24a', '#ffffff', '#9fdcff']), kind: 'star', shrink: false });
      if (s.t > 4 && (okPressed() || (State.auto && s.t > 6))) { Sound.stopBgm(1); Game.goto(Title(), 'iris'); }
    };
    s.draw = (g) => {
      const tw = Art.town('dusk');
      g.drawImage(tw.sky, 0, 0);
      g.fillStyle = 'rgba(16,24,46,0.55)'; g.fillRect(0, 0, W, H);
      s.fx.draw(g);
      const a = clamp(s.t / 1.2, 0, 1);
      text(g, 'ハマカゼFC', W / 2, 30, { size: 30, align: 'center', color: '#ffffff', outline: '#10304f', outlineW: 2, alpha: a });
      text(g, '体験版　第1話　おしまい', W / 2, 68, { size: 12, align: 'center', color: '#ffd24a', alpha: a });
      const k = clamp((s.t - 1) / 1, 0, 1);
      panel(g, 60, 92, 360, 96, 'dark');
      g.globalAlpha = k;
      text(g, 'あなたの第1話', W / 2, 98, { size: 10, align: 'center', color: '#9fdcff' });
      text(g, `練習試合　ハマカゼFC ${r.score[0]} - ${r.score[1]} ヤマオロシ鉄工団`, W / 2, 116, { size: 10, align: 'center', color: '#ffffff' });
      const tot = (State.growth || []).reduce((a2, x) => a2 + x.total, 0);
      text(g, `チーム能力アップ 合計 +${tot}`, W / 2, 134, { size: 10, align: 'center', color: '#ffffff' });
      text(g, '新加入：' + (State.recruit ? State.recruit.full : '―'), W / 2, 152, { size: 10, align: 'center', color: '#ffb0a0' });
      text(g, '練習：' + (State.trained ? TRAININGS.find((x) => x.id === State.trained).label : 'なし') + '　陣形：' + Data.FORMATIONS[State.formation].short, W / 2, 170, { size: 9, align: 'center', color: '#c9d6e6' });
      g.globalAlpha = 1;
      const k2 = clamp((s.t - 2) / 1, 0, 1);
      g.globalAlpha = k2;
      text(g, '次回　第2話「地区リーグ開幕！ 雨のグラウンドと謎の新人」', W / 2, 200, { size: 10, align: 'center', color: '#ffffff', outline: '#10304f' });
      text(g, '遊んでくれて、ありがとう！', W / 2, 222, { size: 12, align: 'center', color: '#ffd24a', outline: '#10304f' });
      g.globalAlpha = 1;
      if (s.t > 4) text(g, 'Z / クリック：タイトルへ', W / 2, H - 16, { size: 8, align: 'center', color: '#ffffff', alpha: blink() });
    };
    return s;
  }

  // ---------------- entry ----------------
  window.Scenes = {
    State,
    start(name, o) {
      State.auto = !!(o && o.auto);
      const map = { title: Title, intro: Intro, hub: () => Hub(true), roster: Roster, train: Training, tactics: Tactics, vs: Versus, pre: PreMatch,
        result: () => Result(fakeResult()), scout: () => Scout(fakeResult()), ending: () => { State.recruit = null; return Ending(fakeResult()); }, credits: () => Credits(fakeResult()) };
      return (map[name] || Title)();
    },
    result(r) { State.result = r; return Result(r); },
  };
  function fakeResult() {
    const recs = State.roster.map((p, i) => ({ id: p.id, name: p.name, team: 0, rec: { pass: 12, passOk: 9, shot: i > 4 ? 3 : 0, goal: i === 5 ? 1 : i === 6 ? 1 : 0, tackle: 4, tackleOk: 2, save: i === 0 ? 5 : 0, dist: 900 + i * 60, touch: 20, assist: i === 3 ? 1 : 0, dribble: 2 } }));
    return { score: [2, 1], recs, poss: [0.52, 0.48], shots: [9, 7], onTarget: [5, 4], goals: [{ team: 0, name: 'レオ', min: 23 }, { team: 1, name: '火野', min: 51 }, { team: 0, name: 'ハルキ', min: 84 }] };
  }
})();
