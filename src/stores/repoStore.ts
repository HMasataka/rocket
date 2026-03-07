import { create } from "zustand";
import type { RecentRepo } from "../services/repo";
import {
  cloneRepository as cloneRepositoryService,
  getRecentRepos,
  initRepository as initRepositoryService,
  openRepository as openRepositoryService,
  removeRecentRepo as removeRecentRepoService,
} from "../services/repo";
import { getActiveTabId } from "./tabStore";

interface RepoState {
  recentRepos: RecentRepo[];
  loading: boolean;
  error: string | null;
}

interface RepoActions {
  fetchRecentRepos: () => Promise<void>;
  openRepository: (path: string) => Promise<void>;
  initRepository: (path: string, gitignoreTemplate?: string) => Promise<void>;
  cloneRepository: (url: string, path: string) => Promise<void>;
  removeRecentRepo: (path: string) => Promise<void>;
}

export const useRepoStore = create<RepoState & RepoActions>((set) => ({
  recentRepos: [],
  loading: false,
  error: null,

  fetchRecentRepos: async () => {
    try {
      const recentRepos = await getRecentRepos();
      set({ recentRepos });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  openRepository: async (path: string) => {
    set({ loading: true, error: null });
    try {
      await openRepositoryService(path, getActiveTabId());
      set({ loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  initRepository: async (path: string, gitignoreTemplate?: string) => {
    set({ loading: true, error: null });
    try {
      await initRepositoryService(path, getActiveTabId(), gitignoreTemplate);
      set({ loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  cloneRepository: async (url: string, path: string) => {
    set({ loading: true, error: null });
    try {
      await cloneRepositoryService(url, path, getActiveTabId());
      set({ loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  removeRecentRepo: async (path: string) => {
    try {
      await removeRecentRepoService(path);
      set((state) => ({
        recentRepos: state.recentRepos.filter((r) => r.path !== path),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },
}));
