import { NativeModules } from 'react-native';

const native = NativeModules.WindowModule;

if (!native) {
  throw new Error('WindowModule native module not found');
}

export const AppWindow = {
  hide(): Promise<boolean> {
    return native.hide();
  },
  show(): Promise<boolean> {
    return native.show();
  },
  toggle(): Promise<boolean> {
    return native.toggle();
  },
};
