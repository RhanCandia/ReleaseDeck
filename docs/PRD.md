# Product Requirements Document (PRD)
## GitHub Release Downloader & Package Manager (Decky Plugin for Steam Deck)

**Document Version:** 0.1.0  
**Target Platform:** SteamOS (Steam Deck - Gaming Mode & Desktop Mode)  
**Plugin Framework:** Decky Loader (React 19 Frontend + Python 3 Asyncio Backend)

---

## 1. Executive Summary & Objective

### 1.1 Problem Statement
On the Steam Deck, open-source games, emulators, ports, and standalone utilities are frequently hosted on GitHub Releases. Managing their lifecycle in **Gaming Mode** is cumbersome:
1. **Initial Installation**: Requires switching to Desktop Mode, downloading archives via browser, extracting them, and setting `chmod +x`.
2. **Update Tracking & Upgrades**: Users have no visibility in Gaming Mode when their installed packages become outdated, and upgrading requires repeating the entire manual Desktop Mode procedure.
3. **Package Management**: No centralized interface exists in the Quick Access Menu (`...` button) to inspect installed tools, check versions, update, or uninstall them.

### 1.2 Objective
Create a lightweight **Decky Loader Plugin** that enables users to:
1. **Discover & Download**: Search/input GitHub repositories, select versions/assets, and download/extract them directly to a dedicated directory on the Steam Deck (`~/Applications/<PackageName>/`).
2. **Manage & Inspect**: View all installed packages, their installed versions, disk usage, and installation paths directly within the Quick Access Menu.
3. **Detect Updates & 1-Click Upgrade**: Automatically check installed packages against the latest GitHub releases and provide one-click updates directly in Gaming Mode.

---

## 2. Scope & Target Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Decky Quick Access Menu (Gaming Mode)                     │
│                                                                              │
│   ┌───────────────────────────────┐     ┌────────────────────────────────┐   │
│   │     [📥 Download Tab]         │     │     [📦 Installed Tab]         │   │
│   │                               │     │                                │   │
│   │ • Enter owner/repo            │     │ • List installed packages      │   │
│   │ • Browse releases & tags      │     │ • Show current vs latest ver   │   │
│   │ • Select package asset        │     │ • "Update Available" badge     │   │
│   │ • Stream download + extract   │     │ • [Update] [Reinstall] [Delete]│   │
│   └──────────────┬────────────────┘     └───────────────┬────────────────┘   │
└──────────────────┼──────────────────────────────────────┼────────────────────┘
                   ▼                                      ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │  Python Backend (main.py) + Installed Packages Database (JSON)           │
    │  Target: ~/Applications/<PackageName>/                                   │
    └──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 In Scope (v0.1.0 MVP)

#### A. Download & Installation Workflow
- **Repository Input & Catalog**: Direct write-in for any public `<owner>/<repo>` + pinned favorite repositories.
- **Version & Asset Selection**: Browse release tags, view changelogs, and choose specific assets (`.tar.gz`, `.zip`, `.AppImage`).
- **Async Streaming Downloader**: Background downloading with live progress and speed reporting.
- **Decompression & Permissions**: Extract to `~/Applications/<PackageName>/` and apply `chmod +x` to binaries.

#### B. Installed Package Management & Lifecycle
- **Installed Packages View**: A dedicated tab in the QAM listing all packages installed via the plugin.
- **Package Inspection**: View installed version tag, install date, folder size, and executable paths.
- **Uninstall / Remove**: One-click deletion of the package folder and removal from the local database.

#### C. Update Detection & 1-Click Upgrades
- **Version Comparison**: Compares the local `installed_version` tag with the latest GitHub release tag.
- **Update Indicators**: Displays an "Update Available" badge with the new version tag and release notes snippet.
- **1-Click Upgrade**: Automatically downloads the latest corresponding platform asset, updates the installation, and refreshes tracking metadata.

---

## 3. System Architecture & Tech Stack

### 3.1 Architecture Overview

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, `@decky/ui`, `@decky/api` | Renders QAM tabbed interface (Download vs. Installed), handles user inputs, modals, and progress bars. |
| **Backend** | Python 3, `asyncio`, `aiohttp` / `urllib`, `tarfile`, `zipfile`, `shutil` | Queries GitHub API, handles downloads, unpacks archives, checks for updates, manages file deletions. |
| **Installed Database** | JSON (`decky.DECKY_SETTINGS_DIR/packages.json`) | Tracks installed packages: repository, installed version, last updated date, install path, asset name pattern. |
| **Target Directory** | `~/Applications/<PackageName>/` (Default) | Location where downloaded packages are stored and executed. |

---

## 4. Detailed Functional Requirements

### FR-1: Repository Input & Release Discovery
- **FR-1.1**: The user can input any public GitHub repository (`owner/repo`).
- **FR-1.2**: The backend fetches all releases from `https://api.github.com/repos/{owner}/{repo}/releases`.
- **FR-1.3**: The UI displays release tags, publication dates, pre-release indicators, and changelogs.

### FR-2: Asset Selection & Installation Engine
- **FR-2.1**: The UI lists all downloadable assets for the chosen release, auto-highlighting Linux-compatible files (`.tar.gz`, `.zip`, `.AppImage`).
- **FR-2.2**: The backend downloads the archive asynchronously with live progress reporting (percent, speed, bytes).
- **FR-2.3**: The backend unpacks the archive into `~/Applications/<PackageName>/` (or custom path) and sets `0o755` executable permissions.
- **FR-2.4**: Upon successful installation, the package is registered in `packages.json`.

### FR-3: Installed Package Management
- **FR-3.1**: The "Installed" tab lists all registered packages with:
  - Package Name & Repository link
  - Installed version tag & installation date
  - On-disk folder path and computed disk footprint
- **FR-3.2**: **Uninstall Action**: Prompts confirmation and removes the package folder and entry from `packages.json`.
- **FR-3.3**: **Reinstall / Switch Version**: Opens the release selector to switch to any older or newer version.

### FR-4: Update Checking & 1-Click Upgrade
- **FR-4.1**: **Automatic/Manual Check**: Checks GitHub's `/releases/latest` endpoint for all installed packages on tab open or when clicking "Check All".
- **FR-4.2**: **Update Badge**: Flags packages where `latest_tag != installed_tag` with a prominent badge.
- **FR-4.3**: **Smart Asset Matching for Upgrades**: Automatically identifies the asset filename matching the previously installed asset pattern (e.g., if `linux-x64.tar.gz` was installed previously, it automatically selects the new version's `linux-x64.tar.gz`).
- **FR-4.4**: **Safe In-Place Upgrade**: Downloads the new package, extracts over/replaces the existing installation, updates `packages.json`, and preserves user config files.

### FR-5: Settings & Customization
- **FR-5.1**: Optional GitHub Personal Access Token field in settings to prevent rate-limit throttling.
- **FR-5.2**: Default installation directory configuration (e.g. internal SSD vs MicroSD card).

---

## 5. Data Schema (`packages.json`)

```json
{
  "packages": [
    {
      "id": "sirdiabo-githublauncher",
      "name": "GithubLauncher",
      "repository": "SirDiabo/GithubLauncher",
      "installedVersion": "v1.7.0",
      "latestVersion": "v1.7.0",
      "hasUpdate": false,
      "installedAsset": "GithubLauncher-Linux-x64.tar.gz",
      "installPath": "/home/deck/Applications/GithubLauncher",
      "installedAt": "2026-08-17T12:00:00Z",
      "sizeBytes": 44149760
    }
  ]
}
```
