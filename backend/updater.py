import re
from typing import Dict, List, Optional, Any, Tuple

def parse_semver(tag: str) -> Tuple[int, int, int, str]:
    """Extract (major, minor, patch, prerelease) from tag strings like v1.2.3-beta."""
    clean = tag.strip().lstrip("vV")
    match = re.match(r"^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-(.+))?$", clean)
    if not match:
        return (0, 0, 0, clean)
    
    major = int(match.group(1) or 0)
    minor = int(match.group(2) or 0)
    patch = int(match.group(3) or 0)
    prerelease = match.group(4) or ""
    return (major, minor, patch, prerelease)

def is_newer_version(current_tag: str, latest_tag: str) -> bool:
    """Return True if latest_tag is strictly newer than current_tag."""
    if not current_tag or not latest_tag:
        return False
    if current_tag.strip().lower() == latest_tag.strip().lower():
        return False
    
    c_major, c_minor, c_patch, c_pre = parse_semver(current_tag)
    l_major, l_minor, l_patch, l_pre = parse_semver(latest_tag)
    
    if (l_major, l_minor, l_patch) > (c_major, c_minor, c_patch):
        return True
    if (l_major, l_minor, l_patch) < (c_major, c_minor, c_patch):
        return False
    
    # If numeric portions are equal, a release without prerelease suffix is newer than a prerelease
    if c_pre and not l_pre:
        return True
    
    return False

def find_matching_upgrade_asset(
    installed_asset_name: str,
    new_release_assets: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Find the most suitable asset in the new release that corresponds to the
    previously installed package asset (e.g. matching linux/x64/appimage pattern).
    """
    if not new_release_assets:
        return None
    
    if not installed_asset_name:
        # Fallback to the first recommended asset
        for asset in new_release_assets:
            if asset.get("is_recommended"):
                return asset
        return new_release_assets[0]

    # Exact filename match
    for asset in new_release_assets:
        if asset.get("name") == installed_asset_name:
            return asset

    # Pattern match based on extension and keywords
    orig_lower = installed_asset_name.lower()
    
    # Detect target packaging type
    is_appimage = ".appimage" in orig_lower
    is_tar_gz = ".tar.gz" in orig_lower or ".tgz" in orig_lower
    is_tar_xz = ".tar.xz" in orig_lower
    is_zip = ".zip" in orig_lower
    has_linux = "linux" in orig_lower
    has_x64 = "x64" in orig_lower or "x86_64" in orig_lower or "amd64" in orig_lower

    best_asset = None
    best_score = -1

    for asset in new_release_assets:
        name_lower = asset.get("name", "").lower()
        score = 0

        if is_appimage and ".appimage" in name_lower:
            score += 10
        if is_tar_gz and (".tar.gz" in name_lower or ".tgz" in name_lower):
            score += 10
        if is_tar_xz and ".tar.xz" in name_lower:
            score += 10
        if is_zip and ".zip" in name_lower:
            score += 8
        if has_linux and "linux" in name_lower:
            score += 5
        if has_x64 and ("x64" in name_lower or "x86_64" in name_lower or "amd64" in name_lower):
            score += 3
        if asset.get("is_recommended"):
            score += 2

        if score > best_score:
            best_score = score
            best_asset = asset

    return best_asset if best_score > 0 else (new_release_assets[0] if new_release_assets else None)
