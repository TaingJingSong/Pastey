import { create } from 'zustand';
import { Popover } from '../native/PopoverModule';
import { ClipboardMonitor, ClipboardPayload } from '../native/ClipboardMonitor';
import {
  ClipItem,
  clearClips,
  deleteClip,
  insertClip,
  listClips,
  togglePin,
  searchClips,
  getContent,
} from '../db/queries';
import { Hotkey, Key, Mod } from '../native/HotkeyModule';
import { initSchema } from '../db/schema';

export interface HistoryState {
  items: ClipItem[];
  query: string;
  ready: boolean;
  selectedIndex: number;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  search: (q: string) => Promise<void>;
  onClipboard: (payload: ClipboardPayload) => Promise<void>;
  toggle: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clear: (clearPinned?: boolean) => Promise<void>;
  copy: (id: number) => Promise<void>;
  setSelectedIndex: (index: number) => void;
  moveSelection: (delta: number) => void;
  confirmSelection: () => Promise<void>;
}

let subscription: { remove: () => void } | null = null;
let starting = false;
let hotkeySub: { remove: () => void } | null = null;
let lastMoveTime = 0;
let lastDelta = 0;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  query: '',
  ready: false,
  selectedIndex: 0,

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

    // Cmd + Shift + V or Cmd + Option + V
    await Hotkey.register(Key.V, Mod.cmd + Mod.shift);
    hotkeySub = Hotkey.subscribe(() => {
      Popover.toggle();
    });
  },

  refresh: async () => {
    const { query } = get();
    const items = query.trim() ? await searchClips(query) : await listClips(100, 0);
    set(state => ({
      items,
      selectedIndex: Math.max(0, Math.min(state.selectedIndex, Math.max(0, items.length - 1))),
    }));
  },

  search: async q => {
    set({ query: q, selectedIndex: 0 });
    const items = q.trim() ? await searchClips(q) : await listClips(100, 0);
    set({ items, selectedIndex: 0 });
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

  clear: async (clearPinned = false) => {
    await clearClips(clearPinned);
    await get().refresh();
  },

  setSelectedIndex: index => {
    set({ selectedIndex: index });
  },

  moveSelection: delta => {
    const now = Date.now();
    if (now - lastMoveTime < 40 && delta === lastDelta) {
      return;
    }
    lastMoveTime = now;
    lastDelta = delta;

    const { items, selectedIndex } = get();
    if (items.length === 0) {
      return;
    }
    const next = Math.max(0, Math.min(items.length - 1, selectedIndex + delta));
    set({ selectedIndex: next });
  },

  confirmSelection: async () => {
    const { items, selectedIndex, copy } = get();
    if (items.length === 0 || selectedIndex < 0 || selectedIndex >= items.length) {
      return;
    }
    const item = items[selectedIndex];
    if (item) {
      await copy(item.id);
    }
  },

  copy: async id => {
    const item = get().items.find(i => i.id === id);
    if (!item) {
      return;
    }

    const content =
      item.type === 'text' ? (await getContent(id)) ?? '' : '';

    await ClipboardMonitor.write({
      type: item.type,
      content,
      filePath: item.filePath ?? undefined,
    });

    await Popover.hide();
  },
}));

export function disposeHistory() {
  subscription?.remove();
  subscription = null;
  hotkeySub?.remove();
  hotkeySub = null;
  ClipboardMonitor.stop();
  Hotkey.unregister();
}
