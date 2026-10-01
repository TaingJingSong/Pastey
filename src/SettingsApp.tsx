import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSettingsStore } from './store/settingsStore';

// Deliberately does not touch the history store: calling its init() here would
// start a second clipboard monitor and register the global hotkey twice.
function SettingsApp(): React.JSX.Element {
  const { values, ready, load, update } = useSettingsStore();
  const [draft, setDraft] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>General</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Items kept</Text>
        <TextInput
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 10,
    fontSize: 11,
    color: '#8e8e93',
  },
});

export default SettingsApp;
