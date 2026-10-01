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

export const DEFAULT_SETTINGS = {
  maxItems: 500,
  maxAgeDays: 30,
} as const;

export type Settings = {
  maxItems: number;
  maxAgeDays: number;
};

export type SettingsKey = keyof Settings;

export async function readSetting<K extends SettingsKey>(
  key: K
): Promise<Settings[K]> {
  const stored = await native.get(key);
  if (stored === null || stored === undefined) {
    return DEFAULT_SETTINGS[key];
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
      result[key] = value;
    }
  }

  return result;
}
