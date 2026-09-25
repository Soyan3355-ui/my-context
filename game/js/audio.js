/*
 * audio.js — ハマカゼFC sound engine (100% WebAudio synthesis, no assets).
 *
 * Plain browser script. Defines window.Sound:
 *   Sound.init()                 idempotent; creates / resumes the AudioContext (call on first user gesture)
 *   Sound.play(name, opts)       one-shot SFX, opts {vol:0..1, pitch:multiplier, pan:-1..1}
 *   Sound.bgm(name)              crossfade (~0.6s) to a looping track; same name again = no-op
 *   Sound.stopBgm(fadeSec)       fade the current track out (default 1s)
 *   Sound.setBgmRate(r)          smooth tempo (and gentle tape-style pitch) change, 1 = normal
 *   Sound.duck(amount, sec)      lower BGM by `amount` (0 = no change, 1 = silent) for `sec` seconds
 *   Sound.crowd(level)           continuous stadium ambience 0..1 (smoothly ramped, 0 = silent)
 *   Sound.setMuted(bool) / Sound.muted
 *   Sound.masterVolume(v)        0..1 (default 0.6); returns current value
 *
 * All original compositions. Music is stored as note data per section (melody string + chord
 * progression + bass / arpeggio / drum style names) and compiled into a step grid that a
 * lookahead scheduler (25ms timer, >=100ms ahead) plays on AudioContext time.
 */
(function () {
  'use strict';

  var AC = window.AudioContext || window.webkitAudioContext;
  var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  /* ------------------------------------------------------------------ */
  /* Pitch helpers                                                       */
  /* ------------------------------------------------------------------ */
  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midiOf(n) {
    var m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) throw new Error('Sound: bad note "' + n + '"');
    return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  var QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10], sus4: [0, 5, 7], sus2: [0, 2, 7]
  };
  function parseChord(s, tr) {
    var m = /^([A-G])([#b]?)(.*)$/.exec(s);
    if (!m || !QUAL[m[3]]) throw new Error('Sound: bad chord "' + s + '"');
    var root = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + tr + 24) % 12;
    var iv = QUAL[m[3]];
    return { name: s, root: root, iv: iv, pcs: iv.map(function (i) { return (root + i) % 12; }) };
  }

  /* ------------------------------------------------------------------ */
  /* Arrangement building blocks                                         */
  /* ------------------------------------------------------------------ */
  // Bass hits per 16-step bar: [step, token, len]. R root, O octave, F fifth, L fifth below.
  // Any hit that lands on a chord change is forced to the root.
  var BASS = {
    pop: [[0, 'R', 2], [2, 'R', 2], [4, 'O', 2], [6, 'R', 2], [8, 'F', 2], [10, 'R', 2], [12, 'O', 2], [14, 'F', 2]],
    drive: [[0, 'R', 2], [2, 'R', 1], [3, 'R', 1], [4, 'O', 2], [6, 'R', 2], [8, 'R', 2], [10, 'R', 1], [11, 'R', 1], [12, 'O', 2], [14, 'F', 2]],
    oompah: [[0, 'R', 3], [8, 'L', 3], [14, 'F', 2]],
    half: [[0, 'R', 8], [8, 'F', 8]],
    rr: [[0, 'R', 8], [8, 'R', 8]],
    walk: [[0, 'R', 4], [4, 'F', 4], [8, 'O', 4], [12, 'F', 4]],
    whole: [[0, 'R', 16]]
  };
  // Harmony (2nd pulse) hits: [step, toneIndex | 'C' (chord stab), len]
  var ARP = {
    up8: [[0, 0, 2], [2, 2, 2], [4, 1, 2], [6, 2, 2], [8, 3, 2], [10, 2, 2], [12, 1, 2], [14, 2, 2]],
    up16: (function () {
      var o = [], seq = [0, 1, 2, 3, 2, 1, 2, 3];
      for (var i = 0; i < 16; i++) o.push([i, seq[i % 8], 1]);
      return o;
    })(),
    off8: [[2, 'C', 1], [6, 'C', 1], [10, 'C', 1], [14, 'C', 1]],
    stab: [[4, 'C', 2], [12, 'C', 2]],
    pad: [[0, 'C', 16]]
  };
  // Drum lanes, 16 chars per bar: x = accent, y = ghost. k kick, s snare, h hat, o open hat, r rim, c crash.
  var DR = {
    none: {},
    pop: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.y.x.y.x.y.x.y.' },
    popB: { k: 'x.....x.x.x.....', s: '....x.......x..y', h: 'x.y.x.y.x.y.x...', o: '..............x.' },
    popFill: { k: 'x.....x.x.......', s: '....x.......xyxx', h: 'x.y.x.y.x.y.....' },
    vic: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.y.x...x.y.x...', o: '......x.......x.' },
    hub: { k: 'x.......x.......', r: '....x.......x...', h: 'x.y.x.y.x.y.x.y.' },
    hubFill: { k: 'x.......x...x...', r: '....x.......x.xx', h: 'x.y.x.y.x.y.....' },
    match: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.y.x.y.x.y.x...', o: '..............x.' },
    matchB: { k: 'x...x...x...x.x.', s: '....x.......x...', h: 'xyxyxyxyxyxyxyxy' },
    matchFill: { k: 'x...x...x...x...', s: '....x...x.xyxxxx', h: 'x.y.x.y.........' },
    half: { k: 'x.........x.....', s: '........x.......', h: 'x.y.x.y.x.y.x.y.' },
    build: { k: 'x...x...x...x...', s: 'x.y.x.y.xyxyxxxx' },
    lateA: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xyxyxyxyxyxyxyxy' },
    lateT: { k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'xyxyxyxyxyxyxyxy' },
    shaker: { k: 'x.........x.....', h: '..y...y...y...y.' },
    soft: { k: 'x.......x.......', r: '....y.......y...', h: 'y.y.y.y.y.y.y.y.' },
    ballad: { k: 'x.......x.x.....', r: '....x.......x...', h: 'x.y.x.y.x.y.x.y.' },
    fanA: { k: 'x.......x.......', s: 'x.y.x.y.x.y.xxxx' },
    fanB: { k: 'x.......x.......', s: 'x...x...x...xyxx' },
    fanC: { k: 'x...............' }
  };
  var DRUM_VOL = { k: 0.55, s: 0.3, h: 0.08, o: 0.07, r: 0.16, c: 0.12 };

  /* ------------------------------------------------------------------ */
  /* Songs (original)                                                    */
  /* ------------------------------------------------------------------ */
  var MAJ = function (r) { return [0, 2, 4, 5, 7, 9, 11].map(function (i) { return (r + i) % 12; }); };
  var HMIN = function (r) { return [0, 2, 3, 5, 7, 8, 10, 11].map(function (i) { return (r + i) % 12; }); };
  function ext(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

  var TITLE_A_MEL =
    'A4:2 D5:2 F#5:4 E5:2 D5:2 E5:4  F#5:6 A5:2 G5:4 F#5:4  B5:4 A5:2 G5:2 D5:4 B4:4  C#5:4 E5:4 A5:8 ' +
    'B5:2 A5:2 F#5:4 D5:4 F#5:4  G5:6 F#5:2 E5:4 D5:4  E5:2 F#5:2 G5:4 B5:4 A5:4  A5:8 E5:2 F#5:2 G5:2 A5:2';
  var TITLE_B_MEL =
    'B5:4 B5:2 A5:2 G5:4 A5:4  C#6:4 B5:2 A5:2 E5:8  F#5:4 A5:4 C#6:4 B5:4  D6:6 C#6:2 B5:8 ' +
    'G5:2 A5:2 B5:4 D6:4 B5:4  A5:4 G5:2 F#5:2 E5:4 C#5:4  D5:6 E5:2 F#5:4 A5:4  E5:6 F#5:2 E5:4 C#5:4';

  var MATCH_SEC = {
    A: {
      ch: 'Am F G Am Am F G E7', arp: 'off8', bass: 'drive', dr: 'match', fill: 'matchFill', crash: 1, lw: 0.25,
      mel: 'A4:2 A4:1 C5:1 E5:2 A5:2 G5:2 E5:2 D5:2 E5:2  F5:3 E5:1 C5:2 A4:2 C5:4 D5:2 E5:2 ' +
        'D5:3 B4:1 G4:2 B4:2 D5:2 G5:2 F5:2 D5:2  E5:6 C5:2 A4:8 ' +
        'A4:2 A4:1 C5:1 E5:2 A5:2 B5:2 C6:2 B5:2 A5:2  C6:3 A5:1 F5:2 A5:2 C6:4 A5:4 ' +
        'B5:3 G5:1 D5:2 G5:2 B5:4 D6:4  B5:4 G#5:4 E5:4 D5:2 B4:2'
    },
    B: {
      ch: 'F G C Am F G E7 E7', arp: 'up16', bass: 'drive', dr: 'matchB', fill: 'matchFill', crash: 1, lw: 0.5,
      mel: 'A5:4 C6:4 A5:2 G5:2 F5:4  G5:2 A5:2 B5:4 D6:6 B5:2  C6:6 G5:2 E5:4 G5:4  A5:6 E5:2 C5:4 E5:4 ' +
        'F5:2 G5:2 A5:4 C6:4 A5:4  B5:2 C6:2 D6:4 B5:4 G5:4  G#5:4 B5:4 D6:4 B5:4  E6:8 D6:2 B5:2 G#5:2 E5:2'
    },
    C: {
      ch: 'Dm Am Dm E7 Dm Am F E7', arp: 'up8', bass: 'half', lw: 0.125,
      dr: ['half', 'half', 'half', 'half', 'half', 'half', 'matchB', 'build'],
      mel: 'D5:4 F5:4 A5:6 r:2  G5:2 E5:2 C5:4 E5:8  D5:4 F5:4 A5:4 D6:4  B5:8 G#5:8 ' +
        'F5:2 E5:2 D5:4 A5:4 F5:4  E5:2 D5:2 C5:4 E5:4 A5:4  C6:4 A5:4 F5:4 A5:4  B5:4 G#5:4 E5:4 B4:4'
    }
  };

  var SONGS = {
    title: {
      bpm: 112, key: MAJ(2),
      ins: { lead: { v: 0.15 }, harm: { w: 0.125, v: 0.05 } },
      loop: ['A', 'B'],
      sec: {
        A: { ch: 'D F#m G A Bm G Em A', mel: TITLE_A_MEL, arp: 'up8', bass: 'pop', dr: 'pop', fill: 'popFill', crash: 1, lw: 0.5 },
        B: { ch: 'G A F#m Bm G A D A', mel: TITLE_B_MEL, arp: 'up16', bass: 'pop', dr: 'popB', fill: 'popFill', crash: 1, lw: 0.25 }
      }
    },
    hub: {
      bpm: 96, swing: 0.45, key: MAJ(5),
      ins: { lead: { v: 0.16, gate: 0.6, sus: 0.65, vib: 0 }, harm: { w: 0.5, v: 0.045, gate: 0.5 }, bass: { gate: 0.6 } },
      loop: ['A', 'B'],
      sec: {
        A: {
          ch: 'F Dm Gm C7 F Dm Gm/C7 F', arp: 'stab', bass: 'oompah', dr: 'hub', fill: 'hubFill', lw: 0.25,
          mel: 'C5:2 F5:2 A5:2 F5:2 C5:4 r:4  D5:2 F5:2 A5:3 G5:1 F5:2 E5:2 D5:4  Bb4:2 D5:2 G5:4 F5:2 E5:2 D5:4 ' +
            'E5:2 G5:2 Bb5:4 A5:2 G5:2 E5:2 C5:2  F5:2 r:2 F5:2 A5:2 C6:4 A5:4  D6:3 C6:1 A5:2 F5:2 A5:8 ' +
            'G5:2 A5:2 Bb5:4 C6:2 Bb5:2 G5:2 E5:2  F5:4 r:2 C5:1 C5:1 F5:4 r:4'
        },
        B: {
          ch: 'Bb Bb F F Gm C7 F C7', arp: 'stab', bass: 'oompah', dr: 'hub', fill: 'hubFill', lw: 0.125,
          mel: 'D5:2 F5:2 Bb5:2 A5:2 Bb5:4 F5:4  G5:2 F5:2 D5:2 F5:2 Bb4:8  A5:2 G5:2 F5:2 C5:2 A4:4 C5:4  F5:6 G5:2 A5:8 ' +
            'Bb5:4 A5:2 G5:2 D5:4 G5:4  E5:4 G5:4 C6:4 Bb5:4  A5:4 F5:2 C5:2 F5:4 A5:4  G5:2 r:2 E5:2 r:2 C5:2 D5:2 E5:2 G5:2'
        }
      }
    },
    match: {
      bpm: 140, key: HMIN(9),
      ins: { lead: { v: 0.14, gate: 0.85 }, harm: { w: 0.125, v: 0.045, gate: 0.6 }, bass: { gate: 0.7 } },
      loop: ['A', 'B', 'C'],
      sec: MATCH_SEC
    },
    match_late: {
      bpm: 150, tr: 2, key: HMIN(11),
      ins: { lead: { v: 0.14, gate: 0.85 }, harm: { w: 0.125, v: 0.04, gate: 0.6 }, bass: { gate: 0.7 } },
      loop: ['A', 'T', 'B'],
      sec: {
        A: ext(MATCH_SEC.A, { arp: 'up16', dr: 'lateA' }),
        T: {
          ch: 'Am Am F F Dm Dm E7 E7', arp: 'off8', bass: 'drive', dr: 'lateT', fill: 'matchFill', crash: 1, lw: 0.125,
          mel: 'E5:2 E5:2 E5:2 A5:2 E5:2 E5:2 C6:2 B5:2  A5:2 A5:2 G5:2 E5:2 A5:4 E5:4 ' +
            'F5:2 F5:2 F5:2 A5:2 F5:2 F5:2 C6:2 A5:2  C6:4 A5:4 G5:4 F5:4 ' +
            'D5:2 D5:2 F5:2 A5:2 D6:4 C6:2 A5:2  F5:4 A5:4 D6:8 ' +
            'E5:2 G#5:2 B5:2 D6:2 E6:4 D6:2 B5:2  G#5:4 E5:4 B4:4 E5:4'
        },
        B: ext(MATCH_SEC.B, { dr: 'lateA', arp: 'off8' })
      }
    },
    halftime: {
      bpm: 72, key: MAJ(7),
      ins: { lead: { v: 0.12, sus: 0.8, r: 0.25, a: 0.02 }, harm: { w: 0.25, v: 0.04, gate: 0.9, r: 0.12 }, bass: { v: 0.26 }, drums: { v: 0.6 } },
      loop: ['A'],
      sec: {
        A: {
          ch: 'Gmaj7 Em7 Cmaj7 D Gmaj7 Em7 Am7 D', arp: 'up8', bass: 'half', dr: 'shaker', lw: 0.5,
          mel: 'B4:4 D5:4 F#5:8  E5:4 D5:4 B4:8  E5:4 G5:4 B5:8  A5:6 F#5:2 D5:8 ' +
            'B4:4 D5:4 G5:4 F#5:4  G5:6 E5:2 B4:8  C5:4 E5:4 A5:4 G5:4  F#5:12 r:4'
        }
      }
    },
    victory: {
      bpm: 128, key: MAJ(0).concat([3, 8, 10]),
      ins: { lead: { v: 0.15 }, harm: { w: 0.125, v: 0.05 } },
      intro: ['I'], loop: ['A', 'B'],
      sec: {
        I: {
          ch: 'C Ab/Bb C', arp: 'pad', bass: 'rr', dr: ['fanA', 'fanB', 'fanC'], crash: 1, lw: 0.25,
          mel: 'G4:2 C5:2 E5:2 G5:2 C6:6 r:2  Ab5:4 C6:4 Bb5:4 D6:4  C6:12 r:4'
        },
        A: {
          ch: 'C Am F G C Am Dm/G C', arp: 'up8', bass: 'pop', dr: 'vic', fill: 'popFill', crash: 1, lw: 0.25,
          mel: 'E5:2 G5:2 C6:4 B5:2 A5:2 G5:4  A5:4 E5:4 C5:4 E5:4  F5:2 G5:2 A5:4 C6:4 A5:4  G5:6 A5:2 B5:4 D6:4 ' +
            'C6:2 B5:2 C6:4 G5:4 E5:4  A5:2 G5:2 A5:4 C6:4 E6:4  D6:4 C6:2 A5:2 B5:4 G5:4  C6:8 G5:4 E5:4'
        },
        B: {
          ch: 'F G Em Am F G C C', arp: 'up16', bass: 'pop', dr: 'popB', fill: 'popFill', crash: 1, lw: 0.5,
          mel: 'A5:4 G5:2 F5:2 C5:4 F5:4  B5:4 A5:2 G5:2 D5:4 G5:4  G5:4 B5:4 E6:4 D6:2 B5:2  C6:6 B5:2 A5:8 ' +
            'F5:2 A5:2 C6:4 A5:4 F5:4  G5:2 B5:2 D6:4 B5:4 G5:4  E6:4 D6:2 C6:2 G5:4 E5:4  C5:4 E5:2 G5:2 C6:8'
        }
      }
    },
    defeat: {
      bpm: 84, key: HMIN(9),
      ins: { lead: { v: 0.13, sus: 0.8, r: 0.18, a: 0.012 }, harm: { w: 0.25, v: 0.04, gate: 0.8 }, bass: { v: 0.27 }, drums: { v: 0.7 } },
      loop: ['A', 'B'],
      sec: {
        A: {
          ch: 'Am F C G Dm F G C', arp: 'up8', bass: 'walk', dr: 'soft', lw: 0.5,
          mel: 'E5:6 D5:2 C5:4 A4:4  C5:6 D5:2 A4:8  G4:4 C5:4 E5:4 D5:4  D5:12 r:4 ' +
            'F5:6 E5:2 D5:4 A4:4  A5:6 G5:2 F5:4 C5:4  B4:4 D5:4 G5:4 F5:4  E5:12 r:4'
        },
        B: {
          ch: 'F G Em E7', arp: 'up16', bass: 'walk', dr: 'ballad', crash: 1, lw: 0.25,
          mel: 'A5:4 G5:4 F5:4 C5:4  D5:4 G5:4 B5:8  B5:4 A5:2 G5:2 E5:8  G#5:4 B5:4 D5:4 B4:4'
        }
      }
    },
    ending: {
      bpm: 88, key: MAJ(2),
      ins: { lead: { v: 0.13, sus: 0.85, r: 0.22, a: 0.015, gate: 0.95 }, harm: { w: 0.25, v: 0.04, gate: 0.7, r: 0.1 }, bass: { v: 0.27 }, drums: { v: 0.7 } },
      loop: ['A', 'B'],
      sec: {
        A: { ch: 'Dmaj7 F#m7 Gmaj7 A Bm7 Gmaj7 Em7 A', mel: TITLE_A_MEL, arp: 'up16', bass: 'half', dr: 'shaker', lw: 0.5 },
        B: { ch: 'Gmaj7 A F#m7 Bm7 Gmaj7 A Dmaj7 A', mel: TITLE_B_MEL, arp: 'up16', bass: 'walk', dr: 'ballad', crash: 1, lw: 0.25 }
      }
    }
  };

  var INS_DEFAULT = {
    lead: { w: 0.25, v: 0.15, gate: 0.9, a: 0.006, sus: 0.72, r: 0.07, vib: 7 },
    harm: { w: 0.125, v: 0.05, gate: 0.7, a: 0.003, sus: 0.5, r: 0.04 },
    bass: { v: 0.3, gate: 0.85, a: 0.004, sus: 0.9, r: 0.03 },
    drums: { v: 1 }
  };

  /* Compile a song into a step grid (16 steps per 4/4 bar). */
  function compile(name) {
    var d = SONGS[name];
    if (d._c) return d._c;
    var tr = d.tr || 0, steps = [], info = [], pos = 0, loopStart = 0;
    var intro = d.intro || [], order = intro.concat(d.loop);
    function add(s, e) { (steps[s] || (steps[s] = [])).push(e); }
    order.forEach(function (secName, oi) {
      if (oi === intro.length) loopStart = pos;
      var S = d.sec[secName], bars = S.ch.trim().split(/\s+/), nb = bars.length, secLen = nb * 16, spans = [];
      bars.forEach(function (b, bi) {
        var parts = b.split('/'), pl = 16 / parts.length;
        parts.forEach(function (p, pi) { spans.push({ s: bi * 16 + pi * pl, e: bi * 16 + (pi + 1) * pl, ch: parseChord(p, tr) }); });
      });
      function spanAt(st) { for (var i = 0; i < spans.length; i++) if (st >= spans[i].s && st < spans[i].e) return spans[i]; return spans[spans.length - 1]; }
      // melody
      var mp = 0;
      S.mel.trim().split(/\s+/).forEach(function (tok) {
        var q = tok.split(':'), len = +q[1];
        if (!(len > 0)) throw new Error('Sound: bad length in ' + name + '/' + secName + ' "' + tok + '"');
        if (q[0] !== 'r') {
          var m = midiOf(q[0]) + tr, sp = spanAt(mp);
          add(pos + mp, { c: 'lead', m: m, l: len, w: S.lw });
          info.push({ s: pos + mp, c: 'lead', m: m, l: len, root: sp.ch.root, pcs: sp.ch.pcs, chord: sp.ch.name });
        }
        mp += len;
      });
      if (mp !== secLen) throw new Error('Sound: ' + name + '/' + secName + ' melody is ' + mp + ' steps, expected ' + secLen);
      // bass + harmony
      for (var bar = 0; bar < nb; bar++) {
        (BASS[S.bass] || []).forEach(function (h) {
          var st = bar * 16 + h[0], sp = spanAt(st), ch = sp.ch, tok = st === sp.s ? 'R' : h[1];
          var rb = 36 + ch.root; if (rb < 40) rb += 12;
          var m = tok === 'O' ? rb + 12 : tok === 'F' ? rb + ch.iv[2] : tok === 'L' ? rb + ch.iv[2] - 12 : rb;
          var len = Math.min(h[2], sp.e - st);
          add(pos + st, { c: 'bass', m: m, l: len });
          info.push({ s: pos + st, c: 'bass', m: m, l: len, root: ch.root, pcs: ch.pcs, chord: ch.name, change: st === sp.s });
        });
        (ARP[S.arp] || []).forEach(function (h) {
          var st = bar * 16 + h[0], sp = spanAt(st), ch = sp.ch, len = Math.min(h[2], sp.e - st);
          var base = 60 + ch.root; if (ch.root > 7) base -= 12;
          var ms;
          if (h[1] === 'C') ms = ch.iv.slice(1).map(function (i) { return base + i; });
          else { var n = ch.iv.length, k = h[1]; ms = [base + ch.iv[k % n] + 12 * Math.floor(k / n)]; }
          ms.forEach(function (m) {
            add(pos + st, { c: 'harm', m: m, l: len, g: ms.length > 1 ? 0.75 : 1 });
            info.push({ s: pos + st, c: 'harm', m: m, l: len, root: ch.root, pcs: ch.pcs, chord: ch.name });
          });
        });
        var dn = Array.isArray(S.dr) ? S.dr[bar % S.dr.length] : (S.fill && bar === nb - 1 ? S.fill : S.dr);
        var P = DR[dn] || {};
        Object.keys(P).forEach(function (lane) {
          var str = P[lane];
          for (var i = 0; i < 16; i++) {
            var cc = str.charAt(i);
            if (cc === 'x' || cc === 'y') add(pos + bar * 16 + i, { c: lane, v: cc === 'x' ? 1 : 0.5 });
          }
        });
      }
      if (S.crash) add(pos, { c: 'c', v: 1 });
      pos += secLen;
    });
    var ins = {};
    Object.keys(INS_DEFAULT).forEach(function (k) { ins[k] = ext(INS_DEFAULT[k], (d.ins || {})[k] || {}); });
    var sec16 = 60 / d.bpm / 4;
    d._c = {
      name: name, bpm: d.bpm, len: pos, loopStart: loopStart, steps: steps, info: info, ins: ins,
      swing: d.swing || 0, key: d.key, stepSec: sec16,
      loopSeconds: (pos - loopStart) * sec16, introSeconds: loopStart * sec16
    };
    return d._c;
  }

  /* ------------------------------------------------------------------ */
  /* Engine graph (built for the live context and for offline renders)   */
  /* ------------------------------------------------------------------ */
  function makeEngine(ctx) {
    var E = { ctx: ctx, waves: {}, rate: 1, pitch: 1 };
    var len = Math.floor(ctx.sampleRate * 2), buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    E.noise = buf;

    E.comp = ctx.createDynamicsCompressor();
    E.comp.threshold.value = -12; E.comp.knee.value = 10; E.comp.ratio.value = 4;
    E.comp.attack.value = 0.003; E.comp.release.value = 0.25;
    E.mute = ctx.createGain();
    E.master = ctx.createGain(); E.master.gain.value = 0.6;
    E.master.connect(E.mute); E.mute.connect(E.comp); E.comp.connect(ctx.destination);

    E.sfxLP = ctx.createBiquadFilter(); E.sfxLP.type = 'lowpass'; E.sfxLP.frequency.value = 11000; E.sfxLP.Q.value = 0;
    E.sfx = ctx.createGain(); E.sfx.connect(E.sfxLP); E.sfxLP.connect(E.master);

    E.bgmVol = ctx.createGain(); E.bgmVol.gain.value = 0.5;
    E.duck = ctx.createGain();
    E.bgmLP = ctx.createBiquadFilter(); E.bgmLP.type = 'lowpass'; E.bgmLP.frequency.value = 7000; E.bgmLP.Q.value = 0.3;
    E.bgmIn = ctx.createGain();
    E.bgmIn.connect(E.bgmVol); E.bgmVol.connect(E.duck); E.duck.connect(E.bgmLP); E.bgmLP.connect(E.master);

    // tempo-synced echo for lead / harmony
    E.delayIn = ctx.createGain();
    E.delay = ctx.createDelay(2); E.delay.delayTime.value = 0.4;
    var fbLP = ctx.createBiquadFilter(); fbLP.type = 'lowpass'; fbLP.frequency.value = 2600; fbLP.Q.value = 0;
    var fb = ctx.createGain(); fb.gain.value = 0.3;
    var wet = ctx.createGain(); wet.gain.value = 0.22;
    E.delayIn.connect(E.delay); E.delay.connect(fbLP); fbLP.connect(fb); fb.connect(E.delay);
    E.delay.connect(wet); wet.connect(E.bgmVol);
    return E;
  }

  function pulseWave(E, duty) {
    var key = String(duty);
    if (!E.waves[key]) {
      var N = 32, re = new Float32Array(N + 1), im = new Float32Array(N + 1);
      for (var n = 1; n <= N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty) * (1 - n / (N + 8));
      E.waves[key] = E.ctx.createPeriodicWave(re, im);
    }
    return E.waves[key];
  }
  function setWave(E, o, w) { if (typeof w === 'number') o.setPeriodicWave(pulseWave(E, w)); else o.type = w || 'sine'; }
  function panner(ctx, p) {
    if (ctx.createStereoPanner) { var s = ctx.createStereoPanner(); s.pan.value = p; return s; }
    return ctx.createGain();
  }

  /* one-shot tone: exponential attack/hold/decay, optional pitch bend and lowpass */
  function tn(E, dest, t, o) {
    var c = E.ctx, osc = c.createOscillator(), g = c.createGain();
    var a = o.a || 0.004, h = o.h || 0, d = o.d || 0.1, end = t + a + h + d;
    setWave(E, osc, o.w);
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.ft || a + h + d));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.v), t + a);
    if (h > 0) g.gain.setValueAtTime(Math.max(0.0002, o.v), t + a + h);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    var out = g;
    if (o.lp) {
      var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.lq || 0;
      osc.connect(f); f.connect(g);
    } else osc.connect(g);
    out.connect(dest);
    osc.start(t); osc.stop(end + 0.02);
    return osc;
  }
  /* one-shot filtered noise */
  function nz(E, dest, t, o) {
    var c = E.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    var a = o.a || 0.003, h = o.h || 0, d = o.d || 0.1, end = t + a + h + d;
    s.buffer = E.noise; s.loop = true;
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.ft || a + h + d));
    f.Q.value = o.q != null ? o.q : (f.type === 'bandpass' ? 1 : 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.v), t + a);
    if (h > 0) g.gain.setValueAtTime(Math.max(0.0002, o.v), t + a + h);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 1.5); s.stop(end + 0.02);
    return f;
  }
  function vibrato(E, osc, t, rate, cents, delay, stopAt) {
    var c = E.ctx, l = c.createOscillator(), g = c.createGain();
    l.frequency.value = rate;
    g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(cents, t + delay + 0.2);
    l.connect(g); g.connect(osc.detune); l.start(t); l.stop(stopAt);
  }
  var M = mtof;

  /* ------------------------------------------------------------------ */
  /* SFX                                                                 */
  /* ------------------------------------------------------------------ */
  var SFX = {
    cursor: function (E, d, t, p) {
      tn(E, d, t, { w: 0.25, f: 1480 * p, f1: 1250 * p, a: 0.002, d: 0.035, v: 0.2 });
    },
    select: function (E, d, t, p) {
      tn(E, d, t, { w: 0.5, f: M(83) * p, a: 0.003, h: 0.04, d: 0.04, v: 0.13 });
      tn(E, d, t + 0.065, { w: 0.25, f: M(90) * p, a: 0.003, h: 0.05, d: 0.2, v: 0.14 });
    },
    cancel: function (E, d, t, p) {
      tn(E, d, t, { w: 0.5, f: M(74) * p, a: 0.003, h: 0.04, d: 0.04, v: 0.13 });
      tn(E, d, t + 0.07, { w: 0.5, f: M(67) * p, f1: M(66) * p, a: 0.003, h: 0.04, d: 0.14, v: 0.13, lp: 2500 });
    },
    blip: function (E, d, t, p) {
      // single oscillator, deliberately cheap
      tn(E, d, t, { w: 0.5, f: 560 * p, a: 0.002, d: 0.03, v: 0.05, lp: 3000 });
    },
    page: function (E, d, t, p) {
      tn(E, d, t, { w: 'triangle', f: 520 * p, f1: 1040 * p, a: 0.003, d: 0.07, v: 0.22 });
      tn(E, d, t + 0.04, { w: 0.5, f: 1046 * p, a: 0.002, d: 0.06, v: 0.05 });
    },
    kick: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 150 * p, f1: 60 * p, a: 0.002, d: 0.13, v: 0.6 });
      nz(E, d, t, { type: 'lowpass', f: 900, a: 0.001, d: 0.04, v: 0.25 });
    },
    pass: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 200 * p, f1: 90 * p, a: 0.002, d: 0.09, v: 0.45 });
      nz(E, d, t, { f: 1900, f1: 900, q: 1, a: 0.01, d: 0.13, v: 0.12 });
    },
    shoot: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 180 * p, f1: 40 * p, a: 0.002, d: 0.22, v: 0.9 });
      nz(E, d, t, { type: 'lowpass', f: 1600, a: 0.001, d: 0.05, v: 0.5 });
      nz(E, d, t + 0.01, { f: 2600, f1: 600, q: 0.9, a: 0.02, d: 0.36, v: 0.32 });
    },
    power_shot: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 150 * p, f1: 32 * p, a: 0.002, d: 0.38, v: 0.95 });
      tn(E, d, t, { w: 0.5, f: 90 * p, f1: 40 * p, a: 0.002, d: 0.14, v: 0.12, lp: 1200 });
      nz(E, d, t, { type: 'lowpass', f: 2000, a: 0.001, d: 0.07, v: 0.55 });
      nz(E, d, t + 0.01, { f: 3200, f1: 500, q: 0.8, a: 0.03, d: 0.55, v: 0.34 });
      [88, 92, 95, 100, 104].forEach(function (m, i) {
        tn(E, d, t + 0.12 + i * 0.055, { w: 0.125, f: M(m) * p, a: 0.002, d: 0.26, v: 0.06 });
      });
      nz(E, d, t + 0.1, { type: 'highpass', f: 4000, f1: 9000, a: 0.2, d: 0.35, v: 0.07 });
    },
    post: function (E, d, t, p) {
      var parts = [[523, 0.9, 0.22], [1187, 0.6, 0.13], [1759, 0.45, 0.09], [2449, 0.3, 0.06], [3301, 0.2, 0.04]];
      parts.forEach(function (q) { tn(E, d, t, { w: 'sine', f: q[0] * p, a: 0.001, d: q[1], v: q[2] }); });
      tn(E, d, t, { w: 'sine', f: 220 * p, f1: 90 * p, a: 0.002, d: 0.08, v: 0.4 });
      nz(E, d, t, { type: 'highpass', f: 3000, a: 0.001, d: 0.03, v: 0.2 });
    },
    net: function (E, d, t) {
      nz(E, d, t, { f: 3200, f1: 1400, q: 0.7, a: 0.015, d: 0.45, v: 0.35 });
      nz(E, d, t + 0.05, { type: 'highpass', f: 5000, a: 0.02, d: 0.3, v: 0.08 });
      tn(E, d, t, { w: 'sine', f: 120, f1: 70, a: 0.005, d: 0.12, v: 0.2 });
    },
    goal: function (E, d, t, p) {
      [72, 76, 79].forEach(function (m, i) { tn(E, d, t + i * 0.075, { w: 0.25, f: M(m) * p, a: 0.003, h: 0.04, d: 0.03, v: 0.13 }); });
      var ch = [[0.24, [68, 72, 75], 44], [0.42, [70, 74, 77], 46]];
      ch.forEach(function (c) {
        c[1].forEach(function (m, i) { tn(E, d, t + c[0], { w: i ? 0.5 : 0.25, f: M(m) * p, a: 0.004, h: 0.1, d: 0.05, v: 0.08 }); });
        tn(E, d, t + c[0], { w: 'triangle', f: M(c[2]) * p, a: 0.004, h: 0.1, d: 0.05, v: 0.3 });
      });
      var T = t + 0.6;
      [72, 76, 79, 84].forEach(function (m, i) {
        var o = tn(E, d, T, { w: i === 3 ? 0.25 : 0.5, f: M(m) * p, a: 0.006, h: 0.55, d: 0.34, v: i === 3 ? 0.1 : 0.07 });
        vibrato(E, o, T, 6, 12, 0.15, T + 0.95);
      });
      tn(E, d, T, { w: 'triangle', f: M(48) * p, a: 0.004, h: 0.55, d: 0.3, v: 0.32 });
      tn(E, d, T, { w: 'sine', f: 150, f1: 50, a: 0.002, d: 0.2, v: 0.45 });
      nz(E, d, T, { type: 'highpass', f: 5000, a: 0.002, d: 0.85, v: 0.12 });
    },
    concede: function (E, d, t, p) {
      var c = E.ctx, notes = [[0, 67, 0.26], [0.3, 66, 0.26], [0.6, 65, 0.26], [0.9, 64, 0.75]];
      notes.forEach(function (n, i) {
        var T = t + n[0], dur = n[2], last = i === 3;
        var o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        setWave(E, o, 0.5);
        o.frequency.setValueAtTime(M(n[1]) * p, T);
        if (last) o.frequency.linearRampToValueAtTime(M(n[1]) * p * 0.96, T + dur);
        f.type = 'lowpass'; f.Q.value = 4;
        f.frequency.setValueAtTime(300, T); f.frequency.exponentialRampToValueAtTime(1500, T + 0.08);
        f.frequency.exponentialRampToValueAtTime(450, T + dur);
        g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.16, T + 0.03);
        g.gain.setValueAtTime(0.16, T + dur - 0.08); g.gain.linearRampToValueAtTime(0, T + dur);
        o.connect(f); f.connect(g); g.connect(d); o.start(T); o.stop(T + dur + 0.02);
        if (last) vibrato(E, o, T, 5, 25, 0.2, T + dur + 0.02);
        tn(E, d, T, { w: 'triangle', f: M(n[1] - 24) * p, a: 0.01, h: dur - 0.1, d: 0.08, v: 0.22 });
      });
    },
    whistle: function (E, d, t, p) { whistle(E, d, t, 0.32, p); },
    whistle_long: function (E, d, t, p) {
      whistle(E, d, t, 0.26, p); whistle(E, d, t + 0.38, 0.26, p); whistle(E, d, t + 0.76, 1.0, p);
    },
    tackle: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 115 * p, f1: 45 * p, a: 0.002, d: 0.16, v: 0.7 });
      nz(E, d, t, { type: 'lowpass', f: 600, a: 0.002, d: 0.08, v: 0.55 });
      nz(E, d, t + 0.06, { f: 900, q: 1.2, a: 0.005, d: 0.12, v: 0.2 });
      nz(E, d, t + 0.13, { f: 1400, q: 1.2, a: 0.005, d: 0.08, v: 0.13 });
    },
    save: function (E, d, t, p) {
      nz(E, d, t, { type: 'highpass', f: 1500, a: 0.001, d: 0.045, v: 0.55 });
      tn(E, d, t, { w: 'sine', f: 240 * p, f1: 110 * p, a: 0.002, d: 0.09, v: 0.5 });
      nz(E, d, t + 0.005, { f: 700, q: 1.5, a: 0.002, d: 0.1, v: 0.25 });
    },
    bounce: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 330 * p, f1: 200 * p, a: 0.002, d: 0.07, v: 0.35 });
      nz(E, d, t, { type: 'highpass', f: 2000, a: 0.001, d: 0.012, v: 0.05 });
    },
    cheer: function (E, d, t) {
      nz(E, d, t, { f: 900, q: 0.6, a: 0.12, h: 0.3, d: 1.6, v: 0.3 });
      nz(E, d, t, { f: 2200, q: 1, a: 0.1, h: 0.2, d: 1.2, v: 0.12 });
      for (var i = 0; i < 14; i++) nz(E, d, t + 0.05 + Math.random() * 1.4, { f: 1500 + Math.random() * 800, q: 1.2, a: 0.001, d: 0.04, v: 0.09 });
      var c = E.ctx, f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 1.5; f.connect(d);
      for (var j = 0; j < 5; j++) {
        var b = 300 + Math.random() * 160;
        tn(E, f, t + Math.random() * 0.1, { w: 'sawtooth', f: b, f1: b * 1.12, ft: 0.4, a: 0.15, h: 0.35, d: 0.8, v: 0.02 });
      }
    },
    ooh: function (E, d, t) {
      var c = E.ctx, bus = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
      f1.type = 'bandpass'; f1.frequency.value = 380; f1.Q.value = 3;
      f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 4;
      var g2 = c.createGain(); g2.gain.value = 0.4;
      bus.connect(f1); bus.connect(f2); f1.connect(d); f2.connect(g2); g2.connect(d);
      bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(1, t + 0.25);
      bus.gain.setValueAtTime(1, t + 0.6); bus.gain.linearRampToValueAtTime(0, t + 1.3);
      for (var i = 0; i < 6; i++) {
        var b = 170 + Math.random() * 90, o = c.createOscillator(), T = t + Math.random() * 0.06;
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(b, T); o.frequency.linearRampToValueAtTime(b * 1.25, T + 0.35);
        o.frequency.linearRampToValueAtTime(b * 0.88, t + 1.3);
        var g = c.createGain(); g.gain.value = 0.09;
        o.connect(g); g.connect(bus); o.start(T); o.stop(t + 1.35);
      }
      nz(E, d, t, { f: 420, q: 1.5, a: 0.25, h: 0.3, d: 0.7, v: 0.06 });
    },
    command: function (E, d, t, p) {
      nz(E, d, t, { f: 1200, q: 1, a: 0.001, d: 0.06, v: 0.35 });
      tn(E, d, t, { w: 'sine', f: 160, f1: 60, a: 0.002, d: 0.12, v: 0.5 });
      tn(E, d, t, { w: 0.25, f: M(69) * p, f1: M(70) * p, ft: 0.08, a: 0.003, h: 0.06, d: 0.15, v: 0.12 });
      tn(E, d, t, { w: 0.5, f: M(76) * p, f1: M(77) * p, ft: 0.08, a: 0.003, h: 0.06, d: 0.15, v: 0.09 });
    },
    chance: function (E, d, t, p) {
      nz(E, d, t, { f: 300, f1: 4200, ft: 0.34, q: 1.2, a: 0.3, d: 0.06, v: 0.3 });
      var T = t + 0.36;
      tn(E, d, T, { w: 'sine', f: 110, f1: 35, a: 0.002, d: 0.6, v: 0.9 });
      [64, 70, 76].forEach(function (m) { tn(E, d, T, { w: 0.25, f: M(m) * p, a: 0.003, h: 0.05, d: 0.7, v: 0.09, lp: 3000 }); });
      tn(E, d, T, { w: 'triangle', f: M(40) * p, a: 0.003, h: 0.1, d: 0.6, v: 0.3 });
      nz(E, d, T, { type: 'highpass', f: 3000, a: 0.002, d: 0.9, v: 0.18 });
    },
    just: function (E, d, t, p) {
      tn(E, d, t, { w: 'triangle', f: M(91) * p, a: 0.002, d: 0.5, v: 0.22 });
      tn(E, d, t + 0.03, { w: 'sine', f: M(103) * p, a: 0.002, d: 0.35, v: 0.08 });
      tn(E, d, t + 0.06, { w: 0.125, f: M(96) * p, a: 0.002, d: 0.25, v: 0.05 });
      tn(E, d, t + 0.09, { w: 'sine', f: M(108) * p, a: 0.002, d: 0.25, v: 0.05 });
      nz(E, d, t, { type: 'highpass', f: 8000, a: 0.002, d: 0.15, v: 0.05 });
    },
    miss_timing: function (E, d, t, p) {
      tn(E, d, t, { w: 0.5, f: 110 * p, a: 0.004, h: 0.15, d: 0.08, v: 0.13, lp: 900 });
      tn(E, d, t, { w: 0.5, f: 117 * p, a: 0.004, h: 0.15, d: 0.08, v: 0.11, lp: 900 });
    },
    levelup: function (E, d, t, p) {
      [72, 76, 79, 84, 88, 91].forEach(function (m, i) { tn(E, d, t + i * 0.07, { w: 0.25, f: M(m) * p, a: 0.003, h: 0.03, d: 0.08, v: 0.11 }); });
      var T = t + 0.45;
      [84, 88, 91].forEach(function (m, i) {
        var o = tn(E, d, T, { w: i ? 0.5 : 0.25, f: M(m) * p, a: 0.004, h: 0.25, d: 0.35, v: 0.075 });
        vibrato(E, o, T, 6, 10, 0.1, T + 0.62);
      });
      tn(E, d, T, { w: 'triangle', f: M(60) * p, a: 0.004, h: 0.25, d: 0.3, v: 0.25 });
    },
    statup: function (E, d, t, p) {
      tn(E, d, t, { w: 'triangle', f: 1047 * p, a: 0.002, d: 0.18, v: 0.3 });
      tn(E, d, t, { w: 'sine', f: 2094 * p, a: 0.002, d: 0.12, v: 0.08 });
    },
    coin: function (E, d, t, p) {
      tn(E, d, t, { w: 0.5, f: M(88) * p, a: 0.002, h: 0.045, d: 0.01, v: 0.11 });
      tn(E, d, t + 0.06, { w: 0.5, f: M(93) * p, a: 0.002, h: 0.08, d: 0.25, v: 0.11 });
    },
    stamp: function (E, d, t, p) {
      tn(E, d, t, { w: 'sine', f: 95 * p, f1: 35 * p, a: 0.002, d: 0.4, v: 1 });
      tn(E, d, t, { w: 0.5, f: 60 * p, f1: 40 * p, a: 0.002, d: 0.12, v: 0.15, lp: 800 });
      nz(E, d, t, { type: 'lowpass', f: 500, a: 0.002, d: 0.18, v: 0.6 });
      nz(E, d, t, { type: 'highpass', f: 2500, a: 0.001, d: 0.02, v: 0.3 });
    },
    swoosh: function (E, d, t) {
      nz(E, d, t, { f: 400, f1: 2800, ft: 0.22, q: 1.4, a: 0.09, d: 0.16, v: 0.55 });
    },
    seagull: function (E, d, t, p) {
      var c = E.ctx, f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 1.5; f.connect(d);
      [0, 0.3 + Math.random() * 0.08].forEach(function (off, i) {
        var T = t + off, o = c.createOscillator(), g = c.createGain(), b = (1150 + Math.random() * 120) * p * (i ? 0.95 : 1);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(b, T); o.frequency.exponentialRampToValueAtTime(b * 1.5, T + 0.08);
        o.frequency.exponentialRampToValueAtTime(b * 1.12, T + 0.26);
        g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.14, T + 0.03);
        g.gain.setValueAtTime(0.14, T + 0.12); g.gain.linearRampToValueAtTime(0, T + 0.28);
        o.connect(g); g.connect(f); o.start(T); o.stop(T + 0.3);
        vibrato(E, o, T, 18, 40, 0, T + 0.3);
      });
    },
    wave: function (E, d, t) {
      var c = E.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = E.noise; s.loop = true;
      f.type = 'lowpass'; f.Q.value = 0;
      f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(1400, t + 0.9); f.frequency.exponentialRampToValueAtTime(450, t + 2.6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.9); g.gain.linearRampToValueAtTime(0, t + 2.6);
      s.connect(f); f.connect(g); g.connect(d); s.start(t, Math.random()); s.stop(t + 2.65);
      nz(E, d, t + 0.5, { type: 'highpass', f: 3000, a: 0.5, d: 1.2, v: 0.035 });
    }
  };
  function whistle(E, d, t, dur, p) {
    var c = E.ctx, o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = 'sine'; o.frequency.value = 2750 * p;
    l.type = 'triangle'; l.frequency.value = 28; lg.gain.value = 170 * p;
    l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.012);
    g.gain.setValueAtTime(0.2, t + dur - 0.04); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(d); o.start(t); l.start(t); o.stop(t + dur + 0.02); l.stop(t + dur + 0.02);
    nz(E, d, t, { f: 2750 * p, q: 2, a: 0.01, h: dur - 0.05, d: 0.04, v: 0.05 });
  }

  /* ------------------------------------------------------------------ */
  /* BGM player instance                                                 */
  /* ------------------------------------------------------------------ */
  function Inst(E, song, t0) {
    var c = E.ctx;
    this.E = E; this.song = song; this.name = song.name; this.ins = song.ins;
    this.step = 0; this.t = t0; this.endAt = 0;
    this.dry = c.createGain(); this.wet = c.createGain();
    this.dry.connect(E.bgmIn); this.wet.connect(E.delayIn);
    this.lead = c.createGain(); this.lead.connect(this.dry); this.lead.connect(this.wet);
    this.harm = c.createGain(); var hp = panner(c, 0.28); this.harm.connect(hp); hp.connect(this.dry);
    var hs = c.createGain(); hs.gain.value = 0.5; hp.connect(hs); hs.connect(this.wet);
    this.bass = c.createGain(); this.bass.connect(this.dry);
    this.drum = c.createGain(); this.drum.gain.value = song.ins.drums.v; this.drum.connect(this.dry);
    this.hatF = c.createBiquadFilter(); this.hatF.type = 'highpass'; this.hatF.frequency.value = 7500;
    var dp = panner(c, -0.22); this.hatF.connect(dp); dp.connect(this.drum);
    this.snF = c.createBiquadFilter(); this.snF.type = 'bandpass'; this.snF.frequency.value = 1900; this.snF.Q.value = 0.8; this.snF.connect(this.drum);
    this.crF = c.createBiquadFilter(); this.crF.type = 'highpass'; this.crF.frequency.value = 4500; this.crF.connect(this.drum);
    this.lfo = c.createOscillator(); this.lfo.frequency.value = 5.4; this.lfo.start(t0);
    this.nodes = [this.dry, this.wet];
  }
  Inst.prototype.fade = function (from, to, t, sec) {
    [this.dry.gain, this.wet.gain].forEach(function (g) {
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
      if (from != null) g.setValueAtTime(from, t);
      g.linearRampToValueAtTime(to, t + sec);
    });
  };
  Inst.prototype.dispose = function () {
    try { this.lfo.stop(); } catch (e) { /* already stopped */ }
    this.dry.disconnect(); this.wet.disconnect();
  };
  Inst.prototype.pump = function (until) {
    var s = this.song, E = this.E;
    while (this.t < until) {
      var sd = s.stepSec / E.rate, evs = s.steps[this.step];
      if (evs) {
        var tt = this.t + (s.swing && this.step % 4 === 2 ? s.swing * sd : 0);
        for (var i = 0; i < evs.length; i++) this.ev(evs[i], tt, sd);
      }
      this.t += sd;
      if (++this.step >= s.len) this.step = s.loopStart;
    }
  };
  Inst.prototype.voice = function (dest, w, m, t, dur, v, cf, vib) {
    var c = this.E.ctx, o = c.createOscillator(), g = c.createGain();
    setWave(this.E, o, w);
    o.frequency.setValueAtTime(mtof(m) * this.E.pitch, t);
    dur = Math.max(dur, cf.a + 0.02);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + cf.a);
    g.gain.setTargetAtTime(v * cf.sus, t + cf.a, 0.09);
    g.gain.setTargetAtTime(0, t + dur, cf.r / 5);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + cf.r * 1.3);
    if (vib && dur > 0.3) {
      var vg = c.createGain(), lfo = this.lfo;
      vg.gain.setValueAtTime(0, t); vg.gain.setValueAtTime(0, t + 0.16); vg.gain.linearRampToValueAtTime(vib, t + 0.4);
      lfo.connect(vg); vg.connect(o.detune);
      o.onended = function () { try { lfo.disconnect(vg); } catch (e) { /* ignore */ } };
    }
  };
  Inst.prototype.noiseHit = function (dest, t, v, d) {
    var c = this.E.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.E.noise;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0005, t + d);
    s.connect(g); g.connect(dest); s.start(t, Math.random() * 0.6); s.stop(t + d + 0.01);
  };
  Inst.prototype.ev = function (e, t, sd) {
    var I = this.ins, c = this.E.ctx, v;
    switch (e.c) {
      case 'lead': this.voice(this.lead, e.w || I.lead.w, e.m, t, e.l * sd * I.lead.gate, I.lead.v, I.lead, I.lead.vib); break;
      case 'harm': this.voice(this.harm, I.harm.w, e.m, t, e.l * sd * I.harm.gate, I.harm.v * (e.g || 1), I.harm, 0); break;
      case 'bass': this.voice(this.bass, 'triangle', e.m, t, e.l * sd * I.bass.gate, I.bass.v, I.bass, 0); break;
      case 'k':
        v = DRUM_VOL.k * e.v;
        var o = c.createOscillator(), g = c.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22);
        o.connect(g); g.connect(this.drum); o.start(t); o.stop(t + 0.24);
        break;
      case 's':
        v = DRUM_VOL.s * e.v;
        this.noiseHit(this.snF, t, v, 0.15);
        var so = c.createOscillator(), sg = c.createGain();
        so.type = 'triangle'; so.frequency.setValueAtTime(200, t); so.frequency.exponentialRampToValueAtTime(140, t + 0.07);
        sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(v * 0.8, t + 0.002); sg.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
        so.connect(sg); sg.connect(this.drum); so.start(t); so.stop(t + 0.1);
        break;
      case 'r': this.noiseHit(this.snF, t, DRUM_VOL.r * e.v, 0.035); break;
      case 'h': this.noiseHit(this.hatF, t, DRUM_VOL.h * e.v, 0.04); break;
      case 'o': this.noiseHit(this.hatF, t, DRUM_VOL.o * e.v, 0.2); break;
      case 'c': this.noiseHit(this.crF, t, DRUM_VOL.c * e.v, 1.1); break;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Crowd ambience                                                      */
  /* ------------------------------------------------------------------ */
  function crowdNodes(E) {
    if (E.crowdN) return E.crowdN;
    var c = E.ctx, s = c.createBufferSource(), bp = c.createBiquadFilter(), lp = c.createBiquadFilter();
    var wob = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), lvl = c.createGain(), out = c.createGain();
    s.buffer = E.noise; s.loop = true;
    bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.5;
    lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0;
    lfo.frequency.value = 0.17; lg.gain.value = 0.25; lfo.connect(lg); lg.connect(wob.gain);
    lvl.gain.value = 0;
    s.connect(bp); bp.connect(lp); lp.connect(wob); wob.connect(lvl); lvl.connect(out); out.connect(E.master);
    s.start(); lfo.start();
    E.crowdN = { lvl: lvl, out: out, level: 0, next: 0 };
    return E.crowdN;
  }
  function murmur(E, t, level) {
    nz(E, E.crowdN.out, t, { f: 380 + Math.random() * 650, q: 2 + Math.random() * 2, a: 0.35 + Math.random() * 0.3, h: 0.2, d: 0.8 + Math.random() * 0.6, v: 0.05 + level * 0.1 });
  }
  function crowdGain(level) { return level * 0.32; }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */
  var E = null, ctx = null, cur = null, fading = [], timer = null, lastWall = 0, ahead = 0.1;
  var rateTarget = 1, rateCur = 1, pendingBgm = null, pendingCrowd = 0, volume = 0.6, lastBlip = 0;

  function now() { return ctx.currentTime; }

  function tick() {
    if (!E) return;
    var wall = (window.performance && performance.now) ? performance.now() : Date.now();
    var gap = lastWall ? (wall - lastWall) / 1000 : 0.025;
    lastWall = wall;
    // adaptive lookahead: survives throttled background timers
    ahead = Math.max(0.1, Math.min(1.5, Math.max(gap * 1.5 + 0.03, ahead * 0.95)));
    var dt = Math.min(0.2, gap);
    if (rateCur !== rateTarget) {
      rateCur += (rateTarget - rateCur) * (1 - Math.exp(-dt / 0.15));
      if (Math.abs(rateCur - rateTarget) < 0.002) rateCur = rateTarget;
      E.rate = rateCur; E.pitch = Math.pow(rateCur, 0.3);
    }
    var n = now();
    if (cur) {
      if (cur.t < n - 0.25) { cur.t = n + 0.03; }
      cur.pump(n + ahead);
    }
    for (var i = fading.length - 1; i >= 0; i--) {
      var f = fading[i];
      if (n > f.endAt) { f.dispose(); fading.splice(i, 1); }
      else { if (f.t < n - 0.25) f.t = n + 0.03; f.pump(Math.min(f.endAt, n + ahead)); }
    }
    var cr = E.crowdN;
    if (cr && cr.level > 0.02 && n >= cr.next) {
      murmur(E, n + 0.05, cr.level);
      cr.next = n + (0.5 + Math.random() * 1.5) / (0.5 + cr.level);
    }
  }
  function ensureTimer() { if (!timer) timer = setInterval(tick, 25); }

  function startBgm(name) {
    var song = compile(name), n = now();
    if (cur) {
      cur.fade(null, 0, n, 0.6); cur.endAt = n + 0.7; fading.push(cur);
    }
    var inst = new Inst(E, song, n + 0.06);
    inst.fade(0, 1, n + 0.02, fading.length ? 0.6 : 0.05);
    E.delay.delayTime.setTargetAtTime(Math.min(1.5, 60 / song.bpm * 0.75), n, 0.05);
    cur = inst;
    ensureTimer();
    tick();
  }

  var Sound = {
    muted: false,
    current: null,
    init: function () {
      if (!AC) return false;
      try {
        if (!ctx) {
          ctx = new AC();
          E = makeEngine(ctx);
          E.master.gain.value = volume;
          E.mute.gain.value = Sound.muted ? 0 : 1;
          ensureTimer();
          if (pendingCrowd > 0) Sound.crowd(pendingCrowd);
        }
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
        if (pendingBgm) { var p = pendingBgm; pendingBgm = null; Sound.current = null; Sound.bgm(p); }
        return true;
      } catch (e) {
        ctx = null; E = null;
        return false;
      }
    },
    play: function (name, opts) {
      if (!E || Sound.muted) return;
      var fn = SFX[name];
      if (!fn) { if (window.console) console.warn('Sound: unknown sfx "' + name + '"'); return; }
      opts = opts || {};
      var t = now() + 0.005;
      if (name === 'blip') { if (t - lastBlip < 0.018) return; lastBlip = t; }
      var vol = opts.vol == null ? 1 : Math.max(0, Math.min(1, +opts.vol || 0));
      if (vol <= 0) return;
      var pitch = opts.pitch > 0 ? Math.max(0.25, Math.min(4, +opts.pitch)) : 1;
      var g = ctx.createGain(); g.gain.value = vol;
      var dest = g;
      if (opts.pan) { var pn = panner(ctx, Math.max(-1, Math.min(1, +opts.pan || 0))); g.connect(pn); pn.connect(E.sfx); }
      else g.connect(E.sfx);
      try { fn(E, dest, t, pitch); } catch (e) { if (window.console) console.warn('Sound: sfx ' + name + ' failed', e); }
    },
    bgm: function (name) {
      if (!SONGS[name]) { if (window.console) console.warn('Sound: unknown bgm "' + name + '"'); return; }
      if (Sound.current === name && (cur || pendingBgm === name)) return;
      Sound.current = name;
      if (!E) { pendingBgm = name; return; }
      startBgm(name);
    },
    stopBgm: function (fadeSec) {
      pendingBgm = null; Sound.current = null;
      if (!E || !cur) return;
      var s = fadeSec == null ? 1 : Math.max(0.02, +fadeSec || 0.02), n = now();
      cur.fade(null, 0, n, s); cur.endAt = n + s + 0.1; fading.push(cur); cur = null;
    },
    setBgmRate: function (r) {
      r = Math.max(0.25, Math.min(2, +r || 1));
      rateTarget = r;
      if (E) {
        E.bgmLP.frequency.setTargetAtTime(r < 1 ? 7000 * Math.pow(r, 1.4) : 7000, now(), 0.15);
        ensureTimer();
      }
    },
    duck: function (amount, sec) {
      if (!E) return;
      var a = Math.max(0, Math.min(1, amount == null ? 0.6 : +amount)), s = Math.max(0.1, sec == null ? 1.5 : +sec);
      var g = E.duck.gain, n = now(), target = Math.max(0.0001, 1 - a);
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(n); else { g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); }
      g.linearRampToValueAtTime(target, n + 0.08);
      g.setValueAtTime(target, n + s);
      g.linearRampToValueAtTime(1, n + s + 0.5);
    },
    crowd: function (level) {
      level = Math.max(0, Math.min(1, +level || 0));
      pendingCrowd = level;
      if (!E) return;
      if (level === 0 && !E.crowdN) return;
      var cr = crowdNodes(E);
      cr.level = level;
      cr.lvl.gain.setTargetAtTime(crowdGain(level), now(), 0.4);
      if (cr.next < now()) cr.next = now() + 0.3;
    },
    setMuted: function (b) {
      Sound.muted = !!b;
      if (E) E.mute.gain.setTargetAtTime(Sound.muted ? 0 : 1, now(), 0.03);
    },
    masterVolume: function (v) {
      if (v != null) {
        volume = Math.max(0, Math.min(1, +v || 0));
        if (E) E.master.gain.setTargetAtTime(volume, now(), 0.03);
      }
      return volume;
    },

    /* ---- debug / QA hooks ---- */
    _sfxNames: Object.keys(SFX),
    _bgmNames: Object.keys(SONGS),
    _songInfo: function (name) {
      var s = compile(name);
      return { name: name, bpm: s.bpm, steps: s.len, loopStart: s.loopStart, loopSeconds: s.loopSeconds, introSeconds: s.introSeconds, key: s.key, events: s.info };
    },
    _state: function () {
      return { ctx: ctx ? ctx.state : 'none', current: Sound.current, rate: rateCur, ahead: ahead, fading: fading.length, crowd: E && E.crowdN ? E.crowdN.level : 0 };
    },
    /* Render an SFX / BGM / 'crowd' offline and return {peak, rms, activeRms, seconds}. */
    _renderOffline: function (name, seconds) {
      if (!OAC) return Promise.reject(new Error('OfflineAudioContext unavailable'));
      var isSong = !!SONGS[name], sr = 44100;
      if (!isSong && !SFX[name] && name !== 'crowd') return Promise.reject(new Error('unknown ' + name));
      if (!seconds) seconds = isSong ? Math.min(70, compile(name).introSeconds + compile(name).loopSeconds) : name === 'crowd' ? 6 : 3;
      var oc = new OAC(2, Math.ceil(sr * seconds), sr), X = makeEngine(oc);
      if (isSong) {
        var inst = new Inst(X, compile(name), 0.02);
        inst.fade(1, 1, 0, 0.01);
        inst.pump(seconds);
      } else if (name === 'crowd') {
        var cr = crowdNodes(X); cr.lvl.gain.value = crowdGain(0.8);
        for (var t = 0.1; t < seconds - 1; t += (0.5 + Math.random() * 1.5) / 1.3) murmur(X, t, 0.8);
      } else {
        SFX[name](X, X.sfx, 0.02, 1);
      }
      return oc.startRendering().then(function (buf) {
        var peak = 0, sum = 0, n = 0, first = -1, last = -1, L = buf.length;
        for (var c = 0; c < buf.numberOfChannels; c++) {
          var d = buf.getChannelData(c);
          for (var i = 0; i < L; i++) {
            var a = Math.abs(d[i]);
            if (a > peak) peak = a;
            if (a > 0.002) { if (first < 0 || i < first) first = i; if (i > last) last = i; }
          }
        }
        var active = 0, an = 0;
        for (c = 0; c < buf.numberOfChannels; c++) {
          d = buf.getChannelData(c);
          for (i = 0; i < L; i++) { sum += d[i] * d[i]; n++; if (i >= first && i <= last) { active += d[i] * d[i]; an++; } }
        }
        return {
          name: name, seconds: seconds, peak: peak, rms: Math.sqrt(sum / n), activeRms: an ? Math.sqrt(active / an) : 0,
          activeSec: first >= 0 ? (last - first) / sr : 0
        };
      });
    }
  };

  // Resume a suspended context on the next user gesture (only after init() has been requested).
  if (AC && window.addEventListener) {
    var unlock = function () { if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { passive: true }); });
  }

  window.Sound = Sound;
})();
