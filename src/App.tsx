import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { HistoryList } from './components/HistoryList';
import { SearchBar } from './components/SearchBar';
import { ItemPreview } from './components/ItemPreview';
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

  const [previewItemId, setPreviewItemId] = useState<number | null>(null);

  const showSidePreview = values.previewLayout === 'side';
  const selectedItem = items[selectedIndex] ?? null;
  const previewItem =
    previewItemId !== null ? items.find(i => i.id === previewItemId) ?? null : null;

  useEffect(() => {
    if (!settingsReady) {
      loadSettings();
    }
  }, [settingsReady, loadSettings]);

  useEffect(() => {
    const isWide = showSidePreview;
    Popover.setContentSize(isWide ? 760 : 420, 520).catch(() => {});
  }, [showSidePreview]);

  useEffect(() => {
    init();
    Popover.attachKeyMonitor();

    const keySub = Popover.onKey(({ key }) => {
      if (previewItemId !== null) {
        if (key === 'escape') {
          setPreviewItemId(null);
        } else if (key === 'enter') {
          const current = items.find(i => i.id === previewItemId);
          if (current) {
            copy(current.id);
          }
          setPreviewItemId(null);
        } else if (key === 'down') {
          const curIndex = items.findIndex(i => i.id === previewItemId);
          if (curIndex < items.length - 1) {
            const nextItem = items[curIndex + 1];
            if (nextItem) {
              setPreviewItemId(nextItem.id);
              moveSelection(1);
            }
          }
        } else if (key === 'up') {
          const curIndex = items.findIndex(i => i.id === previewItemId);
          if (curIndex > 0) {
            const prevItem = items[curIndex - 1];
            if (prevItem) {
              setPreviewItemId(prevItem.id);
              moveSelection(-1);
            }
          }
        }
        return;
      }

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
  }, [init, moveSelection, confirmSelection, previewItemId, items, copy]);

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

  const handleToggleSidePreview = () => {
    const next = showSidePreview ? 'popup' : 'side';
    updateSetting('previewLayout', next);
  };

  const handleOpenSettings = async () => {
    await SettingsWindow.open();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.windowBackground },
        isPopover && [
          styles.popoverContainer,
          showSidePreview && styles.popoverContainerWide,
        ],
      ]}
    >
      <View style={styles.mainRow}>
        <View
          style={[
            styles.listSection,
            showSidePreview && styles.listSectionSplit,
          ]}
        >
          <SearchBar
            inputRef={searchInputRef}
            onSearch={search}
            compact={isPopover}
            previewLines={previewLines}
            sidePreviewActive={showSidePreview}
            onToggleSidePreview={handleToggleSidePreview}
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
              onPreview={id => setPreviewItemId(id)}
            />
          )}
        </View>

        {showSidePreview && (
          <View style={styles.sidePreviewSection}>
            <ItemPreview
              item={selectedItem}
              onCopy={copy}
              onTogglePin={toggle}
            />
          </View>
        )}
      </View>

      {/* Quick Look Popup Window Modal */}
      {previewItem && (
        <View testID="preview-popup-modal" style={styles.modalOverlay}>
          <Pressable
            testID="preview-popup-backdrop"
            style={[styles.modalBackdrop, { backgroundColor: colors.overlayBg }]}
            onPress={() => setPreviewItemId(null)}
          />
          <View style={styles.modalCardWrapper}>
            <ItemPreview
              item={previewItem}
              onCopy={id => {
                copy(id);
                setPreviewItemId(null);
              }}
              onTogglePin={toggle}
              onClose={() => setPreviewItemId(null)}
              isPopup
            />
          </View>
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
    width: 420,
    height: 520,
    padding: 0,
    backgroundColor: 'transparent',
  },
  popoverContainerWide: {
    width: 760,
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  listSection: {
    flex: 1,
    height: '100%',
  },
  listSectionSplit: {
    width: 380,
    flex: 0,
  },
  sidePreviewSection: {
    flex: 1,
    height: '100%',
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 999,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCardWrapper: {
    width: '100%',
    height: '100%',
    maxWidth: 520,
    maxHeight: 460,
    zIndex: 1000,
  },
});

export default App;
