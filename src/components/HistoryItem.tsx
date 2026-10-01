import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';
import { useTheme } from '../theme';

interface Props {
  item: ClipItem;
  selected?: boolean;
  compact?: boolean;
  previewLines?: number;
  isCurrentPreviewItem?: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onPreview?: () => void;
  onPreviewHover?: () => void;
}

export function HistoryItem({
  item,
  selected = false,
  compact = false,
  previewLines = 1,
  isCurrentPreviewItem = false,
  onCopy,
  onDelete,
  onTogglePin,
  onPreview,
  onPreviewHover,
}: Props) {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPinned = item.pinned === 1;

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleHoverIn = () => {
    setIsHovered(true);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      onPreviewHover?.();
    }, 2000);
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const showActions = isPinned || isHovered || selected || isCurrentPreviewItem;

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
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      {...({
        onMouseEnter: handleHoverIn,
        onMouseLeave: handleHoverOut,
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
      <View style={styles.actionContainer}>
        {onPreview && (
          <Pressable
            testID={`preview-button-${item.id}`}
            onPress={onPreview}
            hitSlop={6}
            style={[
              styles.actionBtn,
              isHovered || selected || isCurrentPreviewItem
                ? styles.actionBtnVisible
                : styles.actionBtnHidden,
            ]}
            pointerEvents={isHovered || selected || isCurrentPreviewItem ? 'auto' : 'none'}
            accessibilityLabel="Preview full content"
          >
            <Text
              style={[
                styles.actionGlyph,
                { color: isCurrentPreviewItem ? colors.accent : colors.secondaryText },
                selected && { color: isCurrentPreviewItem ? colors.accentText : colors.selectedText },
              ]}
            >
              &gt;
            </Text>
          </Pressable>
        )}
        <Pressable
          testID={`pin-button-${item.id}`}
          onPress={onTogglePin}
          hitSlop={6}
          style={[
            styles.actionBtn,
            showActions ? styles.actionBtnVisible : styles.actionBtnHidden,
          ]}
          pointerEvents={showActions ? 'auto' : 'none'}
          accessibilityLabel={isPinned ? 'Unpin' : 'Pin'}
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
      </View>
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
    minHeight: 34,
  },
  rowCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 6,
    marginVertical: 1,
    borderRadius: 6,
    borderBottomWidth: 0,
    minHeight: 29,
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
  previewSelected: {},
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    height: 18,
  },
  actionBtn: {
    width: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGlyph: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '700',
  },
  pinGlyph: {
    fontSize: 13,
    lineHeight: 15,
  },
  pinGlyphSelected: {},
  actionBtnVisible: {
    opacity: 1,
  },
  actionBtnHidden: {
    opacity: 0,
  },
});
