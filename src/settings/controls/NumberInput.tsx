import React, { useEffect, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  testID?: string;
  unit?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  onBlur?: () => void;
}

export function NumberInput({
  value,
  onChange,
  min = 1,
  max = 100000,
  disabled = false,
  testID,
  unit,
  placeholder,
  style,
  inputStyle,
  onChangeText,
  onSubmitEditing,
  onBlur,
}: NumberInputProps): React.JSX.Element {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);

  // Sync draft when external value updates while not editing
  useEffect(() => {
    setDraft(null);
  }, [value]);

  const text = draft ?? (Number.isNaN(value) ? '' : String(value));

  const commit = () => {
    const parsed = Number.parseInt(text, 10);
    setDraft(null);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  const handleChangeText = (newText: string) => {
    setDraft(newText);
    onChangeText?.(newText);
  };

  const handleCommit = () => {
    commit();
    onSubmitEditing?.();
  };

  const handleBlur = () => {
    commit();
    onBlur?.();
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        testID={testID ? `${testID}-textinput` : undefined}
        style={[
          styles.input,
          {
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBg,
            color: colors.text,
          },
          unit ? styles.inputWithUnit : null,
          inputStyle,
        ]}
        value={text}
        editable={!disabled}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        onSubmitEditing={handleCommit}
        returnKeyType="done"
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.placeholderText}
      />
      {unit ? (
        <Text style={[styles.unitText, { color: colors.secondaryText }]}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    textAlign: 'right',
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  inputWithUnit: {
    width: 65,
    marginRight: 6,
  },
  unitText: {
    fontSize: 12,
  },
});

export default NumberInput;
