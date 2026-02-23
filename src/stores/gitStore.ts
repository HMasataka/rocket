import { create } from "zustand";
import type {
  BranchInfo,
  FetchResult,
  FileDiff,
  HunkIdentifier,
  LineRange,
  MergeOption,
  MergeResult,
  PullOption,
  PushResult,
  RemoteInfo,
  RepoStatus,
} from "../services/git";
import {
  addRemote as addRemoteService,
  checkoutBranch as checkoutBranchService,
  commitChanges,
  createBranch as createBranchService,
  deleteBranch as deleteBranchService,
  discardHunk as discardHunkService,
  discardLines as discardLinesService,
  editRemote as editRemoteService,
  fetchRemote as fetchRemoteService,
  getCurrentBranch,
  getDiff,
  getHeadCommitMessage,
  getStatus,
  listBranches,
  listRemotes,
  mergeBranch as mergeBranchService,
  pullRemote as pullRemoteService,
  pushRemote as pushRemoteService,
  removeRemote as removeRemoteService,
  renameBranch as renameBranchService,
  stageAll as stageAllService,
  stageFile as stageFileService,
  stageHunk as stageHunkService,
  stageLines as stageLinesService,
  unstageAll as unstageAllService,
  unstageFile as unstageFileService,
  unstageHunk as unstageHunkService,
  unstageLines as unstageLinesService,
} from "../services/git";

interface GitState {
  status: RepoStatus | null;
  currentBranch: string | null;
  branches: BranchInfo[];
  diff: FileDiff[];
  remotes: RemoteInfo[];
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
  commit: (message: string, amend: boolean) => Promise<string>;
  createBranch: (name: string) => Promise<void>;
  checkoutBranch: (name: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  renameBranch: (oldName: string, newName: string) => Promise<void>;
  mergeBranch: (
    branchName: string,
    option: MergeOption,
  ) => Promise<MergeResult>;
  fetchRemote: (remoteName: string) => Promise<FetchResult>;
  pullRemote: (remoteName: string, option: PullOption) => Promise<MergeResult>;
  pushRemote: (remoteName: string) => Promise<PushResult>;
  fetchRemotes: () => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  removeRemote: (name: string) => Promise<void>;
  editRemote: (name: string, newUrl: string) => Promise<void>;
  stageHunk: (path: string, hunk: HunkIdentifier) => Promise<void>;
  unstageHunk: (path: string, hunk: HunkIdentifier) => Promise<void>;
  discardHunk: (path: string, hunk: HunkIdentifier) => Promise<void>;
  stageLines: (path: string, lineRange: LineRange) => Promise<void>;
  unstageLines: (path: string, lineRange: LineRange) => Promise<void>;
  discardLines: (path: string, lineRange: LineRange) => Promise<void>;
  getHeadCommitMessage: () => Promise<string>;
  clearError: () => void;
}

export const useGitStore = create<GitState & GitActions>((set) => ({
  status: null,
  currentBranch: null,
  branches: [],
  diff: [],
  remotes: [],
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

  commit: async (message: string, amend: boolean) => {
    try {
      const result = await commitChanges(message, amend);
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

  fetchRemote: async (remoteName: string) => {
    try {
      return await fetchRemoteService(remoteName);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  pullRemote: async (remoteName: string, option: PullOption) => {
    try {
      return await pullRemoteService(remoteName, option);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  pushRemote: async (remoteName: string) => {
    try {
      return await pushRemoteService(remoteName);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchRemotes: async () => {
    try {
      const remotes = await listRemotes();
      set({ remotes });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  addRemote: async (name: string, url: string) => {
    try {
      await addRemoteService(name, url);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removeRemote: async (name: string) => {
    try {
      await removeRemoteService(name);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  editRemote: async (name: string, newUrl: string) => {
    try {
      await editRemoteService(name, newUrl);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  stageHunk: async (path: string, hunk: HunkIdentifier) => {
    try {
      await stageHunkService(path, hunk);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  unstageHunk: async (path: string, hunk: HunkIdentifier) => {
    try {
      await unstageHunkService(path, hunk);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  discardHunk: async (path: string, hunk: HunkIdentifier) => {
    try {
      await discardHunkService(path, hunk);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  stageLines: async (path: string, lineRange: LineRange) => {
    try {
      await stageLinesService(path, lineRange);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  unstageLines: async (path: string, lineRange: LineRange) => {
    try {
      await unstageLinesService(path, lineRange);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  discardLines: async (path: string, lineRange: LineRange) => {
    try {
      await discardLinesService(path, lineRange);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  getHeadCommitMessage: async () => {
    try {
      return await getHeadCommitMessage();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
