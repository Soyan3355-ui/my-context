/* 封札モンスターズ — monster sprites, set 1 (style reference). 96x96, front-facing SFC battle-sprite style.
 * Requires pixkit.js. All designs are original. */
(function () {
  'use strict';
  var P = window.PIXMON = window.PIXMON || {};
  var C = 48; // centre line

  // 1 ヒノコロ — fire C: chubby fox pup with a bonfire tail. Gag: cheeky lopsided grin, tongue lolling, one snaggle fang.
  P[1] = function (k) {
    k.shadow(C, 88.5, 20, 2.4);
    // bonfire tail rising behind on the right
    k.tube([[56, 80, 4], [64, 76, 5], [68, 68, 5]], 'fire', { part: 'tailbase' });
    k.tube([[68, 70, 7], [71, 60, 8.5], [68, 48, 7], [63, 38, 2.5]], 'flame', { part: 'flame', shade: 'glow', halo: 0.25 });
    k.spike(74, 57, 81, 44, 6, 'flame', { part: 'flame' });
    k.spike(64, 53, 58, 43, 5, 'flame', { part: 'flame' });
    // body, feet, paws
    k.ellipse(C, 75, 15, 12, 'fire', { part: 'body' });
    k.ellipse(C, 79, 9, 8, 'cream', { clip: 'body' });
    k.sym(C, function (m, s) {
      k.ellipse(m(40), 86, 6.5, 3.4, 'cream', { part: 'foot' + s });
      k.px(m(37), 86, 'cream', 1); k.px(m(40), 87, 'cream', 1);
      k.ellipse(m(37), 76, 3.8, 4.2, 'fire', { part: 'arm' + s });
      k.ellipse(m(36.5), 79.5, 3.2, 2.4, 'cream', { part: 'arm' + s });
    });
    // ears
    k.sym(C, function (m, s) {
      k.spike(m(37), 50, m(29), 31, 13, 'fire', { part: 'ear' + s });
      k.spike(m(37), 48, m(31), 36, 6, 'magma', { clip: 'ear' + s, tone: 1 });
      k.spike(m(36), 49, m(34), 42, 4, 'cream', { clip: 'ear' + s, tone: 3 });
    });
    // head with cheek tufts
    k.ellipse(C, 57, 18, 14, 'fire', { part: 'head' });
    k.sym(C, function (m) {
      k.spike(m(33), 62, m(24), 65, 8, 'fire', { part: 'head' });
      k.spike(m(34), 66, m(27), 71, 7, 'fire', { part: 'head' });
    });
    k.ellipse(C, 65, 13, 6, 'cream', { clip: 'head' });
    // forehead flame tuft
    k.spike(C, 46, 45, 33, 9, 'flame', { part: 'tuft', shade: 'glow', halo: 0.25 });
    k.spike(52, 46, 56, 37, 6, 'flame', { part: 'tuft' });
    // muzzle + nose
    k.ellipse(C, 61.5, 7.5, 4.5, 'cream', { part: 'muzzle' });
    k.ellipse(C, 59.2, 3, 2, 'black', { part: 'nose', hi: false });
    k.px(47, 58, 'black', 4);
    // cheeky grin, lolling tongue, snaggle fang
    k.mouth([[38, 64], [58, 63], [55, 69], [48, 71], [41, 69]], { tongue: false });
    k.ellipse(53.5, 71, 3.2, 4, 'skin', { part: 'tongue' });
    k.px(53, 70, 'skin', 1); k.px(53, 71, 'skin', 1);
    k.tooth(42.5, 64, 42.8, 67.5, 2.8);
    k.tooth(56, 63.5, 55.6, 65.8, 2);
    // bulging eyes, one cocky raised brow
    k.eye(37, 48, { style: 'bulge', w: 10, h: 11, pupil: 2, look: [1.5, 1], brow: [-3, -1] });
    k.eye(50, 48, { style: 'bulge', w: 10, h: 11, pupil: 2, look: [-0.5, 1], brow: [2, -1] });
    k.px(35, 64, 'flame', 3); k.px(61, 64, 'flame', 3);
  };

  // 4 ホムラドラ — fire SR: obsidian dragon rearing up, wings spread. Gag: huge toothy laughing maw, slit eyes, tiny smoke puff.
  P[4] = function (k) {
    k.shadow(C, 89, 30, 3);
    // wings
    k.sym(C, function (m, s) {
      k.poly([[m(34), 46], [m(14), 9], [m(2), 34], [m(7), 32], [m(9), 44], [m(15), 40], [m(21), 50], [m(26), 46], [m(32), 56]], 'fire', { part: 'wing' + s, flat: true });
      var bo = { part: 'wb' + s, noseam: true };
      k.tube([[m(34), 46, 2.4], [m(14), 9, 1.8]], 'obsidian', bo);
      k.tube([[m(14), 10, 1.3], [m(2), 34, 0.8]], 'obsidian', bo);
      k.tube([[m(14), 10, 1.2], [m(9), 44, 0.8]], 'obsidian', bo);
      k.tube([[m(14), 10, 1.2], [m(21), 50, 0.8]], 'obsidian', bo);
      k.spike(m(14), 10, m(12), 3, 3, 'bone', { part: 'wclaw' + s });
    });
    // tail curling out to the right
    k.tube([[60, 82, 7], [74, 84, 5.5], [84, 78, 4], [88, 68, 2]], 'obsidian', { part: 'tail' });
    k.spike(88, 70, 91, 57, 7, 'flame', { shade: 'glow', halo: 0.25 });
    // legs
    k.sym(C, function (m, s) {
      k.ellipse(m(36), 79, 9, 9, 'obsidian', { part: 'thigh' + s });
      k.ellipse(m(34), 86.5, 10, 3.6, 'obsidian', { part: 'foot' + s });
      [27, 32, 37].forEach(function (cx, i) { k.spike(m(cx), 88, m(cx - 1), 90.5, 3.4, 'bone', { part: 'toe' + s + i }); });
    });
    // body + molten belly plates
    k.ellipse(C, 65, 19, 18, 'obsidian', { part: 'body' });
    k.ellipse(C, 69, 11, 14, 'fire', { clip: 'body' });
    for (var y = 60; y <= 82; y += 5) k.rect(36, y, 24, 1, 'fire', { adj: -2, clip: 'body' });
    k.path([[33, 56], [36, 61], [34, 66], [37, 70]], 'magma', 3); k.px(36, 61, 'magma', 4);
    k.path([[63, 58], [60, 63], [62, 68]], 'magma', 3);
    // arms raised, claws up
    k.sym(C, function (m, s) {
      k.tube([[m(33), 58, 6], [m(23), 60, 5], [m(18), 55, 4.5]], 'obsidian', { part: 'arm' + s });
      k.ellipse(m(17), 52, 5.5, 5, 'obsidian', { part: 'arm' + s });
      k.spike(m(13), 49, m(11), 43, 3.2, 'bone', { part: 'cl' + s + 'a' });
      k.spike(m(17), 48, m(17), 41, 3.2, 'bone', { part: 'cl' + s + 'b' });
      k.spike(m(21), 49, m(23), 43, 3.2, 'bone', { part: 'cl' + s + 'c' });
    });
    // horns + frills
    k.sym(C, function (m, s) {
      k.tube([[m(37), 24, 4.2], [m(28), 14, 3], [m(24), 4, 1]], 'bone', { part: 'horn' + s });
      k.spike(m(33), 36, m(22), 34, 7, 'obsidian', { part: 'frill' + s });
    });
    // head, chin, snout
    k.ellipse(C, 31, 17, 14, 'obsidian', { part: 'head' });
    k.ellipse(C, 49, 11, 5, 'obsidian', { part: 'jaw' });
    k.ellipse(C, 38, 12, 6, 'obsidian', { part: 'head' });
    k.px(44, 35, 'black', 0); k.px(45, 35, 'black', 0); k.px(51, 35, 'black', 0); k.px(52, 35, 'black', 0);
    k.px(44, 34, 'magma', 3); k.px(52, 34, 'magma', 3);
    // big laughing maw
    k.mouth([[34, 40], [62, 40], [58, 50], [48, 53], [38, 50]], {});
    [37, 41, 45, 49, 53, 57].forEach(function (tx) { k.tooth(tx + 1, 40, tx + 1.2, 43.5, 3.2); });
    k.tooth(41, 50, 41, 46.5, 3); k.tooth(55, 50, 55, 46.5, 3);
    // angry brow ridges over slit eyes
    k.eye(34, 25, { style: 'slit', w: 10, h: 8, iris: 'thunder' });
    k.eye(52, 25, { style: 'slit', w: 10, h: 8, iris: 'thunder' });
    k.sym(C, function (m, s) { k.tube([[m(33), 22, 2.3], [m(45), 26, 2.3]], 'obsidian', { part: 'brow' + s, light: 0.3 }); });
  };

  // 8 ミズチ — water SR: river dragon rising from its coils, clutching a pearl. Gag: goggle eyes and a proud buck-fanged grin.
  P[8] = function (k) {
    k.shadow(C, 89, 32, 2.6);
    // rear coil
    k.tube([[30, 76, 6], [C, 71, 7], [66, 75, 6.5], [72, 80, 6]], 'water', { part: 'coilB', shift: -1 });
    // dorsal fins peeking behind the body
    k.sym(C, function (m, s) {
      k.spike(m(40), 60, m(30), 52, 6, 'aqua', { part: 'fin' + s + 'a' });
      k.spike(m(41), 70, m(31), 64, 6, 'aqua', { part: 'fin' + s + 'b' });
    });
    // rising body
    k.tube([[C, 76, 9], [46, 62, 9], [C, 48, 8.5]], 'water', { part: 'body' });
    k.tube([[C, 77, 5], [46, 62, 5], [C, 49, 4.5]], 'cream', { clip: 'body' });
    for (var y = 52; y <= 76; y += 4) k.rect(38, y, 20, 1, 'cream', { adj: -1, clip: 'body' });
    // front coil + tail
    var coil = [[12, 62, 1.4], [10, 70, 2.8], [16, 78, 5], [28, 84, 7.5], [C, 86, 8.5], [64, 83, 8], [72, 76, 6.5], [68, 70, 5]];
    k.tube(coil, 'water', { part: 'coil' });
    k.tube(coil.map(function (p) { return [p[0], p[1] + p[2] * 0.45, Math.max(0.6, p[2] * 0.45)]; }), 'cream', { clip: 'coil' });
    k.spike(12, 64, 6, 53, 7, 'aqua', { part: 'tailfin' });
    k.spike(13, 66, 20, 56, 6, 'aqua', { part: 'tailfin2' });
    k.spike(76, 76, 84, 70, 6, 'aqua', { part: 'hump', behind: true });
    // arms: left lifts the pearl, right rests on the coil
    k.tube([[40, 56, 4], [31, 51, 3.5], [27, 45, 3]], 'water', { part: 'armL' });
    k.circle(24, 40, 6, 'crystal', { part: 'pearl', halo: 0.3 });
    k.sparkle(22, 38, 1, 'white');
    k.tube([[28, 46, 1.4], [23, 47, 0.8]], 'bone', { part: 'pc1' });
    k.tube([[29, 43, 1.4], [30, 37, 0.8]], 'bone', { part: 'pc2' });
    k.tube([[56, 58, 4], [63, 65, 3.5], [65, 72, 3]], 'water', { part: 'armR' });
    k.px(63, 75, 'bone', 3); k.px(66, 75, 'bone', 3); k.px(68, 74, 'bone', 3);
    // mane and antlers
    k.sym(C, function (m, s) {
      k.tube([[m(37), 26, 5], [m(25), 24, 4], [m(15), 28, 2.4], [m(8), 24, 0.8]], 'aqua', { part: 'mane' + s });
      k.tube([[m(38), 33, 4.5], [m(28), 37, 3], [m(20), 44, 0.8]], 'aqua', { part: 'maneb' + s });
      k.tube([[m(35), 25, 1.4], [m(25), 25, 1], [m(16), 28, 0.5]], 'white', { clip: 'mane' + s, tone: 4 });
      k.tube([[m(41), 16, 2.2], [m(35), 8, 1.6], [m(33), 2, 1]], 'gold', { part: 'horn' + s });
      k.tube([[m(37), 11, 1.3], [m(29), 10, 0.9]], 'gold', { part: 'horn' + s });
      k.spike(m(36), 30, m(26), 34, 6, 'aqua', { part: 'cfin' + s });
    });
    // head, snout, jaw
    k.ellipse(C, 25, 14, 12, 'water', { part: 'head' });
    k.ellipse(C, 36, 11, 7, 'water', { part: 'muzzle' });
    k.ellipse(C, 32.5, 6.5, 3.5, 'water', { part: 'nose', light: 0.3 });
    k.px(45, 33, 'black', 0); k.px(51, 33, 'black', 0);
    k.ellipse(C, 44, 9, 3.6, 'cream', { part: 'jaw' });
    k.mouth([[38, 38], [58, 38], [55, 43.5], [48, 45], [41, 43.5]], {});
    k.tooth(43, 38, 43.2, 41.8, 3); k.tooth(53, 38, 52.8, 41.8, 3);
    // whiskers from the lip corners
    k.sym(C, function (m, s) { k.tube([[m(38.5), 38, 1.1], [m(30), 42, 1], [m(23), 50, 0.9], [m(21), 58, 0.6]], 'gold', { part: 'wh' + s, shade: 'flat', flatTone: 3 }); });
    // goggle eyes
    k.eye(35, 19, { style: 'bulge', w: 10, h: 10, pupil: 2, look: [1, 0], brow: [1, -1] });
    k.eye(51, 19, { style: 'bulge', w: 10, h: 10, pupil: 2, look: [-1, 0], brow: [-1, 1] });
  };

  // 12 モリノヌシ — grass SR: old forest-lord stag. Gag: grumpy half-lidded eyes, chewing a sprig, a chick nesting in his antlers.
  P[12] = function (k) {
    k.shadow(C, 89, 30, 3);
    // antlers
    k.sym(C, function (m, s) {
      k.tube([[m(41), 26, 3], [m(33), 15, 2.6], [m(25), 7, 1.9], [m(19), 2, 1]], 'wood', { part: 'ant' + s });
      k.tube([[m(34), 16, 2], [m(40), 7, 1.4], [m(42), 2, 0.9]], 'wood', { part: 'ant' + s });
      k.tube([[m(28), 10, 1.6], [m(15), 11, 1.2], [m(8), 7, 0.8]], 'wood', { part: 'ant' + s });
      k.leaf(m(19), 2, m(12), 1, 5, 'leaf', { part: 'lv' + s + 'a' });
      k.leaf(m(8), 7, m(3), 12, 5, 'grass', { part: 'lv' + s + 'b' });
      k.leaf(m(42), 2, m(45), 7, 4, 'grass', { part: 'lv' + s + 'c' });
    });
    k.circle(33, 15, 2, 'sakura', { part: 'bl1' }); k.px(32, 14, 'white', 4);
    k.circle(66, 10, 1.8, 'sakura', { part: 'bl2' });
    // nest with a chick
    k.ellipse(62, 15, 6, 3, 'wood', { part: 'nest' });
    k.px(58, 14, 'wood', 1); k.px(61, 15, 'wood', 1); k.px(64, 14, 'wood', 1);
    k.circle(62, 10, 3, 'thunder', { part: 'chick' });
    k.px(61, 9, 'black', 0); k.px(59, 10, 'red', 3); k.px(58, 10, 'red', 2);
    // hind legs + body
    k.ellipse(C, 66, 23, 11, 'fur', { part: 'back', shift: -1 });
    k.sym(C, function (m, s) { k.ellipse(m(28), 80, 6, 7, 'fur', { part: 'hind' + s, shift: -1 }); k.rect(m(28) - 4, 84, 8, 5, 'obsidian', { part: 'hind' + s }); });
    k.ellipse(C, 71, 17, 13, 'fur', { part: 'body' });
    k.ellipse(C, 75, 9, 8, 'tan', { clip: 'body' });
    // moss mantle over the shoulders
    k.poly([[24, 60], [34, 55], [62, 55], [72, 60], [72, 66], [66, 64], [60, 67], [54, 64], [48, 68], [42, 64], [36, 67], [30, 64], [24, 66]], 'grass', { part: 'mantle' });
    [[30, 64], [42, 65], [54, 65], [66, 64]].forEach(function (d, i) { k.spike(d[0], d[1] - 2, d[0], d[1] + 5, 4, 'grass', { part: 'drip' + i }); });
    k.circle(40, 60, 1.4, 'white', { part: 'mf1' }); k.circle(58, 60, 1.4, 'sakura', { part: 'mf2' });
    // front legs
    k.sym(C, function (m, s) {
      k.tube([[m(39), 76, 6.5], [m(39), 83, 5.5]], 'fur', { part: 'leg' + s });
      k.rect(m(39) - 5, 84, 10, 5, 'obsidian', { part: 'hoof' + s });
      k.line(m(39), 85, m(39), 88, 'obsidian', 0);
    });
    // neck, beard ruff, rope + shide
    k.ellipse(C, 55, 10, 9, 'fur', { part: 'neck' });
    k.poly([[40, 54], [56, 54], [54, 64], [51, 61], [48, 67], [45, 61], [42, 64]], 'cream', { part: 'beard' });
    k.tube([[34, 57, 2.2], [C, 61, 2.5], [62, 57, 2.2]], 'tan', { part: 'rope' });
    for (var i = 35; i <= 61; i += 3) k.px(i, 59 + (Math.abs(i - C) < 8 ? 1 : 0), 'tan', 1);
    k.poly([[45, 62], [51, 62], [49, 66], [53, 66], [51, 71], [46, 71], [48, 67], [44, 67]], 'white', { part: 'shide', shade: 'flat', flatTone: 3 });
    // ears
    k.sym(C, function (m, s) {
      k.leaf(m(37), 35, m(24), 31, 7, 'fur', { part: 'ear' + s });
      k.leaf(m(35), 34, m(27), 32, 3, 'skin', { clip: 'ear' + s, tone: 2 });
    });
    // head, long muzzle, big nose
    k.ellipse(C, 38, 12, 11, 'fur', { part: 'head' });
    k.ellipse(C, 48, 7.5, 6.5, 'tan', { part: 'muzzle' });
    k.ellipse(C, 51, 4.2, 2.6, 'black', { part: 'nose', hi: false });
    k.px(46, 50, 'black', 4);
    k.path([[43, 55], [46, 56], [50, 56], [53, 55]], 'fur', 0);
    // chewing a sprig
    k.tube([[53, 55, 0.6], [60, 53, 0.6]], 'leaf', { part: 'stem', shade: 'flat', flatTone: 1 });
    k.leaf(58, 53, 65, 50, 3.5, 'leaf', { part: 'sprig' });
    // forehead star
    k.px(48, 32, 'cream', 4); k.px(47, 33, 'cream', 3); k.px(49, 33, 'cream', 3); k.px(48, 34, 'cream', 3);
    // grumpy half-lidded eyes with bushy white brows
    k.eye(37, 36, { style: 'bulge', w: 9, h: 9, pupil: 2, lid: 0.4, lidMat: 'fur', lidTilt: -1, look: [1, 0], brow: [-1, 2], browMat: 'cream', browTone: 3, browThick: 3 });
    k.eye(50, 36, { style: 'bulge', w: 9, h: 9, pupil: 2, lid: 0.4, lidMat: 'fur', lidTilt: 1, look: [-1, 0], brow: [2, -1], browMat: 'cream', browTone: 3, browThick: 3 });
  };

  // 17 カゲボウ — dark C: hooded shadow wraith. Gag: jiangshi-style talisman slapped on its hood, "boo!" claws, lolling tongue.
  P[17] = function (k) {
    k.shadow(C, 89.5, 15, 2);
    function wisp(cx, cy, s, id) {
      var o = { part: id, shade: 'glow', halo: 0.3 };
      k.tube([[cx, cy, 3.4 * s], [cx + 0.6 * s, cy - 4 * s, 2.3 * s], [cx - 1.2 * s, cy - 9 * s, 0.6]], 'violet', o);
      k.spike(cx + 2 * s, cy - 3 * s, cx + 4.5 * s, cy - 7.5 * s, 2.4 * s, 'violet', o);
    }
    wisp(10, 72, 1.1, 'w1'); wisp(85, 70, 1.1, 'w2'); wisp(80, 36, 0.8, 'w3');
    // floppy hood tip + bobble
    k.tube([[C, 38, 8], [41, 27, 5], [33, 22, 3], [28, 25, 2]], 'shadow', { part: 'cloak' });
    k.circle(26, 27, 3.3, 'violet', { part: 'bobble', halo: 0.25 });
    // cloak with tattered hem
    var hem = [[70, 80], [66, 76], [63, 86], [58, 78], [53, 88], [48, 79], [43, 88], [38, 78], [33, 86], [30, 76], [26, 80]];
    k.poly([[31, 52], [65, 52], [69, 66]].concat(hem).concat([[27, 66]]), 'shadow', { part: 'cloak' });
    k.ellipse(C, 50, 19, 17, 'shadow', { part: 'cloak' });
    k.poly(hem.concat(hem.slice().reverse().map(function (p) { return [p[0], p[1] - 4]; })), 'violet', { clip: 'cloak' });
    // folds
    [[[40, 68], [39, 78], [38, 84]], [[56, 68], [57, 78], [58, 84]], [[48, 70], [48, 80]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 1]; }), null, { adj: -1, clip: 'cloak' });
      k.tube(f.map(function (p) { return [p[0] - 2, p[1], 0.6]; }), null, { adj: 1, clip: 'cloak' });
    });
    // hood rim + void face
    k.ellipse(C, 54, 14, 13, 'violet', { part: 'rim' });
    k.ellipse(C, 54.5, 11.5, 10.5, 'black', { part: 'void', shade: 'flat', flatTone: 0, noseam: true });
    // glowing slanted eyes
    k.sym(C, function (m, s) {
      k.poly([[m(38), 48], [m(45), 50], [m(45), 53], [m(39), 52]], 'thunder', { part: 'eye' + s, shade: 'glow', halo: 0.35, outline: 'none' });
    });
    k.px(40, 49, 'white', 4); k.px(55, 49, 'white', 4);
    // jagged grin + lolling tongue
    k.poly([[37, 56], [59, 56], [56, 61], [48, 63.5], [40, 61]], 'thunder', { part: 'grin', shade: 'glow', halo: 0.3, outline: 'none' });
    k.path([[37, 57], [39, 59], [41, 57], [43, 60], [45, 57], [47, 60], [49, 57], [51, 60], [53, 57], [55, 59], [57, 57]], 'black', 0);
    k.tube([[52, 61, 2.4], [53, 66, 2.8], [52, 70, 2.2]], 'sakura', { part: 'tongue' });
    k.line(52, 63, 52, 68, 'sakura', 1);
    // talisman slapped on the hood (jiangshi style)
    k.poly([[43, 29], [53, 30], [52, 46], [42, 45]], 'cream', { part: 'fuda', light: 0.2 });
    k.line(48, 32, 47, 42, 'red', 2); k.line(45, 34, 50, 34, 'red', 2); k.line(45, 38, 50, 39, 'red', 2); k.px(46, 41, 'red', 2); k.px(49, 42, 'red', 2);
    // "boo!" claw hands raised
    k.sym(C, function (m, s) {
      k.tube([[m(34), 62, 5.5], [m(25), 60, 4.8]], 'shadow', { part: 'sleeve' + s });
      k.ellipse(m(24), 60, 3, 5.4, 'violet', { part: 'cuff' + s });
      k.ellipse(m(18), 58, 5, 4.6, 'dark', { part: 'hand' + s });
      k.tube([[m(15), 55, 1.7], [m(13), 49, 1.1], [m(15), 45, 0.5]], 'violet', { part: 'c' + s + 'a' });
      k.tube([[m(19), 54, 1.7], [m(20), 48, 1.1], [m(23), 45, 0.5]], 'violet', { part: 'c' + s + 'b' });
      k.tube([[m(14), 59, 1.6], [m(9), 56, 1], [m(8), 52, 0.5]], 'violet', { part: 'c' + s + 'c' });
    });
    k.rect(77, 56, 3, 6, 'cream', { clip: 'hand-1', tone: 3 }); k.px(78, 58, 'red', 2);
  };

  // 22 ホシウサ — light C: star rabbit with a crystal-shard crest. Gag: one ear flopped over, giant buck teeth, puffed cheeks.
  P[22] = function (k) {
    k.shadow(C, 88.5, 19, 2.4);
    // star tail peeking out
    k.star(67, 74, 7.5, 'gold', { part: 'tail', halo: 0.25 });
    // body, feet, paws
    k.ellipse(C, 76, 14, 12, 'white', { part: 'body' });
    k.ellipse(C, 80, 8, 7, 'cream', { clip: 'body' });
    k.sym(C, function (m, s) {
      k.ellipse(m(39), 86.5, 7.5, 3.3, 'white', { part: 'foot' + s });
      k.line(m(35), 86, m(35), 88, 'white', 1); k.line(m(38), 87, m(38), 88, 'white', 1);
      k.ellipse(m(36), 74, 3.6, 4.6, 'white', { part: 'arm' + s });
    });
    // ears: left upright, right flopped over with a dangling star
    k.leaf(41, 48, 35, 15, 11, 'white', { part: 'earL' });
    k.leaf(40, 45, 36, 21, 4.5, 'sakura', { clip: 'earL', tone: 2 });
    k.tube([[56, 47, 5], [59, 36, 5], [63, 29, 4.5], [70, 30, 3.5], [75, 36, 2]], 'white', { part: 'earR' });
    k.tube([[57, 45, 1.8], [60, 36, 1.8], [63, 32, 1.5]], 'sakura', { clip: 'earR', tone: 2 });
    k.line(75, 37, 75, 40, 'gold', 1);
    k.star(75, 43, 4, 'gold', { part: 'ears', halo: 0.25 });
    // head with puffed cheeks
    k.ellipse(C, 58, 17, 14, 'white', { part: 'head' });
    k.sym(C, function (m) { k.ellipse(m(35), 64, 7, 5.5, 'white', { part: 'head' }); });
    // crystal shard crest
    k.poly([[41, 47], [39, 40], [36, 36], [40, 35], [43, 40], [44, 47]], 'crystal', { part: 'shL', shade: 'flat', flatTone: 2, halo: 0.2 });
    k.poly([[52, 47], [53, 40], [57, 35], [60, 37], [55, 41], [55, 47]], 'crystal', { part: 'shR', shade: 'flat', flatTone: 2, halo: 0.2 });
    k.poly([[44, 47], [44, 37], [48, 27], [52, 37], [52, 47]], 'crystal', { part: 'horn', halo: 0.3, shade: 'flat', flatTone: 3 });
    k.poly([[48, 27], [52, 37], [52, 47], [48, 47]], null, { set: 2, clip: 'horn' });
    k.poly([[44, 37], [48, 27], [46, 37]], null, { set: 4, clip: 'horn' });
    k.sparkle(48, 25, 2, 'white');
    // face: pink nose, tiny mouth, giant buck teeth
    k.poly([[46, 61], [50, 61], [48, 63]], 'skin', { part: 'nose', tone: 2 });
    k.path([[43, 64], [45, 65], [48, 64], [51, 65], [53, 64]], 'black', 0);
    k.rect(45, 65, 6, 6, 'white', { part: 'teeth', shade: 'flat', flatTone: 4 });
    k.line(48, 65, 48, 70, 'black', 0);
    k.line(46, 70, 50, 70, 'white', 2);
    // determined bulging eyes
    k.eye(37, 49, { style: 'bulge', w: 9, h: 10, pupil: 2, look: [1, 0.5], brow: [2, -1] });
    k.eye(50, 49, { style: 'bulge', w: 9, h: 10, pupil: 2, look: [-1, 0.5], brow: [-1, 2] });
    k.sym(C, function (m) { k.rect(m(33), 65, 3, 1, 'sakura', { tone: 3, part: 'blush', outline: 'none' }); });
    k.sparkle(14, 44, 1, 'light'); k.sparkle(82, 52, 1, 'light');
  };
})();
