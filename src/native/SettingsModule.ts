import { NativeModules } from 'react-native';

interface SettingsNative {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<boolean>;
  all(): Promise<Record<string, unknown>>;
}

const maybeNative = NativeModules.SettingsModule as SettingsNative | undefined;

if (!maybeNative) {
  throw new Error('SettingsModule native module not found');
}

// Reassigned so the guard above narrows for every function below; TS resets
// narrowing of a captured variable inside function declarations.
const native: SettingsNative = maybeNative;

export type ThemePreference = 'system' | 'light' | 'dark';
export type SystemTheme = 'light' | 'dark';
export type PreviewLines = 1 | 2 | 3;
export type PreviewLayout = 'popup' | 'side';
export type HistoryPosition = 'menubar' | 'mouse';

export const DEFAULT_SETTINGS = {
  maxItems: 500,
  maxAgeDays: 30,
  launchAtLogin: false,
  previewLines: 1 as PreviewLines,
  previewLayout: 'popup' as PreviewLayout,
  theme: 'system' as ThemePreference,
  systemTheme: 'light' as SystemTheme,
  historyPosition: 'menubar' as HistoryPosition,
  shortcutKey: 9, // Key.V
  shortcutModifiers: 0x0100 + 0x0200, // Mod.cmd + Mod.shift (768)
  shortcutLabel: '⌘⇧V',
  excludedApps: [
    'com.1password.1password',
    'com.agilebits.onepassword',
    'com.bitwarden.desktop',
    'org.keepassxc.keepassxc',
    'com.apple.keychainaccess',
  ] as string[],
};

export type Settings = {
  maxItems: number;
  maxAgeDays: number;
  launchAtLogin: boolean;
  previewLines: PreviewLines;
  previewLayout: PreviewLayout;
  theme: ThemePreference;
  systemTheme: SystemTheme;
  historyPosition: HistoryPosition;
  shortcutKey: number;
  shortcutModifiers: number;
  shortcutLabel: string;
  excludedApps: string[];
};

export type SettingsKey = keyof Settings;

export async function readSetting<K extends SettingsKey>(
  key: K
): Promise<Settings[K]> {
  const stored = await native.get(key);
  if (stored === null || stored === undefined) {
    return DEFAULT_SETTINGS[key];
  }
  if (key === 'theme') {
    if (stored !== 'light' && stored !== 'dark' && stored !== 'system') {
      return DEFAULT_SETTINGS.theme as Settings[K];
    }
  }
  if (key === 'systemTheme') {
    return (stored === 'dark' ? 'dark' : 'light') as Settings[K];
  }
  if (key === 'previewLines') {
    const num = Number(stored);
    if (num === 1 || num === 2 || num === 3) {
      return num as Settings[K];
    }
    return DEFAULT_SETTINGS.previewLines as Settings[K];
  }
  if (key === 'previewLayout') {
    if (stored === 'popup' || stored === 'side') {
      return stored as Settings[K];
    }
    return DEFAULT_SETTINGS.previewLayout as Settings[K];
  }
  if (key === 'historyPosition') {
    if (stored === 'mouse' || stored === 'menubar') {
      return stored as Settings[K];
    }
    return DEFAULT_SETTINGS.historyPosition as Settings[K];
  }
  if (key === 'shortcutKey') {
    const num = Number(stored);
    return (Number.isNaN(num) ? DEFAULT_SETTINGS.shortcutKey : num) as Settings[K];
  }
  if (key === 'shortcutModifiers') {
    const num = Number(stored);
    return (Number.isNaN(num) ? DEFAULT_SETTINGS.shortcutModifiers : num) as Settings[K];
  }
  if (key === 'shortcutLabel') {
    return (typeof stored === 'string' ? stored : DEFAULT_SETTINGS.shortcutLabel) as Settings[K];
  }
  return stored as Settings[K];
}

export async function writeSetting<K extends SettingsKey>(
  key: K,
  value: Settings[K]
): Promise<void> {
  await native.set(key, value);
}

export async function readAllSettings(): Promise<Partial<Settings>> {
  const stored = (await native.all()) as Partial<Settings>;
  const result: Partial<Settings> = {};

  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingsKey[]) {
    const value = stored[key];
    if (value !== undefined && value !== null) {
      if (key === 'theme') {
        if (value === 'light' || value === 'dark' || value === 'system') {
          result.theme = value;
        } else {
          result.theme = DEFAULT_SETTINGS.theme;
        }
      } else if (key === 'systemTheme') {
        result.systemTheme = value === 'dark' ? 'dark' : 'light';
      } else if (key === 'previewLines') {
        const num = Number(value);
        result.previewLines =
          num === 1 || num === 2 || num === 3
            ? (num as PreviewLines)
            : DEFAULT_SETTINGS.previewLines;
      } else if (key === 'previewLayout') {
        result.previewLayout =
          value === 'popup' || value === 'side'
            ? (value as PreviewLayout)
            : DEFAULT_SETTINGS.previewLayout;
      } else if (key === 'historyPosition') {
        result.historyPosition =
          value === 'mouse' || value === 'menubar'
            ? (value as HistoryPosition)
            : DEFAULT_SETTINGS.historyPosition;
      } else if (key === 'shortcutKey') {
        const num = Number(value);
        result.shortcutKey = Number.isNaN(num) ? DEFAULT_SETTINGS.shortcutKey : num;
      } else if (key === 'shortcutModifiers') {
        const num = Number(value);
        result.shortcutModifiers = Number.isNaN(num) ? DEFAULT_SETTINGS.shortcutModifiers : num;
      } else if (key === 'shortcutLabel') {
        result.shortcutLabel = typeof value === 'string' ? value : DEFAULT_SETTINGS.shortcutLabel;
      } else {
        result[key] = value as any;
      }
    }
  }

  return result;
}
