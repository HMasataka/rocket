pub mod ai;
pub mod branch;
pub mod cherry_pick;
pub mod config;
pub mod conflict;
pub mod git;
pub mod gitconfig;
pub mod gitignore;
pub mod history;
pub mod hosting;
pub mod rebase;
pub mod remote;
pub mod repo;
pub mod reset;
pub mod revert;
pub mod search;
pub mod stash;
pub mod submodule;
pub mod tab;
pub mod tag;
pub mod worktree;

use crate::git::backend::GitBackend;
use crate::state::AppState;

pub fn with_repo<F, R>(state: &AppState, tab_id: &str, f: F) -> Result<R, String>
where
    F: FnOnce(&dyn GitBackend) -> Result<R, String>,
{
    let tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let ctx = tabs
        .get(tab_id)
        .ok_or("No repository opened for this tab")?;
    f(ctx.backend.as_ref())
}
