import React, { useEffect } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { ItemPreview } from './components/ItemPreview';
import { usePreviewStore } from './store/previewStore';
import { useHistoryStore } from './store/historyStore';
import { Popover } from './native/PopoverModule';

function computePreviewHeight(
  type: 'text' | 'image',
  preview: string,
  fullContent: string | null
): number {
  const HEADER = 44;
  const FOOTER = 26;
  const PADDING = 28;

  if (type === 'image') {
    return Math.min(560, HEADER + FOOTER + 320);
  }

  const text = fullContent ?? preview;
  const charsPerLine = 52;
  const wrapped = Math.ceil(text.length / charsPerLine);
  const visualLines = Math.min(Math.max(wrapped, 3), 22);
  const bodyHeight = visualLines * 18;

  return Math.max(220, Math.min(560, HEADER + FOOTER + PADDING + bodyHeight));
}

export function PreviewApp(): React.JSX.Element {
  const { item, fullContent,  closePreview, setPreviewHovered } = usePreviewStore();
  const { copy, toggle } = useHistoryStore();

  const itemId = item?.id;
  const itemType = item?.type;
  const itemPreview = item?.preview;

  useEffect(() => {
    if (!itemId || !itemType) {return;}
    const h = computePreviewHeight(itemType, itemPreview ?? '', fullContent);
    Popover.setPreviewHeight(h).catch(() => {});
  }, [itemId, itemType, itemPreview, fullContent]);

  const handleHoverIn = () => {
    setPreviewHovered(true);
  };

  const handleHoverOut = () => {
    setPreviewHovered(false);
  };

  const macOSViewProps = {
    onMouseEnter: handleHoverIn,
    onMouseLeave: handleHoverOut,
  } as ViewProps;

  return (
    <View
      testID="pastey-preview-root"
      style={[styles.container]}
      {...macOSViewProps}
    >
      <ItemPreview
        item={item}
        fullContent={fullContent}
        onCopy={id => {
          copy(id);
          closePreview();
        }}
        onTogglePin={toggle}
        onClose={closePreview}
        isPopup={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 380,
    height: 520,
    overflow: 'hidden',
  },
});

export default PreviewApp;
