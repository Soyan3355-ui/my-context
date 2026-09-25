/* ハマカゼFC — procedural 48x48 character portraits (bust shots).
 * Plain browser script. Exposes window.Portraits = { SIZE, ids, exprs, get(id, expr) }.
 * Every portrait is built from layered pixel parts (back hair, neck, body, collar,
 * ears, head, beard, hair, accessories). A part-aware pass shades skin under hair
 * and draws 1px outlines wherever a part sits on top of something behind it.
 */
(function () {
  'use strict';

  var S = 48;
  var OUT = '#2a1a24';
  var EXPRS = ['normal', 'happy', 'surprised', 'determined', 'sad'];
  var Z = { hairB: 0, neck: 1, body: 2, collar: 3, ear: 4, head: 5, beard: 6, hair: 7, acc: 8, fx: 9 };

  var SCLERA = '#fffaf4';
  var WHITE = '#ffffff';
  var MOUTH_PAL = { m: '#5a1e2a', M: '#8e2e3e', t: '#e8707a', T: '#fffaf4', f: '#fffaf4' };
  var TEAR = '#9fdcff';
  var BLUSH = '#f39aa0';
  var BLUSH2 = '#e8788a';

  // ------------------------------------------------------------------ buffer
  function Buf() {
    this.c = new Array(S * S);
    this.p = new Array(S * S);
    this.k = new Array(S * S);
    for (var i = 0; i < S * S; i++) { this.c[i] = null; this.p[i] = -1; this.k[i] = 0; }
  }
  Buf.prototype.set = function (x, y, col, part, lock) {
    if (!col || x < 0 || y < 0 || x >= S || y >= S) return;
    var i = y * S + x;
    this.c[i] = col; this.p[i] = Z[part]; this.k[i] = lock ? 1 : 0;
  };
  Buf.prototype.recolor = function (x, y, col) { // keep part/lock, change colour
    if (x < 0 || y < 0 || x >= S || y >= S || this.p[y * S + x] < 0) return;
    this.c[y * S + x] = col;
  };
  Buf.prototype.part = function (x, y) {
    if (x < 0 || y < 0 || x >= S || y >= S) return -2;
    return this.p[y * S + x];
  };
  Buf.prototype.col = function (x, y) {
    if (x < 0 || y < 0 || x >= S || y >= S) return null;
    return this.c[y * S + x];
  };

  // distance from vertical centre line (centre sits between x=23 and x=24)
  function dxOf(x) { return x < 24 ? 23 - x : x - 24; }
  function mir(x) { return 47 - x; }

  // spans: [[y, x0, x1, x0, x1, ...], ...]; col is a colour or function(x, y)
  function spans(b, list, col, part, lock) {
    for (var r = 0; r < list.length; r++) {
      var row = list[r], y = row[0];
      for (var j = 1; j + 1 < row.length; j += 2) {
        for (var x = row[j]; x <= row[j + 1]; x++) {
          b.set(x, y, typeof col === 'function' ? col(x, y) : col, part, lock);
        }
      }
    }
  }
  // pixel map at (x0, y0); pal maps chars to colours; '.'/space skipped
  function pmap(b, x0, y0, rows, pal, part, lock, flip) {
    for (var r = 0; r < rows.length; r++) {
      var s = rows[r];
      for (var c = 0; c < s.length; c++) {
        var ch = s.charAt(c);
        if (ch === '.' || ch === ' ') continue;
        var col = pal[ch];
        if (!col) continue;
        var x = flip ? x0 + (s.length - 1 - c) : x0 + c;
        b.set(x, y0 + r, col, part, lock);
      }
    }
  }
  // left-side map at x0 plus mirrored copy on the right half
  function pmapSym(b, x0, y0, rows, pal, part, lock) {
    pmap(b, x0, y0, rows, pal, part, lock, false);
    var w = rows[0].length;
    pmap(b, mir(x0 + w - 1), y0, rows, pal, part, lock, true);
  }

  // ------------------------------------------------------------------ hair-like layers with auto shading
  function maskLayer(b, def, pal, part) {
    var M = {};
    var list = def.shape;
    for (var r = 0; r < list.length; r++) {
      var row = list[r], y = row[0];
      for (var j = 1; j + 1 < row.length; j += 2) {
        for (var x = row[j]; x <= row[j + 1]; x++) M[y * S + x] = 1;
      }
    }
    function run(x, y, dx, dy) {
      var n = 0;
      while (n < 6 && x >= 0 && y >= 0 && x < S && y < S && M[y * S + x]) { n++; x += dx; y += dy; }
      return n;
    }
    for (var key in M) {
      var k = +key, px = k % S, py = (k - px) / S;
      var below = run(px, py, 0, 1), right = run(px, py, 1, 0);
      var c = pal.H;
      if (below <= 2) c = pal.d;
      if (px >= 27 && right <= 2) c = pal.d;
      if (px >= 30 && right <= 3 && below <= 3) c = pal.D;
      if (def.flat) c = pal.H;
      if (def.base === 'd') c = (c === pal.H) ? pal.d : pal.D;
      b.set(px, py, c, part);
    }
    function over(sp, col) {
      if (!sp) return;
      spans(b, sp, function (x, y) { return M[y * S + x] ? col : null; }, part);
    }
    over(def.mid, pal.H);
    over(def.sh, pal.d);
    over(def.dk, pal.D);
    over(def.hi, pal.h);
    over(def.ln, def.lnCol || OUT);
    return M;
  }

  // ------------------------------------------------------------------ head profiles (half widths per row)
  function rep(v, n) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }
  var PROFILES = {
    std: { top: 8, w: [9, 10, 11, 12, 12].concat(rep(13, 15), [12, 12, 11, 11, 10, 9, 8, 7, 5, 3]) },
    slender: { top: 8, w: [9, 10, 11, 11, 12].concat(rep(12, 15), [11, 11, 10, 10, 9, 8, 7, 5, 4, 2]) },
    wide: { top: 7, w: [10, 12, 13, 14, 14, 15].concat(rep(15, 18), [14, 14, 13, 12, 10, 8, 5]) },
    round: { top: 8, w: [9, 10, 11, 12, 12].concat(rep(13, 12), rep(14, 7), [13, 12, 11, 9, 7, 4]) },
    square: { top: 8, w: [10, 11, 12, 12, 13].concat(rep(13, 20), [12, 12, 11, 10, 8]) },
    bald: { top: 4, w: [6, 9, 10, 11, 12, 13, 13].concat(rep(14, 21), [13, 13, 12, 11, 10, 8]) },
    old: { top: 8, w: [9, 10, 11, 12, 12].concat(rep(13, 16), [12, 12, 11, 10, 9, 8, 6, 4]) }
  };
  function profW(prof, y) {
    var i = y - prof.top;
    if (i < 0 || i >= prof.w.length) return 0;
    return prof.w[i];
  }

  // ------------------------------------------------------------------ eyes (left eye; outer corner is column 0)
  var EYE_SURPRISED = ['.KKKK.', 'KWWWW.', 'KWPPW.', '.WPPW.', '.WWWW.', '..SS..'];
  var EYE_ARC = ['......', '......', '..KKK.', '.K...K', 'K.....', '......'];
  var EYE_ARC_SOFT = ['......', '......', '.KKKK.', 'K....K', '......', '......'];
  var EYES = {
    big: {
      normal: ['...KKK', '.KKKKK', 'KKHPPW', '.WPPPW', '.WIIiW', '.WiIIW', '..SSS.'],
      happy: EYE_ARC,
      surprised: EYE_SURPRISED,
      determined: ['K.....', '.KKK..', 'KKHKKK', '.WPPPW', '.WIIiW', '.WiIIW', '..SSS.'],
      sad: ['......', '....KK', '.KKKKW', 'KKHPPW', '.WPPHW', '.WIiiW', '..LLL.']
    },
    sharp: {
      normal: ['K.....', '.KKKKK', '.KHPPW', '.WPIiW', '..SSS.', '......'],
      happy: EYE_ARC_SOFT,
      surprised: ['.KKKK.', 'KWWWW.', '.WPPW.', '.WWWW.', '..SS..', '......'],
      determined: ['KK....', '.KKKKK', '..KHPK', '.WPIiW', '..SSS.', '......'],
      sad: ['......', '..KKKK', 'KKKHPW', '.WPIiW', '..LLL.', '......']
    },
    sleepy: {
      normal: ['......', '......', 'KKKKKK', '.WPHPW', '..PIP.', '......'],
      happy: EYE_ARC_SOFT,
      surprised: EYE_SURPRISED,
      determined: ['......', 'KK....', '.KKKKK', '.WPHPK', '..PIP.', '......'],
      sad: ['......', '......', '..KKKK', 'KKPHPW', '..PIP.', '..LL..']
    },
    small: {
      normal: ['......', 'KKKKKK', '.WPHW.', '.WPPW.', '..SS..', '......'],
      happy: EYE_ARC_SOFT,
      surprised: ['......', '.KKKK.', 'KWWWW.', '.WPPW.', '.WWWW.', '..SS..'],
      determined: ['KK....', '.KKKKK', '.WPHWK', '.WPPW.', '..SS..', '......'],
      sad: ['......', '...KKK', 'KKWPHW', '..WPPW', '..LL..', '......']
    },
    round: {
      normal: ['......', '..KK..', '.KHPK.', '.KPPK.', '..KK..', '......'],
      happy: EYE_ARC,
      surprised: EYE_SURPRISED,
      determined: ['KK....', '.KKKK.', '.KHPK.', '.KPPK.', '..KK..', '......'],
      sad: ['......', '..KK..', '.KHPK.', '.KPPK.', '..LL..', '......']
    },
    calm: {
      normal: ['......', '.KKKKK', 'KKHPPW', '.WPIiW', '..SSS.', '......'],
      happy: EYE_ARC_SOFT,
      surprised: EYE_SURPRISED,
      determined: ['K.....', '.KKKKK', '.KKHPK', '.WPIiW', '..SSS.', '......'],
      sad: ['......', '...KKK', 'KKKHPW', '.WPIiW', '..LLL.', '......']
    }
  };

  // brows (left side, outer end at column 0)
  var BROWS = {
    normal: { dy: 0, rows: ['.bbbb.', 'b.....'] },
    happy: { dy: -1, rows: ['.bbbb.', 'b.....'] },
    surprised: { dy: -2, rows: ['.bbbb.', 'b....b'] },
    determined: { dy: -1, rows: ['b.....', '.bbb..', '...bbb'] },
    sad: { dy: -1, rows: ['.....b', '..bbb.', 'bb....'] }
  };

  // mouths, centred on the face
  var MOUTHS = {
    normal: ['m..m', '.mm.'],
    happy: ['mmmmmm', 'mTTTTm', '.mttm.', '..mm..'],
    surprised: ['.mm.', 'mMMm', 'mttm', '.mm.'],
    determined: ['mmmmmm', 'mTTTTm', '.mmmm.'],
    sad: ['.mm.', 'm..m']
  };

  // ------------------------------------------------------------------ palettes
  var SKIN = {
    std: { L: '#ffe6d0', B: '#f8c9a2', S: '#dc9a7a', D: '#b0685a' },
    fair: { L: '#fff2e8', B: '#fcdcc6', S: '#e6ac96', D: '#b87a78' },
    mid: { L: '#f9d2ac', B: '#ecb48a', S: '#c8845e', D: '#985444' },
    tan: { L: '#e8ae80', B: '#c98a5a', S: '#9c6240', D: '#6e3e2c' },
    old: { L: '#fbe0cc', B: '#f2c4a4', S: '#d09482', D: '#a66a64' },
    ruddy: { L: '#fad2b4', B: '#eeb08c', S: '#c87c62', D: '#9a5248' }
  };
  var TEAM = { L: '#9fdcff', B: '#4fb4e8', S: '#2f86c4', D: '#1f5c94' };
  var RIVAL = { L: '#d85a5e', B: '#b8323a', S: '#7c1e2c', D: '#58121e' };
  var TRIM = '#3a3340';

  // ------------------------------------------------------------------ bodies
  var BODY_HW = { 36: 5, 37: 7, 38: 10, 39: 14, 40: 17, 41: 19, 42: 20, 43: 21, 44: 22, 45: 22, 46: 23, 47: 23 };
  function bodyHW(y, dw) {
    var h = BODY_HW[y] || 0;
    if (!h) return 0;
    if (y >= 39) h += dw; else h += Math.round(dw / 2);
    return Math.max(0, Math.min(24, h));
  }
  function torso(b, ramp, dw) {
    for (var y = 37; y < S; y++) {
      var hw = bodyHW(y, dw);
      for (var x = 0; x < S; x++) {
        var dx = dxOf(x);
        if (dx >= hw) continue;
        var edge = hw - 1 - dx; // 0 at outer edge
        var c = ramp.B;
        if (x >= 24 && edge <= 3) c = ramp.S;
        if (x >= 24 && edge <= 1 && y >= 42) c = ramp.D;
        if (x < 24 && y <= 41 && edge <= 5 && edge >= 1) c = ramp.L;
        if (y >= 43 && edge === 5) c = x < 24 ? ramp.S : ramp.D; // arm crease
        b.set(x, y, c, 'body');
      }
    }
  }
  function neck(b, sk, w) {
    for (var y = 30; y < 45; y++) for (var x = 0; x < S; x++) {
      if (dxOf(x) < w) b.set(x, y, sk.S, 'neck');
    }
  }
  var BODIES = {
    team: function (b, ch) {
      torso(b, TEAM, ch.dw || 0);
      // polo collar with V opening
      for (var y = 37; y <= 44; y++) {
        var v = 5 - (y - 38);
        for (var x = 0; x < S; x++) {
          var dx = dxOf(x);
          if (dx < v) b.set(x, y, ch.skin.S, 'neck');
          else if (dx < v + 4 + (y <= 38 ? 2 : 0) && y <= 43) {
            var c = (x >= 24) ? '#c4d6e8' : '#fbfdff';
            if (dx >= v + 3) c = '#c4d6e8';
            b.set(x, y, c, 'collar');
          }
        }
      }
      b.set(23, 45, TEAM.S, 'body'); b.set(24, 45, TEAM.S, 'body');
      b.set(23, 46, '#fbfdff', 'body', 1);
    },
    rival: function (b, ch) {
      torso(b, RIVAL, ch.dw || 0);
      var open = { 37: 6, 38: 5, 39: 5, 40: 4, 41: 2 };
      for (var y = 36; y <= 43; y++) {
        for (var x = 0; x < S; x++) {
          var dx = dxOf(x), o = open[y] || 0;
          if (dx < o) b.set(x, y, ch.skin.S, 'neck');
          else if (dx < o + 3 && y >= 37 && y <= 42) b.set(x, y, dx === o + 2 ? '#241e2a' : TRIM, 'collar');
        }
      }
      // raglan trim over the shoulders
      for (var yy = 40; yy < S; yy++) {
        var hw = bodyHW(yy, ch.dw || 0);
        var d = 9 + Math.round((yy - 40) * 1.3);
        if (d < hw - 1) {
          b.set(23 - d, yy, TRIM, 'body', 1); b.set(24 + d, yy, TRIM, 'body', 1);
        }
      }
    },
    gk: function (b, ch) {
      var G = { L: '#c4f08a', B: '#8fd14f', S: '#5a9e2e', D: '#3a7020' };
      torso(b, G, ch.dw || 0);
      // chest band pattern
      for (var y = 43; y < S; y++) for (var x = 0; x < S; x++) {
        if (b.part(x, y) !== Z.body) continue;
        if ((x + y) % 4 === 0 && dxOf(x) < 12) b.recolor(x, y, x < 24 ? G.L : G.B);
      }
      var open = { 37: 6, 38: 5, 39: 5, 40: 4, 41: 2 };
      for (y = 36; y <= 43; y++) for (x = 0; x < S; x++) {
        var dx = dxOf(x), o = open[y] || 0;
        if (dx < o) b.set(x, y, ch.skin.S, 'neck');
        else if (dx < o + 3 && y >= 37 && y <= 42) b.set(x, y, dx === o + 2 ? '#1e4214' : '#2e5a1e', 'collar');
      }
    },
    track: function (b, ch) {
      torso(b, TEAM, ch.dw || 0);
      // stand collar, zip
      for (var y = 35; y <= 41; y++) for (var x = 0; x < S; x++) {
        var dx = dxOf(x);
        var v = y <= 37 ? 3 : (y === 38 ? 2 : (y === 39 ? 1 : 0));
        if (dx < v) b.set(x, y, ch.skin.S, 'neck');
        else if (dx < 8 && y <= 40) b.set(x, y, (x >= 24 ? TEAM.S : TEAM.B), 'collar');
      }
      for (y = 36; y <= 40; y++) { b.set(23 - (y <= 37 ? 3 : 2) - 4, y, '#fbfdff', 'collar'); }
      // white stripes down the arms
      for (y = 40; y < S; y++) {
        var hw = bodyHW(y, ch.dw || 0);
        var d = hw - 4;
        if (d > 8) {
          b.set(23 - d, y, '#fbfdff', 'body', 1); b.set(24 + d, y, '#c4d6e8', 'body', 1);
        }
      }
      for (y = 41; y < S; y++) { b.set(23, y, '#c8d0da', 'body', 1); b.set(24, y, '#8a96a6', 'body', 1); }
    },
    cardigan: function (b, ch) {
      var P = { L: '#b48ad4', B: '#8a5cb0', S: '#653e8a', D: '#46286a' };
      torso(b, P, ch.dw || 0);
      for (var y = 36; y < S; y++) for (var x = 0; x < S; x++) {
        var dx = dxOf(x);
        var v = y <= 38 ? 4 : Math.max(0, 4 - (y - 38));
        if (dx < v) b.set(x, y, ch.skin.S, 'neck');
      }
      // apron bib + straps
      var AP = { B: '#3c5088', S: '#28366a', L: '#5a70aa' };
      for (y = 40; y < S; y++) for (x = 0; x < S; x++) {
        dx = dxOf(x);
        var bw = y < 41 ? 0 : 7;
        if (dx < bw) b.set(x, y, x >= 24 && dx > 4 ? AP.S : AP.B, 'collar');
      }
      spans(b, [[37, 18, 19, 28, 29], [38, 17, 18, 29, 30], [39, 17, 18, 29, 30], [40, 16, 17, 30, 31]], AP.B, 'collar');
    },
    suit: function (b, ch) {
      var SU = { L: '#6e6684', B: '#4c465c', S: '#363046', D: '#262234' };
      torso(b, SU, ch.dw || 0);
      for (var y = 36; y < S; y++) for (var x = 0; x < S; x++) {
        var dx = dxOf(x);
        var v = y <= 38 ? 6 : Math.max(0, 6 - Math.floor((y - 38) * 0.75));
        if (dx < v) {
          b.set(x, y, dx < 2 && y >= 38 ? (x < 24 ? '#c8404a' : '#8a2230') : '#f4f2f0', 'collar');
          if (y <= 37) b.set(x, y, ch.skin.S, 'neck');
        } else if (dx < v + 2 && y >= 38) {
          b.set(x, y, SU.L, 'body');
        }
      }
      // tie knot
      spans(b, [[38, 22, 25], [39, 22, 25]], function (x) { return x < 24 ? '#d04a52' : '#9a2a36'; }, 'acc');
    }
  };

  // ------------------------------------------------------------------ face
  function drawFace(b, ch, e) {
    var sk = ch.skin;
    var style = EYES[ch.eye];
    var eyeRows = (ch.eyeOverride && ch.eyeOverride[e]) || style[e] || style.normal;
    var epal = { K: ch.lash || OUT, W: SCLERA, H: WHITE, P: ch.iris.P, I: ch.iris.I, i: ch.iris.i, S: sk.S, L: TEAR };
    var ex = ch.eyeX, ey = ch.eyeY;
    // cheeks blush
    var blush = ch.blush === 'always' || (e === 'happy' && ch.blush !== false);
    if (blush) {
      var by = ey + 7;
      var bl = ['BbBbB', '.BBB.'];
      pmapSym(b, ex - 1, by, bl, { B: BLUSH, b: BLUSH2 }, 'head', 1);
    }
    pmapSym(b, ex, ey, eyeRows, epal, 'head', 1);

    // brows
    var br = BROWS[(ch.browAs && ch.browAs[e]) || e] || BROWS.normal;
    var bcol = ch.brow.col;
    var browRows = br.rows;
    var bx = ex + (ch.brow.dx || 0), byy = ch.eyeY - 3 + br.dy + (ch.brow.dy || 0);
    for (var t = 0; t < (ch.brow.thick || 1); t++) {
      pmapSym(b, bx, byy + t, browRows, { b: t === 0 ? bcol : (ch.brow.col2 || bcol) }, 'head', 1);
    }

    // nose
    var ny = ch.noseY || (ey + 8);
    if (ch.nose !== false) {
      b.set(24, ny, sk.S, 'head', 1);
      b.set(24, ny - 1, sk.S, 'head', 1);
      b.set(23, ny - 2, sk.L, 'head', 1);
    }

    // mouth
    var mrows = (ch.mouths && ch.mouths[e]) || (ch.mouths && ch.mouths._all) || MOUTHS[e] || MOUTHS.normal;
    if (mrows !== 'none') {
      var mw = mrows[0].length;
      var mx = 24 - Math.floor(mw / 2) + (ch.mouthDx || 0);
      pmap(b, mx, ch.mouthY || 32, mrows, MOUTH_PAL, 'head', 1);
    }
    if (ch.face) ch.face(b, e);
  }

  // ------------------------------------------------------------------ passes
  function shadeSkin(b, ch) {
    var sk = ch.skin;
    var nc = b.c.slice();
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var i = y * S + x;
      if (b.p[i] !== Z.head || b.k[i]) continue;
      var up = b.part(x, y - 1), upk = y > 0 ? b.k[i - S] : 0;
      if (up === Z.hair || (up === Z.acc && !upk) || up === Z.beard) { nc[i] = sk.S; continue; }
      if (x >= 27 && (b.part(x + 1, y) !== Z.head || b.part(x + 2, y) !== Z.head)) { nc[i] = sk.S; continue; }
      if (y >= 30 && x >= 18 && b.part(x, y + 2) !== Z.head && b.part(x, y + 1) === Z.head) { nc[i] = sk.S; continue; }
    }
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      i = y * S + x;
      if (b.p[i] !== Z.neck) continue;
      if (b.part(x, y - 1) === Z.head || b.part(x, y - 2) === Z.head) nc[i] = sk.D;
    }
    b.c = nc;
  }

  function outlinePass(b, ch) {
    var nc = b.c.slice();
    var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var i = y * S + x, p = b.p[i];
      if (p < 0 || b.k[i]) continue;
      for (var n = 0; n < 4; n++) {
        var q = b.part(x + nb[n][0], y + nb[n][1]);
        if (q === -2) { if (nb[n][1] === 1 || p <= Z.collar) continue; nc[i] = OUT; break; }
        if (q === -1) { nc[i] = OUT; break; }
        if (q < p) {
          var lc = OUT;
          if (p === Z.hair && ch.hairLine) lc = ch.hairLine;
          if (p === Z.beard && ch.beardLine) lc = ch.beardLine;
          if (p === Z.head && ch.skinLine && q !== Z.neck) lc = ch.skinLine;
          nc[i] = lc; break;
        }
      }
    }
    b.c = nc;
  }

  function fx(b, ch, e) {
    if (e === 'surprised') {
      var sx = ch.sweatX || 38, sy = ch.sweatY || 12;
      pmap(b, sx, sy, ['..o..', '.oLo.', 'oLLLo', 'oWLLo', '.ooo.'], { o: OUT, L: '#8fd0ff', W: WHITE }, 'fx', 1);
    }
    if (e === 'sad' && ch.tearStream) {
      var tx = ch.eyeX + 2;
      for (var y = ch.eyeY + 6; y < ch.eyeY + 11; y++) { b.set(tx, y, TEAR, 'fx', 1); b.set(mir(tx), y, TEAR, 'fx', 1); }
    }
  }

  // ------------------------------------------------------------------ characters
  var C = {};

  // おタキ婆 — club owner, takoyaki stall
  C.otaki = {
    skin: SKIN.old, head: 'old', body: 'cardigan', dw: -3,
    eye: 'small', eyeX: 14, eyeY: 21, iris: { I: '#5a3a2a', i: '#8a5a3a', P: '#3a2218' },
    brow: { col: '#9a9290', thick: 1, dy: -1 },
    blush: 'always', mouthY: 31,
    mouths: {
      normal: ['mmmmmmmm', 'mTTMTTTm', '.mMttMm.', '..mmmm..'],
      happy: ['mmmmmmmm', 'mTTMTTTm', 'mMMMMMMm', '.mMttMm.', '..mmmm..'],
      surprised: ['.mmmm.', 'mMMMMm', 'mMttMm', '.mmmm.'],
      determined: ['mmmmmmmm', 'mTTMTTTm', '.mmmmmm.'],
      sad: ['..mmmm..', '.m....m.', 'm......m']
    },
    hairPal: { h: '#ffffff', H: '#d8d4d8', d: '#a8a0aa', D: '#7a7280' }, hairLine: '#5a4e5a',
    hair: { shape: [[14, 9, 13, 34, 38], [15, 9, 12, 35, 38], [16, 9, 12, 35, 38], [17, 9, 11, 36, 38], [18, 10, 11, 36, 37], [19, 10, 11, 36, 37]] },
    acc: function (b) {
      var R = { L: '#f26a5a', B: '#d83a3a', S: '#a02432', D: '#76182a' };
      var sh = [
        [0, 16, 19, 28, 31], [1, 15, 20, 27, 32], [2, 15, 21, 26, 32], [3, 16, 22, 25, 31], [4, 18, 29],
        [5, 14, 33], [6, 12, 35], [7, 10, 37], [8, 9, 38], [9, 8, 39], [10, 8, 39], [11, 8, 39], [12, 8, 39],
        [13, 8, 39], [14, 8, 13, 34, 39], [15, 8, 9, 38, 39], [16, 8, 8, 39, 39]
      ];
      spans(b, sh, function (x, y) {
        var c = R.B;
        if (y >= 12 && x >= 30) c = R.S;
        if (x >= 34 && y >= 8) c = R.S;
        if (y <= 3 && (x === 20 || x === 21 || x === 31 || x === 32)) c = R.S;
        if (y >= 5 && y <= 7 && x < 22) c = R.L;
        return c;
      }, 'acc');
      // front hem
      spans(b, [[13, 14, 33]], R.S, 'acc');
      // knot centre
      spans(b, [[3, 22, 25], [4, 22, 25], [5, 22, 25]], R.S, 'acc');
      // round thick glasses
      var ring = ['..FFFF..', '.F....F.', 'F......F', 'F......F', 'F......F', 'F......F', '.F....F.', '..FFFF..'];
      pmap(b, 13, 19, ring, { F: '#6a3a24' }, 'acc', 1);
      pmap(b, 27, 19, ring, { F: '#6a3a24' }, 'acc', 1);
      spans(b, [[21, 21, 26]], '#6a3a24', 'acc', 1);
      spans(b, [[21, 11, 12, 35, 36]], '#6a3a24', 'acc', 1);
      pmap(b, 14, 20, ['gg', 'g.'], { g: '#e8f8ff' }, 'acc', 1);
      pmap(b, 28, 20, ['gg', 'g.'], { g: '#e8f8ff' }, 'acc', 1);
    },
    face: function (b, e) {
      var D = SKIN.old.D, Sh = SKIN.old.S;
      // smile lines + cheek wrinkles
      b.set(15, 30, Sh, 'head', 1); b.set(16, 31, Sh, 'head', 1);
      b.set(32, 30, Sh, 'head', 1); b.set(31, 31, Sh, 'head', 1);
      b.set(21, 36, Sh, 'head', 1); b.set(22, 36, Sh, 'head', 1); b.set(25, 36, Sh, 'head', 1); b.set(26, 36, Sh, 'head', 1);
      b.set(12, 23, D, 'head', 1); b.set(35, 23, D, 'head', 1);
    },
    post: function (b) {
      // white polka dots on the headscarf
      for (var y = 0; y < 17; y++) for (var x = 0; x < S; x++) {
        if (b.part(x, y) !== Z.acc || b.k[y * S + x]) continue;
        var c = b.col(x, y);
        if (c === OUT) continue;
        if (((x + 1) % 4 === 0 && (y % 4) === 1) || ((x + 3) % 4 === 0 && (y % 4) === 3)) {
          b.recolor(x, y, c === '#a02432' || c === '#76182a' ? '#e8c8c8' : '#fff4ec');
        }
      }
      // takoyaki badge on apron
      pmap(b, 21, 43, ['.bbbb.', 'bybbgb', 'bwwwwb', '.bbbb.'], { b: '#c8803a', y: '#f0b860', w: '#fff8f0', g: '#5aa040' }, 'fx', 1);
    }
  };

  // ナギサ — manager
  C.nagisa = {
    skin: SKIN.std, head: 'std', body: 'track', dw: -2,
    eye: 'big', eyeX: 14, eyeY: 20, iris: { I: '#2e9a5a', i: '#7ad89a', P: '#123e28' },
    brow: { col: '#6a2a20' }, blush: true,
    mouths: { normal: ['m....m', '.mmmm.'] },
    hairPal: { h: '#f2a070', H: '#c4623e', d: '#8e3a2a', D: '#5e2020' }, hairLine: '#4a1a1e',
    back: {
      shape: [[5, 35, 38], [6, 35, 41], [7, 36, 43], [8, 37, 44], [9, 38, 45], [10, 39, 45], [11, 39, 46], [12, 40, 46], [13, 40, 46], [14, 40, 46],
        [15, 40, 46], [16, 40, 45], [17, 40, 45], [18, 40, 45], [19, 40, 44], [20, 40, 44], [21, 40, 43], [22, 41, 43], [23, 41, 43], [24, 41, 42], [25, 41, 42], [26, 42, 42]],
      hi: [[9, 40, 41], [10, 41, 42], [11, 41, 42], [12, 42, 42]]
    },
    hair: {
      shape: [[7, 20, 27], [8, 20, 27], [9, 20, 27], [10, 20, 27], [11, 19, 28],
        [12, 9, 38], [13, 9, 38], [14, 9, 27, 30, 38], [15, 9, 24, 31, 38], [16, 9, 12, 14, 21, 33, 38],
        [17, 9, 11, 15, 18, 34, 38], [18, 9, 11, 16, 16, 35, 38], [19, 9, 11, 36, 38], [20, 9, 11, 37, 38], [21, 9, 11, 37, 38],
        [22, 9, 11, 37, 38], [23, 9, 10, 37, 38], [24, 9, 10, 37, 38], [25, 9, 10, 38, 38]],
      hi: [[13, 26, 30], [14, 20, 23], [15, 17, 19]], sh: [[14, 13, 13], [15, 12, 12], [13, 33, 33], [14, 34, 34]]
    },
    preBack: function (b) {
      // cap brim poking out behind (worn backwards)
      spans(b, [[6, 3, 9], [7, 2, 10], [8, 2, 10], [9, 3, 9]], function (x, y) { return y >= 8 ? '#1c2854' : '#2c3e7a'; }, 'hairB');
    },
    acc: function (b) {
      var CAP = { L: '#4a62a8', B: '#2c3e7a', S: '#1c2854' };
      var hole = { 8: [21, 26], 9: [20, 27], 10: [20, 27] };
      spans(b, [[3, 17, 30], [4, 14, 33], [5, 12, 35], [6, 11, 36], [7, 10, 37], [8, 9, 38], [9, 9, 38], [10, 9, 38], [11, 9, 38]], function (x, y) {
        var h = hole[y];
        if (h && x >= h[0] && x <= h[1]) return null;
        if (y === 11 && x >= 19 && x <= 28) return '#e8eef4';
        var c = CAP.B;
        if (x >= 31) c = CAP.S;
        if (y <= 6 && x <= 20 && x >= 14) c = CAP.L;
        if (x === 24 && y >= 3 && y <= 7) c = CAP.S;
        return c;
      }, 'acc');
      spans(b, [[2, 23, 24]], CAP.B, 'acc');
      // scrunchie where the ponytail leaves the cap
      spans(b, [[5, 36, 38], [6, 36, 39], [7, 37, 39]], function (x, y) { return y === 5 ? TEAM.L : TEAM.B; }, 'acc');
    },
    post: function (b) {
      // whistle on a cord
      var cord = '#e8eef4';
      var pts = [[18, 40], [18, 41], [19, 42], [20, 43], [21, 44], [29, 40], [29, 41], [28, 42]];
      for (var i = 0; i < pts.length; i++) b.set(pts[i][0], pts[i][1], cord, 'fx', 1);
      pmap(b, 21, 43, ['.ooooo.', 'oLLBBBo', 'oBBSSSo', '.ooo.oo'], { o: OUT, L: '#f4f8fc', B: '#c8d2dc', S: '#8a96a6' }, 'fx', 1);
    }
  };

  // ゲンさん — goalkeeper, fisherman
  C.gen = {
    skin: SKIN.tan, head: 'square', body: 'gk', dw: 1,
    eye: 'small', eyeX: 14, eyeY: 21, iris: { I: '#4a3020', i: '#6a4a30', P: '#2a1a14' },
    brow: { col: '#4a4644', col2: '#6a6660', thick: 2 },
    blush: false, mouthY: 32,
    mouths: {
      normal: ['m....m', '.mmmm.'],
      happy: ['mmmmmm', 'mTTTTm', '.mMMm.', '..mm..'],
      determined: ['mmmmmm', 'mTTTTm', 'mmmmmm']
    },
    hairPal: { h: '#c8c4bc', H: '#8e8a86', d: '#6a6662', D: '#4e4a48' }, hairLine: '#2a1a24',
    beardPal: { h: '#e0dcd4', H: '#c4c0b8', d: '#96928a', D: '#6e6a64' }, beardLine: '#4a4038',
    hair: {
      shape: [[4, 16, 31], [5, 13, 34], [6, 11, 36], [7, 10, 37], [8, 9, 38], [9, 9, 38], [10, 9, 38], [11, 9, 38], [12, 9, 38], [13, 9, 38],
        [14, 9, 11, 36, 38], [15, 9, 11, 36, 38], [16, 9, 10, 37, 38], [17, 9, 10, 37, 38], [18, 9, 10, 37, 38], [19, 9, 10, 37, 38], [20, 9, 9, 38, 38]],
      hi: [[5, 15, 18], [6, 13, 15, 19, 20]], sh: [[6, 22, 22, 28, 28], [7, 17, 17, 25, 25, 31, 31], [5, 26, 26]]
    },
    beard: {
      shape: [[30, 11, 13, 34, 36], [31, 11, 14, 19, 28, 33, 36], [32, 12, 19, 28, 35], [33, 12, 19, 28, 35], [34, 13, 20, 27, 34],
        [35, 14, 33], [36, 15, 32], [37, 17, 30], [38, 19, 28], [39, 21, 26]],
      hi: [[35, 16, 18], [36, 17, 19]]
    },
    acc: function (b) {
      var Wt = '#fdfdf8', Ws = '#d0d6e2', Bl = '#3a6ac8';
      spans(b, [[9, 8, 39], [10, 8, 39], [11, 8, 39], [12, 8, 39], [13, 8, 39]], function (x, y) {
        if (y === 11) return (x % 4 === 0) ? '#2a4e9a' : Bl;
        if ((x + y) % 4 === 0 && y !== 10) return Ws;
        return x >= 32 ? Ws : Wt;
      }, 'acc');
      // knot + tails at the right
      spans(b, [[7, 32, 36], [8, 31, 37], [14, 31, 36], [15, 32, 35]], function (x) { return x >= 34 ? Ws : Wt; }, 'acc');
      spans(b, [[4, 38, 40], [5, 37, 42], [6, 37, 43], [7, 38, 43], [8, 39, 42]], function (x, y) { return y === 5 && x < 41 ? Wt : Ws; }, 'acc');
      spans(b, [[14, 37, 41], [15, 37, 43], [16, 39, 44], [17, 41, 44]], function (x, y) { return y === 15 ? Bl : Ws; }, 'acc');
    },
    face: function (b) {
      var D = SKIN.tan.D;
      b.set(12, 22, D, 'head', 1); b.set(12, 24, D, 'head', 1); b.set(35, 22, D, 'head', 1); b.set(35, 24, D, 'head', 1);
      b.set(17, 29, D, 'head', 1); b.set(30, 29, D, 'head', 1);
    }
  };

  // モリオ — gentle giant DF
  C.morio = {
    skin: SKIN.std, head: 'wide', body: 'team', dw: 2,
    eye: 'sleepy', eyeX: 13, eyeY: 21, iris: { I: '#5a3a2a', i: '#8a5a3a', P: '#2a1a1a' },
    brow: { col: '#2a2a36', dy: 0 }, blush: 'always',
    eyeOverride: { normal: ['......', '.SSSS.', 'KKKKKK', 'KWPHPW', '..PIP.', '......'] },
    mouthY: 32,
    mouths: { normal: ['mm'], sad: ['.mm.', 'm..m'], determined: ['mmmm'], happy: ['m..m', '.mm.'] },
    hairPal: { h: '#6a6a80', H: '#34343e', d: '#24242c', D: '#18181e' },
    hair: {
      shape: [[3, 16, 31], [4, 13, 34], [5, 11, 36], [6, 9, 38], [7, 8, 39], [8, 7, 40], [9, 6, 41], [10, 6, 41], [11, 5, 42], [12, 5, 42],
        [13, 5, 42], [14, 5, 42], [15, 5, 42], [16, 5, 42], [17, 5, 42], [18, 5, 9, 38, 42], [19, 5, 8, 39, 42], [20, 5, 8, 39, 42], [21, 6, 7, 40, 41]],
      hi: [[6, 14, 19, 23, 26], [7, 12, 14, 20, 22], [8, 11, 12]],
      sh: [[13, 11, 11, 16, 16, 21, 21, 26, 26, 31, 31, 36, 36], [14, 11, 11, 16, 16, 21, 21, 26, 26, 31, 31, 36, 36], [15, 16, 16, 26, 26, 36, 36]]
    }
  };

  // ツバメ — speedy fullback
  C.tsubame = {
    skin: SKIN.std, head: 'std', body: 'team', dw: -2,
    eye: 'big', eyeX: 14, eyeY: 20, iris: { I: '#1e8a8a', i: '#5ad0c0', P: '#0e3a40' },
    brow: { col: '#1a2040' }, blush: true, noseY: 29,
    mouthY: 32,
    mouths: {
      normal: ['m....m', '.mmmm.', '..f...'],
      happy: ['mmmmmm', 'mfMMTm', '.mttm.', '..mm..'],
      determined: ['mmmmmm', 'mfTTTm', '.mmmm.'],
      sad: ['.mm.', 'm..m']
    },
    hairPal: { h: '#6a80c0', H: '#34406e', d: '#222a4a', D: '#161a30' },
    hair: {
      shape: [[1, 25, 26], [2, 24, 27], [3, 17, 30], [4, 14, 33], [5, 12, 35], [6, 10, 37], [7, 9, 38], [8, 8, 39], [9, 8, 39], [10, 8, 39], [11, 8, 39], [12, 8, 39], [13, 8, 39],
        [14, 8, 39], [15, 8, 19, 21, 27, 29, 39], [16, 8, 17, 21, 26, 31, 39], [17, 8, 15, 22, 25, 32, 39], [18, 8, 14, 23, 24, 33, 39],
        [19, 8, 13, 34, 39], [20, 8, 12, 35, 39], [21, 8, 12, 35, 39], [22, 8, 12, 35, 39], [23, 8, 12, 35, 39], [24, 8, 12, 35, 39], [25, 8, 12, 35, 39],
        [26, 7, 12, 35, 40], [27, 7, 12, 35, 40], [28, 6, 12, 35, 41], [29, 5, 12, 35, 42], [30, 4, 7, 10, 12, 35, 37, 40, 43], [31, 3, 5, 11, 12, 36, 36, 41, 44], [32, 42, 44]],
      hi: [[5, 15, 18, 22, 24], [6, 13, 15, 20, 21], [7, 12, 13]]
    },
    face: function (b) {
      // band-aid across the nose
      pmap(b, 21, 25, ['.oooo.', 'oTppTo', 'osssso', '.oooo.'], { o: '#a86c4a', T: '#f8dca6', p: '#dcae84', s: '#e8c290' }, 'head', 1);
    }
  };

  // カズハ — quiet playmaker
  C.kazuha = {
    skin: SKIN.fair, head: 'slender', body: 'team', dw: -1,
    eye: 'calm', eyeX: 14, eyeY: 20, iris: { I: '#4a5a8a', i: '#8a9ac8', P: '#1e2440' },
    brow: { col: '#2a2130', dy: -1 }, blush: true,
    mouths: { normal: ['mmm.'], determined: ['mmmm'], happy: ['m..m', '.mm.'] },
    hairPal: { h: '#7a6a8a', H: '#3e3248', d: '#2a2032', D: '#1c1622' },
    hair: {
      shape: [[4, 16, 31], [5, 13, 34], [6, 11, 36], [7, 10, 37], [8, 9, 38], [9, 9, 38], [10, 9, 38], [11, 8, 39], [12, 8, 39], [13, 8, 39],
        [14, 8, 15, 17, 39], [15, 8, 14, 18, 39], [16, 8, 13, 20, 39], [17, 8, 12, 23, 39], [18, 8, 11, 27, 38], [19, 8, 11, 31, 38], [20, 8, 10, 34, 38],
        [21, 8, 10, 36, 38], [22, 9, 10, 37, 38], [23, 9, 10, 37, 38], [24, 9, 9, 37, 38]],
      hi: [[7, 20, 26], [8, 22, 29], [9, 26, 30], [6, 13, 14]],
      sh: [[5, 17, 17], [6, 17, 17], [7, 16, 16], [8, 16, 16], [9, 16, 16], [10, 16, 16], [11, 16, 16], [12, 16, 16], [13, 16, 16], [12, 24, 24, 30, 30], [13, 25, 25, 31, 31], [14, 26, 26, 32, 32]]
    },
    acc: function (b) {
      var F = '#3a3340';
      var rect = ['FFFFFFFFFF', 'F........F', 'F........F', 'F........F', 'F........F', 'F........F', 'FFFFFFFFFF'];
      pmap(b, 12, 19, rect, { F: F }, 'acc', 1);
      pmap(b, 26, 19, rect, { F: F }, 'acc', 1);
      spans(b, [[21, 22, 25], [21, 10, 11, 36, 37]], F, 'acc', 1);
      pmap(b, 19, 20, ['.g', 'g.'], { g: '#e8f6ff' }, 'acc', 1);
      pmap(b, 33, 20, ['.g', 'g.'], { g: '#e8f6ff' }, 'acc', 1);
    }
  };

  // ポン太 — jolly joker
  C.ponta = {
    skin: SKIN.std, head: 'round', body: 'team', dw: 1,
    eye: 'round', eyeX: 14, eyeY: 21, iris: { I: '#2a1a24', i: '#4a3040', P: '#2a1a24' },
    brow: { col: '#8a4a1a', dy: 0 }, blush: 'always', noseY: 28,
    mouthY: 31,
    mouths: {
      normal: ['mmmmmm', 'mTTTTm', '.mttm.', '..mm..'],
      happy: ['mmmmmmmm', 'mTTTTTTm', 'mMMMMMMm', '.mMttMm.', '..mmmm..'],
      sad: ['.mmmm.', 'm....m']
    },
    hairPal: { h: '#fcd08a', H: '#e08a38', d: '#a85a24', D: '#743a18' }, hairLine: '#4a2414',
    hair: {
      shape: [[1, 20, 20, 27, 27], [2, 15, 15, 19, 21, 26, 28, 32, 32], [3, 14, 16, 18, 22, 25, 29, 31, 33], [4, 11, 36], [5, 9, 38], [6, 8, 39], [7, 8, 39],
        [8, 8, 39], [9, 8, 39], [10, 8, 39], [11, 8, 39], [12, 8, 39], [13, 8, 15, 17, 22, 24, 30, 32, 39], [14, 8, 13, 18, 21, 25, 29, 33, 39],
        [15, 8, 11, 19, 20, 26, 28, 35, 39], [16, 8, 10, 37, 39], [17, 8, 10, 37, 39], [18, 8, 9, 38, 39], [6, 6, 7, 40, 41], [7, 6, 7, 40, 41]],
      hi: [[5, 14, 18], [6, 12, 14, 20, 22], [4, 17, 19]]
    },
    face: function (b) {
      // rice grain on the cheek
      pmap(b, 33, 29, ['.o.', 'oWo', 'oWo', '.o.'], { o: '#b89a80', W: '#fffef6' }, 'head', 1);
    }
  };

  // レオ — cocky striker
  C.leo = {
    skin: SKIN.std, head: 'std', body: 'team', dw: 0,
    eye: 'sharp', eyeX: 14, eyeY: 21, iris: { I: '#2a7ad0', i: '#7ac0ff', P: '#102a5a' },
    brow: { col: '#a8702a', dy: 0 },
    mouths: {
      normal: ['.....m', 'mmmmm.'],
      happy: ['mmmmmm', 'mTTTTm', '.mmmm.'],
      determined: ['mmmmmm', 'mTTTTm', '.mmm..'],
      sad: ['.mmm.', 'm...m']
    },
    hairPal: { h: '#fff4b0', H: '#f2c850', d: '#c88e34', D: '#8a5a24' }, hairLine: '#6a3a1e',
    back: {
      base: 'd',
      shape: [[7, 11, 36], [8, 10, 37], [9, 9, 38], [10, 9, 38], [11, 9, 38], [12, 9, 38], [13, 9, 38], [14, 9, 38], [15, 9, 38], [16, 9, 38],
        [17, 9, 38], [18, 9, 38], [19, 9, 38], [20, 10, 37]]
    },
    hair: {
      shape: [[0, 12, 24], [1, 9, 28], [2, 7, 31], [3, 6, 33], [4, 5, 34], [5, 5, 35], [6, 6, 35], [7, 7, 35], [8, 9, 34], [9, 11, 34],
        [10, 12, 33], [11, 13, 19, 23, 32], [12, 14, 17, 26, 30], [13, 15, 16]],
      hi: [[1, 12, 17], [2, 10, 11, 18, 21], [3, 8, 9, 15, 18, 22, 25], [4, 7, 7, 19, 21, 26, 29], [5, 22, 24, 30, 32], [6, 25, 27], [7, 14, 17], [8, 17, 20], [9, 21, 23]],
      sh: [[2, 22, 24], [3, 19, 21], [4, 16, 18], [5, 14, 15], [6, 12, 13], [7, 10, 11],
        [3, 28, 30], [4, 30, 31], [7, 21, 23], [6, 24, 24], [5, 27, 29], [4, 32, 33], [8, 19, 20], [9, 17, 18], [10, 15, 16],
        [8, 29, 31], [9, 27, 28], [10, 25, 26], [11, 24, 24]]
    },
    face: function (b) {
      // gold hoop earring on his right ear (viewer's right)
      pmap(b, 37, 27, ['.o.', 'oYo', 'oyo', '.o.'], { o: '#6a3a1e', Y: '#ffe25a', y: '#d49a2a' }, 'fx', 1);
    }
  };

  // ハルキ — rookie forward
  C.haruki = {
    skin: SKIN.std, head: 'std', body: 'team', dw: -1,
    eye: 'big', eyeX: 14, eyeY: 20, iris: { I: '#c8702a', i: '#f8b050', P: '#4a220e' },
    brow: { col: '#4a2416', dy: 0 }, blush: true,
    mouths: { normal: ['m....m', '.mmmm.'] },
    hairPal: { h: '#e4a868', H: '#a8643a', d: '#744024', D: '#4e2818' }, hairLine: '#3a1a14',
    hair: {
      shape: [[0, 14, 15, 27, 28], [1, 13, 17, 26, 29], [2, 13, 19, 22, 23, 25, 31, 35, 36], [3, 12, 32, 34, 37], [4, 9, 10, 12, 38], [5, 7, 39], [6, 5, 40], [7, 4, 40], [8, 5, 40],
        [9, 6, 40], [10, 7, 39], [11, 8, 39], [12, 8, 39], [13, 8, 39], [14, 6, 38], [15, 5, 13, 15, 21, 23, 30, 32, 38], [16, 6, 12, 16, 20, 24, 29, 33, 39],
        [17, 7, 11, 17, 19, 25, 28, 34, 39], [18, 8, 10, 18, 18, 26, 27, 35, 38], [19, 9, 10, 36, 37], [20, 9, 10, 37, 37]],
      hi: [[3, 15, 18], [4, 13, 15, 24, 27], [5, 11, 13, 20, 23, 30, 31], [6, 10, 11, 18, 19, 29, 29], [7, 8, 9]],
      sh: [[2, 21, 21], [3, 21, 21, 33, 33], [4, 20, 20, 32, 32], [5, 19, 19], [6, 16, 16, 25, 25], [7, 15, 15, 24, 24], [15, 8, 8], [16, 9, 9]]
    },
    acc: function (b) {
      var r = '#e2403c', R = '#a8283a', w = '#ff8a6a';
      spans(b, [[10, 8, 39], [11, 8, 39], [12, 8, 39], [13, 8, 39]], function (x, y) { return y === 11 && x < 24 ? w : (y === 12 && x >= 28 ? R : r); }, 'acc');
      spans(b, [[9, 36, 40], [14, 36, 40]], R, 'acc');
      spans(b, [[6, 41, 43], [7, 40, 45], [8, 40, 46], [9, 41, 46], [10, 43, 45]], function (x, y) { return y <= 7 ? r : R; }, 'acc');
      spans(b, [[13, 41, 44], [14, 41, 46], [15, 42, 47], [16, 43, 47], [17, 45, 47]], function (x, y) { return y <= 14 ? r : R; }, 'acc');
    },
    face: function (b) {
      var F = '#d08a6a';
      var fr = [[13, 27], [15, 28], [16, 26], [34, 27], [32, 28], [31, 26]];
      for (var i = 0; i < fr.length; i++) b.set(fr[i][0], fr[i][1], F, 'head', 1);
    }
  };

  // 鉄山 — rival captain
  C.tetsuyama = {
    skin: SKIN.mid, head: 'square', body: 'rival', dw: 1,
    eye: 'small', eyeX: 14, eyeY: 21, iris: { I: '#3a2418', i: '#6a3a24', P: '#1a1010' },
    brow: { col: '#1e1a20', thick: 2 }, blush: false,
    browAs: { normal: 'determined', happy: 'normal' },
    mouths: {
      normal: ['mmmmmm'],
      happy: ['m....m', '.mmmm.'],
      determined: ['mmmmmm', 'mTTTTm', 'mmmmmm'],
      sad: ['.mmmm.', 'm....m']
    },
    hairPal: { h: '#5a5462', H: '#2e2a34', d: '#201c26', D: '#16121a' },
    hair: {
      shape: [[4, 15, 32], [5, 12, 35], [6, 10, 37], [7, 9, 38], [8, 9, 38], [9, 9, 38], [10, 9, 38], [11, 9, 38], [12, 9, 38],
        [13, 9, 11, 36, 38], [14, 9, 10, 37, 38], [15, 9, 10, 37, 38], [16, 9, 10, 37, 38], [17, 9, 9, 38, 38]],
      hi: [[5, 15, 16, 19, 20, 23, 24], [6, 13, 14, 17, 18, 21, 22]]
    },
    acc: function (b) {
      spans(b, [[10, 8, 39], [11, 8, 39], [12, 8, 39]], function (x, y) { return y === 10 ? '#6a5040' : '#4a3830'; }, 'acc');
      var lens = ['..rrrr..', '.rRRRRr.', 'rRGgGGRr', 'rRGGGGRr', 'rRGGGGRr', '.rRRRRr.', '..rrrr..'];
      var pal = { r: '#c8ced6', R: '#7a828c', G: '#2e5a58', g: '#a6e2da' };
      pmap(b, 13, 8, lens, pal, 'acc');
      pmap(b, 27, 8, lens, pal, 'acc');
    },
    face: function (b, e) {
      // scar slicing through the left brow
      var L = '#f6c2b0', D = SKIN.mid.D;
      var pts = [[15, 15], [16, 16], [16, 17], [17, 18], [17, 19]];
      for (var i = 0; i < pts.length; i++) {
        b.set(pts[i][0], pts[i][1], L, 'head', 1);
        b.set(pts[i][0] + 1, pts[i][1], D, 'head', 1);
      }
    }
  };

  // 雪丸 — rival winger
  C.yukimaru = {
    skin: SKIN.fair, head: 'slender', body: 'rival', dw: -1,
    eye: 'sharp', eyeX: 14, eyeY: 21, iris: { I: '#7a5ab8', i: '#bca0f0', P: '#2a1a4a' },
    brow: { col: '#8a8aa8', dy: 0 },
    mouths: { normal: ['mm'], happy: ['.....m', 'mmmmm.'], determined: ['mmmm'], sad: ['.mm.', 'm..m'] },
    hairPal: { h: '#ffffff', H: '#dcdfee', d: '#a8aec8', D: '#787e9c' }, hairLine: '#4e4e6e',
    back: {
      base: 'd',
      shape: [[10, 8, 39], [11, 7, 40], [12, 7, 40], [13, 7, 40], [14, 7, 40], [15, 7, 40], [16, 7, 40], [17, 6, 41], [18, 6, 41], [19, 6, 41],
        [20, 6, 41], [21, 6, 41], [22, 6, 41], [23, 5, 42], [24, 5, 42], [25, 5, 42], [26, 5, 42], [27, 5, 42], [28, 5, 42], [29, 5, 42], [30, 5, 42],
        [31, 5, 14, 33, 42], [32, 5, 13, 34, 42], [33, 5, 13, 34, 41], [34, 6, 9, 11, 12, 35, 36, 38, 41], [35, 6, 8, 11, 12, 35, 36, 39, 41],
        [36, 7, 8, 12, 12, 35, 35, 40, 41], [37, 7, 7, 41, 41]],
      hi: [[20, 6, 6], [21, 6, 6], [22, 6, 6], [26, 5, 5], [27, 5, 5]]
    },
    hair: {
      shape: [[3, 17, 30], [4, 14, 34], [5, 12, 36], [6, 11, 37], [7, 10, 38], [8, 9, 38], [9, 9, 39], [10, 9, 39], [11, 8, 39], [12, 8, 39], [13, 8, 39],
        [14, 8, 14, 17, 39], [15, 8, 13, 18, 39], [16, 8, 12, 20, 39], [17, 8, 12, 21, 39], [18, 8, 11, 22, 38], [19, 8, 11, 23, 38], [20, 8, 11, 24, 38],
        [21, 8, 10, 25, 38], [22, 8, 10, 26, 38], [23, 8, 10, 26, 38], [24, 8, 10, 26, 38], [25, 8, 10, 26, 38], [26, 8, 10, 27, 38], [27, 8, 10, 27, 38],
        [28, 8, 10, 28, 37], [29, 8, 10, 30, 37], [30, 8, 10, 32, 36], [31, 8, 10, 34, 35], [32, 8, 10], [33, 8, 10], [34, 9, 10]],
      hi: [[5, 16, 20], [6, 14, 16, 21, 24], [7, 13, 14], [12, 27, 31], [13, 29, 33], [14, 31, 34]],
      sh: [[15, 22, 22], [16, 24, 24], [17, 26, 26], [18, 28, 28], [19, 29, 29], [20, 31, 31], [21, 31, 31]]
    }
  };

  // 鬼瓦 — rival coach
  C.onigawara = {
    skin: SKIN.ruddy, head: 'bald', body: 'suit', dw: 2,
    eye: 'small', eyeX: 13, eyeY: 21, iris: { I: '#1a1418', i: '#3a2a2a', P: '#1a1418' },
    brow: { col: '#1a161e', thick: 3, dy: -1 }, blush: false, noseY: 28, mouthY: 34,
    tearStream: true,
    mouths: {
      normal: 'none',
      happy: ['mmmmmmmm', 'mTTTTTTm', '.mmmmmm.'],
      surprised: ['.mmmm.', 'mMMMMm', 'mMttMm', '.mmmm.'],
      determined: ['mmmmmmmm', 'mTmTTmTm', 'mmmmmmmm'],
      sad: ['.mmmm.', 'm....m']
    },
    hairPal: { h: '#4a4454', H: '#26222c', d: '#1a161e', D: '#121016' },
    beardPal: { h: '#5a5464', H: '#2a2630', d: '#1c1822', D: '#141018' },
    hair: { shape: [[15, 8, 10, 37, 39], [16, 8, 10, 37, 39], [17, 8, 10, 37, 39], [18, 8, 10, 37, 39], [19, 8, 9, 38, 39], [20, 8, 9, 38, 39]] },
    beard: {
      shape: [[26, 5, 6, 41, 42], [27, 5, 7, 40, 42], [28, 5, 8, 17, 22, 25, 30, 39, 42], [29, 6, 41], [30, 7, 40], [31, 9, 38], [32, 11, 20, 27, 36], [33, 14, 19, 28, 33]],
      hi: [[29, 12, 16, 20, 22], [30, 10, 12]]
    },
    face: function (b) {
      var D = SKIN.ruddy.D, Sh = SKIN.ruddy.S;
      // forehead creases
      spans(b, [[12, 18, 22, 25, 29], [14, 19, 28]], Sh, 'head', 1);
      b.set(23, 26, Sh, 'head', 1); b.set(24, 26, Sh, 'head', 1);
      b.set(22, 28, D, 'head', 1); b.set(25, 28, D, 'head', 1);
    },
    post: function (b) {
      // scalp shine
      var L = '#fff0e0';
      spans(b, [[6, 16, 18], [7, 14, 15], [8, 13, 13]], L, 'fx', 1);
      b.set(20, 6, L, 'fx', 1);
    }
  };

  var IDS = ['otaki', 'nagisa', 'gen', 'morio', 'tsubame', 'kazuha', 'ponta', 'leo', 'haruki', 'tetsuyama', 'yukimaru', 'onigawara'];

  // ------------------------------------------------------------------ render
  function build(id, e) {
    var ch = C[id];
    var b = new Buf();
    if (ch.back) maskLayer(b, ch.back, ch.hairPal, 'hairB');
    if (ch.preBack) ch.preBack(b, e);
    neck(b, ch.skin, ch.neckW || 5);
    BODIES[ch.body](b, ch, e);
    var prof = PROFILES[ch.head];
    // ears
    var ey0 = 21;
    var hwE = profW(prof, 24);
    var ear = [[21, 1, 2], [22, 0, 2], [23, 0, 2], [24, 0, 2], [25, 0, 2], [26, 0, 2], [27, 1, 2]];
    for (var r = 0; r < ear.length; r++) {
      var ey = ear[r][0];
      for (var c = ear[r][1]; c <= ear[r][2]; c++) {
        var xl = 24 - hwE - 3 + c;
        var col = (c === 2 && ey >= 23 && ey <= 25) ? ch.skin.S : ch.skin.B;
        b.set(xl, ey, col, 'ear'); b.set(mir(xl), ey, col, 'ear');
      }
    }
    // head
    for (var y = prof.top; y < prof.top + prof.w.length; y++) {
      var w = profW(prof, y);
      for (var x = 24 - w; x <= 23 + w; x++) b.set(x, y, ch.skin.B, 'head');
    }
    drawFace(b, ch, e);
    if (ch.beard) maskLayer(b, ch.beard, ch.beardPal, 'beard');
    if (ch.hair) maskLayer(b, ch.hair, ch.hairPal, 'hair');
    if (ch.acc) ch.acc(b, e);
    shadeSkin(b, ch);
    outlinePass(b, ch);
    if (ch.post) ch.post(b, e);
    fx(b, ch, e);
    return b;
  }

  var rgbCache = {};
  function rgb(hex) {
    var v = rgbCache[hex];
    if (!v) {
      v = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      rgbCache[hex] = v;
    }
    return v;
  }
  function toCanvas(b) {
    var cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    var g = cv.getContext('2d');
    var img = g.createImageData(S, S);
    for (var i = 0; i < S * S; i++) {
      var h = b.c[i];
      if (!h) continue;
      var v = rgb(h);
      img.data[i * 4] = v[0]; img.data[i * 4 + 1] = v[1]; img.data[i * 4 + 2] = v[2]; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }

  var cache = {};
  function get(id, expr) {
    if (EXPRS.indexOf(expr) < 0) expr = 'normal';
    var key = id + ':' + expr;
    if (cache[key]) return cache[key];
    var cv;
    if (!C[id]) {
      cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    } else {
      cv = toCanvas(build(id, expr));
    }
    cache[key] = cv;
    return cv;
  }

  window.Portraits = {
    SIZE: S,
    ids: IDS.slice(),
    exprs: EXPRS.slice(),
    get: get
  };
})();
