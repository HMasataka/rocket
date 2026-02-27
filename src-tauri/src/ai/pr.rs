use crate::ai::types::{AiError, PrDescription};

pub fn build_pr_description_prompt(diff: &str, branch_name: &str) -> String {
    format!(
        "Generate a pull request title and description for the following changes.\n\n\
         Branch: {branch_name}\n\n\
         Output ONLY a JSON object with this exact structure (no markdown fences, no explanation):\n\
         {{\"title\":\"PR title (concise, under 72 chars)\",\"body\":\"PR description in markdown\"}}\n\n\
         Rules:\n\
         - Title should be concise and descriptive\n\
         - Body should include a summary of changes, motivation, and any notable implementation details\n\
         - Use markdown formatting in the body (headers, bullet points, etc.)\n\
         - Focus on the \"what\" and \"why\", not the \"how\"\n\n\
         Diff:\n\
         ```\n\
         {diff}\n\
         ```"
    )
}

pub fn parse_pr_description_response(raw: &str) -> Result<PrDescription, AiError> {
    let trimmed = raw.trim();
    let json_str = super::strip_code_fences(trimmed);

    serde_json::from_str::<PrDescription>(json_str)
        .map_err(|e| AiError::ParseFailed(format!("invalid PR description JSON: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_prompt_includes_branch_and_diff() {
        let prompt = build_pr_description_prompt("diff content", "feat/auth");
        assert!(prompt.contains("feat/auth"));
        assert!(prompt.contains("diff content"));
    }

    #[test]
    fn build_prompt_specifies_json_format() {
        let prompt = build_pr_description_prompt("diff", "main");
        assert!(prompt.contains("JSON"));
        assert!(prompt.contains("\"title\""));
        assert!(prompt.contains("\"body\""));
    }

    #[test]
    fn parse_valid_pr_description() {
        let json = "{\"title\":\"Add authentication handler\",\"body\":\"Summary of changes\"}";
        let result = parse_pr_description_response(json).unwrap();
        assert_eq!(result.title, "Add authentication handler");
        assert!(result.body.contains("Summary"));
    }

    #[test]
    fn parse_response_with_code_fences() {
        let raw = "```json\n{\"title\":\"Fix bug\",\"body\":\"Fixed the bug\"}\n```";
        let result = parse_pr_description_response(raw).unwrap();
        assert_eq!(result.title, "Fix bug");
    }

    #[test]
    fn parse_invalid_json_returns_error() {
        let result = parse_pr_description_response("not json");
        assert!(result.is_err());
    }

    #[test]
    fn parse_empty_body_is_valid() {
        let json = r#"{"title":"Update deps","body":""}"#;
        let result = parse_pr_description_response(json).unwrap();
        assert!(result.body.is_empty());
    }
}
