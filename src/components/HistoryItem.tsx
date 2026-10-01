import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';
import { useTheme } from '../theme';

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
  const { colors } = useTheme();
  const isPinned = item.pinned === 1;

  return (
    <Pressable
      style={[
        styles.row,
        { borderBottomColor: colors.itemBorder },
        compact && styles.rowCompact,
        isPinned && [styles.pinned, { backgroundColor: colors.pinnedBg }],
        selected && [styles.selected, { backgroundColor: colors.selectedBg }],
      ]}
      onPress={onCopy}
      onLongPress={onDelete}
    >
      <View style={styles.body}>
        <Text
          numberOfLines={compact ? 2 : 3}
          style={[
            styles.preview,
            { color: colors.text },
            selected && [styles.previewSelected, { color: colors.selectedText }],
          ]}
        >
          {item.preview}
        </Text>
      </View>
      <Pressable
        onPress={onTogglePin}
        hitSlop={10}
        style={styles.pin}
      >
        <Text
          style={[
            styles.pinGlyph,
            { color: colors.pin },
            selected && [styles.pinGlyphSelected, { color: colors.pinSelected }],
          ]}
        >
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
  pinned: {},
  selected: {},
  body: {
    flex: 1,
  },
  type: {
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  typeSelected: {},
  preview: {
    fontSize: 13,
    lineHeight: 17,
  },
  previewSelected: {},
  pin: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pinGlyph: {
    fontSize: 14,
  },
  pinGlyphSelected: {},
});
