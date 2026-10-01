import React, { useEffect, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ClipItem } from '../db/queries';
import { HistoryItem } from './HistoryItem';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  items: ClipItem[];
  selectedIndex?: number;
  compact?: boolean;
  previewLines?: number;
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onPreview?: (id: number) => void;
}

function ItemSeparator() {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.separator }]} />;
}

export function HistoryList({
  items,
  selectedIndex = 0,
  compact = false,
  previewLines = 1,
  onCopy,
  onDelete,
  onTogglePin,
  onPreview,
}: Props) {
  const listRef = useRef<FlashList<ClipItem>>(null);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      try {
        listRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
          viewPosition: 0.5,
        });
      } catch {
        // Safe fallback if items not measured
      }
    }
  }, [selectedIndex, items.length]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={items}
        extraData={{ selectedIndex, previewLines }}
        keyExtractor={item => String(item.id)}
        estimatedItemSize={previewLines === 1 ? 32 : 48}
        estimatedListSize={{ width: 420, height: 476 }}
        ItemSeparatorComponent={compact ? undefined : ItemSeparator}
        renderItem={({ item, index }) => (
          <HistoryItem
            item={item}
            selected={compact && index === selectedIndex}
            compact={compact}
            previewLines={previewLines}
            onCopy={() => onCopy(item.id)}
            onDelete={() => onDelete(item.id)}
            onTogglePin={() => onTogglePin(item.id)}
            onPreview={onPreview ? () => onPreview(item.id) : undefined}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 2,
    minWidth: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 12,
  },
});
