import Cocoa
import CoreGraphics

func renderIcon() -> NSImage {
    let size = CGSize(width: 1024, height: 1024)
    let image = NSImage(size: size)
    
    image.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }
    
    // Clear background
    ctx.clear(CGRect(origin: .zero, size: size))
    
    // Icon squircle geometry (standard macOS app icon grid: 824x824 inside 1024x1024)
    let iconRect = CGRect(x: 100, y: 100, width: 824, height: 824)
    let cornerRadius: CGFloat = 185
    let squirclePath = CGPath(roundedRect: iconRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    
    // Shadow for the main icon squircle
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -30), blur: 50, color: NSColor(calibratedWhite: 0, alpha: 0.35).cgColor)
    ctx.addPath(squirclePath)
    ctx.setFillColor(NSColor.black.cgColor)
    ctx.fillPath()
    ctx.restoreGState()
    
    // Squircle background gradient
    ctx.saveGState()
    ctx.addPath(squirclePath)
    ctx.clip()
    
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bgColors = [
        NSColor(red: 0.08, green: 0.11, blue: 0.22, alpha: 1.0).cgColor, // Deep midnight
        NSColor(red: 0.12, green: 0.25, blue: 0.55, alpha: 1.0).cgColor, // Royal blue
        NSColor(red: 0.15, green: 0.45, blue: 0.85, alpha: 1.0).cgColor  // Vibrant blue
    ] as CFArray
    let bgLocations: [CGFloat] = [0.0, 0.6, 1.0]
    if let bgGradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: bgLocations) {
        ctx.drawLinearGradient(bgGradient,
                               start: CGPoint(x: 512, y: 924),
                               end: CGPoint(x: 512, y: 100),
                               options: [])
    }
    
    // Subtle inner glow / radial shine at the top
    let glowColors = [
        NSColor(red: 0.4, green: 0.7, blue: 1.0, alpha: 0.25).cgColor,
        NSColor(red: 0.1, green: 0.3, blue: 0.8, alpha: 0.0).cgColor
    ] as CFArray
    if let glowGradient = CGGradient(colorsSpace: colorSpace, colors: glowColors, locations: [0.0, 1.0]) {
        ctx.drawRadialGradient(glowGradient,
                               startCenter: CGPoint(x: 512, y: 850), startRadius: 0,
                               endCenter: CGPoint(x: 512, y: 850), endRadius: 500,
                               options: [])
    }
    
    // Border highlight
    ctx.addPath(squirclePath)
    ctx.setLineWidth(3)
    ctx.setStrokeColor(NSColor(calibratedWhite: 1.0, alpha: 0.18).cgColor)
    ctx.strokePath()
    
    // --- DRAW CLIPBOARD & STACKED CARDS ---
    
    // 1. Backing board (subtle frosted dark plate)
    let boardRect = CGRect(x: 230, y: 190, width: 564, height: 620)
    let boardPath = CGPath(roundedRect: boardRect, cornerWidth: 54, cornerHeight: 54, transform: nil)
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -18), blur: 30, color: NSColor(calibratedWhite: 0, alpha: 0.4).cgColor)
    ctx.addPath(boardPath)
    ctx.setFillColor(NSColor(red: 0.05, green: 0.08, blue: 0.16, alpha: 0.85).cgColor)
    ctx.fillPath()
    ctx.restoreGState()
    
    ctx.addPath(boardPath)
    ctx.setLineWidth(2)
    ctx.setStrokeColor(NSColor(calibratedWhite: 1.0, alpha: 0.12).cgColor)
    ctx.strokePath()
    
    // 2. Stacked cards (History layers)
    // Card 3 (lowest card, slightly offset)
    let card3Rect = CGRect(x: 270, y: 230, width: 484, height: 480)
    let card3Path = CGPath(roundedRect: card3Rect, cornerWidth: 32, cornerHeight: 32, transform: nil)
    ctx.addPath(card3Path)
    ctx.setFillColor(NSColor(red: 0.2, green: 0.35, blue: 0.65, alpha: 0.35).cgColor)
    ctx.fillPath()
    
    // Card 2 (middle card)
    let card2Rect = CGRect(x: 270, y: 245, width: 484, height: 480)
    let card2Path = CGPath(roundedRect: card2Rect, cornerWidth: 32, cornerHeight: 32, transform: nil)
    ctx.addPath(card2Path)
    ctx.setFillColor(NSColor(red: 0.3, green: 0.5, blue: 0.85, alpha: 0.45).cgColor)
    ctx.fillPath()
    
    // Card 1 (Front paper card)
    let card1Rect = CGRect(x: 270, y: 260, width: 484, height: 480)
    let card1Path = CGPath(roundedRect: card1Rect, cornerWidth: 32, cornerHeight: 32, transform: nil)
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -12), blur: 24, color: NSColor(calibratedWhite: 0, alpha: 0.3).cgColor)
    ctx.addPath(card1Path)
    ctx.setFillColor(NSColor(calibratedWhite: 0.98, alpha: 1.0).cgColor)
    ctx.fillPath()
    ctx.restoreGState()
    
    // Subtle paper gradient
    ctx.saveGState()
    ctx.addPath(card1Path)
    ctx.clip()
    let paperColors = [
        NSColor(calibratedWhite: 1.0, alpha: 1.0).cgColor,
        NSColor(red: 0.93, green: 0.95, blue: 0.98, alpha: 1.0).cgColor
    ] as CFArray
    if let paperGrad = CGGradient(colorsSpace: colorSpace, colors: paperColors, locations: [0.0, 1.0]) {
        ctx.drawLinearGradient(paperGrad,
                               start: CGPoint(x: 512, y: 740),
                               end: CGPoint(x: 512, y: 260),
                               options: [])
    }
    
    // Card content: Simulated clip items (clean modern colored pill tags & lines)
    // Item 1 (Highlighted active clip)
    let row1 = CGRect(x: 320, y: 600, width: 200, height: 28)
    let row1Path = CGPath(roundedRect: row1, cornerWidth: 14, cornerHeight: 14, transform: nil)
    ctx.addPath(row1Path)
    ctx.setFillColor(NSColor(red: 0.15, green: 0.5, blue: 1.0, alpha: 0.9).cgColor)
    ctx.fillPath()
    
    let text1 = CGRect(x: 320, y: 550, width: 384, height: 18)
    let text1Path = CGPath(roundedRect: text1, cornerWidth: 9, cornerHeight: 9, transform: nil)
    ctx.addPath(text1Path)
    ctx.setFillColor(NSColor(red: 0.15, green: 0.2, blue: 0.3, alpha: 0.8).cgColor)
    ctx.fillPath()
    
    let text2 = CGRect(x: 320, y: 515, width: 280, height: 18)
    let text2Path = CGPath(roundedRect: text2, cornerWidth: 9, cornerHeight: 9, transform: nil)
    ctx.addPath(text2Path)
    ctx.setFillColor(NSColor(red: 0.45, green: 0.52, blue: 0.62, alpha: 0.6).cgColor)
    ctx.fillPath()
    
    // Divider
    ctx.move(to: CGPoint(x: 320, y: 475))
    ctx.addLine(to: CGPoint(x: 704, y: 475))
    ctx.setLineWidth(2)
    ctx.setStrokeColor(NSColor(red: 0.85, green: 0.88, blue: 0.92, alpha: 0.9).cgColor)
    ctx.strokePath()
    
    // Item 2
    let row2 = CGRect(x: 320, y: 415, width: 140, height: 24)
    let row2Path = CGPath(roundedRect: row2, cornerWidth: 12, cornerHeight: 12, transform: nil)
    ctx.addPath(row2Path)
    ctx.setFillColor(NSColor(red: 0.1, green: 0.75, blue: 0.6, alpha: 0.85).cgColor)
    ctx.fillPath()
    
    let text3 = CGRect(x: 320, y: 375, width: 340, height: 18)
    let text3Path = CGPath(roundedRect: text3, cornerWidth: 9, cornerHeight: 9, transform: nil)
    ctx.addPath(text3Path)
    ctx.setFillColor(NSColor(red: 0.45, green: 0.52, blue: 0.62, alpha: 0.6).cgColor)
    ctx.fillPath()
    
    let text4 = CGRect(x: 320, y: 340, width: 220, height: 18)
    let text4Path = CGPath(roundedRect: text4, cornerWidth: 9, cornerHeight: 9, transform: nil)
    ctx.addPath(text4Path)
    ctx.setFillColor(NSColor(red: 0.65, green: 0.7, blue: 0.78, alpha: 0.5).cgColor)
    ctx.fillPath()
    
    ctx.restoreGState() // Done card1 clipping
    
    // 3. Metallic Clip at top
    // Clip base mount
    let clipMountRect = CGRect(x: 412, y: 735, width: 200, height: 60)
    let clipMountPath = CGPath(roundedRect: clipMountRect, cornerWidth: 16, cornerHeight: 16, transform: nil)
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -6), blur: 14, color: NSColor(calibratedWhite: 0, alpha: 0.35).cgColor)
    ctx.addPath(clipMountPath)
    ctx.setFillColor(NSColor(calibratedWhite: 0.75, alpha: 1.0).cgColor)
    ctx.fillPath()
    ctx.restoreGState()
    
    // Metallic gradient on mount
    ctx.saveGState()
    ctx.addPath(clipMountPath)
    ctx.clip()
    let metalColors = [
        NSColor(calibratedWhite: 0.95, alpha: 1.0).cgColor,
        NSColor(calibratedWhite: 0.65, alpha: 1.0).cgColor,
        NSColor(calibratedWhite: 0.85, alpha: 1.0).cgColor
    ] as CFArray
    if let metalGrad = CGGradient(colorsSpace: colorSpace, colors: metalColors, locations: [0.0, 0.5, 1.0]) {
        ctx.drawLinearGradient(metalGrad,
                               start: CGPoint(x: 412, y: 795),
                               end: CGPoint(x: 612, y: 735),
                               options: [])
    }
    ctx.restoreGState()
    
    // Clip handle / loop (metallic arch)
    let loopRect = CGRect(x: 457, y: 775, width: 110, height: 65)
    let loopPath = CGPath(roundedRect: loopRect, cornerWidth: 32, cornerHeight: 32, transform: nil)
    ctx.addPath(loopPath)
    ctx.setLineWidth(16)
    ctx.setStrokeColor(NSColor(calibratedWhite: 0.85, alpha: 1.0).cgColor)
    ctx.strokePath()
    
    // Inner loop highlight
    let innerLoopRect = CGRect(x: 462, y: 780, width: 100, height: 55)
    let innerLoopPath = CGPath(roundedRect: innerLoopRect, cornerWidth: 27, cornerHeight: 27, transform: nil)
    ctx.addPath(innerLoopPath)
    ctx.setLineWidth(4)
    ctx.setStrokeColor(NSColor(calibratedWhite: 1.0, alpha: 0.6).cgColor)
    ctx.strokePath()
    
    ctx.restoreGState() // Done squircle clipping
    
    image.unlockFocus()
    return image
}

let image = renderIcon()
guard let tiffData = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiffData),
      let pngData = rep.representation(using: .png, properties: [:]) else {
    print("Error creating PNG data")
    exit(1)
}

let outputPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "AppIcon_1024.png"
let url = URL(fileURLWithPath: outputPath)
try pngData.write(to: url)
print("Successfully generated icon at: \(outputPath)")
