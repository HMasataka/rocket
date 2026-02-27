import { invoke } from "@tauri-apps/api/core";

export type CommitMessageStyle = "conventional" | "simple" | "detailed";
export type Language = "en" | "ja";

export interface CliAdapterInfo {
  name: string;
  command: string;
  available: boolean;
}

export interface GenerateResult {
  subject: string;
  body: string;
  alternatives: string[];
}

export interface AiConfig {
  commit_message_style: CommitMessageStyle;
  commit_message_language: Language;
  provider_priority: string[];
  prefer_local_llm: boolean;
  exclude_patterns: string[];
}

export function detectCliAdapters(): Promise<CliAdapterInfo[]> {
  return invoke<CliAdapterInfo[]>("detect_cli_adapters");
}

export function generateCommitMessage(
  format: string,
  language: string,
): Promise<GenerateResult> {
  return invoke<GenerateResult>("generate_commit_message", {
    format,
    language,
  });
}

export function getAiConfig(): Promise<AiConfig> {
  return invoke<AiConfig>("get_ai_config");
}

export function saveAiConfig(aiConfig: AiConfig): Promise<void> {
  return invoke<void>("save_ai_config", { aiConfig });
}
