import { create } from "zustand";
import type { CherryPickMode, CherryPickResult } from "../services/cherryPick";
import {
  abortCherryPick as abortCherryPickService,
  cherryPick as cherryPickService,
  continueCherryPick as continueCherryPickService,
  isCherryPicking as isCherryPickingService,
} from "../services/cherryPick";
import type { ConflictFile, ConflictResolution } from "../services/conflict";
import {
  abortMerge as abortMergeService,
  continueMerge as continueMergeService,
  getConflictFiles,
  isMerging as isMergingService,
  markResolved as markResolvedService,
  resolveConflictBlock as resolveConflictBlockService,
  resolveConflict as resolveConflictService,
} from "../services/conflict";
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
import type {
  RebaseResult,
  RebaseState,
  RebaseTodoEntry,
} from "../services/rebase";
import {
  abortRebase as abortRebaseService,
  continueRebase as continueRebaseService,
  getRebaseState,
  getRebaseTodo as getRebaseTodoService,
  interactiveRebase as interactiveRebaseService,
  isRebasing as isRebasingService,
  rebase as rebaseService,
} from "../services/rebase";
import type { ResetMode, ResetResult } from "../services/reset";
import {
  resetFile as resetFileService,
  resetToCommit as resetToCommitService,
} from "../services/reset";
import type { RevertMode, RevertResult } from "../services/revert";
import {
  abortRevert as abortRevertService,
  continueRevert as continueRevertService,
  isReverting as isRevertingService,
  revertCommit as revertCommitService,
} from "../services/revert";
import type { StashEntry } from "../services/stash";
import {
  applyStash as applyStashService,
  dropStash as dropStashService,
  listStashes,
  popStash as popStashService,
  stashSave as stashSaveService,
} from "../services/stash";
import type { TagInfo } from "../services/tag";
import {
  checkoutTag as checkoutTagService,
  createTag as createTagService,
  deleteTag as deleteTagService,
  listTags,
} from "../services/tag";

const REBASE_TODO_DEFAULT_LIMIT = 100;

interface GitState {
  status: RepoStatus | null;
  currentBranch: string | null;
  branches: BranchInfo[];
  diff: FileDiff[];
  remotes: RemoteInfo[];
  stashes: StashEntry[];
  tags: TagInfo[];
  merging: boolean;
  rebasing: boolean;
  rebaseState: RebaseState | null;
  cherryPicking: boolean;
  reverting: boolean;
  conflictFiles: ConflictFile[];
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
  fetchStashes: () => Promise<void>;
  stashSave: (message: string | null) => Promise<void>;
  applyStash: (index: number) => Promise<void>;
  popStash: (index: number) => Promise<void>;
  dropStash: (index: number) => Promise<void>;
  fetchTags: () => Promise<void>;
  createTag: (name: string, message: string | null) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
  checkoutTag: (name: string) => Promise<void>;
  fetchMergeState: () => Promise<void>;
  fetchConflictFiles: () => Promise<void>;
  resolveConflict: (
    path: string,
    resolution: ConflictResolution,
  ) => Promise<void>;
  resolveConflictBlock: (
    path: string,
    blockIndex: number,
    resolution: ConflictResolution,
  ) => Promise<void>;
  markResolved: (path: string) => Promise<void>;
  abortMerge: () => Promise<void>;
  continueMerge: (message: string) => Promise<string>;
  fetchRebaseState: () => Promise<void>;
  rebase: (onto: string) => Promise<RebaseResult>;
  interactiveRebase: (
    onto: string,
    todo: RebaseTodoEntry[],
  ) => Promise<RebaseResult>;
  abortRebase: () => Promise<void>;
  continueRebase: () => Promise<RebaseResult>;
  getRebaseTodo: (onto: string) => Promise<RebaseTodoEntry[]>;
  cherryPick: (
    oids: string[],
    mode: CherryPickMode,
  ) => Promise<CherryPickResult>;
  fetchCherryPickState: () => Promise<void>;
  abortCherryPick: () => Promise<void>;
  continueCherryPick: () => Promise<CherryPickResult>;
  revertCommit: (oid: string, mode: RevertMode) => Promise<RevertResult>;
  fetchRevertState: () => Promise<void>;
  abortRevert: () => Promise<void>;
  continueRevert: () => Promise<RevertResult>;
  resetToCommit: (oid: string, mode: ResetMode) => Promise<ResetResult>;
  resetFile: (path: string, oid: string) => Promise<void>;
  clearError: () => void;
}

export const useGitStore = create<GitState & GitActions>((set) => ({
  status: null,
  currentBranch: null,
  branches: [],
  diff: [],
  remotes: [],
  stashes: [],
  tags: [],
  merging: false,
  rebasing: false,
  rebaseState: null,
  cherryPicking: false,
  reverting: false,
  conflictFiles: [],
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

  fetchStashes: async () => {
    try {
      const stashes = await listStashes();
      set({ stashes });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  stashSave: async (message: string | null) => {
    try {
      await stashSaveService(message);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  applyStash: async (index: number) => {
    try {
      await applyStashService(index);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  popStash: async (index: number) => {
    try {
      await popStashService(index);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  dropStash: async (index: number) => {
    try {
      await dropStashService(index);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchTags: async () => {
    try {
      const tags = await listTags();
      set({ tags });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  createTag: async (name: string, message: string | null) => {
    try {
      await createTagService(name, message);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  deleteTag: async (name: string) => {
    try {
      await deleteTagService(name);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  checkoutTag: async (name: string) => {
    try {
      await checkoutTagService(name);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchMergeState: async () => {
    try {
      const merging = await isMergingService();
      set({ merging });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchConflictFiles: async () => {
    try {
      const conflictFiles = await getConflictFiles();
      set({ conflictFiles });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  resolveConflict: async (path: string, resolution: ConflictResolution) => {
    try {
      await resolveConflictService(path, resolution);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  resolveConflictBlock: async (
    path: string,
    blockIndex: number,
    resolution: ConflictResolution,
  ) => {
    try {
      await resolveConflictBlockService(path, blockIndex, resolution);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  markResolved: async (path: string) => {
    try {
      await markResolvedService(path);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  abortMerge: async () => {
    try {
      await abortMergeService();
      set({ merging: false, conflictFiles: [] });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  continueMerge: async (message: string) => {
    try {
      const result = await continueMergeService(message);
      set({ merging: false, conflictFiles: [] });
      return result.oid;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchRebaseState: async () => {
    try {
      const rebasing = await isRebasingService();
      const rebaseState = await getRebaseState();
      set({ rebasing, rebaseState });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  rebase: async (onto: string) => {
    try {
      return await rebaseService(onto);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  interactiveRebase: async (onto: string, todo: RebaseTodoEntry[]) => {
    try {
      return await interactiveRebaseService(onto, todo);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  abortRebase: async () => {
    try {
      await abortRebaseService();
      set({ rebasing: false, rebaseState: null, conflictFiles: [] });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  continueRebase: async () => {
    try {
      const result = await continueRebaseService();
      if (result.completed) {
        set({ rebasing: false, rebaseState: null, conflictFiles: [] });
      }
      return result;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  getRebaseTodo: async (onto: string) => {
    try {
      return await getRebaseTodoService(onto, REBASE_TODO_DEFAULT_LIMIT);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  cherryPick: async (oids: string[], mode: CherryPickMode) => {
    try {
      const result = await cherryPickService(oids, mode);
      if (result.completed) {
        set({ cherryPicking: false });
      } else {
        set({ cherryPicking: true });
      }
      return result;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchCherryPickState: async () => {
    try {
      const cherryPicking = await isCherryPickingService();
      set({ cherryPicking });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  abortCherryPick: async () => {
    try {
      await abortCherryPickService();
      set({ cherryPicking: false, conflictFiles: [] });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  continueCherryPick: async () => {
    try {
      const result = await continueCherryPickService();
      if (result.completed) {
        set({ cherryPicking: false, conflictFiles: [] });
      }
      return result;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  revertCommit: async (oid: string, mode: RevertMode) => {
    try {
      const result = await revertCommitService(oid, mode);
      if (result.completed) {
        set({ reverting: false });
      } else {
        set({ reverting: true });
      }
      return result;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchRevertState: async () => {
    try {
      const reverting = await isRevertingService();
      set({ reverting });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  abortRevert: async () => {
    try {
      await abortRevertService();
      set({ reverting: false, conflictFiles: [] });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  continueRevert: async () => {
    try {
      const result = await continueRevertService();
      if (result.completed) {
        set({ reverting: false, conflictFiles: [] });
      }
      return result;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  resetToCommit: async (oid: string, mode: ResetMode) => {
    try {
      return await resetToCommitService(oid, mode);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  resetFile: async (path: string, oid: string) => {
    try {
      await resetFileService(path, oid);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
