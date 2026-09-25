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
  // points on an ellipse arc, angles in degrees (screen coords: increasing angle runs clockwise, so tufts point outward)
  function arc(cx, cy, rx, ry, a0, a1, step) {
    var p = [];
    for (var a = a0; step > 0 ? a <= a1 : a >= a1; a += step) { var r = a * Math.PI / 180; p.push([cx + Math.cos(r) * rx, cy + Math.sin(r) * ry]); }
    return p;
  }
  var INK = { K: ['black', 0], k: ['black', 2], W: ['white', 6] };
  var ZZ = { z: ['white', 6], y: ['white', 4] };

  // 2 ヒダルマ — fire C (癒し): chubby lacquered fire daruma on a cushion. Gag: only one eye painted in, the other still blank.
  P[2] = function (k) {
    k.shadow(C, 76.5, 21, 2);
    // head flame (one curling tube)
    k.tube([[C, 41, 3.4], [38, 36, 2.8], [39.5, 31.5, 1.8], [43, 28.5, 0.5]], 'flame', { part: 'fl', shade: 'glow', halo: 0.3 });
    k.spike(42.5, 39, 46, 33.5, 3, 'flame', { part: 'fl' });
    // body
    k.ellipse(C, 61.5, 16.5, 13, 'red', { part: 'body' });
    k.ellipse(C, 51, 13.5, 11.5, 'red', { part: 'body' });
    k.texture('body', 'dots', { seed: 5 });
    // gold hood trim around the face
    k.ellipse(C, 51, 11.4, 10.4, 'gold', { clip: 'body' });
    k.ellipse(C, 51, 11.4, 10.4, null, { adj: -1, clip: 'body', pattern: 'sparse' });
    // gold cloud swirls on the belly
    var G = { g: ['gold', 5], h: ['gold', 6], d: ['gold', 3], s: ['red', 1] };
    var sw = ['.ggg..', 'g...g.', 'g.hg.g', '.d..gd', '..ddd.'];
    pm(k, 26, 61, sw, G); pm(k, 48, 61, mirror(sw), G);
    pm(k, 35, 63, ['..hgggh..', '.g.....g.', 'g..ggg..g', '.d.....d.', '..ddddd..'], G);
    k.px(C, 65, 'gold', 6);
    // lacquer highlight strokes, belly shadow band
    k.path([[28, 50], [28, 46], [30, 43]], 'red', 5); k.px(31, 42, 'red', 6); k.px(27, 55, 'red', 5);
    k.path([[25, 59], [24, 63]], 'red', 5);
    k.path([[53, 58], [55, 62], [55, 66]], 'red', 1);
    // face panel
    k.ellipse(C, 51.5, 9, 8.2, 'cream', { part: 'face', spec: false, dither: false, flat: true, light: 0.3 });
    k.path([[34, 58], [37, 59], [43, 59], [46, 58]], 'cream', 3);
    // gentle painted brows
    k.path([[32, 45], [33, 44], [36, 44]], 'black', 1); k.path([[47, 45], [46, 44], [43, 44]], 'black', 1);
    // painted eye (L) and blank eye (R)
    var E = { K: ['black', 0], P: ['black', 0], g: ['white', 6], W: ['white', 6], w: ['white', 4] };
    pm(k, 33, 46, ['.KKK.', 'KWPgK', 'KwPPK', '.KKK.'], E);
    pm(k, 42, 46, ['.KKK.', 'KWWWK', 'KwwwK', '.KKK.'], E);
    // nose, big calm smile, blush
    pm(k, 39, 50, ['.n.', 'nNn'], { n: ['skin', 4], N: ['skin', 3] });
    pm(k, 35, 53, ['K.........K', '.K.......K.', '..KK...KK..', '....KKK....'], INK);
    pm(k, 37, 54, ['.MMMMM.', '..MSSM.', '....'], { M: ['mouth', 1], S: ['mouth', 4] });
    k.rect(32, 51, 3, 1, 'sakura', { tone: 4, part: 'bl1', outline: 'none' });
    k.rect(46, 51, 3, 1, 'sakura', { tone: 4, part: 'bl2', outline: 'none' });
    // zabuton cushion
    k.poly([[23, 70.5], [57, 70.5], [61, 76], [19, 76]], 'violet', { part: 'zab', flat: true, shift: -1 });
    k.texture('zab', 'cloth', { size: 2 });
    k.line(23, 72, 57, 72, 'violet', 4); k.line(22, 74, 58, 74, 'violet', 1);
    k.px(C, 72, 'gold', 5); k.px(C, 73, 'gold', 4);
    k.sym(C, function (m) { k.spike(m(20), 75, m(16.5), 77.5, 2.4, 'gold', { part: 'tas' + m(20) }); });
    // warm embers
    k.sparkle(19, 44, 1, 'light'); k.sparkle(62, 52, 1, 'light'); k.px(58, 38, 'flame', 5); k.px(21, 57, 'flame', 5);
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
      k.px(m(20), 75, 'fur', 0); k.px(m(23), 75, 'fur', 0);
    });
    // chest
    k.ellipse(C, 60, 12.5, 10.5, 'fur', { part: 'body' });
    k.texture('body', 'fur', { seed: 2 });
    // mane drape on the chest
    k.tufts([[50, 55], [45, 57], [35, 57], [30, 55]], 'fire', { part: 'drape', len: 5, w: 4, every: 2.8, seed: 5, shift: -1 });
    k.ellipse(C, 54, 10, 4, 'fire', { part: 'drape' });
    // muscular forelegs with flame elbow curls
    k.sym(C, function (m, s) {
      var o = s > 0 ? [[m(28.5), 66], [m(27), 60]] : [[m(27), 60], [m(28.5), 66]];
      k.tufts(o, 'fire', { part: 'curl' + s, len: 4, w: 3, every: 2.5, seed: 3 + s });
      k.tube([[m(33), 58, 4.8], [m(32), 64, 3.6], [m(31.5), 67, 3.9], [m(31), 71.5, 3.4]], 'fur', { part: 'leg' + s });
      k.ellipse(m(31), 73.5, 5.2, 2.7, 'fur', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 6 + s });
      k.tube([[m(35.5), 59, 0.7], [m(34.5), 65, 0.6]], null, { adj: -1, clip: 'leg' + s });
      k.tube([[m(30), 58, 0.7], [m(29.5), 64, 0.6]], null, { adj: 1, clip: 'leg' + s });
      k.px(m(29), 67, 'fur', 5); k.px(m(30), 67, 'fur', 5);
      k.px(m(29.5), 74, 'fur', 1); k.px(m(32.5), 74, 'fur', 1);
      [28, 31, 34].forEach(function (cx) { k.tooth(m(cx), 75, m(cx - 0.3), 77.4, 1.8, 'bone'); });
    });
    // blazing mane
    var pts = arc(C, 37.5, 15.5, 14.7, -200, 20, 12);
    k.ellipse(C, 38, 16, 15, 'fire', { part: 'mane' });
    k.tufts(pts, 'fire', { part: 'mane', len: 5, w: 4.5, every: 3.4, seed: 3 });
    k.tufts(pts.slice(1, -1), 'flame', { part: 'mtip', len: 4, w: 2.4, every: 6.8, seed: 9, shade: 'glow', halo: 0.2 });
    k.texture('mane', 'fur', { seed: 4 });
    [[[27, 30], [25, 37], [27, 45]], [[53, 30], [55, 37], [53, 45]], [[31, 23], [27, 27]], [[49, 23], [53, 27]]].forEach(function (f) {
      k.tube(f.map(function (p) { return [p[0], p[1], 0.6]; }), null, { adj: -2, clip: 'mane' });
      k.tube(f.map(function (p) { return [p[0] + 1.3, p[1], 0.5]; }), null, { adj: 1, clip: 'mane' });
    });
    // head
    k.ellipse(C, 40, 10.5, 9.5, 'fur', { part: 'head' });
    k.texture('head', 'fur', { seed: 8 });
    // brow plate
    k.poly([[29, 34], [33, 29.5], [C, 28], [47, 29.5], [51, 34], [47, 35], [C, 33], [33, 35]], 'gold', { part: 'plate' });
    k.poly([[33, 29.5], [C, 28], [C, 33], [33, 35]], null, { adj: 1, clip: 'plate' });
    k.circle(C, 31, 1.8, 'red', { part: 'gem' }); k.px(39, 30, 'white', 6);
    k.px(32, 32, 'steel', 5); k.px(48, 32, 'steel', 5);
    // eyes under the plate
    k.eye(31, 34, { w: 6, h: 5, iris: 'thunder', side: 'L', angry: 1.4, lid: 0.3, brow: false });
    k.eye(43, 34, { w: 6, h: 5, iris: 'thunder', side: 'R', angry: 1.4, lid: 0.3, brow: false });
    // muzzle + nose
    k.sym(C, function (m, s) { k.ellipse(m(36), 44.5, 4.6, 3.4, 'cream', { part: 'muz' + s }); });
    pm(k, 37, 39, ['.hnnnn.', '.nnnnN.', '..KnK..', '...K...'], { n: ['skin', 3], h: ['skin', 5], N: ['skin', 2], K: ['black', 0] });
    // roaring maw
    k.mouth([[32, 46], [48, 46], [46, 51.5], [C, 53.5], [34, 51.5]], {});
    k.tooth(34.5, 46, 35, 50, 2.6); k.tooth(45.5, 46, 45, 50, 2.6);
    k.tooth(38.5, 46, 38.5, 48, 1.6); k.tooth(41.5, 46, 41.5, 48, 1.6);
    k.tooth(36, 52, 36, 49.5, 2); k.tooth(44, 52, 44, 49.5, 2);
    // snarl wrinkles
    k.px(34, 40, 'fur', 1); k.px(35, 41, 'fur', 1); k.px(46, 40, 'fur', 1); k.px(45, 41, 'fur', 1);
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
    // underbody
    k.ellipse(C, 59, 11, 5.5, 'magma', { part: 'belly', shift: -1 });
    // shell
    k.ellipse(C, 51, 17.5, 10.5, 'magma', { part: 'shell' });
    k.tufts([[23, 53], [26, 46], [33, 41.5]], 'magma', { part: 'shell', len: 2.4, w: 3, every: 3.5, seed: 2 });
    k.tufts([[47, 41.5], [54, 46], [57, 53]], 'magma', { part: 'shell', len: 2.4, w: 3, every: 3.5, seed: 3 });
    k.texture('shell', 'stone', { size: 4, seed: 3 });
    // glowing lava cracks
    k.path([[30, 47], [32, 51], [30, 55]], 'flame', 5); k.path([[50, 46], [48, 50], [50, 55]], 'flame', 5);
    k.px(32, 51, 'flame', 6); k.px(48, 50, 'flame', 6);
    var B = { h: ['magma', 6], l: ['magma', 5], s: ['magma', 1] };
    pm(k, 26, 44, ['.l.', 'lhl', '.s.'], B); pm(k, 52, 43, ['.l.', 'lhl', '.s.'], B); pm(k, 36, 44, ['l.l'], B); pm(k, 43, 44, ['l.l'], B);
    // happy face on the shell front
    k.mouth([[36.5, 53.5], [43.5, 53.5], [42.5, 57], [C, 58], [37.5, 57]], {});
    k.path([[35, 53], [36, 54]], 'black', 0); k.path([[45, 53], [44, 54]], 'black', 0);
    k.rect(31, 53, 3, 1, 'sakura', { tone: 5, part: 'bs1', outline: 'none' });
    k.rect(46, 53, 3, 1, 'sakura', { tone: 5, part: 'bs2', outline: 'none' });
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
    var BE = { K: ['black', 0], k: ['black', 4], W: ['white', 6] };
    pm(k, 29, 31, ['.KK.', 'KWKK', 'KKKk', '.KK.'], BE); pm(k, 48, 31, ['.KK.', 'KWKK', 'KKKk', '.KK.'], BE);
    k.px(29, 30, 'magma', 1); k.px(50, 30, 'magma', 1);
    // steam puffs
    k.sym(C, function (m, s) {
      var so = { part: 'steam' + s, outline: 'none', shade: 'flat', flatTone: 4 };
      k.tube([[m(23), 41, 1.6], [m(21), 37, 1.8], [m(22.5), 33, 1.3], [m(21), 29.5, 0.6]], 'ice', so);
      k.path([[m(22), 40], [m(20), 37], [m(21), 34]], 'white', 6);
      k.px(m(24), 35, 'ice', 4); k.px(m(19), 31, 'ice', 5);
    });
    // GIANT claw (left)
    k.tube([[26, 56, 3.2], [19, 55, 3], [15, 50, 3]], 'magma', { part: 'armL' });
    k.tube([[9, 40, 3.6], [6, 33, 2.8], [8, 26, 1.2]], 'magma', { part: 'fA' });
    k.tube([[17, 40, 3.2], [19, 33, 2.4], [16, 28, 0.8]], 'magma', { part: 'fB' });
    k.ellipse(13, 44.5, 8, 6.5, 'magma', { part: 'claw' });
    k.texture('claw', 'stone', { size: 3, seed: 7 });
    k.tube([[9, 42, 0.6], [11, 47, 0.6]], null, { adj: 1, clip: 'claw' });
    [[10, 34], [9.5, 30], [15.5, 34], [16, 31]].forEach(function (p) { k.px(p[0], p[1], 'bone', 5); });
    k.px(12, 45, 'magma', 6); k.px(11, 44, 'magma', 5);
    // small claw (right)
    k.tube([[54, 57, 2.4], [60, 56, 2.2], [63, 52, 2]], 'magma', { part: 'armR' });
    k.spike(62, 49, 60.5, 44, 3, 'magma', { part: 'sfA' });
    k.spike(66, 49, 67, 44.5, 2.6, 'magma', { part: 'sfB' });
    k.ellipse(64, 50.5, 3.6, 3, 'magma', { part: 'sclaw' });
    k.px(63, 50, 'magma', 6);
    k.sparkle(70, 62, 1, 'white');
  };

  // 6 シズクン — water C (癒し): droplet child in a lotus-leaf hat, dozing on a bubble.
  P[6] = function (k) {
    k.shadow(C, 76.5, 12, 1.6);
    // ripples
    var RP = { a: ['ice', 5], b: ['ice', 3] };
    pm(k, 20, 74, ['aab....', '..baa..'], RP);
    pm(k, 53, 74, ['....baa', '..aab..'], RP);
    // bubble seat
    k.circle(C, 63.5, 11, 'ice', { part: 'bub', halo: 0.25, light: 0.15, outline: 'soft' });
    k.ellipse(42, 66, 7, 6.5, 'crystal', { clip: 'bub', shade: 'flat', flatTone: 4 });
    k.ellipse(43, 67.5, 5, 4, 'crystal', { clip: 'bub', shade: 'flat', flatTone: 5 });
    k.tube([[31.5, 65, 0.8], [32.5, 59, 0.8], [35.5, 55.5, 0.6]], 'white', { clip: 'bub', tone: 6 });
    k.px(48, 71, 'white', 6); k.px(49, 70, 'white', 5);
    // legs dangling over the front
    k.sym(C, function (m, s) {
      k.tube([[m(37.5), 56, 1.8], [m(36.5), 61.5, 1.4]], 'water', { part: 'leg' + s, light: 0.3 });
      k.ellipse(m(36), 63, 2, 1.5, 'water', { part: 'leg' + s, light: 0.3 });
    });
    // body + arms (hands folded in the lap)
    k.ellipse(C, 51.5, 3.8, 3.6, 'ice', { part: 'body', light: 0.2 });
    k.sym(C, function (m, s) { k.tube([[m(36.3), 49.5, 1.3], [m(35.5), 53, 1.2], [m(38.5), 54.5, 1.2]], 'ice', { part: 'body' }); });
    // lotus-petal skirt
    k.sym(C, function (m, s) {
      k.leaf(m(38), 54.5, m(31), 57, 4, 'sakura', { part: 'pa' + s });
      k.leaf(m(39), 54.5, m(36), 59.5, 4, 'sakura', { part: 'pb' + s });
    });
    k.leaf(C, 54, C, 60, 4, 'sakura', { part: 'pc' });
    k.px(C, 55, 'sakura', 6);
    // droplet hair
    k.ellipse(C, 40.5, 10, 8.5, 'water', { part: 'hair' });
    k.sym(C, function (m, s) { k.tube([[m(31.5), 41, 2], [m(31), 46, 1.5], [m(32.5), 50, 0.5]], 'water', { part: 'hair' }); });
    k.px(30, 44, 'water', 6);
    // head
    k.ellipse(C, 43, 8.5, 7.5, 'ice', { part: 'head', light: 0.3, spec: false, flat: true });
    k.poly([[31, 34], [49, 34], [49.5, 39], [47, 41], [45, 39], [43, 41.5], [C, 39], [37, 41.5], [35, 39], [33, 41], [30.5, 39]], 'water', { clip: 'head' });
    k.px(34, 38, 'water', 6); k.px(35, 38, 'water', 5);
    // sleepy face
    var F = { K: ['black', 0] };
    pm(k, 33, 44, ['K...K', '.KKK.'], F); pm(k, 42, 44, ['K...K', '.KKK.'], F);
    pm(k, 39, 48, ['K..K', '.KK.'], F);
    k.rect(32, 47, 2, 1, 'sakura', { tone: 4, part: 'cs1', outline: 'none' });
    k.rect(46, 47, 2, 1, 'sakura', { tone: 4, part: 'cs2', outline: 'none' });
    // lotus-leaf hat
    k.ellipse(C, 34.5, 14, 3.4, 'grass', { part: 'hat' });
    k.ellipse(C, 32.5, 7, 3, 'grass', { part: 'hat' });
    k.poly([[C, 34], [37.5, 38.5], [42.5, 38.5]], null, { erase: true });
    [[27, 35], [32, 37], [48, 37], [53, 35], [34, 31], [46, 31]].forEach(function (p) { k.line(C, 33, p[0], p[1], 'grass', 2); });
    k.path([[27, 33], [32, 31.5]], 'grass', 5); k.px(35, 30, 'grass', 6);
    k.tube([[C, 30, 0.8], [41.5, 27.5, 0.7], [43.5, 26, 0.5]], 'grass', { part: 'stem', shade: 'flat', flatTone: 4 });
    // lotus bud on the brim
    k.leaf(51.5, 34, 52.5, 25, 4.4, 'sakura', { part: 'bud' });
    k.px(51, 28, 'sakura', 6); k.px(51, 29, 'sakura', 5);
    k.spike(50, 34, 48.5, 29.5, 2.4, 'leaf', { part: 'sep1' }); k.spike(53, 34, 55, 29.5, 2.4, 'leaf', { part: 'sep2' });
    // floating bubbles
    k.circle(20, 50, 1.8, 'ice', { part: 'b1', outline: 'soft' }); k.px(19, 49, 'white', 6);
    k.circle(60, 46, 1.4, 'ice', { part: 'b2', outline: 'soft' }); k.px(59, 45, 'white', 6);
    k.sparkle(62, 58, 1, 'ice');
    // z
    pm(k, 57, 22, ['zzzz', '...z', '..z.', '.z..', 'yyyy'], ZZ);
  };

  // 7 カッパチ — water C (かわいい): kappa kid with a turtle-shell backpack. Gag: cheeky wink, brandishing a half-eaten cucumber.
  P[7] = function (k) {
    k.shadow(C, 76.5, 15, 2);
    // shell backpack peeking out
    k.ellipse(C, 55, 16.5, 12.5, 'cream', { part: 'shell', shift: -1 });
    k.ellipse(C, 54.5, 14.5, 11, 'leaf', { clip: 'shell' });
    k.texture('shell', 'scales', { size: 5, seed: 2 });
    // legs + webbed feet
    k.sym(C, function (m, s) {
      k.tube([[m(35), 66, 3], [m(34), 72, 2.6]], 'aqua', { part: 'leg' + s });
      k.ellipse(m(33.5), 74, 5.5, 2.4, 'aqua', { part: 'leg' + s });
      k.px(m(30), 75, 'aqua', 1); k.px(m(33), 75, 'aqua', 1); k.px(m(36), 75, 'aqua', 1);
    });
    // body + belly plate
    k.ellipse(C, 63, 10, 9, 'aqua', { part: 'body' });
    k.ellipse(C, 65, 6.5, 6.8, 'light', { clip: 'body' });
    for (var y = 61; y <= 70; y += 3) k.rect(34, y, 12, 1, 'light', { adj: -1, clip: 'body' });
    // backpack straps
    k.sym(C, function (m, s) { k.tube([[m(32), 55, 1.2], [m(33.5), 63, 1.1]], 'red', { part: 'strap' + s }); });
    // left arm: hand on hip
    k.tube([[31, 57, 2.4], [26.5, 61, 2], [29, 64.5, 1.9]], 'aqua', { part: 'armL' });
    k.px(26, 61, 'aqua', 5);
    // cucumber held up in the right hand
    k.tube([[55, 60, 2.3], [56.5, 47, 2.8], [57.5, 37, 2.4]], 'grass', { part: 'cuc' });
    [[55, 57], [56, 52], [55, 48], [56, 43], [57, 39]].forEach(function (p) { k.px(p[0], p[1], 'grass', 5); });
    [[57, 55], [58, 49], [58, 43]].forEach(function (p) { k.px(p[0], p[1], 'grass', 1); });
    k.ellipse(57.5, 36, 2.4, 1.6, 'cream', { part: 'cut', shade: 'flat', flatTone: 5 });
    k.circle(60, 35, 1.8, null, { erase: true });
    k.px(57, 36, 'leaf', 4); k.px(58, 36, 'leaf', 4);
    k.tube([[49, 57, 2.4], [53, 54, 2], [55, 50, 2]], 'aqua', { part: 'armR' });
    k.ellipse(56, 48.5, 3, 2.8, 'aqua', { part: 'hR' });
    k.px(54, 49, 'aqua', 1); k.px(54, 47, 'aqua', 1); k.px(55, 47, 'aqua', 5);
    // hair ring with side locks
    k.ellipse(C, 38, 10, 3.6, 'grass', { part: 'hair', shift: -1 });
    k.tufts(arc(C, 37.5, 9.5, 3.4, 190, 350, 12), 'grass', { part: 'hair', shift: -1, len: 3, w: 2.6, every: 2.2, seed: 6 });
    // head
    k.ellipse(C, 46, 12, 9.5, 'aqua', { part: 'head' });
    k.texture('head', 'dots', { seed: 4 });
    k.sym(C, function (m, s) {
      k.tube([[m(30), 38, 2.2], [m(28), 43, 1.6], [m(28.5), 46, 0.6]], 'grass', { part: 'lock' + s, shift: -1 });
    });
    k.tufts([[31, 38.5], [36, 39.2], [44, 39.2], [49, 38.5]].reverse(), 'grass', { part: 'fringe', shift: -1, len: 1.6, w: 2.4, every: 2.2, seed: 8 });
    // head plate with water
    k.ellipse(C, 35.5, 7.5, 2.8, 'bone', { part: 'plate' });
    k.ellipse(C, 35.3, 5.6, 1.7, 'water', { part: 'pw', shade: 'flat', flatTone: 4, outline: 'none' });
    k.line(36, 35, 38, 34, 'water', 6); k.px(44, 36, 'water', 5);
    // beak with a cheeky grin
    k.poly([[33.5, 49], [46.5, 49], [44.5, 53.5], [C, 55], [35.5, 53.5]], 'thunder', { part: 'beak' });
    k.path([[34, 51], [36, 52], [C, 52], [44, 51], [46, 49]], 'black', 0);
    k.px(38, 49, 'black', 1); k.px(42, 49, 'black', 1);
    pm(k, 42, 52, ['pp', 'p.'], { p: ['skin', 4] });
    // eyes: glare + wink
    k.eye(31, 41, { w: 5, h: 5, iris: 'thunder', side: 'L', angry: 0, lid: 0.15, look: [0.4, 0], brow: false });
    pm(k, 44, 43, ['.KKK.', 'K...K'], INK);
    k.line(44, 40, 48, 39, 'black', 0);
    k.rect(30, 47, 2, 1, 'sakura', { tone: 4, part: 'ck1', outline: 'none' });
    k.rect(48, 47, 2, 1, 'sakura', { tone: 4, part: 'ck2', outline: 'none' });
    k.sparkle(62, 30, 1, 'ice'); k.px(20, 44, 'water', 5);
  };

  // 8 ナミウルフ — water R (かっこいい): wolf of breaking waves, foam ruff and fin ears, crouched to spring.
  P[8] = function (k) {
    k.shadow(C, 76.5, 22, 2.3);
    // breaking-wave tail
    k.tube([[52, 64, 4], [60, 60, 4.4], [65, 52, 4.2], [66, 44, 3.4], [62, 39, 2], [58.5, 41, 1]], 'water', { part: 'tail', shift: -1 });
    k.tufts([[58, 38.5], [63, 36], [68, 40], [70, 48], [68, 56]], 'white', { part: 'tfoam', len: 3.5, w: 3.2, every: 2.2, seed: 3, light: 0.3 });
    k.tube([[64, 55, 0.6], [67, 47, 0.6], [65, 41, 0.5]], 'ice', { clip: 'tail', tone: 4 });
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
    k.sym(C, function (m) { k.ellipse(m(30), 50.5, 8.5, 7.5, 'white', { part: 'ruff', light: 0.3 }); });
    k.tufts(arc(C, 50, 16, 7.5, 110, 250, 10), 'white', { part: 'ruff', len: 4.5, w: 3.4, every: 2.6, seed: 7 });
    k.tufts(arc(C, 50, 16, 7.5, -70, 70, 10), 'white', { part: 'ruff', len: 4.5, w: 3.4, every: 2.6, seed: 8 });
    k.texture('ruff', 'fur', { seed: 9 });
    k.tufts([[46, 53], [C, 55], [34, 53]], 'water', { part: 'chest', len: 4, w: 3, every: 2.4, seed: 2 });
    k.ellipse(C, 53, 6, 3, 'water', { part: 'chest' });
    k.sym(C, function (m, s) {
      k.tube([[m(30), 57, 0.7], [m(26), 53, 0.7], [m(26), 49, 0.6], [m(29), 47.5, 0.5]], 'water', { clip: 'ruff', tone: 3 });
      k.tube([[m(29), 58, 0.5], [m(25), 54, 0.5]], null, { adj: -1, clip: 'ruff' });
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
    // fin ears (dorsal-fin shape with rays)
    k.sym(C, function (m, s) {
      k.poly([[m(35), 32], [m(31), 27.5], [m(25), 25], [m(15), 24], [m(20), 28.5], [m(23), 33], [m(29), 35.5]], 'aqua', { part: 'ear' + s });
      k.tufts(s > 0 ? [[m(16), 25], [m(20.5), 29], [m(23.5), 33.5]] : [[m(23.5), 33.5], [m(20.5), 29], [m(16), 25]], 'aqua', { part: 'ear' + s, len: 2.2, w: 2, every: 2.4, seed: 4 });
      [[m(33), 31, m(20), 26], [m(30), 33, m(22), 29]].forEach(function (l) { k.line(l[0], l[1], l[2], l[3], 'aqua', 2); });
      k.path([[m(34), 30], [m(30), 27], [m(23), 25.5]], 'aqua', 5);
    });
    // head
    k.ellipse(C, 39, 11, 9.5, 'water', { part: 'head' });
    k.tufts([[30, 37], [28, 42], [31, 47]], 'water', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 4 });
    k.tufts([[49, 47], [52, 42], [50, 37]], 'water', { part: 'head', len: 3.5, w: 3, every: 2.5, seed: 5 });
    k.texture('head', 'fur', { seed: 6 });
    // foam blaze on the brow
    k.poly([[37, 30], [C, 33], [43, 30], [42, 36], [C, 38], [38, 36]], 'white', { clip: 'head' });
    // muzzle, nose, snarl
    k.ellipse(C, 45.5, 6.4, 4.8, 'ice', { part: 'muz' });
    pm(k, 38, 41, ['bKKK.', 'KKKKK', '.KKK.'], { K: ['black', 1], b: ['black', 5] });
    k.px(35, 43, 'ice', 2); k.px(45, 43, 'ice', 2); k.px(36, 44, 'ice', 2); k.px(44, 44, 'ice', 2);
    k.mouth([[33.5, 46.5], [46.5, 46.5], [44.5, 50.5], [C, 52], [35.5, 50.5]], { tongue: false });
    k.tooth(35.5, 46.5, 36, 50, 2.2); k.tooth(44.5, 46.5, 44, 50, 2.2);
    k.tooth(38.5, 46.5, 38.5, 48, 1.4); k.tooth(41.5, 46.5, 41.5, 48, 1.4);
    k.tooth(37.5, 51, 37.5, 49, 1.6); k.tooth(42.5, 51, 42.5, 49, 1.6);
    // eyes
    k.eye(30, 34, { w: 6, h: 5, iris: 'thunder', side: 'L', angry: 1.7, browMat: 'water', browTone: 1 });
    k.eye(44, 34, { w: 6, h: 5, iris: 'thunder', side: 'R', angry: 1.7, browMat: 'water', browTone: 1 });
    // spray
    k.sparkle(13, 40, 1, 'ice'); k.px(16, 34, 'ice', 5); k.px(70, 32, 'ice', 5); k.px(11, 58, 'ice', 4);
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
    k.ellipse(C, 64, 11, 4, null, { adj: -1, clip: 'body' });
    // arms cradling
    k.sym(C, function (m, s) {
      k.tube([[m(25), 45, 5.2], [m(22), 54, 4.6], [m(28), 61, 4], [m(34), 62, 3.6]], 'white', { part: 'arm' + s });
      k.texture('arm' + s, 'fur', { seed: 12 + s });
      k.tube([[m(22), 48, 0.6], [m(21), 55, 0.6], [m(25), 60, 0.5]], null, { adj: 1, clip: 'arm' + s });
      k.tube([[m(27), 64, 0.8], [m(33), 65.5, 0.8]], null, { adj: -1, clip: 'body' });
    });
    // little red bird (a round fluffed-up sparrow)
    k.sym(C, function (m, s) { k.spike(m(36.5), 57, m(33), 55.5, 3, 'red', { part: 'wing' + s, shift: -1 }); });
    k.circle(C, 56.5, 4.6, 'red', { part: 'bird' });
    k.ellipse(C, 58.5, 3, 2.4, 'cream', { clip: 'bird', tone: 5 });
    k.px(C, 60, 'cream', 4);
    k.spike(39.5, 52.5, 40.5, 49.5, 2, 'red', { part: 'crest' });
    var BD = { K: ['black', 0], W: ['white', 6], g: ['gold', 5], d: ['gold', 3] };
    pm(k, 38, 55, ['K..K', '.gg.', '.dd.'], BD);
    k.px(37, 56, 'sakura', 5); k.px(42, 56, 'sakura', 5);
    // mitten hands
    k.sym(C, function (m, s) {
      k.ellipse(m(34), 61.5, 3.6, 3.2, 'white', { part: 'hand' + s });
      k.px(m(33), 62, 'white', 2); k.px(m(35), 63, 'white', 2);
    });
    // head
    k.ellipse(C, 36, 12.5, 10.5, 'white', { part: 'head' });
    k.tufts([[27, 36], [29, 30], [34, 26.5], [C, 25.5], [46, 26.5], [51, 30], [53, 36]], 'white', { part: 'head', len: 3, w: 3, every: 2.4, seed: 6 });
    k.texture('head', 'fur', { seed: 9 });
    // tiny horns
    k.sym(C, function (m, s) { k.tube([[m(34.5), 27, 1.8], [m(33), 23, 1.2], [m(33.5), 21, 0.5]], 'gold', { part: 'horn' + s }); });
    // face
    k.ellipse(C, 39, 8.5, 6.3, 'ice', { part: 'face', light: 0.3, spec: false, flat: true });
    // fluffy droopy brows
    k.path([[32, 36], [33, 35], [36, 34]], 'white', 6); k.path([[48, 36], [47, 35], [44, 34]], 'white', 6);
    // droopy kind eyes
    var E = { K: ['black', 0], P: ['water', 1], W: ['white', 6] };
    pm(k, 33, 37, ['.KKKK', 'KPPWP', '.PPP.'], E);
    pm(k, 42, 37, mirror(['.KKKK', 'KPPWP', '.PPP.']), E);
    // rosy cheeks, button nose, soft smile with one little tusk
    k.rect(32, 41, 3, 1, 'sakura', { tone: 4, part: 'rc1', outline: 'none' });
    k.rect(45, 41, 3, 1, 'sakura', { tone: 4, part: 'rc2', outline: 'none' });
    pm(k, 39, 40, ['nn', 'NN'], { n: ['ice', 6], N: ['ice', 2] });
    pm(k, 37, 42, ['K....K', '.KKKK.'], INK);
    k.px(41, 44, 'white', 6);
    // snowflakes
    k.sparkle(14, 30, 1, 'ice'); k.sparkle(66, 38, 1, 'ice'); k.px(62, 24, 'ice', 5); k.px(18, 62, 'ice', 5);
  };

  // 13 コケモチ — grass C (癒し): sleepy mossy tortoise with a flower-garden boulder shell. Gag: nose bubble.
  P[13] = function (k) {
    k.shadow(C, 76.5, 21, 2.2);
    // stubby feet
    k.sym(C, function (m, s) {
      k.ellipse(m(24), 71.5, 5.2, 4.2, 'leaf', { part: 'ft' + s, shift: -1 });
      k.texture('ft' + s, 'scales', { size: 3, seed: 3 });
      k.px(m(21), 75, 'bone', 5); k.px(m(24), 75, 'bone', 5); k.px(m(27), 75, 'bone', 4);
    });
    // boulder shell with scutes
    k.ellipse(C, 54, 20, 16, 'stone', { part: 'shell' });
    k.texture('shell', 'dots', { seed: 4 });
    [[27, 57], [52, 53], [33, 62], [49, 61], [23, 52]].forEach(function (p, i) { k.px(p[0], p[1], 'leaf', 3 + (i & 1)); k.px(p[0] + 1, p[1], 'leaf', 2); });
    k.sym(C, function (m, s) {
      k.tube([[m(31), 47, 0.6], [m(29), 54, 0.6], [m(31), 61, 0.6]], null, { adj: -2, clip: 'shell' });
      k.tube([[m(30), 47, 0.5], [m(28), 54, 0.5]], null, { adj: 1, clip: 'shell' });
      k.tube([[m(21), 55, 0.6], [m(29), 54, 0.6]], null, { adj: -2, clip: 'shell' });
      k.px(m(25), 50, 'stone', 5); k.px(m(24), 51, 'stone', 5); k.px(m(24), 58, 'stone', 5);
    });
    k.ellipse(C, 67, 18.5, 3.6, 'stone', { part: 'rim', shift: -1 });
    k.texture('rim', 'stone', { size: 3, seed: 5 });
    // moss blanket with drips
    var mp = [[21, 50], [26, 45], [30, 47], [34, 43], [C, 46], [46, 43], [50, 47], [54, 45], [59, 50]];
    k.poly([[20, 52], [22, 44], [28, 40], [C, 37.5], [52, 40], [58, 44], [60, 52]].concat(mp.slice().reverse()), 'grass', { part: 'moss' });
    k.tufts(mp.slice().reverse(), 'grass', { part: 'moss', len: 3, w: 2.4, every: 2.3, seed: 12 });
    k.tufts([[21, 45], [27, 40], [34, 38], [C, 37.5], [46, 38], [53, 40], [59, 45]], 'grass', { part: 'moss', len: 2.2, w: 2, every: 2.2, seed: 4 });
    k.texture('moss', 'fur', { seed: 5 });
    // flowers + sprout
    var FL = { p: ['sakura', 5], q: ['sakura', 3], y: ['gold', 5], w: ['white', 6], v: ['white', 4] };
    pm(k, 29, 40, ['.p.', 'pyp', '.q.'], FL);
    pm(k, 46, 39, ['.w.', 'wyw', '.v.'], FL);
    pm(k, 37, 37, ['.p.', 'pyp', '.q.'], FL);
    pm(k, 53, 44, ['.w.', 'wyw', '.v.'], FL);
    k.px(24, 45, 'gold', 5); k.px(35, 42, 'gold', 5);
    k.tube([[43, 38, 0.5], [44, 34, 0.5]], 'leaf', { part: 'sprout', shade: 'flat', flatTone: 4 });
    k.leaf(44, 34, 47, 32, 2.6, 'leaf', { part: 'sp1' }); k.leaf(44, 34, 41.5, 32, 2.4, 'leaf', { part: 'sp2' });
    // head poking out
    k.ellipse(C, 64.5, 9.5, 6.8, 'tan', { part: 'head', spec: false });
    k.path([[33, 60], [35, 59], [37, 59]], 'tan', 5); k.px(48, 66, 'tan', 1); k.px(47, 67, 'tan', 1);
    k.ellipse(C, 68.5, 5.5, 2.4, 'cream', { clip: 'head' });
    // sleepy content face
    pm(k, 33, 62, ['K...K', '.KKK.'], INK); pm(k, 42, 62, ['K...K', '.KKK.'], INK);
    k.path([[37, 67], [38, 68], [39, 68], [C, 67], [41, 68], [42, 68], [43, 67]], 'black', 0);
    k.rect(32, 65, 2, 1, 'sakura', { tone: 4, part: 'ck1', outline: 'none' });
    k.rect(46, 65, 2, 1, 'sakura', { tone: 4, part: 'ck2', outline: 'none' });
    k.px(39, 65, 'tan', 1); k.px(41, 65, 'tan', 1);
    // nose bubble
    k.circle(46.5, 69, 3, 'ice', { part: 'nb', halo: 0.2, outline: 'soft' });
    k.px(45, 68, 'white', 6);
    // Zz
    pm(k, 58, 33, ['zzz', '..z', '.z.', 'z..', 'yyy'].map(function (r) { return r; }), ZZ);
    pm(k, 63, 26, ['zzzz', '...z', '..z.', '.z..', 'yyyy'], ZZ);
  };
})();
