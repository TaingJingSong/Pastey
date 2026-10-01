import AppKit
import Foundation
import React

@objc(PopoverModule)
class PopoverModule: RCTEventEmitter {

  @objc static var shared: PopoverModule?
  private var popover: NSPopover?
  private var hostingController: NSViewController?
  private var popoverDelegate: PopoverDelegate?
  private var keyMonitor: Any?
  private var lastCloseTime: TimeInterval = 0
  private var hasListeners = false

  override init() {
    super.init()
    PopoverModule.shared = self
  }

  override func supportedEvents() -> [String]! {
    return ["onPopoverShow", "onPopoverHide", "onKey"]
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
      module.toggleInternal()
    }
  }

  @objc func toggleInternal() {
    guard let appDelegate = NSApp.delegate as? AppDelegate,
          let button = appDelegate.statusItemButton() else {
      NSLog("[Pastey] PopoverModule.toggleInternal: appDelegate or button unavailable")
      return
    }

    self.ensurePopover()
    guard let popover = self.popover else {
      NSLog("[Pastey] PopoverModule.toggleInternal: popover could not be created")
      return
    }

    let now = ProcessInfo.processInfo.systemUptime
    if now - self.lastCloseTime < 0.2 {
      return
    }

    if popover.isShown {
      popover.performClose(nil)
      NSApp.hide(nil)
      return
    }

    popover.show(
      relativeTo: button.bounds,
      of: button,
      preferredEdge: .minY
    )
    NSApp.activate(ignoringOtherApps: true)
    if let window = popover.contentViewController?.view.window {
      window.makeKey()
    }
    self.emitEvent(name: "onPopoverShow", body: nil)
  }

  @objc func show(
    _ sourceViewTag: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let appDelegate = NSApp.delegate as? AppDelegate,
            let button = appDelegate.statusItemButton() else {
        reject("no_button", "Status item button not available", nil)
        return
      }

      self.ensurePopover()
      guard let popover = self.popover else {
        reject("no_popover", "Popover creation failed", nil)
        return
      }

      if popover.isShown {
        popover.performClose(nil)
        NSApp.hide(nil)
        resolve(true)
        return
      }

      popover.show(
        relativeTo: button.bounds,
        of: button,
        preferredEdge: .minY
      )
      NSApp.activate(ignoringOtherApps: true)
      if let window = popover.contentViewController?.view.window {
        window.makeKey()
      }
      self.emitEvent(name: "onPopoverShow", body: nil)
      resolve(true)
    }
  }

  @objc func hide(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.popover?.performClose(nil)
      NSApp.hide(nil)
      resolve(true)
    }
  }

  @objc func toggle(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.toggleInternal()
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
        guard let self = self, let pop = self.popover, pop.isShown else {
          return event
        }
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

    guard let appDelegate = NSApp.delegate as? AppDelegate,
          let rootView = appDelegate.pasteyRootView() else {
      return
    }

    let pop = NSPopover()
    pop.behavior = .transient        // dismisses on click-outside
    pop.animates = true
    pop.contentSize = NSSize(width: 420, height: 520)

    let delegate = PopoverDelegate()
    delegate.onClose = { [weak self] in
      self?.lastCloseTime = ProcessInfo.processInfo.systemUptime
      self?.emitEvent(name: "onPopoverHide", body: nil)
    }
    pop.delegate = delegate
    self.popoverDelegate = delegate

    let controller = NSViewController()
    rootView.wantsLayer = true
    rootView.layer?.backgroundColor = NSColor.clear.cgColor
    rootView.frame = NSRect(x: 0, y: 0, width: 420, height: 520)
    rootView.autoresizingMask = [.width, .height]
    controller.view = rootView

    pop.contentViewController = controller
    self.hostingController = controller
    self.popover = pop
  }

  deinit {
    if let monitor = keyMonitor {
      NSEvent.removeMonitor(monitor)
    }
  }
}

class PopoverDelegate: NSObject, NSPopoverDelegate {
  var onClose: (() -> Void)?

  func popoverDidClose(_ notification: Notification) {
    NSApp.hide(nil)
    onClose?()
  }
}