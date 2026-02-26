use crate::ai::adapter::CliAdapter;
use crate::ai::types::CliAdapterInfo;

struct PresetCli {
    name: &'static str,
    command: &'static str,
    args: &'static [&'static str],
}

const PRESET_CLIS: &[PresetCli] = &[
    PresetCli {
        name: "Claude Code",
        command: "claude",
        args: &["-p"],
    },
    PresetCli {
        name: "Codex CLI",
        command: "codex",
        args: &["-q"],
    },
    PresetCli {
        name: "GitHub Copilot",
        command: "gh",
        args: &["copilot", "suggest", "-t", "shell"],
    },
    PresetCli {
        name: "Gemini CLI",
        command: "gemini",
        args: &[],
    },
    PresetCli {
        name: "Aider",
        command: "aider",
        args: &["--message"],
    },
    PresetCli {
        name: "LLM CLI",
        command: "llm",
        args: &[],
    },
];

pub fn detect_cli_adapters() -> Vec<CliAdapterInfo> {
    PRESET_CLIS
        .iter()
        .map(|preset| {
            let available = which::which(preset.command).is_ok();
            CliAdapterInfo {
                name: preset.name.to_string(),
                command: preset.command.to_string(),
                available,
            }
        })
        .collect()
}

pub fn first_available_adapter() -> Option<CliAdapter> {
    PRESET_CLIS
        .iter()
        .find(|preset| which::which(preset.command).is_ok())
        .map(|preset| {
            CliAdapter::new(
                preset.name.to_string(),
                preset.command.to_string(),
                preset.args.iter().map(|s| s.to_string()).collect(),
            )
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_returns_all_presets() {
        let adapters = detect_cli_adapters();
        assert_eq!(adapters.len(), PRESET_CLIS.len());
        assert_eq!(adapters[0].name, "Claude Code");
        assert_eq!(adapters[0].command, "claude");
    }

}
