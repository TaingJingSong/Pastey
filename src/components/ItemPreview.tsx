/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
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

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  if (!timestamp || isNaN(timestamp)) return '';
  const diff = Math.max(0, now - timestamp);
  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
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

interface IconButtonProps {
  icon: 'pin' | 'copy' | 'close';
  onPress: () => void;
  isPinned?: boolean;
  copied?: boolean;
  testID?: string;
}

function IconButton({ icon, onPress, isPinned, copied, testID }: IconButtonProps) {
  const { colors } = useTheme();

  const glyph =
    icon === 'pin' ? (isPinned ? 'Pinned' : 'Pin') :
    icon === 'copy' ? (copied ? 'Copied' : 'Copy') :
    '✕';

  const color =
    icon === 'pin' && isPinned ? colors.pin :
    copied ? colors.accent :
    colors.textSecondary;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { opacity: 0.5 },
      ]}
      accessibilityLabel={
        icon === 'pin' ? (isPinned ? 'Unpin item' : 'Pin item') :
        icon === 'copy' ? (copied ? 'Copied' : 'Copy item') :
        'Close preview'
      }
    >
      <Text style={[styles.iconGlyph, { color }]}>{glyph}</Text>
    </Pressable>
  );
}

const mono = Platform.select({ macos: 'Menlo', default: 'monospace' });

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
  const [imageRatio, setImageRatio] = useState<number | null>(null);

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
          .then(text => { if (active) setContent(text ?? item.preview); })
          .catch(() => { if (active) setContent(item.preview); });
      }
    } else {
      setContent(null);
    }
    return () => { active = false; };
  }, [item, initialFullContent]);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (!item) return;
    onCopy(item.id);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const imageUri =
    item?.filePath &&
    (item.filePath.startsWith('file://') ? item.filePath : `file://${item.filePath}`);

  useEffect(() => {
    let active = true;
    if (item?.type === 'image' && imageUri) {
      Image.getSize(
        imageUri,
        (w, h) => { if (active && w > 0 && h > 0) setImageRatio(w / h); },
        () => { if (active) setImageRatio(null); }
      );
    } else {
      setImageRatio(null);
    }
    return () => { active = false; };
  }, [item?.type, imageUri]);

  if (!item) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: isPopup ? 'transparent' : colors.previewBg,
            borderLeftColor: colors.separator,
          },
        ]}
      >
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

  return (
    <View
      testID="item-preview-container"
      style={[
        styles.container,
        {
          backgroundColor: isPopup ? 'transparent' : colors.previewBg,
          borderColor: isPopup ? 'transparent' : colors.previewBorder,
        },
        isPopup && styles.popupContainer,
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.separator,
            backgroundColor: 'transparent',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
            {isImage ? 'Image' : 'Text'}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {formatRelativeTime(item.createdAt)}
            {!isImage && linesCount > 0 ? ` · ${linesCount} lines` : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {onTogglePin && (
            <IconButton
              icon="pin"
              testID="preview-pin-button"
              isPinned={isPinned}
              onPress={() => onTogglePin(item.id)}
            />
          )}
          <IconButton
            icon="copy"
            testID="preview-copy-button"
            copied={copied}
            onPress={handleCopy}
          />
          {isPopup && onClose && (
            <IconButton
              icon="close"
              testID="preview-close-button"
              onPress={onClose}
            />
          )}
        </View>
      </View>

      <View style={styles.body}>
        {isImage ? (
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <View
                style={[
                  styles.imageBackdrop,
                  {
                    backgroundColor: isPopup ? 'transparent' : colors.imageBackdrop,
                    borderColor: isPopup ? 'transparent' : colors.separator,
                    aspectRatio: imageRatio
                      ? Math.max(0.6, Math.min(2.2, imageRatio))
                      : 16 / 10,
                  },
                ]}
              >
                <Image
                  testID="preview-image"
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
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
              style={[styles.fullText, { color: colors.text }]}
            >
              {textBody}
            </Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  popupContainer: {
    borderRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  timestamp: {
    fontSize: 12,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    paddingHorizontal: 6,
  },
  iconGlyph: {
    fontSize: 10,
    fontWeight: '400',
  },
  body: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  imageBackdrop: {
    width: '100%',
    maxHeight: '100%',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textScrollView: {
    flex: 1,
  },
  textContent: {
    padding: 14,
  },
  fullText: {
    fontFamily: mono,
    fontSize: 12,
    lineHeight: 18,
  },
});
