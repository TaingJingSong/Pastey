import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

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
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <TextInput
        ref={resolvedRef}
        style={[styles.input, compact && styles.inputCompact]}
        value={value}
        onChangeText={setValue}
        placeholder="Type to search…"
        placeholderTextColor="#8e8e93"
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
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  input: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    color: '#000',
  },
  inputCompact: {
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '#1c1c1e',
  },
});
