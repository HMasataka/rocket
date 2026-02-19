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

    #[error("HEAD not found")]
    HeadNotFound,
}

pub type GitResult<T> = Result<T, GitError>;
