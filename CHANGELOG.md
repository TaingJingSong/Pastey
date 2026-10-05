# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Nothing yet.

---

## [1.1.0] - 2026-10-05

### Added

- **Settings redesign** — sidebar navigation with six sections (General, Appearance, History, Shortcuts, Privacy, About), replacing the single-page scroll layout.
- **SF Symbols support** — native Swift component rendering Apple's system iconography throughout the UI, replacing Unicode glyphs in the history list, preview header, search bar, and settings sidebar.
- **Quick-paste shortcuts** — <kbd>⌘</kbd> <kbd>1</kbd> through <kbd>⌘</kbd> <kbd>9</kbd> copy the first nine visible items without a mouse. A `⌘1`–`⌘9` badge appears on the left of the first nine rows for discoverability.
- **Auto-paste** — optionally synthesize <kbd>⌘</kbd> <kbd>V</kbd> into the frontmost app after copying, eliminating the manual paste step. Requires macOS Accessibility permission; configurable delay. Falls back to copy-only silently when permission is denied.
- **Image format expansion** — capture and restore JPEG, HEIC, GIF, WebP, and TIFF in addition to PNG, preserving the original format on round-trip.
- **Color swatch preview** — hex (`#RGB`, `#RRGGBB`, with alpha), `rgb()` / `rgba()`, and `hsl()` / `hsla()` clips render a small color chip in the history list. The parser is strict: CSS snippets like `color: #fff;` do not match.
- **Auto-expire setting** — configurable maximum age (`maxAgeDays`) for unpinned items, applied at launch. Complements the existing `maxItems` cap.
- **Image capture controls** — toggle image capture on/off, and set a maximum file size in MB.
- **Clear history** action available directly from the History settings section.
- **Reset all settings** action in the About section, including re-registration of the default hotkey.
- **Menu bar Quit** — right-click the status icon for a Show / Preferences / Quit context menu.

### Changed

- **Preview panel** now uses native `NSVisualEffectView` vibrancy, content-aware dynamic height, and a 120ms fade-in, matching the visual language of the history panel.
- **History panel** materials, corner radius, separators, and icon set refined for a more native macOS look.
- **Settings window** resized to 720×520 (min 640×460) and made resizable.
- **Shortcut persistence** writes are now batched with `Promise.all` instead of serialized.
- **Release pipeline** (`scripts/release.sh`) now handles version bump, production bundling, Release build, DMG packaging, git commit, tag, push, and GitHub release in one command, with `--dry-run`, `--no-push`, and `--skip-build` flags.

### Fixed

- **Image durability** — images are stored in `~/Library/Application Support/Pastey/images/` instead of `NSTemporaryDirectory()`, which macOS may purge under memory pressure.
- **Orphaned image cleanup** — `syncImages` sweeps the image directory on prune regardless of image format, self-healing orphans created by `deleteClip` or `clearAll`.
- **Echo suppression** — the last change count is set after a self-initiated pasteboard write, preventing re-insertion of items the user just pasted.
- **SQLite module stability** — `RCTPromiseResolveBlock` signatures, `withCString` for all text binding, and JSON-string payloads to work around a bridgeless-mode serialization bug in the macOS fork.

### Removed

- Dead `macos/Pastey-macOS/NativeModules/` directory that duplicated the real Swift files and risked being edited by mistake.

### Security

- **Auto-paste permission model** — the Accessibility permission is only requested when the user enables auto-paste. No automatic permission prompts at launch.

---

## [1.0.0] - 2026-10-02

### Added

- **Core app and lifecycle** — native macOS menu bar accessory app (`NSApplicationActivationPolicyAccessory`) running without a Dock icon. Status item with template icon, left-click toggle, right-click context menu.
- **Multi-root React Native architecture** — `Pastey` (history), `PasteySettings` (preferences), `PasteyPreview` (preview panel), sharing a single JS bridge and Zustand stores.
- **Global hotkey** — Carbon `RegisterEventHotKey` bound to <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>V</kbd> by default. Four presets available in Preferences.
- **Dual presentation modes** — menu bar popover (`NSPopover`) anchored to the status icon, or a mouse-positioned floating panel (`HistoryPanel`) at the cursor.
- **Interactive window resizing** — corner grip and edge drag handles, dimensions persisted in `UserDefaults`.
- **Clipboard monitoring** — 400ms pasteboard polling with change count tracking and echo suppression.
- **Text and PNG image capture** — images stored in `~/Library/Application Support/Pastey/images/`.
- **Embedded SQLite** — native driver with WAL mode and foreign key cascade deletes. Auto-pruning of unpinned items by capacity (`maxItems`) and age (`maxAgeDays`).
- **History list** — virtualized rendering with `@shopify/flash-list`, configurable preview lines, keyboard navigation (<kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>Enter</kbd> / <kbd>Esc</kbd>), pin / delete / click-to-copy.
- **Instant search** — 150ms debounced queries against preview and full text via SQLite `LIKE`.
- **Preview panel** — full text or full image with edge-collision positioning.
- **Preferences window** — <kbd>⌘</kbd> <kbd>,</kbd>, theme selection (System / Light / Dark), launch at login, max items, excluded applications, window size reset.
- **Testing** — 52 Jest unit and integration tests.

### Security

- Automatic suppression of sensitive pasteboards (`org.nspasteboard.ConcealedType`, `TransientType`, `AutoGeneratedType`).
- Excluded applications filter for password managers.
- Fully local SQLite storage; no network requests, telemetry, or analytics.

[Unreleased]: https://github.com/TaingJingSong/pastey/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/TaingJingSong/pastey/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/TaingJingSong/pastey/releases/tag/v1.0.0