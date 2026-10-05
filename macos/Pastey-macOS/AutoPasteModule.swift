import AppKit
import Carbon.HIToolbox
import Foundation

@objc(AutoPasteModule)
class AutoPasteModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return true }

  @objc func isTrusted(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(AXIsProcessTrusted())
  }

  @objc func requestPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
    let options = [key: true] as CFDictionary
    resolve(AXIsProcessTrustedWithOptions(options))
  }

  @objc func paste(
    _ delayMs: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let delay = max(0, min(1000, delayMs.doubleValue)) / 1000.0

      // Give macOS time to re-activate the previously frontmost app
      // after NSApp.hide(nil) completes. Without this, the event can
      // land in the void.
      DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
        guard AXIsProcessTrusted() else {
          reject("permission", "Accessibility permission not granted", nil)
          return
        }

        // Virtual key code 9 = 'v' on US layout. Physical position, so
        // it works on most layouts too.
        let vKeyCode: CGKeyCode = 9

        guard let source = CGEventSource(stateID: .hidSystemState),
              let down = CGEvent(keyboardEventSource: source,
                                 virtualKey: vKeyCode, keyDown: true),
              let up = CGEvent(keyboardEventSource: source,
                               virtualKey: vKeyCode, keyDown: false) else {
          reject("event", "Could not create key events", nil)
          return
        }

        down.flags = .maskCommand
        up.flags = .maskCommand

        down.post(tap: .cghidEventTap)
        up.post(tap: .cghidEventTap)

        resolve(true)
      }
    }
  }
}