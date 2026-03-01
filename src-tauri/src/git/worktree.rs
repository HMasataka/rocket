use std::path::Path;
use std::process::Command;

use crate::git::error::{GitError, GitResult};
use crate::git::types::WorktreeInfo;

pub fn list_worktrees(workdir: &Path) -> GitResult<Vec<WorktreeInfo>> {
    let output = Command::new("git")
        .current_dir(workdir)
        .args(["worktree", "list", "--porcelain"])
        .output()
        .map_err(|e| GitError::WorktreeFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::WorktreeFailed(stderr.to_string().into()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut worktrees = parse_worktree_list(&stdout);

    for wt in &mut worktrees {
        wt.is_clean = check_worktree_clean(&wt.path);
    }

    Ok(worktrees)
}

pub fn add_worktree(workdir: &Path, path: &str, branch: &str) -> GitResult<()> {
    let output = Command::new("git")
        .current_dir(workdir)
        .args(["worktree", "add", path, branch])
        .output()
        .map_err(|e| GitError::WorktreeFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::WorktreeFailed(stderr.to_string().into()));
    }

    Ok(())
}

pub fn remove_worktree(workdir: &Path, path: &str) -> GitResult<()> {
    let output = Command::new("git")
        .current_dir(workdir)
        .args(["worktree", "remove", path])
        .output()
        .map_err(|e| GitError::WorktreeFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::WorktreeFailed(stderr.to_string().into()));
    }

    Ok(())
}

fn check_worktree_clean(worktree_path: &str) -> bool {
    let output = Command::new("git")
        .args(["-C", worktree_path, "status", "--porcelain"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            String::from_utf8_lossy(&o.stdout).trim().is_empty()
        }
        _ => false,
    }
}

/// Parse `git worktree list --porcelain` output.
/// Each worktree block is separated by a blank line.
/// Fields: worktree <path>, HEAD <sha>, branch refs/heads/<name>, bare/detached
fn parse_worktree_list(output: &str) -> Vec<WorktreeInfo> {
    let mut worktrees = Vec::new();
    let mut path = String::new();
    let mut head_oid: Option<String> = None;
    let mut branch: Option<String> = None;
    let mut is_bare = false;

    for line in output.lines() {
        if line.is_empty() {
            if !path.is_empty() {
                let is_main = worktrees.is_empty();
                let head_short_oid = head_oid
                    .as_ref()
                    .map(|oid| if oid.len() >= 7 { &oid[..7] } else { oid })
                    .map(|s| s.to_string());

                if !is_bare {
                    worktrees.push(WorktreeInfo {
                        path: path.clone(),
                        branch: branch.clone(),
                        head_oid: head_oid.clone(),
                        head_short_oid,
                        is_main,
                        is_clean: true,
                    });
                }

                path.clear();
                head_oid = None;
                branch = None;
                is_bare = false;
            }
            continue;
        }

        if let Some(val) = line.strip_prefix("worktree ") {
            path = val.to_string();
        } else if let Some(val) = line.strip_prefix("HEAD ") {
            head_oid = Some(val.to_string());
        } else if let Some(val) = line.strip_prefix("branch ") {
            branch = Some(strip_refs_prefix(val).to_string());
        } else if line == "bare" {
            is_bare = true;
        }
    }

    // Handle last block without trailing newline
    if !path.is_empty() && !is_bare {
        let is_main = worktrees.is_empty();
        let head_short_oid = head_oid
            .as_ref()
            .map(|oid| if oid.len() >= 7 { &oid[..7] } else { oid })
            .map(|s| s.to_string());

        worktrees.push(WorktreeInfo {
            path,
            branch,
            head_oid,
            head_short_oid,
            is_main,
            is_clean: true,
        });
    }

    worktrees
}

fn strip_refs_prefix(refname: &str) -> &str {
    refname
        .strip_prefix("refs/heads/")
        .unwrap_or(refname)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_worktree_list_single_main() {
        let output = "worktree /Users/dev/rocket\nHEAD abc1234567890\nbranch refs/heads/main\n\n";
        let result = parse_worktree_list(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "/Users/dev/rocket");
        assert_eq!(result[0].branch.as_deref(), Some("main"));
        assert_eq!(result[0].head_oid.as_deref(), Some("abc1234567890"));
        assert_eq!(result[0].head_short_oid.as_deref(), Some("abc1234"));
        assert!(result[0].is_main);
        assert!(result[0].is_clean);
    }

    #[test]
    fn parse_worktree_list_multiple() {
        let output = "\
worktree /Users/dev/rocket
HEAD abc1234567890
branch refs/heads/main

worktree /Users/dev/rocket-feature
HEAD def5678901234
branch refs/heads/feature/auth

";
        let result = parse_worktree_list(output);

        assert_eq!(result.len(), 2);
        assert!(result[0].is_main);
        assert!(!result[1].is_main);
        assert_eq!(result[1].path, "/Users/dev/rocket-feature");
        assert_eq!(result[1].branch.as_deref(), Some("feature/auth"));
    }

    #[test]
    fn parse_worktree_list_detached_head() {
        let output = "worktree /Users/dev/rocket\nHEAD abc1234567890\nbranch refs/heads/main\n\nworktree /Users/dev/rocket-detached\nHEAD fff0000111122\ndetached\n\n";
        let result = parse_worktree_list(output);

        assert_eq!(result.len(), 2);
        assert!(result[1].branch.is_none());
    }

    #[test]
    fn parse_worktree_list_bare_skipped() {
        let output = "worktree /Users/dev/rocket.git\nbare\n\nworktree /Users/dev/rocket-wt\nHEAD abc1234567890\nbranch refs/heads/main\n\n";
        let result = parse_worktree_list(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "/Users/dev/rocket-wt");
        assert!(result[0].is_main);
    }

    #[test]
    fn parse_worktree_list_empty() {
        let result = parse_worktree_list("");
        assert!(result.is_empty());
    }

    #[test]
    fn parse_worktree_list_no_trailing_newline() {
        let output = "worktree /Users/dev/rocket\nHEAD abc1234567890\nbranch refs/heads/main";
        let result = parse_worktree_list(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "/Users/dev/rocket");
    }

    #[test]
    fn strip_refs_prefix_removes_heads() {
        assert_eq!(strip_refs_prefix("refs/heads/main"), "main");
    }

    #[test]
    fn strip_refs_prefix_preserves_other() {
        assert_eq!(strip_refs_prefix("refs/tags/v1.0"), "refs/tags/v1.0");
    }

    #[test]
    fn strip_refs_prefix_preserves_plain() {
        assert_eq!(strip_refs_prefix("main"), "main");
    }
}
