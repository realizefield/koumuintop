/* ============================================================
   GAMBA行政法学習システム 共通JS
   ============================================================ */

/* ---------- 用語ポップアップ ---------- */
function initTips() {
  document.querySelectorAll('.kw').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.kw.open').forEach(o => {
        if (o !== el) o.classList.remove('open');
      });
      el.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.kw.open').forEach(o => o.classList.remove('open'));
  });
}

/* ---------- 穴埋め ---------- */
function initBlanks() {
  document.querySelectorAll('.blank').forEach(b => {
    const ans = b.dataset.a || '';
    b.textContent = '　　　';
    b.addEventListener('click', () => {
      if (b.classList.contains('revealed')) {
        b.classList.remove('revealed');
        b.textContent = '　　　';
      } else {
        b.classList.add('revealed');
        b.textContent = ans;
      }
    });
  });
}

function revealAllBlanks() {
  document.querySelectorAll('.blank').forEach(b => {
    b.classList.add('revealed');
    b.textContent = b.dataset.a || '';
  });
}
function hideAllBlanks() {
  document.querySelectorAll('.blank').forEach(b => {
    b.classList.remove('revealed');
    b.textContent = '　　　';
  });
}

/* ---------- 復習リスト保存 ---------- */
const REVIEW_KEY = 'gamba_review_list';
function getReviewList() {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]'); }
  catch(e) { return []; }
}
function saveReviewList(list) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(list));
}
function addToReview(title, url) {
  const list = getReviewList();
  if (list.find(r => r.url === url)) return false;
  list.push({ title, url, date: new Date().toISOString() });
  saveReviewList(list);
  return true;
}
function removeFromReview(url) {
  const list = getReviewList().filter(r => r.url !== url);
  saveReviewList(list);
}

function initReviewBtn() {
  document.querySelectorAll('.add-review').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title || document.title;
      const url = btn.dataset.url || location.pathname.split('/').pop();
      const added = addToReview(title, url);
      const orig = btn.textContent;
      btn.textContent = added ? '✓ 復習リストに追加しました' : '既に追加済みです';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
      }, 2000);
    });
  });
}

/* ---------- ブックマーク(問題単位) ---------- */
const BM_KEY = 'gamba_bookmark';
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BM_KEY) || '{}'); }
  catch(e) { return {}; }
}
function saveBookmarks(bm) { localStorage.setItem(BM_KEY, JSON.stringify(bm)); }
function isBookmarked(pageId, qid) {
  const bm = getBookmarks();
  return !!(bm[pageId] && bm[pageId][qid]);
}
function toggleBookmark(pageId, qid) {
  const bm = getBookmarks();
  if (!bm[pageId]) bm[pageId] = {};
  if (bm[pageId][qid]) {
    delete bm[pageId][qid];
  } else {
    bm[pageId][qid] = true;
  }
  saveBookmarks(bm);
  return !!(bm[pageId] && bm[pageId][qid]);
}

/* ---------- メモ(問題単位) ---------- */
const MEMO_KEY = 'gamba_memo';
function getMemos() {
  try { return JSON.parse(localStorage.getItem(MEMO_KEY) || '{}'); }
  catch(e) { return {}; }
}
function saveMemos(m) { localStorage.setItem(MEMO_KEY, JSON.stringify(m)); }
function getMemo(pageId, qid) {
  const m = getMemos();
  return (m[pageId] && m[pageId][qid]) || '';
}
function setMemo(pageId, qid, text) {
  const m = getMemos();
  if (!m[pageId]) m[pageId] = {};
  if (text) m[pageId][qid] = text;
  else delete m[pageId][qid];
  saveMemos(m);
}

/* ---------- 間違い記録 ---------- */
const WRONG_KEY = 'gamba_wrong';
function getWrongs() {
  try { return JSON.parse(localStorage.getItem(WRONG_KEY) || '{}'); }
  catch(e) { return {}; }
}
function saveWrongs(w) { localStorage.setItem(WRONG_KEY, JSON.stringify(w)); }
function setWrong(pageId, qid, isWrong) {
  const w = getWrongs();
  if (!w[pageId]) w[pageId] = {};
  if (isWrong) w[pageId][qid] = true;
  else delete w[pageId][qid];
  saveWrongs(w);
}
function isWrong(pageId, qid) {
  const w = getWrongs();
  return !!(w[pageId] && w[pageId][qid]);
}

/* ---------- 選択問題 ---------- */
function initChoiceQuestions(pageId) {
  document.querySelectorAll('.choice-q').forEach(q => {
    const qid = q.dataset.qid;
    const correct = parseInt(q.dataset.correct, 10);
    const opts = q.querySelectorAll('.opt');
    const submitBtn = q.querySelector('.submit-btn');
    const resetBtn = q.querySelector('.reset-btn');
    const bmBtn = q.querySelector('.qbtn.bm');
    const memoBtn = q.querySelector('.qbtn.memo');

    // 選択肢クリック
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        if (q.classList.contains('done')) return;
        opts.forEach(o => o.classList.remove('sel'));
        opt.classList.add('sel');
      });
    });

    // 解答
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const sel = q.querySelector('.opt.sel');
        if (!sel) { alert('選択肢を選んでください'); return; }
        const val = parseInt(sel.dataset.val, 10);
        opts.forEach(o => {
          const v = parseInt(o.dataset.val, 10);
          if (v === correct) o.classList.add('ok');
          else if (o === sel) o.classList.add('ng');
        });
        q.classList.add('done');
        const isCorrect = val === correct;
        if (isCorrect) q.classList.add('correct');
        else q.classList.add('wrong');
        if (pageId && qid) setWrong(pageId, qid, !isCorrect);
      });
    }

    // リセット
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('sel','ok','ng'));
        q.classList.remove('done','correct','wrong');
      });
    }

    // ブックマーク
    if (bmBtn && pageId && qid) {
      if (isBookmarked(pageId, qid)) bmBtn.classList.add('active');
      bmBtn.addEventListener('click', () => {
        const on = toggleBookmark(pageId, qid);
        bmBtn.classList.toggle('active', on);
      });
    }

    // メモ
    if (memoBtn && pageId && qid) {
      const existing = getMemo(pageId, qid);
      if (existing) {
        memoBtn.classList.add('active');
        appendMemoDisplay(q, existing);
      }
      memoBtn.addEventListener('click', () => {
        openMemoModal(pageId, qid, q);
      });
    }
  });
}

function appendMemoDisplay(qEl, text) {
  let disp = qEl.querySelector('.note-display');
  if (!disp) {
    disp = document.createElement('div');
    disp.className = 'note-display';
    qEl.appendChild(disp);
  }
  disp.textContent = '📝 ' + text;
}

function removeMemoDisplay(qEl) {
  const disp = qEl.querySelector('.note-display');
  if (disp) disp.remove();
}

function openMemoModal(pageId, qid, qEl) {
  let modal = document.getElementById('memo-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'memo-modal';
    modal.className = 'modal-bg';
    modal.innerHTML = `
      <div class="modal">
        <h3>📝 メモ</h3>
        <textarea id="memo-text" placeholder="この問題について気づいたこと、注意点などをメモしましょう"></textarea>
        <div class="m-actions">
          <button class="btn outline small" id="memo-cancel">キャンセル</button>
          <button class="btn outline small" id="memo-delete">削除</button>
          <button class="btn accent small" id="memo-save">保存</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  const ta = modal.querySelector('#memo-text');
  ta.value = getMemo(pageId, qid);
  modal.classList.add('show');

  const close = () => modal.classList.remove('show');
  modal.querySelector('#memo-cancel').onclick = close;
  modal.querySelector('#memo-save').onclick = () => {
    const txt = ta.value.trim();
    setMemo(pageId, qid, txt);
    const memoBtn = qEl.querySelector('.qbtn.memo');
    if (txt) {
      memoBtn.classList.add('active');
      appendMemoDisplay(qEl, txt);
    } else {
      memoBtn.classList.remove('active');
      removeMemoDisplay(qEl);
    }
    close();
  };
  modal.querySelector('#memo-delete').onclick = () => {
    setMemo(pageId, qid, '');
    const memoBtn = qEl.querySelector('.qbtn.memo');
    memoBtn.classList.remove('active');
    removeMemoDisplay(qEl);
    close();
  };
}

/* ---------- タブ(全問/間違えた/★) ---------- */
function initModeTabs(pageId) {
  const tabs = document.querySelectorAll('.tabs .tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('on'));
      tab.classList.add('on');
      const mode = tab.dataset.mode;
      filterQuestions(pageId, mode);
    });
  });
}

function filterQuestions(pageId, mode) {
  document.querySelectorAll('.choice-q').forEach(q => {
    const qid = q.dataset.qid;
    let show = true;
    if (mode === 'wrong') {
      show = isWrong(pageId, qid);
    } else if (mode === 'bookmark') {
      show = isBookmarked(pageId, qid);
    }
    q.classList.toggle('hidden', !show);
  });
}

/* ============================================================
   穴埋めチャレンジ機能
   ============================================================ */

let currentChallenge = {
  active: false,
  selectedWord: null,
  blanks: []
};

function initChallenge() {
  const startBtn = document.getElementById('cb-start');
  const resetBtn = document.getElementById('cb-reset');
  const judgeBtn = document.getElementById('cb-judge');
  const cancelBtn = document.getElementById('cb-cancel');
  if (!startBtn) return; // チャレンジバーがないページはスキップ

  startBtn.addEventListener('click', startChallenge);
  if (resetBtn) resetBtn.addEventListener('click', resetChallenge);
  if (judgeBtn) judgeBtn.addEventListener('click', judgeChallenge);
  if (cancelBtn) cancelBtn.addEventListener('click', cancelChallenge);
}

function startChallenge() {
  document.body.classList.add('challenge-mode');
  const blanks = document.querySelectorAll('.blank-q');
  if (!blanks.length) {
    alert('このページには穴埋め問題がありません');
    return;
  }

  currentChallenge.active = true;
  currentChallenge.blanks = Array.from(blanks);
  currentChallenge.selectedWord = null;

  // 正解ワードを集めて重複排除・シャッフル
  const words = Array.from(new Set(currentChallenge.blanks.map(b => b.dataset.a)));
  shuffleArray(words);

  // 各blankを空欄化
  currentChallenge.blanks.forEach(b => {
    b.classList.remove('normal', 'filled', 'correct', 'incorrect', 'focus');
    b.classList.add('empty');
    b.textContent = '';
    b.dataset.current = '';
    b.onclick = () => onBlankClick(b);
  });

  // 語群を作成
  const wbWords = document.getElementById('wb-words');
  wbWords.innerHTML = '';
  words.forEach(w => {
    const span = document.createElement('span');
    span.className = 'wb-word';
    span.textContent = w;
    span.dataset.word = w;
    span.onclick = () => onWordClick(span);
    wbWords.appendChild(span);
  });

  // UIを切り替え
  document.getElementById('word-bank').classList.add('show');
  document.getElementById('cb-start').style.display = 'none';
  document.getElementById('cb-reset').style.display = '';
  document.getElementById('cb-judge').style.display = '';
  document.getElementById('cb-cancel').style.display = '';
  document.getElementById('cb-status').textContent = '語群から語句をタップ → 空欄をタップ';
}

function onWordClick(wordEl) {
  if (wordEl.classList.contains('used')) return;
  // 他の選択を解除
  document.querySelectorAll('.wb-word.sel').forEach(w => w.classList.remove('sel'));
  wordEl.classList.add('sel');
  currentChallenge.selectedWord = wordEl;
  // 空欄をハイライト
  document.querySelectorAll('.blank-q.empty, .blank-q.filled').forEach(b => {
    if (!b.classList.contains('correct') && !b.classList.contains('incorrect')) {
      b.classList.add('focus');
    }
  });
}

function onBlankClick(blankEl) {
  if (blankEl.classList.contains('correct') || blankEl.classList.contains('incorrect')) return;

  // すでに語が入っていて、新しい語が選択されていない場合 → 語を戻す
  if (blankEl.classList.contains('filled') && !currentChallenge.selectedWord) {
    const currentWord = blankEl.dataset.current;
    if (currentWord) returnWordToBank(currentWord);
    blankEl.textContent = '';
    blankEl.dataset.current = '';
    blankEl.classList.remove('filled', 'focus');
    blankEl.classList.add('empty');
    return;
  }

  // 新しい語を入れる
  if (!currentChallenge.selectedWord) return;
  const newWord = currentChallenge.selectedWord.dataset.word;

  // すでに何か入っていたら、その語を語群に戻す
  if (blankEl.classList.contains('filled') && blankEl.dataset.current) {
    returnWordToBank(blankEl.dataset.current);
  }

  // 新しい語を入れる
  blankEl.textContent = newWord;
  blankEl.dataset.current = newWord;
  blankEl.classList.remove('empty', 'focus');
  blankEl.classList.add('filled');

  // 語群の語を使用済みに
  currentChallenge.selectedWord.classList.add('used');
  currentChallenge.selectedWord.classList.remove('sel');
  currentChallenge.selectedWord = null;

  // フォーカスを全解除
  document.querySelectorAll('.blank-q.focus').forEach(b => b.classList.remove('focus'));

  // 進捗更新
  updateStatus();
}

function returnWordToBank(word) {
  const words = document.querySelectorAll('.wb-word');
  // 複数使われている語でも、1つだけ戻す
  for (const w of words) {
    if (w.dataset.word === word && w.classList.contains('used')) {
      w.classList.remove('used');
      break;
    }
  }
}

function updateStatus() {
  const total = currentChallenge.blanks.length;
  const filled = currentChallenge.blanks.filter(b => b.classList.contains('filled')).length;
  document.getElementById('cb-status').textContent = `${filled} / ${total}`;
}

function judgeChallenge() {
  const blanks = currentChallenge.blanks;
  let allCorrect = true;
  let filledCount = 0;

  blanks.forEach(b => {
    const user = b.dataset.current || '';
    const ans = b.dataset.a;
    if (user) filledCount++;
    b.classList.remove('empty', 'filled', 'focus');
    if (user === ans) {
      b.classList.add('correct');
    } else {
      b.classList.add('incorrect');
      allCorrect = false;
    }
    b.onclick = null;
  });

  // すべて空欄のままだったら警告
  if (filledCount === 0) {
    alert('まだ語句が入っていません。語群から選んで空欄をタップしてください。');
    // 戻す
    blanks.forEach(b => {
      b.classList.remove('correct', 'incorrect');
      b.classList.add('empty');
      b.onclick = () => onBlankClick(b);
    });
    return;
  }

  // 語群を非表示に
  document.getElementById('word-bank').classList.remove('show');
  document.body.classList.remove('challenge-mode');
  document.getElementById('cb-judge').style.display = 'none';
  document.getElementById('cb-cancel').style.display = 'none';
  document.getElementById('cb-reset').textContent = 'もう一度チャレンジ';

  if (allCorrect) {
    showPassScreen();
  } else {
    showFailToast();
  }
}

function showPassScreen() {
  // 花吹雪
  const colors = ['#C0392B', '#f5c55b', '#2d7a4e', '#1B2A4A', '#e85443', '#f4a62a'];
  for (let i = 0; i < 80; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random() * 100 + '%';
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.animationDuration = (2 + Math.random() * 2) + 's';
    conf.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 5000);
  }

  // 合格ダイアログ
  const overlay = document.getElementById('pass-overlay');
  overlay.classList.add('show');
}

function showFailToast() {
  const wrong = currentChallenge.blanks.filter(b => b.classList.contains('incorrect')).length;
  const correct = currentChallenge.blanks.filter(b => b.classList.contains('correct')).length;
  const toast = document.getElementById('fail-toast');
  toast.innerHTML = `😢 惜しい!<br><span style="font-size:14px;font-weight:normal;">正解: ${correct} / 間違い: ${wrong}<br>もう一度チャレンジしましょう</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function resetChallenge() {
  // 判定結果をクリアして再挑戦
  const overlay = document.getElementById('pass-overlay');
  if (overlay) overlay.classList.remove('show');
  document.getElementById('cb-reset').textContent = 'リセット';
  startChallenge();
}

function cancelChallenge() {
  if (!confirm('チャレンジを中止して通常表示に戻しますか?')) return;
  // 通常表示に戻す
  currentChallenge.blanks.forEach(b => {
    b.classList.remove('empty', 'filled', 'correct', 'incorrect', 'focus');
    b.classList.add('normal');
    b.textContent = b.dataset.a;
    b.dataset.current = '';
    b.onclick = null;
  });
  document.getElementById('word-bank').classList.remove('show');
  document.body.classList.remove('challenge-mode');
  document.getElementById('cb-start').style.display = '';
  document.getElementById('cb-reset').style.display = 'none';
  document.getElementById('cb-judge').style.display = 'none';
  document.getElementById('cb-cancel').style.display = 'none';
  document.getElementById('cb-status').textContent = '';
  currentChallenge.active = false;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ---------- 初期化 ---------- */
function gambaInit(pageId) {
  if (pageId) document.body.dataset.page = pageId;
  initTips();
  initBlanks();
  initReviewBtn();
  initChallenge();
  // 初期状態:blank-qは通常表示
  document.querySelectorAll('.blank-q').forEach(b => {
    b.classList.add('normal');
    b.textContent = b.dataset.a;
  });
  if (pageId) {
    initChoiceQuestions(pageId);
    initModeTabs(pageId);
  }
}
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
