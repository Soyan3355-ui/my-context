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
    // wire handle + black lacquered top ring
    k.tube([[35, 27, 0.9], [35.5, 21.5, 0.9], [38, 19.5, 0.9], [42, 19.5, 0.9], [44.5, 21.5, 0.9], [45, 27, 0.9]], 'black', { part: 'wire', shade: 'flat', flatTone: 4 });
    k.ellipse(C, 29.5, 9.5, 2.8, 'black', { part: 'capT', light: 0.3 });
    k.rect(33, 28, 14, 1, 'black', { clip: 'capT', tone: 5 });
    // tall ribbed paper body, lit from the flame inside
    k.ellipse(C, 47, 15, 17.5, 'cream', { part: 'paper' });
    k.tufts([[26, 40], [24.5, 47], [25.5, 54]], 'cream', { part: 'paper', len: 2.5, w: 3, every: 3, seed: 3 });
    k.rect(22, 30, 36, 3, 'red', { clip: 'paper' });
    k.rect(22, 61, 36, 4, 'red', { clip: 'paper' });
    for (var y = 35; y <= 61; y += 4) {
      var hw = 15.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 47) / 17.5, 2)));
      k.tube([[C - hw, y - 0.7, 0.45], [C, y + 0.7, 0.45], [C + hw, y - 0.7, 0.45]], null, { adj: -2, clip: 'paper' });
      if (y > 36 && y < 60) { k.px(Math.round(C + hw), y - 1, 'cream', 1); }
    }
    k.tube([[31, 33, 0.5], [29, 47, 0.5], [31, 60, 0.5]], null, { adj: 1, clip: 'paper' });
    // stains + a red brush stroke
    k.path([[52, 52], [54, 56], [53, 59]], 'cream', 2); k.px(51, 55, 'cream', 2);
    // tear on the upper right: ghost flame inside
    k.poly([[45, 32], [48, 34.5], [51, 32], [55, 34], [55.5, 40], [52, 43], [48.5, 42], [46, 39.5], [47, 36]], 'black', { part: 'hole', shade: 'flat', flatTone: 0 });
    k.tube([[50.5, 40, 2.6], [51, 37.5, 1.9], [49.5, 34, 0.5]], 'violet', { part: 'ghost', shade: 'glow', outline: 'none', noseam: true });
    k.px(50, 39, 'violet', 6); k.px(51, 40, 'violet', 6);
    // loose flap hanging off the left
    k.poly([[25, 57], [21, 61], [22, 68], [25, 65], [28, 60]], 'cream', { part: 'flap', shift: -1 });
    k.line(24, 61, 23, 66, 'cream', 1);
    // bottom ring + tassel
    k.ellipse(C, 65.5, 9, 2.6, 'black', { part: 'capB', light: 0.3 });
    k.tube([[37, 67, 1.2], [37, 71, 1.6]], 'red', { part: 'tassel' });
    k.tufts([[39.5, 72], [34.5, 72]], 'red', { part: 'tassel', len: 2.5, w: 2, every: 1.5, seed: 2 });
    // one giant bloodshot eye, wide open
    k.ellipse(36, 42, 8.5, 6.5, 'white', { part: 'eyeball', spec: false, light: 0.3 });
    k.circle(37, 42.5, 4.6, 'thunder', { clip: 'eyeball' });
    k.circle(37, 43, 2.6, null, { set: 5, clip: 'eyeball', mat: 'thunder' });
    k.circle(37, 42.5, 4.6, 'fire', { clip: 'eyeball', pattern: 'sparse', tone: 3 });
    k.rect(36, 39, 2, 8, 'black', { tone: 0, clip: 'eyeball' });
    k.path([[28, 38], [31, 36], [36, 35], [41, 36], [44, 38]], 'black', 0);
    k.path([[27, 37], [26, 35]], 'black', 0); k.path([[32, 35], [31, 33]], 'black', 0); k.path([[40, 35], [41, 33]], 'black', 0); k.path([[45, 37], [46, 35]], 'black', 0);
    k.path([[28, 44], [30, 43], [31, 44]], 'red', 3); k.path([[44, 45], [43, 43]], 'red', 3); k.path([[29, 40], [31, 41]], 'red', 3); k.path([[43, 39], [42, 40]], 'red', 3);
    k.px(34, 40, 'white', 6); k.px(35, 40, 'white', 6); k.px(34, 41, 'white', 6);
    // torn mouth + lolling tongue
    k.mouth([[26, 51], [29, 53], [31, 50.5], [34, 53], [37, 50.5], [40, 53], [43, 50.5], [46, 53], [49, 50.5], [53, 52.5], [51, 57], [44, 60], [36, 60.5], [30, 58]], { tongue: false });
    k.poly([[34, 58.5], [36, 57], [38.5, 58.5], [36, 59.5]], 'violet', { part: 'throat', shade: 'glow', outline: 'none', noseam: true });
    k.tube([[46, 56, 2.2], [48, 62, 2.6], [48.5, 68, 2.4], [46, 72, 2], [43, 70.5, 1.3]], 'skin', { part: 'tongue' });
    k.line(47.5, 58, 48, 67, 'skin', 2); k.px(47, 60, 'skin', 5); k.px(47, 61, 'skin', 5);
  };

  // 23 クロネコマタ — dark R, cool/妖艶: black two-tailed cat, blue onibi at both tail tips, sly narrowed eyes.
  // Gag: a smug sideways smirk with one fang, a nicked ear, and a little gold bell it wears like it owns the place.
  P[23] = function (k) {
    k.shadow(C, 76.5, 17, 2);
    // two tails, both on one side: a tall hooked one and a low one flicking outwards
    k.tube([[46, 71, 2.8], [57, 68, 2.6], [63, 60, 2.4], [62, 50, 2.1], [59, 43, 1.8], [61, 36, 1.5], [65, 32, 1.1]], 'obsidian', { part: 'tailA', shift: -1 });
    k.tube([[48, 73, 2.8], [60, 74, 2.6], [68, 69, 2.3], [71, 61, 1.9], [72, 54, 1.4]], 'obsidian', { part: 'tailB', shift: -1 });
    k.tube([[61, 58, 0.5], [60.5, 50, 0.5], [57.5, 44, 0.5]], null, { set: 4, clip: 'tailA' });
    k.tube([[66, 69, 0.5], [69, 61, 0.5]], null, { set: 3, clip: 'tailB' });
    wisp(k, 65, 31, 1, 'fl1', 'crystal'); wisp(k, 72, 53, 0.75, 'fl2', 'crystal');
    wisp(k, 13, 46, 0.65, 'fl3', 'crystal', 0);
    // haunches + hind paws
    k.sym(C, function (m, s) {
      k.ellipse(m(30), 65, 7, 8, 'obsidian', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(27.5), 74, 5, 2.2, 'obsidian', { part: 'hp' + s, shift: -1 });
      k.px(m(25), 75, 'black', 0); k.px(m(28), 75, 'black', 0);
    });
    k.texture('haunch1', 'fur', { seed: 8 }); k.texture('haunch-1', 'fur', { seed: 9 });
    // body + chest ruff
    k.ellipse(C, 60, 11, 13, 'obsidian', { part: 'body', shift: -1 });
    k.texture('body', 'fur', { seed: 5 });
    k.tufts([[47, 57], [33, 57]], 'obsidian', { part: 'ruff', len: 5, w: 3, every: 2.5, seed: 4, light: 0.25 });
    // front legs: slim, with toes
    k.sym(C, function (m, s) {
      k.tube([[m(35.5), 60, 3.1], [m(35), 67, 2.4], [m(35), 71, 2.4]], 'obsidian', { part: 'leg' + s, light: 0.2 });
      k.ellipse(m(35), 73.6, 3.8, 2.4, 'obsidian', { part: 'paw' + s, light: 0.15 });
      k.px(m(34), 75, 'black', 0); k.px(m(36), 75, 'black', 0);
      k.line(m(38), 62, m(38), 71, 'black', 1); k.tube([[m(33.5), 61, 0.5], [m(33.5), 68, 0.5]], null, { adj: 1, clip: 'leg' + s });
    });
    // ears (right one nicked)
    k.sym(C, function (m, s) {
      k.spike(m(32), 32, m(25), 17.5, 11, 'obsidian', { part: 'ear' + s });
      k.spike(m(31.5), 31, m(26.5), 22, 5, 'violet', { clip: 'ear' + s, tone: 2 });
      k.tufts(s > 0 ? [[m(29.5), 30], [m(27.5), 24]] : [[m(27.5), 24], [m(29.5), 30]], 'violet', { part: 'ef' + s, len: 2, w: 1.6, every: 2, seed: 9 });
    });
    k.circle(53.2, 23.2, 1, null, { erase: true });
    // head with cheek ruffs
    k.ellipse(C, 38, 13, 10.5, 'obsidian', { part: 'head', light: 0.1 });
    k.tufts([[28, 36], [26, 41], [29, 47]], 'obsidian', { part: 'head', len: 4, w: 3, every: 2.5, seed: 5 });
    k.tufts([[51, 47], [54, 41], [52, 36]], 'obsidian', { part: 'head', len: 4, w: 3, every: 2.5, seed: 6 });
    k.texture('head', 'fur', { seed: 7 });
    k.ellipse(C, 44, 6, 3.6, 'obsidian', { part: 'muzzle', light: 0.3 });
    // collar + bell
    k.tube([[29, 49, 1.5], [C, 52, 1.8], [51, 49, 1.5]], 'red', { part: 'collar' });
    k.circle(C, 54.8, 2.7, 'gold', { part: 'bell' });
    k.px(C, 55, 'black', 0); k.px(C, 56, 'black', 0); k.px(39, 55, 'black', 0); k.px(41, 55, 'black', 0);
    // forehead onibi mark
    k.poly([[C, 28.5], [41.6, 31.5], [C, 33.5], [38.4, 31.5]], 'crystal', { part: 'mark', shade: 'glow', outline: 'none' });
    // sly glowing eyes: narrowed lemons slanting up at the outer corners, slit pupils
    var E = { K: ['black', 0], Y: ['thunder', 5], y: ['thunder', 4], o: ['thunder', 3], W: ['white', 6] };
    var eyeL = ['KK......', 'KYKKK...', '.KYWKYKK', '.KyyKyyK', '..KoKoK.', '...KKK..'];
    pm(k, 29, 35, eyeL, E); pmx(k, 43, 35, eyeL, E);
    // nose, smirk, fang
    k.poly([[38.5, 42], [41.5, 42], [C, 43.5]], 'skin', { part: 'nose', tone: 4 });
    k.px(C, 44, 'black', 0);
    k.path([[34, 45], [36, 46], [39, 45]], 'black', 0);
    k.mouth([[39, 45], [47, 43], [46, 47.5], [42, 48]], { tongue: false });
    k.tooth(44.5, 44.5, 44.5, 47.8, 1.8);
    k.px(42, 47, 'skin', 4);
    // whiskers (kept below the eyes)
    k.path([[29, 44], [22, 42]], 'violet', 5); k.path([[29, 46], [21, 47]], 'violet', 4);
    k.path([[51, 44], [58, 42]], 'violet', 5); k.path([[51, 46], [59, 47]], 'violet', 4);
    // rim light on the shadow side so the black cat reads on dark backdrops
    k.tube([[50, 52, 0.5], [51, 58, 0.5], [49.5, 66, 0.5]], null, { set: 3, clip: 'body' });
    k.tube([[52, 32, 0.5], [53, 40, 0.5]], null, { set: 4, clip: 'head' });
  };

  // 24 ドクロキシ — dark R, eerie: skeleton samurai in broken lacquer armour, chipped katana, glowing sockets,
  // tattered banner. Gag: one kuwagata horn snapped off, and its jaw hangs open in a rattling cackle.
  P[24] = function (k) {
    k.shadow(C, 76.5, 18, 2.2);
    // banner on its back
    k.tube([[58, 58, 0.9], [58, 18, 0.9]], 'wood', { part: 'pole', shift: -1 });
    k.poly([[59, 19], [71, 19], [71, 37], [69, 34], [67, 40], [64.5, 35], [62, 41], [59, 37]], 'red', { part: 'banner', flat: true });
    k.texture('banner', 'cloth', { size: 3 });
    k.circle(65, 26, 3.4, 'black', { clip: 'banner', tone: 1 });
    pm(k, 64, 25, ['bbb', 'k.k', '.b.'], { b: ['bone', 5], k: ['black', 0] });
    k.circle(68.5, 32, 1.2, null, { erase: true });
    k.rect(57, 18, 15, 1, 'wood', { part: 'bar', tone: 3 });
    // legs: bone shins, half greaves, knee caps, bone feet
    k.sym(C, function (m, s) {
      k.tube([[m(34), 62, 1.6], [m(33.5), 72, 1.3]], 'bone', { part: 'shin' + s });
      k.poly([[m(31), 64], [m(36.8), 64], [m(36.3), 69], [m(33.8), 70.5], [m(31.4), 69]], 'dark', { part: 'grv' + s });
      k.line(m(31.5), 65, m(36), 65, 'gold', 4);
      k.circle(m(34), 63, 1.6, 'bone', { part: 'knee' + s });
      k.ellipse(m(33), 74.3, 3.6, 1.7, 'bone', { part: 'foot' + s });
      k.px(m(31), 75, 'bone', 1); k.px(m(33), 75, 'bone', 1);
    });
    // armoured skirt with a missing plate (thigh bone shows through)
    k.poly([[29, 53], [51, 53], [54.5, 63], [25.5, 63]], 'dark', { part: 'skirt' });
    [31.5, 36.5, 46.5].forEach(function (x) { k.line(x, 54, x + (x - C) * 0.12, 62, 'dark', 1); });
    k.rect(25, 58, 31, 1, 'red', { clip: 'skirt', tone: 3, pattern: 'checker' }); k.rect(25, 56, 31, 1, null, { adj: -1, clip: 'skirt' });
    k.rect(25, 62, 31, 1, 'gold', { clip: 'skirt', tone: 4 });
    k.poly([[41.5, 53], [46, 53], [46.5, 58], [44.5, 63], [42, 60]], null, { erase: true });
    k.tube([[43.5, 55, 1.3], [44, 63, 1.1]], 'bone', { part: 'femur', shift: -1 });
    // torso: lamellar do, red lacing rows, a cracked hole showing ribs
    k.poly([[29, 42], [51, 42], [52, 54], [28, 54]], 'dark', { part: 'do' });
    [45, 48, 51].forEach(function (y, i) { k.rect(28, y, 25, 1, null, { adj: -1, clip: 'do' }); if (i !== 1) k.rect(28, y + 1, 25, 1, 'red', { clip: 'do', tone: 3, pattern: 'checker' }); });
    k.tube([[31, 43, 0.5], [30, 53, 0.5]], null, { adj: 1, clip: 'do' });
    k.poly([[38.5, 44], [43, 43], [48, 44], [50, 47], [48.5, 51], [43, 52.5], [39.5, 50]], 'black', { part: 'hole', shade: 'flat', flatTone: 0 });
    k.tube([[39, 46, 0.6], [43, 45, 0.7], [47, 46, 0.6]], 'bone', { clip: 'hole', tone: 4 });
    k.tube([[39, 48.5, 0.6], [42, 47.5, 0.7]], 'bone', { clip: 'hole', tone: 4 }); k.tube([[45, 47.8, 0.6], [49, 48.5, 0.6]], 'bone', { clip: 'hole', tone: 3 });
    k.tube([[40, 51, 0.6], [44, 50, 0.7], [47.5, 51, 0.6]], 'bone', { clip: 'hole', tone: 3 });
    // shoulder plates
    k.sym(C, function (m, s) {
      k.poly([[m(30), 41], [m(20), 43], [m(19), 53], [m(28), 51]], 'dark', { part: 'sode' + s });
      for (var r = 0; r < 3; r++) k.line(m(20), 46 + r * 3, m(28.5), 44 + r * 3, 'red', 3);
      k.line(m(19), 53, m(28), 51, 'gold', 4);
    });
    // katana arm (screen left), claw arm (screen right)
    k.tube([[23, 51, 1.5], [20, 56, 1.3], [18.5, 58, 1.2]], 'bone', { part: 'armL' });
    k.tube([[17.5, 62, 1.2], [18.5, 56, 1.2]], 'black', { part: 'hilt' });
    k.ellipse(18.5, 57, 2.7, 2.3, 'bone', { part: 'handL' });
    k.ellipse(19, 53.8, 3.4, 1.3, 'gold', { part: 'tsuba' });
    k.poly([[17.6, 53.5], [20.4, 53.5], [16, 23], [13.5, 17.5], [14.2, 24]], 'steel', { part: 'blade', shade: 'flat', flatTone: 4 });
    k.line(19.3, 52, 15.2, 23, 'steel', 6);
    k.px(17, 44, 'steel', 1); k.px(16, 34, 'steel', 1); k.px(15, 27, 'steel', 1);
    k.circle(16.2, 39, 0.8, null, { erase: true });
    k.tube([[57, 51, 1.5], [59.5, 57, 1.3], [59.5, 61, 1.2]], 'bone', { part: 'armR' });
    k.ellipse(59.5, 62, 2.4, 2, 'bone', { part: 'handR' });
    k.tooth(58, 63, 57.5, 66, 1.4); k.tooth(60, 63, 60, 66.5, 1.4); k.tooth(61.5, 63, 62.5, 65.5, 1.4);
    // helmet neck-guard flaring behind the skull
    k.poly([[28, 29], [52, 29], [57.5, 39], [22.5, 39]], 'dark', { part: 'shik' });
    [32, 35].forEach(function (y) { k.rect(22, y, 36, 1, null, { adj: -1, clip: 'shik' }); });
    k.rect(22, 38, 36, 1, 'red', { clip: 'shik', tone: 3 });
    // skull: angular, hollow-cheeked, deep black sockets with ember pinpoints
    k.poly([[32, 31], [48, 31], [48.5, 37], [46, 41], [34, 41], [31.5, 37]], 'bone', { part: 'skull' });
    k.ellipse(C, 33, 8.5, 4, 'bone', { part: 'skull' });
    k.sym(C, function (m) {
      k.poly([[m(32.5), 32.5], [m(38.5), 33.5], [m(38), 37], [m(35), 37.5], [m(33), 35.5]], 'black', { part: 'sock', shade: 'flat', flatTone: 0, noseam: true });
      k.path([[m(33), 38], [m(34), 40]], 'bone', 2);
    });
    pm(k, 35, 34, ['.r.', 'rRr', '.r.'], { R: ['red', 6], r: ['red', 4] });
    pm(k, 43, 34, ['.r.', 'rRr', '.r.'], { R: ['red', 6], r: ['red', 4] });
    pm(k, 39, 37, ['K.K', '.K.'], { K: ['black', 0] });
    k.rect(36, 40, 9, 2, 'bone', { part: 'teeth', tone: 5 });
    for (var tx = 36; tx <= 44; tx += 2) k.px(tx, 41, 'bone', 2);
    k.rect(35, 42, 10, 1, 'black', { tone: 0, part: 'gap' });
    k.ellipse(C, 44, 5, 1.8, 'bone', { part: 'jaw' });
    for (var jx = 37; jx <= 43; jx += 2) k.px(jx, 43, 'bone', 5);
    k.path([[46, 32], [45, 34], [46, 35]], 'bone', 1); // crack
    // helmet bowl + gold brim + horns (one snapped)
    k.ellipse(C, 27.5, 10, 5.5, 'dark', { part: 'kabuto' });
    k.rect(29, 29, 22, 2, 'dark', { part: 'kabuto' });
    [33, 37, 43, 47].forEach(function (vx) { k.line(vx, 23, vx + (vx < C ? -1 : 1), 30, 'dark', 2); });
    k.rect(28, 30, 24, 1, 'gold', { part: 'brim', tone: 4 });
    k.tube([[37.5, 24, 1.4], [34, 21, 1.1], [32, 18, 0.8], [33, 16, 0.5]], 'gold', { part: 'hornL' });
    k.tube([[42.5, 24, 1.4], [45, 21.5, 1.1]], 'gold', { part: 'hornR' });
    k.px(46, 20, 'gold', 5); k.px(46, 21, 'gold', 2);
    k.circle(C, 24.5, 1.7, 'red', { part: 'mon' });
    k.px(39, 24, 'red', 6);
  };

  // 25 クロガネオロチ — dark UR, eerie: three-headed iron-scaled serpent, molten violet eyes and seams, heaped coils,
  // a molten gem crown on the middle head. Gag: the middle head can't keep its forked tongue in.
  P[25] = function (k) {
    k.shadow(C, 76.5, 30, 2.4);
    // back coil hump
    k.tube([[8, 70, 3], [16, 60, 5], [28, 55, 6], [40, 57, 6.5], [52, 55, 6], [64, 60, 5], [72, 69, 3]], 'steel', { part: 'coilB', shift: -2 });
    k.texture('coilB', 'scales', { size: 4 });
    // side necks with belly plates and dorsal spines
    k.sym(C, function (m, s) {
      k.tufts(s > 0 ? [[m(12), 34], [m(15), 44], [m(20), 54]] : [[m(20), 54], [m(15), 44], [m(12), 34]], 'obsidian', { part: 'sp' + s, len: 3.5, w: 2.6, every: 3.2, seed: 4 + s });
      k.tube([[m(31), 62, 6], [m(23), 52, 5.2], [m(18), 42, 4.6], [m(16), 33, 4.2]], 'steel', { part: 'neck' + s, shift: -1 });
      k.texture('neck' + s, 'scales', { size: 4, seed: s + 2 });
      k.tube([[m(32), 62, 2.4], [m(24.5), 52, 2.1], [m(20), 42, 1.8], [m(18.5), 36, 1.5]], 'obsidian', { clip: 'neck' + s });
    });
    // centre neck
    k.tufts([[34, 60], [37, 48], [33, 36]], 'obsidian', { part: 'spC', len: 3, w: 2.4, every: 3.5, seed: 11 });
    k.tufts([[44, 34], [49, 48], [46, 60]], 'obsidian', { part: 'spC', len: 3, w: 2.4, every: 3.5, seed: 12 });
    k.tube([[C, 64, 7], [43, 52, 6], [38, 40, 5.4], [C, 32, 5]], 'steel', { part: 'neckC' });
    k.texture('neckC', 'scales', { size: 4, seed: 7 });
    k.tube([[C, 64, 3], [43, 52, 2.8], [38, 40, 2.4], [C, 34, 2.2]], 'obsidian', { clip: 'neckC' });
    for (var y = 37; y <= 63; y += 3) k.tube([[33, y - 0.5, 0.5], [C + 1, y + 0.5, 0.5], [48, y - 0.5, 0.5]], null, { adj: -1, clip: 'neckC', mat: 'obsidian' });
    k.px(39, 45, 'violet', 5); k.px(40, 45, 'violet', 6); k.px(41, 54, 'violet', 5); k.px(40, 54, 'violet', 4);
    // front coil: two humps piled on the ground, tail curling up with an iron blade
    var coil = [[6, 73, 1.6], [12, 70, 4], [20, 65, 5.5], [29, 68, 6], [36, 72.5, 6], [46, 72, 6], [54, 66, 6], [62, 66, 5.2], [68, 70.5, 3.6], [73, 66, 2.4], [72, 59, 1.4]];
    k.tube(coil, 'steel', { part: 'coil' });
    k.texture('coil', 'scales', { size: 4, seed: 9 });
    k.tube(coil.slice(1, 9).map(function (p) { return [p[0], p[1] + p[2] * 0.62, Math.max(0.5, p[2] * 0.3)]; }), 'obsidian', { clip: 'coil' });
    k.spike(72, 60, 75, 50, 5, 'bone', { part: 'tailblade' });
    k.px(74, 53, 'bone', 2);
    // molten seams glowing between the plates
    k.path([[15, 67], [19, 64], [22, 64]], 'violet', 5); k.path([[34, 70], [38, 70], [44, 70]], 'violet', 5); k.path([[52, 64], [56, 63]], 'violet', 5);
    k.px(38, 69, 'violet', 6); k.px(19, 63, 'violet', 6); k.px(55, 62, 'violet', 6);
    // heads: wedge skulls, dark brow ridges, molten slit eyes, open fanged jaws
    function head(cx, cy, sc, id, big) {
      function X(d) { return cx + d * sc; } function Y(d) { return cy + d * sc; }
      k.sym(cx, function (m, s) {
        k.tube([[m(X(-4.5)), Y(-3.5), 1.7 * sc], [m(X(-7.5)), Y(-8), 1.1 * sc], [m(X(-7.5)), Y(-12), 0.4]], 'bone', { part: id + 'h' + s });
        k.px(m(X(-6.5)), Y(-6.5), 'bone', 2);
        k.spike(m(X(-7)), Y(1), m(X(-11)), Y(4), 3.2 * sc, 'steel', { part: id + 'f' + s, shift: -1 });
      });
      k.ellipse(cx, Y(11), 4.2 * sc, 1.8 * sc, 'steel', { part: id + 'j', shift: -1 });
      k.poly([[X(-7), Y(-4)], [X(-3), Y(-6.5)], [X(3), Y(-6.5)], [X(7), Y(-4)], [X(8.5), Y(1)], [X(5.5), Y(5)], [X(-5.5), Y(5)], [X(-8.5), Y(1)]], 'steel', { part: id });
      k.poly([[X(-5.5), Y(2)], [X(5.5), Y(2)], [X(4.2), Y(6.5)], [X(-4.2), Y(6.5)]], 'steel', { part: id });
      k.texture(id, 'scales', { size: 3, seed: sc * 10 | 0 });
      k.mouth([[X(-5), Y(5.5)], [X(5), Y(5.5)], [X(3.8), Y(10)], [X(-3.8), Y(10)]], { tongue: false });
      k.tooth(X(-3.2), Y(5.5), X(-3), Y(8.8), 1.8 * sc); k.tooth(X(3.2), Y(5.5), X(3), Y(8.8), 1.8 * sc);
      k.tooth(X(-1.8), Y(10.2), X(-1.6), Y(8.2), 1.3 * sc); k.tooth(X(1.8), Y(10.2), X(1.6), Y(8.2), 1.3 * sc);
      k.px(X(-1.5), Y(3.5), 'black', 0); k.px(X(1.5), Y(3.5), 'black', 0);
      k.sym(cx, function (m, s) {
        k.poly([[m(X(-7)), Y(-2.2)], [m(X(-1.5)), Y(0)], [m(X(-2.2)), Y(1.8)], [m(X(-6.2)), Y(0.6)]], 'violet', { part: id + 'e', shade: 'flat', flatTone: 4, halo: big ? 0.35 : 0, outline: 'none' });
        k.px(m(X(-3.6)), Y(0.4), 'violet', 6); k.px(m(X(-4.6)), Y(0), 'violet', 6);
        k.tube([[m(X(-7.5)), Y(-3.4), 0.8 * sc], [m(X(-1.2)), Y(-1.2), 0.7 * sc]], 'obsidian', { part: id + 'b' + s });
      });
      k.px(X(-0.5), Y(-4), 'steel', 6); k.px(X(0.5), Y(-3), 'steel', 5);
    }
    head(15, 25, 0.85, 'hL'); head(65, 25, 0.85, 'hR');
    head(C, 18, 1.1, 'hC', true);
    // forked tongue lolling from the middle maw
    k.tube([[41.5, 27, 1.2], [43.5, 32, 1.3], [42.5, 35, 0.8]], 'red', { part: 'tongue' });
    k.px(43.5, 36, 'red', 3); k.px(41.5, 36, 'red', 3);
    // iron crown with a violet gem
    k.poly([[33, 12], [35, 7], [37, 10.5], [C, 4], [43, 10.5], [45, 7], [47, 12]], 'gold', { part: 'crown', shift: -1 });
    k.rect(33, 11, 15, 2, 'gold', { part: 'crown', shift: -1 });
    k.circle(C, 10.5, 1.5, 'violet', { part: 'gem', shade: 'flat', flatTone: 5, halo: 0.3 });
    k.px(39, 10, 'violet', 6);
  };

  // 27 ヒカリホタル — light C, soothing: firefly fairy with a softly glowing lantern belly, leaf wings,
  // a red bonnet and a blissful closed-eye smile. Gag: it hugs its own glowing belly like a hot-water bottle.
  P[27] = function (k) {
    k.shadow(C, 76.5, 9, 1.5);
    // leaf wings
    k.sym(C, function (m, s) {
      k.leaf(m(33), 47, m(16), 34, 11, 'leaf', { part: 'wa' + s, flat: true, light: 0.15 });
      k.leaf(m(34), 54, m(20), 62, 8, 'leaf', { part: 'wb' + s, shift: -1, flat: true });
      k.tube([[m(32), 46.5, 0.5], [m(19), 36.5, 0.5]], null, { adj: -1, clip: 'wa' + s });
      k.tube([[m(27), 42.5, 0.5], [m(25), 38, 0.5]], null, { adj: -1, clip: 'wa' + s });
      k.tube([[m(24), 41, 0.5], [m(20), 42, 0.5]], null, { adj: -1, clip: 'wa' + s });
      k.tube([[m(32), 54, 0.5], [m(22), 60.5, 0.5]], null, { adj: -1, clip: 'wb' + s });
    });
    // little legs
    k.sym(C, function (m, s) { k.tube([[m(36), 66, 1.2], [m(35.5), 71, 1], [m(34), 72.5, 1]], 'obsidian', { part: 'lg' + s }); });
    // lantern belly
    k.ellipse(C, 60, 10, 9.5, 'light', { part: 'belly', shade: 'glow', halo: 0.3 });
    [55, 59, 63, 67].forEach(function (yy) {
      var hw = 10 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - 60) / 9.5, 2)));
      k.tube([[C - hw, yy - 0.8, 0.5], [C, yy + 0.8, 0.5], [C + hw, yy - 0.8, 0.5]], null, { adj: -1, clip: 'belly' });
    });
    k.sparkle(36, 58, 1, 'white');
    // hugging arms + mitten hands
    k.sym(C, function (m, s) {
      k.tube([[m(31.5), 50, 1.7], [m(30), 54, 1.6]], 'red', { part: 'arm' + s });
      k.circle(m(31.5), 56.5, 2.1, 'cream', { part: 'hand' + s });
    });
    // antennae with glowing tips
    k.sym(C, function (m, s) {
      k.tube([[m(36), 31, 0.6], [m(34), 26, 0.6], [m(30), 23, 0.6]], 'wood', { part: 'ant' + s, shade: 'flat', flatTone: 2 });
      k.circle(m(28.5), 22.5, 2, 'light', { part: 'antG' + s, shade: 'glow' });
    });
    // bonnet (the firefly's red shield) + face
    k.ellipse(C, 40, 13, 10.5, 'red', { part: 'hood' });
    k.tufts([[30, 41], [27.5, 47]], 'red', { part: 'hood', len: 2, w: 2.5, every: 2.5, seed: 3 });
    k.tufts([[52.5, 47], [50, 41]], 'red', { part: 'hood', len: 2, w: 2.5, every: 2.5, seed: 4 });
    k.texture('hood', 'cloth', { size: 3 });
    k.rect(39, 29, 2, 7, 'black', { clip: 'hood', tone: 2 });
    k.ellipse(C, 44, 10.5, 7.8, 'cream', { part: 'face', spec: false });
    k.ellipse(C, 38, 8, 2.5, null, { adj: -1, clip: 'face' });
    // blissful face: closed smiling eyes, rosy cheeks, little open smile
    var F = { K: ['black', 0], k: ['black', 3], s: ['sakura', 4], S: ['sakura', 5], m: ['mouth', 3], t: ['skin', 4] };
    pm(k, 31, 42, ['.KKK.', 'K...K'], F); pm(k, 44, 42, ['.KKK.', 'K...K'], F);
    pm(k, 31, 45, ['sSs'], F); pm(k, 46, 45, ['sSs'], F);
    pm(k, 38, 46, ['KKKK', 'KmtK', '.KK.'], F);
    k.px(38, 48, 'cream', 2); k.px(41, 48, 'cream', 2);
    k.px(35, 38, 'cream', 6); k.px(36, 38, 'cream', 5);
  };

  // 28 ルミナシカ — light R, soothing/mystic: luminous fawn resting with legs folded, crystal antlers,
  // glowing dapples, a flower garland and drifting light motes. Gag: a tiny butterfly has settled on one antler tip.
  P[28] = function (k) {
    k.shadow(C, 76.5, 20, 2);
    // resting body, legs folded under
    k.ellipse(C, 65, 17.5, 8.5, 'tan', { part: 'body', shift: -1 });
    k.texture('body', 'fur', { seed: 3 });
    k.tufts([[57, 63], [59, 60]], 'cream', { part: 'scut', len: 2.5, w: 2.5, every: 1.2, seed: 5 });
    [[26, 62], [29, 60], [24, 66], [52, 60], [55, 63], [51, 64], [30, 64], [56, 67]].forEach(function (p) { k.px(p[0], p[1], 'light', 6); k.px(p[0] + 1, p[1], 'light', 5); });
    k.sym(C, function (m, s) {
      k.tube([[m(35.5), 67, 2.6], [m(34), 71, 2.3], [m(31), 72.8, 1.8]], 'tan', { part: 'fore' + s });
      k.poly([[m(30.5), 71.2], [m(27), 72], [m(27), 74.5], [m(30.5), 74.5]], 'wood', { part: 'hoof' + s });
      k.px(m(28.5), 73, 'wood', 0); k.px(m(28.5), 74, 'wood', 0);
    });
    // chest with cream bib
    k.ellipse(C, 62, 8, 7, 'tan', { part: 'chest' });
    k.ellipse(C, 63, 5, 5.5, 'cream', { clip: 'chest' });
    k.tufts([[44, 66], [36, 66]], 'cream', { part: 'bib', len: 2.5, w: 2.4, every: 2, seed: 2 });
    // neck
    k.tube([[C, 60, 5.2], [C, 47, 4.4]], 'tan', { part: 'neck' });
    k.texture('neck', 'fur', { seed: 6 });
    k.tube([[C, 59, 2.4], [C, 49, 2]], 'cream', { clip: 'neck' });
    // garland
    k.tube([[33.5, 50, 1.1], [C, 53, 1.2], [46.5, 50, 1.1]], 'leaf', { part: 'vine' });
    [[34, 50.5], [37, 52.5], [43, 52.5], [46, 50.5]].forEach(function (p, i) { k.circle(p[0], p[1], 1.7, 'sakura', { part: 'fl' + i }); k.px(p[0], p[1], 'gold', 5); });
    k.circle(C, 54, 2.1, 'gold', { part: 'flC' });
    k.px(39, 53, 'gold', 6);
    // ears
    k.sym(C, function (m, s) {
      k.leaf(m(33), 33, m(19), 30, 7.5, 'tan', { part: 'ear' + s });
      k.leaf(m(32), 32.5, m(21.5), 30.5, 3.2, 'sakura', { clip: 'ear' + s, tone: 3 });
    });
    // crystal antlers
    k.sym(C, function (m, s) {
      var o = { part: 'ant' + s, shade: 'flat', flatTone: 4, halo: 0.25 };
      k.poly([[m(36.5), 30], [m(34), 24], [m(32.5), 17], [m(34.5), 17.5], [m(36), 23], [m(38.5), 29]], 'crystal', o);
      k.poly([[m(34.5), 25], [m(29.5), 22], [m(27.5), 18.5], [m(29), 18.5], [m(31), 21], [m(35.3), 23]], 'crystal', o);
      k.poly([[m(33.8), 21.5], [m(37), 18], [m(37.5), 19.5], [m(34.8), 22.5]], 'crystal', o);
      k.line(m(36), 27, m(33.5), 18.5, 'crystal', 6);
      k.line(m(33), 23, m(29), 19.5, 'crystal', 6);
      k.line(m(37.5), 28, m(35.5), 23, 'crystal', 2);
    });
    // butterfly on the left antler tip
    pm(k, 30, 14, ['S.S', 's.s', '.K.'], { S: ['sakura', 5], s: ['sakura', 3], K: ['black', 1] });
    k.px(31, 15, 'black', 1);
    // head, muzzle, nose
    k.ellipse(C, 38, 9, 8.5, 'tan', { part: 'head' });
    k.texture('head', 'fur', { seed: 9 });
    k.ellipse(C, 32, 3, 2, null, { adj: 1, clip: 'head', pattern: 'checker' });
    k.ellipse(C, 43.5, 4.6, 3.4, 'cream', { part: 'muzzle' });
    pm(k, 39, 42, ['bK', 'KK'], { K: ['black', 1], b: ['black', 5] });
    pm(k, 38, 45, ['K..K', '.KK.'], { K: ['tan', 1] });
    // gentle, kind eyes with lashes and soft arched brows
    var E = { K: ['black', 0], b: ['crystal', 2], c: ['crystal', 4], W: ['white', 6], L: ['tan', 1] };
    var eye = ['K.KKK.', '.KWbbK', '.KbccK', '..KKK.'];
    pm(k, 30, 36, eye, E); pmx(k, 44, 36, eye, E);
    k.path([[32, 33], [34, 32], [36, 33]], 'tan', 1); k.path([[44, 33], [46, 32], [48, 33]], 'tan', 1);
    k.sym(C, function (m) { k.rect(m(32), 40, 3, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' }); });
    // drifting motes
    k.circle(16, 40, 1.5, 'light', { part: 'mo1', shade: 'flat', flatTone: 5, outline: 'soft', halo: 0.3 }); k.px(16, 40, 'light', 6);
    k.sparkle(14, 27, 1, 'light'); k.sparkle(66, 24, 1, 'light'); k.sparkle(67, 36, 1, 'white'); k.px(20, 50, 'light', 6); k.px(59, 53, 'light', 6);
  };

  // 29 シロガネグリフ — light SR, cool: silver griffin in armoured plumage, wings flung wide, lion forelegs,
  // a gold war-beak mid-screech. Gag: the eagle half screams bloody murder while the lion half sits like a housecat.
  P[29] = function (k) {
    k.shadow(C, 76.5, 22, 2.4);
    // wings: wrist at the top outer corner, feathers fanning down to a scalloped edge
    k.sym(C, function (m, s) {
      var w = 'wing' + s;
      k.poly([[m(30), 46], [m(14), 9], [m(3), 20], [m(3), 30], [m(7), 29], [m(7), 37], [m(11), 35], [m(12), 43], [m(16), 40], [m(18), 48], [m(22), 44], [m(25), 51], [m(29), 50]], 'white', { part: w, flat: true });
      k.poly([[m(1), 25], [m(12), 27], [m(21), 38], [m(31), 49], [m(20), 53], [m(1), 42]], 'steel', { clip: w });
      k.texture(w, 'feather', { size: 4, seed: s + 3 });
      [[m(5), 30], [m(9), 36], [m(14), 42], [m(20), 47], [m(26), 50]].forEach(function (p) { k.tube([[m(13), 18, 0.5], [p[0], p[1], 0.5]], null, { adj: -2, clip: w }); });
      k.tube([[m(12), 17, 0.5], [m(26), 42, 0.5]], null, { adj: 1, clip: w, pattern: 'checker' });
      k.tube([[m(29), 44, 2.4], [m(21), 26, 2], [m(14), 10, 1.5]], 'steel', { part: 'wa' + s, light: 0.15 });
      k.tube([[m(28.5), 43, 0.6], [m(20.5), 25, 0.6]], 'gold', { clip: 'wa' + s, tone: 5 });
      k.spike(m(14), 11, m(11), 3.5, 3.2, 'gold', { part: 'wc' + s });
    });
    // lion tail
    k.tube([[50, 69, 2], [60, 71, 1.8], [66, 65, 1.5], [67, 59, 1.2]], 'tan', { part: 'tail' });
    k.tufts([[65, 61], [69, 56]], 'fur', { part: 'tuft', len: 3, w: 3, every: 1.3, seed: 3 });
    // hind haunches
    k.sym(C, function (m, s) {
      k.ellipse(m(29), 66, 7, 7.5, 'tan', { part: 'haunch' + s, shift: -1 });
      k.ellipse(m(27.5), 74, 5.5, 2.2, 'tan', { part: 'hf' + s, shift: -1 });
      k.texture('haunch' + s, 'fur', { seed: 6 + s });
    });
    // feathered chest + breastplate
    k.ellipse(C, 55, 12, 12.5, 'white', { part: 'body' });
    k.texture('body', 'feather', { size: 3, seed: 5 });
    k.poly([[33, 47], [47, 47], [45.5, 54], [C, 57.5], [34.5, 54]], 'steel', { part: 'plate' });
    k.path([[33, 47], [34.5, 54], [C, 57.5], [45.5, 54], [47, 47]], 'gold', 4);
    k.poly([[C, 48.5], [42.3, 51.5], [C, 54.5], [37.7, 51.5]], 'red', { part: 'gem', shade: 'flat', flatTone: 4 });
    k.px(39, 50, 'red', 6); k.px(41, 53, 'red', 2);
    // lion forelegs
    k.sym(C, function (m, s) {
      k.tube([[m(33.5), 57, 4.2], [m(32.5), 64, 3.2], [m(32), 70, 3]], 'tan', { part: 'leg' + s });
      k.ellipse(m(31.5), 73, 4.8, 3, 'tan', { part: 'leg' + s });
      k.texture('leg' + s, 'fur', { seed: 4 + s });
      k.tube([[m(35.5), 58, 0.6], [m(34.5), 66, 0.6]], null, { adj: -1, clip: 'leg' + s });
      k.px(m(30), 73, 'tan', 1); k.px(m(33), 73, 'tan', 1);
      k.tooth(m(28.5), 74, m(28), 76.5, 1.8); k.tooth(m(31.5), 74.5, m(31.5), 77, 1.8); k.tooth(m(34.5), 74, m(35), 76.5, 1.8);
    });
    // swept-up crest plumes
    k.sym(C, function (m, s) {
      k.spike(m(35), 23, m(27), 7, 6, 'white', { part: 'cr' + s });
      k.spike(m(33), 25, m(21), 13, 5.5, 'white', { part: 'cr' + s });
      k.spike(m(32), 30, m(21), 24, 5, 'white', { part: 'cr' + s });
      k.tube([[m(34), 21, 0.5], [m(28.5), 10, 0.5]], 'steel', { clip: 'cr' + s, tone: 3 });
    });
    // head + neck ruff
    k.ellipse(C, 29, 10, 9, 'white', { part: 'head' });
    k.tufts([[49, 36], [C, 39.5], [31, 36]], 'white', { part: 'ruff', len: 4, w: 3, every: 2.2, seed: 7 });
    k.texture('head', 'feather', { size: 3, seed: 8 });
    // armoured brow plate
    k.poly([[30.5, 20], [49.5, 20], [47, 24], [C, 25.5], [33, 24]], 'steel', { part: 'helm' });
    k.path([[32, 23], [C, 24], [48, 23]], 'gold', 4);
    k.spike(C, 21, C, 13.5, 3.4, 'gold', { part: 'helmsp' });
    // screeching beak: dark maw at the sides, hooked gold upper beak down the middle
    k.mouth([[34, 33.5], [46, 33.5], [43.5, 40], [C, 42], [36.5, 40]], {});
    k.poly([[33.5, 30], [46.5, 30], [44.5, 34], [42, 39], [C, 43], [38, 39], [35.5, 34]], 'gold', { part: 'beak' });
    k.px(38, 32, 'gold', 1); k.px(42, 32, 'gold', 1);
    k.line(C, 34, C, 41, 'gold', 2);
    // fierce eyes under the plate
    k.eye(31, 26, { w: 7, h: 5, iris: 'red', side: 'L', angry: 1.3, lid: 0.25, brow: false });
    k.eye(42, 26, { w: 7, h: 5, iris: 'red', side: 'R', angry: 1.3, lid: 0.25, brow: false });
    k.sparkle(8, 52, 1, 'light'); k.sparkle(72, 50, 1, 'light');
  };

  // 30 オーロラクジラ — light UR, soothing/mystic: colossal sky whale swimming toward the viewer in 3/4, long body
  // receding to curled-up flukes, gold crown ridge and crystal knobs along the back, aurora ribbons streaming like a
  // cape, constellation freckles, serene closed eye. Gag: it swims straight through a little cloud.
  P[30] = function (k) {
    k.shadow(38, 77, 16, 1.4);
    // far cloud + aurora streamers behind everything
    k.circle(8, 22, 3, 'white', { part: 'cloudB', shift: -1 }); k.circle(13, 20, 3.6, 'white', { part: 'cloudB', shift: -1 }); k.circle(18, 22.5, 2.6, 'white', { part: 'cloudB', shift: -1 });
    k.tube([[24, 38, 0.8], [23, 31, 2], [27, 24, 2.8], [34, 20, 2.4], [42, 17, 3], [48, 12, 2.4], [50, 7, 1.6], [48, 3, 0.6]], 'aqua', { part: 'rib1', shade: 'glow', halo: 0.3 });
    k.tube([[58, 62, 1.2], [66, 59, 2.2], [70, 53, 1.5], [74, 46, 2.4], [72, 38, 1.4], [75, 31, 2], [73, 25, 0.6]], 'violet', { part: 'rib2', shade: 'glow' });
    // broad flukes curling up behind
    k.tube([[63, 23, 4], [68, 16, 2.8], [69, 13, 2.2]], 'crystal', { part: 'stock', shift: -1 });
    k.tube([[69, 13, 2.4], [63, 10, 3.4], [57, 8, 3], [52, 5, 2], [50, 2.5, 0.7]], 'crystal', { part: 'flukeL', shift: -1 });
    k.tube([[69, 13, 2.4], [73, 9, 2.6], [76, 5, 1.8], [77, 2, 0.6]], 'crystal', { part: 'flukeR', shift: -2 });
    k.tube([[66, 10.5, 0.5], [58, 6.5, 0.5], [53, 4, 0.5]], null, { adj: 1, clip: 'flukeL' });
    k.tufts([[51, 5], [58, 10], [64, 13]], 'crystal', { part: 'flukeL', len: 1.5, w: 2.4, every: 3, seed: 4, shift: -1 });
    // far flipper
    k.leaf(52, 55, 66, 67, 6, 'crystal', { part: 'finF', shift: -1 });
    // long receding body + big blunt head (one volume)
    k.tube([[36, 50, 14], [50, 40, 11], [59, 31, 8], [65, 22, 5], [69, 15, 3]], 'crystal', { part: 'body', light: -0.22 });
    k.ellipse(28, 52, 19.5, 14, 'crystal', { part: 'body' });
    k.ellipse(15, 54, 7, 10, 'crystal', { part: 'body' });
    // pale pleated throat + belly running back along the underside
    k.poly([[7, 56], [16, 59], [26, 61], [36, 60], [44, 56], [52, 50], [60, 40], [66, 29], [70, 20], [76, 22], [72, 34], [64, 48], [52, 60], [40, 68], [24, 69], [7, 64]], 'ice', { clip: 'body' });
    for (var i = 0; i < 5; i++) k.tube([[9, 58.5 + i * 2], [26, 62 + i * 1.8], [41, 59 + i * 2], [52, 51 + i * 2.2], [61, 40 + i * 2.4], [67, 29 + i * 2.2]].map(function (p) { return [p[0], p[1], 0.5]; }), null, { adj: -1, clip: 'body', mat: 'ice' });
    // hand-shaded planes: lit crown of the head, rostrum ridge, dorsal highlight, shadowed cheek + flank
    k.ellipse(24, 44, 12, 5, null, { adj: 1, clip: 'body', mat: 'crystal' });
    k.tube([[11, 48, 0.6], [20, 42, 0.7], [32, 38.5, 0.7]], null, { set: 5, clip: 'body' });
    k.tube([[40, 38, 0.6], [50, 31.5, 0.6], [58, 25, 0.5], [64, 18, 0.5]], null, { adj: 1, clip: 'body', mat: 'crystal' });
    k.poly([[38, 53], [48, 50], [50, 53], [44, 56], [38, 57]], null, { adj: -1, clip: 'body', mat: 'crystal' });
    k.tube([[50, 46, 0.6], [58, 38, 0.6], [64, 29, 0.5]], null, { adj: -1, clip: 'body', mat: 'crystal' });
    k.tube([[9, 50, 0.5], [8, 56, 0.5]], null, { adj: 1, clip: 'body' });
    // barnacle knots on the snout
    [[13, 48], [16, 46], [11, 52]].forEach(function (p) { k.px(p[0], p[1], 'bone', 5); k.px(p[0] + 1, p[1], 'bone', 3); k.px(p[0], p[1] + 1, 'bone', 2); });
    // long mouth line sweeping back into a gentle smile
    k.path([[7, 55], [12, 57], [17, 59], [26, 61], [36, 60], [42, 57], [45, 54]], 'black', 0);
    k.path([[9, 54], [16, 57], [26, 59], [36, 58], [42, 55]], 'crystal', 5);
    // small serene closed eye on the side of the head
    pm(k, 42, 46, ['.lll.', 'K...K', '.KKK.'], { K: ['black', 0], l: ['crystal', 5] });
    k.px(47, 46, 'black', 0);
    k.rect(42, 50, 3, 1, 'sakura', { tone: 4, part: 'blush', outline: 'none' });
    // far pale flipper edge + near long flipper, knobbly leading edge
    k.leaf(28, 63, 7, 75, 9, 'crystal', { part: 'finN' });
    k.tufts([[9, 72], [18, 67], [27, 62]], 'crystal', { part: 'finN', len: 1.5, w: 2.4, every: 3, seed: 5 });
    k.tube([[26, 66, 1.3], [10, 75, 0.7]], 'ice', { clip: 'finN', tone: 5 });
    k.tube([[26, 62.5, 0.5], [12, 70, 0.5]], null, { set: 5, clip: 'finN' });
    // crown ridge on the head + crystal knobs down the back
    k.poly([[20, 40], [20.5, 34], [23, 37], [25, 31], [27.5, 36], [30.5, 30.5], [32, 36.5], [35, 33.5], [34.5, 39], [27, 41.5]], 'gold', { part: 'crown' });
    k.path([[21, 39], [27, 40.5], [34, 38]], 'gold', 2);
    k.circle(27.5, 37.5, 1.6, 'crystal', { part: 'cgem', shade: 'flat', flatTone: 5, halo: 0.3 });
    k.px(27, 37, 'white', 6);
    [[42, 29.5, 3.8], [50, 23.5, 3.2], [57, 18, 2.6], [62.5, 14, 2]].forEach(function (c, n) {
      k.spike(c[0] + 1, c[1] + 1.2, c[0] - c[2] * 0.6, c[1] - c[2] * 0.8, c[2], 'crystal', { part: 'kn' + n, shade: 'flat', flatTone: 4 });
      k.px(c[0] - c[2] * 0.3, c[1] - c[2] * 0.4, 'crystal', 6);
      k.px(c[0] + 1, c[1] + 1, 'gold', 4); k.px(c[0], c[1] + 1, 'gold', 5);
    });
    // aurora ribbon streaming from the near flipper back under the body, like a cape
    k.tube([[6, 76, 0.6], [14, 74, 1.8], [22, 75, 2.2], [32, 72, 2.4], [42, 73, 1.8], [50, 69, 2.2], [56, 66, 1.4], [60, 62, 0.6]], 'sakura', { part: 'rib3', shade: 'glow' });
    // constellation freckles: a few bright stars linked by faint lines
    k.path([[38, 44], [44, 41], [49, 37]], 'crystal', 4); k.path([[52, 40], [56, 35]], 'crystal', 4);
    [[38, 44], [44, 41], [49, 37], [52, 40], [56, 35], [20, 49]].forEach(function (p) { k.px(p[0], p[1], 'white', 6); });
    // the little cloud it swims through
    k.circle(64, 72, 2.6, 'white', { part: 'cloudF' }); k.circle(68.5, 70.5, 3.4, 'white', { part: 'cloudF' }); k.circle(73, 72.5, 2.4, 'white', { part: 'cloudF' });
    k.rect(62, 74, 13, 1, 'white', { part: 'cloudF' });
    k.sparkle(6, 34, 1, 'light'); k.sparkle(76, 28, 1, 'light'); k.sparkle(40, 7, 1, 'white'); k.px(30, 20, 'light', 6);
  };

})();
