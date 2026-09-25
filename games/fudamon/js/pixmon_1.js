/* 封札モンスターズ — monster sprites, set 1 (style reference). Requires pixkit.js. */
(function () {
  'use strict';
  var P = window.PIXMON = window.PIXMON || {};

  // 1 ヒノコロ — fire C: chunky fox pup, burning tail, cocky fanged grin
  P[1] = function (k) {
    k.shadow(33, 59.5, 17, 2);
    // flame tail (behind everything)
    k.tube([[42, 50, 3.5], [48, 47, 4.5], [51, 41, 5]], 'fire', { part: 'tailbase' });
    k.tube([[51, 43, 6], [53, 35, 7], [51, 27, 5.5], [47, 19, 2]], 'flame', { part: 'flame', shade: 'glow', halo: 0.3, outline: 'soft' });
    k.spike(55, 35, 61, 24, 5, 'flame', { part: 'flame' });
    k.spike(48, 31, 42, 21, 5, 'flame', { part: 'flame' });
    k.spike(54, 28, 56, 16, 4, 'flame', { part: 'flame' });
    // far legs
    k.tube([[26, 50, 2.8], [26, 57, 2.8]], 'fire', { part: 'lf2', shift: -1 });
    k.ellipse(26, 57.5, 3.2, 2, 'black', { part: 'lf2' });
    k.tube([[41, 51, 3], [41, 57, 2.8]], 'fire', { part: 'hl2', shift: -1 });
    k.ellipse(41, 57.5, 3.2, 2, 'black', { part: 'hl2' });
    // body
    k.ellipse(36, 49, 11, 8, 'fire', { part: 'body' });
    k.ellipse(36, 55, 8, 2.5, 'cream', { clip: 'body' });
    // near haunch + legs
    k.ellipse(45, 50, 5.5, 6, 'fire', { part: 'haunch' });
    k.tube([[46, 53, 3.2], [46, 57, 3]], 'fire', { part: 'hl' });
    k.ellipse(46, 57.6, 3.6, 2.2, 'black', { part: 'hl' });
    k.tube([[31, 50, 3.4], [31, 57, 3.2]], 'fire', { part: 'fl' });
    k.ellipse(30.5, 57.6, 4, 2.3, 'black', { part: 'fl' });
    k.px(29, 58, 'black', 3); k.px(31, 58, 'black', 3);
    // far ear (behind head)
    k.spike(15, 31, 11, 15, 9, 'fire', { shift: -1 });
    k.spike(15, 30, 12, 20, 4, 'magma', { tone: 1 });
    // head
    k.ellipse(22, 37, 12.5, 10.5, 'fire', { part: 'head' });
    k.spike(31, 41, 38, 44, 6, 'fire', { part: 'head' });
    k.ellipse(18, 43, 8, 4.5, 'cream', { clip: 'head' });
    // near ear
    k.spike(27, 31, 31, 13, 10, 'fire', { part: 'ear' });
    k.spike(27.5, 30, 30.5, 18, 5, 'magma', { clip: 'ear', tone: 1 });
    k.spike(27, 22, 30, 18, 3, 'flame', { clip: 'ear', tone: 3 });
    // forehead flame tuft
    k.spike(21, 29, 18, 20, 6, 'flame', { part: 'tuft', shade: 'glow', halo: 0.3, outline: 'soft' });
    k.spike(24, 29, 25, 22, 4, 'flame', { part: 'tuft' });
    // muzzle
    k.ellipse(12, 41, 5.5, 4, 'cream', { part: 'muzzle' });
    k.px(7, 39, 'black', 1); k.px(8, 39, 'black', 0); k.px(7, 40, 'black', 0); k.px(8, 38, 'black', 3);
    // face
    k.eye(20, 32, { w: 5, h: 6, iris: 'gold', mood: 'cool', white: true });
    k.eye(13, 33, { w: 3, h: 5, iris: 'gold', mood: 'cool', far: true });
    k.mouth(9, 43, 6, 3, { teeth: 'fangs' });
    k.px(13, 42, 'fire', 0);
    // cheek embers
    k.px(24, 42, 'flame', 3); k.px(26, 41, 'flame', 3);
  };

  // 4 ホムラドラ — fire SR: obsidian dragon with magma cracks, toothy grin, wings up
  P[4] = function (k) {
    k.shadow(34, 60, 25, 2.2);
    // far wing
    k.poly([[36, 30], [42, 5], [52, 12], [60, 9], [61, 24], [54, 30], [46, 34]], 'fire', { part: 'wingF', shift: -1 });
    k.tube([[36, 30, 2], [42, 5, 1.4]], 'obsidian', { part: 'wingFb' });
    k.tube([[42, 5, 1.3], [52, 12, 1], [60, 9, 0.8]], 'obsidian', { part: 'wingFb' });
    // tail
    k.tube([[46, 50, 7], [54, 54, 5], [60, 51, 3], [62, 45, 1.5]], 'obsidian', { part: 'tail' });
    k.spike(61, 47, 63, 38, 4, 'flame', { shade: 'glow', halo: 0.3, outline: 'soft' });
    k.path([[50, 51], [53, 53], [56, 52], [59, 49]], 'magma', 3);
    // far legs
    k.tube([[24, 48, 3.8], [23, 56, 3.5]], 'obsidian', { shift: -1 });
    k.ellipse(22, 58, 5, 2.6, 'obsidian', { shift: -1 });
    // body
    k.ellipse(36, 45, 14, 11, 'obsidian', { part: 'body' });
    k.ellipse(29, 49, 7.5, 8, 'fire', { clip: 'body', light: 0.15 });
    for (var y = 44; y <= 55; y += 3) k.line(23, y, 35, y, 'fire', 1, { part: 'body' });
    // near wing (in front of body, behind neck)
    k.poly([[40, 34], [44, 6], [52, 14], [58, 13], [58, 26], [52, 34], [46, 38]], 'fire', { part: 'wingN' });
    k.tube([[40, 36, 1.7], [44, 6, 1.2]], 'obsidian', { part: 'wingNb' });
    k.tube([[44, 6, 1.4], [52, 14, 1.1], [58, 13, 0.9]], 'obsidian', { part: 'wingNb' });
    k.tube([[44, 12, 0.6], [55, 22, 0.6]], 'fire', { clip: 'wingN', tone: 1 });
    k.tube([[44, 20, 0.6], [53, 31, 0.6]], 'fire', { clip: 'wingN', tone: 1 });
    // near hind leg
    k.ellipse(45, 48, 8, 8.5, 'obsidian', { part: 'haunch' });
    k.tube([[46, 52, 5], [45, 57, 4]], 'obsidian', { part: 'haunch' });
    k.ellipse(43, 58, 7, 3, 'obsidian', { part: 'foot' });
    k.px(37, 59, 'bone', 3); k.px(39, 59, 'bone', 3); k.px(41, 60, 'bone', 3);
    // magma cracks
    k.path([[40, 40], [43, 43], [42, 46], [45, 49], [47, 50]], 'magma', 3);
    k.px(43, 43, 'magma', 4); k.path([[42, 46], [39, 48]], 'magma', 2);
    k.path([[51, 44], [49, 47], [50, 50]], 'magma', 3);
    // neck + near arm
    k.tube([[32, 42, 7.5], [24, 32, 6.5]], 'obsidian', { part: 'neck' });
    k.path([[31, 37], [28, 34], [29, 31], [27, 29]], 'magma', 3); k.px(28, 34, 'magma', 4);
    k.tube([[29, 46, 4.2], [25, 52, 3.8], [24, 56, 3.6]], 'obsidian', { part: 'arm' });
    k.ellipse(21, 58, 6, 3, 'obsidian', { part: 'arm' });
    k.px(16, 59, 'bone', 3); k.px(18, 60, 'bone', 3); k.px(20, 60, 'bone', 3);
    // horns (behind head)
    k.tube([[22, 18, 3], [30, 11, 2], [36, 8, 0.8]], 'bone', { part: 'hornF', shift: -1 });
    k.tube([[24, 20, 3.4], [33, 14, 2.2], [40, 13, 0.8]], 'bone', { part: 'hornN' });
    // head
    k.ellipse(19, 25, 10, 8.5, 'obsidian', { part: 'head' });
    k.ellipse(10, 29, 8, 5, 'obsidian', { part: 'head' });
    k.poly([[3, 31], [18, 31], [20, 36], [8, 36]], 'obsidian', { part: 'jaw' });
    k.mouth(4, 31, 12, 3, { teeth: 'row' });
    k.px(5, 34, 'white', 4); k.px(9, 34, 'white', 3); k.px(13, 34, 'white', 3);
    // brow crest + eye
    k.tube([[13, 19, 1.5], [22, 18, 1.8]], 'obsidian', { part: 'brow', light: 0.2 });
    k.eye(13, 19, { w: 6, h: 5, iris: 'thunder', mood: 'fierce' });
    k.px(4, 27, 'magma', 3); k.px(3, 28, 'black', 0);
    k.path([[22, 27], [24, 28], [26, 27]], 'magma', 3);
    // ember sparks
    k.sparkle(4, 20, 1, 'flame');
  };

  // 8 ミズチ — water SR: coiled river dragon, whiskers & mane, clutching a pearl
  P[8] = function (k) {
    k.shadow(34, 60, 24, 2);
    // dorsal fins (behind the coil)
    var fins = [[42, 27], [49, 31], [54, 39], [54, 48]];
    fins.forEach(function (f) { k.spike(f[0] - 2, f[1] + 4, f[0] + 3, f[1] - 3, 6, 'aqua', { part: 'fins' }); });
    // rear coil + tail
    var coil = [[38, 33, 6.5], [48, 38, 6.5], [50, 48, 6], [42, 55, 5.5], [28, 57, 4.5], [16, 56, 3.2], [9, 52, 2], [8, 46, 1]];
    k.tube(coil, 'water', { part: 'coil' });
    k.tube(coil.map(function (p) { return [p[0] - 1, p[1] + p[2] * 0.45, Math.max(0.5, p[2] * 0.55)]; }), 'cream', { clip: 'coil' });
    k.spike(9, 47, 4, 39, 5, 'aqua', { part: 'tailfin' });
    k.spike(8, 49, 13, 41, 4, 'aqua', { part: 'tailfin' });
    // mane (behind neck/head)
    k.tube([[21, 11, 3.2], [29, 8, 2.4], [35, 9, 1.4], [39, 6, 0.5]], 'aqua', { part: 'mane' });
    k.tube([[23, 16, 3.4], [31, 16, 2.6], [37, 19, 1.4], [42, 17, 0.5]], 'aqua', { part: 'mane' });
    k.tube([[25, 22, 3], [32, 25, 2.2], [37, 29, 0.5]], 'aqua', { part: 'mane' });
    k.tube([[22, 13, 1.6], [30, 12, 1], [36, 13, 0.4]], 'white', { clip: 'mane' });
    k.tube([[24, 18, 1.6], [32, 19, 1], [38, 21, 0.4]], 'white', { clip: 'mane' });
    // neck
    var neck = [[18, 22, 5.5], [24, 29, 6], [32, 33, 6.5], [40, 33, 6.5]];
    k.tube(neck, 'water', { part: 'neck' });
    k.tube([[17, 25, 3], [22, 32, 3.4], [30, 37, 3.5], [38, 38, 3]], 'cream', { clip: 'neck' });
    for (var i = 0; i < 5; i++) k.line(19 + i * 4, 30 + Math.min(i, 3) * 2 - 2, 21 + i * 4, 32 + Math.min(i, 3) * 2 - 2, 'cream', 1, { part: 'neck' });
    // arm holding the pearl
    k.tube([[26, 36, 3], [20, 41, 2.5]], 'water', { part: 'arm' });
    k.circle(14, 41, 4.5, 'crystal', { part: 'pearl', halo: 0.35, light: 0.1 });
    k.sparkle(12, 39, 1, 'white');
    k.tube([[19, 38, 1.1], [16, 36, 0.8]], 'bone', { part: 'claw' });
    k.tube([[20, 43, 1.1], [16, 45, 0.8]], 'bone', { part: 'claw' });
    // antlers
    k.tube([[18, 12, 1.6], [22, 6, 1.3], [24, 1, 0.8]], 'gold', { part: 'horn' });
    k.tube([[21, 8, 1], [27, 6, 0.8]], 'gold', { part: 'horn' });
    k.tube([[14, 12, 1.4], [12, 6, 1.1], [13, 2, 0.7]], 'gold', { part: 'horn2', shift: -1 });
    // head
    k.ellipse(16, 18, 9, 7.5, 'water', { part: 'head' });
    k.ellipse(8, 21, 6.5, 4, 'water', { part: 'head' });
    k.ellipse(9, 24, 5.5, 2.2, 'cream', { part: 'jaw' });
    k.mouth(4, 23, 7, 2, { teeth: 'fangs', tongue: false });
    // whiskers
    k.path([[4, 20], [1, 23], [0, 28]], 'gold', 3);
    k.path([[6, 18], [3, 14], [4, 9], [7, 6]], 'gold', 3);
    // face
    k.eye(13, 14, { w: 5, h: 5, iris: 'gold', mood: 'cool' });
    k.px(3, 19, 'black', 0);
    k.tube([[11, 12, 1], [19, 11, 1.2]], 'water', { part: 'brow', light: 0.25 });
  };

  // 12 モリノヌシ — grass SR: forest lord stag, branch antlers in leaf, moss mantle, shrine rope
  P[12] = function (k) {
    k.shadow(34, 60, 23, 2.2);
    // far legs
    k.tube([[22, 46, 3.6], [21, 57, 3]], 'fur', { shift: -1 });
    k.rect(18, 57, 6, 3, 'obsidian');
    k.tube([[47, 47, 3.8], [49, 57, 3]], 'fur', { shift: -1 });
    k.rect(46, 57, 6, 3, 'obsidian');
    // body
    k.ellipse(36, 42, 16, 10.5, 'fur', { part: 'body' });
    k.ellipse(34, 49, 13, 4.5, 'tan', { clip: 'body' });
    k.leaf(38, 44, 46, 40, 3, 'leaf', { clip: 'body', tone: 4 });
    k.leaf(33, 45, 38, 42, 2.5, 'leaf', { clip: 'body', tone: 4 });
    // near legs
    k.ellipse(47, 44, 7, 8, 'fur', { part: 'haunch' });
    k.tube([[48, 49, 4.2], [51, 53, 3.4], [49, 57, 3]], 'fur', { part: 'haunch' });
    k.rect(45, 57, 7, 3, 'obsidian', { part: 'hoofH' });
    k.tube([[25, 44, 4.6], [26, 51, 3.6], [25, 57, 3.2]], 'fur', { part: 'legF' });
    k.rect(21, 57, 7, 3, 'obsidian', { part: 'hoofF' });
    // moss mantle over the back
    k.poly([[20, 32], [32, 31], [44, 33], [53, 37], [52, 42], [46, 39], [42, 42], [37, 39], [32, 43], [27, 40], [22, 43]], 'grass', { part: 'mantle' });
    [[24, 42], [33, 42], [44, 40], [51, 41]].forEach(function (d) { k.spike(d[0], d[1] - 2, d[0] - 1, d[1] + 3, 3, 'grass', { part: 'mantle' }); });
    k.px(30, 34, 'sakura', 3); k.px(31, 35, 'sakura', 2); k.px(41, 35, 'white', 4); k.px(48, 37, 'sakura', 3);
    // neck + chest ruff
    k.tube([[27, 40, 6.5], [20, 29, 5.5]], 'fur', { part: 'neck' });
    k.spike(20, 36, 16, 44, 6, 'cream', { part: 'ruff' });
    k.spike(24, 38, 22, 46, 6, 'cream', { part: 'ruff' });
    // shimenawa rope with shide
    k.tube([[15, 34, 1.6], [21, 37, 1.8], [28, 37, 1.6]], 'tan', { part: 'rope' });
    k.poly([[19, 38], [22, 38], [21, 41], [23, 43], [20, 43]], 'white', { part: 'shide' });
    // ears (behind head)
    k.leaf(20, 22, 30, 19, 5, 'fur', { part: 'ear' });
    k.leaf(21, 22, 28, 20, 2, 'skin', { clip: 'ear', tone: 2 });
    // antlers
    var A = 'wood';
    k.tube([[12, 19, 1.8], [8, 12, 1.5], [5, 6, 1.1], [3, 2, 0.7]], A, { part: 'antF', shift: -1 });
    k.tube([[8, 12, 1.1], [2, 11, 0.7]], A, { part: 'antF' });
    k.tube([[17, 18, 2.2], [21, 11, 1.8], [25, 5, 1.3], [29, 1, 0.8]], A, { part: 'antN' });
    k.tube([[20, 13, 1.3], [15, 8, 1], [13, 3, 0.7]], A, { part: 'antN' });
    k.tube([[23, 8, 1.2], [31, 7, 0.9], [35, 4, 0.6]], A, { part: 'antN' });
    // leaves & blossoms on antlers
    k.leaf(29, 2, 35, 0, 3.5, 'leaf', { part: 'lv1' });
    k.leaf(13, 4, 9, 1, 3, 'leaf', { part: 'lv2' });
    k.leaf(33, 6, 38, 9, 3, 'grass', { part: 'lv3' });
    k.leaf(3, 3, 0, 6, 3, 'grass', { part: 'lv4' });
    k.circle(24.5, 6, 1.6, 'sakura', { part: 'fl1' }); k.px(24, 5, 'white', 4);
    k.circle(6, 7, 1.4, 'sakura', { part: 'fl2' });
    // head
    k.ellipse(16, 26, 8.5, 7, 'fur', { part: 'head' });
    k.ellipse(9, 29.5, 5, 4, 'tan', { part: 'muzzle' });
    k.px(5, 28, 'black', 0); k.px(5, 27, 'black', 2); k.px(6, 28, 'black', 1);
    k.line(7, 32, 10, 32, 'fur', 0);
    k.eye(13, 23, { w: 4, h: 4, iris: 'grass', mood: 'cool' });
    k.px(21, 27, 'cream', 4); k.px(22, 29, 'cream', 3);
  };

  // 17 カゲボウ — dark C: hooded shadow wraith, glowing eyes and jagged grin, talisman on the hood
  P[17] = function (k) {
    k.shadow(31, 60.5, 11, 1.6);
    // wisps
    k.tube([[54, 31, 3.2], [55, 26, 2], [53, 21, 0.5]], 'violet', { part: 'w1', shade: 'glow', halo: 0.3, outline: 'soft' });
    k.spike(55, 28, 58, 23, 2, 'violet', { part: 'w1' });
    k.tube([[8, 25, 2.6], [8, 21, 1.6], [10, 17, 0.5]], 'violet', { part: 'w2', shade: 'glow', halo: 0.3, outline: 'soft' });
    // back hand
    k.ellipse(48, 43, 3.5, 3, 'shadow', { shift: -1 });
    // cloak
    k.poly([[18, 36], [44, 36], [48, 46], [48, 55], [44, 51], [40, 58], [35, 52], [30, 59], [25, 52], [20, 57], [19, 50], [15, 47]], 'shadow', { part: 'cloak' });
    k.ellipse(30, 32, 14.5, 13.5, 'shadow', { part: 'cloak' });
    k.spike(28, 22, 17, 11, 12, 'shadow', { part: 'cloak' });
    k.circle(17, 11.5, 2.2, 'violet', { part: 'bobble', halo: 0.3 });
    // tattered hem trim
    k.poly([[44, 51], [40, 58], [35, 52], [30, 59], [25, 52], [20, 57], [20, 54], [25, 49], [30, 56], [35, 49], [40, 55], [44, 48]], 'violet', { clip: 'cloak', tone: 2 });
    // hood rim + void face
    k.ellipse(25, 34, 10, 9.5, 'violet', { part: 'rim' });
    k.ellipse(24.5, 34.5, 8.2, 7.8, 'black', { part: 'void', shade: 'flat', flatTone: 0, noseam: true });
    // eyes + grin
    k.eye(18, 30, { w: 4, h: 5, iris: 'thunder', mood: 'glow' });
    k.eye(26, 30, { w: 4, h: 5, iris: 'thunder', mood: 'glow' });
    k.px(21, 31, 'white', 4); k.px(29, 31, 'white', 4);
    k.path([[19, 38], [20, 39], [21, 38], [22, 39], [23, 38], [24, 39], [25, 38], [26, 39], [27, 38], [28, 39], [29, 38]], 'thunder', 3);
    k.px(24, 40, 'thunder', 2);
    // talisman stuck on the hood
    k.rect(35, 20, 5, 9, 'cream', { part: 'fuda', light: 0.2 });
    k.line(37, 22, 37, 26, 'red', 2); k.px(36, 23, 'red', 2); k.px(38, 25, 'red', 2);
    // front claw hand
    k.ellipse(13, 45, 4, 3.2, 'shadow', { part: 'hand' });
    k.spike(11, 45, 7, 42, 2.4, 'violet', { part: 'c1' });
    k.spike(11, 47, 7, 47, 2.4, 'violet', { part: 'c2' });
  };

  // 22 ホシウサ — light C: star rabbit with a crystal horn and a star tail
  P[22] = function (k) {
    k.shadow(33, 59.5, 15, 2);
    // far ear + far foot
    k.leaf(23, 30, 17, 10, 7, 'white', { shift: -1 });
    k.ellipse(42, 57.5, 5.5, 2.5, 'white', { shift: -1 });
    // star tail
    k.star(51, 41, 6, 'gold', { part: 'tail', halo: 0.3, round: 3 });
    k.ellipse(46, 45, 3, 3, 'white', { part: 'fluff' });
    // body
    k.ellipse(36, 48, 11.5, 9.5, 'white', { part: 'body' });
    // near foot + paws
    k.ellipse(28, 57, 7, 2.8, 'white', { part: 'foot' });
    k.px(22, 57, 'white', 1); k.px(24, 58, 'white', 1);
    // head
    k.ellipse(25, 36, 11.5, 10, 'white', { part: 'head' });
    k.spike(33, 40, 39, 44, 5, 'white', { part: 'head' });
    // near ear (swept back)
    k.leaf(30, 29, 41, 8, 7.5, 'white', { part: 'ear' });
    k.leaf(31, 27, 39, 12, 3, 'sakura', { clip: 'ear', tone: 2 });
    k.star(41, 8, 3.2, 'gold', { part: 'eartip', halo: 0.3 });
    // crystal horn
    k.poly([[17, 29], [20, 27], [23, 29], [13, 11]], 'crystal', { part: 'horn', halo: 0.3, light: 0.15 });
    k.line(19, 27, 14, 14, 'crystal', 4); k.px(20, 23, 'crystal', 1); k.px(17, 20, 'crystal', 1); k.px(18, 24, 'crystal', 1);
    k.sparkle(13, 11, 1, 'white');
    // front paws
    k.ellipse(20, 47, 3.5, 2.8, 'white', { part: 'paw' });
    k.ellipse(26, 48, 3.2, 2.6, 'white', { part: 'paw2' });
    // face
    k.px(14, 39, 'skin', 2); k.px(15, 39, 'skin', 3); k.px(14, 40, 'skin', 1);
    k.line(13, 42, 17, 42, 'mouth', 0); k.px(14, 43, 'white', 4); k.px(15, 43, 'white', 3); k.px(18, 41, 'mouth', 0);
    k.eye(20, 32, { w: 5, h: 6, iris: 'violet', mood: 'cool', white: true });
    k.eye(14, 33, { w: 3, h: 5, iris: 'violet', mood: 'cool', far: true });
    k.px(26, 40, 'sakura', 3); k.px(27, 40, 'sakura', 2);
    // sparkles
    k.sparkle(8, 22, 1, 'light'); k.sparkle(53, 30, 1, 'light'); k.px(10, 29, 'light', 4);
  };
})();
