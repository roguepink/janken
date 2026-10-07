'use strict';
/* 相手(10人 × 男女)と 自分(うしろ姿)の絵。ステージが進むほど 悪者らしくなる。
   原点 = 頭の中心、頭の半径 = 100 のローカル座標で描く */

const LOOKS = [
  // 1 いたずらっ子
  { m: { skin: '#ffd2a8', body: { type: 'tshirt', color: '#ffcc33', stripe: '#ff7a3d' }, hair: 'cap', hairColor: '#5a3a22', cap: '#e8433a', eyes: 'round', brows: 'thin', mouth: 'toothy', extras: ['freckles', 'bandaid', 'blush'] },
    f: { skin: '#ffd8b4', body: { type: 'tshirt', color: '#7fd4ff', stripe: '#ff7ab6' }, hair: 'pigtails', hairColor: '#7a4a2a', ribbon: '#ff4f8b', eyes: 'round', lashes: true, brows: 'thin', mouth: 'tongue', extras: ['freckles', 'bandaid', 'blush'] } },
  // 2 ちょいワル
  { m: { skin: '#f2c49b', body: { type: 'openshirt', color: '#7b4fd6', chain: true }, hair: 'slick', hairColor: '#2b2b33', eyes: 'half', brows: 'raised', mouth: 'smirk', extras: ['shadesOnHead', 'stubble'] },
    f: { skin: '#f6cfa8', body: { type: 'openshirt', color: '#e04f8a', chain: true }, hair: 'wavy', hairColor: '#c0773a', eyes: 'half', lashes: true, brows: 'raised', mouth: 'smirk', lips: '#d6336c', extras: ['shadesOnHead', 'gum'] } },
  // 3 ヤンキー / スケバン
  { m: { skin: '#efbf93', body: { type: 'longcoat', color: '#f4f4f4', trim: '#d32f2f' }, hair: 'pompadour', hairColor: '#17171d', eyes: 'glare', brows: 'angry', mouth: 'sneer', extras: ['earring'] },
    f: { skin: '#f3c9a2', body: { type: 'sailor', color: '#1f2340', trim: '#e8e8f0', scarf: '#d32f2f' }, hair: 'longStraight', hairColor: '#f2d04b', eyes: 'glare', lashes: true, brows: 'angry', mouth: 'none', extras: ['facemask'] } },
  // 4 番長 / 女番長
  { m: { skin: '#e8b48a', body: { type: 'gakuran', color: '#1d1f2b' }, hair: 'spiky', hairColor: '#111116', eyes: 'glare', brows: 'thick', mouth: 'grit', extras: ['scar', 'grass'] },
    f: { skin: '#eebd96', body: { type: 'gakuran', color: '#24192e' }, hair: 'longBlack', hairColor: '#15151c', band: '#e8433a', eyes: 'glare', lashes: true, brows: 'angry', mouth: 'smirk', lips: '#a3263c', extras: ['scar', 'grass'] } },
  // 5 イカサマ師
  { m: { skin: '#f2c49b', body: { type: 'suit', color: '#2a8a6a', shirt: '#fafafa', tie: 'bow', tieColor: '#e8433a' }, hair: 'slickPart', hairColor: '#3a2a1a', eyes: 'sly', brows: 'raised', mouth: 'goldGrin', extras: ['mustache', 'monocle'] },
    f: { skin: '#f5cdb0', body: { type: 'suit', color: '#6b2fa3', shirt: '#fafafa', tie: 'none', pearls: true }, hair: 'bob', hairColor: '#1f1f2a', eyes: 'sly', lashes: true, brows: 'raised', mouth: 'smirk', lips: '#c2185b', extras: ['catglasses', 'mole'] } },
  // 6 覆面レスラー
  { m: { skin: '#dc9f74', body: { type: 'wrestler', color: '#b71c1c' }, hair: 'mask', mask: '#b71c1c', maskTrim: '#14141a', flames: '#ffb300', eyes: 'glare', brows: 'none', mouth: 'grit', extras: [] },
    f: { skin: '#e7b18a', body: { type: 'wrestler', color: '#6a1b9a' }, hair: 'mask', mask: '#6a1b9a', maskTrim: '#ff4081', flames: '#ff80ab', ponytail: '#e91e63', eyes: 'glare', lashes: true, brows: 'none', mouth: 'smirk', lips: '#ad1457', extras: [] } },
  // 7 ギャングのボス / マフィアの女ボス
  { m: { skin: '#e0a882', body: { type: 'suit', color: '#1b1b22', pin: true, shirt: '#8e1b1b', tie: 'long', tieColor: '#111', fur: '#9c7a5b', chain: true }, hair: 'fedora', hairColor: '#2a2a2a', hat: '#222228', hatBand: '#b71c1c', eyes: 'glare', brows: 'angry', mouth: 'goldGrin', extras: ['eyepatch', 'scar', 'stubble'] },
    f: { skin: '#f0c4a4', body: { type: 'suit', color: '#16121c', pin: true, shirt: '#5c0f2e', tie: 'none', fur: '#e8e2da' }, hair: 'bigHat', hairColor: '#8e1a1a', hat: '#2a0d2e', hatBand: '#d4a017', eyes: 'sly', lashes: true, brows: 'raised', mouth: 'smirk', lips: '#7b1fa2', extras: ['earringsGold', 'mole'] } },
  // 8 マッドドクター / 悪の魔女
  { m: { skin: '#d6e4cf', body: { type: 'labcoat', color: '#f4f6f8', shirt: '#2e7d32' }, hair: 'wildWhite', hairColor: '#eceff1', eyes: 'crazy', brows: 'angry', mouth: 'teethGrin', extras: ['goggles', 'stitches'] },
    f: { skin: '#a6d785', body: { type: 'robe', color: '#3d1f5c', trim: '#9ccc65' }, hair: 'witch', hairColor: '#7b1fa2', hat: '#24152f', hatBand: '#9ccc65', eyes: 'crazy', lashes: true, brows: 'angry', mouth: 'cackle', lips: '#4a148c', extras: ['wart', 'longNose'] } },
  // 9 魔将
  { m: { skin: '#8a6bc9', body: { type: 'armor', color: '#2b1d3d', trim: '#b0bec5' }, hair: 'spikyWhite', hairColor: '#e6e6ee', horns: '#3e2723', eyes: 'glowRed', brows: 'angry', mouth: 'fangs', extras: ['facepaint'] },
    f: { skin: '#9a7fd6', body: { type: 'armor', color: '#2d1b47', trim: '#cfd8dc' }, hair: 'longSilver', hairColor: '#dfe6ea', horns: '#2a1a5e', eyes: 'glowRed', lashes: true, brows: 'angry', mouth: 'fangsSmirk', lips: '#311b92', extras: ['facepaint'] } },
  // 10 大魔王 / 悪の女帝
  { m: { skin: '#5a3a7e', body: { type: 'royal', color: '#1a0f2e', cape: '#8b0000', collar: '#3a0060' }, hair: 'crownHorns', hairColor: '#120c1c', crown: '#ffc107', horns: '#1a1a1a', eyes: 'glowGold', brows: 'angry', mouth: 'fangs', extras: ['beard', 'aura'] },
    f: { skin: '#6b4a8e', body: { type: 'royal', color: '#1a0f2e', cape: '#8b0000', collar: '#3a0060' }, hair: 'longDark', hairColor: '#2a0a3a', crown: '#ffc107', horns: '#1a1a1a', eyes: 'glowGold', lashes: true, brows: 'angry', mouth: 'fangsSmirk', lips: '#880e4f', extras: ['aura'] } },
];

const Chars = (() => {
  const LONG_HAIR = ['wavy', 'longStraight', 'longBlack', 'longSilver', 'longDark', 'bigHat', 'witch'];
  const { rr, fs, ballGrad, linGrad } = Art;
  const LW = 6;

  /* ---------- からだ ---------- */
  function torsoPath(ctx, w) {
    w = w || 186;
    ctx.beginPath();
    ctx.moveTo(-w, 380); ctx.lineTo(-w, 200);
    ctx.quadraticCurveTo(-w + 4, 118, -78, 104); ctx.lineTo(78, 104);
    ctx.quadraticCurveTo(w - 4, 118, w, 200); ctx.lineTo(w, 380); ctx.closePath();
  }
  function bodyBack(ctx, L) {
    const b = L.body;
    if (b.type === 'royal') {
      // 大きな えり(頭のうしろ)とマント
      ctx.beginPath(); ctx.moveTo(-250, 380); ctx.lineTo(-230, 150); ctx.lineTo(-170, -60); ctx.lineTo(-120, 70); ctx.lineTo(0, 40); ctx.lineTo(120, 70); ctx.lineTo(170, -60); ctx.lineTo(230, 150); ctx.lineTo(250, 380); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, -60, 0, 380, [[0, shade(b.collar, 0.2)], [1, shade(b.collar, -0.4)]]), LW);
      ctx.beginPath(); ctx.moveTo(-170, -60); ctx.lineTo(-120, 70); ctx.moveTo(170, -60); ctx.lineTo(120, 70); ctx.lineWidth = 8; ctx.strokeStyle = '#d4a017'; ctx.stroke();
    }
    if (b.type === 'robe') {
      ctx.beginPath(); ctx.moveTo(-150, 140); ctx.lineTo(-130, 20); ctx.lineTo(-60, 90); ctx.lineTo(60, 90); ctx.lineTo(130, 20); ctx.lineTo(150, 140); ctx.closePath();
      fs(ctx, shade(b.color, -0.2), LW);
    }
  }
  function body(ctx, L) {
    const b = L.body;
    const skin = L.skin;
    // 首
    rr(ctx, -34, 50, 68, 80, 14); fs(ctx, shade(skin, -0.12), LW);
    if (b.type === 'wrestler') {
      torsoPath(ctx, 196); fs(ctx, linGrad(ctx, 0, 100, 0, 380, [[0, shade(skin, 0.05)], [1, shade(skin, -0.25)]]), LW);
      ctx.strokeStyle = shade(skin, -0.35); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-120, 200); ctx.quadraticCurveTo(-60, 250, 0, 214); ctx.quadraticCurveTo(60, 250, 120, 200); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 214); ctx.lineTo(0, 300); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-150, 130); ctx.quadraticCurveTo(-120, 170, -150, 220); ctx.moveTo(150, 130); ctx.quadraticCurveTo(120, 170, 150, 220); ctx.stroke();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 70, 104); ctx.lineTo(s * 100, 380); ctx.lineTo(s * 60, 380); ctx.lineTo(s * 40, 106); ctx.closePath(); fs(ctx, b.color, 5); }
      ctx.beginPath(); ctx.moveTo(-100, 330); ctx.lineTo(100, 330); ctx.lineTo(100, 380); ctx.lineTo(-100, 380); ctx.closePath(); fs(ctx, b.color, 5);
      return;
    }
    torsoPath(ctx);
    fs(ctx, linGrad(ctx, 0, 100, 0, 380, [[0, shade(b.color, 0.12)], [1, shade(b.color, -0.3)]]), LW);
    ctx.save(); torsoPath(ctx); ctx.clip();
    if (b.type === 'tshirt') {
      ctx.fillStyle = b.stripe;
      for (let y = 170; y < 380; y += 56) ctx.fillRect(-200, y, 400, 22);
      ctx.beginPath(); ctx.ellipse(0, 104, 46, 22, 0, 0, Math.PI); fs(ctx, skin, 5);
    } else if (b.type === 'openshirt') {
      ctx.beginPath(); ctx.moveTo(-46, 100); ctx.lineTo(0, 200); ctx.lineTo(46, 100); ctx.closePath(); fs(ctx, skin, 5);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 46, 100); ctx.lineTo(s * 96, 112); ctx.lineTo(s * 30, 168); ctx.closePath(); fs(ctx, shade(b.color, 0.2), 5); }
    } else if (b.type === 'longcoat') {
      ctx.beginPath(); ctx.moveTo(-40, 100); ctx.lineTo(0, 230); ctx.lineTo(40, 100); ctx.closePath(); fs(ctx, '#fbfbf6', 5);
      ctx.strokeStyle = '#d6d6cc'; ctx.lineWidth = 3; for (let y = 130; y < 220; y += 18) { ctx.beginPath(); ctx.moveTo(-30 + (y - 100) * 0.3, y); ctx.lineTo(30 - (y - 100) * 0.3, y); ctx.stroke(); }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 40, 100); ctx.lineTo(s * 4, 236); ctx.lineTo(s * 4, 380); ctx.lineWidth = 10; ctx.strokeStyle = b.trim; ctx.stroke(); }
      for (const s of [-1, 1]) { rr(ctx, s * 64 - 22, 70, 44, 50, 8); fs(ctx, '#ffffff', 5); }
    } else if (b.type === 'sailor') {
      ctx.beginPath(); ctx.moveTo(-120, 104); ctx.lineTo(0, 210); ctx.lineTo(120, 104); ctx.lineTo(160, 150); ctx.lineTo(0, 260); ctx.lineTo(-160, 150); ctx.closePath(); fs(ctx, shade(b.color, 0.15), 5);
      ctx.beginPath(); ctx.moveTo(-104, 112); ctx.lineTo(0, 206); ctx.lineTo(104, 112); ctx.lineWidth = 5; ctx.strokeStyle = b.trim; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30, 200); ctx.lineTo(30, 200); ctx.lineTo(10, 240); ctx.lineTo(24, 300); ctx.lineTo(0, 290); ctx.lineTo(-24, 300); ctx.lineTo(-10, 240); ctx.closePath(); fs(ctx, b.scarf, 5);
    } else if (b.type === 'gakuran') {
      ctx.fillStyle = '#e8c24a';
      for (let y = 160; y < 380; y += 52) { ctx.beginPath(); ctx.arc(0, y, 9, 0, Math.PI * 2); fs(ctx, '#e8c24a', 3); }
      rr(ctx, -54, 88, 108, 34, 10); fs(ctx, shade(b.color, 0.1), 5);
      // かたに かけた 長い上着
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 70, 106); ctx.quadraticCurveTo(s * 200, 110, s * 214, 200); ctx.lineTo(s * 226, 380); ctx.lineTo(s * 150, 380); ctx.quadraticCurveTo(s * 150, 230, s * 70, 140); ctx.closePath();
        fs(ctx, shade(b.color, -0.25), 5);
      }
    } else if (b.type === 'suit') {
      ctx.beginPath(); ctx.moveTo(-50, 100); ctx.lineTo(0, 240); ctx.lineTo(50, 100); ctx.closePath(); fs(ctx, b.shirt, 5);
      if (b.pin) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 3; for (let x = -190; x < 200; x += 26) { ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, 380); ctx.stroke(); } }
      if (b.tie === 'bow') {
        ctx.beginPath(); ctx.moveTo(0, 122); ctx.lineTo(-36, 104); ctx.lineTo(-36, 142); ctx.closePath(); fs(ctx, b.tieColor, 4);
        ctx.beginPath(); ctx.moveTo(0, 122); ctx.lineTo(36, 104); ctx.lineTo(36, 142); ctx.closePath(); fs(ctx, b.tieColor, 4);
        ctx.beginPath(); ctx.arc(0, 122, 9, 0, Math.PI * 2); fs(ctx, shade(b.tieColor, -0.2), 4);
      } else if (b.tie === 'long') {
        ctx.beginPath(); ctx.moveTo(-12, 110); ctx.lineTo(12, 110); ctx.lineTo(20, 220); ctx.lineTo(0, 246); ctx.lineTo(-20, 220); ctx.closePath(); fs(ctx, b.tieColor, 4);
      }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 50, 100); ctx.lineTo(s * 96, 110); ctx.lineTo(s * 60, 170); ctx.lineTo(s * 8, 250); ctx.closePath(); fs(ctx, shade(b.color, 0.18), 5); }
      if (b.pearls) { for (let i = -6; i <= 6; i++) { const a = (i / 6) * 1.1; ctx.beginPath(); ctx.arc(Math.sin(a) * 52, 108 + Math.cos(a) * 36, 7, 0, Math.PI * 2); fs(ctx, '#fffaf0', 2.5); } }
    } else if (b.type === 'labcoat') {
      ctx.beginPath(); ctx.moveTo(-50, 100); ctx.lineTo(0, 220); ctx.lineTo(50, 100); ctx.closePath(); fs(ctx, b.shirt, 5);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 50, 100); ctx.lineTo(s * 100, 112); ctx.lineTo(s * 56, 190); ctx.lineTo(s * 6, 230); ctx.closePath(); fs(ctx, '#ffffff', 5); }
      rr(ctx, 90, 220, 60, 56, 6); fs(ctx, '#ffffff', 4);
      ctx.fillStyle = '#1e88e5'; ctx.fillRect(100, 200, 8, 30); ctx.fillStyle = '#e53935'; ctx.fillRect(116, 196, 8, 34);
      ctx.fillStyle = 'rgba(120,200,80,0.6)'; ctx.beginPath(); ctx.ellipse(-120, 280, 30, 12, 0.4, 0, Math.PI * 2); ctx.fill();
    } else if (b.type === 'robe') {
      ctx.beginPath(); ctx.moveTo(-40, 100); ctx.lineTo(0, 170); ctx.lineTo(40, 100); ctx.closePath(); fs(ctx, shade(b.color, -0.3), 5);
      ctx.beginPath(); ctx.moveTo(-40, 100); ctx.lineTo(0, 170); ctx.lineTo(40, 100); ctx.lineWidth = 7; ctx.strokeStyle = b.trim; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 186, 16, 0, Math.PI * 2); fs(ctx, b.trim, 4);
    } else if (b.type === 'armor') {
      ctx.beginPath(); ctx.moveTo(-120, 130); ctx.lineTo(120, 130); ctx.lineTo(90, 300); ctx.lineTo(0, 340); ctx.lineTo(-90, 300); ctx.closePath(); fs(ctx, shade(b.color, 0.15), 5);
      ctx.beginPath(); ctx.moveTo(0, 160); ctx.lineTo(40, 210); ctx.lineTo(0, 270); ctx.lineTo(-40, 210); ctx.closePath(); fs(ctx, '#c62828', 4);
      ctx.strokeStyle = b.trim; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-120, 130); ctx.lineTo(120, 130); ctx.stroke();
    } else if (b.type === 'royal') {
      ctx.beginPath(); ctx.moveTo(-60, 100); ctx.lineTo(0, 210); ctx.lineTo(60, 100); ctx.closePath(); fs(ctx, '#2a1840', 5);
      ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-60, 100); ctx.lineTo(0, 210); ctx.lineTo(60, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 210); ctx.lineTo(0, 380); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 230, 20, 0, Math.PI * 2); fs(ctx, '#e53935', 5);
      ctx.beginPath(); ctx.arc(-6, 224, 6, 0, Math.PI * 2); ctx.fillStyle = '#ffcdd2'; ctx.fill();
    }
    ctx.restore();
    torsoPath(ctx); ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke();
    if (b.fur) {
      for (let i = -9; i <= 9; i++) { const a = i / 9; ctx.beginPath(); ctx.arc(a * 170, 120 + Math.abs(a) * 30 + Math.sin(i * 2.3) * 4, 30, 0, Math.PI * 2); fs(ctx, i % 2 ? b.fur : shade(b.fur, -0.1), 4); }
    }
    if (b.type === 'armor' || b.type === 'royal') {
      // かたあて(とげ)
      for (const s of [-1, 1]) {
        if (b.type === 'armor') {
          for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * (120 + k * 26), 110 - k * 4); ctx.lineTo(s * (136 + k * 30), 30 - k * 10); ctx.lineTo(s * (150 + k * 26), 112); ctx.closePath(); fs(ctx, b.trim, 4); }
          ctx.beginPath(); ctx.ellipse(s * 160, 150, 70, 52, s * 0.2, 0, Math.PI * 2); fs(ctx, linGrad(ctx, 0, 100, 0, 200, [[0, shade(b.color, 0.35)], [1, shade(b.color, -0.2)]]), LW);
          ctx.beginPath(); ctx.ellipse(s * 160, 150, 50, 34, s * 0.2, Math.PI * 1.1, Math.PI * 1.7); ctx.lineWidth = 5; ctx.strokeStyle = b.trim; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.ellipse(s * 165, 150, 64, 44, s * 0.2, 0, Math.PI * 2); fs(ctx, '#d4a017', LW);
          ctx.beginPath(); ctx.arc(s * 165, 150, 12, 0, Math.PI * 2); fs(ctx, '#7b1fa2', 4);
        }
      }
    }
    if (b.chain) {
      ctx.strokeStyle = '#e8b923'; ctx.lineWidth = 7;
      for (let i = -5; i <= 5; i++) { const a = (i / 5) * 1.05; ctx.beginPath(); ctx.ellipse(Math.sin(a) * 58, 112 + Math.cos(a) * 46, 8, 6, a, 0, Math.PI * 2); ctx.stroke(); }
    }
  }

  /* ---------- かみ(うしろ側) ---------- */
  function hairBack(ctx, L) {
    const c = L.hairColor;
    const h = L.hair;
    if (h === 'pigtails') {
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(s * 128, 30, 42, 64, s * -0.35, 0, Math.PI * 2); fs(ctx, ballGrad(ctx, s * 128, 30, 64, c), LW);
        ctx.beginPath(); ctx.arc(s * 100, -14, 16, 0, Math.PI * 2); fs(ctx, L.ribbon, 5);
      }
    } else if (h === 'wavy' || h === 'longStraight' || h === 'longBlack' || h === 'longSilver' || h === 'longDark' || h === 'bigHat' || h === 'witch') {
      const wide = h === 'wavy' ? 140 : 128;
      ctx.beginPath();
      ctx.moveTo(-96, -60);
      ctx.quadraticCurveTo(-wide - 10, 40, -wide, 240);
      if (h === 'wavy') { ctx.quadraticCurveTo(-110, 270, -90, 240); ctx.quadraticCurveTo(-70, 280, -40, 230); }
      else ctx.lineTo(-60, 250);
      ctx.lineTo(60, 250);
      if (h === 'wavy') { ctx.quadraticCurveTo(70, 280, 90, 240); ctx.quadraticCurveTo(110, 270, wide, 240); }
      else ctx.lineTo(wide, 240);
      ctx.quadraticCurveTo(wide + 10, 40, 96, -60); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, -60, 0, 250, [[0, shade(c, 0.1)], [1, shade(c, -0.25)]]), LW);
    } else if (h === 'bob') {
      ctx.beginPath(); ctx.moveTo(-118, 60); ctx.quadraticCurveTo(-130, -110, 0, -112); ctx.quadraticCurveTo(130, -110, 118, 60); ctx.quadraticCurveTo(0, 74, -118, 60); ctx.closePath();
      fs(ctx, ballGrad(ctx, 0, -20, 130, c), LW);
    } else if (h === 'pony') {
      ctx.beginPath(); ctx.moveTo(60, -90); ctx.quadraticCurveTo(190, -110, 170, 30); ctx.quadraticCurveTo(160, 110, 196, 170); ctx.quadraticCurveTo(120, 150, 124, 40); ctx.quadraticCurveTo(126, -30, 60, -60); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, -110, 0, 170, [[0, shade(c, 0.2)], [1, shade(c, -0.25)]]), LW);
      ctx.beginPath(); ctx.arc(104, -76, 18, 0, Math.PI * 2); fs(ctx, L.ribbon || '#ffd23d', 5);
    } else if (h === 'mask' && L.ponytail) {
      ctx.beginPath(); ctx.moveTo(10, -110); ctx.quadraticCurveTo(170, -150, 150, 40); ctx.quadraticCurveTo(140, 120, 180, 170); ctx.quadraticCurveTo(100, 140, 110, 30); ctx.quadraticCurveTo(110, -60, 10, -80); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, -150, 0, 170, [[0, shade(L.ponytail, 0.2)], [1, shade(L.ponytail, -0.2)]]), LW);
    }
  }

  /* ---------- 頭 ---------- */
  function headShape(ctx, L) {
    const wide = L.body.type === 'wrestler' || L.hair === 'spiky' || L.hair === 'crownHorns';
    ctx.beginPath();
    if (wide) {
      ctx.moveTo(-90, -20); ctx.quadraticCurveTo(-92, -100, 0, -100); ctx.quadraticCurveTo(92, -100, 90, -20);
      ctx.quadraticCurveTo(92, 70, 40, 92); ctx.quadraticCurveTo(0, 104, -40, 92); ctx.quadraticCurveTo(-92, 70, -90, -20);
    } else {
      ctx.ellipse(0, 0, 88, 98, 0, 0, Math.PI * 2);
    }
    ctx.closePath();
  }

  /* ---------- 目 ---------- */
  function eyePair(ctx, L, expr, t, blink) {
    const glow = L.eyes === 'glowRed' || L.eyes === 'glowGold';
    const gcol = L.eyes === 'glowRed' ? '#ff2a2a' : '#ffd21f';
    for (const s of [-1, 1]) {
      const x = s * 34; const y = 6;
      ctx.save(); ctx.translate(x, y);
      if (expr === 'ko') {
        ctx.beginPath();
        for (let i = 0; i < 40; i++) { const a = i * 0.5 + t * 8 * s; const r = i * 0.55; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.lineWidth = 4.5; ctx.strokeStyle = INK; ctx.stroke();
      } else if (expr === 'hurt' || expr === 'guard') {
        ctx.beginPath(); ctx.moveTo(-s * 16, -14); ctx.lineTo(s * 12, 0); ctx.lineTo(-s * 16, 14);
        ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      } else if (expr === 'panic') {
        const jx = Math.sin(t * 60) * 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 21, 25, 0, 0, Math.PI * 2); fs(ctx, '#fff', 5);
        ctx.beginPath(); ctx.arc(jx, 2, 5.5, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      } else if (blink && !glow) {
        ctx.beginPath(); ctx.moveTo(-16, 2); ctx.quadraticCurveTo(0, 8, 16, 2); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      } else if ((expr === 'grin' || expr === 'laugh') && !glow && L.eyes !== 'crazy') {
        // にやり(下が まっすぐ、上が つり上がる)
        ctx.beginPath(); ctx.moveTo(-18, 6); ctx.quadraticCurveTo(0, -12, 18, 6 - s * 2); ctx.quadraticCurveTo(0, 0, -18, 6); ctx.closePath();
        fs(ctx, INK, 4);
      } else if (glow) {
        ctx.save();
        ctx.shadowColor = gcol; ctx.shadowBlur = 26;
        ctx.beginPath(); ctx.moveTo(-s * 22, 8); ctx.quadraticCurveTo(-s * 4, -16, s * 24, -10); ctx.quadraticCurveTo(s * 8, 14, -s * 22, 8); ctx.closePath();
        fs(ctx, gcol, 5);
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(s * 2, -2, 3.5, 9, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      } else if (L.eyes === 'round') {
        ctx.beginPath(); ctx.ellipse(0, 0, 17, 21, 0, 0, Math.PI * 2); fs(ctx, '#fff', 5);
        ctx.beginPath(); ctx.arc(1, 3, 11, 0, Math.PI * 2); ctx.fillStyle = '#3b2412'; ctx.fill();
        ctx.beginPath(); ctx.arc(1, 3, 6, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
        ctx.beginPath(); ctx.arc(-3, -3, 4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      } else if (L.eyes === 'half') {
        ctx.beginPath(); ctx.ellipse(0, 2, 18, 15, 0, 0, Math.PI * 2); fs(ctx, '#fff', 5);
        ctx.beginPath(); ctx.arc(s * 3, 5, 8, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -6, 21, 12, 0, Math.PI, 0); ctx.closePath(); fs(ctx, L.skin);
        ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(20, -4); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      } else if (L.eyes === 'glare') {
        ctx.beginPath(); ctx.moveTo(-s * 20, -2); ctx.lineTo(s * 20, -12); ctx.quadraticCurveTo(s * 18, 12, -s * 2, 12); ctx.quadraticCurveTo(-s * 18, 10, -s * 20, -2); ctx.closePath();
        fs(ctx, '#fff', 5);
        ctx.beginPath(); ctx.arc(-s * 2, 3, 6, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-s * 22, -2); ctx.lineTo(s * 22, -14); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      } else if (L.eyes === 'sly') {
        ctx.beginPath(); ctx.moveTo(-20, 2); ctx.quadraticCurveTo(0, -10, 20, 0); ctx.quadraticCurveTo(0, 8, -20, 2); ctx.closePath(); fs(ctx, '#fff', 4);
        ctx.beginPath(); ctx.arc(s * 8, 0, 5.5, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-22, 1); ctx.quadraticCurveTo(0, -12, 22, -1); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      } else if (L.eyes === 'crazy') {
        const r = s < 0 ? 24 : 15;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); fs(ctx, '#fffde8', 5);
        ctx.strokeStyle = '#e57373'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const a = i * 2 + 0.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); ctx.stroke(); }
        ctx.beginPath(); for (let i = 0; i < 26; i++) { const a = i * 0.6 + t * 5; const rr2 = i * 0.32; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
        ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      }
      if (L.lashes && expr !== 'ko' && expr !== 'hurt' && expr !== 'guard' && !glow) {
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(s * 16, -10 + k * 7); ctx.lineTo(s * 27, -16 + k * 7); ctx.stroke(); }
      }
      ctx.restore();
    }
  }
  function browPair(ctx, L, expr) {
    if (L.brows === 'none' && expr !== 'panic') return;
    for (const s of [-1, 1]) {
      let yi = -30; let yo = -36; // 内がわ・外がわ
      if (L.brows === 'angry' || L.brows === 'thick' || expr === 'grin' || expr === 'laugh') { yi = -22; yo = -44; }
      if (L.brows === 'raised' && s > 0) { yi = -40; yo = -46; }
      if (expr === 'panic' || expr === 'hurt' || expr === 'ko') { yi = -46; yo = -30; }
      if (expr === 'guard') { yi = -24; yo = -34; }
      ctx.beginPath(); ctx.moveTo(s * 14, yi); ctx.quadraticCurveTo(s * 34, Math.min(yi, yo) - 6, s * 58, yo);
      ctx.lineCap = 'round';
      ctx.lineWidth = L.brows === 'thick' ? 15 : L.brows === 'thin' ? 6 : 9;
      ctx.strokeStyle = L.hair === 'mask' ? INK : shade(L.hairColor || '#222', -0.35);
      ctx.stroke();
    }
  }

  /* ---------- 口 ---------- */
  function mouth(ctx, L, expr, t) {
    let m = L.mouth;
    if (m === 'none') return;
    if (expr === 'grin' || expr === 'laugh') m = (L.mouth === 'fangs' || L.mouth === 'fangsSmirk') ? 'fangs' : L.mouth === 'tongue' || L.mouth === 'toothy' ? 'toothy' : 'cackle';
    if (expr === 'panic') m = 'wavy';
    if (expr === 'hurt') m = 'ouch';
    if (expr === 'guard') m = 'grit';
    if (expr === 'ko') m = 'koTongue';
    const lip = L.lips;
    ctx.save(); ctx.translate(0, 52);
    const dark = '#5a1222';
    if (m === 'toothy' || m === 'cackle' || m === 'teethGrin' || m === 'goldGrin' || m === 'fangs') {
      const w = m === 'teethGrin' ? 44 : m === 'cackle' ? 34 : 30;
      const d = m === 'cackle' ? 34 + Math.sin(t * 30) * 4 : m === 'teethGrin' ? 22 : 26;
      ctx.beginPath(); ctx.moveTo(-w, -6); ctx.quadraticCurveTo(0, 2, w, -6); ctx.quadraticCurveTo(w * 0.7, d, 0, d); ctx.quadraticCurveTo(-w * 0.7, d, -w, -6); ctx.closePath();
      fs(ctx, dark, 5, lip || INK);
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(-w, -8, w * 2, 12);
      if (m === 'teethGrin') { ctx.fillRect(-w, d - 9, w * 2, 10); ctx.strokeStyle = '#9a9aa5'; ctx.lineWidth = 2; for (let x = -w + 9; x < w; x += 9) { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x, d); ctx.stroke(); } }
      if (m === 'goldGrin') { ctx.fillStyle = '#ffc61a'; ctx.fillRect(6, -8, 10, 12); }
      if (m === 'cackle' || m === 'toothy') { ctx.fillStyle = '#ff7c8f'; ctx.beginPath(); ctx.ellipse(0, d, w * 0.5, 10, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      if (m === 'fangs') { for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 20, -3); ctx.lineTo(s * 13, 14); ctx.lineTo(s * 8, -3); ctx.closePath(); fs(ctx, '#fff', 3); } }
    } else if (m === 'tongue') {
      ctx.beginPath(); ctx.moveTo(-26, -2); ctx.quadraticCurveTo(0, 16, 26, -2); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, 6); ctx.quadraticCurveTo(10, 26, 20, 22); ctx.quadraticCurveTo(28, 14, 22, 2); fs(ctx, '#ff6f86', 4);
    } else if (m === 'smirk' || m === 'sneer' || m === 'fangsSmirk') {
      ctx.beginPath(); ctx.moveTo(-24, 4); ctx.quadraticCurveTo(4, 12, 26, -8);
      ctx.lineWidth = lip ? 9 : 6; ctx.strokeStyle = lip || INK; ctx.lineCap = 'round'; ctx.stroke();
      if (m === 'sneer') { ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(24, -6); ctx.lineTo(22, 6); ctx.closePath(); fs(ctx, '#fff', 3); }
      if (m === 'fangsSmirk') { ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(15, 20); ctx.lineTo(20, 2); ctx.closePath(); fs(ctx, '#fff', 3); }
    } else if (m === 'grit') {
      rr(ctx, -30, -10, 60, 24, 8); fs(ctx, '#fff', 5);
      ctx.strokeStyle = '#8c8c98'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-28, 2); ctx.lineTo(28, 2); ctx.stroke();
      for (let x = -18; x <= 18; x += 12) { ctx.beginPath(); ctx.moveTo(x, -9); ctx.lineTo(x, 13); ctx.stroke(); }
    } else if (m === 'wavy') {
      ctx.beginPath(); ctx.ellipse(0, 6, 12, 16, 0, 0, Math.PI * 2); fs(ctx, dark, 5, lip || INK);
    } else if (m === 'ouch') {
      ctx.beginPath(); ctx.moveTo(-28, 0);
      for (let i = 0; i <= 8; i++) ctx.lineTo(-28 + i * 7, i % 2 ? -6 : 6);
      ctx.lineTo(28, 22); ctx.lineTo(-28, 22); ctx.closePath(); fs(ctx, dark, 5);
    } else if (m === 'koTongue') {
      ctx.beginPath(); ctx.ellipse(0, 4, 24, 14, 0, 0, Math.PI * 2); fs(ctx, dark, 5);
      ctx.beginPath(); ctx.moveTo(-8, 8); ctx.quadraticCurveTo(-10, 36, 4, 36); ctx.quadraticCurveTo(16, 34, 12, 8); fs(ctx, '#ff6f86', 4);
    }
    ctx.restore();
  }

  /* ---------- 顔の小物 ---------- */
  function faceExtras(ctx, L, expr, t) {
    const ex = L.extras || [];
    const has = (k) => ex.includes(k);
    if (has('blush') || expr === 'panic') {
      ctx.fillStyle = expr === 'panic' ? 'rgba(120,160,255,0.35)' : 'rgba(255,110,130,0.4)';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 52, 36, 16, 9, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (has('freckles')) { ctx.fillStyle = 'rgba(150,80,40,0.6)'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(s * (44 + i * 8), 30 + (i % 2) * 6, 2.6, 0, Math.PI * 2); ctx.fill(); } }
    if (has('stubble') || has('beard')) {
      ctx.fillStyle = 'rgba(60,70,90,0.22)';
      ctx.beginPath(); ctx.moveTo(-70, 40); ctx.quadraticCurveTo(-60, 98, 0, 100); ctx.quadraticCurveTo(60, 98, 70, 40); ctx.quadraticCurveTo(40, 70, 0, 72); ctx.quadraticCurveTo(-40, 70, -70, 40); ctx.fill();
    }
    if (has('facepaint')) {
      ctx.fillStyle = 'rgba(30,0,40,0.75)';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 20, 26); ctx.lineTo(s * 56, 24); ctx.lineTo(s * 40, 62); ctx.closePath(); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-8, -60); ctx.lineTo(8, -60); ctx.lineTo(0, -36); ctx.closePath(); ctx.fill();
    }
    // 鼻
    if (has('longNose')) {
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.quadraticCurveTo(10, 30, 30, 48); ctx.quadraticCurveTo(14, 50, 0, 38); fs(ctx, shade(L.skin, -0.1), 5);
      ctx.beginPath(); ctx.arc(26, 40, 7, 0, Math.PI * 2); fs(ctx, '#6d9c4a', 3);
    } else {
      ctx.beginPath(); ctx.moveTo(-2, 18); ctx.quadraticCurveTo(10, 32, -4, 34); ctx.lineWidth = 5; ctx.strokeStyle = shade(L.skin, -0.35); ctx.stroke();
    }
    if (has('bandaid')) {
      ctx.save(); ctx.translate(4, 26); ctx.rotate(-0.4); rr(ctx, -22, -8, 44, 16, 6); fs(ctx, '#f7d7a8', 3); ctx.fillStyle = '#e9b98a'; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
    }
    if (has('mustache')) {
      ctx.beginPath(); ctx.moveTo(0, 40); ctx.quadraticCurveTo(-20, 32, -36, 40); ctx.quadraticCurveTo(-46, 42, -46, 32);
      ctx.moveTo(0, 40); ctx.quadraticCurveTo(20, 32, 36, 40); ctx.quadraticCurveTo(46, 42, 46, 32);
      ctx.lineWidth = 7; ctx.strokeStyle = '#3a2a1a'; ctx.stroke();
    }
    if (has('scar')) {
      ctx.strokeStyle = '#a3423a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-58, -30); ctx.lineTo(-20, 40); ctx.stroke();
      ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const px = -54 + i * 10; const py = -22 + i * 18; ctx.beginPath(); ctx.moveTo(px - 7, py + 4); ctx.lineTo(px + 7, py - 4); ctx.stroke(); }
    }
    if (has('stitches')) {
      ctx.strokeStyle = '#4a3a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, -60); ctx.lineTo(70, -40); ctx.stroke();
      ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const px = 26 + i * 13; const py = -58 + i * 5.2; ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8); ctx.stroke(); }
    }
    if (has('mole')) { ctx.beginPath(); ctx.arc(30, 72, 3.6, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }
    if (has('wart')) { ctx.beginPath(); ctx.arc(-50, 50, 6, 0, Math.PI * 2); fs(ctx, '#6d9c4a', 3); }
    if (has('gum') && expr === 'normal') {
      const r = 10 + (Math.sin(t * 1.4) * 0.5 + 0.5) * 14;
      ctx.beginPath(); ctx.arc(14, 62, r, 0, Math.PI * 2); fs(ctx, 'rgba(255,140,190,0.9)', 4);
      ctx.beginPath(); ctx.arc(14 - r * 0.35, 62 - r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }
    if (has('grass') && expr !== 'ko' && expr !== 'hurt') {
      ctx.beginPath(); ctx.moveTo(18, 56); ctx.quadraticCurveTo(50, 44, 76, 20); ctx.lineWidth = 5; ctx.strokeStyle = '#3c8d2f'; ctx.stroke();
    }
    if (has('facemask')) {
      ctx.beginPath(); ctx.moveTo(-70, 22); ctx.quadraticCurveTo(0, 6, 70, 22); ctx.quadraticCurveTo(66, 92, 0, 98); ctx.quadraticCurveTo(-66, 92, -70, 22); ctx.closePath();
      fs(ctx, '#fafafa', 5);
      ctx.strokeStyle = '#cfd3da'; ctx.lineWidth = 3; for (const y of [42, 58, 74]) { ctx.beginPath(); ctx.moveTo(-56, y); ctx.quadraticCurveTo(0, y + 6, 56, y); ctx.stroke(); }
      ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 70, 26); ctx.lineTo(s * 88, 10); ctx.stroke(); }
    }
    if (has('eyepatch')) {
      ctx.beginPath(); ctx.moveTo(-90, -40); ctx.lineTo(80, -10); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-34, 8, 26, 22, 0, 0, Math.PI * 2); fs(ctx, '#121216', 4);
    }
    if (has('monocle')) {
      ctx.beginPath(); ctx.arc(34, 6, 27, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = '#d4a017'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 14); ctx.quadraticCurveTo(76, 60, 66, 100); ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(34, 6, 27, 3.6, 4.4); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    }
    if (has('catglasses')) {
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 8, 0); ctx.quadraticCurveTo(s * 10, 22, s * 34, 24); ctx.quadraticCurveTo(s * 56, 22, s * 60, 6); ctx.lineTo(s * 70, -18); ctx.quadraticCurveTo(s * 40, -12, s * 8, 0); ctx.closePath();
        ctx.fillStyle = 'rgba(200,220,255,0.18)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#c2185b'; ctx.stroke();
      }
    }
    if (has('earring')) { ctx.beginPath(); ctx.arc(-90, 34, 8, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = '#e8c24a'; ctx.stroke(); }
    if (has('earringsGold')) { for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 90, 46, 15, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = '#e8b923'; ctx.stroke(); } }
    if (has('beard')) {
      ctx.beginPath(); ctx.moveTo(-86, 10); ctx.quadraticCurveTo(-90, 100, -40, 140); ctx.lineTo(0, 190); ctx.lineTo(40, 140); ctx.quadraticCurveTo(90, 100, 86, 10);
      ctx.quadraticCurveTo(70, 70, 40, 76); ctx.quadraticCurveTo(0, 60, -40, 76); ctx.quadraticCurveTo(-70, 70, -86, 10); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, 10, 0, 190, [[0, shade(L.hairColor, 0.15)], [1, shade(L.hairColor, -0.2)]]), LW);
    }
  }

  /* ---------- かみ(前側)・ぼうし・つの ---------- */
  function hairFront(ctx, L, t) {
    const c = L.hairColor;
    const h = L.hair;
    const hairG = (y0, y1) => linGrad(ctx, 0, y0, 0, y1, [[0, shade(c, 0.22)], [1, shade(c, -0.18)]]);
    const shine = (x, y, w, rot) => { ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, rot || -0.3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(); };
    if (h === 'cap') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 82, -24, 18, 28, s * 0.4, 0, Math.PI * 2); fs(ctx, c, 5); }
      ctx.beginPath(); ctx.ellipse(0, -112, 70, 20, 0, Math.PI, 0); fs(ctx, shade(L.cap, -0.25), 5);
      ctx.beginPath(); ctx.moveTo(-94, -34); ctx.quadraticCurveTo(-96, -118, 0, -120); ctx.quadraticCurveTo(96, -118, 94, -34); ctx.quadraticCurveTo(0, -54, -94, -34); ctx.closePath();
      fs(ctx, ballGrad(ctx, 0, -80, 100, L.cap), LW);
      ctx.beginPath(); ctx.moveTo(-26, -44); ctx.quadraticCurveTo(0, -84, 26, -44); ctx.closePath(); fs(ctx, c, 4);
      ctx.beginPath(); ctx.moveTo(-94, -34); ctx.quadraticCurveTo(0, -54, 94, -34); ctx.lineWidth = 9; ctx.strokeStyle = shade(L.cap, -0.3); ctx.stroke();
      shine(-40, -92, 26);
    } else if (h === 'pigtails' || h === 'pony' || h === 'longBlack' || h === 'longSilver' || h === 'longDark' || h === 'longStraight') {
      ctx.beginPath();
      ctx.moveTo(-96, 10); ctx.quadraticCurveTo(-104, -110, 0, -112); ctx.quadraticCurveTo(104, -110, 96, 10);
      if (h === 'longStraight') { ctx.quadraticCurveTo(70, -40, 6, -70); ctx.quadraticCurveTo(-70, -40, -96, 10); }
      else { ctx.lineTo(80, -40); for (let i = 0; i < 6; i++) { const x = 80 - (i + 0.5) * 28; ctx.lineTo(x, -30 - (i % 2) * 22); } ctx.lineTo(-82, -40); }
      ctx.closePath();
      fs(ctx, hairG(-112, 10), LW);
      shine(-36, -84, 30);
      if (L.band) {
        ctx.beginPath(); ctx.moveTo(-98, -46); ctx.quadraticCurveTo(0, -78, 98, -46); ctx.lineWidth = 18; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = L.band; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(96, -48); ctx.quadraticCurveTo(140, -40, 150, -10); ctx.moveTo(96, -48); ctx.quadraticCurveTo(140, -70, 160, -50); ctx.lineWidth = 12; ctx.stroke();
      }
    } else if (h === 'slick' || h === 'slickPart') {
      ctx.beginPath(); ctx.moveTo(-92, -10); ctx.quadraticCurveTo(-100, -116, 0, -114); ctx.quadraticCurveTo(100, -116, 92, -10);
      ctx.quadraticCurveTo(84, -50, 40, -62); ctx.quadraticCurveTo(0, -70, -40, -62); ctx.quadraticCurveTo(-84, -50, -92, -10); ctx.closePath();
      fs(ctx, hairG(-116, -10), LW);
      ctx.strokeStyle = shade(c, 0.35); ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 26, -66); ctx.quadraticCurveTo(i * 30, -100, i * 20, -112); ctx.stroke(); }
      if (h === 'slickPart') { ctx.beginPath(); ctx.moveTo(-30, -64); ctx.quadraticCurveTo(-40, -90, -34, -112); ctx.lineWidth = 4; ctx.strokeStyle = shade(c, -0.4); ctx.stroke(); ctx.beginPath(); ctx.arc(-20, -58, 10, 3.5, 6.5); ctx.lineWidth = 6; ctx.strokeStyle = c; ctx.stroke(); }
      shine(30, -92, 24, 0.3);
    } else if (h === 'wavy') {
      ctx.beginPath(); ctx.moveTo(-100, 20); ctx.quadraticCurveTo(-106, -114, 0, -112); ctx.quadraticCurveTo(106, -114, 100, 20);
      ctx.quadraticCurveTo(80, -60, 20, -70); ctx.quadraticCurveTo(-30, -50, -60, -20); ctx.quadraticCurveTo(-80, 0, -100, 20); ctx.closePath();
      fs(ctx, hairG(-114, 20), LW);
      shine(30, -86, 28, 0.3);
    } else if (h === 'pompadour') {
      ctx.beginPath(); ctx.moveTo(-92, 0); ctx.quadraticCurveTo(-100, -90, -60, -86); ctx.lineTo(60, -86); ctx.quadraticCurveTo(100, -90, 92, 0); ctx.quadraticCurveTo(86, -50, 50, -58); ctx.lineTo(-50, -58); ctx.quadraticCurveTo(-86, -50, -92, 0); ctx.closePath();
      fs(ctx, hairG(-90, 0), LW);
      // 前につき出た リーゼント
      ctx.beginPath(); ctx.moveTo(-80, -70); ctx.quadraticCurveTo(-90, -170, 30, -178); ctx.quadraticCurveTo(150, -180, 140, -110); ctx.quadraticCurveTo(130, -60, 60, -66); ctx.quadraticCurveTo(0, -60, -80, -70); ctx.closePath();
      fs(ctx, hairG(-180, -60), LW);
      ctx.strokeStyle = shade(c, 0.4); ctx.lineWidth = 3.5;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-60 + i * 30, -80); ctx.quadraticCurveTo(-30 + i * 36, -160 + i * 6, 70 + i * 16, -150 + i * 14); ctx.stroke(); }
      shine(20, -150, 40, -0.05);
    } else if (h === 'spiky' || h === 'spikyWhite') {
      ctx.beginPath(); ctx.moveTo(-94, 0);
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + (i / n) * Math.PI;
        const r1 = 140 + (i % 2 ? 0 : 0);
        const ax = Math.cos(a - 0.12) * 96; const ay = Math.sin(a - 0.12) * 100 - 10;
        ctx.lineTo(ax, ay);
        ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 - 26);
      }
      ctx.lineTo(94, 0); ctx.quadraticCurveTo(70, -60, 30, -56); ctx.lineTo(10, -40); ctx.lineTo(-10, -60); ctx.lineTo(-40, -48); ctx.quadraticCurveTo(-74, -60, -94, 0); ctx.closePath();
      fs(ctx, hairG(-160, 0), LW);
      shine(-30, -96, 26);
    } else if (h === 'bob') {
      ctx.beginPath(); ctx.moveTo(-104, 20); ctx.quadraticCurveTo(-112, -112, 0, -114); ctx.quadraticCurveTo(112, -112, 104, 20); ctx.lineTo(90, -30); ctx.lineTo(-90, -30); ctx.closePath();
      fs(ctx, hairG(-114, 20), LW);
      shine(-30, -86, 30);
    } else if (h === 'mask') {
      // 覆面は 頭の上に ぬる(目と口だけ あく)
    } else if (h === 'fedora' || h === 'bigHat') {
      const big = h === 'bigHat';
      if (!big) for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 86, -20, 14, 24, 0, 0, Math.PI * 2); fs(ctx, c, 5); }
      ctx.save(); if (big) ctx.rotate(-0.12);
      ctx.beginPath(); ctx.ellipse(0, -56, big ? 190 : 150, big ? 40 : 30, 0, 0, Math.PI * 2); fs(ctx, linGrad(ctx, 0, -90, 0, -20, [[0, shade(L.hat, 0.25)], [1, shade(L.hat, -0.2)]]), LW);
      ctx.beginPath(); ctx.moveTo(-86, -60); ctx.lineTo(-74, -160); ctx.quadraticCurveTo(-30, -150, 0, -176); ctx.quadraticCurveTo(30, -150, 74, -160); ctx.lineTo(86, -60); ctx.quadraticCurveTo(0, -46, -86, -60); ctx.closePath();
      fs(ctx, linGrad(ctx, -86, 0, 86, 0, [[0, shade(L.hat, 0.2)], [0.5, L.hat], [1, shade(L.hat, -0.3)]]), LW);
      ctx.beginPath(); ctx.moveTo(-84, -84); ctx.quadraticCurveTo(0, -70, 84, -84); ctx.lineTo(86, -62); ctx.quadraticCurveTo(0, -48, -86, -62); ctx.closePath(); fs(ctx, L.hatBand, 4);
      ctx.restore();
    } else if (h === 'wildWhite') {
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * 0.92 + (i / 16) * Math.PI * 1.16;
        const r = i % 2 ? 108 : 150 + Math.sin(i * 1.7 + t * 3) * 8;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9 - 6);
      }
      ctx.quadraticCurveTo(60, -70, 0, -80); ctx.quadraticCurveTo(-60, -70, -96, 10);
      ctx.closePath();
      fs(ctx, hairG(-150, 20), LW);
    } else if (h === 'witch') {
      ctx.beginPath(); ctx.moveTo(-96, 10); ctx.quadraticCurveTo(-104, -100, 0, -104); ctx.quadraticCurveTo(104, -100, 96, 10); ctx.lineTo(70, -46); ctx.lineTo(30, -36); ctx.lineTo(0, -56); ctx.lineTo(-40, -34); ctx.lineTo(-76, -46); ctx.closePath();
      fs(ctx, hairG(-104, 10), LW);
      ctx.beginPath(); ctx.ellipse(0, -76, 180, 34, -0.06, 0, Math.PI * 2); fs(ctx, linGrad(ctx, 0, -110, 0, -40, [[0, shade(L.hat, 0.3)], [1, shade(L.hat, -0.2)]]), LW);
      ctx.beginPath(); ctx.moveTo(-84, -86); ctx.quadraticCurveTo(-30, -200, 20, -250); ctx.quadraticCurveTo(70, -280, 120, -240); ctx.quadraticCurveTo(70, -250, 60, -200); ctx.quadraticCurveTo(70, -140, 86, -90); ctx.quadraticCurveTo(0, -70, -84, -86); ctx.closePath();
      fs(ctx, linGrad(ctx, -84, 0, 86, 0, [[0, shade(L.hat, 0.2)], [1, shade(L.hat, -0.35)]]), LW);
      ctx.beginPath(); ctx.moveTo(-80, -104); ctx.quadraticCurveTo(0, -94, 82, -110); ctx.lineTo(84, -92); ctx.quadraticCurveTo(0, -76, -82, -88); ctx.closePath(); fs(ctx, L.hatBand, 4);
      rr(ctx, -16, -112, 32, 26, 4); fs(ctx, '#ffd54f', 4);
    } else if (h === 'crownHorns') {
      ctx.beginPath(); ctx.moveTo(-92, -10); ctx.quadraticCurveTo(-100, -112, 0, -110); ctx.quadraticCurveTo(100, -112, 92, -10); ctx.quadraticCurveTo(60, -70, 0, -66); ctx.quadraticCurveTo(-60, -70, -92, -10); ctx.closePath();
      fs(ctx, hairG(-112, -10), LW);
    }
    if (LONG_HAIR.includes(h) && h !== 'bigHat') {
      // 肩の前に 落ちる 横の かみ
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 80, -44); ctx.quadraticCurveTo(s * 124, 40, s * 122, 210); ctx.lineTo(s * 80, 220); ctx.quadraticCurveTo(s * 94, 70, s * 72, 0); ctx.closePath();
        fs(ctx, linGrad(ctx, 0, -40, 0, 220, [[0, shade(c, 0.12)], [1, shade(c, -0.25)]]), LW);
      }
    }
    if (L.horns) horns(ctx, L.horns, h === 'crownHorns' || h === 'longDark');
    if (L.crown) crown(ctx, L.crown, t);
    const ex = L.extras || [];
    if (ex.includes('shadesOnHead')) {
      ctx.save(); ctx.translate(0, -80);
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      for (const s of [-1, 1]) { rr(ctx, s * 14 + (s < 0 ? -50 : 0), -14, 50, 30, 12); fs(ctx, linGrad(ctx, 0, -14, 0, 16, [[0, '#3a3d55'], [1, '#0b0c14']]), 5); ctx.beginPath(); ctx.moveTo(s * 22, -8); ctx.lineTo(s * 34, -8); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke(); }
      ctx.restore();
    }
    if (ex.includes('goggles')) {
      ctx.beginPath(); ctx.moveTo(-96, -60); ctx.quadraticCurveTo(0, -80, 96, -60); ctx.lineWidth = 12; ctx.strokeStyle = '#4e342e'; ctx.stroke();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 34, -70, 26, 0, Math.PI * 2); fs(ctx, '#8d6e63', 5); ctx.beginPath(); ctx.arc(s * 34, -70, 17, 0, Math.PI * 2); fs(ctx, linGrad(ctx, 0, -86, 0, -54, [[0, '#b2ff59'], [1, '#33691e']]), 3); }
    }
  }
  function horns(ctx, col, big) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      if (big) { ctx.moveTo(s * 46, -78); ctx.quadraticCurveTo(s * 176, -96, s * 170, -236); ctx.quadraticCurveTo(s * 150, -120, s * 96, -44); }
      else { ctx.moveTo(s * 48, -86); ctx.quadraticCurveTo(s * 136, -110, s * 128, -200); ctx.quadraticCurveTo(s * 118, -116, s * 88, -56); }
      ctx.closePath();
      fs(ctx, linGrad(ctx, s * 60, -60, s * 140, -210, [[0, shade(col, 0.25)], [1, shade(col, -0.4)]]), LW);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(s * (64 + k * 14), -86 - k * 22); ctx.lineTo(s * (84 + k * 14), -80 - k * 22); ctx.stroke(); }
    }
  }
  function crown(ctx, col, t) {
    ctx.save(); ctx.translate(0, -104);
    ctx.beginPath(); ctx.moveTo(-64, 10); ctx.lineTo(-74, -50); ctx.lineTo(-40, -22); ctx.lineTo(-20, -70); ctx.lineTo(0, -28); ctx.lineTo(20, -70); ctx.lineTo(40, -22); ctx.lineTo(74, -50); ctx.lineTo(64, 10); ctx.closePath();
    fs(ctx, linGrad(ctx, 0, -70, 0, 10, [[0, '#fff3b0'], [0.4, col], [1, shade(col, -0.35)]]), LW);
    for (const [x, y, c2] of [[0, -6, '#e53935'], [-38, -4, '#1e88e5'], [38, -4, '#43a047']]) { ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); fs(ctx, c2, 3); }
    const tw = (Math.sin(t * 3) * 0.5 + 0.5);
    Art.star(ctx, -20, -66, 7 + tw * 5, t, '#fff', 0);
    ctx.restore();
  }

  /* ---------- 覆面 ---------- */
  function maskOver(ctx, L) {
    ctx.save(); headShape(ctx, L); ctx.clip();
    ctx.fillStyle = ballGrad(ctx, 0, -10, 110, L.mask); ctx.fillRect(-120, -120, 240, 240);
    // ほのおの もよう
    ctx.beginPath(); ctx.moveTo(-70, -40);
    for (let i = 0; i <= 6; i++) { const x = -70 + i * 23.3; ctx.lineTo(x - 10, -40 - (i % 2 ? 60 : 30)); ctx.lineTo(x, -50); }
    ctx.lineTo(70, -40); ctx.quadraticCurveTo(0, -20, -70, -40); ctx.closePath(); fs(ctx, L.flames, 4);
    // 目と口のまわり
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 36, 4, 32, 26, s * 0.25, 0, Math.PI * 2); fs(ctx, L.maskTrim, 0); ctx.beginPath(); ctx.ellipse(s * 36, 4, 25, 19, s * 0.25, 0, Math.PI * 2); ctx.fillStyle = L.skin; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(0, 60, 42, 30, 0, 0, Math.PI * 2); fs(ctx, L.maskTrim, 0);
    ctx.beginPath(); ctx.ellipse(0, 60, 34, 23, 0, 0, Math.PI * 2); ctx.fillStyle = L.skin; ctx.fill();
    ctx.restore();
    // ひも
    ctx.strokeStyle = L.maskTrim; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -98); ctx.lineTo(0, -60); ctx.stroke();
  }

  /* ---------- たんこぶ ---------- */
  function tankobu(ctx, k, x) {
    if (k <= 0) return;
    const r = 26 * k;
    ctx.beginPath(); ctx.ellipse(x || 14, -96 - r * 0.7, r, r * 1.05, 0, Math.PI, 0); ctx.closePath();
    fs(ctx, ballGrad(ctx, x || 14, -96 - r * 0.7, r, '#ff8a9e'), 5);
    ctx.beginPath(); ctx.ellipse((x || 14) - r * 0.3, -96 - r * 1.3, r * 0.28, r * 0.16, -0.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
  }

  function aura(ctx, t, strength) {
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + t * 0.4;
      const r = 210 + Math.sin(t * 3 + i * 1.7) * 26;
      const x = Math.cos(a) * r * 1.1; const y = Math.sin(a) * r * 0.9 + 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 120);
      g.addColorStop(0, 'rgba(150,40,220,' + 0.32 * strength + ')'); g.addColorStop(1, 'rgba(60,0,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 120, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* 相手を描く
     o: { expr, t, blink, armor(id|null), armorK(0〜1 かぶり具合), squash, tankobu(0〜1), sweat } */
  function drawOpp(ctx, L, o) {
    const t = o.t || 0;
    const expr = o.expr || 'normal';
    if ((L.extras || []).includes('aura')) aura(ctx, t, 1);
    const longHair = LONG_HAIR.includes(L.hair);
    if (longHair) hairBack(ctx, L);
    bodyBack(ctx, L);
    body(ctx, L);
    ctx.save();
    // 頭だけ つぶれる(たたかれた時)
    const sq = o.squash || 0;
    ctx.translate(0, 90); ctx.scale(1 + sq * 0.6, 1 - sq); ctx.translate(0, -90);
    if (!longHair) hairBack(ctx, L);
    // 耳
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 88, 12, 15, 22, 0, 0, Math.PI * 2); fs(ctx, shade(L.skin, -0.05), 5); }
    headShape(ctx, L);
    fs(ctx, ballGrad(ctx, 0, 0, 100, L.skin), LW);
    if (L.hair === 'mask') maskOver(ctx, L);
    const covered = o.armor && Art.fullFace(o.armor) && (o.armorK || 0) >= 1;
    if (!covered) {
      faceExtras(ctx, L, expr, t);
      eyePair(ctx, L, expr, t, o.blink);
      browPair(ctx, L, expr);
      mouth(ctx, L, expr, t);
    }
    if (L.hair === 'mask') { headShape(ctx, L); ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke(); }
    hairFront(ctx, L, t);
    if (o.armor && (o.armorK || 0) >= 1) { ctx.save(); ctx.rotate(o.armorWobble || 0); Art.armor(ctx, o.armor, 'front'); ctx.restore(); }
    if (!o.armor) tankobu(ctx, o.tankobu || 0);
    if (o.sweat && !covered) {
      for (const [x, y, k] of [[78, -40, 1], [-84, -10, 0.8], [96, 20, 0.7]]) {
        const yy = y + ((t * 60 * k) % 30);
        ctx.beginPath(); ctx.moveTo(x, yy - 16 * k); ctx.quadraticCurveTo(x + 10 * k, yy, x, yy + 6 * k); ctx.quadraticCurveTo(x - 10 * k, yy, x, yy - 16 * k);
        fs(ctx, '#9fdcff', 3);
      }
    }
    ctx.restore();
  }

  /* 自分(うしろ姿)。原点 = 頭の中心 */
  const PLAYER = {
    m: { skin: '#f2c29b', hair: '#2b2118', shirt: '#2f6fe0', shirt2: '#ffffff' },
    f: { skin: '#f6cba8', hair: '#5b2d1a', shirt: '#ff4f8b', shirt2: '#ffffff', tie: '#ffd23d' },
  };
  function drawPlayer(ctx, gender, o) {
    const P = PLAYER[gender] || PLAYER.m;
    const t = o.t || 0;
    // かた・せなか
    ctx.beginPath(); ctx.moveTo(-250, 420); ctx.lineTo(-240, 210); ctx.quadraticCurveTo(-230, 120, -90, 100); ctx.lineTo(90, 100); ctx.quadraticCurveTo(230, 120, 240, 210); ctx.lineTo(250, 420); ctx.closePath();
    fs(ctx, linGrad(ctx, 0, 100, 0, 420, [[0, shade(P.shirt, 0.15)], [1, shade(P.shirt, -0.35)]]), LW);
    ctx.save(); ctx.clip();
    ctx.fillStyle = P.shirt2; ctx.fillRect(-260, 170, 520, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(-110, 150, 90, 30, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 首
    rr(ctx, -36, 40, 72, 76, 16); fs(ctx, shade(P.skin, -0.1), 5);
    ctx.save();
    const sq = o.squash || 0;
    ctx.translate(0, 90); ctx.scale(1 + sq * 0.5, 1 - sq); ctx.translate(0, -90);
    if (gender === 'f') {
      // ポニーテール(ゆれる)
      const sw = Math.sin(t * 2.2) * 10 + (o.swing || 0) * 30;
      ctx.beginPath(); ctx.moveTo(-24, -40); ctx.quadraticCurveTo(-60 + sw, 80, -10 + sw * 1.4, 190); ctx.quadraticCurveTo(10 + sw, 200, 30 + sw * 1.2, 180); ctx.quadraticCurveTo(50 + sw, 70, 24, -40); ctx.closePath();
      fs(ctx, linGrad(ctx, 0, -40, 0, 200, [[0, shade(P.hair, 0.15)], [1, shade(P.hair, -0.3)]]), LW);
      ctx.strokeStyle = shade(P.hair, 0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(-20 + sw, 80, 6 + sw * 1.3, 170); ctx.stroke();
    }
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 92, 6, 16, 24, 0, 0, Math.PI * 2); fs(ctx, P.skin, 5); }
    ctx.beginPath(); ctx.ellipse(0, 0, 92, 100, 0, 0, Math.PI * 2); fs(ctx, P.skin, LW);
    // うしろ髪
    ctx.beginPath();
    if (gender === 'f') {
      ctx.moveTo(-92, 20); ctx.quadraticCurveTo(-100, -104, 0, -106); ctx.quadraticCurveTo(100, -104, 92, 20); ctx.quadraticCurveTo(80, 70, 40, 74); ctx.quadraticCurveTo(0, 60, -40, 74); ctx.quadraticCurveTo(-80, 70, -92, 20);
    } else {
      ctx.moveTo(-92, 10); ctx.quadraticCurveTo(-100, -106, 0, -108); ctx.quadraticCurveTo(100, -106, 92, 10);
      ctx.lineTo(80, 50); ctx.lineTo(56, 40); ctx.lineTo(40, 64); ctx.lineTo(18, 46); ctx.lineTo(0, 68); ctx.lineTo(-18, 46); ctx.lineTo(-40, 64); ctx.lineTo(-56, 40); ctx.lineTo(-80, 50);
    }
    ctx.closePath();
    fs(ctx, ballGrad(ctx, 0, -30, 110, P.hair), LW);
    ctx.strokeStyle = shade(P.hair, 0.3); ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 24, -96); ctx.quadraticCurveTo(i * 34, -30, i * 26, 30); ctx.stroke(); }
    if (gender === 'f') { ctx.beginPath(); ctx.ellipse(0, -36, 28, 18, 0, 0, Math.PI * 2); fs(ctx, P.tie, 5); }
    if (o.armor) {
      const k = o.armorK == null ? 1 : o.armorK;
      ctx.save(); ctx.translate(0, -(1 - k) * 260); ctx.rotate((1 - k) * 0.6);
      Art.armor(ctx, o.armor, 'back');
      ctx.restore();
    } else tankobu(ctx, o.tankobu || 0, -10);
    ctx.restore();
  }

  // メニューで見せる 自分の顔(前から)
  const HERO = {
    m: { skin: PLAYER.m.skin, body: { type: 'tshirt', color: PLAYER.m.shirt, stripe: '#ffffff' }, hair: 'spiky', hairColor: PLAYER.m.hair, eyes: 'round', brows: 'thin', mouth: 'toothy', extras: [] },
    f: { skin: PLAYER.f.skin, body: { type: 'tshirt', color: PLAYER.f.shirt, stripe: '#ffffff' }, hair: 'pony', hairColor: PLAYER.f.hair, ribbon: PLAYER.f.tie, eyes: 'round', lashes: true, brows: 'thin', mouth: 'toothy', extras: ['blush'] },
  };

  return { LOOKS, drawOpp, drawPlayer, PLAYER, HERO, tankobu };
})();
