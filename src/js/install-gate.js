'use strict';
/* はじめの画面(Google Play 風: インストールして遊ぶ / このまま遊ぶ)の中身。見本は roguepink/sokai。 */
window.INSTALL_GATE = {
  id: 'janken',
  name: 'たたいて かぶって ' + 'ジャンケンポン!'.split('').join('\u2060'), // \u2060 = 見えない「ここで折らない」印(ジャン/ケンポンで折れないように)
  icon: 'icon-192.png',
  color: '#f0402f',
  tagline: 'リングの上の じゃんけん対決',
  badges: ['無料', '広告なし', '登録なし'],
  shots: ['shots/1.jpg', 'shots/2.jpg', 'shots/3.jpg', 'shots/4.jpg', 'shots/5.jpg'],
  desc: 'じゃんけんに勝ったら ハンマーやハリセンで相手の頭をたたき、負けたら ヘルメットをかぶって守る 対戦ゲーム。先にHPがなくなったほうの負け。10人の相手をたおして、チャンピオンをめざします。',
  points: ['武器と防具は5種類ずつ。重い武器ほど強いけれど遅く、ガードの上からもダメージが通る', '相手は10人。いたずらっ子から始まり、ヤンキー、覆面レスラー、最後は大魔王', 'むずかしさは3段階。男性か女性を選ぶと、相手も同じになる'],
  playLabel: '▶ このまま遊ぶ'
};

/* 部品の install.js(ROGUE PINK 共通の はじめの画面。中身は書きかえない)は、説明書きに script を閉じる字があって
   1ファイルにまとめられないので、ここから 別のファイルとして読みこむ。電波がないときは sw.js が覚えた install.js を使う。
   読みこむまでの一瞬、ゲームの画面が見えてしまわないよう、はじめの画面と同じ色の幕をかけておく(出さないときは かけない)。 */
(function () {
  var C = window.INSTALL_GATE;
  var mm = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var standalone = mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || navigator.standalone === true;
  var hide = false;
  try { hide = localStorage.getItem('ig-' + C.id + '-hide') === '1'; } catch (e) {}
  var cover = null;
  if (!standalone && !hide && !/play|auto|noinstall/.test(location.hash || '')) {
    cover = document.createElement('div');
    cover.style.cssText = 'position:fixed;inset:0;z-index:2147482999;background:rgb(8,6,14)';
    document.body.appendChild(cover);
  }
  var done = function () { if (cover && cover.parentNode) cover.parentNode.removeChild(cover); cover = null; };
  var s = document.createElement('script');
  s.src = 'install.js';
  s.onload = done; s.onerror = done;
  setTimeout(done, 4000);
  document.body.appendChild(s);
})();
