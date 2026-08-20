# Product Requirements Document (PRD)
## Side Deck — Universal Non-Steam Sideloading, Game Port & Package Manager (Decky Plugin)

**Document Version:** 0.2.0  
**Target Platform:** SteamOS (Steam Deck - Gaming Mode & Desktop Mode)  
**Plugin Framework:** Decky Loader (React 19 Frontend + Python 3 Asyncio Backend)

---

## 1. Executive Summary & Objective

### 1.1 Problem Statement
On the Steam Deck, open-source games, emulators, ports, indie games, and standalone utilities are frequently distributed as releases across GitHub, itch.io, and custom-domain Git forges (such as Forgejo/Gitea instances like `git.eden-emu.dev`, Codeberg, and GitLab). Managing their lifecycle in **Gaming Mode** is cumbersome:
1. **Initial Installation**: Requires switching to Desktop Mode, downloading archives via browser, extracting them, and setting `chmod +x`.
2. **Update Tracking & Upgrades**: Users have no visibility in Gaming Mode when their installed packages become outdated, and upgrading requires repeating the entire manual Desktop Mode procedure.
3. **Multi-Source Package Management**: No centralized interface exists in the Quick Access Menu (`...` button) to inspect installed tools, check versions across different hosts and platforms, update, or uninstall them.

### 1.2 Objective
Create a lightweight **Decky Loader Plugin** that enables users to:
1. **Discover & Download**: Input GitHub repositories (by default), itch.io game pages (free games), or custom Git forge URLs (Forgejo, Gitea, Codeberg, GitLab), select versions/assets, and download/extract them directly to a dedicated directory on the Steam Deck (`~/Applications/<PackageName>/`).
2. **Manage & Inspect**: View all installed packages, their installed versions, source host origin, disk usage, and installation paths directly within the Quick Access Menu.
3. **Detect Updates & 1-Click Upgrade**: Automatically check installed packages against their upstream release APIs or game endpoints and provide one-click in-place updates directly in Gaming Mode.

---

## 2. Scope & Target Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Decky Quick Access Menu (Gaming Mode)                     │
│                                                                              │
│   ┌───────────────────────────────┐     ┌────────────────────────────────┐   │
│   │     [📥 Download Tab]         │     │     [📦 Installed Tab]         │   │
│   │                               │     │                                │   │
│   │ • Enter owner/repo (GitHub)   │     │ • List installed packages      │   │
│   │ • Paste itch.io game URL      │     │ • Show origin host badge       │   │
│   │ • Or paste custom Git URL     │     │ • Show current vs latest ver   │   │
│   │ • Browse releases & changelog │     │ • "Update Available" badge     │   │
│   │ • Highlight Steam Deck asset  │     │ • [Update] [Add to Steam] [Del]│   │
│   │ • Stream download + extract   │     │ • Custom executable selector   │   │
│   └──────────────┬────────────────┘     └───────────────┬────────────────┘   │
└──────────────────┼──────────────────────────────────────┼────────────────────┘
                   ▼                                      ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │  Multi-Provider Backend (backend/git_providers.py + main.py)             │
    │  Supported: GitHub (default), itch.io (free games), Forgejo, GitLab      │
    │  Target: ~/Applications/<PackageName>/                                   │
    └──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 In Scope

#### A. Multi-Provider Release Discovery & Download
- **Universal Repository & Game Input**: Shorthand `owner/repo` automatically targets GitHub; `*.itch.io/*` targets itch.io free games; full URLs or domain paths target custom Git forges (Forgejo, Gitea, Codeberg, GitLab).
- **Auto-Detection & Badging**: Automatically identifies host forges/platforms and renders host labels with branded icons (GitHub, itch.io, GitLab, Forgejo, Codeberg).
- **Dynamic itch.io CDN Resolution**: Automatically resolves temporary signed Cloudflare R2 / S3 download URLs dynamically on-demand for itch.io free game packages.
- **Version & Asset Selection**: Browse release tags, view changelogs, and choose specific assets (`.tar.gz`, `.zip`, `.tar.xz`, `.AppImage`).
- **Async Streaming Downloader**: Background downloading with live progress and speed reporting.
- **Decompression & Permissions**: Extract to `~/Applications/<PackageName>/` and apply `chmod +x` to binaries.

#### B. Installed Package Management & Lifecycle
- **Installed Packages View**: A dedicated tab in the QAM listing all packages installed via the plugin.
- **Package Inspection**: View installed version tag, origin host, install date, folder size, and executable paths.
- **Steam Shortcut Integration**: Automatic discovery of executables and 1-click Non-Steam Game shortcut creation.
- **Uninstall / Remove**: One-click deletion of the package folder and removal from the local database.

#### C. Update Detection & 1-Click Upgrades
- **Version Comparison**: Compares the local `installed_version` tag with the latest upstream release tag.
- **Update Indicators**: Displays an "Update Available" badge with the new version tag.
- **1-Click Upgrade**: Automatically downloads the latest corresponding platform asset, updates the installation in-place, and refreshes tracking metadata.

---

## 3. System Architecture & Tech Stack

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, `@decky/ui`, `@decky/api` | Renders QAM tabbed interface, handles inputs, modals, provider badges, and progress bars. |
| **Multi-Provider Client** | Python 3, `git_providers.py`, `asyncio`, `urllib` | Queries GitHub, Forgejo/Gitea, and GitLab REST APIs with rate limit detection and SSL fallback. |
| **Downloader & Extractor** | Python 3, `downloader.py`, `tarfile`, `zipfile`, `shutil` | Chunked streaming download with real-time speed metrics, archive extraction, permission tagging, and Zip Slip prevention. |
| **Installed Database** | JSON (`decky.DECKY_SETTINGS_DIR/packages.json`) | Tracks installed packages: repository, origin host, version, install path, asset name pattern. |
| **Target Directory** | `~/Applications/<PackageName>/` (Default) | Location where downloaded packages are stored and executed. |

---

## 4. Functional Requirements

### FR-1: Multi-Provider Release Discovery
- **FR-1.1**: The user can input GitHub shorthand (`owner/repo`) or custom URLs (e.g. `https://git.eden-emu.dev/eden-emu/eden`, `https://codeberg.org/...`, `https://gitlab.com/...`).
- **FR-1.2**: The backend routes requests to GitHub, Forgejo/Gitea, or GitLab API endpoints and normalizes response schemas.
- **FR-1.3**: The UI displays release tags, publication dates, pre-release indicators, and changelogs.

### FR-2: Asset Selection & Installation Engine
- **FR-2.1**: The UI lists all downloadable assets, auto-highlighting Steam Deck / Linux packages (`.AppImage`, `steamdeck`, `.tar.gz`, `x86_64`).
- **FR-2.2**: The backend downloads the archive asynchronously with live progress reporting (percent, speed, bytes).
- **FR-2.3**: The backend unpacks the archive into `~/Applications/<PackageName>/` and sets `0o755` executable permissions.
- **FR-2.4**: Upon installation, the package is registered in `packages.json`.

### FR-3: Steam Shortcut Integration
- **FR-3.1**: Discovers all runnable binaries, shell scripts, AppImages, and `.exe` files in the package folder.
- **FR-3.2**: Creates Non-Steam Game shortcut in Steam Library via `steamos-add-to-steam` / Steam IPC.

### FR-4: Update Checking & 1-Click Upgrade
- **FR-4.1**: Checks upstream release endpoints for all installed packages across all configured hosts.
- **FR-4.2**: Flags packages where `latest_tag != installed_tag` with an update badge.
- **FR-4.3**: Downloads matching asset, extracts over existing installation, and preserves user data.
