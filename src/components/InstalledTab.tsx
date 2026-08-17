import {
  ButtonItem,
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
  FaFolder,
  FaHdd,
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

  const handleUpgrade = async (pkg: InstalledPackage) => {
    setUpgradingId(pkg.id);
    toaster.toast({
      title: "ReleaseDeck",
      body: `Upgrading ${pkg.name} to ${pkg.latest_version}...`,
    });

    try {
      const res = await Api.upgradePackage(pkg.id);
      if (res.success) {
        toaster.toast({
          title: "Upgrade Complete",
          body: `${pkg.name} updated to ${pkg.latest_version}!`,
        });
        onRefresh();
      } else {
        toaster.toast({
          title: "Upgrade Failed",
          body: res.error || "Upgrade failed.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Upgrade Error",
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
          body: `Uninstalled ${pkg.name}.`,
        });
        onRefresh();
      } else {
        toaster.toast({
          title: "Uninstall Error",
          body: res.error || "Could not uninstall package.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Uninstall Error",
        body: e?.message || "Unexpected error.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PanelSection title={`Installed (${packages.length})`}>
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
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>No Packages Installed Yet</div>
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

      {/* Package List */}
      {!isLoading &&
        packages.map((pkg) => {
          const isUpgrading = upgradingId === pkg.id;
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
                {/* Header: Name & Update Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "12px", wordBreak: "break-word" }}>{pkg.name}</div>
                    <div style={{ fontSize: "10px", opacity: 0.65, wordBreak: "break-all" }}>{pkg.repository}</div>
                  </div>
                  {pkg.has_update && (
                    <span
                      style={{
                        backgroundColor: "#f59f00",
                        color: "#000",
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
                  )}
                </div>

                {/* Metadata Details */}
                <div style={{ fontSize: "10px", opacity: 0.8, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div>
                    Ver: <strong>{pkg.installed_version}</strong>
                    {pkg.has_update && (
                      <span style={{ color: "#ffd43b", marginLeft: "4px" }}>
                        ➔ <strong>{pkg.latest_version}</strong>
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <FaHdd /> Size: {formatBytes(pkg.size_bytes)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", wordBreak: "break-all" }}>
                    <FaFolder /> Path: <code>{pkg.install_path}</code>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px" }}>
                  {pkg.has_update && (
                    <ButtonItem
                      layout="below"
                      disabled={isUpgrading}
                      onClick={() => handleUpgrade(pkg)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "11px" }}>
                        <FaArrowUp />
                        {isUpgrading ? "Updating..." : `Update to ${pkg.latest_version}`}
                      </div>
                    </ButtonItem>
                  )}

                  <ButtonItem
                    layout="below"
                    onClick={() => handleUninstall(pkg)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        fontSize: "11px",
                        color: isConfirmingDelete ? "#ff6b6b" : undefined,
                      }}
                    >
                      <FaTrash />
                      {isConfirmingDelete ? "Confirm Delete?" : "Uninstall"}
                    </div>
                  </ButtonItem>
                </div>
              </div>
            </PanelSectionRow>
          );
        })}
    </PanelSection>
  );
}
