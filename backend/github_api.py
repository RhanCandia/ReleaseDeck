import asyncio
import json
import re
import urllib.request
import urllib.error
from typing import Dict, List, Optional, Any

USER_AGENT = "ReleaseDeck-SteamDeck-Plugin/0.1.0"

LINUX_MATCH_KEYWORDS = ["linux", "x86_64", "x64", "appimage", "tar.gz", "tgz", "tar.xz"]
NON_LINUX_KEYWORDS = ["win32", "win64", "windows", ".exe", ".msi", ".dmg", ".pkg", "darwin", "macos", "android", ".apk"]

def is_linux_recommended(asset_name: str) -> bool:
    """Determine if a release asset is suitable/recommended for Steam Deck / SteamOS."""
    name_lower = asset_name.lower()
    
    # Check if explicitly non-Linux
    if any(keyword in name_lower for keyword in NON_LINUX_KEYWORDS):
        return False
    
    # Check if it has Linux indicators or archive extensions
    if any(keyword in name_lower for keyword in LINUX_MATCH_KEYWORDS):
        return True
        
    # Generic archives (.zip / .tar.gz) without explicit OS tag may still be portable
    if name_lower.endswith(".zip") or name_lower.endswith(".tar.gz") or name_lower.endswith(".tar.xz"):
        return True
        
    return False

class GitHubAPIError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, is_rate_limit: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.is_rate_limit = is_rate_limit

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token.strip() if token else None

    def set_token(self, token: Optional[str]) -> None:
        self.token = token.strip() if token else None

    def _sync_fetch_releases(self, repo: str) -> List[Dict[str, Any]]:
        # Validate owner/repo
        repo = repo.strip().strip("/")
        if not re.match(r"^[\w\.\-]+/[\w\.\-]+$", repo):
            raise GitHubAPIError(f"Invalid repository format '{repo}'. Expected 'owner/repo'.")

        url = f"https://api.github.com/repos/{repo}/releases?per_page=30"
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/vnd.github.v3+json"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"

        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                status = response.getcode()
                raw_data = response.read().decode("utf-8")
                releases_json = json.loads(raw_data)
                
                parsed_releases = []
                for rel in releases_json:
                    assets = []
                    for asset in rel.get("assets", []):
                        asset_name = asset.get("name", "")
                        assets.append({
                            "id": asset.get("id"),
                            "name": asset_name,
                            "size": asset.get("size", 0),
                            "download_url": asset.get("browser_download_url"),
                            "content_type": asset.get("content_type", ""),
                            "download_count": asset.get("download_count", 0),
                            "is_recommended": is_linux_recommended(asset_name)
                        })
                    
                    # Sort assets so recommended ones appear first
                    assets.sort(key=lambda a: (not a["is_recommended"], a["name"]))

                    parsed_releases.append({
                        "id": rel.get("id"),
                        "tag_name": rel.get("tag_name", ""),
                        "name": rel.get("name") or rel.get("tag_name", ""),
                        "prerelease": rel.get("prerelease", False),
                        "draft": rel.get("draft", False),
                        "published_at": rel.get("published_at", ""),
                        "body": rel.get("body", ""),
                        "html_url": rel.get("html_url", ""),
                        "assets": assets
                    })
                return parsed_releases

        except urllib.error.HTTPError as e:
            remaining = e.headers.get("x-ratelimit-remaining", "1")
            is_rate_limit = (e.code == 403 and remaining == "0") or "rate limit" in str(e).lower()
            if is_rate_limit:
                raise GitHubAPIError(
                    "GitHub API rate limit exceeded. Please add a Personal Access Token in Settings.",
                    status_code=403,
                    is_rate_limit=True
                )
            elif e.code == 404:
                raise GitHubAPIError(f"Repository '{repo}' not found on GitHub.", status_code=404)
            else:
                raise GitHubAPIError(f"GitHub API Error: {e.code} {e.reason}", status_code=e.code)
        except urllib.error.URLError as e:
            raise GitHubAPIError(f"Network connection failed: {e.reason}")
        except Exception as e:
            raise GitHubAPIError(f"Unexpected error querying GitHub: {str(e)}")

    async def fetch_releases(self, repo: str) -> List[Dict[str, Any]]:
        return await asyncio.to_thread(self._sync_fetch_releases, repo)
