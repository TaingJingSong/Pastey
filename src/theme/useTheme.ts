import { Appearance, useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import {
  lightColors,
  darkColors,
  ThemeColors,
  ThemePreference,
  ResolvedTheme,
} from './colors';

export function syncAppearance(theme: ThemePreference) {
  try {
    if (typeof Appearance !== 'undefined' && typeof Appearance.setColorScheme === 'function') {
      // In react-native-macos, setColorScheme(null) assigns { colorScheme: null }
      // to the internal state, which breaks subsequent getColorScheme() calls.
      // Explicitly set overrides for 'light' and 'dark', but for 'system',
      // allow native NSApp.appearance to control the system appearance.
      if (theme === 'light' || theme === 'dark') {
        Appearance.setColorScheme(theme);
      }
    }
  } catch {
    // In headless or test environments where NativeAppearance is not linked
  }
}

export function useTheme(): {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  isDark: boolean;
} {
  const themePreference: ThemePreference = useSettingsStore(
    s => s.values.theme ?? 'system'
  );
  const storeSystemTheme = useSettingsStore(s => s.values.systemTheme);
  const systemColorScheme = useColorScheme();

  const effectiveSystemTheme: ResolvedTheme =
    storeSystemTheme || (systemColorScheme === 'dark' ? 'dark' : 'light');

  const resolvedTheme: ResolvedTheme =
    themePreference === 'system'
      ? effectiveSystemTheme
      : themePreference;

  return {
    themePreference,
    resolvedTheme,
    colors: resolvedTheme === 'dark' ? darkColors : lightColors,
    isDark: resolvedTheme === 'dark',
  };
}
