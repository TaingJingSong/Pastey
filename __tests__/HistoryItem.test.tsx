import 'react-native';
import React from 'react';
import { it, expect, jest } from '@jest/globals';
import renderer, { act } from 'react-test-renderer';
import { HistoryItem } from '../src/components/HistoryItem';
import { lightColors } from '../src/theme/colors';
import { Text } from 'react-native';

const mockItem = {
  id: 1,
  hash: 'abc',
  type: 'text' as const,
  preview: 'Hello world first line\nSecond line\nThird line',
  filePath: null,
  createdAt: Date.now(),
  pinned: 0,
};

it('defaults to 1 preview line for minimal UI', () => {
  const tree = renderer.create(
    <HistoryItem
      item={mockItem}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
    />
  );

  const texts = tree.root.findAllByType(Text);
  const previewText = texts.find(t => t.props.children === mockItem.preview);
  expect(previewText).toBeDefined();
  expect(previewText?.props.numberOfLines).toBe(1);
});

it('respects configurable previewLines', () => {
  const tree = renderer.create(
    <HistoryItem
      item={mockItem}
      previewLines={3}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
    />
  );

  const texts = tree.root.findAllByType(Text);
  const previewText = texts.find(t => t.props.children === mockItem.preview);
  expect(previewText?.props.numberOfLines).toBe(3);
});

it('applies hover background color when mouse enters/hovers', () => {
  const tree = renderer.create(
    <HistoryItem
      item={mockItem}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
    />
  );

  const row = tree.root.findByProps({ testID: 'history-item-1' });

  // Initially not hovered
  const initialStyle: any[] = [].concat(...[row.props.style].flat());
  const initialBg = (initialStyle.find((s: any) => s && s.backgroundColor) as any)?.backgroundColor;
  expect(initialBg).toBeUndefined();

  // Hover in
  act(() => {
    row.props.onHoverIn();
  });

  const hoveredStyle = [].concat(...[row.props.style].flat());
  const hoveredBg = hoveredStyle.find((s: any) => s && s.backgroundColor === lightColors.hoverBg);
  expect(hoveredBg).toBeDefined();

  // Hover out
  act(() => {
    row.props.onHoverOut();
  });

  const unhoveredStyle = [].concat(...[row.props.style].flat());
  const unhoveredBg = unhoveredStyle.find((s: any) => s && s.backgroundColor === lightColors.hoverBg);
  expect(unhoveredBg).toBeUndefined();
});

it('applies selected background and text color when selected', () => {
  const tree = renderer.create(
    <HistoryItem
      item={mockItem}
      selected={true}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
    />
  );

  const row = tree.root.findByProps({ testID: 'history-item-1' });
  const rowStyles = [].concat(...[row.props.style].flat());
  const selectedBg = rowStyles.find((s: any) => s && s.backgroundColor === lightColors.selectedBg);
  expect(selectedBg).toBeDefined();

  const texts = tree.root.findAllByType(Text);
  const previewText = texts.find(t => t.props.children === mockItem.preview);
  const textStyles = [].concat(...[previewText?.props.style].flat());
  const selectedTextColor = textStyles.find((s: any) => s && s.color === lightColors.selectedText);
  expect(selectedTextColor).toBeDefined();
});

it('maintains consistent structure and padding on hover and selection (no size change)', () => {
  const tree = renderer.create(
    <HistoryItem
      item={mockItem}
      selected={false}
      compact={true}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
      onPreview={jest.fn()}
    />
  );

  const row = tree.root.findByProps({ testID: 'history-item-1' });

  // Baseline style
  const defaultStyles: any = Object.assign({}, ...[row.props.style].flat());
  expect(defaultStyles.minHeight).toBe(29);
  expect(defaultStyles.paddingVertical).toBe(6);

  // Hover in
  act(() => {
    row.props.onHoverIn();
  });
  const hoveredStyles: any = Object.assign({}, ...[row.props.style].flat());
  expect(hoveredStyles.minHeight).toBe(defaultStyles.minHeight);
  expect(hoveredStyles.paddingVertical).toBe(defaultStyles.paddingVertical);
  expect(hoveredStyles.paddingHorizontal).toBe(defaultStyles.paddingHorizontal);

  // Update to selected
  tree.update(
    <HistoryItem
      item={mockItem}
      selected={true}
      compact={true}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
      onPreview={jest.fn()}
    />
  );
  const selectedStyles: any = Object.assign({}, ...[row.props.style].flat());
  expect(selectedStyles.minHeight).toBe(defaultStyles.minHeight);
  expect(selectedStyles.paddingVertical).toBe(defaultStyles.paddingVertical);
  expect(selectedStyles.paddingHorizontal).toBe(defaultStyles.paddingHorizontal);
});

it('triggers onPreview callback when preview button is clicked', () => {
  const onPreviewMock = jest.fn();
  const tree = renderer.create(
    <HistoryItem
      item={mockItem}
      selected={true}
      onCopy={jest.fn()}
      onDelete={jest.fn()}
      onTogglePin={jest.fn()}
      onPreview={onPreviewMock}
    />
  );

  const previewBtn = tree.root.findByProps({ testID: 'preview-button-1' });
  act(() => {
    previewBtn.props.onPress();
  });

  expect(onPreviewMock).toHaveBeenCalledTimes(1);
});
