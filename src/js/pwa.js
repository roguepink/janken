'use strict';
/* ホーム画面に入れられる(アプリのように開く)ための 登録。
   file:// で開いたときや、公開ページの枠の中(登録できない所)では、何もしないで そのまま遊べる。 */
(function () {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;

  /* 最初のタップで全画面にする。Android の Chrome などでは効く。
     iPhone の Safari と LINE の中では、この命令そのものが使えない(全画面になるのは、ホーム画面から開いたときだけ)。 */
  if (!standalone) {
    var el = document.documentElement;
    var request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (request) {
      var once = function (ev) {
        if (!ev.isTrusted) return;
        document.removeEventListener('pointerup', once, true);
        try {
          var r = request.call(el);
          if (r && r.catch) r.catch(function () {});
        } catch (e) {}
      };
      document.addEventListener('pointerup', once, true);
    }
  }

  /* LINE の中で開いたときは、画面が小さく、ホーム画面にも入れられない。やり方を1回だけ案内する。 */
  var isLine = /\bLine\//i.test(navigator.userAgent);
  var seenKey = 'janken-line-tip';
  var seen = false;
  try { seen = localStorage.getItem(seenKey) === '1'; } catch (e) {}
  if (isLine && !standalone && !seen) {
    var bar = document.createElement('div');
    bar.setAttribute('role', 'note');
    bar.style.cssText = 'position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:99999;' +
      'background:#fffaf0;color:#1b1430;border:3px solid #1b1430;border-radius:14px;padding:10px 40px 10px 12px;' +
      'font:700 13px/1.5 system-ui,sans-serif;box-shadow:0 4px 0 rgba(0,0,0,.35)';
    bar.textContent = 'LINEの中だと画面が小さめです。右下の「…」(または右上の︙)から「ブラウザで開く」を選ぶと、大きく遊べて、ホーム画面にも入れられます。';
    var close = document.createElement('button');
    close.type = 'button'; close.setAttribute('aria-label', 'とじる'); close.textContent = '×';
    close.style.cssText = 'position:absolute;top:4px;right:6px;width:32px;height:32px;border:0;background:none;font:900 20px/1 system-ui;color:#1b1430;cursor:pointer';
    close.addEventListener('click', function () {
      try { localStorage.setItem(seenKey, '1'); } catch (e) {}
      bar.remove();
    });
    bar.appendChild(close);
    window.addEventListener('load', function () { document.body.appendChild(bar); });
  }
})();
