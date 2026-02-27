use std::io::Write;
use std::process::{Command, Stdio};

use crate::ai::types::{AiError, GenerateRequest, GenerateResult};

pub trait LlmAdapter: Send + Sync {
    fn name(&self) -> &str;
    fn is_available(&self) -> bool;
    fn generate(&self, request: &GenerateRequest) -> Result<GenerateResult, AiError>;
    fn execute_prompt(&self, prompt: &str) -> Result<String, AiError>;
}

pub struct CliAdapter {
    pub adapter_name: String,
    pub command: String,
    pub args: Vec<String>,
}

impl CliAdapter {
    pub fn new(adapter_name: String, command: String, args: Vec<String>) -> Self {
        Self {
            adapter_name,
            command,
            args,
        }
    }
}

impl CliAdapter {
    fn run_prompt(&self, prompt: &str) -> Result<String, AiError> {
        let mut child = Command::new(&self.command)
            .args(&self.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| AiError::CliExecutionFailed(e.to_string()))?;

        if let Some(ref mut stdin) = child.stdin {
            stdin
                .write_all(prompt.as_bytes())
                .map_err(|e| AiError::CliExecutionFailed(e.to_string()))?;
        }

        let output = child
            .wait_with_output()
            .map_err(|e| AiError::CliExecutionFailed(e.to_string()))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AiError::CliExecutionFailed(format!(
                "exit code {}: {}",
                output.status.code().unwrap_or(-1),
                stderr
            )));
        }

        let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if raw.is_empty() {
            return Err(AiError::ParseFailed("empty response".to_string()));
        }
        Ok(raw)
    }
}

impl LlmAdapter for CliAdapter {
    fn name(&self) -> &str {
        &self.adapter_name
    }

    fn is_available(&self) -> bool {
        which::which(&self.command).is_ok()
    }

    fn generate(&self, request: &GenerateRequest) -> Result<GenerateResult, AiError> {
        let prompt = super::prompt::build_commit_message_prompt(request);
        let raw = self.run_prompt(&prompt)?;
        parse_generate_response(&raw)
    }

    fn execute_prompt(&self, prompt: &str) -> Result<String, AiError> {
        self.run_prompt(prompt)
    }
}

fn parse_generate_response(raw: &str) -> Result<GenerateResult, AiError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(AiError::ParseFailed("empty response".to_string()));
    }

    let mut lines = trimmed.lines();
    let subject = lines.next().unwrap_or("").trim().to_string();
    let body: String = lines.collect::<Vec<_>>().join("\n").trim().to_string();

    Ok(GenerateResult {
        subject,
        body,
        alternatives: Vec::new(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_single_line_response() {
        let result = parse_generate_response("feat: add auth handler\n").unwrap();
        assert_eq!(result.subject, "feat: add auth handler");
        assert!(result.body.is_empty());
        assert!(result.alternatives.is_empty());
    }

    #[test]
    fn parse_multiline_response() {
        let raw = "feat(auth): add handler\n\n- Switch to slog\n- Add error handling";
        let result = parse_generate_response(raw).unwrap();
        assert_eq!(result.subject, "feat(auth): add handler");
        assert!(result.body.contains("Switch to slog"));
    }

    #[test]
    fn parse_empty_response_returns_error() {
        let result = parse_generate_response("");
        assert!(result.is_err());
    }

    #[test]
    fn parse_whitespace_only_response_returns_error() {
        let result = parse_generate_response("   \n  ");
        assert!(result.is_err());
    }
}
