import { invoke } from "@tauri-apps/api/core";

export function listGitignoreTemplates(): Promise<string[]> {
  return invoke<string[]>("list_gitignore_templates");
}

export function getGitignoreTemplate(name: string): Promise<string> {
  return invoke<string>("get_gitignore_template", { name });
}
