/* 封札モンスターズ — procedural overworld pixel art.
 * Everything is drawn in code into cached offscreen canvases; no image assets.
 * Exposes a single global: window.PIX (see interface at the bottom).
 * Optional extension: drawTile/drawOverlay accept (…, nb, tx, ty) — if the engine passes
 * world tile coords, grass/pavement variation is keyed on them; otherwise a stable
 * neighbourhood hash is used (never screen position, so nothing shimmers while scrolling).
 */
(function () {
  'use strict';
  var TILE = 16;

  // ------------------------------------------------------------------ colour
  var _rgb = {};
  function rgb(c) {
    var v = _rgb[c];
    if (v) return v;
    var h = c.charAt(0) === '#' ? c.slice(1) : c;
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    v = [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16),
      h.length >= 8 ? parseInt(h.substr(6, 2), 16) : 255];
    _rgb[c] = v;
    return v;
  }
  function hex(r, g, b) {
    return '#' + [r, g, b].map(function (n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? '0' : '') + n.toString(16); }).join('');
  }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }

  // Palette: warm early-summer countryside, light from the top-left.
  var C = {
    ol: '#2a2140', olb: '#3a2528', eye: '#2a2140',
    g0: '#2c5a3c', g1: '#447f3f', g2: '#5f9f48', g3: '#7fba56', g4: '#abd672',
    t0: '#173a2e', t1: '#245634', t2: '#347440', t3: '#4f9a48', t4: '#86c560',
    d0: '#6e4c32', d1: '#9a7248', d2: '#be9764', d3: '#dcbd88',
    w0: '#2a5690', w1: '#3a74ba', w2: '#5596d6', w3: '#8fc8ee', w4: '#e6f8ff',
    wd0: '#4a2e22', wd1: '#794c30', wd2: '#a26d3e', wd3: '#c9955a', wd4: '#e2b878',
    st0: '#48445a', st1: '#6e6a80', st2: '#9a96a6', st3: '#c4c0c8', st4: '#e2dfe2',
    pl0: '#bba888', pl1: '#dccca8', pl2: '#f2e8cc',
    ver0: '#8c2626', ver1: '#d0412e', ver2: '#ee6a44',
    sk0: '#dd9a74', sk1: '#f6caa0', sk2: '#ffe2c2', blush: '#f19a92',
    wh: '#fbf8f0', wh1: '#dcd8e4', wh0: '#b4aec4',
    ye0: '#c98a26', ye1: '#efbd40', ye2: '#fbe07a',
    lt0: '#e8a44a', lt1: '#ffd27a', lt2: '#fff1c0',
    cu0: '#2a5a54', cu1: '#3f8274', cu2: '#62a890', cu3: '#8ccbb0',
    dk0: '#1f1a26', dk1: '#2f2836', dk2: '#4a4254',
    so0: '#4a3024', so1: '#65432e', so2: '#825a3c', so3: '#a0764e',
    pw0: '#3a6e7c', pw1: '#5a9aac', pw2: '#80bcc6', pw3: '#d4f2ee',
    fl0: '#5e3a24', fl1: '#835431', fl2: '#a06a3c', fl3: '#bb8450', fl4: '#d49e64',
    void: '#120e18'
  };
  var TREE = [C.t0, '#285e36', '#3b7c3c', '#58a046', '#8ac65c'];
  var HEDGE = ['#1c4430', '#2d6a3c', '#428c44', '#62ad4e', '#94d068'];
  var STONE = [C.st0, C.st1, C.st2, C.st3, C.st4];
  var CROP = ['#24502e', '#357a38', '#4f9e42', '#78c254', '#b4e27c'];

  // ------------------------------------------------------------------ hashing
  function h2(x, y, s) {
    var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1103515245);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }

  // ------------------------------------------------------------------ pixel buffer
  function Buf(w, h, ox, oy) {
    this.w = w; this.h = h; this.ox = ox || 0; this.oy = oy || 0;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  Buf.prototype.px = function (x, y, c, a) {
    if (!c) return;
    x = (x | 0) + this.ox; y = (y | 0) + this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var v = rgb(c), i = (y * this.w + x) * 4, d = this.d;
    var al = (a == null ? 1 : a) * v[3] / 255;
    if (al >= 0.999) { d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = 255; return; }
    var da = d[i + 3] / 255, oa = al + da * (1 - al);
    if (oa <= 0) return;
    for (var k = 0; k < 3; k++) d[i + k] = (v[k] * al + d[i + k] * da * (1 - al)) / oa;
    d[i + 3] = oa * 255;
  };
  Buf.prototype.rect = function (x, y, w, h, c, a) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.px(x + i, y + j, c, a);
  };
  Buf.prototype.hl = function (x0, x1, y, c) { for (var x = x0; x <= x1; x++) this.px(x, y, c); };
  Buf.prototype.vl = function (x, y0, y1, c) { for (var y = y0; y <= y1; y++) this.px(x, y, c); };
  Buf.prototype.alpha = function (x, y) {
    x += this.ox; y += this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  };
  Buf.prototype.get = function (x, y) {
    x += this.ox; y += this.oy;
    var i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  };
  Buf.prototype.clear = function (x, y) {
    x += this.ox; y += this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[(y * this.w + x) * 4 + 3] = 0;
  };
  Buf.prototype.ell = function (cx, cy, rx, ry, c, a) {
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c, a);
      }
  };
  Buf.prototype.mirror = function () {
    var w = this.w, d = this.d;
    for (var y = 0; y < this.h; y++) for (var x = 0; x < (w >> 1); x++) {
      var i = (y * w + x) * 4, j = (y * w + (w - 1 - x)) * 4;
      for (var k = 0; k < 4; k++) { var t = d[i + k]; d[i + k] = d[j + k]; d[j + k] = t; }
    }
  };
  // External coloured outline (selective outline: darkened hue of the neighbour, pulled to indigo)
  Buf.prototype.outline = function () {
    var w = this.w, h = this.h, d = this.d, src = new Uint8ClampedArray(d);
    var ind = rgb(C.ol);
    var nbs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4;
      if (src[i + 3] > 100) continue;
      for (var n = 0; n < 4; n++) {
        var X = x + nbs[n][0], Y = y + nbs[n][1];
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        var j = (Y * w + X) * 4;
        if (src[j + 3] > 160) {
          d[i] = src[j] * 0.3 + ind[0] * 0.7 - 6; d[i + 1] = src[j + 1] * 0.3 + ind[1] * 0.7 - 6;
          d[i + 2] = src[j + 2] * 0.3 + ind[2] * 0.7; d[i + 3] = 255;
          break;
        }
      }
    }
  };
  Buf.prototype.canvas = function () {
    var cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    var x = cv.getContext('2d');
    x.putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return cv;
  };
  function spr(b, x, y, rows, pal, flip) {
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j];
      for (var i = 0; i < r.length; i++) {
        var k = r[i];
        if (k === '.' || k === ' ') continue;
        var c = pal[k];
        if (c) b.px(flip ? x + r.length - 1 - i : x + i, y + j, c);
      }
    }
  }

  // ------------------------------------------------------------------ cache
  var CACHE = {};
  function cached(key, w, h, ox, oy, build) {
    var e = CACHE[key];
    if (e) return e;
    var b = new Buf(w, h, ox, oy);
    build(b);
    e = { c: b.canvas(), ox: ox, oy: oy };
    CACHE[key] = e;
    return e;
  }
  function tileC(key, build) { return cached(key, 16, 16, 0, 0, build); }

  // ------------------------------------------------------------------ blob renderer
  // Shaded clusters of circles (tree canopies, hedges, rocks, crops). Later blobs are in front.
  function blobs(b, x0, y0, x1, y1, list, pal, opt) {
    opt = opt || {};
    var lx = -0.62, ly = -0.78;
    function owner(x, y) {
      for (var k = list.length - 1; k >= 0; k--) {
        var o = list[k], dx = x + 0.5 - o[0], dy = y + 0.5 - o[1];
        if (dx * dx + dy * dy <= o[2] * o[2]) return o;
      }
      return null;
    }
    var ins = function (x, y) { return !!owner(x, y); };
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var o = owner(x, y);
      if (!o) continue;
      var nx = (x + 0.5 - o[0]) / o[2], ny = (y + 0.5 - o[1]) / o[2];
      var l = (nx * lx + ny * ly) * 0.9 - Math.max(0, Math.sqrt(nx * nx + ny * ny) - 0.72) * 0.9 + (opt.bias || 0) + (o[3] || 0);
      var ci;
      if (l > 0.6) ci = 4; else if (l > 0.2) ci = 3; else if (l > -0.36) ci = 2; else ci = 1;
      // light ordered dither on band edges (sparingly)
      if (opt.dither && ((x + y) & 1) === 0 && ci === 2 && l > 0.08) ci = 3;
      if (opt.nohi && ci === 4) ci = 3;
      // front blob casts a thin shade line onto the blob behind (reads as separate clumps)
      var above = owner(x, y - 1);
      if (above && above !== o && list.indexOf(above) > list.indexOf(o) && ci > 1) ci -= 1;
      var col = pal[ci];
      // outline where the shape ends
      var up = ins(x, y - 1), dn = ins(x, y + 1), lf = ins(x - 1, y), rt = ins(x + 1, y);
      if (!dn || !rt) col = pal[0];
      else if (!lf || !up) col = opt.softTop ? pal[1] : pal[0];
      if (x >= x0 && x <= x1) b.px(x, y, col);
    }
  }

  // ------------------------------------------------------------------ neighbour helpers
  var N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var N8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
  function mask(nb, f, n) {
    var m = 0, L = n === 8 ? N8 : N4;
    for (var i = 0; i < L.length; i++) if (f(nb(L[i][0], L[i][1]))) m |= 1 << i;
    return m;
  }
  function has(s, c) { return !!c && s.indexOf(c) >= 0; }
  function runLen(nb, code, dx) { var n = 0; while (n < 12 && nb(dx * (n + 1), 0) === code) n++; return n; }

  function variant(nb, tx, ty, salt) {
    var r;
    if (tx != null && ty != null) r = h2(tx, ty, salt);
    else {
      var s = salt | 0, pts = [[1, 0], [0, 1], [-1, 0], [0, -1], [2, 0], [0, 2], [-2, 0], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1], [3, 0], [0, 3], [-3, 0], [0, -3]];
      for (var i = 0; i < pts.length; i++) {
        var c = nb(pts[i][0], pts[i][1]);
        s = (Math.imul(s, 31) + (c ? c.charCodeAt(0) : 5) * (i + 7)) | 0;
      }
      r = h2(s, 17, salt);
    }
    return r;
  }
  function grassVar(r) { return r < 0.42 ? 0 : r < 0.62 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 : 4; }

  // ------------------------------------------------------------------ ground layers
  function tuft(b, x, y, dark, light) {
    b.px(x, y, dark); b.px(x + 2, y, dark); b.px(x + 1, y + 1, dark);
    b.px(x + 1, y, light || C.g3);
  }
  var TUFTS = [
    [[3, 4], [11, 11]],
    [[10, 3], [2, 10], [12, 13]],
    [[6, 8]],
    [[12, 4], [4, 12]],
    [[2, 3], [9, 9]]
  ];
  function grassBase(b, v) {
    b.rect(0, 0, 16, 16, C.g2);
    // soft large-scale light patches (seamless: kept inside the tile, away from borders)
    if (v === 1) { b.rect(5, 6, 3, 1, C.g3); b.rect(4, 7, 5, 1, C.g3); b.px(6, 5, C.g3); }
    if (v === 3) { b.px(9, 8, C.g1); b.px(10, 8, C.g1); b.px(9, 7, C.st2); b.px(10, 7, C.st3); b.px(11, 8, C.g1); }
    if (v === 4) { b.px(7, 12, C.g4); b.px(6, 13, C.g3); b.px(8, 13, C.g3); }
    var t = TUFTS[v % TUFTS.length];
    for (var i = 0; i < t.length; i++) tuft(b, t[i][0], t[i][1], C.g1, C.g3);
  }
  var PV = ['#8a8494', '#aca6b0', '#c4bec4', '#b6b0b8'];
  function paveBase(b, v) {
    // two courses of offset slabs
    b.rect(0, 0, 16, 16, PV[1]);
    for (var row = 0; row < 2; row++) {
      var y0 = row * 8, off = row ? 4 : 0;
      for (var k = -1; k < 3; k++) {
        var x0 = k * 8 + off;
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          var X = x0 + x, Y = y0 + y;
          if (X < 0 || X > 15) continue;
          var c = PV[1];
          if (y === 7 || x === 7) c = PV[0];
          else if (y === 0 || x === 0) c = PV[2];
          else if ((x * 3 + y * 5 + k * 7 + row) % 11 === 0) c = PV[3];
          b.px(X, Y, c);
        }
      }
    }
    if (v === 1) { b.px(4, 3, C.st1); b.px(5, 4, C.st1); b.px(5, 3, C.st3); }
    if (v === 2) { b.px(12, 12, C.g1); b.px(13, 12, C.g3); b.px(12, 11, C.g3); }
    if (v === 3) { b.px(2, 11, mix(C.st2, C.g2, 0.5)); b.px(3, 11, mix(C.st2, C.g2, 0.35)); }
  }
  function floorBase(b) {
    for (var y = 0; y < 16; y++) {
      var row = y >> 2, ry = y & 3;
      var seam = (row * 7 + 3) % 16;
      for (var x = 0; x < 16; x++) {
        var c = (row & 1) ? C.fl2 : mix(C.fl2, C.fl3, 0.35);
        if (ry === 0) c = mix(c, C.fl4, 0.45);
        if (ry === 3) c = C.fl0;
        if (x === seam && ry !== 3) c = C.fl0;
        if (x === seam + 1 && ry !== 3) c = mix(c, C.fl4, 0.4);
        b.px(x, y, c);
      }
    }
    b.px(4, 6, C.fl1); b.px(12, 9, C.fl1); b.px(9, 13, C.fl1);
  }
  function dirtBase(b) {
    b.rect(0, 0, 16, 16, C.d2);
    b.px(3, 4, C.d1); b.px(11, 10, C.d1); b.px(12, 10, C.d3); b.px(6, 12, C.d3); b.px(7, 13, C.d1);
  }
  function groundType(nb, def) {
    var pave = 0, floor = 0, dirt = 0;
    for (var i = 0; i < 4; i++) {
      var c = nb(N4[i][0], N4[i][1]);
      if (has(':sIJlA', c)) pave++;
      if (has('otuyzmkq', c)) floor++;
      if (c === 'P') dirt++;
    }
    if (floor) return 'f';
    if (pave) return 'p';
    return def || 'g';
  }
  function ground(b, type, v) {
    if (type === 'p') paveBase(b, v % 4);
    else if (type === 'f') floorBase(b);
    else if (type === 'd') dirtBase(b);
    else grassBase(b, v);
  }
  function shadowEll(b, cx, cy, rx, ry, a) { b.ell(cx, cy, rx, ry, '#1a1430', a == null ? 0.28 : a); }

  // ================================================================== TILES
  var TILES = {};
  var OVER = {};

  // ---- '.' short grass
  TILES['.'] = function (nb, t, tx, ty) {
    var v = grassVar(variant(nb, tx, ty, 11));
    return tileC('.' + v, function (b) { grassBase(b, v); });
  };

  // ---- ',' flowers
  function flower(b, x, y, petal, center, sway) {
    b.px(x, y + 2, C.g1); b.px(x, y + 1, C.g1);
    var X = x + sway;
    b.px(X - 1, y, petal); b.px(X + 1, y, petal); b.px(X, y - 1, petal); b.px(X, y + 1, mix(petal, C.g1, 0.35));
    b.px(X, y, center);
  }
  var FLOWERSETS = [
    [[4, 4, 0], [11, 7, 1], [6, 11, 2], [13, 13, 0]],
    [[3, 9, 1], [9, 3, 0], [12, 11, 2]],
    [[5, 5, 2], [12, 4, 0], [8, 12, 1], [2, 13, 0]]
  ];
  var PETALS = [[C.wh, C.ye1], [C.ye1, C.lt0], ['#f28aa6', C.wh]];
  TILES[','] = function (nb, t, tx, ty) {
    var r = variant(nb, tx, ty, 23), v = Math.floor(r * 3), f = Math.floor(t * 1.6) % 2;
    return tileC(',' + v + f, function (b) {
      grassBase(b, v === 1 ? 2 : 0);
      var s = FLOWERSETS[v];
      for (var i = 0; i < s.length; i++) {
        var p = PETALS[s[i][2]];
        b.px(s[i][0] + 1, s[i][1] + 2, C.g3);
        flower(b, s[i][0], s[i][1], p[0], p[1], (f && (i & 1)) ? 1 : 0);
      }
    });
  };

  // ---- '"' tall grass
  var SPIKE = [
    '..a....',
    '..ab...',
    '.aab.a.',
    'a.abcab',
    'aabbcbc',
    'abbcbcd',
    'bbccccd',
    'bcccdd.'
  ];
  var SPIKEPAL = { a: C.t4, b: C.t3, c: C.t2, d: C.t1 };
  function spike(b, x, y, sway, clipTop) {
    for (var j = 0; j < SPIKE.length; j++) {
      var r = SPIKE[j], s = j < 3 ? sway : 0;
      for (var i = 0; i < r.length; i++) {
        var k = r[i];
        if (k === '.') continue;
        if (clipTop != null && y + j < clipTop) continue;
        b.px(x + i + s, y + j, SPIKEPAL[k]);
      }
    }
  }
  var SWAY = [0, 1, 0, -1];
  function tallRow(b, y, xs, sw) { for (var i = 0; i < xs.length; i++) spike(b, xs[i], y, sw); }
  TILES['"'] = function (nb, t) {
    var f = Math.floor(t * 2.2) % 4, sw = SWAY[f];
    var top = nb(0, -1) !== '"';
    var key = '"' + f + (top ? 't' : '');
    return cached(key, 16, top ? 19 : 16, 0, top ? 3 : 0, function (b) {
      b.rect(0, 0, 16, 16, C.t1);
      b.px(3, 6, C.t0); b.px(11, 3, C.t0); b.px(7, 12, C.t0); b.px(14, 14, C.t0);
      if (top) { tallRow(b, -3, [-1, 5, 10], sw); }
      tallRow(b, -1, [-3, 5, 13], sw);
      tallRow(b, 3, [1, 9], sw);
      tallRow(b, 8, [-3, 5, 13], sw);
    });
  };
  OVER['"'] = function (nb, t) {
    var f = Math.floor(t * 2.2) % 4, sw = SWAY[f];
    return tileC('"o' + f, function (b) {
      for (var i = 0, xs = [-3, 5, 13]; i < xs.length; i++) spike(b, xs[i], 8, sw);
    });
  };

  // ---- 'P' dirt path (autotiled soft edges)
  function pathLike(c) { return c === '' || c == null || has('PbdzsI:J', c); }
  var WOB = [0, 1, 1, 0, 0, 1, 2, 1, 0, 0, 1, 1, 0, 1, 1, 0];
  TILES.P = function (nb) {
    var m = mask(nb, pathLike, 8);
    return tileC('P' + m, function (b) {
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8, NE = m & 16, SE = m & 32, SW = m & 64, NW = m & 128;
      var g = [];
      function isG(x, y) {
        if (!N && y < 2 + WOB[x]) return true;
        if (!S && y > 13 - WOB[(x + 5) & 15]) return true;
        if (!W && x < 2 + WOB[(y + 3) & 15]) return true;
        if (!E && x > 13 - WOB[(y + 9) & 15]) return true;
        if (N && W && !NW && x + y < 3) return true;
        if (N && E && !NE && (15 - x) + y < 3) return true;
        if (S && W && !SW && x + (15 - y) < 3) return true;
        if (S && E && !SE && (15 - x) + (15 - y) < 3) return true;
        if (!N && !W) { var dx = x - 5.5, dy = y - 5.5; if (x < 6 && y < 6 && dx * dx + dy * dy > 20) return true; }
        if (!N && !E) { dx = x - 9.5; dy = y - 5.5; if (x > 9 && y < 6 && dx * dx + dy * dy > 20) return true; }
        if (!S && !W) { dx = x - 5.5; dy = y - 9.5; if (x < 6 && y > 9 && dx * dx + dy * dy > 20) return true; }
        if (!S && !E) { dx = x - 9.5; dy = y - 9.5; if (x > 9 && y > 9 && dx * dx + dy * dy > 20) return true; }
        return false;
      }
      for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) g[y * 16 + x] = isG(x, y);
      var G = function (x, y) { if (x < 0 || y < 0 || x > 15 || y > 15) return false; return g[y * 16 + x]; };
      for (y = 0; y < 16; y++) for (x = 0; x < 16; x++) {
        var c;
        if (G(x, y)) {
          c = C.g2;
          if (G(x, y + 1) === false && y < 15 || (x < 15 && !G(x + 1, y)) || (x > 0 && !G(x - 1, y))) c = C.g3;
          if (y > 0 && !G(x, y - 1) && !(y === 0)) c = C.g1;
        } else {
          c = C.d2;
          if ((y > 0 && G(x, y - 1)) || (x > 0 && G(x - 1, y))) c = C.d1;
          else if ((y > 1 && G(x, y - 2))) c = mix(C.d2, C.d1, 0.5);
          else if ((y < 15 && G(x, y + 1)) || (x < 15 && G(x + 1, y))) c = C.d3;
        }
        b.px(x, y, c);
      }
      // pebbles
      var pts = [[5, 6], [11, 10], [8, 3], [3, 12]];
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!G(p[0], p[1]) && !G(p[0] + 1, p[1] + 1) && !G(p[0] - 1, p[1] - 1)) {
          if (i & 1) { b.px(p[0], p[1], C.d3); b.px(p[0], p[1] + 1, C.d1); }
          else { b.px(p[0], p[1], C.d1); }
        }
      }
    });
  };

  // ---- 'T' tree: ground + trunk in drawTile, full canopy in overlay
  var TREEBLOBS = [
    [8, 2, 8.6, -0.9],
    [5, -3.8, 4], [11, -3.8, 4], [8, -4.6, 3.4],
    [2, 0.5, 4], [8, -0.5, 4.5], [14, 0.5, 4],
    [4.5, 4, 4.5], [11.5, 4, 4.5],
    [1.5, 7.2, 3.6], [8, 7.5, 4.5], [14.5, 7.2, 3.6]
  ];
  function shifted(list, dx, dy) { return list.map(function (o) { return [o[0] + dx, o[1] + dy, o[2]]; }); }
  TILES.T = function (nb, t, tx, ty) {
    var below = nb(0, 1) === 'T', gt = groundType(nb, 'g');
    var v = grassVar(variant(nb, tx, ty, 11));
    return tileC('T' + (below ? 1 : 0) + gt + v, function (b) {
      ground(b, gt, v);
      shadowEll(b, 8, 13, 8, 3.2, 0.32);
      if (!below) {
        // trunk with root flare
        b.rect(6, 10, 4, 5, C.wd1);
        b.vl(6, 10, 14, C.wd2); b.vl(9, 10, 14, C.wd0);
        b.px(7, 12, C.wd0); b.px(8, 11, C.wd2);
        b.px(5, 14, C.wd1); b.px(10, 14, C.wd0); b.px(4, 15, C.wd0); b.px(5, 15, C.wd0); b.px(10, 15, C.wd0); b.px(11, 15, C.wd0);
        b.hl(6, 9, 15, C.wd0);
      }
    });
  };
  OVER.T = function (nb) {
    var L = nb(-1, 0) === 'T', R = nb(1, 0) === 'T', D = nb(0, 1) === 'T';
    var key = 'To' + (L ? 1 : 0) + (R ? 1 : 0) + (D ? 1 : 0);
    return cached(key, 22, 21, 3, 8, function (b) {
      var list = TREEBLOBS.slice();
      if (L) list = shifted(TREEBLOBS, -16, 0).concat(list);
      if (R) list = shifted(TREEBLOBS, 16, 0).concat(list);
      if (D) list = list.concat([[8, 12, 6]]);
      var x0 = L ? 0 : -3, x1 = R ? 15 : 18;
      blobs(b, x0, -8, x1, 12, list, TREE, { softTop: true });
      // a few leaf-light glints (structured, not noise)
      b.px(5, -1, TREE[4]); b.px(9, -5, TREE[4]); b.px(11, 2, TREE[3]);
    });
  };

  // ---- '~' water with shoreline autotile
  function waterish(c) { return c === '' || c == null || c === '~' || c === 'b'; }
  var RIPS = [[2, 3], [10, 6], [5, 11], [13, 13]];
  function waterBase(b, f) {
    b.rect(0, 0, 16, 16, C.w1);
    // gentle darker current bands
    for (var x = 0; x < 16; x++) { b.px(x, (x >> 2) % 2 ? 8 : 9, mix(C.w1, C.w0, 0.35)); }
    for (var i = 0; i < RIPS.length; i++) {
      var p = RIPS[i], ph = (f + i) % 4, x0 = p[0], y0 = p[1];
      if (ph === 0) { b.px(x0, y0, C.w2); }
      else if (ph === 1) { b.hl(x0 - 1, x0 + 1, y0, C.w2); b.px(x0, y0, C.w3); }
      else if (ph === 2) { b.hl(x0 - 2, x0 + 2, y0, C.w2); b.px(x0 - 1, y0, C.w3); b.px(x0 + 1, y0, C.w3); }
      else { b.px(x0 - 2, y0, C.w2); b.px(x0 + 2, y0, C.w2); }
    }
    if (f === 1) b.px(7, 2, C.w4);
    if (f === 3) b.px(12, 9, C.w4);
  }
  TILES['~'] = function (nb, t) {
    var f = Math.floor(t * 3) % 4;
    var m = mask(nb, function (c) { return !waterish(c); }, 8);
    return tileC('~' + m + f, function (b) {
      waterBase(b, f);
      if (!m) return;
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
        var dN = N ? y - WOB[x] * 0.8 : 99;
        var dS = S ? 15 - y - WOB[(x + 7) & 15] * 0.6 : 99;
        var dW = W ? x - WOB[(y + 3) & 15] * 0.7 : 99;
        var dE = E ? 15 - x - WOB[(y + 11) & 15] * 0.7 : 99;
        var dC = 99;
        if ((m & 128) && !N && !W) dC = Math.min(dC, Math.hypot(x + 0.5, y + 0.5) - 0.6);
        if ((m & 16) && !N && !E) dC = Math.min(dC, Math.hypot(15.5 - x, y + 0.5) - 0.6);
        if ((m & 64) && !S && !W) dC = Math.min(dC, Math.hypot(x + 0.5, 15.5 - y) - 0.6);
        if ((m & 32) && !S && !E) dC = Math.min(dC, Math.hypot(15.5 - x, 15.5 - y) - 0.6);
        var dO = Math.min(dS, dW, dE, dC);
        var c = null;
        if (dN < 1.5 || dO < 1.5) c = C.g2;
        else if (dN < 2.5) c = C.d1;
        else if (dN < 3.5) c = C.d0;
        else if (dO < 2.5) c = C.g0;
        else if (dN < 4.5) c = C.w0;
        else if (dO < 3.5 || dN < 5.5) c = ((x + y + f) % 4) ? C.w3 : C.w2;
        if (c) b.px(x, y, c);
        // grass lip gets a light top edge / dark rim
        if (c === C.g2 && (dN < 1.5 ? dN >= 0.5 : dO >= 0.5)) b.px(x, y, C.g1);
      }
    });
  };

  // ---- 'b' bridge
  TILES.b = function (nb, t) {
    var f = Math.floor(t * 3) % 4;
    var u = nb(0, -1), d = nb(0, 1), l = nb(-1, 0), r = nb(1, 0);
    var vert;
    if (u === 'b' || d === 'b') vert = true;
    else if (l === 'b' || r === 'b') vert = false;
    else vert = !waterish(u) || !waterish(d);
    var ends = vert ? ((u !== 'b' ? 1 : 0) | (d !== 'b' ? 2 : 0)) : ((l !== 'b' ? 1 : 0) | (r !== 'b' ? 2 : 0));
    return tileC('b' + (vert ? 'v' : 'h') + ends + f, function (b) {
      waterBase(b, f);
      if (vert) {
        b.rect(1, 0, 14, 16, C.w0);
        for (var y = 0; y < 16; y++) {
          var ry = y % 4;
          var c = ry === 0 ? C.wd3 : ry === 3 ? C.wd0 : (y >> 2) & 1 ? C.wd2 : mix(C.wd2, C.wd1, 0.3);
          b.hl(2, 13, y, c);
          if (ry === 1 || ry === 2) { b.px(3, y, C.wd1); b.px(12, y, C.wd1); }
        }
        // side rails
        b.vl(1, 0, 15, C.wd0); b.vl(14, 0, 15, C.wd0); b.vl(15, 0, 15, mix(C.w1, C.w0, 0.6));
        b.vl(2, 0, 15, C.wd3); b.vl(13, 0, 15, C.wd1);
        var posts = [];
        if (ends & 1) posts.push(1);
        if (ends & 2) posts.push(12);
        for (var i = 0; i < posts.length; i++) {
          var py = posts[i];
          b.rect(0, py, 3, 3, C.wd1); b.rect(13, py, 3, 3, C.wd1);
          b.px(0, py, C.wd3); b.px(13, py, C.wd3); b.hl(0, 2, py + 2, C.wd0); b.hl(13, 15, py + 2, C.wd0);
        }
      } else {
        b.rect(0, 12, 16, 3, C.w0);
        for (var x = 0; x < 16; x++) {
          var rx = x % 4;
          var cc = rx === 0 ? C.wd3 : rx === 3 ? C.wd0 : (x >> 2) & 1 ? C.wd2 : mix(C.wd2, C.wd1, 0.3);
          b.vl(x, 3, 12, cc);
          if (rx === 1 || rx === 2) { b.px(x, 4, C.wd1); b.px(x, 11, C.wd1); }
        }
        // rails top / bottom
        b.hl(0, 15, 1, C.wd3); b.hl(0, 15, 2, C.wd1); b.hl(0, 15, 0, C.wd0);
        b.hl(0, 15, 12, C.wd2); b.hl(0, 15, 13, C.wd0);
        b.hl(0, 15, 14, mix(C.w1, C.w0, 0.7));
        var ps = [];
        if (ends & 1) ps.push(1);
        if (ends & 2) ps.push(12);
        for (i = 0; i < ps.length; i++) {
          var px0 = ps[i];
          b.rect(px0, 0, 3, 3, C.wd1); b.hl(px0, px0 + 2, 0, C.wd3);
          b.rect(px0, 11, 3, 4, C.wd1); b.hl(px0, px0 + 2, 11, C.wd3); b.hl(px0, px0 + 2, 14, C.wd0);
        }
      }
    });
  };

  // ---- 'F' fence
  TILES.F = function (nb, t, tx, ty) {
    var m = mask(nb, function (c) { return c === 'F'; }, 4);
    var gt = groundType(nb, 'g'), v = grassVar(variant(nb, tx, ty, 11));
    return tileC('F' + m + gt + v, function (b) {
      ground(b, gt, v);
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      var horiz = E || W || !(N || S);
      if (N) { b.rect(7, 0, 2, 4, C.wd2); b.vl(7, 0, 3, C.wd3); b.vl(9, 0, 5, C.g1); }
      if (S) { b.rect(7, 13, 2, 3, C.wd2); b.vl(7, 13, 15, C.wd3); b.vl(9, 13, 15, C.g1); }
      if (horiz) {
        var x0 = W ? 0 : (E ? 7 : 1), x1 = E ? 15 : (W ? 8 : 14);
        // rail shadows on the ground
        b.hl(x0, x1, 8, C.g1); b.hl(x0, x1, 12, C.g1);
        var rails = [5, 9];
        for (var i = 0; i < rails.length; i++) {
          var ry = rails[i];
          b.hl(x0, x1, ry, C.wd3); b.hl(x0, x1, ry + 1, C.wd1); b.hl(x0, x1, ry + 2, C.wd0);
        }
      }
      // post
      shadowEll(b, 9, 14.5, 3, 1.3, 0.3);
      b.rect(6, 2, 4, 12, C.wd2);
      b.vl(6, 2, 13, C.wd3); b.vl(9, 2, 13, C.wd1);
      b.hl(6, 9, 2, C.wd4); b.hl(6, 9, 3, C.wd3); b.px(9, 3, C.wd2);
      b.hl(6, 9, 13, C.wd0); b.vl(10, 3, 13, C.wd0); b.vl(5, 2, 13, C.wd0); b.hl(6, 9, 1, C.wd0);
      b.px(7, 7, C.wd1);
    });
  };

  // ---- 'R' boulder
  TILES.R = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'g'), v = grassVar(variant(nb, tx, ty, 11));
    return tileC('R' + gt + v, function (b) {
      ground(b, gt, v);
      shadowEll(b, 9, 13.5, 7, 2.5, 0.35);
      blobs(b, 0, 0, 15, 15, [[6, 8, 5.5], [10.5, 8.5, 5], [8, 11, 5.5], [5, 11.5, 3.5]], STONE, {});
      // crack + moss
      b.px(9, 9, C.st1); b.px(10, 10, C.st1); b.px(10, 11, C.st1);
      b.px(4, 5, C.g3); b.px(5, 4, C.g3); b.px(6, 4, C.g2); b.px(4, 6, C.g2);
    });
  };

  // ---- 'h' hedge (joins)
  var HEDGEBLOBS = [[4, 6, 4.2], [12, 6, 4.2], [8, 4.5, 4.2], [3.5, 10.5, 4.2], [12.5, 10.5, 4.2], [8, 11, 4.8]];
  TILES.h = function (nb, t, tx, ty) {
    var m = mask(nb, function (c) { return c === 'h'; }, 4);
    var gt = groundType(nb, 'g'), v = grassVar(variant(nb, tx, ty, 11));
    return tileC('h' + m + gt + v, function (b) {
      ground(b, gt, v);
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      var list = [];
      if (E) list.push([16, 5, 4.6], [16, 11, 4.6]);
      if (W) list.push([0, 5, 4.6], [0, 11, 4.6]);
      if (N) list.push([5, 0, 4.6], [11, 0, 4.6]);
      if (S) list.push([5, 16, 4.6], [11, 16, 4.6]);
      if (N) list = list.concat(shifted(HEDGEBLOBS, 0, -16));
      if (W) list = list.concat(shifted(HEDGEBLOBS, -16, 0));
      if (E) list = list.concat(shifted(HEDGEBLOBS, 16, 0));
      list = list.concat(HEDGEBLOBS);
      if (S) list = list.concat(shifted(HEDGEBLOBS, 0, 16));
      if (!S) shadowEll(b, 8, 15, 8, 1.6, 0.3);
      blobs(b, 0, 0, 15, 15, list, HEDGE, {});
      // tiny blossoms
      b.px(5, 7, '#f7f0f4'); b.px(11, 11, '#f7c0cf'); b.px(10, 4, '#f7f0f4');
    });
  };

  // ---- 'S' signpost
  TILES.S = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'g'), v = grassVar(variant(nb, tx, ty, 11));
    return tileC('S' + gt + v, function (b) {
      ground(b, gt, v);
      shadowEll(b, 8.5, 14.5, 4.5, 1.5, 0.3);
      b.rect(7, 9, 2, 6, C.wd1); b.px(7, 9, C.wd2); b.vl(6, 9, 14, C.wd0); b.vl(9, 9, 14, C.wd0); b.hl(7, 8, 15, C.wd0);
      b.rect(1, 2, 14, 8, C.wd0);
      b.rect(2, 3, 12, 6, C.wd2);
      b.hl(2, 13, 3, C.wd3); b.vl(2, 3, 8, C.wd3); b.hl(2, 13, 8, C.wd1); b.vl(13, 4, 8, C.wd1);
      b.hl(4, 11, 5, C.wd0); b.hl(4, 7, 7, C.wd0); b.hl(9, 10, 7, C.wd0);
      b.px(1, 2, null); b.clear(1, 2); b.clear(14, 2);
    });
  };

  // ---- 'v' vegetable field
  TILES.v = function (nb) {
    var m = mask(nb, function (c) { return c === 'v'; }, 4);
    return tileC('v' + m, function (b) {
      for (var y = 0; y < 16; y++) {
        var ry = y % 8;
        var c = ry < 1 ? C.so3 : ry < 5 ? C.so2 : ry < 6 ? C.so1 : C.so0;
        b.hl(0, 15, y, c);
      }
      // soil texture
      b.px(3, 2, C.so1); b.px(12, 3, C.so3); b.px(7, 10, C.so1); b.px(14, 11, C.so3);
      for (var row = 0; row < 2; row++) {
        var cy = row * 8 + 2.5, off = row ? 4 : 0;
        for (var k = 0; k < 3; k++) {
          var cx = k * 8 + off - 4 + 4;
          if (cx < -3 || cx > 19) continue;
          b.ell(cx + 0.5, cy + 3.6, 3, 1, C.so0, 0.5);
          blobs(b, 0, 0, 15, 15, [[cx - 1.8, cy + 1, 1.9], [cx + 2.2, cy + 1, 1.9], [cx + 0.2, cy + 0.4, 2.6]], CROP, { softTop: true });
          b.px(cx, cy - 1, CROP[4]);
        }
      }
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      if (!N) { b.hl(0, 15, 0, C.g1); }
      if (!S) { b.hl(0, 15, 15, C.so0); b.hl(0, 15, 14, C.so1); }
      if (!W) { b.vl(0, 0, 15, C.so0); }
      if (!E) { b.vl(15, 0, 15, C.so0); }
    });
  };

  // ---- 'p' rice paddy
  TILES.p = function (nb, t) {
    var f = Math.floor(t * 2) % 4;
    var m = mask(nb, function (c) { return c === 'p'; }, 8);
    return tileC('p' + m + f, function (b) {
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      b.rect(0, 0, 16, 16, C.pw1);
      b.hl(1, 4, 5, C.pw2); b.hl(9, 13, 10, C.pw2); b.hl(4, 6, 15, C.pw2); b.hl(12, 14, 0, C.pw2);
      var x;
      // shimmer
      var sh = [[3, 5], [11, 2], [7, 13], [14, 9]];
      for (var i = 0; i < sh.length; i++) {
        if ((i + f) % 4 === 0) { b.hl(sh[i][0] - 1, sh[i][0] + 1, sh[i][1], C.pw3); }
        else if ((i + f) % 4 === 1) b.px(sh[i][0], sh[i][1], C.pw2);
      }
      // rows of young rice
      for (var ry = 0; ry < 3; ry++) for (var rx = 0; rx < 4; rx++) {
        var x0 = rx * 4 + 2, y0 = ry * 5 + 2;
        b.hl(x0 - 1, x0 + 1, y0 + 3, C.pw0);
        b.px(x0 - 1, y0, C.g4); b.px(x0 + 1, y0, C.g4); b.px(x0, y0 - 1, C.g3);
        b.px(x0 - 1, y0 + 1, C.g3); b.px(x0, y0, C.g3); b.px(x0 + 1, y0 + 1, C.g2);
        b.px(x0, y0 + 1, C.g2); b.px(x0, y0 + 2, C.g1);
      }
      // raised earth levees (aze) on non-paddy sides
      for (var y = 0; y < 16; y++) for (x = 0; x < 16; x++) {
        var dn = N ? 99 : y, ds = S ? 99 : 15 - y, dw = W ? 99 : x, de = E ? 99 : 15 - x;
        if (N && W && !(m & 128)) dw = Math.min(dw, Math.max(x, y));
        if (N && E && !(m & 16)) de = Math.min(de, Math.max(15 - x, y));
        if (S && W && !(m & 64)) dw = Math.min(dw, Math.max(x, 15 - y));
        if (S && E && !(m & 32)) de = Math.min(de, Math.max(15 - x, 15 - y));
        var d = Math.min(dn, ds, dw, de);
        if (d === 0) b.px(x, y, (dn === 0 || dw === 0) ? C.g3 : C.g2);
        else if (d === 1) b.px(x, y, dn === 1 ? C.g2 : ds === 1 ? C.d1 : C.g1);
        else if (d === 2) b.px(x, y, (dn === 2 || dw === 2) ? C.d0 : C.pw2);
        else if (d === 3 && (dn === 3 || dw === 3)) b.px(x, y, C.pw0);
      }
    });
  };

  // ---- 'f' flower planter
  TILES.f = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'd'), v = grassVar(variant(nb, tx, ty, 11));
    var L = nb(-1, 0) === 'f', R = nb(1, 0) === 'f';
    return tileC('f' + gt + v + (L ? 1 : 0) + (R ? 1 : 0), function (b) {
      ground(b, gt === 'd' ? 'g' : gt, v);
      shadowEll(b, 8.5, 15, 8, 1.5, 0.3);
      var x0 = L ? 0 : 1, x1 = R ? 15 : 14;
      b.rect(x0, 9, x1 - x0 + 1, 6, C.wd2);
      b.hl(x0, x1, 9, C.wd4); b.hl(x0, x1, 10, C.wd3); b.hl(x0, x1, 14, C.wd0); b.hl(x0, x1, 12, C.wd1);
      if (!L) b.vl(x0, 9, 14, C.wd0);
      if (!R) b.vl(x1, 9, 14, C.wd0);
      b.hl(x0 + (L ? 0 : 1), x1 - (R ? 0 : 1), 8, C.so1);
      // leaves
      var fl = [[3, 5, '#e8455a', C.ye1], [8, 4, C.ye1, C.lt0], [12, 6, '#f7f3ff', C.ye1], [6, 7, '#f28ab0', C.wh], [11, 2, '#e8455a', C.ye1]];
      blobs(b, 0, 0, 15, 8, [[3, 7, 2.5], [8, 6.5, 3], [13, 7, 2.5], [5.5, 5, 2], [11, 4.5, 2]], HEDGE, { softTop: true });
      for (var i = 0; i < fl.length; i++) flower(b, fl[i][0], fl[i][1], fl[i][2], fl[i][3], 0);
    });
  };

  // ---- 'c' crates / straw bales
  function crate(b, x, y, w, h, top) {
    // top face
    b.rect(x, y, w, top, C.wd3); b.hl(x, x + w - 1, y, C.wd4);
    // front face
    b.rect(x, y + top, w, h - top, C.wd2);
    b.hl(x, x + w - 1, y + top, C.wd0);
    for (var j = y + top + 2; j < y + h - 1; j += 2) b.hl(x + 1, x + w - 2, j, C.wd1);
    b.px(x + 1, y + top + 1, C.wd4);
    b.vl(x, y, y + h - 1, C.wd0); b.vl(x + w - 1, y, y + h - 1, C.wd0);
    b.hl(x, x + w - 1, y + h - 1, C.wd0); b.hl(x, x + w - 1, y - 1, C.wd0);
    b.vl(x + 1, y + top + 1, y + h - 2, C.wd3); b.vl(x + w - 2, y + top + 1, y + h - 2, C.wd1);
  }
  function bale(b, x, y, w, h) {
    b.rect(x, y, w, h, C.ye1);
    b.rect(x, y, w, 3, C.ye2);
    for (var i = 0; i < w; i += 2) { b.px(x + i, y + 4 + (i % 4 ? 1 : 0), C.ye0); b.px(x + i + 1, y + h - 3, C.ye0); }
    b.vl(x + 3, y, y + h - 1, C.wd1); b.vl(x + w - 4, y, y + h - 1, C.wd1);
    b.vl(x, y, y + h - 1, '#8a5a1e'); b.vl(x + w - 1, y, y + h - 1, '#8a5a1e');
    b.hl(x, x + w - 1, y + h - 1, '#8a5a1e'); b.hl(x, x + w - 1, y - 1, '#8a5a1e');
    b.px(x + 2, y - 1, C.ye2); b.px(x + w - 2, y + h, C.ye1);
  }
  TILES.c = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'g'), v = grassVar(variant(nb, tx, ty, 11));
    var alt = runLen(nb, 'c', -1) % 2;
    return tileC('c' + gt + v + alt, function (b) {
      ground(b, gt, v);
      shadowEll(b, 9, 14.5, 8, 2, 0.32);
      if (!alt) {
        crate(b, 1, 8, 8, 7, 2); crate(b, 8, 8, 7, 7, 2);
        crate(b, 4, 2, 8, 7, 2);
        b.px(2, 9, C.wd4); b.px(5, 3, C.wd4);
        // stencilled marks
        b.px(4, 12, C.ver0); b.px(11, 12, C.wd0); b.px(7, 6, C.wd0); b.px(8, 6, C.wd0);
      } else {
        bale(b, 1, 5, 14, 10);
        b.px(4, 14, C.ye2); b.px(12, 4, C.ye2);
      }
    });
  };

  // ---- 'W' well
  TILES.W = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'g'), v = grassVar(variant(nb, tx, ty, 11));
    return tileC('W' + gt + v, function (b) {
      ground(b, gt, v);
      shadowEll(b, 9, 14, 8, 2.5, 0.35);
      // stone cylinder
      b.ell(8, 12, 7, 3.4, C.st1);
      b.rect(1, 7, 14, 5, C.st2);
      for (var y = 7; y < 13; y++) for (var x = 1; x < 15; x++) {
        var row = (y - 7) >> 1, bx = (x + row * 2) % 5;
        if ((y - 7) % 2 === 1) b.px(x, y, C.st1);
        else if (bx === 0) b.px(x, y, C.st1);
        else if (bx === 1) b.px(x, y, C.st3);
      }
      b.ell(8, 12.5, 7, 3, C.st1); b.rect(1, 11, 14, 2, C.st2);
      b.hl(1, 14, 11, C.st1); b.hl(2, 13, 13, C.st1); b.hl(3, 12, 14, C.st0);
      b.vl(1, 7, 12, C.st0); b.vl(14, 7, 12, C.st0);
      // rim & water
      b.ell(8, 7, 7, 3, C.st3);
      b.ell(8, 7, 7, 3, C.st4, 0.4);
      b.ell(8, 7.3, 5, 2, '#1c2842');
      b.hl(6, 8, 7, C.w1); b.px(7, 6, C.w3);
      b.hl(3, 12, 4, C.st0); b.px(2, 5, C.st0); b.px(13, 5, C.st0);
      // posts and little roof
      b.vl(2, 0, 7, C.wd1); b.vl(13, 0, 7, C.wd0); b.vl(3, 1, 7, C.wd0);
      b.rect(0, 0, 16, 2, C.wd2); b.hl(0, 15, 0, C.wd3); b.hl(0, 15, 2, C.wd0);
      b.hl(4, 11, 3, C.wd0);
      // rope + bucket
      b.vl(8, 3, 5, C.pl1);
      b.rect(10, 5, 3, 2, C.wd2); b.hl(10, 12, 7, C.wd0); b.hl(10, 12, 5, C.wd3);
    });
  };

  // ---- roofs 'r' 'g'
  var ROOFPAL = {
    r: { c: ['#6c2a2e', '#a53c34', '#c8563a', '#e4784a', '#f6a066'], ridge: ['#4a2430', '#7a3a3a', '#9a4a42'] },
    g: { c: ['#2c3552', '#445376', '#5d6f96', '#7e92b6', '#a8b8d2'], ridge: ['#232a40', '#38415e', '#4c587a'] },
    a: { c: [C.cu0, C.cu1, C.cu2, C.cu3, '#b4e2cc'], ridge: [C.dk0, C.dk1, C.dk2] }
  };
  function roofTile(b, code, m) {
    var P = ROOFPAL[code], c = P.c, R = P.ridge;
    var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
    var copper = code === 'a';
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var col;
      if (copper) {
        var cx = x % 3;
        col = cx === 0 ? c[3] : cx === 1 ? c[2] : c[1];
        if (y % 8 === 7) col = c[1];
      } else {
        var rx = x % 4, ry = y % 5;
        col = rx === 0 ? c[3] : rx === 3 ? c[0] : (rx === 1 ? c[3] : c[2]);
        if (rx === 1 && ry !== 0) col = c[2];
        if (ry === 4 && (rx === 1 || rx === 2)) col = c[1];
        if (ry === 0 && rx === 1) col = c[4];
      }
      b.px(x, y, col);
    }
    if (!N) b.rect(0, 4, 16, 5, '#fff4d8', 0.1);
    if (!S) b.rect(0, 6, 16, 5, '#1a1430', 0.08);
    if (!N) {
      b.hl(0, 15, 0, C.ol); b.hl(0, 15, 1, R[2]); b.hl(0, 15, 2, R[1]); b.hl(0, 15, 3, R[0]); b.hl(0, 15, 4, c[0]);
      for (var i = 1; i < 16; i += 4) b.px(i, 1, mix(R[2], '#ffffff', 0.25));
      if (copper) {
        for (i = 2; i < 16; i += 6) { b.px(i, 2, C.ye1); b.px(i + 1, 2, C.ye0); }
        // katsuogi logs resting on the ridge
        for (i = 3; i < 16; i += 8) {
          b.rect(i, -3, 4, 3, C.dk1); b.hl(i, i + 3, -3, C.dk2); b.hl(i, i + 3, -1, C.dk0);
          b.vl(i, -3, -1, C.ye1); b.vl(i + 3, -3, -1, C.ye0);
        }
      }
    }
    if (!S) {
      b.hl(0, 15, 11, c[0]);
      for (x = 0; x < 16; x++) {
        var q = copper ? x % 4 : x % 4;
        if (copper) {
          b.px(x, 12, C.wd1); b.px(x, 13, C.wd0); b.px(x, 14, C.wd0);
          if (q === 1) { b.px(x, 13, C.ye1); }
        } else {
          b.px(x, 12, q === 3 ? c[0] : q === 0 ? c[4] : c[3]);
          b.px(x, 13, q === 3 ? c[0] : c[2]);
          b.px(x, 14, q === 3 ? c[0] : c[1]);
        }
      }
      b.hl(0, 15, 15, C.ol);
    }
    if (!W) {
      for (y = 0; y < 16; y++) { b.px(0, y, C.ol); if (y > 0 && y < 15) b.px(1, y, (N || y > 4) ? c[4] : R[2]); }
      if (!S) { b.px(1, 12, C.ol); b.px(0, 11, C.ol); b.px(1, 11, c[4]); }
    }
    if (!E) {
      for (y = 0; y < 16; y++) { b.px(15, y, C.ol); if (y > 0 && y < 15) b.px(14, y, (N || y > 4) ? c[0] : R[0]); }
    }
  }
  function roofDraw(code) {
    return function (nb) {
      var m = mask(nb, function (c) { return c === code; }, 4);
      var ext = code === 'a' && !(m & 1) ? 3 : 0;
      return cached(code + 'R' + m, 16, 16 + ext, 0, ext, function (b) { roofTile(b, code, m); });
    };
  }
  TILES.r = roofDraw('r');
  TILES.g = roofDraw('g');
  TILES.a = roofDraw('a');

  // ---- walls 'w','n','d'
  function wallish(c) { return has('wnd', c); }
  function wallTile(b, nb) {
    var upW = wallish(nb(0, -1)), dnW = wallish(nb(0, 1));
    var W = wallish(nb(-1, 0)), E = wallish(nb(1, 0));
    var lower = !dnW;
    b.rect(0, 0, 16, 16, C.pl2);
    // plaster texture
    b.px(4, 5, C.pl1); b.px(11, 7, C.pl1); b.px(8, 3, mix(C.pl2, C.pl1, 0.5));
    if (!upW) {
      b.hl(0, 15, 0, C.wd0); b.hl(0, 15, 1, C.wd1); b.hl(0, 15, 2, C.wd2); b.hl(0, 15, 3, C.wd0);
      b.hl(0, 15, 4, C.pl0); b.hl(0, 15, 5, C.pl1);
    }
    if (lower) {
      b.hl(0, 15, 8, C.wd3); b.hl(0, 15, 9, C.wd1);
      for (var y = 10; y < 15; y++) for (var x = 0; x < 16; x++) {
        var c = x % 4 === 3 ? C.wd0 : x % 4 === 0 ? C.wd2 : C.wd1;
        if (y === 10) c = x % 4 === 3 ? C.wd0 : C.wd0;
        b.px(x, y, c);
      }
      b.hl(0, 15, 10, C.dk1);
      b.hl(0, 15, 15, C.st1); b.px(3, 15, C.st2); b.px(10, 15, C.st2);
    }
    if (!W) { b.vl(0, 0, 15, C.wd0); b.vl(1, 0, lower ? 14 : 15, C.wd2); }
    if (!E) { b.vl(15, 0, 15, C.wd0); b.vl(14, 0, lower ? 14 : 15, C.wd1); }
    return { top: !upW, lower: lower, W: W, E: E };
  }
  function wallKey(nb) { return (wallish(nb(0, -1)) ? 1 : 0) + '' + (wallish(nb(0, 1)) ? 1 : 0) + (wallish(nb(-1, 0)) ? 1 : 0) + (wallish(nb(1, 0)) ? 1 : 0); }
  TILES.w = function (nb) { return tileC('w' + wallKey(nb), function (b) { wallTile(b, nb); }); };
  TILES.n = function (nb, t) {
    var k = wallKey(nb);
    return tileC('n' + k, function (b) {
      var s = wallTile(b, nb);
      var y0 = s.top ? 5 : 2;
      // frame
      b.rect(3, y0, 10, 8, C.wd0);
      // warm lit shoji
      b.rect(4, y0 + 1, 8, 6, C.lt1);
      b.rect(4, y0 + 1, 4, 3, C.lt2);
      b.px(4, y0 + 1, '#ffffff');
      b.rect(8, y0 + 4, 4, 3, C.lt0);
      b.vl(7, y0 + 1, y0 + 6, C.wd2); b.vl(8, y0 + 1, y0 + 6, C.wd1);
      b.hl(4, 11, y0 + 3, C.wd2);
      // sill
      b.hl(2, 13, y0 + 8, C.wd3); b.hl(2, 13, y0 + 9, C.wd0);
      b.px(2, y0 + 8, C.wd2);
    });
  };
  TILES.d = function (nb) {
    var k = wallKey(nb);
    return tileC('d' + k, function (b) {
      var s = wallTile(b, nb);
      var y0 = s.top ? 4 : 1;
      b.rect(2, y0, 12, 16 - y0, C.wd0);
      b.rect(3, y0 + 1, 10, 15 - y0, '#2a1c22');
      // warm interior glow at floor
      b.rect(4, 12, 8, 3, '#4e3226'); b.hl(5, 10, 14, '#7a4a2e');
      // noren curtain (indigo, two panels, white crest)
      var ny = y0 + 1, nh = 7;
      b.rect(3, ny, 10, nh, '#34467e');
      b.hl(3, 12, ny, '#4a60a0'); b.vl(3, ny, ny + nh - 1, '#4a60a0');
      b.vl(7, ny + 2, ny + nh - 1, '#1e2a52'); b.vl(8, ny + 2, ny + nh - 1, '#1e2a52');
      b.hl(3, 12, ny + nh - 1, '#26335e');
      b.px(4, ny + nh, '#26335e'); b.px(11, ny + nh, '#26335e');
      // crest circle
      b.px(10, ny + 2, C.wh); b.px(11, ny + 3, C.wh); b.px(10, ny + 4, C.wh); b.px(9, ny + 3, C.wh);
      b.px(5, ny + 3, C.wh); b.px(5, ny + 4, C.wh1);
      b.hl(2, 13, y0 - 1 < 0 ? 0 : y0, C.wd0);
      // threshold stone
      b.hl(2, 13, 15, C.st2); b.hl(3, 12, 15, C.st3);
    });
  };

  // ---- ':' stone pavement
  TILES[':'] = function (nb, t, tx, ty) {
    var v = Math.floor(variant(nb, tx, ty, 31) * 4);
    var m = mask(nb, function (c) { return c === '' || has(':sIJlAOa', c); }, 4);
    return tileC(':' + v + m, function (b) {
      paveBase(b, v);
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      if (!N) { b.hl(0, 15, 0, C.st1); b.px(3, 0, C.g3); b.px(11, 0, C.g3); }
      if (!S) { b.hl(0, 15, 15, C.st0); b.hl(0, 15, 14, C.st1); }
      if (!W) { b.vl(0, 0, 15, C.st1); b.px(0, 6, C.g3); }
      if (!E) { b.vl(15, 0, 15, C.st0); }
    });
  };

  // ---- 's' stone steps
  TILES.s = function (nb) {
    var W = nb(-1, 0) === 's', E = nb(1, 0) === 's', N = nb(0, -1) === 's';
    return tileC('s' + (W ? 1 : 0) + (E ? 1 : 0) + (N ? 1 : 0), function (b) {
      for (var y = 0; y < 16; y++) {
        var ry = y % 8, c;
        if (ry === 0) c = C.st4; else if (ry < 4) c = C.st3; else if (ry === 4) c = C.st2;
        else if (ry === 5) c = C.st1; else if (ry === 6) c = C.st1; else c = C.st0;
        b.hl(0, 15, y, c);
      }
      // slab joints on treads
      for (var k = 0; k < 2; k++) {
        var jx = k ? 10 : 5;
        b.vl(jx, k * 8 + 1, k * 8 + 4, C.st2);
        b.px(jx + 1, k * 8 + 1, C.st4);
      }
      b.px(3, 2, C.st2); b.px(12, 10, C.st2);
      if (!W) { b.vl(0, 0, 15, C.st0); b.vl(1, 0, 15, C.st1); b.px(1, 1, C.g3); b.px(1, 9, C.g3); b.px(2, 9, C.g2); }
      if (!E) { b.vl(15, 0, 15, C.st0); b.vl(14, 0, 15, C.st1); b.px(14, 5, C.g2); }
    });
  };

  // ---- 'I' torii pillar
  function pillar(b, y0, y1) {
    b.rect(5, y0, 6, y1 - y0 + 1, C.ver1);
    b.vl(5, y0, y1, C.ver0); b.vl(6, y0, y1, C.ver2); b.vl(9, y0, y1, mix(C.ver1, C.ver0, 0.5)); b.vl(10, y0, y1, C.ver0);
  }
  TILES.I = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'p'), v = Math.floor(variant(nb, tx, ty, 31) * 4);
    return tileC('I' + gt + v, function (b) {
      ground(b, gt, gt === 'g' ? grassVar(v / 4) : v);
      shadowEll(b, 10, 14.5, 5, 1.8, 0.35);
      pillar(b, 0, 13);
      // black base (kamaki)
      b.rect(4, 12, 8, 4, C.dk1); b.hl(4, 11, 12, C.dk2); b.vl(4, 12, 15, C.dk2); b.hl(4, 11, 15, C.dk0); b.vl(11, 12, 15, C.dk0);
      b.px(6, 2, mix(C.ver2, '#ffffff', 0.3));
    });
  };

  // ---- 'J' torii top beam (transparent background; drawn in both passes)
  function toriiBeam(nb) {
    var L = nb(-1, 0) === 'J', R = nb(1, 0) === 'J';
    var P = nb(0, 1) === 'I';
    var ln = runLen(nb, 'J', -1), rn = runLen(nb, 'J', 1);
    var cx = 8 + (rn - ln) * 8; // centre of the whole gate in tile-local coords
    var key = 'J' + (L ? 1 : 0) + (R ? 1 : 0) + (P ? 1 : 0) + '_' + cx;
    return cached(key, 24, 18, 4, 2, function (b) {
      var x0 = L ? 0 : -3, x1 = R ? 15 : 18;
      if (P) {
        pillar(b, 7, 15);
        b.hl(5, 10, 13, C.ver0); b.hl(6, 9, 13, mix(C.ver1, C.ver0, 0.5));
      }
      // nuki (tie beam) – through the pillars, stubs beyond
      var nx0 = L ? 0 : 1, nx1 = R ? 15 : 14;
      b.hl(nx0, nx1, 10, C.ver2); b.hl(nx0, nx1, 11, C.ver1); b.hl(nx0, nx1, 12, C.ver0);
      if (!L) { b.vl(nx0, 10, 12, C.ver0); b.px(nx0 + 1, 10, C.ver1); }
      if (!R) b.vl(nx1, 10, 12, C.ver0);
      // plaque (gakuzuka) at the centre of the gate
      if (Math.abs(cx - 8) <= 12) {
        b.rect(cx - 3, 6, 6, 5, '#d9a441'); b.rect(cx - 2, 7, 4, 3, C.dk1);
        b.px(cx - 1, 8, C.ye2); b.px(cx, 7, C.ye1); b.px(cx, 9, C.ye1);
        b.hl(cx - 3, cx + 2, 6, C.ye2);
      }
      // shimaki (vermilion under-beam)
      var sx0 = L ? 0 : -1, sx1 = R ? 15 : 16;
      b.hl(sx0, sx1, 4, C.ver1); b.hl(sx0, sx1, 5, C.ver1); b.hl(sx0, sx1, 6, C.ver0);
      // kasagi (black top beam) with upswept ends
      for (var x = x0; x <= x1; x++) {
        var lift = 0;
        if (!L && x < 0) lift = x === -3 ? 2 : 1;
        if (!R && x > 15) lift = x === 18 ? 2 : 1;
        var y = 0 - lift;
        b.px(x, y, C.dk2);
        b.px(x, y + 1, C.dk1); b.px(x, y + 2, C.dk1);
        b.px(x, y + 3, C.dk0);
        if (lift) b.px(x, y + 4, C.dk0);
      }
      for (x = x0 + 2; x <= x1 - 1; x += 6) b.px(x, 0, '#6a6278');
    });
  }
  TILES.J = toriiBeam;
  OVER.J = toriiBeam;

  // ---- 'l' stone lantern
  var LANTERN = [
    '......oo........',
    '.....o44o.......',
    '....oo33ooo.....',
    '..oo4433322oo...',
    '.o443332221100o.',
    '..oo1111111oo...',
    '....o3LLL2o.....',
    '....o3LYL1o.....',
    '....o2LLL1o.....',
    '...oo44332oo....',
    '...o3332211o....',
    '....oo321oo.....',
    '......321o......',
    '....o432211o....',
    '...o44333211o...',
    '...oooooooooo...'
  ];
  TILES.l = function (nb, t, tx, ty) {
    var gt = groundType(nb, 'p'), v = Math.floor(variant(nb, tx, ty, 31) * 4);
    return tileC('l' + gt + v, function (b) {
      ground(b, gt, gt === 'g' ? grassVar(v / 4) : v);
      shadowEll(b, 9.5, 15, 6, 1.6, 0.35);
      spr(b, 0, 0, LANTERN, { o: C.st0, '1': C.st1, '2': C.st2, '3': C.st3, '4': C.st4, L: C.lt1, Y: C.lt2 });
      b.px(3, 4, C.g3); b.px(4, 14, C.g3); b.px(5, 14, C.g2);
    });
  };

  // ---- 'A' shrine front
  TILES.A = function (nb) {
    var L = nb(-1, 0) === 'A', R = nb(1, 0) === 'A';
    var ln = runLen(nb, 'A', -1), rn = runLen(nb, 'A', 1);
    var cx = 8 + (rn - ln) * 8;
    return tileC('A' + (L ? 1 : 0) + (R ? 1 : 0) + '_' + cx, function (b) {
      // hall interior with lattice doors
      b.rect(0, 0, 16, 16, '#3a2228');
      for (var y = 3; y < 13; y++) for (var x = 0; x < 16; x++) {
        if (x % 3 === 1 || y % 3 === 0) b.px(x, y, '#8a5638');
        if (x % 3 === 1 && y % 3 === 0) b.px(x, y, '#b07a4a');
      }
      b.rect(0, 3, 16, 1, '#2a181c');
      // posts
      if (!L) { b.rect(0, 0, 3, 13, '#5a2e24'); b.vl(0, 0, 12, '#3a1c1c'); b.vl(1, 0, 12, '#8a4a34'); }
      if (!R) { b.rect(13, 0, 3, 13, '#5a2e24'); b.vl(15, 0, 12, '#3a1c1c'); b.vl(13, 0, 12, '#7a3e2c'); }
      // veranda / floor
      b.hl(0, 15, 12, C.wd3); b.rect(0, 13, 16, 2, C.wd2); b.hl(0, 15, 15, C.wd0);
      for (x = 1; x < 16; x += 5) b.px(x, 14, C.wd1);
      // shimenawa rope along the top
      for (x = 0; x < 16; x++) {
        var sag = 0;
        for (var r = 0; r < 3; r++) {
          var tw = (x + r * 2) % 4;
          b.px(x, 1 + r + sag, tw < 2 ? '#e8d392' : tw === 2 ? '#c8a860' : '#8f7440');
        }
        b.px(x, 0, '#6a5430');
      }
      // shide (paper zigzag)
      var sx = 4;
      if (Math.abs(cx - sx) > 3) {
        b.px(sx, 4, C.wh); b.px(sx + 1, 4, C.wh); b.px(sx + 1, 5, C.wh); b.px(sx + 2, 5, C.wh1);
        b.px(sx, 6, C.wh); b.px(sx + 1, 6, C.wh); b.px(sx + 1, 7, C.wh); b.px(sx + 2, 7, C.wh1); b.px(sx, 8, C.wh1);
      }
      if (Math.abs(cx - 8) <= 16) {
        // bell (suzu) and its rope
        b.rect(cx - 2, 4, 4, 3, C.ye1); b.hl(cx - 1, cx, 4, C.ye2); b.hl(cx - 2, cx + 1, 6, C.ye0);
        b.px(cx - 3, 5, C.ye0); b.px(cx + 2, 5, C.ye0); b.hl(cx - 1, cx, 7, C.dk0);
        for (y = 7; y < 12; y++) { b.px(cx - 1, y, (y & 1) ? '#e84a3a' : C.wh); b.px(cx, y, (y & 1) ? C.wh : '#e84a3a'); }
        // offering box (saisen-bako)
        var bx = cx - 5;
        b.rect(bx, 10, 10, 6, C.wd1);
        b.rect(bx, 10, 10, 2, C.wd3);
        for (x = bx + 1; x < bx + 9; x += 2) b.px(x, 10, C.wd0);
        b.hl(bx, bx + 9, 12, C.wd0); b.vl(bx, 10, 15, C.wd0); b.vl(bx + 9, 10, 15, C.wd0); b.hl(bx, bx + 9, 15, C.wd0);
        b.hl(bx + 3, bx + 6, 14, C.ye1);
      }
    });
  };

  // ---- 'O' sacred tree trunk with shimenawa
  var BIGBLOBS = [[0, -7, 7], [16, -7, 7], [8, -9, 8], [2, -3, 6], [14, -3, 6], [8, -2, 7]];
  TILES.O = function (nb, t, tx, ty) {
    var W = nb(-1, 0) === 'O', E = nb(1, 0) === 'O', N = nb(0, -1) === 'O', S = nb(0, 1) === 'O';
    var gt = groundType(nb, 'p'), v = Math.floor(variant(nb, tx, ty, 31) * 4);
    return tileC('O' + (W ? 1 : 0) + (E ? 1 : 0) + (N ? 1 : 0) + (S ? 1 : 0) + gt + v, function (b) {
      ground(b, gt, gt === 'g' ? grassVar(v / 4) : v);
      if (!S) shadowEll(b, 8, 15, 9, 2, 0.35);
      var x0 = W ? 0 : 1, x1 = E ? 15 : 14;
      for (var y = 0; y < 16; y++) for (var x = x0; x <= x1; x++) {
        if (!S && y > 13 && ((x === x0 && !W) || (x === x1 && !E))) continue;
        var k = (x * 3 + (y >> 2)) % 5;
        var c = k === 0 ? '#3e2a24' : k === 1 ? '#6e4c38' : k === 2 ? '#86603f' : '#5e4030';
        if (x === x0 + 1 && !W) c = '#9c7452';
        b.px(x, y, c);
      }
      if (!W) { b.vl(x0, 0, 15, '#2e1e1c'); if (!S) { b.px(0, 15, '#2e1e1c'); b.px(0, 14, '#5e4030'); } }
      if (!E) { b.vl(x1, 0, 15, '#2e1e1c'); b.vl(x1 - 1, 0, 15, '#4a3228'); if (!S) { b.px(15, 15, '#2e1e1c'); b.px(15, 14, '#4a3228'); } }
      // moss
      b.px(4, 11, C.g1); b.px(5, 12, C.g2); b.px(11, 3, C.g1);
      if (!N) {
        // shimenawa rope around the trunk
        for (x = 0; x < 16; x++) {
          if (!W && x < x0) continue;
          if (!E && x > x1) continue;
          for (var r = 0; r < 4; r++) {
            var tw = (x + r * 2) % 5;
            b.px(x, 5 + r, tw < 2 ? '#ecd898' : tw < 4 ? '#c8a860' : '#8f7440');
          }
          b.px(x, 9, '#3a2622');
        }
        // shide
        var sp = [4, 11];
        for (var i = 0; i < sp.length; i++) {
          var sx = sp[i];
          b.px(sx, 9, C.wh); b.px(sx + 1, 9, C.wh); b.px(sx + 1, 10, C.wh); b.px(sx + 2, 10, C.wh1);
          b.px(sx, 11, C.wh); b.px(sx + 1, 11, C.wh); b.px(sx + 1, 12, C.wh1); b.px(sx + 2, 12, C.wh1);
        }
      }
    });
  };
  OVER.O = function (nb) {
    var up = nb(0, -1);
    if (up === 'O' || up === 'T') return null;
    var W = nb(-1, 0) === 'O', E = nb(1, 0) === 'O';
    return cached('Oo' + (W ? 1 : 0) + (E ? 1 : 0), 30, 20, 7, 16, function (b) {
      var list = BIGBLOBS.slice();
      if (W) list = shifted(BIGBLOBS, -16, 0).concat(list);
      if (E) list = shifted(BIGBLOBS, 16, 0).concat(list);
      blobs(b, W ? 0 : -7, -16, E ? 15 : 22, 3, list, TREE, { softTop: true });
    });
  };

  // ================================================================== interior
  TILES.o = function () { return tileC('o', floorBase); };
  TILES.x = function () { return tileC('x', function (b) { b.rect(0, 0, 16, 16, C.void); }); };
  TILES.q = function (nb) {
    var lower = nb(0, 1) !== 'q', top = nb(0, -1) !== 'q';
    return tileC('q' + (lower ? 1 : 0) + (top ? 1 : 0), function (b) {
      b.rect(0, 0, 16, 16, '#eadbb8');
      b.px(3, 4, '#dccaa4'); b.px(12, 6, '#dccaa4');
      if (top) { b.hl(0, 15, 0, C.fl0); b.hl(0, 15, 1, C.fl2); b.hl(0, 15, 2, C.fl1); b.hl(0, 15, 3, '#c9b690'); }
      // vertical timber post every tile edge
      b.vl(0, 0, 15, C.fl1); b.vl(1, 0, 15, mix('#eadbb8', C.fl1, 0.2));
      if (lower) {
        b.hl(0, 15, 7, C.fl3); b.hl(0, 15, 8, C.fl1);
        for (var y = 9; y < 15; y++) for (var x = 0; x < 16; x++) {
          var fx = x % 8, c = C.fl2;
          if (fx === 0 || y === 9) c = C.fl1;
          else if (fx === 1 || y === 10) c = C.fl3;
          else if (fx === 7 || y === 14) c = C.fl1;
          b.px(x, y, c);
        }
        b.hl(0, 15, 15, C.fl0);
      }
    });
  };
  TILES.k = function (nb) {
    var alt = runLen(nb, 'k', -1) % 2;
    var L = nb(-1, 0) === 'k', R = nb(1, 0) === 'k';
    return tileC('k' + alt + (L ? 1 : 0) + (R ? 1 : 0), function (b) {
      b.rect(0, 0, 16, 16, C.fl1);
      b.rect(0, 0, 16, 1, C.fl0);
      var shelves = [1, 6, 11];
      for (var s = 0; s < 3; s++) {
        var y0 = shelves[s];
        b.rect(1, y0, 14, 4, '#3a2418');
        b.hl(1, 14, y0 + 4, C.fl3);
        var kind = (s + alt) % 3;
        if (kind === 0) {
          // scroll ends
          for (var i = 0; i < 4; i++) {
            var sx = 2 + i * 3, sy = y0 + 1 + (i & 1);
            b.rect(sx, sy, 2, 2, C.pl2); b.px(sx, sy, C.wh); b.px(sx + 1, sy + 1, C.pl0);
            b.px(sx + 1, sy, ['#d0412e', '#3c64b4', '#4f9a48', C.ye1][i]);
          }
          b.rect(2, y0 + 3, 12, 1, C.pl1);
        } else if (kind === 1) {
          // book spines
          var cols = ['#b83a34', '#3c5aa0', C.ye0, '#4a7a44', '#7a4a8a', '#b83a34', C.pl1];
          for (i = 0; i < 12; i++) {
            var cc = cols[(i + alt * 3) % cols.length], hgt = 3 + ((i * 7 + alt) % 3 === 0 ? 0 : 1);
            if (i === 9) continue;
            b.vl(2 + i, y0 + 4 - hgt, y0 + 3, cc);
            b.px(2 + i, y0 + 4 - hgt, mix(cc, '#ffffff', 0.35));
          }
          b.px(11, y0 + 1, '#b83a34'); b.px(12, y0 + 2, '#b83a34');
        } else {
          // stacked blank talismans + jar
          b.rect(2, y0 + 2, 6, 2, C.pl2); b.hl(2, 7, y0 + 2, C.wh); b.px(4, y0 + 3, C.ver1); b.px(6, y0 + 3, C.ver1);
          b.rect(2, y0 + 1, 5, 1, C.pl1);
          b.rect(10, y0 + 1, 4, 3, '#5a78a8'); b.hl(10, 13, y0 + 1, '#8aa8d0'); b.px(10, y0 + 3, '#3a5078');
        }
      }
      if (!L) { b.vl(0, 0, 15, C.fl0); b.vl(1, 1, 15, C.fl3); }
      if (!R) { b.vl(15, 0, 15, C.fl0); b.vl(14, 1, 15, C.fl1); }
      b.hl(0, 15, 15, C.fl0);
    });
  };
  TILES.t = function (nb) {
    var L = nb(-1, 0) === 't', R = nb(1, 0) === 't';
    return tileC('t' + (L ? 1 : 0) + (R ? 1 : 0), function (b) {
      floorBase(b);
      var x0 = L ? 0 : 1, x1 = R ? 15 : 14;
      b.rect(x0, 14, x1 - x0 + 1, 2, '#1a1430', 0.3);
      // top
      b.rect(x0, 4, x1 - x0 + 1, 7, '#6a3a26');
      b.rect(x0, 4, x1 - x0 + 1, 6, '#8a4e30');
      b.hl(x0, x1, 4, '#a8643c');
      b.hl(x0, x1, 10, '#4a2618'); b.hl(x0, x1, 11, '#3a1e14');
      if (!L) { b.vl(x0, 4, 11, '#4a2618'); b.rect(x0 + 1, 12, 2, 3, '#3a1e14'); }
      if (!R) { b.vl(x1, 4, 11, '#3a1e14'); b.rect(x1 - 2, 12, 2, 3, '#3a1e14'); }
      if (!L) {
        // talisman papers
        b.rect(3, 5, 5, 4, C.wh); b.hl(3, 7, 8, C.wh1); b.vl(5, 6, 7, C.ver1); b.px(4, 6, C.ver1);
        b.rect(7, 6, 3, 3, C.pl2); b.px(8, 7, C.dk1);
      } else {
        b.rect(3, 6, 4, 3, C.pl2); b.hl(3, 6, 8, C.pl1);
      }
      if (!R) {
        // ink stone + brush
        b.rect(11, 5, 3, 3, C.dk1); b.px(11, 5, C.dk2); b.px(12, 6, '#101018');
        b.px(9, 9, C.dk0); b.px(10, 8, C.wd3); b.px(11, 7, C.wd3); b.px(12, 6, C.wd4);
      } else {
        b.rect(10, 5, 4, 4, C.wh); b.px(11, 6, C.ver1); b.px(12, 7, C.ver1);
      }
    });
  };
  TILES.u = function (nb) {
    var m = mask(nb, function (c) { return c === 'u'; }, 4);
    return tileC('u' + m, function (b) {
      for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
        var c = (y & 1) ? '#c3c07e' : '#d0cd8e';
        if (x % 8 === 0 && (y & 1)) c = '#b5b270';
        b.px(x, y, c);
      }
      var N = m & 1, E = m & 2, S = m & 4, W = m & 8;
      var heri = '#2f4a3a', heri2 = '#48664e';
      if (!N) { b.hl(0, 15, 0, heri); b.hl(0, 15, 1, heri2); }
      if (!S) { b.hl(0, 15, 15, heri); b.hl(0, 15, 14, heri2); }
      if (!W) { b.vl(0, 0, 15, heri); b.vl(1, 0, 15, heri2); }
      if (!E) { b.vl(15, 0, 15, heri); b.vl(14, 0, 15, heri2); }
    });
  };
  TILES.y = function () {
    return tileC('y', function (b) {
      floorBase(b);
      shadowEll(b, 8.5, 15, 5, 1.4, 0.35);
      // pot
      b.rect(4, 10, 8, 5, '#b85c36'); b.hl(4, 11, 10, '#d8784a'); b.vl(4, 10, 14, '#d8784a'); b.vl(11, 10, 14, '#7a3424');
      b.hl(3, 12, 9, '#d8784a'); b.hl(3, 12, 8, '#e89868'); b.hl(5, 10, 14, '#7a3424'); b.hl(5, 10, 15, '#5a2418');
      b.hl(4, 11, 7, C.so0);
      // leaves
      blobs(b, 0, 0, 15, 8, [[5, 5, 3], [11, 5, 3], [8, 3, 3.4], [8, 7, 2.5]], HEDGE, { softTop: true });
      b.px(3, 7, HEDGE[3]); b.px(13, 7, HEDGE[2]); b.px(2, 8, HEDGE[1]);
    });
  };
  TILES.z = function () {
    return tileC('z', function (b) {
      floorBase(b);
      b.rect(1, 4, 14, 10, '#7a2e2a');
      b.rect(2, 5, 12, 8, '#b8483a');
      b.rect(3, 6, 10, 6, '#d8a24a');
      b.rect(4, 7, 8, 4, '#b8483a');
      b.hl(2, 13, 5, '#d0604a');
      for (var x = 1; x < 15; x += 2) { b.px(x, 3, C.pl1); b.px(x, 14, C.pl1); }
    });
  };
  TILES.m = function (nb, t) {
    var f = Math.floor(t * 4) % 4;
    return tileC('m' + f, function (b) {
      floorBase(b);
      b.rect(0, 14, 16, 2, '#1a1430', 0.3);
      // wooden cabinet
      b.rect(1, 9, 14, 6, C.fl1); b.hl(1, 14, 9, C.fl3); b.hl(1, 14, 14, C.fl0);
      b.vl(1, 9, 14, C.fl0); b.vl(14, 9, 14, C.fl0); b.hl(3, 12, 12, C.fl0); b.px(8, 11, C.ye1);
      // glass case
      b.rect(1, 1, 14, 8, C.fl0);
      b.rect(2, 2, 12, 7, '#3a2a52');
      var glow = [C.ye2, C.lt2, '#ffffff', C.lt2][f];
      var cards = [[3, 3, '#e8455a'], [7, 2, '#3c7ad0'], [11, 3, '#4fae58']];
      for (var i = 0; i < cards.length; i++) {
        var cx = cards[i][0], cy = cards[i][1];
        var g = (i + f) % 4 === 0;
        b.rect(cx - 1, cy - 1, 4, 6, g ? glow : '#6a5a8a', g ? 0.7 : 0.5);
        b.rect(cx, cy, 2, 4, C.wh); b.px(cx, cy + 1, cards[i][2]); b.px(cx + 1, cy + 2, cards[i][2]);
        b.px(cx, cy + 3, C.ye1);
      }
      // glass
      b.rect(2, 2, 12, 7, '#bfe6f0', 0.18);
      b.px(3, 7, '#ffffff'); b.px(4, 6, '#ffffff'); b.px(5, 5, '#ffffff', 0.7);
      b.px(11, 8, '#ffffff', 0.6); b.px(12, 7, '#ffffff', 0.6);
      b.hl(1, 14, 1, C.fl3);
    });
  };

  // ================================================================== characters
  var SK = [C.sk0, C.sk1, C.sk2];
  var CHARS = {
    hero: {
      hair: ['#3a2620', '#5a3a2a', '#7a5238'], hat: 'cap', hatC: ['#8e2428', '#d23c36', '#f26a50'],
      top: ['#c6c2d8', '#f4f1ea', '#ffffff'], bot: ['#27427e', '#3c64b4'], botStyle: 'shorts',
      shoe: ['#7a2428', '#c84036'], pack: ['#b8762a', '#e8a23c', '#f6c860']
    },
    sensei: {
      hair: ['#1e1828', '#2e2436', '#4a3a58'], hat: 'bun', top: ['#c8c4d8', '#f6f3ec', '#ffffff'], topStyle: 'haori',
      bot: ['#8c2626', '#d0412e', '#ee6a44'], botStyle: 'hakama', shoe: [C.wh1, C.wh], inner: C.ver1
    },
    rival: {
      hair: ['#1b4750', '#2f6f78', '#58a4a8'], hat: 'spiky', top: ['#2a2e44', '#3d4260', '#565c80'],
      bot: ['#5e5440', '#857856'], botStyle: 'pants', shoe: ['#9a98b0', '#e8e6f0'], scarf: ['#b85a1c', '#f08a2c', '#ffb45a'], brow: true
    },
    kid: {
      hair: ['#2a1e1c', '#3e2c26', '#5a4034'], hat: 'straw', hatC: ['#b08a3a', '#e8c872', '#f8e4a0'], band: '#d0412e',
      top: ['#d8a82a', '#f4d23c', '#fce888'], bot: ['#3e6a2e', '#5a8c3c'], botStyle: 'shorts', shoe: ['#2a4a8a', '#3c64b4']
    },
    granny: {
      hair: ['#8a8494', '#b8b4bc', '#dcd8de'], hat: 'greybun', top: ['#4a3268', '#7a5a9e', '#9a7ab8'], topStyle: 'kimono',
      bot: ['#4a3268', '#7a5a9e'], botStyle: 'kimono', shoe: [C.wh1, C.wh], obi: ['#b08a3a', '#e0c070'], hunch: true, closedEyes: true, cane: true
    },
    fisher: {
      hair: ['#9a96a0', '#cfcbd2', '#eeeaee'], hat: 'sedge', hatC: ['#8a6a32', '#c8a452', '#e6c878'],
      top: ['#26345a', '#3a4e80', '#5a70a6'], bot: ['#6a6a7a', '#8a8aa0'], botStyle: 'shorts', shoe: ['#5a3a24', '#8a5a34'], beard: true, rod: true, skinTan: true
    },
    trader: {
      hair: ['#3a2a1e', '#5a4030', '#7a5a40'], hat: 'flatcap', hatC: ['#5a3e24', '#7e5a34', '#a07a4a'],
      top: ['#2e6030', '#4a8a44', '#6aae5a'], bot: ['#4a4040', '#6a5a50'], botStyle: 'pants', shoe: ['#3a2418', '#5a3a24'], bigpack: true
    },
    guardian: {
      hair: ['#1a1620', '#2a2430', '#3e3648'], hat: 'eboshi', top: ['#c4ccd8', '#f2f4f8', '#ffffff'], topStyle: 'robe',
      bot: ['#3e6a9e', '#6a9ad0', '#9cc0e6'], botStyle: 'hakama', shoe: [C.wh1, C.wh], big: true, stache: true
    },
    mom: {
      hair: ['#4a2a1e', '#6e4030', '#955a40'], hat: 'ponytail', top: ['#c05a6e', '#e88a9a', '#f6b0bc'],
      bot: ['#a84a5e', '#d8788a'], botStyle: 'skirt', shoe: ['#6a3a2a', '#9a5a3a'], apron: ['#d8d4e0', '#fbf8f0']
    },
    villager: {
      hair: ['#2a2220', '#3e3230', '#5a4a44'], hat: 'towel', hatC: ['#c8d4e4', '#f2f6fa', '#ffffff'], stripe: '#3c64b4',
      top: ['#8a7048', '#b8985e', '#d6b87a'], bot: ['#2c3a5a', '#3e4e76'], botStyle: 'pants', shoe: ['#1e3a28', '#2e5a3a'], skinTan: true
    }
  };
  var TAN = ['#b87650', '#dca47a', '#f0c49a'];

  function paintHuman(cfg, dir, frame) {
    var b = new Buf(16, 21, 0, 1);
    var d = (dir === 'left' || dir === 'right') ? 'right' : dir;
    var bob = frame ? -1 : 0;
    var hn = cfg.hunch ? 1 : 0;
    var sk = cfg.skinTan ? TAN : SK;
    var big = cfg.big ? 1 : 0;
    function U(x, y, w, h, c) { b.rect(x, y + bob, w, h, c); }
    function Up(x, y, c) { b.px(x, y + bob, c); }
    function H(x, y, w, h, c) { b.rect(x + (d === 'right' ? hn : 0), y + bob + hn, w, h, c); }
    function Hp(x, y, c) { H(x, y, 1, 1, c); }
    var S = { b: b, d: d, frame: frame, bob: bob, U: U, Up: Up, H: H, Hp: Hp, cfg: cfg, sk: sk, big: big };

    if (cfg.bigpack) packBehind(S);
    legs(S);
    body(S);
    if (d === 'right' && cfg.pack) { U(2, 11, 3, 4, cfg.pack[1]); Up(2, 11, cfg.pack[2]); U(2, 14, 3, 1, cfg.pack[0]); Up(4, 12, cfg.pack[0]); }
    head(S);
    hair(S);
    extras(S);
    if (dir === 'left') b.mirror();
    b.outline();
    return b;
  }

  function legs(S) {
    var b = S.b, d = S.d, f = S.frame, cfg = S.cfg;
    var style = cfg.botStyle;
    var long = style === 'hakama' || style === 'kimono';
    var lt = (style === 'skirt' ? 18 : 17) + S.bob;
    var lc = style === 'pants' ? cfg.bot[1] : S.sk[1], ls = style === 'pants' ? cfg.bot[0] : S.sk[0];
    var sh = cfg.shoe;
    if (d === 'down' || d === 'up') {
      var lEnd = f === 2 ? 18 : 19, rEnd = f === 1 ? 18 : 19;
      if (!long) {
        b.rect(5, lt, 2, lEnd - lt, lc); b.rect(9, lt, 2, rEnd - lt, lc);
        b.vl(6, lt, lEnd - 1, ls); b.vl(10, lt, rEnd - 1, ls);
      }
      if (!long || lEnd === 19) { b.rect(5, lEnd, 2, 1, sh[1]); b.px(6, lEnd, sh[0]); }
      if (!long || rEnd === 19) { b.rect(9, rEnd, 2, 1, sh[1]); b.px(10, rEnd, sh[0]); }
      if (!long && d === 'down') { if (lEnd === 19) b.px(4, 19, sh[0]); if (rEnd === 19) b.px(11, 19, sh[0]); }
    } else {
      var farC = [ls, sh[0]], nearC = [lc, sh[1]];
      if (f === 0) {
        if (!long) { b.rect(6, lt, 2, 19 - lt, farC[0]); b.rect(8, lt, 2, 19 - lt, nearC[0]); }
        b.hl(6, 8, 19, farC[1]); b.hl(8, 10, 19, nearC[1]);
      } else {
        var fwd = f === 1 ? nearC : farC, back = f === 1 ? farC : nearC;
        var order = f === 1 ? [back, fwd] : [fwd, back];
        for (var i = 0; i < 2; i++) {
          var L = order[i];
          if (L === fwd) { if (!long) b.rect(9, lt, 2, 19 - lt, L[0]); b.hl(9, 11, 19, L[1]); }
          else { if (!long) { b.rect(5, lt, 2, 18 - lt, L[0]); } b.hl(4, 6, 18, L[1]); }
        }
      }
    }
  }

  function body(S) {
    var U = S.U, Up = S.Up, d = S.d, f = S.frame, cfg = S.cfg, sk = S.sk, big = S.big;
    var T = cfg.top, B = cfg.bot;
    var ts = cfg.topStyle || 'tee', bs = cfg.botStyle;
    var x0 = (d === 'right' ? 5 : 4) - big, w = (d === 'right' ? 6 : 8) + big * 2;
    // --- bottoms
    if (bs === 'shorts' || bs === 'pants') {
      U(x0, 15, w, 2, B[1]);
      if (d !== 'right') { Up(7, 16, B[0]); Up(8, 16, B[0]); U(x0 + w - 1, 15, 1, 2, B[0]); }
      else U(x0 + w - 1, 15, 1, 2, B[0]);
    } else if (bs === 'skirt') {
      U(x0, 15, w, 3, B[1]); U(x0 + w - 1, 15, 1, 3, B[0]);
      if (d !== 'right') { U(x0 - 1, 17, w + 2, 1, B[1]); Up(x0 + w, 17, B[0]); }
      else { U(x0 - 1, 17, w + 1, 1, B[1]); }
    } else { // long hakama / kimono
      var hemL = f === 1 ? 1 : 0, hemR = f === 2 ? 1 : 0;
      var bx = x0 - (bs === 'hakama' ? 1 : 0), bw = w + (bs === 'hakama' ? 2 : 0);
      U(x0, 15, w, 2, B[1]);
      if (d === 'right') {
        b_rect(S, bx, 17, bw, 2 - (f ? 1 : 0) + (f ? 1 : 0), B[1]);
        U(bx + bw - 1, 15, 1, 3, B[0]);
        if (f) { S.b.px(bx + bw, 18, B[1]); S.b.px(bx - 1 + (f === 1 ? 0 : 0), 18, B[0]); }
      } else {
        S.b.rect(bx, 17 + S.bob, bw, 2 - S.bob, B[1]);
        S.b.vl(bx + bw - 1, 15 + S.bob, 18, B[0]);
        if (bs === 'hakama') { S.b.vl(7, 16 + S.bob, 18, B[0]); if (B[2]) S.b.vl(bx, 17 + S.bob, 18, B[2]); }
        if (hemL) S.b.px(bx, 18, B[0]);
        if (hemR) S.b.px(bx + bw - 1, 18, B[0]);
      }
    }
    // --- torso
    var tTop = 11, tH = 4;
    if (ts === 'kimono') { tH = 4; }
    U(x0, tTop, w, tH, T[1]);
    U(x0, tTop, 1, tH, T[2]);
    U(x0 + w - 1, tTop, 1, tH, T[0]);
    U(x0, tTop + tH - 1, w, 1, T[0]);
    if (ts === 'haori' || ts === 'robe') {
      // long front panels over the hakama
      U(x0, 15, 2, 2, T[1]); U(x0 + w - 2, 15, 2, 2, T[0]);
      if (d === 'down') { U(7, 11, 2, 4, cfg.inner || cfg.bot[1]); Up(7, 11, T[1]); Up(8, 11, T[1]); U(7, 12, 1, 3, cfg.inner || cfg.bot[0]); }
      if (d === 'right') { U(x0 + w - 2, 12, 1, 3, cfg.inner || cfg.bot[1]); }
    }
    if (ts === 'kimono') {
      U(x0, 13, w, 1, cfg.obi[1]); U(x0 + w - 1, 13, 1, 1, cfg.obi[0]);
      if (d === 'down') { Up(7, 11, C.wh); Up(8, 11, C.wh1); Up(7, 12, T[0]); }
    }
    if (ts === 'tee' && d === 'down' && !cfg.scarf && !cfg.apron) { Up(7, 11, T[0]); Up(8, 11, T[0]); }
    if (cfg.apron && d !== 'up') {
      if (d === 'down') { U(5, 12, 6, 5, cfg.apron[1]); U(10, 12, 1, 5, cfg.apron[0]); U(5, 12, 6, 1, cfg.apron[0]); Up(5, 11, cfg.apron[1]); Up(10, 11, cfg.apron[1]); }
      else { U(8, 12, 3, 5, cfg.apron[1]); U(8, 12, 3, 1, cfg.apron[0]); }
    }
    if (cfg.apron && d === 'up') { U(5, 13, 6, 1, cfg.apron[1]); U(7, 14, 2, 2, cfg.apron[1]); }
    // --- arms
    var wide = ts === 'haori' || ts === 'robe' || ts === 'kimono';
    var sleeve = T[1], sleeveS = T[0];
    if (d === 'down' || d === 'up') {
      var la = x0 - 1, ra = x0 + w;
      // frame1: left foot forward -> right arm forward (lower), left arm back (shorter)
      var lLen = f === 1 ? 2 : f === 2 ? 4 : 3, rLen = f === 2 ? 2 : f === 1 ? 4 : 3;
      if (d === 'up') { var tmp = lLen; lLen = rLen; rLen = tmp; }
      if (wide) {
        U(la - 1, 11, 2, 3 + (lLen > 3 ? 1 : 0), sleeve); U(ra, 11, 2, 3 + (rLen > 3 ? 1 : 0), sleeveS);
        Up(la - 1, 11, T[2]);
        Up(la, 14 + (lLen > 3 ? 1 : 0) - (lLen < 3 ? 1 : 0), sk[1]); Up(ra, 14 + (rLen > 3 ? 1 : 0) - (rLen < 3 ? 1 : 0), sk[0]);
      } else {
        U(la, 11, 1, 2, sleeve); U(ra, 11, 1, 2, sleeveS);
        U(la, 13, 1, lLen - 1, sk[1]); U(ra, 13, 1, rLen - 1, sk[0]);
      }
    } else {
      // single visible arm
      var ax = f === 1 ? 6 : f === 2 ? 8 : 7;
      var hx = f === 1 ? 5 : f === 2 ? 9 : 7;
      if (wide) {
        U(ax - 1, 11, 3, 3, sleeve); U(ax - 1, 13, 3, 1, sleeveS); Up(ax - 1, 11, T[2]);
        Up(hx + (f === 2 ? 1 : 0), 14, sk[1]);
      } else {
        U(ax, 11, 2, 2, sleeve); Up(ax, 11, T[2]);
        U(hx, 13, 2, 1, sk[1]); Up(hx + (f === 1 ? 0 : 1), 13, sk[0]);
        if (f === 0) U(hx, 14, 2, 1, sk[1]);
      }
    }
  }
  function b_rect(S, x, y, w, h, c) { S.b.rect(x, y + S.bob, w, h, c); }

  function head(S) {
    var H = S.H, Hp = S.Hp, d = S.d, sk = S.sk, cfg = S.cfg;
    if (d === 'down') {
      H(4, 4, 8, 6, sk[1]); H(5, 10, 6, 1, sk[1]);
      H(3, 6, 1, 3, sk[1]); H(12, 6, 1, 3, sk[0]);
      H(11, 8, 1, 2, sk[0]); Hp(10, 10, sk[0]);
      Hp(5, 5, sk[2]);
      if (cfg.closedEyes) { H(5, 8, 2, 1, C.eye); H(9, 8, 2, 1, C.eye); }
      else {
        H(5, 7, 1, 2, C.eye); H(10, 7, 1, 2, C.eye);
        if (cfg.brow) { Hp(5, 6, S.cfg.hair[0]); Hp(6, 6, S.cfg.hair[0]); Hp(9, 6, S.cfg.hair[0]); Hp(10, 6, S.cfg.hair[0]); }
      }
      Hp(4, 9, C.blush); Hp(11, 9, C.blush);
      Hp(7, 10, sk[0]); Hp(8, 10, sk[0]);
    } else if (d === 'up') {
      H(4, 4, 8, 7, cfg.hair[1]); H(3, 5, 10, 4, cfg.hair[1]);
      H(6, 10, 4, 1, sk[0]);
    } else {
      H(6, 4, 6, 6, sk[1]); H(7, 10, 4, 1, sk[1]); H(12, 7, 1, 2, sk[1]);
      Hp(11, 9, sk[0]); Hp(10, 10, sk[0]);
      if (cfg.closedEyes) H(10, 8, 2, 1, C.eye);
      else { H(10, 7, 1, 2, C.eye); if (cfg.brow) { Hp(10, 6, cfg.hair[0]); Hp(11, 6, cfg.hair[0]); } }
      Hp(11, 9, C.blush);
      Hp(7, 8, sk[0]); Hp(7, 7, sk[0]);
    }
  }

  function baseHair(S, long) {
    var H = S.H, Hp = S.Hp, d = S.d, h = S.cfg.hair;
    if (d === 'down') {
      H(4, 2, 8, 1, h[1]); H(3, 3, 10, 3, h[1]); H(3, 6, 1, long ? 5 : 2, h[1]); H(12, 6, 1, long ? 5 : 2, h[0]);
      H(4, 6, 2, 1, h[1]); H(9, 6, 3, 1, h[1]); Hp(4, 7, h[1]);
      H(5, 3, 3, 1, h[2]); Hp(4, 4, h[2]);
      H(12, 4, 1, 2, h[0]);
    } else if (d === 'up') {
      H(4, 2, 8, 1, h[1]); H(3, 3, 10, 6, h[1]); H(4, 9, 8, 1, h[1]);
      if (long) H(4, 10, 8, 1, h[1]);
      H(5, 3, 4, 1, h[2]); Hp(4, 4, h[2]); H(12, 3, 1, 6, h[0]); H(4, 9, 8, 1, h[0]);
    } else {
      H(5, 2, 6, 1, h[1]); H(4, 3, 8, 2, h[1]); H(3, 4, 4, 5, h[1]); H(4, 9, 3, 1, h[1]);
      if (long) H(3, 9, 4, 2, h[1]);
      H(11, 5, 1, 1, h[1]); H(10, 5, 1, 1, h[1]);
      H(5, 3, 4, 1, h[2]); H(3, 7, 1, 2, h[0]); Hp(6, 8, h[0]);
    }
  }

  function hair(S) {
    var H = S.H, Hp = S.Hp, d = S.d, cfg = S.cfg, h = cfg.hair, c = cfg.hatC;
    switch (cfg.hat) {
      case 'cap':
        if (d === 'down') {
          H(3, 6, 1, 3, h[1]); H(12, 6, 1, 3, h[0]);
          H(5, 2, 6, 1, c[1]); H(4, 3, 8, 3, c[1]); H(3, 4, 1, 2, c[1]); H(12, 4, 1, 2, c[0]);
          H(5, 3, 2, 1, c[2]); Hp(4, 4, c[2]);
          H(3, 6, 10, 1, c[0]); H(4, 6, 8, 1, c[1]); H(5, 6, 6, 1, c[0]);
          Hp(7, 4, C.wh); Hp(8, 4, C.wh); Hp(8, 5, C.wh1);
        } else if (d === 'up') {
          H(3, 6, 10, 3, h[1]); H(4, 9, 8, 1, h[1]); H(12, 6, 1, 3, h[0]); H(4, 9, 8, 1, h[0]);
          H(5, 2, 6, 1, c[1]); H(4, 3, 8, 3, c[1]); H(3, 4, 1, 3, c[1]); H(12, 4, 1, 3, c[0]); H(4, 6, 8, 1, c[1]);
          H(5, 3, 2, 1, c[2]); H(6, 6, 4, 1, c[0]); Hp(7, 6, C.wh1);
        } else {
          H(3, 5, 3, 4, h[1]); H(4, 9, 3, 1, h[1]); Hp(3, 8, h[0]);
          H(5, 2, 5, 1, c[1]); H(4, 3, 7, 3, c[1]); H(3, 4, 1, 2, c[1]); H(11, 4, 1, 2, c[0]);
          H(5, 3, 2, 1, c[2]);
          H(8, 6, 6, 1, c[0]); H(9, 5, 4, 1, c[1]); Hp(13, 6, c[0]);
          Hp(10, 3, C.wh); Hp(10, 4, C.wh1);
        }
        break;
      case 'bun':
        baseHair(S, true);
        if (d === 'down') { H(6, 0, 4, 2, h[1]); Hp(7, 0, h[2]); H(10, 0, 2, 3, C.wh); Hp(11, 1, C.ver1); Hp(10, 3, C.ver1); H(5, 6, 1, 1, h[1]); }
        else if (d === 'up') { H(6, 0, 4, 2, h[1]); Hp(7, 0, h[2]); H(10, 0, 2, 3, C.wh); Hp(11, 1, C.ver1); Hp(8, 2, C.ver1); }
        else { H(4, 0, 4, 2, h[1]); Hp(5, 0, h[2]); H(2, 0, 2, 3, C.wh); Hp(2, 1, C.ver1); Hp(8, 2, C.ver1); }
        break;
      case 'spiky':
        baseHair(S);
        if (d === 'down') {
          Hp(3, 1, h[1]); Hp(4, 2, h[1]); Hp(6, 1, h[2]); Hp(6, 2, h[1]); Hp(9, 1, h[1]); Hp(9, 2, h[1]); Hp(12, 1, h[0]); Hp(11, 2, h[0]);
          Hp(2, 3, h[1]); Hp(13, 3, h[0]); Hp(2, 6, h[1]); Hp(13, 6, h[0]);
          Hp(7, 6, h[1]); Hp(7, 7, h[1]);
        } else if (d === 'up') {
          Hp(3, 1, h[1]); Hp(4, 2, h[1]); Hp(6, 1, h[2]); Hp(9, 1, h[1]); Hp(12, 1, h[0]); Hp(11, 2, h[0]);
          Hp(2, 4, h[1]); Hp(13, 4, h[0]); Hp(5, 10, h[1]); Hp(9, 10, h[0]); Hp(2, 7, h[1]); Hp(13, 7, h[0]);
        } else {
          Hp(4, 1, h[1]); Hp(7, 1, h[2]); Hp(10, 1, h[1]); Hp(2, 3, h[1]); Hp(1, 5, h[1]); Hp(2, 6, h[1]); Hp(2, 8, h[0]);
          Hp(12, 4, h[1]); Hp(12, 3, h[1]); H(10, 5, 2, 1, h[1]);
        }
        break;
      case 'straw':
        if (d === 'down') {
          H(3, 6, 1, 3, h[1]); H(12, 6, 1, 3, h[0]);
          H(5, 1, 6, 1, c[1]); H(4, 2, 8, 3, c[1]); H(5, 2, 3, 1, c[2]); H(4, 4, 8, 1, cfg.band);
          H(1, 5, 14, 1, c[1]); H(2, 6, 12, 1, c[0]); H(0, 5, 1, 1, c[0]); H(15, 5, 1, 1, c[0]);
          H(2, 5, 3, 1, c[2]);
        } else if (d === 'up') {
          H(4, 7, 8, 3, h[1]); H(4, 9, 8, 1, h[0]);
          H(5, 1, 6, 1, c[1]); H(4, 2, 8, 3, c[1]); H(4, 4, 8, 1, cfg.band);
          H(1, 5, 14, 2, c[1]); H(2, 7, 12, 1, c[0]); H(2, 5, 3, 1, c[2]);
        } else {
          H(3, 5, 4, 4, h[1]); H(4, 9, 3, 1, h[1]);
          H(5, 1, 5, 1, c[1]); H(4, 2, 7, 3, c[1]); H(4, 4, 7, 1, cfg.band); H(5, 2, 2, 1, c[2]);
          H(1, 5, 14, 1, c[1]); H(2, 6, 12, 1, c[0]); H(1, 5, 3, 1, c[2]);
        }
        break;
      case 'greybun':
        baseHair(S);
        if (d === 'down') { H(6, 0, 4, 2, h[1]); Hp(7, 0, h[2]); H(6, 2, 4, 1, h[0]); Hp(9, 0, h[0]); }
        else if (d === 'up') { H(6, 0, 4, 3, h[1]); Hp(7, 0, h[2]); Hp(6, 2, C.pu0 || '#553a78'); H(7, 2, 2, 1, '#e0c070'); }
        else { H(3, 1, 4, 3, h[1]); Hp(4, 1, h[2]); Hp(6, 3, '#e0c070'); }
        break;
      case 'sedge':
        if (d === 'down') {
          H(3, 6, 1, 3, h[1]); H(12, 6, 1, 3, h[0]);
          H(7, 0, 2, 1, c[1]); H(6, 1, 4, 1, c[1]); H(5, 2, 6, 1, c[1]); H(4, 3, 8, 1, c[1]); H(2, 4, 12, 1, c[1]); H(1, 5, 14, 1, c[1]);
          H(1, 6, 14, 1, c[0]); Hp(7, 0, c[2]); H(6, 1, 2, 1, c[2]); H(5, 2, 2, 1, c[2]); H(3, 4, 2, 1, c[2]);
          Hp(9, 3, c[0]); Hp(11, 4, c[0]); Hp(6, 4, c[0]); Hp(4, 5, c[0]); Hp(9, 5, c[0]); Hp(13, 5, c[0]);
        } else if (d === 'up') {
          H(7, 0, 2, 1, c[1]); H(6, 1, 4, 1, c[1]); H(5, 2, 6, 1, c[1]); H(4, 3, 8, 1, c[1]); H(2, 4, 12, 1, c[1]); H(1, 5, 14, 2, c[1]);
          H(1, 7, 14, 1, c[0]); Hp(7, 0, c[2]); H(6, 1, 2, 1, c[2]); H(5, 2, 2, 1, c[2]);
          Hp(8, 3, c[0]); Hp(5, 4, c[0]); Hp(10, 5, c[0]); Hp(4, 6, c[0]); H(4, 8, 8, 2, h[1]);
        } else {
          H(3, 6, 4, 3, h[1]);
          H(7, 0, 2, 1, c[1]); H(6, 1, 4, 1, c[1]); H(5, 2, 6, 1, c[1]); H(4, 3, 8, 1, c[1]); H(2, 4, 12, 1, c[1]); H(1, 5, 14, 1, c[1]);
          H(1, 6, 14, 1, c[0]); Hp(7, 0, c[2]); H(6, 1, 2, 1, c[2]); H(3, 4, 3, 1, c[2]);
          Hp(9, 2, c[0]); Hp(10, 4, c[0]); Hp(6, 5, c[0]);
        }
        break;
      case 'towel':
        baseHair(S);
        if (d === 'down') {
          H(4, 2, 8, 1, c[1]); H(3, 3, 10, 3, c[1]); H(3, 4, 10, 1, cfg.stripe); H(5, 2, 3, 1, c[2]); H(12, 3, 1, 3, c[0]);
          Hp(12, 6, c[1]); Hp(13, 6, c[0]); Hp(13, 5, c[1]);
        } else if (d === 'up') {
          H(4, 2, 8, 1, c[1]); H(3, 3, 10, 4, c[1]); H(3, 4, 10, 1, cfg.stripe); H(7, 7, 2, 1, c[0]); Hp(6, 8, c[1]); Hp(9, 8, c[1]); Hp(9, 9, c[0]);
        } else {
          H(5, 2, 6, 1, c[1]); H(4, 3, 8, 3, c[1]); H(3, 4, 1, 3, c[1]); H(4, 4, 8, 1, cfg.stripe); Hp(3, 4, cfg.stripe);
          H(2, 6, 2, 1, c[1]); Hp(2, 7, c[0]);
        }
        break;
      case 'eboshi':
        baseHair(S);
        if (d === 'down') { H(6, -1, 4, 1, C.dk1); H(5, 0, 6, 3, C.dk1); H(4, 3, 8, 1, C.dk0); H(6, 0, 1, 3, C.dk2); Hp(7, -1, C.dk2); H(3, 4, 1, 3, '#f2f4f8'); H(12, 4, 1, 3, '#c4ccd8'); }
        else if (d === 'up') { H(6, -1, 4, 1, C.dk1); H(5, 0, 6, 3, C.dk1); H(4, 3, 8, 1, C.dk0); H(6, 0, 1, 3, C.dk2); H(7, 4, 2, 6, '#f2f4f8'); }
        else { H(4, -1, 3, 1, C.dk1); H(4, 0, 6, 3, C.dk1); H(4, 3, 7, 1, C.dk0); H(5, 0, 1, 3, C.dk2); Hp(3, 0, C.dk1); H(7, 4, 1, 4, '#f2f4f8'); }
        break;
      case 'ponytail':
        baseHair(S);
        if (d === 'down') { H(12, 7, 2, 3, h[0]); Hp(12, 6, '#e8455a'); }
        else if (d === 'up') { H(7, 9, 2, 4, h[1]); Hp(7, 9, '#e8455a'); Hp(8, 9, '#e8455a'); H(8, 10, 1, 3, h[0]); }
        else { H(1, 5, 3, 2, h[1]); H(1, 7, 2, 3, h[1]); Hp(3, 5, '#e8455a'); Hp(1, 9, h[0]); Hp(2, 9, h[0]); }
        break;
      case 'flatcap':
        baseHair(S);
        if (d === 'down') { H(4, 2, 8, 1, c[1]); H(3, 3, 10, 2, c[1]); H(4, 5, 8, 1, c[0]); H(5, 2, 3, 1, c[2]); }
        else if (d === 'up') { H(4, 2, 8, 1, c[1]); H(3, 3, 10, 3, c[1]); H(5, 2, 3, 1, c[2]); }
        else { H(5, 2, 6, 1, c[1]); H(3, 3, 9, 2, c[1]); H(10, 5, 3, 1, c[0]); H(5, 2, 2, 1, c[2]); }
        break;
      default:
        baseHair(S);
    }
  }

  function packBehind(S) {
    var U = S.U, Up = S.Up, d = S.d;
    var wood = [C.wd0, C.wd1, C.wd2], sc = [C.pl1, C.pl2, C.wh];
    if (d === 'down') {
      // frame + scroll bundle towering behind the head
      U(2, 1, 12, 3, wood[1]); U(2, 1, 12, 1, wood[2]);
      for (var i = 0; i < 5; i++) { U(3 + i * 2, -1, 2, 3, sc[1]); Up(3 + i * 2, -1, sc[2]); Up(4 + i * 2, 1, sc[0]); Up(4 + i * 2, -1, ['#d0412e', '#3c64b4', '#4f9a48', C.ye1, '#7a5a9e'][i]); }
      U(2, 4, 1, 10, wood[0]); U(13, 4, 1, 10, wood[1]); U(2, 8, 1, 3, '#6a8a4a'); U(13, 8, 1, 3, '#4a6a3a');
    } else if (d === 'right') {
      U(0, 2, 5, 13, wood[1]); U(0, 2, 5, 1, wood[2]);
      for (i = 0; i < 3; i++) { U(0 + i * 2, 0, 2, 3, sc[1]); Up(i * 2, 0, sc[2]); Up(1 + i * 2, 0, ['#d0412e', '#3c64b4', C.ye1][i]); }
      U(0, 6, 5, 1, wood[0]); U(0, 10, 5, 1, wood[0]);
      U(1, 7, 3, 3, '#6a8a4a'); Up(1, 7, '#8aae5a');
    }
  }

  function extras(S) {
    var U = S.U, Up = S.Up, H = S.H, Hp = S.Hp, d = S.d, f = S.frame, cfg = S.cfg, b = S.b;
    if (cfg.pack && d === 'up') {
      U(4, 11, 8, 5, cfg.pack[1]); U(4, 11, 8, 1, cfg.pack[2]); U(5, 13, 6, 2, cfg.pack[0]); U(6, 13, 4, 1, cfg.pack[2]);
      U(11, 11, 1, 5, cfg.pack[0]); Up(4, 11, '#fff2c8');
    }
    if (cfg.pack && d === 'down') { U(4, 11, 1, 2, cfg.pack[0]); U(11, 11, 1, 2, cfg.pack[0]); }
    if (cfg.bigpack && d === 'up') {
      var wood = [C.wd0, C.wd1, C.wd2];
      U(2, 5, 12, 12, wood[1]); U(2, 5, 12, 1, wood[2]); U(2, 16, 12, 1, wood[0]);
      for (var i = 0; i < 5; i++) { U(3 + i * 2, 3, 2, 3, C.pl2); Up(3 + i * 2, 3, C.wh); Up(4 + i * 2, 3, ['#d0412e', '#3c64b4', '#4f9a48', C.ye1, '#7a5a9e'][i]); }
      U(3, 7, 10, 4, '#6a8a4a'); U(3, 7, 10, 1, '#8aae5a'); U(3, 11, 10, 1, wood[0]);
      U(3, 12, 10, 3, C.pl1); for (i = 0; i < 5; i++) Up(4 + i * 2, 13, C.pl0);
      U(1, 6, 1, 10, wood[0]); U(14, 6, 1, 10, wood[0]);
    }
    if (cfg.bigpack && d === 'down') { U(4, 11, 1, 3, C.wd1); U(11, 11, 1, 3, C.wd1); }
    if (cfg.scarf) {
      var s = cfg.scarf, fl = f === 1 ? 1 : 0;
      if (d === 'down') { U(4, 11, 8, 2, s[1]); U(4, 11, 8, 1, s[2]); U(11, 11, 1, 2, s[0]); U(9, 13, 2, 2 + fl, s[1]); Up(10, 13, s[0]); }
      else if (d === 'up') { U(4, 11, 8, 2, s[1]); U(4, 11, 8, 1, s[2]); U(6, 13, 2, 3, s[1]); Up(7, 13, s[0]); Up(6 + fl, 16, s[0]); }
      else { U(5, 11, 6, 2, s[1]); U(5, 11, 6, 1, s[2]); U(2 - fl, 11 + fl, 3, 2, s[1]); Up(2 - fl, 11 + fl, s[2]); Up(1 - fl, 12 + fl, s[0]); }
    }
    if (cfg.beard) {
      if (d === 'down') { H(5, 9, 6, 2, C.wh); H(6, 11, 4, 1, C.wh1); Hp(7, 9, S.sk[0]); Hp(8, 9, S.sk[0]); }
      else if (d === 'right') { H(8, 9, 4, 2, C.wh); H(8, 11, 3, 1, C.wh1); }
    }
    if (cfg.stache && d !== 'up') {
      if (d === 'down') { H(6, 9, 4, 1, cfg.hair[1]); } else { H(10, 9, 2, 1, cfg.hair[1]); }
    }
    if (cfg.rod) {
      if (d === 'down') { for (i = 0; i < 11; i++) b.px(12 + (i > 6 ? 2 : i > 3 ? 1 : 0), 13 - i + S.bob, i < 3 ? C.wd1 : '#8a6a42'); }
      else if (d === 'up') { for (i = 0; i < 11; i++) b.px(3 - (i > 6 ? 2 : i > 3 ? 1 : 0), 13 - i + S.bob, i < 3 ? C.wd1 : '#8a6a42'); }
      else { for (i = 0; i < 9; i++) b.px(6 - Math.floor(i * 0.6), 12 - i + S.bob, i < 2 ? C.wd1 : '#8a6a42'); }
    }
    if (cfg.cane) {
      var cc = ['#6a4a2a', '#8a6a3a'];
      if (d === 'down') { b.vl(12, 13 + S.bob, 19, cc[0]); b.px(12, 13 + S.bob, cc[1]); b.px(11, 13 + S.bob, cc[1]); }
      else if (d === 'right') { b.vl(11, 14 + S.bob, 19, cc[0]); b.px(10, 14 + S.bob, cc[1]); }
    }
  }

  function paintCat(dir, frame) {
    var b = new Buf(16, 21, 0, 1);
    var d = (dir === 'left' || dir === 'right') ? 'right' : dir;
    var bob = frame ? -1 : 0;
    var W = '#fbf6ee', W1 = '#d8d0cc', O = '#e8923a', O1 = '#b8641e', K = '#3a3040', K1 = '#241e2a', P = '#f2a0a8';
    function R(x, y, w, h, c) { b.rect(x, y + bob, w, h, c); }
    function Px(x, y, c) { b.px(x, y + bob, c); }
    if (d === 'down') {
      // tail curling up behind
      R(11, 12, 1, 4, O); Px(12, 11, O); Px(12, 10, K);
      // body
      R(5, 14, 6, 4, W); R(9, 14, 2, 3, K); R(5, 17, 6, 1, W1);
      // paws
      var lp = frame === 2 ? 18 : 19, rp = frame === 1 ? 18 : 19;
      b.rect(5, 18, 2, lp - 17, W); b.rect(9, 18, 2, rp - 17, W);
      // head
      R(4, 10, 8, 5, W); R(4, 10, 3, 3, O); R(9, 10, 3, 2, K);
      Px(4, 9, O); Px(5, 9, O1); Px(11, 9, K); Px(10, 9, K1); Px(5, 10, P);
      Px(10, 10, P);
      Px(5, 12, C.eye); Px(10, 12, C.eye); Px(7, 13, P); Px(8, 13, P);
      Px(4, 13, W1); Px(11, 13, W1);
    } else if (d === 'up') {
      R(5, 13, 6, 5, W); R(5, 13, 3, 3, O); R(8, 15, 3, 2, K);
      var lp2 = frame === 1 ? 18 : 19, rp2 = frame === 2 ? 18 : 19;
      b.rect(5, 18, 2, lp2 - 17, W1); b.rect(9, 18, 2, rp2 - 17, W1);
      R(4, 10, 8, 4, W); R(4, 10, 3, 3, O); R(9, 10, 3, 3, K);
      Px(4, 9, O); Px(5, 9, O1); Px(11, 9, K); Px(10, 9, K1);
      // tail up toward viewer
      R(7, 16, 2, 2, O); Px(8, 18, O1); b.px(8, 19, O);
      R(7, 16, 1, 1, W);
    } else {
      // tail
      Px(1, 10, O); Px(1, 11, O); Px(2, 12, O); Px(2, 13, O1); Px(3, 14, W);
      // body
      R(3, 14, 8, 4, W); R(4, 14, 3, 2, O); R(8, 14, 2, 2, K); R(3, 17, 8, 1, W1);
      // legs
      var a = frame === 1, c2 = frame === 2;
      b.rect(a ? 3 : 4, 18, 1, 2, W1); b.rect(c2 ? 7 : 6, 18, 1, 2, W);
      b.rect(a ? 10 : 9, 18, 1, 2, W1); b.rect(c2 ? 11 : 10, 18, 1, 2, W);
      // head
      R(9, 10, 5, 5, W); R(9, 10, 2, 2, O); Px(12, 10, K); Px(13, 10, K);
      Px(9, 9, O1); Px(12, 9, K); Px(13, 9, K1);
      Px(12, 12, C.eye); Px(14, 13, P); Px(14, 12, W); Px(13, 14, W1);
    }
    if (dir === 'left') b.mirror();
    b.outline();
    return b;
  }

  var SPRITES = {};
  function sprite(id, dir, frame) {
    var key = id + dir + frame, s = SPRITES[key];
    if (s) return s;
    var b;
    if (id === 'cat') b = paintCat(dir, frame);
    else b = paintHuman(CHARS[id] || CHARS.villager, dir, frame);
    s = b.canvas();
    SPRITES[key] = s;
    return s;
  }
  var SHADOW = null, SHADOW_S = null;
  function shadows() {
    if (SHADOW) return;
    var b = new Buf(12, 3);
    b.ell(6, 1.5, 6, 1.6, '#1a1430', 0.3);
    b.hl(3, 8, 1, '#1a1430'); // slightly denser core
    b.d = b.d.map(function (v, i) { return (i % 4 === 3) ? Math.min(v, 90) : v; });
    SHADOW = b.canvas();
    var c = new Buf(8, 2);
    c.ell(4, 1, 4, 1.1, '#1a1430', 0.3);
    SHADOW_S = c.canvas();
  }

  // ================================================================== item & alert
  function itemFrame(f) {
    return cached('item' + f, 16, 16, 0, 0, function (b) {
      var by = (f === 1 || f === 2) ? -1 : 0;
      b.ell(8, 13.5, 4, 1.3, '#1a1430', 0.3);
      // paper talisman card (slightly tilted feel via offset rows)
      var x0 = 5, y0 = 4 + by;
      b.rect(x0, y0, 6, 9, C.ol);
      b.rect(x0 + 1, y0 + 1, 4, 7, C.wh);
      b.vl(x0 + 1, y0 + 1, y0 + 7, '#ffffff'); b.vl(x0 + 4, y0 + 2, y0 + 7, C.wh1);
      b.hl(x0 + 2, x0 + 3, y0 + 2, C.ver1); b.px(x0 + 2, y0 + 3, C.ver1); b.px(x0 + 3, y0 + 4, C.ver1); b.hl(x0 + 2, x0 + 3, y0 + 5, C.ver1);
      b.px(x0 + 2, y0 + 7, C.ye0); b.px(x0 + 3, y0 + 7, C.ye1);
      // sparkle
      var sx = 12, sy = 3 + by;
      if (f === 0) { b.px(sx, sy, C.wh); }
      else if (f === 1) { b.px(sx, sy, '#ffffff'); b.px(sx - 1, sy, C.lt1); b.px(sx + 1, sy, C.lt1); b.px(sx, sy - 1, C.lt1); b.px(sx, sy + 1, C.lt1); }
      else if (f === 2) { b.px(sx, sy, '#ffffff'); b.hl(sx - 2, sx + 2, sy, C.lt1); b.vl(sx, sy - 2, sy + 2, C.lt1); b.px(sx - 1, sy, C.lt2); b.px(sx + 1, sy, C.lt2); b.px(sx, sy - 1, C.lt2); b.px(sx, sy + 1, C.lt2); }
      else { b.px(sx, sy, C.lt2); b.px(3, 10 + by, C.lt1); }
      if (f === 2) b.px(3, 9 + by, C.lt2);
    });
  }
  var ALERT = null;
  function alertCanvas() {
    if (ALERT) return ALERT;
    var b = new Buf(12, 16);
    // bubble body 12x12 rounded, tail at bottom
    b.rect(1, 0, 10, 12, C.ol); b.rect(0, 1, 12, 10, C.ol);
    b.rect(1, 1, 10, 10, C.wh); b.hl(2, 9, 10, C.wh1); b.vl(10, 2, 9, C.wh1);
    b.px(1, 1, C.ol); b.px(10, 1, C.ol); b.px(1, 10, C.ol); b.px(10, 10, C.ol);
    b.px(2, 2, '#ffffff');
    // tail
    b.rect(4, 11, 4, 1, C.wh); b.px(3, 11, C.ol); b.px(8, 11, C.ol);
    b.rect(5, 12, 2, 1, C.wh); b.px(4, 12, C.ol); b.px(7, 12, C.ol); b.hl(5, 6, 13, C.ol);
    // red !
    b.rect(5, 2, 2, 5, C.ver1); b.px(5, 2, C.ver2); b.vl(6, 3, 6, C.ver0);
    b.rect(5, 8, 2, 2, C.ver1); b.px(6, 9, C.ver0);
    ALERT = b.canvas();
    return ALERT;
  }

  // ================================================================== public API
  function blit(ctx, e, px, py) {
    if (!e) return;
    ctx.drawImage(e.c, Math.round(px) - e.ox, Math.round(py) - e.oy);
  }
  var noNb = function () { return ''; };

  window.PIX = {
    TILE: TILE,
    drawTile: function (ctx, code, px, py, t, nb, tx, ty) {
      nb = nb || noNb; t = t || 0;
      var fn = TILES[code] || TILES['.'];
      blit(ctx, fn(nb, t, tx, ty), px, py);
    },
    drawOverlay: function (ctx, code, px, py, t, nb, tx, ty) {
      var fn = OVER[code];
      if (!fn) return;
      blit(ctx, fn(nb || noNb, t || 0, tx, ty), px, py);
    },
    drawChar: function (ctx, id, dir, frame, px, py) {
      shadows();
      dir = dir || 'down'; frame = frame | 0;
      if (frame < 0 || frame > 2) frame = 0;
      px = Math.round(px); py = Math.round(py);
      if (id === 'cat') ctx.drawImage(SHADOW_S, px + 4, py + 14);
      else ctx.drawImage(SHADOW, px + 2, py + 14);
      ctx.drawImage(sprite(id, dir, frame), px, py - 5);
    },
    drawItem: function (ctx, px, py, t) {
      var f = Math.floor((t || 0) * 5) % 8;
      f = f < 4 ? f : 0;
      blit(ctx, itemFrame(f), px, py);
    },
    drawAlert: function (ctx, px, py) {
      ctx.drawImage(alertCanvas(), Math.round(px) + 2, Math.round(py) - 18);
    }
  };
})();
