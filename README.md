# ReleaseDeck

<div align="center">
  <h3>GitHub Release Downloader & Package Manager for Steam Deck (SteamOS Gaming Mode)</h3>
</div>

---

## 🌟 Overview

**ReleaseDeck** is a Decky Loader plugin for the Steam Deck that enables users to browse, download, manage, and update GitHub-hosted games, ports, utilities, and emulators directly from the **Quick Access Menu (`...` button)** while remaining in **Gaming Mode**.

No more dropping into Desktop Mode just to download a `.tar.gz`, unpack an `.AppImage`, or check for community updates.

---

## ✨ Features

- 🎮 **Native Gaming Mode UI**: Full D-Pad, touch, and controller-friendly interface inside Steam's Quick Access Menu.
- 🔍 **GitHub Release Browser**: Type any `owner/repo` or select from pinned favorites to browse all published releases, pre-releases, and changelogs.
- 🐧 **Smart SteamOS Matching**: Automatically filters and highlights Linux/SteamOS compatible packages (`.tar.gz`, `.zip`, `.AppImage`, `x86_64`).
- ⚡ **Background Async Downloader**: Real-time progress bar, byte counter, and speed indicator without freezing gameplay.
- 📦 **Automated Setup & Permissions**: Automatically decompresses archives into `~/Applications/<PackageName>/` and sets executable flags (`chmod +x` / `0o755`).
- 🔄 **1-Click Updates**: Compares installed packages against GitHub's latest releases and updates them in-place with a single click.
- 🗑 **Package Management**: Inspect disk footprints, view installation paths, and uninstall packages cleanly.
- 🔑 **Rate Limit Mitigation**: Support for GitHub Personal Access Tokens (PAT) to bypass API quotas.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│  Steam Deck UI (Chromium Embedded Framework)           │
│  React 19 + TypeScript + @decky/ui + @decky/api        │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC (callable / emit)
┌──────────────────────────▼─────────────────────────────┐
│  SteamOS Linux Backend (main.py)                       │
│  Python 3 Asyncio + GitHub REST + Archive Extractor    │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
 [ ~/Applications/<pkg>/ ]       [ packages.json Registry ]
```

---

## 🛠️ Development & Building

### Prerequisites
- Node.js 20+ & pnpm
- Python 3.10+

### Build Frontend
```bash
# Install dependencies
pnpm install

# Type-check TypeScript
pnpm run type-check

# Compile production bundle
pnpm run build
```

### Run Automated Tests
```bash
# Run backend unit tests and E2E simulation harness
python3 -m unittest discover -s tests -v
python3 tests/e2e_harness.py
```

---

## 🚀 Deploying to Steam Deck

To deploy directly to your Steam Deck via SSH:

```bash
# Copy plugin files to Decky plugins directory on Steam Deck
rsync -avz --exclude 'node_modules' --exclude '.git' ./ deck@<STEAM_DECK_IP>:~/homebrew/plugins/ReleaseDeck/

# Restart plugin loader
ssh deck@<STEAM_DECK_IP> "sudo systemctl restart plugin_loader"
```

---

## 📄 License
BSD 3-Clause License. See [LICENSE](LICENSE) for details.
