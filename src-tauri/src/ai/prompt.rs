use crate::ai::types::{CommitMessageStyle, GenerateRequest, Language};

pub fn build_commit_message_prompt(request: &GenerateRequest) -> String {
    let style_instruction = match request.style {
        CommitMessageStyle::Conventional => {
            "Use Conventional Commits format: type(scope): description\n\
             Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build\n\
             The scope is optional."
        }
        CommitMessageStyle::Simple => {
            "Write a simple, concise commit message. \
             Start with a verb in imperative mood (e.g., Add, Fix, Update)."
        }
        CommitMessageStyle::Detailed => {
            "Write a detailed commit message with:\n\
             - A concise subject line (imperative mood)\n\
             - A blank line\n\
             - A body explaining what changed and why"
        }
    };

    let language_instruction = match request.language {
        Language::En => "Write the commit message in English.",
        Language::Ja => "Write the commit message in Japanese.",
    };

    format!(
        "Generate a git commit message for the following diff.\n\n\
         {style_instruction}\n\n\
         {language_instruction}\n\n\
         Output ONLY the commit message, nothing else.\n\
         First line is the subject, then a blank line, then the body (optional).\n\n\
         Diff:\n\
         ```\n\
         {diff}\n\
         ```",
        diff = request.diff,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conventional_prompt_contains_conventional_commits_instruction() {
        let request = GenerateRequest {
            diff: "diff --git a/foo.rs".to_string(),
            style: CommitMessageStyle::Conventional,
            language: Language::En,
        };
        let prompt = build_commit_message_prompt(&request);
        assert!(prompt.contains("Conventional Commits"));
        assert!(prompt.contains("feat, fix"));
        assert!(prompt.contains("English"));
        assert!(prompt.contains("diff --git a/foo.rs"));
    }

    #[test]
    fn simple_prompt_contains_imperative_instruction() {
        let request = GenerateRequest {
            diff: "+new line".to_string(),
            style: CommitMessageStyle::Simple,
            language: Language::En,
        };
        let prompt = build_commit_message_prompt(&request);
        assert!(prompt.contains("imperative mood"));
    }

    #[test]
    fn detailed_prompt_contains_body_instruction() {
        let request = GenerateRequest {
            diff: "-old\n+new".to_string(),
            style: CommitMessageStyle::Detailed,
            language: Language::Ja,
        };
        let prompt = build_commit_message_prompt(&request);
        assert!(prompt.contains("body"));
        assert!(prompt.contains("Japanese"));
    }

    #[test]
    fn prompt_includes_diff_content() {
        let diff = "--- a/file.rs\n+++ b/file.rs\n@@ -1,3 +1,3 @@";
        let request = GenerateRequest {
            diff: diff.to_string(),
            style: CommitMessageStyle::Conventional,
            language: Language::En,
        };
        let prompt = build_commit_message_prompt(&request);
        assert!(prompt.contains(diff));
    }
}
