import React from 'react';
import { FlashList } from '@shopify/flash-list';
import { ClipItem } from '../db/queries';
import { HistoryItem } from './HistoryItem';
import { StyleSheet, View } from 'react-native';

interface Props {
  items: ClipItem[];
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
}

export function HistoryList({ items, onCopy, onDelete, onTogglePin }: Props) {
  return (
    <View style={styles.container}>
      <FlashList
        style={styles.list}
        data={items}
        keyExtractor={item => String(item.id)}
        estimatedItemSize={64}
        renderItem={({ item }) => (
          <HistoryItem
          item={item}
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
});
