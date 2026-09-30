import AppKit
import Foundation

@objc(ClipboardMonitor)
class ClipboardMonitor: RCTEventEmitter {

  private var timer: Timer?
  private var lastChangeCount: Int = -1
  private let pollInterval: TimeInterval = 0.4

  override func supportedEvents() -> [String]! {
    return ["onClipboardChange"]
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func start() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.lastChangeCount = NSPasteboard.general.changeCount
      self.timer?.invalidate()
      self.timer = Timer.scheduledTimer(
        withTimeInterval: self.pollInterval,
        repeats: true
      ) { [weak self] _ in
        self?.poll()
      }
    }
  }

  @objc func stop() {
    DispatchQueue.main.async { [weak self] in
      self?.timer?.invalidate()
      self?.timer = nil
    }
  }

  private func poll() {
    let pb = NSPasteboard.general
    guard pb.changeCount != lastChangeCount else { return }
    lastChangeCount = pb.changeCount
    guard let payload = readPasteboard(pb) else { return }
    sendEvent(withName: "onClipboardChange", body: payload)
  }

  private func readPasteboard(_ pb: NSPasteboard) -> [String: Any]? {
    let now = Date().timeIntervalSince1970 * 1000

    if let str = pb.string(forType: .string), !str.isEmpty {
      return [
        "hash": sha256(str),
        "type": "text",
        "preview": String(str.prefix(200)),
        "content": str,
        "createdAt": now,
      ]
    }

    if let data = pb.data(forType: .png) {
      let dir = NSTemporaryDirectory() + "pastey/"
      try? FileManager.default.createDirectory(
        atPath: dir,
        withIntermediateDirectories: true
      )
      let path = dir + "\(UUID().uuidString).png"
      do {
        try data.write(to: URL(fileURLWithPath: path))
        return [
          "hash": sh256(data.base64EncodedString()),
          "type": "image",
          "preview": "[image]",
          "content": "",
          "filePath": path,
          "createdAt": now,
        ]
      } catch {
        return nil
      }
    }

    return nil
  }
}

import CryptoKit

private func sha256(_ str: String) -> String {
  let digest = SHA256.hash(data: Data(str.utf8))
  return digest.map { String(format: "%02x", $0) }.joined()
}