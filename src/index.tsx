import {
  PanelSection,
  PanelSectionRow,
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

type TabKey = "download" | "installed" | "settings";

function ReleaseDeckContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("installed");
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
      // If we have no packages installed yet, default tab to download
      if (pkgs.length === 0 && activeTab === "installed") {
        setActiveTab("download");
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
    <div>
      {/* Top Tab Bar Navigation */}
      <PanelSection>
        <PanelSectionRow>
          <div
            style={{
              display: "flex",
              gap: "4px",
              width: "100%",
              backgroundColor: "rgba(0,0,0,0.3)",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <button
              onClick={() => setActiveTab("installed")}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: activeTab === "installed" ? "#1a9fff" : "transparent",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: activeTab === "installed" ? "bold" : "normal",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <FaBox /> Installed {installedPackages.length > 0 && `(${installedPackages.length})`}
            </button>

            <button
              onClick={() => setActiveTab("download")}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: activeTab === "download" ? "#1a9fff" : "transparent",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: activeTab === "download" ? "bold" : "normal",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <FaDownload /> Download
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: activeTab === "settings" ? "#1a9fff" : "transparent",
                color: "#ffffff",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaCog />
            </button>
          </div>
        </PanelSectionRow>
      </PanelSection>

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
