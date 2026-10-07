'use strict';
/* 試合の進み方。
   intro(会場) → ready(タップで開始) → call(じゃん・けん・ぽん) → action(たたく・かぶる) → after(結果の演出)
   → next(次のじゃんけん) … どちらかの HP が 0 → ko → 結果画面 */

const G = {
  state: 'title', // 'title' | 'menu' | 'match' | 'result'
  paused: false,
  clock: 0,
  hitStop: 0,
  slow: 0,
  settings: { diff: 'normal', gender: 'm', weapon: 2, armor: 2 },
  M: null,
  rng: makeRng((Date.now() ^ 0x5bd1e995) >>> 0),
  onMatchEnd: null,
};

const Game = (() => {
  const INTRO = 2.7; // 会場を見せる時間
  const other = (s) => (s === 'p' ? 'c' : 'p');

  function newMatch(stageIdx) {
    const st = CONFIG.stages[stageIdx];
    const diff = CONFIG.diffs[G.settings.diff];
    const g = G.settings.gender;
    const chp = Rules.oppHp(stageIdx, diff);
    G.M = {
      stage: stageIdx, st, diff, lvl: CONFIG.cpuLevels[st.lv],
      opp: { info: st[g], look: LOOKS[stageIdx][g], weapon: CONFIG.weapons[st.weapon], armor: CONFIG.armors[st.armor] },
      you: { weapon: CONFIG.weapons[G.settings.weapon], armor: CONFIG.armors[G.settings.armor], gender: g },
      hp: { p: CONFIG.playerHp, c: chp }, hpMax: { p: CONFIG.playerHp, c: chp }, hpShow: { p: CONFIG.playerHp, c: chp },
      phase: 'intro', t: 0, time: 0, introSkip: false,
      callType: 'jan', beats: [], ponAt: 0, beatDone: 0,
      pHand: null, cHand: null, tapAt: null, just: false, judge: null, late: false,
      act: null, outcome: null, afterDur: 0,
      streak: { p: 0, c: 0 },
      history: [],
      stats: { throws: 0, wins: 0, losses: 0, aiko: 0, clean: 0, guards: 0, tight: 0, taken: 0, dealt: 0, just: 0, maxStreak: 0, otetsuki: 0, cleanTaken: 0, timeouts: 0 },
      koSide: null,
      v: {
        oppExpr: 'normal', exprT: 0, blinkT: 2, blink: false,
        oppSquash: 0, oppSquashV: 0, oppTank: 0, oppSweat: false, oppShakeX: 0, oppFall: 0,
        oppArmorK: -1, oppArmorDur: 0.2, oppArmorWob: 0,
        youSquash: 0, youSquashV: 0, youTank: 0, youArmorK: -1, youArmorDur: 0.2, youArmorWob: 0,
        strike: null, speech: null, prompt: null, otetsuki: null, revealT: 0, handSel: null,
        hpFlash: { p: 0, c: 0 }, koT: 0,
      },
    };
    G.state = 'match';
    G.hitStop = 0; G.slow = 0;
    FX.clear();
    Sound.sfx.crowd(st.crowd, 2.4);
    return G.M;
  }

  function say(text, life) { G.M.v.speech = { text, t: 0, life: life || 1.8 }; }
  function sayLine(kind) {
    const M = G.M;
    const arr = CONFIG.lines[kind] && CONFIG.lines[kind][M.st.lv];
    if (arr) say(arr[Math.floor(G.rng() * arr.length)]);
  }
  function setExpr(e, dur) { G.M.v.oppExpr = e; G.M.v.exprT = dur || 0; }

  /* ---------- じゃんけん ---------- */
  function startCall(type) {
    const M = G.M;
    M.callType = type;
    const beat = M.diff.beat;
    M.beats = type === 'aiko' ? [0, beat * 1.35] : [0, beat, beat * 2];
    M.ponAt = M.beats[M.beats.length - 1];
    M.beatDone = 0;
    M.pHand = null; M.cHand = null; M.tapAt = null; M.just = false; M.judge = null; M.late = false;
    M.act = null; M.outcome = null;
    const v = M.v;
    v.handSel = null; v.prompt = null; v.otetsuki = null; v.strike = null;
    // かぶっていた ぼうぐを はずす
    v.oppArmorK = -1; v.youArmorK = -1;
    if (type === 'jan') { v.oppTank = Math.max(0, v.oppTank - 0.5); v.youTank = Math.max(0, v.youTank - 0.5); }
    if (v.exprT <= 0) setExpr('normal');
    v.oppSweat = false;
    M.phase = 'call'; M.t = 0;
  }

  function chooseHand(h) {
    const M = G.M;
    if (!M || M.phase !== 'call' || M.pHand != null) return false;
    if (M.t > M.ponAt + M.diff.grace) return false;
    M.pHand = h; M.tapAt = M.t;
    M.v.handSel = { h, t: 0 };
    M.just = Math.abs(M.t - M.ponAt) <= M.diff.just;
    Sound.sfx.select();
    if (M.t >= M.ponAt) reveal();
    return true;
  }

  function reveal() {
    const M = G.M;
    M.cHand = Rules.cpuHand(G.rng, M.lvl, M.st.fav, M.history, M.diff.read);
    M.stats.throws++;
    if (M.pHand != null) M.history.push(M.pHand);
    M.judge = Rules.judge(M.pHand, M.cHand);
    M.late = M.pHand == null;
    M.v.revealT = 0;
    Sound.sfx.reveal();
    if (M.just && M.judge !== 'draw') {
      M.stats.just++; Sound.sfx.just();
      const L = Render.layout();
      FX.popup('ジャスト!', L.cx - 150, L.handBtnY + 10, { size: 70, fill: ['#fffbe0', '#ffc400'], rot: -0.12, life: 1.1 });
      FX.popup('はやさ UP', L.cx - 150, L.handBtnY + 76, { size: 40, fill: '#ffe680', life: 1.1, delay: 0.08 });
    }
    if (M.judge === 'draw') {
      M.stats.aiko++;
      M.phase = 'aiko'; M.t = 0;
      Sound.sfx.aiko();
      return;
    }
    const w = M.judge; const l = other(w);
    M.streak[w]++; M.streak[l] = 0;
    if (w === 'p') { M.stats.wins++; M.stats.maxStreak = Math.max(M.stats.maxStreak, M.streak.p); Sound.sfx.win(); setExpr('panic', 2); M.v.oppSweat = true; }
    else { M.stats.losses++; Sound.sfx.lose(); setExpr('grin', 2); }
    const plan = Rules.cpuPlan(G.rng, M.lvl, M.diff, w === 'c' ? 'attack' : 'guard');
    M.act = { t: 0, winner: w, loser: l, press: { p: null, c: null }, guardAt: { p: null, c: null }, strikeAt: null, plan, speed: M.just ? CONFIG.justSpeed : 1, done: false };
    M.v.prompt = { side: w === 'p' ? 'weapon' : 'armor', t: 0 };
    M.phase = 'action'; M.t = 0;
  }

  /* ---------- たたく・かぶる ---------- */
  function press(side, btn) {
    const M = G.M;
    if (!M || M.phase !== 'action') return false;
    const a = M.act;
    if (a.press[side] || a.done) return false;
    a.press[side] = { btn, t: a.t };
    const isWinner = a.winner === side;
    const sp = side === 'p' ? a.speed : 1;
    const v = M.v;
    if (btn === 'weapon') {
      if (isWinner) {
        const w = side === 'p' ? M.you.weapon : M.opp.weapon;
        a.strikeAt = a.t + w.swing * sp;
        v.strike = { who: side, id: w.id, t: 0, dur: w.swing * sp, hit: false, kind: null, after: 0 };
        Sound.sfx.whoosh(w.power >= 33);
      } else otetsuki(side);
    } else {
      const ar = side === 'p' ? M.you.armor : M.opp.armor;
      a.guardAt[side] = a.t + ar.don * sp;
      if (side === 'p') { v.youArmorK = 0; v.youArmorDur = ar.don * sp; } else { v.oppArmorK = 0; v.oppArmorDur = ar.don * sp; }
      Sound.sfx.don();
      if (isWinner) otetsuki(side);
    }
    return true;
  }

  function otetsuki(side) {
    const M = G.M;
    M.v.otetsuki = { side, t: 0 };
    const L = Render.layout();
    if (side === 'p') FX.popup('おてつき!', L.cx, L.btnY - 70, { size: 90, fill: ['#ffffff', '#ff5a5a'], life: 1.0, shake: 10 });
    else { FX.popup('おてつき!', L.cx, L.oppHeadY - 150, { size: 80, fill: ['#ffffff', '#ff5a5a'], life: 1.0, shake: 10 }); say('しまった!'); }
    Sound.sfx.otetsuki();
    if (side === 'p') M.stats.otetsuki++;
    // 勝った側が まちがえたら、このラウンドは おしまい
    if (side === M.act.winner) finish({ kind: 'miss', side }, 1.0);
  }

  function impact() {
    const M = G.M; const a = M.act; const v = M.v;
    const att = a.winner; const def = a.loser;
    const w = att === 'p' ? M.you.weapon : M.opp.weapon;
    const ar = def === 'p' ? M.you.armor : M.opp.armor;
    const kind = Rules.strikeOutcome(a.strikeAt, a.guardAt[def]);
    const mul = Rules.streakMul(M.streak[att]) * (att === 'c' ? M.diff.dmgTaken : 1);
    const dmg = Rules.damage(w, kind === 'clean' ? null : ar, mul);
    M.hp[def] = Math.max(0, M.hp[def] - dmg);
    v.hpFlash[def] = 1;
    if (v.strike) { v.strike.hit = true; v.strike.kind = kind; }
    const heavy = w.power >= 33;
    const L = Render.layout();
    if (def === 'c') {
      M.stats.dealt += dmg;
      const hx = L.cx; const hy = L.oppHeadY - 70;
      if (kind === 'clean') {
        M.stats.clean++;
        v.oppSquash = 0.14 + w.power * 0.0035; v.oppSquashV = 0; v.oppTank = 1; setExpr('hurt', 1.1);
        FX.stars(hx, hy, 10 + Math.round(w.power / 3)); FX.speedLines(hx, hy + 40, 'rgba(255,255,255,0.9)', 0.32);
        FX.ring(hx, hy, '#ffe14d', 30, 320, 0.35, 22);
        FX.shake(10 + w.power * 0.5); FX.flash(0.35); FX.zoomPunch(0.05 + w.power * 0.0015, hx, hy);
        FX.popup(w.word, hx + 120, hy + 70, { size: wordSize(w), fill: ['#fff7a8', '#ffb300'], rot: -0.18, life: 0.9, shake: 14 });
        FX.popup('-' + dmg, hx - 170, hy + 40, { size: 104, fill: ['#ffffff', '#ff6b6b'], life: 1.0, rise: 70 });
        if (M.streak.p >= 2) FX.popup(M.streak.p + 'れんしょう!', hx, hy + 210, { size: 56, fill: ['#fff', '#ff9a3d'], life: 1.1, rise: 40, delay: 0.12 });
        if (a.guardAt.c != null) FX.popup('かぶるのが おそい!', hx, hy - 150, { size: 44, fill: '#ffd0d0', life: 1.0, rise: 20, delay: 0.1 });
        G.hitStop = 0.07 + w.power * 0.0025;
        Sound.sfx.hit(w.id); Sound.sfx.crowd(M.st.crowd * 0.8 + 0.2, 1.2);
        sayLine('hurt');
      } else {
        v.oppSquash = 0.05 + w.pierce * 0.2; v.oppSquashV = 0; v.oppArmorWob = 0.3; setExpr('guard', 0.8);
        FX.sparks(hx, hy - 30, 16, '#fff6b0'); FX.ring(hx, hy - 20, '#9fe8ff', 30, 230, 0.3, 14);
        FX.shake(5 + w.power * 0.25 * (heavy ? 1.6 : 1));
        FX.popup(heavy ? 'ズシン!' : 'ガキッ!', hx + 130, hy + 60, { size: 80, fill: ['#e6f4ff', '#7cc8ff'], rot: -0.15, life: 0.8 });
        FX.popup('-' + dmg, hx - 170, hy + 40, { size: 84, fill: ['#ffffff', '#ffb36b'], life: 0.95, rise: 70 });
        if (heavy) FX.popup('ガードの上から ひびく!', hx, hy + 200, { size: 44, fill: '#ffd36b', life: 1.1, rise: 30 });
        G.hitStop = 0.05;
        Sound.sfx.guard(ar.id); if (heavy) Sound.sfx.hit(w.id, 0.6);
        sayLine('guard');
      }
    } else {
      M.stats.taken += dmg;
      const hx = L.cx; const hy = L.youHeadY - 90;
      if (kind === 'clean') {
        M.stats.cleanTaken++;
        v.youSquash = 0.12 + w.power * 0.0035; v.youSquashV = 0; v.youTank = 1;
        FX.stars(hx, hy, 12); FX.shake(16 + w.power * 0.5); FX.hurtRed(0.9); FX.flash(0.25, '#ff3b3b');
        FX.popup(w.word, hx - 90, hy - 190, { size: wordSize(w), fill: ['#ffe0e0', '#ff4d4d'], rot: 0.12, life: 0.9, shake: 16 });
        FX.popup('-' + dmg, hx + 200, hy - 40, { size: 100, fill: ['#ffffff', '#ff4d4d'], life: 1.0, rise: 80 });
        if (a.guardAt.p != null) FX.popup('かぶるのが おそかった!', hx, hy - 300, { size: 46, fill: '#ffd0d0', life: 1.1, rise: 20, delay: 0.1 });
        G.hitStop = 0.08 + w.power * 0.0025;
        Sound.sfx.hit(w.id); Sound.sfx.vibrate(80 + w.power * 3);
        setExpr('laugh', 1.2); sayLine('hit');
      } else {
        M.stats.guards++;
        const tight = kind === 'tight';
        if (tight) M.stats.tight++;
        v.youSquash = 0.04 + w.pierce * 0.18; v.youSquashV = 0; v.youArmorWob = 0.35;
        FX.sparks(hx, hy - 40, 26, '#fff6b0'); FX.ring(hx, hy - 30, '#7cd4ff', 40, 360, 0.4, 26); FX.ring(hx, hy - 30, '#ffffff', 20, 200, 0.25, 12);
        FX.guardBlue(0.7); FX.shake(5 + w.power * 0.15); FX.flash(0.15, '#9fe8ff');
        FX.popup(tight ? 'ギリギリ ガード!!' : 'ガード!', hx, hy - 230, { size: tight ? 84 : 100, fill: ['#ffffff', '#4fc3ff'], outer: tight ? '#ffe14d' : null, life: 1.1, rise: 40 });
        FX.popup('-' + dmg, hx + 190, hy - 40, { size: 72, fill: ['#ffffff', '#b8d6ff'], life: 0.9, rise: 70 });
        G.hitStop = 0.05;
        Sound.sfx.guard(ar.id); if (tight) Sound.sfx.tight();
        setExpr('panic', 0.9);
      }
    }
    finish({ kind, dmg, att }, kind === 'clean' ? 1.15 : 1.0);
  }

  // 書き文字の大きさ(おもい ぶきほど 大きいが、画面から はみ出さない)
  const wordSize = (w) => Math.min(118, (80 + w.power * 0.9) * Math.min(1, 5 / Math.max(1, w.word.length - 1)));

  function finish(outcome, dur) {
    const M = G.M;
    if (M.act) M.act.done = true;
    M.outcome = outcome;
    M.phase = 'after'; M.t = 0; M.afterDur = dur;
  }

  function timeout() {
    const M = G.M; const L = Render.layout();
    if (M.act.winner === 'p') { M.stats.timeouts++; FX.popup('おそい!', L.cx, L.callY, { size: 100, fill: ['#fff', '#aab4c8'], life: 0.9 }); }
    else { setExpr('panic', 0.9); FX.popup('セーフ!', L.cx, L.youHeadY - 220, { size: 96, fill: ['#ffffff', '#7cd4ff'], life: 0.9 }); say('あ、あれ? 手が…'); }
    Sound.sfx.timeout();
    finish({ kind: 'timeout' }, 0.9);
  }

  function startKo(side) {
    const M = G.M; const v = M.v; const L = Render.layout();
    M.koSide = side; M.phase = 'ko'; M.t = 0; v.koT = 0;
    G.slow = 0.7;
    Sound.stopBgm();
    Sound.sfx.ko(); Sound.sfx.bell(3);
    if (side === 'c') {
      setExpr('ko', 99); v.oppSweat = false;
      FX.confetti(L.cx, L.VH * 0.75, 90, L.VW * 0.8);
      Sound.sfx.crowd(1, 3); Sound.sfx.vibrate(200);
      say(M.opp.info.ko, 3);
    } else {
      setExpr('laugh', 99);
      Sound.sfx.vibrate([120, 60, 200]);
    }
  }

  /* ---------- 1フレームの更新 ---------- */
  function step(dt) {
    const M = G.M;
    if (!M || G.state !== 'match') return;
    let gdt = dt;
    if (G.slow > 0) { G.slow -= dt; gdt = dt * 0.35; }
    FX.update(dt);
    updateVis(dt);
    if (G.hitStop > 0) { G.hitStop -= dt; return; }
    M.t += gdt; M.time += gdt;
    if (M.phase === 'intro') {
      if (M.t >= INTRO) { M.phase = 'ready'; M.t = 0; FX.flash(0.9); Sound.sfx.bell(1); Sound.startBgm(M.st.lv * 2); say(M.opp.info.intro, 2.6); }
    } else if (M.phase === 'call') {
      while (M.beatDone < M.beats.length && M.t >= M.beats[M.beatDone]) {
        const last = M.beatDone === M.beats.length - 1;
        if (last) Sound.sfx.pon(); else Sound.sfx.drum(M.beatDone);
        M.beatDone++;
      }
      if (M.pHand != null && M.t >= M.ponAt) reveal();
      else if (M.pHand == null && M.t > M.ponAt + M.diff.grace) reveal();
    } else if (M.phase === 'aiko') {
      if (M.t >= (M.late ? 0.95 : 0.75)) startCall('aiko');
    } else if (M.phase === 'action') {
      const a = M.act;
      a.t += gdt;
      M.v.prompt && (M.v.prompt.t += gdt);
      const side = 'c';
      if (!a.press[side] && a.t >= a.plan.at) press(side, a.plan.btn);
      if (M.phase !== 'action') return;
      if (a.strikeAt != null && a.t >= a.strikeAt) impact();
      else if (a.strikeAt == null && a.t >= M.diff.window) timeout();
    } else if (M.phase === 'after') {
      if (M.t >= M.afterDur) {
        if (M.hp.c <= 0) startKo('c');
        else if (M.hp.p <= 0) startKo('p');
        else { M.phase = 'next'; M.t = 0; }
      }
    } else if (M.phase === 'next') {
      if (M.t >= 1.5) startCall('jan');
    } else if (M.phase === 'ko') {
      if (M.t >= 2.6) {
        G.state = 'result';
        if (G.onMatchEnd) G.onMatchEnd({ win: M.koSide === 'c', stage: M.stage, stats: M.stats, hp: M.hp, hpMax: M.hpMax, time: M.time });
      }
    }
  }

  function updateVis(dt) {
    const M = G.M; const v = M.v;
    // ばね(つぶれて もどる)
    const spring = (key, keyV) => {
      v[keyV] += (-v[key] * 220 - v[keyV] * 14) * dt;
      v[key] += v[keyV] * dt;
    };
    spring('oppSquash', 'oppSquashV'); spring('youSquash', 'youSquashV');
    v.oppArmorWob *= Math.pow(0.02, dt); v.youArmorWob *= Math.pow(0.02, dt);
    if (v.oppArmorK >= 0 && v.oppArmorK < 1) v.oppArmorK = Math.min(1, v.oppArmorK + dt / Math.max(0.05, v.oppArmorDur));
    if (v.youArmorK >= 0 && v.youArmorK < 1) v.youArmorK = Math.min(1, v.youArmorK + dt / Math.max(0.05, v.youArmorDur));
    if (v.strike) { v.strike.t += dt; if (v.strike.hit) v.strike.after += dt; }
    if (v.exprT > 0) { v.exprT -= dt; if (v.exprT <= 0 && M.phase !== 'ko') v.oppExpr = 'normal'; }
    v.blinkT -= dt; if (v.blinkT <= 0) { v.blink = !v.blink; v.blinkT = v.blink ? 0.12 : 2 + Math.random() * 2.5; }
    if (v.speech) { v.speech.t += dt; if (v.speech.t > v.speech.life) v.speech = null; }
    if (v.otetsuki) v.otetsuki.t += dt;
    if (v.handSel) v.handSel.t += dt;
    v.revealT += dt;
    if (M.phase === 'ko') { v.koT += dt; }
    for (const s of ['p', 'c']) {
      v.hpFlash[s] = Math.max(0, v.hpFlash[s] - dt * 2.5);
      // HP のバーは 少し おくれて へる(へった量が 見える)
      if (M.hpShow[s] > M.hp[s]) M.hpShow[s] = Math.max(M.hp[s], M.hpShow[s] - dt * (v.hpFlash[s] > 0.5 ? 0 : 60));
    }
  }

  // タップ・キー入力を ゲームの操作に変える
  function tap(kind, value) {
    const M = G.M;
    if (!M || G.state !== 'match' || G.paused) return;
    if (M.phase === 'intro') { if (M.t < INTRO - 0.55) M.t = INTRO - 0.55; return; }
    if (M.phase === 'ready' || M.phase === 'next') { if (kind === 'any' || kind === 'start') { Sound.sfx.tap(); startCall('jan'); } return; }
    if (M.phase === 'call' && kind === 'hand') { chooseHand(value); return; }
    if (M.phase === 'action' && (kind === 'weapon' || kind === 'armor')) press('p', kind);
  }

  return { newMatch, startCall, chooseHand, reveal, press, step, tap, INTRO };
})();
