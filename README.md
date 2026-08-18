# Release Deck

<div align="center">
  <p><strong>Universal Git Release Downloader & Game Package Manager for Steam Deck (SteamOS Gaming Mode)</strong></p>
  <p>
    <a href="https://github.com/RhanCandia/ReleaseDeck/releases"><img src="https://img.shields.io/github/v/release/RhanCandia/ReleaseDeck?color=1a9fff&style=flat-square" alt="GitHub release" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-BSD--3--Clause-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://deckbrew.xyz"><img src="https://img.shields.io/badge/Decky%20Loader-Plugin-orange?style=flat-square" alt="Decky Plugin" /></a>
    <a href="https://ko-fi.com/rhncnd"><img src="https://img.shields.io/badge/Ko--fi-Support%20Me-ff5e5b?style=flat-square&logo=ko-fi&logoColor=white" alt="Support on Ko-fi" /></a>
  </p>
  <br />
  <img src="assets/preview.png" alt="Release Deck Banner" width="100%" style="border-radius: 8px;" />
</div>

---

## 🌟 Overview

**Release Deck** is a Decky Loader plugin designed for Steam Deck users to discover, download, install, update, and manage open-source game ports, decompilations, emulators, and homebrew utilities directly from the **Quick Access Menu (`...` button)** in **Gaming Mode**.

Works out-of-the-box with **GitHub by default**, and seamlessly supports **custom-domain Git forges** (Forgejo, Gitea, GitLab, Codeberg, and self-hosted instances).

No more switching back and forth to Desktop Mode just to:
- Download `.tar.gz`, `.zip`, `.tar.xz`, or `.AppImage` releases.
- Extract nested archive folders manually.
- Make files executable (`chmod +x`).
- Manually create and configure Non-Steam game shortcuts.

---

## 📖 End-User Usage Guide

Release Deck is built to be 100% controller-friendly and usable directly from SteamOS Gaming Mode without touching Desktop Mode.

### Step 1: Open Release Deck
1. Press the **Quick Access Menu button (`...`)** on your Steam Deck.
2. Navigate to the **Decky Loader plugin icon** (the plug symbol).
3. Select **Release Deck**.

### Step 2: Track Your Favorite Repositories
1. Switch to the **Settings** tab.
2. Under **Tracked Repositories**, add repositories using either format:
   - **GitHub (Default)**: Type shorthand `owner/repo` (e.g. `shadps4-emu/shadPS4` or `PCSX2/pcsx2`).
   - **Custom Git Forges & Domains**: Paste the full URL or domain (e.g. `https://git.eden-emu.dev/eden-emu/eden`, `https://codeberg.org/forgejo/forgejo`, or `https://gitlab.com/inkscape/inkscape`).
3. Click **Add to Tracked List**. Release Deck automatically detects the forge type, attaches host badges, and saves your configuration.
> 💡 *Optional*: If you download frequently from GitHub, add a **GitHub Personal Access Token (PAT)** in Settings to raise your rate limit to 5,000 requests/hr.

### Step 3: Browse Releases & Download
1. Switch to the **Download** tab.
2. Select any tracked repository to view all published release versions.
3. Select a release version to see the release notes, changelog, and available download packages.
4. Release Deck automatically highlights **Recommended Steam Deck / Linux Packages** (`.AppImage`, `steamdeck`, `.tar.gz`, `x86_64`) with a green badge.
5. Click **Download & Install**. You can watch the real-time download speed and extraction progress.

### Step 4: Add to Steam & Play
1. Once installation is finished, switch to the **Apps** tab.
2. Expand your newly installed game card.
3. Use the **Executable Selector** to pick the main game binary or launcher script (Release Deck automatically scans for all runnable files and sets executable permissions).
4. Click **➕ Add to Steam**. Release Deck creates a Non-Steam Game shortcut in your Steam Library.
5. Launch and play the game directly from your Steam library!

### Step 5: 1-Click Updates
When a developer publishes a new release on GitHub or their custom Git forge:
1. Open the **Apps** tab.
2. If an update is available, the card will display an **Update Available** indicator with the new version tag.
3. Click **⬆️ Update** to download and replace the game files in-place without touching your custom configs or save data.

---

## 🎯 What Can You Install with Release Deck?

Release Deck turns GitHub and custom Git forges into a native game store for your Steam Deck. Here are popular release types and verified repositories:

| Category | Examples & Supported Repositories | Why Release Deck Helps |
| :--- | :--- | :--- |
| **🕹️ Emulators & Standalone Nightlies** | • `https://git.eden-emu.dev/eden-emu/eden` (Nintendo Switch emulator)<br>• `PCSX2/pcsx2` (PlayStation 2)<br>• `shadps4-emu/shadPS4` (PlayStation 4)<br>• `stenzek/duckstation` (PlayStation 1)<br>• `hrydgard/ppsspp` (PSP emulator)<br>• `Lime3DS/Lime3DS` (Nintendo 3DS)<br>• `melonDS-emu/melonDS` (Nintendo DS)<br>• `flyinghead/flycast` (Dreamcast / Arcade) | Stay on cutting-edge nightly or stable releases with instant in-place updates from GitHub or custom-hosted forges. |
| **🎮 Static Recompilations & Decompilations** | • `HarbourMasters/Shipwright` (Ship of Harkinian - Ocarina of Time PC Port)<br>• `HarbourMasters/2ship2harkinian` (2 Ship 2 Harkinian - Majora's Mask PC Port)<br>• `Zelda64Recomp/Zelda64Recomp` (Majora's Mask Recomp)<br>• `open-goal/jak-project` (Jak and Daxter PC Port)<br>• `Rubberduckycooly/Sonic-Mania-Decompilation` (Sonic Mania PC Port)<br>• `alexbatalov/fallout1-ce` (Fallout 1 Community Edition)<br>• `alexbatalov/fallout2-ce` (Fallout 2 Community Edition) | Download standalone native Linux binaries and AppImages with ultra-high framerates and Deck controller support without manual compile or desktop extraction. |
| **🏹 Source Ports & Classic PC Ports** | • `diasurgical/devilutionX` (Diablo 1 + Hellfire)<br>• `ZDoom/gzdoom` (Doom, Heretic, Hexen source port)<br>• `STJr/SRB2` (Sonic Robo Blast 2)<br>• `CorsixTH/CorsixTH` (Theme Hospital engine)<br>• `k4zmu2a/SpaceCadetPinball` (3D Pinball for Windows) | Grab Linux-native packages and play classic PC titles seamlessly on SteamOS. |
| **⚡ Homebrew Utilities & Game Launchers** | • `Heroic-Games-Launcher/HeroicGamesLauncher` (Epic/GOG/Amazon launcher)<br>• `moonlight-stream/moonlight-qt` (Moonlight Game Streaming client)<br>• `streetpea/chiaki-ng` (PlayStation Remote Play)<br>• `DavidoTek/ProtonUp-Qt` (GE-Proton and Wine tool manager) | Manage standalone AppImages and game streaming tools directly within Game Mode. |

> 📌 **Note on Game ROMs / Assets**: For native recompilations and source ports that require original game assets or ROM files, simply drop your game asset files into the game folder (located in `~/Applications/<AppName>/`) once, and updates via Release Deck will preserve them.

---

## ✨ Key Features

### 🌐 **1. Universal Multi-Provider Engine**
* **GitHub by Default**: Zero-friction typing of `owner/repo` automatically targets GitHub.
* **Custom Domain Support**: Full support for Forgejo, Gitea, Codeberg, and GitLab instances (e.g. `https://git.eden-emu.dev/eden-emu/eden`).
* **Auto-Detection & Badging**: Automatically identifies host forges and displays host labels (`[git.eden-emu.dev]`, `[Codeberg]`, `[GitLab]`, `[GitHub]`).

### 🎮 **2. Apps Tab (Installed Packages Manager)**
* **Collapsible App Cards**: Clean, compact cards that start collapsed by default to comfortably browse large libraries of installed software.
* **Executable Selector**: Automatically discovers all runnable binaries, AppImages, shell scripts, and `.exe` files inside the game folder with a simple cycling selector.
* **1-Click "Add to Steam"**: Creates Non-Steam Game shortcuts directly in your Steam Library with clean app naming.
* **In-Place Updates**: Compares your installed version against the latest upstream release tags and updates in-place with a single button.
* **Two-Step Safe Delete**: Cleanly removes installed files and database records with confirmation safeguards.

### 📥 **3. Download Tab (Release Browser & Installer)**
* **Repository & Versions Drill-Down**: Seamless 3-step navigation (`Repositories` ➔ `Releases / Tags` ➔ `Assets`).
* **Interactive Release Notes**: Expand and read markdown changelogs directly in the Quick Access Menu.
* **Smart SteamOS Matching**: Highlights recommended Linux packages (`.tar.gz`, `.AppImage`, `steamdeck`, `x86_64`) with badges.
* **Windows `.exe` & Port Compatibility**: Supports Windows portable releases and standalone `.exe` binaries, ready for Steam Play (Proton).
* **Live Background Downloader**: Non-blocking download progress with real-time download speed (MB/s), byte counter, and progress bar.
* **Gamepad Focus Transitions**: Automatically scrolls to the top and focuses action buttons when downloading or completing installation.

### ⚙️ **4. Settings Tab (Configuration & Personalization)**
* **Tracked Repositories**: Easily add, pin, and remove GitHub and custom-domain repositories.
* **GitHub Personal Access Token (PAT)**: Optional token support to bypass GitHub API rate limits (raises limit to 5,000 requests/hr).
* **Restart Steam Client**: Cleanly restart the Steam client with confirmation to instantly refresh Non-Steam game library shortcuts.
* **Custom Installation Directory**: Configurable target folder (defaults to `~/Applications`).
* **Cache Management**: Instant release cache clearing.

---

## 🏗️ Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Steam Deck UI (Chromium Embedded Framework / Quick Access Menu)       │
│  React 19 + TypeScript + @decky/ui + @decky/api                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC (callable / emit / events)
┌───────────────────────────────────▼────────────────────────────────────┐
│  SteamOS Python Backend (main.py + backend/)                           │
│  Multi-Provider Client (GitHub, Forgejo/Gitea, GitLab) + Extractor     │
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
               ▼                    ▼                    ▼
   [ ~/Applications/<App>/ ]  [ Settings / DB ]    [ Steam Client ]
   - Extracted Binaries       - packages.json      - shortcuts.vdf
   - AppImages & Executables  - settings.json      - steamos-add-to-steam
   - Launch wrapper scripts   (Decky settings dir) - Non-Steam Shortcuts
```

---

## 🛠️ Development & Building

*(For contributors and developers)*

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

### 4. Create Distribution Zip Package
```bash
# Bundle production plugin into ReleaseDeck.zip
npm run package
```

---

## 🚀 Deployment to Steam Deck

Release Deck includes a one-command deployment script to push builds directly to your Steam Deck over Wi-Fi/SSH:

```bash
# Deploy to Steam Deck over local network via SSH
npm run deploy -- -i <STEAM_DECK_IP>

# Alternatively run the script directly:
bash scripts/deploy.sh -i <STEAM_DECK_IP>
```

> **Note**: Ensure SSH is enabled on your Steam Deck (*Desktop Mode -> System Settings -> Remote Access / SSH* or `sudo systemctl enable --now sshd`).

---

## ☕ Support

If you find Release Deck useful and want to support its ongoing development and maintenance, consider buying me a coffee!

<div align="center">
  <a href="https://ko-fi.com/rhncnd">
    <img src="https://storage.ko-fi.com/cdn/kofi3.png?v=3" height="42" alt="Buy Me a Coffee at ko-fi.com" />
  </a>
</div>

---

## 🙏 Acknowledgments & Citations

Release Deck was inspired and guided by the following projects and tools:
- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)
- [Valve SteamOS](https://store.steampowered.com/steamos)
- [Eden Nintendo Switch Emulator](https://git.eden-emu.dev/eden-emu/eden)
- [Ship of Harkinian / Harbour Masters](https://github.com/HarbourMasters/Shipwright)
- [2 Ship 2 Harkinian](https://github.com/HarbourMasters/2ship2harkinian)
- [Zelda 64: Recompiled](https://github.com/Zelda64Recomp/Zelda64Recomp)
