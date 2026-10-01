import { NativeEventEmitter, NativeModules } from 'react-native';

const native = NativeModules.HotkeyModule;

if (!native) {
  throw new Error('HotkeyModule native module not found');
}

const emitter = new NativeEventEmitter(native);

// Carbon modifier flags
export const Mod = {
  cmd: 0x0100,
  shift: 0x0200,
  option: 0x0800,
  control: 0x1000,
} as const;

// Virtual keycode for 'V' on a US keyboard.
// Not layout-aware — acceptable for v1.
export const Key = {
  V: 9,
} as const;

export const Hotkey = {
  register(keyCode: number, modifiers: number): Promise<boolean> {
    return native.register(keyCode, modifiers);
  },
  unregister(): Promise<boolean> {
    return native.unregister();
  },
  subscribe(cb: () => void) {
    return emitter.addListener('onHotkey', cb);
  },
};
