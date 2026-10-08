'use strict';
/* 描画。たて長 720×1280 を基準に、画面に合わせて 上下左右へ ひろげる。
   奥(上)= 相手、手前(下)= 自分。左 = ぼうぐ(かぶる)、まんなか = じゃんけん、右 = ぶき(たたく) */

const Render = (() => {
  let canvas = null; let ctx = null;
  let dpr = 1; let scale = 1; let L = null;
  let bg = null; let table = null; let cacheKey = '';
  let crowd = null;
  const HAND_COL = ['#ff5a5a', '#ffb300', '#3d8bff'];
  const { rr, fs, linGrad } = Art;

  function init(c) { canvas = c; ctx = c.getContext('2d'); resize(); }

  function safeInsets() {
    const el = document.getElementById('safe');
    if (!el) return { t: 0, b: 0 };
    const cs = getComputedStyle(el);
    return { t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
  }

  function computeLayout(VW, VH, st, sb) {
    const cx = VW / 2;
    const ex = Math.max(0, VH - 1280 - st - sb);
    const o = { VW, VH, cx, ex, top: st };
    o.oppHeadY = st + 322 + ex * 0.2;
    o.oppScale = 0.92;
    o.ringTopY = o.oppHeadY + 60;
    o.tableFarY = o.oppHeadY + 232;
    o.callY = o.tableFarY + 108 + ex * 0.12;
    o.handBtnY = o.callY + 168 + ex * 0.14;
    o.handBtnR = 94; o.handGap = 216;
    o.btnW = 252; o.btnH = 226;
    o.btnY = VH - sb - 84 - o.btnH;
    o.youHeadY = o.btnY - 10;
    // 横長の画面(タブレット・PC)では、ボタンを 画面の 左右はしに 大きく おく(両手の親指で押せる)
    o.wide = VW >= 1420;
    if (o.wide) {
      o.btnW = 320; o.btnH = 320; o.btnY = VH - sb - 84 - o.btnH;
      o.armorBtn = { x: cx - 360 - 30 - o.btnW, y: o.btnY, w: o.btnW, h: o.btnH };
      o.weaponBtn = { x: cx + 360 + 30, y: o.btnY, w: o.btnW, h: o.btnH };
      o.handBtnR = 106; o.handGap = 236;
    } else {
      o.armorBtn = { x: cx - 352, y: o.btnY, w: o.btnW, h: o.btnH };
      o.weaponBtn = { x: cx + 100, y: o.btnY, w: o.btnW, h: o.btnH };
    }
    o.youHpY = VH - sb - 45;
    return o;
  }

  function resize() {
    const w = window.innerWidth; const h = window.innerHeight;
    if (!w || !h) return; // 大きさ 0 の間は 前の配置のまま(次の resize で 作り直す)
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    scale = Math.min(w / 720, h / 1280);
    const ins = safeInsets();
    L = computeLayout(w / scale, h / scale, ins.t / scale, ins.b / scale);
    cacheKey = '';
  }
  const layout = () => L;
  const toLogical = (x, y) => ({ x: x / scale, y: y / scale });
  const toScreen = (x, y) => ({ x: x * scale, y: y * scale });

  function ensureCache(stageIdx) {
    const key = stageIdx + ':' + L.VW.toFixed(1) + 'x' + L.VH.toFixed(1) + '@' + (dpr * scale).toFixed(3);
    if (key === cacheKey) return;
    cacheKey = key;
    const k = dpr * scale;
    bg = Arena.makeBg(L, stageIdx, k);
    table = Arena.makeTable(L, k);
  }

  /* ---------- 全体 ---------- */
  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    const M = G.M;
    if (G.state === 'match' && M) drawMatch(M, t);
    else drawAttract(t);
  }

  // タイトルやメニューの うしろで、相手が まっている
  function drawAttract(t) {
    const idx = UI.previewStage();
    ensureCache(idx);
    ctx.drawImage(bg, 0, 0, L.VW, L.VH);
    Arena.drawSpot(ctx, L, t, 1);
    const look = LOOKS[idx][G.settings.gender];
    ctx.save(); ctx.translate(L.cx, L.oppHeadY + Math.sin(t * 2) * 4); ctx.scale(L.oppScale, L.oppScale);
    Chars.drawOpp(ctx, look, { expr: Math.sin(t * 0.7) > 0.6 ? 'grin' : 'normal', t, blink: (t % 3.3) < 0.12 });
    ctx.restore();
    ctx.drawImage(table, 0, 0, L.VW, L.VH);
    ctx.fillStyle = 'rgba(8,4,20,0.35)'; ctx.fillRect(0, 0, L.VW, L.VH);
  }

  function drawMatch(M, t) {
    if (M.phase === 'intro') { drawIntro(M, t); return; }
    ensureCache(M.stage);
    const S = FX.S;
    ctx.save();
    ctx.translate(S.sx, S.sy);
    if (S.zoom > 0) { const z = 1 + S.zoom; ctx.translate(S.zx, S.zy); ctx.scale(z, z); ctx.translate(-S.zx, -S.zy); }
    ctx.drawImage(bg, 0, 0, L.VW, L.VH);
    Arena.drawSpot(ctx, L, t, 1 + M.st.crowd * 0.4);
    drawOpponent(M, t);
    ctx.drawImage(table, 0, 0, L.VW, L.VH);
    drawOppGear(M, t);
    if (M.v.strike && M.v.strike.who === 'p') drawStrike(M, M.v.strike);
    drawYou(M, t);
    drawHands(M, t);
    if (M.v.strike && M.v.strike.who === 'c') drawStrike(M, M.v.strike);
    FX.drawWorld(ctx);
    ctx.restore();
    drawCallText(M, t);
    drawHandButtons(M, t);
    drawActionButtons(M, t);
    drawHud(M, t);
    drawSpeech(M);
    FX.drawPops(ctx);
    drawOverlays(M, t);
  }

  /* ---------- 相手 ---------- */
  function drawOpponent(M, t) {
    const v = M.v;
    let y = L.oppHeadY + Math.sin(t * 2.1) * 4;
    let rot = 0;
    if (M.phase === 'call') y -= Math.abs(Math.sin((M.t / M.diff.beat) * Math.PI)) * 10;
    if (M.phase === 'ko' && M.koSide === 'c') { const k = easeInCubic(Math.min(1, v.koT / 1.1)); y += k * 260; rot = -k * 0.5; }
    ctx.save();
    ctx.translate(L.cx + (v.oppExpr === 'panic' ? Math.sin(t * 50) * 2 : 0), y); ctx.rotate(rot); ctx.scale(L.oppScale, L.oppScale);
    Chars.drawOpp(ctx, M.opp.look, {
      expr: v.oppExpr, t, blink: v.blink, squash: v.oppSquash, tankobu: v.oppTank, sweat: v.oppSweat,
      armor: v.oppArmorK >= 1 ? M.opp.armor.id : null, armorK: v.oppArmorK, armorWobble: Math.sin(t * 40) * v.oppArmorWob,
    });
    ctx.restore();
  }

  // 相手の ぶき・ぼうぐ(台の上)と、かぶる途中の ぼうぐ
  function drawOppGear(M, t) {
    const v = M.v;
    const ax = L.cx - 222; const ay = L.tableFarY + 4;
    const wx = L.cx + 222; const wy = L.tableFarY + 8;
    if (v.oppArmorK < 0) {
      ctx.save(); ctx.translate(ax, ay); ctx.scale(0.4, 0.4); ctx.translate(0, 60); Art.armor(ctx, M.opp.armor.id, 'front'); ctx.restore();
    } else if (v.oppArmorK < 1) {
      const k = easeOutCubic(v.oppArmorK);
      const x = lerp(ax, L.cx, k); const y = lerp(ay, L.oppHeadY, k) - Math.sin(k * Math.PI) * 120;
      const s = lerp(0.4, L.oppScale, k);
      ctx.save(); ctx.translate(x, y); ctx.rotate((1 - k) * -2.4); ctx.scale(s, s); Art.armor(ctx, M.opp.armor.id, 'front'); ctx.restore();
    }
    if (!(v.strike && v.strike.who === 'c')) {
      ctx.save(); ctx.translate(wx, wy); ctx.rotate(-1.45); ctx.scale(0.34, 0.34); ctx.translate(0, 110); Art.weapon(ctx, M.opp.weapon.id); ctx.restore();
    }
  }

  /* ---------- じゃんけんの手 ---------- */
  function drawHands(M, t) {
    const v = M.v;
    const oppSleeve = M.opp.look.body.color;
    const youSleeve = Chars.PLAYER[M.you.gender].shirt;
    const youSkin = Chars.PLAYER[M.you.gender].skin;
    const ph = M.phase;
    const shown = ph === 'aiko' || ph === 'action' || ph === 'after';
    if (ph === 'call' || ph === 'ready' || ph === 'next') {
      // 相手は こぶしを ふっている
      const bob = ph === 'call' ? Math.abs(Math.sin((M.t / M.diff.beat) * Math.PI)) : 0.3 + Math.sin(t * 3) * 0.1;
      ctx.save(); ctx.translate(L.cx - 120, L.tableFarY - 40 - bob * 46); ctx.rotate(Math.PI - 0.35); ctx.scale(0.62, 0.62);
      Art.hand(ctx, 0, M.opp.look.skin, oppSleeve); ctx.restore();
      return;
    }
    if (!shown) return;
    const k = easeOutBack(Math.min(1, v.revealT / 0.16));
    let fade = ph === 'after' ? clamp(1 - (M.t - M.afterDur + 0.5) / 0.5, 0, 1) : 1;
    // ぶきを ふりはじめたら 手は うすくして 見やすく
    if (v.strike) fade *= 1 - 0.65 * clamp(v.strike.t / 0.12, 0, 1);
    const win = M.judge;
    ctx.save(); ctx.globalAlpha = fade;
    const sc = lerp(0.5, 0.86, k);
    const ox = L.cx - 110; const oy = L.tableFarY + 40;
    const yx = L.cx + 110; const yy = L.handBtnY + 50;
    // かった手の うしろに 光
    if (win !== 'draw' && v.revealT < 1.6) {
      const gx = win === 'c' ? ox : yx; const gy = win === 'c' ? oy + 95 * sc : yy - 95 * sc;
      const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, 200);
      g.addColorStop(0, 'rgba(255,230,90,0.85)'); g.addColorStop(1, 'rgba(255,230,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 200, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade * 0.5;
      ctx.translate(gx, gy); ctx.rotate(t * 0.8);
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillStyle = 'rgba(255,240,150,0.35)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, -230); ctx.lineTo(18, -230); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    // 相手の手(上から)
    ctx.save(); ctx.translate(ox + (win === 'p' ? Math.sin(t * 40) * 3 : 0), oy); ctx.rotate(Math.PI - 0.1); ctx.scale(sc, sc);
    if (win === 'p') ctx.globalAlpha = fade * 0.8;
    Art.hand(ctx, M.cHand, M.opp.look.skin, oppSleeve); ctx.restore();
    // 自分の手(下から)
    if (M.pHand != null) {
      ctx.save(); ctx.translate(yx + (win === 'c' ? Math.sin(t * 40) * 3 : 0), yy); ctx.rotate(0.1); ctx.scale(sc, sc);
      if (win === 'c') ctx.globalAlpha = fade * 0.8;
      Art.hand(ctx, M.pHand, youSkin, youSleeve); ctx.restore();
    } else {
      Art.text(ctx, '?', yx, yy - 90, 130, '#ffffff');
    }
    ctx.restore();
  }

  /* ---------- 自分(うしろ姿) ---------- */
  function drawYou(M, t) {
    const v = M.v;
    let y = L.youHeadY + Math.sin(t * 2.4 + 1) * 3;
    let rot = 0;
    if (M.phase === 'ko' && M.koSide === 'p') { const k = easeOutCubic(Math.min(1, v.koT / 1)); y += k * 120; rot = k * 0.25; }
    const k = v.youArmorK;
    ctx.save(); ctx.translate(L.cx, y); ctx.rotate(rot);
    Chars.drawPlayer(ctx, M.you.gender, {
      t, squash: v.youSquash, tankobu: v.youTank,
      armor: k >= 0 ? M.you.armor.id : null, armorK: k >= 0 ? easeOutCubic(k) : 0, swing: v.youSquash,
      armorWobble: Math.sin(t * 46) * v.youArmorWob * 0.5,
    });
    if (v.youTank > 0.5 && !(k >= 0)) {
      for (let i = 0; i < 3; i++) { const a = t * 4 + (i * Math.PI * 2) / 3; Art.star(ctx, Math.cos(a) * 120, -120 + Math.sin(a) * 24, 16, t * 3, '#ffe14d', 3); }
    }
    ctx.restore();
  }

  /* ---------- ふりおろす ぶき ---------- */
  function drawStrike(M, s) {
    const p = s.hit ? 1 : clamp(s.t / Math.max(0.05, s.dur), 0, 1);
    const e = easeInCubic(p);
    const fade = s.hit ? clamp(1 - (s.after - 0.28) / 0.2, 0, 1) : 1;
    if (fade <= 0) return;
    // 当たったら はねかえって 顔が見えるように どく
    const bounce = s.hit ? easeOutCubic(clamp((s.after - 0.04) / 0.16, 0, 1)) * (s.kind === 'clean' ? 0.75 : 0.95) : 0;
    let px; let py; let sc; let a0; let a1; let sleeve; let skin;
    if (s.who === 'p') {
      px = L.cx + 205; py = L.oppHeadY + 40; sc = 1.12; a0 = 0.8; a1 = -1.03;
      sleeve = Chars.PLAYER[M.you.gender].shirt; skin = Chars.PLAYER[M.you.gender].skin;
    } else {
      px = lerp(L.cx + 160, L.cx + 300, e); py = lerp(L.tableFarY - 40, L.youHeadY + 40, e); sc = lerp(0.8, 1.65, e); a0 = 0.6; a1 = -1.13;
      sleeve = M.opp.look.body.color; skin = M.opp.look.skin;
    }
    const ang = lerp(a0, a1, e) + bounce;
    ctx.save(); ctx.globalAlpha = fade;
    // 残像
    if (!s.hit && p > 0.15) {
      for (let i = 3; i >= 1; i--) {
        const e2 = easeInCubic(Math.max(0, p - i * 0.12));
        ctx.save(); ctx.globalAlpha = fade * 0.14 * (4 - i);
        const gx = s.who === 'p' ? px : lerp(L.cx + 160, L.cx + 300, e2); const gy = s.who === 'p' ? py : lerp(L.tableFarY - 40, L.youHeadY + 40, e2);
        const gs = s.who === 'p' ? sc : lerp(0.8, 1.65, e2);
        ctx.translate(gx, gy); ctx.rotate(lerp(a0, a1, e2)); ctx.scale(gs, gs); Art.weapon(ctx, s.id); ctx.restore();
      }
    }
    ctx.translate(px, py); ctx.rotate(ang); ctx.scale(sc, sc);
    Art.weapon(ctx, s.id);
    ctx.save(); ctx.rotate(Math.PI / 2); ctx.scale(0.5, 0.5); ctx.translate(0, 90); Art.hand(ctx, 0, skin, sleeve); ctx.restore();
    ctx.restore();
  }

  /* ---------- まんなかの文字 ---------- */
  function drawCallText(M, t) {
    const ph = M.phase;
    if (ph === 'ready') {
      const pulse = 1 + Math.sin(t * 6) * 0.05;
      ctx.save(); ctx.translate(L.cx, L.callY); ctx.scale(pulse, pulse);
      Art.text(ctx, 'タップで', 0, -46, 52, '#ffffff');
      Art.text(ctx, 'じゃんけん スタート!', 0, 22, 64, ['#fffbe0', '#ffc400']);
      ctx.restore();
      return;
    }
    if (ph === 'next') {
      const k = clamp(M.t / 1.5, 0, 1);
      Art.text(ctx, 'つぎの じゃんけん…', L.cx, L.callY, 52, '#ffffff');
      ctx.beginPath(); ctx.arc(L.cx, L.callY + 70, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.lineWidth = 9; ctx.strokeStyle = '#ffc400'; ctx.lineCap = 'round'; ctx.stroke();
      return;
    }
    if (ph === 'call') {
      const words = M.callType === 'aiko' ? ['あいこで', 'しょ!'] : ['じゃん', 'けん', 'ぽん!'];
      const i = M.beatDone - 1;
      if (i < 0) return;
      const since = M.t - M.beats[i];
      const last = i === words.length - 1;
      const sc = lerp(1.6, 1, easeOutBack(Math.min(1, since / 0.14)));
      ctx.save(); ctx.translate(L.cx, L.callY); ctx.scale(sc, sc); ctx.rotate(last ? -0.06 : (i % 2 ? 0.05 : -0.05));
      Art.text(ctx, words[i], 0, 0, last ? 150 : 124, last ? ['#fff7c0', '#ffb300'] : ['#ffffff', '#d6e4ff']);
      ctx.restore();
      return;
    }
    if (ph === 'aiko') {
      const sc = lerp(1.5, 1, easeOutBack(Math.min(1, M.t / 0.15)));
      ctx.save(); ctx.translate(L.cx, L.tableFarY - 46); ctx.scale(sc, sc);
      Art.text(ctx, 'あいこ!', 0, 0, 130, ['#ffffff', '#9be27a']);
      if (M.late) Art.text(ctx, 'まにあわなかった…', 0, 88, 44, '#ffd0d0');
      ctx.restore();
      return;
    }
    if (ph === 'action' || (ph === 'after' && M.t < 0.4)) {
      const win = M.judge === 'p';
      const tt = M.v.revealT;
      const sc = lerp(1.8, 1, easeOutBack(Math.min(1, tt / 0.14)));
      ctx.save(); ctx.translate(L.cx, L.tableFarY - 46); ctx.scale(sc, sc); ctx.rotate(win ? -0.05 : 0.05);
      Art.text(ctx, win ? 'かち!' : 'まけ!', 0, 0, 140, win ? ['#fff7c0', '#ffb300'] : ['#e8f4ff', '#4f8dff']);
      ctx.restore();
    }
  }

  /* ---------- じゃんけんボタン(まんなか) ---------- */
  function handBtnPos(i) { return { x: L.cx + (i - 1) * L.handGap, y: L.handBtnY, r: L.handBtnR }; }
  function drawHandButtons(M, t) {
    const ph = M.phase;
    if (!(ph === 'call' || ph === 'ready' || ph === 'next')) return;
    const active = ph === 'call' && M.pHand == null && M.t <= M.ponAt + M.diff.grace;
    const skin = Chars.PLAYER[M.you.gender].skin;
    for (let i = 0; i < 3; i++) {
      const b = handBtnPos(i);
      const sel = M.pHand === i;
      let s = 1; let a = 1;
      if (ph !== 'call') { a = 0.7; s = 0.92; }
      else if (M.pHand != null) { s = sel ? 1.14 : 0.86; a = sel ? 1 : 0.45; }
      else { const bt = (M.t % M.diff.beat) / M.diff.beat; s = 1 + (1 - Math.min(1, bt * 3)) * 0.07; }
      ctx.save(); ctx.globalAlpha = a; ctx.translate(b.x, b.y); ctx.scale(s, s);
      // タイミングの輪: 「ぽん」で ちょうど 一周する
      if (active) {
        const d = M.ponAt - M.t;
        const near = Math.abs(d) <= M.diff.just;
        const late = d < -M.diff.just;
        ctx.beginPath();
        if (d > 0) ctx.arc(0, 0, b.r + 14, -Math.PI / 2, -Math.PI / 2 + clamp(M.t / M.ponAt, 0, 1) * Math.PI * 2);
        else ctx.arc(0, 0, b.r + 14, 0, Math.PI * 2);
        ctx.lineWidth = near ? 14 : 9; ctx.lineCap = 'round';
        ctx.strokeStyle = near ? '#ffd21f' : late ? (Math.sin(t * 40) > 0 ? '#ff5a5a' : '#ffffff') : 'rgba(255,255,255,0.85)';
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      fs(ctx, linGrad(ctx, 0, -b.r, 0, b.r, [[0, '#ffffff'], [1, '#dfe6f5']]), 8, sel ? '#ffd21f' : INK);
      ctx.beginPath(); ctx.arc(0, 0, b.r - 9, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = HAND_COL[i]; ctx.stroke();
      ctx.save(); ctx.translate(0, [14, 30, 32][i]); ctx.scale(0.5, 0.5); Art.hand(ctx, i, skin, null); ctx.restore();
      rr(ctx, -58, b.r - 24, 116, 42, 21); fs(ctx, HAND_COL[i], 5);
      Art.text(ctx, Rules.HAND_NAMES[i], 0, b.r - 2, 30, '#ffffff', { outline: 7, shadow: false });
      ctx.restore();
    }
  }

  /* ---------- かぶる / たたく ボタン ---------- */
  function drawActionButtons(M, t) {
    const ph = M.phase;
    if (ph === 'ko') return;
    const act = ph === 'action' ? M.act : null;
    const hint = act && M.diff.hint && !act.press.p;
    const v = M.v;
    const draw1 = (b, kind) => {
      const correct = act && ((kind === 'weapon' && act.winner === 'p') || (kind === 'armor' && act.winner === 'c'));
      const pressed = act && act.press.p && act.press.p.btn === kind;
      const enabled = !!act && !act.press.p;
      let s = 1;
      if (hint && correct) s = 1 + Math.abs(Math.sin(t * 9)) * 0.06;
      if (pressed) s = 0.94;
      const cx = b.x + b.w / 2; const cy = b.y + b.h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-b.w / 2, -b.h / 2);
      if (!enabled && !pressed) ctx.globalAlpha = 0.72;
      if (hint && correct) {
        ctx.save(); ctx.shadowColor = '#ffd21f'; ctx.shadowBlur = 40;
        rr(ctx, -10, -10, b.w + 20, b.h + 20, 40); ctx.fillStyle = 'rgba(255,210,31,0.9)'; ctx.fill(); ctx.restore();
      }
      const base = kind === 'armor' ? '#2f7ff0' : '#f0402f';
      rr(ctx, 0, 0, b.w, b.h, 34);
      fs(ctx, linGrad(ctx, 0, 0, 0, b.h, [[0, shade(base, 0.25)], [0.6, base], [1, shade(base, -0.35)]]), 8);
      rr(ctx, 10, 8, b.w - 20, 40, 20); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
      // 絵
      ctx.save(); ctx.translate(b.w / 2, b.h * 0.38);
      const inUse = kind === 'armor' ? v.youArmorK >= 0 : (v.strike && v.strike.who === 'p');
      if (inUse) ctx.globalAlpha *= 0.3;
      const isz = Math.min(b.w * 0.6, b.h - 84);
      if (kind === 'armor') Art.armorIcon(ctx, M.you.armor.id, isz);
      else Art.weaponIcon(ctx, M.you.weapon.id, isz, 0.6);
      ctx.restore();
      rr(ctx, 10, b.h - 74, b.w - 20, 62, 22); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      Art.text(ctx, kind === 'armor' ? 'かぶる' : 'たたく', b.w / 2, b.h - 43, 52, '#ffffff', { outline: 10 });
      if (L.wide) Art.text(ctx, kind === 'armor' ? '← / A' : '→ / D', b.w / 2, b.h + 26, 26, 'rgba(255,255,255,0.75)', { outline: 6, shadow: false });
      ctx.restore();
      if (hint && correct) {
        const ax = cx; const ay = b.y - 56 - Math.abs(Math.sin(t * 9)) * 12;
        Art.text(ctx, kind === 'armor' ? 'まもれ!' : 'たたけ!', ax, ay, 66, kind === 'armor' ? ['#ffffff', '#7cd4ff'] : ['#ffffff', '#ffd21f']);
        ctx.beginPath(); ctx.moveTo(ax - 22, ay + 36); ctx.lineTo(ax + 22, ay + 36); ctx.lineTo(ax, ay + 62); ctx.closePath(); fs(ctx, '#ffd21f', 5);
      }
    };
    draw1(L.armorBtn, 'armor');
    draw1(L.weaponBtn, 'weapon');
  }

  /* ---------- HP など ---------- */
  function hpBar(x, y, w, h, hp, show, max, flash, label, right) {
    rr(ctx, x - 5, y - 5, w + 10, h + 10, (h + 10) / 2); ctx.fillStyle = INK; ctx.fill();
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#2a2240'; ctx.fill();
    const r = clamp(hp / max, 0, 1); const rs = clamp(show / max, 0, 1);
    ctx.save(); rr(ctx, x, y, w, h, h / 2); ctx.clip();
    const sx = (k) => (right ? x + w * (1 - k) : x);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(sx(rs), y, w * rs, h);
    const col = r > 0.5 ? ['#7dff7a', '#21b84a'] : r > 0.25 ? ['#ffe866', '#f0a400'] : ['#ff8a8a', '#e0262f'];
    ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, col[0]], [1, col[1]]]); ctx.fillRect(sx(r), y, w * r, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y + 4, w, h * 0.22);
    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flash * 0.6 + ')'; ctx.fillRect(x, y, w, h); }
    ctx.restore();
    Art.text(ctx, label, right ? x + w - 18 : x + 18, y + h / 2 + 1, h * 0.62, '#ffffff', { align: right ? 'right' : 'left', outline: 7, shadow: false });
    Art.text(ctx, String(Math.ceil(hp)), right ? x + 24 : x + w - 22, y + h / 2 + 1, h * 0.7, '#ffffff', { align: right ? 'left' : 'right', outline: 8, shadow: false });
  }

  function drawHud(M, t) {
    const v = M.v;
    const top = L.top + 14;
    // ステージ
    rr(ctx, L.cx - 350, top, 150, 50, 25); fs(ctx, '#ffc400', 5);
    Art.text(ctx, 'STAGE ' + (M.stage + 1), L.cx - 275, top + 26, 30, '#ffffff', { outline: 7, shadow: false });
    // 名前とつよさ
    // 右上の ボタン(DOM)に かからないように 名前を ちぢめる
    const avail = L.VW - 118 / scale - (L.cx - 186) - 8;
    const tw0 = measure(M.opp.info.title, 30) + 10 + measure(M.opp.info.name, 40);
    const fz = Math.min(1, avail / tw0);
    Art.text(ctx, M.opp.info.title, L.cx - 186, top + 26, 30 * fz, '#ffd6e8', { align: 'left', outline: 7 });
    const tw = measure(M.opp.info.title, 30 * fz);
    Art.text(ctx, M.opp.info.name, L.cx - 176 + tw, top + 24, 40 * fz, '#ffffff', { align: 'left', outline: 8 });
    const lv = M.st.lv;
    for (let i = 0; i < 5; i++) Art.star(ctx, L.cx - 186 + 18 + i * 30, top + 68, 12, 0, i < lv ? '#ff4d6d' : '#4a3f66', 3);
    const ox = L.cx - 186 + 18 + 5 * 30 + 4;
    Art.text(ctx, 'つよさ', ox, top + 69, 22, '#ffb3c6', { align: 'left', outline: 5, shadow: false });
    const shk = v.hpFlash.c > 0.6 ? (Math.random() - 0.5) * 10 : 0;
    hpBar(L.cx - 340 + shk, top + 92, 680, 44, M.hp.c, M.hpShow.c, M.hpMax.c, v.hpFlash.c, '', true);
    // 自分
    const shp = v.hpFlash.p > 0.6 ? (Math.random() - 0.5) * 10 : 0;
    hpBar(L.cx - 340 + shp, L.youHpY - 21, 680, 42, M.hp.p, M.hpShow.p, M.hpMax.p, v.hpFlash.p, 'あなた', false);
    if (M.streak.p >= 2 && M.phase !== 'ko') {
      const pulse = 1 + Math.sin(t * 8) * 0.05;
      ctx.save(); ctx.translate(L.cx, L.btnY - 22); ctx.scale(pulse, pulse);
      Art.text(ctx, M.streak.p + 'れんしょう中! ダメージ×' + Rules.streakMul(M.streak.p).toFixed(2), 0, 0, 30, ['#fff', '#ff9a3d'], { outline: 7 });
      ctx.restore();
    }
  }
  function measure(str, size) { ctx.save(); ctx.font = '900 ' + size + 'px ' + FONT; const w = ctx.measureText(str).width; ctx.restore(); return w; }

  // 相手のセリフ
  function drawSpeech(M) {
    const sp = M.v.speech;
    if (!sp || M.phase === 'intro') return;
    const k = Math.min(1, sp.t / 0.12);
    const a = sp.t > sp.life - 0.25 ? (sp.life - sp.t) / 0.25 : 1;
    const size = 30;
    ctx.save(); ctx.font = '900 ' + size + 'px ' + FONT;
    const x = L.cx + 96;
    const maxW = Math.min(380, L.VW - 16 - x) - 36;
    const lines = wrap(sp.text, maxW);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 36;
    const h = lines.length * (size + 8) + 24;
    const y = L.oppHeadY - 40 - h / 2;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.translate(x, y + h / 2); ctx.scale(lerp(0.6, 1, easeOutBack(k)), lerp(0.6, 1, easeOutBack(k))); ctx.translate(0, -h / 2);
    // しっぽ(口のほうへ)
    ctx.beginPath(); ctx.moveTo(6, h / 2 - 16); ctx.lineTo(-30, h / 2 + 34); ctx.lineTo(6, h / 2 + 16); ctx.closePath(); fs(ctx, '#ffffff', 6);
    rr(ctx, 0, 0, w, h, 24); fs(ctx, '#ffffff', 6);
    ctx.beginPath(); ctx.moveTo(3, h / 2 - 13); ctx.lineTo(3, h / 2 + 13); ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, w / 2, 12 + (size + 8) * (i + 0.5)));
    ctx.restore();
  }
  function wrap(text, maxW) {
    const out = []; let cur = '';
    for (const ch of text) {
      if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  /* ---------- 画面全体の効果 ---------- */
  function drawOverlays(M, t) {
    const S = FX.S;
    if (S.red > 0) vignette('255,40,60', S.red * 0.85);
    if (S.blue > 0) vignette('80,190,255', S.blue * 0.7);
    if (M.phase === 'ko') {
      const k = M.v.koT;
      const win = M.koSide === 'c';
      if (!win) { ctx.fillStyle = 'rgba(20,20,40,' + Math.min(0.55, k * 0.6) + ')'; ctx.fillRect(0, 0, L.VW, L.VH); }
      const sc = lerp(3, 1, easeOutBack(Math.min(1, k / 0.35)));
      ctx.save(); ctx.translate(L.cx, L.VH * 0.42); ctx.scale(sc, sc); ctx.rotate(-0.08);
      if (win) Art.text(ctx, 'K.O.!!', 0, 0, 190, ['#fff7c0', '#ffb300', '#ff6a00'], { outer: '#ffffff' });
      else Art.text(ctx, 'まけ…', 0, 0, 170, ['#e8f0ff', '#6f8fd6']);
      ctx.restore();
      if (win && k > 0.6) Art.text(ctx, 'あなたの かち!', L.cx, L.VH * 0.42 + 140, 64, ['#ffffff', '#ffe14d']);
    }
    if (S.flash > 0) { ctx.fillStyle = S.flashCol; ctx.globalAlpha = Math.min(1, S.flash); ctx.fillRect(0, 0, L.VW, L.VH); ctx.globalAlpha = 1; }
  }
  function vignette(rgb, a) {
    const g = ctx.createRadialGradient(L.cx, L.VH / 2, Math.min(L.VW, L.VH) * 0.3, L.cx, L.VH / 2, Math.max(L.VW, L.VH) * 0.75);
    g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(1, 'rgba(' + rgb + ',' + a + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, L.VW, L.VH);
  }

  /* ---------- 会場の紹介(ステージ開始前) ---------- */
  function drawIntro(M, t) {
    if (!crowd || crowd.stageIdx !== M.stage || crowd.VW !== L.VW || crowd.VH !== L.VH) crowd = Arena.makeCrowd(M.stage, L.VW, L.VH);
    const k = M.t; const T = Game.INTRO;
    const z = k < T - 0.6 ? 1 + k * 0.05 : 1 + (T - 0.6) * 0.05 + Math.pow((k - (T - 0.6)) / 0.6, 2) * 3.2;
    ctx.save();
    ctx.translate(crowd.cx, crowd.cy); ctx.scale(z, z); ctx.translate(-crowd.cx, -crowd.cy);
    Arena.drawVenue(ctx, crowd, t, { oppColor: M.opp.look.body.color, youColor: Chars.PLAYER[M.you.gender].shirt });
    ctx.restore();
    // 文字
    const inK = easeOutBack(clamp((k - 0.15) / 0.35, 0, 1));
    const outA = clamp(1 - (k - (T - 0.7)) / 0.3, 0, 1);
    ctx.save(); ctx.globalAlpha = outA;
    const by = L.top + 200;
    ctx.save(); ctx.translate(lerp(-L.VW, 0, inK), 0);
    ctx.beginPath(); ctx.moveTo(0, by - 70); ctx.lineTo(L.VW, by - 100); ctx.lineTo(L.VW, by + 70); ctx.lineTo(0, by + 100); ctx.closePath();
    ctx.fillStyle = 'rgba(10,6,24,0.75)'; ctx.fill();
    Art.text(ctx, 'STAGE ' + (M.stage + 1), L.cx, by - 12, 104, ['#fff7c0', '#ffc400', '#ff8a00']);
    Art.text(ctx, M.stage === 9 ? 'ファイナル!' : '/ 10', L.cx, by + 64, 36, '#ffffff');
    ctx.restore();
    // あいて
    const pk = easeOutBack(clamp((k - 0.45) / 0.35, 0, 1));
    const py = L.VH - L.top - 330;
    ctx.save(); ctx.translate(lerp(L.VW * 1.5, 0, pk), 0);
    ctx.fillStyle = 'rgba(10,6,24,0.8)'; ctx.beginPath(); ctx.moveTo(0, py - 70); ctx.lineTo(L.VW, py - 110); ctx.lineTo(L.VW, py + 110); ctx.lineTo(0, py + 140); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(L.cx - 210, py + 10); ctx.beginPath(); ctx.arc(0, 0, 84, 0, Math.PI * 2); fs(ctx, '#3a2560', 6); ctx.clip(); ctx.scale(0.62, 0.62); ctx.translate(0, 20);
    Chars.drawOpp(ctx, M.opp.look, { expr: 'grin', t }); ctx.restore();
    ctx.beginPath(); ctx.arc(L.cx - 210, py + 10, 84, 0, Math.PI * 2); ctx.lineWidth = 7; ctx.strokeStyle = '#ffc400'; ctx.stroke();
    Art.text(ctx, 'VS', L.cx - 210, py - 92, 54, ['#ffffff', '#ff4d6d']);
    Art.text(ctx, M.opp.info.title, L.cx - 100, py - 26, 38, '#ffb3c6', { align: 'left' });
    Art.text(ctx, M.opp.info.name, L.cx - 100, py + 30, M.opp.info.name.length > 7 ? 46 : 60, '#ffffff', { align: 'left' });
    const people = Math.round(M.st.crowd * 10000);
    Art.text(ctx, 'かんきゃく ' + people.toLocaleString('ja-JP') + '人' + (M.st.crowd >= 1 ? ' まんいん!' : ''), L.cx - 100, py + 88, 30, '#ffe680', { align: 'left' });
    ctx.restore();
    ctx.restore();
    if (k < 0.3) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - k / 0.3) + ')'; ctx.fillRect(0, 0, L.VW, L.VH); }
    if (k > T - 0.3) { ctx.fillStyle = 'rgba(255,255,255,' + clamp((k - (T - 0.3)) / 0.3, 0, 1) + ')'; ctx.fillRect(0, 0, L.VW, L.VH); }
    Art.text(ctx, 'タップで スキップ', L.VW - 20, L.VH - L.top - 30, 24, 'rgba(255,255,255,0.7)', { align: 'right', outline: 5, shadow: false });
  }

  // タップ位置 → 操作
  function hitTest(x, y) {
    const M = G.M;
    if (!M) return { kind: 'any' };
    if (M.phase === 'call') {
      // いちばん近いボタン(はしを押しても となりに ならない)
      let best = -1; let bd = Infinity;
      for (let i = 0; i < 3; i++) {
        const b = handBtnPos(i);
        const d = Math.hypot(x - b.x, y - b.y);
        if (d <= b.r + 26 && d < bd) { bd = d; best = i; }
      }
      return best >= 0 ? { kind: 'hand', value: best } : { kind: 'none' };
    }
    if (M.phase === 'action') {
      // 下半分の 左 = かぶる、右 = たたく(大きめに とる)
      if (y > L.callY + 40) {
        if (x < L.cx - 40) return { kind: 'armor' };
        if (x > L.cx + 40) return { kind: 'weapon' };
      }
      const inR = (b) => x >= b.x - 20 && x <= b.x + b.w + 20 && y >= b.y - 20 && y <= b.y + b.h + 20;
      if (inR(L.armorBtn)) return { kind: 'armor' };
      if (inR(L.weaponBtn)) return { kind: 'weapon' };
      return { kind: 'none' };
    }
    return { kind: 'any' };
  }

  return { init, resize, layout, toLogical, toScreen, draw, hitTest, handBtnPos, measure: (s, z) => measure(s, z), canvas: () => canvas, context: () => ctx };
})();
