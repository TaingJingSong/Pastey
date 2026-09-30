import React, { useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
} from 'react-native';
import { useHistoryStore } from './store/historyStore';
import { HistoryList } from './components/HistoryList';
import { SearchBar } from './components/SearchBar';

function App(): React.JSX.Element {
  const { items, init, toggle, remove, search } = useHistoryStore();

  useEffect(() => {
    init();
  }, [init]);

  const onSearch = useCallback((q: string) => {
      search(q);
    },
    [search]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>History ({items.length})</Text>
      <SearchBar onSearch={onSearch}/>
      <HistoryList items={items} onSelect={toggle} onDelete={remove}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  item: { fontSize: 14, paddingVertical: 4, opacity: 0.8 },
});

export default App;
