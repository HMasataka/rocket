use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CommitMessageStyle {
    #[default]
    Conventional,
    Simple,
    Detailed,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Language {
    #[default]
    En,
    Ja,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AiConfig {
    #[serde(default)]
    pub commit_message_style: CommitMessageStyle,
    #[serde(default)]
    pub commit_message_language: Language,
    #[serde(default)]
    pub provider_priority: Vec<String>,
    #[serde(default)]
    pub prefer_local_llm: bool,
    #[serde(default)]
    pub exclude_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliAdapterInfo {
    pub name: String,
    pub command: String,
    pub available: bool,
}

#[derive(Debug, Clone)]
pub struct GenerateRequest {
    pub diff: String,
    pub style: CommitMessageStyle,
    pub language: Language,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResult {
    pub subject: String,
    pub body: String,
    pub alternatives: Vec<String>,
}

// === Review types ===

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ReviewCommentType {
    Warning,
    Error,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewComment {
    pub file: String,
    pub line_start: u32,
    pub line_end: u32,
    #[serde(rename = "type")]
    pub comment_type: ReviewCommentType,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewResult {
    pub comments: Vec<ReviewComment>,
}

// === Conflict resolution types ===

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConfidenceLevel {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictSuggestion {
    pub resolved_code: String,
    pub confidence: ConfidenceLevel,
    pub reason: String,
}

// === PR description types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrDescription {
    pub title: String,
    pub body: String,
}

#[derive(Debug, thiserror::Error)]
pub enum AiError {
    #[error("no adapter available")]
    NoAdapterAvailable,

    #[error("cli execution failed: {0}")]
    CliExecutionFailed(String),

    #[error("failed to parse response: {0}")]
    ParseFailed(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_ai_config_has_expected_values() {
        let config = AiConfig::default();
        assert_eq!(config.commit_message_style, CommitMessageStyle::Conventional);
        assert_eq!(config.commit_message_language, Language::En);
        assert!(config.provider_priority.is_empty());
        assert!(!config.prefer_local_llm);
        assert!(config.exclude_patterns.is_empty());
    }

    #[test]
    fn ai_config_serialization_roundtrip() {
        let config = AiConfig {
            commit_message_style: CommitMessageStyle::Detailed,
            commit_message_language: Language::Ja,
            provider_priority: vec!["Claude Code".to_string(), "LLM CLI".to_string()],
            prefer_local_llm: true,
            exclude_patterns: vec![".env".to_string(), "*.key".to_string()],
        };
        let serialized = toml::to_string(&config).unwrap();
        let deserialized: AiConfig = toml::from_str(&serialized).unwrap();
        assert_eq!(deserialized.commit_message_style, CommitMessageStyle::Detailed);
        assert_eq!(deserialized.commit_message_language, Language::Ja);
        assert_eq!(deserialized.provider_priority, vec!["Claude Code", "LLM CLI"]);
        assert!(deserialized.prefer_local_llm);
        assert_eq!(deserialized.exclude_patterns, vec![".env", "*.key"]);
    }

    #[test]
    fn ai_config_deserializes_empty_toml() {
        let config: AiConfig = toml::from_str("").unwrap();
        assert_eq!(config.commit_message_style, CommitMessageStyle::Conventional);
        assert_eq!(config.commit_message_language, Language::En);
        assert!(config.provider_priority.is_empty());
        assert!(!config.prefer_local_llm);
        assert!(config.exclude_patterns.is_empty());
    }

    #[test]
    fn commit_message_style_serializes_as_snake_case() {
        let style = CommitMessageStyle::Conventional;
        let serialized = serde_json::to_string(&style).unwrap();
        assert_eq!(serialized, "\"conventional\"");
    }

    #[test]
    fn language_serializes_as_snake_case() {
        let lang = Language::Ja;
        let serialized = serde_json::to_string(&lang).unwrap();
        assert_eq!(serialized, "\"ja\"");
    }

    #[test]
    fn ai_config_privacy_fields_serialize_to_json() {
        let config = AiConfig {
            prefer_local_llm: true,
            exclude_patterns: vec![".env".to_string(), "credentials.*".to_string()],
            ..AiConfig::default()
        };
        let json = serde_json::to_value(&config).unwrap();
        assert_eq!(json["prefer_local_llm"], true);
        assert_eq!(
            json["exclude_patterns"],
            serde_json::json!([".env", "credentials.*"])
        );
    }

    #[test]
    fn ai_config_deserializes_partial_toml_with_privacy_fields() {
        let toml_str = r#"
prefer_local_llm = true
exclude_patterns = ["*.key"]
"#;
        let config: AiConfig = toml::from_str(toml_str).unwrap();
        assert!(config.prefer_local_llm);
        assert_eq!(config.exclude_patterns, vec!["*.key"]);
        assert_eq!(config.commit_message_style, CommitMessageStyle::Conventional);
    }

    #[test]
    fn review_comment_serializes_to_json() {
        let comment = ReviewComment {
            file: "src/main.rs".to_string(),
            line_start: 10,
            line_end: 15,
            comment_type: ReviewCommentType::Warning,
            message: "Unused import".to_string(),
        };
        let json = serde_json::to_value(&comment).unwrap();
        assert_eq!(json["file"], "src/main.rs");
        assert_eq!(json["line_start"], 10);
        assert_eq!(json["type"], "warning");
    }

    #[test]
    fn review_result_deserializes_from_json() {
        let json = r#"{"comments":[{"file":"a.rs","line_start":1,"line_end":2,"type":"error","message":"Bug"}]}"#;
        let result: ReviewResult = serde_json::from_str(json).unwrap();
        assert_eq!(result.comments.len(), 1);
        assert_eq!(result.comments[0].comment_type, ReviewCommentType::Error);
    }

    #[test]
    fn conflict_suggestion_serializes_to_json() {
        let suggestion = ConflictSuggestion {
            resolved_code: "merged code".to_string(),
            confidence: ConfidenceLevel::High,
            reason: "Both changes are compatible".to_string(),
        };
        let json = serde_json::to_value(&suggestion).unwrap();
        assert_eq!(json["confidence"], "high");
        assert_eq!(json["resolved_code"], "merged code");
    }

    #[test]
    fn pr_description_serializes_to_json() {
        let pr = PrDescription {
            title: "Add auth handler".to_string(),
            body: "This PR adds authentication.".to_string(),
        };
        let json = serde_json::to_value(&pr).unwrap();
        assert_eq!(json["title"], "Add auth handler");
    }

    #[test]
    fn confidence_level_serializes_as_lowercase() {
        assert_eq!(
            serde_json::to_string(&ConfidenceLevel::Medium).unwrap(),
            "\"medium\""
        );
    }

    #[test]
    fn review_comment_type_serializes_as_lowercase() {
        assert_eq!(
            serde_json::to_string(&ReviewCommentType::Info).unwrap(),
            "\"info\""
        );
    }
}
