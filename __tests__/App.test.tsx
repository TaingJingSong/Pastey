import 'react-native';
import React from 'react';
import { it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Alert, NativeModules } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import App from '../src/App';
import { useHistoryStore } from '../src/store/historyStore';
import { useSettingsStore } from '../src/store/settingsStore';

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

it('clicking preview lines quick icon cycles previewLines setting', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  expect(useSettingsStore.getState().values.previewLines).toBe(1);

  const toggleBtn = tree.root.findByProps({ testID: 'quick-preview-lines-button' });
  await act(async () => {
    toggleBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(useSettingsStore.getState().values.previewLines).toBe(2);

  await act(async () => {
    toggleBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(useSettingsStore.getState().values.previewLines).toBe(3);

  await act(async () => {
    toggleBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(useSettingsStore.getState().values.previewLines).toBe(1);
});

it('clicking clear quick icon opens Alert dialog', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert');
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  const clearBtn = tree.root.findByProps({ testID: 'quick-clear-button' });
  await act(async () => {
    clearBtn.props.onPress();
  });

  expect(alertSpy).toHaveBeenCalled();
  expect(alertSpy.mock.calls[0][0]).toBe('Clear Clipboard History');
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

it('clicking preview toggle button toggles side preview', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  currentTree = tree;

  expect(useSettingsStore.getState().values.previewLayout).toBe('popup');

  const toggleBtn = tree.root.findByProps({ testID: 'quick-preview-toggle-button' });
  await act(async () => {
    toggleBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(useSettingsStore.getState().values.previewLayout).toBe('side');

  // Verify side preview container is mounted
  const preview = tree.root.findByProps({ testID: 'item-preview-container' });
  expect(preview).toBeDefined();

  // Toggle back
  await act(async () => {
    toggleBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  expect(useSettingsStore.getState().values.previewLayout).toBe('popup');
});

it('clicking item preview button opens Quick Look popup modal', async () => {
  act(() => {
    useHistoryStore.setState({
      items: [
        { id: 201, hash: 'h201', type: 'text', preview: 'full preview test item', filePath: null, createdAt: 1, pinned: 0 },
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

  // Initially modal is not open
  expect(tree.root.findAllByProps({ testID: 'preview-popup-modal' }).length).toBe(0);

  // Click item preview button
  const itemPreviewBtn = tree.root.findByProps({ testID: 'preview-button-201' });
  await act(async () => {
    itemPreviewBtn.props.onPress();
  });

  // Modal is now open
  const modal = tree.root.findByProps({ testID: 'preview-popup-modal' });
  expect(modal).toBeDefined();

  // Click backdrop to close
  const backdrop = tree.root.findByProps({ testID: 'preview-popup-backdrop' });
  await act(async () => {
    backdrop.props.onPress();
  });

  expect(tree.root.findAllByProps({ testID: 'preview-popup-modal' }).length).toBe(0);
});
