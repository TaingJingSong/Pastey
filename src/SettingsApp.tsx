import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSettingsStore } from './store/settingsStore';
import { useTheme } from './theme';

// Deliberately does not touch the history store: calling its init() here would
// start a second clipboard monitor and register the global hotkey twice.
function SettingsApp(): React.JSX.Element {
  const { values, ready, load, update } = useSettingsStore();
  const { colors } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const [newBundleId, setNewBundleId] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const text = draft ?? String(values.maxItems);

  const commit = () => {
    const parsed = Number.parseInt(text, 10);
    setDraft(null);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.max(1, Math.min(100000, parsed));
    if (clamped !== values.maxItems) {
      update('maxItems', clamped);
    }
  };

  const addExcludedApp = () => {
    const trimmed = newBundleId.trim();
    if (!trimmed) {
      return;
    }
    const current = values.excludedApps || [];
    if (!current.some(app => app.toLowerCase() === trimmed.toLowerCase())) {
      update('excludedApps', [...current, trimmed]);
    }
    setNewBundleId('');
  };

  const removeExcludedApp = (target: string) => {
    const current = values.excludedApps || [];
    update('excludedApps', current.filter(app => app !== target));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.windowBackground }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.heading, { color: colors.text }]}>General</Text>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text }]}>Appearance</Text>
        <View
          testID="theme-selector"
          style={[
            styles.themeSelector,
            {
              backgroundColor: colors.segmentBg,
              borderColor: colors.segmentBorder,
            },
          ]}
        >
          {(['system', 'light', 'dark'] as const).map(option => {
            const isSelected = (values.theme ?? 'system') === option;
            const label = option.charAt(0).toUpperCase() + option.slice(1);
            return (
              <Pressable
                key={option}
                testID={`theme-option-${option}`}
                style={({ pressed }) => [
                  styles.themeOption,
                  isSelected && [
                    styles.themeOptionSelected,
                    { backgroundColor: colors.segmentSelectedBg },
                  ],
                  pressed && !isSelected && styles.themeOptionPressed,
                ]}
                onPress={() => update('theme', option)}
                disabled={!ready}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected
                        ? colors.segmentSelectedText
                        : colors.secondaryText,
                    },
                    isSelected && styles.themeOptionTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Choose whether Pastey follows system appearance or stays light or dark.
      </Text>

      <View style={[styles.row, styles.marginTopRow]}>
        <Text style={[styles.label, { color: colors.text }]}>Preview lines</Text>
        <View
          testID="preview-lines-selector"
          style={[
            styles.themeSelector,
            {
              backgroundColor: colors.segmentBg,
              borderColor: colors.segmentBorder,
            },
          ]}
        >
          {([1, 2, 3] as const).map(option => {
            const isSelected = (values.previewLines ?? 1) === option;
            const label = `${option} ${option === 1 ? 'line' : 'lines'}`;
            return (
              <Pressable
                key={option}
                testID={`preview-lines-option-${option}`}
                style={({ pressed }) => [
                  styles.themeOption,
                  isSelected && [
                    styles.themeOptionSelected,
                    { backgroundColor: colors.segmentSelectedBg },
                  ],
                  pressed && !isSelected && styles.themeOptionPressed,
                ]}
                onPress={() => update('previewLines', option)}
                disabled={!ready}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected
                        ? colors.segmentSelectedText
                        : colors.secondaryText,
                    },
                    isSelected && styles.themeOptionTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Number of preview lines displayed for each clipboard item in history.
      </Text>

      <View style={[styles.row, styles.marginTopRow]}>
        <Text style={[styles.label, { color: colors.text }]}>Items kept</Text>
        <TextInput
          testID="max-items-input"
          style={[
            styles.input,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBg,
              color: colors.text,
            },
          ]}
          value={text}
          editable={ready}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
      </View>
      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Unpinned history beyond this many items is removed when Pastey launches.
      </Text>

      <View style={[styles.row, styles.marginTopRow]}>
        <Text style={[styles.label, { color: colors.text }]}>Launch at login</Text>
        <Switch
          testID="launch-at-login-switch"
          value={values.launchAtLogin}
          disabled={!ready}
          onValueChange={enabled => update('launchAtLogin', enabled)}
        />
      </View>
      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Start Pastey automatically when logging into your Mac.
      </Text>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <Text style={[styles.heading, { color: colors.text }]}>Excluded Applications</Text>
      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Copies made from these applications will not be saved (e.g. password managers).
      </Text>

      <View style={[styles.row, styles.addAppRow]}>
        <TextInput
          style={[
            styles.input,
            styles.addAppInput,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBg,
              color: colors.text,
            },
          ]}
          placeholder="e.g. com.apple.keychainaccess"
          placeholderTextColor={colors.placeholderText}
          value={newBundleId}
          editable={ready}
          onChangeText={setNewBundleId}
          onSubmitEditing={addExcludedApp}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          testID="add-excluded-app-button"
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.accent },
            (!ready || !newBundleId.trim()) && styles.disabledButton,
            pressed && ready && !!newBundleId.trim() && styles.pressedButton,
          ]}
          onPress={addExcludedApp}
          disabled={!ready || !newBundleId.trim()}
        >
          <Text style={[styles.addButtonText, (!ready || !newBundleId.trim()) && styles.disabledText]}>
            Add
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.appList,
          {
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardBg,
          },
        ]}
      >
        {(values.excludedApps || []).length === 0 ? (
          <Text style={[styles.emptyListText, { color: colors.secondaryText }]}>
            No applications excluded
          </Text>
        ) : (
          (values.excludedApps || []).map(app => (
            <View
              key={app}
              style={[
                styles.appRow,
                { borderBottomColor: colors.cardRowBorder },
              ]}
            >
              <Text
                style={[styles.appText, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {app}
              </Text>
              <Pressable
                testID={`remove-app-${app}`}
                style={({ pressed }) => [
                  styles.removeButton,
                  { backgroundColor: colors.removeBtnBg },
                  pressed && ready && styles.pressedRemoveButton,
                ]}
                onPress={() => removeExcludedApp(app)}
                disabled={!ready}
              >
                <Text
                  style={[
                    styles.removeButtonText,
                    { color: colors.removeBtnText },
                  ]}
                >
                  Remove
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marginTopRow: {
    marginTop: 14,
  },
  label: {
    fontSize: 13,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    padding: 2,
  },
  themeOption: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  themeOptionSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
  },
  themeOptionPressed: {
    opacity: 0.7,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  themeOptionTextSelected: {
    fontWeight: '600',
  },
  input: {
    width: 90,
    textAlign: 'right',
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  addAppRow: {
    marginTop: 12,
  },
  addAppInput: {
    flex: 1,
    textAlign: 'left',
  },
  addButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.75,
  },
  pressedRemoveButton: {
    opacity: 0.6,
  },
  appList: {
    marginTop: 12,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  appText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Menlo',
    marginRight: 8,
  },
  removeButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyListText: {
    padding: 14,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SettingsApp;
