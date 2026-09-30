import Foundation

@objc(PasteyModule)
class PasteyModule: NSObject {

  @objc func hello(
    _ name: String,
    resolver resolve: @escaping (String) -> Void,
    rejecter reject: @escaping (String, String, Error?) -> Void
  ) {
    resolve("Hello, \(name)! From Swift 👋")
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}