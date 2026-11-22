#!/bin/sh
set -eu

# VS Music - Build & Package Script
# Usage: sh scripts/build.sh [all|linux|win] [--no-lint] [--no-clean]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="all"
DO_LINT=1
CLEAN=1

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    linux|linux-x64)
      TARGET="linux"
      ;;
    win|win32|win32-x64)
      TARGET="win"
      ;;
    all)
      TARGET="all"
      ;;
    --no-lint)
      DO_LINT=0
      ;;
    --no-clean)
      CLEAN=0
      ;;
    -h|--help)
      echo "Usage: $0 [all|linux|win] [--no-lint] [--no-clean]"
      echo ""
      echo "Targets:"
      echo "  all       Build and package for both Linux (linux-x64) and Windows (win32-x64)"
      echo "  linux     Build and package for Linux (linux-x64)"
      echo "  win       Build and package for Windows (win32-x64)"
      echo ""
      echo "Options:"
      echo "  --no-lint   Skip running ESLint"
      echo "  --no-clean  Preserve existing .vsix files"
      exit 0
      ;;
  esac
done

# Detect package runner: bun or npm
if command -v bun >/dev/null 2>&1; then
  RUNNER="bun run"
else
  RUNNER="npm run"
fi

echo "========================================="
echo "  VS Music Extension - Build Pipeline    "
echo "  Target: $TARGET | Runner: $RUNNER       "
echo "========================================="

# Clean stale packages if requested
if [ "$CLEAN" -eq 1 ]; then
  echo "==> Cleaning old .vsix packages..."
  case "$TARGET" in
    linux)
      rm -f music-linux-x64-*.vsix
      ;;
    win)
      rm -f music-win32-x64-*.vsix
      ;;
    all)
      rm -f music-linux-x64-*.vsix music-win32-x64-*.vsix
      ;;
  esac
fi

# Run ESLint
if [ "$DO_LINT" -eq 1 ]; then
  echo "==> [1/3] Running ESLint..."
  $RUNNER lint
fi

build_linux() {
  echo "==> Building & packaging Linux target (linux-x64)..."
  $RUNNER package:linux
}

build_win() {
  echo "==> Checking Windows helper binary..."
  if [ ! -f "src/windows/QuazaarMedia.exe" ]; then
    echo "ERROR: src/windows/QuazaarMedia.exe not found!" >&2
    echo "Ensure QuazaarMedia.exe is present in src/windows/ before packaging." >&2
    exit 1
  fi
  echo "==> Building & packaging Windows target (win32-x64)..."
  $RUNNER package:win
}

case "$TARGET" in
  linux)
    build_linux
    ;;
  win)
    build_win
    ;;
  all)
    build_linux
    build_win
    ;;
  *)
    echo "ERROR: Unknown target: $TARGET" >&2
    exit 1
    ;;
esac

echo ""
echo "========================================="
echo "  Build Finished Successfully!           "
echo "========================================="
ls -lh music-*-*.vsix 2>/dev/null || true
