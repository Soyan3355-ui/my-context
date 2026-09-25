/* 封札モンスターズ — monster sprites, set 4 (ids 22, 23, 24, 25, 27, 28, 29, 30).
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

  // 22 バケチョウチン — dark C, eerie-comic: torn paper-lantern yokai. One giant bloodshot eye, a long lolling tongue,
  // a ghost flame peeking through a tear. Gag: the tongue hangs right down past its own bottom ring.
  P[22] = function (k) {
    k.shadow(C, 76.5, 10, 1.6);
    wisp(k, 10, 52, 0.8, 'w1'); wisp(k, 70, 48, 0.7, 'w2');
    // wire handle + top ring
    k.tube([[34.5, 27, 0.9], [35, 21.5, 0.9], [38, 19.5, 0.9], [42, 19.5, 0.9], [45, 21.5, 0.9], [45.5, 27, 0.9]], 'black', { part: 'wire', shade: 'flat', flatTone: 4 });
    k.ellipse(C, 29.5, 9.5, 2.8, 'wood', { part: 'capT', shift: -1 });
    k.rect(32, 28, 16, 1, 'wood', { clip: 'capT', tone: 4 });
    // paper body, lit from the flame inside
    k.ellipse(C, 47, 16, 17, 'bone', { part: 'paper' });
    k.tufts([[25, 40], [23.5, 47], [24.5, 54]], 'bone', { part: 'paper', len: 2.5, w: 3, every: 3, seed: 3 });
    k.rect(22, 30, 36, 3, 'red', { clip: 'paper' });
    k.rect(22, 61, 36, 4, 'red', { clip: 'paper' });
    for (var y = 36; y <= 59; y += 4) {
      var hw = 16 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 47) / 17, 2)));
      k.tube([[C - hw, y - 0.8, 0.45], [C, y + 0.8, 0.45], [C + hw, y - 0.8, 0.45]], null, { adj: -1, clip: 'paper' });
    }
    k.ellipse(47, 44, 7, 8, null, { adj: 1, clip: 'paper', mat: 'bone', pattern: 'checker' });
    // stains + a red brush stroke
    k.path([[52, 52], [54, 56], [53, 59]], 'bone', 2); k.px(51, 55, 'bone', 2);
    // tear on the upper right: ghost flame inside
    k.poly([[45, 32], [48, 34.5], [51, 32], [55, 34], [55.5, 40], [52, 43], [48.5, 42], [46, 39.5], [47, 36]], 'black', { part: 'hole', shade: 'flat', flatTone: 0 });
    k.tube([[50.5, 42, 3.2], [51, 38.5, 2.2], [49.5, 34, 0.5]], 'violet', { part: 'ghost', shade: 'glow', clip: 'hole' });
    k.px(50, 40, 'violet', 6); k.px(51, 39, 'violet', 6);
    k.tufts([[46, 39.5], [48.5, 42], [52, 43]], 'bone', { part: 'shred', len: 2, w: 2, every: 2, seed: 8 });
    // loose flap hanging off the left
    k.poly([[25, 57], [21, 61], [22, 68], [25, 65], [28, 60]], 'bone', { part: 'flap', shift: -1 });
    k.line(24, 61, 23, 66, 'bone', 1);
    // bottom ring + tassel
    k.ellipse(C, 65.5, 9, 2.6, 'wood', { part: 'capB', shift: -1 });
    k.tube([[37, 67, 1.2], [37, 71, 1.6]], 'red', { part: 'tassel' });
    k.tufts([[39.5, 72], [34.5, 72]], 'red', { part: 'tassel', len: 2.5, w: 2, every: 1.5, seed: 2 });
    // giant bloodshot eye under a heavy paper lid
    k.ellipse(36, 42, 9, 6, 'white', { part: 'eyeball', spec: false });
    k.circle(37, 42.5, 4.2, 'thunder', { clip: 'eyeball' });
    k.circle(37, 42.5, 4.2, 'fire', { clip: 'eyeball', pattern: 'checker', adj: 0 });
    k.ellipse(37, 42.5, 2.6, 2.6, null, { set: 5, clip: 'eyeball', mat: 'thunder' });
    k.rect(36.5, 39, 2, 7, 'black', { tone: 0, clip: 'eyeball' });
    k.poly([[26, 38], [46, 36], [46, 39.5], [37, 39], [26, 41]], 'bone', { part: 'lid', light: 0.2 });
    k.path([[27, 41], [37, 39.5], [45, 40]], 'black', 0);
    k.path([[28, 44], [30, 43], [31, 44]], 'red', 3); k.path([[44, 45], [43, 43]], 'red', 3); k.path([[29, 46], [31, 46]], 'red', 3); k.px(45, 42, 'red', 3);
    k.px(35, 41, 'white', 6); k.px(35, 42, 'white', 5);
    // torn mouth + lolling tongue
    k.mouth([[26, 51], [29, 53], [31, 50.5], [34, 53], [37, 50.5], [40, 53], [43, 50.5], [46, 53], [49, 50.5], [53, 52.5], [51, 57], [44, 60], [36, 60.5], [30, 58]], { tongue: false });
    k.poly([[33, 58], [36, 56.5], [39, 58.5], [36, 60]], 'violet', { part: 'throat', shade: 'glow', outline: 'none', noseam: true });
    k.tube([[46, 56, 2.2], [48, 62, 2.6], [48.5, 68, 2.4], [46, 72, 2], [43, 70.5, 1.3]], 'skin', { part: 'tongue' });
    k.line(47.5, 58, 48, 67, 'skin', 2); k.px(47, 60, 'skin', 5); k.px(47, 61, 'skin', 5);
  };

  // 23 クロネコマタ — dark R, cool/妖艶: black two-tailed cat, blue onibi at both tail tips, sly narrowed eyes.
  // Gag: a smug sideways smirk with one fang, and a little gold bell it wears like it owns the place.
  P[23] = function (k) {
    k.shadow(C, 76.5, 17, 2);
    // two tails, curling out to either side
    k.tube([[33, 71, 3], [22, 68, 3.2], [15, 58, 3], [14, 46, 2.6], [17, 36, 2], [14, 29, 1.4]], 'obsidian', { part: 'tailL', shift: -1 });
    k.tube([[47, 71, 3], [58, 68, 3.2], [65, 59, 3], [67, 48, 2.6], [64, 38, 2], [66, 31, 1.4]], 'obsidian', { part: 'tailR', shift: -1 });
    k.texture('tailL', 'fur', { seed: 3 }); k.texture('tailR', 'fur', { seed: 4 });
    wisp(k, 14, 28, 1, 'fl1', 'crystal'); wisp(k, 66, 30, 0.9, 'fl2', 'crystal');
    // haunches + hind paws
    k.sym(C, function (m, s) {
      k.ellipse(m(30), 65, 7, 8, 'obsidian', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(28), 74, 5, 2.2, 'obsidian', { part: 'hp' + s, shift: -1 });
    });
    // body + chest ruff
    k.ellipse(C, 60, 11, 13, 'obsidian', { part: 'body' });
    k.texture('body', 'fur', { seed: 5 });
    k.tufts([[46, 62], [34, 62]], 'obsidian', { part: 'ruff', len: 4, w: 3, every: 2.5, seed: 4, light: 0.2 });
    // front legs
    k.sym(C, function (m, s) {
      k.tube([[m(35), 58, 3], [m(35), 70, 2.6]], 'obsidian', { part: 'leg' + s });
      k.ellipse(m(35), 73.5, 3.8, 2.4, 'obsidian', { part: 'paw' + s });
      k.px(m(34), 75, 'black', 0); k.px(m(36), 75, 'black', 0);
    });
    // ears
    k.sym(C, function (m, s) {
      k.spike(m(32), 32, m(25), 18, 11, 'obsidian', { part: 'ear' + s });
      k.spike(m(31.5), 31, m(26.5), 22, 5, 'violet', { clip: 'ear' + s, tone: 2 });
    });
    // head with cheek ruffs
    k.ellipse(C, 38, 13, 10.5, 'obsidian', { part: 'head' });
    k.tufts([[28, 37], [26, 42], [29, 47]], 'obsidian', { part: 'head', len: 4, w: 3, every: 2.5, seed: 5 });
    k.tufts([[51, 47], [54, 42], [52, 37]], 'obsidian', { part: 'head', len: 4, w: 3, every: 2.5, seed: 6 });
    k.texture('head', 'fur', { seed: 7 });
    k.ellipse(C, 44, 6, 3.6, 'obsidian', { part: 'muzzle', light: 0.25 });
    // collar + bell
    k.tube([[29, 49, 1.5], [C, 52, 1.8], [51, 49, 1.5]], 'red', { part: 'collar' });
    k.circle(C, 54.5, 2.6, 'gold', { part: 'bell' });
    k.px(C, 55, 'black', 0); k.px(C, 56, 'black', 0);
    // forehead onibi mark
    k.poly([[C, 29], [41.5, 32], [C, 33.5], [38.5, 32]], 'crystal', { part: 'mark', shade: 'glow', outline: 'none' });
    // sly glowing eyes
    k.sym(C, function (m, s) {
      k.poly([[m(29), 36], [m(37), 38.5], [m(36.5), 41], [m(31), 40]], 'thunder', { part: 'eye' + s, shade: 'glow', halo: s > 0 ? 0.3 : 0, outline: 'none' });
      k.line(m(29), 35, m(37), 37.5, 'black', 0);
      k.line(m(34), 38, m(34), 40, 'black', 0);
    });
    // nose, smirk, fang
    k.poly([[38.5, 42], [41.5, 42], [C, 43.5]], 'skin', { part: 'nose', tone: 3 });
    k.path([[34, 45], [36, 46], [39, 45]], 'black', 0);
    k.mouth([[39, 45], [47, 43], [46, 47.5], [42, 48]], { tongue: false });
    k.tooth(44.5, 44.5, 44.5, 47.5, 1.8);
    // whiskers
    k.path([[29, 44], [23, 42]], 'violet', 4); k.path([[29, 46], [22, 47]], 'violet', 4);
    k.path([[51, 44], [57, 42]], 'violet', 4); k.path([[51, 46], [58, 47]], 'violet', 4);
  };

  // 24 ドクロキシ — dark R, eerie: skeleton samurai in broken lacquer armour, chipped katana, glowing sockets,
  // tattered banner. Gag: one kuwagata horn snapped off, and its jaw hangs open in a rattling cackle.
  P[24] = function (k) {
    k.shadow(C, 76.5, 18, 2.2);
    // banner on its back
    k.tube([[57, 58, 0.9], [57, 15, 0.9]], 'wood', { part: 'pole', shift: -1 });
    k.poly([[58, 16], [70, 16], [70, 35], [68, 32], [66, 38], [63, 33], [61, 39], [58, 36]], 'red', { part: 'banner', flat: true });
    k.texture('banner', 'cloth', { size: 3 });
    k.circle(64, 23, 3.2, 'black', { clip: 'banner', tone: 1 });
    k.circle(64, 23, 1.6, 'bone', { clip: 'banner', tone: 4 });
    k.circle(67.5, 29, 1.2, null, { erase: true });
    k.rect(56, 15, 15, 1, 'wood', { part: 'bar', tone: 2 });
    // legs: bone shins, greaves, bone feet
    k.sym(C, function (m, s) {
      k.tube([[m(34), 62, 1.5], [m(33.5), 72, 1.3]], 'bone', { part: 'shin' + s });
      k.poly([[m(31), 64], [m(36.5), 64], [m(36), 70], [m(31.5), 70]], 'dark', { part: 'grv' + s });
      k.ellipse(m(33), 74.3, 3.6, 1.7, 'bone', { part: 'foot' + s });
      k.px(m(31), 75, 'bone', 1); k.px(m(33), 75, 'bone', 1);
    });
    // pelvis + armoured skirt with a missing plate
    k.ellipse(C, 56, 7, 3, 'bone', { part: 'pelvis', shift: -1 });
    k.poly([[29, 53], [51, 53], [54, 63], [26, 63]], 'dark', { part: 'skirt' });
    for (var x = 31; x <= 50; x += 5) k.line(x - (x < C ? 1 : -1), 54, x - (x < C ? 2 : -2), 62, 'dark', 1);
    k.rect(26, 57, 29, 1, null, { adj: -1, clip: 'skirt' });
    k.poly([[41, 53], [46, 53], [47.5, 63], [42, 63]], null, { erase: true });
    k.tube([[43, 56, 1.2], [44, 63, 1]], 'bone', { part: 'femur', shift: -1 });
    // torso: lamellar do with a cracked hole showing ribs
    k.poly([[29, 40], [51, 40], [52, 54], [28, 54]], 'dark', { part: 'do' });
    for (var y = 43; y <= 52; y += 3) k.rect(28, y, 25, 1, null, { adj: -1, clip: 'do' });
    k.poly([[40, 43], [44, 42], [48, 44], [47, 49], [43, 51], [41, 48]], 'black', { part: 'hole', shade: 'flat', flatTone: 0 });
    k.sym(44, function (m) { });
    [44, 46.5, 49].forEach(function (ry) { k.tube([[40, ry, 0.6], [44, ry - 1, 0.7], [48, ry, 0.6]], 'bone', { clip: 'hole', tone: 4 }); });
    // shoulder plates
    k.sym(C, function (m, s) {
      k.poly([[m(30), 39], [m(20), 42], [m(19), 52], [m(28), 49]], 'dark', { part: 'sode' + s });
      for (var r = 0; r < 3; r++) k.line(m(20), 45 + r * 3, m(28.5), 42 + r * 3, 'dark', 1);
      [44, 47, 50].forEach(function (yy, i) { k.px(m(22 + i), yy, 'red', 4); });
    });
    // katana arm (screen left), claw arm (screen right)
    k.tube([[23, 50, 1.4], [20, 55, 1.3], [18, 57, 1.2]], 'bone', { part: 'armL' });
    k.tube([[17, 60, 1.2], [18, 55, 1.2]], 'black', { part: 'hilt' });
    k.ellipse(18, 55.5, 2.6, 2.3, 'bone', { part: 'handL' });
    k.ellipse(18.5, 52.5, 3.2, 1.2, 'gold', { part: 'tsuba' });
    k.poly([[17.5, 52], [19.5, 52], [15, 20], [13.5, 17], [14, 22]], 'steel', { part: 'blade', shade: 'flat', flatTone: 4 });
    k.line(18.5, 51, 14.5, 21, 'steel', 6);
    k.px(16, 36, 'steel', 0); k.px(16, 43, 'steel', 0); k.px(15, 29, 'steel', 0);
    k.tube([[57, 50, 1.4], [59, 56, 1.3], [59, 60, 1.2]], 'bone', { part: 'armR' });
    k.ellipse(59, 61, 2.4, 2, 'bone', { part: 'handR' });
    k.tooth(57.5, 62, 57, 65, 1.4); k.tooth(59.5, 62, 59.5, 65.5, 1.4); k.tooth(61, 62, 62, 64.5, 1.4);
    // helmet neck-guard
    k.poly([[28, 27], [52, 27], [57, 37], [23, 37]], 'dark', { part: 'shik' });
    for (var yy = 30; yy <= 36; yy += 3) k.rect(22, yy, 36, 1, null, { adj: -1, clip: 'shik' });
    k.rect(22, 36, 36, 1, 'red', { clip: 'shik', tone: 3 });
    // skull
    k.ellipse(C, 33.5, 7.5, 7, 'bone', { part: 'skull' });
    k.sym(C, function (m) { k.ellipse(m(36.8), 33.5, 2.4, 2.2, 'black', { part: 'sock', shade: 'flat', flatTone: 0, noseam: true }); });
    k.sym(C, function (m) { k.rect(m(37) - (m(37) > C ? 1 : 0), 33, 2, 2, 'violet', { part: 'glowE', shade: 'glow', halo: 0.35, outline: 'none' }); });
    k.px(39, 36.5, 'black', 0); k.px(41, 36.5, 'black', 0); k.px(40, 37, 'black', 0);
    k.rect(35.5, 38, 9, 2, 'bone', { part: 'teeth', tone: 5 });
    for (var tx = 36; tx <= 44; tx += 2) k.px(tx, 39, 'black', 0);
    k.rect(35, 40, 10, 1, 'black', { tone: 0, part: 'gap' });
    k.ellipse(C, 42, 5, 1.6, 'bone', { part: 'jaw' });
    // helmet bowl + brim + horns
    k.ellipse(C, 26, 11, 6.5, 'dark', { part: 'kabuto' });
    k.rect(28, 28, 24, 2, 'dark', { part: 'kabuto' });
    [33, 37, 43, 47].forEach(function (vx) { k.line(vx, 21, vx + (vx < C ? -1 : 1), 28, 'dark', 2); });
    k.rect(27, 29, 26, 1, 'gold', { part: 'brim', tone: 4 });
    k.tube([[37, 23, 1.3], [33, 19, 1.1], [31, 15, 0.8], [32, 12, 0.5]], 'gold', { part: 'hornL' });
    k.tube([[43, 23, 1.3], [46, 20, 1.1]], 'gold', { part: 'hornR' });
    k.px(47, 19, 'gold', 3); k.px(47, 20, 'gold', 5);
    k.circle(C, 23, 1.6, 'red', { part: 'mon' });
  };

  // 25 クロガネオロチ — dark UR, eerie: three-headed iron-scaled serpent, molten violet eyes and seams, heaped coils.
  P[25] = function (k) {
    k.shadow(C, 76.5, 30, 2.4);
    // back coil
    k.tube([[10, 68, 4], [22, 61, 6], [40, 58, 6.5], [58, 61, 6], [70, 67, 4]], 'steel', { part: 'coilB', shift: -2 });
    k.texture('coilB', 'scales', { size: 4 });
    // side necks
    k.sym(C, function (m, s) {
      k.tube([[m(31), 62, 6], [m(24), 52, 5.2], [m(18), 42, 4.6], [m(15), 32, 4.2]], 'steel', { part: 'neck' + s, shift: -1 });
      k.texture('neck' + s, 'scales', { size: 4, seed: s + 2 });
      k.tube([[m(31.5), 62, 2.2], [m(25), 52, 2], [m(19.5), 42, 1.8]], 'obsidian', { clip: 'neck' + s });
      k.tufts(s > 0 ? [[m(13), 36], [m(17), 46], [m(22), 56]] : [[m(22), 56], [m(17), 46], [m(13), 36]], 'obsidian', { part: 'sp' + s, len: 3, w: 2.4, every: 3.5, seed: 4 + s });
    });
    // centre neck
    k.tube([[C, 64, 7], [C, 48, 6], [C, 34, 5.2]], 'steel', { part: 'neckC' });
    k.texture('neckC', 'scales', { size: 4, seed: 7 });
    k.tube([[C, 64, 3], [C, 48, 2.8], [C, 36, 2.4]], 'obsidian', { clip: 'neckC' });
    for (var y = 38; y <= 64; y += 3) k.rect(36, y, 9, 1, 'violet', { clip: 'neckC', tone: 4 });
    // front coil + tail blade
    var coil = [[6, 72, 1.6], [12, 70, 3.5], [24, 72, 6], [C, 73, 6.5], [56, 71.5, 6], [66, 67, 4.5], [70, 60, 3], [68, 55, 1.6]];
    k.tube(coil, 'steel', { part: 'coil' });
    k.texture('coil', 'scales', { size: 4, seed: 9 });
    k.tube(coil.map(function (p) { return [p[0], p[1] + p[2] * 0.6, Math.max(0.5, p[2] * 0.3)]; }), 'obsidian', { clip: 'coil' });
    k.spike(68, 56, 72, 46, 5, 'bone', { part: 'tailblade' });
    k.path([[18, 70], [26, 69], [34, 70]], 'violet', 5); k.path([[46, 70], [54, 68], [60, 66]], 'violet', 5);
    // heads
    function head(cx, cy, sc, id, big) {
      k.sym(cx, function (m, s) {
        k.tube([[m(cx - 3 * sc), cy - 3 * sc, 1.6 * sc], [m(cx - 7 * sc), cy - 8 * sc, 1 * sc], [m(cx - 8 * sc), cy - 12 * sc, 0.4]], 'bone', { part: id + 'h' + s });
      });
      k.ellipse(cx, cy, 7 * sc, 5.5 * sc, 'steel', { part: id });
      k.ellipse(cx, cy + 4 * sc, 5 * sc, 3.2 * sc, 'steel', { part: id });
      k.texture(id, 'scales', { size: 3, seed: sc * 10 | 0 });
      k.mouth([[cx - 5 * sc, cy + 3 * sc], [cx + 5 * sc, cy + 3 * sc], [cx + 3 * sc, cy + 7 * sc], [cx, cy + 8 * sc], [cx - 3 * sc, cy + 7 * sc]], { tongue: false });
      k.tooth(cx - 3 * sc, cy + 3 * sc, cx - 2.8 * sc, cy + 5.8 * sc, 1.6 * sc);
      k.tooth(cx + 3 * sc, cy + 3 * sc, cx + 2.8 * sc, cy + 5.8 * sc, 1.6 * sc);
      k.sym(cx, function (m, s) {
        k.poly([[m(cx - 5.5 * sc), cy - 1.5 * sc], [m(cx - 1.5 * sc), cy - 0.5 * sc], [m(cx - 2 * sc), cy + 1.2 * sc], [m(cx - 4.5 * sc), cy + 0.8 * sc]], 'violet', { part: id + 'e', shade: 'glow', halo: big ? 0.35 : 0, outline: 'none' });
        k.line(m(cx - 6 * sc), cy - 2.5 * sc, m(cx - 1 * sc), cy - 1 * sc, 'black', 0);
      });
    }
    head(16, 27, 0.85, 'hL'); head(64, 27, 0.85, 'hR');
    head(C, 19, 1.15, 'hC', true);
    k.tube([[42, 27, 1.2], [44, 32, 1.3], [42, 35, 0.8]], 'red', { part: 'tongue' });
    k.spike(C, 13, C, 6, 4, 'violet', { part: 'gem', shade: 'glow', halo: 0.3 });
  };

  // 27 ヒカリホタル — light C, soothing: firefly fairy with a softly glowing lantern belly, leaf wings,
  // a red bonnet and a sleepy happy smile. Gag: it hugs its own glowing belly like a hot-water bottle.
  P[27] = function (k) {
    k.shadow(C, 76.5, 9, 1.5);
    // leaf wings
    k.sym(C, function (m, s) {
      k.leaf(m(33), 47, m(17), 35, 10, 'leaf', { part: 'wa' + s, flat: true });
      k.leaf(m(33), 53, m(20), 60, 7, 'leaf', { part: 'wb' + s, shift: -1, flat: true });
      k.tube([[m(32), 47, 0.5], [m(20), 37.5, 0.5]], null, { adj: 1, clip: 'wa' + s });
      k.tube([[m(32), 53, 0.5], [m(22), 59, 0.5]], null, { adj: 1, clip: 'wb' + s });
    });
    // little legs
    k.sym(C, function (m, s) { k.tube([[m(36), 66, 1.2], [m(35), 71, 1], [m(33.5), 72, 1]], 'obsidian', { part: 'lg' + s }); });
    // lantern belly
    k.ellipse(C, 60, 10, 9.5, 'light', { part: 'belly', shade: 'glow', halo: 0.3 });
    [55, 59, 63, 67].forEach(function (yy) {
      var hw = 10 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - 60) / 9.5, 2)));
      k.tube([[C - hw, yy - 0.8, 0.5], [C, yy + 0.8, 0.5], [C + hw, yy - 0.8, 0.5]], null, { adj: -1, clip: 'belly' });
    });
    // hugging arms
    k.sym(C, function (m, s) { k.tube([[m(31), 51, 1.6], [m(31), 56, 1.6], [m(35), 58, 1.4]], 'cream', { part: 'arm' + s }); });
    // antennae
    k.sym(C, function (m, s) {
      k.tube([[m(36), 32, 0.6], [m(33), 26, 0.6], [m(29), 24, 0.6]], 'wood', { part: 'ant' + s, shade: 'flat', flatTone: 2 });
      k.circle(m(28), 23.5, 1.8, 'light', { part: 'antG' + s, shade: 'glow' });
    });
    // bonnet + face
    k.ellipse(C, 40, 12.5, 10, 'red', { part: 'hood' });
    k.ellipse(C, 44, 9.5, 7.5, 'cream', { part: 'face', spec: false });
    k.tufts([[31, 41], [28.5, 47]], 'red', { part: 'hood', len: 2, w: 2.5, every: 2.5, seed: 3 });
    k.tufts([[51.5, 47], [49, 41]], 'red', { part: 'hood', len: 2, w: 2.5, every: 2.5, seed: 4 });
    // sleepy happy face
    var F = { K: ['black', 0], s: ['sakura', 4] };
    pm(k, 33, 43, ['.KKK.', 'K...K'], F); pm(k, 43, 43, ['.KKK.', 'K...K'], F);
    k.sym(C, function (m) { k.rect(m(33), 47, 3, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' }); });
    pm(k, 38, 48, ['K...K', '.KsK.'], F);
  };

  // 28 ルミナシカ — light R, soothing/mystic: luminous fawn with crystal antlers and a flower garland, drifting motes.
  P[28] = function (k) {
    k.shadow(C, 76.5, 17, 2);
    // hind legs + flank
    k.sym(C, function (m, s) {
      k.tube([[m(30), 57, 3.4], [m(28), 64, 2.2], [m(29), 67, 1.8], [m(28.5), 72, 1.4]], 'tan', { part: 'hind' + s, shift: -1 });
      k.poly([[m(26.5), 71.5], [m(30.5), 71.5], [m(31), 74.5], [m(26), 74.5]], 'wood', { part: 'hh' + s });
    });
    k.ellipse(C, 55, 15, 7, 'tan', { part: 'flank', shift: -1 });
    k.texture('flank', 'fur', { seed: 3 });
    // chest + forelegs
    k.ellipse(C, 55, 9, 9, 'tan', { part: 'body' });
    k.ellipse(C, 58, 5, 6.5, 'cream', { clip: 'body' });
    k.sym(C, function (m, s) {
      k.tube([[m(35.5), 59, 3], [m(35), 65, 1.8], [m(35), 67, 2], [m(34.5), 72.5, 1.5]], 'tan', { part: 'leg' + s });
      k.poly([[m(32.5), 72], [m(36.5), 72], [m(37), 76], [m(32), 76]], 'wood', { part: 'hoof' + s });
      k.px(m(34.5), 75, 'wood', 0);
    });
    // spots
    [[27, 52], [30, 54], [50, 52], [53, 55], [26, 56], [48, 55]].forEach(function (p) { k.px(p[0], p[1], 'light', 6); });
    // garland
    k.tube([[31, 47, 1.2], [C, 50, 1.3], [49, 47, 1.2]], 'leaf', { part: 'vine' });
    [[32, 47.5], [36, 49.5], [44, 49.5], [48, 47.5]].forEach(function (p, i) { k.circle(p[0], p[1], 1.7, 'sakura', { part: 'fl' + i }); });
    k.circle(C, 50.5, 2, 'gold', { part: 'flC' });
    // ears
    k.sym(C, function (m, s) {
      k.leaf(m(33), 32, m(20), 29, 7, 'tan', { part: 'ear' + s });
      k.leaf(m(32), 31.5, m(22), 29.5, 3, 'sakura', { clip: 'ear' + s, tone: 3 });
    });
    // crystal antlers
    k.sym(C, function (m, s) {
      var o = { part: 'ant' + s, shade: 'flat', flatTone: 4, halo: 0.25 };
      k.poly([[m(36), 29], [m(33), 22], [m(31), 17], [m(33), 18], [m(35), 23], [m(38), 28]], 'crystal', o);
      k.poly([[m(33.5), 23], [m(29), 21], [m(27), 22], [m(33), 25]], 'crystal', o);
      k.line(m(35), 26, m(32), 19, 'crystal', 6);
    });
    // head, muzzle
    k.ellipse(C, 36, 8.5, 8, 'tan', { part: 'head' });
    k.texture('head', 'fur', { seed: 9 });
    k.ellipse(C, 41.5, 4.5, 3.4, 'cream', { part: 'muzzle' });
    pm(k, 39, 40, ['KK', 'KK'], { K: ['black', 1] }); k.px(39, 40, 'black', 5);
    pm(k, 38, 43, ['K..K', '.KK.'], { K: ['tan', 1] });
    // gentle eyes
    var E = { K: ['black', 0], b: ['crystal', 2], c: ['crystal', 4], W: ['white', 6] };
    pm(k, 33, 34, ['.KKK', 'KWbK', 'KbcK', '.KK.'], E);
    pmx(k, 43, 34, ['.KKK', 'KWbK', 'KbcK', '.KK.'], E);
    k.sym(C, function (m) { k.rect(m(33), 39, 2, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' }); });
    // motes
    k.sparkle(14, 30, 1, 'light'); k.sparkle(66, 24, 1, 'light'); k.sparkle(62, 44, 1, 'light'); k.px(18, 44, 'light', 6);
  };

  // 29 シロガネグリフ — light SR, cool: silver griffin, armoured plumage, wings spread, lion forelegs, war cry.
  P[29] = function (k) {
    k.shadow(C, 76.5, 22, 2.4);
    // wings
    k.sym(C, function (m, s) {
      k.poly([[m(31), 42], [m(14), 9], [m(3), 22], [m(4), 31], [m(8), 30], [m(8), 38], [m(12), 36], [m(13), 44], [m(17), 41], [m(19), 49], [m(23), 45], [m(26), 51], [m(30), 49]], 'white', { part: 'wing' + s, flat: true });
      k.texture('wing' + s, 'feather', { size: 4, seed: s + 3 });
      [[m(6), 31], [m(10), 37], [m(15), 43], [m(21), 48]].forEach(function (p) { k.tube([[m(14), 12, 0.5], [p[0], p[1], 0.5]], null, { adj: -2, clip: 'wing' + s }); });
      k.tube([[m(31), 41, 2.4], [m(22), 24, 2], [m(14), 10, 1.5]], 'steel', { part: 'wa' + s });
      k.tube([[m(30.5), 40, 0.6], [m(21.5), 23, 0.6]], 'gold', { clip: 'wa' + s, tone: 5 });
      k.spike(m(14), 11, m(11), 4, 3, 'gold', { part: 'wc' + s });
    });
    // lion tail
    k.tube([[50, 68, 2], [60, 70, 1.8], [66, 64, 1.5], [67, 58, 1.2]], 'tan', { part: 'tail' });
    k.tufts([[65, 60], [69, 56]], 'fur', { part: 'tuft', len: 3, w: 3, every: 1.5, seed: 3 });
    // hind haunches
    k.sym(C, function (m, s) {
      k.ellipse(m(29), 66, 7, 7, 'tan', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(27.5), 74, 5.5, 2.2, 'tan', { part: 'hf' + s, shift: -1 });
    });
    // feathered chest + breastplate
    k.ellipse(C, 55, 12, 13, 'white', { part: 'body' });
    k.texture('body', 'feather', { size: 3, seed: 5 });
    k.poly([[31, 46], [49, 46], [47, 56], [C, 60], [33, 56]], 'steel', { part: 'plate' });
    k.path([[31, 46], [33, 56], [C, 60], [47, 56], [49, 46]], 'gold', 4);
    k.poly([[C, 49], [42, 52], [C, 55], [38, 52]], 'red', { part: 'gem', shade: 'flat', flatTone: 4 });
    k.px(39, 51, 'red', 6);
    // lion forelegs
    k.sym(C, function (m, s) {
      k.tube([[m(33), 58, 4], [m(32), 65, 3.2], [m(32), 70, 3]], 'tan', { part: 'leg' + s });
      k.ellipse(m(31.5), 73, 4.6, 3, 'tan', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 4 + s });
      k.tooth(m(28.5), 74, m(28), 76.5, 1.8); k.tooth(m(31.5), 74.5, m(31.5), 77, 1.8); k.tooth(m(34.5), 74, m(35), 76.5, 1.8);
    });
    // crest feathers
    k.sym(C, function (m, s) {
      k.spike(m(33), 26, m(22), 16, 6, 'white', { part: 'cr' + s });
      k.spike(m(32), 30, m(21), 26, 5, 'white', { part: 'cr' + s });
      k.spike(m(33), 34, m(24), 36, 5, 'white', { part: 'cr' + s });
    });
    // head
    k.ellipse(C, 30, 9, 8.5, 'white', { part: 'head' });
    k.texture('head', 'feather', { size: 3, seed: 8 });
    k.poly([[32, 22], [48, 22], [46, 27], [C, 29], [34, 27]], 'steel', { part: 'helm' });
    k.line(34, 23, 46, 23, 'gold', 5);
    k.spike(C, 23, C, 15, 4, 'gold', { part: 'helmsp' });
    // beak
    k.poly([[35, 31], [45, 31], [43, 37], [C, 42], [37, 37]], 'gold', { part: 'beak' });
    k.mouth([[36, 36.5], [44, 36.5], [42, 40], [C, 41.5], [38, 40]], {});
    k.poly([[36.5, 36], [43.5, 36], [C, 43]], 'gold', { part: 'beakT' });
    k.eye(31, 29, { w: 6, h: 4, iris: 'red', side: 'L', angry: 2, brow: false });
    k.eye(43, 29, { w: 6, h: 4, iris: 'red', side: 'R', angry: 2, brow: false });
  };

  // 30 オーロラクジラ — light UR, soothing/mystic: colossal sky whale wrapped in aurora ribbons, crown ridge,
  // constellation freckles, serene closed-eye smile.
  P[30] = function (k) {
    k.shadow(C, 76.5, 22, 2);
    // aurora ribbons behind
    k.tube([[3, 40, 1], [12, 30, 2.4], [24, 22, 3], [40, 19, 3], [56, 22, 3], [68, 30, 2.4], [77, 40, 1]], 'aqua', { part: 'rib1', shade: 'glow', halo: 0.3 });
    k.tube([[5, 52, 0.8], [11, 44, 2], [16, 38, 2]], 'violet', { part: 'rib2', shade: 'glow' });
    k.tube([[75, 52, 0.8], [69, 44, 2], [64, 38, 2]], 'sakura', { part: 'rib3', shade: 'glow' });
    // flukes rising behind
    k.tube([[C, 30, 5], [C, 18, 3.4], [C, 12, 2.6]], 'crystal', { part: 'stock', shift: -1 });
    k.sym(C, function (m, s) { k.leaf(m(C), 12, m(22), 5, 9, 'crystal', { part: 'fluke' + s, shift: -1 }); });
    // pectoral fins
    k.sym(C, function (m, s) {
      k.leaf(m(22), 52, m(4), 64, 9, 'crystal', { part: 'fin' + s });
      k.tube([[m(20), 55, 0.8], [m(6), 64.5, 0.6]], 'cream', { clip: 'fin' + s, tone: 4 });
    });
    // body
    k.ellipse(C, 48, 23, 20, 'crystal', { part: 'body' });
    k.ellipse(C, 62, 16, 9, 'cream', { clip: 'body' });
    for (var x = 28; x <= 52; x += 3) k.line(x, 55, x + (x - C) * 0.15, 70, 'cream', 2);
    // crown ridge
    [[30, 31, 3], [35, 28, 3.6], [C, 27, 4.2], [45, 28, 3.6], [50, 31, 3]].forEach(function (c, i) {
      k.spike(c[0], c[1] + 3, c[0], c[1] - c[2], 4, 'gold', { part: 'crown' });
    });
    k.circle(C, 29, 1.6, 'crystal', { part: 'cgem', shade: 'glow', halo: 0.3 });
    // constellation freckles
    [[24, 40], [27, 36], [55, 38], [52, 42], [58, 44], [22, 46]].forEach(function (p) { k.px(p[0], p[1], 'white', 6); });
    // serene face
    var F = { K: ['black', 0], s: ['sakura', 4] };
    pm(k, 26, 47, ['K...K', '.KKK.'], F); pm(k, 49, 47, ['K...K', '.KKK.'], F);
    k.sym(C, function (m) { k.rect(m(26), 51, 3, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' }); });
    k.path([[30, 53], [34, 55], [C, 56], [46, 55], [50, 53]], 'crystal', 0);
    k.sparkle(8, 20, 1, 'light'); k.sparkle(72, 16, 1, 'light'); k.sparkle(66, 58, 1, 'white');
  };

})();
