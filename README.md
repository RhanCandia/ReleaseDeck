# Release Deck

<div align="center">
  <p><strong>GitHub Release Downloader & Game Package Manager for Steam Deck (SteamOS Gaming Mode)</strong></p>
  <p>
    <a href="https://github.com/RhanCandia/ReleaseDeck/releases"><img src="https://img.shields.io/github/v/release/RhanCandia/ReleaseDeck?color=1a9fff&style=flat-square" alt="GitHub release" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-BSD--3--Clause-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://deckbrew.xyz"><img src="https://img.shields.io/badge/Decky%20Loader-Plugin-orange?style=flat-square" alt="Decky Plugin" /></a>
  </p>
</div>

---

## 🌟 Overview

**Release Deck** is a Decky Loader plugin for Valve's Steam Deck that empowers you to discover, download, install, update, and manage GitHub-hosted game ports, decompilations, emulators, and homebrew utilities directly from the **Quick Access Menu (`...` button)** while staying fully in **Gaming Mode**.

Say goodbye to constantly switching to Desktop Mode just to download a `.tar.gz` or `.zip`, unpack game archives, set execute permissions (`chmod +x`), or configure Non-Steam shortcuts!

---

## ✨ Key Features

### 🎮 **1. Apps Tab (Installed Packages Manager)**
* **Collapsible App Cards**: Clean, compact cards that start collapsed by default to comfortably browse long libraries of installed software.
* **Executable Selector**: Automatically discovers all runnable binaries, AppImages, shell scripts, and `.exe` files inside the game folder with a simple cycling selector.
* **1-Click "Add to Steam"**: Creates Non-Steam Game shortcuts directly in your Steam Library with clean app naming.
* **In-Place Updates**: Compares your installed version against the latest GitHub release tags and updates in-place with a single button.
* **Two-Step Safe Delete**: Cleanly removes installed files and database records with confirmation safeguards.

### 📥 **2. Download Tab (Release Browser & Installer)**
* **Repository & Versions Drill-Down**: Seamless 3-step navigation (`Repositories` ➔ `Releases / Tags` ➔ `Assets`).
* **Interactive Release Notes**: Expand and read markdown changelogs directly in the Quick Access Menu.
* **Smart SteamOS Matching**: Highlights recommended Linux packages (`.tar.gz`, `.AppImage`, `x86_64`) with badges.
* **Windows `.exe` & Port Compatibility**: Supports Windows portable releases and standalone `.exe` binaries, ready for Steam Play (Proton).
* **Live Background Downloader**: Non-blocking download progress with real-time download speed (MB/s), byte counter, and progress bar.
* **Gamepad Focus Transitions**: Automatically scrolls to the top and focuses action buttons when downloading or completing installation.

### ⚙️ **3. Settings Tab (Configuration & Personalization)**
* **Tracked Repositories**: Easily add, pin, and remove GitHub repositories with auto-suggestions for popular open-source game ports (e.g. *SymphonyRecomp*, *HarvestMoon64Recomp*, *Render96*, *Ship of Harkinian*).
* **GitHub Personal Access Token (PAT)**: Optional token support to bypass GitHub API rate limits.
* **Custom Installation Directory**: Configurable target folder (defaults to `~/Applications`).
* **Cache Management**: Instant release cache clearing.

---

## 🏗️ Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Steam Deck UI (Chromium Embedded Framework)                          │
│  React 19 + TypeScript + @decky/ui + @decky/api                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC (callable / emit / events)
┌───────────────────────────────────▼────────────────────────────────────┐
│  SteamOS Python Backend (main.py)                                     │
│  Asyncio + GitHub REST API Client + Archive Extractor + Steam IPC     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
 [ ~/Applications/<AppName>/ ]                         [ ~/.config/ReleaseDeck/ ]
 (AppImages, Binaries, Scripts, Assets)                (packages.json, settings.json)
```

---

## 🛠️ Development & Building

### Prerequisites
* **Node.js**: v20+
* **Package Manager**: `npm` or `pnpm`
* **Python**: 3.10+
* **Steam Deck** with SSH enabled (for hardware deployment)

### 1. Clone the Repository
```bash
git clone https://github.com/RhanCandia/ReleaseDeck.git
cd ReleaseDeck
```

### 2. Install Dependencies & Build
```bash
# Install frontend dependencies
npm install

# Type-check TypeScript codebase
npm run type-check

# Compile production bundle with Rollup
npm run build
```

### 3. Run Automated Tests
```bash
# Run unit tests and end-to-end simulation harness
npm test
```

---

## 🚀 Deployment to Steam Deck

Release Deck includes a one-command deployment script:

```bash
# Deploy to Steam Deck over local network via SSH
bash scripts/deploy.sh -i <STEAM_DECK_IP>
```

> **Note**: Ensure SSH is enabled on your Steam Deck (*Desktop Mode -> System Settings -> Remote Access / SSH* or `sudo systemctl enable --now sshd`).

---

## 📄 License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](LICENSE) file for details.
