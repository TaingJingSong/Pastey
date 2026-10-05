import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ParsedColor } from '../utils/parseColor';

interface Props {
  color: ParsedColor;
  size?: number;
}

export function ColorSwatch({ color, size = 14 }: Props) {
  return (
    <View
      testID="color-swatch"
      accessibilityLabel={`Color ${color.hex}`}
      style={[
        styles.container,
        { width: size, height: size },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color.hex, opacity: color.alpha },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.35)',
  },
});