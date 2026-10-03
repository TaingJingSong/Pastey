# Pastey — Implementation Summary & Architecture

Pastey is a lightweight, high-performance clipboard manager designed specifically for macOS, built with **React Native macOS** (`react-native-macos` 0.76.3) and native **Swift** / **Objective-C++** modules.

This document summarizes everything implemented in the codebase to date.

---

## 1. Architecture Overview

Pastey employs a **multi-root React Native architecture** sharing a single JavaScript runtime bridge. This enables fast, isolated UI surfaces with shared global state (via Zustand) without duplicate bridge initialization overhead.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        macOS Native Layer (AppKit)                     │
│                                                                        │
│  ┌────────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │   Popover / Panel  │  │ Settings Window  │  │   Preview Panel    │  │
│  │    (NSPopover /    │  │   (NSWindow /    │  │    (NSPanel /      │  │
│  │   HistoryPanel)    │  │  SettingsWindow) │  │  utilityWindow)    │  │
│  └─────────▲──────────┘  └────────▲─────────┘  └─────────▲──────────┘  │
│            │                      │                      │             │
│            └──────────────────────┼──────────────────────┘             │
│                                   │                                    │
│                 Shared React Native RootFactory Bridge                 │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    JavaScript / React Native Layer                     │
│                                                                        │
│   Registered Roots:                                                    │
│   • "Pastey"         -> App.tsx (History Popover / Mouse Panel)       │
│   • "PasteySettings" -> SettingsApp.tsx (Preferences Window)           │
│   • "PasteyPreview"  -> PreviewApp.tsx (Auxiliary Preview Window)      │
│                                                                        │
│   State Management (Zustand):                                          │
│   • useHistoryStore  -> Clipboard items, search, selection, copy       │
│   • useSettingsStore -> Theme, shortcuts, limits, excluded apps        │
│   • usePreviewStore  -> Preview item state, hover timers, popup        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Implemented Features

### 2.1 Menu Bar & Accessory Lifecycle
* **Menu Bar Status Item (`AppDelegate.mm`)**:
  * Runs as an accessory application (`NSApplicationActivationPolicyAccessory`) without a Dock icon.
  * Status item with custom template icon (`StatusBarIcon` / `AppIcon` / SF Symbol fallback).
  * Left-click toggles the clipboard history popover; right-click displays a context menu (Toggle, Preferences, Quit).
  * Menu bar keyboard shortcut handler for `Cmd+,` (Preferences) and `Cmd+Q` (Quit).

### 2.2 Dual Presentation Modes: Menu Bar vs. Mouse Position
* **Menu Bar Popover Mode (`NSPopover`)**:
  * Anchored directly to the macOS status item button with native popover arrow and transition.
  * Fixed default size of 420 × 520.
* **Mouse Position Panel Mode (`HistoryPanel`)**:
  * Borderless, floating `NSPanel` with translucent vibrancy blur (`NSVisualEffectView` behind window).
  * Spawns centered near the mouse cursor while staying fully constrained within screen visible bounds.
  * **Interactive Window Resizing**:
    * Custom PanResponders for corner grip (`resize-grip`) and edge handles (right and bottom edges).
    * Smooth real-time resizing via `requestAnimationFrame` and `CATransaction` (clamped between 320×360 and 900×1200).
    * Dimensions persisted automatically to `UserDefaults` (`historyWidth`, `historyHeight`).
    * Disabled `@shopify/flash-list` layout animation lag during live resize.
* **Outside-Click Monitoring**:
  * Global and local `NSEvent` monitoring for mouse clicks outside the active popover or panel, dismissing the window cleanly and returning focus.

### 2.3 Clipboard Monitoring & Filtering
* **Background Poller (`ClipboardMonitor.swift`)**:
  * Polls `NSPasteboard.general` on a 0.4s interval using `changeCount`.
  * **Echo Suppression**: Ignores changes triggered by Pastey itself when copying an item back to the clipboard.
  * **Sensitive Content Filtering**: Ignores concealed, transient, or auto-generated pasteboard items (e.g., password managers like 1Password, Bitwarden, Apple Keychain).
  * **Excluded Applications**: Ignores copies originating from user-specified application bundle IDs (configured in Settings).
* **Multi-type Support**:
  * **Plain Text**: Computes SHA-256 hash for deduplication, generates 200-char preview, and stores full text.
  * **Images**: Saves PNG files to `~/Library/Application Support/Pastey/images/`, computes SHA-256 hash, stores file path and `[image]` preview indicator.
  * Synchronous/asynchronous garbage collection (`syncImages`) to delete orphaned image files from disk upon item pruning or deletion.

### 2.4 Embedded SQLite Storage
* **Native SQLite Module (`PasteySQLite.swift`)**:
  * Built directly against system `libsqlite3` on a dedicated serial dispatch queue (`com.pastey.sqlite`).
  * Configured with `PRAGMA journal_mode=WAL;` and `PRAGMA foreign_keys=ON;`.
  * Safe JSON string serialization for bridgeless/bridge compatibility in React Native macOS.
* **Database Schema (`src/db/schema.ts` & `src/db/queries.ts`)**:
  * `items` table: `id`, `hash UNIQUE`, `type`, `preview`, `file_path`, `created_at`, `pinned`.
  * `content` table: `item_id` (foreign key with `ON DELETE CASCADE`), `full_text`.
  * Indexes on `(pinned DESC, created_at DESC)`.
* **Automatic Retention & Expiration**:
  * `pruneOldItems()` runs on initialization.
  * Unpinned items exceeding `maxItems` or older than `maxAgeDays` (30 days default) are pruned.
  * Associated image files on disk are removed via `ClipboardMonitor.syncImages`.

### 2.5 History List & Keyboard Navigation
* **Fast List Rendering (`@shopify/flash-list`)**:
  * High-performance recycled item rendering.
  * Configurable preview line count (1, 2, or 3 lines).
  * Auto-scrolls selected item into view.
* **Full Keyboard Navigation**:
  * Global hotkey handler (`Carbon RegisterEventHotKey`) registered to toggle the window (default `⌘⇧V`).
  * Arrow Down (`↓`) / Arrow Up (`↑`): Move selection with debouncing.
  * Enter (`⏎`): Copy selected item and dismiss popover.
  * Escape (`⎋`): Close preview popup if open; otherwise dismiss the history popover.
* **Item Actions**:
  * Click to copy and close.
  * Long-press to delete item.
  * Pin/unpin toggle button (`★` / `☆`). Pinned items stay permanently at the top of the list and survive auto-expiration or clear history.
  * Preview button (`>`) to inspect full content in the auxiliary preview window.

### 2.6 Instant Search
* **Search Bar (`SearchBar.tsx`)**:
  * Embedded vector-styled search and settings icon buttons.
  * Debounced search queries (150ms delay).
  * SQLite `LIKE` matching on both item preview and full content with escape character handling.
  * Clear search button (`×`) to reset query.
  * Auto-focus input when the popover opens.

### 2.7 Auxiliary Quick Preview Window
* **Dedicated Preview Popup (`PreviewApp.tsx` & `ItemPreview.tsx`)**:
  * Utility floating window (`NSPanel`) displaying full content without cluttering the main history list.
  * Supports dual trigger modes:
    * Click on item `>` button.
    * Hover for 2 seconds on a history item.
  * Smart layout calculations:
    * Positions adjacent to the main history window (defaults to right side).
    * Flips to left side if screen space on the right is constrained.
    * Clamps within visible screen edges.
  * Displays item metadata: character count, line count, creation timestamp, or full image view.
  * Direct copy and pin toggling from the preview window.
  * Grace period hover timer: stays open when cursor moves between the history item and the preview window.

### 2.8 Preferences & Settings Window
* **Standalone Window (`SettingsWindowModule.swift` & `SettingsApp.tsx`)**:
  * Opened via `Cmd+,`, menu bar status item, or quick settings icon in the search bar.
  * Custom `NSWindow` supporting standard keyboard shortcuts (`Cmd+W` and `Esc` to close).
* **Configurable Settings**:
  * **Appearance**: System, Light, Dark segmented control.
  * **Preview Lines**: 1, 2, or 3 lines.
  * **Items Kept (`maxItems`)**: Number input clamped between 1 and 100,000.
  * **Launch at Login**:
    * Modern `SMAppService` on macOS 13+.
    * Legacy `LaunchAgents/<bundle-id>.plist` on older macOS versions.
  * **Global Shortcut**: Configurable presets (`⌘⇧V`, `⌘⌥V`, `⌃⌥V`, `⌥Space`).
  * **Show History At**: Menu bar vs. Mouse position.
  * **Window Size Reset**: Button to reset mouse-positioned window back to 420 × 520.
  * **Excluded Applications**: Add and remove app bundle IDs (e.g. `com.apple.keychainaccess`) to bypass clipboard capture.

### 2.9 Theming & Design System
* **Dynamic Appearance Syncing (`src/theme/`)**:
  * Native macOS Aqua / Dark Aqua appearance resolution.
  * Real-time listener for system theme changes via `AppleInterfaceThemeChangedNotification`.
  * Comprehensive light and dark palette tokens for surfaces, text, borders, accents, pinned items, and badges.

---

## 3. Project Structure

```
pastey/
├── docs/                         # Documentation
│   └── README.md                 # This implementation summary
├── macos/                        # macOS native host project
│   ├── Pastey-macOS/
│   │   ├── AppDelegate.mm        # App lifecycle, menu bar icon, status menu
│   │   ├── PopoverModule.swift   # NSPopover & mouse HistoryPanel, preview panel, resizing
│   │   ├── ClipboardMonitor.swift# Pasteboard polling, text/image ingestion, app exclusion
│   │   ├── PasteySQLite.swift    # Embedded SQLite3 driver with WAL and JSON output
│   │   ├── HotKeyModule.swift    # Carbon global hotkey registration
│   │   ├── SettingsModule.swift  # UserDefaults & SMAppService launch-at-login
│   │   └── SettingsWindowModule.swift # Preferences window management
├── src/                          # React Native TypeScript source
│   ├── App.tsx                   # Main clipboard history app (popover/panel)
│   ├── SettingsApp.tsx           # Preferences settings app
│   ├── PreviewApp.tsx            # Auxiliary preview popup app
│   ├── components/
│   │   ├── HistoryList.tsx       # FlashList virtualized history list
│   │   ├── HistoryItem.tsx       # Single clipboard item row with actions
│   │   ├── ItemPreview.tsx       # Full content/image preview component
│   │   └── SearchBar.tsx         # Search input with clear and settings buttons
│   ├── db/
│   │   ├── schema.ts             # SQLite schema creation and migrations
│   │   └── queries.ts            # Insert, query, search, pin, prune queries
│   ├── native/                   # Native module TypeScript wrappers
│   │   ├── ClipboardMonitor.ts
│   │   ├── HotkeyModule.ts
│   │   ├── PasteySQLite.ts
│   │   ├── PopoverModule.ts
│   │   ├── SettingsModule.ts
│   │   └── SettingsWindowModule.ts
│   ├── store/                    # Zustand stores
│   │   ├── historyStore.ts       # History state & clipboard actions
│   │   ├── previewStore.ts       # Auxiliary preview popup state
│   │   └── settingsStore.ts      # App settings state
│   └── theme/                    # Theme tokens and appearance hooks
│       ├── colors.ts
│       ├── useTheme.ts
│       └── index.ts
├── __tests__/                    # Jest unit & integration test suites
│   ├── App.test.tsx
│   ├── HistoryItem.test.tsx
│   ├── ItemPreview.test.tsx
│   └── settings.test.tsx
├── scripts/                      # Build & tooling scripts
│   ├── build-release.sh          # Release build automation
│   └── generate-icon.swift       # Vector app icon generator
└── package.json                  # Dependencies & scripts
```

---

## 4. Verification & Testing

The project includes unit and integration tests across components, state stores, and native module contracts:

* `__tests__/App.test.tsx`: Tests history initialization, keyboard navigation, popover layout, and resizing handles.
* `__tests__/HistoryItem.test.tsx`: Tests item rendering, action buttons, hover states, and preview triggers.
* `__tests__/ItemPreview.test.tsx`: Tests text/image preview display, line/character count formatting, and copy interactions.
* `__tests__/settings.test.tsx`: Tests settings persistence, theme switching, shortcut changes, and excluded apps list.

All test suites pass:
```bash
PASS __tests__/HistoryItem.test.tsx
PASS __tests__/ItemPreview.test.tsx
PASS __tests__/settings.test.tsx
PASS __tests__/App.test.tsx

Test Suites: 4 passed, 4 total
Tests:       39 passed, 39 total
```
