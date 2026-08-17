import asyncio
import os
import shutil
import stat
import time
import zipfile
import tarfile
import urllib.request
from typing import Callable, Optional

CHUNK_SIZE = 64 * 1024  # 64 KB chunks

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
            is_executable = False
            
            if file.endswith(".AppImage") or file.endswith(".sh") or file.endswith(".bin"):
                is_executable = True
            else:
                # Check ELF magic number (\x7fELF)
                try:
                    with open(full_path, "rb") as f:
                        header = f.read(4)
                        if header == b"\x7fELF":
                            is_executable = True
                except Exception:
                    pass
            
            if is_executable:
                make_executable(full_path)

class Downloader:
    def __init__(self):
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def _sync_download(
        self,
        url: str,
        dest_path: str,
        progress_cb: Optional[Callable[[float, float, int, int], None]] = None
    ) -> None:
        headers = {
            "User-Agent": "ReleaseDeck-SteamDeck-Plugin/0.1.0"
        }
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=30) as response:
            total_bytes = int(response.headers.get("Content-Length", 0))
            downloaded = 0
            start_time = time.time()
            last_report_time = start_time
            
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, "wb") as f:
                while True:
                    if self._is_cancelled:
                        raise DownloadCancelledError("Download was cancelled by user.")
                    
                    chunk = response.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    
                    f.write(chunk)
                    downloaded += len(chunk)
                    now = time.time()
                    
                    if progress_cb and (now - last_report_time >= 0.15 or (total_bytes > 0 and downloaded >= total_bytes)):
                        elapsed = now - start_time
                        speed_mb_s = (downloaded / (1024 * 1024)) / elapsed if elapsed > 0 else 0.0
                        percent = (downloaded / total_bytes * 100.0) if total_bytes > 0 else 0.0
                        progress_cb(round(percent, 1), round(speed_mb_s, 2), downloaded, total_bytes)
                        last_report_time = now

    async def download_file(
        self,
        url: str,
        dest_path: str,
        progress_cb: Optional[Callable[[float, float, int, int], None]] = None
    ) -> None:
        self._is_cancelled = False
        await asyncio.to_thread(self._sync_download, url, dest_path, progress_cb)

    @staticmethod
    def extract_archive(archive_path: str, target_dir: str) -> None:
        """Extract an archive (.zip, .tar.gz, .tgz, .tar.xz, .tar.bz2) or handle standalone AppImages."""
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
                        # Preserve unix permissions stored in zip if present
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
                            # Set tar permissions
                            try:
                                os.chmod(dest_path, member.mode & 0o777)
                            except Exception:
                                pass
        else:
            # If not an archive, copy directly as a standalone file
            dest_file = os.path.join(target_dir, os.path.basename(archive_path))
            shutil.copy2(archive_path, dest_file)

        # Inspect whole extracted folder and apply chmod +x on any ELF binaries or scripts
        inspect_and_mark_executables(target_dir)
