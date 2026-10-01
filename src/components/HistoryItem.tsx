import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';

interface Props {
  item: ClipItem;
  selected?: boolean;
  compact?: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function HistoryItem({
  item,
  selected = false,
  compact = false,
  onCopy,
  onDelete,
  onTogglePin,
}: Props) {
  const isPinned = item.pinned === 1;

  return (
    <Pressable
      style={[
        styles.row,
        compact && styles.rowCompact,
        isPinned && styles.pinned,
        selected && styles.selected,
      ]}
      onPress={onCopy}
      onLongPress={onDelete}
    >
      <View style={styles.body}>
        {/* <Text style={[styles.type, selected && styles.typeSelected]}>
          {item.type}
        </Text> */}
        <Text
          numberOfLines={compact ? 2 : 3}
          style={[styles.preview, selected && styles.previewSelected]}
        >
          {item.preview}
        </Text>
      </View>
      <Pressable
        onPress={onTogglePin}
        hitSlop={10}
        style={styles.pin}
      >
        <Text style={[styles.pinGlyph, selected && styles.pinGlyphSelected]}>
          {isPinned ? '★' : '☆'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCompact: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 6,
    marginVertical: 1,
    borderRadius: 6,
    borderBottomWidth: 0,
  },
  pinned: {
    backgroundColor: 'rgba(255, 204, 0, 0.12)',
  },
  selected: {
    backgroundColor: '#007AFF',
  },
  body: {
    flex: 1,
  },
  type: {
    fontSize: 9,
    color: '#8e8e93',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  typeSelected: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  preview: {
    fontSize: 13,
    color: '#1c1c1e',
    lineHeight: 17,
  },
  previewSelected: {
    color: '#ffffff',
  },
  pin: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pinGlyph: {
    fontSize: 14,
    color: '#ff9500',
  },
  pinGlyphSelected: {
    color: '#ffffff',
  },
});
