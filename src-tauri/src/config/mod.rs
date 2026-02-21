use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::git::error::{GitError, GitResult};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub last_opened_repo: Option<String>,
}

fn config_path() -> GitResult<PathBuf> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| GitError::ConfigReadFailed("config directory not found".into()))?;
    Ok(config_dir.join("rocket").join("config.toml"))
}

pub fn load_config() -> GitResult<AppConfig> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| GitError::ConfigReadFailed(Box::new(e)))?;
    let config: AppConfig =
        toml::from_str(&content).map_err(|e| GitError::ConfigReadFailed(Box::new(e)))?;
    Ok(config)
}

pub fn save_config(config: &AppConfig) -> GitResult<()> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| GitError::ConfigWriteFailed(Box::new(e)))?;
    }
    let content = toml::to_string(config).map_err(|e| GitError::ConfigWriteFailed(Box::new(e)))?;
    fs::write(&path, content).map_err(|e| GitError::ConfigWriteFailed(Box::new(e)))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_no_last_opened_repo() {
        let config = AppConfig::default();
        assert!(config.last_opened_repo.is_none());
    }

    #[test]
    fn config_serialization_roundtrip() {
        let config = AppConfig {
            last_opened_repo: Some("/tmp/test-repo".to_string()),
        };
        let serialized = toml::to_string(&config).unwrap();
        let deserialized: AppConfig = toml::from_str(&serialized).unwrap();
        assert_eq!(
            deserialized.last_opened_repo,
            Some("/tmp/test-repo".to_string())
        );
    }

    #[test]
    fn config_deserializes_empty_toml() {
        let config: AppConfig = toml::from_str("").unwrap();
        assert!(config.last_opened_repo.is_none());
    }
}
