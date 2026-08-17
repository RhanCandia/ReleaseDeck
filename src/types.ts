export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  download_url: string;
  content_type: string;
  download_count: number;
  is_recommended: boolean;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  prerelease: boolean;
  draft: boolean;
  published_at: string;
  body: string;
  html_url: string;
  assets: GitHubAsset[];
}

export interface AppExecutableInfo {
  path: string;
  rel_path: string;
  filename: string;
  is_default: boolean;
}

export interface InstalledPackage {
  id: string;
  name: string;
  repository: string;
  installed_version: string;
  latest_version: string;
  has_update: boolean;
  installed_asset: string;
  install_path: string;
  installed_at: string;
  size_bytes: number;
}

export interface DownloadProgress {
  repo: string;
  name: string;
  percent: number;
  speed_mb_s: number;
  downloaded: number;
  total: number;
  status: 'downloading' | 'extracting' | 'complete' | 'error';
}

export interface PluginSettings {
  github_token: string;
  default_install_dir: string;
  pinned_repos: string[];
}
