import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { SFSymbol } from '../components/SFSymbol';

export type SectionId =
  | 'general'
  | 'appearance'
  | 'history'
  | 'shortcuts'
  | 'privacy'
  | 'about';

export interface SidebarSection {
  id: SectionId;
  label: string;
  icon: string;
}

export const SECTIONS: readonly SidebarSection[] = [
  { id: 'general', label: 'General', icon: 'gearshape' },
  { id: 'appearance', label: 'Appearance', icon: 'paintbrush' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'command' },
  { id: 'privacy', label: 'Privacy', icon: 'hand.raised' },
  { id: 'about', label: 'About', icon: 'info.circle' },
];

export interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderRightColor: colors.separator,
          backgroundColor: colors.cardBg,
        },
      ]}
      testID="settings-sidebar"
    >
      <View style={styles.list}>
        {SECTIONS.map(section => {
          const isSelected = active === section.id;
          return (
            <Pressable
              key={section.id}
              testID={`sidebar-item-${section.id}`}
              style={({ pressed }) => [
                styles.item,
                isSelected && [
                  styles.itemSelected,
                  { backgroundColor: colors.segmentSelectedBg },
                ],
                pressed && !isSelected && styles.itemPressed,
              ]}
              onPress={() => onSelect(section.id)}
            >
              <SFSymbol
                name={section.icon}
                size={14}
                color={isSelected ? colors.text : colors.secondaryText}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected ? colors.text : colors.secondaryText,
                  },
                  isSelected && styles.labelSelected,
                ]}
              >
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 2,
  },
  itemSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemPressed: {
    opacity: 0.7,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
  },
  labelSelected: {
    fontWeight: '600',
  },
});

export default Sidebar;
