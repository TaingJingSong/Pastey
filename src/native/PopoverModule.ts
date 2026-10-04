import { NativeEventEmitter, NativeModules } from 'react-native';

const native = NativeModules.PopoverModule;

const emitter = native ? new NativeEventEmitter(native) : null;

export interface KeyPayload {
  key: 'up' | 'down' | 'enter' | 'escape' | string;
}

export interface ShowPayload {
  position?: 'menubar' | 'mouse' | string;
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
  toggle(position?: 'menubar' | 'mouse' | string): Promise<boolean> {
    if (!native?.toggle) {
      return Promise.resolve(false);
    }
    return native.toggle(position ?? null);
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
  setPreviewHeight(height: number): Promise<boolean> {
    if (!native?.setPreviewHeight) {
      return Promise.resolve(false);
    }
    return native.setPreviewHeight(height);
  },
  showPreview(): Promise<boolean> {
    if (!native?.showPreview) {
      return Promise.resolve(false);
    }
    return native.showPreview();
  },
  hidePreview(): Promise<boolean> {
    if (!native?.hidePreview) {
      return Promise.resolve(false);
    }
    return native.hidePreview();
  },
  onShow(callback: (payload?: ShowPayload) => void) {
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
