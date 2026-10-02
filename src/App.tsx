import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { HistoryList } from './components/HistoryList';
import { SearchBar } from './components/SearchBar';
import { useHistoryStore } from './store/historyStore';
import { useSettingsStore } from './store/settingsStore';
import { usePreviewStore } from './store/previewStore';
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
  const { item: previewItem, isOpen: isPreviewOpen, openPreview, togglePreview } =
    usePreviewStore();
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
        if (usePreviewStore.getState().isOpen) {
          const nextIndex = Math.min(
            items.length - 1,
            useHistoryStore.getState().selectedIndex + 1
          );
          const nextItem = items[nextIndex];
          if (nextItem) {
            usePreviewStore.getState().openPreview(nextItem);
          }
        }
      } else if (key === 'up') {
        moveSelection(-1);
        if (usePreviewStore.getState().isOpen) {
          const prevIndex = Math.max(
            0,
            useHistoryStore.getState().selectedIndex - 1
          );
          const prevItem = items[prevIndex];
          if (prevItem) {
            usePreviewStore.getState().openPreview(prevItem);
          }
        }
      } else if (key === 'enter') {
        confirmSelection();
        usePreviewStore.getState().closePreview();
      } else if (key === 'escape') {
        if (usePreviewStore.getState().isOpen) {
          usePreviewStore.getState().closePreview();
        } else {
          Popover.hide();
        }
      }
    });

    const showSub = Popover.onShow(() => {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    });

    const hideSub = Popover.onHide(() => {
      usePreviewStore.getState().closePreview();
    });

    const themeSub = Popover.onSystemThemeChanged(({ systemTheme }) => {
      useSettingsStore.getState().setSystemTheme(systemTheme);
    });

    return () => {
      keySub.remove();
      showSub.remove();
      hideSub.remove();
      themeSub.remove();
    };
  }, [init, moveSelection, confirmSelection, items]);

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
          previewItemId={isPreviewOpen ? previewItem?.id : null}
          onCopy={copy}
          onDelete={remove}
          onTogglePin={toggle}
          onPreview={item => togglePreview(item)}
          onPreviewHover={item => openPreview(item)}
          onPreviewHoverEnd={item => usePreviewStore.getState().closeHoverPreview(item.id)}
          onPreviewHoverStart={item => usePreviewStore.getState().cancelCloseHoverTimer(item.id)}
        />
      )}
      {items.length > 0 && isPopover && (
        <View testID="resize-grip" style={styles.resizeGrip} pointerEvents="none">
          <View style={[styles.resizeBar, styles.resizeBarWide, { backgroundColor: colors.secondaryText }]} />
          <View style={[styles.resizeBar, styles.resizeBarMedium, { backgroundColor: colors.secondaryText }]} />
          <View style={[styles.resizeBar, styles.resizeBarNarrow, { backgroundColor: colors.secondaryText }]} />
        </View>
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
    flex: 1,
    width: '100%',
    height: '100%',
    minWidth: 320,
    minHeight: 360,
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
  resizeGrip: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 2,
    gap: 1.5,
    opacity: 0.35,
  },
  resizeBar: {
    height: 1,
    borderRadius: 0.5,
  },
  resizeBarWide: {
    width: 10,
  },
  resizeBarMedium: {
    width: 6,
  },
  resizeBarNarrow: {
    width: 2,
  },
});

export default App;
