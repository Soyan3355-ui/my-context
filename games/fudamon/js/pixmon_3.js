/* 封札モンスターズ — monster sprites, set 3 (grass/thunder). 80x80 front-facing battle sprites at SFC density.
 * Requires pixkit.js (v3). House style: see pixmon_1.js + PIXMON_STYLE.md. All designs are original. */
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
  // mirrored pixel map (flip rows horizontally)
  function pmx(k, x, y, rows, pal) { pm(k, x, y, rows.map(function (r) { return r.split('').reverse().join(''); }), pal); }

  // 11 メブキン — grass C, かわいい: bark-skinned sprout imp. Gag: winding up to lob an acorn, cheeky grin with a tongue poked out the side.
  P[11] = function (k) {
    k.shadow(C, 76.5, 14, 2);
    // root feet
    k.sym(C, function (m, s) {
      k.tube([[m(35), 67, 3.2], [m(34), 72, 2.8], [m(31), 75, 1.6], [m(27), 75.5, 0.8]], 'wood', { part: 'rt' + s });
      k.tube([[m(35), 73, 1.4], [m(38), 75.5, 0.7]], 'wood', { part: 'rt' + s });
      k.px(m(33), 74, 'wood', 1); k.px(m(30), 74, 'wood', 5);
    });
    // body with leaf collar
    k.ellipse(C, 63, 9, 8.5, 'wood', { part: 'body' });
    k.texture('body', 'bark', { size: 3, seed: 2 });
    k.ellipse(C, 64.5, 5, 5.5, 'tan', { clip: 'body' });
    k.path([[37, 61], [38, 64], [37, 67]], 'tan', 2); k.path([[43, 62], [42, 65]], 'tan', 2);
    // right arm on hip
    k.tube([[48, 60, 2.2], [53, 63, 1.8], [51, 67, 1.6]], 'wood', { part: 'armR' });
    k.tube([[52.5, 62, 0.5], [51, 66, 0.5]], null, { adj: -1, clip: 'armR' });
    // left arm raised with an acorn
    k.tube([[32, 60, 2.3], [26, 57, 1.9], [22, 51, 1.7]], 'wood', { part: 'armL' });
    k.tube([[31, 58.5, 0.5], [26, 55.5, 0.5]], null, { adj: 1, clip: 'armL' });
    k.ellipse(21.5, 50, 2.6, 2.4, 'wood', { part: 'hand' });
    k.tube([[20, 43, 3.4], [20, 46, 2.4], [20, 48, 0.6]], 'fur', { part: 'acorn' });
    k.ellipse(20, 41.5, 4, 2.2, 'tan', { part: 'cap' });
    k.texture('cap', 'dots', { seed: 3 });
    k.path([[17, 42], [23, 42]], 'tan', 1); k.px(20, 39, 'wood', 1); k.px(20, 38, 'wood', 2);
    k.px(19, 45, 'fur', 6); k.px(18, 44, 'fur', 5);
    k.tube([[20.5, 49, 0.9], [23, 47, 0.8]], 'wood', { part: 'thumb' });
    // leafy collar
    k.tufts([[49, 57], [44, 59], [36, 59], [31, 57]], 'grass', { part: 'collar', len: 3.5, w: 3, every: 2.5, seed: 6 });
    // head with bark cheeks + little leaf ears
    k.sym(C, function (m, s) {
      k.leaf(m(29), 46, m(21), 44, 5, 'leaf', { part: 'le' + s });
      k.line(m(28), 46, m(23), 45, 'leaf', 2);
    });
    k.ellipse(C, 48, 12.5, 10.5, 'wood', { part: 'head' });
    k.texture('head', 'bark', { size: 3, seed: 5 });
    k.ellipse(C, 51, 9, 6.5, 'tan', { clip: 'head' });
    k.tufts([[31, 40], [36, 38.5], [44, 38.5], [49, 40]], 'wood', { part: 'head', len: 2, w: 2.4, every: 3, seed: 7 });
    // sprout: one big curling leaf + a small one
    k.tube([[C, 39, 1.3], [41, 35, 1], [40, 32, 0.7]], 'leaf', { part: 'stem' });
    k.leaf(41, 33, 55, 26, 9, 'grass', { part: 'bigleaf' });
    k.path([[42, 33], [46, 31], [51, 28], [54, 27]], 'grass', 2);
    k.px(45, 30, 'grass', 6); k.px(48, 28, 'grass', 5);
    k.leaf(C, 33, 31, 27.5, 5, 'leaf', { part: 'smleaf' });
    k.px(36, 30, 'leaf', 2); k.px(34, 29, 'leaf', 2);
    // face: raised brow + side-eye glare
    k.eye(31, 45, { w: 5, h: 4, iris: 'thunder', side: 'L', angry: 0.4, look: [1, 0], browMat: 'wood', browTone: 0 });
    k.eye(44, 45, { w: 5, h: 4, iris: 'thunder', side: 'R', angry: 1.4, look: [1, 0], browMat: 'wood', browTone: 0 });
    k.px(39, 50, 'wood', 1); k.px(41, 50, 'wood', 1);
    // lopsided grin, one snaggle tooth, tongue out the side
    k.mouth([[34, 52], [47, 51], [45.5, 55], [41, 56], [36, 54.5]], { tongue: false });
    k.tooth(36, 52, 36.4, 54.5, 2);
    k.tooth(44, 52, 44, 54, 1.8);
    k.tube([[45.5, 55, 1.2], [46.5, 57, 1.3], [46.5, 58, 0.9]], 'skin', { part: 'tongue' });
    k.px(46, 57, 'skin', 2);
    k.sym(C, function (m) { k.px(m(30), 52, 'sakura', 4); k.px(m(31), 52, 'sakura', 4); });
  };

  // 12 キノコボウ — grass C, 癒し: plump dozing mushroom kid hugging a baby sprout. Gag: a snot bubble while it naps.
  P[12] = function (k) {
    k.shadow(C, 76.5, 14, 2);
    // drifting glow spores
    [[13, 44], [67, 38], [65, 58], [14, 60], [12, 30], [68, 24]].forEach(function (p, i) { k.sparkle(p[0], p[1], 1, i % 2 ? 'leaf' : 'light'); });
    // stubby feet
    k.sym(C, function (m, s) { k.ellipse(m(33.5), 73.5, 5, 2.8, 'cream', { part: 'foot' + s }); k.px(m(31), 74, 'cream', 2); });
    // chubby body = face
    k.ellipse(C, 59, 13, 12.5, 'cream', { part: 'body', light: 0.12 });
    k.tube([[30, 64, 0.6], [32, 68, 0.6], [36, 70.5, 0.6]], null, { adj: -1, clip: 'body' });
    // moss scarf low on the belly
    k.poly([[28, 63], [52, 63], [50, 66.5], [C, 68], [30, 66.5]], 'grass', { part: 'scarf' });
    k.tufts([[51, 66], [45, 67.5], [35, 67.5], [29, 66]], 'grass', { part: 'scarf', len: 2.4, w: 2.4, every: 2, seed: 3 });
    k.texture('scarf', 'fur', { seed: 5 });
    k.px(33, 64, 'sakura', 5); k.px(47, 65, 'white', 6);
    // hugging a baby sprout in a nut pot
    k.ellipse(C, 69.5, 3.8, 2.8, 'wood', { part: 'pot' });
    k.tube([[C, 68, 0.8], [C, 64.5, 0.7]], 'leaf', { part: 'bstem' });
    k.leaf(C, 65, 35.5, 62, 4, 'leaf', { part: 'bl1' });
    k.leaf(C, 65, 44.5, 62.5, 4, 'grass', { part: 'bl2' });
    k.sym(C, function (m, s) { k.ellipse(m(34.5), 69, 3.2, 2.8, 'cream', { part: 'hand' + s }); });
    // gills peeking under the brim
    k.ellipse(C, 44, 12, 2.4, 'tan', { part: 'gill', shift: -1 });
    for (var gx = 31; gx <= 49; gx += 2) k.px(gx, 44, 'tan', 1);
    // smaller dome cap sitting up high, wavy rim, glowing spots
    k.ellipse(C, 35.5, 13.5, 8.5, 'fur', { part: 'cap' });
    k.ellipse(C, 41, 15, 2.6, 'fur', { part: 'cap' });
    k.tufts([[54, 41.5], [48, 43.5], [32, 43.5], [26, 41.5]], 'fur', { part: 'cap', len: 1.6, w: 3, every: 3.4, seed: 9 });
    k.texture('cap', 'fur', { seed: 6 });
    [[33, 33, 2.8], [44, 31, 2.3], [50, 37, 1.9], [29, 39, 1.5], [39, 38.5, 1.7], [47, 28, 1.2]].forEach(function (s) {
      k.circle(s[0], s[1], s[2], 'leaf', { clip: 'cap', tone: 5 });
      k.circle(s[0] + 0.4, s[1] + 0.4, Math.max(0.8, s[2] - 1.2), 'leaf', { clip: 'cap', tone: 6 });
    });
    k.ellipse(C, 42.5, 16, 1, null, { adj: -1, clip: 'cap' });
    k.tube([[27, 32, 0.6], [31, 28.5, 0.6], [36, 27.5, 0.6]], null, { adj: 1, clip: 'cap' });
    // little sprout on top
    k.tube([[43, 27.5, 0.8], [44, 24.5, 0.6]], 'leaf', { part: 'tstem' });
    k.leaf(44, 25, 50, 22.5, 3.6, 'grass', { part: 'tleaf' });
    // soft shade under the brim
    k.ellipse(C, 47, 11, 1.2, null, { adj: -1, clip: 'body' });
    // dozy face: content closed eyes, rosy cheeks, soft smile
    var E = { K: ['black', 0], l: ['black', 3], c: ['cream', 2] };
    pm(k, 30, 50, ['K....K', 'KK..KK', '.KKKK.'], E);
    pm(k, 44, 50, ['K....K', 'KK..KK', '.KKKK.'], E);
    k.sym(C, function (m, s) { k.rect(s > 0 ? 28 : 49, 53, 3, 2, 'sakura', { tone: 4, part: 'blush' + s, outline: 'none' }); });
    k.px(29, 53, 'sakura', 5); k.px(50, 53, 'sakura', 5);
    k.px(C, 54, 'cream', 2);
    k.path([[37, 56], [38, 57], [42, 57], [43, 56]], 'black', 0);
    k.px(39, 58, 'mouth', 4); k.px(C, 58, 'mouth', 4);
    // snot bubble
    k.circle(46, 58.5, 2.3, 'ice', { part: 'bubble', shade: 'flat', flatTone: 5, outline: 'soft' });
    k.px(45, 57, 'white', 6); k.px(47, 59, 'ice', 3);
  };

  // 14 ハナカマキリ — grass R, かっこいい: orchid mantis in petal armour, scythes raised high. Gag: none needed, pure menace — a severed petal falling from its blade.
  P[14] = function (k) {
    k.shadow(C, 76.5, 18, 2.2);
    // petal wings flared behind
    k.sym(C, function (m, s) {
      k.leaf(m(37), 54, m(19), 49, 10, 'sakura', { part: 'wing' + s, shift: -1 });
      k.leaf(m(37), 58, m(23), 63, 8, 'sakura', { part: 'wingb' + s, shift: -1 });
      k.line(m(35), 53, m(22), 49, 'sakura', 1); k.line(m(35), 58, m(26), 62, 'sakura', 1);
    });
    // walking legs with petal lobes
    k.sym(C, function (m, s) {
      k.tube([[m(36), 60, 1.4], [m(28), 64, 1.2], [m(27), 75, 0.9]], 'grass', { part: 'lgA' + s, shift: -1 });
      k.leaf(m(35), 61, m(28), 64.5, 5, 'sakura', { part: 'lpA' + s });
      k.tube([[m(38), 62, 1.4], [m(33), 67, 1.2], [m(34), 75.5, 0.9]], 'grass', { part: 'lgB' + s });
      k.leaf(m(37), 63.5, m(32.5), 68, 4.5, 'white', { part: 'lpB' + s });
      k.px(m(27), 75, 'grass', 1); k.px(m(34), 75, 'grass', 1);
    });
    // abdomen: stacked petal plates
    k.ellipse(C, 65, 6.5, 9, 'white', { part: 'abd' });
    for (var y = 59; y <= 71; y += 3) k.tube([[34, y, 0.5], [C, y + 1.5, 0.5], [46, y, 0.5]], null, { adj: -2, clip: 'abd' });
    k.ellipse(C, 67, 2.6, 6.5, 'sakura', { clip: 'abd', light: 0.1 });
    // thorax + petal breastplate
    k.tube([[C, 60, 4], [C, 46, 3]], 'grass', { part: 'thorax' });
    k.texture('thorax', 'scales', { size: 3 });
    k.poly([[33, 50], [47, 50], [44, 58], [C, 60], [36, 58]], 'white', { part: 'plate' });
    k.poly([[C, 50], [47, 50], [44, 58], [C, 60]], null, { adj: -1, clip: 'plate' });
    k.line(C, 51, C, 58, 'sakura', 3); k.px(36, 51, 'white', 6);
    // raised scythes: femur up and out, blade folded down toward the head
    k.sym(C, function (m, s) {
      k.tube([[m(37), 48, 2.6], [m(30), 44, 2.4], [m(27), 40, 2.2]], 'grass', { part: 'coxa' + s });
      k.tube([[m(27), 41, 3.2], [m(21), 30, 3], [m(18), 18, 2.2]], 'grass', { part: 'fem' + s });
      k.texture('fem' + s, 'scales', { size: 3, seed: 3 });
      k.leaf(m(28), 43, m(15), 31, 6, 'sakura', { part: 'fpet' + s });
      k.line(m(26), 41, m(17), 33, 'sakura', 2);
      // inner spines
      [[23.5, 34], [22, 29], [20.8, 24]].forEach(function (t) { k.tooth(m(t[0]), t[1], m(t[0] + 3.5), t[1] + 1, 2, 'bone'); });
      // sickle blade
      k.poly([[m(16), 16], [m(20), 13], [m(26), 16], [m(30), 23], [m(31), 30], [m(28), 24], [m(22), 19.5], [m(19), 20]], 'white', { part: 'blade' + s });
      k.poly([[m(26), 16], [m(30), 23], [m(31), 30], [m(28), 24]], null, { adj: -2, clip: 'blade' + s });
      k.line(m(20), 14, m(25), 16, 'white', 6);
    });
    // falling petal
    k.leaf(62, 50, 66, 54, 3, 'sakura', { part: 'fp' });
    // antennae swept back, clear of the eyes
    k.sym(C, function (m, s) { k.tube([[m(38), 26, 0.5], [m(36), 20, 0.5], [m(33), 14, 0.5], [m(33), 10, 0.5]], 'grass', { part: 'ant' + s, shade: 'flat', flatTone: 2, noseam: true }); });
    // triangular head, big compound eyes at the corners
    k.poly([[28, 28], [52, 28], [45, 39], [C, 44], [35, 39]], 'grass', { part: 'head' });
    k.ellipse(C, 28.5, 9, 3.5, 'grass', { part: 'head' });
    k.texture('head', 'scales', { size: 3, seed: 7 });
    k.sym(C, function (m, s) {
      k.ellipse(m(30.5), 29.5, 4.2, 4.6, 'leaf', { part: 'ceye' + s, light: 0.15 });
      k.texture('ceye' + s, 'dots', { seed: 2 + s });
    });
    k.sym(C, function (m, s) {
      // intense slit glare: dark wedge lid + red pupil bar
      k.poly([[m(26), 26], [m(35), 28.5], [m(35), 30], [m(27), 28]], 'black', { part: 'lid' + s, tone: 0, outline: 'none', noseam: true });
      k.px(m(30), 30, 'black', 0); k.px(m(31), 30, 'black', 0); k.px(m(30), 31, 'red', 4); k.px(m(31), 31, 'black', 0); k.px(m(30), 32, 'red', 3);
      k.px(m(28), 30, 'white', 6);
    });
    k.path([[37, 33], [C, 35], [43, 33]], 'grass', 1);
    k.px(C, 31, 'grass', 6); k.px(39, 32, 'grass', 5);
    // mandibles
    k.sym(C, function (m) { k.tooth(m(37.5), 40, m(39.5), 44.5, 2.2, 'bone'); });
  };

  // 16 ビリタマ — thunder C, かわいい: armoured pill-bug half-rolled, crackling antennae. Gag: tickled to bits, feet kicking.
  P[16] = function (k) {
    k.shadow(C, 76.5, 17, 2);
    // antennae with sparks
    k.sym(C, function (m, s) {
      k.tube([[m(32), 48, 1], [m(24), 42, 0.9], [m(20), 38, 0.6]], 'steel', { part: 'an' + s });
      k.circle(m(18.5), 35.5, 1.8, 'thunder', { part: 'tip' + s, shade: 'glow', halo: 0.35 });
    });
    k.path([[13, 33], [15, 31], [14, 29], [16, 27]], 'thunder', 6); k.path([[66, 33], [64, 31], [65, 29], [63, 27]], 'thunder', 6);
    k.px(13, 38, 'crystal', 6); k.px(67, 38, 'crystal', 6);
    // shell ball
    k.ellipse(C, 53, 18, 16, 'thunder', { part: 'shell' });
    // segment bands
    for (var b = 0; b < 5; b++) {
      var yy = 42 + b * 5;
      k.tube([[23, yy + 5, 0.6], [30, yy + 1, 0.6], [C, yy, 0.6], [50, yy + 1, 0.6], [57, yy + 5, 0.6]], null, { adj: -2, clip: 'shell' });
      k.tube([[24, yy + 6.3, 0.5], [30, yy + 2.3, 0.5], [C, yy + 1.3, 0.5], [50, yy + 2.3, 0.5], [56, yy + 6.3, 0.5]], null, { adj: 1, clip: 'shell' });
    }
    // lightning mark down the back
    k.poly([[43, 37], [36, 47], [41, 47], [36, 56], [46, 44], [41, 44], [45, 37]], 'obsidian', { clip: 'shell', tone: 2 });
    // opening: face peeking out
    k.ellipse(C, 64, 12, 8, 'shadow', { part: 'hole', shade: 'flat', flatTone: 1, noseam: true });
    // little kicking legs
    k.sym(C, function (m, s) {
      k.tube([[m(33), 69, 1], [m(28), 72, 0.9], [m(26), 70, 0.7]], 'steel', { part: 'lg1' + s });
      k.tube([[m(35), 70, 1], [m(33), 74.5, 0.8]], 'steel', { part: 'lg2' + s });
    });
    // tail plate curling under
    k.ellipse(C, 72.5, 7.5, 3, 'thunder', { part: 'tail' });
    k.line(35, 72, 45, 72, 'thunder', 2);
    k.ellipse(C, 62, 9, 6.5, 'cream', { part: 'face' });
    // delighted face: happy closed eyes, huge open grin
    var E = { K: ['black', 0] };
    pm(k, 33, 59, ['.KK.', 'K..K'], E); pm(k, 43, 59, ['.KK.', 'K..K'], E);
    k.mouth([[35, 62], [45, 62], [43, 66], [C, 67], [37, 66]], {});
    k.sym(C, function (m) { k.px(m(33), 63, 'sakura', 4); k.px(m(32), 63, 'sakura', 4); });
    k.px(38, 62, 'white', 6);
  };

  // 17 イナビー — thunder C, かっこいい: storm hornet, steel carapace, crackling stinger.
  P[17] = function (k) {
    k.shadow(C, 76.5, 11, 1.8);
    // wings
    k.sym(C, function (m, s) {
      k.leaf(m(35), 42, m(12), 26, 11, 'ice', { part: 'wa' + s, shade: 'flat', flatTone: 4 });
      k.leaf(m(35), 46, m(15), 44, 7, 'ice', { part: 'wb' + s, shade: 'flat', flatTone: 3 });
      k.path([[m(33), 41], [m(24), 34], [m(15), 28]], 'ice', 2);
      k.path([[m(27), 36], [m(22), 39]], 'ice', 2);
      k.px(m(19), 31, 'white', 6);
    });
    // abdomen with stripes + stinger
    k.ellipse(C, 61, 7.5, 9, 'thunder', { part: 'abd' });
    for (var y = 56; y <= 68; y += 4) k.tube([[33, y, 1], [C, y + 1.3, 1], [47, y, 1]], 'black', { clip: 'abd', tone: 2 });
    k.spike(C, 68, C, 76, 3.4, 'steel', { part: 'sting' });
    k.px(C, 70, 'steel', 6);
    k.path([[37, 70], [34, 72], [36, 73], [33, 76]], 'thunder', 6); k.path([[43, 70], [46, 72], [44, 73], [47, 76]], 'thunder', 6);
    k.px(35, 71, 'crystal', 6); k.px(45, 71, 'crystal', 6);
    k.texture('abd', 'fur', { seed: 2 });
    // legs
    k.sym(C, function (m, s) {
      k.tube([[m(36), 52, 1.1], [m(29), 56, 1], [m(28), 63, 0.8]], 'obsidian', { part: 'lg' + s });
      k.tube([[m(35), 49, 1.1], [m(27), 50, 1], [m(24), 46, 0.8]], 'obsidian', { part: 'fl' + s });
      k.tooth(m(24), 46, m(22), 43, 1.6, 'thunder');
    });
    // thorax: steel carapace
    k.ellipse(C, 49, 7.5, 5.5, 'steel', { part: 'thorax' });
    k.rect(34, 49, 12, 1, null, { adj: -2, clip: 'thorax' });
    k.px(37, 46, 'steel', 6);
    // antennae
    k.sym(C, function (m, s) { k.tube([[m(37), 32, 0.6], [m(34), 26, 0.6], [m(29), 23, 0.5]], 'obsidian', { part: 'an' + s, noseam: true }); k.px(m(29), 22, 'thunder', 6); });
    // head
    k.ellipse(C, 38, 9, 7.5, 'thunder', { part: 'head' });
    k.poly([[30, 30], [50, 30], [50, 34], [C, 38], [30, 34]], 'obsidian', { clip: 'head' });
    k.texture('head', 'scales', { size: 3 });
    k.ellipse(C, 42.5, 4, 2.5, 'thunder', { clip: 'head', light: 0.25 });
    // mandibles
    k.sym(C, function (m) { k.tooth(m(37), 44, m(39), 47.5, 2.2, 'steel'); });
    k.eye(32, 36, { w: 6, h: 4, iris: 'red', side: 'L', angry: 2, brow: false });
    k.eye(42, 36, { w: 6, h: 4, iris: 'red', side: 'R', angry: 2, brow: false });
    k.path([[31, 35], [34, 36], [38, 38]], 'black', 0); k.path([[49, 35], [46, 36], [42, 38]], 'black', 0);
  };

  // 18 カミナリコゾウ — thunder C, かわいい: little thunder imp in tiger-pelt shorts with an arc of drums. Gag: akanbe (pulling an eyelid, tongue out).
  P[18] = function (k) {
    k.shadow(C, 76.5, 13, 2);
    // arc of 4 taiko behind the shoulders
    k.sym(C, function (m, s) {
      k.tube([[m(17), 60, 1.2], [m(15), 50, 1.2], [m(17), 40, 1.2], [m(23), 32, 1.2], [m(29), 29, 1.2]], 'red', { part: 'ring' + s });
      [[15.5, 55], [17, 40]].forEach(function (d, i) {
        k.circle(m(d[0]), d[1], 4.2, 'wood', { part: 'drum' + s + i });
        k.circle(m(d[0]), d[1], 2.8, 'cream', { part: 'dh' + s + i, spec: false });
        pm(k, Math.round(m(d[0])) - 1, d[1] - 1, ['rR', 'Rr'], { r: ['red', 4], R: ['red', 2] });
        k.px(m(d[0]) - 4, d[1], 'gold', 5); k.px(m(d[0]) + 4, d[1], 'gold', 5);
      });
    });
    // legs + feet
    k.sym(C, function (m, s) {
      k.tube([[m(36), 68, 2.4], [m(35), 72, 2.2]], 'aqua', { part: 'leg' + s });
      k.ellipse(m(34), 74, 4, 2.2, 'aqua', { part: 'leg' + s });
    });
    // body + tiger shorts
    k.ellipse(C, 63, 8, 6.5, 'aqua', { part: 'body' });
    k.px(36, 60, 'aqua', 5);
    k.poly([[31, 64], [49, 64], [50, 71], [43, 71], [C, 69], [37, 71], [30, 71]], 'thunder', { part: 'shorts' });
    [[33, 65, 34, 69], [36, 65, 35, 68], [44, 65, 45, 68], [47, 65, 46, 70], [41, 66, 42, 67]].forEach(function (l) { k.line(l[0], l[1], l[2], l[3], 'black', 1); });
    k.rect(30, 64, 20, 1, 'thunder', { adj: -2, clip: 'shorts' });
    // wild hair (lighter violet so the edge reads on dark), bolt forelock
    k.ellipse(C, 38, 13, 6, 'dark', { part: 'hair' });
    k.tube([[33, 36, 3], [28, 31, 1.8], [23, 30, 0.5]], 'dark', { part: 'hair' });
    k.tube([[39, 34, 3], [37, 29, 1.8], [34, 26, 0.5]], 'dark', { part: 'hair' });
    k.tube([[46, 35, 3], [50, 30, 1.8], [55, 29, 0.5]], 'dark', { part: 'hair' });
    k.tube([[29, 40, 2.4], [26, 38, 1.3], [24, 38, 0.5]], 'dark', { part: 'hair' });
    k.tube([[51, 40, 2.4], [54, 38, 1.3], [56, 38, 0.5]], 'dark', { part: 'hair' });
    k.texture('hair', 'fur', { seed: 3 });
    k.sym(C, function (m, s) { k.tube([[m(35), 36, 1.8], [m(34), 31.5, 1.1], [m(35), 29, 0.4]], 'bone', { part: 'horn' + s }); });
    // big head + ears
    k.sym(C, function (m, s) { k.ellipse(m(26), 48, 2.4, 3, 'aqua', { part: 'ear' + s }); });
    k.ellipse(C, 47, 13.5, 10.5, 'aqua', { part: 'head', light: 0.1 });
    k.tufts([[29, 40], [35, 38.5], [45, 38.5], [51, 40]], 'dark', { part: 'fringe', len: 3, w: 3, every: 2.5, seed: 5 });
    k.poly([[43, 36], [47, 36], [44.5, 40], [47, 40], [41, 46], [42.5, 41.5], [40.5, 41.5]], 'thunder', { part: 'bolt', shade: 'glow' });
    // right arm thrown up with a drumstick
    k.tube([[47, 61, 2.2], [52, 59, 2], [54, 55, 1.8]], 'aqua', { part: 'armR' });
    k.circle(54.5, 53.5, 2.6, 'aqua', { part: 'fistR' });
    k.tube([[55, 53, 1], [57, 45.5, 0.9]], 'wood', { part: 'bachi' });
    k.circle(57, 44.5, 2, 'red', { part: 'bknob' });
    // akanbe: left eye wide with the red under-lid dragged down by a finger
    k.eye(29, 42, { w: 6, h: 5, iris: 'red', side: 'L', angry: 0, lid: 0.1 });
    k.rect(29, 47, 6, 1, 'skin', { tone: 4, part: 'lidin', outline: 'none' });
    k.rect(30, 48, 4, 1, 'skin', { tone: 2, part: 'lidin', outline: 'none' });
    // right eye: cheeky squint
    pm(k, 45, 43, ['KKKKK.', '.KrWK.', '..KK..'], { K: ['black', 0], r: ['red', 4], W: ['white', 6] });
    k.line(45, 41, 51, 40, 'black', 0);
    // left arm up, finger dragging the lower lid
    k.tube([[33, 61, 2], [27, 57, 1.7], [29, 52, 1.5]], 'aqua', { part: 'armL' });
    k.ellipse(30, 51.5, 2.4, 2, 'aqua', { part: 'handL' });
    k.tube([[31, 50.5, 0.8], [31.5, 49, 0.7]], 'aqua', { part: 'finger' });
    // wide grin + tongue out
    k.mouth([[35, 51], [48, 51], [46, 55], [41, 56], [37, 54.5]], { tongue: false });
    k.tooth(37.5, 51, 37.7, 53, 1.8); k.tooth(45.5, 51, 45.3, 53, 1.8);
    k.tube([[42, 54, 1.9], [42.5, 57.5, 2], [42, 59.5, 1.3]], 'skin', { part: 'tongue' });
    k.line(42, 55, 42, 58, 'skin', 2);
    k.px(49, 49, 'sakura', 4); k.px(50, 49, 'sakura', 4); k.px(51, 49, 'sakura', 3);
  };

  // 19 ライジュウマル — thunder R, かっこいい: raijū wildcat crouched to pounce, lightning-striped fur, bolt tail.
  P[19] = function (k) {
    k.shadow(C, 76.5, 22, 2.3);
    // bolt tail
    k.poly([[52, 60], [61, 48], [57, 47], [66, 33], [62, 33], [71, 18], [60, 30], [64, 31], [55, 43], [59, 44], [48, 58]], 'thunder', { part: 'tail', shade: 'glow', halo: 0.25 });
    // hind legs wide + back
    k.sym(C, function (m, s) {
      k.ellipse(m(27), 64, 7, 7.5, 'thunder', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(24.5), 73.5, 5.5, 2.6, 'thunder', { part: 'haunch' + s, shift: -1 });
      k.texture('haunch' + s, 'fur', { seed: 2 });
      k.path([[m(22), 60], [m(25), 63], [m(23), 66]], 'obsidian', 2);
    });
    // chest
    k.ellipse(C, 60, 11, 11, 'thunder', { part: 'body' });
    k.texture('body', 'fur', { seed: 3 });
    k.ellipse(C, 61, 6, 9, 'cream', { clip: 'body' });
    k.tufts([[46, 67], [34, 67]], 'cream', { part: 'chest', len: 3.5, w: 3, every: 2.5, seed: 4 });
    // forelegs splayed with claws
    k.sym(C, function (m, s) {
      k.tube([[m(33), 60, 3.4], [m(31), 67, 2.8], [m(30.5), 72, 2.8]], 'thunder', { part: 'leg' + s });
      k.ellipse(m(30), 73.5, 4.4, 2.6, 'thunder', { part: 'leg' + s });
      k.path([[m(30), 62], [m(33), 65], [m(31), 68]], 'obsidian', 2);
      [27.5, 30, 32.5].forEach(function (cx) { k.tooth(m(cx), 74, m(cx - 0.4), 76.5, 1.8, 'bone'); });
      k.texture('leg' + s, 'fur', { seed: 5 + s });
    });
    // mane ruff
    k.ellipse(C, 45, 16, 8, 'gold', { part: 'mane', light: 0.15 });
    k.tufts([[56, 50], [60, 44], [56, 38]], 'gold', { part: 'mane', len: 5, w: 4, every: 3, seed: 6 });
    k.tufts([[24, 38], [20, 44], [24, 50]], 'gold', { part: 'mane', len: 5, w: 4, every: 3, seed: 7 });
    k.tufts([[52, 52], [28, 52]], 'gold', { part: 'mane', len: 4, w: 3.5, every: 3, seed: 8 });
    k.texture('mane', 'fur', { seed: 9 });
    // ears
    k.sym(C, function (m, s) {
      k.spike(m(31), 32, m(25), 18, 8, 'thunder', { part: 'ear' + s });
      k.spike(m(31), 31, m(27), 22, 4, 'obsidian', { clip: 'ear' + s, tone: 2 });
      k.spike(m(26), 20, m(24), 15, 2, 'obsidian', { part: 'et' + s });
    });
    // head
    k.ellipse(C, 38, 12, 9.5, 'thunder', { part: 'head' });
    k.texture('head', 'fur', { seed: 10 });
    k.tufts([[29, 36], [27, 41], [30, 46]], 'thunder', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 11 });
    k.tufts([[50, 46], [53, 41], [51, 36]], 'thunder', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 12 });
    // lightning stripes on face
    k.sym(C, function (m) { k.path([[m(30), 33], [m(33), 35], [m(31), 36], [m(34), 38]], 'obsidian', 1); });
    k.path([[39, 29], [C, 31], [39, 32], [41, 34]], 'obsidian', 1);
    // muzzle
    k.ellipse(C, 44, 6, 4, 'cream', { part: 'muzzle' });
    pm(k, 38, 41, ['bKKK.', '.KKK.', '..K..'], { K: ['black', 1], b: ['black', 5] });
    // snarl
    k.mouth([[33, 45], [47, 45], [45, 49], [C, 50], [35, 49]], {});
    k.tooth(35, 45, 35.5, 48.5, 2.2); k.tooth(45, 45, 44.5, 48.5, 2.2);
    k.tooth(37.5, 49.5, 37.5, 47.5, 1.6); k.tooth(42.5, 49.5, 42.5, 47.5, 1.6);
    k.eye(30, 35, { w: 6, h: 4, iris: 'crystal', side: 'L', angry: 2, brow: false });
    k.eye(44, 35, { w: 6, h: 4, iris: 'crystal', side: 'R', angry: 2, brow: false });
    k.sym(C, function (m) { k.line(m(29), 33, m(36), 35, 'black', 0); });
    // sparks
    k.path([[14, 52], [17, 50], [15, 48], [18, 46]], 'crystal', 5);
    k.path([[64, 62], [67, 60], [65, 58]], 'crystal', 5);
  };

  // 20 ナルカミ — thunder SR, かっこいい: thunderbird perched on a storm cloud, bolt primaries, bolt crest.
  P[20] = function (k) {
    k.shadow(C, 76.5, 22, 2.2);
    // wings: wrist at the top outer corner, layered covert rows, bolt primaries
    k.sym(C, function (m, s) {
      k.poly([[m(33), 40], [m(20), 22], [m(9), 8], [m(4), 12], [m(2), 24], [m(3), 33], [m(8), 41], [m(16), 46], [m(25), 51], [m(32), 52]], 'water', { part: 'wing' + s });
      for (var r = 0; r < 3; r++) {
        var o = r * 5.5;
        k.tube([[m(12 + o * 0.2), 13 + o], [m(18 + o * 0.5), 26 + o], [m(30), 42 + o * 0.4]].map(function (p) { return [p[0], p[1], 0.6]; }), null, { adj: -2, clip: 'wing' + s });
        k.tube([[m(11 + o * 0.2), 14.5 + o], [m(17 + o * 0.5), 27.5 + o], [m(29), 43.5 + o * 0.4]].map(function (p) { return [p[0], p[1], 0.5]; }), null, { adj: 1, clip: 'wing' + s });
      }
      k.texture('wing' + s, 'fur', { seed: 2 + s });
      k.tufts(s > 0 ? [[m(4), 13], [m(2), 24], [m(3), 32]] : [[m(3), 32], [m(2), 24], [m(4), 13]], 'water', { part: 'wing' + s, len: 2.5, w: 3, every: 3.5, seed: 4, jitter: 0.2 });
      k.tube([[m(33), 40, 2.2], [m(20), 22, 1.6], [m(9), 8, 1]], 'water', { part: 'wb' + s, noseam: true, light: 0.3 });
      k.poly([[m(3), 30], [m(8), 38], [m(16), 43], [m(26), 48], [m(32), 49], [m(32), 52], [m(25), 51], [m(16), 46], [m(8), 41], [m(3), 33]], 'thunder', { clip: 'wing' + s });
      k.tube([[m(14), 18, 0.5], [m(8), 34, 0.5]], null, { adj: -1, clip: 'wing' + s });
      k.tube([[m(22), 28, 0.5], [m(17), 42, 0.5]], null, { adj: -1, clip: 'wing' + s });
      // bolt primaries
      [[4, 30, 0], [7, 39, 1], [14, 44.5, 2], [22, 49.5, 3]].forEach(function (f) {
        var x = f[0], y = f[1];
        k.poly([[m(x - 2), y - 2], [m(x + 2.5), y - 2], [m(x + 1), y + 3], [m(x + 3.5), y + 3], [m(x - 1.5), y + 11], [m(x), y + 5.5], [m(x - 2.5), y + 5.5]], 'thunder', { part: 'pr' + s + f[2], shade: 'glow' });
      });
      k.tooth(m(9), 9, m(7), 4, 2.4, 'bone');
    });
    // storm cloud perch
    [[26, 71, 7, 4.5], [C, 70, 8, 5.5], [54, 71, 7, 4.5], [33, 74, 7, 2.5], [47, 74, 7, 2.5]].forEach(function (c) { k.ellipse(c[0], c[1], c[2], c[3], 'stone', { part: 'cloud' }); });
    k.texture('cloud', 'dots', { seed: 3 });
    k.path([[22, 72], [26, 70], [30, 72]], 'stone', 2); k.path([[50, 72], [54, 70], [58, 72]], 'stone', 2);
    // tail fan
    k.poly([[34, 58], [46, 58], [53, 71], [46, 68], [C, 73], [34, 68], [27, 71]], 'thunder', { part: 'tailf', shift: -1 });
    k.line(C, 60, C, 71, 'thunder', 1); k.line(36, 61, 31, 69, 'thunder', 1); k.line(44, 61, 49, 69, 'thunder', 1);
    // body plumage: gold breast with chevron feathers
    k.sym(C, function (m, s) { k.ellipse(m(31), 44, 5, 5, 'thunder', { part: 'sh' + s }); k.texture('sh' + s, 'fur', { seed: 6 }); });
    k.ellipse(C, 50, 11.5, 12, 'thunder', { part: 'body' });
    k.ellipse(C, 53, 7, 8.5, 'cream', { clip: 'body' });
    for (var y = 46; y <= 60; y += 3) { k.path([[35, y], [C, y + 2], [45, y]], 'thunder', 2); }
    k.sym(C, function (m) { k.tufts([[m(29), 44], [m(30), 54], [m(34), 60]].map(function (p) { return p; }), 'thunder', { part: 'body', len: 2.5, w: 3, every: 3, seed: 8 }); });
    k.texture('body', 'fur', { seed: 4 });
    // talons gripping the cloud
    k.sym(C, function (m, s) {
      k.tube([[m(35), 60, 2.2], [m(34.5), 66, 1.7]], 'gold', { part: 'shin' + s });
      k.tooth(m(33), 66, m(30), 69.5, 2, 'obsidian'); k.tooth(m(35), 66, m(35), 70.5, 2, 'obsidian'); k.tooth(m(36.5), 66, m(39), 69.5, 1.8, 'obsidian');
    });
    // bolt crest + swept-back side plumes
    k.sym(C, function (m, s) { k.tube([[m(33), 26, 2], [m(28), 20, 1.5], [m(22), 17, 0.5]], 'thunder', { part: 'plume' + s }); });
    k.poly([[37, 25], [42, 25], [45, 16], [41.5, 16], [46, 5], [36, 18], [40, 18]], 'thunder', { part: 'crest', shade: 'glow', halo: 0.3 });
    // neck ruff
    k.tufts([[29, 38], [34, 42], [46, 42], [51, 38]], 'thunder', { part: 'ruff', len: 4, w: 3.5, every: 2.5, seed: 4 });
    // head + hooked beak
    k.ellipse(C, 31, 9, 8, 'thunder', { part: 'head' });
    k.texture('head', 'fur', { seed: 2 });
    k.poly([[35.5, 32], [44.5, 32], [43, 36], [C, 41], [37, 36]], 'gold', { part: 'beak' });
    k.line(37, 35, 43, 35, 'gold', 1); k.px(C, 40, 'obsidian', 1);
    k.px(38, 33, 'gold', 6); k.px(37, 33, 'gold', 5);
    // heavy brow ridges + glare
    k.eye(31, 27, { w: 6, h: 4, iris: 'crystal', side: 'L', angry: 2, brow: false });
    k.eye(43, 27, { w: 6, h: 4, iris: 'crystal', side: 'R', angry: 2, brow: false });
    k.sym(C, function (m, s) { k.tube([[m(30), 25.5, 1.3], [m(38), 27.5, 1.3]], 'thunder', { part: 'brow' + s, light: 0.25 }); });
    // storm aura sparks
    k.path([[6, 58], [9, 55], [7, 53], [10, 50]], 'crystal', 5);
    k.path([[74, 58], [71, 55], [73, 53], [70, 50]], 'crystal', 5);
    k.sparkle(64, 5, 1, 'crystal'); k.sparkle(16, 4, 1, 'crystal');
  };

})();
