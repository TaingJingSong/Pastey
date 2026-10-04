import AppKit
import Foundation
import React

@objc(SFSymbolManager)
class SFSymbolManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func view() -> NSView! {
    return SFSymbolView()
  }

  @objc func setSymbolName(_ name: String, for view: SFSymbolView) {
    view.symbolName = name
  }

  @objc func setSymbolSize(_ size: NSNumber, for view: SFSymbolView) {
    view.symbolSize = size
  }

  @objc func setSymbolWeight(_ weight: NSNumber, for view: SFSymbolView) {
    view.symbolWeight = weight
  }

  @objc func setSymbolColor(_ color: String?, for view: SFSymbolView) {
    view.symbolColor = color
  }
}
