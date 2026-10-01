import { NativeModules } from 'react-native';

interface SettingsWindowNative {
  open(): Promise<boolean>;
}

const native = NativeModules.SettingsWindowModule as SettingsWindowNative | undefined;

export const SettingsWindow = {
  async open(): Promise<boolean> {
    if (!native?.open) {
      return false;
    }
    try {
      return await native.open();
    } catch {
      return false;
    }
  },
};
