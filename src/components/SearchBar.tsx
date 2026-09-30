import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface Props {
  onSearch: (q: string) => void;
  delay?: number;
}

export function SearchBar({ onSearch, delay = 150 }: Props) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) {clearTimeout(timer.current);}
    timer.current = setTimeout(() => onSearch(value), delay);
    return () => {
      if (timer.current) {clearTimeout(timer.current);}
    };
  }, [value, delay, onSearch]);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Search…"
        placeholderTextColor="#999"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 8 },
  input: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
});
