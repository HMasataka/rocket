use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HostingProviderKind {
    Github,
    Gitlab,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostingInfo {
    pub provider: HostingProviderKind,
    pub owner: String,
    pub repo: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PrState {
    Open,
    Closed,
    Merged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrLabel {
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequest {
    pub number: u64,
    pub title: String,
    pub state: PrState,
    pub author: String,
    pub created_at: String,
    pub updated_at: String,
    pub head_branch: String,
    pub base_branch: String,
    pub draft: bool,
    pub labels: Vec<PrLabel>,
    pub additions: u64,
    pub deletions: u64,
    pub changed_files: u64,
    pub body: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IssueState {
    Open,
    Closed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    pub number: u64,
    pub title: String,
    pub state: IssueState,
    pub author: String,
    pub created_at: String,
    pub labels: Vec<PrLabel>,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CheckStatus {
    Success,
    Failure,
    Pending,
    Running,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiCheck {
    pub name: String,
    pub status: CheckStatus,
    pub description: String,
    pub elapsed: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrDetail {
    pub pull_request: PullRequest,
    pub checks: Vec<CiCheck>,
    pub reviewers: Vec<Reviewer>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ReviewState {
    Approved,
    ChangesRequested,
    Pending,
    Commented,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reviewer {
    pub login: String,
    pub state: ReviewState,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hosting_provider_kind_serializes_as_lowercase() {
        let kind = HostingProviderKind::Github;
        let json = serde_json::to_string(&kind).unwrap();
        assert_eq!(json, "\"github\"");
    }

    #[test]
    fn pr_state_serializes_as_lowercase() {
        assert_eq!(serde_json::to_string(&PrState::Open).unwrap(), "\"open\"");
        assert_eq!(
            serde_json::to_string(&PrState::Merged).unwrap(),
            "\"merged\""
        );
    }

    #[test]
    fn check_status_serializes_as_lowercase() {
        assert_eq!(
            serde_json::to_string(&CheckStatus::Success).unwrap(),
            "\"success\""
        );
        assert_eq!(
            serde_json::to_string(&CheckStatus::Running).unwrap(),
            "\"running\""
        );
    }

    #[test]
    fn review_state_serializes_as_lowercase() {
        assert_eq!(
            serde_json::to_string(&ReviewState::Approved).unwrap(),
            "\"approved\""
        );
        assert_eq!(
            serde_json::to_string(&ReviewState::ChangesRequested).unwrap(),
            "\"changes_requested\""
        );
    }

    #[test]
    fn pull_request_deserializes_from_json() {
        let json = r#"{
            "number": 42,
            "title": "Add auth",
            "state": "open",
            "author": "yamada",
            "created_at": "2025-01-01",
            "updated_at": "2025-01-02",
            "head_branch": "feature/auth",
            "base_branch": "main",
            "draft": false,
            "labels": [{"name": "bug", "color": "ff0000"}],
            "additions": 100,
            "deletions": 20,
            "changed_files": 5,
            "body": "PR body",
            "url": "https://github.com/owner/repo/pull/42"
        }"#;
        let pr: PullRequest = serde_json::from_str(json).unwrap();
        assert_eq!(pr.number, 42);
        assert_eq!(pr.title, "Add auth");
        assert_eq!(pr.state, PrState::Open);
        assert_eq!(pr.labels.len(), 1);
    }

    #[test]
    fn issue_deserializes_from_json() {
        let json = r#"{
            "number": 18,
            "title": "Fix login",
            "state": "open",
            "author": "tanaka",
            "created_at": "2025-01-01",
            "labels": [],
            "url": "https://github.com/owner/repo/issues/18"
        }"#;
        let issue: Issue = serde_json::from_str(json).unwrap();
        assert_eq!(issue.number, 18);
        assert_eq!(issue.state, IssueState::Open);
    }
}
