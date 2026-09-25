/* 封札モンスターズ — monster sprites, set 2 (ids 2, 3, 4, 6, 7, 8, 9, 13). 80x80 front-facing battle sprites at SFC density.
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
  var INK = { K: ['black', 0], k: ['black', 2], W: ['white', 6] };

  // 2 ヒダルマ — fire C (癒し): chubby lacquered fire daruma. Gag: only one eye painted in, the other still blank.
  P[2] = function (k) {
    k.shadow(C, 76.5, 15, 2);
    // head flame
    k.tube([[C, 41, 3.4], [38, 36, 2.8], [39.5, 31.5, 1.8], [43, 28.5, 0.5]], 'flame', { part: 'fl', shade: 'glow', halo: 0.3 });
    k.spike(42.5, 39, 46, 33.5, 3, 'flame', { part: 'fl' });
    // body
    k.ellipse(C, 61.5, 16.5, 13, 'red', { part: 'body' });
    k.ellipse(C, 51, 13.5, 11.5, 'red', { part: 'body' });
    k.texture('body', 'dots', { seed: 5 });
    k.ellipse(C, 72, 13, 2.6, null, { adj: -1, clip: 'body' });
    // gold hood trim around the face
    k.ellipse(C, 51, 11.2, 10.2, 'gold', { clip: 'body' });
    // gold cloud swirls on the belly
    var G = { g: ['gold', 5], h: ['gold', 6], d: ['gold', 3], s: ['red', 1] };
    var sw = ['.ggg..', 'g...g.', 'g.hg.g', '.d..gd', '..ddd.'];
    pm(k, 26, 61, sw, G); pm(k, 48, 61, mirror(sw), G);
    pm(k, 35, 64, ['..hgggh..', '.g.....g.', 'g..ggg..g', '.d.....d.', '..ddddd..'], G);
    k.px(C, 66, 'gold', 6);
    k.path([[28, 70], [32, 72], [C, 73], [48, 72], [52, 70]], 'red', 1);
    // lacquer highlight stroke on the upper left
    k.path([[28, 50], [28, 46], [30, 43]], 'red', 5); k.px(31, 42, 'red', 6); k.px(27, 55, 'red', 5);
    k.path([[26, 60], [25, 64]], 'red', 5);
    // face panel
    k.ellipse(C, 51.5, 9, 8.2, 'cream', { part: 'face', spec: false, light: 0.2 });
    // bushy painted brows (droop outward = gentle)
    k.tube([[33, 46.5, 0.9], [35, 44.7, 1.2], [38, 45, 0.8]], 'black', { part: 'bl', tone: 1, noseam: true, outline: 'none' });
    k.tube([[47, 46.5, 0.9], [45, 44.7, 1.2], [42, 45, 0.8]], 'black', { part: 'br', tone: 1, noseam: true, outline: 'none' });
    // painted eye (L) and blank eye (R)
    var E = { K: ['black', 0], P: ['black', 0], g: ['white', 6], W: ['white', 6], w: ['white', 4], k: ['black', 3] };
    pm(k, 33, 47, ['.KKKK.', 'KWPgPK', 'KWPPPK', 'KwWWwK', '.KKKK.'], E);
    pm(k, 42, 47, ['.kkkk.', 'kWWWWk', 'kWWWWk', 'kwwwwk', '.kkkk.'], E);
    // nose, mustache, calm smile, blush
    pm(k, 39, 51, ['.n.', 'nNn'], { n: ['skin', 4], N: ['skin', 3] });
    k.path([[38, 53], [36, 53], [35, 54]], 'black', 1); k.path([[42, 53], [44, 53], [45, 54]], 'black', 1);
    k.path([[37, 55], [38, 56], [42, 56], [43, 55]], 'black', 0);
    k.px(39, 57, 'black', 2); k.px(40, 57, 'black', 2); k.px(41, 57, 'black', 2);
    k.rect(32, 54, 2, 1, 'sakura', { tone: 4, part: 'bl1', outline: 'none' });
    k.rect(46, 54, 2, 1, 'sakura', { tone: 4, part: 'bl2', outline: 'none' });
    // warm embers
    k.sparkle(19, 46, 1, 'light'); k.sparkle(62, 54, 1, 'light'); k.px(58, 40, 'flame', 5); k.px(22, 58, 'flame', 5);
  };

  // 3 カエンジシ — fire R (かっこいい): shishi lion with a blazing mane and gold brow plate, mid-roar.
  P[3] = function (k) {
    k.shadow(C, 76.5, 22, 2.4);
    // flame-tipped tail
    k.tube([[52, 67, 2.6], [60, 66, 2.2], [64, 60, 1.8], [63, 55, 1.6]], 'fur', { part: 'tail', shift: -1 });
    k.tube([[63, 56, 3.6], [65, 50, 3], [62, 44, 0.6]], 'flame', { part: 'tailf', shade: 'glow', halo: 0.25 });
    k.spike(66, 53, 70, 46, 3, 'flame', { part: 'tailf' });
    // hind legs, wide and back
    k.sym(C, function (m, s) {
      k.ellipse(m(26), 64, 6.5, 7, 'fur', { part: 'hip' + s, shift: -1 });
      k.tube([[m(25), 67, 3], [m(23), 72.5, 2.6]], 'fur', { part: 'hip' + s, shift: -1 });
      k.ellipse(m(22), 74, 4.5, 2.2, 'fur', { part: 'hp' + s, shift: -1 });
    });
    // chest
    k.ellipse(C, 60, 12.5, 10.5, 'fur', { part: 'body' });
    k.texture('body', 'fur', { seed: 2 });
    // muscular forelegs
    k.sym(C, function (m, s) {
      k.tube([[m(33), 58, 4.8], [m(32), 64, 3.6], [m(31.5), 67, 3.9], [m(31), 71.5, 3.4]], 'fur', { part: 'leg' + s });
      k.ellipse(m(31), 73.5, 5, 2.6, 'fur', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 6 + s });
      k.tube([[m(35.5), 59, 0.7], [m(34.5), 65, 0.6]], null, { adj: -1, clip: 'leg' + s });
      k.tube([[m(30), 58, 0.7], [m(29.5), 64, 0.6]], null, { adj: 1, clip: 'leg' + s });
      k.px(m(29), 67, 'fur', 5);
      [28.5, 31, 33.5].forEach(function (cx) { k.tooth(m(cx), 74.5, m(cx - 0.3), 77, 1.8, 'bone'); });
      k.px(m(30), 74, 'fur', 1); k.px(m(32), 74, 'fur', 1);
    });
    // blazing mane
    var R = 15.5, pts = [];
    for (var a = -200; a <= 20; a += 12) { var r = a * Math.PI / 180; pts.push([C + Math.cos(r) * R, 37 + Math.sin(r) * R * 0.95]); }
    k.ellipse(C, 38, 16, 15, 'fire', { part: 'mane' });
    k.tufts(pts, 'fire', { part: 'mane', len: 5, w: 4.5, every: 3.4, seed: 3 });
    k.tufts(pts.slice(1, -1), 'flame', { part: 'mtip', len: 4, w: 2.4, every: 6.8, seed: 9, shade: 'glow', halo: 0.2 });
    k.texture('mane', 'fur', { seed: 4 });
    // chest drape of the mane
    k.tufts([[51, 50], [45, 53], [35, 53], [29, 50]], 'fire', { part: 'drape', len: 6, w: 4, every: 3, seed: 5 });
    // flame locks (hand grooves)
    [[[27, 30], [25, 37], [27, 45]], [[53, 30], [55, 37], [53, 45]], [[31, 23], [27, 27]], [[49, 23], [53, 27]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 0.6]; }), null, { adj: -2, clip: 'mane' });
      k.tube(f.map(function (p) { return [p[0] + 1.3, p[1], 0.5]; }), null, { adj: 1, clip: 'mane' });
    });
    // head
    k.ellipse(C, 40, 10.5, 9.5, 'fur', { part: 'head' });
    k.texture('head', 'fur', { seed: 8 });
    // brow plate
    k.poly([[29, 35], [33, 30], [C, 28.5], [47, 30], [51, 35], [47, 36], [C, 34], [33, 36]], 'gold', { part: 'plate' });
    k.poly([[33, 30], [C, 28.5], [C, 34], [33, 36]], null, { adj: 1, clip: 'plate' });
    k.circle(C, 32, 1.8, 'red', { part: 'gem' }); k.px(39, 31, 'white', 6);
    k.px(32, 33, 'steel', 5); k.px(48, 33, 'steel', 5);
    // eyes under the plate
    k.eye(31, 35, { w: 6, h: 4, iris: 'thunder', side: 'L', angry: 2, brow: false });
    k.eye(43, 35, { w: 6, h: 4, iris: 'thunder', side: 'R', angry: 2, brow: false });
    // muzzle + nose
    k.sym(C, function (m, s) { k.ellipse(m(36), 44.5, 4.6, 3.4, 'cream', { part: 'muz' + s }); });
    pm(k, 37, 40, ['bKKKKK.', '.KKKKK.', '..KKK..'], { K: ['black', 1], b: ['black', 5] });
    k.px(38, 40, 'black', 5);
    // roaring maw
    k.mouth([[32, 46], [48, 46], [46, 51.5], [C, 53.5], [34, 51.5]], {});
    k.tooth(34.5, 46, 35, 50, 2.6); k.tooth(45.5, 46, 45, 50, 2.6);
    k.tooth(38.5, 46, 38.5, 48, 1.6); k.tooth(41.5, 46, 41.5, 48, 1.6);
    k.tooth(36, 52, 36, 49.5, 2); k.tooth(44, 52, 44, 49.5, 2);
    // snarl wrinkles
    k.px(33, 41, 'fur', 1); k.px(34, 42, 'fur', 1); k.px(47, 41, 'fur', 1); k.px(46, 42, 'fur', 1);
    k.sparkle(12, 30, 1, 'flame'); k.px(68, 30, 'flame', 5); k.px(15, 52, 'flame', 4);
  };

  // 4 ヤケガニ — fire R (かわいい/コミカル): hot-spring volcano crab. Gag: a folded bath towel on its head, one giant claw.
  P[4] = function (k) {
    k.shadow(C, 76.5, 24, 2.2);
    // walking legs (behind)
    k.sym(C, function (m, s) {
      for (var i = 0; i < 3; i++) {
        var bx = 31 + i * 2.5, kx = 22 + i * 4.5, tx = 18 + i * 5;
        k.tube([[m(bx), 58 + i, 2.2], [m(kx), 57 + i * 2, 2], [m(tx), 74, 1]], 'magma', { part: 'lg' + s + i, shift: -1 });
        k.px(m(kx), 57 + i * 2, 'magma', 5);
      }
    });
    // underbody / face plate
    k.ellipse(C, 59, 11, 5.5, 'fire', { part: 'belly' });
    // shell
    k.ellipse(C, 51, 17.5, 10.5, 'magma', { part: 'shell' });
    k.tufts([[23, 53], [26, 46], [33, 41.5]], 'magma', { part: 'shell', len: 2.4, w: 3, every: 3.5, seed: 2 });
    k.tufts([[47, 41.5], [54, 46], [57, 53]], 'magma', { part: 'shell', len: 2.4, w: 3, every: 3.5, seed: 3 });
    k.texture('shell', 'stone', { size: 4, seed: 3 });
    // glowing lava cracks
    k.path([[31, 50], [34, 53], [33, 57]], 'flame', 5); k.path([[48, 49], [46, 53], [48, 56]], 'flame', 5);
    k.path([[C, 53], [39, 57]], 'flame', 4); k.px(34, 53, 'flame', 6); k.px(46, 53, 'flame', 6);
    var B = { h: ['magma', 6], l: ['magma', 5], s: ['magma', 1] };
    pm(k, 27, 47, ['.l.', 'lhl', '.s.'], B); pm(k, 51, 46, ['.l.', 'lhl', '.s.'], B); pm(k, 36, 45, ['l.l'], B);
    // face: happy little mouth + blush
    k.path([[36, 58], [37, 59], [38, 58], [39, 59], [40, 59]], 'black', 0);
    k.mouth([[38.5, 58.5], [42.5, 58.5], [42, 61], [39, 61]], {});
    k.path([[40, 59], [41, 58], [42, 59], [43, 58]], 'black', 0);
    k.rect(31, 57, 2, 1, 'sakura', { tone: 5, part: 'bs1', outline: 'none' });
    k.rect(48, 57, 2, 1, 'sakura', { tone: 5, part: 'bs2', outline: 'none' });
    // folded towel
    k.poly([[33, 42], [47, 42], [46.5, 36.5], [33.5, 36.5]], 'white', { part: 'towel', flat: true });
    k.texture('towel', 'cloth', { size: 2 });
    k.rect(33, 38, 14, 1, 'water', { part: 'stripe', tone: 4, outline: 'none' });
    k.rect(33, 40, 14, 1, 'water', { part: 'stripe', tone: 3, outline: 'none' });
    k.line(34, 37, 45, 37, 'white', 6); k.line(33, 41, 46, 41, 'white', 2);
    k.px(47, 39, 'white', 3); k.px(47, 40, 'white', 2);
    // stalk eyes
    k.sym(C, function (m, s) {
      k.tube([[m(34.5), 44, 1.4], [m(31), 36, 1.2]], 'magma', { part: 'st' + s });
      k.ellipse(m(30.5), 32.5, 4, 3.8, 'magma', { part: 'eb' + s });
    });
    k.eye(28, 31, { w: 5, h: 4, iris: 'thunder', side: 'L', angry: 0, lid: 0.25, look: [0.5, 0], brow: false });
    k.eye(48, 31, { w: 5, h: 4, iris: 'thunder', side: 'R', angry: 0, lid: 0.25, look: [-0.5, 0], brow: false });
    // steam
    var st = { part: 'steam1', outline: 'soft', shade: 'flat', flatTone: 5 };
    k.tube([[22, 42, 1.4], [20, 37, 1.6], [22, 33, 1.2], [20, 29, 0.7]], 'white', st);
    k.tube([[58, 41, 1.4], [60, 36, 1.6], [58, 32, 1.1], [60, 28, 0.6]], 'white', { part: 'steam2', outline: 'soft', shade: 'flat', flatTone: 5 });
    k.px(21, 36, 'white', 6); k.px(59, 35, 'white', 6);
    // GIANT claw (left)
    k.tube([[26, 56, 3.2], [19, 55, 3], [15, 50, 3]], 'magma', { part: 'armL' });
    k.tube([[9, 40, 3.6], [6, 33, 2.8], [8, 26, 1.2]], 'magma', { part: 'fA' });
    k.tube([[17, 40, 3.2], [19, 33, 2.4], [16, 28, 0.8]], 'magma', { part: 'fB' });
    k.ellipse(13, 44.5, 8, 6.5, 'magma', { part: 'claw' });
    k.texture('claw', 'stone', { size: 3, seed: 7 });
    k.tube([[9, 42, 0.6], [11, 47, 0.6]], null, { adj: 1, clip: 'claw' });
    [[9, 34], [8.5, 30], [16.5, 34], [17, 31]].forEach(function (p, i) { k.px(p[0] + (i < 2 ? 1 : -1), p[1], 'bone', 5); });
    k.px(12, 45, 'magma', 6); k.px(11, 44, 'magma', 5);
    // small claw (right)
    k.tube([[54, 57, 2.4], [60, 56, 2.2], [63, 52, 2]], 'magma', { part: 'armR' });
    k.spike(62, 49, 60.5, 44, 3, 'magma', { part: 'sfA' });
    k.spike(66, 49, 67, 44.5, 2.6, 'magma', { part: 'sfB' });
    k.ellipse(64, 50.5, 3.6, 3, 'magma', { part: 'sclaw' });
    k.px(63, 50, 'magma', 6);
    k.sparkle(70, 62, 1, 'white');
  };

  // 6 シズクン — water C (癒し): droplet child in a lotus-leaf hat, dozing on a bubble. Gag: sleep-drool drop.
  P[6] = function (k) {
    k.shadow(C, 76.5, 11, 1.6);
    // ripples
    var RP = { a: ['ice', 5], b: ['ice', 3] };
    pm(k, 22, 74, ['aab.....................bbaa'.slice(0, 7), '..baa..'], RP);
    pm(k, 51, 74, ['.baa...', 'aab....'], RP);
    // bubble seat
    k.circle(C, 64, 10.5, 'ice', { part: 'bub', halo: 0.25, light: 0.15 });
    k.ellipse(42, 66, 6.5, 6, 'crystal', { clip: 'bub', shade: 'flat', flatTone: 4 });
    k.tube([[32, 64, 0.8], [33, 59, 0.8], [36, 56, 0.6]], 'white', { clip: 'bub', tone: 6 });
    k.px(47, 70, 'white', 6); k.px(48, 69, 'white', 5);
    // legs dangling over the front
    k.sym(C, function (m, s) {
      k.tube([[m(37.5), 57, 2], [m(36), 62, 1.6]], 'water', { part: 'leg' + s, light: 0.2 });
      k.ellipse(m(35.5), 63.5, 2, 1.6, 'water', { part: 'leg' + s });
    });
    // lotus-petal skirt + body
    k.ellipse(C, 51, 4.6, 4.5, 'water', { part: 'body', light: 0.2 });
    k.sym(C, function (m, s) {
      k.leaf(m(38), 54, m(32), 58, 4, 'sakura', { part: 'pa' + s });
      k.leaf(m(C), 54, m(37.5), 59.5, 4, 'sakura', { part: 'pb' + s });
    });
    k.leaf(C, 54, C, 60, 4, 'sakura', { part: 'pc' });
    // arms resting on the bubble
    k.sym(C, function (m, s) {
      k.tube([[m(36.5), 49.5, 1.5], [m(33), 54, 1.3], [m(31), 56.5, 1.4]], 'water', { part: 'arm' + s, light: 0.2 });
    });
    // droplet hair locks
    k.sym(C, function (m, s) {
      k.tube([[m(33), 37, 2.4], [m(31), 43, 2], [m(32), 47, 1.3], [m(34.5), 48, 0.6]], 'water', { part: 'lock' + s });
    });
    // head
    k.ellipse(C, 42, 8, 7.5, 'water', { part: 'head', light: 0.3 });
    k.ellipse(C, 44, 6, 4.5, 'aqua', { clip: 'head', light: 0.35 });
    // sleepy face
    var F = { K: ['black', 0], s: ['sakura', 4] };
    pm(k, 34, 43, ['K...K', '.KKK.'], F); pm(k, 42, 43, ['K...K', '.KKK.'], F);
    pm(k, 38, 47, ['K..K', '.KK.'], F);
    k.rect(34, 46, 2, 1, 'sakura', { tone: 4, part: 'cs1', outline: 'none' });
    k.rect(45, 46, 2, 1, 'sakura', { tone: 4, part: 'cs2', outline: 'none' });
    k.px(35, 39, 'white', 6); k.px(36, 39, 'water', 6);
    // lotus-leaf hat
    k.ellipse(C, 35.5, 14, 3.6, 'grass', { part: 'hat' });
    k.ellipse(C, 33.5, 7, 3.2, 'grass', { part: 'hat' });
    k.poly([[C, 35], [37.5, 39.5], [42.5, 39.5]], null, { erase: true });
    [[27, 36], [32, 38], [48, 38], [53, 36], [34, 32], [46, 32]].forEach(function (p) { k.line(C, 34, p[0], p[1], 'grass', 2); });
    k.path([[27, 34], [32, 32.5]], 'grass', 5); k.px(35, 31, 'grass', 6);
    k.tube([[C, 31, 0.8], [41.5, 28.5, 0.7], [43.5, 27, 0.5]], 'grass', { part: 'stem', shade: 'flat', flatTone: 4 });
    // lotus bud on the brim
    k.leaf(51, 34, 53, 28, 3.6, 'sakura', { part: 'bud' });
    k.leaf(50, 34, 48, 29.5, 2.6, 'sakura', { part: 'bud2' });
    k.px(52, 30, 'sakura', 6);
    // floating bubbles
    k.circle(20, 50, 1.8, 'ice', { part: 'b1' }); k.px(19, 49, 'white', 6);
    k.circle(60, 46, 1.4, 'ice', { part: 'b2' }); k.px(59, 45, 'white', 6);
    k.sparkle(62, 58, 1, 'ice');
  };

  // 7 カッパチ — water C (かわいい): kappa kid with a turtle-shell backpack. Gag: winking, cucumber already bitten.
  P[7] = function (k) {
    k.shadow(C, 76.5, 15, 2);
    // shell backpack
    k.ellipse(C, 57, 15, 12.5, 'leaf', { part: 'shell', shift: -1 });
    k.texture('shell', 'scales', { size: 5, seed: 2 });
    k.tufts([[25, 64], [25, 52], [30, 46]], 'cream', { part: 'rimL', len: 2, w: 2.6, every: 3, seed: 4 });
    k.tufts([[50, 46], [55, 52], [55, 64]], 'cream', { part: 'rimR', len: 2, w: 2.6, every: 3, seed: 5 });
    // legs + webbed feet
    k.sym(C, function (m, s) {
      k.tube([[m(35), 66, 3], [m(34), 72, 2.6]], 'aqua', { part: 'leg' + s });
      k.ellipse(m(33.5), 74, 5.5, 2.4, 'aqua', { part: 'leg' + s });
      k.px(m(30), 75, 'aqua', 1); k.px(m(33), 75, 'aqua', 1); k.px(m(36), 75, 'aqua', 1);
    });
    // body + belly plate
    k.ellipse(C, 63, 10, 9, 'aqua', { part: 'body' });
    k.ellipse(C, 65, 6.5, 6.8, 'cream', { clip: 'body' });
    for (var y = 61; y <= 70; y += 3) k.rect(34, y, 12, 1, 'cream', { adj: -1, clip: 'body' });
    // backpack straps
    k.sym(C, function (m, s) { k.tube([[m(32), 55, 1.2], [m(33), 63, 1.1]], 'red', { part: 'strap' + s }); });
    // cucumber held across the body
    k.tube([[27, 64, 2.6], [37, 61, 3], [48, 56, 2.6]], 'grass', { part: 'cuc' });
    [[29, 62], [33, 61], [36, 59], [40, 59], [43, 57]].forEach(function (p) { k.px(p[0], p[1], 'grass', 5); });
    [[31, 65], [38, 63], [44, 60]].forEach(function (p) { k.px(p[0], p[1], 'grass', 1); });
    k.ellipse(48.5, 55.5, 2.3, 2.6, 'cream', { part: 'cut', shade: 'flat', flatTone: 5 });
    k.circle(51, 53, 1.8, null, { erase: true });
    k.px(48, 55, 'leaf', 4); k.px(49, 56, 'leaf', 4);
    // webbed hands
    k.sym(C, function (m, s) {
      k.tube([[m(31), 56, 2.2], [m(29.5), 60, 2]], 'aqua', { part: 'arm' + s });
    });
    k.ellipse(28.5, 63, 3.2, 3, 'aqua', { part: 'hL' });
    k.ellipse(47, 58.5, 3, 2.8, 'aqua', { part: 'hR' });
    k.px(27, 65, 'aqua', 1); k.px(29, 65, 'aqua', 1); k.px(46, 60, 'aqua', 1); k.px(48, 60, 'aqua', 1);
    // hair fringe
    var hp = [];
    for (var a = 190; a <= 350; a += 10) { var r = a * Math.PI / 180; hp.push([C + Math.cos(r) * 11.5, 42 + Math.sin(r) * 8.5]); }
    k.ellipse(C, 42, 12, 9, 'grass', { part: 'hair', shift: -2 });
    k.tufts(hp, 'grass', { part: 'hair', len: 3, w: 3, every: 2.6, seed: 6 });
    // head
    k.ellipse(C, 46, 12, 9.5, 'aqua', { part: 'head' });
    k.texture('head', 'dots', { seed: 4 });
    k.tufts([[30, 38], [36, 39.5], [44, 39.5], [50, 38]].reverse(), 'grass', { part: 'fringe', shift: -2, len: 3, w: 3, every: 2.5, seed: 8 });
    // head plate with water
    k.ellipse(C, 35, 7.5, 2.8, 'bone', { part: 'plate' });
    k.ellipse(C, 35, 5.6, 1.7, 'water', { part: 'pw', shade: 'flat', flatTone: 4, outline: 'none' });
    k.line(36, 35, 38, 34, 'water', 6); k.px(44, 36, 'water', 5);
    // beak with a cheeky grin
    k.poly([[33.5, 49], [46.5, 49], [44.5, 53.5], [C, 55], [35.5, 53.5]], 'thunder', { part: 'beak' });
    k.path([[34, 51], [36, 52], [C, 52], [44, 51], [46, 49]], 'black', 0);
    k.px(38, 49, 'black', 1); k.px(42, 49, 'black', 1);
    pm(k, 42, 52, ['pp', 'p.'], { p: ['skin', 4] });
    // eyes: glare + wink
    k.eye(31, 42, { w: 5, h: 4, iris: 'red', side: 'L', angry: 0.4, lid: 0.3, look: [0.4, 0] });
    pm(k, 44, 43, ['.KKK.', 'K...K', '.....'], INK);
    k.line(44, 40, 48, 39, 'black', 0);
    k.rect(30, 47, 2, 1, 'sakura', { tone: 4, part: 'ck1', outline: 'none' });
    k.rect(48, 47, 2, 1, 'sakura', { tone: 4, part: 'ck2', outline: 'none' });
    k.px(62, 40, 'water', 5); k.sparkle(60, 34, 1, 'ice');
  };

  // 8 ナミウルフ — water R (かっこいい): wolf of breaking waves, foam ruff and fin ears, crouched to spring.
  P[8] = function (k) {
    k.shadow(C, 76.5, 22, 2.3);
    // breaking-wave tail
    k.tube([[52, 62, 3.6], [60, 58, 3.6], [65, 50, 3.2], [65, 42, 2.4], [61, 38, 1.2]], 'water', { part: 'tail', shift: -1 });
    k.tufts([[62, 38], [66, 43], [67, 51], [62, 59]], 'ice', { part: 'tfoam', len: 3, w: 2.6, every: 2.5, seed: 3 });
    // hind legs
    k.sym(C, function (m, s) {
      k.ellipse(m(26), 63, 7, 7, 'water', { part: 'hip' + s, shift: -1 });
      k.tube([[m(24), 67, 3], [m(22), 72, 2.4]], 'water', { part: 'hip' + s, shift: -1 });
      k.ellipse(m(21.5), 74, 4.6, 2.2, 'water', { part: 'hp' + s, shift: -1 });
    });
    // body
    k.ellipse(C, 59, 12, 10, 'water', { part: 'body' });
    k.texture('body', 'fur', { seed: 5 });
    // foam ruff
    k.ellipse(C, 48, 15, 11, 'ice', { part: 'ruff' });
    var rp = [];
    for (var a = 170; a >= 10; a -= 10) { var r = a * Math.PI / 180; rp.push([C + Math.cos(r) * 14, 49 + Math.sin(r) * 9]); }
    k.tufts(rp, 'ice', { part: 'ruff', len: 4, w: 3.4, every: 2.8, seed: 7 });
    k.texture('ruff', 'fur', { seed: 9 });
    // wave curls in the ruff
    k.sym(C, function (m, s) {
      k.tube([[m(29), 56, 0.7], [m(26), 51, 0.7], [m(27), 46, 0.6], [m(30), 45, 0.5]], null, { adj: -2, clip: 'ruff' });
      k.tube([[m(28), 57, 0.5], [m(25), 52, 0.5]], 'water', { clip: 'ruff', tone: 4 });
    });
    // crouched forelegs
    k.sym(C, function (m, s) {
      k.tube([[m(33), 57, 4.4], [m(30), 63, 3.3], [m(29), 67, 3.5], [m(28), 71.5, 3]], 'water', { part: 'leg' + s });
      k.ellipse(m(27.5), 73.5, 4.8, 2.5, 'water', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 11 + s });
      k.tube([[m(34.5), 59, 0.6], [m(32), 65, 0.5]], null, { adj: -1, clip: 'leg' + s });
      k.tube([[m(29.5), 58, 0.6], [m(27.5), 64, 0.5]], null, { adj: 1, clip: 'leg' + s });
      [25, 27.5, 30].forEach(function (cx) { k.tooth(m(cx), 74.5, m(cx - 0.4), 77, 1.6, 'bone'); });
    });
    // fin ears
    k.sym(C, function (m, s) {
      k.leaf(m(33), 33, m(23), 18, 8, 'aqua', { part: 'ear' + s });
      k.tube([[m(31), 31, 0.5], [m(26), 23, 0.5]], null, { adj: -2, clip: 'ear' + s });
      k.tube([[m(33), 29, 0.5], [m(29), 23, 0.5]], null, { adj: -1, clip: 'ear' + s });
      k.spike(m(29), 33, m(21), 29, 4, 'aqua', { part: 'cfin' + s });
    });
    // head
    k.ellipse(C, 39, 11, 9.5, 'water', { part: 'head' });
    k.tufts([[30, 38], [28, 43], [31, 47]], 'water', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 4 });
    k.tufts([[49, 47], [52, 43], [50, 38]], 'water', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 5 });
    k.texture('head', 'fur', { seed: 6 });
    // foam blaze on the brow
    k.poly([[37, 30], [C, 34], [43, 30], [42, 37], [C, 39], [38, 37]], 'ice', { clip: 'head' });
    // muzzle, nose, snarl
    k.ellipse(C, 46, 6.2, 4.6, 'ice', { part: 'muz' });
    pm(k, 38, 42, ['bKKK.', 'KKKKK', '.KKK.'], { K: ['black', 1], b: ['black', 5] });
    k.px(35, 43, 'ice', 2); k.px(45, 43, 'ice', 2); k.px(36, 44, 'ice', 2); k.px(44, 44, 'ice', 2);
    k.mouth([[33.5, 47], [46.5, 47], [44.5, 51], [C, 52.5], [35.5, 51]], { tongue: false });
    k.tooth(35.5, 47, 36, 50.5, 2.2); k.tooth(44.5, 47, 44, 50.5, 2.2);
    k.tooth(38.5, 47, 38.5, 48.5, 1.4); k.tooth(41.5, 47, 41.5, 48.5, 1.4);
    k.tooth(37.5, 51.5, 37.5, 49.5, 1.6); k.tooth(42.5, 51.5, 42.5, 49.5, 1.6);
    // eyes
    k.eye(30, 35, { w: 6, h: 4, iris: 'thunder', side: 'L', angry: 2, browMat: 'water', browTone: 1 });
    k.eye(44, 35, { w: 6, h: 4, iris: 'thunder', side: 'R', angry: 2, browMat: 'water', browTone: 1 });
    // spray
    k.sparkle(13, 40, 1, 'ice'); k.px(16, 34, 'ice', 5); k.px(66, 30, 'ice', 5); k.px(11, 58, 'ice', 4);
  };

  // 9 ユキオニ — water R (癒し/gentle giant): big white snow ogre cradling a little red bird.
  P[9] = function (k) {
    k.shadow(C, 76.5, 22, 2.4);
    // feet
    k.sym(C, function (m, s) {
      k.ellipse(m(30), 72.5, 7.5, 3.8, 'white', { part: 'ft' + s });
      k.px(m(26), 75, 'white', 2); k.px(m(29), 75, 'white', 2); k.px(m(32), 75, 'white', 2);
    });
    // body
    k.ellipse(C, 56, 18, 15.5, 'white', { part: 'body' });
    k.tufts([[23, 48], [21, 56], [24, 66], [30, 70]], 'white', { part: 'body', len: 3, w: 3, every: 2.6, seed: 4 });
    k.tufts([[50, 70], [56, 66], [59, 56], [57, 48]], 'white', { part: 'body', len: 3, w: 3, every: 2.6, seed: 5 });
    k.texture('body', 'fur', { seed: 7 });
    k.ellipse(C, 60, 10, 9, 'ice', { clip: 'body', light: 0.1 });
    // arms cradling
    k.sym(C, function (m, s) {
      k.tube([[m(25), 45, 5.2], [m(22), 54, 4.6], [m(28), 61, 4], [m(34), 62, 3.6]], 'white', { part: 'arm' + s });
      k.texture('arm' + s, 'fur', { seed: 12 + s });
      k.tube([[m(22), 48, 0.6], [m(21), 55, 0.6], [m(25), 60, 0.5]], null, { adj: 1, clip: 'arm' + s });
    });
    // little red bird
    k.ellipse(C, 58.5, 4.2, 3.2, 'red', { part: 'bird' });
    k.circle(C, 54.5, 2.8, 'red', { part: 'bird' });
    k.ellipse(C, 59.5, 2.2, 1.8, 'cream', { clip: 'bird', tone: 5 });
    k.px(38, 54, 'black', 0); k.px(41, 54, 'black', 0);
    pm(k, 39, 55, ['gg', '.g'], { g: ['gold', 5] });
    k.spike(C, 52, 41, 49.5, 1.6, 'red', { part: 'crest' });
    k.px(36, 58, 'red', 2); k.px(44, 58, 'red', 2);
    // mitten hands
    k.sym(C, function (m, s) {
      k.ellipse(m(35), 61.5, 3.6, 3.2, 'white', { part: 'hand' + s });
      k.px(m(33), 62, 'white', 2); k.px(m(35), 63, 'white', 2);
    });
    // head
    k.ellipse(C, 36, 12.5, 10.5, 'white', { part: 'head' });
    k.tufts([[27, 36], [29, 30], [34, 26.5], [C, 25.5], [46, 26.5], [51, 30], [53, 36]], 'white', { part: 'head', len: 3, w: 3, every: 2.4, seed: 6 });
    k.texture('head', 'fur', { seed: 9 });
    // tiny horns
    k.sym(C, function (m, s) { k.tube([[m(34.5), 27, 1.8], [m(33), 23, 1.2], [m(33.5), 21, 0.5]], 'gold', { part: 'horn' + s }); });
    // face
    k.ellipse(C, 39, 8.5, 6.3, 'ice', { part: 'face', light: 0.25, spec: false });
    // droopy kind eyes
    var E = { K: ['black', 0], P: ['water', 1], W: ['white', 6], b: ['white', 3] };
    pm(k, 33, 36, ['.bb..', 'KKKK.', 'KPWP.', '.KK..'], E);
    pm(k, 43, 36, ['..bb.', '.KKKK', '.PWPK', '..KK.'], E);
    // rosy cheeks, button nose, soft smile with one little tusk
    k.sym(C, function (m) { k.rect(m(33) - (m(33) > C ? 1 : 0), 41, 2, 1, 'sakura', { tone: 4, part: 'rc' + m(33), outline: 'none' }); });
    pm(k, 39, 39, ['nn', 'NN'], { n: ['ice', 5], N: ['ice', 2] });
    k.path([[37, 42], [38, 43], [42, 43], [43, 42]], 'black', 0);
    k.px(41, 44, 'white', 6);
    // snowflakes
    k.sparkle(14, 30, 1, 'ice'); k.sparkle(66, 38, 1, 'ice'); k.px(62, 24, 'ice', 5); k.px(18, 62, 'ice', 5);
  };

  // 13 コケモチ — grass C (癒し): sleepy mossy tortoise with a flower-garden boulder shell. Gag: nose bubble.
  P[13] = function (k) {
    k.shadow(C, 76.5, 21, 2.2);
    // stubby feet
    k.sym(C, function (m, s) {
      k.ellipse(m(24), 71.5, 5.2, 4.2, 'leaf', { part: 'ft' + s });
      k.px(m(21), 75, 'bone', 5); k.px(m(24), 75, 'bone', 5); k.px(m(27), 75, 'bone', 4);
      k.px(m(22), 70, 'leaf', 5);
    });
    // boulder shell
    k.ellipse(C, 54, 20, 16, 'stone', { part: 'shell' });
    k.texture('shell', 'stone', { size: 5, seed: 4 });
    k.ellipse(C, 66.5, 18.5, 4, 'stone', { part: 'rim', shift: -1 });
    k.texture('rim', 'stone', { size: 3, seed: 5 });
    // moss blanket with drips
    var mp = [[21, 50], [26, 45], [30, 47], [34, 43], [40, 46], [46, 43], [50, 47], [54, 45], [59, 50]];
    k.poly([[20, 52], [22, 44], [28, 40], [C, 37.5], [52, 40], [58, 44], [60, 52]].concat(mp.slice().reverse()), 'grass', { part: 'moss' });
    k.tufts(mp.slice().reverse(), 'grass', { part: 'moss', len: 3, w: 2.4, every: 2.3, seed: 12 });
    k.tufts([[21, 45], [27, 40], [34, 38], [C, 37.5], [46, 38], [53, 40], [59, 45]], 'grass', { part: 'moss', len: 2.2, w: 2, every: 2.2, seed: 4 });
    k.texture('moss', 'fur', { seed: 5 });
    // flowers
    var FL = { p: ['sakura', 5], q: ['sakura', 3], y: ['gold', 5], w: ['white', 6], v: ['white', 4] };
    pm(k, 29, 40, ['.p.', 'pyp', '.q.'], FL);
    pm(k, 46, 39, ['.w.', 'wyw', '.v.'], FL);
    pm(k, 38, 36, ['.p.', 'pyp', '.q.'], FL);
    pm(k, 53, 44, ['.w.', 'wyw', '.v.'], FL);
    k.px(24, 45, 'gold', 5); k.px(35, 42, 'gold', 5);
    k.tube([[43, 38, 0.5], [44, 34, 0.5]], 'leaf', { part: 'sprout', shade: 'flat', flatTone: 4 });
    k.leaf(44, 34, 47, 32, 2.6, 'leaf', { part: 'sp1' }); k.leaf(44, 34, 41.5, 32, 2.4, 'leaf', { part: 'sp2' });
    // head poking out
    k.ellipse(C, 62, 8.5, 6.8, 'leaf', { part: 'head' });
    k.texture('head', 'scales', { size: 4, seed: 2 });
    k.ellipse(C, 65, 5.5, 3, 'cream', { clip: 'head', light: 0.1 });
    // sleepy content face
    pm(k, 33, 60, ['K...K', '.KKK.'], INK); pm(k, 43, 60, ['K...K', '.KKK.'], INK);
    k.path([[37, 65], [38, 66], [39, 66], [C, 65], [41, 66], [42, 66], [43, 65]], 'black', 0);
    k.rect(32, 63, 2, 1, 'sakura', { tone: 4, part: 'ck1', outline: 'none' });
    k.rect(47, 63, 2, 1, 'sakura', { tone: 4, part: 'ck2', outline: 'none' });
    k.px(39, 63, 'leaf', 1); k.px(41, 63, 'leaf', 1);
    // nose bubble
    k.circle(46.5, 67, 3, 'ice', { part: 'nb', halo: 0.2 });
    k.px(45, 66, 'white', 6);
    // Zz
    var Z = { z: ['white', 6], y: ['white', 4] };
    pm(k, 58, 32, ['zzz', '.z.', 'yyy'], Z);
    pm(k, 63, 27, ['zzzz', '..z.', '.z..', 'yyyy'], Z);
  };
})();
