import {
  Focusable,
  DialogButton,
} from "@decky/ui";
import {
  definePlugin,
  addEventListener,
  removeEventListener,
} from "@decky/api";
import { useState, useEffect } from "react";
import { FaGithub, FaDownload, FaBox, FaCog } from "react-icons/fa";
import { Api } from "./api";
import { DownloadProgress, InstalledPackage, PluginSettings } from "./types";
import { DownloadTab } from "./components/DownloadTab";
import { InstalledTab } from "./components/InstalledTab";
import { SettingsTab } from "./components/SettingsTab";

type TabKey = "apps" | "download" | "settings";

function ReleaseDeckContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("apps");
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [isLoadingInstalled, setIsLoadingInstalled] = useState<boolean>(false);
  const [settings, setSettings] = useState<PluginSettings | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const refreshInstalled = async () => {
    setIsLoadingInstalled(true);
    try {
      const pkgs = await Api.getInstalledPackages();
      setInstalledPackages(pkgs);
    } catch (e) {
      console.error("Failed to load packages:", e);
    } finally {
      setIsLoadingInstalled(false);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await Api.getSettings();
      setSettings(s);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  useEffect(() => {
    // Initial mount: load packages and pick appropriate default tab
    (async () => {
      try {
        const pkgs = await Api.getInstalledPackages();
        setInstalledPackages(pkgs);
        if (pkgs.length === 0) {
          setActiveTab("download");
        }
      } catch (e) {
        console.error("Failed to load initial packages:", e);
      }
    })();
    loadSettings();

    const progressListener = addEventListener<[progress: DownloadProgress]>(
      "download_progress",
      (progress) => {
        if (progress) {
          setDownloadProgress(progress);
          if (progress.status === "complete") {
            refreshInstalled();
          }
        }
      }
    );

    return () => {
      removeEventListener("download_progress", progressListener);
    };
  }, []);

  // Continuous polling while download/extraction is active
  useEffect(() => {
    const isOngoing = downloadProgress && (downloadProgress.status === "downloading" || downloadProgress.status === "extracting");
    if (!isOngoing) return;

    const interval = setInterval(async () => {
      try {
        const status = await Api.getDownloadStatus();
        if (status) {
          setDownloadProgress(status);
          if (status.status === "complete") {
            refreshInstalled();
          }
        }
      } catch (e) {
        // ignore poll errors
      }
    }, 250);

    return () => clearInterval(interval);
  }, [downloadProgress?.status]);

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }

        /* Segmented Tab Bar Container */
        .rd-segmented-bar {
          display: flex !important;
          align-items: center !important;
          background: rgba(0, 0, 0, 0.45) !important;
          border: 1px solid rgba(255, 255, 255, 0.09) !important;
          border-radius: 8px !important;
          padding: 3px !important;
          gap: 3px !important;
          margin-bottom: 12px !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Individual Tab Pill */
        .rd-tab-pill {
          flex: 1 !important;
          min-width: 0 !important;
          height: 32px !important;
          padding: 0 4px !important;
          border-radius: 6px !important;
          border: 1px solid transparent !important;
          background: transparent !important;
          color: #9aa4af !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
          outline: none !important;
          box-sizing: border-box !important;
        }

        .rd-tab-pill * {
          color: inherit !important;
          fill: currentColor !important;
        }

        .rd-tab-pill-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        /* Active Tab (Selected, not focused) */
        .rd-tab-pill.rd-tab-active {
          background: rgba(26, 159, 255, 0.28) !important;
          border: 1px solid rgba(26, 159, 255, 0.55) !important;
          color: #ffffff !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25) !important;
        }

        /* Hover */
        .rd-tab-pill:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }

        .rd-tab-pill.rd-tab-active:hover {
          background: rgba(26, 159, 255, 0.42) !important;
          color: #ffffff !important;
        }

        /* Gamepad Focus State */
        .rd-tab-pill:focus,
        .rd-tab-pill:focus-visible,
        .rd-tab-pill:focus-within,
        .rd-tab-pill.gpfocus {
          background: linear-gradient(135deg, #1a9fff 0%, #0078d7 100%) !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px #ffffff, 0 3px 10px rgba(26, 159, 255, 0.6) !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          z-index: 2;
        }

        .rd-tab-pill:focus *,
        .rd-tab-pill:focus-visible *,
        .rd-tab-pill:focus-within *,
        .rd-tab-pill.gpfocus * {
          color: #ffffff !important;
          fill: #ffffff !important;
        }

        /* Counter Badge */
        .rd-tab-badge {
          background: rgba(255, 255, 255, 0.12);
          color: inherit;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 10px;
          line-height: 1;
        }

        .rd-tab-active .rd-tab-badge {
          background: rgba(26, 159, 255, 0.55);
          color: #ffffff;
        }

        .rd-tab-pill:focus .rd-tab-badge,
        .rd-tab-pill.gpfocus .rd-tab-badge {
          background: rgba(0, 0, 0, 0.35);
          color: #ffffff;
        }

        /* Card 3-Action Buttons (Launch, Update, Delete) */
        .rd-card-btn {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: #dbe4ef !important;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .rd-card-btn * {
          color: inherit !important;
          fill: currentColor !important;
        }
        .rd-card-btn-launch {
          background-color: rgba(46, 204, 113, 0.15) !important;
          border-color: rgba(46, 204, 113, 0.3) !important;
          color: #a3e9c0 !important;
        }
        .rd-card-btn-installed {
          background-color: rgba(46, 204, 113, 0.12) !important;
          border-color: rgba(46, 204, 113, 0.3) !important;
          color: #a3e9c0 !important;
          opacity: 0.9;
        }
        .rd-card-btn-update.rd-update-available {
          background-color: rgba(245, 159, 0, 0.25) !important;
          border-color: #f59f00 !important;
          color: #ffd43b !important;
        }
        .rd-card-btn-delete.rd-confirm-delete {
          background-color: rgba(255, 75, 75, 0.35) !important;
          border-color: #ff4b4b !important;
          color: #ff8787 !important;
        }
        .rd-card-btn:focus,
        .rd-card-btn:focus-visible,
        .rd-card-btn:focus-within,
        .rd-card-btn.gpfocus,
        .rd-card-btn:hover {
          background-color: #1a9fff !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px #ffffff, 0 0 8px rgba(26, 159, 255, 0.8) !important;
          color: #ffffff !important;
          outline: none !important;
        }
        .rd-card-btn:focus *,
        .rd-card-btn:focus-visible *,
        .rd-card-btn:focus-within *,
        .rd-card-btn.gpfocus *,
        .rd-card-btn:hover * {
          color: #ffffff !important;
          fill: #ffffff !important;
        }

        /* Download Tab Breadcrumb Stepper */
        .rd-breadcrumb-bar {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-size: 11px !important;
          cursor: pointer !important;
          transition: background-color 0.15s ease, border-color 0.15s ease !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .rd-breadcrumb-bar:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .rd-breadcrumb-bar:focus,
        .rd-breadcrumb-bar:focus-visible,
        .rd-breadcrumb-bar:focus-within,
        .rd-breadcrumb-bar.gpfocus {
          background: #1a9fff !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px #ffffff, 0 0 8px rgba(26, 159, 255, 0.8) !important;
          color: #ffffff !important;
          outline: none !important;
        }
        .rd-breadcrumb-bar:focus *,
        .rd-breadcrumb-bar:focus-visible *,
        .rd-breadcrumb-bar:focus-within *,
        .rd-breadcrumb-bar.gpfocus * {
          color: #ffffff !important;
          fill: #ffffff !important;
        }

        /* Generic Interactive Card Item (Repos, Versions) */
        .rd-card-item {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 6px !important;
          padding: 8px 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 8px !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
          width: 100% !important;
          box-sizing: border-box !important;
          outline: none !important;
        }
        .rd-card-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        .rd-card-item:focus,
        .rd-card-item:focus-visible,
        .rd-card-item:focus-within,
        .rd-card-item.gpfocus {
          background: #1a9fff !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px #ffffff, 0 0 10px rgba(26, 159, 255, 0.8) !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          outline: none !important;
        }
        .rd-card-item:focus *,
        .rd-card-item:focus-visible *,
        .rd-card-item:focus-within *,
        .rd-card-item.gpfocus * {
          color: #ffffff !important;
          fill: #ffffff !important;
        }

        /* Asset Package Selection Card */
        .rd-asset-card {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 6px !important;
          padding: 8px 10px !important;
          display: flex !important;
          align-items: flex-start !important;
          gap: 8px !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
          width: 100% !important;
          box-sizing: border-box !important;
          outline: none !important;
        }
        .rd-asset-card.selected {
          background: rgba(26, 159, 255, 0.18) !important;
          border-color: #1a9fff !important;
        }
        .rd-asset-card:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .rd-asset-card:focus,
        .rd-asset-card:focus-visible,
        .rd-asset-card:focus-within,
        .rd-asset-card.gpfocus {
          background: #1a9fff !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px #ffffff, 0 0 10px rgba(26, 159, 255, 0.8) !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          outline: none !important;
        }
        .rd-asset-card:focus *,
        .rd-asset-card:focus-visible *,
        .rd-asset-card:focus-within *,
        .rd-asset-card.gpfocus * {
          color: #ffffff !important;
          fill: #ffffff !important;
        }
      `}</style>

      {/* Segmented Top Tab Bar */}
      <Focusable
        flow-children="horizontal"
        className="rd-segmented-bar"
      >
        <DialogButton
          className={`rd-tab-pill ${activeTab === "apps" ? "rd-tab-active" : ""}`}
          onClick={() => setActiveTab("apps")}
        >
          <div className="rd-tab-pill-inner">
            <FaBox style={{ flexShrink: 0 }} />
            <span>Apps</span>
            {installedPackages.length > 0 && (
              <span className="rd-tab-badge">{installedPackages.length}</span>
            )}
          </div>
        </DialogButton>

        <DialogButton
          className={`rd-tab-pill ${activeTab === "download" ? "rd-tab-active" : ""}`}
          onClick={() => setActiveTab("download")}
        >
          <div className="rd-tab-pill-inner">
            <FaDownload style={{ flexShrink: 0 }} />
            <span>Download</span>
          </div>
        </DialogButton>

        <DialogButton
          className={`rd-tab-pill ${activeTab === "settings" ? "rd-tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <div className="rd-tab-pill-inner">
            <FaCog style={{ flexShrink: 0 }} />
            <span>Settings</span>
          </div>
        </DialogButton>
      </Focusable>

      {/* Tab Content */}
      {activeTab === "download" && (
        <DownloadTab
          settings={settings}
          downloadProgress={downloadProgress}
          installedPackages={installedPackages}
          onDownloadStarted={() => {}}
          onInstalledRefresh={refreshInstalled}
          onNavigateToSettings={() => setActiveTab("settings")}
          onNavigateToApps={() => setActiveTab("apps")}
        />
      )}

      {activeTab === "apps" && (
        <InstalledTab
          packages={installedPackages}
          isLoading={isLoadingInstalled}
          onRefresh={refreshInstalled}
          onNavigateToDownload={() => setActiveTab("download")}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          settings={settings}
          onSettingsSaved={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}

export default definePlugin(() => {
  return {
    name: "ReleaseDeck",
    icon: <FaGithub />,
    content: <ReleaseDeckContent />,
  };
});
