/* ハマカゼFC — boot */
(function () {
  'use strict';
  if (!window.Sound) {
    const noop = () => {};
    window.Sound = { init: noop, play: noop, bgm: noop, stopBgm: noop, setBgmRate: noop, duck: noop, crowd: noop, setMuted(m) { this.muted = m; }, muted: false, masterVolume: noop };
  }
  const q = new URLSearchParams(location.search);
  async function boot() {
    try {
      await Promise.race([document.fonts.load('10px "DotGothic16"'), new Promise((r) => setTimeout(r, 2500))]);
    } catch (e) { /* font optional */ }
    document.getElementById('boot').remove();
    const auto = q.get('auto') === '1';
    if (auto) Sound.init();
    const scene = q.get('scene');
    if (scene === 'match' || !window.Scenes) {
      E.Game.start(new Match({ formation: q.get('form') || 'balance', tactic: q.get('tac') || undefined, awayTactic: q.get('atac') || undefined, auto, onEnd: (r) => { window.__result = r; if (window.Scenes) E.Game.goto(Scenes.result(r)); } }));
    } else {
      E.Game.start(Scenes.start(scene, { auto }));
    }
    E.canvas && E.canvas.focus();
  }
  boot();
})();
