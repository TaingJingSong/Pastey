import { create } from 'zustand';
import { ClipboardMonitor, ClipboardPayload } from '../native/ClipboardMonitor';
import {
  ClipItem,
  deleteClip,
  insertClip,
  listClips,
  togglePin,
  searchClips,
} from '../db/queries';
import { initSchema } from '../db/schema';

interface HistoryState {
  items: ClipItem[];
  query: string;
  ready: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  search: (q: string) => Promise<void>;
  onClipboard: (payload: ClipboardPayload) => Promise<void>;
  toggle: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

let subscription: { remove: () => void } | null = null;
let starting = false;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  query: '',
  ready: false,

  init: async () => {
    if (get().ready || starting) {
      return;
    }
    starting = true;

    await initSchema();
    set({ ready: true });
    await get().refresh();

    ClipboardMonitor.start();
    subscription = ClipboardMonitor.subscribe(payload => {
      get().onClipboard(payload);
    });
  },

  refresh: async () => {
    const items = await listClips(100, 0);
    set({ items });
  },

  search: async q => {
    set({ query: q });
    const items = q.trim() ? await searchClips(q) : await listClips(100, 0);
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

export function disposeHistory() {
  subscription?.remove();
  subscription = null;
  ClipboardMonitor.stop();
}
