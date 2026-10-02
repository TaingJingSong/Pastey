import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  readAllSettings,
  writeSetting,
  Settings,
  SettingsKey,
  ThemePreference,
} from '../native/SettingsModule';
import { syncAppearance } from '../theme/useTheme';

export interface SettingsState {
  values: Settings;
  ready: boolean;
  load: () => Promise<void>;
  update: <K extends SettingsKey>(key: K, value: Settings[K]) => Promise<void>;
  updateShortcut: (keyCode: number, modifiers: number, label: string) => Promise<void>;
  setSystemTheme: (systemTheme: 'light' | 'dark') => void;
}

// Module-level singleton: the settings window and the popover share this
// instance because they share one JS runtime.
export const useSettingsStore = create<SettingsState>(set => ({
  values: { ...DEFAULT_SETTINGS },
  ready: false,

  load: async () => {
    const stored = await readAllSettings();
    const values: Settings = { ...DEFAULT_SETTINGS, ...stored };
    syncAppearance(values.theme);
    set({ values, ready: true });
  },

  update: async (key, value) => {
    // Optimistic, with no read-back: this store is the live view both roots
    // share, so re-reading native here would only risk clobbering the new
    // value with a stale one.
    set(state => ({ values: { ...state.values, [key]: value } }));
    if (key === 'theme') {
      syncAppearance(value as ThemePreference);
    }
    await writeSetting(key, value);
  },

  updateShortcut: async (keyCode, modifiers, label) => {
    set(state => ({
      values: {
        ...state.values,
        shortcutKey: keyCode,
        shortcutModifiers: modifiers,
        shortcutLabel: label,
      },
    }));
    try {
      const { Hotkey } = require('../native/HotkeyModule');
      await Hotkey.register(keyCode, modifiers);
    } catch {
      // Hotkey registration error handling
    }
    await writeSetting('shortcutKey', keyCode);
    await writeSetting('shortcutModifiers', modifiers);
    await writeSetting('shortcutLabel', label);
  },

  setSystemTheme: (systemTheme: 'light' | 'dark') => {
    set(state => ({ values: { ...state.values, systemTheme } }));
  },
}));
