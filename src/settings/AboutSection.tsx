import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { SettingRow } from './controls/SettingRow';

const GITHUB_REPO_URL = 'https://github.com/anandubn/pastey';

export function AboutSection(): React.JSX.Element {
  const { ready, resetAllSettings } = useSettingsStore();
  const { colors } = useTheme();
  const [resetting, setResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleResetSettings = async () => {
    setResetting(true);
    try {
      await resetAllSettings();
      setResetStatus('Settings reset to defaults');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setResetStatus(null), 2500);
    } catch {
      setResetStatus('Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  const handleOpenGitHub = () => {
    Linking.openURL(GITHUB_REPO_URL).catch(() => {});
  };

  return (
    <View testID="about-section" style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.appName, { color: colors.text }]}>Pastey</Text>
        <Text style={[styles.versionText, { color: colors.secondaryText }]}>
          Version 0.0.1
        </Text>
        <Text style={[styles.descText, { color: colors.secondaryText }]}>
          Lightweight, native macOS clipboard manager with fast search and instant history.
        </Text>

        <Pressable
          testID="github-link-button"
          style={({ pressed }) => [
            styles.linkButton,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleOpenGitHub}
        >
          <Text style={[styles.linkText, { color: colors.accent }]}>
            GitHub Repository
          </Text>
        </Pressable>
      </View>

      <SettingRow
        label="Reset all settings"
        hint="Restores all settings, hotkeys, and excluded applications to their original defaults."
      >
        <View style={styles.resetRow}>
          {resetStatus ? (
            <Text style={[styles.statusText, { color: colors.secondaryText }]}>
              {resetStatus}
            </Text>
          ) : null}
          <Pressable
            testID="reset-all-settings-button"
            style={({ pressed }) => [
              styles.resetButton,
              {
                borderColor: colors.cardBorder,
                backgroundColor: colors.cardBg,
              },
              pressed && { opacity: 0.7 },
              resetting && { opacity: 0.5 },
            ]}
            onPress={handleResetSettings}
            disabled={!ready || resetting}
          >
            <Text style={[styles.resetButtonText, { color: colors.removeBtnText }]}>
              Reset All Settings
            </Text>
          </Pressable>
        </View>
      </SettingRow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  versionText: {
    fontSize: 12,
    marginBottom: 8,
  },
  descText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  linkButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginRight: 8,
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AboutSection;
