import React from 'react';
import {
  requireNativeComponent,
  StyleProp,
  ViewStyle,
} from 'react-native';

export interface SFSymbolProps {
  name: string;
  size?: number;
  weight?: number; // 1 (ultraLight) … 9 (black); default 4 (regular)
  color?: string;
  style?: StyleProp<ViewStyle>;
}

interface NativeSFSymbolProps {
  symbolName: string;
  symbolSize?: number;
  symbolWeight?: number;
  symbolColor?: string;
  style?: StyleProp<ViewStyle>;
}

const NativeSFSymbol = requireNativeComponent<NativeSFSymbolProps>('SFSymbolManager');

export const SFSymbol: React.FC<SFSymbolProps> = ({
  name,
  size = 14,
  weight = 4,
  color,
  style,
}) => {
  const frameStyle: ViewStyle = {
    width: size + 4,
    height: size + 4,
  };

  return (
    <NativeSFSymbol
      symbolName={name}
      symbolSize={size}
      symbolWeight={weight}
      symbolColor={color}
      style={[frameStyle, style]}
    />
  );
};

export default SFSymbol;
