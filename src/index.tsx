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

  // Load installed packages and settings on mount
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

    // Listen to download progress events from the Python backend
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
    <div style={{ padding: "0 4px" }}>
      {/* Gamepad Focusable Top Tab Bar */}
      <Focusable
        flow-children="horizontal"
        style={{
          display: "flex",
          gap: "6px",
          width: "100%",
          marginBottom: "12px",
        }}
      >
        <DialogButton
          onClick={() => setActiveTab("installed")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "installed" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
            border: activeTab === "installed" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
            padding: "8px 4px",
            fontSize: "12px",
            height: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <FaBox /> Installed {installedPackages.length > 0 ? `(${installedPackages.length})` : ""}
          </div>
        </DialogButton>

        <DialogButton
          onClick={() => setActiveTab("download")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "download" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
            border: activeTab === "download" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
            padding: "8px 4px",
            fontSize: "12px",
            height: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <FaDownload /> Download
          </div>
        </DialogButton>

        <DialogButton
          onClick={() => setActiveTab("settings")}
          style={{
            width: "42px",
            minWidth: "42px",
            backgroundColor: activeTab === "settings" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
            border: activeTab === "settings" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
            padding: "8px",
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
