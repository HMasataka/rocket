use super::types::{HostingInfo, HostingProviderKind};

pub fn detect_from_remote_url(url: &str) -> HostingInfo {
    let normalized = normalize_url(url);

    if let Some(info) = parse_github(&normalized) {
        return info;
    }

    if let Some(info) = parse_gitlab(&normalized) {
        return info;
    }

    HostingInfo {
        provider: HostingProviderKind::Unknown,
        owner: String::new(),
        repo: String::new(),
        url: url.to_string(),
    }
}

fn normalize_url(url: &str) -> String {
    let url = url.trim();
    if let Some(stripped) = url.strip_suffix(".git") {
        stripped.to_string()
    } else {
        url.to_string()
    }
}

fn parse_github(url: &str) -> Option<HostingInfo> {
    // SSH: git@github.com:owner/repo
    if let Some(rest) = url.strip_prefix("git@github.com:") {
        return parse_owner_repo(rest, HostingProviderKind::Github, url);
    }

    // HTTPS: https://github.com/owner/repo
    if let Some(rest) = url
        .strip_prefix("https://github.com/")
        .or_else(|| url.strip_prefix("http://github.com/"))
    {
        return parse_owner_repo(rest, HostingProviderKind::Github, url);
    }

    None
}

fn parse_gitlab(url: &str) -> Option<HostingInfo> {
    // SSH: git@gitlab.com:owner/repo
    if let Some(rest) = url.strip_prefix("git@gitlab.com:") {
        return parse_owner_repo(rest, HostingProviderKind::Gitlab, url);
    }

    // HTTPS: https://gitlab.com/owner/repo
    if let Some(rest) = url
        .strip_prefix("https://gitlab.com/")
        .or_else(|| url.strip_prefix("http://gitlab.com/"))
    {
        return parse_owner_repo(rest, HostingProviderKind::Gitlab, url);
    }

    None
}

fn parse_owner_repo(
    path: &str,
    provider: HostingProviderKind,
    _original_url: &str,
) -> Option<HostingInfo> {
    let parts: Vec<&str> = path.splitn(2, '/').collect();
    if parts.len() == 2 && !parts[0].is_empty() && !parts[1].is_empty() {
        let owner = parts[0];
        let repo = parts[1];
        let base = match provider {
            HostingProviderKind::Github => "https://github.com",
            HostingProviderKind::Gitlab => "https://gitlab.com",
            HostingProviderKind::Unknown => "",
        };
        let url = if base.is_empty() {
            _original_url.to_string()
        } else {
            format!("{base}/{owner}/{repo}")
        };
        Some(HostingInfo {
            provider,
            owner: owner.to_string(),
            repo: repo.to_string(),
            url,
        })
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_github_https() {
        let info = detect_from_remote_url("https://github.com/HMasataka/rocket.git");
        assert_eq!(info.provider, HostingProviderKind::Github);
        assert_eq!(info.owner, "HMasataka");
        assert_eq!(info.repo, "rocket");
        assert_eq!(info.url, "https://github.com/HMasataka/rocket");
    }

    #[test]
    fn detects_github_ssh() {
        let info = detect_from_remote_url("git@github.com:HMasataka/rocket.git");
        assert_eq!(info.provider, HostingProviderKind::Github);
        assert_eq!(info.owner, "HMasataka");
        assert_eq!(info.repo, "rocket");
        assert_eq!(info.url, "https://github.com/HMasataka/rocket");
    }

    #[test]
    fn detects_github_https_without_git_suffix() {
        let info = detect_from_remote_url("https://github.com/owner/repo");
        assert_eq!(info.provider, HostingProviderKind::Github);
        assert_eq!(info.owner, "owner");
        assert_eq!(info.repo, "repo");
        assert_eq!(info.url, "https://github.com/owner/repo");
    }

    #[test]
    fn detects_gitlab_https() {
        let info = detect_from_remote_url("https://gitlab.com/owner/repo.git");
        assert_eq!(info.provider, HostingProviderKind::Gitlab);
        assert_eq!(info.owner, "owner");
        assert_eq!(info.repo, "repo");
        assert_eq!(info.url, "https://gitlab.com/owner/repo");
    }

    #[test]
    fn detects_gitlab_ssh() {
        let info = detect_from_remote_url("git@gitlab.com:owner/repo.git");
        assert_eq!(info.provider, HostingProviderKind::Gitlab);
        assert_eq!(info.owner, "owner");
        assert_eq!(info.repo, "repo");
        assert_eq!(info.url, "https://gitlab.com/owner/repo");
    }

    #[test]
    fn returns_unknown_for_unrecognized_url() {
        let info = detect_from_remote_url("https://bitbucket.org/owner/repo.git");
        assert_eq!(info.provider, HostingProviderKind::Unknown);
    }

    #[test]
    fn handles_empty_url() {
        let info = detect_from_remote_url("");
        assert_eq!(info.provider, HostingProviderKind::Unknown);
    }

    #[test]
    fn handles_whitespace_trimming() {
        let info = detect_from_remote_url("  https://github.com/owner/repo.git  ");
        assert_eq!(info.provider, HostingProviderKind::Github);
        assert_eq!(info.owner, "owner");
        assert_eq!(info.repo, "repo");
    }
}
