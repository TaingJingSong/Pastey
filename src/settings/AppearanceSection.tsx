import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { PreviewLines, ThemePreference } from '../native/SettingsModule';
import { SegmentedControl } from './controls/SegmentedControl';
import { SettingRow } from './controls/SettingRow';

const THEME_OPTIONS = [
  { id: 'system' as ThemePreference, label: 'System' },
  { id: 'light' as ThemePreference, label: 'Light' },
  { id: 'dark' as ThemePreference, label: 'Dark' },
] as const;

const PREVIEW_LINES_OPTIONS = [
  { id: 1 as PreviewLines, label: '1 line' },
  { id: 2 as PreviewLines, label: '2 lines' },
  { id: 3 as PreviewLines, label: '3 lines' },
] as const;

export function AppearanceSection(): React.JSX.Element {
  const { values, ready, update } = useSettingsStore();
  const { colors } = useTheme();

  return (
    <View testID="appearance-section" style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

      <SettingRow
        label="Theme"
        hint="Choose whether Pastey follows system appearance or stays light or dark."
        style={styles.firstRow}
      >
        <SegmentedControl
          testID="theme-selector"
          options={THEME_OPTIONS}
          value={values.theme ?? 'system'}
          onChange={val => update('theme', val)}
          disabled={!ready}
        />
      </SettingRow>

      <SettingRow
        label="Preview lines"
        hint="Number of preview lines displayed for each clipboard item in history."
      >
        <SegmentedControl
          testID="preview-lines-selector"
          options={PREVIEW_LINES_OPTIONS}
          value={values.previewLines ?? 1}
          onChange={val => update('previewLines', val)}
          disabled={!ready}
        />
      </SettingRow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  firstRow: {
    marginTop: 12,
  },
});

export default AppearanceSection;
