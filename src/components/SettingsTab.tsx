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
    <PanelSection title="Settings & Configuration">
      {/* GitHub Token Field */}
      <PanelSectionRow>
        <TextField
          label="GitHub Personal Access Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: "11px", opacity: 0.7, lineHeight: "1.4" }}>
          <FaInfoCircle /> Adding a classic GitHub token (no permissions needed) prevents "403 Rate Limit" errors when browsing releases.
        </div>
      </PanelSectionRow>

      {/* Default Install Directory */}
      <PanelSectionRow>
        <TextField
          label="Default Install Directory"
          value={installDir}
          onChange={(e) => setInstallDir(e.target.value)}
        />
      </PanelSectionRow>

      {/* Favorite / Pinned Repositories */}
      <PanelSectionRow>
        <Field label="Favorite Repositories">
          <Focusable
            flow-children="vertical"
            style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginTop: "4px" }}
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
                  fontSize: "12px",
                }}
              >
                <span>{repo}</span>
                <span
                  style={{ cursor: "pointer", color: "#ff6b6b", padding: "2px 6px" }}
                  onClick={() => handleRemovePinnedRepo(repo)}
                >
                  <FaTrash />
                </span>
              </Focusable>
            ))}

            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Add repo (owner/repo)"
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                />
              </div>
              <div style={{ alignSelf: "flex-end", marginBottom: "4px" }}>
                <ButtonItem layout="below" onClick={handleAddPinnedRepo}>
                  <FaPlus />
                </ButtonItem>
              </div>
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
        <div style={{ textAlign: "center", fontSize: "11px", opacity: 0.5, padding: "8px" }}>
          ReleaseDeck v0.1.0-beta.2 • SteamOS Gaming Mode
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
