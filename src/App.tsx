import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { HistoryList } from './components/HistoryList';
import { SearchBar } from './components/SearchBar';
import { useHistoryStore } from './store/historyStore';
import { Popover } from './native/PopoverModule';

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
    search,
    copy,
    moveSelection,
    confirmSelection,
  } = useHistoryStore();

  const searchInputRef = useRef<TextInput>(null);
  const isPopover = props.mode === 'popover' || true;

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

    return () => {
      keySub.remove();
      showSub.remove();
    };
  }, [init, moveSelection, confirmSelection]);

  return (
    <View style={[styles.container, isPopover && styles.popoverContainer]}>
      <SearchBar
        inputRef={searchInputRef}
        onSearch={search}
        compact={isPopover}
      />
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>
            {query ? 'No matching clipboard history' : 'Clipboard history is empty'}
          </Text>
        </View>
      ) : (
        <HistoryList
          items={items}
          selectedIndex={selectedIndex}
          compact={isPopover}
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
    backgroundColor: '#fff',
  },
  popoverContainer: {
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
    color: '#8e8e93',
    textAlign: 'center',
  },
});

export default App;
