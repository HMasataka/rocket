use thiserror::Error;

#[derive(Debug, Error)]
pub enum GitError {
    #[error("repository not found: {path}")]
    RepositoryNotFound { path: String },

    #[error("failed to open repository: {0}")]
    OpenFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to get status: {0}")]
    StatusFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to get diff: {0}")]
    DiffFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to stage file: {0}")]
    StageFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to unstage file: {0}")]
    UnstageFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to commit: {0}")]
    CommitFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to get current branch: {0}")]
    BranchNotFound(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to read config: {0}")]
    ConfigReadFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to write config: {0}")]
    ConfigWriteFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to list branches: {0}")]
    BranchListFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to create branch: {0}")]
    BranchCreateFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to checkout branch: {0}")]
    CheckoutFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to delete branch: {0}")]
    BranchDeleteFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to rename branch: {0}")]
    BranchRenameFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to merge branch: {0}")]
    MergeFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to fetch: {0}")]
    FetchFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to pull: {0}")]
    PullFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to push: {0}")]
    PushFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to manage remote: {0}")]
    RemoteFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("authentication failed: {0}")]
    AuthFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to get commit log: {0}")]
    LogFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("commit not found: {oid}")]
    CommitNotFound { oid: String },

    #[error("failed to get blame: {0}")]
    BlameFailed(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("failed to discard changes: {0}")]
    DiscardFailed(#[source] Box<dyn std::error::Error + Send + Sync>),
}

pub type GitResult<T> = Result<T, GitError>;
