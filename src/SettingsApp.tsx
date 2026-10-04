import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSettingsStore } from './store/settingsStore';
import { useTheme } from './theme';
import { Sidebar, SectionId } from './settings/Sidebar';
import { GeneralSection } from './settings/GeneralSection';
import { AppearanceSection } from './settings/AppearanceSection';
import { HistorySection } from './settings/HistorySection';
import { ShortcutsSection } from './settings/ShortcutsSection';
import { PrivacySection } from './settings/PrivacySection';
import { AboutSection } from './settings/AboutSection';

export interface SettingsAppProps {
  initialSection?: SectionId;
}

// Deliberately does not touch the history store: calling its init() here would
// start a second clipboard monitor and register the global hotkey twice.
export function SettingsApp({ initialSection = 'general' }: SettingsAppProps = {}): React.JSX.Element {
  const { load } = useSettingsStore();
  const { colors } = useTheme();
  const [active, setActive] = useState<SectionId>(initialSection);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View
      style={[styles.root, { backgroundColor: colors.windowBackground }]}
      testID="settings-root"
    >
      <Sidebar active={active} onSelect={setActive} />
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentInner}
        >
          <View style={[styles.sectionWrapper, active !== 'general' && styles.hidden]}>
            <GeneralSection />
          </View>
          <View style={[styles.sectionWrapper, active !== 'appearance' && styles.hidden]}>
            <AppearanceSection />
          </View>
          <View style={[styles.sectionWrapper, active !== 'history' && styles.hidden]}>
            <HistorySection />
          </View>
          <View style={[styles.sectionWrapper, active !== 'shortcuts' && styles.hidden]}>
            <ShortcutsSection />
          </View>
          <View style={[styles.sectionWrapper, active !== 'privacy' && styles.hidden]}>
            <PrivacySection />
          </View>
          <View style={[styles.sectionWrapper, active !== 'about' && styles.hidden]}>
            <AboutSection />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
    paddingBottom: 36,
  },
  sectionWrapper: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});

export default SettingsApp;
