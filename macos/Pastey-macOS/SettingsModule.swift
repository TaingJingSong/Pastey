import Foundation

@objc(SettingsModule)
class SettingsModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func get(
    _ key: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let value = UserDefaults.standard.object(forKey: key)
    resolve(value ?? NSNull())
  }

  @objc func set(
    _ key: String,
    value: Any,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UserDefaults.standard.set(value, forKey: key)
    resolve(true)
  }

  // The first parameter must stay unlabeled. Given a label, Swift exports the
  // selector as allWithResolver:rejecter:, which no RCT_EXTERN_METHOD can match.
  @objc func all(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UserDefaults.standard.dictionaryRepresentation())
  }
}
