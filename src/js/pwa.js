'use strict';
/* ホーム画面に入れられる(アプリのように開く)ための 登録。
   file:// で開いたときや、公開ページの枠の中(登録できない所)では、何もしないで そのまま遊べる。 */
(function () {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
})();
