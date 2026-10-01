import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  readAllSettings,
  writeSetting,
  Settings,
  SettingsKey,
} from '../native/SettingsModule';

export interface SettingsState {
  values: Settings;
  ready: boolean;
  load: () => Promise<void>;
  update: <K extends SettingsKey>(key: K, value: Settings[K]) => Promise<void>;
}

// Module-level singleton: the settings window and the popover share this
// instance because they share one JS runtime.
export const useSettingsStore = create<SettingsState>(set => ({
  values: { ...DEFAULT_SETTINGS },
  ready: false,

  load: async () => {
    const stored = await readAllSettings();
    set({ values: { ...DEFAULT_SETTINGS, ...stored }, ready: true });
  },

  update: async (key, value) => {
    // Optimistic, with no read-back: this store is the live view both roots
    // share, so re-reading native here would only risk clobbering the new
    // value with a stale one.
    set(state => ({ values: { ...state.values, [key]: value } }));
    await writeSetting(key, value);
  },
}));
