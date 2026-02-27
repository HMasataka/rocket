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
}
