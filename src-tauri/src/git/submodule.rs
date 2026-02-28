use std::path::Path;
use std::process::Command;

use crate::git::error::{GitError, GitResult};
use crate::git::types::{SubmoduleInfo, SubmoduleStatus};

pub fn list_submodules(workdir: &Path) -> GitResult<Vec<SubmoduleInfo>> {
    let status_output = Command::new("git")
        .current_dir(workdir)
        .args(["submodule", "status"])
        .output()
        .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;

    if !status_output.status.success() {
        let stderr = String::from_utf8_lossy(&status_output.stderr);
        return Err(GitError::SubmoduleFailed(stderr.to_string().into()));
    }

    let status_stdout = String::from_utf8_lossy(&status_output.stdout);
    let mut submodules = parse_submodule_status(&status_stdout);

    let gitmodules = read_gitmodules(workdir);
    enrich_from_gitmodules(&mut submodules, &gitmodules);

    Ok(submodules)
}

pub fn add_submodule(workdir: &Path, url: &str, path: &str) -> GitResult<()> {
    let output = Command::new("git")
        .current_dir(workdir)
        .args(["submodule", "add", url, path])
        .output()
        .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::SubmoduleFailed(stderr.to_string().into()));
    }

    Ok(())
}

pub fn update_submodule(workdir: &Path, path: &str) -> GitResult<()> {
    let output = Command::new("git")
        .current_dir(workdir)
        .args(["submodule", "update", "--remote", path])
        .output()
        .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::SubmoduleFailed(stderr.to_string().into()));
    }

    Ok(())
}

pub fn update_all_submodules(workdir: &Path) -> GitResult<()> {
    let output = Command::new("git")
        .current_dir(workdir)
        .args(["submodule", "update", "--remote"])
        .output()
        .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::SubmoduleFailed(stderr.to_string().into()));
    }

    Ok(())
}

pub fn remove_submodule(workdir: &Path, path: &str) -> GitResult<()> {
    let deinit = Command::new("git")
        .current_dir(workdir)
        .args(["submodule", "deinit", "-f", path])
        .output()
        .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;

    if !deinit.status.success() {
        let stderr = String::from_utf8_lossy(&deinit.stderr);
        return Err(GitError::SubmoduleFailed(stderr.to_string().into()));
    }

    let rm = Command::new("git")
        .current_dir(workdir)
        .args(["rm", "-f", path])
        .output()
        .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;

    if !rm.status.success() {
        let stderr = String::from_utf8_lossy(&rm.stderr);
        return Err(GitError::SubmoduleFailed(stderr.to_string().into()));
    }

    let modules_path = workdir.join(".git").join("modules").join(path);
    if modules_path.exists() {
        std::fs::remove_dir_all(&modules_path)
            .map_err(|e| GitError::SubmoduleFailed(Box::new(e)))?;
    }

    Ok(())
}

/// Parse `git submodule status` output.
/// Each line format: `[ +-U]<sha1> <path> (<describe>)`
/// Prefix: ' ' = up-to-date, '+' = modified, '-' = uninitialized
fn parse_submodule_status(output: &str) -> Vec<SubmoduleInfo> {
    output
        .lines()
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return None;
            }

            let (status, rest) = parse_status_prefix(trimmed);
            let parts: Vec<&str> = rest.splitn(2, ' ').collect();
            if parts.is_empty() {
                return None;
            }

            let oid = parts[0].to_string();
            let short_oid = if oid.len() >= 7 {
                oid[..7].to_string()
            } else {
                oid.clone()
            };

            let path = if parts.len() > 1 {
                // Path may be followed by a describe in parentheses
                parts[1].split(' ').next().unwrap_or(parts[1]).to_string()
            } else {
                return None;
            };

            let (head_oid, head_short_oid) = if status == SubmoduleStatus::Uninitialized {
                (None, None)
            } else {
                (Some(oid), Some(short_oid))
            };

            Some(SubmoduleInfo {
                path,
                url: String::new(),
                branch: None,
                head_oid,
                head_short_oid,
                status,
            })
        })
        .collect()
}

fn parse_status_prefix(line: &str) -> (SubmoduleStatus, &str) {
    match line.as_bytes().first() {
        Some(b'+') => (SubmoduleStatus::Modified, &line[1..]),
        Some(b'-') => (SubmoduleStatus::Uninitialized, &line[1..]),
        Some(b'U') => (SubmoduleStatus::Conflict, &line[1..]),
        Some(b' ') => (SubmoduleStatus::UpToDate, &line[1..]),
        _ => (SubmoduleStatus::UpToDate, line),
    }
}

fn read_gitmodules(workdir: &Path) -> String {
    let gitmodules_path = workdir.join(".gitmodules");
    std::fs::read_to_string(gitmodules_path).unwrap_or_default()
}

fn enrich_from_gitmodules(submodules: &mut [SubmoduleInfo], gitmodules: &str) {
    let sections = parse_gitmodules(gitmodules);
    for sub in submodules.iter_mut() {
        if let Some(section) = sections.iter().find(|s| s.path == sub.path) {
            sub.url.clone_from(&section.url);
            sub.branch.clone_from(&section.branch);
        }
    }
}

struct GitmoduleSection {
    path: String,
    url: String,
    branch: Option<String>,
}

fn parse_gitmodules(content: &str) -> Vec<GitmoduleSection> {
    let mut sections = Vec::new();
    let mut current_path = String::new();
    let mut current_url = String::new();
    let mut current_branch: Option<String> = None;
    let mut in_section = false;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("[submodule ") {
            if in_section && !current_path.is_empty() {
                sections.push(GitmoduleSection {
                    path: current_path.clone(),
                    url: current_url.clone(),
                    branch: current_branch.clone(),
                });
            }
            current_path.clear();
            current_url.clear();
            current_branch = None;
            in_section = true;
        } else if in_section {
            if let Some(val) = trimmed.strip_prefix("path = ") {
                current_path = val.to_string();
            } else if let Some(val) = trimmed.strip_prefix("url = ") {
                current_url = val.to_string();
            } else if let Some(val) = trimmed.strip_prefix("branch = ") {
                current_branch = Some(val.to_string());
            }
        }
    }

    if in_section && !current_path.is_empty() {
        sections.push(GitmoduleSection {
            path: current_path,
            url: current_url,
            branch: current_branch,
        });
    }

    sections
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_submodule_status_up_to_date() {
        let output = " abc1234567890 vendor/lib-auth (v1.0.0)\n";
        let result = parse_submodule_status(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "vendor/lib-auth");
        assert_eq!(result[0].status, SubmoduleStatus::UpToDate);
        assert_eq!(result[0].head_oid.as_deref(), Some("abc1234567890"));
        assert_eq!(result[0].head_short_oid.as_deref(), Some("abc1234"));
    }

    #[test]
    fn parse_submodule_status_modified() {
        let output = "+def5678901234 vendor/lib-crypto (heads/v2.x)\n";
        let result = parse_submodule_status(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "vendor/lib-crypto");
        assert_eq!(result[0].status, SubmoduleStatus::Modified);
        assert_eq!(result[0].head_oid.as_deref(), Some("def5678901234"));
    }

    #[test]
    fn parse_submodule_status_uninitialized() {
        let output = "-aaa1111222233 vendor/lib-utils\n";
        let result = parse_submodule_status(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "vendor/lib-utils");
        assert_eq!(result[0].status, SubmoduleStatus::Uninitialized);
        assert!(result[0].head_oid.is_none());
        assert!(result[0].head_short_oid.is_none());
    }

    #[test]
    fn parse_submodule_status_conflict() {
        let output = "Uabc1234567890 vendor/lib-conflict (v1.0.0)\n";
        let result = parse_submodule_status(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "vendor/lib-conflict");
        assert_eq!(result[0].status, SubmoduleStatus::Conflict);
        assert_eq!(result[0].head_oid.as_deref(), Some("abc1234567890"));
    }

    #[test]
    fn parse_submodule_status_multiple() {
        let output = " abc1234567890 vendor/a (v1.0)\n+def5678901234 vendor/b\n";
        let result = parse_submodule_status(output);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].path, "vendor/a");
        assert_eq!(result[1].path, "vendor/b");
    }

    #[test]
    fn parse_submodule_status_empty() {
        let result = parse_submodule_status("");
        assert!(result.is_empty());
    }

    #[test]
    fn parse_gitmodules_single() {
        let content = r#"[submodule "vendor/lib-auth"]
	path = vendor/lib-auth
	url = git@github.com:example/lib-auth.git
	branch = main
"#;
        let sections = parse_gitmodules(content);

        assert_eq!(sections.len(), 1);
        assert_eq!(sections[0].path, "vendor/lib-auth");
        assert_eq!(sections[0].url, "git@github.com:example/lib-auth.git");
        assert_eq!(sections[0].branch.as_deref(), Some("main"));
    }

    #[test]
    fn parse_gitmodules_multiple() {
        let content = r#"[submodule "vendor/a"]
	path = vendor/a
	url = https://example.com/a.git
[submodule "vendor/b"]
	path = vendor/b
	url = https://example.com/b.git
	branch = develop
"#;
        let sections = parse_gitmodules(content);

        assert_eq!(sections.len(), 2);
        assert_eq!(sections[0].path, "vendor/a");
        assert!(sections[0].branch.is_none());
        assert_eq!(sections[1].path, "vendor/b");
        assert_eq!(sections[1].branch.as_deref(), Some("develop"));
    }

    #[test]
    fn parse_gitmodules_empty() {
        let sections = parse_gitmodules("");
        assert!(sections.is_empty());
    }

    #[test]
    fn enrich_from_gitmodules_fills_url_and_branch() {
        let mut submodules = vec![SubmoduleInfo {
            path: "vendor/lib-auth".to_string(),
            url: String::new(),
            branch: None,
            head_oid: Some("abc123".to_string()),
            head_short_oid: Some("abc123".to_string()),
            status: SubmoduleStatus::UpToDate,
        }];

        let gitmodules = r#"[submodule "vendor/lib-auth"]
	path = vendor/lib-auth
	url = git@github.com:example/lib-auth.git
	branch = main
"#;

        enrich_from_gitmodules(&mut submodules, gitmodules);

        assert_eq!(submodules[0].url, "git@github.com:example/lib-auth.git");
        assert_eq!(submodules[0].branch.as_deref(), Some("main"));
    }
}
