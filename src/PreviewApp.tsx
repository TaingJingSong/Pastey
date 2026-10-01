import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ItemPreview } from './components/ItemPreview';
import { usePreviewStore } from './store/previewStore';
import { useHistoryStore } from './store/historyStore';
import { useTheme } from './theme';

export function PreviewApp(): React.JSX.Element {
  const { item, fullContent, closePreview } = usePreviewStore();
  const { copy, toggle } = useHistoryStore();
  const { colors } = useTheme();

  return (
    <View
      testID="pastey-preview-root"
      style={[styles.container, { backgroundColor: colors.windowBackground }]}
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
