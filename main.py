import asyncio
import os
import sys
import tempfile
from typing import Any, Dict, List, Optional

# Enable importing from local backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import subprocess
import decky
from backend.git_providers import (
    UnifiedGitClient,
    GitHubClient,
    GitProviderError,
    GitHubAPIError,
    parse_repo_spec,
)
from backend.downloader import (
    Downloader,
    DownloadCancelledError,
    ExtractionError,
    find_executable,
    create_app_launcher,
    list_executables,
)
from backend.package_db import PackageDB, DEFAULT_INSTALL_DIR
from backend.updater import is_newer_version, find_matching_upgrade_asset

def get_clean_app_name(pkg: Dict[str, Any]) -> str:
    name = pkg.get("name", "").strip()
    if name and not (name.startswith("v") and len(name) > 1 and name[1].isdigit()):
        return name
    repo = pkg.get("repository", "")
    if repo:
        try:
            return parse_repo_spec(repo).display_name
        except Exception:
            return repo.strip("/").split("/")[-1]
    return "Application"

class Plugin:
    def __init__(self):
        self.github_client = GitHubClient()
        self.downloader = Downloader()
        self.package_db: Optional[PackageDB] = None
        self.is_downloading = False
        self.current_download_task: Optional[asyncio.Task] = None
        self.current_download_status: Optional[Dict[str, Any]] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def _emit_event(self, event_name: str, data: Any):
        if event_name == "download_progress":
            self.current_download_status = data
        try:
            res = decky.emit(event_name, data)
            if asyncio.iscoroutine(res):
                await res
        except Exception as e:
            decky.logger.debug(f"Failed to emit {event_name}: {e}")

    def _sync_emit_event(self, event_name: str, data: Any):
        if event_name == "download_progress":
            self.current_download_status = data
        try:
            if self.loop and self.loop.is_running():
                asyncio.run_coroutine_threadsafe(self._emit_event(event_name, data), self.loop)
            else:
                res = decky.emit(event_name, data)
                if asyncio.iscoroutine(res):
                    if self.loop and self.loop.is_running():
                        asyncio.run_coroutine_threadsafe(res, self.loop)
                    else:
                        asyncio.create_task(res)
        except Exception as e:
            decky.logger.error(f"Error in sync emit: {e}")

    async def _main(self):
        """Executed on Decky plugin startup."""
        self.loop = asyncio.get_event_loop()
        settings_dir = getattr(decky, "DECKY_SETTINGS_DIR", os.path.expanduser("~/.config/ReleaseDeck"))
        self.package_db = PackageDB(settings_dir)
        
        # Load token if present
        settings = self.package_db.get_settings()
        token = settings.get("github_token")
        if token:
            self.github_client.set_token(token)
            
        decky.logger.info("ReleaseDeck plugin initialized successfully.")

    async def _unload(self):
        """Executed when plugin is stopped."""
        if self.is_downloading:
            self.downloader.cancel()
        decky.logger.info("ReleaseDeck plugin unloaded.")

    async def _uninstall(self):
        """Executed when plugin is uninstalled from Decky."""
        decky.logger.info("ReleaseDeck plugin uninstalled.")

    # --- Frontend Callable API Methods ---

    async def fetch_releases(self, repo: str) -> Dict[str, Any]:
        """Fetch all release versions and downloadable assets for a repository."""
        try:
            releases = await self.github_client.fetch_releases(repo)
            return {"success": True, "releases": releases}
        except GitHubAPIError as e:
            decky.logger.error(f"Failed to fetch releases for {repo}: {e}")
            return {"success": False, "error": str(e), "is_rate_limit": e.is_rate_limit}
        except Exception as e:
            decky.logger.error(f"Unexpected error in fetch_releases: {e}")
            return {"success": False, "error": str(e), "is_rate_limit": False}

    async def start_download(
        self,
        repo: str,
        name: str,
        version: str,
        asset_name: str,
        download_url: str,
        custom_install_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """Download, unpack, and register a release package."""
        if self.is_downloading:
            return {"success": False, "error": "A download is already in progress."}

        self.is_downloading = True
        init_progress = {
            "repo": repo,
            "name": name,
            "percent": 0.0,
            "speed_mb_s": 0.0,
            "downloaded": 0,
            "total": 0,
            "status": "downloading"
        }
        self.current_download_status = init_progress
        self._sync_emit_event("download_progress", init_progress)

        temp_dir = tempfile.mkdtemp(prefix="releasedeck_")
        download_file_path = os.path.join(temp_dir, asset_name)

        # Determine target folder name (e.g. repo name or custom name)
        try:
            repo_name = parse_repo_spec(repo).repo
        except Exception:
            repo_name = repo.strip("/").split("/")[-1]
        target_base = custom_install_dir or (
            self.package_db.get_settings().get("default_install_dir") if self.package_db else DEFAULT_INSTALL_DIR
        )
        target_dir = os.path.join(os.path.expanduser(target_base), repo_name)

        def on_progress(percent: float, speed_mb_s: float, downloaded: int, total: int):
            self._sync_emit_event("download_progress", {
                "repo": repo,
                "name": name,
                "percent": percent,
                "speed_mb_s": speed_mb_s,
                "downloaded": downloaded,
                "total": total,
                "status": "downloading"
            })

        try:
            decky.logger.info(f"Starting download for {repo} ({asset_name}) -> {download_file_path}")
            direct_download_url = await asyncio.to_thread(self.github_client.resolve_download_url, download_url)
            await self.downloader.download_file(direct_download_url, download_file_path, on_progress)

            # Decompress / install
            await self._emit_event("download_progress", {
                "repo": repo,
                "name": name,
                "percent": 95.0,
                "speed_mb_s": 0.0,
                "downloaded": 0,
                "total": 0,
                "status": "extracting"
            })
            
            decky.logger.info(f"Extracting {download_file_path} into {target_dir}")
            await asyncio.to_thread(self.downloader.extract_archive, download_file_path, target_dir)

            # Register in package DB
            if self.package_db:
                pkg_record = self.package_db.add_or_update_package(
                    repo=repo,
                    name=name or repo_name,
                    version=version,
                    asset_name=asset_name,
                    install_path=target_dir
                )
            else:
                pkg_record = {}

            await self._emit_event("download_progress", {
                "repo": repo,
                "name": name,
                "percent": 100.0,
                "speed_mb_s": 0.0,
                "downloaded": 0,
                "total": 0,
                "status": "complete"
            })

            return {"success": True, "package": pkg_record, "install_path": target_dir}

        except DownloadCancelledError:
            decky.logger.info(f"Download cancelled for {repo}")
            self.current_download_status = None
            return {"success": False, "error": "Download was cancelled."}
        except ExtractionError as e:
            decky.logger.error(f"Extraction error: {e}")
            self.current_download_status = None
            return {"success": False, "error": f"Extraction failed: {str(e)}"}
        except Exception as e:
            decky.logger.error(f"Download/install failed: {e}")
            self.current_download_status = None
            return {"success": False, "error": str(e)}
        finally:
            self.is_downloading = False
            # Clean up temp file
            if os.path.exists(temp_dir):
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)

    async def get_download_status(self) -> Optional[Dict[str, Any]]:
        """Retrieve current live download status and metrics."""
        return self.current_download_status

    async def cancel_download(self) -> Dict[str, Any]:
        """Cancel current ongoing download."""
        if self.is_downloading:
            self.downloader.cancel()
            self.current_download_status = None
            return {"success": True}
        return {"success": False, "error": "No download in progress."}

    async def get_installed_packages(self) -> List[Dict[str, Any]]:
        """Retrieve all currently tracked installed packages."""
        if not self.package_db:
            return []
        return self.package_db.get_all_packages()

    async def get_app_executables(self, package_id: str) -> Dict[str, Any]:
        """List all candidate executables found in the package install folder."""
        if not self.package_db:
            return {"success": False, "error": "Database not initialized."}

        pkg = self.package_db.get_package(package_id)
        if not pkg:
            return {"success": False, "error": "Package not found."}

        install_path = pkg.get("install_path", "")
        display_name = get_clean_app_name(pkg)
        executables = list_executables(install_path)

        return {
            "success": True,
            "name": display_name,
            "executables": executables,
            "install_path": install_path,
        }

    async def get_app_executable(self, package_id: str, target_exe: Optional[str] = None) -> Dict[str, Any]:
        """Find executable path and ensure clean launcher exists for direct SteamClient shortcut creation."""
        if not self.package_db:
            return {"success": False, "error": "Database not initialized."}

        pkg = self.package_db.get_package(package_id)
        if not pkg:
            return {"success": False, "error": "Package not found."}

        install_path = pkg.get("install_path", "")
        display_name = get_clean_app_name(pkg)

        launcher_path = create_app_launcher(install_path, display_name, target_exe=target_exe)
        if not launcher_path or not os.path.exists(launcher_path):
            exe_path = target_exe or find_executable(install_path)
            if not exe_path or not os.path.exists(exe_path):
                return {"success": False, "error": f"No executable found in {install_path}"}
            launcher_path = exe_path

        try:
            st = os.stat(launcher_path)
            os.chmod(launcher_path, st.st_mode | 0o755)
        except Exception:
            pass

        return {
            "success": True,
            "name": display_name,
            "exe_path": launcher_path,
            "install_path": install_path,
        }

    async def add_to_steam(self, package_id: str, target_exe: Optional[str] = None) -> Dict[str, Any]:
        """Add the installed package executable to Steam as a Non-Steam game shortcut."""
        if not self.package_db:
            return {"success": False, "error": "Database not initialized."}
        
        pkg = self.package_db.get_package(package_id)
        if not pkg:
            return {"success": False, "error": "Package not found."}

        install_path = pkg.get("install_path", "")
        display_name = get_clean_app_name(pkg)

        # Ensure a launcher named after the app exists (e.g. SymphonyRecomp)
        launcher_path = create_app_launcher(install_path, display_name, target_exe=target_exe)
        if not launcher_path or not os.path.exists(launcher_path):
            return {"success": False, "error": f"No executable found in {install_path}"}

        try:
            try:
                st = os.stat(launcher_path)
                os.chmod(launcher_path, st.st_mode | 0o755)
            except Exception:
                pass

            decky.logger.info(f"Adding '{display_name}' ({launcher_path}) to Steam via IPC")

            # 1. Use steamos-add-to-steam if available (official SteamOS IPC)
            steamos_add = "/usr/bin/steamos-add-to-steam"
            added = False
            if os.path.exists(steamos_add):
                try:
                    res = await asyncio.to_thread(
                        subprocess.run,
                        [steamos_add, launcher_path],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if res.returncode == 0:
                        added = True
                except Exception as e:
                    decky.logger.warning(f"steamos-add-to-steam call failed: {e}")

            # 2. Fallback to steam:// IPC protocol
            if not added:
                import urllib.parse
                import shutil
                encoded = urllib.parse.quote(launcher_path, safe='')
                url = f"steam://addnonsteamgame/{encoded}"
                if shutil.which("steam"):
                    try:
                        subprocess.Popen(
                            ["steam", url],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                            start_new_session=True
                        )
                        added = True
                    except Exception as e:
                        decky.logger.warning(f"steam url IPC error: {e}")

            return {
                "success": True,
                "name": display_name,
                "executable": launcher_path
            }
        except Exception as e:
            decky.logger.error(f"Failed to add to Steam {launcher_path}: {e}")
            return {"success": False, "error": str(e)}

    async def uninstall_package(self, package_id: str, delete_files: bool = True) -> Dict[str, Any]:
        """Delete package folder from disk and remove from registry."""
        if not self.package_db:
            return {"success": False, "error": "Database not initialized."}
        success = self.package_db.remove_package(package_id, delete_files)
        return {"success": success}

    async def check_all_updates(self) -> List[Dict[str, Any]]:
        """Check all installed packages against latest GitHub releases."""
        if not self.package_db:
            return []

        packages = self.package_db.get_all_packages()
        for pkg in packages:
            repo = pkg.get("repository")
            current_ver = pkg.get("installed_version")
            if not repo:
                continue

            try:
                releases = await self.github_client.fetch_releases(repo)
                if releases:
                    latest_rel = releases[0]
                    latest_tag = latest_rel.get("tag_name", "")
                    has_update = is_newer_version(current_ver, latest_tag)
                    self.package_db.update_package_version_status(pkg["id"], latest_tag, has_update)
                    pkg["latest_version"] = latest_tag
                    pkg["has_update"] = has_update
            except Exception as e:
                decky.logger.warn(f"Failed to check updates for {repo}: {e}")

        return self.package_db.get_all_packages()

    async def upgrade_package(self, package_id: str) -> Dict[str, Any]:
        """1-Click upgrade: fetch latest release, match asset, download and overwrite."""
        if not self.package_db:
            return {"success": False, "error": "Database not initialized."}

        pkg = self.package_db.get_package(package_id)
        if not pkg:
            return {"success": False, "error": "Package not found."}

        repo = pkg["repository"]
        installed_asset = pkg.get("installed_asset", "")

        try:
            releases = await self.github_client.fetch_releases(repo)
            if not releases:
                return {"success": False, "error": "No releases found on GitHub."}

            latest_rel = releases[0]
            latest_tag = latest_rel["tag_name"]
            matching_asset = find_matching_upgrade_asset(installed_asset, latest_rel.get("assets", []))

            if not matching_asset:
                return {"success": False, "error": "No matching upgrade asset found in latest release."}

            return await self.start_download(
                repo=repo,
                name=pkg.get("name", repo),
                version=latest_tag,
                asset_name=matching_asset["name"],
                download_url=matching_asset["download_url"],
                custom_install_dir=os.path.dirname(pkg["install_path"])
            )
        except Exception as e:
            return {"success": False, "error": f"Upgrade failed: {str(e)}"}

    async def get_settings(self) -> Dict[str, Any]:
        """Retrieve plugin settings."""
        if not self.package_db:
            return {}
        return self.package_db.get_settings()

    async def save_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update and save plugin settings."""
        if not self.package_db:
            return {}
        updated = self.package_db.update_settings(settings)
        if "github_token" in settings:
            self.github_client.set_token(settings["github_token"])
        return {"success": True, "settings": updated}
