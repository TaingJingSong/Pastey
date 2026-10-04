import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { SFSymbol } from './SFSymbol';

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
}

function ActionIconButton({
  icon,
  hoveredIcon,
  onPress,
  tooltip,
  testID,
  active = false,
}: {
  icon: React.ReactNode;
  hoveredIcon?: React.ReactNode;
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
      {hovered && hoveredIcon ? hoveredIcon : icon}
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
  onOpenSettings,
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
        <SFSymbol
          name="magnifyingglass"
          size={14}
          weight={4}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={resolvedRef}
          testID="search-input"
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={setValue}
          placeholder="Search clipboard…"
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
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.clearSearchBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <SFSymbol
              name="xmark.circle.fill"
              size={13}
              weight={4}
              color={colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.actionRow}>
        {onOpenSettings && (
          <ActionIconButton
            testID="quick-settings-button"
            icon={
              <SFSymbol
                name="gearshape"
                size={14}
                weight={4}
                color={colors.textSecondary}
              />
            }
            hoveredIcon={
              <SFSymbol
                name="gearshape"
                size={14}
                weight={4}
                color={colors.text}
              />
            }
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
  searchIcon: {
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
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
