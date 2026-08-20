import asyncio
import os
import shutil
import stat
import time
import zipfile
import tarfile
import ssl
import urllib.request
import urllib.error
from typing import Callable, Optional, List, Dict, Any

try:
    from .version import get_plugin_version
except ImportError:
    from version import get_plugin_version

CHUNK_SIZE = 64 * 1024  # 64 KB chunks

def get_ssl_context() -> ssl.SSLContext:
    """Create a verified SSL context with system CA paths, or fallback safely if SteamOS CA paths are missing."""
    ca_paths = [
        "/etc/ssl/certs/ca-certificates.crt",
        "/etc/pki/tls/certs/ca-bundle.crt",
        "/etc/ssl/ca-bundle.pem",
        "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem",
    ]
    try:
        ctx = ssl.create_default_context()
        for ca_path in ca_paths:
            if os.path.exists(ca_path):
                try:
                    ctx.load_verify_locations(cafile=ca_path)
                    return ctx
                except Exception:
                    pass
        return ctx
    except Exception:
        return ssl._create_unverified_context()

class DownloadCancelledError(Exception):
    pass

class ExtractionError(Exception):
    pass

def sanitize_extract_path(target_dir: str, member_path: str) -> str:
    """Prevent Zip Slip / Directory Traversal attacks."""
    resolved_target = os.path.realpath(target_dir)
    resolved_dest = os.path.realpath(os.path.join(resolved_target, member_path))
    if not (resolved_dest == resolved_target or resolved_dest.startswith(resolved_target + os.sep)):
        raise ExtractionError(f"Attempted path traversal in archive member: {member_path}")
    return resolved_dest

def is_elf_executable(filepath: str) -> bool:
    """Check if a file has an ELF binary header (\x7fELF)."""
    try:
        if not os.path.isfile(filepath):
            return False
        with open(filepath, "rb") as f:
            header = f.read(4)
            return header == b"\x7fELF"
    except Exception:
        return False

def make_executable(filepath: str) -> None:
    """Grant executable permissions (chmod +x / 0o755) to binaries, shell scripts, and AppImages."""
    try:
        current_stat = os.stat(filepath)
        os.chmod(filepath, current_stat.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    except Exception:
        pass

def inspect_and_mark_executables(target_dir: str) -> None:
    """Scan extracted directory and ensure all ELF binaries, scripts, and AppImages are executable."""
    for root, _, files in os.walk(target_dir):
        for file in files:
            full_path = os.path.join(root, file)
            if file.endswith((".AppImage", ".sh", ".bin")) or is_elf_executable(full_path):
                make_executable(full_path)

def find_executable(install_path: str) -> Optional[str]:
    """Locate the best executable (AppImage, script, binary, ELF) inside the package installation directory."""
    if not os.path.exists(install_path):
        return None
    if os.path.isfile(install_path):
        if os.access(install_path, os.X_OK) or is_elf_executable(install_path):
            make_executable(install_path)
            return install_path

    if os.path.isdir(install_path):
        # 1. Search for .AppImage
        for f in sorted(os.listdir(install_path)):
            full = os.path.join(install_path, f)
            if os.path.isfile(full) and f.endswith(".AppImage"):
                make_executable(full)
                return full

        # 2. Search for shell script launchers (.sh)
        for f in sorted(os.listdir(install_path)):
            full = os.path.join(install_path, f)
            if os.path.isfile(full) and f.endswith(".sh"):
                make_executable(full)
                return full

        # 3. Search for root executables, .bin, or ELF binaries
        for f in sorted(os.listdir(install_path)):
            full = os.path.join(install_path, f)
            if os.path.isfile(full) and not f.startswith(".") and not f.endswith((".dll", ".so", ".json", ".txt", ".md", ".png", ".jpg", ".svg", ".log", ".ttf", ".rcss")):
                if f.lower().endswith(".exe"):
                    return full
                if f.endswith(".bin") or is_elf_executable(full) or os.access(full, os.X_OK):
                    make_executable(full)
                    return full

        # 4. Recursively check subdirectories
        for root, _, files in os.walk(install_path):
            for f in sorted(files):
                full = os.path.join(root, f)
                if f.startswith(".") or f.endswith((".dll", ".so", ".json", ".txt", ".md", ".png", ".jpg", ".svg", ".log", ".ttf", ".rcss")):
                    continue
                if f.lower().endswith(".exe"):
                    return full
                if f.endswith(".AppImage") or f.endswith(".sh") or f.endswith(".bin") or is_elf_executable(full) or os.access(full, os.X_OK):
                    make_executable(full)
                    return full

def _is_archive_file(filepath: str) -> bool:
    lower = filepath.lower()
    return (
        lower.endswith(".zip")
        or lower.endswith(".tar.gz")
        or lower.endswith(".tgz")
        or lower.endswith(".tar.xz")
        or lower.endswith(".tar.bz2")
        or lower.endswith(".tar")
    )

def _extract_single(archive_path: str, target_dir: str) -> None:
    os.makedirs(target_dir, exist_ok=True)
    filename_lower = os.path.basename(archive_path).lower()

    # Standalone AppImage or raw binary
    if filename_lower.endswith(".appimage") or filename_lower.endswith(".bin"):
        dest_file = os.path.join(target_dir, os.path.basename(archive_path))
        shutil.copy2(archive_path, dest_file)
        make_executable(dest_file)
        return

    # ZIP Archives
    if filename_lower.endswith(".zip"):
        with zipfile.ZipFile(archive_path, "r") as zf:
            for member in zf.infolist():
                dest_path = sanitize_extract_path(target_dir, member.filename)
                if member.is_dir():
                    os.makedirs(dest_path, exist_ok=True)
                else:
                    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                    with zf.open(member) as source, open(dest_path, "wb") as target:
                        shutil.copyfileobj(source, target)
                    if member.external_attr > 0:
                        mode = (member.external_attr >> 16) & 0o777
                        if mode > 0:
                            try:
                                os.chmod(dest_path, mode)
                            except Exception:
                                pass

    # TAR Archives (.tar.gz, .tgz, .tar.xz, .tar.bz2, .tar)
    elif (
        filename_lower.endswith(".tar.gz")
        or filename_lower.endswith(".tgz")
        or filename_lower.endswith(".tar.xz")
        or filename_lower.endswith(".tar.bz2")
        or filename_lower.endswith(".tar")
    ):
        with tarfile.open(archive_path, "r:*") as tf:
            for member in tf.getmembers():
                dest_path = sanitize_extract_path(target_dir, member.name)
                if member.isdir():
                    os.makedirs(dest_path, exist_ok=True)
                elif member.isfile():
                    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                    extracted_f = tf.extractfile(member)
                    if extracted_f:
                        with open(dest_path, "wb") as target:
                            shutil.copyfileobj(extracted_f, target)
                        try:
                            os.chmod(dest_path, member.mode & 0o777)
                        except Exception:
                            pass
    else:
        # If not an archive, copy directly as a standalone file
        dest_file = os.path.join(target_dir, os.path.basename(archive_path))
        shutil.copy2(archive_path, dest_file)

class Downloader:
    def __init__(self):
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def _sync_download(self, url: str, dest_path: str, progress_cb: Optional[Callable[[float, float, int, int], None]] = None) -> None:
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        ctx = get_ssl_context()
        headers = {
            "User-Agent": f"SideDeck-SteamDeck-Plugin/{get_plugin_version()}",
            "Accept": "application/octet-stream, */*",
        }
        req = urllib.request.Request(url, headers=headers)

        try:
            try:
                response = urllib.request.urlopen(req, timeout=30, context=ctx)
            except urllib.error.URLError as url_err:
                if "CERTIFICATE_VERIFY_FAILED" in str(url_err):
                    unverified_ctx = ssl._create_unverified_context()
                    response = urllib.request.urlopen(req, timeout=30, context=unverified_ctx)
                else:
                    raise url_err

            with response, open(dest_path, "wb") as out_file:
                total_size = int(response.headers.get("Content-Length", 0))
                downloaded = 0
                start_time = time.time()
                last_time = start_time

                while True:
                    if self._is_cancelled:
                        raise DownloadCancelledError("Download cancelled by user.")

                    chunk = response.read(CHUNK_SIZE)
                    if not chunk:
                        break

                    out_file.write(chunk)
                    downloaded += len(chunk)

                    now = time.time()
                    if now - last_time >= 0.15 or (total_size and downloaded == total_size):
                        elapsed = now - start_time
                        speed = (downloaded / (1024 * 1024)) / elapsed if elapsed > 0 else 0.0
                        percent = (downloaded / total_size * 100.0) if total_size > 0 else 0.0
                        if progress_cb:
                            progress_cb(percent, speed, downloaded, total_size)
                        last_time = now

        except urllib.error.URLError as e:
            if os.path.exists(dest_path):
                os.remove(dest_path)
            raise e
        except DownloadCancelledError:
            if os.path.exists(dest_path):
                os.remove(dest_path)
            raise

    async def download_file(self, url: str, dest_path: str, progress_cb: Optional[Callable[[float, float, int, int], None]] = None) -> None:
        self._is_cancelled = False
        await asyncio.to_thread(self._sync_download, url, dest_path, progress_cb)

    @staticmethod
    def extract_archive(archive_path: str, target_dir: str) -> None:
        """Extract an archive (.zip, .tar.gz, etc.) and unpack any nested archives recursively."""
        _extract_single(archive_path, target_dir)

        # Unpack nested archives (e.g. tar.gz packed inside a zip)
        for _ in range(3):
            nested_archives = []
            for root, _, files in os.walk(target_dir):
                for f in files:
                    fp = os.path.join(root, f)
                    if _is_archive_file(fp):
                        nested_archives.append(fp)

            if not nested_archives:
                break

            for nested in nested_archives:
                nested_dir = os.path.dirname(nested)
                try:
                    _extract_single(nested, nested_dir)
                    if os.path.exists(nested):
                        os.remove(nested)
                except Exception as e:
                    import decky
                    decky.logger.warning(f"Failed to unpack nested archive {nested}: {e}")

        # Inspect whole extracted folder and apply chmod +x on any ELF binaries or scripts
        inspect_and_mark_executables(target_dir)

def create_app_launcher(install_path: str, display_name: str, target_exe: Optional[str] = None) -> Optional[str]:
    """
    Finds the target executable in install_path and ensures a clean launcher named after
    display_name exists so that Steam automatically names the shortcut cleanly.
    """
    exe_path = target_exe or find_executable(install_path)
    if not exe_path or not os.path.exists(exe_path):
        return None

    clean_name = "".join(c for c in display_name if c.isalnum() or c in (" ", "-", "_")).strip()
    if not clean_name:
        clean_name = os.path.basename(install_path)

    # If the executable is an AppImage, Windows .exe, or already named with the clean name, return it directly
    base = os.path.basename(exe_path)
    if base.lower() == clean_name.lower().replace(" ", "") or base.lower().endswith((".appimage", ".exe")):
        return exe_path

    # Create an executable launcher script named after the app
    safe_name = clean_name.replace(" ", "_")
    launcher_path = os.path.join(install_path, safe_name)
    try:
        rel_exe = os.path.relpath(exe_path, install_path)
        script_content = (
            "#!/bin/bash\n"
            "DIR=\"$(cd \"$(dirname \"$(readlink -f \"$0\")\")\" && pwd)\"\n"
            "cd \"$DIR\"\n"
            f"exec \"./{rel_exe}\" \"$@\"\n"
        )
        with open(launcher_path, "w") as f:
            f.write(script_content)
        st = os.stat(launcher_path)
        os.chmod(launcher_path, st.st_mode | 0o755)
        return launcher_path
    except Exception:
        return exe_path

def list_executables(install_path: str) -> List[Dict[str, Any]]:
    """
    Scans install_path for all candidate executable files (scripts, binaries, AppImages)
    and returns a list sorted with recommended/default first.
    """
    if not os.path.isdir(install_path):
        return []

    found = []
    default_exe = find_executable(install_path)

    for root, dirs, files in os.walk(install_path):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, install_path)

            lower = f.lower()
            if (
                f.startswith(".")
                or ".so." in lower
                or lower.endswith((".dll", ".so", ".json", ".txt", ".md", ".png", ".jpg", ".svg", ".log", ".ttf", ".rcss", ".toml", ".yaml", ".yml", ".ini"))
                or (lower.startswith("lib") and ".so" in lower)
            ):
                continue

            is_exec = False
            if lower.endswith((".appimage", ".sh", ".bin", ".x86_64", ".exe")):
                is_exec = True
            elif is_elf_executable(full_path):
                is_exec = True

            if is_exec:
                is_default = (os.path.abspath(full_path) == os.path.abspath(default_exe)) if default_exe else False
                found.append({
                    "path": full_path,
                    "rel_path": rel_path,
                    "filename": f,
                    "is_default": is_default
                })

    def sort_key(item):
        score = 0
        if item["is_default"]:
            score -= 100
        if "/" not in item["rel_path"]:
            score -= 20
        if item["filename"].endswith((".sh", ".AppImage")):
            score -= 10
        return (score, item["rel_path"])

    found.sort(key=sort_key)
    return found

