/* 封札モンスターズ — monster sprites, set 1 (style reference, 96x96). Requires pixkit.js. */
(function () {
  'use strict';
  var P = window.PIXMON = window.PIXMON || {};

  // 1 ヒノコロ — fire C: chunky fox pup, bonfire tail, cheeky fanged grin
  P[1] = function (k) {
    k.shadow(52, 89.5, 27, 2.6);
    // bonfire tail
    k.tube([[64, 78, 5], [72, 74, 6], [78, 67, 6.5]], 'fire', { part: 'tailbase' });
    k.tube([[78, 69, 9], [82, 57, 10.5], [80, 44, 8], [74, 33, 3]], 'flame', { part: 'flame', shade: 'glow', halo: 0.3, outline: 'soft' });
    k.spike(86, 53, 93, 38, 7, 'flame', { part: 'flame' });
    k.spike(74, 49, 66, 36, 7, 'flame', { part: 'flame' });
    k.spike(84, 45, 87, 29, 5, 'flame', { part: 'flame' });
    // far legs
    k.tube([[38, 74, 4], [37, 86, 3.8]], 'fire', { part: 'lfF', shift: -1 });
    k.ellipse(36.5, 87, 4.8, 2.6, 'black', { part: 'lfF' });
    k.tube([[61, 78, 4.2], [62, 86, 4]], 'fire', { part: 'lbF', shift: -1 });
    k.ellipse(62, 87, 5, 2.6, 'black', { part: 'lbF' });
    // body
    k.ellipse(55, 74, 16, 11, 'fire', { part: 'body' });
    // near haunch + legs
    k.ellipse(67, 76, 8, 8.5, 'fire', { part: 'haunch' });
    k.tube([[69, 80, 4.5], [69, 86, 4.2]], 'fire', { part: 'haunch' });
    k.ellipse(68, 87.2, 5.6, 2.8, 'black', { part: 'pawB' });
    k.tube([[46, 73, 5], [45, 86, 4.6]], 'fire', { part: 'legF' });
    k.ellipse(44.5, 87.2, 6, 3, 'black', { part: 'pawF' });
    k.px(41, 87, 'black', 3); k.px(44, 87, 'black', 3);
    // far ear
    k.spike(27, 47, 19, 28, 13, 'fire', { part: 'earF', shift: -1 });
    k.spike(26.5, 45, 21, 33, 6, 'magma', { clip: 'earF', tone: 1 });
    // head
    k.ellipse(38, 56, 18, 15, 'fire', { part: 'head' });
    k.spike(53, 62, 63, 66, 8, 'fire', { part: 'head' });
    k.spike(50, 67, 58, 73, 7, 'fire', { part: 'head' });
    // near ear
    k.spike(49, 45, 57, 24, 15, 'fire', { part: 'earN' });
    k.spike(49.5, 44, 55, 30, 7, 'magma', { clip: 'earN', tone: 1 });
    k.spike(48, 44, 50, 36, 4, 'cream', { clip: 'earN', tone: 3 });
    // forehead flame tuft
    k.spike(38, 44, 33, 31, 8, 'flame', { part: 'tuft', shade: 'glow', halo: 0.3, outline: 'soft' });
    k.spike(43, 44, 45, 35, 6, 'flame', { part: 'tuft' });
    // snout: orange bridge, cream underside, black nose tip
    k.tube([[32, 61, 5], [21, 63, 3]], 'fire', { part: 'snout' });
    k.tube([[32, 64, 3.6], [22, 64.5, 2.2]], 'cream', { clip: 'snout' });
    k.ellipse(18.5, 62, 2.6, 2.2, 'black', { part: 'nose', hi: false });
    k.px(17, 61, 'black', 4);
    // cheeky lopsided grin with fangs
    k.mouth([[21, 66], [36, 64], [34, 70], [26, 70.5]], {});
    k.tooth(25, 66, 25.3, 68.5, 2.6);
    k.tooth(32.5, 64.6, 32.2, 67.5, 2.6);
    k.path([[36, 64], [39, 61]], 'fire', 0);
    // eyes + brows
    k.eye(35, 45, { w: 10, h: 11, iris: 'gold', mood: 'cool', brow: true, browMat: 'fire' });
    k.eye(23, 47, { w: 6, h: 10, iris: 'gold', mood: 'cool', far: true });
    // blush embers
    k.px(46, 60, 'flame', 3); k.px(48, 59, 'flame', 3); k.px(47, 61, 'flame', 2);
  };

  // 4 ホムラドラ — fire SR: obsidian dragon with magma cracks, heavy brow, toothy jaw, wings up
  P[4] = function (k) {
    k.shadow(52, 90, 34, 3);
    // far wing
    k.poly([[50, 46], [56, 12], [66, 21], [78, 13], [92, 21], [92, 37], [80, 45], [64, 51]], 'fire', { part: 'wingF', shift: -1, flat: true });
    k.tube([[50, 46, 2.2], [56, 12, 1.5]], 'obsidian', { part: 'wingFb' });
    k.tube([[56, 12, 1.5], [66, 21, 1.2], [78, 13, 1.2], [92, 21, 0.9]], 'obsidian', { part: 'wingFb' });
    // tail
    k.tube([[64, 80, 9], [76, 84, 7], [86, 80, 5], [92, 70, 2.5]], 'obsidian', { part: 'tail' });
    k.spike(92, 72, 94, 58, 7, 'flame', { shade: 'glow', halo: 0.3, outline: 'soft' });
    k.path([[70, 82], [75, 84], [80, 83], [85, 79]], 'magma', 3);
    // far leg + foot
    k.tube([[40, 74, 6], [36, 84, 5.5]], 'obsidian', { part: 'legF', shift: -1 });
    k.ellipse(33, 86.5, 10, 4, 'obsidian', { part: 'legF', shift: -1 });
    // torso with molten belly plates
    k.ellipse(52, 64, 21, 20, 'obsidian', { part: 'body' });
    k.ellipse(44, 69, 12, 16, 'fire', { clip: 'body' });
    for (var y = 58; y <= 82; y += 5) k.rect(30, y, 30, 1, 'fire', { adj: -2, clip: 'body' });
    // near wing
    k.poly([[58, 49], [68, 8], [78, 21], [88, 13], [95, 25], [94, 43], [84, 51], [70, 57]], 'fire', { part: 'wingN', flat: true });
    k.tube([[58, 51, 2.4], [68, 8, 1.6]], 'obsidian', { part: 'wingNb' });
    k.tube([[68, 8, 1.6], [78, 21, 1.3], [88, 13, 1.2], [95, 25, 0.9]], 'obsidian', { part: 'wingNb' });
    k.tube([[70, 16, 0.8], [84, 32, 0.8], [88, 44, 0.8]], null, { adj: -1, clip: 'wingN' });
    k.tube([[66, 28, 0.8], [76, 44, 0.8]], null, { adj: -1, clip: 'wingN' });
    // near leg
    k.ellipse(63, 75, 12, 12, 'obsidian', { part: 'thigh' });
    k.tube([[63, 81, 7], [58, 86, 6]], 'obsidian', { part: 'thigh' });
    k.ellipse(54, 87, 12, 4, 'obsidian', { part: 'foot' });
    k.spike(44, 87, 40, 89.5, 3.5, 'bone', { part: 'cl1' });
    k.spike(49, 88, 46, 90.5, 3.5, 'bone', { part: 'cl2' });
    k.spike(54, 88.5, 52, 91, 3.5, 'bone', { part: 'cl3' });
    // magma cracks
    k.path([[58, 58], [62, 63], [60, 68], [65, 72], [68, 76]], 'magma', 3);
    k.px(62, 63, 'magma', 4); k.path([[60, 68], [55, 71]], 'magma', 2);
    k.path([[70, 66], [67, 71], [69, 76], [66, 80]], 'magma', 3);
    // arm
    k.tube([[44, 56, 6.5], [36, 64, 5.5], [31, 68, 5]], 'obsidian', { part: 'arm' });
    k.ellipse(28, 69, 6, 5, 'obsidian', { part: 'arm' });
    k.spike(24, 67, 20, 65, 3, 'bone', { part: 'ac1' });
    k.spike(24, 71, 20, 72, 3, 'bone', { part: 'ac2' });
    // neck
    k.tube([[50, 52, 10], [42, 40, 9]], 'obsidian', { part: 'neck' });
    k.path([[48, 50], [45, 45], [47, 41], [44, 37]], 'magma', 3); k.px(45, 45, 'magma', 4);
    // horns
    k.tube([[44, 24, 4], [54, 14, 3], [62, 6, 1]], 'bone', { part: 'hornF', shift: -1 });
    k.tube([[48, 28, 4.5], [60, 21, 3], [71, 17, 1]], 'bone', { part: 'hornN' });
    // cheek frills
    k.spike(46, 38, 58, 40, 7, 'obsidian', { part: 'frill' });
    k.spike(44, 44, 54, 51, 6, 'obsidian', { part: 'frill2' });
    // head
    k.ellipse(36, 32, 15, 13, 'obsidian', { part: 'head' });
    k.poly([[26, 25], [10, 29], [5, 35], [7, 40], [31, 40], [36, 33]], 'obsidian', { part: 'head' });
    k.poly([[8, 44], [31, 43], [36, 48], [27, 53], [14, 51]], 'obsidian', { part: 'jaw' });
    k.poly([[12, 47], [30, 46], [30, 50], [16, 50]], 'fire', { clip: 'jaw' });
    k.mouth([[7, 40], [32, 40], [31, 44.5], [9, 45]], { tongue: true });
    [11, 16, 21, 26].forEach(function (tx) { k.tooth(tx, 40, tx + 0.3, 43, 3.2); });
    k.tooth(14, 45, 14, 42, 3); k.tooth(28, 44.5, 28, 41.5, 3);
    // brow ridge over a fierce eye
    k.eye(28, 26, { w: 10, h: 9, iris: 'thunder', mood: 'fierce' });
    k.eye(15, 28, { w: 5, h: 8, iris: 'thunder', mood: 'fierce', far: true });
    k.tube([[14, 26, 2], [28, 23, 3], [42, 22, 2.8]], 'obsidian', { part: 'brow', light: 0.3 });
    k.px(9, 33, 'black', 0); k.px(10, 33, 'black', 0); k.px(10, 32, 'magma', 3);
    k.path([[38, 36], [41, 38], [44, 37]], 'magma', 3);
    k.sparkle(6, 22, 1, 'flame');
  };

  // 8 ミズチ — water SR: river dragon, long snout, lip whiskers, flowing mane, clutching a pearl
  P[8] = function (k) {
    k.shadow(50, 90, 34, 2.6);
    // dorsal fins behind the coil
    [[64, 43], [75, 50], [83, 62], [84, 75]].forEach(function (f, i) { k.spike(f[0] - 3, f[1] + 5, f[0] + 5, f[1] - 4, 8, 'aqua', { part: 'fin' + i }); });
    // coil + tail
    var coil = [[60, 50, 9], [74, 58, 9], [78, 72, 8.5], [66, 82, 8], [48, 84, 7], [32, 83, 6], [20, 79, 4], [14, 72, 2.4], [14, 66, 1.2]];
    k.tube(coil, 'water', { part: 'coil' });
    k.tube(coil.map(function (p) { return [p[0] - 1, p[1] + p[2] * 0.45, Math.max(0.6, p[2] * 0.5)]; }), 'cream', { clip: 'coil' });
    k.spike(14, 67, 8, 55, 8, 'aqua', { part: 'tailfin' });
    k.spike(15, 69, 23, 58, 7, 'aqua', { part: 'tailfin2' });
    // mane strands
    k.tube([[40, 18, 5], [52, 14, 4], [62, 16, 2.4], [71, 11, 0.8]], 'aqua', { part: 'mane1' });
    k.tube([[44, 26, 5], [56, 27, 4], [66, 31, 2], [75, 29, 0.8]], 'aqua', { part: 'mane2' });
    k.tube([[46, 34, 4.5], [56, 39, 3], [64, 45, 0.8]], 'aqua', { part: 'mane3' });
    k.tube([[42, 19, 1.4], [53, 17, 1], [62, 18, 0.5]], 'white', { clip: 'mane1', tone: 4 });
    k.tube([[46, 27, 1.4], [57, 29, 1], [66, 32, 0.5]], 'white', { clip: 'mane2', tone: 4 });
    // neck
    k.tube([[40, 36, 8], [48, 44, 9], [60, 50, 9]], 'water', { part: 'neck' });
    k.tube([[37, 41, 4], [45, 50, 4.5], [57, 56, 4]], 'cream', { clip: 'neck' });
    for (var i = 0; i < 4; i++) k.rect(38 + i * 5, 44 + i * 3, 5, 1, 'cream', { adj: -1, clip: 'neck' });
    // arm + pearl
    k.tube([[46, 48, 4.5], [36, 56, 3.8], [29, 58, 3.4]], 'water', { part: 'arm' });
    k.circle(22, 60, 7, 'crystal', { part: 'pearl', halo: 0.35 });
    k.sparkle(19, 57, 1, 'white');
    k.tube([[30, 55, 1.6], [26, 53, 1.1], [24, 53.5, 0.6]], 'bone', { part: 'cl1' });
    k.tube([[30, 61, 1.6], [27, 65, 1.1], [25, 65.5, 0.6]], 'bone', { part: 'cl2' });
    k.tube([[29, 58, 1.4], [26, 59, 0.8]], 'bone', { part: 'cl3' });
    // antlers
    k.tube([[34, 14, 2], [33, 6, 1.4], [36, 2, 0.8]], 'gold', { part: 'hornF', shift: -1 });
    k.tube([[40, 14, 2.4], [46, 6, 1.8], [48, 1.5, 1]], 'gold', { part: 'horn' });
    k.tube([[45, 8, 1.4], [53, 6, 1]], 'gold', { part: 'horn' });
    // cheek fin
    k.spike(46, 30, 57, 34, 7, 'aqua', { part: 'cfin' });
    // head: cranium + long snout with a distinct nose bulb, pale lower jaw
    k.ellipse(36, 24, 14, 12, 'water', { part: 'head' });
    k.poly([[28, 17], [10, 21], [5, 26], [6, 31], [31, 32], [34, 26]], 'water', { part: 'head' });
    k.ellipse(8.5, 26, 4.8, 4.2, 'water', { part: 'nose' });
    k.px(5, 25, 'black', 0); k.px(6, 25, 'black', 0);
    k.poly([[8, 35], [31, 35], [35, 40], [26, 43], [13, 41]], 'cream', { part: 'jaw' });
    k.mouth([[7, 31], [32, 31], [31, 35], [8, 35.5]], { tongue: false });
    k.tooth(12, 31, 12.3, 34, 3); k.tooth(25, 31, 25.3, 34, 3); k.tooth(17, 35.5, 17, 33, 2.4);
    // whiskers growing from the upper lip
    k.tube([[8, 31, 1.1], [3, 37, 1], [1, 45, 0.8], [4, 53, 0.6]], 'gold', { part: 'wh1', shade: 'flat', flatTone: 3 });
    k.tube([[11, 22, 1.1], [7, 16, 1], [7, 9, 0.8], [11, 4, 0.6]], 'gold', { part: 'wh2', shade: 'flat', flatTone: 3 });
    // eyes
    k.eye(28, 18, { w: 10, h: 8, iris: 'gold', mood: 'cool', brow: true, browMat: 'water' });
    k.eye(17, 21, { w: 5, h: 7, iris: 'gold', mood: 'cool', far: true });
    k.tube([[24, 16, 1.2], [36, 14, 1.4]], null, { adj: 1, clip: 'head' });
  };

  // 12 モリノヌシ — grass SR: forest lord stag, branch antlers in leaf, moss mantle, shrine rope
  P[12] = function (k) {
    k.shadow(52, 90, 34, 3);
    // far legs
    k.tube([[33, 70, 5], [32, 86, 4.4]], 'fur', { part: 'lf', shift: -1 });
    k.rect(28, 85, 8, 4, 'obsidian', { part: 'lf' });
    k.tube([[70, 70, 5.5], [72, 86, 4.4]], 'fur', { part: 'lb', shift: -1 });
    k.rect(68, 85, 8, 4, 'obsidian', { part: 'lb' });
    // body
    k.ellipse(54, 64, 24, 15, 'fur', { part: 'body' });
    k.ellipse(52, 75, 19, 5, 'tan', { clip: 'body' });
    k.leaf(56, 68, 67, 63, 4, 'leaf', { clip: 'body', tone: 4 });
    k.leaf(50, 70, 57, 66, 3, 'leaf', { clip: 'body', tone: 4 });
    // near legs
    k.ellipse(70, 66, 10, 11, 'fur', { part: 'haunch' });
    k.tube([[71, 74, 6], [75, 80, 5], [73, 86, 4.4]], 'fur', { part: 'haunch' });
    k.rect(68, 85, 10, 5, 'obsidian', { part: 'hoofH' });
    k.tube([[38, 66, 6.5], [39, 76, 5.2], [38, 86, 4.6]], 'fur', { part: 'legF' });
    k.rect(33, 85, 10, 5, 'obsidian', { part: 'hoofF' });
    // moss mantle
    k.poly([[30, 48], [48, 46], [66, 49], [80, 55], [78, 62], [70, 58], [64, 62], [57, 58], [50, 63], [43, 59], [36, 64]], 'grass', { part: 'mantle' });
    [[36, 64], [50, 63], [64, 62], [78, 62]].forEach(function (d, i) { k.spike(d[0], d[1] - 3, d[0] - 1, d[1] + 4, 4, 'grass', { part: 'drip' + i }); });
    k.circle(44, 51, 1.5, 'sakura', { part: 'f1' }); k.circle(62, 52, 1.5, 'white', { part: 'f2' }); k.circle(72, 56, 1.4, 'sakura', { part: 'f3' });
    // neck + chest ruff
    k.tube([[40, 60, 9], [30, 46, 7.5]], 'fur', { part: 'neck' });
    // shimenawa rope + shide
    k.tube([[22, 52, 2.2], [32, 56, 2.5], [42, 56, 2.2]], 'tan', { part: 'rope' });
    for (var i = 22; i <= 42; i += 3) k.px(i, 55 - (i > 30 ? 0 : 1), 'tan', 1);
    k.poly([[27, 57], [32, 57], [30, 61], [34, 61], [32, 66], [28, 66], [29, 62], [26, 62]], 'white', { part: 'shide', shade: 'flat', flatTone: 3 });
    k.path([[30, 58], [28, 61]], 'white', 1); k.path([[32, 62], [30, 65]], 'white', 1);
    // ears
    k.leaf(18, 37, 8, 31, 6, 'fur', { part: 'earF', shift: -1 });
    k.leaf(34, 36, 48, 32, 7, 'fur', { part: 'earN' });
    k.leaf(36, 35, 45, 33, 3, 'skin', { clip: 'earN', tone: 2 });
    // antlers
    var A = 'wood';
    k.tube([[22, 28, 2.4], [16, 18, 2], [10, 10, 1.4], [6, 4, 0.9]], A, { part: 'antF', shift: -1 });
    k.tube([[16, 19, 1.5], [7, 18, 1]], A, { part: 'antF' });
    k.tube([[30, 28, 2.8], [36, 18, 2.4], [42, 9, 1.8], [48, 3, 1.1]], A, { part: 'antN' });
    k.tube([[35, 20, 1.8], [28, 12, 1.4], [25, 5, 1]], A, { part: 'antN' });
    k.tube([[40, 12, 1.6], [52, 11, 1.2], [58, 6, 0.8]], A, { part: 'antN' });
    k.leaf(48, 3, 56, 1, 5, 'leaf', { part: 'lv1' });
    k.leaf(25, 5, 19, 2, 4.5, 'leaf', { part: 'lv2' });
    k.leaf(58, 6, 64, 10, 4.5, 'grass', { part: 'lv3' });
    k.leaf(6, 4, 1, 8, 4, 'grass', { part: 'lv4' });
    k.leaf(7, 18, 2, 21, 4, 'leaf', { part: 'lv5' });
    k.circle(36, 18, 2, 'sakura', { part: 'bl1' }); k.px(35, 17, 'white', 4);
    k.circle(12, 11, 1.8, 'sakura', { part: 'bl2' });
    // head + muzzle
    k.ellipse(26, 40, 12, 11, 'fur', { part: 'head' });
    k.tube([[24, 46, 7], [14, 49, 5.2]], 'tan', { part: 'muzzle' });
    k.ellipse(10.5, 48.5, 3.2, 2.5, 'black', { part: 'nose', hi: false });
    k.px(9, 47, 'black', 4);
    k.path([[11, 52], [16, 53], [21, 52]], 'fur', 0);
    k.eye(24, 34, { w: 9, h: 9, iris: 'grass', mood: 'cool', brow: true, browMat: 'fur' });
    k.eye(14, 36, { w: 5, h: 8, iris: 'grass', mood: 'cool', far: true });
    k.px(22, 31, 'cream', 4); k.px(23, 30, 'cream', 3); k.px(21, 30, 'cream', 3);
  };

  // 17 カゲボウ — dark C: hooded shadow wraith, glowing eyes and jagged grin, talisman on the hood
  P[17] = function (k) {
    k.shadow(46, 90.5, 16, 2);
    function wisp(cx, cy, s, id) {
      var o = { part: id, shade: 'glow', halo: 0.3, outline: 'soft' };
      k.tube([[cx, cy, 3.4 * s], [cx + 0.6 * s, cy - 4 * s, 2.3 * s], [cx - 1.2 * s, cy - 9 * s, 0.6]], 'violet', o);
      k.spike(cx + 2 * s, cy - 3 * s, cx + 4.5 * s, cy - 7.5 * s, 2.4 * s, 'violet', o);
    }
    wisp(82, 44, 1.3, 'w1'); wisp(12, 38, 1.1, 'w2'); wisp(86, 70, 0.8, 'w3');
    // back hand
    k.ellipse(74, 66, 4.5, 4, 'shadow', { part: 'bh', shift: -1 });
    k.tube([[77, 64, 1.2], [80, 60, 0.6]], 'violet', { part: 'bhc' });
    // cloak body with tattered hem
    var hem = [[74, 84], [70, 80], [66, 89], [61, 80], [55, 90], [49, 81], [43, 89], [37, 80], [31, 87], [29, 79], [24, 84]];
    k.poly([[28, 56], [66, 56], [72, 68]].concat(hem).concat([[25, 72], [22, 67]]), 'shadow', { part: 'cloak' });
    // hood
    k.ellipse(48, 54, 20, 18, 'shadow', { part: 'cloak' });
    k.tube([[44, 40, 9], [36, 31, 6], [29, 26, 3.5], [25, 27, 2]], 'shadow', { part: 'cloak' });
    k.circle(23, 28, 3.3, 'violet', { part: 'bobble', halo: 0.3 });
    // hem trim (tattered violet band)
    k.poly(hem.concat(hem.slice().reverse().map(function (p) { return [p[0], p[1] - 4]; })), 'violet', { clip: 'cloak' });
    // cloth folds: shadow grooves with a lit edge on their left
    [[[58, 64], [60, 76], [58, 86]], [[46, 70], [46, 80], [44, 87]], [[34, 68], [33, 78], [31, 84]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 1]; }), null, { adj: -1, clip: 'cloak' });
      k.tube(f.map(function (p) { return [p[0] - 2, p[1], 0.6]; }), null, { adj: 1, clip: 'cloak' });
    });
    k.tube([[62, 42, 1], [66, 52, 1]], null, { adj: -1, clip: 'cloak' });
    // hood rim + void face
    k.ellipse(42, 55, 14.5, 14, 'violet', { part: 'rim' });
    k.ellipse(41.5, 55.5, 12, 11.5, 'black', { part: 'void', shade: 'flat', flatTone: 0, noseam: true });
    k.ellipse(41.5, 64, 8, 3, null, { set: 1, clip: 'void' });
    // glowing eyes
    k.poly([[32, 47], [37, 45], [40, 49], [38, 54], [33, 53]], 'thunder', { part: 'eyeL', shade: 'glow', halo: 0.35, outline: 'none' });
    k.poly([[44, 49], [47, 45], [52, 47], [51, 53], [46, 54]], 'thunder', { part: 'eyeR', shade: 'glow', halo: 0.35, outline: 'none' });
    k.px(35, 48, 'white', 4); k.px(36, 48, 'white', 4); k.px(47, 48, 'white', 4); k.px(48, 48, 'white', 4);
    // jagged glowing grin
    k.poly([[31, 57], [52, 57], [49, 62], [42, 65], [35, 62]], 'thunder', { part: 'grin', shade: 'glow', halo: 0.3, outline: 'none' });
    k.path([[31, 58], [33, 60], [35, 58], [37, 61], [39, 58], [41, 61], [43, 58], [45, 61], [47, 58], [49, 60], [51, 58]], 'black', 0);
    // talisman on the hood
    k.poly([[58, 33], [65, 34], [64, 47], [57, 46]], 'cream', { part: 'fuda', light: 0.2 });
    k.line(61, 36, 60, 43, 'red', 2); k.line(59, 38, 62, 38, 'red', 2); k.px(59, 41, 'red', 2); k.px(62, 42, 'red', 2);
    // front claw hand: sleeve, cuff, bandage talisman, three hooked claws
    k.tube([[32, 62, 5.5], [23, 67, 5]], 'shadow', { part: 'sleeve' });
    k.ellipse(22, 67, 3, 5.5, 'violet', { part: 'cuff' });
    k.ellipse(16, 67, 5, 4.5, 'dark', { part: 'hand' });
    k.rect(15, 64, 3, 6, 'cream', { clip: 'hand', tone: 3 });
    k.px(16, 66, 'red', 2);
    k.tube([[13, 64, 1.7], [9, 60, 1.1], [8, 56, 0.5]], 'violet', { part: 'c1' });
    k.tube([[12, 67, 1.7], [7, 66, 1.1], [5, 63, 0.5]], 'violet', { part: 'c2' });
    k.tube([[13, 70, 1.6], [9, 72, 1], [7, 71, 0.5]], 'violet', { part: 'c3' });
  };

  // 22 ホシウサ — light C: star rabbit, crystal horn, buck-toothed grin, star tail
  P[22] = function (k) {
    k.shadow(52, 89.5, 23, 2.6);
    // far ear + far foot
    k.leaf(38, 50, 29, 26, 11, 'white', { part: 'earF', shift: -1 });
    k.leaf(37, 48, 31, 31, 4, 'sakura', { clip: 'earF', tone: 1 });
    k.ellipse(63, 87.5, 7.5, 3, 'white', { part: 'footF', shift: -1 });
    // star tail
    k.star(76, 64, 9, 'gold', { part: 'tail', halo: 0.3 });
    k.ellipse(71, 70, 5, 5, 'white', { part: 'fluff' });
    // body
    k.ellipse(57, 75, 16, 12.5, 'white', { part: 'body' });
    k.star(62, 72, 3.5, 'gold', { clip: 'body', tone: 3 });
    // near foot
    k.ellipse(45, 87, 10, 3.6, 'white', { part: 'foot' });
    k.line(37, 88, 37, 89, 'white', 1); k.line(40, 88, 40, 89, 'white', 1);
    // head
    k.ellipse(38, 60, 17, 15, 'white', { part: 'head' });
    k.spike(52, 66, 61, 70, 7, 'white', { part: 'head' });
    // near ear (swept back) + star tip
    k.leaf(47, 48, 66, 24, 12, 'white', { part: 'earN' });
    k.leaf(48, 45, 62, 28, 5, 'sakura', { clip: 'earN', tone: 2 });
    k.star(66.5, 23.5, 5, 'gold', { part: 'eartip', halo: 0.3 });
    // crystal horn
    // crystal shard cluster growing from the forehead
    k.poly([[27, 45], [26, 38], [22, 33], [25, 32], [29, 37], [31, 45]], 'crystal', { part: 'hornS', halo: 0.25, shade: 'flat', flatTone: 2 });
    k.poly([[30, 46], [30, 36], [28, 28], [33, 20], [38, 29], [39, 38], [38, 46]], 'crystal', { part: 'horn', halo: 0.3, shade: 'flat', flatTone: 3 });
    k.poly([[33, 20], [38, 29], [39, 38], [38, 46], [34, 46], [34, 30]], null, { set: 2, clip: 'horn' });
    k.poly([[30, 36], [28, 28], [33, 20], [31, 30]], null, { set: 4, clip: 'horn' });
    k.line(34, 30, 34, 45, 'crystal', 1);
    k.sparkle(33, 18, 2, 'white');
    // front paws
    k.ellipse(32, 73, 5, 4, 'white', { part: 'paw1' });
    k.ellipse(41, 74, 4.6, 3.8, 'white', { part: 'paw2' });
    // face: little snout, pink nose, buck-toothed grin
    k.ellipse(26, 66, 6, 4.5, 'white', { part: 'snout' });
    k.rect(20, 63, 3, 2, 'skin', { part: 'nose', tone: 2 }); k.px(20, 63, 'skin', 3);
    k.path([[19, 67], [21, 68], [24, 68], [27, 67], [29, 68]], 'black', 0);
    k.rect(21, 69, 5, 4, 'white', { tone: 4, part: 'teeth', outline: 'none', noseam: true });
    k.line(23, 69, 23, 72, 'white', 2); k.line(21, 72, 25, 72, 'white', 2);
    k.eye(33, 50, { w: 10, h: 11, iris: 'violet', mood: 'cool', brow: true, browMat: 'white', browTone: 0 });
    k.eye(22, 52, { w: 6, h: 10, iris: 'violet', mood: 'cool', far: true });
    k.rect(43, 64, 4, 1, 'sakura', { tone: 3, part: 'blush', outline: 'none' });
    // sparkles
    k.sparkle(12, 36, 1, 'light'); k.sparkle(84, 44, 1, 'light'); k.px(16, 46, 'light', 4);
  };
})();
