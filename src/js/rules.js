'use strict';
/* じゃんけん・ダメージ・コンピューターの考え方(DOM なし。tests/ でテストする)
   手: 0 = グー、1 = チョキ、2 = パー */

const Rules = (() => {
  const HAND_NAMES = ['グー', 'チョキ', 'パー'];

  // 'p' = 自分の勝ち、'c' = 相手の勝ち、'draw' = あいこ。自分が出さなかった(null)ら あいこ
  function judge(p, c) {
    if (p == null || c == null || p === c) return 'draw';
    return (p + 1) % 3 === c ? 'p' : 'c';
  }
  // h に勝つ手
  const beats = (h) => (h + 2) % 3;

  // れんしょう倍率: 1勝目 1.0 → 2れんしょう 1.12 → … 上限あり
  function streakMul(streak) {
    return Math.min(CONFIG.streakMax, 1 + Math.max(0, streak - 1) * CONFIG.streakStep);
  }

  // ダメージ。armor を渡したら ガードされた(ぶきの pierce ぶんは ぼうぐの上から ひびく)
  function damage(weapon, armor, mul) {
    let d = weapon.power * (mul || 1);
    if (armor) d *= 1 - armor.block * (1 - weapon.pierce);
    return Math.max(1, Math.round(d));
  }

  // 当たった瞬間に ぼうぐが かぶり終わっていれば ガード。ぎりぎりなら 'tight'
  function strikeOutcome(strikeAt, guardAt) {
    if (guardAt == null || guardAt > strikeAt + 1e-9) return 'clean';
    return strikeAt - guardAt < CONFIG.tightGuard ? 'tight' : 'guard';
  }

  function oppHp(stageIdx, diff) {
    return Math.round(CONFIG.stages[stageIdx].hp * diff.oppHp);
  }

  // こちらが よく出す手(最近 6回)。3回未満なら null
  function favoriteOf(history) {
    const recent = history.slice(-6);
    if (recent.length < 3) return null;
    const n = [0, 0, 0];
    for (const h of recent) n[h]++;
    const max = Math.max(n[0], n[1], n[2]);
    if (max < 2) return null;
    const tops = [0, 1, 2].filter((h) => n[h] === max);
    return tops.length === 1 ? tops[0] : recent[recent.length - 1];
  }

  // コンピューターの手。クセ(すきな手)があり、強い相手ほど こちらのクセを読む
  function cpuHand(rng, lvl, fav, history, readMul) {
    const f = favoriteOf(history || []);
    if (f != null && rng() < lvl.read * (readMul == null ? 1 : readMul)) return beats(f);
    const r = rng();
    if (r < lvl.fav) return fav;
    const others = [0, 1, 2].filter((h) => h !== fav);
    return others[r < lvl.fav + (1 - lvl.fav) / 2 ? 0 : 1];
  }

  // コンピューターが じゃんけんの後に どのボタンを いつ押すか
  //  role: 'attack'(勝った)/ 'guard'(負けた)。たまに 押しまちがい・もたつき
  function cpuPlan(rng, lvl, diff, role) {
    let at = lvl.react * diff.cpuReact + lvl.jitter * rng.gauss();
    at = Math.max(0.2, at);
    const right = role === 'attack' ? 'weapon' : 'armor';
    const wrong = role === 'attack' ? 'armor' : 'weapon';
    if (rng() < lvl.mistake * diff.cpuMistake) return { at, btn: wrong, mistake: true };
    if (rng() < lvl.hesitate * diff.cpuMistake) at += 0.25 + rng() * 0.3;
    return { at, btn: right, mistake: false };
  }

  /* 1ラウンドの「たたく・かぶる」の決着(テストとバランス確認用。ゲーム本体は同じ考え方を時間にそって進める)
     a = たたく側 { press: 押した時刻|null, btn, weapon, speed }  d = まもる側 { press, btn, armor, speed }
     返り値: { kind: 'clean'|'guard'|'tight'|'miss'|'timeout', dmg } */
  function resolveRound(a, d, window, mul) {
    if (a.press == null || a.press > window) return { kind: 'timeout', dmg: 0 };
    if (a.btn !== 'weapon') return { kind: 'miss', dmg: 0 };
    const strikeAt = a.press + a.weapon.swing * (a.speed || 1);
    const guardAt = d.press != null && d.btn === 'armor' ? d.press + d.armor.don * (d.speed || 1) : null;
    const kind = strikeOutcome(strikeAt, guardAt);
    return { kind, dmg: damage(a.weapon, kind === 'clean' ? null : d.armor, mul) };
  }

  /* 1ステージを まるごと試合する(バランス確認用)
     player: { weapon, armor, react: 平均の反応(秒), jitter, justRate, hand: (rng, history) => 手 } */
  function simulateMatch(rng, stageIdx, diff, player) {
    const st = CONFIG.stages[stageIdx];
    const lvl = CONFIG.cpuLevels[st.lv];
    const cw = CONFIG.weapons[st.weapon];
    const ca = CONFIG.armors[st.armor];
    let php = CONFIG.playerHp;
    let chp = oppHp(stageIdx, diff);
    const history = [];
    let throws = 0; let rounds = 0; let pStreak = 0; let cStreak = 0;
    const stats = { clean: 0, guard: 0, taken: 0, dealt: 0 };
    while (php > 0 && chp > 0 && throws < 400) {
      throws++;
      const ph = player.hand(rng, history);
      const ch = cpuHand(rng, lvl, st.fav, history, diff.read);
      history.push(ph);
      const w = judge(ph, ch);
      if (w === 'draw') continue;
      rounds++;
      const just = rng() < (player.justRate || 0);
      const pPress = Math.max(0.18, player.react + (player.jitter || 0.08) * rng.gauss());
      const sp = just ? CONFIG.justSpeed : 1;
      if (w === 'p') {
        pStreak++; cStreak = 0;
        const plan = cpuPlan(rng, lvl, diff, 'guard');
        const r = resolveRound({ press: pPress, btn: 'weapon', weapon: player.weapon, speed: sp }, { press: plan.at, btn: plan.btn, armor: ca }, diff.window, streakMul(pStreak));
        chp -= r.dmg; stats.dealt += r.dmg;
        if (r.kind === 'clean') stats.clean++; else if (r.dmg) stats.guard++;
      } else {
        cStreak++; pStreak = 0;
        const plan = cpuPlan(rng, lvl, diff, 'attack');
        const r = resolveRound({ press: plan.at, btn: plan.btn, weapon: cw }, { press: pPress, btn: 'armor', armor: player.armor, speed: sp }, diff.window, streakMul(cStreak) * diff.dmgTaken);
        php -= r.dmg; stats.taken += r.dmg;
      }
    }
    return { win: chp <= 0, php, chp, throws, rounds, stats };
  }

  return { HAND_NAMES, judge, beats, streakMul, damage, strikeOutcome, oppHp, favoriteOf, cpuHand, cpuPlan, resolveRound, simulateMatch };
})();
