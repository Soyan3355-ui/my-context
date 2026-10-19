/* 封札モンスターズ — PIXKIT v3: toolkit for SFC-quality monster battle sprites.
 *
 * Monster modules register:   PIXMON[id] = function (k) { ...draw with k... };
 * The game calls:             PIXKIT.render(id)  -> cached PNG dataURL (80x80, transparent)
 *
 * Model: shapes paint a MATERIAL (7-tone hue-shifted ramp) into an indexed buffer and belong to a PART (a volume).
 * finish(): per-part form shading from an upper-left light (dome normals from distance-to-edge) quantised into
 * 5 body tones with checker-dithered transitions, reflected light on shadow rims and specular dots; then texture
 * and hand-shading passes, black seams between different materials, and a 1px outline (near-black, coloured on
 * lit top/left edges). See PIXMON_STYLE.md.
 */
(function () {
  'use strict';
  var W = 80, H = 80, N = W * H;
  var T = 7; // tones per ramp: 0 deepest, 1-2 shadows, 3 base, 4-5 lights, 6 highlight/specular

  var RAMPS = {
    fire: ['#2a0816', '#6a1230', '#a8203a', '#e04a24', '#ff8a2a', '#ffc450', '#fff2a8'],
    flame: ['#6a1020', '#b82a1a', '#f05a18', '#ff9020', '#ffc03a', '#ffe880', '#fffce0'],
    magma: ['#1e0612', '#561030', '#9a1a2a', '#e0401a', '#ff7a1e', '#ffbe40', '#fff29a'],
    water: ['#0a0a30', '#1e1e70', '#2a3aa8', '#2a6ad8', '#3aa2ee', '#80d8fa', '#e0fcff'],
    aqua: ['#06202a', '#10465e', '#146e86', '#1aa0a4', '#3ed0b8', '#94f0d4', '#e8fff4'],
    ice: ['#141a4a', '#34459a', '#5a7ad0', '#8cb0ec', '#bcdcfa', '#e2f4ff', '#ffffff'],
    grass: ['#0a1a1e', '#123e44', '#1e6a3e', '#30963a', '#62c038', '#a8e04a', '#eaf690'],
    leaf: ['#141e10', '#2e4a1e', '#4e7a24', '#7ea62a', '#b0cc3a', '#dcea60', '#fffab0'],
    thunder: ['#2a1206', '#6a3210', '#b0661a', '#e8a01e', '#ffd23a', '#fff080', '#fffee0'],
    dark: ['#0a0418', '#22103e', '#3a1e6a', '#5a34a0', '#8458d0', '#b88af0', '#ecd4ff'],
    shadow: ['#040208', '#100a1e', '#1c1234', '#2a1e4c', '#3e2c6a', '#5a4494', '#8a70c4'],
    violet: ['#14062a', '#3a1068', '#60209e', '#8c3ed4', '#b870f0', '#e0acff', '#fbeaff'],
    light: ['#4a2a30', '#8a5044', '#c88a5a', '#f0c070', '#ffe09a', '#fff4cc', '#ffffff'],
    crystal: ['#14104a', '#302a98', '#4a5ad0', '#5a96ec', '#8cccf8', '#c8f0ff', '#ffffff'],
    sakura: ['#3a0a2a', '#7a1a4e', '#b83272', '#ec5c98', '#ff90b8', '#ffc4da', '#fff0f6'],
    fur: ['#1a0a10', '#4a1a24', '#7a3428', '#a8582e', '#d0843c', '#eeb460', '#fce2a0'],
    tan: ['#2e1618', '#6a3a34', '#a0664a', '#cc9260', '#e8b87a', '#f8dca4', '#fff6e0'],
    cream: ['#3a2030', '#7a5060', '#b88a80', '#e2b890', '#f6d8a8', '#fff0cc', '#ffffff'],
    bone: ['#2a1a2a', '#5a4a60', '#8e8088', '#bcae96', '#e0d4b4', '#f6eed4', '#ffffff'],
    steel: ['#0e1224', '#2a3260', '#46548e', '#6a80b8', '#98b0da', '#c8dcf2', '#f4fbff'],
    stone: ['#16121e', '#2e2a42', '#4a4660', '#6a6680', '#928ea4', '#bcb8c4', '#e6e2e6'],
    obsidian: ['#060308', '#140c22', '#221638', '#34244e', '#4a386a', '#6a5490', '#9c86c0'],
    skin: ['#3a1030', '#7a2448', '#b44a64', '#e27888', '#fca4a8', '#ffd0c8', '#fff2ec'],
    gold: ['#2a1206', '#6a3a0e', '#a8661a', '#dca024', '#f8d040', '#fff08a', '#fffee0'],
    white: ['#1e1a40', '#4a4688', '#7a7ab8', '#aab0dc', '#d4daf2', '#f0f4fc', '#ffffff'],
    black: ['#040208', '#0e0a14', '#1a1422', '#2a2234', '#3e344c', '#564a68', '#7a6e8e'],
    red: ['#240614', '#5a0e2a', '#9a1634', '#d42a36', '#f45a48', '#ff9a78', '#ffd8c4'],
    wood: ['#160a0a', '#3a1a1e', '#5e2e26', '#8a4e30', '#b47440', '#d8a060', '#f4d090'],
    mouth: ['#140410', '#3a0a22', '#62122e', '#8e1e3a', '#c83c54', '#f07888', '#ffb8c0']
  };
  var OUTLINE = [16, 8, 20];
  var RL = [null], RI = {};
  function hexRGB(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function addRamp(name, hexes) {
    if (hexes.length !== T) throw new Error('PIXKIT: ramp "' + name + '" needs ' + T + ' colours');
    var r = { name: name, hex: hexes.slice(), c: hexes.map(hexRGB) };
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
  var LX = -0.5, LY = -0.64, LZ = 0.58;
  (function () { var l = Math.hypot(LX, LY, LZ); LX /= l; LY /= l; LZ /= l; })();
  function hash(x, y, s) { var n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s | 0, 1274126177)) | 0; n = Math.imul(n ^ (n >>> 13), 1103515245); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
  function inb(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

  // ------------------------------------------------------------------ kit
  function Kit() {
    this.W = W; this.H = H; this.T = T;
    this.mat = new Uint8Array(N);
    this.part = new Int16Array(N).fill(-1);
    this.tone = new Int8Array(N).fill(-1);
    this.seq = new Uint16Array(N);
    this.adj = new Int8Array(N);
    this.setT = new Int8Array(N).fill(-1);
    this.parts = []; this.named = {}; this.shadows = []; this.n = 0; this.inkPart = null;
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
  K._paint = function (cover, mat, o) {
    o = o || {};
    this.n++;
    var j, e;
    if (o.erase) { for (j = 0; j < cover.length; j++) { e = cover[j]; this.mat[e] = 0; this.part[e] = -1; this.tone[e] = -1; } return this; }
    if (o.adj != null || o.set != null) {
      var cl = o.clip ? this.named[o.clip] : null, only = mat ? mid(mat) : 0;
      for (j = 0; j < cover.length; j++) {
        e = cover[j];
        if (!this.mat[e] || (cl && this.part[e] !== cl.i) || (only && this.mat[e] !== only)) continue;
        var x = e % W, y = (e / W) | 0;
        if (o.pattern === 'checker' && ((x + y) & 1)) continue;
        if (o.pattern === 'sparse' && (((x + 2 * y) % 4) !== 0)) continue;
        if (o.set != null) this.setT[e] = o.set; else this.adj[e] = Math.max(-4, Math.min(4, this.adj[e] + o.adj));
      }
      return this;
    }
    var m = mid(mat), P = this._part(o, m), clip = o.clip ? this.named[o.clip] : null, ft = o.tone != null ? o.tone : -1;
    for (var i = 0; i < cover.length; i++) {
      var idx = cover[i];
      if (clip && this.part[idx] !== clip.i) continue;
      var xx = idx % W, yy = (idx / W) | 0;
      if (!clip || P === clip) {
        P.mask[idx] = 1;
        if (xx < P.x0) P.x0 = xx; if (xx > P.x1) P.x1 = xx; if (yy < P.y0) P.y0 = yy; if (yy > P.y1) P.y1 = yy;
      }
      if (o.behind && this.mat[idx]) continue;
      this.mat[idx] = m; this.part[idx] = P.i; this.tone[idx] = ft; this.seq[idx] = this.n;
      this.adj[idx] = 0; this.setT[idx] = -1;
    }
    return this;
  };

  // ---------------- shapes
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
  K.tube = function (pts, mat, o) {
    var seen = new Uint8Array(N), c = [];
    for (var s = 0; s < pts.length - 1; s++) {
      var a = pts[s], b = pts[s + 1], rmax = Math.max(a[2], b[2]) + 1;
      var bx0 = Math.floor(Math.min(a[0], b[0]) - rmax), bx1 = Math.ceil(Math.max(a[0], b[0]) + rmax);
      var by0 = Math.floor(Math.min(a[1], b[1]) - rmax), by1 = Math.ceil(Math.max(a[1], b[1]) + rmax);
      var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-6;
      for (var y = by0; y <= by1; y++) for (var x = bx0; x <= bx1; x++) {
        if (!inb(x, y)) continue;
        var px = x + 0.5, py = y + 0.5, t = ((px - a[0]) * dx + (py - a[1]) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        var qx = a[0] + dx * t - px, qy = a[1] + dy * t - py, r = a[2] + (b[2] - a[2]) * t;
        if (qx * qx + qy * qy <= r * r + 0.2) { var id = y * W + x; if (!seen[id]) { seen[id] = 1; c.push(id); } }
      }
    }
    return this._paint(c, mat, o);
  };
  K.spike = function (x0, y0, x1, y1, w, mat, o) {
    var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
    return this.poly([[x0 + nx, y0 + ny], [x1, y1], [x0 - nx, y0 - ny]], mat, o);
  };
  K.leaf = function (x0, y0, x1, y1, w, mat, o) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return this.tube([[x0, y0, 0.4], [x0 + (mx - x0) * 0.5, y0 + (my - y0) * 0.5, w * 0.4], [mx, my, w / 2], [mx + (x1 - mx) * 0.5, my + (y1 - my) * 0.5, w * 0.4], [x1, y1, 0.4]], mat, o);
  };
  K.star = function (cx, cy, r, mat, o, rot) {
    var p = [], a0 = (rot || 0) - Math.PI / 2;
    for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.45 : r, a = a0 + i * Math.PI / 5; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return this.poly(p, mat, o);
  };
  // tufts: spikes along a polyline, pointing to its LEFT side (use reversed points for the other side).
  // o: {len, w, jitter, seed, every} — roughens silhouettes (fur fringes, ragged hems, spiky manes)
  K.tufts = function (pts, mat, o) {
    o = o || {};
    var len = o.len || 3, w = o.w || 3, every = o.every || 3, seed = o.seed || 7, jit = o.jitter == null ? 0.5 : o.jitter;
    var so = {}; for (var kk in o) so[kk] = o[kk];
    var acc = 0, n = 0;
    for (var s = 0; s + 1 < pts.length; s++) {
      var a = pts[s], b = pts[s + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      var nx = dy / L, ny = -dx / L; // left normal (screen coords)
      for (var t = acc; t < L; t += every) {
        var x = a[0] + dx * t / L, y = a[1] + dy * t / L, r = hash(n++, seed, 3);
        var l = len * (1 - jit * 0.5 + jit * r), lean = (hash(n, seed, 5) - 0.5) * jit;
        this.spike(x - nx * 1, y - ny * 1, x + nx * l + dx / L * lean * l, y + ny * l + dy / L * lean * l, w, mat, so);
      }
      acc = t - L;
    }
    return this;
  };

  // ---------------- texture passes (tone adjustments inside a part)
  // kind: 'scales' | 'fur' | 'bark' | 'stone' | 'feather' | 'cloth' | 'dots'   o: {size, seed, strength}
  K.texture = function (partName, kind, o) {
    o = o || {};
    var P = this.named[partName];
    if (!P) return this;
    var sz = o.size || 4, seed = o.seed || 1, st = o.strength || 1;
    for (var y = P.y0; y <= P.y1; y++) for (var x = P.x0; x <= P.x1; x++) {
      var i = y * W + x;
      if (this.part[i] !== P.i || this.tone[i] >= 0) continue;
      var a = 0;
      if (kind === 'scales') {
        var row = Math.floor(y / (sz - 1)), off = (row & 1) ? sz / 2 : 0, cx = (x + off) % sz, cy = y % (sz - 1);
        if (cy === sz - 2 && cx > 0) a = -st; else if (cy === 0 && cx === 1) a = st;
      } else if (kind === 'fur') {
        var h = hash(Math.floor((x + (y % 2)) / 2), Math.floor(y / 3), seed);
        if (h < 0.22 && (y % 3) !== 0) a = -st; else if (h > 0.9 && (y % 3) === 0) a = st;
      } else if (kind === 'bark') {
        var wv = Math.round(Math.sin(y * 0.7 + x * 0.3) * 0.8);
        if (((x + wv) % sz) === 0) a = -st; else if (((x + wv) % sz) === 1 && hash(x, y, seed) > 0.6) a = st;
      } else if (kind === 'stone') {
        var hs = hash(Math.floor(x / sz), Math.floor(y / sz), seed);
        if (x % sz === 0 || (y + Math.floor(hs * 3)) % sz === 0) a = -st; else if (hs > 0.7 && (x + y) % 5 === 0) a = st;
      } else if (kind === 'feather') {
        var fr = Math.floor(y / sz), fo = (fr & 1) ? sz / 2 : 0;
        if (y % sz === sz - 1 && ((x + fo) % sz) !== 0) a = -st; else if (((x + fo) % sz) === 0) a = -st;
      } else if (kind === 'cloth') {
        if ((x + y * 2) % (sz * 2) === 0) a = -st;
      } else if (kind === 'dots') {
        if (hash(x, y, seed) < 0.06) a = st;
      }
      if (a) this.adj[i] = Math.max(-4, Math.min(4, this.adj[i] + a));
    }
    return this;
  };

  // ---------------- ink
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
    this.adj[idx] = 0; this.setT[idx] = -1;
    return this;
  };
  K.line = function (x0, y0, x1, y1, mat, tone) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (var g = 0; g < 300; g++) {
      this.px(x0, y0, mat, tone);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  };
  K.path = function (pts, mat, tone) { for (var i = 0; i + 1 < pts.length; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], mat, tone); return this; };
  K.sparkle = function (x, y, s, mat) {
    mat = mat || 'white'; s = s || 1;
    this.px(x, y, mat, 6);
    for (var i = 1; i <= s; i++) { var t = i === s ? 4 : 6; this.px(x - i, y, mat, t); this.px(x + i, y, mat, t); this.px(x, y - i, mat, t); this.px(x, y + i, mat, t); }
    return this;
  };

  // ---------------- faces
  // k.eye(x, y, o): (x,y) top-left of the eye box.
  //  style 'glare' (default, house style): small intense almond eye with a heavy lid, coloured iris, dark pupil, 1px glint.
  //        o: {w:5, h:4, iris:'red', side:'L'|'R', angry:1 (0..2 lid slant, inner side lower), look:[dx,dy], brow:true, browMat, browTone}
  //  style 'bulge': round white eyeball, black ring, tiny pupil (gag monsters only). o: {pupil, look, lid, lidMat}
  //  style 'slit' : coloured eye with a black slit pupil. o: {iris}
  K.eye = function (x, y, o) {
    o = o || {};
    var st = o.style || 'glare';
    var w = o.w || (st === 'glare' ? 5 : 8), h = o.h || (st === 'glare' ? 4 : 8);
    var rx = w / 2, ry = h / 2, i, j, look = o.look || [0, 0], ink = 'black';
    var side = o.side || 'L', ang = o.angry == null ? 1 : o.angry;
    function inE(i, j) {
      if (i < 0 || j < 0 || i >= w || j >= h) return false;
      var dx = (i + 0.5 - rx) / rx, dy = (j + 0.5 - ry) / ry;
      return dx * dx + dy * dy <= (st === 'glare' ? 1.25 : 1.08);
    }
    if (st === 'glare') {
      var ir = o.iris || 'red';
      for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
        if (!inE(i, j)) continue;
        var f = (i + 0.5) / w, inner = side === 'L' ? f : 1 - f;
        var lidY = h * (o.lid != null ? o.lid : 0.3) + ang * (inner - 0.3) * h * 0.45;
        if (j + 0.5 < lidY || j === 0) { this.px(x + i, y + j, ink, 0); continue; }
        var edge = !inE(i - 1, j) || !inE(i + 1, j) || !inE(i, j + 1);
        if (edge && (j === h - 1 || i === 0 || i === w - 1)) { this.px(x + i, y + j, ink, 1); continue; }
        var pcx = rx + look[0], pr = Math.max(0.5, w * 0.12);
        if (Math.abs(i + 0.5 - pcx) <= pr + 0.01) { this.px(x + i, y + j, ink, 0); continue; }
        this.px(x + i, y + j, ir, j <= lidY + 0.5 ? 4 : 5);
      }
      var gx = Math.round(x + rx + look[0] - 1 - Math.max(0, w * 0.12)), gy = Math.round(y + h * 0.3 + ang * 0.2 * h * 0.45 + 0.6);
      this.px(gx, Math.min(gy, y + h - 2), 'white', 6);
      if (o.brow !== false) {
        var bm = o.browMat || ink, bt = o.browTone != null ? o.browTone : 0;
        var yo = y - 1, yi = y - 1 + Math.round(ang * 1.2);
        var xl = x - 1, xr = x + w;
        if (side === 'L') { this.line(xl, yo - 1, xr, yi - 1 + 1, bm, bt); this.line(xl, yo - 2, xr - 1, yi - 1, bm, bt); }
        else { this.line(xl, yi, xr, yo - 1, bm, bt); this.line(xl + 1, yi - 1, xr, yo - 2, bm, bt); }
      }
      return this;
    }
    var lid = o.lid || 0, pr2 = o.pupil != null ? o.pupil : 2, slit = st === 'slit', ir2 = o.iris || (slit ? 'thunder' : 'white');
    var pcx2 = rx + look[0], pcy2 = ry + look[1] + lid * h * 0.3;
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      if (!inE(i, j)) continue;
      var X = x + i, Y = y + j;
      var ed = !inE(i - 1, j) || !inE(i + 1, j) || !inE(i, j - 1) || !inE(i, j + 1);
      if (ed) { this.px(X, Y, ink, 0); continue; }
      if (lid && j + 0.5 < h * lid + 1) { this.px(X, Y, o.lidMat || ink, j + 0.5 >= h * lid ? 1 : (o.lidMat ? 3 : 0)); continue; }
      var dx = i + 0.5 - pcx2, dy = j + 0.5 - pcy2;
      if (slit) {
        if (Math.abs(dx) < Math.max(0.6, w * 0.09) && Math.abs(dy) < h * 0.36) { this.px(X, Y, ink, 0); continue; }
        this.px(X, Y, ir2, (j + 0.5) / h < 0.4 ? 4 : 5);
      } else {
        if (Math.abs(dx) <= pr2 * 0.5 + 0.01 && Math.abs(dy) <= pr2 * 0.6 + 0.35) { this.px(X, Y, ink, 0); continue; }
        var sh = !inE(i + 1, j + 1) || !inE(i + 2, j + 2);
        this.px(X, Y, ir2, sh ? 4 : 6);
      }
    }
    if (slit) this.px(Math.round(x + rx - w * 0.28), Math.round(y + ry - h * 0.2), 'white', 6);
    return this;
  };
  // mouth polygon (or box): dark interior, deepest top edge, tongue at the bottom
  K.mouth = function (x, y, w, h, o) {
    var pts;
    if (Array.isArray(x)) { pts = x; o = y || {}; } else { o = o || {}; pts = [[x, y], [x + w, y], [x + w - 1, y + h], [x + 1, y + h]]; }
    this.poly(pts, 'mouth', { tone: 2, part: '_mouth' + this.n, outline: 'none', noseam: true });
    var P = this.parts[this.parts.length - 1];
    for (var yy = P.y0; yy <= P.y1; yy++) for (var xx = P.x0; xx <= P.x1; xx++) {
      var id = yy * W + xx;
      if (this.part[id] !== P.i) continue;
      if (yy <= P.y0 + 1) this.tone[id] = 0;
      else if (yy === P.y0 + 2) this.tone[id] = 1;
      else if (o.tongue !== false && yy >= P.y1 - 1 && xx > P.x0 + 1 && xx < P.x1 - 1) this.tone[id] = yy === P.y1 - 1 ? 5 : 4;
    }
    return this;
  };
  // one tooth / fang / tusk: lit left, shaded right, darker tip-base line
  K.tooth = function (x0, y0, x1, y1, w, mat) {
    this.spike(x0, y0, x1, y1, w, mat || 'bone', { tone: 6, part: '_tooth' + this.n, outline: 'none', noseam: true, noline: true });
    var P = this.parts[this.parts.length - 1];
    for (var yy = P.y0; yy <= P.y1; yy++) {
      var first = -1, last = -1;
      for (var xx = P.x0; xx <= P.x1; xx++) if (this.part[yy * W + xx] === P.i) { if (first < 0) first = xx; last = xx; }
      if (last > first) this.tone[yy * W + last] = 4;
    }
    return this;
  };
  K.shadow = function (cx, cy, rx, ry) { this.shadows.push([cx, cy, rx, ry || 1.6]); return this; };
  K.sym = function (cx, fn) { fn(function (x) { return x; }, 1); fn(function (x) { return 2 * cx - x; }, -1); return this; };
  K.rand = function (seed) { var s = (seed | 0) || 1; return function () { s = Math.imul(s ^ (s >>> 15), 2246822507); s = Math.imul(s ^ (s >>> 13), 3266489909); s ^= s >>> 16; return (s >>> 0) / 4294967296; }; };

  // ------------------------------------------------------------------ shading
  var DT = new Float32Array(N);
  function distField(p) {
    var x0 = Math.max(0, p.x0 - 1), y0 = Math.max(0, p.y0 - 1), x1 = Math.min(W - 1, p.x1 + 1), y1 = Math.min(H - 1, p.y1 + 1);
    var m = p.mask, x, y, i, v, BIG = 1e4, D = 1.4142;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { i = y * W + x; DT[i] = m[i] ? BIG : 0; }
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      i = y * W + x; if (!DT[i]) continue;
      DT[i] = Math.min(DT[i], (x > 0 ? DT[i - 1] : 0) + 1, (y > 0 ? DT[i - W] : 0) + 1, (x > 0 && y > 0 ? DT[i - W - 1] : 0) + D, (x < W - 1 && y > 0 ? DT[i - W + 1] : 0) + D);
    }
    for (y = y1; y >= y0; y--) for (x = x1; x >= x0; x--) {
      i = y * W + x; if (!DT[i]) continue;
      DT[i] = Math.min(DT[i], (x < W - 1 ? DT[i + 1] : 0) + 1, (y < H - 1 ? DT[i + W] : 0) + 1, (x < W - 1 && y < H - 1 ? DT[i + W + 1] : 0) + D, (x > 0 && y < H - 1 ? DT[i + W - 1] : 0) + D);
    }
    var mx = 0, bw = x1 - x0 + 1, bh = y1 - y0 + 1, hm = new Float32Array(bw * bh), dm = new Float32Array(bw * bh);
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { v = DT[y * W + x]; if (v > mx) mx = v; }
    var R = p.o.round || Math.max(2, Math.min(mx, 9));
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      v = DT[y * W + x];
      var q = 1 - Math.min(v, R) / R, k2 = (y - y0) * bw + (x - x0);
      hm[k2] = v ? R * Math.sqrt(1 - q * q) : 0; dm[k2] = v;
    }
    p.h = hm; p.dm = dm; p.bx = x0; p.by = y0; p.bw = bw; p.bh = bh; p.maxd = mx;
  }
  function hAt(p, x, y) { x -= p.bx; y -= p.by; if (x < 0 || y < 0 || x >= p.bw || y >= p.bh) return 0; return p.h[y * p.bw + x]; }
  function dAt(p, x, y) { x -= p.bx; y -= p.by; if (x < 0 || y < 0 || x >= p.bw || y >= p.bh) return 0; return p.dm[y * p.bw + x]; }
  var TH = [-0.12, 0.3, 0.64, 0.86];  // lit thresholds between tones 1|2|3|4|5

  Kit.prototype.finish = function () {
    var mat = this.mat, part = this.part, tone = this.tone, parts = this.parts, seq = this.seq;
    var i, x, y, p, t, k;
    var used = new Uint8Array(parts.length);
    for (i = 0; i < N; i++) if (mat[i]) used[part[i]] = 1;
    for (k = 0; k < parts.length; k++) { p = parts[k]; if (used[k] && p.x1 >= 0 && (p.o.shade || 'form') !== 'flat') distField(p); }
    var out = new Int8Array(N).fill(-1), dith = new Uint8Array(N);
    for (i = 0; i < N; i++) {
      if (!mat[i]) continue;
      if (tone[i] >= 0) { out[i] = tone[i]; continue; }
      p = parts[part[i]];
      var o = p.o, mode = o.shade || 'form';
      x = i % W; y = (i / W) | 0;
      if (mode === 'flat' || !p.h) t = o.flatTone != null ? o.flatTone : 3;
      else if (mode === 'glow') {
        var dn = dAt(p, x, y) / Math.max(1.5, p.maxd);
        t = dn > 0.7 ? 6 : dn > 0.5 ? 5 : dn > 0.3 ? 4 : dn > 0.14 ? 3 : 2;
      } else {
        var gx = (hAt(p, x + 1, y) - hAt(p, x - 1, y)) * 0.5, gy = (hAt(p, x, y + 1) - hAt(p, x, y - 1)) * 0.5;
        var s = o.flat ? 0.45 : 1, nx = -gx * s, ny = -gy * s, nl = Math.sqrt(nx * nx + ny * ny + 1);
        var lit = (nx * LX + ny * LY + LZ) / nl + (o.light || 0);
        t = 1; for (var q = 0; q < 4; q++) if (lit > TH[q]) t = q + 2;
        // checker dither across band transitions
        if (o.dither !== false) for (q = 0; q < 4; q++) {
          var dd = lit - TH[q];
          if (Math.abs(dd) < 0.045 && ((x + y) & 1)) { t = dd > 0 ? q + 1 : q + 2; dith[i] = 1; break; }
        }
        var d = dAt(p, x, y);
        // reflected light: shadow-side rim facing down/right gets bounced light
        if (o.reflect !== false && t <= 2 && d <= 1.5 && (gx > 0.2 || gy > 0.2) && p.maxd >= 3) t++;
        // specular dot
        if (o.spec !== false && lit > 0.95 && d >= 2 && p.maxd >= 4) t = 6;
      }
      if (o.shift) t += o.shift;
      out[i] = Math.max(1, Math.min(6, t));
    }
    // orphan cleanup (never touches dither pixels)
    var fix = [];
    for (i = 0; i < N; i++) {
      if (!mat[i] || tone[i] >= 0 || dith[i]) continue;
      x = i % W; y = (i / W) | 0;
      if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue;
      var pi = part[i], a1 = i - 1, a2 = i + 1, a3 = i - W, a4 = i + W;
      if (part[a1] !== pi || part[a2] !== pi || part[a3] !== pi || part[a4] !== pi) continue;
      var t1 = out[a1];
      if (t1 !== out[i] && out[a2] === t1 && out[a3] === t1 && out[a4] === t1) fix.push(i, t1);
    }
    for (i = 0; i < fix.length; i += 2) out[fix[i]] = fix[i + 1];
    // manual / texture passes
    for (i = 0; i < N; i++) {
      if (!mat[i] || tone[i] >= 0) continue;
      if (this.setT[i] >= 0) out[i] = this.setT[i];
      else if (this.adj[i]) out[i] = Math.max(1, Math.min(6, out[i] + this.adj[i]));
    }
    // seams
    var seam = new Int8Array(N).fill(-1), NB = [-1, 1, -W, W];
    for (i = 0; i < N; i++) {
      if (!mat[i] || tone[i] >= 0) continue;
      p = parts[part[i]];
      if (p.o.noline) continue;
      x = i % W; y = (i / W) | 0;
      for (var n = 0; n < 4; n++) {
        if ((n === 0 && x === 0) || (n === 1 && x === W - 1) || (n === 2 && y === 0) || (n === 3 && y === H - 1)) continue;
        var j = i + NB[n];
        if (!mat[j] || part[j] === part[i] || seq[j] <= seq[i]) continue;
        var qq = parts[part[j]];
        if (qq.o.noseam || qq === this.inkPart) continue;
        seam[i] = (mat[j] !== mat[i]) ? 9 : Math.max(1, out[i] - 2);
        break;
      }
    }
    for (i = 0; i < N; i++) if (seam[i] >= 0) out[i] = seam[i] === 9 ? -2 : Math.min(out[i], seam[i]);

    // compose
    var img = new Uint8ClampedArray(N * 4);
    for (var s2 = 0; s2 < this.shadows.length; s2++) {
      var S = this.shadows[s2];
      for (y = Math.floor(S[1] - S[3] - 1); y <= Math.ceil(S[1] + S[3] + 1); y++) for (x = Math.floor(S[0] - S[2] - 1); x <= Math.ceil(S[0] + S[2] + 1); x++) {
        if (!inb(x, y)) continue;
        var ex = (x + 0.5 - S[0]) / S[2], ey = (y + 0.5 - S[1]) / S[3], e = ex * ex + ey * ey;
        if (e > 1) continue;
        i = (y * W + x) * 4;
        img[i] = 20; img[i + 1] = 14; img[i + 2] = 40; img[i + 3] = Math.max(img[i + 3], e < 0.45 ? 120 : 75);
      }
    }
    for (k = 0; k < parts.length; k++) {
      p = parts[k];
      if (!p.o.halo || !used[k]) continue;
      var hr = p.o.haloR || 2, hc = RL[p.mat].c[5], ha = typeof p.o.halo === 'number' ? p.o.halo : 0.35;
      for (y = Math.max(0, p.y0 - hr - 1); y <= Math.min(H - 1, p.y1 + hr + 1); y++) for (x = Math.max(0, p.x0 - hr - 1); x <= Math.min(W - 1, p.x1 + hr + 1); x++) {
        i = y * W + x;
        if (mat[i]) continue;
        var best = 99;
        for (var dy = -hr; dy <= hr; dy++) for (var dx = -hr; dx <= hr; dx++) {
          var xx = x + dx, yy = y + dy;
          if (!inb(xx, yy)) continue;
          var jj = yy * W + xx;
          if (mat[jj] && part[jj] === k) { var dd2 = Math.max(Math.abs(dx), Math.abs(dy)); if (dd2 < best) best = dd2; }
        }
        if (best > hr) continue;
        var al = Math.round(255 * ha * (best <= 1 ? 1 : 0.5)), q4 = i * 4;
        if (al > img[q4 + 3]) { img[q4] = hc[0]; img[q4 + 1] = hc[1]; img[q4 + 2] = hc[2]; img[q4 + 3] = al; }
      }
    }
    // outline: near-black; on lit top/left edges a dark tint of the neighbouring colour
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (mat[i]) continue;
      var pick = -1, litSide = false;
      var cand = [[x, y + 1, true], [x + 1, y, true], [x, y - 1, false], [x - 1, y, false]];
      for (var c = 0; c < 4; c++) {
        var cx2 = cand[c][0], cy2 = cand[c][1];
        if (!inb(cx2, cy2)) continue;
        var ci = cy2 * W + cx2;
        if (!mat[ci]) continue;
        if (parts[part[ci]].o.outline === 'none') continue;
        if (pick < 0 || (!cand[c][2] && litSide)) { pick = ci; litSide = cand[c][2]; }
      }
      if (pick < 0) continue;
      var r = RL[mat[pick]], pm = parts[part[pick]].o.outline;
      var col = pm === 'soft' ? r.c[2] : (litSide && pm !== 'black' ? r.c[1] : OUTLINE);
      var q4b = i * 4;
      img[q4b] = col[0]; img[q4b + 1] = col[1]; img[q4b + 2] = col[2]; img[q4b + 3] = 255;
    }
    for (i = 0; i < N; i++) {
      if (!mat[i]) continue;
      var cc = out[i] === -2 ? OUTLINE : RL[mat[i]].c[out[i] < 0 ? 3 : out[i]], q4c = i * 4;
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
    W: W, H: H, TONES: T,
    RAMPS: RAMPS,
    ramp: function (name) { var r = RL[RI[name]]; return r ? r.hex.slice() : null; },
    addRamp: function (name, hexes) { addRamp(name, hexes); RAMPS[name] = hexes.slice(); CACHE = {}; CANV = {}; },
    has: function (id) { return !!window.PIXMON[id]; },
    ids: function () { return Object.keys(window.PIXMON).map(Number).sort(function (a, b) { return a - b; }); },
    canvas: function (id) {
      if (CANV[id]) return CANV[id];
      var fn = window.PIXMON[id];
      if (!fn) return null;
      CANV[id] = drawToCanvas(fn);
      return CANV[id];
    },
    render: function (id) {
      if (CACHE[id]) return CACHE[id];
      var cv = this.canvas(id);
      if (!cv) return null;
      CACHE[id] = cv.toDataURL('image/png');
      return CACHE[id];
    },
    draw: function (fn) { return drawToCanvas(fn); },
    clear: function (id) { if (id == null) { CACHE = {}; CANV = {}; } else { delete CACHE[id]; delete CANV[id]; } }
  };
})();
