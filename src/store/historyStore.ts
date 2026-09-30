import { create } from 'zustand';
import { ClipboardMonitor } from '../native/ClipboardMonitor';
import type { ClipboardPayload } from '../native/ClipboardMonitor';
import {
  deleteClip,
  insertClip,
  listClips,
  togglePin,
} from '../db/queries';
import type { ClipItem } from '../db/queries';
import { initSchema } from '../db/schema';

interface HistoryState {
  items: ClipItem[];
  ready: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  onClipboard: (payload: ClipboardPayload) => Promise<void>;
  toggle: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

let subscription: { remove: () => void } | null = null;
let initialization: Promise<void> | null = null;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  ready: false,

  init: async () => {
    if (get().ready) {
      return;
    }

    if (initialization) {
      return initialization;
    }

    initialization = (async () => {
      await initSchema();
      await get().refresh();

      subscription = ClipboardMonitor.subscribe(payload => {
        get().onClipboard(payload).catch(error => {
          console.error('Failed to save clipboard item:', error);
        });
      });

      try {
        await ClipboardMonitor.start();
        set({ ready: true });
      } catch (error) {
        subscription?.remove();
        subscription = null;
        throw error;
      }
    })();

    try {
      await initialization;
    } finally {
      initialization = null;
    }
  },

  refresh: async () => {
    const items = await listClips(100, 0);
    set({ items });
  },

  onClipboard: async payload => {
    await insertClip(payload);
    await get().refresh();
  },

  toggle: async id => {
    await togglePin(id);
    await get().refresh();
  },

  remove: async id => {
    await deleteClip(id);
    await get().refresh();
  },
}));

export function disposeHistory(): void {
  subscription?.remove();
  subscription = null;
  ClipboardMonitor.stop();
  useHistoryStore.setState({ ready: false });
}
