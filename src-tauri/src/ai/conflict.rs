use crate::ai::types::{AiError, ConflictSuggestion};

pub fn build_conflict_resolve_prompt(ours: &str, theirs: &str, base: Option<&str>) -> String {
    let base_section = match base {
        Some(b) => format!(
            "Base (common ancestor):\n\
             ```\n\
             {b}\n\
             ```\n\n"
        ),
        None => String::new(),
    };

    format!(
        "Resolve the following git merge conflict by producing a merged result.\n\n\
         {base_section}\
         Ours (current branch):\n\
         ```\n\
         {ours}\n\
         ```\n\n\
         Theirs (incoming branch):\n\
         ```\n\
         {theirs}\n\
         ```\n\n\
         Output ONLY a JSON object with this exact structure (no markdown fences, no explanation):\n\
         {{\"resolved_code\":\"the merged code\",\"confidence\":\"high\",\"reason\":\"explanation\"}}\n\n\
         Rules:\n\
         - \"confidence\" must be one of: \"high\", \"medium\", \"low\"\n\
         - \"resolved_code\" is the final merged code that replaces the conflict block\n\
         - \"reason\" briefly explains the merge strategy chosen\n\
         - Preserve the intent of both changes when possible\n\
         - If the changes are incompatible, prefer the safer option and set confidence to \"low\""
    )
}

pub fn parse_conflict_response(raw: &str) -> Result<ConflictSuggestion, AiError> {
    let trimmed = raw.trim();
    let json_str = super::strip_code_fences(trimmed);

    serde_json::from_str::<ConflictSuggestion>(json_str)
        .map_err(|e| AiError::ParseFailed(format!("invalid conflict resolution JSON: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::types::ConfidenceLevel;

    #[test]
    fn build_prompt_without_base() {
        let prompt = build_conflict_resolve_prompt("our code", "their code", None);
        assert!(prompt.contains("our code"));
        assert!(prompt.contains("their code"));
        assert!(!prompt.contains("Base (common ancestor)"));
    }

    #[test]
    fn build_prompt_with_base() {
        let prompt = build_conflict_resolve_prompt("our code", "their code", Some("base code"));
        assert!(prompt.contains("base code"));
        assert!(prompt.contains("Base (common ancestor)"));
    }

    #[test]
    fn build_prompt_specifies_json_format() {
        let prompt = build_conflict_resolve_prompt("a", "b", None);
        assert!(prompt.contains("JSON"));
        assert!(prompt.contains("\"resolved_code\""));
        assert!(prompt.contains("\"confidence\""));
    }

    #[test]
    fn parse_valid_conflict_response() {
        let json =
            r#"{"resolved_code":"merged","confidence":"high","reason":"Compatible changes"}"#;
        let result = parse_conflict_response(json).unwrap();
        assert_eq!(result.resolved_code, "merged");
        assert_eq!(result.confidence, ConfidenceLevel::High);
        assert_eq!(result.reason, "Compatible changes");
    }

    #[test]
    fn parse_medium_confidence() {
        let json =
            r#"{"resolved_code":"code","confidence":"medium","reason":"Partially compatible"}"#;
        let result = parse_conflict_response(json).unwrap();
        assert_eq!(result.confidence, ConfidenceLevel::Medium);
    }

    #[test]
    fn parse_low_confidence() {
        let json = r#"{"resolved_code":"code","confidence":"low","reason":"Incompatible"}"#;
        let result = parse_conflict_response(json).unwrap();
        assert_eq!(result.confidence, ConfidenceLevel::Low);
    }

    #[test]
    fn parse_response_with_code_fences() {
        let raw =
            "```json\n{\"resolved_code\":\"x\",\"confidence\":\"high\",\"reason\":\"y\"}\n```";
        let result = parse_conflict_response(raw).unwrap();
        assert_eq!(result.resolved_code, "x");
    }

    #[test]
    fn parse_invalid_json_returns_error() {
        let result = parse_conflict_response("not json");
        assert!(result.is_err());
    }
}
