import AppKit
import Foundation

@objc(SettingsWindowModule)
class SettingsWindowModule: NSObject {

  private static let moduleName = "PasteySettings"
  private static let windowSize = NSSize(width: 480, height: 460)

  @objc static var shared: SettingsWindowModule?

  private var window: SettingsWindow?
  private var closeObserver: NSObjectProtocol?

  override init() {
    super.init()
    SettingsWindowModule.shared = self
  }

  @objc static func requiresMainQueueSetup() -> Bool { return true }

  /// Entry point for the Preferences… menu item.
  @objc static func openSettings() {
    DispatchQueue.main.async {
      let module = shared ?? SettingsWindowModule()
      shared = module
      module.present()
    }
  }

  @objc func open(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let window = self.window ?? self.makeWindow() else {
        reject("window", "Could not create the settings window", nil)
        return
      }
      self.window = window
      self.updateAppearance()

      NSApp.activate(ignoringOtherApps: true)
      window.makeKeyAndOrderFront(nil)
      resolve(true)
    }
  }

  private func present() {
    guard let window = self.window ?? self.makeWindow() else {
      NSLog("[Pastey] SettingsWindowModule.present: makeWindow failed")
      return
    }
    self.window = window
    self.updateAppearance()

    NSApp.activate(ignoringOtherApps: true)
    window.makeKeyAndOrderFront(nil)
  }

  @objc func updateAppearance(_ appearance: NSAppearance? = nil) {
    DispatchQueue.main.async {
      let resolvedAppearance: NSAppearance
      if let appearance = appearance {
        resolvedAppearance = appearance
      } else {
        let theme = UserDefaults.standard.string(forKey: "theme")
        resolvedAppearance = SettingsModule.resolveAppearance(for: theme)
      }
      self.window?.appearance = resolvedAppearance
    }
  }

  private func makeWindow() -> SettingsWindow? {
    guard let appDelegate = NSApp.delegate as? AppDelegate else { return nil }

    // A second root on the shared bridge: same JS runtime, so module-level
    // singletons (Zustand stores) are shared with the popover. Never reuse
    // moduleName "Pastey" here, or the history store's init() would run a
    // second time and register a duplicate clipboard monitor and hotkey.
    let content = appDelegate.rootView(
      forModuleName: SettingsWindowModule.moduleName,
      initialProps: [:]
    )
    guard let content = content else { return nil }

    content.frame = NSRect(origin: .zero, size: SettingsWindowModule.windowSize)
    content.autoresizingMask = [.width, .height]

    let window = SettingsWindow(
      contentRect: NSRect(origin: .zero, size: SettingsWindowModule.windowSize),
      styleMask: [.titled, .closable, .miniaturizable],
      backing: .buffered,
      defer: false
    )
    window.title = "Pastey Settings"
    window.contentView = content
    window.isReleasedWhenClosed = false
    window.center()

    // Accessory apps have no dock icon and no windows of their own; without
    // this, closing Settings leaves the app active with nothing on screen.
    closeObserver = NotificationCenter.default.addObserver(
      forName: NSWindow.willCloseNotification,
      object: window,
      queue: .main
    ) { _ in
      NSApp.hide(nil)
    }

    return window
  }

  deinit {
    if let closeObserver = closeObserver {
      NotificationCenter.default.removeObserver(closeObserver)
    }
  }
}

/// The app has no main Window menu, so Cmd+W never reaches a preferences
/// window, and Esc is not wired to close a plain NSWindow either.
class SettingsWindow: NSWindow {

  override func keyDown(with event: NSEvent) {
    if event.keyCode == 53 {
      self.close()
      return
    }
    super.keyDown(with: event)
  }

  override func performKeyEquivalent(with event: NSEvent) -> Bool {
    if event.modifierFlags.contains(.command), event.keyCode == 13 {
      self.close()
      return true
    }
    return super.performKeyEquivalent(with: event)
  }
}
