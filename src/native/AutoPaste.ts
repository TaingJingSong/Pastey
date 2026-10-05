import { NativeModules } from 'react-native';

const native = NativeModules.AutoPasteModule;

if (!native) {
  throw new Error('AutoPasteModule native module not found');
}

export const AutoPaste = {
  isTrusted(): Promise<boolean> {
    return native.isTrusted();
  },
  requestPermission(): Promise<boolean> {
    return native.requestPermission();
  },
  paste(delayMs = 120): Promise<boolean> {
    return native.paste(delayMs);
  },
};