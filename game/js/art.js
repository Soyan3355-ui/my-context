/* ハマカゼFC — procedural pixel art: players, ball, pitch, stadium, backgrounds */
(function () {
  'use strict';
  const { makeCanvas, rand, randi } = E;
  const OUT = '#2a1a24';

  // ---------- helpers ----------
  function outline(c, color = OUT, diag = false) {
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const src = g.getImageData(0, 0, w, h);
    const dst = g.createImageData(w, h);
    dst.data.set(src.data);
    const r = parseInt(color.slice(1, 3), 16), gg = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (A(x, y) > 0) continue;
      let n = A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1);
      if (!n && diag) n = A(x - 1, y - 1) || A(x + 1, y - 1) || A(x - 1, y + 1) || A(x + 1, y + 1);
      if (n) { const i = (y * w + x) * 4; dst.data[i] = r; dst.data[i + 1] = gg; dst.data[i + 2] = b; dst.data[i + 3] = 255; }
    }
    g.putImageData(dst, 0, 0);
    return c;
  }
  function flipH(c) {
    const [o, g] = makeCanvas(c.width, c.height);
    g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
    return o;
  }
  function shade(hex, amt) {
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt * 0.6; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    const h = (v) => ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2);
    return '#' + h(r) + h(g) + h(b);
  }
  // seeded rng for stable decoration
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---------- player sprites ----------
  // sprite canvas 16x22, feet at (8,21)
  const SW = 16, SH = 22;
  const cache = new Map();

  function px(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  function drawHair(g, L, dir, hx, hy) {
    // head box: hx..hx+5, hy..hy+5 (6x6)
    const H = L.hair, Hd = L.hairD, Hl = shade(L.hair, 0.35);
    const st = L.style;
    if (st === 'bald') {
      if (dir === 'up') px(g, L.skinD, hx + 1, hy + 1, 4, 2);
      px(g, shade(L.skin, 0.35), hx + 3, hy, 2, 1);
      if (L.extra === 'mustache' && dir !== 'up') px(g, H, hx + 1, hy + 4, 4, 1);
      return;
    }
    if (dir === 'up') {
      px(g, H, hx, hy - 1, 6, 5); px(g, Hd, hx, hy + 3, 6, 1); px(g, Hl, hx + 1, hy - 1, 3, 1);
      if (st === 'ponytail') { px(g, H, hx + 2, hy + 4, 2, 3); px(g, Hd, hx + 2, hy + 6, 2, 1); }
      if (st === 'long') px(g, H, hx, hy + 3, 6, 2);
    } else if (dir === 'down') {
      px(g, H, hx, hy - 1, 6, 2); px(g, H, hx, hy + 1, 1, 2); px(g, H, hx + 5, hy + 1, 1, 2);
      px(g, Hl, hx + 1, hy - 1, 2, 1);
      if (st === 'long') { px(g, H, hx, hy + 1, 3, 2); px(g, H, hx, hy + 3, 1, 2); }
      if (st === 'bob') { px(g, H, hx - 1, hy + 1, 1, 3); px(g, H, hx + 6, hy + 1, 1, 3); }
    } else { // side (facing right)
      px(g, H, hx, hy - 1, 6, 2); px(g, H, hx, hy + 1, 3, 2); px(g, Hd, hx, hy + 3, 2, 1);
      px(g, Hl, hx + 2, hy - 1, 3, 1);
      if (st === 'ponytail') { px(g, H, hx - 2, hy, 2, 2); px(g, Hd, hx - 3, hy + 1, 2, 2); }
      if (st === 'long') { px(g, H, hx + 3, hy + 1, 3, 1); }
      if (st === 'bob') px(g, H, hx - 1, hy + 1, 1, 3);
    }
    if (st === 'spiky') {
      if (dir === 'side') { px(g, H, hx, hy - 2, 1, 1); px(g, H, hx + 2, hy - 2, 1, 1); px(g, H, hx + 4, hy - 2, 1, 1); }
      else { px(g, H, hx, hy - 2, 1, 1); px(g, H, hx + 2, hy - 2, 2, 1); px(g, H, hx + 5, hy - 2, 1, 1); }
    }
    if (st === 'pomp') {
      if (dir === 'side') { px(g, H, hx + 2, hy - 3, 5, 2); px(g, Hl, hx + 3, hy - 3, 3, 1); }
      else { px(g, H, hx + 1, hy - 3, 4, 2); px(g, Hl, hx + 2, hy - 3, 2, 1); }
    }
    if (st === 'band' || L.extra === 'band' || L.extra === 'towel') {
      const bc = L.extra === 'towel' ? '#f4f4f4' : '#e0474c';
      px(g, bc, hx, hy, 6, 1);
      if (dir === 'side') px(g, bc, hx - 1, hy + 1, 1, 1);
      if (L.extra === 'towel') px(g, '#4f8ee8', hx + (dir === 'side' ? 1 : 0), hy, 2, 1);
    }
    if (L.extra === 'goggles' && dir !== 'up') { px(g, '#5a5f6a', hx, hy, 6, 1); px(g, '#8fd6e8', hx + (dir === 'side' ? 3 : 1), hy, 2, 1); if (dir === 'down') px(g, '#8fd6e8', hx + 3, hy, 2, 1); }
    if (L.extra === 'scarf') { px(g, '#d8404a', hx - 1, hy - 1, 8, 2); px(g, '#fff', hx + 1, hy - 1, 1, 1); px(g, '#fff', hx + 4, hy, 1, 1); }
    if (L.extra === 'cap') {
      if (dir === 'side') { px(g, '#2f86c4', hx, hy - 1, 6, 2); px(g, '#2f86c4', hx - 2, hy, 2, 1); }
      else px(g, '#2f86c4', hx, hy - 1, 6, 2);
    }
  }

  function buildFrame(L, dir, frame) {
    const [c, g] = makeCanvas(SW, SH);
    const T = L.shirt, Td = L.shirtD, Tl = L.shirtL || shade(L.shirt, 0.3);
    const P = L.shorts, Pd = L.shortsD || shade(L.shorts, -0.25);
    const K = L.socks, B = '#3a2c30', Sk = L.skin, Skd = L.skinD;
    const cx = 8;
    // animation params
    let bob = 0, lA = 0, rA = 0, lL = 0, rL = 0, armsUp = false, kick = false;
    if (frame === 'walk0') { bob = 0; lL = -1; rL = 1; lA = 1; rA = -1; }
    if (frame === 'walk1') { bob = -1; }
    if (frame === 'walk2') { bob = 0; lL = 1; rL = -1; lA = -1; rA = 1; }
    if (frame === 'walk3') { bob = -1; }
    if (frame === 'cheer') { armsUp = true; bob = -1; }
    if (frame === 'kick') { kick = true; }
    const by = 21 + bob; // feet line
    if (dir === 'side') {
      // legs (back leg darker)
      const legTop = by - 5;
      if (kick) {
        px(g, Skd, cx - 2, legTop, 2, 3); px(g, K, cx - 2, legTop + 3, 2, 1); px(g, B, cx - 2, legTop + 4, 2, 1);
        px(g, Sk, cx + 1, legTop, 2, 2); px(g, Sk, cx + 3, legTop + 1, 2, 1); px(g, K, cx + 4, legTop + 2, 2, 1); px(g, B, cx + 5, legTop + 2, 2, 1);
      } else {
        const s1 = lL * 2, s2 = rL * 2;
        px(g, Skd, cx - 1 + s2, legTop, 2, 3); px(g, K, cx - 1 + s2, legTop + 3, 2, 1); px(g, B, cx - 1 + s2, legTop + 4, 3, 1);
        px(g, Sk, cx - 1 + s1, legTop, 2, 3); px(g, K, cx - 1 + s1, legTop + 3, 2, 1); px(g, B, cx - 1 + s1, legTop + 4, 3, 1);
      }
      // shorts
      px(g, P, cx - 3, by - 7, 5, 2); px(g, Pd, cx - 3, by - 6, 5, 1);
      // torso
      px(g, T, cx - 3, by - 12, 5, 5); px(g, Td, cx - 3, by - 8, 5, 1); px(g, Tl, cx, by - 12, 2, 1);
      // arm
      if (armsUp) { px(g, T, cx - 1, by - 15, 2, 3); px(g, Sk, cx - 1, by - 17, 2, 2); }
      else { const a = lA; px(g, Td, cx - 1 + a, by - 12, 2, 2); px(g, Sk, cx - 1 + a * 2, by - 10, 2, 2); }
      // head
      const hx = cx - 3, hy = by - 18;
      px(g, Sk, hx, hy, 6, 6); px(g, Skd, hx, hy + 5, 6, 1); px(g, Skd, hx + 5, hy + 1, 1, 1);
      px(g, OUT, hx + 4, hy + 2, 1, 2); // eye
      px(g, '#e8938a', hx + 5, hy + 4, 1, 1);
      drawHair(g, L, 'side', hx, hy);
    } else {
      const up = dir === 'up';
      const legTop = by - 5;
      // legs
      px(g, Sk, cx - 3, legTop + lL, 2, 3 - lL); px(g, K, cx - 3, legTop + 3, 2, 1); px(g, B, cx - 3, legTop + 4 + Math.min(0, lL), 2, 1);
      px(g, Skd, cx + 1, legTop + rL, 2, 3 - rL); px(g, K, cx + 1, legTop + 3, 2, 1); px(g, B, cx + 1, legTop + 4 + Math.min(0, rL), 2, 1);
      // shorts
      px(g, P, cx - 3, by - 7, 6, 2); px(g, Pd, cx + 1, by - 7, 2, 2); px(g, Pd, cx - 1, by - 6, 1, 1);
      // torso
      px(g, T, cx - 4, by - 12, 8, 5); px(g, Td, cx + 2, by - 12, 2, 5); px(g, Td, cx - 4, by - 8, 8, 1);
      if (!up) { px(g, L.collar || '#ffffff', cx - 1, by - 12, 2, 1); px(g, Tl, cx - 3, by - 11, 1, 2); }
      else if (L.num) { px(g, '#ffffff', cx - 1, by - 11, 2, 3); }
      // arms
      if (armsUp) {
        px(g, T, cx - 6, by - 14, 2, 3); px(g, Sk, cx - 6, by - 17, 2, 3);
        px(g, Td, cx + 4, by - 14, 2, 3); px(g, Sk, cx + 4, by - 17, 2, 3);
      } else {
        px(g, T, cx - 6, by - 12 + Math.max(0, lA), 2, 2); px(g, Sk, cx - 6, by - 10 + lA, 2, 2);
        px(g, Td, cx + 4, by - 12 + Math.max(0, rA), 2, 2); px(g, Skd, cx + 4, by - 10 + rA, 2, 2);
      }
      // head
      const hx = cx - 3, hy = by - 18;
      px(g, Sk, hx, hy, 6, 6); px(g, Skd, hx, hy + 5, 6, 1); px(g, Skd, hx + 5, hy, 1, 5);
      if (!up) {
        px(g, OUT, hx + 1, hy + 2, 1, 2); px(g, OUT, hx + 4, hy + 2, 1, 2);
        px(g, '#e8938a', hx, hy + 4, 1, 1); px(g, '#e8938a', hx + 5, hy + 4, 1, 1);
        if (frame === 'cheer') px(g, '#8a2a30', hx + 2, hy + 4, 2, 1);
      }
      drawHair(g, L, up ? 'up' : 'down', hx, hy);
    }
    outline(c);
    return c;
  }

  function buildDive(L) {
    // lying horizontally facing right, arms stretched: 22x12
    const [c, g] = makeCanvas(24, 12);
    const T = L.shirt, Td = L.shirtD, Sk = L.skin;
    px(g, Sk, 18, 3, 4, 2); // arms
    px(g, T, 15, 3, 3, 2);
    px(g, Sk, 11, 2, 5, 5); px(g, L.skinD, 11, 6, 5, 1); // head
    px(g, OUT, 14, 4, 1, 1);
    const HL = Object.assign({}, L);
    // hair over head
    px(g, L.hair, 11, 2, 2, 5); px(g, L.hair, 11, 2, 5, 1);
    px(g, T, 5, 3, 6, 5); px(g, Td, 5, 7, 6, 1);
    px(g, L.shorts, 2, 4, 3, 4);
    px(g, Sk, 0, 5, 2, 2); px(g, L.socks, 0, 7, 2, 1);
    if (HL.extra === 'towel') px(g, '#f4f4f4', 13, 2, 1, 5);
    outline(c);
    return c;
  }

  function sprite(L, dir, frame) {
    const key = L.key + '|' + dir + '|' + frame;
    let c = cache.get(key);
    if (c) return c;
    if (frame === 'dive') c = buildDive(L);
    else if (dir === 'left') c = flipH(sprite(L, 'side', frame));
    else c = buildFrame(L, dir, frame);
    cache.set(key, c);
    return c;
  }
  function diveSprite(L, leftward) {
    const key = L.key + '|dive|' + (leftward ? 'L' : 'R');
    let c = cache.get(key);
    if (!c) { c = buildDive(L); if (leftward) c = flipH(c); cache.set(key, c); }
    return c;
  }

  // ---------- ball ----------
  const ballFrames = [];
  (function () {
    for (let f = 0; f < 4; f++) {
      const [c, g] = makeCanvas(7, 7);
      px(g, '#ffffff', 1, 0, 3, 5); px(g, '#ffffff', 0, 1, 5, 3);
      px(g, '#c9cbd6', 3, 3, 2, 1); px(g, '#c9cbd6', 4, 1, 1, 2);
      const spots = [[1, 1], [3, 2], [1, 3], [2, 0]];
      const [sx, sy] = spots[f];
      px(g, '#2a2a38', sx, sy, 1, 1);
      px(g, '#2a2a38', (sx + 2) % 4, (sy + 2) % 4 + 0, 1, 1);
      const cc = document.createElement('canvas'); cc.width = 7; cc.height = 7;
      const cg = cc.getContext('2d'); cg.drawImage(c, 1, 1);
      outline(cc);
      ballFrames.push(cc);
    }
  })();

  // ---------- pitch ----------
  // world geometry
  const PITCH = { x: 40, y: 64, w: 600, h: 330 }; // playing area in world coords
  const WORLD = { w: PITCH.x * 2 + PITCH.w, h: PITCH.y + PITCH.h + 70 };
  const GOAL_W = 64, GOAL_D = 14, BOX_W = 96, BOX_H = 170, SMALL_W = 34, SMALL_H = 96;

  function buildPitch(evening) {
    const [c, g] = makeCanvas(WORLD.w, WORLD.h);
    const R = rng(7);
    // surroundings: dirt / track + grass bank
    g.fillStyle = '#5c9a48'; g.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = R() < 0.5 ? '#548f42' : '#66a652'; g.fillRect((R() * WORLD.w) | 0, (R() * WORLD.h) | 0, 1, 1 + (R() * 2 | 0)); }
    // gravel apron
    g.fillStyle = '#c7a878'; g.fillRect(PITCH.x - 18, PITCH.y - 14, PITCH.w + 36, PITCH.h + 30);
    for (let i = 0; i < 1600; i++) { g.fillStyle = R() < 0.5 ? '#b6966a' : '#d6ba8c'; g.fillRect(PITCH.x - 18 + ((R() * (PITCH.w + 36)) | 0), PITCH.y - 14 + ((R() * (PITCH.h + 30)) | 0), 1, 1); }
    // grass stripes
    const stripes = 12, sw = PITCH.w / stripes;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? '#4fa84a' : '#5bb655';
      g.fillRect(Math.round(PITCH.x + i * sw), PITCH.y - 4, Math.ceil(sw), PITCH.h + 8);
    }
    // grass texture tufts
    for (let i = 0; i < 5000; i++) {
      const x = PITCH.x + R() * PITCH.w, y = PITCH.y - 4 + R() * (PITCH.h + 8);
      const band = Math.floor((x - PITCH.x) / sw) % 2;
      g.fillStyle = R() < 0.5 ? (band ? '#469a42' : '#52a84c') : (band ? '#5ab352' : '#66c05e');
      g.fillRect(x | 0, y | 0, 1, 2);
    }
    // worn patches (goal mouths, center)
    const worn = (cx, cy, rx, ry, n) => {
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, r = Math.sqrt(R());
        const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
        g.fillStyle = R() < 0.55 ? '#a8925e' : '#8fa04e';
        g.fillRect(x | 0, y | 0, 1 + (R() * 2 | 0), 1);
      }
    };
    worn(PITCH.x + 14, PITCH.y + PITCH.h / 2, 16, 34, 420);
    worn(PITCH.x + PITCH.w - 14, PITCH.y + PITCH.h / 2, 16, 34, 420);
    worn(PITCH.x + PITCH.w / 2, PITCH.y + PITCH.h / 2, 26, 16, 220);
    // lines
    g.fillStyle = 'rgba(255,255,248,0.92)';
    const L = (x, y, w, h) => g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    L(PITCH.x, PITCH.y, PITCH.w, 2); L(PITCH.x, PITCH.y + PITCH.h - 2, PITCH.w, 2);
    L(PITCH.x, PITCH.y, 2, PITCH.h); L(PITCH.x + PITCH.w - 2, PITCH.y, 2, PITCH.h);
    L(PITCH.x + PITCH.w / 2 - 1, PITCH.y, 2, PITCH.h);
    const cy = PITCH.y + PITCH.h / 2;
    for (const side of [0, 1]) {
      const gx = side ? PITCH.x + PITCH.w : PITCH.x, dx = side ? -1 : 1;
      const bx = side ? gx - BOX_W : gx;
      L(bx, cy - BOX_H / 2, BOX_W, 2); L(bx, cy + BOX_H / 2 - 2, BOX_W, 2); L(side ? bx : gx + BOX_W - 2, cy - BOX_H / 2, 2, BOX_H);
      const sx = side ? gx - SMALL_W : gx;
      L(sx, cy - SMALL_H / 2, SMALL_W, 2); L(sx, cy + SMALL_H / 2 - 2, SMALL_W, 2); L(side ? sx : gx + SMALL_W - 2, cy - SMALL_H / 2, 2, SMALL_H);
      L(gx + dx * 66 - 1, cy - 1, 3, 3); // penalty spot
      // arc
      g.beginPath(); g.strokeStyle = 'rgba(255,255,248,0.92)'; g.lineWidth = 2;
      g.save(); g.beginPath(); g.rect(side ? 0 : gx + BOX_W, 0, side ? gx - BOX_W : WORLD.w, WORLD.h); g.clip();
      g.beginPath(); g.ellipse(gx + dx * 66, cy, 40, 40, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    g.beginPath(); g.strokeStyle = 'rgba(255,255,248,0.92)'; g.lineWidth = 2;
    g.arc(PITCH.x + PITCH.w / 2, cy, 44, 0, Math.PI * 2); g.stroke();
    L(PITCH.x + PITCH.w / 2 - 2, cy - 2, 4, 4);
    // de-antialias stroked arcs: quantize alpha
    const id = g.getImageData(0, 0, WORLD.w, WORLD.h);
    // (arcs drawn with AA; we snap semi-transparent white-ish pixels)
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 190) { d[i] = 250; d[i + 1] = 250; d[i + 2] = 242; }
    }
    g.putImageData(id, 0, 0);
    // leave the area above the apron transparent so the stands show through
    g.clearRect(0, 0, WORLD.w, PITCH.y - 14);
    return c;
  }

  // ---------- goals (drawn as world objects, back net + front posts) ----------
  function drawGoal(g, side, ox, oy, shake = 0) {
    const cy = PITCH.y + PITCH.h / 2;
    const gx = side ? PITCH.x + PITCH.w : PITCH.x;
    const dx = side ? 1 : -1;
    const top = cy - GOAL_W / 2, bot = cy + GOAL_W / 2;
    const x0 = Math.round(gx - ox), backX = Math.round(gx + dx * GOAL_D - ox);
    const sh = Math.round(shake);
    // net
    g.fillStyle = 'rgba(240,244,255,0.20)';
    g.fillRect(Math.min(x0, backX), top - 10 - oy, Math.abs(backX - x0), GOAL_W + 10);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (let y = top - 10; y < bot; y += 3) g.fillRect(Math.min(x0, backX), Math.round(y - oy + (y % 6 ? sh : 0)), Math.abs(backX - x0), 1);
    for (let x = 0; x <= GOAL_D; x += 3) g.fillRect(Math.round(gx + dx * x - ox + sh * (x / GOAL_D)), top - 10 - oy, 1, GOAL_W + 10);
    // frame: posts + crossbar (crossbar shown raised by 10 px for perspective)
    g.fillStyle = OUT;
    g.fillRect(x0 - 2, top - 12 - oy, 4, GOAL_W + 14);
    g.fillRect(Math.min(x0, backX) - 1, top - 12 - oy, Math.abs(backX - x0) + 2, 3);
    g.fillStyle = '#ffffff';
    g.fillRect(x0 - 1, top - 11 - oy, 2, GOAL_W + 12);
    g.fillStyle = '#d8dce8';
    g.fillRect(x0 - 1, bot - oy - 2, 2, 2);
    g.fillStyle = '#ffffff';
    g.fillRect(Math.min(x0, backX), top - 11 - oy, Math.abs(backX - x0), 1);
  }

  // ---------- stadium dressing ----------
  const BOARDS = [
    { t: 'おタキのたこ焼き', bg: '#e0474c', fg: '#fff6e0' },
    { t: '浜風商店街', bg: '#2f86c4', fg: '#ffffff' },
    { t: 'モリタ豆腐店', bg: '#fff6e0', fg: '#2a1a24' },
    { t: 'ヤマオロシ製鉄', bg: '#3a3340', fg: '#ff8a5a' },
    { t: '港の湯', bg: '#6cc35a', fg: '#10304f' },
    { t: '潮見書房', bg: '#ffd24a', fg: '#4a2a10' },
  ];
  function buildBoards() {
    const [c, g] = makeCanvas(WORLD.w, 16);
    let x = 4, i = 0;
    while (x < WORLD.w) {
      const b = BOARDS[i % BOARDS.length];
      const w = 96;
      g.fillStyle = OUT; g.fillRect(x - 1, 0, w + 2, 14);
      g.fillStyle = b.bg; g.fillRect(x, 1, w, 12);
      g.fillStyle = shade(b.bg, -0.2); g.fillRect(x, 11, w, 2);
      E.text(g, b.t, x + w / 2, 2, { size: 9, align: 'center', color: b.fg });
      x += w + 4; i++;
    }
    // quantize text AA
    return c;
  }

  // spectators: tiny 5x7 people with different colors; animated jump
  const crowdColors = ['#e0474c', '#4fb4e8', '#ffd24a', '#6cc35a', '#fff6e0', '#b06ad8', '#f08a3a', '#2f86c4', '#ffffff', '#e86aa0'];
  const skinTones = ['#f7c9a0', '#e8b088', '#c98c62', '#f2d2b0'];
  const hairTones = ['#2a1a24', '#4a3020', '#6a4020', '#c0c0c8', '#1a1a2a', '#8a5a30'];
  function makeFan(seed) {
    const R = rng(seed);
    const [c, g] = makeCanvas(7, 9);
    const shirt = crowdColors[(R() * crowdColors.length) | 0];
    const sk = skinTones[(R() * skinTones.length) | 0];
    const hr = hairTones[(R() * hairTones.length) | 0];
    px(g, shirt, 1, 5, 5, 4); px(g, shade(shirt, -0.25), 4, 5, 2, 4);
    px(g, sk, 2, 1, 3, 4); px(g, hr, 2, 0, 3, 2);
    if (R() < 0.3) { px(g, shirt === '#4fb4e8' ? '#fff' : '#4fb4e8', 1, 0, 5, 1); }
    outline(c);
    const [c2, g2] = makeCanvas(7, 9);
    g2.drawImage(c, 0, 0);
    // arms up version
    const [c3, g3] = makeCanvas(9, 11);
    px(g3, sk, 1, 1, 1, 3); px(g3, sk, 7, 1, 1, 3);
    g3.drawImage(c, 1, 2);
    outline(c3);
    return { idle: c, up: c3, phase: R() * 6.28, kind: R() };
  }
  const fans = [];
  for (let i = 0; i < 60; i++) fans.push(makeFan(i * 97 + 13));

  // ---------- background: town panorama (title / cut-scenes) ----------
  function drawSky(g, w, h, top, bottom, steps = 8) {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      g.fillStyle = mix(top, bottom, t);
      g.fillRect(0, Math.floor((h * i) / steps), w, Math.ceil(h / steps) + 1);
    }
  }
  function mix(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => ('0' + Math.round(v + (pb[i] - v) * t).toString(16)).slice(-2)).join('');
  }

  // cached layered town panorama at 480 width
  function buildTown(variant) {
    const W = 480, H = 270;
    const layers = {};
    const R = rng(variant === 'dusk' ? 44 : 21);
    const P = variant === 'dusk'
      ? { skyT: '#3a2a6a', skyB: '#ff9a6a', sun: '#ffe08a', far: '#6a4a7a', mid: '#8a4a5a', house: ['#c86a5a', '#a85a6a', '#e0a070', '#b07aa0'], roof: ['#5a2a4a', '#3a2a5a', '#7a3a3a'], sea: '#e07a6a', seaD: '#a85a6a', seaL: '#ffc090', win: '#ffe08a' }
      : { skyT: '#6ec6f5', skyB: '#dff4ff', sun: '#fff8d0', far: '#8fbcd8', mid: '#6aa0b8', house: ['#fff1c9', '#f2d0a0', '#e8e0d0', '#ffd8c0'], roof: ['#e0474c', '#2f86c4', '#3f8a3e', '#d48a1e'], sea: '#3a9ad8', seaD: '#2f7ab8', seaL: '#bfe8ff', win: '#4a6a8a' };
    // sky
    let [c, g] = makeCanvas(W, H);
    drawSky(g, W, H, P.skyT, P.skyB, 12);
    layers.sky = c;
    // distant mountains
    [c, g] = makeCanvas(W * 2, 90);
    g.fillStyle = P.far;
    let y = 50;
    for (let x = 0; x < W * 2; x++) {
      y += (R() - 0.5) * 2.2 + Math.sin(x / 70) * 0.25;
      y = Math.max(18, Math.min(70, y));
      g.fillRect(x, Math.round(y), 1, 90);
    }
    g.fillStyle = shade(P.far, variant === 'dusk' ? 0.12 : 0.18);
    for (let x = 0; x < W * 2; x += 1) { if (R() < 0.08) g.fillRect(x, 60 + R() * 20, 1 + R() * 4, 1); }
    layers.mountains = c;
    // sea
    [c, g] = makeCanvas(W, 60);
    g.fillStyle = P.sea; g.fillRect(0, 0, W, 60);
    g.fillStyle = P.seaD; for (let i = 0; i < 12; i++) g.fillRect(0, 8 + i * 5, W, 1);
    layers.sea = c;
    // town houses strip (tileable 480)
    [c, g] = makeCanvas(W, 110);
    let x = -4;
    while (x < W) {
      const hw = 22 + ((R() * 26) | 0), hh = 26 + ((R() * 36) | 0);
      const wall = P.house[(R() * P.house.length) | 0], roof = P.roof[(R() * P.roof.length) | 0];
      const base = 110;
      g.fillStyle = wall; g.fillRect(x, base - hh, hw, hh);
      g.fillStyle = shade(wall, -0.12); g.fillRect(x + hw - 3, base - hh, 3, hh);
      // roof
      g.fillStyle = roof;
      for (let r = 0; r < 7; r++) g.fillRect(x - 3 + r, base - hh - 7 + r, hw + 6 - r * 2, 1);
      g.fillStyle = shade(roof, -0.25); g.fillRect(x - 3, base - hh - 1, hw + 6, 1);
      // windows
      for (let wy = base - hh + 5; wy < base - 8; wy += 10) for (let wx = x + 4; wx < x + hw - 6; wx += 8) {
        g.fillStyle = variant === 'dusk' && R() < 0.6 ? P.win : P.win;
        if (variant !== 'dusk' || R() < 0.7) { g.fillRect(wx, wy, 4, 5); g.fillStyle = shade(wall, -0.3); g.fillRect(wx, wy + 5, 4, 1); }
      }
      x += hw + 2 + ((R() * 6) | 0);
    }
    outline(c, variant === 'dusk' ? '#3a2040' : '#35506a');
    layers.town = c;
    return layers;
  }
  const towns = {};
  function town(v) { return towns[v] || (towns[v] = buildTown(v)); }

  // lighthouse, seagull
  function drawSeagull(g, x, y, t, color = '#ffffff') {
    const f = Math.floor(t * 6) % 4;
    const wing = [0, 1, 2, 1][f];
    g.fillStyle = color;
    g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
    g.fillRect(Math.round(x) - 3, Math.round(y) - wing + 1, 2, 1);
    g.fillRect(Math.round(x) + 2, Math.round(y) - wing + 1, 2, 1);
    g.fillRect(Math.round(x) - 4, Math.round(y) - wing * 1.5 + 1, 1, 1);
    g.fillRect(Math.round(x) + 4, Math.round(y) - wing * 1.5 + 1, 1, 1);
  }

  function drawCloud(g, x, y, s, col, colD) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = col;
    g.fillRect(x + 4 * s, y, 10 * s, 4 * s);
    g.fillRect(x, y + 3 * s, 22 * s, 5 * s);
    g.fillRect(x + 12 * s, y - 2 * s, 7 * s, 5 * s);
    g.fillStyle = colD; g.fillRect(x + 1 * s, y + 7 * s, 21 * s, 1 * s);
  }

  window.Art = {
    OUT, sprite, diveSprite, ballFrames, PITCH, WORLD, GOAL_W, GOAL_D, BOX_W, BOX_H,
    buildPitch, drawGoal, buildBoards, fans, town, drawSeagull, drawCloud, drawSky, mix, shade, outline, flipH, rng, makeFan, px,
  };
})();
