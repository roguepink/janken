'use strict';
/* 絵の部品: じゃんけんの手・ぶき・ぼうぐ・文字・星。画像ファイルは使わず Canvas のパスで描く。
   どの絵も「原点まわりのローカル座標」で描くので、呼ぶ側で translate / rotate / scale してから使う */

const INK = '#1b1430';

const Art = (() => {
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fs(ctx, fill, lw, stroke) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke || INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  }
  // 左上から光が当たったような 丸い陰影
  function ballGrad(ctx, x, y, r, base) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r * 1.05);
    g.addColorStop(0, shade(base, 0.35));
    g.addColorStop(0.55, base);
    g.addColorStop(1, shade(base, -0.28));
    return g;
  }
  function linGrad(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((s, i) => g.addColorStop(s[0] != null ? s[0] : i / (stops.length - 1), s[1]));
    return g;
  }
  // 太いふちどりの文字(まんがの書き文字)
  function text(ctx, str, x, y, size, fill, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = (opts.weight || 900) + ' ' + size + 'px ' + FONT;
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (opts.rot) { ctx.translate(x, y); ctx.rotate(opts.rot); x = 0; y = 0; }
    const ow = opts.outline == null ? size * 0.22 : opts.outline;
    if (opts.shadow !== false && ow > 0) {
      ctx.fillStyle = opts.shadowColor || 'rgba(0,0,0,0.45)';
      ctx.lineWidth = ow; ctx.strokeStyle = opts.shadowColor || 'rgba(0,0,0,0.45)';
      ctx.strokeText(str, x + size * 0.04, y + size * 0.07);
    }
    if (opts.outer) { ctx.lineWidth = ow + size * 0.16; ctx.strokeStyle = opts.outer; ctx.strokeText(str, x, y); }
    if (ow > 0) { ctx.lineWidth = ow; ctx.strokeStyle = opts.stroke || INK; ctx.strokeText(str, x, y); }
    if (Array.isArray(fill)) {
      const g = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
      fill.forEach((c, i) => g.addColorStop(i / (fill.length - 1), c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = fill;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function star(ctx, x, y, r, rot, fill, lw) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    fs(ctx, fill || '#ffe14d', lw == null ? r * 0.18 : lw);
  }
  // ギザギザの ふきだし(ばくはつ)
  function burst(ctx, x, y, r, n, fill, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || 0) + (i * Math.PI) / n;
      const rad = i % 2 ? r * 0.7 : r;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    fs(ctx, fill, r * 0.06);
  }
  function capsule(ctx, x0, y0, x1, y1, w, fill, lw) {
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineWidth = w + (lw || 0) * 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = fill; ctx.stroke();
  }

  /* ---------- じゃんけんの手(上むき、原点 = 手首。高さ およそ 190) ---------- */
  function hand(ctx, type, skin, sleeve) {
    const lw = 6;
    const dark = shade(skin, -0.22);
    // そで(null なら 描かない)
    if (sleeve !== null) {
      rr(ctx, -50, 4, 100, 70, 14); fs(ctx, sleeve || '#3d7bff', lw);
      ctx.fillStyle = shade(sleeve || '#3d7bff', -0.25); ctx.fillRect(-46, 8, 92, 12);
    }
    // 手首
    rr(ctx, -34, -24, 68, 34, 10); fs(ctx, skin, lw);
    const finger = (x0, y0, x1, y1, w) => {
      capsule(ctx, x0, y0, x1, y1, w, skin, 3);
      // 指先の ツメ
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.save(); ctx.translate(x1 - Math.cos(a) * w * 0.3, y1 - Math.sin(a) * w * 0.3); ctx.rotate(a + Math.PI / 2);
      rr(ctx, -w * 0.28, -w * 0.05, w * 0.56, w * 0.42, w * 0.2); ctx.fillStyle = shade(skin, 0.35); ctx.fill();
      ctx.restore();
    };
    if (type === 2) {
      // パー: 5本の指を ひろげる
      finger(-36, -60, -96, -118, 30);
      finger(-30, -84, -48, -178, 30);
      finger(-6, -88, -6, -194, 31);
      finger(18, -86, 34, -184, 30);
      finger(38, -74, 70, -152, 27);
      rr(ctx, -50, -104, 100, 92, 34); fs(ctx, ballGrad(ctx, 0, -60, 60, skin), lw);
      // 手のひらの しわ
      ctx.beginPath(); ctx.moveTo(-30, -48); ctx.quadraticCurveTo(0, -62, 26, -72);
      ctx.lineWidth = 3.5; ctx.strokeStyle = dark; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-24, -30); ctx.quadraticCurveTo(-4, -40, 14, -36); ctx.stroke();
      return;
    }
    if (type === 1) {
      // チョキ: 人さし指と中指
      finger(-14, -84, -46, -178, 31);
      finger(12, -86, 38, -182, 31);
    }
    // にぎりこぶし
    rr(ctx, -52, -108, 104, 96, 30); fs(ctx, ballGrad(ctx, 0, -64, 62, skin), lw);
    // 曲げた指の ふし
    const n = type === 1 ? 2 : 4;
    const x0 = type === 1 ? 2 : -50;
    const fw = type === 1 ? 24 : 25;
    for (let i = 0; i < n; i++) {
      const fx = x0 + i * fw;
      rr(ctx, fx, -114, fw, 52, 12); fs(ctx, ballGrad(ctx, fx + fw / 2, -96, 26, skin), 5);
    }
    // おや指
    ctx.beginPath();
    ctx.moveTo(-50, -44); ctx.quadraticCurveTo(-46, -70, -14, -66); ctx.quadraticCurveTo(14, -62, 16, -50);
    ctx.quadraticCurveTo(14, -40, -10, -40); ctx.quadraticCurveTo(-40, -38, -50, -30); ctx.closePath();
    fs(ctx, shade(skin, 0.08), 5);
  }

  /* ---------- ぶき(原点 = にぎる所。頭は 上(-y)) ---------- */
  function weapon(ctx, id) {
    const lw = 6;
    if (id === 'pico') {
      rr(ctx, -9, -150, 18, 160, 8); fs(ctx, linGrad(ctx, -9, 0, 9, 0, [[0, '#ffe066'], [0.5, '#fff3b0'], [1, '#e6b800']]), lw);
      for (let y = -130; y < 0; y += 30) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(-8, y, 16, 9); }
      // じゃばらの頭
      rr(ctx, -62, -204, 124, 66, 16); fs(ctx, linGrad(ctx, 0, -204, 0, -138, [[0, '#ff8080'], [0.45, '#ff3b3b'], [1, '#c41818']]), lw);
      ctx.strokeStyle = 'rgba(120,0,0,0.55)'; ctx.lineWidth = 4;
      for (let x = -38; x <= 38; x += 15) { ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, -142); ctx.stroke(); }
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(s * 66, -171, 16, 38, 0, 0, Math.PI * 2); fs(ctx, '#ffd23d', lw);
        ctx.beginPath(); ctx.ellipse(s * 66 - 3, -178, 6, 14, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff6c0'; ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; rr(ctx, -50, -196, 100, 10, 5); ctx.fill();
    } else if (id === 'harisen') {
      // 紙を じゃばらに おった せんす
      ctx.beginPath();
      ctx.moveTo(-16, -60); ctx.lineTo(-86, -230); ctx.quadraticCurveTo(0, -262, 86, -230); ctx.lineTo(16, -60); ctx.closePath();
      fs(ctx, '#fffdf2', lw);
      ctx.strokeStyle = '#c9c2a8'; ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3.2, -62); ctx.lineTo(i * 24, -238 - (3 - Math.abs(i)) * 4); ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = -3; i < 3; i += 2) { ctx.beginPath(); ctx.moveTo(i * 3.2, -62); ctx.lineTo(i * 24, -238); ctx.lineTo((i + 1) * 24, -240); ctx.lineTo((i + 1) * 3.2, -62); ctx.fill(); }
      rr(ctx, -18, -66, 36, 76, 8); fs(ctx, '#fffdf2', lw);
      ctx.fillStyle = '#e8333a'; ctx.fillRect(-15, -56, 30, 14); ctx.fillRect(-15, -26, 30, 14);
      ctx.beginPath(); ctx.moveTo(-18, -66); ctx.lineTo(18, -66); ctx.lineTo(18, 10); ctx.lineTo(-18, 10); ctx.closePath(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    } else if (id === 'pan') {
      rr(ctx, -10, -120, 20, 130, 9); fs(ctx, '#2b2b33', lw);
      ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); ctx.fillStyle = '#888'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -196, 86, 0, Math.PI * 2); fs(ctx, '#3a3d48', lw);
      ctx.beginPath(); ctx.arc(0, -196, 72, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-26, -226, 6, 0, -196, 74); g.addColorStop(0, '#8a90a2'); g.addColorStop(0.6, '#4a4f5e'); g.addColorStop(1, '#262833');
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -196, 72, Math.PI * 1.1, Math.PI * 1.45); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -196, 86, 0, Math.PI * 2); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    } else if (id === 'mallet') {
      rr(ctx, -10, -150, 20, 160, 8); fs(ctx, linGrad(ctx, -10, 0, 10, 0, [[0, '#c48a52'], [0.5, '#e6b27a'], [1, '#9a6434']]), lw);
      rr(ctx, -92, -226, 184, 84, 22); fs(ctx, linGrad(ctx, 0, -226, 0, -142, [[0, '#e7b47a'], [0.4, '#c88a4e'], [1, '#8c5a2c']]), lw);
      ctx.fillStyle = '#8f8f9c';
      for (const x of [-70, 56]) { ctx.fillRect(x, -224, 14, 80); }
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      for (const x of [-70, 56]) { ctx.strokeRect(x, -224, 14, 80); }
      ctx.strokeStyle = 'rgba(90,50,20,0.45)'; ctx.lineWidth = 3;
      for (const y of [-206, -184, -162]) { ctx.beginPath(); ctx.moveTo(-50, y); ctx.quadraticCurveTo(0, y + 6, 50, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(ctx, -80, -218, 160, 12, 6); ctx.fill();
    } else if (id === 'ton') {
      rr(ctx, -13, -160, 26, 172, 9); fs(ctx, linGrad(ctx, -13, 0, 13, 0, [[0, '#6b6f7e'], [0.5, '#c9cfdc'], [1, '#4a4d58']]), lw);
      rr(ctx, -16, -40, 32, 46, 8); fs(ctx, '#b3261e', 5);
      rr(ctx, -128, -286, 256, 136, 18); fs(ctx, linGrad(ctx, 0, -286, 0, -150, [[0, '#5b6070'], [0.35, '#3a3e4b'], [1, '#1f2129']]), lw + 1);
      rr(ctx, -118, -278, 236, 18, 8); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
      for (const x of [-108, 108]) { ctx.beginPath(); ctx.arc(x, -170, 6, 0, Math.PI * 2); ctx.fillStyle = '#9aa0b0'; ctx.fill(); ctx.beginPath(); ctx.arc(x, -266, 6, 0, Math.PI * 2); ctx.fill(); }
      text(ctx, '100t', 0, -216, 70, '#fff', { outline: 10, shadow: false });
    }
  }

  /* ---------- ぼうぐ(原点 = 頭の中心、頭の半径 100) view: 'front' | 'back' ---------- */
  function armor(ctx, id, view) {
    const lw = 6;
    const back = view === 'back';
    if (id === 'zaru') {
      ctx.beginPath(); ctx.ellipse(0, -24, 112, 100, 0, Math.PI, 0); ctx.closePath();
      fs(ctx, ballGrad(ctx, 0, -70, 110, '#d9b36a'), lw);
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(120,80,30,0.55)'; ctx.lineWidth = 3;
      for (let x = -120; x <= 120; x += 16) { ctx.beginPath(); ctx.moveTo(x, -130); ctx.lineTo(x + 50, -20); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, -130); ctx.lineTo(x - 50, -20); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, -24, 118, 16, 0, 0, Math.PI * 2); fs(ctx, '#b88a44', lw);
      ctx.beginPath(); ctx.ellipse(-34, -92, 26, 10, -0.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    } else if (id === 'nabe') {
      // さかさまの なべ
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 112, -70, 22, 13, 0, 0, Math.PI * 2); fs(ctx, '#3a3a44', lw); }
      ctx.beginPath(); ctx.moveTo(-100, -24); ctx.lineTo(-96, -118); ctx.quadraticCurveTo(0, -136, 96, -118); ctx.lineTo(100, -24); ctx.closePath();
      fs(ctx, linGrad(ctx, -100, 0, 100, 0, [[0, '#9aa3b5'], [0.25, '#eef2f8'], [0.55, '#b8c0ce'], [1, '#6c7486']]), lw);
      ctx.beginPath(); ctx.ellipse(0, -24, 110, 14, 0, 0, Math.PI * 2); fs(ctx, '#c9d0dc', lw);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-60, -110, 10, 76);
    } else if (id === 'hardhat') {
      if (!back) { ctx.beginPath(); ctx.ellipse(0, -22, 132, 26, 0, 0, Math.PI * 2); fs(ctx, '#f5b800', lw); }
      else { ctx.beginPath(); ctx.ellipse(0, -26, 116, 18, 0, 0, Math.PI * 2); fs(ctx, '#f5b800', lw); }
      ctx.beginPath(); ctx.ellipse(0, -28, 106, 104, 0, Math.PI, 0); ctx.closePath();
      fs(ctx, ballGrad(ctx, 0, -76, 108, '#ffcf1a'), lw);
      rr(ctx, -16, -134, 32, 104, 12); fs(ctx, '#ffdb4d', 4);
      if (!back) {
        rr(ctx, -66, -92, 40, 40, 6); fs(ctx, '#fff', 3);
        ctx.fillStyle = '#1e9e4a'; ctx.fillRect(-52, -88, 12, 32); ctx.fillRect(-62, -78, 32, 12);
      }
      ctx.beginPath(); ctx.ellipse(-50, -96, 22, 9, -0.6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
    } else if (id === 'bike') {
      ctx.beginPath(); ctx.ellipse(0, -2, 122, 128, 0, 0, Math.PI * 2);
      fs(ctx, ballGrad(ctx, 0, -20, 124, '#e53935'), lw + 1);
      if (!back) {
        rr(ctx, -96, -44, 192, 70, 30); fs(ctx, linGrad(ctx, 0, -44, 0, 26, [[0, '#2a3548'], [0.5, '#0f1724'], [1, '#2c3e5a']]), lw);
        ctx.beginPath(); ctx.moveTo(-70, -34); ctx.lineTo(-20, -34); ctx.lineTo(-50, 16); ctx.lineTo(-84, 16); ctx.closePath(); ctx.fillStyle = 'rgba(160,210,255,0.35)'; ctx.fill();
        rr(ctx, -40, 56, 80, 24, 10); fs(ctx, '#2b2b33', 4);
      } else {
        ctx.fillStyle = '#fff'; ctx.fillRect(-14, -126, 28, 240);
      }
      ctx.beginPath(); ctx.ellipse(-56, -78, 30, 14, -0.7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    } else if (id === 'knight') {
      // かざり
      ctx.beginPath(); ctx.moveTo(-8, -120); ctx.quadraticCurveTo(-30, -200, 40, -210); ctx.quadraticCurveTo(10, -170, 22, -118); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, -210, 0, -118, [[0, '#ff6b6b'], [1, '#b71c1c']]), lw);
      ctx.beginPath();
      ctx.moveTo(-112, 70); ctx.lineTo(-116, -40); ctx.quadraticCurveTo(-110, -128, 0, -132); ctx.quadraticCurveTo(110, -128, 116, -40); ctx.lineTo(112, 70);
      ctx.quadraticCurveTo(0, 104, -112, 70); ctx.closePath();
      fs(ctx, linGrad(ctx, -116, 0, 116, 0, [[0, '#7d8494'], [0.3, '#e9edf3'], [0.55, '#b7bfcc'], [1, '#5c6372']]), lw + 1);
      ctx.beginPath(); ctx.moveTo(0, -130); ctx.lineTo(0, 96); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,64,80,0.6)'; ctx.stroke();
      if (!back) {
        rr(ctx, -92, -14, 184, 22, 8); fs(ctx, '#15151c', 4);
        ctx.fillStyle = '#15151c';
        for (let i = -3; i <= 3; i++) { if (i === 0) continue; ctx.beginPath(); ctx.arc(i * 14, 40, 4, 0, Math.PI * 2); ctx.fill(); }
      }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 96, -70, 6, 0, Math.PI * 2); ctx.fillStyle = '#4a4f5e'; ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(-56, -82, 18, 34, 0.3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    }
  }
  // ぼうぐが顔ぜんぶを おおうか(表情を描かない)
  const fullFace = (id) => id === 'bike' || id === 'knight';

  // アイコン用: 絵の はんいを 中心に そろえて size に おさめる
  const WEAPON_BOX = { pico: [-84, -212, 84, 12], harisen: [-90, -262, 90, 14], pan: [-90, -286, 90, 14], mallet: [-96, -230, 96, 14], ton: [-132, -290, 132, 16] };
  const ARMOR_BOX = { zaru: [-120, -128, 120, -6], nabe: [-136, -138, 136, -8], hardhat: [-134, -136, 134, 6], bike: [-126, -134, 126, 130], knight: [-120, -212, 120, 108] };
  function fitBox(ctx, b, size) {
    const k = size / Math.max(b[2] - b[0], b[3] - b[1]);
    ctx.scale(k, k); ctx.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2);
  }
  function weaponIcon(ctx, id, size, rot) {
    ctx.save(); ctx.rotate(rot || 0); fitBox(ctx, WEAPON_BOX[id], size); weapon(ctx, id); ctx.restore();
  }
  function armorIcon(ctx, id, size, skin) {
    ctx.save();
    const b = ARMOR_BOX[id].slice();
    if (skin) { b[0] = Math.min(b[0], -88); b[1] = Math.min(b[1], -98); b[2] = Math.max(b[2], 88); b[3] = Math.max(b[3], 98); }
    fitBox(ctx, b, size);
    if (skin) { ctx.beginPath(); ctx.ellipse(0, 0, 88, 98, 0, 0, Math.PI * 2); fs(ctx, ballGrad(ctx, 0, 0, 98, skin), 5); }
    armor(ctx, id, 'front');
    ctx.restore();
  }

  return { rr, fs, ballGrad, linGrad, text, star, burst, capsule, hand, weapon, armor, fullFace, weaponIcon, armorIcon };
})();

const FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", "Noto Sans JP", "Noto Sans CJK JP", system-ui, sans-serif';
