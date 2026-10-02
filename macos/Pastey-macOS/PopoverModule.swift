import AppKit
import Foundation
import React

class HistoryPanel: NSPanel {
  override var canBecomeKey: Bool { return true }
  override var canBecomeMain: Bool { return true }

  var customInLiveResize: Bool = false
  override var inLiveResize: Bool {
    return customInLiveResize || super.inLiveResize
  }
}

@objc(PopoverModule)
class PopoverModule: RCTEventEmitter {

  @objc static var shared: PopoverModule?
  private var popover: NSPopover?
  private var popoverContainer: NSView?
  private var hostingController: NSViewController?
  private var popoverDelegate: PopoverDelegate?
  private var keyMonitor: Any?
  private var lastCloseTime: TimeInterval = 0
  private var hasListeners = false
  private var previewPanel: NSPanel?
  private var mousePanel: HistoryPanel?
  private var mouseVisualEffect: NSVisualEffectView?
  private var windowResizeObserver: NSObjectProtocol?
  private var outsideClickGlobalMonitor: Any?
  private var outsideClickLocalMonitor: Any?

  override init() {
    super.init()
    PopoverModule.shared = self

    DistributedNotificationCenter.default().addObserver(
      self,
      selector: #selector(systemThemeDidChange),
      name: NSNotification.Name("AppleInterfaceThemeChangedNotification"),
      object: nil
    )

    DispatchQueue.main.async { [weak self] in
      self?.ensurePopover()
    }
  }

  override func supportedEvents() -> [String]! {
    return ["onPopoverShow", "onPopoverHide", "onKey", "onSystemThemeChanged"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  private func emitEvent(name: String, body: Any?) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    }
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc static func togglePopover() {
    DispatchQueue.main.async {
      let module = shared ?? PopoverModule()
      shared = module
      module.toggleInternal(position: "menubar")
    }
  }

  @objc var isPopoverShown: Bool {
    return (popover?.isShown ?? false) || (mousePanel?.isVisible ?? false)
  }

  func closeMousePanel() {
    if let panel = self.mousePanel, panel.isVisible {
      panel.orderOut(nil)
      self.dismissPreview()
      self.stopOutsideClickMonitoring()
      self.lastCloseTime = ProcessInfo.processInfo.systemUptime
      self.emitEvent(name: "onPopoverHide", body: nil)
    }
  }

  private func ensureMousePanel() {
    if mousePanel != nil { return }

    let savedWidth = UserDefaults.standard.double(forKey: "historyWidth")
    let savedHeight = UserDefaults.standard.double(forKey: "historyHeight")
    let initialWidth: CGFloat = savedWidth >= 320 ? CGFloat(savedWidth) : 420
    let initialHeight: CGFloat = savedHeight >= 360 ? CGFloat(savedHeight) : 520
    let initialSize = NSSize(width: initialWidth, height: initialHeight)

    let panel = HistoryPanel(
      contentRect: NSRect(origin: .zero, size: initialSize),
      styleMask: [.borderless, .resizable],
      backing: .buffered,
      defer: false
    )
    panel.isFloatingPanel = true
    panel.level = .floating
    panel.isOpaque = false
    panel.backgroundColor = .clear
    panel.hasShadow = true
    panel.minSize = NSSize(width: 320, height: 360)
    panel.maxSize = NSSize(width: 900, height: 1200)

    let effect = NSVisualEffectView(frame: NSRect(origin: .zero, size: initialSize))
    effect.material = .popover
    effect.blendingMode = .behindWindow
    effect.state = .active
    effect.autoresizingMask = [.width, .height]
    effect.wantsLayer = true
    effect.layer?.cornerRadius = 10
    effect.layer?.masksToBounds = true

    panel.contentView = effect
    self.mouseVisualEffect = effect
    self.mousePanel = panel

    NotificationCenter.default.addObserver(
      forName: NSWindow.didResizeNotification,
      object: panel,
      queue: .main
    ) { notification in
      guard let win = notification.object as? NSWindow else { return }
      let contentSize = win.frame.size
      let clampedW = max(320, min(900, contentSize.width))
      let clampedH = max(360, min(1200, contentSize.height))
      UserDefaults.standard.set(Double(clampedW), forKey: "historyWidth")
      UserDefaults.standard.set(Double(clampedH), forKey: "historyHeight")
    }
  }

  @objc func toggleInternal(position: String = "menubar") {
    guard let appDelegate = NSApp.delegate as? AppDelegate,
          let rootView = appDelegate.pasteyRootView() else {
      NSLog("[Pastey] PopoverModule.toggleInternal: appDelegate or rootView unavailable")
      return
    }

    let now = ProcessInfo.processInfo.systemUptime
    if now - self.lastCloseTime < 0.2 {
      return
    }

    if position == "mouse" {
      if self.popover?.isShown == true {
        self.stopOutsideClickMonitoring()
        self.popover?.performClose(nil)
      }

      self.ensureMousePanel()
      guard let panel = self.mousePanel,
            let effect = self.mouseVisualEffect else { return }

      if panel.isVisible {
        self.closeMousePanel()
        if SettingsWindowModule.shared?.isWindowVisible != true {
          NSApp.hide(nil)
        }
        return
      }

      let savedWidth = UserDefaults.standard.double(forKey: "historyWidth")
      let savedHeight = UserDefaults.standard.double(forKey: "historyHeight")
      let initialWidth: CGFloat = savedWidth >= 320 ? CGFloat(savedWidth) : 420
      let initialHeight: CGFloat = savedHeight >= 360 ? CGFloat(savedHeight) : 520
      let currentSize = NSSize(width: initialWidth, height: initialHeight)

      rootView.removeFromSuperview()
      rootView.wantsLayer = true
      rootView.layer?.backgroundColor = NSColor.clear.cgColor
      rootView.frame = NSRect(origin: .zero, size: currentSize)
      rootView.autoresizingMask = [.width, .height]
      for subview in rootView.subviews {
        subview.frame = NSRect(origin: .zero, size: currentSize)
        subview.needsLayout = true
      }
      if !effect.subviews.contains(rootView) {
        effect.addSubview(rootView)
      }
      rootView.needsLayout = true
      rootView.layoutSubtreeIfNeeded()

      let mouseLoc = NSEvent.mouseLocation
      let screen = NSScreen.screens.first(where: { NSPointInRect(mouseLoc, $0.frame) }) ?? NSScreen.main ?? NSScreen.screens[0]
      let visFrame = screen.visibleFrame

      var x = mouseLoc.x - (currentSize.width / 2)
      var y = mouseLoc.y - currentSize.height + 20

      x = max(visFrame.minX + 8, min(x, visFrame.maxX - currentSize.width - 8))
      y = max(visFrame.minY + 8, min(y, visFrame.maxY - currentSize.height - 8))

      panel.setFrame(NSRect(origin: NSPoint(x: x, y: y), size: currentSize), display: true)

      let theme = UserDefaults.standard.string(forKey: "theme")
      let appearance = SettingsModule.resolveAppearance(for: theme)
      panel.appearance = appearance
      effect.appearance = appearance

      NSApp.activate(ignoringOtherApps: true)
      panel.makeKeyAndOrderFront(nil)

      rootView.frame = NSRect(origin: .zero, size: currentSize)
      for subview in rootView.subviews {
        subview.frame = NSRect(origin: .zero, size: currentSize)
        subview.needsLayout = true
      }
      rootView.needsLayout = true
      rootView.layoutSubtreeIfNeeded()

      self.startOutsideClickMonitoring()
      self.emitEvent(name: "onPopoverShow", body: ["position": "mouse"])
      return
    }

    // position == "menubar"
    if self.mousePanel?.isVisible == true {
      self.closeMousePanel()
    }

    self.ensurePopover()
    guard let popover = self.popover else {
      NSLog("[Pastey] PopoverModule.toggleInternal: popover could not be created")
      return
    }

    if popover.isShown {
      self.stopOutsideClickMonitoring()
      popover.performClose(nil)
      if SettingsWindowModule.shared?.isWindowVisible != true {
        NSApp.hide(nil)
      }
      return
    }

    let menubarSize = NSSize(width: 420, height: 520)
    popover.contentSize = menubarSize
    self.hostingController?.preferredContentSize = menubarSize

    rootView.removeFromSuperview()
    rootView.wantsLayer = true
    rootView.layer?.backgroundColor = NSColor.clear.cgColor
    rootView.frame = NSRect(origin: .zero, size: menubarSize)
    rootView.autoresizingMask = [.width, .height]
    for subview in rootView.subviews {
      subview.frame = NSRect(origin: .zero, size: menubarSize)
      subview.needsLayout = true
    }
    if let container = self.popoverContainer {
      if !container.subviews.contains(rootView) {
        container.addSubview(rootView)
      }
    }
    rootView.needsLayout = true
    rootView.layoutSubtreeIfNeeded()

    guard let button = appDelegate.statusItemButton() else {
      NSLog("[Pastey] PopoverModule.toggleInternal: statusItemButton unavailable")
      return
    }

    self.updateAppearance()
    popover.show(
      relativeTo: button.bounds,
      of: button,
      preferredEdge: .minY
    )

    NSApp.activate(ignoringOtherApps: true)
    if let window = popover.contentViewController?.view.window {
      window.makeKey()
      window.styleMask.remove(.resizable)
      window.showsResizeIndicator = false
    }

    rootView.frame = NSRect(origin: .zero, size: menubarSize)
    for subview in rootView.subviews {
      subview.frame = NSRect(origin: .zero, size: menubarSize)
      subview.needsLayout = true
    }
    rootView.needsLayout = true
    rootView.layoutSubtreeIfNeeded()

    self.startOutsideClickMonitoring()
    self.emitEvent(name: "onPopoverShow", body: ["position": "menubar"])
  }

  @objc func show(
    _ sourceViewTag: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.toggleInternal(position: "menubar")
      resolve(true)
    }
  }

  @objc func hide(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.stopOutsideClickMonitoring()
      self.popover?.performClose(nil)
      self.closeMousePanel()
      if SettingsWindowModule.shared?.isWindowVisible != true {
        NSApp.hide(nil)
      }
      resolve(true)
    }
  }

  @objc func toggle(
    _ position: NSString?,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let mode = (position as String?) ?? UserDefaults.standard.string(forKey: "historyPosition") ?? "menubar"
      self.toggleInternal(position: mode)
      resolve(true)
    }
  }

  @objc func attachKeyMonitor() {
    DispatchQueue.main.async {
      if let existing = self.keyMonitor {
        NSEvent.removeMonitor(existing)
        self.keyMonitor = nil
      }

      self.keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
        guard let self = self else { return event }
        let isVisible = (self.popover?.isShown == true) || (self.mousePanel?.isVisible == true)
        guard isVisible else { return event }

        switch Int(event.keyCode) {
        case 125:
          self.emitEvent(name: "onKey", body: ["key": "down"])
          return nil
        case 126:
          self.emitEvent(name: "onKey", body: ["key": "up"])
          return nil
        case 36, 76:
          self.emitEvent(name: "onKey", body: ["key": "enter"])
          return nil
        case 53:
          self.emitEvent(name: "onKey", body: ["key": "escape"])
          return nil
        default:
          return event
        }
      }
    }
  }

  private func ensurePopover() {
    if popover != nil { return }

    let defaultSize = NSSize(width: 420, height: 520)

    let pop = NSPopover()
    pop.behavior = .transient
    pop.animates = true
    pop.contentSize = defaultSize

    let delegate = PopoverDelegate()
    delegate.onClose = { [weak self] in
      self?.lastCloseTime = ProcessInfo.processInfo.systemUptime
      self?.emitEvent(name: "onPopoverHide", body: nil)
    }
    pop.delegate = delegate
    self.popoverDelegate = delegate

    let container = NSView(frame: NSRect(origin: .zero, size: defaultSize))
    container.wantsLayer = true
    container.autoresizingMask = [.width, .height]

    let controller = NSViewController()
    controller.view = container

    pop.contentViewController = controller
    self.hostingController = controller
    self.popoverContainer = container
    self.popover = pop
    self.updateAppearance()
  }

  func hideMousePositioningWindow() {
    closeMousePanel()
  }

  @objc func setContentSize(
    _ width: NSNumber,
    height: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      // Resizing is ONLY supported for mousePanel
      guard let panel = self.mousePanel, panel.isVisible else {
        resolve(false)
        return
      }

      let clampedWidth = max(320, min(900, width.doubleValue))
      let clampedHeight = max(360, min(1200, height.doubleValue))
      let size = NSSize(width: clampedWidth, height: clampedHeight)

      UserDefaults.standard.set(clampedWidth, forKey: "historyWidth")
      UserDefaults.standard.set(clampedHeight, forKey: "historyHeight")

      let topY = panel.frame.maxY
      let newOriginY = topY - clampedHeight
      let newFrame = NSRect(x: panel.frame.origin.x, y: newOriginY, width: clampedWidth, height: clampedHeight)

      CATransaction.begin()
      CATransaction.setDisableActions(true)
      panel.customInLiveResize = true

      panel.setFrame(newFrame, display: true, animate: false)
      if let effect = self.mouseVisualEffect {
        effect.frame = NSRect(origin: .zero, size: size)
      }
      if let appDelegate = NSApp.delegate as? AppDelegate,
         let rootView = appDelegate.pasteyRootView() {
        rootView.frame = NSRect(origin: .zero, size: size)
        for subview in rootView.subviews {
          subview.frame = NSRect(origin: .zero, size: size)
          subview.needsLayout = true
        }
        rootView.needsLayout = true
        rootView.layoutSubtreeIfNeeded()
      }

      panel.customInLiveResize = false
      CATransaction.commit()

      resolve(true)
    }
  }

  func startOutsideClickMonitoring() {
    stopOutsideClickMonitoring()

    outsideClickGlobalMonitor = NSEvent.addGlobalMonitorForEvents(
      matching: [.leftMouseDown, .rightMouseDown]
    ) { [weak self] _ in
      guard let self = self else { return }
      DispatchQueue.main.async {
        self.handleOutsideClick(at: NSEvent.mouseLocation)
      }
    }

    outsideClickLocalMonitor = NSEvent.addLocalMonitorForEvents(
      matching: [.leftMouseDown, .rightMouseDown]
    ) { [weak self] event in
      guard let self = self else { return event }

      let clickLoc = NSEvent.mouseLocation

      if let panel = self.mousePanel, panel.isVisible {
        if panel.frame.contains(clickLoc) {
          return event
        }
      }

      if let pop = self.popover, pop.isShown,
         let window = pop.contentViewController?.view.window {
        if window.frame.contains(clickLoc) {
          return event
        }
      }

      if let panel = self.previewPanel, panel.isVisible, panel.frame.contains(clickLoc) {
        return event
      }

      if let settingsWin = SettingsWindowModule.shared?.window,
         settingsWin.isVisible, settingsWin.frame.contains(clickLoc) {
        self.closeMousePanel()
        self.popover?.performClose(nil)
        self.stopOutsideClickMonitoring()
        return event
      }

      if let appDelegate = NSApp.delegate as? AppDelegate,
         let button = appDelegate.statusItemButton(),
         let btnWindow = button.window {
        let btnFrameOnScreen = btnWindow.convertToScreen(button.bounds)
        if btnFrameOnScreen.contains(clickLoc) {
          return event
        }
      }

      self.closeMousePanel()
      self.popover?.performClose(nil)
      self.stopOutsideClickMonitoring()
      return event
    }
  }

  func stopOutsideClickMonitoring() {
    if let monitor = outsideClickGlobalMonitor {
      NSEvent.removeMonitor(monitor)
      outsideClickGlobalMonitor = nil
    }
    if let monitor = outsideClickLocalMonitor {
      NSEvent.removeMonitor(monitor)
      outsideClickLocalMonitor = nil
    }
  }

  private func handleOutsideClick(at screenPoint: NSPoint) {
    var anyClosed = false

    if let panel = self.mousePanel, panel.isVisible {
      if panel.frame.contains(screenPoint) {
        return
      }
      self.closeMousePanel()
      anyClosed = true
    }

    if let pop = self.popover, pop.isShown {
      if let window = pop.contentViewController?.view.window, window.frame.contains(screenPoint) {
        return
      }
      self.popover?.performClose(nil)
      anyClosed = true
    }

    if let panel = self.previewPanel, panel.isVisible, panel.frame.contains(screenPoint) {
      return
    }

    if let settingsWin = SettingsWindowModule.shared?.window,
       settingsWin.isVisible, settingsWin.frame.contains(screenPoint) {
      return
    }

    if anyClosed {
      self.stopOutsideClickMonitoring()
      if SettingsWindowModule.shared?.isWindowVisible != true {
        NSApp.hide(nil)
      }
    }
  }

  @objc func showPreview(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let parentWindow: NSWindow? = (self.popover?.isShown == true ? self.popover?.contentViewController?.view.window : nil) ?? (self.mousePanel?.isVisible == true ? self.mousePanel : nil)
      guard let window = parentWindow else {
        resolve(false)
        return
      }

      let panel = self.previewPanel ?? self.makePreviewPanel()
      guard let panel = panel else {
        resolve(false)
        return
      }
      self.previewPanel = panel

      let theme = UserDefaults.standard.string(forKey: "theme")
      panel.appearance = SettingsModule.resolveAppearance(for: theme)

      let popFrame = window.frame
      let screen = window.screen ?? NSScreen.main ?? NSScreen.screens[0]
      let visibleFrame = screen.visibleFrame
      let previewWidth: CGFloat = 380
      let previewHeight: CGFloat = min(520, popFrame.height)
      let spacing: CGFloat = 8

      // Default to right side of the popover
      var targetX = popFrame.maxX + spacing
      var targetY = popFrame.maxY - previewHeight

      // If overflowing right side, flip to left side
      if targetX + previewWidth > visibleFrame.maxX {
        targetX = popFrame.minX - previewWidth - spacing
      }
      if targetX < visibleFrame.minX {
        targetX = visibleFrame.minX
      }
      if targetY < visibleFrame.minY {
        targetY = visibleFrame.minY
      }
      if targetY + previewHeight > visibleFrame.maxY {
        targetY = visibleFrame.maxY - previewHeight
      }

      panel.setFrame(NSRect(x: targetX, y: targetY, width: previewWidth, height: previewHeight), display: true)

      if panel.parent == nil {
        window.addChildWindow(panel, ordered: .above)
      }
      panel.orderFront(nil)
      resolve(true)
    }
  }

  @objc func hidePreview(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.dismissPreview()
      resolve(true)
    }
  }

  func dismissPreview() {
    guard let panel = self.previewPanel else { return }
    if let parent = panel.parent {
      parent.removeChildWindow(panel)
    }
    panel.orderOut(self)
  }

  private func makePreviewPanel() -> NSPanel? {
    guard let appDelegate = NSApp.delegate as? AppDelegate else { return nil }

    let content = appDelegate.rootView(
      forModuleName: "PasteyPreview",
      initialProps: [:]
    )
    guard let content = content else { return nil }

    let size = NSSize(width: 380, height: 520)
    content.frame = NSRect(origin: .zero, size: size)
    content.autoresizingMask = [.width, .height]

    let panel = NSPanel(
      contentRect: NSRect(origin: .zero, size: size),
      styleMask: [.titled, .closable, .utilityWindow, .nonactivatingPanel, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    panel.title = "Preview"
    panel.titleVisibility = .hidden
    panel.titlebarAppearsTransparent = true
    panel.isFloatingPanel = true
    panel.becomesKeyOnlyIfNeeded = true
    panel.level = .floating
    panel.contentView = content
    panel.isReleasedWhenClosed = false
    panel.hasShadow = true

    return panel
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
      self.popover?.appearance = resolvedAppearance
      self.previewPanel?.appearance = resolvedAppearance
      self.mousePanel?.appearance = resolvedAppearance
      self.mouseVisualEffect?.appearance = resolvedAppearance
      if let window = self.popover?.contentViewController?.view.window {
        window.appearance = resolvedAppearance
      }
    }
  }

  @objc private func systemThemeDidChange() {
    DispatchQueue.main.async {
      let savedTheme = UserDefaults.standard.string(forKey: "theme")
      if savedTheme == nil || savedTheme == "system" {
        let appearance = SettingsModule.resolveAppearance(for: "system")
        NSApp.appearance = appearance
        self.updateAppearance(appearance)
        SettingsWindowModule.shared?.updateAppearance(appearance)
      }
      let current = SettingsModule.currentSystemTheme()
      self.emitEvent(name: "onSystemThemeChanged", body: ["systemTheme": current])
    }
  }

  deinit {
    stopOutsideClickMonitoring()
    if let observer = windowResizeObserver {
      NotificationCenter.default.removeObserver(observer)
    }
    if let monitor = keyMonitor {
      NSEvent.removeMonitor(monitor)
    }
    DistributedNotificationCenter.default().removeObserver(self)
  }
}

class PopoverDelegate: NSObject, NSPopoverDelegate {
  var onClose: (() -> Void)?

  func popoverDidClose(_ notification: Notification) {
    PopoverModule.shared?.stopOutsideClickMonitoring()
    PopoverModule.shared?.dismissPreview()
    PopoverModule.shared?.hideMousePositioningWindow()
    if SettingsWindowModule.shared?.isWindowVisible != true {
      NSApp.hide(nil)
    }
    onClose?()
  }
}