import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';

interface Props {
  item: ClipItem;
  onCopy: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function HistoryItem({ item, onCopy, onDelete, onTogglePin }: Props) {
  return (
    <Pressable
      style={[styles.row, item.pinned === 1 && styles.pinned]}
      onPress={onCopy}
      onLongPress={onDelete}
    >
      <View style={styles.body}>
        <Text style={styles.type}>{item.type}</Text>
        <Text numberOfLines={2} style={styles.preview}>
          {item.preview}
        </Text>
      </View>
      <Pressable
        onPress={onTogglePin}
        hitSlop={10}
        style={styles.pin}
      >
        <Text style={styles.pinGlyph}>{item.pinned ? '★' : '☆'}</Text>
      </Pressable>
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
    alignItems: 'center',
  },
  pinned: { backgroundColor: '#fffbe6' },
  body: { flex: 1 },
  type: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  preview: { fontSize: 14 },
  pin: { paddingHorizontal: 8, paddingVertical: 4 },
  pinGlyph: { fontSize: 16, color: '#c90' },
});
