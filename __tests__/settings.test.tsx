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
import { pruneOldItems } from '../src/db/queries';

const DAY_MS = 24 * 60 * 60 * 1000;

const settings = NativeModules.SettingsModule as unknown as {
  get: jest.Mock<(key: string) => Promise<unknown>>;
  set: jest.Mock<(key: string, value: unknown) => Promise<boolean>>;
  all: jest.Mock<() => Promise<Record<string, unknown>>>;
};

const sql = NativeModules.PasteySQLite as unknown as {
  execute: jest.Mock<(statement: string, params?: unknown[]) => Promise<string>>;
};

function currentMaxItemsInput(tree: renderer.ReactTestRenderer): any {
  return tree.root.findByType(TextInput as React.ComponentType<any>);
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
      values: { maxItems: 500, maxAgeDays: 30 },
      ready: false,
    });
  });
});

it('SettingsApp renders and loads defaults from the settings store', async () => {
  const tree = await mount();

  expect(tree.toJSON()).toBeTruthy();
  expect(useSettingsStore.getState().ready).toBe(true);
  expect(useSettingsStore.getState().values.maxItems).toBe(500);
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
  settings.all.mockResolvedValue({ maxItems: 250 });

  await mount();

  expect(useSettingsStore.getState().values.maxItems).toBe(250);
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
