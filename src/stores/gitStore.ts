import { create } from "zustand";
import type {
  BranchInfo,
  FileDiff,
  MergeOption,
  MergeResult,
  RepoStatus,
} from "../services/git";
import {
  checkoutBranch as checkoutBranchService,
  commitChanges,
  createBranch as createBranchService,
  deleteBranch as deleteBranchService,
  getCurrentBranch,
  getDiff,
  getStatus,
  listBranches,
  mergeBranch as mergeBranchService,
  renameBranch as renameBranchService,
  stageAll as stageAllService,
  stageFile as stageFileService,
  unstageAll as unstageAllService,
  unstageFile as unstageFileService,
} from "../services/git";

interface GitState {
  status: RepoStatus | null;
  currentBranch: string | null;
  branches: BranchInfo[];
  diff: FileDiff[];
  loading: boolean;
  error: string | null;
}

interface GitActions {
  fetchStatus: () => Promise<void>;
  fetchBranch: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchDiff: (path: string | null, staged: boolean) => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  commit: (message: string) => Promise<string>;
  createBranch: (name: string) => Promise<void>;
  checkoutBranch: (name: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  renameBranch: (oldName: string, newName: string) => Promise<void>;
  mergeBranch: (
    branchName: string,
    option: MergeOption,
  ) => Promise<MergeResult>;
  clearError: () => void;
}

export const useGitStore = create<GitState & GitActions>((set) => ({
  status: null,
  currentBranch: null,
  branches: [],
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

  fetchBranches: async () => {
    try {
      const branches = await listBranches();
      set({ branches });
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

  createBranch: async (name: string) => {
    try {
      await createBranchService(name);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  checkoutBranch: async (name: string) => {
    try {
      await checkoutBranchService(name);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  deleteBranch: async (name: string) => {
    try {
      await deleteBranchService(name);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  renameBranch: async (oldName: string, newName: string) => {
    try {
      await renameBranchService(oldName, newName);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  mergeBranch: async (branchName: string, option: MergeOption) => {
    try {
      return await mergeBranchService(branchName, option);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
