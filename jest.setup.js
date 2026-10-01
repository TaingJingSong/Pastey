/* global jest */
const RN = require('react-native');
const { NativeModules } = RN;
if (typeof RN.useColorScheme !== 'function') {
  RN.useColorScheme = jest.fn(() => 'light');
}
require('@shopify/flash-list/jestSetup');

NativeModules.ClipboardMonitor = {
  start: jest.fn(),
  stop: jest.fn(),
  write: jest.fn().mockResolvedValue(true),
  syncImages: jest.fn().mockResolvedValue(0),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

NativeModules.HotkeyModule = {
  register: jest.fn().mockResolvedValue(true),
  unregister: jest.fn().mockResolvedValue(true),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

NativeModules.PasteySQLite = {
  open: jest.fn().mockResolvedValue(true),
  execute: jest.fn().mockResolvedValue('[]'),
};

NativeModules.PopoverModule = {
  show: jest.fn().mockResolvedValue(true),
  hide: jest.fn().mockResolvedValue(true),
  toggle: jest.fn().mockResolvedValue(true),
  attachKeyMonitor: jest.fn(),
  showPreview: jest.fn().mockResolvedValue(true),
  hidePreview: jest.fn().mockResolvedValue(true),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

NativeModules.SettingsWindowModule = {
  open: jest.fn().mockResolvedValue(true),
};

let userDefaults = {};
NativeModules.SettingsModule = {
  get: jest.fn(key => Promise.resolve(userDefaults[key] ?? null)),
  set: jest.fn((key, value) => {
    userDefaults[key] = value;
    return Promise.resolve(true);
  }),
  all: jest.fn(() => Promise.resolve(userDefaults)),
};
