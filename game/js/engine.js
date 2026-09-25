/* ハマカゼFC — core engine: canvas, loop, input, tweens, particles, draw helpers */
(function () {
  'use strict';

  const W = 480, H = 270;
  const FONT = '"DotGothic16", "Hiragino Kaku Gothic ProN", "Meiryo", monospace';

  // ---------- math / easing ----------
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
  const Ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
    outBounce: (t) => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };

  // ---------- canvas ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let S = 1; // logical -> device pixel scale

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    let s = Math.min(window.innerWidth / W, window.innerHeight / H) * dpr;
    if (s >= 2) s = Math.floor(s);
    s = Math.max(s, 0.5);
    S = s;
    canvas.width = Math.round(W * S);
    canvas.height = Math.round(H * S);
    canvas.style.width = (W * S) / dpr + 'px';
    canvas.style.height = (H * S) / dpr + 'px';
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  resize();

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  }

  // ---------- input ----------
  const Input = {
    down: {}, pressed: {}, released: {},
    mouse: { x: -99, y: -99, down: false, clicked: false, moved: false, active: false },
    anyPressed: false,
    _map: {
      ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      KeyZ: 'ok', Enter: 'ok', Space: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back',
      Digit1: 'c1', Digit2: 'c2', Digit3: 'c3', Digit4: 'c4', Digit5: 'c5', Numpad1: 'c1', Numpad2: 'c2', Numpad3: 'c3', Numpad4: 'c4', Numpad5: 'c5', Tab: 'c5',
      KeyM: 'mute', KeyP: 'pause',
    },
    isDown(a) { return !!this.down[a]; },
    hit(a) { return !!this.pressed[a]; },
    endFrame() { this.pressed = {}; this.released = {}; this.mouse.clicked = false; this.mouse.moved = false; this.anyPressed = false; },
  };
  window.addEventListener('keydown', (e) => {
    const a = Input._map[e.code];
    if (a) {
      e.preventDefault();
      if (!Input.down[a]) Input.pressed[a] = true;
      Input.down[a] = true;
    }
    Input.anyPressed = true;
    Input.mouse.active = false;
    if (window.Sound) Sound.init();
  });
  window.addEventListener('keyup', (e) => {
    const a = Input._map[e.code];
    if (a) { Input.down[a] = false; Input.released[a] = true; }
  });
  function toLogical(ev) {
    const r = canvas.getBoundingClientRect();
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H];
  }
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = toLogical(e);
    Input.mouse.x = x; Input.mouse.y = y; Input.mouse.moved = true; Input.mouse.active = true;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = toLogical(e);
    Input.mouse.x = x; Input.mouse.y = y; Input.mouse.down = true; Input.mouse.clicked = true; Input.mouse.active = true;
    Input.anyPressed = true;
    if (window.Sound) Sound.init();
    e.preventDefault();
  });
  window.addEventListener('pointerup', () => { Input.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- tweens / timers ----------
  class Tweens {
    constructor() { this.list = []; }
    to(obj, props, dur, ease = Ease.outQuad, delay = 0) {
      return new Promise((res) => {
        const from = {};
        for (const k in props) from[k] = obj[k];
        this.list.push({ obj, props, from, dur, ease, t: -delay, res, started: false });
      });
    }
    wait(sec) { return new Promise((res) => this.list.push({ wait: true, t: 0, dur: sec, res })); }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const tw = this.list[i];
        tw.t += dt;
        if (tw.wait) { if (tw.t >= tw.dur) { this.list.splice(i, 1); tw.res(); } continue; }
        if (tw.t < 0) continue;
        if (!tw.started) { tw.started = true; for (const k in tw.props) tw.from[k] = tw.obj[k]; }
        const p = clamp(tw.t / tw.dur, 0, 1), e = tw.ease(p);
        for (const k in tw.props) tw.obj[k] = lerp(tw.from[k], tw.props[k], e);
        if (p >= 1) { this.list.splice(i, 1); tw.res(); }
      }
    }
    clear() { this.list = []; }
  }

  // ---------- particles ----------
  class Particles {
    constructor() { this.list = []; }
    add(p) {
      this.list.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, life: 1, t: 0, size: 2, color: '#fff', kind: 'rect', spin: 0, rot: 0, shrink: true, layer: 0 }, p));
    }
    burst(x, y, n, opts) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(opts.speedMin || 20, opts.speedMax || 80);
        this.add(Object.assign({}, opts, {
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (opts.flatY || 1) - (opts.up || 0),
          life: rand(opts.lifeMin || 0.3, opts.lifeMax || 0.8),
          color: Array.isArray(opts.color) ? pick(opts.color) : opts.color,
          size: opts.sizeMax ? rand(opts.size || 1, opts.sizeMax) : opts.size,
        }));
      }
    }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.t += dt;
        if (p.t >= p.life) { this.list.splice(i, 1); continue; }
        p.vy += p.g * dt;
        if (p.drag) { const d = Math.pow(1 - p.drag, dt * 60); p.vx *= d; p.vy *= d; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.spin * dt;
      }
    }
    draw(g, ox = 0, oy = 0, layer = null) {
      for (const p of this.list) {
        if (layer !== null && p.layer !== layer) continue;
        const k = 1 - p.t / p.life;
        const s = p.shrink ? Math.max(0.5, p.size * k) : p.size;
        g.globalAlpha = p.fade === false ? 1 : Math.min(1, k * 2);
        g.fillStyle = p.color;
        const x = Math.round(p.x - ox), y = Math.round(p.y - oy);
        if (p.kind === 'confetti') {
          const w = Math.max(1, Math.round(Math.abs(Math.cos(p.rot)) * s));
          g.fillRect(x, y, w, Math.round(s * 0.7) || 1);
        } else if (p.kind === 'star') {
          const r = Math.round(s);
          g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1);
          if (r > 1) g.fillRect(x - 1, y - 1, 3, 3);
        } else if (p.kind === 'ring') {
          const r = Math.round(p.size * (p.t / p.life) * 1.0 + 2);
          g.strokeStyle = p.color; g.lineWidth = 1;
          g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
        } else {
          const r = Math.round(s);
          g.fillRect(x - (r >> 1), y - (r >> 1), r || 1, r || 1);
        }
      }
      g.globalAlpha = 1;
    }
    clear() { this.list = []; }
  }

  // ---------- text & UI drawing ----------
  function setFont(g, size, bold) { g.font = (bold ? 'bold ' : '') + size + 'px ' + FONT; }
  function text(g, str, x, y, opt = {}) {
    const size = opt.size || 10;
    setFont(g, size, opt.bold);
    g.textAlign = opt.align || 'left';
    g.textBaseline = opt.baseline || 'top';
    if (opt.alpha !== undefined) g.globalAlpha = opt.alpha;
    if (opt.outline) {
      g.fillStyle = opt.outline;
      const o = opt.outlineW || 1;
      for (let dx = -o; dx <= o; dx++) for (let dy = -o; dy <= o; dy++) if (dx || dy) g.fillText(str, x + dx, y + dy);
    }
    if (opt.shadow) { g.fillStyle = opt.shadow; g.fillText(str, x + 1, y + 1); }
    g.fillStyle = opt.color || '#fff';
    g.fillText(str, x, y);
    if (opt.alpha !== undefined) g.globalAlpha = 1;
  }
  function measure(g, str, size) { setFont(g, size); return g.measureText(str).width; }
  // simple word-wrap for Japanese (char-based) with manual \n
  function wrap(g, str, maxW, size) {
    setFont(g, size);
    const out = [];
    for (const para of str.split('\n')) {
      let line = '';
      for (const ch of para) {
        const test = line + ch;
        if (g.measureText(test).width > maxW && line) {
          // kinsoku: don't start line with punctuation
          if ('、。！？」』…ー'.includes(ch)) { out.push(test); line = ''; continue; }
          out.push(line); line = ch;
        } else line = test;
      }
      out.push(line);
    }
    return out;
  }

  const PAL = {
    ink: '#2a1a24', ink2: '#3b2a3a', paper: '#fff6e0', paper2: '#f2e3c2', paper3: '#d9c39a',
    sky: '#4fb4e8', skyD: '#2f86c4', skyL: '#9fdcff', red: '#e0474c', redD: '#9e2a3a', gold: '#ffd24a', goldD: '#d48a1e',
    green: '#6cc35a', greenD: '#3f8a3e', navy: '#1c2340', navy2: '#28325a', white: '#ffffff', cream: '#fff1c9',
    crimson: '#b8323a', crimsonD: '#7c1e2c', lime: '#8fd14f',
  };

  // pixel-bordered panel (9-slice drawn procedurally)
  function panel(g, x, y, w, h, style = 'paper') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const st = {
      paper: ['#2a1a24', '#fff6e0', '#e8d6ae', '#ffffff'],
      dark: ['#0e1224', '#28325a', '#1c2340', '#3d4a80'],
      sky: ['#10304f', '#4fb4e8', '#2f86c4', '#9fdcff'],
      gold: ['#4a2a10', '#ffd24a', '#d48a1e', '#fff1a0'],
      crimson: ['#2a0e14', '#b8323a', '#7c1e2c', '#e86a6a'],
    }[style] || style;
    const [ol, fill, shade, hi] = st;
    g.fillStyle = ol;
    g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4); g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = fill; g.fillRect(x + 2, y + 1, w - 4, h - 2); g.fillRect(x + 1, y + 2, w - 2, h - 4);
    g.fillStyle = shade; g.fillRect(x + 2, y + h - 3, w - 4, 2); g.fillRect(x + w - 3, y + 2, 2, h - 4);
    g.fillStyle = hi; g.fillRect(x + 2, y + 2, w - 5, 1); g.fillRect(x + 2, y + 2, 1, h - 5);
  }

  // ---------- scene manager & loop ----------
  const Game = {
    W, H, ctx, canvas, time: 0, frame: 0, scene: null, next: null,
    trans: { t: 0, phase: 'none', dur: 0.45, kind: 'iris', color: '#1c2340' },
    shake: { mag: 0, t: 0 }, hitstop: 0, flash: { a: 0, color: '#fff' }, timeScale: 1,
    tweens: new Tweens(), paused: false, debug: false,
    get S() { return S; },
    goto(scene, kind = 'iris', color) {
      if (this.trans.phase !== 'none') return;
      this.next = scene; this.trans.phase = 'out'; this.trans.t = 0; this.trans.kind = kind; this.trans.color = color || '#1c2340';
      if (window.Sound && kind !== 'cut') Sound.play('swoosh', { vol: 0.35 });
    },
    set(scene) { this.scene = scene; this.tweens.clear(); scene.enter && scene.enter(); },
    addShake(m, t = 0.25) { this.shake.mag = Math.max(this.shake.mag, m); this.shake.t = Math.max(this.shake.t, t); },
    doHitstop(sec) { this.hitstop = Math.max(this.hitstop, sec); },
    doFlash(a = 0.8, color = '#fff') { this.flash.a = a; this.flash.color = color; },
  };

  function drawTransition(g) {
    const tr = Game.trans;
    if (tr.phase === 'none') return;
    let p = clamp(tr.t / tr.dur, 0, 1);
    if (tr.phase === 'in') p = 1 - p;
    g.fillStyle = tr.color;
    if (tr.kind === 'iris') {
      const R = Math.hypot(W, H) / 2 + 4;
      const r = R * (1 - Ease.inOutQuad(p));
      g.beginPath();
      g.rect(0, 0, W, H);
      g.arc(W / 2, H / 2, Math.max(0, r), 0, Math.PI * 2, true);
      g.fill('evenodd');
    } else if (tr.kind === 'blocks') {
      const bs = 30;
      for (let bx = 0; bx < W / bs; bx++) for (let by = 0; by < H / bs + 1; by++) {
        const d = (bx + by) / (W / bs + H / bs);
        const lp = clamp(p * 2 - d, 0, 1);
        const s = Math.ceil(bs * lp);
        g.fillRect(bx * bs + (bs - s) / 2, by * bs + (bs - s) / 2, s, s);
      }
    } else if (tr.kind === 'stripe') {
      const n = 9, sh = H / n;
      for (let i = 0; i < n; i++) {
        const lp = clamp(p * 1.6 - i * 0.06, 0, 1);
        const w = W * Ease.inOutQuad(lp);
        if (i % 2) g.fillRect(W - w, i * sh, w + 1, sh + 1); else g.fillRect(0, i * sh, w + 1, sh + 1);
      }
    } else { g.globalAlpha = p; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  }

  let last = performance.now();
  function loop(now) {
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (Input.hit('mute') && window.Sound) { Sound.setMuted(!Sound.muted); }

    // transitions
    const tr = Game.trans;
    if (tr.phase !== 'none') {
      tr.t += dt;
      if (tr.t >= tr.dur) {
        if (tr.phase === 'out') { Game.set(Game.next); Game.next = null; tr.phase = 'in'; tr.t = 0; }
        else { tr.phase = 'none'; }
      }
    }

    let sdt = dt;
    if (Game.hitstop > 0) { Game.hitstop -= dt; sdt = 0; }
    sdt *= Game.timeScale;
    Game.time += dt;
    Game.frame++;

    if (Game.scene) {
      const blockInput = tr.phase === 'out';
      if (blockInput) { Input.pressed = {}; Input.mouse.clicked = false; }
      Game.tweens.update(dt);
      Game.scene.update && Game.scene.update(sdt, dt);
    }

    // shake
    let sx = 0, sy = 0;
    if (Game.shake.t > 0) {
      Game.shake.t -= dt;
      const m = Game.shake.mag * clamp(Game.shake.t / 0.25, 0, 1);
      sx = Math.round(rand(-m, m)); sy = Math.round(rand(-m, m));
      if (Game.shake.t <= 0) Game.shake.mag = 0;
    }

    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(sx, sy);
    if (Game.scene && Game.scene.draw) Game.scene.draw(ctx);
    ctx.restore();
    if (Game.scene && Game.scene.drawOverlay) Game.scene.drawOverlay(ctx);

    if (Game.flash.a > 0) {
      ctx.globalAlpha = Game.flash.a; ctx.fillStyle = Game.flash.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      Game.flash.a = Math.max(0, Game.flash.a - dt * 4);
    }
    drawTransition(ctx);
    if (window.Sound && Sound.muted) {
      text(ctx, 'MUTE', W - 4, H - 12, { size: 8, align: 'right', color: '#fff', outline: '#000' });
    }

    Input.endFrame();
    requestAnimationFrame(loop);
  }

  Game.start = function (scene) {
    Game.set(scene);
    requestAnimationFrame((t) => { last = t; loop(t); });
  };

  // generic hover/click button helper
  function button(g, b, opts = {}) {
    // b: {x,y,w,h,label,sub,style,disabled}
    const hov = !b.disabled && (b.focus || (Input.mouse.active && Input.mouse.x >= b.x && Input.mouse.x < b.x + b.w && Input.mouse.y >= b.y && Input.mouse.y < b.y + b.h));
    const press = hov && Input.mouse.down;
    const oy = press ? 1 : 0;
    panel(g, b.x, b.y + oy, b.w, b.h, b.disabled ? ['#2a1a24', '#b9ad98', '#9a8e7a', '#d9cfbb'] : hov ? (opts.hoverStyle || 'gold') : (b.style || 'paper'));
    if (b.label) text(g, b.label, b.x + b.w / 2, b.y + b.h / 2 - (b.size || 10) / 2 + oy - (b.sub ? 4 : 0), { size: b.size || 10, align: 'center', color: b.disabled ? '#6d6354' : '#2a1a24' });
    if (b.sub) text(g, b.sub, b.x + b.w / 2, b.y + b.h / 2 + 3 + oy, { size: 8, align: 'center', color: '#6d4f3a' });
    return hov;
  }
  function inRect(x, y, r) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }
  function clickedIn(r) { return Input.mouse.clicked && inRect(Input.mouse.x, Input.mouse.y, r); }
  function hoverIn(r) { return Input.mouse.active && inRect(Input.mouse.x, Input.mouse.y, r); }

  window.E = {
    W, H, FONT, PAL, Game, Input, Ease, Tweens, Particles,
    clamp, lerp, rand, randi, pick, dist, approach,
    makeCanvas, text, measure, wrap, panel, button, inRect, clickedIn, hoverIn, setFont,
  };
})();
