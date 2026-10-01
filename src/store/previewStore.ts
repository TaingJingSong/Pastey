import { create } from 'zustand';
import { ClipItem, getContent } from '../db/queries';
import { Popover } from '../native/PopoverModule';

export interface PreviewState {
  item: ClipItem | null;
  fullContent: string | null;
  isOpen: boolean;
  openPreview: (item: ClipItem) => Promise<void>;
  closePreview: () => Promise<void>;
  togglePreview: (item: ClipItem) => Promise<void>;
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  item: null,
  fullContent: null,
  isOpen: false,

  openPreview: async (item: ClipItem) => {
    set({ item, fullContent: item.preview, isOpen: true });
    await Popover.showPreview();
    if (item.type === 'text') {
      const full = await getContent(item.id);
      if (get().item?.id === item.id) {
        set({ fullContent: full ?? item.preview });
      }
    }
  },

  closePreview: async () => {
    set({ item: null, fullContent: null, isOpen: false });
    await Popover.hidePreview();
  },

  togglePreview: async (item: ClipItem) => {
    const { item: current, isOpen } = get();
    if (isOpen && current?.id === item.id) {
      await get().closePreview();
    } else {
      await get().openPreview(item);
    }
  },
}));
