import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

enum IconMaskError: Error, CustomStringConvertible {
  case invalidArguments
  case unreadableInput(String)
  case cannotCreateBitmap
  case cannotCreateImage
  case opaqueCorner(String)
  case cannotCreateDestination(String)
  case cannotWriteOutput(String)

  var description: String {
    switch self {
    case .invalidArguments:
      return "usage: mask-rounded-icon <input.png> <output.png>"
    case .unreadableInput(let path):
      return "cannot read PNG: \(path)"
    case .cannotCreateBitmap:
      return "cannot create RGBA bitmap"
    case .cannotCreateImage:
      return "cannot create masked image"
    case .opaqueCorner(let corner):
      return "rounded icon validation failed: \(corner) corner is not transparent"
    case .cannotCreateDestination(let path):
      return "cannot create PNG destination: \(path)"
    case .cannotWriteOutput(let path):
      return "cannot write PNG: \(path)"
    }
  }
}

func run() throws {
  guard CommandLine.arguments.count == 3 else {
    throw IconMaskError.invalidArguments
  }

  let inputPath = CommandLine.arguments[1]
  let outputPath = CommandLine.arguments[2]
  let inputURL = URL(fileURLWithPath: inputPath)
  let outputURL = URL(fileURLWithPath: outputPath)

  guard
    let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
    let input = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    throw IconMaskError.unreadableInput(inputPath)
  }

  let width = input.width
  let height = input.height
  let bytesPerPixel = 4
  let bytesPerRow = width * bytesPerPixel
  let byteCount = height * bytesPerRow
  guard let pixels = calloc(byteCount, 1) else {
    throw IconMaskError.cannotCreateBitmap
  }
  defer { free(pixels) }

  let bitmapInfo = CGBitmapInfo.byteOrder32Big.union(
    CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
  )
  guard let context = CGContext(
    data: pixels,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: bitmapInfo.rawValue
  ) else {
    throw IconMaskError.cannotCreateBitmap
  }

  context.setAllowsAntialiasing(true)
  context.setShouldAntialias(true)
  context.interpolationQuality = .high
  context.clear(CGRect(x: 0, y: 0, width: width, height: height))

  let shortEdge = CGFloat(min(width, height))
  // Match the canonical SVG's outer 64×64 rounded rectangle exactly so every
  // generated platform asset keeps the same borderless silhouette.
  let inset: CGFloat = 0
  let radius = shortEdge * 15 / 64
  let roundedRect = CGRect(
    x: inset,
    y: inset,
    width: CGFloat(width) - inset * 2,
    height: CGFloat(height) - inset * 2
  )
  context.addPath(CGPath(roundedRect: roundedRect, cornerWidth: radius, cornerHeight: radius, transform: nil))
  context.clip()
  context.draw(input, in: CGRect(x: 0, y: 0, width: width, height: height))

  let buffer = pixels.bindMemory(to: UInt8.self, capacity: byteCount)
  let cornerOffsets: [(String, Int)] = [
    ("top-left", 3),
    ("top-right", (width - 1) * bytesPerPixel + 3),
    ("bottom-left", (height - 1) * bytesPerRow + 3),
    ("bottom-right", (height - 1) * bytesPerRow + (width - 1) * bytesPerPixel + 3),
  ]
  for (name, offset) in cornerOffsets where buffer[offset] != 0 {
    throw IconMaskError.opaqueCorner(name)
  }

  guard let output = context.makeImage() else {
    throw IconMaskError.cannotCreateImage
  }
  guard let destination = CGImageDestinationCreateWithURL(
    outputURL as CFURL,
    UTType.png.identifier as CFString,
    1,
    nil
  ) else {
    throw IconMaskError.cannotCreateDestination(outputPath)
  }
  CGImageDestinationAddImage(destination, output, nil)
  guard CGImageDestinationFinalize(destination) else {
    throw IconMaskError.cannotWriteOutput(outputPath)
  }
}

do {
  try run()
} catch {
  FileHandle.standardError.write(Data("\(error)\n".utf8))
  exit(1)
}
