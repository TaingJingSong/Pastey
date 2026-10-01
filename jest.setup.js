/* global jest */
const { NativeModules } = require('react-native');
require('@shopify/flash-list/jestSetup');

NativeModules.ClipboardMonitor = {
  start: jest.fn(),
  stop: jest.fn(),
  write: jest.fn().mockResolvedValue(true),
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
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};
