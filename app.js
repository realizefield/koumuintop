/* ========================================================
   GAMBA 行政法 v2 共通JS
   - 問題個別のブックマーク / メモ (localStorage)
   - 間違えた問題の記録
   - 3タブ切替 (全問 / 間違えた問題 / ブックマーク)
   - タイマー終了時に未回答blankへ正解ハイライト表示
   - AIチャット利用環境の警告バナーを自動挿入
   ======================================================== */

(function () {
  'use strict';

  // localStorage キー名前空間 (既存の gamba2 に合わせる)
  const NS = 'gamba2';

  /* ---------- localStorage helpers ---------- */
  function lsGet(key, def) {
    try {
      const v = localStorage.getItem(NS + '_' + key);
      return v ? JSON.parse(v) : def;
    } catch (e) { return def; }
  }
  function lsSet(key, val) {
    try {
      localStorage.setItem(NS + '_' + key, JSON.stringify(val));
    } catch (e) { /* quota exceed 等は無視 */ }
  }

  /* ブックマーク: { [pageId]: [qIndex, qIndex, ...] } */
  function getBookmarks(pid) {
    const all = lsGet('bm', {});
    return all[pid] || [];
  }
  function toggleBookmark(pid, qi) {
    const all = lsGet('bm', {});
    const arr = all[pid] || [];
    const idx = arr.indexOf(qi);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(qi);
    all[pid] = arr;
    lsSet('bm', all);
    return arr.indexOf(qi) >= 0;
  }

  /* メモ: { [pageId + '_' + qIndex]: '本文' } */
  function getMemo(pid, qi) {
    const all = lsGet('memo', {});
    return all[pid + '_' + qi] || '';
  }
  function setMemo(pid, qi, text) {
    const all = lsGet('memo', {});
    const key = pid + '_' + qi;
    if (text.trim()) all[key] = text;
    else delete all[key];
    lsSet('memo', all);
  }

  /* 間違い記録: { [pageId]: [qIndex, qIndex, ...] } */
  function getWrongList(pid) {
    const all = lsGet('wrong', {});
    return all[pid] || [];
  }
  function addWrong(pid, qi) {
    const all = lsGet('wrong', {});
    const arr = all[pid] || [];
    if (arr.indexOf(qi) < 0) arr.push(qi);
    all[pid] = arr;
    lsSet('wrong', all);
  }
  function removeWrong(pid, qi) {
    const all = lsGet('wrong', {});
    const arr = all[pid] || [];
    const idx = arr.indexOf(qi);
    if (idx >= 0) arr.splice(idx, 1);
    all[pid] = arr;
    lsSet('wrong', all);
  }

  /* ---------- 演習ページ用: タブ UI & 各問のブックマーク/メモボタン ---------- */

  /**
   * 演習ページの初期化。演習ページ側で明示的に呼び出す。
   * @param {string} pid ページ識別子 (例: 'g1ex')
   */
  function initExerciseExtras(pid) {
    const cards = document.querySelectorAll('.qcard');
    if (!cards.length) return;

    // タブUI挿入 (最初のqcardの直前)
    const firstCard = cards[0];
    const tabs = document.createElement('div');
    tabs.className = 'mode-tabs';
    tabs.innerHTML =
      '<button class="mode-tab active" data-mode="all">全問 <span class="count" id="cnt-all">0</span></button>' +
      '<button class="mode-tab" data-mode="wrong">間違えた問題 <span class="count" id="cnt-wrong">0</span></button>' +
      '<button class="mode-tab" data-mode="bm">ブックマーク <span class="count" id="cnt-bm">0</span></button>';
    firstCard.parentNode.insertBefore(tabs, firstCard);

    // 空表示メッセージ挿入 (最後のqcardの直後)
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-msg hidden';
    emptyMsg.id = 'empty-msg';
    emptyMsg.textContent = '該当する問題はありません';
    const lastCard = cards[cards.length - 1];
    lastCard.parentNode.insertBefore(emptyMsg, lastCard.nextSibling);

    // 各問題に qindex を付与し、ブックマーク★・メモ📝ボタンを追加
    cards.forEach((card, qi) => {
      card.dataset.qidx = String(qi);
      const qh = card.querySelector('.qh');
      if (!qh) return;
      const actions = document.createElement('span');
      actions.className = 'qactions';

      const bmBtn = document.createElement('button');
      bmBtn.className = 'q-btn bm-btn';
      bmBtn.title = 'ブックマーク';
      bmBtn.setAttribute('aria-label', 'ブックマーク');
      bmBtn.textContent = '★';
      bmBtn.onclick = function (e) {
        e.stopPropagation();
        const nowOn = toggleBookmark(pid, qi);
        bmBtn.classList.toggle('on', nowOn);
        refreshCounts(pid);
        if (getActiveMode() !== 'all') applyTabFilter(pid);
      };
      if (getBookmarks(pid).indexOf(qi) >= 0) bmBtn.classList.add('on');

      const memoBtn = document.createElement('button');
      memoBtn.className = 'q-btn memo-btn';
      memoBtn.title = 'メモ';
      memoBtn.setAttribute('aria-label', 'メモ');
      memoBtn.textContent = '📝';
      memoBtn.onclick = function (e) {
        e.stopPropagation();
        openMemoModal(pid, qi, memoBtn);
      };
      if (getMemo(pid, qi)) memoBtn.classList.add('on');

      actions.appendChild(bmBtn);
      actions.appendChild(memoBtn);
      qh.appendChild(actions);
    });

    // タブ切替イベント
    tabs.querySelectorAll('.mode-tab').forEach(function (btn) {
      btn.onclick = function () {
        tabs.querySelectorAll('.mode-tab').forEach(function (x) { x.classList.remove('active'); });
        btn.classList.add('active');
        applyTabFilter(pid);
      };
    });

    refreshCounts(pid);
  }

  function getActiveMode() {
    const t = document.querySelector('.mode-tab.active');
    return t ? t.dataset.mode : 'all';
  }

  function applyTabFilter(pid) {
    const mode = getActiveMode();
    const cards = document.querySelectorAll('.qcard');
    const wrong = getWrongList(pid);
    const bm = getBookmarks(pid);
    let visible = 0;
    cards.forEach(function (card) {
      const qi = parseInt(card.dataset.qidx, 10);
      let show = true;
      if (mode === 'wrong') show = wrong.indexOf(qi) >= 0;
      else if (mode === 'bm') show = bm.indexOf(qi) >= 0;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    const empty = document.getElementById('empty-msg');
    if (empty) empty.classList.toggle('hidden', visible > 0 || mode === 'all');
  }

  function refreshCounts(pid) {
    const total = document.querySelectorAll('.qcard').length;
    const wrong = getWrongList(pid).length;
    const bm = getBookmarks(pid).length;
    const a = document.getElementById('cnt-all'); if (a) a.textContent = total;
    const w = document.getElementById('cnt-wrong'); if (w) w.textContent = wrong;
    const b = document.getElementById('cnt-bm'); if (b) b.textContent = bm;
  }

  /**
   * 演習ページの pick(qi, ci) を壊さずに、間違い記録だけフックする。
   * 呼び出し側が window._origPick を保管しておいて、これを呼ぶ方式にする。
   */
  function recordAnswer(pid, qi, isCorrect) {
    if (isCorrect) removeWrong(pid, qi);
    else addWrong(pid, qi);
    refreshCounts(pid);
  }

  /* ---------- メモモーダル ---------- */
  function ensureModal() {
    let m = document.getElementById('memo-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'memo-modal';
    m.className = 'modal-backdrop';
    m.innerHTML =
      '<div class="modal-box">' +
      '  <h3 id="memo-modal-title">メモ</h3>' +
      '  <textarea id="memo-modal-text" placeholder="この問題に関するメモ（解き方のポイント、間違えた理由、覚え方など）"></textarea>' +
      '  <div class="modal-actions">' +
      '    <button id="memo-modal-cancel">キャンセル</button>' +
      '    <button id="memo-modal-save" class="primary">保存</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(m);
    m.onclick = function (e) { if (e.target === m) m.classList.remove('on'); };
    return m;
  }

  function openMemoModal(pid, qi, btnEl) {
    const m = ensureModal();
    const ta = m.querySelector('#memo-modal-text');
    const title = m.querySelector('#memo-modal-title');
    title.textContent = '問題 ' + (qi + 1) + ' のメモ';
    ta.value = getMemo(pid, qi);
    m.classList.add('on');
    setTimeout(function () { ta.focus(); }, 50);

    m.querySelector('#memo-modal-cancel').onclick = function () { m.classList.remove('on'); };
    m.querySelector('#memo-modal-save').onclick = function () {
      setMemo(pid, qi, ta.value);
      if (btnEl) btnEl.classList.toggle('on', !!ta.value.trim());
      m.classList.remove('on');
    };
  }

  /* ---------- 解説ページ用: タイマー終了時ハイライト ---------- */

  /**
   * 未回答(まだok クラスが付いていない)blankに正解をハイライト表示。
   * 解説ページの showR(false) パス(タイムアップ)で呼ぶ想定。
   */
  function highlightUnansweredBlanks() {
    document.querySelectorAll('.blank').forEach(function (b) {
      if (b.classList.contains('ok')) return;
      const ans = b.dataset.ans;
      if (ans) {
        b.textContent = ans;
        b.classList.add('timeup');
      }
    });
  }

  /* ---------- AIチャット CORS 警告バナー ---------- */

  /**
   * AIチャット入力欄(#cinp)の上に警告バナーを挿入する。
   * file:// や https://api.anthropic.com に直接 fetch できないドメインで表示。
   */
  function injectAiWarning() {
    const inp = document.getElementById('cinp');
    if (!inp) return;
    if (document.getElementById('ai-warn')) return;

    // 挿入位置: cinp の親 (チャット入力行) の上
    const row = inp.closest('.cbar') || inp.parentNode;
    if (!row) return;

    const warn = document.createElement('div');
    warn.id = 'ai-warn';
    warn.className = 'ai-warn';
    warn.innerHTML =
      '<b>※AIチャット利用について：</b>この機能は本番API(<code>api.anthropic.com</code>)への直接アクセスを前提としています。' +
      'ブラウザから直接開いた場合はCORS制約で応答が得られないことがあります。' +
      '通信エラーと表示された場合は、専用のバックエンド経由で開く必要があります。';
    row.parentNode.insertBefore(warn, row);
  }

  /* ---------- 公開API ---------- */
  window.GambaV2 = {
    initExerciseExtras: initExerciseExtras,
    recordAnswer: recordAnswer,
    highlightUnansweredBlanks: highlightUnansweredBlanks,
    injectAiWarning: injectAiWarning,
    // 下記はデバッグ/拡張用
    _getBookmarks: getBookmarks,
    _getMemo: getMemo,
    _getWrongList: getWrongList
  };

  /* 解説ページでは自動的にCORS警告を挿入 */
  document.addEventListener('DOMContentLoaded', function () {
    injectAiWarning();
  });
})();
