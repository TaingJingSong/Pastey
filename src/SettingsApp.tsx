import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSettingsStore } from './store/settingsStore';

// Deliberately does not touch the history store: calling its init() here would
// start a second clipboard monitor and register the global hotkey twice.
function SettingsApp(): React.JSX.Element {
  const { values, ready, load, update } = useSettingsStore();
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>General</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Items kept</Text>
        <TextInput
          testID="max-items-input"
          style={styles.input}
          value={text}
          editable={ready}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
      </View>
      <Text style={styles.hint}>
        Unpinned history beyond this many items is removed when Pastey launches.
      </Text>

      <View style={[styles.row, styles.marginTopRow]}>
        <Text style={styles.label}>Launch at login</Text>
        <Switch
          testID="launch-at-login-switch"
          value={values.launchAtLogin}
          disabled={!ready}
          onValueChange={enabled => update('launchAtLogin', enabled)}
        />
      </View>
      <Text style={styles.hint}>
        Start Pastey automatically when logging into your Mac.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.heading}>Excluded Applications</Text>
      <Text style={styles.hint}>
        Copies made from these applications will not be saved (e.g. password managers).
      </Text>

      <View style={[styles.row, styles.addAppRow]}>
        <TextInput
          style={[styles.input, styles.addAppInput]}
          placeholder="e.g. com.apple.keychainaccess"
          placeholderTextColor="#8e8e93"
          value={newBundleId}
          editable={ready}
          onChangeText={setNewBundleId}
          onSubmitEditing={addExcludedApp}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          testID="add-excluded-app-button"
          style={styles.addButton}
          onPress={addExcludedApp}
          disabled={!ready || !newBundleId.trim()}
        >
          <Text style={[styles.addButtonText, (!ready || !newBundleId.trim()) && styles.disabledText]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.appList}>
        {(values.excludedApps || []).length === 0 ? (
          <Text style={styles.emptyListText}>No applications excluded</Text>
        ) : (
          (values.excludedApps || []).map(app => (
            <View key={app} style={styles.appRow}>
              <Text style={styles.appText} numberOfLines={1} ellipsizeMode="middle">
                {app}
              </Text>
              <TouchableOpacity
                testID={`remove-app-${app}`}
                style={styles.removeButton}
                onPress={() => removeExcludedApp(app)}
                disabled={!ready}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
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
    backgroundColor: '#fff',
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
  input: {
    width: 90,
    textAlign: 'right',
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d1d1d6',
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
    color: '#8e8e93',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5ea',
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
    backgroundColor: '#007aff',
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
  appList: {
    marginTop: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#fbfbfd',
    overflow: 'hidden',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f2',
  },
  appText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Menlo',
    color: '#1d1d1f',
    marginRight: 8,
  },
  removeButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#ececee',
  },
  removeButtonText: {
    fontSize: 11,
    color: '#ff3b30',
    fontWeight: '500',
  },
  emptyListText: {
    padding: 14,
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
});

export default SettingsApp;
