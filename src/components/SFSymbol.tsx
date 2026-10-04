import React from 'react';
import {
  requireNativeComponent,
  StyleProp,
  UIManager,
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

// In React Native, ViewManagers named `XxxManager` (such as `SFSymbolManager`)
// are registered in UIManager under `Xxx` (stripping the 'Manager' suffix).
// We resolve 'SFSymbol' or fall back to 'SFSymbolManager' if ever needed.
const nativeComponentName =
  UIManager.getViewManagerConfig?.('SFSymbol') != null
    ? 'SFSymbol'
    : UIManager.getViewManagerConfig?.('SFSymbolManager') != null
    ? 'SFSymbolManager'
    : 'SFSymbol';

const NativeSFSymbol = requireNativeComponent<NativeSFSymbolProps>(nativeComponentName);

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
