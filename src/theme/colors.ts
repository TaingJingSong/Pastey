export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  windowBackground: string;
  cardBg: string;
  cardBorder: string;
  cardRowBorder: string;
  text: string;
  secondaryText: string;
  placeholderText: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
  separator: string;
  itemBorder: string;
  pinnedBg: string;
  selectedBg: string;
  selectedText: string;
  pin: string;
  pinSelected: string;
  accent: string;
  accentText: string;
  removeBtnBg: string;
  removeBtnText: string;
  segmentBg: string;
  segmentBorder: string;
  segmentSelectedBg: string;
  segmentSelectedText: string;
}

export const lightColors: ThemeColors = {
  windowBackground: '#ffffff',
  cardBg: '#fbfbfd',
  cardBorder: '#e5e5ea',
  cardRowBorder: '#f0f0f2',
  text: '#1c1c1e',
  secondaryText: '#8e8e93',
  placeholderText: '#8e8e93',
  inputBg: '#ffffff',
  inputBorder: '#d1d1d6',
  divider: '#e5e5ea',
  separator: 'rgba(0, 0, 0, 0.08)',
  itemBorder: 'rgba(0, 0, 0, 0.08)',
  pinnedBg: 'rgba(255, 204, 0, 0.12)',
  selectedBg: '#007aff',
  selectedText: '#ffffff',
  pin: '#ff9500',
  pinSelected: '#ffffff',
  accent: '#007aff',
  accentText: '#ffffff',
  removeBtnBg: '#ececee',
  removeBtnText: '#ff3b30',
  segmentBg: '#e5e5ea',
  segmentBorder: '#d1d1d6',
  segmentSelectedBg: '#ffffff',
  segmentSelectedText: '#000000',
};

export const darkColors: ThemeColors = {
  windowBackground: '#1e1e1e',
  cardBg: '#262628',
  cardBorder: '#38383a',
  cardRowBorder: '#2e2e30',
  text: '#f2f2f7',
  secondaryText: '#98989d',
  placeholderText: '#636366',
  inputBg: '#2c2c2e',
  inputBorder: '#444446',
  divider: '#38383a',
  separator: 'rgba(255, 255, 255, 0.10)',
  itemBorder: 'rgba(255, 255, 255, 0.08)',
  pinnedBg: 'rgba(255, 204, 0, 0.18)',
  selectedBg: '#0a84ff',
  selectedText: '#ffffff',
  pin: '#ff9f0a',
  pinSelected: '#ffffff',
  accent: '#0a84ff',
  accentText: '#ffffff',
  removeBtnBg: '#38383a',
  removeBtnText: '#ff453a',
  segmentBg: '#2c2c2e',
  segmentBorder: '#38383a',
  segmentSelectedBg: '#505054',
  segmentSelectedText: '#ffffff',
};
