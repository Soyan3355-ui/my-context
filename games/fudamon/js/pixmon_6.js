/* 封札モンスターズ — evolved forms, set 6 (ids 41–50: grass/thunder evolutions of 11–20).
 * 80x80 front-facing battle sprites at SFC density. Requires pixkit.js (v3).
 * House style: PIXMON_STYLE.md + pixmon_1.js. Each form keeps its base's colours, markings and gag. All designs are original. */
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
  // points on an ellipse arc, angles in degrees (clockwise on screen, so tufts point outward)
  function arc(cx, cy, rx, ry, a0, a1, step) {
    var p = [];
    for (var a = a0; step > 0 ? a <= a1 : a >= a1; a += step) { var r = a * Math.PI / 180; p.push([cx + Math.cos(r) * rx, cy + Math.sin(r) * ry]); }
    return p;
  }
  // zig-zag lightning bolt; (x,y) = top of the bolt, s = scale, fy = 1 down / -1 up, fx = 1 / -1 mirror
  function bolt(k, x, y, s, fy, fx, mat, o) {
    var B = [[-2, -2], [2.5, -2], [1, 3], [3.5, 3], [-1.5, 11], [0, 5.5], [-2.5, 5.5]];
    k.poly(B.map(function (p) { return [x + p[0] * s * fx, y + (p[1] + 2) * s * fy]; }), mat, o);
  }
  var INK = { K: ['black', 0], k: ['black', 2], W: ['white', 6] };
  var ZZ = { z: ['white', 6], y: ['white', 4] };

  // 41 ワカバオウジ (← 11 メブキン) — grass, かわいい: the sprout imp grown into a forest prince.
  // Leaf crown around its big curling sprout-leaf, acorn-topped staff (the acorn it used to lob), leaf cape. Gag kept: cheeky grin, tongue out the side.
  P[41] = function (k) {
    k.shadow(C, 76.5, 19, 2.2);
    // cape of leaves flaring behind
    var hem = [[62, 73], [58, 70], [54, 75], [49, 71], [44.5, 75.5], [40, 72], [35.5, 75.5], [31, 71], [26, 75], [22, 70], [18, 73]];
    k.poly([[29, 50], [51, 50], [58, 61]].concat(hem).concat([[22, 61]]), 'grass', { part: 'cape', light: -0.1 });
    k.tufts([[51, 50], [57, 60], [62, 72]], 'grass', { part: 'cape', len: 3.5, w: 3, every: 3, seed: 3 });
    k.tufts([[18, 72], [23, 60], [29, 50]], 'grass', { part: 'cape', len: 3.5, w: 3, every: 3, seed: 4 });
    k.texture('cape', 'fur', { seed: 2 });
    [[[44, 55], [52, 72]], [[36, 55], [28, 72]], [[48, 53], [58, 69]], [[32, 53], [22, 69]]].forEach(function (v) { k.line(v[0][0], v[0][1], v[1][0], v[1][1], 'grass', 1); });
    // acorn staff (behind the hand)
    k.tube([[21, 27, 1.2], [21.5, 50, 1.2], [22, 75, 1]], 'wood', { part: 'staff' });
    k.line(20, 30, 21, 74, 'wood', 5);
    k.leaf(22, 30, 28.5, 27, 3.6, 'leaf', { part: 'sleaf' });
    k.tube([[21, 20.5, 4.3], [21, 24, 3], [21, 27, 0.7]], 'fur', { part: 'acorn' });
    k.ellipse(21, 18.5, 5, 2.7, 'tan', { part: 'acap' });
    k.texture('acap', 'dots', { seed: 3 });
    k.path([[17, 19], [25, 19]], 'tan', 1); k.px(21, 15, 'wood', 1); k.px(21, 14, 'wood', 2);
    k.px(19, 22, 'fur', 6); k.px(18, 21, 'fur', 5); k.px(19, 23, 'fur', 5);
    k.sparkle(14, 14, 1, 'leaf'); k.sparkle(28, 12, 1, 'light');
    // root feet
    k.sym(C, function (m, s) {
      k.tube([[m(35), 66, 3.8], [m(34), 72, 3.2], [m(30), 75, 1.8], [m(25), 75.5, 0.8]], 'wood', { part: 'rt' + s });
      k.tube([[m(35), 72, 1.6], [m(39), 75.5, 0.7]], 'wood', { part: 'rt' + s });
      k.px(m(32), 74, 'wood', 1); k.px(m(28), 74, 'wood', 5);
    });
    // body + belt with acorn buckle
    k.ellipse(C, 61, 10.5, 9.5, 'wood', { part: 'body' });
    k.texture('body', 'bark', { size: 3, seed: 2 });
    k.ellipse(C, 62.5, 6, 6, 'tan', { clip: 'body' });
    k.path([[37, 60], [38, 63], [37, 66]], 'tan', 2); k.path([[43, 61], [42, 64]], 'tan', 2);
    k.tube([[30, 66, 1.1], [C, 67.5, 1.2], [50, 66, 1.1]], 'gold', { part: 'belt' });
    pm(k, 39, 66, ['tt', 'ff'], { t: ['tan', 4], f: ['fur', 3] });
    // right arm on hip
    k.tube([[49, 57, 2.6], [55, 61, 2.2], [52, 66, 1.9]], 'wood', { part: 'armR' });
    k.tube([[54.5, 60, 0.5], [52.5, 65, 0.5]], null, { adj: -1, clip: 'armR' });
    // leaf mantle collar with gold clasp
    k.tufts([[51, 53], [45, 55], [35, 55], [29, 53]], 'grass', { part: 'collar', len: 4.5, w: 3.4, every: 2.5, seed: 6 });
    k.ellipse(C, 54, 11, 2.4, 'grass', { part: 'collar' });
    k.texture('collar', 'fur', { seed: 8 });
    k.circle(C, 55, 1.7, 'gold', { part: 'clasp' });
    // leaf ears
    k.sym(C, function (m, s) {
      k.leaf(m(29), 44, m(16), 39, 6.5, 'leaf', { part: 'le' + s });
      k.line(m(28), 44, m(19), 40, 'leaf', 2);
    });
    // head
    k.ellipse(C, 45, 13.5, 11, 'wood', { part: 'head' });
    k.texture('head', 'bark', { size: 3, seed: 5 });
    k.ellipse(C, 48.5, 9.5, 7, 'tan', { clip: 'head' });
    // leaf crown: gold circlet, red gem, leaf points
    k.sym(C, function (m, s) {
      k.leaf(m(30), 39, m(25), 30, 4.6, 'leaf', { part: 'cl1' + s });
      k.leaf(m(34.5), 37, m(33), 28.5, 4.2, 'grass', { part: 'cl2' + s });
    });
    k.tube([[28, 39.5, 1.2], [34, 36.3, 1.3], [C, 35.5, 1.3], [46, 36.3, 1.3], [52, 39.5, 1.2]], 'gold', { part: 'band' });
    k.circle(C, 35.5, 1.6, 'red', { part: 'gem' }); k.px(39, 35, 'white', 6);
    // big curling crown-leaf (the old sprout, grown)
    k.tube([[C, 34, 1.4], [41, 29, 1.1], [C, 25.5, 0.8]], 'leaf', { part: 'stem' });
    k.leaf(41, 27, 59, 16, 10, 'grass', { part: 'bigleaf' });
    k.path([[42, 26], [47, 23], [53, 19.5], [58, 17]], 'grass', 2);
    k.px(46, 22, 'grass', 6); k.px(50, 20, 'grass', 5);
    k.leaf(C, 27, 32, 21, 5.5, 'leaf', { part: 'smleaf' });
    k.px(36, 24, 'leaf', 2); k.px(34, 23, 'leaf', 2);
    // face: raised brow + side-eye glare
    k.eye(31, 42, { w: 5, h: 4, iris: 'thunder', side: 'L', angry: 0.4, look: [1, 0], browMat: 'wood', browTone: 0 });
    k.eye(44, 42, { w: 5, h: 4, iris: 'thunder', side: 'R', angry: 1.4, look: [1, 0], browMat: 'wood', browTone: 0 });
    k.px(39, 47, 'wood', 1); k.px(41, 47, 'wood', 1);
    k.mouth([[33, 49], [48, 48], [46.5, 52.5], [41, 53.5], [35.5, 52]], { tongue: false });
    k.tooth(35.5, 49, 35.9, 51.5, 2);
    k.tooth(45, 49, 45, 51, 1.8);
    k.tube([[46.5, 52, 1.3], [47.5, 54.5, 1.4], [47.5, 55.5, 1]], 'skin', { part: 'tongue' });
    k.px(47, 54, 'skin', 2);
    k.sym(C, function (m) { k.px(m(30), 49, 'sakura', 4); k.px(m(31), 49, 'sakura', 4); });
    // left arm gripping the staff
    k.tube([[31, 58, 2.6], [26, 55, 2.2], [23.5, 53, 2]], 'wood', { part: 'armL' });
    k.tube([[30, 56.5, 0.5], [26, 54, 0.5]], null, { adj: 1, clip: 'armL' });
    k.ellipse(22, 52.5, 3, 2.8, 'wood', { part: 'handL' });
    k.px(21, 51, 'wood', 5); k.line(20, 53, 23, 53, 'wood', 1);
  };

  // 42 オオキノコ (← 12 キノコボウ) — grass, 癒し: giant cozy mushroom grandpa, warm lamp hanging from his cap, two little キノコボウ kids.
  // Gag kept: still dozing with a snot bubble, now under a bushy white moustache; the sprout on the cap has become a sapling.
  P[42] = function (k) {
    k.shadow(C, 76.5, 26, 2.2);
    [[8, 40], [73, 30], [9, 24], [6, 56], [72, 16]].forEach(function (p, i) { k.sparkle(p[0], p[1], 1, i % 2 ? 'leaf' : 'light'); });
    // stubby feet
    k.sym(C, function (m, s) { k.ellipse(m(32), 73.5, 6.5, 3, 'cream', { part: 'foot' + s }); k.px(m(29), 74, 'cream', 2); k.px(m(33), 75, 'cream', 2); });
    // big round body = face
    k.ellipse(C, 58.5, 15, 14, 'cream', { part: 'body', light: 0.12 });
        k.tube([[27, 63, 0.6], [29, 68, 0.6], [34, 71, 0.6]], null, { adj: -1, clip: 'body' });
    // moss scarf
    k.poly([[25, 63], [55, 63], [53, 67], [C, 68.5], [27, 67]], 'grass', { part: 'scarf' });
    k.tufts([[54, 66.5], [47, 68.5], [33, 68.5], [26, 66.5]], 'grass', { part: 'scarf', len: 2.6, w: 2.6, every: 2, seed: 3 });
    k.texture('scarf', 'fur', { seed: 5 });
    k.px(30, 64, 'sakura', 5); k.px(49, 65, 'white', 6); k.px(38, 65, 'thunder', 5);
    // hands folded on the belly
    k.sym(C, function (m, s) { k.ellipse(m(33), 67.5, 4, 3, 'cream', { part: 'hand' + s }); k.px(m(31), 68, 'cream', 2); });
    // gills
    k.ellipse(C, 41.5, 14, 2.4, 'tan', { part: 'gill', shift: -1 });
    for (var gx = 28; gx <= 52; gx += 2) k.px(gx, 42, 'tan', 1);
    // wide dome cap, wavy rim, glowing spots
    k.ellipse(C, 31, 20, 10.5, 'fur', { part: 'cap' });
    k.ellipse(C, 38.5, 22.5, 3, 'fur', { part: 'cap' });
    k.tufts([[62, 39], [54, 41.5], [26, 41.5], [18, 39]], 'fur', { part: 'cap', len: 1.8, w: 3.2, every: 3.4, seed: 9 });
    k.texture('cap', 'fur', { seed: 6 });
    [[30, 28, 3.3], [44, 25, 2.8], [53, 32, 2.4], [24, 35, 2], [38, 34.5, 2.1], [52, 23, 1.4], [20, 29, 1.4], [59, 36, 1.3]].forEach(function (s) {
      k.circle(s[0], s[1], s[2], 'leaf', { clip: 'cap', tone: 5 });
      k.circle(s[0] + 0.4, s[1] + 0.4, Math.max(0.8, s[2] - 1.2), 'leaf', { clip: 'cap', tone: 6 });
    });
    k.ellipse(C, 40.5, 22, 1.2, null, { adj: -1, clip: 'cap' });
    k.tube([[23, 28, 0.6], [28, 23.5, 0.6], [35, 21.5, 0.6]], null, { adj: 1, clip: 'cap' });
    // sapling on top (the old sprout, grown)
    k.tube([[45, 21.5, 1], [46, 16, 0.8], [45, 13, 0.6]], 'wood', { part: 'tstem' });
    k.leaf(46, 16.5, 54, 13, 4.2, 'grass', { part: 'tl1' });
    k.leaf(45, 14, 38.5, 10.5, 3.8, 'leaf', { part: 'tl2' });
    k.leaf(45, 13.5, 47, 7.5, 3, 'grass', { part: 'tl3' });
    // lamp on a wooden bracket from the cap rim
    k.tube([[55, 38, 1.1], [61, 39.5, 0.9], [62.5, 42.5, 0.6]], 'wood', { part: 'brk' });
    k.line(62, 43, 62, 45, 'black', 3);
    k.rect(59, 45, 7, 2, 'wood', { part: 'lcap' });
    k.ellipse(62.5, 51, 3.9, 4.2, 'flame', { part: 'lamp', shade: 'glow', halo: 0.35 });
    k.line(62, 47, 62, 54, 'wood', 2);
    k.rect(59.5, 55, 6, 1.5, 'wood', { part: 'lbase' });
    k.px(62, 57, 'red', 4); k.px(62, 58, 'red', 3);
    // soft shade under the brim
    k.ellipse(C, 45.5, 13, 1.3, null, { adj: -1, clip: 'body' });
    // face: bushy white brows over content closed eyes
    var E = { K: ['black', 0] };
    pm(k, 29, 48, ['K.....K', 'KK...KK', '.KKKKK.'], E);
    pm(k, 44, 48, ['K.....K', 'KK...KK', '.KKKKK.'], E);
    k.sym(C, function (m, s) {
      k.tube([[m(27.5), 47, 0.8], [m(30), 45.5, 1.1], [m(33.5), 45, 1.1], [m(35.5), 45.5, 0.7]], 'bone', { part: 'brow' + s, light: 0.2 });
      k.rect(s > 0 ? 25 : 52, 51, 3, 2, 'sakura', { tone: 4, part: 'blush' + s, outline: 'none' });
    });
    // nose + big moustache hiding the mouth
    k.ellipse(C, 51, 2.4, 2, 'cream', { part: 'nose', light: 0.2 });
    k.sym(C, function (m, s) { k.tube([[m(39), 54, 2.3], [m(34.5), 55.5, 2.4], [m(30.5), 55, 1.6], [m(28.5), 52.5, 0.7]], 'bone', { part: 'must', light: 0.15 }); });
    k.tufts([[44, 57], [41, 57.5], [39, 57.5], [36, 57]], 'bone', { part: 'must', len: 1.6, w: 2, every: 2, seed: 4 });
    k.texture('must', 'fur', { seed: 7 });
    k.px(C, 54, 'bone', 1); k.px(C, 55, 'bone', 2);
    k.path([[37, 59], [38, 60], [42, 60], [43, 59]], 'black', 1); k.px(39, 61, 'mouth', 4); k.px(40, 61, 'mouth', 4);
    // snot bubble
    k.circle(44.5, 52.5, 2.2, 'ice', { part: 'bubble', shade: 'flat', flatTone: 5, outline: 'soft' });
    k.px(44, 52, 'white', 6); k.px(45, 53, 'ice', 3);
    // two little mushroom kids at his feet
    k.sym(C, function (m, s) {
      var x = m(14);
      k.ellipse(x, 72.5, 3.8, 3.4, 'cream', { part: 'kb' + s, light: 0.1 });
      k.ellipse(x, 68, 5.2, 3.2, 'fur', { part: 'kc' + s });
      k.ellipse(x, 70.5, 5.6, 1, 'fur', { part: 'kc' + s });
      k.px(x - 2, 67, 'leaf', 5); k.px(x + 1, 66, 'leaf', 6); k.px(x + 3, 68, 'leaf', 5);
      k.px(x - 2, 72, 'black', 0); k.px(x + 1, 72, 'black', 0);
      k.px(x - 0.5, 74, 'mouth', 3);
      k.px(x - 3, 73, 'sakura', 4); k.px(x + 2, 73, 'sakura', 4);
    });
  };

  // 43 コケヤマ (← 13 コケモチ) — grass, 癒し: tortoise carrying a little mountain forest, a tiny shrine on the summit and a waterfall.
  // Gag kept: still fast asleep, nose bubble and Zz.
  P[43] = function (k) {
    k.shadow(C, 76.5, 28, 2.4);
    // stubby feet
    k.sym(C, function (m, s) {
      k.ellipse(m(19), 71.5, 6.2, 4.6, 'leaf', { part: 'ft' + s, shift: -1 });
      k.texture('ft' + s, 'scales', { size: 3, seed: 3 });
      k.px(m(15), 75, 'bone', 5); k.px(m(18), 75.5, 'bone', 5); k.px(m(21), 75.5, 'bone', 4);
    });
    // boulder shell + rim
    k.ellipse(C, 58, 27, 11.5, 'stone', { part: 'shell' });
    k.texture('shell', 'dots', { seed: 4 });
    k.sym(C, function (m) {
      k.tube([[m(24), 55, 0.6], [m(22), 61, 0.6], [m(25), 66, 0.6]], null, { adj: -2, clip: 'shell' });
      k.tube([[m(23), 55, 0.5], [m(21), 61, 0.5]], null, { adj: 1, clip: 'shell' });
    });
    k.ellipse(C, 67.5, 26, 3.8, 'stone', { part: 'rim', shift: -1 });
    k.texture('rim', 'stone', { size: 3, seed: 5 });
    // the mountain
    k.poly([[14, 58], [20, 49], [27, 41], [32, 32], [35.5, 24], [38, 22.5], [43, 22.5], [45.5, 25], [49, 31], [54, 38], [60, 46], [66, 58]], 'stone', { part: 'mtn' });
    k.texture('mtn', 'stone', { size: 4, seed: 2 });
    k.path([[40, 23], [42, 28], [41, 33]], 'stone', 5); k.path([[44, 26], [47, 33], [46, 38]], 'stone', 2);
    // forest moss blanket with drips over the shell
    var drip = [[65, 58], [61, 60.5], [57, 57.5], [53, 60.5], [48, 58], [44, 61], [40, 58.5], [36, 61], [32, 58], [27, 60.5], [23, 57.5], [19, 60], [15, 58]];
    k.poly([[14, 57], [18, 50], [24, 44], [29, 38], [33, 33], [37, 34], [42, 30], [46, 27], [50, 31], [55, 38], [60, 47], [66, 57]].concat(drip), 'grass', { part: 'moss' });
    k.tufts(drip.slice().reverse(), 'grass', { part: 'moss', len: 2.8, w: 2.4, every: 2.3, seed: 12 });
    k.tufts([[18, 50], [24, 44], [29, 38], [33, 33], [37, 34], [42, 30], [46, 27], [50, 31], [55, 38], [60, 47]], 'grass', { part: 'moss', len: 2.2, w: 2, every: 2.2, seed: 4 });
    k.texture('moss', 'fur', { seed: 5 });
    // pines
    [[21, 51, 8], [27, 45, 10], [31, 38, 7], [53, 40, 9], [59, 48, 8], [49, 33, 7], [44, 40, 6]].forEach(function (t, i) {
      var x = t[0], y = t[1], h = t[2];
      k.spike(x, y, x, y - h, h * 0.75, 'grass', { part: 'pine' + i, shift: -1 });
      k.spike(x, y - h * 0.45, x, y - h * 1.2, h * 0.55, 'grass', { part: 'pine' + i, shift: -1 });
      k.px(x, y + 1, 'wood', 2);
    });
    // waterfall from a spring near the summit
    k.poly([[34.5, 29], [37.5, 29], [36.5, 42], [36, 58], [31, 58], [33, 42]], 'water', { part: 'fall', shade: 'flat', flatTone: 4 });
    k.line(35, 31, 34, 56, 'water', 6); k.line(33, 44, 32, 56, 'water', 5); k.line(36, 33, 35.5, 50, 'water', 3);
    k.ellipse(33.5, 58.5, 5, 1.7, 'white', { part: 'foam', shade: 'flat', flatTone: 6, outline: 'soft' });
    k.px(28, 57, 'white', 6); k.px(39, 56, 'white', 6);
    // summit shrine + torii
    k.rect(37.5, 20, 6, 3, 'red', { part: 'hall' });
    k.poly([[34, 20.5], [47, 20.5], [44, 17], [37, 17]], 'wood', { part: 'roof' });
    k.line(37, 17, 44, 17, 'gold', 5); k.px(34, 20, 'gold', 5); k.px(46, 20, 'gold', 5);
    k.px(40, 21, 'black', 1); k.px(41, 21, 'black', 1); k.px(40, 22, 'black', 1); k.px(41, 22, 'black', 1);
    k.line(47, 30, 47, 34, 'red', 3); k.line(51, 31, 51, 35, 'red', 3);
    k.line(45, 29, 53, 30, 'black', 1); k.line(46, 30, 52, 31, 'red', 4);
    // flowers on the moss
    var FL = { p: ['sakura', 5], q: ['sakura', 3], y: ['gold', 5], w: ['white', 6], v: ['white', 4] };
    pm(k, 23, 53, ['.p.', 'pyp', '.q.'], FL);
    pm(k, 44, 50, ['.w.', 'wyw', '.v.'], FL);
    pm(k, 56, 53, ['.p.', 'pyp', '.q.'], FL);
    // head poking out
    k.ellipse(C, 66.5, 10, 7, 'tan', { part: 'head', spec: false });
    k.path([[33, 62], [35, 61], [37, 61]], 'tan', 5); k.px(48, 68, 'tan', 1); k.px(47, 69, 'tan', 1);
    k.ellipse(C, 70.5, 5.5, 2.4, 'cream', { clip: 'head' });
    // sleepy content face
    pm(k, 33, 64, ['K...K', '.KKK.'], INK); pm(k, 42, 64, ['K...K', '.KKK.'], INK);
    k.path([[37, 69], [38, 70], [39, 70], [C, 69], [41, 70], [42, 70], [43, 69]], 'black', 0);
    k.rect(32, 67, 2, 1, 'sakura', { tone: 4, part: 'ck1', outline: 'none' });
    k.rect(46, 67, 2, 1, 'sakura', { tone: 4, part: 'ck2', outline: 'none' });
    k.px(39, 67, 'tan', 1); k.px(41, 67, 'tan', 1);
    k.circle(46.5, 71, 3, 'ice', { part: 'nb', halo: 0.2, outline: 'soft' });
    k.px(45, 70, 'white', 6);
    // Zz
    pm(k, 60, 30, ['zzz', '..z', '.z.', 'z..', 'yyy'], ZZ);
    pm(k, 65, 22, ['zzzz', '...z', '..z.', '.z..', 'yyyy'], ZZ);
  };

  // 44 オウカマキリ (← 14 ハナカマキリ) — grass, かっこいい: sakura mantis samurai. Scythes grown into twin katana with gold tsuba,
  // petal sode pauldrons and kusazuri, gold crescent maedate, petals falling from the blades.
  P[44] = function (k) {
    k.shadow(C, 76.5, 22, 2.4);
    // falling petals
    [[7, 60, 1], [72, 44, -1], [67, 68, 1], [12, 70, -1], [74, 58, 1], [5, 48, -1]].forEach(function (p, i) { k.leaf(p[0], p[1], p[0] + 3 * p[2], p[1] + 2.5, 3, 'sakura', { part: 'fp' + i }); });
    // petal wings flared behind
    k.sym(C, function (m, s) {
      k.leaf(m(37), 50, m(12), 43, 12, 'sakura', { part: 'wa' + s, shift: -1 });
      k.leaf(m(37), 56, m(17), 63, 10, 'sakura', { part: 'wb' + s, shift: -1 });
      k.line(m(35), 49, m(15), 44, 'sakura', 1); k.line(m(35), 56, m(20), 62, 'sakura', 1);
    });
    // walking legs with petal lobes
    k.sym(C, function (m, s) {
      k.tube([[m(36), 60, 1.6], [m(27), 64, 1.4], [m(25), 75, 1]], 'grass', { part: 'lgA' + s, shift: -1 });
      k.leaf(m(35), 61, m(27), 64.5, 5.5, 'sakura', { part: 'lpA' + s });
      k.tube([[m(38), 63, 1.6], [m(32), 68, 1.3], [m(33), 75.5, 1]], 'grass', { part: 'lgB' + s });
      k.leaf(m(37), 64.5, m(31.5), 69, 5, 'white', { part: 'lpB' + s });
      k.px(m(25), 75, 'grass', 1); k.px(m(33), 75, 'grass', 1);
    });
    // abdomen: stacked petal plates
    k.ellipse(C, 65, 7.5, 9.5, 'white', { part: 'abd' });
    for (var y = 59; y <= 71; y += 3) k.tube([[33, y, 0.5], [C, y + 1.5, 0.5], [47, y, 0.5]], null, { adj: -2, clip: 'abd' });
    k.ellipse(C, 67, 3, 7, 'sakura', { clip: 'abd', light: 0.1 });
    // kusazuri: petal tassets hanging from the waist
    k.sym(C, function (m, s) {
      k.leaf(m(36), 57, m(29), 69, 6.5, 'sakura', { part: 'ks' + s });
      k.line(m(35), 59, m(30.5), 67, 'gold', 4);
    });
    // thorax + petal breastplate with gold rim
    k.tube([[C, 58, 4.5], [C, 42, 3.5]], 'grass', { part: 'thorax' });
    k.texture('thorax', 'scales', { size: 3 });
    k.poly([[32, 46], [48, 46], [45, 55], [C, 57.5], [35, 55]], 'white', { part: 'plate' });
    k.poly([[C, 46], [48, 46], [45, 55], [C, 57.5]], null, { adj: -1, clip: 'plate' });
    k.line(32, 46, 48, 46, 'gold', 5); k.line(C, 47, C, 56, 'sakura', 3); k.px(35, 48, 'white', 6);
    k.circle(C, 50, 1.5, 'sakura', { part: 'mon', tone: 4 }); k.px(C, 50, 'gold', 5);
    // raised arms ending in katana-scythes
    k.sym(C, function (m, s) {
      k.tube([[m(37), 45, 2.8], [m(30), 40, 2.6], [m(26), 35, 2.4]], 'grass', { part: 'coxa' + s });
      k.tube([[m(26), 36, 3.4], [m(22), 25, 3.1], [m(20), 15, 2.4]], 'grass', { part: 'fem' + s });
      k.texture('fem' + s, 'scales', { size: 3, seed: 3 });
      k.leaf(m(27), 37, m(16), 25, 6, 'sakura', { part: 'fpet' + s });
      k.line(m(26), 35, m(18), 27, 'sakura', 2);
      [[24, 31], [22.8, 26], [21.8, 21]].forEach(function (t) { k.tooth(m(t[0]), t[1], m(t[0] + 3.5), t[1] + 1, 2, 'bone'); });
      // curved katana blade sweeping out and down
      k.poly([[m(19), 12], [m(13), 13], [m(8), 17.5], [m(4.5), 25], [m(2.5), 34], [m(2.5), 42], [m(5), 34], [m(8), 25.5], [m(12), 19], [m(18.5), 15.5]], 'steel', { part: 'blade' + s, light: 0.15 });
      k.path([[m(13), 13], [m(8), 18], [m(5), 24], [m(3), 32], [m(3), 40]], 'white', 6);
      k.path([[m(16), 15], [m(11), 18], [m(7), 25], [m(5), 32]], 'steel', 2);
      k.ellipse(m(20), 13.5, 3.2, 2, 'gold', { part: 'tsuba' + s });
      k.px(m(19), 13, 'gold', 6);
    });
    // sode pauldrons over the shoulders
    k.sym(C, function (m, s) {
      k.leaf(m(34), 43.5, m(23), 49, 9, 'sakura', { part: 'sode' + s });
      k.line(m(32), 44, m(25), 47, 'gold', 5); k.line(m(32), 47, m(26), 50, 'gold', 3);
    });
    // antennae swept back, inside the crest
    k.sym(C, function (m, s) { k.tube([[m(38.5), 21, 0.5], [m(36.5), 13, 0.5], [m(35), 6, 0.5], [m(36), 3, 0.5]], 'grass', { part: 'ant' + s, shade: 'flat', flatTone: 2, noseam: true }); });
    // triangular head
    k.poly([[27, 24], [53, 24], [46, 36], [C, 41], [34, 36]], 'grass', { part: 'head' });
    k.ellipse(C, 24.5, 10, 4, 'grass', { part: 'head' });
    k.texture('head', 'scales', { size: 3, seed: 7 });
    k.sym(C, function (m, s) {
      k.ellipse(m(30), 25.5, 4.6, 5, 'leaf', { part: 'ceye' + s, light: 0.15 });
      k.texture('ceye' + s, 'dots', { seed: 2 + s });
    });
    k.sym(C, function (m, s) {
      k.poly([[m(25.5), 22], [m(35), 24.5], [m(35), 26], [m(26.5), 24]], 'black', { part: 'lid' + s, tone: 0, outline: 'none', noseam: true });
      k.px(m(30), 26, 'black', 0); k.px(m(31), 26, 'black', 0); k.px(m(30), 27, 'red', 4); k.px(m(31), 27, 'black', 0); k.px(m(30), 28, 'red', 3);
      k.px(m(28), 26, 'white', 6);
    });
    k.path([[37, 30], [C, 32], [43, 30]], 'grass', 1);
    k.px(C, 28, 'grass', 6);
    k.sym(C, function (m) { k.tooth(m(37.5), 36.5, m(39.5), 41.5, 2.2, 'bone'); });
    // gold crescent maedate with a sakura mon
    k.tube([[31, 14, 0.7], [33.5, 18, 1], [C, 20, 1.2], [46.5, 18, 1], [49, 14, 0.7]], 'gold', { part: 'maedate' });
    k.circle(C, 19.5, 1.9, 'sakura', { part: 'mdmon', tone: 4 }); k.px(C, 19, 'gold', 6);
  };

  // 45 ダイジュノヌシ (← 15 モリノヌシ) — grass, かっこいい(神秘): the old stag lord, antlers grown into a sacred tree canopy
  // with kodama spirits and hanging lanterns. Kept: shimenawa + shide, moss mantle, bushy-browed grump chewing a sprig, the chick's nest.
  P[45] = function (k) {
    k.shadow(C, 76.5, 26, 2.4);
    // antler-trunks rising into the canopy
    k.sym(C, function (m, s) {
      var A = { part: 'tr' + s };
      k.tube([[m(35), 23, 2.8], [m(30), 16, 2.4], [m(23), 11, 1.8], [m(13), 9, 1.2]], 'wood', A);
      k.tube([[m(30), 16, 1.7], [m(32), 8, 1.1]], 'wood', A);
      k.tube([[m(23), 11, 1.3], [m(21), 5, 0.9]], 'wood', A);
      k.texture('tr' + s, 'bark', { size: 3 });
    });
    // sacred canopy: an arched crown of leaf clumps
    [[8, 15, 7, 5], [17, 9, 8, 5.5], [29, 5, 8.5, 4.5], [C, 3.5, 8, 3.5], [51, 5, 8.5, 4.5], [63, 9, 8, 5.5], [72, 15, 7, 5], [23, 14, 6, 3.5], [57, 14, 6, 3.5]].forEach(function (c, i) {
      k.ellipse(c[0], c[1], c[2], c[3], i > 6 ? 'grass' : 'grass', { part: 'cn' + i, shift: i > 6 ? -1 : 0 });
      k.texture('cn' + i, 'fur', { seed: 4 + i });
      k.ellipse(c[0] - c[2] * 0.3, c[1] - c[3] * 0.4, c[2] * 0.45, c[3] * 0.35, 'leaf', { clip: 'cn' + i, light: 0.1 });
    });
    k.tufts([[79, 17], [72, 20], [64, 15], [57, 17.5], [50, 10], [C, 7.5], [30, 10], [23, 17.5], [16, 15], [8, 20], [1, 17]], 'grass', { part: 'cn9', len: 3, w: 2.4, every: 2.6, seed: 6 });
    // blossoms
    [[13, 8], [30, 3], [47, 4], [61, 6], [74, 13], [4, 14], [38, 6]].forEach(function (p) { k.px(p[0], p[1], 'sakura', 5); k.px(p[0] + 1, p[1], 'sakura', 4); });
    // kodama spirits peeking from the leaves
    [[24, 9], [60, 12]].forEach(function (p, i) {
      k.ellipse(p[0], p[1], 2.6, 3, 'white', { part: 'kd' + i, light: 0.25, outline: 'soft' });
      k.px(p[0] - 1, p[1] - 1, 'black', 0); k.px(p[0] + 1, p[1] - 1, 'black', 0); k.px(p[0], p[1] + 1, 'black', 1);
    });
    // lanterns hanging from the outer boughs
    k.sym(C, function (m, s) {
      var x = m(8);
      k.line(x, 20, x, 21, 'black', 3);
      k.rect(Math.round(x) - 2, 21, 5, 1, 'wood', { part: 'lc' + s });
      k.ellipse(x + 0.5, 24.5, 2.6, 2.8, 'flame', { part: 'lan' + s, shade: 'glow', halo: 0.3 });
      k.px(x, 28, 'red', 3);
    });
    // nest + chick on the right bough
    k.ellipse(63, 20.5, 5, 2.4, 'wood', { part: 'nest' });
    k.texture('nest', 'bark', { size: 2 });
    k.circle(63, 17, 2.6, 'thunder', { part: 'chick' });
    k.px(62, 16, 'black', 0); k.px(60, 17, 'red', 4); k.px(59, 17, 'red', 3); k.px(64, 15, 'thunder', 6);
    // flank + staggered hind legs
    k.ellipse(C, 55, 18, 8.5, 'fur', { part: 'flank', shift: -1 });
    k.texture('flank', 'fur', { seed: 12 });
    k.tube([[25, 57, 4], [23, 63, 2.8], [24.5, 67, 2.2], [24, 72, 1.8]], 'fur', { part: 'hindL', shift: -1 });
    k.poly([[21.5, 71.5], [26.5, 71.5], [27, 75.5], [21, 75.5]], 'obsidian', { part: 'hhL' });
    k.tube([[55, 57, 4], [58, 62, 2.8], [57, 66, 2.2], [58, 70, 1.8]], 'fur', { part: 'hindR', shift: -1 });
    k.poly([[55.5, 69.5], [60.5, 69.5], [61, 73.5], [55, 73.5]], 'obsidian', { part: 'hhR' });
    k.px(24, 74, 'obsidian', 0); k.px(58, 72, 'obsidian', 0);
    // knotted bark chest
    k.ellipse(C, 55, 12, 10.5, 'wood', { part: 'body' });
    k.texture('body', 'bark', { size: 3, seed: 4 });
    k.path([[31, 48], [33, 53], [32, 58], [34, 63]], 'wood', 1); k.path([[30, 50], [31, 54]], 'wood', 5);
    k.path([[49, 48], [47, 53], [48, 59], [46, 63]], 'wood', 1); k.path([[48, 50], [46, 54]], 'wood', 4);
    pm(k, 38, 57, ['.KK.', 'KhoK', 'KooK', '.KK.'], { K: ['wood', 1], h: ['wood', 5], o: ['wood', 3] });
    // staggered forelegs
    k.tube([[35, 60, 3.6], [34, 66, 2.6], [33.5, 68, 2.7], [33, 72.5, 2]], 'fur', { part: 'legL' });
    k.poly([[30.5, 72], [35.5, 72], [36, 76], [30, 76]], 'obsidian', { part: 'hoofL' });
    k.px(33, 74, 'obsidian', 0); k.px(33, 75, 'obsidian', 0); k.px(31, 73, 'obsidian', 5); k.px(33, 67, 'fur', 5);
    k.tube([[45, 60, 3.6], [48, 65, 2.5], [47, 67.5, 2.6], [45, 70, 2]], 'fur', { part: 'legR' });
    k.poly([[42.5, 69.5], [47.5, 69.5], [48, 73], [42, 73]], 'obsidian', { part: 'hoofR' });
    k.px(45, 71, 'obsidian', 0); k.px(45, 72, 'obsidian', 0); k.px(43, 70, 'obsidian', 5); k.px(48, 66, 'fur', 5);
    k.tufts([[31, 71], [36, 71]], 'tan', { part: 'fetL', len: 2, w: 2, every: 1.5, seed: 5 });
    // long moss mantle with fringe + flowers
    k.poly([[19, 46], [29, 41], [51, 41], [61, 46], [61, 52], [19, 52]], 'grass', { part: 'mantle' });
    k.tufts([[61, 51], [19, 51]], 'grass', { part: 'mantle', len: 6, w: 3, every: 2.3, seed: 12 });
    k.texture('mantle', 'fur', { seed: 5 });
    pm(k, 22, 45, ['.p.', 'pyp', '.p.'], { p: ['sakura', 5], y: ['gold', 5] });
    pm(k, 55, 46, ['.w.', 'wyw', '.w.'], { w: ['white', 6], y: ['gold', 5] });
    k.px(29, 44, 'white', 5); k.px(51, 43, 'sakura', 4);
    // neck ruff, thick shimenawa, three shide
    k.ellipse(C, 44, 9, 7.5, 'fur', { part: 'neck' });
    k.tufts([[47, 48.5], [33, 48.5]], 'cream', { part: 'ruff', len: 6, w: 3.2, every: 2.4, seed: 3 });
    k.tube([[27, 46, 2.2], [C, 50, 2.4], [53, 46, 2.2]], 'tan', { part: 'rope' });
    for (var i = 28; i <= 52; i += 2) k.px(i, 47 + (Math.abs(i - C) < 8 ? 1.5 : 0), 'tan', 1);
    [[30.5, 48], [48.5, 48]].forEach(function (p, i) {
      k.poly([[p[0], p[1]], [p[0] + 2, p[1]], [p[0] + 2, p[1] + 3], [p[0] + 3.5, p[1] + 3], [p[0] + 3.5, p[1] + 7], [p[0] + 1.5, p[1] + 7], [p[0] + 1.5, p[1] + 4], [p[0], p[1] + 4]], 'white', { part: 'shide' + i, shade: 'flat', flatTone: 5 });
    });
    // ears
    k.sym(C, function (m, s) {
      k.leaf(m(31), 28, m(20), 25, 6.5, 'fur', { part: 'ear' + s });
      k.leaf(m(30), 27.5, m(22), 25.5, 2.6, 'skin', { clip: 'ear' + s, tone: 3 });
    });
    // head, muzzle, nose
    k.ellipse(C, 32, 10.5, 9, 'fur', { part: 'head' });
    k.texture('head', 'fur', { seed: 9 });
    k.tube([[C, 35.5, 5], [C, 40, 4.1], [C, 44.5, 3.1]], 'tan', { part: 'muzzle' });
    k.ellipse(C, 43, 2.6, 2, 'cream', { clip: 'muzzle', tone: 5 });
    pm(k, 38, 43.5, ['.bKK.', 'KKKKK', '.K.K.'], { K: ['black', 1], b: ['black', 5] });
    k.path([[37, 47.5], [39, 46.5], [41, 46.5], [43, 47.5]], 'fur', 0);
    // mossy beard under the chin
    k.tufts([[44, 48], [36, 48]], 'grass', { part: 'beard', len: 4, w: 2.4, every: 2, seed: 2 });
    // chewing a sprig
    k.tube([[43, 47.5, 0.5], [50, 45, 0.5]], 'leaf', { part: 'stem', shade: 'flat', flatTone: 2 });
    k.leaf(49, 45, 55, 42, 3, 'leaf', { part: 'sprig' });
    k.px(C, 26, 'cream', 5); k.px(39, 27, 'cream', 4); k.px(41, 27, 'cream', 4);
    // grumpy half-lidded glare under bushy white brows
    var G = { K: ['black', 0], L: ['fur', 1], g: ['leaf', 5], P: ['black', 0], W: ['white', 6], s: ['fur', 2] };
    pm(k, 33, 31, ['KKKKK', 'KLLLK', 'KWPgK', '.KKK.', '.sss.'], G);
    pm(k, 42, 31, ['KKKKK', 'KLLLK', 'KgPWK', '.KKK.', '.sss.'], G);
    k.line(30, 28, 38, 30, 'white', 5); k.line(30, 27, 37, 29, 'white', 4); k.px(30, 29, 'white', 3); k.px(29, 28, 'white', 4);
    k.line(42, 30, 50, 28, 'white', 5); k.line(43, 29, 50, 27, 'white', 4); k.px(50, 29, 'white', 3); k.px(51, 28, 'white', 4);
    // forehead mark: glowing leaf sigil
    k.leaf(C, 26, C, 21, 2.6, 'leaf', { part: 'sigil', shade: 'glow' });
  };

  // 46 ライデンダマ (← 16 ビリタマ) — thunder, かわいい: bigger armoured pill-bug with a steel helmet plate and two spinning lightning wheels.
  // Gag kept: gleeful face peeking out, tiny legs kicking.
  P[46] = function (k) {
    k.shadow(C, 76.5, 23, 2.2);
    // spinning lightning wheels
    k.sym(C, function (m, s) {
      var x = m(15), y = 62;
      k.circle(x, y, 9.5, 'steel', { part: 'wh' + s });
      k.circle(x, y, 6.8, 'obsidian', { clip: 'wh' + s, tone: 2 });
      [0, 120, 240].forEach(function (a) {
        var r = (a + (s > 0 ? 20 : -20)) * Math.PI / 180;
        k.line(x, y, x + Math.cos(r) * 6, y + Math.sin(r) * 6, 'thunder', 5);
      });
      k.circle(x, y, 2, 'gold', { part: 'hub' + s });
      [[-7, -5], [7, -5], [0, 8.5], [-8, 3], [8, 3]].forEach(function (d) { k.px(x + d[0] * 1.05, y + d[1], 'steel', 6); });
      k.path(arc(x, y, 12, 12, s > 0 ? 200 : -20, s > 0 ? 250 : 30, 8), 'crystal', 5);
      k.path(arc(x, y, 12, 12, s > 0 ? 100 : 60, s > 0 ? 140 : 80, 8), 'crystal', 5);
    });
    // antennae with crackling tips
    k.sym(C, function (m, s) {
      k.tube([[m(31), 38, 1.1], [m(23), 30, 1], [m(18), 24, 0.7]], 'steel', { part: 'an' + s });
      k.circle(m(16.5), 21.5, 2.3, 'thunder', { part: 'tip' + s, shade: 'glow', halo: 0.35 });
    });
    k.path([[10, 19], [12, 16], [11, 14], [13, 11]], 'thunder', 6); k.path([[70, 19], [68, 16], [69, 14], [67, 11]], 'thunder', 6);
    k.px(9, 24, 'crystal', 6); k.px(71, 24, 'crystal', 6);
    // shell ball
    k.ellipse(C, 51, 20.5, 18.5, 'thunder', { part: 'shell' });
    for (var b = 0; b < 4; b++) {
      var yy = 45 + b * 5;
      k.tube([[21, yy + 6, 0.6], [29, yy + 1, 0.6], [C, yy, 0.6], [51, yy + 1, 0.6], [59, yy + 6, 0.6]], null, { adj: -2, clip: 'shell' });
      k.tube([[22, yy + 7.3, 0.5], [29, yy + 2.3, 0.5], [C, yy + 1.3, 0.5], [51, yy + 2.3, 0.5], [58, yy + 7.3, 0.5]], null, { adj: 1, clip: 'shell' });
    }
    k.texture('shell', 'dots', { seed: 5 });
    // steel helmet plate with rivets and a central fin
    k.spike(C, 36, C, 26, 7, 'steel', { part: 'fin' });
    k.line(39, 34, 39, 29, 'steel', 6);
    k.ellipse(C, 38, 21, 9.5, 'steel', { clip: 'shell' });
    k.tube([[21, 44, 0.6], [30, 40.5, 0.6], [C, 40, 0.6], [50, 40.5, 0.6], [59, 44, 0.6]], null, { adj: -2, clip: 'shell' });
    [[25, 40], [32, 36], [48, 36], [55, 40]].forEach(function (p) { k.px(p[0], p[1], 'steel', 6); k.px(p[0] + 1, p[1] + 1, 'steel', 1); });
    // lightning emblem on the helmet
    k.poly([[42, 32], [36, 39], [40, 39], [36, 45], [45, 37], [41, 37], [44, 32]], 'thunder', { clip: 'shell', tone: 5 });
    // opening: face peeking out
    k.ellipse(C, 62, 13, 8.5, 'shadow', { part: 'hole', shade: 'flat', flatTone: 1, noseam: true });
    // kicking legs
    k.sym(C, function (m, s) {
      k.tube([[m(32), 67, 1.1], [m(27), 70, 1], [m(24.5), 67.5, 0.8]], 'steel', { part: 'lg1' + s });
      k.tube([[m(34), 69, 1.1], [m(31), 74.5, 0.9]], 'steel', { part: 'lg2' + s });
      k.tube([[m(37), 70, 1], [m(36.5), 75, 0.8]], 'steel', { part: 'lg3' + s });
    });
    k.ellipse(C, 71.5, 8.5, 3.2, 'thunder', { part: 'tail' });
    k.line(34, 71, 46, 71, 'thunder', 2);
    k.ellipse(C, 61, 10, 7, 'cream', { part: 'face' });
    // gleeful face: happy closed eyes, huge open grin, one tooth
    pm(k, 32, 57, ['.KKK.', 'K...K'], INK); pm(k, 43, 57, ['.KKK.', 'K...K'], INK);
    k.mouth([[33.5, 60.5], [46.5, 60.5], [44.5, 65.5], [C, 67], [35.5, 65.5]], {});
    k.tooth(38, 60.5, 38.2, 62.5, 2);
    k.sym(C, function (m) { k.px(m(31), 61, 'sakura', 4); k.px(m(32), 61, 'sakura', 4); k.px(m(31), 62, 'sakura', 3); });
    // sparks
    k.path([[8, 44], [11, 42], [9, 40], [12, 38]], 'crystal', 5);
    k.path([[72, 44], [69, 42], [71, 40], [68, 38]], 'crystal', 5);
    k.sparkle(40, 20, 1, 'thunder');
  };

  // 47 イナズマジョオウ (← 17 イナビー) — thunder, かっこいい: storm hornet queen. Gold crown, four big crackling wings,
  // royal fur ruff, twin stingers. Kept: steel thorax, black-banded gold abdomen, dark mask and red glare.
  P[47] = function (k) {
    k.shadow(C, 76.5, 14, 1.8);
    // four wings with lightning veins
    k.sym(C, function (m, s) {
      k.leaf(m(35), 38, m(5), 15, 14, 'ice', { part: 'wa' + s, shade: 'flat', flatTone: 4 });
      k.leaf(m(35), 44, m(6), 47, 10, 'ice', { part: 'wb' + s, shade: 'flat', flatTone: 3 });
      k.path([[m(33), 37], [m(24), 29], [m(16), 23], [m(8), 17]], 'ice', 2);
      k.path([[m(27), 31], [m(22), 35], [m(15), 34]], 'ice', 2);
      k.path([[m(32), 44], [m(20), 45], [m(9), 47]], 'ice', 2);
      k.path([[m(29), 26], [m(25), 25], [m(22), 21], [m(17), 20]], 'thunder', 5);
      k.path([[m(24), 42], [m(19), 40], [m(15), 42], [m(11), 41]], 'thunder', 5);
      k.px(m(15), 20, 'white', 6); k.px(m(12), 45, 'white', 6);
    });
    k.path([[3, 12], [5, 10], [4, 8]], 'crystal', 6); k.path([[77, 12], [75, 10], [76, 8]], 'crystal', 6);
    // abdomen with stripes, twin stingers
    k.sym(C, function (m) { k.spike(m(37), 70, m(33.5), 77.5, 3.4, 'steel', { part: 'sting' + m(1) }); });
    k.px(35, 72, 'steel', 6); k.px(44, 72, 'steel', 6);
    k.ellipse(C, 62, 9, 10.5, 'thunder', { part: 'abd' });
    for (var y = 56; y <= 70; y += 4) k.tube([[31, y, 1], [C, y + 1.4, 1], [49, y, 1]], 'black', { clip: 'abd', tone: 2 });
    k.texture('abd', 'fur', { seed: 2 });
    k.path([[C, 72], [39, 74], [41, 75], [C, 77]], 'thunder', 6);
    k.path([[29, 70], [26, 72], [28, 73], [25, 76]], 'thunder', 6); k.path([[51, 70], [54, 72], [52, 73], [55, 76]], 'thunder', 6);
    // legs, forelegs raised with gold claws
    k.sym(C, function (m, s) {
      k.tube([[m(35), 54, 1.2], [m(27), 58, 1.1], [m(26), 66, 0.9]], 'obsidian', { part: 'lg' + s });
      k.tube([[m(34), 50, 1.3], [m(25), 50, 1.1], [m(21), 44, 0.9]], 'obsidian', { part: 'fl' + s });
      k.tooth(m(21), 44, m(19), 40, 1.8, 'gold'); k.tooth(m(22), 44, m(23.5), 40.5, 1.4, 'gold');
    });
    // thorax: steel carapace
    k.ellipse(C, 50, 8.5, 6, 'steel', { part: 'thorax' });
    k.rect(33, 50, 14, 1, null, { adj: -2, clip: 'thorax' });
    k.px(36, 47, 'steel', 6);
    // royal fur ruff
    k.ellipse(C, 44.5, 11.5, 3.6, 'cream', { part: 'ruff' });
    k.tufts(arc(C, 44.5, 11.5, 3.6, 160, 200, 10), 'cream', { part: 'ruff', len: 2.5, w: 3, every: 2, seed: 3 });
    k.tufts(arc(C, 44.5, 11.5, 3.6, -20, 20, 10), 'cream', { part: 'ruff', len: 2.5, w: 3, every: 2, seed: 5 });
    k.tube([[30, 46, 0.6], [C, 47.5, 0.6], [50, 46, 0.6]], null, { adj: -1, clip: 'ruff' });
    k.texture('ruff', 'fur', { seed: 4 });
    // antennae
    k.sym(C, function (m, s) { k.tube([[m(33), 29, 0.6], [m(27), 23, 0.6], [m(21), 21, 0.5]], 'obsidian', { part: 'an' + s, noseam: true }); k.px(m(20), 20, 'thunder', 6); k.px(m(21), 20, 'thunder', 5); });
    // head
    k.ellipse(C, 34.5, 10, 8, 'thunder', { part: 'head' });
    k.poly([[29, 27], [51, 27], [51, 31], [C, 35.5], [29, 31]], 'obsidian', { clip: 'head' });
    k.texture('head', 'scales', { size: 3 });
    k.ellipse(C, 39.5, 4.5, 2.6, 'thunder', { clip: 'head', light: 0.25 });
    k.sym(C, function (m) { k.tooth(m(36.5), 41, m(38.8), 45.5, 2.4, 'steel'); });
    k.eye(31, 32, { w: 7, h: 4, iris: 'red', side: 'L', angry: 2, brow: false });
    k.eye(42, 32, { w: 7, h: 4, iris: 'red', side: 'R', angry: 2, brow: false });
    k.path([[30, 31], [34, 32], [38, 34]], 'black', 0); k.path([[50, 31], [46, 32], [42, 34]], 'black', 0);
    // gold crown with a red jewel
    k.poly([[32, 23], [48, 23], [47.5, 27.5], [32.5, 27.5]], 'gold', { part: 'crown' });
    k.sym(C, function (m, s) {
      k.spike(m(33.5), 24, m(32.5), 17.5, 3.6, 'gold', { part: 'crown' });
      k.spike(m(37), 24, m(36.5), 16, 3.4, 'gold', { part: 'crown' });
    });
    k.spike(C, 24, C, 13, 4.2, 'gold', { part: 'crown' });
    k.line(33, 26, 47, 26, 'gold', 2);
    k.circle(C, 24.5, 1.6, 'red', { part: 'jewel' }); k.px(39, 24, 'white', 6);
    k.px(34, 25, 'crystal', 5); k.px(46, 25, 'crystal', 5);
    k.px(C, 13, 'gold', 6);
  };

  // 48 ゴロゴロオニ (← 18 カミナリコゾウ) — thunder, コミカル: burly thunder oni with the full ring of taiko,
  // tiger-pelt loincloth and lightning-bolt drumsticks. Kept: aqua hide, violet hair with a bolt forelock, cheeky tongue.
  P[48] = function (k) {
    k.shadow(C, 76.5, 22, 2.3);
    // the full drum ring
    var RC = [C, 43], RR = 27;
    k.tube(arc(RC[0], RC[1], RR, RR, 0, 360, 15).map(function (p) { return [p[0], p[1], 1.3]; }), 'red', { part: 'ring' });
    [-150, -110, -70, -30, 10, 170, 50, 130].forEach(function (a, i) {
      var r = a * Math.PI / 180, x = RC[0] + Math.cos(r) * RR, y = RC[1] + Math.sin(r) * RR;
      k.circle(x, y, 4.4, 'wood', { part: 'drum' + i });
      k.circle(x, y, 3, 'cream', { part: 'dh' + i, spec: false });
      pm(k, Math.round(x - 0.5) - 1, Math.round(y - 0.5) - 1, ['rR', 'Rr'], { r: ['red', 4], R: ['red', 2] });
      k.px(x - 4.2, y, 'gold', 5); k.px(x + 4, y, 'gold', 5);
    });
    // thick legs + feet
    k.sym(C, function (m, s) {
      k.tube([[m(33), 66, 4.2], [m(32), 71, 3.8]], 'aqua', { part: 'leg' + s });
      k.ellipse(m(31), 74, 6, 2.5, 'aqua', { part: 'leg' + s });
      k.px(m(27), 75, 'aqua', 1); k.px(m(30), 75, 'aqua', 1);
    });
    // shoulders + belly
    k.sym(C, function (m, s) { k.ellipse(m(26.5), 49, 7, 6, 'aqua', { part: 'sh' + s }); k.texture('sh' + s, 'fur', { seed: 3 + s }); });
    k.ellipse(C, 58, 14, 11.5, 'aqua', { part: 'body' });
    k.texture('body', 'fur', { seed: 4 });
    k.sym(C, function (m) { k.tube([[m(30), 51, 0.6], [m(35), 53.5, 0.6], [m(39), 52.5, 0.6]], null, { adj: -2, clip: 'body' }); });
    k.ellipse(C, 60, 7, 5.5, null, { adj: 1, clip: 'body' });
    k.px(C, 61, 'aqua', 1); k.px(C, 62, 'aqua', 2);
    // tiger-pelt loincloth + rope belt
    k.poly([[26, 63], [54, 63], [56, 71], [48, 72], [C, 69], [32, 72], [24, 71]], 'thunder', { part: 'pelt' });
    k.texture('pelt', 'fur', { seed: 6 });
    [[29, 65, 28, 70], [33, 65, 32, 69], [36, 65, 37, 68], [44, 65, 43, 68], [47, 65, 48, 69], [51, 65, 52, 70], [41, 66, 40, 67]].forEach(function (l) { k.line(l[0], l[1], l[2], l[3], 'black', 1); });
    k.tube([[25, 63, 1.3], [C, 64.5, 1.4], [55, 63, 1.3]], 'white', { part: 'belt' });
    k.tube([[42, 64, 1], [44, 67, 0.8]], 'white', { part: 'knot' });
    // arms raised with lightning drumsticks
    k.sym(C, function (m, s) {
      k.tube([[m(26), 49, 4.2], [m(17.5), 47, 3.6], [m(18.5), 38, 3.1]], 'aqua', { part: 'arm' + s });
      k.tube([[m(23), 47, 0.6], [m(18), 45, 0.6]], null, { adj: 1, clip: 'arm' + s });
      k.tube([[m(15.5), 44, 0.6], [m(16), 39, 0.6]], null, { adj: -1, clip: 'arm' + s });
      k.tube([[m(19.5), 33, 0.9], [m(22.5), 26, 0.8]], 'wood', { part: 'stick' + s });
      bolt(k, m(23.5), 25.5, 0.85, -1, -s, 'thunder', { part: 'bolt' + s, shade: 'glow' });
      k.circle(m(19), 35, 3.7, 'aqua', { part: 'fist' + s });
      k.px(m(17), 34, 'aqua', 1); k.px(m(20), 33, 'aqua', 5); k.px(m(18), 36, 'aqua', 1);
    });
    // wild hair, horns
    k.ellipse(C, 31, 12.5, 6, 'dark', { part: 'hair' });
    k.tube([[32, 29, 3], [27, 24, 1.8], [22, 23, 0.5]], 'dark', { part: 'hair' });
    k.tube([[39, 27, 3], [36, 22, 1.8], [33, 19, 0.5]], 'dark', { part: 'hair' });
    k.tube([[47, 28, 3], [51, 23, 1.8], [56, 22, 0.5]], 'dark', { part: 'hair' });
    
    k.texture('hair', 'fur', { seed: 3 });
    k.sym(C, function (m, s) {
      k.tube([[m(34), 29, 2.4], [m(32), 23, 1.6], [m(33), 19, 0.5]], 'bone', { part: 'horn' + s });
      k.px(m(32), 25, 'bone', 2); k.px(m(33), 27, 'bone', 2);
    });
    // big head + ears
    k.sym(C, function (m, s) { k.ellipse(m(25.5), 40, 2.6, 3.3, 'aqua', { part: 'ear' + s }); k.px(m(26), 40, 'skin', 3); });
    k.ellipse(C, 39.5, 13.5, 10.5, 'aqua', { part: 'head', light: 0.1 });
    k.texture('head', 'fur', { seed: 5 });
    k.tufts([[29, 32], [35, 30.5], [45, 30.5], [51, 32]], 'dark', { part: 'fringe', len: 3, w: 3, every: 2.5, seed: 5 });
    k.poly([[43, 28], [47, 28], [44.5, 32], [47, 32], [41, 38], [42.5, 33.5], [40.5, 33.5]], 'thunder', { part: 'forelock', shade: 'glow' });
    // eyes
    k.eye(30, 35, { w: 6, h: 4, iris: 'red', side: 'L', angry: 1.5 });
    k.eye(44, 35, { w: 6, h: 4, iris: 'red', side: 'R', angry: 1.5 });
    k.px(39, 40, 'aqua', 1); k.px(41, 40, 'aqua', 1);
    // huge grin, tooth row, tusks, tongue lolled to one side
    k.mouth([[30.5, 42], [49.5, 42], [47, 47.5], [C, 49.5], [33, 47.5]], { tongue: false });
    [34, 37, C, 43].forEach(function (tx) { k.tooth(tx + 0.5, 42, tx + 0.7, 44, 2.2); });
    k.tooth(33.5, 47.5, 32.5, 43, 2.4); k.tooth(46.5, 47.5, 47.5, 43, 2.4);
    k.tube([[45, 47, 1.3], [45.5, 49.5, 1.4], [45, 51, 0.9]], 'skin', { part: 'tongue' });
    k.px(45, 49, 'skin', 2);
    k.sym(C, function (m) { k.px(m(29), 41, 'sakura', 4); k.px(m(28), 41, 'sakura', 4); });
  };

  // 49 ライジュウオウ (← 19 ライジュウマル) — thunder, かっこいい: thunder beast king. Storm-cloud mane crackling with bolts,
  // gold lightning armour, roaring. Kept: gold ruff, bolt tail, lightning face stripes, crystal eyes, claws.
  P[49] = function (k) {
    k.shadow(C, 76.5, 26, 2.4);
    // bolt tail
    k.poly([[54, 62], [64, 49], [60, 48], [70, 32], [66, 32], [77, 13], [63, 29], [67, 30], [57, 44], [61, 45], [49, 60]], 'thunder', { part: 'tail', shade: 'glow', halo: 0.25 });
    // storm-cloud mane
    [[17, 34, 7], [19, 23, 6.5], [27, 14, 6.5], [C, 10, 7.5], [53, 14, 6.5], [61, 23, 6.5], [63, 34, 7], [20, 44, 6], [60, 44, 6]].forEach(function (c) { k.circle(c[0], c[1], c[2], 'stone', { part: 'cloud' }); });
    k.texture('cloud', 'dots', { seed: 3 });
    k.path([[12, 30], [16, 28], [20, 30]], 'stone', 2); k.path([[60, 30], [64, 28], [68, 30]], 'stone', 2);
    k.path([[33, 8], [37, 6], [41, 7]], 'stone', 5); k.path([[21, 17], [24, 15]], 'stone', 5);
    k.path([[10, 40], [8, 44], [11, 45], [8, 50]], 'thunder', 6); k.path([[70, 40], [72, 44], [69, 45], [72, 50]], 'thunder', 6);
    k.path([[22, 8], [20, 5], [23, 4]], 'crystal', 6); k.path([[58, 8], [60, 5], [57, 4]], 'crystal', 6);
    // hind haunches
    k.sym(C, function (m, s) {
      k.ellipse(m(25), 65, 8, 8, 'thunder', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(22.5), 73.5, 6, 2.8, 'thunder', { part: 'haunch' + s, shift: -1 });
      k.texture('haunch' + s, 'fur', { seed: 2 });
      k.path([[m(19), 61], [m(22), 64], [m(20), 67]], 'obsidian', 2);
    });
    // chest with gold breastplate
    k.ellipse(C, 60, 12.5, 12, 'thunder', { part: 'body' });
    k.texture('body', 'fur', { seed: 3 });
    k.poly([[31, 53], [49, 53], [47.5, 65], [C, 69], [32.5, 65]], 'gold', { part: 'plate' });
    k.poly([[C, 53], [49, 53], [47.5, 65], [C, 69]], null, { adj: -1, clip: 'plate' });
    k.poly([[41.5, 55], [37, 61], [40, 61], [37.5, 67], [43.5, 59], [40.5, 59], [43, 55]], 'obsidian', { clip: 'plate', tone: 1 });
    k.poly([[41, 56], [38.5, 60], [40.5, 60], [39, 64], [42, 59.5], [40, 59.5], [42, 56]], 'crystal', { clip: 'plate', tone: 5 });
    k.line(31, 53, 49, 53, 'gold', 6);
    // forelegs with gold bracers + claws
    k.sym(C, function (m, s) {
      k.tube([[m(32.5), 60, 3.8], [m(31), 67, 3.2], [m(30.5), 72, 3.2]], 'thunder', { part: 'leg' + s });
      k.ellipse(m(30), 73.5, 5, 2.8, 'thunder', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 5 + s });
      k.ellipse(m(31.2), 65.5, 4, 1.8, 'gold', { part: 'brc' + s });
      k.px(m(30), 65, 'gold', 6);
      [27, 30, 33].forEach(function (cx) { k.tooth(m(cx), 74, m(cx - 0.4), 77, 2, 'bone'); });
    });
    // gold ruff (inner mane)
    k.ellipse(C, 44, 17, 9, 'gold', { part: 'mane', light: 0.15 });
    k.tufts([[57, 50], [61, 44], [57, 37]], 'gold', { part: 'mane', len: 5, w: 4, every: 3, seed: 6 });
    k.tufts([[23, 37], [19, 44], [23, 50]], 'gold', { part: 'mane', len: 5, w: 4, every: 3, seed: 7 });
    k.tufts([[53, 52], [27, 52]], 'gold', { part: 'mane', len: 4.5, w: 3.5, every: 3, seed: 8 });
    k.texture('mane', 'fur', { seed: 9 });
    // lightning pauldrons
    k.sym(C, function (m, s) {
      k.ellipse(m(25.5), 52, 5.5, 4, 'steel', { part: 'pd' + s });
      k.spike(m(23), 50, m(16), 46.5, 4, 'steel', { part: 'pd' + s });
      k.line(m(22), 53, m(29), 51, 'thunder', 5);
    });
    // ears
    k.sym(C, function (m, s) {
      k.spike(m(30.5), 27, m(23.5), 11, 9, 'thunder', { part: 'ear' + s });
      k.spike(m(30.5), 26, m(25.5), 16, 4.5, 'obsidian', { clip: 'ear' + s, tone: 2 });
      k.spike(m(24.5), 14, m(22.5), 8, 2.2, 'obsidian', { part: 'et' + s });
    });
    // head
    k.ellipse(C, 34, 13, 10.5, 'thunder', { part: 'head' });
    k.texture('head', 'fur', { seed: 10 });
    k.tufts([[28, 31], [26, 37], [29, 43]], 'thunder', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 11 });
    k.tufts([[51, 43], [54, 37], [52, 31]], 'thunder', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 12 });
    k.sym(C, function (m) { k.path([[m(29), 28], [m(32), 30], [m(30), 31], [m(33), 33]], 'obsidian', 1); k.path([[m(27), 36], [m(30), 37], [m(28), 39]], 'obsidian', 1); });
    k.path([[39, 24], [C, 26], [39, 27], [41, 29]], 'obsidian', 1);
    // muzzle + roaring maw
    k.ellipse(C, 39.5, 6.5, 4, 'cream', { part: 'muzzle' });
    pm(k, 38, 36, ['bKKK.', '.KKK.', '..K..'], { K: ['black', 1], b: ['black', 5] });
    k.mouth([[31.5, 41], [48.5, 41], [46.5, 49], [C, 51.5], [33.5, 49]], {});
    k.tooth(34, 41, 34.6, 45.5, 2.4); k.tooth(46, 41, 45.4, 45.5, 2.4);
    k.tooth(37, 41, 37.2, 43, 1.6); k.tooth(43, 41, 42.8, 43, 1.6);
    k.tooth(36, 50, 36.2, 46.5, 1.8); k.tooth(44, 50, 43.8, 46.5, 1.8);
    k.eye(29, 29, { w: 7, h: 4, iris: 'crystal', side: 'L', angry: 2, brow: false });
    k.eye(44, 29, { w: 7, h: 4, iris: 'crystal', side: 'R', angry: 2, brow: false });
    k.sym(C, function (m) { k.line(m(28), 27, m(36), 29.5, 'black', 0); });
    // sparks
    k.path([[6, 58], [9, 56], [7, 54], [10, 52]], 'crystal', 5);
    k.path([[74, 64], [71, 62], [73, 60]], 'crystal', 5);
  };

  // 50 ハタタガミ (← 20 ナルカミ) — thunder, かっこいい: storm god bird. Giant wings with lightning primaries and a bolt through each,
  // a thunderhead crown bristling with bolts, eyes of pure lightning. Kept: blue wings, gold chevron breast, hooked beak, cloud perch.
  P[50] = function (k) {
    k.shadow(C, 76.5, 26, 2.4);
    // wings
    k.sym(C, function (m, s) {
      k.poly([[m(33), 38], [m(19), 18], [m(8), 2], [m(3), 6], [m(1), 20], [m(1.5), 33], [m(6), 43], [m(14), 50], [m(23), 55], [m(32), 55]], 'water', { part: 'wing' + s });
      for (var r = 0; r < 4; r++) {
        var o = r * 5.5;
        k.tube([[m(10 + o * 0.2), 8 + o], [m(16 + o * 0.5), 22 + o], [m(30), 40 + o * 0.45]].map(function (p) { return [p[0], p[1], 0.6]; }), null, { adj: -2, clip: 'wing' + s });
        k.tube([[m(9 + o * 0.2), 9.5 + o], [m(15 + o * 0.5), 23.5 + o], [m(29), 41.5 + o * 0.45]].map(function (p) { return [p[0], p[1], 0.5]; }), null, { adj: 1, clip: 'wing' + s });
      }
      k.texture('wing' + s, 'fur', { seed: 2 + s });
      k.tufts(s > 0 ? [[m(3), 6], [m(1), 20], [m(1.5), 32]] : [[m(1.5), 32], [m(1), 20], [m(3), 6]], 'water', { part: 'wing' + s, len: 2, w: 3, every: 3.5, seed: 4, jitter: 0.2 });
      k.tube([[m(33), 38, 2.3], [m(19), 18, 1.7], [m(8), 2, 1]], 'water', { part: 'wb' + s, noseam: true, light: 0.3 });
      k.poly([[m(2), 31], [m(7), 40], [m(15), 46.5], [m(24), 51.5], [m(32), 52], [m(32), 55], [m(23), 55], [m(14), 50], [m(6), 43], [m(1.5), 34]], 'thunder', { clip: 'wing' + s });
      // a great bolt through the wing
      k.poly([[m(17), 14], [m(22), 20], [m(16), 22], [m(22), 31], [m(13), 24], [m(18), 22.5]], 'thunder', { clip: 'wing' + s, tone: 5 });
      k.poly([[m(12), 26], [m(18), 33], [m(11), 34], [m(16), 43], [m(8), 35], [m(13), 34]], 'thunder', { clip: 'wing' + s, tone: 5 });
      // bolt primaries
      [[3, 32, 0], [5, 41, 1], [11, 47, 2], [18, 51, 3], [26, 54.5, 4]].forEach(function (f) {
        bolt(k, m(f[0]), f[1] - 2, 1.05, 1, s, 'thunder', { part: 'pr' + s + f[2], shade: 'glow' });
      });
      k.tooth(m(8), 3, m(6.5), 0.5, 2.4, 'bone');
    });
    // thunderhead perch
    [[25, 71, 8, 4.5], [C, 70, 9, 5.5], [55, 71, 8, 4.5], [32, 74, 8, 2.5], [48, 74, 8, 2.5]].forEach(function (c) { k.ellipse(c[0], c[1], c[2], c[3], 'stone', { part: 'cloud', light: -0.1 }); });
    k.texture('cloud', 'dots', { seed: 3 });
    k.path([[20, 72], [25, 70], [30, 72]], 'stone', 2); k.path([[50, 72], [55, 70], [60, 72]], 'stone', 2);
    // tail fan
    k.poly([[33, 57], [47, 57], [55, 70], [47, 67], [C, 73], [33, 67], [25, 70]], 'thunder', { part: 'tailf', shift: -1 });
    k.line(C, 59, C, 71, 'thunder', 1); k.line(35, 60, 30, 68, 'thunder', 1); k.line(45, 60, 50, 68, 'thunder', 1);
    // body plumage
    k.sym(C, function (m, s) { k.ellipse(m(30), 42, 5.5, 5.5, 'thunder', { part: 'sh' + s }); k.texture('sh' + s, 'fur', { seed: 6 }); });
    k.ellipse(C, 49, 12.5, 13, 'thunder', { part: 'body' });
    k.ellipse(C, 52, 7.5, 9.5, 'cream', { clip: 'body' });
    for (var y = 44; y <= 60; y += 3) k.path([[34, y], [C, y + 2], [46, y]], 'thunder', 2);
    k.sym(C, function (m) { k.tufts([[m(28), 42], [m(29), 53], [m(33), 60]], 'thunder', { part: 'body', len: 2.5, w: 3, every: 3, seed: 8 }); });
    k.texture('body', 'fur', { seed: 4 });
    // talons
    k.sym(C, function (m, s) {
      k.tube([[m(35), 60, 2.4], [m(34.5), 66, 1.9]], 'gold', { part: 'shin' + s });
      k.tooth(m(33), 66, m(29.5), 69.5, 2.2, 'obsidian'); k.tooth(m(35), 66, m(35), 71, 2.2, 'obsidian'); k.tooth(m(36.5), 66, m(39), 69.5, 1.9, 'obsidian');
    });
    // side plumes
    k.sym(C, function (m, s) { k.tube([[m(33), 24, 2.2], [m(27), 18, 1.6], [m(21), 16, 0.5]], 'thunder', { part: 'plume' + s }); });
    // thunderhead crown: storm cloud with bolts rising out of it
    k.sym(C, function (m, s) { bolt(k, m(32), 7, 0.75, 1, -s, 'thunder', { part: 'cb' + s, shade: 'glow' }); });
    [[33, 15, 4], [C, 12.5, 5], [47, 15, 4], [36.5, 11, 3.5], [43.5, 11, 3.5]].forEach(function (c) { k.circle(c[0], c[1], c[2], 'stone', { part: 'crownc' }); });
    k.texture('crownc', 'dots', { seed: 6 });
    k.path([[35, 9], [38, 8], [41, 8.5]], 'stone', 6);
    k.poly([[37.5, 12], [42.5, 12], [45, 5], [41.5, 5], [45.5, -1], [36, 7], [40, 7]], 'thunder', { part: 'crest', shade: 'glow', halo: 0.3 });
    // neck ruff
    k.tufts([[28, 36], [34, 40], [46, 40], [52, 36]], 'thunder', { part: 'ruff', len: 4.5, w: 3.5, every: 2.5, seed: 4 });
    // head + hooked beak
    k.ellipse(C, 28, 10, 8.5, 'thunder', { part: 'head' });
    k.texture('head', 'fur', { seed: 2 });
    k.poly([[35, 29], [45, 29], [43.5, 33.5], [C, 39], [36.5, 33.5]], 'gold', { part: 'beak' });
    k.line(37, 32, 43, 32, 'gold', 1); k.px(C, 38, 'obsidian', 1);
    k.px(38, 30, 'gold', 6); k.px(37, 30, 'gold', 5);
    // eyes of lightning
    k.sym(C, function (m, s) {
      k.poly([[m(30), 23.5], [m(37.5), 25.5], [m(37), 27.5], [m(31.5), 26.5]], 'crystal', { part: 'eye' + s, shade: 'glow', halo: 0.3, outline: 'none' });
      k.path([[m(30), 24], [m(27), 22], [m(28), 21], [m(25), 19]], 'crystal', 6);
      k.tube([[m(29), 22.5, 1.3], [m(38), 24.5, 1.3]], 'thunder', { part: 'brow' + s, light: 0.25 });
    });
    // storm aura
    k.path([[4, 62], [7, 59], [5, 57], [8, 54]], 'crystal', 5);
    k.path([[76, 62], [73, 59], [75, 57], [72, 54]], 'crystal', 5);
    k.sparkle(12, 60, 1, 'crystal'); k.sparkle(68, 60, 1, 'crystal');
  };
})();
