/* 封札モンスターズ — PIXKIT: shared toolkit for 64x64 monster pixel sprites.
 *
 * Monster modules register:   PIXMON[id] = function (k) { ...draw with k... };
 * The game calls:             PIXKIT.render(id)  -> cached PNG dataURL (64x64, transparent)
 *
 * Drawing model: every shape paints a MATERIAL (a 5-tone colour ramp) into an indexed buffer and
 * belongs to a PART (a volume). After drawing, the kit shades each part automatically from an
 * upper-left light (dome normals estimated from distance-to-edge), separates overlapping parts
 * with a dark seam, adds a selective 1px outline in the ramp's darkest tone, optional glow halos,
 * and a soft ground shadow. Authors draw flat shapes; cohesion comes for free.
 * See PIXMON_STYLE.md for the full guide.
 */
(function () {
  'use strict';
  var W = 96, H = 96, N = W * H;

  // ------------------------------------------------------------------ ramps
  // Tone index: 0 = outline/darkest, 1 = shadow, 2 = base, 3 = light, 4 = highlight.
  // SFC-style hue-shifted ramps: shadows lean purple/blue, highlights lean warm.
  // Tone index: 0 = deepest (pupils, deep crevices), 1 = shadow, 2 = base, 3 = light, 4 = highlight.
  var RAMPS = {
    // --- type ramps
    fire: ['#2a0a1e', '#9a1e3e', '#e84a22', '#ff9a30', '#ffe680'],
    flame: ['#7a1a2a', '#e8481e', '#ff9a1e', '#ffd83a', '#fffac0'],   // glowing fire / flame bodies
    magma: ['#240a1a', '#7a1432', '#e03a1a', '#ff8a1e', '#ffe46a'],
    water: ['#0c0e3a', '#3a2e9a', '#2a78dc', '#5ac4f4', '#d8fcff'],
    aqua: ['#0a2a3a', '#1e5a8a', '#1ea8b0', '#5ae0c8', '#d4fff0'],
    ice: ['#1a1e5a', '#6070c8', '#9cc8f0', '#d8f4ff', '#ffffff'],
    grass: ['#0e1e24', '#1e5a62', '#3a9a38', '#88cc3a', '#e4f27a'],
    leaf: ['#1a2a1a', '#3e6a3a', '#8aaa2a', '#c8d840', '#fff29a'],
    thunder: ['#3a1a0a', '#b0601a', '#f0b020', '#ffe84a', '#fffcd0'],
    dark: ['#0e0620', '#34185a', '#5a34a0', '#9468e0', '#e0b8ff'],
    shadow: ['#06040e', '#1a1030', '#2c1e4e', '#46307a', '#7a5ab0'],  // void cloth / hoods
    light: ['#5a3a3a', '#c8886a', '#f8cc7a', '#fff0b4', '#ffffff'],
    crystal: ['#1e1a5a', '#5a4ac8', '#6aa8f0', '#b4ecff', '#ffffff'],
    sakura: ['#4a1238', '#a8306e', '#f06aa4', '#ffb0d0', '#fff0f6'],
    violet: ['#1e0a3a', '#5a1e9a', '#9a44d8', '#d08aff', '#fbe0ff'],
    // --- neutrals
    fur: ['#241018', '#6a2e3a', '#a4602e', '#d8984a', '#f8d48a'],
    tan: ['#4a2a2a', '#a06a5a', '#dcaa70', '#f4d8a0', '#fff6dc'],
    cream: ['#4a3040', '#b88a98', '#f0d0a8', '#fff0cc', '#ffffff'],
    bone: ['#3a2a38', '#8a7a98', '#d0c4a8', '#f4ecd0', '#ffffff'],
    steel: ['#141a30', '#46508a', '#7c8cc0', '#b8cce8', '#f0f8ff'],
    stone: ['#1e1a2e', '#4e4a6e', '#7e7a90', '#aeaab4', '#e0dcd8'],
    obsidian: ['#08040e', '#1e1432', '#342652', '#56427a', '#8a74b0'],
    skin: ['#4a1a3a', '#b0486a', '#f08a9a', '#ffc0b8', '#fff0e6'],
    gold: ['#3a1a0a', '#a8601a', '#e8a820', '#ffe050', '#fffcc8'],
    white: ['#2a2450', '#8078c0', '#c8c8f0', '#f0f2ff', '#ffffff'],
    black: ['#06040a', '#16101e', '#282034', '#3e344e', '#62567a'],
    red: ['#300818', '#901a4a', '#e02a3a', '#ff6a5a', '#ffc0a8'],
    wood: ['#20100e', '#5a2a3a', '#8a5530', '#c08a48', '#f0c070'],
    mouth: ['#1a0610', '#5a0e2a', '#9a1e3e', '#e0506a', '#ff9ab0']
  };
  var OUTLINE = [18, 10, 24];   // crisp near-black outline used everywhere
  var RL = [null], RI = {};
  function hexRGB(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mixRGB(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  function addRamp(name, hexes) {
    var c = hexes.map(hexRGB);
    var r = { name: name, hex: hexes.slice(), c: c, sel: mixRGB(c[0], c[1], 0.45) };
    if (RI[name]) RL[RI[name]] = r; else { RI[name] = RL.length; RL.push(r); }
    return RI[name];
  }
  for (var nm in RAMPS) addRamp(nm, RAMPS[nm]);
  function mid(m) {
    if (typeof m === 'number') return m;
    var i = RI[m];
    if (!i) throw new Error('PIXKIT: unknown ramp "' + m + '"');
    return i;
  }

  // light direction (upper-left, towards viewer)
  var LX = -0.52, LY = -0.66, LZ = 0.54;
  (function () { var l = Math.hypot(LX, LY, LZ); LX /= l; LY /= l; LZ /= l; })();

  // ------------------------------------------------------------------ kit (one per render)
  function Kit() {
    this.W = W; this.H = H;
    this.mat = new Uint8Array(N);
    this.part = new Int16Array(N).fill(-1);
    this.tone = new Int8Array(N).fill(-1);
    this.seq = new Uint16Array(N);
    this.adj = new Int8Array(N);
    this.setT = new Int8Array(N).fill(-1);
    this.parts = [];
    this.named = {};
    this.shadows = [];
    this.n = 0;
    this.inkPart = null;
  }
  var K = Kit.prototype;

  K._part = function (o, m) {
    var name = o.part || o.clip;
    if (name && this.named[name]) return this.named[name];
    var p = { i: this.parts.length, mask: new Uint8Array(N), x0: W, y0: H, x1: -1, y1: -1, o: o, mat: m, name: name };
    this.parts.push(p);
    if (name) this.named[name] = p;
    return p;
  };
  // core: paint a coverage list
  K._paint = function (cover, mat, o) {
    o = o || {};
    this.n++;
    var j, e, cl;
    if (o.erase) {
      for (j = 0; j < cover.length; j++) { e = cover[j]; this.mat[e] = 0; this.part[e] = -1; this.tone[e] = -1; }
      return this;
    }
    // manual shading pass: adjust (adj) or set (set) the tone of pixels already painted
    if (o.adj != null || o.set != null) {
      cl = o.clip ? this.named[o.clip] : null;
      var onlyMat = mat ? mid(mat) : 0;
      for (j = 0; j < cover.length; j++) {
        e = cover[j];
        if (!this.mat[e] || (cl && this.part[e] !== cl.i) || (onlyMat && this.mat[e] !== onlyMat)) continue;
        if (o.pattern === 'checker' && ((e % W + ((e / W) | 0)) & 1)) continue;
        if (o.pattern === 'sparse' && ((e % W) % 3 !== 0 || (((e / W) | 0) % 3) !== ((e % W) % 6 === 0 ? 0 : 2))) continue;
        if (o.set != null) this.setT[e] = o.set; else this.adj[e] = Math.max(-3, Math.min(3, this.adj[e] + o.adj));
      }
      return this;
    }
    var m = mid(mat), P = this._part(o, m);
    var clip = o.clip ? this.named[o.clip] : null;
    var ft = o.tone != null ? o.tone : -1;
    for (var i = 0; i < cover.length; i++) {
      var idx = cover[i];
      if (clip && this.part[idx] !== clip.i) continue;
      var x = idx % W, y = (idx / W) | 0;
      if (!clip || P === clip) {
        P.mask[idx] = 1;
        if (x < P.x0) P.x0 = x; if (x > P.x1) P.x1 = x; if (y < P.y0) P.y0 = y; if (y > P.y1) P.y1 = y;
      }
      if (o.behind && this.mat[idx]) continue;
      this.mat[idx] = m; this.part[idx] = P.i; this.tone[idx] = ft; this.seq[idx] = this.n;
    }
    return this;
  };
  function inb(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

  // ---------------- shapes (all take material + options)
  K.ellipse = function (cx, cy, rx, ry, mat, o) {
    var c = [];
    for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        if (!inb(x, y)) continue;
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) c.push(y * W + x);
      }
    return this._paint(c, mat, o);
  };
  K.circle = function (cx, cy, r, mat, o) { return this.ellipse(cx, cy, r, r, mat, o); };
  K.rect = function (x, y, w, h, mat, o) {
    var c = [];
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) if (inb(x + i, y + j)) c.push((y + j) * W + x + i);
    return this._paint(c, mat, o);
  };
  K.poly = function (pts, mat, o) {
    var c = [], y0 = H, y1 = 0, i;
    for (i = 0; i < pts.length; i++) { y0 = Math.min(y0, pts[i][1]); y1 = Math.max(y1, pts[i][1]); }
    for (var y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++) {
      var sy = y + 0.5, xs = [];
      for (i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort(function (p, q) { return p - q; });
      for (i = 0; i + 1 < xs.length; i += 2)
        for (var x = Math.max(0, Math.ceil(xs[i] - 0.5)); x <= Math.min(W - 1, Math.floor(xs[i + 1] - 0.5)); x++) c.push(y * W + x);
    }
    return this._paint(c, mat, o);
  };
  // tube: chain of capsules with per-point radius [[x,y,r],...] — tails, necks, limbs, horns, coils
  K.tube = function (pts, mat, o) {
    var seen = new Uint8Array(N), c = [];
    for (var s = 0; s < pts.length - 1; s++) {
      var a = pts[s], b = pts[s + 1];
      var rmax = Math.max(a[2], b[2]) + 1;
      var bx0 = Math.floor(Math.min(a[0], b[0]) - rmax), bx1 = Math.ceil(Math.max(a[0], b[0]) + rmax);
      var by0 = Math.floor(Math.min(a[1], b[1]) - rmax), by1 = Math.ceil(Math.max(a[1], b[1]) + rmax);
      var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-6;
      for (var y = by0; y <= by1; y++) for (var x = bx0; x <= bx1; x++) {
        if (!inb(x, y)) continue;
        var px = x + 0.5, py = y + 0.5;
        var t = ((px - a[0]) * dx + (py - a[1]) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        var qx = a[0] + dx * t - px, qy = a[1] + dy * t - py;
        var r = a[2] + (b[2] - a[2]) * t;
        if (qx * qx + qy * qy <= r * r + 0.2) { var id = y * W + x; if (!seen[id]) { seen[id] = 1; c.push(id); } }
      }
    }
    return this._paint(c, mat, o);
  };
  // spike: triangle from base centre (x0,y0) with base width w to tip (x1,y1) — horns, ears, claws, flame tongues
  K.spike = function (x0, y0, x1, y1, w, mat, o) {
    var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
    return this.poly([[x0 + nx, y0 + ny], [x1, y1], [x0 - nx, y0 - ny]], mat, o);
  };
  // leaf: lens shape between two points, max width w — leaves, fins, feathers, petals
  K.leaf = function (x0, y0, x1, y1, w, mat, o) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return this.tube([[x0, y0, 0.4], [x0 + (mx - x0) * 0.5, y0 + (my - y0) * 0.5, w * 0.4], [mx, my, w / 2], [mx + (x1 - mx) * 0.5, my + (y1 - my) * 0.5, w * 0.4], [x1, y1, 0.4]], mat, o);
  };
  K.star = function (cx, cy, r, mat, o, rot) {
    var p = [], a0 = (rot || 0) - Math.PI / 2;
    for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.45 : r, a = a0 + i * Math.PI / 5; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return this.poly(p, mat, o);
  };

  // ---------------- ink (fixed tone, no shading)
  K.px = function (x, y, mat, tone, o) {
    x = Math.round(x); y = Math.round(y);
    if (!inb(x, y)) return this;
    var idx = y * W + x;
    this.n++;
    if (this.part[idx] < 0) {
      if (!this.inkPart) this.inkPart = this._part({ shade: 'flat', outline: 'none', noline: true }, mid(mat));
      this.part[idx] = this.inkPart.i;
    }
    this.mat[idx] = mid(mat); this.tone[idx] = tone == null ? 0 : tone; this.seq[idx] = this.n;
    if (o && o.part && this.named[o.part]) this.part[idx] = this.named[o.part].i;
    return this;
  };
  K.line = function (x0, y0, x1, y1, mat, tone, o) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (var g = 0; g < 200; g++) {
      this.px(x0, y0, mat, tone, o);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  };
  // polyline of ink
  K.path = function (pts, mat, tone, o) { for (var i = 0; i + 1 < pts.length; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], mat, tone, o); return this; };
  // 4-point twinkle
  K.sparkle = function (x, y, s, mat) {
    mat = mat || 'white'; s = s || 1;
    this.px(x, y, mat, 4);
    for (var i = 1; i <= s; i++) { var t = i === s ? 3 : 4; this.px(x - i, y, mat, t); this.px(x + i, y, mat, t); this.px(x, y - i, mat, t); this.px(x, y + i, mat, t); }
    return this;
  };

  // ---------------- faces
  // Eye (ink, not shaded). (x,y) = top-left of the eye box, w x h (near eye ~9x10 on C monsters).
  // Creature faces LEFT, so the iris sits toward the front (left) of the white.
  // o: { w, h, iris:'gold', mood:'cool'|'fierce'|'open'|'sad'|'happy'|'closed'|'glow',
  //      look: iris x-offset (px, -=left), far:false, brow:true|false, browMat:'black', browTone:0, lash:true }
  K.eye = function (x, y, o) {
    o = o || {};
    var w = o.w || 8, h = o.h || 9, ir = o.iris || 'gold', mood = o.mood || 'cool', ink = o.ink || 'black';
    var i, j;
    if (o.style === 'bulge' || o.style === 'slit') return this._eyeSFC(x, y, w, h, o);
    if (mood === 'happy' || mood === 'closed') {
      for (i = 0; i < w; i++) {
        var u = (i + 0.5) / w * 2 - 1, yy = Math.round((mood === 'happy' ? u * u : 1 - u * u) * (h * 0.25));
        var by = y + Math.round(h * 0.4) + yy;
        this.px(x + i, by, ink, 0); this.px(x + i, by + 1, ink, 0);
      }
      return this;
    }
    var rx = w / 2, ry = h / 2;
    function lidY(i) {
      var f = (i + 0.5) / w; // 0 = front (left), 1 = back
      if (mood === 'fierce') return h * (0.46 - 0.36 * f);
      if (mood === 'cool') return h * (0.1 + 0.06 * f);
      if (mood === 'sad') return h * (0.1 + 0.3 * f);
      return 0;
    }
    function inE(i, j) {
      if (i < 0 || j < 0 || i >= w || j >= h) return false;
      var dx = Math.abs(i + 0.5 - rx) / rx, dy = Math.abs(j + 0.5 - ry) / ry;
      if (Math.pow(dx, 2.4) + Math.pow(dy, 2.4) > 1.02) return false;
      return j >= lidY(i) - 0.001;
    }
    if (mood === 'glow') {
      for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
        if (!inE(i, j)) continue;
        var edge = !inE(i - 1, j) || !inE(i + 1, j) || !inE(i, j - 1) || !inE(i, j + 1);
        this.px(x + i, y + j, ir, edge ? 3 : 4);
      }
      return this;
    }
    var icx = (o.look != null ? rx + o.look : rx - w * 0.12), icy = ry + (o.icy != null ? o.icy : h * 0.02);
    var irx = Math.max(1.2, w * 0.34), iry = Math.max(1.5, h * 0.44);
    var thick = w >= 7 && h >= 7;
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      if (!inE(i, j)) continue;
      var X = x + i, Y = y + j;
      var top = !inE(i, j - 1), topEdge2 = thick && !inE(i, j - 2);
      var side = !inE(i - 1, j) || !inE(i + 1, j), bottom = !inE(i, j + 1);
      if (top || topEdge2) { this.px(X, Y, ink, 0); continue; }
      if (side && (i > w / 2 || j < h * 0.6)) { this.px(X, Y, ink, 0); continue; }
      if (bottom && i > w * 0.6) { this.px(X, Y, ink, 1); continue; }
      var dx = (i + 0.5 - icx) / irx, dy = (j + 0.5 - icy) / iry, d = dx * dx + dy * dy;
      if (d <= 1) {
        var pd = (dx * dx) / 0.2 + (dy * dy) / 0.3;
        var rel = (j + 0.5 - (icy - iry)) / (2 * iry);
        var t = pd <= 1 ? 0 : rel < 0.38 ? 1 : rel < 0.7 ? 2 : 3;
        this.px(X, Y, ir, t);
      } else {
        this.px(X, Y, 'white', (inE(i, j - 2) && inE(i, j - 3)) ? 3 : 2);
      }
    }
    // highlights: crisp 2x2 glint upper-left of the pupil + a small one lower-right
    var gx = Math.round(x + icx - irx * 0.35 - 1), gy = Math.round(y + icy - iry * 0.55);
    if (!inE(gx - x, gy - y)) gy++;
    this.px(gx, gy, 'white', 4);
    if (thick) { this.px(gx + 1, gy, 'white', 4); this.px(gx, gy + 1, 'white', 4); this.px(gx + 1, gy + 1, 'white', 4); }
    else this.px(gx, gy + 1, 'white', 4);
    if (w >= 6) this.px(Math.round(x + icx + irx * 0.45), Math.round(y + icy + iry * 0.45), 'white', 4);
    // lash wing at the back corner
    if (o.lash !== false && !o.far && mood !== 'sad') {
      var ly = Math.round(y + lidY(w - 1));
      this.px(x + w, ly, ink, 0); this.px(x + w + 1, ly - 1, ink, 0);
      if (thick) this.px(x + w, ly + 1, ink, 0);
    }
    // brow
    if (o.brow) {
      var bm = o.browMat || ink, bt = o.browTone != null ? o.browTone : 0;
      var fr = mood === 'fierce', l0 = Math.round(y + lidY(0)) - (fr ? 2 : 3), l1 = y - (fr ? 3 : 2) - (mood === 'sad' ? -1 : 0);
      if (mood === 'sad') { var tt = l0; l0 = l1 + 1; l1 = tt; }
      var bx0 = x + (o.far ? 0 : 1), bx1 = x + w - (o.far ? 2 : 0);
      var bl0 = l0 + (bx0 - x) * (l1 - l0) / Math.max(1, w);
      this.line(bx0, Math.round(bl0), bx1, l1, bm, bt); this.line(bx0 + 1, Math.round(bl0) - 1, bx1 - 1, l1 - 1, bm, bt);
    }
    return this;
  };
  // SFC-style eyes (front-facing monsters).
  //  style:'bulge' — round white eyeball, crisp black ring, tiny pupil. o.pupil (px size), o.look [dx,dy],
  //                  o.lid 0..0.7 (top fraction covered by a lid in o.lidMat, default 'black'), o.lidTilt (+ = lid lower at the inner side)
  //  style:'slit'  — coloured iris (o.iris) with a black vertical slit pupil: menacing.
  //  o.brow [dyLeft, dyRight] — thick brow above (o.browMat, default black), e.g. [2,-1] = angry on a left eye.
  K._eyeSFC = function (x, y, w, h, o) {
    var i, j, rx = w / 2, ry = h / 2, lid = o.lid || 0, tilt = o.lidTilt || 0, look = o.look || [0, 0];
    var ink = 'black';
    function inE(i, j) {
      if (i < 0 || j < 0 || i >= w || j >= h) return false;
      var dx = (i + 0.5 - rx) / rx, dy = (j + 0.5 - ry) / ry;
      return dx * dx + dy * dy <= 1.08;
    }
    var slit = o.style === 'slit', ir = o.iris || (slit ? 'thunder' : 'white');
    var pr = o.pupil != null ? o.pupil : Math.max(1, Math.round(Math.min(w, h) * 0.22));
    var pcx = rx + look[0], pcy = ry + look[1] + (lid ? lid * h * 0.3 : 0);
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      if (!inE(i, j)) continue;
      var X = x + i, Y = y + j;
      var edge = !inE(i - 1, j) || !inE(i + 1, j) || !inE(i, j - 1) || !inE(i, j + 1);
      if (edge) { this.px(X, Y, ink, 0); continue; }
      var f = (i + 0.5) / w, lidY = h * lid + (f - 0.5) * tilt * 2;
      if (lid && j + 0.5 < lidY + 1) { this.px(X, Y, o.lidMat || ink, (j + 0.5 >= lidY) ? 0 : (o.lidMat ? 2 : 0)); continue; }
      var dx = i + 0.5 - pcx, dy = j + 0.5 - pcy;
      if (slit) {
        if (Math.abs(dx) < Math.max(0.6, w * 0.09) && Math.abs(dy) < h * 0.36) { this.px(X, Y, ink, 0); continue; }
        var rel = (j + 0.5) / h;
        this.px(X, Y, ir, rel < 0.35 ? 2 : rel < 0.75 ? 3 : 4);
      } else {
        if (Math.abs(dx) <= pr * 0.5 + 0.01 && Math.abs(dy) <= pr * 0.6 + 0.35) { this.px(X, Y, ink, 0); continue; }
        // eyeball shading: lit upper-left, shaded lower-right rim
        var sh = !inE(i + 1, j + 1) || !inE(i + 2, j + 2);
        this.px(X, Y, ir === 'white' ? 'white' : ir, sh ? 2 : 4);
      }
    }
    if (slit) this.px(Math.round(x + rx - w * 0.28), Math.round(y + ry - h * 0.22), 'white', 4);
    if (o.brow) {
      var bm = o.browMat || ink, bt = o.browTone != null ? o.browTone : 0, b0 = o.brow[0], b1 = o.brow[1];
      var by = y - 2 + Math.round(h * lid * 0.5);
      for (var t = 0; t < (o.browThick || 2); t++) this.line(x - 1, by + b0 - t, x + w, by + b1 - t, bm, bt);
    }
    return this;
  };
  // Mouth. Either k.mouth(x, y, w, h, o) (box) or k.mouth([[x,y],...], o) (polygon).
  // Fills with the dark mouth ramp, top edge darkest, optional tongue. Teeth: add with k.tooth().
  K.mouth = function (x, y, w, h, o) {
    var pts;
    if (Array.isArray(x)) { pts = x; o = y || {}; }
    else { o = o || {}; pts = [[x, y], [x + w, y], [x + w - 1, y + h], [x + 1, y + h]]; }
    this.poly(pts, 'mouth', { tone: 1, part: '_mouth' + this.n, outline: 'none', noseam: true });
    var P = this.parts[this.parts.length - 1];
    // darker top rows, tongue at the bottom
    for (var yy = P.y0; yy <= P.y1; yy++) for (var xx = P.x0; xx <= P.x1; xx++) {
      var id = yy * W + xx;
      if (this.part[id] !== P.i) continue;
      if (yy <= P.y0 + 1) this.tone[id] = 0;
      else if (o.tongue !== false && yy >= P.y1 - 1 && xx > P.x0 + 1 && xx < P.x1 - 1) this.tone[id] = yy === P.y1 - 1 ? 3 : 2;
    }
    var teeth = o.teeth;
    if (teeth === 'fangs') { this.tooth(P.x0 + 2, P.y0, P.x0 + 2.5, P.y0 + 3, 2.5); if (P.x1 - P.x0 > 6) this.tooth(P.x1 - 2, P.y0, P.x1 - 2.5, P.y0 + 3, 2.5); }
    else if (teeth === 'row') for (var tx = P.x0 + 1; tx <= P.x1 - 2; tx += 3) this.tooth(tx + 1, P.y0, tx + 1, P.y0 + 2, 2.4);
    else if (teeth === 'top') this.rect(P.x0 + 1, P.y0, P.x1 - P.x0 - 1, 2, 'white', { tone: 4, outline: 'none', noseam: true });
    return this;
  };
  // Tooth / fang: a crisp white triangle (base centre x0,y0 -> tip x1,y1, base width w). Lit left, shaded right.
  K.tooth = function (x0, y0, x1, y1, w, mat) {
    this.spike(x0, y0, x1, y1, w, mat || 'white', { tone: 4, part: '_tooth' + this.n, outline: 'none', noseam: true, noline: true });
    var P = this.parts[this.parts.length - 1];
    for (var yy = P.y0; yy <= P.y1; yy++) for (var xx = P.x1; xx >= P.x0; xx--) {
      var id = yy * W + xx;
      if (this.part[id] === P.i) { if (xx > P.x0) this.tone[id] = 3; break; }
    }
    return this;
  };
  // soft ground shadow
  K.shadow = function (cx, cy, rx, ry) { this.shadows.push([cx, cy, rx, ry || 1.6]); return this; };
  // symmetric helper: fn(mx) is called twice; mx(x) maps x (identity, then mirrored about cx)
  K.sym = function (cx, fn) { fn(function (x) { return x; }, 1); fn(function (x) { return 2 * cx - x; }, -1); return this; };
  // deterministic RNG
  K.rand = function (seed) { var s = (seed | 0) || 1; return function () { s = Math.imul(s ^ (s >>> 15), 2246822507); s = Math.imul(s ^ (s >>> 13), 3266489909); s ^= s >>> 16; return (s >>> 0) / 4294967296; }; };

  // ------------------------------------------------------------------ post-process
  var DT = new Float32Array(N);
  function distField(p) {
    // chamfer distance inside the part's full mask (distance to nearest outside pixel), restricted to bbox+1
    var x0 = Math.max(0, p.x0 - 1), y0 = Math.max(0, p.y0 - 1), x1 = Math.min(W - 1, p.x1 + 1), y1 = Math.min(H - 1, p.y1 + 1);
    var m = p.mask, x, y, i, v, BIG = 1e4, D = 1.4142;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { i = y * W + x; DT[i] = m[i] ? BIG : 0; }
    // pixels on the canvas border count as edge
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      i = y * W + x; if (!DT[i]) continue;
      v = DT[i];
      v = Math.min(v, (x > 0 ? DT[i - 1] : 0) + 1, (y > 0 ? DT[i - W] : 0) + 1,
        (x > 0 && y > 0 ? DT[i - W - 1] : 0) + D, (x < W - 1 && y > 0 ? DT[i - W + 1] : 0) + D);
      DT[i] = v;
    }
    for (y = y1; y >= y0; y--) for (x = x1; x >= x0; x--) {
      i = y * W + x; if (!DT[i]) continue;
      v = DT[i];
      v = Math.min(v, (x < W - 1 ? DT[i + 1] : 0) + 1, (y < H - 1 ? DT[i + W] : 0) + 1,
        (x < W - 1 && y < H - 1 ? DT[i + W + 1] : 0) + D, (x > 0 && y < H - 1 ? DT[i + W - 1] : 0) + D);
      DT[i] = v;
    }
    var mx = 0, hmap = new Float32Array((x1 - x0 + 1) * (y1 - y0 + 1));
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { v = DT[y * W + x]; if (v > mx) mx = v; }
    var R = p.o.round || Math.max(2, Math.min(mx * 0.95, 12));
    var bw = x1 - x0 + 1;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      v = DT[y * W + x];
      var q = 1 - Math.min(v, R) / R;
      hmap[(y - y0) * bw + (x - x0)] = v ? R * Math.sqrt(1 - q * q) : 0;
    }
    p.h = hmap; p.bx = x0; p.by = y0; p.bw = bw; p.bh = y1 - y0 + 1; p.maxd = mx; p.dist = null;
    if (p.o.shade === 'glow') {
      p.dist = new Float32Array(hmap.length);
      for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) p.dist[(y - y0) * bw + (x - x0)] = DT[y * W + x];
    }
  }
  function hAt(p, x, y) {
    x -= p.bx; y -= p.by;
    if (x < 0 || y < 0 || x >= p.bw || y >= p.bh) return 0;
    return p.h[y * p.bw + x];
  }

  // DQM-style cel shading: clean light and shadow crescents from an upper-left light (no pillow shading)
  function celPrep(p) {
    var md = p.maxd;
    p.cs = Math.max(1, Math.min(10, Math.round(md * (p.o.shadow || 0.8))));   // shadow crescent depth
    p.cl = Math.max(1, Math.min(6, Math.round(md * (p.o.lit || 0.35))));      // light band depth
    // highlight spot centre (upper-left of the part's mass)
    var sx = 0, sy = 0, n = 0, m = p.mask;
    for (var y = p.y0; y <= p.y1; y++) for (var x = p.x0; x <= p.x1; x++) if (m[y * W + x]) { sx += x; sy += y; n++; }
    sx /= n || 1; sy /= n || 1;
    p.hx = sx - (sx - p.x0) * 0.42; p.hy = sy - (sy - p.y0) * 0.5;
    p.hr = md * 0.3;
  }
  function inM(p, x, y) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    return !!p.mask[y * W + x];
  }
  function celTone(p, x, y) {
    var s = p.cs, l = p.cl, t = 2;
    if (!inM(p, x + s * 0.55, y + s) || !inM(p, x + s * 0.8, y + s * 0.45)) t = 1;
    else if (!inM(p, x - l * 0.6, y - l) || !inM(p, x - l, y - l * 0.35)) t = 3;
    if (p.o.hi !== false && p.maxd >= 5 && t === 3) {
      var dx = (x + 0.5 - p.hx) / (p.hr * 1.3), dy = (y + 0.5 - p.hy) / p.hr;
      if (dx * dx + dy * dy <= 1) t = 4;
    }
    if (p.o.light) t = Math.max(1, Math.min(4, t + (p.o.light > 0 ? 1 : -1) * (Math.abs(p.o.light) >= 0.2 ? 1 : 0)));
    return t;
  }

  Kit.prototype.finish = function () {
    var mat = this.mat, part = this.part, tone = this.tone, parts = this.parts, seq = this.seq;
    var i, x, y, p, t;
    var used = new Uint8Array(parts.length);
    for (i = 0; i < N; i++) if (mat[i]) used[part[i]] = 1;
    for (var k = 0; k < parts.length; k++) {
      p = parts[k];
      if (!used[k] || p.x1 < 0) continue;
      var sh = p.o.shade || 'cel';
      if (sh === 'auto' || sh === 'dome' || sh === 'glow' || sh === 'cel') distField(p);
      if (sh === 'cel') celPrep(p);
    }
    var out = new Int8Array(N).fill(-1); // final tone per pixel
    for (i = 0; i < N; i++) {
      if (!mat[i]) continue;
      if (tone[i] >= 0) { out[i] = tone[i]; continue; }
      p = parts[part[i]];
      var o = p.o, mode = o.shade || 'cel';
      x = i % W; y = (i / W) | 0;
      if (mode === 'flat' || mode === 'none' || !p.h) { t = o.flatTone != null ? o.flatTone : 2; }
      else if (mode === 'cel') { t = celTone(p, x, y); }
      else if (mode === 'glow') {
        var dn = p.dist[(y - p.by) * p.bw + (x - p.bx)] / Math.max(1.5, p.maxd);
        t = dn > 0.62 ? 4 : dn > 0.34 ? 3 : dn > 0.12 ? 2 : 1;
        if (t < 4 && hAt(p, x - 1, y - 1) < hAt(p, x + 1, y + 1) - 0.8 && t > 1) t = Math.min(4, t + (dn > 0.2 ? 1 : 0));
      } else {
        var gx = (hAt(p, x + 1, y) - hAt(p, x - 1, y)) * 0.5, gy = (hAt(p, x, y + 1) - hAt(p, x, y - 1)) * 0.5;
        var s = o.flat ? 0.45 : 1;
        var nx = -gx * s, ny = -gy * s, nz = 1, nl = Math.sqrt(nx * nx + ny * ny + 1);
        var lit = (nx * LX + ny * LY + nz * LZ) / nl + (o.light || 0);
        t = lit > 0.86 ? 4 : lit > 0.6 ? 3 : lit > 0.22 ? 2 : 1;
        if (t === 4 && (o.hi === false || hAt(p, x, y) < 1.2)) t = 3;
        if (o.dither && ((x + y) & 1)) {
          if (t === 2 && lit > 0.54) t = 3; else if (t === 1 && lit > 0.17) t = 2;
        }
      }
      if (o.shift) t = Math.max(1, Math.min(4, t + o.shift));
      out[i] = t;
    }
    // orphan cleanup: a lone auto-shaded pixel surrounded by one other tone joins it
    var fix = [];
    for (i = 0; i < N; i++) {
      if (!mat[i] || tone[i] >= 0) continue;
      x = i % W; y = (i / W) | 0;
      if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue;
      var a1 = i - 1, a2 = i + 1, a3 = i - W, a4 = i + W, pi = part[i];
      if (part[a1] !== pi || part[a2] !== pi || part[a3] !== pi || part[a4] !== pi) continue;
      var t1 = out[a1];
      if (t1 !== out[i] && out[a2] === t1 && out[a3] === t1 && out[a4] === t1 && tone[a1] < 0) fix.push(i, t1);
    }
    for (i = 0; i < fix.length; i += 2) out[fix[i]] = fix[i + 1];
    // manual shading passes
    for (i = 0; i < N; i++) {
      if (!mat[i] || tone[i] >= 0) continue;
      if (this.setT[i] >= 0) out[i] = this.setT[i];
      else if (this.adj[i]) out[i] = Math.max(1, Math.min(4, out[i] + this.adj[i]));
    }
    // seams: a pixel whose neighbour belongs to a part drawn later (in front) gets darkened
    var seamT = new Int8Array(N).fill(-1);
    var NB = [-1, 1, -W, W];
    for (i = 0; i < N; i++) {
      if (!mat[i] || tone[i] >= 0) continue;
      p = parts[part[i]];
      if (p.o.noline) continue;
      x = i % W; y = (i / W) | 0;
      for (var n = 0; n < 4; n++) {
        if ((n === 0 && x === 0) || (n === 1 && x === W - 1) || (n === 2 && y === 0) || (n === 3 && y === H - 1)) continue;
        var j = i + NB[n];
        if (!mat[j] || part[j] === part[i] || seq[j] <= seq[i]) continue;
        var q = parts[part[j]];
        if (q.o.noseam || q === this.inkPart) continue;
        seamT[i] = (mat[j] !== mat[i] || n === 3) ? -2 : Math.max(1, out[i] - 1);
        // pixels just below a front part read as a soft cast shadow instead of a hard line
        if (n === 2 && mat[j] === mat[i]) seamT[i] = Math.max(1, out[i] - 1);
        break;
      }
    }
    for (i = 0; i < N; i++) { if (seamT[i] === -2) out[i] = -2; else if (seamT[i] >= 0) out[i] = Math.min(out[i], seamT[i]); }

    // compose
    var img = new Uint8ClampedArray(N * 4);
    // ground shadow
    for (var s2 = 0; s2 < this.shadows.length; s2++) {
      var S = this.shadows[s2];
      for (y = Math.floor(S[1] - S[3] - 1); y <= Math.ceil(S[1] + S[3] + 1); y++) for (x = Math.floor(S[0] - S[2] - 1); x <= Math.ceil(S[0] + S[2] + 1); x++) {
        if (!inb(x, y)) continue;
        var ex = (x + 0.5 - S[0]) / S[2], ey = (y + 0.5 - S[1]) / S[3], e = ex * ex + ey * ey;
        if (e > 1) continue;
        i = (y * W + x) * 4;
        img[i] = 26; img[i + 1] = 20; img[i + 2] = 48; img[i + 3] = Math.max(img[i + 3], e < 0.45 ? 110 : 70);
      }
    }
    // halos (glow) — drawn under the outline, outside the silhouette
    for (k = 0; k < parts.length; k++) {
      p = parts[k];
      if (!p.o.halo || !used[k]) continue;
      var hr = p.o.haloR || 2, hc = RL[p.mat].c[3], ha = typeof p.o.halo === 'number' ? p.o.halo : 0.35;
      for (y = Math.max(0, p.y0 - hr - 1); y <= Math.min(H - 1, p.y1 + hr + 1); y++) for (x = Math.max(0, p.x0 - hr - 1); x <= Math.min(W - 1, p.x1 + hr + 1); x++) {
        i = y * W + x;
        if (mat[i]) continue;
        var best = 99;
        for (var dy = -hr; dy <= hr; dy++) for (var dx = -hr; dx <= hr; dx++) {
          var xx = x + dx, yy = y + dy;
          if (!inb(xx, yy)) continue;
          var jj = yy * W + xx;
          if (mat[jj] && part[jj] === k) { var dd = Math.max(Math.abs(dx), Math.abs(dy)); if (dd < best) best = dd; }
        }
        if (best > hr) continue;
        var a = Math.round(255 * ha * (best <= 1 ? 1 : 0.5)), q4 = i * 4;
        if (a > img[q4 + 3]) { img[q4] = hc[0]; img[q4 + 1] = hc[1]; img[q4 + 2] = hc[2]; img[q4 + 3] = a; }
      }
    }
    // outline: empty pixels 4-adjacent to the sprite
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (mat[i]) continue;
      var pick = -1, lit2 = false;
      // prefer neighbours below/right (outline sits on the lit top-left side -> softer colour)
      var cand = [[x, y + 1, true], [x + 1, y, true], [x, y - 1, false], [x - 1, y, false]];
      for (var c = 0; c < 4; c++) {
        var cx = cand[c][0], cy = cand[c][1];
        if (!inb(cx, cy)) continue;
        var ci = cy * W + cx;
        if (!mat[ci]) continue;
        var pp = parts[part[ci]];
        if (pp.o.outline === 'none') continue;
        if (pick < 0 || (!cand[c][2] && lit2)) { pick = ci; lit2 = cand[c][2]; }
      }
      if (pick < 0) continue;
      var r = RL[mat[pick]], pm = parts[part[pick]].o.outline;
      var col = pm === 'soft' ? r.c[1] : OUTLINE;
      var q4b = i * 4;
      img[q4b] = col[0]; img[q4b + 1] = col[1]; img[q4b + 2] = col[2]; img[q4b + 3] = 255;
    }
    for (i = 0; i < N; i++) {
      if (!mat[i]) continue;
      var cc = out[i] === -2 ? OUTLINE : RL[mat[i]].c[out[i] < 0 ? 2 : out[i]], q4c = i * 4;
      img[q4c] = cc[0]; img[q4c + 1] = cc[1]; img[q4c + 2] = cc[2]; img[q4c + 3] = 255;
    }
    return img;
  };

  // ------------------------------------------------------------------ public
  window.PIXMON = window.PIXMON || {};
  var CACHE = {}, CANV = {};
  function drawToCanvas(fn) {
    var k = new Kit();
    fn(k);
    var img = k.finish();
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.getContext('2d').putImageData(new ImageData(img, W, H), 0, 0);
    return cv;
  }
  window.PIXKIT = {
    W: W, H: H,
    RAMPS: RAMPS,
    ramp: function (name) { var r = RL[RI[name]]; return r ? r.hex.slice() : null; },
    addRamp: function (name, hexes) { addRamp(name, hexes); RAMPS[name] = hexes.slice(); CACHE = {}; CANV = {}; },
    has: function (id) { return !!window.PIXMON[id]; },
    ids: function () { return Object.keys(window.PIXMON).map(Number).sort(function (a, b) { return a - b; }); },
    // cached 64x64 canvas
    canvas: function (id) {
      if (CANV[id]) return CANV[id];
      var fn = window.PIXMON[id];
      if (!fn) return null;
      CANV[id] = drawToCanvas(fn);
      return CANV[id];
    },
    // cached PNG dataURL (64x64, transparent)
    render: function (id) {
      if (CACHE[id]) return CACHE[id];
      var cv = this.canvas(id);
      if (!cv) return null;
      CACHE[id] = cv.toDataURL('image/png');
      return CACHE[id];
    },
    // draw an ad-hoc function (for previews / experiments); not cached
    draw: function (fn) { return drawToCanvas(fn); },
    clear: function (id) { if (id == null) { CACHE = {}; CANV = {}; } else { delete CACHE[id]; delete CANV[id]; } }
  };
})();
