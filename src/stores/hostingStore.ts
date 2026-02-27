import { create } from "zustand";
import type {
  HostingInfo,
  Issue,
  PrDetail,
  PullRequest,
} from "../services/hosting";
import {
  detectHostingProvider,
  getDefaultBranch,
  getPullRequestDetail,
  listIssues,
  listPullRequests,
} from "../services/hosting";

type HostingTab = "pulls" | "issues";

interface HostingState {
  hostingInfo: HostingInfo | null;
  defaultBranch: string | null;
  pullRequests: PullRequest[];
  issues: Issue[];
  selectedPrDetail: PrDetail | null;
  selectedPrNumber: number | null;
  activeTab: HostingTab;
  loading: boolean;
  error: string | null;
}

interface HostingActions {
  fetchHostingInfo: () => Promise<void>;
  fetchDefaultBranch: () => Promise<void>;
  fetchPullRequests: () => Promise<void>;
  fetchIssues: () => Promise<void>;
  selectPr: (number: number) => Promise<void>;
  setActiveTab: (tab: HostingTab) => void;
  clearError: () => void;
}

export const useHostingStore = create<HostingState & HostingActions>((set) => ({
  hostingInfo: null,
  defaultBranch: null,
  pullRequests: [],
  issues: [],
  selectedPrDetail: null,
  selectedPrNumber: null,
  activeTab: "pulls",
  loading: false,
  error: null,

  fetchHostingInfo: async () => {
    set({ loading: true, error: null });
    try {
      const hostingInfo = await detectHostingProvider();
      set({ hostingInfo, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  fetchDefaultBranch: async () => {
    try {
      const defaultBranch = await getDefaultBranch();
      set({ defaultBranch });
    } catch (_e) {
      // デフォルトブランチ取得失敗は致命的ではないのでエラーを設定しない
      set({ defaultBranch: null });
    }
  },

  fetchPullRequests: async () => {
    set({ loading: true, error: null });
    try {
      const pullRequests = await listPullRequests();
      set({ pullRequests, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  fetchIssues: async () => {
    set({ loading: true, error: null });
    try {
      const issues = await listIssues();
      set({ issues, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  selectPr: async (number: number) => {
    set({ selectedPrNumber: number, loading: true });
    try {
      const selectedPrDetail = await getPullRequestDetail(number);
      set({ selectedPrDetail, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  setActiveTab: (tab: HostingTab) => {
    set({ activeTab: tab });
  },

  clearError: () => {
    set({ error: null });
  },
}));
