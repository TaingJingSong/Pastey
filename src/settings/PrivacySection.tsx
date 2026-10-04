import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';

export function PrivacySection(): React.JSX.Element {
  const { values, ready, update } = useSettingsStore();
  const { colors } = useTheme();
  const [newBundleId, setNewBundleId] = useState('');

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
    <View testID="privacy-section" style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Excluded Applications
      </Text>
      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Copies made from these applications will not be saved (e.g. password managers).
      </Text>

      <View style={styles.addAppRow}>
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
          <Text
            style={[
              styles.addButtonText,
              (!ready || !newBundleId.trim()) && styles.disabledText,
            ]}
          >
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
  hint: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  addAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  input: {
    fontSize: 13,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
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

export default PrivacySection;
