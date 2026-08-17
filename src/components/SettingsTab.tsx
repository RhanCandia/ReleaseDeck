import {
  ButtonItem,
  Field,
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
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: "11px", opacity: 0.7, lineHeight: "1.3", wordBreak: "break-word" }}>
          <FaInfoCircle /> Adding a classic GitHub token prevents "403 Rate Limit" errors.
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

      {/* Favorite / Pinned Repositories */}
      <PanelSectionRow>
        <Field label="Favorite Repositories">
          <Focusable
            flow-children="vertical"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: "100%",
              boxSizing: "border-box",
              marginTop: "4px",
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
                  fontSize: "11px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                <span style={{ wordBreak: "break-all", flex: 1, marginRight: "6px" }}>{repo}</span>
                <span
                  style={{ cursor: "pointer", color: "#ff6b6b", padding: "4px", flexShrink: 0 }}
                  onClick={() => handleRemovePinnedRepo(repo)}
                >
                  <FaTrash />
                </span>
              </Focusable>
            ))}

            {/* Add New Repo Row (Stacked / Flex constrained) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginTop: "6px" }}>
              <TextField
                label="Add repo (owner/repo)"
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
              />
              <ButtonItem layout="below" onClick={handleAddPinnedRepo}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <FaPlus /> Add to Favorites
                </div>
              </ButtonItem>
            </div>
          </Focusable>
        </Field>
      </PanelSectionRow>

      {/* Save Settings Action */}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={isSaving}
          onClick={handleSaveSettings}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <FaSave />
            {isSaving ? "Saving..." : "Save Settings"}
          </div>
        </ButtonItem>
      </PanelSectionRow>

      {/* Version Footer */}
      <PanelSectionRow>
        <div style={{ textAlign: "center", fontSize: "10px", opacity: 0.5, padding: "4px 0" }}>
          ReleaseDeck v0.1.0-beta.2 • SteamOS Gaming Mode
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
