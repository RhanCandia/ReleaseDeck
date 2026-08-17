import { callable } from "@decky/api";
import { GitHubRelease, InstalledPackage, PluginSettings } from "./types";

const fetchReleasesCallable = callable<[repo: string], { success: boolean; releases?: GitHubRelease[]; error?: string; is_rate_limit?: boolean }>("fetch_releases");
const startDownloadCallable = callable<
  [repo: string, name: string, version: string, asset_name: string, download_url: string, custom_install_dir?: string],
  { success: boolean; package?: InstalledPackage; install_path?: string; error?: string }
>("start_download");
const cancelDownloadCallable = callable<[], { success: boolean; error?: string }>("cancel_download");
const getInstalledPackagesCallable = callable<[], InstalledPackage[]>("get_installed_packages");
const launchPackageCallable = callable<[package_id: string], { success: boolean; executable?: string; error?: string }>("launch_package");
const uninstallPackageCallable = callable<[package_id: string, delete_files: boolean], { success: boolean; error?: string }>("uninstall_package");
const checkAllUpdatesCallable = callable<[], InstalledPackage[]>("check_all_updates");
const upgradePackageCallable = callable<[package_id: string], { success: boolean; package?: InstalledPackage; error?: string }>("upgrade_package");
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
  launchPackage: (packageId: string) => launchPackageCallable(packageId),
  uninstallPackage: (packageId: string, deleteFiles: boolean = true) => uninstallPackageCallable(packageId, deleteFiles),
  checkAllUpdates: () => checkAllUpdatesCallable(),
  upgradePackage: (packageId: string) => upgradePackageCallable(packageId),
  getSettings: () => getSettingsCallable(),
  saveSettings: (settings: Partial<PluginSettings>) => saveSettingsCallable(settings),
};
