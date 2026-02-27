use crate::ai::types::{AiError, ReviewResult};

pub fn build_review_prompt(diff: &str) -> String {
    format!(
        "Review the following git diff for potential bugs, security issues, and code quality problems.\n\n\
         Output ONLY a JSON object with this exact structure (no markdown fences, no explanation):\n\
         {{\"comments\":[{{\"file\":\"path/to/file\",\"line_start\":1,\"line_end\":2,\"type\":\"warning\",\"message\":\"description\"}}]}}\n\n\
         Rules:\n\
         - \"type\" must be one of: \"warning\", \"error\", \"info\"\n\
         - \"warning\": code smells, style issues, potential problems\n\
         - \"error\": bugs, security vulnerabilities, logic errors\n\
         - \"info\": suggestions, improvements\n\
         - line_start and line_end refer to the new file line numbers from the diff\n\
         - If there are no issues, return: {{\"comments\":[]}}\n\
         - Focus on meaningful issues, not formatting\n\n\
         Diff:\n\
         ```\n\
         {diff}\n\
         ```"
    )
}

pub fn parse_review_response(raw: &str) -> Result<ReviewResult, AiError> {
    let trimmed = raw.trim();

    // Strip markdown code fences if present
    let json_str = super::strip_code_fences(trimmed);

    serde_json::from_str::<ReviewResult>(json_str)
        .map_err(|e| AiError::ParseFailed(format!("invalid review JSON: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::types::ReviewCommentType;

    #[test]
    fn build_review_prompt_includes_diff() {
        let diff = "--- a/main.rs\n+++ b/main.rs\n@@ -1 +1 @@\n-old\n+new";
        let prompt = build_review_prompt(diff);
        assert!(prompt.contains("--- a/main.rs"));
        assert!(prompt.contains("Review the following"));
    }

    #[test]
    fn build_review_prompt_specifies_json_format() {
        let prompt = build_review_prompt("diff");
        assert!(prompt.contains("JSON"));
        assert!(prompt.contains("\"comments\""));
    }

    #[test]
    fn parse_valid_review_response() {
        let json = r#"{"comments":[{"file":"src/main.rs","line_start":10,"line_end":12,"type":"warning","message":"Unused variable"}]}"#;
        let result = parse_review_response(json).unwrap();
        assert_eq!(result.comments.len(), 1);
        assert_eq!(result.comments[0].file, "src/main.rs");
        assert_eq!(result.comments[0].line_start, 10);
        assert_eq!(result.comments[0].line_end, 12);
        assert_eq!(result.comments[0].comment_type, ReviewCommentType::Warning);
        assert_eq!(result.comments[0].message, "Unused variable");
    }

    #[test]
    fn parse_empty_comments_response() {
        let json = r#"{"comments":[]}"#;
        let result = parse_review_response(json).unwrap();
        assert!(result.comments.is_empty());
    }

    #[test]
    fn parse_response_with_code_fences() {
        let raw = "```json\n{\"comments\":[]}\n```";
        let result = parse_review_response(raw).unwrap();
        assert!(result.comments.is_empty());
    }

    #[test]
    fn parse_response_with_bare_fences() {
        let raw = "```\n{\"comments\":[]}\n```";
        let result = parse_review_response(raw).unwrap();
        assert!(result.comments.is_empty());
    }

    #[test]
    fn parse_invalid_json_returns_error() {
        let result = parse_review_response("not json");
        assert!(result.is_err());
    }

    #[test]
    fn parse_multiple_comments() {
        let json = r#"{"comments":[
            {"file":"a.rs","line_start":1,"line_end":2,"type":"error","message":"Bug"},
            {"file":"b.rs","line_start":5,"line_end":5,"type":"info","message":"Tip"}
        ]}"#;
        let result = parse_review_response(json).unwrap();
        assert_eq!(result.comments.len(), 2);
        assert_eq!(result.comments[0].comment_type, ReviewCommentType::Error);
        assert_eq!(result.comments[1].comment_type, ReviewCommentType::Info);
    }
}
