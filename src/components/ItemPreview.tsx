import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ClipItem, getContent } from '../db/queries';
import { useTheme } from '../theme';

interface Props {
  item: ClipItem | null;
  fullContent?: string | null;
  onCopy: (id: number) => void;
  onTogglePin?: (id: number) => void;
  onClose?: () => void;
  isPopup?: boolean;
}

export function ItemPreview({
  item,
  fullContent: initialFullContent,
  onCopy,
  onTogglePin,
  onClose,
  isPopup = false,
}: Props) {
  const { colors } = useTheme();
  const [content, setContent] = useState<string | null>(initialFullContent ?? null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (!item) {
      setContent(null);
      return;
    }

    if (item.type === 'text') {
      if (initialFullContent !== undefined) {
        setContent(initialFullContent);
      } else {
        getContent(item.id)
          .then(text => {
            if (active) {
              setContent(text ?? item.preview);
            }
          })
          .catch(() => {
            if (active) {
              setContent(item.preview);
            }
          });
      }
    } else {
      setContent(null);
    }

    return () => {
      active = false;
    };
  }, [item, initialFullContent]);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    if (!item) {
      return;
    }
    onCopy(item.id);
    setCopied(true);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  if (!item) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.previewBg }]}>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          Select an item to preview full content
        </Text>
      </View>
    );
  }

  const isPinned = item.pinned === 1;
  const isImage = item.type === 'image';
  const textBody = content ?? item.preview;
  const linesCount = textBody ? textBody.split('\n').length : 0;
  const charsCount = textBody ? textBody.length : 0;

  const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const imageUri =
    item.filePath &&
    (item.filePath.startsWith('file://') ? item.filePath : `file://${item.filePath}`);

  return (
    <View
      testID="item-preview-container"
      style={[
        styles.container,
        {
          backgroundColor: colors.previewBg,
          borderColor: colors.previewBorder,
        },
        isPopup && styles.popupContainer,
      ]}
    >
      {/* Header bar */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.itemBorder,
            backgroundColor: colors.cardBg,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.typeText, { color: colors.text }]}>
            {isImage ? 'Image' : 'Text'}
          </Text>
          <Text style={[styles.dotSeparator, { color: colors.secondaryText }]}>·</Text>
          <Text
            style={[styles.metaText, { color: colors.secondaryText }]}
            numberOfLines={1}
          >
            {isImage
              ? formattedDate
              : `${linesCount} ${linesCount === 1 ? 'line' : 'lines'} · ${charsCount} chars`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {onTogglePin && (
            <Pressable
              testID="preview-pin-button"
              onPress={() => onTogglePin(item.id)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.segmentBg },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel={isPinned ? 'Unpin item' : 'Pin item'}
            >
              <Text
                style={[
                  styles.pinIcon,
                  { color: isPinned ? colors.pin : colors.secondaryText },
                ]}
              >
                {isPinned ? '★' : '☆'}
              </Text>
            </Pressable>
          )}

          <Pressable
            testID="preview-copy-button"
            onPress={handleCopy}
            hitSlop={6}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: copied ? colors.accent : colors.segmentBg,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: copied ? colors.accentText : colors.text },
              ]}
            >
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>

          {isPopup && onClose && (
            <Pressable
              testID="preview-close-button"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityLabel="Close preview"
            >
              <Text style={[styles.closeIcon, { color: colors.secondaryText }]}>
                ×
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Main Preview Body */}
      <View style={styles.body}>
        {isImage ? (
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <Image
                testID="preview-image"
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Image file unavailable
              </Text>
            )}
          </View>
        ) : (
          <ScrollView
            testID="preview-scroll"
            style={styles.textScrollView}
            contentContainerStyle={styles.textContent}
          >
            <Text
              testID="preview-full-text"
              selectable
              style={[
                styles.fullText,
                { color: colors.text },
              ]}
            >
              {textBody}
            </Text>
          </ScrollView>
        )}
      </View>

      {/* Footer shortcut hints for popup mode */}
      {isPopup && (
        <View
          style={[
            styles.footer,
            { borderTopColor: colors.itemBorder, backgroundColor: colors.cardBg },
          ]}
        >
          <Text style={[styles.footerHint, { color: colors.secondaryText }]}>
            ↑ / ↓ navigate · Esc to close
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  popupContainer: {
    borderLeftWidth: 0,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 11,
    opacity: 0.6,
  },
  metaText: {
    fontSize: 11,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    width: 26,
    height: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 13,
  },
  closeBtn: {
    marginLeft: 4,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textScrollView: {
    flex: 1,
  },
  textContent: {
    padding: 12,
  },
  fullText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Menlo',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  footerHint: {
    fontSize: 11,
  },
});
