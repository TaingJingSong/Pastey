<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![macOS][platform-shield]][platform-url]
[![React Native macOS][rn-macos-shield]][rn-macos-url]
[![Swift][swift-shield]][swift-url]
[![SQLite][sqlite-shield]][sqlite-url]
[![Tests][tests-shield]][tests-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/your-username/pastey">
    <img src="assets/logo.png" alt="Pastey Logo" width="100" height="100">
  </a>

  <h1 align="center">Pastey</h1>

  <p align="center">
    A lightweight, blazing-fast native clipboard manager for macOS built with React Native macOS and Swift.
    <br />
    <a href="docs/README.md"><strong>Explore the documentation »</strong></a>
    <br />
    <br />
    <a href="CHANGELOG.md">View Changelog</a>
    ·
    <a href="https://github.com/your-username/pastey/issues/new?labels=bug&template=bug_report.md">Report Bug</a>
    ·
    <a href="https://github.com/your-username/pastey/issues/new?labels=enhancement&template=feature_request.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#key-features">Key Features</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#keyboard-shortcuts">Keyboard Shortcuts</a></li>
        <li><a href="#presentation-modes">Presentation Modes</a></li>
        <li><a href="#auxiliary-preview-window">Auxiliary Preview Window</a></li>
        <li><a href="#window-resizing">Window Resizing</a></li>
      </ul>
    </li>
    <li><a href="#data-storage--privacy">Data Storage & Privacy</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Most macOS clipboard managers are either bulky, electron-based memory hogs or closed-source paid utilities. **Pastey** combines the best of both worlds: the development agility and sleek declarative UI of **React Native macOS** paired with **pure native AppKit/Swift modules** for system integration, memory efficiency, and snappy performance.

Pastey runs quietly in the macOS menu bar as an accessory application (`NSApplicationActivationPolicyAccessory`) without cluttering your Dock. It tracks text and image clips, features instant debounced SQLite search, offers multi-line preview modes, supports live window resizing at your mouse cursor, and strictly respects privacy by skipping sensitive password manager pasteboards.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Key Features

* **⚡ Zero Dock Footprint**: Runs exclusively as a menu bar accessory app.
* **⌨️ Global Hotkey**: Summon your clipboard from anywhere via customizable shortcuts (<kbd>⌘⇧V</kbd>, <kbd>⌘⌥V</kbd>, <kbd>⌃⌥V</kbd>, <kbd>⌥Space</kbd>).
* **📍 Dual Positioning**: Choose between attaching to the **Menu Bar** or popping up right at your **Mouse Cursor**.
* **↔️ Live Window Resizing**: Resize the floating history panel dynamically by dragging corners or borders, with sizes persisted across restarts.
* **🔍 Instant Substring Search**: Real-time filtering through SQLite `LIKE` queries matching both preview lines and full contents.
* **🖼️ Rich Clips (Text & Images)**: Capture plain text clips and PNG image copies stored safely in Application Support.
* **👁️ Auxiliary Preview Panel**: View long texts or full-resolution images side-by-side on demand with smart edge collision handling.
* **📌 Pinning & Retention**: Keep important items pinned (`★`) at the top, immune to auto-expiration.
* **🔒 Privacy Guard**: Ignores concealed/transient pasteboards (1Password, Bitwarden, Keychain) and custom excluded application bundle IDs.
* **🌓 Native Appearance Sync**: System, Light, and Dark themes that sync seamlessly with native macOS `NSAppearance`.
* **🚀 Launch at Login**: Modern `SMAppService` (macOS 13+) with legacy `LaunchAgents` fallback.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![React Native macOS][rn-macos-badge]][rn-macos-url]
* [![Swift][swift-badge]][swift-url]
* [![TypeScript][typescript-badge]][typescript-url]
* [![SQLite][sqlite-badge]][sqlite-url]
* [![Zustand][zustand-badge]][zustand-url]
* [![CocoaPods][cocoapods-badge]][cocoapods-url]
* [![Jest][jest-badge]][jest-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To run or build Pastey locally, follow these steps.

### Prerequisites

Ensure you have the following installed on your Mac:
* **macOS** 11.0 (Big Sur) or later
* **Xcode** 14.0 or later (with Command Line Tools: `xcode-select --install`)
* **Node.js** 18+ & **npm**
* **CocoaPods**:
  ```sh
  brew install cocoapods
  # or
  sudo gem install cocoapods
  ```

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/pastey.git
   cd pastey
   ```

2. **Install JavaScript dependencies:**
   ```sh
   npm install
   ```

3. **Install macOS native CocoaPods:**
   ```sh
   npm run macos:pods
   ```

4. **Start Metro bundler (Terminal 1):**
   ```sh
   npm start
   ```

5. **Launch Pastey in Debug mode (Terminal 2):**
   ```sh
   npm run macos
   ```

6. **Run tests:**
   ```sh
   npm test
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | Toggle clipboard history (default global hotkey) |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Navigate items up and down |
| <kbd>Enter ⏎</kbd> | Copy selected item to clipboard and hide window |
| <kbd>Esc ⎋</kbd> | Close preview popup if open; otherwise dismiss Pastey |
| <kbd>⌘</kbd> + <kbd>,</kbd> | Open Preferences / Settings window |
| <kbd>⌘</kbd> + <kbd>W</kbd> / <kbd>Esc</kbd> | Close Preferences window |
| <kbd>⌘</kbd> + <kbd>Q</kbd> | Quit Pastey |

### Presentation Modes

* **Menu Bar Popover**: Anchored to the status icon in your menu bar. Click the menu icon or press the hotkey to view. Right-click the status icon for quick actions (Toggle, Preferences, Quit).
* **Mouse Cursor Panel**: Toggle Pastey right at your current cursor position on any display. Configure this under **Preferences > Show history at > Mouse position**.

### Auxiliary Preview Window

* Click the `>` arrow button on any item or hover over an item for **2 seconds** to pop out the auxiliary preview panel.
* Displays full content, character/line counts, created timestamp, or full-scale images.
* Automatically flips to the left side if the screen's right edge is reached.

### Window Resizing

When in mouse position mode, drag the resize grip at the bottom-right corner or drag the right/bottom edges to adjust the window dimensions (min 320×360, max 900×1200). Reset to default (420×520) anytime from Preferences.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- DATA STORAGE & PRIVACY -->
## Data Storage & Privacy

Pastey is built with privacy and offline reliability as core priorities:

* **Local Storage**: All clips and database records remain strictly on your Mac.
  * SQLite Database: `~/Library/Application Support/Pastey/pastey.db`
  * Images Directory: `~/Library/Application Support/Pastey/images/`
  * Settings: `NSUserDefaults` (`com.pastey.Pastey`)
* **Zero Telemetry**: No network requests, analytics, or background tracking.
* **Sensitive Types Suppressed**: Automatically excludes pasteboard types `org.nspasteboard.ConcealedType`, `TransientType`, and `AutoGeneratedType` (e.g., password managers).
* **App Exclusion**: Add sensitive app bundle IDs (e.g., `com.apple.keychainaccess`) in Preferences to prevent Pastey from capturing their copies.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] Multi-root React Native macOS architecture (`Pastey`, `PasteySettings`, `PasteyPreview`)
- [x] Global Carbon hotkey registration (<kbd>⌘⇧V</kbd>) with preset selector
- [x] Dual presentation mode (Menu bar popover vs. mouse floating panel)
- [x] Embedded SQLite3 driver with WAL mode and cascade deletes
- [x] PNG image capture and local Application Support file management
- [x] Dynamic window resizing with edge handles and dimension persistence
- [x] Auxiliary quick preview popup with auto-collision edge flipping
- [x] Excluded applications filter for sensitive bundle IDs
- [x] System / Light / Dark theme synchronization with `NSAppearance`
- [x] Launch at login via `SMAppService` and `LaunchAgents`
- [ ] Direct quick-copy keyboard shortcuts (<kbd>⌘1</kbd> – <kbd>⌘9</kbd>)
- [ ] Rich text / HTML clip preview formatting
- [ ] Export / Import clipboard backup

See the [open issues](https://github.com/your-username/pastey/issues) for proposed features and active discussions.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions make the open-source community an inspiring place to learn, collaborate, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion to improve Pastey:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Pastey Project - [https://github.com/your-username/pastey](https://github.com/your-username/pastey)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [React Native macOS](https://github.com/microsoft/react-native-macos)
* [Shopify FlashList](https://github.com/Shopify/flash-list)
* [Zustand](https://github.com/pmndrs/zustand)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Shields.io](https://shields.io)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[platform-shield]: https://img.shields.io/badge/platform-macOS%2011.0%2B-000000.svg?style=for-the-badge&logo=apple&logoColor=white
[platform-url]: https://apple.com/macos
[rn-macos-shield]: https://img.shields.io/badge/React%20Native%20macOS-0.76.3-20232A.svg?style=for-the-badge&logo=react&logoColor=61DAFB
[rn-macos-url]: https://github.com/microsoft/react-native-macos
[swift-shield]: https://img.shields.io/badge/Swift-5.9-FA7343.svg?style=for-the-badge&logo=swift&logoColor=white
[swift-url]: https://swift.org
[sqlite-shield]: https://img.shields.io/badge/SQLite-3-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white
[sqlite-url]: https://www.sqlite.org
[tests-shield]: https://img.shields.io/badge/Tests-39%20Passed-44CC11.svg?style=for-the-badge
[tests-url]: __tests__/
[license-shield]: https://img.shields.io/badge/License-MIT-F5A623.svg?style=for-the-badge
[license-url]: LICENSE

[rn-macos-badge]: https://img.shields.io/badge/React%20Native%20macOS-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[swift-badge]: https://img.shields.io/badge/Swift-FA7343?style=for-the-badge&logo=swift&logoColor=white
[typescript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[sqlite-badge]: https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white
[zustand-badge]: https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logoColor=white
[zustand-url]: https://github.com/pmndrs/zustand
[cocoapods-badge]: https://img.shields.io/badge/CocoaPods-EE3322?style=for-the-badge&logo=cocoapods&logoColor=white
[cocoapods-url]: https://cocoapods.org
[jest-badge]: https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white
[jest-url]: https://jestjs.io
