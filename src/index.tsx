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
  const [activeTab, setActiveTab] = useState<TabKey>("download");
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [isLoadingInstalled, setIsLoadingInstalled] = useState<boolean>(false);
  const [settings, setSettings] = useState<PluginSettings | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const refreshInstalled = async () => {
    setIsLoadingInstalled(true);
    try {
      const pkgs = await Api.getInstalledPackages();
      setInstalledPackages(pkgs);
      if (pkgs.length > 0 && activeTab !== "settings") {
        setActiveTab("apps");
      }
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
    refreshInstalled();
    loadSettings();

    const progressListener = addEventListener<[progress: DownloadProgress]>(
      "download_progress",
      (progress) => {
        setDownloadProgress(progress);
        if (progress.status === "complete") {
          refreshInstalled();
        }
      }
    );

    return () => {
      removeEventListener("download_progress", progressListener);
    };
  }, []);

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
        .rd-tab-btn {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #c0c6ce !important;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
          cursor: pointer;
        }
        .rd-tab-btn * {
          color: inherit !important;
          fill: currentColor !important;
        }
        .rd-tab-btn.rd-tab-active {
          background-color: rgba(26, 159, 255, 0.4) !important;
          border: 1px solid #1a9fff !important;
          color: #ffffff !important;
        }
        .rd-tab-btn:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
        }
        .rd-tab-btn.rd-tab-active:hover {
          background-color: rgba(26, 159, 255, 0.55) !important;
          border-color: #1a9fff !important;
          color: #ffffff !important;
        }
        .rd-tab-btn:focus,
        .rd-tab-btn:focus-visible,
        .rd-tab-btn:focus-within,
        .rd-tab-btn.gpfocus {
          background-color: #1a9fff !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px #ffffff, 0 0 10px rgba(26, 159, 255, 0.8) !important;
          color: #ffffff !important;
          outline: none !important;
        }
        .rd-tab-btn:focus *,
        .rd-tab-btn:focus-visible *,
        .rd-tab-btn:focus-within *,
        .rd-tab-btn.gpfocus * {
          color: #ffffff !important;
          fill: #ffffff !important;
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
      `}</style>

      {/* Compact QAM Top Tab Bar */}
      <Focusable
        flow-children="horizontal"
        style={{
          display: "flex",
          gap: "4px",
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "10px",
        }}
      >
        <DialogButton
          className={`rd-tab-btn ${activeTab === "apps" ? "rd-tab-active" : ""}`}
          onClick={() => setActiveTab("apps")}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 2px",
            fontSize: "11px",
            height: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <FaBox style={{ flexShrink: 0 }} />
            <span>Apps{installedPackages.length > 0 ? ` (${installedPackages.length})` : ""}</span>
          </div>
        </DialogButton>

        <DialogButton
          className={`rd-tab-btn ${activeTab === "download" ? "rd-tab-active" : ""}`}
          onClick={() => setActiveTab("download")}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 2px",
            fontSize: "11px",
            height: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <FaDownload style={{ flexShrink: 0 }} />
            <span>Download</span>
          </div>
        </DialogButton>

        <DialogButton
          className={`rd-tab-btn ${activeTab === "settings" ? "rd-tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
          style={{
            width: "36px",
            minWidth: "36px",
            flexShrink: 0,
            padding: "6px 0",
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaCog />
        </DialogButton>
      </Focusable>

      {/* Tab Content */}
      {activeTab === "download" && (
        <DownloadTab
          settings={settings}
          downloadProgress={downloadProgress}
          onDownloadStarted={() => {}}
          onInstalledRefresh={refreshInstalled}
          onNavigateToSettings={() => setActiveTab("settings")}
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
