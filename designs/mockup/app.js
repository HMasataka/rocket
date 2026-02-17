// ===== State Management =====
const state = {
  currentView: 'changes',
  currentBranch: 'main',
  theme: 'dark',
  selectedFile: null,
  hunkMode: false,
  lineSelectMode: false,
  diffViewMode: 'inline'
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
    { hash: 'a1b2c3d', message: 'feat: Add user authentication', author: 'tanaka', date: '2 days ago', branch: 'main' },
    { hash: 'e4f5g6h', message: 'fix: Fix login bug', author: 'yamada', date: '3 days ago', branch: 'main' },
    { hash: 'i7j8k9l', message: 'docs: Update README', author: 'tanaka', date: '4 days ago', branch: 'main' },
    { hash: 'm0n1o2p', message: 'refactor: Code cleanup', author: 'suzuki', date: '5 days ago', branch: 'main' },
    { hash: 'q3r4s5t', message: 'feat: Add settings screen', author: 'tanaka', date: '1 week ago', branch: 'main' }
  ],
  stashes: [
    { index: 0, message: 'WIP: Auth feature in progress', branch: 'feature/auth', date: '1 hour ago' },
    { index: 1, message: 'WIP: UI adjustments', branch: 'main', date: 'yesterday' }
  ],
  tags: [
    { name: 'v1.0.0', commit: 'a1b2c3d', message: 'Initial release', date: '1 week ago' },
    { name: 'v0.9.0', commit: 'q3r4s5t', message: 'Beta release', date: '2 weeks ago' }
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
    case 'cherry-pick':
      view.innerHTML = getCherryPickViewHTML();
      break;
    case 'revert':
      view.innerHTML = getRevertViewHTML();
      break;
    case 'reset':
      view.innerHTML = getResetViewHTML();
      break;
    case 'reflog':
      view.innerHTML = getReflogViewHTML();
      break;
    case 'submodules':
      view.innerHTML = getSubmodulesViewHTML();
      break;
    case 'worktrees':
      view.innerHTML = getWorktreesViewHTML();
      break;
  }
  view.dataset.loaded = 'true';
}

// ===== Diff View =====
function initDiffView() {
  renderInlineDiff();
  renderSplitDiff();
  initSplitScrollSync();
}

function renderInlineDiff() {
  const diffInline = document.getElementById('diff-inline');
  diffInline.innerHTML = getInlineDiffHTML();
}

function renderSplitDiff() {
  const leftCode = document.getElementById('split-left-code');
  const rightCode = document.getElementById('split-right-code');

  leftCode.innerHTML = getSplitLeftHTML();
  rightCode.innerHTML = getSplitRightHTML();
}

function getInlineDiffHTML() {
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

function getSplitLeftHTML() {
  // Original file (shows deletions)
  return `
    <div class="split-hunk-header">@@ -1,10 +1,15 @@ package auth</div>
    <div class="split-line unchanged"><span class="line-num">1</span><span class="line-content">package auth</span></div>
    <div class="split-line unchanged"><span class="line-num">2</span><span class="line-content"></span></div>
    <div class="split-line unchanged"><span class="line-num">3</span><span class="line-content">import (</span></div>
    <div class="split-line empty"><span class="line-num"></span><span class="line-content"></span></div>
    <div class="split-line empty"><span class="line-num"></span><span class="line-content"></span></div>
    <div class="split-line unchanged"><span class="line-num">4</span><span class="line-content">    "fmt"</span></div>
    <div class="split-line del"><span class="line-num">5</span><span class="line-content">    "<span class="word-del">log</span>"</span></div>
    <div class="split-line unchanged"><span class="line-num">6</span><span class="line-content">)</span></div>
    <div class="split-line unchanged"><span class="line-num">7</span><span class="line-content"></span></div>
    <div class="split-hunk-header">@@ -25,6 +30,20 @@ func NewHandler() *Handler {</div>
    <div class="split-line unchanged"><span class="line-num">25</span><span class="line-content">func NewHandler() *Handler {</span></div>
    <div class="split-line del"><span class="line-num">26</span><span class="line-content">    return &Handler<span class="word-del">{}</span></span></div>
    <div class="split-line empty"><span class="line-num"></span><span class="line-content"></span></div>
    <div class="split-line empty"><span class="line-num"></span><span class="line-content"></span></div>
    <div class="split-line unchanged"><span class="line-num">27</span><span class="line-content">}</span></div>
    <div class="split-line unchanged"><span class="line-num">28</span><span class="line-content"></span></div>
    <div class="split-line unchanged"><span class="line-num">29</span><span class="line-content">func (h *Handler) Authenticate(ctx context.Context) error {</span></div>
    <div class="split-line unchanged"><span class="line-num">30</span><span class="line-content">    // TODO: implement</span></div>
    <div class="split-line unchanged"><span class="line-num">31</span><span class="line-content">    return nil</span></div>
    <div class="split-line unchanged"><span class="line-num">32</span><span class="line-content">}</span></div>
  `;
}

function getSplitRightHTML() {
  // Modified file (shows additions)
  return `
    <div class="split-hunk-header">@@ -1,10 +1,15 @@ package auth</div>
    <div class="split-line unchanged"><span class="line-num">1</span><span class="line-content">package auth</span></div>
    <div class="split-line unchanged"><span class="line-num">2</span><span class="line-content"></span></div>
    <div class="split-line unchanged"><span class="line-num">3</span><span class="line-content">import (</span></div>
    <div class="split-line add"><span class="line-num">4</span><span class="line-content">    "<span class="word-add">context</span>"</span></div>
    <div class="split-line add"><span class="line-num">5</span><span class="line-content">    "<span class="word-add">errors</span>"</span></div>
    <div class="split-line unchanged"><span class="line-num">6</span><span class="line-content">    "fmt"</span></div>
    <div class="split-line add"><span class="line-num">7</span><span class="line-content">    "<span class="word-add">log/slog</span>"</span></div>
    <div class="split-line unchanged"><span class="line-num">8</span><span class="line-content">)</span></div>
    <div class="split-line unchanged"><span class="line-num">9</span><span class="line-content"></span></div>
    <div class="split-hunk-header">@@ -25,6 +30,20 @@ func NewHandler() *Handler {</div>
    <div class="split-line unchanged"><span class="line-num">30</span><span class="line-content">func NewHandler() *Handler {</span></div>
    <div class="split-line add"><span class="line-num">31</span><span class="line-content">    return &Handler<span class="word-add">{</span></span></div>
    <div class="split-line add"><span class="line-num">32</span><span class="line-content"><span class="word-add">        logger: slog.Default(),</span></span></div>
    <div class="split-line add"><span class="line-num">33</span><span class="line-content"><span class="word-add">    }</span></span></div>
    <div class="split-line unchanged"><span class="line-num">34</span><span class="line-content">}</span></div>
    <div class="split-line unchanged"><span class="line-num">35</span><span class="line-content"></span></div>
    <div class="split-line unchanged"><span class="line-num">36</span><span class="line-content">func (h *Handler) Authenticate(ctx context.Context) error {</span></div>
    <div class="split-line unchanged"><span class="line-num">37</span><span class="line-content">    // TODO: implement</span></div>
    <div class="split-line unchanged"><span class="line-num">38</span><span class="line-content">    return nil</span></div>
    <div class="split-line unchanged"><span class="line-num">39</span><span class="line-content">}</span></div>
  `;
}

function initSplitScrollSync() {
  const leftCode = document.getElementById('split-left-code');
  const rightCode = document.getElementById('split-right-code');

  let isSyncing = false;

  leftCode.addEventListener('scroll', () => {
    if (isSyncing) return;
    isSyncing = true;
    rightCode.scrollTop = leftCode.scrollTop;
    rightCode.scrollLeft = leftCode.scrollLeft;
    requestAnimationFrame(() => isSyncing = false);
  });

  rightCode.addEventListener('scroll', () => {
    if (isSyncing) return;
    isSyncing = true;
    leftCode.scrollTop = rightCode.scrollTop;
    leftCode.scrollLeft = rightCode.scrollLeft;
    requestAnimationFrame(() => isSyncing = false);
  });
}

function setDiffView(mode) {
  const toggle = document.getElementById('diff-view-toggle');
  const inlineView = document.getElementById('diff-inline');
  const splitView = document.getElementById('diff-split');

  // Update toggle buttons
  toggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === mode);
  });

  // Switch views
  if (mode === 'split') {
    inlineView.classList.remove('active');
    splitView.classList.add('active');
  } else {
    splitView.classList.remove('active');
    inlineView.classList.add('active');
  }

  state.diffViewMode = mode;
}

function toggleHunkMode() {
  state.hunkMode = !state.hunkMode;
  showToast('info', state.hunkMode ? 'Hunk mode enabled' : 'Hunk mode disabled');
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
  showToast('success', 'File staged');
}

function unstageFile(event) {
  event.stopPropagation();
  showToast('success', 'File unstaged');
}

function stageAll() {
  showToast('success', 'All files staged');
}

function stageHunk(index) {
  showToast('success', `Hunk ${index + 1} staged`);
}

function discardHunk(index) {
  showToast('warning', `Hunk ${index + 1} discarded`);
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
    showToast('error', 'Please enter a commit message');
    return;
  }
  showToast('success', 'Commit created');
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
      setTimeout(() => showToast('success', 'Fetch complete'), 1000);
      break;
    case 'pull':
      showToast('info', 'Pulling from origin/main...');
      setTimeout(() => showToast('success', 'Pull complete - Already up to date'), 1000);
      break;
    case 'push':
      showToast('info', 'Pushing to origin/main...');
      setTimeout(() => showToast('success', 'Push complete'), 1000);
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
        ${b.current ? '<span class="current-badge">Current</span>' : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <span class="modal-title">Branches</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-search">
        <input type="text" placeholder="Search branches..." class="modal-input">
      </div>
      <div class="branch-list">${branchList}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createBranch()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        New Branch
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
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="createStash()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        Create Stash
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
      <span class="modal-title">Tags</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="tag-list">${tagList}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="createTag()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
        New Tag
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
      <span class="modal-title">Settings</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="settings-layout">
        <nav class="settings-nav">
          <div class="settings-nav-item active" onclick="switchSettingsTab(this, 'appearance')">Appearance</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'editor')">Editor</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'ai')">AI Settings</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'keybindings')">Keybindings</div>
          <div class="settings-nav-item" onclick="switchSettingsTab(this, 'tools')">External Tools</div>
        </nav>
        <div class="settings-content">
          <div class="settings-section">
            <h3>Theme</h3>
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
            <h3>Color Theme</h3>
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
            <h3>Font Size</h3>
            <div class="setting-row">
              <label>Editor</label>
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
      <span class="modal-title">AI Assist</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="ai-options">
        <div class="ai-option" onclick="openModal('ai-commit')">
          <div class="ai-option-icon">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
          </div>
          <div class="ai-option-info">
            <div class="ai-option-title">Generate Commit Message</div>
            <div class="ai-option-desc">Auto-generate from staged changes</div>
          </div>
        </div>
        <div class="ai-option" onclick="openModal('ai-review')">
          <div class="ai-option-icon">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
          </div>
          <div class="ai-option-info">
            <div class="ai-option-title">Code Review</div>
            <div class="ai-option-desc">Analyze diff and suggest review comments</div>
          </div>
        </div>
        <div class="ai-option" onclick="showToast('info', 'Starting patch generation')">
          <div class="ai-option-icon">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 0L0 1l2.2 2.2a5.5 5.5 0 0 0 7.794 7.794L12.2 13.2l1-1-2.206-2.206A5.5 5.5 0 0 0 3.206 2.206L1 0zm10.5 5.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z"/><path d="M8.5 2.5a.5.5 0 0 0-1 0V5H5a.5.5 0 0 0 0 1h2.5v2.5a.5.5 0 0 0 1 0V6H11a.5.5 0 0 0 0-1H8.5V2.5z"/></svg>
          </div>
          <div class="ai-option-info">
            <div class="ai-option-title">Generate Patch</div>
            <div class="ai-option-desc">Generate fix patches from review comments</div>
          </div>
        </div>
        <div class="ai-option" onclick="showToast('info', 'Generating PR description')">
          <div class="ai-option-icon">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/><path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/></svg>
          </div>
          <div class="ai-option-info">
            <div class="ai-option-title">Generate PR Description</div>
            <div class="ai-option-desc">Generate PR description from branch changes</div>
          </div>
        </div>
      </div>
      <div class="ai-cli-selector">
        <label>AI CLI to use:</label>
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
      .ai-option-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--accent-dim); border-radius: 10px; color: var(--accent); }
      .ai-option-icon svg { width: 20px; height: 20px; }
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
      <span class="modal-title">AI Commit Message Generator</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="ai-settings-row">
        <label>Format:</label>
        <select class="modal-select">
          <option value="conventional">Conventional Commits</option>
          <option value="simple">Simple</option>
          <option value="detailed">Detailed</option>
        </select>
        <label>Language:</label>
        <select class="modal-select">
          <option value="en">English</option>
          <option value="ja">Japanese</option>
        </select>
      </div>
      <div class="ai-generating">
        <div class="ai-spinner"></div>
        <span>Generating...</span>
      </div>
      <div class="ai-result" style="display: none;">
        <div class="ai-suggestion">
          <div class="suggestion-subject">feat(auth): Add user authentication handler</div>
          <div class="suggestion-body">- Implement new AuthHandler
- Switch to slog for logging
- Add error handling</div>
        </div>
        <div class="ai-alternatives">
          <span class="alternatives-label">Alternatives:</span>
          <button class="alt-btn">feat: Add authentication</button>
          <button class="alt-btn">add: auth handler with logging</button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="useGeneratedMessage()">Use</button>
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
      <span class="modal-title">AI Code Review</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="review-summary">
        <div class="review-stat">
          <span class="stat-value">3</span>
          <span class="stat-label">Files Analyzed</span>
        </div>
        <div class="review-stat warning">
          <span class="stat-value">2</span>
          <span class="stat-label">Warnings</span>
        </div>
        <div class="review-stat danger">
          <span class="stat-value">1</span>
          <span class="stat-label">Security</span>
        </div>
      </div>
      <div class="review-items">
        <div class="review-item warning">
          <div class="review-header">
            <span class="review-file">src/auth/handler.go:15</span>
            <span class="review-type">⚠️ Warning</span>
          </div>
          <div class="review-message">Missing error handling. Please add handling for when context is nil.</div>
          <div class="review-actions">
            <button class="btn btn-secondary btn-sm">Ignore</button>
            <button class="btn btn-primary btn-sm">Generate Patch</button>
          </div>
        </div>
        <div class="review-item danger">
          <div class="review-header">
            <span class="review-file">src/auth/token.go:42</span>
            <span class="review-type">🔴 Security</span>
          </div>
          <div class="review-message">Hardcoded secret key detected. Please load from environment variables.</div>
          <div class="review-actions">
            <button class="btn btn-secondary btn-sm">Ignore</button>
            <button class="btn btn-primary btn-sm">Generate Patch</button>
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
    </style>
  `;
}

function getSearchModalHTML() {
  return `
    <div class="modal-header">
      <span class="modal-title">Repository Search</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="search-input-group">
        <input type="text" class="modal-input search-main" placeholder="Enter search keyword..." autofocus>
      </div>
      <div class="search-filters">
        <button class="filter-btn active">Code</button>
        <button class="filter-btn">Commits</button>
        <button class="filter-btn">Filenames</button>
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
      <span class="modal-title">Resolve Conflict</span>
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
          <button class="btn btn-secondary" onclick="resolveConflict('ours')">Accept Ours</button>
          <button class="btn btn-secondary" onclick="resolveConflict('theirs')">Accept Theirs</button>
          <button class="btn btn-secondary" onclick="resolveConflict('both')">Accept Both</button>
          <button class="btn btn-primary" onclick="openModal('merge')">3-way Merge Viewer</button>
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
      <span class="modal-title">3-way Merge Viewer</span>
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
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="saveMergeResult()">Mark as Resolved</button>
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
    <div class="page-layout">
      <div class="page-header">
        <div class="page-info">
          <h2 class="page-title">History</h2>
          <span class="page-desc">Browse commit history and view changes</span>
        </div>
      </div>
      <div class="history-content">
        <div class="history-panel">
          <div class="panel-header">
            <span class="panel-title">Commit History</span>
          <div class="panel-actions">
            <input type="text" class="search-input" placeholder="Search...">
          </div>
        </div>
        <div class="commit-list">${commitList}</div>
      </div>
      <div class="commit-detail-panel">
        <div class="panel-header">
          <span class="panel-title">Commit Details</span>
          <div class="panel-actions">
            <button class="icon-btn" title="Copy SHA">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
            </button>
            <button class="icon-btn" title="Browse files">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10Z"/></svg>
            </button>
          </div>
        </div>
        <div class="commit-detail" id="commit-detail-content">
          <div class="detail-header">
            <div class="detail-avatar">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/></svg>
            </div>
            <div class="detail-author-info">
              <div class="detail-author">John Developer</div>
              <div class="detail-author-email">john@example.com</div>
            </div>
            <div class="detail-date">
              <div class="detail-date-relative">2 hours ago</div>
              <div class="detail-date-absolute">Feb 17, 2026 14:32</div>
            </div>
          </div>

          <div class="detail-commit-info">
            <div class="detail-hash-row">
              <span class="detail-label">Commit</span>
              <span class="detail-hash">a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6</span>
            </div>
            <div class="detail-parent-row">
              <span class="detail-label">Parent</span>
              <a href="#" class="detail-parent-hash">b2c3d4e5</a>
            </div>
          </div>

          <div class="detail-message-section">
            <div class="detail-message-title">feat: Add user authentication</div>
            <div class="detail-message-body">
              Implemented JWT-based authentication system with refresh tokens.

              - Added login/logout endpoints
              - Implemented token refresh mechanism
              - Added middleware for protected routes
              - Updated user model with password hashing
            </div>
          </div>

          <div class="detail-stats">
            <div class="stat-item additions">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
              <span>127 additions</span>
            </div>
            <div class="stat-item deletions">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/></svg>
              <span>23 deletions</span>
            </div>
            <div class="stat-item files">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.414A2 2 0 0 0 13.414 3L11 .586A2 2 0 0 0 9.586 0H4zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3z"/></svg>
              <span>5 files changed</span>
            </div>
          </div>

          <div class="detail-files">
            <div class="detail-section-title">Changed Files</div>
            <div class="changed-file added">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
              <span class="file-path">internal/auth/handler.go</span>
              <span class="file-stats">+89 -0</span>
            </div>
            <div class="changed-file modified">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
              <span class="file-path">internal/auth/middleware.go</span>
              <span class="file-stats">+24 -8</span>
            </div>
            <div class="changed-file modified">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
              <span class="file-path">internal/models/user.go</span>
              <span class="file-stats">+12 -15</span>
            </div>
            <div class="changed-file added">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
              <span class="file-path">internal/auth/token.go</span>
              <span class="file-stats">+45 -0</span>
            </div>
            <div class="changed-file deleted">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/></svg>
              <span class="file-path">internal/auth/legacy.go</span>
              <span class="file-stats">+0 -23</span>
            </div>
          </div>

          <div class="detail-actions">
            <button class="btn btn-secondary">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>
              Revert
            </button>
            <button class="btn btn-secondary">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zM6.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
              Cherry-pick
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
    <style>
      .history-content { display: grid; grid-template-columns: 1fr 400px; flex: 1; overflow: hidden; }
      .history-panel { display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border); }
      .commit-list { flex: 1; overflow-y: auto; }
      .commit-row { display: flex; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .commit-row:hover { background: var(--bg-tertiary); }
      .commit-row.selected { background: var(--accent-dim); border-left: 3px solid var(--accent); }
      .commit-graph { width: 30px; display: flex; flex-direction: column; align-items: center; }
      .graph-node { width: 10px; height: 10px; background: var(--accent); border-radius: 50%; }
      .graph-line { flex: 1; width: 2px; background: var(--border); margin-top: 4px; }
      .commit-info { flex: 1; }
      .commit-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
      .commit-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .commit-hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); }

      .commit-detail-panel { display: flex; flex-direction: column; overflow: hidden; }
      .commit-detail { flex: 1; padding: 20px; overflow-y: auto; }

      .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
      .detail-avatar { width: 40px; height: 40px; background: var(--bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      .detail-avatar svg { width: 20px; height: 20px; color: var(--text-muted); }
      .detail-author-info { flex: 1; }
      .detail-author { font-size: 14px; font-weight: 600; }
      .detail-author-email { font-size: 12px; color: var(--text-muted); }
      .detail-date { text-align: right; }
      .detail-date-relative { font-size: 13px; color: var(--text-secondary); }
      .detail-date-absolute { font-size: 11px; color: var(--text-muted); }

      .detail-commit-info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; }
      .detail-hash-row, .detail-parent-row { display: flex; align-items: center; gap: 12px; font-size: 12px; }
      .detail-label { color: var(--text-muted); min-width: 50px; }
      .detail-hash { font-family: 'JetBrains Mono', monospace; color: var(--text-secondary); font-size: 11px; }
      .detail-parent-hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); font-size: 12px; text-decoration: none; }
      .detail-parent-hash:hover { text-decoration: underline; }

      .detail-message-section { margin-bottom: 20px; }
      .detail-message-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; line-height: 1.4; }
      .detail-message-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; padding: 12px; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--accent); }

      .detail-stats { display: flex; gap: 16px; margin-bottom: 20px; padding: 12px 0; border-bottom: 1px solid var(--border); }
      .stat-item { display: flex; align-items: center; gap: 6px; font-size: 12px; }
      .stat-item svg { width: 14px; height: 14px; }
      .stat-item.additions { color: var(--success); }
      .stat-item.deletions { color: var(--danger); }
      .stat-item.files { color: var(--text-muted); }

      .detail-files { margin-bottom: 20px; }
      .detail-section-title { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
      .changed-file { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; font-size: 12px; transition: background 0.15s; cursor: pointer; }
      .changed-file:hover { background: var(--bg-tertiary); }
      .changed-file svg { width: 14px; height: 14px; flex-shrink: 0; }
      .changed-file.added svg { color: var(--success); }
      .changed-file.modified svg { color: var(--warning); }
      .changed-file.deleted svg { color: var(--danger); }
      .file-path { flex: 1; font-family: 'JetBrains Mono', monospace; color: var(--text-secondary); }
      .file-stats { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); }

      .detail-actions { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border); }
      .detail-actions .btn { flex: 1; }
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
    <div class="page-layout">
      <div class="page-header">
        <div class="page-info">
          <h2 class="page-title">Branches</h2>
          <span class="page-desc">Manage local and remote branches</span>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="createBranch()">+ New Branch</button>
        </div>
      </div>
      <div class="branch-list">${branchList}</div>
    </div>
    <style>
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
    <div class="page-layout">
      <div class="page-header">
        <div class="page-info">
          <h2 class="page-title">Remotes</h2>
          <span class="page-desc">Configure remote repositories</span>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="addRemote()">+ Add Remote</button>
        </div>
      </div>
      <div class="remote-list">${remoteList}</div>
    </div>
    <style>
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

// ===== Helper Functions =====
function switchBranch(branchName) {
  state.currentBranch = branchName;
  document.getElementById('current-branch').textContent = branchName;
  closeModal();
  showToast('success', `Switched to branch ${branchName}`);
}

function createBranch() {
  const name = prompt('New branch name:');
  if (name) {
    showToast('success', `Branch "${name}" created`);
    closeModal();
  }
}

function applyStash(index) { showToast('success', `Stash @{${index}} applied`); }
function popStash(index) { showToast('success', `Stash @{${index}} popped`); closeModal(); }
function dropStash(index) { showToast('warning', `Stash @{${index}} dropped`); }
function createStash() {
  const msg = prompt('Stash message:');
  if (msg !== null) {
    showToast('success', 'Stash created');
    closeModal();
  }
}

function checkoutTag(name) { showToast('info', `Checking out tag ${name}`); closeModal(); }
function deleteTag(name) { showToast('warning', `Tag ${name} deleted`); }
function createTag() {
  const name = prompt('Tag name:');
  if (name) {
    showToast('success', `Tag "${name}" created`);
    closeModal();
  }
}

function addRemote() {
  const name = prompt('Remote name:');
  if (name) {
    showToast('success', `Remote "${name}" added`);
  }
}

function selectCommit(hash) {
  showToast('info', `Selected commit ${hash}`);
}

function switchSettingsTab(element, tab) {
  document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
  element.classList.add('active');
}

function useGeneratedMessage() {
  document.getElementById('commit-subject').value = 'feat(auth): Add user authentication handler';
  closeModal();
  showToast('success', 'Commit message set');
}

function resolveConflict(type) {
  showToast('success', `Conflict resolved by accepting ${type}`);
  closeModal();
}

function saveMergeResult() {
  showToast('success', 'Merge result saved');
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
    // D key to toggle diff view (when not in input)
    if (e.key === 'd' && !e.metaKey && !e.ctrlKey && state.currentView === 'changes') {
      const activeElement = document.activeElement;
      const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
      if (!isInput) {
        e.preventDefault();
        const newMode = state.diffViewMode === 'inline' ? 'split' : 'inline';
        setDiffView(newMode);
      }
    }
  });
}

// ===== Advanced Git Operations Views =====

function getCherryPickViewHTML() {
  const commits = sampleData.commits;
  const commitRows = commits.map(c => `
    <div class="cherry-commit-row" onclick="toggleCherryPick(this, '${c.hash}')">
      <div class="cherry-checkbox">
        <input type="checkbox" data-hash="${c.hash}">
      </div>
      <div class="cherry-graph">
        <div class="graph-node cherry"></div>
        <div class="graph-line"></div>
      </div>
      <div class="cherry-info">
        <div class="cherry-message">${c.message}</div>
        <div class="cherry-meta">
          <span class="cherry-hash">${c.hash}</span>
          <span class="cherry-author">${c.author}</span>
          <span class="cherry-date">${c.date}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Cherry-pick</h2>
          <span class="operation-desc">Apply specific commits to the current branch</span>
        </div>
      </div>
      <div class="operation-content">
        <div class="operation-main">
          <div class="operation-panel">
            <div class="panel-header">
              <span class="panel-title">Select commits to apply</span>
              <div class="panel-actions">
                <input type="text" class="search-input" placeholder="Search commits...">
              </div>
            </div>
            <div class="cherry-commit-list">${commitRows}</div>
          </div>
        </div>
        <div class="operation-sidebar">
          <div class="operation-options">
            <h3>Options</h3>
            <div class="option-selector">
              <label class="option-card selected">
                <input type="checkbox" checked>
                <div class="option-content">
                  <div class="option-title">Create commit (-x)</div>
                  <div class="option-desc">Record original commit info in the message</div>
                </div>
              </label>
              <label class="option-card">
                <input type="checkbox">
                <div class="option-content">
                  <div class="option-title">Apply changes only (--no-commit)</div>
                  <div class="option-desc">Apply changes without creating a commit</div>
                </div>
              </label>
              <label class="option-card">
                <input type="checkbox">
                <div class="option-content">
                  <div class="option-title">Allow merge commits (-m)</div>
                  <div class="option-desc">Allow cherry-picking merge commits</div>
                </div>
              </label>
            </div>
          </div>
          <div class="operation-preview">
            <h3>Selected</h3>
            <div class="selected-commits" id="cherry-selected">
              <p class="empty-hint">Select commits</p>
            </div>
          </div>
          <div class="operation-actions">
            <button class="btn btn-primary" onclick="executeCherryPick()">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
              Execute Cherry-pick
            </button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .operation-content { display: flex; flex: 1; overflow: hidden; }
      .operation-main { flex: 1; overflow-y: auto; padding: 20px; }
      .operation-panel { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
      .cherry-commit-list { max-height: 500px; overflow-y: auto; }
      .cherry-commit-row { display: flex; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .cherry-commit-row:hover { background: var(--bg-tertiary); }
      .cherry-commit-row.selected { background: var(--accent-dim); }
      .cherry-checkbox { margin-right: 12px; padding-top: 2px; }
      .cherry-checkbox input { width: 1.15em; height: 1.15em; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .cherry-checkbox input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--accent); }
      .cherry-checkbox input:checked { border-color: var(--accent); }
      .cherry-checkbox input:checked::before { transform: scale(1); }
      .cherry-graph { width: 24px; display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
      .graph-node.cherry { width: 12px; height: 12px; background: linear-gradient(135deg, #f472b6, #ec4899); border-radius: 50%; }
      .cherry-info { flex: 1; }
      .cherry-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
      .cherry-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .cherry-hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); }
      .operation-sidebar { width: 320px; border-left: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px; gap: 20px; overflow-y: auto; }
      .operation-options h3, .operation-preview h3 { font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--text-secondary); }
      .option-selector { display: flex; flex-direction: column; gap: 8px; }
      .option-card { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg-tertiary); border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
      .option-card:hover { background: var(--bg-secondary); }
      .option-card.selected { border-color: var(--accent); }
      .option-card input { width: 1.15em; height: 1.15em; margin-top: 2px; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .option-card input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--accent); }
      .option-card input:checked { border-color: var(--accent); }
      .option-card input:checked::before { transform: scale(1); }
      .option-content { flex: 1; }
      .option-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
      .option-desc { font-size: 11px; color: var(--text-muted); }
      .selected-commits { padding: 12px; background: var(--bg-tertiary); border-radius: 8px; min-height: 60px; }
      .empty-hint { color: var(--text-muted); font-size: 12px; text-align: center; margin: 0; }
      .selected-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
      .selected-item .hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); }
      .operation-actions { margin-top: auto; display: flex; gap: 8px; padding-top: 20px; border-top: 1px solid var(--border); }
      .operation-actions .btn { flex: 1; }
    </style>
  `;
}

function getRevertViewHTML() {
  const commits = sampleData.commits;
  const commitRows = commits.map((c, i) => `
    <div class="revert-commit-row ${i === 0 ? 'selected' : ''}" onclick="selectRevertCommit(this, '${c.hash}')">
      <div class="revert-radio">
        <input type="radio" name="revert-commit" value="${c.hash}" ${i === 0 ? 'checked' : ''}>
      </div>
      <div class="revert-graph">
        <div class="graph-node revert"></div>
        <div class="graph-line"></div>
      </div>
      <div class="revert-info">
        <div class="revert-message">${c.message}</div>
        <div class="revert-meta">
          <span class="revert-hash">${c.hash}</span>
          <span class="revert-author">${c.author}</span>
          <span class="revert-date">${c.date}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Revert</h2>
          <span class="operation-desc">Create a new commit that undoes changes</span>
        </div>
      </div>
      <div class="operation-content">
        <div class="operation-main">
          <div class="operation-panel">
            <div class="panel-header">
              <span class="panel-title">Select commit to revert</span>
              <div class="panel-actions">
                <input type="text" class="search-input" placeholder="Search commits...">
              </div>
            </div>
            <div class="revert-commit-list">${commitRows}</div>
          </div>
        </div>
        <div class="operation-sidebar">
          <div class="operation-options">
            <h3>Options</h3>
            <div class="option-selector">
              <label class="option-card selected">
                <input type="checkbox" checked>
                <div class="option-content">
                  <div class="option-title">Create revert commit</div>
                  <div class="option-desc">Automatically create a revert commit</div>
                </div>
              </label>
              <label class="option-card">
                <input type="checkbox">
                <div class="option-content">
                  <div class="option-title">Apply changes only (--no-commit)</div>
                  <div class="option-desc">Apply changes without creating a commit</div>
                </div>
              </label>
              <label class="option-card">
                <input type="checkbox">
                <div class="option-content">
                  <div class="option-title">Open editor (--edit)</div>
                  <div class="option-desc">Edit the commit message before committing</div>
                </div>
              </label>
            </div>
          </div>
          <div class="operation-preview">
            <h3>Revert commit message</h3>
            <textarea class="revert-message-input" placeholder="Revert &quot;feat: Add user authentication&quot;&#10;&#10;This reverts commit a1b2c3d."></textarea>
          </div>
          <div class="operation-actions">
            <button class="btn btn-warning" onclick="executeRevert()">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/></svg>
              Execute Revert
            </button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .revert-commit-list { max-height: 500px; overflow-y: auto; }
      .revert-commit-row { display: flex; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .revert-commit-row:hover { background: var(--bg-tertiary); }
      .revert-commit-row.selected { background: var(--warning-dim); border-left: 3px solid var(--warning); }
      .revert-radio { margin-right: 12px; padding-top: 2px; }
      .revert-radio input { width: 1.15em; height: 1.15em; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .revert-radio input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--warning); }
      .revert-radio input:checked { border-color: var(--warning); }
      .revert-radio input:checked::before { transform: scale(1); }
      .revert-graph { width: 24px; display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
      .graph-node.revert { width: 12px; height: 12px; background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 50%; }
      .revert-info { flex: 1; }
      .revert-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
      .revert-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .revert-hash { font-family: 'JetBrains Mono', monospace; color: var(--warning); }
      .revert-message-input { width: 100%; height: 120px; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 12px; resize: none; }
      .revert-message-input:focus { outline: none; border-color: var(--warning); }
      .option-selector { display: flex; flex-direction: column; gap: 8px; }
      .option-card { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg-tertiary); border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
      .option-card:hover { background: var(--bg-secondary); }
      .option-card.selected { border-color: var(--warning); }
      .option-card input { width: 1.15em; height: 1.15em; margin-top: 2px; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .option-card input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--warning); }
      .option-card input:checked { border-color: var(--warning); }
      .option-card input:checked::before { transform: scale(1); }
      .option-content { flex: 1; }
      .option-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
      .option-desc { font-size: 11px; color: var(--text-muted); }
      .btn-warning { background: var(--warning); color: #000; }
      .btn-warning:hover { background: #d97706; }
    </style>
  `;
}

function getResetViewHTML() {
  const commits = sampleData.commits;
  const commitRows = commits.map((c, i) => `
    <div class="reset-commit-row ${i === 0 ? 'selected' : ''}" onclick="selectResetCommit(this, '${c.hash}')">
      <div class="reset-radio">
        <input type="radio" name="reset-commit" value="${c.hash}" ${i === 0 ? 'checked' : ''}>
      </div>
      <div class="reset-graph">
        <div class="graph-node reset"></div>
        <div class="graph-line"></div>
      </div>
      <div class="reset-info">
        <div class="reset-message">${c.message}</div>
        <div class="reset-meta">
          <span class="reset-hash">${c.hash}</span>
          <span class="reset-author">${c.author}</span>
          <span class="reset-date">${c.date}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Reset</h2>
          <span class="operation-desc">Move HEAD to specified commit</span>
        </div>
      </div>
      <div class="operation-content">
        <div class="operation-main">
          <div class="operation-panel">
            <div class="panel-header">
              <span class="panel-title">Select target commit for reset</span>
              <div class="panel-actions">
                <input type="text" class="search-input" placeholder="Search commits...">
              </div>
            </div>
            <div class="reset-commit-list">${commitRows}</div>
          </div>
        </div>
        <div class="operation-sidebar">
          <div class="operation-options">
            <h3>Reset Mode</h3>
            <div class="reset-mode-selector">
              <label class="reset-mode soft">
                <input type="radio" name="reset-mode" value="soft">
                <div class="mode-content">
                  <div class="mode-title">--soft</div>
                  <div class="mode-desc">Only move HEAD. Changes remain staged</div>
                </div>
              </label>
              <label class="reset-mode mixed selected">
                <input type="radio" name="reset-mode" value="mixed" checked>
                <div class="mode-content">
                  <div class="mode-title">--mixed (default)</div>
                  <div class="mode-desc">Reset HEAD and index. Changes remain in working tree</div>
                </div>
              </label>
              <label class="reset-mode hard">
                <input type="radio" name="reset-mode" value="hard">
                <div class="mode-content">
                  <div class="mode-title">--hard</div>
                  <div class="mode-desc danger">Reset everything. Changes will be lost</div>
                </div>
              </label>
            </div>
          </div>
          <div class="reset-warning">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
            <span>This operation cannot be undone. Proceed with caution.</span>
          </div>
          <div class="operation-actions">
            <button class="btn btn-danger" onclick="executeReset()">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>
              Execute Reset
            </button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .reset-commit-list { max-height: 500px; overflow-y: auto; }
      .reset-commit-row { display: flex; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .reset-commit-row:hover { background: var(--bg-tertiary); }
      .reset-commit-row.selected { background: var(--danger-dim); border-left: 3px solid var(--danger); }
      .reset-radio { margin-right: 12px; padding-top: 2px; }
      .reset-radio input { width: 1.15em; height: 1.15em; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .reset-radio input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--danger); }
      .reset-radio input:checked { border-color: var(--danger); }
      .reset-radio input:checked::before { transform: scale(1); }
      .reset-graph { width: 24px; display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
      .graph-node.reset { width: 12px; height: 12px; background: linear-gradient(135deg, #f87171, #ef4444); border-radius: 50%; }
      .reset-info { flex: 1; }
      .reset-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
      .reset-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .reset-hash { font-family: 'JetBrains Mono', monospace; color: var(--danger); }
      .reset-mode-selector { display: flex; flex-direction: column; gap: 8px; }
      .reset-mode { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg-tertiary); border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
      .reset-mode:hover { background: var(--bg-secondary); }
      .reset-mode.selected { border-color: var(--accent); }
      .reset-mode input { width: 1.15em; height: 1.15em; margin-top: 2px; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .reset-mode input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--accent); }
      .reset-mode input:checked { border-color: var(--accent); }
      .reset-mode input:checked::before { transform: scale(1); }
      .mode-content { flex: 1; }
      .mode-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
      .mode-desc { font-size: 11px; color: var(--text-muted); }
      .mode-desc.danger { color: var(--danger); }
      .reset-warning { display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--danger-dim); border-radius: 8px; font-size: 12px; color: var(--danger); }
      .reset-warning svg { width: 16px; height: 16px; flex-shrink: 0; }
      .btn-danger { background: var(--danger); color: #fff; }
      .btn-danger:hover { background: #dc2626; }
    </style>
  `;
}

function getReflogViewHTML() {
  const reflogEntries = [
    { index: 0, hash: 'a1b2c3d', action: 'commit', message: 'feat: Add user authentication', date: '2 min ago' },
    { index: 1, hash: 'e4f5g6h', action: 'checkout', message: 'moving from feature/auth to main', date: '10 min ago' },
    { index: 2, hash: 'i7j8k9l', action: 'commit', message: 'fix: Fix login bug', date: '1 hour ago' },
    { index: 3, hash: 'm0n1o2p', action: 'rebase', message: 'rebase finished', date: '2 hours ago' },
    { index: 4, hash: 'q3r4s5t', action: 'reset', message: 'moving to HEAD~1', date: '3 hours ago' },
    { index: 5, hash: 'u6v7w8x', action: 'pull', message: 'merge origin/main', date: 'yesterday' },
    { index: 6, hash: 'y9z0a1b', action: 'cherry-pick', message: 'cherry-picked abc123', date: 'yesterday' },
  ];

  const actionColors = {
    'commit': 'var(--success)',
    'checkout': 'var(--accent)',
    'rebase': 'var(--warning)',
    'reset': 'var(--danger)',
    'pull': 'var(--info)',
    'cherry-pick': '#ec4899'
  };

  const rows = reflogEntries.map(e => `
    <div class="reflog-row" onclick="selectReflogEntry(this, ${e.index})">
      <div class="reflog-index">HEAD@{${e.index}}</div>
      <div class="reflog-hash">${e.hash}</div>
      <div class="reflog-action" style="color: ${actionColors[e.action] || 'var(--text-secondary)'};">${e.action}</div>
      <div class="reflog-message">${e.message}</div>
      <div class="reflog-date">${e.date}</div>
      <div class="reflog-actions">
        <button class="icon-btn" onclick="checkoutReflog(${e.index}, event)" title="Checkout">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
        </button>
        <button class="icon-btn" onclick="resetToReflog(${e.index}, event)" title="Reset to here">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41z"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Reflog</h2>
          <span class="operation-desc">HEAD history - Recover lost commits</span>
        </div>
      </div>
      <div class="reflog-content">
        <div class="reflog-table">
          <div class="reflog-header">
            <div class="reflog-index">Ref</div>
            <div class="reflog-hash">Hash</div>
            <div class="reflog-action">Action</div>
            <div class="reflog-message">Message</div>
            <div class="reflog-date">Date</div>
            <div class="reflog-actions">Actions</div>
          </div>
          ${rows}
        </div>
      </div>
    </div>
    <style>
      .operation-hint { font-size: 12px; color: var(--text-muted); margin-left: auto; }
      .reflog-content { flex: 1; overflow-y: auto; padding: 20px; }
      .reflog-table { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
      .reflog-header { display: grid; grid-template-columns: 100px 80px 100px 1fr 80px 80px; padding: 12px 16px; background: var(--bg-tertiary); font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .reflog-row { display: grid; grid-template-columns: 100px 80px 100px 1fr 80px 80px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .reflog-row:hover { background: var(--bg-tertiary); }
      .reflog-row:last-child { border-bottom: none; }
      .reflog-index { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--accent); }
      .reflog-hash { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted); }
      .reflog-action { font-size: 12px; font-weight: 500; }
      .reflog-message { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .reflog-date { font-size: 11px; color: var(--text-muted); }
      .reflog-actions { display: flex; gap: 4px; justify-content: flex-end; }
    </style>
  `;
}

function getSubmodulesViewHTML() {
  const submodules = [
    { path: 'vendor/lib-auth', url: 'git@github.com:example/lib-auth.git', branch: 'main', commit: 'abc1234', status: 'up-to-date' },
    { path: 'vendor/lib-crypto', url: 'git@github.com:example/lib-crypto.git', branch: 'v2.x', commit: 'def5678', status: 'behind' },
  ];

  const rows = submodules.map(s => `
    <div class="submodule-card ${s.status}">
      <div class="submodule-header">
        <div class="submodule-icon">📦</div>
        <div class="submodule-info">
          <div class="submodule-path">${s.path}</div>
          <div class="submodule-url">${s.url}</div>
        </div>
        <div class="submodule-status ${s.status}">
          ${s.status === 'up-to-date' ? '✓ Up to date' : '⚠ Updates available'}
        </div>
      </div>
      <div class="submodule-details">
        <div class="submodule-detail">
          <span class="detail-label">Branch:</span>
          <span class="detail-value">${s.branch}</span>
        </div>
        <div class="submodule-detail">
          <span class="detail-label">Commit:</span>
          <span class="detail-value hash">${s.commit}</span>
        </div>
      </div>
      <div class="submodule-actions">
        <button class="btn btn-secondary btn-sm" onclick="updateSubmodule('${s.path}')">Update</button>
        <button class="btn btn-secondary btn-sm" onclick="openSubmodule('${s.path}')">Open</button>
        <button class="btn btn-secondary btn-sm" onclick="removeSubmodule('${s.path}')">Remove</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Submodules</h2>
          <span class="operation-desc">Add, update, and remove submodules</span>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="addSubmodule()">+ Add</button>
        </div>
      </div>
      <div class="submodules-content">
        <div class="submodules-toolbar">
          <button class="btn btn-secondary" onclick="updateAllSubmodules()">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>
            Update All
          </button>
          <button class="btn btn-secondary" onclick="initSubmodules()">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/></svg>
            Init & Update
          </button>
        </div>
        <div class="submodules-list">
          ${rows || '<p class="empty-state">No submodules</p>'}
        </div>
      </div>
    </div>
    <style>
      .submodules-content { flex: 1; overflow-y: auto; padding: 20px; }
      .submodules-toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
      .submodules-list { display: flex; flex-direction: column; gap: 12px; }
      .submodule-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
      .submodule-card.behind { border-left: 3px solid var(--warning); }
      .submodule-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .submodule-icon { font-size: 24px; }
      .submodule-info { flex: 1; }
      .submodule-path { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .submodule-url { font-size: 12px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
      .submodule-status { font-size: 12px; padding: 4px 10px; border-radius: 6px; }
      .submodule-status.up-to-date { background: var(--success-dim); color: var(--success); }
      .submodule-status.behind { background: var(--warning-dim); color: var(--warning); }
      .submodule-details { display: flex; gap: 24px; margin-bottom: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; }
      .submodule-detail { display: flex; gap: 8px; font-size: 12px; }
      .detail-label { color: var(--text-muted); }
      .detail-value { color: var(--text-primary); }
      .detail-value.hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); }
      .submodule-actions { display: flex; gap: 8px; }
    </style>
  `;
}

function getWorktreesViewHTML() {
  const worktrees = [
    { path: '/Users/dev/rocket', branch: 'main', isMain: true, commit: 'a1b2c3d', status: 'clean' },
    { path: '/Users/dev/rocket-feature', branch: 'feature/auth', isMain: false, commit: 'x9y8z7w', status: 'modified' },
    { path: '/Users/dev/rocket-hotfix', branch: 'hotfix/login', isMain: false, commit: 'p0q1r2s', status: 'clean' },
  ];

  const rows = worktrees.map(w => `
    <div class="worktree-card ${w.isMain ? 'main' : ''} ${w.status}">
      <div class="worktree-header">
        <div class="worktree-icon">${w.isMain ? '🏠' : '🌲'}</div>
        <div class="worktree-info">
          <div class="worktree-path">${w.path}</div>
          <div class="worktree-branch">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
            ${w.branch}
          </div>
        </div>
        <div class="worktree-badges">
          ${w.isMain ? '<span class="worktree-badge main">Main</span>' : ''}
          <span class="worktree-badge ${w.status}">${w.status === 'clean' ? '✓ Clean' : '● Modified'}</span>
        </div>
      </div>
      <div class="worktree-details">
        <div class="worktree-detail">
          <span class="detail-label">Commit:</span>
          <span class="detail-value hash">${w.commit}</span>
        </div>
      </div>
      ${!w.isMain ? `
        <div class="worktree-actions">
          <button class="btn btn-secondary btn-sm" onclick="openWorktree('${w.path}')">Open</button>
          <button class="btn btn-secondary btn-sm" onclick="removeWorktree('${w.path}')">Remove</button>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Worktrees</h2>
          <span class="operation-desc">Manage multiple worktrees</span>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="addWorktree()">+ Add</button>
        </div>
      </div>
      <div class="worktrees-content">
        <div class="worktrees-hint">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
          <span>Worktrees allow you to work on different branches of the same repository simultaneously</span>
        </div>
        <div class="worktrees-list">
          ${rows}
        </div>
      </div>
    </div>
    <style>
      .worktrees-content { flex: 1; overflow-y: auto; padding: 20px; }
      .worktrees-hint { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--accent-dim); border-radius: 8px; font-size: 13px; color: var(--accent); margin-bottom: 20px; }
      .worktrees-hint svg { width: 16px; height: 16px; flex-shrink: 0; }
      .worktrees-list { display: flex; flex-direction: column; gap: 12px; }
      .worktree-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
      .worktree-card.main { border-color: var(--accent); }
      .worktree-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .worktree-icon { font-size: 24px; }
      .worktree-info { flex: 1; }
      .worktree-path { font-size: 14px; font-weight: 600; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
      .worktree-branch { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--accent); }
      .worktree-branch svg { width: 14px; height: 14px; }
      .worktree-badges { display: flex; gap: 8px; }
      .worktree-badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; }
      .worktree-badge.main { background: var(--accent-dim); color: var(--accent); }
      .worktree-badge.clean { background: var(--success-dim); color: var(--success); }
      .worktree-badge.modified { background: var(--warning-dim); color: var(--warning); }
      .worktree-details { display: flex; gap: 24px; margin-bottom: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; }
      .worktree-detail { display: flex; gap: 8px; font-size: 12px; }
      .worktree-actions { display: flex; gap: 8px; }
    </style>
  `;
}

// ===== Advanced Operation Handlers =====

function toggleCherryPick(element, hash) {
  element.classList.toggle('selected');
  const checkbox = element.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  updateCherryPickSelection();
}

function updateCherryPickSelection() {
  const selected = document.querySelectorAll('.cherry-commit-row.selected');
  const container = document.getElementById('cherry-selected');
  if (selected.length === 0) {
    container.innerHTML = '<p class="empty-hint">Select commits</p>';
  } else {
    const items = Array.from(selected).map(row => {
      const hash = row.querySelector('input').dataset.hash;
      const msg = row.querySelector('.cherry-message').textContent;
      return `<div class="selected-item"><span class="hash">${hash}</span> ${msg.substring(0, 30)}...</div>`;
    }).join('');
    container.innerHTML = items;
  }
}

function executeCherryPick() {
  const selected = document.querySelectorAll('.cherry-commit-row.selected');
  if (selected.length === 0) {
    showToast('error', 'Please select commits');
    return;
  }
  showToast('success', `Cherry-picked ${selected.length} commit(s)`);
}

function selectRevertCommit(element, hash) {
  document.querySelectorAll('.revert-commit-row').forEach(r => r.classList.remove('selected'));
  element.classList.add('selected');
  element.querySelector('input').checked = true;
}

function executeRevert() {
  showToast('success', 'Commit reverted');
}

function selectResetCommit(element, hash) {
  document.querySelectorAll('.reset-commit-row').forEach(r => r.classList.remove('selected'));
  element.classList.add('selected');
  element.querySelector('input').checked = true;
}

function executeReset() {
  showToast('warning', 'Repository reset');
}

function selectReflogEntry(element, index) {
  document.querySelectorAll('.reflog-row').forEach(r => r.classList.remove('selected'));
  element.classList.add('selected');
}

function checkoutReflog(index, event) {
  event.stopPropagation();
  showToast('success', `Checked out to HEAD@{${index}}`);
}

function resetToReflog(index, event) {
  event.stopPropagation();
  showToast('warning', `Reset to HEAD@{${index}}`);
}

function addSubmodule() {
  const url = prompt('Submodule URL:');
  if (url) {
    showToast('success', 'Submodule added');
  }
}

function updateSubmodule(path) {
  showToast('info', `Updating ${path}...`);
  setTimeout(() => showToast('success', 'Submodule updated'), 1000);
}

function openSubmodule(path) {
  showToast('info', `Opening ${path}`);
}

function removeSubmodule(path) {
  if (confirm(`Remove ${path}?`)) {
    showToast('warning', 'Submodule removed');
  }
}

function updateAllSubmodules() {
  showToast('info', 'Updating all submodules...');
  setTimeout(() => showToast('success', 'All submodules updated'), 1500);
}

function initSubmodules() {
  showToast('info', 'Initializing submodules...');
  setTimeout(() => showToast('success', 'Submodules initialized'), 1000);
}

function addWorktree() {
  const branch = prompt('Branch name:');
  if (branch) {
    const path = prompt('Worktree path:');
    if (path) {
      showToast('success', `Worktree created: ${path}`);
    }
  }
}

function openWorktree(path) {
  showToast('info', `Opening ${path}`);
}

function removeWorktree(path) {
  if (confirm(`Remove ${path}?`)) {
    showToast('warning', 'Worktree removed');
  }
}
