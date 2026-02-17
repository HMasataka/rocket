// ===== State Management =====
const state = {
  currentView: 'changes',
  currentBranch: 'main',
  theme: 'dark',
  selectedFile: null,
  hunkMode: false,
  lineSelectMode: false
};

// ===== Sample Data =====
const sampleData = {
  branches: [
    { name: 'main', current: true, remote: 'origin/main', ahead: 0, behind: 0 },
    { name: 'feature/auth', current: false, remote: 'origin/feature/auth', ahead: 2, behind: 0 },
    { name: 'feature/ui-redesign', current: false, remote: null, ahead: 5, behind: 0 },
    { name: 'hotfix/login-bug', current: false, remote: 'origin/hotfix/login-bug', ahead: 0, behind: 1 }
  ],
  commits: [
    { hash: 'a1b2c3d', message: 'feat: ユーザー認証機能を追加', author: 'tanaka', date: '2日前', branch: 'main' },
    { hash: 'e4f5g6h', message: 'fix: ログインバグを修正', author: 'yamada', date: '3日前', branch: 'main' },
    { hash: 'i7j8k9l', message: 'docs: READMEを更新', author: 'tanaka', date: '4日前', branch: 'main' },
    { hash: 'm0n1o2p', message: 'refactor: コード整理', author: 'suzuki', date: '5日前', branch: 'main' },
    { hash: 'q3r4s5t', message: 'feat: 設定画面を追加', author: 'tanaka', date: '1週間前', branch: 'main' }
  ],
  stashes: [
    { index: 0, message: 'WIP: 認証機能の途中', branch: 'feature/auth', date: '1時間前' },
    { index: 1, message: 'WIP: UI調整', branch: 'main', date: '昨日' }
  ],
  tags: [
    { name: 'v1.0.0', commit: 'a1b2c3d', message: 'Initial release', date: '1週間前' },
    { name: 'v0.9.0', commit: 'q3r4s5t', message: 'Beta release', date: '2週間前' }
  ],
  remotes: [
    { name: 'origin', url: 'git@github.com:HMasataka/rocket.git', fetch: true, push: true }
  ]
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  initDiffView();
  initKeyboardShortcuts();
  initResponsive();
});

// ===== Responsive Handling =====
function initResponsive() {
  // Handle window resize
  window.addEventListener('resize', handleResize);
  handleResize();
}

function handleResize() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  // Close sidebar on larger screens
  if (window.innerWidth > 767) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// ===== View Switching =====
function switchView(viewName) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
    loadViewContent(viewName);
  }

  state.currentView = viewName;
}

function loadViewContent(viewName) {
  const view = document.getElementById(`view-${viewName}`);
  if (!view || view.dataset.loaded) return;

  switch (viewName) {
    case 'history':
      view.innerHTML = getHistoryViewHTML();
      break;
    case 'branches':
      view.innerHTML = getBranchesViewHTML();
      break;
    case 'remotes':
      view.innerHTML = getRemotesViewHTML();
      break;
    case 'advanced':
      view.innerHTML = getAdvancedViewHTML();
      break;
  }
  view.dataset.loaded = 'true';
}

// ===== Diff View =====
function initDiffView() {
  const diffContent = document.getElementById('diff-content');
  diffContent.innerHTML = getSampleDiffHTML();
}

function getSampleDiffHTML() {
  return `
    <div class="diff-hunk">
      <div class="diff-hunk-header">
        <span>@@ -1,10 +1,15 @@ package auth</span>
        <div class="hunk-actions">
          <button class="hunk-btn" onclick="stageHunk(0)">Stage Hunk</button>
          <button class="hunk-btn" onclick="discardHunk(0)">Discard</button>
        </div>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">1</span>
        <span class="line-content">package auth</span>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">2</span>
        <span class="line-content"></span>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">3</span>
        <span class="line-content">import (</span>
      </div>
      <div class="diff-line add">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">4</span>
        <span class="line-content">+    "context"</span>
      </div>
      <div class="diff-line add">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">5</span>
        <span class="line-content">+    "errors"</span>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">6</span>
        <span class="line-content">    "fmt"</span>
      </div>
      <div class="diff-line del">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">7</span>
        <span class="line-content">-    "log"</span>
      </div>
      <div class="diff-line add">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">8</span>
        <span class="line-content">+    "log/slog"</span>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">9</span>
        <span class="line-content">)</span>
      </div>
    </div>
    <div class="diff-hunk">
      <div class="diff-hunk-header">
        <span>@@ -25,6 +30,20 @@ func NewHandler() *Handler {</span>
        <div class="hunk-actions">
          <button class="hunk-btn" onclick="stageHunk(1)">Stage Hunk</button>
          <button class="hunk-btn" onclick="discardHunk(1)">Discard</button>
        </div>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">25</span>
        <span class="line-content">func NewHandler() *Handler {</span>
      </div>
      <div class="diff-line add">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">26</span>
        <span class="line-content">+    return &Handler{</span>
      </div>
      <div class="diff-line add">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">27</span>
        <span class="line-content">+        logger: slog.Default(),</span>
      </div>
      <div class="diff-line add">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">28</span>
        <span class="line-content">+    }</span>
      </div>
      <div class="diff-line del">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">29</span>
        <span class="line-content">-    return &Handler{}</span>
      </div>
      <div class="diff-line">
        <div class="line-checkbox"><input type="checkbox"></div>
        <span class="line-num">30</span>
        <span class="line-content">}</span>
      </div>
    </div>
  `;
}

function setDiffView(mode) {
  document.querySelectorAll('.view-toggle .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === mode);
  });
  // In a real app, this would switch between inline and split view
  showToast('info', `${mode === 'split' ? 'Split' : 'Inline'}ビューに切り替えました`);
}

function toggleHunkMode() {
  state.hunkMode = !state.hunkMode;
  showToast('info', state.hunkMode ? 'ハンクモードを有効化' : 'ハンクモードを無効化');
}

// ===== File Operations =====
function selectFile(element, type) {
  document.querySelectorAll('.file-item').forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');
  state.selectedFile = { element, type };
}

function stageFile(event) {
  event.stopPropagation();
  showToast('success', 'ファイルをステージしました');
}

function unstageFile(event) {
  event.stopPropagation();
  showToast('success', 'ファイルをアンステージしました');
}

function stageAll() {
  showToast('success', 'すべてのファイルをステージしました');
}

function stageHunk(index) {
  showToast('success', `ハンク ${index + 1} をステージしました`);
}

function discardHunk(index) {
  showToast('warning', `ハンク ${index + 1} を破棄しました`);
}

function toggleSection(header) {
  header.classList.toggle('collapsed');
  const fileList = header.nextElementSibling;
  if (fileList) {
    fileList.style.display = header.classList.contains('collapsed') ? 'none' : 'block';
  }
}

// ===== Commit Operations =====
function performCommit() {
  const subject = document.getElementById('commit-subject').value;
  if (!subject.trim()) {
    showToast('error', 'コミットメッセージを入力してください');
    return;
  }
  showToast('success', 'コミットを作成しました');
  document.getElementById('commit-subject').value = '';
  document.getElementById('commit-body').value = '';
}

function generateCommitMessage() {
  openModal('ai-commit');
}

// ===== Toolbar Actions =====
function performAction(action) {
  switch (action) {
    case 'fetch':
      showToast('info', 'Fetching from origin...');
      setTimeout(() => showToast('success', 'Fetch完了'), 1000);
      break;
    case 'pull':
      showToast('info', 'Pulling from origin/main...');
      setTimeout(() => showToast('success', 'Pull完了 - Already up to date'), 1000);
      break;
    case 'push':
      showToast('info', 'Pushing to origin/main...');
      setTimeout(() => showToast('success', 'Push完了'), 1000);
      break;
  }
}

// ===== Modal System =====
function openModal(type) {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');

  container.innerHTML = getModalContent(type);
  container.style.width = getModalWidth(type);

  overlay.classList.add('active');
  container.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal-container').classList.remove('active');
}

function getModalWidth(type) {
  const widths = {
    'branch': '500px',
    'stash': '500px',
    'tag': '500px',
    'settings': '700px',
    'ai-assist': '600px',
    'ai-commit': '550px',
    'ai-review': '700px',
    'search': '600px',
    'conflict': '900px',
    'merge': '95vw'
  };
  return widths[type] || '500px';
}

function getModalContent(type) {
  switch (type) {
    case 'branch':
      return getBranchModalHTML();
    case 'stash':
      return getStashModalHTML();
    case 'tag':
      return getTagModalHTML();
    case 'settings':
      return getSettingsModalHTML();
    case 'ai-assist':
      return getAIAssistModalHTML();
    case 'ai-commit':
      return getAICommitModalHTML();
    case 'ai-review':
      return getAIReviewModalHTML();
    case 'search':
      return getSearchModalHTML();
    case 'conflict':
      return getConflictModalHTML();
    case 'merge':
      return getMergeViewerModalHTML();
    default:
      return '<div class="modal-body">Loading...</div>';
  }
}

// ===== Modal HTML Templates =====
function getBranchModalHTML() {
  const branchList = sampleData.branches.map(b => `
    <div class="branch-item ${b.current ? 'current' : ''}" onclick="switchBranch('${b.name}')">
      <div class="branch-info">
        <span class="branch-name">${b.name}</span>
        ${b.remote ? `<span class="branch-remote">${b.remote}</span>` : ''}
      </div>
      <div class="branch-status">
        ${b.ahead > 0 ? `<span class="ahead">↑${b.ahead}</span>` : ''}
        ${b.behind > 0 ? `<span class="behind">↓${b.behind}</span>` : ''}
        ${b.current ? '<span class="current-badge">現在</span>' : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <span class="modal-title">ブランチ</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-search">
        <input type="text" placeholder="ブランチを検索..." class="modal-input">
      </div>
      <div class="branch-list">${branchList}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="createBranch()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        新規ブランチ
      </button>
    </div>
    <style>
      .modal-search { margin-bottom: 16px; }
      .modal-input { width: 100%; padding: 10px 14px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-family: inherit; font-size: 13px; }
      .modal-input:focus { outline: none; border-color: var(--accent); }
      .branch-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
      .branch-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-tertiary); border-radius: 6px; cursor: pointer; }
      .branch-item:hover { background: var(--accent-dim); }
      .branch-item.current { border: 1px solid var(--accent); }
      .branch-info { display: flex; flex-direction: column; gap: 2px; }
      .branch-name { font-size: 13px; font-weight: 500; }
      .branch-remote { font-size: 11px; color: var(--text-muted); }
      .branch-status { display: flex; align-items: center; gap: 8px; font-size: 11px; }
      .ahead { color: var(--success); }
      .behind { color: var(--warning); }
      .current-badge { padding: 2px 8px; background: var(--accent); color: #fff; border-radius: 4px; font-size: 10px; }
    </style>
  `;
}

function getStashModalHTML() {
  const stashList = sampleData.stashes.map(s => `
    <div class="stash-item">
      <div class="stash-info">
        <span class="stash-message">${s.message}</span>
        <span class="stash-meta">${s.branch} • ${s.date}</span>
      </div>
      <div class="stash-actions">
        <button class="icon-btn" onclick="applyStash(${s.index})" title="Apply">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
        </button>
        <button class="icon-btn" onclick="popStash(${s.index})" title="Pop">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/></svg>
        </button>
        <button class="icon-btn" onclick="dropStash(${s.index})" title="Drop">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <span class="modal-title">Stash</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="stash-list">${stashList}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">閉じる</button>
      <button class="btn btn-primary" onclick="createStash()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        Stash作成
      </button>
    </div>
    <style>
      .stash-list { display: flex; flex-direction: column; gap: 8px; }
      .stash-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-tertiary); border-radius: 8px; }
      .stash-info { display: flex; flex-direction: column; gap: 4px; }
      .stash-message { font-size: 13px; font-weight: 500; }
      .stash-meta { font-size: 11px; color: var(--text-muted); }
      .stash-actions { display: flex; gap: 4px; }
    </style>
  `;
}

function getTagModalHTML() {
  const tagList = sampleData.tags.map(t => `
    <div class="tag-item">
      <div class="tag-info">
        <span class="tag-name">${t.name}</span>
        <span class="tag-meta">${t.commit} • ${t.date}</span>
      </div>
      <div class="tag-actions">
        <button class="icon-btn" onclick="checkoutTag('${t.name}')" title="Checkout">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
        </button>
        <button class="icon-btn" onclick="deleteTag('${t.name}')" title="Delete">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <span class="modal-title">タグ</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="tag-list">${tagList}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">閉じる</button>
      <button class="btn btn-primary" onclick="createTag()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        新規タグ
      </button>
    </div>
    <style>
      .tag-list { display: flex; flex-direction: column; gap: 8px; }
      .tag-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-tertiary); border-radius: 8px; }
      .tag-info { display: flex; flex-direction: column; gap: 4px; }
      .tag-name { font-size: 13px; font-weight: 500; color: var(--warning); }
      .tag-meta { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
      .tag-actions { display: flex; gap: 4px; }
    </style>
  `;
}

function getSettingsModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">設定</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="settings-layout">
        <nav class="settings-nav">
          <div class="settings-nav-item active" onclick="switchSettingsTab(this, 'appearance')">外観</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'editor')">エディタ</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'ai')">AI設定</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'keybindings')">キーバインド</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'tools')">外部ツール</div>
        </nav>
        <div class="settings-content">
          <div class="settings-section">
            <h3>テーマ</h3>
            <div class="theme-selector">
              <label class="theme-option selected">
                <input type="radio" name="theme" value="dark" checked>
                <span class="theme-preview dark"></span>
                <span>Dark</span>
              </label>
              <label class="theme-option">
                <input type="radio" name="theme" value="light">
                <span class="theme-preview light"></span>
                <span>Light</span>
              </label>
            </div>
          </div>
          <div class="settings-section">
            <h3>カラーテーマ</h3>
            <div class="color-picker">
              <div class="color-option selected" style="--color: #58a6ff" data-theme="cobalt"></div>
              <div class="color-option" style="--color: #34d399" data-theme="emerald"></div>
              <div class="color-option" style="--color: #f472b6" data-theme="rose"></div>
              <div class="color-option" style="--color: #f59e0b" data-theme="amber"></div>
              <div class="color-option" style="--color: #a5a5b4" data-theme="slate"></div>
              <div class="color-option" style="--color: #a78bfa" data-theme="violet"></div>
            </div>
          </div>
          <div class="settings-section">
            <h3>フォントサイズ</h3>
            <div class="setting-row">
              <label>エディタ</label>
              <input type="range" min="10" max="20" value="13">
              <span>13px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>
      .settings-layout { display: grid; grid-template-columns: 160px 1fr; gap: 24px; min-height: 400px; }
      .settings-nav { display: flex; flex-direction: column; gap: 4px; }
      .settings-nav-item { padding: 8px 12px; font-size: 13px; color: var(--text-secondary); cursor: pointer; border-radius: 6px; }
      .settings-nav-item:hover { background: var(--bg-tertiary); }
      .settings-nav-item.active { background: var(--accent-dim); color: var(--accent); }
      .settings-content { display: flex; flex-direction: column; gap: 24px; }
      .settings-section h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
      .theme-selector { display: flex; gap: 12px; }
      .theme-option { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; background: var(--bg-tertiary); border: 2px solid transparent; border-radius: 8px; cursor: pointer; }
      .theme-option.selected { border-color: var(--accent); }
      .theme-option input { display: none; }
      .theme-preview { width: 80px; height: 50px; border-radius: 6px; }
      .theme-preview.dark { background: #0f1419; border: 1px solid #2d3640; }
      .theme-preview.light { background: #fff; border: 1px solid #d1d9e0; }
      .color-picker { display: flex; gap: 8px; }
      .color-option { width: 32px; height: 32px; border-radius: 8px; background: var(--color); cursor: pointer; border: 2px solid transparent; }
      .color-option:hover { transform: scale(1.1); }
      .color-option.selected { border-color: var(--text-primary); }
      .setting-row { display: flex; align-items: center; gap: 12px; }
      .setting-row label { flex: 1; font-size: 13px; }
      .setting-row input[type="range"] { width: 150px; }
      .setting-row span { font-size: 12px; color: var(--text-muted); width: 40px; }
    </style>
  `;
}

function getAIAssistModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">🤖 AI アシスト</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="ai-options">
        <div class="ai-option" onclick="openModal('ai-commit')">
          <div class="ai-option-icon">✍️</div>
          <div class="ai-option-info">
            <div class="ai-option-title">コミットメッセージ生成</div>
            <div class="ai-option-desc">ステージ済みの差分から自動生成</div>
          </div>
        </div>
        <div class="ai-option" onclick="openModal('ai-review')">
          <div class="ai-option-icon">🔍</div>
          <div class="ai-option-info">
            <div class="ai-option-title">コードレビュー</div>
            <div class="ai-option-desc">差分を分析してレビューコメントを提案</div>
          </div>
        </div>
        <div class="ai-option" onclick="showToast('info', 'パッチ生成を開始します')">
          <div class="ai-option-icon">🔧</div>
          <div class="ai-option-info">
            <div class="ai-option-title">パッチ生成</div>
            <div class="ai-option-desc">レビューコメントから修正パッチを生成</div>
          </div>
        </div>
        <div class="ai-option" onclick="showToast('info', 'PR説明文を生成します')">
          <div class="ai-option-icon">📝</div>
          <div class="ai-option-info">
            <div class="ai-option-title">PR説明文生成</div>
            <div class="ai-option-desc">ブランチの変更からPR説明文を生成</div>
          </div>
        </div>
      </div>
      <div class="ai-cli-selector">
        <label>使用するAI CLI:</label>
        <select class="modal-select">
          <option value="claude">Claude CLI</option>
          <option value="codex">Codex CLI</option>
          <option value="copilot">GitHub Copilot</option>
        </select>
      </div>
    </div>
    <style>
      .ai-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
      .ai-option { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
      .ai-option:hover { background: var(--purple-dim); border-color: var(--purple); }
      .ai-option-icon { font-size: 24px; }
      .ai-option-info { flex: 1; }
      .ai-option-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .ai-option-desc { font-size: 12px; color: var(--text-muted); }
      .ai-cli-selector { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
      .ai-cli-selector label { font-size: 13px; color: var(--text-secondary); }
      .modal-select { padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-family: inherit; font-size: 13px; }
    </style>
  `;
}

function getAICommitModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">✍️ AIコミットメッセージ生成</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="ai-settings-row">
        <label>形式:</label>
        <select class="modal-select">
          <option value="conventional">Conventional Commits</option>
          <option value="simple">シンプル</option>
          <option value="detailed">詳細</option>
        </select>
        <label>言語:</label>
        <select class="modal-select">
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
      </div>
      <div class="ai-generating">
        <div class="ai-spinner"></div>
        <span>生成中...</span>
      </div>
      <div class="ai-result" style="display: none;">
        <div class="ai-suggestion">
          <div class="suggestion-subject">feat(auth): ユーザー認証ハンドラーを追加</div>
          <div class="suggestion-body">- 新しいAuthHandlerを実装
- slogを使用したログ出力に変更
- エラーハンドリングを追加</div>
        </div>
        <div class="ai-alternatives">
          <span class="alternatives-label">他の候補:</span>
          <button class="alt-btn">feat: 認証機能を追加</button>
          <button class="alt-btn">add: auth handler with logging</button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="useGeneratedMessage()">採用</button>
    </div>
    <style>
      .ai-settings-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
      .ai-settings-row label { font-size: 13px; color: var(--text-secondary); }
      .ai-generating { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 40px; color: var(--text-muted); }
      .ai-spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .ai-result { display: flex; flex-direction: column; gap: 16px; }
      .ai-suggestion { padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border: 1px solid var(--accent); }
      .suggestion-subject { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
      .suggestion-body { font-size: 12px; color: var(--text-secondary); white-space: pre-line; }
      .ai-alternatives { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .alternatives-label { font-size: 12px; color: var(--text-muted); }
      .alt-btn { padding: 6px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); font-size: 11px; cursor: pointer; }
      .alt-btn:hover { border-color: var(--accent); color: var(--accent); }
    </style>
  `;
}

function getAIReviewModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">🔍 AIコードレビュー</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="review-summary">
        <div class="review-stat">
          <span class="stat-value">3</span>
          <span class="stat-label">ファイル分析</span>
        </div>
        <div class="review-stat warning">
          <span class="stat-value">2</span>
          <span class="stat-label">警告</span>
        </div>
        <div class="review-stat danger">
          <span class="stat-value">1</span>
          <span class="stat-label">セキュリティ</span>
        </div>
      </div>
      <div class="review-items">
        <div class="review-item warning">
          <div class="review-header">
            <span class="review-file">src/auth/handler.go:15</span>
            <span class="review-type">⚠️ 警告</span>
          </div>
          <div class="review-message">エラーハンドリングが不足しています。contextがnilの場合の処理を追加してください。</div>
          <div class="review-actions">
            <button class="btn btn-secondary btn-sm">無視</button>
            <button class="btn btn-primary btn-sm">パッチを生成</button>
          </div>
        </div>
        <div class="review-item danger">
          <div class="review-header">
            <span class="review-file">src/auth/token.go:42</span>
            <span class="review-type">🔴 セキュリティ</span>
          </div>
          <div class="review-message">ハードコードされた秘密鍵が検出されました。環境変数から読み込むように修正してください。</div>
          <div class="review-actions">
            <button class="btn btn-secondary btn-sm">無視</button>
            <button class="btn btn-primary btn-sm">パッチを生成</button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .review-summary { display: flex; gap: 16px; margin-bottom: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; }
      .review-stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
      .stat-value { font-size: 24px; font-weight: 700; }
      .stat-label { font-size: 11px; color: var(--text-muted); }
      .review-stat.warning .stat-value { color: var(--warning); }
      .review-stat.danger .stat-value { color: var(--danger); }
      .review-items { display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto; }
      .review-item { padding: 14px; background: var(--bg-tertiary); border-radius: 8px; border-left: 3px solid var(--border); }
      .review-item.warning { border-left-color: var(--warning); }
      .review-item.danger { border-left-color: var(--danger); }
      .review-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
      .review-file { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--accent); }
      .review-type { font-size: 11px; }
      .review-message { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
      .review-actions { display: flex; gap: 8px; }
      .btn-sm { padding: 6px 12px; font-size: 11px; }
    </style>
  `;
}

function getSearchModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">🔍 リポジトリ検索</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="search-input-group">
        <input type="text" class="modal-input search-main" placeholder="検索キーワードを入力..." autofocus>
      </div>
      <div class="search-filters">
        <button class="filter-btn active">コード</button>
        <button class="filter-btn">コミット</button>
        <button class="filter-btn">ファイル名</button>
      </div>
      <div class="search-results">
        <div class="search-result">
          <div class="result-file">src/auth/handler.go</div>
          <div class="result-line">func <mark>handleAuth</mark>(ctx *Context) error {</div>
        </div>
        <div class="search-result">
          <div class="result-file">src/auth/middleware.go</div>
          <div class="result-line">type <mark>Auth</mark>Middleware struct {</div>
        </div>
        <div class="search-result">
          <div class="result-file">src/config/settings.go</div>
          <div class="result-line">EnableAuth: true, // Enable <mark>auth</mark>entication</div>
        </div>
      </div>
    </div>
    <style>
      .search-input-group { margin-bottom: 16px; }
      .search-main { width: 100%; padding: 12px 16px; font-size: 14px; }
      .search-filters { display: flex; gap: 8px; margin-bottom: 16px; }
      .filter-btn { padding: 6px 14px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); font-size: 12px; cursor: pointer; }
      .filter-btn:hover { border-color: var(--accent); }
      .filter-btn.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
      .search-results { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
      .search-result { padding: 12px; background: var(--bg-tertiary); border-radius: 6px; cursor: pointer; }
      .search-result:hover { background: var(--accent-dim); }
      .result-file { font-size: 12px; color: var(--accent); margin-bottom: 6px; }
      .result-line { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-secondary); }
      .result-line mark { background: var(--warning-dim); color: var(--warning); padding: 1px 4px; border-radius: 3px; }
    </style>
  `;
}

function getConflictModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">⚠️ コンフリクト解決</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="conflict-info">
        <span>src/config/settings.go</span>
        <span class="conflict-count">3 conflicts</span>
      </div>
      <div class="conflict-content">
        <div class="conflict-block">
          <div class="conflict-header ours"><<<<<<< HEAD (current)</div>
          <pre class="conflict-code">    Port: 8080,
    Host: "localhost",</pre>
          <div class="conflict-header marker">=======</div>
          <pre class="conflict-code">    Port: 3000,
    Host: "0.0.0.0",</pre>
          <div class="conflict-header theirs">>>>>>>> feature/config</div>
        </div>
        <div class="conflict-actions">
          <button class="btn btn-secondary" onclick="resolveConflict('ours')">Oursを採用</button>
          <button class="btn btn-secondary" onclick="resolveConflict('theirs')">Theirsを採用</button>
          <button class="btn btn-secondary" onclick="resolveConflict('both')">両方を採用</button>
          <button class="btn btn-primary" onclick="openModal('merge')">3-wayマージビューア</button>
        </div>
      </div>
    </div>
    <style>
      .conflict-info { display: flex; justify-content: space-between; padding: 12px 16px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 16px; }
      .conflict-info span { font-size: 13px; }
      .conflict-count { color: var(--warning); font-weight: 600; }
      .conflict-content { display: flex; flex-direction: column; gap: 16px; }
      .conflict-block { background: var(--bg-secondary); border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
      .conflict-header { padding: 6px 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
      .conflict-header.ours { background: var(--success-dim); color: var(--success); }
      .conflict-header.theirs { background: var(--danger-dim); color: var(--danger); }
      .conflict-header.marker { background: var(--bg-tertiary); color: var(--text-muted); text-align: center; }
      .conflict-code { margin: 0; padding: 12px; font-size: 12px; line-height: 1.6; background: var(--bg-primary); }
      .conflict-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    </style>
  `;
}

function getMergeViewerModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">3-way マージビューア</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body merge-body">
      <div class="merge-panels">
        <div class="merge-panel">
          <div class="merge-panel-header ours">Ours (HEAD)</div>
          <pre class="merge-code">    Port: 8080,
    Host: "localhost",
    Debug: true,</pre>
        </div>
        <div class="merge-panel">
          <div class="merge-panel-header base">Base</div>
          <pre class="merge-code">    Port: 8080,
    Host: "localhost",</pre>
        </div>
        <div class="merge-panel">
          <div class="merge-panel-header theirs">Theirs (feature/config)</div>
          <pre class="merge-code">    Port: 3000,
    Host: "0.0.0.0",
    Timeout: 30,</pre>
        </div>
        <div class="merge-panel result">
          <div class="merge-panel-header result-header">Result</div>
          <textarea class="merge-result">    Port: 8080,
    Host: "localhost",
    Debug: true,
    Timeout: 30,</textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-success" onclick="saveMergeResult()">解決済みとしてマーク</button>
    </div>
    <style>
      .merge-body { padding: 0 !important; }
      .merge-panels { display: grid; grid-template-columns: repeat(4, 1fr); height: 400px; }
      .merge-panel { display: flex; flex-direction: column; border-right: 1px solid var(--border); }
      .merge-panel:last-child { border-right: none; }
      .merge-panel-header { padding: 10px 16px; font-size: 12px; font-weight: 600; border-bottom: 1px solid var(--border); }
      .merge-panel-header.ours { background: var(--success-dim); color: var(--success); }
      .merge-panel-header.base { background: var(--bg-tertiary); color: var(--text-muted); }
      .merge-panel-header.theirs { background: var(--danger-dim); color: var(--danger); }
      .merge-panel-header.result-header { background: var(--accent-dim); color: var(--accent); }
      .merge-code { flex: 1; margin: 0; padding: 16px; font-size: 12px; line-height: 1.6; overflow: auto; background: var(--bg-primary); }
      .merge-result { flex: 1; padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; background: var(--bg-primary); border: none; color: var(--text-primary); resize: none; }
      .merge-result:focus { outline: none; }
    </style>
  `;
}

// ===== View HTML Templates =====
function getHistoryViewHTML() {
  const commitList = sampleData.commits.map(c => `
    <div class="commit-row" onclick="selectCommit('${c.hash}')">
      <div class="commit-graph">
        <div class="graph-node"></div>
        <div class="graph-line"></div>
      </div>
      <div class="commit-info">
        <div class="commit-message">${c.message}</div>
        <div class="commit-meta">
          <span class="commit-hash">${c.hash}</span>
          <span class="commit-author">${c.author}</span>
          <span class="commit-date">${c.date}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="history-layout">
      <div class="history-panel">
        <div class="panel-header">
          <span class="panel-title">コミット履歴</span>
          <div class="panel-actions">
            <input type="text" class="search-input" placeholder="検索...">
          </div>
        </div>
        <div class="commit-list">${commitList}</div>
      </div>
      <div class="commit-detail-panel">
        <div class="panel-header">
          <span class="panel-title">コミット詳細</span>
        </div>
        <div class="commit-detail">
          <p class="empty-state">コミットを選択してください</p>
        </div>
      </div>
    </div>
    <style>
      .history-layout { display: grid; grid-template-columns: 1fr 350px; height: 100%; overflow: hidden; }
      .history-panel { display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border); }
      .search-input { padding: 6px 10px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 12px; width: 200px; }
      .commit-list { flex: 1; overflow-y: auto; }
      .commit-row { display: flex; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
      .commit-row:hover { background: var(--bg-tertiary); }
      .commit-graph { width: 30px; display: flex; flex-direction: column; align-items: center; }
      .graph-node { width: 10px; height: 10px; background: var(--accent); border-radius: 50%; }
      .graph-line { flex: 1; width: 2px; background: var(--border); margin-top: 4px; }
      .commit-info { flex: 1; }
      .commit-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
      .commit-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .commit-hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); }
      .commit-detail-panel { display: flex; flex-direction: column; overflow: hidden; }
      .commit-detail { flex: 1; padding: 16px; overflow-y: auto; }
      .empty-state { color: var(--text-muted); text-align: center; padding: 40px; }
    </style>
  `;
}

function getBranchesViewHTML() {
  const branchList = sampleData.branches.map(b => `
    <div class="branch-row ${b.current ? 'current' : ''}" onclick="switchBranch('${b.name}')">
      <div class="branch-icon">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
      </div>
      <div class="branch-details">
        <div class="branch-name">${b.name}</div>
        ${b.remote ? `<div class="branch-tracking">${b.remote}</div>` : ''}
      </div>
      <div class="branch-status">
        ${b.ahead > 0 ? `<span class="ahead">↑${b.ahead}</span>` : ''}
        ${b.behind > 0 ? `<span class="behind">↓${b.behind}</span>` : ''}
      </div>
      ${b.current ? '<span class="current-badge">HEAD</span>' : ''}
    </div>
  `).join('');

  return `
    <div class="branches-layout">
      <div class="panel-header">
        <span class="panel-title">ブランチ</span>
        <button class="btn btn-primary btn-sm" onclick="createBranch()">+ 新規ブランチ</button>
      </div>
      <div class="branch-list">${branchList}</div>
    </div>
    <style>
      .branches-layout { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
      .branch-list { flex: 1; overflow-y: auto; }
      .branch-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
      .branch-row:hover { background: var(--bg-tertiary); }
      .branch-row.current { background: var(--accent-dim); }
      .branch-icon { color: var(--accent); }
      .branch-icon svg { width: 16px; height: 16px; }
      .branch-details { flex: 1; }
      .branch-name { font-size: 13px; font-weight: 500; }
      .branch-tracking { font-size: 11px; color: var(--text-muted); }
      .branch-status { display: flex; gap: 8px; font-size: 11px; }
      .ahead { color: var(--success); }
      .behind { color: var(--warning); }
      .current-badge { padding: 3px 8px; background: var(--accent); color: #fff; border-radius: 4px; font-size: 10px; font-weight: 600; }
      .btn-sm { padding: 6px 12px; font-size: 12px; }
    </style>
  `;
}

function getRemotesViewHTML() {
  const remoteList = sampleData.remotes.map(r => `
    <div class="remote-item">
      <div class="remote-icon">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/></svg>
      </div>
      <div class="remote-info">
        <div class="remote-name">${r.name}</div>
        <div class="remote-url">${r.url}</div>
      </div>
      <div class="remote-actions">
        <button class="icon-btn" title="Fetch"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/></svg></button>
      </div>
    </div>
  `).join('');

  return `
    <div class="remotes-layout">
      <div class="panel-header">
        <span class="panel-title">リモート</span>
        <button class="btn btn-primary btn-sm" onclick="addRemote()">+ リモート追加</button>
      </div>
      <div class="remote-list">${remoteList}</div>
    </div>
    <style>
      .remotes-layout { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
      .remote-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
      .remote-item { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; }
      .remote-icon { color: var(--accent); }
      .remote-icon svg { width: 20px; height: 20px; }
      .remote-info { flex: 1; }
      .remote-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .remote-url { font-size: 12px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    </style>
  `;
}

function getAdvancedViewHTML() {
  return `
    <div class="advanced-layout">
      <div class="panel-header">
        <span class="panel-title">高度なGit操作</span>
      </div>
      <div class="advanced-content">
        <div class="advanced-grid">
          <div class="advanced-card" onclick="showToast('info', 'Cherry-pick画面を開きます')">
            <div class="advanced-icon" style="background: linear-gradient(135deg, #f472b6, #ec4899);">🍒</div>
            <div class="advanced-info">
              <div class="advanced-title">Cherry-pick</div>
              <div class="advanced-desc">特定のコミットを現在のブランチに適用</div>
            </div>
          </div>
          <div class="advanced-card" onclick="showToast('info', 'Revert画面を開きます')">
            <div class="advanced-icon" style="background: linear-gradient(135deg, #fbbf24, #f59e0b);">↩️</div>
            <div class="advanced-info">
              <div class="advanced-title">Revert</div>
              <div class="advanced-desc">コミットの変更を打ち消す</div>
            </div>
          </div>
          <div class="advanced-card" onclick="showToast('info', 'Reset画面を開きます')">
            <div class="advanced-icon" style="background: linear-gradient(135deg, #f87171, #ef4444);">🔄</div>
            <div class="advanced-info">
              <div class="advanced-title">Reset</div>
              <div class="advanced-desc">HEADを指定コミットに移動</div>
            </div>
          </div>
          <div class="advanced-card" onclick="showToast('info', 'Reflog画面を開きます')">
            <div class="advanced-icon" style="background: linear-gradient(135deg, #a78bfa, #8b5cf6);">📜</div>
            <div class="advanced-info">
              <div class="advanced-title">Reflog</div>
              <div class="advanced-desc">HEADの移動履歴を確認・復元</div>
            </div>
          </div>
        </div>
        <h3 class="section-title">モジュール管理</h3>
        <div class="advanced-grid">
          <div class="advanced-card" onclick="showToast('info', 'サブモジュール画面を開きます')">
            <div class="advanced-icon" style="background: var(--accent-dim);">📦</div>
            <div class="advanced-info">
              <div class="advanced-title">サブモジュール</div>
              <div class="advanced-desc">サブモジュールの追加・更新・削除</div>
            </div>
          </div>
          <div class="advanced-card" onclick="showToast('info', 'ワークツリー画面を開きます')">
            <div class="advanced-icon" style="background: var(--success-dim);">🌲</div>
            <div class="advanced-info">
              <div class="advanced-title">ワークツリー</div>
              <div class="advanced-desc">複数ワークツリーの管理</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>
      .advanced-layout { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
      .advanced-content { flex: 1; overflow-y: auto; padding: 24px; }
      .section-title { font-size: 14px; font-weight: 600; margin: 24px 0 16px; color: var(--text-secondary); }
      .advanced-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .advanced-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
      .advanced-card:hover { border-color: var(--accent); background: var(--accent-dim); }
      .advanced-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
      .advanced-info { flex: 1; }
      .advanced-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .advanced-desc { font-size: 12px; color: var(--text-muted); }
    </style>
  `;
}

// ===== Helper Functions =====
function switchBranch(branchName) {
  state.currentBranch = branchName;
  document.getElementById('current-branch').textContent = branchName;
  closeModal();
  showToast('success', `ブランチを ${branchName} に切り替えました`);
}

function createBranch() {
  const name = prompt('新しいブランチ名:');
  if (name) {
    showToast('success', `ブランチ "${name}" を作成しました`);
    closeModal();
  }
}

function applyStash(index) { showToast('success', `Stash @{${index}} を適用しました`); }
function popStash(index) { showToast('success', `Stash @{${index}} をポップしました`); closeModal(); }
function dropStash(index) { showToast('warning', `Stash @{${index}} を削除しました`); }
function createStash() {
  const msg = prompt('Stashメッセージ:');
  if (msg !== null) {
    showToast('success', 'Stashを作成しました');
    closeModal();
  }
}

function checkoutTag(name) { showToast('info', `タグ ${name} にチェックアウトします`); closeModal(); }
function deleteTag(name) { showToast('warning', `タグ ${name} を削除しました`); }
function createTag() {
  const name = prompt('タグ名:');
  if (name) {
    showToast('success', `タグ "${name}" を作成しました`);
    closeModal();
  }
}

function addRemote() {
  const name = prompt('リモート名:');
  if (name) {
    showToast('success', `リモート "${name}" を追加しました`);
  }
}

function selectCommit(hash) {
  showToast('info', `コミット ${hash} を選択`);
}

function switchSettingsTab(element, tab) {
  document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
  element.classList.add('active');
}

function useGeneratedMessage() {
  document.getElementById('commit-subject').value = 'feat(auth): ユーザー認証ハンドラーを追加';
  closeModal();
  showToast('success', 'コミットメッセージを設定しました');
}

function resolveConflict(type) {
  showToast('success', `${type}を採用してコンフリクトを解決しました`);
  closeModal();
}

function saveMergeResult() {
  showToast('success', 'マージ結果を保存しました');
  closeModal();
}

// ===== Toast System =====
function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Keyboard Shortcuts =====
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape to close modals and sidebar
    if (e.key === 'Escape') {
      closeModal();
      // Also close sidebar on mobile
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    }
    // Cmd/Ctrl + K for search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openModal('search');
    }
    // Cmd/Ctrl + Enter to commit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && state.currentView === 'changes') {
      e.preventDefault();
      performCommit();
    }
  });
}
