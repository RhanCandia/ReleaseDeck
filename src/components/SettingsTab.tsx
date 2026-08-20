import {
  ButtonItem,
  DialogButton,
  Focusable,
  PanelSection,
  PanelSectionRow,
  TextField,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect } from "react";
import {
  FaSave,
  FaPlus,
  FaTrash,
  FaFolder,
  FaGithub,
  FaGitlab,
  FaGitAlt,
  FaServer,
  FaKey,
  FaRedo,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBug,
  FaTag,
} from "react-icons/fa";
import { SiItchdotio } from "react-icons/si";
import { Api } from "../api";
import { PluginSettings } from "../types";
import { parseRepoSpec } from "../utils/format";

declare const SteamClient: any;

interface SettingsTabProps {
  settings: PluginSettings | null;
  onSettingsSaved: (newSettings: PluginSettings) => void;
}

export function SettingsTab({ settings, onSettingsSaved }: SettingsTabProps) {
  const [token, setToken] = useState<string>("");
  const [installDir, setInstallDir] = useState<string>("~/Applications");
  const [newRepo, setNewRepo] = useState<string>("");
  const [pinnedRepos, setPinnedRepos] = useState<string[]>([]);
  const [deletingRepo, setDeletingRepo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [confirmRestart, setConfirmRestart] = useState<boolean>(false);

  const handleRestartSteam = () => {
    if (!confirmRestart) {
      setConfirmRestart(true);
      setTimeout(() => setConfirmRestart(false), 5000);
      return;
    }

    try {
      if (typeof SteamClient !== "undefined" && SteamClient.User?.StartRestart) {
        SteamClient.User.StartRestart(false);
      } else if ((window as any).SteamClient?.User?.StartRestart) {
        (window as any).SteamClient.User.StartRestart(false);
      } else {
        toaster.toast({
          title: "Restart Steam",
          body: "SteamClient restart API is not available in current environment.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Restart Error",
        body: e?.message || "Could not restart Steam client.",
      });
    }
  };

  useEffect(() => {
    if (settings) {
      setToken(settings.github_token || "");
      setInstallDir(settings.default_install_dir || "~/Applications");
      setPinnedRepos(settings.pinned_repos || []);
    }
  }, [settings]);

  const saveConfig = async (
    overrideRepos?: string[],
    overrideToken?: string,
    overrideDir?: string
  ) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload: Partial<PluginSettings> = {
        github_token: (overrideToken !== undefined ? overrideToken : token).trim(),
        default_install_dir: (overrideDir !== undefined ? overrideDir : installDir).trim() || "~/Applications",
        pinned_repos: overrideRepos !== undefined ? overrideRepos : pinnedRepos,
      };

      const res = await Api.saveSettings(payload);

      if (res.success && res.settings) {
        onSettingsSaved(res.settings as PluginSettings);
        setSaveSuccess(true);
        toaster.toast({
          title: "Settings Saved",
          body: "Configuration updated successfully.",
        });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        toaster.toast({
          title: "Settings Error",
          body: "Failed to save settings.",
        });
      }
    } catch (e: any) {
      toaster.toast({
        title: "Settings Error",
        body: e?.message || "Could not save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPinnedRepo = async () => {
    setAddError(null);
    const trimmed = newRepo.trim();

    if (!trimmed) {
      setAddError("Please enter a repository name or URL.");
      return;
    }

    const parsed = parseRepoSpec(trimmed);
    if (!parsed.repo || !parsed.owner) {
      setAddError("Invalid format. Use owner/repo (GitHub) or paste a full Git URL.");
      return;
    }

    const cleanRepo = parsed.canonical;

    if (pinnedRepos.some((r) => r.toLowerCase() === cleanRepo.toLowerCase())) {
      setAddError("This repository is already in your list.");
      return;
    }

    const updated = [...pinnedRepos, cleanRepo];
    setPinnedRepos(updated);
    setNewRepo("");

    // Auto-save when adding a repo
    await saveConfig(updated);
  };

  const handleRemoveRepo = async (repoToRemove: string) => {
    if (deletingRepo !== repoToRemove) {
      setDeletingRepo(repoToRemove);
      return;
    }

    const updated = pinnedRepos.filter((r) => r !== repoToRemove);
    setPinnedRepos(updated);
    setDeletingRepo(null);

    // Auto-save on removal
    await saveConfig(updated);
    toaster.toast({
      title: "Release Deck",
      body: `Removed ${repoToRemove}.`,
    });
  };

  const openExternalUrl = (url: string) => {
    try {
      if ((window as any).SteamClient?.system?.OpenURLUnderOverlay) {
        (window as any).SteamClient.system.OpenURLUnderOverlay(url);
      } else {
        window.open(url, "_blank");
      }
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", boxSizing: "border-box" }}>
      {/* ============================================================ */}
      {/* SECTION 1: TRACKED REPOSITORIES (GITHUB & CUSTOM FORGES)    */}
      {/* ============================================================ */}
      <PanelSection title="Tracked Repositories">
        {/* Add Repository Input & Button */}
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", boxSizing: "border-box" }}>
            <TextField
              label="Add Repository"
              description="Defaults to GitHub for owner/repo. Paste any custom URL (itch.io, Forgejo, Codeberg, GitLab)"
              value={newRepo}
              onChange={(e) => {
                setNewRepo(e.target.value);
                if (addError) setAddError(null);
              }}
            />

            {addError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#ff8787",
                  padding: "4px 8px",
                  backgroundColor: "rgba(255, 107, 107, 0.15)",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 107, 107, 0.3)",
                }}
              >
                <FaExclamationTriangle size={11} style={{ flexShrink: 0 }} />
                <span>{addError}</span>
              </div>
            )}

            <DialogButton
              className="rd-card-btn rd-card-btn-launch"
              disabled={!newRepo.trim() || isSaving}
              onClick={handleAddPinnedRepo}
              style={{
                padding: "7px 12px",
                fontSize: "11px",
                fontWeight: "bold",
                height: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <FaPlus size={11} />
                <span>Add to Tracked List</span>
              </div>
            </DialogButton>
          </div>
        </PanelSectionRow>

        {/* Repositories List */}
        <PanelSectionRow>
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "#9aa4af",
                marginBottom: "6px",
              }}
            >
              <span>Saved Repositories:</span>
              <span
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: "1px 6px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  fontSize: "10px",
                }}
              >
                {pinnedRepos.length}
              </span>
            </div>

            {pinnedRepos.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  textAlign: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px dashed rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#9aa4af",
                }}
              >
                No repositories added yet. Add one above to start downloading releases.
              </div>
            ) : (
              <Focusable
                flow-children="vertical"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {pinnedRepos.map((repo) => {
                  const isConfirming = deletingRepo === repo;
                  const info = parseRepoSpec(repo);

                  let icon = <FaGithub size={14} color="#74c0fc" style={{ flexShrink: 0 }} />;
                  if (info.providerType === "gitlab") {
                    icon = <FaGitlab size={14} color="#fc6d26" style={{ flexShrink: 0 }} />;
                  } else if (info.providerType === "forgejo") {
                    icon = <FaGitAlt size={14} color="#f34f29" style={{ flexShrink: 0 }} />;
                  } else if (info.providerType === "itch") {
                    icon = <SiItchdotio size={14} color="#fa5c5c" style={{ flexShrink: 0 }} />;
                  } else if (info.providerType === "custom") {
                    icon = <FaServer size={14} color="#a5d8ff" style={{ flexShrink: 0 }} />;
                  }

                  return (
                    <div
                      key={repo}
                      className="rd-card-row"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        {icon}
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, overflow: "hidden" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#ffffff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {info.displayName}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#9aa4af",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {info.subtitle}
                          </span>
                        </div>
                      </div>

                      <DialogButton
                        className={`rd-card-btn rd-card-btn-delete rd-delete-pill ${isConfirming ? "rd-confirm-delete" : ""}`}
                        onClick={() => handleRemoveRepo(repo)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                          <FaTrash size={10} style={{ flexShrink: 0 }} />
                          {isConfirming && <span>Confirm?</span>}
                        </div>
                      </DialogButton>
                    </div>
                  );
                })}
              </Focusable>
            )}
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* ============================================================ */}
      {/* SECTION 2: STORAGE & INSTALL DIRECTORY                       */}
      {/* ============================================================ */}
      <PanelSection title="Storage & Installation">
        <PanelSectionRow>
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <TextField
              label="Default Install Path"
              description="Packages are unpacked into subfolders here"
              value={installDir}
              onChange={(e) => setInstallDir(e.target.value)}
            />
            <div
              style={{
                fontSize: "10px",
                color: "#9aa4af",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginTop: "4px",
              }}
            >
              <FaFolder size={10} color="#74c0fc" />
              <span>Default: <code style={{ color: "#cbd5e1" }}>~/Applications</code></span>
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* ============================================================ */}
      {/* SECTION 3: GITHUB AUTHENTICATION                            */}
      {/* ============================================================ */}
      <PanelSection title="GitHub Authentication">
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", boxSizing: "border-box" }}>
            <TextField
              label="Personal Access Token (PAT)"
              description="Optional: Increases API rate limit from 60 to 5,000 req/hr"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <div
              style={{
                fontSize: "10px",
                color: "#9aa4af",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                lineHeight: "1.3",
              }}
            >
              <FaKey size={10} color="#ffd43b" style={{ flexShrink: 0 }} />
              <span>Classic GitHub tokens require no permissions for public repositories.</span>
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* ============================================================ */}
      {/* SECTION 4: SAVE ALL SETTINGS ACTION                          */}
      {/* ============================================================ */}
      <PanelSection>
        <PanelSectionRow>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", boxSizing: "border-box" }}>
            <DialogButton
              className="rd-card-btn rd-card-btn-launch"
              disabled={isSaving}
              onClick={() => saveConfig()}
              style={{
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: "bold",
                height: "auto",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {saveSuccess ? (
                  <>
                    <FaCheckCircle color="#2ecc71" size={13} />
                    <span>Settings Saved!</span>
                  </>
                ) : (
                  <>
                    <FaSave size={13} />
                    <span>{isSaving ? "Saving..." : "Save Settings"}</span>
                  </>
                )}
              </div>
            </DialogButton>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* ============================================================ */}
      {/* SECTION 5: STEAM ACTIONS                                     */}
      {/* ============================================================ */}
      <PanelSection title="Steam Actions">
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", boxSizing: "border-box" }}>
            <ButtonItem
              layout="below"
              onClick={handleRestartSteam}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
                <FaRedo className={confirmRestart ? "spin-icon" : ""} size={11} />
                <span>{confirmRestart ? "Confirm Restart Steam?" : "Restart Steam Client"}</span>
              </div>
            </ButtonItem>
            <div
              style={{
                fontSize: "10px",
                color: "#9aa4af",
                lineHeight: "1.3",
              }}
            >
              Restarts Steam client to instantly refresh Non-Steam game library shortcuts.
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* ============================================================ */}
      {/* SECTION 6: ABOUT RELEASE DECK                                */}
      {/* ============================================================ */}
      <PanelSection title="About Release Deck">
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", boxSizing: "border-box" }}>
            {/* Identity Card */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>Release Deck</span>
                <span
                  style={{
                    backgroundColor: "rgba(26, 159, 255, 0.2)",
                    border: "1px solid rgba(26, 159, 255, 0.45)",
                    color: "#74c0fc",
                    fontSize: "9px",
                    fontWeight: "700",
                    padding: "1px 6px",
                    borderRadius: "10px",
                  }}
                >
                  v0.2.0
                </span>
              </div>
              <span style={{ fontSize: "10.5px", color: "#9aa4af", lineHeight: "1.35" }}>
                GitHub release package downloader & game manager for SteamOS Gaming Mode.
              </span>
              <span style={{ fontSize: "9.5px", color: "#6c7a89", marginTop: "2px" }}>
                By Team Release Deck
              </span>
            </div>

            {/* Quick Action Links */}
            <Focusable
              flow-children="horizontal"
              style={{
                display: "flex",
                gap: "6px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <DialogButton
                className="rd-card-btn"
                onClick={() => openExternalUrl("https://github.com/RhanCandia/decky-sidedeck")}
                style={{
                  flex: 1,
                  padding: "7px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  height: "auto",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <FaGithub size={12} />
                  <span>GitHub</span>
                </div>
              </DialogButton>

              <DialogButton
                className="rd-card-btn"
                onClick={() => openExternalUrl("https://github.com/RhanCandia/decky-sidedeck/issues")}
                style={{
                  flex: 1,
                  padding: "7px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  height: "auto",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <FaBug size={11} />
                  <span>Issues</span>
                </div>
              </DialogButton>

              <DialogButton
                className="rd-card-btn"
                onClick={() => openExternalUrl("https://github.com/RhanCandia/decky-sidedeck/releases")}
                style={{
                  flex: 1,
                  padding: "7px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  height: "auto",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <FaTag size={11} />
                  <span>Releases</span>
                </div>
              </DialogButton>
            </Focusable>
          </div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
}
