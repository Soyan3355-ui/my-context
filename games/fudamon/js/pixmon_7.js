/* 封札モンスターズ — evolved monster sprites, set 7 (ids 51–60, evolutions of 21–30).
 * 80x80 front-facing battle sprites at SFC density. Requires pixkit.js (v3). All designs are original. */
(function () {
  'use strict';
  var P = window.PIXMON = window.PIXMON || {};
  var C = 40; // centre line

  // hand pixel map: rows of chars, pal maps char -> [material, tone]; '.' = skip
  function pm(k, x, y, rows, pal) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      var e = pal[rows[j][i]];
      if (e) k.px(x + i, y + j, e[0], e[1]);
    }
  }
  // mirrored pixel map (for the right-hand copy of a symmetric feature)
  function pmx(k, x, y, rows, pal) { pm(k, x, y, rows.map(function (r) { return r.split('').reverse().join(''); }), pal); }
  // small floating ghost-fire wisp (glow)
  function wisp(k, cx, cy, s, id, mat, halo) {
    var o = { part: id, shade: 'glow', halo: halo == null ? 0.3 : halo };
    k.tube([[cx, cy, 3 * s], [cx + 0.6 * s, cy - 3.5 * s, 2 * s], [cx - 1 * s, cy - 8 * s, 0.5]], mat || 'violet', o);
    k.spike(cx + 1.8 * s, cy - 2.5 * s, cx + 4 * s, cy - 6.5 * s, 2.2 * s, mat || 'violet', o);
  }
  // paper talisman: leaning quad with a red brush sigil. lean = top shift in px, tilt = right-edge drop in px
  function fuda(k, x, y, w, h, lean, tilt, id) {
    k.poly([[x + lean, y], [x + w + lean, y + tilt], [x + w, y + h + tilt], [x, y + h]], 'cream', { part: id, light: 0.2, spec: false });
    var cx = x + w / 2, t2 = tilt / 2;
    k.line(cx + lean * 0.7, y + 1.5 + t2, cx + lean * 0.1, y + h - 1.5 + t2, 'red', 3);
    k.line(x + 1.5 + lean * 0.6, y + h * 0.3 + t2 * 0.6, x + w - 1.5 + lean * 0.6, y + h * 0.3 + t2 * 1.4, 'red', 3);
    if (h > 8) k.line(x + 1.5 + lean * 0.3, y + h * 0.6 + t2 * 0.6, x + w - 1.5 + lean * 0.3, y + h * 0.6 + t2 * 1.4, 'red', 3);
  }

  // 51 ヤミボウズ — dark, eerie (evolves from 21 カゲボウ): a towering shadow-monk wraith. The floppy hood and bobble
  // are now huge, the hood's darkness is crowded with extra glowing eyes, the robe is plastered with talismans and a
  // giant prayer-bead rosary hangs on its chest. Gag: still can't keep its tongue in, and a talisman is slapped on
  // its forehead that it clearly never noticed.
  P[51] = function (k) {
    k.shadow(C, 77, 16, 1.8);
    wisp(k, 7, 64, 1, 'w1'); wisp(k, 74, 62, 1, 'w2', null, 0); wisp(k, 71, 27, 0.8, 'w3', null, 0); wisp(k, 9, 31, 0.7, 'w4', null, 0);
    // floppy hood tip + bobble
    k.tube([[C, 30, 9], [34, 17, 6], [26, 10, 3.8], [19, 11, 2.2]], 'shadow', { part: 'cloak' });
    k.circle(16.5, 12.5, 3.6, 'violet', { part: 'bobble', halo: 0.25 });
    // robe with a long ragged hem
    var hem = [[65, 70], [61, 66], [59, 75], [54, 68], [49, 76], [44, 68], [40, 76.5], [36, 68], [31, 76], [26, 68], [21, 75], [19, 66], [15, 70]];
    k.poly([[24, 40], [56, 40], [63, 58]].concat(hem).concat([[17, 58]]), 'shadow', { part: 'cloak' });
    k.ellipse(C, 38, 20, 17, 'shadow', { part: 'cloak' });
    k.poly(hem.concat(hem.slice().reverse().map(function (p) { return [p[0], p[1] - 3.5]; })), 'violet', { clip: 'cloak' });
    k.texture('cloak', 'cloth', { size: 3 });
    [[[31, 57], [29, 66], [27, 72]], [[49, 57], [51, 66], [53, 72]], [[C, 62], [C, 70]], [[54, 30], [58, 42]], [[25, 27], [22, 38]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 0.8]; }), null, { adj: -2, clip: 'cloak' });
      k.tube(f.map(function (p) { return [p[0] - 1.5, p[1], 0.5]; }), null, { adj: 1, clip: 'cloak' });
    });
    // talismans plastered over the robe
    fuda(k, 21, 58, 6, 9, 1, -1, 'f1'); fuda(k, 53, 57, 6, 9, -1, 1, 'f2'); fuda(k, 33, 64, 5, 8, 0.5, 1, 'f3'); fuda(k, 45, 66, 5, 7, -0.5, -1, 'f4');
    fuda(k, 51, 22, 5, 7, 1, 1, 'f5');
    // hood rim + void
    k.ellipse(C, 42, 14.5, 13, 'violet', { part: 'rim' });
    k.texture('rim', 'cloth', { size: 2 });
    k.ellipse(C, 42.5, 12.5, 11, 'black', { part: 'void', shade: 'flat', flatTone: 0, noseam: true });
    k.ellipse(C, 50, 8.5, 3, null, { set: 1, clip: 'void' });
    // the crowd of little eyes lurking in the darkness
    var EY = { r: ['red', 5], R: ['red', 6], v: ['violet', 5] };
    pm(k, 31, 33, ['rR'], EY); pm(k, 34, 34, ['rr'], EY); pm(k, 45, 34, ['rr'], EY); pm(k, 48, 33, ['Rr'], EY);
    pm(k, 29, 45, ['vv'], EY); pm(k, 30, 47, ['v'], EY); pm(k, 50, 45, ['vv'], EY); pm(k, 50, 47, ['v'], EY);
    pm(k, 38, 31, ['r.r'], EY);
    // main glowing slanted eyes
    k.sym(C, function (m, s) { k.poly([[m(31), 37], [m(37.5), 38.5], [m(37.5), 41.5], [m(32.5), 40.5]], 'thunder', { part: 'eye' + s, shade: 'glow', halo: 0.35, outline: 'none' }); });
    k.px(33, 38, 'white', 6); k.px(46, 38, 'white', 6);
    // huge jagged grin + tongue
    k.poly([[29, 44], [51, 44], [49, 49.5], [C, 52], [31, 49.5]], 'thunder', { part: 'grin', shade: 'glow', outline: 'none' });
    k.path([[29, 45], [31, 47], [33, 45], [35, 48], [37, 45], [39, 48], [41, 45], [43, 48], [45, 45], [47, 48], [49, 45], [51, 46]], 'black', 0);
    k.path([[33, 50], [35, 49], [37, 51], [39, 49], [41, 51], [43, 49], [45, 51], [47, 49]], 'black', 0);
    k.tube([[44, 50, 2], [45, 55, 2.5], [44.5, 59, 1.8]], 'sakura', { part: 'tongue' });
    k.line(44.8, 52, 44.8, 58, 'sakura', 2);
    // big rosary: wooden beads round the neck, a red tassel bead
    var beads = [[25, 53], [27.5, 56.5], [31, 59], [35, 60.8], [C, 61.5], [45, 60.8], [49, 59], [52.5, 56.5], [55, 53]];
    beads.forEach(function (b, i) { k.circle(b[0], b[1], 2.1, 'wood', { part: 'bd' + i, light: 0.1 }); k.px(b[0] - 1, b[1] - 1, 'wood', 6); });
    k.circle(C, 64.5, 2.3, 'red', { part: 'bdR' }); k.px(39, 63, 'red', 6);
    k.tufts([[42, 67], [38, 67]], 'red', { part: 'tassel', len: 3, w: 2, every: 1.4, seed: 3 });
    // forehead talisman
    k.poly([[34.5, 15], [45, 16], [44, 31], [33.5, 30]], 'cream', { part: 'fuda', light: 0.2 });
    k.line(39.5, 17, 39, 28, 'red', 3); k.line(36, 19.5, 43, 20, 'red', 3); k.line(36, 23, 43, 23.5, 'red', 3); k.px(36, 27, 'red', 3); k.px(42, 28, 'red', 3);
    k.circle(39.3, 25.5, 1.3, 'red', { tone: 3, part: 'seal' });
    k.px(34, 16, 'cream', 1); k.px(44, 30, 'cream', 1);
    // "boo!" claw hands, bigger and bonier
    k.sym(C, function (m, s) {
      k.tube([[m(27), 51, 6], [m(18), 49, 5.2]], 'shadow', { part: 'sl' + s });
      k.tufts(s > 0 ? [[m(24), 56], [m(16), 54]] : [[m(16), 54], [m(24), 56]], 'shadow', { part: 'sl' + s, len: 3, w: 3, every: 3, seed: 5 + s });
      k.ellipse(m(16.5), 49, 2.6, 5.4, 'violet', { part: 'cuff' + s });
      k.ellipse(m(11), 47, 4.8, 4.4, 'dark', { part: 'hand' + s });
      k.tube([[m(8), 45, 1.6], [m(6.5), 39, 1], [m(8), 35, 0.4]], 'violet', { part: 'ca' + s });
      k.tube([[m(11.5), 43.5, 1.6], [m(12.5), 37.5, 1], [m(15), 34, 0.4]], 'violet', { part: 'cb' + s });
      k.tube([[m(7), 48, 1.5], [m(3.5), 46, 0.9], [m(2.5), 42.5, 0.4]], 'violet', { part: 'cc' + s });
      k.tube([[m(14.5), 44.5, 1.4], [m(17.5), 40, 0.9], [m(20), 38, 0.4]], 'violet', { part: 'cd' + s });
      k.px(m(10), 46, 'dark', 5); k.px(m(12), 46, 'dark', 5);
    });
    k.rect(66, 44, 2, 6, 'cream', { clip: 'hand-1', tone: 5 }); k.px(66, 46, 'red', 3); k.px(67, 48, 'red', 3);
  };

  // bloodshot eyeball helper (white ball, gold iris, black slit, glint, red veins on bigger ones)
  function eyeball(k, cx, cy, rx, ry, id, look) {
    look = look || 0;
    k.ellipse(cx, cy, rx, ry, 'white', { part: id, spec: false, light: 0.3 });
    var ir = Math.max(1.2, Math.min(rx, ry) * 0.62);
    k.circle(cx + look, cy + 0.3, ir, 'thunder', { clip: id, tone: 4 });
    k.rect(Math.round(cx + look - 0.5), Math.round(cy - ir + 0.3), 1, Math.max(1, Math.round(ir * 2 - 0.4)), 'black', { tone: 0, clip: id });
    k.px(Math.round(cx + look - 1.6), Math.round(cy - ir * 0.6), 'white', 6);
    if (rx >= 2.8) { k.px(Math.round(cx - rx + 1), Math.round(cy + 1), 'red', 3); k.px(Math.round(cx + rx - 1.5), Math.round(cy - 1), 'red', 3); }
  }

  // 52 ヒャクメチョウチン — dark, eerie (evolves from 22 バケチョウチン): the torn lantern now wears a second lantern
  // on its head like a hat, and that one has broken out in eyes, all rolling in different directions. The old face
  // is the same: one giant bloodshot eye over a torn grin. Gag: the tongue is now so long it pools on the ground.
  P[52] = function (k) {
    k.shadow(C, 77, 13, 1.8);
    wisp(k, 8, 52, 0.9, 'w1'); wisp(k, 73, 46, 0.8, 'w2', null, 0); wisp(k, 69, 20, 0.7, 'w3', null, 0); wisp(k, 12, 26, 0.65, 'w4', null, 0);
    // handle + top cap
    k.tube([[35.5, 13, 0.9], [36, 8.5, 0.9], [38, 6.5, 0.9], [42, 6.5, 0.9], [44, 8.5, 0.9], [44.5, 13, 0.9]], 'black', { part: 'wire', shade: 'flat', flatTone: 4 });
    k.ellipse(C, 13.5, 8, 2.4, 'black', { part: 'capT', light: 0.3 });
    // upper lantern: the eye-riddled hat
    k.ellipse(C, 23.5, 12, 10.5, 'cream', { part: 'up' });
    k.rect(26, 14, 28, 2, 'red', { clip: 'up' });
    k.rect(26, 31, 28, 3, 'red', { clip: 'up' });
    [18.5, 22.5, 26.5, 30].forEach(function (y) {
      var hw = 12 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 23.5) / 10.5, 2)));
      k.tube([[C - hw, y - 0.6, 0.45], [C, y + 0.6, 0.45], [C + hw, y - 0.6, 0.45]], null, { adj: -2, clip: 'up' });
    });
    k.tube([[32, 16, 0.5], [30, 24, 0.5], [32, 31, 0.5]], null, { adj: 1, clip: 'up' });
    k.tufts([[52, 20], [53, 26]], 'cream', { part: 'up', len: 2, w: 2.5, every: 2.5, seed: 6 });
    eyeball(k, 35, 20.5, 3.4, 2.6, 'e1', 0.6); eyeball(k, 46, 19.5, 3, 2.4, 'e2', -0.6); eyeball(k, 41, 27, 3.6, 2.8, 'e3', 0);
    eyeball(k, 31, 27.5, 2.2, 1.9, 'e4', 0.4); eyeball(k, 49.5, 26.5, 2.2, 1.9, 'e5', -0.4);
    // middle ring
    k.ellipse(C, 35, 10.5, 2.6, 'black', { part: 'capM', light: 0.3 });
    k.rect(31, 34, 18, 1, 'black', { clip: 'capM', tone: 5 });
    // lower lantern: the old face, grown up
    k.ellipse(C, 53, 16.5, 16.5, 'cream', { part: 'paper' });
    k.tufts([[25.5, 45], [23.5, 53], [24.5, 61]], 'cream', { part: 'paper', len: 2.5, w: 3, every: 3, seed: 3 });
    k.rect(22, 36, 36, 3, 'red', { clip: 'paper' });
    k.rect(22, 66, 36, 4, 'red', { clip: 'paper' });
    for (var y = 41; y <= 66; y += 4) {
      var hw = 16.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 53) / 16.5, 2)));
      k.tube([[C - hw, y - 0.7, 0.45], [C, y + 0.7, 0.45], [C + hw, y - 0.7, 0.45]], null, { adj: -2, clip: 'paper' });
      if (y > 42 && y < 64) k.px(Math.round(C + hw), y - 1, 'cream', 1);
    }
    k.tube([[30, 39, 0.5], [27.5, 53, 0.5], [30, 66, 0.5]], null, { adj: 1, clip: 'paper' });
    k.path([[53, 58], [55, 62], [54, 65]], 'cream', 2);
    // tear on the right with a ghost flame inside
    k.poly([[47, 39], [50, 41], [53, 39], [57, 41.5], [57, 48], [54, 51], [50.5, 50], [48, 47], [49, 43]], 'black', { part: 'hole', shade: 'flat', flatTone: 0 });
    k.tube([[52.5, 48, 2.8], [53, 45, 2], [51.5, 41, 0.5]], 'violet', { part: 'ghost', shade: 'glow', outline: 'none', noseam: true, halo: 0.3 });
    k.px(52, 47, 'violet', 6); k.px(53, 48, 'violet', 6);
    // side eyes breaking out on the lower lantern too
    eyeball(k, 25.5, 59, 2, 1.8, 'e6', 0.4); eyeball(k, 55.5, 56, 2, 1.7, 'e7', -0.4);
    // loose flap off the left
    k.poly([[25, 62], [20, 67], [21, 74], [24.5, 70.5], [28, 65]], 'cream', { part: 'flap', shift: -1 });
    k.line(23, 67, 22, 72, 'cream', 1);
    // bottom ring + tassel
    k.ellipse(C, 70.5, 9.5, 2.6, 'black', { part: 'capB', light: 0.3 });
    k.tube([[35, 72, 1.2], [35, 75, 1.6]], 'red', { part: 'tassel' });
    k.tufts([[37.5, 76], [32.5, 76]], 'red', { part: 'tassel', len: 1.5, w: 2, every: 1.5, seed: 2 });
    // one giant bloodshot eye (the original face)
    k.ellipse(36, 47, 9, 7, 'white', { part: 'eyeball', spec: false, light: 0.3 });
    k.circle(37, 47.5, 5, 'thunder', { clip: 'eyeball' });
    k.circle(37, 48, 2.8, null, { set: 5, clip: 'eyeball', mat: 'thunder' });
    k.circle(37, 47.5, 5, 'fire', { clip: 'eyeball', pattern: 'sparse', tone: 3 });
    k.rect(36, 43, 2, 9, 'black', { tone: 0, clip: 'eyeball' });
    k.path([[27, 43], [30, 41], [36, 40], [42, 41], [45, 43]], 'black', 0);
    k.path([[26, 42], [25, 40]], 'black', 0); k.path([[31, 40], [30, 38]], 'black', 0); k.path([[41, 40], [42, 38]], 'black', 0); k.path([[46, 42], [47, 40]], 'black', 0);
    k.path([[28, 50], [30, 48], [31, 49]], 'red', 3); k.path([[44, 50], [43, 48]], 'red', 3); k.path([[28, 45], [30, 46]], 'red', 3); k.path([[44, 44], [42, 45]], 'red', 3);
    k.px(34, 44, 'white', 6); k.px(35, 44, 'white', 6); k.px(34, 45, 'white', 6);
    // torn grin
    k.mouth([[25, 56], [28, 58], [30, 55.5], [33, 58], [36, 55.5], [39, 58], [42, 55.5], [45, 58], [48, 55.5], [51, 58], [55, 57.5], [52, 62.5], [45, 65.5], [36, 66], [29, 64]], { tongue: false });
    k.poly([[33, 64], [36, 62.5], [39, 64], [36, 65]], 'violet', { part: 'throat', shade: 'glow', outline: 'none', noseam: true });
    // enormously long tongue, pooling on the ground
    k.tube([[47, 61, 2.4], [49.5, 66, 2.8], [51, 71, 2.6], [55, 74.5, 2.2], [61, 74.5, 1.8], [64, 72, 1.4], [62.5, 70, 0.9]], 'skin', { part: 'tongue' });
    k.line(49, 63, 50.5, 70, 'skin', 2); k.path([[53, 74], [60, 74]], 'skin', 2);
    k.px(48, 64, 'skin', 5); k.px(48, 65, 'skin', 5); k.px(56, 72, 'skin', 5);
  };
  // 53 カシャ — dark, cool/妖艶 (evolves from 23 クロネコマタ): the black cat grown into a kasha, a cart-wheel of blue
  // onibi blazing behind it like a halo, both tails now burning torches. Keeps the nicked ear, sly lemon eyes, forehead
  // onibi mark, red collar and bell. Gag: the one-fang smirk has become a full, very pleased-with-itself grin.
  P[53] = function (k) {
    k.shadow(C, 77, 20, 2.2);
    var WC = [C, 33], WR = 26;
    function wp(a, r) { return [WC[0] + Math.cos(a) * r, WC[1] + Math.sin(a) * r]; }
    // onibi flames rising off the rim (skip the bottom, hidden by the body)
    [-90, -58, -122, -26, -154, 6, 174, 38, 142].forEach(function (d, n) {
      var a = d * Math.PI / 180, b = wp(a, WR), side = Math.cos(a), up = n < 5 ? 1 : 0.6;
      var t = [b[0] + side * 5, b[1] - 7 * up - 3], m2 = [b[0] + side * 3.5, b[1] - 3.5 * up];
      k.tube([[b[0], b[1], 3.4], [m2[0], m2[1], 2.4], [t[0] - side * 2, t[1], 0.5]], 'crystal', { part: 'onibi', shade: 'glow', halo: 0.3 });
      k.spike(m2[0] + side * 1.5, m2[1], t[0] + side * 2.5, t[1] + 2.5, 2.4, 'crystal', { part: 'onibi' });
    });
    // cart wheel: spokes, rim with iron band and studs
    for (var sp = 0; sp < 8; sp++) { var e = wp(sp * Math.PI / 4, WR - 1); k.tube([[WC[0], WC[1], 1.8], [e[0], e[1], 1.4]], 'wood', { part: 'spoke' + sp, shift: -1 }); }
    var rim = []; for (var q = 0; q <= 32; q++) { var pp = wp(q * Math.PI / 16, WR); rim.push([pp[0], pp[1], 2.6]); }
    k.tube(rim, 'wood', { part: 'rim' });
    k.texture('rim', 'bark', { size: 3 });
    k.tube(rim.map(function (p) { var d = [p[0] - WC[0], p[1] - WC[1]]; return [WC[0] + d[0] * 1.06, WC[1] + d[1] * 1.06, 0.7]; }), 'black', { clip: 'rim', tone: 3 });
    for (var st = 0; st < 16; st++) { var sq = wp(st * Math.PI / 8, WR + 1.4); k.px(sq[0], sq[1], 'steel', 5); }
    // two burning tails, one each side
    k.sym(C, function (m, s) {
      k.tube([[m(48), 72, 3], [m(60), 71, 2.8], [m(68), 65, 2.5], [m(71), 57, 2.1], [m(69), 50, 1.8]], 'obsidian', { part: 'tail' + s, shift: -1 });
      k.tube([[m(67), 65, 0.5], [m(70), 57, 0.5]], null, { set: 4, clip: 'tail' + s });
      var fo = { part: 'tf' + s, shade: 'glow', halo: 0.3 };
      k.tube([[m(69), 49, 4], [m(70), 44, 2.8], [m(67.5), 38, 1.4], [m(68.5), 34, 0.5]], 'crystal', fo);
      k.spike(m(71.5), 46, m(75), 39, 3, 'crystal', fo);
      k.spike(m(66.5), 46, m(64), 41, 2.4, 'crystal', fo);
    });
    // haunches + hind paws
    k.sym(C, function (m, s) {
      k.ellipse(m(28.5), 65, 8, 9, 'obsidian', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(26), 74, 6, 2.4, 'obsidian', { part: 'hp' + s, shift: -1 });
      k.px(m(23), 75, 'black', 0); k.px(m(26), 75, 'black', 0);
      k.texture('haunch' + s, 'fur', { seed: 8 + s });
    });
    // body + chest ruff
    k.ellipse(C, 59, 12.5, 14, 'obsidian', { part: 'body', shift: -1 });
    k.texture('body', 'fur', { seed: 5 });
    k.tufts([[49, 56], [31, 56]], 'obsidian', { part: 'ruff', len: 6, w: 3.4, every: 2.5, seed: 4, light: 0.25 });
    k.texture('ruff', 'fur', { seed: 2 });
    // front legs: strong, claws out
    k.sym(C, function (m, s) {
      k.tube([[m(34.5), 59, 3.8], [m(34), 66, 3], [m(34), 71, 3]], 'obsidian', { part: 'leg' + s, light: 0.2 });
      k.ellipse(m(34), 73.5, 4.6, 2.6, 'obsidian', { part: 'paw' + s, light: 0.15 });
      k.tooth(m(31.5), 74, m(30.5), 77, 1.6); k.tooth(m(34), 74.5, m(34), 77.5, 1.6); k.tooth(m(36.5), 74, m(37.5), 77, 1.6);
      k.line(m(38), 61, m(38), 71, 'black', 1); k.tube([[m(32), 60, 0.5], [m(32), 68, 0.5]], null, { adj: 1, clip: 'leg' + s });
    });
    // ears (right one nicked)
    k.sym(C, function (m, s) {
      k.spike(m(31), 27, m(22), 8, 13, 'obsidian', { part: 'ear' + s });
      k.spike(m(30.5), 26, m(23.5), 13, 6, 'violet', { clip: 'ear' + s, tone: 2 });
      k.tufts(s > 0 ? [[m(28.5), 25], [m(25.5), 16]] : [[m(25.5), 16], [m(28.5), 25]], 'violet', { part: 'ef' + s, len: 2.5, w: 1.8, every: 2, seed: 9 });
    });
    k.circle(54.5, 14, 1.2, null, { erase: true });
    // head with cheek ruffs
    k.ellipse(C, 32, 14.5, 11.5, 'obsidian', { part: 'head', light: 0.1 });
    k.tufts([[27, 30], [24, 36], [27, 43]], 'obsidian', { part: 'head', len: 5, w: 3, every: 2.5, seed: 5 });
    k.tufts([[53, 43], [56, 36], [53, 30]], 'obsidian', { part: 'head', len: 5, w: 3, every: 2.5, seed: 6 });
    k.texture('head', 'fur', { seed: 7 });
    k.ellipse(C, 39, 7, 4, 'obsidian', { part: 'muzzle', light: 0.3 });
    // collar + big bell
    k.tube([[27, 45, 1.8], [C, 48.5, 2.1], [53, 45, 1.8]], 'red', { part: 'collar' });
    k.circle(C, 52, 3.3, 'gold', { part: 'bell' });
    k.rect(37, 52, 7, 1, 'gold', { clip: 'bell', tone: 2 });
    k.px(C, 53, 'black', 0); k.px(C, 54, 'black', 0);
    // forehead onibi mark, bigger
    k.poly([[C, 21], [42.2, 25], [C, 28], [37.8, 25]], 'crystal', { part: 'mark', shade: 'glow', outline: 'none' });
    k.px(C, 20, 'crystal', 4);
    // sly glowing eyes with red liner
    var E = { K: ['black', 0], Y: ['thunder', 5], y: ['thunder', 4], o: ['thunder', 3], W: ['white', 6], r: ['red', 4] };
    var eyeL = ['rKK.......', '.KYKKK....', '..KYWKYKKK', '..KyyKyyyK', '...KoKooK.', '....KKKK..'];
    pm(k, 27, 28, eyeL, E); pmx(k, 43, 28, eyeL, E);
    // nose, big pleased grin with both fangs
    k.poly([[38.5, 36], [41.5, 36], [C, 37.5]], 'skin', { part: 'nose', tone: 4 });
    k.px(C, 38, 'black', 0);
    k.mouth([[33, 39], [C, 40], [47, 39], [45, 43], [C, 44.5], [35, 43]], { tongue: false });
    k.tooth(36.5, 39.3, 36.8, 42.3, 1.8); k.tooth(43.5, 39.3, 43.2, 42.3, 1.8);
    k.px(39, 43, 'skin', 4); k.px(40, 43, 'skin', 4); k.px(41, 43, 'skin', 3);
    // whiskers (kept below the eyes)
    k.path([[27, 38], [19, 36]], 'violet', 5); k.path([[27, 40], [18, 41]], 'violet', 4);
    k.path([[53, 38], [61, 36]], 'violet', 5); k.path([[53, 40], [62, 41]], 'violet', 4);
    k.sym(C, function (m) { k.line(m(28), 35, m(31), 35, 'red', 4); k.line(m(29), 36, m(31), 36, 'red', 3); });
    // rim light on the shadow side
    k.tube([[51, 50, 0.5], [52.5, 58, 0.5], [51, 66, 0.5]], null, { set: 3, clip: 'body' });
    k.tube([[54, 27, 0.5], [55, 36, 0.5]], null, { set: 4, clip: 'head' });
  };
  // chain of steel links along a polyline (alternating link parts so the seams split them)
  function chain(k, pts, id, r) {
    r = r || 1.3;
    var n = 0;
    for (var i = 0; i + 1 < pts.length; i++) {
      var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (var t = 0; t < L; t += r * 1.7) {
        var x = a[0] + (b[0] - a[0]) * t / L, y = a[1] + (b[1] - a[1]) * t / L;
        k.circle(x, y, r, 'steel', { part: id + (n++ % 2), light: 0.1, spec: false });
        k.px(x, y, 'steel', n % 2 ? 1 : 5);
      }
    }
  }

  // 54 ガシャドクロ — dark, eerie (evolves from 24 ドクロキシ): a towering skeleton samurai with a huge cracked skull,
  // a great chipped nodachi, two tattered skull banners and chains dragging from its wrist. Keeps the broken lacquer
  // armour, red lacing, glowing ember sockets and the one snapped kuwagata horn. Gag: the jaw still hangs open in a
  // rattling cackle, and now there's a crow's nest of chain it has clearly forgotten it's dragging.
  P[54] = function (k) {
    k.shadow(C, 77, 22, 2.4);
    // two tattered banners on the back, staggered
    [[58, 5, 12, 22, 'b1', -1], [66, 12, 11, 19, 'b2', -2]].forEach(function (B) {
      var x = B[0], y = B[1], w = B[2], h = B[3], id = B[4];
      k.tube([[x - 1, 60, 0.9], [x - 1, y - 1, 0.9]], 'wood', { part: id + 'p', shift: B[5] });
      k.poly([[x, y], [x + w, y], [x + w, y + h], [x + w - 2, y + h - 3], [x + w - 4.5, y + h + 2], [x + w * 0.5, y + h - 4], [x + 3, y + h + 1], [x, y + h - 3]], 'red', { part: id, flat: true, shift: B[5] + 1 });
      k.texture(id, 'cloth', { size: 3 });
      k.circle(x + w / 2, y + 7, 3.6, 'black', { clip: id, tone: 1 });
      pm(k, Math.round(x + w / 2 - 1.5), y + 6, ['bbb', 'k.k', '.b.'], { b: ['bone', 5], k: ['black', 0] });
      k.rect(x - 2, y - 1, w + 3, 1, 'wood', { part: id + 'x', tone: 3 });
    });
    k.circle(67, 21, 1.1, null, { erase: true }); k.circle(74, 27, 1, null, { erase: true });
    // legs: bone shins, greaves, knee caps, bone feet
    k.sym(C, function (m, s) {
      k.tube([[m(32.5), 61, 2.2], [m(32), 72, 1.8]], 'bone', { part: 'shin' + s });
      k.poly([[m(28.5), 63], [m(36.5), 63], [m(36), 69], [m(32.5), 71], [m(29), 69]], 'dark', { part: 'grv' + s });
      k.line(m(29), 64, m(36), 64, 'gold', 4);
      k.circle(m(32.5), 62, 2.2, 'bone', { part: 'knee' + s });
      k.ellipse(m(31.5), 74.5, 4.6, 2, 'bone', { part: 'foot' + s });
      k.px(m(29), 75, 'bone', 1); k.px(m(31.5), 75, 'bone', 1); k.px(m(34), 75, 'bone', 1);
    });
    // armoured skirt with missing plates
    k.poly([[26, 50], [54, 50], [58, 62], [22, 62]], 'dark', { part: 'skirt' });
    [29, 34.5, 45.5, 51].forEach(function (x) { k.line(x, 51, x + (x - C) * 0.14, 61, 'dark', 1); });
    k.rect(21, 56, 38, 1, 'red', { clip: 'skirt', tone: 3, pattern: 'checker' }); k.rect(21, 54, 38, 1, null, { adj: -1, clip: 'skirt' });
    k.rect(21, 61, 38, 1, 'gold', { clip: 'skirt', tone: 4 });
    k.poly([[40.5, 50], [45.5, 50], [46, 56], [43.5, 62], [41, 58]], null, { erase: true });
    k.tube([[43, 52, 1.5], [43.5, 62, 1.3]], 'bone', { part: 'femur', shift: -1 });
    k.path([[25, 58], [27, 60], [26, 62]], 'black', 1);
    // torso: lamellar do, cracked open over the ribs
    k.poly([[25, 35], [55, 35], [56, 51], [24, 51]], 'dark', { part: 'do' });
    [39, 42, 45, 48].forEach(function (y, i) { k.rect(24, y, 33, 1, null, { adj: -1, clip: 'do' }); if (i % 2 === 0) k.rect(24, y + 1, 33, 1, 'red', { clip: 'do', tone: 3, pattern: 'checker' }); });
    k.tube([[27, 36, 0.5], [26, 50, 0.5]], null, { adj: 1, clip: 'do' });
    k.poly([[33, 38], [40, 36.5], [47, 38], [50, 42], [48.5, 47], [41, 49.5], [34.5, 47], [32, 42]], 'black', { part: 'hole', shade: 'flat', flatTone: 0 });
    k.tube([[C, 37, 0.8], [C, 49, 0.8]], 'bone', { clip: 'hole', tone: 3 });
    [[39.5, 0.8], [42.5, 0.8], [45.5, 0.7]].forEach(function (r) {
      k.tube([[33.5, r[0] + 1, 0.6], [C, r[0] - 0.5, r[1]], [48.5, r[0] + 1, 0.6]], 'bone', { clip: 'hole', tone: 4 });
    });
    k.px(C, 38, 'bone', 5); k.px(C, 41, 'bone', 5);
    pm(k, 36, 44, ['.v.', 'vVv', '.v.'], { v: ['violet', 4], V: ['violet', 6] });   // soul-fire in the ribcage
    k.path([[50, 36], [48, 38], [49, 40], [47, 42]], 'black', 1); k.path([[28, 43], [30, 45]], 'black', 1);
    // chain slung across the chest
    chain(k, [[26, 36], [36, 44], [46, 50], [54, 53]], 'chA', 1.25);
    // big shoulder plates
    k.sym(C, function (m, s) {
      k.poly([[m(28), 33], [m(14), 35.5], [m(12.5), 49], [m(26), 46.5]], 'dark', { part: 'sode' + s });
      for (var r = 0; r < 4; r++) k.line(m(13.5), 38.5 + r * 3, m(27), 36 + r * 3, 'red', 3);
      k.line(m(12.5), 49, m(26), 46.5, 'gold', 4);
      k.px(m(19), 37, 'dark', 5); k.px(m(20), 37, 'dark', 5);
    });
    k.path([[60, 37], [62, 40], [61, 43]], 'black', 0);
    // nodachi arm (screen left): huge chipped blade held upright
    k.tube([[19, 48, 2], [16, 54, 1.8], [14.5, 57, 1.6]], 'bone', { part: 'armL' });
    k.tube([[13, 67, 1.3], [14, 57, 1.3]], 'black', { part: 'hilt' });
    k.px(13, 62, 'red', 3); k.px(13, 65, 'red', 3); k.px(14, 60, 'red', 3);
    k.ellipse(14.5, 58, 3, 2.6, 'bone', { part: 'handL' });
    k.px(13, 58, 'bone', 2); k.px(15, 58, 'bone', 2);
    k.ellipse(14.5, 54.5, 4, 1.5, 'gold', { part: 'tsuba' });
    k.poly([[13, 54], [16.5, 54], [13, 16], [9, 8], [9.5, 17]], 'steel', { part: 'blade', shade: 'flat', flatTone: 4 });
    k.line(15.6, 53, 11.8, 17, 'steel', 6); k.line(13, 53, 10.2, 18, 'steel', 3);
    k.circle(12.8, 40, 1, null, { erase: true }); k.circle(11.3, 27, 0.9, null, { erase: true });
    k.px(12, 46, 'steel', 1); k.px(11, 33, 'steel', 1); k.px(10, 22, 'steel', 1);
    // claw arm (screen right) dragging a broken chain
    k.tube([[61, 47, 2], [64, 54, 1.8], [64.5, 58, 1.6]], 'bone', { part: 'armR' });
    k.ellipse(64.5, 59.5, 3, 2.4, 'bone', { part: 'handR' });
    k.tooth(62.5, 61, 61.5, 64.5, 1.5); k.tooth(64.5, 61.5, 64.5, 65, 1.5); k.tooth(66.5, 61, 67.5, 64, 1.5);
    k.rect(62, 54, 5, 2, 'steel', { part: 'cuff', tone: 3 }); k.rect(62, 54, 5, 1, 'steel', { part: 'cuff', tone: 5 });
    chain(k, [[66, 56], [69, 62], [69.5, 68], [67, 73], [62, 75]], 'chB', 1.2);
    // helmet neck-guard flaring behind the skull
    k.poly([[26, 16], [54, 16], [62, 31], [18, 31]], 'dark', { part: 'shik' });
    [21, 25].forEach(function (y) { k.rect(18, y, 44, 1, null, { adj: -1, clip: 'shik' }); });
    k.rect(18, 29, 44, 1, 'red', { clip: 'shik', tone: 3 }); k.rect(18, 30, 44, 1, 'gold', { clip: 'shik', tone: 4 });
    // huge skull
    k.poly([[28.5, 19], [51.5, 19], [52.5, 27], [48.5, 33], [31.5, 33], [27.5, 27]], 'bone', { part: 'skull' });
    k.ellipse(C, 21.5, 12, 5.5, 'bone', { part: 'skull' });
    k.sym(C, function (m) {
      k.poly([[m(29.5), 21.5], [m(38), 23], [m(37.5), 28.5], [m(33.5), 29], [m(30.5), 26]], 'black', { part: 'sock', shade: 'flat', flatTone: 0, noseam: true });
      k.path([[m(30), 29], [m(32), 32]], 'bone', 2);
    });
    pm(k, 33, 24, ['.r.', 'rRr', '.r.'], { R: ['red', 6], r: ['red', 4] });
    pm(k, 44, 24, ['.r.', 'rRr', '.r.'], { R: ['red', 6], r: ['red', 4] });
    pm(k, 38, 28, ['K.KK', '.KK.'], { K: ['black', 0] });
    k.rect(33, 31, 14, 2, 'bone', { part: 'teeth', tone: 5 });
    for (var tx = 33; tx <= 46; tx += 2) k.px(tx, 32, 'bone', 2);
    k.rect(32, 33, 16, 2, 'black', { tone: 0, part: 'gap' });
    k.rect(35, 33, 10, 1, 'violet', { tone: 3, part: 'gapglow' });
    k.ellipse(C, 36.3, 7, 2.2, 'bone', { part: 'jaw' });
    for (var jx = 35; jx <= 45; jx += 2) k.px(jx, 35, 'bone', 5);
    k.path([[47, 17], [46, 20], [48, 22], [47, 24]], 'bone', 1); k.path([[31, 30], [30, 32]], 'bone', 1);
    // helmet bowl + gold brim + horns (one snapped)
    k.ellipse(C, 14.5, 12, 6, 'dark', { part: 'kabuto' });
    k.rect(28, 16, 24, 2, 'dark', { part: 'kabuto' });
    [31, 35.5, 44.5, 49].forEach(function (vx) { k.line(vx, 10, vx + (vx < C ? -1 : 1), 17, 'dark', 2); });
    k.rect(27, 17, 26, 1, 'gold', { part: 'brim', tone: 4 });
    k.tube([[36.5, 11, 1.8], [32, 7.5, 1.4], [28.5, 4.5, 1], [29, 1.8, 0.5]], 'gold', { part: 'hornL' });
    k.tube([[43.5, 11, 1.8], [46.5, 8.5, 1.4]], 'gold', { part: 'hornR' });
    k.px(47, 7, 'gold', 5); k.px(48, 8, 'gold', 2); k.px(47, 9, 'gold', 2);
    k.circle(C, 11.5, 2.2, 'red', { part: 'mon' });
    k.px(39, 11, 'red', 6);
  };
  // 55 クロガネヤマタ — dark UR 極, eerie/apocalyptic (evolves from 25 クロガネオロチ): the iron serpent has grown five
  // heads on a mountain of coils, molten violet light leaking from every seam, the middle head crowned with a taller
  // gem crown. Gag: the crowned head still can't keep its forked tongue in — and neither, now, can one of the others.
  P[55] = function (k) {
    k.shadow(C, 77, 34, 2.4);
    // back coil hump
    k.tube([[3, 72, 2.5], [10, 62, 5], [22, 56, 6.5], [C, 57, 7], [58, 56, 6.5], [70, 62, 5], [77, 72, 2.5]], 'steel', { part: 'coilB', shift: -2 });
    k.texture('coilB', 'scales', { size: 4 });
    // necks: outer, inner, centre (back to front)
    function neck(pts, id, sh, spikes, seed) {
      if (spikes) k.tufts(spikes, 'obsidian', { part: id + 'sp', len: 3, w: 2.4, every: 3.4, seed: seed });
      k.tube(pts, 'steel', { part: id, shift: sh });
      k.texture(id, 'scales', { size: 4, seed: seed });
      k.tube(pts.map(function (p) { return [p[0] + (C - p[0]) * 0.06, p[1], p[2] * 0.42]; }), 'obsidian', { clip: id });
    }
    k.sym(C, function (m, s) {
      neck([[m(26), 64, 6], [m(16), 56, 5], [m(10.5), 48, 4.4], [m(10), 41, 4]], 'nO' + s, -1,
        s > 0 ? [[m(6.5), 42], [m(8.5), 51], [m(15), 59]] : [[m(15), 59], [m(8.5), 51], [m(6.5), 42]], 3 + s);
    });
    k.sym(C, function (m, s) {
      neck([[m(33), 62, 6.5], [m(27.5), 50, 5.5], [m(24.5), 38, 4.8], [m(23), 26, 4.4]], 'nI' + s, -1,
        s > 0 ? [[m(19), 26], [m(21.5), 39], [m(26), 52]] : [[m(26), 52], [m(21.5), 39], [m(19), 26]], 7 + s);
    });
    k.tufts([[34.5, 58], [37, 45], [34, 33]], 'obsidian', { part: 'spC', len: 3, w: 2.4, every: 3.5, seed: 11 });
    k.tufts([[46, 33], [43, 45], [45.5, 58]], 'obsidian', { part: 'spC', len: 3, w: 2.4, every: 3.5, seed: 12 });
    k.tube([[C, 66, 8], [42, 52, 6.8], [38.5, 38, 6], [C, 26, 5.6]], 'steel', { part: 'neckC' });
    k.texture('neckC', 'scales', { size: 4, seed: 7 });
    k.tube([[C, 66, 3.2], [42, 52, 3], [38.5, 38, 2.6], [C, 28, 2.3]], 'obsidian', { clip: 'neckC' });
    for (var y = 31; y <= 63; y += 3) k.tube([[32, y - 0.5, 0.5], [C + 1, y + 0.5, 0.5], [49, y - 0.5, 0.5]], null, { adj: -1, clip: 'neckC', mat: 'obsidian' });
    // molten cracks on the necks
    k.path([[39, 40], [41, 43], [40, 46]], 'violet', 5); k.px(41, 43, 'violet', 6);
    k.path([[42, 55], [44, 57]], 'violet', 5); k.path([[23, 44], [25, 47]], 'violet', 5); k.path([[57, 44], [55, 47]], 'violet', 5);
    k.path([[11, 49], [13, 51]], 'violet', 4); k.path([[69, 49], [67, 51]], 'violet', 4);
    // front coil: heaped humps, tail blade curling up on the right
    var coil = [[3, 75, 1.6], [9, 71, 4.5], [18, 65, 6], [27, 69, 6.5], [35, 73, 6.5], [46, 72.5, 6.5], [54, 66, 6.5], [63, 67, 5.5], [70, 71, 3.8], [75, 66, 2.4], [74.5, 59, 1.4]];
    k.tube(coil, 'steel', { part: 'coil' });
    k.texture('coil', 'scales', { size: 4, seed: 9 });
    k.tube(coil.slice(1, 9).map(function (p) { return [p[0], p[1] + p[2] * 0.62, Math.max(0.5, p[2] * 0.3)]; }), 'obsidian', { clip: 'coil' });
    k.spike(74.5, 60, 77, 49, 5, 'bone', { part: 'tailblade' });
    k.px(76, 53, 'bone', 2);
    k.path([[12, 69], [16, 66], [20, 65]], 'violet', 5); k.path([[31, 71], [36, 71], [42, 70]], 'violet', 5); k.path([[51, 64], [56, 63]], 'violet', 5); k.path([[64, 68], [67, 70]], 'violet', 5);
    k.px(36, 70, 'violet', 6); k.px(16, 65, 'violet', 6); k.px(55, 62, 'violet', 6);
    // heads: wedge skulls, dark brow ridges, molten slit eyes, open fanged jaws
    function head(cx, cy, sc, id, big) {
      function X(d) { return cx + d * sc; } function Y(d) { return cy + d * sc; }
      k.sym(cx, function (m, s) {
        k.tube([[m(X(-4.5)), Y(-3.5), 1.7 * sc], [m(X(-7.5)), Y(-8), 1.1 * sc], [m(X(-7.5)), Y(-12), 0.4]], 'bone', { part: id + 'h' + s });
        k.px(m(X(-6.5)), Y(-6.5), 'bone', 2);
        k.spike(m(X(-7)), Y(1), m(X(-11)), Y(4), 3.2 * sc, 'steel', { part: id + 'f' + s, shift: -1 });
      });
      k.ellipse(cx, Y(11), 4.2 * sc, 1.8 * sc, 'steel', { part: id + 'j', shift: -1 });
      k.poly([[X(-7), Y(-4)], [X(-3), Y(-6.5)], [X(3), Y(-6.5)], [X(7), Y(-4)], [X(8.5), Y(1)], [X(5.5), Y(5)], [X(-5.5), Y(5)], [X(-8.5), Y(1)]], 'steel', { part: id });
      k.poly([[X(-5.5), Y(2)], [X(5.5), Y(2)], [X(4.2), Y(6.5)], [X(-4.2), Y(6.5)]], 'steel', { part: id });
      k.texture(id, 'scales', { size: 3, seed: sc * 10 | 0 });
      k.mouth([[X(-5), Y(5.5)], [X(5), Y(5.5)], [X(3.8), Y(10)], [X(-3.8), Y(10)]], { tongue: false });
      k.tooth(X(-3.2), Y(5.5), X(-3), Y(8.8), 1.8 * sc); k.tooth(X(3.2), Y(5.5), X(3), Y(8.8), 1.8 * sc);
      k.tooth(X(-1.8), Y(10.2), X(-1.6), Y(8.2), 1.3 * sc); k.tooth(X(1.8), Y(10.2), X(1.6), Y(8.2), 1.3 * sc);
      k.px(X(-1.5), Y(3.5), 'black', 0); k.px(X(1.5), Y(3.5), 'black', 0);
      k.sym(cx, function (m, s) {
        k.poly([[m(X(-7)), Y(-2.2)], [m(X(-1.5)), Y(0)], [m(X(-2.2)), Y(1.8)], [m(X(-6.2)), Y(0.6)]], 'violet', { part: id + 'e', shade: 'flat', flatTone: 4, halo: big ? 0.35 : 0, outline: 'none' });
        k.px(m(X(-3.6)), Y(0.4), 'violet', 6); k.px(m(X(-4.6)), Y(0), 'violet', 6);
        k.tube([[m(X(-7.5)), Y(-3.4), 0.8 * sc], [m(X(-1.2)), Y(-1.2), 0.7 * sc]], 'obsidian', { part: id + 'b' + s });
      });
      k.px(X(-0.5), Y(-4), 'steel', 6); k.px(X(0.5), Y(-3), 'steel', 5);
    }
    head(9.5, 36, 0.78, 'hOL'); head(70.5, 36, 0.78, 'hOR');
    head(22.5, 19.5, 0.95, 'hIL'); head(57.5, 19.5, 0.95, 'hIR');
    head(C, 16, 1.2, 'hC', true);
    // forked tongues: the crowned head's, and the far-left one's
    k.tube([[41.5, 26, 1.3], [43.5, 31, 1.4], [42.5, 34, 0.9]], 'red', { part: 'tongue' });
    k.px(43.5, 35, 'red', 3); k.px(41.5, 35, 'red', 3);
    k.tube([[10.5, 43, 1], [12, 47, 1]], 'red', { part: 'tongue2' }); k.px(11.5, 48, 'red', 3); k.px(13, 48, 'red', 3);
    // taller iron crown with a violet gem
    k.poly([[32, 9], [33.5, 3], [36, 7], [38, 1.5], [C, 5], [42, 1.5], [44, 7], [46.5, 3], [48, 9]], 'gold', { part: 'crown', shift: -1 });
    k.rect(32, 8, 17, 2, 'gold', { part: 'crown', shift: -1 });
    k.circle(C, 7.5, 1.6, 'violet', { part: 'gem', shade: 'flat', flatTone: 5, halo: 0.3 });
    k.px(39, 7, 'violet', 6);
    k.px(34, 8, 'red', 4); k.px(46, 8, 'red', 4);
    // embers drifting up
    [[5, 18], [75, 17], [30, 3], [52, 5], [14, 12], [66, 11]].forEach(function (p, i) { k.px(p[0], p[1], 'violet', i % 2 ? 5 : 6); });
  };
  // 56 ツキウサギ — light, cute/mystic (evolves from 26 ホシウサ): the star rabbit grown into the moon's own mochi
  // pounder. The crystal crest now rises out of a gold crescent-moon maedate, it wears a starry night cape clasped with
  // its red bandana, and it shoulders a huge wooden kine. Gag: the same giant buck teeth, and a blob of fresh mochi is
  // still stuck to the mallet (and a bit to its cheek).
  P[56] = function (k) {
    k.shadow(C, 77, 18, 2.2);
    // starry cape flaring behind
    k.poly([[29, 52], [51, 52], [60, 62], [67, 75], [58, 73], [50, 76], [40, 74], [30, 76], [22, 73], [13, 75], [20, 62]], 'water', { part: 'cape', light: -0.25, flat: true });
    k.texture('cape', 'cloth', { size: 3 });
    k.tube([[13.5, 74.5, 0.9], [22, 72.5, 0.9], [30, 75.5, 0.9], [40, 73.5, 0.9], [50, 75.5, 0.9], [58, 72.5, 0.9], [66.5, 74.5, 0.9]], 'gold', { clip: 'cape', tone: 4 });
    [[18, 66], [23, 70], [60, 65], [56, 70], [63, 71], [16, 71], [26, 64], [54, 61]].forEach(function (p, i) { k.px(p[0], p[1], i % 3 ? 'white' : 'gold', 6); });
    k.sparkle(21, 66, 1, 'light'); k.sparkle(59, 68, 1, 'light');
    // body, feet
    k.ellipse(C, 64, 12.5, 11, 'white', { part: 'body' });
    k.texture('body', 'fur', { seed: 7 });
    k.sym(C, function (m, s) {
      k.ellipse(m(32.5), 74.5, 6.5, 2.8, 'white', { part: 'foot' + s });
      k.px(m(28), 74, 'white', 2); k.px(m(30.5), 75, 'white', 2);
    });
    // the kine (mochi mallet) held up on the left
    k.tube([[31, 63, 1.5], [16, 38, 1.4]], 'wood', { part: 'handle' });
    k.tube([[31, 63, 0.4], [16, 38, 0.4]], null, { adj: 1, clip: 'handle' });
    k.tube([[8, 42, 4.6], [21, 33, 4.6]], 'wood', { part: 'kine' });
    k.texture('kine', 'bark', { size: 3 });
    [[11, 40], [18, 35]].forEach(function (p) { k.tube([[p[0] - 2.2, p[1] - 3.3, 0.6], [p[0] + 2.2, p[1] + 3.3, 0.6]], null, { adj: -2, clip: 'kine' }); });
    k.ellipse(6.5, 44, 3, 2.4, 'white', { part: 'mochi', light: 0.2 });
    k.ellipse(4.5, 46.5, 1.6, 1.4, 'white', { part: 'mochi' });
    // arms: left grips the handle, right on hip
    k.ellipse(30.5, 61, 3.4, 4, 'white', { part: 'armL' });
    k.px(29, 63, 'white', 2); k.px(31, 63, 'white', 2);
    k.ellipse(51, 63, 3.2, 4, 'white', { part: 'armR' });
    k.px(50, 66, 'white', 2); k.px(52, 66, 'white', 2);
    // ears: left tall, right flopped with its star charm
    k.leaf(35, 40, 29, 5, 10, 'white', { part: 'earL' });
    k.leaf(34.5, 38, 30, 10, 4, 'sakura', { clip: 'earL', tone: 3 });
    k.tube([[46, 38, 4.5], [50, 27, 4.5], [55, 21, 4], [62, 22, 3.2], [67, 28, 1.8]], 'white', { part: 'earR' });
    k.tube([[47, 36, 1.7], [50.5, 27, 1.7], [55, 23, 1.4]], 'sakura', { clip: 'earR', tone: 3 });
    k.texture('earL', 'fur', { seed: 3 }); k.texture('earR', 'fur', { seed: 4 });
    k.line(67, 29, 67, 32, 'gold', 3);
    k.star(67, 36, 4, 'gold', { part: 'dstar', halo: 0.2 });
    k.px(66, 34, 'gold', 6);
    // head, puffed cheeks
    k.ellipse(C, 46, 14.5, 12, 'white', { part: 'head' });
    k.sym(C, function (m) { k.ellipse(m(29.5), 50.5, 5.5, 4.6, 'white', { part: 'head' }); });
    k.tufts([[25.5, 50], [23.5, 54], [26.5, 58]], 'white', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 3 });
    k.tufts([[53.5, 58], [56.5, 54], [54.5, 50]], 'white', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 4 });
    k.texture('head', 'fur', { seed: 8 });
    // gold crescent maedate with the crystal crest rising from it
    var cr = [], a;
    for (a = 0; a <= 180; a += 15) cr.push([C + Math.cos(a * Math.PI / 180) * 14, 23 + Math.sin(a * Math.PI / 180) * 11]);
    for (a = 180; a >= 0; a -= 15) cr.push([C + Math.cos(a * Math.PI / 180) * 11.5, 19 + Math.sin(a * Math.PI / 180) * 9.5]);
    k.poly(cr, 'gold', { part: 'moon', halo: 0.25 });
    k.path([[28, 27], [32, 31], [C, 33], [48, 31], [52, 27]], 'gold', 6);
    k.poly([[36.5, 36], [36.5, 27], [C, 15], [43.5, 27], [43.5, 36]], 'crystal', { part: 'horn', halo: 0.3, shade: 'flat', flatTone: 5 });
    k.poly([[C, 15], [43.5, 27], [43.5, 36], [C, 36]], null, { set: 3, clip: 'horn' });
    k.poly([[36.5, 27], [C, 15], [38.5, 27]], null, { set: 6, clip: 'horn' });
    k.line(C, 27, C, 35, 'crystal', 2);
    k.sparkle(C, 12, 2, 'white');
    // red bandana tied round the neck, clasping the cape with a star pin
    k.poly([[27, 56], [53, 56], [50, 60.5], [C, 62], [30, 60.5]], 'red', { part: 'scarf' });
    k.spike(44, 59.5, 48.5, 67, 5, 'red', { part: 'knot' });
    k.star(C, 59.5, 2.8, 'gold', { part: 'pin' });
    k.px(C, 59, 'gold', 6);
    // face: nose, mouth, buck teeth
    k.poly([[38.5, 48], [41.5, 48], [C, 50]], 'skin', { part: 'nose', tone: 3 });
    k.px(39, 48, 'skin', 5);
    k.path([[34, 51], [37, 52], [C, 51], [43, 52], [46, 51]], 'black', 0);
    k.rect(37, 52, 6, 5, 'white', { part: 'teeth', shade: 'flat', flatTone: 6 });
    k.line(C, 52, C, 56, 'black', 0); k.line(37, 56, 42, 56, 'white', 3); k.px(42, 53, 'white', 4); k.px(42, 54, 'white', 4);
    // determined glare
    k.eye(30, 41, { w: 6, h: 4, iris: 'violet', side: 'L', angry: 1.2 });
    k.eye(44, 41, { w: 6, h: 4, iris: 'violet', side: 'R', angry: 1.2 });
    k.sym(C, function (m) { k.rect(m(28), 51, 3, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' }); });
    pm(k, 48, 49, ['ww', 'w.'], { w: ['white', 6] });   // mochi smudge on the cheek
    // fur clusters
    var F = { h: ['white', 6], l: ['white', 5], s: ['white', 2] };
    pm(k, 34, 65, ['h.h', '.l.'], F); pm(k, 43, 67, ['h.h', '.l.'], F); pm(k, 38, 70, ['l.l'], F);
    pm(k, 48, 66, ['s', 's'], F); pm(k, 30, 69, ['.s', 's.'], F);
    k.sparkle(8, 24, 1, 'light'); k.sparkle(72, 50, 1, 'light'); k.sparkle(62, 10, 1, 'white');
  };
})();
