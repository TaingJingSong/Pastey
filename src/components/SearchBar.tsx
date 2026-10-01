import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  onSearch: (q: string) => void;
  compact?: boolean;
  delay?: number;
  inputRef?: React.RefObject<TextInput>;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onSubmit?: () => void;
  onClearHistory?: () => void;
  onOpenSettings?: () => void;
  previewLines?: number;
  onTogglePreviewLines?: () => void;
  onToggleSidePreview?: () => void;
  sidePreviewActive?: boolean;
}

function ActionIconButton({
  icon,
  onPress,
  tooltip,
  testID,
  active = false,
}: {
  icon: string;
  onPress: () => void;
  tooltip: string;
  testID?: string;
  active?: boolean;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={tooltip}
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        tooltip,
      } as any)}
      style={({ pressed }) => [
        styles.actionBtn,
        active && { backgroundColor: colors.iconBtnActive },
        hovered && { backgroundColor: colors.iconBtnHover },
        pressed && styles.actionBtnPressed,
      ]}
    >
      <Text
        style={[
          styles.actionBtnIcon,
          { color: active ? colors.text : colors.iconBtnText },
        ]}
      >
        {icon}
      </Text>
    </Pressable>
  );
}

export function SearchBar({
  onSearch,
  compact = false,
  delay = 150,
  inputRef,
  onArrowDown,
  onArrowUp,
  onSubmit,
  onClearHistory,
  onOpenSettings,
  previewLines = 1,
  onTogglePreviewLines,
  onToggleSidePreview,
  sidePreviewActive = false,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalRef = useRef<TextInput>(null);
  const resolvedRef = inputRef ?? internalRef;
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => onSearch(value), delay);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [value, delay, onSearch]);

  const handleClearText = () => {
    setValue('');
    onSearch('');
    resolvedRef.current?.focus();
  };

  return (
    <View
      style={[
        styles.wrap,
        compact && [styles.wrapCompact, { borderBottomColor: colors.divider }],
      ]}
    >
      <View
        style={[
          styles.inputContainer,
          compact
            ? [styles.inputContainerCompact, { backgroundColor: colors.inputBg }]
            : [
                styles.inputContainerStandard,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBg,
                },
              ],
        ]}
      >
        <Text style={[styles.searchGlyph, { color: colors.placeholderText }]}>
          🔍
        </Text>
        <TextInput
          ref={resolvedRef}
          testID="search-input"
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={setValue}
          placeholder="Type to search…"
          placeholderTextColor={colors.placeholderText}
          selectionColor={colors.accent}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={compact}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'ArrowDown') {
              onArrowDown?.();
            } else if (nativeEvent.key === 'ArrowUp') {
              onArrowUp?.();
            }
          }}
          onSubmitEditing={onSubmit}
        />
        {value.length > 0 && (
          <Pressable
            testID="clear-search-button"
            onPress={handleClearText}
            hitSlop={6}
            style={styles.clearSearchBtn}
          >
            <Text style={[styles.clearSearchGlyph, { color: colors.secondaryText }]}>
              ✕
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.actionRow}>
        {onToggleSidePreview && (
          <ActionIconButton
            testID="quick-preview-toggle-button"
            icon="◧"
            active={sidePreviewActive}
            tooltip={sidePreviewActive ? 'Hide side preview' : 'Show side preview'}
            onPress={onToggleSidePreview}
          />
        )}
        {onTogglePreviewLines && (
          <ActionIconButton
            testID="quick-preview-lines-button"
            icon="≡"
            tooltip={`Preview lines: ${previewLines} (click to toggle)`}
            onPress={onTogglePreviewLines}
          />
        )}
        {onClearHistory && (
          <ActionIconButton
            testID="quick-clear-button"
            icon="🗑"
            tooltip="Clear clipboard history"
            onPress={onClearHistory}
          />
        )}
        {onOpenSettings && (
          <ActionIconButton
            testID="quick-settings-button"
            icon="⚙"
            tooltip="Preferences"
            onPress={onOpenSettings}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
  },
  wrapCompact: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerCompact: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputContainerStandard: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchGlyph: {
    fontSize: 12,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
  },
  clearSearchBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 4,
  },
  clearSearchGlyph: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    opacity: 0.65,
  },
  actionBtnIcon: {
    fontSize: 13,
  },
});
