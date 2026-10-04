import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface SegmentOption<T extends string | number> {
  id: T;
  label: string;
  testID?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  testID?: string;
  optionTestIdPrefix?: string;
  getOptionTestId?: (option: SegmentOption<T>) => string;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  testID,
  optionTestIdPrefix,
  getOptionTestId,
  style,
}: SegmentedControlProps<T>): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.segmentBg,
          borderColor: colors.segmentBorder,
        },
        style,
      ]}
    >
      {options.map(option => {
        const isSelected = value === option.id;
        const optTestId =
          option.testID ??
          (getOptionTestId
            ? getOptionTestId(option)
            : optionTestIdPrefix
            ? `${optionTestIdPrefix}-${option.id}`
            : testID
            ? `${testID.replace(/-selector$/, '')}-option-${option.id}`
            : undefined);

        return (
          <Pressable
            key={String(option.id)}
            testID={optTestId}
            style={({ pressed }) => [
              styles.option,
              isSelected && [
                styles.optionSelected,
                { backgroundColor: colors.segmentSelectedBg },
              ],
              pressed && !isSelected && styles.optionPressed,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => onChange(option.id)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: isSelected
                    ? colors.segmentSelectedText
                    : colors.secondaryText,
                },
                isSelected && styles.optionTextSelected,
                disabled && styles.optionTextDisabled,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    padding: 2,
  },
  option: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  optionSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionTextDisabled: {
    opacity: 0.6,
  },
});

export default SegmentedControl;
