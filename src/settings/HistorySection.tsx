import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { clearClips } from '../db/queries';
import { useHistoryStore } from '../store/historyStore';
import { NumberInput } from './controls/NumberInput';
import { SettingRow } from './controls/SettingRow';

export function HistorySection(): React.JSX.Element {
  const { values, ready, update } = useSettingsStore();
  const { colors } = useTheme();
  const [clearing, setClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const maxItemsDraftRef = useRef<string | null>(null);

  const handleMaxItemsChangeText = (text: string) => {
    maxItemsDraftRef.current = text;
  };

  const handleMaxItemsCommit = () => {
    const textToParse = maxItemsDraftRef.current ?? String(values.maxItems);
    maxItemsDraftRef.current = null;
    const parsed = Number.parseInt(textToParse, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.max(1, Math.min(100000, parsed));
    if (clamped !== values.maxItems) {
      update('maxItems', clamped);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await clearClips(false);
      if (useHistoryStore.getState().ready) {
        await useHistoryStore.getState().refresh();
      }
      setClearStatus('History cleared');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setClearStatus(null), 2500);
    } catch {
      setClearStatus('Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  return (
    <View testID="history-section" style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>History</Text>

      <SettingRow
        label="Items kept"
        hint="Unpinned history beyond this many items is removed when Pastey launches."
        style={styles.firstRow}
      >
        <NumberInput
          testID="max-items-input"
          value={values.maxItems}
          min={1}
          max={100000}
          onChangeText={handleMaxItemsChangeText}
          onSubmitEditing={handleMaxItemsCommit}
          onBlur={handleMaxItemsCommit}
          onChange={val => update('maxItems', val)}
          disabled={!ready}
        />
      </SettingRow>

      <SettingRow
        label="Auto-expire"
        hint="Unpinned items older than this are removed when Pastey launches."
      >
        <NumberInput
          testID="max-age-days-input"
          value={values.maxAgeDays ?? 30}
          min={1}
          max={365}
          unit="days"
          onChange={val => update('maxAgeDays', val)}
          disabled={!ready}
        />
      </SettingRow>

      <SettingRow
        label="Capture images"
        hint="Save copied images from clipboard to history."
      >
        <Switch
          testID="capture-images-switch"
          value={values.captureImages ?? true}
          disabled={!ready}
          onValueChange={enabled => update('captureImages', enabled)}
        />
      </SettingRow>

      <SettingRow
        label="Max image size"
        hint="Skip clipboard images larger than this size."
      >
        <NumberInput
          testID="max-image-mb-input"
          value={values.maxImageMb ?? 10}
          min={1}
          max={100}
          unit="MB"
          onChange={val => update('maxImageMb', val)}
          disabled={!ready}
        />
      </SettingRow>

      <SettingRow
        label="Clear History"
        hint="Removes all unpinned items from clipboard history."
      >
        <View style={styles.clearRow}>
          {clearStatus ? (
            <Text style={[styles.statusText, { color: colors.secondaryText }]}>
              {clearStatus}
            </Text>
          ) : null}
          <Pressable
            testID="clear-history-button"
            style={({ pressed }) => [
              styles.clearButton,
              {
                borderColor: colors.cardBorder,
                backgroundColor: colors.cardBg,
              },
              pressed && { opacity: 0.7 },
              clearing && { opacity: 0.5 },
            ]}
            onPress={handleClearHistory}
            disabled={!ready || clearing}
          >
            <Text style={[styles.clearButtonText, { color: colors.removeBtnText }]}>
              Clear History
            </Text>
          </Pressable>
        </View>
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
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginRight: 8,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HistorySection;
