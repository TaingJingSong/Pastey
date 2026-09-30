import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';

interface Props {
  item: ClipItem;
  onPress: () => void;
  onLongPress: () => void;
}

export function HistoryItem({ item, onPress, onLongPress }: Props) {
  return (
    <Pressable
      style={[styles.row, item.pinned === 1 && styles.pinned]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.body}>
        <Text style={styles.type}>{item.type}</Text>
        <Text numberOfLines={2} style={styles.preview}>
          {item.preview}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
  },
  pinned: { backgroundColor: '#fffbe6' },
  body: { flex: 1 },
  type: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  preview: { fontSize: 14 },
});
