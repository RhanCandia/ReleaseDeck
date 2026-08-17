import {
  ButtonItem,
  Focusable,
  PanelSection,
  PanelSectionRow,
  ProgressBar,
  Spinner,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect } from "react";
import {
  FaDownload,
  FaLinux,
  FaBan,
  FaExclamationTriangle,
  FaCog,
  FaStar,
  FaArrowLeft,
  FaFolder,
  FaTag,
  FaBoxOpen,
  FaDotCircle,
  FaRegCircle,
} from "react-icons/fa";
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

type DrillStep =
  | { type: "repos" }
  | { type: "versions"; repo: string }
  | { type: "packages"; repo: string; release: GitHubRelease };

export function DownloadTab({
  settings,
  downloadProgress,
  onDownloadStarted,
  onInstalledRefresh,
  onNavigateToSettings,
}: DownloadTabProps) {
  const pinnedRepos = settings?.pinned_repos || [];

  // Drill-down navigation state
  const [currentStep, setCurrentStep] = useState<DrillStep>({ type: "repos" });

  // Cached releases per repo
  const [releasesCache, setReleasesCache] = useState<Record<string, GitHubRelease[]>>({});
  const [isLoadingReleases, setIsLoadingReleases] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected & focused state
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [focusedVersionId, setFocusedVersionId] = useState<number | null>(null);
  const [focusedAssetId, setFocusedAssetId] = useState<number | null>(null);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);

  // Fetch releases on demand when entering a repository
  const loadRepoVersions = async (repo: string) => {
    setCurrentStep({ type: "versions", repo });
    setErrorMessage(null);

    // If already cached, don't re-fetch
    if (releasesCache[repo] && releasesCache[repo].length > 0) {
      return;
    }

    setIsLoadingReleases(true);
    try {
      const res = await Api.fetchReleases(repo);
      if (res.success && res.releases && res.releases.length > 0) {
        const fetched = res.releases;
        setReleasesCache((prev) => ({ ...prev, [repo]: fetched }));
      } else {
        setErrorMessage(res.error || `No published releases found for ${repo}.`);
      }
    } catch (e: any) {
      setErrorMessage(`Failed to query GitHub: ${e?.message || e}`);
    } finally {
      setIsLoadingReleases(false);
    }
  };

  const handleSelectRelease = (repo: string, release: GitHubRelease) => {
    setCurrentStep({ type: "packages", repo, release });
    setShowChangelog(false);

    // Auto-select recommended asset if available
    if (release.assets && release.assets.length > 0) {
      const rec = release.assets.find((a) => a.is_recommended) || release.assets[0];
      setSelectedAssetId(rec ? rec.id : release.assets[0].id);
    } else {
      setSelectedAssetId(null);
    }
  };

  const handleStartDownload = async (repo: string, release: GitHubRelease, asset: GitHubAsset) => {
    const displayName = release.name || repo.split("/")[1] || repo;

    onDownloadStarted();
    toaster.toast({
      title: "ReleaseDeck",
      body: `Downloading ${displayName} (${release.tag_name})...`,
    });

    try {
      const res = await Api.startDownload({
        repo: repo,
        name: displayName,
        version: release.tag_name,
        asset_name: asset.name,
        download_url: asset.download_url,
      });

      if (res.success) {
        toaster.toast({
          title: "ReleaseDeck",
          body: `Successfully installed ${displayName}!`,
        });
        onInstalledRefresh();
      } else {
        toaster.toast({
          title: "Download Failed",
          body: res.error || "Unknown error during installation.",
        });
        setErrorMessage(res.error || "Installation failed.");
      }
    } catch (e: any) {
      toaster.toast({
        title: "Download Error",
        body: e?.message || "Unexpected download error.",
      });
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

  // Reset to repos list if current repo is deleted from Settings
  useEffect(() => {
    if (currentStep.type !== "repos" && !pinnedRepos.includes(currentStep.repo)) {
      setCurrentStep({ type: "repos" });
    }
  }, [pinnedRepos]);

  // ==========================================
  // VIEW 1: REPOSITORIES LIST
  // ==========================================
  if (currentStep.type === "repos") {
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
                Add your favorite GitHub repositories in Settings to browse and download releases.
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
      <PanelSection title="Repositories">
        <PanelSectionRow>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "2px" }}>
              Select a repository to view releases:
            </div>
            <Focusable
              flow-children="vertical"
              style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }}
            >
              {pinnedRepos.map((repo) => (
                <ButtonItem
                  key={repo}
                  layout="below"
                  onClick={() => loadRepoVersions(repo)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "12px",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", wordBreak: "break-all", textAlign: "left" }}>
                      <FaFolder style={{ flexShrink: 0, color: "#74c0fc" }} />
                      <span>{repo}</span>
                    </div>
                    <span style={{ fontSize: "11px", opacity: 0.6, flexShrink: 0 }}>➔</span>
                  </div>
                </ButtonItem>
              ))}
            </Focusable>
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  // ==========================================
  // VIEW 2: VERSIONS LIST (SLEEK TEXT LINKS WITH CRISP FOCUS)
  // ==========================================
  if (currentStep.type === "versions") {
    const { repo } = currentStep;
    const releases = releasesCache[repo] || [];

    return (
      <PanelSection title="Versions">
        {/* Back Button & Title */}
        <PanelSectionRow>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
            <ButtonItem
              layout="below"
              onClick={() => setCurrentStep({ type: "repos" })}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                <FaArrowLeft /> Back to Repositories
              </div>
            </ButtonItem>
            <div
              style={{
                padding: "4px 6px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: "bold",
                wordBreak: "break-all",
              }}
            >
              📁 {repo}
            </div>
          </div>
        </PanelSectionRow>

        {/* Loading Spinner */}
        {isLoadingReleases && (
          <PanelSectionRow>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", gap: "6px", fontSize: "11px" }}>
              <Spinner />
              <span>Fetching versions...</span>
            </div>
          </PanelSectionRow>
        )}

        {/* Error Message */}
        {errorMessage && !isLoadingReleases && (
          <PanelSectionRow>
            <div
              style={{
                padding: "6px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(220, 53, 69, 0.2)",
                color: "#ff6b6b",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                wordBreak: "break-word",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <FaExclamationTriangle style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          </PanelSectionRow>
        )}

        {/* Sleek Text Links with onFocus Highlight */}
        {!isLoadingReleases && releases.length > 0 && (
          <PanelSectionRow>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "10px", opacity: 0.65, marginBottom: "2px" }}>Select a Version:</div>
              <Focusable
                flow-children="vertical"
                style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%", boxSizing: "border-box" }}
              >
                {releases.map((rel, index) => {
                  const isFocused = focusedVersionId === rel.id;
                  return (
                    <Focusable
                      key={rel.id}
                      onFocus={() => setFocusedVersionId(rel.id)}
                      onBlur={() => setFocusedVersionId((current) => (current === rel.id ? null : current))}
                      onActivate={() => handleSelectRelease(repo, rel)}
                      onClick={() => handleSelectRelease(repo, rel)}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "4px",
                        backgroundColor: isFocused ? "#1a9fff" : "transparent",
                        border: isFocused ? "1px solid #ffffff" : "1px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        width: "100%",
                        boxSizing: "border-box",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, textAlign: "left" }}>
                        <FaTag
                          style={{
                            flexShrink: 0,
                            fontSize: "10px",
                            color: isFocused ? "#ffffff" : index === 0 ? "#51cf66" : "#74c0fc",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: isFocused || index === 0 ? "bold" : "normal",
                            color: isFocused ? "#ffffff" : "#74c0fc",
                            textDecoration: isFocused ? "none" : "underline",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rel.tag_name}
                        </span>
                        {index === 0 && (
                          <span
                            style={{
                              fontSize: "8px",
                              backgroundColor: isFocused ? "rgba(0, 0, 0, 0.3)" : "#2b8a3e",
                              color: "#fff",
                              padding: "0 4px",
                              borderRadius: "2px",
                              flexShrink: 0,
                            }}
                          >
                            Latest
                          </span>
                        )}
                        {rel.prerelease && (
                          <span
                            style={{
                              fontSize: "8px",
                              backgroundColor: isFocused ? "rgba(0, 0, 0, 0.3)" : "#e67700",
                              color: "#fff",
                              padding: "0 4px",
                              borderRadius: "2px",
                              flexShrink: 0,
                            }}
                          >
                            Pre
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          opacity: isFocused ? 0.95 : 0.6,
                          color: isFocused ? "#ffffff" : undefined,
                          flexShrink: 0,
                        }}
                      >
                        {rel.assets.length} file{rel.assets.length === 1 ? "" : "s"} ➔
                      </span>
                    </Focusable>
                  );
                })}
              </Focusable>
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>
    );
  }

  // ==========================================
  // VIEW 3: PACKAGES LIST (SLEEK RADIO ROWS WITH CRISP FOCUS)
  // ==========================================
  const { repo, release } = currentStep;
  const selectedAsset = release.assets.find((a) => a.id === selectedAssetId) || release.assets[0];

  return (
    <PanelSection title="Packages">
      {/* Back Button & Title */}
      <PanelSectionRow>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
          <ButtonItem
            layout="below"
            onClick={() => setCurrentStep({ type: "versions", repo })}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
              <FaArrowLeft /> Back to Versions
            </div>
          </ButtonItem>
          <div
            style={{
              padding: "4px 6px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "3px",
              fontSize: "11px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {repo}
            </span>
            <span style={{ opacity: 0.8, fontSize: "10px" }}>{release.tag_name}</span>
          </div>
        </div>
      </PanelSectionRow>

      {/* Active Download Progress */}
      {isDownloading && (
        <PanelSectionRow>
          <div
            style={{
              padding: "8px",
              boxSizing: "border-box",
              width: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderRadius: "6px",
              border: "1px solid #1a9fff",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "6px" }}>
                {downloadProgress?.status === "extracting" ? "📦 Extracting..." : "📥 Downloading..."}
              </span>
              <span>{downloadProgress?.percent || 0}%</span>
            </div>
            <ProgressBar nProgress={downloadProgress?.percent || 0} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", opacity: 0.8 }}>
              <span>{downloadProgress?.speed_mb_s || 0} MB/s</span>
              <span>{formatBytes(downloadProgress?.downloaded || 0)} / {formatBytes(downloadProgress?.total || 0)}</span>
            </div>
            <ButtonItem layout="below" onClick={handleCancelDownload}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "10px" }}>
                <FaBan /> Cancel
              </div>
            </ButtonItem>
          </div>
        </PanelSectionRow>
      )}

      {/* Changelog Toggle */}
      {release.body && (
        <PanelSectionRow>
          <div style={{ width: "100%" }}>
            <ButtonItem layout="below" onClick={() => setShowChangelog(!showChangelog)}>
              <span style={{ fontSize: "10px" }}>{showChangelog ? "Hide Changelog" : "View Release Notes"}</span>
            </ButtonItem>
            {showChangelog && (
              <div
                style={{
                  maxHeight: "100px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "6px",
                  marginTop: "3px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: "3px",
                  fontSize: "10px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.3",
                  opacity: 0.85,
                }}
              >
                {release.body}
              </div>
            )}
          </div>
        </PanelSectionRow>
      )}

      {/* Sleek Radio List for Packages */}
      {release.assets.length === 0 ? (
        <PanelSectionRow>
          <div style={{ textAlign: "center", padding: "10px", opacity: 0.7, fontSize: "11px" }}>
            <FaBoxOpen size={18} />
            <div>No binary packages attached to this release.</div>
          </div>
        </PanelSectionRow>
      ) : (
        <>
          <PanelSectionRow>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "2px" }}>
                Select Package ({release.assets.length}):
              </div>

              <Focusable
                flow-children="vertical"
                style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%", boxSizing: "border-box" }}
              >
                {release.assets.map((asset) => {
                  const isSelected = selectedAsset && asset.id === selectedAsset.id;
                  const isFocused = focusedAssetId === asset.id;

                  return (
                    <Focusable
                      key={asset.id}
                      onFocus={() => setFocusedAssetId(asset.id)}
                      onBlur={() => setFocusedAssetId((current) => (current === asset.id ? null : current))}
                      onActivate={() => setSelectedAssetId(asset.id)}
                      onClick={() => setSelectedAssetId(asset.id)}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "4px",
                        backgroundColor: isFocused
                          ? "#1a9fff"
                          : isSelected
                          ? "rgba(26, 159, 255, 0.15)"
                          : "transparent",
                        border: isFocused
                          ? "1px solid #ffffff"
                          : isSelected
                          ? "1px solid rgba(26, 159, 255, 0.4)"
                          : "1px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "6px",
                        width: "100%",
                        boxSizing: "border-box",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <span style={{ marginTop: "2px", flexShrink: 0 }}>
                        {isSelected ? (
                          <FaDotCircle style={{ color: isFocused ? "#ffffff" : "#1a9fff", fontSize: "12px" }} />
                        ) : (
                          <FaRegCircle style={{ color: isFocused ? "#ffffff" : "rgba(255, 255, 255, 0.45)", fontSize: "12px" }} />
                        )}
                      </span>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1px", flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: isSelected || isFocused ? "bold" : "normal",
                              color: isFocused ? "#ffffff" : isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              whiteSpace: "normal",
                              lineHeight: "1.3",
                            }}
                          >
                            {asset.name}
                          </span>
                          {asset.is_recommended && (
                            <span
                              style={{
                                fontSize: "8px",
                                backgroundColor: isFocused ? "rgba(0, 0, 0, 0.3)" : "#2b8a3e",
                                color: "#fff",
                                padding: "0 3px",
                                borderRadius: "2px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                flexShrink: 0,
                              }}
                            >
                              <FaLinux /> Rec
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            opacity: isFocused ? 0.9 : 0.65,
                            color: isFocused ? "#ffffff" : undefined,
                          }}
                        >
                          Size: {formatBytes(asset.size)}
                        </span>
                      </div>
                    </Focusable>
                  );
                })}
              </Focusable>
            </div>
          </PanelSectionRow>

          {/* Destination Path Preview & Download Button */}
          <PanelSectionRow>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "10px", opacity: 0.7, wordBreak: "break-all" }}>
                Target: <code>~/Applications/{repo.split("/")[1] || repo}/</code>
              </div>
              <ButtonItem
                layout="below"
                disabled={!selectedAsset || !!isDownloading}
                onClick={() => selectedAsset && handleStartDownload(repo, release, selectedAsset)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
                  <FaDownload />
                  {selectedAsset ? `Download & Extract (${formatBytes(selectedAsset.size)})` : "Select a Package"}
                </div>
              </ButtonItem>
            </div>
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
}
