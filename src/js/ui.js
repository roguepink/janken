'use strict';
/* メニュー(DOM): タイトル → じゅんび(むずかしさ・キャラ・ぶき・ぼうぐ・ステージ)→ 試合 → けっか */

const UI = (() => {
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = 'tataite_save';
  const STEPS = [
    { id: 'diff', title: 'むずかしさを えらぼう' },
    { id: 'gender', title: 'あなたは どっち?' },
    { id: 'weapon', title: 'ぶき を えらぼう' },
    { id: 'armor', title: 'ぼうぐ を えらぼう' },
    { id: 'stage', title: 'ステージ を えらぼう' },
  ];
  const DIFF_DESC = {
    easy: 'あいては ゆっくり。ダメージも 少なめ。はじめての人に!',
    normal: 'ちょうどいい しょうぶ。かったら すぐ たたけ!',
    hard: 'あいては すばやい! 押すボタンも 光らない。',
  };
  let save = { settings: null, cleared: { easy: 0, normal: 0, hard: 0 }, stars: { easy: {}, normal: {}, hard: {} } };
  let step = 0;
  let stageSel = 0;
  let lastResult = null;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (s && typeof s === 'object') {
        if (s.settings) Object.assign(G.settings, s.settings);
        if (s.cleared) Object.assign(save.cleared, s.cleared);
        if (s.stars) for (const k of Object.keys(save.stars)) Object.assign(save.stars[k], s.stars[k] || {});
      }
    } catch (e) { /* こわれた保存は むし */ }
    sanitize();
  }
  function sanitize() {
    const s = G.settings;
    if (!CONFIG.diffs[s.diff]) s.diff = 'normal';
    if (s.gender !== 'm' && s.gender !== 'f') s.gender = 'm';
    s.weapon = clamp(s.weapon | 0, 0, CONFIG.weapons.length - 1);
    s.armor = clamp(s.armor | 0, 0, CONFIG.armors.length - 1);
    for (const k of Object.keys(save.cleared)) save.cleared[k] = clamp(save.cleared[k] | 0, 0, 10);
  }
  function persist() {
    save.settings = G.settings;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 保存できなくても遊べる */ }
  }
  const unlocked = () => Math.min(9, save.cleared[G.settings.diff] || 0);

  function show(id) {
    for (const k of ['title', 'setup', 'result', 'pause', 'howto']) $(k).classList.toggle('hidden', k !== id);
    $('hudBtns').classList.toggle('hidden', !(G.state === 'match'));
  }

  /* ---------- タイトル ---------- */
  function showTitle() {
    G.state = 'title'; G.M = null; G.paused = false;
    Sound.stopBgm();
    const lines = [];
    for (const k of ['easy', 'normal', 'hard']) if (save.cleared[k] > 0) lines.push(CONFIG.diffs[k].name + ' ' + (save.cleared[k] >= 10 ? 'ぜんクリア!' : 'STAGE ' + save.cleared[k] + ' まで クリア'));
    $('titleProgress').textContent = lines.join(' / ');
    show('title');
  }

  /* ---------- じゅんび ---------- */
  function showSetup(at) {
    G.state = 'menu';
    step = at || 0;
    stageSel = unlocked();
    renderStep();
    show('setup');
  }

  function bars(n, on, cls) { let h = '<span class="bar5 ' + cls + '">'; for (let i = 0; i < n; i++) h += '<b class="' + (i < on ? 'on' : '') + '"></b>'; return h + '</span>'; }

  function paintCanvas(cv, size, fn, bgCol) {
    const k = 2;
    cv.width = size * k; cv.height = size * k;
    const c = cv.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, bgCol || '#3a2a62'); g.addColorStop(1, '#17102c');
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    c.save(); fn(c, size); c.restore();
  }

  function choice(cls, html, selected, onPick, canvasFn, bgCol) {
    const b = document.createElement('button');
    b.className = 'choice ' + cls + (selected ? ' sel' : '');
    if (canvasFn) { const cv = document.createElement('canvas'); paintCanvas(cv, 120, canvasFn, bgCol); b.appendChild(cv); }
    const m = document.createElement('div'); m.className = 'c-main'; m.innerHTML = html; b.appendChild(m);
    b.addEventListener('click', () => { Sound.init(); Sound.sfx.select(); onPick(); b.blur(); });
    return b;
  }

  function renderStep() {
    const st = STEPS[step];
    $('steps').innerHTML = STEPS.map((s, i) => '<i class="' + (i === step ? 'on' : i < step ? 'done' : '') + '"></i>').join('');
    $('stepTitle').textContent = st.title;
    const body = $('stepBody');
    body.innerHTML = '';
    body.className = 'step-body';
    const S = G.settings;
    if (st.id === 'diff') {
      for (const k of ['easy', 'normal', 'hard']) {
        const d = CONFIG.diffs[k];
        body.appendChild(choice('diff-choice ' + k, '<div class="c-name">' + d.name + '</div><div class="c-desc">' + DIFF_DESC[k] + '</div>', S.diff === k, () => { S.diff = k; renderStep(); }));
      }
    } else if (st.id === 'gender') {
      body.className = 'step-body cols2';
      for (const g of ['m', 'f']) {
        body.appendChild(choice('gender-choice', '<div class="c-name">' + (g === 'm' ? '男性' : '女性') + '</div><div class="c-desc">あいても ' + (g === 'm' ? '男性' : '女性') + 'に なるよ</div>', S.gender === g, () => { S.gender = g; renderStep(); },
          (c, z) => { c.translate(z / 2, z * 0.5); c.scale(z / 290, z / 290); Chars.drawOpp(c, Chars.HERO[g], { expr: 'normal', t: 0 }); }, g === 'm' ? '#3a6ad8' : '#d84a8a'));
      }
    } else if (st.id === 'weapon') {
      CONFIG.weapons.forEach((w, i) => {
        body.appendChild(choice('', '<div class="c-name">' + w.name + '</div><div class="c-bars"><span>はやさ</span>' + bars(5, 5 - i, 'spd') + '<span>つよさ</span>' + bars(5, i + 1, 'pow') + '</div><div class="c-desc">' + w.desc + '</div>', S.weapon === i, () => { S.weapon = i; renderStep(); },
          (c, z) => { c.translate(z / 2, z / 2); Art.weaponIcon(c, w.id, z * 0.78, 0.6); }));
      });
    } else if (st.id === 'armor') {
      CONFIG.armors.forEach((a, i) => {
        body.appendChild(choice('', '<div class="c-name">' + a.name + '</div><div class="c-bars"><span>はやさ</span>' + bars(5, 5 - i, 'spd') + '<span>かたさ</span>' + bars(5, i + 1, 'def') + '</div><div class="c-desc">' + a.desc + '</div>', S.armor === i, () => { S.armor = i; renderStep(); },
          (c, z) => { c.translate(z / 2, z / 2); Art.armorIcon(c, a.id, z * 0.8, Chars.PLAYER[S.gender].skin); }));
      });
    } else if (st.id === 'stage') {
      body.className = 'step-body stages';
      const max = unlocked();
      for (let i = 0; i < 10; i++) {
        const info = CONFIG.stages[i][S.gender];
        const locked = i > max;
        const stars = save.stars[S.diff][i] || 0;
        const lv = '★'.repeat(CONFIG.stages[i].lv) + '☆'.repeat(5 - CONFIG.stages[i].lv);
        const html = '<div class="c-sub">STAGE ' + (i + 1) + ' <span class="lv">' + lv + '</span></div><div class="c-name">' + (locked ? '? ? ?' : info.title + '<br>' + info.name) + '</div>' + (stars ? '<span class="badge">クリア ' + '★'.repeat(stars) + '</span>' : '');
        const b = choice('stage-choice' + (locked ? ' locked' : ''), html, stageSel === i, () => { if (locked) { Sound.sfx.otetsuki(); return; } stageSel = i; renderStep(); },
          (c, z) => {
            c.translate(z / 2, z * 0.56); const k = z / 250; c.scale(k, k);
            if (locked) { c.globalAlpha = 0.9; c.fillStyle = '#0d0a18'; c.beginPath(); c.ellipse(0, 0, 90, 100, 0, 0, Math.PI * 2); c.fill(); c.fillRect(-190, 100, 380, 200); Art.text(c, '?', 0, 0, 120, '#5a4f7e', { shadow: false }); }
            else Chars.drawOpp(c, LOOKS[i][S.gender], { expr: 'grin', t: 1 });
          }, i >= 8 ? '#5a1a3a' : undefined);
        body.appendChild(b);
      }
      setTimeout(() => { const sel = body.querySelector('.sel'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' }); }, 0);
    }
    const w = CONFIG.weapons[S.weapon]; const a = CONFIG.armors[S.armor];
    $('summary').textContent = CONFIG.diffs[S.diff].name + ' / ' + (S.gender === 'm' ? '男性' : '女性') + ' / ' + w.name + ' / ' + a.name;
    $('btnNext').textContent = step === STEPS.length - 1 ? 'しあい スタート!' : 'つぎへ';
  }

  function next() {
    Sound.init(); Sound.sfx.tap();
    persist();
    if (step < STEPS.length - 1) { step++; if (STEPS[step].id === 'stage') stageSel = Math.min(stageSel, unlocked()); renderStep(); $('stepBody').scrollTop = 0; return; }
    startStage(stageSel);
  }
  function back() {
    Sound.sfx.tap();
    if (step === 0) { showTitle(); return; }
    step--; renderStep();
  }

  function startStage(i) {
    persist();
    Game.newMatch(i);
    show(null);
    $('hudBtns').classList.remove('hidden');
  }

  /* ---------- けっか ---------- */
  function onMatchEnd(res) {
    lastResult = res;
    const S = G.settings;
    const st = res.stats;
    const hpR = res.hp.p / res.hpMax.p;
    const stars = res.win ? (hpR >= 0.7 ? 3 : hpR >= 0.35 ? 2 : 1) : 0;
    if (res.win) {
      save.cleared[S.diff] = Math.max(save.cleared[S.diff] || 0, res.stage + 1);
      save.stars[S.diff][res.stage] = Math.max(save.stars[S.diff][res.stage] || 0, stars);
      persist();
    }
    const champ = res.win && res.stage === 9;
    const t = $('resTitle');
    t.className = 'result-title ' + (champ ? 'champ' : res.win ? 'win' : 'lose');
    t.textContent = champ ? 'チャンピオン!!' : res.win ? 'STAGE ' + (res.stage + 1) + ' クリア!' : 'ざんねん…';
    $('resRank').innerHTML = res.win ? '★'.repeat(stars) + '<span class="off">' + '★'.repeat(3 - stars) + '</span>' : '';
    const info = CONFIG.stages[res.stage][S.gender];
    let msg;
    if (champ) msg = info.title + ' ' + info.name + ' を たおした!<br>10人の わるもの ぜんいんに かった! あなたが さいきょうの チャンピオンだ!';
    else if (res.win) msg = info.title + ' ' + info.name + ' を たおした!' + (res.stage < 9 ? '<br>つぎは… ' + CONFIG.stages[res.stage + 1][S.gender].title + ' ' + CONFIG.stages[res.stage + 1][S.gender].name + '!' : '');
    else msg = hint(st);
    $('resMsg').innerHTML = msg;
    const rows = [
      ['じゃんけん', st.wins + 'かち ' + st.losses + 'まけ ' + st.aiko + 'あいこ'],
      ['クリーンヒット', st.clean + '回'],
      ['ガード せいこう', st.guards + '回' + (st.tight ? '(ギリギリ ' + st.tight + ')' : '')],
      ['ジャスト', st.just + '回'],
      ['さいだい れんしょう', st.maxStreak + 'れんしょう'],
      ['あたえた ダメージ', st.dealt],
      ['じかん', Math.round(res.time) + 'びょう'],
    ];
    $('resStats').innerHTML = rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('');
    const main = $('btnResMain');
    if (champ) main.textContent = 'タイトルへ';
    else if (res.win) main.textContent = 'つぎの ステージへ!';
    else main.textContent = 'もういちど!';
    if (res.win) Sound.sfx.fanfare(); else Sound.sfx.sad();
    $('hudBtns').classList.add('hidden');
    show('result');
  }
  function hint(st) {
    if (st.timeouts >= 2) return 'かったら すぐに 右の「たたく」を おそう!<br>まよったら、光っている ボタンを おせばOK!';
    if (st.otetsuki >= 2) return 'かったら 右の「たたく」、まけたら 左の「かぶる」!<br>反対を おすと おてつきに なるよ。';
    if (st.cleanTaken > st.guards) return 'まけたら すぐ 左の「かぶる」!<br>まにあわないなら、はやく かぶれる ぼうぐ(ざる・おなべ)が おすすめ。';
    if (st.clean < st.wins / 2) return 'ガードされて ばかり…?<br>はやい ぶきで ガードの前に たたくか、おもい ぶきで ガードごと たたこう!';
    return 'おしい! じゃんけんの「ぽん」に ぴったり 合わせると ジャスト(はやさUP)!<br>あいての すきな手(クセ)も 見ぬこう。';
  }
  function resMain() {
    Sound.init(); Sound.sfx.tap();
    const r = lastResult;
    if (!r) { showTitle(); return; }
    if (r.win && r.stage === 9) showTitle();
    else startStage(r.win ? r.stage + 1 : r.stage);
  }
  function resGear() {
    Sound.sfx.tap();
    const r = lastResult;
    showSetup(2);
    if (r) stageSel = Math.min(unlocked(), r.win ? Math.min(9, r.stage + 1) : r.stage);
    renderStep();
  }

  /* ---------- ポーズ・音 ---------- */
  function setPaused(p) {
    if (G.state !== 'match') return;
    G.paused = p;
    if (p) { Sound.suspend(); show('pause'); $('hudBtns').classList.add('hidden'); }
    else { Sound.resume(); show(null); $('hudBtns').classList.remove('hidden'); }
  }
  function toggleSound() {
    Sound.init();
    Sound.setMuted(!Sound.isMuted());
    syncSound();
  }
  function syncSound() {
    const m = Sound.isMuted();
    $('iconWaves').classList.toggle('hidden', m);
    $('iconMute').classList.toggle('hidden', !m);
  }

  // メニューの うしろに 出す相手
  function previewStage() {
    if (G.state === 'menu' && STEPS[step] && STEPS[step].id === 'stage') return stageSel;
    if (lastResult && G.state === 'result') return lastResult.stage;
    return unlocked();
  }

  function init() {
    load();
    G.onMatchEnd = onMatchEnd;
    const tap = (id, fn) => $(id).addEventListener('click', (e) => { Sound.init(); fn(e); e.currentTarget.blur(); });
    tap('btnPlay', () => { Sound.sfx.tap(); showSetup(0); });
    tap('btnHowto', () => { Sound.sfx.tap(); show('howto'); });
    tap('btnHowtoClose', () => { Sound.sfx.tap(); showTitle(); });
    tap('btnNext', next);
    tap('btnBack', back);
    tap('btnResMain', resMain);
    tap('btnResGear', resGear);
    tap('btnResTitle', () => { Sound.sfx.tap(); showTitle(); });
    tap('btnPause', () => setPaused(true));
    tap('btnResume', () => setPaused(false));
    tap('btnRetire', () => { G.paused = false; Sound.resume(); showTitle(); });
    tap('btnSound', toggleSound);
    syncSound();
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
    showTitle();
  }

  return { init, showTitle, showSetup, startStage, setPaused, toggleSound, previewStage, save: () => save };
})();
