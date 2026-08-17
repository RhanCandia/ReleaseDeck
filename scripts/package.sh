#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PNPM_CMD="pnpm"
if ! command -v pnpm &>/dev/null; then
    PNPM_CMD="npx -y pnpm"
fi

echo "==> Building ReleaseDeck frontend bundle..."
cd "$ROOT_DIR"
$PNPM_CMD run type-check
$PNPM_CMD run build

echo "==> Staging plugin files..."
STAGING_DIR="$ROOT_DIR/build/ReleaseDeck"
rm -rf "$ROOT_DIR/build"
mkdir -p "$STAGING_DIR"

cp -r "$ROOT_DIR/dist" "$STAGING_DIR/"
cp "$ROOT_DIR/main.py" "$STAGING_DIR/"
cp -r "$ROOT_DIR/backend" "$STAGING_DIR/"
cp "$ROOT_DIR/plugin.json" "$STAGING_DIR/"
cp "$ROOT_DIR/package.json" "$STAGING_DIR/"
cp "$ROOT_DIR/README.md" "$STAGING_DIR/"
cp "$ROOT_DIR/LICENSE" "$STAGING_DIR/"
if [ -d "$ROOT_DIR/assets" ]; then
    cp -r "$ROOT_DIR/assets" "$STAGING_DIR/"
fi

echo "==> Creating ReleaseDeck.zip..."
cd "$ROOT_DIR/build"
zip -r "$ROOT_DIR/ReleaseDeck.zip" ReleaseDeck/
cd "$ROOT_DIR"
rm -rf "$ROOT_DIR/build"

echo "✓ Successfully created $ROOT_DIR/ReleaseDeck.zip"
