import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { SegmentedControl } from './controls/SegmentedControl';
import { SettingRow } from './controls/SettingRow';

export const SHORTCUT_PRESETS = [
  { label: '⌘⇧V', key: 9, modifiers: 0x0100 + 0x0200 },
  { label: '⌘⌥V', key: 9, modifiers: 0x0100 + 0x0800 },
  { label: '⌃⌥V', key: 9, modifiers: 0x1000 + 0x0800 },
  { label: '⌥Space', key: 49, modifiers: 0x0800 },
] as const;

export function ShortcutsSection(): React.JSX.Element {
  const { values, ready, updateShortcut } = useSettingsStore();
  const { colors } = useTheme();

  const currentPreset = SHORTCUT_PRESETS.find(
    p => p.key === values.shortcutKey && p.modifiers === values.shortcutModifiers
  );
  const selectedLabel = currentPreset ? currentPreset.label : values.shortcutLabel ?? '⌘⇧V';

  const options = SHORTCUT_PRESETS.map(preset => ({
    id: preset.label,
    label: preset.label,
    testID: `shortcut-option-${preset.label}`,
  }));

  const handleSelect = (label: string) => {
    const preset = SHORTCUT_PRESETS.find(p => p.label === label);
    if (preset) {
      updateShortcut(preset.key, preset.modifiers, preset.label);
    }
  };

  return (
    <View testID="shortcuts-section" style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Shortcuts</Text>

      <SettingRow
        label="Shortcut"
        hint="Global keyboard shortcut to toggle clipboard history."
        style={styles.firstRow}
      >
        <SegmentedControl
          testID="shortcut-selector"
          options={options}
          value={selectedLabel}
          onChange={handleSelect}
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

export default ShortcutsSection;
