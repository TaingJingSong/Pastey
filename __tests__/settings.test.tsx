/**
 * @format
 */

import 'react-native';
import React from 'react';
import { it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NativeModules, TextInput } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import SettingsApp from '../src/SettingsApp';
import { useSettingsStore } from '../src/store/settingsStore';
import { insertClip, pruneOldItems } from '../src/db/queries';

const DAY_MS = 24 * 60 * 60 * 1000;

const settings = NativeModules.SettingsModule as unknown as {
  get: jest.Mock<(key: string) => Promise<unknown>>;
  set: jest.Mock<(key: string, value: unknown) => Promise<boolean>>;
  all: jest.Mock<() => Promise<Record<string, unknown>>>;
};

const sql = NativeModules.PasteySQLite as unknown as {
  execute: jest.Mock<(statement: string, params?: unknown[]) => Promise<any>>;
};

function currentMaxItemsInput(tree: renderer.ReactTestRenderer): any {
  return tree.root.findByProps({ testID: 'max-items-input' });
}

let mounted: renderer.ReactTestRenderer | undefined;

async function mount() {
  let tree: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<SettingsApp />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  mounted = tree!;
  return tree!;
}

afterEach(async () => {
  const tree = mounted;
  mounted = undefined;
  await act(async () => {
    tree?.unmount();
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  sql.execute.mockResolvedValue('[]');
  settings.all.mockResolvedValue({});
  settings.get.mockImplementation(() => Promise.resolve(null));
  act(() => {
    useSettingsStore.setState({
      values: {
        maxItems: 500,
        maxAgeDays: 30,
        launchAtLogin: false,
        theme: 'system',
        systemTheme: 'light',
        excludedApps: [
          'com.1password.1password',
          'com.agilebits.onepassword',
          'com.bitwarden.desktop',
          'org.keepassxc.keepassxc',
          'com.apple.keychainaccess',
        ],
      },
      ready: false,
    });
  });
});

it('SettingsApp renders and loads defaults from the settings store', async () => {
  const tree = await mount();

  expect(tree.toJSON()).toBeTruthy();
  expect(useSettingsStore.getState().ready).toBe(true);
  expect(useSettingsStore.getState().values.maxItems).toBe(500);
  expect(useSettingsStore.getState().values.launchAtLogin).toBe(false);
  expect(useSettingsStore.getState().values.theme).toBe('system');
  expect(useSettingsStore.getState().values.excludedApps).toContain('com.1password.1password');
});

it('selecting theme option updates store and persists to native settings module', async () => {
  const tree = await mount();
  const darkButton = tree.root.findByProps({ testID: 'theme-option-dark' });

  await act(async () => {
    darkButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith('theme', 'dark');
  expect(useSettingsStore.getState().values.theme).toBe('dark');

  const lightButton = tree.root.findByProps({ testID: 'theme-option-light' });
  await act(async () => {
    lightButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith('theme', 'light');
  expect(useSettingsStore.getState().values.theme).toBe('light');

  const systemButton = tree.root.findByProps({ testID: 'theme-option-system' });
  await act(async () => {
    systemButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith('theme', 'system');
  expect(useSettingsStore.getState().values.theme).toBe('system');
});

it('committing a value writes it through to the native settings module', async () => {
  const tree = await mount();
  const input = currentMaxItemsInput(tree);

  await act(async () => {
    input.props.onChangeText('42');
  });
  await act(async () => {
    input.props.onSubmitEditing();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith('maxItems', 42);
  expect(useSettingsStore.getState().values.maxItems).toBe(42);
});

it('clamps out-of-range input instead of persisting it', async () => {
  const tree = await mount();
  const input = currentMaxItemsInput(tree);

  await act(async () => {
    input.props.onChangeText('0');
  });
  await act(async () => {
    input.props.onSubmitEditing();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith('maxItems', 1);
});

it('loads a persisted value on mount', async () => {
  settings.all.mockResolvedValue({ maxItems: 250, launchAtLogin: true, theme: 'dark' });

  await mount();

  expect(useSettingsStore.getState().values.maxItems).toBe(250);
  expect(useSettingsStore.getState().values.launchAtLogin).toBe(true);
  expect(useSettingsStore.getState().values.theme).toBe('dark');
});

it('toggling launchAtLogin persists to settings module', async () => {
  const tree = await mount();
  const loginSwitch = tree.root.findByProps({ testID: 'launch-at-login-switch' });

  await act(async () => {
    loginSwitch.props.onValueChange(true);
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith('launchAtLogin', true);
  expect(useSettingsStore.getState().values.launchAtLogin).toBe(true);
});

it('adds and removes excluded applications in settings', async () => {
  const tree = await mount();
  const appInputs = tree.root.findAllByType(TextInput as React.ComponentType<any>);
  const addAppInput = appInputs.find(i => i.props.placeholder?.includes('keychainaccess'))!;
  const addButton = tree.root.findByProps({ testID: 'add-excluded-app-button' });

  await act(async () => {
    addAppInput.props.onChangeText('com.example.secretapp');
  });
  await act(async () => {
    addButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(settings.set).toHaveBeenCalledWith(
    'excludedApps',
    expect.arrayContaining(['com.example.secretapp'])
  );
  expect(useSettingsStore.getState().values.excludedApps).toContain('com.example.secretapp');

  const removeBtn = tree.root.findByProps({ testID: 'remove-app-com.example.secretapp' });
  await act(async () => {
    removeBtn.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  expect(useSettingsStore.getState().values.excludedApps).not.toContain('com.example.secretapp');
});

it('insertClip ignores clips from excluded applications', async () => {
  settings.get.mockImplementation((key: string) =>
    Promise.resolve(key === 'excludedApps' ? ['com.1password.1password'] : null)
  );

  await insertClip({
    hash: 'hash-pass-123',
    type: 'text',
    preview: 'master_password',
    content: 'master_password',
    bundleId: 'com.1password.1password',
    createdAt: Date.now(),
  });

  expect(sql.execute).not.toHaveBeenCalled();
});

it('insertClip saves clips from non-excluded applications', async () => {
  settings.get.mockImplementation((key: string) =>
    Promise.resolve(key === 'excludedApps' ? ['com.1password.1password'] : null)
  );
  sql.execute.mockResolvedValue(JSON.stringify([{ id: 1 }]));

  await insertClip({
    hash: 'hash-code-456',
    type: 'text',
    preview: 'console.log("hello")',
    content: 'console.log("hello")',
    bundleId: 'com.microsoft.VSCode',
    createdAt: Date.now(),
  });

  expect(sql.execute).toHaveBeenCalled();
  const [statement] = sql.execute.mock.calls[0] as [string, any[]];
  expect(statement).toContain('INSERT INTO items');
});

it('pruneOldItems takes its limits from the settings store, not constants', async () => {
  settings.get.mockImplementation((key: string) =>
    Promise.resolve(key === 'maxItems' ? 7 : 99)
  );

  const before = Date.now();
  await pruneOldItems();
  const after = Date.now();

  // Nothing to prune, so only the SELECT runs.
  expect(sql.execute).toHaveBeenCalledTimes(1);

  const [statement, params] = sql.execute.mock.calls[0] as [string, number[]];
  expect(statement).toContain('LIMIT ?');
  expect(params[1]).toBe(7);

  const cutoff = params[0] as number;
  expect(cutoff).toBeGreaterThanOrEqual(before - 99 * DAY_MS);
  expect(cutoff).toBeLessThanOrEqual(after - 99 * DAY_MS);
});
