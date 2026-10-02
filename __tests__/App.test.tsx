import 'react-native';
import React from 'react';
import { it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NativeModules } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import App from '../src/App';
import { useHistoryStore } from '../src/store/historyStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { usePreviewStore } from '../src/store/previewStore';

const sql = NativeModules.PasteySQLite as unknown as {
  execute: jest.Mock<(statement: string, params?: unknown[]) => Promise<any>>;
};

const settingsWindow = NativeModules.SettingsWindowModule as unknown as {
  open: jest.Mock<() => Promise<boolean>>;
};

let currentTree: renderer.ReactTestRenderer | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  sql.execute.mockResolvedValue('[]');
  act(() => {
    useSettingsStore.setState({
      values: {
        maxItems: 500,
        maxAgeDays: 30,
        launchAtLogin: false,
        previewLines: 1,
        previewLayout: 'popup',
        theme: 'system',
        systemTheme: 'light',
        historyPosition: 'menubar',
        shortcutKey: 9,
        shortcutModifiers: 0x0100 + 0x0200,
        shortcutLabel: '⌘⇧V',
        excludedApps: [],
      },
      ready: true,
    });
  });
});

afterEach(async () => {
  if (currentTree) {
    await act(async () => {
      currentTree?.unmount();
    });
    currentTree = null;
  }
});

it('renders correctly', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;
  expect(tree.toJSON()).toBeTruthy();
});

it('clicking settings quick icon calls SettingsWindow.open()', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const settingsBtn = tree.root.findByProps({ testID: 'quick-settings-button' });
  await act(async () => {
    settingsBtn.props.onPress();
  });

  expect(settingsWindow.open).toHaveBeenCalledTimes(1);
});

it('renders only the settings icon in the action bar, omitting quick clear and preview lines', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const settingsBtn = tree.root.findByProps({ testID: 'quick-settings-button' });
  expect(settingsBtn).toBeDefined();

  const clearButtons = tree.root.findAllByProps({ testID: 'quick-clear-button' });
  expect(clearButtons.length).toBe(0);

  const previewButtons = tree.root.findAllByProps({ testID: 'quick-preview-lines-button' });
  expect(previewButtons.length).toBe(0);
});

it('arrow keys navigate item selection in store and list', async () => {
  act(() => {
    useHistoryStore.setState({
      items: [
        { id: 101, hash: 'h1', type: 'text', preview: 'item 1', filePath: null, createdAt: 1, pinned: 0 },
        { id: 102, hash: 'h2', type: 'text', preview: 'item 2', filePath: null, createdAt: 2, pinned: 0 },
        { id: 103, hash: 'h3', type: 'text', preview: 'item 3', filePath: null, createdAt: 3, pinned: 0 },
      ],
      selectedIndex: 0,
    });
  });

  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const searchInput = tree.root.findByProps({ testID: 'search-input' });

  // Press down arrow
  await act(async () => {
    searchInput.props.onKeyPress({ nativeEvent: { key: 'ArrowDown' } });
    await new Promise(resolve => setTimeout(resolve, 20));
  });

  expect(useHistoryStore.getState().selectedIndex).toBe(1);

  // Press down arrow again
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 60)); // pass debounce
    searchInput.props.onKeyPress({ nativeEvent: { key: 'ArrowDown' } });
  });

  expect(useHistoryStore.getState().selectedIndex).toBe(2);

  // Press up arrow
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 60)); // pass debounce
    searchInput.props.onKeyPress({ nativeEvent: { key: 'ArrowUp' } });
  });

  expect(useHistoryStore.getState().selectedIndex).toBe(1);
});

it('clicking item preview button (>) opens auxiliary preview popup window', async () => {
  const popoverModule = NativeModules.PopoverModule as unknown as {
    showPreview: jest.Mock<() => Promise<boolean>>;
    hidePreview: jest.Mock<() => Promise<boolean>>;
  };

  act(() => {
    useHistoryStore.setState({
      items: [
        { id: 201, hash: 'h201', type: 'text', preview: 'preview test item', filePath: null, createdAt: 1, pinned: 0 },
      ],
      selectedIndex: 0,
    });
  });

  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  // Click item preview button (>)
  const itemPreviewBtn = tree.root.findByProps({ testID: 'preview-button-201' });
  await act(async () => {
    itemPreviewBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(popoverModule.showPreview).toHaveBeenCalledTimes(1);
  expect(usePreviewStore.getState().isOpen).toBe(true);
  expect(usePreviewStore.getState().item?.id).toBe(201);

  // Closing preview calls hidePreview
  await act(async () => {
    await usePreviewStore.getState().closePreview();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(popoverModule.hidePreview).toHaveBeenCalled();
  expect(usePreviewStore.getState().isOpen).toBe(false);
});

it('hover preview is transient (closes on mouse leave), while click preview remains persistent', async () => {
  const popoverModule = NativeModules.PopoverModule as unknown as {
    showPreview: jest.Mock<() => Promise<boolean>>;
    hidePreview: jest.Mock<() => Promise<boolean>>;
  };

  act(() => {
    useHistoryStore.setState({
      items: [
        { id: 301, hash: 'h301', type: 'text', preview: 'hover preview item', filePath: null, createdAt: 1, pinned: 0 },
      ],
      selectedIndex: 0,
    });
  });

  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const historyItem = tree.root.findByProps({ testID: 'history-item-301' });

  // 1. Simulate hover opening preview (transient)
  await act(async () => {
    await usePreviewStore.getState().openPreview(useHistoryStore.getState().items[0], false);
  });
  expect(popoverModule.showPreview).toHaveBeenCalled();
  expect(usePreviewStore.getState().isOpen).toBe(true);
  expect(usePreviewStore.getState().isPersistent).toBe(false);

  // Mouse leaves history item, but enters the preview popup window within the 300ms grace period
  await act(async () => {
    historyItem.props.onHoverOut();
    // Simulate user moving mouse towards the preview popup within 50ms
    await new Promise(resolve => setTimeout(resolve, 50));
    // User moves mouse over preview popup window
    usePreviewStore.getState().setPreviewHovered(true);
    // Wait past the original 300ms timer
    await new Promise(resolve => setTimeout(resolve, 350));
  });

  // Preview remains open while hovered on popup window!
  expect(usePreviewStore.getState().isOpen).toBe(true);
  expect(usePreviewStore.getState().isPreviewHovered).toBe(true);

  // When user moves mouse out of preview popup window
  await act(async () => {
    usePreviewStore.getState().setPreviewHovered(false);
    // Wait for the 300ms grace delay to expire
    await new Promise(resolve => setTimeout(resolve, 350));
  });

  // Now transient preview is closed ("pupouts")
  expect(usePreviewStore.getState().isOpen).toBe(false);

  // 2. Click `>` to open persistent preview
  const itemPreviewBtn = tree.root.findByProps({ testID: 'preview-button-301' });
  await act(async () => {
    itemPreviewBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });
  expect(usePreviewStore.getState().isOpen).toBe(true);
  expect(usePreviewStore.getState().isPersistent).toBe(true);

  // Mouse leave does NOT close persistent preview even after grace timer
  await act(async () => {
    historyItem.props.onHoverOut();
    await new Promise(resolve => setTimeout(resolve, 350));
  });
  expect(usePreviewStore.getState().isOpen).toBe(true);
  expect(usePreviewStore.getState().isPersistent).toBe(true);

  // Clean up
  await act(async () => {
    await usePreviewStore.getState().closePreview();
  });
});

it('does not render resize handles when opened from menubar', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App mode="popover" position="menubar" />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const rightHandles = tree.root.findAllByProps({ testID: 'resize-handle-right' });
  const bottomHandles = tree.root.findAllByProps({ testID: 'resize-handle-bottom' });
  const cornerGrips = tree.root.findAllByProps({ testID: 'resize-grip' });

  expect(rightHandles.length).toBe(0);
  expect(bottomHandles.length).toBe(0);
  expect(cornerGrips.length).toBe(0);
});

it('renders interactive resize handles only in mouse position mode and resizes window', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App mode="popover" position="mouse" />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const rightHandle = tree.root.findByProps({ testID: 'resize-handle-right' });
  const bottomHandle = tree.root.findByProps({ testID: 'resize-handle-bottom' });
  const cornerGrip = tree.root.findByProps({ testID: 'resize-grip' });

  expect(rightHandle).toBeDefined();
  expect(bottomHandle).toBeDefined();
  expect(cornerGrip).toBeDefined();

  const mockEvent = { touchHistory: { touchBank: [] }, nativeEvent: {} };
  await act(async () => {
    cornerGrip.props.onResponderGrant(mockEvent);
    cornerGrip.props.onResponderRelease(mockEvent);
  });

  expect(NativeModules.PopoverModule.setContentSize).toHaveBeenCalled();
});


