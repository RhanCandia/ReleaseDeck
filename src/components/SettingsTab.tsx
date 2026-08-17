import {
  ButtonItem,
  Focusable,
  PanelSection,
  PanelSectionRow,
  TextField,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect } from "react";
import { FaSave, FaPlus, FaTrash, FaInfoCircle, FaFolder } from "react-icons/fa";
import { Api } from "../api";
import { PluginSettings } from "../types";

interface SettingsTabProps {
  settings: PluginSettings | null;
  onSettingsSaved: (newSettings: PluginSettings) => void;
}

export function SettingsTab({ settings, onSettingsSaved }: SettingsTabProps) {
  const [token, setToken] = useState<string>("");
  const [installDir, setInstallDir] = useState<string>("~/Applications");
  const [newRepo, setNewRepo] = useState<string>("");
  const [pinnedRepos, setPinnedRepos] = useState<string[]>([]);
  const [focusedRepo, setFocusedRepo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setToken(settings.github_token || "");
      setInstallDir(settings.default_install_dir || "~/Applications");
      setPinnedRepos(settings.pinned_repos || []);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await Api.saveSettings({
        github_token: token.trim(),
        default_install_dir: installDir.trim(),
        pinned_repos: pinnedRepos,
      });

      if (res.success && res.settings) {
        onSettingsSaved(res.settings);
        toaster.toast({
          title: "ReleaseDeck",
          body: "Settings saved successfully!",
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

  const handleAddPinnedRepo = () => {
    const trimmed = newRepo.trim();
    if (!trimmed) return;
    if (pinnedRepos.includes(trimmed)) return;

    const updated = [...pinnedRepos, trimmed];
    setPinnedRepos(updated);
    setNewRepo("");
  };

  const handleRemovePinnedRepo = (repoToRemove: string) => {
    const updated = pinnedRepos.filter((r) => r !== repoToRemove);
    setPinnedRepos(updated);
    toaster.toast({
      title: "ReleaseDeck",
      body: `Removed ${repoToRemove}. Remember to Save Settings.`,
    });
  };

  return (
    <PanelSection title="Settings">
      {/* GitHub Token Field */}
      <PanelSectionRow>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <TextField
            label="GitHub Personal Access Token"
            description="Optional: Prevents 403 API rate limits"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      </PanelSectionRow>

      {/* Default Install Directory */}
      <PanelSectionRow>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <TextField
            label="Default Install Directory"
            value={installDir}
            onChange={(e) => setInstallDir(e.target.value)}
          />
        </div>
      </PanelSectionRow>

      {/* Saved Repositories Header */}
      <PanelSectionRow>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
            Saved Repositories ({pinnedRepos.length})
          </div>

          {pinnedRepos.length === 0 ? (
            <div style={{ fontSize: "11px", opacity: 0.6, fontStyle: "italic", marginBottom: "8px" }}>
              No saved repositories added yet.
            </div>
          ) : (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", opacity: 0.65, marginBottom: "3px" }}>
                Press (A) to delete repository:
              </div>
              <Focusable
                flow-children="vertical"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {pinnedRepos.map((repo) => {
                  const isFocused = focusedRepo === repo;
                  return (
                    <Focusable
                      key={repo}
                      onFocus={() => setFocusedRepo(repo)}
                      onBlur={() => setFocusedRepo((current) => (current === repo ? null : current))}
                      onActivate={() => handleRemovePinnedRepo(repo)}
                      onClick={() => handleRemovePinnedRepo(repo)}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "4px",
                        backgroundColor: isFocused ? "#1a9fff" : "rgba(255, 255, 255, 0.04)",
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
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                        <FaFolder
                          style={{
                            color: isFocused ? "#ffffff" : "#74c0fc",
                            flexShrink: 0,
                            fontSize: "10px",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: isFocused ? "bold" : "normal",
                            color: "#ffffff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {repo}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "10px",
                          color: isFocused ? "#ffffff" : "#ff6b6b",
                          flexShrink: 0,
                          opacity: isFocused ? 1 : 0.85,
                        }}
                      >
                        <FaTrash size={10} />
                        <span>Delete</span>
                      </div>
                    </Focusable>
                  );
                })}
              </Focusable>
            </div>
          )}

          {/* Add New Repo Input & Button */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }}>
            <TextField
              label="Add Repository"
              description="Format: owner/repo"
              value={newRepo}
              onChange={(e) => setNewRepo(e.target.value)}
            />
            <ButtonItem
              layout="below"
              disabled={!newRepo.trim()}
              onClick={handleAddPinnedRepo}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}>
                <FaPlus /> Add Repository
              </div>
            </ButtonItem>
          </div>
        </div>
      </PanelSectionRow>

      {/* Save Settings Action */}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={isSaving}
          onClick={handleSaveSettings}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}>
            <FaSave />
            {isSaving ? "Saving..." : "Save Settings"}
          </div>
        </ButtonItem>
      </PanelSectionRow>

      {/* Info note */}
      <PanelSectionRow>
        <div style={{ fontSize: "10px", opacity: 0.6, lineHeight: "1.3", wordBreak: "break-word", padding: "4px 0" }}>
          <FaInfoCircle /> Classic GitHub tokens need no special permissions.
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
