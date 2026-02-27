import { create } from "zustand";
import type {
  AiConfig,
  CliAdapterInfo,
  CommitMessageStyle,
  ConflictSuggestion,
  GenerateResult,
  Language,
  ReviewComment,
  ReviewResult,
} from "../services/ai";
import {
  aiResolveConflict as aiResolveConflictService,
  detectCliAdapters as detectCliAdaptersService,
  generateCommitMessage as generateCommitMessageService,
  getAiConfig as getAiConfigService,
  reviewDiff as reviewDiffService,
  saveAiConfig as saveAiConfigService,
} from "../services/ai";

interface AiState {
  adapters: CliAdapterInfo[];
  generating: boolean;
  config: AiConfig | null;
  lastResult: GenerateResult | null;
  error: string | null;
  reviewComments: ReviewComment[];
  reviewing: boolean;
  resolving: boolean;
}

interface AiActions {
  detectAdapters: () => Promise<void>;
  generateCommitMessage: (
    format: CommitMessageStyle,
    language: Language,
  ) => Promise<GenerateResult>;
  reviewDiff: () => Promise<ReviewResult>;
  resolveConflict: (
    ours: string,
    theirs: string,
    base: string | null,
  ) => Promise<ConflictSuggestion>;
  dismissReviewComment: (comment: ReviewComment) => void;
  clearReviewComments: () => void;
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
  reviewComments: [],
  reviewing: false,
  resolving: false,

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

  reviewDiff: async () => {
    set({ reviewing: true, error: null });
    try {
      const result = await reviewDiffService();
      set({ reviewComments: result.comments, reviewing: false });
      return result;
    } catch (e) {
      set({ error: String(e), reviewing: false });
      throw e;
    }
  },

  resolveConflict: async (
    ours: string,
    theirs: string,
    base: string | null,
  ) => {
    set({ resolving: true, error: null });
    try {
      const result = await aiResolveConflictService(ours, theirs, base);
      set({ resolving: false });
      return result;
    } catch (e) {
      set({ error: String(e), resolving: false });
      throw e;
    }
  },

  dismissReviewComment: (comment: ReviewComment) => {
    set((state) => ({
      reviewComments: state.reviewComments.filter(
        (c) =>
          c.file !== comment.file ||
          c.line_start !== comment.line_start ||
          c.line_end !== comment.line_end ||
          c.message !== comment.message,
      ),
    }));
  },

  clearReviewComments: () => {
    set({ reviewComments: [] });
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
