import React from 'react';
import { FlatList } from 'react-native';
import { ClipItem } from '../db/queries';
import { HistoryItem } from './HistoryItem';

interface Props {
  items: ClipItem[];
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export function HistoryList({ items, onSelect, onDelete }: Props) {
  return (
    <FlatList
      data={items}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => (
        <HistoryItem item={item} onPress={() => onSelect(item.id)} onLongPress={() => onDelete(item.id)}/>
      )}
    />
  );
}
