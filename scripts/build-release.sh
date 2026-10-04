#!/usr/bin/env bash
#
# Pastey release pipeline.
#
# Interactive by default. Runs: preflight → version bump → build → DMG →
# commit → tag → push → GitHub release.
#
# Usage:
#   ./scripts/release.sh                      # interactive
#   ./scripts/release.sh --version 1.0.1      # skip version prompt
#   ./scripts/release.sh --message "..."      # skip commit-message prompt
#   ./scripts/release.sh --no-push            # build + commit + tag, stop there
#   ./scripts/release.sh --skip-build         # git + release only
#   ./scripts/release.sh --dry-run            # print plan, do nothing
#   ./scripts/release.sh -y                   # assume yes (for CI)
#
set -euo pipefail

# ---------------------------------------------------------------- colors
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_CYAN=$'\033[36m'
else
  C_RESET=""; C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_CYAN=""
fi

log()  { printf '%s==>%s %s\n' "$C_CYAN"   "$C_RESET" "$*"; }
ok()   { printf '%s✓%s %s\n'   "$C_GREEN"  "$C_RESET" "$*"; }
warn() { printf '%s!!%s %s\n'  "$C_YELLOW" "$C_RESET" "$*" >&2; }
die()  { printf '%sxx%s %s\n'  "$C_RED"    "$C_RESET" "$*" >&2; exit 1; }

# ---------------------------------------------------------------- flags
VERSION=""
MESSAGE=""
NOTES=""
NO_PUSH=0
SKIP_BUILD=0
DRY_RUN=0
ASSUME_YES=0
ALLOW_DIRTY=0

usage() {
  cat <<'EOF'
Usage: release.sh [options]

  --version <semver>     Set version explicitly (e.g. 1.0.1).
  --message <text>       Commit message.
  --notes <text>         Release notes shown on GitHub.
  --no-push              Build, commit, tag locally. Do not push or publish.
  --skip-build           Skip bundling + xcodebuild + DMG packaging.
  --allow-dirty          Do not require a clean working tree.
  --dry-run              Print plan, do nothing.
  -y, --yes              Assume "yes" for all prompts (CI mode).
  -h, --help             Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)      VERSION="$2"; shift 2 ;;
    --message)      MESSAGE="$2"; shift 2 ;;
    --notes)        NOTES="$2"; shift 2 ;;
    --no-push)      NO_PUSH=1; shift ;;
    --skip-build)   SKIP_BUILD=1; shift ;;
    --allow-dirty)  ALLOW_DIRTY=1; shift ;;
    --dry-run)      DRY_RUN=1; shift ;;
    -y|--yes)       ASSUME_YES=1; shift ;;
    -h|--help)      usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

confirm() {
  local prompt="$1"
  if [[ "$ASSUME_YES" == "1" ]]; then return 0; fi
  local answer
  read -r -p "$prompt [y/N] " answer || true
  [[ "$answer" =~ ^[Yy]$ ]]
}

ask() {
  local prompt="$1" default="$2" answer
  read -r -p "$prompt [$default]: " answer || true
  echo "${answer:-$default}"
}

# ---------------------------------------------------------------- paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

INFO_PLIST="$ROOT_DIR/macos/Pastey-macOS/Info.plist"
APP_NAME="Pastey"

[[ -f "$INFO_PLIST" ]] || die "Info.plist not found at $INFO_PLIST"

# ---------------------------------------------------------------- preflight
log "Preflight"

command -v git       >/dev/null || die "git not found"
command -v xcodebuild >/dev/null || die "xcodebuild not found"
command -v hdiutil   >/dev/null || die "hdiutil not found"
if [[ "$SKIP_BUILD" != "1" ]]; then
  command -v npx >/dev/null || die "npx not found"
fi

if [[ "$NO_PUSH" != "1" ]]; then
  command -v gh >/dev/null || die "gh not found. Install: brew install gh && gh auth login"
  gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"
fi

git rev-parse --git-dir >/dev/null 2>&1 || die "Not inside a git repository"

if [[ "$ALLOW_DIRTY" != "1" ]]; then
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "Working tree has changes:"
    git status --short
    confirm "Include these in the release commit?" || die "Aborted"
  fi
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
  warn "On branch '$BRANCH', not main/master"
  confirm "Continue anyway?" || die "Aborted"
fi

ok "Preflight passed"

# ---------------------------------------------------------------- version
CURRENT_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "$INFO_PLIST" 2>/dev/null || echo "0.0.0")
CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$INFO_PLIST" 2>/dev/null || echo "0")

log "Current version: v$CURRENT_VERSION (build $CURRENT_BUILD)"

if [[ -z "$VERSION" ]]; then
  if [[ "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    SUGGESTED="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$((BASH_REMATCH[3] + 1))"
  else
    SUGGESTED="1.0.0"
  fi
  VERSION="$(ask "New version" "$SUGGESTED")"
fi

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "Version must be semver like 1.0.1"

NEW_BUILD=$((CURRENT_BUILD + 1))
TAG="v$VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  die "Tag $TAG already exists locally. Bump the version or delete the tag."
fi

log "Releasing v$VERSION (build $NEW_BUILD), tag $TAG"

DMG_NAME="${APP_NAME}-${VERSION}.dmg"
APP_PATH="$ROOT_DIR/macos/build/Build/Products/Release/${APP_NAME}.app"
DMG_STAGING="$ROOT_DIR/macos/build/dmg-staging"
DMG_PATH="$ROOT_DIR/macos/build/${DMG_NAME}"

if [[ "$DRY_RUN" == "1" ]]; then
  echo ""
  echo "Plan:"
  echo "  1. Set Info.plist to $VERSION (build $NEW_BUILD)"
  echo "  2. Bundle JS, xcodebuild Release, install to /Applications"
  echo "  3. Package DMG at $DMG_PATH"
  echo "  4. git add -A; git commit -m \"${MESSAGE:-Release v$VERSION}\""
  echo "  5. git tag -a $TAG"
  [[ "$NO_PUSH" == "1" ]] || echo "  6. git push; git push origin $TAG"
  [[ "$NO_PUSH" == "1" ]] || echo "  7. gh release create $TAG $DMG_PATH"
  exit 0
fi

# ---------------------------------------------------------------- write version
log "Updating Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD"        "$INFO_PLIST"

# ---------------------------------------------------------------- build
if [[ "$SKIP_BUILD" != "1" ]]; then
  log "Bundling JS"
  npx react-native bundle \
    --entry-file index.js \
    --platform macos \
    --dev false \
    --bundle-output macos/Pastey-macOS/main.jsbundle \
    --assets-dest macos/Pastey-macOS

  log "Building Release (this can take a few minutes)"
  (
    cd "$ROOT_DIR/macos"
    xcodebuild \
      -workspace Pastey.xcworkspace \
      -scheme Pastey-macOS \
      -configuration Release \
      -derivedDataPath build \
      SKIP_BUNDLING=1 \
      build
  )

  log "Installing to /Applications"
  if pgrep -x "$APP_NAME" >/dev/null; then
    killall "$APP_NAME" 2>/dev/null || true
    sleep 1
  fi
  rm -rf "/Applications/${APP_NAME}.app"
  cp -R "$APP_PATH" /Applications/

  log "Packaging DMG"
  rm -rf "$DMG_STAGING"
  mkdir -p "$DMG_STAGING"
  cp -R "$APP_PATH" "$DMG_STAGING/"
  ln -s /Applications "$DMG_STAGING/Applications"
  rm -f "$DMG_PATH"
  hdiutil create \
    -volname "$APP_NAME" \
    -srcfolder "$DMG_STAGING" \
    -ov \
    -format UDZO \
    "$DMG_PATH" >/dev/null
  rm -rf "$DMG_STAGING"

  DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
  ok "DMG built: $DMG_NAME ($DMG_SIZE)"
else
  log "Skipping build (--skip-build)"
  [[ -f "$DMG_PATH" ]] || die "DMG not found at $DMG_PATH; can't publish without it"
fi

# ---------------------------------------------------------------- git
if [[ -z "$MESSAGE" ]]; then
  MESSAGE="$(ask "Commit message" "Release v$VERSION")"
fi

log "Staging changes"
git add -A
git status --short || true

if git diff --cached --quiet; then
  warn "Nothing staged to commit"
else
  log "Committing"
  git commit -m "$MESSAGE"
  ok "Committed"
fi

log "Tagging $TAG"
git tag -a "$TAG" -m "Release $VERSION"
ok "Tagged"

# ---------------------------------------------------------------- push
if [[ "$NO_PUSH" == "1" ]]; then
  echo ""
  ok "Local release complete"
  echo "  Next:"
  echo "    git push && git push origin $TAG"
  echo "    gh release create $TAG \"$DMG_PATH\" --title \"$APP_NAME $TAG\" --generate-notes"
  exit 0
fi

log "Pushing to origin"
if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  git push
else
  git push -u origin "$BRANCH"
fi

if git ls-remote --tags origin "$TAG" 2>/dev/null | grep -q "refs/tags/$TAG$"; then
  warn "Tag $TAG already exists on origin; skipping tag push"
else
  git push origin "$TAG"
fi
ok "Pushed"

# ---------------------------------------------------------------- publish
log "Creating GitHub release"
if gh release view "$TAG" >/dev/null 2>&1; then
  warn "Release $TAG already exists on GitHub; skipping"
else
  if [[ -n "$NOTES" ]]; then
    gh release create "$TAG" "$DMG_PATH" \
      --title "${APP_NAME} ${TAG}" \
      --notes "$NOTES"
  else
    gh release create "$TAG" "$DMG_PATH" \
      --title "${APP_NAME} ${TAG}" \
      --generate-notes
  fi
  ok "Published $TAG"
fi

# ---------------------------------------------------------------- summary
RELEASE_URL="$(gh release view "$TAG" --json url -q .url 2>/dev/null || echo '')"

echo ""
echo "============================================================"
printf '  %s v%s released\n' "$APP_NAME" "$VERSION"
echo "============================================================"
echo ""
echo "  Tag:      $TAG"
echo "  DMG:      $DMG_PATH"
[[ -n "$RELEASE_URL" ]] && echo "  Release:  $RELEASE_URL"
echo ""