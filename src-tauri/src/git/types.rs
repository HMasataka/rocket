use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileStatusKind {
    Untracked,
    Modified,
    Deleted,
    Renamed,
    Typechange,
    Conflicted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StagingState {
    Unstaged,
    Staged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStatus {
    pub path: String,
    pub kind: FileStatusKind,
    pub staging: StagingState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoStatus {
    pub files: Vec<FileStatus>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DiffLineKind {
    Context,
    Addition,
    Deletion,
    FileHeader,
    HunkHeader,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordSegment {
    pub text: String,
    pub highlighted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffLine {
    pub kind: DiffLineKind,
    pub content: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
    pub word_diff: Option<Vec<WordSegment>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffHunk {
    pub header: String,
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HunkIdentifier {
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineRange {
    pub hunk: HunkIdentifier,
    pub line_indices: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDiff {
    pub old_path: Option<String>,
    pub new_path: Option<String>,
    pub hunks: Vec<DiffHunk>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffOptions {
    pub context_lines: u32,
    pub staged: bool,
}

impl Default for DiffOptions {
    fn default() -> Self {
        Self {
            context_lines: 3,
            staged: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitResult {
    pub oid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchInfo {
    pub name: String,
    pub is_head: bool,
    pub is_remote: bool,
    pub remote_name: Option<String>,
    pub upstream: Option<String>,
    pub ahead_count: u32,
    pub behind_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteInfo {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchResult {
    pub remote_name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PullOption {
    Merge,
    Rebase,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushResult {
    pub remote_name: String,
    pub branch: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MergeKind {
    FastForward,
    Normal,
    Rebase,
    UpToDate,
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeResult {
    pub kind: MergeKind,
    pub oid: Option<String>,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MergeOption {
    Default,
    FastForwardOnly,
    NoFastForward,
}

// === History / Log types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub oid: String,
    pub short_oid: String,
    pub message: String,
    pub body: String,
    pub author_name: String,
    pub author_email: String,
    pub author_date: i64,
    pub parent_oids: Vec<String>,
    pub refs: Vec<CommitRef>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitRef {
    pub name: String,
    pub kind: CommitRefKind,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommitRefKind {
    Head,
    LocalBranch,
    RemoteBranch,
    Tag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitGraphRow {
    pub oid: String,
    pub column: usize,
    pub node_type: GraphNodeType,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GraphNodeType {
    Normal,
    Merge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub from_column: usize,
    pub to_column: usize,
    pub color_index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitDetail {
    pub info: CommitInfo,
    pub files: Vec<CommitFileChange>,
    pub stats: CommitStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitFileChange {
    pub path: String,
    pub status: CommitFileStatus,
    pub additions: u32,
    pub deletions: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommitFileStatus {
    Added,
    Modified,
    Deleted,
    Renamed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitStats {
    pub additions: u32,
    pub deletions: u32,
    pub files_changed: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlameResult {
    pub path: String,
    pub lines: Vec<BlameLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlameLine {
    pub line_number: u32,
    pub content: String,
    pub commit_oid: String,
    pub commit_short_oid: String,
    pub author_name: String,
    pub author_date: i64,
    pub is_block_start: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFilter {
    pub author: Option<String>,
    pub since: Option<i64>,
    pub until: Option<i64>,
    pub message: Option<String>,
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitLogResult {
    pub commits: Vec<CommitInfo>,
    pub graph: Vec<CommitGraphRow>,
}

// === Stash types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StashEntry {
    pub index: usize,
    pub message: String,
    pub branch_name: String,
    pub author_date: i64,
}

// === Conflict types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictFile {
    pub path: String,
    pub conflict_count: usize,
    pub conflicts: Vec<ConflictBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictBlock {
    pub ours: String,
    pub base: Option<String>,
    pub theirs: String,
    pub start_line: u32,
    pub end_line: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "content")]
pub enum ConflictResolution {
    Ours,
    Theirs,
    Both,
    Manual(String),
}

// === Tag types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagInfo {
    pub name: String,
    pub target_oid: String,
    pub target_short_oid: String,
    pub is_annotated: bool,
    pub tagger_name: Option<String>,
    pub tagger_date: Option<i64>,
    pub message: Option<String>,
}

// === Rebase types ===

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RebaseAction {
    Pick,
    Reword,
    Edit,
    Squash,
    Fixup,
    Drop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RebaseTodoEntry {
    pub action: RebaseAction,
    pub oid: String,
    pub short_oid: String,
    pub message: String,
    pub author_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RebaseState {
    pub onto_branch: String,
    pub onto_oid: String,
    pub current_step: usize,
    pub total_steps: usize,
    pub has_conflicts: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RebaseResult {
    pub completed: bool,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeBaseContent {
    pub path: String,
    pub base_content: Option<String>,
    pub ours_content: String,
    pub theirs_content: String,
}

// === Cherry-pick types ===

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CherryPickMode {
    Normal,
    NoCommit,
    Merge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CherryPickResult {
    pub completed: bool,
    pub conflicts: Vec<String>,
    pub oid: Option<String>,
}

// === Revert types ===

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RevertMode {
    Auto,
    NoCommit,
    Edit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevertResult {
    pub completed: bool,
    pub conflicts: Vec<String>,
    pub oid: Option<String>,
}
