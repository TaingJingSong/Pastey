import 'react-native';
import React from 'react';
import { it, expect, jest } from '@jest/globals';
import renderer, { act } from 'react-test-renderer';
import { SearchBar } from '../src/components/SearchBar';

it('renders search input with magnifyingglass symbol', () => {
  const onSearchMock = jest.fn();
  const tree = renderer.create(<SearchBar onSearch={onSearchMock} />);

  const input = tree.root.findByProps({ testID: 'search-input' });
  expect(input).toBeDefined();

  const searchSymbol = tree.root.findByProps({ name: 'magnifyingglass' });
  expect(searchSymbol).toBeDefined();
});

it('renders clear history button next to settings and triggers onClearHistory', () => {
  const onClearHistoryMock = jest.fn();
  const onOpenSettingsMock = jest.fn();

  const tree = renderer.create(
    <SearchBar
      onSearch={jest.fn()}
      onClearHistory={onClearHistoryMock}
      onOpenSettings={onOpenSettingsMock}
    />
  );

  const clearBtn = tree.root.findByProps({ testID: 'clear-history-button' });
  expect(clearBtn).toBeDefined();
  expect(clearBtn.findByProps({ name: 'trash' })).toBeDefined();

  const settingsBtn = tree.root.findByProps({ testID: 'quick-settings-button' });
  expect(settingsBtn).toBeDefined();
  expect(settingsBtn.findByProps({ name: 'gearshape' })).toBeDefined();

  act(() => {
    clearBtn.props.onPress();
  });
  expect(onClearHistoryMock).toHaveBeenCalledTimes(1);

  act(() => {
    settingsBtn.props.onPress();
  });
  expect(onOpenSettingsMock).toHaveBeenCalledTimes(1);
});

it('shows clear search button when text is typed and clears text on press', () => {
  const onSearchMock = jest.fn();
  const tree = renderer.create(<SearchBar onSearch={onSearchMock} />);

  const input = tree.root.findByProps({ testID: 'search-input' });

  // Initially no clear search button
  expect(tree.root.findAllByProps({ testID: 'clear-search-button' }).length).toBe(0);

  // Type text
  act(() => {
    input.props.onChangeText('hello');
  });

  const clearSearchBtn = tree.root.findByProps({ testID: 'clear-search-button' });
  expect(clearSearchBtn).toBeDefined();
  expect(clearSearchBtn.findByProps({ name: 'xmark.circle.fill' })).toBeDefined();

  // Press clear
  act(() => {
    clearSearchBtn.props.onPress();
  });

  expect(input.props.value).toBe('');
});
