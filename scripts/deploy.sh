#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Defaults
DECK_IP="${DECK_IP:-}"
DECK_USER="${DECK_USER:-deck}"
DECK_PORT="${DECK_PORT:-22}"
REMOTE_PLUGIN_DIR="~/homebrew/plugins/ReleaseDeck"

# Parse CLI arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --deck-ip|-i)
      DECK_IP="$2"
      shift 2
      ;;
    --user|-u)
      DECK_USER="$2"
      shift 2
      ;;
    --port|-p)
      DECK_PORT="$2"
      shift 2
      ;;
    --help|-h)
      echo "ReleaseDeck Deployment Script"
      echo ""
      echo "Usage: pnpm run deploy -- [options]"
      echo ""
      echo "Options:"
      echo "  -i, --deck-ip <ip>    Steam Deck IP address or hostname (e.g. 192.168.1.50 or steamdeck)"
      echo "  -u, --user <user>     SSH username on Steam Deck (default: deck)"
      echo "  -p, --port <port>     SSH port (default: 22)"
      echo "  -h, --help            Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  DECK_IP, DECK_USER, DECK_PORT"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      exit 1
      ;;
  esac
done

if [ -z "$DECK_IP" ]; then
    echo -e "${YELLOW}Steam Deck IP not specified.${NC}"
    read -rp "Enter Steam Deck IP address (or hostname): " DECK_IP
    if [ -z "$DECK_IP" ]; then
        echo -e "${RED}Error: Steam Deck IP is required for deployment.${NC}"
        exit 1
    fi
fi

PNPM_CMD="pnpm"
if ! command -v pnpm &>/dev/null; then
    PNPM_CMD="npx -y pnpm"
fi

echo -e "${CYAN}==> [1/4] Building ReleaseDeck bundle...${NC}"
cd "$ROOT_DIR"
$PNPM_CMD run type-check
$PNPM_CMD run build

echo -e "${CYAN}==> [2/4] Testing SSH connectivity to ${DECK_USER}@${DECK_IP}:${DECK_PORT}...${NC}"
if ! ssh -p "$DECK_PORT" -o ConnectTimeout=5 -o BatchMode=no "${DECK_USER}@${DECK_IP}" "mkdir -p ${REMOTE_PLUGIN_DIR}"; then
    echo -e "${RED}Failed to connect to Steam Deck at ${DECK_IP}.${NC}"
    echo -e "Make sure SSH is enabled on your Steam Deck (Desktop Mode -> System Settings -> SSH or 'sudo systemctl enable --now sshd')."
    exit 1
fi

echo -e "${CYAN}==> [3/4] Syncing plugin files to Steam Deck (${REMOTE_PLUGIN_DIR})...${NC}"
ssh -p "$DECK_PORT" -o BatchMode=yes "${DECK_USER}@${DECK_IP}" "mkdir -p ${REMOTE_PLUGIN_DIR} && rm -f ${REMOTE_PLUGIN_DIR}/plugin.json" 2>/dev/null || true
if command -v rsync >/dev/null 2>&1; then
    rsync -avz -e "ssh -p ${DECK_PORT}" \
        --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        --exclude '__pycache__' \
        --exclude 'tests' \
        --exclude '.vscode' \
        --exclude 'build' \
        --exclude '*.zip' \
        "$ROOT_DIR/" "${DECK_USER}@${DECK_IP}:${REMOTE_PLUGIN_DIR}/"
else
    echo -e "${YELLOW}rsync not found locally, falling back to scp...${NC}"
    scp -P "$DECK_PORT" -r \
        "$ROOT_DIR/dist" \
        "$ROOT_DIR/main.py" \
        "$ROOT_DIR/backend" \
        "$ROOT_DIR/plugin.json" \
        "$ROOT_DIR/package.json" \
        "$ROOT_DIR/README.md" \
        "$ROOT_DIR/LICENSE" \
        "${DECK_USER}@${DECK_IP}:${REMOTE_PLUGIN_DIR}/"
fi

echo -e "${CYAN}==> [4/4] Reloading ReleaseDeck on Steam Deck...${NC}"
ssh -p "$DECK_PORT" "${DECK_USER}@${DECK_IP}" "pkill -f 'ReleaseDeck/main.py' 2>/dev/null || true; sudo systemctl restart plugin_loader 2>/dev/null || true" || true

echo -e "${GREEN}✓ ReleaseDeck successfully deployed to your Steam Deck!${NC}"
echo -e "Open the Quick Access Menu (${CYAN}...${NC} button) in Gaming Mode to see ReleaseDeck."
