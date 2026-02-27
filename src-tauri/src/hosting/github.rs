use std::process::Command;

use super::types::{
    CheckStatus, CiCheck, Issue, IssueState, PrDetail, PrLabel, PrState, PullRequest, ReviewState,
    Reviewer,
};

pub fn list_pull_requests(repo_path: &str) -> Result<Vec<PullRequest>, String> {
    let output = Command::new("gh")
        .args([
            "pr",
            "list",
            "--json",
            "number,title,state,author,createdAt,updatedAt,headRefName,baseRefName,isDraft,labels,additions,deletions,changedFiles,body,url",
            "--limit",
            "30",
        ])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("failed to execute gh: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh pr list failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_pr_list_json(&stdout)
}

pub fn get_pull_request_detail(repo_path: &str, number: u64) -> Result<PrDetail, String> {
    let output = Command::new("gh")
        .args([
            "pr",
            "view",
            &number.to_string(),
            "--json",
            "number,title,state,author,createdAt,updatedAt,headRefName,baseRefName,isDraft,labels,additions,deletions,changedFiles,body,url,statusCheckRollup,reviews",
        ])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("failed to execute gh: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh pr view failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_pr_detail_json(&stdout)
}

pub fn list_issues(repo_path: &str) -> Result<Vec<Issue>, String> {
    let output = Command::new("gh")
        .args([
            "issue",
            "list",
            "--json",
            "number,title,state,author,createdAt,labels,url",
            "--limit",
            "30",
        ])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("failed to execute gh: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh issue list failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_issue_list_json(&stdout)
}

pub fn get_default_branch(repo_path: &str) -> Result<String, String> {
    let output = Command::new("gh")
        .args([
            "repo",
            "view",
            "--json",
            "defaultBranchRef",
            "--jq",
            ".defaultBranchRef.name",
        ])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("failed to execute gh: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh repo view failed: {stderr}"));
    }

    let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if branch.is_empty() {
        return Err("default branch not found".to_string());
    }

    Ok(branch)
}

pub fn create_pull_request_url(repo_path: &str, head: &str, base: &str) -> Result<String, String> {
    let output = Command::new("gh")
        .args(["browse", "--no-browser", "-n"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("failed to execute gh: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh browse failed: {stderr}"));
    }

    let repo_url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(format!("{repo_url}/compare/{base}...{head}?expand=1"))
}

pub fn open_in_browser(repo_path: &str, url: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let cmd = "open";
    #[cfg(target_os = "linux")]
    let cmd = "xdg-open";
    #[cfg(target_os = "windows")]
    let cmd = "cmd";

    #[cfg(target_os = "windows")]
    let args = vec!["/C", "start", "", url];
    #[cfg(not(target_os = "windows"))]
    let args = vec![url];

    let output = Command::new(cmd)
        .args(&args)
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("failed to open browser: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("open failed: {stderr}"));
    }

    Ok(())
}

fn parse_pr_list_json(json: &str) -> Result<Vec<PullRequest>, String> {
    let raw: Vec<serde_json::Value> =
        serde_json::from_str(json).map_err(|e| format!("failed to parse JSON: {e}"))?;

    raw.into_iter().map(|v| map_pr_from_gh_json(&v)).collect()
}

fn parse_pr_detail_json(json: &str) -> Result<PrDetail, String> {
    let v: serde_json::Value =
        serde_json::from_str(json).map_err(|e| format!("failed to parse JSON: {e}"))?;

    let pr = map_pr_from_gh_json(&v)?;
    let checks = map_checks_from_gh_json(&v);
    let reviewers = map_reviewers_from_gh_json(&v);

    Ok(PrDetail {
        pull_request: pr,
        checks,
        reviewers,
    })
}

fn parse_issue_list_json(json: &str) -> Result<Vec<Issue>, String> {
    let raw: Vec<serde_json::Value> =
        serde_json::from_str(json).map_err(|e| format!("failed to parse JSON: {e}"))?;

    raw.into_iter()
        .map(|v| {
            let number = v["number"].as_u64().ok_or("missing field: number")?;
            let title = v["title"]
                .as_str()
                .ok_or("missing field: title")?
                .to_string();
            let url = v["url"].as_str().ok_or("missing field: url")?.to_string();

            Ok(Issue {
                number,
                title,
                state: match v["state"].as_str().unwrap_or("") {
                    "CLOSED" => IssueState::Closed,
                    _ => IssueState::Open,
                },
                author: v["author"]["login"].as_str().unwrap_or("").to_string(),
                created_at: v["createdAt"].as_str().unwrap_or("").to_string(),
                labels: map_labels(&v["labels"]),
                url,
            })
        })
        .collect()
}

fn map_pr_from_gh_json(v: &serde_json::Value) -> Result<PullRequest, String> {
    let number = v["number"].as_u64().ok_or("missing field: number")?;
    let title = v["title"]
        .as_str()
        .ok_or("missing field: title")?
        .to_string();
    let url = v["url"].as_str().ok_or("missing field: url")?.to_string();

    Ok(PullRequest {
        number,
        title,
        state: match v["state"].as_str().unwrap_or("") {
            "CLOSED" => PrState::Closed,
            "MERGED" => PrState::Merged,
            _ => PrState::Open,
        },
        author: v["author"]["login"].as_str().unwrap_or("").to_string(),
        created_at: v["createdAt"].as_str().unwrap_or("").to_string(),
        updated_at: v["updatedAt"].as_str().unwrap_or("").to_string(),
        head_branch: v["headRefName"].as_str().unwrap_or("").to_string(),
        base_branch: v["baseRefName"].as_str().unwrap_or("").to_string(),
        draft: v["isDraft"].as_bool().unwrap_or(false),
        labels: map_labels(&v["labels"]),
        additions: v["additions"].as_u64().unwrap_or(0),
        deletions: v["deletions"].as_u64().unwrap_or(0),
        changed_files: v["changedFiles"].as_u64().unwrap_or(0),
        body: v["body"].as_str().unwrap_or("").to_string(),
        url,
    })
}

fn map_labels(labels: &serde_json::Value) -> Vec<PrLabel> {
    labels
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|l| PrLabel {
                    name: l["name"].as_str().unwrap_or("").to_string(),
                    color: l["color"].as_str().unwrap_or("").to_string(),
                })
                .collect()
        })
        .unwrap_or_default()
}

fn map_checks_from_gh_json(v: &serde_json::Value) -> Vec<CiCheck> {
    v["statusCheckRollup"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|c| CiCheck {
                    name: c["name"].as_str().unwrap_or("").to_string(),
                    status: match c["conclusion"].as_str().unwrap_or("") {
                        "SUCCESS" => CheckStatus::Success,
                        "FAILURE" => CheckStatus::Failure,
                        _ => match c["status"].as_str().unwrap_or("") {
                            "IN_PROGRESS" => CheckStatus::Running,
                            _ => CheckStatus::Pending,
                        },
                    },
                    description: c["description"].as_str().unwrap_or("").to_string(),
                    elapsed: String::new(),
                    url: c["detailsUrl"].as_str().unwrap_or("").to_string(),
                })
                .collect()
        })
        .unwrap_or_default()
}

fn map_reviewers_from_gh_json(v: &serde_json::Value) -> Vec<Reviewer> {
    v["reviews"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|r| Reviewer {
                    login: r["author"]["login"].as_str().unwrap_or("").to_string(),
                    state: match r["state"].as_str().unwrap_or("") {
                        "APPROVED" => ReviewState::Approved,
                        "CHANGES_REQUESTED" => ReviewState::ChangesRequested,
                        "COMMENTED" => ReviewState::Commented,
                        _ => ReviewState::Pending,
                    },
                })
                .collect()
        })
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_pr_list_json_parses_valid_json() {
        let json = r#"[
            {
                "number": 42,
                "title": "Add auth",
                "state": "OPEN",
                "author": {"login": "yamada"},
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-02T00:00:00Z",
                "headRefName": "feature/auth",
                "baseRefName": "main",
                "isDraft": false,
                "labels": [{"name": "bug", "color": "ff0000"}],
                "additions": 100,
                "deletions": 20,
                "changedFiles": 5,
                "body": "PR body",
                "url": "https://github.com/owner/repo/pull/42"
            }
        ]"#;
        let prs = parse_pr_list_json(json).unwrap();
        assert_eq!(prs.len(), 1);
        assert_eq!(prs[0].number, 42);
        assert_eq!(prs[0].title, "Add auth");
        assert_eq!(prs[0].state, PrState::Open);
        assert_eq!(prs[0].author, "yamada");
        assert_eq!(prs[0].head_branch, "feature/auth");
        assert!(!prs[0].draft);
        assert_eq!(prs[0].labels.len(), 1);
        assert_eq!(prs[0].additions, 100);
    }

    #[test]
    fn parse_pr_list_json_handles_empty_array() {
        let prs = parse_pr_list_json("[]").unwrap();
        assert!(prs.is_empty());
    }

    #[test]
    fn parse_pr_list_json_handles_closed_state() {
        let json = r#"[{"number":1,"title":"t","state":"CLOSED","author":{"login":"u"},"createdAt":"","updatedAt":"","headRefName":"","baseRefName":"","isDraft":false,"labels":[],"additions":0,"deletions":0,"changedFiles":0,"body":"","url":""}]"#;
        let prs = parse_pr_list_json(json).unwrap();
        assert_eq!(prs[0].state, PrState::Closed);
    }

    #[test]
    fn parse_pr_list_json_handles_merged_state() {
        let json = r#"[{"number":1,"title":"t","state":"MERGED","author":{"login":"u"},"createdAt":"","updatedAt":"","headRefName":"","baseRefName":"","isDraft":false,"labels":[],"additions":0,"deletions":0,"changedFiles":0,"body":"","url":""}]"#;
        let prs = parse_pr_list_json(json).unwrap();
        assert_eq!(prs[0].state, PrState::Merged);
    }

    #[test]
    fn parse_pr_detail_json_parses_checks_and_reviews() {
        let json = r#"{
            "number": 42,
            "title": "Add auth",
            "state": "OPEN",
            "author": {"login": "yamada"},
            "createdAt": "",
            "updatedAt": "",
            "headRefName": "feature/auth",
            "baseRefName": "main",
            "isDraft": false,
            "labels": [],
            "additions": 100,
            "deletions": 20,
            "changedFiles": 5,
            "body": "",
            "url": "",
            "statusCheckRollup": [
                {"name": "build", "conclusion": "SUCCESS", "status": "COMPLETED", "description": "Build", "detailsUrl": "https://ci.example.com/1"}
            ],
            "reviews": [
                {"author": {"login": "tanaka"}, "state": "APPROVED"}
            ]
        }"#;
        let detail = parse_pr_detail_json(json).unwrap();
        assert_eq!(detail.pull_request.number, 42);
        assert_eq!(detail.checks.len(), 1);
        assert_eq!(detail.checks[0].name, "build");
        assert_eq!(detail.checks[0].status, CheckStatus::Success);
        assert_eq!(detail.reviewers.len(), 1);
        assert_eq!(detail.reviewers[0].login, "tanaka");
        assert_eq!(detail.reviewers[0].state, ReviewState::Approved);
    }

    #[test]
    fn parse_issue_list_json_parses_valid_json() {
        let json = r#"[
            {
                "number": 18,
                "title": "Fix login",
                "state": "OPEN",
                "author": {"login": "tanaka"},
                "createdAt": "2025-01-01T00:00:00Z",
                "labels": [],
                "url": "https://github.com/owner/repo/issues/18"
            }
        ]"#;
        let issues = parse_issue_list_json(json).unwrap();
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].number, 18);
        assert_eq!(issues[0].state, IssueState::Open);
    }

    #[test]
    fn parse_issue_list_json_handles_closed_state() {
        let json = r#"[{"number":1,"title":"t","state":"CLOSED","author":{"login":"u"},"createdAt":"","labels":[],"url":""}]"#;
        let issues = parse_issue_list_json(json).unwrap();
        assert_eq!(issues[0].state, IssueState::Closed);
    }
}
