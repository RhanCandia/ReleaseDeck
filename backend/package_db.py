import datetime
import json
import os
import shutil
from typing import Dict, List, Optional, Any

DEFAULT_INSTALL_DIR = os.path.expanduser("~/Applications")

def compute_directory_size(directory: str) -> int:
    """Calculate the total size in bytes of all files within a directory."""
    total_size = 0
    if not os.path.exists(directory):
        return 0
    if os.path.isfile(directory):
        return os.path.getsize(directory)
    
    for root, _, files in os.walk(directory):
        for file in files:
            fp = os.path.join(root, file)
            try:
                if not os.path.islink(fp):
                    total_size += os.path.getsize(fp)
            except (OSError, FileNotFoundError):
                pass
    return total_size

class PackageDB:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.db_path = os.path.join(data_dir, "packages.json")
        self.settings_path = os.path.join(data_dir, "settings.json")
        os.makedirs(self.data_dir, exist_ok=True)
        self._ensure_files()

    def _ensure_files(self):
        if not os.path.exists(self.db_path):
            self._save_packages([])
        if not os.path.exists(self.settings_path):
            self._save_settings_data({
                "github_token": "",
                "default_install_dir": DEFAULT_INSTALL_DIR,
                "pinned_repos": [
                    "SirDiabo/GithubLauncher",
                    "Harbour-Masters/Shipwright",
                    "Mr-Wiseguy/N64Recomp"
                ]
            })

    def _load_packages(self) -> List[Dict[str, Any]]:
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("packages", [])
        except Exception:
            return []

    def _save_packages(self, packages: List[Dict[str, Any]]) -> None:
        temp_path = self.db_path + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump({"packages": packages}, f, indent=2)
        os.replace(temp_path, self.db_path)

    def _load_settings_data(self) -> Dict[str, Any]:
        try:
            with open(self.settings_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {
                "github_token": "",
                "default_install_dir": DEFAULT_INSTALL_DIR,
                "pinned_repos": []
            }

    def _save_settings_data(self, settings: Dict[str, Any]) -> None:
        temp_path = self.settings_path + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
        os.replace(temp_path, self.settings_path)

    def get_all_packages(self) -> List[Dict[str, Any]]:
        packages = self._load_packages()
        # Refresh computed folder sizes
        for pkg in packages:
            path = pkg.get("install_path")
            if path and os.path.exists(path):
                pkg["size_bytes"] = compute_directory_size(path)
        return packages

    def get_package(self, package_id: str) -> Optional[Dict[str, Any]]:
        packages = self.get_all_packages()
        for pkg in packages:
            if pkg.get("id") == package_id:
                return pkg
        return None

    def add_or_update_package(
        self,
        repo: str,
        name: str,
        version: str,
        asset_name: str,
        install_path: str
    ) -> Dict[str, Any]:
        packages = self._load_packages()
        pkg_id = repo.lower().replace("/", "-")
        size = compute_directory_size(install_path)
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        package_record = {
            "id": pkg_id,
            "name": name,
            "repository": repo,
            "installed_version": version,
            "latest_version": version,
            "has_update": False,
            "installed_asset": asset_name,
            "install_path": install_path,
            "installed_at": now_iso,
            "size_bytes": size
        }

        updated = False
        for i, pkg in enumerate(packages):
            if pkg.get("id") == pkg_id:
                packages[i] = package_record
                updated = True
                break

        if not updated:
            packages.append(package_record)

        self._save_packages(packages)
        return package_record

    def update_package_version_status(
        self,
        package_id: str,
        latest_version: str,
        has_update: bool
    ) -> None:
        packages = self._load_packages()
        for pkg in packages:
            if pkg.get("id") == package_id:
                pkg["latest_version"] = latest_version
                pkg["has_update"] = has_update
                break
        self._save_packages(packages)

    def remove_package(self, package_id: str, delete_files: bool = True) -> bool:
        packages = self._load_packages()
        pkg_to_remove = None
        new_packages = []

        for pkg in packages:
            if pkg.get("id") == package_id:
                pkg_to_remove = pkg
            else:
                new_packages.append(pkg)

        if not pkg_to_remove:
            return False

        if delete_files and pkg_to_remove.get("install_path"):
            path = pkg_to_remove["install_path"]
            if os.path.exists(path):
                if os.path.isdir(path):
                    shutil.rmtree(path, ignore_errors=True)
                else:
                    try:
                        os.remove(path)
                    except OSError:
                        pass

        self._save_packages(new_packages)
        return True

    def get_settings(self) -> Dict[str, Any]:
        return self._load_settings_data()

    def update_settings(self, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        current = self._load_settings_data()
        current.update(new_settings)
        self._save_settings_data(current)
        return current
