import { NativeEventEmitter, NativeModules } from 'react-native';

const native = NativeModules.PopoverModule;

const emitter = native ? new NativeEventEmitter(native) : null;

export interface KeyPayload {
  key: 'up' | 'down' | 'enter' | 'escape' | string;
}

export const Popover = {
  show(sourceViewTag = 0): Promise<boolean> {
    if (!native?.show) {
      return Promise.resolve(false);
    }
    return native.show(sourceViewTag);
  },
  hide(): Promise<boolean> {
    if (!native?.hide) {
      return Promise.resolve(false);
    }
    return native.hide();
  },
  toggle(): Promise<boolean> {
    if (!native?.toggle) {
      return Promise.resolve(false);
    }
    return native.toggle();
  },
  attachKeyMonitor(): void {
    native?.attachKeyMonitor?.();
  },
  setContentSize(width: number, height: number): Promise<boolean> {
    if (!native?.setContentSize) {
      return Promise.resolve(false);
    }
    return native.setContentSize(width, height);
  },
  onShow(callback: () => void) {
    if (!emitter) {
      return { remove: () => {} };
    }
    return emitter.addListener('onPopoverShow', callback);
  },
  onHide(callback: () => void) {
    if (!emitter) {
      return { remove: () => {} };
    }
    return emitter.addListener('onPopoverHide', callback);
  },
  onKey(callback: (payload: KeyPayload) => void) {
    if (!emitter) {
      return { remove: () => {} };
    }
    return emitter.addListener('onKey', callback);
  },
  onSystemThemeChanged(callback: (payload: { systemTheme: 'light' | 'dark' }) => void) {
    if (!emitter) {
      return { remove: () => {} };
    }
    return emitter.addListener('onSystemThemeChanged', callback);
  },
};
