import React, { useEffect, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ClipItem } from '../db/queries';
import { HistoryItem } from './HistoryItem';
import { StyleSheet, View } from 'react-native';

interface Props {
  items: ClipItem[];
  selectedIndex?: number;
  compact?: boolean;
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export function HistoryList({
  items,
  selectedIndex = 0,
  compact = false,
  onCopy,
  onDelete,
  onTogglePin,
}: Props) {
  const listRef = useRef<FlashList<ClipItem>>(null);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      listRef.current?.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [selectedIndex, items.length]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={items}
        keyExtractor={item => String(item.id)}
        estimatedItemSize={54}
        ItemSeparatorComponent={compact ? undefined : ItemSeparator}
        renderItem={({ item, index }) => (
          <HistoryItem
            item={item}
            selected={compact && index === selectedIndex}
            compact={compact}
            onCopy={() => onCopy(item.id)}
            onDelete={() => onDelete(item.id)}
            onTogglePin={() => onTogglePin(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginLeft: 12,
  },
});
