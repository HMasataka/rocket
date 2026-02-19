import { create } from "zustand";
import type { FileDiff, RepoStatus } from "../services/git";
import {
  commitChanges,
  getCurrentBranch,
  getDiff,
  getStatus,
  stageAll as stageAllService,
  stageFile as stageFileService,
  unstageAll as unstageAllService,
  unstageFile as unstageFileService,
} from "../services/git";

interface GitState {
  status: RepoStatus | null;
  currentBranch: string | null;
  diff: FileDiff[];
  loading: boolean;
  error: string | null;
}

interface GitActions {
  fetchStatus: () => Promise<void>;
  fetchBranch: () => Promise<void>;
  fetchDiff: (path: string | null, staged: boolean) => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  commit: (message: string) => Promise<string>;
  clearError: () => void;
}

export const useGitStore = create<GitState & GitActions>((set) => ({
  status: null,
  currentBranch: null,
  diff: [],
  loading: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status = await getStatus();
      set({ status, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  fetchBranch: async () => {
    try {
      const currentBranch = await getCurrentBranch();
      set({ currentBranch });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchDiff: async (path: string | null, staged: boolean) => {
    try {
      const diff = await getDiff(path, staged);
      set({ diff });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  stageFile: async (path: string) => {
    try {
      await stageFileService(path);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  unstageFile: async (path: string) => {
    try {
      await unstageFileService(path);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  stageAll: async () => {
    try {
      await stageAllService();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  unstageAll: async () => {
    try {
      await unstageAllService();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  commit: async (message: string) => {
    try {
      const result = await commitChanges(message);
      return result.oid;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
