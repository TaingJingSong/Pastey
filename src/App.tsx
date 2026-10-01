import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { HistoryList } from './components/HistoryList';
import { SearchBar } from './components/SearchBar';
import { useHistoryStore } from './store/historyStore';
import { useSettingsStore } from './store/settingsStore';
import { useTheme } from './theme';
import { Popover } from './native/PopoverModule';
import { SettingsWindow } from './native/SettingsWindowModule';

interface AppProps {
  mode?: string;
}

function App(props: AppProps): React.JSX.Element {
  const {
    items,
    query,
    selectedIndex,
    init,
    toggle,
    remove,
    clear,
    search,
    copy,
    moveSelection,
    confirmSelection,
  } = useHistoryStore();

  const { values, ready: settingsReady, load: loadSettings, update: updateSetting } =
    useSettingsStore();
  const { colors } = useTheme();

  const searchInputRef = useRef<TextInput>(null);
  const isPopover = props.mode === 'popover' || true;
  const previewLines = values.previewLines ?? 1;

  useEffect(() => {
    if (!settingsReady) {
      loadSettings();
    }
  }, [settingsReady, loadSettings]);

  useEffect(() => {
    init();
    Popover.attachKeyMonitor();

    const keySub = Popover.onKey(({ key }) => {
      if (key === 'down') {
        moveSelection(1);
      } else if (key === 'up') {
        moveSelection(-1);
      } else if (key === 'enter') {
        confirmSelection();
      } else if (key === 'escape') {
        Popover.hide();
      }
    });

    const showSub = Popover.onShow(() => {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    });

    const themeSub = Popover.onSystemThemeChanged(({ systemTheme }) => {
      useSettingsStore.getState().setSystemTheme(systemTheme);
    });

    return () => {
      keySub.remove();
      showSub.remove();
      themeSub.remove();
    };
  }, [init, moveSelection, confirmSelection]);

  const handleClearHistory = () => {
    const hasPinned = items.some(i => i.pinned === 1);
    if (hasPinned) {
      Alert.alert(
        'Clear Clipboard History',
        'Do you want to clear unpinned items or all items including pinned?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Unpinned',
            onPress: () => clear(false),
          },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: () => clear(true),
          },
        ]
      );
    } else {
      Alert.alert(
        'Clear Clipboard History',
        'Are you sure you want to clear clipboard history?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => clear(true),
          },
        ]
      );
    }
  };

  const handleTogglePreviewLines = () => {
    const next = previewLines === 1 ? 2 : previewLines === 2 ? 3 : 1;
    updateSetting('previewLines', next as 1 | 2 | 3);
  };

  const handleOpenSettings = async () => {
    await SettingsWindow.open();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.windowBackground },
        isPopover && styles.popoverContainer,
      ]}
    >
      <SearchBar
        inputRef={searchInputRef}
        onSearch={search}
        compact={isPopover}
        previewLines={previewLines}
        onArrowDown={() => moveSelection(1)}
        onArrowUp={() => moveSelection(-1)}
        onSubmit={confirmSelection}
        onClearHistory={handleClearHistory}
        onOpenSettings={handleOpenSettings}
        onTogglePreviewLines={handleTogglePreviewLines}
      />
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.empty, { color: colors.secondaryText }]}>
            {query ? 'No matching clipboard history' : 'Clipboard history is empty'}
          </Text>
        </View>
      ) : (
        <HistoryList
          items={items}
          selectedIndex={selectedIndex}
          compact={isPopover}
          previewLines={previewLines}
          onCopy={copy}
          onDelete={remove}
          onTogglePin={toggle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  popoverContainer: {
    width: 420,
    height: 520,
    padding: 0,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  empty: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default App;
