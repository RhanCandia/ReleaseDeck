import {
  ButtonItem,
  DropdownItem,
  Focusable,
  PanelSection,
  PanelSectionRow,
  ProgressBar,
  Spinner,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect } from "react";
import { FaDownload, FaLinux, FaBan, FaCheckCircle, FaExclamationTriangle, FaCog, FaStar } from "react-icons/fa";
import { Api } from "../api";
import { GitHubRelease, GitHubAsset, DownloadProgress, PluginSettings } from "../types";
import { formatBytes } from "../utils/format";

interface DownloadTabProps {
  settings: PluginSettings | null;
  downloadProgress: DownloadProgress | null;
  onDownloadStarted: () => void;
  onInstalledRefresh: () => void;
  onNavigateToSettings: () => void;
}

export function DownloadTab({
  settings,
  downloadProgress,
  onDownloadStarted,
  onInstalledRefresh,
  onNavigateToSettings,
}: DownloadTabProps) {
  const pinnedRepos = settings?.pinned_repos || [];

  const [selectedRepoIndex, setSelectedRepoIndex] = useState<number>(0);
  const [isLoadingReleases, setIsLoadingReleases] = useState<boolean>(false);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [selectedReleaseIndex, setSelectedReleaseIndex] = useState<number>(0);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);

  const currentRepoName = pinnedRepos[selectedRepoIndex] || "";

  // Auto-fetch releases when selected repo changes or when repos are loaded
  const fetchReleasesForRepo = async (repo: string) => {
    if (!repo) {
      setReleases([]);
      return;
    }

    setIsLoadingReleases(true);
    setStatusMessage(null);
    setReleases([]);
    setSelectedReleaseIndex(0);
    setSelectedAssetId(null);

    try {
      const res = await Api.fetchReleases(repo);
      if (res.success && res.releases && res.releases.length > 0) {
        setReleases(res.releases);
        setSelectedReleaseIndex(0);
        
        const firstRel = res.releases[0];
        const recommended = firstRel.assets.find((a) => a.is_recommended) || firstRel.assets[0];
        if (recommended) {
          setSelectedAssetId(recommended.id);
        }
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || `No releases found for ${repo}.`,
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: `Failed to query GitHub: ${e?.message || e}` });
    } finally {
      setIsLoadingReleases(false);
    }
  };

  // Initial load when pinnedRepos becomes available
  useEffect(() => {
    if (pinnedRepos.length > 0) {
      const validIndex = selectedRepoIndex < pinnedRepos.length ? selectedRepoIndex : 0;
      setSelectedRepoIndex(validIndex);
      fetchReleasesForRepo(pinnedRepos[validIndex]);
    } else {
      setReleases([]);
    }
  }, [pinnedRepos.length]);

  const handleRepoDropdownChange = (option: any) => {
    let index = 0;
    if (typeof option === "number") {
      index = option;
    } else if (option && typeof option === "object" && typeof option.data === "number") {
      index = option.data;
    }

    if (index >= 0 && index < pinnedRepos.length) {
      setSelectedRepoIndex(index);
      fetchReleasesForRepo(pinnedRepos[index]);
    }
  };

  const currentRelease: GitHubRelease | undefined = releases[selectedReleaseIndex];
  const selectedAsset: GitHubAsset | undefined = currentRelease?.assets.find((a) => a.id === selectedAssetId);

  const handleSelectRelease = (option: any) => {
    let index = 0;
    if (typeof option === "number") {
      index = option;
    } else if (option && typeof option === "object" && typeof option.data === "number") {
      index = option.data;
    }

    if (index >= 0 && index < releases.length) {
      setSelectedReleaseIndex(index);
      const rel = releases[index];
      if (rel && rel.assets.length > 0) {
        const rec = rel.assets.find((a) => a.is_recommended) || rel.assets[0];
        setSelectedAssetId(rec ? rec.id : null);
      }
    }
  };

  const handleStartDownload = async () => {
    if (!currentRelease || !selectedAsset || !currentRepoName) {
      setStatusMessage({ type: "error", text: "Please select a release asset to download." });
      return;
    }

    const displayName = currentRelease.name || currentRepoName.split("/")[1] || currentRepoName;

    onDownloadStarted();
    toaster.toast({
      title: "ReleaseDeck",
      body: `Downloading ${displayName} (${currentRelease.tag_name})...`,
    });

    try {
      const res = await Api.startDownload({
        repo: currentRepoName,
        name: displayName,
        version: currentRelease.tag_name,
        asset_name: selectedAsset.name,
        download_url: selectedAsset.download_url,
      });

      if (res.success) {
        toaster.toast({
          title: "ReleaseDeck",
          body: `Successfully installed ${displayName}!`,
        });
        setStatusMessage({ type: "success", text: `Installed ${displayName} successfully!` });
        onInstalledRefresh();
      } else {
        toaster.toast({
          title: "Download Failed",
          body: res.error || "Unknown error during installation.",
        });
        setStatusMessage({ type: "error", text: res.error || "Installation failed." });
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: `Download error: ${e?.message || e}` });
    }
  };

  const handleCancelDownload = async () => {
    await Api.cancelDownload();
    toaster.toast({
      title: "ReleaseDeck",
      body: "Download cancelled.",
    });
  };

  const isDownloading =
    downloadProgress &&
    downloadProgress.status !== "complete" &&
    downloadProgress.status !== "error";

  // If no repos are pinned, show empty state with direct link to Settings
  if (pinnedRepos.length === 0) {
    return (
      <PanelSection title="Download">
        <PanelSectionRow>
          <div
            style={{
              padding: "16px 8px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <FaStar size={26} color="#ffd43b" />
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>No Repositories Added Yet</div>
            <div style={{ fontSize: "11px", opacity: 0.75, lineHeight: "1.3" }}>
              Add your favorite GitHub repositories (e.g. <code>owner/repo</code>) in Settings to start downloading packages.
            </div>
            <div style={{ marginTop: "6px", width: "100%" }}>
              <ButtonItem layout="below" onClick={onNavigateToSettings}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
                  <FaCog /> Open Settings & Add Repos
                </div>
              </ButtonItem>
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Download">
      {/* Favorite Repos Dropdown */}
      <DropdownItem
        label="Repository"
        menuLabel="Select Favorite Repository"
        rgOptions={pinnedRepos.map((r, index) => ({
          data: index,
          label: r,
        }))}
        selectedOption={selectedRepoIndex}
        onChange={handleRepoDropdownChange}
      />

      {/* Loading Spinner */}
      {isLoadingReleases && (
        <PanelSectionRow>
          <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
            <Spinner />
          </div>
        </PanelSectionRow>
      )}

      {/* Status Message */}
      {statusMessage && (
        <PanelSectionRow>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              boxSizing: "border-box",
              width: "100%",
              wordBreak: "break-word",
              backgroundColor:
                statusMessage.type === "error"
                  ? "rgba(220, 53, 69, 0.2)"
                  : statusMessage.type === "success"
                  ? "rgba(40, 167, 69, 0.2)"
                  : "rgba(23, 162, 184, 0.2)",
              color:
                statusMessage.type === "error"
                  ? "#ff6b6b"
                  : statusMessage.type === "success"
                  ? "#51cf66"
                  : "#74c0fc",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {statusMessage.type === "error" && <FaExclamationTriangle style={{ flexShrink: 0 }} />}
            {statusMessage.type === "success" && <FaCheckCircle style={{ flexShrink: 0 }} />}
            <span>{statusMessage.text}</span>
          </div>
        </PanelSectionRow>
      )}

      {/* Active Download Progress Section */}
      {isDownloading && (
        <PanelSectionRow>
          <div
            style={{
              padding: "10px",
              boxSizing: "border-box",
              width: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderRadius: "6px",
              border: "1px solid #1a9fff",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "6px" }}>
                {downloadProgress?.status === "extracting" ? "📦 Extracting..." : "📥 Downloading..."}
              </span>
              <span>{downloadProgress?.percent || 0}%</span>
            </div>

            <ProgressBar
              nProgress={downloadProgress?.percent || 0}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", opacity: 0.8 }}>
              <span>{downloadProgress?.speed_mb_s || 0} MB/s</span>
              <span>
                {formatBytes(downloadProgress?.downloaded || 0)} / {formatBytes(downloadProgress?.total || 0)}
              </span>
            </div>

            <ButtonItem layout="below" onClick={handleCancelDownload}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
                <FaBan /> Cancel
              </div>
            </ButtonItem>
          </div>
        </PanelSectionRow>
      )}

      {/* Release Version Selection */}
      {!isLoadingReleases && releases.length > 0 && (
        <>
          <DropdownItem
            label="Version"
            menuLabel="Select Release Version"
            rgOptions={releases.map((rel, index) => ({
              data: index,
              label: `${rel.tag_name}${index === 0 ? " (Latest)" : ""}${rel.prerelease ? " [Pre]" : ""}`,
            }))}
            selectedOption={selectedReleaseIndex}
            onChange={handleSelectRelease}
          />

          {/* Changelog Toggle */}
          {currentRelease?.body && (
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={() => setShowChangelog(!showChangelog)}>
                <span style={{ fontSize: "11px" }}>{showChangelog ? "Hide Changelog" : "View Release Notes"}</span>
              </ButtonItem>
            </PanelSectionRow>
          )}

          {showChangelog && currentRelease?.body && (
            <PanelSectionRow>
              <div
                style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "6px 8px",
                  boxSizing: "border-box",
                  width: "100%",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: "4px",
                  fontSize: "10px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.3",
                  opacity: 0.85,
                }}
              >
                {currentRelease.body}
              </div>
            </PanelSectionRow>
          )}

          {/* Package Assets Selector */}
          <PanelSectionRow>
            <div style={{ width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>
                Available Packages:
              </div>
              <Focusable
                flow-children="vertical"
                style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }}
              >
                {currentRelease?.assets.map((asset) => {
                  const isSelected = asset.id === selectedAssetId;
                  return (
                    <Focusable
                      key={asset.id}
                      onActivate={() => setSelectedAssetId(asset.id)}
                      onClick={() => setSelectedAssetId(asset.id)}
                      style={{
                        padding: "6px 8px",
                        boxSizing: "border-box",
                        width: "100%",
                        borderRadius: "4px",
                        backgroundColor: isSelected ? "rgba(26, 159, 255, 0.3)" : "rgba(255, 255, 255, 0.05)",
                        border: isSelected ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: isSelected ? "bold" : "normal", wordBreak: "break-all", flex: 1 }}>
                          {isSelected ? "● " : "○ "} {asset.name}
                        </span>
                        {asset.is_recommended && (
                          <span
                            style={{
                              fontSize: "9px",
                              backgroundColor: "#2b8a3e",
                              color: "#fff",
                              padding: "1px 5px",
                              borderRadius: "3px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              flexShrink: 0,
                            }}
                          >
                            <FaLinux /> Rec
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "10px", opacity: 0.65 }}>
                        Size: {formatBytes(asset.size)}
                      </span>
                    </Focusable>
                  );
                })}
              </Focusable>
            </div>
          </PanelSectionRow>

          {/* Destination Path Preview */}
          <PanelSectionRow>
            <div style={{ fontSize: "10px", opacity: 0.7, padding: "2px 0", wordBreak: "break-all" }}>
              Target: <code>~/Applications/{currentRepoName.split("/")[1] || currentRepoName}/</code>
            </div>
          </PanelSectionRow>

          {/* Download Trigger Button */}
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              disabled={!selectedAsset || !!isDownloading}
              onClick={handleStartDownload}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}>
                <FaDownload />
                {selectedAsset ? `Download & Extract (${formatBytes(selectedAsset.size)})` : "Select a Package Asset"}
              </div>
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
}
