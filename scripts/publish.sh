#!/bin/sh
set -eu

# VS Music - Publish Pipeline Script
# Usage: sh scripts/publish.sh [options] [all|linux|win]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"
cd "$ROOT_DIR"

DRY_RUN=0
DO_MARKETPLACE=1
DO_OPENVSX=1
TARGET="all"

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --marketplace-only)
      DO_MARKETPLACE=1
      DO_OPENVSX=0
      shift
      ;;
    --openvsx-only)
      DO_MARKETPLACE=0
      DO_OPENVSX=1
      shift
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    linux|linux-x64)
      TARGET="linux"
      shift
      ;;
    win|win32|win32-x64)
      TARGET="win"
      shift
      ;;
    all)
      TARGET="all"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options] [all|linux|win]"
      echo ""
      echo "Targets:"
      echo "  all                 Publish both Linux and Windows packages (default)"
      echo "  linux               Publish Linux package only"
      echo "  win                 Publish Windows package only"
      echo ""
      echo "Options:"
      echo "  --dry-run           Verify packages and tokens without uploading"
      echo "  --marketplace-only  Publish only to Visual Studio Marketplace"
      echo "  --openvsx-only      Publish only to Open VSX Registry"
      echo ""
      echo "Environment variables:"
      echo "  VSCE_PAT            Personal Access Token for Visual Studio Marketplace"
      echo "  OVSX_PAT            Personal Access Token for Open VSX Registry"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

echo "========================================="
echo "  VS Music Extension - Publish Pipeline  "
echo "  Target: $TARGET | Dry Run: $DRY_RUN    "
echo "========================================="

# Helper to find latest matching vsix in build/ (or fallback to root)
find_vsix() {
  prefix="$1"
  # First check build/ directory
  file=$(ls -t "$BUILD_DIR"/music-"$prefix"-*.vsix 2>/dev/null | head -n 1 || true)
  if [ -z "$file" ] || [ ! -f "$file" ]; then
    # Fallback to root directory
    file=$(ls -t "$ROOT_DIR"/music-"$prefix"-*.vsix 2>/dev/null | head -n 1 || true)
  fi
  echo "$file"
}

PACKAGES=""

if [ "$TARGET" = "linux" ] || [ "$TARGET" = "all" ]; then
  LINUX_VSIX=$(find_vsix "linux-x64")
  if [ -z "$LINUX_VSIX" ]; then
    echo "==> Linux package missing. Building via scripts/build.sh linux..."
    sh "$ROOT_DIR/scripts/build.sh" linux --no-clean
    LINUX_VSIX=$(find_vsix "linux-x64")
  fi
  PACKAGES="$PACKAGES $LINUX_VSIX"
fi

if [ "$TARGET" = "win" ] || [ "$TARGET" = "all" ]; then
  WIN_VSIX=$(find_vsix "win32-x64")
  if [ -z "$WIN_VSIX" ]; then
    echo "==> Windows package missing. Building via scripts/build.sh win..."
    sh "$ROOT_DIR/scripts/build.sh" win --no-clean
    WIN_VSIX=$(find_vsix "win32-x64")
  fi
  PACKAGES="$PACKAGES $WIN_VSIX"
fi

# Trim spaces
PACKAGES=$(echo "$PACKAGES" | sed 's/^[ ]*//')

echo "==> Packages staged for publish:"
for pkg in $PACKAGES; do
  echo "    * $pkg ($(ls -lh "$pkg" | awk '{print $5}'))"
done

if [ "$DRY_RUN" -eq 1 ]; then
  echo ""
  echo "==> [DRY RUN] Verification successful. Exiting without uploading."
  exit 0
fi

# Detect vsce runner: bunx or npx
if command -v bunx >/dev/null 2>&1; then
  VSCE_CMD="bunx @vscode/vsce"
else
  VSCE_CMD="npx @vscode/vsce"
fi

# 1. Publish to VS Code Marketplace
if [ "$DO_MARKETPLACE" -eq 1 ]; then
  echo ""
  echo "==> [1/2] Publishing to Visual Studio Marketplace..."
  if [ -z "${VSCE_PAT:-}" ]; then
    echo "WARNING: VSCE_PAT is not set. Skipping Visual Studio Marketplace publishing." >&2
  else
    for pkg in $PACKAGES; do
      echo "  -> Uploading $pkg..."
      $VSCE_CMD publish --packagePath "$pkg" --skip-duplicate
    done
    echo "  -> Visual Studio Marketplace publish complete."
  fi
fi

# 2. Publish to Open VSX Registry
if [ "$DO_OPENVSX" -eq 1 ]; then
  echo ""
  echo "==> [2/2] Publishing to Open VSX Registry..."
  if [ -z "${OVSX_PAT:-}" ]; then
    echo "NOTICE: OVSX_PAT is not set. Skipping Open VSX Registry publishing."
  else
    for pkg in $PACKAGES; do
      echo "  -> Uploading $pkg..."
      npx ovsx publish "$pkg" -p "$OVSX_PAT" --skip-duplicate
    done
    echo "  -> Open VSX Registry publish complete."
  fi
fi

echo ""
echo "========================================="
echo "  Publish Pipeline Complete!             "
echo "========================================="
