/* 封札モンスターズ — monster sprites, set 1 (style reference). 80x80 front-facing battle sprites at SFC density.
 * Requires pixkit.js (v3). All designs are original. */
(function () {
  'use strict';
  var P = window.PIXMON = window.PIXMON || {};
  var C = 40; // centre line

  function wisp(k, cx, cy, s, id, mat) {
    var o = { part: id, shade: 'glow', halo: 0.3 };
    k.tube([[cx, cy, 3 * s], [cx + 0.6 * s, cy - 3.5 * s, 2 * s], [cx - 1 * s, cy - 8 * s, 0.5]], mat || 'violet', o);
    k.spike(cx + 1.8 * s, cy - 2.5 * s, cx + 4 * s, cy - 6.5 * s, 2.2 * s, mat || 'violet', o);
  }

  // 1 ヒノコロ — fire C: scrappy fox pup, bonfire tail. Gag: cocky grin with a lolling tongue and one snaggle fang.
  P[1] = function (k) {
    k.shadow(C, 76.5, 16, 2);
    // bonfire tail
    k.tube([[48, 68, 3.5], [55, 64, 4.5], [58, 57, 4.5]], 'fire', { part: 'tailbase' });
    k.tufts([[49, 71], [56, 67], [61, 60]], 'fire', { part: 'tailbase', len: 3, w: 3, every: 3, seed: 4 });
    k.tube([[58, 59, 6], [60, 50, 7], [57, 41, 5.5], [53, 33, 2]], 'flame', { part: 'flame', shade: 'glow', halo: 0.25 });
    k.spike(63, 49, 69, 37, 5, 'flame', { part: 'flame' });
    k.spike(54, 45, 49, 35, 4, 'flame', { part: 'flame' });
    k.spike(59, 41, 62, 30, 4, 'flame', { part: 'flame' });
    // hind haunches + feet
    k.sym(C, function (m, s) {
      k.ellipse(m(30), 67, 6, 6.5, 'fire', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(28.5), 74.5, 5, 2.4, 'cream', { part: 'haunch' + s });
    });
    // body with chest ruff
    k.ellipse(C, 63, 10.5, 10, 'fire', { part: 'body' });
    k.ellipse(C, 64, 6, 7, 'cream', { clip: 'body' });
    k.tufts([[46, 69], [34, 69]], 'cream', { part: 'chest', len: 4, w: 3, every: 3, seed: 2 });
    // front legs with black socks
    k.sym(C, function (m, s) {
      k.tube([[m(35), 65, 3.2], [m(34.5), 72, 3]], 'fire', { part: 'leg' + s });
      k.ellipse(m(34.5), 72.5, 3.4, 3, 'black', { part: 'leg' + s });
      k.ellipse(m(34.5), 74.5, 4, 2.2, 'black', { part: 'paw' + s });
      k.px(m(33), 75, 'black', 0); k.px(m(36), 75, 'black', 0);
    });
    // ears
    k.sym(C, function (m, s) {
      k.spike(m(31), 44, m(24), 27, 10, 'fire', { part: 'ear' + s });
      k.spike(m(31), 43, m(26), 32, 5, 'magma', { clip: 'ear' + s, tone: 2 });
      k.tufts(s > 0 ? [[m(29), 42], [m(27), 35]] : [[m(27), 35], [m(29), 42]], 'cream', { part: 'earfluff' + s, len: 2.5, w: 2, every: 2, seed: 9 });
    });
    // head with ragged cheek ruffs
    k.ellipse(C, 50, 13.5, 11, 'fire', { part: 'head' });
    k.tufts([[29, 47], [27, 53], [30, 59]], 'fire', { part: 'head', len: 5, w: 4, every: 3, seed: 5 });
    k.tufts([[50, 59], [53, 53], [51, 47]], 'fire', { part: 'head', len: 5, w: 4, every: 3, seed: 6 });
    k.ellipse(C, 56, 9, 5, 'cream', { clip: 'head' });
    k.texture('body', 'fur', { seed: 3 }); k.texture('head', 'fur', { seed: 4 });
    // forehead flame
    k.tube([[41, 42, 3.2], [38.5, 37, 2.6], [39.5, 32.5, 1.6], [43, 29.5, 0.5]], 'flame', { part: 'tuft', shade: 'glow', halo: 0.25 });
    k.spike(43.5, 41, 46, 36.5, 3, 'flame', { part: 'tuft' });
    // muzzle, nose
    k.ellipse(C, 54, 5.5, 3.5, 'cream', { part: 'muzzle' });
    k.ellipse(C, 52, 2.3, 1.6, 'black', { part: 'nose' });
    k.px(39, 51, 'black', 6);
    // grin, tongue, fangs
    k.mouth([[33, 56], [47, 55.5], [45, 60], [40, 62], [35, 60]], { tongue: false });
    k.tube([[43.5, 59, 1.4], [44.5, 62, 1.7], [44.2, 63.8, 1.2]], 'skin', { part: 'tongue' });
    k.px(44, 61, 'skin', 2);
    k.tooth(36, 56, 36.3, 58.8, 2.2);
    k.tooth(45.5, 56, 45.2, 57.8, 1.8);
    // cocky glare: left brow relaxed, right brow scowling
    k.eye(31, 45, { w: 5, h: 4, iris: 'thunder', side: 'L', angry: 0.3 });
    k.eye(44, 45, { w: 5, h: 4, iris: 'thunder', side: 'R', angry: 1.6 });
    k.px(29, 55, 'flame', 5); k.px(51, 55, 'flame', 5);
  };

  // 4 ホムラドラ — fire SR: obsidian dragon rearing up, bat wings spread. Gag: a roaring, toothy laugh.
  P[4] = function (k) {
    k.shadow(C, 76.5, 25, 2.4);
    // bat wings
    k.sym(C, function (m, s) {
      k.poly([[m(31), 42], [m(15), 11], [m(4), 32], [m(9), 31], [m(10), 41], [m(16), 37], [m(20), 46], [m(25), 42], [m(29), 50]], 'fire', { part: 'wing' + s, flat: true });
      var bo = { part: 'wb' + s, noseam: true };
      k.tube([[m(31), 42, 2], [m(15), 12, 1.5]], 'obsidian', bo);
      k.tube([[m(15), 12, 1.1], [m(4), 32, 0.6]], 'obsidian', bo);
      k.tube([[m(15), 12, 1], [m(10), 41, 0.6]], 'obsidian', bo);
      k.tube([[m(15), 12, 1], [m(20), 46, 0.6]], 'obsidian', bo);
      k.spike(m(15), 12, m(13), 5, 2.6, 'bone', { part: 'wc' + s });
      k.tube([[m(12), 22, 0.5], [m(9), 33, 0.5]], null, { adj: -1, clip: 'wing' + s });
      k.tube([[m(18), 25, 0.5], [m(16), 36, 0.5]], null, { adj: -1, clip: 'wing' + s });
    });
    // tail
    k.tube([[52, 70, 6], [62, 72, 4.5], [70, 67, 3.2], [72, 59, 1.6]], 'obsidian', { part: 'tail' });
    k.tufts([[70, 64], [66, 70], [58, 72]], 'bone', { part: 'tailsp', len: 3, w: 2.4, every: 4, seed: 3 });
    k.spike(72, 61, 74, 50, 6, 'flame', { shade: 'glow', halo: 0.25 });
    k.texture('tail', 'scales', { size: 4 });
    // legs
    k.sym(C, function (m, s) {
      k.ellipse(m(31), 66, 7.5, 7.5, 'obsidian', { part: 'thigh' + s });
      k.ellipse(m(29.5), 73, 8.5, 3, 'obsidian', { part: 'foot' + s });
      [23.5, 27.5, 31.5].forEach(function (cx, i) { k.tooth(m(cx), 73.5, m(cx - 0.8), 76.5, 2.6, 'bone'); });
      k.texture('thigh' + s, 'scales', { size: 4, seed: 2 });
      k.tube([[m(34), 60, 0.6], [m(36), 66, 0.6]], null, { adj: -1, clip: 'thigh' + s });
    });
    // body: scaled hide, molten belly plates
    k.ellipse(C, 55, 16, 15, 'obsidian', { part: 'body' });
    k.texture('body', 'scales', { size: 4 });
    k.ellipse(C, 59, 8.5, 12, 'fire', { clip: 'body' });
    for (var y = 50; y <= 70; y += 4) k.rect(31, y, 18, 1, 'fire', { adj: -2, clip: 'body' });
    k.path([[28, 47], [30, 52], [28, 56], [30, 60]], 'magma', 5); k.px(30, 52, 'magma', 6);
    k.path([[53, 49], [50, 54], [52, 58]], 'magma', 5);
    // arms raised, claws up
    k.sym(C, function (m, s) {
      k.tube([[m(29), 49, 5], [m(21), 50, 4.2], [m(17), 46, 3.8]], 'obsidian', { part: 'arm' + s });
      k.ellipse(m(16), 43, 4.6, 4.2, 'obsidian', { part: 'arm' + s });
      k.tube([[m(27), 47, 0.6], [m(21), 47.5, 0.6]], null, { adj: 1, clip: 'arm' + s });
      k.tooth(m(13), 41, m(11), 35.5, 2.6, 'bone'); k.tooth(m(16.5), 40, m(16.5), 34, 2.6, 'bone'); k.tooth(m(20), 41, m(21.5), 35.5, 2.6, 'bone');
      k.px(m(14), 44, 'obsidian', 5); k.px(m(17), 44, 'obsidian', 5);
    });
    // horns + jagged cheek frills
    k.sym(C, function (m, s) {
      k.tube([[m(33), 21, 3.6], [m(26), 13, 2.6], [m(22), 5, 0.8]], 'bone', { part: 'horn' + s });
      k.px(m(29), 16, 'bone', 2); k.px(m(30), 17, 'bone', 2); k.px(m(25), 10, 'bone', 2); k.px(m(26), 11, 'bone', 2);
      k.spike(m(29), 29, m(19), 27, 6, 'obsidian', { part: 'fr' + s });
      k.spike(m(29), 33, m(20), 36, 5, 'obsidian', { part: 'fr' + s });
    });
    // head, snout, jaw
    k.ellipse(C, 26, 13.5, 11, 'obsidian', { part: 'head' });
    k.texture('head', 'scales', { size: 3, seed: 5 });
    k.ellipse(C, 40.5, 8.5, 4, 'obsidian', { part: 'jaw' });
    k.ellipse(C, 31, 10, 5, 'obsidian', { part: 'head' });
    k.px(36, 29, 'black', 0); k.px(37, 29, 'black', 0); k.px(43, 29, 'black', 0); k.px(44, 29, 'black', 0);
    k.px(36, 28, 'magma', 5); k.px(44, 28, 'magma', 5);
    // roaring maw
    k.mouth([[30, 33], [50, 33], [47, 41], [40, 43.5], [33, 41]], {});
    [32, 35.5, 39, 42.5, 46].forEach(function (tx) { k.tooth(tx + 1, 33, tx + 1.2, 36, 2.6, 'bone'); });
    k.tooth(34.5, 41.5, 34.5, 38.5, 2.4, 'bone'); k.tooth(45.5, 41.5, 45.5, 38.5, 2.4, 'bone');
    // brow ridges + glaring eyes
    k.eye(29, 21, { w: 7, h: 5, iris: 'thunder', side: 'L', angry: 2, brow: false });
    k.eye(44, 21, { w: 7, h: 5, iris: 'thunder', side: 'R', angry: 2, brow: false });
    k.sym(C, function (m, s) { k.tube([[m(28), 19, 1.8], [m(37), 22.5, 1.8]], 'obsidian', { part: 'brow' + s, light: 0.3 }); });
  };

  // 8 ミズチ — water SR: river dragon rising from its coils, clutching a pearl. Gag: goggle eyes + proud buck-fanged grin.
  P[8] = function (k) {
    k.shadow(C, 76.5, 26, 2.2);
    k.tube([[26, 65, 5], [40, 61, 5.5], [55, 64, 5], [60, 68, 4.8]], 'water', { part: 'coilB', shift: -1 });
    k.sym(C, function (m, s) {
      k.spike(m(33), 50, m(24), 43, 5, 'aqua', { part: 'fa' + s });
      k.spike(m(33), 58, m(25), 53, 5, 'aqua', { part: 'fb' + s });
    });
    // rising body with belly plates
    k.tube([[C, 65, 7], [39, 53, 7], [C, 42, 6.5]], 'water', { part: 'body' });
    k.texture('body', 'scales', { size: 4 });
    k.tube([[C, 66, 4], [39, 53, 4], [C, 43, 3.6]], 'cream', { clip: 'body' });
    for (var y = 45; y <= 66; y += 3) k.rect(35, y, 10, 1, 'cream', { adj: -2, clip: 'body' });
    // front coil + tail
    var coil = [[14, 54, 1.2], [12, 60, 2.2], [17, 66, 4], [26, 71, 6], [C, 72.5, 7], [55, 70, 6.5], [61, 65, 5.2], [58, 60, 4]];
    k.tube(coil, 'water', { part: 'coil' });
    k.texture('coil', 'scales', { size: 4, seed: 3 });
    k.tufts([[20, 64], [27, 66], [34, 67]], 'aqua', { part: 'cfinL', len: 4, w: 3, every: 3, seed: 21, behind: true });
    k.tufts([[46, 67], [53, 65], [58, 60]], 'aqua', { part: 'cfinR', len: 4, w: 3, every: 3, seed: 22, behind: true });
    k.tube([[18, 70, 0.6], [30, 75, 0.6], [44, 76, 0.6], [56, 72, 0.6]], null, { adj: -1, clip: 'coil' });
    k.tube(coil.map(function (p) { return [p[0], p[1] + p[2] * 0.45, Math.max(0.6, p[2] * 0.45)]; }), 'cream', { clip: 'coil' });
    k.spike(14, 55, 8, 45, 6, 'aqua', { part: 'tf1' });
    k.spike(15, 57, 21, 48, 5, 'aqua', { part: 'tf2' });
    // arms
    k.tube([[34, 49, 3.2], [27, 45, 2.8], [24, 40, 2.4]], 'water', { part: 'armL' });
    k.circle(21, 36, 5, 'crystal', { part: 'pearl', halo: 0.3 });
    k.sparkle(19, 34, 1, 'white');
    k.tooth(24, 41, 19.5, 41.5, 1.8, 'bone'); k.tooth(24.5, 38, 24, 32.5, 1.8, 'bone');
    k.tube([[47, 50, 3.2], [53, 56, 2.8], [54, 61, 2.4]], 'water', { part: 'armR' });
    k.tooth(52, 62, 51.5, 64.5, 1.6, 'bone'); k.tooth(55, 62, 55, 64.5, 1.6, 'bone');
    // mane, antlers, cheek fins
    k.sym(C, function (m, s) {
      k.tube([[m(32), 25, 4], [m(22), 23, 3.2], [m(14), 26, 2], [m(8), 23, 0.7]], 'aqua', { part: 'mane' + s });
      k.tube([[m(33), 31, 3.6], [m(25), 34, 2.4], [m(18), 40, 0.7]], 'aqua', { part: 'maneb' + s });
      k.tube([[m(30), 24.5, 1.1], [m(22), 24.5, 0.8], [m(15), 26, 0.4]], 'white', { clip: 'mane' + s, tone: 5 });
      k.tufts(s > 0 ? [[m(30), 28], [m(20), 27], [m(12), 29]] : [[m(12), 29], [m(20), 27], [m(30), 28]], 'aqua', { part: 'mane' + s, len: 3, w: 2.4, every: 3, seed: 8 });
      k.tube([[m(35), 17, 1.8], [m(30), 10, 1.3], [m(28), 4, 0.8]], 'gold', { part: 'horn' + s });
      k.tube([[m(32), 13, 1], [m(25), 12, 0.7]], 'gold', { part: 'horn' + s });
      k.spike(m(31), 28, m(23), 31, 5, 'aqua', { part: 'cf' + s });
    });
    // head, snout, jaw
    k.ellipse(C, 24, 11.5, 10, 'water', { part: 'head' });
    k.texture('head', 'scales', { size: 3, seed: 6 });
    k.ellipse(C, 33, 9, 5.5, 'water', { part: 'muzzle' });
    k.ellipse(C, 30, 5, 2.8, 'water', { part: 'nose', light: 0.25 });
    k.px(37, 30, 'black', 0); k.px(43, 30, 'black', 0);
    k.ellipse(C, 39.5, 7.5, 3, 'cream', { part: 'jaw' });
    k.tufts([[46, 41], [34, 41]], 'aqua', { part: 'beard', len: 4, w: 2.6, every: 3, seed: 4 });
    k.mouth([[32, 34.5], [48, 34.5], [46, 39], [40, 40.5], [34, 39]], {});
    k.tooth(36.5, 34.5, 36.7, 37.8, 2.4); k.tooth(43.5, 34.5, 43.3, 37.8, 2.4);
    k.sym(C, function (m, s) { k.tube([[m(32), 34.5, 0.9], [m(25), 38, 0.8], [m(19), 44, 0.7], [m(17), 50, 0.5]], 'gold', { part: 'wh' + s, shade: 'flat', flatTone: 5 }); });
    // goggle eyes (the one bulging-eye gag of the set)
    k.eye(29, 17, { style: 'bulge', w: 8, h: 8, pupil: 1, look: [1, 0] });
    k.eye(43, 17, { style: 'bulge', w: 8, h: 8, pupil: 1, look: [-1, 0] });
    k.line(28, 15, 36, 16, 'water', 1); k.line(44, 16, 52, 15, 'water', 1);
  };

  // 12 モリノヌシ — grass SR: old forest-lord stag. Gag: grumpy half-lidded glare, chewing a sprig, a chick nesting in his antlers.
  P[12] = function (k) {
    k.shadow(C, 76.5, 24, 2.4);
    // antler crown
    k.sym(C, function (m, s) {
      var A = { part: 'ant' + s };
      k.tube([[m(35), 22, 2.4], [m(29), 14, 2], [m(22), 8, 1.6], [m(15), 4, 1.1], [m(9), 3, 0.7]], 'wood', A);
      k.tube([[m(29), 14, 1.4], [m(31), 6, 1], [m(32), 2, 0.6]], 'wood', A);
      k.tube([[m(22), 8, 1.2], [m(22), 2, 0.7]], 'wood', A);
      k.tube([[m(25), 11, 1.2], [m(15), 12, 0.9], [m(10), 10, 0.6]], 'wood', A);
      k.tube([[m(15), 4, 1], [m(12), 0.5, 0.5]], 'wood', A);
      k.texture('ant' + s, 'bark', { size: 3 });
      k.leaf(m(9), 3, m(3), 5, 4, 'leaf', { part: 'l1' + s });
      k.leaf(m(10), 10, m(5), 14, 4, 'grass', { part: 'l2' + s });
      k.leaf(m(32), 2, m(35), 6, 3.5, 'grass', { part: 'l3' + s });
      k.leaf(m(22), 2, m(19), 0, 3, 'leaf', { part: 'l4' + s });
      k.tufts(s > 0 ? [[m(26), 12], [m(19), 13]] : [[m(19), 13], [m(26), 12]], 'grass', { part: 'moss' + s, len: 4, w: 2.2, every: 2, seed: 11 });
    });
    k.circle(29, 14, 1.6, 'sakura', { part: 'bl1' }); k.px(28, 13, 'white', 6);
    k.circle(59, 11, 1.5, 'sakura', { part: 'bl2' });
    // nest + chick
    k.ellipse(51, 13, 5, 2.6, 'wood', { part: 'nest' });
    k.texture('nest', 'bark', { size: 2 });
    k.circle(51, 9, 2.6, 'thunder', { part: 'chick' });
    k.px(50, 8, 'black', 0); k.px(48, 9, 'red', 4); k.px(47, 9, 'red', 3); k.px(52, 7, 'thunder', 6);
    // flank + hind legs (bent hocks), set wider and further back
    k.ellipse(C, 54, 16, 8, 'fur', { part: 'flank', shift: -1 });
    k.texture('flank', 'fur', { seed: 12 });
    k.sym(C, function (m, s) {
      k.tube([[m(27), 56, 3.4], [m(25), 63, 2.4], [m(26.5), 67, 1.9], [m(26), 72, 1.6]], 'fur', { part: 'hind' + s, shift: -1 });
      k.poly([[m(24), 71.5], [m(28), 71.5], [m(28.5), 75.5], [m(23.5), 75.5]], 'obsidian', { part: 'hh' + s });
      k.px(m(26), 74, 'obsidian', 0); k.px(m(26), 75, 'obsidian', 0);
    });
    // deep chest + slender front legs with knees and split hooves
    k.ellipse(C, 54, 10, 10, 'fur', { part: 'body' });
    k.ellipse(C, 58, 5.5, 5.5, 'tan', { clip: 'body' });
    k.tube([[33, 50, 0.6], [34, 58, 0.6], [36, 62, 0.6]], null, { adj: -1, clip: 'body' });
    k.tube([[47, 50, 0.6], [46, 58, 0.6], [44, 62, 0.6]], null, { adj: -2, clip: 'body' });
    k.texture('body', 'fur', { seed: 2 });
    k.sym(C, function (m, s) {
      k.tube([[m(36), 60, 3], [m(36), 64.5, 2.1], [m(35.6), 67, 2.3], [m(35.6), 72, 1.6]], 'fur', { part: 'leg' + s });
      k.px(m(35), 66, 'fur', 5);
      k.tube([[m(37.2), 60, 0.6], [m(37), 64, 0.5]], null, { adj: -2, clip: 'leg' + s });
      k.tufts(s > 0 ? [[m(33.5), 70], [m(37.5), 70]] : [[m(37.5), 70], [m(33.5), 70]], 'tan', { part: 'fet' + s, len: 2, w: 2, every: 1.5, seed: 5 });
      k.poly([[m(33.6), 71.5], [m(37.6), 71.5], [m(38.2), 75.5], [m(33), 75.5]], 'obsidian', { part: 'hoof' + s });
      k.px(m(35.6), 74, 'obsidian', 0); k.px(m(35.6), 75, 'obsidian', 0); k.px(m(34), 72, 'obsidian', 5);
    });
    // moss mantle with hanging fringe
    k.poly([[22, 46], [30, 42], [50, 42], [58, 46], [58, 51], [22, 51]], 'grass', { part: 'mantle' });
    k.tufts([[58, 50], [22, 50]], 'grass', { part: 'mantle', len: 5, w: 3, every: 2.5, seed: 12 });
    k.texture('mantle', 'fur', { seed: 5 });
    k.px(30, 45, 'white', 5); k.px(49, 46, 'sakura', 4); k.px(36, 44, 'sakura', 4);
    // neck ruff + shimenawa + shide
    k.ellipse(C, 44, 8, 7, 'fur', { part: 'neck' });
    k.tufts([[46, 48], [34, 48]], 'cream', { part: 'ruff', len: 5, w: 3, every: 2.5, seed: 3 });
    k.tube([[29, 46, 1.8], [C, 49.5, 2], [51, 46, 1.8]], 'tan', { part: 'rope' });
    for (var i = 30; i <= 50; i += 2) k.px(i, 47 + (Math.abs(i - C) < 7 ? 1.5 : 0), 'tan', 1);
    k.sym(C, function (m, s) { k.poly([[m(35), 48], [m(37), 48], [m(37), 51], [m(38.5), 51], [m(38.5), 55], [m(36.5), 55], [m(36.5), 52], [m(35), 52]], 'white', { part: 'shide' + s, shade: 'flat', flatTone: 5 }); });
    // ears
    k.sym(C, function (m, s) {
      k.leaf(m(31), 28, m(21), 25, 6, 'fur', { part: 'ear' + s });
      k.leaf(m(30), 27.5, m(23), 25.5, 2.4, 'skin', { clip: 'ear' + s, tone: 3 });
    });
    // head, muzzle, nose
    k.ellipse(C, 32, 9.5, 8.5, 'fur', { part: 'head' });
    k.texture('head', 'fur', { seed: 9 });
    k.ellipse(C, 40.5, 5, 5.5, 'tan', { part: 'muzzle' });
    k.ellipse(C, 44, 2.6, 1.7, 'black', { part: 'nose' });
    k.px(39, 43, 'black', 6); k.px(38, 44, 'black', 0); k.px(42, 44, 'black', 0);
    k.path([[36, 46], [38, 47], [42, 47], [44, 46]], 'fur', 0);
    k.tube([[44, 46, 0.5], [50, 44, 0.5]], 'leaf', { part: 'stem', shade: 'flat', flatTone: 2 });
    k.leaf(49, 44, 55, 41, 3, 'leaf', { part: 'sprig' });
    k.px(C, 26, 'cream', 5); k.px(39, 27, 'cream', 4); k.px(41, 27, 'cream', 4);
    // grumpy half-lidded glare under bushy white brows
    k.eye(33, 31, { w: 5, h: 4, iris: 'leaf', side: 'L', angry: 0.4, lid: 0.55, browMat: 'cream', browTone: 5 });
    k.eye(42, 31, { w: 5, h: 4, iris: 'leaf', side: 'R', angry: 0.4, lid: 0.55, browMat: 'cream', browTone: 5 });
    k.px(32, 28, 'cream', 4); k.px(48, 28, 'cream', 4);
  };

  // 17 カゲボウ — dark C: hooded shadow wraith. Gag: jiangshi talisman slapped on its hood, "boo!" claws, lolling tongue.
  P[17] = function (k) {
    k.shadow(C, 76.5, 12, 1.8);
    wisp(k, 8, 60, 0.9, 'w1'); wisp(k, 72, 58, 0.9, 'w2'); wisp(k, 66, 30, 0.7, 'w3');
    // floppy hood tip
    k.tube([[C, 32, 6.5], [34, 23, 4.2], [28, 19, 2.6], [24, 21, 1.6]], 'shadow', { part: 'cloak' });
    k.circle(22, 22, 2.8, 'violet', { part: 'bobble', halo: 0.25 });
    // cloak with ragged hem
    var hem = [[58, 67], [55, 64], [53, 72], [49, 65], [45, 74], [40, 66], [36, 74], [32, 65], [28, 72], [25, 64], [22, 67]];
    k.poly([[26, 44], [54, 44], [57, 56]].concat(hem).concat([[23, 56]]), 'shadow', { part: 'cloak' });
    k.ellipse(C, 42, 16, 14, 'shadow', { part: 'cloak' });
    k.poly(hem.concat(hem.slice().reverse().map(function (p) { return [p[0], p[1] - 3]; })), 'violet', { clip: 'cloak' });
    k.texture('cloak', 'cloth', { size: 3 });
    [[[33, 56], [32, 64], [31, 69]], [[47, 56], [48, 64], [49, 69]], [[40, 58], [40, 65]], [[50, 36], [53, 44]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 0.8]; }), null, { adj: -2, clip: 'cloak' });
      k.tube(f.map(function (p) { return [p[0] - 1.5, p[1], 0.5]; }), null, { adj: 1, clip: 'cloak' });
    });
    // stitches
    [[29, 52], [31, 53], [33, 52]].forEach(function (p) { k.px(p[0], p[1], 'violet', 4); });
    // hood rim + void
    k.ellipse(C, 45, 11.5, 10.5, 'violet', { part: 'rim' });
    k.ellipse(C, 45.5, 9.5, 8.5, 'black', { part: 'void', shade: 'flat', flatTone: 0, noseam: true });
    k.ellipse(C, 52, 6.5, 2.5, null, { set: 1, clip: 'void' });
    // glowing slanted eyes
    k.sym(C, function (m, s) { k.poly([[m(32), 40], [m(37.5), 41.5], [m(37.5), 44], [m(33), 43]], 'thunder', { part: 'eye' + s, shade: 'glow', halo: 0.35, outline: 'none' }); });
    k.px(34, 41, 'white', 6); k.px(45, 41, 'white', 6);
    // jagged grin + tongue
    k.poly([[31, 47], [49, 47], [47, 51.5], [C, 53.5], [33, 51.5]], 'thunder', { part: 'grin', shade: 'glow', halo: 0.3, outline: 'none' });
    k.path([[31, 48], [33, 50], [35, 48], [37, 51], [39, 48], [41, 51], [43, 48], [45, 51], [47, 48], [49, 49]], 'black', 0);
    k.tube([[43, 51.5, 1.8], [44, 55, 2.2], [43.5, 58, 1.6]], 'sakura', { part: 'tongue' });
    k.line(43.5, 53, 43.5, 57, 'sakura', 2);
    // talisman
    k.poly([[35.5, 24], [44, 25], [43, 38], [34.5, 37]], 'cream', { part: 'fuda', light: 0.2 });
    k.line(39.5, 26, 39, 35, 'red', 3); k.line(37, 28, 42, 28.5, 'red', 3); k.line(37, 31, 42, 31.5, 'red', 3); k.px(37, 34, 'red', 3); k.px(41, 35, 'red', 3);
    k.px(35, 25, 'cream', 1); k.px(44, 37, 'cream', 1);
    // "boo!" claw hands
    k.sym(C, function (m, s) {
      k.tube([[m(28), 52, 4.5], [m(21), 50, 4]], 'shadow', { part: 'sl' + s });
      k.ellipse(m(20), 50, 2.4, 4.4, 'violet', { part: 'cuff' + s });
      k.ellipse(m(15), 48, 4, 3.8, 'dark', { part: 'hand' + s });
      k.tube([[m(12.5), 46, 1.4], [m(11), 41, 0.9], [m(12), 37.5, 0.4]], 'violet', { part: 'ca' + s });
      k.tube([[m(16), 45, 1.4], [m(17), 40, 0.9], [m(19), 37, 0.4]], 'violet', { part: 'cb' + s });
      k.tube([[m(11.5), 49, 1.3], [m(7), 47, 0.8], [m(6), 44, 0.4]], 'violet', { part: 'cc' + s });
      k.px(m(14), 47, 'dark', 5); k.px(m(16), 47, 'dark', 5);
    });
    k.rect(64, 46, 2, 5, 'cream', { clip: 'hand-1', tone: 5 }); k.px(64, 48, 'red', 3);
  };

  // 22 ホシウサ — light C: star rabbit with a crystal crest. Gag: one ear flopped over, giant buck teeth, fighting bandana.
  P[22] = function (k) {
    k.shadow(C, 76.5, 15, 2);
    k.star(55, 60, 6, 'gold', { part: 'tail', halo: 0.2 });
    // body, feet, arms
    k.ellipse(C, 64, 11, 10, 'white', { part: 'body' });
    k.texture('body', 'fur', { seed: 7 });
    k.sym(C, function (m, s) {
      k.ellipse(m(33), 74, 6, 2.8, 'white', { part: 'foot' + s });
      k.px(m(29), 74, 'white', 2); k.px(m(31), 75, 'white', 2);
      k.ellipse(m(30), 62, 3, 4, 'white', { part: 'arm' + s });
      k.px(m(29), 65, 'white', 2); k.px(m(31), 65, 'white', 2);
    });
    // ears
    k.leaf(35, 42, 30, 14, 9, 'white', { part: 'earL' });
    k.leaf(34.5, 40, 31, 19, 3.5, 'sakura', { clip: 'earL', tone: 3 });
    k.tube([[46, 41, 4], [49, 31, 4], [53, 26, 3.5], [59, 27, 2.8], [63, 32, 1.6]], 'white', { part: 'earR' });
    k.tube([[47, 39, 1.5], [49.5, 31, 1.5], [53, 28, 1.2]], 'sakura', { clip: 'earR', tone: 3 });
    k.line(63, 33, 63, 35, 'gold', 3);
    k.star(63, 38, 3.4, 'gold', { part: 'dstar', halo: 0.2 });
    // head, puffed cheeks
    k.ellipse(C, 49, 13.5, 11.5, 'white', { part: 'head' });
    k.sym(C, function (m) { k.ellipse(m(30), 53, 5, 4.2, 'white', { part: 'head' }); });
    k.tufts([[28, 50], [25, 55], [28, 59]], 'white', { part: 'head', len: 3, w: 3, every: 2.5, seed: 3 });
    k.tufts([[52, 59], [55, 55], [52, 50]], 'white', { part: 'head', len: 3, w: 3, every: 2.5, seed: 4 });
    k.texture('head', 'fur', { seed: 8 });
    // crystal crest
    k.poly([[34, 40], [33, 35], [30, 32], [33, 31], [35.5, 35], [36, 40]], 'crystal', { part: 'shL', shade: 'flat', flatTone: 3, halo: 0.2 });
    k.poly([[44, 40], [44.5, 35], [47, 31], [50, 32], [46, 35.5], [46, 40]], 'crystal', { part: 'shR', shade: 'flat', flatTone: 3, halo: 0.2 });
    k.poly([[36, 40], [36, 32], [C, 23], [44, 32], [44, 40]], 'crystal', { part: 'horn', halo: 0.3, shade: 'flat', flatTone: 5 });
    k.poly([[C, 23], [44, 32], [44, 40], [C, 40]], null, { set: 3, clip: 'horn' });
    k.poly([[36, 32], [C, 23], [38, 32]], null, { set: 6, clip: 'horn' });
    k.line(C, 32, C, 39, 'crystal', 2);
    k.sparkle(C, 21, 2, 'white');
    // fighting bandana with a star pin
    k.poly([[28, 58], [52, 58], [49, 62], [C, 63.5], [31, 62]], 'red', { part: 'scarf' });
    k.spike(43, 61, 47, 68, 5, 'red', { part: 'knot' });
    k.px(C, 60, 'gold', 6); k.px(39, 61, 'gold', 4); k.px(41, 61, 'gold', 4); k.px(C, 62, 'gold', 3);
    // face: nose, mouth, buck teeth
    k.poly([[38.5, 51], [41.5, 51], [C, 53]], 'skin', { part: 'nose', tone: 3 });
    k.px(39, 51, 'skin', 5);
    k.path([[35, 54], [37, 55], [C, 54], [43, 55], [45, 54]], 'black', 0);
    k.rect(37, 55, 6, 6, 'white', { part: 'teeth', shade: 'flat', flatTone: 6 });
    k.line(C, 55, C, 60, 'black', 0); k.line(37, 60, 42, 60, 'white', 3); k.px(42, 56, 'white', 4); k.px(42, 57, 'white', 4);
    // determined glare
    k.eye(31, 45, { w: 5, h: 4, iris: 'violet', side: 'L', angry: 1.2 });
    k.eye(44, 45, { w: 5, h: 4, iris: 'violet', side: 'R', angry: 1.2 });
    k.sym(C, function (m) { k.rect(m(29), 55, 3, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' }); });
    k.sparkle(12, 36, 1, 'light'); k.sparkle(68, 44, 1, 'light');
  };
})();
