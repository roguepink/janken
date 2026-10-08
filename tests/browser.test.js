'use strict';
/* NODE_PATH=$(npm root -g) node tests/browser.test.js
   プリインストールの Chromium(Playwright)で index.html を開いて確かめる:
   1) スマホ画面: メニューを タップで進み、本物のタップで じゃんけん → たたく / かぶる → KO → けっか画面
   2) 全10ステージ × 男女を ボットで 早送りで通しプレイ(例外が出ない・決着がつく・描画も こわれない)
   3) PC: キーボードだけで 1ラウンド
   4) こわれた保存データ・ボタンのはしのタップ・K.O. 中のポーズ */
const path = require('path');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html') + '?debug';
let ok = true;
const check = (name, cond, extra) => { console.log((cond ? '  ok  ' : '  NG  ') + name + (extra ? '  ' + extra : '')); if (!cond) ok = false; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(p, cond, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 8000)) {
    if (await p.evaluate(cond)) return true;
    await sleep(15);
  }
  return false;
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });

  /* ---------- 1) スマホ: 本物のタップ ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(URL); await sleep(400);
    await p.tap('#btnPlay', { force: true });
    for (let i = 0; i < 5; i++) { await sleep(120); await p.tap('#btnNext', { force: true }); }
    await sleep(150);
    check('メニューを タップで進むと 試合が はじまる', await p.evaluate(() => window.__janken.G.state === 'match'));
    const tapAt = async (lx, ly) => { const s = await p.evaluate(([x, y]) => window.__janken.Render.toScreen(x, y), [lx, ly]); await p.touchscreen.tap(s.x, s.y); };
    const L = await p.evaluate(() => window.__janken.Render.layout());
    await tapAt(L.cx, L.VH / 2); // 会場の紹介を スキップ
    check('会場を見せてから「タップで スタート」になる', await waitFor(p, () => window.__janken.G.M.phase === 'ready', 5000));
    const playRound = async (cpu, mine) => {
      await p.evaluate((h) => { window.__janken.Rules.cpuHand = () => h; }, cpu);
      await waitFor(p, () => ['ready', 'next'].includes(window.__janken.G.M.phase), 8000);
      await tapAt(L.cx, L.callY);
      await waitFor(p, () => { const M = window.__janken.G.M; return M.phase === 'call' && M.t >= M.ponAt - 0.06; }, 4000);
      const bp = await p.evaluate((i) => window.__janken.Render.handBtnPos(i), mine);
      await tapAt(bp.x, bp.y);
      return waitFor(p, () => window.__janken.G.M.phase === 'action', 2000);
    };
    // かって たたく
    check('グー・チョキ・パーを タップで出せる', await playRound(0, 2));
    const hp0 = await p.evaluate(() => window.__janken.G.M.hp.c);
    await tapAt(L.weaponBtn.x + L.weaponBtn.w / 2, L.weaponBtn.y + L.weaponBtn.h / 2);
    await waitFor(p, () => window.__janken.G.M.phase !== 'action', 3000);
    const r1 = await p.evaluate(() => ({ hp: window.__janken.G.M.hp.c, out: window.__janken.G.M.outcome }));
    check('かったら 右の「たたく」で 相手の HP が へる', r1.hp < hp0, JSON.stringify(r1));
    // まけて かぶる
    await playRound(2, 0);
    await tapAt(L.armorBtn.x + L.armorBtn.w / 2, L.armorBtn.y + L.armorBtn.h / 2);
    await waitFor(p, () => window.__janken.G.M.phase !== 'action', 3000);
    const r2 = await p.evaluate(() => ({ guards: window.__janken.G.M.stats.guards, taken: window.__janken.G.M.stats.taken, out: window.__janken.G.M.outcome }));
    check('まけたら 左の「かぶる」で ガードできる', r2.guards === 1 || (r2.out && r2.out.kind === 'timeout'), JSON.stringify(r2));
    // 反対を押すと おてつき
    await playRound(2, 0);
    await tapAt(L.weaponBtn.x + L.weaponBtn.w / 2, L.weaponBtn.y + L.weaponBtn.h / 2);
    check('まけたのに「たたく」を押すと おてつき', await waitFor(p, () => window.__janken.G.M.stats.otetsuki === 1, 2000));
    // とどめ → KO → けっか
    await waitFor(p, () => ['next', 'ready'].includes(window.__janken.G.M.phase), 6000);
    await p.evaluate(() => { window.__janken.G.M.hp.c = 1; });
    await playRound(1, 0);
    await tapAt(L.weaponBtn.x + L.weaponBtn.w / 2, L.weaponBtn.y + L.weaponBtn.h / 2);
    check('HP が 0 で K.O.', await waitFor(p, () => window.__janken.G.M.phase === 'ko', 4000));
    check('けっか画面が出る', await waitFor(p, () => !document.getElementById('result').classList.contains('hidden'), 6000));
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('tataite_save')).cleared.normal);
    check('クリアが 保存され、次のステージが えらべる', saved === 1);
    await p.tap('#btnResMain', { force: true }); await sleep(200);
    check('「つぎの ステージへ」で ステージ2', await p.evaluate(() => window.__janken.G.M && window.__janken.G.M.stage === 1));
    // ポーズ
    await p.tap('#btnPause', { force: true }); await sleep(100);
    const t1 = await p.evaluate(() => window.__janken.G.M.time); await sleep(400);
    const t2 = await p.evaluate(() => window.__janken.G.M.time);
    check('ポーズ中は 時間が止まる', t1 === t2 && await p.evaluate(() => !document.getElementById('pause').classList.contains('hidden')));
    await p.tap('#btnResume', { force: true }); await sleep(300);
    check('つづけるで 再開', await p.evaluate(() => !window.__janken.G.paused));
    check('スマホ: エラーなし', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  /* ---------- 2) ボットで 全ステージ × 男女 ---------- */
  {
    const p = await b.newPage({ viewport: { width: 720, height: 900 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(URL); await sleep(300);
    const res = await p.evaluate(() => {
      const J = window.__janken; const G = J.G;
      G.manual = true;
      const out = [];
      for (const g of ['m', 'f']) for (let s = 0; s < 10; s++) {
        Object.assign(G.settings, { gender: g, weapon: (s * 3) % 5, armor: (s * 2 + 1) % 5, diff: ['easy', 'normal', 'hard'][s % 3] });
        J.UI.startStage(s);
        let steps = 0; let react = 0; let drew = 0;
        while (G.state === 'match' && steps < 60 * 400) {
          const M = G.M;
          if (M.phase === 'intro' && M.t > 0.5) J.Game.tap('any');
          if (M.phase === 'ready' || (M.phase === 'next' && M.t > 0.3)) J.Game.tap('any');
          if (M.phase === 'call' && M.pHand == null && M.t >= M.ponAt - 0.04 + (steps % 7) * 0.01) J.Game.tap('hand', (steps >> 3) % 3);
          if (M.phase === 'action') {
            if (M.act.t < 0.01) react = 0.35 + ((steps * 7919) % 100) / 300;
            if (M.act.t >= react && !M.act.press.p) J.Game.tap(M.act.winner === 'p' ? 'weapon' : 'armor');
          }
          G.clock += 1 / 60; J.Game.step(1 / 60); steps++;
          if (steps % 9 === 0) { J.Render.draw(G.clock); drew++; }
          if (![M.hp.p, M.hp.c, M.time].every(Number.isFinite)) return { nan: true, g, s };
        }
        out.push({ g, s, state: G.state, sec: Math.round(steps / 60), win: G.M.koSide === 'c', throws: G.M.stats.throws, drew });
        J.UI.showTitle();
        J.Render.draw(G.clock);
      }
      return { out, err: J.errLog };
    });
    const all = res.out || [];
    check('全10ステージ × 男女で 決着がつき けっか画面へ', !res.nan && all.length === 20 && all.every((r) => r.state === 'result'), all.map((r) => r.g + (r.s + 1) + (r.win ? 'W' : 'L') + r.sec + 's').join(' '));
    check('ボット: エラーなし', errs.length === 0 && res.err.length === 0, errs.concat(res.err).join(' | '));
    await p.close();
  }

  /* ---------- 3) PC: キーボード ---------- */
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL); await sleep(300);
    await p.evaluate(() => { const J = window.__janken; J.G.settings.diff = 'easy'; J.UI.startStage(0); J.Rules.cpuHand = () => 1; });
    await p.keyboard.press('Space');
    await waitFor(p, () => window.__janken.G.M.phase === 'ready', 5000);
    await p.keyboard.press('Space');
    await waitFor(p, () => { const M = window.__janken.G.M; return M.phase === 'call' && M.t >= M.ponAt - 0.05; }, 4000);
    await p.keyboard.press('Digit1');
    await waitFor(p, () => window.__janken.G.M.phase === 'action', 2000);
    const hp0 = await p.evaluate(() => window.__janken.G.M.hp.c);
    await p.keyboard.press('ArrowRight');
    await waitFor(p, () => window.__janken.G.M.phase !== 'action', 3000);
    check('PC: 1(グー)と →(たたく)で 遊べる', (await p.evaluate(() => window.__janken.G.M.hp.c)) < hp0);
    check('PC: エラーなし', errs.length === 0, errs.join(' | '));
    await p.close();
  }

  /* ---------- 4) こわれた保存・ボタンのはし・K.O. 中のポーズ ---------- */
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem('tataite_save', JSON.stringify({ settings: { diff: 'constructor', weapon: 99 }, stars: { normal: { 0: -1, 3: 'x' }, hard: 5 } })); } catch (e) { /* 無視 */ } });
    await p.goto(URL); await sleep(300);
    const r = await p.evaluate(() => {
      const J = window.__janken; const out = {};
      out.diff = J.G.settings.diff; out.weapon = J.G.settings.weapon;
      J.UI.showSetup(4);
      out.cards = document.querySelectorAll('#stepBody .stage-choice').length;
      J.G.manual = true; J.UI.startStage(0);
      const M = J.G.M; M.phase = 'call';
      const b1 = J.Render.handBtnPos(1);
      out.left = J.Render.hitTest(b1.x - (b1.r + 4), b1.y).value;
      out.right = J.Render.hitTest(b1.x + (b1.r + 4), b1.y).value;
      M.phase = 'ko'; J.UI.setPaused(true); out.koPaused = J.G.paused;
      J.UI.showTitle();
      return out;
    });
    check('こわれた保存データでも メニューが出る', r.diff === 'normal' && r.weapon === 4 && r.cards === 10, JSON.stringify(r));
    check('じゃんけんボタンの はしを押しても となりに ならない', r.left === 1 && r.right === 1);
    check('K.O. の演出中は ポーズしない(勝ちが 記録される)', r.koPaused === false);
    check('エラーなし', errs.length === 0, errs.join(' | '));
    await p.close();
  }

  await b.close();
  if (!ok) { console.error('\nブラウザのテスト 失敗'); process.exit(1); }
  console.log('\nブラウザのテスト 通過');
})();
