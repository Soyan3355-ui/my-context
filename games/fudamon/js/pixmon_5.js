/* 封札モンスターズ — monster sprites, set 5: evolved forms (ids 31–40). 80x80 front-facing battle sprites at SFC density.
 * Requires pixkit.js (v3). House style: see PIXMON_STYLE.md and pixmon_1.js. All designs are original. */
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
  function mirror(rows) { return rows.map(function (r) { return r.split('').reverse().join(''); }); }
  // points on an ellipse arc, degrees; increasing angle runs clockwise on screen, so tufts point outward
  function arc(cx, cy, rx, ry, a0, a1, step) {
    var p = [];
    for (var a = a0; step > 0 ? a <= a1 : a >= a1; a += step) { var r = a * Math.PI / 180; p.push([cx + Math.cos(r) * rx, cy + Math.sin(r) * ry]); }
    return p;
  }
  var INK = { K: ['black', 0], k: ['black', 2], W: ['white', 6] };

  // 31 ホムラギツネ — fire (かっこいい): the fox pup grown up. Three blazing tails, a flame ruff, a sharp confident grin (still one snaggle fang).
  P[31] = function (k) {
    k.shadow(C, 76.5, 20, 2.2);
    // three bonfire tails fanned behind: two sweep right, one left (one shared glowing volume)
    var FL = { part: 'tails', shade: 'glow', halo: 0.25 };
    [[[48, 67, 3.4], [56, 63, 4.4], [60, 55, 4.6]], [[50, 70, 3], [60, 70.5, 3.8], [67, 65, 4]], [[32, 67, 3.2], [24, 63, 4], [19.5, 56, 4.2]]].forEach(function (t, i) {
      k.tube(t, 'fire', { part: 'tb' + i, shift: -1 });
    });
    k.tufts([[50, 70], [58, 66], [63.5, 57]], 'fire', { part: 'tb0', shift: -1, len: 2.6, w: 3, every: 3, seed: 4 });
    k.tufts([[16, 57], [21, 66], [30, 70]], 'fire', { part: 'tb2', shift: -1, len: 2.6, w: 3, every: 3, seed: 6 });
    k.tube([[60, 57, 5.4], [63, 47, 5.8], [61.5, 37.5, 4.2], [57, 29.5, 1]], 'flame', FL);
    k.spike(66.5, 46, 73, 35.5, 4.4, 'flame', FL);
    k.spike(57.5, 45, 53.5, 38, 3.2, 'flame', FL);
    k.tube([[67, 66, 4.4], [71.5, 58, 4], [71, 50, 1]], 'flame', FL);
    k.spike(73, 63, 77.5, 57, 3, 'flame', FL);
    k.tube([[19.5, 57.5, 4.8], [16.5, 49, 5], [18, 41, 3.6], [22, 34, 0.9]], 'flame', FL);
    k.spike(14, 48, 8.5, 39, 3.8, 'flame', FL);
    k.spike(20.5, 47, 24, 41, 2.6, 'flame', FL);
    // hind haunches + feet
    k.sym(C, function (m, s) {
      k.ellipse(m(29), 67, 7, 7, 'fire', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(27), 74.5, 5.5, 2.4, 'cream', { part: 'hf' + s });
      k.px(m(25), 75, 'cream', 2); k.px(m(28), 75, 'cream', 2);
    });
    // body with a cream chest ruff
    k.ellipse(C, 61, 11.5, 12, 'fire', { part: 'body' });
    k.ellipse(C, 63, 6.5, 8.5, 'cream', { clip: 'body' });
    k.texture('body', 'fur', { seed: 3 });
    k.tufts([[46, 70], [34, 70]], 'cream', { part: 'chest', len: 3.6, w: 3, every: 3, seed: 2 });
    k.ellipse(C, 58.5, 6, 4, 'cream', { part: 'bib', spec: false });
    k.tufts([[45, 60], [C, 62], [35, 60]], 'cream', { part: 'bib', len: 3, w: 3, every: 2.6, seed: 7 });
    // front legs: longer, black socks, claws
    k.sym(C, function (m, s) {
      k.tube([[m(34.5), 61, 3.8], [m(34), 67, 3], [m(34), 71, 3.1]], 'fire', { part: 'leg' + s });
      k.tube([[m(36.5), 62, 0.6], [m(36), 67, 0.5]], null, { adj: -1, clip: 'leg' + s });
      k.tube([[m(33), 62, 0.6], [m(32.5), 67, 0.5]], null, { adj: 1, clip: 'leg' + s });
      k.ellipse(m(34), 71.5, 3.5, 3, 'black', { part: 'leg' + s });
      k.ellipse(m(34), 74.4, 4.4, 2.3, 'black', { part: 'paw' + s });
      k.tooth(m(32), 75.5, m(31.6), 77.4, 1.4); k.tooth(m(35.5), 75.5, m(35.5), 77.4, 1.4);
    });
    // flame ruff: burning cheek-and-neck fringe behind the head
    k.tufts([[29, 38], [24.5, 45], [27, 52], [33, 55]], 'flame', { part: 'rfl', shade: 'glow', len: 5.5, w: 4.4, every: 3, seed: 3 });
    k.tufts([[47, 55], [53, 52], [55.5, 45], [51, 38]], 'flame', { part: 'rfl', shade: 'glow', len: 5.5, w: 4.4, every: 3, seed: 4 });
    k.ellipse(C, 51.5, 11, 4, 'fire', { part: 'ruff' });
    k.texture('ruff', 'fur', { seed: 12 });
    // ears: taller and sharper
    k.sym(C, function (m, s) {
      k.spike(m(31.5), 35, m(22), 15, 11, 'fire', { part: 'ear' + s });
      k.spike(m(31), 34, m(24), 20, 5.5, 'magma', { clip: 'ear' + s, tone: 2 });
      k.tufts(s > 0 ? [[m(29.5), 33], [m(26), 25]] : [[m(26), 25], [m(29.5), 33]], 'cream', { part: 'ef' + s, len: 2.5, w: 2, every: 2, seed: 9 });
      k.px(m(25), 20, 'fire', 5); k.px(m(26), 22, 'fire', 5);
    });
    // head with ragged cheek ruffs
    k.ellipse(C, 40, 13.5, 10.5, 'fire', { part: 'head' });
    k.tufts([[28, 37], [25.5, 43], [28.5, 49]], 'fire', { part: 'head', len: 5, w: 4, every: 3, seed: 5 });
    k.tufts([[51.5, 49], [54.5, 43], [52, 37]], 'fire', { part: 'head', len: 5, w: 4, every: 3, seed: 6 });
    k.ellipse(C, 46, 9.5, 5, 'cream', { clip: 'head' });
    k.texture('head', 'fur', { seed: 4 });
    // forehead flame, taller
    k.tube([[41, 32, 3.4], [38.5, 26.5, 2.8], [39.5, 21.5, 1.7], [43.5, 18, 0.5]], 'flame', { part: 'tuft', shade: 'glow', halo: 0.25 });
    k.spike(43.5, 31, 47.5, 25, 3, 'flame', { part: 'tuft' });
    k.spike(37.5, 30, 34.5, 25.5, 2.4, 'flame', { part: 'tuft' });
    // face
    k.ellipse(C, 45.5, 8.5, 4.6, 'cream', { part: 'face', noseam: true, spec: false });
    k.path([[31, 50], [35, 51], [45, 51], [49, 50]], 'fire', 1);
    k.eye(30, 35, { w: 6, h: 4, iris: 'thunder', side: 'L', angry: 1.5, lid: 0.35 });
    k.eye(44, 35, { w: 6, h: 4, iris: 'thunder', side: 'R', angry: 1.5, lid: 0.35 });
    k.px(29, 39, 'fire', 5); k.px(51, 39, 'fire', 5);
    pm(k, 39, 41, ['bKK', 'KKK', '.K.'], { K: ['black', 1], b: ['black', 5] });
    // lopsided confident grin, raised on the right
    k.mouth([[33, 45.5], [48.5, 44], [46.5, 48.5], [41, 50], [35.5, 48.5]], {});
    k.tooth(36, 45.5, 36.3, 49, 2.2);
    k.tooth(45.5, 44.5, 45.2, 47.2, 1.6);
    k.px(32, 45, 'black', 0); k.px(49, 43, 'black', 0);
    // embers
    k.sparkle(12, 30, 1, 'flame'); k.px(9, 48, 'flame', 5); k.px(70, 28, 'flame', 5); k.px(20, 22, 'flame', 4);
  };

  // 32 オオダルマ — fire (癒し): the fire daruma grown into a giant lucky daruma. Both eyes now painted, gold good-luck
  // patterns, painted beard, two little one-eyed daruma kids on the big cushion. Warm glow.
  P[32] = function (k) {
    k.shadow(C, 76.5, 32, 2.2);
    // big zabuton
    k.poly([[15, 64.5], [65, 64.5], [73, 76], [7, 76]], 'violet', { part: 'zab', flat: true, shift: -1 });
    k.texture('zab', 'cloth', { size: 2 });
    k.line(15, 66, 65, 66, 'violet', 4); k.line(9, 74, 71, 74, 'violet', 1);
    for (var zx = 14; zx <= 66; zx += 6) { k.px(zx, 70, 'gold', 4); k.px(zx + 3, 72, 'gold', 3); }
    k.sym(C, function (m, s) { k.spike(m(8), 75, m(3), 78, 3, 'gold', { part: 'tas' + s }); k.px(m(8), 75, 'gold', 6); });
    // head flame (one curling tube)
    k.tube([[C, 31, 4], [37.5, 25, 3.2], [39.5, 19.5, 2], [44, 16, 0.5]], 'flame', { part: 'fl', shade: 'glow', halo: 0.3 });
    k.spike(43, 29, 47.5, 22.5, 3.4, 'flame', { part: 'fl' });
    k.spike(36.5, 28, 33, 23.5, 2.6, 'flame', { part: 'fl' });
    // body
    k.ellipse(C, 55, 19.5, 15, 'red', { part: 'body', halo: 0.2 });
    k.ellipse(C, 42, 16, 13, 'red', { part: 'body' });
    k.texture('body', 'dots', { seed: 5 });
    // gold hood trim
    k.ellipse(C, 42.5, 13.6, 12.2, 'gold', { clip: 'body' });
    k.ellipse(C, 42.5, 13.6, 12.2, null, { adj: -1, clip: 'body', pattern: 'sparse' });
    // gold patterns: cloud swirls, a treasure medallion, a seigaiha hem
    var G = { g: ['gold', 5], h: ['gold', 6], d: ['gold', 3] };
    var sw = ['.ggg..', 'g...g.', 'g.hg.g', '.d..gd', '..ddd.'];
    pm(k, 24, 54, sw, G); pm(k, 50, 54, mirror(sw), G);
    pm(k, 23, 43, ['.gg.', 'g..g', '..hg'], G); pm(k, 53, 43, mirror(['.gg.', 'g..g', '..hg']), G);
    k.circle(C, 61.5, 4.2, 'gold', { part: 'med' });
    k.circle(C, 61.5, 2.2, 'red', { part: 'medc', light: 0.2 });
    k.px(39, 60, 'red', 6);
    k.sym(C, function (m) { k.path([[m(34), 61], [m(31), 61]], 'gold', 4); });
    for (var sx = 25; sx <= 53; sx += 4) pm(k, sx, 65, ['.gg.', 'g..g'], G);
    // lacquer strokes
    k.path([[27, 42], [27, 37], [30, 33]], 'red', 5); k.px(31, 32, 'red', 6);
    k.path([[23, 52], [22, 57]], 'red', 5);
    k.path([[56, 52], [58, 57], [58, 62]], 'red', 1);
    // face panel
    k.ellipse(C, 43, 11, 10, 'cream', { part: 'face', spec: false, dither: false, flat: true, light: 0.3 });
    k.path([[33, 51], [36, 52.5], [44, 52.5], [47, 51]], 'cream', 3);
    // bold painted brows (daruma-style swoops)
    pm(k, 30, 35, ['...KKK', '.KKKK.', 'KK....'], INK);
    pm(k, 44, 35, mirror(['...KKK', '.KKKK.', 'KK....']), INK);
    // BOTH eyes painted now: big round daruma eyes
    var E = { K: ['black', 0], P: ['black', 0], W: ['white', 6], w: ['white', 4], g: ['black', 3] };
    pm(k, 31, 38, ['.KKKKK.', 'KWWPPWK', 'KWPPPgK', 'KwPPPwK', '.KKKKK.'], E);
    pm(k, 42, 38, ['.KKKKK.', 'KWPPWWK', 'KgPPPWK', 'KwPPPwK', '.KKKKK.'], E);
    // nose, gold painted beard curls on the cheeks, calm smile
    pm(k, 39, 43, ['.n.', 'nNn'], { n: ['skin', 4], N: ['skin', 3] });
    pm(k, 29, 45, ['g..', '.g.', 'gg.'], { g: ['gold', 3] }); pm(k, 49, 45, ['..g', '.g.', '.gg'], { g: ['gold', 3] });
    pm(k, 35, 46, ['K.........K', '.KK.....KK.', '...KKKKK...'], INK);
    pm(k, 38, 47, ['.MMMMM', '..MSS'], { M: ['mouth', 1], S: ['mouth', 4] });
    k.rect(31, 44, 3, 1, 'sakura', { tone: 4, part: 'bl1', outline: 'none' });
    k.rect(46, 44, 3, 1, 'sakura', { tone: 4, part: 'bl2', outline: 'none' });
    // two little daruma kids on the cushion corners (each still has only one eye painted, like the base)
    k.sym(C, function (m, s) {
      k.ellipse(m(15.5), 67.5, 6, 5.2, 'red', { part: 'kb' + s });
      k.ellipse(m(15.5), 62.5, 5, 4.6, 'red', { part: 'kb' + s });
      k.ellipse(m(15.5), 63, 3.6, 3.2, 'cream', { part: 'kf' + s, spec: false, flat: true, light: 0.3 });
      k.px(m(13), 69, 'gold', 5); k.px(m(15.5), 70, 'gold', 5); k.px(m(18), 69, 'gold', 5); k.px(m(14), 70, 'gold', 4); k.px(m(17), 70, 'gold', 4);
      k.px(m(12), 59, 'red', 6); k.px(m(12), 60, 'red', 5);
      k.px(m(15), 65, 'black', 1); k.px(m(16), 65, 'black', 1);
      k.tube([[m(15.5), 58.5, 1.4], [m(16.5), 55.5, 0.4]], 'flame', { part: 'kfl' + s, shade: 'glow' });
    });
    pm(k, 13, 62, ['KK.oo'], { K: ['black', 0], o: ['white', 3] });
    pm(k, 63, 62, ['oo.KK'], { K: ['black', 0], o: ['white', 3] });
    // warm embers
    k.sparkle(13, 40, 1, 'light'); k.sparkle(67, 46, 1, 'light'); k.px(62, 30, 'flame', 5); k.px(19, 30, 'flame', 5); k.sparkle(26, 22, 1, 'light');
  };

  // 33 シシオウエン — fire (かっこいい): the shishi grown into an armoured lion-king guardian. Huge blazing mane,
  // gold crown plate and armour, one forepaw planted on a fireball.
  P[33] = function (k) {
    k.shadow(C, 76.5, 26, 2.4);
    // flame-tipped tail
    k.tube([[54, 66, 3], [63, 64, 2.6], [68, 57, 2.2], [67, 51, 2]], 'fur', { part: 'tail', shift: -1 });
    k.tube([[67, 52, 4.2], [69.5, 45, 3.4], [66, 38, 0.6]], 'flame', { part: 'tailf', shade: 'glow' });
    k.spike(71, 49, 76, 41, 3.4, 'flame', { part: 'tailf' });
    // hind legs, wide and back
    k.sym(C, function (m, s) {
      k.ellipse(m(24), 63, 7.5, 8, 'fur', { part: 'hip' + s, shift: -1 });
      k.tube([[m(23), 67, 3.4], [m(21), 72.5, 2.8]], 'fur', { part: 'hip' + s, shift: -1 });
      k.ellipse(m(20), 74, 5, 2.3, 'fur', { part: 'hp' + s, shift: -1 });
      k.px(m(18), 75, 'fur', 0); k.px(m(21), 75, 'fur', 0);
    });
    // chest
    k.ellipse(C, 58, 14.5, 12, 'fur', { part: 'body' });
    k.texture('body', 'fur', { seed: 2 });
    // gold chest armour with a flame crest
    k.poly([[29, 51], [51, 51], [49.5, 60], [C, 65], [30.5, 60]], 'gold', { part: 'cuir' });
    k.poly([[29, 51], [C, 51], [C, 65], [30.5, 60]], null, { adj: 1, clip: 'cuir' });
    k.path([[31, 55], [C, 58.5], [49, 55]], 'gold', 2);
    k.circle(C, 56, 2.4, 'red', { part: 'cgem' }); k.px(39, 55, 'white', 6);
    // mane drape on the chest
    k.tufts([[52, 49], [46, 51], [34, 51], [28, 49]], 'fire', { part: 'drape', len: 5, w: 4, every: 2.8, seed: 5, shift: -1 });
    // fireball under the right forepaw
    k.circle(51.5, 70, 6.8, 'flame', { part: 'fball', shade: 'glow', halo: 0.3 });
    k.spike(57, 66, 63, 61, 3.4, 'flame', { part: 'fball' }); k.spike(58, 71, 64.5, 70, 3, 'flame', { part: 'fball' }); k.spike(46, 66, 43, 60.5, 2.8, 'flame', { part: 'fball' });
    k.path([[47, 70], [48, 73], [51, 74.5], [55, 73], [56, 70]], 'flame', 2); k.path([[49, 70], [51, 72], [53, 71]], 'magma', 3);
    // forelegs: left planted, right on the ball; gold greaves
    k.sym(C, function (m, s) {
      var yb = s > 0 ? 0 : -8.5;
      var o = s > 0 ? [[m(27.5), 66 + yb], [m(26), 59 + yb]] : [[m(26), 59 + yb], [m(27.5), 66 + yb]];
      k.tufts(o, 'fire', { part: 'curl' + s, len: 4, w: 3, every: 2.5, seed: 3 + s });
      k.tube([[m(32.5), 56, 5], [m(31.5), 62 + yb * 0.5, 3.8], [m(31), 66 + yb, 3.9], [m(31), 71.5 + yb, 3.4]], 'fur', { part: 'leg' + s });
      k.ellipse(m(31), 73.5 + yb, 5.4, 2.7, 'fur', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 6 + s });
      k.tube([[m(35.5), 57, 0.7], [m(34.5), 63 + yb * 0.5, 0.6]], null, { adj: -1, clip: 'leg' + s });
      k.tube([[m(31.5), 66 + yb, 3.9], [m(31.2), 68.5 + yb, 3.6]], 'gold', { part: 'grv' + s });
      k.px(m(30), 66 + yb, 'gold', 6); k.line(m(28), 68 + yb, m(34), 68 + yb, 'gold', 2);
      [28, 31, 34].forEach(function (cx) { k.tooth(m(cx), 75 + yb, m(cx - 0.3), 77.4 + yb, 1.8, 'bone'); });
    });
    // gold pauldrons
    k.sym(C, function (m, s) {
      k.ellipse(m(24.5), 50, 6.5, 4.8, 'gold', { part: 'pau' + s });
      k.spike(m(21), 48, m(15), 44, 3.4, 'gold', { part: 'paus' + s });
      k.path([[m(20), 52], [m(29), 52]], 'gold', 2); k.px(m(22), 48, 'gold', 6);
    });
    // HUGE blazing mane
    var pts = arc(C, 32, 20, 18.5, -205, 25, 10);
    k.ellipse(C, 32.5, 20.5, 19, 'fire', { part: 'mane' });
    k.tufts(pts, 'fire', { part: 'mane', len: 6, w: 5, every: 3.3, seed: 3 });
    k.tufts(pts.slice(1, -1), 'flame', { part: 'mtip', len: 5, w: 2.8, every: 6, seed: 9, shade: 'glow', halo: 0.2 });
    k.texture('mane', 'fur', { seed: 4 });
    [[[24, 22], [21, 31], [23, 41]], [[56, 22], [59, 31], [57, 41]], [[29, 15], [24, 19]], [[51, 15], [56, 19]], [[27, 45], [23, 48]], [[53, 45], [57, 48]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 0.6]; }), null, { adj: -2, clip: 'mane' });
      k.tube(f.map(function (p) { return [p[0] + 1.3, p[1], 0.5]; }), null, { adj: 1, clip: 'mane' });
    });
    // head
    k.ellipse(C, 36, 11.5, 10.5, 'fur', { part: 'head' });
    k.texture('head', 'fur', { seed: 8 });
    // gold crown plate: three points
    k.poly([[28, 30], [31, 25], [34.5, 24], [36.5, 19], [C, 23], [43.5, 19], [45.5, 24], [49, 25], [52, 30], [47, 31.5], [C, 29.5], [33, 31.5]], 'gold', { part: 'plate' });
    k.poly([[31, 25], [36.5, 19], [C, 23], [C, 29.5], [33, 31.5], [28, 30]], null, { adj: 1, clip: 'plate' });
    k.circle(C, 26.5, 2, 'red', { part: 'gem' }); k.px(39, 25, 'white', 6);
    k.px(31, 28, 'steel', 5); k.px(49, 28, 'steel', 5);
    // eyes under the plate
    k.eye(30.5, 30.5, { w: 7, h: 5, iris: 'thunder', side: 'L', angry: 1.6, lid: 0.3, brow: false });
    k.eye(42.5, 30.5, { w: 7, h: 5, iris: 'thunder', side: 'R', angry: 1.6, lid: 0.3, brow: false });
    // muzzle + nose
    k.sym(C, function (m, s) { k.ellipse(m(35.5), 41, 5, 3.6, 'cream', { part: 'muz' + s }); });
    pm(k, 37, 35, ['.hnnnn.', '.nnnnN.', '..KnK..', '...K...'], { n: ['skin', 3], h: ['skin', 5], N: ['skin', 2], K: ['black', 0] });
    // roaring maw
    k.mouth([[31, 42.5], [49, 42.5], [47, 48.5], [C, 51], [33, 48.5]], {});
    k.tooth(33.5, 42.5, 34, 47, 2.8); k.tooth(46.5, 42.5, 46, 47, 2.8);
    k.tooth(37.5, 42.5, 37.5, 44.8, 1.6); k.tooth(42.5, 42.5, 42.5, 44.8, 1.6);
    k.tooth(35.5, 49.5, 35.5, 46.5, 2.2); k.tooth(44.5, 49.5, 44.5, 46.5, 2.2);
    k.px(33, 36, 'fur', 1); k.px(34, 37, 'fur', 1); k.px(47, 36, 'fur', 1); k.px(46, 37, 'fur', 1);
    k.sparkle(8, 26, 1, 'flame'); k.px(72, 24, 'flame', 5); k.px(10, 56, 'flame', 4);
  };

  // 34 カザンガニ — fire (コミカル): the hot-spring crab grown into a volcano crab carrying its own steaming onsen on
  // its back. Towel folded on the rim, wooden bucket, a delighted face.
  P[34] = function (k) {
    k.shadow(C, 76.5, 28, 2.3);
    // steam columns rising off the onsen
    [[40, 0, 36, 10], [26, 1, 35, 17], [55, 2, 34, 19]].forEach(function (d) {
      var x = d[0], y0 = d[2], y1 = d[3], h = y0 - y1;
      var o = { outline: 'none', shade: 'flat', flatTone: 4, part: 'stm' + d[1] };
      k.tube([[x, y0, 1.6], [x - 2, y0 - h * 0.3, 2], [x + 0.5, y0 - h * 0.6, 1.7], [x - 1, y1, 0.5]], 'ice', o);
      k.path([[x - 1, y0 - 1], [x - 3, y0 - h * 0.3], [x - 1, y0 - h * 0.6]], 'white', 6);
    });
    // walking legs (behind)
    k.sym(C, function (m, s) {
      for (var i = 0; i < 3; i++) {
        var bx = 30 + i * 2.5, kx = 19 + i * 4.5, tx = 15 + i * 5;
        k.tube([[m(bx), 60 + i, 2.5], [m(kx), 58 + i * 2, 2.2], [m(tx), 75, 1]], 'magma', { part: 'lg' + s + i, shift: -1 });
        k.px(m(kx), 58 + i * 2, 'magma', 5);
      }
    });
    k.ellipse(C, 63, 13, 5.5, 'magma', { part: 'belly', shift: -1 });
    // volcano shell with the onsen crater
    k.poly([[17, 62], [20, 50], [27, 40], [53, 40], [60, 50], [63, 62], [54, 67], [26, 67]], 'magma', { part: 'shell' });
    k.tufts([[18, 58], [21, 49], [27, 41]], 'magma', { part: 'shell', len: 2.4, w: 3, every: 3.5, seed: 2 });
    k.tufts([[53, 41], [59, 49], [62, 58]], 'magma', { part: 'shell', len: 2.4, w: 3, every: 3.5, seed: 3 });
    k.texture('shell', 'stone', { size: 4, seed: 3 });
    k.ellipse(C, 39, 17, 5.4, 'stone', { part: 'rim', light: 0.3 });
    k.texture('rim', 'stone', { size: 3, seed: 5 });
    [[24, 41, 2.6], [29, 43, 2.8], [35, 44, 2.6], [41, 44.4, 2.8], [47, 43.6, 2.6], [52.5, 42, 2.6], [56.5, 40, 2.2]].forEach(function (r, i) {
      k.ellipse(r[0], r[1], r[2] + 0.4, r[2] * 0.8, 'stone', { part: 'rock' + i, light: 0.25 });
    });
    k.ellipse(C, 38.6, 14, 3.4, 'aqua', { part: 'pool', shade: 'flat', flatTone: 3, outline: 'none' });
    k.ellipse(C, 39.2, 11, 2.2, 'aqua', { clip: 'pool', tone: 4 });
    k.path([[29, 37], [35, 36.5]], 'aqua', 6); k.path([[45, 38], [50, 38.5]], 'aqua', 5); k.px(41, 38, 'aqua', 6); k.px(37, 40, 'aqua', 5);
    // lava cracks
    k.path([[26, 47], [28, 52], [26, 57]], 'flame', 5); k.path([[54, 46], [52, 51], [54, 57]], 'flame', 5);
    k.px(28, 52, 'flame', 6); k.px(52, 51, 'flame', 6);
    var B = { h: ['magma', 6], l: ['magma', 5], s: ['magma', 1] };
    pm(k, 23, 51, ['.l.', 'lhl', '.s.'], B); pm(k, 55, 50, ['.l.', 'lhl', '.s.'], B);
    // delighted face on the shell front: big open smile, blush
    k.mouth([[33, 54], [47, 54], [45.5, 59], [C, 61], [34.5, 59]], {});
    k.path([[31.5, 53], [33, 54]], 'black', 0); k.path([[48.5, 53], [47, 54]], 'black', 0);
    k.rect(27, 53, 3, 1, 'sakura', { tone: 5, part: 'bs1', outline: 'none' });
    k.rect(51, 53, 3, 1, 'sakura', { tone: 5, part: 'bs2', outline: 'none' });
    // towel folded over the left rim
    k.poly([[20, 36], [30, 37], [30.5, 41], [20.5, 40]], 'white', { part: 'towel', flat: true, light: 0.3 });
    k.poly([[20.5, 40], [26, 40.5], [25.5, 46], [21, 45.5]], 'white', { part: 'towel2', flat: true });
    k.texture('towel', 'cloth', { size: 2 });
    k.line(20, 38, 30, 39, 'water', 4); k.line(21, 43, 25, 43.5, 'water', 3);
    k.line(21, 37, 29, 38, 'white', 6);
    // wooden bucket on the right rim
    k.poly([[51, 29], [61, 29], [60, 37.5], [52, 37.5]], 'wood', { part: 'oke', light: 0.35 });
    k.texture('oke', 'bark', { size: 3 });
    k.rect(51, 31, 11, 1, 'steel', { part: 'hoop', tone: 4, outline: 'none' });
    k.rect(51, 35, 11, 1, 'steel', { part: 'hoop', tone: 3, outline: 'none' });
    k.ellipse(56, 29.3, 5, 1.3, 'wood', { part: 'okt', tone: 1, outline: 'none' });
    k.path([[53, 30], [58, 30]], 'wood', 6);
    // stalk eyes, squeezed shut with delight
    k.sym(C, function (m, s) {
      k.tube([[m(36), 50, 1.3], [m(35), 31, 1.1]], 'magma', { part: 'st' + s });
      k.ellipse(m(34.5), 27, 4.6, 4.4, 'magma', { part: 'eb' + s });
    });
    var HE = { K: ['black', 0] };
    pm(k, 32, 25, ['.KKK.', 'K...K', 'K...K'], HE); pm(k, 44, 25, ['.KKK.', 'K...K', 'K...K'], HE);
    k.px(31, 29, 'sakura', 5); k.px(49, 29, 'sakura', 5);
    // GIANT claw (left), raised in joy
    k.tube([[24, 58, 3.4], [15, 56, 3.2], [11, 49, 3.2]], 'magma', { part: 'armL' });
    k.tube([[6, 38, 3.8], [3.5, 30, 3], [6, 22, 1.2]], 'magma', { part: 'fA' });
    k.tube([[15, 38, 3.4], [17, 30, 2.6], [14, 24, 0.8]], 'magma', { part: 'fB' });
    k.ellipse(10, 43, 8.5, 7, 'magma', { part: 'claw' });
    k.texture('claw', 'stone', { size: 3, seed: 7 });
    k.tube([[6, 40, 0.6], [8, 46, 0.6]], null, { adj: 1, clip: 'claw' });
    [[7, 31], [6.5, 27], [13.5, 31], [14, 27]].forEach(function (p) { k.px(p[0], p[1], 'bone', 5); });
    k.px(9, 43, 'magma', 6);
    // small claw (right) holding a wooden dipper
    k.tube([[56, 59, 2.6], [63, 57, 2.4], [67, 52, 2.2]], 'magma', { part: 'armR' });
    k.tube([[68, 49, 0.8], [70, 36, 0.7]], 'wood', { part: 'hsh', shade: 'flat', flatTone: 4 });
    k.poly([[67, 33], [73.5, 33], [73, 37.5], [67.5, 37.5]], 'wood', { part: 'hcup' });
    k.line(67, 35, 73, 35, 'wood', 2);
    k.spike(66, 49, 64, 44, 3, 'magma', { part: 'sfA' });
    k.spike(70, 49, 72, 44.5, 2.8, 'magma', { part: 'sfB' });
    k.ellipse(68, 50.5, 3.8, 3.2, 'magma', { part: 'sclaw' });
    k.px(67, 50, 'magma', 6);
    k.px(72, 31, 'white', 5); k.px(66, 30, 'white', 4);
  };

  // 35 エンリュウオウ — fire (かっこいい): the obsidian dragon crowned magma-king. Bigger wings, a crown of horns,
  // a molten core in the chest and magma dripping from jaw and claws. Still the roaring, toothy laugh.
  P[35] = function (k) {
    k.shadow(C, 76.5, 27, 2.4);
    // big bat wings, wrist at the top outer corner
    k.sym(C, function (m, s) {
      k.poly([[m(30), 44], [m(12), 5], [m(1.5), 26], [m(4), 31], [m(3), 42], [m(9), 40], [m(11), 51], [m(17), 45], [m(21), 54], [m(26), 48], [m(29), 54]], 'fire', { part: 'wing' + s, flat: true });
      var bo = { part: 'wb' + s, noseam: true };
      k.tube([[m(30), 44, 2.2], [m(12), 6, 1.6]], 'obsidian', bo);
      k.tube([[m(12), 6, 1.1], [m(2), 26, 0.6]], 'obsidian', bo);
      k.tube([[m(12), 6, 1], [m(4), 41, 0.6]], 'obsidian', bo);
      k.tube([[m(12), 6, 1], [m(11), 50, 0.6]], 'obsidian', bo);
      k.tube([[m(12), 6, 1], [m(21), 53, 0.6]], 'obsidian', bo);
      k.spike(m(12), 6, m(9), 1.5, 2.8, 'bone', { part: 'wc' + s });
      k.tube([[m(8), 20, 0.5], [m(6), 33, 0.5]], null, { adj: -1, clip: 'wing' + s });
      k.tube([[m(14), 24, 0.5], [m(14), 38, 0.5]], null, { adj: -1, clip: 'wing' + s });
      k.tube([[m(18), 28, 0.5], [m(20), 42, 0.5]], null, { adj: -1, clip: 'wing' + s });
    });
    // tail
    k.tube([[52, 70, 6], [63, 72, 4.5], [71, 67, 3.2], [73, 59, 1.6]], 'obsidian', { part: 'tail' });
    k.tufts([[71, 64], [67, 70], [59, 72]], 'bone', { part: 'tailsp', len: 3, w: 2.4, every: 4, seed: 3 });
    k.spike(73, 61, 75.5, 49, 6.5, 'flame', { part: 'tfl', shade: 'glow' });
    k.texture('tail', 'scales', { size: 4 });
    // legs
    k.sym(C, function (m, s) {
      k.ellipse(m(30), 66, 8, 8, 'obsidian', { part: 'thigh' + s });
      k.ellipse(m(28.5), 73, 9, 3.2, 'obsidian', { part: 'foot' + s });
      [22, 26, 30.5].forEach(function (cx) { k.tooth(m(cx), 73.5, m(cx - 0.8), 76.8, 2.8, 'bone'); });
      k.texture('thigh' + s, 'scales', { size: 4, seed: 2 });
      k.tube([[m(33), 60, 0.6], [m(35.5), 67, 0.6]], null, { adj: -1, clip: 'thigh' + s });
      k.path([[m(26), 64], [m(28), 67], [m(26), 70]], 'magma', 4);
    });
    // body: scaled hide, molten core, cracked belly plates
    k.ellipse(C, 55, 17, 15.5, 'obsidian', { part: 'body' });
    k.texture('body', 'scales', { size: 4 });
    k.ellipse(C, 59, 9, 12.5, 'fire', { clip: 'body' });
    for (var y = 50; y <= 71; y += 4) k.rect(30, y, 20, 1, 'fire', { adj: -2, clip: 'body' });
    k.circle(C, 55, 5.2, 'flame', { part: 'core', shade: 'glow', halo: 0.3 });
    [[[35, 55], [31, 53], [28, 55]], [[45, 55], [49, 52], [52, 54]], [[38, 60], [36, 65], [37, 69]], [[42, 60], [44, 65]]].forEach(function (c) { k.path(c, 'magma', 5); });
    k.path([[27, 46], [29, 50], [27, 54]], 'magma', 5); k.path([[53, 46], [51, 50], [53, 54]], 'magma', 5);
    // arms raised, claws up, magma dripping
    k.sym(C, function (m, s) {
      k.tube([[m(28), 49, 5.2], [m(20), 50, 4.4], [m(16), 45, 4]], 'obsidian', { part: 'arm' + s });
      k.ellipse(m(15), 42, 4.8, 4.4, 'obsidian', { part: 'arm' + s });
      k.tube([[m(26), 47, 0.6], [m(20), 47.5, 0.6]], null, { adj: 1, clip: 'arm' + s });
      k.tooth(m(12), 40, m(10), 34, 2.8, 'bone'); k.tooth(m(15.5), 39, m(15.5), 32.5, 2.8, 'bone'); k.tooth(m(19), 40, m(20.5), 34.5, 2.8, 'bone');
      k.tube([[m(19), 53.5, 0.9], [m(19.3), 56.5, 0.6]], 'magma', { part: 'drA' + s, tone: 4 }); k.circle(m(19.3), 57.5, 1.2, 'magma', { part: 'drA' + s, tone: 3 }); k.px(m(19), 57, 'magma', 5);
    });
    // crown of horns + jagged cheek frills
    k.sym(C, function (m, s) {
      k.tube([[m(32), 19, 3.8], [m(24), 11, 2.6], [m(20), 3, 0.8]], 'bone', { part: 'horn' + s });
      k.px(m(27), 14, 'bone', 2); k.px(m(28), 15, 'bone', 2); k.px(m(23), 8, 'bone', 2);
      k.spike(m(28), 28, m(17), 26, 6.5, 'obsidian', { part: 'fr' + s });
      k.spike(m(28), 33, m(18), 36, 5.5, 'obsidian', { part: 'fr' + s });
    });
    // head, snout, jaw
    k.ellipse(C, 25.5, 14, 11.5, 'obsidian', { part: 'head' });
    k.texture('head', 'scales', { size: 3, seed: 5 });
    k.ellipse(C, 41, 9, 4.2, 'obsidian', { part: 'jaw' });
    k.ellipse(C, 31, 10.5, 5.2, 'obsidian', { part: 'head' });
    k.px(36, 29, 'black', 0); k.px(37, 29, 'black', 0); k.px(43, 29, 'black', 0); k.px(44, 29, 'black', 0);
    k.px(36, 28, 'magma', 5); k.px(44, 28, 'magma', 5);
    // gold crown band with three points
    k.poly([[30, 18.5], [33, 14.5], [36, 14], [37.5, 8], [C, 13], [42.5, 8], [44, 14], [47, 14.5], [50, 18.5], [C, 16.5]], 'gold', { part: 'crown' });
    k.spike(C, 14, C, 4, 3.6, 'gold', { part: 'crown' });
    k.circle(C, 15, 1.6, 'red', { part: 'cgem' }); k.px(39, 14, 'white', 6);
    k.px(34, 15, 'gold', 6); k.px(38, 10, 'gold', 6);
    // roaring maw with a magma glow inside
    k.mouth([[29.5, 33], [50.5, 33], [47.5, 41.5], [C, 44], [32.5, 41.5]], {});
    [31.5, 35, 38.5, 42, 45.5].forEach(function (tx) { k.tooth(tx + 1.5, 33, tx + 1.7, 36.5, 2.8, 'bone'); });
    k.tooth(34, 42, 34, 38.5, 2.6, 'bone'); k.tooth(46, 42, 46, 38.5, 2.6, 'bone');
    k.tube([[46, 43.5, 0.9], [46.3, 46, 0.6]], 'magma', { part: 'drJ', tone: 4 }); k.circle(46.3, 47.2, 1.2, 'magma', { part: 'drJ', tone: 3 }); k.px(46, 47, 'magma', 5);
    k.px(35, 44, 'magma', 4); k.px(35, 45, 'magma', 3);
    // eyes
    k.eye(28.5, 20, { w: 8, h: 5, iris: 'thunder', side: 'L', angry: 2, brow: false });
    k.eye(43.5, 20, { w: 8, h: 5, iris: 'thunder', side: 'R', angry: 2, brow: false });
    k.sym(C, function (m, s) { k.tube([[m(27.5), 18, 1.9], [m(37), 21.5, 1.9]], 'obsidian', { part: 'brow' + s, light: 0.3 }); });
    k.px(8, 58, 'flame', 5); k.px(72, 44, 'flame', 4); k.sparkle(66, 76, 1, 'flame');
  };

  // 36 シズクヒメ — water (癒し): the droplet child grown into a water-nymph princess seated in a lotus.
  // Lotus-leaf rain parasol (her old hat), droplet tiara, serene smile.
  P[36] = function (k) {
    k.shadow(C, 76.5, 22, 1.8);
    // ripples
    var RP = { a: ['ice', 5], b: ['ice', 3] };
    pm(k, 11, 74, ['aab.....', '..baaa..'], RP); pm(k, 61, 74, ['.....baa', '..aaab..'], RP);
    // lily pad
    k.ellipse(C, 73, 23, 3.4, 'grass', { part: 'pad', flat: true, shift: -1 });
    k.poly([[C, 73], [37, 77], [43, 77]], null, { erase: true });
    // lotus: back petals
    k.sym(C, function (m, s) {
      k.leaf(m(36), 71, m(20), 58, 7, 'sakura', { part: 'pb1' + s, shift: -1 });
      k.leaf(m(38), 70, m(28), 53, 7, 'sakura', { part: 'pb2' + s, shift: -1 });
    });
    // long flowing water hair (behind)
    k.sym(C, function (m, s) {
      k.tube([[m(33), 33, 4.6], [m(28.5), 40, 4.4], [m(29.5), 47, 4], [m(26), 54, 3.4], [m(28), 60, 2.2], [m(24), 65, 0.8]], 'water', { part: 'hairB' + s });
      k.tufts(s > 0 ? [[m(28), 60], [m(25.5), 52], [m(26.5), 44]] : [[m(26.5), 44], [m(25.5), 52], [m(28), 60]], 'water', { part: 'hairB' + s, len: 2.6, w: 2.6, every: 3.4, seed: 5 + s });
      k.tube([[m(28), 40, 0.6], [m(29), 47, 0.6], [m(25.5), 54, 0.5]], null, { adj: 1, clip: 'hairB' + s });
      k.tube([[m(31), 41, 0.5], [m(32), 47, 0.5], [m(29), 54, 0.5]], null, { adj: -1, clip: 'hairB' + s });
    });
    // gown (bell), sitting in the lotus
    k.poly([[34, 52], [46, 52], [52, 68], [C, 70], [28, 68]], 'aqua', { part: 'gown' });
    k.texture('gown', 'cloth', { size: 3 });
    k.tube([[C, 55, 0.6], [39, 62, 0.6], [39.5, 69, 0.6]], null, { adj: -1, clip: 'gown' });
    k.tube([[35, 57, 0.6], [32, 67, 0.6]], null, { adj: 1, clip: 'gown' });
    k.tufts([[52, 68], [C, 70.5], [28, 68]], 'aqua', { part: 'gown', len: 2, w: 2.6, every: 2.8, seed: 3 });
    // front lotus petals
    k.sym(C, function (m, s) {
      k.leaf(m(38), 72, m(24), 67, 5.5, 'sakura', { part: 'pf' + s });
      k.px(m(28), 68, 'sakura', 6);
    });
    k.leaf(C, 74, C, 66.5, 5, 'sakura', { part: 'pfc' });
    k.px(C, 69, 'sakura', 6);
    // torso + sash
    k.ellipse(C, 49.5, 5.4, 5.6, 'aqua', { part: 'torso', light: 0.1 });
    k.poly([[36, 45], [44, 45], [C, 49]], 'cream', { clip: 'torso', tone: 5 });
    k.rect(34, 52, 12, 2, 'sakura', { part: 'sash', flat: true });
    k.px(C, 52, 'gold', 6); k.px(C, 53, 'gold', 4);
    // left hand resting in the lap, right hand up holding the parasol
    k.tube([[35.5, 47, 1.6], [33, 52, 1.4], [37, 56, 1.4]], 'cream', { part: 'armL', light: 0.2 });
    k.tube([[44.5, 47, 1.6], [49, 50, 1.4], [53, 46, 1.4]], 'cream', { part: 'armR', light: 0.2 });
    // parasol: lotus-leaf canopy on a reed handle
    k.tube([[55, 49, 0.8], [49, 12, 0.8]], 'wood', { part: 'hdl', shade: 'flat', flatTone: 4 });
    k.ellipse(54, 46.5, 2, 2, 'cream', { part: 'handR', light: 0.2 });
    k.ellipse(49, 15.5, 18, 5, 'grass', { part: 'para' });
    k.ellipse(49, 12.5, 9, 4, 'grass', { part: 'para' });
    k.tufts([[67, 16], [49, 20.5], [31, 16]], 'grass', { part: 'para', len: 1.8, w: 3, every: 3, seed: 6 });
    [[31, 17], [37, 19], [44, 20], [54, 20], [61, 19], [66, 17]].forEach(function (p) { k.line(49, 11, p[0], p[1], 'grass', 2); });
    k.path([[35, 13], [41, 10]], 'grass', 5); k.px(43, 9, 'grass', 6);
    k.tube([[49, 9, 0.8], [50, 6.5, 0.6]], 'grass', { part: 'tip', shade: 'flat', flatTone: 4 });
    // drips off the parasol rim
    [[31, 21], [31, 25], [67, 21], [67, 24], [67, 28], [60, 24]].forEach(function (p, i) { k.px(p[0], p[1], 'ice', i % 2 ? 4 : 6); });
    // head
    k.ellipse(C, 36, 9, 8, 'cream', { part: 'head', light: 0.25, spec: false, flat: true });
    k.poly([[30.5, 28], [49.5, 28], [50, 33], [47.5, 35], [45.5, 33], [43, 35.5], [C, 32.5], [37, 35.5], [34.5, 33], [32.5, 35], [30, 33]], 'water', { clip: 'head', tone: 3 });
    k.path([[32, 30], [36, 29]], 'water', 5);
    k.px(33, 31, 'water', 6); k.px(34, 31, 'water', 5);
    // droplet tiara
    k.leaf(C, 28.5, C, 21, 4, 'ice', { part: 'tia0', halo: 0.3 });
    k.sym(C, function (m, s) { k.leaf(m(35.5), 28.5, m(34.5), 24.5, 2.6, 'ice', { part: 'tia' + s }); });
    k.px(39, 24, 'white', 6); k.px(39, 25, 'white', 6); k.px(C, 27, 'crystal', 3);
    k.rect(33, 28, 15, 1, 'gold', { part: 'band', tone: 5, outline: 'none' });
    // serene face: gentle lidded eyes, soft smile, blush
    var F = { K: ['black', 0], p: ['water', 2], w: ['white', 6] };
    pm(k, 33, 37, ['.KKK.', 'K...K'], F); pm(k, 42, 37, ['.KKK.', 'K...K'], F);
    k.px(32, 37, 'black', 0); k.px(48, 37, 'black', 0);
    pm(k, 38, 41, ['K..K', '.KK.'], { K: ['black', 1] });
    k.rect(32, 39, 2, 1, 'sakura', { tone: 4, part: 'cs1', outline: 'none' });
    k.rect(46, 39, 2, 1, 'sakura', { tone: 4, part: 'cs2', outline: 'none' });
    // bubbles + sparkles
    k.circle(16, 44, 1.8, 'ice', { part: 'b1', outline: 'soft' }); k.px(15, 43, 'white', 6);
    k.circle(21, 34, 1.2, 'ice', { part: 'b2', outline: 'soft' });
    k.sparkle(66, 54, 1, 'ice'); k.sparkle(12, 60, 1, 'ice');
  };

  // 37 カッパオヤブン — water (コミカル): the kappa kid grown into a sumo boss. Mawashi, cucumber held like a katana,
  // proud grin with the old wink, head plate brimming over.
  P[37] = function (k) {
    k.shadow(C, 76.5, 22, 2.2);
    // shell behind
    k.ellipse(C, 52, 21, 15, 'cream', { part: 'shell', shift: -1 });
    k.ellipse(C, 51.5, 19, 13.5, 'leaf', { clip: 'shell' });
    k.texture('shell', 'scales', { size: 5, seed: 2 });
    // sumo legs, wide stance
    k.sym(C, function (m, s) {
      k.ellipse(m(29), 68, 6.5, 6, 'aqua', { part: 'thigh' + s });
      k.tube([[m(28), 70, 3.4], [m(27), 73, 3]], 'aqua', { part: 'thigh' + s });
      k.ellipse(m(26.5), 74.5, 6, 2.4, 'aqua', { part: 'ft' + s });
      k.px(m(22), 75, 'aqua', 1); k.px(m(25), 75, 'aqua', 1); k.px(m(28), 75, 'aqua', 1);
      k.texture('thigh' + s, 'dots', { seed: 3 + s });
    });
    // big round belly
    k.ellipse(C, 58, 15, 12.5, 'aqua', { part: 'body' });
    k.ellipse(C, 59, 9.5, 9, 'light', { clip: 'body' });
    for (var y = 53; y <= 64; y += 3) k.rect(31, y, 18, 1, 'light', { adj: -1, clip: 'body' });
    k.px(C, 60, 'light', 2);
    // mawashi + sagari
    k.poly([[25.5, 63], [54.5, 63], [53, 69], [C, 70], [27, 69]], 'violet', { part: 'maw' });
    k.texture('maw', 'cloth', { size: 2 });
    k.poly([[36, 63], [44, 63], [43, 72], [37, 72]], 'violet', { part: 'mawf', light: 0.2 });
    [34, 36.5, 43.5, 46].forEach(function (x, i) { k.tube([[x, 69, 0.8], [x + (i < 2 ? -0.4 : 0.4), 74, 0.6]], 'violet', { part: 'sag' + i, shade: 'flat', flatTone: 2 }); });
    k.line(26, 64, 54, 64, 'violet', 5);
    // left arm: fist on hip
    k.tube([[27, 51, 3.6], [20, 56, 3], [23, 62, 2.8]], 'aqua', { part: 'armL' });
    k.ellipse(24, 62, 3.2, 3, 'aqua', { part: 'fistL' });
    k.px(22, 61, 'aqua', 1); k.px(22, 63, 'aqua', 1);
    // cucumber katana raised in the right hand
    k.tube([[55, 52, 2.2], [60, 38, 2.8], [65, 24, 2.6], [68, 14, 1.8]], 'grass', { part: 'cuc' });
    [[57, 47], [59, 41], [61, 35], [63, 29], [65, 23], [67, 18]].forEach(function (p) { k.px(p[0], p[1], 'grass', 5); });
    [[59, 45], [61, 38], [63, 32], [66, 25]].forEach(function (p) { k.px(p[0] + 1, p[1], 'grass', 1); });
    k.ellipse(68.2, 13.2, 2, 1.4, 'cream', { part: 'cut', shade: 'flat', flatTone: 5 });
    k.rect(53, 51, 5, 2, 'gold', { part: 'tsuba' });
    k.tube([[48, 51, 3.4], [53, 53, 2.8], [56, 50, 2.6]], 'aqua', { part: 'armR' });
    k.ellipse(56, 51, 3.4, 3.2, 'aqua', { part: 'hR' });
    k.px(55, 52, 'aqua', 1); k.px(57, 53, 'aqua', 1);
    // hair ring
    k.ellipse(C, 29, 12, 4.2, 'grass', { part: 'hair', shift: -1 });
    k.tufts(arc(C, 28.5, 11.5, 4, 190, 350, 10), 'grass', { part: 'hair', shift: -1, len: 3.4, w: 2.8, every: 2.2, seed: 6 });
    // head
    k.ellipse(C, 38, 14, 11, 'aqua', { part: 'head' });
    k.texture('head', 'dots', { seed: 4 });
    k.sym(C, function (m, s) { k.tube([[m(28), 29, 2.6], [m(26), 35, 2], [m(26.5), 39, 0.6]], 'grass', { part: 'lock' + s, shift: -1 }); });
    k.tufts([[29, 29.5], [35, 30.5], [45, 30.5], [51, 29.5]].reverse(), 'grass', { part: 'fringe', shift: -1, len: 1.8, w: 2.6, every: 2.2, seed: 8 });
    // head plate brimming over
    k.ellipse(C, 26.5, 9, 2.8, 'bone', { part: 'plate', light: 0.2 });
    k.ellipse(C, 25, 6.8, 2.8, 'ice', { part: 'pw', light: 0.1 });
    k.line(35, 23, 38, 22, 'water', 6); k.px(44, 24, 'water', 6); k.px(36, 22, 'white', 6);
    k.sym(C, function (m, s) { k.tube([[m(32), 25.5, 1.1], [m(30), 27.5, 0.8], [m(30), 30, 1]], 'water', { part: 'spill' + s, light: 0.3 }); });
    k.px(28, 22, 'ice', 5); k.px(52, 21, 'ice', 5); k.px(30, 20, 'ice', 6);
    // big beak with a proud grin
    k.poly([[31, 42], [49, 42], [46.5, 48], [C, 50], [33.5, 48]], 'thunder', { part: 'beak' });
    k.path([[32, 44], [35, 46], [45, 46], [48, 43]], 'black', 0);
    k.px(37, 42, 'black', 1); k.px(43, 42, 'black', 1);
    pm(k, 44, 47, ['.pp', 'pp.'], { p: ['skin', 4] });
    k.px(35, 47, 'white', 6);
    // eyes: confident glare + the old wink
    k.eye(29, 34, { w: 6, h: 5, iris: 'thunder', side: 'L', angry: 0.6, lid: 0.25, look: [0.4, 0] });
    pm(k, 44, 36, ['.KKKK.', 'K....K'], INK);
    k.line(44, 33, 50, 32, 'black', 0); k.line(45, 32, 49, 31, 'black', 0);
    k.rect(28, 40, 2, 1, 'sakura', { tone: 4, part: 'ck1', outline: 'none' });
    k.rect(50, 40, 2, 1, 'sakura', { tone: 4, part: 'ck2', outline: 'none' });
    k.sparkle(72, 22, 1, 'ice'); k.px(12, 40, 'water', 5); k.sparkle(14, 30, 1, 'ice');
  };

  // 38 ツナミロウ — water (かっこいい): the wave wolf grown into a tsunami lord. A towering curling wave-crest mane,
  // foam armour, head thrown up in a fierce howl.
  P[38] = function (k) {
    k.shadow(C, 76.5, 25, 2.4);
    // towering wave-crest mane behind: one great breaker curling over from the left, a smaller one at the right
    k.tube([[57, 52, 4.6], [62, 42, 4.4], [61, 33, 3], [56, 29, 1]], 'water', { part: 'wave2', shift: -1 });
    k.tufts([[64, 48], [66, 40], [64, 31], [58, 26]], 'white', { part: 'foam2', len: 2.6, w: 2.6, every: 2.4, seed: 9, light: 0.3 });
    var WV = [[24, 54, 6.4], [18, 41, 6.6], [19.5, 28, 6], [27.5, 17, 5], [40, 11.5, 4.2], [52.5, 12.5, 3.4], [60, 18, 2.6], [61, 24.5, 1.8], [56.5, 26.5, 1]];
    k.tube(WV, 'water', { part: 'wave', shift: -1 });
    k.texture('wave', 'scales', { size: 5, seed: 3 });
    k.tube(WV.slice(0, 6).map(function (p) { return [p[0] + 2, p[1] + 2, 0.7]; }), 'aqua', { clip: 'wave', tone: 4 });
    k.tube(WV.slice(1, 5).map(function (p) { return [p[0] - 1.6, p[1] - 1, 0.6]; }), 'aqua', { clip: 'wave', tone: 3 });
    k.tufts([[12, 40], [13.5, 28], [21, 15], [34, 7], [49, 6.5], [60, 11], [66, 19]], 'white', { part: 'foamW', len: 3, w: 3.4, every: 2.8, seed: 5, light: 0.3 });
    k.circle(58.5, 24, 3, 'white', { part: 'foamW', light: 0.3 });
    k.tufts([[61, 26.5], [57, 28], [54, 26.5]], 'white', { part: 'foamW', len: 2.6, w: 2, every: 2, seed: 2 });
    // breaking-wave tail
    k.tube([[54, 64, 4], [62, 60, 4.4], [67, 52, 4], [67, 45, 3], [63, 41, 1.6]], 'water', { part: 'tail', shift: -1 });
    k.tufts([[62, 40], [66, 38], [71, 43], [73, 51], [71, 58]], 'white', { part: 'tfoam', len: 3.5, w: 3.2, every: 2.2, seed: 3, light: 0.3 });
    // hind legs
    k.sym(C, function (m, s) {
      k.ellipse(m(24), 63, 7.5, 7.5, 'water', { part: 'hip' + s, shift: -1 });
      k.tube([[m(22), 67, 3.2], [m(20), 72, 2.6]], 'water', { part: 'hip' + s, shift: -1 });
      k.ellipse(m(19.5), 74, 5, 2.3, 'water', { part: 'hp' + s, shift: -1 });
    });
    // body
    k.ellipse(C, 58, 13.5, 11, 'water', { part: 'body' });
    k.texture('body', 'fur', { seed: 5 });
    // forelegs with foam bracers
    k.sym(C, function (m, s) {
      k.tube([[m(32.5), 56, 4.8], [m(30), 62, 3.6], [m(29), 67, 3.7], [m(28), 71.5, 3.2]], 'water', { part: 'leg' + s });
      k.ellipse(m(27.5), 73.5, 5, 2.6, 'water', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 11 + s });
      k.tube([[m(34.5), 58, 0.6], [m(32), 64, 0.5]], null, { adj: -1, clip: 'leg' + s });
      k.ellipse(m(29), 66.5, 4.4, 2.2, 'white', { part: 'brc' + s, light: 0.2 });
      k.tufts(s > 0 ? [[m(33), 68], [m(25), 68]] : [[m(25), 68], [m(33), 68]], 'white', { part: 'brc' + s, len: 2, w: 2.2, every: 2.2, seed: 2 });
      [24.5, 27, 29.5].forEach(function (cx) { k.tooth(m(cx), 74.6, m(cx - 0.4), 77.2, 1.7, 'bone'); });
    });
    // foam armour: pauldrons + chest plate
    k.sym(C, function (m, s) {
      k.ellipse(m(26), 50, 7, 5.5, 'white', { part: 'pau' + s, light: 0.2 });
      k.tufts(arc(m(26), 50, 7, 5.5, s > 0 ? 100 : -80, s > 0 ? 260 : 80, 12), 'white', { part: 'pau' + s, len: 3, w: 2.8, every: 2.4, seed: 7 + s });
      k.path([[m(21), 50], [m(25), 47], [m(30), 47]], 'ice', 3);
      k.path([[m(22), 53], [m(29), 51]], 'ice', 3);
    });
    k.poly([[32, 50], [48, 50], [46, 58], [C, 62], [34, 58]], 'white', { part: 'plate', light: 0.2 });
    k.tufts([[46, 58], [C, 62.5], [34, 58]], 'white', { part: 'plate', len: 2.4, w: 2.4, every: 2.2, seed: 4 });
    k.path([[35, 53], [C, 56], [45, 53]], 'ice', 3); k.px(C, 57, 'crystal', 5); k.px(C, 58, 'crystal', 3);
    // fin ears
    k.sym(C, function (m, s) {
      k.poly([[m(34), 27], [m(30), 21.5], [m(24), 18], [m(14), 16], [m(19), 21], [m(22), 26.5], [m(28), 30]], 'aqua', { part: 'ear' + s });
      k.tufts(s > 0 ? [[m(15), 17], [m(19.5), 22], [m(22.5), 27]] : [[m(22.5), 27], [m(19.5), 22], [m(15), 17]], 'aqua', { part: 'ear' + s, len: 2.2, w: 2, every: 2.4, seed: 4 });
      k.line(m(32), 26, m(19), 19, 'aqua', 2); k.line(m(29), 28, m(21), 22.5, 'aqua', 2);
      k.path([[m(33), 25], [m(29), 21.5], [m(22), 19]], 'aqua', 5);
    });
    // head, raised
    k.ellipse(C, 34, 11.5, 10, 'water', { part: 'head' });
    k.tufts([[29.5, 32], [27, 38], [30.5, 44]], 'water', { part: 'head', len: 4, w: 3.2, every: 2.5, seed: 4 });
    k.tufts([[49.5, 44], [53, 38], [50.5, 32]], 'water', { part: 'head', len: 4, w: 3.2, every: 2.5, seed: 5 });
    k.texture('head', 'fur', { seed: 6 });
    k.poly([[37, 24.5], [C, 28], [43, 24.5], [42, 30], [C, 32], [38, 30]], 'white', { clip: 'head' });
    // muzzle + howling maw (tall, open)
    k.ellipse(C, 40.5, 7, 5, 'ice', { part: 'muz' });
    pm(k, 38, 35, ['bKKK.', 'KKKKK', '.KKK.'], { K: ['black', 1], b: ['black', 5] });
    k.mouth([[34, 40], [46, 40], [45, 46], [C, 49.5], [35, 46]], {});
    k.tooth(35.5, 40, 36.2, 44, 2.4); k.tooth(44.5, 40, 43.8, 44, 2.4);
    k.tooth(38.3, 40, 38.3, 41.8, 1.4); k.tooth(41.7, 40, 41.7, 41.8, 1.4);
    k.tooth(37, 48, 37.4, 45, 1.8); k.tooth(43, 48, 42.6, 45, 1.8);
    k.px(33, 38, 'ice', 2); k.px(47, 38, 'ice', 2);
    // eyes squeezed fierce
    k.eye(30, 29, { w: 6, h: 4, iris: 'thunder', side: 'L', angry: 2, lid: 0.45, browMat: 'water', browTone: 1 });
    k.eye(44, 29, { w: 6, h: 4, iris: 'thunder', side: 'R', angry: 2, lid: 0.45, browMat: 'water', browTone: 1 });
    // spray
    k.sparkle(10, 30, 1, 'ice'); k.px(13, 22, 'ice', 5); k.px(72, 30, 'ice', 5); k.sparkle(9, 54, 1, 'ice'); k.px(70, 8, 'ice', 5);
  };

  // 39 ユキダイオウ — water (癒し): the snow ogre grown into a gentle snow-king giant. Little red birds nesting on its
  // head between the gold horns, a tiny igloo on its back, a kind smile.
  P[39] = function (k) {
    k.shadow(C, 76.5, 27, 2.4);
    // tiny igloo on its back (peeks over the left shoulder)
    k.ellipse(15, 37, 9, 8, 'ice', { part: 'igloo', light: 0.2 });
    k.rect(6, 37, 18, 8, 'ice', { part: 'igloo', light: 0.2 });
    [31, 35, 39, 43].forEach(function (y, i) { k.rect(6, y, 18, 1, null, { adj: -1, clip: 'igloo' }); });
    [[10, 32], [15, 30], [20, 32], [8, 36], [13, 36], [18, 36], [22, 36], [11, 40], [16, 40], [21, 40]].forEach(function (p) { k.rect(p[0], p[1], 1, 3, null, { adj: -1, clip: 'igloo' }); });
    k.ellipse(10.5, 42, 2.6, 3.4, 'black', { part: 'door', shade: 'flat', flatTone: 2 });
    k.px(10, 41, 'thunder', 5);
    // feet
    k.sym(C, function (m, s) {
      k.ellipse(m(29), 72.5, 8.5, 4, 'white', { part: 'ft' + s });
      k.px(m(24), 75, 'white', 2); k.px(m(27.5), 75, 'white', 2); k.px(m(31), 75, 'white', 2);
    });
    // body
    k.ellipse(C, 55, 21, 17, 'white', { part: 'body' });
    k.tufts([[20, 46], [18.5, 55], [21, 65], [27, 70]], 'white', { part: 'body', len: 3.2, w: 3, every: 2.6, seed: 4 });
    k.tufts([[53, 70], [59, 65], [61.5, 55], [60, 46]], 'white', { part: 'body', len: 3.2, w: 3, every: 2.6, seed: 5 });
    k.texture('body', 'fur', { seed: 7 });
    k.ellipse(C, 63, 13, 5, null, { adj: -1, clip: 'body' });
    // icicle-trimmed ice-blue cape clasp across the chest
    k.poly([[25, 44], [55, 44], [52, 49], [28, 49]], 'ice', { part: 'mantle' });
    k.tufts([[52, 49], [C, 50], [28, 49]], 'ice', { part: 'mantle', len: 3, w: 2, every: 2.6, seed: 2 });
    k.circle(C, 46.5, 2.4, 'gold', { part: 'clasp' }); k.px(39, 45, 'gold', 6);
    // arms: open hands in front, holding a snowflake
    k.sym(C, function (m, s) {
      k.tube([[m(23), 46, 5.8], [m(19.5), 55, 5], [m(25), 62, 4.4], [m(31), 63, 3.8]], 'white', { part: 'arm' + s });
      k.texture('arm' + s, 'fur', { seed: 12 + s });
      k.tube([[m(19.5), 49, 0.6], [m(18.5), 56, 0.6], [m(22), 61, 0.5]], null, { adj: 1, clip: 'arm' + s });
      k.ellipse(m(33), 63, 4, 3.4, 'white', { part: 'hand' + s });
      k.px(m(32), 64, 'white', 2); k.px(m(34), 65, 'white', 2);
    });
    // a big snowflake cupped in both hands
    k.circle(C, 58.5, 4.2, 'ice', { part: 'glowF', shade: 'glow', halo: 0.3, outline: 'none' });
    k.path([[C, 54], [C, 63]], 'white', 6); k.path([[36, 56], [44, 61]], 'white', 6); k.path([[36, 61], [44, 56]], 'white', 6);
    k.px(C, 58, 'crystal', 3); k.px(39, 54, 'crystal', 4); k.px(41, 54, 'crystal', 4); k.px(39, 63, 'crystal', 4); k.px(41, 63, 'crystal', 4);
    // head
    k.ellipse(C, 32, 14, 11.5, 'white', { part: 'head' });
    k.tufts([[26, 32], [28, 25.5], [33, 21.5], [C, 20.5], [47, 21.5], [52, 25.5], [54, 32]], 'white', { part: 'head', len: 3, w: 3, every: 2.4, seed: 6 });
    k.texture('head', 'fur', { seed: 9 });
    // snow beard
    k.tufts([[49, 40], [C, 43], [31, 40]], 'white', { part: 'beard', len: 5, w: 3.4, every: 2.4, seed: 3 });
    k.ellipse(C, 41, 8.5, 3, 'white', { part: 'beard' });
    // gold horns, grown
    k.sym(C, function (m, s) { k.tube([[m(32), 23, 2.4], [m(29.5), 17, 1.8], [m(30.5), 12.5, 0.6]], 'gold', { part: 'horn' + s }); });
    // nest on top with two little red birds
    k.ellipse(C, 20, 7, 2.8, 'wood', { part: 'nest' });
    k.texture('nest', 'bark', { size: 2 });
    k.tufts([[46, 21], [C, 23], [34, 21]], 'wood', { part: 'nest', len: 1.8, w: 1.6, every: 2, seed: 4 });
    k.sym(C, function (m, s) {
      k.circle(m(37), 16.5, 2.8, 'red', { part: 'bird' + s });
      k.ellipse(m(37), 17.8, 1.6, 1.2, 'cream', { clip: 'bird' + s, tone: 5 });
      k.px(m(36.3), 15.8, 'black', 0);
      k.px(m(38.3), 16.5, 'gold', 5);
      k.spike(m(36.5), 14.5, m(35.5), 12, 1.6, 'red', { part: 'bc' + s });
    });
    // face
    k.ellipse(C, 34, 9.5, 6.8, 'ice', { part: 'face', light: 0.3, spec: false, flat: true });
    k.path([[31, 31], [32, 30], [36, 29]], 'white', 6); k.path([[49, 31], [48, 30], [44, 29]], 'white', 6);
    var E = { K: ['black', 0], P: ['water', 1], W: ['white', 6] };
    pm(k, 32, 32, ['.KKKK', 'KPPWP', '.PPP.'], E);
    pm(k, 43, 32, mirror(['.KKKK', 'KPPWP', '.PPP.']), E);
    k.rect(31, 36, 3, 1, 'sakura', { tone: 4, part: 'rc1', outline: 'none' });
    k.rect(46, 36, 3, 1, 'sakura', { tone: 4, part: 'rc2', outline: 'none' });
    pm(k, 39, 35, ['nn', 'NN'], { n: ['ice', 6], N: ['ice', 2] });
    pm(k, 36, 37, ['K......K', '.KKKKKK.'], INK);
    k.px(37, 39, 'white', 6); k.px(43, 39, 'white', 6);
    // snowflakes
    k.sparkle(66, 26, 1, 'ice'); k.sparkle(70, 50, 1, 'ice'); k.px(62, 16, 'ice', 5); k.px(8, 58, 'ice', 5);
  };

  // 40 リュウジン — water (かっこいい/神秘): the river dragon grown into the water-dragon god. Long piled coils,
  // branching gold antlers, flowing white mane and long whiskers, pearls orbiting. Keeps the proud buck-fanged grin.
  P[40] = function (k) {
    k.shadow(C, 76.5, 30, 2.2);
    // back coil + tail fin rising at the right
    k.tube([[20, 66, 5], [31, 60, 5.5], [48, 59, 5.5], [62, 62, 5], [70, 54, 4], [69, 44, 3], [64, 38, 1.4]], 'water', { part: 'coilB', shift: -1 });
    k.tube([[20, 68, 1], [31, 63, 1.2], [48, 62, 1.2], [62, 65, 1]], 'cream', { clip: 'coilB', tone: 3 });
    k.spike(66, 40, 60, 30, 6, 'aqua', { part: 'tfB' }); k.spike(68, 42, 75, 33, 5, 'aqua', { part: 'tfB' });
    // rising body with belly plates
    k.tube([[C, 66, 7], [38.5, 54, 7], [C, 42, 6.5]], 'water', { part: 'body' });
    k.texture('body', 'scales', { size: 4 });
    k.tube([[C, 67, 4], [38.5, 54, 4], [C, 43, 3.6]], 'cream', { clip: 'body' });
    for (var y = 45; y <= 66; y += 3) k.rect(35, y, 10, 1, 'cream', { adj: -2, clip: 'body' });
    // spine fins down the back of the neck
    k.sym(C, function (m, s) {
      k.spike(m(33), 51, m(24), 45, 5, 'aqua', { part: 'fa' + s });
      k.spike(m(33), 59, m(25), 55, 5, 'aqua', { part: 'fb' + s });
    });
    // front coil with a hump + tail fin at the left
    var coil = [[10, 50, 1.2], [8, 58, 2.6], [13, 66, 4.5], [24, 71, 6.5], [C, 73, 7.2], [56, 70.5, 6.5], [63, 65, 5.4], [60, 60, 4]];
    k.spike(20, 67, 15, 57, 6, 'aqua', { part: 'cfinA' });
    k.spike(55, 66, 60, 57, 6, 'aqua', { part: 'cfinB' });
    k.tube(coil, 'water', { part: 'coil' });
    k.tube(coil.map(function (p) { return [p[0], p[1] + p[2] * 0.66, Math.max(0.5, p[2] * 0.28)]; }), 'cream', { clip: 'coil' });
    for (var si = 2; si < coil.length - 1; si++) {
      var a0 = coil[si], a1 = coil[si + 1], L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
      for (var tt = 0; tt < L; tt += 3.5) {
        var u = tt / L, cx = a0[0] + (a1[0] - a0[0]) * u, cy = a0[1] + (a1[1] - a0[1]) * u, r = a0[2] + (a1[2] - a0[2]) * u;
        [-0.5, 0.05, 0.5].forEach(function (off, row) {
          var X = Math.round(cx + (row % 2) * 1.7), Y = Math.round(cy + off * r);
          k.px(X - 1, Y, 'water', 2); k.px(X, Y + 1, 'water', 2); k.px(X + 1, Y, 'water', 2); k.px(X, Y, 'water', 4);
        });
        k.px(Math.round(cx), Math.round(cy - r + 1.2), 'water', (Math.round(tt) % 7) ? 5 : 6);
      }
    }
    var SP = { w: ['ice', 6], a: ['ice', 4], b: ['water', 4] };
    pm(k, 8, 72, ['.w..', 'a.w.', '.ab.'], SP); pm(k, 65, 71, ['..w.', '.w.a', '.ba.'], SP);
    k.spike(10, 51, 3, 40, 6, 'aqua', { part: 'tf1' });
    k.spike(11, 53, 17, 43, 5, 'aqua', { part: 'tf2' });
    // arms: left holds the great pearl, right open with claws
    k.tube([[34, 49, 3.4], [27, 45, 3], [24, 40, 2.6]], 'water', { part: 'armL' });
    k.circle(21, 35.5, 5.2, 'crystal', { part: 'pearl', halo: 0.3 });
    k.sparkle(19, 33, 1, 'white');
    k.tooth(24, 41, 19, 41.5, 1.8, 'bone'); k.tooth(24.5, 38, 24, 32, 1.8, 'bone');
    k.tube([[46, 50, 3.4], [53, 55, 3], [55, 60, 2.6]], 'water', { part: 'armR' });
    k.tooth(52.5, 61, 52, 63.5, 1.6, 'bone'); k.tooth(55.5, 61.5, 55.5, 64, 1.6, 'bone'); k.tooth(57.5, 60, 59, 62, 1.6, 'bone');
    // orbiting pearls
    k.circle(63, 26, 3, 'crystal', { part: 'op1', halo: 0.3 }); k.px(62, 25, 'white', 6);
    k.circle(10, 14, 2.4, 'crystal', { part: 'op2', halo: 0.3 }); k.px(9, 13, 'white', 6);
    k.circle(71, 40, 2, 'crystal', { part: 'op3' }); k.px(70, 39, 'white', 6);
    k.circle(6, 58, 1.8, 'crystal', { part: 'op4' });
    k.path([[14, 12], [22, 9]], 'ice', 4); k.path([[65, 30], [69, 35]], 'ice', 4);
    // flowing mane (white) + branching gold antlers
    k.sym(C, function (m, s) {
      k.tube([[m(32), 22, 4.4], [m(21), 20, 3.6], [m(12), 24, 2.4], [m(5), 21, 0.7]], 'white', { part: 'mane' + s });
      k.tube([[m(33), 29, 4], [m(24), 33, 2.8], [m(16), 40, 0.8]], 'white', { part: 'maneb' + s });
      k.tufts(s > 0 ? [[m(30), 26], [m(19), 25], [m(10), 27]] : [[m(10), 27], [m(19), 25], [m(30), 26]], 'white', { part: 'mane' + s, len: 3.4, w: 2.4, every: 3, seed: 8 });
      k.tube([[m(30), 21.5, 1], [m(21), 21, 0.8], [m(14), 23.5, 0.4]], 'aqua', { clip: 'mane' + s, tone: 4 });
      k.tube([[m(35.5), 15, 2], [m(31), 8, 1.4], [m(29), 2.5, 0.7]], 'gold', { part: 'horn' + s });
      k.tube([[m(32.5), 11, 1], [m(25), 9, 0.7], [m(22), 5, 0.5]], 'gold', { part: 'horn' + s });
      k.tube([[m(34), 13.5, 0.9], [m(38), 8, 0.5]], 'gold', { part: 'horn' + s });
      k.spike(m(31), 27, m(22), 30, 5, 'aqua', { part: 'cf' + s });
    });
    // head, snout, jaw
    k.ellipse(C, 22, 12, 10, 'water', { part: 'head' });
    k.texture('head', 'scales', { size: 3, seed: 6 });
    k.ellipse(C, 31, 9.5, 5.6, 'water', { part: 'muzzle' });
    k.ellipse(C, 28, 5.2, 2.8, 'water', { part: 'nose', light: 0.25 });
    k.px(37, 28, 'black', 0); k.px(43, 28, 'black', 0);
    k.ellipse(C, 37.5, 8, 3, 'cream', { part: 'jaw' });
    k.tufts([[47, 39], [33, 39]], 'white', { part: 'beard', len: 5, w: 2.8, every: 2.6, seed: 4 });
    k.mouth([[31.5, 32.5], [48.5, 32.5], [46.5, 37], [C, 38.5], [33.5, 37]], {});
    k.tooth(36.5, 32.5, 36.7, 36, 2.6); k.tooth(43.5, 32.5, 43.3, 36, 2.6);
    // long flowing whiskers, routed away from the eyes
    k.sym(C, function (m, s) { k.tube([[m(32), 33, 0.7], [m(27), 37, 0.6], [m(22), 40, 0.55], [m(17), 39, 0.5], [m(14.5), 35.5, 0.45], [m(16), 33, 0.4]], 'gold', { part: 'wh' + s, shade: 'flat', flatTone: 5 }); });
    // eyes: intense slit, under heavy brows
    k.eye(29.5, 18, { w: 7, h: 5, iris: 'thunder', side: 'L', angry: 1, lid: 0.3, brow: false });
    k.eye(43.5, 18, { w: 7, h: 5, iris: 'thunder', side: 'R', angry: 1, lid: 0.3, brow: false });
    k.sym(C, function (m, s) { k.tube([[m(28), 16, 1.3], [m(37), 18, 1.3]], 'water', { part: 'brow' + s, light: 0.3 }); });
    k.sparkle(72, 12, 1, 'ice'); k.px(4, 32, 'ice', 5);
  };
})();
