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

type TabKey = "installed" | "download" | "settings";

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
        setActiveTab("installed");
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
          onClick={() => setActiveTab("installed")}
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: activeTab === "installed" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
            border: activeTab === "installed" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
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
            <span>Installed{installedPackages.length > 0 ? ` (${installedPackages.length})` : ""}</span>
          </div>
        </DialogButton>

        <DialogButton
          onClick={() => setActiveTab("download")}
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: activeTab === "download" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
            border: activeTab === "download" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
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
          onClick={() => setActiveTab("settings")}
          style={{
            width: "36px",
            minWidth: "36px",
            flexShrink: 0,
            backgroundColor: activeTab === "settings" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
            border: activeTab === "settings" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
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
        />
      )}

      {activeTab === "installed" && (
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
