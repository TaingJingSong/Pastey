import React from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { Popover } from '../native/PopoverModule';
import { HistoryPosition } from '../native/SettingsModule';
import { SegmentedControl } from './controls/SegmentedControl';
import { SettingRow } from './controls/SettingRow';

const HISTORY_POSITION_OPTIONS = [
  { id: 'menubar' as HistoryPosition, label: 'Menu bar' },
  { id: 'mouse' as HistoryPosition, label: 'Mouse position' },
] as const;

export function GeneralSection(): React.JSX.Element {
  const { values, ready, update } = useSettingsStore();
  const { colors } = useTheme();

  return (
    <View testID="general-section" style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>General</Text>

      <SettingRow
        label="Launch at login"
        hint="Start Pastey automatically when logging into your Mac."
        style={styles.firstRow}
      >
        <Switch
          testID="launch-at-login-switch"
          value={values.launchAtLogin}
          disabled={!ready}
          onValueChange={enabled => update('launchAtLogin', enabled)}
        />
      </SettingRow>

      <SettingRow
        label="Show history at"
        hint="Choose whether the history window opens from the menu bar or at your mouse cursor."
      >
        <SegmentedControl
          testID="history-position-selector"
          options={HISTORY_POSITION_OPTIONS}
          value={values.historyPosition ?? 'menubar'}
          onChange={val => update('historyPosition', val)}
          disabled={!ready}
        />
      </SettingRow>

      <SettingRow
        label="Window size"
        hint="Drag borders or corners of the history window to resize. Click above to reset."
      >
        <Pressable
          testID="reset-window-size-button"
          style={({ pressed }) => [
            styles.resetSizeButton,
            {
              borderColor: colors.cardBorder,
              backgroundColor: colors.cardBg,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => Popover.setContentSize(420, 520)}
          disabled={!ready}
        >
          <Text style={[styles.resetSizeText, { color: colors.text }]}>
            Reset Size (420 x 520)
          </Text>
        </Pressable>
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
  resetSizeButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  resetSizeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GeneralSection;
