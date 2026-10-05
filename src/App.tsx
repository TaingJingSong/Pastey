import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  position?: 'menubar' | 'mouse';
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
    quickPaste,
  } = useHistoryStore();

  const { values, ready: settingsReady, load: loadSettings, update: updateSetting } =
    useSettingsStore();
  const { item: previewItem, isOpen: isPreviewOpen, openPreview, togglePreview } =
    usePreviewStore();
  const { colors } = useTheme();

  const [displayPosition, setDisplayPosition] = useState<'menubar' | 'mouse'>(
    props.position ?? 'menubar'
  );
  const isResizable = displayPosition === 'mouse';

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

    const keySub = Popover.onKey(({ key, ...rest }) => {
      if (key === 'quickPaste') {
        const idx = (rest as { index: number }).index;
        if (idx >= 1 && idx <= 9) {
          quickPaste(idx - 1);
        }
        return;
      }

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

    const showSub = Popover.onShow(payload => {
      if (payload?.position === 'mouse' || payload?.position === 'menubar') {
        setDisplayPosition(payload.position);
      }
      if (payload?.position === 'menubar') {
        currentSizeRef.current = { width: 420, height: 520 };
      }
      useHistoryStore.getState().refresh();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    });

    const hideSub = Popover.onHide(() => {
      usePreviewStore.getState().closePreview();
      setDisplayPosition('menubar');
      currentSizeRef.current = { width: 420, height: 520 };
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
  }, [init, moveSelection, confirmSelection, quickPaste, items]);

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

  const currentSizeRef = useRef({ width: 420, height: 520 });
  const startDragRef = useRef({ width: 420, height: 520 });
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const rafId = useRef<number | null>(null);

  const applySize = (width: number, height: number) => {
    currentSizeRef.current = { width, height };
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        Popover.setContentSize(currentSizeRef.current.width, currentSizeRef.current.height);
      });
    }
  };

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    if (isResizingRef.current) {
      return;
    }
    const { width, height } = e.nativeEvent.layout;
    if (width >= 320 && height >= 360) {
      currentSizeRef.current = { width: Math.round(width), height: Math.round(height) };
    }
  };

  const cornerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizingRef.current = true;
        setIsResizing(true);
        startDragRef.current = { ...currentSizeRef.current };
      },
      onPanResponderMove: (_evt, gestureState) => {
        const newWidth = Math.max(320, Math.min(900, Math.round(startDragRef.current.width + gestureState.dx)));
        const newHeight = Math.max(360, Math.min(1200, Math.round(startDragRef.current.height + gestureState.dy)));
        applySize(newWidth, newHeight);
      },
      onPanResponderRelease: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        Popover.setContentSize(currentSizeRef.current.width, currentSizeRef.current.height);
      },
      onPanResponderTerminate: () => {
        isResizingRef.current = false;
        setIsResizing(false);
      },
    })
  ).current;

  const rightEdgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizingRef.current = true;
        setIsResizing(true);
        startDragRef.current = { ...currentSizeRef.current };
      },
      onPanResponderMove: (_evt, gestureState) => {
        const newWidth = Math.max(320, Math.min(900, Math.round(startDragRef.current.width + gestureState.dx)));
        applySize(newWidth, currentSizeRef.current.height);
      },
      onPanResponderRelease: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        Popover.setContentSize(currentSizeRef.current.width, currentSizeRef.current.height);
      },
      onPanResponderTerminate: () => {
        isResizingRef.current = false;
        setIsResizing(false);
      },
    })
  ).current;

  const bottomEdgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizingRef.current = true;
        setIsResizing(true);
        startDragRef.current = { ...currentSizeRef.current };
      },
      onPanResponderMove: (_evt, gestureState) => {
        const newHeight = Math.max(360, Math.min(1200, Math.round(startDragRef.current.height + gestureState.dy)));
        applySize(currentSizeRef.current.width, newHeight);
      },
      onPanResponderRelease: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        Popover.setContentSize(currentSizeRef.current.width, currentSizeRef.current.height);
      },
      onPanResponderTerminate: () => {
        isResizingRef.current = false;
        setIsResizing(false);
      },
    })
  ).current;

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
      onLayout={isPopover ? handleContainerLayout : undefined}
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
      {isPopover && isResizable && (
        <>
          <View
            testID="resize-handle-right"
            style={styles.resizeHandleRight}
            {...rightEdgePanResponder.panHandlers}
          />
          <View
            testID="resize-handle-bottom"
            style={styles.resizeHandleBottom}
            {...bottomEdgePanResponder.panHandlers}
          />
          <View
            testID="resize-grip"
            style={[styles.resizeGrip, isResizing && styles.resizeGripActive]}
            {...cornerPanResponder.panHandlers}
          >
            <View style={[styles.resizeBar, styles.resizeBarWide, { backgroundColor: colors.secondaryText }]} />
            <View style={[styles.resizeBar, styles.resizeBarMedium, { backgroundColor: colors.secondaryText }]} />
            <View style={[styles.resizeBar, styles.resizeBarNarrow, { backgroundColor: colors.secondaryText }]} />
          </View>
        </>
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
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingRight: 3,
    paddingBottom: 3,
    gap: 2,
    opacity: 0.35,
    zIndex: 999,
  },
  resizeGripActive: {
    opacity: 0.85,
  },
  resizeHandleRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 24,
    width: 6,
    zIndex: 998,
  },
  resizeHandleBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 24,
    height: 6,
    zIndex: 998,
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
