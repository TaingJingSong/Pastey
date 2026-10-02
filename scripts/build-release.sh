#!/bin/bash
set -e

# Change to project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> 1. Bundling production React Native JS bundle for macOS..."
npx react-native bundle \
  --entry-file index.js \
  --platform macos \
  --dev false \
  --bundle-output macos/Pastey-macOS/main.jsbundle \
  --assets-dest macos/Pastey-macOS

echo "==> 2. Building Release application with xcodebuild..."
cd "$ROOT_DIR/macos"
xcodebuild -workspace Pastey.xcworkspace \
  -scheme Pastey-macOS \
  -configuration Release \
  -derivedDataPath build \
  SKIP_BUNDLING=1 \
  build

echo "==> 3. Installing Pastey.app to /Applications..."
# Stop existing Pastey instance if running to avoid text file busy errors
if pgrep -x "Pastey" > /dev/null; then
  echo "Closing running Pastey process..."
  killall "Pastey" 2>/dev/null || true
  sleep 1
fi

rm -rf /Applications/Pastey.app
cp -R build/Build/Products/Release/Pastey.app /Applications/

echo ""
echo " Successfully built and installed Pastey.app to /Applications!"
echo "Launch it via Spotlight, Finder, or run: open /Applications/Pastey.app"
