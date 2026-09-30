import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { ClipItem } from '../db/queries';
import { HistoryItem } from './HistoryItem';

interface Props {
  items: ClipItem[];
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export function HistoryList({ items, onSelect, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <FlatList<ClipItem>
        style={styles.list}
        data={items}
        keyExtractor={item => String(item.id)}
        removeClippedSubviews={false}
        renderItem={({ item }) => (
            <HistoryItem
              item={item}
              onPress={() => onSelect(item.id)}
              onLongPress={() => onDelete(item.id)}
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
