import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';
import { useTheme } from '../theme';
import { SFSymbol } from './SFSymbol';

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
  onPreviewHoverEnd?: () => void;
  onPreviewHoverStart?: () => void;
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
  onPreviewHoverEnd,
  onPreviewHoverStart,
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
    onPreviewHoverStart?.();
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
    onPreviewHoverEnd?.();
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
            <SFSymbol
              name="chevron.right"
              size={12}
              weight={4}
              color={
                isCurrentPreviewItem
                  ? colors.accent
                  : selected
                  ? colors.selectedText
                  : colors.secondaryText
              }
            />
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
          <SFSymbol
            name={isPinned ? 'star.fill' : 'star'}
            size={12}
            weight={4}
            color={
              isPinned
                ? selected
                  ? colors.pinSelected
                  : colors.pin
                : selected
                ? colors.selectedText
                : colors.secondaryText
            }
          />
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
  },
  actionBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnVisible: {
    opacity: 1,
  },
  actionBtnHidden: {
    opacity: 0,
  },
});
