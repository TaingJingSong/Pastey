import AppKit
import Foundation

@objc(SFSymbolView)
class SFSymbolView: NSImageView {
  @objc var symbolName: String = "" {
    didSet { updateSymbol() }
  }

  @objc var symbolSize: NSNumber = 14 {
    didSet { updateSymbol() }
  }

  @objc var symbolWeight: NSNumber = 4 {
    didSet { updateSymbol() }
  }

  @objc var symbolColor: String? = nil {
    didSet { updateSymbol() }
  }

  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    imageScaling = .scaleProportionallyUpOrDown
    contentTintColor = .secondaryLabelColor
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    imageScaling = .scaleProportionallyUpOrDown
    contentTintColor = .secondaryLabelColor
  }

  override func viewDidChangeEffectiveAppearance() {
    super.viewDidChangeEffectiveAppearance()
    if symbolColor == nil {
      contentTintColor = .secondaryLabelColor
    }
  }

  private func fontWeight(from value: Int) -> NSFont.Weight {
    switch value {
    case 1: return .ultraLight
    case 2: return .thin
    case 3: return .light
    case 4: return .regular
    case 5: return .medium
    case 6: return .semibold
    case 7: return .bold
    case 8: return .heavy
    case 9: return .black
    default: return .regular
    }
  }

  private func parseColor(_ hex: String?) -> NSColor? {
    guard let hex = hex?.trimmingCharacters(in: .whitespacesAndNewlines), !hex.isEmpty else {
      return nil
    }
    var str = hex
    if str.hasPrefix("#") {
      str.removeFirst()
    }
    if str.count == 3 || str.count == 4 {
      str = str.map { "\($0)\($0)" }.joined()
    }
    var rgbValue: UInt64 = 0
    guard Scanner(string: str).scanHexInt64(&rgbValue) else { return nil }

    if str.count == 6 {
      return NSColor(
        calibratedRed: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
        green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
        blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
        alpha: 1.0
      )
    } else if str.count == 8 {
      return NSColor(
        calibratedRed: CGFloat((rgbValue & 0xFF000000) >> 24) / 255.0,
        green: CGFloat((rgbValue & 0x00FF0000) >> 16) / 255.0,
        blue: CGFloat((rgbValue & 0x0000FF00) >> 8) / 255.0,
        alpha: CGFloat(rgbValue & 0x000000FF) / 255.0
      )
    }
    return nil
  }

  private func updateSymbol() {
    guard !symbolName.isEmpty,
          let img = NSImage(systemSymbolName: symbolName, accessibilityDescription: nil) else {
      image = nil
      return
    }
    let size = CGFloat(truncating: symbolSize)
    let weight = fontWeight(from: symbolWeight.intValue)
    let config = NSImage.SymbolConfiguration(pointSize: size > 0 ? size : 14, weight: weight)
    image = img.withSymbolConfiguration(config)
    contentTintColor = parseColor(symbolColor) ?? .secondaryLabelColor
    imageScaling = .scaleProportionallyUpOrDown
  }
}
