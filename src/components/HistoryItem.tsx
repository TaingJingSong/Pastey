import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipItem } from '../db/queries';
import { useTheme } from '../theme';
import { SFSymbol } from './SFSymbol';
import { parseColor } from '../utils/parseColor';
import { ColorSwatch } from './ColorSwatch';

interface Props {
  item: ClipItem;
  index?: number;
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

export function formatCopyTime(timestamp: number, now = Date.now()): string {
  if (!timestamp || isNaN(timestamp)) {
    return '';
  }
  const diff = Math.max(0, now - timestamp);
  if (diff < 60 * 1000) {
    return 'just now';
  }
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 60000)}m ago`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 3600000)}h ago`;
  }
  const date = new Date(timestamp);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HistoryItem({
  item,
  index,
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

  const parsedColor = useMemo(() => {
    if (item.type !== 'text') return null;
    return parseColor(item.preview); 
  }, [item.type, item.preview]);

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
  const formattedTime = formatCopyTime(item.createdAt);
  const fullDateTime = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
  const showBadge = typeof index === 'number' && index >= 0 && index < 9;

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
      {showBadge && (
        <Text
          numberOfLines={1}
          testID={`history-item-shortcut-${item.id}`}
          style={[
            styles.shortcutBadge,
            {
              color: selected ? colors.selectedText : colors.textTertiary,
              opacity: selected ? 0.85 : 0.5,
            },
          ]}
        >
          ⌘{index + 1}
        </Text>
      )}
      <View style={styles.body}>
        <View style={styles.bodyRow}>
          {parsedColor ? (
            <ColorSwatch color={parsedColor} size={14} />
          ) : null}
          <View style={{ width: parsedColor ? 6 : 0 }} />
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
      </View>
      <View style={styles.actionContainer}>
        {(isHovered || selected) && formattedTime ? (
          <Text
            numberOfLines={1}
            testID={`history-item-time-${item.id}`}
            accessibilityLabel={`Copied ${formattedTime}`}
            {...({ tooltip: fullDateTime } as any)}
            style={[
              styles.timeText,
              { color: selected ? colors.selectedText : colors.textTertiary },
              selected && styles.timeTextSelected,
            ]}
          >
            {formattedTime}
          </Text>
        ) : null}
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
  timeText: {
    fontSize: 11,
    lineHeight: 14,
    marginRight: 6,
    flexShrink: 0,
    fontWeight: '400',
  },
  timeTextSelected: {
    opacity: 0.9,
  },
  shortcutBadge: {
    fontFamily: 'Menlo',
    fontSize: 11,
    width: 26,
    marginRight: 8,
    textAlign: 'left',
    letterSpacing: -0.3,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
