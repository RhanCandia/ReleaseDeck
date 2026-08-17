import {
  ButtonItem,
  Focusable,
  PanelSection,
  PanelSectionRow,
  TextField,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useState, useEffect } from "react";
import { FaSave, FaPlus, FaTrash, FaInfoCircle } from "react-icons/fa";
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

      {/* Favorite Repositories Header (No 2-Column Field component) */}
      <PanelSectionRow>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>
            Favorite Repositories ({pinnedRepos.length})
          </div>

          {pinnedRepos.length === 0 ? (
            <div style={{ fontSize: "11px", opacity: 0.6, fontStyle: "italic", marginBottom: "8px" }}>
              No favorite repositories added yet.
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
                marginBottom: "8px",
              }}
            >
              {pinnedRepos.map((repo) => (
                <Focusable
                  key={repo}
                  flow-children="horizontal"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    fontSize: "11px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                >
                  <span style={{ wordBreak: "break-all", flex: 1, marginRight: "6px" }}>{repo}</span>
                  <span
                    style={{ cursor: "pointer", color: "#ff6b6b", padding: "2px 6px", flexShrink: 0 }}
                    onClick={() => handleRemovePinnedRepo(repo)}
                  >
                    <FaTrash />
                  </span>
                </Focusable>
              ))}
            </Focusable>
          )}

          {/* Add New Repo Input & Button */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }}>
            <TextField
              label="Add Favorite Repo"
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
                <FaPlus /> Add to Favorites
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
