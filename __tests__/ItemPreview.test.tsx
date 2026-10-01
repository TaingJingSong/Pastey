import 'react-native';
import React from 'react';
import { it, expect, jest } from '@jest/globals';
import renderer, { act } from 'react-test-renderer';
import { ItemPreview } from '../src/components/ItemPreview';
import { ClipItem } from '../src/db/queries';
import { Text } from 'react-native';

const mockTextItem: ClipItem = {
  id: 10,
  hash: 'text10',
  type: 'text',
  preview: 'Hello world\nSecond line of text',
  filePath: null,
  createdAt: 1700000000000,
  pinned: 0,
};

const mockImageItem: ClipItem = {
  id: 20,
  hash: 'img20',
  type: 'image',
  preview: '[image]',
  filePath: '/path/to/image.png',
  createdAt: 1700000000000,
  pinned: 1,
};

it('renders empty message when no item is selected', () => {
  const tree = renderer.create(
    <ItemPreview item={null} onCopy={jest.fn()} />
  );
  const text = tree.root.findAllByType(Text);
  expect(text.some(t => t.props.children === 'Select an item to preview full content')).toBe(true);
});

const multilineText = 'Hello world\nSecond line of text';

it('renders full text and metadata for text items', () => {
  const tree = renderer.create(
    <ItemPreview
      item={mockTextItem}
      fullContent={multilineText}
      onCopy={jest.fn()}
      onTogglePin={jest.fn()}
    />
  );

  const fullText = tree.root.findByProps({ testID: 'preview-full-text' });
  expect(fullText.props.children).toBe(multilineText);

  const texts = tree.root.findAllByType(Text);
  const meta = texts.find(t => typeof t.props.children === 'string' && t.props.children.includes('2 lines'));
  expect(meta).toBeDefined();
});

it('renders image view for image items', () => {
  const tree = renderer.create(
    <ItemPreview
      item={mockImageItem}
      onCopy={jest.fn()}
      onTogglePin={jest.fn()}
    />
  );

  const image = tree.root.findByProps({ testID: 'preview-image' });
  expect(image).toBeDefined();
  expect(image.props.source.uri).toBe('file:///path/to/image.png');
});

it('calls onCopy and shows Copied feedback when copy button is pressed', () => {
  const copyMock = jest.fn();
  const tree = renderer.create(
    <ItemPreview
      item={mockTextItem}
      fullContent="Sample text"
      onCopy={copyMock}
    />
  );

  const copyBtn = tree.root.findByProps({ testID: 'preview-copy-button' });
  act(() => {
    copyBtn.props.onPress();
  });

  expect(copyMock).toHaveBeenCalledWith(10);
  const copyBtnText = copyBtn.findByType(Text);
  expect(copyBtnText.props.children).toBe('Copied');

  act(() => {
    tree.unmount();
  });
});

it('calls onTogglePin when pin button is pressed', () => {
  const pinMock = jest.fn();
  const tree = renderer.create(
    <ItemPreview
      item={mockTextItem}
      fullContent="Sample text"
      onCopy={jest.fn()}
      onTogglePin={pinMock}
    />
  );

  const pinBtn = tree.root.findByProps({ testID: 'preview-pin-button' });
  act(() => {
    pinBtn.props.onPress();
  });

  expect(pinMock).toHaveBeenCalledWith(10);
});

it('shows close button in popup mode and calls onClose', () => {
  const closeMock = jest.fn();
  const tree = renderer.create(
    <ItemPreview
      item={mockTextItem}
      fullContent="Sample text"
      onCopy={jest.fn()}
      onClose={closeMock}
      isPopup={true}
    />
  );

  const closeBtn = tree.root.findByProps({ testID: 'preview-close-button' });
  act(() => {
    closeBtn.props.onPress();
  });

  expect(closeMock).toHaveBeenCalledTimes(1);
});

it('renders PreviewApp root with item from previewStore', () => {
  const { PreviewApp } = require('../src/PreviewApp');
  const { usePreviewStore } = require('../src/store/previewStore');

  act(() => {
    usePreviewStore.setState({
      item: mockTextItem,
      fullContent: 'PreviewApp content',
      isOpen: true,
    });
  });

  const tree = renderer.create(<PreviewApp />);
  const fullText = tree.root.findByProps({ testID: 'preview-full-text' });
  expect(fullText.props.children).toBe('PreviewApp content');
  act(() => {
    tree.unmount();
  });
});

it('tracks hover in and hover out on PreviewApp container', async () => {
  const { PreviewApp } = require('../src/PreviewApp');
  const { usePreviewStore } = require('../src/store/previewStore');

  act(() => {
    usePreviewStore.setState({
      item: mockTextItem,
      fullContent: 'Hover tracking content',
      isOpen: true,
      isPreviewHovered: false,
    });
  });

  const tree = renderer.create(<PreviewApp />);
  const root = tree.root.findByProps({ testID: 'pastey-preview-root' });

  // Hover in on preview popup window
  act(() => {
    root.props.onMouseEnter();
  });
  expect(usePreviewStore.getState().isPreviewHovered).toBe(true);

  // Hover out of preview popup window
  act(() => {
    root.props.onMouseLeave();
  });
  expect(usePreviewStore.getState().isPreviewHovered).toBe(false);

  // Cleanup: unmount tree and close preview to cancel any pending timer
  await act(async () => {
    tree.unmount();
    await usePreviewStore.getState().closePreview();
  });
});


