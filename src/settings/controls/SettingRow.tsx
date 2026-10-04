import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface SettingRowProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  hintStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function SettingRow({
  label,
  hint,
  children,
  style,
  rowStyle,
  labelStyle,
  hintStyle,
  testID,
}: SettingRowProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={[styles.row, rowStyle]}>
        <Text style={[styles.label, { color: colors.text }, labelStyle]}>
          {label}
        </Text>
        {children}
      </View>
      {hint ? (
        <Text style={[styles.hint, { color: colors.secondaryText }, hintStyle]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
  },
});

export default SettingRow;
