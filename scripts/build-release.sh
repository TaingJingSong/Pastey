#!/bin/bash
set -e

# Change to project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---------------------------------------------------------------
# Version: read from Info.plist so there's a single source of truth
# ---------------------------------------------------------------
INFO_PLIST="$ROOT_DIR/macos/Pastey-macOS/Info.plist"
VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "$INFO_PLIST" 2>/dev/null || echo "0.0.0")
BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$INFO_PLIST" 2>/dev/null || echo "1")
APP_NAME="Pastey"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"
APP_PATH="$ROOT_DIR/macos/build/Build/Products/Release/${APP_NAME}.app"
DMG_STAGING="$ROOT_DIR/macos/build/dmg-staging"
DMG_PATH="$ROOT_DIR/macos/build/${DMG_NAME}"

echo "==> Building ${APP_NAME} v${VERSION} (build ${BUILD_NUMBER})"

# ---------------------------------------------------------------
# 1. Bundle JS
# ---------------------------------------------------------------
echo "==> 1. Bundling production React Native JS bundle for macOS..."
npx react-native bundle \
  --entry-file index.js \
  --platform macos \
  --dev false \
  --bundle-output macos/Pastey-macOS/main.jsbundle \
  --assets-dest macos/Pastey-macOS

# ---------------------------------------------------------------
# 2. Build Release
# ---------------------------------------------------------------
echo "==> 2. Building Release application with xcodebuild..."
cd "$ROOT_DIR/macos"
xcodebuild -workspace Pastey.xcworkspace \
  -scheme Pastey-macOS \
  -configuration Release \
  -derivedDataPath build \
  SKIP_BUNDLING=1 \
  build

# ---------------------------------------------------------------
# 3. Install to /Applications (for local use)
# ---------------------------------------------------------------
echo "==> 3. Installing to /Applications..."
if pgrep -x "$APP_NAME" > /dev/null; then
  echo "    Closing running ${APP_NAME} process..."
  killall "$APP_NAME" 2>/dev/null || true
  sleep 1
fi
rm -rf "/Applications/${APP_NAME}.app"
cp -R "$APP_PATH" /Applications/

# ---------------------------------------------------------------
# 4. Package DMG for distribution
# ---------------------------------------------------------------
echo "==> 4. Packaging DMG..."
rm -rf "$DMG_STAGING"
mkdir -p "$DMG_STAGING"

# Copy the app and add a symlink to /Applications so users can drag-install
cp -R "$APP_PATH" "$DMG_STAGING/"
ln -s /Applications "$DMG_STAGING/Applications"

# Remove any previous DMG with the same name
rm -f "$DMG_PATH"

# Create the DMG. UDZO = compressed, read-only.
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$DMG_STAGING" \
  -ov \
  -format UDZO \
  "$DMG_PATH" > /dev/null

# Clean up staging
rm -rf "$DMG_STAGING"

# ---------------------------------------------------------------
# Done
# ---------------------------------------------------------------
DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)

echo ""
echo "============================================================"
echo "  ${APP_NAME} v${VERSION} built successfully"
echo "============================================================"
echo ""
echo "  Installed:  /Applications/${APP_NAME}.app"
echo "  DMG:        ${DMG_PATH}  (${DMG_SIZE})"
echo ""
echo "  To publish to GitHub Releases:"
echo "    gh release create v${VERSION} \"${DMG_PATH}\" \\"
echo "      --title \"${APP_NAME} v${VERSION}\" \\"
echo "      --notes \"See CHANGELOG.md\""
echo ""