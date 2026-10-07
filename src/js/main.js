'use strict';
/* 起動とメインループ(固定ステップで更新、描画は毎フレーム) */

(() => {
  const STEP = 1 / 60;
  const errLog = [];
  let acc = 0; let last = 0;
  const canvas = document.getElementById('game');

  function safe(where, fn) {
    try { fn(); } catch (e) {
      if (errLog.length < 30) errLog.push(where + ': ' + (e && e.stack ? e.stack : e));
      if (where === 'draw') { try { const c = Render.context(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } catch (e2) { /* 無視 */ } }
    }
  }

  function step(dt) {
    G.clock += dt;
    if (G.state === 'match' && !G.paused && !G.manual) Game.step(dt);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    const t = ts / 1000;
    let dt = last ? t - last : STEP;
    last = t;
    dt = Math.min(dt, 0.1);
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) { safe('step', () => step(STEP)); acc -= STEP; n++; }
    if (n >= 6) acc = 0;
    safe('draw', () => Render.draw(G.clock));
  }

  let resizeT = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => Render.resize(), 80); });
  window.addEventListener('orientationchange', () => setTimeout(() => Render.resize(), 200));
  // ほかのアプリに切りかえたら 自動でポーズ(音も止める)
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'match' && !G.paused) UI.setPaused(true); });
  window.addEventListener('blur', () => { if (G.state === 'match' && !G.paused && G.M && G.M.phase !== 'intro') UI.setPaused(true); });

  Render.init(canvas);
  Input.init(canvas);
  UI.init();

  // 動作確認用: URL に ?debug を付けると コンソールから 状態を さわれる
  if (/[?&]debug/.test(location.search)) window.__janken = { G, CONFIG, Rules, Game, Render, UI, FX, Sound, step, errLog };
  requestAnimationFrame(loop);
})();
