import { create } from "zustand";
import type { AppConfig, AppearanceConfig } from "../services/config";
import { getConfig, saveConfig as saveConfigService } from "../services/config";

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

interface ConfigActions {
  loadConfig: () => Promise<void>;
  saveConfig: (config: AppConfig) => Promise<void>;
  updateAppearance: (appearance: AppearanceConfig) => Promise<void>;
}

export const useConfigStore = create<ConfigState & ConfigActions>(
  (set, get) => ({
    config: null,
    loading: false,
    error: null,

    loadConfig: async () => {
      set({ loading: true, error: null });
      try {
        const config = await getConfig();
        set({ config, loading: false });
      } catch (e) {
        set({ error: String(e), loading: false });
        throw e;
      }
    },

    saveConfig: async (config: AppConfig) => {
      try {
        await saveConfigService(config);
        set({ config });
      } catch (e) {
        set({ error: String(e) });
        throw e;
      }
    },

    updateAppearance: async (appearance: AppearanceConfig) => {
      const current = get().config;
      if (!current) return;
      const updated = { ...current, appearance };
      try {
        await saveConfigService(updated);
        set({ config: updated });
      } catch (e) {
        set({ error: String(e) });
        throw e;
      }
    },
  }),
);
