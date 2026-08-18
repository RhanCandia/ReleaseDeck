import {
  ButtonItem,
  DialogButton,
  Focusable,
  PanelSection,
  PanelSectionRow,
  Spinner,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect } from "react";
import {
  FaSync,
  FaTrash,
  FaArrowUp,
  FaSteam,
  FaGithub,
  FaGitlab,
  FaGitAlt,
  FaServer,
  FaBoxOpen,
  FaExclamationCircle,
  FaCheck,
  FaCog,
  FaChevronDown,
} from "react-icons/fa";
import { Api } from "../api";
import { InstalledPackage, AppExecutableInfo } from "../types";
import { formatBytes, parseRepoSpec } from "../utils/format";

declare const SteamClient: any;

interface InstalledTabProps {
  packages: InstalledPackage[];
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateToDownload: () => void;
}

export function InstalledTab({
  packages,
  isLoading,
  onRefresh,
  onNavigateToDownload,
}: InstalledTabProps) {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [addingSteamId, setAddingSteamId] = useState<string | null>(null);
  const [addedSteamIds, setAddedSteamIds] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [executablesMap, setExecutablesMap] = useState<Record<string, AppExecutableInfo[]>>({});
  const [selectedExeMap, setSelectedExeMap] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (pkgId: string) => {
    setExpandedIds((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }));
  };

  useEffect(() => {
    packages.forEach(async (pkg) => {
      try {
        const res = await Api.getAppExecutables(pkg.id);
        if (res.success && res.executables && res.executables.length > 0) {
          setExecutablesMap((prev) => ({ ...prev, [pkg.id]: res.executables || [] }));
          const defaultExe = res.executables.find((e) => e.is_default)?.path || res.executables[0]?.path || "";
          setSelectedExeMap((prev) => ({ ...prev, [pkg.id]: prev[pkg.id] || defaultExe }));
        }
      } catch (e) {
        console.warn("Could not fetch executables for", pkg.id, e);
      }
    });
  }, [packages]);

  const handleCycleExecutable = (pkgId: string) => {
    const exes = executablesMap[pkgId] || [];
    if (exes.length <= 1) {
      toaster.toast({
        title: "Executable",
        body: exes[0]?.filename || "Default executable",
      });
      return;
    }
    const currentPath = selectedExeMap[pkgId];
    const currentIndex = exes.findIndex((e) => e.path === currentPath);
    const nextIndex = (currentIndex + 1) % exes.length;
    const nextExe = exes[nextIndex];
    setSelectedExeMap((prev) => ({ ...prev, [pkgId]: nextExe.path }));
    toaster.toast({
      title: "Selected Executable",
      body: nextExe.filename,
    });
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const updatedList = await Api.checkAllUpdates();
      const updateCount = updatedList.filter((p) => p.has_update).length;
      toaster.toast({
        title: "Release Deck",
        body: updateCount > 0
          ? `Found ${updateCount} update(s) available!`
          : "All packages are up to date.",
      });
      onRefresh();
    } catch (e: any) {
      toaster.toast({
        title: "Update Check Failed",
        body: e?.message || "Could not check updates.",
      });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleAddToSteam = async (pkg: InstalledPackage, selectedTargetExe?: string) => {
    setAddingSteamId(pkg.id);

    try {
      // 1. Ensure launcher exists and get clean path
      const res = await Api.getAppExecutable(pkg.id, selectedTargetExe);
      if (!res.success || !res.exe_path) {
        toaster.toast({
          title: "Add to Steam Failed",
          body: res.error || "Executable not found.",
        });
        return;
      }

      // Ensure proper game title from repo name (strip version numbers)
      const cleanRepo = pkg.repository ? parseRepoSpec(pkg.repository).displayName : "";
      const displayName = cleanRepo || res.name || pkg.name || "Application";
      const exePath = res.exe_path;
      const startDir = res.install_path || "";

      // 2. Call Steam's Gamepad UI client API directly in frontend
      let added = false;
      if (typeof SteamClient !== "undefined" && SteamClient.Apps?.AddShortcut) {
        try {
          const id = await SteamClient.Apps.AddShortcut(displayName, exePath, startDir, "");
          setTimeout(() => {
            try {
              if (SteamClient.Apps?.SetShortcutName) SteamClient.Apps.SetShortcutName(id, displayName);
              if (SteamClient.Apps?.SetShortcutExe) SteamClient.Apps.SetShortcutExe(id, `"${exePath}"`);
            } catch (err) {}
          }, 250);
          added = true;
        } catch (e: any) {
          console.warn("SteamClient.Apps.AddShortcut error:", e);
        }
      }

      // 3. Fallback to backend API if SteamClient JS was not available
      if (!added) {
        const fallbackRes = await Api.addToSteam(pkg.id, selectedTargetExe);
        if (!fallbackRes.success) {
          toaster.toast({
            title: "Add to Steam Failed",
            body: fallbackRes.error || "Could not register shortcut.",
          });
          return;
        }
      }

      setAddedSteamIds((prev) => ({ ...prev, [pkg.id]: true }));
      toaster.toast({
        title: "Added to Steam",
        body: `${displayName} is now available in your Non-Steam library!`,
      });
    } catch (e: any) {
      toaster.toast({
        title: "Steam Error",
        body: e?.message || "Failed to add to Steam.",
      });
    } finally {
      setAddingSteamId(null);
    }
  };

  const handleUpgrade = async (pkg: InstalledPackage) => {
    setUpgradingId(pkg.id);
    toaster.toast({
      title: "Release Deck",
      body: `Updating ${pkg.name || pkg.repository}...`,
    });

    try {
      const res = await Api.upgradePackage(pkg.id);
      if (res.success) {
        toaster.toast({
          title: "Update Complete",
          body: `${pkg.name || pkg.repository} is up to date!`,
        });
        onRefresh();
      } else {
        toaster.toast({
          title: "Update Failed",
          body: res.error || "Update failed.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Update Error",
        body: e?.message || "Unexpected error.",
      });
    } finally {
      setUpgradingId(null);
    }
  };

  const handleUninstall = async (pkg: InstalledPackage) => {
    if (deletingId !== pkg.id) {
      setDeletingId(pkg.id);
      return;
    }

    try {
      const res = await Api.uninstallPackage(pkg.id, true);
      if (res.success) {
        toaster.toast({
          title: "Release Deck",
          body: `Deleted ${pkg.name || pkg.repository}.`,
        });
        onRefresh();
      } else {
        toaster.toast({
          title: "Delete Error",
          body: res.error || "Could not delete package.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Delete Error",
        body: e?.message || "Unexpected error.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PanelSection title={`Installed Apps (${packages.length})`}>
      {/* Header Actions */}
      {packages.length > 0 && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={isLoading || isCheckingUpdates}
            onClick={handleCheckUpdates}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
              <FaSync className={isCheckingUpdates ? "spin-icon" : ""} size={11} />
              <span>{isCheckingUpdates ? "Checking for Updates..." : "Check for Updates"}</span>
            </div>
          </ButtonItem>
        </PanelSectionRow>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <PanelSectionRow>
          <div style={{ display: "flex", justifyContent: "center", padding: "20px", width: "100%" }}>
            <Spinner />
          </div>
        </PanelSectionRow>
      )}

      {/* Empty state prompt */}
      {!isLoading && packages.length === 0 && (
        <PanelSectionRow>
          <div
            style={{
              padding: "24px 16px",
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
            <FaBoxOpen size={32} color="#74c0fc" />
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ffffff" }}>
              No Packages Installed
            </div>
            <div style={{ fontSize: "11px", color: "#9aa4af", maxWidth: "260px", lineHeight: "1.4" }}>
              Download game releases and tools to run them directly or add them to Steam Game Mode.
            </div>
            <DialogButton
              className="rd-card-btn rd-card-btn-launch"
              onClick={onNavigateToDownload}
              style={{
                marginTop: "4px",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: "bold",
                height: "auto",
              }}
            >
              Browse Downloads ➔
            </DialogButton>
          </div>
        </PanelSectionRow>
      )}

      {/* Installed Packages List */}
      {!isLoading && packages.length > 0 && (
        <PanelSectionRow>
          <Focusable
            flow-children="vertical"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {packages.map((pkg) => {
              const isExpanded = !!expandedIds[pkg.id];
              const isUpgrading = upgradingId === pkg.id;
              const isAdding = addingSteamId === pkg.id;
              const isAdded = Boolean(addedSteamIds[pkg.id]);
              const isConfirmingDelete = deletingId === pkg.id;

              const exes = executablesMap[pkg.id] || [];
              const selectedExePath = selectedExeMap[pkg.id] || (exes.find((e) => e.is_default)?.path || exes[0]?.path || "");
              const selectedExeObj = exes.find((e) => e.path === selectedExePath);
              const selectedExeName = selectedExeObj ? selectedExeObj.filename : (exes[0]?.filename || "Default Exe");
              const hasMultipleExes = exes.length > 1;

              return (
                <div
                  key={pkg.id}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: isExpanded ? "1px solid rgba(26, 159, 255, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {/* Collapsible Card Header */}
                  <Focusable
                    onActivate={() => toggleExpand(pkg.id)}
                    onClick={() => toggleExpand(pkg.id)}
                    className="rd-card-header"
                    style={{
                      padding: "9px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      cursor: "pointer",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Top Row: Repository Name + Version Badge + New Indicator + Chevron */}
                    {(() => {
                      const info = parseRepoSpec(pkg.repository);
                      let icon = <FaGithub size={13} color="#74c0fc" style={{ flexShrink: 0 }} />;
                      if (info.providerType === "gitlab") {
                        icon = <FaGitlab size={13} color="#fc6d26" style={{ flexShrink: 0 }} />;
                      } else if (info.providerType === "forgejo") {
                        icon = <FaGitAlt size={13} color="#f34f29" style={{ flexShrink: 0 }} />;
                      } else if (info.providerType === "custom") {
                        icon = <FaServer size={13} color="#a5d8ff" style={{ flexShrink: 0 }} />;
                      }

                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "#ffffff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {icon}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {pkg.name || info.displayName}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                            {/* Version tag */}
                            <span
                              style={{
                                fontSize: "9px",
                                backgroundColor: "rgba(255, 255, 255, 0.12)",
                                color: "#e2e8f0",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: "bold",
                              }}
                            >
                              {pkg.installed_version}
                            </span>

                            {/* Update indicator */}
                            {pkg.has_update && (
                              <span
                                style={{
                                  fontSize: "8px",
                                  backgroundColor: "#f59f00",
                                  color: "#000000",
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                  fontWeight: "bold",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "2px",
                                }}
                              >
                                <FaExclamationCircle size={8} /> New
                              </span>
                            )}

                            {/* Animated Chevron */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "16px",
                                height: "16px",
                                color: "#74c0fc",
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s ease-in-out",
                              }}
                            >
                              <FaChevronDown size={10} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Subtext info: Host & Asset & Size */}
                    <div style={{ fontSize: "10px", color: "#969ba3", display: "flex", justifyContent: "space-between", gap: "4px", width: "100%" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {parseRepoSpec(pkg.repository).subtitle} • {pkg.installed_asset || pkg.name}
                      </span>
                      <span style={{ flexShrink: 0 }}>
                        {formatBytes(pkg.size_bytes)}
                      </span>
                    </div>
                  </Focusable>

                  {/* Collapsible Action Section (Buttons) */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "8px 10px 10px 10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        width: "100%",
                        boxSizing: "border-box",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                    {/* Row 1: Full-width Executable Selector */}
                    <DialogButton
                      className="rd-card-btn"
                      onClick={() => handleCycleExecutable(pkg.id)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        fontSize: "10px",
                        height: "auto",
                        backgroundColor: "rgba(255, 255, 255, 0.07)",
                        borderColor: "rgba(255, 255, 255, 0.12)",
                        color: "#cbd5e1",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0, overflow: "hidden" }}>
                          <FaCog size={11} style={{ flexShrink: 0, opacity: 0.8 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "500" }}>
                            {selectedExeName}
                          </span>
                        </div>
                        {hasMultipleExes && <FaChevronDown size={8} style={{ flexShrink: 0, opacity: 0.6 }} />}
                      </div>
                    </DialogButton>

                    {/* Row 2: 3-Buttons Row (Add to Steam + Update + Delete) */}
                    <Focusable
                      flow-children="horizontal"
                      style={{
                        display: "flex",
                        gap: "5px",
                        width: "100%",
                      }}
                    >
                      {/* Button 1: Add to Steam */}
                      <DialogButton
                        className={`rd-card-btn rd-card-btn-steam ${isAdded ? "rd-steam-added" : ""}`}
                        disabled={isAdding}
                        onClick={() => handleAddToSteam(pkg, selectedExeMap[pkg.id])}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "6px 4px",
                          fontSize: "10px",
                          fontWeight: "bold",
                          height: "auto",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isAdded ? (
                            <>
                              <FaCheck color="#2ecc71" size={10} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Added ✓</span>
                            </>
                          ) : (
                            <>
                              <FaSteam size={11} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isAdding ? "Adding..." : "Add to Steam"}</span>
                            </>
                          )}
                        </div>
                      </DialogButton>

                      {/* Button 2: Update */}
                      <DialogButton
                        className={`rd-card-btn rd-card-btn-update ${pkg.has_update ? "rd-update-available" : ""}`}
                        disabled={isUpgrading}
                        onClick={() => handleUpgrade(pkg)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "6px 4px",
                          fontSize: "10px",
                          height: "auto",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <FaArrowUp size={9} style={{ flexShrink: 0 }} className={isUpgrading ? "spin-icon" : ""} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isUpgrading ? "Updating..." : "Update"}</span>
                        </div>
                      </DialogButton>

                      {/* Button 3: Delete */}
                      <DialogButton
                        className={`rd-card-btn rd-card-btn-delete ${isConfirmingDelete ? "rd-confirm-delete" : ""}`}
                        onClick={() => handleUninstall(pkg)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "6px 4px",
                          fontSize: "10px",
                          height: "auto",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <FaTrash size={9} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isConfirmingDelete ? "Confirm?" : "Delete"}</span>
                        </div>
                      </DialogButton>
                    </Focusable>
                    </div>
                  )}
                </div>
              );
            })}
          </Focusable>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
