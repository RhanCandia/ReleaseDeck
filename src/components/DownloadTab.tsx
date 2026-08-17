import {
  ButtonItem,
  Dropdown,
  Focusable,
  PanelSection,
  PanelSectionRow,
  ProgressBar,
  Spinner,
  TextField,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState } from "react";
import { FaDownload, FaLinux, FaBan, FaGithub, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Api } from "../api";
import { GitHubRelease, GitHubAsset, DownloadProgress, PluginSettings } from "../types";
import { formatBytes } from "../utils/format";

interface DownloadTabProps {
  settings: PluginSettings | null;
  downloadProgress: DownloadProgress | null;
  onDownloadStarted: () => void;
  onInstalledRefresh: () => void;
}

export function DownloadTab({
  settings,
  downloadProgress,
  onDownloadStarted,
  onInstalledRefresh,
}: DownloadTabProps) {
  const [repoInput, setRepoInput] = useState<string>("");
  const [isLoadingReleases, setIsLoadingReleases] = useState<boolean>(false);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [selectedReleaseIndex, setSelectedReleaseIndex] = useState<number>(0);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);

  const pinnedRepos = settings?.pinned_repos || [];

  const handleFetchReleases = async (targetRepo?: string) => {
    const repo = (targetRepo || repoInput).trim();
    if (!repo) {
      setStatusMessage({ type: "error", text: "Please enter a repository in 'owner/repo' format." });
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
          text: res.error || "No releases found for this repository.",
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: `Failed to query repository: ${e?.message || e}` });
    } finally {
      setIsLoadingReleases(false);
    }
  };

  const currentRelease: GitHubRelease | undefined = releases[selectedReleaseIndex];
  const selectedAsset: GitHubAsset | undefined = currentRelease?.assets.find((a) => a.id === selectedAssetId);

  const handleSelectRelease = (index: number) => {
    setSelectedReleaseIndex(index);
    const rel = releases[index];
    if (rel && rel.assets.length > 0) {
      const rec = rel.assets.find((a) => a.is_recommended) || rel.assets[0];
      setSelectedAssetId(rec ? rec.id : null);
    }
  };

  const handleStartDownload = async () => {
    if (!currentRelease || !selectedAsset) {
      setStatusMessage({ type: "error", text: "Please select a version and a release asset to download." });
      return;
    }

    const repoName = repoInput.trim();
    const displayName = currentRelease.name || repoName.split("/")[1] || repoName;

    onDownloadStarted();
    toaster.toast({
      title: "ReleaseDeck",
      body: `Downloading ${displayName} (${currentRelease.tag_name})...`,
    });

    try {
      const res = await Api.startDownload({
        repo: repoName,
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

  const isDownloadingThisRepo =
    downloadProgress &&
    downloadProgress.status !== "complete" &&
    downloadProgress.status !== "error";

  return (
    <PanelSection title="Download">
      {/* Pinned Repos Quick Select (only if user added favorites) */}
      {pinnedRepos.length > 0 && (
        <PanelSectionRow>
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <Dropdown
              menuLabel="Quick Select Favorite"
              rgOptions={pinnedRepos.map((r) => ({ data: r, label: r }))}
              selectedOption={pinnedRepos.includes(repoInput) ? repoInput : undefined}
              onChange={(item) => {
                setRepoInput(item.data);
                handleFetchReleases(item.data);
              }}
            />
          </div>
        </PanelSectionRow>
      )}

      {/* Manual Repo Input */}
      <PanelSectionRow>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <TextField
            label="GitHub Repository"
            description="Format: owner/repo"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
          />
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={isLoadingReleases || !!isDownloadingThisRepo || !repoInput.trim()}
          onClick={() => handleFetchReleases()}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}>
            <FaGithub />
            {isLoadingReleases ? "Querying GitHub..." : "Fetch Releases"}
          </div>
        </ButtonItem>
      </PanelSectionRow>

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
      {isDownloadingThisRepo && (
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

      {/* Release Selection */}
      {releases.length > 0 && (
        <>
          <PanelSectionRow>
            <div style={{ width: "100%", boxSizing: "border-box" }}>
              <Dropdown
                menuLabel="Release Version"
                rgOptions={releases.map((rel, index) => ({
                  data: index,
                  label: `${rel.tag_name}${index === 0 ? " (Latest)" : ""}${rel.prerelease ? " [Pre]" : ""}`,
                }))}
                selectedOption={selectedReleaseIndex}
                onChange={(item) => handleSelectRelease(item.data)}
              />
            </div>
          </PanelSectionRow>

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

          {/* Package Assets Selector (Full Width, No 2-Column Field Wrapper) */}
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
              Target: <code>~/Applications/{repoInput.split("/")[1] || repoInput}/</code>
            </div>
          </PanelSectionRow>

          {/* Download Trigger Button */}
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              disabled={!selectedAsset || !!isDownloadingThisRepo}
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
