import { create } from 'zustand';
import { ClipItem, getContent } from '../db/queries';
import { Popover } from '../native/PopoverModule';

export interface PreviewState {
  item: ClipItem | null;
  fullContent: string | null;
  height: number;
  isOpen: boolean;
  isPersistent: boolean;
  isPreviewHovered: boolean;
  openPreview: (item: ClipItem, isPersistent?: boolean) => Promise<void>;
  closePreview: () => Promise<void>;
  closeHoverPreview: (itemId?: number, immediate?: boolean) => Promise<void>;
  setPreviewHovered: (hovered: boolean) => void;
  cancelCloseHoverTimer: (itemId?: number) => void;
  togglePreview: (item: ClipItem) => Promise<void>;
}

export const measureHeight = (
  item: ClipItem | null,
  fullContent: string | null,
  lines: number = 0
): number => {
  if (!item) return 260;
  if (item.type === 'image') return 360;

  const text = fullContent ?? item.preview;
  const charPerLine = 42;
  const wrapped = Math.ceil(text.length / charPerLine);
  const bodyLines = Math.min(wrapped, lines === 0 ? 100 : 20);
  const bodyHeight = bodyLines * 20;
  const chrome = 120; // header + footer + padding
  return Math.max(200, Math.min(560, chrome + bodyHeight));
};

let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

function clearCloseTimer() {
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer);
    hoverCloseTimer = null;
  }
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  item: null,
  fullContent: null,
  height: 260,
  isOpen: false,
  isPersistent: false,
  isPreviewHovered: false,

  openPreview: async (item: ClipItem, isPersistent = false) => {
    clearCloseTimer();
    if (!isPersistent && get().isOpen && get().isPersistent) {
      return;
    }

    const initialHeight = measureHeight(item, item.preview, 0);
    set({ item, fullContent: item.preview, height: initialHeight, isOpen: true, isPersistent });
    await Popover.setPreviewHeight(initialHeight);
    await Popover.showPreview();
    if (item.type === 'text') {
      const full = await getContent(item.id);
      if (get().item?.id === item.id) {
        const fullText = full ?? item.preview;
        const updatedHeight = measureHeight(item, fullText, 0);
        set({ fullContent: fullText, height: updatedHeight });
        await Popover.setPreviewHeight(updatedHeight);
      }
    }
  },

  closePreview: async () => {
    clearCloseTimer();
    set({
      item: null,
      fullContent: null,
      height: 260,
      isOpen: false,
      isPersistent: false,
      isPreviewHovered: false,
    });
    await Popover.hidePreview();
  },

  setPreviewHovered: (hovered: boolean) => {
    set({ isPreviewHovered: hovered });
    if (hovered) {
      clearCloseTimer();
    } else {
      const { isOpen, isPersistent } = get();
      if (isOpen && !isPersistent) {
        clearCloseTimer();
        hoverCloseTimer = setTimeout(async () => {
          const state = get();
          if (!state.isOpen || state.isPersistent || state.isPreviewHovered) {
            return;
          }
          await state.closePreview();
        }, 300);
      }
    }
  },

  cancelCloseHoverTimer: (itemId?: number) => {
    const { item: current } = get();
    if (itemId === undefined || current?.id === itemId) {
      clearCloseTimer();
    }
  },

  closeHoverPreview: async (itemId?: number, immediate = false) => {
    const { item: current, isPersistent, isOpen, isPreviewHovered } = get();
    if (!isOpen || isPersistent) {
      return;
    }
    if (itemId !== undefined && current?.id !== itemId) {
      return;
    }
    if (isPreviewHovered) {
      return;
    }

    clearCloseTimer();

    if (immediate) {
      await get().closePreview();
      return;
    }

    hoverCloseTimer = setTimeout(async () => {
      const state = get();
      if (!state.isOpen || state.isPersistent || state.isPreviewHovered) {
        return;
      }
      await state.closePreview();
    }, 300);
  },

  togglePreview: async (item: ClipItem) => {
    clearCloseTimer();
    const { item: current, isOpen, isPersistent } = get();
    if (isOpen && current?.id === item.id && isPersistent) {
      await get().closePreview();
    } else {
      await get().openPreview(item, true);
    }
  },
}));
