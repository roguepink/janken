'use strict';
/* 会場の絵: リング・アームレスリング台・観客。
   試合中は 見やすさ優先で 背景を暗く しずかにし、ステージ開始前の 1〜2秒だけ 会場ぜんたいを見せる */

const Arena = (() => {
  const { rr, fs, linGrad } = Art;
  const CROWD_COLORS = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#fb8c00', '#00acc1', '#f06292', '#ffffff', '#6d4c41'];

  function offscreen(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0);
    return c;
  }

  /* ---------- 試合中の背景(相手のうしろ) ---------- */
  function makeBg(L, stageIdx, k) {
    const c = offscreen(L.VW, L.VH, k);
    const ctx = c.getContext('2d');
    const st = CONFIG.stages[stageIdx];
    const heat = stageIdx / 9;
    const g = ctx.createLinearGradient(0, 0, 0, L.VH);
    g.addColorStop(0, shade('#140c2a', heat * 0.05));
    g.addColorStop(0.45, shade('#24113f', -heat * 0.15));
    g.addColorStop(1, '#0b0716');
    ctx.fillStyle = g; ctx.fillRect(0, 0, L.VW, L.VH);
    // 遠くの観客(シルエット)。ステージが進むほど ぎっしり
    const rng = makeRng(77 + stageIdx * 13);
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const y = L.ringTopY - 40 - (rows - r) * 34;
      const size = 13 + r * 2.4;
      const n = Math.ceil(L.VW / (size * 1.9));
      for (let i = 0; i < n; i++) {
        if (rng() > 0.15 + st.crowd * 0.85) { rng(); continue; }
        const x = (i + 0.5) * (L.VW / n) + (rng() - 0.5) * size;
        const col = rng.pick(CROWD_COLORS);
        ctx.fillStyle = 'rgba(10,6,24,0.92)';
        ctx.beginPath(); ctx.arc(x, y, size * 0.55, 0, Math.PI * 2); ctx.fill();
        rr(ctx, x - size * 0.75, y + size * 0.4, size * 1.5, size * 1.6, size * 0.5); ctx.fill();
        ctx.fillStyle = rgba(col, 0.14 + heat * 0.08);
        ctx.beginPath(); ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.32, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 観客席と リングの さかい(暗い かべ)
    ctx.fillStyle = linGrad(ctx, 0, L.ringTopY - 60, 0, L.ringTopY + 10, [[0, 'rgba(8,4,18,0)'], [1, 'rgba(8,4,18,0.95)']]);
    ctx.fillRect(0, L.ringTopY - 60, L.VW, 70);
    // リングの床(マット)
    const mat = ctx.createLinearGradient(0, L.ringTopY, 0, L.tableFarY + 40);
    mat.addColorStop(0, '#3b4a72'); mat.addColorStop(1, '#5d6e9c');
    ctx.fillStyle = mat; ctx.fillRect(0, L.ringTopY, L.VW, L.VH - L.ringTopY);
    // コーナーポストと ロープ
    const ropeCols = ['#e53935', '#f5f5f5', '#1e88e5'];
    const postX = [L.cx - 330, L.cx + 330];
    for (let i = 0; i < 3; i++) {
      const y = L.ringTopY - 150 + i * 52;
      ctx.beginPath(); ctx.moveTo(-10, y + 6); ctx.quadraticCurveTo(L.cx, y + 14, L.VW + 10, y + 6);
      ctx.lineWidth = 11; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = ropeCols[i]; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(-10, y + 4); ctx.quadraticCurveTo(L.cx, y + 12, L.VW + 10, y + 4); ctx.stroke();
    }
    for (const x of postX) {
      rr(ctx, x - 14, L.ringTopY - 190, 28, 210, 8); fs(ctx, linGrad(ctx, x - 14, 0, x + 14, 0, [[0, '#6c7380'], [0.5, '#d9dee6'], [1, '#4f5560']]), 5);
      for (let i = 0; i < 3; i++) { rr(ctx, x - 20, L.ringTopY - 156 + i * 52, 40, 28, 8); fs(ctx, i === 1 ? '#f5f5f5' : ropeCols[i], 4); }
    }
    return c;
  }

  /* ---------- アームレスリング台(相手の手前) ---------- */
  function makeTable(L, k) {
    const c = offscreen(L.VW, L.VH, k);
    const ctx = c.getContext('2d');
    const far = L.tableFarY; const near = L.VH + 40;
    const fw = 300; const nw = 560;
    // 台の あし(奥)
    ctx.fillStyle = '#0e0a18';
    ctx.beginPath(); ctx.moveTo(L.cx - fw, far); ctx.lineTo(L.cx + fw, far); ctx.lineTo(L.cx + nw, near); ctx.lineTo(L.cx - nw, near); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, 0, far, 0, near, [[0, '#2a3152'], [0.5, '#1f2540'], [1, '#141830']]);
    ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    // ふちの 赤いライン
    ctx.beginPath(); ctx.moveTo(L.cx - fw + 14, far + 10); ctx.lineTo(L.cx + fw - 14, far + 10); ctx.lineTo(L.cx + nw - 26, near); ctx.lineTo(L.cx - nw + 26, near); ctx.closePath();
    ctx.lineWidth = 6; ctx.strokeStyle = '#e53935'; ctx.stroke();
    // まんなかの線と円
    ctx.beginPath(); ctx.moveTo(L.cx, far + 10); ctx.lineTo(L.cx, near); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
    const my = L.callY + 40;
    ctx.beginPath(); ctx.ellipse(L.cx, my, 150, 54, 0, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.stroke();
    // 台の手前の かど(光)
    ctx.beginPath(); ctx.moveTo(L.cx - fw, far); ctx.lineTo(L.cx + fw, far); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
    // にぎり棒(アームレスリングの台らしさ)
    for (const s of [-1, 1]) {
      const x = L.cx + s * (fw - 40); const y = far + 14;
      rr(ctx, x - 9, y - 54, 18, 60, 8); fs(ctx, linGrad(ctx, x - 9, 0, x + 9, 0, [[0, '#7d8494'], [0.5, '#e6eaf0'], [1, '#5c6372']]), 4);
      ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 8, 0, 0, Math.PI * 2); fs(ctx, '#3a3f55', 4);
    }
    return c;
  }

  // 上からの スポットライト(試合中)
  function drawSpot(ctx, L, t, power) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sway = Math.sin(t * 0.7) * 30;
    const g = ctx.createRadialGradient(L.cx + sway * 0.3, L.oppHeadY + 60, 30, L.cx, L.oppHeadY + 140, 520);
    g.addColorStop(0, 'rgba(255,240,200,' + 0.16 * power + ')');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(L.cx - 70 + sway, -10); ctx.lineTo(L.cx + 70 + sway, -10); ctx.lineTo(L.cx + 420, L.tableFarY + 120); ctx.lineTo(L.cx - 420, L.tableFarY + 120); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ---------- ステージ開始前の 会場ぜんたい ---------- */
  // 観客席を作る(ステージごとに 決まった配置)。filled: 人がいる席
  function makeCrowd(stageIdx, VW, VH) {
    const st = CONFIG.stages[stageIdx];
    const rng = makeRng(1234 + stageIdx * 97);
    const cx = VW / 2; const cy = VH * 0.47;
    const seats = [];
    for (let tier = 0; tier < 11; tier++) {
      const rx = 250 + tier * 62; const ry = 120 + tier * 44;
      const n = Math.floor(22 + tier * 7);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + tier * 0.13;
        const x = cx + Math.cos(a) * rx * 1.15; const y = cy + Math.sin(a) * ry;
        if (x < -40 || x > VW + 40 || y < -40 || y > VH + 60) continue;
        // リングの すぐ うしろ(上)は 見えにくいので 少なめ
        const s = 0.55 + ((y - (cy - 600)) / 1200) * 0.9;
        seats.push({ x, y, s: Math.max(0.45, s), filled: rng() < st.crowd, col: rng.pick(CROWD_COLORS), ph: rng() * 6.28, arm: rng(), light: rng() < 0.25 + st.crowd * 0.4 });
      }
    }
    seats.sort((a, b) => a.y - b.y);
    return { seats, cx, cy, stageIdx, VW, VH };
  }

  function drawVenue(ctx, crowd, t, opts) {
    const { VW, VH, cx, cy, stageIdx } = crowd;
    const st = CONFIG.stages[stageIdx];
    const heat = st.crowd;
    // 床・かべ
    const g = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(VW, VH) * 0.8);
    g.addColorStop(0, '#3a2a5e'); g.addColorStop(0.5, '#1a1030'); g.addColorStop(1, '#07040f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    const excite = 0.4 + heat * 0.9;
    // 観客(奥から)。リングより手前の席は リングのあとに描く
    const seat = (p) => {
      if (Math.abs(p.x - cx) < 330 && Math.abs(p.y - cy) < 240) return; // リングの上には いない
      const s = p.s * 15;
      if (!p.filled) {
        ctx.fillStyle = 'rgba(40,30,70,0.8)';
        rr(ctx, p.x - s * 0.8, p.y - s * 0.3, s * 1.6, s * 1.1, s * 0.3); ctx.fill();
        return;
      }
      const bob = Math.max(0, Math.sin(t * (7 + p.arm * 3) + p.ph)) * s * 0.5 * excite;
      const y = p.y - bob;
      const lit = 0.5 + 0.5 * Math.max(0, Math.sin(t * 1.3 + p.x * 0.01));
      ctx.fillStyle = shade(p.col, -0.55 + lit * 0.25);
      rr(ctx, p.x - s * 0.85, y - s * 0.1, s * 1.7, s * 1.5, s * 0.55); ctx.fill();
      ctx.fillStyle = shade('#e0b090', -0.45 + lit * 0.3);
      ctx.beginPath(); ctx.arc(p.x, y - s * 0.55, s * 0.55, 0, Math.PI * 2); ctx.fill();
      // うでを上げる(盛り上がるほど 多い)
      if (p.arm < heat * 0.8) {
        const wave = Math.sin(t * 9 + p.ph) * s * 0.4;
        ctx.strokeStyle = shade(p.col, -0.4 + lit * 0.2); ctx.lineWidth = s * 0.32; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x - s * 0.6, y); ctx.lineTo(p.x - s * 0.9 + wave, y - s * 1.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + s * 0.6, y); ctx.lineTo(p.x + s * 0.9 + wave, y - s * 1.6); ctx.stroke();
        if (p.light && heat > 0.3) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = rgba(p.col === '#ffffff' ? '#ffe14d' : p.col, 0.9);
          ctx.beginPath(); ctx.arc(p.x + s * 0.9 + wave, y - s * 1.75, s * 0.28, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
    };
    for (const p of crowd.seats) if (p.y < cy + 120) seat(p);
    ring(ctx, cx, cy, t, opts);
    for (const p of crowd.seats) if (p.y >= cy + 120) seat(p);
    // カメラのフラッシュ(盛り上がるほど 多い)
    const flashes = Math.floor(2 + heat * 26);
    const rng = makeRng(Math.floor(t * 10) + stageIdx * 7);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < flashes; i++) {
      const p = crowd.seats[rng.int(crowd.seats.length)];
      if (!p || !p.filled) continue;
      const r = 6 + rng() * 14;
      const gg = ctx.createRadialGradient(p.x, p.y - 10, 0, p.x, p.y - 10, r * 3);
      gg.addColorStop(0, 'rgba(255,255,255,0.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y - 10, r * 3, 0, Math.PI * 2); ctx.fill();
    }
    // ゆれる スポットライト
    const beams = 2 + Math.round(heat * 4);
    for (let i = 0; i < beams; i++) {
      const sx = (i + 0.5) / beams * VW;
      const a = Math.sin(t * (0.9 + i * 0.23) + i) * 0.5;
      const tx = cx + Math.sin(a) * 500; const ty = cy + 40;
      const col = i % 3 === 0 ? '255,240,200' : i % 3 === 1 ? '200,120,255' : '120,200,255';
      const gg = ctx.createLinearGradient(sx, -20, tx, ty);
      gg.addColorStop(0, 'rgba(' + col + ',0.28)'); gg.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.moveTo(sx - 20, -20); ctx.lineTo(sx + 20, -20); ctx.lineTo(tx + 160, ty); ctx.lineTo(tx - 160, ty); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // 最終ステージは 紙ふぶき
    if (stageIdx >= 8) {
      const r2 = makeRng(99);
      for (let i = 0; i < 80; i++) {
        const x = (r2() * VW + t * (20 + r2() * 40)) % VW;
        const y = (r2() * VH + t * (120 + r2() * 80)) % VH;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + i);
        ctx.fillStyle = CROWD_COLORS[i % CROWD_COLORS.length]; ctx.fillRect(-5, -3, 10, 6); ctx.restore();
      }
    }
  }

  function ring(ctx, cx, cy, t, opts) {
    const w = 270; const h = 150;
    // エプロン(横)
    ctx.beginPath(); ctx.moveTo(cx - w - 40, cy + 20); ctx.lineTo(cx + w + 40, cy + 20); ctx.lineTo(cx + w + 40, cy + h + 70); ctx.lineTo(cx - w - 40, cy + h + 70); ctx.closePath();
    fs(ctx, '#20263f', 6);
    ctx.fillStyle = '#e53935'; ctx.fillRect(cx - w - 37, cy + h + 30, (w + 37) * 2, 14);
    // マット(上から見た四角)
    ctx.beginPath(); ctx.moveTo(cx - w + 30, cy - h); ctx.lineTo(cx + w - 30, cy - h); ctx.lineTo(cx + w + 40, cy + h); ctx.lineTo(cx - w - 40, cy + h); ctx.closePath();
    const mg = ctx.createLinearGradient(0, cy - h, 0, cy + h);
    mg.addColorStop(0, '#5468a0'); mg.addColorStop(1, '#7d90c8');
    fs(ctx, mg, 6);
    // スポットライトの光の輪
    const sp = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
    sp.addColorStop(0, 'rgba(255,250,220,0.55)'); sp.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = sp; ctx.beginPath(); ctx.ellipse(cx, cy, 300, 160, 0, 0, Math.PI * 2); ctx.fill();
    // 台と ふたり
    rr(ctx, cx - 70, cy - 26, 140, 52, 10); fs(ctx, '#232a48', 5);
    ctx.beginPath(); ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
    const bob = Math.sin(t * 6) * 2;
    const person = (x, y, col, hair) => {
      rr(ctx, x - 26, y - 6, 52, 40, 16); fs(ctx, col, 4);
      ctx.beginPath(); ctx.arc(x, y - 22 + bob, 18, 0, Math.PI * 2); fs(ctx, '#f2c29b', 4);
      ctx.beginPath(); ctx.arc(x, y - 28 + bob, 17, Math.PI, 0); fs(ctx, hair, 0);
    };
    person(cx, cy - 58, (opts && opts.oppColor) || '#7b1fa2', '#222');
    person(cx, cy + 66, (opts && opts.youColor) || '#2f6fe0', '#2b2118');
    // ポストと ロープ
    const posts = [[cx - w + 30, cy - h], [cx + w - 30, cy - h], [cx + w + 40, cy + h], [cx - w - 40, cy + h]];
    const ropeCols = ['#e53935', '#f5f5f5', '#1e88e5'];
    for (let r = 0; r < 3; r++) {
      const lift = 22 + r * 20;
      ctx.beginPath();
      posts.forEach(([x, y], i) => { const yy = y - lift * (y < cy ? 0.7 : 1.2); if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); });
      ctx.closePath(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = ropeCols[r]; ctx.stroke();
    }
    for (const [x, y] of posts) {
      const hh = y < cy ? 70 : 100;
      rr(ctx, x - 9, y - hh, 18, hh, 6); fs(ctx, '#cfd5de', 4);
    }
  }

  return { makeBg, makeTable, drawSpot, makeCrowd, drawVenue, CROWD_COLORS };
})();
