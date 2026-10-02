import AppKit
import Carbon.HIToolbox
import Foundation

private let PASTEY_SIGNATURE: OSType = 0x50535459 // 'PSTY'

@objc(HotkeyModule)
class HotkeyModule: RCTEventEmitter {

  private static var hotKeyRef: EventHotKeyRef?
  private static var eventHandler: EventHandlerRef?
  private static weak var shared: HotkeyModule?

  override init() {
    super.init()
    HotkeyModule.shared = self
  }

  override func supportedEvents() -> [String]! {
    return ["onHotkey"]
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc override func invalidate() {
    DispatchQueue.main.async {
      HotkeyModule.unregisterInternal()
    }
    super.invalidate()
  }

  deinit {
    HotkeyModule.unregisterInternal()
  }

  @objc func register(
    _ keyCode: NSNumber,
    modifiers: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      HotkeyModule.shared = self
      HotkeyModule.unregisterInternal()

      var hotKeyID = EventHotKeyID()
      hotKeyID.signature = PASTEY_SIGNATURE
      hotKeyID.id = 1

      var ref: EventHotKeyRef?
      let status = RegisterEventHotKey(
        UInt32(keyCode.uint32Value),
        UInt32(modifiers.uint32Value),
        hotKeyID,
        GetApplicationEventTarget(),
        0,
        &ref
      )

      guard status == noErr, let hotKey = ref else {
        reject("register", "RegisterEventHotKey failed: \(status)", nil)
        return
      }

      HotkeyModule.hotKeyRef = hotKey
      HotkeyModule.installHandlerIfNeeded()
      resolve(true)
    }
  }

  @objc func unregister(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      HotkeyModule.unregisterInternal()
      resolve(true)
    }
  }

  private static func unregisterInternal() {
    if let ref = hotKeyRef {
      UnregisterEventHotKey(ref)
      hotKeyRef = nil
    }
    if let handler = eventHandler {
      RemoveEventHandler(handler)
      eventHandler = nil
    }
  }

  private static func installHandlerIfNeeded() {
    guard eventHandler == nil else { return }

    var spec = EventTypeSpec(
      eventClass: OSType(kEventClassKeyboard),
      eventKind: UInt32(kEventHotKeyPressed)
    )

    let callback: EventHandlerUPP = { _, event, _ -> OSStatus in
      guard let event = event else {
        return OSStatus(eventNotHandledErr)
      }

      var hotKeyID = EventHotKeyID()
      GetEventParameter(
        event,
        EventParamName(kEventParamDirectObject),
        EventParamType(typeEventHotKeyID),
        nil,
        MemoryLayout<EventHotKeyID>.size,
        nil,
        &hotKeyID
      )

      if hotKeyID.signature == PASTEY_SIGNATURE {
        HotkeyModule.shared?.sendEvent(withName: "onHotkey", body: nil)
      }
      return noErr
    }

    InstallEventHandler(
      GetApplicationEventTarget(),
      callback,
      1,
      &spec,
      nil,
      &eventHandler
    )
  }
}