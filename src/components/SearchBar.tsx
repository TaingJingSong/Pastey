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
}

function SearchIcon({ color }: { color: string }) {
  return (
    <View style={styles.searchIconWrap} pointerEvents="none">
      <View style={[styles.searchIconCircle, { borderColor: color }]} />
      <View style={[styles.searchIconHandle, { backgroundColor: color }]} />
    </View>
  );
}

function SettingsIcon({ color, size = 15 }: { color: string; size?: number }) {
  const TEETH = [0, 45, 90, 135, 180, 225, 270, 315];
  const toothWidth = 2;
  const toothHeight = 2.4;
  const ringSize = 9.5;

  return (
    <View style={[styles.settingsWrap, { width: size, height: size }]} pointerEvents="none">
      {TEETH.map(deg => (
        <View
          key={deg}
          style={[
            styles.settingsTooth,
            {
              width: toothWidth,
              height: toothHeight,
              backgroundColor: color,
              transform: [{ rotate: `${deg}deg` }, { translateY: -5.4 }],
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.settingsRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
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
      {hovered && hoveredIcon ? (
        hoveredIcon
      ) : typeof icon === 'string' ? (
        <Text
          style={[
            styles.actionBtnIcon,
            { color: active ? colors.text : colors.iconBtnText },
          ]}
        >
          {icon}
        </Text>
      ) : (
        icon
      )}
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
        <SearchIcon color={colors.placeholderText} />
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
            style={({ pressed }) => [
              styles.clearSearchBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.clearSearchGlyph, { color: colors.secondaryText }]}>
              ×
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.actionRow}>
        {onOpenSettings && (
          <ActionIconButton
            testID="quick-settings-button"
            icon={<SettingsIcon color={colors.iconBtnText} />}
            hoveredIcon={<SettingsIcon color={colors.text} />}
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
  searchIconWrap: {
    width: 13,
    height: 13,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconCircle: {
    width: 8.5,
    height: 8.5,
    borderRadius: 4.25,
    borderWidth: 1.3,
    position: 'absolute',
    top: 0.5,
    left: 0.5,
  },
  searchIconHandle: {
    width: 1.3,
    height: 4,
    borderRadius: 0.6,
    position: 'absolute',
    bottom: 0.5,
    right: 0.5,
    transform: [{ rotate: '-45deg' }],
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
  clearSearchGlyph: {
    fontSize: 13,
    lineHeight: 14,
    fontWeight: '400',
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
  actionBtnIcon: {
    fontSize: 13,
  },
  settingsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTooth: {
    position: 'absolute',
    borderRadius: 0.6,
  },
  settingsRing: {
    position: 'absolute',
    borderWidth: 1.6,
  },
});
