import { create } from "zustand";
import {
  cloneRepository as cloneRepositoryService,
  initRepository as initRepositoryService,
} from "../services/repo";
import type { TabInfo } from "../services/tab";
import {
  closeTab as closeTabService,
  getActiveTab,
  listTabs,
  openTab as openTabService,
  setActiveTab as setActiveTabService,
} from "../services/tab";

interface Tab {
  id: string;
  name: string;
  path: string;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

interface TabActions {
  openTab: (path: string) => Promise<void>;
  cloneInNewTab: (url: string, path: string) => Promise<void>;
  initInNewTab: (path: string, gitignoreTemplate?: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  setActiveTab: (tabId: string) => Promise<void>;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  fetchTabs: () => Promise<void>;
  fetchActiveTab: () => Promise<void>;
}

let nextTabCounter = 0;

function generateTabId(): string {
  nextTabCounter += 1;
  return `tab-${Date.now()}-${nextTabCounter}`;
}

export const DEFAULT_TAB_ID = "default";

export function getActiveTabId(): string {
  return useTabStore.getState().activeTabId ?? DEFAULT_TAB_ID;
}

export const useTabStore = create<TabState & TabActions>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: async (path: string) => {
    const tabId = generateTabId();
    await openTabService(path, tabId);
    const tabsResult = await listTabs();
    const tabs: Tab[] = tabsResult.map((t: TabInfo) => ({
      id: t.id,
      name: t.name,
      path: t.path,
    }));
    set({ tabs, activeTabId: tabId });
  },

  cloneInNewTab: async (url: string, path: string) => {
    const tabId = generateTabId();
    await cloneRepositoryService(url, path, tabId);
    const tabsResult = await listTabs();
    const tabs: Tab[] = tabsResult.map((t: TabInfo) => ({
      id: t.id,
      name: t.name,
      path: t.path,
    }));
    set({ tabs, activeTabId: tabId });
  },

  initInNewTab: async (path: string, gitignoreTemplate?: string) => {
    const tabId = generateTabId();
    await initRepositoryService(path, tabId, gitignoreTemplate);
    const tabsResult = await listTabs();
    const tabs: Tab[] = tabsResult.map((t: TabInfo) => ({
      id: t.id,
      name: t.name,
      path: t.path,
    }));
    set({ tabs, activeTabId: tabId });
  },

  closeTab: async (tabId: string) => {
    await closeTabService(tabId);
    const tabsResult = await listTabs();
    const tabs: Tab[] = tabsResult.map((t: TabInfo) => ({
      id: t.id,
      name: t.name,
      path: t.path,
    }));
    const activeTabId = await getActiveTab();
    set({ tabs, activeTabId });
  },

  setActiveTab: async (tabId: string) => {
    await setActiveTabService(tabId);
    set({ activeTabId: tabId });
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return { tabs: newTabs };
    });
  },

  fetchTabs: async () => {
    const tabsResult = await listTabs();
    const tabs: Tab[] = tabsResult.map((t: TabInfo) => ({
      id: t.id,
      name: t.name,
      path: t.path,
    }));
    set({ tabs });
  },

  fetchActiveTab: async () => {
    const activeTabId = await getActiveTab();
    set({ activeTabId });
  },
}));
