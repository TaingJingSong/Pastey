import Foundation
import ServiceManagement

@objc(SettingsModule)
class SettingsModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  private func getLaunchAtLogin() -> Bool {
    if #available(macOS 13.0, *) {
      let status = SMAppService.mainApp.status
      if status == .enabled {
        return true
      } else if status == .notRegistered {
        return false
      }
    }
    return getLaunchAtLoginLegacy()
  }

  private func setLaunchAtLogin(_ enabled: Bool) {
    UserDefaults.standard.set(enabled, forKey: "launchAtLogin")
    if #available(macOS 13.0, *) {
      do {
        if enabled {
          if SMAppService.mainApp.status != .enabled {
            try SMAppService.mainApp.register()
          }
        } else {
          if SMAppService.mainApp.status == .enabled {
            try SMAppService.mainApp.unregister()
          }
        }
      } catch {
        NSLog("[SettingsModule] SMAppService error: %@", error.localizedDescription)
      }
    } else {
      setLaunchAtLoginLegacy(enabled: enabled)
    }
  }

  private func getLaunchAtLoginLegacy() -> Bool {
    let bundleId = Bundle.main.bundleIdentifier ?? "com.pastey.Pastey"
    let fm = FileManager.default
    if let libraryDir = fm.urls(for: .libraryDirectory, in: .userDomainMask).first {
      let plistURL = libraryDir.appendingPathComponent("LaunchAgents/\(bundleId).plist")
      if fm.fileExists(atPath: plistURL.path) {
        return true
      }
    }
    return UserDefaults.standard.bool(forKey: "launchAtLogin")
  }

  private func setLaunchAtLoginLegacy(enabled: Bool) {
    let bundleId = Bundle.main.bundleIdentifier ?? "com.pastey.Pastey"
    let fm = FileManager.default
    guard let libraryDir = fm.urls(for: .libraryDirectory, in: .userDomainMask).first else { return }
    let launchAgentsDir = libraryDir.appendingPathComponent("LaunchAgents", isDirectory: true)
    let plistURL = launchAgentsDir.appendingPathComponent("\(bundleId).plist")

    if enabled {
      try? fm.createDirectory(at: launchAgentsDir, withIntermediateDirectories: true)
      let appPath = Bundle.main.bundlePath
      let execPath = (appPath as NSString).appendingPathComponent("Contents/MacOS/Pastey")
      let plistContent: [String: Any] = [
        "Label": bundleId,
        "ProgramArguments": [execPath],
        "RunAtLoad": true,
        "ProcessType": "Interactive"
      ]
      if let data = try? PropertyListSerialization.data(fromPropertyList: plistContent, format: .xml, options: 0) {
        try? data.write(to: plistURL)
      }
    } else {
      try? fm.removeItem(at: plistURL)
    }
  }

  @objc func get(
    _ key: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if key == "launchAtLogin" {
      resolve(getLaunchAtLogin())
      return
    }
    let value = UserDefaults.standard.object(forKey: key)
    resolve(value ?? NSNull())
  }

  @objc func set(
    _ key: String,
    value: Any,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if key == "launchAtLogin" {
      if let boolVal = value as? Bool {
        setLaunchAtLogin(boolVal)
      } else if let numVal = value as? NSNumber {
        setLaunchAtLogin(numVal.boolValue)
      }
      resolve(true)
      return
    }
    UserDefaults.standard.set(value, forKey: key)
    resolve(true)
  }

  // The first parameter must stay unlabeled. Given a label, Swift exports the
  // selector as allWithResolver:rejecter:, which no RCT_EXTERN_METHOD can match.
  @objc func all(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    var dict = UserDefaults.standard.dictionaryRepresentation()
    dict["launchAtLogin"] = getLaunchAtLogin()
    resolve(dict)
  }
}
