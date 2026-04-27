/* ============================================ */
/* ミニテスト機能                                 */
/* ============================================ */
(function() {
  'use strict';

  // 花吹雪を散らす
  function showSakura() {
    var overlay = document.getElementById('sakura-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sakura-overlay';
      overlay.className = 'sakura-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';
    overlay.classList.add('show');

    var count = 50;
    for (var i = 0; i < count; i++) {
      var petal = document.createElement('div');
      petal.className = 'sakura-petal' + (Math.random() < 0.5 ? ' alt' : '');
      petal.style.left = (Math.random() * 100) + 'vw';
      var dur = 3 + Math.random() * 3;
      petal.style.animationDuration = dur + 's';
      petal.style.animationDelay = (Math.random() * 1.5) + 's';
      petal.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
      overlay.appendChild(petal);
    }

    setTimeout(function() {
      overlay.classList.remove('show');
      overlay.innerHTML = '';
    }, 6000);
  }

  // 1つのミニテストを初期化
  function initMiniTest(el) {
    var btn = el.querySelector('.mini-btn');
    var body = el.querySelector('.mini-body');
    var qs = el.querySelectorAll('.mini-q');
    var judgeBtn = el.querySelector('.mini-judge');
    var resetBtn = el.querySelector('.mini-reset');
    var result = el.querySelector('.mini-result');

    if (!btn || !body) return;

    // 開閉
    btn.addEventListener('click', function() {
      el.classList.toggle('is-open');
      btn.classList.toggle('is-open');
    });

    // 各問の○×選択
    qs.forEach(function(q) {
      var choices = q.querySelectorAll('.mini-c');
      choices.forEach(function(c) {
        c.addEventListener('click', function() {
          if (q.classList.contains('show-exp')) return; // 判定後はロック
          choices.forEach(function(x) { x.classList.remove('selected'); });
          c.classList.add('selected');
          q.dataset.user = c.dataset.v;
        });
      });
    });

    // 答え合わせ
    judgeBtn.addEventListener('click', function() {
      var allAnswered = true;
      qs.forEach(function(q) {
        if (!q.dataset.user) allAnswered = false;
      });
      if (!allAnswered) {
        result.className = 'mini-result fail show';
        result.innerHTML = '<span class="big">⚠️</span>すべての問題に解答してください';
        return;
      }

      var correctCount = 0;
      qs.forEach(function(q) {
        var ans = q.dataset.correct;
        var user = q.dataset.user;
        q.classList.add('show-exp');
        if (ans === user) {
          q.classList.add('is-correct');
          correctCount++;
        } else {
          q.classList.add('is-wrong');
        }
      });

      var total = qs.length;
      if (correctCount === total) {
        result.className = 'mini-result pass show';
        result.innerHTML = '<span class="big">🌸 合格! 🌸</span>全' + total + '問正解です!この調子で次へ進みましょう。';
        showSakura();
      } else {
        result.className = 'mini-result fail show';
        result.innerHTML = '<span class="big">惜しい!</span>' + total + '問中 ' + correctCount + '問正解。下の解説を確認してから「もう一度挑戦」を押してください。';
      }

      judgeBtn.style.display = 'none';
      resetBtn.style.display = 'inline-block';
    });

    // リセット
    resetBtn.addEventListener('click', function() {
      qs.forEach(function(q) {
        q.classList.remove('is-correct', 'is-wrong', 'show-exp');
        delete q.dataset.user;
        var choices = q.querySelectorAll('.mini-c');
        choices.forEach(function(c) { c.classList.remove('selected'); });
      });
      result.className = 'mini-result';
      result.innerHTML = '';
      judgeBtn.style.display = 'inline-block';
      resetBtn.style.display = 'none';
    });
  }

  // ページ全体を初期化
  function initAllMiniTests() {
    var tests = document.querySelectorAll('.mini-test');
    tests.forEach(initMiniTest);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllMiniTests);
  } else {
    initAllMiniTests();
  }
})();
