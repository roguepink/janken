'use strict';
/* タップ(マウス・タッチ)とキーボードを、ゲームの操作にまとめる */

const Input = (() => {
  const KEYS = {
    Digit1: ['hand', 0], Digit2: ['hand', 1], Digit3: ['hand', 2],
    Numpad1: ['hand', 0], Numpad2: ['hand', 1], Numpad3: ['hand', 2],
    KeyZ: ['hand', 0], KeyX: ['hand', 1], KeyC: ['hand', 2],
    ArrowLeft: ['armor'], KeyA: ['armor'], KeyF: ['armor'],
    ArrowRight: ['weapon'], KeyD: ['weapon'], KeyJ: ['weapon'],
    Space: ['start'], Enter: ['start'],
  };

  function init(canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (e.pointerType === 'touch') document.body.classList.add('touch');
      Sound.init();
      if (G.state !== 'match' || G.paused) return;
      const p = Render.toLogical(e.clientX, e.clientY);
      const h = Render.hitTest(p.x, p.y);
      if (h.kind !== 'none') Game.tap(h.kind, h.value);
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyM') { UI.toggleSound(); return; }
      if (e.code === 'KeyP' || e.code === 'Escape') { if (G.state === 'match') UI.setPaused(!G.paused); return; }
      const k = KEYS[e.code];
      if (!k || G.state !== 'match' || G.paused) return;
      e.preventDefault();
      Sound.init();
      const M = G.M;
      // スタート待ちのときは どのキーでも はじめられる
      if (M && (M.phase === 'ready' || M.phase === 'next' || M.phase === 'intro')) { Game.tap('any'); return; }
      Game.tap(k[0], k[1]);
    });
  }

  return { init };
})();
