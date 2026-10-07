'use strict';
/* ゲームバランスの数値。遊びごこちはここの数字で調整する */

const CONFIG = {
  playerHp: 100,
  // JUST(「ぽん」ぴったり)で出したときの、ぶき・ぼうぐの はやさ倍率
  justSpeed: 0.72,
  // れんしょう(じゃんけんに続けて勝つ)ごとのダメージ倍率の上がり方と上限
  streakStep: 0.12,
  streakMax: 1.48,
  // 「ギリギリ ガード」とみなす間(秒)
  tightGuard: 0.1,

  // ぶき: swing = ボタンを押してから当たるまでの秒数、power = そのまま当たったときのダメージ、
  //        pierce = ぼうぐの上から ひびく割合(大きいほど ガードされても いたい)
  weapons: [
    { id: 'pico', name: 'ピコピコハンマー', swing: 0.13, power: 15, pierce: 0.06, word: 'ピコッ!', desc: 'いちばん はやい! でも かるい' },
    { id: 'harisen', name: 'ハリセン', swing: 0.2, power: 20, pierce: 0.14, word: 'パシーン!', desc: 'はやくて いい音。つかいやすい' },
    { id: 'pan', name: 'フライパン', swing: 0.28, power: 26, pierce: 0.24, word: 'カーン!', desc: 'はやさと つよさの バランス型' },
    { id: 'mallet', name: '木づち', swing: 0.38, power: 33, pierce: 0.38, word: 'ゴーン!', desc: 'おもい。ガードの上からも ひびく' },
    { id: 'ton', name: '100tハンマー', swing: 0.52, power: 42, pierce: 0.55, word: 'ドゴォン!!', desc: 'さいきょう! でも ふるのが おそい' },
  ],
  // ぼうぐ: don = かぶり終わるまでの秒数、block = ふせぐ割合
  armors: [
    { id: 'zaru', name: 'ざる', don: 0.1, block: 0.45, desc: 'いちばん はやく かぶれる。でも けっこう いたい' },
    { id: 'nabe', name: 'おなべ', don: 0.16, block: 0.6, desc: 'はやめに かぶれて、まあまあ かたい' },
    { id: 'hardhat', name: '工事ヘルメット', don: 0.24, block: 0.74, desc: 'はやさと かたさの バランス型' },
    { id: 'bike', name: 'バイクヘルメット', don: 0.33, block: 0.86, desc: 'かたい。かぶるのに 少し時間がかかる' },
    { id: 'knight', name: '騎士のかぶと', don: 0.45, block: 0.95, desc: 'さいきょうの まもり! でも かぶるのが おそい' },
  ],

  // むずかしさ
  //  cpuReact: 相手の反応時間の倍率(大きいほど おそい)  cpuMistake: 相手の まちがい率の倍率
  //  dmgTaken: 自分が受けるダメージ倍率  oppHp: 相手のHP倍率
  //  window: 勝ってから たたくまでの制限時間  grace: 「ぽん」のあと 出せる時間  just: JUST の はば(±秒)
  //  read: 相手が こちらのクセを読む強さ  hint: 押すボタンを光らせる  beat: 「じゃん」「けん」「ぽん」の間隔
  diffs: {
    easy: { id: 'easy', name: 'やさしい', cpuReact: 1.32, cpuMistake: 1.6, dmgTaken: 0.62, oppHp: 0.85, window: 2.4, grace: 0.6, just: 0.15, read: 0.4, hint: true, beat: 0.5 },
    normal: { id: 'normal', name: 'ふつう', cpuReact: 1, cpuMistake: 1, dmgTaken: 0.8, oppHp: 1, window: 1.8, grace: 0.45, just: 0.11, read: 1, hint: true, beat: 0.44 },
    hard: { id: 'hard', name: 'むずかしい', cpuReact: 0.86, cpuMistake: 0.6, dmgTaken: 1, oppHp: 1.1, window: 1.4, grace: 0.3, just: 0.08, read: 1.4, hint: false, beat: 0.38 },
  },

  // コンピューターの強さ 5段階
  //  react: 反応時間(秒)  jitter: ばらつき  mistake: 押しまちがい率  hesitate: もたつく率
  //  fav: すきな手を出す確率(1/3 なら クセなし)  read: こちらの よく出す手を読む確率
  cpuLevels: [
    null,
    { react: 0.95, jitter: 0.16, mistake: 0.12, hesitate: 0.16, fav: 0.56, read: 0 },
    { react: 0.8, jitter: 0.13, mistake: 0.08, hesitate: 0.12, fav: 0.48, read: 0.06 },
    { react: 0.67, jitter: 0.1, mistake: 0.05, hesitate: 0.09, fav: 0.43, read: 0.12 },
    { react: 0.56, jitter: 0.08, mistake: 0.03, hesitate: 0.06, fav: 0.38, read: 0.2 },
    { react: 0.47, jitter: 0.06, mistake: 0.02, hesitate: 0.04, fav: 0.34, read: 0.28 },
  ],

  // 10ステージ。lv = コンピューターの強さ、hp = 相手のHP、weapon / armor = 相手のそうび(番号)
  //  fav = すきな手(0 グー 1 チョキ 2 パー)  crowd = 会場の うまり具合(0〜1)
  stages: [
    { lv: 1, hp: 65, weapon: 0, armor: 0, fav: 0, crowd: 0.06,
      m: { title: 'いたずらっ子', name: 'ケンタ', intro: 'へへっ、ボクに かてるかな?', ko: 'うわーん! おぼえてろー!' },
      f: { title: 'いたずらっ子', name: 'ミカ', intro: 'えへへ、ピコッと いくよー!', ko: 'うわーん! ママー!' } },
    { lv: 1, hp: 72, weapon: 1, armor: 0, fav: 2, crowd: 0.14,
      m: { title: 'ちょいワル', name: 'タクヤ', intro: 'オレの ハリセン、いたいぜ?', ko: 'ちょ、ちょっと 本気だしすぎ…' },
      f: { title: 'ちょいワル', name: 'レイナ', intro: 'あたしに勝とうなんて 10年はやいし', ko: 'ウソでしょ… マジで?' } },
    { lv: 2, hp: 78, weapon: 1, armor: 1, fav: 1, crowd: 0.24,
      m: { title: 'ヤンキー', name: 'リュウジ', intro: 'あぁん? やんのか コラ!', ko: 'きょ、きょうは このへんに しといてやる…' },
      f: { title: 'スケバン', name: 'マキ', intro: 'なめた まねすると しょうちしないよ!', ko: 'あ、あんた… やるじゃん…' } },
    { lv: 2, hp: 84, weapon: 2, armor: 1, fav: 0, crowd: 0.34,
      m: { title: '番長', name: 'ゴウダ', intro: 'この学校の てっぺんは オレだ!', ko: 'ま、まさか オレが…!' },
      f: { title: '女番長', name: 'オリョウ', intro: 'ここらは あたいの シマだよ!', ko: 'あたいが… まけるなんて…' } },
    { lv: 3, hp: 90, weapon: 0, armor: 3, fav: 2, crowd: 0.46,
      m: { title: 'イカサマ師', name: 'ジョー', intro: 'フフフ… 勝負は もう ついている', ko: 'バ、バカな! イカサマが きかない!?' },
      f: { title: 'イカサマ師', name: 'ローズ', intro: 'あなたの手は ぜんぶ おみとおしよ', ko: 'わ、わたくしの 計算が…!' } },
    { lv: 3, hp: 96, weapon: 3, armor: 2, fav: 1, crowd: 0.58,
      m: { title: '覆面レスラー', name: 'デスマスク', intro: 'ガハハ! リングの上は オレさまの庭だ!', ko: 'ぐはぁっ! マスクが…!' },
      f: { title: '覆面レスラー', name: 'ブラッディ・クイーン', intro: 'リングに しずめてあげるわ!', ko: 'こ、このわたしが テンカウント…!?' } },
    { lv: 4, hp: 102, weapon: 2, armor: 3, fav: 0, crowd: 0.7,
      m: { title: 'ギャングのボス', name: 'ドン・バルボ', intro: 'ワシに さからう者は ゆるさん…', ko: 'ぐぬぬ… おぼえておれ…!' },
      f: { title: 'マフィアの女ボス', name: 'マダム・ヴェノム', intro: 'おしおきの 時間よ、ぼうや', ko: 'このわたくしが… ありえない!' } },
    { lv: 4, hp: 106, weapon: 3, armor: 4, fav: 2, crowd: 0.8,
      m: { title: 'マッドドクター', name: 'ゲドウ', intro: 'キミは 実験の サンプルだよ… ヒヒヒ!', ko: 'ワタシの 計算に まちがいが…!?' },
      f: { title: '悪の魔女', name: 'グリムヒルダ', intro: 'イーッヒッヒ! カエルに してやるよ!', ko: 'ギャアアア! とけるぅぅ…!' } },
    { lv: 5, hp: 110, weapon: 4, armor: 3, fav: 1, crowd: 0.9,
      m: { title: '魔将', name: 'ザギル', intro: '魔王さまの もとへは 行かせぬ!', ko: 'ま、魔王さま… もうしわけ…!' },
      f: { title: '魔将', name: 'リリス', intro: 'ここで おわりよ。ひざまずきなさい', ko: 'ありえない… 人間ごときに…!' } },
    { lv: 5, hp: 116, weapon: 4, armor: 4, fav: 0, crowd: 1,
      m: { title: '大魔王', name: 'ダークネス', intro: 'よくぞ来た… 絶望を おしえてやろう!', ko: 'グオオオ! このワタシが… やぶれるだと…!' },
      f: { title: '悪の女帝', name: 'ダーク・クイーン', intro: 'ひれふしなさい。世界は わらわのもの!', ko: 'わらわが… まけた…!? そんな…!' } },
  ],

  // 相手のセリフ(強さ別)。性別で変わらない言い方にしてある
  lines: {
    hit: [null, ['やったー!', 'へへーん!', 'あたった!'], ['どうだ!', 'ちょろいぜ!', 'いたかった?'], ['フッ… あまい', 'おそいおそい!', 'まるみえだ'], ['クックック…', 'この程度か?', 'もう おわりか?'], ['ひれふせ!', 'ムダだ!', '絶望しろ!']],
    hurt: [null, ['いたっ!', 'うわーん!', 'ずるいー!'], ['くっ…!', 'いってぇ!', 'やるな…!'], ['なにぃ!?', 'バカな!', 'ぐっ…!'], ['おのれ…!', 'ゆるさん…!', 'ぐぬぬ…!'], ['このワタシに…!', 'こしゃくな!', 'グオオ…!']],
    guard: [null, ['セーフ!', 'あぶなっ!'], ['きかねーよ!', 'セーフ!'], ['フン!', 'よめていた'], ['きかんな…', 'ムダムダ!'], ['ムダだと 言っている!', 'かゆいわ!']],
  },
};
