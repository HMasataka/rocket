import { create } from "zustand";
import type { FileDiff } from "../services/git";
import type {
  BlameResult,
  CommitDetail,
  CommitGraphRow,
  CommitInfo,
  LogFilter,
} from "../services/history";
import {
  getBlame,
  getCommitDetail,
  getCommitFileDiff,
  getCommitLog,
  getFileHistory,
} from "../services/history";

interface HistoryState {
  commits: CommitInfo[];
  graph: CommitGraphRow[];
  selectedCommitOid: string | null;
  commitDetail: CommitDetail | null;
  filter: LogFilter;
  filterOpen: boolean;
  loading: boolean;
  error: string | null;
  blameResult: BlameResult | null;
  blameLoading: boolean;
  fileHistoryCommits: CommitInfo[];
  fileHistorySelectedOid: string | null;
  fileHistoryDetail: CommitDetail | null;
  fileHistoryLoading: boolean;
  expandedFileDiffs: Record<string, FileDiff[]>;
}

interface HistoryActions {
  fetchCommitLog: (limit: number, skip: number) => Promise<void>;
  selectCommit: (oid: string) => Promise<void>;
  setFilter: (filter: LogFilter) => void;
  toggleFilter: () => void;
  clearFilter: () => void;
  fetchFileDiff: (oid: string, path: string) => Promise<void>;
  collapseFileDiff: (path: string) => void;
  fetchBlame: (path: string, commitOid: string | null) => Promise<void>;
  fetchFileHistory: (
    path: string,
    limit: number,
    skip: number,
  ) => Promise<void>;
  selectFileHistoryCommit: (oid: string) => Promise<void>;
  clearHistory: () => void;
  clearBlame: () => void;
  clearFileHistory: () => void;
  clearError: () => void;
}

const EMPTY_FILTER: LogFilter = {
  author: null,
  since: null,
  until: null,
  message: null,
  path: null,
};

export const useHistoryStore = create<HistoryState & HistoryActions>((set) => ({
  commits: [],
  graph: [],
  selectedCommitOid: null,
  commitDetail: null,
  filter: { ...EMPTY_FILTER },
  filterOpen: false,
  loading: false,
  error: null,
  blameResult: null,
  blameLoading: false,
  fileHistoryCommits: [],
  fileHistorySelectedOid: null,
  fileHistoryDetail: null,
  fileHistoryLoading: false,
  expandedFileDiffs: {},

  fetchCommitLog: async (limit: number, skip: number) => {
    set({ loading: true, error: null });
    try {
      const state = useHistoryStore.getState();
      const result = await getCommitLog(state.filter, limit, skip);
      set({
        commits: result.commits,
        graph: result.graph,
        loading: false,
      });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  selectCommit: async (oid: string) => {
    set({ selectedCommitOid: oid, expandedFileDiffs: {} });
    try {
      const detail = await getCommitDetail(oid);
      set({ commitDetail: detail });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  setFilter: (filter: LogFilter) => {
    set({ filter });
  },

  toggleFilter: () => {
    set((state) => ({ filterOpen: !state.filterOpen }));
  },

  clearFilter: () => {
    set({ filter: { ...EMPTY_FILTER } });
  },

  fetchFileDiff: async (oid: string, path: string) => {
    try {
      const diffs = await getCommitFileDiff(oid, path);
      set((state) => ({
        expandedFileDiffs: { ...state.expandedFileDiffs, [path]: diffs },
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  collapseFileDiff: (path: string) => {
    set((state) => {
      const next = { ...state.expandedFileDiffs };
      delete next[path];
      return { expandedFileDiffs: next };
    });
  },

  fetchBlame: async (path: string, commitOid: string | null) => {
    set({ blameLoading: true });
    try {
      const result = await getBlame(path, commitOid);
      set({ blameResult: result, blameLoading: false });
    } catch (e) {
      set({ error: String(e), blameLoading: false });
      throw e;
    }
  },

  fetchFileHistory: async (path: string, limit: number, skip: number) => {
    set({ fileHistoryLoading: true });
    try {
      const commits = await getFileHistory(path, limit, skip);
      set({ fileHistoryCommits: commits, fileHistoryLoading: false });
    } catch (e) {
      set({ error: String(e), fileHistoryLoading: false });
      throw e;
    }
  },

  selectFileHistoryCommit: async (oid: string) => {
    set({ fileHistorySelectedOid: oid });
    try {
      const detail = await getCommitDetail(oid);
      set({ fileHistoryDetail: detail });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearHistory: () => {
    set({
      commits: [],
      graph: [],
      selectedCommitOid: null,
      commitDetail: null,
      expandedFileDiffs: {},
    });
  },

  clearBlame: () => {
    set({ blameResult: null });
  },

  clearFileHistory: () => {
    set({
      fileHistoryCommits: [],
      fileHistorySelectedOid: null,
      fileHistoryDetail: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
