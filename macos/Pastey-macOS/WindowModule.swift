import AppKit
import Foundation

@objc(WindowModule)
class WindowModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return true }

  @objc func hide(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      NSApp.hide(nil)
      resolve(true)
    }
  }

  @objc func show(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      NSApp.unhide(nil)
      NSApp.activate(ignoringOtherApps: true)
      if let window = NSApp.windows.first(where: { $0.isVisible || $0.canBecomeKey }) {
        window.makeKeyAndOrderFront(nil)
      }
      resolve(true)
    }
  }

  @objc func toggle(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      if NSApp.isActive {
        NSApp.hide(nil)
        resolve(false)
      } else {
        NSApp.unhide(nil)
        NSApp.activate(ignoringOtherApps: true)
        if let window = NSApp.windows.first(where: { $0.isVisible || $0.canBecomeKey }) {
          window.makeKeyAndOrderFront(nil)
        }
        resolve(true)
      }
    }
  }
}