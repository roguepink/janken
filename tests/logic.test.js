'use strict';
/* node tests/logic.test.js — じゃんけん・ダメージ・コンピューター・バランスの計算を確かめる(ブラウザなし) */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({});
for (const f of ['util', 'config', 'rules']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
const { CONFIG, Rules, makeRng } = vm.runInContext('({ CONFIG, Rules, makeRng })', ctx);

let failed = false;
function test(name, fn) {
  try { fn(); console.log('  ok  ' + name); } catch (e) { failed = true; console.error('  NG  ' + name + '\n      ' + e.message); }
}
const W = CONFIG.weapons; const A = CONFIG.armors;

test('じゃんけんの勝ち負け(グー0 チョキ1 パー2)', () => {
  assert.strictEqual(Rules.judge(0, 1), 'p'); assert.strictEqual(Rules.judge(1, 2), 'p'); assert.strictEqual(Rules.judge(2, 0), 'p');
  assert.strictEqual(Rules.judge(1, 0), 'c'); assert.strictEqual(Rules.judge(2, 1), 'c'); assert.strictEqual(Rules.judge(0, 2), 'c');
  for (let h = 0; h < 3; h++) { assert.strictEqual(Rules.judge(h, h), 'draw'); assert.strictEqual(Rules.judge(Rules.beats(h), h), 'p'); }
  assert.strictEqual(Rules.judge(null, 1), 'draw', '出さなかったら あいこ');
});

test('ぶき: はやいほど よわく、おそいほど つよい(5種類)', () => {
  assert.strictEqual(W.length, 5);
  for (let i = 1; i < W.length; i++) {
    assert.ok(W[i].swing > W[i - 1].swing, W[i].name + ' は前より おそい');
    assert.ok(W[i].power > W[i - 1].power, W[i].name + ' は前より つよい');
    assert.ok(W[i].pierce > W[i - 1].pierce, W[i].name + ' は前より ガードの上から ひびく');
  }
});

test('ぼうぐ: はやいほど いたく、おそいほど かたい(5種類)', () => {
  assert.strictEqual(A.length, 5);
  for (let i = 1; i < A.length; i++) {
    assert.ok(A[i].don > A[i - 1].don, A[i].name + ' は前より かぶるのが おそい');
    assert.ok(A[i].block > A[i - 1].block, A[i].name + ' は前より かたい');
  }
  for (const a of A) assert.ok(a.block < 1, a.name + ' でも 少しは ダメージが とおる');
});

test('ダメージ: ガードされても 必ず 1以上。強いぶきは かたい ぼうぐの上からも 大きく ひびく', () => {
  for (const w of W) {
    assert.strictEqual(Rules.damage(w, null), w.power);
    for (const a of A) {
      const d = Rules.damage(w, a);
      assert.ok(d >= 1 && d < w.power, w.name + ' × ' + a.name + ' = ' + d);
    }
  }
  const strongest = Rules.damage(W[4], A[4]); const weakest = Rules.damage(W[0], A[4]);
  assert.ok(strongest >= 20, '100tハンマーは 騎士のかぶとの上からでも ' + strongest);
  assert.ok(strongest > weakest * 8, 'ピコハンより ずっと ひびく');
  // じゃんけんに 勝ち続ければ、相手が 毎回ガードしても 最後のステージの相手を たおせる
  const hp = Rules.oppHp(9, CONFIG.diffs.hard);
  assert.ok(Math.ceil(hp / strongest) <= 7, '100tハンマーなら ' + Math.ceil(hp / strongest) + '勝ちで たおせる');
});

test('当たった瞬間に かぶり終わっていれば ガード(ぎりぎり判定つき)', () => {
  assert.strictEqual(Rules.strikeOutcome(0.8, null), 'clean');
  assert.strictEqual(Rules.strikeOutcome(0.8, 0.81), 'clean');
  assert.strictEqual(Rules.strikeOutcome(0.8, 0.75), 'tight');
  assert.strictEqual(Rules.strikeOutcome(0.8, 0.5), 'guard');
  const r = Rules.resolveRound({ press: 0.5, btn: 'weapon', weapon: W[0] }, { press: 0.55, btn: 'armor', armor: A[4] }, 1.8, 1);
  assert.strictEqual(r.kind, 'clean', 'ピコハンは 騎士のかぶとを かぶる前に 当たる');
  const r2 = Rules.resolveRound({ press: 0.5, btn: 'weapon', weapon: W[4] }, { press: 0.55, btn: 'armor', armor: A[0] }, 1.8, 1);
  assert.strictEqual(r2.kind, 'guard', '100tハンマーは ざるで まにあう');
  assert.strictEqual(Rules.resolveRound({ press: 0.5, btn: 'armor', weapon: W[0] }, { press: null, armor: A[0] }, 1.8, 1).kind, 'miss', 'かったのに かぶったら おてつき');
  assert.strictEqual(Rules.resolveRound({ press: 2.5, btn: 'weapon', weapon: W[0] }, { press: null, armor: A[0] }, 1.8, 1).kind, 'timeout');
  assert.strictEqual(Rules.resolveRound({ press: 0.5, btn: 'weapon', weapon: W[2], speed: CONFIG.justSpeed }, { press: 0.5, btn: 'armor', armor: A[3] }, 1.8, 1).kind, 'clean', 'ジャストなら はやく当たる');
});

test('れんしょう倍率は ふえていき 上限で止まる', () => {
  assert.strictEqual(Rules.streakMul(1), 1);
  for (let s = 2; s < 12; s++) assert.ok(Rules.streakMul(s) >= Rules.streakMul(s - 1));
  assert.strictEqual(Rules.streakMul(50), CONFIG.streakMax);
});

test('コンピューター: すきな手(クセ)がある / こちらのクセを読む / 押しまちがい', () => {
  const rng = makeRng(42);
  const lv1 = CONFIG.cpuLevels[1];
  const n = [0, 0, 0];
  for (let i = 0; i < 6000; i++) n[Rules.cpuHand(rng, lv1, 0, [], 1)]++;
  assert.ok(n[0] / 6000 > 0.5 && n[1] / 6000 > 0.15 && n[2] / 6000 > 0.15, 'Lv1 は グーが すき ' + n);
  const lv5 = Object.assign({}, CONFIG.cpuLevels[5], { read: 1 });
  assert.strictEqual(Rules.cpuHand(rng, lv5, 0, [2, 2, 2, 1], 1), 1, 'パーばかり出すと チョキで ねらわれる');
  let miss = 0;
  for (let i = 0; i < 5000; i++) { const pl = Rules.cpuPlan(rng, lv1, CONFIG.diffs.normal, 'attack'); assert.ok(pl.at >= 0.2); if (pl.btn !== 'weapon') miss++; }
  assert.ok(miss / 5000 > 0.08 && miss / 5000 < 0.16, 'Lv1 の おてつき率 ' + miss / 5000);
  const avg = (lv) => { let s = 0; for (let i = 0; i < 3000; i++) s += Rules.cpuPlan(rng, CONFIG.cpuLevels[lv], CONFIG.diffs.normal, 'guard').at; return s / 3000; };
  for (let lv = 2; lv <= 5; lv++) assert.ok(avg(lv) < avg(lv - 1), 'Lv' + lv + ' は Lv' + (lv - 1) + ' より すばやい');
});

test('10ステージ: 強さ5段階・男女の相手・会場は だんだん うまる', () => {
  const S = CONFIG.stages;
  assert.strictEqual(S.length, 10);
  for (let i = 0; i < 10; i++) {
    const st = S[i];
    assert.ok(st.lv >= 1 && st.lv <= 5);
    for (const g of ['m', 'f']) for (const k of ['title', 'name', 'intro', 'ko']) assert.ok(st[g][k], 'stage' + (i + 1) + ' ' + g + ' ' + k);
    assert.ok(W[st.weapon] && A[st.armor]);
    if (i > 0) { assert.ok(st.crowd > S[i - 1].crowd, '観客が ふえる'); assert.ok(st.lv >= S[i - 1].lv); assert.ok(st.hp > S[i - 1].hp); }
  }
  assert.deepStrictEqual([...new Set(S.map((s) => s.lv))], [1, 2, 3, 4, 5]);
  for (const k of ['hit', 'hurt', 'guard']) for (let lv = 1; lv <= 5; lv++) assert.ok(CONFIG.lines[k][lv].length >= 2);
});

test('バランス: ステージが進むほど むずかしく、むずかしさの差が出る', () => {
  const rate = (si, dk, react) => {
    let w = 0; let n = 0;
    for (let wi = 0; wi < 5; wi++) for (let ai = 0; ai < 5; ai++) for (let k = 0; k < 60; k++) {
      const rng = makeRng(7 + k * 977 + si * 31 + wi * 7 + ai * 3);
      const r = Rules.simulateMatch(rng, si, CONFIG.diffs[dk], { weapon: W[wi], armor: A[ai], react, jitter: 0.1, justRate: 0.3, hand: (g) => g.int(3) });
      if (r.win) w++; n++;
    }
    return w / n;
  };
  const n1 = rate(0, 'normal', 0.56); const n5 = rate(4, 'normal', 0.56); const n10 = rate(9, 'normal', 0.56);
  const e10 = rate(9, 'easy', 0.56); const h10 = rate(9, 'hard', 0.56);
  console.log('      勝率(ふつう) S1 ' + Math.round(n1 * 100) + '% / S5 ' + Math.round(n5 * 100) + '% / S10 ' + Math.round(n10 * 100) + '%  S10: やさしい ' + Math.round(e10 * 100) + '% むずかしい ' + Math.round(h10 * 100) + '%');
  assert.ok(n1 > 0.9, 'ステージ1は かんたん');
  assert.ok(n10 > 0.15 && n10 < 0.7, 'ステージ10は 手ごわいが 勝てる');
  assert.ok(n1 > n10);
  assert.ok(e10 > n10 && n10 > h10, 'むずかしさで 差が出る');
  const fast = rate(9, 'normal', 0.42); const slow = rate(9, 'normal', 0.72);
  assert.ok(fast > n10 && n10 > slow && fast > slow + 0.12, 'すばやく押せる人ほど 勝てる (はやい ' + Math.round(fast * 100) + '% / おそい ' + Math.round(slow * 100) + '%)');
});

test('1試合の長さ: じゃんけん 30回くらいまでで 決着がつく', () => {
  const rng = makeRng(5);
  for (let si = 0; si < 10; si++) {
    let t = 0;
    for (let k = 0; k < 50; k++) t += Rules.simulateMatch(rng, si, CONFIG.diffs.normal, { weapon: W[2], armor: A[2], react: 0.56, justRate: 0.3, hand: (g) => g.int(3) }).throws;
    assert.ok(t / 50 < 30, 'stage' + (si + 1) + ' 平均 ' + (t / 50).toFixed(1) + '回');
  }
});

if (failed) process.exit(1);
console.log('\nロジックのテスト 通過');
