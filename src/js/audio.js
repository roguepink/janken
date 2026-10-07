'use strict';
/* 効果音とBGMを WebAudio で合成する(音声ファイルは使わない)。最初のタップの後に鳴り始める */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let bgmGain = null;
  let noiseBuf = null;
  let muted = false;
  let bgm = null; // { timer, next, step, tempo, level }
  try { muted = localStorage.getItem('tataite_mute') === '1'; } catch (e) { /* 保存できなくても遊べる */ }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6;
      comp.connect(ctx.destination);
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      bgmGain = ctx.createGain(); bgmGain.gain.value = 0.22; bgmGain.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }
  const ok = () => ctx && !muted;
  const now = () => ctx.currentTime;

  function tone(freq, dur, type, vol, slideTo, delay, dest) {
    if (!ok()) return;
    const t0 = now() + (delay || 0);
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 20), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, freq, type, delay, q, dest, attack) {
    if (!ok()) return;
    const t0 = now() + (delay || 0);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1200; if (q) f.Q.value = q;
    const g = ctx.createGain();
    if (attack) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); }
    else g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus);
    s.start(t0, Math.random() * 1.2); s.stop(t0 + dur + 0.05);
  }
  // 金属の「カーン」: 整数倍でない倍音を重ねる
  function metal(base, dur, vol, delay) {
    [1, 2.76, 5.4, 8.93].forEach((k, i) => tone(base * k, dur / (1 + i * 0.6), 'sine', vol / (1 + i * 0.8), null, delay));
  }

  const sfx = {
    tap() { tone(660, 0.06, 'triangle', 0.12, 880); },
    // じゃん・けん: たいこ / ぽん: 高いたいこ + シンバル
    drum(i) { tone(i ? 150 : 130, 0.22, 'sine', 0.6, 60); noise(0.06, 0.25, 900, 'lowpass'); tone(i ? 330 : 290, 0.08, 'triangle', 0.12); },
    pon() { tone(240, 0.3, 'sine', 0.7, 90); noise(0.5, 0.25, 6000, 'highpass'); tone(880, 0.1, 'square', 0.06, 1320); },
    select() { tone(780, 0.07, 'square', 0.07, 1040); },
    just() { [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, null, i * 0.035)); },
    reveal() { noise(0.12, 0.25, 3000, 'bandpass', 0, 1.2); tone(520, 0.12, 'triangle', 0.15, 700); },
    win() { [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'square', 0.08, null, i * 0.05)); },
    lose() { tone(330, 0.25, 'sawtooth', 0.09, 160); tone(311, 0.25, 'square', 0.05, 150, 0.05); },
    aiko() { tone(600, 0.1, 'triangle', 0.12); tone(600, 0.1, 'triangle', 0.12, null, 0.12); },
    whoosh(heavy) { noise(heavy ? 0.32 : 0.18, heavy ? 0.4 : 0.3, heavy ? 900 : 2200, 'bandpass', 0, 0.9, null, heavy ? 0.2 : 0.1); },
    don() { tone(900, 0.05, 'square', 0.08, 1500); noise(0.08, 0.2, 4000, 'highpass'); },
    // ぶき別の「当たった音」
    hit(id, power) {
      const p = power || 1;
      if (id === 'pico') { tone(1500, 0.07, 'square', 0.22, 2400); tone(2200, 0.08, 'square', 0.14, 3000, 0.07); noise(0.05, 0.2, 3000); }
      else if (id === 'harisen') { noise(0.16, 0.9, 2600, 'highpass'); noise(0.05, 0.7, 6000, 'bandpass', 0, 0.8); tone(180, 0.08, 'sine', 0.4, 80); }
      else if (id === 'pan') { metal(520, 1.0, 0.45); noise(0.06, 0.5, 2500); tone(120, 0.15, 'sine', 0.5, 60); }
      else if (id === 'mallet') { tone(160, 0.4, 'sine', 0.9, 55); noise(0.12, 0.6, 700); tone(420, 0.12, 'triangle', 0.25, 200); }
      else if (id === 'ton') { tone(90, 0.8, 'sine', 1, 30); tone(60, 0.9, 'triangle', 0.6, 25); noise(0.6, 0.8, 500, 'lowpass', 0, 0, null); noise(0.25, 0.5, 2500, 'bandpass', 0.02, 0.6); }
      tone(70 * p, 0.25, 'sine', 0.5, 35);
    },
    // ぼうぐで ふせいだ音
    guard(id) {
      if (id === 'zaru') { noise(0.1, 0.6, 1400, 'bandpass', 0, 2); tone(300, 0.1, 'triangle', 0.3, 180); }
      else if (id === 'nabe') { metal(700, 1.2, 0.5); metal(730, 0.9, 0.25, 0.01); }
      else if (id === 'hardhat') { tone(380, 0.15, 'square', 0.25, 260); noise(0.08, 0.5, 2000, 'bandpass', 0, 1.5); }
      else if (id === 'bike') { tone(220, 0.2, 'sine', 0.7, 120); noise(0.1, 0.4, 1200); }
      else if (id === 'knight') { metal(440, 1.4, 0.55); metal(890, 0.8, 0.25); noise(0.08, 0.5, 5000, 'highpass'); }
      tone(1200, 0.2, 'triangle', 0.12, 1800, 0.04);
    },
    tight() { [1568, 2093, 2637].forEach((f, i) => tone(f, 0.2, 'triangle', 0.12, null, 0.05 + i * 0.05)); },
    otetsuki() { tone(180, 0.35, 'sawtooth', 0.18); tone(190, 0.35, 'square', 0.1); },
    timeout() { tone(440, 0.12, 'square', 0.08, 300); tone(300, 0.2, 'square', 0.08, 200, 0.12); },
    bell(n) { for (let i = 0; i < (n || 1); i++) { metal(1180, 1.6, 0.35, i * 0.32); } },
    ko() { tone(80, 1.4, 'sine', 1, 28); noise(1.2, 0.7, 400); metal(300, 2, 0.3, 0.1); },
    crowd(level, dur) {
      const l = 0.15 + level * 0.55;
      const d = dur || 1.6;
      noise(d, l, 900, 'bandpass', 0, 0.6, null, 0.25);
      noise(d * 0.9, l * 0.6, 2200, 'bandpass', 0.05, 0.8, null, 0.3);
      if (level > 0.5) for (let i = 0; i < 4; i++) tone(1800 + Math.random() * 800, 0.18, 'sine', 0.03 * level, 2400, 0.1 + Math.random() * 0.6);
    },
    fanfare() { [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.4], [784, 0.55], [1046, 0.68]].forEach(([f, d]) => { tone(f, 0.22, 'square', 0.09, null, d); tone(f / 2, 0.22, 'triangle', 0.1, null, d); }); },
    sad() { [[392, 0], [370, 0.3], [349, 0.6], [330, 0.9]].forEach(([f, d]) => tone(f, 0.4, 'triangle', 0.13, f * 0.97, d)); },
    vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 無視 */ } },
  };

  /* ---------- BGM(ステージが進むほど はやく・はげしく) ---------- */
  function startBgm(level) {
    if (!ctx) return;
    stopBgm();
    bgm = { next: ctx.currentTime + 0.1, step: 0, tempo: 118 + level * 3, level };
    bgm.timer = setInterval(schedule, 60);
  }
  function stopBgm() { if (bgm) { clearInterval(bgm.timer); bgm = null; } }
  function btone(freq, t, dur, type, vol) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bgmGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function bnoise(t, dur, vol, freq) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bgmGain); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  // ベース: Am - F - G - E のくりかえし
  const BASS = [110, 110, 220, 110, 87.3, 87.3, 174.6, 87.3, 98, 98, 196, 98, 82.4, 82.4, 164.8, 103.8];
  function schedule() {
    if (!bgm || !ctx || muted) { if (bgm && ctx) bgm.next = ctx.currentTime + 0.1; return; }
    const spb = 60 / bgm.tempo / 2; // 8分音符
    while (bgm.next < ctx.currentTime + 0.2) {
      const t = bgm.next; const s = bgm.step % 64;
      const bar = Math.floor(s / 16) % 4;
      const b = BASS[bar * 4 + (Math.floor(s / 4) % 4)] || 110;
      if (s % 2 === 0) btone(b, t, spb * 1.6, 'triangle', 0.5);
      if (s % 4 === 0) { btone(120, t, 0.18, 'sine', 0.9); }
      if (s % 8 === 4) bnoise(t, 0.12, 0.35, 1500);
      bnoise(t, 0.03, 0.12 + bgm.level * 0.015, 7000);
      if (bgm.level >= 5 && s % 8 === 7) btone(b * 4, t, 0.1, 'square', 0.06);
      bgm.next += spb; bgm.step++;
    }
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('tataite_mute', m ? '1' : '0'); } catch (e) { /* 無視 */ }
    if (master) master.gain.value = m ? 0 : 0.8;
  }
  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  return { init, sfx, startBgm, stopBgm, setMuted, isMuted: () => muted, suspend, resume };
})();
