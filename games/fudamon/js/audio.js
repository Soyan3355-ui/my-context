/* 封札モンスターズ — audio.js
 * All music and sound effects are synthesized in real time with the Web Audio API.
 * No audio files, no libraries. All melodies are original compositions.
 *
 * Public interface (window.AUDIO):
 *   unlock()                 create/resume the AudioContext (call from a user gesture)
 *   music(name)              crossfade to looping track; same name = no-op; unknown = stop
 *   stopMusic(fade = 0.5)
 *   sfx(name)                one-shot effect
 *   setMuted(bool), muted
 *   setVolume(musicVol, sfxVol)
 */
(function () {
  'use strict';

  var AC = window.AudioContext || window.webkitAudioContext;
  var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  /* ------------------------------------------------------------------ *
   * Note / chord helpers
   * ------------------------------------------------------------------ */
  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteMidi(s) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!m) throw new Error('bad note ' + s);
    return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  }
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  var QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
    sus4: [0, 5, 7], sus2: [0, 2, 7], dim: [0, 3, 6], '5': [0, 7, 12], add9: [0, 4, 7, 14], '6': [0, 4, 7, 9]
  };

  function parseChord(sym) {
    var m = /^([A-G])([#b]?)(.*)$/.exec(sym);
    if (!m || !QUAL.hasOwnProperty(m[3])) throw new Error('bad chord ' + sym);
    var pc = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
    var iv = QUAL[m[3]];
    var base = 48 + pc; if (base < 53) base += 12;           // voicing root F3..E4
    var bass = 36 + pc; if (bass < 40) bass += 12;           // bass root E2..Eb3
    var tones = iv.map(function (i) { return base + i; });
    var fifth = iv.indexOf(7) >= 0 ? 7 : (iv.indexOf(6) >= 0 ? 6 : 7);
    var third = iv[1] < 7 ? iv[1] : 4;
    var sev = iv.indexOf(10) >= 0 ? 10 : (iv.indexOf(11) >= 0 ? 11 : 12);
    return { sym: sym, pc: pc, iv: iv, tones: tones, bass: bass, fifth: fifth, third: third, sev: sev };
  }

  // "D | G | Em A | ..." -> per-step chord objects (16 steps per bar)
  function parseChords(str) {
    var bars = str.split('|').map(function (b) { return b.trim(); }).filter(Boolean);
    var out = [];
    bars.forEach(function (bar) {
      var syms = bar.split(/\s+/);
      var seg = 16 / syms.length;
      syms.forEach(function (sym, k) {
        var ch = parseChord(sym);
        var info = { ch: ch, seg0: out.length, segLen: seg };
        for (var i = 0; i < seg; i++) out.push(info);
        void k;
      });
    });
    return out;
  }

  // "A4.4 D5.2 r.2 | ..." -> [{s, m, d}], len  (durations in 16th steps; omitted = previous)
  function parseMel(str) {
    var ev = [], s = 0, last = 4;
    str.split(/[\s|]+/).filter(Boolean).forEach(function (tok) {
      var p = tok.split('.');
      var d = p.length > 1 ? parseFloat(p[1]) : last;
      last = d;
      if (p[0] !== 'r') ev.push({ s: s, m: noteMidi(p[0]), d: d });
      s += d;
    });
    return { ev: ev, len: s };
  }

  /* ------------------------------------------------------------------ *
   * Accompaniment generators (return per-step note lists)
   * ------------------------------------------------------------------ */
  // bass: (stepInBar, chordInfo, stepInSegment) -> [interval, durSteps, vel] | null
  var BASS = {
    bounce: function (s, ci) {            // relaxed root / fifth quarters
      if (s % 4) return null;
      var q = s >> 2;
      return [q % 2 ? ci.ch.fifth : 0, 3, q === 0 ? 1 : 0.8];
    },
    walk8: function (s, ci) {             // adventurous 8ths
      if (s % 2) return null;
      var pat = [0, 0, 12, 0, ci.ch.fifth, 0, 12, ci.ch.fifth];
      return [pat[s >> 1], 1.6, s % 4 ? 0.75 : 1];
    },
    octave: function (s) {                // bouncy octave walk
      if (s % 2) return null;
      return [(s >> 1) % 2 ? 12 : 0, 1.2, (s >> 1) % 2 ? 0.8 : 1];
    },
    drive: function (s, ci) {             // urgent 16th arpeggio
      var pat = [0, 12, ci.ch.fifth, 12];
      return [pat[s % 4], 0.9, s % 4 ? 0.75 : 1];
    },
    pound: function (s, ci) {             // boss: pounding 8ths with 7th
      if (s % 2) return null;
      var pat = [0, 0, 12, 0, 0, 12, ci.ch.fifth, ci.ch.sev];   // 7th only when the chord has one
      return [pat[s >> 1], 1.5, s % 4 ? 0.8 : 1];
    },
    fanfare: function (s, ci) {
      if (s % 2) return null;
      var pat = [0, ci.ch.fifth, 12, ci.ch.fifth];
      return [pat[(s >> 1) % 4], 1.5, 1];
    },
    riff: function (s, ci) {              // volcano: stomping riff built from chord tones
      var R = { 0: [0, 2, 1], 2: [0, 1, 0.7], 3: [12, 1, 0.8], 4: [ci.ch.fifth, 2, 0.9], 6: [0, 2, 0.8],
                8: [12, 1, 1], 9: [0, 1, 0.7], 10: [ci.ch.fifth, 2, 0.85], 12: [ci.ch.third, 2, 0.85], 14: [ci.ch.fifth, 2, 0.8] };
      return R[s] || null;
    },
    gallop: function (s) {                // legend: 8th + two 16ths per beat
      var q = s % 4;
      if (q === 0) return [0, 1.5, 1];
      if (q === 2) return [0, 0.9, 0.7];
      if (q === 3) return [12, 0.9, 0.75];
      return null;
    },
    sustain: function (s, ci, k) {        // long drone per chord
      return k === 0 ? [0, ci.segLen, 1] : null;
    },
    half: function (s, ci, k) {           // root, then fifth at half-bar (if chord spans it)
      if (k === 0 && ci.segLen < 16) return [0, ci.segLen, 1];
      if (k === 0) return [0, 8, 1];
      if (k === 8) return [ci.ch.fifth - 12, 8, 0.8];
      return null;
    }
  };

  // harmony: (stepInBar, chordInfo, stepInSegment) -> [[midi, durSteps, vel], ...] | null
  function ext(ch) { return ch.tones.concat([ch.tones[0] + 12]); }
  var HARM = {
    arp16: function (s, ci, k) {
      var e = ext(ci.ch);
      return [[e[k % e.length], 1, s % 4 ? 0.7 : 1]];
    },
    arp8: function (s, ci, k) {
      if (s % 2) return null;
      var e = ext(ci.ch), ud = [];
      for (var i = 0; i < e.length; i++) ud.push(i);
      for (i = e.length - 2; i > 0; i--) ud.push(i);
      return [[e[ud[(k >> 1) % ud.length]], 2, s % 4 ? 0.75 : 1]];
    },
    ripple: function (s, ci, k) {         // valley: 16th up-and-down over two octaves, like running water
      var t = ci.ch.tones, e = [t[0], t[1], t[2], t[0] + 12, t[1] + 12, t[2] + 12];
      var seq = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
      return [[e[seq[k % seq.length]], 1, s % 4 ? 0.65 : 0.9]];
    },
    stab: function (s, ci) {              // offbeat chord chops
      if (s % 4 !== 2) return null;
      return ci.ch.tones.slice(0, 3).map(function (m) { return [m, 1, 0.8]; });
    },
    backbeat: function (s, ci) {
      if (s !== 4 && s !== 12) return null;
      return ci.ch.tones.slice(0, 3).map(function (m) { return [m, 2, 0.8]; });
    },
    pad: function (s, ci, k) {
      if (k !== 0) return null;
      return ci.ch.tones.map(function (m) { return [m, ci.segLen, 0.8]; });
    },
    broken: function (s, ci, k) {         // gentle piano-like broken chord
      if (s % 2) return null;
      var ch = ci.ch, O = ch.tones[0], F = O + ch.fifth, Th = O + ch.third;
      var top = ch.sev !== 12 ? O + 12 + ch.sev - 12 : O + 12;   // colour tone (7th) when present
      var seq = [O, F, O + 12, Th + 12, top, F, Th, F];
      return [[seq[(k >> 1) % seq.length], 3, (k >> 1) % 4 ? 0.7 : 1]];
    }
  };

  /* ------------------------------------------------------------------ *
   * Song data (all original)
   * ------------------------------------------------------------------ */
  var SONGS_DEF = {
    // D major, 132 bpm — hopeful, adventurous main theme (16 bars)
    title: {
      bpm: 132, swing: 0, echo: [0.75, 0.32, 0.22], verb: 0.22, crashEvery: 8,
      chords: 'D | G | Bm | A | D | G | Em A | D | G | A | F#m | Bm | G | A | Bm G | Asus4 A',
      mel:
        'A4.4 D5.2 E5.2 F#5.6 E5.2 | D5.4 B4.2 D5.2 G5.6 F#5.2 | F#5.4 E5.2 D5.2 B4.4 D5.4 | C#5.2 D5.2 E5.4 A4.8 |' +
        'A4.4 D5.2 E5.2 F#5.6 A5.2 | B5.4 A5.2 G5.2 D5.6 G5.2 | F#5.4 E5.2 G5.2 E5.4 C#5.4 | D5.12 r.4 |' +
        'B4.2 D5.2 G5.4 G5.2 A5.2 B5.4 | A5.6 G5.2 E5.4 C#5.4 | C#5.2 E5.2 A5.4 F#5.4 C#5.4 | D5.2 F#5.2 B5.8 A5.4 |' +
        'G5.6 F#5.2 E5.4 D5.4 | E5.6 F#5.2 G5.4 A5.4 | B5.4 A5.2 F#5.2 G5.4 D5.4 | D5.6 C#5.2 E5.8',
      lead: { inst: 'lead' },
      bass: { style: 'walk8' },
      harm: [{ style: 'arp16', inst: 'harm', oct: 12, vol: 0.8 }, { style: 'pad', inst: 'pad' }],
      drums: {
        pats: [['k.......k.k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.']],
        fill: ['k.......k.k.....', '....s.....s.s.ss', 'h.h.h.h.m.m.t.t.'], every: 4
      }
    },

    // F major, 92 bpm, light swing — cozy pentatonic hometown tune (16 bars)
    village: {
      bpm: 92, swing: 0.28, echo: [0.5, 0.25, 0.18], verb: 0.25,
      chords: 'F | Dm | Bb | C | F | Am | Bb C | F | Bb | C | Am | Dm | Bb | C | Gm7 C | F',
      mel:
        'C5.4 A4.2 C5.2 D5.4 C5.4 | A4.4 G4.2 A4.2 F4.8 | G4.4 A4.2 C5.2 D5.4 F5.4 | C5.6 A4.2 G4.8 |' +
        'C5.4 A4.2 C5.2 F5.4 D5.4 | C5.4 D5.2 C5.2 A4.8 | D5.4 F5.4 E5.2 D5.2 C5.4 | A4.6 G4.2 F4.8 |' +
        'D5.4 F5.2 D5.2 C5.4 D5.4 | C5.4 A4.2 G4.2 C5.8 | C5.4 E5.4 A5.4 G5.4 | F5.6 D5.2 A4.8 |' +
        'D5.4 C5.2 D5.2 F5.4 G5.4 | A5.6 G5.2 E5.4 C5.4 | D5.4 F5.2 D5.2 C5.4 E5.2 G5.2 | F5.8 r.8',
      lead: { inst: 'flute' },
      lead2: { inst: 'harm25', oct: 12, vol: 0.35, delay: 0 }, // soft octave sparkle on the melody
      bass: { style: 'bounce' },
      harm: [{ style: 'stab', inst: 'harm', vol: 1.2 }, { style: 'arp8', inst: 'epiano', vol: 0.8 }],
      drums: {
        pats: [['k.......k.......', '....r.......r...', 'x.x.x.x.x.x.x.x.']],
        fill: ['k.......k.....k.', '....r.......r.r.', 'x.x.x.x.x.x.xxxx'], every: 8, vol: 0.8
      }
    },

    // G major, 140 bpm — bright walking tune (24 bars: A B A')
    route: {
      bpm: 140, swing: 0, echo: [0.75, 0.28, 0.18], verb: 0.18, crashEvery: 8,
      chords:
        'G | C | G | D | Em | C | Am D | G |' +
        'C | D | Bm | Em | Am | D | C | D7 |' +
        'G | C | G | D | Em | C | D | G',
      mel: null, // filled below from phrases
      lead: { inst: 'lead' },
      bass: { style: 'octave' },
      harm: [{ style: 'stab', inst: 'harm25', vol: 0.9 }, { style: 'arp8', inst: 'harm', oct: 12, vol: 0.7 }],
      drums: {
        pats: [['k.....k.k.....k.', '....s.......s...', 'h.o.h.o.h.o.h.o.']],
        fill: ['k.....k.k.......', '....s.......s.ss', 'h.o.h.o.h.o.m.t.'], every: 8
      }
    },

    // D "in" scale (D Eb G A Bb), 76 bpm — mysterious shrine, koto plucks (12 bars)
    shrine: {
      bpm: 76, swing: 0, echo: [0.75, 0.45, 0.35], verb: 0.55,
      chords: 'D5 | D5 | Ebmaj7 | D5 | Gm | Gm | Eb | D5 | Gm | Ebmaj7 | Gm | D5',
      mel:
        'r.4 A4.2 Bb4.2 A4.4 r.4 | D5.3 Eb5.1 D5.4 A4.8 | G4.4 Bb4.4 Eb5.6 D5.2 | D5.8 r.8 |' +
        'r.2 G4.2 A4.2 Bb4.2 D5.4 Bb4.4 | A4.4 G4.4 D4.8 | Eb4.4 G4.2 Bb4.2 Eb5.4 G5.4 | A5.6 G5.2 D5.8 |' +
        'G5.4 r.2 D5.2 Eb5.4 D5.4 | Bb4.6 A4.2 G4.8 | D5.2 Eb5.2 D5.2 Bb4.2 A4.4 G4.4 | Eb4.2 D4.14',
      mel2:
        'r.16 | r.8 D6.8 | r.16 | r.4 A6.4 G6.8 | r.16 | r.12 Bb5.4 | r.16 | r.8 Eb6.4 D6.4 |' +
        'r.16 | r.8 G6.8 | r.16 | r.4 A6.4 D6.8',
      lead: { inst: 'koto' },
      lead2: { inst: 'bell', vol: 0.8 },
      bass: { style: 'sustain', inst: 'drone' },
      harm: [{ style: 'pad', inst: 'pad', vol: 1.1 }],
      drums: {
        pats: [['T.........t.....', '................'], ['T...............', '......r.r.......']],
        every: 0, vol: 0.9
      }
    },

    // E minor, 168 bpm — driving wild battle (1-bar intro + 24-bar loop)
    battle: {
      bpm: 168, swing: 0, echo: [0.75, 0.2, 0.12], verb: 0.12, crashEvery: 8,
      intro: {
        chords: 'Em',
        mel: 'E5.2 r.2 E5.2 r.2 D#5.2 D5.2 C#5.2 C5.2',
        drums: ['k...k...k...k...', '........s.s.ssss', 'c...............']
      },
      chords:
        'Em | Em | C | D | Em | Em | C | B7 |' +
        'Em | Em | C | D | Em | Em | C | B7 |' +
        'Am | Am | Em | Em | C | D | B | B7',
      mel: null,
      lead: { inst: 'lead' },
      bass: { style: 'drive' },
      harm: [{ style: 'arp16', inst: 'harm', oct: 12, vol: 0.75 }],
      drums: {
        pats: [['k.....k.k.....k.', '....s.......s...', 'h.hhh.hhh.hhh.hh']],
        fill: ['k.....k.k.......', '....s.......s.ss', 'h.hhh.hhm.mmt.tt'], every: 8
      }
    },

    // C minor, 160 bpm — dramatic guardian battle (2-bar intro + 24-bar loop)
    boss: {
      bpm: 160, swing: 0, echo: [0.5, 0.22, 0.12], verb: 0.15, crashEvery: 8,
      intro: {
        chords: 'Cm | G',
        mel: 'C6.2 r.2 C6.2 r.2 B5.2 r.2 Bb5.2 A5.2 | Ab5.4 G5.4 F#5.4 G5.4',
        drums: ['k.......k.......', 'c...............', 't.t.t.t.m.m.m.m.'],
        harm: [{ style: 'backbeat', inst: 'harm25', vol: 1 }]
      },
      chords:
        'Cm | Cm | Ab | Bb | Cm | Cm | Ab | G |' +
        'Fm | G | Cm | Ab | Fm | Db | G | G7 |' +
        'Ab | Bb | Gm | Cm | Ab | Bb | G | G7',
      mel:
        'C5.6 G4.2 C5.2 D5.2 Eb5.4 | D5.2 Eb5.2 F5.2 G5.6 Eb5.4 | Ab5.6 G5.2 F5.4 Eb5.4 | D5.4 F5.4 Bb5.8 |' +
        'C6.6 G5.2 Eb5.4 C5.4 | D5.2 Eb5.2 G5.2 C6.6 Bb5.4 | Ab5.6 G5.2 Ab5.4 C6.4 | B5.8 G5.8 |' +
        'F5.4 Ab5.4 C6.6 Bb5.2 | B5.4 D6.4 G5.8 | Eb6.6 D6.2 C6.4 G5.4 | Ab5.6 G5.2 F5.4 Eb5.4 |' +
        'F5.2 G5.2 Ab5.4 C6.8 | Db6.6 C6.2 Ab5.4 F5.4 | D6.4 B5.4 G5.4 F5.4 | D5.4 F5.4 G5.4 B5.4 |' +
        'C6.12 Bb5.2 Ab5.2 | Bb5.12 Ab5.2 G5.2 | G5.8 Bb5.4 D6.4 | C6.12 r.4 |' +
        'Eb6.8 C6.4 Ab5.4 | D6.8 Bb5.4 F5.4 | G5.4 B5.4 D6.4 B5.4 | G5.2 Ab5.2 B5.2 C6.2 D6.4 B5.4',
      lead: { inst: 'lead50' },
      lead2: { inst: 'harm25', oct: -12, vol: 0.7 },   // octave-down doubling for weight
      bass: { style: 'pound' },
      harm: [{ style: 'arp16', inst: 'harm', oct: 12, vol: 0.7 }, { style: 'pad', inst: 'pad', vol: 0.8 }],
      drums: {
        pats: [['k..k..k.k..k..k.', '....s.......s...', 'h.h.h.h.h.h.h.h.']],
        fill: ['k..k..k.k.......', '....s...s.s.s.ss', 'h.h.h.h.mmmmtttt'], every: 8
      }
    },

    // C major, 132 bpm — fanfare (3 bars, once) then happy 16-bar tail
    victory: {
      bpm: 132, swing: 0, echo: [0.75, 0.28, 0.2], verb: 0.2, crashEvery: 0,
      intro: {
        chords: 'C | F G | C',
        mel: 'G4.2 C5.2 E5.2 G5.2 C6.8 | A5.3 A5.1 A5.2 C6.2 B5.3 B5.1 B5.2 D6.2 | C6.12 r.4',
        drums: ['k...k...k...k...', '..s...s...s.ssss', 'c...............'],
        bass: 'fanfare',
        harm: [{ style: 'backbeat', inst: 'harm25', vol: 1 }]
      },
      chords: 'C | Am | F | G | C | Am | Dm G | C | F | G | Em | Am | Dm | G | F G | C',
      mel:
        'E5.3 D5.1 C5.2 E5.2 G5.4 E5.4 | A5.4 G5.2 E5.2 C5.8 | F5.3 E5.1 F5.2 A5.2 C6.4 A5.4 | G5.6 F5.2 D5.8 |' +
        'E5.3 D5.1 C5.2 E5.2 G5.4 C6.4 | B5.2 A5.2 G5.2 E5.2 A5.8 | F5.4 A5.4 G5.2 F5.2 D5.4 | C5.6 G4.2 C5.4 r.4 |' +
        'A5.4 C6.4 A5.4 F5.4 | G5.3 A5.1 B5.4 D6.4 B5.4 | B5.6 G5.2 E5.8 | C6.6 B5.2 A5.8 |' +
        'F5.3 G5.1 A5.4 D6.4 A5.4 | B5.6 A5.2 G5.8 | A5.4 C6.4 B5.4 D6.4 | C6.8 G5.4 E5.4',
      lead: { inst: 'lead' },
      bass: { style: 'walk8' },
      harm: [{ style: 'stab', inst: 'harm25', vol: 0.8 }],
      drums: {
        pats: [['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.']],
        fill: ['k.......k.......', '....s.......s.ss', 'h.h.h.h.h.h.h.h.'], every: 8
      }
    },

    // Eb major, 72 bpm — gentle, emotional "to be continued" (12 bars)
    ending: {
      bpm: 72, swing: 0, echo: [1, 0.35, 0.28], verb: 0.45,
      chords: 'Eb | Bb | Cm7 | Abmaj7 | Eb | Abmaj7 | Fm7 Bb | Eb | Abmaj7 | Bb | Gm Cm | Ab Bb',
      mel:
        'G4.4 Bb4.4 Eb5.6 D5.2 | D5.8 C5.4 Bb4.4 | C5.4 Eb5.4 G5.6 F5.2 | Eb5.12 C5.4 |' +
        'G5.4 F5.2 Eb5.2 Bb4.8 | C5.4 Eb5.4 Ab5.6 G5.2 | F5.6 Eb5.2 D5.6 Bb4.2 | Eb5.16 |' +
        'Eb5.4 Ab5.4 C6.6 Bb5.2 | Bb5.8 F5.4 D5.4 | Bb5.6 G5.2 C6.6 Bb5.2 | Ab5.4 G5.4 F5.4 D5.4',
      lead: { inst: 'soft' },
      bass: { style: 'half' },
      harm: [{ style: 'broken', inst: 'epiano', vol: 1 }, { style: 'pad', inst: 'pad', vol: 0.9 }],
      drums: null
    },

    /* ---------------- Chapter 2 ---------------- */

    // 霧の渓谷 — A Dorian (bright F#), 112 bpm — airy, adventurous; rippling water arps, misty flute (16 bars)
    valley: {
      bpm: 112, swing: 0, echo: [0.75, 0.38, 0.25], verb: 0.4, crashEvery: 0,
      chords: 'Am | D | Am | G | Fmaj7 | G | Am Em | D | Fmaj7 | G | Am | Em | Fmaj7 | G | Dsus2 D | Esus4 E',
      mel:
        'E5.6 A5.2 B5.4 C6.4 | B5.6 A5.2 F#5.8 | E5.4 A5.2 G5.2 E5.4 C5.4 | D5.8 B4.4 D5.4 |' +
        'C5.6 E5.2 A5.4 G5.4 | B5.6 A5.2 G5.4 D5.4 | C6.4 B5.4 G5.4 B5.4 | A5.12 F#5.4 |' +
        'A5.4 C6.4 E6.8 | D6.6 B5.2 G5.8 | A5.4 C6.2 B5.2 A5.4 E5.4 | G5.6 F#5.2 E5.8 |' +
        'F5.4 A5.4 C6.4 E6.4 | D6.6 C6.2 B5.4 G5.4 | E5.4 A5.4 F#5.4 A5.4 | A5.6 G#5.2 B5.8',
      lead: { inst: 'flute' },
      bass: { style: 'bounce' },
      harm: [{ style: 'ripple', inst: 'drop', vol: 1 }, { style: 'pad', inst: 'pad', vol: 0.8 }],
      drums: {
        pats: [['k.....k.........', '............r...', 'x.x.x.x.x.x.x.x.']],
        fill: ['k.....k.....k.k.', '....r.......r.r.', 'x.x.x.x.x.x.xxxx'], every: 8, vol: 0.75
      }
    },

    // ほむら岳 — D minor, 126 bpm — hot, driving exploration; taiko + bass riff, koto colour (16 bars)
    volcano: {
      bpm: 126, swing: 0, echo: [0.5, 0.25, 0.15], verb: 0.25, crashEvery: 8,
      chords: 'Dm | Dm | Bb | C | Dm | Dm | Gm | A7 | Bb | C | Dm | Dm | Gm | Bb | C | A',
      mel:
        'D5.4 A4.2 D5.2 F5.4 E5.2 D5.2 | A5.6 G5.2 F5.4 E5.4 | F5.4 D5.2 F5.2 Bb5.6 A5.2 | G5.6 E5.2 C5.8 |' +
        'D5.4 A4.2 D5.2 F5.4 A5.4 | D6.6 C6.2 A5.4 F5.4 | G5.4 Bb5.4 D6.4 C6.2 Bb5.2 | A5.6 G5.2 E5.4 C#5.4 |' +
        'D6.8 F5.4 Bb5.4 | C6.6 G5.2 E5.8 | F5.2 G5.2 A5.4 D6.6 C6.2 | A5.12 r.4 |' +
        'Bb5.6 A5.2 G5.4 D5.4 | F5.6 G5.2 Bb5.4 D6.4 | E6.6 D6.2 C6.4 G5.4 | A5.8 E5.4 C#5.4',
      lead: { inst: 'lead' },
      lead2: { inst: 'koto', oct: -12, vol: 0.7 },
      bass: { style: 'riff' },
      harm: [{ style: 'backbeat', inst: 'harm25', vol: 1 }, { style: 'pad', inst: 'pad', vol: 0.8 }],
      drums: {
        pats: [['T.....T.T.......', '....s.......s...', 'h.hhh.h.h.hhh.h.']],
        fill: ['T.....T.T.......', '....s.......s...', 'h.h.h.h.m.m.t.tt'], every: 4, vol: 0.75
      }
    },

    // 月影の森 — E minor with a Phrygian F, 84 bpm — hushed night forest; music box, firefly bells, soft pulse (12 bars)
    forest: {
      bpm: 84, swing: 0, echo: [0.75, 0.4, 0.3], verb: 0.6,
      chords: 'Em | Cmaj7 | Em | Fmaj7 | Am | Em | Cmaj7 | Bsus4 B | Gmaj7 | Cmaj7 | Am Fmaj7 | B7',
      mel:
        'B5.4 G5.2 E5.2 F#5.4 G5.4 | E5.6 B5.2 G5.8 | B5.4 E6.4 D6.2 B5.2 G5.4 | A5.6 C6.2 E6.8 |' +
        'E6.4 C6.2 B5.2 A5.8 | G5.4 B5.2 G5.2 E5.8 | G5.4 B5.4 E6.4 D6.4 | E6.6 D#6.2 B5.8 |' +
        'D6.4 B5.2 D6.2 F#6.8 | E6.6 D6.2 C6.4 B5.4 | A5.4 C6.4 E6.4 A5.4 | D#6.4 B5.4 A5.4 F#5.4',
      mel2:
        'r.12 B6.4 | r.16 | r.8 E6.8 | r.16 | r.4 C7.4 r.8 | r.16 | r.12 G6.4 | r.16 |' +
        'r.8 F#6.8 | r.16 | r.4 E6.4 r.8 | r.16',
      lead: { inst: 'mbox' },
      lead2: { inst: 'bell', vol: 0.6 },
      bass: { style: 'half', inst: 'drone' },
      harm: [{ style: 'pad', inst: 'pad', vol: 1.2 }, { style: 'arp8', inst: 'drop', vol: 0.6 }],
      drums: {
        pats: [['k.......k.......', '......x.......x.']], every: 0, vol: 0.45
      }
    },

    // オーロラクジラ / クロガネオロチ — F minor, 150 bpm — epic legendary battle: 4-bar grand intro + 24-bar loop
    legend: {
      bpm: 150, swing: 0, echo: [0.75, 0.25, 0.15], verb: 0.25, crashEvery: 8,
      intro: {
        chords: 'Fm | Db | Eb | C',
        mel: 'C5.8 F5.8 | Ab5.12 Bb5.4 | G5.8 Eb5.4 G5.4 | C6.12 r.4',
        bass: 'sustain',
        harm: [{ style: 'pad', inst: 'pad', vol: 1.4 }, { style: 'arp8', inst: 'harm25', vol: 0.8 }],
        drums: ['T.......T...T.T.', 'c...............', '............m.t.']
      },
      chords:
        'Fm | Fm | Db | Eb | Fm | Fm | Db | C |' +
        'Bbm | Eb | Ab | Db | Bbm | Db | Eb | C |' +
        'Db | Eb | Ab | Fm | Bbm | Gb | C | C',
      mel:
        'F5.4 C5.2 F5.2 G5.2 Ab5.6 | G5.2 F5.2 Eb5.2 F5.2 C5.8 | Db5.4 F5.2 Ab5.2 Db6.8 | C6.4 Bb5.4 G5.4 Eb5.4 |' +
        'F5.4 C5.2 F5.2 Ab5.2 C6.6 | Eb6.4 Db6.2 C6.2 Ab5.8 | Db6.6 C6.2 Bb5.4 Ab5.4 | G5.8 E5.4 C5.4 |' +
        'Db6.6 C6.2 Bb5.8 | Bb5.4 G5.4 Eb6.8 | C6.6 Bb5.2 Ab5.4 Eb5.4 | F5.6 Ab5.2 Db6.8 |' +
        'F6.8 Db6.4 Bb5.4 | Ab5.6 Bb5.2 C6.4 Db6.4 | Eb6.6 Db6.2 Bb5.4 G5.4 | C6.4 E5.4 G5.4 Bb5.4 |' +
        'Db6.12 C6.2 Db6.2 | Eb6.12 Db6.2 Eb6.2 | C6.8 Eb6.4 Ab6.4 | F6.12 r.4 |' +
        'Db6.8 F6.4 Db6.4 | Bb5.6 Db6.2 Gb6.8 | E6.8 C6.4 G5.4 | C6.4 Bb5.2 Ab5.2 G5.4 E5.4',
      lead: { inst: 'epic' },
      lead2: { inst: 'harm25', oct: -12, vol: 0.6 },
      bass: { style: 'gallop' },
      harm: [{ style: 'arp16', inst: 'harm', oct: 12, vol: 0.7 }, { style: 'pad', inst: 'pad', vol: 1.1 }],
      drums: {
        pats: [['k.k.k...k.k.k...', '....s.......s...', 'T.h.h.h.h.h.h.h.']],
        fill: ['k.k.k...k.......', '....s.....s.ssss', 'T.h.h.h.mmmmtttt'], every: 8, vol: 0.8
      }
    }
  };

  (function () {
    var R = {
      A1: 'D5.3 B4.1 D5.2 G5.2 F#5.2 G5.2 A5.4', A2: 'G5.4 E5.2 C5.2 E5.4 G5.4',
      A3: 'D5.3 B4.1 D5.2 G5.2 B5.4 A5.4', A4: 'F#5.6 E5.2 D5.8',
      A5: 'E5.3 G5.1 B5.4 A5.2 G5.2 E5.4', A6: 'E5.2 G5.2 C6.4 B5.2 A5.2 G5.4',
      A7: 'A5.3 G5.1 E5.2 C5.2 D5.2 F#5.2 A5.2 C6.2', A8: 'B5.4 G5.4 D5.4 r.4',
      B: 'E5.6 D5.2 C5.4 E5.4 | F#5.6 E5.2 D5.4 A5.4 | B5.6 A5.2 F#5.4 D5.4 | G5.6 F#5.2 E5.8 |' +
         'C6.6 B5.2 A5.4 E5.4 | F#5.4 A5.4 D6.8 | C6.4 B5.2 A5.2 G5.4 E5.4 | D5.4 F#5.4 A5.4 C6.4',
      E7: 'A5.4 F#5.4 D5.2 E5.2 F#5.4', E8: 'G5.10 r.6'
    };
    var a16 = [R.A1, R.A2, R.A3, R.A4, R.A5, R.A6].join(' | ');
    SONGS_DEF.route.mel = [a16, R.A7, R.A8, R.B, a16, R.E7, R.E8].join(' | ');

    var B = {
      b1: 'B4.2 E5.2 G5.2 B5.6 A5.2 G5.2', b2: 'F#5.4 G5.2 F#5.2 E5.4 B4.4',
      b3: 'C5.2 E5.2 G5.2 C6.6 B5.2 A5.2', b4: 'B5.4 A5.4 F#5.4 D5.4',
      b6: 'G5.4 A5.2 B5.2 D6.4 B5.4', b7: 'C6.6 B5.2 A5.4 G5.4', b8: 'F#5.4 A5.4 D#5.4 B4.4',
      c7: 'C6.4 B5.2 A5.2 G5.4 A5.4', c8: 'B5.12 r.4',
      bridge: 'E5.2 A5.2 C6.4 B5.4 A5.4 | G5.6 E5.2 C5.8 | G5.2 B5.2 E6.4 D6.4 B5.4 | G5.6 F#5.2 E5.8 |' +
              'E5.2 G5.2 C6.4 B5.4 G5.4 | A5.2 F#5.2 D6.4 C6.4 A5.4 | F#5.4 B5.4 A5.4 F#5.4 | D#5.4 F#5.4 A5.4 B5.4'
    };
    var head = [B.b1, B.b2, B.b3, B.b4, B.b1, B.b6].join(' | ');
    SONGS_DEF.battle.mel = [head, B.b7, B.b8, head, B.c7, B.c8, B.bridge].join(' | ');
  })();

  /* ------------------------------------------------------------------ *
   * Compile songs into per-step event arrays (pure data, no audio ctx)
   * ------------------------------------------------------------------ */
  var PROBLEMS = [];
  function compileSection(sec, def, name, label) {
    var chords = parseChords(sec.chords);
    var L = chords.length;
    var ev = []; for (var i = 0; i < L; i++) ev.push([]);
    var mel = parseMel(sec.mel);
    if (mel.len !== L) PROBLEMS.push(name + '/' + label + ': melody ' + mel.len + ' steps vs chords ' + L);
    var lead = def.lead || { inst: 'lead' };
    mel.ev.forEach(function (n) {
      if (n.s < L) ev[n.s].push({ i: lead.inst, m: n.m + (lead.oct || 0), d: n.d, v: lead.vol || 1 });
    });
    if (def.lead2) {
      var src = sec.mel2 ? parseMel(sec.mel2) : (def.mel2 && sec === def ? parseMel(def.mel2) : mel);
      if (src !== mel && src.len !== L) PROBLEMS.push(name + '/' + label + ': mel2 ' + src.len + ' vs ' + L);
      src.ev.forEach(function (n) {
        if (n.s < L) ev[n.s].push({ i: def.lead2.inst, m: n.m + (def.lead2.oct || 0), d: n.d, v: def.lead2.vol || 1 });
      });
    }
    var bassStyle = (sec !== def && sec.bass) || (def.bass && def.bass.style);
    var bassInst = (def.bass && def.bass.inst) || 'bass';
    var harms = sec.harm || def.harm || [];
    for (var s = 0; s < L; s++) {
      var ci = chords[s], sb = s % 16, k = s - ci.seg0;
      if (bassStyle && BASS[bassStyle]) {
        var b = BASS[bassStyle](sb, ci, k);
        if (b) ev[s].push({ i: bassInst, m: ci.ch.bass + b[0], d: b[1], v: b[2] * ((def.bass && def.bass.vol) || 1) });
      }
      harms.forEach(function (h) {
        var r = HARM[h.style] && HARM[h.style](sb, ci, k);
        if (r) r.forEach(function (n) {
          ev[s].push({ i: h.inst, m: n[0] + (h.oct || 0), d: n[1], v: n[2] * (h.vol || 1) });
        });
      });
    }
    // drums
    var dr = sec === def ? def.drums : (sec.drums ? { pats: [sec.drums] } : null);
    if (dr) {
      var dv = dr.vol || 1;
      for (s = 0; s < L; s++) {
        var bar = Math.floor(s / 16);
        var lines = (dr.fill && dr.every && (bar + 1) % dr.every === 0) ? dr.fill : dr.pats[bar % dr.pats.length];
        lines.forEach(function (line) {
          var c = line.charAt(s % 16);
          if (c && c !== '.') ev[s].push({ dr: c, v: dv * (c === 'h' ? (s % 4 === 0 ? 1 : s % 2 ? 0.55 : 0.8) : 1) });
        });
      }
      if (sec === def && def.crashEvery) {
        for (s = 0; s < L; s += 16 * def.crashEvery) ev[s].push({ dr: 'c', v: 0.8 });
      }
    }
    return { ev: ev, len: L };
  }

  var SONGS = {};
  Object.keys(SONGS_DEF).forEach(function (name) {
    var def = SONGS_DEF[name];
    try {
      var loop = compileSection(def, def, name, 'loop');
      var intro = def.intro ? compileSection(def.intro, def, name, 'intro') : { ev: [], len: 0 };
      SONGS[name] = { def: def, loop: loop, intro: intro, sd: 60 / def.bpm / 4 };
    } catch (e) {
      PROBLEMS.push(name + ': ' + e.message);
    }
  });

  /* ------------------------------------------------------------------ *
   * Per-context resources
   * ------------------------------------------------------------------ */
  function res(c) {
    if (c.__fuda) return c.__fuda;
    var r = { waves: {} };
    var len = Math.floor(c.sampleRate * 2);
    var nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0);
    var seed = 0x9e3779b9 | 0;
    function rnd() {                       // xorshift32, deterministic white noise in [-1, 1)
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 2147483648 - 1;
    }
    for (var i = 0; i < len; i++) d[i] = rnd();
    r.noise = nb;
    // small plate-ish reverb impulse
    var il = Math.floor(c.sampleRate * 2.2);
    var ib = c.createBuffer(2, il, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var id = ib.getChannelData(ch), lp = 0;
      for (i = 0; i < il; i++) {
        var x = rnd();
        lp += (x - lp) * (0.55 - 0.4 * i / il);            // darker tail
        id[i] = lp * Math.pow(1 - i / il, 3.2) * (i < 40 ? i / 40 : 1);
      }
    }
    r.impulse = ib;
    c.__fuda = r;
    return r;
  }
  function pulseWave(c, duty) {
    var r = res(c), key = duty.toFixed(3);
    if (r.waves[key]) return r.waves[key];
    var N = 48, re = new Float32Array(N), im = new Float32Array(N);
    for (var n = 1; n < N; n++) {
      // gentle harmonic roll-off keeps the pulse bright but not harsh
      re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty) * Math.exp(-n / 40);
    }
    var w = c.createPeriodicWave(re, im);
    r.waves[key] = w;
    return w;
  }

  /* ------------------------------------------------------------------ *
   * Instruments
   * ------------------------------------------------------------------ */
  var INST = {
    lead:   { kind: 'pulse', duty: 0.25, vol: 0.1, chorus: 6, vib: 14, cut: 4200, att: 0.008, dec: 0.12, sus: 0.72, rel: 0.07, gate: 0.92, echo: 1, verb: 0.6, pan: 0 },
    lead50: { kind: 'pulse', duty: 0.5, vol: 0.065, chorus: 7, vib: 12, cut: 3000, att: 0.01, dec: 0.1, sus: 0.8, rel: 0.06, gate: 0.92, echo: 1, verb: 0.6, pan: 0 },
    soft:   { kind: 'pulse', duty: 0.35, vol: 0.075, chorus: 8, vib: 16, cut: 2400, att: 0.04, dec: 0.2, sus: 0.8, rel: 0.25, gate: 0.97, echo: 1, verb: 1, pan: 0 },
    harm:   { kind: 'pulse', duty: 0.125, vol: 0.075, cut: 3400, att: 0.004, dec: 0.08, sus: 0.45, rel: 0.04, gate: 0.6, echo: 0.7, verb: 0.4, pan: -0.35 },
    harm25: { kind: 'pulse', duty: 0.25, vol: 0.06, cut: 2600, att: 0.004, dec: 0.08, sus: 0.5, rel: 0.05, gate: 0.6, echo: 0.5, verb: 0.4, pan: 0.35 },
    bass:   { kind: 'bass', vol: 0.14, att: 0.004, dec: 0.06, sus: 0.85, rel: 0.03, gate: 0.85, echo: 0, verb: 0.05, pan: 0 },
    drone:  { kind: 'bass', vol: 0.075, att: 0.3, dec: 0.4, sus: 0.8, rel: 0.8, gate: 1, echo: 0, verb: 0.4, pan: 0 },
    flute:  { kind: 'tri', vol: 0.11, att: 0.03, dec: 0.1, sus: 0.85, rel: 0.1, vib: 12, gate: 0.9, echo: 0.8, verb: 0.7, pan: 0 },
    koto:   { kind: 'koto', vol: 0.16, decay: 1.4, gate: 1, echo: 1, verb: 1, pan: 0 },
    bell:   { kind: 'bell', vol: 0.09, decay: 2.2, gate: 1, echo: 1, verb: 1.2, pan: 0.4 },
    epiano: { kind: 'ep', vol: 0.11, decay: 1.1, gate: 1, echo: 0.4, verb: 0.8, pan: -0.25 },
    pad:    { kind: 'pad', vol: 0.02, cut: 1300, att: 0.5, dec: 0.5, sus: 0.9, rel: 0.9, gate: 1, echo: 0, verb: 1, pan: 0.15 },
    // Chapter 2 voices
    epic:   { kind: 'pulse', duty: 0.25, vol: 0.095, chorus: 9, vib: 18, cut: 4800, att: 0.01, dec: 0.15, sus: 0.8, rel: 0.12, gate: 0.95, echo: 1, verb: 0.8, pan: 0 },
    drop:   { kind: 'ep', vol: 0.06, decay: 0.45, gate: 1, echo: 0.9, verb: 0.9, pan: -0.3 },
    mbox:   { kind: 'mbox', vol: 0.12, decay: 1.6, gate: 1, echo: 0.8, verb: 1.1, pan: 0 },
    drums:  { echo: 0, verb: 0.3, pan: 0, vol: 0.65 }
  };

  function envelope(c, g, t, d, o, vol) {
    var gg = g.gain, a = o.att, pk = t + a, ds = pk + o.dec;
    gg.value = 0;                          // intrinsic 0: avoids a 1-sample click on sub-sample starts
    gg.setValueAtTime(0, t);
    gg.linearRampToValueAtTime(vol, pk);
    gg.linearRampToValueAtTime(vol * o.sus, ds);
    var end = Math.max(ds, t + d);
    gg.setValueAtTime(vol * o.sus, end);
    gg.linearRampToValueAtTime(0, end + o.rel);
    return end + o.rel + 0.02;
  }

  function addVibrato(c, oscs, t, depth, rate, delay) {
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = rate || 5.5;
    lg.gain.value = 0; lg.gain.setValueAtTime(0, t);
    lg.gain.setValueAtTime(0, t + (delay || 0.18));
    lg.gain.linearRampToValueAtTime(depth, t + (delay || 0.18) + 0.25);
    lfo.connect(lg);
    oscs.forEach(function (o) { lg.connect(o.detune); });
    lfo.start(t);
    return lfo;
  }

  var VOICE = {
    pulse: function (P, o, m, t, d, v, dest) {
      var c = P.c, f = mf(m), n = o.chorus ? 2 : 1;
      var g = c.createGain(), flt = c.createBiquadFilter();
      flt.type = 'lowpass'; flt.frequency.value = o.cut; flt.Q.value = 0.4;
      flt.connect(g); g.connect(dest);
      var stop = envelope(c, g, t, d, o, o.vol * v / (n === 2 ? 1.5 : 1));
      var oscs = [];
      for (var i = 0; i < n; i++) {
        var os = c.createOscillator();
        os.setPeriodicWave(pulseWave(c, o.duty));
        os.frequency.value = f;
        if (n === 2) os.detune.value = i ? o.chorus : -o.chorus;
        os.connect(flt); os.start(t); os.stop(stop);
        oscs.push(os);
      }
      if (o.vib && d > 0.28) addVibrato(c, oscs, t, o.vib, 5.6, 0.16).stop(stop);
    },
    tri: function (P, o, m, t, d, v, dest) {
      var c = P.c, g = c.createGain(), os = c.createOscillator();
      os.type = 'triangle'; os.frequency.value = mf(m);
      var stop = envelope(c, g, t, d, o, o.vol * v);
      os.connect(g); g.connect(dest); os.start(t); os.stop(stop);
      if (o.vib && d > 0.3) addVibrato(c, [os], t, o.vib, 5.2, 0.2).stop(stop);
    },
    bass: function (P, o, m, t, d, v, dest) {
      var c = P.c, g = c.createGain(), f = mf(m);
      var os = c.createOscillator(); os.type = 'triangle'; os.frequency.value = f;
      var sq = c.createOscillator(); sq.setPeriodicWave(pulseWave(c, 0.5)); sq.frequency.value = f;
      var sg = c.createGain(); sg.gain.value = 0.22;
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3;
      sq.connect(sg); sg.connect(lp); lp.connect(g); os.connect(g);
      g.connect(dest);
      var stop = envelope(c, g, t, d, o, o.vol * v);
      os.start(t); sq.start(t); os.stop(stop); sq.stop(stop);
    },
    koto: function (P, o, m, t, d, v, dest) {
      var c = P.c, f = mf(m), g = c.createGain(), lp = c.createBiquadFilter();
      var a = c.createOscillator(), b = c.createOscillator();
      a.type = 'sawtooth'; b.setPeriodicWave(pulseWave(c, 0.2));
      [a, b].forEach(function (x) {
        x.frequency.value = f;
        x.detune.setValueAtTime(-35, t);                       // little string "pull"
        x.detune.linearRampToValueAtTime(0, t + 0.05);
      });
      b.detune.value = 3;
      lp.type = 'lowpass'; lp.Q.value = 3;
      lp.frequency.setValueAtTime(Math.min(f * 10, 7000), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.3, 300), t + 0.35);
      var bg = c.createGain(); bg.gain.value = 0.6;
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(dest);
      var dec = Math.min(o.decay, Math.max(d + 0.5, 0.5));
      g.gain.value = 0; g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(o.vol * v, t + 0.003);
      g.gain.exponentialRampToValueAtTime(o.vol * v * 0.25, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      a.start(t); b.start(t); a.stop(t + dec + 0.02); b.stop(t + dec + 0.02);
    },
    bell: function (P, o, m, t, d, v, dest) {
      var c = P.c, f = mf(m);
      [[1, 1, 1], [2.76, 0.35, 0.45], [5.4, 0.15, 0.25], [2.0, 0.2, 0.7]].forEach(function (p) {
        var os = c.createOscillator(), g = c.createGain();
        os.type = 'sine'; os.frequency.value = f * p[0];
        var dec = o.decay * p[2];
        g.gain.value = 0; g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(o.vol * v * p[1], t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
        os.connect(g); g.connect(dest); os.start(t); os.stop(t + dec + 0.02);
      });
    },
    mbox: function (P, o, m, t, d, v, dest) {   // music-box tine: pure fundamental, quick bright partials
      var c = P.c, f = mf(m);
      [[1, 1, 1], [2, 0.22, 0.35], [4.07, 0.08, 0.08], [6.3, 0.04, 0.04]].forEach(function (p) {
        var os = c.createOscillator(), g = c.createGain();
        os.type = 'sine'; os.frequency.value = f * p[0];
        var dec = o.decay * p[2];
        g.gain.value = 0; g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(o.vol * v * p[1], t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
        os.connect(g); g.connect(dest); os.start(t); os.stop(t + dec + 0.02);
      });
    },
    ep: function (P, o, m, t, d, v, dest) {
      var c = P.c, f = mf(m);
      var a = c.createOscillator(), b = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
      a.type = 'triangle'; a.frequency.value = f;
      b.type = 'sine'; b.frequency.value = f * 2;
      var dec = Math.min(o.decay, d + 0.6);
      g.gain.value = 0; g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(o.vol * v, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      g2.gain.setValueAtTime(0.5, t);
      g2.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      a.connect(g); b.connect(g2); g2.connect(g); g.connect(dest);
      a.start(t); b.start(t); a.stop(t + dec + 0.02); b.stop(t + dec + 0.02);
    },
    pad: function (P, o, m, t, d, v, dest) {
      var c = P.c, f = mf(m), g = c.createGain(), lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = o.cut; lp.Q.value = 0.5;
      lp.connect(g); g.connect(dest);
      var stop = envelope(c, g, t, d, o, o.vol * v);
      [-9, 9].forEach(function (dt) {
        var os = c.createOscillator(); os.type = 'sawtooth';
        os.frequency.value = f; os.detune.value = dt;
        os.connect(lp); os.start(t); os.stop(stop);
      });
    }
  };

  // Drums: (P, t, vel, dest)
  function noiseSrc(c, t) {
    var s = c.createBufferSource();
    s.buffer = res(c).noise; s.loop = true;
    return s;
  }
  function drumNoise(c, dest, t, v, type, f, q, dec, att) {
    var s = noiseSrc(c, t), fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.value = 0; g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + (att || 0.001));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t, (t * 7.31) % 1.5); s.stop(t + dec + 0.02);
  }
  function drumTone(c, dest, t, v, type, f1, f2, fdec, dec) {
    var os = c.createOscillator(), g = c.createGain();
    os.type = type;
    os.frequency.setValueAtTime(f1, t);
    os.frequency.exponentialRampToValueAtTime(f2, t + fdec);
    g.gain.value = 0; g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    os.connect(g); g.connect(dest); os.start(t); os.stop(t + dec + 0.02);
  }
  var DRUM = {
    k: function (c, d, t, v) { drumTone(c, d, t, 0.34 * v, 'sine', 150, 46, 0.1, 0.24); drumNoise(c, d, t, 0.05 * v, 'lowpass', 1500, 0.5, 0.02); },
    s: function (c, d, t, v) { drumNoise(c, d, t, 0.16 * v, 'bandpass', 1900, 0.7, 0.15); drumTone(c, d, t, 0.1 * v, 'triangle', 220, 170, 0.05, 0.08); },
    h: function (c, d, t, v) { drumNoise(c, d, t, 0.05 * v, 'highpass', 7500, 0.6, 0.04); },
    o: function (c, d, t, v) { drumNoise(c, d, t, 0.04 * v, 'highpass', 6500, 0.6, 0.18); },
    x: function (c, d, t, v) { drumNoise(c, d, t, 0.045 * v, 'bandpass', 6000, 1.2, 0.06, 0.012); },
    r: function (c, d, t, v) { drumTone(c, d, t, 0.09 * v, 'triangle', 1100, 900, 0.02, 0.05); drumNoise(c, d, t, 0.03 * v, 'bandpass', 2500, 4, 0.02); },
    t: function (c, d, t, v) { drumTone(c, d, t, 0.3 * v, 'sine', 170, 85, 0.18, 0.3); },
    m: function (c, d, t, v) { drumTone(c, d, t, 0.26 * v, 'sine', 260, 140, 0.15, 0.25); },
    c: function (c, d, t, v) { drumNoise(c, d, t, 0.06 * v, 'highpass', 4500, 0.5, 1.3); },
    T: function (c, d, t, v) { drumTone(c, d, t, 0.45 * v, 'sine', 95, 52, 0.25, 0.9); drumNoise(c, d, t, 0.08 * v, 'lowpass', 400, 0.7, 0.2); }
  };

  /* ------------------------------------------------------------------ *
   * Player: per-track bus with its own echo + reverb (so crossfades are clean)
   * ------------------------------------------------------------------ */
  function makePlayer(c, dest, def) {
    var P = { c: c, chans: {} };
    var out = c.createGain(); out.connect(dest); P.out = out;
    var r = res(c);
    // echo
    var ein = c.createGain(), dl = c.createDelay(2.5), fb = c.createGain(), elp = c.createBiquadFilter();
    ein.gain.value = def.echo[2];
    dl.delayTime.value = def.echo[0] * 60 / def.bpm;
    fb.gain.value = def.echo[1];
    elp.type = 'lowpass'; elp.frequency.value = 2400;
    ein.connect(dl); dl.connect(elp); elp.connect(fb); fb.connect(dl); elp.connect(out);
    // reverb
    var vin = c.createGain(), cv = c.createConvolver();
    vin.gain.value = def.verb; cv.buffer = r.impulse;
    vin.connect(cv); cv.connect(out);
    P.ein = ein; P.vin = vin;
    P.chan = function (name) {
      if (P.chans[name]) return P.chans[name];
      var o = INST[name] || INST.lead;
      var g = c.createGain(), node = g;
      if (o.pan && c.createStereoPanner) {
        var p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); node = p;
      }
      node.connect(out);
      if (o.echo) { var es = c.createGain(); es.gain.value = o.echo; node.connect(es); es.connect(ein); }
      if (o.verb) { var vs = c.createGain(); vs.gain.value = o.verb; node.connect(vs); vs.connect(vin); }
      P.chans[name] = g;
      return g;
    };
    return P;
  }

  function schedStep(P, S, step, t) {
    var sec, idx;
    if (step < S.intro.len) { sec = S.intro; idx = step; }
    else { sec = S.loop; idx = (step - S.intro.len) % S.loop.len; }
    var evs = sec.ev[idx];
    if (!evs || !evs.length) return;
    var sw = (idx % 4 === 2) ? S.def.swing * S.sd : 0;
    var tt = t + sw;
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (P.only && P.only !== (e.dr ? 'drums' : e.i)) continue;
      if (e.dr) { if (DRUM[e.dr]) DRUM[e.dr](P.c, P.chan('drums'), tt, e.v * INST.drums.vol); continue; }
      var o = INST[e.i] || INST.lead;
      VOICE[o.kind](P, o, e.m, tt, e.d * S.sd * (o.gate || 0.9), e.v, P.chan(e.i));
    }
  }

  /* ------------------------------------------------------------------ *
   * Master graph
   * ------------------------------------------------------------------ */
  var SFX_BOOST = 1.8;               // effects sit slightly above the music bed
  function buildGraph(c, mv, sv, muted, raw) {
    var G = { c: c };
    G.master = c.createGain(); G.master.gain.value = muted ? 0 : 1;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 3;
    comp.attack.value = 0.005; comp.release.value = 0.2;
    var lim = c.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20;
    lim.attack.value = 0.001; lim.release.value = 0.08;
    var post = c.createGain(); post.gain.value = 0.92;
    if (raw) G.master.connect(c.destination);
    else { G.master.connect(comp); comp.connect(lim); lim.connect(post); post.connect(c.destination); }
    G.duck = c.createGain(); G.duck.connect(G.master);
    G.music = c.createGain(); G.music.gain.value = mv; G.music.connect(G.duck);
    G.sfx = c.createGain(); G.sfx.gain.value = sv * SFX_BOOST; G.sfx.connect(G.master);
    return G;
  }

  /* ------------------------------------------------------------------ *
   * SFX
   * ------------------------------------------------------------------ */
  // tone: {w (type or duty number), f, f2, fd, t, d, v, a, cut, cut2, vib, vibRate, pan, pan2, flat}
  function T(c, out, o) {
    var t = o.t, d = o.d, os = c.createOscillator();
    if (typeof o.w === 'number') os.setPeriodicWave(pulseWave(c, o.w)); else os.type = o.w || 'square';
    os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fd || d));
    var g = c.createGain(), a = o.a || 0.004;
    g.gain.value = 0; g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.v, t + a);
    if (o.flat) { g.gain.setValueAtTime(o.v, t + Math.max(a, d * 0.7)); g.gain.linearRampToValueAtTime(0, t + d); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    var node = os;
    if (o.cut) {
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(o.cut, t);
      if (o.cut2) lp.frequency.exponentialRampToValueAtTime(o.cut2, t + d);
      node.connect(lp); node = lp;
    }
    node.connect(g); node = g;
    if (o.pan != null && c.createStereoPanner) {
      var p = c.createStereoPanner(); p.pan.setValueAtTime(o.pan, t);
      if (o.pan2 != null) p.pan.linearRampToValueAtTime(o.pan2, t + d);
      node.connect(p); node = p;
    }
    node.connect(out);
    if (o.vib) {
      var l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = o.vibRate || 6; lg.gain.value = o.vib;
      if (o.vibRate2) l.frequency.linearRampToValueAtTime(o.vibRate2, t + d);
      l.connect(lg); lg.connect(os.detune); l.start(t); l.stop(t + d + 0.05);
    }
    os.start(t); os.stop(t + d + 0.05);
  }
  // noise: {t, d, v, type, f, f2, q, a, pan, pan2, am (Hz tremolo)}
  function N(c, out, o) {
    var t = o.t, d = o.d, s = noiseSrc(c, t), fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = o.type || 'bandpass'; fl.Q.value = o.q || 1;
    fl.frequency.setValueAtTime(o.f, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fd || d));
    var a = o.a || 0.002;
    g.gain.value = 0; g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.v, t + a);
    if (o.flat) { g.gain.setValueAtTime(o.v, t + Math.max(a, d * 0.6)); g.gain.linearRampToValueAtTime(0, t + d); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g);
    var node = g;
    if (o.am) {
      var ag = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      ag.gain.value = 0.5; l.frequency.value = o.am; lg.gain.value = 0.5;
      l.connect(lg); lg.connect(ag.gain); node.connect(ag); node = ag;
      l.start(t); l.stop(t + d + 0.05);
    }
    if (o.pan != null && c.createStereoPanner) {
      var p = c.createStereoPanner(); p.pan.setValueAtTime(o.pan, t);
      if (o.pan2 != null) p.pan.linearRampToValueAtTime(o.pan2, t + d);
      node.connect(p); node = p;
    }
    node.connect(out);
    s.start(t, (t * 3.7) % 1.5); s.stop(t + d + 0.05);
  }
  function seq(c, out, t, notes, step, o) {  // quick arpeggio helper
    notes.forEach(function (m, i) {
      if (m == null) return;
      T(c, out, { w: o.w, f: mf(m), t: t + i * step, d: o.d, v: o.v, cut: o.cut, a: o.a, flat: o.flat, vib: o.vib });
    });
  }
  function stampThud(c, out, t, s) {
    T(c, out, { w: 'sine', f: 170, f2: 45, fd: 0.12, t: t, d: 0.32, v: 0.55 * s });
    N(c, out, { type: 'lowpass', f: 900, f2: 200, q: 0.7, t: t, d: 0.13, v: 0.32 * s });
    T(c, out, { w: 'triangle', f: 440, f2: 300, t: t, d: 0.05, v: 0.12 * s });
    N(c, out, { type: 'bandpass', f: 2600, q: 1.5, t: t + 0.005, d: 0.05, v: 0.08 * s }); // paper crunch
  }
  var blipN = 0;
  var SFX = {
    cursor: function (c, o, t) { T(c, o, { w: 0.25, f: 1760, f2: 1700, t: t, d: 0.035, v: 0.06, cut: 5000 }); },
    confirm: function (c, o, t) {
      T(c, o, { w: 0.25, f: 1175, t: t, d: 0.06, v: 0.07, cut: 5000, flat: 1 });
      T(c, o, { w: 0.25, f: 1568, t: t + 0.055, d: 0.1, v: 0.07, cut: 5000 });
    },
    cancel: function (c, o, t) { T(c, o, { w: 0.5, f: 740, f2: 440, t: t, d: 0.1, v: 0.07, cut: 2500 }); },
    blip: function (c, o, t) {
      var off = [0, 40, -25, 60, 15][blipN++ % 5];
      T(c, o, { w: 0.5, f: 700 + off, t: t, d: 0.024, v: 0.03, cut: 2200, a: 0.002 });
    },
    step: function (c, o, t) { N(c, o, { type: 'lowpass', f: 650, q: 0.7, t: t, d: 0.04, v: 0.05 }); },
    grass: function (c, o, t) {
      [[0, 2600], [0.045, 4200], [0.1, 3200], [0.15, 3800]].forEach(function (p, i) {
        N(c, o, { type: 'bandpass', f: p[1], q: 0.9, t: t + p[0], d: 0.07, v: 0.1 - i * 0.015, a: 0.01 });
      });
      N(c, o, { type: 'highpass', f: 5000, t: t, d: 0.22, v: 0.025, a: 0.03 });
    },
    bump: function (c, o, t) {
      T(c, o, { w: 'triangle', f: 150, f2: 60, t: t, d: 0.12, v: 0.3 });
      N(c, o, { type: 'lowpass', f: 400, t: t, d: 0.06, v: 0.14 });
    },
    door: function (c, o, t) {                   // sliding shoji: gara-gara... tok
      N(c, o, { type: 'bandpass', f: 800, f2: 1600, q: 3, t: t, d: 0.3, v: 0.12, am: 28, flat: 1, a: 0.02 });
      T(c, o, { w: 'triangle', f: 520, f2: 480, t: t + 0.3, d: 0.06, v: 0.14 });
      N(c, o, { type: 'bandpass', f: 1500, q: 5, t: t + 0.3, d: 0.03, v: 0.06 });
    },
    encounter: function (c, o, t) {
      for (var i = 0; i < 14; i++) {
        T(c, o, { w: 0.125, f: mf(64 + i + (i % 2 ? 7 : 0)), t: t + i * 0.04, d: 0.045, v: 0.06, cut: 5000, flat: 1 });
      }
      N(c, o, { type: 'highpass', f: 400, f2: 6000, t: t, d: 0.56, v: 0.06, a: 0.5, flat: 1 });
      var h = t + 0.58;
      [52, 58, 64, 70].forEach(function (m) {
        T(c, o, { w: 0.5, f: mf(m), t: h, d: 0.55, v: 0.055, cut: 3000, cut2: 800 });
      });
      T(c, o, { w: 'sine', f: 130, f2: 40, t: h, d: 0.35, v: 0.5 });
      N(c, o, { type: 'lowpass', f: 3000, f2: 300, t: h, d: 0.45, v: 0.18 });
      N(c, o, { type: 'highpass', f: 5000, t: h, d: 0.9, v: 0.05 });
    },
    hit: function (c, o, t) {
      N(c, o, { type: 'lowpass', f: 4000, f2: 500, t: t, d: 0.15, v: 0.32 });
      T(c, o, { w: 0.5, f: 320, f2: 60, t: t, d: 0.12, v: 0.15, cut: 2000 });
    },
    hitSuper: function (c, o, t) {
      N(c, o, { type: 'lowpass', f: 6000, f2: 400, t: t, d: 0.25, v: 0.3 });
      T(c, o, { w: 'sawtooth', f: 900, f2: 60, t: t, d: 0.2, v: 0.12, cut: 3000 });
      T(c, o, { w: 'sine', f: 160, f2: 40, t: t, d: 0.3, v: 0.34 });
      N(c, o, { type: 'bandpass', f: 1500, q: 0.7, t: t + 0.08, d: 0.18, v: 0.25 });
      T(c, o, { w: 0.5, f: 600, f2: 100, t: t + 0.08, d: 0.16, v: 0.1, cut: 2500 });
    },
    hitWeak: function (c, o, t) {
      N(c, o, { type: 'lowpass', f: 1500, f2: 300, t: t, d: 0.08, v: 0.18 });
      T(c, o, { w: 'triangle', f: 220, f2: 140, t: t, d: 0.08, v: 0.14 });
    },
    crit: function (c, o, t) {
      N(c, o, { type: 'highpass', f: 7000, f2: 1500, t: t, d: 0.09, v: 0.22, pan: -0.6, pan2: 0.6 });
      N(c, o, { type: 'lowpass', f: 6000, f2: 400, t: t + 0.06, d: 0.25, v: 0.36 });
      T(c, o, { w: 'sine', f: 170, f2: 40, t: t + 0.06, d: 0.3, v: 0.34 });
      T(c, o, { w: 'sine', f: 2637, t: t + 0.08, d: 0.3, v: 0.05 });
      T(c, o, { w: 'sine', f: 3520, t: t + 0.13, d: 0.3, v: 0.045 });
    },
    faint: function (c, o, t) {
      T(c, o, { w: 0.5, f: 880, f2: 90, t: t, d: 0.8, v: 0.09, cut: 2500, vib: 40, vibRate: 9, flat: 1 });
      T(c, o, { w: 'sine', f: 90, f2: 40, t: t + 0.78, d: 0.3, v: 0.4 });
      N(c, o, { type: 'lowpass', f: 300, t: t + 0.78, d: 0.2, v: 0.18 });
    },
    throw: function (c, o, t) {
      N(c, o, { type: 'bandpass', f: 500, f2: 3500, q: 1.2, t: t, d: 0.36, v: 0.2, a: 0.15, pan: -0.5, pan2: 0.5 });
      T(c, o, { w: 'sine', f: 400, f2: 1200, t: t, d: 0.3, v: 0.04, a: 0.1 });
    },
    wobble: function (c, o, t) {
      T(c, o, { w: 'triangle', f: 1400, t: t, d: 0.035, v: 0.14 });
      T(c, o, { w: 'triangle', f: 1000, t: t + 0.09, d: 0.035, v: 0.11 });
      T(c, o, { w: 'sine', f: 190, f2: 150, t: t, d: 0.16, v: 0.14 });
      N(c, o, { type: 'bandpass', f: 3000, q: 2, t: t, d: 0.12, v: 0.05, am: 40 });
    },
    sealOk: function (c, o, t) {
      stampThud(c, o, t, 0.9);
      var j = t + 0.2;
      seq(c, o, j, [67, 72, 76, 79], 0.07, { w: 0.25, d: 0.14, v: 0.07, cut: 4500, flat: 1 });
      T(c, o, { w: 0.25, f: mf(84), t: j + 0.3, d: 0.7, v: 0.07, cut: 4500, vib: 12, flat: 1 });
      [72, 76, 79].forEach(function (m) { T(c, o, { w: 'triangle', f: mf(m), t: j + 0.3, d: 0.75, v: 0.06, flat: 1 }); });
      T(c, o, { w: 'triangle', f: mf(48), t: j + 0.3, d: 0.75, v: 0.14, flat: 1 });
      T(c, o, { w: 'sine', f: 3136, t: j + 0.42, d: 0.35, v: 0.04 });
      T(c, o, { w: 'sine', f: 4186, t: j + 0.52, d: 0.35, v: 0.035 });
    },
    sealFail: function (c, o, t) {
      N(c, o, { type: 'highpass', f: 1500, t: t, d: 0.25, v: 0.3 });
      T(c, o, { w: 0.5, f: 180, f2: 900, t: t, d: 0.12, v: 0.1, cut: 3000 });
      for (var i = 0; i < 8; i++) N(c, o, { type: 'bandpass', f: 2500 + (i % 3) * 600, q: 2, t: t + 0.1 + i * 0.035, d: 0.03, v: 0.08 * (1 - i / 8) });
      T(c, o, { w: 0.25, f: 660, f2: 330, t: t + 0.22, d: 0.28, v: 0.06, cut: 3000 });
    },
    levelup: function (c, o, t) {
      seq(c, o, t, [72, 76, 79, 84, 88, 91], 0.055, { w: 0.25, d: 0.1, v: 0.065, cut: 5000, flat: 1 });
      var h = t + 0.36;
      for (var i = 0; i < 8; i++) {
        T(c, o, { w: 0.5, f: mf(i % 2 ? 88 : 84), t: h + i * 0.06, d: 0.07, v: 0.05, cut: 4000, flat: 1 });
      }
      T(c, o, { w: 0.25, f: mf(91), t: h + 0.5, d: 0.5, v: 0.06, cut: 4500, vib: 14 });
      T(c, o, { w: 'triangle', f: mf(60), t: h, d: 0.9, v: 0.14, flat: 1 });
    },
    heal: function (c, o, t) {
      [72, 76, 79, 83, 86, 91].forEach(function (m, i) {
        T(c, o, { w: 'sine', f: mf(m), t: t + i * 0.08, d: 0.7, v: 0.06 });
        T(c, o, { w: 'triangle', f: mf(m) * 1.004, t: t + i * 0.08, d: 0.6, v: 0.035 });
      });
      N(c, o, { type: 'highpass', f: 7000, t: t, d: 0.8, v: 0.02, a: 0.3 });
    },
    item: function (c, o, t) {                    // "you got it!" jingle (original)
      var n = [[67, 0, 0.1], [71, 0.1, 0.1], [74, 0.2, 0.1], [79, 0.3, 0.26], [76, 0.56, 0.1], [79, 0.66, 0.1], [84, 0.76, 0.55]];
      n.forEach(function (x) { T(c, o, { w: 0.25, f: mf(x[0]), t: t + x[1], d: x[2], v: 0.075, cut: 4500, flat: 1, vib: x[2] > 0.3 ? 12 : 0 }); });
      T(c, o, { w: 0.125, f: mf(71), t: t + 0.3, d: 0.26, v: 0.04, flat: 1 });
      T(c, o, { w: 0.125, f: mf(76), t: t + 0.76, d: 0.55, v: 0.04, flat: 1 });
      T(c, o, { w: 0.125, f: mf(79), t: t + 0.76, d: 0.55, v: 0.035, flat: 1 });
      T(c, o, { w: 'triangle', f: mf(43), t: t, d: 0.5, v: 0.16, flat: 1 });
      T(c, o, { w: 'triangle', f: mf(48), t: t + 0.56, d: 0.75, v: 0.16, flat: 1 });
      N(c, o, { type: 'highpass', f: 6000, t: t + 0.76, d: 0.5, v: 0.03 });
    },
    coin: function (c, o, t) {
      T(c, o, { w: 0.25, f: 1976, t: t, d: 0.07, v: 0.06, flat: 1 });
      T(c, o, { w: 0.25, f: 2637, t: t + 0.07, d: 0.35, v: 0.06 });
    },
    flip: function (c, o, t) {
      N(c, o, { type: 'bandpass', f: 1800, f2: 4000, q: 1.5, t: t, d: 0.07, v: 0.14 });
      T(c, o, { w: 'triangle', f: 900, t: t + 0.03, d: 0.025, v: 0.05 });
    },
    rare: function (c, o, t) {
      T(c, o, { w: 'sine', f: 1047, f2: 4186, t: t, d: 0.5, v: 0.045, a: 0.2, flat: 1 });
      var pent = [84, 88, 91, 96, 100, 103, 108], s = 7;
      for (var i = 0; i < 16; i++) {
        s = (s * 13 + 5) % 17;
        T(c, o, { w: 'sine', f: mf(pent[s % pent.length]), t: t + i * 0.045, d: 0.22, v: 0.035, pan: ((s % 5) - 2) / 2.5 });
      }
      [84, 88, 91, 96].forEach(function (m, k) {
        T(c, o, { w: 'sine', f: mf(m), t: t + 0.55 + k * 0.02, d: 1.2, v: 0.045 });
        T(c, o, { w: 'sine', f: mf(m) * 2.76, t: t + 0.55 + k * 0.02, d: 0.5, v: 0.01 });
      });
      N(c, o, { type: 'highpass', f: 8000, t: t, d: 1.0, v: 0.03, a: 0.35 });
    },
    stamp: function (c, o, t) { stampThud(c, o, t, 1); },
    run: function (c, o, t) {
      for (var i = 0; i < 3; i++) N(c, o, { type: 'lowpass', f: 1200, t: t + i * 0.08, d: 0.04, v: 0.12 });
      N(c, o, { type: 'bandpass', f: 2000, f2: 400, q: 1, t: t + 0.22, d: 0.35, v: 0.15, pan: 0, pan2: 0.9 });
      T(c, o, { w: 0.5, f: 880, f2: 220, t: t + 0.22, d: 0.25, v: 0.045, cut: 2500 });
    },
    save: function (c, o, t) {
      [[84, 0, 0.5], [91, 0.12, 0.5], [96, 0.24, 0.9]].forEach(function (x) {
        T(c, o, { w: 'sine', f: mf(x[0]), t: t + x[1], d: x[2], v: 0.06 });
        T(c, o, { w: 'triangle', f: mf(x[0] - 12), t: t + x[1], d: x[2] * 0.7, v: 0.04 });
      });
    },
    menuOpen: function (c, o, t) {
      T(c, o, { w: 0.25, f: 523, f2: 1047, t: t, d: 0.06, v: 0.05, cut: 4000 });
      T(c, o, { w: 0.25, f: 1568, t: t + 0.06, d: 0.05, v: 0.045, cut: 5000 });
    },
    whoosh: function (c, o, t) {
      N(c, o, { type: 'bandpass', f: 300, f2: 2500, fd: 0.25, q: 1, t: t, d: 0.5, v: 0.2, a: 0.2, pan: -0.8, pan2: 0.8 });
    },
    swirl: function (c, o, t) {
      T(c, o, { w: 0.25, f: 300, f2: 1600, t: t, d: 0.9, v: 0.05, cut: 4000, vib: 90, vibRate: 8, vibRate2: 22, flat: 1, a: 0.05 });
      N(c, o, { type: 'bandpass', f: 400, f2: 5000, q: 4, t: t, d: 0.9, v: 0.12, a: 0.4, flat: 1, am: 12 });
      T(c, o, { w: 'sine', f: 1200, f2: 2400, t: t + 0.9, d: 0.08, v: 0.1 });
    },
    charge: function (c, o, t) {
      T(c, o, { w: 'sawtooth', f: 110, f2: 440, t: t, d: 0.9, v: 0.06, cut: 300, cut2: 4000, a: 0.3, flat: 1, vib: 30, vibRate: 16 });
      T(c, o, { w: 0.5, f: 220, f2: 880, t: t, d: 0.9, v: 0.035, a: 0.3, flat: 1, cut: 3000 });
      N(c, o, { type: 'highpass', f: 6000, t: t + 0.8, d: 0.35, v: 0.05 });
      T(c, o, { w: 'sine', f: 1760, t: t + 0.85, d: 0.3, v: 0.04 });
    },
    exclaim: function (c, o, t) {
      T(c, o, { w: 0.25, f: 1568, t: t, d: 0.05, v: 0.075, flat: 1 });
      T(c, o, { w: 0.25, f: 2093, t: t + 0.06, d: 0.14, v: 0.075 });
    }
  };
  var DUCK = { sealOk: 1.35, item: 1.4, levelup: 1.1, heal: 0.8, rare: 1.1, save: 0.7, encounter: 0.4 };
  var MINGAP = { blip: 0.035, step: 0.06, cursor: 0.025, grass: 0.08 };

  /* ------------------------------------------------------------------ *
   * Runtime state & public API
   * ------------------------------------------------------------------ */
  var ctx = null, G = null, cur = null, pending = null;
  var musicVol = 0.5, sfxVol = 0.7, isMuted = false;
  var lastSfx = {};
  var LOOK = 0.25;

  function now() { return ctx.currentTime; }

  function startPlayer(name, fadeIn) {
    var S = SONGS[name];
    var P = makePlayer(ctx, G.music, S.def);
    var t0 = now() + 0.08;
    P.out.gain.setValueAtTime(0, now());
    P.out.gain.linearRampToValueAtTime(1, t0 + fadeIn);
    var p = { name: name, P: P, S: S, step: 0, t0: t0, timer: null };
    p.tick = function () {
      try {
        var n = ctx.currentTime;
        var tt = p.t0 + p.step * S.sd;
        if (tt < n - 0.02) {                          // fell behind (throttled tab): skip ahead, keep grid
          p.step += Math.ceil((n - tt) / S.sd);
        }
        while (p.t0 + p.step * S.sd < n + LOOK) {
          schedStep(P, S, p.step, p.t0 + p.step * S.sd);
          p.step++;
        }
      } catch (e) { /* never throw from the scheduler */ }
    };
    p.tick();
    p.timer = setInterval(p.tick, 25);
    return p;
  }
  function stopPlayer(p, fade) {
    if (!p) return;
    clearInterval(p.timer);
    try {
      var g = p.P.out.gain, n = now();
      g.cancelScheduledValues(n);
      g.setValueAtTime(g.value, n);
      g.linearRampToValueAtTime(0, n + Math.max(0.01, fade));
      setTimeout(function () { try { p.P.out.disconnect(); } catch (e) { } }, (fade + 0.6) * 1000 + 3000);
    } catch (e) { }
  }

  var A = {
    unlock: function () {
      try {
        if (!AC) return;
        if (!ctx) {
          ctx = new AC();
          G = buildGraph(ctx, musicVol, sfxVol, isMuted);
          // iOS: play a silent buffer inside the gesture
          var b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
        }
        if (ctx.state === 'suspended' && ctx.resume) { var pr = ctx.resume(); if (pr && pr.catch) pr.catch(function () { }); }
        if (pending && !cur) { var n = pending; pending = null; A.music(n); }
      } catch (e) { }
    },
    music: function (name) {
      try {
        if (!ctx) { pending = SONGS[name] ? name : null; return; }
        if (cur && cur.name === name) return;
        if (!SONGS[name]) { A.stopMusic(0.5); return; }
        var fadeIn = SONGS[name].intro.len ? 0.05 : 0.6;
        stopPlayer(cur, 0.6);
        cur = startPlayer(name, fadeIn);
      } catch (e) { }
    },
    stopMusic: function (fade) {
      try {
        pending = null;
        if (fade == null) fade = 0.5;
        if (ctx && cur) stopPlayer(cur, fade);
        cur = null;
      } catch (e) { }
    },
    sfx: function (name) {
      try {
        if (!ctx || isMuted || !SFX[name]) return;
        if (ctx.state !== 'running') return;
        var n = now();
        if (MINGAP[name] && lastSfx[name] && n - lastSfx[name] < MINGAP[name]) return;
        lastSfx[name] = n;
        SFX[name](ctx, G.sfx, n + 0.01);
        if (DUCK[name]) {
          var d = G.duck.gain;
          d.cancelScheduledValues(n);
          d.setValueAtTime(d.value, n);
          d.linearRampToValueAtTime(0.25, n + 0.05);
          d.setValueAtTime(0.25, n + DUCK[name]);
          d.linearRampToValueAtTime(1, n + DUCK[name] + 0.4);
        }
      } catch (e) { }
    },
    setMuted: function (b) {
      isMuted = !!b;
      try {
        if (G) {
          var g = G.master.gain, n = now();
          g.cancelScheduledValues(n); g.setValueAtTime(g.value, n);
          g.linearRampToValueAtTime(isMuted ? 0 : 1, n + 0.05);
        }
      } catch (e) { }
    },
    setVolume: function (mv, sv) {
      function cl(x, d) { x = Number(x); return isFinite(x) ? Math.max(0, Math.min(1, x)) : d; }
      musicVol = cl(mv, musicVol); sfxVol = cl(sv, sfxVol);
      try {
        if (G) {
          G.music.gain.setTargetAtTime(musicVol, now(), 0.03);
          G.sfx.gain.setTargetAtTime(sfxVol * SFX_BOOST, now(), 0.03);
        }
      } catch (e) { }
    }
  };
  Object.defineProperty(A, 'muted', {
    enumerable: true,
    get: function () { return isMuted; },
    set: function (b) { A.setMuted(b); }
  });

  // --- Debug / offline rendering hooks (used by tests; harmless in game) ---
  A._debug = {
    problems: PROBLEMS,
    tracks: Object.keys(SONGS),
    sfxNames: Object.keys(SFX),
    info: function (name) {
      var S = SONGS[name]; if (!S) return null;
      return { bpm: S.def.bpm, introSteps: S.intro.len, loopSteps: S.loop.len, introSec: S.intro.len * S.sd, loopSec: S.loop.len * S.sd };
    },
    current: function () { return cur ? cur.name : null; },
    pos: function () { return cur && ctx ? { step: cur.step, t0: cur.t0, now: ctx.currentTime, sd: cur.S.sd } : null; },
    harmonyCheck: function (name) {       // long melody notes that are not chord tones (for composer review)
      var d = SONGS_DEF[name], out = [];
      [d.intro, d].forEach(function (sec) {
        if (!sec) return;
        var ch = parseChords(sec.chords), mel = parseMel(sec.mel);
        mel.ev.forEach(function (n) {
          var c = ch[n.s]; if (!c) return;
          var rel = ((n.m % 12) - c.ch.pc + 12) % 12;
          var ok = c.ch.iv.some(function (i) { return i % 12 === rel; });
          if (!ok && (n.d >= 4 || n.s % 4 === 0)) out.push('bar ' + (Math.floor(n.s / 16) + 1) + ' ' + c.ch.sym + ' note+' + rel + ' d' + n.d);
        });
      });
      return out;
    },
    state: function () { return ctx ? ctx.state : 'none'; },
    // render a track (or sfx) offline; returns Promise<AudioBuffer>
    render: function (name, secs, sr, opt) {
      if (!OAC) return Promise.reject(new Error('no OfflineAudioContext'));
      sr = sr || 44100; opt = opt || {};
      var oc = new OAC(2, Math.ceil(secs * sr), sr);
      var g = buildGraph(oc, musicVol, sfxVol, false, opt.raw);
      if (SONGS[name]) {
        var S = SONGS[name], P = makePlayer(oc, g.music, S.def);
        P.only = opt.only;
        for (var st = 0; st * S.sd < secs; st++) schedStep(P, S, st, 0.05 + st * S.sd);
      } else if (SFX[name]) {
        SFX[name](oc, g.sfx, 0.05);
      }
      return oc.startRendering();
    }
  };

  window.AUDIO = A;
})();
