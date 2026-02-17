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
    {
      name: 'main', current: true, remote: 'origin/main', ahead: 0, behind: 0,
      lastCommit: { hash: 'a1b2c3d', message: 'Merge branch feature/auth into main', author: 'tanaka', email: 'tanaka@example.com', date: '2 hours ago', dateAbsolute: 'Feb 17, 2026 14:32' },
      recentCommits: [
        { hash: 'a1b2c3d', message: 'Merge branch feature/auth into main', author: 'tanaka', date: '2 hours ago' },
        { hash: 'g6h7i8j', message: 'docs: Update API documentation', author: 'tanaka', date: '1 day ago' },
        { hash: 'j9k0l1m', message: 'fix: Fix login redirect bug', author: 'tanaka', date: '3 days ago' },
        { hash: 'm2n3o4p', message: 'chore: Update dependencies', author: 'tanaka', date: '5 days ago' }
      ]
    },
    {
      name: 'feature/auth', current: false, remote: 'origin/feature/auth', ahead: 2, behind: 0,
      lastCommit: { hash: 'e4f5g6h', message: 'feat: Add login form validation', author: 'yamada', email: 'yamada@example.com', date: '8 hours ago', dateAbsolute: 'Feb 17, 2026 08:15' },
      recentCommits: [
        { hash: 'e4f5g6h', message: 'feat: Add login form validation', author: 'yamada', date: '8 hours ago' },
        { hash: 'c3d4e5f', message: 'feat: Add token refresh logic', author: 'yamada', date: '5 hours ago' },
        { hash: 'b2c3d4e', message: 'feat: Complete OAuth integration', author: 'yamada', date: '3 hours ago' }
      ]
    },
    {
      name: 'feature/ui-redesign', current: false, remote: null, ahead: 5, behind: 0,
      lastCommit: { hash: 'd4e5f6g', message: 'fix: Fix CSS layout issue', author: 'suzuki', email: 'suzuki@example.com', date: '6 hours ago', dateAbsolute: 'Feb 17, 2026 10:45' },
      recentCommits: [
        { hash: 'd4e5f6g', message: 'fix: Fix CSS layout issue', author: 'suzuki', date: '6 hours ago' },
        { hash: 'f5g6h7i', message: 'refactor: Improve component structure', author: 'suzuki', date: '1 day ago' }
      ]
    },
    {
      name: 'hotfix/login-bug', current: false, remote: 'origin/hotfix/login-bug', ahead: 0, behind: 1,
      lastCommit: { hash: 'l1m2n3o', message: 'fix: Critical login hotfix', author: 'yamada', email: 'yamada@example.com', date: '4 days ago', dateAbsolute: 'Feb 13, 2026 09:22' },
      recentCommits: [
        { hash: 'l1m2n3o', message: 'fix: Critical login hotfix', author: 'yamada', date: '4 days ago' }
      ]
    }
  ],
  commits: [
    // Graph structure: column (0=main, 1=feature/auth, 2=feature/ui), type (commit/merge/branch)
    { hash: 'a1b2c3d', message: 'Merge branch feature/auth into main', author: 'tanaka', date: '2 hours ago', branch: 'main', col: 0, type: 'merge', mergeFrom: 1, refs: ['HEAD', 'main', 'origin/main'],
      changedFiles: [
        { path: 'src/auth/handler.go', status: 'M', additions: 45, deletions: 12, conflict: false },
        { path: 'src/auth/middleware.go', status: 'M', additions: 23, deletions: 5, conflict: false },
        { path: 'tests/auth_test.go', status: 'A', additions: 67, deletions: 0, conflict: false }
      ]
    },
    { hash: 'b2c3d4e', message: 'feat: Complete OAuth integration', author: 'yamada', date: '3 hours ago', branch: 'feature/auth', col: 1, type: 'commit', refs: [],
      changedFiles: [
        { path: 'src/oauth/client.go', status: 'A', additions: 156, deletions: 0, conflict: false },
        { path: 'src/oauth/token.go', status: 'A', additions: 89, deletions: 0, conflict: false },
        { path: 'src/config/oauth.go', status: 'M', additions: 12, deletions: 3, conflict: true },
        { path: 'go.mod', status: 'M', additions: 2, deletions: 0, conflict: false }
      ]
    },
    { hash: 'c3d4e5f', message: 'feat: Add token refresh logic', author: 'yamada', date: '5 hours ago', branch: 'feature/auth', col: 1, type: 'commit', refs: [],
      changedFiles: [
        { path: 'src/auth/token.go', status: 'M', additions: 78, deletions: 15, conflict: false },
        { path: 'src/auth/refresh.go', status: 'A', additions: 124, deletions: 0, conflict: false }
      ]
    },
    { hash: 'd4e5f6g', message: 'fix: Fix CSS layout issue', author: 'suzuki', date: '6 hours ago', branch: 'feature/ui', col: 2, type: 'commit', refs: ['feature/ui-redesign'],
      changedFiles: [
        { path: 'src/ui/styles/layout.css', status: 'M', additions: 34, deletions: 28, conflict: true },
        { path: 'src/ui/components/Grid.vue', status: 'M', additions: 12, deletions: 8, conflict: false }
      ]
    },
    { hash: 'e4f5g6h', message: 'feat: Add login form validation', author: 'yamada', date: '8 hours ago', branch: 'feature/auth', col: 1, type: 'commit', refs: ['feature/auth'],
      changedFiles: [
        { path: 'src/auth/validation.go', status: 'A', additions: 95, deletions: 0, conflict: false },
        { path: 'src/auth/login.go', status: 'M', additions: 42, deletions: 10, conflict: false },
        { path: 'tests/validation_test.go', status: 'A', additions: 156, deletions: 0, conflict: false }
      ]
    },
    { hash: 'f5g6h7i', message: 'refactor: Improve component structure', author: 'suzuki', date: '1 day ago', branch: 'feature/ui', col: 2, type: 'commit', refs: [],
      changedFiles: [
        { path: 'src/ui/components/Button.vue', status: 'M', additions: 25, deletions: 45, conflict: false },
        { path: 'src/ui/components/Input.vue', status: 'M', additions: 18, deletions: 32, conflict: false },
        { path: 'src/ui/components/Card.vue', status: 'A', additions: 67, deletions: 0, conflict: false }
      ]
    },
    { hash: 'g6h7i8j', message: 'docs: Update API documentation', author: 'tanaka', date: '1 day ago', branch: 'main', col: 0, type: 'commit', refs: [],
      changedFiles: [
        { path: 'docs/api/README.md', status: 'M', additions: 234, deletions: 56, conflict: false },
        { path: 'docs/api/auth.md', status: 'A', additions: 189, deletions: 0, conflict: false }
      ]
    },
    { hash: 'h7i8j9k', message: 'feat: Start auth feature branch', author: 'yamada', date: '2 days ago', branch: 'feature/auth', col: 1, type: 'branch', branchFrom: 0, refs: [],
      changedFiles: [
        { path: 'src/auth/init.go', status: 'A', additions: 23, deletions: 0, conflict: false }
      ]
    },
    { hash: 'i8j9k0l', message: 'feat: Start UI redesign', author: 'suzuki', date: '2 days ago', branch: 'feature/ui', col: 2, type: 'branch', branchFrom: 0, refs: [],
      changedFiles: [
        { path: 'src/ui/design-system.md', status: 'A', additions: 45, deletions: 0, conflict: false }
      ]
    },
    { hash: 'j9k0l1m', message: 'fix: Fix login redirect bug', author: 'tanaka', date: '3 days ago', branch: 'main', col: 0, type: 'commit', refs: [],
      changedFiles: [
        { path: 'src/routes/auth.go', status: 'M', additions: 8, deletions: 3, conflict: false },
        { path: 'src/middleware/redirect.go', status: 'M', additions: 15, deletions: 7, conflict: true }
      ]
    },
    { hash: 'k0l1m2n', message: 'Merge branch hotfix/login into main', author: 'tanaka', date: '4 days ago', branch: 'main', col: 0, type: 'merge', mergeFrom: 3, refs: [],
      changedFiles: [
        { path: 'src/auth/login.go', status: 'M', additions: 5, deletions: 2, conflict: false }
      ]
    },
    { hash: 'l1m2n3o', message: 'fix: Critical login hotfix', author: 'yamada', date: '4 days ago', branch: 'hotfix/login', col: 3, type: 'commit', refs: [],
      changedFiles: [
        { path: 'src/auth/session.go', status: 'M', additions: 12, deletions: 8, conflict: false },
        { path: 'src/auth/cookie.go', status: 'M', additions: 6, deletions: 4, conflict: false }
      ]
    },
    { hash: 'm2n3o4p', message: 'chore: Update dependencies', author: 'tanaka', date: '5 days ago', branch: 'main', col: 0, type: 'commit', refs: [],
      changedFiles: [
        { path: 'go.mod', status: 'M', additions: 15, deletions: 12, conflict: false },
        { path: 'go.sum', status: 'M', additions: 45, deletions: 38, conflict: false }
      ]
    },
    { hash: 'n3o4p5q', message: 'feat: Add settings screen', author: 'suzuki', date: '1 week ago', branch: 'main', col: 0, type: 'commit', refs: ['v1.0.0'],
      changedFiles: [
        { path: 'src/ui/pages/Settings.vue', status: 'A', additions: 234, deletions: 0, conflict: false },
        { path: 'src/store/settings.go', status: 'A', additions: 89, deletions: 0, conflict: false },
        { path: 'src/routes/settings.go', status: 'A', additions: 45, deletions: 0, conflict: false }
      ]
    },
    { hash: 'o4p5q6r', message: 'Initial commit', author: 'tanaka', date: '2 weeks ago', branch: 'main', col: 0, type: 'commit', refs: [],
      changedFiles: [
        { path: 'README.md', status: 'A', additions: 56, deletions: 0, conflict: false },
        { path: 'go.mod', status: 'A', additions: 8, deletions: 0, conflict: false },
        { path: 'main.go', status: 'A', additions: 23, deletions: 0, conflict: false }
      ]
    }
  ],
  stashes: [
    {
      index: 0,
      message: 'WIP: Auth feature in progress',
      branch: 'feature/auth',
      date: '1 hour ago',
      dateAbsolute: 'Feb 17, 2026 15:32',
      files: [
        { path: 'src/auth/login.go', status: 'M', additions: 45, deletions: 12 },
        { path: 'src/auth/session.go', status: 'M', additions: 23, deletions: 8 },
        { path: 'src/auth/oauth.go', status: 'A', additions: 156, deletions: 0 },
        { path: 'tests/auth_test.go', status: 'M', additions: 67, deletions: 15 }
      ]
    },
    {
      index: 1,
      message: 'WIP: UI adjustments',
      branch: 'main',
      date: 'yesterday',
      dateAbsolute: 'Feb 16, 2026 18:45',
      files: [
        { path: 'src/ui/components/Button.vue', status: 'M', additions: 18, deletions: 25 },
        { path: 'src/ui/components/Modal.vue', status: 'M', additions: 34, deletions: 12 },
        { path: 'src/ui/styles/theme.css', status: 'M', additions: 56, deletions: 42 }
      ]
    }
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
  initHistoryGraphSync();
});

// ===== History Graph Sync =====
function initHistoryGraphSync() {
  // Setup synchronized scrolling between graph and commit list
  const commitList = document.querySelector('.commit-list');
  const graphColumn = document.querySelector('.graph-column');

  if (commitList && graphColumn) {
    commitList.addEventListener('scroll', () => {
      graphColumn.scrollTop = commitList.scrollTop;
    });
  }
}

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
  if (!view) return;
  // Reset loaded flag to allow re-rendering during development
  // if (view.dataset.loaded) return;

  switch (viewName) {
    case 'history':
      view.innerHTML = getHistoryViewHTML();
      // Re-init graph sync after loading
      setTimeout(initHistoryGraphSync, 0);
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
    case 'stash':
      view.innerHTML = getStashViewHTML();
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
        <input type="text" class="search-input search-main" placeholder="Search in repository..." autofocus>
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
      .search-main {
        width: 100%;
        padding: 14px 16px 14px 44px;
        font-size: 14px;
        border-radius: 10px;
        background-size: 18px;
        background-position: 14px center;
      }
      .search-main:focus {
        box-shadow: 0 0 0 4px var(--accent-dim);
      }
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
  // Branch colors for graph
  const branchColors = ['#58a6ff', '#f78166', '#a371f7', '#7ee787', '#ffa657'];
  const ROW_HEIGHT = 52;
  const COL_WIDTH = 20;
  const NODE_RADIUS = 5;
  const GRAPH_PADDING = 16;

  // Calculate active columns at each row
  const commits = sampleData.commits;
  const maxCol = Math.max(...commits.map(c => c.col));

  // Build graph SVG paths
  function buildGraphSVG() {
    const height = commits.length * ROW_HEIGHT;
    const width = (maxCol + 1) * COL_WIDTH + GRAPH_PADDING * 2;

    let paths = '';
    let nodes = '';

    // Track active lanes per column
    const activeLanes = new Array(maxCol + 1).fill(false);

    commits.forEach((commit, index) => {
      const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x = GRAPH_PADDING + commit.col * COL_WIDTH;
      const color = branchColors[commit.col % branchColors.length];

      // Draw vertical lines for active lanes
      for (let col = 0; col <= maxCol; col++) {
        if (activeLanes[col] && col !== commit.col) {
          const laneX = GRAPH_PADDING + col * COL_WIDTH;
          const laneColor = branchColors[col % branchColors.length];
          paths += `<line x1="${laneX}" y1="${y - ROW_HEIGHT/2}" x2="${laneX}" y2="${y + ROW_HEIGHT/2}" stroke="${laneColor}" stroke-width="2" class="graph-lane"/>`;
        }
      }

      // Handle different commit types
      if (commit.type === 'branch') {
        // Branch point: draw curve from parent column
        const parentX = GRAPH_PADDING + commit.branchFrom * COL_WIDTH;
        paths += `<path d="M ${parentX} ${y - ROW_HEIGHT/2} L ${parentX} ${y - 10} Q ${parentX} ${y} ${x} ${y}" stroke="${color}" stroke-width="2" fill="none" class="graph-branch"/>`;
        paths += `<line x1="${parentX}" y1="${y}" x2="${parentX}" y2="${y + ROW_HEIGHT/2}" stroke="${branchColors[commit.branchFrom % branchColors.length]}" stroke-width="2" class="graph-lane"/>`;
        activeLanes[commit.col] = true;
      } else if (commit.type === 'merge') {
        // Merge: draw curve from merged branch
        const mergeX = GRAPH_PADDING + commit.mergeFrom * COL_WIDTH;
        paths += `<path d="M ${mergeX} ${y - ROW_HEIGHT/2} L ${mergeX} ${y - 10} Q ${mergeX} ${y} ${x} ${y}" stroke="${branchColors[commit.mergeFrom % branchColors.length]}" stroke-width="2" fill="none" class="graph-merge"/>`;
        // Continue main line
        if (index < commits.length - 1) {
          paths += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + ROW_HEIGHT/2}" stroke="${color}" stroke-width="2" class="graph-lane"/>`;
        }
        activeLanes[commit.mergeFrom] = false;
      } else {
        // Regular commit: continue line
        if (index < commits.length - 1) {
          paths += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + ROW_HEIGHT/2}" stroke="${color}" stroke-width="2" class="graph-lane"/>`;
        }
        if (index > 0) {
          paths += `<line x1="${x}" y1="${y - ROW_HEIGHT/2}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="2" class="graph-lane"/>`;
        }
      }

      // Draw node
      const nodeClass = commit.type === 'merge' ? 'merge-node' : (commit.type === 'branch' ? 'branch-node' : '');
      if (commit.type === 'merge') {
        nodes += `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS + 2}" fill="var(--bg)" stroke="${color}" stroke-width="2" class="graph-node ${nodeClass}"/>`;
        nodes += `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS - 1}" fill="${color}" class="graph-node-inner"/>`;
      } else {
        nodes += `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS}" fill="${color}" class="graph-node ${nodeClass}"/>`;
      }
    });

    return `<svg class="commit-graph-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths}${nodes}</svg>`;
  }

  const graphSVG = buildGraphSVG();

  const commitList = sampleData.commits.map((c, index) => {
    const refsHtml = c.refs.map(ref => {
      let refClass = 'ref-tag';
      if (ref === 'HEAD') refClass = 'ref-head';
      else if (ref.startsWith('origin/')) refClass = 'ref-remote';
      else if (ref.startsWith('v')) refClass = 'ref-version';
      else refClass = 'ref-branch';
      return `<span class="commit-ref ${refClass}">${ref}</span>`;
    }).join('');

    return `
    <div class="commit-row" onclick="selectCommit('${c.hash}')" data-index="${index}">
      <div class="commit-info">
        <div class="commit-message-row">
          <span class="commit-message">${c.message}</span>
          ${refsHtml}
        </div>
        <div class="commit-meta">
          <span class="commit-hash">${c.hash}</span>
          <span class="commit-author">${c.author}</span>
          <span class="commit-date">${c.date}</span>
        </div>
      </div>
    </div>
  `}).join('');

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
            <div class="branch-legend">
              <span class="legend-item"><span class="legend-dot" style="background: #58a6ff;"></span>main</span>
              <span class="legend-item"><span class="legend-dot" style="background: #f78166;"></span>feature/auth</span>
              <span class="legend-item"><span class="legend-dot" style="background: #a371f7;"></span>feature/ui</span>
              <span class="legend-item"><span class="legend-dot" style="background: #7ee787;"></span>hotfix</span>
            </div>
          <div class="panel-actions">
            <input type="text" class="search-input" placeholder="Search...">
          </div>
        </div>
        <div class="commit-list-wrapper">
          <div class="graph-column">${graphSVG}</div>
          <div class="commit-list">${commitList}</div>
        </div>
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
            <div class="section-header">
              <span class="section-title">Changed Files</span>
              <span class="section-count">5</span>
            </div>
            <div class="unified-files-list">
              <div class="unified-file added" onclick="toggleFileDiff(this, 'handler')">
                <div class="unified-file-status added">+</div>
                <div class="unified-file-path">internal/auth/handler.go</div>
                <div class="unified-file-stats">
                  <span class="stat-add">+89</span>
                  <span class="stat-del">-0</span>
                </div>
                <div class="unified-file-expand">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
                </div>
              </div>
              <div class="unified-file modified expanded" onclick="toggleFileDiff(this, 'middleware')">
                <div class="unified-file-status modified">~</div>
                <div class="unified-file-path">internal/auth/middleware.go</div>
                <div class="unified-file-stats">
                  <span class="stat-add">+24</span>
                  <span class="stat-del">-8</span>
                </div>
                <div class="unified-file-expand">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
                </div>
              </div>
              <div class="unified-file-diff" id="diff-middleware">
                <div class="diff-preview-header">
                  <span class="diff-preview-path">internal/auth/middleware.go</span>
                  <div class="diff-preview-actions">
                    <button class="icon-btn" title="View full file">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
                    </button>
                    <button class="icon-btn" title="Copy path">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
                    </button>
                  </div>
                </div>
                <div class="diff-preview-content">
                  <div class="diff-hunk">
                    <div class="diff-hunk-header">@@ -12,6 +12,18 @@ func NewAuthMiddleware(config *Config) *AuthMiddleware {</div>
                    <div class="diff-line context"><span class="line-num old">12</span><span class="line-num new">12</span><span class="line-code">    return &AuthMiddleware{config: config}</span></div>
                    <div class="diff-line context"><span class="line-num old">13</span><span class="line-num new">13</span><span class="line-code">}</span></div>
                    <div class="diff-line context"><span class="line-num old">14</span><span class="line-num new">14</span><span class="line-code"></span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">15</span><span class="line-code">// ValidateToken checks if the token is valid and not expired</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">16</span><span class="line-code">func (m *AuthMiddleware) ValidateToken(token string) (*Claims, error) {</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">17</span><span class="line-code">    claims, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">18</span><span class="line-code">        return m.config.SecretKey, nil</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">19</span><span class="line-code">    })</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">20</span><span class="line-code">    if err != nil {</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">21</span><span class="line-code">        return nil, fmt.Errorf("invalid token: %w", err)</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">22</span><span class="line-code">    }</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">23</span><span class="line-code">    return claims.(*Claims), nil</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">24</span><span class="line-code">}</span></div>
                    <div class="diff-line context"><span class="line-num old">15</span><span class="line-num new">25</span><span class="line-code"></span></div>
                    <div class="diff-line del"><span class="line-num old">16</span><span class="line-num new"></span><span class="line-code">// Deprecated: Use ValidateToken instead</span></div>
                    <div class="diff-line del"><span class="line-num old">17</span><span class="line-num new"></span><span class="line-code">func (m *AuthMiddleware) CheckToken(token string) bool {</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">26</span><span class="line-code">// Middleware returns the HTTP middleware handler</span></div>
                    <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">27</span><span class="line-code">func (m *AuthMiddleware) Middleware() func(http.Handler) http.Handler {</span></div>
                    <div class="diff-line context"><span class="line-num old">18</span><span class="line-num new">28</span><span class="line-code">    return func(next http.Handler) http.Handler {</span></div>
                  </div>
                </div>
              </div>
              <div class="unified-file modified" onclick="toggleFileDiff(this, 'user')">
                <div class="unified-file-status modified">~</div>
                <div class="unified-file-path">internal/models/user.go</div>
                <div class="unified-file-stats">
                  <span class="stat-add">+12</span>
                  <span class="stat-del">-15</span>
                </div>
                <div class="unified-file-expand">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
                </div>
              </div>
              <div class="unified-file added" onclick="toggleFileDiff(this, 'token')">
                <div class="unified-file-status added">+</div>
                <div class="unified-file-path">internal/auth/token.go</div>
                <div class="unified-file-stats">
                  <span class="stat-add">+45</span>
                  <span class="stat-del">-0</span>
                </div>
                <div class="unified-file-expand">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
                </div>
              </div>
              <div class="unified-file deleted" onclick="toggleFileDiff(this, 'legacy')">
                <div class="unified-file-status deleted">-</div>
                <div class="unified-file-path">internal/auth/legacy.go</div>
                <div class="unified-file-stats">
                  <span class="stat-add">+0</span>
                  <span class="stat-del">-23</span>
                </div>
                <div class="unified-file-expand">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
                </div>
              </div>
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
      .history-content { display: grid; grid-template-columns: 50% 50%; flex: 1; width: 100%; height: 100%; min-width: 0; overflow: hidden; }
      .history-content > * { min-width: 0; width: 100%; height: 100%; }
      .history-panel { display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border); }

      /* Branch legend */
      .branch-legend { display: flex; gap: 12px; margin-left: auto; margin-right: 16px; }
      .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
      .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

      /* Graph column with synchronized scrolling */
      .commit-list-wrapper { display: flex; flex: 1; overflow: hidden; }
      .graph-column { flex-shrink: 0; overflow: hidden; background: var(--bg); border-right: 1px solid var(--border); }
      .commit-graph-svg { display: block; }
      .graph-lane { opacity: 0.8; }
      .graph-branch, .graph-merge { opacity: 0.9; }
      .graph-node { transition: r 0.15s ease; }

      .commit-list { flex: 1; overflow-y: auto; }
      .commit-row { display: flex; height: 52px; padding: 0 16px; align-items: center; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; box-sizing: border-box; }
      .commit-row:hover { background: var(--bg-tertiary); }
      .commit-row.selected { background: var(--accent-dim); border-left: 3px solid var(--accent); }
      .commit-info { flex: 1; min-width: 0; }
      .commit-message-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
      .commit-message { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .commit-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .commit-hash { font-family: 'JetBrains Mono', monospace; color: var(--accent); }

      /* Ref badges */
      .commit-ref { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; font-family: 'JetBrains Mono', monospace; white-space: nowrap; }
      .ref-head { background: var(--success); color: #fff; }
      .ref-branch { background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent); }
      .ref-remote { background: var(--purple-dim); color: var(--purple); }
      .ref-version { background: var(--warning-dim); color: var(--warning); }

      .commit-detail-panel { display: flex; flex-direction: column; overflow: hidden; width: 100%; }
      .commit-detail { flex: 1; padding: 20px; overflow-y: auto; width: 100%; box-sizing: border-box; }

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
      .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .section-title { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .section-count { background: var(--bg-tertiary); padding: 2px 8px; border-radius: 10px; font-size: 11px; color: var(--text-muted); }

      .unified-files-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg-primary); }
      .unified-file { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 12px; cursor: pointer; transition: background 0.15s; }
      .unified-file:last-child { border-bottom: none; }
      .unified-file:hover { background: var(--bg-tertiary); }
      .unified-file.expanded { background: var(--accent-dim); }
      .unified-file-status { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-weight: 700; font-size: 11px; flex-shrink: 0; }
      .unified-file-status.added { background: rgba(34, 197, 94, 0.2); color: var(--success); }
      .unified-file-status.deleted { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
      .unified-file-status.modified { background: rgba(59, 130, 246, 0.2); color: var(--accent); }
      .unified-file-path { flex: 1; font-family: 'JetBrains Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary); }
      .unified-file-stats { display: flex; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
      .unified-file-stats .stat-add { color: var(--success); }
      .unified-file-stats .stat-del { color: var(--danger); }
      .unified-file-expand { width: 16px; height: 16px; color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
      .unified-file-expand svg { width: 16px; height: 16px; }
      .unified-file.expanded .unified-file-expand { transform: rotate(180deg); color: var(--accent); }

      .unified-file-diff { border-bottom: 1px solid var(--border); background: var(--bg-secondary); overflow: hidden; animation: slideDown 0.2s ease; }
      .unified-file-diff:last-child { border-bottom: none; }

      .file-diff-preview { margin: 4px 0 8px 0; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; animation: slideDown 0.2s ease; }
      @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
      .diff-preview-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); }
      .diff-preview-path { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); }
      .diff-preview-actions { display: flex; gap: 4px; }
      .diff-preview-content { max-height: 280px; overflow-y: auto; }
      .diff-hunk { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
      .diff-hunk-header { padding: 6px 12px; background: var(--purple-dim); color: var(--purple); font-size: 10px; }
      .diff-line { display: flex; line-height: 1.5; }
      .diff-line .line-num { width: 36px; padding: 0 8px; text-align: right; color: var(--text-muted); background: var(--bg-tertiary); user-select: none; flex-shrink: 0; font-size: 10px; }
      .diff-line .line-code { flex: 1; padding: 0 12px; white-space: pre; overflow-x: auto; }
      .diff-line.context { background: var(--bg); }
      .diff-line.context .line-code { color: var(--text-secondary); }
      .diff-line.add { background: rgba(63, 185, 80, 0.1); }
      .diff-line.add .line-num { background: rgba(63, 185, 80, 0.15); color: var(--success); }
      .diff-line.add .line-code { color: var(--success); }
      .diff-line.add .line-code::before { content: '+'; margin-right: 4px; }
      .diff-line.del { background: rgba(248, 81, 73, 0.1); }
      .diff-line.del .line-num { background: rgba(248, 81, 73, 0.15); color: var(--danger); }
      .diff-line.del .line-code { color: var(--danger); }
      .diff-line.del .line-code::before { content: '-'; margin-right: 4px; }

      .detail-actions { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border); }
      .detail-actions .btn { flex: 1; }
      .empty-state { color: var(--text-muted); text-align: center; padding: 40px; }
    </style>
  `;
}

function getBranchesViewHTML() {
  const defaultBranch = sampleData.branches.find(b => b.current) || sampleData.branches[0];

  const branchList = sampleData.branches.map((b, index) => `
    <div class="branch-row ${b.current ? 'current' : ''} ${index === 0 ? 'selected' : ''}" onclick="selectBranch(this, '${b.name}')" data-branch="${b.name}">
      <div class="branch-icon">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
      </div>
      <div class="branch-details">
        <div class="branch-name">${b.name}</div>
        ${b.remote ? `<div class="branch-tracking">${b.remote}</div>` : '<div class="branch-tracking local-only">Local only</div>'}
      </div>
      <div class="branch-status">
        ${b.ahead > 0 ? `<span class="ahead">↑${b.ahead}</span>` : ''}
        ${b.behind > 0 ? `<span class="behind">↓${b.behind}</span>` : ''}
      </div>
      ${b.current ? '<span class="current-badge">HEAD</span>' : ''}
    </div>
  `).join('');

  const recentCommitsHTML = defaultBranch.recentCommits.map(c => `
    <div class="branch-commit-row">
      <div class="branch-commit-hash">${c.hash}</div>
      <div class="branch-commit-message">${c.message}</div>
      <div class="branch-commit-meta">
        <span class="branch-commit-author">${c.author}</span>
        <span class="branch-commit-date">${c.date}</span>
      </div>
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
      <div class="branches-content">
        <div class="branches-list-panel">
          <div class="panel-header">
            <span class="panel-title">All Branches</span>
            <span class="branch-count">${sampleData.branches.length}</span>
          </div>
          <div class="branch-list">${branchList}</div>
        </div>
        <div class="branch-detail-panel" id="branch-detail-panel">
          <div class="panel-header">
            <span class="panel-title">Branch Details</span>
            <div class="panel-actions">
              <button class="btn btn-secondary btn-sm" onclick="checkoutBranch('${defaultBranch.name}')">Checkout</button>
              <button class="btn btn-secondary btn-sm" onclick="mergeBranch('${defaultBranch.name}')">Merge</button>
            </div>
          </div>
          <div class="branch-detail-content" id="branch-detail-content">
            <div class="branch-detail-header">
              <div class="branch-detail-icon ${defaultBranch.current ? 'current' : ''}">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
              </div>
              <div class="branch-detail-info">
                <div class="branch-detail-name">${defaultBranch.name}</div>
                <div class="branch-detail-tracking">${defaultBranch.remote || 'Local only'}</div>
              </div>
              ${defaultBranch.current ? '<span class="current-badge">HEAD</span>' : ''}
            </div>

            <div class="branch-sync-status">
              <div class="sync-item ${defaultBranch.ahead > 0 ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/></svg>
                <span>${defaultBranch.ahead} ahead</span>
              </div>
              <div class="sync-item ${defaultBranch.behind > 0 ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/></svg>
                <span>${defaultBranch.behind} behind</span>
              </div>
            </div>

            <div class="branch-last-commit">
              <div class="section-label">Last Commit</div>
              <div class="last-commit-card">
                <div class="last-commit-header">
                  <div class="last-commit-avatar">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/></svg>
                  </div>
                  <div class="last-commit-author-info">
                    <div class="last-commit-author">${defaultBranch.lastCommit.author}</div>
                    <div class="last-commit-email">${defaultBranch.lastCommit.email}</div>
                  </div>
                  <div class="last-commit-date">
                    <div class="last-commit-relative">${defaultBranch.lastCommit.date}</div>
                    <div class="last-commit-absolute">${defaultBranch.lastCommit.dateAbsolute}</div>
                  </div>
                </div>
                <div class="last-commit-body">
                  <div class="last-commit-hash">${defaultBranch.lastCommit.hash}</div>
                  <div class="last-commit-message">${defaultBranch.lastCommit.message}</div>
                </div>
              </div>
            </div>

            <div class="branch-recent-commits">
              <div class="section-label">Recent Commits</div>
              <div class="branch-commits-list">
                ${recentCommitsHTML}
              </div>
            </div>

            <div class="branch-actions-footer">
              <button class="btn btn-secondary">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>
                Rebase
              </button>
              <button class="btn btn-secondary">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/></svg>
                Rename
              </button>
              <button class="btn btn-danger-outline">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>
      .branches-content { display: grid; grid-template-columns: 50% 50%; flex: 1; width: 100%; height: 100%; overflow: hidden; }
      .branches-content > * { min-width: 0; height: 100%; }

      .branches-list-panel { display: flex; flex-direction: column; border-right: 1px solid var(--border); overflow: hidden; }
      .branch-list { flex: 1; overflow-y: auto; }
      .branch-count { background: var(--bg-tertiary); padding: 2px 8px; border-radius: 10px; font-size: 11px; color: var(--text-muted); }

      .branch-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: all 0.15s; }
      .branch-row:hover { background: var(--bg-tertiary); }
      .branch-row.current { background: var(--accent-dim); }
      .branch-row.selected { background: var(--accent-dim); border-left: 3px solid var(--accent); }
      .branch-icon { color: var(--accent); }
      .branch-icon svg { width: 16px; height: 16px; }
      .branch-details { flex: 1; min-width: 0; }
      .branch-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .branch-tracking { font-size: 11px; color: var(--text-muted); }
      .branch-tracking.local-only { color: var(--warning); font-style: italic; }
      .branch-status { display: flex; gap: 8px; font-size: 11px; }
      .ahead { color: var(--success); }
      .behind { color: var(--warning); }
      .current-badge { padding: 3px 8px; background: var(--accent); color: #fff; border-radius: 4px; font-size: 10px; font-weight: 600; flex-shrink: 0; }

      .branch-detail-panel { display: flex; flex-direction: column; overflow: hidden; }
      .branch-detail-content { flex: 1; padding: 20px; overflow-y: auto; }

      .branch-detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
      .branch-detail-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-radius: 12px; color: var(--text-muted); }
      .branch-detail-icon.current { background: var(--accent-dim); color: var(--accent); }
      .branch-detail-icon svg { width: 24px; height: 24px; }
      .branch-detail-info { flex: 1; }
      .branch-detail-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
      .branch-detail-tracking { font-size: 12px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

      .branch-sync-status { display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; background: var(--bg-secondary); border-radius: 10px; }
      .sync-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
      .sync-item svg { width: 16px; height: 16px; }
      .sync-item.active { color: var(--text-primary); }
      .sync-item.active svg { color: var(--accent); }

      .section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

      .branch-last-commit { margin-bottom: 24px; }
      .last-commit-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
      .last-commit-header { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border); }
      .last-commit-avatar { width: 36px; height: 36px; background: var(--bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      .last-commit-avatar svg { width: 18px; height: 18px; color: var(--text-muted); }
      .last-commit-author-info { flex: 1; }
      .last-commit-author { font-size: 13px; font-weight: 600; }
      .last-commit-email { font-size: 11px; color: var(--text-muted); }
      .last-commit-date { text-align: right; }
      .last-commit-relative { font-size: 12px; color: var(--text-secondary); }
      .last-commit-absolute { font-size: 10px; color: var(--text-muted); }
      .last-commit-body { padding: 16px; }
      .last-commit-hash { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); margin-bottom: 8px; }
      .last-commit-message { font-size: 13px; color: var(--text-primary); line-height: 1.5; }

      .branch-recent-commits { margin-bottom: 24px; }
      .branch-commits-list { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
      .branch-commit-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
      .branch-commit-row:last-child { border-bottom: none; }
      .branch-commit-hash { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); flex-shrink: 0; }
      .branch-commit-message { flex: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .branch-commit-meta { display: flex; gap: 8px; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

      .branch-actions-footer { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border); }
      .btn-danger-outline { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
      .btn-danger-outline:hover { background: var(--danger); color: #fff; }
    </style>
  `;
}

function selectBranch(element, branchName) {
  // Update selection
  document.querySelectorAll('.branch-row').forEach(row => row.classList.remove('selected'));
  element.classList.add('selected');

  // Find branch data
  const branch = sampleData.branches.find(b => b.name === branchName);
  if (!branch) return;

  // Update detail panel
  const detailContent = document.getElementById('branch-detail-content');
  if (detailContent) {
    const recentCommitsHTML = branch.recentCommits.map(c => `
      <div class="branch-commit-row">
        <div class="branch-commit-hash">${c.hash}</div>
        <div class="branch-commit-message">${c.message}</div>
        <div class="branch-commit-meta">
          <span class="branch-commit-author">${c.author}</span>
          <span class="branch-commit-date">${c.date}</span>
        </div>
      </div>
    `).join('');

    detailContent.innerHTML = `
      <div class="branch-detail-header">
        <div class="branch-detail-icon ${branch.current ? 'current' : ''}">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
        </div>
        <div class="branch-detail-info">
          <div class="branch-detail-name">${branch.name}</div>
          <div class="branch-detail-tracking">${branch.remote || 'Local only'}</div>
        </div>
        ${branch.current ? '<span class="current-badge">HEAD</span>' : ''}
      </div>

      <div class="branch-sync-status">
        <div class="sync-item ${branch.ahead > 0 ? 'active' : ''}">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/></svg>
          <span>${branch.ahead} ahead</span>
        </div>
        <div class="sync-item ${branch.behind > 0 ? 'active' : ''}">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/></svg>
          <span>${branch.behind} behind</span>
        </div>
      </div>

      <div class="branch-last-commit">
        <div class="section-label">Last Commit</div>
        <div class="last-commit-card">
          <div class="last-commit-header">
            <div class="last-commit-avatar">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/></svg>
            </div>
            <div class="last-commit-author-info">
              <div class="last-commit-author">${branch.lastCommit.author}</div>
              <div class="last-commit-email">${branch.lastCommit.email}</div>
            </div>
            <div class="last-commit-date">
              <div class="last-commit-relative">${branch.lastCommit.date}</div>
              <div class="last-commit-absolute">${branch.lastCommit.dateAbsolute}</div>
            </div>
          </div>
          <div class="last-commit-body">
            <div class="last-commit-hash">${branch.lastCommit.hash}</div>
            <div class="last-commit-message">${branch.lastCommit.message}</div>
          </div>
        </div>
      </div>

      <div class="branch-recent-commits">
        <div class="section-label">Recent Commits</div>
        <div class="branch-commits-list">
          ${recentCommitsHTML}
        </div>
      </div>

      <div class="branch-actions-footer">
        <button class="btn btn-secondary">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>
          Rebase
        </button>
        <button class="btn btn-secondary">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/></svg>
          Rename
        </button>
        <button class="btn btn-danger-outline">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/></svg>
          Delete
        </button>
      </div>
    `;
  }
}

function checkoutBranch(branchName) {
  showToast('success', `Checked out branch: ${branchName}`);
}

function mergeBranch(branchName) {
  showToast('info', `Merging ${branchName} into current branch...`);
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
  document.querySelectorAll('.commit-row').forEach(row => row.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

function toggleFileDiff(element, fileId) {
  event.stopPropagation();
  const wasExpanded = element.classList.contains('expanded');

  // Collapse all and hide all diffs
  document.querySelectorAll('.unified-file').forEach(f => f.classList.remove('expanded'));
  document.querySelectorAll('.unified-file-diff').forEach(d => d.style.display = 'none');

  // Toggle expansion
  if (!wasExpanded) {
    element.classList.add('expanded');
    const diffPanel = element.nextElementSibling;
    if (diffPanel && diffPanel.classList.contains('unified-file-diff')) {
      diffPanel.style.display = 'block';
    }
  }
}

function togglePreviewDiff(element, fileId) {
  event.stopPropagation();
  const wasExpanded = element.classList.contains('expanded');

  // Collapse all and hide all diffs in the preview panel
  const container = element.closest('.preview-files-list');
  if (container) {
    container.querySelectorAll('.preview-file').forEach(f => f.classList.remove('expanded'));
    container.querySelectorAll('.preview-file-diff').forEach(d => d.style.display = 'none');
  }

  // Toggle expansion
  if (!wasExpanded) {
    element.classList.add('expanded');
    const diffPanel = document.getElementById(`preview-diff-${fileId}`);
    if (diffPanel) {
      diffPanel.style.display = 'block';
    }
  }
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
  const defaultCommit = commits[0];
  const commitRows = commits.map((c, i) => `
    <div class="cherry-commit-row ${i === 0 ? 'selected' : ''}" onclick="selectOperationCommit(this, '${c.hash}', 'cherry')" data-hash="${c.hash}">
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

  const filesPreview = getChangesPreviewHTML(defaultCommit, 'cherry');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Cherry-pick</h2>
          <span class="operation-desc">Apply specific commits to the current branch</span>
        </div>
      </div>
      <div class="operation-two-column">
        <div class="operation-left-panel">
          <div class="operation-panel">
            <div class="panel-header">
              <span class="panel-title">Select commits to apply</span>
              <div class="panel-actions">
                <input type="text" class="search-input" placeholder="Search commits...">
              </div>
            </div>
            <div class="cherry-commit-list">${commitRows}</div>
          </div>
          <div class="operation-options-inline">
            <h3>Cherry-pick Mode</h3>
            <div class="option-mode-selector">
              <label class="option-mode selected" onclick="selectOptionMode(this, 'cherry', 'normal')">
                <input type="radio" name="cherry-mode" value="normal" checked>
                <div class="mode-content">
                  <div class="mode-title">Normal (-x)</div>
                  <div class="mode-desc">Create commit with original info in message</div>
                </div>
              </label>
              <label class="option-mode" onclick="selectOptionMode(this, 'cherry', 'no-commit')">
                <input type="radio" name="cherry-mode" value="no-commit">
                <div class="mode-content">
                  <div class="mode-title">No Commit (--no-commit)</div>
                  <div class="mode-desc">Apply changes without creating a commit</div>
                </div>
              </label>
              <label class="option-mode" onclick="selectOptionMode(this, 'cherry', 'merge')">
                <input type="radio" name="cherry-mode" value="merge">
                <div class="mode-content">
                  <div class="mode-title">Allow Merge (-m)</div>
                  <div class="mode-desc">Allow cherry-picking merge commits</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="operation-right-panel" id="cherry-changes-panel">
          ${filesPreview}
        </div>
      </div>
      <div class="operation-footer">
        <div class="operation-summary" id="cherry-summary">
          <span class="summary-stat"><strong>1</strong> commit selected</span>
          <span class="summary-divider"></span>
          <span class="summary-stat additions">+${defaultCommit.changedFiles.reduce((a, f) => a + f.additions, 0)}</span>
          <span class="summary-stat deletions">-${defaultCommit.changedFiles.reduce((a, f) => a + f.deletions, 0)}</span>
          <span class="summary-divider"></span>
          <span class="summary-stat">${defaultCommit.changedFiles.length} files</span>
        </div>
        <button class="btn btn-primary" onclick="executeCherryPick()">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
          Execute Cherry-pick
        </button>
      </div>
    </div>
    ${getOperationStyles()}
  `;
}

function getChangesPreviewHTML(commit, type) {
  const colorClass = type === 'cherry' ? 'cherry' : type === 'revert' ? 'warning' : 'danger';
  const conflictFiles = commit.changedFiles.filter(f => f.conflict);
  const totalAdditions = commit.changedFiles.reduce((a, f) => a + f.additions, 0);
  const totalDeletions = commit.changedFiles.reduce((a, f) => a + f.deletions, 0);

  const filesHTML = commit.changedFiles.map((f, index) => {
    const statusIcon = f.status === 'A' ? '+' : f.status === 'D' ? '-' : '~';
    const statusClass = f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified';
    const fileId = f.path.replace(/[^a-zA-Z0-9]/g, '-');
    const isFirst = index === 0;
    return `
      <div class="preview-file ${f.conflict ? 'has-conflict' : ''} ${isFirst ? 'expanded' : ''}" onclick="togglePreviewDiff(this, '${fileId}')">
        <div class="preview-file-status ${statusClass}">${statusIcon}</div>
        <div class="preview-file-path">${f.path}</div>
        <div class="preview-file-stats">
          <span class="stat-add">+${f.additions}</span>
          <span class="stat-del">-${f.deletions}</span>
        </div>
        ${f.conflict ? '<div class="conflict-badge">Conflict</div>' : ''}
        <div class="preview-file-expand">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
        </div>
      </div>
      <div class="preview-file-diff" id="preview-diff-${fileId}" style="display: ${isFirst ? 'block' : 'none'};">
        <div class="diff-preview-content">
          <div class="diff-hunk">
            <div class="diff-hunk-header">@@ -1,${f.deletions} +1,${f.additions} @@ ${f.path.split('/').pop()}</div>
            ${f.status === 'A' ? `
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">1</span><span class="line-code">// New file: ${f.path.split('/').pop()}</span></div>
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">2</span><span class="line-code">// +${f.additions} lines added</span></div>
            ` : f.status === 'D' ? `
              <div class="diff-line del"><span class="line-num old">1</span><span class="line-num new"></span><span class="line-code">// Deleted file: ${f.path.split('/').pop()}</span></div>
              <div class="diff-line del"><span class="line-num old">2</span><span class="line-num new"></span><span class="line-code">// -${f.deletions} lines removed</span></div>
            ` : `
              <div class="diff-line context"><span class="line-num old">1</span><span class="line-num new">1</span><span class="line-code">// Modified file: ${f.path.split('/').pop()}</span></div>
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">2</span><span class="line-code">// +${f.additions} lines added</span></div>
              <div class="diff-line del"><span class="line-num old">2</span><span class="line-num new"></span><span class="line-code">// -${f.deletions} lines removed</span></div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="changes-preview">
      <div class="preview-header">
        <div class="preview-commit-info">
          <div class="preview-hash ${colorClass}">${commit.hash}</div>
          <div class="preview-message">${commit.message}</div>
          <div class="preview-author">${commit.author} · ${commit.date}</div>
        </div>
      </div>

      ${conflictFiles.length > 0 ? `
        <div class="conflict-warning">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
          <div class="conflict-text">
            <strong>${conflictFiles.length} potential conflict${conflictFiles.length > 1 ? 's' : ''}</strong>
            <span>${conflictFiles.map(f => f.path.split('/').pop()).join(', ')}</span>
          </div>
        </div>
      ` : ''}

      <div class="preview-section">
        <div class="section-header">
          <span class="section-title">Changed Files</span>
          <span class="section-count">${commit.changedFiles.length}</span>
        </div>
        <div class="preview-files-list">
          ${filesHTML}
        </div>
      </div>

      <div class="preview-stats-bar">
        <div class="stats-label">Impact</div>
        <div class="stats-visual">
          <div class="stats-bar">
            <div class="stats-bar-add" style="width: ${(totalAdditions / (totalAdditions + totalDeletions || 1)) * 100}%"></div>
            <div class="stats-bar-del" style="width: ${(totalDeletions / (totalAdditions + totalDeletions || 1)) * 100}%"></div>
          </div>
          <div class="stats-numbers">
            <span class="additions">+${totalAdditions}</span>
            <span class="deletions">-${totalDeletions}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getOperationStyles() {
  return `
    <style>
      .operation-two-column { display: grid; grid-template-columns: 1fr 1fr; flex: 1; min-height: 0; overflow: hidden; }
      .operation-left-panel { display: flex; flex-direction: column; border-right: 1px solid var(--border); overflow: hidden; padding: 20px; gap: 16px; min-height: 0; }
      .operation-right-panel { display: flex; flex-direction: column; overflow-y: auto; padding: 20px; background: var(--bg-secondary); min-height: 0; }
      .operation-panel { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; flex: 1; display: flex; flex-direction: column; min-height: 0; }

      .cherry-commit-list, .revert-commit-list, .reset-commit-list { flex: 1; overflow-y: auto; }
      .cherry-commit-row, .revert-commit-row, .reset-commit-row { display: flex; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .cherry-commit-row:hover, .revert-commit-row:hover, .reset-commit-row:hover { background: var(--bg-tertiary); }
      .cherry-commit-row.selected { background: var(--accent-dim); border-left: 3px solid #ec4899; }
      .revert-commit-row.selected { background: var(--warning-dim); border-left: 3px solid var(--warning); }
      .reset-commit-row.selected { background: var(--danger-dim); border-left: 3px solid var(--danger); }

      .cherry-checkbox, .revert-radio, .reset-radio { margin-right: 12px; padding-top: 2px; }
      .cherry-checkbox input, .revert-radio input, .reset-radio input { width: 1.15em; height: 1.15em; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .cherry-checkbox input::before, .revert-radio input::before, .reset-radio input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; }
      .cherry-checkbox input::before { background-color: #ec4899; }
      .revert-radio input::before { background-color: var(--warning); }
      .reset-radio input::before { background-color: var(--danger); }
      .cherry-checkbox input:checked, .revert-radio input:checked, .reset-radio input:checked { border-color: currentColor; }
      .cherry-checkbox input:checked { border-color: #ec4899; }
      .revert-radio input:checked { border-color: var(--warning); }
      .reset-radio input:checked { border-color: var(--danger); }
      .cherry-checkbox input:checked::before, .revert-radio input:checked::before, .reset-radio input:checked::before { transform: scale(1); }

      .cherry-graph, .revert-graph, .reset-graph { width: 24px; display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
      .graph-node.cherry { width: 12px; height: 12px; background: linear-gradient(135deg, #f472b6, #ec4899); border-radius: 50%; }
      .graph-node.revert { width: 12px; height: 12px; background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 50%; }
      .graph-node.reset { width: 12px; height: 12px; background: linear-gradient(135deg, #f87171, #ef4444); border-radius: 50%; }

      .cherry-info, .revert-info, .reset-info { flex: 1; min-width: 0; }
      .cherry-message, .revert-message, .reset-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cherry-meta, .revert-meta, .reset-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .cherry-hash { font-family: 'JetBrains Mono', monospace; color: #ec4899; }
      .revert-hash { font-family: 'JetBrains Mono', monospace; color: var(--warning); }
      .reset-hash { font-family: 'JetBrains Mono', monospace; color: var(--danger); }

      .operation-options-inline { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
      .operation-options-inline h3 { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

      .option-mode-selector { display: flex; flex-direction: column; gap: 8px; }
      .option-mode { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg-primary); border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
      .option-mode:hover { background: var(--bg-tertiary); }
      .option-mode.selected { border-color: var(--accent); }
      .option-mode input { display: none; }

      .changes-preview { display: flex; flex-direction: column; gap: 16px; }
      .preview-header { padding-bottom: 16px; border-bottom: 1px solid var(--border); }
      .preview-commit-info { display: flex; flex-direction: column; gap: 6px; }
      .preview-hash { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; }
      .preview-hash.cherry { color: #ec4899; }
      .preview-hash.warning { color: var(--warning); }
      .preview-hash.danger { color: var(--danger); }
      .preview-message { font-size: 15px; font-weight: 600; line-height: 1.4; }
      .preview-author { font-size: 12px; color: var(--text-muted); }

      .conflict-warning { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; }
      .conflict-warning svg { width: 20px; height: 20px; color: var(--danger); flex-shrink: 0; margin-top: 2px; }
      .conflict-text { display: flex; flex-direction: column; gap: 4px; }
      .conflict-text strong { font-size: 13px; color: var(--danger); }
      .conflict-text span { font-size: 12px; color: var(--text-muted); }

      .preview-section { display: flex; flex-direction: column; gap: 12px; }
      .section-header { display: flex; align-items: center; justify-content: space-between; }
      .section-title { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .section-count { background: var(--bg-tertiary); padding: 2px 8px; border-radius: 10px; font-size: 11px; color: var(--text-muted); }

      .preview-files-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg-primary); }
      .preview-file { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 12px; cursor: pointer; transition: background 0.15s; }
      .preview-file:hover { background: var(--bg-tertiary); }
      .preview-file.expanded { background: var(--accent-dim); }
      .preview-file.has-conflict { background: rgba(239, 68, 68, 0.05); }
      .preview-file.has-conflict:hover { background: rgba(239, 68, 68, 0.1); }
      .preview-file-status { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-weight: 700; font-size: 11px; flex-shrink: 0; }
      .preview-file-status.added { background: rgba(34, 197, 94, 0.2); color: var(--success); }
      .preview-file-status.deleted { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
      .preview-file-status.modified { background: rgba(59, 130, 246, 0.2); color: var(--accent); }
      .preview-file-path { flex: 1; font-family: 'JetBrains Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .preview-file-stats { display: flex; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
      .stat-add { color: var(--success); }
      .stat-del { color: var(--danger); }
      .conflict-badge { padding: 2px 8px; background: var(--danger); color: #fff; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; flex-shrink: 0; }
      .preview-file-expand { width: 16px; height: 16px; color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
      .preview-file-expand svg { width: 16px; height: 16px; }
      .preview-file.expanded .preview-file-expand { transform: rotate(180deg); color: var(--accent); }
      .preview-file-diff { border-bottom: 1px solid var(--border); background: var(--bg-secondary); overflow: hidden; animation: slideDown 0.2s ease; }
      .preview-file-diff .diff-preview-content { max-height: 200px; overflow-y: auto; }
      .preview-file-diff .diff-hunk { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
      .preview-file-diff .diff-hunk-header { padding: 6px 12px; background: var(--purple-dim); color: var(--purple); font-size: 10px; }
      .preview-file-diff .diff-line { display: flex; }
      .preview-file-diff .diff-line .line-num { width: 32px; padding: 2px 8px; text-align: right; color: var(--text-muted); background: var(--bg-tertiary); flex-shrink: 0; }
      .preview-file-diff .diff-line .line-code { flex: 1; padding: 2px 12px; white-space: pre; }
      .preview-file-diff .diff-line.add { background: rgba(34, 197, 94, 0.1); }
      .preview-file-diff .diff-line.add .line-code { color: var(--success); }
      .preview-file-diff .diff-line.del { background: rgba(239, 68, 68, 0.1); }
      .preview-file-diff .diff-line.del .line-code { color: var(--danger); }
      .preview-file-diff .diff-line.context .line-code { color: var(--text-secondary); }

      .preview-stats-bar { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 10px; }
      .stats-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
      .stats-visual { flex: 1; display: flex; align-items: center; gap: 16px; }
      .stats-bar { flex: 1; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; display: flex; }
      .stats-bar-add { background: linear-gradient(90deg, #22c55e, #16a34a); height: 100%; }
      .stats-bar-del { background: linear-gradient(90deg, #ef4444, #dc2626); height: 100%; }
      .stats-numbers { display: flex; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }
      .stats-numbers .additions { color: var(--success); }
      .stats-numbers .deletions { color: var(--danger); }

      .operation-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid var(--border); background: var(--bg-secondary); flex-shrink: 0; }
      .operation-summary { display: flex; align-items: center; gap: 12px; font-size: 13px; }
      .summary-stat { color: var(--text-secondary); }
      .summary-stat strong { color: var(--text-primary); }
      .summary-stat.additions { color: var(--success); font-family: 'JetBrains Mono', monospace; font-weight: 600; }
      .summary-stat.deletions { color: var(--danger); font-family: 'JetBrains Mono', monospace; font-weight: 600; }
      .summary-divider { width: 1px; height: 16px; background: var(--border); }

      .reset-mode-selector { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
      .reset-mode { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg-primary); border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
      .reset-mode:hover { background: var(--bg-tertiary); }
      .reset-mode.selected { border-color: var(--accent); }
      .reset-mode.hard.selected { border-color: var(--danger); }
      .reset-mode input { display: none; }
      .mode-content { flex: 1; }
      .mode-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
      .mode-desc { font-size: 11px; color: var(--text-muted); }
      .mode-desc.danger { color: var(--danger); }

      .btn-warning { background: var(--warning); color: #000; }
      .btn-warning:hover { background: #d97706; }
      .btn-danger { background: var(--danger); color: #fff; }
      .btn-danger:hover { background: #dc2626; }
    </style>
  `;
}

function selectOperationCommit(element, hash, type) {
  const commit = sampleData.commits.find(c => c.hash === hash);
  if (!commit) return;

  // Update selection
  const listClass = type === 'cherry' ? '.cherry-commit-row' : type === 'revert' ? '.revert-commit-row' : '.reset-commit-row';
  document.querySelectorAll(listClass).forEach(row => row.classList.remove('selected'));
  element.classList.add('selected');

  // Update radio/checkbox
  const input = element.querySelector('input');
  if (input) {
    if (input.type === 'radio') {
      input.checked = true;
    } else {
      input.checked = !input.checked;
    }
  }

  // Update preview panel
  const panelId = type === 'cherry' ? 'cherry-changes-panel' : type === 'revert' ? 'revert-changes-panel' : 'reset-changes-panel';
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.innerHTML = getChangesPreviewHTML(commit, type);
  }

  // Update summary
  const summaryId = type === 'cherry' ? 'cherry-summary' : type === 'revert' ? 'revert-summary' : 'reset-summary';
  const summary = document.getElementById(summaryId);
  if (summary) {
    const totalAdd = commit.changedFiles.reduce((a, f) => a + f.additions, 0);
    const totalDel = commit.changedFiles.reduce((a, f) => a + f.deletions, 0);
    summary.innerHTML = `
      <span class="summary-stat"><strong>1</strong> commit selected</span>
      <span class="summary-divider"></span>
      <span class="summary-stat additions">+${totalAdd}</span>
      <span class="summary-stat deletions">-${totalDel}</span>
      <span class="summary-divider"></span>
      <span class="summary-stat">${commit.changedFiles.length} files</span>
    `;
  }
}

function getRevertViewHTML() {
  const commits = sampleData.commits;
  const defaultCommit = commits[0];
  const commitRows = commits.map((c, i) => `
    <div class="revert-commit-row ${i === 0 ? 'selected' : ''}" onclick="selectOperationCommit(this, '${c.hash}', 'revert')" data-hash="${c.hash}">
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

  const filesPreview = getChangesPreviewHTML(defaultCommit, 'revert');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Revert</h2>
          <span class="operation-desc">Create a new commit that undoes changes</span>
        </div>
      </div>
      <div class="operation-two-column">
        <div class="operation-left-panel">
          <div class="operation-panel">
            <div class="panel-header">
              <span class="panel-title">Select commit to revert</span>
              <div class="panel-actions">
                <input type="text" class="search-input" placeholder="Search commits...">
              </div>
            </div>
            <div class="revert-commit-list">${commitRows}</div>
          </div>
          <div class="operation-options-inline">
            <h3>Revert Mode</h3>
            <div class="option-mode-selector">
              <label class="option-mode selected" onclick="selectOptionMode(this, 'revert', 'auto')">
                <input type="radio" name="revert-mode" value="auto" checked>
                <div class="mode-content">
                  <div class="mode-title">Auto Commit</div>
                  <div class="mode-desc">Automatically create a revert commit</div>
                </div>
              </label>
              <label class="option-mode" onclick="selectOptionMode(this, 'revert', 'no-commit')">
                <input type="radio" name="revert-mode" value="no-commit">
                <div class="mode-content">
                  <div class="mode-title">No Commit (--no-commit)</div>
                  <div class="mode-desc">Apply changes without creating a commit</div>
                </div>
              </label>
              <label class="option-mode" onclick="selectOptionMode(this, 'revert', 'edit')">
                <input type="radio" name="revert-mode" value="edit">
                <div class="mode-content">
                  <div class="mode-title">Edit Message (--edit)</div>
                  <div class="mode-desc">Edit the commit message before committing</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="operation-right-panel" id="revert-changes-panel">
          ${filesPreview}
        </div>
      </div>
      <div class="operation-footer">
        <div class="operation-summary" id="revert-summary">
          <span class="summary-stat"><strong>1</strong> commit selected</span>
          <span class="summary-divider"></span>
          <span class="summary-stat additions">+${defaultCommit.changedFiles.reduce((a, f) => a + f.additions, 0)}</span>
          <span class="summary-stat deletions">-${defaultCommit.changedFiles.reduce((a, f) => a + f.deletions, 0)}</span>
          <span class="summary-divider"></span>
          <span class="summary-stat">${defaultCommit.changedFiles.length} files</span>
        </div>
        <button class="btn btn-warning" onclick="executeRevert()">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/></svg>
          Execute Revert
        </button>
      </div>
    </div>
    ${getOperationStyles()}
  `;
}

function getResetViewHTML() {
  const commits = sampleData.commits;
  const defaultCommit = commits[0];
  const commitRows = commits.map((c, i) => `
    <div class="reset-commit-row ${i === 0 ? 'selected' : ''}" onclick="selectOperationCommit(this, '${c.hash}', 'reset')" data-hash="${c.hash}">
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

  const filesPreview = getChangesPreviewHTML(defaultCommit, 'reset');

  return `
    <div class="operation-layout">
      <div class="operation-header">
        <div class="operation-info">
          <h2 class="operation-title">Reset</h2>
          <span class="operation-desc">Move HEAD to specified commit</span>
        </div>
      </div>
      <div class="operation-two-column">
        <div class="operation-left-panel">
          <div class="operation-panel">
            <div class="panel-header">
              <span class="panel-title">Select target commit for reset</span>
              <div class="panel-actions">
                <input type="text" class="search-input" placeholder="Search commits...">
              </div>
            </div>
            <div class="reset-commit-list">${commitRows}</div>
          </div>
          <div class="operation-options-inline">
            <h3>Reset Mode</h3>
            <div class="reset-mode-selector">
              <label class="reset-mode soft" onclick="selectResetMode(this, 'soft')">
                <input type="radio" name="reset-mode" value="soft">
                <div class="mode-content">
                  <div class="mode-title">--soft</div>
                  <div class="mode-desc">Only move HEAD. Changes remain staged</div>
                </div>
              </label>
              <label class="reset-mode mixed selected" onclick="selectResetMode(this, 'mixed')">
                <input type="radio" name="reset-mode" value="mixed" checked>
                <div class="mode-content">
                  <div class="mode-title">--mixed (default)</div>
                  <div class="mode-desc">Reset HEAD and index. Changes remain in working tree</div>
                </div>
              </label>
              <label class="reset-mode hard" onclick="selectResetMode(this, 'hard')">
                <input type="radio" name="reset-mode" value="hard">
                <div class="mode-content">
                  <div class="mode-title">--hard</div>
                  <div class="mode-desc danger">Reset everything. Changes will be lost</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="operation-right-panel" id="reset-changes-panel">
          ${filesPreview}
        </div>
      </div>
      <div class="operation-footer">
        <div class="operation-summary" id="reset-summary">
          <span class="summary-stat"><strong>1</strong> commit selected</span>
          <span class="summary-divider"></span>
          <span class="summary-stat additions">+${defaultCommit.changedFiles.reduce((a, f) => a + f.additions, 0)}</span>
          <span class="summary-stat deletions">-${defaultCommit.changedFiles.reduce((a, f) => a + f.deletions, 0)}</span>
          <span class="summary-divider"></span>
          <span class="summary-stat">${defaultCommit.changedFiles.length} files</span>
        </div>
        <button class="btn btn-danger" onclick="executeReset()">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>
          Execute Reset
        </button>
      </div>
    </div>
    ${getOperationStyles()}
  `;
}

function selectResetMode(element, mode) {
  document.querySelectorAll('.reset-mode').forEach(m => m.classList.remove('selected'));
  element.classList.add('selected');
  element.querySelector('input').checked = true;
}

function selectOptionMode(element, type, mode) {
  const container = element.closest('.option-mode-selector');
  container.querySelectorAll('.option-mode').forEach(m => m.classList.remove('selected'));
  element.classList.add('selected');
  element.querySelector('input').checked = true;
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
        <div class="submodule-icon">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 1a.5.5 0 0 1 .5.5v.5h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2v-.5a.5.5 0 0 1 .5-.5zM5 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5z"/><path d="M6 7a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 7zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9z"/></svg>
        </div>
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
      .submodule-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--accent-dim); border-radius: 8px; color: var(--accent); }
      .submodule-icon svg { width: 18px; height: 18px; }
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
        <div class="worktree-icon ${w.isMain ? 'main' : ''}">
          ${w.isMain
            ? '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146z"/></svg>'
            : '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10z"/></svg>'
          }
        </div>
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
      .worktree-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-radius: 8px; color: var(--text-muted); }
      .worktree-icon.main { background: var(--accent-dim); color: var(--accent); }
      .worktree-icon svg { width: 18px; height: 18px; }
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

// ===== Stash View =====

function getStashViewHTML() {
  const stashes = sampleData.stashes;
  const firstStash = stashes[0];

  const stashList = stashes.map((stash, index) => `
    <div class="stash-row ${index === 0 ? 'selected' : ''}" onclick="selectStash(this, ${stash.index})">
      <div class="stash-radio">
        <input type="radio" name="stash-select" ${index === 0 ? 'checked' : ''} data-index="${stash.index}">
      </div>
      <div class="stash-graph">
        <div class="graph-node stash"></div>
      </div>
      <div class="stash-info">
        <div class="stash-message">${stash.message}</div>
        <div class="stash-meta">
          <span class="stash-index-label">stash@{${stash.index}}</span>
          <span>${stash.branch}</span>
          <span>${stash.date}</span>
          <span>${stash.files.length} files</span>
        </div>
      </div>
    </div>
  `).join('');

  const getStashFilesHTML = (files, stashIndex) => files.map((file, idx) => {
    const statusIcon = file.status === 'A' ? '+' : file.status === 'D' ? '-' : '~';
    const statusClass = file.status === 'A' ? 'added' : file.status === 'D' ? 'deleted' : 'modified';
    const fileId = `stash-file-${stashIndex}-${idx}`;
    const isFirst = idx === 0;

    return `
      <div class="preview-file ${isFirst ? 'expanded' : ''}" onclick="togglePreviewDiff(this, '${fileId}')">
        <div class="preview-file-status ${statusClass}">${statusIcon}</div>
        <div class="preview-file-path">${file.path}</div>
        <div class="preview-file-stats">
          <span class="stat-add">+${file.additions}</span>
          <span class="stat-del">-${file.deletions}</span>
        </div>
        <div class="preview-file-expand">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
        </div>
      </div>
      <div class="preview-file-diff" id="preview-diff-${fileId}" style="display: ${isFirst ? 'block' : 'none'};">
        <div class="diff-preview-content">
          <div class="diff-hunk">
            <div class="diff-hunk-header">@@ -1,${file.deletions} +1,${file.additions} @@ ${file.path.split('/').pop()}</div>
            ${file.status === 'A' ? `
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">1</span><span class="line-code">// New file: ${file.path.split('/').pop()}</span></div>
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">2</span><span class="line-code">// +${file.additions} lines added</span></div>
            ` : `
              <div class="diff-line context"><span class="line-num old">1</span><span class="line-num new">1</span><span class="line-code">package ${file.path.split('/')[1] || 'main'}</span></div>
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">2</span><span class="line-code">// Stashed changes</span></div>
              <div class="diff-line del"><span class="line-num old">2</span><span class="line-num new"></span><span class="line-code">// Previous version</span></div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const firstStashFiles = getStashFilesHTML(firstStash.files, 0);
  const totalAdditions = firstStash.files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = firstStash.files.reduce((sum, f) => sum + f.deletions, 0);

  return `
    <div class="operation-header" style="flex-shrink: 0;">
      <h2>Stash</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="createStash()">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
          Stash Changes
        </button>
      </div>
    </div>

    <div class="operation-two-column">
      <div class="operation-left-panel">
        <div class="operation-panel">
          <div class="stash-list">
            ${stashList}
          </div>
        </div>
      </div>

      <div class="operation-right-panel" id="stash-preview-panel">
        <div class="changes-preview">
          <div class="preview-header">
            <div class="preview-commit-info">
              <div class="preview-hash stash" id="stash-preview-index">stash@{0}</div>
              <div class="preview-message" id="stash-preview-message">${firstStash.message}</div>
              <div class="preview-author" id="stash-preview-meta">${firstStash.branch} · ${firstStash.dateAbsolute}</div>
            </div>
          </div>

          <div class="preview-section">
            <div class="section-header">
              <span class="section-title">Changed Files</span>
              <span class="section-count" id="stash-file-count">${firstStash.files.length}</span>
            </div>
            <div class="preview-files-list" id="stash-files-list">
              ${firstStashFiles}
            </div>
          </div>

          <div class="preview-stats-bar">
            <div class="stats-label">Impact</div>
            <div class="stats-visual">
              <div class="stats-bar">
                <div class="stats-bar-add" id="stash-bar-add" style="width: ${(totalAdditions / (totalAdditions + totalDeletions || 1)) * 100}%"></div>
                <div class="stats-bar-del" id="stash-bar-del" style="width: ${(totalDeletions / (totalAdditions + totalDeletions || 1)) * 100}%"></div>
              </div>
              <div class="stats-numbers">
                <span class="additions" id="stash-additions">+${totalAdditions}</span>
                <span class="deletions" id="stash-deletions">-${totalDeletions}</span>
              </div>
            </div>
          </div>

          <div class="stash-actions">
            <button class="btn btn-primary" id="stash-apply-btn" onclick="applyStash(0)">Apply</button>
            <button class="btn btn-secondary" id="stash-pop-btn" onclick="popStash(0)">Pop</button>
            <button class="btn btn-danger" id="stash-drop-btn" onclick="dropStash(0)">Drop</button>
          </div>
        </div>
      </div>
    </div>

    ${getOperationStyles()}
    <style>
      .stash-list { flex: 1; overflow-y: auto; }
      .stash-row { display: flex; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
      .stash-row:hover { background: var(--bg-tertiary); }
      .stash-row.selected { background: var(--accent-dim); border-left: 3px solid var(--accent); }

      .stash-radio { margin-right: 12px; padding-top: 2px; }
      .stash-radio input { width: 1.15em; height: 1.15em; appearance: none; -webkit-appearance: none; border-radius: 50%; border: 0.1em solid #6b6b76; background: transparent; cursor: pointer; display: grid; place-content: center; }
      .stash-radio input::before { content: ""; width: 0.65em; height: 0.65em; border-radius: 50%; transform: scale(0); transition: 120ms transform ease-in-out; background-color: var(--accent); }
      .stash-radio input:checked { border-color: var(--accent); }
      .stash-radio input:checked::before { transform: scale(1); }

      .stash-graph { width: 24px; display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
      .graph-node.stash { width: 12px; height: 12px; background: linear-gradient(135deg, #60a5fa, #3b82f6); border-radius: 50%; }

      .stash-info { flex: 1; min-width: 0; }
      .stash-message { font-size: 13px; font-weight: 500; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .stash-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
      .stash-index-label { font-family: 'JetBrains Mono', monospace; color: var(--accent); }

      .preview-hash.stash { color: var(--accent); }
      .stash-actions { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border); margin-top: 16px; }
    </style>
  `;
}

function selectStash(element, index) {
  document.querySelectorAll('.stash-row').forEach(r => {
    r.classList.remove('selected');
    r.querySelector('input').checked = false;
  });
  element.classList.add('selected');
  element.querySelector('input').checked = true;

  const stash = sampleData.stashes.find(s => s.index === index);
  if (!stash) return;

  // Update preview header
  document.getElementById('stash-preview-index').textContent = `stash@{${index}}`;
  document.getElementById('stash-preview-message').textContent = stash.message;
  document.getElementById('stash-preview-meta').textContent = `${stash.branch} · ${stash.dateAbsolute}`;

  // Update files list
  const totalAdditions = stash.files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = stash.files.reduce((sum, f) => sum + f.deletions, 0);

  document.getElementById('stash-file-count').textContent = stash.files.length;
  document.getElementById('stash-additions').textContent = `+${totalAdditions}`;
  document.getElementById('stash-deletions').textContent = `-${totalDeletions}`;

  const total = totalAdditions + totalDeletions || 1;
  document.getElementById('stash-bar-add').style.width = `${(totalAdditions / total) * 100}%`;
  document.getElementById('stash-bar-del').style.width = `${(totalDeletions / total) * 100}%`;

  const filesList = document.getElementById('stash-files-list');
  filesList.innerHTML = stash.files.map((file, idx) => {
    const statusIcon = file.status === 'A' ? '+' : file.status === 'D' ? '-' : '~';
    const statusClass = file.status === 'A' ? 'added' : file.status === 'D' ? 'deleted' : 'modified';
    const fileId = `stash-file-${index}-${idx}`;
    const isFirst = idx === 0;

    return `
      <div class="preview-file ${isFirst ? 'expanded' : ''}" onclick="togglePreviewDiff(this, '${fileId}')">
        <div class="preview-file-status ${statusClass}">${statusIcon}</div>
        <div class="preview-file-path">${file.path}</div>
        <div class="preview-file-stats">
          <span class="stat-add">+${file.additions}</span>
          <span class="stat-del">-${file.deletions}</span>
        </div>
        <div class="preview-file-expand">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/></svg>
        </div>
      </div>
      <div class="preview-file-diff" id="preview-diff-${fileId}" style="display: ${isFirst ? 'block' : 'none'};">
        <div class="diff-preview-content">
          <div class="diff-hunk">
            <div class="diff-hunk-header">@@ -1,${file.deletions} +1,${file.additions} @@ ${file.path.split('/').pop()}</div>
            ${file.status === 'A' ? `
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">1</span><span class="line-code">// New file: ${file.path.split('/').pop()}</span></div>
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">2</span><span class="line-code">// +${file.additions} lines added</span></div>
            ` : `
              <div class="diff-line context"><span class="line-num old">1</span><span class="line-num new">1</span><span class="line-code">package ${file.path.split('/')[1] || 'main'}</span></div>
              <div class="diff-line add"><span class="line-num old"></span><span class="line-num new">2</span><span class="line-code">// Stashed changes</span></div>
              <div class="diff-line del"><span class="line-num old">2</span><span class="line-num new"></span><span class="line-code">// Previous version</span></div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update action buttons
  document.getElementById('stash-apply-btn').setAttribute('onclick', `applyStash(${index})`);
  document.getElementById('stash-pop-btn').setAttribute('onclick', `popStash(${index})`);
  document.getElementById('stash-drop-btn').setAttribute('onclick', `dropStash(${index})`);
}

function createStash() {
  const message = prompt('Stash message (optional):');
  showToast('success', message ? `Stashed: ${message}` : 'Changes stashed');
}

function applyStash(index) {
  showToast('success', `Applied stash@{${index}}`);
}

function popStash(index) {
  showToast('success', `Popped stash@{${index}}`);
}

function dropStash(index) {
  showToast('warning', `Dropped stash@{${index}}`);
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
