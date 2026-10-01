import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  onSearch: (q: string) => void;
  compact?: boolean;
  delay?: number;
  inputRef?: React.RefObject<TextInput>;
}

export function SearchBar({
  onSearch,
  compact = false,
  delay = 150,
  inputRef,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalRef = useRef<TextInput>(null);
  const resolvedRef = inputRef ?? internalRef;

  useEffect(() => {
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

  return (
    <View
      style={[
        styles.wrap,
        compact && [styles.wrapCompact, { borderBottomColor: colors.divider }],
      ]}
    >
      <TextInput
        ref={resolvedRef}
        style={[
          styles.input,
          {
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBg,
            color: colors.text,
          },
          compact && [
            styles.inputCompact,
            {
              color: colors.text,
              backgroundColor: 'transparent',
            },
          ],
        ]}
        value={value}
        onChangeText={setValue}
        placeholder="Type to search…"
        placeholderTextColor={colors.placeholderText}
        selectionColor={colors.accent}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={compact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
  },
  wrapCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  inputCompact: {
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
  },
});
