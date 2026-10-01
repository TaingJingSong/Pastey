import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';
import { useTheme } from '../theme';

interface Props {
  item: ClipItem;
  selected?: boolean;
  compact?: boolean;
  previewLines?: number;
  onCopy: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function HistoryItem({
  item,
  selected = false,
  compact = false,
  previewLines = 1,
  onCopy,
  onDelete,
  onTogglePin,
}: Props) {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isPinned = item.pinned === 1;

  return (
    <Pressable
      testID={`history-item-${item.id}`}
      style={[
        styles.row,
        { borderBottomColor: colors.itemBorder },
        compact && styles.rowCompact,
        isPinned && [styles.pinned, { backgroundColor: colors.pinnedBg }],
        isHovered && !selected && [styles.hovered, { backgroundColor: colors.hoverBg }],
        selected && [styles.selected, { backgroundColor: colors.selectedBg }],
      ]}
      onPress={onCopy}
      onLongPress={onDelete}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      {...({
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } as any)}
    >
      <View style={styles.body}>
        <Text
          numberOfLines={previewLines}
          ellipsizeMode="tail"
          style={[
            styles.preview,
            { color: colors.text },
            previewLines === 1 && styles.previewSingleLine,
            selected && [styles.previewSelected, { color: colors.selectedText }],
          ]}
        >
          {item.preview}
        </Text>
      </View>
      {(isPinned || isHovered || selected) && (
        <Pressable
          testID={`pin-button-${item.id}`}
          onPress={onTogglePin}
          hitSlop={8}
          style={styles.pin}
        >
          <Text
            style={[
              styles.pinGlyph,
              { color: isPinned ? colors.pin : colors.secondaryText },
              selected && [styles.pinGlyphSelected, { color: colors.pinSelected }],
            ]}
          >
            {isPinned ? '★' : '☆'}
          </Text>
        </Pressable>
      )}
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 6,
    marginVertical: 1,
    borderRadius: 6,
    borderBottomWidth: 0,
  },
  pinned: {},
  hovered: {},
  selected: {},
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewSingleLine: {
    lineHeight: 17,
  },
  previewSelected: {
    fontWeight: '400',
  },
  pin: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
  },
  pinGlyph: {
    fontSize: 13,
  },
  pinGlyphSelected: {},
});
