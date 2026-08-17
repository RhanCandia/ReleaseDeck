import {
  ButtonItem,
  DialogButton,
  Focusable,
  PanelSection,
  PanelSectionRow,
  Spinner,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState } from "react";
import {
  FaSync,
  FaTrash,
  FaArrowUp,
  FaPlay,
  FaGithub,
  FaBoxOpen,
  FaExclamationCircle,
} from "react-icons/fa";
import { Api } from "../api";
import { InstalledPackage } from "../types";
import { formatBytes } from "../utils/format";

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
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const updatedList = await Api.checkAllUpdates();
      const updateCount = updatedList.filter((p) => p.has_update).length;
      toaster.toast({
        title: "ReleaseDeck",
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

  const handleLaunch = async (pkg: InstalledPackage) => {
    setLaunchingId(pkg.id);
    toaster.toast({
      title: "ReleaseDeck",
      body: `Launching ${pkg.name || pkg.repository}...`,
    });

    try {
      const res = await Api.launchPackage(pkg.id);
      if (res.success) {
        toaster.toast({
          title: "App Launched",
          body: `Running ${pkg.name || pkg.repository}`,
        });
      } else {
        toaster.toast({
          title: "Launch Failed",
          body: res.error || "Could not launch executable.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Launch Error",
        body: e?.message || "Unexpected error while launching.",
      });
    } finally {
      setLaunchingId(null);
    }
  };

  const handleUpgrade = async (pkg: InstalledPackage) => {
    setUpgradingId(pkg.id);
    toaster.toast({
      title: "ReleaseDeck",
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
          title: "ReleaseDeck",
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
    <PanelSection title={`Apps (${packages.length})`}>
      {/* Header Actions */}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={isLoading || isCheckingUpdates}
          onClick={handleCheckUpdates}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}>
            <FaSync className={isCheckingUpdates ? "spin-icon" : ""} />
            {isCheckingUpdates ? "Checking..." : "Check for Updates"}
          </div>
        </ButtonItem>
      </PanelSectionRow>

      {/* Loading state */}
      {isLoading && (
        <PanelSectionRow>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px" }}>
            <Spinner />
          </div>
        </PanelSectionRow>
      )}

      {/* Empty State */}
      {!isLoading && packages.length === 0 && (
        <PanelSectionRow>
          <div
            style={{
              padding: "16px 8px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              opacity: 0.8,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <FaBoxOpen size={28} />
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>No Apps Installed Yet</div>
            <div style={{ fontSize: "11px", opacity: 0.7 }}>
              Download game ports and tools directly from GitHub.
            </div>
            <div style={{ marginTop: "6px", width: "100%" }}>
              <ButtonItem layout="below" onClick={onNavigateToDownload}>
                <span style={{ fontSize: "11px" }}>Browse & Download</span>
              </ButtonItem>
            </div>
          </div>
        </PanelSectionRow>
      )}

      {/* App List */}
      {!isLoading &&
        packages.map((pkg) => {
          const isUpgrading = upgradingId === pkg.id;
          const isLaunching = launchingId === pkg.id;
          const isConfirmingDelete = deletingId === pkg.id;

          return (
            <PanelSectionRow key={pkg.id}>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: pkg.has_update ? "1px solid #f59f00" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Header: Repo Name & Update Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                    <FaGithub style={{ flexShrink: 0, opacity: 0.8, fontSize: "13px" }} />
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "12px",
                        color: "#ffffff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={pkg.repository}
                    >
                      {pkg.repository || pkg.name}
                    </div>
                  </div>
                  {pkg.has_update ? (
                    <span
                      style={{
                        backgroundColor: "#f59f00",
                        color: "#000000",
                        fontSize: "9px",
                        fontWeight: "bold",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        flexShrink: 0,
                      }}
                    >
                      <FaExclamationCircle /> Update
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        color: "#969ba3",
                        fontSize: "9px",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        flexShrink: 0,
                      }}
                    >
                      {pkg.installed_version}
                    </span>
                  )}
                </div>

                {/* Subtext info */}
                <div style={{ fontSize: "10px", color: "#969ba3", display: "flex", justifyContent: "space-between", gap: "4px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pkg.name && pkg.name !== pkg.repository ? pkg.name : `Ver: ${pkg.installed_version}`}
                  </span>
                  <span style={{ flexShrink: 0 }}>
                    {formatBytes(pkg.size_bytes)}
                  </span>
                </div>

                {/* 3 Buttons: Launch, Update, Delete */}
                <Focusable
                  flow-children="horizontal"
                  style={{
                    display: "flex",
                    gap: "4px",
                    width: "100%",
                    marginTop: "2px",
                  }}
                >
                  <DialogButton
                    className="rd-card-btn rd-card-btn-launch"
                    disabled={isLaunching}
                    onClick={() => handleLaunch(pkg)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "6px 2px",
                      fontSize: "11px",
                      height: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <FaPlay size={10} style={{ flexShrink: 0 }} />
                      <span>{isLaunching ? "Starting..." : "Launch"}</span>
                    </div>
                  </DialogButton>

                  <DialogButton
                    className={`rd-card-btn rd-card-btn-update ${pkg.has_update ? "rd-update-available" : ""}`}
                    disabled={isUpgrading}
                    onClick={() => handleUpgrade(pkg)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "6px 2px",
                      fontSize: "11px",
                      height: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <FaArrowUp size={10} style={{ flexShrink: 0 }} className={isUpgrading ? "spin-icon" : ""} />
                      <span>{isUpgrading ? "Updating..." : "Update"}</span>
                    </div>
                  </DialogButton>

                  <DialogButton
                    className={`rd-card-btn rd-card-btn-delete ${isConfirmingDelete ? "rd-confirm-delete" : ""}`}
                    onClick={() => handleUninstall(pkg)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "6px 2px",
                      fontSize: "11px",
                      height: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <FaTrash size={10} style={{ flexShrink: 0 }} />
                      <span>{isConfirmingDelete ? "Confirm?" : "Delete"}</span>
                    </div>
                  </DialogButton>
                </Focusable>
              </div>
            </PanelSectionRow>
          );
        })}
    </PanelSection>
  );
}
