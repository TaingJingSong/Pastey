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

export const DEFAULT_SETTINGS = {
  maxItems: 500,
  maxAgeDays: 30,
  launchAtLogin: false,
  theme: 'system' as ThemePreference,
  systemTheme: 'light' as SystemTheme,
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
  theme: ThemePreference;
  systemTheme: SystemTheme;
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
      } else {
        result[key] = value as any;
      }
    }
  }

  return result;
}
