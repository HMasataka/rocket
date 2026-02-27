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

// === Review types ===

export type ReviewCommentType = "warning" | "error" | "info";

export interface ReviewComment {
  file: string;
  line_start: number;
  line_end: number;
  type: ReviewCommentType;
  message: string;
}

export interface ReviewResult {
  comments: ReviewComment[];
}

// === Conflict resolution types ===

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConflictSuggestion {
  resolved_code: string;
  confidence: ConfidenceLevel;
  reason: string;
}

// === PR description types ===

export interface PrDescription {
  title: string;
  body: string;
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

export function reviewDiff(): Promise<ReviewResult> {
  return invoke<ReviewResult>("review_diff");
}

export function aiResolveConflict(
  ours: string,
  theirs: string,
  base: string | null,
): Promise<ConflictSuggestion> {
  return invoke<ConflictSuggestion>("ai_resolve_conflict", {
    ours,
    theirs,
    base,
  });
}

export function generatePrDescription(): Promise<PrDescription> {
  return invoke<PrDescription>("generate_pr_description");
}

export function getAiConfig(): Promise<AiConfig> {
  return invoke<AiConfig>("get_ai_config");
}

export function saveAiConfig(aiConfig: AiConfig): Promise<void> {
  return invoke<void>("save_ai_config", { aiConfig });
}
