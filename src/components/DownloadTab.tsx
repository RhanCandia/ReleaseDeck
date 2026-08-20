import {
  ButtonItem,
  DialogButton,
  Focusable,
  PanelSection,
  PanelSectionRow,
  ProgressBar,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect, useRef } from "react";
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
  FaRedo,
  FaGithub,
  FaGitlab,
  FaGitAlt,
  FaServer,
  FaChevronRight,
  FaInfoCircle,
  FaCheckCircle,
  FaCheck,
  FaBox,
} from "react-icons/fa";
import { SiItchdotio } from "react-icons/si";
import { Api } from "../api";
import { GitHubRelease, GitHubAsset, DownloadProgress, PluginSettings, InstalledPackage } from "../types";
import { formatBytes, parseRepoSpec } from "../utils/format";

interface DownloadTabProps {
  settings: PluginSettings | null;
  downloadProgress: DownloadProgress | null;
  installedPackages: InstalledPackage[];
  onDownloadStarted: () => void;
  onInstalledRefresh: () => void;
  onNavigateToSettings: () => void;
  onNavigateToApps: () => void;
}

type DrillStep =
  | { type: "repos" }
  | { type: "versions"; repo: string }
  | { type: "packages"; repo: string; release: GitHubRelease };

export function DownloadTab({
  settings,
  downloadProgress,
  installedPackages,
  onDownloadStarted,
  onInstalledRefresh,
  onNavigateToSettings,
  onNavigateToApps,
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
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [isInitiatingDownload, setIsInitiatingDownload] = useState<boolean>(false);
  const [lastInstalledName, setLastInstalledName] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLDivElement>(null);
  const viewInAppsBtnRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);

  const focusElement = (el: HTMLElement | null) => {
    if (!el) return;
    try {
      el.focus?.();
      const btn = el.querySelector?.("button, [tabindex], .rd-card-btn, .rd-breadcrumb-bar") as HTMLElement | null;
      btn?.focus?.();
    } catch (e) {}
  };

  const scrollToTopAndFocus = (target?: "cancel" | "viewInApps" | "top") => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    try {
      const scrollContainer =
        document.querySelector('[class*="quickaccess_"]') ||
        document.querySelector('[class*="gamepadpage"]') ||
        window;
      scrollContainer?.scrollTo?.({ top: 0, behavior: "smooth" });
    } catch (e) {}

    setTimeout(() => {
      if (target === "viewInApps" && viewInAppsBtnRef.current) {
        focusElement(viewInAppsBtnRef.current);
      } else if (target === "cancel" && cancelBtnRef.current) {
        focusElement(cancelBtnRef.current);
      } else if (breadcrumbRef.current) {
        focusElement(breadcrumbRef.current);
      }
    }, 100);
  };

  // Helper to extract file extension
  const getFileBadge = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".appimage")) return "AppImage";
    if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) return "tar.gz";
    if (lower.endsWith(".tar.xz")) return "tar.xz";
    if (lower.endsWith(".zip")) return "zip";
    if (lower.endsWith(".bin") || lower.endsWith(".sh")) return "bin";
    return "file";
  };

  // Fetch releases on demand when entering a repository
  const loadRepoVersions = async (repo: string, force = false) => {
    setCurrentStep({ type: "versions", repo });
    setErrorMessage(null);

    // If already cached and not forced, don't re-fetch
    if (!force && releasesCache[repo] && releasesCache[repo].length > 0) {
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
    const displayName = parseRepoSpec(repo).displayName || release.name || repo;
    setIsInitiatingDownload(true);
    setLastInstalledName(null);
    setErrorMessage(null);

    onDownloadStarted();
    setTimeout(() => {
      scrollToTopAndFocus("cancel");
    }, 50);

    toaster.toast({
      title: "Release Deck",
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
        setLastInstalledName(displayName);
        toaster.toast({
          title: "Release Deck",
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
    } finally {
      setIsInitiatingDownload(false);
    }
  };

  const handleCancelDownload = async () => {
    await Api.cancelDownload();
    setIsInitiatingDownload(false);
    toaster.toast({
      title: "Release Deck",
      body: "Download cancelled.",
    });
  };

  const isDownloading =
    isInitiatingDownload ||
    (downloadProgress &&
      downloadProgress.status !== "complete" &&
      downloadProgress.status !== "error");

  useEffect(() => {
    if (isDownloading) {
      scrollToTopAndFocus("cancel");
    }
  }, [isDownloading]);

  useEffect(() => {
    if (lastInstalledName && !isDownloading) {
      scrollToTopAndFocus("viewInApps");
    }
  }, [lastInstalledName, isDownloading]);

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
                padding: "20px 12px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                borderRadius: "8px",
                border: "1px dashed rgba(255, 255, 255, 0.15)",
              }}
            >
              <FaStar size={28} color="#ffd43b" />
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ffffff" }}>
                No Repositories Added
              </div>
              <div style={{ fontSize: "11px", color: "#9aa4af", lineHeight: "1.4", maxWidth: "260px" }}>
                Add GitHub repositories in Settings to browse, download, and install game ports.
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
        {/* Active Download Banner if running in background */}
        {isDownloading && (
          <PanelSectionRow>
            <div
              style={{
                padding: "8px 10px",
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "rgba(26, 159, 255, 0.15)",
                borderRadius: "6px",
                border: "1px solid #1a9fff",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "4px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold", color: "#ffffff" }}>
                <span>{downloadProgress?.status === "extracting" ? "📦 Extracting..." : `📥 Downloading ${downloadProgress?.name || ""}...`}</span>
                <span>{downloadProgress?.percent || 0}%</span>
              </div>
              <ProgressBar nProgress={downloadProgress?.percent || 0} />
            </div>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "11px", color: "#9aa4af", marginBottom: "2px" }}>
              Select a repository to explore releases:
            </div>

            <Focusable
              flow-children="vertical"
              style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", boxSizing: "border-box" }}
            >
              {pinnedRepos.map((repo) => {
                const info = parseRepoSpec(repo);
                const cachedCount = releasesCache[repo]?.length;

                let icon = <FaGithub size={14} color="#74c0fc" />;
                let iconBg = "rgba(26, 159, 255, 0.15)";
                if (info.providerType === "gitlab") {
                  icon = <FaGitlab size={14} color="#fc6d26" />;
                  iconBg = "rgba(252, 109, 38, 0.15)";
                } else if (info.providerType === "forgejo") {
                  icon = <FaGitAlt size={14} color="#f34f29" />;
                  iconBg = "rgba(243, 79, 41, 0.15)";
                } else if (info.providerType === "itch") {
                  icon = <SiItchdotio size={14} color="#fa5c5c" />;
                  iconBg = "rgba(250, 92, 92, 0.15)";
                } else if (info.providerType === "custom") {
                  icon = <FaServer size={14} color="#a5d8ff" />;
                  iconBg = "rgba(165, 216, 255, 0.15)";
                }

                return (
                  <Focusable
                    key={repo}
                    onActivate={() => loadRepoVersions(repo)}
                    onClick={() => loadRepoVersions(repo)}
                    className="rd-card-item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          backgroundColor: iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, textAlign: "left" }}>
                        <div style={{ fontWeight: "bold", fontSize: "12px", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {info.displayName}
                        </div>
                        <div style={{ fontSize: "10px", color: "#9aa4af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {info.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {cachedCount ? (
                        <span
                          style={{
                            fontSize: "9px",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "#cbd5e1",
                            padding: "2px 5px",
                            borderRadius: "4px",
                          }}
                        >
                          {cachedCount} revs
                        </span>
                      ) : null}
                      <FaChevronRight size={10} color="#74c0fc" />
                    </div>
                  </Focusable>
                );
              })}
            </Focusable>
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  // ==========================================
  // VIEW 2: VERSIONS LIST
  // ==========================================
  if (currentStep.type === "versions") {
    const { repo } = currentStep;
    const releases = releasesCache[repo] || [];

    return (
      <PanelSection title="Versions">
        {/* Navigation Breadcrumb & Back Action */}
        <PanelSectionRow>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <Focusable
              onActivate={() => setCurrentStep({ type: "repos" })}
              onClick={() => setCurrentStep({ type: "repos" })}
              className="rd-breadcrumb-bar"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#74c0fc" }}>
                <FaArrowLeft size={10} />
                <span style={{ fontWeight: "bold" }}>Repositories</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
              <span style={{ color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {repo}
              </span>
            </Focusable>
          </div>
        </PanelSectionRow>

        {/* Loading Spinner */}
        {isLoadingReleases && (
          <PanelSectionRow>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 10px", gap: "8px", width: "100%" }}>
              <FaGithub className="spin-icon" size={24} style={{ color: "#74c0fc" }} />
              <span style={{ fontSize: "11px", color: "#9aa4af" }}>Fetching releases from GitHub...</span>
            </div>
          </PanelSectionRow>
        )}

        {/* Error Message with Retry Button */}
        {errorMessage && !isLoadingReleases && (
          <PanelSectionRow>
            <div
              style={{
                padding: "10px",
                borderRadius: "6px",
                backgroundColor: "rgba(220, 53, 69, 0.2)",
                border: "1px solid rgba(220, 53, 69, 0.4)",
                color: "#ff6b6b",
                fontSize: "11px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                wordBreak: "break-word",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaExclamationTriangle style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
              <ButtonItem
                layout="below"
                onClick={() => loadRepoVersions(repo, true)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
                  <FaRedo /> Retry Fetching Releases
                </div>
              </ButtonItem>
            </div>
          </PanelSectionRow>
        )}

        {/* Version List Cards */}
        {!isLoadingReleases && releases.length > 0 && (
          <PanelSectionRow>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "11px", color: "#9aa4af", marginBottom: "2px" }}>
                Choose a release tag:
              </div>

              <Focusable
                flow-children="vertical"
                style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }}
              >
                {releases.map((rel, index) => {
                  const isLatest = index === 0 && !rel.prerelease;

                  return (
                    <Focusable
                      key={rel.id}
                      onActivate={() => handleSelectRelease(repo, rel)}
                      onClick={() => handleSelectRelease(repo, rel)}
                      className="rd-card-item"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, textAlign: "left" }}>
                        <FaTag
                          size={11}
                          style={{
                            flexShrink: 0,
                            color: isLatest ? "#51cf66" : "#74c0fc",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: isLatest ? "bold" : "500",
                            color: "#ffffff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rel.tag_name}
                        </span>

                        {isLatest && (
                          <span
                            style={{
                              fontSize: "8px",
                              backgroundColor: "#2b8a3e",
                              color: "#ffffff",
                              padding: "1px 5px",
                              borderRadius: "3px",
                              fontWeight: "bold",
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
                              backgroundColor: "#e67700",
                              color: "#ffffff",
                              padding: "1px 5px",
                              borderRadius: "3px",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            Pre-release
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#9aa4af",
                          }}
                        >
                          {rel.assets.length} file{rel.assets.length === 1 ? "" : "s"}
                        </span>
                        <FaChevronRight size={10} color="#74c0fc" />
                      </div>
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
  // VIEW 3: PACKAGES SELECTION & DOWNLOAD
  // ==========================================
  const { repo, release } = currentStep;
  const selectedAsset = release.assets.find((a) => a.id === selectedAssetId) || release.assets[0];

  return (
    <PanelSection title="Download Package">
      <div ref={topRef} />
      {/* Navigation Breadcrumbs */}
      <PanelSectionRow>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div ref={breadcrumbRef} style={{ width: "100%" }}>
            <Focusable
              onActivate={() => setCurrentStep({ type: "versions", repo })}
              onClick={() => setCurrentStep({ type: "versions", repo })}
              className="rd-breadcrumb-bar"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#74c0fc" }}>
                <FaArrowLeft size={10} />
                <span style={{ fontWeight: "bold" }}>Versions</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
              <span style={{ color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {release.tag_name}
              </span>
            </Focusable>
          </div>
        </div>
      </PanelSectionRow>

      {/* Success Notification Banner */}
      {lastInstalledName && !isDownloading && (
        <PanelSectionRow>
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "rgba(46, 204, 113, 0.15)",
              border: "1px solid rgba(46, 204, 113, 0.4)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              width: "100%",
              boxSizing: "border-box",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#a3e9c0", fontWeight: "bold" }}>
              <FaCheckCircle color="#2ecc71" size={14} />
              <span>{lastInstalledName} installed!</span>
            </div>
            <div ref={viewInAppsBtnRef} style={{ flexShrink: 0 }}>
              <DialogButton
                className="rd-card-btn rd-card-btn-launch"
                onClick={() => {
                  onInstalledRefresh();
                  onNavigateToApps();
                }}
                style={{ padding: "4px 8px", fontSize: "10px", height: "auto" }}
              >
                <span>View in Apps ➔</span>
              </DialogButton>
            </div>
          </div>
        </PanelSectionRow>
      )}

      {/* Active Live Download Progress Card */}
      {isDownloading && (
        <PanelSectionRow>
          <div
            style={{
              padding: "12px",
              boxSizing: "border-box",
              width: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: "8px",
              border: "1px solid #1a9fff",
              boxShadow: "0 0 14px rgba(26, 159, 255, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "bold", color: "#ffffff" }}>
                <FaDownload className="spin-icon" style={{ color: "#74c0fc" }} />
                <span>
                  {downloadProgress?.status === "extracting"
                    ? "📦 Extracting & Setting Permissions..."
                    : `📥 Downloading ${downloadProgress?.name || release?.name || ""}`}
                </span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "#74c0fc" }}>
                {downloadProgress?.percent != null && downloadProgress.percent > 0
                  ? `${downloadProgress.percent.toFixed(1)}%`
                  : "Connecting..."}
              </span>
            </div>

            <ProgressBar nProgress={downloadProgress?.percent || (isInitiatingDownload ? 5 : 0)} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#cbd5e1" }}>
              <span>
                Speed: <strong style={{ color: "#51cf66" }}>{downloadProgress?.speed_mb_s ? `${downloadProgress.speed_mb_s.toFixed(2)} MB/s` : "Calculating..."}</strong>
              </span>
              <span>
                {formatBytes(downloadProgress?.downloaded || 0)} / {formatBytes(downloadProgress?.total || selectedAsset?.size || 0)}
              </span>
            </div>

            <div ref={cancelBtnRef} style={{ width: "100%", marginTop: "4px" }}>
              <DialogButton
                className="rd-card-btn rd-card-btn-delete"
                onClick={handleCancelDownload}
                style={{ width: "100%", padding: "5px 10px", fontSize: "11px", height: "auto", boxSizing: "border-box" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <FaBan /> Cancel Download
                </div>
              </DialogButton>
            </div>
          </div>
        </PanelSectionRow>
      )}

      {/* Release Notes Accordion */}
      {release.body && (
        <PanelSectionRow>
          <div style={{ width: "100%" }}>
            <Focusable
              onActivate={() => setShowChangelog(!showChangelog)}
              onClick={() => setShowChangelog(!showChangelog)}
              className="rd-card-item"
              style={{ padding: "6px 8px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#74c0fc" }}>
                <FaInfoCircle size={11} />
                <span>{showChangelog ? "Hide Release Notes" : "View Release Notes"}</span>
              </div>
              <span style={{ fontSize: "10px", color: "#9aa4af" }}>{showChangelog ? "▲" : "▼"}</span>
            </Focusable>

            {showChangelog && (
              <div
                style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "8px",
                  marginTop: "4px",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  fontSize: "10px",
                  color: "#cbd5e1",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.4",
                }}
              >
                {release.body}
              </div>
            )}
          </div>
        </PanelSectionRow>
      )}

      {/* Package Assets List */}
      {release.assets.length === 0 ? (
        <PanelSectionRow>
          <div style={{ textAlign: "center", padding: "16px 8px", color: "#9aa4af", fontSize: "11px" }}>
            <FaBoxOpen size={24} style={{ marginBottom: "6px", opacity: 0.7 }} />
            <div>No binary packages attached to this release.</div>
          </div>
        </PanelSectionRow>
      ) : (
        <>
          <PanelSectionRow>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "11px", color: "#9aa4af", marginBottom: "2px" }}>
                Select a package to download ({release.assets.length}):
              </div>

              <Focusable
                flow-children="vertical"
                style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }}
              >
                {release.assets.map((asset) => {
                  const isSelected = selectedAsset && asset.id === selectedAsset.id;
                  const badgeType = getFileBadge(asset.name);
                  const isAssetInstalled = installedPackages.some(
                    (p) =>
                      p.repository.toLowerCase() === repo.toLowerCase() &&
                      p.installed_version === release.tag_name &&
                      p.installed_asset === asset.name
                  );

                  return (
                    <Focusable
                      key={asset.id}
                      onActivate={() => setSelectedAssetId(asset.id)}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`rd-asset-card ${isSelected ? "selected" : ""}`}
                    >
                      <div style={{ marginTop: "2px", flexShrink: 0 }}>
                        {isSelected ? (
                          <FaDotCircle style={{ color: "#1a9fff", fontSize: "13px" }} />
                        ) : (
                          <FaRegCircle style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "13px" }} />
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: isSelected ? "bold" : "500",
                              color: "#ffffff",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              whiteSpace: "normal",
                              lineHeight: "1.3",
                            }}
                          >
                            {asset.name}
                          </span>

                          <span
                            style={{
                              fontSize: "8px",
                              backgroundColor: "rgba(255, 255, 255, 0.12)",
                              color: "#cbd5e1",
                              padding: "1px 4px",
                              borderRadius: "3px",
                              textTransform: "uppercase",
                              fontWeight: "600",
                              flexShrink: 0,
                            }}
                          >
                            {badgeType}
                          </span>

                          {isAssetInstalled && (
                            <span
                              style={{
                                fontSize: "8px",
                                backgroundColor: "#2b8a3e",
                                color: "#ffffff",
                                padding: "1px 5px",
                                borderRadius: "3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontWeight: "bold",
                                flexShrink: 0,
                              }}
                            >
                              <FaCheck size={8} /> Installed
                            </span>
                          )}

                          {asset.is_recommended && !isAssetInstalled && (
                            <span
                              style={{
                                fontSize: "8px",
                                backgroundColor: "rgba(46, 204, 113, 0.2)",
                                border: "1px solid rgba(46, 204, 113, 0.4)",
                                color: "#a3e9c0",
                                padding: "1px 5px",
                                borderRadius: "3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontWeight: "bold",
                                flexShrink: 0,
                              }}
                            >
                              <FaLinux /> Recommended
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "10px", color: "#9aa4af", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Size: <strong style={{ color: "#ffffff" }}>{formatBytes(asset.size)}</strong></span>
                          {asset.download_count > 0 && (
                            <span>• {asset.download_count.toLocaleString()} downloads</span>
                          )}
                        </div>
                      </div>
                    </Focusable>
                  );
                })}
              </Focusable>
            </div>
          </PanelSectionRow>

          {/* Installation Target Path & Download Action */}
          <PanelSectionRow>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginTop: "2px" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "#9aa4af",
                  padding: "5px 8px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <FaFolder color="#74c0fc" style={{ flexShrink: 0 }} />
                <span>Installs to: <code style={{ color: "#cbd5e1" }}>~/Applications/{parseRepoSpec(repo).repo}/</code></span>
              </div>

              {(() => {
                const isSelectedInstalled = selectedAsset
                  ? installedPackages.some(
                      (p) =>
                        p.repository.toLowerCase() === repo.toLowerCase() &&
                        p.installed_version === release.tag_name &&
                        p.installed_asset === selectedAsset.name
                    )
                  : false;

                if (isDownloading) {
                  return (
                    <DialogButton
                      className="rd-card-btn rd-card-btn-launch"
                      disabled
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        height: "auto",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <FaDownload className="spin-icon" size={12} />
                        <span>Downloading...</span>
                      </div>
                    </DialogButton>
                  );
                }

                if (isSelectedInstalled) {
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                      <DialogButton
                        className="rd-card-btn rd-card-btn-installed"
                        disabled
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          height: "auto",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <FaCheck color="#2ecc71" size={12} />
                          <span>Installed ({release.tag_name})</span>
                        </div>
                      </DialogButton>
                      <DialogButton
                        className="rd-card-btn rd-card-btn-launch"
                        onClick={() => {
                          onInstalledRefresh();
                          onNavigateToApps();
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          height: "auto",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <FaBox size={12} />
                          <span>Open in Apps ➔</span>
                        </div>
                      </DialogButton>
                    </div>
                  );
                }

                return (
                  <DialogButton
                    className="rd-card-btn rd-card-btn-launch"
                    disabled={!selectedAsset}
                    onClick={() => selectedAsset && handleStartDownload(repo, release, selectedAsset)}
                    style={{
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      height: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <FaDownload size={12} />
                      <span>
                        {selectedAsset
                          ? `Download & Install (${formatBytes(selectedAsset.size)})`
                          : "Select a Package Above"}
                      </span>
                    </div>
                  </DialogButton>
                );
              })()}
            </div>
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
}
