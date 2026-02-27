use std::path::Path;
use std::process::Command;

use serde::{Deserialize, Serialize};

use crate::git::error::{GitError, GitResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSearchResult {
    pub file: String,
    pub line_number: u32,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitSearchResult {
    pub oid: String,
    pub short_oid: String,
    pub message: String,
    pub author_name: String,
    pub author_date: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilenameSearchResult {
    pub path: String,
}

pub fn search_code(
    workdir: &Path,
    query: &str,
    is_regex: bool,
) -> GitResult<Vec<CodeSearchResult>> {
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let mut cmd = Command::new("git");
    cmd.current_dir(workdir).arg("grep").arg("-n");

    if is_regex {
        cmd.arg("-E");
    } else {
        cmd.arg("-F");
    }

    cmd.arg("--").arg(query);

    let output = cmd
        .output()
        .map_err(|e| GitError::SearchFailed(Box::new(e)))?;

    if !output.status.success() {
        if output.status.code() == Some(1) {
            return Ok(Vec::new());
        }
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::SearchFailed(stderr.to_string().into()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_grep_output(&stdout))
}

pub fn search_commits(
    workdir: &Path,
    query: &str,
    search_diff: bool,
) -> GitResult<Vec<CommitSearchResult>> {
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let format = "%H%n%h%n%s%n%an%n%at";

    let mut cmd = Command::new("git");
    cmd.current_dir(workdir).arg("log");

    if search_diff {
        cmd.arg(format!("-S{query}"));
    } else {
        cmd.arg(format!("--grep={query}"));
    }

    cmd.arg(format!("--format={format}")).arg("-100");

    let output = cmd
        .output()
        .map_err(|e| GitError::SearchFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::SearchFailed(stderr.to_string().into()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_commit_log_output(&stdout))
}

pub fn search_filenames(
    workdir: &Path,
    query: &str,
) -> GitResult<Vec<FilenameSearchResult>> {
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let output = Command::new("git")
        .current_dir(workdir)
        .args(["ls-files"])
        .output()
        .map_err(|e| GitError::SearchFailed(Box::new(e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::SearchFailed(stderr.to_string().into()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let query_lower = query.to_lowercase();

    let results: Vec<FilenameSearchResult> = stdout
        .lines()
        .filter(|line| fuzzy_match(line, &query_lower))
        .take(100)
        .map(|line| FilenameSearchResult {
            path: line.to_string(),
        })
        .collect();

    Ok(results)
}

fn parse_grep_output(output: &str) -> Vec<CodeSearchResult> {
    output
        .lines()
        .filter_map(|line| {
            // format: file:line_number:content
            let first_colon = line.find(':')?;
            let rest = &line[first_colon + 1..];
            let second_colon = rest.find(':')?;

            let file = line[..first_colon].to_string();
            let line_number = rest[..second_colon].parse::<u32>().ok()?;
            let content = rest[second_colon + 1..].to_string();

            Some(CodeSearchResult {
                file,
                line_number,
                content,
            })
        })
        .collect()
}

fn parse_commit_log_output(output: &str) -> Vec<CommitSearchResult> {
    let lines: Vec<&str> = output.lines().collect();
    let mut results = Vec::new();

    // Each commit occupies 5 lines: oid, short_oid, message, author_name, author_date
    let mut i = 0;
    while i + 4 < lines.len() {
        let author_date = match lines[i + 4].parse::<i64>() {
            Ok(v) => v,
            Err(_) => {
                i += 5;
                continue;
            }
        };

        results.push(CommitSearchResult {
            oid: lines[i].to_string(),
            short_oid: lines[i + 1].to_string(),
            message: lines[i + 2].to_string(),
            author_name: lines[i + 3].to_string(),
            author_date,
        });

        i += 5;
    }

    results
}

fn fuzzy_match(path: &str, query: &str) -> bool {
    let path_lower = path.to_lowercase();

    // Substring match first
    if path_lower.contains(query) {
        return true;
    }

    // Character-by-character fuzzy match
    let mut query_chars = query.chars().peekable();
    for ch in path_lower.chars() {
        if query_chars.peek() == Some(&ch) {
            query_chars.next();
        }
        if query_chars.peek().is_none() {
            return true;
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_grep_output_returns_results_for_valid_output() {
        let output = "src/main.rs:10:fn main() {\nsrc/lib.rs:5:pub mod search;\n";
        let results = parse_grep_output(output);

        assert_eq!(results.len(), 2);
        assert_eq!(results[0].file, "src/main.rs");
        assert_eq!(results[0].line_number, 10);
        assert_eq!(results[0].content, "fn main() {");
        assert_eq!(results[1].file, "src/lib.rs");
        assert_eq!(results[1].line_number, 5);
        assert_eq!(results[1].content, "pub mod search;");
    }

    #[test]
    fn parse_grep_output_returns_empty_for_empty_input() {
        let results = parse_grep_output("");
        assert!(results.is_empty());
    }

    #[test]
    fn parse_grep_output_handles_colons_in_content() {
        let output = "config.toml:3:key = \"value:with:colons\"\n";
        let results = parse_grep_output(output);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].file, "config.toml");
        assert_eq!(results[0].line_number, 3);
        assert_eq!(results[0].content, "key = \"value:with:colons\"");
    }

    #[test]
    fn parse_grep_output_skips_malformed_lines() {
        let output = "no-colon-line\nsrc/main.rs:10:valid line\n";
        let results = parse_grep_output(output);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].file, "src/main.rs");
    }

    #[test]
    fn parse_commit_log_output_returns_results_for_valid_output() {
        let output = "abc123def456\nabc123d\nfeat: add search\nAlice\n1700000000\n";
        let results = parse_commit_log_output(output);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].oid, "abc123def456");
        assert_eq!(results[0].short_oid, "abc123d");
        assert_eq!(results[0].message, "feat: add search");
        assert_eq!(results[0].author_name, "Alice");
        assert_eq!(results[0].author_date, 1700000000);
    }

    #[test]
    fn parse_commit_log_output_returns_empty_for_empty_input() {
        let results = parse_commit_log_output("");
        assert!(results.is_empty());
    }

    #[test]
    fn parse_commit_log_output_parses_multiple_commits() {
        let output =
            "aaa\na\nmsg1\nBob\n1000\nbbb\nb\nmsg2\nCarol\n2000\nccc\nc\nmsg3\nDave\n3000\n";
        let results = parse_commit_log_output(output);

        assert_eq!(results.len(), 3);
        assert_eq!(results[0].oid, "aaa");
        assert_eq!(results[1].oid, "bbb");
        assert_eq!(results[2].oid, "ccc");
    }

    #[test]
    fn parse_commit_log_output_ignores_incomplete_trailing_entry() {
        let output = "aaa\na\nmsg1\nBob\n1000\nincomplete\n";
        let results = parse_commit_log_output(output);

        assert_eq!(results.len(), 1);
    }

    #[test]
    fn parse_commit_log_output_skips_entry_with_invalid_date() {
        let output = "aaa\na\nmsg1\nBob\nnot_a_number\nbbb\nb\nmsg2\nCarol\n2000\n";
        let results = parse_commit_log_output(output);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].oid, "bbb");
        assert_eq!(results[0].author_date, 2000);
    }

    #[test]
    fn fuzzy_match_matches_substring() {
        assert!(fuzzy_match("src/auth/handler.go", "auth"));
    }

    #[test]
    fn fuzzy_match_matches_case_insensitive() {
        assert!(fuzzy_match("src/Auth/Handler.go", "auth"));
    }

    #[test]
    fn fuzzy_match_matches_fuzzy_characters() {
        assert!(fuzzy_match("src/auth/handler.go", "sah"));
    }

    #[test]
    fn fuzzy_match_returns_false_for_no_match() {
        assert!(!fuzzy_match("src/main.rs", "xyz"));
    }

    #[test]
    fn fuzzy_match_returns_false_for_out_of_order_chars() {
        assert!(!fuzzy_match("abc", "cba"));
    }

    #[test]
    fn fuzzy_match_with_take_limit_caps_at_100() {
        // Verify the take(100) logic works by testing the underlying function
        let mut lines = Vec::new();
        for i in 0..200 {
            lines.push(format!("src/file_{i}.rs"));
        }
        let query_lower = "src".to_lowercase();
        let results: Vec<FilenameSearchResult> = lines
            .iter()
            .map(|l| l.as_str())
            .filter(|line| fuzzy_match(line, &query_lower))
            .take(100)
            .map(|line| FilenameSearchResult {
                path: line.to_string(),
            })
            .collect();

        assert_eq!(results.len(), 100);
    }

    #[test]
    fn search_code_returns_empty_for_empty_query() {
        let result = search_code(Path::new("/tmp"), "", false);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn search_commits_returns_empty_for_empty_query() {
        let result = search_commits(Path::new("/tmp"), "", false);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn search_filenames_returns_empty_for_empty_query() {
        let result = search_filenames(Path::new("/tmp"), "");
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}
