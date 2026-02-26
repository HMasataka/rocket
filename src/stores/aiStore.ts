import { create } from "zustand";
import type {
  AiConfig,
  CliAdapterInfo,
  CommitMessageStyle,
  GenerateResult,
  Language,
} from "../services/ai";
import {
  detectCliAdapters as detectCliAdaptersService,
  generateCommitMessage as generateCommitMessageService,
  getAiConfig as getAiConfigService,
  saveAiConfig as saveAiConfigService,
} from "../services/ai";

interface AiState {
  adapters: CliAdapterInfo[];
  generating: boolean;
  config: AiConfig | null;
  lastResult: GenerateResult | null;
  error: string | null;
}

interface AiActions {
  detectAdapters: () => Promise<void>;
  generateCommitMessage: (
    format: CommitMessageStyle,
    language: Language,
  ) => Promise<GenerateResult>;
  fetchConfig: () => Promise<void>;
  saveConfig: (config: AiConfig) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

export const useAiStore = create<AiState & AiActions>((set) => ({
  adapters: [],
  generating: false,
  config: null,
  lastResult: null,
  error: null,

  detectAdapters: async () => {
    try {
      const adapters = await detectCliAdaptersService();
      set({ adapters });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  generateCommitMessage: async (
    format: CommitMessageStyle,
    language: Language,
  ) => {
    set({ generating: true, error: null });
    try {
      const result = await generateCommitMessageService(format, language);
      set({ lastResult: result, generating: false });
      return result;
    } catch (e) {
      set({ error: String(e), generating: false });
      throw e;
    }
  },

  fetchConfig: async () => {
    try {
      const config = await getAiConfigService();
      set({ config });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  saveConfig: async (config: AiConfig) => {
    try {
      await saveAiConfigService(config);
      set({ config });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearResult: () => {
    set({ lastResult: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
