import { callable } from "@decky/api";
import { GitHubRelease, InstalledPackage, PluginSettings, DownloadProgress, AppExecutableInfo } from "./types";

const fetchReleasesCallable = callable<[repo: string], { success: boolean; releases?: GitHubRelease[]; error?: string; is_rate_limit?: boolean }>("fetch_releases");
const startDownloadCallable = callable<
  [repo: string, name: string, version: string, asset_name: string, download_url: string, custom_install_dir?: string],
  { success: boolean; package?: InstalledPackage; install_path?: string; error?: string }
>("start_download");
const cancelDownloadCallable = callable<[], { success: boolean; error?: string }>("cancel_download");
const getInstalledPackagesCallable = callable<[], InstalledPackage[]>("get_installed_packages");
const getAppExecutablesCallable = callable<[package_id: string], { success: boolean; name?: string; executables?: AppExecutableInfo[]; install_path?: string; error?: string }>("get_app_executables");
const getAppExecutableCallable = callable<[package_id: string, target_exe?: string], { success: boolean; name?: string; exe_path?: string; install_path?: string; error?: string }>("get_app_executable");
const addToSteamCallable = callable<[package_id: string, target_exe?: string], { success: boolean; name?: string; executable?: string; error?: string }>("add_to_steam");
const uninstallPackageCallable = callable<[package_id: string, delete_files: boolean], { success: boolean; error?: string }>("uninstall_package");
const checkAllUpdatesCallable = callable<[], InstalledPackage[]>("check_all_updates");
const upgradePackageCallable = callable<[package_id: string], { success: boolean; package?: InstalledPackage; error?: string }>("upgrade_package");
const getDownloadStatusCallable = callable<[], DownloadProgress | null>("get_download_status");
const getSettingsCallable = callable<[], PluginSettings>("get_settings");
const saveSettingsCallable = callable<[settings: Partial<PluginSettings>], { success: boolean; settings?: PluginSettings }>("save_settings");

export const Api = {
  fetchReleases: (repo: string) => fetchReleasesCallable(repo),
  startDownload: (params: {
    repo: string;
    name: string;
    version: string;
    asset_name: string;
    download_url: string;
    custom_install_dir?: string;
  }) => startDownloadCallable(
    params.repo,
    params.name,
    params.version,
    params.asset_name,
    params.download_url,
    params.custom_install_dir
  ),
  cancelDownload: () => cancelDownloadCallable(),
  getInstalledPackages: () => getInstalledPackagesCallable(),
  getAppExecutables: (packageId: string) => getAppExecutablesCallable(packageId),
  getAppExecutable: (packageId: string, targetExe?: string) => getAppExecutableCallable(packageId, targetExe),
  addToSteam: (packageId: string, targetExe?: string) => addToSteamCallable(packageId, targetExe),
  uninstallPackage: (packageId: string, deleteFiles: boolean = true) => uninstallPackageCallable(packageId, deleteFiles),
  checkAllUpdates: () => checkAllUpdatesCallable(),
  upgradePackage: (packageId: string) => upgradePackageCallable(packageId),
  getDownloadStatus: () => getDownloadStatusCallable(),
  getSettings: () => getSettingsCallable(),
  saveSettings: (settings: Partial<PluginSettings>) => saveSettingsCallable(settings),
};
