'use strict';
/* 手ごたえの演出: 星・火花・紙ふぶき・書き文字・ダメージ数字・集中線・衝撃の輪・画面ゆれ・フラッシュ */

const FX = (() => {
  const parts = [];
  const pops = [];
  const rings = [];
  const lines = [];
  const shields = [];
  const S = { shake: 0, sx: 0, sy: 0, flash: 0, flashCol: '#fff', red: 0, blue: 0, zoom: 0, zx: 0, zy: 0 };
  const rnd = Math.random;

  function add(p) { if (parts.length < 500) parts.push(p); }

  function stars(x, y, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2; const v = (spd || 520) * (0.4 + rnd() * 0.8);
      add({ k: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, g: 900, r: 12 + rnd() * 16, rot: rnd() * 6, vr: (rnd() - 0.5) * 14, life: 0.7 + rnd() * 0.5, t: 0, col: rnd() < 0.7 ? '#ffe14d' : '#ffffff' });
    }
  }
  function sparks(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2; const v = 500 + rnd() * 700;
      add({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 600, len: 18 + rnd() * 26, life: 0.25 + rnd() * 0.3, t: 0, col: col || '#fff6b0' });
    }
  }
  function confetti(x, y, n, wide) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * (wide ? 2.8 : 1.6); const v = 500 + rnd() * 700;
      add({ k: 'conf', x: x + (rnd() - 0.5) * (wide || 0), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 700, drag: 1.6, w: 10 + rnd() * 8, h: 6 + rnd() * 5, rot: rnd() * 6, vr: (rnd() - 0.5) * 18, life: 2 + rnd() * 1.2, t: 0, col: Arena.CROWD_COLORS[(rnd() * 10) | 0] });
    }
  }
  function drops(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.2; const v = 250 + rnd() * 300;
      add({ k: 'drop', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1400, r: 7 + rnd() * 6, life: 0.6 + rnd() * 0.3, t: 0, col: col || '#9fdcff' });
    }
  }
  function dust(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2; const v = 80 + rnd() * 160;
      add({ k: 'dust', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.4 - 40, g: 0, r: 16 + rnd() * 22, life: 0.5 + rnd() * 0.4, t: 0, col: 'rgba(255,255,255,0.5)' });
    }
  }
  // 書き文字・数字。size, fill, stroke, life, rise, rot, pop(はじめに大きく)
  function popup(text, x, y, o) {
    o = o || {};
    pops.push({ text, x, y, size: o.size || 80, fill: o.fill || '#fff', stroke: o.stroke, outer: o.outer, life: o.life || 0.9, rise: o.rise == null ? 60 : o.rise, rot: o.rot || 0, t: 0, delay: o.delay || 0, shake: o.shake || 0 });
  }
  function ring(x, y, col, r0, r1, life, w) { rings.push({ x, y, col: col || '#fff', r0: r0 || 20, r1: r1 || 260, life: life || 0.35, t: 0, w: w || 18 }); }
  function speedLines(x, y, col, life) { lines.push({ x, y, col: col || '#fff', life: life || 0.3, t: 0, seed: rnd() * 100 }); }
  // ガードできた時の 大きな たて(六角形)
  function shield(x, y, gold, size) { shields.push({ x, y, t: 0, life: 0.55, gold, size: size || 1 }); }
  function shake(a) { S.shake = Math.max(S.shake, a); }
  function flash(a, col) { S.flash = Math.max(S.flash, a); S.flashCol = col || '#fff'; }
  function hurtRed(a) { S.red = Math.max(S.red, a); }
  function guardBlue(a) { S.blue = Math.max(S.blue, a); }
  function zoomPunch(a, x, y) { S.zoom = Math.max(S.zoom, a); S.zx = x; S.zy = y; }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt * 0.5; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.vr) p.rot += p.vr * dt;
    }
    for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t += dt; if (p.t >= p.life + p.delay) pops.splice(i, 1); }
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t >= r.life) rings.splice(i, 1); }
    for (let i = lines.length - 1; i >= 0; i--) { const r = lines[i]; r.t += dt; if (r.t >= r.life) lines.splice(i, 1); }
    for (let i = shields.length - 1; i >= 0; i--) { const r = shields[i]; r.t += dt; if (r.t >= r.life) shields.splice(i, 1); }
    S.shake = Math.max(0, S.shake - dt * 60);
    const a = S.shake;
    S.sx = (rnd() - 0.5) * a * 2; S.sy = (rnd() - 0.5) * a * 2;
    S.flash = Math.max(0, S.flash - dt * 4);
    S.red = Math.max(0, S.red - dt * 1.6);
    S.blue = Math.max(0, S.blue - dt * 2.2);
    S.zoom = Math.max(0, S.zoom - dt * 0.5);
  }

  function drawWorld(ctx) {
    for (const l of lines) {
      const k = l.t / l.life;
      ctx.save(); ctx.globalAlpha = 1 - k;
      const r = makeRng(Math.floor(l.seed * 1000) + 1);
      ctx.fillStyle = l.col;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2 + r() * 0.2;
        const r0 = 150 + r() * 80 + k * 120; const r1 = r0 + 260 + r() * 260; const w = 0.02 + r() * 0.025;
        ctx.beginPath();
        ctx.moveTo(l.x + Math.cos(a) * r0, l.y + Math.sin(a) * r0);
        ctx.lineTo(l.x + Math.cos(a + w) * r1, l.y + Math.sin(a + w) * r1);
        ctx.lineTo(l.x + Math.cos(a - w) * r1, l.y + Math.sin(a - w) * r1);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    for (const sh of shields) {
      const k = sh.t / sh.life;
      const sc = lerp(0.6, 1.25, easeOutBack(Math.min(1, k * 2.2)));
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.scale(sc * sh.size, sc * sh.size); ctx.globalAlpha = k < 0.6 ? 0.95 : (1 - k) / 0.4 * 0.95;
      const col = sh.gold ? '255,214,40' : '90,200,255';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 3; ctx.lineTo(Math.cos(a) * 190, Math.sin(a) * 170); }
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + col + ',0.22)'; ctx.fill();
      ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(' + col + ',0.95)'; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
      ctx.restore();
    }
    for (const r of rings) {
      const k = easeOutCubic(r.t / r.life);
      ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r0, r.r1, k), 0, Math.PI * 2);
      ctx.lineWidth = r.w * (1 - k) + 1; ctx.strokeStyle = r.col; ctx.globalAlpha = 1 - k; ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (const p of parts) {
      const k = p.t / p.life;
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      if (p.k === 'star') Art.star(ctx, p.x, p.y, p.r, p.rot, p.col, 3);
      else if (p.k === 'spark') {
        const l = Math.hypot(p.vx, p.vy) || 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.vx / l) * p.len, p.y - (p.vy / l) * p.len);
        ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = p.col; ctx.stroke();
      } else if (p.k === 'conf') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.rot * 2)); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      } else if (p.k === 'drop') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      } else if (p.k === 'dust') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + k), 0, Math.PI * 2); ctx.fillStyle = p.col; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawPops(ctx) {
    for (const p of pops) {
      const t = p.t - p.delay;
      if (t < 0) continue;
      const k = t / p.life;
      const sc = t < 0.12 ? lerp(1.9, 1, easeOutBack(t / 0.12)) : 1;
      const a = k > 0.75 ? (1 - k) / 0.25 : 1;
      const jx = p.shake ? (rnd() - 0.5) * p.shake * (1 - k) : 0;
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
      ctx.translate(p.x + jx, p.y - easeOutCubic(k) * p.rise); ctx.rotate(p.rot); ctx.scale(sc, sc);
      Art.text(ctx, p.text, 0, 0, p.size, p.fill, { stroke: p.stroke, outer: p.outer });
      ctx.restore();
    }
  }

  function clear() { parts.length = 0; pops.length = 0; rings.length = 0; lines.length = 0; shields.length = 0; S.shake = 0; S.flash = 0; S.red = 0; S.blue = 0; S.zoom = 0; }

  return { S, shield, stars, sparks, confetti, drops, dust, popup, ring, speedLines, shake, flash, hurtRed, guardBlue, zoomPunch, update, drawWorld, drawPops, clear, parts, pops };
})();
