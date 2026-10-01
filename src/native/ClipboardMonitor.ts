import { NativeEventEmitter, NativeModules } from 'react-native';

export interface ClipboardPayload {
  hash: string;
  type: 'text' | 'image';
  preview: string;
  content: string;
  filePath?: string;
  bundleId?: string;
  createdAt: number;
}

interface ClipboardMonitorNative {
  start(): void;
  stop(): void;
  syncImages(keepPaths: string[]): Promise<number>;
  write(
    type: string,
    content: string,
    filePath: string
  ): Promise<boolean>;
}

const native = NativeModules.ClipboardMonitor as ClipboardMonitorNative | undefined;

if (!native) {
  throw new Error('ClipboardMonitor native module not found');
}

const emitter = new NativeEventEmitter(NativeModules.ClipboardMonitor);

export const ClipboardMonitor = {
  start() {
    native.start();
  },
  stop() {
    native.stop();
  },
  subscribe(cb: (payload: ClipboardPayload) => void) {
    return emitter.addListener('onClipboardChange', cb);
  },
  syncImages(keepPaths: string[]): Promise<number> {
    return native.syncImages(keepPaths);
  },
  write(payload: {
    type: 'text' | 'image';
    content: string;
    filePath?: string;
  }): Promise<boolean> {
    return native.write(
      payload.type,
      payload.content,
      payload.filePath ?? ''
    );
  },
};
